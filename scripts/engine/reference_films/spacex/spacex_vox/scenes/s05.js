// S05 · First stage returns: tracing paper covers halftone landing-site photo; red pen draws up–turn–return looping arrow,
// Small paper-cut rocket follows line in steps (explanation); push toward landing circle: large paper-cut first stage descends upright with paper flame, legs deploy, smoke appears (second film highlight);
// First-ever index card circled red; 2017 — same sooty stage flies again, out of photo's top edge.
(() => {
const ID = 's05', V = VOX, C = V.C, F = V.F, PH = V.PH, TAU = Math.PI * 2;
const { clamp, lerp } = U, seg = MO.seg, step = V.step;
const cell = V.cell(ID), X0 = cell.x, Y0 = cell.y, xy = (x, y) => ({ x: X0 + x, y: Y0 + y });
const cue = k => TM.cue(ID, k), G = k => V.cue(ID, k), t0 = V.t0(ID);
const T = { y15: '2015.12', first: '轨道火箭着陆', first2: '头一回', d15: '2015.12', y17: '2017', re: '复飞', up: '分离', back: '飞回来', f9: '猎鹰9号 · 一级' };

// ---------- Landing-site photo and tracing paper ----------
const PW = 1400, PHh = 820, PC = xy(1120, 1010);
const zoneDraw = (g, w, h) => {
  PH.sky(g, w, h, '#3a3a3a', '#d8d8d8');
  const gy = h * 0.6; const gr = g.createLinearGradient(0, gy, 0, h); gr.addColorStop(0, '#7a7a7a'); gr.addColorStop(1, '#262626'); g.fillStyle = gr; g.fillRect(0, gy, w, h - gy);
  g.fillStyle = '#5c5c5c'; g.fillRect(w * 0.06, gy - 120, 14, 120); g.fillRect(w * 0.06 + 40, gy - 90, 10, 90);   // Distant launch tower
  PH.smoke(g, w * 0.2, gy + 6, 40, 5, 3, 'rgba(230,230,230,.6)');
  g.strokeStyle = '#e4e4e4'; g.lineWidth = 9; g.beginPath(); g.ellipse(w * 0.77, h * 0.8, 170, 46, 0, 0, TAU); g.stroke();   // Landing circle
  g.lineWidth = 4; g.beginPath(); g.ellipse(w * 0.77, h * 0.8, 110, 29, 0, 0, TAU); g.stroke();
};
const PAD = [PW * 0.27, PHh * 0.3];                             // Landing-circle center (photo-centered coordinates)
V.item({ key: 's05zone', ...PC, r: -0.012, z: 10, at: t0 - 1, draw(g) { V.blit(g, V.photo('s05zone', PW, PHh, zoneDraw, { cell: 7, border: 18 })); V.tape(g, -PW / 2 + 40, -PHh / 2 - 4, -0.5, 140); V.tape(g, PW / 2 - 40, -PHh / 2 - 4, 0.5, 140); } });
// Tracing paper: translucent, red looping arrow and two small labels
const TP = { w: 1200, h: 700 };
const PATH = (() => { const L = [-PW * 0.36, PHh * 0.08], A = [-PW * 0.02, -PHh * 0.36], P = [PAD[0], PAD[1] - 30], o = [];
  for (let i = 0; i <= 40; i++) { const u = i / 40, v = 1 - u; o.push([v * v * L[0] + 2 * v * u * (L[0] + 40) + u * u * A[0], v * v * L[1] + 2 * v * u * (-PHh * 0.42) + u * u * A[1]]); }
  for (let i = 1; i <= 50; i++) { const u = i / 50, v = 1 - u; o.push([v * v * A[0] + 2 * v * u * (PAD[0] + 60) + u * u * P[0], v * v * A[1] + 2 * v * u * (-PHh * 0.42) + u * u * P[1]]); }
  return o; })();
const HP = V.handPts('s05path', PATH, { amp: 2.4, seed: 4 });
const tDraw = [G('想把') - 0.05, G('重复') + 0.1];
V.item({ key: 's05trace', ...PC, r: 0.008, z: 14, at: G('接着') - 0.1, enter: { from: [520, -60], tilt: 0.1, dur: 0.45 }, draw(g, T_) {
  g.save(); g.translate(-TP.w / 2, -TP.h / 2 + 20); g.fillStyle = 'rgba(246,246,240,.38)'; CL.tornRect(g, TP.w, TP.h, 63, 4); g.fill(); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; g.stroke(); g.restore();
  V.tape(g, -TP.w / 2 + 20, -TP.h / 2 + 30, -0.6, 110); V.tape(g, TP.w / 2 - 20, -TP.h / 2 + 30, 0.6, 110);
  const st = step(T_), q = MO.sineInOut(seg(st, tDraw[0], tDraw[1]));
  g.save(); g.setLineDash([26, 18]); V.pen(g, HP, q, { lw: 9 }); g.restore();
  if (q >= 1) { const n = HP.p[HP.p.length - 1], m = HP.p[HP.p.length - 6], a = Math.atan2(n[1] - m[1], n[0] - m[0]); g.save(); g.translate(n[0], n[1]); g.rotate(a); g.strokeStyle = C.red; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(-34, -22); g.lineTo(0, 0); g.lineTo(-34, 22); g.stroke(); g.restore(); }
  const lab = (s, x, y, t) => { if (st < t) return; g.save(); g.translate(x, y); g.rotate(-0.03); g.fillStyle = C.card; g.font = V.font(44, F.heavy); const w = g.measureText(s).width + 36; g.fillRect(-w / 2, -34, w, 68); V.text(g, s, 0, 16, 44, F.heavy, C.ink, 'center'); g.restore(); };
  lab(T.up, -PW * 0.02, -PHh * 0.36 - 64, tDraw[0] + 0.75); lab(T.back, PW * 0.19, -PHh * 0.47, G('飞回') + 0.05);
} });
// ---------- Paper-cut first stage ----------
const booster = (legs, soot) => V.cutout('s05b' + legs + soot, 96, 420, (g, w, h) => {
  RK.at(g, w / 2, h - 34, 9.2, 0, q => V.shadeFill(q, RK.falcon9({ stage: 'booster', legs, fins: 1 }), { ...V.GREY, body: soot ? '#bdbdbd' : '#efefef' }));
  if (soot) { g.save(); g.globalCompositeOperation = 'source-atop'; const gr = g.createLinearGradient(0, h, 0, h * 0.25); gr.addColorStop(0, 'rgba(30,30,30,.75)'); gr.addColorStop(1, 'rgba(30,30,30,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.restore(); }
}, { cell: 4, edge: 6 });
// Paper flame: fluorescent yellow paper with red core (two alternating 12fps frames)
const paperFlame = (g, x, y, len, w, st, k = 0) => {
  const f = (Math.floor(st * 12) + k) % 2 ? 1 : 0.86;
  g.save(); g.translate(x, y); g.shadowColor = 'rgba(50,40,25,.25)'; g.shadowBlur = 6; g.shadowOffsetY = 4;
  const sh = (sc, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(-w * sc / 2, 0); g.lineTo(-w * sc * 0.3, len * sc * f * 0.5); g.lineTo(-w * 0.08, len * sc * f * 0.8); g.lineTo(0, len * sc * f); g.lineTo(w * 0.1, len * sc * f * 0.78); g.lineTo(w * sc * 0.32, len * sc * f * 0.45); g.lineTo(w * sc / 2, 0); g.closePath(); g.fill(); };
  sh(1, '#e9d84a'); g.shadowColor = 'transparent'; sh(0.55, C.red); g.restore();
};
// Small paper-cut rocket follows looping line once (explanation)
const tok = [tDraw[0] + 0.1, tDraw[1] + 0.05];
const along = (q) => { const L = HP.L[HP.L.length - 1], d = L * q, p = DG.pointAt(HP.p, HP.L, d), p2 = DG.pointAt(HP.p, HP.L, Math.min(L, d + 6)); return { p, a: Math.atan2(p2[1] - p[1], p2[0] - p[0]) }; };
V.item({ key: 's05tok', ...PC, r: 0.008, z: 15, at: tok[0], until: G('2015') + 0.3, draw(g, T_) {
  const st = step(T_), q = MO.sineInOut(seg(st, tok[0], tok[1])), { p, a } = along(q); if (q > 0.86) return;   // Remove schematic rocket above landing circle: perform actual vertical landing only once, in the close shot
  const up = q < 0.45, rot = up ? a + Math.PI / 2 : a - Math.PI / 2;           // Nose-first on ascent; turn tail-first after apex (turnaround)
  g.save(); g.translate(p[0], p[1]); g.rotate(rot); g.scale(0.6, 0.6); V.blit(g, booster(0, 0)); if (up) paperFlame(g, 0, 190, 120, 40, st); g.restore();
} });
// Large paper-cut first stage: upright descent into landing circle
const tLand = G('落回'), tDesc = G('2015') + 0.1, tLift = G('又一次') - 0.1;
const LAND = [PC.x + PAD[0], PC.y + PAD[1] - 180];
V.item({ key: 's05big', x: LAND[0], y: LAND[1], z: 16, rad: 1400, at: tDesc, draw(g, T_) {
  const st = step(T_);
  let y = 0, legs = 0, soot = st >= G('2017') ? 1 : 0, fl = 0;
  if (st < tLand) { const q = clamp((st - tDesc) / (tLand - tDesc)); y = -900 * Math.pow(1 - q, 1.6); legs = clamp((st - (tLand - 0.6)) / 0.35); fl = 1; }
  else if (st < tLift) { y = MO.settle(st - tLand, 6, 3, 7); legs = 1; }
  else { const q = (st - tLift); y = -Math.pow(q, 2) * 520 - q * 60; legs = clamp(1 - q / 0.35); fl = 2; }
  g.save(); g.translate(0, y);
  if (fl) { const qd = fl === 1 ? clamp((st - tDesc) / (tLand - tDesc)) : 0; paperFlame(g, 0, 196, fl === 2 ? 260 : 150 * (1 - 0.7 * qd * qd), fl === 2 ? 70 : 44, st); }
  V.blit(g, booster(legs > 0.5 ? 1 : 0, soot)); g.restore();
  // Landing smoke (halftone cutouts expanding on twos)
  const pq = clamp((st - tLand) / 0.5), pq2 = st >= tLift ? clamp((st - tLift) / 0.5) : 0, pv = Math.max(pq * (1 - clamp((st - tLand - 1.6) / 0.6)), pq2);
  if (pv > 0) { const sp = V.cutout('s05puff', 520, 190, (q) => { PH.smoke(q, 260, 110, 120, 12, 9, '#dcdcdc'); PH.smoke(q, 250, 90, 80, 8, 19, '#f6f6f6'); }, { cell: 4, edge: 0, contrast: 1.1 }); g.save(); g.translate(0, 205); const s = 0.4 + 0.6 * MO.quartOut(pv); g.scale(s, s); g.globalAlpha = Math.min(1, pv * 1.4); V.blit(g, sp); g.restore(); }
} });
// Labels and index cards
V.item({ key: 's05y15', ...xy(600, 690), r: -0.03, z: 17, at: G('2015') - 0.05, until: G('2017') - 0.05, enter: { from: [-300, -80], tilt: -0.16, dur: 0.4 }, draw(g, T_) { V.label(g, T.y15, 76, { fam: F.num, n: V.nTyped(T_, G('2015'), 12) }); } });
V.item({ key: 's05f9', ...xy(1820, 1080), r: 0.03, z: 17, at: G('猎鹰') - 0.1, enter: { drop: 0.25, dur: 0.25 }, draw(g, T_) { V.label(g, T.f9, 46, { n: V.nTyped(T_, G('猎鹰'), 14) }); } });
const FC = V.circle('s05first', 150, 62, 21);
V.item({ key: 's05card', ...xy(1560, 1365), r: -0.035, z: 18, at: G('轨道火箭') - 0.15, enter: { from: [300, 300], tilt: 0.14, dur: 0.4 }, draw(g, T_) {
  V.blit(g, V.spr('s05card', 560, 230, (gg, w, h) => V.indexCard(gg, w, h, { top: 50, gap: 46 })));
  const st = step(T_), n = V.nTyped(T_, G('轨道火箭'), 14);
  V.typed(g, T.first, -240, -12, n, 56, F.heavy, C.ink); V.typed(g, T.first2, -240 + 250, 70, n - 6, 72, F.heavy, C.red); if (n > 0) V.text(g, T.d15, 250, -80, 26, F.type, C.ink2, 'right');
  g.save(); g.translate(-240 + 250 + 108, 46); V.pen(g, FC, MO.cubicOut(seg(st, G('头一回') + 0.1, G('头一回') + 0.6)), { lw: 7 }); g.restore();
} });
const SAME = V.handPts('s05same', [[-250, -40], [-150, 10], [-60, 60]], { amp: 1.4, seed: 2 });
V.item({ key: 's05same', x: LAND[0], y: LAND[1], z: 20, rad: 900, at: G('回收') - 0.05, until: G('飞上') + 0.4, draw(g, T_) {   // Recovered first stage: red arrow points at the stage just landed — the same one
  const st = step(T_); g.save(); g.translate(-60, -40); V.pen(g, SAME, MO.cubicOut(seg(st, G('回收'), G('回收') + 0.35)), { lw: 8 }); g.restore();
  g.save(); g.translate(-420, -110); g.rotate(-0.05); V.label(g, '同一枚一级', 50, { bg: C.red2, n: V.nTyped(T_, G('回收'), 12) }); g.restore();
} });
V.item({ key: 's05y17', ...xy(560, 700), r: 0.025, z: 19, at: G('2017') - 0.05, enter: { drop: 0.3, dur: 0.25 }, draw(g, T_) { g.save(); V.label(g, T.y17, 80, { fam: F.num, n: V.nTyped(T_, G('2017'), 12) }); g.translate(230, 20); g.rotate(0.05); V.label(g, T.re, 60, { bg: C.red2, n: V.nTyped(T_, G('回收'), 8) }); g.restore(); } });

// ---------- Camera: hard-cut in (wide) → push toward landing circle → pull out → track reflight upward ----------
const at = (x, y, z, sy) => V.at(X0 + x, Y0 + y, z, sy);
const LX = LAND[0] - X0, LY = LAND[1] - Y0;
const cam = (lt) => CAM.at([
  V.key(0, at(1130, 940, 1.0)),
  V.key(cue('2015') - 0.1, at(1110, 930, 1.04), MO.sineInOut),
  V.key(cue('猎鹰') + 0.1, at(LX - 40, LY + 40, 1.55), MO.sineInOut),     // Push toward landing circle
  V.key(cue('落回') + 0.2, at(LX - 30, LY + 60, 1.68), MO.sineInOut),
  V.key(cue('轨道火箭') + 0.1, at(LX - 120, LY + 160, 1.2), MO.cubicInOut),
  V.key(cue('2017') - 0.1, at(LX - 140, LY + 150, 1.24), MO.sineInOut),
  V.key(cue('2017') + 0.5, at(LX - 360, LY - 16, 0.92), MO.cubicInOut),
  V.key(cue('飞上'), at(LX - 330, LY - 40, 0.95), MO.sineInOut),
  V.key(TM.dur(ID), at(LX - 260, LY - 380, 1.0), MO.cubicIn),
], lt);
V.scene(ID, { cam, init() { V.glyphs(ID, [[F.heavy, '同一枚一级' + T.first + T.first2 + T.re + T.up + T.back + T.f9], [F.num, T.y15 + T.y17], [F.type, T.d15]]); } });
})();
