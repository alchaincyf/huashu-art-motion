# 09 · Explainer Animation Grammar: 8 Visual Styles for YouTube Science / Tech / AI / Finance

[中文](../09-视频动画语法.md) · **English**

Read this when you're building the "animation segments" of a voiceover explainer. It is the master index, style-selection table, cross-grammar rules, library quick-reference, and clip contract for the voiceover pipeline — covering all 8 grammar cards (`references/en/animation-grammars/`).

All 8 grammars ship with directly renderable demo films (`scripts/engine/demos/<grammar>/`, ingested pixel-for-pixel against the original experimental films; after the `TY.charsIn` opacity fix on 2026-10-05 the y1 demo film title fades out in 0.55 s as originally intended, so those 0.55 s of frames differ from the original) and parameterised clips (`scripts/engine/clips/<grammar>.js` — feed a JSON spec and get back a precisely timed video).

---

## I. Overview

| Grammar | Use case | Core grammar in one sentence | Typical shot length | Primary easing | Primary transition | Card | Demo |
|---|---|---|---|---|---|---|---|
| **y1 Kurzgesagt flat science** | Explaining scale, "what's inside", mechanism systems; gentle science-documentary tone | Turn an abstract concept into a concrete object, place it in a world that can be zoomed infinitely, and have the camera travel between scales; the environment moves gently, the subject changes on voiceover cues | Hard-cut shots 7–9 s, visual units swap every 4.6–6.7 s | `MO.k75` = bezier(.75,0,.25,1); loops use `MO.easyEase` | Drill into shot `lensReveal`, fill-then-pull-out `matchCut` (logarithmic camera push/pull) | `animation-grammars/y1_kurzgesagt.md` | `--film demos/y1_kurzgesagt` |
| **y2 Vox collage** | Arguments backed by real archives, news clips, screenshots, and faces; "look at this sentence", "notice this number" | The argument is laid out on a table covered with real material; the camera moves like an investigative reporter's eye, lines and pen marks appear stroke by stroke | Slow-lane median 3.3 s (one card 3–7 s); fast lane 1.4–1.8 s | Camera `MO.sineInOut` / long tail `MO.longTail`; elements step at 12 fps | Hard cut, pan along red string `same`, push into photo → hard cut `cut` | `animation-grammars/y2_vox.md` | `--film demos/y2_vox` |
| **y3 Whiteboard (RSA)** | Reasoning chains, steps, "why"; derive as you speak | Write one sentence as you say it; the camera follows the argument across one large whiteboard, then pulls back to show the whole picture | Median dwell 6.6 s per block | Board pan `MO.sineInOut` 1.2–2.4 s; long jump 0.8 s whip + motion blur | Same board `same` (camera motion is the transition), closing pull-back | `animation-grammars/y3_whiteboard.md` | `--film demos/y3_whiteboard` |
| **y4 Storytime stick figure** | First-person anecdotes, fails, comedy beats; the audience wants "this person" | The voiceover is the protagonist, the visuals are reaction images keyed to it: pose snaps in 0.1 s then holds still; punchlines land by cutting to a reaction close-up and going silent at that moment | ASL 2.43 s (median 1.87 s) | Pose change `MO.expoOut` 0.1 s + `MO.settle` squash-and-stretch; character at 24 fps | Hard cut `cut`, slam `smash`, whip `whip`, jump-in | `animation-grammars/y4_storytime.md` | `--film demos/y4_storytime` |
| **y5 Kinetic type** | Lists, "X stages", catchphrases, number openers, chapter cards | The word is the actor: keywords slam in on the stressed beat, the headline is big enough to read in one glance, the screen always has exactly one focal point | One phrase, one shot (at 120 BPM ≈ 2 s) | `MO.expoOut` entrance, `MO.springHz` slam, exit `MO.expoIn` faster | Crash into colour block `fillZoom`, colour bands `bands`, page push `push` | `animation-grammars/y5_kinetic_type.md` | `--film demos/y5_kinetic_type` |
| **t1 3Blue1Brown** | Showing how one mechanism step-by-step becomes another: networks, matrices, gradients, probability | On a black background, show only the one thing currently being explained; use Transform to turn the previous concept directly into the next; colour = concept name; almost no cuts | Single animation 1–3 s + hold 1 s; one concept 8–20 s | `MO.smooth` (6t⁵−15t⁴+10t³), used for almost everything | Transform continuation (no cut), camera through `zoomThrough`, `fadeShift` | `animation-grammars/t1_3b1b.md` | `--film demos/t1_3b1b` |
| **t2 Launch keynote UI** | Product/feature launches, version updates, tutorial steps, parameter reveals | One screen, one thing; product screenshot or real object is the hero and gets pushed in; nouns and numbers land when the voiceover says them; light-blob background and glass cards are optional dressing, use sparingly | Presentation screen 5–8 s; product quick-cut 1.5–3 s | `MO.spring` bounce 0–0.15, `MO.appleOut` | Blur push `blurPush`, card expand `expandRect` | `animation-grammars/t2_keynote_ui.md` | `--film demos/t2_keynote_ui` |
| **t3 Finance chart** | Revenue, stock price, share, inflection point; audiences will screenshot and fact-check the numbers | Build the axes first, then let the data grow in, then annotate only one thing; values are always honest, animation only decides how they appear | One chart 2.5–6 s | `MO.quintOut`, line charts `MO.smooth` | Panel slide `slidePush`, zoom into detail `zoomThrough` (live + bScale0), hard-cut keeping layout | `animation-grammars/t3_finance_chart.md` | `--film demos/t3_finance_chart` |

Overview figure: `../../assets/动画语法/<grammar>_总览.jpg` (one frame per shot).

Demo commands (run from `scripts/`):

```sh
uv run --with playwright python engine/render.py --film demos/y1_kurzgesagt --out y1.mp4            # render demo film
uv run scripts/qa.py --project scripts/engine --film demos/y1_kurzgesagt --out <directory>          # QA (run from skill root)
# Preview: start a local server and open scripts/engine/index.html?film=demos/y1_kurzgesagt, scrub the timeline
```

Demo films are all compressed to around 8 s — 2.5–3× denser than a real-film pace — just to show the full grammar in a short demo. In actual production, use the shot lengths from the table above.

---

## II. Choosing a Grammar for a Voiceover Segment

First ask what this voiceover segment is doing, then pick the visual style. A single film may switch grammar between segments, but never mix grammars within one segment.

| This voiceover segment is… | Choose | Avoid | Why |
|---|---|---|---|
| Explaining a concept or mechanism ("how does a neural network…") | **t1 3b1b** (needs derivation, has formulas) or **y1 Kurzgesagt** (needs scale, wants to be charming) | y2 (no real material to paste — will look like fake archives) | Mechanisms are clearest through morphing and scale |
| Covering news, events, history, with screenshots and direct quotes | **y2 Vox** | y1 (flat cartoon undercuts credibility) | The audience needs to see the source |
| Telling a personal anecdote, a fail, a comedy beat | **y4 storytime** | t2 (carries an inherently upbeat mood) | The punchline lives in the pause of the reaction shot |
| Listing items, several key points, several stages, a catchphrase | **y5 kinetic type** | t1 (no object to morph) | Information is structure, not imagery |
| Explaining a product, tutorial steps, a feature, parameters | **t2 launch keynote UI** (full-bleed screenshot pushed in; glass card optional) | t1 (glass and light blobs carry no logic, and vice versa) | One screen, one thing; nouns and numbers as heroes |
| Numbers, growth, trend, comparison | **t3 finance chart** | t2's large-number style (use that only when there's a single number) | Needs axes and units; needs to withstand fact-checking |
| Deriving step by step, reasoning one step at a time | **y3 whiteboard** | Single full-screen switch | Write as you speak; the pull-back at the end is the payoff |

