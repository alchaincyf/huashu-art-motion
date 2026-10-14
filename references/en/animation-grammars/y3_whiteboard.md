# Y3 · Whiteboard Hand-Draw Explainer (RSA Animate style): Animation Grammar Card

[中文](../../动画语法/y3_whiteboard.md) · **English**

One-line summary: the presenter says a sentence; a hand writes a sentence and draws a diagram on a large whiteboard; the camera tracks the argument as it moves across the board; at the end the camera pulls out, and the audience sees the whole argument as one picture.

Demo film: `scripts/engine/demos/y3_whiteboard/` (render: `render.py --film demos/y3_whiteboard`) (8 s, 3 shots, 2 transition types + a closing pull-out), overview: `assets/动画语法/y3_whiteboard_总览.jpg`
Basis: research for this style (raw research notes and per-frame data are in the experiment archive and not included in the skill; figures used here have been extracted into this card). Measured RSA Animate *Changing Education Paradigms* and Minute Physics *Why is it Dark at Night?*; also reviewed official VideoScribe and Doodly documentation and primary statements from Andrew Park and Henry Reich.

**Choose one variant — do not mix:**
- RSA type: one large whiteboard, camera moves across the board, 5.3 times per minute.
- Minute Physics type: one sheet of paper per frame, hard-cut to the next sheet, 8.1 times per minute, camera stationary.
- This card and demo film follow the RSA type. Key points for the Minute Physics type are in sections ④ and ⑧.

## Pre-flight checklist

1. **Too many words, too few pictures is a storyboard-layer problem — define the visual metaphor before you draw.** For each board section, write down the object or punchline to draw first, then decide what text to add; hand-written text should not exceed one line. Count: if the words on the board overlap with more than half the words in the concurrent voiceover, that is too many words and too few pictures — adding puns or icons in post cannot fix it.
2. **Rotate block templates.** Structures like "year → object → orange label" or "dot → one line of text → one icon" used more than 3 times in a row become slideshow; break them with a comparison (left vs. right), a flow diagram (arrows), a zoom-in on detail, or one full-frame illustration.
3. **Do not hand-enter camera coordinates.** Derive them from the bounding box of the current strokes (frame the content with margins); old text at the edge of the frame that is half-cropped gets pushed out of frame.
4. **Fix line styles from the first stroke.** Solid line = already happened, dashed = planned, dotted = cross-section reference line; things on the board can only be erased or left — they do not fade.
5. **Check every drawn object: "could this be read as an indecent shape?"** Rounded-top, outward-flared-sides, round-bottom tall objects are the most frequent offenders — change to pointed top, flat bottom before drawing.

---

## ① When to use it

**Use it:**
- Argumentative content: talks, viewpoints, causal chains, historical arcs. Best for content where concepts have relationships that can be drawn as a map. Andrew Park's own words: "putting information in space so people can see relationships between things" [primary source].
- Short science explainers built on one chain of reasoning: use the Minute Physics type.
- Steady voiceover pace, clear keywords. RSA writing speed roughly matches narration speed — like "subtitles being hand-written" [measured].

**Do not use it:**
- Content requiring precise data charts; hand-drawing has too much error.
- Content with complex actions and spatial relationships; the whiteboard has no depth.
- Content that needs emotional intensity; single-color line drawings are low-affect.
- As a way to "improve comprehension": a 2016 Türkay experiment found no measurable learning advantage of whiteboard animation over other forms. Its value is attention and a sense of companionship [secondary source].

## ② Visual composition

- **Color** (RSA measured):
  - Background: pure white `#FBFBFB`
  - Lines: black `#0A0503`
  - Single accent: orange, text `#EB701F`, fills `#F3742D`; light orange hatching area approx. `#E9A67C`
  - Orange accounts for about 22% of all stroke pixels; used only on keywords and hatched fills.
  - Minute Physics uses pinkish off-white paper `#E7DBE1`, plus colored-pencil light yellow `#EDE6A2` and light blue `#B5CBE8`.
- **[This film]:** background `#FBFBFB`, lines `#0A0503`, accent `#EF7226`. The cat is filled with a 22%-opacity orange layer.
- **Line width:** RSA strokes are about 0.6–0.7% of frame height; at 1080p that is 6–7 px. Hatching is ~0.3%; title character height is ~5.5% of frame height. Minute Physics lines are thicker, ~0.8% [measured]. [This film] line width 6.5 px.
- **Composition:**
  - RSA: "plan the final full picture first, then draw it in reverse" [primary source].
  - Each frame section contains 3–6 text-and-image groups; fill a section before moving away.
  - One smooth pan moves only 0.23 frame-widths, so old and new sections heavily overlap — the audience always sees the edge of the previous section [measured].
  - The full panorama revealed at the end is one long horizontal scroll.
