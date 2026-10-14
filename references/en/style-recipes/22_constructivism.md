# 22_constructivism · 1924 Russian Constructivist Poster (Rodchenko / El Lissitzky)

[中文](../../风格配方/22_constructivism.md) · **English**

> Source: Migration Test B (stand-alone agent working read-only from skill, 2026-10-04). Scene code ported after integration to `scripts/engine/scenes/22_constructivism.js`.

Experimental filename: `scenes/c1_constructivism.js` (~175 lines). Median per-frame ~5 ms; frame diff 3.6%.

**Pipeline**
1. Base plate, fully cached `cs_bg`: off-white aged paper (`P.texture` `#e9dfc4`, dark `#d9c9a4`) → left-side diagonal black stripe (rotate −0.5), red square (rotate 0.26), 5 rows of "body-text" black bars → right-side thin diagonal lines, red circle dot, black vertical bar with vertically typeset geometric Cyrillic letters "ЧАЙ" → large black circle behind the figure's head (centre (1330,395), r 215) → diagonal red ground (0,905)→(1920,856), 12 px black line along upper edge → window → black table (red edge, diagonal brace) → black-block stool.
2. **Window = photo collage**: first draw a greyscale "photograph" off-screen (sky gradient `#5e5e5e→#e8e8e8`, radial white clouds, dark factory silhouette, chimney), then halftone it with `halftone()` (cell 7, gain 0.8); the Shukhov tower is drawn in crisp black lines on top of the halftone (five hyperbolic sections, each with two sets of 18 straight generators, phase offset ±1.1 rad, back-facing generators with sin<−0.2 omitted) — this is exactly the "photo + hand-drawn" collage effect.
3. **Skin = halftone photograph**: face, neck, and hands are first drawn as greyscale gradients (front bright, back dark, `#fafafa→#9c9c9c`) into an offscreen canvas, then halftoned (cell 4.6, gain 0.74, 45°). Underneath the dots is an off-white base; the outer edge first has a 7 px `#fbf7ea` border — this stripe represents the white border of a cut-out photograph. Facial features are drawn with crisp black strokes; lips are hand-coloured red. Clothing is all flat cut-paper fill + 3 px black outlines; shadows use `shadeDots()`, dropping dot grid inside the path.

**Key functions**
- `halftone(c, src, bx,by,bw,bh, cell, col, gain, ang=π/4)`: samples `src` greyscale on a rotated grid; dot radius = cell·gain·√(1−L), placed only where alpha>128. **All dots collected into one path, filled once**. ~3 000 dots for the face, <2 ms.
- Geometric Cyrillic letters: 5×7 modules; each letter is a set of rectangles or polygons (the diagonal stroke of Й is a quadrilateral, the breve is a small rectangle above). **Each component filled individually**.

**Motif animation**
- El Lissitzky's red wedge driving into the black circle: apex travels back and forth along the 0.34 rad axis, `70·(0.5−0.5cos(2π·1.6·lt))`.
- Red dashed ring outside the black circle: dash [46,22], `lineDashOffset = −260·lt`.
- Tower-top radio waves: 4 red arcs, `r = 18 + ((1.4lt + k/4) mod 1)·230`; α and stroke width decay with phase.
- Ground slogan "ПЕЙТЕ ЧАЙ!": letters stamped in sequence (the k-th letter starts at 0.045k seconds, scales from 1.5× back to 1 over 0.12 s), then the full row bounces as a wave `−10·max(0, sin(11lt − 0.8k))`; every 4th letter is black.
- Headscarf tails sway `sin(9lt)·6`; steam above the cup is three rising black zigzag lines.

**Character**: Young Communist League girl — red headscarf (13 points at the head section, front edge moved back to reveal golden fringe, two triangular tails knotted at the nape), white blouse + red Young Pioneer neckerchief triangle + red cuffs, dark grey skirt (halftone shadow). Cat is cut-paper orange `#e2741c` + off-white, 10 px black stripes, tail outlined with dashes for a tiger-stripe look, eyes are square-pupil vertical bars.

**Palette**: paper `#e9dfc4`; red `#c8231c`/`#8f1711`; black `#151311`; off-white `#f4ecd6`; golden hair `#e3b03e`/`#a87a1c`; cat orange `#e2741c`.

**Pitfalls**
- The breve of "Й" was first drawn above the letter grid (y=−1.7u): when typeset vertically it was covered by the letter above, and in the ground slogan it was covered by the skirt hem — reviewers read it as "ЧАИ". Fixed by fitting the whole letter within 7 grid units (the И portion shifted down 1.7 units); the slogan was also moved to draw above the character (poster text overlapping the figure).
- "А" was first assembled from two opposing diagonal legs + a crossbar in a single path; the overlap was cancelled by nonzero winding and read as "В" when typeset vertically. Fixed by filling each component individually.
- The ground slogan baseline was originally at y=1060; the lower half of the letters went off-frame. Positioned with `translate(x, 990)` anchored to the letter centre.
- The cheekbone shadow was too heavy in the first version; after halftoning it looked like a beard. The shadow α in the greyscale source must be about half that of a solid fill.

**Room for improvement**: Rodchenko's more characteristic work uses "figure photograph + megaphone-cone text wedge." The steam could be replaced by a red-black wedge-shaped text cone radiating from the cup.

---
