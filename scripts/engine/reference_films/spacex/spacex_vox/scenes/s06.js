// S06 · 2018 Falcon Heavy (fast pace: three cards, two fast moves).
// ① Hard-cut to vertical halftone photo: three-core Falcon Heavy launches, black label types 2018 · Falcon Heavy maiden flight;
// ② Orbit diagram on black cardstock: paper Sun, Earth orbit in white pencil, Roadster's ellipse in red pen, small paper-cut car steps along red line;
// ③ Side-by-side photo diptych: two paper-cut boosters land and smoke on the same beat — landing side by side.
(() => {
const ID = 's06', V = VOX, C = V.C, F = V.F, PH = V.PH, TAU = Math.PI * 2;
const { clamp, lerp } = U, seg = MO.seg, step = V.step;
const cell = V.cell(ID), X0 = cell.x, Y0 = cell.y, xy = (x, y) => ({ x: X0 + x, y: Y0 + y });
const cue = k => TM.cue(ID, k), G = k => V.cue(ID, k), t0 = V.t0(ID);
const T = { lab: '2018 · 重型猎鹰首飞', sun: '太阳', earth: '地球轨道', orbit: '绕太阳的轨道', car: '跑车', pair: '两枚助推器 · 并排落回' };

// ① Falcon Heavy liftoff photo
const fhDraw = (g, w, h) => {
  PH.sky(g, w, h, '#262626', '#b8b8b8');
  PH.smoke(g, w * 0.5, h * 1.0, 170, 18, 5, '#f2f2f2', 1.6);
  PH.plume(g, [[w * 0.5, h * 1.02], [w * 0.5, h * 0.62]], 50, 90, 7, '#ececec');
  PH.glow(g, w * 0.5, h * 0.74, 170, 0.95);
  for (const dx of [-1, 0, 1]) PH.flame(g, w * 0.5 + dx * 18, h * 0.7, 200, 34);
  PH.rocket(g, RK.heavy({ payload: 'fairing' }), w * 0.5, h * 0.7, h / 125);
};
const FH = xy(2070, 880), FW = 560, FHh = 760;
V.item({ key: 's06fh', ...FH, r: 0.02, z: 10, at: t0 - 1, draw(g) { V.blit(g, V.photo('s06fh', FW, FHh, fhDraw, { cell: 6, border: 16 })); V.tape(g, 0, -FHh / 2 - 8, 0.03, 160); } });
V.item({ key: 's06lab', ...xy(2075, 1190), r: -0.025, z: 12, at: G('2018') - 0.05, enter: { drop: 0.25, dur: 0.25 }, draw(g, T_) { V.label(g, T.lab, 46, { n: V.nTyped(T_, G('2018'), 11) }); } });

// ② Black-cardstock orbit diagram
const BW = 980, BH = 640, B = xy(1010, 840), SUN = [-60, 20], ORX = 330, ORY = 200;
const ORB = (() => { const o = []; for (let i = 0; i <= 80; i++) { const a = -2.2 + i / 80 * TAU * 0.98; o.push([SUN[0] + 60 + Math.cos(a) * ORX * 1.18, SUN[1] + Math.sin(a) * ORY * 1.25]); } return V.handPts('s06orb', o, { amp: 1.5, seed: 8 }); })();
const EARTH = V.handPts('s06earth', DG.ellipsePts(SUN[0], SUN[1], ORX * 0.82, ORY * 0.82, -1, 1.02, 64), { amp: 1.2, seed: 3 });
const sun = () => V.cutout('s06sun', 220, 220, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2); r.addColorStop(0, '#fafafa'); r.addColorStop(1, '#9a9a9a'); g.fillStyle = r; g.beginPath(); g.arc(w / 2, h / 2, w / 2, 0, TAU); g.fill(); }, { cell: 5, edge: 6 });
const car = () => V.cutout('s06car', 150, 70, (g, w, h) => {
  // Convertible Roadster (side view, no roof), white-suited astronaut in driver seat (opaque helmet visor)
  g.fillStyle = '#efefef'; g.beginPath(); g.ellipse(70, 22, 12, 13, 0, 0, Math.PI * 2); g.fill(); g.fillRect(60, 30, 20, 22);   // Suited astronaut
  g.fillStyle = '#1b1b1a'; g.beginPath(); g.ellipse(74, 22, 8, 7, 0, 0, Math.PI * 2); g.fill();                                   // Visor
  g.fillStyle = C.red2; g.beginPath(); g.moveTo(4, 56); g.lineTo(10, 42); g.lineTo(44, 38); g.lineTo(58, 40); g.lineTo(86, 40); g.lineTo(104, 36); g.lineTo(140, 40); g.lineTo(146, 52); g.lineTo(140, 58); g.lineTo(8, 58); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(92, 40); g.lineTo(100, 26); g.stroke();             // Windshield frame
  g.fillStyle = '#1b1b1a'; for (const x of [32, 118]) { g.beginPath(); g.arc(x, 58, 11, 0, Math.PI * 2); g.fill(); }
}, { ht: false, edge: 5 });
const tOrb = [G('绕太阳') - 0.1, G('轨道') + 0.15], tCar = [tOrb[0] + 0.25, G('两枚') + 0.2];
V.item({ key: 's06card', ...B, r: -0.015, z: 11, at: t0 - 1, draw(g, T_) {
  V.blit(g, V.spr('s06bk', BW, BH, (gg, w, h) => V.blackCard(gg, w, h, 91), { sh: { blur: 8, y: 5 } }));
  const st = step(T_);
  g.save(); g.setLineDash([10, 12]); V.pen(g, EARTH, 1, { col: 'rgba(238,237,235,.55)', lw: 3 }); g.restore();
  V.text(g, T.earth, SUN[0] - ORX * 0.6, SUN[1] + ORY * 0.82 + 52, 30, F.bold, 'rgba(238,237,235,.7)');
  V.blit(g, sun(), SUN[0], SUN[1]); V.text(g, T.sun, SUN[0], SUN[1] + 146, 34, F.heavy, C.paper, 'center');
  V.pen(g, ORB, MO.sineInOut(seg(st, tOrb[0], tOrb[1])), { lw: 7 });
  const q = seg(st, tCar[0], tCar[1]);
  if (st >= G('跑车') - 0.1) { const L = ORB.L[ORB.L.length - 1], d = L * (0.02 + 0.5 * q), p = DG.pointAt(ORB.p, ORB.L, d), p2 = DG.pointAt(ORB.p, ORB.L, d + 8);
    g.save(); g.translate(p[0], p[1]); g.rotate(Math.atan2(p[1] - SUN[1], p[0] - SUN[0] - 60) + Math.PI / 2); V.blit(g, car(), 0, -30); g.restore(); }
  if (st >= G('绕太阳')) { g.save(); g.translate(BW / 2 - 320, -BH / 2 + 76); V.typed(g, T.orbit, 0, 0, V.nTyped(T_, G('绕太阳'), 12), 46, F.heavy, C.paper); g.restore(); }
} });

