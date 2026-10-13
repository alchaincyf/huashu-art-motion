// S06 · Falcon Heavy (7-second fast cuts): ① three-core maiden-flight launch exits frame; ② Sun/orbit at right, red roadster circles, presenter opens hands.
// ③ Two boosters descend, land side by side on same frame, double arrow between them. Transition: whole page pushes up (lin_slide up).
(() => {
const ID = 's06', L = LIN, { C, TAU } = L, { clamp, lerp } = U;
let Q = null;
const q = () => Q || (Q = { y18: TM.cue(ID, '2018年'), zx: TM.cue(ID, '重型猎鹰'), sf: TM.cue(ID, '首飞'), pc: TM.cue(ID, '跑车'), rty: TM.cue(ID, '绕太阳'),
  lm: TM.cue(ID, '两枚'), bp: TM.cue(ID, '并排'), dm: TM.cue(ID, '落回地面'), dmE: TM.end(ID, '落回地面') });

function car(g, s = 1) {
  g.save(); g.scale(s, s); g.lineWidth = 4; g.strokeStyle = C.ink; g.lineJoin = 'round';
  // Convertible: low body, long hood, slanted windshield, exposed seats.
  g.beginPath(); g.moveTo(-80, 10); g.lineTo(-80, -10); g.quadraticCurveTo(-60, -22, -20, -22); g.lineTo(6, -22); g.lineTo(20, -14); g.quadraticCurveTo(60, -16, 82, -6); g.lineTo(84, 10); g.closePath(); g.fillStyle = C.red; g.fill(); g.stroke();
  g.fillStyle = C.blueL; g.beginPath(); g.moveTo(-4, -22); g.lineTo(12, -44); g.lineTo(18, -44); g.lineTo(8, -22); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = C.tile; g.beginPath(); g.moveTo(-46, -22); g.lineTo(-40, -42); g.lineTo(-28, -42); g.lineTo(-26, -22); g.closePath(); g.fill(); g.stroke();
  for (const wx of [-40, 44]) { g.beginPath(); g.arc(wx, 10, 15, 0, TAU); g.fillStyle = C.tile; g.fill(); g.stroke(); g.beginPath(); g.arc(wx, 10, 5, 0, TAU); g.fillStyle = C.steel; g.fill(); }
  g.restore();
}
const SUN = { x: 920, y: 470 }, ORX = 380, ORY = 165;   // Presenter at right; infographic shifts left.
function heavyLaunch(g, lt) {
  const Qv = q(), x = 520, base = 780, ig = Qv.sf - 0.2, rise = lt < ig + 0.25 ? 0 : Math.pow(lt - ig - 0.25, 2) * 700;
  if (base - rise < -200) return;
  const sh = lt > ig && lt < ig + 0.4 ? 3 * Math.sin(lt * 70) : 0;
  L.rocket(g, RK.heavy({ payload: 'fairing' }), x + sh, base - rise, 7.4, { sx: 1.6, flame: lt > ig ? 0.5 : 0, lt });   // Shorten exhaust to avoid subtitles.
  if (lt > ig) for (let j = 0; j < 6; j++) { const ph = (lt * 1.8 + j / 6) % 1; g.save(); g.globalAlpha = 0.5 * (1 - ph) * (1 - clamp((lt - ig - 1.2) / 0.6)); g.fillStyle = '#E6DFD2';
    g.beginPath(); g.arc(x - 130 + j * 52, base + 10 - ph * 30, 28 + ph * 34, 0, TAU); g.fill(); g.restore(); }
  const kn = L.popK(lt, Qv.zx - 0.05, 0.4, 2) * (1 - L.outK(lt, Qv.pc - 0.2, 0.3));
  if (kn > 0) L.at(g, x + 250, 420, kn, h => { L.kw(h, '重型猎鹰', 0, 0, { size: 52, fill: C.red }); L.at(h, 0, 84, L.popK(lt, Qv.sf, 0.36, 2.6), s => L.kw(s, '首飞', 0, 0, { size: 42, fill: C.yel, col: C.ink })); });
}
function orbit(g, lt) {
  const Qv = q(); if (lt < Qv.pc - 0.5) return;
  const shrink = MO.cubicInOut(clamp((lt - (Qv.lm - 0.15)) / 0.5));
  g.save(); L.cam(g, lerp(1, 0.5, shrink), SUN.x, SUN.y, lerp(0, -330, shrink), lerp(0, -240, shrink));
  const ks = L.popK(lt, Qv.pc - 0.15, 0.5, 1.7), op = MO.cubicOut(clamp((lt - Qv.rty + 0.1) / 0.6));
  if (op > 0) { g.save(); g.setLineDash([18, 14]); g.lineDashOffset = -lt * 40; g.lineWidth = 5; g.strokeStyle = C.ink; g.globalAlpha = 0.6; g.lineCap = 'round';
    g.beginPath(); g.ellipse(SUN.x, SUN.y, ORX, ORY, -0.08, -Math.PI / 2, -Math.PI / 2 + TAU * op); g.stroke(); g.restore(); }
  L.sun(g, SUN.x, SUN.y, 90, lt, ks);
  const kc = L.popK(lt, Qv.pc - 0.1, 0.4, 2.4);
  if (kc > 0) { const th = -Math.PI / 2 + (lt - Qv.pc) * 0.9, cx = SUN.x + ORX * Math.cos(th) * Math.cos(-0.08) - ORY * Math.sin(th) * Math.sin(-0.08), cy = SUN.y + ORX * Math.cos(th) * Math.sin(-0.08) + ORY * Math.sin(th) * Math.cos(-0.08);
    L.ring(g, lt, cx, cy - 10, 120, 70, clamp((lt - Qv.pc - 0.1) / 0.4), { seed: 71, col: C.red, lw: 6 });
    L.at(g, cx, cy, kc, h => car(h, 1.3), Math.atan2(ORY * Math.cos(th), -ORX * Math.sin(th)) * 0.25); }
  const kr = L.popK(lt, Qv.rty - 0.05, 0.4, 2.2);
  if (kr > 0 && shrink < 0.6) { g.save(); g.globalAlpha *= 1 - clamp(shrink / 0.4); L.at(g, SUN.x, SUN.y + ORY + 110, kr, h => L.kw(h, '绕太阳的轨道', 0, 0, { size: 50, fill: C.orange })); g.restore(); }   // Labels exit before shrinking to corner inset.
  g.restore();
}
const GY = 830, BX = [640, 930];
function landing(g, lt) {
  const Qv = q(); if (lt < Qv.lm - 0.3) return;
  const kg = MO.cubicOut(clamp((lt - Qv.lm + 0.3) / 0.4));
  g.save(); g.globalAlpha = kg; g.lineWidth = 5; g.strokeStyle = C.ink; g.fillStyle = '#EADFCB'; g.beginPath(); g.rect(0, GY + 12, 1920, 300); g.fill(); g.beginPath(); g.moveTo(0, GY + 12); g.lineTo(1920, GY + 12); g.stroke();
  for (const x of BX) { g.fillStyle = C.steelD; g.beginPath(); g.ellipse(x, GY + 14, 110, 20, 0, 0, TAU); g.fill(); g.stroke(); } g.restore();
  const tA = Qv.lm - 0.1, tD = Qv.dm + 0.1, u = clamp((lt - tA) / (tD - tA)), e = 1 - Math.pow(1 - u, 2.2), y = lerp(420, GY, e), fin = clamp(u / 0.18);
  g.save(); g.globalAlpha *= fin;   // Fade in below timeline pill, without crossing it.
  for (const [i, x] of BX.entries()) L.rocket(g, RK.falcon9({ stage: 'booster', legs: clamp((lt - (tD - 0.8)) / 0.5), fins: 1 }), x, y, 6.8, { sx: 1.75, flame: lt < tD + 0.12 ? 1 : 0, lt, seed: i });
  g.restore();
  const kd = lt - tD;
  for (const x of BX) L.burstLines(g, x, GY - 120, 190, 260, clamp(kd / 0.5), { n: 10, col: C.ink, lw: 5 });
  for (const [i, x] of BX.entries()) L.dust(g, x, GY + 4, kd, { spread: 150, seed: 11 + i, n: 5 });
  const kb = L.popK(lt, Qv.bp - 0.05, 0.38, 2.6);
  if (kb > 0) L.at(g, (BX[0] + BX[1]) / 2, 420, kb, h => { h.lineCap = 'round'; h.strokeStyle = C.ink; h.lineWidth = 8; h.beginPath(); h.moveTo(-100, 80); h.lineTo(100, 80); h.stroke();
    for (const d of [-1, 1]) { h.beginPath(); h.moveTo(d * 76, 58); h.lineTo(d * 102, 80); h.lineTo(d * 76, 102); h.stroke(); }
    L.kw(h, '并排落回', 0, 0, { size: 48, fill: C.blue }); });
}

SCENES[ID] = {
  init() { U.assertGlyphs('PuHui-Heavy', '2018年重型猎鹰首飞绕太阳的轨道并排落回', ID); },
  draw(c, lt) {
    L.CUR_T = L.T0(ID) + lt;
    L.bg(c, lt, { seed: 2616 });
    L.pageTitle(c, lt, '2018年', q().y18 - 0.1, { col: C.red, size: 46 });
    heavyLaunch(c, lt); orbit(c, lt); landing(c, lt);
  },
};
ERAS.find(e => e.id === ID).transition = { type: 'lin_slide', dur: 0.55, dir: 'up' };
L.cast(ID, [
  { t: 0.0, pose: 'walk', fr: 'walk', x: 2150 },                       // Presenter enters from right and stands at right here.
  { t: 0.02, pose: 'point', fr: 'talk', x: 1600, walk: 0.6, flip: true },
  { t: TM.cue(ID, '跑车') - 0.05, pose: 'shrug', fr: 'talk', flip: true },
  { t: TM.cue(ID, '两枚') - 0.05, pose: 'stick', fr: 'talk', flip: true },
  { t: TM.end(ID, '落回地面') - 0.1, pose: 'thumb', fr: 2, flip: true },
  { t: TM.end(ID, '落回地面') + 0.05, pose: 'walk', fr: 'walk', x: 2150, walk: 0.45 },   // Exit at right.
]);
L.year(ID, [[TM.cue(ID, '2018年'), 2018]]);
})();
