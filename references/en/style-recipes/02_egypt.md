# 02_egypt · 1350 BC Egyptian Tomb Mural (Pure Code)

[中文](../../风格配方/02_egypt.md) · **English**

File: `scenes/02_egypt.js` (~460 lines). Performance: warm max 20.7ms / mean 10.5ms (1920×1080); `init()` pre-warms cache at boot so the first frame no longer stalls 170ms. Determinism check passes.

## Pipeline
1. **Static layer `eg_static` (cached once)**: plaster wall → hieroglyph columns → window (cornice / color-block frame / white ground / Aten disc / uraeus) → pottery ×3 → offering table and offerings → golden throne → blue bowl → ground line and multi-tier decorative bands at bottom → deep-blue band → top/left/right color-block borders.
2. **Moving motifs (drawn every frame, cheap)**: flowing hieroglyph water signs, Aten rays + tiny opening/closing hands at tips, two long rays reaching toward the cat holding the ankh, scarab pushing the sun disk.
3. **Characters**: redrawn in Egyptian canon — does not use RIG.drawGirl/drawCat, only borrows anchors and choreography.
4. **Mural surface**: `eg_surface` mottled layer `multiply` over the full frame + `P.grain` grain + 6 random-walk hair-thin cracks (drawn into the surface layer, so they cross over figures, like real wall aging).

Egyptian murals are "no perspective, flat fill, outline" — **no stroke renderer is used here**, lines don't boil either (clean 2.2–2.8px dark brown `#2a1810` is the right look); the period feel comes entirely from the canon (profile-face frontal-eye, frontal-shoulders) + palette + ornament density.

## Palette
Wall `#eadcb8`→mottled dark `#d8c597`; four-color border: red `#b8322a` blue `#2a58a8` yellow `#e2b13a` green `#2e8a55`, off-white between blocks `#f2ead6`, black seam `#231a14`; gold `#e0ab38`/dark gold `#a8741c`/bright gold `#f3d27a`; deep-blue band `#1c2236`; column-separator red line `#9a2b22`; Aten disc `#c8372b`, rays `#c23a2a`, tiny hands `#b4452c`; skin `#e6b282` (Egyptian female pale-yellow ochre); cat: orange `#e08a3c` stripes `#b45a1c` white `#f6efe0`; scarab: lapis `#2c56b0` + turquoise `#3fa6a0`.

## Hieroglyphs (the most period-defining element)
- **24 glyph functions** written (ankh, sun disc, bread, reed, owl, falcon, heron, horned viper, Eye of Horus, cartouche, scarab, seated figure, leg, arm, basket, house, three verticals, feather, djed pillar, shen ring, jar, lotus, nfr, mouth, water sign), each drawn in a ~50px box with 10–20 strokes, with candidate colors. Line width 3.1 (≈3px after scaling), `round` end caps.
- Column positions measured from the original: left 3 columns x=78..306/y=66..566, upper-center 4 columns x=852..1172/y=66..452, right 4 columns x=1560..1866/y=252..882, cat-left 1 column x=298..366/y=614..886.
- Layout: `U.rng(1350)` seed, fills downward column by column; glyph scale = column width/78×(1.0–1.14), spacing 6–11px; **no adjacent repeats within a column, ≤3 occurrences of same glyph per column, scarab/water sign weighted down 60%** (first version had no limits — the screen was covered in scarabs, like stickers).
- Layout computed at module init and stored as positions — so water-sign glyphs can be excluded from the cache and drawn per frame separately. Minimum 6 water-sign glyphs guaranteed.

## Motif Animation (all driven by lt/t, deterministic)
| Motif | Method | Numbers |
|---|---|---|
| Scarab pushing sun disk | x(lt)=800+642·(lt−0.394), measured at 10.7px/frame from original; modulo 2160 loop; ball roll angle = center-x/radius; two leg poses `floor(lt*15)%2` (at 60fps switches every 4 frames) | Overall ×1.22, ball r=23×1.22 |
| Aten tiny hands open/close | open=0.5+0.5·sin(2π·lt/0.4+k·0.9), finger spread (0.1+0.24·open) | Period 0.4s, 13 inside window + 2 outside |
| Ray micro-tremor | tip x+=3·sin(7t+1.3k), y+=2·cos(6t+k) | ±3px |
| Water-sign flow | zigzag phase = floor(lt·12)·0.5, 12fps stepping, 4-step loop | 0.33s/cycle, looks hand-drawn frame by frame |
| Cup raise | `cup = lerp(0.8,1,choreo.cup)`: original "drinking the whole time at the lip," only runs the last 20% of the raise + choreo.sip head tilt | — |
| Cat | choreo.tail swing (RIG.cat.tailPts), blink (t≈2.18–2.30, falls exactly at lt≈0.77–0.89 in this segment), breathe upper body | — |

Motion: lt 0.45↔0.9 (avoiding the beat-impact zoom) gives 3.5% moving pixels, concentrated on rays/tiny hands, cat tail, girl head/arm, scarab — not large in quantity but all at visual focal points.

