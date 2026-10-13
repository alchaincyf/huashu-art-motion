// S12 · Next (future events use pencil sketches and dashed lines on tracing paper, distinct from halftone photos of past events).
// ① Sketch: tower arms catch spacecraft (pencil reveals stroke by stroke); ② sketch: two Starships tail-to-tail, dashed red refueling arrow;
// ③ Dashed red return-to-Moon route from paper-cut Earth to lunar halftone photo; ④ Later, Mars: red thread leads from Moon to red halftone Mars at far right of desk;
// ⑤ Narration ends, long-tail pullback to whole desk — 24 years of evidence fills it, 24-years black label lands again (opening callback).
(() => {
const ID = 's12', V = VOX, C = V.C, F = V.F, PH = V.PH, TAU = Math.PI * 2;
const { clamp, lerp } = U, seg = MO.seg, step = V.step;
const cell = V.cell(ID), X0 = cell.x, Y0 = cell.y, xy = (x, y) => ({ x: X0 + x, y: Y0 + y });
const cue = k => TM.cue(ID, k), G = k => V.cue(ID, k), t0 = V.t0(ID);
const T = { catch: '用筷子夹住飞船', fuel: '太空加油', moon: '重返月球', mars: '火星', plan: '计划', earth: '地球' };
const GR = 'rgba(52,52,48,.95)', NONE = 'rgba(0,0,0,0)';
const pencil = { body: 'rgba(80,80,74,.10)', dark: 'rgba(80,80,74,.25)', nose: 'rgba(255,255,255,.18)', engine: 'rgba(80,80,74,.3)', window: NONE, trunk: NONE, flap: 'rgba(80,80,74,.2)', tiles: 'rgba(80,80,74,.12)', truss: 'rgba(80,80,74,.25)', line: GR, lw: 0.95 };
// Cached tracing paper and pencil sketch, zigzag reveal simulates drawing strokes
const sheet = (key, w, h) => V.spr('s12sh' + key, w, h, (g) => { g.fillStyle = 'rgba(248,248,242,.55)'; CL.tornRect(g, w, h, key.length * 17, 4); g.fill(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; g.stroke(); }, { sh: { blur: 6, y: 3, col: 'rgba(50,40,25,.18)' } });
const trace = (key, w, h, draw, dash = [14, 9]) => V.spr('s12' + key, w, h, (g) => { g.save(); g.setLineDash(dash); draw(g, w, h); g.restore(); }, { shadow: false });
const reveal = (g, sp, w, h, q, rows = 7, bx = [-w / 2, -h / 2, w, h]) => { if (q <= 0) return; if (q >= 1) { V.blit(g, sp); return; } const pts = DG.zigzag(bx[0], bx[1], bx[2], bx[3], rows), L = DG.cum(pts), m = DG.revealMask(pts, L, L[L.length - 1] * q, h / rows * 1.25); g.save(); g.clip(m); V.blit(g, sp); g.restore(); if (q < 1) { const tip = DG.pointAt(pts, L, L[L.length - 1] * q); g.save(); g.translate(tip[0], tip[1]); g.rotate(-0.6); g.fillStyle = '#d7b46a'; g.fillRect(0, -6, 70, 12); g.fillStyle = '#3a3a36'; g.beginPath(); g.moveTo(0, -6); g.lineTo(-16, 0); g.lineTo(0, 6); g.fill(); g.restore(); } };
V.item({ key: 's12bg', ...xy(1180, 1120), r: 0.008, z: 5, at: t0 - 1, draw(g) { V.blit(g, V.spr('s12bg', 1700, 1250, (gg, w, h) => V.paper(gg, w, h, 97, { col: '#d9cba9', amp: 6, age: 0.3 }), { sh: { blur: 14, y: 8 } })); V.tape(g, -790, -590, -0.6, 150); V.tape(g, 790, -590, 0.55, 150); } });
// ① Tower catches spacecraft
const S1W = 760, S1H = 980, S1 = xy(600, 1000), S1t = [-0.25 + t0, G('飞船') + 0.1];
const sk1 = () => trace('catch', S1W, S1H, (g, w, h) => {   // Solid pencil: tower (lower part extends off paper), two closed arms holding spacecraft
  const s = 6.2, base = h + 220, tx = w * 0.68; RK.at(g, tx, base, s, 0, q => RK.fill(q, RK.tower({ armY: 100, open: 0, len: 28 }), pencil));
  RK.at(g, tx - 22 * s, base - 100 * s + 40 * s, s, 0, q => RK.fill(q, RK.ship(), pencil));
  g.strokeStyle = GR; g.lineWidth = 3; g.strokeRect(tx, base - 146 * s, 12 * s, 146 * s);   // Trace tower outline continuously (no fragmented segments)
  g.strokeStyle = 'rgba(52,52,48,.35)'; g.lineWidth = 2; for (let k = 0; k < 14; k++) { const y = base - 100 * s - 30 + k * 4; g.beginPath(); g.moveTo(tx - 28 * s, y); g.lineTo(tx - 28 * s + 30, y - 18); g.stroke(); }
}, []);
V.item({ key: 's12s1', ...S1, r: -0.025, z: 12, at: t0 - 1, draw(g, T_) {
  V.blit(g, sheet('catch', S1W, S1H)); V.tape(g, -S1W / 2 + 40, -S1H / 2 + 14, -0.6, 110); V.tape(g, S1W / 2 - 40, -S1H / 2 + 14, 0.55, 110); reveal(g, sk1(), S1W, S1H, MO.cubicOut(seg(step(T_), S1t[0], S1t[1])), 6, [-200, -S1H / 2, 460, S1H]);
  g.save(); g.translate(-60, -S1H / 2 + 70); g.rotate(0.02); V.label(g, T.catch, 46, { bg: C.card, col: C.ink, n: V.nTyped(T_, G('用筷子'), 12) }); g.restore();
} });
// ② Two Starships refuel tail-to-tail
const S2W = 640, S2H = 300, S2 = xy(1360, 720), S2t = [G('飞船') - 0.05, G('加油') + 0.15];
const sk2 = () => trace('fuel', S2W, S2H, (g, w, h) => { RK.at(g, w / 2 - 6, h / 2, 5.0, -Math.PI / 2, q => RK.fill(q, RK.ship(), pencil)); RK.at(g, w / 2 + 6, h / 2, 5.0, Math.PI / 2, q => RK.fill(q, RK.ship(), pencil)); });
const FA = V.handPts('s12fa', [[-150, -96], [-40, -122], [80, -110], [150, -80]], { amp: 1.4, seed: 4 });
V.item({ key: 's12s2', ...S2, r: 0.02, z: 12, at: G('飞船') - 0.4, enter: { from: [420, -160], tilt: 0.14, dur: 0.35 }, draw(g, T_) {
  const st = step(T_); V.blit(g, sheet('fuel', S2W, S2H)); V.tape(g, 0, -S2H / 2 + 6, 0.04, 120); reveal(g, sk2(), S2W, S2H, MO.sineInOut(seg(st, S2t[0], S2t[1])), 4);
  g.save(); g.setLineDash([18, 12]); V.pen(g, FA, MO.sineInOut(seg(st, G('加油') - 0.1, G('加油') + 0.3)), { lw: 7 }); g.restore();
  if (st >= G('加油')) { g.save(); g.translate(150, -80); g.rotate(0.5); g.strokeStyle = C.red; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(-26, -18); g.lineTo(0, 0); g.lineTo(-26, 18); g.stroke(); g.restore(); g.save(); g.translate(0, -170); V.label(g, T.fuel, 46, { bg: C.card, col: C.ink, n: V.nTyped(T_, G('加油'), 10) }); g.restore(); }
} });
// ③ Earth → Moon
const ER = 165, MR = 105, EP = xy(1000, 1480), MP = xy(1660, 1290);
const earth = () => V.cutout('s12earth', ER * 2, ER * 2, (g) => PH.globe(g, ER, ER, ER, 4), { cell: 4, edge: 5 });
const moon = () => V.cutout('s12moon', MR * 2, MR * 2, (g) => PH.moon(g, MR, MR, MR, 31, '#e0e0e0'), { cell: 5, edge: 6 });
const ROUTE = (() => { const a = [EP.x + ER, EP.y - 30], b = [MP.x - MR - 10, MP.y + 20], o = []; for (let i = 0; i <= 50; i++) { const u = i / 50; o.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u) - Math.sin(u * Math.PI) * 160]); } return { p: o, L: DG.cum(o) }; })();
V.item({ key: 's12earth', ...EP, z: 11, at: G('争取') - 0.3, enter: { from: [-200, 260], tilt: -0.2, dur: 0.35 }, draw(g) { V.blit(g, earth()); g.save(); g.translate(ER * 0.75, -ER - 10); g.rotate(-0.04); V.label(g, T.earth, 44, { bg: C.card, col: C.ink }); g.restore(); } });
V.item({ key: 's12moon', ...MP, z: 11, at: G('争取') - 0.1, enter: { from: [300, 260], tilt: 0.2, dur: 0.4 }, draw(g, T_) { V.blit(g, moon()); V.tape(g, 0, -MR - 2, 0.05, 110); if (step(T_) >= G('月球') - 0.05) { g.save(); g.translate(0, -MR - 70); g.rotate(-0.03); V.label(g, T.moon, 56, { n: V.nTyped(T_, G('月球') - 0.05, 10) }); g.restore(); } } });
V.item({ key: 's12route', x: (EP.x + MP.x) / 2, y: EP.y - 150, z: 13, rad: 900, at: G('把美国') - 0.1, draw(g, T_) {
  const q = MO.sineInOut(seg(step(T_), G('把美国') - 0.05, G('月球') + 0.1)), Lq = ROUTE.L[ROUTE.L.length - 1] * q;
  g.save(); g.translate(-(EP.x + MP.x) / 2, -(EP.y - 150)); g.setLineDash([22, 16]); CL.string(g, ROUTE.p, ROUTE.L, Lq, { col: C.red, lw: 7, shadow: null }); g.setLineDash([]);
  const tip = DG.pointAt(ROUTE.p, ROUTE.L, Lq); g.fillStyle = C.red; g.beginPath(); g.arc(tip[0], tip[1], 13, 0, TAU); g.fill(); g.restore();
} });
// ④ Red thread leads to Mars at far right of desk
const MARS = xy(2150, 880), MRR = 140;
const mars = () => V.cutout('s12mars', MRR * 2, MRR * 2, (g) => PH.moon(g, MRR, MRR, MRR, 47, '#d6d6d6'), { cell: 6, edge: 7, ink: C.red2 });
const SM = (() => { const a = [MP.x + MR * 0.7, MP.y - MR * 0.7], b = [MARS.x - MRR * 0.75, MARS.y + MRR * 0.6], pts = CL.stringPts(a, b, 0.06); return { a, b, pts, cum: DG.cum(pts) }; })();
V.item({ key: 's12mars', ...MARS, z: 11, at: G('再往后') + 0.3, enter: { from: [380, -200], tilt: 0.22, dur: 0.4 }, draw(g, T_) { V.blit(g, mars()); V.tape(g, -MRR + 30, -MRR + 30, -0.7, 120); const tm = G('再往后') + 0.65; if (step(T_) >= tm) { g.save(); g.translate(0, MRR + 70); g.rotate(0.03); V.label(g, T.mars, 72, { bg: C.red2, n: V.nTyped(T_, tm, 8) }); g.restore(); } } });
V.item({ key: 's12str', x: (SM.a[0] + SM.b[0]) / 2, y: (SM.a[1] + SM.b[1]) / 2, z: 48, rad: 900, at: G('再往后') - 0.05, draw(g, T_) {
  const q = MO.sineInOut(seg(step(T_), G('再往后') - 0.05, G('再往后') + 0.75)); g.save(); g.translate(-(SM.a[0] + SM.b[0]) / 2, -(SM.a[1] + SM.b[1]) / 2);
  CL.string(g, SM.pts, SM.cum, SM.cum[SM.cum.length - 1] * q, { col: C.red, lw: Math.max(5, 2.4 / V.zoom) }); V.pin(g, SM.a[0], SM.a[1]); if (q >= 1) V.pin(g, SM.b[0], SM.b[1]); g.restore();
} });
// ⑤ Whole desk: 24 years lands again
V.item({ key: 's12big', x: 5750, y: 1975, r: 0.012, z: 60, rad: 3000, at: t0 + TM.cue(ID, '火星') + 0.85, enter: { drop: 0.3, dur: 0.3 }, draw(g) { g.scale(0.68, 0.68);
  V.blit(g, V.spr('s12big', 1500, 640, (gg, w, h) => { gg.save(); CL.tornRect(gg, w, h, 57, 6); gg.fillStyle = C.black; gg.fill(); gg.restore(); V.text(gg, '24', 120, h / 2 + 205, 560, F.num, C.yel); V.text(gg, '年', 120 + 470, h / 2 + 200, 420, F.heavy, C.paper); }, { S: 0.6, pad: 40, sh: { blur: 30, y: 20 } }));
} });