- **Text:** RSA uses all-caps hand-printed lettering (comic-speech style). [This film] uses LXGW WenKai (霞鹜文楷) for Chinese, subset to woff.
- **Hand:**
  - A real right hand holding a black marker, entering **from the lower right**, forearm angled lower-right, covering 15–25% of the frame.
  - Between strokes the entire hand exits the frame. Time the hand is visible: RSA 49%, Minute Physics 40% [measured].
  - [This film] code-drawn hand: bare forearm with shadow and hair, index finger pressing a black marker, scale 0.82, gentle sway at 7 rad/s.

## ③ Motion

- **Writing speed** [measured, 9 examples]:
  - Body text median ~16 characters/second.
  - Opening title half that, ~7.5 characters/second, for "establishing the topic."
  - Voiceover ~13 characters/second, so writing speed roughly matches narration speed.
  - [This film] body text 16 chars/s; "猫？" (cat?) written at the title speed of 7.5 chars/s.
- **Drawing speed** [measured + inferred]:
  - Small icons 0.5–1 s; portrait faces ~2 s.
  - RSA median new ink area is 0.25% of the frame per second.
  - Complex illustrations are not drawn on-camera: either pre-drawn and revealed when the camera moves to them, or hard-cut in with the hand adding color only.
- **[This film]:**
  - Stroke speed 2600 world pixels/second, ~2× the measured RSA live-action speed. Required for compression into an 8 s demo; slow down for a real film.
  - Stroke duration is length divided by pen speed, minimum 0.04 s per stroke, 0.02 s pen-lift interval.
  - Each stroke uses sineInOut internally, slow start and slow finish.
  - Huashu is revealed in 0.7 s using "Reveal": the pen tip traces 8 rows of zigzag within his joint bounding box; `DG.revealMask` exposes the portion the tip has passed, and the line art only appears inside that clip.
  - The first version drew parts simultaneously with `setLineDash` while the pen tip followed the joints; the review said "pen tip not leading the line," so this was replaced.
  - Chinese characters have no stroke-order data; each character is revealed by 3 rows of zigzag, with the pen tip traveling back and forth — it looks like writing.
- **Speed multiplier:** Henry Reich photographs at 1 frame per second, holding each frame for 2 video frames — equivalent to ~12× speed. RSA is estimated at 5–8× [primary source + inference].
- **"No-hand" pop-in:** RSA has some orange keywords that pop in as whole words in post, with no hand drawing them (ANAESTHETIC, CREATIVITY) [measured]. [This film] "×10 million" and "It's a cat!" (「是猫！」) use 0.3 s backOut(2.2) pop-in; the hand does not go there.
- **Pen-tip path:**
  - When the gap between strokes is <0.25 s, the pen tip slides from the end of the previous stroke to the start of the next along an arc (sineInOut, lifting 30 px).
  - Longer gaps: hand exits the frame — 0.35 s cubicIn off to the lower-right edge.
  - 0.3 s before the next stroke starts, the hand re-enters from the lower right with cubicOut.
- **Continuous motion:** the "life" in a whiteboard film comes from the hand drawing constantly. In RSA, drawing activity has almost no correlation with narration word density (|r| < 0.07): the hand keeps drawing even during speech pauses [measured].

## ④ Transitions (5 common types)

1. **Smooth pan or zoom across the board** (RSA primary, 41 times).
   - 1.2–2.4 s, **easeInOutSine**: measured speed peak/mean ratio 1.49, theoretical sine is 1.57.
   - One pan moves ~0.23 frame-widths, overlapping ~75% with the previous section.
   - [This film] Transition B: 0.9 s sineInOut (4.7→5.6 s), diagonal move ~0.5 frame-widths, simultaneously zooming to 1.12×. The hand is in the middle of drawing an orange connecting line toward the new area, leading the camera.
2. **Whip pan:** fast pan with motion blur, ~0.8 s, moves 0.5–1.2 frame-widths, used to jump to a distant area of the board (RSA 15 times).
   - [This film] Transition A: 0.8 s cubicInOut horizontal move of about one full frame-width. Motion blur only active for these 0.8 s, accumulated 9× along the velocity direction; smooth pans and the pull-out remain sharp.
