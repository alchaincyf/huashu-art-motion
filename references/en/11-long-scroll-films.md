# 11 · Long-Scroll Films: one person walks left to right through a series of famous paintings

[中文](../11-长卷穿越片.md) · **English**

The approach used in *Huashu Walks Through Famous Paintings* (2026-10-05, 123.7 s, 24 worlds). Unlike Art History Speedrun (same room, changing art styles), here the structure is **a horizontal long-scroll canvas**: each world is a horizontally extended painting, joined end to end; the protagonist walks right continuously, and at the moment of crossing a boundary, both the character's art style and the world change together.

Demo: `scripts/engine/demos/long_scroll/`, containing 3 segments (Egyptian mural → Monet *Japanese Bridge* → 8-bit pixel), about 15.6 s.

```sh
uv run --with playwright python scripts/engine/render.py --film demos/long_scroll --stills 1,5,9 --out 试渲   # three stills
uv run --with playwright python scripts/engine/render.py --film demos/long_scroll --out long_scroll.mp4       # full segment
```

Browser preview: start a static server inside `scripts/engine/`, open `index.html?film=demos/long_scroll`; `&only=28_monet,14_8bit` renders only those segments; `&v=330` tests a different walking speed.

## Files

| File | Responsibility |
|---|---|
| `eras.js` | Film entry point: loads libraries, `FILM_ORDER` (segment sequence), registers frame libraries, generates one segment with `dur = WORLD.total` |
| `lib/world.js` | Skeleton `WORLD`: timeline (walk → stop for interaction → walk), protagonist movement, camera, protagonist clipped at boundaries, boundaries, corner labels. **Read its header comment first** |
| `lib/crossing.js` | `XING`: reads frame library, draws character frames (`XING.actor`), brushstroke material, Monet world |
| `lib/acts.js` | `ACT`: mini-script utilities (stone-skipping trajectory etc.) |
| `lib/xing2_*.js` | Small utilities shared by several segments; loaded on demand at the top of each segment file |
| `segments/<id>.js` | One file per world; calls `WORLD.add({...})` |
| `frames/<key>/` | Character frame library: 8 transparent PNG + `meta.json` (foot-anchor `ax/ay` per frame, dimensions, airborne flag `air`; `ref_h` is the standing height in pixels) |

## Adding a segment

1. Create `<id>.js` in `segments/`, call `WORLD.add({ id, year, name, w, hero, acts, back, front, seam })`; interface is in the header comment of `lib/world.js`. Draw the world itself in code — prefer adapting an existing style scene `scenes/<id>.js` into a horizontally extended version (segment width 2000–2800).
2. Generate character frames: one "walk cycle — 8 frames" per world; add an "interaction — 8 frames" sprite for worlds with interactions; have an image model redraw them in the world's art style, chroma-key, and split (`scripts/key_split.py` — see doc 10); place in `frames/<key>/`, write `meta.json`.
3. Add `<id>` to `FILM_ORDER` in `eras.js`.
4. Render stills at the seam on both sides, then run `qa.py --project scripts/engine --film demos/long_scroll`; determinism must pass ✓.

## Key conventions (unified across the whole film, hard-coded in the skeleton)

- **Ground line `WORLD.GROUND = 760`, protagonist standing height 300, protagonist at x = 720 px in the frame.** At both ends of each segment (near x=0 and x=w, within ±150 px) the ground must return to 760; the horizon should fall near 480–560 so that the two sides connect across a boundary. In between, bridges and steps are fine (`ground: lx => y`).
- **All events are timed relative to "interaction start."** Use `WORLD.actT(segment)` to get the whole-film time of interaction start; `r = S.t - WORLD.actT(ME)`. Do not write "N seconds after entering the segment." Walking speed was later raised from 330 to 560 — segments written this way need zero changes.
- **Camera only moves forward, never back.** Camera target = protagonist x − 720 + `lead` (forward offset during interaction); the historical maximum is taken and then Gaussian-smoothed, so the camera is always monotonically advancing — no jerks at start or stop. To keep the camera stationary during an interaction, write `lead: 0`.
- **Each segment's boundary is drawn in that segment's signature visual language** (`seam`: paper edge, pixel checkerboard, color-block divider…). This is the speedrun film's "transition = next style's signature language" translated into the long-scroll format.
- **Protagonist walk framerate scales proportionally with walking speed** (`hero.fps`), 8 frames per gait cycle. When an additional material pass is needed in a specific world's style, write `hero.draw(c, key, i, o, S)` inside the segment to composite it yourself; do not modify the shared library.
- **Music**: picture first, music after. Each segment holds an integer number of beats; tempo is fine-tuned per segment within 86–104 BPM so every boundary falls on a bar's first beat (measured: 24 boundaries, maximum error 11.7 ms). The human ear cannot detect ±8% tempo variation between segments.
- **Do not add gags for the protagonist that weren't asked for.** The skeleton has a "stack souvenirs on the hat" feature (`FILM_HAT_ITEMS`) that easily competes for visual attention with the scene — disabled by default.

More evidence and numbers: [proven practices](07-proven-practices.md), items 36–38.
