# 24_hopper · 1942 Hopper American Realism (Hard-Edged Light Planes)

[中文](../../风格配方/24_hopper.md) · **English**

> Source: Migration Test B (stand-alone agent working read-only from skill, 2026-10-04). Scene code ported after integration to `scripts/engine/scenes/24_hopper.js`.

Experimental filename: `scenes/c3_hopper.js` (~150 lines). Median per-frame 13 ms (first frame 54 ms); frame diff 6.0%.

**Core technique: "dual-version clipping"**: the same `room(g, K)` function paints two cached canvases in two colour schemes — the shadow version `SH` (cool green wall `#5d8679`, dark floor `#5b3d2b`) and the lit version `LT` (warm yellow wall `#efcf8f`, bright floor `#c98b52`). Each frame first draws the shadow version, then clips in the lit version using a moving light-polygon, producing a naturally hard-edged light boundary that can be translated as a unit. The figure and furniture follow the same logic: `girl(c, K, G)` draws once in shadow colours, then clips into the angled light band and draws again in lit colours.

**Light patch geometry** (dx = 30 − 95·easeInOut(lt/1.25), leftward shift ~95 px over 1.2 s)
- Wall light patch WP: (1420+dx, 250) → (1920, 470) → (1920, 730) → (1420+dx, 730)
- Floor light patch FP: continues below the wall patch, fanning out toward lower right
- Figure light band OP: left edge from (1345+dx, 0) to (1185+dx, 1080). This band sweeps across the girl's face during this segment, from half-face in shadow to full-face lit.
- Window-bar shadow: a vertical stripe 24 px wide + a diagonal stripe parallel to the patch's upper edge.
- **Figure's shadow on the wall** = the figure silhouette offset (+150, +18) drawn into an offscreen canvas, then `source-in` composited into the shadow base, then painted back into the lit-patch area. The effect is that the lit patch reveals the shadow-colour wall — in sync with the figure's pose.

**Motif animation**: light patch slowly moves (the core); barber pole on the red-brick building across the street outside (homage to *Early Sunday Morning*), with red-blue stripes scrolling upward at 60 px/s; roller-shade cord swaying `sin(4.2lt)·0.07 rad`; 26 dust motes in the light band (shown only to the right of the light edge); steam.

**Texture**: oil-paint drag strokes use primarily vertically elongated fbm (x·0.06, y·0.006), with a diagonal secondary, generated at 1/4 resolution and scaled up, `soft-light` α 0.2. Each window opening has a 10 px hard shadow on the right side; roller shades drawn to different heights (0.25–0.7) — these are Hopper details.

**Palette**: shadow wall `#5d8679`, wainscot `#4b6d63`, floor `#5b3d2b`; lit wall `#efcf8f`, wainscot `#d8ad68`, floor `#c98b52`; skirt shadow `#7a2c2a` / lit `#cc4a3c`; golden hair shadow `#a8893f` / lit `#f3d67e`; brick `#b4553a`.

**Pitfalls**
- The first version used horizontal fbm at α 0.35 — the wall looked like water-marble. Hopper's walls are flat; brush marks should be barely perceptible.
- Inserting a comment in the middle of a line during a code edit commented out the second half of that line (watch out when using Python batch-replace).

**Character**: the first version used upswept hair + red long skirt; review said "looks like an adult woman, doesn't read as 17." Switching to loose shoulder-length hair (`hair:'long'`) + a blue hair ribbon immediately made her look younger. Cat's white chest uses a smooth ellipse; shadow white `#dcd6c8` (the first version used `#c4bdac`, which read as a grey-white cat).

**Room for improvement**: the cat is entirely in shadow throughout, which is quite dark (a deliberate trade-off for atmosphere). One small patch of light from a rear window could be added.

---
