# y5 · Kinetic Typography / Infographic Motion (kinetic typography)

[中文](../../动画语法/y5_kinetic_type.md) · **English**

> One-line grammar: **words are the performers — each keyword slams in on a beat accent, the main word is large enough to read in a glance, the rest rise from their slots to align with the ear; the frame always has one focal point; camera and texture keep moving; once a word lands it stays still.**

Lineage: Saul Bass's *North by Northwest* (1959) title sequence is widely credited as the first large-scale use of kinetic type in a feature film; after 2008, YouTube lyrics and quote kinetic type (the After Effects generation) made it the standard grammar for explainer openings, listicles, quotes, and data openers.

## Pre-flight checklist

1. **Confirm this segment should let words be the lead.** Only use this for lists, key phrases, numbers, and chapter cards; if a full segment runs more than 30–60 s as pure text, switch grammar, or insert an image or evidence object (screenshot, code card, chat bubble) every 2 pages.
2. **Count the words.** Main word ≤4 characters; supporting sentence ≤14 characters; only one thing entering the frame at a time. If it exceeds this, split the page — do not shrink the font to fit.
3. **No more than 3 consecutive identical page layouts.** "Large word + supporting sentence + top-left label" four times in a row is a slideshow; break it with a number slam-in page, an evidence object page, or a fill-zoom transition.
4. **Write every landing point as a beat number or a word in the voiceover.** If it is not on the beat grid and not aligned to a word, remove it or move it up.
5. **Once a word lands, it stays still.** Give movement to beat micro-impacts, page changes, and evidence-object entries; the main word does not drift or breathe.

---

## ① When to use it

**Use it:**
- Explainer / list / "X stages" / "3 reasons" openers and chapter cards: information is **structure** (how many, which one, from what to what) rather than imagery.
- Quotes, key phrases, one-sentence conclusions: "reading while listening" forms stronger memory than "listening and trying to remember."
- Number explainers: one number, one shot — the number itself is the lead.
- Voiceover has clear stressed words ("not writing code — **saying what you need**").

**Do not use:**
- Telling a story, emotional arcs → no human face; audiences struggle to connect (use y4 character).
- Long explanatory voiceover with wall-to-wall text → audiences will read, not listen, and can't keep up. Using it for an opener, chapter card, or conclusion card is fine; a full film over 30–60 s of kinetic type is fatiguing.
- Long lists (>5 items) → change to a static infographic and explain slowly.

## ② Visual composition

**Layout:** one main word per screen. Main word left-aligned, pressed to the left 1/3–1/2 of the frame (or mirrored right); supporting sentence tucked below the main word; opposite side holds one "evidence object" (code card, chat bubble, checklist). Small label ("Stage 01") and progress track in the top corner. At least 130 px margin on all sides.

**Type-size ladder (this demo film):** main word 340 px (PuHui-115 Black) : supporting sentence 96 px (PuHui-105 Heavy) : label 40 px (PuHui-85 Bold, letter-spacing 6 px) ≈ **3.4 : 1 : 0.4**. The main word must be readable in 0.3 s, so it is kept to 2 characters.

**Color:** each chapter gets one full-screen background color; changing chapter = changing background color (color itself is the chapter number).

| Shot | Background | Main word | Accent |
|---|---|---|---|
| Title | Yellow `#FFD23F` | Ink `#111111` | Coral circle `#FF5A36` with white "3" inside |
| 01 Complete | Coral `#FF5A36` | White | Yellow highlighter `#FFD23F` |
| 02 Dialogue | Navy `#14213D` | Yellow | Yellow highlighter, blue bubble `#3A86FF` |
| 03 Agent | Off-white `#F4EFE6` | Ink | Coral underline, green check `#2BB673` |

Whole film: 4 background colors + ink + white; accent is always a single color.

**Shape language:** words are the largest shapes; supporting shapes use only rounded rectangles (card r=26, bubble r=30, keycap r=22), perfect circles (number backgrounds), and diagonal color blocks (highlighter, slope 0.18). Background is a 64 px dot grid (opacity 6–10%). No outlined text, no drop-shadow text (the only shadows are offset shadows under cards at 8–18% opacity).

