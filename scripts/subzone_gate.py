#!/usr/bin/env python3
"""Subtitle-zone gate: scan film without subtitles, report timestamps when content (text/outlines/rockets/flames) enters band.

    python3 subzone_gate.py <无字幕版.mp4> [--band 920] [--fps 10] [--thresh 150]

qa.py checks text bounds; this supplements graphics entering subtitle band.
Counts dark pixels grayscale <95, suitable only for clean light backgrounds (whiteboard/cream paper/light keynote).
Textured backgrounds (Vox kraft table) give many false positives with dominant-color band differences; use qa.py boundaries
or Vox-style text APIs registering object ownership for occlusion checks.
Threshold measured for that film (>150 pixels after half-sizing band to 960×80); calibrate known good/bad frames for new styles.
"""
import argparse, subprocess, numpy as np
ap = argparse.ArgumentParser(); ap.add_argument('video'); ap.add_argument('--band', type=int, default=920, help='字幕带上沿 y（1080 高）')
ap.add_argument('--fps', type=float, default=10); ap.add_argument('--thresh', type=int, default=150)
a = ap.parse_args()
h = 1080 - a.band; W, H = 960, h // 2
cmd = ['ffmpeg', '-v', 'error', '-i', a.video, '-vf', f'fps={a.fps},scale=1920:1080,crop=1920:{h}:0:{a.band},scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'gray', '-']
raw = subprocess.run(cmd, capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W)
bad = []
for i, f in enumerate(fr):
    n = int((f < 95).sum())
    if n > a.thresh: bad.append((i / a.fps, n))
runs = []
for t, n in bad:
    if runs and t - runs[-1][1] <= 1.5 / a.fps: runs[-1][1] = t; runs[-1][2] = max(runs[-1][2], n)
    else: runs.append([t, t, n])
print(f'{len(fr)} 帧，命中 {len(bad)} 帧')
for t0, t1, n in runs: print(f'  {t0:7.2f}–{t1:7.2f}s  最多 {n} 个像素')
