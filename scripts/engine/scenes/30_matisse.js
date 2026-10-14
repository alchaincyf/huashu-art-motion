// 1947 Matisse Jazz cutouts (Jazz / Polynesia / Icarus / Lagoon) — entirely procedural.
// Technique: everything cut from gouache-painted paper and pinned to wall:
//   ① cut shapes: procedural contours become scissor polylines (sample every 14–24px, jitter ±2.5px, connect with straight segments)
//   ② RIG Path2D points unavailable → low-frequency displacement of finished character layer (fbm wavelength ≈35px, amplitude 5px) gives hand-cut edges
//   ③ each sheet casts shadow (offset 5,6, blur 4, α.28) = pinned to wall
//   ④ gouache brush texture across image (cached long brush marks, overlay)
// Motifs: seaweed sways about roots and curls (scaleX breathing), Icarus yellow stars rotate/flicker, red heart beats, yellow paper tumbles down, white bird flaps.
SCENES['30_matisse'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2, { clamp, lerp } = U, P = PAINT;
  const C = { cobalt: '#1d4fb8', sky: '#4f95dc', yel: '#f7d21e', red: '#e2322a', black: '#141414', white: '#f7f3e8', green: '#1f9a5a', pink: '#ef6f9a', org: '#f28a24', orgD: '#c8521a', skin: '#f3c9a6', violet: '#5b3a9a' };
  const cut = P.cut;   // Scissor polyline: contour samples every step px, jitter, connect with straight lines
  // Seaweed shape (Matisse Lagoon/Polynesia): tapered stem with alternating rounded finger-like branches.
  // Every piece uses scissor polylines; same-winding subpaths filled together with nonzero give union (shadow calculated once too).
  function capsule(A, th, L, w) {               // th: angle relative to vertically upward
    const d = [Math.sin(th), -Math.cos(th)], n = [-d[1], d[0]], T = [A[0] + d[0] * (L - w / 2), A[1] + d[1] * (L - w / 2)], pts = [];
    pts.push([A[0] + n[0] * w * 0.42, A[1] + n[1] * w * 0.42]);
    pts.push([A[0] + d[0] * L * 0.5 + n[0] * w * 0.55, A[1] + d[1] * L * 0.5 + n[1] * w * 0.55]);
    for (let k = 0; k <= 6; k++) { const a = Math.atan2(n[1], n[0]) - k / 6 * Math.PI; pts.push([T[0] + Math.cos(a) * w / 2, T[1] + Math.sin(a) * w / 2]); }
    pts.push([A[0] + d[0] * L * 0.5 - n[0] * w * 0.55, A[1] + d[1] * L * 0.5 - n[1] * w * 0.55]);
    pts.push([A[0] - n[0] * w * 0.42, A[1] - n[1] * w * 0.42]);
    return pts;
  }
  function algaeShape(len, width, lobes, seed, bend) {
    const r = U.rng(seed), p = new Path2D(), sp = u => [Math.sin(u * 1.6) * bend * len * 0.25, -u * len];
    p.addPath(cut(capsule(sp(0), bend * 0.2, len, width * 0.24), seed, 16, 2));
    const n = Math.round(lobes * 2);
    for (let k = 0; k < n; k++) { const u = 0.12 + 0.78 * k / Math.max(1, n - 1), side = k % 2 ? 1 : -1, A = sp(u);
      const th = side * (1.05 - 0.55 * u) + bend * 0.2 + (r() - 0.5) * 0.25, L = width * (1.0 - 0.45 * u) * (0.8 + r() * 0.3), w = width * (0.34 - 0.12 * u);
      p.addPath(cut(capsule(A, th, L, w), seed + k * 11, 15, 1.8)); }
    return p;
  }
  const shapeCache = {};
  const algaePath = (k, len, width, lobes, bend) => shapeCache['a' + k] || (shapeCache['a' + k] = algaeShape(len, width, lobes, k * 7 + 3, bend));
  const starPath = (k, r0, r1, n) => shapeCache['s' + k] || (shapeCache['s' + k] = (() => { const r = U.rng(k * 31 + 5), pts = []; for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU + (r() - 0.5) * 0.25, rr = (i % 2 ? r1 : r0) * (0.75 + r() * 0.45); pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); } return cut(pts, k * 17, 14, 1.8); })());
  const birdPath = () => shapeCache.bird || (shapeCache.bird = cut([[0, 0], [-26, -14], [-58, -10], [-34, 2], [-62, 18], [-18, 10], [0, 22], [24, 8], [50, 12], [30, -2], [44, -18]], 99, 12, 1.6));
  const paperShadow = (c, fn) => { c.save(); c.shadowColor = 'rgba(10,20,40,.3)'; c.shadowOffsetX = 5; c.shadowOffsetY = 6; c.shadowBlur = 4; fn(); c.restore(); };
  const placed = (c, path, x, y, rot, sx, sy, col) => { c.save(); c.translate(x, y); c.rotate(rot); c.scale(sx, sy); c.fillStyle = col; c.fill(path); c.restore(); };

  // ---- Static base: two-blue checkerboard wall cutouts, floor, table (cached) ----
  const bg = () => P.cached('mt_bg', W, H, (g) => {
    g.fillStyle = C.white; g.fillRect(0, 0, W, H);
    const cw = 240, chh = 236;
    for (let j = 0; j < 3; j++) for (let i = 0; i < 8; i++) { const x = i * cw, y = j * chh, r = U.rng(i * 7 + j * 31);
      g.fillStyle = (i + j) % 2 ? C.cobalt : C.sky;
      g.fill(cut([[x - 2 + r() * 4, y - 2], [x + cw + 2, y + r() * 4 - 2], [x + cw + r() * 4, y + chh + 2], [x - 2, y + chh + r() * 4]], i * 13 + j, 22, 2)); }
    // Floor: emerald paper and black baseboard strip
    g.fillStyle = C.green; g.fill(cut([[0, 704], [W, 698], [W, H], [0, H]], 5, 24, 2.5));
    g.fillStyle = C.black; g.fill(cut([[0, 690], [W, 686], [W, 712], [0, 716]], 6, 20, 2));
    // Large pink disk and yellow paper scraps on floor (scattered Jazz cutouts)
    paperShadow(g, () => { g.fillStyle = C.pink; g.fill(cut(Array.from({ length: 24 }, (_, k) => [180 + Math.cos(k / 24 * TAU) * 120, 990 + Math.sin(k / 24 * TAU) * 44]), 8, 18, 3)); });
    // Window: Icarus blue background in white paper frame
    paperShadow(g, () => { g.fillStyle = C.white; g.fill(cut([[344, 114], [818, 118], [814, 568], [340, 564]], 11, 26, 2)); });
    g.fillStyle = C.cobalt; g.fill(cut([[372, 142], [790, 144], [788, 540], [370, 538]], 12, 24, 2));
    paperShadow(g, () => { g.fillStyle = C.white; g.fill(cut([[326, 550], [836, 552], [834, 584], [324, 582]], 13, 24, 2)); });
    // Table: black cutout top and two legs
    paperShadow(g, () => { g.fillStyle = C.black; g.fill(cut([[806, 616], [1212, 612], [1206, 648], [810, 652]], 14, 20, 2)); g.fill(cut([[846, 648], [872, 648], [878, 904], [842, 906]], 15, 20, 2)); g.fill(cut([[1150, 648], [1176, 648], [1182, 904], [1146, 906]], 16, 20, 2)); });
    // Chair: yellow cutout back
    paperShadow(g, () => { g.fillStyle = C.yel; g.fill(cut([[1430, 480], [1488, 470], [1500, 900], [1470, 902], [1462, 560], [1442, 560], [1446, 902], [1420, 902]], 17, 18, 2)); });
  });
  // Gouache brushstroke overlay
  const gouache = () => P.cached('mt_gouache', W, H, (g) => {
    const r = U.rng(2024); g.lineCap = 'round';
    for (let i = 0; i < 2600; i++) { const x = r() * W, y = r() * H, a = -0.25 + (r() - 0.5) * 0.5, L = 60 + r() * 240;
      g.strokeStyle = r() < 0.5 ? `rgba(255,255,255,${0.05 + r() * 0.07})` : `rgba(0,0,0,${0.04 + r() * 0.06})`; g.lineWidth = 6 + r() * 16;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
  });
  // Static hand-cut displacement field for character layer
  const BX = [330, 470, 1600, 980];   // x0,y0,x1,y1 (cat, tabletop, girl)
  const roughen = layer => P.roughen(layer, BX, { freq: 0.028, amp: 9, key: 'matisse' });   // Whole-layer low-frequency displacement = hand-cut edges

  // ---- Animated cutout motifs ----
  const ALGAE = [ // x,y(root), length, width, leaf count, bend, color, phase
    [110, 690, 400, 150, 3.5, 0.4, C.white, 0], [1600, 690, 440, 160, 4, -0.4, C.white, 1.3], [1810, 690, 300, 130, 3, 0.3, C.yel, 2.1],
    [250, 470, 230, 110, 2.5, -0.3, C.white, 3.1], [1010, 540, 280, 120, 3, 0.3, C.pink, 0.7], [1780, 440, 200, 100, 2.5, 0.3, C.white, 2.6],
  ];
  function wallLife(c, t) {
    ALGAE.forEach(([x, y, len, wd, lobes, bend, col, ph], k) => {
      const rot = Math.sin(t * 2.8 + ph) * 0.13, sx = 0.93 + 0.07 * Math.sin(t * 3.6 + ph * 1.7);   // Sway and edge curl
      paperShadow(c, () => placed(c, algaePath(k, len, wd, lobes, bend), x, y, rot, sx, 1, col));
    });
    // White bird (Polynesia) flaps and glides past
    [[1220, 120, 0], [190, 160, 1.7]].forEach(([x0, y0, ph], k) => { const x = x0 + Math.sin(t * 1.2 + ph) * 40, y = y0 + Math.sin(t * 2.4 + ph) * 12, fl = 0.55 + 0.45 * Math.cos(t * 13 + ph);
      paperShadow(c, () => placed(c, birdPath(), x, y, -0.15 + Math.sin(t * 2 + ph) * 0.08, 1.5, 1.5 * fl, C.white)); });
  }
  function icarus(c, t) {
    c.save(); c.beginPath(); c.rect(372, 142, 418, 398); c.clip();
    // Yellow stars: rotate and flicker
    [[420, 190, 34, 0], [740, 200, 42, 1], [460, 470, 30, 2], [752, 452, 36, 3], [560, 180, 22, 4], [700, 330, 26, 5], [410, 340, 24, 6]].forEach(([x, y, r, k]) => {
      const s = 0.82 + 0.22 * Math.sin(t * 7 + k * 1.9); placed(c, starPath(k, r, r * 0.42, 5 + (k % 3)), x, y, t * (k % 2 ? 0.8 : -0.6), s, s, C.yel); });
    // Icarus: black human shape, outstretched arms, floating vertically
    const by = Math.sin(t * 2.4) * 10, ax = Math.sin(t * 3.1) * 0.12;
    c.save(); c.translate(580, 340 + by); c.rotate(-0.08 + Math.sin(t * 1.7) * 0.05); c.fillStyle = C.black;
    c.fill(shapeCache.icarus || (shapeCache.icarus = cut([[0, -118], [18, -112], [22, -90], [12, -78], [44, -70], [96, -94], [118, -84], [64, -40], [40, -20], [52, 40], [86, 110], [66, 118], [26, 60], [6, 40], [-18, 64], [-48, 118], [-70, 108], [-36, 40], [-40, -20], [-66, -42], [-118, -76], [-100, -92], [-44, -70], [-12, -78], [-22, -92], [-18, -112]], 77, 14, 1.8)));
    const hb = 1 + 0.18 * Math.max(0, Math.sin(t * 9)); c.fillStyle = C.red; c.beginPath(); c.ellipse(6, -44, 14 * hb, 13 * hb, 0, 0, TAU); c.fill();   // Red heartbeat
    c.restore();
    c.restore();
  }
  function fallingPaper(c, t) {
    // Yellow paper tumbles from upper left to lower right (scaleX=cos flips it)
    const q = (t * 0.32 + 0.15) % 1, x = lerp(130, 320, q) + Math.sin(t * 3) * 60, y = lerp(-60, 640, q), fl = Math.cos(t * 6);
    paperShadow(c, () => placed(c, algaePath(20, 110, 60, 2.5, 0.2), x, y, t * 1.4, fl, 1, C.pink));
  }

  // ---- Characters ----
  function chars(g, t, ch, G, K) {
    RIG.drawCat(g, K, { lw: 0, orange: C.org, white: C.white, stripe: C.orgD, stripeW: 12, earInner: C.pink,
      face: (c, K) => { K.eyes.forEach(e => { c.fillStyle = K.blink ? C.orgD : C.green; c.beginPath(); c.ellipse(e.x, e.y, 10, K.blink ? 3 : 9, 0, 0, TAU); c.fill(); if (!K.blink) { c.fillStyle = C.black; c.beginPath(); c.ellipse(e.x + 2, e.y, 3, 7, 0, 0, TAU); c.fill(); } });
        c.fillStyle = C.pink; c.beginPath(); c.moveTo(K.nose[0] - 7, K.nose[1] - 4); c.lineTo(K.nose[0] + 7, K.nose[1] - 4); c.lineTo(K.nose[0], K.nose[1] + 6); c.fill(); } });
    // Girl: Matisse's Romanian Blouse — white embroidered wide-sleeved blouse, long red skirt, black belt
    RIG.drawGirl(g, G, { lw: 0, line: '#111', locks: false, skin: C.skin, hair: C.yel, dress: C.white, skirt: C.red, sleeve: C.white, cuff: C.white, shoe: C.black, cupBody: C.yel, cupRim: C.orgD,
      features: (c, G) => { c.fillStyle = C.black; c.beginPath(); c.ellipse(G.eye.x - 1, G.eye.y + 1, 7, ch.blink ? 1.5 : 4, 0, 0, TAU); c.fill();
        c.save(); c.translate(0, -3); c.strokeStyle = C.black; c.lineWidth = 3.5; c.stroke(G.brow); c.restore();
        c.fillStyle = C.red; c.beginPath(); c.moveTo(...G.lips[0]); c.lineTo(...G.lips[1]); c.lineTo(...G.lips[2]); c.closePath(); c.fill(); c.fillStyle = C.pink; c.beginPath(); c.arc(G.cheek[0], G.cheek[1], 10, 0, TAU); c.fill(); },
      hooks: {
        skirt: (c, G) => { c.fillStyle = C.black; const w = G.A.waist; c.fillRect(w[0] - 70, w[1] - 14, 150, 22); },
        torso: (c, G) => { // Vertical front embroidery band: alternating small red and blue triangles
          const ch0 = G.A.chest; c.fillStyle = C.cobalt; c.fillRect(ch0[0] - 6, ch0[1] - 60, 18, 150);
          for (let i = 0; i < 9; i++) { c.fillStyle = i % 2 ? C.red : C.yel; c.beginPath(); c.moveTo(ch0[0] - 6, ch0[1] - 56 + i * 16); c.lineTo(ch0[0] + 12, ch0[1] - 48 + i * 16); c.lineTo(ch0[0] - 6, ch0[1] - 40 + i * 16); c.fill(); } },
        head: (c, G) => { // Curly golden hair: ring of cutout curls
          const h = G.A.headC; c.fillStyle = C.yel; [[60, -40, 30], [82, 4, 28], [70, 46, 26], [30, -64, 26], [-8, -66, 22]].forEach(([dx, dy, r]) => { c.beginPath(); c.arc(h[0] + dx, h[1] + dy, r, 0, TAU); c.fill(); }); },
        arm: (c, G) => { // Horizontal sleeve embroidery bands (follow arm)
          const S = G.A.shoulder, E = G.A.elbow; c.save(); c.clip(G.upperArm);
          const a = Math.atan2(E[1] - S[1], E[0] - S[0]); [0.25, 0.45].forEach((q, k) => { const x = lerp(S[0], E[0], q), y = lerp(S[1], E[1], q); c.save(); c.translate(x, y); c.rotate(a + Math.PI / 2);
            c.fillStyle = k ? C.cobalt : C.red; c.fillRect(-40, -8, 80, 16); c.fillStyle = C.yel; for (let i = -3; i <= 3; i++) { c.beginPath(); c.arc(i * 11, 0, 4, 0, TAU); c.fill(); } c.restore(); });
          c.restore(); } } });
  }

  return {
    draw(c, lt, t) {
      const ch = P.choreo(lt, t);
      c.drawImage(bg(), 0, 0);
      icarus(c, t);
      wallLife(c, t);
      // Tabletop: white teapot and bowl of yellow lemons (cutouts)
      paperShadow(c, () => { c.fillStyle = C.white; c.fill(shapeCache.pot || (shapeCache.pot = cut([[860, 616], [850, 584], [866, 556], [906, 548], [944, 556], [958, 588], [950, 616]], 51, 14, 1.8))); c.fill(shapeCache.spout || (shapeCache.spout = cut([[856, 590], [822, 560], [832, 552], [868, 578]], 52, 10, 1.4)));
        c.fillStyle = C.yel; [[1040, 596], [1072, 592], [1056, 572]].forEach(([x, y], k) => { c.beginPath(); c.ellipse(x, y, 20, 15, 0.3 * k, 0, TAU); c.fill(); }); });
      const G = RIG.girl({ cup: ch.cup, sip: ch.sip, hair: 'bun', breathe: ch.breathe, dy: Math.sin(t * 8) * 1.5 });
      const K = RIG.cat({ tail: ch.tail, blink: ch.blink, breathe: ch.breathe });
      const L = P.scratch('mtChars'), lg = L.getContext('2d', { willReadFrequently: true }); lg.reset();
      chars(lg, t, ch, G, K);
      roughen(L);
      paperShadow(c, () => c.drawImage(L, 0, 0));
      // Steam: two white cutout tendrils
      const cp = G.cup; [0, 1].forEach(k => { const sw = Math.sin(t * 5 + k * 2) * 0.25; paperShadow(c, () => placed(c, algaePath(30 + k, 70, 16, 1.5, 0.6), cp.x - 8 + k * 18, cp.y - 10, sw, 1, 1, C.white)); });
      fallingPaper(c, t);
      c.save(); c.globalCompositeOperation = 'overlay'; c.drawImage(gouache(), 0, 0); c.restore();
      // Counter backing: white paper scrap
      paperShadow(c, () => { c.fillStyle = C.white; c.fill(shapeCache.lab || (shapeCache.lab = cut([[1500, 44], [1892, 38], [1888, 214], [1504, 208]], 61, 26, 2.2))); });
    },
  };
})();
