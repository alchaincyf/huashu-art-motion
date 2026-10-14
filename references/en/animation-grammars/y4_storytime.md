# y4 · Storytime Character Animation (YouTube storytime animation)

[中文](../../动画语法/y4_storytime.md) · **English**

> One-line grammar: **voiceover is the lead, pictures are "reaction memes" scored to the voiceover — the character snaps between a few poses (0.1 s) then freezes, and the punchline lands by cutting to a big reaction close-up and going silent at that exact moment.**

Representatives: TheOdd1sOut (James Rallison), Jaiden Animations, Domics. Tools: according to Jaiden's FAQ and secondary sources, all three used Flash / Adobe Animate in their early work (no primary source text retrieved for this; treated as background only).

---

## ① When to use it

**Use it:**
- First-person experience stories, disaster stories, "the first time I …": the voiceover has a setup, escalation, and a punchline with a pause it can land on.
- When the audience is there for "the person": the creator's cartoon avatar appears every episode; audiences follow the persona, not the draftsmanship (Pappis's genre study: avatars "can often be told apart only by their hairstyle").
- Limited budget, need for reliable weekly output: one character, five or six poses, and three mouth shapes can carry a full episode.

**Do not use:**
- Information-dense tutorials, data explainers → use y5 kinetic type or infographics. Audiences will stare at the character waiting for the joke and won't retain numbers.
- Content without a "self" (industry news, product comparisons) → the character has no stance to perform and becomes a talking sticker.
- Voiceover that is not funny and has no pauses → this style amplifies the voiceover; it will not save it.

## ② Visual composition

**Framing**
- Medium shot (waist up, head occupies 25–35% of frame height) is the default angle; character is centered with a slight offset to one side, leaving the other side for "the thing being talked about" (computer, counterpart, object).
- Background establishes only "where we are": a wall, a desk, a window — 3–5 large color blocks. A white or flat-color background works perfectly well (Pappis: "a white background or a rough scene sketch").
- Reaction shots remove the environment: face fills the frame (head radius ≈ 1/3 frame height), background switches to a flat color with vignette.
- Punchline shots often reverse this: cut to a **wide shot**, making the character very small ("small and helpless" is itself the joke).

**Color values (this demo film's actual values)**

| Area | Value | Note |
|---|---|---|
| Skin | `#FFE2CC` | Light, near-white — TheOdd1sOut's "marshmallow man" is pure white; Jaiden is warm white |
| Hat / white T | `#FFFFFF`, hat band `#E4E4E8` | White objects held by black outline |
| Shorts | `#CDBB97` | |
| Character line | `#1B1B1F` | Darkest in the film |
| Wall / desk / floor | `#DCE9EC` / `#E2C29B` / `#E8DCC8` | Low saturation, high value: background always "lighter" than character |
| Background line | `#5B6470` 3px | Lighter and more than half as thin as character line |
| Reaction-shot void | `#3D405B` + radial vignette | Cold and dark, focusing all attention on the face |
| Mouth / tongue / blush | `#6E2430` / `#F07B7B` / `rgba(255,140,120,.35)` | The only saturated color inside the mouth; very visible as the mouth opens and closes |

**Line width:** character line = head radius × 0.05 (minimum 4 px) — medium shot R=165 → 8 px, big close-up R=360 → 12 px, wide shot R=95 → 6 px. Line weight scales with the shot zoom (Flash default behavior); background line is fixed at 3 px. **Character line ≥ 2× background line** is the root of this style's "character always pops."

**Shape language:** all round, all blunt. Head is a slightly squashed circle (1.0R × 0.93R), body is a bean (1.0R × 1.2R), full height 3.2R — **head is ~58% of total height**. Arms are round-ended tubes with no elbow and no fingers; the hand is a circle. No right angles except on props.

**Character design (Huashu storytime version)**
- Keep two signatures: **pure white fisherman's hat** (round-cornered trapezoidal crown + wide brim angled downward + light-gray band), **round-frame black glasses** (frame line 1.5× the outline weight — the glasses are this face's "eyes"). Keep only the white T-shirt, khaki shorts, and black watch (a small black patch on the near-side wrist) from the original design.
- Eyes are black dots inside the lenses (0.075R) with one white highlight; "dead fish eyes" shrink the dot to 0.035R and remove the highlight.
- Expression is driven mainly by **eyebrows** (the short, thick line between the brim and the frame): raised = surprise; inner ends raised = distress; flat = deadpan. Mouth has only five shapes: slight smile arc, flat line, wave (worry), half-open, fully open.
- A bit of black hair shows at the temples, telling the audience there is hair under the hat.

