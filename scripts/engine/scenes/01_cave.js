// 40,000 BC cave paintings — pure code.
// Pipeline: ① cached rock wall (half-resolution fbm height field → normals × upper-left light → relief shading; base-color noise; grain; cracks; sprayed hand/paw prints; vignette)
//      ② Pigment layer: thick charcoal outlines (porous charcoal-pattern strokes), then flat ochre fills; painter order preserves occlusion;
//        overlay a rock-shading + grain texture across the layer using source-atop → pigment follows the rock relief
//      ③ Animation: bison/horse alternate two poses every 7 frames, cup lift, steam, cat tail/blinks, flickering fire, golden embers, title fade (film t 0.933–1.133)
SCENES['01_cave'] = (() => {
  const W = 1920, H = 1080, { clamp, lerp, rng } = U, P = PAINT;
  const C = {
    wallL: [206, 146, 90], wallD: [110, 68, 38], wallR: [182, 100, 58],
    ink: '#21150d', red: '#9c3520', redD: '#74261a', ochre: '#c9772f', ochreL: '#d49a5a', hair: '#cf8f2c', hairD: '#6e3c0e', coat: '#b06a2c',
    chalk: '#f0dfbf', bison: '#8c3d22', horse: '#cf8236', stone: '#c98c50', stoneD: '#c08048', spot: '#4e2610',
  };

  // ---------- Charcoal stroke pattern: black + random holes → grainy edges ----------
  const inkTile = () => P.cached('cave_inkpat', 256, 256, (g) => {
    const img = g.createImageData(256, 256), d = img.data, r = rng(91);
    for (let i = 0; i < 256 * 256; i++) {
      const x = i % 256, y = (i / 256) | 0, n = P.noise(x * 0.09, y * 0.09) * 0.5 + P.noise(x * 0.3 + 9, y * 0.3) * 0.5;
      const hole = r() < 0.07 || n > 0.58;
      d[i * 4] = 33; d[i * 4 + 1] = 21; d[i * 4 + 2] = 13; d[i * 4 + 3] = hole ? 255 * r() * 0.35 : 225 + r() * 30;
    }
    g.putImageData(img, 0, 0);
  });
  const fuzzTile = () => P.cached('cave_fuzzpat', 256, 256, (g) => {
    const r = rng(57); g.fillStyle = '#21150d';
    for (let i = 0; i < 2600; i++) { g.globalAlpha = 0.35 + r() * 0.6; g.beginPath(); g.arc(r() * 256, r() * 256, 0.7 + r() * 1.5, 0, Math.PI * 2); g.fill(); }
  });
  const FPATS = new WeakMap();
  const fuzzPat = (g, t) => { let p = FPATS.get(g); if (!p) { p = g.createPattern(fuzzTile(), 'repeat'); FPATS.set(g, p); } const r = rng(P.boilSeed(t, 9) * 13 + 5); p.setTransform(new DOMMatrix().translate((r() * 256) | 0, (r() * 256) | 0)); return p; };
  const PATS = new WeakMap();
  const inkPat = (g, t) => {
    let p = PATS.get(g); if (!p) { p = g.createPattern(inkTile(), 'repeat'); PATS.set(g, p); }
    const b = P.boilSeed(t, 9), r = rng(b * 7 + 3);                 // 9fps: shift the entire pattern → boiling charcoal grain
    p.setTransform(new DOMMatrix().translate((r() * 256) | 0, (r() * 256) | 0)); return p;
  };
  // Outline first (2×lw, outer half visible), then fill — shared pigment rendering
  function shape(g, path, fill, lw, t, alpha = 1) {
    if (lw) { g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = fuzzPat(g, t); g.lineWidth = lw * 2 + 7; g.stroke(path); g.strokeStyle = inkPat(g, t); g.lineWidth = lw * 2; g.stroke(path); }
    if (fill) { g.globalAlpha = alpha; g.fillStyle = fill; g.fill(path); g.globalAlpha = 1; }
  }
  function inkLine(g, path, lw, t) { if (lw > 3.5) { g.strokeStyle = fuzzPat(g, t); g.lineWidth = lw + 5; g.lineCap = 'round'; g.stroke(path); } g.strokeStyle = inkPat(g, t); g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(path); }
  const poly = (pts, closed = true) => { const p = new Path2D(); pts.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); if (closed) p.closePath(); return p; };
  const sm = (pts, closed = true) => RIG.smooth(pts, closed);

  // ---------- Rock wall (cached) ----------
  const HW = 960, HH = 540;
  const relief = () => P.cached('cave_relief', HW, HH, (g) => {
    // Height field (full-resolution coordinates): large undulations + mid-frequency bulges
    const hgt = new Float32Array((HW + 1) * (HH + 1));
    for (let y = 0; y <= HH; y++) for (let x = 0; x <= HW; x++) { const X = x * 2, Y = y * 2;
      hgt[y * (HW + 1) + x] = P.fbm(X * 0.0022 + 3, Y * 0.0022, 4) * 1.0 + P.fbm(X * 0.011, Y * 0.011 + 7, 3) * 0.16 + P.noise(X * 0.05, Y * 0.05) * 0.03; }
    const img = g.createImageData(HW, HH), d = img.data, L = [-0.55, -0.62, 0.56];
    const shade = new Float32Array(HW * HH);
    for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) {
      const i = y * (HW + 1) + x, dx = (hgt[i + 1] - hgt[i]) * 52, dy = (hgt[i + HW + 1] - hgt[i]) * 52;
      const nl = Math.hypot(dx, dy, 1), dot = (-dx * L[0] - dy * L[1] + L[2]) / nl;
      const s = clamp(0.5 + (dot - 0.56) * 0.9, 0, 1); shade[y * HW + x] = s;
      const X = x * 2, Y = y * 2, n2 = P.fbm(X * 0.0016 + 11, Y * 0.0016 + 2, 3), n3 = P.fbm(X * 0.004 + 40, Y * 0.004, 2);
      let col = P.mix(C.wallL, C.wallD, clamp(0.35 - n2 * 1.3, 0, 1)); col = P.mix(col, C.wallR, clamp(n3 * 1.4, 0, 0.45));
      const k = 0.72 + s * 0.55, j = (y * HW + x) * 4;
      d[j] = col[0] * k; d[j + 1] = col[1] * k; d[j + 2] = col[2] * k; d[j + 3] = 255;
    }
    g.putImageData(img, 0, 0); g.__shade = shade;
  });
  // Rock texture for pigment: darken shadows, lift highlights + grain (for source-atop)
  const figTex = () => P.cached('cave_figtex', W, H, (g) => {
    const rl = relief(), sh = rl.getContext('2d').__shade || relief().getContext('2d').__shade;
    const s = P.canvas(HW, HH), sg = s.getContext('2d'), img = sg.createImageData(HW, HH), d = img.data;
    for (let i = 0; i < HW * HH; i++) { const v = sh ? sh[i] : 0.5; const dk = v < 0.5; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = dk ? 20 : 255; if (!dk) { d[i * 4 + 1] = 236; d[i * 4 + 2] = 200; } d[i * 4 + 3] = (dk ? (0.5 - v) * 150 : (v - 0.5) * 50); }
    sg.putImageData(img, 0, 0); g.drawImage(s, 0, 0, W, H);
    g.drawImage(P.grain('cave_fdk', 0.14, [30, 18, 8], 0.32), 0, 0);
    g.drawImage(P.grain('cave_flt', 0.05, [255, 236, 200], 0.22), 0, 0);
    // Large patches of uneven pigment moisture (low frequency)
    const m = P.canvas(240, 135), mg = m.getContext('2d'), mi = mg.createImageData(240, 135);
    for (let i = 0; i < 240 * 135; i++) { const x = i % 240, y = (i / 240) | 0, n = P.fbm(x * 0.08 + 21, y * 0.08, 3); mi.data[i * 4] = mi.data[i * 4 + 1] = mi.data[i * 4 + 2] = n > 0 ? 255 : 0; mi.data[i * 4 + 3] = Math.abs(n) * 70; }
    mg.putImageData(mi, 0, 0); g.drawImage(m, 0, 0, W, H);
  });

  // Hand shape for negative prints: centered at origin, fingers upward
  function handPath(s = 1) {                                       // Return separate pieces (fill individually)
    const out = [], pal = new Path2D(); pal.ellipse(0, 8 * s, 26 * s, 31 * s, 0, 0, Math.PI * 2); out.push(pal);
    const cap = (A, B, w) => { const p = new Path2D(); const a = Math.atan2(B[1] - A[1], B[0] - A[0]); p.moveTo(A[0], A[1]); p.lineTo(B[0], B[1]); return { p, w }; };
    [[-0.5, 54, -17], [-0.17, 64, -6], [0.14, 62, 6], [0.46, 50, 17], [-1.25, 46, -20]].forEach(([a, l, ox], k) => {
      const A = k < 4 ? [ox * s, -8 * s] : [-18 * s, 18 * s], B = [A[0] + Math.sin(a) * l * s, A[1] - Math.cos(a) * l * s];
      const p = new Path2D(); const n = Math.atan2(B[1] - A[1], B[0] - A[0]) + Math.PI / 2, w = (k < 4 ? 7 : 8) * s;
      p.moveTo(A[0] + Math.cos(n) * w, A[1] + Math.sin(n) * w); p.lineTo(B[0] + Math.cos(n) * w * 0.85, B[1] + Math.sin(n) * w * 0.85);
      p.arc(B[0], B[1], w * 0.85, n, n + Math.PI, true); p.lineTo(A[0] - Math.cos(n) * w, A[1] - Math.sin(n) * w); p.closePath(); out.push(p); void cap; });
    const wr = new Path2D(); wr.rect(-16 * s, 26 * s, 32 * s, 46 * s); out.push(wr); return out;
  }
  function spray(g, cx, cy, sigma, n, col, seed, rmin = 0.8, rmax = 3.2, amin = 0.25, amax = 0.75) {
    const r = rng(seed); g.fillStyle = col;
    for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, rr = Math.sqrt(-2 * Math.log(1 - r() * 0.999)) * sigma; g.globalAlpha = amin + r() * (amax - amin); g.beginPath(); g.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, rmin + r() * (rmax - rmin), 0, Math.PI * 2); g.fill(); }
    g.globalAlpha = 1;
  }
  function stencil(g, x, y, rot, s, col, seed, shapeFn) {
    const tmp = P.canvas(320, 320), tg = tmp.getContext('2d');
    spray(tg, 160, 160, 46 * s, 3200, col, seed, 0.8, 3.2, 0.15, 0.6);
    spray(tg, 160, 160, 28 * s, 1400, col, seed + 1, 1, 3.5, 0.3, 0.75);
    // Draw a solid hand mask first (fill each piece to avoid gaps from opposite Path2D subpath winding)
    const mk = P.canvas(320, 320), mg = mk.getContext('2d'); mg.translate(160, 160); mg.rotate(rot); mg.fillStyle = '#f6e2bc'; shapeFn(s).forEach(p => mg.fill(p));
    tg.globalCompositeOperation = 'destination-out'; tg.globalAlpha = 0.95; tg.drawImage(mk, 0, 0);
    tg.globalCompositeOperation = 'source-over'; tg.globalAlpha = 0.3; tg.drawImage(mk, 0, 0);
    g.drawImage(tmp, x - 160, y - 160);
  }
  function pawPath(s = 1) { const out = []; const p = new Path2D(); p.ellipse(0, 8 * s, 15 * s, 12 * s, 0, 0, Math.PI * 2); out.push(p); [[-16, -10], [-6, -19], [6, -19], [16, -10]].forEach(([x, y]) => { const q = new Path2D(); q.ellipse(x * s, y * s, 6 * s, 7.5 * s, 0, 0, Math.PI * 2); out.push(q); }); return out; }

  function cracks(g) {
    const r = rng(404);
    const starts = [[860, 0, 1.5], [930, 0, 1.75], [1540, 0, 1.7], [0, 600, -0.15], [0, 760, 0.05], [1920, 520, 3.0], [1920, 860, 3.25], [1250, 1080, -1.4], [230, 1080, -1.6], [0, 160, 0.4]];
    const walk = (x, y, a, n, w, depth) => {
      const pts = [[x, y]];
      for (let s = 0; s < n; s++) { a += (r() - .5) * 0.9; const l = 14 + r() * 26; x += Math.cos(a) * l; y += Math.sin(a) * l; pts.push([x, y]);
        if (depth < 2 && r() < 0.12) walk(x, y, a + (r() < .5 ? 1 : -1) * (0.6 + r() * 0.6), (n - s) * 0.5 | 0, w * 0.7, depth + 1); }
      g.lineJoin = 'round';
      g.strokeStyle = 'rgba(255,226,180,.22)'; g.lineWidth = w + 1; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0] + 1.6, p[1] + 1.6) : g.moveTo(p[0] + 1.6, p[1] + 1.6)); g.stroke();
      g.strokeStyle = 'rgba(40,22,10,.62)'; g.lineWidth = w; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
    };
    starts.forEach(([x, y, a]) => walk(x, y, a, 12 + (r() * 14 | 0), 2.2, 0));
  }

  const HANDS = [[150, 232, -0.35, 0.95], [238, 442, 0.25, 0.9], [1098, 138, 0.05, 0.95], [1742, 440, -0.2, 1.0], [1800, 662, 0.3, 0.92]];
  // Static scene (rock wall + all stationary pigment shapes)
  const bg = () => P.cached('cave_bg', W, H, (g) => {
    g.imageSmoothingQuality = 'high'; g.drawImage(relief(), 0, 0, W, H);
    g.drawImage(P.grain('cave_wdk', 0.22, [60, 36, 18], 0.32), 0, 0);
    g.drawImage(P.grain('cave_wlt', 0.10, [255, 238, 205], 0.28), 0, 0);
    cracks(g);
    // Hand prints (sprayed red-ochre negatives) + paw prints (charcoal) + dotted red lines
    HANDS.forEach(([x, y, a, s], k) => { if (s) stencil(g, x, y, a, s, '#8e2a1a', 31 + k * 17, handPath); });
    stencil(g, 262, 762, 0, 0.5, '#1a0f08', 77, pawPath);
    g.fillStyle = '#9a2e1c'; for (let k = 0; k < 9; k++) { const x = 100 + k * 28, y = 972 - k * 4.5; spray(g, x, y, 3.5, 40, '#9a2e1c', 200 + k, 0.8, 2, 0.4, 0.8); g.globalAlpha = 0.75; g.beginPath(); g.arc(x, y, 5.5, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; }
    // Draw static pigment shapes on a temporary layer, then overlay the rock texture
    const L = P.canvas(), lg = L.getContext('2d');
    // Mural frame
    const fr = new Path2D(); P.roughPath({ moveTo: (...a) => fr.moveTo(...a), lineTo: (...a) => fr.lineTo(...a), closePath: () => fr.closePath(), beginPath() {} }, [[367, 126], [793, 124], [796, 552], [366, 550]], { amp: 3, seed: 5, closed: true, step: 18 });
    inkLine(lg, fr, 8, 0);
    const dot = (x, y) => { spray(lg, x, y, 5, 26, '#a8331f', (x * 7 + y) | 0, 0.8, 2.2, 0.3, 0.8); lg.fillStyle = '#a8331f'; lg.globalAlpha = 0.85; lg.beginPath(); lg.ellipse(x, y, 8.5, 8, (x + y) * 0.1, 0, Math.PI * 2); lg.fill(); lg.globalAlpha = 1; };
    for (let x = 398; x <= 768; x += 37) { dot(x, 152); dot(x, 524); }
    for (let y = 190; y <= 490; y += 37) { dot(392, y); dot(770, y); }
    // Sun + rays
    spray(lg, 470, 228, 14, 200, '#a8301c', 9, 1, 3, 0.3, 0.8); lg.fillStyle = '#a8301c'; lg.globalAlpha = 0.9; lg.beginPath(); lg.arc(470, 228, 28, 0, Math.PI * 2); lg.fill(); lg.globalAlpha = 1;
    lg.strokeStyle = '#a8301c'; lg.lineWidth = 4.5; lg.lineCap = 'round';
    for (let k = 0; k < 9; k++) { const a = Math.PI * (0.95 + k * 0.13); lg.beginPath(); lg.moveTo(470 + Math.cos(a) * 38, 228 + Math.sin(a) * 38); lg.lineTo(470 + Math.cos(a) * 56, 228 + Math.sin(a) * 56); lg.stroke(); }
    // Faint charcoal doodles above the table (previously painted figures)
    lg.strokeStyle = 'rgba(40,26,16,.5)'; lg.lineWidth = 3;
    [[[858, 342], [872, 300], [905, 262], [945, 250], [972, 268], [1000, 258], [1040, 250], [1080, 272], [1098, 318], [1100, 365]], [[880, 330], [885, 380], [890, 395]], [[928, 300], [924, 360], [926, 412]], [[955, 352], [990, 342], [1008, 352], [1012, 384]], [[1040, 360], [1048, 400]], [[1060, 330], [1078, 352], [1088, 392]]]
      .forEach((pts, k) => { P.roughPath(lg, pts, { amp: 1.6, seed: 50 + k, step: 10 }); lg.stroke(); });
    // Stone stool (girl seated), slab table, spear
    shape(lg, sm([[1288, 768], [1325, 738], [1420, 730], [1492, 748], [1518, 806], [1514, 882], [1484, 908], [1300, 910], [1276, 872], [1272, 806]]), C.stone, 7, 0, 0.92);
    inkLine(lg, sm([[1460, 790], [1478, 840], [1470, 880]], false), 3, 0); inkLine(lg, sm([[1320, 860], [1340, 890]], false), 3, 0);
    shape(lg, sm([[958, 668], [1078, 668], [1086, 760], [1100, 870], [1094, 906], [936, 906], [926, 872], [944, 760]]), C.stoneD, 7, 0, 0.92);
    inkLine(lg, sm([[985, 720], [978, 790], [984, 830]], false), 3, 0); inkLine(lg, sm([[1048, 790], [1060, 850]], false), 3, 0);
    shape(lg, sm([[818, 650], [842, 636], [1000, 632], [1182, 636], [1210, 650], [1198, 668], [1000, 674], [830, 670]]), C.ochreL, 7, 0, 0.92);
    const sp = new Path2D(); sp.moveTo(1562, 902); sp.lineTo(1512, 340); inkLine(lg, sp, 7, 0);
    shape(lg, sm([[1508, 296], [1522, 322], [1520, 350], [1510, 362], [1500, 350], [1497, 322]]), C.red, 4, 0);
    lg.globalCompositeOperation = 'source-atop'; lg.drawImage(figTex(), 0, 0); lg.globalCompositeOperation = 'source-over';
    g.drawImage(L, 0, 0);
    // Cave vignette (dark corners) + central warm light (static component)
    const v = g.createRadialGradient(990, 560, 260, 990, 560, 1180); v.addColorStop(0, 'rgba(30,14,4,0)'); v.addColorStop(0.5, 'rgba(30,14,4,.16)'); v.addColorStop(1, 'rgba(18,8,2,.8)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
    const fl = g.createRadialGradient(1000, 520, 20, 1000, 520, 620); fl.addColorStop(0, 'rgba(255,190,110,.36)'); fl.addColorStop(0.5, 'rgba(255,150,70,.14)'); fl.addColorStop(1, 'rgba(255,150,70,0)');
    g.globalCompositeOperation = 'lighter'; g.fillStyle = fl; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
  });

  // ---------- Mural animals: two poses (switch every 7 frames) ----------
  const BISON = sm([[470, 300], [495, 280], [545, 268], [595, 250], [632, 240], [660, 246], [682, 268], [692, 300], [686, 330], [668, 350], [640, 356], [590, 352], [530, 348], [488, 342], [468, 324]]);
  const BHEAD = sm([[672, 270], [698, 280], [716, 302], [724, 326], [714, 340], [696, 338], [682, 326], [668, 300]]);
  const HORSE = sm([[452, 474], [470, 458], [510, 456], [548, 452], [566, 432], [582, 414], [598, 410], [614, 432], [612, 444], [598, 444], [586, 438], [578, 458], [574, 478], [540, 488], [486, 488], [458, 486]]);
  function animals(g, t) {
    const ph = Math.floor(t * 60 / 7) % 2, rb = P.boilSeed(t, 9);
    // Bison
    g.save(); g.translate(ph ? 3 : -3, ph ? -7 : 2);
    const bl = ph ? [[652, 340, 698, 384], [632, 346, 672, 394], [500, 340, 458, 378], [520, 344, 482, 390]]
                  : [[652, 340, 648, 392], [632, 346, 618, 396], [500, 340, 504, 394], [520, 344, 530, 394]];
    bl.forEach(([x0, y0, x1, y1], k) => { const pth = sm([[x0, y0], [(x0 + x1) / 2 + (ph ? 0 : 8 * (k < 2 ? -1 : 1)), (y0 + y1) / 2 + 2], [x1, y1]], false); inkLine(g, pth, 6, t); const hf = new Path2D(); hf.moveTo(x1 - 6, y1); hf.lineTo(x1 + 7, y1 + 2); inkLine(g, hf, 6, t); });
    g.save(); g.translate(698, 300); g.rotate(ph ? 0.12 : -0.09); g.translate(-698, -300);
    shape(g, BISON, C.bison, 7, t, 0.95);
    g.save(); g.clip(BISON); g.strokeStyle = 'rgba(70,24,10,.55)'; g.lineWidth = 22; g.stroke(sm([[480, 292], [545, 276], [600, 258], [640, 252], [672, 268]], false)); g.restore();
    shape(g, BHEAD, '#76301a', 6, t);
    inkLine(g, sm([[700, 284], [708, 262], [722, 248]], false), 5, t); inkLine(g, sm([[688, 280], [688, 258], [698, 242]], false), 4.5, t);
    inkLine(g, sm([[690, 340], [688, 352]], false), 4, t); inkLine(g, sm([[702, 342], [702, 354]], false), 4, t);
    g.fillStyle = C.ink; g.beginPath(); g.arc(704, 304, 3.5, 0, Math.PI * 2); g.fill();
    g.restore();
    g.fillStyle = C.ink; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(538 + k * 13, 301, 3.2, 0, Math.PI * 2); g.fill(); }
    inkLine(g, sm([[468, 296], [452, 314], [446, 336]], false), 4, t);
    g.restore();
    // Horse (opposite phase to bison)
    g.save(); g.translate(ph ? -3 : 3, ph ? 2 : -7);
    const hl = ph ? [[566, 486, 562, 528], [552, 488, 544, 530], [484, 488, 488, 528], [470, 486, 466, 526]]
                  : [[566, 486, 596, 520], [552, 488, 580, 528], [484, 488, 456, 520], [470, 486, 442, 516]];
    hl.forEach(([x0, y0, x1, y1]) => { inkLine(g, sm([[x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2 + 2], [x1, y1]], false), 5.5, t); });
    g.save(); g.translate(590, 440); g.rotate(ph ? -0.08 : 0.1); g.translate(-590, -440);
    shape(g, HORSE, C.horse, 6, t, 0.95);
    shape(g, poly([[592, 414], [598, 396], [606, 414]]), C.horse, 3.5, t);
    for (let k = 0; k < 6; k++) { const p = new Path2D(); p.moveTo(566 + k * 4.5, 446 - k * 6); p.lineTo(558 + k * 4.5, 438 - k * 6); inkLine(g, p, 3.2, t); }
    g.fillStyle = C.ink; g.beginPath(); g.arc(600, 424, 3, 0, Math.PI * 2); g.fill();
    g.restore();
    inkLine(g, sm([[454, 468], [440, 480], [432, 500]], false), 4.5, t);
    g.restore();
    void rb;
  }

  // ---------- Cat (orange-white cave-painting style) ----------
  function cat(g, ch, t, lt) {
    const K = RIG.cat({ tail: ch.tail, blink: ch.blink, breathe: ch.breathe, look: hq(lt) * 1.5 });
    const ha = -0.16 * hq(lt), ear = hq(lt) > 0.2 ? Math.sin(lt * 60) * 0.06 : 0;
    const br = (x, y) => [x, y - (y < 800 ? ch.breathe * 300 : 0)];
    // Tail (behind body)
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = fuzzPat(g, t); g.lineWidth = K.tailW + 18; g.stroke(K.tail); g.strokeStyle = inkPat(g, t); g.lineWidth = K.tailW + 12; g.stroke(K.tail);
    g.strokeStyle = C.ochre; g.lineWidth = K.tailW; g.stroke(K.tail);
    const tp = K.tailPts; g.strokeStyle = '#55210b'; g.lineWidth = 6;
    for (let k = 5; k < tp.length - 1; k += 4) { const a = Math.atan2(tp[k + 1][1] - tp[k][1], tp[k + 1][0] - tp[k][0]) + Math.PI / 2; g.beginPath(); g.moveTo(tp[k][0] + Math.cos(a) * 10, tp[k][1] + Math.sin(a) * 10); g.lineTo(tp[k][0] - Math.cos(a) * 10, tp[k][1] - Math.sin(a) * 10); g.stroke(); }
    // Body
    const body = sm([[560, 684], [505, 702], [464, 756], [446, 826], [450, 884], [488, 906], [600, 906], [654, 902], [662, 858], [654, 790], [642, 734], [616, 698]].map(p => br(...p)));
    shape(g, body, C.ochre, 7, t);
    g.save(); g.clip(body); g.strokeStyle = '#55210b'; g.lineCap = 'round';
    [[716, 12], [748, 11], [780, 11], [812, 10], [846, 9]].forEach(([y, w], k) => { const yy = br(0, y)[1]; g.lineWidth = w; g.beginPath(); g.moveTo(430, yy - 6); g.quadraticCurveTo(470 + k * 2, yy + 2, 512 - k * 3, yy + 16); g.stroke(); });
    g.lineWidth = 9; g.beginPath(); g.moveTo(520, 690); g.lineTo(540, 716); g.stroke(); g.beginPath(); g.moveTo(548, 686); g.lineTo(562, 708); g.stroke();
    g.restore();
    // White chest and belly
    g.fillStyle = C.chalk; g.fill(sm([[612, 700], [640, 736], [652, 792], [656, 860], [644, 898], [592, 902], [584, 830], [592, 748]].map(p => br(...p))));
    // Thigh arc
    inkLine(g, sm([[478, 842], [508, 826], [546, 838], [566, 872], [566, 904]], false), 4, t);
    // Front legs + paws (white)
    [[592, 600], [634, 640]].forEach(([x0, x1]) => { const leg = sm([[x0 - 4, 790], [x0 + 22, 792], [x0 + 24, 880], [x0 + 32, 892], [x0 + 26, 906], [x0 - 12, 906], [x0 - 10, 884]]); shape(g, leg, C.chalk, 6, t); });
    // Head (source frames 65–81: lift and turn around neck anchor, ears twitch)
    g.save(); g.translate(596, 680); g.rotate(ha + ear); g.translate(-596, -680);
    shape(g, K.head, C.ochre, 7, t);
    g.save(); g.clip(K.head);
    g.fillStyle = C.chalk; g.beginPath(); g.ellipse(K.nose[0] - 22, K.nose[1] + 16, 38, 28, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#55210b'; g.lineWidth = 7; g.lineCap = 'round'; K.stripes.slice(0, 3).forEach(s => { g.beginPath(); g.moveTo(...s[0]); g.lineTo(...s[1]); g.stroke(); });
    g.restore();
    g.fillStyle = '#c0644a'; K.earInner.forEach(e => g.fill(poly(e)));
    // Eyes, nose, mouth, whiskers
    K.eyes.forEach(e => { if (K.blink) { const p = new Path2D(); p.arc(e.x, e.y, 8, 0.2, Math.PI - 0.2); inkLine(g, p, 3.5, t); }
      else { const p = new Path2D(); p.ellipse(e.x, e.y, 9, 7.5, 0, 0, Math.PI * 2); g.fillStyle = '#e8b54a'; g.fill(p); inkLine(g, p, 3, t); g.fillStyle = C.ink; g.beginPath(); g.ellipse(e.x + 2, e.y, 2.6, 6, 0, 0, Math.PI * 2); g.fill(); } });
    g.fillStyle = '#8a2a1a'; g.fill(poly([[K.nose[0] - 6, K.nose[1] - 4], [K.nose[0] + 6, K.nose[1] - 4], [K.nose[0], K.nose[1] + 4]]));
    const m = new Path2D(); m.moveTo(...K.mouth[0]); m.quadraticCurveTo(...K.mouth[1], ...K.mouth[2]); inkLine(g, m, 3, t);
    K.whiskers.forEach(w => { const p = new Path2D(); p.moveTo(...w[0]); p.lineTo(...w[1]); inkLine(g, p, 2.2, t); });
    g.restore();
  }
  const hq = (lt) => { const q = clamp((lt - 1.08) / 0.27); return Math.sin(q * Math.PI); };

  // ---------- Girl (cave figure, long golden curls, knee-length leopard-skin tunic) ----------
  function girl(g, lt, t, ch) {
    const k = P.choreo(Math.max(0, lt - 0.95), t).cup;                      // Lift cup from 0.95s (shifted choreo curve)
    const G = RIG.girl({ cup: k, sip: ch.sip * k, breathe: ch.breathe, hair: 'long' });
    const nk = [1300, 425], ct = Math.cos(G.tilt), st = Math.sin(G.tilt);
    const HP = (x, y) => { const X = x - nk[0], Y = y - nk[1]; return [nk[0] + X * ct - Y * st, nk[1] + X * st + Y * ct]; };
    const HB = (x, y) => (y < 440 ? HP(x, y) : [x + (y < 520 ? (HP(x, y)[0] - x) * (520 - y) / 80 : 0), y]);   // Hair follows head rotation less toward the bottom
    // Far lower leg (behind)
    const leg = (ox, oy) => sm([[1140, 770], [1128, 830], [1120, 878], [1094, 896], [1084, 910], [1172, 912], [1178, 890], [1192, 830], [1198, 778]].map(([x, y]) => [x + ox, y + oy]));
    shape(g, leg(40, -6), C.redD, 6, t);
    // Long rear hair (yellow ochre, wavy edge)
    const back = [], front = [];
    for (let i = 0; i <= 10; i++) { const q = i / 10, y = 330 + q * 300; back.push(HB(1398 + q * 52 + Math.sin(q * 13) * 13 * q, y)); front.push(HB(1332 + q * 68 + Math.sin(q * 12 + 1) * 11 * q, 345 + q * 270)); }
    const tips = [[1440, 640], [1428, 622], [1418, 646], [1406, 626]];
    const hairPts = [HP(1262, 312), HP(1300, 288), HP(1352, 290), HP(1392, 314), ...back, ...tips, ...front.reverse(), HP(1320, 330), HP(1290, 318)];
    const hairP = sm(hairPts);
    // Hide tunic (torso + knee-length hem, ragged edges)
    const fr = [], rr = rng(17);
    for (let x = 1448, i = 0; x >= 1126; x -= 15, i++) fr.push([x, 782 + (i % 2 ? 16 : 0) + (rr() - .5) * 6]);
    const coatLow = sm([[1300, 600], [1420, 608], [1446, 650], [1452, 722], [1450, 770], ...fr, [1124, 764], [1148, 722], [1190, 656], [1242, 628]]);
    // Near lower leg
    // Outline → fill tunic (both pieces together to cover seams)
    g.lineJoin = 'round'; g.strokeStyle = fuzzPat(g, t); g.lineWidth = 19; g.stroke(G.torso); g.stroke(coatLow); g.strokeStyle = inkPat(g, t); g.lineWidth = 13; g.stroke(G.torso); g.stroke(coatLow);
    shape(g, leg(0, 0), C.red, 6, t);
    g.fillStyle = C.coat; g.fill(G.torso); g.fill(coatLow);
    // Leopard spots
    g.save(); const clipP = new Path2D(); clipP.addPath(G.torso); clipP.addPath(coatLow); g.clip(clipP);
    const r = rng(23);
    for (let i = 0; i < 26; i++) { const x = 1150 + r() * 300, y = 450 + r() * 330, s = 7 + r() * 6; g.fillStyle = C.spot; g.beginPath(); g.arc(x, y, s, 0, Math.PI * 2); g.fill();
      for (let j = 0; j < 7; j++) { const a = j / 7 * Math.PI * 2 + r(); g.beginPath(); g.arc(x + Math.cos(a) * s * 1.6, y + Math.sin(a) * s * 1.6, 2.4, 0, Math.PI * 2); g.fill(); } }
    g.strokeStyle = 'rgba(78,38,16,.55)'; g.lineWidth = 2.5; for (let i = 0; i < 18; i++) { const x = 1170 + r() * 270, y = 470 + r() * 300; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 6, y + 12); g.stroke(); }
    g.restore();
    // Belt (leather cord)
    inkLine(g, sm([[1292, 606], [1360, 612], [1424, 614]], false), 6, t);
    // Hair, neck, face
    shape(g, G.neck, C.red, 6, t);
    shape(g, hairP, C.hair, 7, t);
    g.save(); g.clip(hairP); g.strokeStyle = C.hairD; g.lineWidth = 3; g.lineCap = 'round';
    for (let j = 0; j < 6; j++) { const pts = []; for (let i = 0; i <= 12; i++) { const q = i / 12; pts.push(HB(1338 + j * 17 + q * (56 - j * 2) + Math.sin(q * 13 + j * 0.7) * 12 * Math.min(1, q * 2.5), 300 + q * 330)); } g.stroke(sm(pts, false)); }
    g.restore();
    shape(g, G.face, C.red, 7, t);
    shape(g, G.bangs, C.hair, 6, t);
    g.save(); g.clip(G.bangs); g.strokeStyle = C.hairD; g.lineWidth = 2.5; G.hairLines.forEach(h => g.stroke(h)); g.restore();
    // Eye (single profile stroke: almond + lashes; a line when blinking)
    if (ch.blink) { const p = new Path2D(); p.moveTo(G.eye.x - 8, G.eye.y + 1); p.quadraticCurveTo(G.eye.x, G.eye.y + 5, G.eye.x + 8, G.eye.y + 1); inkLine(g, p, 3, t); }
    else { const p = new Path2D(); p.ellipse(G.eye.x, G.eye.y, 7.5, 4.2, -0.1, 0, Math.PI * 2); g.fillStyle = '#f0dcb8'; g.fill(p); inkLine(g, p, 2.6, t); g.fillStyle = C.ink; g.beginPath(); g.arc(G.eye.x - 2, G.eye.y, 2.8, 0, Math.PI * 2); g.fill();
      const l = new Path2D(); l.moveTo(G.eye.x - 7, G.eye.y - 2); l.lineTo(G.eye.x - 12, G.eye.y - 6); inkLine(g, l, 2.4, t); }
    inkLine(g, G.brow, 2.4, t);
    // Cup arm: custom IK (extended in midair → raised to mouth)
    const hold = [1084, 506], mouth = HP(1224, 380), cp = [lerp(hold[0], mouth[0], k), lerp(hold[1], mouth[1], k)];
    const S = G.A.shoulder, hand = [cp[0] + 34, cp[1] + 10];
    const { E, H: Hd } = RIG.ik2(S, hand, 170, 128, -1);
    const ua = RIG.taper(S, E, 50, 36, 6), fa = RIG.taper(E, Hd, 36, 26, 2);
    g.strokeStyle = fuzzPat(g, t); g.lineWidth = 18; g.stroke(ua); g.stroke(fa); g.strokeStyle = inkPat(g, t); g.lineWidth = 12; g.stroke(ua); g.stroke(fa);
    g.fillStyle = C.red; g.fill(ua); g.fill(fa);
    // Cup (small red-ochre bowl)
    g.save(); g.translate(cp[0], cp[1]); g.rotate(-0.45 * k);
    const cup = sm([[-34, -2], [-28, 22], [-12, 40], [12, 40], [28, 22], [34, -2]]);
    shape(g, cup, C.red, 6, t);
    const rim = new Path2D(); rim.ellipse(0, -2, 34, 7, 0, 0, Math.PI * 2); g.fillStyle = C.redD; g.fill(rim); inkLine(g, rim, 3.5, t);
    g.restore();
    // Hand + fingers (a few short cave-painting strokes)
    const hp = new Path2D(); hp.ellipse(Hd[0], Hd[1], 15, 12, Math.atan2(Hd[1] - E[1], Hd[0] - E[0]), 0, Math.PI * 2); shape(g, hp, C.red, 5, t);
    const fa_ = Math.atan2(Hd[1] - E[1], Hd[0] - E[0]);
    for (let j = -1; j <= 1; j++) { const p = new Path2D(), ox = Math.cos(fa_ + Math.PI / 2) * j * 7, oy = Math.sin(fa_ + Math.PI / 2) * j * 7; p.moveTo(Hd[0] + ox + Math.cos(fa_) * 12, Hd[1] + oy + Math.sin(fa_) * 12); p.lineTo(Hd[0] + ox + Math.cos(fa_) * 30, Hd[1] + oy + Math.sin(fa_) * 30); inkLine(g, p, 3, t); }
    // Steam: three wavy charcoal lines creeping upward
    for (let j = -1; j <= 1; j++) { const p = new Path2D(), x0 = cp[0] + j * 16, y0 = cp[1] - 22;
      for (let s = 0; s <= 18; s++) { const q = s / 18, y = y0 - q * 58, x = x0 + Math.sin(q * 13 - t * 11 + j * 1.3) * 6; s ? p.lineTo(x, y) : p.moveTo(x, y); }
      inkLine(g, p, 3.4, t); }
    return G;
  }

  // ---------- Title (fades at film 0.933–1.133s) ----------
  function title(g, t) {
    const a = t < 0.933 ? 1 : 1 - clamp((t - 0.933) / 0.2); if (a <= 0) return;
    g.save(); g.globalAlpha = a; g.font = '78px "Kalam-700"'; g.letterSpacing = '7px'; g.textBaseline = 'alphabetic';
    const txt = 'TEA ACROSS THE AGES', w = g.measureText(txt).width, sx = 930 / w;
    g.translate(955, 1024); g.scale(sx, 1); g.fillStyle = '#9b2a18'; g.fillText(txt, -w / 2, 0);
    g.restore();
  }

  return {
    draw(c, lt, t) {
      const ch = P.choreo(lt, t);
      c.drawImage(bg(), 0, 0);
      // Pigment layer: animals → cat → girl → title, then overlay rock texture
      const L = P.scratch('cave_fig'), g = L.getContext('2d'); g.clearRect(0, 0, W, H);
      animals(g, t);
      // Scale cat 0.86 about feet (540,905): ear tips drop y≈535 → ≈587, leaving ≥35px below mural frame (550)
      g.save(); g.translate(540, 905); g.scale(0.86, 0.86); g.translate(-540, -905); cat(g, ch, t, lt); g.restore();
      girl(g, lt, t, ch); title(g, t);
      g.globalCompositeOperation = 'source-atop'; g.drawImage(figTex(), 0, 0); g.globalCompositeOperation = 'source-over';
      c.drawImage(L, 0, 0);
      // Fire flicker: noise jitters the center and intensity
      const n1 = P.noise(t * 3.1, 1.7), n2 = P.noise(t * 2.3, 8.1), fl = 0.14 + 0.11 * P.noise(t * 9.5, 3.3) + 0.04 * Math.sin(t * 23) + 0.03 * Math.sin(t * 37);
      const fx = 1000 + n1 * 60, fy = 540 + n2 * 36;
      // overlay brightens and warms without bleaching pigment saturation (lighter washes figures to pale yellow)
      const gr = c.createRadialGradient(fx, fy, 10, fx, fy, 700 + n2 * 60); gr.addColorStop(0, `rgba(255,196,110,${fl * 2.6})`); gr.addColorStop(0.5, `rgba(255,160,80,${fl * 1.3})`); gr.addColorStop(1, 'rgba(255,140,60,0)');
      c.save(); c.globalCompositeOperation = 'overlay'; c.fillStyle = gr; c.fillRect(0, 0, W, H);
      // Dark areas breathe with the firelight
      c.globalCompositeOperation = 'source-over';
      const dk = c.createRadialGradient(fx, fy, 380, fx, fy, 1150); dk.addColorStop(0, 'rgba(20,8,2,0)'); dk.addColorStop(1, `rgba(20,8,2,${0.12 - fl * 0.4 + 0.08})`);
      c.fillStyle = dk; c.fillRect(0, 0, W, H);
      // Hand prints flicker: separate noise-driven warm light over each print
      c.globalCompositeOperation = 'lighter';
      HANDS.forEach(([x, y], k) => { const v = clamp(0.5 + 0.9 * P.noise(t * 7 + k * 3.7, k)); if (v < 0.05) return;
        const hg = c.createRadialGradient(x, y, 5, x, y, 105); hg.addColorStop(0, `rgba(255,150,80,${0.2 * v})`); hg.addColorStop(1, 'rgba(255,120,60,0)'); c.fillStyle = hg; c.fillRect(x - 105, y - 105, 210, 210); });
      // Golden embers: slowly rise and flicker on both sides
      c.globalCompositeOperation = 'lighter';
      [[0, 380, 20], [1520, 1920, 20], [380, 1520, 9]].forEach(([x0, x1, n], s) => {
        P.particles(n, 300 + s * 31, t, { x0, x1, y0: H + 30, y1: 120, drift: 22, life: 5.5 }).forEach(p => {
          const tw = 0.3 + 0.7 * Math.abs(Math.sin(t * 7 + p.i * 1.9)), fade = Math.sin(p.q * Math.PI), r0 = 2.6 + p.s * 2.8;
          c.fillStyle = `rgba(255,170,60,${0.32 * tw * fade})`; c.beginPath(); c.arc(p.x, p.y, r0 * 3.6, 0, Math.PI * 2); c.fill();
          c.fillStyle = `rgba(255,224,130,${0.95 * tw * fade})`; c.beginPath(); c.arc(p.x, p.y, r0, 0, Math.PI * 2); c.fill();
        });
      });
      c.restore();
    },
  };
})();
