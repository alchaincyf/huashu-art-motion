# 17_ink · Chinese expressive ink painting (Bada Shanren/Qi Baishi)

[中文](../../风格配方/17_ink.md) · **English**

> Source: migration test A (implemented by an independent agent reading only the skill, 2026-10-04). Integrated scene code was ported to `scripts/engine/scenes/17_ink.js`.

Experimental filename `scenes/01_ink.js` (313 lines). Frame difference 0.45↔0.9s is 3.3% (threshold 24), median adjacent-frame difference 0.62%, no still frame pairs.

**Pipeline** (opposite of reference 09: paper is the base; ink is added, not spread over everything). Start with `lt += 0.12`, so frame 0 already contains the first few strokes rather than blank paper (review noted a blank first frame cannot serve as a cover).
Xuan paper (cached) → washes: pale-ink distant mountains, vermilion sun → mist bands (paper-colored blurred ellipses drifting horizontally) → passing bird → static strokes: window, desk, floor line, cached when finished → bamboo (three-leaf clusters) → Qi Baishi shrimp in hanging scroll → cat: ochre wash + dry dark ink → girl: indigo wash + outline drawing + clothing folds → fine steam → seal.

**Xuan paper**
`P.texture('#efe6d0', scale .0025, amt 9, grain 7)`. Overlay 2600 short paper-fiber arcs: half brown α.05–.13, half light α.12–.27. Add radial vignette, α.22 at edges.

**Brush `brush(c, pts, {w, tone, dry, reveal, bristles, head, tail})`**
- Densify points with Catmull-Rom, then resample at equal 4px arc lengths (`KIT.resample`). Without resampling, dry-brush noise frequency changes with stroke length.
- Pressure: `prof(q) = smoothstep(0,head,q) · (1−0.7·smoothstep(1−tail,1,q)) · (0.85+0.15·noise)`.
- Wet core: fill entire stroke with a ribbon, width `w·prof·(1−0.85·dry·q^0.8)`, α = tone×0.72. It narrows toward the end as ink runs out.
- Bristles: one **continuous** polyline each, lateral offset ±0.475w·prof. Break when noise `noise(k·1.9, i·0.09)` is below `dry·q^1.2·0.95+0.05`; exposed paper produces flying-white dry-brush gaps.
- Pitfall: the first version stroked each small segment separately with round caps; joins accumulated dark dots like bamboo joints or rope. Each bristle must be one continuous path with butt caps.
- Parameters: window frame w14–18, dry .45–.6; desk w22; clothing folds w4–6, dry .3–.4, tone .78; floor line w5, dry .85, tone .35.

**Wash layer `washLayer`**
- Draw shape on scratch, then multiply onto paper in two passes.
- Outer wash: `blur(halo·(0.4+grow))`, α = haloA·grow.
- Body: `blur(blur·(1.6−0.6grow))`.
- grow moves 0→1 with lt: initially blooms into existence, then outer wash keeps slowly widening, like ink spreading on paper.
- Girl halo 12, α.6; cat halo 9, α.78; distant mountains halo 14.

**Reserved blank space**
- Remove cat white areas (muzzle, chest, paws) from the ochre layer with `destination-out`, revealing paper. More ink-painting-like than painting white.
- Remove the girl's crossed-collar undershirt the same way.
- Fill face with paper color, then draw 1.8px dry dark-ink outlines.

**Color**
- Ink `[16,14,12]`, five tone levels (dry-dark .9 / dense .8 / heavy .6 / light .35 / clear .15).
- Ochre (cat) `#c47a3c`; indigo (clothing) `#6f8aa0`, wide sleeves `#7d97ab`; gamboge (blond hair) `rgba(226,170,52,.75)` multiply.
- Rouge only at three spots: belt, hairpin bead, lips, using `[190,40,40]`. Also vermilion sun `#d8553f`, seal `#c4281e`.

**Motif motion**
- **Opening stroke reveal**: lt 0→0.45, each stroke `reveal = ss(d, d+l, lt/0.45)`, sequentially window, desk, bamboo, cat, person.
- Bamboo: segmented pale-ink main branch, swinging around (835,70) by `sin(2.9t)·0.11`, more toward tips. Five three-leaf clusters (L110, w15), flipping by `sin(7t+g)·0.2`.
- Mist: four paper-colored ellipses, blur 14, α.72, drifting 150–270px/s, mountains appearing/disappearing behind them.
- Bada-style bird: passes from window right at 420px/s, two wing strokes, about eight flaps/s (`sin(52·lt)`).
- Qi Baishi shrimp (two in scroll, 1.45×): six pale-ink segments + dry dark-ink stroke along carapace center, two long/two short whiskers with traveling waves, three-segment long claws, body bending `sin(7t)·0.12`, swimming along curves.
- Bada's upturned white eyes: cat pupil dots touch upper eye sockets, looking skyward.
- Seal: lt 0.3–0.4 presses from 1.5× to 1×, multiply; white-on-red inscription "白石" (Baishi).

**Pitfalls**
- Draw static strokes live during reveal, then cache once as `ink_static`; otherwise every frame redraws thousands of bristles.
- Bird path initially crossed bamboo leaves and was invisible; move above mist bands to y≈470 so it reads.
- Multiply washes are translucent: windowsill ink showed through cat ears and table legs through skirt, read in review as incorrect layering. Fix by filling paper color inside cat/clothing silhouettes first (clip then drawImage paper), then wash. This reserves the area on the paper first.
