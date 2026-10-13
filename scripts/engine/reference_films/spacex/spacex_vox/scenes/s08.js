// S08 · Increasing launch frequency (fast pace: four cards, one idea each).
// ① Torn-paper strips form bar chart on graph paper (annual Falcon launches: 2017, 2022–2025; only years with authoritative sources); red 2025 strip grows to 165;
// ② Monthly calendar, red stroke every two-plus days — just over two days per launch; ③ paper-cut balance scale tips toward Falcon 9 — more than all other rockets combined;
// ④ Sooty paper-cut booster lies on index card, red tally strokes accumulate to 37.
(() => {
const ID = 's08', V = VOX, C = V.C, F = V.F, PH = V.PH, TAU = Math.PI * 2;
const { clamp, lerp } = U, seg = MO.seg, step = V.step;
const cell = V.cell(ID), X0 = cell.x, Y0 = cell.y, xy = (x, y) => ({ x: X0 + x, y: Y0 + y });
const cue = k => TM.cue(ID, k), G = k => V.cue(ID, k), t0 = V.t0(ID);
const T = { title: '猎鹰系列火箭年发射次数', unit: '次', src: '来源：SpaceNews、CBS、CNBC、Ars Technica', avg: '≈2.2天一发', month: '一个月', l: '猎鹰9号', r: '全世界其他公司', one: '一枚助推器', n37: '37次' };
const DATA = [['2017', 18], ['2022', 61], ['2023', 96], ['2024', 134], ['2025', 165]];

// ① Graph-paper bar chart
const CW = 1240, CH = 800, CP = xy(1480, 860), BASE = 300, KH = 3.25, BW = 140, bx = i => -CW / 2 + 190 + i * 205 + (i > 0 ? 40 : 0);
const graph = () => V.spr('s08graph', CW, CH, (g, w, h) => {
  g.fillStyle = '#f3f1e8'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(80,140,200,.22)'; g.lineWidth = 1; for (let x = 0; x < w; x += 20) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 20) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  g.strokeStyle = 'rgba(80,140,200,.4)'; g.lineWidth = 1.6; for (let x = 0; x < w; x += 100) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 100) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  V.text(g, T.title, 60, 84, 54, F.heavy, C.ink); V.text(g, T.src, 62, 122, 22, F.med, C.ink2);
  g.strokeStyle = C.ink; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(70, h / 2 + BASE); g.lineTo(w - 50, h / 2 + BASE); g.stroke();
  DATA.forEach(([y], i) => V.text(g, y, w / 2 + bx(i), h / 2 + BASE + 54, 40, F.type, i === 4 ? C.red : C.ink, 'center'));
  const zx = w / 2 + (bx(0) + bx(1)) / 2; g.lineWidth = 4; g.beginPath(); g.moveTo(zx - 16, h / 2 + BASE - 14); g.lineTo(zx - 4, h / 2 + BASE + 14); g.moveTo(zx + 4, h / 2 + BASE - 14); g.lineTo(zx + 16, h / 2 + BASE + 14); g.stroke();   // Break mark for nonconsecutive years
});
const strip = (key, hgt, col) => V.spr('s08bar' + key, BW, hgt, (g, w, h) => V.paper(g, w, h, 50 + hgt % 13, { col, amp: 3, age: 0.1 }), { pad: 16, sh: { blur: 6, x: 2, y: 4 } });
const tBar = [G('回收') + 0.05, G('越来越密') + 0.2], t165 = [G('2025') + 0.1, G('165') + 0.2];
V.item({ key: 's08chart', ...CP, r: -0.01, z: 10, at: t0 - 1, draw(g, T_) {
  V.blit(g, graph()); const st = step(T_);
  DATA.forEach(([y, v], i) => {
    const q = i < 4 ? MO.quartOut(seg(st, tBar[0] + i * 0.3, tBar[0] + i * 0.3 + 0.7)) : MO.cubicOut(seg(st, t165[0], t165[1])); if (q <= 0) return;
    const hh = v * KH, sp = strip(i, Math.round(hh), i === 4 ? '#c0574f' : '#2a2928'), vis = hh * q;
    g.save(); g.beginPath(); g.rect(bx(i) - BW, BASE - vis - 30, BW * 2, vis + 30); g.clip(); V.blit(g, sp, bx(i), BASE - hh / 2); g.restore();
    const shown = i < 4 ? (q >= 1 ? v : 0) : Math.round(v * q);
    if (shown) V.text(g, String(shown), bx(i), BASE - vis - 22, i === 4 ? 86 : 50, F.num, i === 4 ? C.red : C.ink, 'center');
  });
  if (st >= G('165') + 0.3) V.text(g, '全为猎鹰9号', bx(4), BASE + 100, 26, F.bold, C.red, 'center');
  const hq = MO.sineInOut(seg(st, G('165'), G('165') + 0.6)); if (hq > 0) { g.save(); g.translate(bx(4), BASE - 165 * KH - 22); V.hl(g, -96, -80, 192, 84, hq); g.restore(); }
} });
// ② Monthly calendar: one red stroke every 2.2 days
const MW = 520, MH = 560, MP = xy(560, 760);
const DAYS = (() => { const o = []; for (let k = 0; k * 365 / 165 < 30; k++) o.push(Math.round(k * 365 / 165)); return o; })();
const SL = DAYS.map((d, k) => V.handPts('s08sl' + k, [[-26, 18], [26, -18]], { amp: 1.4, seed: k + 3, per: 5 }));
const month = () => V.spr('s08month', MW, MH, (g, w, h) => {
  V.paper(g, w, h, 61, { col: '#f4f2ec', torn: false, age: 0.1 }); g.fillStyle = C.black; g.fillRect(0, 0, w, 70);
  V.text(g, T.month, 30, 50, 40, F.heavy, C.paper);
  g.strokeStyle = 'rgba(40,36,30,.35)'; g.lineWidth = 1.5; for (let i = 0; i <= 7; i++) { g.beginPath(); g.moveTo(20 + i * 68, 100); g.lineTo(20 + i * 68, h - 30); g.stroke(); } for (let j = 0; j <= 5; j++) { g.beginPath(); g.moveTo(20, 100 + j * 86); g.lineTo(w - 24, 100 + j * 86); g.stroke(); }
  for (let d = 0; d < 30; d++) V.text(g, String(d + 1), 20 + (d % 7) * 68 + 8, 100 + Math.floor(d / 7) * 86 + 28, 24, F.type, C.ink2);
});
const tCal = [G('平均') + 0.05, G('一发') + 0.25];
V.item({ key: 's08month', ...MP, r: 0.03, z: 13, at: G('平均') - 0.35, enter: { from: [-360, -200], tilt: -0.18, dur: 0.35 }, draw(g, T_) {
  V.blit(g, month()); const st = step(T_);
  DAYS.forEach((d, k) => { const t = tCal[0] + k * (tCal[1] - tCal[0]) / DAYS.length; if (st < t) return; g.save(); g.translate(-MW / 2 + 20 + (d % 7) * 68 + 34, -MH / 2 + 100 + Math.floor(d / 7) * 86 + 50); V.pen(g, SL[k], clamp((st - t) / 0.08), { lw: 7 }); g.restore(); });
  if (st >= tCal[1] - 0.15) { g.save(); g.translate(0, MH / 2 + 50); g.rotate(-0.03); V.label(g, T.avg, 56, { bg: C.red2, n: V.nTyped(T_, tCal[1] - 0.15, 16) }); g.restore(); }
} });
// ③ Paper-cut balance scale
const SC = xy(620, 1430), tTip = G('其他') - 0.05;
const mini = () => V.cutout('s08mini', 22, 120, (g, w, h) => PH.rocket(g, RK.falcon9({ payload: 'fairing' }), w / 2, h - 4, 1.65), { cell: 3, edge: 3 });
const pan = (key) => V.cutout('s08pan' + key, 300, 70, (g, w, h) => { g.fillStyle = '#7d7d7a'; g.beginPath(); g.moveTo(0, 10); g.lineTo(w, 10); g.quadraticCurveTo(w / 2, h * 1.6, 0, 10); g.fill(); }, { ht: false, edge: 5 });
const post = () => V.cutout('s08post', 380, 360, (g, w, h) => { g.fillStyle = '#5c5b58'; g.fillRect(w / 2 - 12, 30, 24, h - 70); g.beginPath(); g.moveTo(w / 2 - 110, h); g.lineTo(w / 2 + 110, h); g.lineTo(w / 2 + 40, h - 44); g.lineTo(w / 2 - 40, h - 44); g.fill(); g.beginPath(); g.arc(w / 2, 30, 22, 0, TAU); g.fill(); }, { ht: false, edge: 5 });
V.item({ key: 's08scale', ...SC, r: 0, z: 12, at: G('比全') - 0.25, enter: { from: [0, 420], tilt: 0.1, dur: 0.4 }, draw(g, T_) {
  const st = step(T_), q = MO.backOut(clamp((st - tTip) / 0.8), 1.3), ang = -0.2 * q;
  V.blit(g, post(), 0, 60);
  g.save(); g.translate(0, -110); g.rotate(ang); g.fillStyle = '#4a4a48'; g.fillRect(-330, -8, 660, 16);
  for (const s of [-1, 1]) { g.save(); g.translate(s * 320, 0); g.rotate(-ang); g.strokeStyle = '#4a4a48'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(-120, 110); g.moveTo(0, 0); g.lineTo(120, 110); g.stroke(); V.blit(g, pan(s), 0, 120); { const nr = s < 0 ? 5 : 2; for (let r = 0; r < nr; r++) for (let j = 0; j < 4; j++) { g.save(); g.translate(-102 + j * 68, 100 - r * 17); g.rotate(-Math.PI / 2); V.blit(g, mini(), 0, 0, 0.55); g.restore(); } }
    const lab = s < 0 ? T.l : T.r; g.font = V.font(44, F.heavy); const lw = g.measureText(lab).width + 36; g.fillStyle = s < 0 ? C.red2 : C.card; g.fillRect(-lw / 2, 160, lw, 66); V.text(g, lab, 0, 208, 44, F.heavy, s < 0 ? C.paper : C.ink, 'center'); g.restore(); }
  g.restore();
} });
// ④ 37 tally strokes
const KP = xy(1800, 1500), KW = 1000, KHh = 340, tT = [G('飞了') - 0.55, G('37') - 0.1];
const booster = () => V.cutout('s08boost', 96, 420, (g, w, h) => {
  RK.at(g, w / 2, h - 34, 9.2, 0, q => V.shadeFill(q, RK.falcon9({ stage: 'booster', legs: 0, fins: 0.4 }), { ...V.GREY, body: '#c4c4c4' }));
  g.save(); g.globalCompositeOperation = 'source-atop'; const gr = g.createLinearGradient(0, h, 0, h * 0.2); gr.addColorStop(0, 'rgba(25,25,25,.85)'); gr.addColorStop(1, 'rgba(25,25,25,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.restore();
}, { cell: 4, edge: 6 });
V.item({ key: 's08tally', ...KP, r: -0.02, z: 13, at: G('有一枚') - 0.3, enter: { from: [420, 120], tilt: 0.14, dur: 0.4 }, draw(g, T_) {
  V.blit(g, V.spr('s08card', KW, KHh, (gg, w, h) => V.indexCard(gg, w, h, { top: 56, gap: 48 })));
  g.save(); g.translate(60, -70); g.rotate(-Math.PI / 2); V.blit(g, booster(), 0, 0, 1.3); g.restore();
  const st = step(T_), n = Math.min(37, Math.floor(37 * MO.sineInOut(seg(st, tT[0], tT[1])) + 1e-6));
  V.typed(g, T.one, -KW / 2 + 50, -KHh / 2 + 44, V.nTyped(T_, G('助推器') - 0.2, 12), 36, F.heavy, C.ink2);
  if (st >= tT[0]) V.tally(g, -KW / 2 + 70, 18, n, 84, 13, 20, 6);
  if (st >= tT[1] - 0.05) { g.save(); g.translate(KW / 2 - 150, 70); g.rotate(-0.05); const s = 1 + 0.25 * (1 - MO.quartOut(clamp(step(T_ - tT[1] + 0.05) / 0.25))); g.scale(s, s); V.text(g, T.n37, 0, 34, 104, F.heavy, C.red, 'center'); g.restore(); }
} });

// ---------- Camera ----------
const at = (x, y, z, sy) => V.at(X0 + x, Y0 + y, z, sy);
const cam = (lt) => CAM.at([
  V.key(0, at(1470, 845, 1.0)),                                 // Hard cuts at sentence breaks (Vox's most common transition)
  V.key(0.9, at(1480, 840, 1.02), MO.sineInOut),
  V.key(cue('165'), at(1560, 860, 1.08), MO.sineInOut),
  V.key(cue('平均') - 0.05, at(1600, 870, 1.14), MO.sineInOut),
  V.key(cue('平均') + 0.3, at(620, 840, 1.2), MO.cubicInOut),
  V.key(cue('比全') - 0.1, at(610, 850, 1.25), MO.sineInOut),
  V.key(cue('比全') + 0.3, at(640, 1370, 1.18), MO.cubicInOut),
  V.key(cue('有一枚') - 0.1, at(640, 1380, 1.22), MO.sineInOut),
  V.key(cue('有一枚') + 0.3, at(1860, 1440, 1.25), MO.cubicInOut),
  V.key(TM.dur(ID) - 0.3, at(1870, 1445, 1.3), MO.sineInOut),
  V.key(TM.dur(ID), at(1740, 1400, 1.26), MO.cubicIn),
], lt);
V.scene(ID, { cam, init() { V.glyphs(ID, [[F.bold, '全为猎鹰9号'], [F.heavy, T.title + T.avg + T.month + T.l + T.r + T.one + T.n37], [F.med, T.src], [F.num, '0123456789'], [F.type, '0123456789']]); } });
})();