// ③ Photo diptych: two boosters land on the same beat
const DW = 400, DHh = 330, D = xy(820, 1460), gapX = 222;
const padDraw = (k) => (g, w, h) => { PH.sky(g, w, h, '#7a7a7a', '#d0d0d0'); const gy = h * 0.74; g.fillStyle = '#5a5a5a'; g.fillRect(0, gy, w, h - gy); g.strokeStyle = '#e6e6e6'; g.lineWidth = 6; g.beginPath(); g.ellipse(w * 0.5, h * 0.86, 120, 22, 0, 0, TAU); g.stroke(); };
const boost = () => V.cutout('s06b', 50, 220, (g, w, h) => RK.at(g, w / 2, h - 20, 4.8, 0, q => V.shadeFill(q, RK.falcon9({ stage: 'booster', legs: 1, fins: 1 }), V.GREY)), { cell: 3, edge: 4 });
const cone = () => V.cutout('s06bc', 50, 40, (g, w, h) => { g.fillStyle = '#e8e8e8'; g.beginPath(); g.moveTo(5, h); g.quadraticCurveTo(w / 2, -h * 0.6, w - 5, h); g.closePath(); g.fill(); }, { cell: 3, edge: 4 });
const tL = G('落回'), tD = G('两枚') - 0.1;
V.item({ key: 's06dip', ...D, r: 0.01, z: 11, at: t0 - 1, draw(g, T_) {
  const st = step(T_);
  for (const s of [-1, 1]) {
    g.save(); g.translate(s * gapX, s * 6); g.rotate(s * 0.02); V.blit(g, V.photo('s06pad' + s, DW, DHh, padDraw(s), { cell: 5, border: 12 }));
    g.save(); g.beginPath(); g.rect(-DW / 2, -DHh / 2, DW, DHh); g.clip();
    const q = clamp((st - tD) / (tL - tD)), y = st < tL ? -360 * Math.pow(1 - q, 1.7) : MO.settle(st - tL, 3, 3, 7);
    g.translate(0, DHh * 0.36 - 110 + y); V.blit(g, boost()); g.save(); g.translate(0, -132); V.blit(g, cone()); g.restore();
    if (st < tL) { g.fillStyle = '#e9d84a'; g.beginPath(); g.moveTo(-10, 112); g.lineTo(0, 112 + 60 * (1 - q * 0.6)); g.lineTo(10, 112); g.fill(); }
    else { const pv = clamp((st - tL) / 0.4); g.globalAlpha = 0.9; PH.smoke(g, 0, 118, 26 + 30 * pv, 6, 3, '#f0f0f0'); }
    g.restore(); g.restore();
  }
  g.save(); g.translate(0, -DHh / 2 - 66); g.rotate(-0.02); V.label(g, T.pair, 50, { n: V.nTyped(T_, G('两枚'), 14) }); g.restore();
} });

// ---------- Camera: hard-cut in → fast move to black card → fast move to diptych → start left ----------
const at = (x, y, z, sy) => V.at(X0 + x, Y0 + y, z, sy);
const cam = (lt) => CAM.at([
  V.key(0, at(2050, 920, 1.0)),
  V.key(cue('跑车') - 0.45, at(2040, 930, 1.07), MO.sineInOut),
  V.key(cue('跑车') + 0.05, at(980, 860, 1.18), MO.cubicInOut),
  V.key(cue('两枚') - 0.15, at(990, 860, 1.24), MO.sineInOut),
  V.key(cue('两枚') + 0.35, at(820, 1390, 1.42), MO.cubicInOut),
  V.key(TM.dur(ID) - 0.3, at(820, 1400, 1.5), MO.sineInOut),
  V.key(TM.dur(ID), at(700, 1380, 1.42), MO.cubicIn),
], lt);
V.scene(ID, { cam, init() { V.glyphs(ID, [[F.heavy, T.lab + T.sun + T.orbit + T.pair], [F.bold, T.earth]]); } });
})();
