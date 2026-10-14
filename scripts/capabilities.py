#!/usr/bin/env python3
"""Optional voice configuration. status/resolve work offline; personal config lives outside the skill install directory."""
import argparse
from contextlib import contextmanager
import copy
import hashlib
import json
import os
from pathlib import Path
import platform
import re
import shutil
import subprocess
import sys
import tempfile
import time

ROOT = Path(__file__).resolve().parents[1]
if __name__ == "__main__":
    sys.modules.setdefault("capabilities", sys.modules[__name__])


class ConfigError(ValueError):
    pass


def config_path(explicit=None):
    if explicit:
        return Path(explicit).expanduser().resolve()
    if os.getenv('HUASHU_CONFIG_HOME'):
        return Path(os.environ['HUASHU_CONFIG_HOME']).expanduser() / 'media.json'
    if os.name == 'nt':
        return Path(os.environ.get('APPDATA', Path.home() / 'AppData/Roaming')) / 'huashu/media.json'
    return Path(os.environ.get('XDG_CONFIG_HOME', Path.home() / '.config')) / 'huashu/media.json'


def read_json(path, missing=False):
    if missing and not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding='utf-8'))
    except (OSError, ValueError) as e:
        raise ConfigError(f'无法读取配置：{path.name}（{type(e).__name__}）') from None
    if not isinstance(data, dict):
        raise ConfigError('配置必须是JSON对象')
    return data


def merge(base, patch):
    result = copy.deepcopy(base)
    for key, value in patch.items():
        result[key] = merge(result[key], value) if isinstance(value, dict) and isinstance(result.get(key), dict) else copy.deepcopy(value)
    return result


def validate(data, schema=None, where='config'):
    # This package's schema uses only the JSON Schema keywords below; no claim of a general-purpose schema interpreter.
    schema = schema or read_json(ROOT / 'schemas/media.schema.json')
    types = {'object': dict, 'string': str, 'integer': int, 'boolean': bool}
    typ = schema.get('type')
    if typ and (not isinstance(data, types[typ]) or (typ == 'integer' and isinstance(data, bool))):
        raise ConfigError(f'{where}类型错误')
    if 'enum' in schema and data not in schema['enum']:
        raise ConfigError(f'{where}不是支持的选项')
    if isinstance(data, int) and not isinstance(data, bool):
        if data < schema.get('minimum', data) or data > schema.get('maximum', data):
            raise ConfigError(f'{where}超出范围')
    if isinstance(data, str) and 'pattern' in schema and not re.fullmatch(schema['pattern'], data):
        raise ConfigError(f'{where}格式不正确')
    if isinstance(data, dict):
        for key in schema.get('required', []):
            if key not in data:
                raise ConfigError(f'{where}.{key}缺失')
        for key, value in data.items():
            child = schema.get('properties', {}).get(key, schema.get('additionalProperties', False))
            if child is False:
                raise ConfigError(f'{where}.{key}是不支持的字段')
            if isinstance(child, dict):
                validate(value, child, f'{where}.{key}')


def project_patch(data):
    validate(data)
    if set(data) - {'schema_version', 'revision', 'preferences', 'policy', 'onboarding'}:
        raise ConfigError('项目配置不能设置凭证绑定、网络策略或供应商底层参数')
    if any(v != 'deny' for v in data.get('policy', {}).values()):
        raise ConfigError('项目policy只能收紧为deny，不能授予云调用、付费或训练权限')
    if 'voice_ref' in data.get('preferences', {}).get('voice', {}):
        raise ConfigError('私人音色绑定保留在用户配置；本次可用--voice选择')
    return data


def effective(explicit=None, project=None):
    defaults = read_json(ROOT / 'defaults/media.json')
    user_path = config_path(explicit)
    user = read_json(user_path, missing=True)
    validate(user)
    result = merge(defaults, user)
    sources = {'defaults': 'defaults/media.json', 'user': str(user_path), 'user_configured': bool(user)}
    origin = {}
    def note(data, label, prefix=''):
        for key, value in data.items():
            name = prefix + key
            if isinstance(value, dict): note(value, label, name + '.')
            elif name.split('.')[0] in ('preferences', 'policy', 'provider_options', 'onboarding'): origin[name] = label
    note(defaults, 'public_default'); note(user, 'user')
    if project:
        pp = Path(project).expanduser().resolve() / '.huashu/media.json'
        patch = project_patch(read_json(pp, missing=True))
        result = merge(result, patch)
        note(patch, 'project')
        sources['project'] = str(pp)
        sources['project_fields'] = sorted(patch)
    validate(result)
    sources['effective_from'] = origin
    return result, sources


