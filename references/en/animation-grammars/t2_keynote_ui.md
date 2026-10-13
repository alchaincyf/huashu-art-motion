# t2_keynote_ui · Launch-Keynote-Style Interface and Gradient Motion

[中文](../../动画语法/t2_keynote_ui.md) · **English**

> One-line grammar: **One thing per screen; the product itself (screenshots, screencasts, physical objects) is the hero; nouns and numbers settle when the voiceover names them; text is tight-tracked; spring has no rebound or a light one.** Lens-flare gradient backgrounds, frosted-glass cards, gradient text, center-blur-float-in, and decorative floating are all optional dressings — use sparingly (see "Pre-flight checklist").
>
> Demo film: `scripts/engine/demos/t2_keynote_ui/` (render: `render.py --film demos/t2_keynote_ui`) (8 s, 3 shots) · Overview `assets/动画语法/t2_keynote_ui_总览.jpg` · Code `scripts/engine/demos/t2_keynote_ui/`

## Pre-flight checklist

1. **This style reads most easily as an AI template.** Lens-flare gradient background + frosted-glass card + gradient text + center blur-float-in + card floating — all five together and the audience recognizes it as a template in one glance. Before starting, ask: is there a real product screenshot, screencast, or physical photo? If yes, let it fill the frame as the main image and push into the part being discussed; skip the flares and glass cards. Use at most two of the five dressings per film.
2. **Screenshots should be large.** In shots with a screenshot, the screenshot width ≥ 80% of frame width (portrait: ≥ 90%). When the voiceover mentions a part of the screenshot that isn't legible, push in toward it (default slow push ≈0.9 s; punch-in at 0.28 s only when revealing a result or comparing two values). At most one or two push-ins per screenshot, then pull back to the full image or pan to the next section. A small card floating on a large lens flare is the fourth failure mode: "dead background." The parametric segment t2 defaults to this approach: screenshot fills the frame (fit with no crop, padded on all sides with a darkened blurred copy of the same image), the highlight moment pushes in (default slow push; write `"camera": "snap"` in the top-level `data` for a punch-in), two consecutive screenshots pan at the same scale. To show the old glass card, explicitly write `data.frame: "glass"`. For custom shots use `CAM.track` (camera action table) and `MD.cover` (fill-frame + focus + push-in); for how to choose a camera action see `references/en/camera-language.md`.
3. **Sketch out the layout.** Write down the layout of every screen in the storyboard (title screen, three cards side by side, large number, screenshot card). If the same layout appears ≥2 screens in a row, switch it up: screenshot push-in, number slam-in, before-and-after comparison. "Title → three feature cards → big number" cycling throughout is a slide deck.
4. **Hold still after settling.** No card floating; no constant-speed slow-push to fill pauses. The next action fires when the voiceover says the noun or number. If a number refers to something just shown in a screenshot (ratio of two timings, the conclusion from this page), write `data.over: true`: pull back to the full screenshot, darken it, slam the number on top — don't cut away to a lone lens-flare screen for the number.
5. **Color follows the product.** Background and accent colors come from the product's own brand colors; don't default to purple-blue-cyan lens flare. When delivering bad news, serious events, or non-launch topics, don't use this dark-keynote style.

## ① When to use

- **Use it**: product/feature launches, version updates, "three new features," price and spec announcements, opening brand films, "what is this product" segments in a video. The best fit is voiceover with **nouns + numbers** ("Plover 2," "320-millisecond latency," "1 million tokens"): one noun per screen, the text floats in when the noun is said, the number settles when the value is spoken.
- **Use it**: when interface screenshots need to be explained clearly — fill the frame with the screenshot, push into the part being discussed. Placing it in a glass card or rotating it in 3D are optional dressings; use sparingly.
- **Don't use it**: explaining mechanisms or principles (glass and flares carry no logic — use t1); showing data trends (use t3); serious accidents or bad earnings news (this visual language inherently signals "good news"); when there is no single "hero" to zoom into (only empty-frame lens flare left); science explainers, stories, or news — non-launch topics shouldn't use this as a general-purpose backdrop.

## ② Visual composition

