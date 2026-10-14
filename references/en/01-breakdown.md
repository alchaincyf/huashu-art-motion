# 01 · Breakdown: take a clip, reduce it to codeable specs within an hour

[中文](../01-拆解.md) · **English**

The goal is not a review — it is a **spec you can program directly from**: start and end frame for each segment, transition mechanism and parameters, in-shot motion list, numerical curves for counters/captions, composition coordinates, and the beat grid plus instrumentation for the audio track. Text is the index; numbers and contact sheets are the body.

First live run: 2026-10-04, breaking down a 15-second "Art History Speedrun" from X (16 art eras, 15 transitions). Total time about 1.5 hours (storyboard agent 79 min, audio agent 22 min, in parallel).

## 1. Physical parameters first (5 min)

```sh
ffprobe -v error -show_entries format=duration:stream=codec_type,width,height,r_frame_rate,sample_rate -of default=nw=1 src.mp4
```
Grab X videos from the syndication API at the highest quality (`video_info.variants`, pick the highest bitrate) — do not screen-record. If the original is 60 fps, break it down at 60 fps; frame numbers are the shared language for all specs (seconds = frame / 60).

## 2. Three overview images (10 min)

1. **Contact sheet**: 4 fps × 480 px wide, 30 frames per image, timestamps labelled. One glance tells you how many segments there are and what each one is.
2. **Key frame overview**: pick the cleanest full frame from each segment and arrange them in a 4×5 grid. The map for all subsequent work.
3. **Spectrogram**: `ffmpeg -lavfi showspectrumpic=s=1600x400:legend=1`. Instantly shows whether the music changes instrumentation per segment, whether there are falling glissandos, transient bursts, beat hits. Clean harmonics plus a hard cut at 16 kHz = code-synthesised + AAC.

## 3. Measure transitions and rhythm (15 min)

**Frame-by-frame grayscale diff**: shrink to 192×108 grayscale, compute the mean absolute difference between adjacent frames. Static segments <2, transition segments 10–37. Threshold 5 + 12-frame debounce finds all transition start points in one pass. Save as `diff.npy` for all agents to share.

Once start points are found, **fit a grid**: if the intervals are integer multiples of a constant, there is a BPM grid (this film: start point = 84 + 14.06 · n frames, residual < 0.45 frames = 128 BPM eighth notes). Once the grid is confirmed, write all timing for picture and music as "which eighth note".

**One 60 fps contact sheet per transition**: starting 2 frames before the start point, sample every 2 frames for 0.5 seconds, 15 panels. The mechanism can only be read here — "8 vertical bars falling and bouncing back" or "20 px tiles flipping about the vertical axis, spreading outward from the cat's position" is the kind of description that a 4 fps scan would compress to "tile transition".

**Take the reference frame as the last frame before the transition starts** — not the one that looks best to you. Taking it too early includes debris from the previous transition (stone chunks) as scene content (the Egypt first pass made this mistake).

## 4. In-shot motion: what is actually moving within each segment (15 min)

Motion heat map: within each segment's static interval, compute the per-pixel maximum frame difference, overlay in red on a grayscale base image, label "motion area percentage".

This film's conclusion overturned first impressions: the assumption was "each segment is a single painting", but in reality every segment has 2.5%–34% of its area moving — cave-painting animals cycling between two poses at a gallop, a scarab pushing the sun disk, a meander border scrolling, Vesuvius smoking, gold-leaf highlights sweeping past, an ornithopter flying past, a four-panel grid cycling colours. **Skipping this step and starting work produces "transitions between images"; you lose the continuous motion inside each scene.**

The heat map tells you *where* things move; then look at the 60 fps frames to see *how* they move (cycle, amplitude, whether it is two alternating frames or continuous).

## 5. How to write the task handoff to an agent

- Run the storyboard agent and audio agent in parallel; give each a complete brief: asset paths, known facts (frame rate, duration, rough segment table), required deliverables (`分镜表.md` (shot list) / `spec.json` / contact-sheet directory / `音轨拆解.md` (audio breakdown) / synthesis script), method requirements (prove with data, do not guess), reply format (summary + the 3 most uncertain points).
- Ask them to **correct your list first**. In this film I had labelled a "Memphis era" segment; the storyboard agent immediately corrected it to a "1993→2026 iris transition".
- Multimodal models "listening" to the audio track are candidates only: instrument identification is reliable, but BPM (reported 120, actually 128), number of motif notes, and "one whoosh per segment" were all wrong — verify with onset detection.

## 6. Deliverables checklist (what you should have after the breakdown)

| Deliverable | Purpose |
|---|---|
| `分镜表.md` + `spec.json` | Start/end frame per segment, transition mechanism parameters, in-shot motion, counter curves, composition coordinates |
| `转场/T*.jpg` (60 fps contact sheets) | Frame-by-frame reference when coding transitions |
| `镜内运动/运动热图.jpg` (motion heat maps) | What moves in each segment, and how much |
| `结尾动作/` (end-action frames, if character performance is present) | Per-frame centroid, trajectory, physical parameters (gravity px/frame²) |
| `音轨拆解.md` + `synth.py` (template: `scripts/audio/synth_艺术史速通.py`) | BPM grid, eighth-note count per segment, motifs, instrumentation, sound-effect sequence |
| `关键帧总览.jpg` + `生图/ref/*.png` (key-frame overview + reference frames) | Composition map, reference frame per segment |

Scripts: `scripts/analyze/` (contact sheet, grayscale diff, transition contact sheets, motion heat map); see each script's docstring for commands.
