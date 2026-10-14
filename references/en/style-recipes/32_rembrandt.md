# 32_rembrandt · 1642 Rembrandt Chiaroscuro

[中文](../../风格配方/32_rembrandt.md) · **English**

> Source: Migration Test D (stand-alone agent working read-only from skill, 2026-10-04). Scene code ported after integration to `scripts/engine/scenes/32_rembrandt.js`.

Experimental filename: `scenes/r1_rembrandt.js`; ~47 ms per frame.

**Pipeline**: lit base draft (room, leaded-diamond window, Turkish table carpet drawn at "fully lit" colours) → wide brown brush strokes repaint the background, then blurred 2.2 px × 75% blend (worked-up ground) → table carpet as its own layer with fine strokes → character flat fill + volumetric gradient + fine strokes → character "lost-edge" treatment → **lighting map `multiply`** → window glass `screen` brightening + cloud shadow drifting → impasto bristle strokes → candle flame, light-column floating dust, steam → crackle, grain, vignette cached layer + `soft-light` gold-brown glaze.

**Key parameters**
- Lighting map: base colour rgb(30,21,13), equivalent to ambient light 0.13. Composited with `lighter`:
  - Light column: wedge polygon, blur 40 px, cached, α 0.8–0.95.
  - Window itself: r330.
  - Face pool: r250 α0.95. Chest: r230 α0.55. Cat: r240 α0.8. Tabletop: r280 α0.6.
  - Candlelight: r190+40·fc, α 0.6+0.4·fc.
  - "Separation light" on the wall behind the girl: r300 α0.35. Rembrandt often brightens the wall on the dark side of a figure to separate them from the background.
  - Whole-frame `multiply` applied after compositing.
- Flicker: `flick(t) = 0.5·noise(2.2t) + 0.25·noise(6.5t)`; light-pool centre drifts ±14 px by `noise(0.9t)`; cloud shadow `cloud = 0.5 + 0.5·sin(2.2t − 0.6)` makes window light ×(1 − 0.35·cloud), while a dark radial blot crosses the glass at 260 px/s.
- Background brush strokes: cell18, len54, w16, jitter 6, angle −0.9 + 1.6·noise(0.003); palette mixBase 0.7.
- Lost edge: the character layer is first drawn at blur(2.4 px) fully opaque, then a clear α0.62 layer is composited on top. Dark edges blend into the background; facial features remain legible.
- Impasto bristle stroke (bristle brush): one stroke = round(w/1.3) parallel thin bristles; each with ±17 brightness, both ends randomly shortened 0–25%, stroke width 1.4–2.6; a shadow bristle α0.28 below; 2+w/3 bright highlight dots above. Used only on lit areas: golden hair, collar, porcelain cup, pearls, cat's white chest, cat's head top.
- Overlay layer: crackle α0.28×0.28; grain density 0.05 α0.12; vignette 0.75; `soft-light` rgba(200,140,60,.35).

**Motif animation**: candle flame (noise-driven lateral tilt, height flicker), window light dimmed by cloud shadow and recovered, 70 dust motes in the light column (shown only inside the column, flashing every 24 frames), cup-raising, steam. Motion area 8.0% (0.45↔1.0 s).

**Pitfalls**
- The first version of the impasto rendered as "dark offset + main stroke + bright ridge" — three clean parallel lines, reading as white sticker / band-aid. Switching to bristle strokes finally looked like paint.
- Copying a local region back from an offscreen canvas (`drawImage(b, x,y,w,h…)`) pulls in unpainted background along with it, creating a rectangular patch. Props should be drawn on their own layer after the brush strokes — do not copy regions.
- Grain density 0.12 / α0.22 puts specks all over the face; 0.05 / 0.12 is just right.
- The hand must be drawn before the cup, otherwise the hand's ellipse covers the porcelain. In `drawGirl`, the order is "hand → cup → thumb"; keep this order when redrawing.
