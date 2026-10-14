// S05 · First-stage recovery (slow push, three facts): ① Falcon 9 cutaway with second-stage/first-stage labels; first stage glows, separates, and returns along a U-shaped dashed arrow; reuse loop arrow
// ② December 2015: first stage descends, deploys landing legs, ignites to slow down, and lands upright on the pad; dust and first among orbital rockets
// ③ 2017: recovered badge on the same first stage, then ignition and liftoff again. Transition: diagonal yellow/blue bands sweep across (lin_wipe).
(() => {
const ID = 's05', L = LIN, { C, TAU } = L, { clamp, lerp } = U;
let Q = null;
const q = () => Q || (Q = { jz: TM.cue(ID, '接着呢'), yj: L.cueN(ID, '一级', 0), fhl: TM.cue(ID, '飞回来'), cfy: TM.cue(ID, '重复用'), y15: TM.cue(ID, '2015年12月'),
  lyh: TM.cue(ID, '猎鹰9号'), szh: TM.cue(ID, '竖着'), dm: TM.cue(ID, '地面'), dmE: TM.end(ID, '地面'), gd: TM.cue(ID, '轨道火箭'), tyh: TM.cue(ID, '头一回'), y17: TM.cue(ID, '2017年'),
  hs: TM.cue(ID, '回收的'), yyc: TM.cue(ID, '又一次'), fst: TM.cue(ID, '飞上了天') });

const SX = 1.75, SXA = 2.5;   // Slightly wider cutaway                                   // Widen Falcon 9 horizontally (icon treatment)
function recycle(g, lt, s) {                        // Loop-arrow icon
  g.save(); g.scale(s, s); g.rotate(lt * 1.2); g.lineCap = 'round'; g.lineJoin = 'round';
  for (let i = 0; i < 3; i++) { g.save(); g.rotate(i * TAU / 3);
    g.strokeStyle = C.ink; g.lineWidth = 22; g.beginPath(); g.arc(0, 0, 60, -0.95, 0.75); g.stroke(); g.strokeStyle = C.teal; g.lineWidth = 13; g.stroke();
    g.fillStyle = C.teal; g.strokeStyle = C.ink; g.lineWidth = 4; const a = 0.75, x = Math.cos(a) * 60, y = Math.sin(a) * 60;
    g.beginPath(); g.moveTo(x + Math.cos(a) * 24, y + Math.sin(a) * 24); g.lineTo(x - Math.cos(a) * 24, y - Math.sin(a) * 24); g.lineTo(x - Math.sin(a) * 30, y + Math.cos(a) * 30); g.closePath(); g.fill(); g.stroke();
    g.restore(); }
  g.restore();
}
function pageA(g, lt) {
  const Qv = q(), x = 900, base = 860, pxm = 8.4;
  const sep = clamp((lt - Qv.fhl + 0.05) / 0.35);                     // First-stage separation
  const glow = clamp((lt - Qv.yj) / 0.2);
  // Second stage (upper half): continues flying upward after separation
  const up = sep > 0 ? Math.pow(Math.max(0, lt - Qv.fhl), 2) * 900 : 0;
  g.save(); g.beginPath(); g.rect(0, 0, 1920, base - 41 * pxm - 2 + 0); g.clip();
  L.rocket(g, RK.falcon9({ payload: 'fairing' }), x, base - up, pxm, { sx: SXA, flame: sep > 0 ? 0.8 : 0, lt });
  g.restore();
  // First stage: pauses and glows after separation, then returns along a U-shaped arrow (only draw the route arrow and a small rocket following it)
  g.save(); g.beginPath(); g.rect(0, base - 41 * pxm - 2, 1920, 1080); g.clip();
  const fuA = MO.sineInOut(clamp((lt - Qv.fhl - 0.25) / 0.9));   // First stage becomes the small rocket following the arrow: fade out the original stage simultaneously
  g.globalAlpha *= 1 - clamp(fuA * 2.5);
  if (glow > 0) { g.save(); g.shadowColor = 'rgba(255,212,71,0.95)'; g.shadowBlur = 40 * glow; L.rocket(g, F9B(), x, base, pxm, { sx: SXA, pal: { body: glow > 0.5 ? '#FFF2C2' : C.white } }); g.restore(); }
  else L.rocket(g, F9B(), x, base, pxm, { sx: SXA });
  g.restore();
  // Labels
  const kl = L.popK(lt, Qv.jz + 0.4, 0.4, 2);
  if (kl > 0) { L.at(g, x - 200, base - 470, kl, h => L.kw(h, '二级', 0, 0, { size: 38, fill: C.white, col: C.ink })); L.arrow(g, lt, x - 140, base - 470, x - 40, base - 440, kl, { seed: 4, bend: -10, lw: 5, head: 18 }); }
  const k1 = L.popK(lt, Qv.yj - 0.05, 0.4, 2.6);
  if (k1 > 0) { L.at(g, x - 210, base - 200, k1, h => L.kw(h, '一级', 0, 0, { size: 48, fill: C.yel, col: C.ink })); L.arrow(g, lt, x - 140, base - 200, x - 40, base - 210, k1, { seed: 5, bend: 10, lw: 5, head: 18 }); }
  // Second stage keeps rising: dashed arc to a small satellite at upper right (orbit), contrasting with the first stage's turnaround and return
  const up2 = MO.cubicOut(clamp((lt - Qv.fhl - 0.1) / 0.7));
  if (up2 > 0) { L.arrow(g, lt, x + 40, base - 600, 1240, 190, up2, { seed: 13, bend: 90, lw: 6, dash: [14, 12], head: 22 }); if (up2 > 0.9) L.sat(g, 1290, 170, 1.4, 0, 0); }
  // U-shaped return arrow: arches from above the first stage to the landing pad on the right
  const ap = MO.cubicOut(clamp((lt - Qv.fhl) / 0.55));
  L.arrow(g, lt, x + 60, base - 380, 1420, base - 60, ap, { seed: 6, bend: -260, lw: 8, dash: [18, 14] });
  // Small first stage follows the return arrow (same arc formula as arrow())
  const fu = MO.sineInOut(clamp((lt - Qv.fhl - 0.25) / 0.9));
  if (fu > 0 && fu < 1) { const x0 = x + 60, y0 = base - 380, x1 = 1420, y1 = base - 60, dx = x1 - x0, dy = y1 - y0, Ln = Math.hypot(dx, dy), nx = -dy / Ln, ny = dx / Ln;
    const P = u => [x0 + dx * u + nx * Math.sin(Math.PI * u) * -260, y0 + dy * u + ny * Math.sin(Math.PI * u) * -260], [px, py] = P(fu), [qx, qy] = P(Math.min(1, fu + 0.02));
    L.rocket(g, F9B(fu > 0.7 ? 1 : 0, 1), px, py, 3.2, { sx: SX, rot: Math.atan2(qy - py, qx - px) - Math.PI / 2, flame: fu > 0.75 ? 0.8 : 0, lt }); }
  if (ap > 0) L.at(g, 1420, base + 14, ap, h => { h.lineWidth = 4.5; h.strokeStyle = C.ink; h.fillStyle = C.steelD; h.beginPath(); h.ellipse(0, 0, 110, 22, 0, 0, TAU); h.fill(); h.stroke(); });
  const kr = L.popK(lt, Qv.cfy - 0.05, 0.45, 2.2);
  if (kr > 0) L.at(g, 1520, 360, kr, h => { recycle(h, lt, 0.9); L.kw(h, '重复用', 0, 130, { size: 50, fill: C.teal }); });
}
const F9B = (legs = 0, fins = 0) => RK.falcon9({ legs, fins, stage: 'booster' });
// ② Landing ③ Reflight: same first stage
const LX = 1180, GY = 820, PXM = 9.2;
function boosterAt(lt) {
  const Qv = q(), tA = Qv.y15 - 0.1, tD = Qv.dm + 0.05;           // tD: touchdown
  if (lt < tD) { const u = clamp((lt - tA) / (tD - tA)), e = 1 - Math.pow(1 - u, 2.2); return { a: clamp(u / 0.15), y: lerp(520, GY, e), legs: clamp((lt - (tD - 0.9)) / 0.6), flame: lt > tD - 1.2 ? 1 : 0.25, fins: 1, rot: 0.25 * (1 - MO.smooth(clamp(u * 1.4))) }; }
  const tL = Qv.fst - 0.35;
  if (lt < tL) return { y: GY, legs: lt > Qv.hs ? 1 - clamp((lt - Qv.yyc) / 0.4) : 1, flame: lt < tD + 0.15 ? 1 : 0, fins: 1, rot: 0 };
  const k = lt - tL; return { y: GY - k * k * 900, legs: 0, flame: 1.3, fins: 0, rot: 0 };
}
function pageB(g, lt) {
  const Qv = q(); if (lt < Qv.y15 - 0.4) return;
  // Ground and landing pad
  g.save(); g.lineWidth = 5; g.strokeStyle = C.ink; g.fillStyle = '#EADFCB'; g.beginPath(); g.rect(0, GY + 12, 1920, 300); g.fill();   // Ground fills the full width; presenter stands on it too
  g.beginPath(); g.moveTo(0, GY + 12); g.lineTo(1920, GY + 12); g.stroke();
  g.fillStyle = C.steelD; g.beginPath(); g.ellipse(LX, GY + 14, 150, 24, 0, 0, TAU); g.fill(); g.stroke(); g.restore();
  // Return trajectory: dashed line descending from high at upper left (the first stage follows it back)
  const tp = MO.cubicOut(clamp((lt - Qv.y15 + 0.1) / 1.2));
  if (tp > 0 && lt < Qv.y17) { g.save(); g.setLineDash([16, 14]); g.lineDashOffset = -lt * 50; g.lineWidth = 5; g.strokeStyle = C.ink; g.globalAlpha = 0.4; g.lineCap = 'round';
    g.beginPath(); for (let i = 0; i <= 30; i++) { const u = i / 30 * tp, x = lerp(640, LX, u) , y = lerp(140, GY - 420, Math.pow(u, 0.6)); i ? g.lineTo(x - (1 - u) * (1 - u) * 0, y) : g.moveTo(x, y); } g.stroke(); g.restore(); }
  const b = boosterAt(lt), Bs = RK.falcon9({ legs: b.legs, fins: b.fins, stage: 'booster' });
  // The 2017 reflight did not use the stage landed in 2015 (verified: SES-10 used another recovered first stage): the 2015 stage slides out, and another recovered stage is hoisted onto the pad
  const sw = Qv.y17 - 0.05, so = MO.cubicIn(clamp((lt - sw) / 0.4)), si = MO.cubicOut(clamp((lt - sw - 0.25) / 0.45));
  if (lt < sw + 0.4) { g.save(); g.globalAlpha *= (b.a ?? 1) * clamp((b.y - 420) / 160) * (1 - so); L.rocket(g, RK.falcon9({ legs: lt < sw ? b.legs : 1, fins: 1, stage: 'booster' }), LX - 700 * so, lt < sw ? b.y : GY, PXM, { sx: SX, flame: lt < sw ? b.flame : 0, lt, rot: lt < sw ? b.rot : 0 }); g.restore(); }
  if (lt > sw + 0.25) { const yIn = lt < sw + 0.7 ? lerp(GY - 300, GY, si) : b.y; g.save(); g.globalAlpha *= clamp((lt - sw - 0.25) / 0.2) * clamp((yIn - 420) / 160);
    L.rocket(g, RK.falcon9({ legs: lt < sw + 0.7 ? 1 : b.legs, fins: b.fins, stage: 'booster' }), LX, yIn, PXM, { sx: SX, flame: lt < sw + 0.7 ? 0 : b.flame, lt, rot: 0, pal: { body: '#ECE6DA' } });   // Yellowed, weathered body: a previously flown first stage
    g.restore(); }
  // Touchdown dust and radiating lines
  const kd = lt - (Qv.dm + 0.05);
  L.dust(g, LX, GY + 6, kd, { spread: 280, seed: 77 });
  L.burstLines(g, LX, GY - 200, 300, 380, clamp(kd / 0.5), { n: 12, col: C.ink, lw: 6 });
  // Labels
  const kn = L.popK(lt, Qv.lyh - 0.05, 0.4, 2);
  if (kn > 0 && lt < Qv.y17) L.at(g, LX - 330, 380, kn, h => L.kw(h, '猎鹰9号的一级', 0, 0, { size: 40, fill: C.white, col: C.ink }));
  const ks = L.popK(lt, Qv.szh, 0.38, 2.4);
  if (ks > 0 && lt < Qv.y17) L.at(g, LX + 330, 520, ks, h => { h.lineCap = 'round'; h.strokeStyle = C.ink; h.lineWidth = 8; h.beginPath(); h.moveTo(0, -110); h.lineTo(0, 110); h.stroke();
      for (const d of [-1, 1]) { h.beginPath(); h.moveTo(-20, d * 86); h.lineTo(0, d * 112); h.lineTo(20, d * 86); h.stroke(); }
      L.kw(h, '竖着落回', 80, 0, { size: 40, fill: C.yel, col: C.ink, align: 'left' }); });
  const kt = L.popK(lt, Qv.tyh - 0.05, 0.42, 2.6);
  if (kt > 0 && lt < Qv.y17 + 0.2) { g.save(); g.globalAlpha = 1 - L.outK(lt, Qv.y17 - 0.1, 0.25);
    L.at(g, 1580, 300, kt, h => { L.txt(h, '轨道火箭里', 0, -70, 38, { align: 'center', col: C.sub }); L.kw(h, '头一回！', 0, 0, { size: 64, fill: C.red }); }, -0.05);
    L.twinkles(g, lt, [[1390, 230], [1780, 240], [1760, 390]], { r: 20 }); g.restore(); }
  // ③ 2017: attach recovered badge and fly again
  const kh = L.popK(lt, Qv.hs - 0.05, 0.36, 2.8);
  if (kh > 0 && b.y > 300) L.at(g, LX + 70, b.y - 250, kh, h => { h.lineWidth = 5; h.strokeStyle = C.ink; h.beginPath(); h.arc(0, 0, 58, 0, TAU); h.fillStyle = C.teal; h.fill(); h.stroke();
      L.txt(h, '回收', 0, 3, 34, { col: C.white, align: 'center', base: 'middle' }); }, 0.15);
  const kq = L.popK(lt, Qv.fst - 0.15, 0.4, 2.2);   // Leave a small card on the pad after the rocket departs
  if (kq > 0) L.at(g, LX, GY - 150, kq, h => { L.kw(h, '回收的一级 · 再飞一次', 0, 0, { size: 48, fill: C.white, col: C.ink }); }, -0.03);
  const ky = L.popK(lt, Qv.yyc - 0.05, 0.4, 2.4);
  if (ky > 0) L.at(g, 1580, 330, ky, h => L.kw(h, '又一次飞上天', 0, 0, { size: 54, fill: C.blue }), 0.04);
}

SCENES[ID] = {
  init() { U.assertGlyphs('PuHui-Heavy', '二级一级重复用2015年12月猎鹰9号的一级竖着落回轨道火箭里头一回！2017年回收又一次飞上天回收的一级·再飞一次', ID); },
  draw(c, lt) {
    L.CUR_T = L.T0(ID) + lt;
    const Qv = q();
    L.bg(c, lt, { seed: 2615 });
    // In-page change: at December 2015, roll the paper upward (content moves vertically only to the presenter's right, never sweeping over them); header stays put and changes in place
    const sw = MO.cubicInOut(clamp((lt - (Qv.y15 - 0.4)) / 0.5));
    if (sw < 1) { c.save(); c.globalAlpha = Math.max(0, 1 - 2 * sw); c.translate(0, -1080 * sw); pageA(c, lt); c.restore(); }
    if (sw > 0) { c.save(); c.translate(0, 1080 * (1 - sw)); pageB(c, lt); c.restore(); }
    if (lt < Qv.y15 - 0.15) L.pageTitle(c, lt, '回收一级', Qv.jz, { col: C.teal, size: 42 });
    else if (lt < Qv.y17 - 0.05) L.pageTitle(c, lt, '2015年12月', Qv.y15 - 0.1, { col: C.red, size: 44 }); else L.pageTitle(c, lt, '2017年', Qv.y17 - 0.05, { col: C.red, size: 46 });
  },
};
ERAS.find(e => e.id === ID).transition = { type: 'lin_wipe', dur: 0.6, cols: [C.yel, C.blue] };
L.cast(ID, [
  { t: 0.05, pose: 'think', fr: 'talk' },
  { t: TM.cue(ID, '2015年12月') - 0.1, pose: 'stick', fr: 'talk', x: 560, walk: 0.8 },   // Walk closer to the landing pad to explain
  { t: TM.cue(ID, '地面') + 0.05, pose: 'wow', fr: 'bounce' },
  { t: TM.cue(ID, '2017年') - 0.05, pose: 'point', fr: 'talk' },
  { t: TM.cue(ID, '飞上了天') - 0.2, pose: 'cheer', fr: 'bounce' },
  { t: TM.dur(ID) - 0.32, pose: 'walk', fr: 'walk', x: -260, walk: 0.32 },   // Exit briskly only at segment end, then enter immediately from the right in the next segment
]);
L.year(ID, [[TM.cue(ID, '2015年12月'), 2015], [TM.cue(ID, '2017年'), 2017]]);
})();
