// 1930 rubber-hose cartoon (Fleischer / early Disney / Cuphead style) — entirely procedural.
// Pipeline: ① paper-toned monochrome base (striped wallpaper, floor, sun face outside) → ② each object bounces and squashes/stretches at 128BPM about its own floor-contact pivot
//      → ③ characters: use rig anchors only, replace rendering with cartoons (big heads, pie-cut eyes, rubber-hose arms, white gloves) → ④ film layer: gate weave, flicker, scratches, dust, vignette
// Timing: characters and motifs step at 12fps on twos (tq), only film layer changes at 24fps — the staccato feel of 1930s cel animation.
SCENES['33_rubberhose'] = (() => {
  const W = 1920, H = 1080, { clamp, lerp, rng } = U, P = PAINT;
  const INK = '#141210', PAPER = '#efe7d2', LT = '#d9d0b8', MID = '#a39a84', DK = '#5e574b', BEAT = 60 / 128;
  const bnc = (tq, ph = 0) => Math.abs(Math.sin(Math.PI * (tq / BEAT + ph)));              // 0 = grounded, 1 = apex
  // Pivot at ground contact (ax,ay): bounce upward amp pixels; squash on landing, stretch airborne
  function boing(c, ax, ay, b, amp, fn, k = 1) {
    c.save(); c.translate(ax, ay - b * amp); const sq = (1 - b) * 0.09 * k, st = b * 0.05 * k;
    c.scale(1 + sq - st * 0.6, 1 - sq + st); c.translate(-ax, -ay); fn(); c.restore();
  }
  const ink = (c, w = 6) => { c.strokeStyle = INK; c.lineWidth = w; c.lineJoin = 'round'; c.lineCap = 'round'; };
  const F = (c, p, col, w = 6) => { c.fillStyle = col; c.fill(p); ink(c, w); c.stroke(p); };
  const circ = (x, y, r) => { const p = new Path2D(); p.arc(x, y, r, 0, Math.PI * 2); return p; };
  const ell = (x, y, rx, ry, a = 0) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, a, 0, Math.PI * 2); return p; };
  // Pie-cut eyes: white eye with black pupil minus wedge (1930s signature)
  function pieEye(c, x, y, rx, ry, look, blink, lash) {
    if (blink) { ink(c, 5); c.beginPath(); c.ellipse(x, y + ry * 0.2, rx, ry * 0.5, 0, 0.15, Math.PI - 0.15); c.stroke(); return; }
    F(c, ell(x, y, rx, ry), '#fbf7ec', 4.5);
    const px = x + look * rx * 0.35, py = y + ry * 0.25;
    c.save(); c.clip(ell(x, y, rx, ry)); c.fillStyle = INK; c.beginPath(); c.ellipse(px, py, rx * 0.62, ry * 0.7, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fbf7ec'; c.beginPath(); c.moveTo(px + rx * 0.05, py - ry * 0.05); c.arc(px, py, ry, -1.45, -0.85); c.closePath(); c.fill(); c.restore();
    if (lash) { ink(c, 4); for (let k = 0; k < 3; k++) { const a = -2.5 + k * 0.45; c.beginPath(); c.moveTo(x + Math.cos(a) * rx, y + Math.sin(a) * ry); c.lineTo(x + Math.cos(a) * (rx + 14), y + Math.sin(a) * (ry + 14)); c.stroke(); } }
  }
  // Rubber hose: elbowless noodle (quadratic Bézier), constant thickness
  function hose(c, A, B, bend, w, col) {
    const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1;
    const C = [mx - dy / L * bend, my + dx / L * bend];
    c.lineCap = 'round'; c.strokeStyle = INK; c.lineWidth = w + 10; c.beginPath(); c.moveTo(...A); c.quadraticCurveTo(...C, ...B); c.stroke();
    c.strokeStyle = col; c.lineWidth = w; c.stroke();
  }
  // White glove: four-finger cartoon hand, turned-back cuff, three back-of-hand lines
  function glove(c, x, y, ang, s = 1) {
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
    F(c, RIG.smooth([[-30, -14], [-8, -24], [16, -22], [30, -12], [34, 4], [24, 20], [4, 24], [-20, 18], [-32, 4]]), '#fbf7ec', 5);
    [[22, -18], [30, -6], [30, 8]].forEach(([fx, fy]) => F(c, ell(fx + 6, fy, 11, 8, 0.2), '#fbf7ec', 5));
    F(c, RIG.smooth([[-30, -20], [-46, -26], [-50, 0], [-46, 26], [-30, 20], [-26, 0]]), '#fbf7ec', 5);
    ink(c, 3); [-6, 2, 10].forEach(xx => { c.beginPath(); c.moveTo(xx - 10, xx * 0.2 - 2); c.lineTo(xx + 2, xx * 0.2 - 4); c.stroke(); });
    c.restore();
  }

  // ---------- Static base (cached) ----------
  const bg = () => P.cached('rh_bg', W, H, (g) => {
    g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
    // Wallpaper: vertical stripes and small diamonds
    for (let x = 0; x < W; x += 64) { g.fillStyle = '#e5dcc5'; g.fillRect(x, 0, 30, 700); }
    g.fillStyle = '#cfc5ab'; for (let y = 30; y < 690; y += 70) for (let x = 47; x < W; x += 64) { g.beginPath(); g.moveTo(x, y - 7); g.lineTo(x + 6, y); g.lineTo(x, y + 7); g.lineTo(x - 6, y); g.fill(); }
    // Floor
    g.fillStyle = '#cdc3a8'; g.fillRect(0, 712, W, H - 712);
    ink(g, 3); g.strokeStyle = '#8a816c'; for (let y = 760; y < H; y += 60) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    for (let k = 0; k < 40; k++) { const y = 712 + Math.floor(k / 8) * 60, x = (k % 8) * 260 + (Math.floor(k / 8) % 2) * 130; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 60); g.stroke(); }
    g.fillStyle = DK; g.fillRect(0, 690, W, 24); ink(g, 5); g.beginPath(); g.moveTo(0, 690); g.lineTo(W, 690); g.moveTo(0, 714); g.lineTo(W, 714); g.stroke();
    // Watercolor-like shading: dark corners
    const vg = g.createRadialGradient(900, 480, 300, 900, 520, 1200); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(60,50,35,.35)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  });

  function windowAndSky(c, tq) {
    // Sky in window opening
    c.save(); c.beginPath(); c.rect(360, 130, 440, 420); c.clip();
    c.fillStyle = '#f6f0e0'; c.fillRect(360, 130, 440, 420);
    // Distant hills and trees (trees bounce to beat)
    c.fillStyle = LT; c.beginPath(); c.moveTo(360, 480); c.quadraticCurveTo(470, 410, 580, 470); c.quadraticCurveTo(690, 420, 800, 470); c.lineTo(800, 550); c.lineTo(360, 550); c.fill(); ink(c, 4); c.stroke();
    boing(c, 450, 500, bnc(tq, 0.25), 14, () => { F(c, RIG.smooth([[442, 500], [446, 440], [458, 440], [462, 500]]), DK, 4); F(c, RIG.smooth([[400, 440], [420, 380], [452, 360], [490, 380], [505, 430], [470, 455], [430, 455]]), MID, 5); });
    // Sun face: rotating rays, face nods to beat
    const sx = 690, sy = 235, rot = tq * 1.6;
    c.save(); c.translate(sx, sy); c.rotate(rot); c.fillStyle = '#fbf7ec';
    for (let k = 0; k < 12; k++) { c.rotate(Math.PI / 6); c.beginPath(); c.moveTo(-12, -66); c.lineTo(0, -108 - (k % 2) * 16); c.lineTo(12, -66); c.closePath(); c.fill(); ink(c, 4); c.stroke(); }
    c.restore();
    boing(c, sx, sy + 58, bnc(tq), 8, () => {
      F(c, circ(sx, sy, 60), '#fbf7ec', 5);
      pieEye(c, sx - 20, sy - 10, 11, 16, -0.4, 0, false); pieEye(c, sx + 16, sy - 10, 11, 16, -0.4, 0, false);
      ink(c, 5); c.beginPath(); c.arc(sx - 2, sy + 12, 26, 0.35, Math.PI - 0.35); c.stroke();
      c.fillStyle = MID; c.beginPath(); c.arc(sx - 36, sy + 14, 9, 0, 7); c.arc(sx + 32, sy + 14, 9, 0, 7); c.fill();
    });
    // Two clouds stretch to beat and drift slowly
    [[470 + tq * 30, 200, 0.1], [560 + tq * 22, 300, 0.6]].forEach(([x, y, ph]) => boing(c, x, y + 30, bnc(tq, ph), 10, () => {
      F(c, RIG.smooth([[x - 60, y + 30], [x - 70, y + 6], [x - 40, y - 18], [x - 6, y - 30], [x + 30, y - 22], [x + 62, y - 4], [x + 66, y + 26]]), '#fbf7ec', 5); }));
    c.restore();
    // Window frame (thick white-painted border and cross)
    ink(c, 6); c.fillStyle = '#f4eedc';
    [[350, 120, 460, 18], [350, 542, 460, 18], [350, 120, 18, 440], [792, 120, 18, 440], [571, 120, 18, 440], [350, 328, 460, 16]].forEach(r => { c.fillRect(...r); c.strokeRect(...r); });
    c.fillStyle = '#f4eedc'; c.fillRect(320, 556, 520, 26); c.strokeRect(320, 556, 520, 26);
    // Tied-back polka-dot curtains, hems swing to beat
    [[330, 1], [830, -1]].forEach(([x, sgn], k) => {
      const sw = (bnc(tq, 0.5 + k * 0.5) - 0.5) * 18 * sgn;
      const p = RIG.smooth([[x, 96], [x + sgn * 70, 96], [x + sgn * 54, 260], [x + sgn * 26, 330], [x + sgn * 70 + sw, 520], [x + sgn * 30 + sw, 600], [x - sgn * 4, 600]]);
      c.fillStyle = MID; c.fill(p); c.save(); c.clip(p); c.fillStyle = '#efe7d2'; for (let yy = 100; yy < 620; yy += 34) for (let xx = x - 80; xx < x + 80; xx += 34) { c.beginPath(); c.arc(xx + (yy / 34 % 2) * 17, yy, 6, 0, 7); c.fill(); } c.restore();
      ink(c, 5); c.stroke(p); c.fillStyle = INK; c.fillRect(x + sgn * 10 - 10, 318, 50, 14);
    });
    ink(c, 8); c.beginPath(); c.moveTo(300, 96); c.lineTo(860, 96); c.stroke();
  }

  function table(c, tq) {
    // Table: curved rubber-hose legs, squashes on beat
    boing(c, 1005, 905, bnc(tq, 0.5), 16, () => {
      [[850, 1], [1160, -1]].forEach(([x, s]) => { ink(c, 26); c.beginPath(); c.moveTo(x, 640); c.quadraticCurveTo(x + s * 26, 770, x - s * 6, 900); c.stroke(); c.strokeStyle = '#8f8670'; c.lineWidth = 15; c.stroke(); });
      F(c, RIG.smooth([[805, 620], [1000, 608], [1205, 620], [1210, 648], [1000, 660], [800, 648]]), '#bdb399', 6);
      ink(c, 3); c.beginPath(); c.moveTo(830, 640); c.quadraticCurveTo(1000, 650, 1180, 640); c.stroke();
      // Vase and dancing flowers (faces, leaves waving as hands)
      F(c, RIG.smooth([[858, 615], [846, 580], [868, 548], [902, 548], [920, 580], [906, 615]]), DK, 5);
      c.fillStyle = PAPER; [[870, 575], [892, 590], [884, 565]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 4, 0, 7); c.fill(); });
      const sway = Math.sin(Math.PI * tq / BEAT) * 0.35, top = [884 + Math.sin(sway) * 120, 548 - Math.cos(sway) * 120];
      ink(c, 12); c.beginPath(); c.moveTo(884, 550); c.quadraticCurveTo(884 - sway * 30, 490, top[0], top[1]); c.stroke(); c.strokeStyle = MID; c.lineWidth = 6; c.stroke();
      const leaf = (s) => { c.save(); c.translate(884 - sway * 20, 500); c.rotate(s * (0.9 + sway * 1.4 * s)); F(c, ell(28 * s, 0, 30, 11), MID, 4.5); c.restore(); }; leaf(1); leaf(-1);
      c.save(); c.translate(top[0], top[1]); c.rotate(sway);
      for (let k = 0; k < 8; k++) { c.save(); c.rotate(k / 8 * Math.PI * 2 + tq * 2); F(c, ell(0, -36, 15, 24), '#fbf7ec', 4.5); c.restore(); }
      F(c, circ(0, 0, 28), LT, 5); pieEye(c, -9, -5, 6, 9, 0.3, 0, false); pieEye(c, 9, -5, 6, 9, 0.3, 0, false);
      ink(c, 4); c.beginPath(); c.arc(0, 6, 11, 0.3, Math.PI - 0.3); c.stroke(); c.restore();
    });
  }

  function chair(c) {
    ink(c, 6); c.fillStyle = '#8f8670';
    [[1436, 1], [1496, -1]].forEach(([x, s]) => { ink(c, 22); c.beginPath(); c.moveTo(x, 460); c.quadraticCurveTo(x - s * 14, 700, x + s * 4, 905); c.stroke(); c.strokeStyle = '#8f8670'; c.lineWidth = 11; c.stroke(); });
    const back = RIG.smooth([[1416, 470], [1440, 420], [1470, 404], [1500, 420], [1522, 470], [1500, 480], [1470, 466], [1440, 480]]);
    c.fill(back); c.stroke(back); [500, 560].forEach(y => { c.fillStyle = '#8f8670'; c.fillRect(1436, y, 60, 14); c.strokeRect(1436, y, 60, 14); });
  }

  function girl(c, tq, lt, t) {
    const ch = P.choreo(lt, t);
    const cup = 0.5 - 0.5 * Math.cos(clamp(Math.floor(lt * 12) / 12 / 0.9) * Math.PI);   // Cup lifting also steps on twos
    const G = RIG.girl({ cup, sip: 0, dx: 0, dy: 0 });
    const b = bnc(tq, 0.25);
    boing(c, 1240, 930, b, 18, () => {
      // Skirt: dark polka-dot long skirt
      F(c, G.skirt, DK, 6);
      c.save(); c.clip(G.skirt); c.fillStyle = PAPER; for (let y = 640; y < 940; y += 40) for (let x = 1090; x < 1470; x += 40) { c.beginPath(); c.arc(x + (y / 40 % 2) * 20, y, 7, 0, 7); c.fill(); } c.restore();
      ink(c, 6); c.stroke(G.skirt);
      F(c, ell(1120, 924, 34, 15), INK, 4); F(c, ell(1170, 928, 30, 13), INK, 4);                                // Mary Jane shoes
      // Far hand: rubber hose and glove resting on table
      hose(c, [1340, 480], [1196, 612], -30, 14, '#f4eedc'); glove(c, 1180, 614, Math.PI, 0.9);
      // Body
      F(c, G.torso, DK, 6);
      c.save(); c.clip(G.torso); c.fillStyle = PAPER; for (let y = 440; y < 630; y += 40) for (let x = 1280; x < 1430; x += 40) { c.beginPath(); c.arc(x + (y / 40 % 2) * 20, y, 7, 0, 7); c.fill(); } c.restore(); ink(c, 6); c.stroke(G.torso);
      // Head: large round head, slightly larger than rig, faces left
      const hc = [G.A.headC[0] - 14, G.A.headC[1] - 14], R0 = 82;
      F(c, ell(G.A.neck[0], G.A.neck[1] - 6, 18, 26), '#f4eedc', 5);
      F(c, RIG.smooth([[G.A.neck[0] - 44, G.A.neck[1] + 4], [G.A.neck[0] - 16, G.A.neck[1] + 28], [G.A.neck[0] + 6, G.A.neck[1] + 10], [G.A.neck[0] + 30, G.A.neck[1] + 28], [G.A.neck[0] + 54, G.A.neck[1] + 2], [G.A.neck[0], G.A.neck[1] - 6]]), '#fbf7ec', 5);   // Small round collar
      // Curls at back of head
      F(c, RIG.smooth([[hc[0] + 10, hc[1] - 78], [hc[0] + 70, hc[1] - 62], [hc[0] + 100, hc[1] - 10], [hc[0] + 96, hc[1] + 50], [hc[0] + 66, hc[1] + 84], [hc[0] + 30, hc[1] + 60], [hc[0] + 10, hc[1]]]), '#ddd2ae', 6);
      F(c, ell(hc[0], hc[1] + 4, R0 * 0.86, R0 * 0.9), '#f8f3e6', 6);                                                  // Face
      F(c, RIG.smooth([[hc[0] - 70, hc[1] - 30], [hc[0] - 50, hc[1] - 74], [hc[0] + 10, hc[1] - 88], [hc[0] + 70, hc[1] - 64], [hc[0] + 84, hc[1] - 6], [hc[0] + 40, hc[1] - 30], [hc[0] + 6, hc[1] - 46], [hc[0] - 36, hc[1] - 38]]), '#ddd2ae', 6);   // Fringe
      ink(c, 4); for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(hc[0] + 70 + k * 6, hc[1] + 10 + k * 22, 10, 0.5, 5.5); c.stroke(); }  // Curl
      // Golden hair must read as hair, not soft cap: strand lines and cartoon highlight (white crescent)
      ink(c, 3.5); [[-40, -60, 20, -40], [-10, -74, 50, -50], [30, -78, 80, -40], [60, -50, 92, 10], [70, -10, 90, 50]].forEach(([a, b, c2, d]) => { c.beginPath(); c.moveTo(hc[0] + a, hc[1] + b); c.quadraticCurveTo(hc[0] + (a + c2) / 2 + 10, hc[1] + (b + d) / 2 - 12, hc[0] + c2, hc[1] + d); c.stroke(); });
      c.fillStyle = '#fbf7ec'; c.beginPath(); c.ellipse(hc[0] + 40, hc[1] - 56, 22, 7, 0.5, 0, 7); c.fill();
      // Large bow on head bounces half a beat after body (follow-through)
      const bb = bnc(tq, 0.05) * 10;
      c.save(); c.translate(hc[0] + 40, hc[1] - 84 - bb); c.rotate(0.3);
      F(c, RIG.smooth([[0, 0], [-46, -30], [-52, 18]]), INK, 4); F(c, RIG.smooth([[0, 0], [46, -30], [52, 18]]), INK, 4); F(c, circ(0, 0, 12), INK, 4); c.restore();
      const blink = ch.blink && !(cup > 0.85);
      pieEye(c, hc[0] - 44, hc[1] - 4, 15, 23, -0.7, blink || cup > 0.85, true); pieEye(c, hc[0] - 8, hc[1] - 6, 17, 26, -0.7, blink || cup > 0.85, true);
      c.fillStyle = INK; c.beginPath(); c.arc(hc[0] - 72, hc[1] + 20, 7, 0, 7); c.fill();                       // Nose tip
      c.fillStyle = MID; c.beginPath(); c.arc(hc[0] - 20, hc[1] + 34, 13, 0, 7); c.fill();
      ink(c, 5); c.beginPath(); c.moveTo(hc[0] - 60, hc[1] + 46); c.quadraticCurveTo(hc[0] - 46, hc[1] + 56, hc[0] - 34, hc[1] + 44); c.stroke();
      // Near hand: rubber hose from shoulder to hand, cup in front of hand
      const S = [G.A.shoulder[0] - 6, G.A.shoulder[1] + 4], Hd = G.A.hand;
      F(c, ell(S[0], S[1], 34, 28), '#fbf7ec', 5);                                                                       // Puff sleeve
      hose(c, S, Hd, 40 - cup * 30, 14, '#f4eedc');
      glove(c, Hd[0], Hd[1], -2.6 + cup * 0.8, 1);
      const cp = G.cup; c.save(); c.translate(cp.x, cp.y); c.rotate(cp.tilt);
      F(c, RIG.smooth([[-30, 0], [-26, 34], [0, 44], [26, 34], [30, 0]], true), '#fbf7ec', 5); ink(c, 5); c.beginPath(); c.arc(34, 18, 12, -1.3, 1.5); c.stroke();
      c.fillStyle = MID; c.beginPath(); c.ellipse(0, 2, 28, 6, 0, 0, 7); c.fill(); c.stroke();
      c.restore();
      // Steam: cartoon smoke ring, one per beat
      for (let k = 0; k < 3; k++) { const q = ((tq / BEAT) + k / 3) % 1; ink(c, 4); c.beginPath(); c.ellipse(cp.x + Math.sin(q * 6) * 8, cp.y - 20 - q * 90, 10 + q * 10, 6 + q * 6, 0, 0, 7); c.globalAlpha = 1 - q; c.stroke(); c.globalAlpha = 1; }
    }, 1.2);
  }

  function cat(c, tq, t) {
    const K = RIG.cat({ tail: 0, blink: 0, breathe: 0 });
    boing(c, 540, 905, bnc(tq, 0.75), 30, () => {
      // Tail: wavy rubber hose
      const base = [460, 880]; ink(c, 1); const pts = [];
      for (let i = 0; i <= 20; i++) { const q = i / 20; pts.push([base[0] - q * 150, base[1] - q * 200 + Math.sin(q * 7 - tq * 9) * 26 * q]); }
      c.lineCap = 'round'; c.strokeStyle = INK; c.lineWidth = 32; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.stroke();
      c.strokeStyle = MID; c.lineWidth = 20; c.stroke(); c.fillStyle = '#fbf7ec'; c.beginPath(); c.arc(...pts[20], 12, 0, 7); c.fill();
      const body = RIG.smooth(K.bodyPts);                                    // Rig body is angular; cartoon needs roundness: apply Catmull-Rom
      F(c, body, MID, 6);
      c.save(); c.clip(body); c.fillStyle = '#fbf7ec'; c.fill(RIG.smooth([[566, 700], [612, 690], [642, 742], [636, 830], [596, 870], [560, 800]])); ink(c, 9); c.strokeStyle = DK; K.stripes.slice(3).forEach(s => { c.beginPath(); c.moveTo(...s[0]); c.lineTo(...s[1]); c.stroke(); }); c.restore();
      ink(c, 6); c.stroke(body);
      // White paws (large round glove-feet)
      F(c, ell(585, 892, 30, 18), '#fbf7ec', 5); F(c, ell(640, 892, 30, 18), '#fbf7ec', 5);
      // Head: orange (mid-gray) tabby crown, white muzzle, large pie-cut eyes, broad grin
      const hb = bnc(tq, 0.95) * 8;
      c.save(); c.translate(0, -hb);
      F(c, K.head, MID, 6);
      c.save(); c.clip(K.head); ink(c, 9); c.strokeStyle = DK; K.stripes.slice(0, 3).forEach(s => { c.beginPath(); c.moveTo(...s[0]); c.lineTo(...s[1]); c.stroke(); }); c.restore();
      F(c, ell(630, 652, 40, 28), '#fbf7ec', 5);
      pieEye(c, 610, 610, 15, 22, 0.6, 0, false); pieEye(c, 648, 607, 15, 22, 0.6, 0, false);
      c.fillStyle = INK; c.beginPath(); c.ellipse(656, 636, 10, 7, 0, 0, 7); c.fill();
      ink(c, 5); c.beginPath(); c.moveTo(612, 650); c.quadraticCurveTo(640, 676, 670, 646); c.stroke();
      ink(c, 3); [[660, 640, 716, 626], [662, 648, 718, 650], [600, 646, 552, 634]].forEach(([a, b, c2, d]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(c2, d); c.stroke(); });
      c.restore();
    }, 1.4);
  }

  // ---------- Film layer: P.film (24fps flicker, persistent scratches across frames, dust/hairs, grain jitter, rounded film gate) ----------
  const film = (c, t) => P.film(c, t, { grain: 'rhg' });

  return {
    draw(c, lt, t) {
      const tq = U.stepTime(t, 12);                                         // On twos: 12 drawings/second (stepped frame rate defines the style)
      P.gateWeave(c, t, () => {                                             // Gate weave (24fps)
      c.drawImage(bg(), 0, 0);
      windowAndSky(c, tq);
      chair(c);
      table(c, tq);
      girl(c, tq, lt, t);
      cat(c, tq, t);
      });
      // Film faded to warm-gray monochrome (remove residual color)
      P.fade(c, { sat: 1, tint: '#f2e8d2' });
      film(c, t);
    },
  };
})();
