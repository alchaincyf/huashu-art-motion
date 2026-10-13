# 04 · Pure-code drawing: painting an artistically resolved picture with Canvas and bringing it to life

[中文](../04-纯代码绘制.md) · **English**

This page focuses on pure-code drawing: scenes and objects are implemented through procedural code and style renderers. Human figures, anthropomorphic characters, and robots are not drawn into the finished film in code — see reference 10 for generated-frame workflows and [character-detail.md](character-detail.md) for the delivery pipeline. This page is a method summary written after completing 16 styles for the first time; specific parameters for each style are in `style-recipes/<id>.md`.

## 1. Project skeleton (`scripts/engine/`, copy it to start a new film)

```
index.html      # load order: lib/fonts → lib/util → lib/paint → lib/rig → eras → transitions → scenes/index → engine
eras.js         # segment table: id, number of eighth notes (eighths), transition {type,dur,delay,cx,cy}, year-plaque style
scenes/<id>.js  # one file per segment: SCENES['<id>'] = { draw(c, lt, t) }   ← most of the work lives here
transitions.js  # transition library: (c, A_old, B_new, p, o) → draws one frame
engine.js       # beat grid → t0/t1 per segment; during transitions both segments draw to offscreen then hand off to transition; beat lens impact; year counter (value determined solely by global t)
lib/paint.js    # noise, texture, hand-drawn boiling lines, style renderers, area palette swatch, shared choreography choreo, heat shimmer, particles
lib/rig.js      # character rig: RIG.girl / RIG.cat → per-part Path2D + anchors; drawGirl/drawCat (mode: fill/line); ik2, smooth, taper
render.py       # headless Chromium calls renderFrame(t) per frame → PNG pipe → ffmpeg 60 fps, can mix audio track; --solo <id> for single-segment preview, --stills for still frames
compare.py      # original | replication side-by-side composite at the same timestamp
```

Render speed: ~90 seconds for a complete 15-second 60 fps film (Apple Silicon Mac). Per-frame time for most segments: 5–40 ms; heaviest is Van Gogh at 110 ms.

## 2. How to paint one style (five layers; reference implementation: `scenes/09_postimp.js`)

> The five layers are the default order for oil/printmaking styles, not universal: **ink wash** reverses them (paper is the base, ink only adds on top, large blank areas are not pre-filled); **pattern styles** (Kusama, Bauhaus) are "flat colour with pattern sprinkled on top", the pattern is itself the renderer; **chiaroscuro** is "paint the bright version, then multiply a lighting map over it".

1. **Flat underpainting**: large areas (wall, floor, sky, outside the window) painted first with solid colour/gradient in the right position and value. This layer establishes composition; style has not appeared yet.
2. **Style renderer repaints**: use the underpainting as a colour source and repaint the entire frame in that style's mark-making — Van Gogh flow-field long strokes, Impressionist short dabs, mosaic stone tiles, Ukiyo-e colour-register offset + patterns, Cubist facets, Pop Art halftone, 8-bit low-resolution per-pixel, ray-trace per-pixel reflections… The renderer determines "whose painting this is".
3. **Small objects on their own layer**: desk, chairs, vases, picture frames — if mixed into large areas and passed through the renderer together, they get broken apart. Draw them separately with finer parameters; use `source-atop` to draw only within their own bounds.
4. **Character**: speedrun/traversal films use the same rig (RIG), the same choreography, and change only the drawing style (other subjects: design the character for the subject) — lay flat colour, then add that style's fine texture on top, then finish with a clear outline and facial features. The character is where the viewer's eye lands; it must be legible.
5. **Moving highlights**: small loops of era motifs (see reference 02). Use continuous time for continuous motion; use 8–12 fps seed cycling ("boiling") for hand-drawn line work to give a handmade feel.

## 3. Style renderer quick reference (all in `lib/paint.js` or written locally in each scene)

