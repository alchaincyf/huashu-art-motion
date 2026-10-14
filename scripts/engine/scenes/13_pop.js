// 1962 Pop Art (Lichtenstein comic panel + Warhol four-panel grid) — pure code.
// Pipeline: ① cached base (cream panel + 45° Ben-Day blue wall + white baseboard + yellow floor + red band + MEANWHILE box)
//      → ② motifs (Warhol cats change palettes on beat, three thought dots flash in turn, WIGGLE burst jitters, cat wiggles rump)
//      → ③ thick black outlines + flat colors + red skin Ben-Day dots (createPattern, no per-frame cost) + white highlight bands + diagonal shadows
SCENES['13_pop'] = (() => {
  const W = 1920, H = 1080, { clamp, lerp } = U, P = PAINT, TAU = Math.PI * 2;
  const C = { ink: '#141414', paper: '#f3eedb', blue: '#2f5cc8', yellow: '#f7d52c', red: '#d8232a', redD: '#a8161c', white: '#fbf8ee',
    skin: '#fae0cc', dotRed: '#e2483c', hair: '#f8d62c', hairD: '#d9a514', orange: '#f39a2c', orangeD: '#c4561a' };
  const hash = (i, j = 0) => U.hash(i, j);

  // Ben-Day pattern: square grid + center dot = 45° grid; pitch is square side
  const dotPattern = (c, key, pitch, r, col, bg) => {
    const tile = P.cached('pop_tile_' + key, pitch, pitch, (g) => { if (bg) { g.fillStyle = bg; g.fillRect(0, 0, pitch, pitch); } g.fillStyle = col;
      [[0, 0], [pitch, 0], [0, pitch], [pitch, pitch], [pitch / 2, pitch / 2]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }); });
    return c.createPattern(tile, 'repeat');
  };
  // Diagonal hatching (comic shadows)
  const hatch = (c, cx, cy, rx, ry, gap = 10, w = 3.5) => { c.save(); c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, TAU); c.clip();
    c.strokeStyle = C.ink; c.lineWidth = w; c.beginPath(); for (let x = cx - rx - ry * 2; x < cx + rx + ry; x += gap) { c.moveTo(x, cy + ry); c.lineTo(x + ry * 2.2, cy - ry); } c.stroke(); c.restore(); };
  const ink = (c, p, fill, lw = 5) => { if (fill) { c.fillStyle = fill; c.fill(p); } c.strokeStyle = C.ink; c.lineWidth = lw; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(p); };
  const poly = (pts, closed = true) => { const p = new Path2D(); pts.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); if (closed) p.closePath(); return p; };

  // ---------- ① Base ----------
  const bg = () => P.cached('pop_bg', W, H, (g) => {
    g.fillStyle = C.paper; g.fillRect(0, 0, W, H);
    // Blue dotted wall
    g.fillStyle = dotPattern(g, 'wall', 24, 5.6, C.blue, C.white); g.fillRect(20, 16, W - 40, 738);
    // Baseboard, yellow floor, red band
    g.fillStyle = C.white; g.fillRect(20, 754, W - 40, 38);
    g.fillStyle = C.ink; g.fillRect(20, 750, W - 40, 6); g.fillRect(20, 790, W - 40, 6);
    g.fillStyle = C.yellow; g.beginPath(); g.moveTo(20, 796); g.lineTo(W - 20, 796); g.lineTo(W - 20, 990); g.lineTo(20, 1003); g.closePath(); g.fill();
    // Faint floor dots (print feel)
    g.save(); g.clip(); g.globalAlpha = 0.18; g.fillStyle = dotPattern(g, 'floor', 14, 2.2, '#c99a10'); g.fillRect(20, 796, W - 40, 210); g.restore();
    g.fillStyle = C.red; g.beginPath(); g.moveTo(20, 1003); g.lineTo(W - 20, 990); g.lineTo(W - 20, 1064); g.lineTo(20, 1064); g.closePath(); g.fill();
    g.strokeStyle = C.ink; g.lineWidth = 6; g.beginPath(); g.moveTo(20, 1003); g.lineTo(W - 20, 990); g.stroke();
    // Comic panel border
    g.strokeStyle = C.ink; g.lineWidth = 6; g.strokeRect(17, 14, W - 34, H - 28);
    // MEANWHILE...
    g.fillStyle = C.yellow; g.fillRect(32, 32, 272, 70); g.lineWidth = 5; g.strokeRect(32, 32, 272, 70);
    g.font = '46px "Bangers-400"'; g.fillStyle = C.ink; g.textBaseline = 'middle'; g.letterSpacing = '1px'; g.fillText('MEANWHILE...', 50, 70); g.letterSpacing = '0px';
    // White Warhol frame + sill
    g.fillStyle = C.white; g.fillRect(350, 110, 462, 472); g.lineWidth = 5; g.strokeRect(350, 110, 462, 472);
    g.fillStyle = C.white; g.fillRect(334, 574, 496, 22); g.strokeRect(334, 574, 496, 22); g.fillStyle = C.blue; g.fillRect(338, 592, 488, 4);
    // Blue chair
    const blue = '#2448b0';
    [[1452, 478, 24, 420], [1300, 760, 18, 140], [1460, 760, 18, 140]].forEach(([x, y, w, h]) => { g.fillStyle = blue; g.fillRect(x, y, w, h); g.lineWidth = 4; g.strokeRect(x, y, w, h); });
    g.fillStyle = blue; g.fillRect(1282, 740, 210, 24); g.strokeRect(1282, 740, 210, 24);
    [[1440, 560], [1440, 640]].forEach(([x, y]) => { g.fillRect(x, y, 30, 12); });
    g.fillStyle = '#6f8ee8'; g.fillRect(1458, 486, 6, 400);
    // Paper grain
    g.drawImage(P.grain('pop', 0.035, [60, 50, 30], 0.12), 0, 0);
  });

  // ---------- ② Warhol four-panel cats ----------
  const SCHEMES = [
    { bg: '#9ccf3a', face: '#e0302a', low: '#9a6ad0', eye: '#3a7ad8', lip: '#f06a3a' },
    { bg: '#e0359a', face: '#f0902a', low: '#78d6e6', eye: '#2a9a5a', lip: '#e0302a' },
    { bg: '#2fc0b0', face: '#f27fb2', low: '#f8e040', eye: '#7a3ac8', lip: '#e0302a' },
    { bg: '#f08a2a', face: '#f8d830', low: '#f6a2c4', eye: '#2ab0d8', lip: '#e0302a' },
  ];
  function warholCat(c, cx, cy, s) {
    c.save(); c.translate(cx, cy);
    const head = poly([[-70, -14], [-64, -78], [-30, -44], [30, -44], [64, -78], [70, -14], [62, 32], [30, 58], [-30, 58], [-62, 32]]);
    const hd = RIG.smooth([[-70, -10], [-66, -76], [-28, -46], [28, -46], [66, -76], [70, -10], [60, 34], [0, 62], [-60, 34]], true, 0.35);
    c.fillStyle = s.face; c.fill(hd);
    c.save(); c.clip(hd); c.fillStyle = s.low; c.beginPath(); c.ellipse(4, 34, 58, 30, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(20,20,20,.88)'; c.beginPath(); c.moveTo(40, -40); c.quadraticCurveTo(76, 0, 52, 60); c.lineTo(90, 60); c.lineTo(90, -40); c.fill(); c.restore();   // Misregistered black screen-print patch
    c.strokeStyle = C.ink; c.lineWidth = 5; c.lineJoin = 'round'; c.stroke(hd);
    // Eye shadow + eyes
    [-26, 26].forEach(x => { c.fillStyle = s.eye; c.beginPath(); c.ellipse(x, -10, 19, 13, 0, Math.PI, TAU); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x, -4, 14, 9, 0, 0, TAU); c.fill(); c.lineWidth = 3; c.stroke();
      c.fillStyle = C.ink; c.beginPath(); c.arc(x + 2, -4, 6, 0, TAU); c.fill(); c.lineWidth = 3.5; c.beginPath(); c.moveTo(x - 16, -10); c.lineTo(x - 22, -18); c.moveTo(x + 14, -12); c.lineTo(x + 20, -19); c.stroke(); });
    // Lipstick mouth, nose, whiskers
    c.fillStyle = s.lip; c.beginPath(); c.moveTo(-14, 30); c.quadraticCurveTo(0, 22, 14, 30); c.quadraticCurveTo(0, 44, -14, 30); c.fill(); c.lineWidth = 2.5; c.stroke();
    c.fillStyle = C.ink; c.beginPath(); c.moveTo(-6, 14); c.lineTo(6, 14); c.lineTo(0, 21); c.fill();
    c.lineWidth = 2; c.beginPath(); [[-1, 18], [1, 22], [-1, 26]].forEach(([d, y]) => { c.moveTo(-36, y); c.lineTo(-74, y - 4 + d * 2); c.moveTo(36, y); c.lineTo(74, y - 4 + d * 2); }); c.stroke();
    // Inner ears
    c.fillStyle = C.ink; c.beginPath(); c.moveTo(-58, -64); c.lineTo(-56, -38); c.lineTo(-38, -44); c.fill();
    c.restore();
  }
  function warhol(c, lt) {
    const step = Math.floor(clamp(lt, 0, 9) * 11);            // Palette changes roughly every 5–6 frames
    const cells = [[372, 132], [585, 132], [372, 350], [585, 350]];
    cells.forEach(([x, y], i) => { const s = SCHEMES[(i + step) % 4];
      c.fillStyle = s.bg; c.fillRect(x, y, 206, 212); warholCat(c, x + 103, y + 116, s);
      c.strokeStyle = C.ink; c.lineWidth = 4; c.strokeRect(x, y, 206, 212); });
    // Glass reflection
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 6; c.beginPath(); c.moveTo(712, 140); c.lineTo(660, 222); c.moveTo(736, 140); c.lineTo(684, 222); c.stroke();
  }

  // ---------- Thought bubble (three dots flash in turn) ----------
  const cloud = [[975, 220, 62], [1040, 180, 64], [1110, 170, 62], [1180, 200, 58], [1210, 250, 50], [1160, 292, 48], [1090, 300, 52], [1010, 292, 50], [960, 262, 46], [1080, 240, 90]];
  function bubble(c, lt) {
    c.lineWidth = 11; c.strokeStyle = C.ink; cloud.forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); });
    c.fillStyle = C.white; cloud.forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); });
    [[1196, 334, 18], [1236, 338, 12]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = C.white; c.fill(); c.lineWidth = 5; c.stroke(); });
    const f = lt * 60;
    [1025, 1082, 1139].forEach((x, k) => { const ph = ((f - 2 * k) % 12 + 12) % 12, on = ph < 4;
      c.fillStyle = C.ink; c.beginPath(); c.arc(x, 242 - (on ? 6 : 0), on ? 20 : 12, 0, TAU); c.fill(); });
  }

  // ---------- WIGGLE WIGGLE burst ----------
  const burst = (cx, cy, r0, r1, n, seed) => { const pts = []; for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU + 0.1, r = i % 2 ? r0 * (0.92 + hash(i, seed) * 0.12) : r1 * (0.85 + hash(i, seed + 1) * 0.3); pts.push([cx + Math.cos(a) * r * 1.12, cy + Math.sin(a) * r * 0.8]); } return poly(pts); };
  function wiggleBox(c, lt) {
    const st = Math.floor(lt * 30), jx = (hash(st, 3) - 0.5) * 16, jy = (hash(st, 7) - 0.5) * 12, rot = (hash(st, 11) - 0.5) * 0.06;
    const cx = 222, cy = 690;
    // Radial motion lines (black triangles)
    c.fillStyle = C.ink;
    [[-2.45, 1], [-2.0, 0.9], [-1.62, 1.1], [-1.25, 0.8], [2.2, 1], [1.85, 0.9], [1.5, 1.1], [1.15, 0.8], [2.7, 0.7], [-2.85, 0.8]].forEach(([a, k], i) => {
      const pl = 0.85 + 0.25 * Math.sin(lt * 40 + i * 2), r0 = 230 * k, r1 = r0 + 90 * pl, w = 0.06;
      c.beginPath(); c.moveTo(cx + Math.cos(a - w) * r0 * 1.12, cy + Math.sin(a - w) * r0 * 0.9); c.lineTo(cx + Math.cos(a) * r1 * 1.12, cy + Math.sin(a) * r1 * 0.9); c.lineTo(cx + Math.cos(a + w) * r0 * 1.12, cy + Math.sin(a + w) * r0 * 0.9); c.fill(); });
    c.save(); c.translate(cx + jx, cy + jy); c.rotate(rot); c.translate(-cx, -cy);
    const outer = burst(cx, cy, 128, 178, 14, 1); c.fillStyle = C.white; c.fill(outer); c.lineWidth = 6; c.strokeStyle = C.ink; c.stroke(outer);
    const inner = burst(cx, cy, 104, 140, 12, 5); c.fillStyle = C.yellow; c.fill(inner);
    c.font = '82px "Bangers-400"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    c.save(); c.translate(cx, cy); c.rotate(-0.08); c.letterSpacing = '2px';
    [['WIGGLE', -34], ['WIGGLE', 40]].forEach(([s, y], i) => { c.lineWidth = 12; c.strokeStyle = C.ink; c.strokeText(s, i * 14 - 4, y + 5); c.fillStyle = C.ink; c.fillText(s, i * 14 - 4 + 4, y + 9); c.fillStyle = C.red; c.fillText(s, i * 14 - 4, y + 5); });
    c.restore(); c.restore();
  }

  // ---------- Table, cup ----------
  function table(c) {
    hatch(c, 1010, 902, 150, 18);
    c.fillStyle = C.ink; c.beginPath(); c.moveTo(985, 668); c.lineTo(1015, 668); c.lineTo(1024, 860); c.lineTo(976, 860); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(920, 900); c.quadraticCurveTo(930, 852, 1000, 848); c.quadraticCurveTo(1070, 852, 1080, 900); c.closePath(); c.fill();
    c.strokeStyle = '#4a7ae8'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(1030, 862); c.quadraticCurveTo(1062, 870, 1068, 892); c.moveTo(1010, 690); c.lineTo(1014, 830); c.stroke();
    const top = poly([[822, 640], [1200, 640], [1196, 664], [826, 668]]); ink(c, top, C.red, 5);
    c.strokeStyle = C.white; c.lineWidth = 5; c.beginPath(); c.moveTo(850, 650); c.lineTo(960, 650); c.moveTo(985, 650); c.lineTo(1010, 650); c.stroke();
  }
  function cup(c, G, t) {
    const k = G.cup; c.save(); c.translate(k.x, k.y); c.rotate(k.tilt); const w = 50, h = 48;
    const body = poly([[-w / 2, 0], [-w * 0.46, h], [w * 0.46, h], [w / 2, 0]]);
    c.fillStyle = C.white; c.fill(body);
    c.save(); c.clip(body); c.strokeStyle = '#2f5cc8'; c.lineWidth = 5; for (let x = 4; x < 50; x += 11) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x - 18, h); c.stroke(); } c.restore();
    c.strokeStyle = C.ink; c.lineWidth = 4; c.stroke(body); c.beginPath(); c.arc(w * 0.6, h * 0.45, 14, -1.3, 1.4); c.lineWidth = 6; c.stroke();
    c.fillStyle = '#5a3016'; c.beginPath(); c.ellipse(0, 1, w / 2 - 2, 6, 0, 0, TAU); c.fill(); c.lineWidth = 3.5; c.stroke();
    c.restore();
    // Comic steam: two crossing black waves
    c.save(); c.strokeStyle = C.ink; c.lineWidth = 4; c.lineCap = 'round';
    [[-8, 0], [10, 2]].forEach(([dx, ph]) => { c.beginPath(); for (let i = 0; i <= 14; i++) { const q = i / 14, x = k.x + dx + Math.sin(q * 7 + ph + t * 14) * 9 * (dx < 0 ? 1 : -1), y = k.y - 14 - q * 62; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); });
    c.restore();
  }

  // ---------- Girl (Lichtenstein) ----------
  function girl(c, G, lt, t, ch) {
    const skinDots = dotPattern(c, 'skin', 13, 3.3, C.dotRed, C.skin);
    const fillSkin = (p) => { c.fillStyle = skinDots; c.fill(p); c.strokeStyle = C.ink; c.lineWidth = 5; c.stroke(p); };
    const a = G.A, h = a.headC, sh = [h[0] - 1318, h[1] - 360];
    // Large rear wavy hair mass
    const sway = Math.sin(t * 5) * 6;
    // Lichtenstein blonde outer waves: sin bulges along rear-edge arc length
    const spine = [[1262, 300], [1290, 262], [1346, 250], [1404, 276], [1440, 330], [1462, 396], [1492, 452], [1522, 510], [1540, 570], [1520, 624]];
    const inner = [[1488, 640], [1452, 610], [1420, 628], [1392, 596], [1372, 548], [1356, 496], [1342, 452], [1330, 418], [1320, 392]];
    const wav = spine.map(([x, y], i) => i < 4 ? [x, y] : [x + Math.sin(i * 2.1 + t * 4) * 14 + 10, y + Math.cos(i * 2.1) * 6]);
    const hairPts = wav.concat(inner).map(([x, y]) => [x + sh[0] * (y < 430 ? 1 : 0.4) + (y > 430 ? sway * (y - 430) / 180 : 0), y + sh[1] * (y < 430 ? 1 : 0.4)]);
    const hair = RIG.smooth(hairPts, true, 0.75);
    // Hair mass + rear-edge curl masses: outline all thick black, then fill all yellow = union outline
    const lobes = [[1440, 360, 44], [1478, 430, 46], [1500, 505, 48], [1520, 578, 44], [1478, 622, 38], [1430, 606, 34], [1400, 560, 30]]
      .map(([x, y, r], i) => [x + sh[0] * (y < 430 ? 1 : 0.4) + sway * Math.max(0, y - 430) / 180 + Math.sin(t * 6 + i) * 3, y + sh[1] * (y < 430 ? 1 : 0.4), r]);
    c.strokeStyle = C.ink; c.lineWidth = 10; c.stroke(hair); lobes.forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); });
    c.fillStyle = C.hair; c.fill(hair); lobes.forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); });
    c.lineWidth = 4.5; c.lineCap = 'round'; lobes.forEach(([x, y, r], i) => { c.beginPath(); c.arc(x - 4, y + 2, r * 0.58, i % 2 ? -2.6 : -0.6, i % 2 ? 0.9 : 2.9); c.stroke(); });
    c.strokeStyle = C.hairD; c.lineWidth = 7; lobes.forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r - 6, 0.2, 1.2); c.stroke(); });
    // Far arm on table
    ink(c, G.farSleeve, C.red); fillSkin(G.farHand);
    // Legs + red heels
    const knee = [1222, 760], ank = [1196, 878];
    const leg = RIG.taper(knee, ank, 46, 30, 4); fillSkin(leg);
    const leg2 = RIG.taper([1262, 772], [1236, 878], 44, 28, 4); fillSkin(leg2);
    const shoe = (x, y) => { const p = poly([[x - 40, y + 2], [x - 30, y - 16], [x + 6, y - 14], [x + 16, y + 20], [x + 8, y + 22], [x - 2, y + 4], [x - 26, y + 12]]); ink(c, p, C.red, 4.5); c.strokeStyle = C.white; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 26, y - 8); c.lineTo(x - 6, y - 8); c.stroke(); };
    shoe(1236, 884); shoe(1196, 884);
    // Knee-length skirt
    c.save(); c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(W, 786); c.lineTo(1400, 786); c.quadraticCurveTo(1280, 806, 1150, 790); c.lineTo(0, 790); c.closePath(); c.clip();
    ink(c, G.skirt, C.red, 5); c.restore();
    c.strokeStyle = C.ink; c.lineWidth = 5; c.beginPath(); c.moveTo(1150, 790); c.quadraticCurveTo(1280, 806, 1400, 786); c.stroke();
    ink(c, G.torso, C.red, 5);
    // White highlight bands
    c.strokeStyle = C.white; c.lineWidth = 7; c.lineCap = 'round';
    c.beginPath(); c.moveTo(a.chest[0] + 20, a.chest[1] - 10); c.quadraticCurveTo(a.chest[0] + 34, a.chest[1] + 40, a.chest[0] + 26, a.chest[1] + 80); c.moveTo(1200, 700); c.quadraticCurveTo(1250, 690, 1300, 700); c.stroke();
    c.strokeStyle = C.redD; c.lineWidth = 4; c.beginPath(); c.moveTo(1380, 640); c.quadraticCurveTo(1400, 700, 1390, 760); c.stroke();
    fillSkin(G.neck);
    // Head
    fillSkin(G.face);
    c.fillStyle = C.skin; c.beginPath(); c.ellipse(G.ear[0], G.ear[1], 9, 13, 0.2, 0, TAU); c.fill(); c.lineWidth = 4; c.strokeStyle = C.ink; c.stroke();
    // Bangs + crown (large waves)
    const bangs = RIG.smooth([[1246, 330], [1250, 296], [1282, 268], [1336, 262], [1384, 284], [1404, 330], [1384, 312], [1350, 300], [1312, 302], [1280, 314], [1262, 340]].map(([x, y]) => [x + sh[0], y + sh[1]]), true, 0.5);
    ink(c, bangs, C.hair, 5);
    // Black hair lines and white highlights
    c.strokeStyle = C.ink; c.lineWidth = 4;
    [[1300, 272, 1418, 420, 0], [1350, 300, 1460, 520, 1], [1420, 360, 1520, 600, 2], [1380, 440, 1470, 630, 3], [1336, 420, 1410, 600, 4]].forEach(([x0, y0, x1, y1, k]) => {
      c.beginPath(); for (let i = 0; i <= 24; i++) { const q = i / 24, x = lerp(x0, x1, q) + Math.sin(q * 9 + k) * 16 * q, y = lerp(y0, y1, q);
        const X = x + sh[0] * 0.7 + (y > 430 ? sway * (y - 430) / 180 : 0), Y = y + sh[1] * 0.7; i ? c.lineTo(X, Y) : c.moveTo(X, Y); } c.stroke(); });
    c.strokeStyle = C.white; c.lineWidth = 6; c.beginPath(); c.moveTo(1300 + sh[0], 280 + sh[1]); c.quadraticCurveTo(1340 + sh[0], 276 + sh[1], 1370 + sh[0], 292 + sh[1]); c.moveTo(1440 + sway * 0.3, 470); c.lineTo(1456 + sway * 0.4, 500); c.stroke();
    // Features: large eyes, thick lashes, red lips
    const e = G.eye;
    if (ch.blink) { c.strokeStyle = C.ink; c.lineWidth = 4; c.beginPath(); c.arc(e.x, e.y - 2, 9, 0.2, Math.PI - 0.2); c.stroke(); }
    else { c.fillStyle = C.white; c.beginPath(); c.ellipse(e.x - 1, e.y, 12, 8.5, 0, 0, TAU); c.fill(); c.fillStyle = '#3a8ae0'; c.beginPath(); c.arc(e.x - 3, e.y + 1, 7, 0, TAU); c.fill(); c.fillStyle = C.ink; c.beginPath(); c.arc(e.x - 3, e.y + 1, 3.2, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(e.x - 6, e.y - 2, 2, 0, TAU); c.fill();
      c.strokeStyle = C.ink; c.lineWidth = 4.5; c.stroke(G.lid); c.lineWidth = 3.5; G.lashes.forEach(l => { c.beginPath(); c.moveTo(...l[0]); c.lineTo(l[1][0] - 5, l[1][1] - 5); c.stroke(); }); c.beginPath(); c.moveTo(e.x + 10, e.y - 6); c.lineTo(e.x + 16, e.y - 12); c.stroke(); }
    c.save(); c.translate(0, -5); c.strokeStyle = C.ink; c.lineWidth = 4; c.stroke(G.brow); c.restore();
    c.fillStyle = C.red; c.beginPath(); c.moveTo(G.lips[0][0] - 3, G.lips[0][1] - 1); c.quadraticCurveTo(G.lips[1][0] + 4, G.lips[1][1] - 4, G.lips[1][0] + 3, G.lips[1][1] + 2); c.quadraticCurveTo(G.lips[2][0] + 3, G.lips[2][1] + 3, G.lips[2][0] - 3, G.lips[2][1]); c.closePath(); c.fill(); c.lineWidth = 2.5; c.stroke();
    // Near arm (sleeveless skin dots) + cup + hand
    fillSkin(G.upperArm); fillSkin(G.foreArm);
    cup(c, G, t);
    fillSkin(G.hand); c.fillStyle = C.skin; c.beginPath(); c.arc(G.thumb[0], G.thumb[1], 7, 0, TAU); c.fill(); c.lineWidth = 3.5; c.stroke();
    c.fillStyle = C.red; c.beginPath(); c.arc(G.thumb[0] - 4, G.thumb[1] - 1, 3, 0, TAU); c.fill();   // Red nails
  }

  // ---------- Cat crouches to pounce, rump wiggles sideways ----------
  function cat(c, K, lt, t, ch) {
    const wig = Math.sin(lt * TAU * 6) * 16;                     // 6Hz rump wiggle
    const bx = K.box[0][0] - 390, by = K.box[1][1] - 905;           // Rig origin offset
    const def = ([x, y]) => { const w = clamp((560 - x) / 140); return [x + bx + wig * w, y + by - Math.abs(wig) * 0.6 * w]; };
    hatch(c, 580, 912, 230, 22);
    // Tail
    const tailBase = def([440, 870]), tip = [318 + bx + wig * 1.4 + Math.sin(ch.tail) * 20, 846 + by - Math.cos(ch.tail) * 18];
    const tailPts = P.bez(tailBase, [400 + bx + wig, 900 + by], [350 + bx + wig * 1.2, 900 + by], tip, 16);
    c.lineCap = 'round'; c.strokeStyle = C.ink; c.lineWidth = 34; c.beginPath(); tailPts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
    c.strokeStyle = C.orange; c.lineWidth = 24; c.stroke();
    c.strokeStyle = C.orangeD; c.lineWidth = 6; [4, 8, 12].forEach(i => { const p = tailPts[i], q = tailPts[i + 1], a = Math.atan2(q[1] - p[1], q[0] - p[0]) + Math.PI / 2; c.beginPath(); c.moveTo(p[0] + Math.cos(a) * 11, p[1] + Math.sin(a) * 11); c.lineTo(p[0] - Math.cos(a) * 11, p[1] - Math.sin(a) * 11); c.stroke(); });
    c.fillStyle = C.white; c.beginPath(); c.arc(tip[0], tip[1], 12, 0, TAU); c.fill(); c.lineWidth = 4; c.strokeStyle = C.ink; c.stroke();
    // Body (raised rump on left)
    const body = RIG.smooth([[452, 900], [420, 872], [418, 820], [440, 780], [482, 756], [540, 756], [600, 770], [652, 800], [690, 850], [700, 900]].map(def), true, 0.55);
    ink(c, body, C.orange, 5);
    c.save(); c.clip(body);
    c.fillStyle = C.white; c.beginPath(); c.ellipse(610 + bx, 880 + by, 120, 46, 0, 0, TAU); c.fill();
    c.strokeStyle = C.orangeD; c.lineWidth = 9; c.lineCap = 'round';
    [[450, 790, 486, 830], [478, 772, 512, 816], [512, 764, 540, 806], [546, 766, 566, 806], [430, 830, 470, 858]].forEach(([x0, y0, x1, y1]) => { const p0 = def([x0, y0]), p1 = def([x1, y1]); c.beginPath(); c.moveTo(...p0); c.quadraticCurveTo(p0[0] + 18, (p0[1] + p1[1]) / 2, p1[0], p1[1]); c.stroke(); });
    c.restore(); c.strokeStyle = C.ink; c.lineWidth = 5; c.stroke(body);
    // Front paws extended forward
    [[650, 886], [704, 888]].forEach(([x, y]) => { const p = new Path2D(); p.ellipse(x + bx, y + by, 30, 15, 0, 0, TAU); ink(c, p, C.white, 4.5); c.lineWidth = 3; c.beginPath(); c.moveTo(x + bx + 6, y + by - 8); c.lineTo(x + bx + 6, y + by + 6); c.moveTo(x + bx + 16, y + by - 7); c.lineTo(x + bx + 16, y + by + 5); c.stroke(); });
    // Head low, watching ahead
    const hc = [K.headC[0] + 22, K.headC[1] + 104], r = 58;
    const head = new Path2D(); head.ellipse(hc[0], hc[1], r * 1.08, r * 0.92, 0, 0, TAU);
    const ears = poly([[hc[0] - 50, hc[1] - 30], [hc[0] - 46, hc[1] - 94], [hc[0] - 8, hc[1] - 52], [hc[0] + 14, hc[1] - 54], [hc[0] + 52, hc[1] - 96], [hc[0] + 56, hc[1] - 30]]);
    ink(c, ears, C.orange, 5); ink(c, head, C.orange, 5);
    c.fillStyle = '#f39ab8'; c.beginPath(); c.moveTo(hc[0] - 40, hc[1] - 50); c.lineTo(hc[0] - 40, hc[1] - 80); c.lineTo(hc[0] - 18, hc[1] - 56); c.fill(); c.beginPath(); c.moveTo(hc[0] + 44, hc[1] - 52); c.lineTo(hc[0] + 46, hc[1] - 82); c.lineTo(hc[0] + 22, hc[1] - 58); c.fill();
    c.save(); c.clip(head); c.fillStyle = C.white; c.beginPath(); c.ellipse(hc[0] + 4, hc[1] + 36, 44, 34, 0, 0, TAU); c.fill();
    c.strokeStyle = C.orangeD; c.lineWidth = 7; [[-14, -60, -10, -38], [4, -62, 4, -40], [22, -60, 18, -38]].forEach(([a0, b0, a1, b1]) => { c.beginPath(); c.moveTo(hc[0] + a0, hc[1] + b0); c.lineTo(hc[0] + a1, hc[1] + b1); c.stroke(); });
    c.restore(); c.strokeStyle = C.ink; c.lineWidth = 5; c.stroke(head);
    [[-22, -2], [24, -2]].forEach(([dx, dy]) => { const x = hc[0] + dx, y = hc[1] + dy;
      if (ch.blink) { c.lineWidth = 4; c.beginPath(); c.arc(x, y, 13, 0.2, Math.PI - 0.2); c.stroke(); return; }
      c.fillStyle = '#f8d020'; c.beginPath(); c.arc(x, y, 16, 0, TAU); c.fill(); c.lineWidth = 4; c.stroke();
      c.fillStyle = C.ink; c.beginPath(); c.ellipse(x + 4, y + 1, 7, 12, 0, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x + 7, y - 5, 4, 0, TAU); c.fill(); });
    c.fillStyle = '#f07aa0'; c.beginPath(); c.moveTo(hc[0] - 7, hc[1] + 18); c.lineTo(hc[0] + 7, hc[1] + 18); c.lineTo(hc[0], hc[1] + 27); c.closePath(); c.fill(); c.lineWidth = 2.5; c.stroke();
    c.lineWidth = 3.5; c.beginPath(); c.moveTo(hc[0] - 14, hc[1] + 32); c.quadraticCurveTo(hc[0] - 7, hc[1] + 40, hc[0], hc[1] + 30); c.quadraticCurveTo(hc[0] + 7, hc[1] + 40, hc[0] + 14, hc[1] + 32); c.stroke();
    c.lineWidth = 2.5; c.beginPath(); [[-40, 22, -96, 12], [-40, 30, -98, 34], [40, 22, 98, 12], [40, 30, 100, 34]].forEach(([a0, b0, a1, b1]) => { c.moveTo(hc[0] + a0, hc[1] + b0); c.lineTo(hc[0] + a1, hc[1] + b1); }); c.stroke();
    // Rump motion arcs follow wiggle
    c.strokeStyle = C.ink; c.lineWidth = 5; c.lineCap = 'round';
    const side = wig > 0 ? 1 : -1;
    [[0, 0], [1, 12], [2, 24]].forEach(([k, off]) => { c.beginPath(); c.arc(476 + bx + wig * 0.6, 760 + by - off, 46 + off, -Math.PI * 0.86, -Math.PI * 0.62); c.stroke(); });
    [[0, 0], [1, 14]].forEach(([k, off]) => { c.beginPath(); c.arc(430 + bx + wig, 830 + by, 40 + off, Math.PI * (side > 0 ? 0.8 : 0.9), Math.PI * (side > 0 ? 1.05 : 1.15)); c.stroke(); });
  }

  return {
    draw(c, lt, t) {
      const ch = P.choreo(lt, t);
      c.drawImage(bg(), 0, 0);
      warhol(c, lt);
      bubble(c, lt);
      table(c);
      hatch(c, 1340, 905, 170, 18);
      const G = RIG.girl({ cup: ch.cup, sip: ch.sip, hair: 'long', breathe: ch.breathe });
      girl(c, G, lt, t, ch);
      const K = RIG.cat({ tail: ch.tail, blink: ch.blink, breathe: ch.breathe });
      cat(c, K, lt, t, ch);
      wiggleBox(c, lt);
    },
  };
})();
