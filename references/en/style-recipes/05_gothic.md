# 05_gothic · 1290 Gothic Illuminated Manuscript

[中文](../../风格配方/05_gothic.md) · **English**

11–22ms per frame (median 12ms). Static layer and gold-leaf mask built once in `init()`.

## Pipeline
1. Static layer `goth_static` (cached): parchment → gold leaf → diamond embossing → gables, pinnacles, side columns → pointed-arch windows and stained glass → table, throne → Latin text columns → marginalia knight.
2. Gold-leaf mask `goth_mask`: per-pixel "gold-ness" `clamp((r-b-70)/50)·clamp((g-b-30)/40)·clamp((r-140)/40)` on the static layer, used as alpha. Parchment (236,223,194) has r−b of only 42 — excluded; pink bands have high b — also excluded. **No need to redraw gold shapes as a mask**: any gold area is automatically swept by the highlight — background, drop capitals, gold orbs, gable finials.
3. Each frame draws in order: stained-glass flicker → diagonal highlight → four-pointed star where highlight passes → vine scroll → snail → running mouse → cat → girl → grain.

## Gold-Leaf Texture (fine-texture + highlight as specified)
- Per-pixel coloring: `f = 0.52 + fbm(x·.0035)·0.42 + horizontal burnishing noise(x·.004, y·.09)·0.5 + top-left illumination + grain±0.05`, interpolated between goldLo #9c6a1a / gold #d9a63a / goldHi #f8de86. Burnishing y-frequency is 20× the x-frequency, so it reads as horizontal metallic brushing.
- Diamond grid: 46px spacing, two families of diagonals (x+y, x−y each constant). Each line drawn twice: a dark pass, then a bright pass offset 1.2px — looks like engraved into the gold. Diamond center pressed with 4 dots, top-left bright, bottom-right dark.
- An extremely faint rectangular seam every 118×125px, simulating individual gold-leaf sheets pressed on.
- Diagonal highlight: draw a linear gradient band on a 920px-wide scratch, slope K=0.45 ("/" direction). Multiply by the mask with `destination-in`, then composite back with `lighter` at α0.62. **Moves at constant speed** `x = lerp(150,1650,(lt-0.08)/1.15)`. First version used easeInOut — at 0.9s the highlight had already swept past the gold zone and missed the girl; constant speed means 0.3s reaches the window, 0.9s is right over the girl. Glow and 11 fixed points are judged by `|u − sweepX| < 70`, showing four-pointed star flashes when the highlight passes.

## Motif Animation (visible throughout the 0.25–1.4s window)
- Vine scroll: two stems of ~120 points each, every point offset `sin(t·2.1+i·.09)·2.5`. Every 3–5 points hangs a three-petal ivy leaf (blue/red/gold cycle) or a gold orb with 3 tendrils. Leaves sway `sin(t·3.1+k·1.7)·0.28` around their attachment point. Leaf scale was 0.85 in the first version — too small, too sparse; at 1.05–1.45 the density matches the original.
- Stained glass: 26 random points, light a white radial glow when `sin(t·5+h·40) > 0.6`.
- Cat raises one front paw, holding a mouse by the tail — mouse swings like a pendulum `0.32·sin(t·5.5)`, little legs kicking wildly. Snail crawls leftward at 62px/s, antennae sway; mouse below the text column runs 360px between 0.12–1.17s, legs swinging at 40 rad/s.
- Girl raises a gold chalice following the shared choreography; a four-pointed star flickers at the rim, steam above the cup drawn with fine ink lines.

## Characters
- Girl uses `RIG.girl` Path2D drawn layer by layer manually, **without calling `RIG.drawGirl`** — two reasons: drawGirl always produces a mug-with-handle; cloak and halo must be inserted between specific layers. Drawing order: halo (centered on headC offset (16,−22), r=114, red ring + 36 embossed dots) → wavy long golden hair → red robe (gold fine vertical stripe every 20px, gold border along hem) → blue cloak (anchored on nape/back, gold border) → head → gold chalice.
- Cat rendered as a manuscript "human-faced cat": face is a cream ellipse, almond eyes with pupils squeezed to the right side glancing at the girl, thickened upper eyelid, arched brows, downturned corners of mouth, red cheeks. Only `legs[0]` used; the other foreleg drawn with `RIG.limb` in a raised pose.
- Latin body text in UnifrakturMaguntia 44px. 50px would push "cum poculo suo" off the right edge. Sentence-initial Cattus/Nemo/Mus in red — the medieval rubric convention.

## Pitfalls
- The scratchpad is shared with other era authors; `check.py` was overwritten once. Self-check scripts must go into their own subdirectory.
- Motion diff map using lt=0 as baseline will be contaminated by the engine's first-20-frame lens impact (1.03 zoom). Baseline must be lt≥0.35.

## v2 Fine-Tuning
Vine sway ×2, leaf sway 0.42; stained-glass flash points 40; gold-leaf highlight α0.85, highlight band widened. Static-segment frame diff 1.10 → 1.32 (original 1.64).
