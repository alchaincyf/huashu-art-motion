# Era Author Spec (Pure-Code Drawing)

[中文](时代作者规范.md) · **English**

> This is the author spec for replicating the Art History Speedrun film. The composition coordinates and character settings below apply only to that film and similar speedrun/long-scroll films. For the general-purpose version see `references/en/08-style-author-spec.md`; for new subjects you must re-compose from scratch.

Each era you are responsible for = one file `scenes/<id>.js`, registered as:

```js
SCENES['<id>'] = { draw(c, lt, t) { /* fill 1920x1080 */ } };
```

- `c`: target 2D context; `lt`: segment-local time (seconds, counting from the start of this era's transition, may be slightly larger than the segment duration); `t`: full-film time.
- **Do not draw the year badge** (the engine draws 1500–1890 × 40–210 in the top-right corner) — leave that area as background, no important elements there.
- **Do not modify `lib/`, `engine.js`, `eras.js`, `transitions.js`, or anyone else's scene files**. Write any utility functions you need in your own file.

## Available libraries (read the source first)
- `lib/paint.js` → `PAINT`: noise/fbm, texture/grain/craquelure, hand-drawn lines roughPath/boilSeed,
  style renderers strokes (flow-field brush strokes, supports per-region palette)/dabs/mosaic/halftone/pixelate/facets, `swatch` color group, `choreo` shared choreography, steam, particles, `scratch(key)` off-screen canvas.
- `lib/rig.js` → `RIG`: `RIG.girl(opt)` girl skeleton (seated side-on facing left, returns per-part Path2D + anchor points `G.A`), `RIG.drawGirl(c,G,pal)` (pal.mode can be fill/line),
  `RIG.cat(opt)` orange-and-white cat skeleton (seated facing right), `RIG.drawCat(c,K,pal)`, `RIG.drawCup`, `RIG.smooth(points)` smooth curve, `RIG.taper` tapered limb, `RIG.ik2`.
- **Reference implementation: `scenes/09_postimp.js` (Van Gogh)** — study its structure: flat-color draft → style renderer redraw (per-region palette) → character flat fill + fine brush strokes → linework pass → animated highlights.

## Hard requirements
1. **Same scene skeleton**: standard composition — window (350,120)-(810,560), cat seated on floor (390,610)-(690,905), table (810,620)-(1200,905), figure (1120,200)-(1500,910). Every era in the original film is aligned to this layout; transitions depend on it.
2. **Characters**: the figure is a 17-year-old European blonde girl wearing **period-appropriate girlswear** (modest clothing); the cat is an **orange-and-white cat** (orange tabby on head/back/tail, white on muzzle/chest/belly/paws).
   Must be based on the `RIG.girl` / `RIG.cat` skeleton and choreography (same skeleton, same motions), but rendered in the style of the era: you may use the Path2D shapes directly for fill/stroke/silhouette, add clothing at the anchor points, or apply era-specific deformation of the skeleton points (e.g. Egyptian frontal eye, black-figure silhouette).
3. **Things in the painting must move**: use `PAINT.choreo(lt,t)` for the main character motions (raise cup, tail swish, blink, breathe),
   plus 2–4 **small loops drawn from the visual motifs of the era** — see `../拆解/分镜表.md` (breakdown/storyboard) per era's "in-shot actions" (examples: cave-painting animal alternating between two poses to run, scarab pushing a sun-ball, meander band scrolling, Vesuvius smoking, gold-leaf highlight sweeping past, ornithopter flying past, cherry blossoms falling, light flickers...).
   Each era is on screen for only 0.25–1.4 seconds; the motion must be **visible within that window**.
4. **Style is built in code**: use renderers/textures/lines to make it look like a work of art from that era, not a clip-art illustration. Lines may use 8–12 fps "boiling" (boilSeed) to add a hand-drawn feel.
5. **Performance**: ≤ 150 ms per frame (1920×1080). Cache static parts with `PAINT.cached`. All randomness must be seeded — the same `t` must produce the same frame.

## References
- Reference-film frames for this era: `../生图/ref/<id>.png` (composition, motifs, color, everything except the counter; extract frames yourself from the reference film, not distributed with the skill)
- AI design plates (same composition, replaced with blonde girl + orange-and-white cat): `../生图/plates/<id>.png` — use as art-direction reference only; **do not paste the image into the canvas**, draw everything in code.
- In-shot actions and transition origins: `../拆解/分镜表.md` (breakdown/storyboard)
- Reference film at 60 fps: `../原片/<reference-film>.mp4` (bring your own)

## Self-review (at least 3 rounds per era)
```sh
cd <your project directory>   # contains 代码工程/ (copied from scripts/engine)
uv run --with playwright python 代码工程/render.py --solo <id> --stills 0,0.3,0.6,0.9 --out 渲染/<id>
uv run --with playwright python 代码工程/render.py --solo <id> --from 0 --to 1.2 --out 渲染/<id>/clip.mp4
```
Place your frames side by side with the reference-film frames and design plates (PIL), then ask yourself: ① Can you identify the era/artist at a glance? ② Does the girl look like a 17-year-old blonde, and is the cat orange-and-white? ③ Is the animation visible within 1 second? ④ Are there any glitches (misalignment, broken lines, incorrect occlusion, empty areas)?
If any of those fail, fix it and repeat until satisfied.

## Deliverables
- `scenes/<id>.js`
- `notes/<id>.md`: what techniques you used (renderer parameters, palette, how the motif animation was built, pitfalls encountered) — **this is experience to be distilled back into the skill**, so be specific, include numbers.
