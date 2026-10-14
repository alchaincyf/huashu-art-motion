#!/usr/bin/env python3
"""Presenter frames: green-screen sprite sheet → key/slice → measure foot center and hat-to-foot height → spacex_lin/assets/p_<姿势>_<i>.png + spacex_lin/presenter_meta.js
Usage: python3 prep_presenter.py (scan assets/src/sheet_*.png, plus mixed s11 pointing sheet and pre-sliced surprised frames)"""
from pathlib import Path
import json
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]; SRC = ROOT / 'assets' / 'src'; OUT = ROOT / 'assets'
MIX = ROOT.parent / 'spacex' / 'assets'
SHEETS = {p.stem[6:]: p for p in sorted(SRC.glob('sheet_*.png'))}
SHEETS.setdefault('point', MIX / 's11_sheet_point.png')
PRECUT = {'wow': [MIX / f's11_wow_{i}.png' for i in range(3)]}   # Mixed sheet already sliced (three connected arm frames cannot be split by columns)
EXPECT = {'walk': 6, 'bust': 4}


def key(im):
    a = np.asarray(im.convert('RGB')).astype(np.float32); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    spill = g - np.maximum(r, b); al = 1 - np.clip((spill - 30) / 70, 0, 1)
    g2 = np.where(spill > 0, np.minimum(g, np.maximum(r, b) + 0.25 * np.clip(spill, 0, 30)), g)
    return np.dstack([r, g2, b, al * 255]).clip(0, 255).astype(np.uint8)


def runs(mask):
    cols = mask.sum(0) > 2; out = []; x = 0; W = len(cols)
    while x < W:
        if cols[x]:
            x0 = x
            while x < W and cols[x:x + 14].any(): x += 1
            if x - x0 > 60: out.append((x0, x))
        x += 1
    if out:
        mw = max(b - a for a, b in out); out = [r for r in out if r[1] - r[0] >= 0.45 * mw]   # Fragments such as sweat drops/emphasis lines are not frames
    return out


def crop(fr):
    m = fr[..., 3] > 127; ys = np.where(m.any(1))[0]; xs = np.where(m.any(0))[0]
    return fr[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def measure(fr):
    m = fr[..., 3] > 127; h, w = m.shape
    bot = m[int(h * 0.94):]; xs = np.where(bot)[1]; ax = float(xs.mean()) if len(xs) else w / 2   # Foot-center anchor
    white = (fr[..., :3].astype(int).min(2) > 228) & m; cnt = white.sum(1)                          # Hat top: first row with ≥40 nearly white pixels
    top = int(np.argmax(cnt >= 40)) if (cnt >= 40).any() else 0
    return w, h, round(ax, 1), top


meta = {}
jobs = [(p, None, s) for p, s in SHEETS.items()] + [(p, l, None) for p, l in PRECUT.items()]
for pose, pre, sheet in jobs:
    if pre: frames = [crop(np.asarray(Image.open(q).convert('RGBA'))) for q in pre]
    else:
        rgba = key(Image.open(sheet)); mask = rgba[..., 3] > 127
        frames = [crop(rgba[:, x0:x1]) for x0, x1 in runs(mask)]
    meta[pose] = []
    for k, fr in enumerate(frames):
        w, h, ax, top = measure(fr); name = f'p_{pose}_{k}.png'
        Image.fromarray(fr, 'RGBA').save(OUT / name)
        meta[pose].append({'src': f'spacex_lin/assets/{name}', 'w': w, 'h': h, 'ax': ax, 'ay': h, 'top': top, 'body': h - top})
    print(pose, len(frames), [(f['w'], f['h'], f['body']) for f in meta[pose]], '' if len(frames) == EXPECT.get(pose, 3) else '⚠️ 帧数不对')
(ROOT / 'presenter_meta.js').write_text('// 由 tools/prep_presenter.py 生成，勿手改\nwindow.LIN_META = ' + json.dumps(meta, ensure_ascii=False) + ';\n')