@contextmanager
def locked(path):
    path.parent.mkdir(parents=True, exist_ok=True)
    lock_path = path.with_name(path.name + '.lock')
    # Kernel file lock is released on process exit; ownership is not contested by deleting the lock file.
    with lock_path.open('a+b') as lock:
        if os.name == 'nt':
            import msvcrt
            if lock.seek(0, 2) == 0:
                lock.write(b'0'); lock.flush()
            lock.seek(0)
            msvcrt.locking(lock.fileno(), msvcrt.LK_LOCK, 1)
            try:
                yield
            finally:
                lock.seek(0); msvcrt.locking(lock.fileno(), msvcrt.LK_UNLCK, 1)
        else:
            import fcntl
            fcntl.flock(lock, fcntl.LOCK_EX)
            try:
                yield
            finally:
                fcntl.flock(lock, fcntl.LOCK_UN)


def save_patch(path, patch, expected=None, reset=None):
    validate(patch)
    with locked(path):
        old = read_json(path, missing=True)
        validate(old)
        revision = old.get('revision', 0)
        if expected is not None and revision != expected:
            raise ConfigError('配置已被其他进程修改；请重读后重试')
        updated = merge(old, patch)
        if reset:
            # Only public fields may be reset; dynamic path expressions are not evaluated.
            keys = reset.split('.')
            if keys[0] not in {'preferences', 'policy', 'bindings', 'provider_options', 'onboarding'}:
                raise ConfigError('不支持这个reset路径')
            current = updated
            for key in keys[:-1]:
                current = current.get(key, {})
            if isinstance(current, dict):
                current.pop(keys[-1], None)
        updated.update(schema_version=1, revision=revision + 1)
        validate(updated)
        fd, temp = tempfile.mkstemp(dir=path.parent, prefix='.media-')
        try:
            with os.fdopen(fd, 'w', encoding='utf-8') as f:
                json.dump(updated, f, ensure_ascii=False, indent=2); f.write('\n')
            if os.name != 'nt':
                os.chmod(temp, 0o600)
            os.replace(temp, path)
        finally:
            if os.path.exists(temp):
                os.unlink(temp)
        return {'status': 'saved', 'revision': updated['revision'], 'path': str(path)}


def credentials(config):
    binding = config['bindings']['volcengine']
    names = (binding['appid_env'], binding['token_env'])
    values = {n: os.getenv(n) for n in names}
    env_path = os.getenv('KOUBO_ENV') or binding.get('env_file')
    if env_path and not all(values.values()):
        path = Path(env_path).expanduser()
        if path.is_file():
            for line in path.read_text(encoding='utf-8').splitlines():
                line = line.strip()
                if line.startswith('export '):
                    line = line[7:]
                key, sep, value = line.partition('=')
                if sep and key.strip() in names and not values[key.strip()]:
                    values[key.strip()] = value.strip().strip('\"\'')
    return tuple(values[n] for n in names)


def speaker(config, explicit=None):
    ref = explicit or config['preferences']['voice'].get('voice_ref', 'default')
    voice = config['bindings']['voices'].get(ref)
    if voice and voice.get('speaker_id'):
        return voice['speaker_id']
    if explicit and not voice:
        # Treat as a registry alias or platform ID from a legacy command.
        voice = {'entry': explicit}
    voice = voice or {'entry': 'default'}
    registry_path = Path(voice.get('registry_file') or config['bindings']['volcengine']['registry_file']).expanduser()
    registry = read_json(registry_path, missing=True)
    entry = voice.get('entry', 'default')
    if entry == 'default':
        entry = registry.get('default') or os.getenv('VOLC_KOUBO_DEFAULT_SPEAKER')
    found = registry.get('voices', {}).get(entry, {})
    return found.get('speaker_id') or (entry if isinstance(entry, str) and entry.startswith('S_') else None)