Two fallbacks:
- Have a real screenshot to place → t2 (tutorial, clean) or y2 (argument, evidence feel). Screenshot as the main visual, full-bleed as possible, always aspect-ratio locked, never crop critical UI.
- Only one number in a segment → don't draw a chart; use t2/y5's large-number count-up, landing at the value exactly when the voiceover says it.

---

## III. Cross-Grammar Rules

Rules extracted from all 8 cards that hold true regardless of grammar. Each item cites its sources.

1. **The camera is driven purely by time; scenes are redrawn to match the camera vector.** Push-ins, pull-outs, pans, and traversals are all redraws of the same world canvas under a different camera, so they stay sharp at 60× zoom, and mid-transition the previous shot keeps following the camera by time (`zoomThrough` with `live:true`). (y1 ⑥ "key architecture"; y3 ⑥; t1 ④-2)
2. **Use logarithmic interpolation for zoom; passing through a circular aperture needs enough scale factor.** `CAM.zlerp` multiplies by the same factor each frame; linear interpolation goes slow-then-fast. To pass through an aperture of radius r, the factor must be ≥ distance from the aperture centre to the farthest screen corner / r (≈ 1100/r when centred, `CAM.coverZoom`). (y1 ⑧-2; t1 ④-2)
3. **The reveal frame aligns to the beat or the voiceover word.** Transitions are measured from the new segment's start; the frame where the new image first appears must land on a bar line: segment start = bar line − reveal point × transition duration (`MO.onBeat`). Numbers must land at the value exactly when the voiceover says it: count-up start = moment the number is spoken − count-up duration. Whiteboard writing starts about 0.5 s after the corresponding phrase. (y5 ④ "beat-locking"; t2 ⑤; t3 ⑤; y3 ⑤)
4. **Structure first, then data, then annotation.** Axes appear first, data grows in second, annotation last; one shot, one annotation. For 3b1b: Write the question first, then demonstrate; for launch: eyebrow → product name → subtitle. (t3 ③; t1 ⑤; t2 ③)
5. **One focal point per screen.** Only one thing enters at a time; everything else stays still. Headline to supporting text ratio at least 3:1; background elements have lower saturation, contrast, and stroke weight than the hero. (y5 ⑧-1; t2 ⑤; y4 ⑧-2)
6. **Entrance slow, exit fast; hold after landing.** Entrance 0.3–0.4 s, exit ≈ 0.18 s; numbers hold at least 0.5 s after landing; punchlines hold ≥ 0.9 s; 3b1b waits ≈ 1 s after each animation. (y5 ⑤; t3 ⑧-3; y4 ⑤; t1 ⑤)
7. **Move on events; camera gives and takes.** The camera only moves when the viewer's eye needs to go somewhere new: transitions use slow push, pan, or pull-out (0.6–1.5 s, ease-in/ease-out, sourced from Vox and 3b1b measurements); punch-in (0.28 s, push in 18–32%), slam (0.17 s, 1.55→0.94→1.0) are reserved for reveals, reversals, and key numbers. After pushing in, pull back out or pan away — never push in three shots in a row. The same move every shot reads as slideshow, whether it's a steady slow push (Nobel Literature film r2: "feels exactly like playing a PowerPoint") or a per-shot punch-in (Nobel Economics short, 48 punch-ins in 102 s: "too many, the pace is not smooth at all"). Numbers and large text should slam into objects that exist in the film's world (screens, battery bars, price tags, blackboards), not onto a plain solid-colour title card — in blind reviews those cards read as "inserted a slide." Engine primitives: `CAM.track` (camera action table; no action written = slow push), `MO.slam` (element slam); durations in `MO.PULSE`. Parameterised clips t2, y1, y2 default to slow push for `highlight`; write `"camera": "snap"` in the top-level spec `data` for punch-in. There is no built-in steady slow push or breathing motion. Environment layers (Kurzgesagt star twinkle, particles) may move gently throughout; storytime frames are 70% completely still — life comes from fast cuts and holds. Art-style speedruns are a different category: the image must stay alive (see doc 04). For the action table, per-grammar camera tone, and when to watch shot counts, see `references/en/camera-language.md`. (y1 ③, ⑧-1; y4 ⑧-1; t2 ③)
8. **Two frame rates: camera smooth, elements stepped.** Vox camera smooth, paper scraps/highlighter/typing step at 12 fps (one-on-twos); storytime characters at 24 fps, camera at 60 fps. Full smooth looks like a corporate promo; full stepped looks jittery. (y2 ③, ⑧-1; y4 ③)
9. **Colour = concept; keep accent colours sparse.** One colour for one concept (W in the formula and its connecting lines are both blue); more than 3–4 semantic colours and the viewer can't track them. Vox uses black, paper white, and one red; whiteboard uses black plus one orange. (t1 ⑧-3; t3 ⑧-2; y2 ⑧-3; y3 ⑧-3)
10. **Transitions go at breath-pauses and topic changes, not mid-sentence.** Whip cuts fall between sentences; reaction shots fill silence; whiteboard pans mark new points; Vox hard cuts mark punctuation. (y4 ⑤; y3 ⑤; y2 ④)
11. **Review for logic and number consistency, not just visual polish.** Errors caught in testing: "grew 8.7×" should be "grew to 8.7×"; a bar count restarting from 0 after expanding to full-screen; hidden layer wired to pixels instead of neurons; multipliers that don't check out from the numbers on screen. (t3 revision log; t2 revision log; t1 ⑥)
12. **Real material is the main visual; show it as-is.** When you have a screenshot, photo, footage, or original text, let it be full-bleed or close to it, push in to the relevant portion; the code only handles annotation, labelling, and camera movement (`MD.cover` full-bleed + focus + push-in, `MD.print` print-style, `MD.label` black torn-edge label; parameterised clips t2's screenshot card and y2's photos default to full-bleed or filling 80–90% of the frame). Screenshots are aspect-ratio locked, never crop critical UI. Data: only the appearance changes, never the values. Bars always start from 0; when a line/bar axis doesn't start from 0, the subtitle must say so explicitly. Fictional data: every shot carries a "示意数据" (illustrative data) badge; real data must never carry this badge. (t3 ②, ⑧-1; clip contract)

---

## IV. Library Quick-Reference (`scripts/engine/lib/`; loaded by both index.html and clip.html)

