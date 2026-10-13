# Y1 · Kurzgesagt Flat Science Explainer: Animation Grammar Card

[中文](../../动画语法/y1_kurzgesagt.md) · **English**

One line: Turn an abstract concept into a concrete object; place it in a glowing world that can zoom infinitely; let the camera travel between scales. The environment layer (stars, particles) can keep moving gently at all times; the main subject and information change at voiceover nodes, then hold still.

Demo film: `scripts/engine/demos/y1_kurzgesagt/` (render: `render.py --film demos/y1_kurzgesagt`) (8 s, 3 shots, 2 transitions). Overview: `assets/动画语法/y1_kurzgesagt_总览.jpg`
Basis: research conducted on this style (research text and per-frame data are in the experimental archive and not folded into the skill; the numbers used here are excerpted into this card) (2025: two full films + 2014 "Immune System" measured frame-by-frame; official Skillshare course verbatim transcript). Numbers marked [measured] [primary] come from there; numbers marked [this film] are the actual parameters used in the demo film.

## Pre-flight checklist

1. **First write the visual metaphor for this segment: what physical object does the abstract concept become** (cell, gear, pipe, city, a drop of water…). For any sentence where you can't name the object, don't just put a glowing ball with a few label capsules.
2. **The orange central planet in the demo film and examples is one possible design — it is not this grammar's signature.** The central object changes shape and color per topic. In the parametric segment y1, the central object is defined by the spec: `data.center_style` (color, shape, whether to add an orbit ring) or `data.image` (crops a real image into the central object). If neither is written, a neutral style is generated from the name — no longer that orange planet. The segment only draws "central object + satellite nodes," which suits layered "what's inside" explanations. If your topic is not that structure, write your own shots (see `demos/y1_kurzgesagt/` and `lib/`'s `CAM`, `TOON`), or switch grammar.
3. **At least one state change per voiceover sentence** (pop-in, morph, drill-in, pull-out). Count sentence by sentence: two consecutive sentences with no change in the scene — add an event; don't fill it with floating and slow-push.
4. **Main subject holds still after settling.** The environment layer (star twinkle, particle drift, background clouds) can keep moving gently; don't add floating, breathing, or constant-speed slow-push to the main subject and labels.
5. **Pause before drilling in.** Before a scale transition, let the target object hold still for 0.3 s or more and light up, so the audience knows which one is being entered next. Use logarithmic interpolation for zoom (`CAM.zlerp`).

---

## ① When to use

**Use it:**
- Content about scale or "what's inside": from cell to galaxy, from one pixel to a model, or "zoom in and you'll find…." Scale transitions are this style's standard feature.
- Explaining mechanisms and systems: neural networks, the immune system, energy flow. Best for making invisible processes visible as glowing particles and connecting lines.
- Voiceover is calm, steady science-explainer narration. Kurzgesagt is ≈168 words/min; one hard-cut shot covers about 2 sentences [measured].
- When you need a "serious but charming" tone; can use a mascot or a flock of birds to deliver a punchline.

**Don't use it:**
- Real people, real events, archival evidence: flat cartoon weakens credibility — use Y2 collage instead.
- Steps or chains of reasoning: better understood written out step by step — use Y3 whiteboard.
- When the production budget is very tight. The quality of this style depends entirely on "something is moving in every frame." Official films take 1200+ hours each [primary]. A cut-corners Kurzgesagt looks like cheap PowerPoint.

## ② Visual composition

