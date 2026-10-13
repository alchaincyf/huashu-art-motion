// 1931 Dalí Surrealism (The Persistence of Memory) — entirely procedural.
// Pipeline: ① cached base (ultramarine-to-pale-yellow sky, glass-still sea, golden Cap de Creus rocks, ochre wasteland, ruined wall with window, stone-block table)
//      → ② long shadows: shear-affine projection of each object's silhouette onto ground (kx grows with time = slowly lengthening shadow); composite offscreen first, then apply shared opacity to avoid darker overlaps
//      → ③ melting clocks: disk (u,v) mapped to screen with a fold; portions beyond edge hang down and sag further over time; ticks and hands follow same mapping
//      → ④ animated motifs (sagging clocks and turning hands, stilt-legged elephants walking on horizon, ants circling pocket watch, lengthening shadows)
//      → ⑤ characters: academic volume without outlines (linear gradients and blurred strokes clipped inside paths for inner shading), fine facial features
SCENES['23_dali'] = (() => {
  const W = 1920, H = 1080, { clamp, lerp, ease } = U, P = PAINT, TAU = Math.PI * 2;
  const HZ = 560, GROUND = 592;                          // Horizon and shoreline
  const C = { sky0: '#22407c', sky1: '#5f88bd', sky2: '#e9dcae', sea: '#6f8fa6', ground0: '#d2ad70', ground1: '#7a5129', shadow: '#2a1a10',
    wall: '#e7dcc3', wallD: '#a99a7c', wood: '#7a4a24', woodL: '#a8703a', block: '#8a5a32', blockL: '#b98754', gold: '#d9b25a', dial: '#efe6c8', orange: '#d8621f' };

  const vol = P.vol;   // Volumetric fill: linear gradient and blurred dark edge inside path (academic style, no outlines)

  // ---------- ① Base ----------
  const bg = () => P.cached('dali_bg', W, H, (g) => {
    const sg = g.createLinearGradient(0, 0, 0, HZ); sg.addColorStop(0, C.sky0); sg.addColorStop(0.55, C.sky1); sg.addColorStop(1, C.sky2);
    g.fillStyle = sg; g.fillRect(0, 0, W, HZ + 2);
    // Thin elongated pink clouds
    [[200, 300, 260, 7], [700, 250, 340, 6], [1280, 330, 300, 8], [900, 420, 420, 5]].forEach(([x, y, w, h]) => { const rg = g.createLinearGradient(x - w, 0, x + w, 0); rg.addColorStop(0, 'rgba(250,215,200,0)'); rg.addColorStop(0.5, 'rgba(250,215,200,.55)'); rg.addColorStop(1, 'rgba(250,215,200,0)'); g.fillStyle = rg; g.beginPath(); g.ellipse(x, y, w, h, 0, 0, TAU); g.fill(); });
    // Still sea (glassy, a few highlight lines)
    const mg = g.createLinearGradient(0, HZ, 0, GROUND); mg.addColorStop(0, '#8aa6b8'); mg.addColorStop(1, '#4f6f86'); g.fillStyle = mg; g.fillRect(0, HZ, W, GROUND - HZ);
    g.strokeStyle = 'rgba(240,235,210,.6)'; g.lineWidth = 1.5; [568, 574, 583].forEach((y, k) => { g.beginPath(); g.moveTo(80 + k * 140, y); g.lineTo(700 + k * 200, y); g.stroke(); });
    // Cap de Creus rocks (right, golden, smooth highlights)
    const cliff = new Path2D(); cliff.moveTo(1380, GROUND); [[1420, 540], [1470, 500], [1520, 470], [1590, 460], [1640, 430], [1700, 440], [1760, 410], [1830, 430], [1920, 420], [1920, GROUND]].forEach(p => cliff.lineTo(...p)); cliff.closePath();
    vol(g, cliff, 1400, 420, 1500, 600, '#e8c27a', '#9a6a34', 'rgba(70,40,15,.5)', 18);
    g.strokeStyle = 'rgba(255,240,200,.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(1470, 505); g.quadraticCurveTo(1530, 480, 1590, 470); g.moveTo(1650, 440); g.quadraticCurveTo(1700, 445, 1760, 418); g.stroke();
    // Wasteland: dark foreground, bright distance, a few fine strata lines
    const gg = g.createLinearGradient(0, GROUND, 0, H); gg.addColorStop(0, C.ground0); gg.addColorStop(0.45, '#a87a44'); gg.addColorStop(1, C.ground1); g.fillStyle = gg; g.fillRect(0, GROUND, W, H - GROUND);
    g.strokeStyle = 'rgba(90,55,25,.25)'; g.lineWidth = 2; for (let k = 0; k < 9; k++) { const y = GROUND + Math.pow(k / 9, 1.6) * 480 + 10; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(600, y - 6, 1300, y + 8, W, y - 2); g.stroke(); }
    // Canvas texture and warm varnish
    g.fillStyle = 'rgba(255,200,120,.06)'; g.fillRect(0, 0, W, H);
    g.drawImage(P.grain('dali', 0.05, [70, 45, 20], 0.10), 0, 0);
  });

  const wallLayer = () => P.cached('dali_wall', W, H, (g) => {
    // Ruined wall fragment (window opening, standing on wasteland, baseline y=700)
    const wall = new Path2D(); wall.moveTo(300, 700); [[300, 120], [330, 96], [372, 108], [410, 78], [470, 92], [540, 70], [610, 88], [680, 64], [760, 90], [820, 80], [858, 104], [860, 700]].forEach(p => wall.lineTo(...p)); wall.closePath();
    wall.rect(370, 140, 420, 400);                         // Window opening (cut out with evenodd)
    g.save(); const wg = g.createLinearGradient(300, 0, 860, 0); wg.addColorStop(0, '#f4ead2'); wg.addColorStop(1, '#cdbf9f'); g.fillStyle = wg; g.fill(wall, 'evenodd'); g.restore();
    g.fillStyle = '#9d8c6c'; g.beginPath(); g.moveTo(860, 104); g.lineTo(892, 120); g.lineTo(892, 712); g.lineTo(860, 700); g.closePath(); g.fill();   // Wall side
    g.strokeStyle = 'rgba(110,90,60,.55)'; g.lineWidth = 1.6; [[[330, 300], [352, 340], [344, 390], [360, 430]], [[820, 600], [800, 640], [812, 690]], [[640, 92], [652, 118], [646, 136]]].forEach(cr => { g.beginPath(); cr.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.stroke(); });
    // Inside window: same landscape (brighter and farther) and frame
    g.save(); g.beginPath(); g.rect(370, 140, 420, 400); g.clip();
    const ig = g.createLinearGradient(0, 140, 0, 540); ig.addColorStop(0, '#3d64a2'); ig.addColorStop(0.85, '#f0e1b4'); ig.addColorStop(1, '#f6ecc8'); g.fillStyle = ig; g.fillRect(370, 140, 420, 400);
    g.fillStyle = '#7f9db3'; g.fillRect(370, 505, 420, 35); g.strokeStyle = 'rgba(250,245,220,.7)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(400, 515); g.lineTo(600, 515); g.moveTo(520, 528); g.lineTo(760, 528); g.stroke();
    // Floating egg in window (Dalí motif)
    const eg = g.createRadialGradient(560, 300, 6, 580, 330, 70); eg.addColorStop(0, '#fffaf0'); eg.addColorStop(1, '#bfae8e'); g.fillStyle = eg; g.beginPath(); g.ellipse(580, 330, 46, 60, 0, 0, TAU); g.fill();
    g.restore();
    g.lineWidth = 18; g.strokeStyle = C.wood; g.strokeRect(361, 131, 438, 418); g.lineWidth = 4; g.strokeStyle = C.woodL; g.strokeRect(356, 126, 448, 428);
    g.fillStyle = C.woodL; g.fillRect(340, 548, 480, 18); g.fillStyle = C.wood; g.fillRect(340, 566, 480, 12);
    // Dead olive branch: extends upper right from wall top (supports melting clock)
    g.strokeStyle = '#4a3020'; g.lineCap = 'round'; g.lineWidth = 12; g.beginPath(); g.moveTo(850, 112); g.bezierCurveTo(900, 90, 960, 104, 1040, 96); g.stroke();
    g.lineWidth = 6; g.beginPath(); g.moveTo(960, 100); g.quadraticCurveTo(990, 70, 1000, 46); g.moveTo(1010, 98); g.lineTo(1070, 112); g.stroke();
  });
  const blockLayer = () => P.cached('dali_block', W, H, (g) => {
    // Stone-block table: top and front (light from left)
    g.fillStyle = C.blockL; g.beginPath(); g.moveTo(810, 620); g.lineTo(1205, 620); g.lineTo(1190, 600); g.lineTo(826, 600); g.closePath(); g.fill();
    const bk = new Path2D(); bk.rect(810, 620, 395, 285); vol(g, bk, 810, 0, 1205, 0, '#b07a46', '#6e4422', 'rgba(40,20,8,.5)', 22);
    // Girl's stool (dark wooden block)
    const st = new Path2D(); st.rect(1300, 742, 190, 163); vol(g, st, 1300, 0, 1490, 0, '#8a5a32', '#4a2c14', 'rgba(30,15,5,.5)', 16);
  });

  // ---------- ③ Melting clock: disk-local (u,v) within radius R → screen; v beyond fold hangs down ----------
  function softMap(o, sag) {
    const { cx, cy, R, fold, top = 0.32, flare = -0.12, drip = 0.18 } = o;   // flare<0: hanging section spreads outward like soft fabric, lower edge rounded rather than pointed
    return (u, v) => {
      if (v <= fold) return [cx + u, cy + v * top + Math.sin(u * 0.05) * 2];
      const d = v - fold, q = d / R;
      return [cx + u * (1 - flare * q) + Math.sin(q * 3) * 5 * sag, cy + fold * top + d * (0.62 + 0.3 * sag) + sag * R * drip * Math.exp(-(((u + R * 0.2) / (R * 0.6)) ** 2)) * q * q + Math.sin(u * 0.06 + 1) * 6 * q];
    };
  }
  function softClock(c, o, sag, t, handSpeed) {
    const m = softMap(o, sag), R = o.R;
    const ring = (r) => { const pts = []; for (let i = 0; i <= 120; i++) { const a = i / 120 * TAU; pts.push(m(Math.cos(a) * r, Math.sin(a) * r)); } return pts; };
    const path = pts => { const p = new Path2D(); pts.forEach((q, i) => i ? p.lineTo(...q) : p.moveTo(...q)); p.closePath(); return p; };
    const outer = path(ring(R)), inner = path(ring(R * 0.86));
    // Cast shadow (soft, hugging surface)
    c.save(); c.translate(-8, 10); c.fillStyle = 'rgba(30,15,5,.35)'; c.filter = 'blur(6px)'; c.fill(outer); c.restore();
    vol(c, outer, o.cx - R, 0, o.cx + R, 0, '#f0d27c', '#9a7426', 'rgba(70,45,10,.5)', 8);
    const fg = c.createLinearGradient(0, o.cy - R * 0.3, 0, o.cy + R * 1.4); fg.addColorStop(0, '#f6efd6'); fg.addColorStop(0.45, '#e8dcb6'); fg.addColorStop(1, '#bfae84');
    c.fillStyle = fg; c.fill(inner);
    // Tick marks and Roman numeral points follow same mapping
    c.fillStyle = '#3a2a18';
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU - Math.PI / 2, p0 = m(Math.cos(a) * R * 0.74, Math.sin(a) * R * 0.74), p1 = m(Math.cos(a) * R * 0.8, Math.sin(a) * R * 0.8);
      c.strokeStyle = '#3a2a18'; c.lineWidth = k % 3 ? 2 : 4; c.beginPath(); c.moveTo(...p0); c.lineTo(...p1); c.stroke(); }
    // Hands (sampled along mapping into soft lines)
    const hand = (ang, len, w) => { c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); for (let i = 0; i <= 12; i++) { const r = len * i / 12, q = m(Math.cos(ang) * r, Math.sin(ang) * r); i ? c.lineTo(...q) : c.moveTo(...q); } c.stroke(); };
    c.strokeStyle = '#2a1c10'; hand(t * handSpeed - 1.2, R * 0.66, 4); hand(t * handSpeed / 12 + 0.6, R * 0.46, 6);
    const cc = m(0, 0); c.fillStyle = '#2a1c10'; c.beginPath(); c.arc(cc[0], cc[1], 4, 0, TAU); c.fill();
    // Highlight along fold (soft ridge)
    c.strokeStyle = 'rgba(255,250,225,.55)'; c.lineWidth = 3; c.beginPath(); for (let i = 0; i <= 30; i++) { const u = -R * 0.9 + i / 30 * R * 1.8, q = m(u, o.fold + 2); i ? c.lineTo(...q) : c.moveTo(...q); } c.stroke();
    return outer;
  }

  // ---------- Stilt-legged elephant ----------
  function elephant(c, x, lt) {
    const y = 400, legH = GROUND - 2 - y;
    c.save(); c.fillStyle = '#5a4a46'; c.strokeStyle = '#5a4a46'; c.lineCap = 'round';
    // Four long thin legs: alternate steps (slight joint bends)
    [[-26, 0], [-12, Math.PI], [18, Math.PI * 0.5], [30, Math.PI * 1.5]].forEach(([ox, ph]) => {
      const sw = Math.sin(lt * 7 + ph), fx = x + ox + sw * 10, kx = x + ox + sw * 4 + 3, ky = y + legH * 0.52 - Math.max(0, sw) * 6;
      c.lineWidth = 2.6; c.beginPath(); c.moveTo(x + ox, y + 8); c.lineTo(kx, ky); c.lineTo(fx, GROUND - 2 - Math.max(0, sw) * 5); c.stroke();
    });
    const bob = Math.sin(lt * 14) * 1.5;
    c.beginPath(); c.ellipse(x, y + bob, 54, 28, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(x - 44, y - 8 + bob, 18, 16, 0, 0, TAU); c.fill();                      // Head (faces left)
    c.lineWidth = 6; c.beginPath(); c.moveTo(x - 56, y - 2 + bob); c.quadraticCurveTo(x - 72, y + 30, x - 64 + Math.sin(lt * 5) * 6, y + 52); c.stroke();   // Trunk
    // Obelisk and saddlecloth on back
    c.fillStyle = '#c8402c'; c.fillRect(x - 22, y - 26 + bob, 40, 8);
    c.fillStyle = '#e6d6b0'; c.beginPath(); c.moveTo(x - 10, y - 26 + bob); c.lineTo(x + 6, y - 26 + bob); c.lineTo(x - 2, y - 96 + bob); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,235,200,.35)'; c.beginPath(); c.ellipse(x - 14, y - 10 + bob, 26, 6, -0.2, 0, TAU); c.fill();   // Light from upper left
    c.restore();
  }

  // ---------- Ant-covered pocket watch ----------
  function antWatch(c, lt) {
    const x = 1030, y = 606;
    const wg = c.createRadialGradient(x - 10, y - 8, 3, x, y, 40); wg.addColorStop(0, '#f39a4a'); wg.addColorStop(1, '#9a3a10');
    c.fillStyle = 'rgba(30,15,5,.35)'; c.beginPath(); c.ellipse(x + 10, y + 8, 40, 11, 0, 0, TAU); c.fill();
    c.fillStyle = wg; c.beginPath(); c.ellipse(x, y, 38, 13, 0, 0, TAU); c.fill();
    c.fillStyle = '#c9a24a'; c.beginPath(); c.ellipse(x + 36, y - 4, 7, 5, 0, 0, TAU); c.fill();
    c.fillStyle = '#120a06';
    for (let k = 0; k < 9; k++) { const a = lt * (1.6 + (k % 3) * 0.5) * (k % 2 ? 1 : -1) + k * 0.7, r = 0.35 + (k % 4) * 0.14;
      const ax = x + Math.cos(a) * 32 * r, ay = y + Math.sin(a) * 10 * r, d = a + (k % 2 ? Math.PI / 2 : -Math.PI / 2);
      for (let s = -1; s <= 1; s++) { c.beginPath(); c.ellipse(ax + Math.cos(d) * s * 3.2, ay + Math.sin(d) * s * 1.2, 2, 1.4, d, 0, TAU); c.fill(); } }
  }

  // ---------- Characters ----------
  function girl(c, G, ch) {
    c.save();
    const sk = ['#f6dcc6', '#d9a888'], dress = ['#c9d9e6', '#6e8aa6'], hair = ['#f4d98a', '#b98a34'];
    vol(c, G.farSleeve, 1200, 560, 1340, 600, dress[0], dress[1]); vol(c, G.farHand, 1150, 0, 1218, 0, sk[0], sk[1], 'rgba(120,60,40,.35)', 6);
    vol(c, G.skirt, 1100, 650, 1450, 900, '#dce8f0', dress[1], 'rgba(40,50,70,.45)', 26);
    c.save(); c.clip(G.skirt); c.strokeStyle = 'rgba(60,80,110,.35)'; c.lineWidth = 10; c.filter = 'blur(5px)'; G.folds.forEach(f => c.stroke(f)); c.restore();
    vol(c, G.shoe, 1100, 0, 1150, 0, '#6a3a22', '#2a140a', null);
    vol(c, G.torso, 1290, 440, 1420, 600, dress[0], dress[1], 'rgba(40,50,70,.45)', 18);
    // Small white turned-down collar
    c.fillStyle = '#fbf6ea'; c.beginPath(); const nk = G.A.neck; c.ellipse(nk[0] + 4, nk[1] + 6, 30, 12, 0.1, 0, TAU); c.fill();
    vol(c, G.neck, 1286, 0, 1324, 0, sk[0], sk[1], 'rgba(120,60,40,.35)', 6);
    vol(c, G.hairBack, 1270, 300, 1400, 440, hair[0], hair[1], 'rgba(110,70,20,.45)', 12); vol(c, G.bun, 1360, 340, 1420, 400, hair[0], hair[1], 'rgba(110,70,20,.45)', 8);
    // Fine wavy hair lines
    c.save(); c.clip(G.hairBack); c.strokeStyle = 'rgba(150,105,40,.6)'; c.lineWidth = 2; G.hairLines.forEach(h => c.stroke(h)); c.restore();
    vol(c, G.face, 1245, 0, 1330, 0, sk[0], sk[1], 'rgba(150,80,60,.3)', 10);
    c.save(); c.clip(G.face); c.fillStyle = 'rgba(235,130,120,.3)'; c.filter = 'blur(6px)'; c.beginPath(); c.arc(G.cheek[0], G.cheek[1], 12, 0, TAU); c.fill(); c.restore();
    vol(c, G.bangs, 1250, 295, 1330, 360, hair[0], hair[1], 'rgba(110,70,20,.4)', 8);
    c.strokeStyle = 'rgba(150,105,40,.7)'; c.lineWidth = 2; G.locks.forEach(h => c.stroke(h));
    // Facial features (fine, dark brown, no black outlines)
    c.lineCap = 'round';
    if (ch.blink) { c.strokeStyle = '#5a3420'; c.lineWidth = 2.2; c.stroke(G.lid); }
    else { c.fillStyle = '#fbf3ea'; c.beginPath(); c.ellipse(G.eye.x, G.eye.y + 1, 6, 4, 0, 0, TAU); c.fill(); c.fillStyle = '#4a6a8a'; c.beginPath(); c.arc(G.eye.x - 1.5, G.eye.y + 1, 3.6, 0, TAU); c.fill(); c.fillStyle = '#1a1008'; c.beginPath(); c.arc(G.eye.x - 1.5, G.eye.y + 1, 1.6, 0, TAU); c.fill(); c.strokeStyle = '#4a2a18'; c.lineWidth = 2; c.stroke(G.lid); }
    c.strokeStyle = '#a0763a'; c.lineWidth = 2; c.stroke(G.brow);
    c.fillStyle = '#c8645e'; c.beginPath(); c.moveTo(...G.lips[0]); c.lineTo(...G.lips[1]); c.lineTo(...G.lips[2]); c.closePath(); c.fill();
    c.fillStyle = 'rgba(120,60,40,.5)'; c.beginPath(); c.arc(G.nostril[0] + 2, G.nostril[1], 1.8, 0, TAU); c.fill();
    vol(c, G.upperArm, 1300, 0, 1380, 0, dress[0], dress[1], 'rgba(40,50,70,.4)', 10); vol(c, G.foreArm, 1200, 0, 1320, 0, dress[0], dress[1], 'rgba(40,50,70,.4)', 10);
    vol(c, G.cuff, 1200, 0, 1300, 0, '#fbf6ea', '#c8bea8', null);
    vol(c, G.hand, G.A.hand[0] - 15, 0, G.A.hand[0] + 15, 0, sk[0], sk[1], 'rgba(120,60,40,.35)', 6);
    RIG.drawCup(c, G.cup, { body: '#f3efe4', rim: '#7a4a2a', hw: 6 });
    c.save(); c.translate(G.cup.x, G.cup.y); c.rotate(G.cup.tilt); const cg = c.createLinearGradient(-G.cup.w / 2, 0, G.cup.w / 2, 0); cg.addColorStop(0, 'rgba(255,255,255,0)'); cg.addColorStop(1, 'rgba(90,70,50,.45)'); c.fillStyle = cg; c.beginPath(); c.moveTo(-G.cup.w / 2, 0); c.lineTo(-G.cup.w * 0.42, G.cup.h); c.lineTo(G.cup.w * 0.42, G.cup.h); c.lineTo(G.cup.w / 2, 0); c.fill(); c.restore();
    c.fillStyle = sk[0]; c.beginPath(); c.arc(G.thumb[0], G.thumb[1], 7, 0, TAU); c.fill();
    c.restore();
  }
  function cat(c, K, lt) {
    c.save(); c.lineCap = 'round';
    // Tail: soft, sagging (Dalí-style melting)
    const pts = K.tailPts.map((p, i) => { const q = i / (K.tailPts.length - 1); return [p[0], p[1] + q * q * 34 * (0.6 + 0.4 * Math.sin(lt * 2))]; });
    const tail = new Path2D(); pts.forEach((p, i) => i ? tail.lineTo(...p) : tail.moveTo(...p));
    c.strokeStyle = '#8a3c10'; c.lineWidth = K.tailW + 4; c.stroke(tail); c.strokeStyle = '#e48a3a'; c.lineWidth = K.tailW; c.stroke(tail);
    const tip = pts[pts.length - 1]; c.fillStyle = '#fbf2e2'; c.beginPath(); c.ellipse(tip[0], tip[1] + 6, K.tailW / 2, K.tailW * 0.75, 0, 0, TAU); c.fill();
    vol(c, K.body, 430, 0, 660, 0, '#f2a24c', '#a24a14', 'rgba(70,25,5,.5)', 22);
    c.save(); c.clip(K.body); c.strokeStyle = 'rgba(150,60,15,.55)'; c.lineWidth = 9; c.filter = 'blur(2px)'; K.stripes.slice(3).forEach(s => { c.beginPath(); c.moveTo(...s[0]); c.lineTo(...s[1]); c.stroke(); }); c.restore();
    K.legs.forEach(l => vol(c, l, 560, 0, 650, 0, '#fffaf0', '#cbbca0', 'rgba(90,70,40,.35)', 6));
    c.save(); c.clip(K.body); const wch = new Path2D(); wch.ellipse(606, 768, 40, 92, -0.05, 0, TAU); vol(c, wch, 560, 0, 650, 0, '#fffaf0', '#d6c8ac', 'rgba(90,70,40,.3)', 10); c.restore();
    vol(c, K.head, 540, 560, 660, 690, '#f6ac58', '#b25618', 'rgba(70,25,5,.45)', 14);
    c.save(); c.clip(K.head); c.fillStyle = '#fbf3e4'; c.beginPath(); c.ellipse(K.nose[0] - 22, K.nose[1] + 12, 36, 26, 0, 0, TAU); c.fill(); c.restore();
    c.fillStyle = '#e8a0a0'; K.earInner.forEach(e => { c.beginPath(); e.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.fill(); });
    c.save(); c.clip(K.head); c.strokeStyle = 'rgba(150,60,15,.6)'; c.lineWidth = 7; c.filter = 'blur(1.5px)'; K.stripes.slice(0, 3).forEach(s => { c.beginPath(); c.moveTo(...s[0]); c.lineTo(...s[1]); c.stroke(); }); c.restore();
    K.eyes.forEach(e => { if (K.blink) { c.strokeStyle = '#3a200c'; c.lineWidth = 2.5; c.beginPath(); c.arc(e.x, e.y, 8, 0.2, Math.PI - 0.2); c.stroke(); }
      else { const eg = c.createRadialGradient(e.x - 2, e.y - 2, 1, e.x, e.y, 9); eg.addColorStop(0, '#e8f0a0'); eg.addColorStop(1, '#7a9a30'); c.fillStyle = eg; c.beginPath(); c.arc(e.x, e.y, 9, 0, TAU); c.fill(); c.fillStyle = '#120a04'; c.beginPath(); c.ellipse(e.x + 2, e.y, 2.6, 7, 0, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(e.x - 2, e.y - 3, 1.8, 0, TAU); c.fill(); } });
    c.fillStyle = '#c86a64'; c.beginPath(); c.arc(K.nose[0], K.nose[1], 5, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(60,30,10,.8)'; c.lineWidth = 2; c.beginPath(); c.moveTo(...K.mouth[0]); c.quadraticCurveTo(...K.mouth[1], ...K.mouth[2]); c.stroke();
    c.strokeStyle = 'rgba(255,250,235,.85)'; c.lineWidth = 1.2; K.whiskers.forEach(w => { c.beginPath(); c.moveTo(...w[0]); c.lineTo(...w[1]); c.stroke(); });
    c.restore();
  }

  // ---------- ② Long shadows: silhouette → shear-affine ground projection ----------
  function shadows(c, lt, K, G) {           // Shear-affine long shadows: P.castShadow
    const kx = 0.85 + 0.6 * ease.inOut(clamp(lt / 1.2));
    P.castShadow(c, [
      [700, g => { g.beginPath(); g.moveTo(300, 700); [[300, 120], [410, 78], [540, 70], [680, 64], [858, 104], [892, 120], [892, 700]].forEach(p => g.lineTo(...p)); g.closePath(); g.rect(370, 140, 420, 400); g.fill('evenodd'); }],
      [905, g => { g.fillRect(810, 600, 395, 305); g.fill(K.body); g.fill(K.head); g.lineWidth = K.tailW; g.stroke(K.tail); }],
      [930, g => { [G.skirt, G.torso, G.hairBack, G.bun, G.face, G.upperArm, G.foreArm, G.hand].forEach(p => p && g.fill(p)); g.fillRect(1300, 742, 190, 163); }],
    ], { kx, ky: 0.22, clipY: GROUND + 2, alpha: 0.55, blur: 1.5, key: 'daliSh' });
  }

  return {
    draw(c, lt, t) {
      const ch = P.choreo(lt, t);
      c.drawImage(bg(), 0, 0);
      elephant(c, 1060 - lt * 70, lt);
      const K = RIG.cat({ tail: ch.tail * 0.5, blink: ch.blink, breathe: ch.breathe });
      const G = RIG.girl({ cup: ch.cup, sip: ch.sip, breathe: ch.breathe, hair: 'bun' });
      shadows(c, lt, K, G);
      c.drawImage(wallLayer(), 0, 0); c.drawImage(blockLayer(), 0, 0);
      // Melting clock on dead branch (mostly hanging)
      softClock(c, { cx: 975, cy: 104, R: 64, fold: -34, top: 0.25, drip: 0.25 }, 0.1 + 1.2 * ease.inOut(clamp(lt / 1.2)), t + 7, 4.5);
      // Melting clock on sill (hangs over wall, slowly flows down)
      const sag = 0.1 + 1.3 * ease.inOut(clamp(lt / 1.2));   // Clock visibly flows down over 1.2s
      softClock(c, { cx: 740, cy: 548, R: 72, fold: 4, top: 0.3, drip: 0.4 }, sag, t, 6.5);
      // Melting clock over front edge of stone table
      softClock(c, { cx: 912, cy: 610, R: 88, fold: 12, top: 0.28, drip: 0.3 }, sag * 0.9, t + 3, -2.4);
      antWatch(c, lt);
      cat(c, K, lt);
      girl(c, G, ch);
      // Steam: two very faint wisps
      P.steam(c, t, G.cup.x, G.cup.y - 8, { h: 60, n: 2, color: 'rgba(255,250,240,.55)', width: 3, spread: 12, wobble: 7 });
      // Vignette (painting under museum lighting)
      const vg = c.createRadialGradient(960, 520, 520, 960, 540, 1150); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(25,12,4,.38)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
    },
  };
})();
