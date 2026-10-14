# 34_shadowpuppet · Chinese Shadow Puppetry

[中文](../../风格配方/34_shadowpuppet.md) · **English**

> Source: Migration Test D (stand-alone agent working read-only from skill, 2026-10-04). Scene code ported after integration to `scripts/engine/scenes/34_shadowpuppet.js`.

Experimental filename: `scenes/r3_piying.js`; ~121 ms per frame (each puppet piece has its own offscreen canvas; many `multiply` passes).

**Pipeline**: shadow screen (radial warm glow of an oil lamp behind the screen + `screen` wick hotspot + 3 px cloth texture, cloth texture cached) → prop layer (window lattice, table, flower vase, chair with straight back, cached) → butterfly → cat → girl, each group on its own offscreen layer → each layer first stamps a shifted soft shadow, then `multiply` composites the piece → rivets → control rods → wooden frame.

**Key parameters**
- Puppet-piece function `piece(g, path, col, carve)`:
  - Fill with colour.
  - Carve patterns inside the clip with `destination-out`.
  - Draw same-colour "leather edge" at 2×edge width inside the clip, ensuring carved patterns do not cut through the outer contour.
  - Outline with 2.6 px dark-brown `#3a160a`.
- Carving pattern library:
  - Fish-roe dots `dots`: s14–22, r3–3.5.
  - Rosette flowers `flowers`: 5 petal ellipses, s36–46.
  - Cloud scrolls `clouds`: Archimedean mini-spirals, stroke width 3.4, s24–40.
  - Lattice grid `lattice`: s26–32.
  - Incised lines `lines`: stroke width 3–7.
- Stamping onto the screen: `stamp(layer)` first composites `multiply` α0.28, blur 6 px, offset (7,5) — the ghost shadow of a puppet piece not pressed flat against the screen — then composites the piece itself with `multiply`. Transmitted light = screen colour × piece colour; overlapping pieces naturally deepen.
- Colours: red `#c0352a`, green `#2f7d4c`, amber `#d99a2e` (golden hair = amber-toned leather), yellow `#e2bd4a`, blue `#2c5a8a`, orange `#d9782a` (cat).
- Screen: radial `#fff6d6 → #f2d7a0 → #cf9a58 → #7a4a20`; lamp-flame disturbance `fl = 0.5·noise(3ts) + 0.3·noise(9ts)`, ts stepped at 15 fps. Light centre drifts ±26/±18 px; hotspot radius 260+40·fl.
- Female character's "blank face": after drawing the hair, remove the entire face area with `destination-out`, leaving only the face outline; then add phoenix eyes (upswept long line + lower eyelid + eye dot), willow-leaf eyebrows, lip dot.
- Orange-white cat mapping: orange = orange leather; white chest, white muzzle and nose, white legs and paws = **entire areas left as silhouette cut-through, retaining only the leather edge**; tiger stripes = incised lines. This rule applies to all silhouette/cut-through style recipes: white areas are simply cut out.
- Motion:
  - Girl's whole body sways ±0.012 rad around (1260,930); head rotates ±0.06 around the neck rivet.
  - Cup-raising stepped at 10 fps.
  - Relaxed wrist: `dangle = 0.35·sin(11·ls)·(1 − 0.6·cup)`, cup moves with the hand.
  - Cat's head nods `0.1·sin(6ts) + 0.05`.
  - Tail has 4 links; each link rotates `0.3·sin(7ts − 0.9i) + 0.38` relative to the previous; the tip lags, link by link.
  - Hair ornament pendant strand swings.
- Rods: 5 px dark-brown lines, blur 1.2 px `multiply`, running from the neck, wrists, cat's back, cat's head, and butterfly down to the bottom edge of the frame.

**Motif animation**: lamp flame makes the entire screen's light spot jump, butterfly (wings flip face/back using `scaleX` at 12 fps, with rods), wrist sway, cat's nodding and whip-tip tail, hair ornament swinging. Motion area 6.8%.

**Pitfalls**
- Table leg over the skirt: after `multiply`, red×green approaches black, creating a black trapezoid. Overlap deepening is correct for shadow puppetry, but don't place the overlap at the visual focal point — just shift the table legs.
- Cat's front legs in the first version were a solid orange rectangle, covering the white chest; changed to two almost fully cut-through white legs for the "orange-white" reading.
- Rods crossing the main figure will look cluttered: run rods from the puppet downward and outward, not crossing other characters.
