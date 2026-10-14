# 07 · Proven practices: what has been shown to work

[中文](../07-正面经验.md) · **English**

This page records reusable practices, the evidence for them, and the conditions under which they apply.

This page records **only things that went right**: the practice, the evidence (what was measured / who reused it successfully and under what circumstances), why it works, and when to use it. Pitfalls are in the "Pitfalls" sections of the individual references. Every entry carries a source; later users who replicate it successfully add a note to the evidence, and those who fail add a boundary.

---

## 1. Direction and mechanism

**1. Transition = the signature language of the next style.**
- Evidence: all 15 transitions in the Art History Speedrun were designed this way; two independent agents in migration tests A and B both rated it "the single most valuable, most transferable sentence in the entire skill"; 9 new transitions (Klimt gold-spiral unfurl, Munch colour-band pressing down, Dunhuang flying-apsara streamer peeling away the old painting, polka-dot growth, melting liquid drop, hard-edge sunlight, wet-paper ink bloom, VHS tear …) were derived almost directly from this one sentence without detours.
- Why: a transition accomplishes two things at once — it says farewell to the old style and announces the new. The viewer knows "who's next" within 0.3 seconds.
- How to use: list the most recognisable formal elements of the new style (material, mark-making, motifs, medium artefacts); pick one that can go "from nothing to full"; make it grow out of an object already in the frame (cat, cup, head).

**2. Speedrun/traversal: one rig, one choreography, N drawing styles = "the same characters travelling through eras" for free.**
- Evidence: RIG.girl/RIG.cat return Path2D + anchors; all 36 styles reuse them; both A and B said "when the style changes, the person and cat stay in place — position and motion are automatically consistent, this effect is free".
- How to use: use only for speedrun/traversal films where "the same scene changes styles". Define the character rig and motion curves first, then write the styles; styles change only "how to draw", not "where, or how to move". For other subjects, compose the scene for the subject — the style itself can determine the composition; do not reuse this rig's positions.

**3. The protagonist's action must be continuous across segments, driven by global film time.**
- Evidence: migration test A first version re-played the drink action per segment on local time; review note verbatim: "viewers see her lift the cup five times, not the same instant in five styles"; after switching to global film time (`PAINT.cupCycle(t)`), poses at both sides of a transition matched, and the "two heads" glitch also disappeared.
- How to use: in speedrun/traversal films, character action always uses global film time t; only "a performance exclusive to one segment" uses local lt.

**4. Beat grid + beat impact applied to both old and new layers.**
- Evidence: v1 impacted only the new layer; review measured that 6 of 15 transitions had a 0.1–0.17 s delayed beat; after applying impact to both layers simultaneously, all 15 transitions' first visible change landed on the beat (±2 frames), beat-frame frame difference 7–33.
- How to use: in any beat-cut edit, the beat frame must have a whole-frame visible change.

**5. Open with the first painting "drawing itself".**
- Evidence: migration test A — the ink-wash segment's first 0.45 s had strokes reveal-writing and ink blooming; review approved it; frame 0 is no longer a blank page.
- How to use: when the first segment of a film has no transition to borrow, open with that style's "drawing process" (brushstrokes writing in, print-making colour layers landing one by one, pixels lighting up row by row).

## 2. Visual aesthetics

**6. Area palette matters more than colour jitter.**
- Evidence: Van Gogh first version used only colour jitter — it was "noise within one blue"; adding a 7–8 colour group per region (`P.swatch`) is what made it Van Gogh. A's Munch (sky/fjord/mountain/wall/ground each with its own group) was copied directly and worked.
- How to use: for any stroke/dab style, define colour groups per region first; each stroke draws from the group, then blend in 30–45% of the underpainting colour to preserve value.

**7. Large areas to the renderer; small objects and characters on their own layer; line pass last.**
- Evidence: sunflowers and table legs were shattered by large strokes; separating the layers made them clear; B's Hopper "two-version light clip" is a generalisation of this principle.
- Boundary: ink wash, printmaking, and pattern-style pipelines have a different order (paper is the base, ink only adds on top; the pattern is itself the renderer) — see reference 04.