def resolve(config, mode=None, audio=None, operation='synthesize', grants=(), voice=None):
    chosen = mode or config['preferences']['voice']['mode']
    if audio and mode is None:
        chosen = 'provided'
    result = {'capability': 'voice', 'mode': chosen, 'operation': operation, 'status': 'ready', 'reasons': []}
    if chosen == 'off':
        return dict(result, status='skipped', reasons=['语音已禁用，不生成音频'])
    if chosen == 'unconfigured':
        return dict(result, status='needs_configuration', prompt=config['onboarding']['voice'] != 'manual',
                    reasons=['选择现有录音、系统声音或已绑定的复刻音色；也可本次跳过'])
    if chosen == 'provided':
        if not audio or not Path(audio).expanduser().is_file():
            return dict(result, status='needs_input', reasons=['需要提供已有音频路径'])
        return result
    if chosen == 'system':
        missing = [x for x in ('say', 'ffmpeg', 'ffprobe') if not shutil.which(x)]
        if platform.system() != 'Darwin' or missing:
            return dict(result, status='unavailable', reasons=['系统声音目前仅支持macOS，需已安装say/ffmpeg/ffprobe'])
        return dict(result, provider='macos')
    if chosen != 'clone':
        raise ConfigError('不支持的声音方式')
    result['provider'] = 'volcengine'
    if config['preferences']['voice'].get('provider', 'volcengine') != 'volcengine':
        return dict(result, status='unavailable', reasons=['P1复刻后端仅支持volcengine'])
    needs = ['cloud'] + ([] if operation == 'check' else ['paid_api'])
    if operation == 'train':
        needs.append('voice_training')
    denied = [key for key in needs if config['policy'][key] == 'deny']
    if denied:
        return dict(result, status='blocked', reasons=['显式禁止：' + ', '.join(denied)])
    pending = [key for key in needs if config['policy'][key] != 'allow' and key not in grants]
    if pending:
        return dict(result, status='needs_permission', reasons=['需要本次授权：' + ', '.join(pending)])
    appid, token = credentials(config)
    if not appid or not token:
        result['reasons'].append('缺少所选供应商凭证；仅检查已指定环境/凭证文件')
    if operation == 'synthesize' and not speaker(config, voice):
        result['reasons'].append('没有可用音色绑定；可绑定已有ID，无须重训')
    missing = [x for x in ('ffmpeg', 'ffprobe') if not shutil.which(x)]
    if missing:
        result['reasons'].append('缺少本地依赖：' + ', '.join(missing))
    import importlib.util
    if importlib.util.find_spec('requests') is None:
        result['reasons'].append('火山适配器需要requests；基础配置与已有音频不需要')
    result['status'] = 'unavailable' if result['reasons'] else 'configured_unverified'
    return result


def inspect_audio(path):
    if not shutil.which('ffprobe'):
        raise ConfigError('音频验收需要ffprobe')
    proc = subprocess.run(['ffprobe', '-v', 'error', '-show_entries',
                           'stream=codec_type,codec_name,sample_rate,channels:format=duration', '-of', 'json', str(path)],
                          capture_output=True, text=True)
    if proc.returncode:
        raise ConfigError('输出不是可解码音频')
    data = json.loads(proc.stdout)
    streams = [s for s in data.get('streams', []) if s.get('codec_type') == 'audio']
    duration = float(data.get('format', {}).get('duration', 0))
    if not streams or duration <= 0:
        raise ConfigError('输出没有有效音轨或时长')
    return {'duration': duration, **streams[0], 'sha256': hashlib.sha256(Path(path).read_bytes()).hexdigest()}


def system_voice_for(text, configured=None):
    if configured:
        return configured
    # macOS default English voice may return near-silent audio for Chinese; select only from installed voices, no download.
    if re.search(r"[\u4e00-\u9fff]", text):
        result = subprocess.run(['say', '-v', '?'], capture_output=True, text=True, check=True)
        names = [m.group(1).strip() for line in result.stdout.splitlines()
                 if (m := re.match(r"(.+?)\s+zh_CN\s+#", line))]
        if not names:
            raise ConfigError('没有已安装的普通话系统声音；请选择已有音色或导入录音')
        return 'Tingting' if 'Tingting' in names else names[0]
    return None


