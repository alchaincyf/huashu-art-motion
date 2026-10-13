# 08_impressionism · 1874 Impressionism (Monet)

[中文](../../风格配方/08_impressionism.md) · **English**

65–76ms per frame (median 69ms). Main cost is two full-frame `P.strokes` passes plus one character stroke pass.

## Pipeline (following the 09_postimp reference)
1. Flat-color draft `impBase`, redrawn every frame because poppies, clouds, flower bouquet, and potted plant are all moving:
   - Pink-purple wall (#d8bede→#f0c8cc→#f2c4d4), warm-yellow sunlight radial gradient r=900 overlaid at top-right.
   - Garden outside the window: sky, tree line, red-roofed house, lawn, 70 poppies (stem base fixed, flowerhead swaying horizontally `sin(t·3.2+ph+x·.02)·(6+r·.6)`), woman with parasol and child (homage to *Poppies*), flower beds.
   - White window frame, pale-purple curtain, *Impression, Sunrise* on the wall, round table with white-purple tablecloth, vase, teapot, right-side potted plant (whole foliage mass swaying `sin(t·1.9)·8`).
2. Stroke passes, **two**:
   - Main frame: cell 11, len 20, width 7, outline 0, jitterCol 26, using mask to exclude window scene and small painting on wall.
   - Window scene and *Sunrise*: cell 6, len 11, width 4.5, only inside mask.
   - First version had only one coarse-brush pass — the outdoor house, parasol woman, and *Sunrise* were all smeared. Splitting into two passes with *Sunrise* changed to horizontal water-wave strokes made everything readable.
   - Canvas pre-filled with #f2e6ee; gaps between strokes reveal the light-colored base.
3. Direction field: wall tilts upper-right (sunlit zone −0.95 rad, rest −0.55, plus ±0.55 noise); floor near-horizontal; curtain and tablecloth vertical; potted plant radiates outward from pot rim; sky horizontal.
4. Area palette `P.swatch` (mixBase 0.3–0.45): wall 9 pink-purple-yellow colors; sunlit wall 7 cream-yellow; floor 7 rose-orange-purple; sky, lawn green, pale-purple curtain, blue-purple tablecloth each in their own group. White window frame judged by `col > (240,236,225)`, mixed back to white — otherwise it would be painted in wall color and vanish. Poppy red returns null, preserving draft's original color.
5. Characters: first draw flat with `RIG.drawCat` / `RIG.drawGirl` fill mode, then run `P.strokes` on the character layer with `source-atop` (cell 7, len 13) — strokes only inside the characters. White dress uses white/pale-purple/cream-yellow for color sampling. Then only touch up facial features with pale-purple fine lines; Impressionism doesn't outline.
   - Straw hat, blue ribbon, waist-sash ribbon — all fluttering.
   - `pal.line` must be set to hair-gold: even with lw=0, drawGirl's locks, lid, and similar parts use pal.line for outlining; the default dark blue leaves a black streak beside the face. Same for cat: set `line`/`whisker`.

## Motif Animation
- **Sunlight patch flickering and drifting**: 26 patches (6 on tabletop, 20 on floor). Each patch's intensity is `0.5+0.5·sin(t·sp+ph)·sin(t·sp·0.53+2ph)`, clamped — irregular on/off rhythm. Patches slowly drift ±10px horizontally. Each patch is 40 bright-yellow/white short strokes, seed changed at 8fps to boil. First version: screen blend α0.75 — nearly invisible on the pink base; changed to source-over α0.95 — bright enough.
- 60 diagonal bright strokes in the sunlit wall zone, seed changed at 6fps for flickering.
- Cat fur highlights: 60 candidate points, limited to the left half of cat body and head (illuminated side) via `isPointInPath`, flicker on/off by `sin(t·7+h·30)`.
- Full frame boiling at 8fps, steam white.

## Performance
Two full-frame stroke passes plus one character pass, ~69ms. During transition the engine draws the previous and next eras simultaneously; 08→09 totals ~69+110ms, exceeding 150ms — but this only occurs in those few transition frames.

## v2 Rework (film review: entire frame repainting strokes every 7–8 frames, frame diff 18)
- All stroke positions fixed: `boil: 0`. **Fixing the seed alone is not enough**: P.strokes random numbers are a sequential stream; when palette returns null, jitter consumes 3 extra numbers — and whether null is returned depends on the draft color. The moment a poppy sways or the potted plant moves, all subsequent cell strokes are globally reshuffled. `stable(palette)` wrapper: each cell consumes exactly 1 number, never returns null.
- Character strokes no longer use alphaMask (a moved cup changes skipped cells, reshuffling the whole layer); changed to a custom loop: each cell random number uses `U.hash(i,j)`. Also cuts per-frame time from 115ms back to 72ms.
- "Life" now carried by local motion: light patches drift ±44px, on/off frequency 5–11; poppies' amplitude increased to 10+; clouds drift 45px/s; curtain and potted plant sway; outdoor flower strokes rotate ±0.22rad with the wind; cat tail swing (×2.2), head turn (look).
- Static-segment frame diff (480×270, counter masked, transition frames at segment end removed): v1 mean 4.14 / peak 20.5 — strobing; v2 mean 0.57 / peak 1.9. Original 0.77.
