# 05 · Rhythm and score

[中文](../05-节奏与配乐.md) · **English**

Breakdown method and reusable patterns: `style-recipes/_score-art-history-speedrun.md` (Section 5, "Reusable patterns", can be used directly); synthesis script template (original example score): `scripts/audio/synth_艺术史速通.py`.

## Key points

1. **Set the BPM grid first; picture and music both land on the grid.** 128 BPM / eighth note 0.234 s suits speedrun/montage. The `eighths` field in `eras.js` is how many eighth notes each segment occupies.
2. **Acceleration comes from shorter segments, not a higher tempo.** 6 → 4×5 → 3×4 → 2×3 → 1×3 → extended ending.
3. **One three-note motif; for each segment, use that era's representative instrument and transpose to the chord.** One four-chord loop is enough for the harmony.
4. **Hard onset between segments — no cross-fade, no whoosh.**
5. **End-of-film sound design: stop — suspend — slam — reaction — release** (ping → falling whistle glissando → crash → cat meow → low pizzicato), time-points aligned to the picture event frames.
6. **Loudness**: match the reference film's integrated LUFS and true peak; compare relative differences segment by segment.
7. Multimodal models "listening" to audio are candidates only: instruments are reliable, but BPM, motif note count, and sound-effect timestamps must all be verified with onset detection.

## Alignment with picture

- Transition start point = grid point; lens impact (scene layer 1.03 → 1.0, 20 frames) lands on the same point — the audio "click" and the visual snap are the same event.
- End-performance action frames (cup-knock ×3, cup hitting the floor) aligned to audio onset, within 3 frames.
- Without reference footage: write the segment table first (how many eighth notes per segment), then generate the picture timeline and score simultaneously; later rhythm adjustments only require changing `eighths` in one place.