def run_say(args, config):
    grants = [name for name in ('cloud', 'paid_api') if getattr(args, 'allow_' + name, False)]
    result = resolve(config, mode=args.mode, grants=grants, voice=args.voice)
    if result['status'] not in ('ready', 'configured_unverified'):
        print(json.dumps(result, ensure_ascii=False)); raise SystemExit(2)
    if not args.text.strip():
        raise ConfigError('合成文本不能为空')
    out = Path(args.out).expanduser()
    if out.exists():
        raise ConfigError('输出文件已存在，请指定新文件；保留已选音轨')
    if args.speech_rate is not None and not -50 <= args.speech_rate <= 100:
        raise ConfigError('火山语速须在-50~100之间')
    if args.fit is not None and args.fit <= 0:
        raise ConfigError('--fit必须为正数')
    if args.match and not Path(args.match).is_file():
        raise ConfigError('找不到响度参考音频')
    requested_format = args.format
    out.parent.mkdir(parents=True, exist_ok=True)
    import koubo
    # Temp workspace prevents a failed or partial response from polluting the final output.
    with tempfile.TemporaryDirectory(prefix='voice-', dir=out.parent) as temp:
        staged = Path(temp) / (out.name + '.wav' if requested_format == 'pcm' else out.name)
        if result['mode'] == 'system':
            if args.model or args.speech_rate is not None or args.no_fidelity:
                raise ConfigError('火山模型/语速参数不适用于系统声音')
            if args.format != 'wav' or args.sample_rate != 48000:
                raise ConfigError('P1系统声音输出固定为48kHz WAV')
            source = Path(temp) / 'system.aiff'
            cmd = ['say', '-o', str(source)]
            system_voice = system_voice_for(args.text, args.voice or config['preferences']['voice'].get('system_voice'))
            if system_voice:
                cmd += ['-v', system_voice]
            subprocess.run(cmd, input=args.text, text=True, check=True, capture_output=True)
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(source), '-ar', '48000', str(staged)], check=True)
            if args.fit:
                koubo.fit_duration(staged, args.fit)
            target_db = koubo.mean_volume(args.match, args.match_ss, args.match_t) if args.match else args.loudness
            if target_db is not None:
                koubo.match_loudness(staged, target_db)
        else:
            koubo.configure_backend(config)
            args = copy.copy(args)
            args.out = str(staged)
            # Fit/level/termination checks run on the container audio first, then export raw PCM.
            if requested_format == 'pcm': args.format = 'wav'
            args.voice = speaker(config, args.voice)
            opts = config['provider_options']['volcengine']
            args.model = args.model or opts['model']
            args.speech_rate = opts['speech_rate'] if args.speech_rate is None else args.speech_rate
            args.no_fidelity = not opts['tone_fidelity'] if args.no_fidelity is None else args.no_fidelity
            koubo.cmd_say(args)
        artifact = inspect_audio(staged)
        volume = koubo.mean_volume(staged)
        if artifact['duration'] < 0.12 or volume is None or volume < -60:
            raise ConfigError('合成音频近空或无有效声音，不作为成功产物')
        if args.fit and abs(artifact['duration'] - args.fit) > .05:
            # Keep the diagnostic candidate, but do not treat it as a valid final output.
            candidate = out.with_name(out.stem + '.unfitted' + out.suffix)
            if not candidate.exists():
                shutil.copy2(staged, candidate)
            raise ConfigError('音频未落入目标时长±0.05秒，已保留unfitted候选；未交付为最终音频')
        if requested_format == 'pcm':
            raw = Path(temp) / 'output.pcm'
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(staged), '-ac', '1', '-ar', str(args.sample_rate), '-f', 's16le', str(raw)], check=True)
            shutil.copy2(raw, out)
            artifact.update(format='s16le', channels=1, duration=out.stat().st_size / 2 / args.sample_rate, sha256=hashlib.sha256(out.read_bytes()).hexdigest())
        else:
            shutil.copy2(staged, out)
    artifact.update(path=out.name, provider=result['provider'], mode=result['mode'], generated=True)
    if result['mode'] == 'system':
        artifact['system_voice'] = system_voice or 'system_default'
    if result['mode'] == 'clone':
        artifact['requested_model'] = args.model
    out.with_name(out.name + '.json').write_text(json.dumps(artifact, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'status': 'complete', 'output': str(out), 'duration': artifact['duration']}, ensure_ascii=False))