| Renderer | Suits | Key |
|---|---|---|
| `strokes` flow-field brushwork | Van Gogh, Expressionism, oil painting | Direction field written per region (wall vertical, floor along perspective, stars along vortex); **area palette** matters more than colour jitter; each stroke needs a dark-colour outline to feel thick |
| `dabs` colour dabs | Impressionism | Warm/cool-biased elliptical short strokes; **not pointillism** (no pure palette, unequal dot sizes — produces Impressionism) |
| Optical-mixing pointillism (29_seurat) | Seurat, Neo-Impressionism | Pure palette placed proportionally side by side, equal dot sizes, complementary-colour dots, halation at light/shadow boundary |
| Tesserae (04_roman, written locally) | Mosaic, stained glass | Layout computed once only; colour flows through tiles each frame; tiles align along contours (distance-field iso-lines); tiles 8–28% larger than half-spacing so the bisector cuts a grout line |
| Colour register + pattern (07_ukiyoe) | Ukiyo-e, woodblock, screen print | Fill offset from ink line by (3, 2) px; pattern as CanvasPattern; horizontal brush-bleed gradation |
| `facets` | Cubism, low-poly | Semi-transparent gradient faces stacked for depth; triangles not clipped so contours become straight edges |
| `halftone` | Pop Art, old print | Small tile `createPattern` is 10× faster than per-pixel; 45° grid |
| Low-resolution per-pixel (14_8bit) | Pixel, retro game | Draw at 240×135, then nearest-neighbour scale up; limit to 14-colour palette; 1 px black outline per part |
| Per-pixel shading (15_raytrace) | Early CGI, plastic, metal | Uniform plastic shading (base + radial dark edge + ambient rim + hard specular); floor mirror reflection |
| Gold leaf (05_gothic) | Gilding, icon, decorative | Per-pixel burnishing grain + embossed dark lines offset 1 px from bright lines; highlights land only on the "gold-ness" mask |
| Sfumato (06_renaissance) | Classical oil | Whole-layer soft blur + semi-transparent sharp layer; craquelure + canvas texture + vignette + amber glaze |
| Variable-width path (10_nouveau) | Art Nouveau, calligraphic line, printmaking | Offset the point list on both sides by width to form a polygon; dark-colour silhouette shifted and placed underneath = thick outside / thin inside |
| Granular dabs (16_2026) | Contemporary flat illustration | Scatter dots inside shapes, density as a position function; static parts fully cached |
| Ink brush dry-brush + ink bloom (17_ink) | Ink wash, calligraphy, East Asian painting | Brush tip start/finish, dry-brush sampled at equal arc-length intervals; `filter='blur()'` for bleeding (confirmed in Chromium); paper is base, ink only adds on top |
| Long curved flow strokes + per-row warp (19_munch) | Expressionism, flowing feel | Long strokes following flow field for 20–30 steps; full frame per-row sinusoidal displacement (margin ≥ max displacement to prevent seams) |
| Watercolour wash (25_ghibli) | Ghibli backgrounds, watercolour | Transparent colour layering + watermark edges; edge outline alpha fades as it expands |
| Grayscale photo halftone (22_constructivism) | Constructivism, old newsprint, photo collage | Dot radius by luminance, 45° grid, batched into one path and filled once |
| Two-version light clip + long cut shadow (24_hopper, 23_dali) | Hopper, Surrealism, strong-light scenes | Paint bright version and dark version separately, clip by light shape; shadow with shear transform |
| VHS channel-separation post-processing (26_vaporwave) | Vaporwave, retro video | RGB channel offset, scan lines, tracking noise bands, applied as a composited post-processing layer |
| Lighting map whole-frame multiply (32_rembrandt) | Chiaroscuro, night scene, candlelight | Paint bright version first, then multiply a lighting map (window light + candle radial) |
| Cel hard shadow band (35_shinkai) | Japanese animation, Shinkai style | Part minus its shifted self = hard shadow band; lit edge highlight |
| Stepped frame rate `stepTime(t,fps)` (33_rubberhose, 34_shadowpuppet) | Old animation, shadow puppet, stop motion | 12 fps / 10 fps stutter is half the style, not lag |

## 4. Character: one rig, a dozen drawing styles

- Do not guess rig coordinates from memory: overlay a 20 px grid on an AI design sheet (or any reference image), read the key points for each body part, smooth with Catmull-Rom into Path2D (`RIG.smooth`). The first version with hand-written coordinates looked like a boy; after measuring the points, a single pass read as a 17-year-old blonde girl.
- A seated pose with legs hidden in a long skirt looks most natural; cup-lifting uses two-bone IK (upper arm 165 / forearm 122), elbow anchor pointing straight down.
- Anchor `G.A` (crown, forehead, neck, chest, waist, knee, hand, …) lets each style add its own clothing: Egyptian wide collar, Gothic halo, Ukiyo-e shimada bun, Bauhaus joint discs, Pop Art big waves.
- Each style may stylise the rig (Egyptian side-face with frontal eye, black-figure silhouette, Cubist half-blue face, pixelation) but position and motion rhythm must match the rig — that is what makes "the same characters travelling through eras".
- Large-movement end-performance actions (jump, crouch, paw swipe, cry of surprise) don't need to be forced into the shared rig: 16_2026 builds its own pose library (each pose is a set of local key points, interpolated numerically); squash-and-stretch pivots at the foot, and the frame at maximum squash flips direction.

