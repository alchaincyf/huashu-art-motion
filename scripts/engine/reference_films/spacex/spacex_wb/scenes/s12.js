// S12 · Next (row D end, x 10410–12610) and film ending. Future events use dashed lines (whiteboard plan convention):
// Next → dashed tower with two orange arms catches dashed spacecraft → two spacecraft tail-to-tail, orange fuel drop between, refueling → dashed arc to Moon, small spacecraft and helmeted figure on surface;
// Camera moves right, later → Mars: orange hatching and S02's small house, Mars pops up.
// Finally pull all the way back to show all 24 years of whiteboard notes; small rocket follows long dashed orange route from S02's other planet to Mars.
WB.chapter('s12', id => {
  const q = k => WB.q(id, k), { OR, INK } = WB, D = WB.D, Y = v => WB.ROW.D + v;
  const t0 = WB.T0(id), G = Y(880), DASH = [18, 14];
  const dashed = (arr, d = DASH) => arr.map(k => k.fillPts ? k : { ...k, dash: d });
  // ---- Next: catch spacecraft with chopsticks ----
  WB.lead([10040, Y(620)], [10410, Y(300)], q('接下来') - 0.12 - 0.62, 0.5);   // Lead-in and camera move together: pen leads, writing begins exactly on arrival
  WB.go(q('接下来') - 0.12); WB.text('接下来', 10430, Y(240), 104, { rate: 9 });
  WB.arrow([10770, Y(205)], [10940, Y(205)], { col: OR, head: 24, w: 6 });
  const TX = 10710, TH = 600;
  WB.go(q('筷子') - 0.25); WB.line([[10510, G], [11010, G]], { speed: 8300, w: 6 });
  WB.sk(D.tower(TH, 80), TX, G, { speed: 8300, w: 5.5 });
  const AY = G - TH + 160;
  WB.line([[TX + 40, AY - 12], [TX + 300, AY - 30]], { col: OR, w: 10, speed: 3600, smooth: false, dash: [24, 14] });
  WB.line([[TX + 40, AY + 12], [TX + 300, AY + 30]], { col: OR, w: 10, speed: 3600, smooth: false, dash: [24, 14] });
  const SH = 380, m = SH / 52;
  WB.go(q('飞船') - 0.1); WB.sk(dashed(D.starship(SH, 'ship', { flap: 0.2 })), TX + 190, AY + (52 - 30) * m, { speed: 6300, w: 5.5 });
  // ---- Refuel in space ----
  WB.go(q('在太空') - 0.05);
  const RY0 = Y(330), RS = 210;
  WB.sk(dashed(D.starship(RS, 'ship')), 11270, RY0, { rot: -Math.PI / 2, speed: 10710, w: 5 });
  WB.sk(dashed(D.starship(RS, 'ship')), 11380, RY0, { rot: Math.PI / 2, speed: 10710, w: 5 });
  WB.sk(D.drop(70), 11325, RY0, { speed: 4000 });
  WB.text('加油', 11325, RY0 + 130, 62, { align: 'center', rate: 12, col: OR });
  // ---- Aim to return Americans to Moon ----
  const MX = 11960, MY = Y(470), MR = 150;
  WB.go(q('美国人') - 0.05); WB.sk(D.moon(MR), MX, MY, { speed: 5300 });
  WB.line(WB.quad([11590, RY0 - 40], [11810, Y(160)], [MX - 40, MY - MR - 10], 26), { col: OR, w: 5, dash: [14, 12], speed: 5300, smooth: false });
  WB.go(q('送上') - 0.15);
  WB.sk(dashed(D.starship(110, 'ship')), MX + 20, MY - MR + 4, { speed: 7300, w: 4.5 });
  WB.sk(dashed(D.fig(64, 'wave', { helmet: true }), [5, 9]), MX - 50, MY - MR + 8, { speed: 5300, w: 4.5 });
  WB.go(q('月球') + 0.05); WB.text('月球', MX, MY + MR + 80, 66, { align: 'center', rate: 10 });
  // ---- Later, Mars: camera pulls back to whole board while pen draws large Mars at far right (orange hatching and S02 house; dashed means future) ----
  const FX = MX + 780, FY = Y(500), FR = 400;
  const tOut0 = q('再往后') + 0.05, tOut1 = tOut0 + 1.75;
  WB.go(q('再往后') + 0.15); WB.line(WB.circ(FX, FY, FR, 1.04, Math.PI), { w: 12, speed: 6500 });
  WB.hatchCircle(FX, FY, FR, { gap: 40, ang: -Math.PI / 4, w: 8, speed: WB.SPEED * 9 });
  WB.sk(dashed(D.house(240), [30, 22]).map(k => ({ ...k, w: 1.8 })), FX, FY - FR + 14, { speed: 7000 });
  WB.go(q('火星') - 0.1); WB.pop('火星', FX + FR + 60, FY + 70, 230, { align: 'left', wdur: 0.32 });
  // ---- Ending: dashed orange route from S02's other planet to Mars; then hold whole board ----
  const A0 = [6840, 430], C0 = [14010, 700], B0 = [FX + 20, FY - FR - 260];
  const bz = u => [(1 - u) ** 2 * A0[0] + 2 * u * (1 - u) * C0[0] + u * u * B0[0], (1 - u) ** 2 * A0[1] + 2 * u * (1 - u) * C0[1] + u * u * B0[1]];
  const path = []; for (let i = 0; i <= 80; i++) path.push(bz(i / 80)); const pc = DG.cum(path), PL = pc[pc.length - 1];
  const RK1 = WB.prep([{ p: [[0, -38], [10, -28], [14, 4], [14, 22], [-14, 22], [-14, 4], [-10, -28], [0, -38]] }, { p: [[-14, 8], [-26, 26], [-14, 22]] }, { p: [[14, 8], [26, 26], [14, 22]] }], 5);
  const tF0 = tOut0 + 1.0, tF1 = tF0 + 1.25;
  WB.custom({ t0: tF0, t1: tF1, bb: null, draw(g, qq, t) {
    const e = MO.sineInOut(qq), d = PL * e;
    g.strokeStyle = OR; g.lineWidth = 26; g.setLineDash([70, 52]); DG.drawPartial(g, path, pc, Math.max(0, d - 60)); g.setLineDash([]);
    const [x, y] = DG.pointAt(path, pc, d), [x2, y2] = DG.pointAt(path, pc, Math.min(PL, d + 4)), a = Math.atan2(y2 - y, x2 - x) || 0.3;
    if (qq < 1) { g.translate(x, y); g.rotate(a + Math.PI / 2); g.scale(5, 5); g.fillStyle = OR; g.beginPath(); g.moveTo(-8, 26); g.lineTo(0, 46 + 6 * Math.sin(t * 40)); g.lineTo(8, 26); g.closePath(); g.fill(); WB.drawPrep(g, RK1, 0, 0, 1, 0); }
    else { g.strokeStyle = OR; g.lineWidth = 26; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - Math.cos(a - 0.5) * 140, y - Math.sin(a - 0.5) * 140); g.lineTo(x, y); g.lineTo(x - Math.cos(a + 0.5) * 140, y - Math.sin(a + 0.5) * 140); g.stroke(); }
    return null; } });
  // ---- Camera ----
  const T = t0 + TIMING.seg[id].dur;
  WB.shot(q('接下来') - 0.12 - 0.62, 0.6, t0, q('美国人'), { zmax: 1.15 });
  WB.shot(q('美国人') - 0.3, 0.8, q('加油') - 0.4, q('再往后'), { zmax: 1.15 });
  const [cx, cy, zF] = WB.fit(-10, T, { zmax: 0.3, pad: 90, sy: 520, add: [[A0[0], A0[1], 13660, B0[1]], [FX + FR, FY - 100, FX + FR + 560, FY + 120]] });
  WB.move(tOut0, tOut1, cx, cy, zF, { ease: MO.sineInOut });
  // Hold whole board, gentle 6% push toward Mars in final second (Mars stays at same screen position)
  const ms = CAM.toScreen({ x: cx, y: cy, z: zF }, FX, FY), fin = CAM.anchor(FX, FY, zF * 1.06, ms[0], ms[1]);
  WB.move(Math.max(tOut1 + 0.05, T - 1.15), T, fin.x, fin.y, fin.z, { ease: MO.sineInOut, creep: 0 });
});
SCENES['s12'] = WB.scene;
