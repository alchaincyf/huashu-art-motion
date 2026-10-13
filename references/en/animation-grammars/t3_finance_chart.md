# t3_finance_chart · Financial Data Chart Animation

[中文](../../动画语法/t3_finance_chart.md) · **English**

> One-line grammar: **Build the axes first, let the data "grow" in, then annotate exactly one thing; one color tells the hero's story, everything else goes grey; numbers are always honest (bars start from 0, units and source are on the chart), animation only decides "how it appears," never "what it says."**
>
> Demo film: `scripts/engine/demos/t3_finance_chart/` (render: `render.py --film demos/t3_finance_chart`) (8 s, 3 shots, all data fictional, "示意数据" (illustrative data) in the bottom-right corner of every shot) · Overview `assets/动画语法/t3_finance_chart_总览.jpg` · Code `scripts/engine/demos/t3_finance_chart/`

## Pre-flight checklist

1. **Write out the "one thing" each chart says.** The title is that conclusion; the annotation marks only it. If you can't state that one sentence, don't make the chart — use a large number instead, or switch grammar.
2. **Numbers must cross-check.** The multiplier in the title must be derivable from the numbers in the chart (a ÷ b goes in the annotation); the same number appearing in two shots must match; distinguish "grew to" from "grew by."
3. **Data grows at the word it matches in the voiceover.** For a bar chart with multiple bars, write separate bar cues each with their own `data.index`, so each bar grows when the voiceover names it. Don't show a title at second 0 and then grow everything at once.
4. **Hold still after settling.** Numbers hold for at least 0.5 s after settling; no constant-speed slow-push. To examine a detail, slow-push there when the voiceover points to it (≈1 s, Heer & Robertson: one step ≈1 s, ease in and out); only the most critical number warrants a 0.28 s punch-in; or use `zoomThrough` to push into that data point.
5. **Don't use the same layout 3 times in a row.** Thin red line + title + chart three consecutive times is a spreadsheet. Break it up with a push-in to a detail, a slam-in large number, or a cut back to real footage.
6. **Keep charts in the film's world.** Chart shots share the same color palette as the shots before and after: dark films use `theme: "dark"`, or set the film's background color in `safe.fill` (chart background follows automatically, switching to light text in dark mode). White-background report charts are only for films that are already set in white pages or web views. Even better: draw the chart on an object inside the film's world using `--alpha` to export a transparent segment, then composite it onto a screen, a blackboard, or a piece of paper in the scene. Cutting abruptly to a white-background line chart with a fixed title in a night-scene film — the review will flag it as "disconnected from the whole film."

## ① When to use

- **Use it**: revenue/profit/user growth, stock price trends, market-share rank changes (bar chart race), regional comparison (choropleth map), inflection points before and after an event. Best for voiceover with **specific numbers, time references, and comparisons** ("grew 8.7× over five years," "after March 2023").
- **Use it**: segments that need to be **credible** — when the audience will screenshot and share, or scrutinize the numbers.
- **Don't use it**: only one number (show it as a large text, use t2's count-up); when the data is unreliable or you don't want to cite the source (better not to make a chart at all); explaining principles (use t1).

## ② Visual composition