- **Choose an era first.** 2025 is dark: dark pixels occupy 61–68%, saturation median 0.84–0.89. 2014 is light-grey-white background, low saturation. The two must not be mixed [measured]. The demo film's first two shots use the 2025 dark palette; the third shot uses a bright daylight palette, imitating their practice of "swap the entire color temperature when changing a segment."
- **Palette** (2025 dark, measured from actual frames):
  - Base: `#05020F` / `#0E0631` / `#25155E`
  - Secondary base: `#191670`, `#3826A3`, `#5F58DB`
  - Accent cyan: `#32BAEE`, `#7DD3DC`
  - Accent orange-yellow (glowing body): `#F48301`, `#E07919`, `#FACC12`, glow core `#F9EF93`
  - Magenta: `#BE3A95`, `#C83C7F`
  - Highlight and white text: `#E7DFE1`, `#F9FCFB`
  - Rule: one dark base + 2–3 high-saturation accent colors; accents are complementary pairs (orange-yellow vs. indigo-purple, cyan vs. magenta) [measured + inferred]
  - **The dark-purple base above is a documented breakdown — do not copy it directly into a finished film.** The author has watched multiple AI-generated films and stated directly: "we need to avoid the garbage color scheme of blue and purple gradients, it's very AI slop." Deep purple starfield backgrounds are the most common one-glance AI tell in that type of film; `deliver.py` measures blue-purple backgrounds and red-lights them. For a dark palette, use `references/en/palettes.md`'s `ink` (dark ink) or `navy` (flat navy), keeping the rule of "one dark base + 2–3 high-saturation accents." In the parametric segment y1, set `"theme"` in the spec; if omitted, the default is flat dark ink.
- **Shape language**:
  - No outlines. Shadows use a one-stop-darker block of the same hue; highlights are a white ellipse or a single arc [inferred].
  - Rounded corners everywhere. Living things are blobby-organic shapes; character heads are round; limbs are round-tipped tubes.
  - Glowing objects must have a radial glow. The dark background exists precisely to make the glow work.
- **[This film] Two-tone flat shading**: `flat(c, path, base_color, shadow_color, highlight_color, v, w)`. Two offset passes inside the shape: lower-right leaves a shadow strip; upper-left leaves a thin highlight edge. v ≈ (10,12) px, w ≈ (4,5) px. Every part of Huashu (花叔) goes through this same pass, so he and the scene share one drawing style and don't look pasted on.
- **Composition**: main subject in the lower-third of the frame, leaving sky above for stars and annotations. Scene is split into 5–6 parallax layers: starfield d=0.05, moon 0.12, distant mountains 0.3, near slope 0.65, main subject 1.0, foreground leaves 1.5 (foreground is blurred and dark). Kurzgesagt has not published their layer count; measured as 2–5 [inferred].
- **Characters**:
  - Kurzgesagt bird: egg-shaped body, large white eyes, small black pupil offset forward, orange triangular beak. Wings are leaf-shaped, one shade darker than the body; each bird gets a different color [primary + inferred].
  - [This film] The cat is a teardrop body with a round head, triangular ears with magenta inner-ear; large white eyes. The robot is a round-cornered shell with a dark-screen face and one glowing lens eye. Huashu (花叔) uses `HUASHU.build`'s point pose; every part goes through two-tone flat shading.

## ③ Motion

- **Official easing** [primary, Skillshare]:
  - Standard motion: 50 frames (0.83 s at 60 fps). For crispness, use 30/20/10 frames. For a pop, use 5–10 frames.
  - Looping motion uses Easy Ease 33.3%, approximately `cubic-bezier(.333,0,.667,1)`.
  - Other motion uses 75% influence, approximately `cubic-bezier(.75,0,.25,1)`: very soft start, fast middle, very soft end.
- **Pop** [measured]: a card grows to 90% in 0.25 s, overshoots to 108% at frame 20 (probe card goes to 114%), returns to 100% at ≈0.5 s.
  - [This film] Recognition label uses `backOut(q, 1.1)`, duration 0.5 s.
- **Stagger**: same-type elements stagger 10–20 frames; limb joints stagger 3–4 frames; 20-frame pause between actions [primary].
  - [This film] Title enters character-by-character, 45 ms stagger, each character 0.5 s cubicOut. Pixel-cat 144 blocks stagger by distance to center 35 ms/block, each block 0.5 s backOut(1.4) flying in from the edges. Neural-network layers light up one by one, 0.32 s apart, nodes pop 0.35 s.
- **Environment micro-motion vs. subject pause**: in 2025 films, completely still intervals within a 0.5 s window account for only 0.3% of runtime [measured]. What's moving is primarily the environment layer (star twinkle, particle drift, glow) and the one thing currently being explained.
  - Explainer shots: main subject and information elements hold still after settling; actions fire at voiceover nodes (pop-in, morph, push-in, drill-in).
  - Pure-atmosphere shots (opening, breather between segments): light environment motion is fine — star twinkle, particle drift, background slow-pan.
  - Blink: 5 frames close, 10 frames open, irregular intervals; **eyes do not close all the way to 0** [primary].
  - [This film] 170 stars, each flickering at its own phase 1–3.5 rad/s. Foreground leaves `blur(7px)` for depth of field. Robot bobs ±12 px; thruster glow uses dual-sine jitter at 23/37 Hz. Cat tail swings on two-segment Bézier. Grass sways at 2.1 rad/s. Firefly particles drift at the 0.8–1.3 layer. Signal pulses loop continuously along the connecting lines.
