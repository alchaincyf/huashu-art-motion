# 08 · Style Author Spec (general edition, for scene writers and dispatched agents)

[中文](../08-风格作者规范.md) · **English**

> Replaces the earlier `时代作者规范.md` (era-author-spec) that was tied to a specific remake project. When dispatching an agent to build a style, pass it the path to this page plus the "this project" section with project-specific details.

## Interface

One style segment = `scenes/<id>.js`:

```js
SCENES['<id>'] = { draw(c, lt, t) { /* fill 1920×1080 */ }, init(IMG) { /* optional: one-time pre-computation */ } };
```

- `c` target 2D context; `lt` segment-local time (seconds, counted from the start of that segment's transition); `t` whole-film time.
- Segment table `eras.js`: `{ id, eighths or dur, transition: { type, dur }, counter: {...} }`. Film length is computed automatically from the segment table.
- Transitions `transitions.js`: `TRANSITIONS.<name> = (c, A旧, B新, p, o) => {}`.
- Missing scene file, syntax error, or unregistered scene → the engine refuses to start; render/qa report errors directly. Do not judge success by "it looks like it rendered."

## Read first (in order)

1. `references/en/02-mechanism.md` (five-layer mechanism — only needed for speedrun/scroll films), `04-纯代码绘制.md` (pipeline, renderer quick-ref, pitfalls), `07-正面经验.md` (proven practices).
2. `references/en/style-recipes/INDEX.md` (style-recipes index): find the closest style as a starting point and read that card.
3. Reference implementation `scripts/engine/scenes/09_postimp.js`; source code of the scene closest to your style.
4. `lib/`: `paint.js` (noise/texture/renderer/palette/choreography), `rig.js` (character skeleton, visibleLines), `kit.js` and other utility libraries. **Check the library first before writing your own.**

## Two starting points

**With a reference film**: run `scripts/analyze/breakdown.py` first to get reference frames (`ref/segNN.png`), motion heat maps, and transition contact tables; break it down following doc 01. Reference frames determine composition, motif, and color; heat maps tell you "what moves in this painting."

**Without a reference film** (more common):
1. Write down the 3–5 most recognizable formal elements of the style (materials, brushwork, color palette, motifs, medium traces). Check primary sources (images of original works, art-history descriptions) — don't go from memory.
2. Give each element "a way to move" — how it would naturally move in that painting's world (water trembles, paper drifts, gold shimmers, etching plates shift out of register, film grain judders).
3. Think through how this kind of painting is physically made in reality (brushed, carved, printed, pasted, inlaid, sprayed, rendered), then write that physical process as a renderer.
4. Produce one frame first: compare the still against the original; once it's recognizable at a glance, let it move.

## Hard requirements

1. **Composition**: speedrun/scroll films follow this project's given composition coordinates (consistent across segments — transitions and "same character crossing worlds" both depend on them). Other subject matter: the style dictates composition and lighting; don't reuse the demo-room coordinates.
2. **Characters**: speedrun/scroll films use the `RIG` skeleton and shared choreography — change the drawing style, not the position or motion. Other subject matter: design characters and placement for the subject (humans use AI-generated frames; see doc 10). **Characters must also go through the style's material treatment** (brushstrokes, grain, paper-texture multiply, ink-bleed edges, halftone dots, color-plate offset…), otherwise they look like cut-out stickers pasted on — the most common shortcoming across all 36 styles. When line art is needed, use `drawGirl/drawCat` in `mode:'line'` (internally routes through visibleLines, no draw-through).
3. **The painting must live**: primary motion + 2–4 small motif loops, visible within the hold window. In speedrun/scroll films, character motion uses whole-film time (`PAINT.cupCycle(t)` and similar); it does not reset between segments.
4. **Smoothness**: no full-screen low-framerate re-seeding (reads as flickering); boiling is only for line-art or motif areas. Intentional "stepped framerate" (rubber-hose 12 fps, shadow puppets 10 fps) uses `stepTime` — that is style, not stuttering. The modulo period of tiling patterns must equal the pattern's true repeat.
5. **Determinism**: all randomness seeded; two renders of the same `t` are pixel-identical.
6. **Performance**: static parts use `PAINT.cached`; off-screen canvases that read pixels use `willReadFrequently` and `g.reset()` each frame; target ≤150 ms per frame (qa measures real time including GPU flush).
7. **Text**: text within a style should preferably be path-drawn in that style's material; when using a font, call `U.assertGlyphs` first to verify glyphs exist (missing glyphs silently fall back to the system font).
8. **Aging effects stay off the character**: peeling, stains, and scratches only on the background; set a protection zone around the character (Dunhuang peel flakes landing on the back read as "torn clothing").

## Self-check and delivery

```sh
uv run --with playwright python <project>/render.py --solo <id> --stills 0.4,0.6,0.8,1.0 --out <renders>/<id>   # stills
uv run <skill>/scripts/qa.py --project <project> --ids <id>                                                      # numbers
```

At least 3 rounds per segment: compare stills against original/reference collage → qa checks motion/hold-frame pairs/jumps/timing/determinism → revise. Four questions: ① Is the style recognizable at a glance? ② Does the character look right and blend with the background? ③ Is the painting visibly moving within the hold window, without flickering or stuttering? ④ Any gaffes (occlusion, broken lines, misalignment, blank patches, overlapping text)?

Delivery: `scenes/<id>.js` + style recipe card (following the `风格配方/` format: pipeline, key parameters and color values, how motif animation works, signature transition, performance, pitfalls, remaining improvements) — write specifics, write numbers. **For multi-segment films, dispatch a separate agent who had no part in production to review the finished film before delivery.**

## Three-direction hard gate when unattended

With Huashu present: for a new style direction or character interpretation, produce three options in the same frame for him to choose from.
No one available (automated tests, overnight batch): execute the direction specified in the brief; simultaneously list "two other directions that could have been offered" (one line each) in the delivery notes, and wait for him to return and choose.
