# Audio method · Code-synthesized speedrun scores (breakdown method + original example)

[中文](../../风格配方/_音轨_艺术史速通.md) · **English**

This page captures methods from a breakdown: the reference is X user Tak's (@cherry_mx_reds) 15-second *Art History Speedrun*, whose score itself is code-synthesized. We retain **how to analyze, compose, and mix**, not a note-by-note transcription of the original.

Companion script: `scripts/audio/synth_艺术史速通.py`. The score is an **original example** (D minor, Dm–B♭–F–C harmony), with segment structure matching the visuals in `scripts/engine/eras.js`. Reuse the instrument library and mixing chain, replacing the score with your own.

---

## 0. One-sentence conclusion

A speedrun short's score can be **a procedural arrangement on a strict BPM grid**: 17 eras are ordered by eighth-note counts (6,4,4,4,4,4,3,3,3,3,2,2,2,1,1,1,9); later sections shorten, creating acceleration through shorter sections rather than tempo changes. Each section switches to representative instruments, while one three-note motif transposes with the chords throughout. Once music stops on the grid, cartoon effects (ding, falling slide whistle, shattering, meow, final pluck) complete the closing gag.

---

## 1. How to analyze a reference score

| Measurement | Method | Precision/confidence |
|---|---|---|
| Tempo and grid | Superflux-style spectral flux on STFT (hop 2.5ms), peaks as onsets, least-squares fit `t = t0 + n·E` (28 onsets) | E = 0.23431s (eighth note) → **128.04 BPM**, grid origin t0 = 0.028s. All residuals within ±4ms, beyond hand-played precision, establishing code scheduling |
| Era boundaries | Three-way cross-check: ① grid positions; ② peaks of MFCC novelty (distance between averages over 0.2s before/after); ③ video frame-difference peaks | Audio-grid boundaries differ from MFCC peaks by ≤20ms. Visual transitions lag audio 0–0.2s (0.1–0.2s wipe/morph transitions) |
| Pitch | ① Spotify basic-pitch polyphonic transcription (ONNX, temporary Python 3.11 environment); ② 85ms FFT peaks on a sixteenth-note grid, >6dB gain around onset marks new notes; ③ manual reading of custom CQT semitone-energy map | High confidence in principal melody notes (two methods agree). Medium for inner harmony voices and details in ukiyo-e/Van Gogh sections |
| Timbre | Harmonic amplitudes after each melody onset, 20–220ms (H1–H8, ±1.5% narrow bands), plus narrow-band envelope onset and decay (+50/100/200ms relative to peak) | Polyphony mixes other voices in; harmonic ratios indicate tendencies only |
| Percussion | Energy jumps >6kHz (noise) and <150Hz (drums), every sixteenth note | High |
| Effects | FFT peak-frequency tracking over 13–15s with 20ms steps, aligned to events using a 2.1s visual contact sheet (one frame every 0.1s) | High |
| Loudness | ffmpeg ebur128; per-section BS.1770 K-weighted ungated mean square | Overall **-14.3 LUFS, LRA 0.9 LU, true peak -2.4 dBTP** (the often-mentioned "average -16.6dB" is RMS mean, a different measure) |
| Omni-modal model listening | Let an omni-modal model hear the whole film with composer-oriented questions | Candidates only; verify each, see section four |

---

Two additional lessons: timbre is most reliably judged by harmonic amplitudes 20–220ms after onset plus narrow-band envelope decay; code synthesis is indicated by three things: residual timing within ±5ms, textbook components such as sine/square/saw/exponential decay, and no recording noise in quiet sections.

---

## 2. Original example score (the script's `era()` blocks)

Time units are eighth notes, origin = `t0 + n·E`. The ♪♪♩ motif is labeled "motif."

