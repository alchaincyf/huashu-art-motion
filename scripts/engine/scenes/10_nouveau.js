// 1896 Art Nouveau (Mucha posters) — pure code.
// Pipeline: ① cached base (gray-green gradient + dotted pattern + gold frame + mosaic tile band + green banner + title)
//      → ② animated motifs (sun rising in stained-glass arch, rotating lead rays; swaying poppies/lilies; rotating halo)
//      → ③ offscreen flat characters → dark-brown silhouette offset lower-right = Mucha's thick outer/fine inner contours
//      → ④ fine inner lines + variable-width golden curls, wreath, S-shaped decorative steam
SCENES['10_nouveau'] = (() => {
  const W = 1920, H = 1080, { clamp, lerp } = U, P = PAINT;
  const C = {
    paper: '#efe6cf', gold: '#c9a24a', goldD: '#9c7a2e', line: '#4e3320', green: '#b9cba0', green2: '#cfd3a6', peach: '#ecc9a2',
    dot: 'rgba(120,140,100,.38)', banner: '#8fac80', bannerD: '#6f8f63', cream: '#f6eedb',
    poppy: '#d9706a', poppyD: '#b4504b', stem: '#5f8a58', leaf: '#8fb38a', leafD: '#5f8a58', lily: '#f7f2e6',
    iron: '#3d7763', ironHi: '#5f9a82', wood: '#7a5234',
  };
  const TAU = Math.PI * 2;

  // ---------- Utilities ----------
  // Densify Catmull-Rom into point sequence
  const dense = (pts, n = 10) => {
    const o = [], N = pts.length; const g = i => pts[Math.max(0, Math.min(N - 1, i))];
    for (let i = 0; i < N - 1; i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
      for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t;
        o.push([0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
                0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } }
    o.push(pts[N - 1]); return o;
  };
  // Variable-width path: offset both sides by w(q)/2, return closed Path2D (Mucha's varying outline weight)
  const ribbon = (pts, wf) => {
    const L = [], R = [], n = pts.length;
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      const w = wf(i / (n - 1)) / 2; L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
    }
    const p = new Path2D(); L.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); for (let i = n - 1; i >= 0; i--) p.lineTo(R[i][0], R[i][1]); p.closePath(); return p;
  };
  const taperW = (w0, w1, mid = 1) => q => lerp(w0, w1, q) * (0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, q * 1.15)) * mid + (1 - mid) * 0.45);
  const swellW = (wmax, wend = 1.2) => q => wend + (wmax - wend) * Math.sin(Math.PI * q);   // Tapered ends, thick center
  // Point sequence with spiral end (Art Nouveau whiplash curve)
  const spiral = (cx, cy, r0, a0, turns, dir = 1, n = 28) => { const o = []; for (let i = 0; i <= n; i++) { const q = i / n, a = a0 + dir * q * turns * TAU, r = r0 * (1 - q * 0.85); o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return o; };
  const inkLine = (c, pts, wmax, col = C.line, wend = 1) => { c.fillStyle = col; c.fill(ribbon(dense(pts, 8), swellW(wmax, wend))); };

  // ---------- ① Base (cached) ----------
  const bg = () => P.cached('nv_bg', W, H, (g) => {
    g.fillStyle = C.paper; g.fillRect(0, 0, W, H);
    const gr = g.createLinearGradient(0, 30, 0, 905); gr.addColorStop(0, C.green); gr.addColorStop(0.55, C.green2); gr.addColorStop(1, C.peach);
    g.fillStyle = gr; g.fillRect(34, 32, W - 68, 875);
    // Dotted pattern: ring + center dot, diamond stagger
    g.strokeStyle = C.dot; g.fillStyle = C.dot; g.lineWidth = 1.6;
    for (let j = 0, y = 62; y < 900; y += 54, j++) for (let x = 64 + (j % 2) * 31; x < 1880; x += 62) {
      g.beginPath(); g.arc(x, y, 10, 0, TAU); g.stroke(); g.beginPath(); g.arc(x, y, 2.6, 0, TAU); g.fill(); }
    // Faint lithographic mottling (enlarged small noise image)
    const nz = P.canvas(240, 135), ng = nz.getContext('2d'), im = ng.createImageData(240, 135);
    for (let y = 0; y < 135; y++) for (let x = 0; x < 240; x++) { const v = P.fbm(x * 0.05, y * 0.05, 4), i = (y * 240 + x) * 4; im.data[i] = 90; im.data[i + 1] = 70; im.data[i + 2] = 40; im.data[i + 3] = clamp(v * 1.4 + 0.15) * 60; }
    ng.putImageData(im, 0, 0); g.globalAlpha = 0.5; g.drawImage(nz, 0, 0, W, H); g.globalAlpha = 1;
    // Mosaic floor-tile band
    const tiles = ['#f1ead6', '#8fb08a', '#c9a24a', '#f1ead6', '#a9c39a', '#d98c8c', '#c9a24a', '#f1ead6', '#6f9a80'];
    g.fillStyle = C.line; g.fillRect(34, 898, W - 68, 34);
    for (let k = 0, x = 38; x < 1880; x += 24, k++) { g.fillStyle = tiles[(k * 7 + (k >> 2)) % tiles.length]; g.fillRect(x, 903, 20, 24); }
    // Green banner
    g.fillStyle = C.banner; g.fillRect(34, 934, W - 68, 114);
    g.fillStyle = C.line; g.fillRect(34, 932, W - 68, 3); g.fillRect(34, 1046, W - 68, 3);
    // Whiplash foliage on banner sides (mirrored)
    const whip = (s) => { g.save(); if (s < 0) { g.translate(W, 0); g.scale(-1, 1); }
      g.fillStyle = C.cream; g.fill(ribbon(dense([[100, 960], [112, 948], [128, 958], [200, 985], [300, 990], [400, 984]], 10), swellW(7, 1)));
      g.fillStyle = C.gold; g.fill(ribbon(dense([[130, 1010], [150, 1022], [180, 1004], [260, 985], [330, 975], [380, 975]], 10), swellW(8, 1)));
      g.fillStyle = C.cream; g.fill(ribbon(dense(spiral(112, 956, 16, Math.PI, 0.9, 1), 2), q => 4.5 - q * 3));
      g.fillStyle = C.gold; g.fill(ribbon(dense(spiral(142, 1012, 15, 0, 0.8, -1), 2), q => 5 - q * 3.5));
      g.strokeStyle = C.line; g.lineWidth = 1.2; g.fill(ribbon(dense([[200, 1030], [260, 1010], [340, 1000]], 10), swellW(3, .6)));
      g.fillStyle = '#d07a86'; g.beginPath(); g.arc(420, 993, 8, 0, TAU); g.fill();
      g.restore(); };
    whip(1); whip(-1);
    // Title
    g.font = '76px "Marcellus-400"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.letterSpacing = '12px';
    g.lineJoin = 'round'; g.strokeStyle = C.line; g.lineWidth = 7; g.strokeText('THÉ DU CHAT ROUX', 966, 994);
    g.fillStyle = C.cream; g.fillText('THÉ DU CHAT ROUX', 966, 994); g.letterSpacing = '0px';
    // Gold frame: thick outer gold + fine inner brown
    g.strokeStyle = C.gold; g.lineWidth = 6; g.strokeRect(22, 20, W - 44, H - 40);
    g.strokeStyle = C.line; g.lineWidth = 2; g.strokeRect(31, 29, W - 62, H - 58); g.strokeRect(16, 14, W - 32, H - 28);
  });

  // ---------- ② Stained-glass arch ----------
  const WX0 = 362, WX1 = 800, WY = 548, ACX = 581, ACY = 250, ARX = 219, ARY = 130;
  const archPath = (ins) => { const p = new Path2D(); p.moveTo(WX0 + ins, WY - ins); p.lineTo(WX0 + ins, ACY); p.ellipse(ACX, ACY, ARX - ins, ARY - ins, 0, Math.PI, TAU); p.lineTo(WX1 - ins, WY - ins); p.closePath(); return p; };
  const archPts = (ins) => { const o = []; for (let y = WY - ins; y > ACY; y -= 4) o.push([WX0 + ins, y]); for (let a = Math.PI; a <= TAU + 1e-6; a += 0.02) o.push([ACX + Math.cos(a) * (ARX - ins), ACY + Math.sin(a) * (ARY - ins)]); for (let y = ACY; y < WY - ins; y += 4) o.push([WX1 - ins, y]); return o; };
  const hill = (y0, amp, ph, f = 0.016) => { const o = []; for (let x = WX0; x <= WX1 + 10; x += 12) o.push([x, y0 + Math.sin(x * f + ph) * amp + Math.sin(x * f * 2.3 + ph * 2) * amp * 0.35]); return o; };
  const bands = [[372, 16, 0.5, '#f2dd9c'], [398, 18, 2.2, '#efc39c'], [424, 16, 4.1, '#e6a7a0'], [452, 14, 1.3, '#a9cfa0'], [490, 10, 3.3, '#7fb5a8']];
  function windowGlass(c, lt, t) {
    const inner = archPath(30);
    c.save(); c.clip(inner);
    const sg = c.createLinearGradient(0, 130, 0, 400); sg.addColorStop(0, '#86bfbd'); sg.addColorStop(0.6, '#b9d8b3'); sg.addColorStop(1, '#e9e2a8');
    c.fillStyle = sg; c.fillRect(WX0, 110, WX1 - WX0, 440);
    // Sun rises behind hills (source ~-5px/frame)
    const k = clamp(lt, 0, 1.4), sx = 583 - (k - 0.267) * 20, sy = 400 - (k - 0.267) * 288;
    // Lead rays radiate from sun center, rotate with time
    c.strokeStyle = C.line; c.lineWidth = 3.5; c.lineCap = 'round';
    const rot = lt * 0.9;
    for (let i = 0; i < 14; i++) { const a = Math.PI + (i + 0.5) / 14 * Math.PI + Math.sin(rot + i) * 0.04 + rot * 0.25; c.beginPath(); c.moveTo(sx + Math.cos(a) * 92, sy + Math.sin(a) * 92); c.lineTo(sx + Math.cos(a) * 420, sy + Math.sin(a) * 420); c.stroke(); }
    // Two curved sky leads
    c.lineWidth = 3; [[0.78, 150], [1.15, 200]].forEach(([e, r]) => { c.beginPath(); c.ellipse(sx, sy, r * 1.25, r * e * 0.75, 0, Math.PI, TAU); c.stroke(); });
    // Halo ring + sun disk
    c.fillStyle = '#f7e2a0'; c.beginPath(); c.arc(sx, sy, 80, 0, TAU); c.fill(); c.stroke();
    const sun = c.createRadialGradient(sx - 14, sy - 14, 6, sx, sy, 64); sun.addColorStop(0, '#f8c860'); sun.addColorStop(1, '#e8a43c');
    c.fillStyle = sun; c.beginPath(); c.arc(sx, sy, 62, 0, TAU); c.fill(); c.lineWidth = 4; c.stroke();
    // Hill color bands (hide lower sun)
    bands.forEach(([y0, amp, ph, col], i) => { const pts = hill(y0, amp, ph + Math.sin(t * 1.4 + i) * 0.12); c.fillStyle = col; c.beginPath(); c.moveTo(WX0 - 10, 560); pts.forEach(p => c.lineTo(p[0], p[1])); c.lineTo(WX1 + 10, 560); c.closePath(); c.fill(); c.lineWidth = 3.5; c.beginPath(); pts.forEach((p, j) => j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); });
    // Iris: white standards + purple/pink falls, sword leaves
    [[456, 452, '#b27ec4', 0], [580, 462, '#e3a0b0', 1.7], [704, 452, '#a777c0', 3.1]].forEach(([x, y, fc, ph]) => {
      const sw = Math.sin(t * 5 + ph) * 4;
      c.fillStyle = '#6aa860'; c.lineWidth = 2.5;
      [[-34, -40], [30, -46], [-14, -60], [46, -20]].forEach(([dx, dy], j) => { const p = ribbon(dense([[x + dx * 0.2, 560], [x + dx * 0.6 + sw * 0.5, y + 50], [x + dx + sw, y + dy + 40]], 8), q => 14 * (1 - q) + 1); c.fill(p); c.stroke(p); });
      c.strokeStyle = C.line; c.lineWidth = 6; c.beginPath(); c.moveTo(x, 560); c.quadraticCurveTo(x + sw * 0.5, y + 50, x + sw, y); c.stroke(); c.strokeStyle = '#6aa860'; c.lineWidth = 3; c.stroke(); c.strokeStyle = C.line;
      const fx = x + sw;
      [-1, 1].forEach(s => { c.fillStyle = fc; c.lineWidth = 3; c.beginPath(); c.ellipse(fx + s * 26, y + 12, 26, 17, s * 0.5, 0, TAU); c.fill(); c.stroke(); });
      c.fillStyle = '#f5f0e4'; c.beginPath(); c.moveTo(fx, y + 6); c.bezierCurveTo(fx - 22, y - 14, fx - 14, y - 50, fx, y - 66); c.bezierCurveTo(fx + 14, y - 50, fx + 22, y - 14, fx, y + 6); c.fill(); c.stroke();
    });
    c.restore();
    // Small colored glass border (one color per cell along inner arch)
    const pts = archPts(22); let acc = 0, k2 = 0; const cols = ['#3f7fa0', '#e0b040', '#6fb0a0', '#e9e0c4', '#3f7fa0', '#d9a03a'];
    c.lineWidth = 1.5; c.strokeStyle = C.line;
    for (let i = 1; i < pts.length; i++) { acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (acc >= 17) { acc = 0; const a = Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]); c.save(); c.translate(pts[i][0], pts[i][1]); c.rotate(a); c.fillStyle = cols[k2++ % cols.length]; c.fillRect(-7, -7, 14, 14); c.strokeRect(-7, -7, 14, 14); c.restore(); } }
    // Wood arch frame + sill
    c.lineWidth = 16; c.strokeStyle = '#6b4a2e'; c.stroke(archPath(8)); c.lineWidth = 3; c.strokeStyle = C.line; c.stroke(archPath(0)); c.stroke(archPath(15)); c.stroke(archPath(30));
    c.fillStyle = '#6b4a2e'; c.fillRect(348, 540, 466, 22); c.strokeRect(348, 540, 466, 22);
  }

  // ---------- Swaying side flowers: poppy left, lily right ----------
  const poppyHead = (c, x, y, r, rot) => {
    c.save(); c.translate(x, y); c.rotate(rot);
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; c.save(); c.rotate(a); c.fillStyle = i % 2 ? C.poppy : '#df7d74';
      c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(r * 0.9, -r * 0.55, r * 1.12, r * 0.25, r * 0.4, r * 0.62); c.closePath(); c.fill(); c.strokeStyle = C.line; c.lineWidth = 2.5; c.stroke(); c.restore(); }
    c.strokeStyle = C.poppyD; c.lineWidth = 2; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + 0.3; c.beginPath(); c.moveTo(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3); c.lineTo(Math.cos(a) * r * 0.75, Math.sin(a) * r * 0.75); c.stroke(); }
    c.fillStyle = '#3f6a4a'; c.beginPath(); c.arc(0, 0, r * 0.24, 0, TAU); c.fill(); c.strokeStyle = C.line; c.lineWidth = 2.5; c.stroke();
    c.fillStyle = '#e2b84a'; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; c.beginPath(); c.arc(Math.cos(a) * r * 0.36, Math.sin(a) * r * 0.36, 3, 0, TAU); c.fill(); }
    c.restore();
  };
  const lilyHead = (c, x, y, r, rot) => {
    c.save(); c.translate(x, y); c.rotate(rot); c.lineWidth = 2.5; c.strokeStyle = C.line;
    for (let i = 0; i < 6; i++) { c.save(); c.rotate(i / 6 * TAU + (i % 2) * 0.1); const rr = i % 2 ? r * 0.85 : r;
      c.fillStyle = C.lily; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(rr * 0.35, -rr * 0.28, rr, 0); c.quadraticCurveTo(rr * 0.35, rr * 0.28, 0, 0); c.fill(); c.stroke();
      c.strokeStyle = '#b9a98a'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(rr * 0.15, 0); c.lineTo(rr * 0.8, 0); c.stroke(); c.strokeStyle = C.line; c.lineWidth = 2.5; c.restore(); }
    c.strokeStyle = '#a07a2a'; c.lineWidth = 1.5; for (let i = 0; i < 5; i++) { const a = -1.2 + i * 0.6; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * r * 0.42, Math.sin(a) * r * 0.42); c.stroke(); c.fillStyle = '#d99a2a'; c.beginPath(); c.arc(Math.cos(a) * r * 0.42, Math.sin(a) * r * 0.42, 3, 0, TAU); c.fill(); }
    c.restore();
  };
  // Stem: root-to-head whiplash curve, sway moves upper section only
  const stem = (c, base, head, bend, w = 9) => { const pts = dense([base, [lerp(base[0], head[0], 0.35) + bend, lerp(base[1], head[1], 0.35)], [lerp(base[0], head[0], 0.7) - bend * 0.6, lerp(base[1], head[1], 0.7)], head], 8);
    c.fillStyle = C.line; c.fill(ribbon(pts, q => w + 3 - q * 3)); c.fillStyle = C.stem; c.fill(ribbon(pts, q => w - 1 - q * 3)); };
  const blade = (c, base, tip, bend, w = 34) => { const pts = dense([base, [lerp(base[0], tip[0], 0.45) + bend, lerp(base[1], tip[1], 0.45)], tip], 10);
    const p = ribbon(pts, q => w * Math.sin(Math.PI * Math.min(1, 0.12 + q * 0.88)) + 1); c.fillStyle = C.leaf; c.fill(p); c.strokeStyle = C.line; c.lineWidth = 2.5; c.stroke(p);
    c.strokeStyle = C.leafD; c.lineWidth = 2; c.beginPath(); pts.slice(2, -3).forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke(); };
  function flowers(c, t) {
    const sw = (ph, amp = 1) => (Math.sin(t * 7.5 + ph) * 13 + Math.sin(t * 3.1 + ph * 2) * 5) * amp;
    // Left: poppy
    blade(c, [70, 900], [40, 640], 30 + sw(0.4, 0.3)); blade(c, [120, 900], [190, 690], -20 + sw(1.4, 0.3), 28); blade(c, [200, 900], [300, 640], -30 + sw(2.2, 0.3), 30);
    const ps = [[[100, 900], [110, 215], 66, 0], [[150, 900], [234, 372], 62, 1.3], [[180, 900], [162, 495], 52, 2.6]];
    ps.forEach(([b, h, r, ph]) => { const d = sw(ph); stem(c, b, [h[0] + d, h[1] + Math.abs(d) * 0.2], 40 - ph * 20); });
    // Bud
    { const d = sw(3.5); stem(c, [230, 900], [272 + d, 222], -40, 8); c.fillStyle = '#9fc3a0'; c.strokeStyle = C.line; c.lineWidth = 2.5; c.beginPath(); c.ellipse(272 + d, 205, 24, 28, 0.2, 0, TAU); c.fill(); c.stroke();
      c.beginPath(); c.arc(240 + d * 0.8, 222, 12, 0, TAU); c.stroke(); }
    ps.forEach(([b, h, r, ph]) => { const d = sw(ph); poppyHead(c, h[0] + d, h[1] + Math.abs(d) * 0.2, r, d * 0.012 + ph); });
    // Right: lily
    blade(c, [1690, 900], [1600, 640], 40 + sw(5, 0.3), 30); blade(c, [1760, 900], [1830, 600], -20 + sw(6, 0.3), 26); blade(c, [1830, 900], [1880, 720], -10 + sw(4.4, 0.3), 24); blade(c, [1720, 900], [1660, 760], 30, 22);
    const ls = [[[1730, 900], [1712, 300], 82, 4.0], [[1700, 900], [1652, 520], 62, 5.1], [[1800, 900], [1822, 470], 64, 6.3]];
    ls.forEach(([b, h, r, ph]) => { const d = -sw(ph); stem(c, b, [h[0] + d, h[1]], -30 + (ph - 5) * 30, 8); });
    { const d = -sw(7); stem(c, [1820, 900], [1838 + d, 360], 20, 7); c.fillStyle = C.lily; c.strokeStyle = C.line; c.lineWidth = 2.5; c.beginPath(); c.ellipse(1840 + d, 330, 11, 34, 0.1, 0, TAU); c.fill(); c.stroke(); }
    ls.forEach(([b, h, r, ph]) => { const d = -sw(ph); lilyHead(c, h[0] + d, h[1], r, -0.3 + d * 0.01 + ph); });
  }

  // ---------- Halo (slow rotation) ----------
  function girlHalo(c, cx, cy, t) {
    const R = 172, rot = t * 0.9;
    c.save(); c.lineWidth = 3; c.strokeStyle = C.line;
    c.fillStyle = C.gold; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill(); c.stroke();
    // Rotating studs on gold ring
    for (let i = 0; i < 18; i++) { const a = rot + i / 18 * TAU; const x = cx + Math.cos(a) * (R - 13), y = cy + Math.sin(a) * (R - 13);
      c.fillStyle = C.cream; c.beginPath(); c.arc(x, y, 7.5, 0, TAU); c.fill(); c.lineWidth = 2; c.stroke(); c.fillStyle = '#c0606a'; c.beginPath(); c.arc(x, y, 3, 0, TAU); c.fill(); }
    c.lineWidth = 3; c.fillStyle = '#5f9a8a'; c.beginPath(); c.arc(cx, cy, R - 26, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#ebb8b2'; c.beginPath(); c.arc(cx, cy, R - 34, 0, TAU); c.fill(); c.stroke();
    // Rose-window petals (counter-rotate)
    c.save(); c.translate(cx, cy); c.rotate(-rot * 0.7); c.strokeStyle = '#c98a86'; c.lineWidth = 2;
    for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 16; i++) { c.save(); c.rotate(i / 16 * TAU + ring * TAU / 32); const r0 = ring ? 40 : 70, r1 = ring ? 95 : 132;
      c.fillStyle = ring ? '#e3a5a0' : '#efc4be'; c.beginPath(); c.moveTo(r0, 0); c.quadraticCurveTo((r0 + r1) / 2, -20 + ring * 6, r1, 0); c.quadraticCurveTo((r0 + r1) / 2, 20 - ring * 6, r0, 0); c.fill(); c.stroke(); c.restore(); }
    c.restore(); c.restore();
  }
  function catHalo(c, cx, cy, t) {
    const R = 106, rot = -t * 1.1;
    c.save(); c.strokeStyle = C.line; c.lineWidth = 3;
    c.fillStyle = C.gold; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill(); c.stroke();
    c.setLineDash([10, 8]); c.lineDashOffset = rot * 40; c.strokeStyle = C.goldD; c.lineWidth = 6; c.beginPath(); c.arc(cx, cy, R - 8, 0, TAU); c.stroke(); c.setLineDash([]);
    c.strokeStyle = C.line; c.lineWidth = 3; c.fillStyle = '#b8473a'; c.beginPath(); c.arc(cx, cy, R - 16, 0, TAU); c.fill(); c.stroke();
    c.save(); c.translate(cx, cy); c.rotate(rot);
    for (let i = 0; i < 8; i++) { c.save(); c.rotate(i / 8 * TAU); c.fillStyle = '#e8924a'; c.beginPath(); c.moveTo(14, 0); c.quadraticCurveTo(48, -20, 84, 0); c.quadraticCurveTo(48, 20, 14, 0); c.fill(); c.lineWidth = 2; c.stroke(); c.restore(); }
    c.fillStyle = '#e0b84a'; c.beginPath(); c.arc(0, 0, 18, 0, TAU); c.fill(); c.stroke(); c.restore(); c.restore();
  }

  // ---------- Table (green wrought-iron scroll legs), chair, saucer ----------
  function table(c) {
    const iron = (pts, w) => { const d = dense(pts, 10); c.fillStyle = C.line; c.fill(ribbon(d, q => w + 4)); c.fillStyle = C.iron; c.fill(ribbon(d, q => w)); };
    iron([[1004, 660], [1004, 760], [1006, 890]], 16);
    iron([[1000, 672], [930, 682], [870, 690], [848, 712], [862, 736], [886, 730], [884, 712]], 10);
    iron([[1010, 672], [1080, 682], [1140, 690], [1162, 712], [1148, 736], [1124, 730], [1126, 712]], 10);
    iron([[1000, 760], [960, 790], [930, 800], [938, 828], [960, 822]], 9); iron([[1010, 760], [1050, 790], [1080, 800], [1072, 828], [1050, 822]], 9);
    iron([[1004, 860], [940, 872], [860, 880], [842, 868], [852, 852], [866, 860]], 10); iron([[1006, 860], [1070, 872], [1150, 880], [1168, 868], [1158, 852], [1144, 860]], 10);
    c.fillStyle = C.ironHi; c.fillRect(1001, 670, 4, 200);
    // Tabletop
    c.fillStyle = '#f3ead8'; c.strokeStyle = C.line; c.lineWidth = 3.5; c.beginPath(); c.moveTo(812, 640); c.lineTo(1208, 640); c.lineTo(1196, 660); c.lineTo(824, 660); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#d9cdb2'; c.fillRect(826, 655, 368, 4);
  }
  function chair(c) {
    c.fillStyle = C.line; c.fill(ribbon(dense([[1468, 900], [1478, 760], [1470, 600], [1486, 470], [1500, 450]], 8), q => 22 - q * 6));
    c.fillStyle = C.wood; c.fill(ribbon(dense([[1468, 900], [1478, 760], [1470, 600], [1486, 470], [1500, 450]], 8), q => 15 - q * 6));
  }

  // ---------- Girl's long curls: wavy hair mass + variable-width S locks ending in spirals ----------
  function hairMass(c, G, t) {
    const h = G.A.headC, ox = h[0] - 1318, oy = h[1] - 360;
    const pts = [[1286, 300], [1350, 286], [1404, 318], [1432, 380], [1462, 440], [1496, 510], [1520, 590], [1530, 660], [1512, 730], [1470, 760], [1440, 712], [1420, 640], [1396, 560], [1368, 490], [1340, 440], [1318, 410]]
      .map(([x, y], i) => { const w = i > 2 && i < 10 ? Math.sin(t * 6 + y * 0.035) * 9 * (y - 300) / 400 : 0; return [x + ox * (1 - (y - 300) / 500) + w, y + oy * (1 - (y - 300) / 500)]; });
    const p = RIG.smooth(pts, true); c.fillStyle = '#e2b54c'; c.fill(p);
  }
  const lockDefs = {
    back: [[1392, 360, 330, 120, 18, 0.2, 1], [1420, 400, 300, 150, 16, 1.4, -1], [1440, 450, 290, 105, 17, 2.5, 1], [1404, 430, 330, 60, 18, 3.3, -1], [1460, 520, 220, 120, 15, 4.2, 1], [1376, 470, 300, 30, 16, 5.0, 1], [1470, 600, 160, 70, 14, 0.9, -1]],
    front: [[1316, 420, 170, -24, 15, 2.0, -1], [1334, 430, 140, 4, 13, 3.6, 1]],
  };
  const hairLocks = (G, t, which) => {
    const h = G.A.headC, ox = h[0] - 1318, oy = h[1] - 360;
    return lockDefs[which].map(([sx, sy, len, drift, w, ph, dir]) => {
      const pts = []; for (let i = 0; i <= 12; i++) { const q = i / 12; const wave = Math.sin(q * 7.4 + ph - t * 7) * (6 + 20 * q);
        pts.push([sx + ox * (1 - q) + drift * q + wave, sy + oy * (1 - q) + len * q]); }
      const e = pts[pts.length - 1], a0 = Math.atan2(pts[12][1] - pts[11][1], pts[12][0] - pts[11][0]);
      const r = 13 + w * 0.5, cx = e[0] + Math.cos(a0 + dir * Math.PI / 2) * r, cy = e[1] + Math.sin(a0 + dir * Math.PI / 2) * r;
      const sp = spiral(cx, cy, r, a0 - dir * Math.PI / 2, 1.2, dir, 16);
      return { pts: dense(pts.concat(sp.slice(1)), 4), w };
    });
  };
  function drawHair(c, locks) {
    locks.forEach(({ pts, w }) => { const rb = ribbon(pts, q => 2.5 + (w - 2.5) * Math.pow(1 - q, 0.6));
      c.fillStyle = '#e8bf55'; c.fill(rb); c.strokeStyle = C.line; c.lineWidth = 2.2; c.stroke(rb);
      const mid = pts.slice(3, -6); c.fillStyle = '#f6dc8a'; c.fill(ribbon(mid, q => 1 + 2.4 * (1 - q)));
      c.strokeStyle = '#b9862a'; c.lineWidth = 1.2; c.beginPath(); mid.forEach((p, i) => i ? c.lineTo(p[0] + 3, p[1] + 2) : c.moveTo(p[0] + 3, p[1] + 2)); c.stroke(); });
  }
  // Small crown-edge curls add volume like the design sheet
  function crownCurls(c, G, t) {
    const h = G.A.headC;
    [[-20, -66, 15, 1], [22, -64, 17, -1], [58, -40, 18, 1], [80, -2, 17, -1], [88, 38, 16, 1], [70, 70, 15, -1]].forEach(([dx, dy, r, dir], k) => {
      const cx = h[0] + dx + Math.sin(t * 6 + k) * 2, cy = h[1] + dy;
      const sp = dense(spiral(cx, cy, r, k * 1.3 + t * 2 * dir, 1.15, dir, 18), 2), rb = ribbon(sp, q => 9 * (1 - q) + 2);
      c.fillStyle = '#e8bf55'; c.fill(rb); c.strokeStyle = C.line; c.lineWidth = 1.8; c.stroke(rb);
    });
  }
  // Wreath: five pink flowers along forehead–crown–rear arc
  function wreath(c, G, t) {
    const a = G.A, p0 = a.forehead, p1 = [a.headTop[0] + 6, a.headTop[1] - 14], p2 = [a.nape[0] + 14, a.nape[1] - 70];
    const at = q => [(1 - q) * (1 - q) * p0[0] + 2 * q * (1 - q) * p1[0] + q * q * p2[0], (1 - q) * (1 - q) * p0[1] + 2 * q * (1 - q) * p1[1] + q * q * p2[1]];
    c.strokeStyle = C.gold; c.lineWidth = 5; c.beginPath(); for (let i = 0; i <= 20; i++) { const p = at(i / 20); i ? c.lineTo(p[0], p[1] + 8) : c.moveTo(p[0], p[1] + 8); } c.stroke();
    [0.22, 0.42, 0.6, 0.78, 0.95].forEach((q, k) => { const [x, y] = at(q), r = k % 2 ? 15 : 19, rot = t * 0.8 + k;
      c.fillStyle = '#7fa86a'; c.strokeStyle = C.line; c.lineWidth = 1.8; [-1, 1].forEach(s => { c.beginPath(); c.ellipse(x + s * r * 0.9, y + r * 0.5, r * 0.6, r * 0.28, s * 0.6, 0, TAU); c.fill(); c.stroke(); });
      c.save(); c.translate(x, y); c.rotate(rot); for (let i = 0; i < 5; i++) { c.rotate(TAU / 5); c.fillStyle = k % 2 ? '#e7a0aa' : '#f0b4bb'; c.beginPath(); c.ellipse(r * 0.55, 0, r * 0.55, r * 0.4, 0, 0, TAU); c.fill(); c.stroke(); }
      c.fillStyle = '#e0b04a'; c.beginPath(); c.arc(0, 0, r * 0.3, 0, TAU); c.fill(); c.stroke(); c.restore(); });
  }
  // S-shaped steam: variable-width cream band + brown double lines, spiral tip, curls over time
  function steam(c, x, y, t, cup) {
    const H0 = 360 * (1 - 0.25 * cup), lean = -90 - 160 * cup;
    const defs = [[-6, 0, 1, 26], [22, 2.3, -1, 20], [-26, 4.2, 1, 14]];
    defs.forEach(([ox, ph, dir, w], k) => {
      const pts = []; for (let i = 0; i <= 10; i++) { const q = i / 10; pts.push([x + ox * (1 + 2.6 * q) + Math.sin(q * 4.0 + ph - t * 6) * (18 + 70 * q) * dir + lean * q * q, y - q * H0 * (1 - k * 0.12)]); }
      const e = pts[pts.length - 1]; const sp = spiral(e[0] + dir * 32, e[1] + 4, 34, dir > 0 ? Math.PI : 0, 1.1, dir > 0 ? 1 : -1, 14).map(([px, py], i) => [px, py]);
      const all = dense(pts.concat(sp.slice(1)), 5), rb = ribbon(all, q => 2 + (w - 2) * Math.sin(Math.PI * Math.min(1, 0.15 + q * 1.1)));
      c.globalAlpha = 0.95; c.fillStyle = '#fbf7ec'; c.fill(rb); c.strokeStyle = '#8a6a4a'; c.lineWidth = 1.8; c.stroke(rb);
      c.strokeStyle = 'rgba(160,130,100,.6)'; c.lineWidth = 1.2; c.beginPath(); all.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); c.globalAlpha = 1;
    });
  }

  const girlPal = { skin: '#f6dcc4', hair: '#e8bf55', hairLine: '#b9862a', dress: '#f4ecda', sleeve: '#f6dcc4', apron: '#e6aaa5', cuff: '#c9a24a', fold: '#c9b89a', shoe: '#c9a24a',
    cheek: 'rgba(235,130,130,.45)', lip: '#c8505a', iris: '#4a6a3a', browC: '#9a6a2a', line: C.line, lw: 2.2, cupBody: '#f8f1e2', cupRim: '#7a4a24' };
  const catPal = { orange: '#e39a4c', white: '#fbf3e3', stripe: '#b8622a', eye: '#e6c040', earInner: '#eaa0a0', line: C.line, lw: 2.2 };

  return {
    draw(c, lt, t) {
      const ch = P.choreo(lt, t);
      c.drawImage(bg(), 0, 0);
      windowGlass(c, lt, t);
      flowers(c, t);
      catHalo(c, 606, 640, t);
      const G = RIG.girl({ cup: ch.cup, sip: ch.sip, hair: 'long', breathe: ch.breathe });
      girlHalo(c, 1342, 332, t);
      chair(c);
      table(c);
      // Saucer remains on table after cup lifts
      c.fillStyle = '#f6efe0'; c.strokeStyle = C.line; c.lineWidth = 2.5; c.beginPath(); c.ellipse(992, 634, 58, 9, 0, 0, TAU); c.fill(); c.stroke();
      // —— Character layer ——
      const L = P.scratch('nvChars'), lg = L.getContext('2d'); lg.clearRect(0, 0, W, H);
      const K = RIG.cat({ tail: ch.tail, blink: ch.blink, breathe: ch.breathe });
      RIG.drawCat(lg, K, { ...catPal, lw: 2 });
      hairMass(lg, G, t); drawHair(lg, hairLocks(G, t, 'back'));
      RIG.drawGirl(lg, G, { ...girlPal, lw: 2 });
      // Short sleeve: cream over upper arm near shoulder
      lg.save(); lg.beginPath(); lg.arc(G.A.shoulder[0], G.A.shoulder[1], 62, 0, TAU); lg.clip(); lg.fillStyle = '#f4ecda'; lg.fill(G.upperArm); lg.strokeStyle = C.line; lg.lineWidth = 2; lg.stroke(G.upperArm); lg.restore();
      // Pink stole drapes from shoulder along back to rear waist
      { const a = G.A; const d = dense([[a.shoulder[0] + 6, a.shoulder[1] - 18], [a.back[0] - 4, a.back[1] - 30], [a.back[0] + 14, a.back[1] + 50], [a.waist[0] + 80, a.waist[1] + 40], [a.waist[0] + 96, a.waist[1] + 120]], 10);
        const dr = ribbon(d, q => 30 + 26 * q); lg.fillStyle = '#e6aaa5'; lg.fill(dr); lg.strokeStyle = C.line; lg.lineWidth = 2; lg.stroke(dr); lg.fillStyle = '#d68f8c'; lg.fill(ribbon(d.slice(4), q => 4 + 6 * q)); }
      // Pink hem folds (dark-pink curved bands)
      lg.save(); lg.clip(G.apronSkirt); lg.fillStyle = '#d48e8c';
      [[[1290, 640], [1250, 720], [1236, 830]], [[1250, 650], [1214, 740], [1206, 830]], [[1320, 680], [1296, 760], [1290, 830]]].forEach(pts => lg.fill(ribbon(dense(pts, 8), swellW(7, 1))));
      lg.restore();
      // Gold zigzag skirt trim
      lg.save(); lg.clip(G.skirt); lg.lineJoin = 'miter';
      { const zz = (y0, w, col) => { lg.strokeStyle = col; lg.lineWidth = w; lg.beginPath(); for (let k = 0, x = 1080; x <= 1380; x += 28, k++) { const y = y0 + (x - 1080) * 0.02 + (k % 2 ? 30 : 0); k ? lg.lineTo(x, y) : lg.moveTo(x, y); } lg.stroke(); };
        zz(850, 13, C.line); zz(850, 8, C.gold); lg.fillStyle = C.cream; for (let k = 0, x = 1080; x <= 1380; x += 56, k++) { lg.beginPath(); lg.arc(x, 850 + (x - 1080) * 0.02 - 2, 4, 0, TAU); lg.fill(); } }
      lg.restore();
      // Curved cat tabby stripes (variable width)
      lg.fillStyle = '#c0672c';
      [[[450, 735], [470, 728], [500, 738]], [[436, 772], [462, 764], [496, 776]], [[430, 812], [458, 806], [490, 818]], [[432, 850], [458, 846], [486, 858]], [[520, 700], [536, 690], [556, 694]], [[580, 572], [586, 586], [590, 600]], [[604, 566], [606, 582], [606, 598]], [[626, 570], [622, 584], [620, 598]]]
        .forEach(pts => { const d = dense(pts, 8); lg.fill(ribbon(d, swellW(9, 1))); });
      // Gold belt + brooch
      lg.fillStyle = C.gold; lg.save(); lg.clip(G.torso); lg.fillRect(G.A.waist[0] - 140, G.A.waist[1] - 22, 200, 16); lg.restore();
      lg.beginPath(); lg.arc(G.A.waist[0] + 50, G.A.waist[1] - 14, 13, 0, TAU); lg.fill();
      // Thick outer contour: dark-brown silhouette offset lower-right underneath
      const S = P.scratch('nvSil'), sg = S.getContext('2d'); sg.clearRect(0, 0, W, H); sg.drawImage(L, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = C.line; sg.fillRect(0, 0, W, H); sg.globalCompositeOperation = 'source-over';
      [[-1.5, -1.5], [3.5, 4.5], [2, 2.5]].forEach(([dx, dy]) => c.drawImage(S, dx, dy));
      c.drawImage(L, 0, 0);
      // Gold armlet, earrings
      c.strokeStyle = C.gold; c.lineWidth = 6; c.beginPath(); c.arc(G.A.shoulder[0] - 6, G.A.shoulder[1] + 40, 22, 0.6, 2.4); c.stroke();
      c.fillStyle = C.gold; c.strokeStyle = C.line; c.lineWidth = 2; c.beginPath(); c.arc(G.A.ear[0] - 4, G.A.ear[1] + 22, 8, 0, TAU); c.fill(); c.stroke();
      // Front-shoulder curls, wreath
      drawHair(c, hairLocks(G, t, 'front'));
      crownCurls(c, G, t);
      wreath(c, G, t);
      // Dotted cup ornaments
      c.fillStyle = '#d07a86'; [-12, 0, 12].forEach((d, i) => { c.fillStyle = i === 1 ? '#6fa08a' : '#d07a86'; c.beginPath(); c.arc(G.cup.x + d, G.cup.y + 20, 3.5, 0, TAU); c.fill(); });
      steam(c, G.cup.x, G.cup.y - 8, t, ch.cup);
      c.drawImage(P.grain('nv', 0.05, [70, 50, 30], 0.14), 0, 0);
    },
  };
})();
