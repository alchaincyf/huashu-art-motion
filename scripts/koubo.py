#!/usr/bin/env python3
"""Voiceover: generate/repair video narration using cloned voices.

Underlying service: Volcengine Doubao voice cloning 2.0 (seed-icl-2.0).

  say     Speak text using existing voice, optionally align duration/match loudness
  train   Train a new voice from a real person's recording
  voices  List locally registered voices / query online training status

capabilities.py loads credentials/default voice from personal config outside install directory;
this file keeps compatible say/train/voices entries; base config/system voices do not depend on requests.
"""
import argparse
import base64
import json
import os
import pathlib
import re
import subprocess
import sys
import tempfile
import uuid


HOST = "https://openspeech.bytedance.com"
RES_CLONE = "volc.megatts.voiceclone"             # Train / query
RES_TTS = "seed-icl-2.0"                          # Synthesize
REGISTRY = pathlib.Path.home() / ".koubo" / "voices.json"
MAX_UPLOAD = 10 * 1024 * 1024                     # Reference audio limit (original file, not base64)


# ---------- Infrastructure ----------

ACTIVE_CONFIG = None


def configure_backend(config):
    global ACTIVE_CONFIG, REGISTRY
    ACTIVE_CONFIG = config
    REGISTRY = pathlib.Path(config["bindings"]["volcengine"]["registry_file"]).expanduser()


def load_env():
    from capabilities import credentials, effective
    config = ACTIVE_CONFIG or effective()[0]
    appid, token = credentials(config)
    if not appid or not token:
        sys.exit("缺少凭证；请配置环境变量或明确指定的env_file（不会扫描其他.env）")
    return appid, token


def _session():
    import requests
    from capabilities import effective
    config = ACTIVE_CONFIG or effective()[0]
    session = requests.Session()
    session.trust_env = config["bindings"]["volcengine"]["trust_env"]
    return session


def api(path, resource_id, payload, stream=False, retries=1):
    # Timed-out POST may already be accepted/billed; do not blindly retry with a new request_id.
    import requests
    appid, token = load_env()
    headers = {
        "X-Api-App-Id": appid, "X-Api-Access-Key": token,
        "X-Api-Resource-Id": resource_id, "X-Api-Request-Id": str(uuid.uuid4()),
        "Content-Type": "application/json",
    }
    try:
        return _session().post(HOST + path, headers=headers, json=payload,
                               timeout=300, stream=stream)
    except requests.exceptions.RequestException:
        sys.exit("outcome_unknown：网络请求未确认完成；先核对服务端状态，不自动重复提交")


def registry_load():
    if REGISTRY.is_file():
        return json.loads(REGISTRY.read_text(encoding="utf-8"))
    return {"default": None, "voices": {}}


def registry_save(data):
    REGISTRY.parent.mkdir(parents=True, exist_ok=True)
    REGISTRY.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def resolve_speaker(name_or_id):
    """Accept registered voice name or direct speaker_id. Omitted uses default voice."""
    reg = registry_load()
    if not name_or_id:
        name_or_id = reg.get("default") or os.getenv("VOLC_KOUBO_DEFAULT_SPEAKER")
        if not name_or_id:
            sys.exit("✗ 没指定音色，也没有默认音色。先跑 `koubo.py voices` 看有哪些")
    if name_or_id in reg["voices"]:
        return reg["voices"][name_or_id]["speaker_id"], name_or_id
    return name_or_id, name_or_id


def ffprobe_duration(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True).stdout.strip()
    return float(out) if out else 0.0


def mean_volume(path, ss=None, t=None):
    cmd = ["ffmpeg", "-hide_banner", "-nostats"]
    if ss is not None:
        cmd += ["-ss", str(ss)]
    if t is not None:
        cmd += ["-t", str(t)]
    cmd += ["-i", str(path), "-af", "volumedetect", "-f", "null", "-"]
    err = subprocess.run(cmd, capture_output=True, text=True).stderr
    m = re.search(r"mean_volume:\s*(-?[\d.]+) dB", err)
    return float(m.group(1)) if m else None


# ---------- say ----------

