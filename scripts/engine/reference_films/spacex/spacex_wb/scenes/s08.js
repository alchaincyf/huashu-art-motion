// S08 · Increasing launch frequency (row C right, x 5400–8450). Hand-drawn bar chart: axes first, black hatched bars for 2017, 2022, 2023, 2024 grow successively taller (real data,
// 2018–2021 have only encyclopedia figures, omitted with … axis break); orange 2025 bar slowly reaches top, 165 settles;
// Camera moves right: small calendar, orange dot every other day → just over two days per launch; seesaw: Falcon 9 on left lifts all other rockets combined on right;
// Farther right: first stage, pen draws Western five-stroke tallies one by one up to 37, then 37 times pops up.
WB.chapter('s08', id => {
  const q = k => WB.q(id, k), { OR, INK } = WB, D = WB.D, Y = v => WB.ROW.C + v;
  // ---- Chart ----
  const OX = 5480, OY = Y(790), HMAX = 500, val = v => v / 165 * HMAX;
  const bars = [['2017', 18, 5560], ['2022', 61, 5780], ['2023', 96, 5920], ['2024', 134, 6060], ['2025', 165, 6200]], BW = 100;
  WB.lead([4930, Y(560)], [5430, Y(500)], q('回收之后') - 0.12 - 0.62, 0.5);   // Lead-in and camera move together: pen leads, writing begins exactly on arrival
  WB.go(q('回收之后') - 0.12);
  WB.text('猎鹰火箭年发射次数', OX, Y(210), 58, { rate: 18 });
  WB.line(WB.dense([[OX, Y(250)], [OX, OY], [6330, OY]], 10), { speed: 6500, w: 5.5 });
  WB.text('…', 5665, OY + 62, 50, { dur: 0.06, align: 'center' });
  bars.slice(0, 4).forEach(([yr, v, x], i) => {
    const h = val(v);
    WB.line(WB.dense([[x - BW / 2, OY], [x - BW / 2, OY - h], [x + BW / 2, OY - h], [x + BW / 2, OY]], 6), { speed: 7000, w: 5, min: 0.05, gap: 0.01 });
    WB.hatchRect(x - BW / 2 + 6, OY - h + 6, BW - 12, h - 8, { col: INK, w: 2.6, gap: 26, speed: 26000 });
    WB.text(String(v), x, OY - h - 18, 46, { align: 'center', rate: 30 });
    WB.text(yr, x, OY + 62, 44, { align: 'center', rate: 30 });
  });
  // 2025: orange bar grows, 165 settles
  const x5 = bars[4][2], h5 = val(165), tG0 = q('2025年') + 0.2, tG1 = q('165次') + 0.12;
  WB.go(tG0 - 0.3); WB.text('2025', x5, OY + 62, 44, { align: 'center', rate: 24, col: OR });
  WB.custom({ t0: tG0, t1: tG1, handed: false, bb: [x5 - 80, OY - h5 - 40, x5 + 80, OY + 10],
    start: () => [x5 + BW / 2, OY], end: () => [x5 + BW / 2, OY - h5],
    draw(g, qq) { const h = h5 * MO.quintOut(qq);
      g.save(); g.beginPath(); g.rect(x5 - BW / 2, OY - h, BW, h); g.clip(); g.strokeStyle = OR; g.lineWidth = 3.4;
      for (let k = 10; k < BW + h5; k += 20) { g.beginPath(); g.moveTo(x5 - BW / 2 + Math.min(k, BW), OY - h5 + Math.max(0, k - BW)); g.lineTo(x5 - BW / 2 + Math.max(0, k - h5), OY - h5 + Math.min(k, h5)); g.stroke(); }
      g.restore();
      g.strokeStyle = OR; g.lineWidth = 7; g.beginPath(); g.moveTo(x5 - BW / 2, OY); g.lineTo(x5 - BW / 2, OY - h); g.lineTo(x5 + BW / 2, OY - h); g.lineTo(x5 + BW / 2, OY); g.stroke();
      return qq < 1 ? [x5 + BW / 2, OY - h] : null; } });
  WB.pop('165', x5, OY - h5 - 26, 104, { at: q('165次') + 0.15 });
  // ---- Just over two days per launch: small calendar ----
  const CX = 6600, CY = Y(280), CWd = 330, CH = 250;
  WB.go(q('平均') - 0.05);
  WB.line(WB.rect(CX - CWd / 2, CY - CH / 2, CWd, CH), { speed: 7500, w: 5.5 });
  WB.line([[CX - CWd / 2, CY - CH / 2 + 56], [CX + CWd / 2, CY - CH / 2 + 56]], { speed: 7500, w: 5, smooth: false });
  for (const dx of [-0.25, 0.25]) WB.line([[CX + dx * CWd, CY - CH / 2 - 22], [CX + dx * CWd, CY - CH / 2 + 18]], { speed: 5500, w: 6, smooth: false, min: 0.02 });
  for (let r = 1; r < 3; r++) WB.line([[CX - CWd / 2, CY - CH / 2 + 56 + r * (CH - 56) / 3], [CX + CWd / 2, CY - CH / 2 + 56 + r * (CH - 56) / 3]], { speed: 12000, w: 2.6, smooth: false, min: 0.018, gap: 0.004 });
  for (let c = 1; c < 7; c++) WB.line([[CX - CWd / 2 + c * CWd / 7, CY - CH / 2 + 56], [CX - CWd / 2 + c * CWd / 7, CY + CH / 2]], { speed: 12000, w: 2.6, smooth: false, min: 0.016, gap: 0.004 });
  const tD = WB.cur;
  WB.custom({ t0: tD, t1: tD + 0.55, bb: [CX - CWd / 2, CY - CH / 2, CX + CWd / 2, CY + CH / 2], draw(g, qq) {
    g.fillStyle = OR; const cw = CWd / 7, ch = (CH - 56) / 3;
    for (let i = 0; i < 21; i++) { if (i % 2) continue; const k = U.clamp(qq * 11 - i / 2); if (k <= 0) continue;
      const cx = CX - CWd / 2 + (i % 7 + 0.5) * cw, cy = CY - CH / 2 + 56 + (Math.floor(i / 7) + 0.5) * ch, r = 11 * MO.backOut(k, 2.4);
      g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill(); } return null; } });
  WB.at(tD + 0.1); WB.text('两天多一发', CX, CY + CH / 2 + 84, 66, { align: 'center', rate: 12 });
  // ---- More than all other rockets worldwide combined: seesaw ----
  const SX = 7230, SY = Y(820), PL = 720, PH = 160;
  WB.go(q('比全世界') + 0.05);
  WB.line([[SX - 50, SY], [SX, SY - PH + 8], [SX + 50, SY], [SX - 50, SY]], { speed: 4200, smooth: false });
  const tilt = q('还多') - 0.32, tilt1 = tilt + 0.24, ANG = -0.24;
  const board = WB.custom({ t0: WB.cur, t1: WB.cur + 0.55, handed: true, bb: [SX - PL / 2 - 40, SY - PH - 300, SX + PL / 2 + 40, SY + 20], fit: true,
    start: () => [SX - PL / 2, SY - PH], end: () => [SX + PL / 2, SY - PH],
    draw(g, qq, t) {
      const a = ANG * MO.backOut(U.clamp((t - tilt) / (tilt1 - tilt)), 2.6), c = Math.cos(a), n = Math.sin(a);
      g.translate(SX, SY - PH); g.rotate(a); g.strokeStyle = INK; g.lineWidth = 6; g.lineCap = 'round';
      const L = PL * Math.min(1, qq * 1.6); g.beginPath(); g.moveTo(-PL / 2, 0); g.lineTo(-PL / 2 + L, 0); g.stroke();
      const k = U.clamp(qq * 1.6 - 0.6) / 1;
      if (k > 0) { g.globalAlpha = Math.min(1, k * 2);
        // Heavy left: large block; light right: small block
        // Similar block sizes (only more, not overwhelming dominance); orange hatching on left
        g.lineWidth = 5.5; g.strokeRect(-PL / 2 + 16, -175, 275, 175); g.strokeRect(PL / 2 - 236, -130, 220, 130);
        g.save(); g.beginPath(); g.rect(-PL / 2 + 16, -175, 275, 175); g.clip(); g.strokeStyle = 'rgba(239,114,38,.75)'; g.lineWidth = 3.2;
        for (let d = -175; d < 290; d += 20) { g.beginPath(); g.moveTo(-PL / 2 + 16 + d, 0); g.lineTo(-PL / 2 + 16 + d + 175, -175); g.stroke(); } g.restore();
        g.textAlign = 'center'; g.fillStyle = INK; g.font = `54px ${WB.FONT}`; g.fillText('猎鹰9号', -PL / 2 + 153, -68);
        g.font = `46px ${WB.FONT}`; g.fillText('其他火箭', PL / 2 - 126, -72); g.fillText('加起来', PL / 2 - 126, -22); }
      // Impact: ring of thump lines around left endpoint
      if (t > tilt1 - 0.05) { const k = U.clamp((t - tilt1 + 0.05) / 0.45); if (k < 1) { g.globalAlpha = 1 - k; g.lineWidth = 5; g.strokeStyle = INK; for (const [ax, ay] of [[-1, -0.6], [-1.3, 0], [-1, 0.6]]) { g.beginPath(); g.moveTo(-PL / 2 - 10 + ax * (20 + 30 * k), 10 + ay * (20 + 30 * k)); g.lineTo(-PL / 2 - 10 + ax * (50 + 30 * k), 10 + ay * (50 + 30 * k)); g.stroke(); } } }
      return qq < 1 ? [-PL / 2 + L, 0].map((v, i) => i ? SY - PH + v : SX + v) : null; } });
  WB.texts.push('猎鹰9号其他火箭加起来');
  // ---- One booster has flown 37 times: tally marks ----
  const BX = 7830, G = Y(800);
  WB.go(q('有一枚') - 0.1); WB.sk(D.falcon9(540, { stage: 'booster', legs: 1, fins: 1 }), BX, G - 24, { speed: 9500, w: 6.5 });
  [[-10, -430, 0.25], [16, -300, -0.2], [-8, -175, 0.1]].forEach(([dx, dy, r]) => WB.sk(D.patch(40, r), BX + dx, G - 24 + dy, { speed: 9000, w: 5 }));
  for (let k = 0; k < 5; k++) WB.line([[BX - 34 + k * 14, G - 60 - (k % 2) * 30], [BX - 22 + k * 14, G - 120 - (k % 2) * 30]], { w: 3, speed: 9000, min: 0.015, gap: 0.004, smooth: false });   // Scorch marks at base   // Well-used booster: covered in patches
  const TX = 8030, TYp = Y(420), GWd = 112, RH2 = 120;
  const tallies = []; for (let i = 0; i < 37; i++) { const gi = Math.floor(i / 5), j = i % 5, gx = TX + (gi % 4) * GWd, gy = TYp + Math.floor(gi / 4) * (RH2 + 40);
    tallies.push(j < 4 ? [[gx + j * 20, gy], [gx + j * 20 + 2, gy + RH2 * 0.75]] : [[gx - 12, gy + RH2 * 0.6], [gx + 78, gy + RH2 * 0.12]]); }
  const tT0 = WB.cur, tT1 = q('37次') - 0.02, dt = (tT1 - tT0) / 37;
  tallies.forEach((p, i) => WB.line(p, { t0: tT0 + i * dt, dur: dt * 0.8, w: 6, col: i >= 35 ? OR : INK, smooth: false }));
  WB.at(tT1);
  WB.pop('37次', TX + 190, Y(330), 120, { at: q('37次') + 0.3 });
  // ---- Camera ----
  const t0 = WB.T0(id);
  const T = t0 + TIMING.seg[id].dur;
  WB.shot(q('回收之后') - 0.12 - 0.62, 0.6, t0, q('平均'), { add: [[x5 - 60, OY - h5 - 120, x5 + 60, OY]] });
  WB.move(q('165次') - 0.35, q('165次') + 0.15, x5 - 260, OY - 228, 1.17, { ease: MO.cubicInOut });   // Push toward tallest bar as 165 settles
  WB.shot(q('平均') - 0.3, 0.75, q('平均'), q('有一枚'), { add: [[x5 - 60, OY - h5 - 120, x5 + 60, OY]] });
  WB.shot(q('有一枚') - 0.2, 0.8, q('有一枚'), T, { add: [[TX + 100, Y(240), TX + 300, Y(340)]] });
});
SCENES['s08'] = WB.scene;
