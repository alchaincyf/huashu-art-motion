# 35_shinkai · 2016 Makoto Shinkai light and shadow

[中文](../../风格配方/35_shinkai.md) · **English**

> Source: migration test D (implemented by an independent agent reading only the skill, 2026-10-04). Integrated scene code was ported to `scripts/engine/scenes/35_shinkai.js`.

Experimental filename: `scenes/r4_shinkai.js`, about 71ms per frame.

**Pipeline**: realistic interior (warm/cool wall gradients, perspective wood-floor seams, aluminum-framed window, calendar, desk, cached) → sky + cumulonimbus + utility poles/wires + distant rooftops + airplane contrail + birds → glass water droplets → sheer white curtains → window-shaped light patches on floor/wall (curtain shadow swings inside wall patch) → plant → cat, girl (cel shading) → steam → Tyndall beams + light dust → lens flare → bloom → soft-light warm/cool separation.

**Key parameters**
- Cel-shading function `cel(c, p, base, shade, rim, {sd, rw, lx, ly})`:
  - Shadow = clip(p) ∩ ¬(p translated by (lx·sd, ly·sd)). Use evenodd: a large rectangle + translated p as clip.
  - Rim light = clip(p) ∩ ¬(p translated oppositely by rw).
  - Light comes from window, lx=−1, ly=−0.55; shadows fall lower-right. sd: large parts 22–30, face 10, small parts eight; rw 3–9.
  - Line color #6a4632, width 2.2. Draw parts in order "fill → shadow → rim → outline" for natural occlusion without visibleLines.
- Cat under window is backlit: lx=0.5, ly=1, shadow underneath; add warm lighter rim rgba(255,220,160,.55) along crown/back.
- Colors: skin #ffe8dc/#f2b6a8; blond #f8d681/#d8a050; white uniform #fbfbfe/#b9c3dc; navy #2c3a66/#1b2446. Hair shine: rear-head 9px bright arc rgba(255,250,226,.85).
- Anime eyes: white 8×12, vertical iris gradient #1f3f7a → #3f7fd0 → #9fd4ff, two highlights, 3.4px upper lid plus corner lash.
- Cumulonimbus: 70+12 masses. ① Draw blue-gray silhouettes for all masses (linear gradient #b7c6e6 → #8297c6). ② Each has a white radial-lit sphere of 0.82r offset toward sun (+0.22r, −0.3r). ③ Blur whole layer 3px, then overlay 55% sharp layer. Each radius breathes by 0.05·sin(1.3t), whole drifts 10px/s.
- Lens flare:
  - Sun core: r130.
  - Ten star rays: lengths 90/170, rotate 0.25rad/s.
  - Horizontal streak: 840×4.
  - Five hexagonal ghosts: along sun→image-center line at 0.45/0.75/1.25/1.6/2.0× distances, α 0.04–0.12.
- Tyndall beams: three wedges, blur 18px then cache, screen, α 0.75 + 0.25·sin(3.4t). Light dust: 60 radial-gradient particles, twinkling.
- Bloom: draw whole frame into 480×270 canvas → blur 6px, brightness 1.1 → enlarge and overlay screen α0.28.

**Motif motion**: churning/drifting clouds, airplane contrail, flock wingbeats, one droplet sliding down glass (leaving a trail), sheer curtains and their wall shadow swaying, plant leaves swaying, wind-blown hair, rotating star rays, pulsing beams, light dust. Motion area 3.0%.

**Pitfalls**
- Sun at a window-frame corner spills glow onto wall, like a wall lamp. Sun must be inside glass, flare radius ≤130.
- First clouds used a radial gradient per mass plus a lit-edge arc, reading as soap bubbles. Use silhouette + offset lit sphere + blurred/sharp layers.
- First horizontal light streak was 1800px long across the image, like a bug line. Restrict near sun to 840px, α0.35.
- Solid-circle droplets look like floating sky bubbles. Draw only lower arc, α0.22 translucent body, and one highlight.
- Name collision (two `const cg`) made the entire scene fail to load, silently replaced by a placeholder (see ② item 1).
