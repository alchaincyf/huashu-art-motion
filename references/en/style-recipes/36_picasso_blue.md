# 36_picasso_blue · 1903 Picasso's Blue Period

[中文](../../风格配方/36_picasso_blue.md) · **English**

> Source: migration test D (implemented by an independent agent reading only the skill, 2026-10-04). Integrated scene code was ported to `scripts/engine/scenes/36_picasso_blue.js`.

Experimental filename: `scenes/r5_bluepicasso.js`, about 24ms per frame.

**Pipeline**: monochrome-blue flat underpainting (walls, floor, night sea and moon outside) → repaint broad dry strokes, blur 7px and overlay 80% → faint fine dry-brush strands → copy window frame back intact, add small strokes → separate table layer → thick environment contours (no jitter) → waves, moonlight fragments, clouds → elongated characters → small character strokes + cool-light gradient → visibleLines thick contours → shawl folds → slow steam → canvas texture + cool vignette.

**Key parameters**
- Palette: #132240 / #1d3866 / #2d5a94 / #6b8fb6 / #b6c8d8 / blue-gray #3b6878, strictly monochrome.
- Orange/white cat separated by brightness: orange = medium blue #4f719a, tabby #273f66, white = pale blue #b6c8d8. Blond = brightest blue-gray #cbd8e0, skin #90a9be; hair one step brighter than skin to read as blond.
- Wall strokes: cell34, len110, w34, jitter four, vertical ±0.5·noise(0.003); palette mixBase 0.8; then blur 7px, overlay α0.8. Floor same parameters, horizontal.
- Fine dry-brush strands: 900, α0.07, lengths 30–90.
- Elongation: girl `DOMMatrix().translate(1240,932).scale(0.84,1.12)`, pivot at feet; cat scale(0.82,1.14), pivot (540,905). Same matrix in three places: Path2D.addPath, offscreen setTransform, setTransform in visibleLines callback.
- Shawl: from forehead/headTop over nape and back to waist+70, color #6b8fb6, fold lines rgba(20,40,80,.6) 4px. Long fingers: three slender 22×4.5 ellipses around cup.
- Contour: Prussian blue #0c1830, 5px, no boil. Blue Period contours are assured, should not jitter.
- Slowness: breathe sin(1.8t)·0.026 (about twice shared choreo amplitude, 0.45× frequency); cup lifting 1.25s (shared choreo 0.9s); steam rises at 0.5× time.

**Motif motion**: sea waves drift horizontally (closer means faster, speed 20 + 0.25·(y − 400)), 14 moonlight fragments twinkle, a pale long cloud crosses moon, slow breathing (girl and cat), cup lifting, steam. Motion area 3.2%.

**Pitfalls**
- First version retained some ochre on cat/hair (inspired by *The Old Guitarist*); independent review found it broke monochrome. Blue Period should be all blue, separated by brightness.
- cell16, len40, w14 vertical wall strokes read as rain/blanket, Impressionism rather than Blue Period. Use broad, long, low-contrast strokes, then blur.
- Dense round brush ends form ranks of heads (see ② item 11). A 7px blur suppresses it; proper fix requires a cap parameter in strokes.
- Excluding table with a rectangular mask from broad strokes leaves a flat rectangular patch on the floor. Draw table separately after brushstrokes rather than cutting a hole in them.
