// S07 · Crew Dragon (slow push→breathing space): ① large Dragon, two opaque-visored helmets in window, two astronaut icons alongside.
// → ship shrinks/follows dashes to upper-right station; ② timeline 2011——2020, blank gap/bracket nearly nine years; domestic pad launches rocket.
// ③ First: private spacecraft → arrow → people in orbit (Earth + orbit + astronaut). Transition: center-expanding circle (lin_iris, cyan rim).
(() => {
const ID = 's07', L = LIN, { C, TAU } = L, { clamp, lerp } = U;
let Q = null;
const q = () => Q || (Q = { y20: TM.cue(ID, '2020年5月'), zr: TM.cue(ID, '载人龙飞船'), lm: TM.cue(ID, '两名宇航员'), sw: TM.cue(ID, '送往空间站'), mg: TM.cue(ID, '美国'),
  jg: TM.cue(ID, '近9年'), cx: TM.cue(ID, '重新从本土'), bt: TM.cue(ID, '本土'), srst: TM.cue(ID, '送人上天'), dyc: TM.cue(ID, '第一次'), sr: TM.cue(ID, '私人公司'),
  fc: TM.cue(ID, '的飞船'), sj: TM.cue(ID, '送进轨道') });

function pageA(g, lt) {
  const Qv = q();
  const kd = L.popK(lt, 0.2, 0.4, 2) * (1 - L.outK(lt, Qv.sw - 0.35, 0.25));   // Calendar: May 2020.
  if (kd > 0) L.at(g, 1500, 300, kd * 0.85, h => L.calPage(h, '2020年', '5月', C.red, '', { w: 220, h: 220 }), 0.05);
  const fly = MO.cubicInOut(clamp((lt - Qv.sw) / 0.8));
  const ki = L.popK(lt, Qv.sw - 0.2, 0.45, 1.8);
  if (ki > 0) { L.at(g, 1620, 300 + 5 * Math.sin(lt * 1.4), ki * 0.95, h => L.iss(h, 0, 0, 1), 0.05);
    g.save(); g.setLineDash([16, 14]); g.lineDashOffset = -lt * 50; g.lineWidth = 5; g.strokeStyle = C.ink; g.globalAlpha = 0.5 * ki; g.lineCap = 'round';
    g.beginPath(); g.moveTo(1000, 560); g.quadraticCurveTo(1250, 300, 1560, 400); g.stroke(); g.restore(); }
  // Ship appears large; station-delivery cue shrinks/arcs it to docking.
  const kc = L.popK(lt, 0.15, 0.5, 1.8), u = fly, bx = (1 - u) ** 2 * 1000 + 2 * (1 - u) * u * 1250 + u * u * 1600, by = (1 - u) ** 2 * 700 + 2 * (1 - u) * u * 340 + u * u * 470;
  L.at(g, bx, by + (1 - fly) * 6 * Math.sin(lt * 2), kc * lerp(3.0, 0.8, fly), h => L.capsule(h, 0, 0, 1, {}), lerp(0.04 * Math.sin(lt * 1.3), 0, fly));
  // Two astronauts.
  const ka = L.popK(lt, Qv.lm - 0.05, 0.42, 2.2) * (1 - fly);
  if (ka > 0) { L.at(g, 1340, 560, ka, h => L.astro(h, 0, 0, 1.2), -0.06 + 0.04 * Math.sin(lt * 2.4)); L.at(g, 1500, 570, ka, h => L.astro(h, 0, 0, 1.2), 0.06 + 0.04 * Math.sin(lt * 2.4 + 1));
    L.at(g, 1420, 740, ka, h => L.kw(h, '两名宇航员', 0, 0, { size: 46, fill: C.blue })); }
  const kz = L.popK(lt, Qv.zr, 0.4, 2) * (1 - fly);
  if (kz > 0) L.at(g, 1000, 270, kz, h => L.kw(h, '载人龙飞船', 0, 0, { size: 50, fill: C.white, col: C.ink }));
  if (fly > 0.98) L.burstLines(g, 1600, 440, 70, 140, clamp((lt - Qv.sw - 0.8) / 0.5), { n: 9, lw: 5 });
}
// ② 2011 —— 2020: nearly nine years.
const TY = 420, X11 = 760, X20 = 1640;
function pageB(g, lt) {
  const Qv = q(); if (lt < Qv.mg - 0.4) return;
  const lp = MO.cubicOut(clamp((lt - Qv.mg + 0.2) / 0.6));
  g.save(); g.lineCap = 'round'; g.lineWidth = 14; g.strokeStyle = '#E2D9C8'; g.beginPath(); g.moveTo(X11, TY); g.lineTo(lerp(X11, X20, lp), TY); g.stroke(); g.restore();
  for (const [x, lab, t] of [[X11, '2011', Qv.mg - 0.2], [X20, '2020', Qv.mg + 0.25]]) { const k = L.popK(lt, t, 0.35, 2.2); if (k <= 0) continue;
    L.at(g, x, TY, k, h => { h.beginPath(); h.arc(0, 0, 20, 0, TAU); h.fillStyle = x === X20 ? C.red : C.white; h.fill(); h.lineWidth = 5; h.strokeStyle = C.ink; h.stroke(); L.txt(h, lab, 0, -42, 48, { align: 'center', w: 'Black' }); }); }
  // Small question mark sways in blank gap.
  if (lp > 0.5) for (let i = 0; i < 3; i++) { const x = lerp(X11, X20, 0.3 + i * 0.2); g.save(); g.globalAlpha = 0.45; L.txt(g, '？', x, TY + 8 + 6 * Math.sin(lt * 3 + i), 40, { align: 'center', col: C.sub, base: 'middle' }); g.restore(); }
  // Bracket + nearly nine years.
  const bp = MO.cubicOut(clamp((lt - Qv.jg + 0.1) / 0.4));
  if (bp > 0) { g.save(); g.strokeStyle = C.purple; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round'; const m = (X11 + X20) / 2, y = TY + 50, w = (X20 - X11) / 2 * bp;
    g.beginPath(); g.moveTo(m - w, y); g.quadraticCurveTo(m - w, y + 30, m - w + 30, y + 30); g.lineTo(m - 30, y + 30); g.quadraticCurveTo(m, y + 30, m, y + 60); g.quadraticCurveTo(m, y + 30, m + 30, y + 30); g.lineTo(m + w - 30, y + 30); g.quadraticCurveTo(m + w, y + 30, m + w, y); g.stroke(); g.restore();
    L.at(g, (X11 + X20) / 2, TY + 160, L.popK(lt, Qv.jg, 0.4, 2.4), h => L.kw(h, '近9年', 0, 0, { size: 60, fill: C.purple })); }
  // Domestic launch pad + map pin.
  const kb = L.popK(lt, Qv.bt - 0.1, 0.42, 2);
  if (kb > 0) { const px = 1430, gy = 830;
    L.at(g, px, gy, kb, h => { h.lineWidth = 5; h.strokeStyle = C.ink; h.fillStyle = C.steelD; h.fill(L.rrp(-90, 0, 180, 30, 10)); h.stroke(L.rrp(-90, 0, 180, 30, 10)); });
    L.at(g, px - 240, gy - 70, kb, h => { h.lineWidth = 5; h.strokeStyle = C.ink; h.beginPath(); h.moveTo(0, 50); h.bezierCurveTo(-50, -10, -40, -70, 0, -70); h.bezierCurveTo(40, -70, 50, -10, 0, 50); h.fillStyle = C.red; h.fill(); h.stroke();
      h.beginPath(); h.arc(0, -30, 16, 0, TAU); h.fillStyle = C.white; h.fill(); h.stroke(); L.kw(h, '本土', 0, 100, { size: 40, fill: C.ink }); }, 0.06 * Math.sin(lt * 2));
    const rise = lt < Qv.cx + 0.4 ? 0 : Math.pow(lt - Qv.cx - 0.4, 2) * 520;
    L.rocket(g, RK.falcon9({ payload: 'dragon' }), px, gy - rise, 3.6, { sx: 1.75, flame: lt > Qv.cx + 0.2 ? 1.1 : 0, lt });
    L.at(g, px + 260, gy - 200, L.popK(lt, Qv.cx + 0.3, 0.38, 2.4), h => L.kw(h, '送人上天', 0, 0, { size: 44, fill: C.yel, col: C.ink }));
  }
}
// ③ First: private spacecraft → people in orbit.
function pageC(g, lt) {
  const Qv = q(); if (lt < Qv.dyc - 0.5) return;
  const kf = L.popK(lt, Qv.dyc + 0.25, 0.45, 2.6);   // Pop only once paper settles; no emerging through subtitle area.
  if (kf > 0) L.at(g, 1060, 230, kf, h => { L.kw(h, '第一次', 0, 0, { size: 74, fill: C.red }); }, -0.04);
  if (kf > 0) L.burstLines(g, 1060, 230, 170, 230, clamp((lt - Qv.dyc) / 0.5), { n: 10, col: C.red, lw: 6 });
  const k1 = L.popK(lt, Qv.sr - 0.05, 0.45, 2);
  if (k1 > 0) L.at(g, 600, 560, k1 * 1.12, h => { L.card(h, -200, -170, 400, 340, { fill: C.white }); L.capsule(h, 0, 50, 1.25, {}); L.kw(h, '私人公司的飞船', 0, 120, { size: 36, fill: C.blue }); }, 0.02 * Math.sin(lt * 1.7));
  L.arrow(g, lt, 840, 470, 920, 470, MO.cubicOut(clamp((lt - Qv.fc - 0.2) / 0.3)), { seed: 8, bend: -12, lw: 8, head: 24 });   // Split layout: ship left → presenter center → orbit right.
  L.arrow(g, lt, 1220, 470, 1300, 470, MO.cubicOut(clamp((lt - Qv.fc + 0.05) / 0.3)), { seed: 9, bend: -12, lw: 8, head: 24 });
  const k2 = L.popK(lt, Qv.sj - 0.25, 0.45, 2);
  if (k2 > 0) L.at(g, 1540, 560, k2 * 1.12, h => { L.card(h, -200, -170, 400, 340, { fill: C.white });
    h.save(); h.setLineDash([10, 9]); h.lineDashOffset = -lt * 30; h.lineWidth = 4; h.strokeStyle = C.ink; h.beginPath(); h.ellipse(0, -10, 150, 46, -0.15, 0, TAU); h.stroke(); h.restore();
    L.earth(h, 0, -10, 70, lt, { spin: 24 }); const th = lt * 2.2; L.astro(h, 150 * Math.cos(th) * 0.99, -10 + 46 * Math.sin(th) - 30, 0.45);
    L.kw(h, '送进轨道', 0, 120, { size: 36, fill: C.teal }); }, -0.02 * Math.sin(lt * 1.7));
}

SCENES[ID] = {
  init() { U.assertGlyphs('PuHui-Heavy', '私人公司2020年5月载人龙飞船两名宇航员20112020？近9年本土送人上天第一次私人公司的飞船送进轨道', ID); U.assertGlyphs('PuHui-Black', '20112020', ID); },
  draw(c, lt) {
    L.CUR_T = L.T0(ID) + lt;
    const Qv = q();
    L.bg(c, lt, { seed: 2617 });
    const s1 = MO.cubicInOut(clamp((lt - (Qv.mg - 0.45)) / 0.5)), s2 = MO.cubicInOut(clamp((lt - (Qv.dyc - 0.25)) / 0.45));
    // Three screens on same paper, pulled left.
    const off = -1080 * (s1 + s2);   // Paper scrolls upward only to presenter's right.
    if (s1 < 1) { c.save(); c.globalAlpha = Math.max(0, 1 - 2 * s1); c.translate(0, off); pageA(c, lt); c.restore(); }
    if (s1 > 0 && s2 < 1) { c.save(); if (s1 < 1) { c.beginPath(); c.rect(0, 0, 1920, 905); c.clip(); } c.globalAlpha = Math.max(0, 1 - 2 * s2); c.translate(0, off + 1080); pageB(c, lt); c.restore(); }
    if (s2 > 0) { c.save(); if (s2 < 1) { c.beginPath(); c.rect(0, 0, 1920, 905); c.clip(); } c.translate(0, off + 2160); pageC(c, lt); c.restore(); }
    if (lt < Qv.mg - 0.3) L.pageTitle(c, lt, '2020年5月', Qv.y20 - 0.1, { col: C.red, size: 44 }); else if (lt < Qv.dyc - 0.25) L.pageTitle(c, lt, '时隔近9年', Qv.mg - 0.3, { col: C.purple, size: 42 });
    else L.pageTitle(c, lt, '私人公司', Qv.dyc - 0.2, { col: C.blue, size: 42 });
  },
};
ERAS.find(e => e.id === ID).transition = { type: 'lin_iris', dur: 0.6, x: 1180, y: 520, col: C.teal };
L.cast(ID, [
  { t: 0.0, pose: 'walk', fr: 'walk', x: -260 },
  { t: 0.05, pose: 'present', fr: 'talk', x: 330, walk: 0.85 },   // Walk back from left.
  { t: TM.cue(ID, '美国') - 0.05, pose: 'think', fr: 'talk' },
  { t: TM.cue(ID, '送人上天') - 0.05, pose: 'point', fr: 'talk' },
  { t: TM.cue(ID, '也是第一次') - 0.1, pose: 'count', fr: 0, x: 1060, walk: 0.75 },   // Walk to center, cards on both sides.
  { t: TM.cue(ID, '私人公司') - 0.05, pose: 'present', fr: 'talk', flip: true },   // Point left to ship first.
  { t: TM.cue(ID, '送进轨道') - 0.05, pose: 'present', fr: 'talk', flip: false },
]);
L.year(ID, [[TM.cue(ID, '2020年5月'), 2020]]);
})();
