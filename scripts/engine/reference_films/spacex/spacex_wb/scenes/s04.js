// S04 · NASA contract and Dragon (row B middle, x 3650–6000). Pen draws orange three-months-later arrow leading camera right;
// Contract (NASA at top) → $1.6 billion pops in as whole phrase, pen underlines → cargo box flies along dashed line to station (delivery);
// Camera moves farther right: 2012 → Dragon follows dashed line to dock → first private spacecraft, orange circle around first.
WB.chapter('s04', id => {
  const q = k => WB.q(id, k), { OR, INK } = WB, D = WB.D, Y = v => WB.ROW.B + v;
  // ---- Three months later ----
  WB.go(q('三个月后') - 0.3);
  WB.arrow([3640, Y(760)], [4060, Y(700)], { col: OR, bend: -30, w: 7, head: 30, speed: 2600 });
  WB.text('三个月后', 3850, Y(820), 64, { align: 'center', rate: 12 });
  // ---- NASA awards a contract ----
  const DX = 4300, DY = Y(450);
  WB.go(q('NASA') + 0.1); WB.sk(D.doc(300), DX, DY, { speed: 3000 });
  WB.go(q('合同') + 0.05); WB.text('NASA', DX, Y(275), 76, { align: 'center', rate: 14 }); WB.text('2008.12', DX, Y(668), 46, { align: 'center', rate: 24 });
  // ---- $1.6 billion ----
  WB.pop('16亿美元', 4780, Y(500), 140, { at: q('美元') + 0.05 });
  WB.go(q('美元') + 0.2); WB.line([[4510, Y(530)], [4780, Y(540)], [5050, Y(526)]], { col: OR, w: 8, speed: 3600 });
  // ---- Delivering cargo to station ----
  const IX = 5450, IY = Y(560), IS = 540;
  WB.go(q('往空间站') - 0.1); WB.sk(D.iss(IS), IX, IY, { speed: 9000, min: 0.014, gap: 0.006 });
  WB.go(q('送货') - 0.3); WB.sk(D.box(100), 4330, Y(760), { speed: 5200 });
  const port = WB.issPort(IX, IY, IS);
  const bx0 = [4400, Y(730)], bx1 = [port[0] - 10, port[1] + 30];
  WB.line(WB.quad(bx0, [4900, Y(820)], bx1, 30), { col: INK, w: 3.5, speed: 6000, smooth: false });
  WB.text('送货', 4870, Y(840), 60, { align: 'center', rate: 18 });
  // ---- 2012: Dragon becomes first private spacecraft to visit ISS ----
  WB.go(q('2012年') + 0.25); WB.text('2012年', 4720, Y(240), 120, { rate: 10 });
  const CW = 100, CP = WB.prep(D.dragon(CW, { trunk: true }), 5.5);
  const c0 = [4950, Y(830)], c1 = [5330, Y(870)], cEnd = [port[0], port[1] + CW * 1.2];
  const cz = u => [(1 - u) ** 2 * c0[0] + 2 * u * (1 - u) * c1[0] + u * u * cEnd[0], (1 - u) ** 2 * c0[1] + 2 * u * (1 - u) * c1[1] + u * u * cEnd[1]];
  const path = []; for (let i = 0; i <= 30; i++) path.push(cz(i / 30)); const pc = DG.cum(path);
  const tF0 = q('龙飞船') - 0.05, tF1 = q('第一艘') + 0.15;
  WB.custom({ t0: tF0, t1: tF1, bb: [4800, Y(380), 5500, Y(950)], draw(g, qq, t) {
    const e = MO.sineInOut(qq), [x, y] = cz(e), [x2, y2] = cz(Math.min(1, e + 0.02));
    g.strokeStyle = OR; g.lineWidth = 4; DG.drawPartial(g, path, pc, pc[pc.length - 1] * e); g.setLineDash([]);
    const a = qq < 0.98 ? Math.atan2(y2 - y, x2 - x) + Math.PI / 2 : 0;
    WB.drawPrep(g, CP, x, y, 1, U.lerp(a, 0, MO.smooth(U.clamp((qq - 0.55) / 0.45))));
    if (qq >= 1) { const k = U.clamp((t - tF1) / 0.5); if (k < 1) { g.strokeStyle = OR; g.lineWidth = 4; g.globalAlpha = 1 - k; for (let i = 0; i < 5; i++) { const an = -0.3 + i * 0.6 + Math.PI * 0, r0 = 30 + 40 * k; g.beginPath(); g.moveTo(port[0] + Math.cos(an) * r0, port[1] + Math.sin(an) * r0); g.lineTo(port[0] + Math.cos(an) * (r0 + 26), port[1] + Math.sin(an) * (r0 + 26)); g.stroke(); } } }
    return null; } });
  WB.go(q('第一艘') + 0.08);
  WB.text('第一艘', 5250, Y(300), 84, { col: OR, rate: 9 });
  WB.line(WB.ell(5250 + WB.measure('第一艘', 84) / 2, Y(270), WB.measure('第一艘', 84) * 0.62, 66, -2.9, 1.07, 0, 44), { col: OR, w: 6, speed: 4200 });
  WB.text('龙飞船', 5370, Y(790), 58, { align: 'right', rate: 14 });
  WB.go(q('私人飞船') + 0.05); WB.text('私人飞船', 5250 + WB.measure('第一艘', 84) + 14, Y(300), 84, { rate: 10 });
  // ---- Camera ----
  const t0 = WB.T0(id), T = t0 + TIMING.seg[id].dur;
  WB.shot(q('三个月后') - 0.6, 0.8, t0, q('往空间站'));
  WB.shot(q('往空间站') - 0.15, 0.75, q('NASA'), q('2012年'));
  WB.shot(q('2012年') - 0.05, 0.85, q('往空间站'), T, { add: [[cEnd[0] - 60, cEnd[1] - 60, cEnd[0] + 60, cEnd[1] + 60]] });
});
SCENES['s04'] = WB.scene;
