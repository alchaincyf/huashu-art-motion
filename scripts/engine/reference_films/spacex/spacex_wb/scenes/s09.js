// S09 · Starlink (row D left, x 0–2200). Whip from row C end to row D start.
// Large Earth; Starlink satellite upper left (arrow from rocket at Earth's edge), Starlink label; 2019 → string of 60 dots arcs into orbit, 60 satellites;
// Now → pen dots dense orbital shells around Earth (hundreds, layer by layer, then slowly rotating), 11,000 satellites slams in;
// Row of houses lower right, 12 million users pops up.
WB.chapter('s09', id => {
  const q = k => WB.q(id, k), { OR, INK } = WB, D = WB.D, Y = v => WB.ROW.D + v;
  const t0 = WB.T0(id);
  // ---- Row change: pen leads long orange path left from row C tally through inter-row gap, then turns down toward Earth; camera follows ----
  const road = WB.dense([[8470, 3000], [8520, 3240], [8380, 3290], [260, 3290], [150, 3360], [140, 3900], [200, 3990], [500, 3990]], 16);
  const tR0 = Math.max(WB.cur + 0.02, t0 - 0.6);
  const rd = WB.line(road, { col: OR, w: 8, dur: 0.95, dash: [1, 15], amp: 1.0, t0: tR0, nofit: true });
  WB.line([[470, 3962], [506, 3990], [470, 4018]], { col: OR, w: 7, smooth: false, t0: rd.t1 + 0.01, dur: 0.08, nofit: true });
  WB.fade([rd, WB.S[WB.S.indexOf(rd) + 1]], rd.t1 + 1.2, 0.5);   // Fade completed row-change path so it does not overlay next row
  const tRe = rd.t1 + 0.1, rp = u => DG.pointAt(rd.pts, rd.cum, rd.len * MO.sineInOut(u));
  WB.move(rd.t0 - 0.05, rd.t0 + 0.25, ...(([x, y]) => [x - 500, y - 100])(rp(0.2)), 0.55, { ease: MO.cubicIn });
  WB.move(rd.t0 + 0.25, rd.t0 + 0.65, ...(([x, y]) => [x + 300, y - 100])(rp(0.72)), 0.55, { whip: true, ease: MO.linear });
  const EX = 780, EY = Y(540), ER = 220;
  WB.go(Math.max(tRe, q('这些') + 0.1)); WB.sk(D.earth(ER), EX, EY, { speed: 3600, w: 7 });
  // Small rocket → satellite
  WB.go(q('大多') - 0.05); WB.sk(D.falcon9(220, {}), 250, Y(820), { speed: 6000, w: 5 });
  WB.arrow([280, Y(570)], [250, Y(380)], { col: OR, head: 22, w: 5, bend: -20 });
  WB.go(q('星链') - 0.2); WB.sk(D.sat(190), 250, Y(300), { speed: 5200 });
  WB.text('星链卫星', 250, Y(200), 66, { align: 'center', rate: 12 });
  // 2019: first batch of 60
  WB.go(q('2019年') + 0.2); WB.text('2019年', 1160, Y(240), 96, { rate: 11 });
  const tS0 = q('第一批') + 0.05, tS1 = q('60颗') + 0.05;
  WB.custom({ t0: tS0, t1: tS1, bb: [EX - 400, EY - 400, EX + 400, EY + 400], draw(g, qq, t) {
    g.fillStyle = INK; const R = ER + 58;
    for (let i = 0; i < 60; i++) { const k = U.clamp(qq * 60 - i); if (k <= 0) break; const a = -2.35 + i * 0.022 + (t - tS1) * 0.05 * (t > tS1); g.beginPath(); g.arc(EX + Math.cos(a) * R, EY + Math.sin(a) * R, 4.2 * k, 0, 7); g.fill(); }
    return null; } });
  WB.pop('60颗', 1270, Y(360), 90, { at: q('60颗') + 0.2 });
  // Now, over 11,000 in orbit: entire shell of dots
  const N = 520, rr = U.rng(19), dots = []; for (let i = 0; i < N; i++) dots.push({ a: rr() * Math.PI * 2, r: ER + 34 + rr() * 110, s: 2.6 + rr() * 2.4, o: rr() });
  dots.sort((a, b) => a.o - b.o);
  const tC0 = q('在轨') - 0.05, tC1 = q('万颗') + 0.05;
  WB.custom({ t0: tC0, t1: tC1, handed: true, bb: [EX - 420, EY - 420, EX + 420, EY + 420], start: () => [EX - ER - 80, EY], end: () => [EX + ER + 80, EY],
    draw(g, qq, t) {
      const n = Math.floor(N * MO.sineInOut(qq)), rot = (t - tC0) * 0.06; g.fillStyle = INK;
      for (let i = 0; i < n; i++) { const d = dots[i], a = d.a + rot * (300 / d.r); g.beginPath(); g.arc(EX + Math.cos(a) * d.r, EY + Math.sin(a) * d.r * 0.96, d.s, 0, 7); g.fill(); }
      if (qq < 1 && n > 0) { const d = dots[n - 1], a = d.a + rot * (300 / d.r); return [EX + Math.cos(a) * d.r, EY + Math.sin(a) * d.r * 0.96]; }
      return null; } });
  WB.text('现在在轨', 1480, Y(400), 56, { rate: 14, t0: q('现在') + 0.15 });
  WB.pop('超过1.1万颗', 1440, Y(510), 100, { at: q('万颗') + 0.2 });
  // Over 12 million users
  WB.go(q('用户') - 0.05);
  for (let i = 0; i < 4; i++) WB.sk(D.house(52), 1240 + i * 120, Y(720), { speed: 7000, w: 5.5 });
  WB.pop('超过1200万用户', 1440, Y(840), 84, { at: q('1200') + 0.5 });
  // Camera: shift slightly right to make room for numbers
  const T = t0 + TIMING.seg[id].dur, shell = [[EX - ER - 150, EY - ER - 150, EX + ER + 150, EY + ER + 150]];
  WB.shot(rd.t0 + 0.65, 0.5, tRe, q('2019年'), { ease: MO.cubicOut, add: shell, zmax: 1.1 });
  WB.shot(q('现在') - 0.2, 0.8, t0, T, { add: shell });
});
SCENES['s09'] = WB.scene;