3. **Pull-out to reveal the full picture** (closing move).
   - RSA ending: gray wash → 0.6 s fast pull-out → ~9 s horizontal scan of the scroll → pull out further to see everything.
   - VideoScribe defaults with "Zoom at end?" checked [primary source].
   - [This film] 6.85→7.5 s sineInOut pull to 0.45×, hold 0.5 s; simultaneously the entire board gets a very faint gray wash `#EEEEEC` over 0.5 s.
4. **Cloud or explosion wipe:** cartoon smoke cloud fills the frame and disperses, ~1 s (RSA 1 time).
5. **Hard cut:** cut to a pre-drawn illustration (RSA, rare); the Minute Physics sheet-change hard cut (primary, 8.1 times per minute); Minute Physics full-frame inversion for the night scene.

**Note**: "push into a frame or thought bubble" and "page turn" do not appear in the sample films. The first version of this demo used a "push into a thought bubble"; after reviewing the research it was replaced with a whip pan plus smooth move.

## ⑤ Rhythm and text

- **Time per section:** RSA median between camera moves is 6.6 s (quartiles 4.0–13.8 s); Minute Physics median shot length is 7.1 s [measured]. The 8 s demo fits 3 sections, roughly 2.5× the density of a real film.
- **Alignment with voiceover (core)** [measured]:
  - Writing starts 0.2–0.8 s after the corresponding phrase starts, median +0.5 s.
  - The phrase is written within 1 s of the phrase ending: write while speaking, slightly behind — **never ahead**.
  - Exception: visual groundwork (medicine bottles, arrows) can be pre-drawn several seconds ahead, waiting for the narration to catch up.
  - Minute Physics: the image drops as soon as the noun is spoken, median +0.3 s.
- **Transitions mark topic shifts, not pauses:** a new section corresponds to a new argument [measured + inferred].
- **Music:** RSA has **no music** under the speech. Minute Physics has continuous music below the voice, ~9 dB below the voice level [measured].
- **Tool defaults:**
  - VideoScribe default hold after drawing is 0.5 s [primary source]; default camera move is 1 s [secondary source].
  - Doodly default draw time per asset is 3 s [primary source].

## ⑥ Code implementation notes

> After merging into skill (2026-10-04 v0.4): the shared functions listed under "new code" in this card have been consolidated into `scripts/engine/lib/` (renamed to the unified MO / CAM / DG / TY / CH / UI / CL / TOON). Demo-specific code is in `scripts/engine/demos/y3_whiteboard/`. For a library quick-reference and "how to choose a grammar for a voiceover segment" see `references/en/09-explainer-animation-grammar.md`.

- Reuse from skill:
  - `KIT.densify / KIT.resample`: Catmull-Rom densification then arc-length equidistant resampling; `DG.hand` adds low-frequency noise on top
  - `PAINT.noise`, `PAINT.cached`
  - `HUASHU.build/pose/details`: Huashu line art
  - Engine transition interface
- New code, now consolidated into lib (`lib/diagram.js` / `camera.js`):
  - `DG.cum / DG.pointAt / DG.drawPartial`: polyline revealed by length, returns pen-tip position.
  - `CAM.at`: keyframe camera.
  - `CAM.motionBlur`: motion blur.
  - `DG.revealMask / DG.zigzag`: zigzag reveal mask (added after review).
- Demo-specific (`demos/y3_whiteboard/whiteboard.js`; stroke timeline, pen-slide, marker now in lib as `DG.board` / `B.penAt` / `DG.pen`):
  - **Stroke timeline**: `addLine / addText / addPop / addFill` placed in order; duration computed automatically from length and speed; print `Y3.timeline` on delivery to verify each section's end time. The first version had the second section running to 7.9 s, 2.5 s past the camera move — this number caught it.
  - `drawStroke`: five types — line, text, pop-in, fill, character. Text and characters both use the zigzag reveal mask; the pen-tip coordinate is taken directly from the mask's leading edge.
  - `penAt`: pen tip and hand path, including inter-stroke sliding, hand exit, and hand entry.
  - `drawHand`: hand and marker.
  - Eraser-grain texture lives in screen space, follows only camera translation not scale — otherwise a 5× zoom makes it a large gray smear.
- **Key architecture:** all three shots draw on the same whiteboard with the same camera; all transitions are `same`. The "transitions" are camera moves, so nothing on the board ever pops.

## ⑦ Representative works and primary sources

- Sample films:
  - RSA ANIMATE: Changing Education Paradigms https://www.youtube.com/watch?v=zDZFcDGpL4U
  - MinutePhysics: Why is it Dark at Night? https://www.youtube.com/watch?v=gxJ4M7tyLRE
