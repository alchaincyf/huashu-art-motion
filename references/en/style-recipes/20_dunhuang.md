# 20_dunhuang · Dunhuang Murals (Mogao Caves · High Tang)

[中文](../../风格配方/20_dunhuang.md) · **English**

> Source: Migration Test A (stand-alone agent working read-only from skill, 2026-10-04). Scene code ported after integration to `scripts/engine/scenes/20_dunhuang.js`.

Experimental filename: `scenes/04_dunhuang.js` (215 lines). 0.45↔0.9 s diff 6.6%; median adjacent-frame diff 1.98%.

**Pipeline**
Red-earth ground coat (cached): `P.texture #a5452f`, dark `#7a3020`, sparse faded roundel flowers, top border vine scroll + triangular hanging valance (celadon/green/white/red alternating + gold beads) → window = stone-blue sky: auspicious clouds, flying apsara → vine-scroll window frame → lotus-tile floor (cached) → waisted low table, oil lamp → cat → girl (Tang-dynasty donor figure) → heat-shimmer scroll clouds → ceiling flowers → weathering overlay.

**Line and colour**
- Iron-wire brushwork: uniform 2.6 px, colour `#5a2414`. Face uses a redder `#8a3a24`.
- Mineral pigments: red earth `#a5452f`, malachite green `#3f8f6e / #6ab08e`, azurite blue `#2f5f8f / #5a86b0`, white `#ecdfc4`, gold `#d8b05a`.

**Tang-dynasty costume**
- Joined-colour skirt: red ground, diagonal trapezoidal green stripes every 44 px, widening downward with x.
- Stone-blue short jacket, white crossed collar, high-waisted red sash.
- High chignon: two ellipses stacked above headTop, with gold hairpin and three flower ornaments.
- Facial makeup: floral dian (four-petal red flower on forehead), diagonal rouge (a red arc at the temple), lip dot, moth-eyebrow.
- Teacup is Yue-ware celadon.

**Scarf shawl `shawl(pts,w)`**
- Travelling-wave point array → ribbon, with white dashed floral pattern and red dots.
- Rear segment: `x = back + 230q + 64q·sin(4.2q − 5.5t)`, trailing 30% rises upward.
- Front segment drapes down around the arm.
- Pitfall: the first version had only 18–34 px lateral swing and hung almost vertically, reading like a chair's vertical post. Lateral displacement must reach 200 px or more; combined with the upswept tail, it finally reads as billowing silk.

**Flying apsara (飞天)**
- Reclining facing left, at 1.35× scale, flying past the window at 300 px/s.
- Three streaming ribbons as travelling waves; one arc starts at the shoulder, curves over the head, and sweeps behind — this grand arc is the apsara's most recognizable shape.
- Halo, hair bun, flower tray offering.
- Auspicious clouds are round puffs + tapering cloud tails, drifting at 40–76 px/s.

**Weathering overlay**
- Global `saturation` blend α.3 desaturates; then a `multiply` layer of pale earth texture α.5.
- Per-pixel flaking: `fbm(x·.0032)+0.12·noise(x·.03) > 0.3` exposes white-grey ground coat `#d8c6a2`; 0.28–0.3 is the dark hairline at the flake edge.
- Protected zones around both faces — no flaking there.
- 500 crackle lines random-walk; 380 px smoke-stain gradient at the top.
- Pitfalls:
  - Using noise frequency .006 produces a screen full of sesame-seed specks, like stains. Dropping to .0032 and raising the threshold yields proper patch-sized flaking.
  - Final version sets the cat (380–720, 530–920) and the girl (1070–1530, 240–950) as protected zones; only the background flakes.
  - Diagonal rouge α reduced to .32, otherwise it reads as a wound.
  - The apsara's halo was a solid green circle in the first version — read as a "swim ring"; changed to α.28 semi-transparent with fine lines.
  - Cat at `#c8843a` turned brownish-yellow after desaturation; changed to `#e08a3a`; also added `look: sin(2.6t)` head turn and increased the breathing amplitude 2.5× — otherwise only the tail moved throughout.

**Motif animation**
- Ceiling flowers: 30 four-petal blossoms rotate and flip as they fall.
- Oil lamp: flame flickers `1+0.12sin(17t)+0.08sin(29t)` with glow halo.
- Pigment chips: 10 pieces detach from flake edges, tumble in parabolic fall.
- Cat's collar bell sways.