| File | Namespace | Contents |
|---|---|---|
| `motion.js` | `MO` | Camera action durations `PULSE` (transition push/glide/pull, accent punch/pan/slam) / `slamK/slam` (slam 1.55→0.94→1.0) / `pulse` (action progress); `seg/at/anim/step` (12 fps step); manim `smooth/thereAndBack/rushInto/rushFrom/doubleSmooth/wiggle/lagged`; `sineInOut/cubic*/quart/quint/expo*/backOut/elasticOut`; `bezier` and `appleOut/emphasized/k75/easyEase/longTail`; SwiftUI `spring/smoothSpring/snappy/bouncy`; `springHz/settle`; `float`; `invert` (easing inverse lookup); `beat/onBeat` (bar-line alignment). Canvas size `U.setStage/onStage` in `util.js` |
| `camera.js` | `CAM` | `apply/with`; `toScreen/toWorld`; `zlerp` (logarithmic zoom); `coverZoom`; `anchor`; `pushTo` (push toward a point, that point smoothly to centre or zoom in place); `at` (keyframe, pan along path); **`track` (camera action table: `push` slow push (default) / `pull` pull-out / `glide` find next item / `to` push to specified camera / `punch` punch-in / `pan` quick pan / `slam` full-frame slam / `shake` shake / `cut` hard cut; camera is purely a function of t)**; `layer` (parallax); `velocity/motionBlur` (whip blur); `drift` (handheld micro-drift, art-style and pure-atmosphere shots only) |
| `diagram.js` | `DG` | Point lists `cum/len/pointAt/drawPartial` (progressive draw) / `xform/arcPts/ellipsePts/hand` (hand-jitter) / `revealMask/zigzag` (reveal mask); Transform `rectPts/circlePts/morph/shape`; colour `mix/mixA/rgba`; 3b1b palette `MANIM` (×1.5 saturation) / `saturate`; `math/write` (manim Write — stroke first, then fill); `neuron/edgeEnds/edge/flash`; `indicate/circumscribe/brace`; whiteboard `board` (stroke timeline + inter-stroke glide); `pen` (marker pen) |
| `typo.js` | `TY` | `text/width/font`; `wrap/fit` (line-wrapping; `fit` shrinks font size until it truly fits: rows ≤ maxLines and every row measured for width, even a single long English word won't overflow; `soft:true` returns `ok:false` when it can't fit so you can try another approach; `balance:true` folds multi-line text to equal-length rows); `charsIn` (per-character float-up); `rise` (mask rise); `pop`; `blurIn` (emerge from blur); `typed/typedCount` (typewriter); `marker/underline`; `slam` (headline slam); `keyword/keywordMarker` (keyword emphasis); `fmt/count/tabular` (number roll-up and monospaced numbers) |
| `chart.js` | `CH` | `lin/ticks`; `grid/xLabels` (axes appear first); `bars` (grow from 0 + synced count-up + highlight/dim); `line/yAt`; `candles`; `callout` (dot → leader line → label); `tag/demoBadge/frame` (Economist-style layout) |
| `ui.js` | `UI` | `mesh` (light-blob background); `grainTex`; `backdrop`; `shadow`; `glass` (frosted-glass card); `sheen` (light sweep); `persp` (pseudo-3D); `icon`; `rr/rrPath/scratch` |
| `collage.js` | `CL` | `paperTile/fillPaper` (paper texture); `tornEdge/tornRect` (torn edge); `halftone/photo` (halftone photo); `placed/shadowed/slideIn` (angled slide-in to flat); `tape/pin`; `stringPts/string` (red string); `highlight` (rough-edge highlighter); `stickerEdge` (cut-paper white edge) |
| `media.js` | `MD` | Real material as hero: `cover` (full-bleed, focus point `fx/fy`, push-in `z`, crop `crop`; `fit:'contain'` shows the whole image without cropping); `toScreen` (point/rect on the asset → screen coordinates); `focusFor/zoomFor` (how many × to push in to reach a region); `print` (print-style / Polaroid: white border, aged paper, shadow, tape); `label` (black torn-edge label, 12 fps typewriter); `frameAt` (get frame from sequence); `size`. Missing asset always errors — never draws a blank frame |
| `toon.js` | `TOON` | `flat` (two-tone face shading); `glow/vgrad/circle/ellipse`; `bean` (bean character — demo films and white-model pre-vis only, not in finished films; parameterised clip y4 no longer calls it) and `LOOKS/look`, `POSES`, `poseAt` (pose-to-pose + rebound), `blinkAt`, `alive`, `env/mouth` (lip-sync from voiceover envelope), `sweat/mark` |

Transitions are in `transitions.js` at the end of the "YouTube Explainer Grammar Transitions" section: `same / lensReveal / matchCut / whip / smash / fillZoom / bands / push / zoomThrough / blurPush / expandRect / slidePush / fadeShift` — each has a one-line description and its parameters. Hard cuts use the existing `cut`.

Engine-level miscellaneous: vertical full film `render.py --film <name> --width 1080 --height 1920` (or set `window.FILM_SIZE = [1080, 1920]` in eras.js); engine, transitions, camera, and all libraries compute from the current canvas; the 35 art-style scenes were authored for landscape only. A segment's `clip` (video frame sequence) defaults to aspect-ratio full-bleed; write `clipDraw(c, frame, lt, t)` for custom placement (push-in, focus, print-style). Missing frame or image errors immediately and refuses to render. Segments accept `dur` (seconds) instead of `eighths`. `window.BPM` changes the tempo. In explainer films, write `window.PUNCH = 0` to disable beat-accent impact (or write `punch` on a single transition). `window.SCENE_LIBS / SCENE_DIR` lets a film keep its own code in its own directory (demos are organised this way).

**Experimental-era name → current name** (for reading archived experiment code): `YT.camAt→CAM.at`, `YT.camForAnchor→CAM.anchor`, `YT.apply/camera→CAM.apply/with` (camera fields `zoom/rot` renamed to `z/r`), `YT.ease.*→MO.*`, `YT.spring(t,f,d)→MO.springHz`, `YT.textIn→TY.charsIn`, `YT.type→TY.typed`, `YT.partial→DG.drawPartial`, `YT.at→DG.pointAt`, `YT.circlePts→DG.ellipsePts`, `YT.paperTile/halftone/tornEdge→CL.*`, `YT.bean/POSES/mouth→TOON.*`, `MN.*→DG.*` (`lerpPts→morph`, `C→MANIM`, `FONT_RM→FONT.rm`), `GL.*→UI.*`, `MO.textIn→TY.blurIn`, `MO.count/fmt/tabular→TY.*`, `easeOutQuint/easeOutExpo→quintOut/expoOut`; transitions `k_lens→lensReveal`, `k_fill→matchCut`, `hardcut→cut`, y5's `zoomThrough→fillZoom` (name collided with 3b1b's camera-through).

Fonts: Chinese sans-serif is always `PuHui-Medium/Bold/Heavy/Black` (the open-source build is Noto Sans SC 500/700/800/900 with the family name kept; see `lib/fonts.js`); whiteboard uses `LXGWWenKai-500`; both are subsets of the full 6763 GB2312 Chinese characters — a title change almost never requires adding characters. Math formulas use `CMU-rm/it`, launch keynote uses `Inter`, finance numbers use `RobotoCondensed`. `NotoSansSC/NotoSerifSC` contain only the characters used by three demo films; don't use them for new content.

---

## V. Clip Contract (Animation Segments for the Voiceover Pipeline)

A voiceover video pipeline — whatever tooling you use — calls these 8 grammars to produce animation segments, with the pipeline acting as director: selecting the grammar, deriving cues from word-level voiceover timestamps. This section is the contract between both parties.

### Entry Points

**Wrap this in a script inside the voiceover pipeline — do not type these commands directly**: draft derives duration from the finished-film timeline, exports a word list and a spec draft → render parses the words, calls this section's render.py, counts frames, swaps into the edit project, freezes → verify checks every chapter frame-by-frame for sync. That is how the author's own pipeline connects (that part is not open-sourced with this repository). Below is the engine's own interface.

```sh
cd <skill>/scripts
uv run --with playwright python engine/render.py --spec clip.json --out 片段.mp4            # silent H.264 yuv420p
uv run --with playwright python engine/render.py --spec clip.json --alpha --out 片段.mov    # ProRes 4444 with alpha (no background, for pipeline compositing)
uv run --with playwright python engine/render.py --spec clip.json --stills 0.5,2,4 --out 静帧/   # extract stills for checking
# Preview: serve locally and open scripts/engine/clip.html?spec=examples/t3_finance_chart.json, scrub the timeline
```