## ③ Motion

**Entry (by "importance")**

| Element | Method | Curve and duration |
|---|---|---|
| Main word | **Slam**: scale from 1.7× to 1, opacity 0→1 in the first 0.06 s | Underdamped spring `1−e^(−10t)·cos(2π·2.2t)`, ~8% overshoot, settles in ≈0.35 s |
| Title opening word | Slam + rotate to upright from −8° | Same |
| Supporting sentence, labels | **Rise from slot**: word slides from +1.2× line-height below baseline through a mask to 0 | `expoOut`, 0.30–0.35 s |
| Numbers / icons / bubbles / keycaps | **Bounce in**: 0→1 scale | `backOut`, s=2.6–3.0 (17–20% overshoot), 0.30–0.42 s |
| Cards | **Slide in**: from +700 px or +260 px below, with 3.4° rotation to upright | `expoOut` 0.40 s |
| Typing | Character-by-character reveal | 0.5 s to type 13 characters (26 chars/s), cursor blinks at 2 Hz |
| Code completion | Gray text **flashes in on frame 0** (completion is instantaneous) → presses Tab to turn solid | Keycap presses down 14%, rebounds with e^(−18t) |
| Highlighter / underline | Sweeps left to right | `expoOut` 0.30 s; appears 1–3 eighth notes after the word |
| Keyword enlarge | Enlarges to 1.35× on the accent beat and locks; highlighter scales with it | Spring freq 2.5 / decay 9; synchronized with the accompanying action (press Tab, checkmark) |
| Giant stage number | 900 px, opacity 5–13%, bottom-right, falls from 1.35× to 1 then drifts diagonally 14/10 px/s | Spring freq 2 / decay 8 |
| Checkmark | Stroke drawn by arc length, box simultaneously 1→1.25→1 | 0.22 s; strikethrough appears 0.08 s later |

**Exit:** faster than entry, accelerating curve (`expoIn`), duration 0.18 s; elements staggered 0.03 s, simultaneously scale to 0.6×, drop 60 px, and fade. **Exits are faster than entries** — the audience's attention has already moved on before the exit starts. Demo film title segment last beat: everything except the "3" exits, leaving only the shape about to be zoomed into.

**Stagger:** words in the same line stagger one eighth note (0.25 s at 120 BPM); small elements in the same group (three checkmarks) also stagger one eighth each.

**Continuous motion (words still after landing; motion given to other things)**
- Camera micro-drift: two sinusoids, amplitude 5 px, periods ~7 s / 2.7 s; very slow rotation ±0.5°.
- Beat micro-impact: whole frame scales up 1.2% on each quarter beat, `e^(−25t)` decay (~0.12 s) — frame "breathes" with the kick drum.
- Background dot grid drifts diagonally at 36 px/s.
- Final beat: camera pulls out 6% (`expoOut` 0.5 s), everything slightly smaller = "closure."

**Reference measurement (two YouTube kinetic type repost captures, 30 fps):** fully still adjacent frame-pairs are only 10.3% (DISCORD) / 21.2% (Charlie Puth) — the frame is in motion 70–80% of the time, the opposite of storytime's 71% still. Large visual events (whole-frame changes >1.5%) average one every 0.66 s / 0.83 s — close to **one per beat** (both tracks ~105 / 99 BPM, one beat 0.57 / 0.60 s). This demo's large-event density is one per eighth note (0.25 s), twice as dense as the lyric films — that density is fine for an explainer opener; a longer film should relax to one per beat.

## ④ Transitions (3 in the demo + 2 common)

