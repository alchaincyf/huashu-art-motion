// 79 AD Pompeian mosaic (opus tessellatum / vermiculatum) — pure code.
// Pipeline: ① flat-color underpainting (cache static parts; redraw girl/cat/volcanic smoke/border scrolls each frame)
//      →② custom mosaic renderer: compute tile layout once at init — place tiles along distance-field isolines (contour-following andamento),
//        regular rows farther away; each tile is a rotated square with independently jittered edges, rasterized into an ID map with weighted L∞ Voronoi; neighboring tiles naturally leave grout gaps;
//        precompute per-pixel bevel shading (upper-left light) + stone grain
//      →③ each frame, recolor only dynamic rectangles (girl, cat, volcano image, border), sampling underpainting at tile centers — tiles stay fixed while colors flow between them.
SCENES['04_roman'] = (() => {
  const W = 1920, H = 1080, { clamp, lerp, rng } = U, P = PAINT;
  const BW = 84;                                       // Outer wave-pattern border width
  const C = {
    wall: '#e4ddcd', halo: '#f5f1e8', outline: '#46322a',
    floor: '#dac9a0', floorLine: '#8f6c40',
    bW: '#ece6d8', bK: '#24201d',
    red: '#a8322a', red2: '#7c221d', gold: '#d0a23c', gold2: '#9f7420',
    sky: '#9ec0d8', sky2: '#d3e3e4', cloud: '#88847d', cloud2: '#a9a49b',
    cone: '#4e5796', coneL: '#7c84b8', coneD: '#2f3672', ridge: '#373e7c', green: '#6f9341', green2: '#92b254', ground: '#cba344', ground2: '#a67d2a',
    cyp: '#2b5a2f', cyp2: '#4b7c3c', lava: '#d64a22', lava2: '#f2952c',
    table: '#7f95ab', tableHi: '#aebfcd', tableD: '#5d7288',
    chair: '#c69c3c', amph: '#b4472e', amphHi: '#d66c4a', amphD: '#7e2c1e',
    stola: '#efe7d5', stolaF: '#cbbd9c', skin: '#efc4a0', hair: '#dcaa42', hairD: '#9c6c1c', lip: '#b8433a', eye: '#2a2420',
    catO: '#dc8530', catO2: '#c06a24', catS: '#9c4818', catW: '#f7f2e8', catEye: '#e9c22c', collar: '#b02a22',
  };
  // Tile classes: size / contour-following ring count (99=all) / color jitter
  const K_WALL = 0, K_HALO = 1, K_FIG = 2, K_FACE = 3, K_HAIR = 4, K_PIC = 5, K_FRAME = 6, K_BORDER = 7, K_TEXT = 8, K_FLOOR = 9, K_OBJ = 10, K_CAT = 11;
  const SZ = [12, 11, 10, 5, 8, 9, 9, 7.6, 7, 13, 10, 9];
  const KR = [1, 9, 99, 99, 99, 2, 99, 0, 99, 1, 99, 99];
  const JIT = [.08, .05, .05, .04, .05, .06, .05, .05, .05, .065, .05, .05];

  // ---------- Static object paths ----------
  const rectP = (x, y, w, h) => { const p = new Path2D(); p.rect(x, y, w, h); return p; };
  const FRAME = rectP(360, 120, 440, 440);
  const TABLE_TOP = (() => { const p = new Path2D(); p.roundRect(820, 634, 380, 30, 15); return p; })();
  const TABLE_PED = (() => { const p = new Path2D(); [[994, 664], [1026, 664], [1022, 700], [1034, 738], [1026, 780], [1040, 840], [1076, 882], [1080, 898], [940, 898], [944, 882], [980, 840], [994, 780], [986, 738], [998, 700]].forEach((q, i) => i ? p.lineTo(...q) : p.moveTo(...q)); p.closePath(); return p; })();
  const CHAIR = (() => { const p = new Path2D(); p.rect(1460, 462, 14, 440); p.rect(1296, 724, 184, 14); p.rect(1306, 738, 12, 164); p.rect(1306, 818, 168, 9); p.moveTo(1476, 454); p.arc(1467, 454, 9, 0, Math.PI * 2); return p; })();
  const AMPH = RIG.smooth([[1712, 616], [1744, 616], [1746, 652], [1772, 690], [1768, 760], [1752, 830], [1734, 884], [1729, 900], [1724, 884], [1704, 830], [1688, 760], [1686, 690], [1710, 652]]);
  const AMPH_LIP = rectP(1702, 604, 52, 13);
  const AMPH_H = (() => { const p = new Path2D(); p.moveTo(1714, 628); p.bezierCurveTo(1684, 628, 1682, 660, 1692, 690); p.moveTo(1742, 628); p.bezierCurveTo(1772, 628, 1774, 660, 1764, 690); return p; })();
  // Girl's Roman dress: palla (diagonal rear drape + covered knees + hanging front)
  const PALLA_BACK = RIG.smooth([[1350, 436], [1384, 440], [1408, 472], [1422, 532], [1432, 600], [1448, 662], [1454, 722], [1440, 766], [1392, 772], [1398, 700], [1394, 620], [1380, 540], [1362, 482]]);
  const PALLA_LAP = RIG.smooth([[1418, 612], [1448, 652], [1454, 722], [1440, 766], [1362, 778], [1290, 768], [1226, 744], [1200, 722], [1236, 712], [1300, 716], [1360, 700], [1392, 660]]);
  const PALLA_HANG = RIG.smooth([[1322, 768], [1366, 774], [1360, 850], [1356, 912], [1324, 914], [1330, 840]]);
  const PALLA_FOLDS = [[[1372, 470], [1398, 560], [1412, 660], [1418, 740]], [[1236, 730], [1300, 742], [1370, 744], [1424, 734]]].map(q => RIG.smooth(q, false));

  // ---------- Flat underpainting: static parts ----------
  function picture(g) {
    g.save(); g.beginPath(); g.rect(392, 152, 376, 376); g.clip();
    const sg = g.createLinearGradient(0, 152, 0, 470); sg.addColorStop(0, C.sky); sg.addColorStop(1, C.sky2); g.fillStyle = sg; g.fillRect(392, 152, 376, 376);
    g.strokeStyle = '#e4eeee'; g.lineWidth = 5; [[410, 250, 500], [620, 262, 760], [400, 300, 470], [640, 318, 750]].forEach(([a, y, b]) => { g.beginPath(); g.moveTo(a, y); g.lineTo(b, y); g.stroke(); });
    // Volcano: three faces
    const poly = (pts, col) => { g.fillStyle = col; g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(...q) : g.moveTo(...q)); g.closePath(); g.fill(); };
    poly([[402, 472], [535, 222], [560, 222], [520, 472]], C.coneL);
    poly([[520, 472], [560, 222], [586, 222], [646, 472]], C.cone);
    poly([[646, 472], [586, 222], [738, 472]], C.coneD);
    g.strokeStyle = C.ridge; g.lineWidth = 5; [[[548, 226], [500, 330], [470, 420]], [[574, 226], [600, 330], [620, 440]]].forEach(l => { g.beginPath(); l.forEach((q, i) => i ? g.lineTo(...q) : g.moveTo(...q)); g.stroke(); });
    g.fillStyle = '#2a2c48'; g.beginPath(); g.ellipse(560, 222, 27, 6, 0, 0, Math.PI * 2); g.fill();
    // Lava
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = C.lava; g.lineWidth = 8; g.beginPath(); g.moveTo(566, 226); g.lineTo(580, 262); g.lineTo(596, 298); g.lineTo(614, 334); g.stroke();
    g.strokeStyle = C.lava2; g.lineWidth = 5; g.beginPath(); g.moveTo(552, 228); g.lineTo(544, 262); g.lineTo(538, 290); g.stroke();
    // Slopes, ground, cypresses
    g.fillStyle = C.green; g.beginPath(); g.moveTo(392, 462); g.quadraticCurveTo(470, 430, 560, 456); g.quadraticCurveTo(650, 482, 768, 448); g.lineTo(768, 528); g.lineTo(392, 528); g.fill();
    g.fillStyle = C.green2; g.beginPath(); g.moveTo(392, 482); g.quadraticCurveTo(480, 462, 580, 484); g.quadraticCurveTo(680, 502, 768, 476); g.lineTo(768, 528); g.lineTo(392, 528); g.fill();
    g.fillStyle = C.ground; g.beginPath(); g.moveTo(392, 502); g.quadraticCurveTo(560, 488, 768, 504); g.lineTo(768, 528); g.lineTo(392, 528); g.fill();
    g.strokeStyle = C.ground2; g.lineWidth = 4; g.beginPath(); g.moveTo(400, 515); for (let x = 400; x <= 768; x += 24) g.quadraticCurveTo(x + 6, 510, x + 12, 516); g.stroke();
    [[702, 258, 500, 17], [740, 276, 498, 14]].forEach(([x, top, bot, w]) => {
      g.fillStyle = C.cyp; g.beginPath(); g.moveTo(x, top); g.quadraticCurveTo(x + w * 1.1, top + 110, x + w * 0.75, bot); g.lineTo(x - w * 0.75, bot); g.quadraticCurveTo(x - w * 1.1, top + 110, x, top); g.fill();
      g.strokeStyle = C.cyp2; g.lineWidth = 5; g.beginPath(); g.moveTo(x - 3, top + 30); g.lineTo(x - 6, bot - 10); g.stroke();
    });
    g.restore();
  }
  function staticScene(g) {
    g.fillStyle = C.wall; g.fillRect(0, 0, W, H);
    g.fillStyle = C.floor; g.fillRect(BW, 905, W - 2 * BW, H - BW - 905);
    // Object halos (white tiles along contours)
    g.lineJoin = 'round'; g.strokeStyle = C.halo;
    g.lineWidth = 44; g.stroke(FRAME); g.stroke(TABLE_TOP); g.stroke(TABLE_PED); g.stroke(AMPH); g.stroke(AMPH_LIP); g.stroke(AMPH_H);
    g.lineWidth = 34; g.stroke(CHAIR);
    g.strokeStyle = C.floorLine; g.lineWidth = 6; g.beginPath(); g.moveTo(BW, 905); g.lineTo(W - BW, 905); g.stroke();
    // Frame: red → dark line → gold line → dark line → image
    g.fillStyle = C.red; g.fillRect(360, 120, 440, 440);
    g.fillStyle = C.red2; g.fillRect(376, 136, 408, 408);
    g.fillStyle = C.gold; g.fillRect(381, 141, 398, 398);
    g.fillStyle = '#3a2a22'; g.fillRect(387, 147, 386, 386);
    picture(g);
    g.strokeStyle = C.outline; g.lineWidth = 5; g.stroke(FRAME);
    // Chair (behind girl)
    g.fillStyle = C.chair; g.fill(CHAIR); g.strokeStyle = '#7d5c1c'; g.lineWidth = 5; g.stroke(CHAIR);
    // Table: blue-gray round top + flared pedestal
    g.fillStyle = C.table; g.fill(TABLE_PED);
    g.save(); g.clip(TABLE_PED); g.fillStyle = '#93a8bb'; g.fillRect(940, 660, 52, 240); g.fillStyle = C.tableD; g.fillRect(1030, 660, 60, 240);
    g.fillStyle = '#c33a2c'; g.fillRect(940, 736, 140, 9); g.fillStyle = '#3d5a9a'; g.fillRect(940, 748, 140, 7); g.restore();
    g.strokeStyle = C.outline; g.lineWidth = 6; g.stroke(TABLE_PED);
    g.fillStyle = C.table; g.fill(TABLE_TOP); g.fillStyle = C.tableHi; g.fillRect(834, 638, 352, 9); g.stroke(TABLE_TOP);
    // Pottery jar
    g.strokeStyle = C.amphD; g.lineWidth = 9; g.lineCap = 'round'; g.stroke(AMPH_H);
    g.fillStyle = C.amph; g.fill(AMPH); g.fill(AMPH_LIP);
    g.save(); g.clip(AMPH); g.fillStyle = C.amphHi; g.fillRect(1698, 640, 14, 200); g.fillStyle = C.amphD; g.fillRect(1748, 640, 30, 260); g.restore();
    g.strokeStyle = C.outline; g.lineWidth = 6; g.stroke(AMPH); g.stroke(AMPH_LIP);
    // CAVE CATTVM: inscription capitals, black tiles
    // Hand-built letter strokes (uniform thick strokes suit tiles; thin font crossbars break at 7px tiles): 60px height, 12px strokes
    const GL = { C: [44, g2 => g2.ellipse(22, 30, 19, 26, 0, Math.PI * 0.27, Math.PI * 1.73)], A: [46, [[[0, 60], [23, 0], [46, 60]], [[11, 38], [35, 38]]]], V: [46, [[[0, 0], [23, 60], [46, 0]]]],
      E: [38, [[[38, 6], [6, 6], [6, 54], [38, 54]], [[6, 30], [32, 30]]]], T: [46, [[[0, 6], [46, 6]], [[23, 6], [23, 60]]]], M: [52, [[[4, 60], [6, 0], [26, 46], [46, 0], [48, 60]]]] };
    g.save(); g.strokeStyle = '#1d1a18'; g.lineWidth = 14; g.lineJoin = 'miter'; g.lineCap = 'butt';
    const TXT = 'CAVE CATTVM', gap = 16; let tx = 0; const lay = [];
    for (const ch of TXT) { if (ch === ' ') { tx += 30; continue; } lay.push([ch, tx]); tx += GL[ch][0] + gap; }
    const sc = 600 / (tx - gap); g.translate(270, 922); g.scale(sc, 1);
    for (const [ch, x0] of lay) { const gl = GL[ch][1]; g.beginPath(); if (typeof gl === 'function') { g.save(); g.translate(x0, 0); gl(g); g.restore(); } else gl.forEach(l => l.forEach((q, k) => k ? g.lineTo(x0 + q[0], q[1]) : g.moveTo(x0 + q[0], q[1]))); g.stroke(); }
    g.restore();
    // Fish and mouse (small tiles)
    g.fillStyle = '#5f5b57'; g.beginPath(); g.ellipse(1446, 950, 40, 8, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(1408, 950); g.lineTo(1386, 938); g.lineTo(1386, 962); g.closePath(); g.fill();
    g.strokeStyle = '#d8ccb0'; g.lineWidth = 2.5; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(1420 + k * 11, 944); g.lineTo(1426 + k * 11, 956); g.stroke(); }
    g.fillStyle = '#86807a'; g.beginPath(); g.ellipse(1784, 960, 22, 10, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(1800, 952); g.lineTo(1824, 962); g.lineTo(1800, 968); g.fill(); g.beginPath(); g.arc(1798, 950, 5, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#86807a'; g.lineWidth = 3; g.beginPath(); g.moveTo(1764, 962); g.quadraticCurveTo(1748, 950, 1738, 966); g.stroke();
    // Black inner-frame line
    g.fillStyle = C.bK; g.fillRect(BW - 2, BW - 2, W - 2 * BW + 4, 6); g.fillRect(BW - 2, H - BW - 4, W - 2 * BW + 4, 6); g.fillRect(BW - 2, BW - 2, 6, H - 2 * BW + 4); g.fillRect(W - BW - 4, BW - 2, 6, H - 2 * BW + 4);
  }

  // ---------- Flat underpainting: animated parts ----------
  // Four wave borders (Vitruvian scrolls), same pattern in local coordinates: u clockwise, v inward
  const PER = 81;
  const SIDES = [[1, 0, 0, 1, 0, 0, W], [0, 1, -1, 0, W, 0, H], [-1, 0, 0, -1, W, H, W], [0, -1, 1, 0, 0, H, H]];
  function border(g, phase) {
    for (const [a, b, c2, d, e, f, len] of SIDES) {
      g.save(); g.setTransform(a, b, c2, d, e, f);
      g.beginPath(); g.rect(BW, 0, len - 2 * BW, BW); g.clip();
      g.fillStyle = C.bW; g.fillRect(0, 0, len, BW);
      g.fillStyle = C.bK; g.fillRect(0, 0, len, 8); g.fillRect(0, 66, len, BW - 66);
      g.strokeStyle = C.bK; g.lineWidth = 13; g.lineCap = 'round'; g.lineJoin = 'round';
      const off = ((phase % PER) + PER) % PER;
      for (let u0 = BW - 2 * PER + off; u0 < len + PER; u0 += PER) {
        const cx = u0 + PER * 0.52, cy = 38, r0 = 24;
        g.beginPath(); g.moveTo(u0 - 6, 68); g.quadraticCurveTo(u0 + 2, 42, cx - r0, cy);
        for (let th = Math.PI; th <= Math.PI * 3.25; th += 0.14) { const r = r0 - (th - Math.PI) / (Math.PI * 2.25) * (r0 - 5); g.lineTo(cx + Math.cos(th) * r, cy + Math.sin(th) * r); }
        g.stroke();
      }
      g.restore();
    }
    // Square corner ornaments
    for (const [x, y] of [[0, 0], [W - BW, 0], [0, H - BW], [W - BW, H - BW]]) {
      g.fillStyle = C.bK; g.fillRect(x, y, BW, BW); g.fillStyle = C.bW; g.fillRect(x + 10, y + 10, BW - 20, BW - 20);
      g.fillStyle = C.bK; g.fillRect(x + 22, y + 22, BW - 44, BW - 44); g.fillStyle = C.red; g.fillRect(x + 33, y + 33, BW - 66, BW - 66);
    }
  }
  // Volcanic smoke + sparks (continuous global time)
  function volcanoFX(g, t) {
    g.save(); g.beginPath(); g.rect(392, 152, 376, 376); g.clip();
    // Ash cloud band drifts right: 380px period, 55px per second
    const cx0 = (t * 55) % 380;
    for (const ox of [-380, 0]) [[28, 168, 46, 18, C.cloud], [108, 162, 52, 16, C.cloud2], [218, 166, 50, 18, C.cloud], [308, 170, 58, 17, C.cloud2], [63, 192, 36, 10, C.cloud2], [278, 195, 40, 10, C.cloud]]
      .forEach(([x, y, rx, ry, col]) => { g.fillStyle = col; g.beginPath(); g.ellipse(392 + x + ox + cx0, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); });
    const N = 9;
    for (let i = 0; i < N; i++) {
      const q = ((t * 0.85 + i / N) % 1), e = 1 - Math.pow(1 - q, 1.6);
      const x = 560 + e * 175 + Math.sin(t * 2 + i * 2.1) * 10, y = 212 - e * 62 - Math.sin(e * 3.1) * 18, r = 13 + q * 40;   // Smoke column drifts low to the right (stay within framed sky to remain visible)
      const col = P.mix(P.hex('#3f3c3a'), P.hex('#a29c94'), Math.min(1, q * 1.1));
      g.globalAlpha = q > 0.8 ? (1 - q) / 0.2 : 1;
      g.fillStyle = P.rgb(col); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      g.fillStyle = P.rgb(P.mix(col, [255, 255, 255], 0.3)); g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.45, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
    const r = rng(79);
    for (let i = 0; i < 12; i++) {
      const ang = -Math.PI / 2 + (r() - 0.5) * 2.0, sp = 130 + r() * 110, ph = r();
      const q = (t * 1.25 + ph) % 1, tt = q * 0.9;
      const x = 560 + Math.cos(ang) * sp * tt, y = 216 + Math.sin(ang) * sp * tt + 260 * tt * tt;
      g.fillStyle = r() < 0.5 ? '#f6d23c' : '#f08a22'; g.fillRect(x - 5, y - 5, 10, 10);
    }
    // Pulsing crater lava
    g.fillStyle = `rgba(246,160,40,${0.55 + 0.45 * Math.sin(t * 9)})`; g.beginPath(); g.ellipse(560, 220, 20, 6, 0, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  // Girl: Roman stola + red palla + golden Roman bun
  const rot = (G, x, y) => { const c = Math.cos(G.tilt), s = Math.sin(G.tilt), X = x - 1300, Y = y - 425; return [1300 + X * c - Y * s, 425 + X * s + Y * c]; };
  // Near arm: avoid rig's original lift (cup ends at nose, arm hides face). Right rim meets lips, tilt ≤8.6°, hand under cup foot;
  // cup follows quadratic Bezier table → forward/up → lips; IK uses the rig's same arm lengths (165/122) and elbow direction.
  function armPose(G, k) {
    const S = G.A.shoulder, lip = G.lips[0];
    const A0 = [1186, 584], A2 = [lip[0] - 31, lip[1] - 3], A1 = [1150, 470], u = 1 - k;
    const cp = [u * u * A0[0] + 2 * u * k * A1[0] + k * k * A2[0], u * u * A0[1] + 2 * u * k * A1[1] + k * k * A2[1]];
    const cup = { x: cp[0], y: cp[1], w: 44, h: 38, tilt: 0.15 * k };
    const hT = [cp[0] + lerp(40, 3, k), cp[1] + lerp(32, 56, k)];
    const { E, H } = RIG.ik2(S, hT, 165, 122, -1);
    const W_ = [lerp(E[0], H[0], 0.82), lerp(E[1], H[1], 0.82)], fa = Math.atan2(H[1] - E[1], H[0] - E[0]);
    const hand = new Path2D(); hand.ellipse(H[0], H[1], 17, 14, fa, 0, Math.PI * 2);
    return { S, E, H, cup, upperArm: RIG.taper(S, E, 54, 40, 10), foreArm: RIG.taper(E, W_, 40, 30, 2), cuff: RIG.taper([lerp(E[0], H[0], 0.74), lerp(E[1], H[1], 0.74)], W_, 32, 31), hand };
  }
  function girl(g, G, { nearArm = true, steam = 0, t = 0, blink = 0, cup = 0 } = {}) {
    const AP = armPose(G, cup);
    g.save(); g.lineJoin = 'round'; g.lineCap = 'round';
    const sil = [G.skirt, G.torso, G.farSleeve, G.farHand, G.hairBack, G.bun, G.neck, G.face, G.bangs, PALLA_BACK, PALLA_LAP, PALLA_HANG, G.shoe];
    const arm = nearArm ? [AP.upperArm, AP.foreArm, AP.hand] : [];
    g.strokeStyle = C.halo; g.lineWidth = 50; sil.concat(arm).forEach(p => p && g.stroke(p));
    if (nearArm) { g.fillStyle = C.halo; g.beginPath(); g.arc(AP.cup.x, AP.cup.y + 26, 60, 0, Math.PI * 2); g.fill(); }
    const F = (p, col, lw = 8) => { if (!p) return; g.fillStyle = col; g.fill(p); if (lw) { g.strokeStyle = C.outline; g.lineWidth = lw; g.stroke(p); } };
    F(G.farSleeve, C.stola); F(G.farHand, C.skin, 6); F(G.farCuff, C.gold, 0);
    F(G.skirt, C.stola);
    g.save(); g.clip(G.skirt); g.fillStyle = C.red; g.fillRect(1080, 878, 400, 10); g.fillRect(1080, 897, 400, 9);
    g.strokeStyle = C.stolaF; g.lineWidth = 6; G.folds.forEach(f => g.stroke(f)); g.restore();
    g.strokeStyle = C.outline; g.lineWidth = 8; g.stroke(G.skirt);
    F(G.shoe, '#6b4428', 6);
    F(G.torso, C.stola);
    g.save(); g.clip(G.torso); g.strokeStyle = C.stolaF; g.lineWidth = 6; [[1300, 470, 1306, 600], [1330, 480, 1340, 605]].forEach(([a, b, c2, d]) => { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo(a + 8, (b + d) / 2, c2, d); g.stroke(); }); g.restore();
    F(PALLA_BACK, C.red); F(PALLA_LAP, C.red); F(PALLA_HANG, C.red, 7);
    g.strokeStyle = C.red2; g.lineWidth = 7; PALLA_FOLDS.forEach(f => g.stroke(f));
    g.fillStyle = C.gold; g.beginPath(); g.arc(1372, 446, 10, 0, Math.PI * 2); g.fill(); g.strokeStyle = C.gold2; g.lineWidth = 3; g.stroke();
    F(G.neck, C.skin, 6);
    F(G.hairBack, C.hair, 7); F(G.bun, C.hair, 7);
    g.strokeStyle = C.hairD; g.lineWidth = 4; g.beginPath(); for (let a = 0; a < 8; a += 0.25) { const r = 4 + a * 3, x = G.bunSpiral[0] + Math.cos(a) * r, y = G.bunSpiral[1] + Math.sin(a) * r; a ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    F(G.face, C.skin, 10);
        g.fillStyle = C.skin; g.beginPath(); g.ellipse(G.ear[0], G.ear[1], 8, 12, 0.2, 0, Math.PI * 2); g.fill(); g.strokeStyle = C.outline; g.lineWidth = 4; g.stroke();
    g.fillStyle = C.gold; g.beginPath(); g.arc(G.ear[0] - 1, G.ear[1] + 16, 5, 0, Math.PI * 2); g.fill();
    F(G.bangs, C.hair, 6);
    g.strokeStyle = C.hairD; g.lineWidth = 4; G.hairLines.forEach(h => g.stroke(h));
    // Red hairband
    const f0 = rot(G, 1256, 322), f1 = rot(G, 1282, 294), f2 = rot(G, 1342, 286), f3 = rot(G, 1378, 334);
    g.strokeStyle = C.red; g.lineWidth = 8; g.beginPath(); g.moveTo(...f0); g.bezierCurveTo(...f1, ...f2, ...f3); g.stroke();
    // Features at small-tile scale: one dark eye tile, brows, lips
    if (blink) { g.strokeStyle = C.eye; g.lineWidth = 4; g.stroke(G.lid); }
    else { g.fillStyle = '#fbf8f0'; g.beginPath(); g.ellipse(G.eye.x + 3, G.eye.y + 1, 13, 7, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = C.eye; g.beginPath(); g.ellipse(G.eye.x - 1, G.eye.y + 1, 8, 7, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = C.eye; g.lineWidth = 5; g.stroke(G.lid); }
    g.strokeStyle = '#4a3020'; g.lineWidth = 6; g.stroke(G.brow);
    { const l0 = G.lips[0], l2 = G.lips[2]; g.fillStyle = '#a8282a'; g.beginPath(); g.ellipse((l0[0] + l2[0]) / 2 + 4, (l0[1] + l2[1]) / 2, 8.5, 6, -0.3, 0, Math.PI * 2); g.fill(); }
    if (nearArm) {
      F(AP.upperArm, C.skin, 6); F(AP.foreArm, C.skin, 6);
      g.save(); g.clip(AP.upperArm); const sh0 = G.A.shoulder; g.fillStyle = C.stola; g.beginPath(); g.arc(sh0[0], sh0[1], 62, 0, Math.PI * 2); g.fill(); g.strokeStyle = C.red; g.lineWidth = 9; g.beginPath(); g.arc(sh0[0], sh0[1], 62, 0, Math.PI * 2); g.stroke(); g.restore(); g.strokeStyle = C.outline; g.lineWidth = 6; g.stroke(AP.upperArm);
      F(AP.cuff, C.gold, 0);
      F(AP.hand, C.skin, 6);          // Hand supports cup foot; cupSprite overlays cup on mosaic
    }
    g.restore();
  }
  // Cat redrawn from RIG.cat anchors: smooth pear-shaped body, tabby stripes, white chest/paws, large yellow eyes, red collar
  const CATS = 0.85, catT = (g) => { g.translate(540, 905); g.scale(CATS, CATS); g.translate(-540, -905); };
  const catPt = ([x, y]) => [540 + (x - 540) * CATS, 905 + (y - 905) * CATS];
  function cat(g, K) {
    g.save(); catT(g); g.lineJoin = 'round'; g.lineCap = 'round';
    const body = RIG.smooth(K.bodyPts);
    const tail = new Path2D(); K.tailPts.forEach((q, i) => i ? tail.lineTo(...q) : tail.moveTo(...q));
    g.strokeStyle = C.halo; g.lineWidth = 50; g.stroke(body); g.stroke(K.head); K.legs.forEach(l => g.stroke(l)); g.lineWidth = K.tailW + 50; g.stroke(tail);
    // Tail: dark outline → orange → dark-orange rings → white tip
    g.strokeStyle = C.outline; g.lineWidth = K.tailW + 12; g.stroke(tail);
    g.strokeStyle = C.catO; g.lineWidth = K.tailW; g.stroke(tail);
    g.strokeStyle = C.catS; g.setLineDash([9, 13]); g.lineDashOffset = 4; g.lineWidth = K.tailW - 2; g.lineCap = 'butt'; g.stroke(tail); g.setLineDash([]); g.lineCap = 'round';
    const tip = K.tailPts[K.tailPts.length - 1]; g.fillStyle = C.catW; g.beginPath(); g.arc(tip[0], tip[1], K.tailW / 2, 0, Math.PI * 2); g.fill();
    // Body
    g.fillStyle = C.catO; g.fill(body);
    g.save(); g.clip(body); g.fillStyle = C.catO2; g.beginPath(); g.ellipse(K.bodyPts[2][0] + 10, K.bodyPts[2][1] + 40, 52, 110, 0.1, 0, Math.PI * 2); g.fill();
    g.strokeStyle = C.catS; g.lineWidth = 10; K.stripes.slice(3).forEach(s => { g.beginPath(); g.moveTo(...s[0]); g.lineTo(...s[1]); g.stroke(); });
    const hx = K.bodyPts[1][0], hy = K.bodyPts[1][1];
    g.lineWidth = 8; g.strokeStyle = C.catS; g.beginPath(); g.arc(hx + 62, hy - 6, 50, Math.PI * 0.95, Math.PI * 1.6); g.stroke();         // Hind-leg outline
    g.beginPath(); g.arc(hx + 62, hy - 6, 30, Math.PI * 1.0, Math.PI * 1.55); g.stroke();
    g.restore();
    g.strokeStyle = C.outline; g.lineWidth = 8; g.stroke(body);
    K.legs.forEach(l => { g.fillStyle = C.catW; g.fill(l); });
    g.fillStyle = C.catW; g.fill(K.white);
    K.legs.forEach(l => { g.strokeStyle = C.outline; g.lineWidth = 5; g.stroke(l); });
    // Red collar + gold pendant
    const hc = K.headC;
    g.strokeStyle = C.collar; g.lineWidth = 13; g.beginPath(); g.moveTo(hc[0] - 46, hc[1] + 52); g.quadraticCurveTo(hc[0] + 2, hc[1] + 80, hc[0] + 52, hc[1] + 52); g.stroke();
    g.fillStyle = C.gold; g.beginPath(); g.arc(hc[0] + 6, hc[1] + 76, 7, 0, Math.PI * 2); g.fill();
    // Head
    // Head faces front (Pompeian cat mosaics stare forward). Face centerline x≈604 (midpoint of ear tips)
    const fx = hc[0] + 4, fy = hc[1];
    g.fillStyle = C.catO; g.fill(K.head);
    g.save(); g.clip(K.head); g.fillStyle = C.catW; g.beginPath(); g.ellipse(fx, fy + 30, 34, 24, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = C.catS; g.lineWidth = 7; K.stripes.slice(0, 3).forEach(s => { g.beginPath(); g.moveTo(...s[0]); g.lineTo(...s[1]); g.stroke(); });
    [[-1], [1]].forEach(([d]) => { g.beginPath(); g.moveTo(fx + d * 66, fy + 4); g.lineTo(fx + d * 44, fy + 8); g.stroke(); g.beginPath(); g.moveTo(fx + d * 64, fy + 20); g.lineTo(fx + d * 46, fy + 20); g.stroke(); });
    g.restore();
    g.strokeStyle = C.outline; g.lineWidth = 11; g.stroke(K.head);
    g.fillStyle = '#e9a08e'; K.earInner.forEach(e => { g.beginPath(); e.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.fill(); });
    // Large round yellow eyes + black slit pupils + dark sockets (Pompeian cat hallmark)
    [[fx - 24, fy - 8], [fx + 24, fy - 10]].forEach(([ex, ey]) => {
      const R = 17;
      if (K.blink) { g.fillStyle = C.catO; g.beginPath(); g.arc(ex, ey, R, 0, Math.PI * 2); g.fill(); g.strokeStyle = C.eye; g.lineWidth = 7; g.beginPath(); g.moveTo(ex - R, ey + 2); g.quadraticCurveTo(ex, ey + 8, ex + R, ey + 2); g.stroke(); }
      else { g.fillStyle = C.catEye; g.beginPath(); g.arc(ex, ey, R, 0, Math.PI * 2); g.fill(); g.strokeStyle = C.eye; g.lineWidth = 7; g.stroke(); g.fillStyle = C.eye; g.beginPath(); g.ellipse(ex, ey, 4.5, 11, 0, 0, Math.PI * 2); g.fill(); }
    });
    g.fillStyle = '#c96a5c'; g.beginPath(); g.moveTo(fx - 8, fy + 16); g.lineTo(fx + 8, fy + 16); g.lineTo(fx, fy + 25); g.closePath(); g.fill();
    g.strokeStyle = C.eye; g.lineWidth = 4; g.beginPath(); g.moveTo(fx, fy + 25); g.lineTo(fx, fy + 31); g.moveTo(fx - 12, fy + 36); g.quadraticCurveTo(fx - 5, fy + 38, fx, fy + 31); g.quadraticCurveTo(fx + 5, fy + 38, fx + 12, fy + 36); g.stroke();
    g.restore();
  }

  // ---------- Choreography ----------
  const ease = U.ease.inOut;
  const borderPhase = (lt) => 15 * lt + PER * ease(clamp((lt - 0.485) / 0.365));        // Constant drift + one cycle during source frames 226–248
  const poses = (lt, t) => {
    const ch = P.choreo(lt, t);
    return { ch, G: RIG.girl({ cup: ch.cup, sip: ch.sip, breathe: ch.breathe }), K: RIG.cat({ tail: ch.tail * 1.6, blink: ch.blink, breathe: ch.breathe }) };
  };
  function fullBase(g, sb, lt, t) {
    const { ch, G, K } = poses(lt, t);
    g.drawImage(sb, 0, 0);
    border(g, borderPhase(lt));
    volcanoFX(g, t);
    cat(g, K);
    girl(g, G, { steam: 1 - ch.cup * 0.85, t, blink: ch.blink, cup: ch.cup });
  }

  // ---------- Mosaic renderer: layout (computed once) ----------
  let S = null;
  function build() {
    const t0 = performance.now();
    const sb = P.cached('rm_static', W, H, g => staticScene(g));
    const mk = () => { const cv = P.canvas(); return [cv, cv.getContext('2d', { willReadFrequently: true })]; };
    // Structure map (tile placement): static + girl (excluding animated near arm) + cat
    const [sc, sg] = mk(); sg.drawImage(sb, 0, 0);
    const G0 = RIG.girl({ cup: 0 }), K0 = RIG.cat({});
    cat(sg, K0); girl(sg, G0, { nearArm: false, steam: 0 });
    // Class map
    const [cc, cg] = mk(); const cs = k => `rgb(${k * 16},0,0)`;
    cg.fillStyle = cs(K_WALL); cg.fillRect(0, 0, W, H);
    cg.fillStyle = cs(K_FLOOR); cg.fillRect(BW, 905, W - 2 * BW, H - BW - 905);
    cg.lineJoin = 'round'; cg.strokeStyle = cs(K_HALO); cg.lineWidth = 44; [FRAME, TABLE_TOP, TABLE_PED, AMPH, AMPH_LIP].forEach(p => cg.stroke(p)); cg.lineWidth = 34; cg.stroke(CHAIR);
    cg.fillStyle = cs(K_FRAME); cg.fill(FRAME); cg.fillStyle = cs(K_PIC); cg.fillRect(388, 148, 384, 384);
    cg.fillStyle = cs(K_OBJ); [TABLE_TOP, TABLE_PED, AMPH, AMPH_LIP, CHAIR].forEach(p => cg.fill(p));
    const gs = [G0.skirt, G0.torso, G0.farSleeve, G0.farHand, G0.neck, PALLA_BACK, PALLA_LAP, PALLA_HANG, G0.shoe], gh = [G0.hairBack, G0.bun, G0.bangs];
    const kb = [RIG.smooth(K0.bodyPts), K0.head].concat(K0.legs), ktail = new Path2D(); K0.tailPts.forEach((q, i) => i ? ktail.lineTo(...q) : ktail.moveTo(...q));
    cg.strokeStyle = cs(K_HALO); cg.lineWidth = 50; gs.concat(gh, [G0.face]).forEach(p => cg.stroke(p)); cg.save(); catT(cg); kb.forEach(p => cg.stroke(p)); cg.lineWidth = K0.tailW + 50; cg.stroke(ktail); cg.restore();
    cg.lineWidth = 9; cg.fillStyle = cg.strokeStyle = cs(K_FIG); gs.forEach(p => { cg.fill(p); cg.stroke(p); }); cg.fillStyle = cg.strokeStyle = cs(K_HAIR); gh.forEach(p => { cg.fill(p); cg.stroke(p); }); cg.fillStyle = cg.strokeStyle = cs(K_FACE); cg.fill(G0.face); cg.stroke(G0.face);
    cg.save(); catT(cg); cg.lineWidth = 9; cg.fillStyle = cg.strokeStyle = cs(K_CAT); kb.forEach(p => { cg.fill(p); cg.stroke(p); }); cg.strokeStyle = cs(K_CAT); cg.lineWidth = K0.tailW + 12; cg.stroke(ktail); cg.fillStyle = cg.strokeStyle = cs(K_FACE); cg.lineWidth = 13; cg.fill(K0.head); cg.stroke(K0.head); cg.restore();
    cg.fillStyle = cs(K_BORDER); cg.fillRect(0, 0, W, BW); cg.fillRect(0, H - BW, W, BW); cg.fillRect(0, 0, BW, H); cg.fillRect(W - BW, 0, BW, H);
    const cd = cg.getImageData(0, 0, W, H).data, CL = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) CL[i] = Math.round(cd[i * 4] / 16);
    const sdat = sg.getImageData(0, 0, W, H).data;
    for (let y = 905; y < H - BW; y++) for (let x = 255; x < 885; x++) { const i = y * W + x; if (sdat[i * 4] + sdat[i * 4 + 1] + sdat[i * 4 + 2] < 240) CL[i] = K_TEXT; }
    // Half resolution: edges → exact Euclidean distance transform (Felzenszwalb)
    const HW = 960, HH = 540, N = HW * HH;
    const hc = P.canvas(HW, HH), hg = hc.getContext('2d', { willReadFrequently: true }); hg.drawImage(sc, 0, 0, HW, HH);
    const hd = hg.getImageData(0, 0, HW, HH).data;
    const CH = new Uint8Array(N); for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) CH[y * HW + x] = CL[(2 * y) * W + 2 * x];
    const F = new Float64Array(N);
    for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) {
      const i = y * HW + x, o = i * 4; let e = false;
      if (x < HW - 1) { const q = o + 4; e = Math.abs(hd[o] - hd[q]) + Math.abs(hd[o + 1] - hd[q + 1]) + Math.abs(hd[o + 2] - hd[q + 2]) > 34; }
      if (!e && y < HH - 1) { const q = o + HW * 4; e = Math.abs(hd[o] - hd[q]) + Math.abs(hd[o + 1] - hd[q + 1]) + Math.abs(hd[o + 2] - hd[q + 2]) > 34; }
      if (!e && x < HW - 1 && CH[i] !== CH[i + 1] && (CH[i] === K_BORDER || CH[i + 1] === K_BORDER)) e = true;
      if (!e && y < HH - 1 && CH[i] !== CH[i + HW] && (CH[i] === K_BORDER || CH[i + HW] === K_BORDER)) e = true;
      F[i] = e ? 0 : 1e20;
    }
    const D = edt(F, HW, HH);                             // Squared half-resolution pixel distance → full-resolution pixel distance
    for (let i = 0; i < N; i++) D[i] = Math.sqrt(D[i]) * 2;
    const tangent = (i) => { const x = i % HW, y = (i / HW) | 0; const gx = D[i + (x < HW - 1 ? 1 : 0)] - D[i - (x > 0 ? 1 : 0)], gy = D[i + (y < HH - 1 ? HW : 0)] - D[i - (y > 0 ? HW : 0)]; return Math.atan2(gy, gx) + Math.PI / 2; };
    // Tile seeds: spatial hash guarantees minimum spacing
    const sx = [], sy = [], ss = [], sa = [], scl = [];
    const CS = 24, GWc = Math.ceil(W / CS), GHc = Math.ceil(H / CS), cell = Array.from({ length: GWc * GHc }, () => []);
    const ok = (x, y, s, f) => { const cx = (x / CS) | 0, cy = (y / CS) | 0; for (let j = cy - 1; j <= cy + 1; j++) for (let i = cx - 1; i <= cx + 1; i++) { if (i < 0 || j < 0 || i >= GWc || j >= GHc) continue; for (const k of cell[j * GWc + i]) { const m = f * (s + ss[k]) / 2; const dx = sx[k] - x, dy = sy[k] - y; if (dx * dx + dy * dy < m * m) return false; } } return true; };
    const add = (x, y, s, a, c) => { const k = sx.length; sx.push(x); sy.push(y); ss.push(s); sa.push(a); scl.push(c); cell[((y / CS) | 0) * GWc + ((x / CS) | 0)].push(k); return k; };
    // ① Outer border: rows along edges
    const r = rng(2079), NR = 11, bs = BW / NR;
    for (const [a, b, c2, d, e, f, len] of SIDES) {
      for (let j = 0; j < NR; j++) { let u = BW + (j % 2) * bs * 0.5 + r() * 2; while (u < len - BW) { const w = bs * (0.86 + r() * 0.28), uc = u + w / 2, v = (j + 0.5) * bs; add(a * uc + c2 * v + e, b * uc + d * v + f, bs, Math.atan2(b, a) + (r() - .5) * 0.06, K_BORDER); u += w; } }
    }
    for (const [x0, y0] of [[0, 0], [W - BW, 0], [0, H - BW], [W - BW, H - BW]]) for (let j = 0; j < NR; j++) for (let i = 0; i < NR; i++) add(x0 + (i + 0.5) * bs, y0 + (j + 0.5) * bs, bs, (r() - .5) * 0.06, K_BORDER);
    // ② Contours: trace isolines d=(k+½)s, place one tile per tile-width step
    const cand = new Uint8Array(N), vis = new Uint8Array(N);
    for (let i = 0; i < N; i++) { const c = CH[i]; if (c === K_BORDER) continue; const s = SZ[c], d = D[i]; if (d < 1) continue; const k = Math.floor(d / s); if (k >= KR[c]) continue; if (Math.abs(d - (k + 0.5) * s) < 1.5) cand[i] = 1; }
    const NB = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
    for (let i0 = 0; i0 < N; i0++) {
      if (!cand[i0] || vis[i0]) continue;
      let cur = i0, px = -1e9, py = -1e9, dx = 1, dy = 0;
      for (;;) {
        vis[cur] = 1; const hx = cur % HW, hy = (cur / HW) | 0, x = 2 * hx + 1, y = 2 * hy + 1, c = CH[cur], s = SZ[c];
        if ((x - px) ** 2 + (y - py) ** 2 >= s * s * 0.98 && ok(x, y, s, 0.8)) { add(x, y, s, tangent(cur), c); px = x; py = y; }
        let best = -1, bd = -9, bx = 0, by = 0;
        for (const [ox, oy] of NB) { const nx = hx + ox, ny = hy + oy; if (nx < 0 || ny < 0 || nx >= HW || ny >= HH) continue; const n = ny * HW + nx; if (!cand[n] || vis[n]) continue; const l = Math.hypot(ox, oy), dt = (ox * dx + oy * dy) / l; if (dt > bd) { bd = dt; best = n; bx = ox / l; by = oy / l; } }
        if (best < 0) break;
        dx = dx * 0.6 + bx * 0.4; dy = dy * 0.6 + by * 0.4; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; cur = best;
      }
    }
    // ③ Remaining areas: regular rows (half-tile brick stagger) + hole filling
    for (let c = 0; c < SZ.length; c++) {
      if (c === K_BORDER) continue; const s = SZ[c];
      for (let j = 0; (j + 0.5) * s < H; j++) for (let i = -1; (i + 0.5) * s < W; i++) {
        const x = (i + 0.5 + (j % 2) * 0.5) * s + (r() - .5) * 0.18 * s, y = (j + 0.5) * s + (r() - .5) * 0.1 * s;
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        if (CL[(y | 0) * W + (x | 0)] !== c) continue;
        const hi = Math.min(HH - 1, (y / 2) | 0) * HW + Math.min(HW - 1, (x / 2) | 0);
        const contour = KR[c] >= 99 || D[hi] < KR[c] * s;
        if (ok(x, y, s, 0.86)) add(x, y, s, contour ? tangent(hi) : (r() - .5) * 0.07, c);
      }
    }
    // ④ Rasterize weighted L∞ Voronoi (independent edge jitter → irregular squares); small D2−D1 marks grout
    const n = sx.length;
    const HUP = new Float32Array(n), HUM = new Float32Array(n), HVP = new Float32Array(n), HVM = new Float32Array(n), CA = new Float32Array(n), SA = new Float32Array(n);
    const JL = new Float32Array(n), TR = new Float32Array(n), TG = new Float32Array(n), TB = new Float32Array(n), SIDX = new Int32Array(n);
    for (let k = 0; k < n; k++) {
      const h = ss[k] / 2, c = scl[k];
      HUP[k] = h * (1.08 + r() * 0.2); HUM[k] = h * (1.08 + r() * 0.2); HVP[k] = h * (1.08 + r() * 0.2); HVM[k] = h * (1.08 + r() * 0.2);
      const a = sa[k] + (r() - .5) * 0.12; CA[k] = Math.cos(a); SA[k] = Math.sin(a);
      JL[k] = (r() - .5) * 2 * JIT[c]; const add_ = (r() - .5) * 14; TR[k] = add_; TG[k] = add_; TB[k] = add_;
      const q = r(); if (q < 0.09) { TR[k] += 12; TG[k] += 4; TB[k] -= 8; } else if (q < 0.16) { TR[k] -= 6; TB[k] += 9; }
      if (c === K_WALL && r() < 0.07) JL[k] -= 0.12;
      SIDX[k] = clamp(Math.round(sy[k]), 0, H - 1) * W + clamp(Math.round(sx[k]), 0, W - 1);
    }
    const D1 = new Float32Array(W * H).fill(9), D2 = new Float32Array(W * H).fill(9), ID = new Int32Array(W * H).fill(-1);
    for (let k = 0; k < n; k++) {
      const cx = sx[k], cy = sy[k], ca = CA[k], sn = SA[k], hm = Math.max(HUP[k], HUM[k], HVP[k], HVM[k]), R = Math.ceil(hm * 1.5) + 1;
      const x0 = Math.max(0, (cx - R) | 0), x1 = Math.min(W - 1, (cx + R) | 0), y0 = Math.max(0, (cy - R) | 0), y1 = Math.min(H - 1, (cy + R) | 0);
      const hup = HUP[k], hum = HUM[k], hvp = HVP[k], hvm = HVM[k];
      for (let y = y0; y <= y1; y++) { const ddy = y + 0.5 - cy; let p = y * W + x0; for (let x = x0; x <= x1; x++, p++) {
        const ddx = x + 0.5 - cx, u = ddx * ca + ddy * sn, v = -ddx * sn + ddy * ca;
        const du = u > 0 ? u / hup : -u / hum, dv = v > 0 ? v / hvp : -v / hvm, Dd = du > dv ? du : dv;
        if (Dd < D1[p]) { D2[p] = D1[p]; D1[p] = Dd; ID[p] = k; } else if (Dd < D2[p]) D2[p] = Dd;
      } }
    }
    // ⑤ Per pixel: tile or grout; bevel shading (upper-left light) + grain
    const SH = new Uint8Array(W * H), LX = -0.6, LY = -0.8;
    const gr = rng(7);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const p = y * W + x, k = ID[p]; if (k < 0) continue;
      const h = (HUP[k] + HUM[k] + HVP[k] + HVM[k]) / 4, g = clamp(0.1 * ss[k], 0.75, 1.25), d1 = D1[p];
      const gap = (D2[p] - d1) * h / 2;
      if (d1 > 1 || gap < g) { ID[p] = -1; continue; }
      const e = Math.min((1 - d1) * h, gap - g);
      let sh = 1 - 0.05 * d1 * d1 + (gr() - 0.5) * 0.06;
      if (e < 2.2) {
        const ddx = x + 0.5 - sx[k], ddy = y + 0.5 - sy[k], ca = CA[k], sn = SA[k], u = ddx * ca + ddy * sn, v = -ddx * sn + ddy * ca;
        const du = u > 0 ? u / HUP[k] : -u / HUM[k], dv = v > 0 ? v / HVP[k] : -v / HVM[k];
        const nx = du > dv ? Math.sign(u) * ca : -Math.sign(v) * sn, ny = du > dv ? Math.sign(u) * sn : Math.sign(v) * ca;
        sh += 0.16 * (1 - e / 2.2) * (nx * LX + ny * LY);
      }
      SH[p] = clamp(Math.round(sh * 128), 0, 255);
    }
    // ⑥ Color full frame at frame 0 → static mosaic
    const [bc, bg] = mk();
    fullBase(bg, sb, 0, 3.28125);
    const bd = bg.getImageData(0, 0, W, H).data;
    const TCr = new Uint8ClampedArray(n), TCg = new Uint8ClampedArray(n), TCb = new Uint8ClampedArray(n);
    const color = (k, d) => { const o = SIDX[k] * 4, f = 1 + JL[k]; TCr[k] = d[o] * f + TR[k]; TCg[k] = d[o + 1] * f + TG[k]; TCb[k] = d[o + 2] * f + TB[k]; };
    for (let k = 0; k < n; k++) color(k, bd);
    const [oc, og] = mk(), oimg = og.createImageData(W, H), SO = oimg.data, grr = rng(13);
    for (let p = 0; p < W * H; p++) {
      const k = ID[p], o = p * 4;
      if (k < 0) { const nz = (grr() - 0.5) * 16; SO[o] = 112 + nz; SO[o + 1] = 103 + nz; SO[o + 2] = 92 + nz; }
      else { const sh = SH[p]; SO[o] = (TCr[k] * sh) >> 7; SO[o + 1] = (TCg[k] * sh) >> 7; SO[o + 2] = (TCb[k] * sh) >> 7; }
      SO[o + 3] = 255;
    }
    og.putImageData(oimg, 0, 0);
    // ⑦ Dynamic rectangles: computed from pose bounding boxes
    const bbox = (pts, m) => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; pts.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }); return [Math.max(0, (x0 - m) | 0), Math.max(0, (y0 - m) | 0), Math.min(W, Math.ceil(x1 + m)), Math.min(H, Math.ceil(y1 + m))]; };
    const gp = [[1180, 270], [1460, 720]];
    for (let cu = 0; cu <= 1.001; cu += 0.05) for (const sip of [0, 0.15]) { const G = RIG.girl({ cup: cu, sip }), A = armPose(G, cu); gp.push(A.H, A.E, G.A.headTop, G.A.forehead, G.A.chin, G.A.nape, [A.cup.x - 40, A.cup.y - 95], [A.cup.x + 40, A.cup.y + 60], [G.bunSpiral[0] + 36, G.bunSpiral[1] - 36]); }
    const kp = [[420, 540], [700, 912]];
    for (let tl = -0.75; tl <= 0.75; tl += 0.05) { const K = RIG.cat({ tail: tl }); kp.push(...K.tailPts.map(catPt)); }
    const rects = [[392, 152, 768, 528], bbox(gp, 58), bbox(kp, 58)]
      .map(([x0, y0, x1, y1]) => ({ x: x0, y: y0, w: x1 - x0, h: y1 - y0, img: og.createImageData(x1 - x0, y1 - y0) }));
    const mark = new Uint8Array(n), dyn = [];
    for (const R of rects) for (let y = R.y; y < R.y + R.h; y++) for (let x = R.x; x < R.x + R.w; x++) { const k = ID[y * W + x]; if (k >= 0 && !mark[k]) { mark[k] = 1; dyn.push(k); } }
    S = { sb, bc, bg, oc, og, ID, SH, SO, TCr, TCg, TCb, color, rects, dyn: Int32Array.from(dyn), n, strip: borderStrip(), cupSp: cupSprite(), ms: performance.now() - t0 };
    window.__rm_stats = { tiles: n, dynTiles: dyn.length, buildMs: Math.round(S.ms), rects: rects.map(R => [R.x, R.y, R.w, R.h]) };
  }
  // Outer border: tile strip with scroll period 81px (tile layout repeats every 81px), translated by phase each frame —
  // tiles travel with the pattern like a conveyor, clearer than fixed tiles changing color (7.6px tiles quantize away 1–3px/frame phase motion).
  function borderStrip() {
    const NP = 26, SL = PER * NP, NR = 11, bs = BW / NR;
    const pc = P.canvas(SL, BW), pg = pc.getContext('2d', { willReadFrequently: true });
    pg.fillStyle = C.bW; pg.fillRect(0, 0, SL, BW); pg.fillStyle = C.bK; pg.fillRect(0, 0, SL, 8); pg.fillRect(0, 66, SL, BW - 66);
    pg.strokeStyle = C.bK; pg.lineWidth = 13; pg.lineCap = 'round'; pg.lineJoin = 'round';
    for (let k = -1; k <= NP; k++) { const u0 = k * PER, cx = u0 + PER * 0.52, cy = 38, r0 = 24;
      pg.beginPath(); pg.moveTo(u0 - 6, 68); pg.quadraticCurveTo(u0 + 2, 42, cx - r0, cy);
      for (let th = Math.PI; th <= Math.PI * 3.25; th += 0.14) { const r = r0 - (th - Math.PI) / (Math.PI * 2.25) * (r0 - 5); pg.lineTo(cx + Math.cos(th) * r, cy + Math.sin(th) * r); } pg.stroke(); }
    const pd = pg.getImageData(0, 0, SL, BW).data;
    const sc = P.canvas(SL, BW), g = sc.getContext('2d');
    g.fillStyle = 'rgb(112,103,92)'; g.fillRect(0, 0, SL, BW);
    for (let j = 0; j < NR; j++) {
      const r = rng(500 + j), n = Math.round(PER / bs), ws = Array.from({ length: n }, () => 0.84 + r() * 0.32), sum = ws.reduce((a, b) => a + b, 0);
      const tiles = []; let u = (j % 2) * bs * 0.5;
      ws.forEach(w0 => { const w = w0 / sum * PER; tiles.push([u, w, Array.from({ length: 8 }, () => (r() - .5) * 1.4), (r() - .5) * 0.12, (r() - .5) * 14]); u += w; });
      for (let k = -1; k <= NP; k++) for (const [u0, w, jt, jl, ja] of tiles) {
        const x0 = k * PER + u0, y0 = j * bs, cx = x0 + w / 2, cy = y0 + bs / 2;
        if (cx < -w || cx > SL + w) continue;
        const o = (Math.min(BW - 1, cy | 0) * SL + Math.max(0, Math.min(SL - 1, cx | 0))) * 4, f = 1 + jl;
        const col = [pd[o] * f + ja, pd[o + 1] * f + ja, pd[o + 2] * f + ja], q = [[x0 + 0.9, y0 + 0.9], [x0 + w - 0.9, y0 + 0.9], [x0 + w - 0.9, y0 + bs - 0.9], [x0 + 0.9, y0 + bs - 0.9]].map((p, i) => [p[0] + jt[i * 2] * 0.6, p[1] + jt[i * 2 + 1] * 0.6]);
        g.fillStyle = P.rgb(col); g.beginPath(); q.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.fill();
        g.strokeStyle = P.rgb(P.mix(col, [255, 255, 255], 0.22)); g.lineWidth = 1; g.beginPath(); g.moveTo(...q[0]); g.lineTo(...q[1]); g.stroke();
        g.strokeStyle = P.rgb(P.mix(col, [0, 0, 0], 0.18)); g.beginPath(); g.moveTo(...q[3]); g.lineTo(...q[2]); g.stroke();
      }
    }
    return sc;
  }
  // Cup: 4.4px mosaic sprite (dark outline tiles + gold bowl + bright rim + handles + foot), moves with hand
  const CSC = 1.3, CSP = [80, 24];
  function cupSprite() {
    const w = 170, h = 110, fc = P.canvas(w, h), fg = fc.getContext('2d', { willReadFrequently: true });
    fg.translate(CSP[0], CSP[1]); fg.scale(CSC, CSC);
    const cw = 46, ch = 38;
    fg.lineJoin = 'round'; fg.lineCap = 'round';
    fg.strokeStyle = C.outline; fg.lineWidth = 11; [-1, 1].forEach(d => { fg.beginPath(); fg.arc(d * cw * 0.5, ch * 0.28, ch * 0.27, d < 0 ? Math.PI * 0.5 : -Math.PI * 0.5, d < 0 ? Math.PI * 1.5 : Math.PI * 0.5); fg.stroke(); });
    fg.strokeStyle = C.gold; fg.lineWidth = 5; [-1, 1].forEach(d => { fg.beginPath(); fg.arc(d * cw * 0.5, ch * 0.28, ch * 0.27, d < 0 ? Math.PI * 0.5 : -Math.PI * 0.5, d < 0 ? Math.PI * 1.5 : Math.PI * 0.5); fg.stroke(); });
    const bowl = new Path2D(); bowl.moveTo(-cw / 2, 0); bowl.quadraticCurveTo(-cw * 0.46, ch * 0.74, 0, ch * 0.74); bowl.quadraticCurveTo(cw * 0.46, ch * 0.74, cw / 2, 0); bowl.closePath();
    const foot = new Path2D(); foot.rect(-4, ch * 0.7, 8, ch * 0.3); foot.ellipse(0, ch * 1.02, cw * 0.3, 5, 0, 0, Math.PI * 2);
    fg.lineWidth = 6; fg.strokeStyle = C.outline; fg.stroke(bowl); fg.stroke(foot);
    fg.fillStyle = C.gold; fg.fill(bowl); fg.fill(foot);
    fg.save(); fg.clip(bowl); fg.fillStyle = C.gold2; fg.fillRect(cw * 0.12, 0, cw, ch); fg.fillStyle = '#f4d77a'; fg.fillRect(-cw * 0.36, 6, 6, ch * 0.5); fg.restore();
    fg.fillStyle = '#f2d77c'; fg.beginPath(); fg.ellipse(0, 0, cw / 2, 5.5, 0, 0, Math.PI * 2); fg.fill(); fg.strokeStyle = C.outline; fg.lineWidth = 4; fg.stroke();
    fg.fillStyle = '#7a5418'; fg.beginPath(); fg.ellipse(0, 0.5, cw / 2 - 6, 2.6, 0, 0, Math.PI * 2); fg.fill();
    const fd = fg.getImageData(0, 0, w, h).data, sp = P.canvas(w, h), sg = sp.getContext('2d'), ts = 4.4, r = rng(91);
    // Grout base: only inside cup shape (alpha)
    sg.drawImage(fc, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = 'rgb(96,86,74)'; sg.fillRect(0, 0, w, h); sg.globalCompositeOperation = 'source-over';
    for (let y = 0; y < h; y += ts) for (let x = ((y / ts) % 2) * ts * 0.5 - ts; x < w; x += ts) {
      const cx = x + ts / 2, cy = y + ts / 2; if (cx < 0 || cx >= w || cy >= h) continue;
      const o = ((cy | 0) * w + (cx | 0)) * 4; if (fd[o + 3] < 110) continue;
      const f = 1 + (r() - .5) * 0.12; sg.fillStyle = P.rgb([fd[o] * f, fd[o + 1] * f, fd[o + 2] * f]);
      sg.fillRect(x + 0.6 + (r() - .5) * 0.5, y + 0.6 + (r() - .5) * 0.5, ts - 1.2, ts - 1.2);
    }
    return sp;
  }
  function steamTiles(c, cup, t, a) {            // White-tile steam: two columns of squares rising along a sine wave
    if (a < 0.03) return;
    c.save(); c.globalAlpha = a;
    for (let k = 0; k < 2; k++) for (let i = 0; i < 7; i++) {
      const q = ((i + (t * 2.2) % 1) / 7), x = cup.x - 9 + k * 18 + Math.sin(t * 6 + k * 2.2 - q * 6) * 9 * q, y = cup.y - 12 - q * 76, s = 7 - q * 2;
      c.globalAlpha = a * (1 - q * 0.7); c.fillStyle = 'rgb(96,86,74)'; c.fillRect(x - s / 2 - 1, y - s / 2 - 1, s + 2, s + 2); c.fillStyle = '#fbf8f0'; c.fillRect(x - s / 2, y - s / 2, s, s);
    }
    c.restore();
  }
  function edt(F, w, h) {                                 // 2D squared Euclidean distance transform (Felzenszwalb–Huttenlocher)
    const n = Math.max(w, h), f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
    const pass = (len) => { let k = 0; v[0] = 0; z[0] = -1e30; z[1] = 1e30;
      for (let q = 1; q < len; q++) { let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); } k++; v[k] = q; z[k] = s; z[k + 1] = 1e30; }
      k = 0; for (let q = 0; q < len; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; } };
    const out = new Float64Array(w * h);
    for (let x = 0; x < w; x++) { for (let y = 0; y < h; y++) f[y] = F[y * w + x]; pass(h); for (let y = 0; y < h; y++) out[y * w + x] = d[y]; }
    for (let y = 0; y < h; y++) { for (let x = 0; x < w; x++) f[x] = out[y * w + x]; pass(w); for (let x = 0; x < w; x++) out[y * w + x] = d[x]; }
    return out;
  }

  return {
    init() { if (!S) build(); },
    draw(c, lt, t) {
      if (!S) build();
      const { bg, og, ID, SH, SO, TCr, TCg, TCb } = S;
      fullBase(bg, S.sb, lt, t);
      const bd = bg.getImageData(0, 0, W, H).data;
      const dyn = S.dyn; for (let i = 0; i < dyn.length; i++) S.color(dyn[i], bd);
      for (const R of S.rects) {
        const dd = R.img.data; let o = 0;
        for (let y = R.y; y < R.y + R.h; y++) { let p = y * W + R.x; for (let x = 0; x < R.w; x++, p++, o += 4) {
          const k = ID[p];
          if (k < 0) { const q = p * 4; dd[o] = SO[q]; dd[o + 1] = SO[q + 1]; dd[o + 2] = SO[q + 2]; }
          else { const sh = SH[p]; dd[o] = (TCr[k] * sh) >> 7; dd[o + 1] = (TCg[k] * sh) >> 7; dd[o + 2] = (TCb[k] * sh) >> 7; }
          dd[o + 3] = 255;
        } }
        og.putImageData(R.img, R.x, R.y);
      }
      c.drawImage(S.oc, 0, 0);
      // Border conveyor: same periodic tile strip in local clockwise coordinates on each side, translated by phase
      const off = ((borderPhase(lt) % PER) + PER) % PER;
      for (const [a, b, c2, d, e, f, len] of SIDES) { c.save(); c.transform(a, b, c2, d, e, f); c.beginPath(); c.rect(BW, 0, len - 2 * BW, BW); c.clip(); c.drawImage(S.strip, BW - 2 * PER + off, 0); c.restore(); }
      // Cup sprite and steam (follow hand)
      const { ch, G } = poses(lt, t), AP = armPose(G, ch.cup);
      c.save(); c.translate(AP.cup.x, AP.cup.y); c.rotate(AP.cup.tilt); c.drawImage(S.cupSp, -CSP[0], -CSP[1]); c.restore();
      steamTiles(c, AP.cup, t, 1 - ch.cup * 0.85);
    },
  };
})();
