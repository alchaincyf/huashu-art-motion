# 27_kirby · 1966 Marvel Galaxy Age (Jack Kirby + Four-Colour Offset Printing)

[中文](../../风格配方/27_kirby.md) · **English**

> Source: Migration Test C (stand-alone agent working read-only from skill, 2026-10-04). Scene code ported after integration to `scripts/engine/scenes/27_kirby.js`.

Experimental filename: `scenes/k1_kirby.js` (255 lines). ~20 ms per frame; frame diff 7.5%.

**Pipeline: same geometry drawn twice**
1. **Colour plate layer**: paper `#f4ecd6` + flat fill + Ben-Day dots. Wall on light-blue base with C-plate dots (pitch 9, r 2.7, 15°); floor on dark-blue base with purple dots (pitch 9, r 3.2, 75°); skin has red dots (pitch 7, r 1.5, 75°). **Entire layer `drawImage(color, 4, 3)` = misregistration**.
2. **Ink layer**: white base; each component "white fill → shadow → black outline 6 px". Composited with `multiply` on top of the colour plate; white = transparent. Filling each component white covers the previous component's lines, leaving only visible lines — no need for `visibleLines`.
3. **Kirby's black-mass shadows + feathering (spotted blacks + feathering)**: light from the window (LIGHT=(−0.86,−0.5)).
   - Black crescent: `path ∩ ¬translate(path, LIGHT·d1)`, d1=14. Implementation: first `clip(path)`, then use a "full-screen rect + translated path" as `clip(…,'evenodd')`, finally `fillRect` black.
   - Feather band: same operation with d2=30 yields a band; inside the band, parallel lines are drawn in the light direction (spacing 9 px, stroke width 2.6).
   - Parameters (d1/d2): skirt 16/34, torso 14/30, sleeve 10/22, hair 12/26, cat body 16/34, tabletop 10/18.
   - One function handles Kirby-style shadow for any `Path2D`.

**Motif animation**
- **Kirby Krackle**: a cluster of 16–26 black circles. Distance distributed as `R·rnd^0.7`; larger toward the centre (`R·(0.05+0.2·(1-d/R))`); seed re-rolled at 12 fps; radius pulsing `sin(18t+i)`. 6 clusters move along an S-shaped energy stream outside the window (`(k/6+0.42t)%1`); the energy stream is an orange-edged yellow-core band + jagged ink border. Steam also uses krackle (4 small clusters floating upward).
- **Speed lines**: cup-raising speed `|sin(min(1,lt/0.9)π)|`; 9 black lines trail below the cup, length 70–180·v, jittering at 12 fps; two motion arcs behind the elbow.
- **Sound effect lettering SLURRP!**: pops out from lt 0.52 with `outBack` easing, using `Bangers-400` 132 px (×0.82); black extrusion 7 layers deep (each offset (0.8d,d)), giving Kirby's solid block-letter look; top 46 px of the red letters are clipped to yellow (two-tone letters); base is a 26-spike yellow explosion burst; jittering ±3 px at 12 fps.
- **Panels**: main panel 24..1534, right panel is a cat-face close-up, pupil tracking `cup` upward (`lerp(14,−18,cup)`), looking left. Background: magenta base + yellow Ben-Day dots + 44 converging black triangles (changed every 12 fps) + 6 krackle clusters around the head. Bottom caption box "BUT THE CAT IS WATCHING!", top-left caption "MEANWHILE, AT TEA TIME...". Counter styled as a yellow-base black-border caption box with a black offset shadow, placed in the top-right panel gutter.

**Character**: 1960s red A-line long skirt, white Peter Pan collar (two ellipses), three black buttons down the front, black headband (elliptical arc in the head's local rotation frame, stroke width 11), outward-flipped hair tips (drawn in the `skirt` hook, behind the torso). Chair is a Saarinen Tulip chair.

**Pitfalls**
- The sound-effect lettering was first placed at (1000,300) full size, covering the window and the girl's face. Moved to (990,318) and scaled to 0.82.
- The large black ellipse in the cat close-up made the cat look like a tortoiseshell; changed to a narrow crescent hugging the edge.
- Planet rings must be split into a rear half-arc (drawn first) and a front half-arc (drawn after), otherwise the ring passes through the planet.
- **Room for improvement**: the image reads as "clean pop-art comic" — still missing Kirby's blocky square fingers, more exaggerated perspective, and muscular tension.

---