1. **Fill zoom (zoom through):** camera punches into a shape on the previous screen (the coral circle with "3"), whose color becomes the next screen's background; the next screen settles from 1.25× back to 1. First 55% of duration `expoIn` zoom to 30×, last 45% `expoOut` settle. `TRANSITIONS.fillZoom` (was called `zoomThrough` during development; renamed in lib to avoid a name collision with the 3b1b camera zoom). Parameters: `cx, cy, k, maxZoom, fill`.
2. **Color bands (bands):** three diagonal color strips (yellow → white → navy) sweep from left to right, staggered 12%; the last strip is the new screen's background color, and the new screen appears behind it. 0.5 s `expoInOut`. `TRANSITIONS.bands`.
3. **Push:** old and new screens slide together, as if along a long canvas. 0.35 s `expoInOut`. `TRANSITIONS.push`.
4. **Mask wipe:** a shape (circle, rectangle strip, or the word itself) acts as a growing mask revealing the new screen. Can use the skill's existing `iris`.
5. **Type morph / word as transition:** a word on the previous screen scales up into a full-frame color block, or a word flings off-screen and takes the old screen with it.

**Alignment technique (most valuable finding from this session):** in the engine, a transition starts at the new segment's `t0`, so to make "the new screen appears" land exactly on the bar line, the segment start = **bar line − reveal point × transition duration**. Demo film: fillZoom reveal point p=0.55, duration 0.45 → start 1.75 (reveal at 2.00); bands reveal point ≈0.6, 0.5 s → start 3.70; push uses expoInOut, the perceptual "arrived" moment is when displacement is 90% (p≈0.58) not p=1 → start 5.80 (first version used p=1 → start 5.65, review measured "push completes 8 frames before the beat"). All shot-level landing points are written as beat numbers `KT.b(n)`, not in seconds.

## ⑤ Rhythm and text

- **120 BPM, 4 bars + 1-beat outro (8.5 s), one shot per bar** (title / stage 1 / stage 2 / stage 3); within each shot: beat 1 main word slams (+ background giant stage number); beat 1.5 evidence object; beat 2 supporting sentence; beat 3 evidence object action; beat 3.5 keyword enlarge + highlight; beat 4 hold or exit; final beat 16 (8.0 s) closing downbeat, then 0.5 s hold. All four shots use the same beat positions, only swapping side and content — the audience knows "what's next and where" from the second shot onward, which is the source of rhythmic feel.
- **Main word lands on the strong beat (beat 1 of each bar)**, paired with a low-frequency impact; small elements land on eighth notes, paired with pops; 0.3 s before a transition, an upswept noise brings the ear to the next bar.
- Every visual landing point has a sound; every voiceover accent has a visual — the demo film's sound event list is in the experiment archive's `build_y5.py` (not merged into skill), matched one-for-one with the beat numbers in `scenes/*.js`.
- **Hold time is enough to read:** the English video text guide gives 13 chars/s as the minimum (SSW); no primary standard found for Chinese — using the subtitle industry's experiential upper limit of 7–9 chars/s (unverified, used as a rule of thumb). A 2-character main word needs at least 0.5 s; a 7–8 character supporting sentence needs at least 1.0 s.
- When aligning to voiceover: main word = the stressed word in the narration; **video leads audio or matches it exactly, by at most 1 frame** — humans are far more sensitive to "audio earlier than video" than the reverse (EBU R37 broadcast sync tolerance: audio leads ≤40 ms, lags ≤60 ms).

## ⑥ Code implementation notes

> After merging into skill (2026-10-04 v0.4): the shared functions listed under "new code" in this card have been consolidated into `scripts/engine/lib/` (renamed to the unified MO / CAM / DG / TY / CH / UI / CL / TOON). Demo-specific code is in `scripts/engine/demos/y5_kinetic_type/`. For a library quick-reference and "how to choose a grammar for a voiceover segment" see `references/en/09-explainer-animation-grammar.md`.

