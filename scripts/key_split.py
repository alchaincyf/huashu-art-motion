#!/usr/bin/env python3
"""Green-screen key + split individual poses at column gaps: python3 key_split.py 图.png --out 前缀 [--pick 0] (select pose index)"""
import argparse
import numpy as np
from PIL import Image
ap = argparse.ArgumentParser(); ap.add_argument('src'); ap.add_argument('--out', required=True); ap.add_argument('--pick', type=int); ap.add_argument('--white', action='store_true', help='白底线稿：不抠，只裁')
a = ap.parse_args()
im = np.asarray(Image.open(a.src).convert('RGB')).astype(np.float32); r, g, b = im[..., 0], im[..., 1], im[..., 2]
if a.white:
    alpha = 1 - np.clip((np.minimum(np.minimum(r, g), b) - 225) / 25, 0, 1); alpha = np.maximum(alpha, (np.max(im, 2) - np.min(im, 2) > 40))
    rgba = np.dstack([r, g, b, np.full_like(r, 255)])
    mask = alpha > 0.1
else:
    spill = g - np.maximum(r, b); al = 1 - np.clip((spill - 30) / 70, 0, 1)
    g2 = np.where(spill > 0, np.minimum(g, np.maximum(r, b) + 0.25 * np.clip(spill, 0, 30)), g)
    rgba = np.dstack([r, g2, b, al * 255]); mask = al > 0.05
cols = mask.any(0); runs = []; x = 0; W = len(cols)
while x < W:
    if cols[x]:
        x0 = x
        while x < W and cols[x: x + 12].any(): x += 1
        if x - x0 > 40: runs.append((x0, x))
    x += 1
for k, (x0, x1) in enumerate(runs):
    if a.pick is not None and k != a.pick: continue
    rows = mask[:, x0:x1].any(1); ys = np.where(rows)[0]; y0, y1 = ys.min(), ys.max() + 1
    out = rgba[y0:y1, x0:x1].clip(0, 255).astype(np.uint8)
    Image.fromarray(out, 'RGBA' if out.shape[2] == 4 else 'RGB').save(f'{a.out}{"" if a.pick is not None else "_" + str(k)}.png'); print(k, x0, x1, y0, y1)
