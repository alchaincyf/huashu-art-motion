// S03 · Four Falcon 1 launches (row B left, x 0–3700). Whip pan from row A end to row B start.
// Large Falcon 1 and title, stick figure watching beside it; four pads in a row: each spoken year adds a small rocket and year label,
// Rocket rises and explodes at progressively greater heights (2006 low, 2007 higher, August 2008 higher still), figure holds head; fourth reaches Earth orbit, success, figure raises arms.
// Hold one beat after highlight: pen exits, slow push, only orbiting rocket moves; write first privately developed liquid-fuel rocket to enter orbit character by character.
WB.chapter('s03', id => {
  const q = k => WB.q(id, k), { OR, INK, SPEED } = WB, D = WB.D, Y = v => WB.ROW.B + v;
  const t0 = WB.T0(id);
  // ---- Row change: pen draws orange dotted line from other planets at row A end, left between rows A and B, then turns down to row B start; camera follows ----
  const road = WB.dense([[6900, 720], [6960, 1120], [6860, 1180], [140, 1180], [40, 1260], [30, 1600], [80, 1680], [130, 1680]], 16);
  const rd = WB.line(road, { col: OR, w: 8, dur: 0.9, dash: [1, 15], amp: 1.0, t0: Math.max(WB.cur + 0.02, t0 - 0.35), nofit: true });
  WB.line([[100, 1652], [134, 1680], [100, 1708]], { col: OR, w: 8, smooth: false, t0: rd.t1 + 0.01, dur: 0.08, nofit: true });
  WB.fade([rd, WB.S[WB.S.indexOf(rd) + 1]], rd.t1 + 1.2, 0.5);   // Fade row-change path once complete so it does not overlay next row
  const rp = u => DG.pointAt(rd.pts, rd.cum, rd.len * MO.sineInOut(u));
  // ---- First rocket: Falcon 1 ----
  const FX = 800, FG = Y(860);
  WB.go(Math.max(q('它的') + 0.05, rd.t1 + 0.1)); WB.sk(D.falcon1(600), 230, Y(860), { speed: 4400 });   // Draw rocket first, title follows narration, watching figure last
  WB.go(q('猎鹰') - 0.2); WB.text('猎鹰1号', 360, Y(330), 140, { rate: 11 });
  WB.go(WB.cur + 0.02); WB.sk(D.fig(250, 'stand'), FX, FG, { speed: 4200 });
  const figStrokes = WB.S.slice(-6);
  // ---- Four launchpads ----
  const G = Y(780), PX = [1140, 1520, 1900, 2280], RH = 250, LB = ['2006', '2007', '2008.8', '第四次'];
  const P = WB.prep(D.falcon1(RH), 5.5), FL = WB.prep([{ p: [[-12, 2], [0, 64], [12, 2]], o: 1, w: 0.9 }], 5.5);
  WB.go(q('2006年') - 0.05);
  WB.line([[980, G], [2480, G]], { speed: 9000, w: 6, nofit: true });
  // Each failure: retain pad rocket (whiteboard objects never vanish); pen draws crooked orange flight path upward from arrow, explosion at line end
  const fail = (i, yrKey, failKey, burstY) => {
    const x = PX[i], top = G - RH * 1.2;
    WB.go(q(yrKey) + 0.05);
    WB.sk(D.falcon1(RH), x, G, { speed: 3800, w: 5.5 });
    WB.text(LB[i], x, G + 78, 62, { align: 'center', rate: 16 });
    const tB = q(failKey) + 0.05, tL = Math.max(WB.cur + 0.05, tB - 0.45);
    const path = []; for (let k = 0; k <= 16; k++) { const u = k / 16; path.push([x + Math.sin(u * 7 + i) * 14 * u + u * u * 26 * (i % 2 ? -1 : 1), top - (top - burstY - 60) * u]); }
    WB.line(path, { col: OR, w: 5, t0: tL, dur: tB - tL - 0.02, smooth: false });
    WB.at(tB); WB.sk(D.burst(95, 11 + i), x + (i % 2 ? -26 : 26), burstY, { speed: 5200 });
    [[-1, 0.3], [1, 0.5], [-0.5, 1], [0.7, 1.1]].forEach(([dx, dy]) => WB.line([[x + dx * 110, burstY + dy * 70], [x + dx * 135, burstY + dy * 70 + 30]], { speed: 3000, min: 0.02, gap: 0.004, w: 5, smooth: false }));
    return tB;
  };
  const b1 = fail(0, '2006年', '失败', Y(400));
  const b2 = fail(1, '2007年', '失败；2008', Y(300));
  const b3 = fail(2, '2008年8月', '还是失败', Y(200));
  // ---- Fourth launch succeeds ----
  const EX = 2680, EY = Y(250), ER = 115, ORX = 190, ORY = 62, ROT = -0.1;
  WB.go(b3 + 0.42); WB.sk(D.earth(ER), EX, EY, { speed: 4400 });
  WB.line(WB.ell(EX, EY, ORX, ORY, Math.PI, 1.02, ROT, 56), { col: OR, w: 4.5, speed: 7000, smooth: false });
  const x4 = PX[3]; WB.sk(D.falcon1(RH), x4, G, { speed: 4600, w: 5.5 });
  WB.go(q('第四次') + 0.08); WB.text(LB[3], x4, G + 78, 62, { align: 'center', rate: 12, col: OR });
  // Fourth: pad rocket remains; pen draws orange arc from arrow into Earth orbit; small rocket appears and keeps orbiting
  const tL = Math.max(WB.cur + 0.02, q('成了') - 0.55), tA = tL + 0.6;
  const a0 = [x4, G - RH * 1.2], c0 = [x4 + 40, Y(230)], b0 = [EX - ORX + 4, EY + 20];
  const tr = WB.quad(a0, c0, b0, 30);
  WB.line(tr, { col: OR, w: 5, t0: tL, dur: tA - tL, smooth: false, handed: false });
  WB.custom({ t0: tA, t1: tA + 0.2, bb: [EX - ORX - 60, EY - ORY - 80, EX + ORX + 60, EY + ORY + 80], draw(g, qq, t) {
    const w = (t - tA) * 1.9 + Math.PI, X0 = Math.cos(w) * ORX, Y0 = Math.sin(w) * ORY, c = Math.cos(ROT), n = Math.sin(ROT);
    const x = EX + X0 * c - Y0 * n, y = EY + X0 * n + Y0 * c, a = Math.atan2(Math.cos(w) * ORY, -Math.sin(w) * ORX) + ROT + Math.PI / 2, s = 0.4 * MO.backOut(qq, 2);
    if (Math.sin(w) < -0.2) { g.beginPath(); g.rect(-1e5, -1e5, 2e5, 2e5); g.arc(EX, EY, ER + 3, 0, Math.PI * 2, true); g.clip(); }
    WB.drawPrep(g, FL, x, y, s, a, 0.7 + 0.3 * Math.sin(t * 40)); WB.drawPrep(g, P, x, y, s, a); return null; } });
  WB.pop('成了', 2110, Y(560), 150, { at: q('成了') + 0.18, rot: -0.07 });
  // Stick figure: replace drawing with animated version (watch → hold head → watch → hold head → watch → hold head → raise arms)
  const tFig = q('2006年');
  figStrokes.forEach(s => (s.until = tFig));
  const keys = [[0, 'stand'], [b1 + 0.08, 'head'], [b1 + 0.75, 'stand'], [b2 + 0.08, 'head'], [b2 + 0.75, 'point'], [b3 + 0.08, 'head'], [q('第四次') + 0.1, 'stand'], [q('成了') + 0.05, 'cheer']];
  WB.custom({ t0: tFig, t1: tFig + 0.01, bb: [FX - 150, FG - 330, FX + 150, FG + 20], draw(g, qq, t) { WB.drawFig(g, FX, FG, 250, keys, t); return null; } });
  // ---- First privately developed liquid-fuel rocket to enter orbit ----
  WB.go(q('第一枚') + 0.12);
  WB.text('第一枚', 2900, Y(560), 72, { col: OR, rate: 8 });
  WB.text('私人研制、', 2900 + WB.measure('第一枚', 72), Y(560), 72, { rate: 8 });
  WB.go(q('进入') + 0.05); WB.text('进入轨道的液体燃料火箭', 2900, Y(665), 68, { rate: 8.5 });
  WB.line([[2900 + WB.measure('进入轨道的', 68), Y(685)], [2900 + WB.measure('进入轨道的液体燃料', 68), Y(691)]], { col: OR, w: 7, speed: 3000 });
  // ---- Camera ----
  const T = t0 + TIMING.seg[id].dur;
  WB.move(rd.t0 - 0.05, rd.t0 + 0.25, ...(([x, y]) => [x - 500, y + 120])(rp(0.2)), 0.55, { ease: MO.cubicIn });
  WB.move(rd.t0 + 0.25, rd.t0 + 0.62, ...(([x, y]) => [x + 500, y + 120])(rp(0.75)), 0.55, { whip: true, ease: MO.linear });
  WB.shot(rd.t0 + 0.62, 0.5, rd.t1, q('2007年'), { ease: MO.cubicOut, add: [[980, G - 10, 1700, G + 100], [90, 1640, 300, 1720]] });
  WB.shot(q('2008年8月') - 0.35, 0.95, q('2007年'), q('成了'), { add: [[EX - ORX, EY - ORY - 60, EX + ORX, EY + ER]] });
  WB.move(q('成了') - 0.35, q('成了') + 0.1, 2400, Y(540), 1.15, { ease: MO.cubicInOut });   // Push in on success
  WB.shot(q('成了') + 0.55, 1.0, q('第四次'), T, { zmax: 1.1, add: [[EX - ORX, EY - ER, EX + ORX, EY + ER]] });
});
SCENES['s03'] = WB.scene;