## ③ Motion

**Original film measurements (captured this session, 480p repost, trimming 10 s from each end; method: 160×90 grayscale per-frame difference)**

| | TheOdd1sOut "Mom's Punishment" (30 fps, 475 s) | Jaiden Animations "Being Not Straight" (24 fps, 902 s) |
|---|---|---|
| Average shot length ASL | **2.43 s** (median 1.87 s, quartiles 1.03–3.07 s) | **5.73 s** (median 3.21 s, quartiles 1.67–6.67 s) |
| Fully still adjacent frame-pairs | **70.7%** | 51.2% |
| Still segment duration | Median **0.40 s**, p75 0.70 s | Median 0.08 s (= twos pause) |
| Motion segment duration | Median **100 ms** (3 frames) | Median 42 ms (1 frame) |

Reading: TheOdd1sOut is **fast cut (0.1 s) → freeze (0.4–0.7 s) → fast cut again**, with 70% of the time the image completely still; Jaiden has **continuous movement in twos** (12 drawings/s) with longer shots. Toon Boom's interview with Hallis Blaney, animation supervisor of Netflix's *Oddballs*, puts it best: "TheOdd1sOut is pose-to-pose, very little animation … basically switching between pictures" — the hardest part of adapting it for a series was keeping that snappiness without going "too soft, too slow." This demo film takes a middle ground: pose snapping from TheOdd1sOut, breathing and mouth sync from Jaiden.

**Demo film parameters**

| Motion | Method | Number |
|---|---|---|
| Character frame rate | All character motion stepped at 24 fps (`MO.step(t,24)`); shots run at 60 fps smooth | Flash default 24 |
| Pose snap | Arm target point `expoOut` interpolation | **0.10 s** (2–3 frames at 24 fps) |
| Pose-snap rebound | Body squashes 7% vertically on the snap, Ebberts spring rebound (volume conservation, horizontal inverse) | `settle(dt, -0.07, freq 3.5, decay 9)`, settles in ≈0.35 s |
| Mouth shape | Reads voiceover RMS envelope; **only one shape change allowed per 1/12 s** (twos); three mouth shapes | Envelope <0.06 closed, <0.22 half-open, else fully open |
| Talk head-bob | Head drops when mouth opens | 0.015R × mouth level |
| Breathing | Body vertical scale | ±1.2%, period 1.6 s |
| Blink | Fixed schedule, interval 2.4–3.6 s | Eye closes 2 frames @24 fps (83 ms); "deadpan" slow blink 3 frames |
| Eye direction | Black dot shifts toward the thing being looked at | 0.09R |
| Shot | Demo uses medium shot, close-up, near-shot slow push, and wide slow pull (every shot has a slow push — old approach); new films default to hold, use hard cuts and jump-ins for changes, slam-in only for the punchline | Demo: medium +3.5%/2.0 s; close-up +6%/1.2 s; wide 0.53→0.50 (quintOut); near 1.90→1.98 |
| Opening | Shot zooms from 1.04→1.01 (0.5 s expoOut), replacing "first frame static" | |
| Sweat drop | Slides down the temple | 0.9 s, expoOut blended with linear |
| Lens flare | White diagonal strip sweeps across both lenses | 0.3 s |
| "?" | Pops up above the head, backOut 30% overshoot, then ±3° sway | 0.26 s |

Entry / exit: storytime almost never has an "entry animation" — the character is already in position, already speaking, on the first frame of the cut. Props and symbols (?, !, sweat drops, numbers) use bounce-in (`backOut`, 15–30% overshoot).

## ④ Transitions (5 common types)