**8. Characters must also go through the same renderer, or they look like a pasted-on cut-out.**
- Evidence: across 36 styles, characters that went through the renderer (Van Gogh fine strokes, mosaic tiles, 8-bit pixels, Cubist facets, black-figure silhouette, shadow-puppet cutout) blended best; characters done with flat-colour vector rig only (ink-wash figure 6/10, Ghibli figure "looks like flat vector", Dalí "leans toward flat illustration") were the weakest point in those segments.
- How to use: after flat-colour character, apply at least one "material treatment from that style" — strokes, grain, paper-texture multiply, ink-bloom edge, halftone, colour-register offset.

**9. Style-specific text drawn as paths looks more like the style than a font.**
- Evidence: B's Cyrillic block letters (5×7 module), neon-tube kana; Roman mosaic text (monospace thick strokes, each stroke ≥ 2 stone widths). Font subsets with missing glyphs silently fall back to the system font — change machines and it looks different.
- How to use: for titles, signs, and inscriptions, prefer paths drawn in the style's material; when a font must be used, verify the glyphs are present first.

**10. The physical process of the material is the renderer.**
- Evidence: Ukiyo-e "fill offset (3, 2) px from ink line + 暈し (gradation) horizontal bleed" = woodblock colour registration in animation form; mosaic "layout computed once, colour flows through tiles each frame" = the natural way to animate real mosaic; gold leaf "horizontal burnishing noise, y-frequency 20× the x-frequency" produced metal feel on the first try and was reused directly by A's Klimt.
- How to use: before writing a new renderer, ask "how is this kind of painting made in the real world" and write that process as code.

**11. Make small things bigger than your instinct says.**
- Evidence: Ukiyo-e wave claws at 22–50 px are illegible; 44–74 px reads as "The Great Wave off Kanagawa". A enlarged Qi Baishi's shrimp 1.45× and the flying apsaras 1.35× before they were readable.

## 3. Motion

**12. Art-style picture: every shot = main action + 2–4 small loops drawn from that era's motifs.**
- Evidence: simply cutting images cannot convey in-shot motion; across the 16 segments done this way, QA motion area 1.6%–14%, no jump frames.
- Boundary: this applies to art-style pictures (the painting must stay alive). For explainer shots, see point 29 — motion is on the events.
- How to use: the motif action list comes from the breakdown's motion heat maps; without reference footage, list the 3 most recognisable formal elements of the style, each with a way to animate.

**13. Let the direction field vary continuously over time, rather than re-seeding at 8 fps.**
- Evidence: whole-frame 8 fps re-seed frame difference 18–20 (larger than transitions); review read it as "the painting is flickering"; after fixing stroke positions and making the direction field sway continuously, jump-frames 0, motion area 9%. Boiling reserved for line art only.

**14. Rolling pattern modulo period equals the pattern's true period.**
- Evidence: A's polka-dot skirt used spacing as the modulo; the wrap-around frame jumped the whole image (frame difference 2.7×); using the hexagonal-grid two-row period as modulo eliminated it.

## 4. Stability and efficiency

**15. Spec + reference implementation + grouped parallel agents → first-pass delivery.**
- Evidence: 16 eras in 4 parallel groups, each returning in 30–35 min, all delivered usable on the first pass; the subsequent 4 groups of migration tests (20 new styles) likewise passed first-pass delivery. The spec stated the interface, available libraries, hard requirements, self-checks, and delivery notes; the reference implementation let the "five-layer structure" be copied directly.

**16. Before delivery, always dispatch an independent review agent that watches only the finished film.**
- Evidence: replication v1 review caught 4 issue classes: delayed beat, whole-frame flicker, too-static shots, and a cat continuity break; migration A review caught "lifts cup five times", "two heads", "transparent arm"; B review caught "ЧАЙ read as ЧАИ", "pink outfit looks like wearing nothing" — the author had watched 3 passes and missed all of them.