def synthesize(text, speaker, out, fmt="wav", sample_rate=48000,
               model="seed-tts-2.0-expressive", fidelity=True, speech_rate=0):
    req = {
        "text": text,
        "speaker": speaker,
        "audio_params": {"format": fmt, "sample_rate": sample_rate},
        "model": model,
    }
    if fidelity:
        req["tone_fidelity"] = True
    if speech_rate:
        # Measured: effective only in audio_params, silently ignored at req_params top level
        req["audio_params"]["speech_rate"] = int(speech_rate)

    r = api("/api/v3/tts/unidirectional", RES_TTS,
            {"user": {"uid": "koubo"}, "req_params": req}, stream=True)
    if r.status_code != 200:
        sys.exit(f"✗ HTTP {r.status_code} {r.text[:400]}")

    chunks, errs, complete = [], [], False
    for line in r.iter_lines():
        if not line:
            continue
        s = line.decode("utf-8", "ignore")
        if s.startswith("data:"):
            s = s[5:].strip()
        try:
            obj = json.loads(s)
        except ValueError:
            continue
        if obj.get("code") == 20000000:
            complete = True
        if obj.get("data"):
            chunks.append(base64.b64decode(obj["data"]))
        if obj.get("code") not in (None, 0, 20000000):
            errs.append(obj)
    if errs or not chunks or not complete:
        sys.exit("合成失败或返回不完整音频；不提交部分产物")
    pathlib.Path(out).write_bytes(b"".join(chunks))
    return pathlib.Path(out)


def fit_duration(path, target, tol=0.05):
    """Fine-align audio duration with atempo. Do not adjust beyond ±10%, avoiding quality loss."""
    cur = ffprobe_duration(path)
    if not cur or abs(cur - target) <= tol:
        return cur, 1.0
    ratio = cur / target
    if not 0.9 <= ratio <= 1.1:
        return cur, ratio        # Too different: leave decision to caller (usually adjust speech_rate)
    tmp = pathlib.Path(tempfile.mkstemp(suffix=path.suffix)[1])
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(path),
                    "-filter:a", f"atempo={ratio:.6f}", str(tmp)], check=True)
    tmp.replace(path)
    return ffprobe_duration(path), ratio


def match_loudness(path, target_db):
    """Match synthesized loudness to original track to avoid jumps at joins."""
    cur = mean_volume(path)
    if cur is None or target_db is None:
        return None
    gain = target_db - cur
    if abs(gain) < 0.5:
        return 0.0
    tmp = pathlib.Path(tempfile.mkstemp(suffix=path.suffix)[1])
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(path),
                    "-filter:a", f"volume={gain:.2f}dB", str(tmp)], check=True)
    tmp.replace(path)
    return gain


def cmd_say(args):
    speaker, label = resolve_speaker(args.voice)
    out = pathlib.Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)

    # Target loudness: direct dB or reference audio segment (usually original track's corresponding seconds)
    target_db = args.loudness
    if args.match:
        target_db = mean_volume(args.match, args.match_ss, args.match_t)

    speech_rate = args.speech_rate
    for attempt in range(3):
        synthesize(args.text, speaker, out, fmt=args.format, sample_rate=args.sample_rate,
                   model=args.model, fidelity=not args.no_fidelity, speech_rate=speech_rate)
        dur = ffprobe_duration(out)
        if not args.fit:
            break
        ratio = dur / args.fit
        if 0.93 <= ratio <= 1.07:      # Within atempo's lossless range, sufficient
            break
        # speech_rate is absolute, not incremental: rate r means (1 + r/100) speed.
        # Recover duration at rate=0 first, then calculate required target speed.
        base = dur * (1 + speech_rate / 100)
        want = max(-50, min(100, int(round((base / args.fit - 1) * 100))))
        if want == speech_rate:
            break
        speech_rate = want
        print(f"  时长 {dur:.2f}s vs 目标 {args.fit:.2f}s，speech_rate 调到 {speech_rate} 重试")
        if speech_rate <= -50:
            print("  ⚠️ 已到最慢 0.5 倍速——文本字数偏少，塞不满这个坑位，考虑加词")
        elif speech_rate >= 100:
            print("  ⚠️ 已到最快 2 倍速——文本字数偏多，坑位装不下，考虑删词")

    info = [f"{ffprobe_duration(out):.2f}s"]
    if args.fit:
        dur, ratio = fit_duration(out, args.fit)
        info = [f"{dur:.2f}s（目标 {args.fit:.2f}s）"]
        if not 0.9 <= ratio <= 1.1:
            info.append(f"⚠️ 差 {abs(ratio-1)*100:.0f}%，超出 atempo 无损区间，没做拉伸")
    if target_db is not None:
        gain = match_loudness(out, target_db)
        if gain:
            info.append(f"响度 {gain:+.1f}dB → {target_db:.1f}dB")

    return info


# ---------- train ----------

