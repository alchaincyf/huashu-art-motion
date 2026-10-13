// S07 · Kurzgesagt flat science (y1): May 2020, Crew Dragon sends two astronauts to station.
// World canvas + camera (CAM.at keyframes, logarithmic scale): glowing Earth arc, stars, orbit. All actions voiceover-cued.
//   ① May 2020: Falcon 9/Dragon launches from Florida → Crew Dragon label → pull back, stage separation → two-astronaut magnifier shows two helmets in window.
//   ② Station: Dragon catches up/docks, light ring → ③ Nearly nine years: 2011→2020 timeline, shuttle fades at 2011 → domestic cue pulls back, Florida site lights.
//   ④ Private company: close-up highlights Dragon → orbit cue pulls back, whole orbit traced bright.
// Rendering: no outlines, two-tone TOON.flat facets, radial glow, deep-indigo base + cyan/orange-yellow/magenta. Micro-motion: stars, atmosphere, clouds, dashes, panel glint, particles.
(() => {
const W = 1920, H = 1080, ID = 's07';
const { clamp, lerp, rng } = U;
const seg = MO.seg, flat = TOON.flat, glow = TOON.glow, circ = TOON.circle, K75 = MO.k75;
const TAU = Math.PI * 2;

// ---------- Voiceover alignment ----------
const Q = {
  date: TM.cue(ID, '2020年5月'), dragon: TM.cue(ID, '载人龙飞船'), crew: TM.cue(ID, '两名宇航员'),
  iss: TM.cue(ID, '空间站'), issEnd: TM.end(ID, '空间站'), gap: TM.cue(ID, '美国时隔'), nine: TM.cue(ID, '近9年'), nineEnd: TM.end(ID, '近9年'),
  home: TM.cue(ID, '本土'), first: TM.cue(ID, '也是第一次'), priv: TM.cue(ID, '私人公司'), orbit: TM.cue(ID, '送进轨道'), orbitEnd: TM.end(ID, '送进轨道'),
  dur: TM.dur(ID),
};

// ---------- Palette (2025 dark theme) ----------
const C = {
  sky: ['#05020F', '#0E0631', '#25155E'], star: '#F9FCFB',
  ocean: '#2a62d8', oceanSh: '#1b3f9e', oceanHi: '#7DD3DC', land: '#4fb35a', landSh: '#2f8a45', landHi: '#9be07a',
  cloud: '#F9FCFB', cloudSh: '#c9c3ea', atmo: '#7DD3DC',
  white: '#E7DFE1', whiteSh: '#9b8fd0', whiteHi: '#ffffff', dark: '#25155E', darkSh: '#140b3d', darkHi: '#3826A3',
  panel: '#E07919', panelSh: '#a9550f', panelHi: '#FACC12', cyan: '#32BAEE', mag: '#BE3A95', yellow: '#FACC12', glowCore: '#F9EF93',
};

// ---------- World geometry ----------
const E = [960, 4300], R = 3400, ORB = 700, RO = R + ORB, KW = 4.5;       // KW: world pixels per meter (enlarged spacecraft, Kurzgesagt proportion cheat).
const P = (th, r) => [E[0] + r * Math.sin(th), E[1] - r * Math.cos(th)];
const TH_PAD = -0.10, PAD = P(TH_PAD, R);
const TD = Q.issEnd, L0 = 0.55, LA = TD - 0.95, TS = L0 + (LA - L0) * 0.68;  // Docking, ignition, orbit handoff, stage separation.
const TH_D = 0.16, W_ISS = 0.010;                                          // Station angular position/velocity on docking (rad/s).
const SC2 = 2.0, DOCK_Y = 80, DH = 3.575;                                  // Dragon scale after separation; port at station-local y=+80; Dragon half-height (meters).
const DCY = DOCK_Y + DH * KW * SC2;                                        // Docked Dragon center (station-local y).

const issTh = lt => TH_D + W_ISS * (lt - TD);
const issF = lt => { const th = issTh(lt), p = P(th, RO); return { x: p[0], y: p[1], a: th }; };
const toW = (F, lx, ly) => [F.x + lx * Math.cos(F.a) - ly * Math.sin(F.a), F.y + lx * Math.sin(F.a) + ly * Math.cos(F.a)];
const toL = (F, wx, wy) => { const dx = wx - F.x, dy = wy - F.y; return [dx * Math.cos(F.a) + dy * Math.sin(F.a), -dx * Math.sin(F.a) + dy * Math.cos(F.a)]; };
const lerpAng = (a, b, k) => a + (((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI) * k;

// Ascent: Dragon center follows polar coordinates, vertical start, horizontal at orbit.
const R0 = R + (54 + DH) * KW, TH_A = issTh(LA) - 0.055, RA = RO - DCY - 70;
const ascent = lt => { const u = seg(lt, L0, LA), s = Math.pow(u, 1.55); return P(TH_PAD + (TH_A - TH_PAD) * s * s, R0 + (RA - R0) * (1 - (1 - s) * (1 - s))); };
const O0 = toL(issF(LA), ...ascent(LA));
const appE = MO.bezier(0.25, 0.55, 0.3, 1);
// Dragon center (world).
const dPos = lt => {
  if (lt <= LA) return ascent(lt);
  const F = issF(lt); if (lt >= TD) return toW(F, 0, DCY);
  const k = appE(seg(lt, LA, TD)); return toW(F, lerp(O0[0], 0, k), lerp(O0[1], DCY, k));
};
// Nose direction (0 upright, clockwise positive).
const dHead = lt => {
  if (lt <= L0 + 0.02) return TH_PAD;
  if (lt >= TD) return issF(lt).a;
  const a = dPos(lt - 0.02), b = dPos(lt + 0.02), vx = b[0] - a[0], vy = b[1] - a[1];
  let h = Math.hypot(vx, vy) < 1e-3 ? TH_PAD : Math.atan2(vx, -vy);
  if (lt > LA) h = lerpAng(h, issF(lt).a, MO.smooth(seg(lt, LA, LA + (TD - LA) * 0.75)));
  return h;
};
const dScale = lt => lerp(1, SC2, MO.sineInOut(seg(lt, TS, TS + 0.8)));

// ---------- Camera keyframes ----------
const KEYS = (() => {
  const d = lt => dPos(lt), F3 = issF(TD + 0.1), F4 = issF(Q.home - 0.55);
  const D7 = d(Q.priv + 0.2), D8 = d(Q.orbit - 0.6);
  return [
    { t: 0, x: PAD[0] + 180, y: PAD[1] - 250, z: 1.0 },
    { t: L0 + 1.0, x: d(L0 + 1.0)[0] + 140, y: d(L0 + 1.0)[1] + 90, z: 0.86, ease: MO.sineInOut },
    { t: TS + 0.35, x: 1260, y: 470, z: 0.5, ease: K75 },
    { t: TD + 0.1, x: F3.x, y: F3.y + 30, z: 0.95, ease: K75 },
    { t: Q.home - 0.55, x: F4.x, y: F4.y + 30, z: 1.02, ease: MO.linear },
    { t: Q.home + 0.3, x: 1150, y: 560, z: 0.47, ease: K75 },
    { t: Q.first + 0.05, x: 1175, y: 560, z: 0.45, ease: MO.linear },
    { t: Q.priv + 0.2, x: D7[0] + 70, y: D7[1] - 10, z: 2.5, ease: K75 },
    { t: Q.orbit - 0.6, x: D8[0] + 70, y: D8[1] - 10, z: 2.62, ease: MO.linear },
    { t: Q.dur, x: 1150, y: 1150, z: 0.36, ease: MO.sineInOut },
    { t: Q.dur + 1.2, x: 1150, y: 1160, z: 0.345, ease: MO.linear },
  ];
})();
const camAt = lt => CAM.at(KEYS, lt);

// ---------- Static seeded layout ----------
const STARS = (() => { const r = rng(701), o = []; for (let i = 0; i < 230; i++) o.push({ x: r() * 2600 - 340, y: r() * 1500 - 300, r: 0.8 + r() * r() * 3.4, ph: r() * TAU, sp: 1 + r() * 2.5 }); return o; })();
const MOTES = (() => { const r = rng(702), o = []; for (let i = 0; i < 26; i++) o.push({ x: r() * W, y: r() * H, ph: r() * TAU, s: 2 + r() * 3 }); return o; })();
const CLOUDS = (() => { const r = rng(703), o = []; for (let i = 0; i < 26; i++) o.push({ th: -0.7 + i * 0.056 + r() * 0.03, d: 60 + r() * 520, w: 70 + r() * 110, ph: r() * TAU }); return o; })();
const PUFFS = (() => { const r = rng(704), o = []; for (let i = 0; i < 30; i++) o.push({ tb: L0 + i * 0.05, dx: (r() - 0.5) * 2, sz: 0.6 + r() * 0.7, ph: r() * TAU }); return o; })();
// Land: blobs in polar (θ, depth), depth = world pixels below surface.
const LANDS = [
  [[-0.62, 70], [-0.5, 30], [-0.36, 40], [-0.24, 26], [-0.155, 60], [-0.118, 30], [-0.096, 60], [-0.108, 190], [-0.14, 260], [-0.2, 330], [-0.32, 420], [-0.46, 560], [-0.6, 520], [-0.68, 300]],
  [[-0.27, 760], [-0.16, 720], [-0.1, 860], [-0.13, 1100], [-0.2, 1350], [-0.27, 1200], [-0.31, 950]],
  [[0.24, 120], [0.34, 70], [0.46, 110], [0.52, 260], [0.46, 520], [0.36, 760], [0.3, 560], [0.22, 330]],
  [[0.6, 40], [0.74, 30], [0.86, 120], [0.8, 320], [0.66, 280]],
];
const landPaths = LANDS.map(L => RIG.smooth(L.map(([th, d]) => P(th, R - d)), true));
const earthPath = (() => { const p = new Path2D(); p.arc(E[0], E[1], R, 0, TAU); return p; })();

// ---------- Helpers ----------
const rrP = (x, y, w, h, r) => { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; };
// Label pill: leader draws then backOut pop-in; 0.25s exit.
function chip(c, text, x, y, k, kout, { col = C.mag, size = 40, to, sh } = {}) {
  if (k <= 0 || kout >= 1) return;
  const s = MO.backOut(clamp(k / 0.5), 1.1) * (1 - MO.cubicIn(clamp(kout))), a = clamp(k / 0.15) * (1 - clamp(kout));
  c.save(); c.globalAlpha *= a;
  if (to) { const lp = MO.cubicOut(clamp(k / 0.35)); c.strokeStyle = 'rgba(249,252,251,.9)'; c.lineWidth = 3; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y); c.lineTo(lerp(x, to[0], lp), lerp(y, to[1], lp)); c.stroke();
    if (lp > 0.95) { glow(c, to[0], to[1], 26, '#ffffff', 0.5); c.fillStyle = '#fff'; c.beginPath(); c.arc(to[0], to[1], 6, 0, TAU); c.fill(); } }
  c.font = `${size}px "PuHui-Heavy"`; const tw = c.measureText(text).width, ph = size * 1.55, pw = tw + size * 1.1;
  c.translate(x, y); c.scale(s, s);
  c.fillStyle = sh || 'rgba(14,6,49,.55)'; c.fill(rrP(-pw / 2 + 4, -ph / 2 + 7, pw, ph, ph / 2));
  c.fillStyle = col; c.fill(rrP(-pw / 2, -ph / 2, pw, ph, ph / 2));
  c.fillStyle = 'rgba(255,255,255,.22)'; c.fill(rrP(-pw / 2 + ph * 0.25, -ph / 2 + 5, pw - ph * 0.5, ph * 0.22, ph * 0.11));
  c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 0, size * 0.04);
  c.restore();
}

// ---------- Spacecraft (meters; flat facet offsets in meters) ----------
const PALR = { body: [C.white, C.whiteSh, C.whiteHi], nose: [C.white, C.whiteSh, C.whiteHi], trunk: ['#cfc6ee', C.whiteSh, C.whiteHi],
  dark: [C.dark, C.darkSh, C.darkHi], engine: ['#3826A3', '#1d1366', '#5F58DB'], window: ['#0E0631', '#0E0631', '#0E0631'] };
const drawParts = (c, shape, v = [0.55, 0.65], w = [0.22, 0.26]) => {
  for (const q of shape.parts) { if (q.k === 'window') continue; const p = PALR[q.k] || PALR.body; flat(c, q.p, p[0], p[1], p[2], v, w); }
};
const F9 = RK.falcon9({ payload: 'dragon' }), F9S = RK.falcon9({ payload: 'none' }), DRG = RK.dragon({ trunk: true });
// Dragon (origin at center): enlarged windows with two helmets (opaque visors, no faces).
function drawDragon(c, t, { win = 0.42, wx = 0.72, helmets = true, hi = 0 } = {}) {
  c.save(); c.translate(0, DH);
  if (hi > 0) { glow(c, 0, -DH, 9, C.yellow, 0.55 * hi); }
  drawParts(c, DRG, [0.32, 0.38], [0.12, 0.14]);
  for (const [k, x] of [[0, -wx], [1, wx]]) {
    const y = -4.8; c.save(); c.beginPath(); c.arc(x, y, win, 0, TAU); c.fillStyle = '#0E0631'; c.fill(); c.clip();
    glow(c, x - win * 0.3, y - win * 0.5, win * 1.2, '#5F58DB', 0.5);                       // Cabin light.
    if (helmets) { const b = 0.035 * Math.sin(t * 2.1 + k * 1.9), hr = win * 0.5, hx = x - win * 0.04, hy = y + win * 0.08 + b;
      c.fillStyle = '#E7DFE1'; c.beginPath(); c.ellipse(x, y + win * 0.98 + b, win * 0.82, win * 0.45, 0, 0, TAU); c.fill();   // Shoulders.
      c.fillStyle = '#b3a6d6'; c.beginPath(); c.ellipse(x + win * 0.25, y + win * 1.05 + b, win * 0.6, win * 0.4, 0, 0, TAU); c.fill();
      c.fillStyle = '#F9FCFB'; c.beginPath(); c.arc(hx, hy, hr, 0, TAU); c.fill();                                            // Helmet.
      c.fillStyle = '#c9c3ea'; c.beginPath(); c.arc(hx, hy, hr, -0.2, 1.6); c.lineTo(hx, hy); c.fill();
      const vg = c.createLinearGradient(hx - hr * 0.3, hy - hr * 0.5, hx + hr * 0.7, hy + hr * 0.5);                          // Gold visor (opaque, no face).
      vg.addColorStop(0, '#FACC12'); vg.addColorStop(0.55, '#E07919'); vg.addColorStop(1, '#8a3f08');
      c.fillStyle = vg; c.beginPath(); c.ellipse(hx + hr * 0.22, hy + hr * 0.02, hr * 0.62, hr * 0.48, 0.15, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = hr * 0.09; c.lineCap = 'round'; c.beginPath(); c.arc(hx + hr * 0.22, hy + hr * 0.02, hr * 0.45, -2.5, -1.7); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(x - win * 0.35, y - win * 0.45, win * 0.32, win * 0.13, -0.6, 0, TAU); c.fill();
    c.restore();
    c.strokeStyle = C.whiteSh; c.lineWidth = win * 0.16; c.beginPath(); c.arc(x, y, win * 1.04, 0, TAU); c.stroke();
  }
  c.restore();
}
// Magnified bubble: large Dragon window, two side-by-side astronauts (opaque helmet visors, no faces).
function drawCrewWindow(c, t) {
  const hull = new Path2D(); hull.moveTo(-330, 260); hull.lineTo(-170, -300); hull.lineTo(330, -300); hull.lineTo(330, 260); hull.closePath();
  flat(c, hull, C.white, C.whiteSh, C.whiteHi, [22, 18], [8, 7]);
  c.strokeStyle = 'rgba(155,143,208,.55)'; c.lineWidth = 5; c.beginPath(); c.moveTo(-250, 70); c.lineTo(330, 70); c.moveTo(-205, -110); c.lineTo(330, -110); c.stroke();
  const r = 128; c.save(); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fillStyle = '#0E0631'; c.fill(); c.clip();
  glow(c, -40, -70, 220, '#5F58DB', 0.55); glow(c, 0, 120, 160, C.cyan, 0.25 + 0.08 * Math.sin(t * 3));   // Cabin/instrument light.
  for (const [k, x] of [[0, -52], [1, 56]]) {
    const b = 3 * Math.sin(t * 2.0 + k * 2.1), hx = x, hy = -6 + b, hr = 40;
    flat(c, RIG.smooth([[x - 46, -40], [x + 46, -40], [x + 52, 140], [x - 52, 140]], true), '#3826A3', '#25155E', '#5F58DB', [6, 6], [2, 2]);   // Seats.
    const sh = new Path2D(); sh.ellipse(x, hy + 88, 66, 46, 0, 0, TAU); flat(c, sh, '#F9FCFB', '#b3a6d6', '#fff', [10, 10], [3, 3]);      // Shoulders.
    flat(c, circ(hx, hy + 30, 24), '#c9c3ea', '#9b8fd0', '#fff', [3, 3], [1, 1]);                                                          // Neck ring.
    flat(c, circ(hx, hy, hr), '#F9FCFB', '#b3a6d6', '#fff', [8, 8], [3, 3]);                                                               // Helmet.
    const vg = c.createLinearGradient(hx - 20, hy - 26, hx + 30, hy + 24); vg.addColorStop(0, '#FACC12'); vg.addColorStop(0.55, '#E07919'); vg.addColorStop(1, '#8a3f08');
    c.fillStyle = vg; c.beginPath(); c.ellipse(hx + 4, hy + 4, hr * 0.74, hr * 0.56, 0, 0, TAU); c.fill();                             // Gold visor.
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.arc(hx + 4, hy + 4, hr * 0.55, -2.6, -1.8); c.stroke();
  }
  c.restore();
  c.fillStyle = 'rgba(255,255,255,.14)'; c.beginPath(); c.ellipse(-50, -70, 70, 22, -0.6, 0, TAU); c.fill();
  c.strokeStyle = C.whiteSh; c.lineWidth = 16; c.beginPath(); c.arc(0, 0, r + 8, 0, TAU); c.stroke();
  c.strokeStyle = '#F9FCFB'; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, r + 1, 0, TAU); c.stroke();
}
// Station (local world pixels, +y toward Earth; port at (0, DOCK_Y)).
function drawISS(c, t) {
  const sweep = ((t * 0.32) % 1.6) - 0.3;                                       // Solar-panel glint (motif loop, 5s period).
  for (const sx of [-1, 1]) for (const px of [150, 212]) for (const sy of [-1, 1]) {
    const x = sx * px - 15, y = sy > 0 ? 18 : -148, p = rrP(x, y, 30, 130, 3);
    flat(c, p, C.panel, C.panelSh, C.panelHi, [4, 5], [1.5, 2]);
    c.save(); c.clip(p); c.strokeStyle = 'rgba(80,30,0,.35)'; c.lineWidth = 1.4;
    for (let k = 1; k < 8; k++) { c.beginPath(); c.moveTo(x, y + k * 16.25); c.lineTo(x + 30, y + k * 16.25); c.stroke(); }
    const u = sweep - (sx * px + 245) / 490 * 0.4; if (u > -0.2 && u < 1.2) { const yy = y + u * 130; const g = c.createLinearGradient(0, yy - 22, 0, yy + 22); g.addColorStop(0, 'rgba(255,248,200,0)'); g.addColorStop(0.5, 'rgba(255,248,200,.65)'); g.addColorStop(1, 'rgba(255,248,200,0)'); c.fillStyle = g; c.fillRect(x, yy - 22, 30, 44); }
    c.restore();
  }
  flat(c, rrP(-248, -7, 496, 14, 5), '#cfc6ee', C.whiteSh, C.whiteHi, [3, 4], [1, 1.5]);           // Truss.
  for (const sx of [-1, 1]) flat(c, rrP(sx * 70 - 9, -78, 18, 64, 3), '#F9FCFB', C.cloudSh, '#fff', [2, 3], [1, 1]);   // Radiators.
  const mods = [[-92, 26], [-58, 34], [-20, 40], [22, 34], [56, 26]];                                // Vertical module chain through truss.
  for (const [y, h] of mods) flat(c, rrP(-15, y, 30, h, 9), C.white, C.whiteSh, C.whiteHi, [4, 5], [1.5, 2]);
  flat(c, rrP(-34, -12, 68, 24, 10), C.white, C.whiteSh, C.whiteHi, [4, 5], [1.5, 2]);
  flat(c, rrP(-9, DOCK_Y - 4, 18, 8, 3), '#cfc6ee', C.whiteSh, C.whiteHi, [1, 2], [0.5, 0.5]);
  const bl = 0.5 + 0.5 * Math.sin(t * 4.2); glow(c, 0, DOCK_Y + 2, 16, C.cyan, 0.5 * bl); glow(c, -248, 0, 14, '#ff5d8f', 0.6 * (0.5 + 0.5 * Math.sin(t * 3.1 + 1)));
}
// Shuttle (top view, nose up, px).
function drawShuttle(c) {
  const wing = U.poly([[0, -60], [12, -40], [14, -6], [58, 44], [58, 56], [14, 56], [-14, 56], [-58, 56], [-58, 44], [-14, -6], [-12, -40]]);
  flat(c, wing, '#F9FCFB', '#a9a2cf', '#fff', [4, 5], [1.5, 2]);
  flat(c, RIG.smooth([[0, -80], [11, -60], [13, -20], [13, 58], [-13, 58], [-13, -20], [-11, -60]], true), '#F9FCFB', '#b9b3dc', '#fff', [4, 5], [1.5, 2]);
  c.fillStyle = '#25155E'; c.beginPath(); c.ellipse(0, -66, 9, 15, 0, 0, TAU); c.fill();
  c.fillStyle = '#25155E'; c.fillRect(-58, 50, 44, 6); c.fillRect(14, 50, 44, 6);
  c.fillStyle = '#3826A3'; for (const x of [-7, 0, 7]) { c.beginPath(); c.arc(x, 64, 4.5, 0, TAU); c.fill(); }
}

// ---------- Scene ----------
SCENES[ID] = {
  init() {
    U.assertGlyphs('PuHui-Heavy', '2020年5月载人龙飞船两名宇航员空间站近9年美国本土私人公司的飞船轨道2011', ID);
  },
  draw(c, lt, t) {
    const cam = camAt(lt), z = cam.z;
    // Sky.
    c.fillStyle = TOON.vgrad(c, 0, H, C.sky); c.fillRect(0, 0, W, H);
    // Stars d=0.05: individual flicker phases.
    CAM.layer(c, cam, 0.05, g => { for (const s of STARS) { g.globalAlpha = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(lt * s.sp + s.ph)); g.fillStyle = C.star; g.beginPath(); g.arc(s.x, s.y, s.r, 0, TAU); g.fill(); } g.globalAlpha = 1; });

    CAM.with(c, cam, g => {
      const px = 1 / z;                                                         // World pixels per screen pixel.
      // Breathing atmospheric glow.
      const ab = 1 + 0.08 * Math.sin(lt * 1.6);
      const ag = g.createRadialGradient(E[0], E[1], R - 30, E[0], E[1], R + 320 * ab);
      ag.addColorStop(0, 'rgba(125,211,220,0.55)'); ag.addColorStop(0.25, 'rgba(50,186,238,0.22)'); ag.addColorStop(1, 'rgba(50,186,238,0)');
      g.fillStyle = ag; g.beginPath(); g.arc(E[0], E[1], R + 330, 0, TAU); g.fill();
      // Earth: two-tone facets + land + clouds (clipped to globe).
      flat(g, earthPath, C.ocean, C.oceanSh, C.oceanHi, [60, 44], [40, 28]);
      g.save(); g.clip(earthPath);
      for (const lp of landPaths) flat(g, lp, C.land, C.landSh, C.landHi, [16, 14], [6, 5]);
      for (const cl of CLOUDS) {
        const th = cl.th + lt * 0.0045, [x, y] = P(th, R - cl.d), a = th;
        g.save(); g.translate(x, y); g.rotate(a); const bob = 3 * Math.sin(lt * 0.9 + cl.ph);
        const p = new Path2D(); p.ellipse(0, bob, cl.w, cl.w * 0.32, 0, 0, TAU); p.ellipse(-cl.w * 0.35, bob - cl.w * 0.18, cl.w * 0.45, cl.w * 0.3, 0, 0, TAU); p.ellipse(cl.w * 0.3, bob - cl.w * 0.12, cl.w * 0.38, cl.w * 0.26, 0, 0, TAU);
        g.globalAlpha = 0.92; flat(g, p, C.cloud, C.cloudSh, '#fff', [8, 9], [3, 3]); g.restore();
      }
      const dg = g.createRadialGradient(E[0], E[1], R - 1700, E[0], E[1], R);   // Darken toward center for spherical volume.
      dg.addColorStop(0, 'rgba(14,6,49,.55)'); dg.addColorStop(1, 'rgba(14,6,49,0)'); g.fillStyle = dg; g.fillRect(E[0] - R, E[1] - R, 2 * R, 2 * R);
      g.restore();
      // Faint orbit dashes always present.
      g.save(); g.strokeStyle = 'rgba(125,211,220,.16)'; g.lineWidth = 3 * px; g.setLineDash([14 * px, 16 * px]); g.lineDashOffset = -lt * 30 * px;
      g.beginPath(); g.arc(E[0], E[1], RO, 0, TAU); g.stroke(); g.restore();
      // Orbit cue: whole orbit traces bright, growing both ways from station.
      const op = MO.k75(seg(lt, Q.orbit, Q.orbit + 1.0));
      if (op > 0) { const ph = issTh(lt) - Math.PI / 2, sp = Math.PI * op;
        g.save(); g.lineCap = 'round'; g.strokeStyle = 'rgba(50,186,238,.28)'; g.lineWidth = 22 * px; g.beginPath(); g.arc(E[0], E[1], RO, ph - sp, ph + sp); g.stroke();
        g.strokeStyle = 'rgba(200,250,255,.95)'; g.lineWidth = 5 * px; g.stroke(); g.restore(); }
      // Launch pad: tower + blinking light.
      g.save(); g.translate(PAD[0], PAD[1]); g.rotate(TH_PAD); g.globalAlpha = 1 - MO.smooth(seg(lt, Q.first + 0.2, Q.first + 0.8));
      flat(g, rrP(-46, -62 * KW, 22, 62 * KW, 3), '#191670', '#0E0631', '#3826A3', [3, 3], [1, 1]);
      flat(g, rrP(-70, -8, 140, 12, 4), '#191670', '#0E0631', '#3826A3', [3, 3], [1, 1]);
      glow(g, -35, -62 * KW, 22, '#ff5d8f', 0.8 * (0.5 + 0.5 * Math.sin(lt * 5)));
      g.globalAlpha = 1;
      // Domestic cue: launch-site pulse ring.
      const hp = seg(lt, Q.home, Q.first + 0.3);
      if (hp > 0 && hp < 1) { for (let k = 0; k < 2; k++) { const q = ((lt - Q.home) * 0.9 + k * 0.5) % 1; g.strokeStyle = `rgba(250,204,18,${(1 - q) * 0.8 * Math.min(1, (1 - hp) * 5)})`; g.lineWidth = 4 * px; g.beginPath(); g.arc(0, 0, 20 * px + q * 120 * px, 0, TAU); g.stroke(); }
        glow(g, 0, 0, 60 * px, C.yellow, 0.6); }
      g.restore();
      // Launch smoke: flat circles expand/fade.
      for (const f of PUFFS) { const k = lt - f.tb; if (k < 0 || k > 2.6) continue;
        const r = (16 + k * 42) * f.sz, x = PAD[0] + f.dx * (30 + k * 110), y = PAD[1] - 10 - k * 8, a = (1 - k / 2.6);
        g.globalAlpha = a; flat(g, circ(x, y, r), '#e4def8', '#a9a2cf', '#fff', [r * 0.18, r * 0.2], [r * 0.07, r * 0.08]); }
      g.globalAlpha = 1;
      // Path: flowing dashes, brightened at domestic cue.
      const tEnd = Math.min(lt, TD);
      if (tEnd > L0 + 0.05) { const hb = MO.smooth(seg(lt, Q.home - 0.2, Q.home + 0.3)) * (1 - MO.smooth(seg(lt, Q.first, Q.first + 0.4)));
        g.save(); g.strokeStyle = `rgba(249,252,251,${0.35 + 0.55 * hb})`; g.lineWidth = (3 + 3 * hb) * px; g.setLineDash([12 * px, 12 * px]); g.lineDashOffset = -lt * (40 + 80 * hb) * px;
        g.beginPath(); for (let i = 0; i <= 80; i++) { const q = dPos(lerp(L0, tEnd, i / 80)); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); } g.stroke(); g.restore();
        if (hb > 0) { g.save(); g.globalAlpha = hb; g.strokeStyle = 'rgba(250,204,18,.25)'; g.lineWidth = 16 * px; g.beginPath(); for (let i = 0; i <= 80; i++) { const q = dPos(lerp(L0, tEnd, i / 80)); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); } g.stroke(); g.restore(); } }
      // Space station.
      const F = issF(lt);
      g.save(); g.translate(F.x, F.y); g.rotate(F.a); drawISS(g, lt);
      const dk = lt - TD;                                                       // Docking: light ring.
      if (dk > 0 && dk < 0.9) { const q = MO.cubicOut(dk / 0.9); g.strokeStyle = `rgba(249,239,147,${1 - q})`; g.lineWidth = 6 * (1 - q) + 2; g.beginPath(); g.arc(0, DOCK_Y, 10 + q * 150, 0, TAU); g.stroke(); glow(g, 0, DOCK_Y, 60 + q * 80, C.glowCore, 0.8 * (1 - q)); }
      g.restore();
      // Separated stages retreat, fall, tumble and fade.
      if (lt > TS && lt < TS + 1.4) { const k = lt - TS, h0 = dHead(TS), d0 = dPos(TS), sc = KW, L = (54 + DH) * KW;
        const bx = d0[0] - Math.sin(h0) * L, by = d0[1] + Math.cos(h0) * L;
        const rad = [Math.sin(issTh(TS)), -Math.cos(issTh(TS))];
        const x = bx - Math.sin(h0) * k * 60 - rad[0] * k * k * 90, y = by + Math.cos(h0) * k * 60 - rad[1] * k * k * 90;
        g.save(); g.globalAlpha = 1 - k / 1.4; g.translate(x, y); g.rotate(h0 + k * 0.5); g.scale(sc, sc); drawParts(g, F9S); g.restore(); }
      // Rocket / Dragon.
      const D = dPos(lt), hd = dHead(lt), ds = dScale(lt);
      const hiP = MO.smooth(seg(lt, Q.priv - 0.1, Q.priv + 0.4)) * (1 - MO.smooth(seg(lt, Q.orbit + 0.2, Q.orbit + 0.8)));
      g.save(); g.translate(D[0], D[1]); g.rotate(hd); g.scale(KW * ds, KW * ds);
      if (lt < TS) {                                                            // Full rocket: base 57.6m below Dragon center.
        g.translate(0, 54 + DH);
        if (lt > L0 - 0.15) { const fl = clamp((lt - L0 + 0.15) / 0.5); glow(g, 0, 6, 26 * fl, '#FACC12', 0.45 * fl); RK.flame(g, 0, 1.0, (14 + 22 * fl) * fl, 3.2, lt, ['rgba(244,131,1,.9)', 'rgba(250,204,18,.95)', '#F9EF93']); }
        drawParts(g, F9);
        g.translate(0, -54 - DH); g.save(); g.translate(0, 0); drawDragon(g, lt, { win: 0.42 }); g.restore();
      } else {
        if (lt < TD + 0.05) { const pf = 0.5 + 0.5 * Math.sin(lt * 31); for (const sx of [-1, 1]) { glow(g, sx * 2.2, -1.2, 1.4 * pf, '#ffffff', 0.8); } }   // Draco attitude-thruster flashes.
        if (hiP > 0) { glow(g, 0, 0, 10 + 1.2 * Math.sin(lt * 6), C.yellow, 0.5 * hiP); }
        drawDragon(g, lt, { win: 0.42 });
        if (hiP > 0) { g.save(); g.strokeStyle = `rgba(250,204,18,${hiP})`; g.lineWidth = 0.22; g.setLineDash([0.9, 0.7]); g.lineDashOffset = -lt * 2; g.beginPath(); g.arc(0, 0, 5.6, 0, TAU); g.stroke(); g.restore(); }
      }
      g.restore();
    });
    // Foreground particles d≈1.2 (screen-space drift suggests depth).
    for (const m of MOTES) { const x = (m.x + Math.sin(lt * 0.7 + m.ph) * 40 - cam.x * 0.08 + 4000) % W, y = (m.y - lt * 14 - cam.y * 0.05 + 4000) % H;
      c.globalAlpha = 0.35 + 0.35 * Math.sin(lt * 1.8 + m.ph); glow(c, x, y, m.s * 5, '#ffe9a8', 0.4); c.fillStyle = '#fff6d0'; c.beginPath(); c.arc(x, y, m.s * 0.8, 0, TAU); c.fill(); }
    c.globalAlpha = 1;

    // ---------- Screen layer: text and labels ----------
    const S = (x, y) => CAM.toScreen(cam, x, y);
    // May 2020: characters float up at upper left.
    const dOut = 1 - MO.sineInOut(seg(lt, Q.crew - 0.35, Q.crew + 0.1));
    if (dOut > 0) { c.save(); c.globalAlpha = dOut; TY.charsIn(c, '2020年5月', 120, 190, lt - Q.date + 0.1, { font: '92px "PuHui-Heavy"', color: '#F9FCFB', dur: 0.5, stagger: 0.045, dy: 30, shadow: { color: 'rgba(10,8,40,.5)', y: 6 } }); c.restore(); }
    // Crew Dragon: points to capsule atop rocket.
    { const D = S(...dPos(lt)); chip(c, '载人龙飞船', D[0] + 260, D[1] - 70, lt - Q.dragon + 0.05, seg(lt, TS + 0.2, TS + 0.45), { col: C.mag, to: [D[0] + 18, D[1]] }); }
    // Two astronauts: magnified window with two helmets.
    const bk = lt - (Q.crew - 0.15), bo = seg(lt, TD + 0.35, TD + 0.65);
    if (bk > 0 && bo < 1) {
      const bs = MO.backOut(clamp(bk / 0.5), 1.2) * (1 - MO.cubicIn(bo)), bx = 470, by = 470, br = 205 * bs, D = S(...dPos(lt));
      c.save(); c.strokeStyle = 'rgba(125,211,220,.8)'; c.lineWidth = 3; c.setLineDash([8, 8]); c.lineDashOffset = -lt * 30;
      const ang = Math.atan2(D[1] - by, D[0] - bx); c.globalAlpha = clamp(bk / 0.3) * (1 - bo);
      c.beginPath(); c.moveTo(bx + Math.cos(ang) * br, by + Math.sin(ang) * br); c.lineTo(D[0], D[1]); c.stroke(); c.restore();
      if (br > 2) {
        c.save(); c.beginPath(); c.arc(bx, by, br, 0, TAU); c.clip();
        c.fillStyle = TOON.vgrad(c, by - br, by + br, ['#0E0631', '#25155E']); c.fillRect(bx - br, by - br, 2 * br, 2 * br);
        for (let i = 0; i < 22; i++) { const sx = bx - 200 + ((U.hash(i, 1) * 400 - lt * 60) % 400 + 400) % 400, sy = by - 200 + U.hash(i, 2) * 400; c.fillStyle = `rgba(249,252,251,${0.3 + 0.5 * U.hash(i, 3)})`; c.beginPath(); c.arc(sx, sy, 1.5 + 2 * U.hash(i, 4), 0, TAU); c.fill(); }
        c.translate(bx, by); c.scale(bs, bs); c.rotate(-0.08 + 0.04 * Math.sin(lt * 1.1)); c.translate(0, MO.float(lt, 5, 3.3)); drawCrewWindow(c, lt); c.restore();
        c.save(); c.strokeStyle = 'rgba(125,211,220,.95)'; c.lineWidth = 8 * bs; c.beginPath(); c.arc(bx, by, br + 4, 0, TAU); c.stroke();
        c.strokeStyle = 'rgba(50,186,238,.25)'; c.lineWidth = 22 * bs; c.beginPath(); c.arc(bx, by, br + 16, 0, TAU); c.stroke(); c.restore();
        chip(c, '两名宇航员', bx, by + br + 46, bk - 0.25, bo, { col: C.cyan, size: 36 });
      }
    }
    // Space station.
    { const F = issF(lt), A = S(...toW(F, 150, -150)); chip(c, '空间站', A[0] + 150, A[1] - 90, lt - Q.iss, seg(lt, TD + 0.5, TD + 0.8), { col: C.cyan, to: A }); }
    // Nearly nine years: small 2011→2020 timeline, shuttle fades at 2011.
    const tin = lt - (Q.gap + 0.05), tout = seg(lt, Q.first - 0.15, Q.first + 0.2);
    if (tin > 0 && tout < 1) {
      c.save(); c.globalAlpha = 1 - tout;
      const x0 = 610, x1 = 1310, y = 236, lp = MO.k75(clamp(tin / 0.55));
      c.lineCap = 'round'; c.strokeStyle = '#3826A3'; c.lineWidth = 10; c.beginPath(); c.moveTo(x0 - 50, y); c.lineTo(lerp(x0 - 50, x1 + 50, lp), y); c.stroke();
      const tp = MO.k75(seg(lt, Q.nine, Q.nineEnd + 0.1));
      if (tp > 0) { c.strokeStyle = C.yellow; c.lineWidth = 10; c.beginPath(); c.moveTo(x0, y); c.lineTo(lerp(x0, x1, tp), y); c.stroke(); }
      for (const [k, x, yr] of [[0, x0, '2011'], [1, x1, '2020']]) {
        const q = MO.backOut(clamp((tin - 0.15 - k * 0.12) / 0.4), 1.4); if (q <= 0) continue;
        flat(c, circ(x, y, 16 * q), k && tp >= 1 ? C.yellow : '#F9FCFB', '#a9a2cf', '#fff', [3, 3], [1, 1]);
        c.save(); c.globalAlpha *= clamp(q); c.font = '46px "PuHui-Heavy"'; c.textAlign = 'center'; c.fillStyle = '#F9FCFB'; c.fillText(yr, x, y + 70); c.restore();
      }
      if (tp > 0 && tp < 1) { const x = lerp(x0, x1, tp); glow(c, x, y, 50, C.yellow, 0.8); c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, 9, 0, TAU); c.fill(); }
      // Shuttle appears at 2011, then grays/sinks/fades at nearly-nine-years cue.
      const sIn = MO.backOut(clamp((tin - 0.2) / 0.45), 1.3), sOut = MO.sineInOut(seg(lt, Q.nine - 0.2, Q.nine + 0.5));
      if (sIn > 0 && sOut < 1) { c.save(); c.globalAlpha *= (1 - sOut); c.translate(x0, y - 105 + sOut * 30 + MO.float(lt, 3, 2.7)); c.scale(0.95 * sIn, 0.95 * sIn); if (sOut > 0) c.filter = `grayscale(${sOut})`; drawShuttle(c); c.restore(); }
      chip(c, '近9年', (x0 + x1) / 2, y - 78, lt - Q.nine - 0.05, 0, { col: C.mag, size: 44 });
      const dI = lt - Q.nineEnd + 0.05; if (dI > 0) { c.save(); c.translate(x1, y - 92 + MO.float(lt, 4, 2.9)); const q = MO.backOut(clamp(dI / 0.45), 1.4); c.scale(q * 12, q * 12); c.rotate(0.12); drawDragon(c, lt, { win: 0.42, helmets: false }); c.restore(); }
      c.restore();
    }
    // Domestic cue: points to Florida launch site.
    { const A = S(...PAD); chip(c, '美国本土', A[0] - 30, A[1] - 190, lt - Q.home - 0.15, seg(lt, Q.first, Q.first + 0.3), { col: '#E07919', to: [A[0], A[1] - 6] }); }
    // Private company: Dragon highlight.
    { const D = S(...dPos(lt)); chip(c, '私人公司的飞船', D[0] + 360, D[1] - 140, lt - Q.priv, seg(lt, Q.orbit - 0.1, Q.orbit + 0.2), { col: '#E07919', size: 46, to: [D[0] + 60, D[1] - 30] }); }
    // Orbit.
    { const A = S(...P(issTh(lt) - 0.42, RO)); chip(c, '轨道', A[0], A[1] - 70, lt - Q.orbit - 0.55, 0, { col: C.cyan, size: 44, to: A }); }
  },
};

// Entry: Kurzgesagt light fills frame; warm glow grows from pad, then recedes to reveal new world.
ERAS.find(e => e.id === ID).transition = { type: 'kzBloom', dur: 0.7, cx: 960, cy: 400 };
})();
