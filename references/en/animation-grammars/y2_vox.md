# Y2 · Vox-Style Collage Explainer: Animation Grammar Card

[中文](../../动画语法/y2_vox.md) · **English**

One-line summary: lay the argument on a table covered in real material — clippings, photographs, documents — while the camera moves across the surface like an investigative journalist's eye; lines and a pen draw on in discrete strokes, and the sense of evidence comes from "these things are actually placed here."

Demo film: `scripts/engine/demos/y2_vox/` (render: `render.py --film demos/y2_vox`) (8 s, 3 shots, 2 transitions), overview: `assets/动画语法/y2_vox_总览.jpg`
Basis: research for this style (raw research notes and per-frame data are in the experiment archive and not included in the skill; figures used here have been extracted into this card). 5 samples: Missing Chapter (2022), Psychedelic Posters (2019), Vox Borders (2018), Johnny Harris (2026), plus a 2026 Vox live-action film as a reference. 13 camera motion segments were curve-fitted for easing and color was sampled.

## Pre-flight checklist

1. **Real material fills the frame.** Screenshots, source documents, and photographs fill or nearly fill the frame; push in to the specific line that needs to be read. The table surface is the world the camera travels through, not a background mat for small images. Check: if more than 2 consecutive shots have source material narrower than 60% of the frame width, that is a "picture-frame layout."
2. **Alternate "slide-in → typed label → red circle."** When storyboarding, list a reveal-action table: appear on cut, push in, pan to the next item, highlighter sweep, red-line connect, stamp, tear off … do not repeat the same reveal sequence more than 3 times in a row. Evidence: in one feature, 36 out of 37 labels used a slide-in; by the middle of the film the audience could predict the next move.
3. **Text to be read goes on the top layer, drawn last,** regardless of the layer order of its parent object. Photographs, clips, and cards placed on top of text are the most frequently recurring error in this grammar.
4. **Derive camera endpoints from what needs to be read at this moment** (frame the target with margins), do not hand-enter coordinates; labels of neighboring cards that are half-visible get pushed out of frame.
5. **Every time a new card is added to the accumulating surface, read the on-screen text in reading order.** Two cards placed side-by-side can concatenate into a wrong phrase ("exceeds" next to "acquisition"); remove a card or write the qualifier in full.
6. **Each formal action for the same event is performed only once.** An action already shown in a wide shot is not re-performed after the push-in, or the audience reads it as "happening again."

---

## ① When to use it

**Use it:**
- Content with real archival material, news, history, maps, or people: "how did this happen," "who said what and when."
- The voiceover is journalistic argument: citations, evidence, cause and effect. When the narration says "look at this line" or "notice this number," the picture highlights that line.
- When quoting a sentence, a set of numbers, or a year, and the audience needs to "see the source with their own eyes."
- The demo film uses real figures from the 2012 Google "cat paper": 1,000 machines, 16,000 CPU cores, 10,000,000 YouTube frames, no labels. Source: arXiv:1112.6209 and the Google official blog.

**Do not use it:**
- Pure mechanisms or pure concepts with no real material to place on the table. Forcing it produces "fake archives" — use Y1.
- Derivations and step-by-step processes: use Y3.
- Content requiring heavy character performance: cut-paper characters can only move in discrete hops.

## ② Visual composition

