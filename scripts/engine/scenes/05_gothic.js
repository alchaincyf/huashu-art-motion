// 1290 Gothic illuminated manuscript — pure code.
// Pipeline: ① cache static layer (parchment + per-pixel gold leaf + embossed diamonds + pointed arches/pinnacles/stained glass/table/throne/Latin column)
//      → ② gold mask (per-pixel gold classification from static layer) → ③ each frame: stained-glass flicker, swaying vine ornaments, diagonal highlight sweep (gold only)
//      → ④ flat colors + thick ink outlines (halo, golden hair, red robe/gold stripes, blue cloak, gold cup), naive human-faced cat holding mouse → ⑤ crawling snail, running mouse, glinting cup
SCENES['05_gothic'] = (() => {
  const W = 1920, H = 1080, { clamp, lerp } = U, P = PAINT;
  const INK = '#2b1a12';
  const C = {
    parch: '#ecdfc0', parchDk: '#c9ae80', gold: '#d9a63a', goldHi: '#f8de86', goldLo: '#9c6a1a',
    red: '#c3262e', redDk: '#7e1318', blue: '#24449e', blueDk: '#142a6a', pink: '#e7a3aa', green: '#55a03c', greenDk: '#2f6e26',
    white: '#f8f2e2', wood: '#8a5a2c', woodDk: '#5a3818', skin: '#f5dcc2', hair: '#e9b746', hairDk: '#9a6618',
  };
  const ease = U.ease.inOut;
  const R_ = (seed) => U.rng(seed);

  // ---------- Utilities ----------
  const F = (c, p, fill, line = INK, lw = 3) => { if (!p) return; if (fill) { c.fillStyle = fill; c.fill(p); } if (line && lw) { c.strokeStyle = line; c.lineWidth = lw; c.stroke(p); } };
  const poly = (pts, closed = true) => { const p = new Path2D(); pts.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); if (closed) p.closePath(); return p; };
  // Pointed arch: xl..xr, spring line ys, bottom yb, radius r (>width/2 gives a point)
  const arch = (xl, xr, ys, yb, r) => {
    const p = new Path2D(), w = xr - xl, mid = (xl + xr) / 2, h = Math.sqrt(r * r - (r - w / 2) ** 2);
    const a1 = Math.atan2(-h, mid - (xl + r)), a2 = Math.atan2(-h, mid - (xr - r));
    p.moveTo(xl, yb); p.lineTo(xl, ys); p.arc(xl + r, ys, r, Math.PI, a1 + Math.PI * 2); p.arc(xr - r, ys, r, a2, 0); p.lineTo(xr, yb); p.closePath(); return p;
  };
  const dot = (c, x, y, r, fill, line = INK, lw = 1.5) => { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); if (fill) { c.fillStyle = fill; c.fill(); } if (line) { c.strokeStyle = line; c.lineWidth = lw; c.stroke(); } };

  // ---------- Per-pixel gold leaf (large mottling + horizontal polishing marks + grain + upper-left light) ----------
  const goldTex = () => P.cached('goth_goldTex', W, H, (g) => {
    const x0 = 290, x1 = 1480, y0 = 20, y1 = 960, img = g.createImageData(W, H), d = img.data, r = R_(5);
    const lo = P.hex(C.goldLo), mid = P.hex(C.gold), hi = P.hex(C.goldHi);
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const big = P.fbm(x * 0.0035, y * 0.0035 + 7, 3);
      const brush = P.noise(x * 0.004, y * 0.09) * 0.5 + P.noise(x * 0.012, y * 0.25) * 0.3;    // Horizontal polishing marks
      const light = 0.18 - (x - x0) / (x1 - x0) * 0.12 - (y - y0) / (y1 - y0) * 0.16;
      let f = 0.52 + big * 0.42 + brush * 0.22 + light + (r() - .5) * 0.10;
      f = clamp(f, 0, 1);
      const c0 = f < 0.5 ? P.mix(lo, mid, f * 2) : P.mix(mid, hi, (f - 0.5) * 2);
      const i = (y * W + x) * 4; d[i] = c0[0]; d[i + 1] = c0[1]; d[i + 2] = c0[2]; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });

  // ---------- Geometry ----------
  const PANEL = poly([[328, 255], [328, 205], [580, 66], [830, 205], [985, 96], [1135, 205], [1285, 96], [1440, 205], [1440, 255], [1440, 895], [328, 895]]);
  const WIN = arch(362, 798, 360, 540, 240);
  const LANCETS = [arch(392, 565, 414, 532, 131), arch(595, 768, 414, 532, 131)];

  // Parchment + aged edges
  function parchment(g) {
    g.drawImage(P.texture('goth_parch', C.parch, { scale: 0.0028, amt: 20, grain: 9, dark: C.parchDk, seed: 3 }), 0, 0);
    const v = g.createRadialGradient(W / 2, H / 2, 380, W / 2, H / 2, 1150);
    v.addColorStop(0, 'rgba(120,80,30,0)'); v.addColorStop(1, 'rgba(110,70,25,.5)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
  }

  // Embossed diamonds: dark lines + 1px-offset light lines suggest incised gold; four center dots (light above, dark below)
  function lattice(g) {
    const s = 46;
    g.save(); g.clip(PANEL);
    g.drawImage(goldTex(), 0, 0);
    g.lineWidth = 1.6;
    for (const [col, off] of [['rgba(255,240,180,.55)', 1.2], ['rgba(110,66,10,.55)', 0]]) {
      g.strokeStyle = col; g.beginPath();
      for (let k = -40; k < 80; k++) { const u = k * s; g.moveTo(u - 1200 + off, 1200 + off); g.lineTo(u + 1200 + off, -1200 + off); g.moveTo(u - 1200 + off, -1200 + off); g.lineTo(u + 1200 + off, 1200 + off); }
      g.stroke();
    }
    for (let a = -10; a < 70; a++) for (let b = -40; b < 40; b++) {
      const u = (a + 0.5) * s, v = (b + 0.5) * s, x = (u + v) / 2, y = (u - v) / 2;
      if (x < 320 || x > 1450 || y < 60 || y > 900) continue;
      for (const [dx, dy] of [[-5, 0], [5, 0], [0, -5], [0, 5]]) {
        g.fillStyle = 'rgba(255,245,200,.7)'; g.beginPath(); g.arc(x + dx - .6, y + dy - .6, 1.9, 0, 7); g.fill();
        g.fillStyle = 'rgba(120,70,10,.55)'; g.beginPath(); g.arc(x + dx + .7, y + dy + .7, 1.5, 0, 7); g.fill();
      }
    }
    // Gold-leaf seams: faint square joins (leaf applied sheet by sheet)
    g.strokeStyle = 'rgba(120,75,15,.18)'; g.lineWidth = 1;
    for (let x = 328 + 118; x < 1440; x += 118) { g.beginPath(); g.moveTo(x, 60); g.lineTo(x + 3, 895); g.stroke(); }
    for (let y = 140; y < 895; y += 125) { g.beginPath(); g.moveTo(328, y); g.lineTo(1440, y + 2); g.stroke(); }
    g.restore();
    g.strokeStyle = INK; g.lineWidth = 3; g.stroke(PANEL);
  }

  // Gables, pinnacles, side columns, lower border, grass
  function architecture(g) {
    const band = (pts, col, w) => {
      g.lineJoin = 'miter'; g.lineCap = 'butt';
      g.strokeStyle = INK; g.lineWidth = w + 6; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.stroke();
      g.strokeStyle = col; g.lineWidth = w; g.stroke();
      // White dots
      for (let i = 0; i < pts.length - 1; i++) { const [a, b] = [pts[i], pts[i + 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.floor(L / 22);
        for (let k = 1; k < n; k++) { const q = k / n; dot(g, lerp(a[0], b[0], q), lerp(a[1], b[1], q), 2.6, '#fff', null); } }
      // Gold foliate balls along outer edge
      for (let i = 0; i < pts.length - 1; i++) { const [a, b] = [pts[i], pts[i + 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.floor(L / 34);
        const nx = (b[1] - a[1]) / L, ny = -(b[0] - a[0]) / L, sg = ny < 0 ? 1 : -1;
        for (let k = 1; k < n; k++) { const q = k / n; dot(g, lerp(a[0], b[0], q) + nx * sg * (w / 2 + 9), lerp(a[1], b[1], q) + ny * sg * (w / 2 + 9), 6, C.gold, INK, 2); } }
    };
    band([[322, 196], [580, 52], [838, 196]], C.pink, 30);
    band([[836, 196], [985, 82], [1135, 196]], C.blue, 26);
    band([[1135, 196], [1285, 82], [1446, 196]], C.blue, 26);
    // Trefoil arches beneath middle/right gables: dark-gold outlines
    g.strokeStyle = 'rgba(110,66,10,.8)'; g.lineWidth = 3;
    for (const cx of [985, 1285]) { g.beginPath(); g.arc(cx - 88, 262, 62, Math.PI * 1.05, Math.PI * 1.85); g.arc(cx, 205, 70, Math.PI * 1.12, Math.PI * 1.88); g.arc(cx + 88, 262, 62, Math.PI * 1.15, Math.PI * 1.95); g.stroke(); }
    // Pendant points
    for (const x of [835, 1135]) { const p = poly([[x - 16, 238], [x + 16, 238], [x, 282]]); F(g, p, C.white, INK, 2.5); dot(g, x, 252, 4.5, C.red, null); }
    // Cross finials
    for (const [x, y] of [[580, 30], [985, 60], [1285, 60]]) { g.fillStyle = C.gold; g.strokeStyle = INK; g.lineWidth = 2; g.fillRect(x - 4, y - 22, 8, 30); g.strokeRect(x - 4, y - 22, 8, 30); g.fillRect(x - 12, y - 14, 24, 7); g.strokeRect(x - 12, y - 14, 24, 7); }
    // Pinnacles
    for (const [x, top, bot] of [[312, 68, 248], [835, 92, 236], [1135, 92, 236], [1455, 68, 248]]) {
      const sw = 22, shaftTop = top + 62;
      g.fillStyle = C.white; g.fillRect(x - sw / 2, shaftTop, sw, bot - shaftTop);
      g.fillStyle = C.blue; for (const dx of [-5, 3]) g.fillRect(x + dx, shaftTop + 8, 3, bot - shaftTop - 16);
      g.strokeStyle = INK; g.lineWidth = 2.5; g.strokeRect(x - sw / 2, shaftTop, sw, bot - shaftTop);
      F(g, poly([[x - 15, shaftTop], [x, top], [x + 15, shaftTop]]), C.red, INK, 2.5);
      g.fillStyle = C.gold; g.fillRect(x - 15, shaftTop - 2, 30, 7); g.strokeRect(x - 15, shaftTop - 2, 30, 7);
      dot(g, x, top - 4, 5, C.gold, INK, 2);
    }
    // Side columns: red/blue/pink blocks + white dots
    const cols = [C.red, C.blue, C.pink, C.blue];
    for (const x0 of [298, 1440]) for (let y = 250, k = 0; y < 945; y += 31, k++) {
      g.fillStyle = cols[k % 4]; g.fillRect(x0, y, 30, 31); g.strokeStyle = INK; g.lineWidth = 2; g.strokeRect(x0, y, 30, 31);
      dot(g, x0 + 15, y + 15.5, 4, '#fff', null);
    }
    g.fillStyle = C.gold; g.fillRect(296, 240, 34, 12); g.fillRect(1438, 240, 34, 12); g.strokeStyle = INK; g.strokeRect(296, 240, 34, 12); g.strokeRect(1438, 240, 34, 12);
    // Grass
    g.fillStyle = C.green; g.fillRect(328, 892, 1112, 53);
    g.fillStyle = C.greenDk; g.fillRect(328, 892, 1112, 5);
    const r = R_(11); g.strokeStyle = C.greenDk; g.lineWidth = 2;
    for (let i = 0; i < 90; i++) { const x = 340 + r() * 1090, y = 905 + r() * 34; g.beginPath(); g.moveTo(x - 4, y - 6); g.lineTo(x, y + 2); g.lineTo(x + 5, y - 7); g.stroke(); }
    for (const x of [1000, 1040, 1052, 1085, 1118, 1180, 760, 690]) { const y = 900 + (x % 7); for (let k = 0; k < 5; k++) dot(g, x + Math.cos(k * 1.26) * 4, y + Math.sin(k * 1.26) * 4, 2.4, '#fff', null); dot(g, x, y, 2, '#f2c230', null); }
    // Lower border: alternating red/blue + white waves
    for (let x = 322, k = 0; x < 1440; x += 52, k++) {
      const w = Math.min(52, 1440 - x); g.fillStyle = k % 2 ? C.blue : C.red; g.fillRect(x, 945, w, 26);
      g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); for (let s = 0; s <= w - 10; s += 2) { const yy = 958 + Math.sin(s / (w - 10) * Math.PI * 2) * 4; s ? g.lineTo(x + 5 + s, yy) : g.moveTo(x + 5, yy); } g.stroke();
      g.strokeStyle = INK; g.lineWidth = 2; g.strokeRect(x, 945, w, 26);
    }
    g.lineWidth = 3; g.strokeRect(298, 943, 1172, 30);
    for (const [x, y] of [[310, 958], [1458, 958]]) { g.fillStyle = C.gold; g.fillRect(x - 13, y - 13, 26, 26); g.strokeStyle = INK; g.strokeRect(x - 13, y - 13, 26, 26); }
    dot(g, 1468, 968, 8, C.gold, INK, 2);
  }

  // Pointed window: quatrefoil rose + red/blue diamond glass in two lancets
  function windowStatic(g) {
    g.save(); g.shadowColor = 'rgba(80,40,0,.35)'; g.shadowOffsetX = 5; g.shadowOffsetY = 5; F(g, WIN, '#f6eedb', INK, 4); g.restore();
    g.strokeStyle = INK; g.lineWidth = 3; g.stroke(WIN);
    // Fine inner ring
    const inner = arch(374, 786, 362, 540, 228); g.strokeStyle = 'rgba(140,110,70,.5)'; g.lineWidth = 2; g.stroke(inner);
    // Quatrefoil rose window
    const rc = [580, 222];
    const q = new Path2D(); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 - Math.PI / 2; q.moveTo(rc[0] + Math.cos(a) * 33 + 30, rc[1] + Math.sin(a) * 33); q.arc(rc[0] + Math.cos(a) * 33, rc[1] + Math.sin(a) * 33, 30, 0, Math.PI * 2); }
    F(g, q, C.red, INK, 3);
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 - Math.PI / 2; dot(g, rc[0] + Math.cos(a) * 33, rc[1] + Math.sin(a) * 33, 20, C.blue, INK, 2.5); dot(g, rc[0] + Math.cos(a) * 33, rc[1] + Math.sin(a) * 33, 6, C.gold, INK, 1.5); }
    dot(g, rc[0], rc[1], 13, C.gold, INK, 2.5);
    for (const [dx, dy] of [[0, -9], [-9, 6], [9, 6]]) dot(g, 578 + dx, 316 + dy, 8, C.blue, INK, 2);
    // Lancets: red/blue diamonds + gold leads + white dots
    LANCETS.forEach((L, li) => {
      g.save(); g.clip(L);
      const s = 38;
      for (let a = -30; a < 60; a++) for (let b = -30; b < 30; b++) {
        const u = a * s, v = b * s, x = (u + v) / 2, y = (u - v) / 2;
        if (x < 370 || x > 790 || y < 260 || y > 560) continue;
        const dm = poly([[x, y - s / 2], [x + s / 2, y], [x, y + s / 2], [x - s / 2, y]]);
        g.fillStyle = (a + b) % 2 ? C.red : C.blue; g.fill(dm);
        if ((a + b) % 2 === 0) for (const [dx, dy] of [[-4, 0], [4, 0], [0, -4], [0, 4], [0, 0]]) dot(g, x + dx, y + dy, 1.8, '#fff', null);
        else dot(g, x, y, 4, C.gold, null);
      }
      // Leads along diamond edges (two diagonal families with constant x+y and x−y)
      g.strokeStyle = C.gold; g.lineWidth = 3; g.beginPath();
      for (let k = -60; k < 120; k++) { const c0 = (k + 0.5) * s; g.moveTo(c0 - 1000, 1000); g.lineTo(c0 + 1000, -1000); g.moveTo(c0 - 1000, -1000); g.lineTo(c0 + 1000, 1000); }
      g.stroke(); g.restore();
      F(g, L, null, INK, 4);
    });
    // Windowsill
    const sill = new Path2D(); sill.rect(345, 538, 470, 24); F(g, sill, C.pink, INK, 3);
    g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(350, 542, 460, 4);
  }

  // Table (white cloth + blue stripes + scalloped edge), throne, bread, knife
  function furniture(g) {
    // A-frame support legs
    g.lineCap = 'round';
    for (const x of [872, 1142]) for (const [a, b] of [[-26, 18], [26, -18]]) { g.strokeStyle = INK; g.lineWidth = 15; g.beginPath(); g.moveTo(x + b, 715); g.lineTo(x + a, 898); g.stroke(); g.strokeStyle = C.wood; g.lineWidth = 10; g.stroke(); }
    for (const x of [872, 1142]) { g.fillStyle = C.wood; g.fillRect(x - 22, 830, 44, 8); g.strokeStyle = INK; g.lineWidth = 2; g.strokeRect(x - 22, 830, 44, 8); }
    // Tabletop
    const top = poly([[805, 578], [1215, 578], [1210, 645], [810, 645]]); F(g, top, C.white, INK, 3);
    g.fillStyle = 'rgba(150,140,120,.18)'; g.fillRect(810, 630, 400, 14);
    g.strokeStyle = C.blue; g.lineWidth = 2.5; for (const x of [828, 836, 1184, 1192]) { g.beginPath(); g.moveTo(x, 580); g.lineTo(x + (x < 1000 ? 2 : -2), 644); g.stroke(); }
    // Hanging cloth: scalloped hem
    const cl = new Path2D(); cl.moveTo(812, 645); cl.lineTo(1208, 645); cl.lineTo(1205, 712);
    for (let x = 1205; x > 815; x -= 26) cl.quadraticCurveTo(x - 13, 742, x - 26, 712);
    cl.closePath(); F(g, cl, C.white, INK, 3);
    g.save(); g.clip(cl);
    g.strokeStyle = 'rgba(36,68,158,.8)'; g.lineWidth = 2; for (let x = 822; x < 1205; x += 26) { g.beginPath(); g.moveTo(x, 648); g.quadraticCurveTo(x + 3, 690, x + 1, 735); g.stroke(); }
    g.strokeStyle = 'rgba(150,140,120,.45)'; g.lineWidth = 1.5; for (let x = 834; x < 1205; x += 26) { g.beginPath(); g.moveTo(x, 650); g.lineTo(x + 2, 725); g.stroke(); }
    g.restore();
    for (let x = 826; x < 1200; x += 13) dot(g, x, 700, 2.3, C.red, null);
    // Bread + knife
    const br = new Path2D(); br.ellipse(880, 616, 34, 19, 0, 0, Math.PI * 2); F(g, br, '#d9a058', INK, 2.5);
    g.strokeStyle = '#8a5524'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(880, 600); g.lineTo(880, 632); g.moveTo(862, 616); g.quadraticCurveTo(880, 606, 898, 616); g.stroke();
    g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.moveTo(1106, 636); g.lineTo(1140, 632); g.stroke(); g.strokeStyle = '#7a4a20'; g.lineWidth = 4; g.stroke();
    g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.moveTo(1140, 632); g.lineTo(1186, 627); g.stroke(); g.strokeStyle = '#d8d8d8'; g.lineWidth = 2.5; g.stroke();
    // Throne: green back + gold finial, red cushion, pink base + blue pointed arch
    const back = poly([[1438, 430], [1478, 430], [1480, 748], [1438, 748]]); F(g, back, '#3c8a3a', INK, 3);
    g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 3; g.beginPath(); g.moveTo(1446, 440); g.lineTo(1446, 740); g.stroke();
    dot(g, 1458, 422, 9, C.gold, INK, 2); dot(g, 1478, 460, 7, C.gold, INK, 2);
    const base = poly([[1302, 748], [1482, 748], [1482, 882], [1302, 882]]); F(g, base, C.pink, INK, 3);
    for (let k = 0; k < 4; k++) { const x = 1318 + k * 40; F(g, arch(x, x + 26, 790, 872, 17), C.blue, INK, 2.5); }
    F(g, poly([[1296, 880], [1488, 880], [1488, 898], [1296, 898]]), C.gold, INK, 2.5);
    F(g, poly([[1300, 726], [1484, 726], [1486, 750], [1300, 750]]), C.red, INK, 3);
    dot(g, 1484, 735, 7, C.gold, INK, 2);
  }

  // Text column: ruling, red/blue flourishes, gold initial H on blue, Gothic Latin (red opening letters = rubrication)
  const LINES = [['ic sedet homo', 1640], ['cum poculo suo', 1640], ['et bibit. Cattus', 1515], ['eum spectat.', 1515], ['Cattus semper', 1515], ['spectat. Nemo', 1515], ['scit quare. Mus', 1515], ['autem scit et', 1515], ['tacet in eternum.', 1515]];
  function textColumn(g) {
    g.strokeStyle = 'rgba(150,110,70,.28)'; g.lineWidth = 1.2;
    for (let k = 0; k < 10; k++) { const y = 300 + k * 62; g.beginPath(); g.moveTo(1495, y); g.lineTo(1895, y); g.stroke(); }
    g.beginPath(); g.moveTo(1505, 240); g.lineTo(1505, 920); g.stroke(); g.beginPath(); g.moveTo(1888, 240); g.lineTo(1888, 920); g.stroke();
    // Flourishes
    g.lineWidth = 2; g.strokeStyle = C.red; g.beginPath(); for (let y = 235; y < 500; y += 2) { const x = 1497 + Math.sin(y * 0.09) * 6; y === 235 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
    g.strokeStyle = C.blue; g.beginPath(); for (let y = 260; y < 330; y += 2) { const x = 1506 + Math.sin(y * 0.11 + 1) * 5; y === 260 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
    // Initial H
    g.save(); g.shadowColor = 'rgba(60,30,0,.3)'; g.shadowOffsetX = 3; g.shadowOffsetY = 3; g.fillStyle = C.gold; g.fillRect(1508, 304, 120, 118); g.restore();
    g.fillStyle = C.blue; g.fillRect(1517, 313, 102, 100); g.strokeStyle = INK; g.lineWidth = 2.5; g.strokeRect(1508, 304, 120, 118); g.strokeRect(1517, 313, 102, 100);
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1.6;
    for (const [x, y, s] of [[1600, 330, 1], [1532, 395, -1], [1600, 396, 1]]) { g.beginPath(); for (let a = 0; a < 9; a += 0.25) { const rr = 1 + a * 1.4; const px = x + Math.cos(a * s) * rr, py = y + Math.sin(a * s) * rr; a ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); }
    for (let k = 0; k < 7; k++) dot(g, 1528 + k * 13, 320, 1.6, '#fff', null);
    g.font = '118px "UnifrakturMaguntia-400"'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.lineWidth = 6; g.strokeStyle = INK; g.strokeText('H', 1568, 404); g.fillStyle = C.gold; g.fillText('H', 1568, 404);
    g.fillStyle = 'rgba(255,245,200,.6)'; g.font = '118px "UnifrakturMaguntia-400"'; g.save(); g.beginPath(); g.rect(1517, 313, 102, 46); g.clip(); g.fillText('H', 1567, 403); g.restore();
    // Body text
    g.textAlign = 'left'; g.font = '44px "UnifrakturMaguntia-400"';
    LINES.forEach(([s, x], k) => {
      const y = 350 + k * 62; let cx = x;
      for (const word of s.split(' ')) {
        const red = /^(Cattus|Nemo|Mus)/.test(word);
        g.fillStyle = red ? C.red : '#2a1c12';
        g.fillText(word, cx, y); cx += g.measureText(word + ' ').width;
      }
      if (k === 3) { // Wavy line filler at row end
        g.lineWidth = 2.4; g.strokeStyle = C.red; g.beginPath(); for (let i = 0; i <= 10; i++) g.lineTo(cx + 6 + i * 11, y - 14 + (i % 2) * 12); g.stroke();
        g.strokeStyle = C.blue; g.beginPath(); for (let i = 0; i <= 10; i++) g.lineTo(cx + 12 + i * 11, y - 14 + (i % 2) * 12); g.stroke();
      }
    });
  }

  // Small knight (marginal drollery)
  function knight(g) {
    g.save(); g.translate(760, 1010);
    F(g, poly([[-10, -8], [10, -8], [14, 26], [-14, 26]]), C.red, INK, 2.5);
    g.strokeStyle = INK; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(-6, 24); g.lineTo(-14, 48); g.moveTo(6, 24); g.lineTo(18, 44); g.stroke();
    g.strokeStyle = '#d0d0d8'; g.lineWidth = 3.5; g.stroke();
    const helm = new Path2D(); helm.rect(-12, -34, 24, 26); F(g, helm, '#c8ccd6', INK, 2.5);
    g.fillStyle = INK; g.fillRect(-8, -24, 16, 3);
    F(g, poly([[6, -6], [30, -6], [30, 14], [18, 26], [6, 14]]), C.blue, INK, 2.5);
    g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(18, -2); g.lineTo(18, 20); g.moveTo(10, 6); g.lineTo(26, 6); g.stroke();
    g.restore();
  }

  const STATIC = () => P.cached('goth_static', W, H, (g) => { parchment(g); lattice(g); architecture(g); windowStatic(g); furniture(g); textColumn(g); knight(g); });
  // Gold mask (highlights land only on gold)
  const MASK = () => P.cached('goth_mask', W, H, (g) => {
    const s = STATIC().getContext('2d').getImageData(0, 0, W, H).data, img = g.createImageData(W, H), d = img.data;
    for (let i = 0; i < W * H * 4; i += 4) {
      const r = s[i], gg = s[i + 1], b = s[i + 2];
      const k = clamp((r - b - 70) / 50) * clamp((gg - b - 30) / 40) * clamp((r - 140) / 40);
      d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = k * 255;
    }
    g.putImageData(img, 0, 0);
  });

  // ---------- Vine ornaments (redrawn each frame, stems/leaves sway independently) ----------
  const VINES = (() => {
    const L = [], B = [];
    for (let y = 30; y <= 990; y += 8) L.push([172 + 48 * Math.sin(y * 0.0125) + 18 * Math.sin(y * 0.033 + 1), y]);
    for (let x = 230; x <= 1900; x += 8) B.push([x, 1012 + 26 * Math.sin(x * 0.011) + 10 * Math.sin(x * 0.035 + 2) - (x > 1500 ? (x - 1500) * 0.06 : 0)]);
    const joinL = [[L[L.length - 1][0], L[L.length - 1][1]], [200, 1005], [230, B[0][1]]];
    return [L.concat(joinL.slice(1)), B];
  })();
  const LEAFCOL = [C.blue, C.red, C.gold, C.blue, C.red];
  function ivy(c, x, y, a, s, col) {        // Three-lobed ivy/morning glory: common Gothic marginal foliage
    c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s);
    const p = new Path2D(); p.moveTo(0, 0); p.quadraticCurveTo(-10, -6, -14, -18); p.quadraticCurveTo(-6, -14, -2, -22); p.quadraticCurveTo(0, -30, 2, -22);
    p.quadraticCurveTo(6, -14, 14, -18); p.quadraticCurveTo(10, -6, 0, 0); p.closePath();
    c.fillStyle = col; c.fill(p); c.strokeStyle = INK; c.lineWidth = 1.6 / s; c.stroke(p);
    c.restore();
  }
  function vines(c, t) {
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    VINES.forEach((pts, vi) => {
      const sway = (i) => [Math.sin(t * 2.6 + i * 0.09 + vi) * 5, Math.cos(t * 2.1 + i * 0.07) * 4];
      const pp = pts.map((p, i) => { const s = sway(i); return [p[0] + s[0], p[1] + s[1]]; });
      c.strokeStyle = '#3a2416'; c.lineWidth = 2.6; c.beginPath(); pp.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.stroke();
      const r = R_(31 + vi * 7);
      for (let i = 3, k = 0; i < pp.length - 3; i += 3 + ((r() * 3) | 0), k++) {
        const p = pp[i], q = pp[i + 1], ta = Math.atan2(q[1] - p[1], q[0] - p[0]), side = k % 2 ? 1 : -1;
        const na = ta + side * (Math.PI / 2 - 0.5);
        const L = 18 + r() * 16, sw = Math.sin(t * 3.6 + k * 1.7 + vi) * 0.42;
        const ex = p[0] + Math.cos(na + sw * 0.5) * L, ey = p[1] + Math.sin(na + sw * 0.5) * L;
        c.strokeStyle = '#3a2416'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(p[0], p[1]); c.quadraticCurveTo(p[0] + Math.cos(na) * L * 0.6 + side * 4, p[1] + Math.sin(na) * L * 0.6, ex, ey); c.stroke();
        if (r() < 0.62) ivy(c, ex, ey, na + Math.PI / 2 + sw, 1.05 + r() * 0.4, LEAFCOL[(k + vi) % 5]);
        else { dot(c, ex, ey, 5.5, C.gold, INK, 1.4); c.strokeStyle = '#3a2416'; c.lineWidth = 1; for (let h = -1; h <= 1; h++) { const a2 = na + h * 0.6 + sw; c.beginPath(); c.moveTo(ex + Math.cos(a2) * 6, ey + Math.sin(a2) * 6); c.lineTo(ex + Math.cos(a2) * 13, ey + Math.sin(a2) * 13); c.stroke(); } }
      }
    });
    c.restore();
  }

  // ---------- Animated gold: diagonal highlight ----------
  const K_SLANT = 0.45;
  const sweepX = (lt) => lerp(150, 1650, clamp((lt - 0.08) / 1.15));     // Constant speed: reaches window at 0.3s, crosses girl at 0.9s
  function goldSweep(c, lt) {
    const xc = sweepX(lt), bx = Math.round(xc - 460), bw = 920, s = P.scratch('gothSweep'), g = s.getContext('2d');
    g.clearRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
    const gr = g.createLinearGradient(xc - 170, 540 - 170 * K_SLANT, xc + 170, 540 + 170 * K_SLANT);
    gr.addColorStop(0, 'rgba(255,240,190,0)'); gr.addColorStop(0.25, 'rgba(255,236,170,.32)'); gr.addColorStop(0.47, 'rgba(255,252,230,.85)');
    gr.addColorStop(0.53, 'rgba(255,252,230,.85)'); gr.addColorStop(0.75, 'rgba(255,236,170,.32)'); gr.addColorStop(1, 'rgba(255,240,190,0)');
    g.fillStyle = gr; g.fillRect(bx, 0, bw, H);
    g.globalCompositeOperation = 'destination-in'; g.drawImage(MASK(), bx, 0, bw, H, bx, 0, bw, H); g.globalCompositeOperation = 'source-over';
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.85; c.drawImage(s, bx, 0, bw, H, bx, 0, bw, H); c.restore();
  }
  const glint = (c, x, y, s, a = 1) => {           // Four-point star glint
    if (s <= 0.02) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.fillStyle = '#fff6d0';
    c.beginPath(); c.moveTo(x, y - 18 * s); c.quadraticCurveTo(x, y, x + 18 * s, y); c.quadraticCurveTo(x, y, x, y + 18 * s); c.quadraticCurveTo(x, y, x - 18 * s, y); c.quadraticCurveTo(x, y, x, y - 18 * s); c.fill();
    c.globalAlpha = a * 0.5; c.beginPath(); c.arc(x, y, 6 * s, 0, 7); c.fill(); c.restore();
  };
  const SPARKS = [[452, 640], [760, 330], [930, 470], [1090, 300], [1250, 520], [700, 780], [1010, 820], [1380, 330], [560, 115], [1300, 150], [1568, 360]];
  const nearSweep = (x, y, lt) => { const u = x + K_SLANT * (y - 540); return clamp(1 - Math.abs(u - sweepX(lt)) / 70); };

  // Stained glass flickers: selected diamonds brighten in turn
  function glassTwinkle(c, t) {
    c.save(); c.globalCompositeOperation = 'lighter';
    LANCETS.forEach((L, li) => { c.save(); c.clip(L);
      for (let k = 0; k < 40; k++) { const h = U.hash(k, li + 3), x = (li ? 600 : 396) + U.hash(k, 9 + li) * 170, y = 300 + h * 230;
        const a = Math.max(0, Math.sin(t * 5 + h * 40)); if (a < 0.6) continue;
        const gr = c.createRadialGradient(x, y, 0, x, y, 22); gr.addColorStop(0, `rgba(255,255,255,${(a - 0.6) * 1.1})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(x - 22, y - 22, 44, 44); }
      c.restore(); });
    c.restore();
  }

  // ---------- Girl: Gothic icon style ----------
  function girl(c, G, lt, t, ch) {
    const A = G.A;
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    // Halo (behind head)
    const hc = [A.headC[0] + 16, A.headC[1] - 22], hr = 114;
    const hg = c.createRadialGradient(hc[0] - 30, hc[1] - 30, 10, hc[0], hc[1], hr);
    hg.addColorStop(0, '#fbe597'); hg.addColorStop(0.6, '#e2b445'); hg.addColorStop(1, '#b98222');
    c.fillStyle = hg; c.beginPath(); c.arc(hc[0], hc[1], hr, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    c.strokeStyle = C.red; c.lineWidth = 3; c.beginPath(); c.arc(hc[0], hc[1], hr - 9, 0, 7); c.stroke();
    for (let k = 0; k < 36; k++) { const a = k / 36 * Math.PI * 2; dot(c, hc[0] + Math.cos(a) * (hr - 18), hc[1] + Math.sin(a) * (hr - 18), 2.3, '#fff3c0', 'rgba(120,70,10,.6)', 1); }
    const hs = nearSweep(hc[0], hc[1], lt); if (hs > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = hs * 0.5; c.fillStyle = '#fff4c8'; c.beginPath(); c.arc(hc[0], hc[1], hr, 0, 7); c.fill(); c.restore(); }
    // Long golden hair (behind, wavy)
    const nape = A.nape, sw = Math.sin(t * 2.4) * 3;
    const hair = RIG.smooth([[nape[0] + 30, nape[1] - 100], [nape[0] + 58, nape[1] - 40], [nape[0] + 72, nape[1] + 30], [nape[0] + 84 + sw, nape[1] + 110], [nape[0] + 78 + sw, nape[1] + 190], [nape[0] + 92 + sw, nape[1] + 250],
      [nape[0] + 62 + sw, nape[1] + 262], [nape[0] + 50, nape[1] + 200], [nape[0] + 34, nape[1] + 120], [nape[0] + 10, nape[1] + 50], [nape[0] - 20, nape[1] + 10]]);
    F(c, hair, C.hair, INK, 3);
    c.strokeStyle = C.hairDk; c.lineWidth = 2;
    for (let k = 0; k < 4; k++) { c.beginPath(); for (let s = 0; s <= 20; s++) { const q = s / 20, x = nape[0] + 30 + k * 12 + Math.sin(q * 9 + k) * 6 + q * 30, y = nape[1] - 60 + q * 300; s ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    // Far sleeve and hand
    F(c, G.farSleeve, C.red); F(c, G.farCuff, C.gold); F(c, G.farHand, C.skin);
    // Skirt: red + fine vertical gold stripes + gold hem
    F(c, G.skirt, C.red, INK, 3.5);
    c.save(); c.clip(G.skirt); c.strokeStyle = 'rgba(240,190,80,.75)'; c.lineWidth = 1.6;
    for (let x = 1080; x < 1470; x += 20) { c.beginPath(); c.moveTo(x, 600); c.quadraticCurveTo(x - 14, 780, x - 22, 940); c.stroke(); }
    c.strokeStyle = C.redDk; c.lineWidth = 3; G.folds.forEach(f => c.stroke(f));
    c.strokeStyle = C.gold; c.lineWidth = 12; c.beginPath(); c.moveTo(1090, 924); c.quadraticCurveTo(1230, 940, 1360, 924); c.stroke();
    c.restore();
    F(c, G.shoe, '#3a2418', INK, 2.5);
    // Torso
    F(c, G.torso, C.red, INK, 3.5);
    c.save(); c.clip(G.torso); c.strokeStyle = 'rgba(240,190,80,.75)'; c.lineWidth = 1.6; for (let x = 1280; x < 1440; x += 20) { c.beginPath(); c.moveTo(x, 420); c.lineTo(x + 6, 630); c.stroke(); } c.restore();
    // Blue cloak: rear shoulder to seat, gold edge
    const b = A.back, cloak = RIG.smooth([[A.nape[0] - 6, A.nape[1] + 12], [A.nape[0] + 40, A.nape[1] + 22], [b[0] + 30, b[1] + 10], [b[0] + 44, b[1] + 140], [b[0] + 46, b[1] + 230], [b[0] + 10, b[1] + 236], [b[0] + 4, b[1] + 120], [b[0] - 18, b[1] + 10], [A.nape[0] - 10, A.nape[1] + 40]]);
    F(c, cloak, C.blue, INK, 3.5);
    c.save(); c.clip(cloak); c.strokeStyle = C.blueDk; c.lineWidth = 3; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(b[0] + 6 + k * 12, b[1] - 20); c.quadraticCurveTo(b[0] + 18 + k * 12, b[1] + 100, b[0] + 14 + k * 12, b[1] + 230); c.stroke(); } c.restore();
    c.strokeStyle = C.gold; c.lineWidth = 4; c.beginPath(); c.moveTo(A.nape[0] - 8, A.nape[1] + 30); c.quadraticCurveTo(b[0] - 14, b[1] + 20, b[0] + 6, b[1] + 232); c.stroke();
    // Gold neckline
    F(c, G.neck, C.skin, INK, 2.5);
    c.strokeStyle = C.gold; c.lineWidth = 5; c.beginPath(); c.moveTo(A.neck[0] - 18, A.neck[1] + 2); c.quadraticCurveTo(A.neck[0] + 6, A.neck[1] + 18, A.neck[0] + 30, A.neck[1] - 2); c.stroke();
    // Head
    F(c, G.hairBack, C.hair, INK, 3);
    F(c, G.face, C.skin, INK, 3);
    c.save(); c.clip(G.face); c.fillStyle = 'rgba(232,110,110,.55)'; c.beginPath(); c.arc(G.cheek[0] - 4, G.cheek[1], 12, 0, 7); c.fill(); c.restore();
    c.fillStyle = C.skin; c.beginPath(); c.ellipse(G.ear[0], G.ear[1], 8, 12, 0.2, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    F(c, G.bangs, C.hair, INK, 3);
    c.strokeStyle = C.hairDk; c.lineWidth = 2; G.hairLines.forEach(h => c.stroke(h));
    G.locks.forEach(h => { c.strokeStyle = INK; c.lineWidth = 9; c.stroke(h); c.strokeStyle = C.hair; c.lineWidth = 6; c.stroke(h); });
    // Features: Gothic almond eyes, thin brows, small red lips
    const closed = ch.blink || ch.cup > 0.86;
    if (closed) { c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.arc(G.eye.x, G.eye.y - 2, 7, 0.3, Math.PI - 0.3); c.stroke(); }
    else {
      c.fillStyle = '#fff'; c.beginPath(); c.ellipse(G.eye.x, G.eye.y, 9, 5, -0.1, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 2.2; c.stroke();
      c.fillStyle = '#3a2a1c'; c.beginPath(); c.arc(G.eye.x - 3, G.eye.y, 3.6, 0, 7); c.fill();
      c.strokeStyle = INK; c.lineWidth = 2.6; c.stroke(G.lid);
    }
    c.strokeStyle = '#8a5a20'; c.lineWidth = 2.2; c.stroke(G.brow);
    c.fillStyle = '#c0303a'; c.beginPath(); c.moveTo(...G.lips[0]); c.lineTo(...G.lips[1]); c.lineTo(...G.lips[2]); c.closePath(); c.fill();
    // Near arm: red sleeve + gold cuff
    F(c, G.upperArm, C.red, INK, 3.5); F(c, G.foreArm, C.red, INK, 3.5); F(c, G.cuff, C.gold, INK, 2.5);
    F(c, G.hand, C.skin, INK, 2.5);
    chalice(c, G.cup, lt, t);
    c.fillStyle = C.skin; c.beginPath(); c.arc(G.thumb[0], G.thumb[1], 7, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    c.restore();
  }
  // Gold chalice: rim at cup.x,cup.y; half-ellipse bowl + node + foot; red wine
  function chalice(c, cup, lt, t) {
    c.save(); c.translate(cup.x, cup.y); c.rotate(cup.tilt || 0);
    const w = 52, gg = c.createLinearGradient(-w / 2, 0, w / 2, 0); gg.addColorStop(0, '#a87020'); gg.addColorStop(0.35, '#fbe08a'); gg.addColorStop(0.6, '#e0ad40'); gg.addColorStop(1, '#8a5a14');
    const bowl = new Path2D(); bowl.moveTo(-w / 2, 0); bowl.bezierCurveTo(-w / 2, 26, -10, 36, 0, 36); bowl.bezierCurveTo(10, 36, w / 2, 26, w / 2, 0); bowl.closePath();
    F(c, bowl, gg, INK, 2.5);
    const stem = poly([[-5, 34], [5, 34], [4, 58], [-4, 58]]); F(c, stem, gg, INK, 2);
    const knot = new Path2D(); knot.ellipse(0, 46, 9, 5, 0, 0, 7); F(c, knot, '#f0c860', INK, 2);
    const foot = new Path2D(); foot.moveTo(-20, 66); foot.quadraticCurveTo(0, 50, 20, 66); foot.closePath(); F(c, foot, gg, INK, 2);
    const rim = new Path2D(); rim.ellipse(0, 0, w / 2, 7, 0, 0, 7); F(c, rim, '#7a1018', INK, 2.2);
    c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(-8, -1.5, 9, 2, 0, 0, 7); c.fill();
    c.restore();
    // Glint: four-point star on rim
    const tw = Math.max(0, Math.sin(t * 7 + 1)); glint(c, cup.x + 18, cup.y - 4, 0.5 + tw * 0.5, 0.5 + tw * 0.5);
    // Steam (fine ink lines curve upward)
    c.save(); c.globalAlpha = 0.7; P.steam(c, t, cup.x, cup.y - 12, { h: 64, n: 3, color: 'rgba(120,110,100,.9)', width: 2.2, spread: 10, wobble: 7 }); c.restore();
  }

  // ---------- Cat: naive manuscript human face, holding a mouse ----------
  function cat(c, K, t, ch) {
    const O = '#e3913e', ODk = '#b45a18', Wt = C.white;
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    // Tail (ringed)
    c.strokeStyle = INK; c.lineWidth = K.tailW + 6; c.stroke(K.tail); c.strokeStyle = O; c.lineWidth = K.tailW; c.stroke(K.tail);
    const tp = K.tailPts; c.strokeStyle = ODk; c.lineWidth = 6;
    for (let i = 3; i < tp.length - 1; i += 3) { const a = Math.atan2(tp[i + 1][1] - tp[i][1], tp[i + 1][0] - tp[i][0]) + Math.PI / 2; c.beginPath(); c.moveTo(tp[i][0] - Math.cos(a) * 11, tp[i][1] - Math.sin(a) * 11); c.lineTo(tp[i][0] + Math.cos(a) * 11, tp[i][1] + Math.sin(a) * 11); c.stroke(); }
    // Body
    const body = RIG.smooth(K.bodyPts); F(c, body, O, INK, 3.5);
    c.save(); c.clip(body);
    c.strokeStyle = ODk; c.lineWidth = 7;
    for (let k = 0; k < 7; k++) { const y = 700 + k * 28; c.beginPath(); c.moveTo(418, y + 8); c.quadraticCurveTo(470, y - 10, 520, y + 14); c.stroke(); }
    c.fillStyle = Wt; c.fill(K.white);
    c.restore();
    // Hind-leg mass (seated thigh)
    c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath(); c.arc(505, 840, 52, Math.PI * 1.05, Math.PI * 1.9); c.stroke();
    // Front legs: one grounded, one raised holding mouse
    c.fillStyle = Wt; c.fill(K.legs[0]); c.strokeStyle = INK; c.lineWidth = 3; c.stroke(K.legs[0]);
    for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(584 + k * 7, 880); c.lineTo(584 + k * 7, 892); c.lineWidth = 1.6; c.stroke(); }
    const sh = [632, 744], pw = [664, 778];
    const arm = RIG.limb(sh, pw, 32, 26); F(c, arm, Wt, INK, 3);
    // Mouse hangs by tail from paw, swings like pendulum
    const sw = Math.sin(t * 5.5) * 0.32, ml = 56, mx = pw[0] + Math.sin(sw) * ml, my = pw[1] + Math.cos(sw) * ml;
    c.strokeStyle = '#6a4a40'; c.lineWidth = 2; c.beginPath(); c.moveTo(pw[0], pw[1] + 6); c.quadraticCurveTo(pw[0] + Math.sin(sw) * 30 + 6, pw[1] + 30, mx, my - 12); c.stroke();
    c.save(); c.translate(mx, my); c.rotate(-sw);
    const mb = new Path2D(); mb.ellipse(0, 6, 10, 17, 0, 0, 7); F(c, mb, '#4c3e38', INK, 2);
    dot(c, -8, 20, 5, '#4c3e38', INK, 1.5); dot(c, 8, 20, 5, '#4c3e38', INK, 1.5); dot(c, 0, 24, 2, '#e8a0a0', null);
    c.strokeStyle = '#4c3e38'; c.lineWidth = 3; c.beginPath(); c.moveTo(-6, 4); c.lineTo(-12, 12 + Math.sin(t * 9) * 3); c.moveTo(6, 4); c.lineTo(12, 12 - Math.sin(t * 9) * 3); c.stroke();
    c.restore();
    c.fillStyle = Wt; c.beginPath(); c.ellipse(pw[0], pw[1] + 2, 15, 12, 0.3, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke();
    // Head: orange, naive human face
    F(c, K.head, O, INK, 3.5);
    c.fillStyle = '#f2a8a0'; K.earInner.forEach(e => { c.beginPath(); e.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.fill(); });
    c.save(); c.clip(K.head);
    c.strokeStyle = ODk; c.lineWidth = 6; K.stripes.slice(0, 3).forEach(s => { c.beginPath(); c.moveTo(...s[0]); c.lineTo(...s[1]); c.stroke(); });
    const hc = K.headC, fx = hc[0] + 10, fy = hc[1] + 6;
    c.fillStyle = '#f7e6cc'; c.beginPath(); c.ellipse(fx, fy + 6, 42, 34, 0, 0, 7); c.fill();
    c.restore();
    // Blushing cheeks
    c.fillStyle = 'rgba(232,110,110,.45)'; dot(c, fx - 26, fy + 14, 9, 'rgba(232,110,110,.45)', null); dot(c, fx + 28, fy + 12, 9, 'rgba(232,110,110,.45)', null);
    // Eyes: almond side glance (pupils right toward girl), thick upper lids
    const eyes = [[fx - 18, fy - 6], [fx + 18, fy - 8]];
    eyes.forEach(([x, y], k) => {
      if (ch.blink) { c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x - 10, y); c.lineTo(x + 10, y); c.stroke(); return; }
      c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x, y, 11, 7, 0, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
      dot(c, x + 5, y + 1, 4.2, '#2a1c12', null);
      c.lineWidth = 3; c.beginPath(); c.moveTo(x - 12, y - 2); c.quadraticCurveTo(x, y - 9, x + 12, y - 3); c.stroke();
      c.lineWidth = 2; c.beginPath(); c.moveTo(x - 10, y - 15 - k * 2); c.quadraticCurveTo(x, y - 20 - k * 3, x + 11, y - 15 + k * 2); c.stroke();
    });
    // Nose, pursed mouth, whiskers
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(fx + 1, fy + 2); c.quadraticCurveTo(fx + 5, fy + 12, fx - 1, fy + 14); c.stroke();
    c.lineWidth = 2.4; c.beginPath(); c.moveTo(fx - 12, fy + 28); c.quadraticCurveTo(fx, fy + 20, fx + 12, fy + 27); c.stroke();
    c.lineWidth = 1.4; for (const [a, b] of [[[fx + 34, fy + 14], [fx + 80, fy + 6]], [[fx + 34, fy + 20], [fx + 78, fy + 26]], [[fx - 34, fy + 16], [fx - 74, fy + 10]], [[fx - 34, fy + 22], [fx - 72, fy + 28]]]) { c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); }
    c.restore();
  }

  // ---------- Snail, mouse ----------
  function snail(c, lt, t) {
    const x = 912 - 62 * lt, y = 1040, st = Math.sin(t * 6) * 4;
    c.save(); c.lineJoin = 'round';
    const body = new Path2D(); body.moveTo(x + 52, y + 26); body.lineTo(x - 54 - st, y + 26); body.quadraticCurveTo(x - 70 - st, y + 22, x - 62 - st, y + 6); body.quadraticCurveTo(x - 40, y + 4, x - 10, y + 12); body.lineTo(x + 52, y + 18); body.closePath();
    F(c, body, '#aab6cc', INK, 2.5);
    c.strokeStyle = INK; c.lineWidth = 2.4; const ex = x - 58 - st;
    for (const [dx, dy] of [[-12, -30], [2, -34]]) { const wob = Math.sin(t * 8 + dx) * 3; c.beginPath(); c.moveTo(ex + 4, y + 8); c.quadraticCurveTo(ex + dx * 0.5, y - 10, ex + dx + wob, y + dy); c.stroke(); dot(c, ex + dx + wob, y + dy, 3.5, INK, null); }
    const shell = new Path2D(); shell.arc(x + 4, y - 10, 34, 0, 7); F(c, shell, '#e3a447', INK, 3);
    c.strokeStyle = '#9a5a1a'; c.lineWidth = 3; c.beginPath(); for (let a = 0; a < 15; a += 0.2) { const r = 2 + a * 2.05; const px = x + 4 + Math.cos(a) * r, py = y - 10 + Math.sin(a) * r; a ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke();
    c.restore();
  }
  function runMouse(c, lt, t) {
    const q = clamp((lt - 0.12) / 1.05), x = lerp(1890, 1530, q), y = 898, leg = Math.sin(t * 40);
    c.save(); c.lineCap = 'round';
    c.fillStyle = 'rgba(80,50,20,.18)'; c.beginPath(); c.ellipse(x, y + 12, 30, 5, 0, 0, 7); c.fill();
    c.strokeStyle = '#3a2a24'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 22, y); c.bezierCurveTo(x + 50, y - 12 + Math.sin(t * 14) * 6, x + 60, y + 10, x + 82, y - 4 + Math.sin(t * 14 + 1) * 6); c.stroke();
    c.lineWidth = 3; c.beginPath(); c.moveTo(x - 10, y + 4); c.lineTo(x - 16 - leg * 7, y + 12); c.moveTo(x + 12, y + 4); c.lineTo(x + 16 + leg * 7, y + 12); c.stroke();
    const b = new Path2D(); b.ellipse(x, y - 2, 25, 12, 0, 0, 7); F(c, b, '#3e302c', INK, 1.5);
    const hd = new Path2D(); hd.moveTo(x - 14, y - 10); hd.quadraticCurveTo(x - 30, y - 8, x - 38, y + 2); hd.quadraticCurveTo(x - 24, y + 6, x - 12, y + 6); hd.closePath(); F(c, hd, '#3e302c', INK, 1.5);
    dot(c, x - 16, y - 13, 6, '#5a4640', INK, 1.2); dot(c, x - 30, y - 2, 1.6, '#fff', null);
    c.restore();
  }

  return {
    init() { STATIC(); MASK(); },
    draw(c, lt, t) {
      const ch = P.choreo(lt, t);
      c.drawImage(STATIC(), 0, 0);
      glassTwinkle(c, t);
      goldSweep(c, lt);
      SPARKS.forEach(([x, y], k) => { const n = nearSweep(x, y, lt); if (n > 0) glint(c, x, y, 0.4 + n * 0.8, n); });
      vines(c, t);
      snail(c, lt, t);
      runMouse(c, lt, t);
      const K = RIG.cat({ tail: ch.tail, blink: ch.blink, breathe: ch.breathe });
      cat(c, K, t, ch);
      const G = RIG.girl({ cup: ch.cup, sip: ch.sip, hair: 'long', breathe: ch.breathe });
      girl(c, G, lt, t, ch);
      // Aging: very faint grain
      c.drawImage(P.grain('goth', 0.05, [90, 60, 20], 0.16), 0, 0);
    },
  };
})();
