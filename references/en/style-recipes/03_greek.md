# 03_greek · 530 BC Attic Black-Figure Pottery — Code Painting Notes

[中文](../../风格配方/03_greek.md) · **English**

File: `scenes/03_greek.js` (pure Canvas 2D, no images). Final self-check: warm max 15.9ms / mean 7.6ms / cold 80ms; determinism pass; 0.2↔0.7s motion diff 22% pixels moving.

## One-line Secret
Black-figure = **black-glaze silhouette + incised lines + added colors** — the three essentials, none dispensable:
- Silhouette: all figures/objects filled `#1b120d` (near-black with warmth), no outline stroke; shape readable from silhouette vs. clay ground contrast.
- Incised lines: "scratched through" the black silhouette — draw 1.5–2px fine lines in bright clay orange `#e8904c` (drapery folds, facial features, boundaries between overlapping limbs).
- Added colors: purple-red `#8a2a37` bands (headband, cuffs, hem, collar, seat cushion) + white dots (`#f6ead6`, r≈2, spacing 11–17px).
Nailing these three requires no texture at all — instantly reads as a Greek vase.

## Palette
Clay `#dc6a2f`, bright clay (vase panel) `#e8803f`, black glaze `#1b120d`, purple-red `#8a2a37`, white `#f6ead6`, incised-line `#e8904c`, golden hair `#f2bd48`, clay reserved (cat white area) `#f3cfa4`, cat orange `#f2913f`, cat nose `#e7897a`.

## Pipeline and Parameters
1. **Clay ground (cached `gr_bg`)**: 480×270 low-resolution per-pixel fbm(×0.016, 4 octave) mottling ±30 + `noise(x*0.006, y*0.85)` **horizontal band noise** (throwing marks) ±9, upscaled to 1920×1080 (low-frequency is already blurry, saves 16× computation); then 560 random horizontal fine lines (length 150–1050, alpha 0.03–0.08, dark/light two types) as throwing texture; 420 dark dots + 120 light dots; two layers `P.grain`; 5 cracks (every 9px, ±2px jitter, bright edge line offset 1px below gives instant thickness). Center adds a warm radial brightening of 0.16. Cold start entire frame ~80ms.
2. **Vignette (cached `gr_vig`)**: radial 380→1180, outer edge rgba(30,6,0,.62), final layer over the entire frame (including bands).
3. **Static black-figure layer (cached `gr_static`)**: frame (black border 18px + white dot chain 11.6px spacing + inner fine line), grapevine (sine stem + triangular grape clusters 3-2-1 dots), table (legs with paw feet), lathe-turned chair legs (width table [y,w] polyline symmetrized), swan-neck chair back (13px thick stroke curve + ellipse head + triangular beak), amphora (24-point symmetric outline→`RIG.smooth`, vase panel: clay reserved + small black cat, base spoke pattern, one vertical 0.09 gloss gradient), two sections of Greek inscription.
4. **Greek inscription**: font library has no Greek glyphs → custom **stroke table** (each letter 1–3 polyline segments, unit grid 0..1). Glyph height 30, stroke width 3.4, each letter height ×(0.9–1.06) random, baseline ±6% jitter, vertex ±0.7px jitter; Ο drawn as small circle (letter height 0.25, original has small o), Ι width 2px. Hand-painted pottery inscription feel comes mainly from "unequal letter heights + small o."
5. **Scrolling bands**: top meander (period 60px, 7px black line, unit polyline `[[4,46],[4,0],[50,0],[50,34],[18,34],[18,14],[36,14],[36,22]]` + full-length baseline) and bottom lotus-bud chain + spoke pattern (period 76px = two 38px units, odd buds filled purple-red, so true period is 76) — each pre-rendered as a W+2P wide strip; each frame `drawImage(strip, -(off mod P))`. Offset curves:
   - Top: `off = 22·lt + 60·easeInOut((lt−0.49)/0.35)`, leftward;
   - Bottom: `off = −(18·lt + 76·easeInOut((lt−0.477)/0.367))`, rightward.
   Original only does one easeInOut period jump at frames 169–191; I added 18–22px/s constant drift so the first 0.47s also shows movement.