| # | Era | Length | Orchestration | Example notes |
|---|---|---|---|---|
| 1 | Cave | 6 | Bone flute + hand drum + offbeat taps | Augmented descending A4–G4–D4 |
| 2 | Egypt | 4 | Harp + sistrum | Dm→B♭ arpeggios; motif F5–G5–D5 |
| 3 | Greek black-figure | 4 | Lyre + double aulos | B♭ chord; D5 → F5 |
| 4 | Rome | 4 | Horn + war drum | Motif C5–D5–A4, F→C→Dm |
| 5 | Gothic | 4 | Pipe organ | Dm → Gm/D, D2 pedal |
| 6 | Renaissance | 4 | Harpsichord + bass viol | Motif B♭5–C6–G5, Gm→F |
| 7 | Ukiyo-e | 3 | Koto + taiko + hyoshigi | Sixteenth-note plucks in D miyako-bushi (D–E♭–G–A–B♭) |
| 8 | Impressionism | 3 | Soft piano | Motif variant A5–C6–G5, Fmaj7 → B♭ → Dm9 |
| 9 | Van Gogh | 3 | Bright pluck + wind | D2 bass pulse, scattered high A5/F5/D6/E5 |
| 10 | Art Nouveau | 3 | Celesta | Motif D5–E5–A4, B♭→C→Dm |
| 11 | Cubism | 2 | Piano-like struck strings | Deliberate dissonance: D–G♯–C♯ → E♭–A–B♭–E |
| 12 | Bauhaus | 2 | Short marimba-like notes + mechanical ticks | D across five octaves → F/A → D |
| 13 | Pop | 2 | Drum machine + short cartoon tones | Kick, offbeat clap, short D/F tones |
| 14 | Pixel | 1 | Square wave | F-major thirty-second-note arpeggio |
| 15 | Ray tracing | 1 | Supersaw | B♭ chord |
| 16 | Memphis | 1 | Sustained supersaw chord + kick + upward slide (cat jumps to table) | C major held past segment end |
| 17 | 2026 | 9 | 128BPM house: four-on-the-floor kick, offbeat open hat, saw bass, square-family plucks, pad | Modulates to D major add9: F♯5 A5 D6 E6 F♯6 E6 D6 B5 A5 |

For your own score, first choose a harmonic loop and three-note motif, then fill representative instruments + transposed motif into the segment table. For outlier sections (foreign/avant-garde), change only mode or add a tritone; keep rhythm and grid.

---

## 3. Closing effects (stop—suspend—impact—reaction—resolve)

| Event | Synthesis method (script function) |
|---|---|
| Music stops | Bass decays rapidly over about 150ms, not a hard cut |
| Paw touches cup: ding | Several 5–7kHz inharmonic rings + a little 1.5kHz (`tink`), plus a high-frequency swoosh (`swipe`) |
| Cup falls | Pure sine exponential fall about 1550→325Hz, 0.35s (`slide_whistle`) |
| Ground impact/shatter | About 80Hz thud + broadband noise (centroid 5–7kHz, about 0.45s decay) + ceramic inharmonic overtones + small fragment collisions (`crash`) |
| Meow | Harmonic synthesis with piecewise-linear pitch (rises then falls) + two formants, loudest part (`meow`) |
| Signature appears | Two light ~90Hz pops + some bright detail (`end_thump`) |
| Resolve | Bass pluck on tonic |

Align all times to visual events using contact sheets (one frame every 0.1s).

---

## 4. Mixing (script's second half, reusable unchanged)

1. 0.5s small-room reverb, 12ms pre-delay, 9% wet
2. Per-section low-frequency warmth: chord root (`BED_ROOT`) with triangle + sub-octave sine, 250Hz low-pass; level calculated relative to section loudness, no addition when already sufficient
3. Per-section 2–6kHz dynamic EQ (`MID_ORIG`)
4. Per-section >6kHz air noise (`HF_ORIG`)
5. Per-section K-weighted loudness matches `target`, four iterations, 10ms gain smoothing to prevent zipper noise
6. Optional steep 15.8kHz low-pass, emulating streamed AAC
7. Overall LUFS alignment, then look-ahead peak limiting

With a reference, fill `target / MID_ORIG / HF_ORIG / LOW_FLOOR_ORIG` from per-section measurements (section one); without one, the example's uniform relative values suffice.

Softer attacks: a pluck's hard 2ms attack sounds too point-like; use a 10ms linear attack, higher harmonics start later (×1.6 per harmonic, capped at 35ms), halve attack noise and low-pass at 7kHz for greater continuity.

Example output: 48k stereo, 15.06s, -14.0 LUFS, true peak -1.5 dBTP.

