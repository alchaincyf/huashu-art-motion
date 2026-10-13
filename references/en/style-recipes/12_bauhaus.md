# 12_bauhaus · 1923 Bauhaus poster

[中文](../../风格配方/12_bauhaus.md) · **English**

File: `scenes/12_bauhaus.js` (about 210 lines). Performance: warm average 5ms, maximum 9.5ms, first frame ≈85ms; determinism passes; lt 0.34→0.46 motion difference: 4.9% of pixels (black rod, grid window, concentric arcs, cat, ball, and puppet all move). On-screen duration 0.47s (T11 blue-square/red-circle/yellow-triangle/circular-hole transition 0.20s, origin (1330,590), approximately the red circle's center).

## Pipeline
1. **Fully cached background `bh_bg`**: aged cream paper `#ebe3cf` + enlarged 320×180 fbm at α0.5 (aged mottling) + fine diagonal line (40,170)→(1900,840) (behind the window) + upper-left black horizontal bar (60,61,256,13), red vertical bar (292,105,24,468) + vertical bauhaus (`Poppins-800` 210px, after `rotate(-π/2)` scale horizontally to exactly 820px long, origin (262,1000), read bottom-to-top) + small gray squares + floor line (345,898)-(1860,915) + yellow right triangle + katze (Poppins-800 150px, red `#d3262b`) + two lower-right Poppins-600 31px lines + black tabletop/chrome tubular legs (three-color linear gradient) + Breuer cantilever chair (same path stroked 15px dark gray / 10px chrome / 3px highlight offset 2px) + two grain layers (dark dots density 0.02 α0.35, old printing ink blotches).
2. Separately cache the red circle at 520²: base color + `source-atop` fbm light mottling α0.55, imitating uneven screen-print/lithographic ink.
3. Characters and composition are all geometric: no curved outlines, only circles, squares, triangles, and thick rods.

## Motif motion
- **Long diagonal black rod rotates like a pointer**: measured angles from the reference (frames 575–579 28°, 581 33°, 583 37°, 585 42°, 587 46°, 591 49.5°) become `deg = 28 + 21.5·easeOut(clamp((lt-0.26)/0.22))`. Pivot = hub center (1125,195) (confirmed against frames 576/590: hub stays still, lower end sweeps down), 27px rod from -432 to +150, fine parallel line offset 30px, short red rod offset -30px; inner hub arcs rotate too.
- **Cycling Mondrian grid window**: 4×4 grid (inner frame 366..794 × 126..561, cells 100×101, gaps 9.5), six cells cycle at 13fps `step=floor(lt·13)`, each with a different phase, changing only when `(step+2·sw)%9 < 6` (not every beat, avoiding mechanical rhythm); cycle only red/yellow/blue/cream/light-blue/gray. Keep patterned cells (9px graph paper) and quarter-circle cells.
- **Concentric arcs**: six arcs right of the red circle, start phase wobbling by `sin(9lt-0.7i)·0.05`, radius breathing `±3`, arc length sweeping from 55% to 100% within 0.4s, like sound waves pushing outward.
- **Cup steam**: a 2.2px sine line (26 cycles/170px, `-18t` traveling wave), fading with a linear gradient.
- **Cat taps a rolling ball**: right front paw reaches forward 36px then retracts with `tap = sin(clamp((lt-0.05)/0.16)·π)`; blue ball r31 rolls from x712 to 816 over `lt 0.13→0.47` with easeOut, **rotation = displacement/radius** (white diameter line + dot make rolling visible), two trailing speed lines. Tail = 26px orange arc + same-width dashed dark-orange stripes, angle follows `choreo.tail·0.5`.

## Geometric characters (all anchors from RIG)
- **Schlemmer puppet**: head = r70 circle (`G.A.headC + (14,-18)`); gold geometric hair = rear head sector (-1.95→1.15rad) + forehead triangle + r34 bun + rear semicircular hair piece (`G.A.back`); face = black vertical eye bars (horizontal when blinking), red square cheeks, short black mouth. Whole head rotates around `G.A.neck` by `G.tilt` (tilts back when drinking). Torso = blue trapezoid + rear black trapezoid (moves with breathe); skirt = black r178 sector + blue trapezoid; limbs = thick black round-ended rods, joints = cream discs + 5px black rings + black center dots. Near arm directly uses `G.A.shoulder/elbow/hand` (RIG IK holding cup); far arm lies on the table (matching the reference's hand reaching toward the tabletop).
- **Cat**: r100 circular body ((536,805) inferred from `K.box`, scaled with breathe) + four dark-orange horizontal stripes left (clipped inside circle) + lower-right cream sector (orange/white planes); head = 104 square (`K.headC + (14,48)`, rotating slightly ±0.08rad with tail phase) + yellow triangular ears + cream lower face + dark-orange forehead stripe; eyes = white circles + black vertical pupils.

## Palette
Paper `#ebe3cf`; black `#161514`; red `#d3262b`; blue `#2a58b4`; yellow `#efc12f`; light blue `#b9cee0`/`#a6c0da`; gray `#c6c3bb`; cream `#f2ecdf`; orange `#ee8a2a`/`#c25a14`; chrome `#c9c9c6`.

## Pitfalls
- Initial cells were calculated at 107px, overflowing the black frame by 16px on the right; derive cell size from inner-frame width minus three gaps.
- Black was initially a cycling color; a black cell suddenly made the window heavy, like a broken cell. Remove it.
- The puppet's mouth initially copied the reference's long black bar extending outside the head, looking like a cigarette on the girl; replace it with a short line inside the head.

## Further improvements
- The cat's head/body were moved downward relative to the RIG skeleton (so the square head sits on the circular body), putting the head about 50px away from its position in adjacent eras during transitions.