// ---------- Camera ----------
const at = (x, y, z, sy) => V.at(X0 + x, Y0 + y, z, sy);
const OV0 = V.overview(), OV = { ...OV0, y: OV0.y + 220, z: OV0.z * 0.92 }, vEnd = TM.vo(ID)[1];
const cam = (lt) => CAM.at([
  V.key(0, V.camEnd('s11')),
  V.key(0.6, at(1000, 950, 0.98), MO.longTail),
  V.key(cue('在太空') - 0.15, at(1000, 945, 1.03), MO.sineInOut),
  V.key(cue('在太空') + 0.3, at(1340, 780, 1.12), MO.cubicInOut),
  V.key(cue('争取') - 0.05, at(1340, 790, 1.15), MO.sineInOut),
  V.key(cue('争取') + 0.45, at(1330, 1270, 0.98), MO.cubicInOut),
  V.key(cue('再往后') - 0.05, at(1340, 1270, 1.03), MO.sineInOut),
  V.key(cue('再往后') + 0.85, at(1820, 1020, 0.95), MO.longTail),          // Follow red thread to Mars
  V.key(cue('火星') - 0.15, at(1840, 1020, 0.98), MO.sineInOut),
  V.key(cue('火星') + 0.95, OV, MO.longTail),                               // Pullback reveal: whole desk, hold a full beat
  V.key(TM.dur(ID) + 0.01, { ...OV, z: OV.z * 1.015 }, MO.sineInOut),
], lt);
V.scene(ID, { cam, init() { V.prewarm(); V.glyphs(ID, [[F.heavy, T.catch + T.fuel + T.moon + T.mars + T.earth + '年'], [F.num, '24']]); } });
})();
