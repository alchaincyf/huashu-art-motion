// 1899 Monet Water Lilies and The Japanese Footbridge — entirely procedural.
// Pipeline (following 09_postimp benchmark): ① flat underpainting (wall = Orangerie-style water-lily mural, window = green arched bridge, floor, tablecloth)
//   → ② repaint in flow-field brushstroke passes (horizontal water / fine window landscape / floor / props), regional palettes
//   → ③ flat characters with fine source-atop strokes, add only facial features (Impressionism avoids outlines)
//   → ④ animated highlights: water glints tremble (10fps flicker), lilies float, willow reflections ripple sideways, ripples expand, wisteria sways
SCENES['28_monet'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2, { clamp, lerp } = U, P = PAINT;
  const WIN = [372, 142, 416, 396];                       // Inside window
  const inWin = (x, y) => x > 360 && x < 800 && y > 130 && y < 550;
  const inFrame = (x, y) => x > 300 && x < 862 && y > 100 && y < 598;
  const isFloor = (x, y) => y > 704;

  // Lily-pad clusters in mural (fixed layout, floating over time)
  const r0 = U.rng(4242), PADS = [];
  [[150, 210, 7], [260, 520, 9], [930, 170, 6], [1030, 430, 8], [1640, 330, 7], [1760, 600, 8], [120, 400, 5], [1450, 120, 5], [1250, 600, 6], [700, 640, 7]].forEach(([cx, cy, n], k) => {
    for (let i = 0; i < n + 3; i++) PADS.push({ x: cx + (r0() - 0.5) * 300, y: cy + (r0() - 0.5) * 90, rx: 38 + r0() * 40, ry: 12 + r0() * 9, notch: r0() * TAU, flower: r0() < 0.4, ph: r0() * TAU, k });
  });
  const pad = (p, t) => [p.x + Math.sin(t * 1.3 + p.ph) * 7 + t * 6, p.y + Math.sin(t * 1.9 + p.ph * 1.3) * 2.5];

  function base(g, t) {
    // ---- Mural: water (light above, dark below; purple, blue, green) ----
    const wg = g.createLinearGradient(0, 0, 0, 700); wg.addColorStop(0, '#b9c7e6'); wg.addColorStop(0.35, '#8fa6d6'); wg.addColorStop(0.7, '#6c84bf'); wg.addColorStop(1, '#5a72a8');
    g.fillStyle = wg; g.fillRect(0, 0, W, 704);
    // Reflected skylight (pale pink-yellow clouds)
    [[600, 120, 260, 50], [1300, 260, 300, 60], [200, 600, 200, 40], [1500, 520, 220, 40]].forEach(([x, y, rx, ry], k) => { g.fillStyle = k % 2 ? '#e8d6e8' : '#f2e2c4'; g.beginPath(); g.ellipse(x + Math.sin(t * 0.8 + k) * 10, y, rx, ry, 0, 0, TAU); g.fill(); });
    // Willow reflections (vertical dark green-purple, ripple sideways over time)
    [[70, 0.9], [150, 0.7], [1560, 0.8], [1660, 1], [1840, 0.7]].forEach(([x0, a], k) => {
      g.fillStyle = k % 2 ? '#3f6a58' : '#4f5f8f';
      g.beginPath(); for (let y = 0; y <= 700; y += 20) g.lineTo(x0 + Math.sin(y * 0.03 - t * 3.2 + k) * 14, y);
      for (let y = 700; y >= 0; y -= 20) g.lineTo(x0 + 46 * a + Math.sin(y * 0.03 - t * 3.2 + k + 0.6) * 14, y); g.closePath(); g.fill(); });
    // Lily pads and flowers
    PADS.forEach(p => { const [x, y] = pad(p, t); g.fillStyle = p.k % 2 ? '#5f8f4a' : '#7aa85a'; g.beginPath(); g.ellipse(x, y, p.rx, p.ry, 0, p.notch + 0.35, p.notch + TAU - 0.35); g.lineTo(x, y); g.closePath(); g.fill();
      if (p.flower) { g.fillStyle = p.k % 3 ? '#f2a6bf' : '#fbf4f0'; g.beginPath(); g.ellipse(x + 6, y - 7, 17, 10, 0, 0, TAU); g.fill(); g.fillStyle = p.k % 3 ? '#fff2f2' : '#f6d86a'; g.beginPath(); g.ellipse(x + 6, y - 11, 8, 6, 0, 0, TAU); g.fill(); } });
    // ---- Floor: warm wood ----
    const fg = g.createLinearGradient(0, 704, 0, H); fg.addColorStop(0, '#b98a6a'); fg.addColorStop(1, '#d6a874'); g.fillStyle = fg; g.fillRect(0, 700, W, H - 700);
    g.fillStyle = '#7a6a9a'; g.fillRect(0, 696, W, 10);
    // ---- Window: Japanese bridge ----
    g.save(); g.beginPath(); g.rect(...WIN); g.clip();
    g.fillStyle = '#3f6a3a'; g.fillRect(...WIN);
    // Upper half: dense foliage and wisteria
    for (let i = 0; i < 60; i++) { const r = U.rng(i * 17 + 3), x = 372 + r() * 416, y = 142 + r() * 150; g.fillStyle = ['#4f8a3a', '#6fa040', '#2f5a30', '#9cbf58', '#3a6a5a'][i % 5]; g.beginPath(); g.ellipse(x, y, 30 + r() * 30, 20 + r() * 20, 0, 0, TAU); g.fill(); }
    // Lower half: pond and lilies (perspective: smaller farther away)
    const pg = g.createLinearGradient(0, 330, 0, 538); pg.addColorStop(0, '#6f8f9a'); pg.addColorStop(1, '#4f6f8a'); g.fillStyle = pg; g.fillRect(372, 330, 416, 210);
    for (let row = 0; row < 7; row++) { const y = 352 + row * row * 4.2 + row * 6, s = 0.4 + row * 0.16; for (let i = 0; i < 6; i++) { const x = 380 + ((i * 83 + row * 47) % 420) + Math.sin(t * 1.4 + i + row) * 5;
      g.fillStyle = (i + row) % 2 ? '#7aa85a' : '#9cc070'; g.beginPath(); g.ellipse(x, y, 28 * s, 7 * s, 0, 0, TAU); g.fill(); if ((i * 3 + row) % 4 === 0) { g.fillStyle = '#f4b0c4'; g.beginPath(); g.arc(x, y - 3 * s, 6 * s, 0, TAU); g.fill(); } } }
    // Bridge reflection (rippling green arc)
    g.strokeStyle = '#4f8a6a'; g.lineWidth = 9; g.beginPath(); for (let x = 372; x <= 788; x += 8) { const q = (x - 580) / 208, y = 352 + 46 * (1 - q * q) + Math.sin(x * 0.08 + t * 6) * 3; x === 372 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
    // Bridge: green arch, handrails, vertical balusters
    g.fillStyle = '#24452a'; g.beginPath(); for (let x = 350; x <= 810; x += 6) g.lineTo(x, arc(x, 62) - 60); g.lineTo(810, 360); g.lineTo(350, 360); g.closePath(); g.fill();   // Dark tree shade behind bridge
    g.restore();
  }
  const arc = (x, lift) => { const q = (x - 580) / 230; return 330 - lift * (1 - q * q); };
  function bridge(g, t) {
    g.save(); g.beginPath(); g.rect(...WIN); g.clip();
    g.strokeStyle = '#7fcf9a'; g.lineCap = 'round';
    g.strokeStyle = '#3f8a62'; g.lineWidth = 20; g.beginPath(); for (let x = 350; x <= 810; x += 6) { const y = arc(x, 62); x === 350 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); g.strokeStyle = '#8fdcae';   // Bridge deck
    g.lineWidth = 8; g.beginPath(); for (let x = 350; x <= 810; x += 6) { const y = arc(x, 62) - 46; x === 350 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();             // Handrail
    g.lineWidth = 6; g.beginPath(); for (let x = 350; x <= 810; x += 6) { const y = arc(x, 62) - 24; x === 350 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
    g.lineWidth = 5; for (let x = 360; x <= 800; x += 30) { g.beginPath(); g.moveTo(x, arc(x, 62)); g.lineTo(x, arc(x, 62) - 46); g.stroke(); }
    // Hanging wisteria blossoms (swaying)
    for (let i = 0; i < 12; i++) { const x = 386 + i * 36, sw = Math.sin(t * 2.4 + i * 0.9) * 8, L = 40 + (i * 37 % 50); for (let j = 0; j < 9; j++) { const q = j / 8, px = x + sw * q * q + Math.sin(j * 2.1 + i) * 4, py = 150 + L * q * 1.2; g.fillStyle = ['#b8a0dc', '#d6c0ee', '#9a86c8', '#e8dcf6'][(i + j) % 4]; g.beginPath(); g.ellipse(px, py, 8 * (1 - q * 0.6), 6 * (1 - q * 0.5), 0.3, 0, TAU); g.fill(); } }
    g.restore();
  }
  function frameArt(g) {
    // Cream window frame and green shutters on both sides (Giverny house)
    g.fillStyle = '#4f9a6a'; g.fillRect(268, 110, 70, 470); g.fillRect(822, 110, 70, 470);
    g.lineWidth = 22; g.strokeStyle = '#f3ecdc'; g.strokeRect(357, 127, 446, 426);
    g.fillStyle = '#f3ecdc'; g.fillRect(570, 142, 18, 396); g.fillRect(330, 548, 500, 28);
  }
  function props(g, t) {
    // Round table and white cloth (hanging folds)
    g.fillStyle = '#f2ecf2'; g.beginPath(); g.moveTo(800, 618); g.lineTo(1214, 618); g.lineTo(1226, 780); for (let x = 1226; x >= 788; x -= 24) g.lineTo(x, 780 + Math.sin(x * 0.12) * 8); g.closePath(); g.fill();
    g.fillStyle = '#d0c8e6'; for (let x = 830; x < 1200; x += 48) { g.beginPath(); g.moveTo(x, 640); g.lineTo(x + 10, 640); g.lineTo(x + 18, 780); g.lineTo(x + 2, 780); g.closePath(); g.fill(); }
    g.fillStyle = '#8a6a4a'; g.fillRect(860, 780, 20, 124); g.fillRect(1140, 780, 20, 124);
    // Blue-and-white porcelain pot and vase of irises
    g.fillStyle = '#e8eef8'; g.beginPath(); g.ellipse(900, 596, 40, 30, 0, 0, TAU); g.fill(); g.fillStyle = '#3f6ab8'; g.fillRect(864, 590, 72, 8); g.beginPath(); g.ellipse(900, 566, 18, 6, 0, 0, TAU); g.fill();
    g.strokeStyle = '#e8eef8'; g.lineWidth = 8; g.beginPath(); g.moveTo(862, 596); g.lineTo(838, 574); g.stroke();
    g.fillStyle = '#c8d8e0'; g.beginPath(); g.moveTo(1030, 618); g.quadraticCurveTo(1016, 586, 1036, 560); g.lineTo(1060, 560); g.quadraticCurveTo(1080, 586, 1066, 618); g.closePath(); g.fill();
    g.strokeStyle = '#5f8f4a'; g.lineWidth = 5; [[1040, 560, 1010, 480], [1048, 560, 1052, 456], [1056, 560, 1092, 490]].forEach(([a, b, c2, d], k) => { const sw = Math.sin(t * 2 + k) * 4; g.beginPath(); g.moveTo(a, b); g.lineTo(c2 + sw, d); g.stroke(); g.fillStyle = '#6a5ac8'; g.beginPath(); g.ellipse(c2 + sw, d - 8, 12, 16, 0, 0, TAU); g.fill(); });
    // Wicker chair (back behind girl)
    g.strokeStyle = '#c9a46a'; g.lineWidth = 12; g.beginPath(); g.moveTo(1440, 900); g.lineTo(1446, 500); g.quadraticCurveTo(1470, 460, 1494, 500); g.lineTo(1488, 900); g.stroke();
    g.lineWidth = 6; for (let y = 530; y < 720; y += 36) { g.beginPath(); g.moveTo(1446, y); g.lineTo(1490, y); g.stroke(); }
  }
  const angle = (x, y, t) => {
    if (inWin(x, y)) return y < 300 ? -1.2 + 0.8 * P.noise(x * 0.02, y * 0.02) : 0.04 * Math.sin(x * 0.03 + t);
    if (isFloor(x, y)) return 0.08 + 0.12 * P.noise(x * 0.01, y * 0.01);
    return 0.06 * Math.sin(y * 0.05 + x * 0.004) + 0.05 * P.noise(x * 0.01, y * 0.01);   // Water: horizontal strokes
  };
  const SW = {
    water: P.swatch(['#5b6fb5', '#7d8fd0', '#9db5e0', '#6aa0a8', '#b7a6d8', '#d9c8e8', '#8fb8a8', '#a6c4e8', '#c8b0d8'], 0.45),
    green: P.swatch(['#5f8f4a', '#7fae5a', '#3f6f4a', '#9cc070', '#6f9a7a', '#b4cc78'], 0.4),
    pink: P.swatch(['#f0a0b8', '#f7d0dc', '#fff2f4', '#e88aa0'], 0.3),
    willow: P.swatch(['#3f6a58', '#557a4a', '#2e5048', '#6a5f9a', '#4a6aa0'], 0.4),
    floor: P.swatch(['#c69a6a', '#b07a5a', '#d8b08a', '#9a6a7a', '#8a7aa8', '#e0bc90'], 0.35),
    leaf: P.swatch(['#4f7f3a', '#6f9a40', '#2f5a30', '#9cbf58', '#c0d070', '#3a6a5a', '#b8a0dc'], 0.35),
  };
  const palette = (x, y, col, r) => {
    const [R, G, B] = col;
    if (inWin(x, y)) return (R > 150 && G < 200) || (B > R + 30 && R > 150) ? null : SW.leaf(col, r);
    if (inFrame(x, y)) return null;
    if (isFloor(x, y)) return SW.floor(col, r);
    if (R > 200 && G < 190) return SW.pink(col, r);
    if (G > R + 15 && G > B - 10) return SW.green(col, r);
    if (G > R && B < 140) return SW.willow(col, r);
    return SW.water(col, r);
  };

  const girlFill = { skin: '#f6d8c4', hair: '#f0cc6a', dress: '#f6f2ec', cuff: '#f6f2ec', shoe: '#d8cce4', cupBody: '#eef2fa', cupRim: '#a8703a', locks: false };
  return {
    draw(c, lt, t) {
      const ch = P.choreo(lt, t);
      const b = P.scratch('moBase'), bg = b.getContext('2d'); bg.reset(); base(bg, t); frameArt(bg);
      c.fillStyle = '#e8e0ec'; c.fillRect(0, 0, W, H);
      c.drawImage(b, 0, 0);
      // Three brushstroke passes: water mural / fine window landscape / floor
      P.strokes(c, b, { cell: 9, len: 34, width: 6.5, angle, seed: 21, t, boil: 6, outline: 0, jitterCol: 14, palette, mask: (x, y) => !isFloor(x, y) && !inFrame(x, y) });
      P.strokes(c, b, { cell: 6, len: 13, width: 4.5, angle, seed: 22, t, boil: 6, outline: 0, jitterCol: 16, palette, mask: (x, y) => inWin(x, y) });
      P.strokes(c, b, { cell: 12, len: 34, width: 8, angle, seed: 23, t, boil: 0, outline: 0, jitterCol: 12, palette, mask: isFloor });
      // Window frame and shutters: finer vertical/horizontal strokes (separate pass so large strokes do not break them up)
      P.strokes(c, b, { cell: 6, len: 12, width: 4, seed: 24, t, boil: 0, outline: 0, jitterCol: 18, mask: (x, y) => inFrame(x, y) && !inWin(x, y), angle: (x, y) => (x < 350 || x > 810 || (x > 566 && x < 592)) ? -Math.PI / 2 : 0 });
      // Bridge: separate layer, fine pale blue-green strokes (prevent foliage palette swallowing it)
      const Bp = P.scratch('moBridge'), bpg = Bp.getContext('2d'); bpg.clearRect(0, 0, W, H); bridge(bpg, t);
      bpg.save(); bpg.globalCompositeOperation = 'source-atop';
      P.strokes(bpg, Bp, { cell: 5, len: 10, width: 4, seed: 27, t, boil: 6, outline: 0, alphaMask: true, angle: () => 0.1,
        palette: (x, y, col, r) => col[1] > 150 && col[0] < 180 ? P.mix(P.hex(['#8fdcae', '#a8e8c0', '#6fc49a', '#c0f0d0', '#7fb8d8'][(r() * 5) | 0]), col, 0.3) : null });
      bpg.restore(); c.drawImage(Bp, 0, 0);
      // Trembling water glints: short horizontal bright strokes, irregular brightness flicker (positions change at 10fps)
      const st = Math.floor(t * 10); c.save(); c.lineCap = 'round';
      for (let i = 0; i < 160; i++) { const r = U.rng(i * 31 + 7), x = r() * W, y = 20 + r() * 670; if (inFrame(x, y)) continue;
        const a = clamp(Math.sin(t * (5 + r() * 6) + r() * TAU) * Math.sin(t * 2.3 + i), 0, 1); if (a < 0.15) continue;
        const jx = (U.hash(i, st) - 0.5) * 10; c.strokeStyle = ['#fffbe8', '#fdf0d0', '#f8e0ec', '#e8f4ff'][i % 4]; c.globalAlpha = 0.85 * a; c.lineWidth = 4 + r() * 3;
        c.beginPath(); c.moveTo(x + jx, y); c.lineTo(x + jx + 14 + r() * 26, y + (r() - 0.5) * 3); c.stroke(); }
      // Ripples: concentric ellipses expand at two locations
      [[300, 640], [1250, 160], [560, 470]].forEach(([x, y], k) => { for (let j = 0; j < 3; j++) { const q = (t * 0.9 + j / 3 + k * 0.3) % 1; c.globalAlpha = 0.6 * (1 - q); c.strokeStyle = '#eef4ff'; c.lineWidth = 3; c.setLineDash([12, 10]); c.beginPath(); c.ellipse(x, y, 20 + q * 90, (20 + q * 90) * 0.22, 0, 0, TAU); c.stroke(); } });
      c.setLineDash([]); c.globalAlpha = 1; c.restore();
      // Prop layer: tablecloth, porcelain pot, irises, wicker chair
      const Pr = P.scratch('moProps'), pg = Pr.getContext('2d'); pg.clearRect(0, 0, W, H); props(pg, t);
      pg.save(); pg.globalCompositeOperation = 'source-atop';
      P.strokes(pg, Pr, { cell: 6, len: 13, width: 4.5, seed: 25, t, boil: 0, outline: 0, jitterCol: 22, alphaMask: true, angle: (x, y) => (y > 640 && x > 790 && x < 1230) ? -Math.PI / 2 + 0.1 : 0.1,
        palette: (x, y, col, r) => (col[0] > 225 && col[2] > 225) ? P.mix(P.hex(['#fbf8f4', '#e6e0f4', '#d8d4f0', '#f6ecd8'][(r() * 4) | 0]), col, 0.3) : null });
      pg.restore(); c.drawImage(Pr, 0, 0);
      // Characters: flat fills → brushstrokes → facial features
      const L = P.scratch('moChars'), lg = L.getContext('2d'); lg.clearRect(0, 0, W, H);
      const K = RIG.cat({ tail: ch.tail, blink: ch.blink, breathe: ch.breathe });
      const G = RIG.girl({ cup: ch.cup, sip: ch.sip, hat: 'straw', hair: 'bun', breathe: ch.breathe });
      RIG.drawCat(lg, K, { lw: 0, orange: '#ec9a48', white: '#faf2e6', stripe: '#c8702a', face: () => { } });
      RIG.drawGirl(lg, G, { lw: 0, line: '#111', ...girlFill, features: () => { },
        hooks: { torso: (c) => { // 1899 white summer dress: high collar, puff sleeves, pale blue sash
          const n = G.A.neck; c.fillStyle = '#f6f2ec'; c.fillRect(n[0] - 16, n[1] - 30, 30, 34);
          c.strokeStyle = '#8fa8d8'; c.lineWidth = 16; c.beginPath(); c.moveTo(G.A.waist[0] - 60, G.A.waist[1] - 6); c.lineTo(G.A.waist[0] + 70, G.A.waist[1] - 2); c.stroke(); },
          arm: (c) => { const S = G.A.shoulder; c.fillStyle = '#f6f2ec'; c.beginPath(); c.ellipse(S[0] - 6, S[1] + 22, 42, 52, 0.4, 0, TAU); c.fill(); },
          head: (c) => { // Straw hat (RIG brim) and fluttering blue ribbon
            c.fillStyle = '#ecd28a'; c.fill(G.brim); c.fill(G.crown); c.fillStyle = '#5f86c8'; c.fill(G.band);
            const b0 = G.bow, sw = Math.sin(t * 4.5) * 10; c.strokeStyle = '#5f86c8'; c.lineWidth = 10; c.lineCap = 'round'; c.beginPath(); c.moveTo(b0[0], b0[1]); c.quadraticCurveTo(b0[0] + 30, b0[1] + 30 + sw, b0[0] + 46 + sw, b0[1] + 74); c.stroke(); } } });
      lg.save(); lg.globalCompositeOperation = 'source-atop';
      P.strokes(lg, L, { cell: 6, len: 12, width: 4.5, seed: 26, t, boil: 0, outline: 0, jitterCol: 18, alphaMask: true,
        angle: (x, y) => x < 760 ? Math.atan2(y - 780, x - 540) + Math.PI / 2 : -Math.PI / 2 + 0.35 * Math.sin(y * 0.03),
        palette: (x, y, col, r) => { const L_ = col[0] + col[1] + col[2]; if (x > 900 && L_ > 690) return P.mix(P.hex(['#fbf8f2', '#e4e0f6', '#cfd2ee', '#f8ecd0', '#d8e8f2'][(r() * 5) | 0]), col, 0.25);
          if (x > 900 && col[0] > 220 && col[1] > 180 && col[2] < 150) return P.mix(P.hex(['#f2d27a', '#e8c060', '#f8e4a0', '#d8a850'][(r() * 4) | 0]), col, 0.3); return null; } });
      // Warm lit side, cool shaded side: pale purple shadows and warm yellow highlights (Impressionist colored shadows)
      lg.globalCompositeOperation = 'source-atop';
      const sg = lg.createLinearGradient(1150, 0, 1480, 0); sg.addColorStop(0, 'rgba(255,236,170,0.22)'); sg.addColorStop(1, 'rgba(110,100,190,0.32)'); lg.fillStyle = sg; lg.fillRect(1080, 200, 420, 760);
      const cg = lg.createLinearGradient(400, 0, 700, 0); cg.addColorStop(0, 'rgba(120,110,200,0.25)'); cg.addColorStop(1, 'rgba(255,230,160,0.2)'); lg.fillStyle = cg; lg.fillRect(380, 520, 340, 400);
      lg.restore();
      c.drawImage(L, 0, 0);
      // Girl and cat facial features: thin purple lines (no outer outlines)
      RIG.drawFeatures(c, G, { line: '#5a4f8a', iris: '#4a6ab0', lip: '#d8707a', featureW: 0.9, blink: ch.blink, cheek: 'rgba(240,140,140,.35)' });
      c.save(); c.strokeStyle = '#5a4f8a'; c.lineWidth = 2.2; c.lineCap = 'round';
      K.eyes.forEach(e => { if (K.blink) { c.beginPath(); c.arc(e.x, e.y, 7, 0.2, Math.PI - 0.2); c.stroke(); } else { c.fillStyle = '#7ab060'; c.beginPath(); c.arc(e.x, e.y, 8, 0, TAU); c.fill(); c.fillStyle = '#2a2a4a'; c.beginPath(); c.ellipse(e.x + 2, e.y, 2.5, 6, 0, 0, TAU); c.fill(); } });
      c.fillStyle = '#d8746a'; c.beginPath(); c.arc(K.nose[0], K.nose[1], 5, 0, TAU); c.fill();
      K.whiskers.forEach(w => { c.beginPath(); c.moveTo(...w[0]); c.lineTo(...w[1]); c.stroke(); });
      c.restore();
      P.steam(c, t, G.cup.x, G.cup.y - 6, { h: 70, n: 2, color: 'rgba(250,246,255,.8)', width: 5, spread: 14, wobble: 9 });
    },
  };
})();