def main():
    if len(sys.argv) > 1 and sys.argv[1] in ('image-status', 'image-plan', 'accept-image', 'use-image'):
        import images
        return images.main()
    # say/train commands share the original CLI to prevent argument drift between two separate parsers.
    if len(sys.argv) > 1 and sys.argv[1] in ('say', 'train', 'voices'):
        import koubo
        return koubo.main()
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    for name in ('status', 'resolve', 'configure', 'skip', 'reset', 'bind', 'use-audio'):
        p = sub.add_parser(name)
        p.add_argument('--config')
        p.add_argument('--project')
        if name in ('status', 'resolve'):
            p.add_argument('--mode', choices=['off', 'provided', 'system', 'clone'])
            p.add_argument('--audio'); p.add_argument('--explain', action='store_true')
        if name == 'configure':
            p.add_argument('--input', required=True); p.add_argument('--scope', choices=['user', 'project'], default='user')
            p.add_argument('--expected-revision', type=int)
        if name == 'skip':
            p.add_argument('--capability', choices=['voice', 'image'], default='voice')
            p.add_argument('--scope', choices=['task', 'user'], default='task')
        if name == 'reset':
            p.add_argument('--field', default='preferences.voice')
        if name == 'bind':
            p.add_argument('--name', required=True); p.add_argument('--speaker-id', required=True)
            p.add_argument('--default', action='store_true')
        if name == 'use-audio':
            p.add_argument('--audio', required=True); p.add_argument('--out', required=True)
    args = parser.parse_args()
    config, sources = effective(args.config, args.project)
    path = config_path(args.config)
    if args.command in ('status', 'resolve'):
        result = resolve(config, args.mode, args.audio)
        result['revision'] = config.get('revision', 0)
        result['parameters'] = config['provider_options']['volcengine'] if result.get('provider') == 'volcengine' else {}
        if args.explain:
            result['sources'] = sources
        print(json.dumps(result, ensure_ascii=False, indent=2))
    elif args.command == 'configure':
        patch = read_json(Path(args.input))
        if args.scope == 'project':
            if not args.project:
                raise ConfigError('project作用域需要--project')
            path = Path(args.project).expanduser().resolve() / '.huashu/media.json'
            project_patch(patch)
        print(json.dumps(save_patch(path, patch, args.expected_revision), ensure_ascii=False))
    elif args.command == 'skip':
        if args.scope == 'user':
            print(json.dumps(save_patch(path, {'onboarding': {args.capability: 'manual'}, 'preferences': {args.capability: {'mode': 'unconfigured'}}}), ensure_ascii=False))
        else:
            print(json.dumps({'status': 'skipped', 'scope': 'task', 'saved': False}, ensure_ascii=False))
    elif args.command == 'reset':
        print(json.dumps(save_patch(path, {}, reset=args.field), ensure_ascii=False))
    elif args.command == 'bind':
        patch = {'bindings': {'voices': {args.name: {'speaker_id': args.speaker_id}}}}
        if args.default:
            patch['preferences'] = {'voice': {'voice_ref': args.name}}
        print(json.dumps(save_patch(path, patch), ensure_ascii=False))
    elif args.command == 'use-audio':
        source, out = Path(args.audio).expanduser(), Path(args.out).expanduser()
        info = inspect_audio(source)
        if out.exists():
            raise ConfigError('输出已存在，请指定新文件')
        out.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(source, out)
        info.update(path=out.name, generated=False, mode='provided')
        out.with_name(out.name + '.json').write_text(json.dumps(info, ensure_ascii=False, indent=2))
        print(json.dumps({'status': 'complete', 'output': str(out), 'generated': False}, ensure_ascii=False))


if __name__ == '__main__':
    try:
        main()
    except (ConfigError, OSError, subprocess.SubprocessError) as e:
        message = str(e) if isinstance(e, ConfigError) else type(e).__name__
        print(json.dumps({'status': 'error', 'message': message}, ensure_ascii=False), file=sys.stderr)
        raise SystemExit(2)
