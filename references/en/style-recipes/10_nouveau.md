# 10_nouveau · 1896 Art Nouveau (Mucha poster)

[中文](../../风格配方/10_nouveau.md) · **English**

File: `scenes/10_nouveau.js` (about 300 lines). Performance: warm average 29ms, maximum 37ms, first frame (building caches) ≈80ms; determinism passes (two renders at the same lt are pixel-identical); lt 0.35→0.65 motion difference: 13.1% of pixels. On-screen duration 0.70s (T09 organic-wave transition 0.24s, growing from (1330,320), the girl's halo).

## Pipeline
1. **Fully cached background `nv_bg`**: three-part vertical gradient gray-green→beige-green→peach (`#b9cba0`→`#cfd3a6`→`#ecc9a2`, only inside 34..1886×32..907); dot pattern = r10 ring + r2.6 center dot, row spacing 54, column spacing 62, odd rows offset 31 (staggered diamonds), color `rgba(120,140,100,.38)`; enlarge a 240×135 fbm image at α0.5 for lithographic mottling (hundreds of times faster than full-screen noise); mosaic floor strip with 20×24 cells and nine colors shuffled by `(k*7+(k>>2))%9`; green banner `#8fac80`; title `Marcellus-400` 76px, letterSpacing 12, first a 7px dark-brown stroke then creamy-white fill; gold frame = outer 6px gold `#c9a24a` plus two inner/outer 2px dark-brown lines.
2. **Variable-width path `ribbon(pts, w(q))`**: densify points with Catmull-Rom (4–10 points per segment), offset each point by w/2 on either side along its normal, then fill the resulting closed polygon. Every "whiplash line" uses it: stems, leaves, wrought-iron table legs, banner foliage, hair, and steam. `swellW(wmax)` = pointed ends and thick middle (sin envelope), giving Mucha's lines their breathing width. Spiral finish `spiral(cx,cy,r0,a0,turns,dir)`: radius shrinks linearly to 15%.
3. **Mucha's thick outer contour and thin inner lines, using offset whole silhouettes**: draw all characters (cat + girl + hair + shawl) into offscreen layer L (RIG both mode, lw 2, so inner lines occlude correctly in part order); copy L, tint it dark brown `#4e3320` with `source-in`, then place three offset copies beneath L on the main canvas at (-1.5,-1.5), (3.5,4.5), and (2,2.5). Result: 1.5px around the silhouette, a 4–5px thick lower-right edge; inner lines remain 2px. Only three additional full-screen drawImage calls.
4. Topmost grain `P.grain('nv', .05, 暖棕, .14)` (warm brown) gives a lithographic print finish.

## Motif motion (all must be visible within 0.7s)
- **Sunrise**: measurements from the reference film (frame 509 (583,400) → frame 530 (576,299), ≈-5px/frame) become `sy = 400 - (lt-0.267)·288`, `sx = 583 - (lt-0.267)·20`; at lt=0, y is 477 (hidden behind the hills), reaching 275 at lt=0.7. Draw hill color bands after the sun: natural occlusion makes it rise from behind the hills.
- **Rotating leaded rays**: 14 radial lead strips from r92→r420 around the sun, slowly rotating at `+lt·0.9·0.25` with ±0.04 wobble; strips move with the sun, changing the whole window's glass divisions, its most obvious motion.
- **Stained-glass border**: along the arch's inner edge (straight sides + ellipse rx219 ry130), place a 14×14 tile every 17px, rotated to the tangent, cycling six colors.
- **Swaying poppies/lilies**: flower heads move horizontally by `sin(7.5t+φ)·13 + sin(3.1t+2φ)·5`; stems are three-control-point ribbon curves, moving only the upper section; left/right clusters have opposite phases; leaves use 0.3× amplitude.
- **Rotating halos**: girl's halo R172, 18 studs rotating at `+0.9t`; inner 32 rose-window petals counter-rotate at `-0.63t`; cat halo R106, eight orange petals at `-1.1t`, plus a moving gold dashed ring lineDashOffset.
- **Hair**: one large mass first (16-point smooth, outer edge moving by `sin(6t+y·0.035)·9`), then seven curls behind and two in front of the shoulders: each a 12-point S curve `sin(7.4q+φ-7t)·(6+20q)` (downward traveling wave), ending in a 1.2-turn spiral, width tapering 14–18 → 2.5, creamy-yellow highlight core + fine dark-gold line. Six small crown curls add volume. All points follow `G.A.headC` displacement (moving together when the head tilts back to drink, less toward the tips).
- **Decorative S-shaped steam**: three creamy-white ribbons (widths 26/20/14) + 1.8px brown stroke + centerline, `sin(4q+φ-6t)·(18+70q)` traveling wave, horizontal spacing widening with height by ×(1+2.6q), ending in a 34px spiral; overall `lean = -90 - 160·cup` tilts left. **Pitfall**: choreo raises the cup to the mouth; vertical steam crosses the girl's face, so it must tilt with cup toward the window.
- Choreo: cup lifting, head tilt, blinking, tail flicks, and breathing all use RIG; the saucer stays on the table (so the table is not empty when the cup is lifted).

## Palette
Lines `#4e3320`; gold `#c9a24a`/`#9c7a2e`; creamy white `#f6eedb`; skin `#f6dcc4`; blond hair `#e8bf55`/highlight `#f6dc8a`/shadow `#b9862a`; dress `#f4ecda`; pink shawl `#e6aaa5`/folds `#d48e8c`; poppies `#d9706a`/`#b4504b`, centers `#3f6a4a` + gold dots; lilies `#f7f2e6`; wrought iron `#3d7763`; cat `#e39a4c`/`#fbf3e3`/markings `#c0672c`, eyes `#e6c040`; pink halo `#ebb8b2`, teal ring `#5f9a8a`, cat's red halo `#b8473a`.

## Pitfalls
- **Overlaying `drawGirl(mode:'line')` on top draws occluded part outlines (far sleeve) through the torso** (also present in reference 09). Instead, use both mode in an offscreen layer to draw lines in part order, then add the thick outer contour to the whole silhouette.
- Hair initially used seven long 34px-wide ribbons, like sausages/noodles; Mucha hair = a base mass + fine S curls + spiral ends, width ≤18.
- Do not use lt<0.33 frames for difference self-checks: the engine applies a 1.03× beat-impact scale during the first 20 frames after a transition starts, turning the entire difference map red.

## Further improvements
- The cat still uses RIG's seated pose (straight white legs), while the design is a fluffy orange cat lying down; the Mucha feel relies mainly on halos and variable-width lines.
- The title uses Marcellus, while the design has rounder hand-drawn Art Nouveau lettering; a custom alphabet of letter paths could replace it.