6. **Motifs inside the frame** (drawn every frame, clipped to frame): 6 dolphins (custom Bézier silhouette: snout, dorsal fin, pectoral fin, tail fork + belly incised lines + white eye dot) sway ±9px along their own heading, ±0.12rad, period 0.85s, phase offset 1.3 between them; ship as a whole bobs ±4px around (560,420), rocks ±0.025rad, period 0.9s. White sail + purple-red stitching, crescent hull + scorpion-tail stern, purple-red cabin, reclining figure.
7. **Lyre**: pivots on nail (1050,150) `0.09·sin(2π·lt/0.8+0.5)` swing (±5°, ±17px at soundbox, clearly visible within 1s). Tortoise-shell soundbox = black circle + incised ring + 5 incised small circles.
8. **Rosette**: 8 black ellipse petals + incised petal divisions + purple-red center, `lt·1.6` rad/s alternating rotation.
9. **Orange-white cat** (drawn manually, not using RIG default polygon; tail uses `RIG.cat` tailPts following choreo.tail): whole scaled 0.9 anchored at (548,903) to fit the standard frame; orange silhouette + black outline 3.4px; white chest/paws/muzzle uses clay-reserved cream color; **back tiger stripes: take 12 points evenly distributed by arc length along the back outline, draw tapered stripes pointing toward body center (575,800)** (length 30–48, root width 10) — far more natural than hand-placed stripes; thigh arc, foreleg vertical stripes; ancient large round eye (white sclera + black iris + highlight + one brow arc above), blink switches to an arc; purple-red collar with white dots.
10. **The girl**: `RIG.girl({cup,sip,breathe,s:0.97,dy:-14,hair:'long'})` — scale and offset put feet on ground line 903.
    - Body directly fills RIG Path2D (farSleeve/skirt/torso/neck), far-side hand replaced with a small ellipse (RIG's farHand looks like a knife blade in the black silhouette).
    - **Head drawn manually**: Greek profile (straight nose-to-forehead, fine chin) + hairstyle outline written in RIG's static coordinate system; head motion replicated with canvas transform: `translate(neck)·rotate(G.tilt)·translate(−neck)·T`. Same matrix computed separately as `DOMMatrix`, `Path2D.addPath(faceSil, M)` for the incised-line clipping region.
    - **Golden hair** (key to reading "golden-haired girl"): within hair-region clip, 11 wavy top-of-head locks (quadratic Bézier + normal 2.6px·sin(7πu) wave), 8 long back curls (sine 4.5 half-waves + small spiral at tip), double-spiral bun, 4 small curls at forehead, 2 spiral curls at temples (dark 6px base line + gold 2.2px, readable even crossing the silhouette). Gold line 2.5px at 1080p is just enough "weight" — at 2px it disappears in the thumbnail.
    - Incised lines: 16 drapery folds (clipped inside body), almond eye (light-colored sclera + black iris, frontal eye on profile face), brow, nostril, lips, chin. **Boundary between near-side arm overlapping body/head**: clip(body∪head) then describe arm outline incised line — black-on-black can only be separated this way; when the cup is raised to the lips the face doesn't smear.
    - Added colors: 15px purple-red hem band + white dots, cuff band (clipped inside upper arm, 15px wide band along upper-arm normal + incised lines above and below), bracelet, 8 white-dot four-petal flowers, headband.
    - Kylix cup (wide shallow two-handled, half-width 32) follows `G.cup` (including tilt), purple-red cup rim line; steam is three "≀" black fine lines, phase `t·9`.

## What Moves (all visible within 0–0.94s)
Cup raise (choreo.cup 0.9s raise to lips + slight head tilt), cat tail/blink/breathing, top/bottom band scrolling (drift + beat period jump), lyre swing, ship bob, dolphin swim, rosette spin, steam twist.

## Pitfalls
- RIG hair outline at full scale puts the back of the head too wide (first version extended to x=1450, like a helmet); pulled back to 1424 per design spec, long hair hangs only to y≈558.
- Cup at the lips: black hand + black cup + black face merge into one blob: ① incised-line boundary between arm and head ② smaller cup (half-width 44→32) ③ purple-red line on cup rim.
- RIG cat head top at y=535, standard-frame cat top is 610; at full size it presses against the lower edge of the frame.
- Bottom band alternating odd/even buds means the true period is 2 units (76px); the pre-rendered strip wrap period must be 76, otherwise color jumps every 38px.
- `P.grain` seed = key length; two grain layers must have keys of different lengths, otherwise the patterns are identical.
- **Cup raise endpoint must be period-appropriate (review rework)**: RIG's cup→mouth endpoint is near the nose tip with cup tilt −0.45rad; with the wide shallow kylix it looks like a bird beak or pipe stuck in the face, and the hand covers the mouth and chin. Changed to custom IK: lip point rest(1243,391) transformed to screen via head DOMMatrix; cup-rim center = lip point −(30,−1) (right edge of rim just touching the lips), tilt angle −0.08·cup (≤5°), hand IK target = cup rim +(lerp(32,6,cup), 30), i.e., cupped under the base; `RIG.ik2(S, hand target, 165s, 122s, −1)` + `RIG.taper` for upper arm/forearm. Forearm vertical in front of the chest, nose/lips/chin profile fully visible. Steam follows cup rim.

## v1 Film Review Rework (cat changed to black-figure + top band scroll increased)
- **Cat must use the same visual language as the figure**: bright-orange large-eye cartoon cat is immediately jarring in black-figure. Changed to black-glaze silhouette; "orange and white" only via added color and incised lines: a 26px purple-red saddle band drawn along the back outline, a purple-red patch on the crown (ellipse 46×22 clipped inside head), tail black base + 7px purple-red core; tiger stripes are all clay-orange `#f2913f` 3px **incised lines** (14 curved lines from the back outline by arc length toward body center + 3 thigh + 3 foreleg + tail ring every other point); white chest/muzzle/paws use white paint `#efe1c8`, claws with black incised toes; eye changed to ancient-style incised-line almond eye (white-paint sclera + vertical-oval black iris + small incised line at eye corner), blink is a downward-curved incised line; nose purple-red, left whiskers in incised line (falls on black face), right whiskers in black (falls on clay).
- **Periodic pattern scrolling by integer multiples = first and last frames identical**: after the top band jumps one period, the frame looks exactly the same as before the jump — very easy to call "not moving" when comparing stills or sampling frames. Constant drift increased from 22→48px/s (bottom band 18→30px/s), ensuring any two frames have a phase difference.
- Full-film static-segment motion (480×270 mean frame diff): 03_greek 1.87 → 2.02, original 2.06. warm max 17ms.