**17. Use numbers for QA: qa.py.**
- Evidence: motion area, static-frame pairs, jump frames, actual render time (with forced GPU flush), determinism — 40 seconds to verify all 16 segments. Checking only the first/last frame misses stuttering (A: Klimt 33% change but 14/48 frames static); measuring only JS time reports false 1 ms (B).

**18. All randomness uses a seed; rendering the same timestamp twice is pixel-identical.**
- Evidence: all 36 styles pass cold/warm render comparison; render does not flicker; segments can be rendered separately and spliced.

**19. Static parts fully cached; each frame only draws what moves.**
- Evidence: Bauhaus 2.5 ms, Pop Art 5 ms, 8-bit 3 ms; B cached 4 of 5 segments' background in full. Heaviest is Van Gogh (full-frame three-pass strokes) at 117 ms; the full film still renders at 60 fps in under 2 minutes.

## 5. Breakdown and reference

**20. Reference frame as image-generation reference locks composition; overlay AI design sheet with grid to read key points.**
- Evidence: gpt-image using an original-film frame as reference, with 50% overlap, is nearly pixel-perfect with the original; the girl rig's first version with hand-written coordinates looked like a boy — after overlaying a 20 px grid and reading the points, one pass read as a 17-year-old blonde girl.

**21. Motion heat map tells you "the painting is alive" before work starts.**
- Evidence: before seeing the heat map I assumed each segment was one image; the heat map showed 2.5%–34% of each segment's area in motion, and directly determined the entire route.

**22. Grid fitting uses "maximum step size under 80% inliers".**
- Evidence: minimum-residual method picks a very small step size to force-fit all points; after the change, 14.1 frames (128 BPM eighth note) was fitted from 16 detected points with 3 outliers flagged.

## 6. Scaling up (2026-10-04 evening, 36-style integration)

**23. Let independent agents each reinvent the wheel first; then consolidate into a shared library.**
- Evidence: the 4 migration-test groups each wrote their own brushes/renderers/post-processing; on integration they were merged into brush.js (7 items), render.js (14 items), post.js (6 items); after porting 20 segments to the unified library, all 16 segments' output outside the character box matched the original codebase pixel-for-pixel — the library's API was strong enough to hold real usage.
- Why: unifying the library first produces abstractions nobody uses; let real styles grow first, and consolidate once something appears twice or more ("three lines of repetition before abstraction" — and its mirror also holds: once it repeats three times, collect it).

**24. The migration test itself is the best requirements document.**
- Evidence: the task "read only the skill, make styles the skill doesn't have, write feedback" caused 4 agents to return over 60 specific issues in total (silent degradation, hardcoded film length, timing without GPU flush, rig bug, mislabelled dabs), each with a reproduction scenario; none of these were exposed by the author's own use.
- How to use: whenever the skill gains a major new capability, dispatch 2 agents who read only the skill and make problems they haven't seen before; require them to return "what helped / where things got stuck".

**25. QA tools must themselves be verified.**
- Evidence: qa.py was once all green, but during integration it was discovered the tool did not execute transition code at all — one transition referenced a non-existent function and crashed the entire frame with no report; adding a "transition smoke test" caught it. Glyph checking via measureText gave false negatives on Mac; switched to reading the font file's character map.
- How to use: for every check item, deliberately cause one failure (delete a scene, break a transition, use a missing glyph) and confirm it actually turns red.

## 7. Video animation grammar (2026-10-04 evening, YouTube 5 styles + tech/finance 3 styles)

**26. Test example clips first, then codify the grammar.**
- Evidence: G1's first-version Vox used a torn-paper transition; going back and counting frame-by-frame in 5 Vox clips, it never appeared once; whiteboard first version had a thinking bubble push-in — not in RSA clips either. G2 tested one TheOdd1sOut video: average shot 2.4 s, 70% of adjacent frames completely static — the opposite of the intuition "animation should always be moving".
- How to use: before making a grammar, run `breakdown.py` on 2–5 representative works to measure shot duration, static ratio, and transition types, then write the card. "Stylistic features" in memory are often someone else's.

