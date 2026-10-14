# 29_seurat · 1884 Seurat *A Sunday on La Grande Jatte* (Pointillism: optical-mixing renderer)

[中文](../../风格配方/29_seurat.md) · **English**

> Source: Migration Test C (stand-alone agent working read-only from skill, 2026-10-04). Scene code ported after integration to `scripts/engine/scenes/29_seurat.js`.

Experimental filename: `scenes/k3_seurat.js` (136 lines). ~100 ms per frame; frame diff 7.4% (tranquil; mean adjacent-frame diff 0.45).

**Renderer (the key part — extractable into paint.js)**
1. Flat-fill base draft of the whole frame, characters included (~3 ms per frame). Beneath everything, a pass of `blur(4px) saturate(.85) brightness(1.06)` on the base draft is laid as a colour undercoat; gaps between dots reveal it.
2. **Fixed hexagonal grid, uniform dot size**: pitch 10, row spacing 8.66, r 4.5; each dot has ±1.2 px static jitter. ~24 000 dots total. Dots are collected by colour into 21 `Path2D` objects; each colour is filled once.
3. **Optical-mixing colour selection**: a 21-colour pure palette.
   - 14 saturated colours: `#1a2058 #2a3a9a #3f6fd0 #6aaee6 #1f6a52 #2f9a5a #a8c83a #f2cf3a #f08a2a #e0432a #c0306a #7a4aa8 #f8f4e8 #e8b48a`
   - 7 tints (Seurat's "mixed with white"): `#f6e49a #f6c48a #cfe08a #b0cff0 #f2b8c8 #c99a4a #9a7ac8`
   - For each pair (i,j), the target colour is **projected** onto the segment Pj→Pi to get a continuous ratio w, clamped to [.2,.8]. Distance is further penalised by `0.004·|Pi−Pj|²`, to avoid mixing black and white dots to make grey. The pair with the smallest distance is chosen; each dot uses `hash(i,j) < w` to decide Pi or Pj.
   - Results are cached in a Map, quantised to 15-bit colour.
4. **Add ±20 hash jitter to the target colour before selection** (R+dj, G+0.8dj, B−0.6dj). The switching boundary between paired colours thereby becomes interleaved dots rather than a vertical colour band.
5. **Complementary dots**: 8% of dots are switched to the complementary colour (blue↔orange, green↔red-purple, yellow↔purple … 21 mappings total). **Light bleed**: compared with the point 14 px to the lower right; when brightness difference >45, 45% probability of placing a white dot on the bright side and a deep-blue dot on the dark side.
6. **Border painted by Seurat himself**: 28 px deep-blue strip around all four sides, also rendered through the pointillist renderer, so orange complementary dots appear in the strip.

**Motif animation**:
- Window view of the Seine: a sailing boat drifts (40 px/s), a steamboat blows smoke, a silhouette of a woman with parasol + small monkey.
- River-surface dots re-rolled at 6 fps = sparkling water.
- An orange-red butterfly circles above the table (`sin(2.6t)·120`), flapping `|sin(20t)|`.
- 6 fps makes 7% of dots swap to their paired colour, depicting light trembling between dots. The first version used 4 fps/3%; independent review called it "essentially frozen" (mean adjacent-frame diff 0.1–0.2); changed to 6 fps/7%, now 0.45.

**Character**: 1880s deep-blue-purple long skirt + bustle at the back (an arc shape in the `back` hook) + white high collar + orange buttons + small round hat with a red feather. A closed red parasol leans against the chair back.
**Pitfalls** (both at the renderer level)
- Preferring a single pure colour (before the distance penalty) sliced the gradient wall into several vertical colour bands.
- After changing to continuous ratio values, the paired-colour boundary still switched an entire column at once, still producing bands. Solved by Step 4's target-colour jitter.
- The first version's palette had no tints; the bright wall was decomposed into white + skin-tone + scattered blue dots, looking like snow-noise.

---