1. **Hard cut** — the vast majority. One voiceover sentence = one shot; the shot changes when the sentence changes. Demo film S3→S4 (close-up → wide shot of the same room) is a hard cut; the scale contrast makes the joke.
2. **Smash cut to reaction close-up** — new frame is there on frame 1, bounces from 1.22× back to 1 with a spring (freq 3, decay 11); first 2 frames have a 55% white flash overlay, paired with a low-frequency thud. Used for "says something outrageous → see his face." `TRANSITIONS.smash`.
3. **Whip pan** — camera flings in the direction of "the thing being looked at," `expoInOut` 0.26 s; mid-motion 16 frames of offset accumulation for horizontal motion blur, paired with whoosh. Used for sight-line shifts like "I open my computer → (screen)." `TRANSITIONS.whip`.
4. **Jump-in / punch-in** — same camera position, cuts directly to ~2× closer framing without changing the background. Used for "he repeated it," "he realized," "the punchline line." Demo film S4→S5: wide shot says "these…", then on the breath before "put it where," a hard cut to 1.9× near-shot — the punchline face has to be readable. Requires the wide and near shots to be **the same world canvas with only the camera changing** (`world.js`); otherwise the jump will break.
5. **Over-shoulder / POV** — cuts to what he is seeing (screen, phone, counterpart), with a portion of the back of his head in the foreground. Demo film S2: Huashu's back — white hat + hat band, ear, glasses arm over the ear, short black hair, back of neck, white T collar; the screen side has a ring of cool-color rim light (the first version was a pure black silhouette, which the review read as "another shadow person"); the foreground does not follow the camera push, only rises with the breathing, creating parallax with the screen — the image immediately has depth.

## ⑤ Rhythm and text

- **Shots follow voiceover sentences, not music beats:** one sentence ≈ one shot. Demo film 5 shots average 1.75 s (2.0 / 2.4 / 1.2 / 1.65 / 1.5), within TheOdd1sOut's measured quartile of 1.03–3.07 s.
- **Transitions go in the breath between sentences; subtitle and cut happen on the same frame:** the first version placed the whip pan on the first two syllables of "in one breath"; the review noted "cut in the middle of a sentence"; changed to: L1 ends (1.87 s) → 2.0 s whip → 2.26 s lands → 2.30 s next line starts.
- **Reaction shot goes in the silence between sentences:** demo film S3 has 1.3 s with no dialogue, only cricket chirps — that pause is the punchline. In editing: after the outrageous line ("three thousand lines") **do not immediately cut to the next line** — leave 0.8–1.5 s for the face.
- **Hold ≥ 0.9 s after the punchline:** "?" pops at 7.80 s, film ends at 8.75 s — enough for the sound effect tail to finish naturally (first version held only 0.4 s; review: "the laugh beat was cut").
- **Text:** YouTube native storytime does not burn subtitles (relies on CC); only text that "needs to be seen" is in the frame — on-screen display text, key numbers (demo film "3000 lines" uses PuHui-Heavy 230 px, `#FFCB6B`, 23% overshoot slam-in). Chinese platforms need burned subtitles: white 50 px, black 10 px outline, full sentence cut in and out, no animation (animated subtitles compete with the character for eye focus).
- In-frame numbers sync to the **exact syllable** in the voiceover: the syllable "三千" (three thousand) at 3.70 s = 3000 slam-in = low-frequency thump = screen shake (9 Hz, 0.3 s decay).

## ⑥ Code implementation notes

> After merging into skill (2026-10-04 v0.4): the shared functions listed under "new code" in this card have been consolidated into `scripts/engine/lib/` (renamed to the unified MO / CAM / DG / TY / CH / UI / CL / TOON). Demo-specific code is in `scripts/engine/demos/y4_storytime/`. For a library quick-reference and "how to choose a grammar for a voiceover segment" see `references/en/09-explainer-animation-grammar.md`.

