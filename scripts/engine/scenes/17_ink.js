// Chinese expressive ink painting (Bada Shanren / Qi Baishi) — pure code.
// Pipeline: ① cached xuan paper → ② pale mountains + vermilion sun (wash layer) → ③ dry-brush window/table → ④ bamboo (dark grouped leaves swaying)
//      → ⑤ swimming Qi Baishi shrimp in scroll → ⑥ cat: boneless ochre washes + reserved white + dry-dark ink spots, Bada upward eyes
//      → ⑦ girl: pale indigo hanfu + gamboge hair + fine-line face → ⑧ steam, seal
// Paint-on opening: lt 0→0.45 reveals strokes in order and spreads washes; washes then expand slowly as ink bleeds into paper.
SCENES['17_ink'] = (() => {
  const W = 1920, H = 1080, { clamp, lerp, rng, ease } = U, P = PAINT;
  const { ss } = U;

  // ---------- Xuan paper ----------
  const paper = () => P.cached('ink_paper', W, H, (g) => {
    g.drawImage(P.texture('xuan', '#efe6d0', { scale: 0.0025, amt: 9, grain: 7, seed: 5 }), 0, 0);
    const r = rng(41);
    g.lineCap = 'round';
    for (let i = 0; i < 2600; i++) {               // Paper fibers: short arcs, mixed light/dark
      const x = r() * W, y = r() * H, a = r() * Math.PI * 2, l = 6 + r() * 26;
      g.strokeStyle = r() < 0.5 ? `rgba(150,125,90,${0.05 + r() * 0.08})` : `rgba(255,252,240,${0.12 + r() * 0.15})`;
      g.lineWidth = 0.6 + r() * 0.8; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.6) * l * 0.5, y + Math.sin(a + 0.6) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    const vg = g.createRadialGradient(W / 2, H / 2, 500, W / 2, H / 2, 1250); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(120,90,50,.22)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  });

  // Library strokes/leaves/washes: P.brush (dry-brush gaps), P.leaf (one stroke tapered both ends), P.inkWash (spreading ink)
  const brush = P.brush, leaf = P.leaf;
  const washLayer = (c, key, grow, fn, o) => P.inkWash(c, 'ink_' + key, grow, fn, o);

  // ---------- Static stroke table (window, table, ground) ----------
  const WIN = [
    { p: [[338, 116], [520, 112], [700, 118], [824, 114]], w: 16, d: 0.06, l: 0.18, dry: 0.55 },
    { p: [[352, 104], [348, 300], [356, 470], [350, 578]], w: 15, d: 0.1, l: 0.16, dry: 0.5 },
    { p: [[808, 108], [812, 330], [806, 572]], w: 14, d: 0.14, l: 0.16, dry: 0.6 },
    { p: [[318, 572], [560, 566], [842, 574]], w: 18, d: 0.18, l: 0.16, dry: 0.45 },
    { p: [[372, 140], [420, 140], [420, 186]], w: 4, d: 0.22, l: 0.08, dry: 0.3 }, { p: [[788, 140], [740, 140], [740, 186]], w: 4, d: 0.24, l: 0.08, dry: 0.3 },
    { p: [[372, 546], [420, 546], [420, 500]], w: 4, d: 0.26, l: 0.08, dry: 0.3 }, { p: [[788, 546], [740, 546], [740, 500]], w: 4, d: 0.28, l: 0.08, dry: 0.3 },
  ];
  const TABLE = [
    { p: [[800, 622], [1000, 614], [1212, 620]], w: 22, d: 0.12, l: 0.15, dry: 0.5 },
    { p: [[820, 640], [1000, 646], [1196, 640]], w: 7, d: 0.2, l: 0.1, dry: 0.4 },
    { p: [[842, 640], [846, 760], [838, 906]], w: 13, d: 0.18, l: 0.16, dry: 0.65 },
    { p: [[1176, 640], [1172, 780], [1182, 906]], w: 13, d: 0.22, l: 0.16, dry: 0.65 },
    { p: [[848, 664], [900, 690], [960, 676]], w: 5, d: 0.26, l: 0.1, dry: 0.4 }, { p: [[1170, 664], [1118, 690], [1058, 676]], w: 5, d: 0.28, l: 0.1, dry: 0.4 },
    { p: [[300, 912], [700, 904], [1100, 914], [1520, 908]], w: 5, d: 0.3, l: 0.15, dry: 0.85, tone: 0.35 },
  ];
  const SKIRT = [
    { p: [[1244, 630], [1190, 656], [1150, 722], [1118, 820], [1104, 926]], w: 6, dry: 0.3 },
    { p: [[1420, 612], [1446, 650], [1452, 722], [1440, 762], [1366, 774], [1344, 806], [1352, 926]], w: 6, dry: 0.4 },
    { p: [[1104, 928], [1220, 934], [1352, 928]], w: 5, dry: 0.6 },
    { p: [[1232, 668], [1222, 760], [1226, 815]], w: 4, dry: 0.3 }, { p: [[1268, 668], [1262, 760], [1270, 840]], w: 4, dry: 0.3 },
    { p: [[1160, 770], [1150, 860], [1146, 920]], w: 4, dry: 0.4 }, { p: [[1302, 830], [1308, 880], [1300, 925]], w: 4, dry: 0.4 },
    { p: [[1350, 434], [1382, 448], [1406, 486], [1418, 546], [1424, 604]], w: 6, dry: 0.35 },
  ];

  // ---------- Distant mountains, vermilion sun ----------
  function mountains(g) {
    g.save(); g.beginPath(); g.rect(366, 132, 428, 428); g.clip();
    const R1 = rng(3);
    const ridge = (y0, amp, f, seed) => { const pts = []; for (let x = 340; x <= 830; x += 10) pts.push([x, y0 - amp * (0.5 + 0.5 * P.fbm(x * f + seed, seed, 3)) - amp * 0.6 * Math.exp(-Math.pow((x - 560 - seed * 40) / 120, 2))]); return pts; };
    const fill = (pts, a, y1) => { const gr = g.createLinearGradient(0, Math.min(...pts.map(p => p[1])), 0, y1); gr.addColorStop(0, `rgba(40,40,44,${a})`); gr.addColorStop(1, 'rgba(40,40,44,0)'); g.fillStyle = gr; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.lineTo(830, y1); g.lineTo(340, y1); g.closePath(); g.fill(); };
    fill(ridge(380, 120, 0.006, 1), 0.32, 520); fill(ridge(450, 90, 0.009, 2.4), 0.5, 560);
    g.restore();
  }

  // ---------- Bamboo (diagonally from upper-right, before window) ----------
  function bamboo(c, t, rev) {
    const sw = Math.sin(t * 2.9) * 0.11 + Math.sin(t * 6.1 + 1) * 0.025;
    const base = [835, 70];
    const rot = (x, y, k) => { const a = sw * k, dx = x - base[0], dy = y - base[1]; return [base[0] + dx * Math.cos(a) - dy * Math.sin(a), base[1] + dx * Math.sin(a) + dy * Math.cos(a)]; };
    // Pale main branch: segmented strokes with white joints
    const nodes = [[835, 70], [760, 150], [690, 215], [620, 268], [550, 312]];
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = rot(...nodes[i], i / 4), b = rot(...nodes[i + 1], (i + 1) / 4);
      const q0 = 0.04, A = [lerp(a[0], b[0], q0), lerp(a[1], b[1], q0)], B = [lerp(a[0], b[0], 0.94), lerp(a[1], b[1], 0.94)];
      brush(c, [A, [lerp(A[0], B[0], .5), lerp(A[1], B[1], .5)], B], { w: 9, tone: 0.5, dry: 0.3, seed: 60 + i, reveal: ss(0.08 + i * 0.03, 0.18 + i * 0.03, rev), head: 0.06, tail: 0.1, bristles: 5 });
    }
    // Dark leaves in ge/jie-shaped groups
    const groups = [[2, -0.2, 0], [3, 0.4, 1], [4, -0.9, 2], [3, 2.2, 3], [4, 0.9, 4]];
    groups.forEach(([ni, a0, gi]) => {
      const np = nodes[Math.min(nodes.length - 1, ni)];
      const p = rot(np[0], np[1], ni / 4); const flut = Math.sin(t * 7 + gi * 1.3) * 0.2;
      const rv = ss(0.2 + gi * 0.04, 0.3 + gi * 0.04, rev); if (rv <= 0) return;
      [[0, 1], [0.45, 0.82], [-0.42, 0.78]].forEach(([da, ls], k) => leaf(c, p[0], p[1], a0 + 1.4 + da + flut * (1 + k * 0.4) + sw * 2, 110 * ls * rv, 15, 0.86));
    });
  }

  // ---------- Hanging scroll + Qi Baishi shrimp ----------
  function scrollStatic(g) {
    g.fillStyle = 'rgba(170,140,95,.32)'; g.fillRect(1560, 240, 230, 640);           // Silk border
    g.fillStyle = 'rgba(250,246,234,.9)'; g.fillRect(1580, 290, 190, 540);
    g.fillStyle = 'rgba(60,40,25,.85)'; g.fillRect(1548, 870, 254, 16); g.fillRect(1556, 232, 238, 10);
    g.strokeStyle = 'rgba(60,40,25,.6)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(1640, 232); g.lineTo(1675, 196); g.lineTo(1710, 232); g.stroke();
    g.fillStyle = '#c23a2b'; g.fillRect(1742, 788, 16, 16);
  }
  function shrimp(c, x, y, ang, s, t, ph) {
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
    const flex = Math.sin(t * 7 + ph) * 0.12;
    // Body: six pale ink arcs, bent head-to-tail
    let px = 0, py = 0, a = 0; const segs = [];
    for (let i = 0; i < 6; i++) { a += 0.2 + flex; const l = 13 - i * 1.2; px += Math.cos(a) * l; py += Math.sin(a) * l; segs.push([px, py, a, 11 - i * 1.3]); }
    segs.forEach(([sx, sy, sa, sw], i) => { c.fillStyle = `rgba(30,28,26,${0.22 + i * 0.03})`; c.beginPath(); c.ellipse(sx, sy, 9, sw * 1.05, sa + 0.25, 0, Math.PI * 2); c.fill(); c.strokeStyle = 'rgba(20,18,16,.3)'; c.lineWidth = 2.4; c.beginPath(); c.ellipse(sx, sy, 9, sw * 1.05, sa + 0.25, -1.2, 1.2); c.stroke(); });
    const tl = segs[5]; [-0.5, 0, 0.5].forEach(d => leaf(c, tl[0], tl[1], tl[2] + d + 0.4, 15, 6, 0.4));
    // Carapace: pale wash + central dark-dry stroke
    c.fillStyle = 'rgba(30,28,26,.33)'; c.beginPath(); c.ellipse(-10, -2, 17, 10, -0.15, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(10,10,10,.9)'; c.beginPath(); c.ellipse(-8, -3, 7, 3.2, -0.2, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(-24, -8, 2.6, 0, Math.PI * 2); c.arc(-23, -1, 2.6, 0, Math.PI * 2); c.fill();
    // Waving antennae: two long, two short
    c.strokeStyle = 'rgba(10,10,10,.8)'; c.lineWidth = 1.1;
    [[-1, 120, 0.9], [1, 105, 1.4], [-1, 40, 2.1], [1, 36, 2.8]].forEach(([sg, L, q]) => { c.beginPath(); c.moveTo(-26, -4); for (let i = 1; i <= 12; i++) { const u = i / 12; c.lineTo(-26 - u * L, -4 + sg * u * L * 0.18 + Math.sin(t * 5 + q + u * 4) * 6 * u); } c.stroke(); });
    // Claws: three-segment arms + pincers
    [[-0.35, 0], [0.1, 1]].forEach(([da, k]) => { c.strokeStyle = 'rgba(10,10,10,.75)'; c.lineWidth = 1.6; const sw2 = Math.sin(t * 4 + k * 2 + ph) * 0.15; let qx = -20, qy = 4; c.beginPath(); c.moveTo(qx, qy);
      [[22, 2.4], [20, 2.6], [16, 2.9]].forEach(([l, aa]) => { qx += Math.cos(aa + da + sw2) * l; qy += Math.sin(aa + da + sw2) * l; c.lineTo(qx, qy); }); c.stroke();
      c.fillStyle = 'rgba(10,10,10,.82)'; c.beginPath(); c.ellipse(qx - 6, qy + 2, 8, 3, 2.9 + da, 0, Math.PI * 2); c.fill(); });
    // Legs
    c.strokeStyle = 'rgba(20,20,20,.5)'; c.lineWidth = 1; for (let i = 0; i < 5; i++) { const sg = segs[Math.min(4, i)]; c.beginPath(); c.moveTo(sg[0] - 2, sg[1] + 5); c.lineTo(sg[0] - 6 + Math.sin(t * 12 + i) * 2, sg[1] + 14); c.stroke(); }
    c.restore();
  }

  // ---------- Cat (boneless ochre + reserved white + dark ink spots + Bada eyes) ----------
  function catWash(g, K) {
    g.fillStyle = '#c47a3c'; g.fill(K.body); g.fill(K.head);
    g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#c47a3c'; g.lineWidth = K.tailW; g.stroke(K.tail);
    g.save(); g.globalCompositeOperation = 'destination-out'; g.fill(K.white); K.legs.forEach(l => g.fill(l));
    g.beginPath(); g.ellipse(K.nose[0] - 22, K.nose[1] + 12, 36, 26, 0, 0, Math.PI * 2); g.fill(); g.restore();
  }
  function catInk(c, K, t, rev) {
    const R_ = (pts, o) => brush(c, pts, { ...o, reveal: ss(o.d || 0, (o.d || 0) + 0.18, rev) });
    // Back/crown: a few dark-dry strokes
    const b = K.bodyPts;
    R_([b[5], b[4], b[3], b[2]], { w: 12, dry: 0.55, seed: 81, d: 0.12, tone: 0.9 });
    R_([b[2], b[1], b[0]], { w: 8, dry: 0.7, seed: 82, d: 0.18, tone: 0.75 });
    R_([b[6], b[7], b[8]], { w: 5, dry: 0.6, seed: 83, d: 0.2, tone: 0.55 });
    K.stripes.forEach((s, i) => R_([s[0], [(s[0][0] + s[1][0]) / 2 + 3, (s[0][1] + s[1][1]) / 2], s[1]], { w: i < 3 ? 9 : 13, dry: 0.4, seed: 90 + i, d: 0.2 + i * 0.015, tone: 0.92, head: 0.2, tail: 0.6, bristles: 5 }));
    if (rev < 0.25) return;
    c.save(); c.globalAlpha = ss(0.25, 0.4, rev);
    // Ears: two dark triangular strokes
    c.fillStyle = 'rgba(14,12,10,.9)'; K.earInner.forEach(e => { c.beginPath(); c.moveTo(...e[0]); c.lineTo(...e[1]); c.lineTo(...e[2]); c.closePath(); c.fill(); });
    // Head contour: one pale stroke
    c.strokeStyle = 'rgba(20,18,16,.55)'; c.lineWidth = 3; c.stroke(K.head);
    // Bada upward gaze: round sockets, pupils at top
    K.eyes.forEach((e, i) => { c.strokeStyle = 'rgba(10,10,10,.92)'; c.lineWidth = 2.6; c.beginPath(); c.ellipse(e.x, e.y, K.eyeR * 1.15, K.eyeR * (K.blink ? 0.15 : 1), 0, 0, Math.PI * 2); c.stroke();
      if (!K.blink) { c.fillStyle = 'rgba(8,8,8,.95)'; c.beginPath(); c.arc(e.x + 2.5, e.y - K.eyeR * 0.55 + Math.sin(t * 2) * 1.2, K.eyeR * 0.42, 0, Math.PI * 2); c.fill(); } });
    c.fillStyle = 'rgba(14,12,10,.9)'; c.beginPath(); c.ellipse(K.nose[0], K.nose[1], 6, 4, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(14,12,10,.8)'; c.lineWidth = 2; c.beginPath(); c.moveTo(...K.mouth[0]); c.quadraticCurveTo(...K.mouth[1], ...K.mouth[2]); c.stroke();
    K.whiskers.forEach((w, i) => brush(c, [w[0], [(w[0][0] + w[1][0]) / 2, (w[0][1] + w[1][1]) / 2 - 2], w[1]], { w: 2.4, dry: 0.5, bristles: 3, seed: 99 + i, tone: 0.8, head: 0.05, tail: 0.6 }));
    // Legs/paws: light ink outlines
    c.strokeStyle = 'rgba(20,18,16,.38)'; c.lineWidth = 2; K.legs.forEach(l => c.stroke(l));
    // Tail: dark-dry rings
    const tp = K.tailPts; [5, 9, 13, 17].forEach((i, k) => { const p = tp[i], q = tp[i + 1], a = Math.atan2(q[1] - p[1], q[0] - p[0]) + Math.PI / 2; brush(c, [[p[0] - Math.cos(a) * 12, p[1] - Math.sin(a) * 12], [p[0] + Math.cos(a) * 12, p[1] + Math.sin(a) * 12]], { w: 8, dry: 0.3, bristles: 4, seed: 120 + k, tone: 0.85 }); });
    c.restore();
  }

  // ---------- Girl ----------
  function sleeveShape(G) {
    const S = G.A.shoulder, E = G.A.elbow, Hd = G.A.hand;
    const Wr = [lerp(E[0], Hd[0], 0.8), lerp(E[1], Hd[1], 0.8)];
    const low = Math.max(S[1], E[1]) + 120;
    return RIG.smooth([[S[0] + 22, S[1] - 18], [S[0] - 26, S[1] - 6], [E[0] - 22, E[1] - 6], [Wr[0] - 16, Wr[1] - 14], [Wr[0] + 14, Wr[1] + 18], [Wr[0] + 20, Math.max(Wr[1] + 40, low - 30)], [lerp(Wr[0], E[0], 0.5) + 30, low], [E[0] + 40, low - 10], [S[0] + 40, S[1] + 70]]);
  }
  function girlWash(g, G) {
    g.fillStyle = '#6f8aa0'; [G.farSleeve, G.skirt, G.torso].forEach(p => g.fill(p));
    g.save(); g.globalCompositeOperation = 'destination-out'; g.fill(G.bib); g.restore();               // Reserve white crossed-collar undershirt
    g.fillStyle = '#7d97ab'; g.fill(sleeveShape(G));                                                       // Wide sleeves share boneless body wash, separated only by lines
  }
  function girlInk(c, G, t, rev, ch) {
    const A = G.A;
    SKIRT.forEach((s, i) => brush(c, s.p, { w: s.w, dry: s.dry, seed: 200 + i, tone: 0.78, reveal: ss(0.05 + i * 0.02, 0.25 + i * 0.02, rev), head: 0.08, tail: 0.5, bristles: 5 }));
    // Carmine belt with two moving tails (Qi Baishi's red accent)
    const wx = A.waist[0] - 40, wy = A.waist[1] - 8, sw = Math.sin(t * 3.4) * 10;
    brush(c, [[1300, wy - 4], [1360, wy], [1420, wy - 2]], { w: 14, dry: 0.25, seed: 230, col: [190, 40, 40], tone: 0.85, reveal: ss(0.25, 0.4, rev) });
    [[0, 0], [16, 1]].forEach(([o, k]) => brush(c, [[1400 + o, wy + 4], [1408 + o + sw * 0.4, wy + 70], [1404 + o + sw, wy + 150]], { w: 7, dry: 0.4, seed: 240 + k, col: [190, 40, 40], tone: 0.8, reveal: ss(0.3, 0.45, rev), tail: 0.6, bristles: 4 }));
    if (rev < 0.12) return;
    const al = ss(0.12, 0.32, rev);
    c.save(); c.globalAlpha = al;
    // Hair: gamboge wash + a few pale ink strands
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = 'rgba(226,170,52,.75)'; [G.hairBack, G.bun, G.bangs].forEach(p => p && c.fill(p));
    c.globalCompositeOperation = 'source-over';
    c.strokeStyle = 'rgba(70,50,20,.55)'; c.lineWidth = 1.6; G.hairLines.forEach(h => c.stroke(h));
    c.lineWidth = 1.4; c.strokeStyle = 'rgba(30,24,16,.7)'; c.stroke(G.hairBack); if (G.bun) c.stroke(G.bun);
    // Hairpin
    const bc = G.bunSpiral; c.strokeStyle = 'rgba(14,12,10,.9)'; c.lineWidth = 3.5; c.beginPath(); c.moveTo(bc[0] - 36, bc[1] - 26); c.lineTo(bc[0] + 30, bc[1] + 16); c.stroke();
    c.fillStyle = '#c0392b'; c.beginPath(); c.arc(bc[0] - 38, bc[1] - 28, 6, 0, Math.PI * 2); c.fill();
    // Fine-line face outline, paper-color reserve
    c.fillStyle = 'rgba(250,240,224,.9)'; c.fill(G.face); c.fillStyle = 'rgba(246,232,212,.85)'; c.fill(G.neck); c.strokeStyle = 'rgba(18,16,14,.6)'; c.lineWidth = 1.4; c.stroke(G.neck);
    c.strokeStyle = 'rgba(18,16,14,.85)'; c.lineWidth = 1.8; c.stroke(G.face);
    c.save(); c.clip(G.face); c.fillStyle = 'rgba(214,92,92,.16)'; c.filter = 'blur(5px)'; c.beginPath(); c.arc(G.cheek[0] - 4, G.cheek[1] + 2, 10, 0, Math.PI * 2); c.fill(); c.filter = 'none'; c.restore();
    c.fillStyle = 'rgba(226,170,52,.75)'; c.fill(G.bangs); c.strokeStyle = 'rgba(30,24,16,.6)'; c.lineWidth = 1.3; c.stroke(G.bangs);
    c.strokeStyle = 'rgba(12,10,8,.95)'; c.lineWidth = ch.blink ? 2 : 2.4; c.stroke(G.lid);
    if (!ch.blink) { c.fillStyle = 'rgba(12,10,8,.95)'; c.beginPath(); c.ellipse(G.eye.x - 1, G.eye.y + 1.5, 3, 3.6, 0, 0, Math.PI * 2); c.fill(); }
    c.lineWidth = 1.5; c.stroke(G.brow);
    c.fillStyle = '#b8322c'; c.beginPath(); c.arc(G.lips[0][0] + 3, G.lips[0][1] + 3, 3.2, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  function girlArm(c, G, rev) {
    const al = ss(0.12, 0.32, rev); if (al <= 0) return;
    c.save(); c.globalAlpha = al;
    // Wide sleeve: large hanging pale-indigo wash
    const sl = sleeveShape(G);
    c.strokeStyle = 'rgba(18,16,14,.7)'; c.lineWidth = 2.2; c.stroke(sl);
    // Fine-line hand
    c.fillStyle = 'rgba(250,240,224,.95)'; c.fill(G.hand); c.strokeStyle = 'rgba(18,16,14,.8)'; c.lineWidth = 1.6; c.stroke(G.hand);
    // White porcelain cup with blue decoration band
    const cp = G.cup; c.save(); c.translate(cp.x, cp.y); c.rotate(cp.tilt);
    c.beginPath(); c.moveTo(-cp.w / 2, 0); c.lineTo(-cp.w * 0.36, cp.h * 0.9); c.lineTo(cp.w * 0.36, cp.h * 0.9); c.lineTo(cp.w / 2, 0); c.closePath();
    c.fillStyle = 'rgba(252,250,244,.96)'; c.fill(); c.strokeStyle = 'rgba(18,16,14,.85)'; c.lineWidth = 1.8; c.stroke();
    c.strokeStyle = 'rgba(40,70,140,.75)'; c.lineWidth = 4; c.beginPath(); c.moveTo(-cp.w * 0.45, cp.h * 0.28); c.lineTo(cp.w * 0.45, cp.h * 0.28); c.stroke();
    c.restore();
    c.fillStyle = 'rgba(250,240,224,.95)'; c.beginPath(); c.arc(G.thumb[0], G.thumb[1], 6.5, 0, Math.PI * 2); c.fill(); c.strokeStyle = 'rgba(18,16,14,.8)'; c.lineWidth = 1.4; c.stroke();
    c.restore();
  }

  return {
    draw(c, lt, t) {
      lt += 0.12;                                          // Avoid blank opening: first strokes already present at frame 0
      const ch = KIT.choreo(lt, t);
      const rev = clamp(lt / 0.45);                       // Paint-on opening
      const grow = ss(0, 1.15, lt);                        // Expanding ink wash
      c.drawImage(paper(), 0, 0);
      // Mountain + vermilion sun washes
      washLayer(c, 'mtn', ss(0, 0.3, lt) * (0.6 + 0.4 * grow), mountains, { blur: 3, halo: 14, haloA: 0.3 });
      c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = ss(0.1, 0.3, lt); c.filter = `blur(${2 + grow * 3}px)`; c.fillStyle = '#d8553f'; c.beginPath(); c.arc(700, 230, 30 + grow * 3, 0, Math.PI * 2); c.fill(); c.filter = 'none'; c.restore();
      // Paper-colored horizontal mist wash drifts left, intermittently hides mountains
      c.save(); c.beginPath(); c.rect(366, 132, 428, 428); c.clip(); c.filter = 'blur(14px)';
      [[420, 46, 0], [500, 34, 1], [330, 28, 2], [460, 30, 3]].forEach(([y, h, k]) => { const x = 900 - ((lt * (150 + k * 40) + k * 230) % 900); c.fillStyle = `rgba(242,234,214,${0.72 * ss(0.15, 0.4, lt)})`; c.beginPath(); c.ellipse(x, y, 230, h, 0, 0, Math.PI * 2); c.fill(); });
      c.filter = 'none'; c.restore();
      // Small Bada-style bird outside (two wing strokes, flap every 0.12s)
      if (lt > 0.25) { const bx = 820 - (lt - 0.25) * 420, by = 470 - Math.sin(lt * 3) * 26, fl = Math.sin(lt * 52) ;
        c.save(); c.beginPath(); c.rect(366, 132, 428, 428); c.clip(); c.fillStyle = 'rgba(14,12,10,.9)';
        c.beginPath(); c.ellipse(bx, by, 11, 6, -0.2, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(bx - 11, by - 4, 5, 0, Math.PI * 2); c.fill();
        leaf(c, bx - 2, by - 2, -1.2 - fl * 0.7, 28, 9, 0.9); leaf(c, bx + 4, by - 1, -0.5 - fl * 0.5, 24, 8, 0.75);
        c.fillStyle = '#f2ead6'; c.beginPath(); c.arc(bx - 13, by - 5, 2, 0, Math.PI * 2); c.fill(); c.restore(); }
      // Static strokes cached once fully revealed
      const stat = (c2, rv) => { WIN.forEach((s, i) => brush(c2, s.p, { w: s.w, dry: s.dry, seed: 10 + i, reveal: ss(s.d, s.d + s.l, rv), tone: s.tone || 0.88 })); TABLE.forEach((s, i) => brush(c2, s.p, { w: s.w, dry: s.dry, seed: 30 + i, reveal: ss(s.d, s.d + s.l, rv), tone: s.tone || 0.88 })); };
      if (rev < 1) stat(c, rev); else c.drawImage(P.cached('ink_static', W, H, g => stat(g, 1)), 0, 0);
      bamboo(c, t, rev);
      // Scroll + three shrimp swimming individual arcs
      c.save(); c.globalAlpha = ss(0.15, 0.35, lt); scrollStatic(c);
      c.beginPath(); c.rect(1580, 290, 190, 540); c.clip();
      [[1716, 450, 0.5, 0], [1700, 700, 1.4, 1]].forEach(([x, y, a0, k]) => { const u = lt * 1.6 + k * 2; shrimp(c, x - 26 * Math.sin(u * 1.5) - lt * 40, y + Math.sin(u * 2) * 16 - lt * 30, -0.35 + a0 * 0.1 + Math.sin(u * 1.5) * 0.18, 1.45, t, k * 2); });
      c.restore();
      // Cat: ochre wash → dark-dry ink
      const K = RIG.cat({ tail: ch.tail, blink: ch.blink, breathe: ch.breathe });
      c.save(); const ks = new Path2D(); ks.addPath(K.body); ks.addPath(K.head); c.clip(ks); c.drawImage(paper(), 0, 0); c.restore();   // Restore paper beneath cat first so sill ink does not show through ochre
      washLayer(c, 'cat', ss(0.02, 0.3, lt) * (0.7 + 0.3 * grow), g => catWash(g, K), { blur: 2.5, halo: 9, haloA: 0.28, alpha: 0.78 });
      catInk(c, K, t, rev);
      // Girl: pale indigo → fine outlines/folds
      const G = RIG.girl({ cup: ch.cup, sip: ch.sip, breathe: ch.breathe, hair: 'bun' });
      c.save(); const gs = new Path2D(); [G.skirt, G.torso, G.farSleeve].forEach(p => gs.addPath(p)); c.clip(gs); c.drawImage(paper(), 0, 0); c.restore();   // Prevent table legs/top showing through dress
      washLayer(c, 'girl', ss(0.0, 0.3, lt) * (0.7 + 0.3 * grow), g => girlWash(g, G), { blur: 2.5, halo: 12, haloA: 0.24, alpha: 0.6 });
      girlInk(c, G, t, rev, ch);
      girlArm(c, G, rev);
      // Steam: two pale ink filaments
      if (lt > 0.3) { c.save(); c.globalAlpha = ss(0.3, 0.5, lt);
        [0, 1].forEach(k => { const pts = []; for (let i = 0; i <= 8; i++) { const q = i / 8; pts.push([G.cup.x - 8 + k * 14 + Math.sin(t * 3.5 + q * 5 + k * 2) * 10 * q - q * 40 * ch.cup, G.cup.y - 8 - q * 80]); } brush(c, pts, { w: 3, dry: 0.7, bristles: 3, seed: 300 + k + P.boilSeed(t, 10), tone: 0.45, head: 0.05, tail: 0.8 }); });
        c.restore(); }
    },
    label(c, lt) {
      const a = ss(0.0, 0.25, lt);
      KIT.label(c, { title: '水墨写意', sub: '八大山人 · 齐白石', tFont: '80px "LXGWWenKai-500"', sFont: '30px "LXGWWenKai-500"', tCol: `rgba(14,12,10,${0.92 * a})`, sCol: `rgba(40,34,28,${0.85 * a})`, spacing: 6 });
      // Raised-script square seal “白石”, stamped at 0.32s (enlarged then pressed, slight ink bleed)
      const q = ss(0.3, 0.4, lt); if (q <= 0) return;
      const s = 1.5 - 0.5 * ease.out(q);
      const seal = P.cached('ink_seal', 80, 80, g => { g.translate(40, 40);
        g.fillStyle = '#c4281e'; g.fillRect(-34, -34, 68, 68);
        g.globalCompositeOperation = 'destination-out'; g.font = '30px "LXGWWenKai-500"'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('白', 0, -14); g.fillText('石', 0, 16);
        const r = rng(7); for (let i = 0; i < 40; i++) g.fillRect(-34 + r() * 68, -34 + r() * 68, 1 + r() * 3, 1 + r() * 2);   // Mottled seal face
      });
      c.save(); c.translate(1500, 98); c.scale(s, s); c.globalAlpha = Math.min(1, q * 1.6); c.globalCompositeOperation = 'multiply';
      c.drawImage(seal, -40, -40); c.restore();
    },
  };
})();
