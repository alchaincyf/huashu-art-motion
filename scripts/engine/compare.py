#!/usr/bin/env python3
"""Reference vs recreation, frame-by-frame side by side: extract at given times, reference left/recreation right, combine into one image.
python3 compare.py --a 原片.mp4 --b 复刻.mp4 --times 1.5,1.6 --out 对比.jpg [--w 640]"""
import argparse, subprocess, io
from PIL import Image, ImageDraw
ap = argparse.ArgumentParser(); ap.add_argument('--a'); ap.add_argument('--b'); ap.add_argument('--times'); ap.add_argument('--out'); ap.add_argument('--w', type=int, default=640); ap.add_argument('--cols', type=int, default=2)
a = ap.parse_args()
def grab(v, t):
    png = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(t), '-i', v, '-frames:v', '1', '-f', 'image2pipe', '-c:v', 'png', '-'], capture_output=True).stdout
    return Image.open(io.BytesIO(png)).convert('RGB').resize((a.w, a.w * 9 // 16))
ts = [float(x) for x in a.times.split(',')]
w, h = a.w, a.w * 9 // 16
cols = a.cols; rows = (len(ts) + cols - 1) // cols
S = Image.new('RGB', (cols * 2 * w + (cols - 1) * 12, rows * (h + 18)), 'white'); d = ImageDraw.Draw(S)
for i, t in enumerate(ts):
    x = (i % cols) * (2 * w + 12); y = (i // cols) * (h + 18)
    S.paste(grab(a.a, t), (x, y + 18)); S.paste(grab(a.b, t), (x + w, y + 18))
    d.text((x + 3, y + 3), f'{t:.3f}s  原片 | 复刻', fill='black')
S.save(a.out, quality=85); print(a.out)
