# 26_vaporwave · 2011 Vaporwave / Cyber Neon

[中文](../../风格配方/26_vaporwave.md) · **English**

> Source: Migration Test B (stand-alone agent working read-only from skill, 2026-10-04). Scene code ported after integration to `scripts/engine/scenes/26_vaporwave.js`.

Experimental filename: `scenes/c5_vaporwave.js` (~210 lines). Review red light: the first version had a pink top that blended with the pinkish skin tone and read as unclothed. Changed to lavender-purple trench coat `#8f7cf6` + white triangle collar + cyan zip line. Median per-frame 49 ms; frame diff 25% (VHS post-processing keeps the whole screen moving).

**Pipeline**: the full frame is first painted onto offscreen canvas S, then VHS post-processing outputs to c (the counter is drawn by the engine in the topmost layer, unaffected by chromatic aberration).
1. Wall: deep-purple vertical gradient `#0d0322 → #4a0f6a` + magenta radial glow at the window, cyan radial glow at the sign. Cyan light strip along the base of the wall.
2. **`glowLine(c, col, w, blur)`**: the same path is first traced with a wide `shadowBlur` glow, then a 2–3 px near-white core stroke — producing a neon tube effect.
3. Window sunset: the sun is a yellow → orange → magenta vertical gradient, with 7 horizontal gaps cut by `destination-out`, gap width increasing with depth (2 + q²·16), the whole moving upward at 0.9/s. Horizon has wireframe mountains (magenta glow), below that a cyan perspective grid scrolling toward the viewer, left and right palm-tree silhouettes swaying.
4. Floor: magenta perspective grid, vanishing point (960, 600), horizontal lines `y = 600 + 520/d`, d = k + 1 − phase (phase = 1.3t mod 1), line width increasing toward the foreground.
5. **Neon sign "カフェ" (café) drawn with polylines for each tube** (no font dependency): each kana is 1–3 strokes, (u,v) unit coordinates. Each character flickers based on a frame hash: `hash(floor(30t), k) < 0.07` turns it off; "フ" additionally goes dark with 22% probability when `f mod 17 < 5`, and when dark shows a dim purple tube.
6. Win95 dialog TEA.EXE: grey body, navy-blue gradient title bar, progress blocks `3 + 14lt` filled, percentage `18 + 70lt`. Marble bust on the table (22-point side-profile silhouette, purple-grey gradient + vein lines + pink rim light + sunglasses gag).
7. Character: pink hair, cyan pleated long skirt, golden hair + pink scrunchie. Dual-colour glow outline "magenta on the window side, cyan on the back": the same set of paths drawn twice, each clipped to the left and right half of the screen.

**VHS post-processing `vhs(c, S, t, lt)`**
- RGB separation: for each channel, S is painted into a temporary canvas and `multiply`-composited with a pure colour `#ff0000/#00ff00/#0000ff` to extract one channel, then composited with `lighter` onto a black base with an offset of 3 + 1.5sin(7t), occasionally (hash<0.12) +6.
- Tracking noise band: 70 px tall, scrolls down at `(520lt + 200) mod (H+160)`. Inside the band, every 6 px a horizontal offset `±30·sin(πy/bh)`, layered with 90 white-grey noise lines.
- Scan lines: 4×4 tile pattern (row 0 α 0.28, row 2 α 0.12). OSD: PressStart2P "PLAY" + hand-drawn ▶ (glyph not in the font), flashing every 16 frames; lower-left date and timecode advancing with lt.

**Palette**: magenta `#ff4fd8`, hot pink `#ff2f8f`, cyan `#3ff6ff`, deep purple `#12052a / #2a0b4a`, sun yellow `#ffd84a`, orange `#ff8a3a`.

**Pitfalls**
- Full-width "ＶＡＰＯＲＷＡＶＥ", ▶, and Japanese kana are all absent from `lib/fonts` and silently fall back to system fonts. Changed the label to half-width ASCII + 7-letter-spacing; ▶ and kana are drawn manually.
- Character outlines use component-part paths, so joints between the waist, arms, and torso also glow. Neon line art can accept this, but for a clean outer contour only, you must first draw the silhouette into an offscreen canvas and then outline the edges of that canvas.

---
