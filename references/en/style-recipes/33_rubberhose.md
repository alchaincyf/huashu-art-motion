# 33_rubberhose · 1930 Rubber-Hose Cartoon

[中文](../../风格配方/33_rubberhose.md) · **English**

> Source: Migration Test D (stand-alone agent working read-only from skill, 2026-10-04). Scene code ported after integration to `scripts/engine/scenes/33_rubberhose.js`.

Experimental filename: `scenes/r2_rubberhose.js`; ~20 ms per frame.

**Pipeline**: paper-tone single-colour base (wallpaper vertical stripes + diamond dots, floor tile seams, watercolour shadow in the corners, cached) → sky outside the window (sun face, clouds, trees) → window frame and round-dot curtain → chair → table (curved legs + dancing flowers) → girl → cat → `saturation` desaturation + `multiply` #f2e8d2 for faded tone → film layer.

**Key parameters**
- Beat bounce: `bnc(tq, ph) = |sin(π(tq/BEAT + ph))|`, BEAT = 60/128. Each object bounces upward from its own contact point by `amp` pixels: landing squash sx=1+0.09k, sy=1−0.09k; airborne stretch ~5%. Objects offset in phase by 0.25 beat: table 0.5, girl 0.25, cat 0.75, sun 0; bow ribbon 0.05, slightly after the body, acting as follow-through.
- Stepping: all characters and motifs use `tq = floor(t·12)/12` (two steps per beat); cup-raising also steps at 12 fps; film layer uses `floor(t·24)`.
- Character drawing: skeleton uses only anchor points.
  - Head: large circle face of radius 82 around headC.
  - Pie-cut eyes: white eye socket + black pupil, with a wedge `arc(−1.45..−0.85)` cut from the pupil; 3 lashes above.
  - Arm: rubber hose = one quadratic Bézier from shoulder to hand, constant width, black outline +10 px.
  - White gloves: 4 fingers, turned-back cuff, 3 lines on the back of the hand.
  - Polka-dot skirt reaching to the ankle (modest length).
- Cat: body using `RIG.smooth(K.bodyPts)`, medium grey #a39a84 (= orange in this greyscale scheme), stripes #5e574b, white chest and paws #fbf7ec; tail is a wavy rubber hose `sin(7q − 9tq)·26q`.
- Film layer:
  - Frame jitter ±1.5/±2 px.
  - Flicker: each frame layered with α0.02–0.09 white, then α0–0.06 black.
  - Scratches: 3 vertical lines, position changed per `floor(t·6)` so one scratch stays visible for several frames.
  - 14 dust points per frame + occasional hair strand.
  - Grain layer translated randomly ±20 px each frame.
  - Rounded film gate: `roundRect` r60, plus vignette.

**Motif animation**: everything bounces on the beat, sun-face rays rotate at 1.6 rad/s and face nods on the beat, dancing flowers (stem swaying ±0.35 rad, leaves waving like hands, petals spinning), a smoke ring emitted each beat, curtain hem swings on the beat, film flicker and scratches. Motion area 40%, but most of it is film noise (see ② item 5).

**Pitfalls**
- The skeleton's cat body is polyline, and in a cartoon the straight edges are immediately obvious; must use smooth.
- The entire frame must be desaturated at once after drawing all characters; otherwise gloves and cups retain warm colour traces.
