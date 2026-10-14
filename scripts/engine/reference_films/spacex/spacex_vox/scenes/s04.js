// S04 · December 2008 contract → 2012 Dragon: three-months-later red thread leads from previous clipping to paperclipped contract; highlighter follows $1.6 billion / 12 station resupply missions;
// Camera follows another red thread past small 2010 Falcon 9 maiden-flight card to halftone station photo; paper-cut Dragon docks in steps, circled red, black label types.
(() => {
const ID = 's04', V = VOX, C = V.C, F = V.F, PH = V.PH, TAU = Math.PI * 2;
const { clamp, lerp } = U, seg = MO.seg, step = V.step;
const cell = V.cell(ID), X0 = cell.x, Y0 = cell.y, xy = (x, y) => ({ x: X0 + x, y: Y0 + y });
const cue = k => TM.cue(ID, k), G = k => V.cue(ID, k), t0 = V.t0(ID);
const T = { tag3: '三个月后', kick: '2008.12', head: 'NASA 商业补给合同', l1a: '合同金额', l1b: '16亿美元', l2a: '任务', l2b: '12次空间站补给', c10: '2010 · 猎鹰9号首飞', yr: '2012', lb: '第一艘造访国际空间站的私人飞船' };

// ---------- Contract (paperclip and typed table) ----------
const NW = 780, NH = 600, N = xy(640, 1000), NR = -0.022;
const POS = {};
const doc = () => V.spr('s04doc', NW, NH, (g, w, h) => {
  V.paper(g, w, h, 21, { col: '#efeee9', torn: false, age: 0.16 });
  V.text(g, T.kick, 54, 78, 34, F.type, C.ink2); g.fillStyle = C.ink; g.fillRect(54, 96, w - 108, 3); g.fillRect(54, 103, w - 108, 1);
  V.text(g, T.head, 54, 190, 60, F.heavy, C.ink); g.fillRect(54, 222, w - 108, 1.5);
  V.text(g, T.l1a, 54, 310, 38, F.med, C.ink2); g.font = V.font(38, F.med); let x1 = 54 + g.measureText(T.l1a).width + 26;
  V.text(g, T.l1b, x1, 316, 66, F.heavy, C.ink); g.font = V.font(66, F.heavy); POS.h1 = { x: x1 - 10, y: 254, w: g.measureText(T.l1b).width + 20, h: 76 };
  V.text(g, T.l2a, 54, 404, 38, F.med, C.ink2); g.font = V.font(38, F.med); let x2 = 54 + g.measureText(T.l2a).width + 26;
  V.text(g, T.l2b, x2, 408, 50, F.heavy, C.ink); g.font = V.font(50, F.heavy); POS.h2 = { x: x2 - 10, y: 360, w: g.measureText(T.l2b).width + 20, h: 64 };
  g.fillStyle = 'rgba(40,36,30,.26)'; [640, 600, 660, 380].forEach((ww, i) => g.fillRect(54, 456 + i * 26, ww, 11));
});
const clip = (g, x, y, a) => { g.save(); g.translate(x, y); g.rotate(a); g.strokeStyle = '#8d8d8a'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 60); g.lineTo(0, -40); g.arc(13, -40, 13, Math.PI, 0); g.lineTo(26, 70); g.arc(6, 70, 20, 0, Math.PI); g.lineTo(-14, -20); g.stroke(); g.restore(); };
V.item({ key: 's04doc', ...N, r: NR, z: 11, at: t0 - 1, draw(g, T_) {
  V.blit(g, doc()); clip(g, -NW / 2 + 70, -NH / 2 + 18, 0.15);
  g.save(); g.translate(-NW / 2, -NH / 2); const st = step(T_);
  V.hl(g, POS.h1.x, POS.h1.y, POS.h1.w, POS.h1.h, MO.sineInOut(seg(st, G('16亿'), G('16亿') + 0.75)));
  V.hl(g, POS.h2.x, POS.h2.y, POS.h2.w, POS.h2.h, MO.sineInOut(seg(st, G('往空间站'), G('送货') + 0.2)));
  g.restore();
} });
// ---------- Small 2010 card ----------
const C10 = xy(1180, 1420);
V.item({ key: 's04c10', ...C10, r: 0.045, z: 10, at: t0 - 1, draw(g) {
  V.blit(g, V.spr('s04c10', 380, 300, (gg, w, h) => {
    V.indexCard(gg, w, h, { top: 40, gap: 34 });
    const ph = CL.photo('s04f9', 600, 340, (q, ww, hh) => { q.scale(2, 2); PH.sky(q, 300, 170, '#9a9a9a', '#d8d8d8'); q.fillStyle = '#555'; q.fillRect(0, 148, 300, 22); q.fillStyle = '#3a3a3a'; q.fillRect(186, 20, 10, 130); PH.rocket(q, RK.falcon9({ payload: 'fairing' }), 150, 150, 1.95); }, { border: 16, cell: 8 });
    gg.save(); gg.translate(w / 2, 112); gg.rotate(-0.02); gg.drawImage(ph, -158, -93, 316, 186); gg.restore();
    V.text(gg, T.c10, w / 2, h - 34, 30, F.bold, C.ink, 'center');
  }));
} });
// ---------- Halftone station photo and paper-cut Dragon ----------
const P2 = xy(1700, 880), PW = 820, PHh = 520, PR = 0.02;
const stationDraw = (g, w, h) => {
  const cx = w / 2, cy = h / 2;
  const sk = g.createLinearGradient(0, 0, 0, h); sk.addColorStop(0, '#0b0b0b'); sk.addColorStop(1, '#222'); g.fillStyle = sk; g.fillRect(0, 0, w, h); PH.stars(g, w, h, 3, 40);
  PH.earthLimb(g, cx + 120, cy + 1400, 1180, 12);
  g.save(); g.translate(cx, cy - 60);
  const panel = (x, y, pw, ph) => { g.fillStyle = '#585858'; g.fillRect(x, y, pw, ph); g.strokeStyle = '#9d9d9d'; g.lineWidth = 2; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(x + pw * k / 4, y); g.lineTo(x + pw * k / 4, y + ph); g.stroke(); } for (let k = 1; k < 8; k++) { g.beginPath(); g.moveTo(x, y + ph * k / 8); g.lineTo(x + pw, y + ph * k / 8); g.stroke(); } };
  for (const x of [-300, -228, 178, 250]) { panel(x, -58 - 150, 52, 150); panel(x, -42, 52, 150); }
  g.fillStyle = '#d9d9d9'; g.fillRect(-330, -58, 660, 16);
  g.strokeStyle = '#7a7a7a'; g.lineWidth = 2; for (let x = -330; x < 330; x += 22) { g.beginPath(); g.moveTo(x, -58); g.lineTo(x + 11, -42); g.lineTo(x + 22, -58); g.stroke(); }
  g.fillStyle = '#c9c9c9'; for (const x of [-120, 90]) g.fillRect(x, -40, 30, 60);
  const cyl = (x, y, cw, ch) => { const gr = g.createLinearGradient(x, 0, x + cw, 0); gr.addColorStop(0, '#9a9a9a'); gr.addColorStop(0.45, '#f4f4f4'); gr.addColorStop(1, '#8a8a8a'); g.fillStyle = gr; g.beginPath(); g.roundRect(x, y, cw, ch, 8); g.fill(); };
  cyl(-24, -96, 48, 70); cyl(-22, -30, 44, 82); cyl(-18, 50, 36, 46);
  g.fillStyle = '#e8e8e8'; g.beginPath(); g.roundRect(-110, -20, 220, 36, 12); g.fill();
  g.fillStyle = '#bdbdbd'; g.fillRect(-12, 96, 24, 14);
  g.restore();
};
const PORT = [0, -60 + 110];                                   // Docking port (photo-centered coordinates)
const dragon = () => V.cutout('s04dragon', 64, 118, (g, w, h) => RK.at(g, w / 2, h, 16.5, 0, q => V.shadeFill(q, RK.dragon({ trunk: true }), { body: '#ececec', trunk: '#b5b5b5', nose: '#dadada', window: '#202020', line: '#3a3a3a', lw: 0.12 })), { cell: 4, edge: 6, sh: { blur: 8, x: 3, y: 5, col: 'rgba(0,0,0,.4)' } });
const tDr = G('龙飞船') - 0.15, tDock = G('国际空间站') + 0.2, DC = V.circle('s04dock', 96, 74, 13);
V.item({ key: 's04iss', ...P2, r: PR, z: 10, at: t0 - 1, draw(g, T_) {
  const sp = V.photo('s04iss', PW, PHh, stationDraw, { cell: 6, border: 16 }); V.blit(g, sp); V.tape(g, PW / 2 - 60, -PHh / 2 - 6, 0.45, 130);
  const st = step(T_), q = clamp((st - tDr) / (tDock - tDr));
  if (q > 0) {
    const e = MO.smooth(q), dock = [PORT[0], PORT[1] + 59 + 4];
    const x = lerp(-170, dock[0], e), y = lerp(PHh / 2 + 120, dock[1], e) + (q >= 1 ? MO.settle(st - tDock, 3, 3, 6) : 0);
    g.save(); g.translate(x, y); g.rotate(lerp(-0.32, 0, e) + (q < 1 ? 0.02 * Math.sin(st * 9) : 0)); V.blit(g, dragon()); g.restore();
  }
  g.save(); g.translate(PORT[0], PORT[1] + 40); V.pen(g, DC, MO.cubicOut(seg(st, tDock + 0.1, tDock + 0.7)), { lw: 7 }); g.restore();
} });
// Black label strip (over lower-left photo): 2012 slides with strip, next line types
const LB = xy(1640, 1215);
V.item({ key: 's04lb', ...LB, r: -0.02, z: 12, at: G('2012') - 0.05, enter: { from: [-60, 380], tilt: -0.14, dur: 0.45 }, draw(g, T_) {
  // Black strip grows right with typing (no long empty black tail)
  const n = V.nTyped(T_, G('第一艘'), 13); g.font = V.font(34, F.heavy); const tw = g.measureText([...T.lb].slice(0, n).join('')).width;
  const W0 = 660, w = Math.max(240, Math.min(W0, tw + 70)), h = 180; g.save(); g.translate(-W0 / 2, -h / 2); g.fillStyle = C.black; CL.tornRect(g, w, h, 77, 3); g.fill(); g.restore();
  V.text(g, T.yr, -W0 / 2 + 30, -h / 2 + 92, 78, F.num, C.yel);
  V.typed(g, T.lb, -W0 / 2 + 30, h / 2 - 32, n, 34, F.heavy, C.paper);
} });
// ---------- Red thread: previous clipping → contract (three months later); contract → 2010 card → photo ----------
const PREV = [V.cell('s03').x + 1500 + 420, 1390 - 150];
const A1 = PREV, B1 = [N.x - NW / 2 + 40, N.y - NH / 2 + 30];
const mk = (a, b, sag) => { const pts = CL.stringPts(a, b, sag); return { a, b, pts, cum: DG.cum(pts) }; };
const S1 = mk(A1, B1, 0.08), S2 = mk([N.x + NW / 2 - 30, N.y + 40], [C10.x, C10.y - 130], 0.06), S3 = mk([C10.x + 40, C10.y - 130], [P2.x - PW / 2 + 40, P2.y - PHh / 2 + 10], 0.07);
const tS1 = [G('三个') - 0.05, G('后') + 0.25], tS2 = [G('2012') - 0.25, G('2012') + 0.2], tS3 = [G('2012') + 0.1, G('2012') + 0.55];
V.item({ key: 's04str', x: X0 + 600, y: 1000, rad: 2600, z: 48, at: tS1[0], draw(g, T_) {
  g.save(); g.translate(-(X0 + 600), -1000); const st = step(T_);
  const str = (S, a, b, tag) => { const q = MO.sineInOut(seg(st, a, b)); if (q <= 0) return; const L = S.cum[S.cum.length - 1]; CL.string(g, S.pts, S.cum, L * q, { col: C.red, lw: 5 }); V.pin(g, S.a[0], S.a[1]); if (q >= 1) V.pin(g, S.b[0], S.b[1]);
    if (tag && q > 0.45) { const m = DG.pointAt(S.pts, S.cum, L * 0.5); g.save(); g.translate(m[0], m[1] + 50); g.rotate(0.04); g.fillStyle = C.card; const tw = 250; g.fillRect(-tw / 2, -36, tw, 72); V.text(g, tag, 0, 16, 44, F.heavy, C.ink, 'center'); g.restore(); } };
  str(S1, tS1[0], tS1[1], T.tag3); str(S2, tS2[0], tS2[1]); str(S3, tS3[0], tS3[1]);
  g.restore();
} });

