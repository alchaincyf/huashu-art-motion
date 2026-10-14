// S11 · 2026 (row D middle-right, x 6150–9550). Three beats:
// ① 2026 → large SpaceX circle → acquisition arrow → small xAI circle (Musk's AI company beneath) → small circle absorbed into large one;
// ② Camera moves right: June IPO and rising orange line → raised over and $75 billion slam in → largest IPO ever trophy;
// ③ Farther right: 9.28 (same double orange underline as opening) → Earth, orbit, circling Starship releases 26 satellites one by one; 26 satellites pops up.
WB.chapter('s11', id => {
  const q = k => WB.q(id, k), { OR, INK } = WB, D = WB.D, Y = v => WB.ROW.D + v;
  const t0 = WB.T0(id);
  // ---- ① Acquire xAI ----
  WB.lead([5800, Y(600)], [6270, Y(580)], q('2026年') - 0.12 - 0.62, 0.5);   // Lead-in and camera move together: pen leads, writing begins exactly on arrival
  WB.go(q('2026年') - 0.12); WB.text('2026年', 6210, Y(240), 120, { rate: 10 });
  const AX = 6490, AY = Y(570), AR = 180, BX = 7010, BR = 100;
  WB.go(q('SpaceX') - 0.05); WB.line(WB.circ(AX, AY, AR, 1.05), { speed: 4400, w: 7 });
  WB.text('SpaceX', AX, AY - 30, 72, { align: 'center', rate: 16 });
  WB.go(q('收购') + 0.05);
  const arr = WB.arrow([AX + AR + 15, AY], [BX - BR - 15, AY], { head: 26, w: 6 });
  const lab = WB.text('收购', (AX + AR + BX - BR) / 2, AY - 34, 54, { align: 'center', rate: 12, col: OR });
  WB.go(q('马斯克') - 0.05);
  const bc = WB.line(WB.circ(BX, AY, BR, 1.05), { speed: 4400, w: 6 });
  const lab2 = WB.text('马斯克的AI公司', BX, AY + BR + 70, 46, { align: 'center', rate: 14 });
  WB.go(q('xAI') + 0.05);
  const bt = WB.text('xAI', BX, AY + 50, 56, { align: 'center', rate: 12 });
  const br = WB.sk(D.brain(80), BX, AY - 34, { speed: 4000, w: 5 });   // Brain: AI
  const tM0 = Math.max(WB.cur + 0.05, q('6月') - 0.1), tM1 = tM0 + 0.55;
  [bc, bt, ...br].forEach(s => (s.until = tM0)); WB.fade([...arr, lab, lab2], tM0, 0.35);
  const BCp = WB.prep([{ p: WB.circ(0, 0, BR, 1.05) }], 6), BRp = WB.prep(WB.xf ? D.brain(80).map(k => ({ ...k, p: k.p.map(([x, y]) => [x, y - 34]) })) : [], 5);
  WB.custom({ t0: tM0, t1: tM1, bb: [AX - 250, AY - 250, BX + 150, AY + 250], draw(g, qq) {
    const e = MO.backOut(qq, 1.4), x = U.lerp(BX, AX + 10, e), y = U.lerp(AY, AY + 82, e), s = U.lerp(1, 0.42, MO.smooth(qq));
    WB.drawPrep(g, BCp, x, y, s, 0); WB.drawPrep(g, BRp, x, y, s, 0); g.font = `${56 * s}px ${WB.FONT}`; g.textAlign = 'center'; g.fillStyle = INK; g.fillText('xAI', x, y + 50 * s); return null; } });
  // ---- ② June IPO, raises over $75 billion, largest IPO ever ----
  WB.go(q('6月') + 0.25); WB.text('6月上市', 7230, Y(250), 92, { rate: 10 });
  WB.sk(D.bell(260), 7480, Y(520), { speed: 4800 });
  WB.go(q('募资') + 0.05); WB.text('募资超过', 7850, Y(400), 60, { rate: 12 });
  WB.pop('750亿美元', 8150, Y(545), 130, { at: q('亿美元') + 0.15 });
  WB.go(q('史上最大') - 0.05); WB.sk(D.trophy(140), 7410, Y(775), { speed: 4600 }); WB.fill(WB.xf(D.trophy(140)[0].p, 7410, Y(775)), WB.WASH, 0.3);
  WB.text('史上最大的一次上市', 7520, Y(800), 58, { rate: 11 });
  // ---- ③ September 28: Starship enters orbit and releases 26 next-generation Starlink satellites ----
  WB.go(q('9月28号') + 0.1); WB.text('9.28', 8710, Y(250), 110, { rate: 12 });
  WB.line([[8702, Y(276)], [8830, Y(282)], [8950, Y(274)]], { col: OR, w: 7, speed: 4000 }); WB.line([[8710, Y(294)], [8830, Y(300)], [8942, Y(292)]], { col: OR, w: 6, speed: 4500 });
  // Opening callback: pull back to show both opening and current 9.28, circle each orange, connect with dotted orange line (then fade line, retain circles)
  // Callback hold follows narration: longer pause before Starship orbit means longer pullback hold (maximum 1.7s)
  const tBack = WB.cur + 0.02, tRet = Math.max(tBack + 0.95, Math.min(tBack + 1.7, q('星舰入轨') - 0.5)), R1 = [2955, 648, 240, 104], R2 = [8830, Y(212), 200, 100];
  [R1, R2].forEach(([x, y, rx, ry], i) => WB.line(WB.ell(x, y, rx, ry, -2.4, 1.06, -0.05, 48), { col: OR, w: 18, t0: tBack + 0.3 + i * 0.14, dur: 0.3, handed: false, nofit: true }));
  const link = WB.line(WB.quad([R1[0] + 250, R1[1] + 40], [6800, 1200], [R2[0] - 210, R2[1] - 20], 40), { col: OR, w: 18, dash: [1, 34], t0: tBack + 0.5, dur: 0.35, handed: false, nofit: true });
  WB.fade([link], tRet - 0.05, 0.4);
  const EX = 9130, EY = Y(600), ER = 160, RX = 360, RY = 116, ROT = -0.12;
  WB.go(Math.max(q('星舰入轨') - 0.05, tRet + 0.35)); WB.sk(D.earth(ER), EX, EY, { speed: 5850 });
  WB.line(WB.ell(EX, EY, RX, RY, Math.PI * 0.9, 1.03, ROT, 64), { col: OR, w: 4.5, speed: 7850 });
  WB.text('星舰入轨', 9070, Y(250), 66, { rate: 12, col: OR });
  const SP = WB.prep(D.starship(250, 'ship'), 6.5);
  const tS = WB.cur, tR0 = q('放出') - 0.05, tR1 = tR0 + 1.6, W0 = Math.PI * 0.95, SPD = 1.15, SPD2 = 2.1;
  const pos = (w, f = 1) => { const X0 = Math.cos(w) * RX * f, Y0 = Math.sin(w) * RY * f, c = Math.cos(ROT), n = Math.sin(ROT); return [EX + X0 * c - Y0 * n, EY + X0 * n + Y0 * c]; };
  WB.custom({ t0: tS, t1: tS + 0.3, bb: [EX - 420, EY - 300, EX + 420, EY + 300], draw(g, qq, t) {
    const wAt = tt => W0 + (Math.min(tt, tR0) - tS) * SPD + U.clamp(tt - tR0, 0, tR1 - tR0) * SPD2 + Math.max(0, tt - tR1) * SPD, w = wAt(t);   // Move spacecraft faster while releasing satellites so they separate
    // Satellite: starts at spacecraft position at release time ti, then follows same orbit slightly slower and drifts outward
    // 26 satellites: released at successive spacecraft positions, then slowly spread radially (string of beads: black dots and two small orange solar panels)
    g.lineCap = 'round';
    for (let i = 0; i < 26; i++) { const ti = tR0 + (tR1 - tR0) * i / 25; if (t < ti) break;
      const u = MO.cubicOut(U.clamp((t - ti) / 1.2)), wi = wAt(ti) - 0.06, [x, y] = pos(wi, 1 + 0.32 * u), k = MO.backOut(U.clamp((t - ti) / 0.16), 2.2);
      if (Math.sin(wi) < -0.2 && Math.hypot(x - EX, y - EY) < ER + 8) continue;
      g.fillStyle = INK; g.fillRect(x - 5 * k, y - 4.5 * k, 10 * k, 9 * k);
      g.fillStyle = OR; g.fillRect(x - 16 * k, y - 2.5 * k, 9 * k, 5 * k); g.fillRect(x + 7 * k, y - 2.5 * k, 9 * k, 5 * k); }
    const [x, y] = pos(w), a = Math.atan2(Math.cos(w) * RY, -Math.sin(w) * RX) + ROT + Math.PI / 2;
    if (Math.sin(w) < -0.15) { g.beginPath(); g.rect(-1e5, -1e5, 2e5, 2e5); g.arc(EX, EY, ER + 4, 0, Math.PI * 2, true); g.clip(); }
    WB.drawPrep(g, SP, x, y, 1, a, MO.smooth(qq)); return null; } });
  WB.pop('26颗', 9800, Y(380), 110, { at: q('26颗') + 0.3 });
  WB.go(q('新一代') + 0.05); WB.text('新一代星链卫星', 9800, Y(480), 54, { align: 'center', rate: 14 });
  // ---- Camera ----
  const T = t0 + TIMING.seg[id].dur;
  WB.shot(q('2026年') - 0.12 - 0.62, 0.6, t0, q('6月'), { zmax: 1.2 });
  WB.shot(q('6月') - 0.05, 0.75, q('6月'), q('9月28号'), { zmax: 1.15, add: [[7820, Y(380), 8480, Y(560)]] });   // Hold one medium shot for IPO beat, without close-up then pullback
  WB.shot(q('9月28号') - 0.15, 0.55, q('9月28号'), q('9月28号') + 0.3, { zmax: 1.2, add: [[8660, Y(120), 9220, Y(330)]] });
  const [bx, by, bz] = WB.fit(0, 0, { add: [[R1[0] - 300, R1[1] - 200, R1[0] + 300, R1[1] + 160], [R2[0] - 260, R2[1] - 160, R2[0] + 260, R2[1] + 160]], pad: 120, sy: 450 });
  WB.move(tBack - 0.02, tBack + 0.55, bx, by, bz, { ease: MO.cubicInOut });
  WB.shot(tRet, 0.55, q('9月28号'), T, { zmax: 1.15, ease: MO.cubicInOut, add: [[EX - RX - 60, EY - RY - 60, EX + RX + 60, EY + RY + 60], [9660, Y(270), 9980, Y(500)]] });
});
SCENES['s11'] = WB.scene;
