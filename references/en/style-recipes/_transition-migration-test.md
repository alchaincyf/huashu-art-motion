# Transitions added by migration tests (A–D)

[中文](../../风格配方/_转场_迁移测试.md) · **English**

<!-- From migration test A -->
## Transitions (new block at the end of `transitions.js`)

| Transition | Entering | Technique and parameters |
|---|---|---|
| `goldLeaf` 0.5s | Klimt | 72px squares. Order key = distance from girl's head (1300,380)×0.78 + polar angle×0.12 + random×0.08, spreading gold leaf in a spiral. Each square q=(1.32p−key)/0.32: at q<0.5, a gold leaf rotates into place from 1.3× scale; gold-gradient highlights move with q over dark spiral, eye, or concentric-circle patterns. At 0.5<q<1, B appears and gold fades. |
| `screamWarp` 0.5s | Munch | Sine-warp old image by rows, amplitude 70e. Wavefront `y = lerp(−180, H+220, e) + 80sin(x·.0055 + 7p)` moves down; new image above (warp amplitude 60(1−e) gradually settles). Four 26px color bands on the front: `#b82a1e #e2541c #f08a24 #f4c03a`. |
| `apsara` 0.5s | Dunhuang | Front `x = lerp(W+260, −300, e) + 110sin(y·.006 + 5p)` sweeps right-to-left; new image on right. Three ribbons on front (malachite green, earth red, azurite blue, widths 44/38/32, traveling waves, white dashed floral lines). Left of front, old-image fragments (actual A pixel blocks) flip and fall on parabolas: old paint peeling. |
| `dotBloom` 0.48s | Kusama | 58px hex grid, dots grow in distance order from cat (540,760) (outBack, maximum 0.74× spacing, exactly filling screen); clip new image inside dots. Incomplete dots have white outlines fading out. |

---

<!-- From migration test B -->
## Transitions `transitions_b.js`

| Entering | Name | Technique | Parameter | Per frame |
|---|---|---|---|---|
| Dalí | `melt` | Old image sags in 4px vertical columns (`sag = 0.22·edge·e`, stretch 0.3); new image above liquid edge(x); edge = descending line (−160 → H+40, easeInOut) + 26 round-ended drops (width 10–32, length 60–280, profile `(1−u²)^0.3`, individual start phases) + sin wave; dark liquid-edge outline (blur 3) + highlight | 0.36s | 86ms |
| Hopper | `sunShaft` | Old image sinks into shadow under cool-green `multiply` `rgba(70,120,110, 0.7·min(1,2p))`; right edge of slanted light block (slope 260px) sweeps screen, containing new image + warm `screen` light (0.45 → 0 over p 0.6–1) + moving diagonal mullion shadow; bright leading edge | 0.34s | 76ms |
| Ghibli | `bleed` | Five color blooms open in t0 order (window first), radius `q·1400·k`, q=easeInOut(seg(p,t0,t0+0.66)), boundary `R·(1 + 0.28·fbm(角度) + 0.05·sin 9a)` (angle); outer 70px bright halo blur 18 (water arrives first), new image inside, edge 5px `multiply` brown tide mark. Both halo and tide-mark α multiplied by (1−q) | 0.38s | 127ms |
| Vaporwave | `vhs` | Old image first half, new second; p 0.38–0.62 loses field sync, whole image rolls up + 40px black strip; random 6–54px-high tear bands sampled from A/B (probability of B = p), horizontal offset ±130·sin(πp); magenta/cyan single-channel copies `screen` offset ±14; 160 static-noise lines | 0.30s | 88ms |

Shared principle: each transition is the new style's physical process, rather than a generic wipe: melting is liquid, Hopper is light, watercolor is water, VHS is tape. Ask first: "Through what physical process would this style's image appear?"

---

<!-- From migration test C -->
## Transitions (`transitions_c.js`)

