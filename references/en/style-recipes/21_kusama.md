# 21_kusama · Yayoi Kusama Infinite Polka Dots

[中文](../../风格配方/21_kusama.md) · **English**

> Source: Migration Test A (stand-alone agent working read-only from skill, 2026-10-04). Scene code ported after integration to `scripts/engine/scenes/21_kusama.js`.

Experimental filename: `scenes/05_kusama.js` (124 lines). 0.45↔0.9 s diff 17.3%; median adjacent-frame diff 2.98%; JS-side 4–28 ms.

**Crawling dots**
- Every dot's radius is multiplied by the same "travelling wave from the cat": `wave = 0.82 + 0.28·sin(dist·0.012 − 6t)`.
- The entire room's dots expand and contract in rings outward from the cat's position, as if breathing. This single function brings the whole screen to life.

**Dot layout**
- Wall: two hexagonal grids — large dots (30 px, 104 px spacing) + small dots (10 px, offset), each with ±25–50% jitter. Every dot is a slight ellipse with a random rotation angle, like hand-drawn.
- Floor: 9 rows, growing larger (6→28 px) and more spread out toward the viewer, flattened to 0.42 ellipse ratio for perspective.
- Red skirt white dots at 13 px / 52 px spacing, **crawling down the skirt** at 46 px/s (clipped to the skirt silhouette, y-offset taken mod).
- Cat: white dots in the orange area, red dots in the white area, each crawling downward.
- A red dot painted on the cheek as well (Kusama's body-art motif); a red-ground white-dot bow on the head.

**Infinity Mirror Room (window)**
- 3D grid of lights: 13×7×3, 6 colours. z cycles forward at 0.3/s with perspective projection F150.
- Each light is a solid small core + 3.2× halo, `lighter` compositing.
- Pitfall: the first version scattered lights randomly with large halos — blurred into a bokeh mess. A regular grid + small solid core finally gives the sense of infinite mirror repetition.

**Yellow pumpkin**
- 5 elliptical lobes, drawn outer → inner.
- Each lobe has rows of black dots: largest in the centre column (9.5 px), shrinking toward the sides and toward the top and bottom; dot size also follows the travelling wave.
- Full-body breathing: scale `1 ± 0.025·sin(5t)`, anchored at the base.

**Ending "self-obliteration"**
- lt 1.0–1.26: a red overlay fades in; a 120 px hexagonal dot grid grows outward from the cat in rings to 0.47× spacing. Followed by ~0.15 s with only the dot grid gently breathing, giving the ending a resting point (review noted the first version had no hold frame).
- Final frame freezes on the red-ground white-dot grid.
- Pitfall: the first version made dots grow infinitely — resulting in a white screen. Radius must be capped; the ending must freeze on the grid, not on a solid colour.
- Pitfall: the skirt and wall are both red-ground white dots, so the girl dissolved into the image. Final version increased the girl's outline to 4.5 px, removed red dots from the cat's white areas, preserving the orange/white boundary.