// ---------- Camera ----------
const at = (x, y, z, sy) => V.at(X0 + x, Y0 + y, z, sy);
const pan2 = cue('2012') - 0.25;
const cam = (lt) => CAM.at([
  V.key(0, V.camEnd('s03')),
  V.key(0.35, at(-420, 1180, 0.95), MO.cubicIn),
  V.key(1.35, at(620, 970, 1.14), MO.longTail),                 // Follow red thread: long tail
  V.key(cue('16亿'), at(610, 975, 1.17), MO.sineInOut),
  V.key(cue('送货') + 0.3, at(600, 1010, 1.32), MO.sineInOut),     // Slow push toward those two lines during highlighting
  V.key(pan2, at(605, 1012, 1.33), MO.sineInOut),
  V.key(pan2 + 0.6, at(1250, 1120, 0.95), MO.cubicInOut),       // Find next card: pull out, pass small 2010 card
  V.key(pan2 + 1.25, at(1690, 960, 1.08), MO.longTail),
  V.key(TM.dur(ID), at(1700, 975, 1.2), MO.sineInOut),
], lt);
V.scene(ID, { cam, init() { V.glyphs(ID, [[F.heavy, T.tag3 + T.head + T.l1b + T.l2b + T.lb], [F.med, T.l1a + T.l2a], [F.bold, T.c10], [F.type, T.kick], [F.num, T.yr]]); } });
})();
