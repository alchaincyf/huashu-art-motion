# 30_matisse · 1947 Matisse *Jazz* Cut-Outs

[中文](../../风格配方/30_matisse.md) · **English**

> Source: Migration Test C (stand-alone agent working read-only from skill, 2026-10-04). Scene code ported after integration to `scripts/engine/scenes/30_matisse.js`.

Experimental filename: `scenes/k4_matisse.js` (167 lines). ~25 ms per frame; frame diff 9.3%.

**Composition**: wall = *Polynesia* double-blue checkerboard (`#1d4fb8 / #4f95dc`, each tile 240×236 cut-paper blocks), window = *Icarus* (cobalt blue base, black human figure, red heart, yellow stars), floor = emerald green `#1f9a5a` with a black baseboard, tabletop is a black cut-paper shape, chair is a yellow cut-paper shape.

**Technique**
1. **Scissor polygonal edge `cut(pts)`**: along the contour, sample one point every 14–24 px with ±2–2.5 px seeded jitter; points connected with straight lines. All self-generated shapes are processed this way.
2. **Seaweed (key)**: a tapered stem, plus 2×lobes alternating left-right **round-ended capsule fingers**. Finger angle `±(1.05−0.55u)`, length `width·(1−0.45u)`, width `width·(0.34−0.12u)`. All sub-paths `addPath`ed into one `Path2D`, filled once with nonzero winding to get the union; drop shadow also calculated just once. **Do not use "width-modulated spine"**: the first version did this and produced caterpillar shapes and Z-shaped lightning bolts.
3. **RIG character scissor edge**: RIG does not provide a point array, so the character layer as a whole undergoes a pixel displacement. The static displacement field is `fbm(0.028x, 0.028y, 2)·9`, with separate dx and dy fields; only the bounding box (330,470)–(1600,980) is processed, ~15 ms.
4. **Paper drop shadow**: shadow offset (5,6), blur 4, `rgba(10,20,40,.3)`, giving the effect of paper pinned to a wall.
5. **Gouache brush marks**: 2 600 long rectangular strokes cached (60–300 px long, 6–22 wide, half black and half white, α .04–.13, tilted −0.25 rad), whole-frame `overlay`.

**Motif animation**:
- Seaweed rocks like a paper strip around its base `sin(2.8t+φ)·0.13`; the curl-edge breathes `scaleX 0.93–1.0`.
- Icarus: 7 irregular yellow stars, spinning and flashing (scale `.82+.22sin(7t+1.9k)`); black figure floats up and down; red heart beats (`1+.18·max(0,sin 9t)`).
- Two white birds flapping (scaleY `.55+.45cos 13t`).
- A pink sheet of paper flips and falls (scaleX=cos 6t).
- Steam is two small white cut-paper pieces.

**Character**: Matisse's *Romanian Blouse*. Wide-sleeved white blouse; a cobalt-blue embroidery band down the front (small red and yellow alternating triangles); red and blue embroidery horizontal bands on the sleeves rotating with the arm (clipped inside `upperArm`); red long skirt + black belt; gold hair is 5 cut-paper curls. Facial features are only cut-paper fragments: black almond eyes, red-triangle lips, pink circle cheeks.
**Pitfalls**: the falling paper's first version had its trajectory cross the girl's face; moved to the left wall. Counter needs a white cut-paper backing, otherwise black text disappears against the cobalt blue.

---