| Item | Value | Source |
|---|---|---|
| Background | White `#FFFFFF` (Economist web charts); or FT salmon `#FFF1E5`; dark films use `theme: "dark"` (`#0E1116` background, light text, cyan primary bar) | Economist 2017 chart style guide; FT o-colors source code |
| Layout | **Thin red line at top (8 px) + red flag in upper-left (96×22) + bold title (one-sentence conclusion) + subtitle (metric, unit) + source in lower-left** | Economist style guide layout example |
| Primary palette | ECON RED `#E3120B`, blue `#006BA2`, cyan `#3EBCD2`, green `#379A8B`, yellow `#EBB434`, grey `#758D99`, black `#0C0C0C` | Economist chart palette |
| Emphasis method | **One color tells the hero's story, everything else fades to light grey** (this film: last bar stays blue, others transition to `#C6D2D8`) | Datawrapper "use grey to suppress secondary data" |
| Grid | Horizontal grid lines only, thin grey (this film: α0.13, 1.5 px); **only the zero baseline is a solid black line** (3 px); y-axis tick labels placed above and to the right of the grid line | Economist style guide |
| Font | The Economist uses Econ Sans (Cnd); this film uses Roboto Condensed (numbers) + Source Han Sans (Chinese). Title 700, subtitle/axis 400; axis text smallest, source smallest and lightest (75% black) | Same |
| Rise/fall colors | **Mainland China A-shares: red up green down** (this film); Hong Kong and Western markets: green up red down. For Chinese audiences you must write "红涨绿跌" (red up, green down) on the chart. Colorblind-friendly alternative: blue/orange + ▲▼ symbols | Jiang et al. 2014 (JBDM); Bloomberg Terminal colorblind mode |
| Line width | Main data line 5 px (this film), moving average 4 px; annotation leader line 2 px | — |
| Shape language | Rectangular bars, line + end dot, candlestick body + wick, small dot + leader line annotation | — |

## ③ Motion

- **Staging order**: layout 0–0.5 s → grid lines drawn one by one from left to right (lag 0.12, easeOutQuint) → x-axis labels fade in and rise → data → emphasis color change → annotation. Each stage ≈0.5–1.3 s. Heer & Robertson 2007: complex changes should be staged; all transitions ease in and out; each step should take "as long as needed," ≈1 s; showing axes before data is industry convention (no empirical study, but it lets the audience understand the "ruler" before the "measurement").
- **Bars**: grow up from the 0 baseline, easeOutQuint, staggered (lag 0.22, 1.3 s total); value labels track the bar top, counting up in sync (`CH.bars`).
- **Line**: drawn by **x (time)** progression, not arc length — time advances at constant speed so steep sections draw fast, conveying "sharp rise"; 9 px circle at the head + price label follows (fixed-width numbers); area gradient α0.14→0. This film: 1.5 s, smooth (the last price "lands" on the dot). D3 official example is 5000 ms linear — fine for standalone charts, compress to 1.5–2 s for video.
- **Annotation**: triggers the moment the line head **passes** the event point (`tHit` computed by the inverse easing function) — dot pops out (spring d0.45 bounce0.25) + one pulse ring → 0.12 s later the leader line draws → 0.3 s later the text fades in. **One annotation per shot**.
- **Candlesticks**: appear one by one (lag 0.06, 0.2–1.3 s), body grows from open price to close price, wick extends afterward; volume bars sync; price in upper-right tracks "the most recently appeared candle," color based on rise/fall relative to the starting price of the range.
- **Numbers**: count-up uses easeOutExpo (CountUp.js default 2 s; compress to 0.9–1.3 s for video); all rolling numbers use fixed-width layout to prevent jitter.
- **Camera**: camera holds still after the chart settles; no constant-speed slow-push. Camera actions fire when the voiceover points to a data value: slow push ≈1 s to zoom in, or 0.7 s to pan to the next group of data; only the most critical one or two numbers in the whole film warrant a 0.28 s punch-in; during a push-in transition the camera continues vector-rendering at the larger scale (no bitmap upscaling). The constant-speed push 1→1.03 in every shot of the demo film is old practice — don't copy it in new films.
- **Bar chart race (not in this film)**: D3 official bar chart race uses 250 ms per keyframe, 10 linearly interpolated frames in between, displays 12 bars; rank changes take ≈0.5 s; stagger rank changes so all bars don't jump at the same time.

## ④ Transitions (5 common types)

