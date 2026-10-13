# 25_ghibli · 1988 Studio Ghibli Hand-Painted Watercolour Background Art

[中文](../../风格配方/25_ghibli.md) · **English**

> Source: Migration Test B (stand-alone agent working read-only from skill, 2026-10-04). Scene code ported after integration to `scripts/engine/scenes/25_ghibli.js`.

Experimental filename: `scenes/c4_ghibli.js` (~270 lines). Median per-frame 17 ms; **first frame 619 ms** (watercolour base cached); frame diff 5.1%.

**Watercolour renderer**
- `deform(pts, depth, amp, r)`: midpoint displacement. Each pass pushes each edge's midpoint along its normal by an approximately Gaussian amount (sum of 3 uniform numbers), amplitude proportional to edge length (min(1, len/80)), amp×0.6 per pass.
- `wash(g, pts, color, {layers, alpha, amp, seed, edge, blend, fill})`: starts with `deform` 3 passes for the base shape; each layer then `deform`s 2 more passes, fills with `multiply` at low α (transparent paint layering), and traces a 1.6 px same-colour border at `α=edge`. Borders accumulate layer by layer, creating the **watercolour bloom edge** of pigment settling at the boundary. `fill` can take a gradient (sky, walls).
- Common parameters: large wall areas — layers 5, α 0.4, amp 12; colour bloom — layers 3, α 0.045, amp 40 (heavy deformation); wood planks — layers 3, α 0.5, amp 3, edge 0.14; opaque white (window frame, tablecloth, clouds) — `blend:'source-over'`, α 0.9–0.95.
- Wall = radial-gradient wash (bright near window `#fbf3e0` → corner `#dcc49a`) + 28 large-deformation transparent colour blooms (warm yellow, pink, blue-grey, light green alternating) + two corner dark blooms. Wainscot and floor painted **plank by plank** in varied washes. Finally `multiply` α 0.3 for a high-frequency paper-grain texture.
- Clouds: opaque white round puffs (16 puffs, washed edges) + `source-atop` blue-grey gradient on the bottom half, cached as sprites. The large camphor tree is also a sprite, rocking ±0.025 rad around the root.

**Cel-shading character `cel(c, p, base, shade, dx, dy)`**: fills the full shadow colour first, then clips into `clip(p)` and shifts the base colour by (−dx, −dy) toward the light, leaving just a crescent shadow on the back-lit side. Finally outlined with 2.4 px warm-brown `#4a3428`. One function = Ghibli-style two-tone cel shading.

**Motif animation**
- White sheer curtains: two panels, hem billowing `q²·(90 + 70·gust)`, gust = 0.55 + 0.45·sin(3.2lt + phase), plus `sin(7lt + 6q)` fine ripple; 3 semi-transparent wash layers, fixed seeds, so the edges don't boil.
- 360 grass blades outside the window: wind comes in gusts, `wind = 0.5 + 0.5·sin(3.1t − 0.018x)`, phase advancing along x so a wave visibly sweeps across the grass slope.
- Clouds drift 22–30 px/s; tree crown gently sways; 34 komorebi (dappled sunlight) patches on the wall (`screen` warm-yellow radial gradients, positions drifting with noise, brightness `sin(5t + 1.7i)` flickering); daisy on the table nodding; girl's long hair blown to the right and back by wind (7-point smooth, pushed by wind); red bow ribbon flutters; tablecloth hem sways.

**Character**: long golden hair + large red bow (homage to Kiki's Delivery Service, not copying the character), teal long dress + white apron + white cuffs; cat is warm orange + off-white cel shading. The broom leaning against the wall in the background is an easter egg.
**Watercolour fill for the character**: review said "background looks right, figure doesn't (flat vector)." Fixed by first drawing the character into offscreen layer L, then creating a texture layer M (paper-grain particles α 0.8 + 40 transparent colour blooms `charBloom`, α 0.1, amp 16), cropping M with `destination-in` to the character's silhouette from L, then compositing with `multiply`. Line colour softened from `#4a3428` to `#6a4a38`.
**Curtains**: review said they didn't billow. gust frequency 3.2 → 5.4, billow `q²·(60 + 150·gust)`.

**Pitfalls**
- Colour bloom α 0.07×4 layers + grain `multiply` 0.5 turned the wall into mouldy old parchment. Ghibli rooms are bright: reduce bloom α to 0.045×3 layers, and lighten the gradient by one stop.
- The first version used two rectangular wash patches side by side for the wall (right side darker); a hard seam appeared at x≈1100. Dark areas need large-deformation polygons (amp 60) — not rectangles.

**Room for improvement**: the figure is still flat; Ghibli-style block highlights on the hair could help; the curtain shadow flowing on the floor light patch could be added.

---