- **Camera** [measured]:
  - In 2025 films, about 1/3 of runtime involves zoom, ≈10% pan, ≈5% rotation; pull-out is more common than push-in. Most zooms are scale travel and reveals, not gap-filling.
  - New-film point-naming: hold still → slow push ≈0.9 s to zoom in → hold still; switch nodes 0.7 s pan; only the reveal moment warrants a 0.28 s punch-in or 0.17 s slam; hold duration follows voiceover; after pushing in, use pull-out (transition ④ rapid-pullout-reveal) to come back. Scale travel follows ④ timing separately.
  - [This film] Shot 1 uses 2.6 s constant-speed push 1.00→1.10 — this is old practice; don't copy it in new films.

## ④ Transitions (6 common types)

1. **Push in through → object color fills frame → new scene** (standard scale-transition form).
   - Measured: Immune System 1:48, ≈1.4 s, accelerate then decelerate, peak in the middle.
   - [This film] Transition B:
     - Camera pushes in logarithmically toward the lit-up output node (0.45 s, cubicIn) until it fills the screen with yellow.
     - At the midpoint ±3 frames, dissolve to the robot with yellow-glowing eyes. Both sides' highlights are upper-left; the cut is invisible.
     - Then cubicInOut 1.45 s pull-out (42→1), landing in the daylight palette.
     - Don't use expoOut: its initial slope is too steep; the first frame jumps through most of the scale range.
2. **Drill into an object; inside the object is the next world** (variant of the above).
   - [This film] Transition A, 1.0 s: camera pushes in logarithmically toward the robot's lens (`bezier(.75,0,.25,1)`, 1.1→60). The next shot is only visible inside the "lens circle"; the circle grows as the push-in proceeds until it fills the screen, with a ring of cyan light at its edge. The next shot simultaneously rises from 0.42× with expoOut.
3. **Rapid pull-out reveal**: 0.2–2 s, fast start, long tail (measured: each 0.2 s scales 1.074→1.040→…→1.0006). Used to connect micro and macro scales.
4. **Light or flash fills frame**: use a light source in the scene to create a white-out, ≈0.5 s.
5. **Sweep wipe**: an object or light band sweeps diagonally across the frame with speed lines, ≈0.4 s.
6. **Replicate and multiply to fill**: used for "so many that…," 3–6 s.

Two additional notes [measured]:
- Hard cuts are rare — about 5 per minute, timed to the start of voiceover sentences, 0–0.2 s before the sentence begins.
- Most other scene changes are designed transitions of 0.3–0.6 s, occurring every 4.6–6.7 s.

## ⑤ Rhythm and text

- **Shot duration** [measured]:
  - Hard-cut shot median 7–9 s, mean ≈11.5 s.
  - But a "visual unit" changes every 4.6–6.7 s via designed transitions.
  - At least one state change per voiceover sentence: label pop, annotation swap, morph, or transition.
- **Sync with voiceover**: voiceover sentence timestamps are the skeleton; hard cuts land 0–0.2 s before a new sentence begins [measured]. Music is composed after the finished film (Epic Mountain) [primary].
- **Text**:
  - Annotations: first draw a thin white leader line, then type out the text character by character at ≈40 characters/second; one voiceover sentence per annotation, held ≈3 s then erased character by character [measured].
  - Chapter title cards every 2–3 minutes, full-screen, words appear one by one, background blurred.
  - Label capsules have large corner radii, filled with saturated flat color, bold sans-serif text inside.
- **[This film]**:
  - 3 shots in 8 s is about 3× the normal density — only to demonstrate the full grammar within the demo. For real films, follow the 7–9 s per shot rhythm.
  - Titles use PuHui-Heavy 76 px, rising character-by-character.
  - Layer labels use PuHui-Medium 40 px with an extending underline.

## ⑥ Code implementation notes