def prepare_audio(src, seconds=None, start=0):
    """Convert to 24k mono; prefer wav, automatically fall back to mp3 above 10MB. Return temporary path."""
    src = pathlib.Path(src)
    for fmt, codec, extra in (("wav", ["-c:a", "pcm_s16le"], []),
                              ("mp3", [], ["-b:a", "192k"]),
                              ("mp3", [], ["-b:a", "96k"])):
        tmp = pathlib.Path(tempfile.mkstemp(suffix=f".{fmt}")[1])
        cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", str(start)]
        if seconds:
            cmd += ["-t", str(seconds)]
        cmd += ["-i", str(src), "-ac", "1", "-ar", "24000"] + codec + extra + [str(tmp)]
        subprocess.run(cmd, check=True)
        if tmp.stat().st_size <= MAX_UPLOAD:
            return tmp, fmt
        tmp.unlink()
    sys.exit("✗ 音频压到 96k mp3 仍超过 10MB，请缩短 --seconds")


def cmd_train(args):
    src = pathlib.Path(args.audio)
    if not src.is_file():
        sys.exit(f"✗ 找不到 {src}")

    # Block common failure: input actually contains only noise; server returns 45001122 no speaker detected
    vol = mean_volume(src, args.start, args.seconds)
    if vol is not None and vol < -36:
        print(f"⚠️ 这段平均电平只有 {vol:.1f} dB，很可能没有人声或人声太弱。")
        print("   先确认这段里真的有人在说话，或换一段、或先做响度归一化。")
        if not args.force:
            sys.exit("   确认没问题就加 --force 再跑一次。")

    audio, fmt = prepare_audio(src, args.seconds, args.start)
    dur = ffprobe_duration(audio)
    size_mb = audio.stat().st_size / 1024 / 1024
    print(f"参考音频：{dur:.0f}s  {fmt}  {size_mb:.1f}MB")

    payload = {
        "speaker_id": args.speaker,
        "audio": {"data": base64.b64encode(audio.read_bytes()).decode(), "format": fmt},
        "source": 2,
        "language": args.language,
        "model_type": 5,                       # 5 = voice cloning 2.0
    }
    if args.reference_text:
        payload["text"] = args.reference_text
    if args.denoise:
        payload["enable_audio_denoise"] = True
    if args.keep_volume:
        payload["disable_volume_normalization"] = True

    r = api("/api/v3/tts/voice_clone", RES_CLONE, payload)
    audio.unlink(missing_ok=True)
    if r.status_code != 200:
        sys.exit(f"✗ HTTP {r.status_code} {r.text[:500]}")
    data = r.json()
    status = data.get("status")
    if status not in (2, 4):
        sys.exit(f"✗ 训练未成功 status={status} {data.get('message','')}")

    reg = registry_load()
    reg["voices"][args.name] = {
        "speaker_id": args.speaker,
        "source": str(src),
        "seconds": round(dur),
        "trained_at": data.get("create_time"),
        "remaining_trainings": data.get("available_training_times"),
    }
    if args.default:
        reg["default"] = args.name
    registry_save(reg)

    print(f"✓ 「{args.name}」训练成功  speaker_id={args.speaker}  "
          f"剩余训练次数 {data.get('available_training_times')}")
    if reg["default"] == args.name:
        print(f"  已设为默认音色")
    demo = data.get("demo_audio")
    if demo:
        print(f"  官方试听（1 小时内有效）：{demo}")


# ---------- voices ----------

def cmd_voices(args):
    reg = registry_load()
    if not reg["voices"]:
        print("本地还没登记任何音色。用 `koubo.py train` 投喂一段录音。")
        print(f"（登记表位置：{REGISTRY}）")
        return
    print(f"默认音色：{reg.get('default') or '(未设)'}\n")
    for name, v in reg["voices"].items():
        mark = "★" if name == reg.get("default") else " "
        print(f"{mark} {name:<24} {v['speaker_id']:<16} {v.get('seconds','?')}s  ← {v.get('source','')}")
    if args.check:
        print("\n查线上状态：")
        for name, v in reg["voices"].items():
            r = api("/api/v3/tts/get_voice", RES_CLONE, {"speaker_id": v["speaker_id"]})
            try:
                st = r.json()
                st = st[0] if isinstance(st, list) else st
                if r.status_code != 200:
                    print(f"  {name:<24} 查询失败 HTTP {r.status_code}：{st.get('message','')}")
                    continue
                print(f"  {name:<24} status={st.get('status')} "
                      f"剩余训练 {st.get('available_training_times','?')}")
            except ValueError:
                print(f"  {name:<24} 查询失败 HTTP {r.status_code}")