- Andrew Park interview (Sketchnote Army 2025) https://sketchnotearmy.com/blog/2025/11/18/andrew-park
- Cognitive Media "hairy hand" https://www.hairyhand.co/about
- VideoScribe official documentation:
  - Camera and Zoom at end https://help.videoscribe.co/knowledge/use-zoom-and-set-the-camera
  - Draw entry https://help.videoscribe.co/knowledge/draw
  - Entry animations https://help.videoscribe.co/knowledge/entrance-animations
- Doodly defaults https://support.voomly.com/en/articles/12735753-doodly-how-do-i-customize-video-settings
- Learning effect research (via) https://en.wikipedia.org/wiki/Whiteboard_animation

## ⑧ The 3 most common mistakes

1. **Draw the whole section before speaking, or speak the whole section before drawing.** The magic of whiteboard film is "say a sentence, write a sentence": writing speed equals narration speed, trailing by about 0.5 s. Drawing ahead makes the audience wait; drawing after makes the drawing a redundant repeat. Do not draw complex illustrations on-camera — pre-draw them and let the camera reveal them.
2. **Each move cuts to the next blank section.** RSA pans only 0.23 frame-widths; old and new sections heavily overlap so the audience always knows where they are in the larger picture. Only use a 0.8 s whip pan with blur for jumping to a distant area. At the end, always pull out to see the full picture — that is the landing moment for this style.
3. **Too many colors, lines too thin or too uniform, hand always in frame.** Use only black plus one accent color; line width is about 0.65% of frame height. The hand enters only while drawing and exits from the lower right when done; accent words can pop in without the hand. And do not mix RSA with Minute Physics: either one large whiteboard with camera moves, or one sheet per page with hard cuts.

---

## Review and revisions (independent agent, finished film only, 6/10 — lowest of the three)

Review notes and how they were addressed:
- "Pen tip not leading the line; Huashu parts popping up simultaneously; text revealed by mask eraser":
  - Huashu changed to VideoScribe Reveal style: full line art hidden underneath, pen tip traces 8 zigzag rows, revealing the area as it passes — tip always on the leading edge.
  - Text changed to character-by-character writing: each character gets a time segment, pen tip travels 3 zigzag rows in the character box, mask follows.
  - New: `DG.revealMask` (array of same-direction strips as a union, overlaps don't cancel under nonzero) and `DG.zigzag`.
- "0.4 s dead zone after the whip pan": second section starts drawing at 3.12 s, hand enters frame as the whip pan is settling.
- "Screenshot frame line cuts through the cat's head": each frame gets a white-board-color fill before the border stroke; the front frame covers the back frame's line.
- "'自己找规律' (find the pattern itself) cropped at the top edge": third section shifted down 60 px.
- "After pull-out, the gray wash and eraser grain look like a dirty wall": gray wash lightened to `#EEEEEC`, eraser-grain opacity halved.
- "Full picture only holds 0.15 s, three groups of drawings not connected":
  - End of first section: added an orange arrow pointing right — the whip pan now has a direction.
  - End of second section: orange connecting line leads toward the third section — the hand leads the camera.
  - Pull-out moved to 6.85–7.5 s, full picture holds 0.5 s.
- "Hand is a blue-sleeved cartoon hand": changed to bare forearm with shadow and hair, closer to RSA's real hand. Still code-drawn.

## QA (skill `scripts/qa.py`, final after revisions)

| Shot | Measurement window (s within shot) | Motion area% mean/peak | Still frame-pairs% | Jump frames | Per-frame time mean/peak ms | Deterministic |
|---|---|---|---|---|---|---|
| y3_s1 | 0.35–2.48 | 3.1 / 5.31 | 0.0 | 0 | 6.5 / 6.9 | ✓ pixel-exact |
| y3_s2 | 0.8–2.23 | 4.65 / 9.57 | 0.0 | 0 | 6.5 / 7.3 | ✓ pixel-exact |
| y3_s3 | 0.85–3.23 | 4.45 / 10.94 | 0.0 | 0 | 8.3 / 9.0 | ✓ pixel-exact |

Transition smoke test (one render per transition, slowest frame): y3_s2 (same) 46.9 ms; y3_s3 (same) 14 ms

Notes:
- All three whiteboard shots have zero jump frames: every "transition" is a camera move on the same board — nothing on the board pops.
- Motion area 3–4.7% comes mainly from the hand and the currently drawn line; it is higher when the camera is moving.
- Per-frame under 10 ms because everything is vector line art with no pixel-level processing.

Re-run: `uv run scripts/qa.py --project scripts/engine --film demos/y3_whiteboard --out <path>` (the table above is the experiment figure; post-merge re-run numbers are in the regression table in reference 09).