**27. Camera is driven only by global film time; transition function is only responsible for compositing two shots.**
- Evidence: Kurzgesagt 60× zoom scale-traversal fully vector-redrawn throughout, no blur; Vox's desk-to-whiteboard "transition" is camera motion itself — QA jump-frames 0. G3: a push-in transition lets the outgoing shot continue pushing the camera, rather than scaling a screenshot — when pushing through a circular object, magnification must be ≥ 1100/radius or the final frame will jump.
- How to use: world canvas + viewport; do not scale-transition rendered bitmaps.

**28. The frame where it is revealed is the accent.**
- Evidence: G2 dynamic text sets the segment start as "bar line − reveal point × transition duration", so every visual event lands on the same frame as the kick drum. Same principle as point 4 (beat impact on two layers), applied to a different situation.

**29. Static does not equal stuck; but "every shot moves a bit" and "every shot slow-pushes" are the same disease.**
- Evidence: storytime's 70% static frames are the style (the punchline is the cut to a reaction close-up with a closed mouth); kinetic text stops moving after landing — the motion goes to camera and background. A Nobel literature popular-science film (2026-10-08): same voiceover, same assets, same 31-shot storyboard. r2 had every shot uniformly pushing in 7.5%, with a fixed beige background, title bar, and picture frame; the author said "feels completely like watching a PowerPoint presentation, terrible"; r3 switched to full-frame live footage, dark realistic setting, removed the page frame, changed shots to stop → 0.28 s push-in 18–32% → stop, 0.30 s same-rate pan, 0.17 s slam-in; this was approved. Completely static frames went from 16% to 72%; fast-motion frames from 0.7% to 10%. All four changes made at once — impossible to tell which one mattered. Afterwards "push in at every voiceover node" was written as a global rule; on 2026-10-12 a Nobel economics short of 102 seconds had ~48 push-ins, all pushing inward; the author said "too many times, and the rhythm is too fast, not smooth at all". The same day the author looked back at the literature film: "the literature film is mediocre".
- How to use: the QA criterion "static-frame pairs >40% reads as stuck" does not apply to explainer, narrative, or text-driven styles — stopping is correct. The root of looking like a slideshow is "the same action in every shot", regardless of whether that action is a slow push or a fast push. Camera moves when "this is what the viewer should be looking at right now": transitions use slow push, pan, pull-out (0.6–1.5 s); fast push and slam-in are reserved for accents; after pushing in there must be a corresponding pull-back. For the action table and when to count frequency, see [camera-language.md](camera-language.md).

**30. Review must check logic and numerical consistency, not just picture.**
- Evidence: G3 review caught "the output neuron connects to the hidden layer, not to pixels", "'rose 9×' should be 'rose to 9 times the original'", and "the monthly-chart endpoint ¥268 doesn't match the daily-chart endpoint ¥286.40" — three issues where the picture was perfect but the content was wrong. Hard rules for financial charts: do not truncate the axis to mislead (if truncated, write "y-axis does not start at 0"), include units, source, and a label for illustrative data.

**31. One focal point per frame; structure first, then data, then label only one thing.**
- Evidence: kinetic "key word slams in, the rest rises from a mask"; finance "axes appear first, then data, then only one thing is labelled"; 3b1b "one colour represents one concept, morphing makes the previous concept directly become the next one, almost no cuts" — three different grammars independently arrived at the same conclusion.

## 8. Characters

**32. Give humans to the image model; code handles compositing only — divide labour by "who does it best", not by "how pure the route is".**
- Evidence: same-frame three-direction comparison — code-drawn chibi character was judged "absolutely terrible"; G2's frame library and AI frames redrawn per style both "worked great"; the most widespread weakness across all 36 styles was also the character. Code's strength is rule-following (stroke fields, geometry, camera, time, physics, determinism); the model's strength is the "rightness" of human faces and figures.
- How to use: see reference 10. For every layer, ask "who draws this best" before deciding what to use.

## 9. Plugging into the voiceover pipeline (2026-10-04 night, end-to-end test)

