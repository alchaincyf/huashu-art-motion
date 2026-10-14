// S12 · What's next (roadmap and ending): dashed path from Earth; presenter walks in place as paper scrolls left (treadmill tracking), with four checklist stops:
// ☐ Catch spacecraft with chopsticks (small tower closes two arms) ☐ Refuel in space (two spacecraft nose-to-tail, fuel drops flowing) ☐ Return humans to the Moon (Starship and astronaut on lunar surface) ☐ Mars.
// After narration, pull back to the whole map; header badge reaches future; presenter waves; SpaceX's 24 years subtitle echoes the opening. Transition: expanding circle (lin_iris).
(() => {
const ID = 's12', L = LIN, { C, TAU } = L, { clamp, lerp } = U;
let Q = null;
const q = () => Q || (Q = { jxl: TM.cue(ID, '接下来'), kz: TM.cue(ID, '筷子'), jzfc: TM.cue(ID, '夹住飞船'), tk: TM.cue(ID, '在太空里'), jy: TM.cue(ID, '加油'), zq: TM.cue(ID, '争取'),
  yq: TM.cue(ID, '月球'), zwh: TM.cue(ID, '再往后'), hx: TM.cue(ID, '火星'), hxE: TM.end(ID, '火星'), end: TM.dur(ID) });

const ST = [1250, 2150, 3050, 3950], EARTH = 640;   // Stop spacing 900: previous stop fades just as it passes behind the presenter
const roadY = x => 660 + 60 * Math.sin(x / 300);
// Camera: screen = (world - cx) * s + 1220
function camAt(lt) {
  const Qv = q();
  const keys = [[0, 1000], [Qv.kz - 0.3, 1000], [Qv.kz + 0.15, ST[0] + 30], [Qv.tk - 0.25, ST[0] + 30], [Qv.tk + 0.35, ST[1]], [Qv.zq - 0.2, ST[1]], [Qv.zq + 0.6, ST[2]],
    [Qv.zwh - 0.15, ST[2]], [Qv.zwh + 0.55, ST[3]], [Qv.hxE + 0.25, ST[3]], [Qv.hxE + 1.25, ST[3]]];
  let cx = keys[0][1]; for (let i = 1; i < keys.length; i++) { const [t0, a] = keys[i - 1], [t1, b] = keys[i]; if (lt >= t0) cx = lt >= t1 ? b : lerp(a, b, MO.sineInOut((lt - t0) / (t1 - t0))); }
  const s = 1;
  return { cx, s };
}
function checkbox(h, x, y, done) { h.lineWidth = 5; h.strokeStyle = C.ink; h.fillStyle = C.white; h.fill(L.rrp(x - 22, y - 22, 44, 44, 8)); h.stroke(L.rrp(x - 22, y - 22, 44, 44, 8)); }
function label(g, lt, x, s, t0, col, y = 215) {
  const k = L.popK(lt, t0, 0.4, 2.2); if (k <= 0) return;
  L.at(g, x, y, k, h => { const w = L.kw(h, s, 30, 0, { size: 48, fill: col }); checkbox(h, -w / 2 - 14, 0); }, 0.02 * Math.sin(lt * 1.8 + x));
}
function stop1(g, lt) {                            // Small tower catches spacecraft
  const Qv = q(), x = ST[0], gy = roadY(x) - 30, cT = Qv.jzfc + 0.1, open = lt < cT ? 1 : 1 - MO.backOut(clamp((lt - cT) / 0.2), 2.5);
  const k = L.popK(lt, Qv.kz - 0.4, 0.45, 1.8); if (k <= 0) return;
  const pxm = 3.0 * k, sx = 1.3, tx = x + 60;
  const u = clamp((lt - (Qv.kz - 0.2)) / (cT - Qv.kz + 0.2)), e = 1 - Math.pow(1 - u, 2.2), shipBase = lerp(118, 70, e);
  L.rocket(g, RK.ship(), tx - 15 * pxm * sx, gy - shipBase * pxm + (lt > cT ? MO.settle(lt - cT, 5, 3, 7) : 0), pxm, { sx, pal: L.SS_PAL, flame: lt < cT ? 0.9 : 0, lt, lw: 3.5 });
  L.rocket(g, RK.tower({ armY: 110, open, len: 30 }), tx, gy, pxm, { sx, pal: { body: C.steelD, truss: C.tile, dark: C.red }, lw: 3.5 });
  L.burstLines(g, tx - 15 * pxm * sx, gy - 110 * pxm, 60, 110, clamp((lt - cT) / 0.45), { n: 9, lw: 5 });
}
function stop2(g, lt) {                            // Space refueling: two spacecraft nose-to-tail
  const Qv = q(), x = ST[1], y = 500, k = L.popK(lt, Qv.tk - 0.2, 0.45, 1.8); if (k <= 0) return;
  L.at(g, x, y, k * 1.3, h => {
    h.save(); h.fillStyle = C.ink; h.globalAlpha *= 0.9; h.fill(L.rrp(-330, -150, 660, 300, 40)); h.restore();   // Multiply alpha, otherwise outer fade is overwritten and the whole block vanishes in one frame
    const r = U.rng(3); for (let i = 0; i < 18; i++) { const sx = -310 + r() * 620, sy = -130 + r() * 260; L.spark(h, sx, sy, 5 + 4 * Math.sin(lt * 3 + i), C.white); }
    L.rocket(h, RK.ship(), -40, 0, 2.6, { rot: Math.PI / 2, sx: 1.8, pal: L.SS_PAL, lw: 3.5 });
    L.rocket(h, RK.ship(), 40, 0, 2.6, { rot: -Math.PI / 2, sx: 1.8, pal: L.SS_PAL, lw: 3.5 });
    // Fuel drops flow right to left
    for (let i = 0; i < 3; i++) { const ph = ((lt - Qv.jy) * 0.9 + i / 3) % 1; if (lt < Qv.jy - 0.2) break; const dx = lerp(60, -60, ph);
      h.save(); h.translate(dx, -40); h.scale(0.6, 0.6); h.beginPath(); h.moveTo(0, -30); h.bezierCurveTo(14, -10, 24, 4, 24, 12); h.arc(0, 12, 24, 0, Math.PI); h.bezierCurveTo(-24, 4, -14, -10, 0, -30); h.closePath();
      h.fillStyle = C.yel; h.fill(); h.lineWidth = 5; h.strokeStyle = C.ink; h.stroke(); h.restore(); }
  });
}
function stop3(g, lt) {                            // Moon
  const Qv = q(), x = ST[2], y = 500, k = L.popK(lt, Qv.zq - 0.1, 0.75, 1.5); if (k <= 0) return;
  L.planet(g, x, y + 60, 200, { col: C.moon, colD: C.moonD, craters: 6, seed: 8, k });
  const kl = L.popK(lt, Qv.yq - 0.6, 0.45, 2);
  if (kl > 0) L.at(g, x - 40, y - 140, kl * 1.25, h => { L.rocket(h, RK.ship(), 0, 0, 2.6, { sx: 1.8, pal: L.SS_PAL, lw: 3.5 }); L.astro(h, 70, -10, 0.42); });
  L.at(g, x - 300, 330, L.popK(lt, Qv.zq, 0.36, 2.4), h => L.kw(h, '争取', 0, 0, { size: 34, fill: C.white, col: C.ink }), -0.08);
}
function stop4(g, lt) {
  const Qv = q(), x = ST[3], y = 500, k = L.popK(lt, Qv.zwh - 0.1, 0.55, 1.6); if (k <= 0) return;
  L.planet(g, x, y + 50, 240, { k, craters: 5, seed: 3, rot: lt * 0.15 });
  L.twinkles(g, lt, [[x - 290, y - 130], [x + 290, y - 100], [x + 260, y + 240]], { r: 22 });
}
function world(g, lt, cam) {
  const Qv = q();
  // Path: starts at Earth and draws progressively (following camera)
  const rp = clamp((lt + 0.6) / (Qv.hx + 0.3 + 0.6));
  const xEnd = lerp(EARTH, ST[3] - 200, MO.sineInOut(rp));
  g.save(); g.setLineDash([26, 20]); g.lineDashOffset = -lt * 60; g.lineCap = 'round'; g.lineWidth = 12; g.strokeStyle = '#E2D6BF';
  g.beginPath(); for (let x = EARTH; x <= xEnd; x += 20) { const y = roadY(x) + 40; x === EARTH ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
  g.lineWidth = 6; g.strokeStyle = C.ink; g.globalAlpha = 0.65; g.stroke(); g.restore();
  // Fade passed stops behind the presenter (restore them for the whole-map pullback)
  const fadeAt = (wx) => clamp(((wx - cam.cx) * cam.s + 1220 - 380) / 420);   // wx is this stop's left edge: begin fading as soon as it reaches the presenter
  const F = (wx, fn) => { const a = fadeAt(wx); if (a <= 0) return; g.save(); g.globalAlpha *= a; fn(); g.restore(); };
  F(EARTH + 300, () => { L.earth(g, EARTH - 40, roadY(EARTH) - 20, 120, lt, { spin: 26 }); L.at(g, EARTH - 40, roadY(EARTH) - 190, 1, h => L.kw(h, '现在', 0, 0, { size: 34, fill: C.ink })); });
  F(ST[0] - 230, () => { stop1(g, lt); label(g, lt, ST[0] - 330, '筷子夹住飞船', Qv.kz - 0.1, C.red, 330); });   // Label left of tower, clear of catching action
  F(ST[1] - 440, () => { stop2(g, lt); label(g, lt, ST[1], '在太空里加油', Qv.jy - 0.25, C.orange); });
  F(ST[2] - 320, () => { stop3(g, lt); label(g, lt, ST[2], '重新送人上月球', Qv.yq - 0.6, C.blue); });
  stop4(g, lt);
  label(g, lt, ST[3], '火星', Qv.hx - 0.1, C.mars);
}

// Ending card (2.3 seconds after narration): roadmap fades; SpaceX's 24 years and large timeline 2002 → 2008 → 2026,
// Circle both 9.28 dates together (same-day opening callback), dashed extension toward Mars. Fade header timeline as the large timeline takes over.
const EY0 = 600, EX0 = 830, EX1 = 1600, MX = 1752;   // Shift timeline right so presenter does not cover 2002
const ex = y => lerp(EX0, EX1, (y - 2002) / 24);
function endCard(g, lt) {
  const Qv = q(), t0 = Qv.hxE + 0.12; if (lt < t0) return;
  const kt = L.popK(lt, t0, 0.5, 1.8);
  L.at(g, 1160, 250, kt, h => { L.txt(h, 'SpaceX', -14, 0, 104, { w: 'Black', align: 'right' }); L.txt(h, '这', 4, 0, 84, { w: 'Black' });
    L.txt(h, '24', 94, 4, 116, { w: 'Black', col: C.red }); L.txt(h, '年', 236, 0, 84, { w: 'Black' }); });
  const lp = MO.cubicOut(clamp((lt - t0 - 0.1) / 0.45));
  g.save(); g.lineCap = 'round'; g.lineWidth = 16; g.strokeStyle = C.red; g.beginPath(); g.moveTo(EX0, EY0); g.lineTo(lerp(EX0, EX1, lp), EY0); g.stroke();
  const dp = MO.cubicOut(clamp((lt - t0 - 0.5) / 0.4));
  if (dp > 0) { g.setLineDash([22, 18]); g.lineDashOffset = -lt * 50; g.lineWidth = 10; g.strokeStyle = C.ink; g.globalAlpha = 0.6; g.beginPath(); g.moveTo(EX1 + 30, EY0); g.lineTo(lerp(EX1 + 30, MX - 80, dp), EY0); g.stroke(); }
  g.restore();
  L.planet(g, MX, EY0, 56, { k: L.popK(lt, t0 + 0.75, 0.45, 2.2), craters: 4, seed: 3, rot: lt * 0.2 });
  if (lt > t0 + 0.85) L.at(g, MX, EY0 + 116, L.popK(lt, t0 + 0.85, 0.4, 2.4), h => L.kw(h, '火星', 0, 0, { size: 40, fill: C.mars }));
  const marks = [[2002, '创办', C.ink], [2008, '9月28号', C.red], [2026, '9月28号', C.red]];
  marks.forEach(([y, lab, col], i) => {
    const td = t0 + 0.12 + i * 0.15, k = L.popK(lt, td, 0.35, 2.4); if (k <= 0) return;
    L.at(g, ex(y), EY0, k, h => { h.beginPath(); h.arc(0, 0, 22, 0, TAU); h.fillStyle = i ? C.red : C.white; h.fill(); h.lineWidth = 5; h.strokeStyle = C.ink; h.stroke();
      L.txt(h, String(y), 0, 78, 46, { w: 'Black', align: 'center' }); L.kw(h, lab, 0, -78, { size: 36, fill: i ? C.red : C.white, col: i ? C.white : C.ink }); });
  });
  // Circle both same-day dates together: closing callback
  const rp = clamp((lt - t0 - 0.55) / 0.4);
  L.ring(g, lt, ex(2008), EY0 - 78, 110, 46, rp, { seed: 41, col: C.red, lw: 6 }); L.ring(g, lt, ex(2026), EY0 - 78, 110, 46, rp, { seed: 42, col: C.red, lw: 6 });
  L.arrow(g, lt, ex(2008) + 70, EY0 - 150, ex(2026) - 70, EY0 - 150, MO.cubicOut(clamp((lt - t0 - 0.65) / 0.35)), { seed: 43, bend: 60, lw: 6, head: 22 });
  if (lt > t0 + 0.8) L.at(g, (ex(2008) + ex(2026)) / 2, EY0 - 250, L.popK(lt, t0 + 0.8, 0.4, 2.4), h => L.kw(h, '同一天', 0, 0, { size: 40, fill: C.yel, col: C.ink }));
}
SCENES[ID] = {
  init() { U.assertGlyphs('PuHui-Heavy', '接下来现在筷子夹住飞船在太空里加油重新送人上月球争取火星SpaceX这24年创办9月28号同一天', ID); U.assertGlyphs('PuHui-Black', 'SpaceX这24年200820262002', ID); },
  draw(c, lt) {
    L.CUR_T = L.T0(ID) + lt;
    const Qv = q();
    L.bg(c, lt, { seed: 2622 });
    const { cx, s } = camAt(lt), wf = 1 - clamp((lt - Qv.hxE + 0.05) / 0.3);
    if (wf > 0) { c.save(); c.globalAlpha = wf; c.translate(1220, 0); c.scale(s, s); c.translate(-cx, 0); world(c, lt, { cx, s }); c.restore();
      c.save(); c.globalAlpha = wf; L.pageTitle(c, lt, '接下来', Qv.jxl - 0.1, { col: C.purple, size: 46 }); c.restore(); }
    endCard(c, lt);
  },
};
ERAS.find(e => e.id === ID).transition = { type: 'lin_iris', dur: 0.65, x: 960, y: 665, col: C.blue };
const Qv = q();
L.cast(ID, [
  { t: 0.05, pose: 'walk', fr: 'walk', x: 330, glide: 0.5 },
  { t: Qv.kz + 0.15, pose: 'point', fr: 'talk' },
  { t: Qv.tk - 0.25, pose: 'walk', fr: 'walk' },
  { t: Qv.tk + 0.35, pose: 'stick', fr: 'talk' },
  { t: Qv.zq - 0.2, pose: 'walk', fr: 'walk' },
  { t: Qv.zq + 0.6, pose: 'present', fr: 'talk' },
  { t: Qv.zwh - 0.15, pose: 'walk', fr: 'walk' },
  { t: Qv.zwh + 0.55, pose: 'lookup', fr: 'talk' },
  { t: Qv.hxE + 0.2, pose: 'wave', fr: 'loop' },
]);
L.year(ID, [[0.3, 2028]]);
L.setHudOff(L.T0(ID) + Qv.hxE + 0.2);   // Large ending timeline takes over; header fades
})();
