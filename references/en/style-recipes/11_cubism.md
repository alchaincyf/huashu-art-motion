# 11_cubism · 1912 Analytic Cubism (Picasso/Braque)

[中文](../../风格配方/11_cubism.md) · **English**

File: `scenes/11_cubism.js` (about 280 lines). Performance: warm average 13ms, maximum 19ms, first frame (building caches) ≈100ms; determinism passes; lt 0.34→0.46 motion difference: 6.9% of pixels. On-screen duration 0.47s (T10 fragment transition 0.24s).

## Pipeline
1. **Fully cached background `cb_bg`: translucent overlapping planes**. Core function `plane(g, pts, col, alpha, r)`: a linear gradient for each plane, starting at vertex 0 and ending at another randomly selected vertex, three stops = blend 25% cream → original color → blend 40% dark brown, alpha 0.18–0.7. Layers: 18 manually placed large planes (matching reference composition) + nine radial fan planes under the table (from (1000,1090), alternating light/dark α0.3) + 70 random triangles/quadrilaterals (avoiding the upper-right year area). Layered translucent gradients create Analytic Cubism's transparent, interpenetrating space, with a light and dark side to every plane.
   - Textured planes: four stippled areas (9px diamond grid r1.6), four hatched areas (diagonal lines spaced 7px), a sheet of horizontally ruled paper at the left edge.
   - Braque's short-dash sandy texture: 9000 small 3–8×1.5px dashes, 55% cream α0.28 / 45% dark brown α0.16, giving the reference's brick-like texture.
   - 46 fine straight lines across the image (1.3px α0.55) = passage.
   - Faux wood grain `wood()`: S/6 wavy lines along the long side, Gaussian bulges `14·exp(-(u-k)²/0.01)` at knots, four elliptical knot rings. Used for the tabletop and right wood panel (Braque's combed faux wood). Cane chair back = 10px diamond-hole dots + diagonal lines in both directions.
2. **Sliding window facets**: cache a 560×540 window view (55 blue-gray facets + three diagonal light beams + Eiffel Tower + gull arcs); independently clip four panes and sample with different offsets `dx = sin(9lt+1.7i)·18 + 10fps jitter ±3`, `dy = cos(7lt+i)·8`. The same view misaligned across panes combines multiple viewpoints; each pane also has a translucent triangle sliding horizontally at 260px/s.
3. **Jumping, rearranged CAFÉ stencil letters**: draw `AlfaSlabOne-400` at 104px into a small offscreen layer; step at 12fps (`st=floor(lt·12)`), cycling `CAFÉ/ACFÉ/CAÉF/CFAÉ`; each step gives every letter y ±13 and rotation ±0.11rad (from hash). Cut horizontal/vertical gaps with `destination-out` to make stencil letters (gaps reveal the underlying planes, more convincing than paper-colored strips).
4. **JOU newspaper**: cache a 300×190 image (LibreBaskerville-700 84px "JOU" + 12px headline "LA BATAILLE / S'EST ENGAGÉ UN CHAT" + three columns of gray pseudo-text); jitter at 8fps each frame (rotation ±0.0125rad, x ±1.5px); upper-right folded corner turns with `sin(20lt)`.
5. **Characters: custom faceting renderer `facetize`**: RIG flat fill (fill mode, no lines) into an offscreen layer → read bounding-box pixels → jittered triangle mesh (random diagonal per cell) → sample color at each triangle's centroid, brightness `×(0.8+0.38·rand)`, then a light→dark gradient from vertex 0 to vertex 2 → **draw triangles back without clipping** (skip centroid alpha<120). Not clipping is essential: the silhouette becomes jagged straight edges, with some triangles extending outside it, the Cubist sense of planes overflowing the contour.
   - Girl cell 58 (large planes); re-facet hair at cell 26, selecting only blond-looking colors (`only: R>150 && B<130 && R-B>60`); cat cell 26.
   - At 8fps, vertices jitter ±8% cell and 16–35% of triangles shift brightness ±12% (boil), giving slight character motion, matching the reference cat region at frames 548–562.
6. **Restore Picasso-like structure after faceting**: reapply two light/dark skin planes on the face (faceting brings blond into it) + blue-gray plane α0.82 on the front half + frontal almond eye (front-view eye on a profile) + spiral ear + red lips; two light/dark white-collar triangles + three buttons; eight radial cuts from the waist in the skirt + alternating light/dark wedges; outer outline uses straight `segs()`, extending each segment 10–16px at both ends (lines go beyond boundaries). Cat: straight hexagonal head outline, straight `bodyPts` body outline, yellow diamond eyes + vertical pupils, profile triangular nose.
7. Five topmost α0.2 planes overlap the person and cat, shifting by `sin(6lt)·8`, embedding them in the space rather than pasting them onto the background.

## Palette
Paper `#d6c8ac`, cream `#ece3cf`, ochre `#b8975f`, brown `#6e5538`, dark brown `#3a2c1e`, gray `#a8a395`, blue-gray `#8e9eab`, dark gray `#5a5852`; window `#c9d3da/#8fa3b3/#e4e6e2/#6f8597/#b4c1cb/#5f7385`; dress `#6a7a8b`, sleeves `#3c4857` (must be darker than the dress or the cup-holding arm disappears into its facets), skin `#e2cfae`, blond hair `#c9a256`; cat `#c8773a`/`#e8dfc9`.

## Pitfalls (important)
- **Nondeterminism: the first frame differs from later ones.** Two first-frame-only causes combine: ① the first draw to an offscreen layer needing `getImageData` uses the GPU; after readback Chrome switches to CPU rasterization, changing antialiasing → centroid samples → triangle colors; ② more significantly, offscreen context state (`lineJoin='round'` in facetize, `lineCap='round'` in segs) persists into the next frame, whereas the first uses default miter/butt. Fix: create layers with `getContext('2d',{willReadFrequently:true})`; **begin every frame with `g.reset()` (clears pixels and state), not `clearRect`**. Comparing hashes of three consecutive renders at the same lt exposed it.
- Faceting at cell 34 covers the body in small triangles, like a low-poly 3D model rather than Cubism; 58 gives large light/dark planes.
- The first finer hair pass used a circular clip and turned half the face gold; the color-filtering `only` fixed it.

## Further improvements
- The girl's overall outline still uses realistic RIG curves; faceting changes only the edge. A fuller solution would replace shoulders, elbows, and knees with a polyline skeleton before faceting.
- The reference is darker with stronger contrast (more large dark-brown planes); this version is brighter.
