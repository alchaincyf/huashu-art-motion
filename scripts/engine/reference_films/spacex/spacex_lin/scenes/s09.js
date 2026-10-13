// S09 · Starlink large-number segment: ① most-launches donut (123 of 165 in 2025, fact row 21a) + opening fairing, stacked flat satellites pop out.
// ② 2019: 60 satellite icons light in 10×6 array; ③ shrink into square, fly to Earth; denser satellite rings, 11,000+ in orbit → 12 million+ user figures appear in rows.
// Transition: pink/cyan bands wipe right→left (lin_wipe).
(() => {
const ID = 's09', L = LIN, { C, TAU } = L, { clamp, lerp } = U;
let Q = null;
const q = () => Q || (Q = { zx: TM.cue(ID, '这些发射'), dd: TM.cue(ID, '大多'), sz: TM.cue(ID, '送自家的'), xl: TM.cue(ID, '星链卫星'), y19: TM.cue(ID, '2019年'), dyp: TM.cue(ID, '第一批'),
  n60: TM.cue(ID, '60颗'), n60E: TM.end(ID, '60颗'), xz: TM.cue(ID, '现在'), zg: TM.cue(ID, '在轨的'), n11: TM.cue(ID, '1.1万颗'), n11E: TM.end(ID, '1.1万颗'), yh: TM.cue(ID, '用户'),
  n12: TM.cue(ID, '1200万'), n12E: TM.end(ID, '1200万') });

function pageA(g, lt) {
  const Qv = q(), k = L.popK(lt, 0.05, 0.45, 1.6), sp = MO.cubicOut(clamp((lt - Qv.dd + 0.2) / 0.6)) * (123 / 165);
  L.at(g, 860, 470, k, h => {
    h.lineWidth = 84; h.strokeStyle = '#E4DDD0'; h.beginPath(); h.arc(0, 0, 170, 0, TAU); h.stroke();
    h.strokeStyle = C.teal; h.beginPath(); h.arc(0, 0, 170, -Math.PI / 2, -Math.PI / 2 + TAU * sp); h.stroke();
    h.lineWidth = 4.5; h.strokeStyle = C.ink; for (const r of [128, 212]) { h.beginPath(); h.arc(0, 0, r, 0, TAU); h.stroke(); }
    if (sp > 0) for (const a of [-Math.PI / 2, -Math.PI / 2 + TAU * sp]) { h.beginPath(); h.moveTo(Math.cos(a) * 128, Math.sin(a) * 128); h.lineTo(Math.cos(a) * 212, Math.sin(a) * 212); h.stroke(); }
    L.at(h, 0, 0, L.popK(lt, Qv.dd, 0.4, 2.4), s => L.txt(s, '大多', 0, 8, 76, { w: 'Black', align: 'center', base: 'middle', col: C.teal }));
  });
  const kc = L.popK(lt, Qv.sz, 0.4, 2);
  if (kc > 0) L.at(g, 860, 770, kc, h => L.txt(h, '2025年：165次发射里，123次送星链', 0, 0, 46, { align: 'center', col: C.ink, w: 'Heavy' }));
  // Fairing opens, satellite stack pops out.
  const fx = 1480, fy = 490, op = MO.backOut(clamp((lt - Qv.sz) / 0.5), 1.5);
  g.save(); g.beginPath(); g.rect(0, 0, 1920, 830); g.clip(); L.rocket(g, RK.falcon9({ payload: 'none' }), fx, fy + 330, 6.2, { sx: 2.3 }); g.restore();
  // Clouds: outline all circles, fill to cover internal lines, leaving one cloud silhouette rather than row of balls.
  const CL = [[-150, 18, 44], [-95, -6, 58], [-30, -20, 66], [40, -8, 60], [105, 6, 52], [160, 22, 40], [0, 30, 60], [-80, 34, 50], [90, 34, 50]];
  g.save(); g.translate(fx, 812 + 3 * Math.sin(lt * 1.5)); g.lineWidth = 9; g.strokeStyle = C.ink; for (const [x, y, r] of CL) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); }
  g.fillStyle = C.white; for (const [x, y, r] of CL) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); } g.restore();
  const top = fy + 330 - 54 * 6.2;                    // Second-stage top.
  // No fairing (repeatedly looked like blade); open stage top pushes stacked Starlinks upward.
  for (let i = 0; i < 6; i++) { const ki = L.popK(lt, Qv.sz + 0.25 + i * 0.07, 0.35, 2.2); if (ki <= 0) continue;
    const yy = top - 30 - i * 40, xx = fx + (i % 2 ? 24 : -24) * ki;
    g.save(); g.translate(xx, yy); g.rotate((i % 2 ? 1 : -1) * 0.12 * ki); g.scale(ki, ki); g.lineWidth = 4; g.strokeStyle = C.ink; g.fillStyle = C.blue; g.fill(L.rrp(-70, -14, 140, 28, 6)); g.stroke(L.rrp(-70, -14, 140, 28, 6));
    g.beginPath(); for (let j = 1; j < 5; j++) { g.moveTo(-70 + j * 28, -14); g.lineTo(-70 + j * 28, 14); } g.stroke(); g.restore(); }
  const kx = L.popK(lt, Qv.xl - 0.05, 0.4, 2.4);
  if (kx > 0) L.at(g, 1500, 165, kx, h => L.kw(h, '自家的星链卫星', 0, 0, { size: 46, fill: C.blue }));
}
// ② 60 satellites.
const gx = i => 880 + (i % 12) * 78, gy = i => 270 + Math.floor(i / 12) * 84;   // 12×5, enlarged so satellites read on phones.
function pageB(g, lt) {
  const Qv = q(), t0 = Qv.dyp - 0.1, t1 = Qv.n60E - 0.05, shrink = MO.cubicInOut(clamp((lt - (Qv.xz - 0.1)) / 0.55));
  if (shrink >= 1) return;
  g.save(); L.cam(g, lerp(1, 0.12, shrink), 1309, 438, lerp(0, EX - 1309, shrink), lerp(0, 520 - 438, shrink)); g.globalAlpha = 1 - clamp((shrink - 0.7) / 0.3);
  let n = 0;
  for (let i = 0; i < 60; i++) { const ti = t0 + (t1 - t0) * i / 59, k = L.popK(lt, ti, 0.25, 2.6); if (lt >= ti) n++;
    g.save(); g.globalAlpha *= k > 0 ? 1 : 0.18; L.sat(g, gx(i), gy(i), k > 0 ? 1.65 * k : 1.65, 0, 0); g.restore(); }
  g.restore();
  const kn = L.popK(lt, t0, 0.35, 2) * (1 - shrink);
  if (kn > 0) L.at(g, 1324, 780, kn, h => { L.txt(h, String(n), 10, 0, 150, { w: 'Black', col: C.blue, align: 'right' }); L.txt(h, '颗', 24, 0, 70); L.kw(h, '第一批', -300, -40, { size: 48, fill: C.yel, col: C.ink }); });
}
// ③ Earth, satellite swarm, and two large numbers
const EX = 960, EY = 520, ER = 160;
const SW = (() => { const r = U.rng(909), a = []; for (let i = 0; i < 520; i++) a.push({ sh: Math.floor(r() * 5), ph: r() * TAU, sp: 0.35 + r() * 0.25, t: r() }); return a; })();
const SHELLS = [[230, 70, -0.35], [250, 95, 0.25], [210, 120, 0.9], [270, 60, -1.1], [240, 150, 1.5]];
function pageC(g, lt) {
  const Qv = q(); if (lt < Qv.xz - 0.2) return;
  const ke = L.popK(lt, Qv.xz - 0.1, 0.45, 1.6), dens = MO.cubicOut(clamp((lt - Qv.zg + 0.1) / (Qv.n11E - Qv.zg)));
  const pts = [];
  for (const s of SW) { if (s.t > dens) continue; const [rx, ry, tl] = SHELLS[s.sh], th = s.ph + lt * s.sp, x = rx * Math.cos(th), y = ry * Math.sin(th);
    pts.push([EX + x * Math.cos(tl) - y * Math.sin(tl), EY + x * Math.sin(tl) + y * Math.cos(tl), Math.sin(th) > 0]); }
  const dot = (p) => { g.beginPath(); g.arc(p[0], p[1], 5, 0, TAU); g.fillStyle = C.yel; g.fill(); g.lineWidth = 2; g.strokeStyle = C.ink; g.stroke(); };
  for (const p of pts) if (!p[2]) dot(p);
  L.earth(g, EX, EY, ER, lt, { k: ke });
  for (const p of pts) if (p[2]) dot(p);
  // 11,000+
  const c0 = Qv.zg, c1 = Qv.n11E, cp = MO.cubicInOut(clamp((lt - c0) / (c1 - c0))), k1 = L.popK(lt, c0, 0.4, 2), land1 = lt >= c1;
  if (k1 > 0) L.at(g, 1340, 400, k1, h => { // Count up from the first batch of 60; show whole satellite counts while counting, then switch to 11,000+ when settled
    if (!land1) { const v = Math.round(lerp(60, 11000, cp)).toLocaleString('en-US'); L.txt(h, v, 0, 0, 108, { w: 'Black', col: C.blue }); }
    else { L.at(h, 0, 0, 1 + MO.settle(lt - c1, 0.12, 3, 6), z => { L.txt(z, '1.1', 0, 0, 190, { w: 'Black', col: C.blue }); L.txt(z, '万+', L.tw('1.1', 190, 'Black', z) + 8, 0, 96, { w: 'Black', col: C.blue }); }); }
    L.kw(h, '颗在轨', 46, 70, { size: 38, fill: C.white, col: C.ink, align: 'left' }); });
  L.underline(g, lt, 1340, 422, 300, MO.cubicOut(clamp((lt - c1 - 0.05) / 0.35)), { col: C.red, seed: 81 });
  // 12 million+ users
  const d0 = Qv.yh - 0.05, d1 = Qv.n12E, dp = MO.cubicInOut(clamp((lt - d0) / (d1 - d0))), k2 = L.popK(lt, d0, 0.4, 2), land2 = lt >= d1;
  if (k2 > 0) { L.at(g, 1340, 680, k2, h => { const v = String(Math.round(1200 * dp)); L.txt(h, v, 0, 0, 150, { w: 'Black', col: C.red }); L.txt(h, land2 ? '万+' : '万', L.tw(v, 150, 'Black', h) + 8, 0, 76, { w: 'Black', col: C.red });
      L.kw(h, '用户', 46, 66, { size: 38, fill: C.white, col: C.ink, align: 'left' }); });
    L.ring(g, lt, 1520, 640, 220, 80, clamp((lt - d1 - 0.05) / 0.4), { seed: 82, col: C.red, lw: 7 });
    for (let i = 0; i < 9; i++) { const kp = L.popK(lt, d0 + i * 0.07, 0.3, 2.4); if (kp > 0) L.at(g, 1360 + i * 40, 820, kp, h => L.person(h, 0, 0, 0.42, [C.pink, C.teal, C.yel][i % 3])); } }
}

