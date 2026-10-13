# 13_pop · 1962 Pop Art (Lichtenstein comic panel + Warhol four-panel grid)

[中文](../../风格配方/13_pop.md) · **English**

File: `scenes/13_pop.js` (about 230 lines). Performance: warm average 6ms, maximum 9ms, first frame ≈45ms; determinism passes; lt 0.34→0.46 motion difference: 11.6% of pixels. On-screen duration 0.47s (T12 yellow-lightning halftone transition 0.16s).

## Pipeline
1. **Ben-Day dots = `createPattern`, zero cost**: a pitch×pitch tile with circles at four corners and center makes a 45° grid (diagonal spacing pitch/√2). Walls: pitch 24, r5.6, blue `#2f5cc8` on white (diagonal 17px, matching the reference's FFT-measured 17px period); skin: pitch 13, r3.3, red `#e2483c` on skin `#fae0cc`; yellow floor: pitch 14 r2.2 α0.18, faint printed dots. Skin uses `fillStyle = pattern; fill(path)`, two orders of magnitude faster than `PAINT.halftone` (per-dot getImageData); patterns align to screen coordinates and do not swim with character movement.
2. **Fully cached background `pop_bg`**: 6px black comic-panel outer frame; white skirting 754–792 (6px black top/bottom lines); yellow floor 796→990/1003 (slightly sloped horizon); red band; MEANWHILE... (`Bangers-400` 46px, yellow background, 5px black border); white Warhol picture frame + blue windowsill line; blue chair; paper grain.
3. **All characters: thick 5px black outlines + flat fills**, one `ink(c, path, fill, lw)` function throughout; short thick white highlight lines; shadows use `hatch()`, clipping black diagonal lines spaced 10px and 3.5px wide inside an ellipse.

## Motif motion
- **Warhol four-panel color cycling**: four palettes (background/face/lower face/eye shadow/lipstick), `step = floor(lt·11)` (about every 5.5 frames; reference changes at 601, 605/606, 612); panel i uses `(i+step)%4`. Cat face = RIG.smooth nine-point head + lower-face ellipse + right black patch (misregistered screen-print shadow) + eye shadow/lipstick/nose/whiskers; two white glass reflections in the upper-right panel.
- **Three thought-bubble dots flash in sequence**: reference dot1 frames 612–615, dot2 614–617, dot3 616–618 → 12-frame loop; dot k is bright when `((f-2k) mod 12) < 4` (r20, hops up 6px), otherwise r12. Bubble = ten circles, all first stroked 11px black then all filled white (the simplest union outline).
- **WIGGLE WIGGLE burst shakes**: 30fps stepped hash jitter ±8px/±6px/±0.03rad; outer white burst (14 points, radii 128/178 with randomness) + inner yellow burst + two lines of `Bangers-400` 82px red text (12px black outline + 4px black shadow); ten surrounding black triangular motion lines pulse in length by `0.85+0.25·sin(40lt+2i)`.
- **Cat wiggles its rear before pouncing**: era-specific deformation using RIG.cat anchors. Crouch: custom ten-point body outline (origin `K.box`), head `K.headC + (22,104)` lowered into the body, white elliptical front paws reach forward. Wiggle: `wig = sin(lt·2π·6)·16` (6Hz, about three times in 0.47s), point weight `clamp((560-x)/140)` gives greater displacement toward the rear and lifts it by `|wig|·0.6`; stripes and tail share the deformation; three curved motion lines beside the rear follow wig.
- **Girl lifts cup**: RIG IK holding cup; cup = white cup + blue diagonal stripes + coffee; steam = two black wavy lines jittering at 14Hz.

## Girl (Lichtenstein)
- Large blond waves: hair mass (19-point smooth, rear-edge bulges `sin(2.1i+4t)·14`) + seven curl circles (r30–48 along rear edge), **stroke all 10px black first, then fill all yellow = union outline**; each curl contains a 4.5px black C arc + dark-gold `#d9a514` arc, giving Lichtenstein's sculptural curls; five black S strands, two white highlights.
- Red Ben-Day dots on all skin (face, neck, hands, legs); red knee-length dress (curved skirt clip, not rectangular) + white highlight strips; two dotted legs + red heels (seven-point polygons); large eyes (white 12×8.5, blue iris r7, highlight) + three thick lashes + brows raised 5px; enlarged red lips.

## Palette
Black `#141414`; paper `#f3eedb`; blue `#2f5cc8`; yellow `#f7d52c`; red `#d8232a`/`#a8161c`; white `#fbf8ee`; skin `#fae0cc` + dots `#e2483c`; blond `#f8d62c`/`#d9a514`; cat `#f39a2c`/`#c4561a`; Warhol backgrounds `#9ccf3a/#e0359a/#2fc0b0/#f08a2a`.

## Pitfalls
- Drawing the cat head at the original RIG position leaves a gap above the crouched body; lower the head about 100px into the body.
- Hair initially was one slightly wavy yellow sheet, looking like draped cloth from afar; Lichtenstein blond hair is recognizable through curl masses + black C arcs.

## Further improvements
- The reference girl has a tear and white collar (classic Lichtenstein crying girl), removed in the design and omitted here too; adding a speech balloon could make it more comic-like.
