# 06_renaissance · 1503 High Renaissance (Leonardo Style)

[中文](../../风格配方/06_renaissance.md) · **English**

16–37ms per frame (median 16ms).

## Pipeline
1. Static layer `ren_static`: draw the room on the original canvas first, then draw the entire layer into the cache with `filter: blur(1.3px)` — equivalent to a full-frame sfumato pass. Room contents:
   - Wall: P.texture #43321f→#22180e, radial gradient for window light glow, top darkened.
   - Window: semicircular arched window, stone frame lit from the left, distant landscape in the window opening.
   - Floor tiles: perspective chessboard. Computed by true projection: `y = 420 + f·h/Z`, `x = 960 + f·X/Z`, f=1029, h=5.75, Z from 16 forward, 1.4 per tile. First row at y=790, then 825/868/922/989 successively — matching the original's row spacing. Tile colors `#a88c64` and `#5c2418`, plus a soft-light light pool layer and a darkening radial gradient around the edges (centered at 760,960).
   - Square table with white cloth, ladder-back chair.
2. Distant landscape (aerial perspective): three mountain layers, increasingly blue and faint with distance (#9fb4b8 → #7d9294), outlines from fbm. Then a lake, river valley (transitioning from grey-green to warm ochre), winding silver river (width 3→16px with distance), cypress and round trees, stone bridge.
3. Each frame draws in order: river-surface sparkle (24 light points drifting downstream, flickering) → birds → ornithopter (all three clipped inside window opening) → character layer → light column and dust motes → overlay layer.
4. Overlay layer `ren_over` (cached, one `drawImage`):
   - Vignette: α0.3 at 0.55, α0.8 at edges.
   - Yellow glaze: α0.07.
   - Canvas weave: one line every 3px.
   - Oil-paint impasto texture: 9000 strokes, α0.022/0.028, line width 5–10, random direction.
   - Craquelure: P.craquelure at α0.32; then `brightness(0) invert(1)` turns it into white lines, offset 1px, α0.16, `lighter` composite — simulates the bright edge of lifted lacquer.

## Sfumato
Characters drawn first into off-screen layer `renChars`, processing only the region (320,180,1200,780). Composited back to main frame in two passes: first `blur(2.6px)` fully opaque, then overlaid with an α0.38 sharp layer. Edges are soft, features still recognizable. Characters have no outlines; all volume is from gradients:
- Dress folds: bright folds rgba(200,70,60,.3), dark folds rgba(40,0,0,.45).
- Velvet sleeves: a rgba(170,200,140,.45) light band drawn along the skeleton direction.
- Face: left-side illumination gradient, eye-socket shadow added.

## Motif Animation
- Ornithopter: 0–1.35s from x=470 to 740, simultaneous vertical bobbing and slight pitch. Two bat-wing flaps per `up = 0.5+0.5·sin(t·12+phase)`, wingtip range −118 to +24px. Far wing scaled to 0.78, color darkened, phase offset 0.5. Wing construction: leading-edge beam + 6 radiating ribs + scalloped trailing membrane, tail also moving. First version was a flat "paper plane" — unrecognizable as Leonardo's ornithopter; redrawing with rib-fan wings made it identifiable.
- Light column: wedge shape drawn into cache once with `blur(28px)`, each frame composited with screen blend. First version drew the polygon directly every frame — two hard edges looked fake. 46 dust motes slowly floating up through the light column, flickering.
- Girl drinks from a silver cup following choreography; eyes close when cup>0.7. Cat smiles with half-closed eyes all the time, tail swaying.

## Pitfalls
- First version oil-paint texture: 26000 strokes, α0.05, direction following noise — the entire wall looked like Van Gogh's swirls (post-impressionist). Reduced to 9000 strokes, α0.025, random direction — restored classical oil-painting feel.
- Cat body inner-edge darkening used 26px α0.45 — the off-white body looked like a glass dome. Changed to 14px α0.22; the white chest changed to a radial gradient blending in the orange fur without a hard edge.
- Floor tiles first version too bright and high-contrast, looked like vector illustration. Must darken the surroundings, leaving only the light pool illuminated by the window.

## v2 Rework (film review: too static 0.20 vs. 0.46; main characters blurred, window exterior sharp — inverted depth of field)
- Sfumato changed to: blur layer 1.6px (was 2.6), sharp layer α0.82 (was 0.38). Soft edges preserved; features and outlines clear.
- Ornithopter scaled 1.6×, flight path 440→790, pitch amplitude ±0.07; birds increased to 14, scaled 1–1.8×.
- Cat: head tilts and nuzzles ±0.16rad around the neck, squinting alternates, tail ×2.2, breathing ×3, look turns head. Girl: hair tips sway ±11px, sip ×1.6.
- Window exterior: cloud shadow sweeps the river valley; light column brightness varies 0.75±0.35 as "clouds pass the sun"; dust motes 70.
- Static-segment frame diff: 0.20 (film review spec) / 0.30 (my measurement) → 0.37. Original 0.43.
