// S10 · Starship (both strongest film highlights in this cell).
// ① Height measurement: three true-scale paper-cut rockets beside vertical paper ruler — Falcon 1, Falcon 9, then Starship slides to ruler top; red bracket marks largest / most powerful;
// ② Hard-cut to 2023 maiden-flight halftone photo → at exploded, photo tears in half and halftone explosion bursts through the tear (hold one beat);
// ③ Paper-puppet tower: two mechanical arms fixed with split-pin brads, opening in steps; adjacent halftone photo of real chopsticks (like chopsticks);
//   Paper-cut booster descends trailing paper flame; arms close and catch it, red circle and caught label (film highlight, hold to segment end).
(() => {
const ID = 's10', V = VOX, C = V.C, F = V.F, PH = V.PH, TAU = Math.PI * 2;
const { clamp, lerp } = U, seg = MO.seg, step = V.step;
const cell = V.cell(ID), X0 = cell.x, Y0 = cell.y, xy = (x, y) => ({ x: X0 + x, y: Y0 + y });
const cue = k => TM.cue(ID, k), G = k => V.cue(ID, k), t0 = V.t0(ID);
const T = { f1: '猎鹰1号', f9: '猎鹰9号', ss: '星舰', big: '最大、最强', y23: '2023 · 首飞', boom: '约4分钟', y24: '2024.10', chop: '筷子', got: '夹住了', arms: '机械臂' };

// ① Height measurement (6.6 px/m)
// Two backings: height group pinned to aged parchment, tower group to black cardstock (avoids a large empty desk)
V.item({ key: 's10bg1', ...xy(640, 1230), r: -0.012, z: 5, at: t0 - 1, draw(g) { V.blit(g, V.spr('s10bg1', 1300, 1180, (gg, w, h) => V.paper(gg, w, h, 91, { col: '#d9cba9', amp: 6, age: 0.3 }), { sh: { blur: 14, y: 8 } })); V.tape(g, -600, -560, -0.6, 150); V.tape(g, 600, -560, 0.55, 150); } });
V.item({ key: 's10bg2', ...xy(1930, 1170), r: 0.01, z: 5, at: t0 - 1, draw(g) { V.blit(g, V.spr('s10bg2', 640, 1160, (gg, w, h) => V.blackCard(gg, w, h, 93), { sh: { blur: 12, y: 6 } })); } });
const PX = 6.6, GB = xy(640, 1560);                             // Ground line (beneath cutouts)
const cut = (key, shape, w, h, pal = V.GREY) => V.cutout('s10' + key, w, h, (g, ww, hh) => RK.at(g, ww / 2, hh - 6, PX, 0, q => V.shadeFill(q, shape, pal)), { cell: 4, edge: 6 });
const SHAPES = { f1: [RK.falcon1(), 30, 160], f9: [RK.falcon9({ payload: 'fairing' }), 44, 560], ss: [RK.starship({ fins: 1 }), 120, 830] };
const RXS = { f1: -250, f9: -60, ss: 230 };
const rulerS = () => V.spr('s10ruler', 90, 900, (g, w, h) => { V.paper(g, w, h, 71, { col: '#ece3c8', torn: false, age: 0.2 }); g.fillStyle = C.ink; for (let m = 0; m <= 130; m += 10) { const y = h - 12 - m * PX; g.fillRect(w - 34, y - 1.5, 34, 3); if (m % 50 === 0) V.text(g, String(m), 8, y + 10, 26, F.type, C.ink); } for (let m = 0; m <= 130; m += 5) { const y = h - 12 - m * PX; g.fillRect(w - 16, y - 1, 16, 2); } V.text(g, 'm', 10, 30, 26, F.type, C.ink2); });
V.item({ key: 's10ruler', x: GB.x - 470, y: GB.y - 438, r: 0, z: 10, at: t0 - 1, draw(g) { V.blit(g, rulerS()); } });
for (const k of ['f1', 'f9', 'ss']) {
  const [sh, w, h] = SHAPES[k], ent = k === 'ss';
  V.item({ key: 's10' + k, x: GB.x + RXS[k], y: GB.y - h / 2 - 6, r: 0, z: 11, at: ent ? G('星舰') - 0.2 : t0 - 1, enter: ent ? { from: [0, -900], tilt: 0.06, dur: 0.35 } : null, draw(g, T_) {
    V.blit(g, cut(k, sh, w + 12, h + 12));
    g.save(); g.translate(0, h / 2 + 44); g.rotate(0.02); g.font = V.font(40, F.heavy); const lw = g.measureText(T[k]).width + 30; g.fillStyle = k === 'ss' ? C.black : C.card; g.fillRect(-lw / 2, -30, lw, 60); V.text(g, T[k], 0, 14, 40, F.heavy, k === 'ss' ? C.paper : C.ink, 'center'); g.restore();
  } });
}
const BRK = V.handPts('s10brk', [[0, 0], [30, 0], [30, 830], [0, 830]], { amp: 1.5, seed: 6 });
V.item({ key: 's10brk', x: GB.x + RXS.ss + 90, y: GB.y - 840, z: 12, rad: 1000, at: G('最大') - 0.1, until: G('2023') - 0.32, draw(g, T_) {
  const st = step(T_); V.pen(g, BRK, MO.cubicOut(seg(st, G('最大'), G('最大') + 0.4)), { lw: 7 });
  if (st >= G('最强') - 0.05) { g.save(); g.translate(150, 300); g.rotate(-0.04); V.label(g, T.big, 56, { bg: C.red2, n: V.nTyped(T_, G('最强') - 0.05, 12) }); g.restore(); }
} });

// ② 2023 maiden flight: photo tears open
const PW = 540, PHh = 680, P = xy(1280, 900);
const launchSS = (g, w, h) => { PH.sky(g, w, h, '#4a4a4a', '#cfcfcf'); PH.smoke(g, w * 0.5, h * 1.02, 180, 18, 13, '#f0f0f0', 1.6); PH.plume(g, [[w * 0.5, h], [w * 0.5, h * 0.66]], 40, 80, 9, '#ececec'); PH.glow(g, w * 0.5, h * 0.63, 160, 1); PH.flame(g, w * 0.5, h * 0.6, 200, 58); PH.rocket(g, RK.starship({ fins: 1 }), w * 0.5, h * 0.6, h / 175); };
const TEAR = (() => { const r = U.rng(5), o = []; for (let i = 0; i <= 26; i++) o.push([(r() - 0.5) * 50 + (i % 2 ? 14 : -14), -PHh / 2 - 20 + i * (PHh + 40) / 26]); return o; })();
const tBoom = G('炸了') - 0.05;
const burst = () => V.cutout('s10boom', 520, 480, (g, w, h) => { PH.glow(g, w / 2, h / 2, 240, 1); PH.smoke(g, w / 2, h / 2, 160, 16, 23, '#bdbdbd', 1.1); PH.smoke(g, w / 2, h / 2, 100, 10, 29, '#ffffff'); }, { cell: 5, edge: 0, contrast: 1.4 });
V.item({ key: 's10photo', ...P, r: -0.02, z: 13, at: G('2023') - 0.3, draw(g, T_) {
  const st = step(T_), sp = V.photo('s10ss', PW, PHh, launchSS, { cell: 6, border: 16 }), q = MO.quartOut(clamp((st - tBoom) / 0.35));
  const half = (s) => { g.save(); g.translate(s * 46 * q, s * 8 * q); g.rotate(s * 0.07 * q); g.beginPath(); g.moveTo(s * 400, -PHh); TEAR.forEach(p => g.lineTo(p[0], p[1])); g.lineTo(s * 400, PHh); g.closePath(); g.clip(); V.blit(g, sp); if (q > 0) { g.strokeStyle = '#f4f2ec'; g.lineWidth = 8; g.beginPath(); TEAR.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); } g.restore(); };
  half(-1); half(1);
  if (st >= tBoom) { const k = 0.6 + 0.5 * MO.backOut(clamp((st - tBoom) / 0.3), 2.2); g.save(); g.translate(0, -60); g.scale(k, k); V.blit(g, burst()); g.restore(); }
  g.save(); g.translate(-PW / 2 + 120, PHh / 2 - 40); g.rotate(-0.04); V.label(g, T.y23, 56, { n: V.nTyped(T_, G('2023'), 12) }); g.restore();
  if (st >= G('四分钟')) { g.save(); g.translate(PW / 2 - 60, -PHh / 2 + 70); g.rotate(0.05); V.label(g, T.boom, 54, { bg: C.red2, n: V.nTyped(T_, G('四分钟'), 10) }); g.restore(); }
} });

// ③ Paper-puppet tower, chopsticks photo, booster
const TB = xy(2050, 1640), TS = 5.6, ARM = 31, ARMY = 70;      // Tower base, px/m, arm length (m), arm height (m)
const towerS = () => V.cutout('s10tower', 12 * TS + 20, 146 * TS + 10, (g, w, h) => {
  g.fillStyle = '#5e5e5c'; g.fillRect(10, 0, 12 * TS, 146 * TS);
  g.strokeStyle = '#2c2c2b'; g.lineWidth = 3; for (let y = 0; y < 146 * TS; y += 8 * TS) { g.beginPath(); g.moveTo(10, y); g.lineTo(10 + 12 * TS, y + 8 * TS); g.moveTo(10 + 12 * TS, y); g.lineTo(10, y + 8 * TS); g.stroke(); }
  g.strokeRect(10, 0, 12 * TS, 146 * TS);
}, { ht: false, edge: 6 });
const armS = () => V.cutout('s10arm', ARM * TS + 30, 26, (g, w, h) => { g.fillStyle = '#3d3d3b'; g.beginPath(); g.moveTo(0, 4); g.lineTo(w - 10, 2); g.lineTo(w, 13); g.lineTo(w - 10, 24); g.lineTo(0, 22); g.closePath(); g.fill(); g.fillStyle = '#6a6a68'; for (let x = 16; x < w - 20; x += 22) g.fillRect(x, 9, 12, 8); }, { ht: false, edge: 5 });
const shS = () => V.cutout('s10sh', 9 * TS + 70, 71 * TS + 20, (g, w, h) => { RK.at(g, w / 2, h - 10, TS, 0, q => V.shadeFill(q, RK.superHeavy({ fins: 1 }), V.GREY)); g.fillStyle = '#2a2a2a'; const ty = h - 10 - 71 * TS + 3.4 * TS; for (const s of [-1, 1]) { const x = w / 2 + s * (4.5 * TS + 4); g.fillRect(s < 0 ? x - 26 : x, ty, 26, 20); g.fillStyle = '#5a5a5a'; for (let k = 1; k < 4; k++) g.fillRect((s < 0 ? x - 26 : x) + k * 6.5, ty, 1.5, 20); g.fillStyle = '#2a2a2a'; } }, { cell: 4, edge: 6 });   // Add two clearly visible grid fins at top
const brad = (g, x, y) => { g.save(); g.translate(x, y); const gr = g.createRadialGradient(-4, -4, 1, 0, 0, 14); gr.addColorStop(0, '#f3dd9a'); gr.addColorStop(1, '#9c7a2e'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 13, 0, TAU); g.fill(); g.restore(); };
const tOpen = [G('伸出') - 0.05, G('机械臂') + 0.2], tDesc = [G('一次') - 0.1, G('夹住') - 0.04], tClose = [G('夹住') - 0.04, G('夹住') + 0.2];
const pivot = [TB.x - 10, TB.y - ARMY * TS];
V.item({ key: 's10tower', x: TB.x + 6 * TS, y: TB.y - 73 * TS, z: 11, rad: 1100, at: t0 - 1, draw(g) { V.blit(g, towerS()); } });
V.item({ key: 's10catch', x: pivot[0], y: pivot[1], z: 14, rad: 1100, at: t0 - 1, draw(g, T_) {
  const st = step(T_), op = MO.quartOut(seg(st, tOpen[0], tOpen[1])), cl = MO.backOut(seg(st, tClose[0], tClose[1]), 1.6), a = 0.62 * op * (1 - cl) + 0.07 * (1 - cl) * 0;
  // Booster (behind arms): descends → gently sways with arms after catch
  const bx = -ARM * TS * 0.74, catchY = 71 * TS / 2 - 7.6 * TS, dq = clamp((st - tDesc[0]) / (tDesc[1] - tDesc[0]));
  if (st >= tDesc[0]) { const y = st < tDesc[1] ? catchY - 900 * Math.pow(1 - dq, 1.5) : catchY + MO.settle(st - tDesc[1], 7, 3, 6);
    g.save(); g.translate(bx, y); if (st < tDesc[1]) { g.fillStyle = '#e9d84a'; g.beginPath(); g.moveTo(-36, 71 * TS / 2); g.lineTo(0, 71 * TS / 2 + 160 * (1 - dq * 0.7) * ((Math.floor(st * 12) % 2) ? 1 : 0.85)); g.lineTo(36, 71 * TS / 2); g.fill(); g.fillStyle = C.red; g.beginPath(); g.moveTo(-18, 71 * TS / 2); g.lineTo(0, 71 * TS / 2 + 80 * (1 - dq * 0.7)); g.lineTo(18, 71 * TS / 2); g.fill(); }
    V.blit(g, shS()); g.restore(); }
  for (const s of [-1, 1]) { g.save(); g.rotate(Math.PI + s * a); g.translate(0, s * 18); V.blit(g, armS(), (ARM * TS + 30) / 2 - 6, 0); g.restore(); }
  brad(g, 0, -18); brad(g, 0, 18);
  if (st >= tOpen[0] + 0.2 && st < G('一次')) { g.save(); g.translate(-ARM * TS * 0.55, -150); g.rotate(-0.03); V.label(g, T.arms, 44, { bg: C.card, col: C.ink, n: V.nTyped(T_, tOpen[0] + 0.2, 10) }); g.restore(); }
  const cc = V.circle('s10got', 150, 120, 17); g.save(); g.translate(bx, 0); V.pen(g, cc, MO.cubicOut(seg(st, tClose[1], tClose[1] + 0.5)), { lw: 9 }); g.restore();
  if (st >= G('住了') - 0.05) { g.save(); g.translate(bx - 300, 160); g.rotate(-0.06); const k = 1 + 0.3 * (1 - MO.quartOut(clamp(step(T_ - G('住了') + 0.05) / 0.25))); g.scale(k, k); V.label(g, T.got, 84, { bg: C.red2, padX: 30 }); g.restore(); }
} });
V.item({ key: 's10y24', ...xy(1960, 940), r: 0.03, z: 15, at: G('2024') - 0.05, enter: { drop: 0.25, dur: 0.25 }, draw(g, T_) { V.label(g, T.y24, 72, { fam: F.num, n: V.nTyped(T_, G('2024'), 10) }); } });
const chopDraw = (g, w, h) => {   // Pair of chopsticks diagonally on dark tablecloth (square ends, tapered tips, wood grain)
  PH.sky(g, w, h, '#3a3a3a', '#1c1c1c');
  for (const [o, a] of [[-16, -0.5], [16, -0.43]]) { g.save(); g.translate(w / 2 + o, h / 2 + o * 0.3); g.rotate(a);
    const gr = g.createLinearGradient(0, -8, 0, 8); gr.addColorStop(0, '#f4f4f4'); gr.addColorStop(1, '#a8a8a8'); g.fillStyle = gr;
    g.beginPath(); g.moveTo(-190, -9); g.lineTo(170, -3.5); g.lineTo(184, 0); g.lineTo(170, 3.5); g.lineTo(-190, 9); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(80,80,80,.5)'; g.lineWidth = 1.2; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(-180, k * 3); g.lineTo(120, k * 1.5); g.stroke(); } g.fillStyle = '#6a6a6a'; g.fillRect(-190, -9, 34, 18); g.restore(); }
};
V.item({ key: 's10chop', ...xy(1430, 1465), r: -0.05, z: 13, at: G('像筷子') - 0.05, enter: { from: [-380, 160], tilt: -0.2, dur: 0.4 }, draw(g, T_) {
  V.blit(g, V.photo('s10chop', 360, 250, chopDraw, { cell: 4, border: 11 })); V.tape(g, 0, -137, 0.05, 110);
  g.save(); g.translate(0, 170); g.rotate(0.03); V.label(g, T.chop, 50, { bg: C.card, col: C.ink, n: V.nTyped(T_, G('筷子'), 8) }); g.restore();
} });

// ---------- Camera ----------
const at = (x, y, z, sy) => V.at(X0 + x, Y0 + y, z, sy);
const cutB = cue('2023') - 0.02, moveC = cue('2024') - 0.15;
const PV = [pivot[0] - X0, pivot[1] - Y0];
const cam = (lt) => CAM.at([
  V.key(0, V.camEnd('s09')),
  V.key(0.5, at(780, 1150, 0.93), MO.longTail),
  V.key(cutB - 0.001, at(790, 1155, 0.97), MO.sineInOut),
  V.key(cutB, at(1280, 900, 1.06)),                                          // Hard cut: maiden-flight photo
  V.key(cue('炸了') - 0.05, at(1280, 890, 1.14), MO.sineInOut),
  V.key(cue('炸了') + 0.3, at(1280, 880, 1.02), MO.quartOut),                // Camera recoils on the tear
  V.key(moveC, at(1285, 885, 1.0), MO.sineInOut),
  V.key(moveC + 0.7, at(PV[0] - 260, PV[1] - 40, 0.92), MO.cubicInOut),
  V.key(cue('像筷子') - 0.1, at(PV[0] - 250, PV[1] - 30, 0.95), MO.sineInOut),
  V.key(cue('一次'), at(PV[0] - 330, PV[1] - 10, 0.9), MO.sineInOut),
  V.key(cue('夹住') + 0.1, at(PV[0] - 200, PV[1] + 20, 1.08), MO.sineInOut),
  V.key(TM.dur(ID), at(PV[0] - 190, PV[1] + 25, 1.16), MO.sineInOut),
], lt);
V.scene(ID, { cam, init() { V.glyphs(ID, [[F.heavy, T.f1 + T.f9 + T.ss + T.big + T.y23 + T.boom + T.chop + T.got + T.arms], [F.num, T.y24], [F.type, '050100m']]); } });
})();
