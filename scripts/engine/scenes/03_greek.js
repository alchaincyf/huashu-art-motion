// 530 BC Attic black-figure pottery (Exekias Dionysus cup + amphora motifs) — pure code.
// Pipeline: ① cached clay base (low-frequency mottling + horizontal throwing marks + grain + cracks) → ② cached static black figures (frame, table, chair, amphora, Greek inscriptions)
//      → ③ scrolling bands (top meander left; bottom lotus buds + rays right) → ④ framed boat/dolphins, swinging lyre, rotating rosette
//      → ⑤ orange-white cat (orange silhouette + black tabby + exposed clay) → ⑥ girl (black-glaze silhouette + incisions + purple-red/white added colors + golden curls) → ⑦ steam, vignette
// Black-figure trio: black-glaze silhouette (C.black) + incisions exposing clay lines (C.inc) + added colors (purple-red C.red, white C.white).
SCENES['03_greek'] = (() => {
  const W = 1920, H = 1080, { clamp, lerp, rng } = U, P = PAINT, IO = U.ease.inOut;
  const C = {
    clay: '#dc6a2f', clayHi: '#e8803f', black: '#1b120d', red: '#8a2a37', white: '#f6ead6',
    inc: '#e8904c', gold: '#f2bd48', resv: '#f3cfa4', catO: '#f2913f', pink: '#e7897a',
  };
  const TAU = Math.PI * 2;
  const GS = 0.97, GDY = -14;                       // Scale/raise girl: feet on ground line y≈903
  const Tg = (x, y) => [1300 + (x - 1300) * GS, GDY + 620 + (y - 620) * GS];
  const sm = (pts, closed = true) => RIG.smooth(pts, closed);
  const smT = (pts, closed = false) => RIG.smooth(pts.map(p => Tg(p[0], p[1])), closed);
  const line = (g, pts) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); };

  // ---------------- ① Clay base ----------------
  function crack(g, pts, seed) {
    const r = rng(seed); g.save(); g.strokeStyle = 'rgba(52,18,6,.55)'; g.lineWidth = 1.3; g.lineJoin = 'round'; g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 9));
      for (let k = 1; k <= n; k++) g.lineTo(lerp(a[0], b[0], k / n) + (r() - .5) * 4, lerp(a[1], b[1], k / n) + (r() - .5) * 4); }
    g.stroke();
    g.strokeStyle = 'rgba(255,190,140,.18)'; g.translate(1, 1.2); g.stroke(); g.restore();   // Thin bright edge below crack
  }
  const bg = () => P.cached('gr_bg', W, H, (g) => {
    const lw = 480, lh = 270, lo = P.canvas(lw, lh), lg = lo.getContext('2d'), img = lg.createImageData(lw, lh), d = img.data, b = P.hex(C.clay);
    for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) {
      const n = P.fbm(x * 0.016 + 3, y * 0.016, 4), s = P.noise(x * 0.006, y * 0.85) * 0.6 + P.noise(x * 0.013 + 7, y * 0.4) * 0.4;
      const k = n * 30 + s * 9, i = (y * lw + x) * 4;
      d[i] = b[0] + k; d[i + 1] = b[1] + k * 0.75; d[i + 2] = b[2] + k * 0.45; d[i + 3] = 255;
    }
    lg.putImageData(img, 0, 0); g.imageSmoothingEnabled = true; g.drawImage(lo, 0, 0, W, H);
    const hl = g.createRadialGradient(980, 520, 60, 980, 520, 900); hl.addColorStop(0, 'rgba(255,170,90,.16)'); hl.addColorStop(1, 'rgba(255,170,90,0)');
    g.fillStyle = hl; g.fillRect(0, 0, W, H);
    const r = rng(31);                                        // Horizontal throwing marks
    for (let i = 0; i < 560; i++) { const y = r() * H, x = r() * W - 300, L = 150 + r() * 900;
      g.strokeStyle = r() < 0.55 ? `rgba(120,38,8,${0.03 + r() * 0.05})` : `rgba(255,196,140,${0.03 + r() * 0.05})`; g.lineWidth = 0.7 + r() * 1.8;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + L, y + (r() - .5) * 2); g.stroke(); }
    for (let i = 0; i < 420; i++) { g.fillStyle = `rgba(70,24,8,${0.25 + r() * 0.45})`; g.beginPath(); g.arc(r() * W, r() * H, 0.6 + r() * 1.6, 0, TAU); g.fill(); }
    for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(255,205,160,${0.2 + r() * 0.3})`; g.beginPath(); g.arc(r() * W, r() * H, 0.6 + r() * 1.2, 0, TAU); g.fill(); }
    g.drawImage(P.grain('gr_grainA', 0.07, [70, 22, 6], 0.16), 0, 0); g.drawImage(P.grain('gr_grainBB', 0.04, [255, 214, 170], 0.12), 0, 0);
    crack(g, [[1018, 96], [1030, 170], [1062, 240], [1100, 330], [1112, 430], [1104, 560], [1120, 620]], 3);
    crack(g, [[0, 606], [160, 628], [300, 662], [440, 690], [560, 650], [650, 572], [700, 470]], 4);
    crack(g, [[1500, 560], [1570, 590], [1615, 640], [1720, 668], [1920, 704]], 5);
    crack(g, [[1500, 720], [1528, 800], [1522, 896]], 6); crack(g, [[300, 662], [330, 600], [322, 540]], 7);
  });
  const vignette = () => P.cached('gr_vig', W, H, (g) => {
    const v = g.createRadialGradient(960, 540, 380, 960, 540, 1180); v.addColorStop(0, 'rgba(40,10,0,0)'); v.addColorStop(1, 'rgba(30,6,0,.62)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
  });

  // ---------------- ② Greek inscriptions: stroke table (unit grid 0..1, y downward) ----------------
  const GL = {
    'Χ': [[[0, 0], [1, 1]], [[1, 0], [0, 1]]], 'Α': [[[0, 1], [.5, 0], [1, 1]], [[.24, .62], [.76, .62]]], 'Ι': [[[.5, 0], [.5, 1]]],
    'Ρ': [[[0, 1], [0, 0], [.6, 0], [.92, .2], [.62, .45], [0, .45]]], 'Ε': [[[.92, 0], [0, 0], [0, 1], [.92, 1]], [[0, .5], [.68, .5]]],
    'Κ': [[[0, 0], [0, 1]], [[.9, 0], [0, .56]], [[.3, .38], [.95, 1]]], 'Π': [[[0, 1], [0, 0], [.9, 0], [.9, 1]]], 'Λ': [[[0, 1], [.5, 0], [1, 1]]],
    'Υ': [[[0, 0], [.5, .48], [1, 0]], [[.5, .48], [.5, 1]]], 'Σ': [[[1, .02], [.05, 0], [.55, .5], [0, 1], [1, .98]]],
  };
  function greek(g, str, x, y, h, gap, seed) {
    const r = rng(seed); g.save(); g.strokeStyle = C.black; g.lineWidth = 3.4; g.lineCap = 'round'; g.lineJoin = 'round';
    let cx = x;
    for (const ch of str) {
      if (ch === ' ') { cx += h * 0.6; continue; }
      const hh = h * (0.9 + r() * 0.16), oy = y + (r() - .5) * h * 0.12;
      if (ch === 'Ο') { const rr = hh * 0.25; g.beginPath(); g.ellipse(cx + rr, oy + hh * 0.55, rr, rr * 1.05, 0, 0, TAU); g.stroke(); cx += rr * 2 + gap; continue; }
      const w = ch === 'Ι' ? 2 : h * 0.62;
      GL[ch].forEach(st => { g.beginPath(); st.forEach((p, i) => { const px = cx + p[0] * w + (r() - .5) * 1.4, py = oy + p[1] * hh + (r() - .5) * 1.4; i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.stroke(); });
      cx += w + gap;
    }
    g.restore();
  }

  // ---------------- Small black-figure objects ----------------
  const dots = (g, pts, r = 2.6, col = C.white) => { g.fillStyle = col; pts.forEach(p => { g.beginPath(); g.arc(p[0], p[1], r, 0, TAU); g.fill(); }); };
  const dotRow = (x0, x1, y, step) => { const o = []; for (let x = x0; x <= x1; x += step) o.push([x, y]); return o; };
  function rosette(g, x, y, r, a) {
    g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = C.black;
    for (let k = 0; k < 8; k++) { const q = k / 8 * TAU; g.beginPath(); g.ellipse(Math.cos(q) * r * 0.6, Math.sin(q) * r * 0.6, r * 0.42, r * 0.3, q, 0, TAU); g.fill(); }
    g.beginPath(); g.arc(0, 0, r * 0.45, 0, TAU); g.fill();
    g.strokeStyle = C.inc; g.lineWidth = 1.2; for (let k = 0; k < 8; k++) { const q = (k + 0.5) / 8 * TAU; g.beginPath(); g.moveTo(Math.cos(q) * r * 0.3, Math.sin(q) * r * 0.3); g.lineTo(Math.cos(q) * r * 0.85, Math.sin(q) * r * 0.85); g.stroke(); }
    g.fillStyle = C.red; g.beginPath(); g.arc(0, 0, r * 0.24, 0, TAU); g.fill(); g.restore();
  }
  function dolphin(g, x, y, ang, s) {
    g.save(); g.translate(x, y); g.rotate(ang); g.scale(s, s); g.fillStyle = C.black;
    g.beginPath(); g.moveTo(34, 1); g.quadraticCurveTo(28, -4, 22, -6); g.bezierCurveTo(10, -13, -12, -12, -26, -4);
    g.lineTo(-38, -12); g.lineTo(-34, 0); g.lineTo(-38, 12); g.lineTo(-26, 4); g.bezierCurveTo(-10, 10, 10, 10, 22, 5); g.quadraticCurveTo(28, 4, 34, 1); g.fill();
    g.beginPath(); g.moveTo(-2, -10); g.quadraticCurveTo(-10, -22, -16, -21); g.lineTo(-12, -9); g.fill();
    g.beginPath(); g.moveTo(4, 7); g.lineTo(-4, 16); g.lineTo(-8, 8); g.fill();
    g.strokeStyle = C.inc; g.lineWidth = 1.4; g.beginPath(); g.moveTo(22, 2); g.bezierCurveTo(8, 6, -10, 5, -24, 1); g.stroke();
    g.fillStyle = C.white; g.beginPath(); g.arc(18, -3, 1.8, 0, TAU); g.fill(); g.restore();
  }

  // ---------------- ② Static black-figure layer ----------------
  const stat = () => P.cached('gr_static', W, H, (g) => {
    g.lineJoin = 'round'; g.lineCap = 'round';
    // Top: dark rim + black lines around meander; bottom: ground line
    const tg = g.createLinearGradient(0, 0, 0, 24); tg.addColorStop(0, 'rgba(18,10,6,.95)'); tg.addColorStop(1, 'rgba(26,14,8,.85)');
    g.fillStyle = tg; g.fillRect(0, 0, W, 21); g.fillStyle = C.black; g.fillRect(0, 24, W, 4); g.fillRect(0, 86, W, 5);
    g.fillRect(0, 899, W, 6);
    // Frame: black border + white-dot chain + fine inner line
    g.fillStyle = C.black; g.fillRect(362, 122, 436, 436); g.clearRect(380, 140, 400, 400);
    dots(g, dotRow(371, 790, 131, 11.6), 2.3); dots(g, dotRow(371, 790, 549, 11.6), 2.3);
    dots(g, dotRow(143, 540, 371, 11.6).map(p => [p[1], p[0]]), 2.3); dots(g, dotRow(143, 540, 789, 11.6).map(p => [p[1], p[0]]), 2.3);
    g.strokeStyle = C.black; g.lineWidth = 2.5; g.strokeRect(386, 146, 388, 388);
    // Grapevines (frame top)
    g.save(); g.beginPath(); g.rect(386, 146, 388, 388); g.clip();
    g.strokeStyle = C.black; g.lineWidth = 3; g.beginPath(); for (let x = 392; x <= 770; x += 4) { const y = 160 + Math.sin((x - 392) / 378 * Math.PI * 3.5) * 9; x === 392 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
    [[420, 166], [470, 178], [545, 182], [600, 160], [665, 164], [742, 172]].forEach(([x, y], k) => {
      g.fillStyle = C.black; for (let row = 0; row < 3; row++) for (let i = 0; i <= 2 - row; i++) { g.beginPath(); g.arc(x - (2 - row) * 4.5 + i * 9, y + 6 + row * 8, 4.6, 0, TAU); g.fill(); }
      const lx = x + (k % 2 ? 16 : -16), ly = y - 6; g.beginPath(); g.ellipse(lx, ly, 9, 5, k % 2 ? -0.5 : 0.5, 0, TAU); g.fill();
      g.strokeStyle = C.inc; g.lineWidth = 1; g.beginPath(); g.moveTo(lx - 6, ly); g.lineTo(lx + 6, ly); g.stroke();
    });
    g.restore();
    // Table
    g.fillStyle = C.black; g.fillRect(820, 640, 380, 17); g.fillStyle = C.red; g.fillRect(824, 659, 372, 6); g.fillStyle = C.black; g.fillRect(820, 665, 380, 3);
    dots(g, dotRow(832, 1190, 648.5, 13), 2.1);
    const leg = (x) => { g.fillStyle = C.black; g.beginPath(); g.moveTo(x - 7, 668); g.lineTo(x + 7, 668); g.lineTo(x + 5, 682); g.lineTo(x + 4, 878); g.lineTo(x - 4, 878); g.lineTo(x - 5, 682); g.closePath(); g.fill();
      g.beginPath(); g.ellipse(x + 1, 891, 11, 9, 0, Math.PI, 0); g.lineTo(x + 12, 900); g.lineTo(x - 10, 900); g.fill();
      g.strokeStyle = C.inc; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - 4, 690); g.lineTo(x + 4, 690); g.stroke(); };
    [866, 893, 1078, 1104].forEach(leg); g.fillStyle = C.black; g.fillRect(866, 706, 240, 5);
    // Chair: swan-neck back + turned legs + purple-red cushion
    const bal = (x) => { const ys = [[756, 9], [778, 22], [800, 11], [826, 9], [846, 21], [866, 11], [890, 15], [900, 15]];
      g.fillStyle = C.black; g.beginPath(); ys.forEach(([y, w], i) => i ? g.lineTo(x + w / 2, y) : g.moveTo(x + w / 2, y)); [...ys].reverse().forEach(([y, w]) => g.lineTo(x - w / 2, y)); g.closePath(); g.fill();
      g.fillStyle = C.red; g.fillRect(x - 10, 842, 20, 7); };
    bal(1322); bal(1468);
    g.fillStyle = C.black; g.fillRect(1288, 738, 206, 14); g.fillStyle = C.red; g.fillRect(1290, 752, 202, 7); dots(g, dotRow(1298, 1486, 745, 12), 2);
    g.fillStyle = C.red; g.beginPath(); g.moveTo(1470, 738); g.quadraticCurveTo(1492, 718, 1506, 726); g.lineTo(1494, 740); g.closePath(); g.fill();
    g.strokeStyle = C.black; g.lineWidth = 13; g.beginPath(); g.moveTo(1466, 742); g.lineTo(1470, 520); g.quadraticCurveTo(1468, 452, 1488, 440); g.quadraticCurveTo(1504, 432, 1512, 446); g.stroke();
    g.fillStyle = C.black; g.beginPath(); g.ellipse(1512, 448, 13, 8, 0.1, 0, TAU); g.fill(); g.beginPath(); g.moveTo(1520, 444); g.lineTo(1543, 455); g.lineTo(1520, 454); g.fill();
    g.fillStyle = C.white; g.beginPath(); g.arc(1513, 446, 2, 0, TAU); g.fill();
    g.strokeStyle = C.inc; g.lineWidth = 1.5; [560, 600, 640, 690].forEach(y => { g.beginPath(); g.moveTo(1464, y); g.lineTo(1476, y); g.stroke(); });
    // Amphora
    const am = [[1662, 604], [1738, 604], [1736, 620], [1722, 632], [1722, 662], [1764, 684], [1792, 724], [1796, 764], [1780, 812], [1748, 852], [1724, 868], [1730, 882], [1748, 900],
      [1652, 900], [1670, 882], [1676, 868], [1652, 852], [1620, 812], [1604, 764], [1608, 724], [1636, 684], [1678, 662], [1678, 632], [1664, 620]];
    const amp = new Path2D(); am.forEach((p, i) => i ? amp.lineTo(p[0], p[1]) : amp.moveTo(p[0], p[1])); amp.closePath();
    const ams = sm(am);
    g.strokeStyle = C.black; g.lineWidth = 12; g.beginPath(); g.moveTo(1724, 642); g.bezierCurveTo(1770, 626, 1784, 650, 1770, 692); g.stroke();
    g.beginPath(); g.moveTo(1676, 642); g.bezierCurveTo(1630, 626, 1616, 650, 1630, 692); g.stroke();
    g.fillStyle = C.black; g.fill(ams); g.fillRect(1656, 600, 88, 8);
    g.save(); g.clip(ams);
    const sh = g.createLinearGradient(1600, 0, 1800, 0); sh.addColorStop(0, 'rgba(255,220,180,0)'); sh.addColorStop(0.72, 'rgba(255,220,180,.09)'); sh.addColorStop(0.8, 'rgba(255,220,180,0)'); g.fillStyle = sh; g.fillRect(1600, 600, 200, 300);
    g.fillStyle = C.red; g.fillRect(1600, 708, 200, 6); g.fillRect(1600, 806, 200, 5);
    g.fillStyle = C.clayHi; g.fillRect(1658, 722, 84, 76); g.strokeStyle = C.black; g.lineWidth = 2.5; g.strokeRect(1658, 722, 84, 76);
    g.fillStyle = C.clayHi; g.fillRect(1600, 822, 200, 32);
    g.fillStyle = C.black; for (let x = 1600; x < 1800; x += 14) { g.beginPath(); g.moveTo(x, 854); g.lineTo(x + 7, 826); g.lineTo(x + 14, 854); g.fill(); }
    g.restore();
    // Small black cat on vase
    g.fillStyle = C.black; g.beginPath(); g.ellipse(1696, 782, 15, 13, 0, 0, TAU); g.fill(); g.beginPath(); g.arc(1708, 760, 9, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(1701, 755); g.lineTo(1703, 743); g.lineTo(1708, 752); g.lineTo(1713, 742); g.lineTo(1716, 756); g.fill();
    g.strokeStyle = C.black; g.lineWidth = 4; g.beginPath(); g.moveTo(1683, 790); g.quadraticCurveTo(1670, 792, 1672, 778); g.stroke();
    g.fillRect(1680, 792, 34, 4);
    dots(g, [[1705, 759], [1712, 759]], 1.6, '#f4f0d0');
    // Inscription
    greek(g, 'ΧΑΙΡΕ ΚΑΙ ΠΙΕΙ', 866, 474, 30, 9, 11);
    greek(g, 'ΑΙΛΟΥΡΟΣ ΚΑΛΟΣ', 86, 708, 30, 10, 12);
  });

  // ---------------- ③ Scrolling bands ----------------
  const TOP_P = 60, BOT_P = 76;
  const topStrip = () => P.cached('gr_topStrip', W + TOP_P * 2, 60, (g) => {
    g.strokeStyle = C.black; g.lineWidth = 7; g.lineCap = 'square'; g.lineJoin = 'miter';
    const y0 = 6, h = 46;
    g.beginPath(); g.moveTo(0, y0 + h); g.lineTo(W + TOP_P * 2, y0 + h); g.stroke();
    for (let x = 0; x < W + TOP_P * 2; x += TOP_P) {
      line(g, [[x + 4, y0 + h], [x + 4, y0], [x + 50, y0], [x + 50, y0 + 34], [x + 18, y0 + 34], [x + 18, y0 + 14], [x + 36, y0 + 14], [x + 36, y0 + 22]]); g.stroke();
    }
  });
  const botStrip = () => P.cached('gr_botStrip', W + BOT_P * 2, 150, (g) => {
    const Y = 930;                                    // Band local y = scene y - 930
    g.fillStyle = C.black; g.fillRect(0, 934 - Y, W + BOT_P * 2, 4); g.fillRect(0, 996 - Y, W + BOT_P * 2, 6); g.fillRect(0, 1072 - Y, W + BOT_P * 2, 8);
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (let i = 0, x = 0; x < W + BOT_P * 2; i++, x += BOT_P / 2) {
      g.strokeStyle = C.black; g.lineWidth = 2.6; g.beginPath(); g.moveTo(x, 946 - Y); g.quadraticCurveTo(x + 19, 962 - Y, x + 38, 946 - Y); g.stroke();
      const bud = new Path2D(); bud.moveTo(x, 948 - Y); bud.bezierCurveTo(x + 11, 954 - Y, x + 10, 972 - Y, x, 988 - Y); bud.bezierCurveTo(x - 10, 972 - Y, x - 11, 954 - Y, x, 948 - Y);
      g.fillStyle = i % 2 ? C.red : C.black; g.fill(bud); g.strokeStyle = C.black; g.lineWidth = 2.4; g.stroke(bud);
      if (i % 2) { g.strokeStyle = C.black; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, 953 - Y); g.lineTo(x, 982 - Y); g.stroke(); }
      g.fillStyle = C.black; g.beginPath(); g.arc(x + 19, 972 - Y, 2.6, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(x - 17, 1074 - Y); g.lineTo(x + 2, 1008 - Y); g.lineTo(x + 21, 1074 - Y); g.fill();   // Ray pattern
    }
  });

  // ---------------- ④ Boat and dolphins within frame ----------------
  function panel(c, lt) {
    c.save(); c.beginPath(); c.rect(388, 148, 384, 384); c.clip();
    const w = Math.sin(lt * TAU / 0.9), w2 = Math.cos(lt * TAU / 0.9);
    // Dolphins swim back/forth along their heading + slight sway
    [[416, 266, 1.45, 0.95], [748, 276, 1.75, 0.92], [462, 352, -1.05, 0.9], [442, 498, -0.25, 1.05], [652, 496, -0.12, 1.05], [738, 455, 0.25, 0.85]].forEach(([x, y, a, s], k) => {
      const ph = lt * TAU / 0.85 + k * 1.3, d = 9 * Math.sin(ph);
      dolphin(c, x + Math.cos(a) * d, y + Math.sin(a) * d, a + 0.12 * Math.cos(ph), s);
    });
    // Boat bobs and rocks gently
    c.translate(560, 420); c.rotate(0.025 * w2); c.translate(0, 4 * w); c.translate(-560, -420);
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = C.black; c.lineWidth = 1.6; line(c, [[458, 302], [418, 396]]); c.stroke(); line(c, [[662, 302], [700, 392]]); c.stroke();
    c.lineWidth = 4.5; line(c, [[560, 214], [560, 400]]); c.stroke();
    const sail = new Path2D(); sail.moveTo(458, 210); sail.lineTo(662, 210); sail.quadraticCurveTo(672, 258, 662, 304); sail.quadraticCurveTo(560, 312, 458, 304); sail.quadraticCurveTo(448, 258, 458, 210);
    c.fillStyle = '#f1e7d6'; c.fill(sail); c.lineWidth = 2.6; c.strokeStyle = C.black; c.stroke(sail);
    c.strokeStyle = C.red; c.lineWidth = 1.6; [500, 540, 582, 622].forEach(x => { c.beginPath(); c.moveTo(x, 212); c.lineTo(x + 1, 306); c.stroke(); });
    c.fillStyle = '#7a3a2a'; [[478, 240], [512, 278], [596, 236], [640, 284], [548, 296]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 1.6, 0, TAU); c.fill(); });
    c.strokeStyle = C.black; c.lineWidth = 6; line(c, [[446, 208], [674, 208]]); c.stroke();
    // Hull (crescent, stern curled like scorpion tail)
    c.fillStyle = C.black; c.beginPath(); c.moveTo(404, 400); c.quadraticCurveTo(430, 394, 470, 398); c.lineTo(690, 392); c.quadraticCurveTo(712, 370, 712, 330);
    c.quadraticCurveTo(708, 312, 696, 316); c.quadraticCurveTo(718, 300, 728, 326); c.quadraticCurveTo(734, 384, 700, 420); c.quadraticCurveTo(600, 452, 470, 440); c.quadraticCurveTo(428, 430, 404, 400); c.fill();
    c.fillStyle = C.red; c.beginPath(); c.moveTo(470, 410); c.lineTo(690, 404); c.quadraticCurveTo(600, 424, 470, 422); c.closePath(); c.fill();
    c.strokeStyle = C.inc; c.lineWidth = 1.4; c.beginPath(); c.moveTo(440, 426); c.quadraticCurveTo(560, 444, 700, 414); c.stroke();
    c.fillStyle = C.white; c.beginPath(); c.arc(428, 404, 3, 0, TAU); c.fill();
    c.strokeStyle = C.black; c.lineWidth = 4; line(c, [[690, 410], [722, 474]]); c.stroke(); line(c, [[702, 406], [744, 462]]); c.stroke();
    c.fillStyle = C.black; c.beginPath(); c.ellipse(724, 478, 5, 10, -0.5, 0, TAU); c.fill(); c.beginPath(); c.ellipse(746, 466, 5, 10, -0.7, 0, TAU); c.fill();
    // Reclining figure aboard (Dionysus)
    c.fillStyle = C.red; c.beginPath(); c.moveTo(520, 398); c.quadraticCurveTo(580, 372, 640, 384); c.lineTo(640, 398); c.closePath(); c.fill();
    c.fillStyle = C.black; c.beginPath(); c.moveTo(560, 396); c.quadraticCurveTo(596, 360, 632, 362); c.quadraticCurveTo(652, 372, 646, 396); c.closePath(); c.fill();
    c.beginPath(); c.arc(636, 348, 13, 0, TAU); c.fill();
    c.strokeStyle = C.black; c.lineWidth = 7; line(c, [[620, 368], [596, 342], [594, 326]]); c.stroke();
    c.strokeStyle = C.inc; c.lineWidth = 1.2; c.beginPath(); c.arc(638, 346, 5, 0, TAU); c.stroke();
    c.restore();
  }

  // ---------------- ④ Lyre (swings around nail) ----------------
  function lyre(c, lt) {
    const piv = [1050, 150], a = 0.09 * Math.sin(lt * TAU / 0.8 + 0.5);
    c.save(); c.translate(piv[0], piv[1]); c.rotate(a); c.translate(-piv[0], -piv[1]);
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = C.red; c.lineWidth = 2.4; line(c, [[986, 214], [1050, 150], [1112, 210]]); c.stroke();
    c.strokeStyle = C.black; c.lineWidth = 8; c.beginPath(); c.moveTo(1004, 326); c.quadraticCurveTo(960, 270, 990, 200); c.stroke();
    c.beginPath(); c.moveTo(1034, 326); c.quadraticCurveTo(1080, 272, 1104, 204); c.stroke();
    c.lineWidth = 7; line(c, [[978, 214], [1116, 212]]); c.stroke();
    c.fillStyle = C.black; [[976, 214], [1118, 212]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 6, 0, TAU); c.fill(); });
    c.lineWidth = 1.5; for (let k = 0; k < 7; k++) { c.beginPath(); c.moveTo(1000 + k * 14, 214); c.lineTo(1008 + k * 3.6, 322); c.stroke(); }
    c.beginPath(); c.arc(1019, 356, 44, 0, TAU); c.fill();
    c.strokeStyle = C.inc; c.lineWidth = 1.6; c.beginPath(); c.arc(1019, 356, 37, 0, TAU); c.stroke();
    c.beginPath(); c.arc(1019, 332, 8, 0.1, Math.PI - 0.1); c.stroke();
    [[1019, 360], [1004, 352], [1034, 352], [1008, 372], [1030, 372]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 6.5, 0, TAU); c.stroke(); });
    c.restore();
    c.fillStyle = C.black; c.beginPath(); c.arc(piv[0], piv[1], 5, 0, TAU); c.fill();
  }

  // ---------------- ⑤ Orange-white cat: black figure (black glaze + clay-orange incised tabby + purple-red/white additions) ----------------
  // Orange = clay-orange incisions + purple-red back/crown; white = added chest/muzzle/paws; eyes = archaic incised almonds.
  const CAT_W = '#efe1c8';
  function cat(c, ch) {
    const K = RIG.cat({ tail: ch.tail, blink: ch.blink, breathe: ch.breathe });
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    c.translate(548, 903); c.scale(0.9, 0.9); c.translate(-548, -903);          // Scale cat into standard box (390,610)-(690,905)
    // Tail: black silhouette + purple-red core + clay-orange incised rings
    const tp = K.tailPts, tail = new Path2D(); tp.forEach((p, i) => i ? tail.lineTo(p[0], p[1]) : tail.moveTo(p[0], p[1]));
    c.strokeStyle = C.black; c.lineWidth = 22; c.stroke(tail); c.strokeStyle = C.red; c.lineWidth = 7; c.stroke(tail);
    c.strokeStyle = C.catO; c.lineWidth = 2.6;
    for (let i = 2; i < tp.length - 1; i += 2) { const a = tp[i - 1], b = tp[i + 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2; c.beginPath(); c.moveTo(tp[i][0] - Math.cos(ang) * 9, tp[i][1] - Math.sin(ang) * 9); c.lineTo(tp[i][0] + Math.cos(ang) * 9, tp[i][1] + Math.sin(ang) * 9); c.stroke(); }
    c.translate(540, 902); c.scale(1, 1 + ch.breathe); c.translate(-540, -902);   // Breathing
    const body = sm([[566, 680], [520, 698], [480, 736], [454, 790], [444, 850], [454, 896], [520, 902], [672, 902], [676, 886], [660, 872], [654, 800], [648, 738], [636, 698]]);
    c.fillStyle = C.black; c.fill(body);
    c.save(); c.clip(body);
    // Purple-red saddle along inside of back contour
    c.strokeStyle = C.red; c.lineWidth = 26; c.beginPath(); c.moveTo(575, 690); c.bezierCurveTo(500, 700, 456, 760, 456, 880); c.stroke();
    // White-painted chest
    const white = sm([[600, 692], [640, 700], [646, 760], [636, 830], [628, 886], [604, 888], [596, 820], [590, 740]]);
    c.fillStyle = CAT_W; c.fill(white);
    // Incised tabby: evenly spaced points along back, curved cuts toward body center (clay orange)
    const back = [[570, 680], [520, 698], [480, 736], [454, 790], [444, 850], [454, 896]], seg = [];
    for (let i = 1; i < back.length; i++) seg.push(Math.hypot(back[i][0] - back[i - 1][0], back[i][1] - back[i - 1][1]));
    const tot = seg.reduce((a, b) => a + b, 0);
    const at = (u) => { let d = u * tot, i = 0; while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; } const q = d / seg[i]; return [lerp(back[i][0], back[i + 1][0], q), lerp(back[i][1], back[i + 1][1], q)]; };
    c.strokeStyle = C.catO; c.lineWidth = 3;
    for (let k = 0; k < 14; k++) { const a = at(0.03 + k * 0.068), dir = Math.atan2(800 - a[1], 575 - a[0]) + 0.25, L = 40 + (k % 3) * 12, nx = Math.cos(dir + Math.PI / 2), ny = Math.sin(dir + Math.PI / 2);
      const b = [a[0] + Math.cos(dir) * L, a[1] + Math.sin(dir) * L]; c.beginPath(); c.moveTo(a[0] - Math.cos(dir) * 6, a[1] - Math.sin(dir) * 6); c.quadraticCurveTo((a[0] + b[0]) / 2 + nx * 6, (a[1] + b[1]) / 2 + ny * 6, b[0], b[1]); c.stroke(); }
    [[[500, 830], [530, 806], [566, 816]], [[494, 858], [530, 838], [570, 850]], [[508, 884], [534, 868], [566, 878]]].forEach(s => { c.beginPath(); c.moveTo(...s[0]); c.quadraticCurveTo(...s[1], ...s[2]); c.stroke(); });
    [[[650, 776], [670, 772]], [[650, 806], [670, 804]], [[648, 836], [666, 836]]].forEach(([a, b]) => { c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); });
    c.restore();
    // Incisions: hind-thigh arc, front-leg boundary
    c.strokeStyle = C.inc; c.lineWidth = 2.2; c.beginPath(); c.arc(512, 860, 52, Math.PI * 1.08, Math.PI * 1.95); c.stroke();
    c.beginPath(); c.moveTo(626, 770); c.lineTo(628, 884); c.stroke();
    // Paws: white paint + black toe incisions
    c.fillStyle = CAT_W; [[606, 893], [650, 893]].forEach(([x, y]) => { c.beginPath(); c.ellipse(x, y, 21, 10, 0, 0, TAU); c.fill(); c.strokeStyle = C.black; c.lineWidth = 1.8; [-7, 1, 9].forEach(o => { c.beginPath(); c.moveTo(x + o, y - 3); c.lineTo(x + o, y + 8); c.stroke(); }); });
    c.fillStyle = C.black; c.beginPath(); c.ellipse(512, 894, 22, 9, 0, 0, TAU); c.fill();
    c.strokeStyle = C.inc; c.lineWidth = 1.6; [504, 512, 520].forEach(x => { c.beginPath(); c.moveTo(x, 889); c.lineTo(x - 1, 900); c.stroke(); });
    // Head: black silhouette, purple-red crown, white muzzle
    const head = new Path2D(); head.ellipse(600, 630, 60, 52, 0, 0, TAU);
    const ears = new Path2D(); ears.moveTo(548, 606); ears.lineTo(556, 540); ears.lineTo(592, 584); ears.closePath(); ears.moveTo(612, 582); ears.lineTo(650, 540); ears.lineTo(656, 606); ears.closePath();
    c.fillStyle = C.black; c.fill(ears); c.fill(head);
    c.save(); c.clip(head);
    c.fillStyle = C.red; c.beginPath(); c.ellipse(600, 586, 46, 22, 0, 0, TAU); c.fill();
    c.fillStyle = CAT_W; c.beginPath(); c.ellipse(608, 664, 32, 20, 0, 0, TAU); c.fill();
    c.strokeStyle = C.catO; c.lineWidth = 2.6;
    [[[584, 580], [590, 604]], [[600, 578], [600, 604]], [[616, 580], [610, 604]], [[542, 628], [562, 634]], [[544, 646], [562, 646]], [[658, 626], [640, 634]], [[658, 642], [642, 646]]].forEach(([a, b]) => { c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); });
    c.restore();
    c.strokeStyle = C.inc; c.lineWidth = 1.8; c.beginPath(); c.moveTo(560, 592); c.lineTo(563, 558); c.lineTo(580, 584); c.moveTo(624, 584); c.lineTo(645, 558); c.lineTo(648, 596); c.stroke();
    // Archaic incised almond eyes (white sclera + black pupils) / blink
    [[580, 622, -0.08], [628, 618, 0.08]].forEach(([x, y, r]) => {
      c.save(); c.translate(x, y); c.rotate(r); c.strokeStyle = C.inc; c.lineWidth = 2;
      if (ch.blink) { c.beginPath(); c.moveTo(-15, 0); c.quadraticCurveTo(0, 6, 15, 0); c.stroke(); c.restore(); return; }
      const eye = new Path2D(); eye.moveTo(-15, 1); eye.quadraticCurveTo(0, -13, 15, 0); eye.quadraticCurveTo(0, 10, -15, 1);
      c.fillStyle = CAT_W; c.fill(eye); c.stroke(eye);
      c.fillStyle = C.black; c.beginPath(); c.ellipse(3, -1, 3.4, 5.6, 0, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(15, 0); c.lineTo(20, -2); c.stroke(); c.restore(); });
    // Purple-red nose, incised mouth, whiskers
    c.fillStyle = C.red; c.beginPath(); c.moveTo(603, 646); c.lineTo(619, 646); c.lineTo(611, 656); c.closePath(); c.fill();
    c.strokeStyle = C.black; c.lineWidth = 2; c.beginPath(); c.moveTo(611, 656); c.lineTo(611, 662); c.moveTo(597, 662); c.quadraticCurveTo(604, 669, 611, 662); c.quadraticCurveTo(618, 669, 625, 662); c.stroke();
    c.strokeStyle = C.inc; c.lineWidth = 1.4; [[[568, 652], [534, 646]], [[568, 660], [536, 666]]].forEach(([a, b]) => { c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); });
    c.strokeStyle = C.black; [[[640, 656], [690, 648]], [[640, 662], [692, 668]]].forEach(([a, b]) => { c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); });
    // Purple-red collar + white dots
    c.strokeStyle = C.red; c.lineWidth = 14; c.beginPath(); c.moveTo(556, 684); c.quadraticCurveTo(604, 704, 652, 688); c.stroke();
    c.strokeStyle = C.inc; c.lineWidth = 1.4; [-7, 7].forEach(o => { c.beginPath(); c.moveTo(556, 684 + o); c.quadraticCurveTo(604, 704 + o, 652, 688 + o); c.stroke(); });
    dots(c, [0.1, 0.25, 0.4, 0.55, 0.7, 0.85].map(u => { const x = (1 - u) * (1 - u) * 556 + 2 * u * (1 - u) * 604 + u * u * 652, y = (1 - u) * (1 - u) * 684 + 2 * u * (1 - u) * 704 + u * u * 688; return [x, y]; }), 2.2);
    c.restore();
  }

  // ---------------- ⑥ Girl: black-glaze silhouette + incisions + added colors + golden curls ----------------
  const R6 = rng(606);
  const crownStrands = [...Array(11).keys()].map(k => ({ A: [1259 + k * 3.4, 311 + k * 5], C: [1314 + k * 2.6, 272 + k * 8.5], B: [1388 + k * 2.2, 318 + k * 6.5], ph: R6() * 6 }));
  const locks = [...Array(8).keys()].map(k => ({ x0: 1374 + k * 5.5, y0: 372 + k * 2, x1: 1380 + k * 4.6, y1: 516 + (k % 3) * 13, ph: R6() * 6, a: 4.5 + R6() * 2.5 }));
  const hairOut = [[1262, 296], [1298, 281], [1342, 284], [1378, 302], [1398, 326], [1414, 344], [1410, 372], [1416, 402], [1424, 452], [1422, 510], [1410, 550], [1392, 558], [1380, 512], [1366, 464], [1346, 436]];
  const hairSil = [[1251, 320], ...hairOut, [1326, 422]];
  const hairRegion = sm([[1254, 318], ...hairOut, [1326, 420], [1314, 396], [1306, 372], [1298, 348], [1284, 330], [1266, 322]]);
  const faceSil = sm([[1290, 432], [1282, 418], [1262, 411], [1251, 403], [1246, 395], [1250, 389], [1244, 384], [1246, 377], [1235, 370], [1240, 358], [1246, 345], [1251, 330], [1254, 318],
    ...hairSil.slice(1)]);
  function curl(c, x, y, r, turns, dir = 1) { c.beginPath(); for (let a = 0; a <= turns * TAU; a += 0.3) { const rr = r * (1 - a / (turns * TAU) * 0.75); const px = x + Math.cos(a * dir) * rr, py = y + Math.sin(a * dir) * rr; a ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); }
  const headM = (G) => { const NP = Tg(1300, 425); return new DOMMatrix().translate(NP[0], NP[1]).rotate(G.tilt * 180 / Math.PI).translate(-NP[0], -NP[1]).translate(1300, GDY + 620).scale(GS, GS).translate(-1300, -620); };
  function head(c, G, ch, lt) {
    const NP = Tg(1300, 425);
    c.save(); c.translate(NP[0], NP[1]); c.rotate(G.tilt); c.translate(-NP[0], -NP[1]);
    c.translate(1300, GDY + 620); c.scale(GS, GS); c.translate(-1300, -620);
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.fillStyle = C.black; c.fill(faceSil);
    // Golden curls: wavy crown strands + spiral bun + long rear locks (clipped to hair region)
    c.save(); c.clip(hairRegion); c.strokeStyle = C.gold; c.lineWidth = 2.5;
    crownStrands.forEach(({ A, C: Q, B, ph }) => { c.beginPath(); for (let i = 0; i <= 34; i++) { const u = i / 34, v = 1 - u;
      const x = v * v * A[0] + 2 * u * v * Q[0] + u * u * B[0], y = v * v * A[1] + 2 * u * v * Q[1] + u * u * B[1];
      const dx = 2 * v * (Q[0] - A[0]) + 2 * u * (B[0] - Q[0]), dy = 2 * v * (Q[1] - A[1]) + 2 * u * (B[1] - Q[1]), L = Math.hypot(dx, dy) || 1, o = 2.6 * Math.sin(u * Math.PI * 7 + ph);
      i ? c.lineTo(x - dy / L * o, y + dx / L * o) : c.moveTo(x - dy / L * o, y + dx / L * o); } c.stroke(); });
    locks.forEach(({ x0, y0, x1, y1, ph, a }) => { c.beginPath(); for (let i = 0; i <= 30; i++) { const u = i / 30, x = lerp(x0, x1, u) + a * Math.sin(u * Math.PI * 4.5 + ph), y = lerp(y0, y1, u); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
      curl(c, x1 + a * Math.sin(Math.PI * 4.5 + ph) - 4, y1 + 2, 5.5, 1.3); });
    curl(c, 1398, 344, 17, 2.4); curl(c, 1398, 344, 10, 1.4, -1);
    c.restore();
    // Small forehead curls + spiral side curls
    c.strokeStyle = C.gold; c.lineWidth = 2; [[1262, 314], [1268, 305], [1277, 298], [1288, 293]].forEach(([x, y]) => curl(c, x, y, 4.2, 1.4));
    c.lineWidth = 2.2; [[1298, 350, 1300, 420], [1307, 356, 1312, 428]].forEach(([x0, y0, x1, y1], k) => { c.strokeStyle = C.black; c.lineWidth = 6; const pth = new Path2D();
      for (let i = 0; i <= 40; i++) { const u = i / 40, x = lerp(x0, x1, u) + 5 * Math.sin(u * Math.PI * 9 + k), y = lerp(y0, y1, u); i ? pth.lineTo(x, y) : pth.moveTo(x, y); }
      c.stroke(pth); c.strokeStyle = C.gold; c.lineWidth = 2.2; c.stroke(pth); });
    // Purple-red headband + white dots
    const band = new Path2D(); band.moveTo(1259, 307); band.quadraticCurveTo(1318, 276, 1406, 322);
    c.strokeStyle = C.black; c.lineWidth = 14; c.stroke(band); c.strokeStyle = C.red; c.lineWidth = 10; c.stroke(band);
    dots(c, [0.12, 0.3, 0.48, 0.66, 0.84].map(u => [(1 - u) * (1 - u) * 1259 + 2 * u * (1 - u) * 1318 + u * u * 1406, (1 - u) * (1 - u) * 307 + 2 * u * (1 - u) * 276 + u * u * 322]), 1.9);
    // Ear + gold earring
    c.fillStyle = C.black; c.beginPath(); c.ellipse(1316, 374, 9, 13, 0.15, 0, TAU); c.fill();
    c.strokeStyle = C.inc; c.lineWidth = 1.6; c.beginPath(); c.ellipse(1316, 374, 9, 13, 0.15, -1.9, 1.6); c.stroke(); c.beginPath(); c.arc(1316, 374, 4, -1.5, 1.6); c.stroke();
    c.fillStyle = C.gold; c.beginPath(); c.arc(1317, 393, 4, 0, TAU); c.fill();
    // Incised features: large almonds (archaic frontal eyes), brows, nostrils, lips
    c.strokeStyle = C.inc; c.lineWidth = 1.7;
    c.beginPath(); c.moveTo(1251, 335); c.quadraticCurveTo(1264, 326, 1281, 333); c.stroke();
    if (ch.blink) { c.beginPath(); c.moveTo(1253, 347); c.quadraticCurveTo(1266, 351, 1281, 346); c.stroke(); }
    else {
      const eye = new Path2D(); eye.moveTo(1252, 346); eye.quadraticCurveTo(1265, 335, 1282, 345); eye.quadraticCurveTo(1266, 354, 1252, 346);
      c.fillStyle = '#f3dcc0'; c.fill(eye); c.stroke(eye);
      c.fillStyle = C.black; c.beginPath(); c.arc(1263, 345, 4, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(1282, 345); c.lineTo(1287, 343); c.stroke();
    }
    c.beginPath(); c.moveTo(1241, 373); c.quadraticCurveTo(1247, 376, 1250, 372); c.stroke();
    c.beginPath(); c.moveTo(1247, 389); c.quadraticCurveTo(1252, 391, 1256, 387); c.stroke();
    c.beginPath(); c.moveTo(1262, 402); c.quadraticCurveTo(1270, 404, 1276, 400); c.stroke();
    c.restore();
  }
  function girl(c, ch, lt, t) {
    const G = RIG.girl({ cup: ch.cup, sip: ch.sip, breathe: ch.breathe, s: GS, dy: GDY, hair: 'long' });
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    // Silhouette: far sleeve/hand, skirt, torso, neck
    c.fillStyle = C.black; [G.farSleeve, G.skirt, G.torso, G.neck].forEach(p => c.fill(p));
    const fh = Tg(1212, 618); c.beginPath(); c.ellipse(fh[0], fh[1], 15, 11, 0.2, 0, TAU); c.fill();
    const foot = smT([[1118, 906], [1080, 912], [1052, 922], [1048, 930], [1128, 931], [1142, 914]], true); c.fill(foot);
    c.strokeStyle = C.inc; c.lineWidth = 1.6; [[[1074, 914], [1082, 930]], [[1096, 910], [1102, 930]], [[1052, 927], [1128, 927]], [[1080, 912], [1112, 922]]].forEach(s => { c.stroke(smT(s)); });
    const body = new Path2D(); [G.torso, G.skirt, G.farSleeve, G.neck].forEach(p => body.addPath(p));
    // Incised drapery folds (chiton)
    c.save(); c.clip(body); c.strokeStyle = C.inc; c.lineWidth = 1.8;
    [[[1292, 448], [1312, 458], [1336, 452]], [[1342, 470], [1322, 520], [1300, 566]], [[1366, 478], [1346, 540], [1320, 596]], [[1392, 498], [1374, 560], [1352, 606]], [[1404, 522], [1410, 572], [1406, 612]],
      [[1288, 614], [1340, 604], [1416, 614]], [[1180, 690], [1262, 668], [1360, 686], [1438, 698]], [[1164, 736], [1262, 724], [1352, 750]], [[1446, 660], [1440, 720], [1420, 760]],
      [[1150, 770], [1134, 846], [1122, 912]], [[1184, 776], [1174, 852], [1166, 916]], [[1220, 780], [1216, 852], [1214, 918]], [[1260, 784], [1262, 856], [1262, 920]], [[1304, 786], [1308, 856], [1310, 920]], [[1340, 800], [1344, 860], [1344, 918]],
      [[1240, 634], [1218, 662], [1196, 700]]].forEach(s => c.stroke(smT(s)));
    // Broad purple-red hem + white dots + small dotted flowers
    const hb = smT([[1080, 892], [1220, 896], [1370, 892]]); c.strokeStyle = C.red; c.lineWidth = 15; c.stroke(hb);
    c.strokeStyle = C.inc; c.lineWidth = 1.4; c.stroke(smT([[1080, 880], [1220, 884], [1370, 880]])); c.stroke(smT([[1080, 905], [1220, 909], [1370, 905]]));
    dots(c, dotRow(1104, 1350, 894, 17).map(p => Tg(p[0], p[1] + (p[0] - 1220) * 0.0)), 2.2);
    [[1235, 845], [1290, 826], [1172, 866], [1330, 712], [1388, 566], [1340, 530], [1206, 742], [1300, 680]].forEach(([x, y]) => { const p = Tg(x, y); dots(c, [[p[0] - 4, p[1]], [p[0] + 4, p[1]], [p[0], p[1] - 4], [p[0], p[1] + 4]], 1.7); });
    c.restore();
    // Long curls + head (including tilt)
    head(c, G, ch, lt);
    // Near arm: black, incised separation where overlapping body, purple-red cuff + bracelet
    // Period cup hold: right rim touches lips (not near RIG nose), nearly horizontal bowl, hand below foot without covering chin
    const HM = headM(G), lip = new DOMPoint(1243, 391).matrixTransform(HM), tab = Tg(1190, 596), q = ch.cup;
    const rim = [lerp(tab[0] - 4, lip.x - 30, q), lerp(tab[1] - 14, lip.y + 1, q)];
    G.kylix = { x: rim[0], y: rim[1], tilt: -0.08 * q };
    const S = G.A.shoulder, hT = [rim[0] + lerp(32, 6, q), rim[1] + 30];
    const { E, H: Hd } = RIG.ik2(S, hT, 165 * GS, 122 * GS, -1), fa = Math.atan2(Hd[1] - E[1], Hd[0] - E[0]);
    const Wr = [lerp(E[0], Hd[0], 0.82), lerp(E[1], Hd[1], 0.82)];
    const upperArm = RIG.taper(S, E, 54 * GS, 40 * GS, 10 * GS), foreArm = RIG.taper(E, Wr, 40 * GS, 30 * GS, 2 * GS);
    const hand = new Path2D(); hand.ellipse(Hd[0], Hd[1], 17 * GS, 14 * GS, fa, 0, TAU);
    c.fillStyle = C.black; [upperArm, foreArm, hand].forEach(p => c.fill(p));
    const bodyH = new Path2D(); bodyH.addPath(body); bodyH.addPath(faceSil, HM);
    c.save(); c.clip(bodyH); c.strokeStyle = C.inc; c.lineWidth = 2; [upperArm, foreArm, hand].forEach(p => c.stroke(p)); c.restore();
    c.save(); c.clip(upperArm);
    const M = [lerp(S[0], E[0], 0.6), lerp(S[1], E[1], 0.6)], aa = Math.atan2(E[1] - S[1], E[0] - S[0]), nx = Math.cos(aa + Math.PI / 2), ny = Math.sin(aa + Math.PI / 2);
    c.strokeStyle = C.red; c.lineWidth = 15; c.beginPath(); c.moveTo(M[0] - nx * 40, M[1] - ny * 40); c.lineTo(M[0] + nx * 40, M[1] + ny * 40); c.stroke();
    dots(c, [-12, 0, 12].map(k => [M[0] + nx * k, M[1] + ny * k]), 1.9);
    c.strokeStyle = C.inc; c.lineWidth = 1.4; [-9, 9].forEach(o => { c.beginPath(); c.moveTo(M[0] + Math.cos(aa) * o - nx * 40, M[1] + Math.sin(aa) * o - ny * 40); c.lineTo(M[0] + Math.cos(aa) * o + nx * 40, M[1] + Math.sin(aa) * o + ny * 40); c.stroke(); });
    c.restore();
    const wr = [lerp(E[0], Hd[0], 0.74), lerp(E[1], Hd[1], 0.74)], qx = Math.cos(fa + Math.PI / 2), qy = Math.sin(fa + Math.PI / 2);
    c.strokeStyle = C.red; c.lineWidth = 6; c.beginPath(); c.moveTo(wr[0] - qx * 14, wr[1] - qy * 14); c.lineTo(wr[0] + qx * 14, wr[1] + qy * 14); c.stroke();
    // Kylix (wide, shallow, two handles)
    const cp = G.kylix; c.save(); c.translate(cp.x, cp.y); c.rotate(cp.tilt);
    c.fillStyle = C.black; c.beginPath(); c.moveTo(-32, 0); c.quadraticCurveTo(0, 26, 32, 0); c.closePath(); c.fill();
    c.fillRect(-3, 11, 6, 10); c.beginPath(); c.ellipse(0, 21, 12, 3.5, 0, 0, TAU); c.fill();
    c.strokeStyle = C.black; c.lineWidth = 3.6; c.beginPath(); c.moveTo(-26, 5); c.quadraticCurveTo(-44, 0, -38, -8); c.stroke(); c.beginPath(); c.moveTo(26, 5); c.quadraticCurveTo(44, 0, 38, -8); c.stroke();
    c.strokeStyle = C.red; c.lineWidth = 3; c.beginPath(); c.moveTo(-30, 1); c.lineTo(30, 1); c.stroke();
    c.restore();
    // Hand: incised fingers
    c.strokeStyle = C.inc; c.lineWidth = 1.5; [-5, 1, 7].forEach(o => { c.beginPath(); c.moveTo(Hd[0] - 10 + Math.cos(fa) * o * 0, Hd[1] + o); c.lineTo(Hd[0] + 4, Hd[1] + o - 2); c.stroke(); });
    c.restore();
    return G;
  }
  // Steam: three thin curling ≀ lines above rim
  function steam(c, G, t) {
    const cp = G.kylix; c.save(); c.strokeStyle = C.black; c.lineWidth = 2.6; c.lineCap = 'round';
    for (let k = -1; k <= 1; k++) { c.beginPath(); for (let i = 0; i <= 16; i++) { const u = i / 16, x = cp.x - 10 + k * 14 + 4.5 * Math.sin(u * TAU * 1.2 + t * 9 + k * 1.3), y = cp.y - 14 - u * 28; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    c.restore();
  }

  return {
    draw(c, lt, t) {
      const ch = P.choreo(lt, t);
      c.drawImage(bg(), 0, 0);
      // Bands: one easeInOut cycle timed to source beat + constant drift throughout
      const topOff = 48 * lt + TOP_P * IO(clamp((lt - 0.49) / 0.35));
      const botOff = -(30 * lt + BOT_P * IO(clamp((lt - 0.477) / 0.367)));
      const ts = ((topOff % TOP_P) + TOP_P) % TOP_P, bs = ((botOff % BOT_P) + BOT_P) % BOT_P;
      c.drawImage(topStrip(), -ts, 30);
      c.drawImage(botStrip(), -bs, 930);
      c.drawImage(stat(), 0, 0);
      panel(c, lt);
      lyre(c, lt);
      [[498, 628, 12], [436, 662, 20], [745, 742, 20], [330, 800, 16], [752, 860, 12]].forEach(([x, y, r], k) => rosette(c, x, y, r, lt * 1.6 * (k % 2 ? 1 : -1) + k));
      cat(c, ch);
      const G = girl(c, ch, lt, t);
      steam(c, G, t);
      c.drawImage(vignette(), 0, 0);
    },
  };
})();