| Item | Value | Source |
|---|---|---|
| Background | Near-black: this film `#050508`; Apple `#000/#161617/#1d1d1f`; Linear `#08090a` (upper level `#0f1011/#141516`, body text `#f7f8f8`, stroke `#ffffff14`) | Both brand websites CSS, measured |
| Lens flare (optional, use sparingly) | 4 radial-gradient blobs blended screen mode → blurred 90 px at 1/4 size → scaled to fill → overlaid with 3.5% static grain to prevent color banding. Hues follow Stripe palette: purple `(150,90,238)`, blue `(56,104,255)`, cyan `(120,214,255)`, a touch of warm red `(255,96,84)`; center covered with a 38% black radial gradient for white-text contrast | Stripe 2021 gradient `#a960ee #ff333d #90e0ff #ffcb57` |
| Lens flare motion (optional) | Each blob drifts with amplitude 90–260 px, period 9.5–13 s; **avoid 5 s period** (HIG: avoid sustained oscillation at ≈0.2 Hz) | Apple HIG Motion |
| Frosted glass card (optional, use sparingly) | Background sample blurred 40 px (Apple nav: `saturate(180%) blur(20px)`, NN/g says the bigger the better) + 7.5% white fill + 14% white top-edge specular band + 1.5 px gradient stroke (bright upper-left, dark lower-right) + large shadow (blur 70–80, y+30–40, α0.5) | apple.com globalheader.css; NN/g Glassmorphism |
| Corner radius | Cards 36 px; **concentric radii**: inner icon container radius = 36 − inner padding 14 = 22 | WWDC25 "child radius = parent radius − padding" |
| Font | Inter (closest open-source equivalent to SF Pro; Linear uses Inter); Chinese: Source Han Sans. Titles 600 weight, **large sizes track tight −0.02 ~ −0.03 em** (`T2.track`) | Apple 96 px −0.015 em, Linear 64 px −0.022 em, OpenAI 64 px −0.03 em |
| Text hierarchy | White `#f5f5f7` primary, `rgba(235,235,245,.6)` secondary, `#a7a7b4` eyebrow (letter-spacing +6 px); product name can use white→light-purple→light-cyan horizontal gradient (optional, use sparingly: gradient text + lens flare together = template) | Apple website hierarchy convention |
| Composition | One focal point per screen; when a screenshot is present it fills the frame (width ≥80%) and pushes into the relevant part; centered symmetric three-card row (equal width 480, gap 52) only for feature lists with no screenshots; large numbers occupy ≥55% of frame width | — |
| Shape language | Rounded rectangles, capsules, thin-line icons (round caps, even stroke weight, SF Symbols character, `UI.icon`) | — |

## ③ Motion