| Entering | Name | Technique and parameters |
|---|---|---|
| Monet | `ripple` | (Distance denominator 1700; supplementary fade-in from p>.7 ensures corners clear by p≈.85.) Old image shifts horizontally in 6px row strips, `dx=sin(0.045y−26p)·46·sin(π·min(1,1.2p))·(0.4+|y−cy|/H)`, like disturbed reflections. Reveal new image through 3600 **horizontal short-stroke ellipses** (length 40–110, height 9–17), spreading rings by elliptical distance from cup (1000,600), y×1.9. Three pale dashed ellipse rings at front, dashOffset follows p; 140 horizontal water highlights flash mid-transition. Additional fade-in at p>.85. |
| Seurat | `pointill` | Grid pitch 14: dots grow 0→r6.4 (first 30%); old image beneath fades to paper. Dot color-switch time `0.5·(0.6x/W+0.4y/H)+0.25·hash+0.15`, upper-left first with randomness; at switch, dot jumps to 1.35×. At p>.6 new image appears under dots; at p>.7 dots retract. One getImageData each for A and B per frame. |
| Matisse | `cutouts` | Cobalt-blue paper width 1100px (sin-irregular scissor edges left/right) sweeps right-to-left, shadow (14,10) blur 12. Paper bears 260 gouache strokes, pinned white/yellow seaweed (stem + seven fingers), yellow/pink six-point stars (rotate with p), red discs, each with shadow. New image behind paper's right edge. |
| Haring | `radiant` | V-shaped dancing figure, scale `s=0.15·320^easeInOut(p)`, grows from cup origin. First 30px black outline + black fill; then white limbs offscreen, `source-in` new image, putting it inside body; 16 radiating lines step at 8fps; supplementary fade-in from p>.82. First exponent too slow (`0.08·40^…`, only 300px high over first 80%, hard cut at end); second `0.15·120^…` still left gaps at end, requiring about one-frame fade, judged a flash frame. Final `s=0.15·320^easeInOut(p)`. |

**General transition lessons**:
- Pixel-reading transitions (pointillism, water ripples) call getImageData on A/B each frame, about 10ms each, acceptable.
- For a new image hidden inside a shape built from multiple parts, avoid `clip(并集 Path2D)` (union Path2D): inconsistent subpath winding cancels into holes. Fill white offscreen, then use `source-in` instead.

<!-- From migration test D -->
## Transitions (D section at the end of `transitions.js`)

| Transition | New style's signature | Technique and parameters |
|---|---|---|
| `irisFilm` Rembrandt→rubber hose | 1930s cartoon iris + old film | ① p<0.5: gradually apply `sepia(q) grayscale(0.7q) contrast(1+0.3q)` to old image, black iris closes toward cup rim (1236,420), R = R0·(1 − easeIn(q)), R0 distance to farthest corner. ② p≥0.5: new image pops open by R0·outBack(q). ③ 48 circumference segments jitter ±1.5% at 12fps. ④ Film flicker, scratches, dust throughout. |
| `lampGlow` rubber hose→shadow puppetry | Backstage lamp lights | ① Old image multiply rgba(70,34,12, min(1, 2.2p)), darkens like lamp extinguishing. ② Reveal new image with destination-in radial mask (solid inner 0.55R, transparent edge), R = 1500·inOut(seg(p, .12, 1)), flame jitter ±7%. ③ lighter warm halo sin(πp) plus small flame. |
| `flareSweep` shadow puppetry→Shinkai | Light leak/sweep | Diagonal (k=0.35) dividing line sweeps −500→W+700 (inOut). New image left, old right. Three lighter bands on boundary: width 520 α0.55 warm, 160 α0.85 white, 60 α0.6 cyan. Also horizontal streaks, 40 light particles, three hexagonal ghosts. |
| `blueBrush` Shinkai→Blue Period | Color drained + broad dry brush | ① Old image `color` overlay rgba(45,90,148, min(1, 2.2p)) leaves only blue, then multiply darkens. ② Six broad strokes (height H/6+90 each), alternating tilt ±18, brush left-to-right sequentially, starts offset 0.07. Head is quadratic curve with 6–7px sine jitter at upper/lower edges. ③ In 80–280px behind head, 26 dark/light gradient bristle lines (paint not yet evenly spread). |

General transition design sequence (suggested addition to layer three of reference 02): find the new style's physical process that appears, lights up, or sweeps through → use it to contaminate old image first → reveal new image inside that process's shape → add a brief highlight or overshoot on the beat.
