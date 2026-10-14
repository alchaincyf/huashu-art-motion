// 1874 Impressionism (Monet) — pure code.
// Pipeline: ① flat underpainting (pink-purple wall + upper-right sunlight, garden: sky/trees/red-roof house/grass/swaying poppies/parasol woman, Impression, Sunrise on wall, round table, vase, right potted plant)
//      → ② P.strokes short strokes (no outlines, regional pastel palettes; wall up-right, floor horizontal, plants radial; 8fps boil = breathing painting)
//      → ③ flat characters (white dress/blue belt, ribboned straw hat, blonde hair; orange-white cat) → finer strokes with same renderer → faint color lines for features only
//      → ④ light patches: floor/table sunlight flickers at independent rhythms; cat-fur glints; petal color dots
SCENES['08_impressionism'] = (() => {
  const W = 1920, H = 1080, { clamp, lerp } = U, P = PAINT;
  const poly = (pts) => { const p = new Path2D(); pts.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); p.closePath(); return p; };
  const WX0 = 372, WX1 = 790, WY0 = 132, WY1 = 548;          // Window opening
  const POPPIES = (() => { const r = U.rng(8), o = []; for (let i = 0; i < 70; i++) { const x = 380 + r() * 200 + (r() < 0.25 ? r() * 200 : 0), y = 420 + r() * 125; o.push([x, y, 5 + r() * 6 + (y - 420) * 0.05, r() * 7]); } return o; })();

  function base(g, t) {
    // Wall: pink-purple, warm yellow upper-right sunlight
    const wg = g.createLinearGradient(0, 0, W, 300); wg.addColorStop(0, '#d8bede'); wg.addColorStop(0.5, '#f0c8cc'); wg.addColorStop(1, '#f2c4d4');
    g.fillStyle = wg; g.fillRect(0, 0, W, 790);
    const sun = g.createRadialGradient(1400, -100, 50, 1400, -100, 900); sun.addColorStop(0, 'rgba(255,240,170,.85)'); sun.addColorStop(1, 'rgba(255,240,170,0)'); g.fillStyle = sun; g.fillRect(700, 0, 1220, 790);
    // Floor
    const fg = g.createLinearGradient(0, 780, 0, H); fg.addColorStop(0, '#d9a8b0'); fg.addColorStop(1, '#d88a80'); g.fillStyle = fg; g.fillRect(0, 780, W, 300);
    g.fillStyle = '#b8a8dc'; g.fillRect(0, 768, W, 18);
    // Garden outside window
    g.save(); g.beginPath(); g.rect(WX0, WY0, WX1 - WX0, WY1 - WY0); g.clip();
    const sk = g.createLinearGradient(0, WY0, 0, 300); sk.addColorStop(0, '#7aa6e2'); sk.addColorStop(1, '#bcd4f0'); g.fillStyle = sk; g.fillRect(WX0, WY0, 420, 180);
    g.fillStyle = '#f6f6ff'; for (const [x, y, rx] of [[450, 175, 50], [520, 165, 40], [640, 190, 60], [720, 160, 40]]) { g.beginPath(); g.ellipse(WX0 - 60 + ((t * 45 + x - WX0 + 60) % 540), y, rx, rx * 0.35, 0, 0, 7); g.fill(); }
    g.fillStyle = '#3e8a46'; g.beginPath(); g.moveTo(WX0, 360); for (let x = WX0; x <= WX1; x += 10) g.lineTo(x, 330 - Math.abs(P.noise(x * 0.02, 1)) * 60 - (x > 600 && x < 720 ? 60 * Math.sin((x - 600) / 120 * Math.PI) : 0)); g.lineTo(WX1, 360); g.closePath(); g.fill();
    g.fillStyle = '#f0e6d0'; g.fillRect(455, 305, 50, 40); g.fillStyle = '#d0402a'; g.beginPath(); g.moveTo(448, 308); g.lineTo(480, 285); g.lineTo(512, 308); g.closePath(); g.fill();
    const mg = g.createLinearGradient(0, 350, 0, WY1); mg.addColorStop(0, '#9ccc5a'); mg.addColorStop(1, '#6aa840'); g.fillStyle = mg; g.fillRect(WX0, 350, 420, 200);
    // Poppies sway (fixed stem bases, heads move sideways)
    for (const [x, y, r, ph] of POPPIES) { const sw = Math.sin(t * 3.6 + ph + x * 0.02) * (10 + r * 0.8), hx = x + sw, hy = y - r * 0.6;
      g.strokeStyle = '#3e7a30'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y + r * 1.4); g.quadraticCurveTo(x + sw * 0.3, y, hx, hy); g.stroke();
      g.fillStyle = '#e8281e'; g.beginPath(); g.ellipse(hx, hy, r, r * 0.75, sw * 0.03, 0, 7); g.fill(); }
    // Parasol woman + child (Poppy Field)
    const wx = 545, wy = 470; g.fillStyle = '#2a3a6a'; g.beginPath(); g.moveTo(wx - 12, wy + 50); g.lineTo(wx + 14, wy + 50); g.lineTo(wx + 5, wy); g.lineTo(wx - 5, wy); g.closePath(); g.fill();
    g.fillStyle = '#f6f0e8'; g.beginPath(); g.arc(wx, wy - 6, 6, 0, 7); g.fill();
    g.fillStyle = '#4aa0c8'; g.beginPath(); g.ellipse(wx - 4, wy - 22, 26, 12, -0.3, Math.PI, 0); g.fill(); g.strokeStyle = '#2a3a6a'; g.lineWidth = 2; g.beginPath(); g.moveTo(wx - 4, wy - 22); g.lineTo(wx + 2, wy + 8); g.stroke();
    g.fillStyle = '#f6f0e8'; g.fillRect(505, 492, 10, 22); g.fillStyle = '#e8b040'; g.beginPath(); g.arc(510, 488, 6, 0, 7); g.fill();
    // Flower beds
    g.fillStyle = '#5a9a40'; g.beginPath(); g.ellipse(735, 505, 44, 34, 0, 0, 7); g.fill();
    for (let k = 0; k < 14; k++) { g.fillStyle = k % 2 ? '#f4a0c0' : '#fff0f4'; g.beginPath(); g.arc(710 + (k * 37 % 56), 485 + (k * 23 % 40), 6, 0, 7); g.fill(); }
    g.fillStyle = '#c87a40'; g.fillRect(722, 530, 26, 20);
    g.restore();
    // White frame + panes + curtain rod + pale-purple curtains
    g.strokeStyle = '#fbf6ee'; g.lineWidth = 18; g.strokeRect(WX0 - 9, WY0 - 9, WX1 - WX0 + 18, WY1 - WY0 + 18);
    g.lineWidth = 9; g.beginPath(); g.moveTo(581, WY0); g.lineTo(581, WY1); g.moveTo(WX0, 270); g.lineTo(WX1, 270); g.moveTo(WX0, 410); g.lineTo(WX1, 410); g.stroke();
    g.fillStyle = '#fbf6ee'; g.fillRect(345, 560, 470, 20);
    g.fillStyle = '#d8b040'; g.fillRect(270, 92, 640, 9);
    for (const [x0, x1] of [[292, 352], [812, 880]]) { const cg = g.createLinearGradient(x0, 0, x1, 0); cg.addColorStop(0, '#c4baf2'); cg.addColorStop(0.5, '#e6e0fc'); cg.addColorStop(1, '#a89ee6'); g.fillStyle = cg; g.beginPath(); g.moveTo(x0, 98); g.lineTo(x1, 98); g.quadraticCurveTo(x1 + 18 * Math.sin(t * 2.2), 380, x1 + 4 + 22 * Math.sin(t * 2.2 - 0.6), 620); g.lineTo(x0 - 4 + 22 * Math.sin(t * 2.2 - 0.6), 620); g.closePath(); g.fill(); }
    // Impression, Sunrise
    g.fillStyle = '#e0b850'; g.fillRect(938, 192, 250, 180);
    const sg = g.createLinearGradient(0, 205, 0, 360); sg.addColorStop(0, '#9aa8c8'); sg.addColorStop(1, '#5a78a8'); g.fillStyle = sg; g.fillRect(950, 204, 226, 156);
    g.fillStyle = '#f05a28'; g.beginPath(); g.arc(1092, 246, 11, 0, 7); g.fill();
    for (let k = 0; k < 5; k++) { g.fillRect(1078 + (k % 2) * 6, 270 + k * 16, 26 - k * 3, 6); }
    g.fillStyle = '#1e2a4a'; g.beginPath(); g.moveTo(1018, 318); g.lineTo(1062, 318); g.lineTo(1056, 328); g.lineTo(1024, 328); g.closePath(); g.fill(); g.fillRect(1038, 300, 3, 18);
    // Chair back
    g.fillStyle = '#8a5a40'; g.fillRect(1476, 470, 14, 420);
    // Round table: legs, cloth, vase, teapot
    g.fillStyle = '#5a4a6a'; g.fillRect(992, 790, 16, 90); g.beginPath(); g.moveTo(940, 892); g.lineTo(1000, 868); g.lineTo(1060, 892); g.lineWidth = 8; g.strokeStyle = '#5a4a6a'; g.stroke();
    const cl = g.createLinearGradient(840, 0, 1200, 0); cl.addColorStop(0, '#f2eefc'); cl.addColorStop(0.6, '#d8d0f4'); cl.addColorStop(1, '#b8aee8');
    g.fillStyle = cl; g.beginPath(); g.moveTo(842, 632); g.lineTo(1198, 632); g.lineTo(1206, 800); g.quadraticCurveTo(1020, 815, 836, 800); g.closePath(); g.fill();
    g.fillStyle = '#faf6ff'; g.beginPath(); g.ellipse(1020, 632, 180, 18, 0, 0, 7); g.fill();
    g.fillStyle = '#a8d0e8'; g.beginPath(); g.moveTo(860, 630); g.quadraticCurveTo(850, 580, 875, 560); g.lineTo(905, 560); g.quadraticCurveTo(925, 590, 912, 630); g.closePath(); g.fill();
    for (let k = 0; k < 22; k++) { const a = k / 22 * Math.PI * 2, rr = 22 + (k * 13 % 30), sw = Math.sin(t * 2.5 + k) * 3; g.fillStyle = ['#f06a8a', '#ffffff', '#c88af0', '#f8c040', '#ff9ab0'][k % 5]; g.beginPath(); g.arc(888 + Math.cos(a) * rr + sw, 525 + Math.sin(a) * rr * 0.8, 9, 0, 7); g.fill(); }
    g.fillStyle = '#5a9a50'; for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse(870 + k * 8, 556, 5, 14, -0.6 + k * 0.25, 0, 7); g.fill(); }
    g.fillStyle = '#f4f4fc'; g.beginPath(); g.moveTo(962, 630); g.lineTo(966, 578); g.quadraticCurveTo(992, 566, 1016, 578); g.lineTo(1020, 630); g.closePath(); g.fill(); g.fillStyle = '#7a8ac8'; g.fillRect(964, 600, 54, 8);
    g.fillStyle = '#c89878'; g.beginPath(); g.ellipse(991, 574, 24, 7, 0, 0, 7); g.fill();
    // Right potted plant: green mass + pink flowers, leaf masses sway
    const sw = Math.sin(t * 2.8) * 24;
    g.fillStyle = '#4fa050'; g.beginPath(); g.moveTo(1560, 780); g.bezierCurveTo(1500 + sw * 0.5, 560, 1600 + sw, 330, 1710 + sw, 300); g.bezierCurveTo(1830 + sw, 330, 1930 + sw * 0.5, 560, 1880, 780); g.closePath(); g.fill();
    g.fillStyle = '#8acc60'; g.beginPath(); g.ellipse(1680 + sw, 480, 90, 140, -0.3, 0, 7); g.fill();
    for (let k = 0; k < 18; k++) { const x = 1590 + (k * 71 % 270) + sw * (1 - (k * 37 % 400) / 500), y = 380 + (k * 53 % 380); g.fillStyle = k % 3 ? '#f070a8' : '#ffd0e4'; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); }
    g.fillStyle = '#f2f4fc'; g.beginPath(); g.moveTo(1650, 780); g.lineTo(1786, 780); g.lineTo(1770, 900); g.lineTo(1666, 900); g.closePath(); g.fill();
    g.fillStyle = '#4a6ad0'; for (let k = 0; k < 6; k++) g.fillRect(1664 + k * 20, 806 + (k % 2) * 30, 12, 20);
    // Ground shadows (cat, table, girl)
    g.fillStyle = 'rgba(150,100,170,.5)'; g.beginPath(); g.ellipse(540, 905, 150, 18, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(1010, 892, 150, 14, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(1300, 930, 210, 18, 0, 0, 7); g.fill();
  }
  const inWin = (x, y) => x > WX0 && x < WX1 && y > WY0 && y < WY1;
  const angle = (x, y, t) => {
    if (x > 945 && x < 1182 && y > 200 && y < 365) return 0.03 * Math.sin(y * 0.3);         // Sunrise: horizontal water strokes
    if (inWin(x, y)) return y < 300 ? 0.05 * Math.sin(x * 0.05) : -0.5 + 0.6 * P.noise(x * 0.03, y * 0.03) + 0.22 * Math.sin(t * 3.2 + x * 0.02);   // Plant strokes turn gently in wind
    if (x > 1520 && y < 790 && y > 280) return Math.atan2(y - 800, x - 1715) + 0.3 * P.noise(x * 0.02, y * 0.02) + 0.12 * Math.sin(t * 1.9);     // Potted plant: radial from pot mouth
    if (y > 780) return 0.12 * P.noise(x * 0.004, y * 0.01) - 0.05;
    if ((x > 280 && x < 360) || (x > 805 && x < 890)) return -Math.PI / 2 + 0.15 * P.noise(x * 0.02, y * 0.01);
    if (x > 830 && x < 1210 && y > 620 && y < 810) return -Math.PI / 2 + 0.2;
    const sunny = x > 1000 && y < 500;
    return (sunny ? -0.95 : -0.55) + 0.55 * P.noise(x * 0.006, y * 0.006 + 5);      // Wall: short Monet-style strokes slant up-right
  };
  const SW = {
    wall: P.swatch(['#f3c6d2', '#e8b6dc', '#f6dcc0', '#d8c0ec', '#fbe8b0', '#f0a8c0', '#c8b8f0', '#fff2d8', '#e8c8f0'], 0.35),
    sunny: P.swatch(['#fff0b0', '#fbe08a', '#ffe8c8', '#f8d0d8', '#fff8e0', '#f0c0d8', '#e8d0f8'], 0.3),
    floor: P.swatch(['#e8a090', '#d88aa0', '#f0b890', '#c890b8', '#f6c8a0', '#b0a0d8', '#e89880'], 0.4),
    sky: P.swatch(['#8ab4e8', '#a8c8f0', '#f0f4ff', '#7aa0e0', '#c0d8f8'], 0.4),
    green: P.swatch(['#5aa84a', '#8ac860', '#3a8a4a', '#b8d870', '#2f7a50', '#a0e080'], 0.4),
    lav: P.swatch(['#b8b0f0', '#d0c8f8', '#9890e0', '#e8e0ff', '#ffffff'], 0.35),
    cloth: P.swatch(['#ece8fa', '#b8b0ec', '#f8f4ff', '#a49ce0', '#fff8f0', '#9a96d8'], 0.45),
  };
  const palette = (x, y, col, r) => {
    if (inWin(x, y)) { const red = col[0] > 180 && col[1] < 90; if (red || (x < 600 && y > 440 && y < 520)) return null; return y < 300 && col[2] > col[1] ? SW.sky(col, r) : (col[1] > col[0] ? SW.green(col, r) : null); }
    if (x > 935 && x < 1192 && y > 188 && y < 376) return null;              // Preserve wall painting
    if (x > 1520 && y > 290 && y < 785) return col[1] > col[0] ? SW.green(col, r) : null;
    if (x > 1640 && y >= 780 && y < 905) return null;
    if (x > 835 && x < 935 && y > 490 && y < 640) return null;                // Vase bouquet
    if (col[0] > 240 && col[1] > 236 && col[2] > 225 && x > 330 && x < 830 && y > 115 && y < 585) return P.mix([255, 252, 246], col, 0.3);   // White window frame
    if ((x > 280 && x < 360 || x > 800 && x < 890) && y > 90 && y < 625) return SW.lav(col, r);
    if (x > 830 && x < 1212 && y > 612 && y < 815) return SW.cloth(col, r);
    if (y > 780) return SW.floor(col, r);
    if (x > 1000 && y < 520) return SW.sunny(col, r);
    return SW.wall(col, r);
  };

  // Sun patches: clusters of bright yellow-white strokes, independent flicker phases, slowly drifting positions
  const SPOTS = (() => { const r = U.rng(5), o = []; for (let i = 0; i < 34; i++) { const onTable = i < 7; o.push({ x: onTable ? 880 + r() * 300 : 380 + r() * 1150, y: onTable ? 632 + r() * 10 : 830 + r() * 220, rx: onTable ? 50 + r() * 50 : 70 + r() * 110, ry: onTable ? 7 : 12 + r() * 18, ph: r() * 7, sp: 5 + r() * 6, seed: i }); } return o; })();
  function sunSpots(c, t) {
    c.save(); c.lineCap = 'round';
    for (const s of SPOTS) {
      const k = 0.5 + 0.5 * Math.sin(t * s.sp + s.ph) * Math.sin(t * s.sp * 0.53 + s.ph * 2), a = clamp(k * 1.3 - 0.15);
      if (a <= 0.02) continue;
      const r = U.rng(s.seed * 31), dx = Math.sin(t * 2.6 + s.ph) * 44, dy = Math.cos(t * 2.0 + s.ph) * 8;     // Fixed seed: strokes retain positions within patch; whole patch drifts/flickers
      for (let i = 0; i < 40; i++) { const u = r() * 2 - 1, v = r() * 2 - 1; if (u * u + v * v > 1) continue;
        const x = s.x + dx + u * s.rx, y = s.y + dy + v * s.ry, L = 14 + r() * 16;
        c.strokeStyle = `rgba(255,${244 + r() * 11 | 0},${180 + r() * 50 | 0},${0.95 * a})`; c.lineWidth = 8 + r() * 5;
        c.beginPath(); c.moveTo(x - L / 2, y + r() * 2); c.lineTo(x + L / 2, y - r() * 3); c.stroke(); }
    }
    c.restore();
  }
  // Bright points in angled sunlight (upper-right wall)
  function wallGlints(c, t) {
    c.save(); c.globalCompositeOperation = 'screen'; c.lineCap = 'round'; const r = U.rng(900);
    for (let i = 0; i < 60; i++) { const x = 1050 + r() * 800, y = 20 + r() * 450, a = Math.max(0, Math.sin(t * 5 + i)); if (a < 0.3) continue;
      c.strokeStyle = `rgba(255,248,200,${0.5 * a})`; c.lineWidth = 6; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 14, y - 18); c.stroke(); }
    c.restore();
  }

  const girlPal = { skin: '#f8d8c8', hair: '#f0cc6a', dress: '#f6f4fc', sleeve: '#f6f4fc', cuff: '#f6f4fc', hat: '#f0d890', hatBand: '#4a6ad8', fold: '#c8c0ec', cheek: 'rgba(240,130,130,.5)', lip: '#e0606a', iris: '#4a70c0', cupBody: '#f4f4fc', cupRim: '#b07850', shoe: '#c8b8e8', line: '#d6a84e', lw: 0 };
  const catPal = { orange: '#f09a40', white: '#fcf4e8', stripe: '#d0702a', eye: '#78c060', line: '#b0602a', whisker: 'rgba(255,255,255,.7)', lw: 0 };
  function girlExtras(g, G, t) {
    // Long rear curls
    const n = G.A.nape, sw = Math.sin(t * 2.3) * 3;
    g.fillStyle = '#ecc460'; g.beginPath(); g.moveTo(n[0] - 20, n[1] - 60); g.bezierCurveTo(n[0] + 60, n[1] - 40, n[0] + 70 + sw, n[1] + 80, n[0] + 66 + sw, n[1] + 170); g.bezierCurveTo(n[0] + 40, n[1] + 190, n[0] + 20, n[1] + 120, n[0] - 10, n[1] + 40); g.closePath(); g.fill();
  }
  function girlTop(g, G, t) {
    // Blue belt/ribbons, small hat flowers, fluttering hat ribbon
    const w = G.A.waist; g.fillStyle = '#4a6ad8'; g.beginPath(); g.moveTo(w[0] - 70, w[1] - 20); g.lineTo(w[0] + 72, w[1] - 22); g.lineTo(w[0] + 72, w[1] + 2); g.lineTo(w[0] - 64, w[1] + 4); g.closePath(); g.fill();
    const fl = Math.sin(t * 6) * 6; g.beginPath(); g.moveTo(w[0] + 66, w[1] - 10); g.quadraticCurveTo(w[0] + 100 + fl, w[1] + 60, w[0] + 86 + fl, w[1] + 140); g.lineTo(w[0] + 72 + fl, w[1] + 136); g.quadraticCurveTo(w[0] + 82, w[1] + 60, w[0] + 58, w[1]); g.closePath(); g.fill();
    if (G.bow) { const b = G.bow, rf = Math.sin(t * 7) * 8; g.fillStyle = '#4a6ad8'; g.beginPath(); g.moveTo(b[0], b[1]); g.quadraticCurveTo(b[0] + 30, b[1] + 40 + rf, b[0] + 20 + rf, b[1] + 110); g.lineTo(b[0] + 8 + rf, b[1] + 106); g.quadraticCurveTo(b[0] + 14, b[1] + 40, b[0] - 6, b[1] + 4); g.closePath(); g.fill(); }
    const top = G.A.headTop; [['#f06a8a', -40, 2], ['#ffffff', -22, -2], ['#f8b040', -4, 4], ['#c88af0', 14, 0], ['#f06a8a', 30, 6]].forEach(([col, dx, dy]) => { g.fillStyle = col; g.beginPath(); g.arc(top[0] + dx + 20, top[1] + dy - 2, 8, 0, 7); g.fill(); });
  }

  function charStrokes(g, src, t) {
    const x0 = 330, y0 = 190, w = 1200, h = 780, cell = 7, sd = src.getContext('2d', { willReadFrequently: true }).getImageData(x0, y0, w, h).data;
    g.save(); g.globalCompositeOperation = 'source-atop'; g.lineCap = 'round'; g.lineWidth = 5;
    for (let j = 0; j < h / cell; j++) for (let i = 0; i < w / cell; i++) {
      const hx = U.hash(i, j), hy = U.hash(j + 7919, i), px = (i + hx) * cell, py = (j + hy) * cell, k = ((py | 0) * w + (px | 0)) * 4;
      if (sd[k + 3] < 200) continue;
      const X = x0 + px, Y = y0 + py, h3 = U.hash(i + 31, j + 17), h4 = U.hash(i + 97, j + 53);
      let col = [sd[k], sd[k + 1], sd[k + 2]];
      if (X > 1080 && col[0] > 235 && col[1] > 235 && col[2] > 240) col = P.mix([[255, 255, 255], [220, 214, 250], [250, 240, 220], [200, 196, 240]][(h3 * 4) | 0], col, 0.4);
      else col = [col[0] + (h3 - .5) * 30, col[1] + (h4 - .5) * 30, col[2] + (hx - .5) * 30];
      const a = X < 760 ? Math.atan2(Y - 790, X - 545) + Math.PI / 2 * 0.8 : (Y < 330 ? -0.2 : -Math.PI / 2 + 0.25 * Math.sin(Y * 0.03)), L = 13 * (0.7 + h4 * 0.6);
      g.strokeStyle = P.rgb(col); g.beginPath(); g.moveTo(X - Math.cos(a) * L / 2, Y - Math.sin(a) * L / 2); g.lineTo(X + Math.cos(a) * L / 2, Y + Math.sin(a) * L / 2); g.stroke();
    }
    g.restore();
  }
  // Keep strokes truly stationary: P.strokes consumes sequential random values; palette=null consumes 3 extra jitter values,
  // and null depends on underpainting color (moving poppies/plants) → reshuffles all later strokes. Here each cell consumes 1 value, never returns null.
  const stable = (pal) => (x, y, col, r) => { const u = r(), rr = U.rng((u * 4294967296) >>> 0); return pal(x, y, col, rr) || P.jitter(col, rr, 24); };
  return {
    draw(c, lt, t) {
      const ch = P.choreo(lt, t);
      const b = P.scratch('impBase'), bg = b.getContext('2d', { willReadFrequently: true });
      base(bg, t);
      c.fillStyle = '#f2e6ee'; c.fillRect(0, 0, W, H);                          // Pale canvas base visible between strokes
      const fine = (x, y) => inWin(x, y) || (x > 945 && x < 1182 && y > 200 && y < 365);
      P.strokes(c, b, { cell: 11, len: 20, width: 7, angle, seed: 12, t, boil: 0, outline: 0, palette: stable(palette), mask: (x, y) => !fine(x, y) });
      P.strokes(c, b, { cell: 6, len: 11, width: 4.5, angle, seed: 13, t, boil: 0, outline: 0, palette: stable(palette), mask: fine });       // Finer strokes for window scene and wall painting
      sunSpots(c, t); wallGlints(c, t);
      // Characters
      const L = P.scratch('impChars'), lg = L.getContext('2d', { willReadFrequently: true }); lg.clearRect(0, 0, W, H);
      const K = RIG.cat({ tail: ch.tail * 2.2, blink: ch.blink, breathe: ch.breathe * 3, look: Math.sin(t * 3) * 2 });     // Cat turns head and flicks tail in sunlight
      const G = RIG.girl({ cup: ch.cup, sip: ch.sip, hat: 'straw', hair: 'long', breathe: ch.breathe });
      RIG.drawCat(lg, K, catPal);
      girlExtras(lg, G, t);
      RIG.drawGirl(lg, G, { ...girlPal, mode: 'fill' });
      girlTop(lg, G, t);
      // Custom character-stroke loop: U.hash(cell index) independent of other cells drawing; lifting cup only changes nearby arm strokes, never reshuffles whole layer
      charStrokes(lg, L, t);
      c.drawImage(L, 0, 0);
      // Features/few structure lines: faint fine purple (Impressionists suggest eyes/mouth without outlining)
      c.save(); c.strokeStyle = 'rgba(110,90,170,.75)'; c.lineWidth = 2.4; c.lineCap = 'round';
      if (ch.blink || ch.cup > 0.85) { c.beginPath(); c.arc(G.eye.x, G.eye.y - 2, 6, 0.3, Math.PI - 0.3); c.stroke(); }
      else { c.fillStyle = '#4a60b0'; c.beginPath(); c.arc(G.eye.x - 1, G.eye.y + 1, 4.2, 0, 7); c.fill(); c.stroke(G.lid); }
      c.lineWidth = 1.8; c.stroke(G.brow);
      c.fillStyle = '#e05a6a'; c.beginPath(); c.moveTo(...G.lips[0]); c.lineTo(...G.lips[1]); c.lineTo(...G.lips[2]); c.closePath(); c.fill();
      K.eyes.forEach(e => { if (K.blink) { c.beginPath(); c.arc(e.x, e.y, 8, 0.2, Math.PI - 0.2); c.stroke(); } else { c.fillStyle = '#7ac060'; c.beginPath(); c.arc(e.x, e.y, 8, 0, 7); c.fill(); c.fillStyle = '#3a3050'; c.beginPath(); c.ellipse(e.x + 2, e.y, 2.6, 6.5, 0, 0, 7); c.fill(); } });
      c.fillStyle = '#e07a80'; c.beginPath(); c.arc(K.nose[0], K.nose[1], 5, 0, 7); c.fill();
      c.lineWidth = 1.3; c.strokeStyle = 'rgba(255,255,255,.8)'; K.whiskers.forEach(w => { c.beginPath(); c.moveTo(...w[0]); c.lineTo(...w[1]); c.stroke(); });
      c.restore();
      // Cat fur sparkles in sun: back-tip highlight strokes flicker
      c.save(); c.globalCompositeOperation = 'screen'; c.lineCap = 'round';
      const catBody = RIG.smooth(K.bodyPts);
      for (let i = 0; i < 60; i++) { const h = U.hash(i, 77), x = 430 + U.hash(i, 3) * 230, y = 570 + U.hash(i, 5) * 200, a = Math.max(0, Math.sin(t * 7 + h * 30));
        if (a < 0.35 || !(c.isPointInPath(catBody, x, y) || c.isPointInPath(K.head, x, y)) || x > 560 + (y - 560) * 0.1) continue;   // Only cat's lit left half brightens
        c.strokeStyle = `rgba(255,250,210,${0.9 * a})`; c.lineWidth = 3.5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 6, y + 9); c.stroke(); }
      c.restore();
      P.steam(c, t, G.cup.x, G.cup.y - 8, { h: 60, n: 2, color: 'rgba(255,255,255,.85)', width: 5, spread: 14, wobble: 9 });
    },
  };
})();
