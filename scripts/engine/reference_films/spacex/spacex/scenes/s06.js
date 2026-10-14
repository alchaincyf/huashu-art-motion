// S06 · Vaporwave/cyber neon (26_vaporwave): 2018 Falcon Heavy maiden flight sends roadster into solar orbit; two boosters land side by side.
// Pipeline: render whole frame to offscreen S → P.vhs (RGB split, tracking-noise tears, scanlines, vignette; custom OSD upper right, outside subtitle area).
//   Sky gradient + stars (parallax 0.6) → striped sunset (the roadster's orbital Sun, parallax 0.12) + neon ellipse (back half behind Sun, front half in front)
//   → wireframe mountains + scrolling magenta perspective grid + palm silhouettes → pad/two landing rings → three-core Falcon Heavy (dark purple + pink/cyan edge glow) → neon-tube 2018.
// Camera pans vertically only: tracks launch up (ground exits, Sun/stars remain, roadster released); follows two boosters down to adjacent glowing rings.
// Roadster: generic red convertible, no brand marks; driver is faceless spacesuit silhouette with opaque visor.
(() => {
const W = 1920, H = 1080, { clamp, lerp, rng } = U, P = PAINT, seg = MO.seg, sm = MO.smooth, TAU = Math.PI * 2;
const ID = 's06';
ERAS.find(e => e.id === ID).transition = { type: 'vhs', dur: 0.6 };              // Signature transition: tape tear, sync loss rolls upward.
const DUR = TM.dur(ID), cue = k => TM.cue(ID, k);
const C = { pink: '#ff4fd8', hot: '#ff2f8f', cyan: '#3ff6ff', deep: '#12052a', yellow: '#ffd84a', orange: '#ff8a3a', sil: '#1c0838', sil2: '#0f0322' };
const glow = P.glowStroke;
const T = { sub: '重型猎鹰首飞' };

// ---------- Times ----------
const t18 = cue('2018年'), tSub = cue('重型猎鹰'), tLift = cue('首飞') - 0.15;
const tUp = [tLift + 0.3, tLift + 1.4];
const tCar = cue('跑车') + 0.1, tOrbit = [cue('绕太阳'), cue('轨道') + 0.35];
const tB0 = cue('两枚') - 0.05, tTouch = cue('落回'), tDown = [cue('两枚'), cue('两枚') + 1.2];
const tBurn = [tTouch - 0.95, tTouch + 0.02], tLegs = [tTouch - 0.6, tTouch - 0.1];

// ---------- Layout ----------
const HOR = 640, VPX = 960, K = 7;                     // Horizon, vanishing point; rocket 1m = 7px.
const PADX = 900, LZX = [1220, 1440], FLOORY = 880;
const SUN = { x: 960, y: 430, r: 262 };
const ORB = { rx: 610, ry: 150, tilt: -0.08 };
const camY = t => 900 * MO.sineInOut(seg(t, ...tUp)) * (1 - MO.sineInOut(seg(t, ...tDown)));
const sunAt = cy => [SUN.x, SUN.y + cy * 0.12];

// ---------- Sky and stars ----------
const STARS = (() => { const r = rng(606), o = []; for (let i = 0; i < 240; i++) o.push({ x: r() * W, y: -1500 + r() * 2150, s: 0.8 + r() * 2.2, ph: r() * TAU, f: 1.5 + r() * 3, col: r() < 0.2 ? C.cyan : r() < 0.4 ? '#ffb8f0' : '#ffffff' }); return o; })();
function sky(g, cy, t) {
  const gr = g.createLinearGradient(0, -1300 + cy, 0, HOR + cy);
  gr.addColorStop(0, '#03010a'); gr.addColorStop(0.5, '#0e0326'); gr.addColorStop(0.78, '#33095a'); gr.addColorStop(0.93, '#9a1a86'); gr.addColorStop(1, '#ff4f9e');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (const s of STARS) { const y = s.y + cy * 0.6; if (y < -4 || y > HOR + cy - 30) continue;
    const a = (0.45 + 0.55 * Math.sin(t * s.f + s.ph)) * clamp((HOR + cy - 60 - y) / 300); if (a <= 0.02) continue;
    g.globalAlpha = a; g.fillStyle = s.col; g.fillRect(s.x - s.s / 2, y - s.s / 2, s.s, s.s); if (s.s > 2.2) { g.fillRect(s.x - s.s * 2, y - 0.5, s.s * 4, 1); g.fillRect(s.x - 0.5, y - s.s * 2, 1, s.s * 4); } }
  g.globalAlpha = 1;
}
// ---------- Striped sunset (offscreen, destination-out gaps move up and widen downward) ----------
function sun(g, t, cx, cy) {
  const R = SUN.r, sc = P.scratch('s06sun'), s = sc.getContext('2d'); s.reset();
  const ox = 300, oy = 300;
  const gl = g.createRadialGradient(cx, cy, R * 0.7, cx, cy, R * 1.9); gl.addColorStop(0, 'rgba(255,79,216,.45)'); gl.addColorStop(1, 'rgba(255,79,216,0)');
  g.fillStyle = gl; g.fillRect(cx - R * 2, cy - R * 2, R * 4, R * 4);
  const sg = s.createLinearGradient(0, oy - R, 0, oy + R); sg.addColorStop(0, C.yellow); sg.addColorStop(0.5, C.orange); sg.addColorStop(1, C.hot);
  s.fillStyle = sg; s.beginPath(); s.arc(ox, oy, R, 0, TAU); s.fill();
  s.globalCompositeOperation = 'destination-out';
  const ph = (t * 0.55) % 1;
  for (let k = 0; k < 9; k++) { const q = (k + ph) / 9, y = oy + R * (q * 1.05 - 0.02), h = 2 + q * q * 22; s.fillRect(ox - R, y, R * 2, h); }
  g.drawImage(sc, 0, 0, 600, 600, cx - ox, cy - oy, 600, 600);
}
// ---------- Orbit and roadster ----------
const orbPt = (cx, cy, f) => { const x = ORB.rx * Math.cos(f), y = ORB.ry * Math.sin(f), c = Math.cos(ORB.tilt), s = Math.sin(ORB.tilt); return [cx + x * c - y * s, cy + x * s + y * c]; };
const F0 = -0.35, OMEGA = 0.85;
const carPhi = t => F0 + OMEGA * (t - tCar);
function orbitArc(g, cx, cy, f0, f1, front) {
  // Draw only front (sin>0) or back half.
  const n = Math.max(2, Math.ceil(Math.abs(f1 - f0) * 40)); g.beginPath(); let on = false;
  for (let i = 0; i <= n; i++) { const f = lerp(f0, f1, i / n), isF = Math.sin(f) > 0; const [x, y] = orbPt(cx, cy, f);
    if (isF === front) { on ? g.lineTo(x, y) : g.moveTo(x, y); on = true; } else on = false; }
  g.lineCap = 'round'; glow(g, C.pink, 5, 22); g.strokeStyle = '#ffe6fa'; g.lineWidth = 1.6; g.stroke();
}
// Roadster faces right, ~200px long: red body, dark wheels, slanted windshield, faceless astronaut with opaque visor.
const CAR = (() => {
  const body = new Path2D();
  [[-100, 12], [-102, -6], [-72, -15], [-30, -17], [-12, -14], [10, -15], [24, -19], [62, -15], [100, -5], [100, 12], [82, 12], [80, 0], [62, -8], [44, 0], [42, 12], [-42, 12], [-44, 0], [-62, -8], [-80, 0], [-82, 12]].forEach(([x, y], i) => i ? body.lineTo(x, y) : body.moveTo(x, y)); body.closePath();
  const wheels = new Path2D(); for (const x of [-62, 62]) { wheels.moveTo(x + 17, 12); wheels.arc(x, 12, 17, 0, TAU); }
  const suit = new Path2D(); suit.moveTo(-30, -16); suit.lineTo(-28, -40); suit.quadraticCurveTo(-18, -48, -6, -40); suit.lineTo(10, -30); suit.lineTo(12, -24); suit.lineTo(-4, -30); suit.lineTo(-4, -16); suit.closePath();
  const helmet = new Path2D(); helmet.arc(-16, -56, 13, 0, TAU);
  const visor = new Path2D(); visor.ellipse(-11, -56, 7, 8, 0, 0, TAU);
  return { body, wheels, suit, helmet, visor };
})();
function car(g, x, y, s, rot) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  // Two-color edge glow: same silhouette offset left in pink/right in cyan, then original fill on top.
  g.save(); g.shadowBlur = 18; g.shadowColor = C.pink; g.fillStyle = C.pink; g.translate(-3, 0); g.fill(CAR.body); g.fill(CAR.helmet); g.restore();
  g.save(); g.shadowBlur = 18; g.shadowColor = C.cyan; g.fillStyle = C.cyan; g.translate(3, 0); g.fill(CAR.body); g.fill(CAR.helmet); g.restore();
  g.fillStyle = '#f0f0ff'; g.fill(CAR.suit); g.fill(CAR.helmet); g.fillStyle = '#1a0630'; g.fill(CAR.visor);
  const bg = g.createLinearGradient(0, -20, 0, 14); bg.addColorStop(0, '#ff5a6e'); bg.addColorStop(1, '#b0102e'); g.fillStyle = bg; g.fill(CAR.body);
  g.strokeStyle = '#ffd0e0'; g.lineWidth = 2; g.beginPath(); g.moveTo(24, -19); g.lineTo(10, -40); g.stroke();       // Windshield frame.
  g.fillStyle = '#12052a'; g.fill(CAR.wheels); g.strokeStyle = C.cyan; g.lineWidth = 2.5; g.stroke(CAR.wheels);
  g.restore();
}
// ---------- Ground: wireframe mountains, scrolling magenta grid, palms ----------
const MTN = (() => { const r = rng(61), o = [[0, HOR]]; for (let x = 0; x <= W; x += 60) o.push([x, HOR - 18 - (Math.abs(x - 960) > 300 ? 40 + 70 * r() * clamp((Math.abs(x - 960) - 300) / 400) : 10 * r())]); o.push([W, HOR]); return o; })();
function ground(g, cy, t) {
  const hy = HOR + cy; if (hy > H + 10) return;
  g.save(); g.translate(0, cy);
  g.beginPath(); MTN.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fillStyle = '#16052c'; g.fill();
  g.beginPath(); MTN.slice(1, -1).forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); glow(g, C.pink, 2.5, 10);
  g.fillStyle = '#0a0118'; g.fillRect(0, HOR, W, 900);
  g.beginPath(); g.moveTo(0, HOR); g.lineTo(W, HOR); glow(g, C.cyan, 3, 16);
  g.save(); g.beginPath(); g.rect(0, HOR, W, 900); g.clip(); g.strokeStyle = C.pink; g.shadowColor = C.pink; g.shadowBlur = 10; g.lineWidth = 2;
  const far = HOR + 2;
  for (let i = -18; i <= 18; i++) { g.beginPath(); g.moveTo(VPX + i * 40, far); g.lineTo(VPX + i * 230, HOR + 900); g.stroke(); }
  const ph = (t * 1.2) % 1;
  for (let k = 0; k < 16; k++) { const d = k + 1 - ph, y = HOR + 300 / d; if (y > HOR + 900) continue; g.lineWidth = 1 + 2.4 * clamp((y - HOR) / 440); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  g.restore();
  // Palm silhouettes (one each side, swaying).
  [[150, 780, 1], [1770, 790, -1]].forEach(([x, y, s], k) => {
    const sw = Math.sin(t * 1.8 + k * 1.4) * 0.05;
    g.save(); g.translate(x, y); g.rotate(sw * s); g.fillStyle = '#090114'; g.strokeStyle = '#090114';
    g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(s * 26, -170, s * 8, -330); g.stroke();
    for (let f = 0; f < 8; f++) { const a = -Math.PI / 2 + (f - 3.5) * 0.42 + Math.sin(t * 2.6 + f) * 0.05, L = 110 + (f % 3) * 24; g.save(); g.translate(s * 8, -330); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(L * 0.5, -20, L, 18); g.quadraticCurveTo(L * 0.5, 6, 0, 6); g.fill(); g.restore(); }
    g.restore(); });
  // Launch pad + two landing rings.
  g.fillStyle = '#1a0830'; g.fillRect(PADX - 70, FLOORY, 140, 16); g.beginPath(); g.moveTo(PADX - 70, FLOORY); g.lineTo(PADX + 70, FLOORY); glow(g, C.cyan, 3, 14);
  const pulse = seg(t, tTouch, tTouch + 0.9);
  for (const x of LZX) {
    g.beginPath(); g.ellipse(x, FLOORY + 6, 96, 20, 0, 0, TAU); glow(g, C.cyan, 4, 20);
    g.beginPath(); g.ellipse(x, FLOORY + 6, 60, 12, 0, 0, TAU); glow(g, C.pink, 2.5, 12);
    if (pulse > 0 && pulse < 1) { g.save(); g.globalAlpha = 1 - pulse; g.beginPath(); g.ellipse(x, FLOORY + 6, 96 + 160 * MO.cubicOut(pulse), 20 + 32 * MO.cubicOut(pulse), 0, 0, TAU); glow(g, C.cyan, 3, 18); g.restore(); }
  }
  g.restore();
}
// ---------- Rocket: dark-purple silhouette + pink/cyan edge glow ----------
function silhouette(g, parts, x, y, rot) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(K, K);
  for (const [col, dx] of [[C.pink, -3.5 / K], [C.cyan, 3.5 / K]]) { g.save(); g.translate(dx, 0); g.shadowColor = col; g.shadowBlur = 16; g.fillStyle = col; parts.forEach(q => g.fill(q.p)); g.restore(); }
  parts.forEach(q => { g.fillStyle = q.k === 'dark' || q.k === 'engine' ? C.sil2 : C.sil; g.fill(q.p); });
  g.restore();
}
function neonFlame(g, x, y, len, w, t, seed) {
  g.save(); g.globalCompositeOperation = 'lighter'; g.shadowColor = C.hot; g.shadowBlur = 24;
  RK.flame(g, x, y, len, w, t, ['rgba(255,47,143,.85)', 'rgba(255,216,74,.9)', '#fff6fb'], seed); g.restore();
}
const HEAVY = RK.heavy({ payload: 'fairing' }).parts;
// Returning side boosters: stage 1 + nose + custom landing legs (bottom hinges, outward/downward feet below engines) + grid fins.
function sideBooster(legs) {
  const parts = RK.falcon9({ stage: 'booster', fins: 1 }).parts.filter((q, i) => i !== 3);   // Remove RK's stowed legs, replace with deployed legs below.
  parts.push({ k: 'nose', p: RK.ogive(3.7, 4.5, -41) });
  const lg = new Path2D(), a = legs * 2.1, L = 9.5;
  for (const s of [-1, 1]) { const hx = s * 1.85, hy = -1.2, tx = hx + s * Math.sin(a) * L, ty = hy - Math.cos(a) * L, nx = -Math.cos(a) * 0.35 * s, ny = -Math.sin(a) * 0.35;
    lg.moveTo(hx + nx, hy + ny); lg.lineTo(tx + nx, ty + ny); lg.lineTo(tx - nx, ty - ny); lg.lineTo(hx - nx, hy - ny); lg.closePath(); }
  parts.push({ k: 'dark', p: lg });
  return parts;
}
// ---------- Neon-tube 2018 (custom polylines, no font dependency) ----------
const ell = (cx, cy, rx, ry, n = 28) => { const o = []; for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + i / n * TAU; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o; };
const DIG = {
  '2': [[[0.1, 0.24], [0.22, 0.06], [0.5, 0.0], [0.78, 0.06], [0.9, 0.26], [0.8, 0.46], [0.1, 1.0], [0.94, 1.0]]],
  '0': [ell(0.5, 0.5, 0.4, 0.5)],
  '1': [[[0.22, 0.2], [0.58, 0.0], [0.58, 1.0]]],
  '8': [ell(0.5, 0.25, 0.32, 0.25), ell(0.5, 0.73, 0.4, 0.27)],
};
const flick = (t, t0, seed) => { if (t < t0) return 0; const f = Math.floor(t * 30); if (t - t0 < 0.4) return U.hash(f, seed) < 0.55 ? 1 : 0.12; return U.hash(f, seed + 9) < 0.035 ? 0.35 : 1; };
function neon18(g, t) {
  const x0 = 120, y0 = 92, h = 118, w = 74, gap = 22;
  [...'2018'].forEach((ch, k) => {
    const on = flick(t, t18 + k * 0.06, 31 + k); const x = x0 + k * (w + gap);
    DIG[ch].forEach(st => { g.beginPath(); st.forEach(([u, v], i) => { const px = x + u * w + (1 - v) * 14, py = y0 + v * h; i ? g.lineTo(px, py) : g.moveTo(px, py); });
      g.lineJoin = 'round'; g.lineCap = 'round';
      if (on > 0.5) { glow(g, C.cyan, 11, 30); g.strokeStyle = '#efffff'; g.lineWidth = 3.5; g.stroke(); }
      else { g.globalAlpha = on > 0 ? 1 : 0.55; g.strokeStyle = 'rgba(70,90,130,.7)'; g.lineWidth = 7; g.stroke(); g.globalAlpha = 1; } });
  });
  const so = flick(t, tSub, 77);
  if (so > 0) { g.save(); g.globalAlpha = so; g.transform(1, 0, -0.16, 1, 0, 0); g.font = '56px "PuHui-Heavy"'; g.textBaseline = 'alphabetic';
    g.shadowColor = C.pink; g.shadowBlur = 24; g.fillStyle = '#ffe1f6'; g.fillText(T.sub, 120 + 0.16 * 300, 300); g.shadowBlur = 0; g.restore(); }
}

