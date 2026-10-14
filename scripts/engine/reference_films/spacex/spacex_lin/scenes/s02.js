// S02 · Founded in 2002 (fast six-second segment, two facts): ① Faceless Musk icon — hand-drawn founded arrow → small factory receives a SpaceX sign
// ② Goal: shrink the first row upward, draw a dashed arc from Earth to a red planet, fly a small rocket along it, and pop up domed houses on the planet; highlight living on other planets.
// Transition: slide the whole page away (lin_slide), keeping presenter and header in place, as if turning to the next page of notes.
(() => {
const ID = 's02', L = LIN, { C, TAU } = L, { clamp, lerp } = U;
let Q = null;
const q = () => Q || (Q = { y02: TM.cue(ID, '2002年'), msk: TM.cue(ID, '马斯克'), cb: TM.cue(ID, '创办'), spx: TM.cue(ID, 'SpaceX'), mb: TM.cue(ID, '目标'),
  yyt: TM.cue(ID, '有一天'), rl: TM.cue(ID, '让人类'), zd: TM.cue(ID, '住到'), bdx: TM.cue(ID, '别的星球') });

function building(g, lt) {
  g.lineWidth = 5; g.strokeStyle = C.ink; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(-170, -40); g.lineTo(-170, 150); g.lineTo(170, 150); g.lineTo(170, -40); g.lineTo(60, -110); g.lineTo(60, -40); g.lineTo(-50, -110); g.lineTo(-50, -40); g.lineTo(-170, -110); g.closePath();
  g.fillStyle = C.white; g.fill(); g.stroke();
  g.fillStyle = C.blueL; for (const wx of [-130, -60, 70]) { g.fill(L.rrp(wx, 10, 50, 44, 8)); g.stroke(L.rrp(wx, 10, 50, 44, 8)); }
  g.fillStyle = C.orange; g.fill(L.rrp(-10, 50, 60, 100, 8)); g.stroke(L.rrp(-10, 50, 60, 100, 8));
  // A wisp of smoke from the chimney
  for (let j = 0; j < 3; j++) { const ph = (lt * 0.8 + j / 3) % 1; g.globalAlpha = 0.5 * (1 - ph); g.fillStyle = '#D9D4CB'; g.beginPath(); g.arc(140 + ph * 30, -130 - ph * 110, 14 + ph * 20, 0, TAU); g.fill(); }
  g.globalAlpha = 1; g.fillStyle = C.tile; g.fill(L.rrp(120, -150, 34, 80, 4)); g.stroke(L.rrp(120, -150, 34, 80, 4));
}
function row(g, lt) {
  const Qv = q(), up = MO.cubicInOut(clamp((lt - (Qv.mb - 0.1)) / 0.45));
  g.save(); L.cam(g, lerp(1, 0.72, up), 1200, 480, 0, lerp(0, -200, up));
  const kp = L.popK(lt, Qv.msk - 0.05, 0.42, 2.2);
  L.at(g, 760, 470, kp, h => { L.person(h, 0, 0, 1.7, C.mute); L.kw(h, '马斯克', 0, 170, { size: 50, fill: C.ink }); }, 0.02 * Math.sin(lt * 2));
  L.arrow(g, lt, 900, 430, 1150, 430, MO.cubicOut(clamp((lt - Qv.cb) / 0.35)), { seed: 2, bend: 60, lw: 8 });
  const kc = L.popK(lt, Qv.cb, 0.35, 2.4);
  if (kc > 0) L.at(g, 1025, 330, kc, h => L.kw(h, '创办', 0, 0, { size: 48, fill: C.yel, col: C.ink }));
  const kb = L.popK(lt, Qv.spx - 0.1, 0.45, 2);
  L.at(g, 1420, 470, kb, h => { building(h, lt); L.at(h, -10, -150, L.popK(lt, Qv.spx + 0.1, 0.4, 2.6), s => L.kw(s, 'SpaceX', 0, 0, { size: 52, fill: C.red }), -0.05 + 0.03 * Math.sin(lt * 2.2)); });
  g.restore();
}
function goal(g, lt) {
  const Qv = q(); if (lt < Qv.mb - 0.05) return;
  const kg = L.popK(lt, Qv.mb + 0.3, 0.4, 2.2);   // Wait for the upper row to settle before planting the flag
  L.at(g, 690, 450, kg, h => { // Small goal flag (in the empty space below and left of the silhouette)
    h.lineWidth = 5; h.strokeStyle = C.ink; h.lineCap = 'round'; h.beginPath(); h.moveTo(-60, 60); h.lineTo(-60, -60); h.stroke();
    h.beginPath(); h.moveTo(-58, -60); h.quadraticCurveTo(-20, -74 + 8 * Math.sin(lt * 6), 20, -60); h.quadraticCurveTo(50, -46 + 8 * Math.sin(lt * 6 + 1), 80, -56); h.lineTo(80, -10); h.quadraticCurveTo(40, 0, -58, -12); h.closePath();
    h.fillStyle = C.red; h.fill(); h.stroke(); L.kw(h, '目标', 10, 110, { size: 42, fill: C.ink });
  });
  const ke = L.popK(lt, Qv.mb + 0.15, 0.45, 1.8), kp = L.popK(lt, Qv.yyt, 0.5, 1.8);
  L.earth(g, 980, 650, 105, lt, { k: ke });
  L.planet(g, 1610, 560, 120, { k: kp, rot: lt * 0.2, craters: 4 });
  // Dashed arc with a small rocket flying along it
  const P0 = [1085, 600], P1 = [1490, 520], CP = [1290, 330];
  const bz = u => [(1 - u) ** 2 * P0[0] + 2 * (1 - u) * u * CP[0] + u * u * P1[0], (1 - u) ** 2 * P0[1] + 2 * (1 - u) * u * CP[1] + u * u * P1[1]];
  const ap = MO.cubicOut(clamp((lt - Qv.yyt) / 0.5));
  if (ap > 0) { g.save(); g.setLineDash([16, 14]); g.lineDashOffset = -lt * 50; g.lineWidth = 5; g.strokeStyle = C.ink; g.globalAlpha = 0.55; g.lineCap = 'round';
    g.beginPath(); for (let i = 0; i <= 30; i++) { const u = i / 30 * ap, [x, y] = bz(u); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.restore(); }
  const ru = MO.sineInOut(clamp((lt - Qv.rl) / (Qv.bdx - Qv.rl + 0.2)));
  if (lt > Qv.rl && ru < 1) { const [x, y] = bz(ru), [x2, y2] = bz(Math.min(1, ru + 0.02)); L.rocket(g, L.F1(), x, y, 3.4, { fins: true, rot: Math.atan2(y2 - y, x2 - x) + Math.PI / 2, sx: 3.6, flame: 0.8, lt }); }
  // Domed houses pop up on the planet
  const kh = L.popK(lt, Qv.zd, 0.4, 2.4);
  if (kh > 0) L.at(g, 1600, 452, kh, h => { h.lineWidth = 4; h.strokeStyle = C.ink;
    h.beginPath(); h.arc(0, 0, 44, Math.PI, 0); h.closePath(); h.fillStyle = C.white; h.fill(); h.stroke();
    h.fillStyle = C.blueL; h.beginPath(); h.arc(0, 0, 30, Math.PI, 0); h.closePath(); h.fill(); h.stroke();
    h.fillStyle = C.orange; h.fill(L.rrp(36, -26, 30, 26, 6)); h.stroke(L.rrp(36, -26, 30, 26, 6));
    h.fillStyle = C.yel; h.beginPath(); h.arc(-8, -14, 5, 0, TAU); h.fill(); });
  // Keywords
  const kw = L.popK(lt, Qv.zd - 0.1, 0.4, 2);
  if (kw > 0) L.at(g, 1300, 845, kw, h => {
    const w0 = L.tw('住到', 54, 'Heavy', h), w1 = L.tw('别的星球', 54, 'Heavy', h), w2 = L.tw('上', 54, 'Heavy', h), x0 = -(w0 + w1 + w2) / 2;
    L.marker(h, x0 + w0 - 4, -34, w1 + 8, 58, MO.cubicOut(clamp((lt - Qv.bdx) / 0.3)), L.C.hl, 4);
    L.txt(h, '住到别的星球上', x0, 18, 54);
  });
}

SCENES[ID] = {
  init() { U.assertGlyphs('PuHui-Heavy', '2002年马斯克创办SpaceX目标住到别的星球上', ID); U.assertGlyphs('PuHui-Black', '2002年', ID); },
  draw(c, lt) {
    L.CUR_T = L.T0(ID) + lt;
    L.bg(c, lt, { seed: 2612 });
    L.pageTitle(c, lt, '2002年', 1.2, { col: C.red, size: 46 });
    // Opening: large 2002 slams into the page center, then shrinks into the upper-left header before Musk is spoken
    const kY = L.popK(lt, q().y02 - 0.12, 0.4, 2.4), fly = MO.cubicInOut(clamp((lt - 0.95) / 0.32));
    if (kY > 0 && fly < 1) { c.save(); c.globalAlpha = 1 - clamp((fly - 0.75) / 0.25);
      L.at(c, lerp(1200, 160, fly), lerp(500, 104, fly), kY * lerp(1, 0.22, fly), h => { L.txt(h, '2002', 0, 70, 260, { w: 'Black', col: C.red, align: 'center' }); L.txt(h, '年', 296, 70, 110, { w: 'Black', align: 'left' }); }, -0.04 * (1 - fly)); c.restore(); }
    row(c, lt); goal(c, lt);
  },
};
ERAS.find(e => e.id === ID).transition = { type: 'lin_wipe', dur: 0.6, cols: [C.red, C.yel] };
L.cast(ID, [
  { t: 0.05, pose: 'present', fr: 'talk' },
  { t: TM.cue(ID, '目标') - 0.05, pose: 'think', fr: 'talk' },
]);
L.year(ID, [[TM.cue(ID, '2002年'), 2002]]);
})();
