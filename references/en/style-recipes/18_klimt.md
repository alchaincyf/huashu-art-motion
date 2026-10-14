# 18_klimt · Klimt's Golden Phase (1907)

[中文](../../风格配方/18_klimt.md) · **English**

> Source: migration test A (implemented by an independent agent reading only the skill, 2026-10-04). Integrated scene code was ported to `scripts/engine/scenes/18_klimt.js`.

Experimental filename `scenes/02_klimt.js` (223 lines). Difference 0.45↔0.9s is 32.9% (mostly the moving light band), median adjacent-frame difference 0.40%, but 14 of 48 pairs are nearly still (see ②-2).

**Pipeline**
Gold-leaf wall (cached) → gold-dust four-point stars twinkle (lighter) → window *Birch Forest* stippling → black/white checker gold frame → flower-carpet floor → Hoffmann black/white checker table → diagonal light band (before characters, which naturally occlude it) → cat → girl's golden robe (pattern layer source-in to silhouette) → realistic face and hands → flower crown → golden sleeves, golden cup → golden steam.

**Gold leaf**
- Per pixel: `f = 0.5 + fbm(x·.004)·0.55 + noise(x·.003, y·.08)·0.5 ± 0.05`, interpolate `[120,78,18]→[196,148,52]→[246,216,128]`.
- Very faint square seams every 96px indicate individually applied gold-leaf sheets.
- Wall: gold leaf multiplied by enlarged 480×270 fbm (brown-gold mottling like *The Kiss* background), then scatter 9000 gold/dark dust particles.

**Patterns (golden robe)**
- 150 random points, four types:
  - three-color concentric circles (30%): red/white/blue, blue/gold/red, purple/white/gold;
  - gold spirals on dark brown (32%), each rotating at ±3rad/s;
  - Horus-like eyes (22%), blinking in turn: closed when `sin(2.2t+φ)>0.86`;
  - white dot clusters + red centers (16%).
- Hem also has 60 tall black/white rectangles with gold outlines, the visual language of the man's robe in *The Kiss*.
- **Flat ornament versus realistic face**: face/hands use radial gradients for volume (highlight `#fbe8da` → `#f0cfb8` → `#d8a88c` → edge `#b88068`), blurred blush and eye-socket shadows, only 1.2px pale contours. Robe has 3px dark outlines. This contrast is Klimt.

**Other elements**
- Window *Birch Forest*: 2600 autumn-leaf-colored elliptical dots, six birch trunks with black patches; 14 falling, flipping leaves.
- Flower carpet: 260 concentric-circle flowers, larger nearer camera (6→20px), nodding `sin(4.2t+φ)·0.18r`.
- Light band: width 520px, α.24, skew `transform(1,0,−0.45,1)`, lighter, sweeps **at constant speed** −200→2300 in 1.15 seconds.
- Gold dust: 420 particles show four-point stars when `sin(t·sp+φ)>0.55`. Stars initially looked like Christmas decorations; radius changed from `s·(1+2.2a)` to `s·(0.6+1.1a)`.

**Pitfalls**
- Applying `source-in` to each pattern individually clears previous patterns; see ②-7.
- Light-band α.38 looked like lens flare; reduce to .24.
- First version had still adjacent-frame intervals: blinking is intermittent and light bands have soft gradients. Three additions reduced still pairs from 20/36 to 0/36:
  - 34 gold-leaf fragments fall while flipping (150px/s, square and round pieces, gold gradients);
  - gold dust rises at 26px/s;
  - flower nod amplitude increased 0.18→0.35.
- Initial gold spirals covered the cat's face too, described in review as a rash; limit them to the body and reduce to 46.
