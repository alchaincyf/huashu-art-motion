// S10 · Starship (row D middle, x 2500–5200). Three beats:
// ① Camera close to ground, only tiny stick figure visible; pen draws Starship upward beside them, camera tilts up and pulls back with pen — full height revealed only when complete, largest ever / most powerful.
// ② 2023 maiden flight, adjacent clock with moving hands, about four minutes; Starship rises and tumbles → pen draws large explosion → cartoon smoke fills screen (RSA cloud wipe), boom inside;
// ③ Smoke clears, camera now right: October 2024 → lattice tower → two orange arms → chopsticks drawn alongside, like chopsticks → flaming booster descends, arms close, caught!
WB.chapter('s10', id => {
  const q = k => WB.q(id, k), { OR, INK } = WB, D = WB.D, Y = v => WB.ROW.D + v;
  const t0 = WB.T0(id);
  // ---- ① Largest ever, most powerful ----
  const SX = 2760, G = Y(880), SH = 800;
  WB.lead([1760, Y(690)], [2420, Y(820)], WB.T0(id) - 0.65, 0.5);   // Pen leads dotted route from Starlink block to Starship base; camera dives with it
  WB.go(Math.max(WB.cur + 0.02, WB.T0(id) - 0.12));
  WB.line([[2450, G], [2980, G]], { speed: 4300, w: 6, nofit: true });
  WB.sk(D.fig(84, 'stand'), 2600, G, { speed: 1800, w: 5 });
  WB.go(q('星舰') - 0.05);
  const ship = WB.sk(D.starship(SH, 'full'), SX, G - 8, { speed: 2400, w: 7 });
  const tUp0 = q('星舰'), tUp1 = q('最强') + 0.05;
  WB.go(q('最大') - 0.15); WB.text('史上最大、最强', 2920, Y(250), 84, { col: OR, rate: 9.5 });
  // ---- ② 2023 maiden flight: explodes about four minutes after liftoff ----
  WB.go(q('2023年') + 0.2); WB.text('2023年首飞', 2920, Y(420), 84, { rate: 10 });
  const CKX = 3060, CKY = Y(610), CKR = 70;
  WB.go(q('四分钟') - 0.2); WB.line(WB.circ(CKX, CKY, CKR, 1.05), { speed: 4300, w: 6 });
  WB.text('四分钟左右', CKX + 100, CKY + 26, 70, { rate: 12 });
  const tK = WB.cur - 0.6;
  WB.custom({ t0: tK, t1: tK + 0.01, bb: [CKX - 90, CKY - 90, CKX + 90, CKY + 90], draw(g, qq, t) {
    const a = -Math.PI / 2 + (t - tK) * 4.2; g.strokeStyle = INK; g.lineWidth = 6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(CKX, CKY); g.lineTo(CKX + Math.cos(a) * CKR * 0.7, CKY + Math.sin(a) * CKR * 0.7); g.stroke();
    g.beginPath(); g.moveTo(CKX, CKY); g.lineTo(CKX + Math.cos(-Math.PI / 2 + (t - tK) * 0.35) * CKR * 0.45, CKY + Math.sin(-Math.PI / 2 + (t - tK) * 0.35) * CKR * 0.45); g.stroke();
    g.fillStyle = INK; g.beginPath(); g.arc(CKX, CKY, 6, 0, 7); g.fill(); return null; } });
  // Liftoff and tumble
  const tL = q('升空') - 0.05, tBoom = q('炸了') - 0.15;
  ship.forEach(s => (s.until = tL));
  const SP = WB.prep(D.starship(SH, 'full'), 7), FL = WB.prep([{ p: [[-30, 2], [-12, 120], [0, 70], [12, 130], [30, 2]], o: 1, w: 0.9 }], 7);
  const flight = t => { const u = U.clamp((t - tL) / (tBoom - tL)), y = G - 8 - 470 * MO.cubicIn(u), a = 0.9 * MO.cubicIn(U.clamp((u - 0.6) / 0.4)); return [SX - 110 * MO.cubicIn(u), y, -a, 1 - 0.55 * MO.cubicIn(u)]; };
  WB.custom({ t0: tL, t1: tBoom, bb: [SX - 600, Y(-500), SX + 600, G + 40], draw(g, qq, t) {
    const [x, y, a, s] = flight(Math.min(t, tBoom - 0.001)); if (t > tBoom + 0.07) return null;
    g.strokeStyle = OR; g.lineWidth = 4; g.beginPath(); g.moveTo(SX, G - 10); g.quadraticCurveTo(SX, (G + y) / 2, x, y); g.stroke();   // Ascent line
    g.translate(x, y); g.rotate(a); g.scale(s, s); g.translate(0, -SH * 0.5);
    WB.drawPrep(g, FL, 0, SH * 0.5, 1, 0, 0.7 + 0.3 * Math.sin(t * 40)); WB.drawPrep(g, SP, 0, SH * 0.5, 1, 0); return null; } });
  // Explosion: pen draws puff, then full-screen smoke
  const BXp = flight(tBoom - 0.001), BCX = BXp[0] + Math.sin(BXp[2]) * SH * 0.5 * BXp[3], BCY = BXp[1] - Math.cos(BXp[2]) * SH * 0.5 * BXp[3];
  WB.at(tBoom); WB.sk(D.burst(160, 29), BCX, BCY, { speed: 9000, w: 7 });
  [[-1, -0.4], [1, -0.3], [-0.7, 0.8], [0.8, 0.7], [0, -1]].forEach(([dx, dy]) => WB.line([[BCX + dx * 185, BCY + dy * 150], [BCX + dx * 230, BCY + dy * 195]], { speed: 6300, min: 0.016, gap: 0.004, w: 6, smooth: false }));
  // Cloud wipe (RSA transition): pen outlines cartoon smoke puffs and fills them white, covering screen; writes boom on cloud; camera repositions behind clouds, which shrink and disperse
  const cw0 = tBoom + 0.04, cwM = Math.max(cw0 + 0.62, q('2024年') - 0.05), cw1 = cwM + 0.42;   // Once clouds fill screen, hold until next sentence (match narration pause length)
  const FIGH = WB.prep(D.fig(170, 'head'), 6);   // Figure holding head inside cloud (reaction shot)
  const puffs = []; { const r = U.rng(41); for (let i = 0; i < 14; i++) puffs.push({ x: 120 + r() * 1680, y: 80 + r() * 900, r: 230 + r() * 170, ph: r() * 6 }); }
  const c0s = () => CAM.toScreen(WB.camAt(cw0), BCX, BCY);
  puffs.sort((a, b) => Math.hypot(a.x - 960, a.y - 520) - Math.hypot(b.x - 960, b.y - 520));
  const puffPath = (c, x, y, R, ph, q) => {   // One cloud = outline of seven small arcs; q controls drawing progress
    const n = 7, pts = []; for (let j = 0; j <= 168; j++) { const a = j / 168 * Math.PI * 2, bump = 0.82 + 0.18 * Math.abs(Math.sin(a * n / 2 + ph)); pts.push([x + Math.cos(a) * R * bump, y + Math.sin(a) * R * bump]); }
    const m = Math.max(2, Math.round(168 * q)); c.beginPath(); for (let j = 0; j <= m; j++) j ? c.lineTo(pts[j][0], pts[j][1]) : c.moveTo(pts[j][0], pts[j][1]); return pts[Math.min(168, m)];
  };
  WB.fx(cw0, cw1, (c, t) => {
    const dn = U.clamp((t - cwM) / (cw1 - cwM)), c0 = c0s(); let tip = null;
    const cov = Math.pow(U.clamp((t - cw0 - 0.24) / 0.2) * (1 - MO.cubicIn(dn)), 1.5);
    if (cov > 0) { c.fillStyle = WB.BOARD; c.globalAlpha = cov; c.fillRect(0, 0, 1920, 1080); c.globalAlpha = 1; }
    puffs.forEach((p, i) => {
      const s0 = cw0 + i * 0.02, q = U.clamp((t - s0) / 0.08); if (q <= 0) return;
      const shrink = 1 - MO.cubicIn(U.clamp(dn * 1.4 - i * 0.03)); if (shrink <= 0.02) return;
      const x = U.lerp(c0[0], p.x, MO.cubicOut(U.clamp((t - cw0) / 0.35))), y = U.lerp(c0[1], p.y, MO.cubicOut(U.clamp((t - cw0) / 0.35))), R = p.r * shrink * (0.55 + 0.45 * MO.cubicOut(q));
      if (q >= 1) { puffPath(c, x, y, R, p.ph, 1); c.closePath(); c.fillStyle = WB.BOARD; c.fill(); }
      const e = puffPath(c, x, y, R, p.ph, q); c.strokeStyle = INK; c.lineWidth = 6; c.lineJoin = c.lineCap = 'round'; c.stroke();
      if (q < 1) tip = [e[0], e[1], INK];
    });
    // Boom: pen writes in stroke order, slight bounce on completion, hand immediately exits; head-holding figure pops alongside; disperses with cloud
    const w0 = cw0 + 0.14, w1 = w0 + 0.34, fa = 1;
    if (t > w1) { const k = MO.backOut(U.clamp((t - w1) / 0.22), 2.2), shr = (1 - MO.cubicIn(U.clamp(dn * 1.4))) * k; if (shr > 0.02) WB.drawPrep(c, FIGH, 1390, 840, shr, 0); }
    if (t > w0 && fa > 0) {
      c.save(); c.globalAlpha = fa; c.font = `300px ${WB.FONT}`; c.fillStyle = OR; c.textBaseline = 'alphabetic';
      const chars = ['轰', '！'], ws = chars.map(ch => c.measureText(ch).width), W0 = ws[0] + ws[1], k = U.clamp((t - w0) / (w1 - w0)) * 2, done = Math.floor(k);
      let x = 760 - W0 / 2; const y = 560, bump = t > w1 ? 1 + 0.08 * Math.sin(U.clamp((t - w1) / 0.25) * Math.PI) : 1;
      const shr = 1 - MO.cubicIn(U.clamp(dn * 1.4)); if (shr <= 0.02) { c.restore(); return tip; } c.translate(760, 450); c.scale(bump * shr, bump * shr); c.rotate(-0.05); c.translate(-760, -450);
      chars.forEach((ch, i) => { if (i < done) c.fillText(ch, x, y); else if (i === done && k < 2) {
        const so = WB.so(ch, 300, ws[i]);
        if (so) { const [m, tp] = WB.soAt(so, k - done); c.save(); c.translate(x, y); c.clip(m); c.fillText(ch, 0, 0); c.restore(); const p = c.getTransform().transformPoint(new DOMPoint(x + tp[0], y + tp[1])); tip = [p.x, p.y, OR]; }
        else { const zz = DG.zigzag(x - 4, y - 290, ws[i] + 8, 350, 3), cm = DG.cum(zz), d = cm[cm.length - 1] * (k - done);
          c.save(); c.clip(DG.revealMask(zz, cm, d, 190)); c.fillText(ch, x, y); c.restore(); const p0 = DG.pointAt(zz, cm, d), p = c.getTransform().transformPoint(new DOMPoint(p0[0], p0[1])); tip = [p.x, p.y, OR]; } } x += ws[i]; });
      c.restore();
    }
    return tip;
  });
  WB.texts.push('轰！');
  // ---- ③ October 2024: chopsticks catch booster ----
  const TX = 5200, TH = 720;
  WB.go(cw1 - 0.1); WB.text('2024年10月', 4190, Y(240), 100, { rate: 11 });
  WB.go(WB.cur + 0.05); WB.sk(D.tower(TH, 90), TX, G, { speed: 7000, w: 6 });
  const AY = G - TH + 150, AX0 = TX - 45, AL = 300;
  const arm = (open) => [[[AX0, AY - 12], [AX0 - AL, AY - 12 - open * 70]], [[AX0, AY + 12], [AX0 - AL, AY + 12 + open * 70]]];
  WB.go(q('机械臂') - 0.15);
  const a0 = arm(1), arms = a0.map(p => WB.line(p, { col: OR, w: 11, speed: 2800, smooth: false }));
  // Chopsticks
  WB.go(q('筷子') - 0.1); WB.sk(D.chopsticks(300), 5610, Y(330), { speed: 3400 });
  WB.sk(D.starship(170, 'booster'), 5746, Y(470), { speed: 6000, w: 4 });   // Small rocket held at chopstick tips (visual pun)
  WB.text('像筷子', 5575, Y(460), 66, { align: 'center', rate: 11 });
  const tC0 = q('落回来') - 0.55, tC1 = q('夹住') + 0.05, tClose = tC1 - 0.25;
  arms.forEach(s => (s.until = tC0));
  const BH = 470, m = BH / 71, BP = WB.prep(D.starship(BH, 'booster'), 6.5), BF = WB.prep([{ p: [[-22, 2], [0, 90], [22, 2]], o: 1, w: 0.9 }], 6.5);
  const BXc = AX0 - AL * 0.55, yEnd = AY + (71 - 7.6) * m;   // Align docking pins with arms
  WB.custom({ t0: tC0, t1: tC1 + 0.5, bb: [TX - 520, Y(-700), TX + 80, G + 40], draw(g, qq, t) {
    const op = 1 - MO.backOut(U.clamp((t - tClose) / 0.3), 2.2);
    const yb = t < tC1 ? U.lerp(Y(-260) + BH, yEnd, 1 - Math.pow(1 - U.clamp((t - tC0) / (tC1 - tC0)), 2.4)) : yEnd;
    if (t < tC1 + 0.1) WB.drawPrep(g, BF, BXc, yb, 1, 0, (0.7 + 0.3 * Math.sin(t * 41)) * (1 - U.clamp((t - tC1) / 0.1)));
    WB.drawPrep(g, BP, BXc, yb, 1, 0);
    g.strokeStyle = OR; g.lineWidth = 11; g.lineCap = 'round';
    for (const p of arm(Math.max(0.16, op))) { g.beginPath(); g.moveTo(p[0][0], p[0][1]); g.lineTo(p[1][0], p[1][1]); g.stroke(); }
    if (t > tC1) { const k = U.clamp((t - tC1) / 0.45); if (k < 1) { g.globalAlpha = 1 - k; g.lineWidth = 5; for (let i = 0; i < 6; i++) { const an = i / 6 * Math.PI * 2, r0 = 70 + 50 * k; g.beginPath(); g.moveTo(BXc + Math.cos(an) * r0, AY + Math.sin(an) * r0); g.lineTo(BXc + Math.cos(an) * (r0 + 30), AY + Math.sin(an) * (r0 + 30)); g.stroke(); } } }
    return null; } });
  WB.pop('夹住了！', 4480, Y(700), 120, { at: q('夹住') + 0.2, rot: -0.05 });
  // ---- Camera ----
  const T = t0 + TIMING.seg[id].dur, catchBox = [BXc - 120, AY - 120, TX + 80, G + 20];
  WB.move(t0 - 0.7, t0 + 0.2, 2640, Y(790), 2.4, { ease: MO.sineInOut });
  WB.shot(tUp0, tUp1 - tUp0, q('星舰'), q('2023年'), { ease: MO.sineInOut, zmax: 1.0 });
  WB.shot(q('2023年') - 0.1, 0.8, q('星舰'), tL, { zmax: 1.0, add: [[2150, Y(150), 2600, Y(580)]] });
  const [cx, cy, cz] = WB.fit(cwM, q('像筷子'), { add: [catchBox] });
  WB.move(cwM - 0.01, cwM + 0.01, cx, cy, cz, { ease: MO.linear, creep: 0 });
  WB.shot(q('像筷子') - 0.3, 0.7, cwM, q('夹住') - 0.5, { add: [catchBox] });
  WB.move(q('夹住') - 0.45, q('夹住') + 0.2, BXc - 230, Y(470), 1.42, { ease: MO.cubicInOut });   // Push in on catch
});
SCENES['s10'] = WB.scene;