- **Reuse from skill**: engine (segment table, transition off-screen compositing of old and new segments, `GLOBAL_OVERLAY`), `render.py`, `PAINT.cached` (entire room background cached), `U.rng` seeded random (color block layout for the code waterfall).
- **Two engine changes (already merged into skill engine)**: any segment in the segment table can specify `dur` in seconds directly, without mapping to eighth notes — storytime cuts to voiceover, not to beats; transitions can set `punch: 0` (or film-level `window.PUNCH = 0`) to disable the engine's default beat-impact — storytime has no beat.
- **New code, now consolidated into lib** (`lib/toon.js` / `typo.js` / `camera.js` / `motion.js`, transitions into `transitions.js`):
  - `TOON.bean(c, {x, y, s, char, pose, expr, mouth, blink, look, squash, bob, tilt, lw})`: front-facing bean character, all Path2D procedural, returns coordinates for both hands and the head (for positioning props and symbols). This code-drawn bean character is reserved for demos and rough animatics: after reviewing films made by several models, the author decided code-drawn figures read immediately as AI-generated (direct quote: "小人和机器人角色都太差了" — "the little people and robot characters were all terrible"). The parametric clip y4 only accepts your own frame library (`data.character.frames`, AI-generated frames, see reference 10 and `references/en/character-detail.md`); it will fail on startup without a frame library.
  - `TOON.POSES`: rest / talk / point / type / shrug / stiff — each pose is just the target position of both hands relative to the shoulders (unit: head radii).
  - `TOON.mouth(t)`: reads `window.VO_ENV` (60 fps RMS envelope exported from the audio script), quantizes to twos as 0/1/2.
  - `MO.springHz / settle / backOut / expoOut / step`, `CAM.with`, `CAM.drift` (demo-used camera hand-wobble; new films hold still, no drift), `TOON.sweat`, `TOON.mark`.
  - Transitions `whip`, `smash` (the y5 fill-zoom transition is now named `fillZoom` in lib; plus `bands / push`).
- **This film `y4_storytime/story.js`**: `STORY.poseAt(keys, t)` (pose timeline + pose-snap rebound), `blinkAt`, `alive` (head-bob + breathing), subtitle overlay.
- **Audio (in experiment archive as `build_y4.py`, not merged into skill)**: places voiceover, synthesizes sound effects (whoosh, keyboard, bloop, thump, thud, cricket, pip, boing), simultaneously exports `vo_env.js`. The voiceover is macOS `say` Eddy as a placeholder — **replace with real voiceover for the final film and re-export the envelope; mouth sync follows automatically**.
- **Three shot scales in the same room**: `y4_storytime/world.js` draws the room as one world canvas (x −1000..2900, y −700..1700, static portion fully cached); S1 (zoom 1.01–1.045), S4 (0.53→0.50), S5 (1.90→1.98) only change `CAM.with`. The bookshelf, plants, and pendant light only visible in the wide shot are already in the world. The world must be larger than the widest shot, or camera drift will expose a black edge (all three black edges in the first version had this cause).
- Key parameters: character at 24 fps, mouth 12 shapes/s, pose snap 0.1 s + 7% rebound, character line 0.05R.

## ⑦ Representative works and primary sources

- TheOdd1sOut channel: https://www.youtube.com/@theodd1sout; repost used for this measurement "Mom's Punishment": https://www.bilibili.com/video/BV14s411M7x4
- Jaiden Animations channel: https://www.youtube.com/@JaidenAnimations; repost used for this measurement "Being Not Straight": https://www.bilibili.com/video/BV1xu411r734
- Domics channel: https://www.youtube.com/@Domics
- Toon Boom × Atomic Cartoons, *Oddballs* YouTube-to-series ("pose-to-pose, very little animation," "he never did lip sync on YouTube," "too soft, too slow"): https://www.toonboom.com/atomic-cartoons-on-bringing-oddballs-from-youtube-to-series
- Konstantinos Pappis, *The Odd Ones Out: The Rise of YouTube Storytime Animation* (Animation Studies, genre history and visual grammar: round-face avatars, white background, no frame-by-frame, closer to an animatic): https://journal.animationstudies.org/article/id/135/
- TheOdd1sOut Wikipedia ("marshmallow man"): https://en.wikipedia.org/wiki/TheOdd1sOut
- Dan Ebberts inertial rebound expression (source of freq 3 / decay 5): http://www.motionscript.com/articles/bounce-and-overshoot.html
- Practitioner tip "add a little bounce on pose change": https://forum.wickeditor.com/t/whoever-wants-to-make-a-storytime-animation/5940

## ⑧ The 3 most common mistakes

