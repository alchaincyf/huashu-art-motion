// 1889 Post-Impressionism (Van Gogh's Bedroom in Arles + The Starry Night) — pure code. Quality benchmark: use this structure for other eras.
// Pipeline: ① flat underpainting → ② flow-field strokes (vertical wall, perspective floor, swirling sky, circular lamp glow, 8fps boil)
//      → ③ flat characters + fine strokes → ④ redraw contours/features → ⑤ animated highlights (stars, lamp glow, steam)
SCENES['09_postimp'] = (() => {
  const W = 1920, H = 1080, { clamp, lerp } = U, P = PAINT;
  const C = {
    wall: '#5b7bd3', wall2: '#4462bd', sky: '#1d2c7c', sky2: '#3a5bc0', swirl: '#8fb3ec', star: '#f6d84a', halo: '#fbeea0',
    frame: '#2f8f58', frameHi: '#6fd08a', floor: '#b5553b', floor2: '#8a3a2c', wood: '#e3ad38', wood2: '#b57d1c',
    bed: '#d9472f', line: '#1c2458', cypress: '#1f4a2c', village: '#1a2160',
  };
  const VP = [960, 330];                              // Floor perspective vanishing point
  const swirls = [[520, 300, 90], [660, 240, 60], [450, 420, 55], [700, 400, 45]];
  const stars = [[410, 180, 16], [520, 170, 12], [610, 190, 14], [745, 200, 24], [560, 260, 10], [700, 300, 11], [470, 300, 9]];

  function base(g, t) {
    // Wall
    const wg = g.createLinearGradient(0, 0, 0, 720); wg.addColorStop(0, C.wall); wg.addColorStop(1, C.wall2);
    g.fillStyle = wg; g.fillRect(0, 0, W, 720);
    // Floor + plank seams (converge at vanishing point)
    g.fillStyle = C.floor; g.fillRect(0, 700, W, H - 700);
    g.strokeStyle = C.floor2; g.lineWidth = 6;
    for (let i = -14; i <= 14; i++) { g.beginPath(); g.moveTo(VP[0] + i * 60, 700); g.lineTo(VP[0] + i * 230, H); g.stroke(); }
    g.fillStyle = '#3a2a6a'; g.fillRect(0, 696, W, 10);
    // Lamp glow base (broad area, refined by strokes)
    { const hg = g.createRadialGradient(1000, 180, 10, 1000, 180, 105); hg.addColorStop(0, '#fff7c8'); hg.addColorStop(0.55, '#f4d65a'); hg.addColorStop(1, 'rgba(120,150,220,0)'); g.fillStyle = hg; g.beginPath(); g.arc(1000, 180, 105, 0, Math.PI * 2); g.fill(); }
    // Window: starry sky
    g.save(); g.beginPath(); g.rect(370, 140, 420, 400); g.clip();
    const sg = g.createLinearGradient(0, 140, 0, 540); sg.addColorStop(0, C.sky); sg.addColorStop(1, C.sky2); g.fillStyle = sg; g.fillRect(370, 140, 420, 400);
    // Swirls: rotating spiral color bands
    g.lineCap = 'round';
    swirls.forEach(([x, y, r], k) => { for (let ring = 0; ring < 3; ring++) { g.strokeStyle = ring % 2 ? C.swirl : '#5a82d6'; g.lineWidth = 14 - ring * 3; g.beginPath();
      for (let a = 0; a < Math.PI * 3; a += 0.15) { const rr = r * (0.25 + a / (Math.PI * 3)) * (1 - ring * 0.12), aa = a + t * (0.9 + k * 0.2) * (k % 2 ? -1 : 1); const px = x + Math.cos(aa) * rr, py = y + Math.sin(aa) * rr * 0.8; a ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); } });
    // Moon
    g.fillStyle = C.star; g.beginPath(); g.arc(745, 200, 30, 0, Math.PI * 2); g.fill(); g.fillStyle = C.sky; g.beginPath(); g.arc(732, 192, 24, 0, Math.PI * 2); g.fill();
    // Flame-shaped cypress and village
    g.fillStyle = C.cypress; g.beginPath(); g.moveTo(400, 545); g.bezierCurveTo(372, 430, 420, 330, 425, 200); g.bezierCurveTo(445, 320, 470, 430, 452, 545); g.closePath(); g.fill();
    g.fillStyle = C.village; g.beginPath(); g.moveTo(370, 545); [[420, 500], [470, 505], [500, 480], [540, 500], [590, 470], [610, 440], [625, 470], [680, 495], [730, 485], [790, 500], [790, 545]].forEach(p => g.lineTo(...p)); g.closePath(); g.fill();
    g.fillStyle = '#f2c94c'; [[480, 512], [520, 520], [560, 508], [650, 512], [700, 520], [740, 510]].forEach(([x, y]) => g.fillRect(x, y, 8, 8));
    g.restore();
    // Green frame + mullion + sill
    g.lineWidth = 26; g.strokeStyle = C.frame; g.strokeRect(357, 127, 446, 426);
    g.lineWidth = 6; g.strokeStyle = C.frameHi; g.strokeRect(366, 136, 428, 408);
    g.fillStyle = C.frame; g.fillRect(568, 140, 20, 400);
    g.fillStyle = C.frameHi; g.fillRect(330, 552, 500, 22); g.fillStyle = C.frame; g.fillRect(330, 570, 500, 14);
    // Bed (right)
    g.fillStyle = C.wood; g.fillRect(1610, 560, 330, 420); g.fillStyle = C.wood2; g.fillRect(1640, 640, 290, 300);
    g.fillStyle = C.bed; g.beginPath(); g.moveTo(1620, 600); g.quadraticCurveTo(1760, 500, 1940, 520); g.lineTo(1940, 640); g.quadraticCurveTo(1780, 620, 1620, 660); g.closePath(); g.fill();
    g.fillStyle = C.wood; g.fillRect(1598, 520, 26, 470); g.beginPath(); g.arc(1611, 515, 18, 0, Math.PI * 2); g.fill();
  }
  function props(g, t) {
    // Two small wall paintings
    [[1590, 250, 100, 120, '#d9733a', '#66a35a'], [1730, 250, 100, 120, '#e8d36a', '#4f7fc9']].forEach(([x, y, w, h, a, b]) => {
      g.fillStyle = '#d8a83a'; g.fillRect(x - 10, y - 10, w + 20, h + 20); g.fillStyle = b; g.fillRect(x, y, w, h); g.fillStyle = a; g.beginPath(); g.ellipse(x + w / 2, y + h * 0.55, w * 0.28, h * 0.25, 0, 0, Math.PI * 2); g.fill(); });
    // Ladder-back chair behind girl
    g.fillStyle = C.wood; [[1432, 470, 16, 440], [1478, 480, 16, 430]].forEach(r => g.fillRect(...r));
    for (let k = 0; k < 4; k++) g.fillRect(1436, 510 + k * 55, 56, 10);
    g.fillRect(1250, 742, 250, 16); g.fillRect(1262, 750, 14, 160);
    // Table
    g.fillStyle = C.wood; g.fillRect(810, 618, 400, 32); g.fillStyle = C.wood2; g.fillRect(830, 650, 360, 52);
    g.fillStyle = '#e9c46a'; g.fillRect(960, 664, 90, 22); g.fillStyle = '#6b4a1a'; g.beginPath(); g.arc(1005, 675, 5, 0, Math.PI * 2); g.fill();
    g.fillStyle = C.wood; g.fillRect(842, 700, 22, 205); g.fillRect(1160, 700, 22, 205); g.fillRect(842, 860, 340, 12);
    // Vase + sunflowers
    g.fillStyle = '#e8c255'; g.beginPath(); g.moveTo(852, 618); g.quadraticCurveTo(838, 575, 862, 548); g.lineTo(898, 548); g.quadraticCurveTo(920, 575, 905, 618); g.closePath(); g.fill();
    g.strokeStyle = '#4d8a3a'; g.lineWidth = 6; [[870, 548, 842, 490], [880, 548, 890, 462], [890, 548, 930, 502], [875, 548, 868, 528]].forEach(([a, b, c2, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c2, d); g.stroke(); });
    [[842, 490, 26], [890, 462, 28], [930, 502, 24], [866, 526, 18]].forEach(([x, y, r], k) => { const sp = Math.sin(t * 3 + k) * 0.08;
      g.fillStyle = '#f2b51c'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + sp; g.beginPath(); g.ellipse(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, r * 0.45, r * 0.18, a, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#8a4b14'; g.beginPath(); g.arc(x, y, r * 0.45, 0, Math.PI * 2); g.fill(); });
    // Hanging lamp
    g.strokeStyle = '#3a2a2a'; g.lineWidth = 4; g.beginPath(); g.moveTo(1000, 0); g.lineTo(1000, 150); g.stroke();
    g.fillStyle = '#f1c232'; g.beginPath(); g.moveTo(968, 176); g.quadraticCurveTo(1000, 132, 1032, 176); g.closePath(); g.fill();
    
    g.fillStyle = '#fff6c0'; g.beginPath(); g.arc(1000, 182, 12, 0, Math.PI * 2); g.fill();
  }
  // Stroke direction field
  const angle = (x, y, t) => {
    if (x > 370 && x < 790 && y > 140 && y < 540) {               // Sky: tangent to nearest swirl
      let best = null, bd = 1e9; swirls.forEach(s => { const d = Math.hypot(x - s[0], y - s[1]) / s[2]; if (d < bd) { bd = d; best = s; } });
      if (bd < 1.6) return Math.atan2(y - best[1], x - best[0]) + Math.PI / 2 + t * 0.3;
      return 0.15 * Math.sin(x * 0.02 + t) ;
    }
    const dl = Math.hypot(x - 1000, y - 180); if (dl < 150) return Math.atan2(y - 180, x - 1000) + Math.PI / 2;   // Lamp glow: circular
    if (y > 700) return Math.atan2(y - VP[1], x - VP[0]) + 0.06 * Math.sin(t * 2 + x * 0.01);         // Floor: perspective lines
    if (x > 1600 && y > 520) return y < 640 ? -0.12 : -Math.PI / 2;
    if (x > 810 && x < 1210 && y > 610 && y < 705) return 0.02;
    return -Math.PI / 2 + 0.26 * P.noise(x * 0.008 + t * 0.5, y * 0.008 + 3 - t * 0.8);     // Wall: vertical, slowly flickers like flames
  };
  // Regional palettes: each stroke samples its region's colors, mixes some underpainting for shading (Van Gogh's many blues on one wall)
  const SW = {
    wall: P.swatch(['#7f9be6', '#5f7fd8', '#a7bbf2', '#6c6fd2', '#8ad0e6', '#c3cbf6', '#4f6cc8', '#9a8fe0'], 0.3),
    sky: P.swatch(['#22339a', '#2f4fb8', '#5c86dc', '#8fb6ee', '#1b2a78', '#3c6bd0'], 0.45),
    floor: P.swatch(['#c0573c', '#a8453a', '#d7774a', '#8e3b30', '#5f8f6a', '#c96a52', '#e08a5c'], 0.3),
    wood: P.swatch(['#f2c13a', '#e0a020', '#f8d860', '#d08a18', '#b8c040'], 0.15),
    bed: P.swatch(['#e04a32', '#c63a2a', '#f06b45', '#b83224'], 0.4),
    green: P.swatch(['#2f9a5c', '#4fc27a', '#1f7a48', '#8be09a'], 0.35),
    halo: P.swatch(['#fff2a0', '#f6d84a', '#ffe680', '#f0c040'], 0.3),
  };
  const palette = (x, y, col, r) => {
    if (Math.hypot(x - 1000, y - 180) < 92) return SW.halo(col, r);
    if (x > 370 && x < 790 && y > 140 && y < 540) { const L = col[0] + col[1] + col[2]; return L > 500 ? null : SW.sky(col, r); }
    if (x > 340 && x < 830 && y > 115 && y < 590) return SW.green(col, r);
    if (y > 706) return SW.floor(col, r);
    if (x > 1595 && y > 600) return SW.wood(col, r);
    if (x > 1600 && y > 505 && y <= 640) return SW.bed(col, r);
    return SW.wall(col, r);
  };
  // Environmental linework: dark-blue table/chair/bed/window/frame/vase outlines (slight 8fps jitter)
  function lines(c, t) {
    const sd = P.boilSeed(t, 8); c.save(); c.strokeStyle = C.line; c.lineWidth = 4.5; c.lineJoin = 'round';
    const R_ = (pts, closed = true) => { P.roughPath(c, pts, { amp: 2.2, seed: sd * 31 + pts.length + (pts[0][0] | 0), closed, step: 14 }); c.stroke(); };
    R_([[344, 114], [816, 114], [816, 566], [344, 566]]); R_([[370, 140], [790, 140], [790, 540], [370, 540]]); R_([[568, 140], [588, 140], [588, 540], [568, 540]]);
    R_([[330, 552], [830, 552], [830, 584], [330, 584]]);
    R_([[810, 618], [1210, 618], [1210, 650], [810, 650]]); R_([[830, 650], [1190, 650], [1190, 702], [830, 702]]); R_([[960, 664], [1050, 664], [1050, 686], [960, 686]]);
    R_([[842, 700], [864, 700], [864, 905], [842, 905]]); R_([[1160, 700], [1182, 700], [1182, 905], [1160, 905]]);
    R_([[1432, 470], [1448, 470], [1448, 910], [1432, 910]]); R_([[1478, 480], [1494, 480], [1494, 910], [1478, 910]]);
    for (let k = 0; k < 4; k++) R_([[1436, 510 + k * 55], [1492, 510 + k * 55], [1492, 520 + k * 55], [1436, 520 + k * 55]]);
    R_([[1610, 560], [1940, 560], [1940, 980], [1610, 980]]); R_([[1640, 640], [1930, 640], [1930, 940], [1640, 940]]); R_([[1598, 520], [1624, 520], [1624, 990], [1598, 990]]);
    R_([[1580, 240], [1700, 240], [1700, 380], [1580, 380]]); R_([[1720, 240], [1840, 240], [1840, 380], [1720, 380]]);
    R_([[852, 618], [840, 580], [862, 548], [898, 548], [918, 580], [905, 618]]);
    R_([[0, 700], [1940, 700]], false);
    c.lineWidth = 3.5; for (let i = -12; i <= 12; i++) { if (i % 2) continue; R_([[VP[0] + i * 62 * 1.2, 704], [VP[0] + i * 240, 1080]], false); }
    c.restore();
  }
  const girlPal = { skin: '#f8dcc6', hair: '#f2c552', hairLine: '#c4922c', dress: '#3a5fb4', fold: '#2a4386', apron: '#f6f1e6', hat: '#ecc860', hatBand: '#2f50a8',
    cheek: 'rgba(240,120,110,.45)', lip: '#d0504e', iris: '#2a4d90', line: C.line, lw: 4, cupBody: '#2a50b0', cupRim: '#4a2a12' };
  const catPal = { orange: '#ec9433', white: '#fbf1dd', stripe: '#c0621a', line: C.line, lw: 4, eye: '#7ec850' };

  return {
    draw(c, lt, t) {
      const ch = P.choreo(lt, t);
      const b = P.scratch('vgBase'), bg = b.getContext('2d');
      base(bg, t);
      c.drawImage(b, 0, 0);
      const isWall = (x, y) => y < 700 && !(x > 340 && x < 830 && y > 110 && y < 590) && !(x > 1595 && y > 505) && Math.hypot(x - 1000, y - 180) > 125;
      P.strokes(c, b, { cell: 10, len: 22, width: 6.5, angle, seed: 9, t, boil: 0, outline: 0.9, outlineMix: 0.45, palette, mask: (x, y) => !isWall(x, y) && (y <= 704 || (x > 1595 && y < 995)) });
      P.strokes(c, b, { cell: 14, len: 64, width: 8, angle, seed: 19, t, boil: 0, outline: 0.8, outlineMix: 0.38, palette, mask: isWall });
      P.strokes(c, b, { cell: 12, len: 46, width: 8, angle, seed: 29, t, boil: 0, outline: 0.85, outlineMix: 0.45, palette, mask: (x, y) => y > 704 && !(x > 1595 && y < 995) });
      // Props: table, chair, sunflower vase, frames, lamp — separate drawing/fine texture avoids large strokes breaking them up
      const Pr = P.scratch('vgProps'), pg = Pr.getContext('2d'); pg.clearRect(0, 0, W, H); props(pg, t);
      pg.save(); pg.globalCompositeOperation = 'source-atop';
      P.strokes(pg, Pr, { cell: 7, len: 14, width: 4.5, seed: 7, t, boil: 0, outline: 0.5, outlineMix: 0.35, jitterCol: 34, alphaMask: true,
        angle: (x, y) => (y > 650 && y < 905 && ((x > 836 && x < 870) || (x > 1154 && x < 1188) || x > 1425)) ? -Math.PI / 2 : 0.05 });
      pg.restore(); c.drawImage(Pr, 0, 0);
      lines(c, t);
      // Lamp glow: concentric outward pulses
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      for (let k = 0; k < 3; k++) { const ph = ((t * 0.9 + k / 3) % 1), r = 40 + ph * 110; c.strokeStyle = `rgba(255,236,140,${0.28 * (1 - ph)})`; c.lineWidth = 18; c.setLineDash([22, 14]); c.lineDashOffset = -t * 60; c.beginPath(); c.arc(1000, 180, r, 0, Math.PI * 2); c.stroke(); }
      c.setLineDash([]);
      c.restore();
      // Stars: flicker + halos
      stars.forEach(([x, y, r], k) => { const tw = 0.75 + 0.35 * Math.sin(t * 5 + k * 1.7); c.fillStyle = 'rgba(251,238,160,.55)'; c.beginPath(); c.arc(x, y, r * 1.9 * tw, 0, Math.PI * 2); c.fill(); c.fillStyle = C.star; c.beginPath(); c.arc(x, y, r * 0.75 * tw, 0, Math.PI * 2); c.fill(); });
      // Characters: flat colors → fine strokes → linework
      const L = P.scratch('vgChars'), lg = L.getContext('2d'); lg.clearRect(0, 0, W, H);
      const K = RIG.cat({ tail: ch.tail, blink: ch.blink, breathe: ch.breathe });
      const G = RIG.girl({ cup: ch.cup, sip: ch.sip, hat: 'straw', breathe: ch.breathe });
      RIG.drawCat(lg, K, { ...catPal, lw: 0 }); RIG.drawGirl(lg, G, { ...girlPal, mode: 'fill' });
      lg.save(); lg.globalCompositeOperation = 'source-atop';
      P.strokes(lg, L, { cell: 8, len: 16, width: 5, seed: 4, t, boil: 0, outline: 0, jitterCol: 22, alphaMask: true,
        angle: (x, y) => (x < 760 ? Math.atan2(y - 760, x - 545) + Math.PI / 2 : -Math.PI / 2 + 0.3 * Math.sin(y * 0.02)) });   // Van Gogh-style swirl on cat body, vertical girl strokes
      lg.restore();
      // Van Gogh swirls on cat (source's swirling cat)
      lg.save(); lg.clip(K.body); lg.lineCap = 'round';
      for (let ring = 0; ring < 7; ring++) { lg.strokeStyle = ring % 2 ? '#f7c063' : '#c96a1e'; lg.lineWidth = 7; lg.beginPath();
        for (let a = 0; a < Math.PI * 1.7; a += 0.12) { const rr = 18 + ring * 17, aa = a + ring * 0.7 + t * 0.6; const px = 505 + Math.cos(aa) * rr, py = 805 + Math.sin(aa) * rr * 0.9; a ? lg.lineTo(px, py) : lg.moveTo(px, py); } lg.stroke(); }
      lg.restore();
      c.drawImage(L, 0, 0);
      c.drawImage(RIG.visibleLines('vgCat', (g, lc) => RIG.drawCat(g, K, { ...catPal, line: lc, whisker: lc }), C.line, [340, 500, 740, 940]), 0, 0);
      c.drawImage(RIG.visibleLines('vgGirl', (g, lc) => RIG.drawGirl(g, G, { ...girlPal, line: lc }), C.line, [1060, 200, 1520, 950]), 0, 0);
      // Linework draws rear brim through hair: repaint entire hat after lines (fill + short straw strokes + outer outline)
      c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
      [G.brim, G.crown].forEach(p => { c.fillStyle = girlPal.hat; c.fill(p); });
      c.save(); c.clip(G.brim); c.clip(G.brim);
      const hr = U.rng(55); c.lineWidth = 3.5;
      for (let i = 0; i < 70; i++) { const x = G.A.headTop[0] - 140 + hr() * 280, y = G.A.headTop[1] - 40 + hr() * 70; c.strokeStyle = hr() < .5 ? '#f6d977' : '#c99a2e'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 16, y + 2); c.stroke(); }
      c.restore();
      c.save(); c.clip(G.crown); for (let i = 0; i < 30; i++) { const x = G.A.headTop[0] - 60 + hr() * 130, y = G.A.headTop[1] - 50 + hr() * 50; c.strokeStyle = hr() < .5 ? '#f6d977' : '#c99a2e'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 3, y + 14); c.stroke(); } c.restore();
      c.fillStyle = girlPal.hatBand; c.fill(G.band);
      c.strokeStyle = C.line; c.lineWidth = 4; c.stroke(G.brim); c.stroke(G.crown);
      c.restore();
      // Steam curls upward from cup rim
      P.steam(c, t, G.cup.x, G.cup.y - 6, { h: 70, n: 2, color: 'rgba(240,244,255,.85)', width: 4, spread: 14, wobble: 9 });
    },
  };
})();