- Duration is exact: frame count = round(duration × fps), frame i has time i / fps. H.264 has one keyframe per second (GOP = fps); pipeline renderers that seek by second won't produce frozen frames.
- **Single clip: 8 seconds maximum.** When `duration` exceeds 8 s, render.py prints a prominent warning at the start and end of output — no error (the voiceover pipeline has legitimately long clips). A clip that runs too long reads as a single slideshow panel: one layout throughout, points piling up, background dead from start to finish. A film must be broken into multiple shots, each its own spec (or a `scenes` block); shots swap composition but not art style (same `theme`, at most 2 grammars), then concatenated (see SKILL.en.md track-file steps 3–4 and `references/en/shot-list-template.md`). The example specs run 8.5–10 s; those demonstrate single-segment structure, not total film length.
- **One colour palette per film: `theme`.** Every spec in a film uses the same `"theme"`: a palette name `paper`, `poster`, `ink`, `navy`, `bauhaus`, `snow`, `wood`, `chalk` (colour values in `references/en/palettes.md`); or an object `{"name": "wood", "accent": "#B8452A"}` that overrides only one or two keys; or a full 6-key object `{bg, surface, ink, sub, accent, accent2}`. Wrong palette name, object with missing keys (without a fallback `name`), or non-`#hex` colour value → startup failure. With a theme, grammars don't paint large gradient backgrounds or neon glows; auxiliary colours are all derived from these 6. Without `theme`, each grammar uses its own default (y1 now defaults to dark matte flat, no longer dark-purple starfield). t3 also recognises the legacy `"light"`, `"dark"`, and its own theme objects; `"paper"` now means the paper palette.
- Width, height, and fps come from the spec; defaults are 1920×1080@30. For vertical, write `width: 1080, height: 1920` (or `--width 1080 --height 1920` on the command line to override the spec); all grammars have vertical layouts.
- Asset paths in the spec are relative to the spec file (absolute paths also work). render.py only serves files named in the spec. Recognised fields: `cues[].image`, `cues[].frames` (video frame sequence: a directory or path array), `data.image`, `data.character` (y4 frame library directory). Path resolution is in `engine/spec_assets.py`.
- Measure a segment: `uv run qa.py --spec <clip.json>` (run from `scripts/`; measures determinism, motion, still-frame pairs, isolated jumps, and render time for the full segment; vertical clips scale to frame dimensions; monotonic smooth push/pull/pan/slam under 2 s are counted as camera events, not jumps).
- Deliver: `uv run deliver.py 片段.mp4 --spec <clip.json> --out output/`. First passes the gate `film_gate.py` (fast-motion frame ratio < 0.035 → red light; mid-film silence lasting ≥ 0.3 s continuous → red light, even for very short clips; on failure: no copy, non-zero exit); if it passes, copies the file and writes `交付说明.md` (delivery notes), with the factual section filled in by the script. The gate is calibrated on 1–2-minute finished films; clips under 10 s have noisy readings. For clips that will be assembled into a finished film, run deliver.py on the finished film.
- Page error (grammar file error, image or video frame missing) → non-zero exit, no output. `qa.py --spec` and render.py share the same asset resolver (`engine/spec_assets.py`); both recognise `frames` and character frame libraries. A Chinese character in the spec that is missing from the font subset only warns (falls back to system font, result will differ on another machine); common characters are all in the subset.

### Spec

```json
{
  "grammar": "t3_finance_chart",          // one of 8: t1_3b1b | t2_keynote_ui | t3_finance_chart | y1_kurzgesagt | y2_vox | y3_whiteboard | y4_storytime | y5_kinetic_type
  "duration": 7, "fps": 30, "width": 1920, "height": 1080,
  "safe": { "top": 0, "bottom": 520 },     // optional: margins to leave clear (px), see below
  "alpha": false,                          // optional: true = don't draw background (render.py --alpha sets this automatically)
  "theme": "wood",                         // all specs in one film use the same value: palette name or object, see "One colour palette" above
  "data": { ... },                        // grammar-level parameters; fields each grammar recognises are listed in each section below; unrecognised fields are silently ignored
  "cues": [ { "at": 1.2, "kind": "bar", "text": "...", "sub": "...", "data": { ... }, "image": "截图.png", "dur": 1.0 } ]
}
```

**Cue common fields** (which grammars recognise which fields is listed in each section below):

