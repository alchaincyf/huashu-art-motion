// 1988 Ghibli-style hand-painted watercolor backgrounds (Miyazaki/Oga summer room) — entirely procedural.
// Pipeline: ① cached base: paper → watercolor wash (midpoint-displaced polygons × low-α multiply layers, each with a faint outline = tide marks)
//        → blue sky, cumulonimbus (opaque white with translucent blue-gray bottoms), distant hills, grassy slope, large camphor tree; interior plaster, wooden floor, broom, small shelf
//      → ② animated motifs (white sheer curtains billow, grass sways in groups, clouds drift, tree crown rocks, dappled shadows flicker on wall, daisies nod, hair and red bow flutter)
//      → ③ characters: two-tone cel shading (base color plus crescent shadow from path minus lightward-shifted self), thin warm-brown outlines
SCENES['25_ghibli'] = (() => {
  const W = 1920, H = 1080, { clamp, lerp, ease, rng } = U, P = PAINT, TAU = Math.PI * 2;
  const FLOOR = 720, WIN = [370, 140, 420, 400];
  const LINE = '#6a4a38';

  // Watercolor: P.watercolor (midpoint-displaced polygons × low-α multiply layers and tide-mark edges), P.deform, P.rectPts / P.ellipsePts
  const deform = P.deform, wash = P.watercolor, rect = P.rectPts, ellipsePts = P.ellipsePts;
  const fillPts = (g, pts) => { g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); };

  // ---------- Cloud (cached sprite): opaque white shapes with translucent blue-gray bottoms ----------
  const cloud = (key, w, h, seed) => P.cached('gh_cloud_' + key, w, h, (g) => {
    const r = rng(seed), puffs = [];
    for (let i = 0; i < 16; i++) { const x = w * (0.15 + r() * 0.7), base = h * 0.78, yy = base - Math.sin((x / w) * Math.PI) * h * (0.35 + r() * 0.3); puffs.push([x, yy, 30 + r() * 46]); }
    puffs.push([w * 0.5, h * 0.72, w * 0.36]);
    puffs.forEach(([x, y, rr], i) => wash(g, ellipsePts(x, y, rr, rr * 0.82, 14), '#ffffff', { layers: 3, alpha: 0.9, amp: 6, seed: seed + i, edge: 0, blend: 'source-over' }));
    g.save(); g.globalCompositeOperation = 'source-atop';
    const sh = g.createLinearGradient(0, h * 0.35, 0, h); sh.addColorStop(0, 'rgba(150,175,205,0)'); sh.addColorStop(1, 'rgba(120,145,190,.75)'); g.fillStyle = sh; g.fillRect(0, 0, w, h);
    g.restore();
  });
  // Large camphor tree (cached sprite, pivots at roots when swaying)
  const tree = () => P.cached('gh_tree', 300, 360, (g) => {
    g.fillStyle = '#4a3a2a'; g.fillRect(140, 210, 22, 150);
    const r = rng(77);
    for (let i = 0; i < 22; i++) { const x = 150 + (r() - .5) * 220, y = 150 + (r() - .5) * 170, rr = 34 + r() * 40;
      wash(g, ellipsePts(x, y, rr, rr * 0.8, 12), i % 3 ? '#3f7a3a' : '#2a5a32', { layers: 3, alpha: 0.6, amp: 10, seed: i + 5, edge: 0.15, blend: 'source-over' }); }
    for (let i = 0; i < 14; i++) { const x = 120 + (r() - .5) * 180, y = 110 + (r() - .5) * 120, rr = 18 + r() * 22;
      wash(g, ellipsePts(x, y, rr, rr * 0.7, 10), '#8cc65a', { layers: 2, alpha: 0.45, amp: 6, seed: i + 50, edge: 0, blend: 'source-over' }); }
  });

  // ---------- ① Base ----------
  const bg = () => P.cached('gh_bg', W, H, (g) => {
    g.drawImage(P.texture('gh_paper', '#fbf6ea', { scale: 0.02, amt: 6, grain: 10, seed: 3 }), 0, 0);
    // Interior: warm plaster wall, wash gradient bright by window and dark in corners; overlay 28 heavily deformed translucent blooms (alternating warm yellow/pink/blue-gray glazing)
    const wl = g.createRadialGradient(580, 340, 100, 700, 420, 1500); wl.addColorStop(0, '#fbf3e0'); wl.addColorStop(0.6, '#f1e1bf'); wl.addColorStop(1, '#dcc49a');
    wash(g, rect(-20, -20, W + 40, FLOOR + 30), '#efdcb4', { layers: 5, alpha: 0.4, amp: 12, seed: 2, edge: 0, fill: wl });
    { const r = rng(404), tints = ['#f2c48a', '#e9b4a2', '#b9c9d8', '#f3dca0', '#d6ae80', '#c8d4b0'];
      for (let i = 0; i < 28; i++) { const x = r() * W, y = r() * 600, rx = 90 + r() * 220, ry = 60 + r() * 160;
        if (x > 340 && x < 820 && y > 110 && y < 560) continue;
        wash(g, ellipsePts(x, y, rx, ry, 10), tints[i % tints.length], { layers: 3, alpha: 0.045, amp: 40, seed: 100 + i, edge: 0.04 }); } }
    wash(g, [[1700, -20], [1940, -20], [1940, 740], [1620, 740], [1680, 400]], '#b89a6c', { layers: 4, alpha: 0.06, amp: 60, seed: 3, edge: 0.03 });   // Dark right corner
    wash(g, [[-20, -20], [200, -20], [140, 400], [220, 740], [-20, 740]], '#b89a6c', { layers: 4, alpha: 0.06, amp: 60, seed: 4, edge: 0.03 });
    // Wooden wainscoting (vertical boards below chair rail, each a different tone)
    { const r = rng(505); for (let x = -10; x < W; x += 64) wash(g, rect(x, 588, 62, FLOOR - 588), ['#c08a56', '#b47e4c', '#c99460', '#ad7848'][(r() * 4) | 0], { layers: 3, alpha: 0.32, amp: 3, seed: 200 + x, edge: 0.12 }); }
    wash(g, rect(-20, 576, W + 40, 16), '#8a5a34', { layers: 3, alpha: 0.4, amp: 2, seed: 7, edge: 0.15 });
    // Floor: wash each plank separately
    { const r = rng(606); let y = FLOOR; for (let k = 0; k < 8; k++) { const h = 26 + k * 12; wash(g, rect(-20, y, W + 40, h), ['#a86e3a', '#9a6232', '#b07a44', '#a06836'][(r() * 4) | 0], { layers: 3, alpha: 0.5, amp: 3, seed: 300 + k, edge: 0.14 }); y += h; } }
    // Warm window light on floor (soft edges, crossed mullion shadow)
    g.save(); g.globalCompositeOperation = 'screen'; g.filter = 'blur(10px)'; g.fillStyle = 'rgba(255,236,180,.55)';
    g.beginPath(); g.moveTo(400, 740); g.lineTo(800, 740); g.lineTo(930, 1040); g.lineTo(450, 1040); g.closePath(); g.fill(); g.restore();
    g.save(); g.globalCompositeOperation = 'multiply'; g.filter = 'blur(6px)'; g.fillStyle = 'rgba(190,150,110,.5)';
    g.beginPath(); g.moveTo(596, 740); g.lineTo(606, 740); g.lineTo(700, 1040); g.lineTo(684, 1040); g.closePath(); g.fill(); g.fillRect(420, 880, 470, 10); g.restore();
    wash(g, rect(-20, FLOOR - 26, W + 40, 26), '#9a6a40', { layers: 4, alpha: 0.25, amp: 4, seed: 6, edge: 0.1 });   // Baseboard
    // Outside: blue sky (gradient wash)
    g.save(); g.beginPath(); g.rect(...WIN); g.clip();
    const sky = g.createLinearGradient(0, 140, 0, 440); sky.addColorStop(0, '#3a86d4'); sky.addColorStop(1, '#bfe2f4');
    wash(g, rect(360, 130, 440, 330), '#5a9ad8', { layers: 5, alpha: 0.5, amp: 6, seed: 7, edge: 0, blend: 'source-over', fill: sky });
    // Distant hills (blue-green)
    wash(g, [[360, 430], [420, 400], [500, 410], [560, 385], [640, 402], [720, 380], [800, 400], [800, 470], [360, 470]], '#7aa6a0', { layers: 5, alpha: 0.35, amp: 6, seed: 8, edge: 0.12 });
    // Grassy slope (bright to dark green)
    const gr = g.createLinearGradient(0, 430, 0, 540); gr.addColorStop(0, '#9ccc5a'); gr.addColorStop(1, '#4c8a3a');
    wash(g, [[360, 450], [480, 432], [620, 446], [800, 428], [800, 560], [360, 560]], '#6aa848', { layers: 6, alpha: 0.5, amp: 6, seed: 9, edge: 0.1, blend: 'source-over', fill: gr });
    g.restore();
    // White-painted wooden window frame with blue-green shadows and sill
    const frame = [[346, 116, 468, 24], [346, 116, 24, 446], [790, 116, 24, 446], [575, 140, 10, 400], [370, 330, 420, 9]];
    frame.forEach(([x, y, w, h], i) => wash(g, rect(x, y, w, h), '#f6f1e2', { layers: 3, alpha: 0.95, amp: 2, seed: 20 + i, edge: 0.2, blend: 'source-over' }));
    frame.forEach(([x, y, w, h], i) => wash(g, rect(x + w * 0.55, y, w * 0.45, h), '#9fb8c0', { layers: 2, alpha: 0.25, amp: 2, seed: 30 + i, edge: 0 }));
    wash(g, rect(326, 540, 508, 28), '#f3ecd8', { layers: 3, alpha: 0.95, amp: 2, seed: 40, edge: 0.2, blend: 'source-over' });
    wash(g, rect(326, 556, 508, 12), '#a8b7b8', { layers: 2, alpha: 0.35, amp: 2, seed: 41, edge: 0 });
    // Curtain rod
    g.strokeStyle = '#6a4a30'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(300, 98); g.lineTo(860, 98); g.stroke();
    // Small wooden wall shelf with jars and hanging dried bouquet
    wash(g, rect(1540, 300, 260, 14), '#8a5a34', { layers: 3, alpha: 0.6, amp: 2, seed: 50, edge: 0.15 });
    [[1560, 240, 34, 60, '#6a9ac0'], [1610, 262, 40, 38, '#d8a050'], [1670, 236, 28, 64, '#9ab86a'], [1720, 254, 46, 46, '#c86a50']].forEach(([x, y, w, h, col], i) => wash(g, rect(x, y, w, h), col, { layers: 4, alpha: 0.3, amp: 4, seed: 60 + i, edge: 0.15 }));
    // Broom against wall (Kiki's Delivery Service homage)
    g.save(); g.translate(1760, 330); g.rotate(0.12);
    wash(g, rect(-7, 0, 14, 470), '#7a5030', { layers: 3, alpha: 0.5, amp: 2, seed: 70, edge: 0.2 });
    wash(g, [[-10, 460], [10, 460], [46, 620], [-46, 620]], '#c89a4a', { layers: 4, alpha: 0.45, amp: 5, seed: 71, edge: 0.2 });
    g.strokeStyle = 'rgba(120,80,30,.6)'; g.lineWidth = 1.5; for (let k = -5; k <= 5; k++) { g.beginPath(); g.moveTo(k * 2, 470); g.lineTo(k * 8.5, 616); g.stroke(); }
    g.fillStyle = '#c84a3a'; g.fillRect(-12, 452, 24, 10); g.restore();
    // Wooden table, white tablecloth, chair
    wash(g, rect(842, 640, 22, 265), '#8a5a34', { layers: 3, alpha: 0.6, amp: 3, seed: 80, edge: 0.15 });
    wash(g, rect(1160, 640, 22, 265), '#8a5a34', { layers: 3, alpha: 0.6, amp: 3, seed: 81, edge: 0.15 });
    wash(g, rect(1436, 470, 18, 440), '#7a4c2a', { layers: 3, alpha: 0.6, amp: 3, seed: 82, edge: 0.15 });
    wash(g, rect(1474, 478, 18, 430), '#7a4c2a', { layers: 3, alpha: 0.6, amp: 3, seed: 83, edge: 0.15 });
    wash(g, rect(1290, 744, 210, 16), '#8a5a34', { layers: 3, alpha: 0.6, amp: 3, seed: 84, edge: 0.15 });
    // Overall paper grain (pigment deposits in paper recesses)
    g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.3; g.drawImage(P.texture('gh_gran', '#f4efe2', { scale: 0.06, amt: 18, grain: 26, seed: 9 }), 0, 0); g.restore();
  });
  // Tablecloth (hanging edge sways in breeze, drawn each frame)
  function tablecloth(c, lt) {
    const sw = Math.sin(lt * 5) * 5;
    const pts = [[800, 612], [1214, 612], [1222, 700 + sw], [1150, 712 - sw], [1060, 704 + sw], [980, 714 - sw], [890, 704 + sw], [804, 712 - sw]];
    wash(c, pts, '#fffdf6', { layers: 2, alpha: 0.95, amp: 3, seed: 90, edge: 0.25, blend: 'source-over' });
    wash(c, pts.map(([x, y]) => [x, y + (y > 640 ? 0 : 30)]), '#b8c8d8', { layers: 2, alpha: 0.18, amp: 3, seed: 91, edge: 0 });
  }

  // ---------- ② Curtains: two white sheer panels, hems billow into room ----------
  function curtain(c, side, lt) {
    const x0 = side < 0 ? 300 : 860, inner = side < 0 ? 420 : 740;
    const gust = 0.5 + 0.5 * Math.sin(lt * 5.4 + (side < 0 ? 0 : 1.3));
    const pts = [], N = 14;
    for (let i = 0; i <= N; i++) { const q = i / N, y = 100 + q * 500, bulge = q * q * (60 + 150 * gust), w = Math.sin(lt * 9 + q * 6 + side) * 16 * q;
      pts.push([inner + side * 0 - side * (bulge * 0.15) + w + (side < 0 ? 1 : -1) * bulge * 0.9, y]); }
    for (let i = N; i >= 0; i--) { const q = i / N, y = 100 + q * 500 + (i === N ? 0 : 0); pts.push([x0 + (side < 0 ? -1 : 1) * q * 30 * gust, y + Math.sin(lt * 6 + q * 4) * 4]); }
    c.save(); c.globalAlpha = 0.85;
    wash(c, pts, '#ffffff', { layers: 3, alpha: 0.42, amp: 4, seed: side < 0 ? 101 : 102, edge: 0, blend: 'source-over' });
    c.restore();
    // Fold lines (translucent blue-gray, follow billowing)
    c.save(); c.globalCompositeOperation = 'multiply'; c.strokeStyle = 'rgba(150,175,200,.45)'; c.lineWidth = 3; c.lineCap = 'round';
    for (let k = 1; k < 4; k++) { const f = k / 4; c.beginPath(); for (let i = 0; i <= 10; i++) { const q = i / 10; const a = pts[Math.round(q * N)], b = pts[2 * N + 1 - Math.round(q * N)]; const x = lerp(b[0], a[0], f), y = lerp(b[1], a[1], f); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    c.restore();
  }
  // Grass outside: patches sway together (gusts come intermittently)
  function grass(c, t) {
    c.save(); c.beginPath(); c.rect(...WIN); c.clip(); c.lineCap = 'round';
    const r = rng(5), cols = ['#5c9a3e', '#7fb84a', '#3f7a32', '#9ccc5a', '#4a8a3a'];
    for (let i = 0; i < 360; i++) {
      const x = 360 + r() * 440, y = 470 + r() * 75, h = 16 + r() * 26 + (y - 470) * 0.35, ph = r() * TAU;
      const wind = Math.sin(t * 3.1 - x * 0.018) * 0.5 + 0.5, sway = (0.25 + wind * 0.75) * h * 0.55 + Math.sin(t * 9 + ph) * 2;
      c.strokeStyle = cols[i % 5]; c.lineWidth = 2 + r() * 2;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + sway * 0.3, y - h * 0.6, x + sway, y - h); c.stroke();
    }
    c.restore();
  }
  // Dappled tree light on wall (komorebi): warm-yellow spots screen-blended, positions drift with noise and brightness flickers
  function komorebi(c, t) {
    c.save(); c.globalCompositeOperation = 'screen';
    const r = rng(33);
    for (let i = 0; i < 34; i++) {
      const bx = 830 + r() * 380, by = 160 + r() * 420, rr = 10 + r() * 26;
      const x = bx + P.noise(i * 1.3, t * 0.9) * 26, y = by + P.noise(i * 2.1 + 5, t * 0.9) * 18, a = 0.18 + 0.22 * (0.5 + 0.5 * Math.sin(t * 5 + i * 1.7));
      const gg = c.createRadialGradient(x, y, 0, x, y, rr); gg.addColorStop(0, `rgba(255,236,170,${a})`); gg.addColorStop(1, 'rgba(255,236,170,0)'); c.fillStyle = gg; c.beginPath(); c.ellipse(x, y, rr * 1.3, rr, 0.4, 0, TAU); c.fill();
    }
    c.restore();
  }
  // Daisies in glass bottle on table, flower heads nod
  function daisies(c, t) {
    const vx = 900, vy = 612;
    c.save(); c.fillStyle = 'rgba(190,220,230,.55)'; c.beginPath(); c.moveTo(vx - 16, vy); c.quadraticCurveTo(vx - 22, vy - 30, vx - 10, vy - 46); c.lineTo(vx + 10, vy - 46); c.quadraticCurveTo(vx + 22, vy - 30, vx + 16, vy); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(90,120,140,.6)'; c.lineWidth = 1.5; c.stroke();
    [[-30, -120, 0], [6, -140, 1.3], [34, -112, 2.1], [-8, -100, 3.2]].forEach(([dx, dy, ph]) => {
      const sw = Math.sin(t * 3.2 + ph) * 7, hx = vx + dx + sw, hy = vy + dy + Math.abs(sw) * 0.2;
      c.strokeStyle = '#5a8a3a'; c.lineWidth = 3; c.beginPath(); c.moveTo(vx + dx * 0.2, vy - 40); c.quadraticCurveTo(vx + dx * 0.6, vy + dy * 0.5, hx, hy); c.stroke();
      c.fillStyle = '#fffdf4'; for (let k = 0; k < 10; k++) { const a = k / 10 * TAU + ph; c.beginPath(); c.ellipse(hx + Math.cos(a) * 9, hy + Math.sin(a) * 6, 7, 3, a, 0, TAU); c.fill(); }
      c.fillStyle = '#f2b830'; c.beginPath(); c.arc(hx, hy, 5, 0, TAU); c.fill();
    });
    c.restore();
  }

  // ---------- ③ Cel-shaded characters ----------
  // Two-tone cel shading: P.cel — crescent shadow on shaded side (light from upper left, shadow width (dx,dy)), thin warm-brown outlines
  const cel = (c, p, base, shade, dx = 9, dy = 6, line = true) => P.cel(c, p, base, shade, null, { sd: 1, lx: -dx, ly: -dy, line: LINE, lw: line ? 2.4 : 0 });
  const GP = { skin: '#fde6d2', skinS: '#efbfa4', hair: '#f8dc8c', hairS: '#d9a95a', dress: '#3f8590', dressS: '#2b6470', white: '#fffaf0', whiteS: '#d8dde4', bow: '#d93a30', bowS: '#a0261f' };
  function girl(c, G, ch, lt, t) {
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    cel(c, G.farSleeve, GP.dress, GP.dressS); cel(c, G.farCuff, GP.white, GP.whiteS); cel(c, G.farHand, GP.skin, GP.skinS, 4, 3);
    // Long hair (blown back to right)
    const wind = Math.sin(lt * 3.2) * 0.5 + 0.5;
    const nape = G.A.nape, hd = G.A.headC;
    const flow = new Path2D(); const fp = [[hd[0] + 30, hd[1] - 40], [nape[0] + 50 + wind * 14, nape[1] - 30], [nape[0] + 78 + wind * 30, nape[1] + 40 + Math.sin(t * 6) * 6], [nape[0] + 60 + wind * 26, nape[1] + 120 + Math.sin(t * 5 + 1) * 8], [nape[0] + 20, nape[1] + 130], [nape[0] - 6, nape[1] + 40], [hd[0] + 4, hd[1] + 10]];
    const fpath = RIG.smooth(fp); cel(c, fpath, GP.hair, GP.hairS, 10, 4);
    cel(c, G.skirt, GP.dress, GP.dressS, 16, 8);
    c.strokeStyle = GP.dressS; c.lineWidth = 3; G.folds.forEach(f => c.stroke(f));
    cel(c, G.apronSkirt, GP.white, GP.whiteS, 10, 6);
    cel(c, G.shoe, '#6a3a24', '#4a2414', 4, 2);
    cel(c, G.torso, GP.dress, GP.dressS, 14, 6); cel(c, G.bib, GP.white, GP.whiteS, 6, 4);
    cel(c, G.neck, GP.skin, GP.skinS, 6, 2);
    cel(c, G.hairBack, GP.hair, GP.hairS, 10, 6);
    cel(c, G.face, GP.skin, GP.skinS, 10, 4);
    c.save(); c.clip(G.face); c.fillStyle = 'rgba(240,140,130,.35)'; c.beginPath(); c.ellipse(G.cheek[0], G.cheek[1], 12, 7, 0, 0, TAU); c.fill(); c.restore();
    cel(c, G.bangs, GP.hair, GP.hairS, 6, 6);
    c.strokeStyle = GP.hairS; c.lineWidth = 2; G.hairLines.forEach(h => c.stroke(h));
    // Red bow above back of head, ribbons flutter
    const bc = [G.A.headTop[0] + 46, G.A.headTop[1] + 14];
    const tails = [[bc[0] + 6, bc[1] + 8], [bc[0] + 40 + wind * 18, bc[1] + 44 + Math.sin(t * 8) * 6], [bc[0] + 26 + wind * 10, bc[1] + 54], [bc[0] + 2, bc[1] + 14]];
    cel(c, RIG.smooth(tails), GP.bow, GP.bowS, 4, 3);
    [[-1, -0.5], [1, 0.4]].forEach(([s, rot]) => { const p = new Path2D(); p.ellipse(bc[0] + s * 24, bc[1] - 4, 26, 15, rot, 0, TAU); cel(c, p, GP.bow, GP.bowS, 5, 4); });
    { const p = new Path2D(); p.arc(bc[0], bc[1], 9, 0, TAU); cel(c, p, GP.bow, GP.bowS, 2, 2); }
    // Facial features (Ghibli-style: large simple eyes)
    if (ch.blink) { c.strokeStyle = LINE; c.lineWidth = 3; c.beginPath(); c.arc(G.eye.x, G.eye.y - 2, 7, 0.2, Math.PI - 0.2); c.stroke(); }
    else { c.fillStyle = '#3a2a24'; c.beginPath(); c.ellipse(G.eye.x - 1, G.eye.y + 1, 5, 7.5, 0, 0, TAU); c.fill(); c.fillStyle = '#5a8ac8'; c.beginPath(); c.ellipse(G.eye.x - 1, G.eye.y + 3, 3.5, 4, 0, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(G.eye.x - 2.5, G.eye.y - 2, 2, 0, TAU); c.fill();
      c.strokeStyle = LINE; c.lineWidth = 2.8; c.stroke(G.lid); }
    c.strokeStyle = '#c08a40'; c.lineWidth = 2.4; c.stroke(G.brow);
    c.strokeStyle = '#a8443a'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(...G.lips[0]); c.lineTo(G.lips[1][0] - 1, G.lips[1][1] + 2); c.stroke();
    cel(c, G.upperArm, GP.dress, GP.dressS, 8, 6); cel(c, G.foreArm, GP.dress, GP.dressS, 8, 6); cel(c, G.cuff, GP.white, GP.whiteS, 4, 3);
    cel(c, G.hand, GP.skin, GP.skinS, 4, 3);
    RIG.drawCup(c, G.cup, { body: '#fdf8ee', rim: '#7a4a2a', line: LINE, lw: 2.2, hw: 6 });
    c.save(); c.translate(G.cup.x, G.cup.y); c.rotate(G.cup.tilt); c.strokeStyle = '#5a8ac8'; c.lineWidth = 3; c.beginPath(); c.moveTo(-G.cup.w * 0.45, G.cup.h * 0.35); c.lineTo(G.cup.w * 0.45, G.cup.h * 0.35); c.stroke(); c.restore();
    c.fillStyle = GP.skin; c.beginPath(); c.arc(G.thumb[0], G.thumb[1], 7, 0, TAU); c.fill(); c.strokeStyle = LINE; c.lineWidth = 2; c.stroke();
    c.restore();
  }
  function cat(c, K) {
    const O = '#f3a24c', OS = '#d27a2c', Wt = '#fffaf2', WS = '#e2d8ca';
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    c.strokeStyle = LINE; c.lineWidth = K.tailW + 5; c.stroke(K.tail); c.strokeStyle = O; c.lineWidth = K.tailW; c.stroke(K.tail);
    const tip = K.tailPts[K.tailPts.length - 1]; c.fillStyle = Wt; c.beginPath(); c.arc(tip[0], tip[1], K.tailW / 2, 0, TAU); c.fill();
    cel(c, K.body, O, OS, 18, 10);
    c.save(); c.clip(K.body); c.strokeStyle = '#c8682a'; c.lineWidth = 8; K.stripes.slice(3).forEach(s => { c.beginPath(); c.moveTo(...s[0]); c.lineTo(...s[1]); c.stroke(); }); c.restore();
    K.legs.forEach(l => cel(c, l, Wt, WS, 6, 3));
    c.save(); c.clip(K.body); cel(c, K.white, Wt, WS, 10, 6, false); c.restore();
    cel(c, K.head, O, OS, 12, 8);
    c.save(); c.clip(K.head); c.fillStyle = Wt; c.beginPath(); c.ellipse(K.nose[0] - 22, K.nose[1] + 12, 36, 26, 0, 0, TAU); c.fill(); c.restore();
    c.strokeStyle = LINE; c.lineWidth = 2.4; c.stroke(K.head);
    c.fillStyle = '#f2a8a0'; K.earInner.forEach(e => { c.beginPath(); e.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.fill(); });
    c.strokeStyle = '#c8682a'; c.lineWidth = 6; K.stripes.slice(0, 3).forEach(s => { c.beginPath(); c.moveTo(...s[0]); c.lineTo(...s[1]); c.stroke(); });
    K.eyes.forEach(e => { if (K.blink) { c.strokeStyle = LINE; c.lineWidth = 3; c.beginPath(); c.arc(e.x, e.y - 2, 8, 0.2, Math.PI - 0.2); c.stroke(); }
      else { c.fillStyle = '#2a1a12'; c.beginPath(); c.ellipse(e.x, e.y, 6, 8, 0, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(e.x - 2, e.y - 3, 2.4, 0, TAU); c.fill(); } });
    c.fillStyle = '#d8746a'; c.beginPath(); c.arc(K.nose[0], K.nose[1], 5, 0, TAU); c.fill();
    c.strokeStyle = LINE; c.lineWidth = 2; c.beginPath(); c.moveTo(...K.mouth[0]); c.quadraticCurveTo(...K.mouth[1], ...K.mouth[2]); c.stroke();
    c.lineWidth = 1.4; K.whiskers.forEach(w => { c.beginPath(); c.moveTo(...w[0]); c.lineTo(...w[1]); c.stroke(); });
    c.restore();
  }

  // Translucent blooms multiply-blended onto characters for uneven watercolor fill
  const charBloom = () => P.cached('gh_charBloom', W, H, (g) => { const r = rng(808); for (let i = 0; i < 40; i++) { const x = 380 + r() * 1120, y = 280 + r() * 660; wash(g, ellipsePts(x, y, 30 + r() * 70, 24 + r() * 50, 9), ['#e8b890', '#a8c0d8', '#f0d0a0', '#c8a8c0'][i % 4], { layers: 2, alpha: 0.1, amp: 16, seed: 900 + i, edge: 0.08 }); } });
  return {
    draw(c, lt, t) {
      const ch = P.choreo(lt, t);
      c.drawImage(bg(), 0, 0);
      // Outside: clouds drift, tree rocks, grass sways (all within window opening)
      c.save(); c.beginPath(); c.rect(...WIN); c.clip();
      c.drawImage(cloud('a', 380, 230, 11), 300 + t * 22, 150); c.drawImage(cloud('b', 260, 160, 23), 590 + t * 30, 210);
      c.save(); c.translate(700, 540); c.rotate(Math.sin(t * 2.4) * 0.025); c.drawImage(tree(), -150, -360); c.restore();
      c.restore();
      grass(c, t);
      // Window mullion overlays exterior (take frame strips from cached base again to keep tree and clouds behind them)
      c.save(); c.beginPath(); [[575, 140, 10, 400], [370, 330, 420, 9]].forEach(r => c.rect(...r)); c.clip(); c.drawImage(bg(), 0, 0); c.restore();
      komorebi(c, t);
      curtain(c, -1, lt); curtain(c, 1, lt);
      tablecloth(c, lt);
      daisies(c, t);
      // Draw characters offscreen, then multiply watercolor grain and translucent blooms through character silhouettes: cel flats become watercolor fills
      const L = P.scratch('ghChars'), cl = L.getContext('2d'); cl.reset(); cl.clearRect(0, 0, W, H);
      const K = RIG.cat({ tail: ch.tail, blink: ch.blink, breathe: ch.breathe });
      cat(cl, K);
      const G = RIG.girl({ cup: ch.cup, sip: ch.sip, breathe: ch.breathe, hair: 'long' });
      girl(cl, G, ch, lt, t);
      c.drawImage(L, 0, 0);
      // Multiply texture only onto characters: destination-in silhouette, then multiply back (source-atop overlays paper color and whitens characters, found in first version)
      P.textureInside(c, L, mg => { mg.globalAlpha = 0.8; mg.drawImage(P.texture('gh_gran', '#f4efe2', { scale: 0.06, amt: 18, grain: 26, seed: 9 }), 0, 0); mg.globalAlpha = 1; mg.drawImage(charBloom(), 0, 0); }, { key: 'ghCharTex' });
      P.steam(c, t, G.cup.x, G.cup.y - 8, { h: 60, n: 2, color: 'rgba(255,255,255,.75)', width: 3.5, spread: 12, wobble: 8 });
      // Soft light: warm screen-blended glow from window
      c.save(); c.globalCompositeOperation = 'screen'; const lg = c.createRadialGradient(580, 340, 60, 580, 340, 900); lg.addColorStop(0, 'rgba(255,240,200,.28)'); lg.addColorStop(1, 'rgba(255,240,200,0)'); c.fillStyle = lg; c.fillRect(0, 0, W, H); c.restore();
    },
  };
})();
