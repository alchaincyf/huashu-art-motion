// S07 · Crew Dragon (row C middle, x 2800–5000). May 2020 → large capsule, opaque-visored helmet in each of two windows (two astronauts) →
// Follows dashed route to dock with small station at upper right; camera moves right: 2011 —— 2020 timeline, orange nearly-nine-years brace pops up,
// Small rocket launches from home soil at 2020 endpoint; first pops up, pen writes private-company spacecraft carries people into orbit.
WB.chapter('s07', id => {
  const q = k => WB.q(id, k), { OR, INK } = WB, D = WB.D, Y = v => WB.ROW.C + v;
  WB.lead([2420, Y(600)], [2950, Y(620)], q('2020年') - 0.12 - 0.62, 0.5);   // Lead-in and camera move together: pen leads, writing begins exactly on arrival
  WB.go(q('2020年') - 0.12); WB.text('2020年5月', 2820, Y(250), 120, { rate: 10 });
  const CX = 3100, CY = Y(760), CW = 250;
  WB.go(q('载人') - 0.05);
  const cap = WB.sk(D.dragon(CW, {}), CX, CY, { speed: 3400, w: 7 });
  WB.go(q('两名') - 0.1); WB.figure(CX + 210, CY, 150, [[0, 'stand'], [q('宇航员') + 0.3, 'wave'], [q('空间站') + 0.2, 'stand'], [q('美国') + 0.1, 'wave']], { helmet: true, speed: 3800, w: 6 }); WB.figure(CX + 300, CY, 150, [[0, 'stand'], [q('宇航员') + 0.5, 'cheer'], [q('空间站') + 0.4, 'stand']], { helmet: true, speed: 3800, w: 6 });
  WB.text('两名宇航员', CX + 255, CY + 80, 58, { align: 'center', rate: 12 });
  // Station and flight to docking
  const IX = 3720, IY = Y(310), IS = 380;
  WB.go(q('送往') - 0.1); WB.sk(D.iss(IS), IX, IY, { speed: 7000, w: 5.5 });
  const port = WB.issPort(IX, IY, IS), SC = WB.prep(D.dragon(70, {}), 5);
  const p0 = [CX + 60, CY - CW * 1.0], p1 = [CX + 420, Y(560)], p2 = [port[0], port[1] + 70 * 0.95];
  const bz = u => [(1 - u) ** 2 * p0[0] + 2 * u * (1 - u) * p1[0] + u * u * p2[0], (1 - u) ** 2 * p0[1] + 2 * u * (1 - u) * p1[1] + u * u * p2[1]];
  const path = []; for (let i = 0; i <= 30; i++) path.push(bz(i / 30)); const pc = DG.cum(path);
  const tF0 = q('空间站') - 0.25, tF1 = tF0 + 0.95;
  WB.custom({ t0: tF0, t1: tF1, bb: [CX, Y(200), IX + 260, Y(760)], draw(g, qq, t) {
    const e = MO.sineInOut(qq), [x, y] = bz(e), [x2, y2] = bz(Math.min(1, e + 0.02));
    g.strokeStyle = OR; g.lineWidth = 4; DG.drawPartial(g, path, pc, pc[pc.length - 1] * e); g.setLineDash([]);
    const a = U.lerp(Math.atan2(y2 - y, x2 - x) + Math.PI / 2, 0, MO.smooth(U.clamp((qq - 0.5) / 0.5)));
    WB.drawPrep(g, SC, x, y, 1, qq >= 1 ? 0 : a); return null; } });
  WB.text('空间站', IX + 70, Y(505), 56, { rate: 14, t0: Math.max(tF1 - 0.1, WB.cur + 0.02) });
  // ---- US resumes crewed launches from home soil after nearly nine years ----
  const L0 = 3650, L1 = 4700, LY = Y(760);
  WB.go(q('美国') + 0.15);
  WB.line([[L0, LY], [L1, LY]], { speed: 6000, w: 6 });
  [L0, L1].forEach(x => WB.line([[x, LY - 24], [x, LY + 24]], { smooth: false, speed: 3200, min: 0.03 }));
  WB.text('2011', L0, LY + 80, 60, { align: 'center', rate: 30 });
  WB.text('2020', L1, LY + 80, 60, { align: 'center', rate: 30 });
  // Brace (opens downward)
  WB.go(q('时隔') - 0.05);
  const br = []; const bw = L1 - L0 - 40, bx = L0 + 20, by = LY - 40;
  for (let i = 0; i <= 40; i++) { const u = i / 40, x = bx + bw * u, k = Math.abs(u - 0.5) * 2, y = by - 22 * (1 - Math.pow(k, 6)) - (u > 0.47 && u < 0.53 ? 24 * (1 - Math.abs(u - 0.5) / 0.03) : 0); br.push([x, y]); }
  WB.line(br, { col: OR, w: 6, speed: 4400 });
  const p9 = WB.pop('近9年', (L0 + L1) / 2, LY - 110, 104, { at: Math.max(WB.cur + 0.3, q('近9年') + 0.25) }); WB.at(p9.t1 + 0.03);
  // Empty years: cobweb hangs below timeline (long disuse)
  { const cx = (L0 + L1) / 2 - 260, cy = LY + 6, R = 70; const web = [];
    for (let k = 0; k < 5; k++) { const a = Math.PI * (0.1 + k * 0.2); web.push({ p: [[cx, cy], [cx + Math.cos(a) * R, cy + Math.sin(a) * R]], w: 0.45, smooth: false }); }
    for (const r of [0.35, 0.7]) web.push({ p: Array.from({ length: 5 }, (_, k) => { const a = Math.PI * (0.1 + k * 0.2); return [cx + Math.cos(a) * R * r, cy + Math.sin(a) * R * r]; }), w: 0.45, smooth: false });
    web.push({ p: [[cx + 30, cy], [cx + 30, cy + 95]], w: 0.4, smooth: false }, { p: WB.circ(cx + 30, cy + 104, 9, 1.05), w: 0.7 });
    WB.sk(web, 0, 0, { speed: 9000, w: 5 }); }
  // 2020 endpoint: domestic launch
  WB.go(q('本土') - 0.1); WB.text('本土', L1 + 70, LY - 30, 58, { rate: 12 });
  const RP = WB.prep(D.falcon9(260, { payload: 'dragon' }), 5), FL = WB.prep([{ p: [[-10, 2], [0, 56], [10, 2]], o: 1, w: 0.9 }], 5);
  const tU = q('上天') - 0.4;
  const r0 = WB.sk(D.falcon9(260, { payload: 'dragon' }), L1, LY - 8, { speed: 5600, w: 5 });
  WB.go(tU); r0.forEach(s => (s.until = tU));
  WB.custom({ t0: tU, t1: tU + 1.3, bb: [L1 - 120, Y(-600), L1 + 120, LY + 20], draw(g, qq, t) {
    const y = LY - 8 - 900 * MO.cubicIn(qq), fa = 1 - U.clamp((t - tU - 1.3) / 0.5); if (fa <= 0) return null;
    g.globalAlpha = fa; g.strokeStyle = OR; g.lineWidth = 4; g.beginPath(); g.moveTo(L1, LY - 10); g.lineTo(L1, Math.max(y + 60, LY - 700)); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
    if (qq < 1) { WB.drawPrep(g, FL, L1, y, 1, 0, 0.75 + 0.25 * Math.sin(t * 43)); WB.drawPrep(g, RP, L1, y, 1, 0); } return null; } });
  // ---- First private-company spacecraft to carry people into orbit ----
  WB.pop('第一次', 4220, Y(290), 120, { at: q('第一次') + 0.2, rot: -0.04 });
  WB.go(q('私人公司') + 0.05); WB.text('私人公司的飞船', 4220, Y(395), 64, { align: 'center', rate: 9 });
  WB.go(q('把人送进') + 0.05); WB.text('把人送进轨道', 4220, Y(480), 64, { align: 'center', rate: 9 });
  // ---- Camera ----
  const t0 = WB.T0(id);
  const T = t0 + TIMING.seg[id].dur;
  WB.shot(q('2020年') - 0.12 - 0.62, 0.6, t0, q('美国'), { dx: 130 });   // Travel 130 farther: preceding segment's line tip fully exits frame
  WB.shot(q('美国') - 0.2, 0.8, q('美国'), q('也是'), { add: [[IX - 200, IY - 170, IX + 200, IY + 120]] });
  WB.shot(q('第一次') - 0.3, 0.7, q('美国'), T, { add: [[4000, Y(240), 4450, Y(340)]] });
});
SCENES['s07'] = WB.scene;