1. **Panel slide push (slidePush)**: new panel slides in from the right while old panel slides out to the left, with a brand-red vertical stripe leading the way, 0.5 s, `cubic-bezier(.7,0,.2,1)`. This film shot 1→2. The new panel starts building its layout (red line grows, title floats in) during the push.
2. **Push-in to detail (zoomThrough, live + bScale0)**: camera pushes in toward the most recent data point 6× (old shot re-renders vectors), new scene (20 most recent daily candles) dissolves in from 0.6×, main subject (most recent candle) aligned to the push-in point. This film shot 2→3. When there is no circular opening, `bScale0` must be set; otherwise the new scene appears as a small floating card.
3. **Chart-to-chart morph**: same data, different chart type (bar → dot → line); move into position first, then morph (Heer & Robertson: scatter → bar: pan first then morph; stacked → grouped: change width first then drop down). **Don't morph between different metrics** (morphing a revenue bar into a stock-price line implies they share the same scale).
4. **Axis re-label**: when the data range changes, change the tick marks first (old ticks fade out, new ticks fade in), then animate the data.
5. **Hard cut + fixed layout**: same layout, different chart — red line and title position unchanged, only content swapped. The Economist's most common video transition.

## ⑤ Rhythm and text

- **Shot duration**: one chart 2.5–6 s; this film's 2.8/2.7/2.5 s is a compressed version (real use: one chart per one or two voiceover sentences). Narrative structure: Establisher → Trigger → Peak → Wrap (Amini et al. 2015, 50 professional data videos).
- **Sync with voiceover**: numbers **settle exactly when spoken** — bar fully grown, label stopped at 107.9 the moment "107.9 billion" is said; annotation pops when the line head passes the event, timed to "after the large language model release in March 2023." So define the voiceover timestamp first, then back-calculate the animation start.
- **Text**: title states the conclusion ("Revenue grew to nearly 9× its original value over five years" — **"grew to" not "grew by"**: 8.7× means revenue reached 8.7× its original value, i.e., grew by 7.7×; this error was caught in review); subtitle states the metric and unit ("Annual revenue, 100 million yuan"); multipliers must be derivable from the chart numbers (107.9÷12.4=8.70); if y-axis doesn't start from 0, note it in the subtitle ("y-axis does not start from zero"); source on one line in the lower-left; illustrative-data badge in the lower-right of every shot.

## ⑥ Code implementation notes

> After being folded into the skill (2026-10-04 v0.4): the general-purpose functions in this card's "newly written" section have been unified into `scripts/engine/lib/` (renamed to the standardized MO / CAM / DG / TY / CH / UI / CL / TOON). The demo film's own code is in `scripts/engine/demos/t3_finance_chart/`. For a library quick-reference and "how to choose a grammar for a voiceover segment," see `references/en/09-explainer-animation-grammar.md`.

- Reuse from skill: `engine.js`, `render.py`, `U.rng` (all fictional data generated from a seed, reproducible), `PAINT.hex`.
- Newly written `lib/chart.js` (`window.CH`): `lin` (scale with `inv`), `ticks` (1/2/2.5/5×10ᵏ tick generation), `grid` (grid lines drawn one by one, zero line bold, tick labels right-justified), `xLabels`, `bars` (grow from 0 + sync count-up + highlight/grey), `line` (draw by x progression, head dot, area), `yAt`, `candles` (per-candle, configurable rise/fall colors), `callout` (dot → leader → text), `tag` (red flag), `demoBadge` (illustrative-data badge), `mixHex`.
- `lib/motion.js`: `lagged`, `quintOut/expoOut` (called easeOutQuint/easeOutExpo during development), `spring` (annotation dot); `TY.count/tabular/fmt`.
- Transitions (now in `transitions.js`): `slidePush`, `zoomThrough` (live, bScale0, focus).
- Event trigger timing: `tHit = start + duration × smooth⁻¹(event x fraction)` (inverse computed by bisection); annotation always syncs with the line head — changing the line duration requires no manual adjustment.

## ⑦ Representative works and primary references