> After being folded into the skill (2026-10-04 v0.4): the general-purpose functions in this card's "newly written" section have been unified into `scripts/engine/lib/` (renamed to the standardized MO / CAM / DG / TY / CH / UI / CL / TOON). The demo film's own code is in `scripts/engine/demos/y1_kurzgesagt/`. For a library quick-reference and "how to choose a grammar for a voiceover segment," see `references/en/09-explainer-animation-grammar.md`.

- Reuse from skill:
  - `PAINT.cached`, `U.rng`: determinism
  - `RIG.smooth`: smooth a point list into a Path2D; used for cat, mountains, leaves
  - `HUASHU.build/pose/details`: Huashu (花叔)
  - `PAINT.noise`
  - Engine segment table, transition interface, offscreen A/B buffers
- Newly written, now unified into the library (`lib/camera.js` / `motion.js` / `typo.js`):
  - `CAM.at(keys, t)`: keyframe camera; logarithmic interpolation for zoom. `CAM.zlerp` zooms by the same factor every frame so scale travel feels constant. New-film pauses and point-naming use `CAM.track` (default slow-push `push`, switch-node `glide`, pull-out `pull`; emphasis only with `punch`/`slam`, otherwise hold still). The parametric segment y1's highlight defaults to slow push; write `"camera": "snap"` in the top-level `data` for a punch-in.
  - `CAM.anchor`: smoothly moves the target point to screen center during zoom.
  - `MO.bezier(x1,y1,x2,y2)`: ports AE/CSS cubic Bézier easing into code, solved with Newton's method.
  - `MO.*`: sine, quint, expo, back, elastic, etc.
  - `TY.charsIn`: character-by-character entrance.
- Demo film's own code (`demos/y1_kurzgesagt/kurzgesagt.js`; `flat` has been moved to the library as `TOON.flat`, `layer` as `CAM.layer`):
  - `flat()`: two-tone flat shading.
  - `layer(c, cam, d, fn)`: parallax layer. Offset scales linearly with d; zoom scales as `z^d`, so background barely moves during deep pushes.
  - `Y1.cat`, `Y1.bot`, `Y1.bird`: the three characters.
  - `Y1.lensAt(t)`: screen coordinates of the lens circle for transition A.