**33. Render a clip at the finished-film frame count, using windows from the finished-film timeline — cross-cut, cross-speed-ramp, all irrelevant.**
- Evidence: the two beats to be swapped had a 3.65 s pause between them (cut in the rough edit) and the rough edit also applied a global speed-up; treating them as one continuous finished-film window (119 frames) and rendering, after compile the shot's `rate` = 1.0, rendered 119 frames = shot's 119 frames; only 1 chapter (30–57 s) was re-rendered; the other 7 chapters were untouched. Frame-to-clip alignment: moving frames 28/29, 127/137 showed offset 0 (the rest was codec noise, positive and negative symmetric).
- Why: the pipeline's director layer uses original-film seconds, the finished film uses finished-film seconds; animation only lives in the finished film. Taking windows from the finished-film timeline bypasses speed-ramp, cut-point, and "beat endpoint = next clip's start point" conversions.
- How to use: in the voiceover pipeline write a small script wrapping the three steps "draft (take window from finished-film timeline, output spec draft) → render → verify (frame-by-frame sync check)"; see reference 09 "clip contract".

**34. Write cues as "which word", not "at what second"; convert to frames just before rendering.**
- Evidence: 5 cues (pillar grows, annotation pops in, clipping revealed, two highlighters) — reveal frame vs. word-start offset −0.48 to +0.09 frames, all from rounding to frame; if the voiceover changes and the window frame count changes, render rejects rather than silently misaligning.
- Why: seconds are second-hand numbers copied from the word table, introducing error at each copy; the word is the director's true intent (a label pops in when a specific number is spoken), and conversion is the script's job.
- How to use: `{"word": "7.8", "kind": "highlight"}`; for the same word appearing multiple times, add `nth`; for advance cues, write `offset`.

**35. Vertical-screen real-screenshot: split each half-sentence the voiceover speaks into two highlighter passes, each keyed to one keyword.**
- Evidence: a full-segment box (width 0.93) left no room for a red circle, the camera couldn't push in, body text height ~20 px — illegible on a phone; splitting into two half-sentence boxes, each keyed to one keyword, push-in 2.4×, text height ~50 px; the second box is off-screen so the camera moves there first, then reveals.
- Why: the constraint in vertical screen is frame width — one focal point can only be half a sentence; Vox's grammar is "look at this one sentence" — following the voiceover sentence by sentence with circles is exactly right.
- How to use: crop screenshot from the original frame (keep a `_来源帧` (source frame) copy); verify `rect` by rendering a still with `--stills`; visually offset is often 20–30%.