SCENES[ID] = {
  init() { U.assertGlyphs('PuHui-Heavy', T.sub, ID); U.assertGlyphs('PressStart2P-400', 'PLAY', ID); },
  draw(c, lt, t) {
    const tt = lt, cy = camY(tt);
    const S = P.scratch('s06S'), g = S.getContext('2d'); g.reset();
    sky(g, cy, tt);
    const [sx, sy] = sunAt(cy);
    // —— Orbit + roadster (rear half behind Sun) ——
    const oq = sm(seg(tt, ...tOrbit)), f = carPhi(tt);
    let carXY = null, front = Math.sin(f) > 0;
    if (tt >= tCar) {
      const op = orbPt(sx, sy, f), rel = sm(seg(tt, tCar, tCar + 0.75));
      const noseY = 880 - 1900 * Math.pow(clamp((tCar - tLift) / 1.45), 2.2) - 490 + cy;               // Rocket nose screen position at release.
      const start = [PADX, Math.min(noseY, 40)];
      carXY = [lerp(start[0], op[0], rel), lerp(start[1], op[1], rel) - Math.sin(rel * Math.PI) * 60];
    }
    const carScale = 0.95 + 0.28 * Math.sin(f), carRot = -0.18 + 0.22 * Math.sin(tt * 0.9);
    if (oq > 0) orbitArc(g, sx, sy, F0, F0 + TAU * oq, false);
    if (carXY && !front) car(g, carXY[0], carXY[1], carScale, carRot);
    sun(g, tt, sx, sy);
    if (oq > 0) orbitArc(g, sx, sy, F0, F0 + TAU * oq, true);
    if (carXY && front) car(g, carXY[0], carXY[1], carScale, carRot);
    // Neon sparks on roadster release.
    const sp = seg(tt, tCar, tCar + 0.6);
    if (sp > 0 && sp < 1 && carXY) { const r = rng(808); g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 18; i++) { const a = r() * TAU, d = 30 + 110 * MO.cubicOut(sp) * (0.5 + r()); g.fillStyle = r() < 0.5 ? C.cyan : C.pink; g.globalAlpha = 1 - sp; g.fillRect(carXY[0] + Math.cos(a) * d, carXY[1] + Math.sin(a) * d, 4, 4); } g.restore(); }
    // —— Ground ——
    ground(g, cy, tt);
    // —— Falcon Heavy: vent on pad → launch (three cores, three neon exhausts) ——
    const ry = FLOORY - K - 1900 * Math.pow(clamp((tt - tLift) / 1.45), 2.2) + cy;
    if (ry > -40) {
      const ig = sm(seg(tt, tLift - 0.35, tLift + 0.1));
      if (ig > 0) for (const dx of [-4.05, 0, 4.05]) neonFlame(g, PADX + dx * K, ry + 7, (90 + 160 * clamp((tt - tLift) / 0.8)) * ig, 30, tt, dx);
      silhouette(g, HEAVY, PADX, ry, 0);
      if (tt < tLift + 0.6) { const r = rng(17); g.save(); g.globalCompositeOperation = 'lighter';       // Venting mist (pink/cyan).
        for (let i = 0; i < 9; i++) { const ph = (tt * 0.5 + r()) % 1, x = PADX + (r() - 0.5) * 220 * (0.4 + ph), y = FLOORY + cy - 30 - ph * 90; g.globalAlpha = 0.18 * (1 - ph) * (1 + 2 * ig); g.fillStyle = r() < 0.5 ? C.pink : C.cyan; g.beginPath(); g.arc(x, y, 26 + ph * 40, 0, TAU); g.fill(); } g.restore(); }
    }
    // —— Two side boosters land vertically in sync on adjacent glowing rings ——
    if (tt > tB0) {
      const e = MO.bezier(0.3, 0.1, 0.25, 1)(seg(tt, tB0, tTouch)), by = lerp(-820, FLOORY - 3.6 * K, e) + cy;
      const legs = sm(seg(tt, ...tLegs)), parts = sideBooster(legs), burn = sm(seg(tt, tBurn[0], tBurn[0] + 0.15)) * (1 - sm(seg(tt, tBurn[1] - 0.12, tBurn[1])));
      LZX.forEach((x, i) => { const wob = tt < tTouch ? 0.012 * Math.sin(tt * 6 + i) : 0;
        if (burn > 0) neonFlame(g, x, by + 7, 120 * burn, 26, tt, 5 + i);
        silhouette(g, parts, x, by, wob); });
    }
    // —— HUD: neon-tube text, OSD ——
    neon18(g, tt);
    // —— VHS post-processing ——
    P.vhs(c, S, t, lt, { osd: false });
    const f30 = Math.floor(t * 60);
    if ((f30 >> 4) % 2 === 0) { c.save(); c.font = '30px "PressStart2P-400"'; c.fillStyle = '#ffffff'; c.shadowColor = 'rgba(0,0,0,.8)'; c.shadowOffsetX = 3; c.shadowOffsetY = 3; c.fillText('PLAY', 1610, 104); c.beginPath(); c.moveTo(1770, 76); c.lineTo(1798, 91); c.lineTo(1770, 106); c.closePath(); c.fill(); c.restore(); }
  },
};
})();