- **Three-color system** (measured from Missing Chapter):
  - Near-black background `#171716`
  - Paper white `#E0DCDA`–`#EEEDED`
  - One red in two variants: bright red `#B65255` for lines, dark red `#93403C` for fills
  - Fluorescent yellow `#DACF08` (darker and more olive than the Vox logo's `#FFF200`; the logo yellow rarely appears in large areas inside films)
  - Old-map paper `#E4DCCF`, parchment `#CFB195`
  - No pure white, no pure black.
- **[This film]:**
  - Table surface `#e4ddcf`, flat paper texture with fiber and low-frequency luminance variation.
  - Clue red `#b8433f`, slightly brighter than measured, for legibility at 1080p.
  - Highlight `rgba(218,207,8,.9)`, composite mode multiply.
  - Shot 3 is a large black card stock `#1b1b1a` on the table, with table-surface texture visible at all four edges.
- **Materials:**
  - Photographs are always grayscale halftone (45°), with white borders and two semi-transparent tape strips.
  - Clippings have torn edges and are yellowed, with a Songti headline.
  - Labels are Borders-style black-background white bold strips ("2012 · Google").
  - Index cards use ruled paper.
  - The paper texture is **static**. Measured still-segment frame difference is 0.0–0.1; there is no per-frame grain — that is the film-stock look of Johnny Harris 2026, not Vox.
- **Shadows are very subtle.** A dark-background card is almost invisible as a shadow at 360p [measured]. [This film] uses blur 10, offset (3, 6), α 0.28 throughout.
- **Intentionally imperfect**: the Vox art director's own words were "You don't want it to look perfect because that might make it look more like an ad than an editorial piece" [primary source].
- **Character**: real-photo cut-out stickers with white border and shadow. [This film] uses `HUASHU.draw`, offsetting the silhouette in 16 directions by 12 px with a paper-white layer underneath as the sticker border.

## ③ Motion

- **Two-layer frame rate (core)** [measured]:
  - Camera layer: smooth motion at 24 fps.
  - Element layer (map color growth, red-line tracing, typing, hand-drawn circles, bounce-in): stepped at 12 fps in "twos." In the psychedelic-poster film, 52% of motion frames carry a "move–stop–move" alternating fingerprint.
  - [This film] camera runs at 60 fps continuous; all elements use `MO.step(t, 12)` to quantize before computing progress. QA measured 16.9% still frame-pairs in shot 1 — that is the twos stop-frame, not a stutter.
- **Camera easing** [13 segments measured]:
  - Median duration 1.29 s, range 0.71–1.96 s; **not a single segment is linear.**
  - 7 segments are symmetric easeInOutSine, equivalent to AE's default Easy Ease; used for long-distance "find the next card" moves.
  - 6 segments start fast with a long settling tail, close to `cubic-bezier(.33,0,.2,1)`; used for "pull-back reveals" and "follow a clue line."
- **[This film] camera:**
  - Shot 1: after the highlighter sweep, 1.5 s sineInOut push to that line (1.14→1.28). Measured BD commonly follows a sweep with a push.
  - Transition A: 1.1 s long-tail bezier.
  - Transition B: 0.6 s sineInOut push-in.
  - Shot 3: 0.85 s long-tail bezier pull-out.
  - These measured durations (push 0.6–1.5 s, pull ~1 s, line-follow 1.3–1.8 s) are the defaults for new films. The demo's shot-1 opening 0.9 s slow push (1.14→1.165, only 2% travel, nothing revealed) and the 1%/s constant-velocity slow drift after the shot-3 pull-out are the old approach; do not copy them.
- **Entry** [measured]:
  - Archive photos and clippings **appear on the cut**, with no bounce or drop.
  - Only when tracking along a timeline does the next card slide in from off-screen, tilted 5–15°, then settle flat, approximately 0.8 s.
  - [This film] small photos and the Huashu sticker use `slideIn`: 0.55 s quartOut, from 12° tilt to flat, 12 fps stepped.
- **Lines and the pen** [measured]:
  - Red underline: 0.5–1 s to draw.
  - Red ellipse circle: ~1 s, one stroke, open ends that cross slightly.
  - Highlighter strip: 1.5–3 s per line, sweeping in sync with narration.
  - Typing: ~13 characters/second, in twos.
  - [This film] red circle 0.65 s, highlight 0.9 s (compressed for demo), typing 13 chars/s, red lines 0.5 s each staggered 0.15 s, counter 1.4 s cubicOut rolling to 10,000,000.
- **Camera stops during holds:** measured still-segment frame difference is 0.0–0.1 — a Vox table surface that stops is stopped. When a card has internal animation (line tracing, highlight, typing) the camera does not move; a purely static image that lingers gets a push-in when the narration reaches the specific line (find-card 0.5–0.9 s, push-in 1.0–1.5 s, ease-in/out; the reveal itself gets a 0.28 s punch), or a pan to the next card, with no constant-velocity slow drift.

## ④ Transitions (6 common types)

1. **Hard cut**: the vast majority; cut points land on narration phrase breaks [measured].
2. **Pan along red line (timeline tracking)**: camera moves horizontally along one red line, 1.3–1.8 s, with long-tail easing; the next card slides in at an angle from the right and settles flat.
   - [This film] Transition A: red line runs from the clipping's highlighted row to the investigation-wall counter label; camera follows in 1.1 s with short motion blur along the velocity direction (7 accumulations, coefficient 0.6).
3. **Push into a document or photograph → hard-cut to a high-resolution scan of the same image**: 1.0–1.4 s, S-curve easing.
   - [This film] Transition B: push to fill with the small photo on the wall (logarithmic interpolation to z ≈ 9.6); hard-cut to a large-format scan of the same image (halftone dots grow from fine to coarse, reading as "a clearer version"); then into shot 3.
4. **Pull out from a single photograph → reveal the full collage surface**: ~1.0 s, fast-start long-tail (measured MC 2:30).
5. **Map color-block growth, route line tracing**: 2.5–3.5 s, in twos, with a solid red dot at the line head.
6. **Real hand page-turn, paper pull** (Missing Chapter signature): can be approximated in code as "paper slides in along an arc with changing shadow."

**Note**: "torn-paper transition" does not appear once in any of the 5 sample films. It is common on template websites, not Vox grammar. The first version of this demo used a torn-paper transition; it was replaced after the research was reviewed.

## ⑤ Rhythm and text

- **Shot duration** [measured, collage segments]:
  - Two tiers: slow (Missing Chapter) median 3.3 s, ~12 cuts/min, one card held 3–7 s, sustained by in-card line drawing and highlighting.
  - Fast (Psychedelic Posters 1.8 s, Johnny Harris 1.4 s) ~25–33 cuts/min, images barely move, rhythm comes from switching.
- **Alignment with voiceover:**
  - Highlighter, typing, and line-drawing speed is locked to narration speed, not to music beats.
  - Johnny Harris: "Each word must correspond to a movement or action within the animation" — he writes his scripts in two columns [primary source].
  - Joss Fong changes music approximately every 20 s [primary source].
- **Text:**
  - Names and locations use small serif type, white text below the photograph.
  - Black-background timeline headings typed out character by character, 13 chars/s, with one red line spanning the frame.
  - Quotations appear with an ink-bleed effect in handwriting, ~2 s, then a red bar follows line by line [measured].
  - [This film] clippings and cards use Songti SC (宋体), large labels use PuHui-Heavy, numbers use Anton.

## ⑥ Code implementation notes

> After merging into skill (2026-10-04 v0.4): the shared functions listed under "new code" in this card have been consolidated into `scripts/engine/lib/` (renamed to the unified MO / CAM / DG / TY / CH / UI / CL / TOON). Demo-specific code is in `scripts/engine/demos/y2_vox/`. For a library quick-reference and "how to choose a grammar for a voiceover segment" see `references/en/09-explainer-animation-grammar.md`.

- Reuse from skill:
  - `PAINT.cached`, `PAINT.scratch`: all paper pieces, photos, and clippings are pre-rendered as sprites
  - `PAINT.grain`: static grain
  - `PAINT.noise/fbm`
  - `KIT.densify/resample`: hand-drawn circles
  - `HUASHU.build/pose/draw`
  - Engine transition interface
- New code, now consolidated into lib (`lib/collage.js` / `camera.js` / `diagram.js` / `motion.js`):
  - `MO.step(t,12)`: twos stepping.
  - `CL.paperTile`: tileable paper texture, sampled on a torus so it is seamless, with fiber.
  - `CL.halftone`: grayscale to 45° halftone dots, batched as one path for one fill.
  - `CL.tornEdge`: torn edge.
  - `DG.hand / DG.drawPartial / DG.cum`: hand-drawn lines, revealed by length.
  - `CAM.motionBlur`: frame accumulation along the velocity direction.
  - New material objects for real footage: `MD.print` (print: white border, aged paper color, shadow, tape, croppable to a focal point), `MD.label` (black-background torn-edge label, typing at 12 fps), `MD.cover` (full-frame spread + focal point + push-in, for hard-cutting to live footage); shots use `CAM.track` glide and push, punch only for emphasis. The parametric clip y2 has been updated to this system: photos occupy 80–90% of the frame, camera defaults to 0.7 s move to the next item and 0.9 s highlight push (write `"camera": "snap"` in the top-level `data` spec to switch to 0.30 s pan / 0.28 s punch), no constant-velocity slow push.
  - `MO.bezier`: long-tail easing `(.33,0,.2,1)`.
- Demo-specific (`demos/y2_vox/vox.js`; `slideIn / highlight / stringPts` are now in lib as `CL.slideIn / CL.highlight / CL.stringPts`):
  - `slideIn`: tilted slide-in settling flat.
  - `highlight`: highlighter strip with rough edge, multiply.
  - `stringPts`: sagging red line.
  - `deskCam`: table-surface camera keyframes with end push-in.
- **Key architecture:**
  - Shots 1 and 2 share the same table-surface world and the same camera. Transition A uses `same` (A and B are on the same canvas), and the pan is handled entirely by the camera.
  - Shot 3 is a large black card on the table. Transition B uses `cut`, cutting on the frame that the push fills.
- **Performance**: shot 3 is 73/89 ms per frame (mean/peak); the Huashu sticker requires 16 border-offset passes per frame. The sticker border can be cached and only recomputed when the pose changes at 12 fps.

## ⑦ Representative works and primary sources

- Sample films:
  - Missing Chapter, *The case to rename this famous Christmas plant* https://www.youtube.com/watch?v=lLSUjl4WatY
  - *Where the 1960s "psychedelic" look came from* https://www.youtube.com/watch?v=9vuqI2v2IRs
  - Vox Borders, *China is erasing its border with Hong Kong* https://www.youtube.com/watch?v=MQyxG4vTyZ8
  - Johnny Harris, *The Internet Didn't Fail. It Was Taken.* https://www.youtube.com/watch?v=0rKDo3hKbVk
- Primary sources:
  - Vox art director Joey Sendaydiego interview https://www.storybench.org/how-vox-uses-animation-to-make-complicated-topics-digestible-for-everyone/
  - Joss Fong interview https://www.theopennotebook.com/2020/01/07/videogram-how-a-vox-video-explains-the-science-behind-the-first-photo-of-a-black-hole/
  - Johnny Harris, *How I Make My Maps* https://www.youtube.com/watch?v=GsojLuJpe_0
- Secondary: PremiumBeat, *Replicating Vox motion graphic* https://www.premiumbeat.com/blog/replicating-vox-motion-graphic/
- Demo film facts:
  - Le et al., ICML 2012, arXiv:1112.6209 https://arxiv.org/abs/1112.6209
  - Google Official Blog 2012-06-26 https://blog.google/innovation-and-ai/products/using-large-scale-brain-simulations-for/

## ⑧ The 3 most common mistakes

1. **Everything moving at 60 fps, smoothly.** Half the handcrafted feel of collage comes from the two-layer frame rate: camera glides, elements step. All smooth makes it look like a corporate promo; all 12 fps makes the camera nauseating.
2. **Faking Vox with template grammar**: torn-paper transitions, every image bouncing in, per-frame paper-texture flicker. None of these appear in the measured data. Vox photos appear on the cut, the paper texture is dead, and most transitions are hard cuts and push-ins. The more ornate the entries, the less it reads as "editorial work."
3. **Using the Vox logo yellow as a large background color, or using too many colors.** The yellow in the films is a single highlighter at `#DACF08`, used only to mark key passages. The body of the film is "black, paper white, one red" — three colors plus one accent is enough.

---

## Review and revisions (independent agent, finished film only, 8/10)

Review notes and how they were addressed:
- "Shot 3 goes pure black, breaking the single table surface": changed to a large black card stock laid on the same table, with table-surface texture visible at all four edges. Still the Missing Chapter black-card language, but the table surface is unbroken.
- "0–0.9 s completely still": the demo added an opening slow push (1.14→1.165) at the time. Current approach: place the first event within 0.3 s (photo appears on cut, highlighter or red line starts immediately), or open with a 0.17 s slam-in.
- "Halftone fills the full screen for too long": push shortened from 0.7 s to 0.6 s, pull-out from 1.0 s to 0.85 s. Pull-out start z=3.68 so the photo occupies the same screen width on both sides of the hard cut, and the large image gets tape in the same position — the hard cut reads as "switched to a high-res scan."
- "Blank card strip appears first": card strip changed to a tilted slide-in, typing starts at 0.4 s.
- "Character enters from the right, half-body on one frame": start position moved to 1100 px off-screen; the first 12 fps step is still off-screen.
- "Highlighter not finished before the film ends": typing, red circle, and highlight all shifted earlier; highlight finishes at 1.8 s, followed by a 0.3 s hold.
- "The word '猫' (cat) it imagined is too small": enlarged to 40 px.
- "Camera smooth throughout, twos not prominent enough": not changed. Measured Vox is "camera smooth at 24 fps, elements stepped at 12 fps"; changing the camera to stepped would contradict the measurements.

## QA (skill `scripts/qa.py`, final after revisions)

| Shot | Measurement window (s within shot) | Motion area% mean/peak | Still frame-pairs% | Jump frames | Per-frame time mean/peak ms | Deterministic |
|---|---|---|---|---|---|---|
| y2_s1 | 0.35–2.58 | 11.02 / 16.71 | 3.1 | 0 | 17.4 / 20.3 | ✓ pixel-exact |
| y2_s2 | 1.1–3.28 | 16.09 / 76.76 | 3.1 | 16 (consecutive 2.77–3.28 s) | 23.4 / 52.2 | ✓ pixel-exact |
| y2_s3 | 0.35–2.08 | 7.77 / 37.41 | 0.0 | 14 (consecutive 0.39–0.83 s) | 73.3 / 88.5 | ✓ pixel-exact |

Transition smoke test (one render per transition, slowest frame): y2_s2 (same) 55.2 ms; y2_s3 (hardcut) 43.8 ms

Notes:
- **Shot 2 jump frames** at 2.77–3.28 s are the 0.6 s push-in of the small wall photo to 9.6× zoom.
- **Shot 3 jump frames** at 0.39–0.83 s are the 0.85 s pull-out reveal after the hard cut.
- Both are full-frame scale moves and are by design. The hard cut itself falls on shot 3 frame 0, outside the measurement window.
- **Still frame-pairs 3.1%**: comes from twos on the element layer. In the first version with no opening camera movement this was 16.9%; after the review noted "0–0.9 s completely still" an opening slow push was added, bringing it to 3.1%. A lower number does not mean it is better: a constant-velocity slow push suppresses still frame-pairs while still reading like a slideshow; the right fix for an opening hold is to make the first event happen sooner.
- **Shot 3 per-frame 73/89 ms** is the heaviest of the three shots: the Huashu sticker requires 16 border-offset passes per frame, plus the black card-stock texture. To speed up, cache the sticker and only recompute on 12 fps pose changes.

Re-run: `uv run scripts/qa.py --project scripts/engine --film demos/y2_vox --out <path>` (the table above is the experiment figure; post-merge re-run numbers are in the regression table in reference 09).