- **Reuse from skill**: engine (segment table, transition two-layer compositing, `renderFrame`), `render.py`, `U.clamp / lerp / rng`; `PAINT` not needed (this style uses no textures).
- **Engine changes (already merged into skill engine)**: `window.BPM` is configurable (default 128; this film 120); any segment can specify `dur` in seconds; transition `punch:0` is available (this film uses its own beat micro-impact on the beat, not on the transition start).
- **New code, now consolidated into lib** (`lib/motion.js` / `typo.js` / `camera.js`, transitions into `transitions.js`):
  - Easing: `expoOut / expoIn / expoInOut / quintOut / backOut(p, s) / spring(t, freq, decay) / settle(t, amp, freq, decay)`.
  - Text: `TY.text` (scale and rotate around any origin, stroke, letter-spacing), `TY.width`, `TY.rise` (mask rise), `TY.pop` (bounce in), `TY.typed` (typing), `TY.marker` (diagonal highlighter block), `TY.underline`.
  - Camera: `CAM.with(c, {x, y, z, r}, fn)`, `CAM.drift`.
  - Transitions: `fillZoom`, `bands`, `push`.
- **This film `y5_kinetic_type/kinetic.js`**: `KT.b(n)` beat number, `KT.SZ` type-size ladder, `KT.bump` beat micro-impact, `KT.slam` main-word slam, `KT.dots` dot grid, progress track (drawn in the `GLOBAL_OVERLAY` fixed layer, value driven only by total film time — the "continuous narrative anchor" use from reference 02; first version drew it in each segment, causing it to jump on page changes), `KT.key / keyMarker` (keyword rises first, enlarges and locks at the accent beat), `KT.bigNum` (background giant stage number), `KT.cam`.
- **Chinese fonts**: demo film uses Alibaba PuHui 3.0 in four weights (Black/Heavy/Bold/Medium); the open-source replacement for the license is Noto Sans SC 900/800/700/500 (`family` names kept as `PuHui-*`), GB2312 full subset (`scripts/font_subset.py --gb2312`); changing the title usually does not require a new subset.
- **Music (experiment archive `build_y5.py`, not merged into skill)**: numpy-synthesized drums (kick every beat, clap on beats 2/4, hat on off-beats) + bass (eighth notes on the root note per bar) + event sound effects (main word = boom, small elements = pop, typing = click, checkmark = rising pop, pre-transition = riser).

## ⑦ Representative works and primary sources

- Saul Bass title sequence archive (Art of the Title): https://www.artofthetitle.com/designer/saul-bass/
- Wikipedia "Kinetic typography" (motion typography / fluid typography, Bass as feature-film pioneer): https://en.wikipedia.org/wiki/Kinetic_typography
- School of Motion *Kinetic Typography in After Effects* Part 2 (frame counts: small word slide-in 4 frames, main word fling 6 frames + 2-frame overshoot return, camera push 6 frames + 2-frame pull-back; "camera moves a little late, as if pushed by the sound"): https://www.schoolofmotion.com/blog/kinetic-typography-after-effects-part-2
- School of Motion Part 3 (falling should accelerate not decelerate, on impact the whole composition enlarges then returns to 100%): https://schoolofmotion.com/blog/kinetic-typography-after-effects-part-3
- Dan Ebberts inertial rebound expression (`amp·sin(2πft)/e^(decay·t)`, default freq 3 / decay 5): http://www.motionscript.com/articles/bounce-and-overshoot.html
- Lee, Forlizzi, Hudson, *The Kinetic Typography Engine* (UIST 2002, kinetic type expressing emotion and tone): https://dl.acm.org/doi/10.1145/571985.571997
- Video text hold-time reference: https://www.ssw.com.au/rules/post-production-do-you-give-enough-time-to-read-texts-in-your-videos
- Two repost captures measured here: DISCORD [Kinetic Typography] https://www.bilibili.com/video/BV1ts411S7Xa; Charlie Puth – We Don't Talk Anymore (Kinetic Typography) https://www.bilibili.com/video/BV1by4y1r74Y

## ⑧ The 3 most common mistakes

1. **All words the same size, all moving together.** No hierarchy means no focal point — the audience does not know what to read first. Main word vs. supporting sentence should be at least 3:1; only one thing should be "entering" at any given moment; everything else is still.
2. **Words keep drifting.** Words cannot move while being read (the eye cannot track and read simultaneously). Give continuous motion to the camera micro-drift, beat micro-impact, and background dot grid; words lock in place 0.35 s after slamming.
3. **Animation does not land on the beat, or it lands on the transition start.** The first frame of a transition is not the accent; the frame where "the new screen appears" is. Shift the segment start back by "reveal point × duration," then write every shot-level landing point as a beat number; every landing point outside the beat grid makes the whole film feel looser.