SCENES[ID] = {
  init() { U.assertGlyphs('PuHui-Heavy', '大多自家的星链卫星第一批颗在轨用户2019年0123456789', ID); U.assertGlyphs('PuHui-Bold', '2025年：165次发射里，123次送星链', ID); U.assertGlyphs('PuHui-Black', '0123456789.,万+大多颗', ID); },
  draw(c, lt) {
    L.CUR_T = L.T0(ID) + lt;
    const Qv = q();
    L.bg(c, lt, { seed: 2619 });
    const s1 = MO.cubicInOut(clamp((lt - (Qv.y19 - 0.4)) / 0.5));
    if (s1 < 1) { c.save(); c.globalAlpha = Math.max(0, 1 - 2 * s1); c.translate(0, -1080 * s1); pageA(c, lt); c.restore(); }
    if (s1 > 0) { c.save(); if (s1 < 1) { c.beginPath(); c.rect(0, 0, 1920, 905); c.clip(); } c.translate(0, 1080 * (1 - s1)); pageC(c, lt); pageB(c, lt); c.restore(); }
    if (s1 < 0.5) L.pageTitle(c, lt, '星链', Qv.xl - 0.1, { col: C.blue, size: 44 });
    else if (lt < Qv.xz - 0.1) L.pageTitle(c, lt, '2019年', Qv.y19 - 0.1, { col: C.red, size: 46 }); else L.pageTitle(c, lt, '现在', Qv.xz - 0.05, { col: C.red, size: 46 });
  },
};
ERAS.find(e => e.id === ID).transition = { type: 'lin_zoom', dur: 0.6, x: 840, y: 720 };   // Push through the 37-times chart
L.cast(ID, [
  { t: 0.0, pose: 'walk', fr: 'walk', x: 2150, walk: 0.3 },   // Exit briskly right and return from the left
  { t: 0.31, pose: 'walk', fr: 'walk', x: -260 },
  { t: 0.32, pose: 'point', fr: 'talk', x: 330, walk: 0.55 },
  { t: TM.cue(ID, '2019年') - 0.1, pose: 'present', fr: 'talk' },
  { t: TM.cue(ID, '在轨的') - 0.1, pose: 'wow', fr: 'bounce', x: 165, s: 0.4, glide: 0.45 },   // Two large numbers fill the screen; presenter retreats to the corner
  { t: TM.cue(ID, '用户') - 0.05, pose: 'thumb', fr: 'talk' },
  { t: TM.end(ID, '1200万') + 0.1, pose: 'thumb', fr: 2, x: 330, s: 0.66, glide: 0.4 },
]);
L.year(ID, [[TM.cue(ID, '2019年'), 2019], [TM.cue(ID, '现在'), 2026]]);
})();