## Characters: Egyptian Canon
**The girl** (`RIG.girl({dy:-25})`, dy puts feet on y=900 ground line):
- Profile face from `G.face`; **frontal eye** drawn manually: almond-shaped white eye + black iris r4.2 fitted to upper lid, upper eyelid line 3.2px trailing 18px behind (kohl drag), long brow.
- **Frontal shoulders**: does not use G.torso; draws a wide trapezoid x 1270–1452 manually (both shoulders visible, wider at top narrower at bottom).
- White linen: fill skin color first, then `alpha .9` white overlay → a little skin shows through = linen semi-transparency feel; 27 Bézier fine pleats on the skirt fan from waist to hem (clipped inside skirt, `rgba(120,96,70,.5)` 1.3px), chest vertical pleats 9px apart.
- Wide collar necklace: 5 concentric semi-ellipses (blue/red/green/gold/blue, rx 50→88, ry 24→55), outer ring 18 red-blue alternating teardrop pendants.
- **Golden braided wig**: clip the wig outline, then draw 15 vertical braids — each = 11.5px dark-gold base line + 8.5px gold line + chevron joints every 8px alternating left-right, tips staggered in length. First version used small beads covering the surface, looked like "golden fish roe"; switching to long strips + diagonal joints reads as braids.
- Gold hair band (Bézier 15px dark/11px gold/3px bright-gold) + hanging rear band, large gold earrings, gold arm band (gold 8px + blue 2.5px horizontal stripe).
- **Cup-raise arm**: RIG default puts the hand at the cup side and shoulder at the torso center, making the elbow swing far out. Changed to "hand cupped under the cup body (base of cup)," shoulder moved to front shoulder (1282,476), `RIG.ik2(sh, hand, 140, 160, -1)` keeps elbow hanging in front of the chest.
- Blue lotus cup: petal-shaped cup body + three pale-blue petal lines + base, follows G.cup position/tilt angle.

**Cat = Bastet seated pose** (`RIG.cat({dy:-5})` borrows headC, tailPts, blink, breathe; body drawn manually):
- Silhouette: upright chest + round rump, **front legs contained within the silhouette**, entire front from chest to paws is one white area, two lines divide it into two forelegs + toe lines. First version drew forelegs as two independent white pillars, like bowling pins.
- Turned head + tall pointed ears + frontal almond eye (yellow `#e8cf4a`, vertical pupil, black eyeliner trail), white muzzle, whiskers, gold earring.
- Collar clipped inside "body ∪ head" (`Path2D.addPath` merge) — otherwise the round-head outline would poke out of the neck; Eye of Horus gold pendant.
- Orange tiger stripes: 9 on back, 4 on thigh, 5 on crown — dark-orange arc lines; tail has crossbar stripe every 3 sample points, white tail tip.

## Pitfalls
- selfcheck's 0.2↔0.7 diff for this segment shows "entire frame moving" — that's the engine's beat-impact zoom (lt<0.36s), not the scene itself. For real motion check two frames at lt≥0.4.
- `P.texture` takes ~170ms to generate the first time; pre-warm in `init()` (called at engine boot), otherwise it stalls on the T01 transition first frame.
- The rubble in the original ref is transition residue, not scene content; don't copy it (not in the design spec either).
- Year-plate area 1500–1890×40–210 is wall only; the right hieroglyph column starting at y=252 clears it.
- Review rework: cat at original size puts ear tips at y≈530, pressing them against the window-frame bottom color block (y 530–560), as if the cat's head is poking into the window frame. Changed to a canvas transform anchored at paw bottom (540,898), scaling the whole cat to 0.85 (RIG.cat still at s=1); ear tips fall to y≈585; the two long ray tips use the same transform `catPt()`, tiny hands still land on the cat's head/muzzle; back line and rump moved forward 12–20px for a more slender Bastet seated pose. **Lesson: cat/figure and window frame each individually aligned to the standard composition frame is not enough — when the two frames are very close at y≈540–600, protruding parts like tall ears must be separately checked against neighboring objects.**

## v2 Rework: Egypt Too Static (film review report, item 3)
Spec: full-film renderFrame, static-segment frames 112–140, 480×270 per-frame mean absolute diff (counter masked). **Before 0.32 → after 0.84 (original 0.90)**, performance warm max 21.7ms.
- **Cup-raise loop**: lt<0.35 follows choreo to raise to lip; afterward a 0.6s cycle `cup = 1 − 0.46·(1−cos 2πu)/2` (cup descends away from lips to 0.54 and returns); when cup is at the lips, tilt head `sip += 0.3·clamp((cup−0.78)/0.22)·(0.65+0.35·sin 13lt)`, head angle to ~0.2rad. This contributes the most.
- **Inscription being written**: every 0.12s, pick 6 glyphs from a shuffled glyph table (seed 77, across all columns): erase with the wall texture `drawImage` sub-rectangle, then trace strokes with `setLineDash([p·95, 999])` (each sub-path's dash restarts from the beginning — looks exactly like stroke-by-stroke writing), fill colors appear only when p>0.55; ink color fades from bright gold `#f6c846` back to original color with 10px gold shadowBlur afterglow, written over 0.36s. About 18 glyphs writing simultaneously.
- **Aten pulse**: period 0.45s; ray lengths pulse ±9% across the fan in sequence (phase −0.55k, like a wave sweeping through), line width 2.2→3.8, tiny hands scale 0.9–1.2, finger spread 0.03–0.45; disc outer gold glow + bright ring pulsing, disc redrawn on top of glow to keep it red. Tiny hand coordinates clamped inside window (x 428–752, y≤512) — otherwise they'd be cut off by the window frame when rays extend.
- **Cat**: tail amplitude `tail·2.1 + 0.25·sin 9.5t`; both ears twitch quickly in opposite phase (~every 0.38s, 0.1s duration, rotate 0.32–0.38rad around ear-base midpoint).
- Lesson: fine-line motifs like Aten rays and water-sign glyphs barely register in the 480×270 frame diff. **To test "visibly moving" you need large-area local motion** (arm + head, full-glyph erase-and-write); fine-line wobble can only be a supplement. First version used a semi-transparent orange overlay on the sun disc — at peak it turned the red disc orange; changed to disc-outer glow + bright ring.
