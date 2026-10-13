// S10 · Starship (highlight segment: explosion and chopsticks): ① True-scale height comparison of Falcon 1, Falcon 9, and Starship; Starship rises from the ground, presenter looks up, with largest ever / most powerful labels
// ② 2023 maiden flight: Starship launches, stopwatch reaches about four minutes, tumbles and explodes; presenter holds their head. ③ October 2024: tower extends two arms; bubble shows chopsticks picking up a dumpling (like chopsticks);
// Booster descends and the arms close — caught! Radiating lines and confetti, hold one beat. Transition: flip the paper card (lin_flip).
(() => {
const ID = 's10', L = LIN, { C, TAU } = L, { clamp, lerp } = U;
let Q = null;
const q = () => Q || (Q = { xj: TM.cue(ID, '星舰'), zd: TM.cue(ID, '最大'), zq: TM.cue(ID, '最强'), y23: TM.cue(ID, '2023年'), sf: TM.cue(ID, '首飞'), sk: TM.cue(ID, '升空'),
  sfz: TM.cue(ID, '四分钟左右'), sfzE: TM.end(ID, '四分钟左右'), zl: TM.cue(ID, '炸了'), y24: TM.cue(ID, '2024年10月'), fst: TM.cue(ID, '发射塔'), sc: TM.cue(ID, '伸出'), jxb: TM.end(ID, '机械臂'),
  kz: TM.cue(ID, '筷子'), ycj: TM.cue(ID, '一次就'), lh: TM.cue(ID, '落回来'), jz: TM.cue(ID, '夹住了'), end: TM.dur(ID) });

const GY = 850, PXM = 5.0, SXS = 1.45;
function ground(g, x0 = 0) { g.save(); g.lineWidth = 5; g.strokeStyle = C.ink; g.fillStyle = '#EADFCB'; g.beginPath(); g.rect(x0, GY + 2, 1920 - x0, 400); g.fill(); g.beginPath(); g.moveTo(x0, GY + 2); g.lineTo(1920, GY + 2); g.stroke(); g.restore(); }
function pageA(g, lt) {                             // Height comparison → maiden flight → explosion
  const Qv = q(); ground(g);
  const fade = L.outK(lt, Qv.sf - 0.25, 0.35);   // Keep the three-rocket height comparison until just before maiden flight
  if (fade < 1) { g.save(); g.globalAlpha = 1 - fade;
    const k1 = L.popK(lt, 0.05, 0.4, 2), k9 = L.popK(lt, 0.25, 0.4, 2);
    L.at(g, 800, GY, k1, h => L.rocket(h, L.F1(), 0, 0, PXM, { sx: SXS * 1.3 })); L.at(g, 800, GY + 44, k1, h => L.txt(h, '猎鹰1号', 0, 0, 32, { align: 'center', col: C.sub }));
    L.at(g, 1000, GY, k9, h => L.rocket(h, RK.falcon9({}), 0, 0, PXM, { sx: SXS })); L.at(g, 1000, GY + 44, k9, h => L.txt(h, '猎鹰9号', 0, 0, 32, { align: 'center', col: C.sub }));
    g.restore(); }
  // Starship: rises from below ground (clip above ground), ignites and launches on maiden flight, tumbles and explodes four minutes later
  const up = MO.backOut(clamp((lt - Qv.xj + 0.1) / 0.7), 1.2), rise = lt < Qv.sf ? 0 : Math.pow(lt - Qv.sf, 1.6) * 70;
  const tumble = lt > Qv.sfzE - 0.5 ? (lt - (Qv.sfzE - 0.5)) * 0.9 : 0, boom = Qv.zl;
  if (lt < boom + 0.05 && up > 0) {
    g.save(); g.beginPath(); g.rect(0, 0, 1920, GY + 2); g.clip();
    L.rocket(g, RK.starship(), 1330, GY + (1 - up) * 650 - rise, PXM, { sx: 1.95, pal: L.SS_PAL,   // Thicker Starship: a chunky stainless-steel body, instantly distinct from slim Falcons
      flame: lt > Qv.sf - 0.2 ? 1 : 0, lt, rot: tumble, lw: 4.5 });
    g.restore();
  }
  if (fade < 1) { g.save(); g.globalAlpha = 1 - fade; L.at(g, 1330, GY + 44, L.popK(lt, Qv.xj, 0.4, 2), h => L.txt(h, '星舰', 0, 0, 32, { align: 'center', col: C.sub }));
    // Dashed height guides
    if (up > 0.9) { g.setLineDash([10, 10]); g.lineWidth = 3; g.strokeStyle = C.mute; for (const [x, hh] of [[800, 22.7], [1000, 70], [1330, 123]]) { g.beginPath(); g.moveTo(x - 60, GY - hh * PXM - 4); g.lineTo(x + 60, GY - hh * PXM - 4); g.stroke(); } g.setLineDash([]); }
    g.restore(); }
  const ka = L.popK(lt, Qv.zd - 0.3, 0.4, 2.4) * (1 - fade), kb = L.popK(lt, Qv.zq - 0.05, 0.4, 2.4) * (1 - fade);
  if (ka > 0) L.at(g, 1640, 380, ka, h => L.kw(h, '史上最大', 0, 0, { size: 58, fill: C.red }), -0.04);
  if (kb > 0) L.at(g, 1640, 500, kb, h => L.kw(h, '最强', 0, 0, { size: 58, fill: C.orange }), 0.04);
  // Stopwatch: starts after maiden flight and settles at about four minutes
  const ks = L.popK(lt, Qv.sk - 0.1, 0.4, 2), sp = MO.cubicOut(clamp((lt - Qv.sk) / (Qv.sfzE - Qv.sk)));
  const pf = 1 - L.pushK(L.CUR_T);   // Remove stopwatch before pushing to presenter close-up, so it is not cut in half
  if (ks > 0 && lt < Qv.y24 + 1 && pf > 0.02) { g.save(); g.globalAlpha *= pf; L.stopwatch(g, 1730, 420, 90, sp * 0.999, { k: ks, col: C.red });
    L.at(g, 1730, 590, L.popK(lt, Qv.sfz, 0.4, 2.2), h => L.kw(h, '四分钟左右', 0, 0, { size: 42, fill: C.white, col: C.ink })); g.restore(); }
  // Explosion
  const by = GY - 62 * PXM - Math.pow(boom - Qv.sf, 1.6) * 70;
  L.puff(g, 1330, by + 40, lt - boom, { s: 1.75, seed: 12 });
  const kz = L.popK(lt, boom + 0.05, 0.35, 2.8);
  if (kz > 0 && lt < Qv.y24 + 1) L.at(g, 1000, 300, kz, h => L.kw(h, '炸了！', 0, 0, { size: 76, fill: C.red }), -0.08);
}
// ③ Chopsticks
const TX = 1590, TPX = 4.6, TSX = 1.3, ARMY = 74;
function chopsticks(g, lt) {
  const Qv = q(), k = L.popK(lt, Qv.kz - 0.25, 0.45, 2); if (k <= 0) return;
  const out = L.outK(lt, Qv.ycj - 0.1, 0.3); if (out >= 1) return;
  L.at(g, 860, 360, k * (1 - out), h => {
    // Thought bubble
    h.lineWidth = 5; h.strokeStyle = C.ink; h.fillStyle = C.white;
    h.beginPath(); for (let i = 0; i < 12; i++) { const a = i * TAU / 12; h.arc(Math.cos(a) * 190, Math.sin(a) * 120, 52, a - 1.2, a + 1.2); } h.closePath(); h.fill(); h.stroke();
    h.beginPath(); h.arc(-150, 170, 22, 0, TAU); h.fill(); h.stroke(); h.beginPath(); h.arc(-185, 210, 12, 0, TAU); h.fill(); h.stroke();
    // Dumpling
    h.beginPath(); h.moveTo(-70, 40); h.quadraticCurveTo(0, -60, 70, 40); h.quadraticCurveTo(0, 62, -70, 40); h.closePath(); h.fillStyle = C.cream; h.fill(); h.stroke();
    h.lineWidth = 3; for (let i = -2; i <= 2; i++) { h.beginPath(); h.moveTo(i * 18, -6 + Math.abs(i) * 8); h.lineTo(i * 20, 10 + Math.abs(i) * 6); h.stroke(); }
    // Pair of chopsticks: open and close
    const cl = 0.5 + 0.5 * Math.sin(lt * 5);
    for (const d of [-1, 1]) { h.save(); h.translate(120, -110); h.rotate(0.95 + d * (0.08 + 0.1 * cl)); h.fillStyle = '#C98B4F'; h.lineWidth = 4; h.fill(L.rrp(-8, 0, 16, 210, 6)); h.stroke(L.rrp(-8, 0, 16, 210, 6)); h.restore(); }
  });
  const kw = L.popK(lt, Qv.kz, 0.4, 2.4) * (1 - out);
  if (kw > 0) L.at(g, 860, 560, kw, h => L.kw(h, '像筷子一样', 0, 0, { size: 46, fill: C.yel, col: C.ink }));
}
function pageB(g, lt) {
  const Qv = q();
  // Highlight: push toward the tower arms as the booster descends; the catch fills the screen
  const zk = MO.cubicInOut(clamp((lt - (Qv.ycj - 0.15)) / 0.8)), cx = TX - 15 * TPX * TSX, cy = GY - ARMY * TPX, z = 1 + 0.55 * zk;
  g.save(); L.cam(g, z, cx, cy, 0, -140 * zk);   // Shift everything up during the push so the booster base avoids subtitles
  ground(g, 0);
  const len = 30 * MO.backOut(clamp((lt - Qv.sc) / (Qv.jxb - Qv.sc + 0.1)), 1.4), cT = Qv.jz - 0.05, open = lt < cT ? 1 : 1 - MO.backOut(clamp((lt - cT) / 0.18), 2.5);
  const kt = L.popK(lt, Qv.y24 + 0.2, 0.5, 1.6);
  // Booster: descends to meet the catch beat
  const tA = Qv.ycj - 0.1, ybase = 8.6, u = clamp((lt - tA) / (cT - tA)), e = 1 - Math.pow(1 - u, 2.4);
  // Booster starts hovering high (small, firing), then descends at in one attempt: tower page is never empty
  const tH = Qv.y24 + 0.6, alt = lt < tA ? lerp(150, 132, clamp((lt - tH) / (tA - tH))) : lerp(132, ybase, e);
  const bx = TX - 15 * TPX * TSX, by = GY - alt * TPX + (lt > cT ? MO.settle(lt - cT, 10, 3, 7) : 0);
  if (lt > tH) L.rocket(g, RK.superHeavy({ fins: 1 }), bx, by, TPX, { sx: TSX, pal: L.SS_PAL, flame: lt < cT + 0.1 ? (lt < tA ? 0.6 : 1) : 0, lt, lw: 4.5 });
  g.save(); g.beginPath(); g.rect(0, GY - 146 * TPX * kt, 1920, 1080); g.clip();
  if (kt > 0) L.rocket(g, RK.tower({ armY: ARMY, open, len: Math.max(0.01, len) }), TX, GY, TPX * kt, { sx: TSX, pal: { body: C.steelD, truss: C.tile, dark: C.red }, lw: 4.5 });
  g.restore();
  if (lt > Qv.fst - 0.1 && len <= 1) L.at(g, TX + 150, GY - 560, L.popK(lt, Qv.fst - 0.1, 0.4, 2.2), h => L.kw(h, '发射塔', 0, 0, { size: 40, fill: C.white, col: C.ink }));
  if (len > 1 && lt < Qv.ycj - 0.15) L.at(g, TX + 160, GY - 520, L.popK(lt, Qv.sc + 0.2, 0.4, 2.2), h => L.kw(h, '两只机械臂', 0, 0, { size: 38, fill: C.white, col: C.ink }));
  L.burstLines(g, bx, GY - ARMY * TPX, 140, 230, clamp((lt - cT) / 0.5), { n: 12, col: C.ink, lw: 7 });
  g.restore();
  L.burstLines(g, cx, cy - 140 * zk, 260, 420, clamp((lt - cT - 0.04) / 0.55), { n: 16, col: C.yel, lw: 10 });
  const kj = L.popK(lt, cT + 0.05, 0.4, 2.8);
  if (kj > 0) L.at(g, 1000, 780, kj, h => L.kw(h, '一次就夹住了！', 0, 0, { size: 70, fill: C.green }), -0.04);
  const ky = lt < cT ? L.popK(lt, Qv.ycj - 0.05, 0.38, 2.4) : 0;
  if (ky > 0) L.at(g, 1000, 760, ky, h => L.kw(h, '一次就……', 0, 0, { size: 50, fill: C.white, col: C.ink }));
}

SCENES[ID] = {
  init() { U.assertGlyphs('PuHui-Heavy', '猎鹰1号猎鹰9号星舰史上最大最强四分钟左右炸了！2023年首飞2024年10月两只机械臂像筷子一样一次就夹住了！……发射塔', ID); },
  draw(c, lt) {
    L.CUR_T = L.T0(ID) + lt;
    const Qv = q();
    L.bg(c, lt, { seed: 2620 });
    const sw = MO.cubicInOut(clamp((lt - (Qv.y24 - 0.15)) / 0.5));   // Hold one beat after the explosion before turning the page
    // Shake the whole page on explosion
    const sh = lt > Qv.zl && lt < Qv.zl + 0.5 ? 14 * (1 - (lt - Qv.zl) / 0.5) * Math.sin(lt * 80) : 0;
    if (sw < 1) { c.save(); c.globalAlpha = Math.max(0, 1 - 2 * sw); c.translate(sh, -1080 * sw + sh * 0.6); pageA(c, lt); c.restore(); }
    if (sw > 0) { c.save(); c.translate(0, 1080 * (1 - sw)); pageB(c, lt); chopsticks(c, lt); c.restore(); }
    if (lt < Qv.y23 - 0.1) L.pageTitle(c, lt, '星舰', Qv.xj - 0.1, { col: C.blue, size: 46 }); else if (lt < Qv.y24 - 0.1) L.pageTitle(c, lt, '2023年 首飞', Qv.y23 - 0.1, { col: C.red, size: 44 });
    else L.pageTitle(c, lt, '2024年10月', Qv.y24 - 0.1, { col: C.red, size: 44 });
  },
};
ERAS.find(e => e.id === ID).transition = { type: 'lin_flip', dur: 0.6 };
L.FRONT[ID] = (c, lt) => { const Qv = q(); L.confetti(c, TX - 15 * TPX * TSX, GY - ARMY * TPX - 140, lt - Qv.jz, { n: 56, seed: 41, spread: 900, up: 800, life: 1.8 }); };
L.cast(ID, [
  { t: 0.05, pose: 'lookup', fr: 'talk', x: 560, s: 0.66, walk: 0.75 },          // Walk up to the rockets and look up
  { t: TM.cue(ID, '2023年') - 0.3, pose: 'stick', fr: 'talk', x: 330, walk: 0.55 },
  { t: TM.cue(ID, '炸了') - 0.02, pose: 'sad', fr: 1 },
  { t: TM.cue(ID, '2024年10月') - 0.1, pose: 'present', fr: 'talk' },
  { t: TM.cue(ID, '筷子') - 0.2, pose: 'think', fr: 'talk' },
  { t: TM.cue(ID, '一次就') - 0.05, pose: 'nervous', fr: 'talk' },
  { t: TM.cue(ID, '夹住了') - 0.05, pose: 'cheer', fr: 'bounce' },
]);
L.hudHide(ID, TM.cue(ID, '2024年10月') + 0.5, TM.dur(ID) + 0.3);   // Catch highlight: clear the header
L.push(ID, TM.end(ID, '夹住了') + 0.15, TM.dur(ID) + 0.1, 1.4, 330, 908, true);   // Hard cut to presenter cheering close-up after the catch
L.bustCard(ID, TM.cue(ID, '炸了') + 0.45, TM.cue(ID, '2024年10月') - 0.05, [[TM.cue(ID, '炸了') + 0.45, 2], [TM.cue(ID, '炸了') + 0.9, 3]]);   // Post-explosion pause: large face close-up, surprise then a rueful smile
L.hudHide(ID, TM.cue(ID, '炸了') - 0.1, TM.cue(ID, '2024年10月') + 0.4);
L.year(ID, [[TM.cue(ID, '2023年'), 2023], [TM.cue(ID, '2024年10月'), 2024]]);
})();
