# 04_roman · 79 AD Pompeii Mosaic — Technique Notes

[中文](../../风格配方/04_roman.md) · **English**

File: `scenes/04_roman.js` (~330 lines). Final self-check: warm max 17ms / mean 13ms (1920×1080); init 206ms (once at boot); 17,871 tiles, of which 13,067 in the dynamic zone re-sample color every frame. Determinism pass.

## Core Idea: Layout Computed Once, Colors Flow Through Each Frame

Mosaic animation should look like this: the tiles themselves are fixed to the wall; what moves is color flowing from one tile to the next. So the renderer is split in two halves.

1. **init (`build()`, 206ms)**: computes where each tile is, how large, what orientation, which pixels belong to it, and its bevel shading — stored as `ID` (Int32, one tile number per pixel, -1 = grout) and `SH` (Uint8, brightness per pixel, 128=1.0).
2. **Every frame**: redraw flat-color draft, `getImageData` once, then sample color at dynamic tile centers (plus each tile's fixed color jitter), then fill dynamic-rectangle pixels per-pixel with `color×brightness>>7`, finally `putImageData` to the off-screen canvas and `drawImage` it onto `c`.
   - Pitfall: **cannot `putImageData` directly to `c`**, because that ignores the engine's punch zoom and transition clipping. Must write to off-screen canvas first, then `drawImage`.
   - Per-frame per-pixel processing covers only ~1 million pixels (4 border bands, inside the frame, the girl, the cat) — about 5ms in JS loop. All off-screen contexts use `{willReadFrequently:true}` so `getImageData` is fast.

## Tile Layout (andamento: along contours)

Simplified from Hausner 2001 "Simulating Decorative Mosaics."

- **Structure map**: add the static draft plus frame-0 cat and girl (omit moving near-side arm), downsample to 960×540. Sum of adjacent-pixel RGB differences > 34 is an edge; also include the category-map border-band boundaries as edges.
- **Distance field**: Felzenszwalb–Huttenlocher exact Euclidean distance transform (two 1D lower-envelope passes), ~20ms at half resolution.
- **Contour-walk tile placement**: candidate pixels satisfy |d−(k+½)s|<1.5, k < category's ring count — i.e., iso-level bands of the distance field. Starting from unvisited candidates, walk the 8-neighborhood preferring "most consistent with previous step" direction (0.6/0.4 smoothing), place a tile when distance from the previous tile ≥s. Tile orientation from the distance-field gradient tangent. Spatial hash ensures any two tiles are ≥0.8× average size apart.
- **Fill gaps with regular rows**: each category lays a brick-offset grid (row jitter ±5%, column jitter ±9%). Minimum-spacing check uses 0.86 — if it fits, place it. This step also fills gaps between contour rows and along the center axis.
  - Pitfall: originally only let "distance ≥K×s" places use the grid — narrow shapes (cat tail, 26px wide) got zero tiles, the whole tail exposed grout. Relying on minimum spacing alone solved it.
- **Border bands placed separately**: each edge in its own local coordinates places 11 rows; tile edge length 7.6px, width randomized 0.86–1.14 along the border direction; four corners are 11×11 square grids.

| Category | Tile side px | Contour rings | Color jitter |
|---|---|---|---|
| Wall | 12 | 1, then regular rows | ±8%, 7% of tiles extra-darkened 12% |
| Halo (white border outside figures/objects) | 11 | 9 (whole halo along contour) | ±5% |
| Girl body / objects | 10 | all along contour | ±5% |
| Girl face, cat head | 6 | all | ±4% |
| Hair | 8 | all | ±5% |
| Inside volcano painting | 9 | 2 | ±6% |
| Outer border band | 7.6 | rows along edge | ±5% |
| Text | 7 | all | ±5% |
| Ground band | 13 | 1 | ±6.5% |

In addition to the per-category jitter, every tile gets ±7 additive grayscale jitter. 9% of tiles are warm-shifted (+12,+4,−8), 7% cool-shifted (−6,0,+9).

## Tile Shape and Grout: Weighted L∞ Voronoi

- Each tile is a rotated rectangle. Four half-edge lengths are independently sampled at `s/2×(1.08–1.28)`, rotation angle jittered ±0.06rad. Distance from pixel to tile k is `D=max(|u|/h±, |v|/h±)`, where (u,v) is the pixel's position in that tile's local coordinates.
- Rasterization records the minimum D1, second-minimum D2, and their tile numbers per pixel; cost is bounding box 1.5h per tile.
- **Grout**: pixels where `D1>1` or `(D2−D1)·h/2 < g` (g = clamp(0.1s, 0.75, 1.25)px) are grout — they fall near the bisector between two tiles. Grout width ≈1.5–2.5px; tiles "cut" into irregular edges by neighbors, like real hand-cut tesserae.
  - Pitfall: half-edge length originally only sampled at `s/2×(0.9–1.1)` — tiles smaller than gap, ~40% of the area was grout, looked sparse. Making tiles 8–28% larger than half-gap and letting the bisector cut them down gave dense packing. This is the key to the texture quality.
- **Bevel shading**: within 2.2px of edge, brighten or darken ±16% based on outer normal vs. light direction (−0.6,−0.8) dot product (top-left bright, bottom-right dark). Plus dome term `−5%·D1²` and ±3% pixel grain.
- Grout color: `rgb(112,103,92)` ±8 noise.

## Flat-Color Draft and Color Choices

- Wall `#e4ddcd`, halo `#f5f1e8` (each figure and object has a 44–50px halo; tiles will align along it for a white border), outline `#46322a`, outline 8px (face 8px for good row alignment).
- Frame: red `#a8322a`, then inward: dark red `#7c221d` line, gold `#d0a23c` line, dark line.
- Volcano: three faces — bright `#7c84b8`, mid `#4e5796`, dark `#2f3672`; sky `#9ec0d8`→`#d3e3e4`; slope `#6f9341`/`#92b254`; ground `#cba344`; cypress `#2b5a2f`; lava `#d64a22`/`#f2952c`.
- Girl: stola `#efe7d5`, hem two red stripes `#a8322a`; red shawl in three sections (draped diagonally across the back, one piece on the knee, one hanging in front), fold lines `#7c221d`, gold brooch; short sleeve edge: cut a circle in the upper arm centered on the shoulder with radius 62, add red border; golden hair `#dcaa42`, layer lines `#9c6c1c`, rear spiral bun; red headband uses cubic Bézier and rotates with head tilt.  Eyes drawn as 10×6 white plus radius 5.5 dark — exactly the right size to resolve as "one white + one dark" two 6px tiles.
- Cat: orange `#dc8530`, back darkened `#c06a24`, stripes `#9c4818`, white `#f7f2e8`, large yellow eye `#e9c22c` (radius eyeR×1.65), red collar `#b02a22` with gold pendant. Body uses `RIG.smooth(K.bodyPts)` for pear shape, replacing the original polygon. Tail ring markings with dashed line `setLineDash([9,13])`.
- "CAVE CATTVM": **custom equal-width thick-stroke letters** (C uses ellipse arc, A/V/E/T/M use polylines), stroke width 14px, letter height 60px, spacing 16, scaled horizontally to 600px wide.
  - Pitfall: using Cinzel-700 `fillText` directly — thin horizontal strokes break under 7–9px tiles (E becomes F, A loses crossbar), and tight spacing makes letters merge. Three iterations concluded: "mosaic letters = equal-width thick strokes, ~2 tiles wide per stroke."

## Motif Animation (this segment lt 0–0.94s, drawn through 1.29s during T04 transition)

- **Four-border wave pattern flows clockwise**: each edge uses `setTransform` to local coordinates (u along clockwise, v inward from outside); draws the same Vitruvian scroll: starting from inner black band, spiral r from 24 shrinking to 5, 2.25 turns, line width 13, period 81px. Phase is `42·lt + 81·easeInOut((lt−0.485)/0.365)` — constant drift throughout, plus one extra period during the original frames 226–248. Tile positions fixed; black and white flow between tiles — exactly the look of mosaic coming alive. 0.4→0.9s: 20% of border-band pixels are changing.
- **Vesuvius smoke**: volcano vent is only 70px from frame top; smoke drifting upward gets cut off immediately (first version hit this pitfall). Changed to a grey cloud band drifting rightward at 55px/s (period 380px), plus 9 smoke puffs (dark `#3f3c3a`→light `#a29c94`) pressed low across the sky drifting right, plus 12 sparks (10px squares, parabolic trajectories) and lava vent pulsing. 4.4% of pixels inside the frame changing.
- **Cup raise**: rhythm from `choreo.cup/sip`, cup is a gold kantharos with two handles, white stone steam at the rim, opacity 1−0.85·cup. Path is custom `armPose` (see "review rework" below).
  - Pitfall: with 15px wall tiles, hand and cup blur into a blob in the large tiles. Tried giving the arm-sweep zone its own 8.5px tiles — looked like a bright patch at rest. Final fix: uniform 12px for the whole wall.
- **Cat**: tail uses `choreo.tail×1.6` (original amplitude too small to see under 9px tiles); blink turns the eye into orange tiles plus one dark line.

## Performance and Dynamic Rectangle

- Dynamic rectangle computed at init from bounding boxes of sampled poses (cup from 0 to 1 every 0.05, sip at 0/0.15; cat tail at ±0.75 range), expanded 58px outward, enclosing halo and steam. Outside the rectangle is the frame-0 static mosaic.
  - Pitfall: rectangle must be large enough — tiles crossing the boundary show half new color, half old.
- All frames in the full timeline's Roman segment (including both transitions, old and new layers drawn simultaneously) are under 40ms, except the first entry into transition when other era cold caches are building.

## Self-Check Notes

- `selfcheck`'s "motion diff 0.2↔0.7" is contaminated by the engine's beat impact punch. lt<0.37 the entire frame is zooming — reports 68%, not the scene moving. Use 0.4↔0.9 (after impact): full frame 6.2%, border band 20.4%, girl 8.4%, frame 4.4%, cat 0.8%.

## Room for Improvement

- When the girl raises the cup to her lips, hand/cup/face cluster together — slightly blurry at 6–8.5px tile scale.

## Review Rework (Second Round)

- **Cat**: canvas transform anchor at paw bottom (540,905), scaled to 0.85 (category map and dynamic rectangle scale in sync); ear tips from y≈540 drop to ~590, halo no longer touches the frame. Head redrawn as frontal Pompeii cat: two R17 large yellow round eyes, black vertical pupils, 7px dark eye surrounds, head 11px dark outline, also 6px small tiles in the category map so the outline rows well.
- **Cup-raise face smear**: no longer uses the skeleton's default cup-raise path — replaced with custom `armPose`. Cup moves along a quadratic Bézier from "tabletop → (1150,470) → just in front of lips," endpoint is the cup-rim right edge touching `G.lips[0]`, tilt angle 0.15rad (8.6°). Hand cupped under base (offset interpolated from (28,34) to (3,44)); IK same arm lengths 165/122 and elbow direction. Forearm vertical in front of the chin; nose/lips/chin/eyes all visible. Face outline thickened to 10px.
- **Restore wall feel**: removed the "8.5px arm-sweep zone" category. Wall uniformly 12px (also closer to original wall-tile scale); dynamic zone wall and surroundings share the same layout, only re-sampling color each frame — no visible boundary.
  - Lesson: never use a different tile size in a dynamic zone for detail — at rest it's a patch.
- After rework: warm max 17.1ms, mean 13.0ms, determinism pass.

## Film Review Rework (Third Round, report items 3 & 4)

- **Border not visibly scrolling**: actually moves in the full timeline (renderFrame), but under "tile fixed, only color changes" the scroll pattern moves only 1–3px per frame, which is quantized away by the 7.6px tile size — almost invisible in the motion heat map.
  - Fix: border changed to a "conveyor belt." init pre-bakes a 2106px strip (26 periods). Pattern period is 81px; tile layout also cycles on 81px: each row 11 tiles, widths individually random but normalized to exactly 81px total, jitter also repeating on period. So the whole strip can shift by any phase and tile seamlessly.
  - Each frame applies one `c.transform(edge local coords)` per edge, clips, `drawImage(strip, BW−2·81+phase, 0)` — tiles travel with the pattern, clockwise. Four corner squares remain static.
  - Phase changed to `15·lt + 81·easeInOut((lt−0.485)/0.365)` — constant drift reduced from 42 to 15px/s, main motion reserved for one period during original frames 226–248.
  - Static-segment motion (motion.py, 480×270 mean frame diff, frames 222–253): replica up from 1.98 to 4.62, original 2.90. At 42px/s drift it was 5.5.
  - Rule: when slow-pattern displacement is less than tile size, "color-only" is swallowed by quantization — either move tiles with the pattern or make displacement far exceed tile size.
- **Cup unreadable**: cup removed from draft, changed to a 4.4px small-tile mosaic sprite `cupSprite`. Content is the kantharos at 1.3× scale: dark-outline tiles, gold body (right side darkened), bright rim with dark interior, two handles, base. Each frame the whole sprite is composited at `armPose` position and tilt angle. Steam also changed to two columns of white square tiles traveling up a sine wave (`steamTiles`) with grout borders. Only the cup's white halo remains in the draft.
  - Rule: props narrower than 3 tiles in a fixed layout are unreadable — make them moveable "emblem"-style inlay pieces.
- **Face features unreadable**: face tiles from 6px to 5px. Eye: white 13×7, dark 8×7, ~3 dark tiles plus white; lips changed to red `#a8282a`, 8.5×6 ellipse, ~2 tiles; eyebrow 6px dark brown. At half-scale 1080p, eye and mouth readable.
- After rework: warm max 20.9ms, p90 17.4ms, mean 13.9ms, determinism pass.