## 5. Bringing the painting to life: motion list and how to measure it

- Minimum per segment: one continuous protagonist action (choreo.cup lifting-to-drink) + 2–4 era-motif small loops. Short segments (<0.5 s) need step rates of 15–30 fps.
- Self-check motion amount: render two frames (**avoid the 0.35 s lens-impact window after a transition**, or the whole frame counts as motion) and compute the frame difference. First-pass numbers (0.45–0.9 s after scale-out): Cave 2.8%, Egypt 3.4%, Rome 6.4%, Greece 9.9%; original film same-segment heat maps: 6.9%, 6.2%, 17.3%, 11.6%. If the result is too static, add era-motif actions.
- Moving things should be at the viewer's focal point (in the speedrun demo: person, cat, window; for new subjects, place the focal point as your composition dictates).

## 6. Pitfalls

- **Composite modes**: applying `source-in` per tile clears each other (Klimt gold robe disappears entirely) — draw the full tile pattern on a scratch canvas, then clip to the silhouette once with `source-in`; using `destination-out` on the segment canvas punches transparent holes, which appear black in video — punch on an offscreen canvas and draw the result; layering paper grain / particles over a character cannot use `source-atop` (paper colour bleaches the character) — clip the texture layer with `destination-in` to the silhouette, then `multiply` back.
- Custom glyphs: two counter-wound strokes in the same path cancel under the nonzero rule, leaving holes — fill each part separately.
- "Melting" transitions: let the new frame flow down in rounded liquid drops (profile `(1-u²)^0.3`); the old frame dragged down produces sharp spikes, not liquid drops.
- Transition duration: set it by "the readable portion" — inOut easing is nearly invisible at both ends; a complex signature transition at 0.34 s reads as only 0.2 s and is perceived as a plain wipe — give it 0.48–0.5 s.
- Shadow-puppet / paper-cut semi-transparent stacked layers: overlap with `multiply` darkens — tune layer order and opacity to match the material.
- `putImageData` writing directly to the target canvas bypasses the engine's lens-impact scaling and transition clipping — write to an offscreen canvas and use `drawImage`.
- Offscreen contexts for reading pixels: use `{willReadFrequently:true}`; use `g.reset()` every frame or the previous frame's lineJoin/state leaks and the first frame differs from subsequent frames.
- `drawGirl(mode:'line')` on the top layer draws the outlines of occluded parts through the body (far-side sleeve through the torso, back half of hat brim through hair). Use `RIG.visibleLines(key, (g, lineColor) => draw everything, trueLineColor, box)`: draw with the same method twice, swap the line colour to white as a sentinel; pixels that differ between the two passes are unoccluded lines (including facial-feature lines). Follow "flat colour → style texture → visibleLines line pass".
- **Lens impact must act on both old and new layers**: impacting only the new layer means the new layer is not yet visible at the very start of the transition — the frame on the beat has no visible change, and the audio impression is "sound arrives before picture" (v1 review measured 0.1–0.17 s delay across 6 of the 15 transitions). After applying impact to both layers, all 15 transitions' first visible change landed on the beat (±2 frames).
- **Whole-frame strokes changing seed at 8 fps = flicker, not life**: review measured whole-frame jump frame difference 18–20, larger than the transitions. Fix: lock stroke positions, let the direction field vary continuously over time (like a flame swaying); boiling is for line art only.
- Do not change just the dynamic region's parameters (tile size, stroke density) — it looks like a patch when static.
- For coarse-grained styles like mosaic/pixel, text must use monospace thick strokes (each stroke ≥ 2 grain widths); thin fonts break apart.
- Make small things bigger than you think: Ukiyo-e wave claws at 22–50 px are illegible; 44–74 px reads as "The Great Wave off Kanagawa".
- Determinism: all random calls use a seed; rendering the same `t` twice must produce pixel-identical output, or the render will flicker.

## 7. Division of labour (multi-agent parallel drawing)

Write `scripts/engine/era-author-spec.en.md` (interface, available libraries, reference implementation, hard requirements, reference files, self-check commands, delivery notes) first, then dispatch groups of 4 eras per agent. The spec must state "do not modify lib/ or other agents' files". Each group returns in 30–35 minutes; notes go directly into `style-recipes/`. On the first run, all 16 segments passed in one round — largely due to the spec + reference implementation.