```
uv run --with numpy --with scipy --with soundfile python scripts/audio/synth_艺术史速通.py
```

---

## 5. Reusable principles: code-synthesized scores for any animation

These can be copied directly.

1. **Set a BPM grid first; align everything to it**. 128 BPM (eighth note 0.234s) suits speedruns/montages; cuts, music onsets, effect hits all use `t0 + n·E`. Visual editing never makes music feel chaotic. Reference residual timing is only ±4ms; machine precision is itself part of the style.
2. **Accelerate by reducing eighth-note counts per section, not increasing tempo**. Here: 6 → 4×5 → 3×4 → 2×3 → 1×3, then lengthen final section to nine for breathing room and gag. Tempo stays fixed yet feels increasingly urgent; sections remain grid-aligned with visual cuts. List visual segment durations, round to eighth notes, then adjust globally for regular decreases.
3. **Repeat one three-note motif with changing instruments and chord transposition**. Pick a short rhythmic cell (example ♪♪♩ steps upward then leaps down); each scene plays it with an instrument representative of its era/style, pitches following that section's chord. A four-chord backbone suffices (example Dm–B♭–F–C). Outlier sections change only mode or add a tritone, preserving rhythm/grid. Establish it at opening with inversion or augmentation (cave example: descending dotted quarters).
4. **No crossfades between sections**. New section attacks hard on the grid; previous notes keep their natural tails (plucks 30–300ms, sustained release about 150ms). A sustained bass can bridge sections. Each change has a clear click without discontinuity. No need for a transition swoosh in every section (reference has none).
5. **Design closing effects as stop—suspend—impact—reaction—resolve**:
   - Stop: music stops on grid, rapid about 150ms decay, not hard cut.
   - Suspend: a small ding introduces a falling whistle (pure sine exponential sweep, about 0.35s, more than two octaves).
   - Impact: thud + broadband noise + inharmonic overtones + fragment collisions, about 0.45s decay.
   - Reaction: character voice, e.g. piecewise-linear pitch meow, about 0.5s after impact, loudest in segment.
   - Resolve: one/two light pops with signature, final bass pluck on tonic or dominant.
   Align all to events using contact sheets (one frame every 0.1s).
6. **Loudness alignment**:
   1. Measure whole reference (ffmpeg ebur128: integrated LUFS, LRA, true peak).
   2. Per section measure K-weighted loudness, plus 2–6kHz, >6kHz, 40–220Hz floor differences relative to section loudness.
   3. After synthesis: low-frequency warmth → mid/high dynamic EQ → air → loudness iterations (three/four, 10ms gain smoothing against zipper noise).
   4. If reference is AAC, add 16kHz low-pass.
   5. Finally align whole-film LUFS and peak-limit.
   Use differences relative to section loudness throughout, not absolute levels; changing assets/overall loudness then needs no recalibration.
7. **Make synth.py a general template** (same structure, replace four data groups):
   - `T0, E`: grid origin and eighth-note length (BPM → `E = 60 / BPM / 2`).
   - `edges / target / MID_ORIG / HF_ORIG / LOW_FLOOR_ORIG / BED_ROOT`: section boundaries and measured references; without reference, make `target` uniform (e.g. -14), three adjustment values set to no boost.
   - Score blocks `era(n0, items)`: one list per section of `(relative eighth-note position, instrument function, gain, pan)`. Reuse instrument functions (`pluck` family, sustained `additive`, drums `kick / clap / hat / taiko`, synths `chip / supersaw`); new styles usually need only changed `pluck` harmonics and decay.
   - Effects: call `tink / slide_whistle / crash / meow / end_thump` at event times; frequency/duration from reference measurements or principle five's template.
   Keep second-half mixing chain unchanged (warmth → EQ → air → loudness iterations → low-pass → limiting).
8. **Analysis order**:
   1. Fit onset-flux grid for BPM and t0.
   2. FFT new-note detection on sixteenth grid, cross-check with basic-pitch polyphonic transcription.
   3. Narrow-band harmonic ratios and envelopes for timbre.
   4. High/low-frequency energy jumps for percussion.
   5. Omni-modal model only supplies candidates; verify each. It was reliable on instruments, but wrong about tempo (said 120, measured 128), motif note count, transition swooshes, and effect timing.