- **Spring (primary)**: SwiftUI duration + bounce parameterization, `MO.spring(t,{duration,bounce})`: mass=1, stiffness=(2π/d)², damping=4π(1−bounce)/d → damping ratio ζ=1−bounce. **Default bounce 0** (most versatile); 0.15 is crisp with almost no rebound (this film: card entrance d=0.75, bubble d=0.5); 0.3 is noticeably springy; >0.4 is exaggerated for UI. `.smooth/.snappy/.bouncy` are all d=0.5.
- **Curves (non-spring)**: apple.com nav `.32s cubic-bezier(.4,0,.6,1)`; this film's text float-in uses CSS `ease`=`(.25,.1,.25,1)` (`MO.appleOut`); Linear's primary ease-out-quad `(.25,.46,.45,.94)` .16 s; Stripe recommends <500 ms, `(.2,1,.2,1)`. `MO.bezier(x1,y1,x2,y2)` handles all of these.
- **Text entrance** (center-blur-float-in is an optional treatment, use sparingly; doing it every screen every time = template): blur 18–26 px → 0, shift up 16–40 px → 0, transparent → opaque, 0.7–1.0 s (`TY.blurIn`). Eyebrow → product name → subtitle staggered 0.2–0.4 s apart.
- **Card entrance**: from 170 px below, rotated ±0.55 rad (≈31°) around Y-axis (outer cards tilt outward), scaled 0.9 → springs into place; three cards staggered 0.1 s. 3D uses `UI.persp` (vertical-slice perspective, persp 1800 px; Stripe uses 600, Linear uses 1000).
- **Camera and pauses**: hold still after settling; no decorative floating; no constant-speed slow-push to fill pauses. Camera moves only when the voiceover mentions a part of the screenshot that isn't legible: default slow push ≈0.9 s to that section, 0.7 s to pan to the next section; punch-in at 0.28 s only for reveals or two-value comparisons; number or large text slams in at 0.17 s (1.55→0.94→1.0); hold duration follows voiceover. After pushing in, pull back to the full screenshot or pan to the next section — don't push further shot after shot. The card float of 7 px (`MO.float`) and constant-speed camera push 1→1.045 in the demo film are old patterns; don't copy them in new films.
- **Count-up**: 0.25 s after card settles, runs 0.9 s (a given number counts up only once — the full-screen version carries over "100万" (1 million), does not recount from 0); `easeOutExpo` (CountUp.js default easing) — last digit lands slowly; numbers **laid out with fixed-width spacing** (`TY.tabular`; Canvas can't enable tnum, misalignment will cause jitter).
- **Light sweep**: a bright band angled −20°, width 110–140 px, sweeps across in 0.8–0.9 s; use `source-atop` on text (only the text lights up), `lighter` on cards; three cards calculate progress from their own screen positions = same streak of light.

## ④ Transitions (5 common types)

1. **Blur push (blurPush)**: old frame shrinks to 0.92 + blur 24 px + fade out, new frame comes in from 1.06 blurred and settles to 1.0 sharp, 0.55 s, `ease`. **First lay a layer underneath: enlarged 1.08 with heavy blur of the old frame**, so the shrinking image doesn't expose black edges at its corners. This film shot 1→2.
2. **Shared-element expand (expandRect)**: (the new frame's first frame is **opaque** inside the card — the card is semi-transparent, so any dissolve would show old and new text overlapping) the selected card (first scaled up to 1.06, side cards pull back and darken to 45%) expands from its own screen rectangle to fill the frame; corner radius 38→0, spring d=0.55 bounce 0; the new frame starts scaled to fit inside the card. **The selected card stops floating before expanding** so the transition launches from a stable rectangle. This film shot 2→3.
3. **Match cut**: same object in the same position across two shots (product name → card title position).
4. **Wipe/light-sweep cut**: the new frame swaps in behind the light band as it sweeps.
5. **Refraction instead of fade** (Liquid Glass): elements exit by gradually changing refraction/blur intensity rather than lowering opacity directly (the text's blur-float-in in this film follows this principle).

## ⑤ Rhythm and text

- **Shot duration**: a launch-event presentation screen is commonly 5–8 s (Jobs 2007 iPhone: 70 s, 9 screens ≈ 7.8 s/screen); product film fast cut 1.5–3 s. This film: 2.6/3.0/2.4 s.
- **One thing per screen**: one noun, one number, one card. After a dense stretch, leave one empty screen for the audience to breathe (Presentation Zen's counterweight).
- **Sync with voiceover**: text starts floating in 0.2–0.3 s before the noun is spoken (the float itself takes 0.7 s, so it's clear when the noun arrives); numbers **settle** when the voiceover says the value — count-up start = spoken moment − count-up duration; three cards enter in sequence corresponding to "first, second, third."
- **Text**: title ≤6 characters or one product name; subtitle one sentence ≤16 characters; card: 4-character heading + one line of description + one large number + unit (one size smaller, one shade greyer).

## ⑥ Code implementation notes

> After being folded into the skill (2026-10-04 v0.4): the general-purpose functions in this card's "newly written" section have been unified into `scripts/engine/lib/` (renamed to the standardized MO / CAM / DG / TY / CH / UI / CL / TOON). The demo film's own code is in `scripts/engine/demos/t2_keynote_ui/`. For a library quick-reference and "how to choose a grammar for a voiceover segment," see `references/en/09-explainer-animation-grammar.md`.

- Reuse from skill: `engine.js`, `render.py`, `PAINT.cached/hex`, `U.rng`.
- Newly written, now unified into `lib/ui.js` (`window.UI`): `mesh` (lens-flare background), `grainTex`, `backdrop` (blurred copy, frosted-glass sampling), `shadow` (shadow only), `glass` (frosted-glass card), `sheen` (light sweep, `comp` optional), `persp` (pseudo-3D around Y/X axis), `icon`, `rr/rrPath`, `scratch`.
- `lib/motion.js`: `spring/smoothSpring/snappy/bouncy`, `bezier/appleOut/emphasized`, `float`; numbers and text in `lib/typo.js`: `TY.count/tabular`, `TY.blurIn` (called MO.textIn during development).
- Transitions (experimental name `transitions_info.js`, now in `transitions.js`): `blurPush`, `expandRect`.
- Performance: one lens-flare render per frame (1/4 size) + one background blur copy, averaging 40–60 ms/frame (QA with GPU flush); 8 s at 60 fps renders in about 1 minute.
- Pitfalls (fixed in the library): ① **blur pulls in transparent pixels from outside the canvas**, drawing into an uncleared offscreen buffer accumulates frame over frame and QA reports determinism ✗ — first lay a non-blurred copy of the original; ② perspective slices with 0.75 px overlap show a banding line on semi-transparent textures — snap slice boundaries to integer pixels end-to-end, and draw into an offscreen buffer first, then composite back with alpha; ③ `UI.sheen` sets its own compositing mode internally which overwrites the outer `source-atop`, so it's exposed as a parameter.

## ⑦ Representative works and primary references

- Representative works: Apple iPhone/Apple Intelligence launch films and apple.com product pages; OpenAI GPT-4o / o-series launch videos; Linear website and Linear Release videos; Stripe 2020–21 website gradient.
- https://developer.apple.com/videos/play/wwdc2023/10158/ (Animate with springs: duration/bounce)
- https://developer.apple.com/videos/play/wwdc2018/803/ (Designing Fluid Interfaces: start from 100% damping)
- https://developer.apple.com/videos/play/wwdc2025/219/ (Meet Liquid Glass)
- https://developer.apple.com/design/human-interface-guidelines/materials , /motion , /typography
- https://www.nngroup.com/articles/glassmorphism/
- https://web.archive.org/web/20211015000000/https://stripe.com/ (gradient color values)
- https://stripe.com/blog/connect-front-end-experience (<500 ms, curves)
- https://linear.app/now/how-we-redesigned-the-linear-ui (LCH color, Inter)

## ⑧ The 3 most common mistakes

1. **Nothing behind the glass.** Frosted glass only blurs what's behind it; "glass" on a flat dark background is just a grey rectangle. Draw a colorful, varied lens flare first, then sample-blur it at the card's screen position.
2. **Spring too bouncy, too much motion.** Default bounce 0; entrance at most 0.15–0.3; >0.4 looks cheap immediately. Move only one group of things at a time.
3. **Large text not tracked tight; lens-flare colors turn muddy.** 64 px and above need −0.015 ~ −0.03 em; each lens-flare blob should occupy its own area of color (screen blend + large blur) — don't average multiple colors into a grey-purple sludge.

## QA numbers (skill `scripts/qa.py`, 2026-10-04, pre-review)

| Shot | Motion% | Still-frame pairs% | Jumps | Avg/Peak ms | Deterministic |
|---|---|---|---|---|---|
| t2_s1 | 0.58 | 35.4 | 0 | 39.8/51.4 | ✓ |
| t2_s2 | 2.62 | 8.5 | 0 | 60.2/65.0 | ✓ |
| t2_s3 | 1.84 | 9.6 | 0 | 44.3/51.0 | ✓ |

Note: t2_s1's "35% still-frame pairs" comes from the demo film's lens-flare drift and 4.5% constant-speed push (old pattern) — per-frame change falls below QA's pixel threshold (>12 levels). Sampling two frames 1 second apart (1.6 s vs 2.6 s in the finished film) shows 26.8% of pixels changed by more than 12 levels and 78% by more than 4 levels. A high or low still-frame-pair ratio says nothing about quality: explainer films with long holds are correct; films with constant slow drift still look like a slide deck.

## Revisions (independent review → one revision pass, 2026-10-04)

| Review finding | Fix |
|---|---|
| 🔴 Black edges exposed at corners of transitions at 2.55–2.75 s and 5.6–5.85 s | blurPush / expandRect: first lay an enlarged 1.08 + blurred 30 px copy of the old frame underneath |
| 🔴 During card expand, "长期记忆" and "100万" show double-image; then counts from 0 again after expanding | New frame's first frame is opaque inside the card; the full-screen page carries over "100万 tokens" — no recount |
| 🔴 At 6.95 s count-up jumps one frame from 999,023 to 1,000,000, squeezing "tokens" | Fixed by removing the duplicate count-up above; unit typeset with measured three-segment widths, no longer glued text |
| 🟡 End card appears for only 0.4 s; y ≈ 1020 exits the safe area | End card 1.2–1.8 s float-in, hold 0.6 s, y=972; dialogue panel shifted up 65 px overall |
| ⚪ Card "100万" and full-screen "1,000,000" use different unit conventions | Unified to "100万" |

Post-revision QA:

| Shot | Motion% | Still-frame pairs% | Jumps | Avg/Peak ms | Deterministic |
|---|---|---|---|---|---|
| t2_s1 | 0.58 | 35.4 | 0 | 39.5/51.6 | ✓ |
| t2_s2 | 2.62 | 8.5 | 0 | 57.2/59.9 | ✓ |
| t2_s3 | 0.97 | 15.4 | 0 | 43.0/48.7 | ✓ |

(Transition smoke test: blurPush slowest at ≈137 ms/frame, including two full-frame blurs.)