- **Key architecture**:
  - The camera is determined solely by the global timeline. Inside a transition window, the engine continues drawing the previous shot into buffer A as normal; the previous shot computes its own "drilling-in" camera.
  - Scale transitions are therefore always vector re-renders — no 1920-wide bitmap upscaled 60× into a blur.
  - Transition functions (`transitions.js`'s `lensReveal`, `matchCut`) only handle "how A and B are composited."
- Engine changes (applied only to this experiment's copy):
  - Any segment in `eras.js` can write `dur` (seconds).
  - Beat-hit camera impact defaults to off; `transition.punch:true` to enable. Explainer films shouldn't have beat-jolt impacts.

## ⑦ Representative works and primary references

- Reference films:
  - How Are Memories Stored Inside Your Brain? (2025) https://www.youtube.com/watch?v=PqtggjVAi8M
  - Why Humanity Will Never Leave The Solar System (2025) https://www.youtube.com/watch?v=Cyl3X88KEgg
  - The Immune System Explained I (2014) https://www.youtube.com/watch?v=zQGOcOUBi6s
- Official course (easing, looping, bird, character animation — verbatim transcript):
  - Skillshare "Motion Graphics with Kurzgesagt" Part 1 https://www.skillshare.com/en/classes/motion-graphics-with-kurzgesagt-part-1/631970755
  - Part 3 https://www.skillshare.com/en/classes/motion-graphics-with-kurzgesagt-part-3/140140401
- Official behind-the-scenes:
  - 1200 hours per film: https://www.youtube.com/watch?v=uFk0mgljtns
  - Official description: https://kurzgesagt.org/what-we-do?visit=videos
- Music: Epic Mountain https://www.epic-mountain.com

## ⑧ The 3 most common mistakes

1. **Turning "always in motion" into everyone breathing.** Measured: still intervals in 2025 films are only 0.3% of runtime, but what's moving is the environment layer and the one thing currently being explained — not every element floating. Explainer shots: main subject holds still after settling, actions fire at voiceover nodes. Atmosphere shots: keep light environment motion like star twinkle and particle drift. Movement cobbled together from full-cast floating and constant slow-push still reads like PowerPoint.
2. **Linear interpolation for zoom, or upscaling a bitmap.**
   - Linear z interpolation is slow at first then lunges at the end; the sense of traveling through scale breaks. Use logarithmic interpolation.
   - Upscaling the previous shot's frame 20× produces mosaic blur. The scene must re-render itself at the larger z.
3. **Bright and cluttered color scheme, or adding outlines to objects.**
   - 2025 Kurzgesagt is "dark base + 2–3 glowing accent colors"; the glow carries the frame.
   - Add black outlines or use a mid-brightness background and it slides toward children's picture books or corporate flat illustration.
   - Shadows use one stop darker in the same hue — not grey.

---

## Review and revision (independent agent watching the finished film only, 7/10)

Review findings and how they were handled in this pass:
- "Cat, grass, and hills have outlines — looks like a children's picture book": grass blades changed from strokes to filled thin triangles; the bright edge on the hilltop reduced to just one stop above the base color.
- "Black patch in the lower-left looks like a smudge": foreground leaves given `blur(7px)` for depth of field; color lifted from near-black to `#0E0631`.
- "Title disappears in one frame": changed to 0.55 s sineInOut fade-out.
- "Shot 3 cat turns from orange to black without explanation": orange cat stays at Huashu's (花叔's) feet as "the familiar one"; above the black cat, first show a leader line and small text "没见过的猫" (unfamiliar cat), then pop the recognition label.
- "At 7.8 s bird clips through the robot": bird's vertical position moved to 175/225 px.
- "7.1–8.0 s almost completely still": the demo film added a 4%/s slow push at the time. Current approach: place an event at the end (rapid pull-out to see the full picture, or drill into the next layer), then hold still.
- "At 3.03–3.10 s pixel-cat clipped in half by the lens circle": not changed. This is the expected appearance during the "drill-in through the lens" reveal.

## QA (skill `scripts/qa.py`, 2026-10-04, final post-revision)

| Shot | Measurement window (s within shot) | Motion area% avg/peak | Still-frame pairs% | Jump frames | Per-frame time avg/peak ms | Deterministic |
|---|---|---|---|---|---|---|
| y1_s1 | 0.0–2.58 | 1.57 / 2.58 | 0.0 | 0 | 32.9 / 34.6 | ✓ pixel-exact |
| y1_s2 | 1–2.68 | 3.36 / 4.42 | 0.0 | 0 | 6.1 / 7.2 | ✓ pixel-exact |
| y1_s3 | 0.9–2.68 | 17.94 / 91.88 | 0.0 | 8 (1.04–1.28 s consecutive) | 11.2 / 16.0 | ✓ pixel-exact |

Transition smoke test (render each transition once, slowest single frame): y1_s2 (k_lens) 48.3 ms; y1_s3 (k_fill) 36 ms

How to read:
- **Shot 3's 8 jump frames** fall at 1.04–1.28 s as a continuous stretch, exactly when the "pull-out from the robot's eye" 42×→1× is at its midpoint — the full screen is scaling, so motion-area peak is 92%. This is a designed scale transition, not a single-frame glitch.
  - The first version used expoOut, whose initial slope is too steep — the first frame jumped from 42× to 15×; both the review and QA flagged it.
  - Changed to cubicInOut; peak falls in the middle, consistent with measured "push-through zoom" shape in Kurzgesagt.
- **Shot 1 at 33 ms/frame**: foreground leaves have `filter: blur(7px)` for depth of field, slower than the 9 ms before the blur was added; still well below the 150 ms ceiling.
- Motion area 1.6–3.4% looks low because Kurzgesagt's micro-motion is "many small things each moving independently": stars, particles, tails, floats, pulses. Measured: completely still intervals in 2025 films are only 0.3% of runtime; all three shots here have 0% still-frame pairs — consistent. But 0% still-frame pairs only means the environment layer is moving, not that the explainer is good. Still check whether the extracted frames are just flipping like slides.

Re-run: `uv run scripts/qa.py --project scripts/engine --film demos/y1_kurzgesagt --out <dir>` (numbers above are from the experimental run; post-skill-integration re-run numbers are in the regression table in reference 09).