---

## Demo film

- Finished film: `scripts/engine/demos/y5_kinetic_type/` (render: `render.py --film demos/y5_kinetic_type`) (8.5 s, 60 fps, synthesized score 120 BPM); one-frame overview per shot: `assets/动画语法/y5_kinetic_type_总览.jpg`
- Project: `scripts/engine/demos/y5_kinetic_type/` (`eras.js`, `kinetic.js`, `k1_title.js / k2_complete.js / k3_chat.js / k4_agent.js`); shared code in `scripts/engine/lib/`
- Shot list (镜头表): K1 title "AI 写代码 的 ③ 个阶段" (3 Stages of AI Coding) → fill zoom → K2 "补全" (complete) (code card + gray completion text + Tab) → color bands → K3 "对话" (dialogue) (you one line, it a full paragraph) → push → K4 "代理" (agent) (3 TODO items check themselves off) + progress track full

## Review and revisions (independent agent, finished film only)

Review conclusion: "Opening 0–2 s is classic kinetic type; the '3' circle punching into the frame and becoming the next segment's background is the best design in the film"; "audio-visual sync nearly perfect — every visual event lands on the 120 BPM grid, on the same frame as the kick drum." 5 "must fix" items, addressed as follows:
1. **Supporting sentence hold too short** (0.6–0.9 s) → supporting sentence appears one beat earlier, trimmed to 6–7 characters ("它补完下一行" / "一句话换一整段" / "你只说要什么"), readable time 1.0–1.5 s (stage 2 is still tight; voiceover alignment in the real film will provide enough time); overall film extended 0.5 s.
2. **Stage 2 supporting sentence nearly touches the AI panel** (14 px) → sentence shortened, right-aligned, gap >180 px.
3. **Push completes 8 frames early, progress track jumps** → segment start recalculated at 90% displacement (5.80); progress track moved to `GLOBAL_OVERLAY` fixed layer, color changes on the reveal frame.
4. **Stage segments not kinetic enough** (number too small, keywords only highlighted not enlarged) → added background giant stage numbers 1/2/3; keywords enlarge to 1.35× at the accent beat.
5. **No closing hit, checked items all turn gray** → added beat-16 closing downbeat (camera pull-out 6% + 3.5% impact + low-frequency hit + high bell); checked words turn green not gray; content shifted down 70 px overall to fill the bottom gap.
Additionally: code card changed to monospace font (Menlo).
Not adopted: "extend each segment to 2.5–3 s, total film 10–11 s" — demo requirement is ~8 s; solved by reducing word count instead of extending duration.

## qa.py numbers (after revisions, `uv run scripts/qa.py --project scripts/engine --film demos/y5_kinetic_type`)

| Segment | Motion% | Still frame-pairs% | Jumps | Mean/peak ms | Deterministic |
|---|---|---|---|---|---|
| k1_title | 2.37 | 0.0 | 1 (t=1.63, title exit) | 1.0/1.6 | ✓ |
| k2_complete | 2.39 | 0.0 | 0 | 1.5/3.2 | ✓ |
| k3_chat | 2.59 | 0.0 | 1 (t=4.54, AI bubble appears) | 1.6/2.2 | ✓ |
| k4_agent | 2.88 | 0.0 | 3 (t=6.29 Agent + task card; t=8.00/8.04 closing beat) | 1.6/2.0 | ✓ |

Transition smoke test (peak per whole frame): fillZoom 6.8 ms, bands 4.8 ms, push 3.8 ms. All 5 jump frames were individually inspected; all are intentional beat accents (qa documentation: "intentional beat flashes are not bugs"). Kinetic type jump frames should land on the beat grid — a jump frame that is off-grid is a bug.
Post-revision per-frame scan of all four edges: 0 frames with black edges.
