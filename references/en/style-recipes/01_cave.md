# 01_cave · 40,000 BC Cave Paintings (Pure Code)

[中文](../../风格配方/01_cave.md) · **English**

File: `scenes/01_cave.js` (~330 lines). Final performance: warm max 22ms / mean 21.1ms; cold (building cache) completes at engine boot; determinism pass; 0.2↔0.7s motion diff 3.9% pixels.

## Pipeline
1. **Cave wall (fully cached, `cave_relief`/`cave_bg`)**
   - Half-resolution 960×540 height field: `fbm(x·0.0022,4oct)·1.0 + fbm(x·0.011,3oct)·0.16 + noise(x·0.05)·0.03` (coordinates in full-resolution pixels).
   - Finite differences ×52 for normals, light source L=(-0.55,-0.62,0.56) (top-left), `shade = clamp(0.5+(dot-0.56)·0.9)`; base color mixed between `#ce925a` (bright ochre) / `#6e4426` (dark) / `#b6643a` (red spot) using two low-frequency fbm layers, then ×(0.72+shade·0.55). Upscaled to full screen with smooth interpolation → gentle undulation.
   - Two layers of `P.grain` (dark 0.22 density α0.32, bright 0.10 α0.28) for grain; 10 random-walk cracks (each step ±0.45rad turn, step length 14–40px, 12% branching probability), bright line offset +1.6px below dark line → engraved feel.
   - Vignette: radial gradient r 260→1180, outer ring α0.8; central static warm light with lighter (α0.36) illuminates only the wall.
   - **Pitfall: when the mid-frequency coefficient is too large (0.35, ×60 normals), the entire wall looks like camouflage/dunes, and figures pasted on it look like camo gear.** Reducing mid-frequency to 0.16, normals to ×52 gave the right rock-face look.
2. **"Paint sinking into rock"**
   - All figures drawn uniformly via `shape()`: first a pass with **fuzz pattern** (sparse charcoal dots, width 2lw+7) → then **ink pattern** (charcoal black, 7% random holes + noise >0.58 gives large holes, width 2lw) → finally flat fill covering the inner half. Effect = solid charcoal line + spray-dot fringe, painter order naturally handles occlusion (arm covers outer-garment lines).
   - Charcoal "boiling": two 256px patterns randomly translated via `pattern.setTransform` every 1/9 s — geometry stays fixed, grain hops. Cheaper than path jitter, no deformation.
   - After the entire paint layer is drawn, a `cave_figtex` texture is composited `source-atop`: rock-face shadow→black α(0.5-v)·150, highlight→warm white α(v-0.5)·50, dark/bright grain, low-frequency wet-dry blotches α≤70. **Only one full-screen composite for the paint layer** — hence 19ms.
   - All fills are opaque flat paint; texture "dirties" the color; don't use multiply to composite paint — chalk (the cat's white) would disappear.
3. **Negative handprints/pawprints**: 320² temporary canvas Gaussian spray (σ46·s 3200 dots α0.15–0.6 + σ28 1400 dots), then `destination-out` a solid hand-shape mask, finally fill mask α0.3 with `#f6e2bc`. **The hand shape must be filled block by block into the mask**: adding the palm ellipse and finger capsules via `Path2D.addPath` into one Path2D and filling in one go produces nonzero-rule winding cancellation, creating gaps (r4 hit this pitfall).
4. **Firelight**: one radial gradient per frame, center (1000+40·noise(t·3.1), 540+26·noise(t·2.3)), intensity `0.13+0.09·noise(t·8.5)+0.04·sin(21t)`, **composited with overlay** (α=intensity×2.6). Outer ring adds a secondary vignette that breathes opposite to the firelight. Pitfall: originally used lighter — the girl's golden hair and hide were washed to pinkish white, losing ochre saturation; switching to overlay restored the color.
5. **Embers**: `P.particles` three groups (left 0–360 ×11, right 1540–1920 ×12, center ×5), y drifting from 1110 to 120, lifetime 5.5s; bright core r 2.2–4.6 + 3.2× glow, `|sin(6t+1.9i)|` flicker, `sin(q·π)` fade in/out, lighter composite.

