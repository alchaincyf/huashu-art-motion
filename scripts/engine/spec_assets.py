"""片段 spec 里的本地素材路径：找出来、核存在、改写成本地服务能取的 URL。render.py 用它（qa.py 可以照搬）。

认这些字段（路径相对 spec 文件，也可写绝对路径；data: / http(s): 原样放行）：
  cues[].image                 一张图（截图、照片、录像的一帧）
  cues[].frames                帧序列：目录（按文件名排序取 .png/.jpg/.jpeg/.webp）或路径数组；配 cues[].fps（默认 30）
  data.image                   语法级的一张图（y1 用作中心物的图）
  data.character               y4 角色：预设名（neutral / bun / author）原样放行；目录 → 帧库（文件名去扩展名 = 姿势名）；
                               对象 {frames: {姿势: 路径} | 目录} 同理
文件不存在 → FileNotFoundError（调用方拒绝渲染，不出空白帧）。
"""
import urllib.parse
from pathlib import Path

FRAME_EXT = ('.png', '.jpg', '.jpeg', '.webp')
PRESETS = ('neutral', 'bun', 'author')


def _url(f, allowed):
    allowed.add(str(f))
    return '/__file__/' + urllib.parse.quote(str(f))


def _file(v, base, allowed, what):
    if not v or str(v).startswith(('data:', 'http:', 'https:')):
        return v
    f = (base / v).resolve()
    if not f.is_file():
        raise FileNotFoundError(f'spec 里的{what}不存在：{v}（相对 {base}）')
    return _url(f, allowed)


def _dir_frames(v, base, what):
    d = (base / v).resolve()
    if not d.is_dir():
        return None
    files = sorted(p for p in d.iterdir() if p.suffix.lower() in FRAME_EXT)
    if not files:
        raise FileNotFoundError(f'spec 里的{what}目录是空的（没有 {"/".join(FRAME_EXT)}）：{v}')
    return files


def localize(spec, base, allowed):
    """原地改写 spec。base = spec 所在目录；allowed 收集允许服务的绝对路径。"""
    base = Path(base)
    for q in spec.get('cues', []):
        if q.get('image'):
            q['image'] = _file(q['image'], base, allowed, '图片')
        fr = q.get('frames')
        if isinstance(fr, str):
            files = _dir_frames(fr, base, '帧序列')
            if files is None:
                raise FileNotFoundError(f'spec 里的帧序列目录不存在：{fr}（相对 {base}）')
            q['frames'] = [_url(f, allowed) for f in files]
        elif isinstance(fr, list):
            if not fr:
                raise FileNotFoundError('spec 里的 frames 是空数组')
            q['frames'] = [_file(v, base, allowed, '视频帧') for v in fr]
    data = spec.get('data') or {}
    if data.get('image'):
        data['image'] = _file(data['image'], base, allowed, '图片')
    ch = data.get('character')
    if isinstance(ch, str) and ch not in PRESETS:
        files = _dir_frames(ch, base, '角色帧库')
        if files is None:
            raise FileNotFoundError(f'data.character 既不是预设（{" / ".join(PRESETS)}）也不是帧库目录：{ch}（相对 {base}）')
        data['character'] = {'frames': {f.stem: _url(f, allowed) for f in files}}
    elif isinstance(ch, dict):
        fr = ch.get('frames')
        if isinstance(fr, str):
            files = _dir_frames(fr, base, '角色帧库')
            if files is None:
                raise FileNotFoundError(f'data.character.frames 目录不存在：{fr}（相对 {base}）')
            ch['frames'] = {f.stem: _url(f, allowed) for f in files}
        elif isinstance(fr, dict):
            ch['frames'] = {k: _file(v, base, allowed, f'角色帧「{k}」') for k, v in fr.items()}
    return spec