| Field | Meaning |
|---|---|
| `at` | Seconds, required. The "reveal frame": the element is first visible at t = at (animation internally starts one frame before at). Exception: for `number`, at is the moment the number **lands**. Cues need not be in time order; clip.js sorts them. Cues with at > duration are warned and dropped (they would never be visible and don't occupy layout). |
| `kind` | Required. **An unrecognised kind for this grammar produces no error and draws nothing** — match what's in the tables below. |
| `text` | Primary text: title, bullet, label, speech-bubble content, large overlaid text. |
| `sub` | Secondary text: t2 card caption, y5 supporting sentence, y4 the short phrase actually shown in the bubble, y4 insert-shot the typed line. |
| `image` | Image path, relative to the spec file (also accepts absolute paths, `data:`, `http(s):`). Missing file → refuses to render. |
| `frames` / `fps` / `loop` | Video frame sequence (t2 screenshot card, y2 photo recognise this): a directory (sorted by filename, takes png/jpg/webp) or path array; plays from at at `fps` (default 30), holds on the last frame when done; `loop: true` loops. Layout is based on the first frame. Missing frame → refuses to render. |
| `data` | This cue's own parameters (`index`, `rect`, `icon`, …); see each section. |
| `dur` | Only a few kinds read this: t1's title/point/equation/line, t3's bar/line/candle, y1's enter, y4's react/insert. Other kinds ignore it. |

**`safe`**: `{top, bottom, left, right, fill?}` (px, default 0). clip.js passes this and the inset content box `ctx.box = {x, y, w, h}` to the grammar. `fill` is an optional colour; after rendering, the cleared margins are painted with it (used in vertical films to make a chart look like a "card" at the same position and background as an adjacent contain-mode screenshot; not applied with `--alpha`). **All 8 grammars now respect `top` / `bottom`** (each grammar object has `safe: true`; content is laid out only between top and H−bottom: t3's axes and source line, y2's camera zoom and frame centre, t1/t2/y1/y3/y5's layout, y4's speech bubbles and insert-shot large text). **`left` / `right` are not yet respected by any grammar**; writing them only paints the fill colour, content still reaches the edge. In a vertical 1080×1920 film, the subtitle band is roughly y 1400–1520; set `bottom` to 490–570. Landscape films typically use `bottom` 160–220. New grammars should respect safe the same way t3 does: offset vertical layout baselines by `safe.top`, offset bottom elements by `safe.bottom`, or lay out directly against `ctx.box`; write `safe: true` in the grammar object (clip.js warns if the spec provides safe but the grammar doesn't declare it).

**`number` (large number) contract** — recognised only by t2, t3, y5; the other 5 show nothing if you write it:

| Item | Rule |
|---|---|
| Value | `data.value` (number, may be negative; defaults to 0 if omitted). Rolls from 0 to value (expoOut, fast-then-slow); negative values use a true minus "−"; integer parts get thousands separators automatically. |
| Format | `data.prefix` (e.g. `"¥"`), `data.suffix` (e.g. `"%"`, `" x"` — include your own space), `data.decimals` (default **0**; t3's `spec.data.decimals` only controls bar labels and is **not** inherited by `number` — write decimals again in the cue if you need them). |
| Caption | Any of `text`, `sub`, `data.text` work; clip.js unifies all three. |
| Small label | `data.label`: t2 draws it above the number; y5 draws it top-left of the page; t3 doesn't draw it. |
| Timing | `at` = the moment the number lands. t2 and t3 begin rolling at−0.9 s; y5 changes page and begins rolling at at−0.7 s. So for `number`, at must be at least 0.9 (y5: 0.7), otherwise the roll is already mostly complete on frame 0. |
| Position | t2: its own full screen; the previous screen starts exiting at at−0.9 s, it doesn't overlay a card. t3: a reserved strip above the chart area, right-aligned, caption to the left of the number. y5: its own page. |

### Cues Recognised by Each Grammar

Each section's first line is the spec-level `data`; the table lists the cues. "Minimal spec" is the smallest write-up that renders a decent-looking segment — copy the structure, swap in your own subject matter. The first cue in every minimal spec is a visual event, not a title.

#### t1_3b1b (3b1b / manim explainer: formulas, curves, key points)

Spec-level data: none.

| kind | Fields | Description | Example |
|---|---|---|---|
| `title` | `text`, `data.color`, `dur` | Writes in starting at at; when another title arrives the previous one shifts up and fades out. Too long: shrink font first, then wrap to two lines. Don't use as an opener — show an object on the first frame | `{"at":4,"kind":"title","text":"注意力就是加权平均"}` |
| `equation` | `data.tokens` or `text`, `dur` (first: 1.2 s, subsequent: 1.5 s) | Token: `{s, it?, col?, gap?, sub?, sup?, size?}`; `col` accepts a manim colour name (`BLUE_C` `YELLOW` `GREEN_C` `TEAL_C` `RED_C` …) or #hex. With only `text`, auto-splits: single letters italic, runs of letters (like "softmax") upright. Each subsequent equation Transforms from the previous | `{"at":1,"kind":"equation","text":"softmax(QK)V"}` |
| `point` | `text`, `dur` | Write one sentence per line; when a new one arrives the previous ones dim. If they don't fit: first give up curve space (vertical 50%→30%), then shrink font (≥ 0.6×); if still insufficient, when a new point arrives the earliest one fades while the block scrolls up (warns) | `{"at":3,"kind":"point","text":"先算相似度"}` |
| `line` | `data.values` (evenly-spaced y) or `data.points` (`[[x,y],…]`), `text` = curve label, `data.color`, `dur` | Axes Created first, then curve drawn; second curve onwards morphs from the previous one. With a line: landscape = text left / chart right; vertical = chart top / text bottom | `{"at":2,"kind":"line","text":"损失","data":{"values":[9,5,3,2,1.5]}}` |
| `highlight` | `data.index` (which point, 0-indexed, default latest) or `data.target:"equation"` | Indicate + yellow box, left in place | `{"at":5,"kind":"highlight","data":{"index":0}}` |

Minimal spec:
```json
{"grammar":"t1_3b1b","duration":6,"cues":[
  {"at":0,"kind":"line","text":"每个词的权重","data":{"values":[1,2,7,2,1]}},
  {"at":1.6,"kind":"equation","text":"softmax(QK)V"},
  {"at":3.4,"kind":"point","text":"越像的词权重越大"},
  {"at":4.6,"kind":"highlight","data":{"target":"equation"}}]}
```

#### t2_keynote_ui (Launch keynote UI: feature cards, screenshot cards, large numbers)

Spec-level data: `eyebrow` (small text above title), `title`, `subtitle`, `accent` (accent colour, default `#3d6bff`), `frame` (screenshot card packaging: default `"full"` full-bleed; `"glass"` is the legacy frosted-glass card — optional, use sparingly).

| kind | Fields | Description | Example |
|---|---|---|---|
| `title` | `text`/`sub` override data.title/subtitle | Emerges from blur starting at at. Don't use as opener — screenshots or numbers first | `{"at":5,"kind":"title"}` |
| `card` / `step` / `image` (synonyms) | `text` card title, `sub` caption, `image` screenshot; `data.step` specifies step number; imageless card can add `data.icon` (`wave memory agent clock phone layers chart code check play bolt lock`), `data.value/prefix/suffix/decimals/label` (on-card counter) | With image (default `frame:"full"`): one full-bleed screenshot per screen, aspect-ratio locked without cropping; `data.fit:"cover"` crops to fill with focus point `data.focus:[fx,fy]`; the four sides are padded with a darkened blurred version of the image; `text`/`sub` are a black torn-edge label in the lower-left; at this frame hard-cuts in (0.17 s light slam); when the previous screen is also full-bleed, cross-pans at the same zoom for 0.30 s. `data.frame:"glass"` uses the legacy glass card. Also recognises `frames` (screen-recording frames). No image: up to 3 consecutive imageless cards sit side by side on one screen | `{"at":2,"kind":"card","text":"一句话出图","sub":"不用写提示词","data":{"icon":"bolt"}}` |
| `highlight` | `data.rect=[x,y,w,h]` (relative to screenshot 0..1), `text` optional label, `data.fill` (target fill ratio after push, default 0.42) | Boxes a region of the current screenshot and dims the rest; in full-bleed mode the camera simultaneously pushes in (minimum 18% push-in, maximum 2.6×; default slow push 0.9 s; `"camera":"snap"` in spec top-level `data` for 0.28 s punch-in); the next highlight on the same image pans over (default 0.7 s, snap 0.30 s) | `{"at":5,"kind":"highlight","data":{"rect":[0.6,0.2,0.2,0.1]}}` |
| `number` | See number contract above; `data.over: true` | Its own full screen. `data.over: true` and previous screen is full-bleed: don't switch screens — pull back to the full screenshot, dim it, and slam the number on top for the count-up. Use when the number is about what's in that screenshot; don't cut to a light-blob background | `{"at":4,"kind":"number","text":"每月活跃用户","data":{"value":1.2,"decimals":1,"suffix":" 亿"}}` |

Minimal spec:
```json
{"grammar":"t2_keynote_ui","duration":6,"cues":[
  {"at":0.9,"kind":"number","text":"每月活跃用户","data":{"value":1.2,"decimals":1,"suffix":" 亿"}},
  {"at":2.4,"kind":"card","text":"语音输入","sub":"说完就转成文字","data":{"icon":"wave"}},
  {"at":3.6,"kind":"card","text":"长期记忆","sub":"记得你上次说过什么","data":{"icon":"memory"}}]}
```
This is the no-screenshot form. When you have a product screenshot, open with a screenshot card (`{"at":0,"kind":"card","image":"截图.png","text":"…"}`, see `examples/t2_keynote_ui.json`; two real full-bleed screenshots with push-in and pan, see `examples/t2_fullbleed_pulse.json`).

#### t3_finance_chart (Economist-style data chart)

Spec-level data: `title`; `unit` (subtitle: metric and unit; shrinks then wraps to two lines if it doesn't fit); `source` (bottom-left source line; same wrapping rules, and clears space for the bottom-right badge); `badge?` (bottom-right badge drawn only when written, e.g. "示意数据"; never write it for real data); `chart: "bar"|"line"|"candle"`; `series: [{label, value, color?}]` or K-line `[{label, o, h, l, c}]`; `decimals` (bar/point labels, default 1); `prefix`; `suffix`; `highlight: {index, text, sub}`; `colors: {main, accent, dim}`; `upDown: "cn"` (red up / green down, default) `|"us"`; `xAxis: "category"|"time"` (bars default to category with every bar labelled; line/K-line default to time with thinned labels); `theme`: `"light"` (white background, default) `|"dark"` (dark background light text), any of the 8 palette names (`"paper"` is now the paper palette), or `{bg, ink, sub, grid, bar, dim, red…}`. When no theme is set but `safe.fill` carries the film's background colour, the chart uses that colour as its background and automatically switches to dark-background light-text mode for dark colours.

**Keep chart shots in the film's world**: the chart background should match the colour family of the surrounding shots (use `theme:"dark"` or put the film's background colour in `safe.fill` for dark films); don't suddenly cut to a white report card in a night scene or dark film. Better still: render the chart as a transparent clip with `--alpha` and composite it onto an in-world surface — a screen, a blackboard, a sheet of paper.

| kind | Fields | Description | Example |
|---|---|---|---|
| `title` | — | Moment the layout (title, subtitle, source) appears. Optional: if omitted, the layout appears at t=0 with the axes | `{"at":0,"kind":"title"}` |
| `bar` / `line` / `candle` | `dur` (default based on bar count); bar chart accepts multiple `bar` cues each with `data.index` (number or array) = these bars grow at this moment | Axes → data grow in. Bars always from 0; when a line/K-line y-axis doesn't start from 0, the subtitle automatically adds a note. Negative bar values are labelled below the bar bottom, callout points downward. Category labels shrink then stagger to two rows if they don't fit; the annotated bar always keeps its label. Tick steps match the decimal places of the step size | `{"at":1.2,"kind":"bar"}` |
| `highlight` | `text`/`sub` override data.highlight, `data.index` which bar | At this frame the callout dot pops out, leader line + label. If an angled placement would collide with other bars or values, it goes directly above the bar; if the top is too tight, an extra tick is automatically added | `{"at":4,"kind":"highlight","data":{"index":2},"text":"最高"}` |
| `number` | See number contract above | Reserved strip above the chart area; won't overlap the line head | `{"at":5,"kind":"number","text":"最新收盘","data":{"value":259.97,"prefix":"¥","decimals":2}}` |

Minimal spec:
```json
{"grammar":"t3_finance_chart","duration":6,"data":{"title":"三家公司的研发投入","unit":"2024 年，亿元","source":"来源：示意数据","badge":"示意数据","chart":"bar",
  "series":[{"label":"甲","value":120},{"label":"乙","value":86},{"label":"丙","value":43}]},"cues":[
  {"at":0.3,"kind":"bar"},{"at":3.5,"kind":"highlight","data":{"index":0},"text":"最多"}]}
```

#### y1_kurzgesagt (Flat science explainer: central object + satellite nodes + scale traversal)

Spec-level data: `center` (name of the first-level central object); `center_style: {color, shape: "circle"|"rounded"|"hex"|"diamond", ring: true}` (omit to auto-generate a neutral style based on the name: colour and shape are determined by the text, same name = same style, no orbit ring); `image` (crop an image into the central object, name moves to a pill below); `flow: true` (nodes form a chain, signal flows through sequentially with sequence numbers — use for "step order" narratives). The environment layer (star twinkle, particles, signal pulses) moves gently throughout; central object, nodes, and labels stop once landed; camera does not slow-push.

| kind | Fields | Description | Example |
|---|---|---|---|
| `title` | `text` | Top title with per-character float-up; fades out 0.5 s after the first highlight or enter's at. Don't use as opener — show nodes on the first frame | `{"at":1,"kind":"title","text":"一次搜索经历了什么"}` |
| `point` | `text`, `data.color` | One satellite node + label pill on the current level. ≤3 nodes arc the top half; ≥4 wrap all the way around. Labels are clamped inside the current shot; long labels shrink | `{"at":1.4,"kind":"point","text":"分词"}` |
| `highlight` | `data.index` (counts only current-level points, 0-indexed, default latest) | Push in toward that node (≈30%; default slow push 0.9 s; `"camera":"snap"` in spec top-level `data` for punch-in 0.28 s); others dim. If already pushed in, the next highlight pans at the same zoom | `{"at":5,"kind":"highlight","data":{"index":1}}` |
| `enter` | `data.index` (which node to drill into, default latest), `text` (new centre name, default node name), `data.style` (new centre's center_style), `dur` (default 1.6) | Scale traversal: at this frame starts pushing in; at ≈ at+0.55×dur the screen is filled with the node's colour and cuts to the new level; at at+dur the new central object has finished pulling out. Subsequent points belong to the new level (write the first new point's at after at+dur) | `{"at":4,"kind":"enter","data":{"index":0},"text":"分词器"}` |

Minimal spec:
```json
{"grammar":"y1_kurzgesagt","duration":6,"data":{"center":"搜索引擎"},"cues":[
  {"at":0.3,"kind":"point","text":"抓取"},{"at":1.1,"kind":"point","text":"索引"},
  {"at":2.2,"kind":"enter","data":{"index":1},"text":"倒排索引"},
  {"at":4.2,"kind":"point","text":"词 → 网页"}]}
```

#### y2_vox (Collage desktop: screenshots, clippings, red string, highlighter)

Spec-level data: none.

| kind | Fields | Description | Example |
|---|---|---|---|
| `image` / `clip` (synonyms) | `image` or `frames` (video frames), `text` = black torn-edge label in the lower-left (12 fps typewriter), `data.halftone: true` converts to greyscale halftone, `data.fit:"cover"` + `data.focus` + `data.aspect` crops to fill by focus point | Slides onto the desktop starting at at. Print-style (white border, aged paper, shadow, tape), aspect-ratio locked by default. When the camera dwells on one item it fills 80–90% of the frame. Landscape: laid out left→right; vertical: top→bottom. Red string drawn out first; camera pans there 0.30 s before at | `{"at":1,"kind":"image","image":"截图.png","text":"官网首页"}` |
| `title` | `text` (empty or whitespace-only warns and is skipped) | Black-background white-text label strip, typed at 13 chars/s. Good for a concluding point; don't use as opener | `{"at":5,"kind":"title","text":"这件事有三条线索"}` |
| `point` | `text` | Horizontal index card, typewriter (speeds up to 40 chars/s max when spacing is tight) | `{"at":4,"kind":"point","text":"发布时间比公告早一天"}` |
| `highlight` | `data.rect=[x,y,w,h]` (relative to **current image** 0..1; relative to the cropped frame when `fit:"cover"`) | Highlighter sweep → red circle → camera pushes in (default slow push 0.9 s; `"camera":"snap"` punch-in 0.28 s; when the box start is off-screen the camera moves there first, arriving one frame before at). rect coordinates are often off by 20–30% by eye — use `--stills` to verify | `{"at":2.5,"kind":"highlight","data":{"rect":[0.1,0.2,0.3,0.1]}}` |

Minimal spec (y2 requires real material: if you have no screenshot, photo, or original text to paste, don't use y2 — see Section II):
```json
{"grammar":"y2_vox","duration":6,"cues":[
  {"at":0,"kind":"image","image":"截图.png","text":"官网公告"},
  {"at":1.6,"kind":"highlight","data":{"rect":[0.1,0.2,0.3,0.1]}},
  {"at":4,"kind":"point","text":"两周后官网改了价格"}]}
```

#### y3_whiteboard (Whiteboard drawing: write as you speak, draw icons, circle key points)

Spec-level data: none.

| kind | Fields | Description | Example |
|---|---|---|---|
| `title` | `text` | Writes at 7.5 chars/s; auto-speeds up if the next cue is coming fast. Don't use as opener — draw the first stroke first | `{"at":4,"kind":"title","text":"为什么要写测试"}` |
| `point` | `text` | Draws a small circle as the bullet point, then writes at 16 chars/s | `{"at":1.5,"kind":"point","text":"改代码时有人替你盯着"}` |
| `draw` | `data.icon` (`person cat network doc chat bulb check cross screen stack gear target clock chart`; unknown icon warns and only draws the caption), `text` = caption below the icon (shrinks if it doesn't fit), `data.arrow: false` suppresses arrow | Placed beside the text just written. Consecutive draw items are connected with orange arrows | `{"at":2.5,"kind":"draw","text":"自动检查","data":{"icon":"check"}}` |
| `image` | `image` | Zigzag reveal + hand-drawn border, aspect-ratio locked | `{"at":4,"kind":"image","image":"草图.png"}` |
| `highlight` | `data.index` (0-indexed), `data.target`: `"title"` / `"draw"` / `"image"` (default counts points), `data.style: "underline"` | Orange circle or underline. No index = the latest written item | `{"at":5,"kind":"highlight","data":{"index":0,"style":"underline"}}` |

Minimal spec:
```json
{"grammar":"y3_whiteboard","duration":6,"cues":[
  {"at":0,"kind":"draw","text":"自动检查","data":{"icon":"check"}},
  {"at":1.4,"kind":"point","text":"改代码时有人替你盯着"},
  {"at":3.0,"kind":"draw","text":"敢放心重构","data":{"icon":"gear"}},
  {"at":4.6,"kind":"highlight","data":{"target":"draw","index":0}}]}
```

#### y4_storytime (Bean-character storytelling: speech bubbles, reaction close-up, insert shot)

Spec-level data: `character` — **must be your own frame library** (AI-generated frames; see `references/en/10-characters.md` and the delivery checklist `references/en/character-detail.md`). The code-drawn presets (`neutral`/`bun`/`author`) and style objects are deprecated — writing them or omitting `character` both cause startup failure. Don't use y4 if you can't generate images; use y2/y5 or use `scenes` with hands and objects instead. Frame library: write a directory path (render.py uses filenames without extensions as pose names: `rest talk point shrug type stiff react back`; `<pose>_open` is the open-mouth frame), or write `{"frames": {"talk": "我/talk.png", …}}`. Frames need transparent backgrounds with the character's feet centred at the bottom edge; at minimum you need `rest` or `talk`. The camera holds still; the character doesn't breathe — life comes from fast cuts, reaction close-ups slamming in, and insert shots. When `window.VO_ENV` is present, lip-sync follows the voiceover envelope; otherwise syncs from character count. `safe` only affects text (speech bubbles, insert-shot large text); the character, desk, and reaction close-up face are drawn geometry and will intrude into the subtitle band in vertical layouts — subtitles overlapping the body are still readable, but don't rely on the elements clearing the subtitle area.

| kind | Fields | Description | Example |
|---|---|---|---|
| `point` / `title` (synonyms) | `text` = voiceover text (sets mouth-open duration, ≈ 6.5 chars/s); `sub` = short phrase shown in the bubble (≤12 chars recommended; if omitted `text` is shown instead); `data.pose`: `talk` / `point` / `shrug` / `type` | Bubble pops up at this frame, mouth opens | `{"at":0.1,"kind":"point","text":"我让它帮我改个错别字，","sub":"就改一个字"}` |
| `highlight` | `data.mark` (default "？") | "？" or "！" pops up + arms-out worried pose | `{"at":4,"kind":"highlight","data":{"mark":"！"}}` |
| `react` | `dur` (from at, default until next cue) | Jump to reaction extreme close-up: dead-fish eyes + sweat drop, dead silent | `{"at":3,"kind":"react"}` |
| `insert` | `sub` = the line they typed on the computer (wraps, max 3 lines); `text` = large text that slams in; `data.hit` (**absolute seconds**, default at+1.3; at+0.4 when there's no sub); `data.count` + `data.unit` (counter in the top-right stops at this value when the slam lands); `data.app` (window title, default "AI助手"); `dur` (from at, default until next cue) | Cuts to a close-up of the screen on the desk: typing → the reply scrolls faster and faster like a wall of code → large text slams in | `{"at":2,"kind":"insert","sub":"改个错别字","text":"改了 40 个文件","data":{"hit":3.4}}` |

Minimal spec:
```json
{"grammar":"y4_storytime","duration":6,"cues":[
  {"at":0.1,"kind":"insert","sub":"把「的」改成「得」","text":"改了 40 个文件","data":{"hit":1.5}},
  {"at":2.6,"kind":"react"},
  {"at":4.0,"kind":"point","text":"我只让它改一个字。","sub":"就改一个字"}]}
```

#### y5_kinetic_type (Kinetic type: one cue = one page)

Spec-level data: `palette: [[background, text], …]` (rotates through pages).

| kind | Fields | Description | Example |
|---|---|---|---|
| `title` / `point` | `text` headline (auto-shrinks, max two lines); `sub` supporting sentence; `data.label` (small label top-left); `data.key` (word in the supporting sentence to colour); `data.num` (oversized background sequence number) | Headline slams in at this frame; page change is a colour-band wipe (starts 0.3 s before at). Two or more points = list: shows a progress track + oversized background sequence number | `{"at":1.8,"kind":"point","text":"慢","sub":"每次只改一处","data":{"label":"01","key":"一处"}}` |
| `number` | See number contract above | One page, large number | `{"at":4,"kind":"number","sub":"一次跑通的比例","data":{"value":87.5,"decimals":1,"suffix":"%"}}` |
| `highlight` | `data.word` (word within the headline; highlights whole headline if omitted) | Highlighter + slight scale-up. When the highlighter and text are the same colour (deep-blue background, yellow text page), the text under the pen reverses to the background colour. If `word` is not in the headline, warns and does nothing (use `data.key` for words in the supporting sentence) | `{"at":3,"kind":"highlight","data":{"word":"慢"}}` |

Minimal spec:
```json
{"grammar":"y5_kinetic_type","duration":5,"cues":[
  {"at":0.7,"kind":"number","sub":"一次跑通的比例","data":{"value":87.5,"decimals":1,"suffix":"%"}},
  {"at":2.2,"kind":"point","text":"慢","sub":"每次只改一处","data":{"key":"一处"}},
  {"at":3.6,"kind":"highlight","data":{"word":"慢"}}]}
```

### Examples (`scripts/engine/examples/`)

```sh
cd <skill>/scripts
uv run --with playwright python engine/render.py --spec engine/examples/t3_finance_chart.json --out t3.mp4   # Nvidia five-year revenue (10-K real data): bars grow in three waves, each matching a spoken phrase
uv run --with playwright python engine/render.py --spec engine/examples/t2_keynote_ui.json   --out t2.mp4   # Screenshot card opener + box-out number; vertical screenshot; then a large number
uv run --with playwright python engine/render.py --spec engine/examples/t1_3b1b.json         --out t1.mp4   # Gradient descent: loss curve first, formula morphs, curve morphs
uv run --with playwright python engine/render.py --spec engine/examples/y2_vox.json          --out y2.mp4   # Screenshot opens flat on desktop, highlighter + red circle + push-in, closing label
uv run --with playwright python engine/render.py --spec engine/examples/y3_whiteboard.json   --out y3.mp4   # Whiteboard: draw first then write, icons and sentences alternate, circle first icon at the end
uv run --with playwright python engine/render.py --spec engine/examples/t2_fullbleed_pulse.json --out t2b.mp4   # Two real terminal screenshots full-bleed: push to count-up, pan to second screenshot, pull back to full screenshot then number slams on top to close (number's data.over)
# Also: y1_kurzgesagt (water drop → drill into a diatom) / y4_storytime (screen close-up opener) / y5_kinetic_type (number-slam opener); any example adds --width 1080 --height 1920 for vertical; example assets in examples/assets/: three charts are t3's own rendered last frames (numbers landed, no playhead, no path), two terminal screenshots are genuine python3 -m timeit output captured from a real run
# Examples show structure: don't copy the subject matter, composition, or assets into a finished film
```

### Notes for the Pipeline Director

- Don't pack too many cues into one animation segment: based on the shot lengths in Section I, 2–5 cues per 3–8 s segment feels comfortable; too many cues and the typewriter is forced to speed up, or the camera can't reach position in time.
- **Three spec-writing baselines** (slideshow-style PPT usually starts here): the first cue is a visual event (curve, screenshot, data growth, drill-in, icon, screen close-up, number slam) — never a title at t=0; text-based cues (title, point) account for no more than half the cues, and the same kind never appears 3 times in a row; each on-screen `text` or `sub` is no more than 14 characters (when y4 has `sub`, `text` only controls mouth-open timing and never appears on screen, so the 14-character rule doesn't apply to it).
- Grammars with on-screen text (t1/t3/y3/y5) compete for attention with the pipeline's burnt-in subtitles; when compositing, move the subtitles out of the way or don't burn them for this segment.
- Transparent mode (`--alpha`) only removes the background layer; element shadows remain. y2's paper scraps and t2's glass cards read as "floating cards" on a transparent background. t3's text carries a halo in the theme's background colour (default white-paper black-text = white halo; `theme:"dark"` = light text dark halo), so it reads clearly when composited over other footage. t1's white text carries a dark halo.
- **In a vertical-layout film, crop screenshots to the sentence the voiceover is currently reading.** A vertical desktop screenshot is about 900 px wide; 16 px body text in a webpage needs a 2–2.5× push-in to read clearly. When you frame a wide line spanning nearly the full frame width, there's no room for the red circle, so the camera can't push in. Split one line that spans two wrapped rows into two `highlight` cues, each targeting one key word (2026-10-04 test: split cues, 2.4× push-in, character height ≈ 50 px). `rect` coordinates measured by eye are typically off by 20–30%; use `--stills` to render a still and verify.
- **Step-based animations in grammar files must count from at.** "One-on-twos" and similar stepping animations, if they round to an absolute time grid (`MO.step(t, 12)`), may show the element up to one grid slot before at (2 frames at 30 fps). Write `MO.step(t − at, 12)` so at is the first frame. y4 character frames still use absolute 24 fps; cue alignment may be off by 1 frame — check before use.

---

## VI. Regression (ingested into skill on 2026-10-04)

| Subject | Result |
|---|---|
| 16 original-film segments (`eras.js`), 36 full-style gallery clips (`--film gallery`) | 61 frames at the same timestamps, pixel-perfect before and after; qa all no errors, deterministic ✓; motion/jump counts unchanged; render time back-to-back 21.5 → 22.3 ms/frame (within noise) |
| 8 demo films vs. original experimental films | 16 timestamps per film (including transition windows), pixel-perfect; qa 25 segments all no errors, deterministic ✓; motion, jump, and render time match the original project (first segment start changed from 8/16 s to 0, so qa sampling window differs and first-segment numbers slightly differ) |
| After 2026-10-05 final-review fixes | 8 example specs + 16 original segments + 36 gallery clips + 8 demo films = 87 segments, qa all deterministic ✓, no page errors; example stills show only expected changes (t2 1-level colour difference = determinism fix; y5 deep-blue page keyword changed to orange; y1 title actually fades out); independent final review of 36 specs (landscape examples, vertical, stress, edge, alpha) zero 🔴 |
| After 2026-10-10 pulse camera, real-asset items, and vertical full films in the engine | 16 original segments, 36 full-style gallery clips, 8 demo films, long-scroll demo — 18 timestamps each; landscape before/after pixel-perfect (demo film y4 explicitly uses `char: 'author'`); 9 example specs rendered both landscape and vertical, qa deterministic ✓; vertical test-film push/bands/iris/comicPanels transitions computed for 1080×1920 |
| Known jumps | y1_s3 (42×→1× pull-back mid-segment), y2_s2/s3 (whip and push-into-photo), t1_s3 (drill into neuron), y5 beat accent — all are intentional camera push/pulls or beat flashes; they were in the original films. From 2026-10-10, qa counts monotonic smooth push/pull/pan/slam under 0.35 s as camera events: t1_s3's 1.51 s, y5 k4_agent's 2.2 s, and t3_s1's 2.1 s are reclassified as camera events; all others are longer than 0.35 s (or are single-frame one-on-two jumps) and still report as jumps |
| 2026-10-10 gate and one-command delivery | Before/after qa change: 8 demo films and 9 example specs — motion, still-frame pairs, determinism, and framing unchanged; jumps only decreased by those reclassified as camera events (by event count: demo films 3, t2_keynote_ui 1, y4_storytime 3, y5_kinetic_type 2 — all 0.07–0.34 s push/pull, slam, or pose snap); push/pulls over 0.35 s and single-frame one-on-twos still report. Composite film (same three images, 3 s per shot): per-shot steady slow push 7.5% fast-motion frames = 0.000 red light; per-shot single 0.3 s punch-in 30% = 0.095 green light. In full-film mode, one 0.3 s punch-in previously counted as 8 jumps, now counts as 1 camera event; a single-frame white flash still counts as a jump |

---

## VII. Lessons Learned

- **(2026-10-04, voiceover pipeline integration test) y2 highlight's starting point was off-screen after a push-in, so the highlighter started sweeping off-screen.** The audience saw it 7 frames late. Fixed: when the box's starting point is not in the current shot, the camera moves there first and arrives one frame before at; the push-in scale is simultaneously constrained so the red circle stays on screen (the red circle is 1.24× the box width and 1.5× the box height).
- **(2026-10-04, parameterised clip review) t3 tick labels were lying, category bars had no names, large number overlapped line head.** `fmtTick` only kept decimal places when the step was < 1; step of 2.5 printed −2.5/2.5/7.5 as −3/3/8. With 10 category bars, vertical layout sampled every `ceil(n/6)` bars — the annotated "top" bar happened to have no label. The `number` was pinned to the top-right of the chart area, exactly where an ascending line head was. All three fixed (see t3 row in Section V).
- **(Same test) y2 text card finished typing after the camera had already moved on.** Camera departure was keyed only to next-cue's at−0.95. Now it waits "finish typing + 0.5 s hold" before departing (at the latest at−0.4); when spacing is tight, typing speeds up from 13 to a maximum of 40 chars/s.
- **(Same test) PuHui Medium/Bold full-width space has zero width.** The source fonts (Alibaba PuHuiTi 3.0 65/85) are themselves 0-width; "美元　纵轴未从 0 开始" ran together into one string. `font_subset.py` automatically sets the full-width space to the same width as "一" when subsetting; existing files were repaired with `--fix-widths`.
- **(Same test) t3 vertical callout landed exactly on the burned-in subtitle band.** Chart bottom is at y ≈ 1660 vertical; callout at y ≈ 1460, overlapping the subtitle band of a 1080×1920 film (y 1400–1520). Added `safe`.

- **(2026-10-05 parameterised clip final review) The examples all checked out, but switching to vertical and real durations caused overflow.** An independent review of 33 specs (landscape examples, author-written vertical, stress, edge, alpha) found 12 🔴: y2 empty text caused the renderer to loop and hang; y5 deep-blue page highlighter and yellow text were the same colour, erasing the headline; y5 vertical long number overflowed frame; t1 vertical 7 points pressed into the subtitle band; t3 vertical subtitle and source lines overflowed; t3 vertical callout overlapped adjacent bar; t3 transparent background composited onto dark background became invisible; y1 vertical labels were clipped; y3 vertical caption overflowed; y4 vertical typing overflowed bubble; t2 same-timestamp renders differed by 1 colour level (reused buffer carried previous frame residue). In self-testing: `TY.charsIn` not multiplying outer opacity (y1 title's promised fade-out was a one-frame disappear), t3 lowest negative bar's label overlapping the category name, `TY.fit` only counting lines without measuring line width. Pattern: **every "won't fit" scenario needs an escape hatch — shrink first, then wrap, then give way, warn last**; a layout tuned to example durations breaks the moment it hits real voiceover.

- **Two experiment groups both wrote `window.YT` with completely different APIs.** At merge time, split by function into 8 namespaces and renamed things with the same name but different meanings: G2's `zoomThrough` (crash into colour block) → `fillZoom`; G2's `spring(t, freq, decay)` → `MO.springHz`; G1's `circlePts` (open ellipse) → `DG.ellipsePts`.
- **woff2 fonts failed glyph checking.** The engine's `U.loadCmaps` only parses WOFF1/TTF; G3's woff2 fonts triggered `console.error` on load and qa failed. All fonts converted to woff at ingest.
- **Background phase varied with the film's position on the timeline.** The launch keynote demo was originally authored at t=8–16 s; when pulled out as a standalone film, the composition changed completely. Fixed with `T2.PHASE = 8` to lock the approved composition. Parameterised clips read only the segment time for light blobs and are not affected.
- **Ticks must fully contain the data.** `CH.ticks` only outputs whole ticks within the interval; with a max value of 130 the highest tick could be 100, letting bars poke above the axes. Clips now pad one tick above and below.
- **System fonts are not in the skill.** The serif font (Songti SC) in the Vox demo and the code font (Menlo) in the kinetic-type demo are macOS system fonts and will look different on another machine. Parameterised clips have been fully migrated to fonts bundled with the skill.

---

## Voiceover Full Film and the 9th Grammar

The 8 grammars above all have parameterised clips. There is also a [presenter-style finance explainer](animation-grammars/y6_presenter_explainer.md), which ships a grammar spec and reference full-film code but no parameterised clip yet. For full voiceover production, framing QA, and the feedback loop, see [Full Narrated Films and the Feedback Loop](12-full-narrated-films-and-feedback-loop.md).