- Representative works: The Economist web charts and videos; FT charts; Bloomberg Originals / Quicktake data segments; Flourish bar chart race.
- Economist chart style guide 2017 (mirror): https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf
- FT palette source: https://unpkg.com/@financial-times/o-colors/src/scss/_palette.scss
- Heer & Robertson 2007, Animated Transitions in Statistical Data Graphics: https://idl.cs.washington.edu/files/2007-AnimatedTransitions-InfoVis.pdf
- D3 bar chart race: https://observablehq.com/@d3/bar-chart-race-explained
- Correll et al. 2020 (truncated axes exaggerate effect, even break markers don't fix it): https://arxiv.org/abs/1907.02035
- Datawrapper: bars from zero https://www.datawrapper.de/academy/why-our-column-and-bar-charts-start-at-zero ; dual axis https://www.datawrapper.de/blog/dualaxis ; colorblindness https://www.datawrapper.de/blog/colorblindness-part2
- Cultural difference in red-up vs. green-up: https://onlinelibrary.wiley.com/doi/10.1002/bdm.1800
- CountUp.js (easeOutExpo, 2 s): https://github.com/inorganik/countUp.js

## ⑧ The 3 most common mistakes

1. **Truncating the y-axis.** Bar charts must start from 0. Line charts and candlestick charts may not start from 0, but note it on the chart. Tufte's Lie Factor (chart effect ÷ data effect) outside 0.95–1.05 is distortion.
2. **Too many colors, everything is the hero.** One color tells the story; everything else goes grey. Make clear which way red and green go for your audience (A-shares: red up; Western markets: red down).
3. **Animation too flashy to read numbers.** No bouncing bars, 3D bars, or spinning pie charts. Stage it, ease in and out, one step ≈1 s. Numbers hold for at least 0.5 s after settling so viewers can read them.

## QA numbers (skill `scripts/qa.py`, 2026-10-04, pre-review)

| Shot | Motion% | Still-frame pairs% | Jumps | Avg/Peak ms | Deterministic |
|---|---|---|---|---|---|
| t3_s1 | 1.39 | 0.0 | 3 | 1.3/1.9 | ✓ |
| t3_s2 | 2.37 | 4.7 | 0 | 1.9/2.8 | ✓ |
| t3_s3 | 0.96 | 0.0 | 0 | 1.6/2.3 | ✓ |

Note: the 3 "jumps" in t3_s1 fall at lt 2.10/2.20/2.27 s, exactly when the four bars switch from blue to grey (highlighting the hero) and the annotation pops — intentional large-area changes, not glitches.

## Revisions (independent review → one revision pass, 2026-10-04)

| Review finding | Fix |
|---|---|
| 🔴 Title "涨了近 9 倍" (grew by ≈9×) vs. annotation 8.7× are inconsistent (should be "grew to") | Changed to "营收五年涨到原来的近 9 倍" (revenue grew to nearly 9× its original value over five years); stock-price page uses same convention: "涨到原来的 7.5 倍" (grew to 7.5× its original value) |
| 🔴 Monthly-line endpoint ¥268 vs. daily-K 286.40 don't match (the push-in goes to this exact point) | Monthly-line endpoint = latest price 286.4; second-to-last monthly close = daily-K starting price 242; **numbers across shots must be mutually derivable** |
| 🟡 At 5.6 s, "¥268" and the counting price both show as large red numbers, overlapping | Price head label disappears within 0.2 s of the push-in transition starting |
| 🟡 "成交量" (volume) label overlaps candlesticks; volume bars reach the 240 grid line | Label moved to empty space in lower-right; volume bars normalized to max volume, 6 px gap at top |
| 🟡 Daily-K page can't be read in 2 s | Remove the 5-day moving average; candles finish drawing at 1.3 s, annotation settles at 1.75 s, hold 0.75 s |
| ⚪ Red-up color clashes with brand red | Kept (audience is A-share investors); subtitle notes "红涨绿跌（A 股惯例）" (red up, green down — A-share convention). For overseas versions, switch to green-up or blue/orange |

Post-revision QA:

| Shot | Motion% | Still-frame pairs% | Jumps | Avg/Peak ms | Deterministic |
|---|---|---|---|---|---|
| t3_s1 | 1.44 | 0.0 | 3 | 1.3/1.7 | ✓ |
| t3_s2 | 2.45 | 4.7 | 0 | 1.9/2.6 | ✓ |
| t3_s3 | 0.91 | 0.0 | 0 | 1.7/2.9 | ✓ |
