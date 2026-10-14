# 19_munch · Munch's *The Scream* — Expressionism (1893)

[中文](../../风格配方/19_munch.md) · **English**

> Source: Migration Test A (stand-alone agent working read-only from skill, 2026-10-04). Scene code ported after integration to `scripts/engine/scenes/19_munch.js`.

Experimental filename: `scenes/03_munch.js` (~160 lines). Median adjacent-frame diff 2.27%; JS-side per-frame ~90–140 ms.

**Flow-line renderer `flowLines` (new)**
- Seeds: 24 px jitter grid, ~3 600 points. Each seed determines its region (sky, fjord, mountain, wall, floor).
- Integrated along a "direction field that twists over time"; per-region parameters [steps, step, width, α]:
  - Final: sky [32,7,10,.78], fjord [26,6,9,.78], wall [42,7,13,.5], floor [32,8,12,.55], with 0–8 extra random steps per stroke.
  - One stroke travels 200–300 px.
  - History: the second version used [26,6,7,.85]; independent review still called it "Van Gogh at first glance," so strokes were lengthened, widened, and made less opaque.
- A stroke stops when it leaves its region, so region boundaries are clean.
- **No outline, semi-transparent colour layering**: Munch paints thin, long strokes. The first version copied Van Gogh's "dark outline," turning the wall into segments of short caterpillar strokes — unmistakably Van Gogh. Removing the outline and increasing steps from 10 to 26 fixed it.
- The same-hue flat fill (wall shading from `#a8401e` to `#5a1a14`) is laid underneath, so what shows through gaps between strokes is the same colour family, not black.

**Direction field**
- Sky: `0.55·sin(x·.011 + y·.018 − 2.4t)`;
- Fjord: tangent around (620, 470);
- Wall: vertical ±0.5 sine twist;
- Floor: pointing toward vanishing point (1000, 640).

**Blood-red sky**
- Seeds choose their colour band by "wave-distorted y": `yy = y + 22·sin(x·.014 − 2.2t)`, band width 28 px.
- 7-colour cycle: `#e2541c #f08a24 #f4c03a #c8301e #e8743a #f6a63a #b82a1e`.
- The bands themselves twist — that is "the sky flowing."

**The whole world flows**
The entire frame is then row-shifted by `9·sin(y·.012 + 4.2t) + 4·sin(y·.031 − 6t)` and column-shifted by `6·sin(x·.009 − 3.6t)`, 4 px wide, using `KIT.warpRows / warpCols`. The figure, cat, and table all sway together — far cheaper than drawing individually wobbling lines.

**Motif**
- Window: diagonal bridge planks, three railings (warping with the world), two hat-wearing figures in the distance.
- Screamer: skull face, hands pressed to cheeks, mouth opens and closes `7+2sin(9t)`, body sways `sin(3.2t)·0.12`.
- Table and chair legs are trembling wave lines.
- Girl: 1890s Norwegian dark long dress + white collar, yellow-green facial tint (blur-8 `rgba(120,150,70,.4)`), 9 strands of long golden hair as a travelling wave `sin(9q − 7t)`.
- Cat's mouth is slightly open, as if infected by the scream from offscreen.

**Annotation label**: text rendered to an offscreen canvas, then row-shifted by a sine. Do not use Kalam or similar comic handwriting fonts (review flagged them as breaking immersion); use IMFellEnglish instead.

**Pitfalls**
- After row/column warping the full frame, dark gaps appear at the left and right edges. `KIT.warpRows/warpCols` gained a `margin` parameter: each row is stretched by an extra 2×margin pixels; `margin` must be ≥ the maximum displacement.
- In line-art mode the raised arm passes through the torso's lines; use `KIT.nearArm` to repaint over it (see ②-16).
