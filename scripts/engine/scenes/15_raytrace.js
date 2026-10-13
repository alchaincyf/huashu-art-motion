// 1993 early ray-traced CGI — pure code (no 3D engine).
// Pipeline: ① cached base (teal wall + pink-purple sunset mountains) → ② cached per-pixel perspective checker floor (2×2 supersampling)
//      → ③ objects (chair/glass table/girl/cat) drawn inverted first for reflections (mirrored at own ground lines, translucent, fading downward) → ④ upright objects
//      → ⑤ props (green cone, per-pixel chrome environment map, rotating purple torus of 48 depth-sorted spheres) → ⑥ lens flare (lighter).
// 1990s plastic: each part = base → radial gradient (bright highlight, dark edges) → cyan left environment reflection → hard white specular spot.
SCENES['15_raytrace'] = (() => {
  const W = 1920, H = 1080, P = PAINT, { clamp, lerp } = U;
  const FLOOR_Y = 790, VP = [960, 480];
  const SUN = [695, 225];
  const rgba = (h, a) => P.rgb(P.hex(h), a);

  // ---------- Plastic shading ----------
  // Spherical shading: (hx,hy) highlight center, R radius; dark = edge darkening
  function plastic(c, path, base, hx, hy, R, { dark = 0.42, spec = 0.85, specR = 0.16, rim = true, specAng = -0.5 } = {}) {
    c.fillStyle = base; c.fill(path);
    c.save(); c.clip(path);
    const g = c.createRadialGradient(hx, hy, 0, hx + R * 0.25, hy + R * 0.3, R);
    g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(0.28, 'rgba(255,255,255,.06)'); g.addColorStop(0.62, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(10,0,30,${dark})`);
    c.fillStyle = g; c.fillRect(hx - R * 3, hy - R * 3, R * 6, R * 6);
    if (rim) { c.globalCompositeOperation = 'lighter'; c.lineWidth = R * 0.18; c.strokeStyle = 'rgba(70,150,150,.28)'; c.translate(-R * 0.04, 0); c.stroke(path); c.globalCompositeOperation = 'source-over'; }
    c.restore();
    if (spec) { c.save(); c.clip(path); c.fillStyle = `rgba(255,255,255,${spec})`; c.beginPath(); c.ellipse(hx, hy, R * specR, R * specR * 0.55, specAng, 0, 7); c.fill(); c.restore(); }
  }
  // Cylindrical limb A→B: gradient across width
  function cyl(c, path, base, A, B, w, { spec = 0.7 } = {}) {
    c.fillStyle = base; c.fill(path);
    const a = Math.atan2(B[1] - A[1], B[0] - A[0]), nx = Math.cos(a + Math.PI / 2), ny = Math.sin(a + Math.PI / 2);
    const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    const s = ny < 0 ? -1 : 1;     // Gradient runs top to bottom
    const g = c.createLinearGradient(M[0] - nx * s * w / 2, M[1] - ny * s * w / 2, M[0] + nx * s * w / 2, M[1] + ny * s * w / 2);
    g.addColorStop(0, 'rgba(10,0,30,.25)'); g.addColorStop(0.22, 'rgba(255,255,255,.5)'); g.addColorStop(0.34, 'rgba(255,255,255,.08)'); g.addColorStop(0.7, 'rgba(0,0,0,.05)'); g.addColorStop(1, 'rgba(10,0,30,.45)');
    c.save(); c.clip(path); c.fillStyle = g; c.fillRect(Math.min(A[0], B[0]) - w * 2, Math.min(A[1], B[1]) - w * 2, Math.abs(B[0] - A[0]) + w * 4, Math.abs(B[1] - A[1]) + w * 4);
    if (spec) { c.strokeStyle = `rgba(255,255,255,${spec})`; c.lineWidth = w * 0.09; c.lineCap = 'round'; const o = w * 0.22 * s; c.beginPath(); c.moveTo(lerp(A[0], B[0], .2) - nx * o, lerp(A[1], B[1], .2) - ny * o); c.lineTo(lerp(A[0], B[0], .75) - nx * o, lerp(A[1], B[1], .75) - ny * o); c.stroke(); }
    c.restore();
  }

  // ---------- Static base: wall, baseboard, window ----------
  function background(g) {
    const wg = g.createRadialGradient(560, 260, 50, 700, 400, 1500); wg.addColorStop(0, '#7dbcb9'); wg.addColorStop(0.45, '#64a6a6'); wg.addColorStop(1, '#3f8285');
    g.fillStyle = wg; g.fillRect(0, 0, W, FLOOR_Y);
    // Window shadow (soft, offset lower-right)
    g.save(); g.filter = 'blur(10px)'; g.fillStyle = 'rgba(20,60,70,.45)'; g.fillRect(372, 140, 450, 452); g.restore();
    // Outside: pink-purple sunset
    g.save(); g.beginPath(); g.rect(375, 135, 410, 410); g.clip();
    const sg = g.createLinearGradient(0, 135, 0, 480); sg.addColorStop(0, '#a24cc4'); sg.addColorStop(0.45, '#df62ae'); sg.addColorStop(0.8, '#f5a08a'); sg.addColorStop(1, '#f8c070');
    g.fillStyle = sg; g.fillRect(375, 135, 410, 410);
    // Two mountain layers + snowy tops + wireframe grids
    const mtn = (pts, col, snow) => {
      g.beginPath(); g.moveTo(375, 545); pts.forEach(p => g.lineTo(...p)); g.lineTo(785, 545); g.closePath();
      const mg = g.createLinearGradient(0, 340, 0, 545); mg.addColorStop(0, col[0]); mg.addColorStop(1, col[1]); g.fillStyle = mg; g.fill();
      g.save(); g.clip(); g.strokeStyle = 'rgba(255,170,230,.45)'; g.lineWidth = 1.5;
      for (let x = 375; x < 785; x += 28) { g.beginPath(); g.moveTo(x, 330); g.lineTo(x, 545); g.stroke(); }
      for (let y = 360; y < 545; y += 26) { g.beginPath(); g.moveTo(375, y); g.lineTo(785, y); g.stroke(); }
      g.fillStyle = '#fbeef6'; snow.forEach(([x, y, w]) => { g.beginPath(); g.moveTo(x - w, y + w * 0.9); g.lineTo(x, y); g.lineTo(x + w, y + w * 0.9); g.lineTo(x + w * 0.4, y + w * 0.6); g.lineTo(x, y + w * 0.95); g.lineTo(x - w * 0.5, y + w * 0.6); g.closePath(); g.fill(); });
      g.restore();
    };
    mtn([[375, 380], [430, 352], [462, 345], [520, 400], [585, 440], [640, 420], [700, 390], [760, 395], [785, 400]], ['#b06ab8', '#8a50a8'], [[462, 345, 30], [700, 390, 22], [430, 352, 18]]);
    mtn([[375, 470], [470, 430], [560, 470], [610, 440], [690, 480], [785, 440]], ['#8f5aa8', '#6c3f94'], [[610, 440, 18], [470, 430, 16]]);
    g.restore();
    // White dimensional frame: light/dark edges
    const frame = (x, y, w, h) => { const fg = g.createLinearGradient(x, y, x + w, y + h); fg.addColorStop(0, '#ffffff'); fg.addColorStop(1, '#d6dde0'); g.fillStyle = fg; g.fillRect(x, y, w, h); };
    frame(355, 118, 445, 18); frame(355, 118, 20, 437); frame(783, 118, 17, 437); frame(355, 538, 445, 17); frame(571, 135, 14, 405); frame(375, 330, 410, 14);
    g.fillStyle = 'rgba(0,40,60,.25)'; g.fillRect(375, 136, 410, 4); g.fillRect(375, 136, 4, 402);
    // Windowsill
    const sl = g.createLinearGradient(0, 555, 0, 572); sl.addColorStop(0, '#ffffff'); sl.addColorStop(1, '#c9d2d6'); g.fillStyle = sl; g.fillRect(330, 555, 490, 16);
    g.fillStyle = 'rgba(20,60,70,.35)'; g.fillRect(340, 571, 490, 12);
    // Baseboard
    const bb = g.createLinearGradient(0, 760, 0, FLOOR_Y); bb.addColorStop(0, '#ffffff'); bb.addColorStop(1, '#d9dde0'); g.fillStyle = bb; g.fillRect(0, 760, W, FLOOR_Y - 760);
    g.fillStyle = 'rgba(0,40,50,.25)'; g.fillRect(0, 756, W, 4);
  }
  // ---------- Perspective checker floor (per-pixel, 2×2 supersampling) ----------
  function floor(g) {
    const im = g.createImageData(W, H), d = im.data, TX = 0.27, TZ = 0.00029;
    const A = P.hex('#d9dadf'), B = P.hex('#3e5d62');
    for (let y = FLOOR_Y; y < H; y++) for (let x = 0; x < W; x++) {
      let s = 0;
      for (let k = 0; k < 4; k++) {
        const yy = y + (k >> 1) * 0.5 + 0.25, xx = x + (k & 1) * 0.5 + 0.25, dy = yy - VP[1];
        const X = (xx - VP[0]) / dy, Z = 1 / dy;
        s += ((Math.floor(X / TX + 0.5) + Math.floor(Z / TZ)) & 1);
      }
      const q = s / 4, i = (y * W + x) * 4, fog = clamp(1 - (y - FLOOR_Y) / 140) * 0.35;
      for (let ch = 0; ch < 3; ch++) d[i + ch] = lerp(lerp(A[ch], B[ch], q), [150, 190, 192][ch], fog);
      d[i + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    // Floor ambient light: window-light patch
    const lg = g.createRadialGradient(560, 900, 20, 560, 900, 520); lg.addColorStop(0, 'rgba(255,200,230,.22)'); lg.addColorStop(1, 'rgba(255,200,230,0)');
    g.fillStyle = lg; g.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);
  }

  // ---------- Furniture ----------
  function chair(c) {
    const wood = '#b77a40', post = (x, y0, y1, w) => { const p = new Path2D(); p.rect(x, y0, w, y1 - y0); cyl(c, p, wood, [x + w / 2, y0], [x + w / 2, y1], w, { spec: 0.5 }); grain(c, x, y0, w, y1 - y0); };
    post(1478, 455, 912, 22); post(1442, 470, 760, 18);
    for (let k = 0; k < 4; k++) { const p = new Path2D(); p.rect(1444, 500 + k * 52, 52, 12); cyl(c, p, '#a86a34', [1444, 506 + k * 52], [1496, 506 + k * 52], 12, { spec: 0.4 }); }
    const seat = new Path2D(); seat.rect(1290, 738, 214, 22); cyl(c, seat, wood, [1290, 749], [1504, 749], 22); grain(c, 1290, 738, 214, 22);
    post(1312, 760, 900, 18);
  }
  function grain(c, x, y, w, h) {    // Wood grain: fine noise lines
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.strokeStyle = 'rgba(90,45,15,.35)'; c.lineWidth = 1.2;
    const r = U.rng((x * 7 + y) | 0), vert = h > w;
    for (let k = 0; k < (vert ? w : h) / 3; k++) { const o = r() * (vert ? w : h); c.beginPath(); for (let s = 0; s <= 20; s++) { const q = s / 20, n = P.noise(o * 0.3 + k, q * 4) * 3; vert ? (s ? c.lineTo(x + o + n, y + q * h) : c.moveTo(x + o + n, y + q * h)) : (s ? c.lineTo(x + q * w, y + o + n) : c.moveTo(x + q * w, y + o + n)); } c.stroke(); }
    c.restore();
  }
  function table(c) {
    // Marble pedestal: vertical grooves + cylindrical shading
    const col = new Path2D(); col.rect(984, 664, 52, 212); cyl(c, col, '#efe6ea', [984, 770], [1036, 770], 52, { spec: 0 });
    c.save(); c.clip(col); c.strokeStyle = 'rgba(120,100,140,.35)'; c.lineWidth = 2; for (let x = 990; x < 1036; x += 9) { c.beginPath(); c.moveTo(x, 664); c.lineTo(x, 876); c.stroke(); }
    c.strokeStyle = 'rgba(150,130,170,.25)'; c.lineWidth = 1.5; c.beginPath(); for (let s = 0; s < 30; s++) c.lineTo(990 + P.noise(s * 0.3, 2) * 30 + 20, 664 + s * 7.3); c.stroke(); c.restore();
    const lg = c.createLinearGradient(984, 0, 1036, 0); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.3, 'rgba(255,255,255,.6)'); lg.addColorStop(0.45, 'rgba(255,255,255,0)'); c.fillStyle = lg; c.fillRect(984, 664, 52, 212);
    // Base
    const base = new Path2D(); base.ellipse(1010, 884, 56, 14, 0, 0, 7); base.rect(954, 872, 112, 12); plastic(c, base, '#e9e1e6', 985, 876, 80, { spec: 0.6, rim: false });
    const cap = new Path2D(); cap.ellipse(1010, 668, 40, 9, 0, 0, 7); plastic(c, cap, '#efe6ea', 995, 664, 50, { spec: 0, rim: false });
  }
  function glassTop(c, t) {
    // Glass top: translucent green + thick edge + highlight bands + sliding reflection
    c.save();
    const top = new Path2D(); top.ellipse(1010, 650, 192, 20, 0, 0, 7);
    const edge = new Path2D(); edge.ellipse(1010, 660, 192, 20, 0, 0, Math.PI); edge.lineTo(818, 650); edge.ellipse(1010, 650, 192, 20, 0, Math.PI, 0, true); edge.closePath();
    c.fillStyle = 'rgba(40,140,90,.75)'; c.fill(edge);
    const tg = c.createLinearGradient(818, 630, 1202, 670); tg.addColorStop(0, 'rgba(140,230,190,.55)'); tg.addColorStop(0.5, 'rgba(70,170,120,.45)'); tg.addColorStop(1, 'rgba(30,110,80,.6)');
    c.fillStyle = tg; c.fill(top);
    c.strokeStyle = 'rgba(220,255,240,.8)'; c.lineWidth = 2; c.stroke(top);
    c.clip(top); const sx = 860 + ((t * 260) % 420);
    c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.moveTo(sx, 630); c.lineTo(sx + 40, 630); c.lineTo(sx + 10, 672); c.lineTo(sx - 30, 672); c.fill();
    c.restore();
  }
  // ---------- Characters (plastic dolls) ----------
  const SK = '#f2c39c', HAIR = '#f6c624', RED = '#e3283c', BLUE = '#2c55d8';
  function girl(c, G) {
    const A = G.A;
    plastic(c, G.farSleeve, '#b81f30', 1300, 560, 140, { spec: 0.4 });
    plastic(c, G.farHand, SK, 1170, 608, 50, { spec: 0.7 });
    // Legs: denim-blue plastic cylinders
    const hip = G.hipSeat, knee = [1222, 722], ank = [1212, 870];
    const th2 = RIG.taper([hip[0] + 14, hip[1] - 4], [knee[0] + 30, knee[1] - 8], 84, 70); cyl(c, th2, '#1e3c9c', hip, knee, 84, { spec: 0.3 });
    const sh2 = RIG.taper([knee[0] + 30, knee[1] - 8], [ank[0] + 30, ank[1]], 62, 52); cyl(c, sh2, '#1e3c9c', knee, ank, 62, { spec: 0.3 });
    const th = RIG.taper(hip, knee, 92, 78), sh = RIG.taper(knee, ank, 72, 58);
    cyl(c, sh, BLUE, knee, ank, 72); cyl(c, th, BLUE, hip, knee, 92);
    const kneeBall = new Path2D(); kneeBall.arc(knee[0], knee[1], 40, 0, 7); plastic(c, kneeBall, BLUE, knee[0] - 14, knee[1] - 16, 60, { spec: 0.6 });
    const shoe = RIG.smooth([[1150, 868], [1238, 860], [1252, 902], [1124, 906], [1116, 890]]); plastic(c, shoe, '#5a2c1c', 1160, 872, 80, { spec: 0.8 });
    // Body
    plastic(c, G.torso, RED, 1318, 478, 200, { spec: 0.75, specR: 0.1 });
    plastic(c, G.neck, SK, 1296, 420, 40, { spec: 0 });
    // Rear hair, face, bangs — plastic hair needs bright bands
    if (G.hairDown) plastic(c, G.hairDown, HAIR, 1380, 470, 140, { spec: 0.5 });
    plastic(c, G.hairBack, HAIR, 1330, 320, 130, { spec: 0.8 });
    plastic(c, G.face, SK, 1268, 340, 95, { spec: 0.55, specR: 0.12 });
    c.fillStyle = 'rgba(240,120,120,.22)'; c.beginPath(); c.arc(G.cheek[0], G.cheek[1], 10, 0, 7); c.fill();
    const ear = new Path2D(); ear.ellipse(G.ear[0], G.ear[1], 9, 13, 0.2, 0, 7); plastic(c, ear, SK, G.ear[0] - 3, G.ear[1] - 4, 18, { spec: 0 });
    plastic(c, G.bangs, HAIR, 1282, 306, 80, { spec: 0.9, specR: 0.2 });
    c.save(); c.lineCap = 'round'; G.hairLines.forEach((h, k) => { c.strokeStyle = 'rgba(255,255,230,.55)'; c.lineWidth = 5 - k; c.stroke(h); c.strokeStyle = 'rgba(180,120,0,.35)'; c.lineWidth = 2; c.translate(0, 8); c.stroke(h); c.translate(0, -8); }); c.restore();
    // Blue glass-bead eyes, brows, lips
    const ey = G.eye; c.fillStyle = '#fff'; c.beginPath(); c.ellipse(ey.x, ey.y, 6.5, 7, 0, 0, 7); c.fill();
    if (G.blink) { c.strokeStyle = '#4a2a1a'; c.lineWidth = 2.5; c.stroke(G.lid); }
    else { const ig = c.createRadialGradient(ey.x - 2, ey.y - 1, 1, ey.x - 1, ey.y + 1, 6); ig.addColorStop(0, '#6fa0ff'); ig.addColorStop(1, '#1a2c8a'); c.fillStyle = ig; c.beginPath(); c.arc(ey.x - 1.5, ey.y + 1, 5, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(ey.x - 3, ey.y - 1.5, 1.6, 0, 7); c.fill(); c.strokeStyle = '#4a2a1a'; c.lineWidth = 2.2; c.stroke(G.lid); }
    c.strokeStyle = '#b8862a'; c.lineWidth = 2.6; c.stroke(G.brow);
    c.fillStyle = '#d0505a'; c.beginPath(); c.moveTo(...G.lips[0]); c.lineTo(...G.lips[1]); c.lineTo(...G.lips[2]); c.closePath(); c.fill();
    // Near arm (cylinder + ball joints), cup, hand
    const S = A.shoulder, E = A.elbow, Hd = A.hand;
    cyl(c, G.upperArm, RED, S, E, 54); cyl(c, G.foreArm, RED, E, Hd, 40);
    const sb = new Path2D(); sb.arc(S[0], S[1], 30, 0, 7); plastic(c, sb, RED, S[0] - 10, S[1] - 12, 44, { spec: 0.8 });
    // White porcelain cup: elliptical rim + highlight
    const u = G.cup; c.save(); c.translate(u.x, u.y); c.rotate(u.tilt);
    const body = new Path2D(); body.moveTo(-u.w / 2, 0); body.lineTo(-u.w * 0.42, u.h); body.quadraticCurveTo(0, u.h * 1.12, u.w * 0.42, u.h); body.lineTo(u.w / 2, 0); body.closePath();
    c.strokeStyle = '#e8e8f0'; c.lineWidth = 7; c.beginPath(); c.arc(u.w * 0.55, u.h * 0.4, u.h * 0.26, -1.2, 1.4); c.stroke();
    plastic(c, body, '#f4f2f8', -u.w * 0.2, u.h * 0.3, 40, { spec: 0.9, rim: false });
    c.fillStyle = '#6a3a1a'; c.beginPath(); c.ellipse(0, 0, u.w / 2, u.h * 0.14, 0, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();
    c.restore();
    plastic(c, G.hand, SK, Hd[0] - 5, Hd[1] - 6, 26, { spec: 0.8 });
  }
  function cat(c, K, t) {
    const O = '#ee8f2e', Wt = '#f6f2ee';
    // Tail: thick tube + highlight line
    c.save(); c.lineCap = 'round'; c.strokeStyle = '#b35f14'; c.lineWidth = K.tailW + 4; c.stroke(K.tail); c.strokeStyle = O; c.lineWidth = K.tailW; c.stroke(K.tail);
    c.strokeStyle = 'rgba(255,240,200,.75)'; c.lineWidth = 4; c.translate(-2, -7); c.stroke(K.tail); c.restore();
    const tip = K.tailPts[K.tailPts.length - 1]; const tp = new Path2D(); tp.arc(tip[0], tip[1], K.tailW / 2 + 1, 0, 7); plastic(c, tp, Wt, tip[0] - 4, tip[1] - 5, 20);
    const body = RIG.smooth(K.bodyPts);     // RIG cat body is polyline; Catmull-Rom smoothing gives plastic finish
    plastic(c, body, O, 500, 735, 230, { spec: 0.8, specR: 0.09 });
    c.save(); c.clip(body); plastic(c, K.white, Wt, 585, 720, 120, { spec: 0.5, rim: false }); c.restore();
    c.save(); c.clip(body); const wg = c.createLinearGradient(560, 700, 650, 860); wg.addColorStop(0, 'rgba(0,0,0,0)'); wg.addColorStop(1, 'rgba(40,0,60,.3)'); c.fillStyle = wg; c.fillRect(540, 680, 140, 220); c.restore();
    c.save(); c.clip(body); c.filter = 'blur(2px)'; c.strokeStyle = 'rgba(170,70,10,.5)'; c.lineWidth = 12; c.lineCap = 'round'; K.stripes.slice(3).forEach(s => { c.beginPath(); c.moveTo(...s[0]); c.lineTo(...s[1]); c.stroke(); }); c.restore();
    K.legs.forEach((l, k) => { plastic(c, l, Wt, 578 + k * 44, 770, 110, { spec: 0.7, specR: 0.08, dark: 0.5 }); const pw = new Path2D(); pw.ellipse(585 + k * 50, 892, 25, 14, 0, 0, 7); plastic(c, pw, Wt, 578 + k * 50, 884, 34, { spec: 0.8, dark: 0.5 }); c.strokeStyle = 'rgba(120,90,110,.5)'; c.lineWidth = 2; [-8, 8].forEach(o => { c.beginPath(); c.moveTo(585 + k * 50 + o, 888); c.lineTo(585 + k * 50 + o, 903); c.stroke(); }); });
    plastic(c, K.head, O, 580, 598, 100, { spec: 0.9, specR: 0.13 });
    c.save(); c.clip(K.head); const mz = new Path2D(); mz.ellipse(K.nose[0] - 14, K.nose[1] + 16, 27, 19, 0, 0, 7); plastic(c, mz, Wt, K.nose[0] - 20, K.nose[1] + 8, 34, { spec: 0.4, rim: false, dark: 0.3 });
    c.filter = 'blur(1.5px)'; c.strokeStyle = 'rgba(170,70,10,.5)'; c.lineWidth = 8; c.lineCap = 'round'; K.stripes.slice(0, 3).forEach(s => { c.beginPath(); c.moveTo(...s[0]); c.lineTo(...s[1]); c.stroke(); }); c.restore();
    c.fillStyle = '#f2a0a8'; K.earInner.forEach(e => { c.beginPath(); e.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.fill(); });
    c.fillStyle = '#e66a7a'; c.beginPath(); c.arc(K.nose[0], K.nose[1], 6, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1.6; K.whiskers.forEach(w => { c.beginPath(); c.moveTo(...w[0]); c.lineTo(...w[1]); c.stroke(); });
    // Cat eyes glow green (lighter, time-pulsed)
    const pulse = 0.75 + 0.25 * Math.sin(t * 18);
    K.eyes.forEach(e => {
      c.fillStyle = '#0a3a10'; c.beginPath(); c.arc(e.x, e.y, 10, 0, 7); c.fill();
      c.save(); c.globalCompositeOperation = 'lighter';
      const gg = c.createRadialGradient(e.x, e.y, 0, e.x, e.y, 46 * pulse); gg.addColorStop(0, 'rgba(200,255,200,1)'); gg.addColorStop(0.25, 'rgba(80,255,120,.8)'); gg.addColorStop(1, 'rgba(40,255,90,0)');
      c.fillStyle = gg; c.beginPath(); c.arc(e.x, e.y, 46 * pulse, 0, 7); c.fill(); c.restore();
    });
  }

  // ---------- Props: green cone, per-pixel environment-mapped chrome sphere, rotating purple torus ----------
  function cone(c) {
    const p = new Path2D(); p.moveTo(1592, 612); p.lineTo(1660, 780); p.ellipse(1592, 780, 68, 14, 0, 0, Math.PI); p.closePath();
    c.fillStyle = '#25835a'; c.fill(p);
    c.save(); c.clip(p); const g = c.createLinearGradient(1524, 0, 1660, 0); g.addColorStop(0, 'rgba(0,30,20,.35)'); g.addColorStop(0.3, 'rgba(160,255,200,.55)'); g.addColorStop(0.4, 'rgba(255,255,255,.15)'); g.addColorStop(1, 'rgba(0,20,10,.55)');
    c.fillStyle = g; c.fillRect(1520, 600, 150, 200); c.restore();
  }
  function chromeSphere(c, t, cx, cy, r) {
    const sc = P.scratch('rt_sph'), g = sc.getContext('2d'), D = r * 2 + 2;
    const im = g.createImageData(D, D), d = im.data, rot = t * 4.5;
    for (let y = 0; y < D; y++) for (let x = 0; x < D; x++) {
      const nx = (x - r) / r, ny = (y - r) / r, q = nx * nx + ny * ny; if (q > 1) continue;
      const nz = Math.sqrt(1 - q), i = (y * D + x) * 4;
      // Reflection direction R = 2(N·V)N - V, V=(0,0,1)
      const rx = 2 * nz * nx, ry = 2 * nz * ny, rz = 2 * nz * nz - 1;
      let col;
      if (ry > 0.05) { // Downward view sees checkerboard
        const u = rx / ry * 1.6 + rot, v = rz / ry * 1.6; const ck = (Math.floor(u * 2) + Math.floor(v * 2)) & 1; col = ck ? [40, 60, 70] : [225, 225, 235];
      } else { const k = clamp(-ry * 1.4); col = [lerp(245, 160, k), lerp(160, 80, k), lerp(170, 200, k)]; if (Math.abs(rx - 0.4) < 0.08 && ry < -0.2 && ry > -0.7) col = [255, 255, 255]; }
      const f = 0.35 + 0.65 * Math.pow(1 - nz, 0.3) * 0.5 + 0.3;    // Brighter edges (Fresnel)
      d[i] = col[0] * f + 20; d[i + 1] = col[1] * f + 20; d[i + 2] = col[2] * f + 25; d[i + 3] = 255;
    }
    g.clearRect(0, 0, D + 4, D + 4); g.putImageData(im, 0, 0);
    c.drawImage(sc, 0, 0, D, D, cx - r - 1, cy - r - 1, D, D);
    c.save(); c.globalCompositeOperation = 'lighter'; const hg = c.createRadialGradient(cx - r * 0.38, cy - r * 0.45, 0, cx - r * 0.38, cy - r * 0.45, r * 0.3); hg.addColorStop(0, 'rgba(255,255,255,1)'); hg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = hg; c.beginPath(); c.arc(cx - r * 0.38, cy - r * 0.45, r * 0.3, 0, 7); c.fill(); c.restore();
  }
  function torus(c, t, cx, cy, R, rr) {
    const th = t * 7, tilt = 0.35, out = [], N = 140;
    for (let k = 0; k < N; k++) {
      const ph = k / N * Math.PI * 2, x0 = R * Math.cos(ph), y0 = R * Math.sin(ph);
      const X = x0 * Math.cos(th), Z = x0 * Math.sin(th);
      const Y = y0 * Math.cos(tilt) - Z * Math.sin(tilt), Z2 = y0 * Math.sin(tilt) + Z * Math.cos(tilt);
      out.push([cx + X, cy + Y, Z2]);
    }
    out.sort((a, b) => a[2] - b[2]);
    // Dark base joins spheres into tube, then highlight each sphere
    out.forEach(([x, y]) => { c.fillStyle = '#7a1aa0'; c.beginPath(); c.arc(x, y, rr, 0, 7); c.fill(); });
    out.forEach(([x, y, z]) => {
      const g = c.createRadialGradient(x - rr * 0.35, y - rr * 0.4, 1, x, y, rr); const l = 0.5 + 0.5 * z / R;
      g.addColorStop(0, `rgba(255,${190 + l * 50},255,1)`); g.addColorStop(0.3, '#d850f6'); g.addColorStop(0.75, '#9a28c4'); g.addColorStop(1, 'rgba(110,20,150,0)');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, rr * 0.92, 0, 7); c.fill();
    });
  }
  function props(c, t, mirror) {
    // mirror: reflect each object about its own ground line
    const M = (yC, fn) => { c.save(); if (mirror) { c.translate(0, 2 * yC); c.scale(1, -1); } fn(); c.restore(); };
    M(780, () => cone(c));
    M(846, () => torus(c, t, 1818, 772, 52, 22));
    M(800, () => chromeSphere(c, t, 1712, 748, 52));
  }

  // ---------- Lens flare ----------
  function flare(c, t) {
    c.save(); c.globalCompositeOperation = 'lighter';
    const pul = 1 + 0.08 * Math.sin(t * 23);
    const glow = c.createRadialGradient(...SUN, 0, ...SUN, 170 * pul); glow.addColorStop(0, 'rgba(255,255,255,1)'); glow.addColorStop(0.15, 'rgba(255,240,250,.9)'); glow.addColorStop(0.4, 'rgba(255,170,220,.25)'); glow.addColorStop(1, 'rgba(255,150,220,0)');
    c.fillStyle = glow; c.beginPath(); c.arc(...SUN, 170 * pul, 0, 7); c.fill();
    // Slowly rotating starburst
    const rot = t * 1.6;
    for (let k = 0; k < 12; k++) { const a = rot + k / 12 * Math.PI * 2, L = (k % 2 ? 70 : 120) * pul; const g = c.createLinearGradient(SUN[0], SUN[1], SUN[0] + Math.cos(a) * L, SUN[1] + Math.sin(a) * L); g.addColorStop(0, 'rgba(255,255,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.strokeStyle = g; c.lineWidth = 2.5; c.beginPath(); c.moveTo(...SUN); c.lineTo(SUN[0] + Math.cos(a) * L, SUN[1] + Math.sin(a) * L); c.stroke(); }
    // Long horizontal light band
    const hs = c.createLinearGradient(220, 0, 1180, 0); hs.addColorStop(0, 'rgba(255,255,255,0)'); hs.addColorStop(0.5, `rgba(255,255,255,${0.75 * pul})`); hs.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = hs; c.fillRect(220, SUN[1] - 2, 960, 4);
    c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 3; c.beginPath(); c.arc(...SUN, 150, 0, 7); c.stroke();
    // Ghosts along sun→scene center line, slide slightly over time
    const C0 = [960, 540], dx = C0[0] - SUN[0], dy = C0[1] - SUN[1], sl = Math.sin(t * 5) * 0.03;
    [[0.62, 58, 'rgba(180,255,240,.16)', 0], [0.95, 17, 'rgba(160,255,255,.4)', 6], [1.25, 40, 'rgba(255,200,255,.12)', 6], [1.55, 34, 'rgba(200,255,230,.18)', 0], [0.8, 12, 'rgba(255,255,200,.3)', 6]].forEach(([k, r, col, sides]) => {
      const x = SUN[0] + dx * (k + sl), y = SUN[1] + dy * (k + sl); c.fillStyle = col; c.beginPath();
      if (sides) for (let i = 0; i < sides; i++) { const a = i / sides * Math.PI * 2 + 0.3; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } else c.arc(x, y, r, 0, 7);
      c.closePath(); c.fill();
    });
    c.restore();
  }

  return {
    draw(c, lt, t) {
      const ch = P.choreo(lt, t);
      c.drawImage(P.cached('rt_bg', W, H, background), 0, 0);
      c.drawImage(P.cached('rt_floor', W, H, floor), 0, FLOOR_Y, W, H - FLOOR_Y, 0, FLOOR_Y, W, H - FLOOR_Y);
      const K = RIG.cat({ tail: ch.tail, blink: 0, breathe: ch.breathe });
      const G = RIG.girl({ cup: ch.cup, sip: ch.sip, hair: 'long', breathe: ch.breathe }); G.blink = ch.blink;
      // Object layer
      const L = P.scratch('rt_obj'), lg = L.getContext('2d'); lg.clearRect(0, 0, W, H);
      chair(lg); table(lg); glassTop(lg, t); girl(lg, G); cat(lg, K, t);
      // Reflect objects about ground y=905, fade downward
      c.save(); c.beginPath(); c.rect(0, FLOOR_Y, W, H - FLOOR_Y); c.clip();
      c.globalAlpha = 0.34; c.translate(0, 2 * 906); c.scale(1, -1); c.drawImage(L, 0, 0); c.restore();
      const R2 = P.scratch('rt_ref2'), rg = R2.getContext('2d'); rg.clearRect(0, 0, W, H); props(rg, t, true);   // Render prop reflections separately then make entire layer translucent, avoiding opaque overlapping spheres
      c.save(); c.beginPath(); c.rect(0, FLOOR_Y, W, H - FLOOR_Y); c.clip(); c.globalAlpha = 0.34; c.drawImage(R2, 0, 0); c.restore();
      const fg = c.createLinearGradient(0, 905, 0, H); fg.addColorStop(0, 'rgba(160,190,195,0)'); fg.addColorStop(1, 'rgba(160,190,195,.25)'); c.fillStyle = fg; c.fillRect(0, 905, W, H - 905);
      // Contact shadows
      c.fillStyle = 'rgba(10,30,35,.35)'; [[540, 906, 130, 10], [1010, 900, 70, 8], [1190, 905, 80, 8], [1400, 912, 110, 8], [1592, 782, 70, 8]].forEach(([x, y, rx, ry]) => { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill(); });
      c.drawImage(L, 0, 0);
      props(c, t, false);
      // Steam: translucent white tubes
      P.steam(c, t, G.cup.x, G.cup.y - 6, { h: 60, n: 2, color: 'rgba(255,255,255,.7)', width: 5, spread: 14, wobble: 8 });
      flare(c, t);
    },
  };
})();
