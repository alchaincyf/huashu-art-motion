"""Local clip-spec assets: discover paths, verify existence, rewrite as URLs served locally. Used by render.py (qa.py can reuse it).

Recognized fields (relative to spec or absolute; data: / http(s): pass through):
  cues[].image                 One image (screenshot, photo, video frame)
  cues[].frames                Sequence: directory (.png/.jpg/.jpeg/.webp sorted by name) or path array; cues[].fps defaults to 30
  data.image                   Grammar-level image (central object in y1)
  data.character               y4 character: presets neutral / bun / author pass through (y4 disallows code-drawn characters, requests frame library at startup); directory → frame library (filename stem = pose);
                               Object {frames: {pose: path} | directory} likewise
Missing file → FileNotFoundError (caller rejects rendering rather than producing blank frames).
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
    """Rewrite spec in place. base = spec directory; allowed collects absolute paths permitted for serving."""
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
