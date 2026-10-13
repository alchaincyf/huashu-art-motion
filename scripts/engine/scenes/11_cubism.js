// 1912 Analytical Cubism (Picasso/Braque) — pure code.
// Pipeline: ① cached ochre-gray-beige overlapping translucent planes (light→dark gradient each, alpha 0.35–0.7)
//        + stippled/hatched planes + Braque short-dash sand texture + fine crossing lines (passage) + faux wood (table/board) + caned chair back
//      → ② moving window facets (oversized cached scene, four panes sample shifted views), CAFÉ letters bounce/swap at 12fps, newspaper trembles
//      → ③ RIG flat characters offscreen → custom facetize (jittered triangle mesh, sampled colors + random shading + gradients; unclipped triangles straighten silhouette)
//        → Picasso features (profile + frontal almond eye, blue-gray half-face), radial skirt cuts, straight outlines with extended ends
//      → ④ low-alpha overlapping planes on top embed girl/cat in space
SCENES['11_cubism'] = (() => {
  const W = 1920, H = 1080, { clamp, lerp } = U, P = PAINT, TAU = Math.PI * 2;
  const C = { paper: '#d6c8ac', cream: '#ece3cf', ochre: '#b8975f', brown: '#6e5538', dbrown: '#3a2c1e', grey: '#a8a395', bgrey: '#8e9eab', dgrey: '#5a5852', ink: '#2e241a' };
  const H2 = P.hex;
  // getImageData offscreens must declare willReadFrequently initially; otherwise Chrome switches GPU→CPU after readback, changing antialiasing after frame 1 (nondeterminism)
  const LAYERS = {}; const layer = (k) => { if (!LAYERS[k]) { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.getContext('2d', { willReadFrequently: true }); LAYERS[k] = cv; } return LAYERS[k]; };
  const poly = (g, pts) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); };
  // Facet: directional light-to-dark gradient (Cubist shading plane)
  const plane = (g, pts, col, alpha, r, dark = 0.4, light = 0.25) => {
    const c0 = Array.isArray(col) ? col : H2(col);
    let a = pts[0], b = pts[(r() * pts.length) | 0]; if (a === b) b = pts[(pts.length / 2) | 0];
    const gr = g.createLinearGradient(a[0], a[1], b[0], b[1]);
    gr.addColorStop(0, P.rgb(P.mix(c0, [250, 244, 228], light), alpha)); gr.addColorStop(0.55, P.rgb(c0, alpha)); gr.addColorStop(1, P.rgb(P.mix(c0, [45, 35, 25], dark), alpha));
    g.fillStyle = gr; poly(g, pts); g.fill();
  };
  // Faux wood grain (Braque's graining-comb wood)
  const wood = (g, x, y, w, h, vertical, seed, base = '#b8874a', dark = '#7a5228') => {
    const r = U.rng(seed); g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.fillStyle = base; g.fillRect(x, y, w, h);
    g.strokeStyle = dark; const L = vertical ? h : w, S = vertical ? w : h, kx = 0.35 + r() * 0.3, ky = 0.3 + r() * 0.4;
    for (let i = 0; i < S / 6; i++) { g.lineWidth = 0.8 + r() * 1.6; g.globalAlpha = 0.35 + r() * 0.4; g.beginPath();
      for (let s = 0; s <= L; s += 6) { const u = s / L, off = i * 6 + Math.sin(u * 7 + i * 0.4) * 3 + 14 * Math.exp(-((u - kx) ** 2) / 0.01) * Math.sign(i * 6 - S * ky);
        const X = vertical ? x + off : x + s, Y = vertical ? y + s : y + off; s ? g.lineTo(X, Y) : g.moveTo(X, Y); } g.stroke(); }
    g.globalAlpha = 1; const kX = vertical ? x + S * ky : x + L * kx, kY = vertical ? y + L * kx : y + S * ky;
    for (let k = 0; k < 4; k++) { g.lineWidth = 1.6; g.beginPath(); g.ellipse(kX, kY, (vertical ? 6 : 16) + k * 5, (vertical ? 16 : 6) + k * 4, 0, 0, TAU); g.stroke(); }
    g.fillStyle = dark; g.beginPath(); g.ellipse(kX, kY, vertical ? 4 : 10, vertical ? 10 : 4, 0, 0, TAU); g.fill(); g.restore();
  };

  // ---------- ① Base ----------
  const bg = () => P.cached('cb_bg', W, H, (g) => {
    const r = U.rng(1912);
    g.fillStyle = C.paper; g.fillRect(0, 0, W, H);
    // Manually arranged large overlapping planes (source composition)
    const big = [
      [[[0, 0], [330, 0], [180, 330], [0, 260]], C.grey, .6], [[[60, 0], [560, 0], [340, 110]], C.cream, .6], [[[0, 280], [200, 330], [110, 1080], [0, 1080]], C.dgrey, .45],
      [[[160, 520], [350, 600], [280, 860], [120, 780]], C.ochre, .5], [[[820, 0], [1010, 0], [930, 330]], C.cream, .55], [[[880, 120], [1220, 40], [1100, 420], [860, 380]], C.bgrey, .5],
      [[[1050, 0], [1500, 0], [1320, 240], [1180, 210]], C.grey, .45], [[[1500, 0], [1920, 0], [1920, 330], [1640, 260]], C.cream, .35], [[[1290, 170], [1720, 310], [1610, 620], [1240, 450]], C.grey, .45],
      [[[1700, 340], [1920, 290], [1920, 900], [1760, 880]], C.ochre, .45], [[[840, 380], [1150, 320], [1210, 560], [880, 600]], C.grey, .5], [[[350, 560], [820, 600], [800, 900], [300, 930]], C.cream, .45],
      [[[690, 620], [860, 560], [910, 1080], [630, 1080]], C.brown, .4], [[[1250, 600], [1560, 640], [1500, 1080], [1200, 1080]], C.dgrey, .35], [[[0, 640], [380, 560], [420, 1080], [0, 1080]], C.ochre, .35],
      [[[560, 0], [880, 0], [820, 120], [600, 90]], C.ochre, .45], [[[1560, 620], [1920, 560], [1920, 1080], [1500, 1080]], C.ochre, .4], [[[300, 70], [520, 40], [470, 300], [280, 260]], C.dgrey, .3],
    ];
    big.forEach(([pts, col, a]) => plane(g, pts, col, a, r));
    // Radial fans beneath table
    for (let i = 0; i < 9; i++) { const a0 = -Math.PI + 0.25 + i * 0.3, a1 = a0 + 0.16; plane(g, [[1000, 1090], [1000 + Math.cos(a0) * 620, 1090 + Math.sin(a0) * 520], [1000 + Math.cos(a1) * 620, 1090 + Math.sin(a1) * 520]], i % 2 ? C.cream : C.brown, 0.3, r, 0.5, 0.3); }
    // Random small facets
    for (let i = 0; i < 70; i++) { const cx = r() * W, cy = r() * H, s = 60 + r() * 200, a0 = r() * TAU, n = r() < 0.6 ? 3 : 4;
      const pts = []; for (let k = 0; k < n; k++) { const a = a0 + k / n * TAU + (r() - .5) * 0.8; pts.push([cx + Math.cos(a) * s * (0.5 + r() * 0.6), cy + Math.sin(a) * s * (0.5 + r() * 0.6)]); }
      if (cx > 1480 && cy < 230) continue;
      plane(g, pts, [C.cream, C.grey, C.ochre, C.bgrey, C.brown, C.dgrey][(r() * 6) | 0], 0.18 + r() * 0.3, r); }
    // Stippled and hatched planes
    [[[930, 430], [1080, 380], [1060, 520], [960, 560]], [[1540, 420], [1700, 380], [1660, 520]], [[130, 380], [260, 420], [210, 560]], [[720, 700], [820, 690], [800, 820]]].forEach((pts, k) => {
      g.save(); poly(g, pts); g.clip(); g.fillStyle = 'rgba(40,30,20,.45)'; for (let y = 0; y < H; y += 9) for (let x = (y / 9 % 2) * 4.5; x < W; x += 9) { if (x < pts[0][0] - 200 || x > pts[0][0] + 260 || y < pts[0][1] - 200 || y > pts[0][1] + 260) continue; g.beginPath(); g.arc(x, y, 1.6, 0, TAU); g.fill(); } g.restore(); });
    [[[1040, 470], [1200, 400], [1220, 520], [1080, 560]], [[40, 300], [110, 280], [80, 640], [20, 660]], [[1230, 690], [1330, 660], [1310, 840]], [[600, 160], [700, 130], [690, 300]]].forEach((pts, k) => {
      g.save(); poly(g, pts); g.clip(); g.strokeStyle = 'rgba(50,38,26,.45)'; g.lineWidth = 1.2; g.beginPath(); for (let d = -1200; d < 1200; d += 7) { g.moveTo(pts[0][0] + d, pts[0][1] - 300); g.lineTo(pts[0][0] + d + (k % 2 ? 300 : -120), pts[0][1] + 300); } g.stroke(); g.restore(); });
    // Left vertical hatching (paper)
    g.save(); poly(g, [[0, 280], [100, 290], [70, 800], [0, 820]]); g.clip(); g.fillStyle = 'rgba(236,227,207,.7)'; g.fillRect(0, 280, 110, 560); g.strokeStyle = 'rgba(60,45,30,.4)'; g.lineWidth = 1; g.beginPath(); for (let y = 290; y < 820; y += 8) { g.moveTo(0, y); g.lineTo(110, y - 6); } g.stroke(); g.restore();
    // Right board (Braque faux grain)
    g.save(); g.translate(1615, 590); g.rotate(-0.04); wood(g, -66, -205, 130, 410, true, 7, '#c4925a', '#7a4f26'); g.strokeStyle = C.ink; g.lineWidth = 2; g.strokeRect(-66, -205, 130, 410); g.restore();
    // Caned chair back + frame
    g.save(); poly(g, [[1484, 492], [1588, 470], [1588, 692], [1486, 700]]); g.clip(); g.fillStyle = '#c9a466'; g.fillRect(1480, 460, 120, 250);
    g.fillStyle = 'rgba(70,46,24,.85)'; for (let y = 470; y < 705; y += 10) for (let x = 1480 + (y / 10 % 2) * 5; x < 1600; x += 10) { g.beginPath(); g.arc(x, y, 2.6, 0, TAU); g.fill(); }
    g.strokeStyle = 'rgba(240,220,170,.5)'; g.lineWidth = 1.2; g.beginPath(); for (let d = -260; d < 260; d += 10) { g.moveTo(1480 + d, 460); g.lineTo(1480 + d + 250, 710); g.moveTo(1600 - d, 460); g.lineTo(1600 - d - 250, 710); } g.stroke(); g.restore();
    g.strokeStyle = C.dbrown; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(1478, 900); g.lineTo(1478, 470); g.quadraticCurveTo(1530, 455, 1590, 486); g.lineTo(1590, 710); g.stroke();
    g.lineWidth = 7; g.beginPath(); g.moveTo(1380, 720); g.lineTo(1488, 718); g.moveTo(1384, 720); g.lineTo(1384, 900); g.stroke();
    // Table: wood-grain top + dark apron + drawer + pedestal + diamond
    g.save(); poly(g, [[818, 600], [1202, 596], [1196, 644], [824, 646]]); g.clip(); wood(g, 810, 590, 400, 60, false, 3, '#b98b52', '#6e4a24'); g.restore();
    g.strokeStyle = C.ink; g.lineWidth = 2.5; poly(g, [[818, 600], [1202, 596], [1196, 644], [824, 646]]); g.stroke();
    plane(g, [[826, 646], [1194, 644], [1188, 702], [834, 704]], '#5a4128', 0.95, r, 0.35, 0.15);
    g.fillStyle = '#8a6a44'; g.fillRect(952, 668, 118, 26); g.strokeStyle = C.ink; g.lineWidth = 2; g.strokeRect(952, 668, 118, 26); g.fillStyle = '#efe6d0'; g.beginPath(); g.arc(1011, 681, 5, 0, TAU); g.fill();
    plane(g, [[988, 704], [1018, 704], [1022, 892], [984, 892]], '#8a6338', 0.95, r, 0.45, 0.25);
    g.fillStyle = '#d8c39a'; poly(g, [[1004, 740], [1036, 780], [1004, 820], [972, 780]]); g.fill(); g.strokeStyle = C.ink; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#3a2c1e'; poly(g, [[1004, 780], [1036, 780], [1004, 820]]); g.fill();
    plane(g, [[900, 860], [1110, 860], [1150, 900], [860, 900]], C.brown, 0.6, r);
    // Saucer stays on table after cup lifts
    g.fillStyle = '#e8e0cc'; g.beginPath(); g.ellipse(990, 636, 54, 9, 0, 0, TAU); g.fill(); g.strokeStyle = C.ink; g.lineWidth = 2; g.stroke();
    // Translucent box planes and perspective lines right of window
    plane(g, [[815, 110], [892, 140], [890, 545], [815, 565]], C.bgrey, 0.3, r);
    g.strokeStyle = 'rgba(46,36,26,.7)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(815, 105); g.lineTo(892, 140); g.lineTo(890, 545); g.lineTo(815, 565); g.stroke();
    // Braque short-dash sand texture (light/dark)
    for (let i = 0; i < 9000; i++) { const x = r() * W, y = r() * H; g.fillStyle = r() < 0.55 ? 'rgba(246,238,220,.28)' : 'rgba(60,45,30,.16)'; g.fillRect(x, y, 3 + r() * 5, 1.5); }
    // Fine crossing straight lines
    g.strokeStyle = 'rgba(40,30,20,.55)'; g.lineWidth = 1.3;
    for (let i = 0; i < 46; i++) { const x = r() * W, y = r() * H, a = r() * Math.PI, L = 120 + r() * 520; if (x > 1460 && y < 240) continue; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
    g.drawImage(P.grain('cb', 0.05, [50, 40, 30], 0.18), 0, 0);
  });

  // Window scene (oversized cached image, independently shifted panes)
  const winScene = () => P.cached('cb_win', 560, 540, (g) => {
    const r = U.rng(77); g.fillStyle = '#9fb0bd'; g.fillRect(0, 0, 560, 540);
    const ox = 300, oy = 60;     // Scene coordinates = screen coordinates - (ox, oy)
    for (let i = 0; i < 55; i++) { const cx = r() * 560, cy = r() * 540, s = 40 + r() * 170, a0 = r() * TAU; const pts = [0, 1, 2].map(k => { const a = a0 + k * 2.1 + (r() - .5) * 0.6; return [cx + Math.cos(a) * s, cy + Math.sin(a) * s * (0.4 + r())]; });
      plane(g, pts, ['#c9d3da', '#8fa3b3', '#e4e6e2', '#6f8597', '#b4c1cb', '#5f7385'][(r() * 6) | 0], 0.45 + r() * 0.4, r, 0.45, 0.35); }
    // Long diagonal light bands
    [[150, 0, 60], [230, 0, 30], [80, 120, 40]].forEach(([x, y, w]) => plane(g, [[x, y], [x + w, y], [x + w + 300, y + 420], [x + 300, y + 420]], '#e8ecec', 0.55, r, 0.3, 0.5));
    // Eiffel Tower (right, split in two)
    const tx = 690 - ox; g.fillStyle = '#4a4c50'; poly(g, [[tx - 6, 120 - oy], [tx + 6, 120 - oy], [tx + 14, 330 - oy], [tx - 14, 330 - oy]]); g.fill();
    poly(g, [[tx - 22, 330 - oy], [tx + 22, 330 - oy], [tx + 70, 560 - oy], [tx + 44, 560 - oy], [tx, 470 - oy], [tx - 44, 560 - oy], [tx - 70, 560 - oy]]); g.fill();
    g.strokeStyle = 'rgba(220,226,230,.6)'; g.lineWidth = 1; g.beginPath(); for (let y = 340; y < 560; y += 9) { const w = 22 + (y - 330) * 0.21; g.moveTo(tx - w, y - oy); g.lineTo(tx + w, y - oy + 9); g.moveTo(tx + w, y - oy); g.lineTo(tx - w, y - oy + 9); } g.stroke();
    g.fillStyle = '#4a4c50'; g.fillRect(tx - 46, 452 - oy, 92, 9);
    // White seagull arcs
    g.strokeStyle = '#f4f2ec'; g.lineWidth = 4; g.lineCap = 'round'; [[420, 200], [455, 190], [400, 390], [440, 380]].forEach(([x, y]) => { g.beginPath(); g.arc(x - ox, y - oy + 18, 18, -2.6, -0.5); g.stroke(); });
    g.drawImage(P.grain('cbw', 0.04, [255, 255, 255], 0.2), 0, 0, 560, 540, 0, 0, 560, 540);
  });
  function windowPanes(c, lt, t) {
    const panes = [[362, 120, 218, 212], [588, 120, 214, 212], [362, 340, 218, 212], [588, 340, 214, 212]];
    const st = P.boilSeed(t, 10);
    panes.forEach(([x, y, w, h], i) => {
      const dx = Math.sin(lt * 9 + i * 1.7) * 18 + (U.hash(st, i) - 0.5) * 6, dy = Math.cos(lt * 7 + i) * 8;
      c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.drawImage(winScene(), 300 - 30 + dx, 60 - 30 + dy, 560, 540);
      // Each pane has its own sliding facet
      const sx = x + ((lt * 260 + i * 70) % (w + 120)) - 60;
      c.fillStyle = 'rgba(232,236,236,.5)'; poly(c, [[sx, y + 20 + i * 12], [sx + 70, y + 60], [sx + 10, y + 150]]); c.fill(); c.strokeStyle = 'rgba(40,40,46,.6)'; c.lineWidth = 1.5; c.stroke();
      c.restore();
    });
    c.strokeStyle = '#4a3420'; c.lineWidth = 15; c.strokeRect(352, 112, 457, 448); c.lineWidth = 10; c.beginPath(); c.moveTo(584, 112); c.lineTo(584, 560); c.moveTo(352, 336); c.lineTo(809, 336); c.stroke();
    c.strokeStyle = C.ink; c.lineWidth = 2; c.strokeRect(345, 105, 471, 462);
    c.fillStyle = '#8a6a44'; poly(c, [[330, 566], [826, 566], [818, 584], [338, 584]]); c.fill(); c.stroke();
  }

  // ---------- CAFÉ: stencil letters bounce at 12fps, occasionally swap ----------
  const ORDERS = ['CAFÉ', 'CAFÉ', 'ACFÉ', 'CAFÉ', 'CAÉF', 'CFAÉ', 'CAFÉ', 'CAFÉ', 'ACFÉ', 'CAFÉ'];
  function cafe(c, lt) {
    const L = P.scratch('cbCafe'), g = L.getContext('2d'); g.clearRect(0, 0, 420, 170);
    const st = Math.floor(Math.max(0, lt) * 12), order = ORDERS[st % ORDERS.length];
    const slots = [20, 108, 196, 284];
    g.font = '104px "AlfaSlabOne-400"'; g.textBaseline = 'alphabetic'; g.fillStyle = '#3b2e22';
    [...order].forEach((ch, i) => { const h = U.hash(st, i * 3 + 1), jy = (h - 0.5) * 26 - (i === 1 ? 8 : 0), rot = (U.hash(st, i * 5 + 2) - 0.5) * 0.22;
      g.save(); g.translate(slots[i] + 40, 128 + jy); g.rotate(rot + (i === 2 ? -0.06 : 0)); g.fillText(ch, -40, 0); g.restore(); });
    // Stencil gaps
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000';
    [[44, 60], [132, 92], [220, 70], [306, 84]].forEach(([x, y], i) => { g.fillRect(x - 40 + (i * 7) % 20, y, 90, 6); g.fillRect(x + 4, 40, 5, 100); });
    g.globalCompositeOperation = 'source-over';
    c.drawImage(L, 0, 0, 420, 170, 868, 120, 420, 170);
  }

  // ---------- JOU newspaper (cached small image, trembles each frame) ----------
  const paper = () => P.cached('cb_jou', 300, 190, (g) => {
    g.fillStyle = '#ebe3cc'; g.fillRect(0, 0, 300, 190); g.strokeStyle = 'rgba(60,45,30,.6)'; g.lineWidth = 1; g.strokeRect(0.5, 0.5, 299, 189);
    g.fillStyle = '#2b2219'; g.font = '84px "LibreBaskerville-700"'; g.textBaseline = 'alphabetic'; g.fillText('JOU', 16, 82);
    g.fillRect(12, 94, 276, 3); g.font = '12px "LibreBaskerville-700"'; g.fillText('LA BATAILLE', 14, 118); g.fillText("S'EST ENGAGÉ UN CHAT", 112, 118); g.fillRect(12, 126, 276, 1.5);
    g.fillStyle = 'rgba(50,40,30,.55)'; for (let col = 0; col < 3; col++) for (let y = 136; y < 185; y += 5) g.fillRect(14 + col * 94, y, 84 - ((y * 7 + col * 13) % 23), 2);
    g.strokeStyle = 'rgba(40,30,20,.5)'; g.beginPath(); g.moveTo(106, 128); g.lineTo(106, 186); g.moveTo(200, 128); g.lineTo(200, 186); g.stroke();
  });
  function news(c, lt, t) {
    const st = P.boilSeed(t, 8), a = -0.12 + (U.hash(st, 9) - 0.5) * 0.025, dx = (U.hash(st, 4) - 0.5) * 3;
    c.save(); c.translate(205 + dx, 912); c.rotate(a); c.drawImage(paper(), -150, -95);
    // Raised folded corner (flutters each frame)
    const f = 18 + Math.sin(lt * 20) * 6; c.fillStyle = '#d8ceb4'; poly(c, [[150, -95], [150 - f, -95], [150, -95 + f]]); c.fill(); c.strokeStyle = 'rgba(40,30,20,.6)'; c.stroke();
    c.restore();
    // Support lines below newspaper (two diagonals in source)
    c.strokeStyle = 'rgba(40,30,20,.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(320, 960); c.lineTo(352, 1010); c.moveTo(80, 1010); c.lineTo(60, 1060); c.stroke();
  }

  // ---------- Facetizer: jittered triangle mesh, unclipped triangles straighten silhouette ----------
  function facetize(g, src, box, cell, seed, t, { boilFrac = 0.25, alpha = 0.95, edge = 'rgba(40,30,20,.32)', light = 0.2, dark = 0.32, minA = 120, only = null } = {}) {
    const [x0, y0, x1, y1] = box, w = x1 - x0, h = y1 - y0, d = src.getContext('2d').getImageData(x0, y0, w, h).data;
    const nx = Math.ceil(w / cell), ny = Math.ceil(h / cell), r = U.rng(seed), pts = [];
    const st = P.boilSeed(t, 8);
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { const k = j * (nx + 1) + i; pts.push([x0 + i * cell + (r() - .5) * cell * 0.85 + (U.hash(k, st * 3 + seed) - .5) * cell * 0.16, y0 + j * cell + (r() - .5) * cell * 0.85 + (U.hash(k, st * 5 + seed) - .5) * cell * 0.16]); }
    const at = (x, y) => { const ix = clamp(Math.round(x - x0), 0, w - 1), iy = clamp(Math.round(y - y0), 0, h - 1), k = (iy * w + ix) * 4; return [d[k], d[k + 1], d[k + 2], d[k + 3]]; };
    g.lineJoin = 'round';
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const A = pts[j * (nx + 1) + i], B = pts[j * (nx + 1) + i + 1], Cc = pts[(j + 1) * (nx + 1) + i], D = pts[(j + 1) * (nx + 1) + i + 1];
      const tris = r() < 0.5 ? [[A, B, D], [A, D, Cc]] : [[A, B, Cc], [B, D, Cc]];
      tris.forEach((tri, k) => {
        const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3, s = at(cx, cy);
        const shadeR = r(); if (s[3] < minA || (only && !only(s))) return;
        const flick = U.hash(i * 31 + j, k + st * 7) < boilFrac ? (U.hash(i, j + st) - 0.5) * 0.25 : 0;
        const sh = 0.8 + shadeR * 0.38 + flick, col = [s[0] * sh, s[1] * sh, s[2] * sh];
        const gr = g.createLinearGradient(tri[0][0], tri[0][1], tri[2][0], tri[2][1]);
        gr.addColorStop(0, P.rgb(P.mix(col, [250, 244, 228], light), alpha)); gr.addColorStop(1, P.rgb(P.mix(col, [40, 32, 24], dark), alpha));
        g.fillStyle = gr; poly(g, tri); g.fill(); g.strokeStyle = edge; g.lineWidth = 1; g.stroke();
      });
    }
  }
  // Straight outlines: extend each end by ext (Cubist lines often overshoot)
  const segs = (g, pts, ext = 16, col = 'rgba(40,30,20,.72)', w = 2.2) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath();
    for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
      g.moveTo(a[0] - ux * ext, a[1] - uy * ext); g.lineTo(b[0] + ux * ext, b[1] + uy * ext); } g.stroke(); };

  const girlPal = { skin: '#e2cfae', hair: '#c9a256', hairLine: '#8a6a2e', dress: '#6a7a8b', sleeve: '#3c4857', fold: null, apron: '#c9cbc4', cuff: '#d9d4c4', shoe: '#2e241a', cheek: null, lip: '#a8443a', iris: '#2b2219', line: C.ink, lw: 0, mode: 'fill', cupBody: '#e6e2d8', cupRim: '#2a1e14' };
  const catPal = { orange: '#c8773a', white: '#e8dfc9', stripe: '#7e4420', eye: '#c9a43a', line: C.ink, lw: 0, earInner: '#d79a88' };

  function girl(c, G, lt, t, ch) {
    const L = layer('girl'), g = L.getContext('2d'); g.reset(); // reset clears pixels/state; retained lineJoin/lineCap etc. otherwise make frame 1 differ from later frames
    RIG.drawGirl(g, G, girlPal);
    // Add golden rear braid (triangular hair planes after faceting)
    g.fillStyle = '#c9a256'; g.beginPath(); const a = G.A; g.moveTo(a.nape[0] - 8, a.nape[1] - 40); g.lineTo(a.nape[0] + 52, a.nape[1] + 10); g.lineTo(a.back[0] + 36, a.back[1] + 70); g.lineTo(a.back[0] + 6, a.back[1] + 92); g.lineTo(a.nape[0] - 6, a.nape[1] + 30); g.closePath(); g.fill();
    facetize(g, L, [1060, 230, 1540, 945], 58, 19, t, { boilFrac: 0.2, edge: 'rgba(40,30,20,.22)', light: 0.28, dark: 0.4 });
    // Refacet hair more finely (more golden triangles)
    g.save(); g.beginPath(); g.arc(a.headC[0] + 30, a.headC[1] - 10, 95, 0, TAU); g.rect(a.back[0] - 60, a.nape[1] - 30, 110, 260); g.clip();
    facetize(g, L, [1240, 250, 1500, 640], 26, 23, t, { boilFrac: 0.3, alpha: 0.85, light: 0.3, minA: 200, only: s => s[0] > 150 && s[2] < 130 && s[0] - s[2] > 60 }); g.restore();
    // Skirt: radial waist cuts + alternating light/dark wedges
    g.save(); g.clip(G.skirt); const O = [a.waist[0] - 40, a.waist[1] + 10];
    [[1100, 930], [1150, 935], [1200, 935], [1250, 935], [1300, 935], [1350, 930], [1400, 900], [1450, 780]].forEach((p, i, arr) => { if (i < arr.length - 1) { g.fillStyle = i % 2 ? 'rgba(235,228,210,.22)' : 'rgba(30,36,46,.28)'; poly(g, [O, p, arr[i + 1]]); g.fill(); } g.strokeStyle = 'rgba(30,24,18,.42)'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(...O); g.lineTo(...p); g.stroke(); });
    g.restore();
    // Picasso face: blue-gray front half, frontal almond eye, red lips
    // Repaint face with two skin-tone light/dark planes (restore after faceting bleeds hair color into face)
    g.save(); g.clip(G.face); g.fillStyle = '#e4d1b0'; g.fill(G.face); g.fillStyle = '#c9b28c'; poly(g, [[a.ear[0] - 30, a.ear[1] - 60], [a.ear[0] + 20, a.ear[1] - 40], [a.chin[0] + 50, a.chin[1] + 10], [a.chin[0] + 10, a.chin[1] - 10]]); g.fill(); g.restore();
    g.fillStyle = '#e4d1b0'; g.fill(G.neck);
    g.save(); g.clip(G.face); g.fillStyle = 'rgba(82,104,128,.82)'; poly(g, [[a.forehead[0] - 20, a.forehead[1] - 10], [a.forehead[0] + 22, a.forehead[1] - 4], [a.chin[0] + 8, a.chin[1] - 30], [a.chin[0] + 6, a.chin[1] + 10], [a.chin[0] - 40, a.chin[1] + 10]]); g.fill(); g.restore();
    const e = G.eye; g.fillStyle = '#efe8d8'; g.beginPath(); g.moveTo(e.x - 14, e.y); g.quadraticCurveTo(e.x + 2, e.y - 12, e.x + 18, e.y); g.quadraticCurveTo(e.x + 2, e.y + 11, e.x - 14, e.y); g.fill(); g.strokeStyle = C.ink; g.lineWidth = 2.4; g.stroke();
    if (ch.blink) { g.beginPath(); g.moveTo(e.x - 14, e.y); g.lineTo(e.x + 18, e.y); g.stroke(); } else { g.fillStyle = '#231a12'; g.beginPath(); g.arc(e.x + 3, e.y, 5.5, 0, TAU); g.fill(); }
    g.lineWidth = 2.2; g.beginPath(); g.moveTo(e.x - 12, e.y - 14); g.quadraticCurveTo(e.x + 4, e.y - 22, e.x + 20, e.y - 13); g.stroke();
    g.fillStyle = '#a8443a'; g.beginPath(); g.moveTo(...G.lips[0]); g.lineTo(G.lips[1][0] + 3, G.lips[1][1]); g.lineTo(...G.lips[2]); g.closePath(); g.fill();
    // Spiral ear
    g.strokeStyle = C.ink; g.lineWidth = 2; g.beginPath(); for (let k = 0; k < 14; k++) { const q = k / 13, ang = q * 5.5, rr = 11 * (1 - q * 0.7); const x = a.ear[0] + Math.cos(ang) * rr, y = a.ear[1] + Math.sin(ang) * rr * 1.3; k ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    // White collar (two shaded triangles)
    { const n = a.neck; g.fillStyle = '#e9e2d0'; poly(g, [[n[0] - 30, n[1] + 2], [n[0] + 4, n[1] + 12], [n[0] - 14, n[1] + 46]]); g.fill(); g.fillStyle = '#bdb5a2'; poly(g, [[n[0] + 4, n[1] + 12], [n[0] + 40, n[1] + 2], [n[0] + 18, n[1] + 44]]); g.fill();
      g.strokeStyle = C.ink; g.lineWidth = 1.8; poly(g, [[n[0] - 30, n[1] + 2], [n[0] + 40, n[1] + 2], [n[0] + 18, n[1] + 44], [n[0] + 4, n[1] + 12], [n[0] - 14, n[1] + 46]]); g.stroke();
      g.fillStyle = '#2e241a'; [0, 1, 2].forEach(k => { g.beginPath(); g.arc(n[0] + 6 - k * 2, n[1] + 60 + k * 26, 3, 0, TAU); g.fill(); }); }
    // Straight outer contour
    segs(g, [a.forehead, [a.forehead[0] - 12, a.forehead[1] + 40], [a.chin[0] - 14, a.chin[1] - 18], a.chin, a.neck]);
    segs(g, [a.headTop, [a.nape[0] + 30, a.nape[1] - 40], a.nape, a.back, [a.back[0] + 14, a.back[1] + 90]]);
    segs(g, [a.neck, a.chest, [a.chest[0] - 4, a.chest[1] + 100], a.lap, a.knee, [a.knee[0] - 50, a.knee[1] + 160], a.hemL]);
    segs(g, [a.shoulder, a.elbow, a.hand], 12, 'rgba(40,30,20,.7)', 2.2);
    // Cup: clearly redraw (dark half-plane)
    const k = G.cup; g.save(); g.translate(k.x, k.y); g.rotate(k.tilt); g.fillStyle = '#ebe6da'; poly(g, [[-24, 0], [-21, 40], [21, 40], [24, 0]]); g.fill(); g.fillStyle = '#56606a'; poly(g, [[4, 0], [24, 0], [21, 40], [4, 40]]); g.fill();
    g.strokeStyle = C.ink; g.lineWidth = 2.2; poly(g, [[-24, 0], [-21, 40], [21, 40], [24, 0]]); g.stroke(); g.beginPath(); g.arc(28, 18, 11, -1.3, 1.4); g.lineWidth = 4; g.stroke();
    g.fillStyle = '#231a12'; g.beginPath(); g.ellipse(0, 1, 23, 5, 0, 0, TAU); g.fill(); g.restore();
    c.drawImage(L, 0, 0);
  }
  function cat(c, K, lt, t, ch) {
    const L = layer('cat'), g = L.getContext('2d'); g.reset();
    RIG.drawCat(g, K, catPal);
    facetize(g, L, [320, 520, 740, 920], 26, 31, t, { boilFrac: 0.35, light: 0.25, dark: 0.36 });
    // Straight head outline + Picasso eyes (one frontal, one profile) + profile nose
    const h = K.headC, e = K.eyes;
    segs(g, [[h[0] - 66, h[1] + 4], [h[0] - 44, h[1] - 50], [h[0] - 40, h[1] - 88], [h[0] - 6, h[1] - 50], [h[0] + 30, h[1] - 58], [h[0] + 52, h[1] - 86], [h[0] + 60, h[1] - 30], [h[0] + 66, h[1] + 14], [h[0] + 30, h[1] + 52], [h[0] - 34, h[1] + 50], [h[0] - 66, h[1] + 4]], 10);
    segs(g, K.bodyPts.concat([K.bodyPts[0]]), 12);
    e.forEach((p, i) => { g.fillStyle = '#d6b040'; g.beginPath(); g.moveTo(p.x - 12, p.y); g.lineTo(p.x, p.y - 9); g.lineTo(p.x + 12, p.y); g.lineTo(p.x, p.y + 9); g.closePath(); g.fill(); g.strokeStyle = C.ink; g.lineWidth = 2; g.stroke();
      if (ch.blink) { g.beginPath(); g.moveTo(p.x - 12, p.y); g.lineTo(p.x + 12, p.y); g.stroke(); } else { g.fillStyle = '#1a140e'; g.fillRect(p.x - 2 + (i ? 3 : 0), p.y - 7, 5, 14); } });
    g.fillStyle = '#c4706a'; poly(g, [[K.nose[0] - 6, K.nose[1] - 8], [K.nose[0] + 12, K.nose[1] + 2], [K.nose[0] - 4, K.nose[1] + 6]]); g.fill();
    g.strokeStyle = 'rgba(30,24,18,.8)'; g.lineWidth = 1.4; K.whiskers.forEach(w => { g.beginPath(); g.moveTo(...w[0]); g.lineTo(w[1][0] + 20, w[1][1]); g.stroke(); });
    c.drawImage(L, 0, 0, 820, 1080, 0, 0, 820, 1080);
  }
  // Slowly shifting translucent top planes embed characters in space
  function overPlanes(c, lt, t) {
    const st = P.boilSeed(t, 8), r = U.rng(5);
    [[[1150, 260], [1330, 220], [1290, 470]], [[1180, 520], [1300, 470], [1330, 700], [1200, 720]], [[420, 640], [560, 600], [520, 780]], [[880, 300], [1060, 260], [1000, 420]], [[1350, 600], [1450, 560], [1470, 780]]].forEach((pts, i) => {
      const dx = Math.sin(lt * 6 + i) * 8 + (U.hash(st, i) - .5) * 3; const q = pts.map(([x, y]) => [x + dx, y]);
      plane(c, q, [C.cream, C.bgrey, C.ochre, C.cream, C.grey][i], 0.2, r, 0.35, 0.4); c.strokeStyle = 'rgba(40,30,20,.45)'; c.lineWidth = 1.2; poly(c, q); c.stroke(); });
  }

  return {
    draw(c, lt, t) {
      const ch = P.choreo(lt, t);
      c.drawImage(bg(), 0, 0);
      windowPanes(c, lt, t);
      cafe(c, lt);
      news(c, lt, t);
      const G = RIG.girl({ cup: ch.cup, sip: ch.sip, hair: 'long', breathe: ch.breathe });
      girl(c, G, lt, t, ch);
      const K = RIG.cat({ tail: ch.tail, blink: ch.blink, breathe: ch.breathe });
      cat(c, K, lt, t, ch);
      overPlanes(c, lt, t);
    },
  };
})();