def main():
    p = argparse.ArgumentParser(description="口播 · 复刻音色生成与修补")
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("say", help="用复刻音色念一段文本")
    s.add_argument("text")
    s.add_argument("--out", required=True)
    s.add_argument("--voice", help="音色名或 speaker_id，不传用默认")
    s.add_argument("--fit", type=float, metavar="秒",
                   help="对齐到目标时长：先调 speech_rate 粗调，再 atempo 精调")
    s.add_argument("--match", metavar="音频", help="匹配这个音频的响度（通常是原音轨）")
    s.add_argument("--match-ss", dest="match_ss", type=float, help="--match 从第几秒起算")
    s.add_argument("--match-t", dest="match_t", type=float, help="--match 取多少秒")
    s.add_argument("--loudness", type=float, metavar="dB", help="直接指定目标平均电平")
    s.add_argument("--format", default="wav", choices=["wav", "mp3", "pcm", "ogg_opus"])
    s.add_argument("--sample-rate", dest="sample_rate", type=int, default=48000,
                   choices=[8000, 16000, 22050, 24000, 32000, 44100, 48000])
    s.add_argument("--model", default=None,
                   choices=["seed-tts-2.0-expressive", "seed-tts-2.0-standard"])
    s.add_argument("--no-fidelity", dest="no_fidelity", action="store_true", default=None,
                   help="关掉还原模式（默认开）")
    s.add_argument("--speech-rate", dest="speech_rate", type=int, default=None,
                   help="火山语速-50~100；未指定时使用个人配置，公共建议为0")
    s.set_defaults(func=cmd_say)

    t = sub.add_parser("train", help="投喂真人录音，训练新音色")
    t.add_argument("--audio", required=True)
    t.add_argument("--speaker", required=True, help="控制台里的空音色槽位 ID")
    t.add_argument("--name", required=True, help="给这个音色起的名字")
    t.add_argument("--seconds", type=float, help="只取前 N 秒（不传则整条，超 10MB 自动降格式）")
    t.add_argument("--start", type=float, default=0, help="从第几秒开始取")
    t.add_argument("--reference-text", dest="reference_text",
                   help="参考音频对应的文本，服务端会做 WER 校验，差太多会失败")
    t.add_argument("--language", type=int, default=0, help="0=中文 1=英文")
    t.add_argument("--denoise", action="store_true", help="开降噪（会损失相似度，样本干净时别开）")
    t.add_argument("--keep-volume", dest="keep_volume", action="store_true",
                   help="关掉音量归一化，合成音量更贴近参考音频")
    t.add_argument("--default", action="store_true", help="设为默认音色")
    t.add_argument("--force", action="store_true", help="电平过低时仍然上传")
    t.set_defaults(func=cmd_train)

    v = sub.add_parser("voices", help="列出音色")
    v.add_argument("--check", action="store_true", help="同时查线上训练状态")
    v.set_defaults(func=cmd_voices)

    s.add_argument("--mode", choices=["off", "system", "clone"], help="仅覆盖本次声音方式")
    for command in (s, t, v):
        command.add_argument("--config", help="明确选择安装目录外的用户配置")
        command.add_argument("--project", help="读取该项目的受限媒体偏好")
        command.add_argument("--allow-cloud", action="store_true", help="已获得的本次云调用授权，不覆盖deny")
        command.add_argument("--allow-paid-api", action="store_true", help="已获得的本次付费调用授权，不覆盖deny")
    t.add_argument("--allow-voice-training", action="store_true", help="本次明确允许训练；不隐含于普通合成授权")
    args = p.parse_args()
    from capabilities import effective, resolve, run_say, ConfigError
    config, _ = effective(args.config, args.project)
    configure_backend(config)
    if args.cmd == "say":
        return run_say(args, config)
    if args.cmd == "train" or (args.cmd == "voices" and args.check):
        operation = "train" if args.cmd == "train" else "check"
        grants = [key for key in ("cloud", "paid_api", "voice_training") if getattr(args, "allow_" + key, False)]
        result = resolve(config, mode="clone", operation=operation, grants=grants)
        if result["status"] != "configured_unverified":
            print(json.dumps(result, ensure_ascii=False)); raise SystemExit(2)
    args.func(args)


if __name__ == "__main__":
    from capabilities import ConfigError
    try:
        main()
    except (ConfigError, OSError, subprocess.SubprocessError) as e:
        print(str(e) if isinstance(e, ConfigError) else type(e).__name__, file=sys.stderr)
        raise SystemExit(2)
