// 2026 flat vector illustration (Dribbble style) + film's closing gag — pure code.
// Structure: ① cached base (cream wall/floor, grain-stippled pink circle/lavender blocks, window/city silhouettes, table/chair/rug, pots)
//      → ② moving environment (clouds left, plane, sun rays, 4fps boiling symbols, swinging lamp/light cone, two swaying plants)
//      → ③ characters (custom 2026 poses; girl head/torso RIG.girl, arms RIG.ik2; cat interpolated pose landmarks)
//      → ④ prop performance (three cup bats, fall, break, coffee stain/ripples) → ⑤ handwritten signature → ⑥ character grain via source-atop.
// All performance timing uses film frame F = t*60, numbers copied directly from ../拆解/分镜表.md §4.
SCENES['16_2026'] = (() => {
  const W = 1920, H = 1080, P = PAINT, { clamp, lerp, ease } = U;
  const C = {
    wall: '#f6efe2', floor: '#eedfc7', navy: '#262a5c', coral: '#e8655a', coralLt: '#f08b7d', coralDk: '#d1514a',
    pink: '#f5cdc6', pinkDot: '#e8807b', lav: '#e4dbf6', lavDot: '#b9a4ea', red: '#e65a52', yellow: '#f2b33d', sun: '#f3b13c',
    green: '#2f8a5d', greenDk: '#22704a', greenLt: '#57b07a', mint: '#d6ece0', chair: '#7cb791', white: '#fffaf2',
    skin: '#f8d3bd', skinDk: '#eab79f', hair: '#f4c24f', hairDk: '#dca23a', blush: '#f39a8d', pants: '#262a5c', sock: '#b9a4ea',
    orange: '#f0a23c', orangeDk: '#d8832a', catWhite: '#fff8ee', earIn: '#f4aaa0', laptop: '#9a88df', laptopDk: '#7563c4',
    coffee: '#b8782f', coffeeLt: '#d79a4a', cup: '#e35b55', cupDk: '#c4433e',
  };
  const FR = t => t * 60;                                  // Film frame number
  const seg = (f, a, b) => clamp((f - a) / (b - a));
  // Keyframe interpolation: [[frame, value], ...], eased within segment
  const kf = (f, tab, e = ease.inOut) => { if (f <= tab[0][0]) return tab[0][1]; for (let i = 1; i < tab.length; i++) if (f <= tab[i][0]) { const q = (f - tab[i - 1][0]) / (tab[i][0] - tab[i - 1][0]); return lerp(tab[i - 1][1], tab[i][1], e(q)); } return tab[tab.length - 1][1]; };
  // Catmull-Rom point interpolation (shot-list centroids/cup trajectories measured every 2 frames)
  const path = (f, tab) => {
    if (f <= tab[0][0]) return [tab[0][1], tab[0][2]]; const n = tab.length; if (f >= tab[n - 1][0]) return [tab[n - 1][1], tab[n - 1][2]];
    let i = 1; while (tab[i][0] < f) i++;
    const p0 = tab[Math.max(0, i - 2)], p1 = tab[i - 1], p2 = tab[i], p3 = tab[Math.min(n - 1, i + 1)], q = (f - p1[0]) / (p2[0] - p1[0]);
    const cr = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * q + (2 * a - 5 * b + 4 * c - d) * q * q + (-a + 3 * b - 3 * c + d) * q * q * q);
    return [cr(p0[1], p1[1], p2[1], p3[1]), cr(p0[2], p1[2], p2[2], p3[2])];
  };
  // Damped swing: secondary motion from f0
  const damped = (f, f0, amp, period, decay) => f < f0 ? 0 : amp * Math.exp(-(f - f0) / decay) * Math.sin((f - f0) / period * Math.PI * 2);
  const smooth = (pts, closed = true) => RIG.smooth(pts, closed);

  // ---------- Grain stippling: scatter inside shape with position-dependent density ----------
  function stipple(g, pathOrFn, box, col, density, seed, size = 2.2) {
    const r = U.rng(seed); const [x0, y0, x1, y1] = box; g.save(); if (pathOrFn instanceof Path2D) g.clip(pathOrFn); g.fillStyle = col;
    const n = Math.round((x1 - x0) * (y1 - y0) * 0.02);
    for (let i = 0; i < n; i++) { const x = lerp(x0, x1, r()), y = lerp(y0, y1, r()); if (r() < density(x, y)) { const s = size * (0.6 + r() * 0.8); g.fillRect(x, y, s, s); } }
    g.restore();
  }

  // ---------- Static background ----------
  const PINK = [560, 485, 392], LAVP = [[1215, 230], [1330, 196], [1460, 230], [1545, 330], [1585, 470], [1560, 610], [1480, 720], [1350, 765], [1215, 740], [1140, 640], [1120, 470], [1150, 320]];
  function background(g) {
    g.fillStyle = C.wall; g.fillRect(0, 0, W, 790);
    const fg = g.createLinearGradient(0, 790, 0, H); fg.addColorStop(0, '#eedec4'); fg.addColorStop(1, '#f2e6d2'); g.fillStyle = fg; g.fillRect(0, 790, W, H - 790);
    // Large pink circle: pale base + red dots denser downward (flat-illustration grain gradient)
    const pc = new Path2D(); pc.arc(PINK[0], PINK[1], PINK[2], 0, 7);
    g.save(); g.clip(pc); const pg = g.createLinearGradient(0, PINK[1] - PINK[2], 0, PINK[1] + PINK[2]); pg.addColorStop(0, 'rgba(246,214,206,.55)'); pg.addColorStop(1, 'rgba(244,196,188,.95)'); g.fillStyle = pg; g.fill(pc); g.restore();
    stipple(g, pc, [PINK[0] - PINK[2], PINK[1] - PINK[2], PINK[0] + PINK[2], PINK[1] + PINK[2]], C.pinkDot, (x, y) => 0.12 + 0.75 * clamp((y - PINK[1] + 120) / 420) * (0.6 + 0.4 * clamp((PINK[0] + 100 - x) / 300)), 11);
    // Lavender block
    const lp = smooth(LAVP); g.fillStyle = C.lav; g.fill(lp);
    stipple(g, lp, [1110, 190, 1600, 770], C.lavDot, (x, y) => 0.06 + 0.6 * clamp((x - 1250) / 340) * clamp((y - 300) / 400 + 0.3), 12);
    // Rug
    const rug = new Path2D(); rug.ellipse(1232, 902, 385, 33, 0, 0, 7); g.fillStyle = C.mint; g.fill(rug); stipple(g, rug, [847, 869, 1617, 935], '#9fcfb4', () => 0.35, 13, 2.4);
    // Soft floor shadow
    g.fillStyle = 'rgba(160,140,120,.22)'; [[185, 902, 100, 9], [1010, 897, 95, 8], [1720, 903, 110, 9]].forEach(([x, y, rx, ry]) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); });
    // White rounded window frame
    g.save(); g.shadowColor = 'rgba(150,120,110,.18)'; g.shadowBlur = 18; g.shadowOffsetY = 8; g.fillStyle = C.white; g.beginPath(); g.roundRect(360, 120, 440, 445, 34); g.fill(); g.restore();
    const panes = new Path2D(); panes.roundRect(380, 140, 400, 400, 22);
    g.save(); g.clip(panes);
    const sg = g.createLinearGradient(0, 140, 0, 540); sg.addColorStop(0, '#a6d4f1'); sg.addColorStop(0.6, '#cbe9f3'); sg.addColorStop(1, '#e0f2ef'); g.fillStyle = sg; g.fillRect(380, 140, 400, 400);
    stipple(g, null, [380, 140, 780, 540], '#7fb8e6', (x, y) => 0.22 * (1 - (y - 140) / 400), 14, 2);
    // City silhouettes
    const bld = (x, y, w, h, col, win, round = 0) => { g.fillStyle = col; g.beginPath(); round ? (g.moveTo(x, y + h), g.lineTo(x, y + round), g.arc(x + w / 2, y + round, w / 2, Math.PI, 0), g.lineTo(x + w, y + h)) : g.rect(x, y, w, h); g.fill();
      if (win) { g.fillStyle = win; for (let yy = y + (round ? round : 0) + 14; yy < y + h - 10; yy += 22) for (let xx = x + 10; xx < x + w - 12; xx += 20) g.fillRect(xx, yy, 9, 10); } };
    bld(380, 420, 74, 120, '#c5b2ec'); bld(505, 372, 68, 168, '#ec9e9a'); bld(398, 452, 88, 88, '#a98fe2', '#fffaf2');
    bld(690, 395, 90, 145, '#c9b6ee', null, 45); bld(597, 430, 78, 110, '#7fb593', '#d6ecd9', 39);
    bld(470, 478, 95, 62, '#e85f57', '#fff3e6'); bld(550, 500, 70, 40, '#f2b33d'); bld(662, 468, 118, 72, C.navy, '#f6c445');
    g.fillStyle = '#4c9a69'; [[405, 540, 28], [768, 540, 22]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, Math.PI, 0); g.fill(); });
    g.restore();
    g.fillStyle = C.white; g.fillRect(572, 140, 15, 400); g.fillRect(380, 332, 400, 15);
    // Windowsill
    g.save(); g.shadowColor = 'rgba(150,120,110,.22)'; g.shadowBlur = 10; g.shadowOffsetY = 6; g.fillStyle = C.white; g.beginPath(); g.roundRect(338, 545, 484, 24, 12); g.fill(); g.restore();
    // Chair behind girl
    g.fillStyle = C.chair; g.beginPath(); g.roundRect(1448, 470, 44, 300, 22); g.fill();
    g.fillStyle = '#6aa680'; g.beginPath(); g.roundRect(1300, 738, 190, 24, 12); g.fill();
    g.strokeStyle = C.chair; g.lineWidth = 12; g.lineCap = 'round'; [[1330, 762, 1312, 898], [1462, 762, 1478, 898], [1478, 770, 1500, 893]].forEach(([a, b, c2, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c2, d); g.stroke(); });
    // Navy rounded table
    g.fillStyle = C.navy; g.beginPath(); g.moveTo(996, 662); g.lineTo(1024, 662); g.lineTo(1030, 882); g.lineTo(990, 882); g.closePath(); g.fill();
    g.beginPath(); g.roundRect(925, 878, 170, 20, 10); g.fill();
    g.beginPath(); g.roundRect(820, 640, 380, 24, 12); g.fill();
    stipple(g, null, [820, 640, 1200, 664], '#3c4178', () => 0.4, 15, 2);
    // Pots
    g.fillStyle = C.red; g.beginPath(); g.moveTo(118, 800); g.lineTo(252, 800); g.lineTo(246, 875); g.quadraticCurveTo(244, 900, 220, 900); g.lineTo(150, 900); g.quadraticCurveTo(126, 900, 124, 875); g.closePath(); g.fill();
    g.fillStyle = C.white; g.fillRect(120, 822, 130, 16);
    stipple(g, null, [118, 800, 252, 900], '#c2403a', (x, y) => y > 838 ? 0.4 : 0.2, 16);
    g.fillStyle = '#9a7ee0'; g.beginPath(); g.roundRect(1628, 735, 176, 24, 8); g.fill();
    g.fillStyle = '#ac94ea'; g.beginPath(); g.moveTo(1640, 758); g.lineTo(1792, 758); g.lineTo(1782, 838); g.quadraticCurveTo(1778, 860, 1755, 860); g.lineTo(1677, 860); g.quadraticCurveTo(1654, 860, 1650, 838); g.closePath(); g.fill();
    stipple(g, null, [1628, 735, 1804, 860], '#8a6cd6', () => 0.4, 17);
    g.strokeStyle = C.navy; g.lineWidth = 7; [[1662, 858, 1648, 902], [1770, 858, 1784, 902]].forEach(([a, b, c2, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c2, d); g.stroke(); });
  }
  // Static paper grain (faint top overlay)
  const grainTex = () => P.cached('fl_grain', W, H, (g) => {
    const im = g.createImageData(W, H), d = im.data, r = U.rng(2026);
    for (let i = 0; i < W * H; i++) { const v = r(); if (v < 0.05) { d[i * 4] = 60; d[i * 4 + 1] = 40; d[i * 4 + 2] = 70; d[i * 4 + 3] = 70; } else if (v > 0.965) { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 255; d[i * 4 + 3] = 90; } }
    g.putImageData(im, 0, 0);
  });

  // ---------- Moving environment ----------
  function sky(c, t) {
    c.save(); const panes = new Path2D(); panes.rect(380, 140, 192, 192); panes.rect(587, 140, 193, 192); c.clip(panes);
    // Sun: slowly rotating/pulsing rays
    const S = [676, 232];
    c.strokeStyle = C.sun; c.lineWidth = 6; c.lineCap = 'round';
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2 + t * 0.35, r0 = 68, r1 = 80 + (k % 2 ? 0 : 6) + Math.sin(t * 5 + k) * 3; c.beginPath(); c.moveTo(S[0] + Math.cos(a) * r0, S[1] + Math.sin(a) * r0); c.lineTo(S[0] + Math.cos(a) * r1, S[1] + Math.sin(a) * r1); c.stroke(); }
    c.drawImage(P.cached('fl_sun', 130, 130, (g) => { g.fillStyle = C.sun; g.beginPath(); g.arc(65, 65, 56, 0, 7); g.fill(); const r = U.rng(5); g.fillStyle = '#e8743a'; for (let i = 0; i < 2600; i++) { const a = r() * 7, d = Math.sqrt(r()) * 55, x = 65 + Math.cos(a) * d, y = 65 + Math.sin(a) * d; if (r() < 0.15 + 0.7 * clamp((x + y - 100) / 110)) g.fillRect(x, y, 2, 2); } }), S[0] - 65, S[1] - 65);
    // Clouds drift left (~0.25px/frame)
    const cloud = (x, y, s) => { c.fillStyle = C.white; c.beginPath(); c.arc(x, y, 22 * s, Math.PI, 0); c.arc(x + 30 * s, y - 10 * s, 28 * s, Math.PI, 0); c.arc(x + 62 * s, y, 20 * s, Math.PI, 0); c.closePath(); c.fill(); c.beginPath(); c.roundRect(x - 22 * s, y - 2, 104 * s, 18 * s, 9 * s); c.fill(); };
    const dx = -(t - 10.8) * 15;
    cloud(445 + dx, 192, 0.8); cloud(540 + dx, 270, 1.15); cloud(760 + dx * 1.2, 310, 0.7);
    // Small plane + dashed trail: x≈440 at 12.0s, x≈750 at 13.75s
    const px = 440 + (t - 12) * 177, py = 156 - (t - 12) * 4;
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 3; c.setLineDash([10, 8]); c.beginPath(); c.moveTo(px - 140, py + 6); c.lineTo(px - 18, py + 2); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#e65a52'; c.beginPath(); c.roundRect(px - 22, py - 5, 40, 11, 6); c.fill(); c.beginPath(); c.moveTo(px - 4, py); c.lineTo(px - 14, py + 14); c.lineTo(px + 2, py + 2); c.fill(); c.beginPath(); c.moveTo(px - 20, py - 2); c.lineTo(px - 26, py - 13); c.lineTo(px - 14, py - 3); c.fill();
    c.restore();
  }
  // Small colored ornaments boil at 4fps (tiny offset/rotation every 0.25s)
  const DECOS = [['plus', 192, 140, C.red, 1.2], ['dots', 258, 248, '#8dc7a2', 1], ['dot', 86, 318, C.yellow, 1], ['squig', 242, 395, C.navy, 1], ['dots', 304, 482, C.navy, 0.9], ['tri', 118, 553, '#b59bec', 1.1], ['dot', 302, 603, C.red, 0.8],
    ['squig', 80, 712, C.yellow, 0.7], ['half', 898, 130, '#8dc7a2', 1], ['tri', 866, 292, C.yellow, 0.9], ['ring', 1172, 99, C.yellow, 1], ['squig', 1268, 113, C.red, 1], ['dot', 1393, 76, C.navy, 0.8], ['plus', 1190, 190, '#b59bec', 0.9],
    ['dot', 1570, 274, C.yellow, 1], ['x', 1786, 258, C.navy, 1], ['half', 1846, 318, C.red, 1]];
  function decos(c, t) {
    const b = Math.floor(t * 4);
    DECOS.forEach(([k, x, y, col, s], i) => {
      const jx = (U.hash(i, b) - 0.5) * 3, jy = (U.hash(i + 50, b) - 0.5) * 3, ja = (U.hash(i + 99, b) - 0.5) * 0.18;
      c.save(); c.translate(x + jx, y + jy); c.rotate(ja); c.scale(s, s); c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
      if (k === 'plus' || k === 'x') { if (k === 'x') c.rotate(0.78); c.lineWidth = 8; c.beginPath(); c.moveTo(-13, 0); c.lineTo(13, 0); c.moveTo(0, -13); c.lineTo(0, 13); c.stroke(); }
      else if (k === 'dot') { c.beginPath(); c.arc(0, 0, 11, 0, 7); c.fill(); }
      else if (k === 'ring') { c.lineWidth = 6; c.beginPath(); c.arc(0, 0, 13, 0, 7); c.stroke(); }
      else if (k === 'tri') { c.beginPath(); c.moveTo(0, -16); c.lineTo(15, 12); c.lineTo(-15, 12); c.closePath(); c.fill(); }
      else if (k === 'half') { c.beginPath(); c.arc(0, 6, 20, Math.PI, 0); c.closePath(); c.fill(); }
      else if (k === 'squig') { c.lineWidth = 5; c.beginPath(); for (let s2 = 0; s2 <= 24; s2++) { const xx = -32 + s2 * 2.7, yy = Math.sin(s2 / 24 * Math.PI * 3 + i) * 8; s2 ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); }
      else if (k === 'dots') { for (let a = 0; a < 3; a++) for (let d = 0; d < 4; d++) { c.beginPath(); c.arc(d * 15 - 22, a * 15 - 15, 3.6, 0, 7); c.fill(); } }
      c.restore();
    });
  }
  // Lamp + light cone swing about ceiling (1010,0)
  function lamp(c, ang) {
    c.save(); c.translate(1010, 0); c.rotate(ang); c.translate(-1010, 0);
    // Light cone: grainy yellow light (cached texture)
    c.drawImage(P.cached('fl_cone', 340, 420, (g) => {
      const r = U.rng(31); for (let i = 0; i < 26000; i++) { const y = r() * 400, w = lerp(56, 150, y / 400), x = 170 + (r() * 2 - 1) * w; const edge = 1 - Math.abs(x - 170) / w;
        const a = (1 - y / 430) * (0.35 + 0.65 * Math.min(1, edge * 3)); if (r() < a) { g.fillStyle = r() < 0.7 ? 'rgba(245,205,95,.75)' : 'rgba(255,240,190,.9)'; g.fillRect(x, y, 2.4, 2.4); } }
    }), 840, 240);
    c.strokeStyle = C.navy; c.lineWidth = 4; c.beginPath(); c.moveTo(1010, 0); c.lineTo(1010, 152); c.stroke();
    c.fillStyle = C.navy; c.beginPath(); c.roundRect(999, 146, 22, 22, 5); c.fill();
    c.fillStyle = C.yellow; c.beginPath(); c.arc(1010, 238, 22, 0, Math.PI); c.fill();
    c.fillStyle = C.red; c.beginPath(); c.moveTo(936, 240); c.bezierCurveTo(936, 190, 970, 164, 1010, 164); c.bezierCurveTo(1050, 164, 1084, 190, 1084, 240); c.closePath(); c.fill();
    c.save(); c.clip(); c.drawImage(P.cached('fl_shadeDots', 150, 80, (g) => { const r = U.rng(41); g.fillStyle = '#c4433e'; for (let i = 0; i < 1500; i++) { const x = r() * 150, y = r() * 78; if (r() < (x / 150) * 0.8) g.fillRect(x, y, 2, 2); } }), 935, 162, 150, 78); c.restore();
    c.restore();
  }
  // Plants: cached leaf textures sway about pot mouth
  function snakePlant(c, ang) {
    c.save(); c.translate(185, 805); c.rotate(ang); c.translate(-185, -805);
    const leaf = (bx, tipx, tipy, w, col, edge) => { c.fillStyle = edge; c.beginPath(); c.moveTo(bx - w, 805); c.quadraticCurveTo(bx - w * 0.6, (805 + tipy) / 2, tipx, tipy); c.quadraticCurveTo(bx + w * 0.8, (805 + tipy) / 2, bx + w, 805); c.closePath(); c.fill();
      c.fillStyle = col; c.beginPath(); c.moveTo(bx - w + 5, 805); c.quadraticCurveTo(bx - w * 0.5, (805 + tipy) / 2 + 10, tipx, tipy + 14); c.quadraticCurveTo(bx + w * 0.6, (805 + tipy) / 2 + 10, bx + w - 5, 805); c.closePath(); c.fill(); };
    leaf(150, 98, 600, 18, '#3f9a62', C.yellow); leaf(222, 272, 625, 17, '#3f9a62', C.yellow); leaf(170, 160, 505, 20, '#2e7f50', '#2e7f50'); leaf(200, 215, 545, 19, '#4aa86c', C.yellow); leaf(186, 120, 690, 14, '#2e7f50', C.yellow); leaf(196, 252, 700, 14, '#4aa86c', '#4aa86c');
    c.restore();
  }
  const leafTex = () => P.cached('fl_mleaf', 200, 150, (g) => {
    // Monstera leaf: darker upper half → pale slits diagonally from midrib to edges → midrib
    g.translate(100, 75); const leaf = new Path2D(); leaf.ellipse(0, 0, 94, 66, 0, 0, 7);
    g.fillStyle = '#2f8a5d'; g.fill(leaf); g.save(); g.clip(leaf); g.fillStyle = '#26774f'; g.fillRect(-100, -70, 200, 70);
    g.strokeStyle = '#eef3ea'; g.lineCap = 'round'; g.lineWidth = 8;
    for (const sg of [-1, 1]) for (let k = 0; k < 5; k++) { const x0 = -58 + k * 28, a = sg * (0.95 - k * 0.05); g.beginPath(); g.moveTo(x0 + 6, sg * 13); g.lineTo(x0 + 6 + Math.cos(a) * 70 * 0.45, sg * 13 + Math.sin(a) * 70); g.stroke(); }
    g.fillStyle = '#eef3ea'; [[-30, -34], [26, 36], [-6, 40]].forEach(([x, y]) => { g.beginPath(); g.ellipse(x, y, 6, 4, 0.4, 0, 7); g.fill(); });
    g.restore();
    g.strokeStyle = '#1f6844'; g.lineWidth = 4; g.beginPath(); g.moveTo(-94, 0); g.lineTo(94, 0); g.stroke();
  });
  const MLEAVES = [[1705, 352, 1.0, -1.57], [1590, 468, 0.82, -2.4], [1845, 448, 0.9, -0.7], [1563, 665, 0.62, -2.9], [1883, 640, 0.66, -0.25]];
  function monstera(c, ang, f) {
    c.save(); c.translate(1715, 738); c.rotate(ang); c.translate(-1715, -738);
    MLEAVES.forEach(([x, y, s, a], i) => {
      const w = Math.sin(f * 0.05 + i * 1.7) * 0.02 + ang * (1 + i * 0.4);
      c.strokeStyle = '#2f8a5d'; c.lineWidth = 6; c.beginPath(); c.moveTo(1715, 738); c.quadraticCurveTo(lerp(1715, x, 0.6), lerp(738, y, 0.3), x, y); c.stroke();
      c.save(); c.translate(x, y); c.rotate(a + Math.PI / 2 + w); c.scale(s, s); c.drawImage(leafTex(), -100, -75); c.restore();
    });
    c.restore();
  }

  // ---------- Girl (RIG.girl head/torso, RIG.ik2 arms, custom legs) ----------
  // Poses: type (closed-eye typing smile) → pet (open eyes, small o mouth, reaches cat) → shock (hands up, open mouth, stress lines)
  function girl(c, f, t, layer) {
    const G = RIG.girl({ s: 1.12, hair: 'bun' });
    const Hd = RIG.girl({ s: 1.344, dy: 43.7, hair: 'bun' });          // Head enlarged 1.2× about neck for flat-illustration proportions
    const A = G.A;
    const pet = seg(f, 688, 704), shock = seg(f, 791, 798), shockE = ease.outBack(shock);
    const jit = f > 830 && f < 888 ? [(U.hash(Math.floor(f / 2), 3) - 0.5) * 4, (U.hash(Math.floor(f / 2), 4) - 0.5) * 3] : [0, 0];
    const breathe = Math.sin(t * 3.2) * 2;
    // Hand targets
    const typ = (k) => [1128 + k * 30, 612 - Math.max(0, Math.sin(t * 22 + k * 2.4)) * 7];
    const petN = [1222 + Math.sin(t * 6) * 6, 548 + Math.cos(t * 6) * 3], petF = [1238, 590];
    const shN = [1228, 432], shF = [1262, 462];
    const tgt = (k) => { let p = typ(k); const q = ease.inOut(pet); p = [lerp(p[0], (k ? petF : petN)[0], q), lerp(p[1], (k ? petF : petN)[1], q)]; return [lerp(p[0], (k ? shF : shN)[0], shockE), lerp(p[1], (k ? shF : shN)[1], shockE)]; };
    const S = [A.shoulder[0] + 6, A.shoulder[1] + 4 + breathe];
    const arm = (Tg, dark, k) => {
      const Sh = [S[0] + (k ? 28 : 0), S[1] + (k ? 10 : 0)];
      const { E, H: Hn } = RIG.ik2(Sh, Tg, 150, 140, -1);
      const sleeve = dark ? C.coralDk : C.coral;
      c.fillStyle = sleeve; c.fill(RIG.taper(Sh, E, 62, 50, 6)); c.fill(RIG.taper(E, Hn, 50, 44, 2));
      const cuffA = [lerp(E[0], Hn[0], 0.82), lerp(E[1], Hn[1], 0.82)];
      c.fillStyle = dark ? '#b8413b' : C.coralDk; c.fill(RIG.taper(cuffA, Hn, 46, 46));
      // Mitten-shaped hands + thumbs; raised fingers spread upward
      const a = Math.atan2(Hn[1] - E[1], Hn[0] - E[0]), hc = [Hn[0] + Math.cos(a) * 18, Hn[1] + Math.sin(a) * 18];
      c.save(); c.translate(...hc); c.rotate(lerp(a, -Math.PI / 2 - 0.25 + k * 0.2, shockE));
      c.fillStyle = dark ? C.skinDk : C.skin; c.beginPath(); c.ellipse(4, 0, 24, 19, 0, 0, 7); c.fill();
      if (shock > 0.3) { for (let i = 0; i < 3; i++) { c.beginPath(); c.roundRect(14, -15 + i * 11, 22 * shockE, 10, 5); c.fill(); } }
      c.beginPath(); c.ellipse(-2, (k ? 1 : -1) * -14, 10, 7, -0.6, 0, 7); c.fill();
      c.restore();
    };
    if (layer === 'back') {
      // Far leg + pink shoe, far arm behind body
      c.fillStyle = '#1d2050'; c.fill(RIG.taper([1440, 718], [1232, 730], 86, 74)); c.fill(RIG.taper([1238, 728], [1246, 848], 68, 58));
      c.fillStyle = C.sock; c.fillRect(1218, 826, 56, 26); c.fillStyle = '#f2a7a0'; c.beginPath(); c.roundRect(1222, 848, 52, 38, 16); c.fill();
      arm(tgt(1), true, 1);
      return;
    }
    if (layer === 'body') {
      // Legs: navy trousers + lavender socks + white sneakers/coral soles
      c.fillStyle = C.pants; c.fill(RIG.taper([1430, 712], [1206, 728], 96, 84)); c.fill(RIG.taper([1206, 724], [1214, 840], 78, 64));
      c.fillStyle = C.sock; c.fillRect(1186, 822, 58, 30);
      c.fillStyle = C.white; c.beginPath(); c.moveTo(1112, 886); c.quadraticCurveTo(1118, 852, 1176, 850); c.lineTo(1236, 850); c.quadraticCurveTo(1244, 870, 1240, 886); c.closePath(); c.fill();
      c.fillStyle = C.red; c.beginPath(); c.roundRect(1106, 884, 136, 12, 6); c.fill();
      // Sweater: RIG torso + hem to hips; diagonal highlight block
      c.save(); c.translate(0, breathe * 0.5);
      const sweater = smooth([[A.neck[0] - 18, A.neck[1] + 2], [A.neck[0] + 40, A.neck[1] - 2], [1418, 446], [1452, 520], [1468, 640], [1462, 740], [1420, 762], [1320, 760], [1296, 690], [1286, 560], [1284, 470]]);
      c.fillStyle = C.coral; c.fill(sweater);
      c.save(); c.clip(sweater); c.fillStyle = C.coralLt; c.beginPath(); c.moveTo(1284, 470); c.lineTo(1340, 440); c.lineTo(1410, 760); c.lineTo(1290, 760); c.closePath(); c.fill();
      c.fillStyle = C.coralDk; c.fillRect(1290, 744, 190, 20); c.restore();
      c.fillStyle = C.coralDk; c.beginPath(); c.roundRect(A.neck[0] - 26, A.neck[1] - 8, 64, 22, 10); c.fill();
      c.restore();
      // Head: neck → rear hair/bun → face → bangs → headphones
      c.save(); c.translate(jit[0], jit[1] + breathe * 0.4);
      const nk = [1300, 401]; c.translate(...nk); c.rotate(-0.04 * pet + 0.05 * shockE); c.translate(-nk[0], -nk[1]);
      c.fillStyle = C.skinDk; c.fill(G.neck);
      c.fillStyle = C.hair; c.fill(Hd.hairBack); c.fill(Hd.bun);
      c.fillStyle = C.hairDk; c.save(); c.clip(Hd.bun); c.beginPath(); c.arc(Hd.bunSpiral[0] + 14, Hd.bunSpiral[1] + 12, 40, 0, 7); c.fill(); c.restore();
      c.fillStyle = C.skin; c.fill(Hd.face);
      c.fillStyle = C.hair; c.fill(Hd.bangs);
      c.strokeStyle = C.hairDk; c.lineWidth = 3.5; c.lineCap = 'round'; Hd.hairLines.forEach(h => c.stroke(h));
      // Blush
      c.fillStyle = C.blush; c.beginPath(); c.arc(Hd.cheek[0] - 2, Hd.cheek[1] + 2, 15, 0, 7); c.fill();
      // Eyes: closed typing arcs → dots (reaction①) → wide eyes (reaction②) → squint after frame 838
      const ex = Hd.eye.x + 2, ey = Hd.eye.y + 2;
      c.strokeStyle = C.navy; c.fillStyle = C.navy; c.lineWidth = 4;
      if (f < 686) { c.beginPath(); c.arc(ex, ey - 4, 10, 0.25 * Math.PI, 0.8 * Math.PI); c.stroke(); }
      else if (f > 838) { c.beginPath(); c.moveTo(ex + 9, ey - 8); c.lineTo(ex - 4, ey - 1); c.lineTo(ex + 9, ey + 5); c.stroke(); }
      else { const big = 1 + 0.35 * shockE; c.beginPath(); c.ellipse(ex, ey, 6.5 * big, 7.5 * big, 0, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(ex - 2, ey - 3, 2.2, 0, 7); c.fill();
        c.strokeStyle = C.hairDk; c.lineWidth = 4; c.beginPath(); c.arc(ex + 2, ey - 6 - 6 * big, 12, 1.15 * Math.PI, 1.75 * Math.PI); c.stroke(); }
      // Mouth: smile → small o → wide open
      const m = [Hd.lips[1][0] + 2, Hd.lips[1][1] + 6];
      if (f < 686) { c.strokeStyle = C.navy; c.lineWidth = 3.5; c.beginPath(); c.arc(m[0] + 4, m[1] - 8, 10, 0.55 * Math.PI, 0.95 * Math.PI); c.stroke(); }
      else if (shock < 0.01) { const o = ease.outBack(seg(f, 686, 692)); c.fillStyle = '#7a2a3a'; c.beginPath(); c.ellipse(m[0] + 2, m[1], 5 * o, 7 * o, 0, 0, 7); c.fill(); }
      else { const o = shockE; c.fillStyle = '#7a2a3a'; c.beginPath(); c.ellipse(m[0] + 3, m[1] + 4 * o, 8 + 4 * o, 8 + 9 * o, 0.1, 0, 7); c.fill(); c.fillStyle = '#ec7a86'; c.beginPath(); c.ellipse(m[0] + 4, m[1] + 4 + 11 * o, 6 * o, 4 * o, 0, 0, 7); c.fill(); }
      // Headphones: white band + yellow cups
      const er = [Hd.ear[0] + 4, Hd.ear[1]];
      c.strokeStyle = C.white; c.lineWidth = 10; c.lineCap = 'round'; c.beginPath(); c.moveTo(er[0] + 2, er[1] - 34); c.quadraticCurveTo(er[0] - 4, Hd.A.headTop[1] - 34, Hd.A.headTop[0] - 40, Hd.A.headTop[1] + 4); c.stroke();
      c.fillStyle = '#dc9a2c'; c.beginPath(); c.roundRect(er[0] - 18, er[1] - 38, 42, 76, 20); c.fill();
      c.fillStyle = C.yellow; c.beginPath(); c.roundRect(er[0] - 24, er[1] - 34, 34, 68, 17); c.fill();
      c.fillStyle = '#f8cf6a'; c.beginPath(); c.roundRect(er[0] - 18, er[1] - 24, 12, 40, 6); c.fill();
      c.restore();
      return { headTop: [Hd.A.headTop[0] + jit[0], Hd.A.headTop[1] + jit[1]], face: Hd.A.forehead };
    }
    if (layer === 'front') { arm(tgt(0), false, 0); }
  }
  // Three stress lines above/front: pale pink at 793 → red at 796; slight jitter 830–888
  function tension(c, f, headTop) {
    if (f < 792) return;
    const q = seg(f, 792, 797), col = P.mix(P.hex('#f6c4c0'), P.hex('#e5463e'), seg(f, 793, 796));
    const j = f > 830 && f < 888 ? (U.hash(Math.floor(f / 2), 9) - 0.5) * 5 : 0;
    const o = [headTop[0] - 30, headTop[1] + 95];          // Radiate above/front of head (shot-list stress lines at (1215–1290, 200–295))
    c.save(); c.strokeStyle = P.rgb(col); c.lineWidth = 7; c.lineCap = 'round';
    [[-2.6, 84, 30], [-2.05, 88, 34], [-1.5, 96, 34]].forEach(([a, r0, L], i) => {
      const r1 = r0 + L * ease.outBack(q), aa = a + j * 0.01 * (i - 1);
      c.beginPath(); c.moveTo(o[0] + Math.cos(aa) * r0 + j, o[1] + Math.sin(aa) * r0); c.lineTo(o[0] + Math.cos(aa) * r1 + j, o[1] + Math.sin(aa) * r1); c.stroke();
    });
    c.restore();
  }

  // ---------- Cat poses (local coordinates, faces right, origin = centroid) ----------
  // Pose: body 10 points, chest 6, head[x,y,rx,ry], two front legs[shoulder x/y,paw x/y], hind legs, tail 4 points, ear angle
  const rel = (o, pts) => pts.map(p => [p[0] - o[0], p[1] - o[1]]);
  const mir = (o, pts) => pts.map(p => [o[0] - (p[0] - o[0]), p[1]]);
  const SIT_F = (() => { const o = [555, 795], R = (pts) => rel(o, pts); return {
    body: R([[430, 905], [428, 852], [452, 794], [505, 760], [570, 752], [626, 768], [662, 818], [672, 872], [658, 905], [540, 908]]),
    chest: R([[612, 762], [660, 800], [674, 862], [660, 906], [622, 906], [606, 840]]),
    haunch: [482 - o[0], 862 - o[1], 54, 44], stripes: [R([[505, 760], [512, 784]]).flat(), R([[466, 780], [486, 796]]).flat(), R([[446, 815], [470, 826]]).flat()],
    head: [628 - o[0], 708 - o[1], 64, 56], front: [R([[648, 842], [650, 896]]).flat(), R([[612, 842], [612, 896]]).flat()],
    tipW: 1, hind: R([[478, 870], [506, 900]]).flat(), tail: R([[438, 893], [392, 905], [380, 945], [420, 950]]), ear: 0, gy: 905 - o[1] }; })();
  const SIT_T = (() => { const o = [1118, 497], M = (pts) => rel(o, mir(o, pts)); return {     // Table sit measured facing left, mirrored right for storage
    body: M([[1040, 628], [1034, 580], [1046, 515], [1072, 470], [1120, 455], [1170, 470], [1215, 520], [1248, 580], [1250, 628], [1140, 632]]),
    chest: M([[1058, 470], [1104, 466], [1114, 545], [1104, 606], [1060, 612], [1042, 540]]),
    haunch: [-(1196 - o[0]), 588 - o[1], 56, 46], stripes: [M([[1172, 468], [1160, 492]]).flat(), M([[1208, 505], [1188, 520]]).flat(), M([[1234, 548], [1210, 556]]).flat()],
    head: [-(1080 - o[0]), 400 - o[1], 68, 58], front: [M([[1062, 545], [1060, 618]]).flat(), M([[1100, 545], [1100, 618]]).flat()],
    tipW: 0, hind: M([[1196, 600], [1162, 622]]).flat(), tail: M([[1240, 620], [1296, 626], [1318, 596], [1300, 562]]), ear: 0, gy: 629 - o[1] }; })();
  const LEAP = { body: [[-125, 12], [-120, -24], [-80, -46], [0, -48], [70, -42], [114, -20], [122, 12], [90, 36], [0, 40], [-90, 36]],
    chest: [[56, 8], [110, -2], [118, 22], [84, 38], [40, 36], [38, 20]], haunch: [-80, 6, 46, 36], stripes: [[-60, -46, -56, -28], [-22, -48, -18, -30], [18, -47, 20, -30]],
    head: [150, -46, 58, 52], front: [[84, 18, 182, 34], [66, 16, 168, 48]],
    tipW: 1, hind: [-92, 16, -190, 40], tail: [[-122, -6], [-172, -22], [-214, -44], [-252, -30]], ear: 0.35, gy: 40 };
  const LAND = { ...LEAP, front: [[84, 18, 118, 74], [66, 16, 98, 76]], hind: [-92, 16, -150, 56], head: [140, -30, 60, 54], body: LEAP.body.map(p => [p[0] * 0.92, p[1] * 1.08]), gy: 76 };
  const mixA = (a, b, q) => Array.isArray(a) ? a.map((v, i) => mixA(v, b[i], q)) : lerp(a, b, q);
  const mixPose = (a, b, q) => { const o = {}; for (const k in a) o[k] = mixA(a[k], b[k], q); return o; };

  function catState(f, t) {
    // Centroid trajectory (shot-list measurements + points before takeoff/after landing)
    const traj = [[657, 555, 795], [660, 555, 800], [662, 560, 752], [664, 573, 691], [666, 606, 639], [668, 660, 599], [670, 719, 563], [672, 784, 536], [674, 849, 518], [676, 916, 508], [678, 979, 505], [680, 1038, 510], [682, 1088, 518], [684, 1126, 524], [686, 1160, 548]];
    const s = { pose: SIT_F, x: 555, y: 795, rot: 0, sx: 1, sy: 1, dir: 1, pivot: 'ground', eyes: 'open', look: 0, paw: null, dust: 0 };
    if (f < 661) {                 // Still sit → preparatory crouch (657–661)
      const q = seg(f, 657.5, 661); s.sy = 1 - 0.14 * ease.inOut(q); s.sx = 1 + 0.07 * ease.inOut(q); s.look = 3 * q; s.poseHeadDy = 8 * q;
    } else if (f < 664) {          // Push off: body rises/stretches
      const q = seg(f, 661, 664); [s.x, s.y] = path(f, traj); s.pivot = 'center'; s.pose = mixPose(SIT_F, LEAP, ease.in(q) * 0.45);
      s.rot = -0.75 * ease.out(q); s.sy = lerp(0.86, 1.12, ease.out(q)); s.sx = lerp(1.07, 0.92, ease.out(q));
    } else if (f < 686) {          // Airborne arc: body tangent to path, horizontally stretched 672–684
      [s.x, s.y] = path(f, traj); s.pivot = 'center';
      const a = path(f + 0.5, traj), b = path(f - 0.5, traj); const tang = Math.atan2(a[1] - b[1], a[0] - b[0]);
      s.pose = mixPose(SIT_F, LEAP, clamp(0.45 + seg(f, 664, 670) * 0.55)); s.rot = tang * 0.8 * (1 - 0.85 * ease.inOut(seg(f, 679, 686)));   // Level body before landing, front paws first
      const st = seg(f, 670, 676); s.sx = lerp(0.95, 1.12, st); s.sy = lerp(1.08, 0.9, st);
      if (f > 682) { const q = seg(f, 682, 686); s.pose = mixPose(s.pose, LAND, q); s.sx = lerp(s.sx, 1.0, q); s.sy = lerp(s.sy, 1.0, q); }
    } else if (f < 698) {          // Landing squash → turn/sit up (flip at maximum squash frame 690)
      s.pivot = 'ground'; const flip = f >= 690; s.dir = flip ? -1 : 1;
      s.x = kf(f, [[686, 1160], [688, 1168], [690, 1150], [694, 1122], [698, 1118]], ease.out);
      s.pose = f < 688 ? LAND : mixPose(LAND, SIT_T, ease.out(seg(f, 688, 696)));
      s.sy = kf(f, [[686, 0.86], [688, 0.72], [690, 0.7], [692, 0.96], [694, 1.07], [696, 0.98], [698, 1]], ease.inOut);
      s.sx = kf(f, [[686, 1.12], [688, 1.18], [690, 1.15], [692, 1.0], [694, 0.95], [698, 1]], ease.inOut);
      s.y = 628 - s.pose.gy;      // Paws on laptop surface
    } else {                       // Sit on table
      s.pose = SIT_T; s.x = 1118; s.y = 497; s.dir = -1; s.pivot = 'ground';
      s.sy = 1 + Math.sin(t * 3) * 0.006;
    }
    // Takeoff dust 664–670
    s.dust = seg(f, 662, 672);
    // Expression
    if (f >= 664 && f < 692) s.eyes = 'wide';
    if (f >= 835) { s.eyes = 'smug'; if ((f >= 856 && f < 876) || (f >= 886 && f < 893)) s.eyes = 'happy'; }
    s.look = f >= 698 && f < 744 ? 0 : f >= 744 && f < 800 ? -4 : s.look;
    return s;
  }
  // Cup bat: f0 = first cup motion; paw prepares 6 frames → strikes 4 → holds 4 → retracts 6
  const SWIPES = [744, 766, 786];
  function pawReach(f) {
    for (const f0 of SWIPES) {
      if (f >= f0 - 7 && f < f0 + 16) {
        if (f < f0) return { k: 'wind', q: ease.inOut(seg(f, f0 - 7, f0)), f0 };
        if (f < f0 + 4) return { k: 'hit', q: ease.out(seg(f, f0, f0 + 4)), f0 };
        if (f < f0 + 8) return { k: 'hold', q: 1, f0 };
        return { k: 'back', q: ease.inOut(seg(f, f0 + 8, f0 + 16)), f0 };
      }
    }
    return null;
  }
  function drawCat(c, s, f, t, cupX) {
    const p = s.pose;
    c.save(); c.translate(s.x, s.y);
    const gy = p.gy;
    if (s.pivot === 'ground') { c.translate(0, gy); c.rotate(s.rot); c.scale(s.dir * s.sx, s.sy); c.translate(0, -gy); }
    else { c.rotate(s.rot); c.scale(s.dir * s.sx, s.sy); }
    // Batting: lean forward, paw reaches cup (world → local)
    let front = p.front.map(l => l.slice()), lean = 0;
    const pr = f >= 736 && f < 805 ? pawReach(f) : null;
    const watch = f >= 724 && f < 812 ? Math.min(seg(f, 724, 736), 1 - seg(f, 800, 812)) * 0.08 : 0;   // Watch cup with slight lean between bats
    if (pr) {
      // Determine crouch from shoulder-to-rim world distance, then lean, invert current transform to rim local coordinates — paw actually contacts cup
      const cxw = (pr.k === 'wind' ? cupX(pr.f0) : cupX(Math.min(f, pr.f0 + 4))) + 34;          // Cup right rim (world)
      const Lmax = 0.1 + 0.28 * clamp((s.x - 70 - cxw - 40) / 130);
      lean = pr.k === 'wind' ? lerp(watch, Lmax * 0.45, pr.q) : pr.k === 'hit' ? lerp(Lmax * 0.45, Lmax, pr.q) : pr.k === 'hold' ? Lmax : lerp(Lmax, watch, pr.q);
      c.translate(0, gy); c.rotate(-lean); c.scale(1, 1 - lean * 0.35); c.translate(0, -gy);
      const m = c.getTransform().invertSelf(), tw = m.transformPoint(new DOMPoint(cxw, 606)), tgt = [tw.x, tw.y];
      const rest = [p.front[0][2], p.front[0][3]], up = [p.front[0][0] + 34, p.front[0][1] - 30];
      let pt;
      if (pr.k === 'wind') pt = [lerp(rest[0], up[0], pr.q), lerp(rest[1], up[1], pr.q)];
      else if (pr.k === 'hit') pt = [lerp(up[0], tgt[0], pr.q), lerp(up[1], tgt[1], pr.q)];
      else if (pr.k === 'hold') pt = tgt;
      else pt = [lerp(tgt[0], rest[0], pr.q), lerp(tgt[1], rest[1], pr.q)];
      front[0] = [p.front[0][0] + 8, p.front[0][1] - 10, pt[0], pt[1]];
    } else if (watch) { lean = watch; c.translate(0, gy); c.rotate(-lean); c.scale(1, 1 - lean * 0.35); c.translate(0, -gy); }
    // Thick white-tipped tail: slow seated sway, flick while batting
    const tl = p.tail.map(q => q.slice()); const sw = Math.sin(t * 4.4) * 14 + (pr ? Math.sin(t * 14) * 10 : 0);
    tl[3][0] += sw * 0.6; tl[3][1] += sw; tl[2][0] += sw * 0.3;
    c.lineCap = 'round'; c.lineJoin = 'round';
    const tailP = new Path2D(); tailP.moveTo(...tl[0]); tailP.bezierCurveTo(...tl[1], ...tl[2], ...tl[3]);
    c.strokeStyle = C.orange; c.lineWidth = 30; c.stroke(tailP);
    c.save(); c.setLineDash([9, 16]); c.lineDashOffset = 4; c.strokeStyle = C.orangeDk; c.lineWidth = 30; c.lineCap = 'butt'; c.stroke(tailP); c.restore();   // Tail rings
    if (p.tipW > 0.05) { c.save(); c.globalAlpha = p.tipW; c.clip((() => { const q = new Path2D(); q.arc(tl[3][0], tl[3][1], 26, 0, 7); return q; })()); c.strokeStyle = C.catWhite; c.lineWidth = 30; c.stroke(tailP); c.restore(); }
    // Hind legs visible airborne
    const hindP = RIG.taper([p.hind[0], p.hind[1]], [p.hind[2], p.hind[3]], 46, 30, 6); c.fillStyle = C.orangeDk; c.fill(hindP);
    // Far front leg
    const leg = (l, col) => { c.fillStyle = col; c.fill(RIG.taper([l[0], l[1]], [l[2], l[3]], 32, 28)); c.fillStyle = C.catWhite; c.beginPath(); c.ellipse(l[2], l[3] - 2, 21, 13, 0, 0, 7); c.fill(); c.strokeStyle = '#e6d6c2'; c.lineWidth = 2.5; c.stroke(); };
    leg(front[1], '#f3e9dc');
    // Body
    const body = smooth(p.body); c.fillStyle = C.orange; c.fill(body);
    c.save(); c.clip(body);
    c.fillStyle = C.catWhite; c.fill(smooth(p.chest));
    // Back tabby stripes
    c.strokeStyle = C.orangeDk; c.lineWidth = 10; c.lineCap = 'round';
    p.stripes.forEach(st => { c.beginPath(); c.moveTo(st[0], st[1]); c.lineTo(st[2], st[3]); c.stroke(); });
    // Haunch: same color block + dark curved edge separates flat body masses
    const [hX, hY, hrx, hry] = p.haunch;
    c.fillStyle = '#f3ad4c'; c.beginPath(); c.ellipse(hX, hY, hrx, hry, 0, 0, 7); c.fill();
    c.strokeStyle = C.orangeDk; c.lineWidth = 6; c.beginPath(); c.ellipse(hX, hY, hrx, hry, 0, -0.2 * Math.PI, 0.75 * Math.PI, true); c.stroke();
    c.lineWidth = 8; [[-0.5, 0.15], [-0.15, 0.2]].forEach(([a0, w]) => { c.beginPath(); c.moveTo(hX + Math.cos(Math.PI + a0) * hrx * 0.95, hY + Math.sin(Math.PI + a0) * hry * 0.95); c.lineTo(hX + Math.cos(Math.PI + a0) * hrx * 0.55, hY + Math.sin(Math.PI + a0) * hry * 0.55); c.stroke(); });
    c.restore();
    c.fillStyle = C.catWhite; c.beginPath(); c.ellipse(p.hind[2], p.hind[3], 20, 12, 0, 0, 7); c.fill();
    // Near front leg (batting paw)
    leg(front[0], C.catWhite);
    // Head
    const [hx, hy0, rx, ry] = p.head, hy = hy0 + (s.poseHeadDy || 0);
    c.save(); c.translate(hx, hy); c.rotate(pr ? -0.08 : 0);
    const ea = p.ear;
    const ear = (x, sgn) => { c.fillStyle = C.orange; c.beginPath(); c.moveTo(x - 26, -ry * 0.55); c.lineTo(x + sgn * 4 - ea * 30 * sgn * 0 - ea * 20, -ry - 30 + ea * 22); c.lineTo(x + 26, -ry * 0.62); c.closePath(); c.fill();
      c.fillStyle = C.earIn; c.beginPath(); c.moveTo(x - 13, -ry * 0.62); c.lineTo(x + sgn * 3 - ea * 20, -ry - 16 + ea * 20); c.lineTo(x + 13, -ry * 0.66); c.closePath(); c.fill(); };
    ear(-30, -1); ear(32, 1);
    c.fillStyle = C.orange; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, 7); c.fill();
    c.fillStyle = C.catWhite; c.beginPath(); c.ellipse(10, ry * 0.42, rx * 0.55, ry * 0.42, 0, 0, 7); c.fill();
    c.strokeStyle = C.orangeDk; c.lineWidth = 6; c.lineCap = 'round'; [-10, 4, 18].forEach(x => { c.beginPath(); c.moveTo(x, -ry + 8); c.lineTo(x, -ry + 26); c.stroke(); });
    // Features
    const E1 = [-14 + s.look, -4], E2 = [32 + s.look, -4];
    c.fillStyle = C.blush; [[-28, 18], [50, 18]].forEach(([x, y]) => { c.globalAlpha = s.eyes === 'smug' || s.eyes === 'happy' ? 0.95 : 0.7; c.beginPath(); c.ellipse(x, y, s.eyes === 'smug' || s.eyes === 'happy' ? 15 : 12, 9, 0, 0, 7); c.fill(); }); c.globalAlpha = 1;
    c.strokeStyle = C.navy; c.fillStyle = C.navy; c.lineWidth = 4.5;
    [E1, E2].forEach(([x, y]) => {
      if (s.eyes === 'smug') { c.beginPath(); c.arc(x, y - 6, 10, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke(); }
      else if (s.eyes === 'happy') { c.beginPath(); c.arc(x, y + 4, 9, 1.1 * Math.PI, 1.9 * Math.PI); c.stroke(); }
      else { const r = s.eyes === 'wide' ? 9 : 8; c.beginPath(); c.ellipse(x, y, r * 0.85, r, 0, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x - 2, y - 3, 2.6, 0, 7); c.fill(); c.fillStyle = C.navy; }
    });
    c.fillStyle = '#e8706a'; c.beginPath(); c.moveTo(4, 12); c.lineTo(14, 12); c.lineTo(9, 18); c.closePath(); c.fill();
    c.strokeStyle = C.navy; c.lineWidth = 2.6; c.beginPath(); c.moveTo(-1, 19); c.quadraticCurveTo(4, 25, 9, 19); c.quadraticCurveTo(14, 25, 19, 19); c.stroke();
    c.strokeStyle = '#ffffff'; c.lineWidth = 2.2; [[-40, 10, -78, 2], [-40, 18, -80, 22], [58, 10, 98, 2], [58, 18, 100, 22]].forEach(([a, b2, c2, d]) => { c.beginPath(); c.moveTo(a, b2); c.lineTo(c2, d); c.stroke(); });
    c.restore();
    c.restore();
  }
  // Takeoff dust: small cream circles spread/fade
  function dust(c, q) {
    if (q <= 0 || q >= 1) return; c.save(); c.fillStyle = `rgba(214,196,170,${0.7 * (1 - q)})`;
    [[-1, 0.8], [-0.5, 1.2], [0.4, 1], [1, 0.7]].forEach(([d, s]) => { c.beginPath(); c.arc(560 + d * (30 + 60 * q), 900 - 10 * q * s, (8 + 16 * q) * s, 0, 7); c.fill(); });
    c.restore();
  }

  // ---------- Cup ----------
  const CUPX = [[744, 981], [746, 975], [748, 949], [750, 937], [752, 932], [766, 932], [768, 906], [770, 887], [772, 879], [774, 877], [786, 877], [788, 865], [790, 830], [792, 811], [794, 802], [796, 801]];
  const cupX = (f) => kf(f, CUPX, ease.linear);
  const FALL = [[796, 801, 605], [798, 794, 612], [800, 786, 623], [802, 776, 640], [804, 766, 664], [806, 755, 695], [808, 746, 733], [810, 739, 779], [812, 738, 831], [814, 743, 887], [815, 744, 896]];
  function cupState(f) {
    if (f < 796) return { x: cupX(f), y: 605, rot: f > 790 ? -0.12 * seg(f, 790, 796) : 0, on: true };
    if (f < 815) { const [x, y] = path(f, FALL); return { x, y, rot: -0.12 - 2.3 * Math.pow(seg(f, 796, 815), 1.3), on: false }; }
    return null;
  }
  function drawMug(c, x, y, rot, s = 1) {
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
    c.strokeStyle = C.cup; c.lineWidth = 9; c.beginPath(); c.arc(-34, -2, 15, 0, 7); c.stroke();
    c.fillStyle = C.cup; c.beginPath(); c.roundRect(-30, -32, 60, 66, [6, 6, 14, 14]); c.fill();
    c.fillStyle = C.cupDk; c.beginPath(); c.roundRect(12, -32, 18, 66, [0, 6, 14, 0]); c.fill();
    c.fillStyle = '#7a3a1a'; c.beginPath(); c.ellipse(0, -32, 30, 5, 0, 0, 7); c.fill();
    c.strokeStyle = '#fff4ea'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-4, -33); c.lineTo(-6, -8); c.stroke();
    c.fillStyle = '#fff4ea'; c.beginPath(); c.roundRect(-14, -8, 16, 18, 3); c.fill(); c.fillStyle = '#4aa36a'; c.beginPath(); c.arc(-6, 1, 4, 0, 7); c.fill();
    c.restore();
  }
  // Coffee drops trail falling cup along previous trajectory, older drops smaller
  function drips(c, f) {
    if (f < 799 || f > 816) return;
    for (let k = 1; k <= 6; k++) { const ff = f - k * 1.3; if (ff < 797) continue; const [x, y] = path(ff, FALL); const r = 7 - k * 0.8;
      c.fillStyle = C.coffee; c.beginPath(); c.ellipse(x + 10 + k * 3, y - 30 - k * 2, r * 0.8, r * 1.2, 0, 0, 7); c.fill(); }
  }
  // Three short motion marks right of cup fade over 10 frames after hit
  function motionMarks(c, f) {
    for (const f0 of SWIPES) { const q = (f - f0) / 12; if (q < 0 || q > 1) continue; const x = cupX(f) + 44, a = 1 - q;
      c.save(); c.strokeStyle = `rgba(38,42,92,${a})`; c.lineWidth = 4; c.lineCap = 'round';
      [[-0.6, 0], [0, 6], [0.6, 2]].forEach(([ang, o], i) => { c.beginPath(); const r0 = 12 + q * 10, r1 = 30 + q * 14; c.moveTo(x + Math.cos(ang) * r0, 588 + Math.sin(ang) * r0 * 1.5); c.lineTo(x + Math.cos(ang) * r1, 588 + Math.sin(ang) * r1 * 1.5); c.stroke(); });
      c.restore(); }
  }
  // Break: radial lines, two large parabolic shards (three shot-list points), debris, spreading coffee stain, gray ripples
  const quad3 = (f, a, b, c3) => { // Three-point (f,x,y) parabolic interpolation (Lagrange)
    const L = (x0, x1, x2, v0, v1, v2) => v0 * ((f - x1) * (f - x2)) / ((x0 - x1) * (x0 - x2)) + v1 * ((f - x0) * (f - x2)) / ((x1 - x0) * (x1 - x2)) + v2 * ((f - x0) * (f - x1)) / ((x2 - x0) * (x2 - x1));
    return [L(a[0], b[0], c3[0], a[1], b[1], c3[1]), L(a[0], b[0], c3[0], a[2], b[2], c3[2])];
  };
  const SHARDS = [{ a: [818, 723, 860], b: [824, 683, 827], c: [834, 673, 897], pts: [[-26, -14], [10, -24], [24, 6], [-6, 22], [-22, 10]], rot: -3 },
    { a: [818, 792, 849], b: [824, 830, 797], c: [834, 830, 891], pts: [[-20, -20], [22, -12], [18, 18], [-14, 16]], rot: 4 }];
  const BITS = Array.from({ length: 9 }, (_, i) => { const r = U.rng(300 + i); return { vx: (r() - 0.5) * 9, vy: -4 - r() * 6, s: 6 + r() * 7, col: [C.cup, C.cup, C.coffee, '#fff4ea', C.cupDk][i % 5], spin: (r() - 0.5) * 0.6, land: 893 + r() * 18 }; });
  function smash(c, f) {
    if (f < 815) return;
    const X = 744, Y = 896;
    // Coffee stain width (818:140 → 822:220 → 826:235)
    const sw = kf(f, [[815, 30], [818, 140], [822, 220], [826, 235]], ease.out);
    c.fillStyle = C.coffee; c.beginPath(); c.ellipse(X + 8, Y + 4, sw / 2, sw * 0.085 + 4, 0, 0, 7); c.fill();
    c.fillStyle = C.coffeeLt; c.beginPath(); c.ellipse(X - 10, Y + 1, sw * 0.18, sw * 0.022 + 1, 0, 0, 7); c.fill();
    // Two gray ripples, maximum width ~560, gone at 838
    [[818, 838], [822, 840]].forEach(([a, b], i) => { const q = seg(f, a, b); if (q <= 0 || q >= 1) return; const w = lerp(160, 560 - i * 100, ease.out(q));
      c.strokeStyle = `rgba(110,105,130,${0.75 * (1 - q)})`; c.lineWidth = 3.5; c.beginPath(); c.ellipse(X + 10, Y + 6, w / 2, w * 0.075, 0, 0, 7); c.stroke(); });
    // Impact radial lines (815–823)
    const iq = seg(f, 815, 823); if (iq < 1) { c.save(); c.strokeStyle = `rgba(38,42,92,${1 - iq})`; c.lineWidth = 5; c.lineCap = 'round';
      for (let k = 0; k < 7; k++) { const a = -Math.PI + (k + 0.5) / 7 * Math.PI, r0 = 30 + iq * 40, r1 = 58 + iq * 52; c.beginPath(); c.moveTo(X + Math.cos(a) * r0, Y - 6 + Math.sin(a) * r0 * 0.75); c.lineTo(X + Math.cos(a) * r1, Y - 6 + Math.sin(a) * r1 * 0.75); c.stroke(); } c.restore(); }
    // Small debris flies outward, stops after landing
    BITS.forEach((b, i) => { const tt = Math.max(0, f - 815); let x = X + b.vx * tt, y = Y - 10 + b.vy * tt + 0.9 * tt * tt * 0.5; if (y > b.land) { const tl = (-b.vy + Math.sqrt(b.vy * b.vy + 2 * 0.45 * 2 * (b.land - Y + 10))) / 0.9; x = X + b.vx * Math.max(0, tl); y = b.land; }
      c.save(); c.translate(x, y); c.rotate(b.spin * Math.min(tt, 18)); c.fillStyle = b.col; c.beginPath(); c.moveTo(-b.s / 2, -b.s / 3); c.lineTo(b.s / 2, -b.s / 2); c.lineTo(b.s / 3, b.s / 2); c.lineTo(-b.s / 2, b.s / 3); c.closePath(); c.fill(); c.restore(); });
    // Two large shards
    SHARDS.forEach(s => { const ff = Math.min(f, 834); const [x, y] = ff < 818 ? [lerp(X, s.a[1], seg(ff, 815, 818)), lerp(Y - 10, s.a[2], seg(ff, 815, 818))] : quad3(ff, s.a, s.b, s.c);
      c.save(); c.translate(x, y); c.rotate(s.rot * seg(ff, 815, 834) * 0.6); c.fillStyle = C.cup; c.beginPath(); s.pts.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.closePath(); c.fill();
      c.fillStyle = C.cupDk; c.beginPath(); c.moveTo(...s.pts[0]); c.lineTo(...s.pts[1]); c.lineTo(0, 0); c.closePath(); c.fill(); c.restore(); });
    // Semicircular handle and teabag label remain on floor
    if (f > 817) { c.strokeStyle = C.cup; c.lineWidth = 8; c.beginPath(); c.arc(X + 30, Y - 4, 13, Math.PI, 0); c.stroke(); c.fillStyle = '#fff4ea'; c.save(); c.translate(X - 12, Y - 4); c.rotate(0.5); c.fillRect(-8, -8, 16, 16); c.fillStyle = '#4aa36a'; c.beginPath(); c.arc(0, 0, 4, 0, 7); c.fill(); c.restore(); }
  }

  // ---------- Laptop + typing bubble ----------
  function laptop(c, f, t) {
    const lid = ease.in(seg(f, 685, 689));                     // Cat landing presses lid closed
    c.fillStyle = C.laptop; c.beginPath(); c.roundRect(1062, 626, 130, 14, 4); c.fill();
    c.fillStyle = C.laptopDk; c.fillRect(1066, 636, 122, 4);
    const a = lerp(-1.91, 0.02, lid), L = 116;
    c.save(); c.translate(1066, 628); c.rotate(a); c.fillStyle = '#b6a8ee'; c.beginPath(); c.roundRect(0, -5, L, 9, 4); c.fill(); c.restore();
    // ••• typing bubble
    const bs = f < 685 ? 1 : 1 - ease.in(seg(f, 685, 689));
    if (bs > 0.01) { c.save(); c.translate(1088, 482); c.scale(bs, bs); c.fillStyle = C.white; c.beginPath(); c.roundRect(-30, -18, 60, 36, 18); c.fill(); c.beginPath(); c.moveTo(-14, 14); c.lineTo(-22, 30); c.lineTo(-2, 16); c.fill();
      c.fillStyle = '#8a7ad8'; for (let k = 0; k < 3; k++) { const j = Math.max(0, Math.sin(t * 10 - k * 0.9)) * 5; c.beginPath(); c.arc(-14 + k * 14, -j, 5, 0, 7); c.fill(); } c.restore(); }
  }
  function steam(c, t, x, y, a) {
    if (a <= 0) return; c.save(); c.globalAlpha = a; c.strokeStyle = '#ffffff'; c.lineWidth = 5; c.lineCap = 'round';
    for (let k = 0; k < 2; k++) { c.beginPath(); for (let s = 0; s <= 16; s++) { const q = s / 16, yy = y - q * 70, xx = x + (k - 0.5) * 18 + Math.sin(t * 6 + k * 2 - q * 6) * 7 * q; s ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); }
    c.restore();
  }

  // ---------- Signature: written left-to-right 844–870, underline follows ----------
  function signature(c, f) {
    if (f < 842) return;
    const front = kf(f, [[842, 1606], [844, 1646], [848, 1682], [852, 1721], [856, 1762], [860, 1801], [864, 1835], [868, 1861], [870, 1868]], ease.linear);
    const txt = window.SIGNATURE || 'Opus 5.5';
    c.save(); c.font = '64px "Caveat-600"'; const w = c.measureText(txt).width, sc = Math.min(1.3, 236 / w);
    c.beginPath(); c.rect(0, 960, front, 120); c.clip();
    c.fillStyle = C.navy; c.translate(1614, 1032); c.rotate(-0.03); c.scale(sc, sc); c.fillText(txt, 0, 0); c.restore();
    // Underline: slightly curved single stroke, tapered end
    c.save(); c.beginPath(); c.rect(0, 960, front, 120); c.clip(); c.strokeStyle = C.navy; c.lineCap = 'round';
    for (let k = 0; k < 24; k++) { const q0 = k / 24, q1 = (k + 1) / 24, X = q => lerp(1606, 1866, q), Y = q => 1046 - Math.sin(q * Math.PI) * 4 - q * 7; c.lineWidth = 3.4 * (1 - q0 * 0.6); c.beginPath(); c.moveTo(X(q0), Y(q0)); c.lineTo(X(q1), Y(q1)); c.stroke(); }
    c.restore();
  }

  return {
    draw(c, lt, t) {
      const f = FR(t);
      c.drawImage(P.cached('fl_bg', W, H, background), 0, 0);
      sky(c, t); decos(c, t);
      // Environmental secondary motion: lamp 686–737 / 830–884, plants sway 697–741 / twitch 821–889
      const lampA = damped(f, 686, 0.055, 26, 22) + damped(f, 830, 0.045, 22, 20) + Math.sin(t * 1.3) * 0.004;
      const plantA = damped(f, 697, 0.035, 22, 18) + damped(f, 821, 0.05, 9, 26) + Math.sin(t * 1.7) * 0.006;
      snakePlant(c, -plantA * 0.8); monstera(c, plantA, f);
      lamp(c, lampA);
      // Floor fragments in front of table
      smash(c, f);
      // Character layer (grain added across it afterward)
      const L = P.scratch('fl_chars'), g = L.getContext('2d'); g.clearRect(0, 0, W, H);
      const cs = cupState(f);
      if (cs && cs.on) { drawMug(g, cs.x, cs.y, cs.rot); }
      girl(g, f, t, 'back');
      laptop(g, f, t);
      const hd = girl(g, f, t, 'body');
      const st = catState(f, t);
      if (f < 690) girl(g, f, t, 'front');
      drawCat(g, st, f, t, cupX);
      if (f >= 690) girl(g, f, t, 'front');
      if (cs && !cs.on) { drips(g, f); drawMug(g, cs.x, cs.y, cs.rot); }
      g.save(); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = 0.9; g.drawImage(grainTex(), 0, 0); g.restore();
      c.drawImage(L, 0, 0);
      dust(c, st.dust);
      if (cs && cs.on) steam(c, t, cs.x - 2, cs.y - 42, 1 - seg(f, 786, 796));
      motionMarks(c, f);
      tension(c, f, hd.headTop);
      signature(c, f);
    },
  };
})();