1. **Treat it as full animation — everything moves.** The life of this style is "fast cut + freeze": TheOdd1sOut is static 70% of frames. Everything drifting slowly makes it soft and rhythmless (the *Oddballs* team's nightmare: "too soft, too slow"). Pose snaps must be fast — 0.1 s — and then **actually stop**; continuous micro-movement is only for breathing, blinks, and small background loops at ≤1–2% amplitude.
2. **Background is as polished as the character.** Background saturation, contrast, and line weight all need to be one tier below the character (background line 3 px gray vs. character 8 px black in this film). An elaborate background pulls the audience's eye away from the face, and the voiceover punchline is lost.
3. **Reaction shot has no silence.** Immediately following the outrageous line with the next line is throwing away the punchline. The reaction shot must land in the voiceover silence, at least 0.8 s. Frame holds still, giving only one or two small details (sweat drop, slow blink, brow drop); to heighten the moment, jump one step closer (hard cut to ~2× near-shot) or slam in at 0.17 s — do not fill it with a slow constant push.

---

## Demo film

- Finished film: `scripts/engine/demos/y4_storytime/` (render: `render.py --film demos/y4_storytime`) (8.75 s, 60 fps, with placeholder voiceover + sound effects); one-frame overview per shot: `assets/动画语法/y4_storytime_总览.jpg`
- Project: `scripts/engine/demos/y4_storytime/` (`eras.js` segment table, `story.js`, `world.js` world canvas, `s1_desk.js / s2_screen.js / s3_react.js / s4_wide.js / s5_close.js`); shared code in `scripts/engine/lib/`
- Shot list (镜头表): S1 medium shot facing camera (0–2.0 s) → whip pan → S2 over-shoulder looking at screen, code waterfall + "3000 lines" (2.0–4.4 s) → smash cut → S3 big reaction close-up, silence (4.4–5.6 s) → hard cut → S4 same-room wide shot "I asked it: these…", glances at computer, points at computer (5.6–7.25 s) → jump-in → S5 near shot hands-out shrug "put it where?" + "?", hold (7.25–8.75 s)

## Review and revisions (independent agent, finished film only)

First version review: 5 "must fix" items, all addressed:
1. Three black-edge glitches (S1 left/top, smash-cut rebound goes below 1×, S4 camera drifts down) → world canvas enlarged + `smash` zoom clamped to ≥1. Post-revision per-frame scan of all four edges: 0 frames with black edges.
2. Punchline has no breathing room → S5 separated as a jump-in shot, "?" holds 0.95 s.
3. S1 and S4 are not the same room → changed to one world canvas with only the camera changing.
4. Over-shoulder silhouette reads as another person → back-view identifiers drawn in + rim light.
5. Whip pan lands in the middle of a sentence, second subtitle is late → whip pan moved to the breath gap, subtitle synced to the cut frame.
2 "could be better" items addressed: S3 second cricket 0.15 s after first (sound effect was at 5.23 s, expression at 5.38 s — misaligned); S4 two pauses get "glance at computer → look back at camera" and pointing at the computer on "these." Subtitles: removed the space between Chinese and numbers ("让AI帮我," "3000行").
Not changed: lines are uniform-weight vector lines with no hand-drawn wobble — that is how TheOdd1sOut/Jaiden's Flash vector lines actually look; kept as-is.

## qa.py numbers (after revisions, `uv run scripts/qa.py --project scripts/engine --film demos/y4_storytime`)

| Segment | Motion% | Still frame-pairs% | Jumps | Mean/peak ms | Deterministic |
|---|---|---|---|---|---|
| s1_desk | 1.47 | 8.6 | 0 | 9.9/10.4 | ✓ |
| s2_screen | 6.0 | 0.0 | 0 | 1.7/3.8 | ✓ |
| s3_react | 1.73 | 0.0 | 0 | 5.6/6.1 | ✓ |
| s4_wide | 0.77 | 16.2 | 0 | 9.6/9.9 | ✓ |
| s5_close | 3.27 | 3.1 | 0 | 10.9/11.4 | ✓ |

Transition smoke test (peak per whole frame): whip 47.9 ms, smash 10.1 ms, cut 15.7 / 20.5 ms. The first version reported 1 jump frame each in s1, s2, and s4 (opening settle, 3000 slam-in, wide-shot opening fast pull); all 0 after revision.
Reading this table: qa's heuristic "still frame-pairs >40% reads as stutter" **does not apply to storytime** — TheOdd1sOut's original film is 70.7% still adjacent frame-pairs; that is style, not stutter. This film's still frame-pairs are 0–16%, more "alive" than the original, intentionally taking the Jaiden-style continuous breathing. To more closely match TheOdd1sOut, turn off breathing, head-bob, and small background loops and keep only mouth sync and pose snapping (still frame-pairs will rise substantially; not measured here).