**36. Layouts with text: let them clear the subtitle band, not the other way around.**
- Evidence: t3's vertical-screen original layout had annotations landing at y≈1460, overlapping the burned-in subtitles (1400–1520); after adding `safe`, charts sit at 300–1430, the same safe zone as other `contain` assets in the film, zero occlusion on extracted frames. First-round independent review: "solid white between deep-colour screenshots, the brightness jumps most noticeably"; adding `safe.fill` = film background colour turns the two bars the same dark background as adjacent screenshots, and the chart becomes a card in the same position.
- Why: subtitles are burned in uniformly at export; moving subtitles per segment requires touching the export chain; animation is parametric, moving itself is cheapest.
- How to use: write `safe` in the spec (the pipeline's draft will compute it from the ASS file and contain_box).

## 9. From demo films to reusable clips

**33. A demo film that works ≠ it still works after parametrisation; parametrised clips need a separate review.**
- Evidence: all 8 grammar demo films passed independent review; after extracting them as spec-driven clips and reviewing again, only 3 were immediately usable: real data swapped in immediately exposed rounding errors on scale marks, missing category labels, and large numbers overflowing the header; 6 of 8 subtitle-clearance parameters were ignored; text cards had the camera leaving before the text was fully revealed; a whiteboard final frame had a stroke covering the word "not", reversing the meaning. Demo films had author-curated inputs; clip inputs come from the pipeline.
- How to use: when reviewing parametrised clips, swap the inputs — negative numbers, decimals, long titles, vertical screen, no screenshot, transparent background, overlong text — feed at least one "hostile" spec for each variant; the sample assets used for acceptance must themselves be clean (don't use a directory-page screenshot as an example).

## 10. Plugging into voiceover video

**34. Render animation segments at "finished-film duration + word-level time"; key frames land on the key word.**
- Evidence: in a vertical-screen voiceover film copy, two segments in one chapter were replaced with animation (t3 finance chart explaining a set of number comparisons, y2 Vox pushing an official original-text screenshot); frames matched shots exactly, 7 key words within −0.48 to +0.09 frames.
- Why: animation appears only where screen-recording cannot explain (one number comparison, one official quote); the rest remains live-footage and screen-recording; the picture event reveals when he says that word — as if he is pointing at it while explaining.
- How to use: give beat → take finished-film duration and word-level time → generate spec → render → freeze and backfill (interface: see reference 09 "clip contract"). Numbers come only from the source table; the source is written on the graphic.

**35. Do not add narrative gags he did not ask for.**
- Experience: continuously adding decorations to the character draws attention away from the scene; narrative gags should be confirmed in a demo film first.
- How to use: "missing X" flagged in a review is information for his judgement, not authorisation for me to add it directly; to add a structural gag, first show it in a demo film or direction note and wait for him to approve.

## 2026-10-05 00:34:23 +0800 · Same voiceover, assign grammar by explanatory task

Practice: use Vox source-desk tracking and highlighting for real original posts/drafts; use 3b1b continuous object transformation for rules/controlled variables/audio-visual relationships; lock audio, subtitles, and timeline before swapping the visuals. Evidence: one voiceover film's 467.8 s narration and 270 subtitle lines were reused after a complete visual-style overhaul; the final two MP4 files' raw AAC packet hashes match the locked mix identically; no post-publication retention data yet. Why: the visuals carry the explanatory action appropriate to that passage; the material serves readability; the grammar allows static frames after a diagram has been read or reasoned through, without needing background micro-animation to pad motion. Applies to: voiceover films that alternate real material with mechanistic explanation.

## 11. Long-scroll traversal films (Huashu walks through famous paintings, 2026-10-05)

**36. One skeleton file + parallel-per-segment; 24 worlds in 4 agent groups, assembled in one pass.**
- Evidence (skeleton and 3 segments are in `scripts/engine/demos/long_scroll/`; method in reference 11): `lib/world.js` only defines the segment interface (width, ground line, walk frames, interaction at/dur/frame, back/front/seam), protagonist traversal, per-edge-cropped protagonist, and section label; four groups each wrote 6 segments; after ordering by era they assembled into 123.7 seconds in one pass — QA determinism ✓, jump-frames 0; review checked all 23 boundary ground heights and protagonist continuity, all passed. The key is global constants (ground line 760, height 300, walk speed) hard-coded in the skeleton.
- How to use: for a long film, write the skeleton and interface first, then dispatch groups; all events in the interface are **timed relative to "interaction start"** (`WORLD.actT`, `item.atAct`), not "seconds after segment entry" — when the global walk speed was later changed from 330 to 560, not one segment needed its timing adjusted.

**37. Per-segment speed micro-adjustment makes music boundaries land on bar downbeats.**
- Evidence: 24 boundary timestamps are fixed; a single BPM is at best 112 ms off; after making each segment hold an integer number of beats and adjusting speed segment by segment between 86–104 BPM, all 24 boundaries landed on bar downbeats, maximum error 11.7 ms, average 3 ms.
- How to use: when picture is set first and music is fitted afterward, do not force a single BPM; the human ear cannot hear a ±8% per-segment speed difference, but it can hear an instrument change that doesn't land on a downbeat.

**38. Camera only moves forward, never back.**
- Evidence: v1 had the camera advancing to make room during interactions and pulling back at the end; 17 of 24 segments showed 68–256 px of "rewind" — QA could not detect it but a single review pass caught it immediately. After changing to "target position takes the running maximum + Gaussian smoothing", zero backward moves in the full film; starts and stops are both smooth.
- How to use: for horizontal long-scroll tracking shots, make the camera position function monotone; adding a "backward-move count" QA check is even better.
