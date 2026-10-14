// S04 · Vox collage desktop (y2_vox grammar): three months later NASA awards a $1.6bn station-supply contract; in 2012 Dragon becomes the first private spacecraft to visit the ISS.
// One large desktop is the world; camera pushes/pans smoothly at 60fps (long-tail bezier / sineInOut), while paper, red threads, highlights, typing and cutout Dragon step at 12fps on twos.
// Timeline (all tied to voiceover cues):
//   Incoming deskPullOut: the previous pixel-game frame becomes a halftone photo on the desk; pull out from a full-frame photo to reveal the collage (Vox grammar).
//   Three months later: red thread joins the 2008.9 photo to a clipping; camera follows it, then highlights $1.6bn and station supplies.
//   2012: camera follows another red thread past the 2010 Falcon 9 maiden-flight card to the halftone photo; cutout Dragon docks in steps, black label types, red pen circles the port.
//   End: camera fills the frame with the black label strip; the next 3b1b segment grows out of black.
// Materials: CL paper/halftone/pins/red thread/highlighter/tilted slide; CAM keyframes; DG hand-drawn circles; TY typewriter; MO on twos. No real newspaper mastheads or agency logos.
(() => {
const W = 1920, H = 1080, { clamp, lerp } = U, seg = MO.seg, step = MO.step, TAU = Math.PI * 2;
const ID = 's04', TR = { type: 'deskPullOut', dur: 0.85 };
ERAS.find(e => e.id === ID).transition = TR;
const DUR = TM.dur(ID), cue = k => TM.cue(ID, k), cend = k => TM.end(ID, k);

const C = { desk: '#e4ddcf', news: '#eeedeb', ink: '#171716', red: '#b8433f', black: '#1b1b1a', paper: '#eeedeb', card: '#f6f4ee', yel: '#dacf08' };
const F = { heavy: 'PuHui-Heavy', bold: 'PuHui-Bold', med: 'PuHui-Medium', num: 'Anton-400' };
const T = {
  photoTag: '2008.9 · 猎鹰1号入轨', tag3: '三个月后',
  kicker: '2008.12', head: 'NASA 商业补给合同', l1a: '合同金额', l1b: '16亿美元', l2a: '任务', l2b: '12次空间站补给',
  c10: '2010 · 猎鹰9号首飞', lbYear: '2012', lbText: '第一艘造访国际空间站的私人飞船',
};

// ---------- World layout (desktop coordinates, px) ----------
const PH = { x: 360, y: 430, w: 576, h: 324, b: 16 };                 // Photo from the previous frame (16:9 inner frame).
const N1 = { x: 1400, y: 540, w: 760, h: 560, r: -0.025 };            // Clipping: 2008.12 commercial resupply contract.
const C10 = { x: 2150, y: 850, w: 380, h: 300, r: 0.045 };            // Small card: 2010 Falcon 9 maiden flight (visual only).
const P2 = { x: 2950, y: 430, w: 840, h: 520, b: 18, r: 0.02 };      // Halftone photo: space station.
const LB = { x: 2730, y: 690, w: 640, h: 180, r: -0.02 };             // Borders-style black label strip (over the photo's lower left).
const rot = (x, y, r) => [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
const local = (o, x, y) => { const [a, b] = rot(x, y, o.r || 0); return [o.x + a, o.y + b]; };

// ---------- Times (all cue-driven) ----------
const tStr1 = [0.7, 1.45];                                            // Three months later: red thread links photo to clipping.
const hl1 = [cue('16亿美元'), cend('16亿美元')];
const hl2 = [cue('往空间站送货'), cend('往空间站送货')];
const pan2 = cue('2012年') - 0.1;
const tStr2 = [pan2 + 0.05, pan2 + 0.6], tStr3 = [pan2 + 0.55, pan2 + 1.15];
const tLabel = pan2 + 1.05;                                          // Label strip slides in.
const tType = cue('第一艘');
const tDragon = cue('龙飞船') - 0.15, tDock = cue('国际空间站') + 0.15;
const tCirc = tDock + 0.12;

// ---------- Camera ----------
const KEYS = [
  { t: 0, x: PH.x, y: PH.y, z: W / PH.w },                                     // Photo's inner frame exactly fills the screen (= previous segment's last frame).
  { t: TR.dur, x: PH.x + 210, y: PH.y + 50, z: 1.18, ease: MO.longTail },      // Pull-out reveal: fast start, long-tail settle.
  { t: 1.05, x: PH.x + 240, y: PH.y + 55, z: 1.17, ease: MO.sineInOut },
  { t: 2.2, x: N1.x - 10, y: N1.y - 10, z: 1.16, ease: MO.sineInOut },         // Follow red thread to clipping (symmetric Easy Ease, low peak speed when finding the next card).
  { t: hl2[1], x: N1.x - 40, y: N1.y + 40, z: 1.34, ease: MO.sineInOut },      // Slow push toward the two lines during highlighting.
  { t: pan2, x: N1.x - 40, y: N1.y + 42, z: 1.345 },
  { t: pan2 + 0.65, x: C10.x + 40, y: 650, z: 1.0, ease: MO.cubicInOut },     // Find the next card: pull back, pass the 2010 card.
  { t: pan2 + 1.3, x: P2.x - 20, y: P2.y + 120, z: 1.12, ease: MO.longTail },
  { t: DUR - 0.1, x: P2.x - 40, y: P2.y + 140, z: 1.2, ease: MO.sineInOut },
];
const LBK = local(LB, 130, -38);                                               // Pure-black area at upper right of label: fill the frame at segment end.
const camAt = (lt) => {
  const p0 = DUR - 0.1, base = CAM.at(KEYS, Math.min(lt, p0));
  if (lt <= p0) return base;
  const e = MO.sineInOut(seg(lt, p0, DUR + 0.3));
  return CAM.pushTo(base, LBK[0], LBK[1], 18, e, MO.smooth(seg(lt, p0, DUR + 0.2)));
};

// ---------- Halftone (previous frame → desktop photo; computed per transition frame, cached inside the photo) ----------
const HT = { w: 960, h: 540, cell: 7 };
let dsC = null, dsG = null;
function halftone(out, src) {
  if (!dsC) { dsC = PAINT.canvas(HT.w, HT.h); dsG = dsC.getContext('2d', { willReadFrequently: true }); }
  dsG.reset(); dsG.drawImage(src, 0, 0, HT.w, HT.h);
  const d = dsG.getImageData(0, 0, HT.w, HT.h).data, g = out.getContext('2d'); g.reset();
  g.fillStyle = '#ece6d8'; g.fillRect(0, 0, HT.w, HT.h); g.fillStyle = '#1b1b1b';
  const cell = HT.cell, k = Math.SQRT1_2, R = Math.hypot(HT.w, HT.h) / 2 + cell;
  g.beginPath();
  for (let v = -R; v < R; v += cell) for (let u = -R; u < R; u += cell) {
    const x = HT.w / 2 + (u - v) * k, y = HT.h / 2 + (u + v) * k; if (x < -cell || y < -cell || x > HT.w + cell || y > HT.h + cell) continue;
    const i = (clamp(y | 0, 0, HT.h - 1) * HT.w + clamp(x | 0, 0, HT.w - 1)) * 4;
    const L = clamp(((d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11) / 255 - 0.5) * 1.2 + 0.5);
    const rr = cell * 0.62 * Math.sqrt(1 - L); if (rr < 0.45) continue;
    g.moveTo(x + rr, y); g.arc(x, y, rr, 0, TAU);
  }
  g.fill();
  g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(214,205,185,.3)'; g.fillRect(0, 0, HT.w, HT.h); g.globalCompositeOperation = 'source-over';
}
// Photo content = previous scene at transition end (deterministic: redraw s03 at the same t, independent of render order).
let snapHT = null;
function snapshot() {
  if (snapHT) return snapHT;
  const i3 = ERAS.findIndex(e => e.id === 's03'), e3 = ERAS[i3], e4 = ERAS.find(e => e.id === ID), t = e4.t0 + TR.dur;
  const src = PAINT.canvas(W, H), g = src.getContext('2d');
  g.save(); e3.draw(g, t - e3.t0, t, window.IMG, ERAS[i3 - 1]); g.restore();
  snapHT = PAINT.canvas(HT.w, HT.h); halftone(snapHT, src); return snapHT;
}
// Screen space: vignette + static grain (Vox paper texture stays fixed, no per-frame jitter).
const finish = (c) => {
  c.drawImage(PAINT.cached('s04_vig', W, H, (g) => { const r = g.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05); r.addColorStop(0, 'rgba(40,30,20,0)'); r.addColorStop(1, 'rgba(40,30,20,.32)'); g.fillStyle = r; g.fillRect(0, 0, W, H); }), 0, 0);
  c.drawImage(PAINT.grain('s04grain', 0.05, [40, 30, 20], 0.14), 0, 0);
};
// Transition: draw old frame A inside the photo under the desktop camera; k goes from 0 (full color) to 1 (halftone, matching the cached frame).
let liveHT = null;
const photoLive = (c, A, lt, p) => {
  const k = MO.smooth(seg(p, 0.08, 0.72));
  c.save(); CAM.apply(c, camAt(lt));
  const x = PH.x - PH.w / 2, y = PH.y - PH.h / 2;
  c.drawImage(A, x, y, PH.w, PH.h);
  if (k > 0) { if (!liveHT) liveHT = PAINT.canvas(HT.w, HT.h); halftone(liveHT, A); c.globalAlpha = k; c.drawImage(liveHT, x, y, PH.w, PH.h); }
  c.restore();
  // Overlay the scene's vignette/grain on the photo too (weighted by k), avoiding sudden darkening at transition end.
  if (k > 0) { c.save(); CAM.apply(c, camAt(lt)); c.beginPath(); c.rect(x, y, PH.w, PH.h); c.restore(); c.save(); c.clip(); c.globalAlpha = k; finish(c); c.restore(); }
};
window.S04X = { photoLive, camAt };

// ---------- Assets (draw once and cache at 2× resolution to stay sharp on close-ups) ----------
const S2 = 2, sprite = (key, w, h, fn) => PAINT.cached('s04_' + key, w * S2, h * S2, (g) => { g.scale(S2, S2); fn(g); });
const font = (sz, fam) => `${sz}px "${fam}"`;
const NEWS = {};                                                       // Highlighter positions (clipping-local coordinates, origin at top left).
const newsSprite = () => sprite('news', N1.w, N1.h, (g) => {
  const tile = CL.paperTile('s04news', C.news, { amt: 9, fibers: 160, seed: 11 });
  g.save(); CL.tornRect(g, N1.w, N1.h, 21, 4); g.clip(); g.fillStyle = g.createPattern(tile, 'repeat'); g.fillRect(0, 0, N1.w, N1.h);
  const yel = g.createRadialGradient(N1.w * 0.4, N1.h * 0.4, 50, N1.w * 0.5, N1.h * 0.5, N1.w * 0.75); yel.addColorStop(0, 'rgba(255,255,255,0)'); yel.addColorStop(1, 'rgba(170,150,110,.22)'); g.fillStyle = yel; g.fillRect(0, 0, N1.w, N1.h);
  g.fillStyle = C.ink; g.textBaseline = 'alphabetic';
  g.font = font(30, F.bold); g.fillText(T.kicker, 54, 76);
  g.fillRect(54, 94, N1.w - 108, 3); g.fillRect(54, 101, N1.w - 108, 1);
  g.font = font(64, F.heavy); g.fillText(T.head, 54, 192);
  g.fillRect(54, 222, N1.w - 108, 1.5);
  g.font = font(38, F.med); g.fillStyle = '#2a2723'; g.fillText(T.l1a, 54, 305); let x1 = 54 + g.measureText(T.l1a).width + 22;
  g.font = font(62, F.heavy); g.fillStyle = C.ink; g.fillText(T.l1b, x1, 310); NEWS.hl1 = { x: x1 - 10, y: 252, w: g.measureText(T.l1b).width + 20, h: 72 };
  g.font = font(38, F.med); g.fillStyle = '#2a2723'; g.fillText(T.l2a, 54, 395); let x2 = 54 + g.measureText(T.l2a).width + 22;
  g.font = font(46, F.heavy); g.fillStyle = C.ink; g.fillText(T.l2b, x2, 398); NEWS.hl2 = { x: x2 - 10, y: 352, w: g.measureText(T.l2b).width + 20, h: 60 };
  g.fillStyle = 'rgba(40,36,30,.28)'; [640, 600, 650, 420].forEach((w, i) => g.fillRect(54, 444 + i * 26, w, 11));
  g.restore();
});
// 2010 card: ruled index card + small halftone photo (Falcon 9 on launch pad).
const c10Sprite = () => sprite('c10', C10.w, C10.h, (g) => {
  g.fillStyle = C.card; g.fillRect(0, 0, C10.w, C10.h);
  g.strokeStyle = 'rgba(80,140,200,.28)'; g.lineWidth = 1.5; for (let y = 70; y < C10.h; y += 34) { g.beginPath(); g.moveTo(0, y); g.lineTo(C10.w, y); g.stroke(); }
  const ph = CL.photo('s04_f9', 300, 170, (gg, w, h) => {
    const sk = gg.createLinearGradient(0, 0, 0, h); sk.addColorStop(0, '#9a9a9a'); sk.addColorStop(1, '#d8d8d8'); gg.fillStyle = sk; gg.fillRect(0, 0, w, h);
    gg.fillStyle = '#555'; gg.fillRect(0, h - 22, w, 22); gg.fillStyle = '#3a3a3a'; gg.fillRect(w * 0.62, 20, 10, h - 40);   // Ground and tower.
    RK.at(gg, w * 0.5, h - 20, 1.95, 0, q => RK.fill(q, RK.falcon9({ payload: 'fairing' }), { body: '#f2f2f2', dark: '#2a2a2a', nose: '#f2f2f2', engine: '#333' }));
  }, { border: 8, cell: 4 });
  g.save(); g.translate(C10.w / 2, 112); g.rotate(-0.02); g.drawImage(ph, -ph.width / 2, -ph.height / 2); g.restore();
  g.fillStyle = C.ink; g.font = font(32, F.bold); g.textAlign = 'center'; g.fillText(T.c10, C10.w / 2, C10.h - 34);
});
// Halftone photo: low-orbit station (simplified hand-drawn truss, solar arrays and modules, 45° halftone).
const stationDraw = (g, w, h) => {
  g.scale(w / P2.w, h / P2.h); const cx = P2.w / 2, cy = P2.h / 2;
  const sk = g.createLinearGradient(0, 0, 0, P2.h); sk.addColorStop(0, '#0b0b0b'); sk.addColorStop(1, '#222'); g.fillStyle = sk; g.fillRect(0, 0, P2.w, P2.h);
  const eg = g.createRadialGradient(cx + 120, cy + 1420, 1100, cx + 120, cy + 1420, 1210); eg.addColorStop(0, '#b9b9b9'); eg.addColorStop(0.86, '#8c8c8c'); eg.addColorStop(1, 'rgba(60,60,60,0)');
  g.fillStyle = eg; g.beginPath(); g.arc(cx + 120, cy + 1420, 1210, 0, TAU); g.fill();                             // Earth's edge.
  g.fillStyle = 'rgba(230,230,230,.5)'; g.beginPath(); g.arc(cx + 120, cy + 1420, 1166, Math.PI * 1.25, Math.PI * 1.75); g.lineTo(cx + 120, cy + 1420); g.fill();
  g.save(); g.translate(cx, cy - 40);
  const panel = (x, y, pw, ph) => { g.fillStyle = '#585858'; g.fillRect(x, y, pw, ph); g.strokeStyle = '#9d9d9d'; g.lineWidth = 2; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(x + pw * k / 4, y); g.lineTo(x + pw * k / 4, y + ph); g.stroke(); } for (let k = 1; k < 8; k++) { g.beginPath(); g.moveTo(x, y + ph * k / 8); g.lineTo(x + pw, y + ph * k / 8); g.stroke(); } };
  for (const x of [-300, -228, 178, 250]) { panel(x, -58 - 150, 52, 150); panel(x, -42, 52, 150); }
  g.fillStyle = '#d9d9d9'; g.fillRect(-330, -58, 660, 16);                                                       // Truss.
  g.strokeStyle = '#7a7a7a'; g.lineWidth = 2; for (let x = -330; x < 330; x += 22) { g.beginPath(); g.moveTo(x, -58); g.lineTo(x + 11, -42); g.lineTo(x + 22, -58); g.stroke(); }
  g.fillStyle = '#c9c9c9'; for (const x of [-120, 90]) g.fillRect(x, -40, 30, 60);                                // Radiators.
  const cyl = (x, y, cw, ch) => { const gr = g.createLinearGradient(x, 0, x + cw, 0); gr.addColorStop(0, '#9a9a9a'); gr.addColorStop(0.45, '#f4f4f4'); gr.addColorStop(1, '#8a8a8a'); g.fillStyle = gr; g.beginPath(); g.roundRect(x, y, cw, ch, 8); g.fill(); };
  cyl(-24, -96, 48, 70); cyl(-22, -30, 44, 82); cyl(-18, 50, 36, 46);                                             // Modules (vertical chain).
  g.fillStyle = '#e8e8e8'; g.beginPath(); g.roundRect(-110, -20, 220, 36, 12); g.fill();                          // Horizontal node module.
  g.fillStyle = '#bdbdbd'; g.fillRect(-12, 96, 24, 14);                                                          // Docking port (facing downward).
  g.restore();
};
const PORT = [0, -40 + 110];                                           // Docking port in photo-local coordinates (origin at photo center).
const p2Sprite = () => CL.photo('s04_iss', P2.w * S2, P2.h * S2, stationDraw, { border: P2.b * S2, cell: 9 });
// Cutout Dragon: RK.dragon flat fill → halftone → paper-white sticker border (16-direction expansion).
const DR = { s: 16, w: 3.9 * 16, h: (2.8 + 4.35) * 16 };
const dragonSprite = () => PAINT.cached('s04_dragon', 220 * S2, 300 * S2, (g) => {
  const src = PAINT.canvas(220 * S2, 300 * S2), sg = src.getContext('2d');
  RK.at(sg, 110 * S2, 150 * S2 + DR.h * S2 / 2, DR.s * S2, 0, q => RK.fill(q, RK.dragon({ trunk: true }), { body: '#ececec', trunk: '#b5b5b5', nose: '#dadada', window: '#202020', line: '#3a3a3a', lw: 0.12 }));
  const ht = CL.halftone('s04_dragon_ht', src, { cell: 7, paper: '#f1ede4', contrast: 1.35 });
  for (let a = 0; a < 16; a++) g.drawImage(ht, Math.cos(a / 16 * TAU) * 7 * S2, Math.sin(a / 16 * TAU) * 7 * S2);
  g.globalCompositeOperation = 'source-in'; g.fillStyle = '#f4f2ec'; g.fillRect(0, 0, g.canvas.width, g.canvas.height);
  g.globalCompositeOperation = 'source-over'; g.drawImage(ht, 0, 0);
});
const tile = () => CL.paperTile('s04desk', C.desk, { amt: 12, fibers: 320, fiberCol: [110, 95, 70], seed: 7 });

// ---------- Red threads ----------
const PIN_A = [PH.x + PH.w / 2 + PH.b / 2 + 6, PH.y - PH.h / 2 + 34];        // Photo's right border (outside inner frame, where the old frame overlays during transition).
const PIN_N1 = local(N1, -N1.w / 2 + 40, -N1.h / 2 + 36), PIN_N1R = local(N1, N1.w / 2 - 36, -N1.h / 2 + 40);
const PIN_C10 = local(C10, 0, -C10.h / 2 + 20), PIN_P2 = local(P2, -P2.w / 2 + 50, -P2.h / 2 - 2);
const mkStr = (a, b, sag) => { const pts = CL.stringPts(a, b, sag); return { a, b, pts, cum: DG.cum(pts) }; };
const STR1 = mkStr(PIN_A, PIN_N1, 0.12), STR2 = mkStr(PIN_N1R, PIN_C10, 0.06), STR3 = mkStr(PIN_C10, PIN_P2, 0.08);
const strAt = (S, q) => { const L = S.cum[S.cum.length - 1]; return { d: L * q, tip: DG.pointAt(S.pts, S.cum, L * q) }; };
const RCIRC = DG.hand(DG.ellipsePts(0, 0, 96, 74, -2.4, 1.1, 44), { amp: 2.2, seed: 13 }), RCIRC_L = DG.cum(RCIRC);

// ---------- Draw desktop ----------
const shadowed = CL.shadowed, placed = CL.placed;
const tag = (g, x, y, r, text, size, { bg = C.black, col = C.paper, padX = 22, h = size * 1.7, fam = F.heavy } = {}) => placed(g, x, y, r, (g) => {
  g.font = font(size, fam); const w = g.measureText(text).width + padX * 2;
  shadowed(g, () => { g.fillStyle = bg; g.fillRect(-w / 2, -h / 2, w, h); });
  g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, size * 0.04);
});
function drawDesk(g, cam, lt) {
  const st = step(lt);
  g.save(); CAM.apply(g, cam);
  g.fillStyle = g.createPattern(tile(), 'repeat'); g.fillRect(-1500, -1200, 6600, 3600);
  // —— Photo (previous segment) ——
  shadowed(g, () => { g.fillStyle = '#f2f0ea'; g.fillRect(PH.x - PH.w / 2 - PH.b, PH.y - PH.h / 2 - PH.b, PH.w + PH.b * 2, PH.h + PH.b * 2); });
  g.drawImage(snapshot(), PH.x - PH.w / 2, PH.y - PH.h / 2, PH.w, PH.h);
  tag(g, PH.x - 70, PH.y + PH.h / 2 + 58, -0.015, T.photoTag, 38);
  // —— Clipping ——
  placed(g, N1.x, N1.y, N1.r, (g) => {
    const sp = newsSprite(); shadowed(g, () => g.drawImage(sp, -N1.w / 2, -N1.h / 2, N1.w, N1.h));
    const o = [-N1.w / 2, -N1.h / 2];
    CL.highlight(g, o[0] + NEWS.hl1.x, o[1] + NEWS.hl1.y, NEWS.hl1.w, NEWS.hl1.h, MO.sineInOut(seg(st, hl1[0], hl1[0] + 0.75)));
    CL.highlight(g, o[0] + NEWS.hl2.x, o[1] + NEWS.hl2.y, NEWS.hl2.w, NEWS.hl2.h, MO.sineInOut(seg(st, hl2[0], hl2[0] + 0.85)));
  });
  // —— 2010 card ——
  placed(g, C10.x, C10.y, C10.r, (g) => shadowed(g, () => g.drawImage(c10Sprite(), -C10.w / 2, -C10.h / 2, C10.w, C10.h)));
  // —— Halftone photo: station + cutout Dragon ——
  placed(g, P2.x, P2.y, P2.r, (g) => {
    const sp = p2Sprite(), ww = P2.w + P2.b * 2, hh = P2.h + P2.b * 2;
    shadowed(g, () => g.drawImage(sp, -ww / 2, -hh / 2, ww, hh));
    CL.tape(g, ww / 2 - 70, -hh / 2 + 8, 0.45, 130);
    // Dragon approaches docking port from below in steps (12fps + slight attitude correction before docking).
    const q = clamp((st - tDragon) / (tDock - tDragon));
    if (q > 0) {
      const e = MO.smooth(q), dock = [PORT[0], PORT[1] + DR.h / 2 + 2];
      const x = lerp(-150, dock[0], e), y = lerp(P2.h / 2 + 150, dock[1], e) + (q >= 1 ? MO.settle(st - tDock, 3, 3, 6) : 0);
      const r = lerp(-0.32, 0, MO.smooth(q)) + (q < 1 ? 0.02 * Math.sin(st * 9) : 0);
      const ds = dragonSprite();
      g.save(); g.translate(x, y); g.rotate(r);
      shadowed(g, () => g.drawImage(ds, -110, -150, 220, 300), { blur: 8, x: 3, y: 5, col: 'rgba(0,0,0,.35)' });
      g.restore();
    }
    const cq = MO.cubicOut(seg(st, tCirc, tCirc + 0.6));                      // Red pen circles docking port (ends slightly overlap).
    if (cq > 0) { g.save(); g.translate(PORT[0], PORT[1] + 36); g.strokeStyle = C.red; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round'; DG.drawPartial(g, RCIRC, RCIRC_L, RCIRC_L[RCIRC_L.length - 1] * cq); g.restore(); }
  });
  // —— Red threads (drawn on twos; pins appear with the leading tip) ——
  const string = (S, t0, t1, tagText) => {
    const q = MO.sineInOut(seg(st, t0, t1)); if (q <= 0) return;
    const { d } = strAt(S, q); CL.string(g, S.pts, S.cum, d, { col: C.red, lw: 5 }); CL.pin(g, S.a[0], S.a[1], C.red); if (q >= 1) CL.pin(g, S.b[0], S.b[1], C.red);
    if (tagText && q > 0.5) { const m = DG.pointAt(S.pts, S.cum, S.cum[S.cum.length - 1] * 0.5); tag(g, m[0], m[1] + 44, 0.05, tagText, 36, { bg: '#f6f4ee', col: C.ink, fam: F.bold }); }
  };
  string(STR1, tStr1[0], tStr1[1], T.tag3);
  string(STR2, tStr2[0], tStr2[1]); string(STR3, tStr3[0], tStr3[1]);
  // —— Black label: 2012 slides with strip; next line types at 13 characters/sec ——
  CL.slideIn(g, lt, tLabel, LB.x, LB.y, LB.r, (g) => {
    shadowed(g, () => { g.fillStyle = C.black; g.save(); g.translate(-LB.w / 2, -LB.h / 2); CL.tornRect(g, LB.w, LB.h, 77, 3); g.fill(); g.restore(); });
    g.fillStyle = C.yel; g.font = font(78, F.num); g.textBaseline = 'alphabetic'; g.fillText(T.lbYear, -LB.w / 2 + 28, -LB.h / 2 + 92);
    g.fillStyle = C.paper; g.font = font(34, F.heavy);
    const n = TY.typedCount(st, tType, 13); let x = -LB.w / 2 + 30;
    [...T.lbText].forEach((ch, i) => { if (i < n) g.fillText(ch, x, LB.h / 2 - 30); x += g.measureText(ch).width; });
  }, { from: [-60, 380], tilt: -0.14, dur: 0.5 });
  g.restore();
}

const blurOn = lt => (lt > 1.0 && lt < 2.2) || (lt > pan2 && lt < pan2 + 1.3);

SCENES[ID] = {
  init() {
    const all = Object.values(T).join('');
    U.assertGlyphs(F.heavy, all, ID); U.assertGlyphs(F.bold, all, ID); U.assertGlyphs(F.med, T.l1a + T.l2a, ID); U.assertGlyphs(F.num, T.lbYear, ID);
  },
  draw(c, lt) {
    const cam = camAt(lt);
    const buf = PAINT.scratch('s04desk'), g = buf.getContext('2d'); g.reset();
    drawDesk(g, cam, lt);
    c.fillStyle = C.desk; c.fillRect(0, 0, W, H);
    if (blurOn(lt)) { const [vx, vy] = CAM.velocity(camAt, lt); CAM.motionBlur(c, buf, vx * 0.4, vy * 0.4, 7); } else c.drawImage(buf, 0, 0);
    finish(c);
  },
};
})();
