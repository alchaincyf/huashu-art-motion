// S04 · NASA contract and Dragon (large-number impact segment): ① Calendar flips to three months later → contract card receives a contract stamp → counter settles at $1.6 billion with a money bag → cargo box follows a dashed route to the space station
// ② Page pushes upward: in 2012, Dragon flies from bottom left to dock with the station; first-ever ribbon and private spacecraft keyword box.
// Transition: expand a reveal from the center of the previous page's first-ever medal (lin_iris).
(() => {
const ID = 's04', L = LIN, { C, TAU } = L, { clamp, lerp } = U;
let Q = null;
const q = () => Q || (Q = { sgy: TM.cue(ID, '三个月后'), nasa: TM.cue(ID, 'NASA'), ht: TM.cue(ID, '合同'), n16: TM.cue(ID, '16亿美元'), kj: TM.cue(ID, '往空间站'), sh: TM.cue(ID, '送货'),
  y12: TM.cue(ID, '2012年'), lfc: TM.cue(ID, '龙飞船'), cl: TM.cue(ID, '成了'), dys: TM.cue(ID, '第一艘'), gj: TM.cue(ID, '国际空间站'), sr: TM.cue(ID, '私人飞船') });

function moneyBag(g, lt) {
  g.lineWidth = 5; g.strokeStyle = C.ink; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(-40, -110); g.quadraticCurveTo(0, -80, 40, -110); g.lineTo(30, -70); g.bezierCurveTo(130, -30, 130, 110, 0, 110); g.bezierCurveTo(-130, 110, -130, -30, -30, -70); g.closePath();
  g.fillStyle = C.gold; g.fill(); g.stroke();
  g.fillStyle = C.goldD; g.fill(L.rrp(-36, -82, 72, 16, 8)); g.stroke(L.rrp(-36, -82, 72, 16, 8));
  L.txt(g, '$', 0, 30, 110, { w: 'Black', col: C.goldD, align: 'center', base: 'middle' });
}
function cargo(g, s = 1) {
  g.save(); g.scale(s, s); g.lineWidth = 4; g.strokeStyle = C.ink; g.lineJoin = 'round';
  g.fillStyle = '#E7B776'; g.fill(L.rrp(-40, -34, 80, 68, 6)); g.stroke(L.rrp(-40, -34, 80, 68, 6));
  g.beginPath(); g.moveTo(-40, -8); g.lineTo(40, -8); g.moveTo(-12, -34); g.lineTo(-12, 34); g.moveTo(12, -34); g.lineTo(12, 34); g.stroke(); g.restore();
}
function pageA(g, lt) {
  const Qv = q();
  // Calendar: September → December (tear page) and three months later
  const kc = L.popK(lt, 0.02, 0.4, 2), fl = clamp((lt - 0.35) / 0.55);
  L.at(g, 760, 300, kc, h => {
    if (fl > 0) L.calPage(h, '2008年', '12月', C.blue, '', { w: 220, h: 220 });
    if (fl < 1) { const e = MO.cubicIn(fl); h.save(); h.translate(-100, -100); h.rotate(-e * 1.1); h.translate(100 - e * 60, 100 + e * e * 700); h.globalAlpha = 1 - clamp((fl - 0.7) / 0.3);
      L.calPage(h, '2008年', '9月', C.red, '', { w: 220, h: 220 }); h.restore(); }
  }, -0.04);
  const k3 = L.popK(lt, Qv.sgy + 0.1, 0.4, 2.4);
  if (k3 > 0) L.at(g, 760, 470, k3, h => L.kw(h, '3个月后', 0, 0, { size: 44, fill: C.purple }));
  // Contract
  const kd = L.popK(lt, Qv.nasa - 0.1, 0.45, 1.8);
  L.at(g, 1070, 520, kd, h => {
    L.card(h, -150, -200, 300, 400, { fill: C.white, r: 18 });
    L.kw(h, 'NASA', 0, -138, { size: 40, fill: C.blue, h: 62 });
    h.lineCap = 'round'; h.lineWidth = 7; h.strokeStyle = '#D8D1C4'; for (let i = 0; i < 5; i++) { h.beginPath(); h.moveTo(-104, -50 + i * 44); h.lineTo(i === 4 ? 10 : 104, -50 + i * 44); h.stroke(); }
    // Signature: draw in one stroke when contract is spoken
    const sp = clamp((lt - Qv.ht) / 0.45), pts = []; for (let i = 0; i <= 30; i++) { const u = i / 30; pts.push([-20 + u * 120, 150 + Math.sin(u * 14) * 14 - u * 20]); }
    h.strokeStyle = C.blue; h.lineWidth = 5; L.strokePart(h, pts, sp);
    L.at(h, 92, 120, L.popK(lt, Qv.ht + 0.05, 0.3, 2.6), s => { s.lineWidth = 6; s.strokeStyle = C.red; s.beginPath(); s.arc(0, 0, 52, 0, TAU); s.stroke(); L.txt(s, '合同', 0, 4, 36, { col: C.red, align: 'center', base: 'middle' }); }, -0.25);
  }, 0.03 * Math.sin(lt * 1.6));
  // $1.6 billion
  const c0 = Qv.n16 - 0.05, cp = lt >= c0 ? 1 : 0;   // Slam 16 straight down without counting (a counter would flash 15)
  const kn = L.popK(lt, c0, 0.35, 2.2);
  if (kn > 0) L.at(g, 1530, 400, kn * (1 + MO.settle(lt - c0 - 0.3, 0.1, 3, 6)), h => { L.txt(h, '16', 20, 0, 190, { w: 'Black', col: C.red, align: 'right' }); L.txt(h, '亿美元', 34, 0, 70); });
  const kbg = L.popK(lt, c0 + 0.15, 0.4, 2.2);
  if (kbg > 0) L.at(g, 1690, 600, kbg * 0.78, h => moneyBag(h, lt), 0.06 * Math.sin(lt * 3));
  if (cp >= 1) L.twinkles(g, lt, [[1300, 250], [1800, 270], [1560, 470]], { r: 20 });
  L.ring(g, lt, 1440, 335, 150, 100, clamp((lt - c0 - 0.35) / 0.4), { seed: 61, col: C.red, lw: 7 });
  // Delivery: cargo box flies along the dashed line toward the station
  const ks = L.popK(lt, Qv.kj, 0.45, 1.8);
  if (ks > 0) {
    L.at(g, 1610, 790, ks * 0.62, h => L.iss(h, 0, 0, 1));
    g.save(); g.setLineDash([14, 12]); g.lineDashOffset = -lt * 50; g.lineWidth = 5; g.strokeStyle = C.ink; g.globalAlpha = 0.5 * ks; g.lineCap = 'round';
    g.beginPath(); g.moveTo(1180, 800); g.quadraticCurveTo(1330, 700, 1480, 790); g.stroke(); g.restore();
    const u = ((lt - Qv.kj) * 0.9) % 1, bx = lerp(1180, 1480, u), by = (1 - u) ** 2 * 800 + 2 * (1 - u) * u * 700 + u * u * 790;
    g.save(); g.globalAlpha = Math.sin(Math.PI * u); g.translate(bx, by); cargo(g, 0.8); g.restore();
    L.at(g, 1180, 800, L.popK(lt, Qv.sh - 0.05, 0.35, 2.4), h => L.kw(h, '送货', 0, 0, { size: 48, fill: C.orange }));
  }
}
function pageB(g, lt) {
  const Qv = q(); if (lt < Qv.y12 - 0.4) return;
  // Station slightly right of center; Dragon flies from bottom left to dock
  const ki = L.popK(lt, Qv.y12 - 0.1, 0.5, 1.6), sx = 1300, sy = 330, IS = 1.9, CS = 1.55;
  L.at(g, sx, sy + 6 * Math.sin(lt * 1.3), ki * IS, h => L.iss(h, 0, 0, 1), 0.03);
  if (lt > Qv.gj - 0.05) L.at(g, sx + 380, sy - 150, L.popK(lt, Qv.gj - 0.05, 0.36, 2.4), h => L.kw(h, '国际空间站', 0, 0, { size: 38, fill: C.white, col: C.ink }));
  const t0 = Qv.lfc - 0.3, t1 = Qv.cl + 0.1, u = MO.cubicInOut(clamp((lt - t0) / (t1 - t0)));
  const dockX = sx, baseY = sy + 70 * IS + 128 * CS;              // Nose cone touches the module below the station
  if (lt > t0 - 0.2) {
    const x = lerp(1880, dockX, u), y = lerp(560, baseY, u) - Math.sin(Math.PI * u) * 60,   // Fly in from the right, avoiding the subtitle area throughout
     rot = lerp(-0.55, 0, MO.smooth(u));
    L.capsule(g, x, y, CS, { rot, flame: u < 0.95 ? 0.7 : 0, lt, cargo: true });   // 2012 uses Cargo Dragon (with solar-panel trunk)
  }
  L.burstLines(g, dockX, sy + 70 * IS, 100, 180, clamp((lt - t1) / 0.5), { n: 10, col: C.ink, lw: 6 });
  const kb = L.popK(lt, Qv.dys, 0.4, 2.6);
  if (kb > 0) L.at(g, 800, 330, kb, h => {      // First-ever ribbon
    h.lineWidth = 5; h.strokeStyle = C.ink; h.lineJoin = 'round';
    h.beginPath(); h.moveTo(-170, -44); h.lineTo(170, -44); h.lineTo(140, 0); h.lineTo(170, 44); h.lineTo(-170, 44); h.lineTo(-140, 0); h.closePath(); h.fillStyle = C.red; h.fill(); h.stroke();
    L.txt(h, '第一艘', 0, 4, 56, { w: 'Black', col: C.white, align: 'center', base: 'middle' });
  }, -0.06);
  const kr = L.popK(lt, Qv.sr - 0.05, 0.4, 2.4);
  if (kr > 0) L.at(g, 1650, 640, kr, h => { L.kw(h, '私人飞船', 0, 0, { size: 60, fill: C.blue }); });
  if (kr > 0) L.twinkles(g, lt, [[1450, 570], [1820, 720]], { r: 18 });
}

SCENES[ID] = {
  init() { U.assertGlyphs('PuHui-Heavy', '2010猎鹰9号首飞2008年12月9月3个月后NASA合同亿美元送货2012年国际空间站第一艘私人飞船0123456789', ID); U.assertGlyphs('PuHui-Black', '0123456789$第一艘', ID); },
  draw(c, lt) {
    L.CUR_T = L.T0(ID) + lt;
    const Qv = q();
    L.bg(c, lt, { seed: 2614 });
    // In-page upward push: at 2012, slide the whole page upward and bring the next screen up from below
    const up = MO.cubicInOut(clamp((lt - (Qv.y12 - 0.35)) / 0.55));
    if (up < 1) { c.save(); c.globalAlpha = Math.max(0, 1 - 2 * up); c.translate(0, -1080 * up); pageA(c, lt); c.restore(); }
    if (up > 0) { c.save(); if (up < 1) { c.beginPath(); c.rect(0, 0, 1920, 905); c.clip(); } c.translate(0, 1080 * (1 - up)); pageB(c, lt); c.restore(); }
    if (up < 0.5) L.pageTitle(c, lt, 'NASA合同', Qv.nasa - 0.15, { col: C.blue, size: 42 }); else L.pageTitle(c, lt, '2012年', Qv.y12 - 0.1, { col: C.red, size: 46 });
  },
};
ERAS.find(e => e.id === ID).transition = { type: 'lin_iris', dur: 0.65, x: 1300, y: 760, col: C.yel };
L.cast(ID, [
  { t: 0.05, pose: 'stick', fr: 'talk' },
  { t: TM.cue(ID, '2012年') - 0.2, pose: 'present', fr: 'talk', x: 450, walk: 0.7 },   // Move closer to look at the station
  { t: TM.cue(ID, '第一艘') - 0.05, pose: 'thumb', fr: 'talk' },
]);
L.year(ID, [[0.3, 2008], [TM.cue(ID, '2012年') - 0.45, 2012]]);   // Year has already reached 2012 before the Dragon sentence begins
})();
