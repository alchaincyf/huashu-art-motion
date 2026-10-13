// S02 · 2002: fly from whole desk into upper-left first cell. Black paper silhouette (faceless) and typed index card: 2002 · SpaceX founded;
// Goal of living on other planets: move camera along desk to newspaper quote, highlighter follows narration; red thread traces a route between halftone Earth and red planet (Vox map line with red dot at tip).
(() => {
const ID = 's02', V = VOX, C = V.C, F = V.F, PH = V.PH, TAU = Math.PI * 2;
const { clamp, lerp } = U, seg = MO.seg, step = V.step;
const cell = V.cell(ID), X0 = cell.x, Y0 = cell.y, xy = (x, y) => ({ x: X0 + x, y: Y0 + y });
const cue = k => TM.cue(ID, k), G = k => V.cue(ID, k);
const T = { name: '马斯克', yr: '2002', act: '创办 SpaceX', q1: '目标：', q2: '有一天，让人类', q3: '住到别的星球上', earth: '地球' };

// Black-paper silhouette: suited man (outline, no facial features)
const man = () => V.cutout('s02man', 300, 520, (g, w, h) => {
  // Paper-cut person (outline only, faceless): rounded shoulders, fitted suit jacket, slightly separated arms and trouser legs, scissor-cut edges with subtle irregular curves
  const tile = CL.paperTile('vxblackman', '#1d1d1c', { amt: 6, fibers: 60, seed: 3 }), cx = w / 2;
  const R = [[0, 10], [24, 16], [40, 44], [42, 80], [32, 110], [20, 124], [22, 142], [66, 154], [108, 170], [122, 196], [128, 260], [130, 330], [126, 384], [110, 392], [102, 340], [100, 262], [86, 300], [84, 404], [70, 404], [66, h - 30], [72, h - 10], [30, h - 6], [26, h - 30], [14, 412], [0, 404]];
  const P = R.concat(R.slice(1, -1).reverse().map(([x, y]) => [-x, y]));
  const pts = KIT.densify(P.map(([x, y]) => [cx + x, y]).concat([[cx, 10]]), 4).map(([x, y], i) => [x + PAINT.noise(i * 0.31, 2.2) * 1.6, y + PAINT.noise(i * 0.27, 5.1) * 1.6]);
  g.fillStyle = g.createPattern(tile, 'repeat'); g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill();
  g.fillStyle = '#4a4a48'; g.beginPath(); g.moveTo(cx - 24, 150); g.lineTo(cx, 236); g.lineTo(cx + 24, 150); g.closePath(); g.fill();   // Shirt collar (gray)
}, { ht: false, edge: 8 });
const globe = (key, R, draw, ink) => V.cutout(key, R * 2, R * 2, (g) => draw(g, R, R, R), { cell: 5, edge: 6, ink });

V.item({ key: 's02man', ...xy(470, 700), r: -0.02, z: 12, at: G('2002') - 0.05, enter: { from: [-420, 80], tilt: -0.2, dur: 0.5 }, draw(g, T_) {
  V.blit(g, man());
  g.save(); g.translate(0, 296); g.rotate(0.02); g.fillStyle = C.paper; g.save(); g.translate(-110, -38); CL.tornRect(g, 220, 76, 7, 2); g.fill(); g.restore();
  V.typed(g, T.name, -78, 20, V.nTyped(T_, G('马斯克'), 12), 52, F.heavy, C.ink); g.restore();
} });
V.item({ key: 's02card', ...xy(1000, 700), r: 0.025, z: 11, at: G('创办') - 0.2, enter: { from: [380, -120], tilt: 0.16, dur: 0.45 }, draw(g, T_) {
  const sp = V.spr('s02card', 520, 300, (gg, w, h) => V.indexCard(gg, w, h, { top: 78, gap: 54 })); V.blit(g, sp);
  const n = V.nTyped(T_, G('创办'), 13); V.typed(g, T.yr, -220, -78, n, 56, F.type, C.red); V.typed(g, T.act, -220, 30, n - 4, 64, F.heavy, C.ink);
} });
// Quote clipping (pretyped, highlighter follows living on other planets)
const QW = 720, QH = 250;
V.item({ key: 's02quote', ...xy(1720, 1060), r: -0.02, z: 11, at: G('目标') - 0.25, enter: { from: [0, 300], tilt: -0.1, dur: 0.4 }, draw(g, T_) {
  const sp = V.spr('s02quote', QW, QH, (gg, w, h) => { V.paper(gg, w, h, 23, { amp: 4 }); V.text(gg, T.q1, 46, 80, 40, F.heavy, C.red); V.serifBold(gg, T.q2, 46, 150, 56); V.serifBold(gg, T.q3, 46, 218, 56); }); V.blit(g, sp);
  g.save(); g.translate(-QW / 2, -QH / 2); g.font = V.font(56, F.serif); const w3 = g.measureText(T.q3).width;
  V.hl(g, 38, 170, w3 + 18, 62, MO.sineInOut(seg(step(T_), G('住到') - 0.05, G('上') + 0.1))); g.restore();
} });
// Earth → planet: red route line (solid red dot at tip)
const E = xy(1440, 620), M = xy(2150, 520), ER = 170, MR = 120;
V.item({ key: 's02earth', ...E, r: 0, z: 10, at: G('目标') - 0.3, draw(g) { V.blit(g, globe('s02earth', ER, (gg, cx, cy, R) => PH.globe(gg, cx, cy, R, 4))); g.save(); g.translate(0, ER + 46); g.fillStyle = C.paper; g.fillRect(-70, -30, 140, 60); V.text(g, T.earth, 0, 18, 40, F.heavy, C.ink, 'center'); g.restore(); } });
V.item({ key: 's02mars', ...M, r: 0, z: 10, at: G('别的') - 0.1, enter: { from: [420, -80], tilt: 0.25, dur: 0.45 }, draw(g) { V.blit(g, globe('s02mars', MR, (gg, cx, cy, R) => PH.moon(gg, cx, cy, R, 6, '#d8d8d8'), C.red2)); } });
const ROUTE = (() => { const a = [E.x + ER * 0.8, E.y - ER * 0.55], b = [M.x - MR * 1.05, M.y + 10], pts = []; for (let i = 0; i <= 60; i++) { const u = i / 60; pts.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u) - Math.sin(u * Math.PI) * 190]); } return { pts, cum: DG.cum(pts) }; })();
V.item({ key: 's02route', x: (E.x + M.x) / 2, y: E.y - 120, z: 13, rad: 700, at: G('让人') - 0.1, draw(g, T_) {
  const q = MO.sineInOut(seg(step(T_), G('让人'), G('星球') + 0.1)); g.save(); g.translate(-(E.x + M.x) / 2, -(E.y - 120));
  const L = ROUTE.cum[ROUTE.cum.length - 1] * q; g.setLineDash([22, 16]); CL.string(g, ROUTE.pts, ROUTE.cum, L, { col: C.red, lw: 7, shadow: null }); g.setLineDash([]);
  const tip = DG.pointAt(ROUTE.pts, ROUTE.cum, L); g.fillStyle = C.red; g.beginPath(); g.arc(tip[0], tip[1], 13, 0, TAU); g.fill(); g.restore();
} });

// ---------- Camera: long-tail flight from whole desk into 2002 → track to quote and route → follow thread right into next cell ----------
const at = (x, y, z, sy) => V.at(X0 + x, Y0 + y, z, sy);
const cam = (lt) => CAM.at([
  V.key(0, V.camEnd('s01')),
  V.key(0.85, at(760, 600, 1.0), MO.longTail),
  V.key(cue('目标') - 0.1, at(790, 610, 1.04), MO.sineInOut),
  V.key(cue('有一') + 0.15, at(1760, 700, 0.92), MO.sineInOut),
  V.key(TM.dur(ID) - 0.35, at(1790, 700, 0.95), MO.sineInOut),
  V.key(TM.dur(ID), at(1900, 700, 0.95), MO.cubicIn),
], lt);
V.scene(ID, { cam, init() { V.glyphs(ID, [[F.heavy, T.name + T.act + T.q1 + T.earth], [F.type, T.yr], [F.serif, T.q2 + T.q3]]); } });
})();
