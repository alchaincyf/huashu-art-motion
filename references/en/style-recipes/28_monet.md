# 28_monet · 1899 Monet *Water Lilies* + *Japanese Bridge*

[中文](../../风格配方/28_monet.md) · **English**

> Source: Migration Test C (stand-alone agent working read-only from skill, 2026-10-04). Scene code ported after integration to `scripts/engine/scenes/28_monet.js`.

Experimental filename: `scenes/k2_monet.js` (176 lines). ~105 ms per frame; frame diff 30% (mainly from the boiling water surface).

**Composition**: wall = Orangerie-style water-lily mural (full-width water surface), window = green Japanese bridge (arched bridge + wisteria + pond), flanking the window are green Giverny shutters, the girl sits in front of the mural.

**Pipeline (09-benchmark structure)**
1. Base `moBase`, redrawn each frame because water lilies drift and willow reflections sway.
   - Water surface: vertical gradient `#b9c7e6→#8fa6d6→#6c84bf→#5a72a8`, with 4 pale yellow-pink sky reflections.
   - Willow reflections: 5 vertical bands, edges waving laterally `sin(0.03y−3.2t+k)·14`.
   - Water lilies: 10 clusters, ~100 notched ellipses total (rx 38–78, ry 12–21), 40% with pink/white flowers.
2. Brush strokes, 4 passes:
   - Water surface: cell 9, len 34, w 6.5, **horizontal** angle≈0±0.06, boil 6.
   - Window scene: cell 6, len 13, w 4.5, diagonal strokes upper half / horizontal lower half, boil 6.
   - Floor: cell 12, len 34, w 8, **boil 0**.
   - Window frame/shutters: cell 6, vertical and horizontal each one pass, boil 0.
   - All passes outline 0 (Impressionism does not outline).
3. **Bridge as its own layer**: in the base, first lay a dark tree-shade undercoat `#24452a` behind the bridge; the bridge itself is described with `#3f8a62` thick lines (20 px) as undercoat, `#8fdcae` bright lines as the top. Brush strokes use cell 5 with a 5-colour light-blue-green palette. Without this, the bridge is swallowed by the foliage palette and completely disappears.
4. Region palettes:
   - Water `#5b6fb5 #7d8fd0 #9db5e0 #6aa0a8 #b7a6d8 #d9c8e8 #8fb8a8 #a6c4e8 #c8b0d8` (mix .45)
   - Leaves `#5f8f4a #7fae5a #3f6f4a #9cc070 #6f9a7a #b4cc78`
   - Pink `#f0a0b8 #f7d0dc #fff2f4 #e88aa0`
   - Floor `#c69a6a #b07a5a #d8b08a #9a6a7a #8a7aa8 #e0bc90`
5. Character: flat fill mode → `source-atop` fine strokes (cell 6, len 12, white dress sampling from `#fbf8f2 #e4e0f6 #cfd2ee #f8ecd0 #d8e8f2`) → **colour shadows**: warm yellow α.22 linear gradient on lit side, purple α.32 on shadow side (`source-atop`) → only facial features added back, with `#5a4f8a` fine lines.

**Motif animation**
- **Water surface light shimmer**: 160 bright-colour short horizontal strokes (`#fffbe8 #fdf0d0 #f8e0ec #e8f4ff`). Brightness `clamp(sin(t·(5..11)+φ)·sin(2.3t+i))`; jumping ±5 px horizontally at 10 fps.
- Water lilies drifting `x+sin(1.3t+φ)·7+6t`, willow reflections waving, 3 ripple spots (dashed ellipses ry=rx·0.22, expanding and fading).
- Wisteria: 12 hanging clusters, each with 9 pale-purple dots graduating from large to small, swaying `sin(2.4t+0.9i)·8`. Straw hat blue ribbon fluttering.

**Character**: 1899 white summer dress, high collar, puffed sleeves (ellipses at shoulders), light-blue waistband; RIG straw hat recoloured `#ecd28a`.
**Pitfalls**
- Full-screen boil at 6 fps gives 47% frame diff — pure noise.
- Wisteria in the first version used thick line strokes and looked like smooth tablets; changed to dot arrays.
- Counter placed on the stroke base was unreadable; needs a blur-18 milky-white glow behind it.

---