## Motif Animation
- **Two bison/horse poses**: `ph = floor(t·60/7)%2` (switches every 7 frames), legs use two sets of endpoint coordinates (extended/retracted), head rotates ±0.07rad around neck point, overall y alternates -3/+1px; horse and bison are phase-inverted. Legs use charcoal lines only (same as the original), body is filled silhouette + a 22px dark stripe along the spine (Lascaux-style chiaroscuro).
- **Raising the cup**: did not use the RIG cup trajectory (tabletop→mouth, tabletop point at the girl's chest, not like the original's "extended arm mid-air"). Custom: `hold=(1084,506)` → `mouth=HP(1224,380)`, progress `k = choreo(max(0,lt-0.95)).cup` (choreo curve shifted 0.95s to align with the original's frame 58 cup lift); arm uses `RIG.ik2(G.A.shoulder, cup+(34,10), 170,128,-1)`; `RIG.girl({cup:k})` still handles the head tilt-back and drinking micro-tilt. k runs from lt≈1.85 (T01 transition end) to 1.
- **Steam**: three charcoal lines `x0 + sin(13q − 11t + 1.3j)·6`, height 58px, following the cup.
- **Cat**: RIG.cat head/eyes/nose/earInner/stripes/tailPts anchors + custom pear-shaped body, white chest, white forelegs, thigh arc; tail = fuzz/ink/orange three-layer stroke + crossbar stripe every 4 sample points; blink from choreo.blink.
- **Cat size (review rework)**: RIG.cat at original size puts ear tips at y≈535, pressing into the painting-frame bottom edge (550). The whole cat is scaled 0.86 using a canvas transform anchored at the paw bottom (540,905) (translate→scale→translate, RIG.cat itself remains s=1), ear tips fall to y≈582, ~30px clearance from the frame bottom, paws stay put. Line widths scale ×0.86, imperceptible.
- **Title**: `Kalam-700` 78px letterSpacing 7, scaled horizontally to 930px wide, `#9b2a18`, drawn into the paint layer (also picks up the rock-face texture). α = t<0.933 ? 1 : 1-(t-0.933)/0.2.

## Motion Quantity Rework (review spec: static-segment frames 21–84, 480×270 per-frame mean diff)
Replica 0.62 vs. original 0.86 — too static. Added local motion only, no full-screen flashing:
- Firelight: intensity `0.14+0.11·noise(9.5t)+0.04·sin23t+0.03·sin37t`, center drift ±60/±36px (was ±40/±26).  Tried larger (±0.16, ±90px) — pushed to 1.22, image shook, rolled back.
- Embers 28→49 (left 20, right 20, center 9), bright core r 2.6–5.4, glow α0.32, 3.6×, flicker `0.3+0.7|sin|`.
- Handprints pulsing: each handprint overlaid with an r=105 warm radial gradient (lighter), α=0.2·clamp(0.5+0.9·noise(7t+3.7k)), independent phase per print.
- Bison/horse bounce ±3→up/down 9px, left/right ±3px, head swing ±0.12rad.
- Cat head micro-motion (matching original frames 65–81): lt 1.08–1.35 uses `sin(πq)` envelope, head lifts and turns −0.16rad around neck point (596,680), RIG.cat look pushed 1.5, ears twitch at 60Hz ±0.06rad.
- Result: **0.62 → 1.06** (original 0.86); per-frame max 22ms.

## Adapting the Girl to the Era
Red ochre `#9c3520` silhouette (face/neck/arms/calves), profile shows only one almond eye (off-white sclera + black iris + one eyelash, blink becomes an arc) — this one detail is the key to the "girl" read; golden hair filled with yellow ochre `#cf8f2c` + 6 `#6e3c0e` wavy locks (amplitude grows with length), outline also wavy; lower half of locks gradually stops following the head rotation (HB function), preventing the hair from whipping when the head tilts back to drink. Knee-length hide coat = G.torso + custom hem (one ±16px sawtooth fringe per 15px), `#b06a2c` + 26 "circle + 7 dot" leopard spots + 18 short fur lines, seam covered by "describing both panels' edges and filling together."

## Palette
Wall `#ce925a/#6e4426/#b6643a`; charcoal `#21150d`; red ochre `#9c3520`/dark `#74261a`; yellow ochre (cat) `#c9772f`; golden hair `#cf8f2c`/`#6e3c0e`; hide `#b06a2c`/spots `#4e2610`; chalk `#f0dfbf`; bison `#8c3d22`/head `#76301a`; horse `#cf8236`; stone `#c98c50`/`#c08048`; tabletop `#d49a5a`; handprints `#8e2a1a`; embers `#ffe082`.

## Room for Improvement
- The girl's body uses RIG's realistic curves, which are "too smooth" compared to true cave-painting figures; a more primitive approach would downsample the outline to 12–16 points and add stronger hand-drawn jitter.
- The cave-wall relief is static; firelight only changes brightness, not shadow direction. Truly "rock surface undulating under flickering firelight" would need two shade maps with different light directions, interpolated by firelight intensity (+1 full-screen composite).
