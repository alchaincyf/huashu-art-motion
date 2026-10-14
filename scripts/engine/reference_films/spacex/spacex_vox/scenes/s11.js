// S11 · 2026: ① Two business cards, SpaceX and xAI · Musk's AI company; at acquisition, small card slides under large one and a staple snaps shut;
// ② Ticker tape prints SPCX 2026.06.12, then $75 billion in ransom-note style, each character from a different clipping slapped onto desk in turn (third highlight);
// ③ Largest IPO ever clipping headline highlighted and circled; ④ September 28, Starship orbit: camera slides back to opening cell (9.28 calendar and Starship photo),
//   26 satellite confetti dots leap one by one from photo into an arc — film's beginning and ending meet on this desk.
(() => {
const ID = 's11', V = VOX, C = V.C, F = V.F, PH = V.PH, TAU = Math.PI * 2;
const { clamp, lerp, rng } = U, seg = MO.seg, step = V.step;
const cell = V.cell(ID), X0 = cell.x, Y0 = cell.y, xy = (x, y) => ({ x: X0 + x, y: Y0 + y });
const cue = k => TM.cue(ID, k), G = k => V.cue(ID, k), t0 = V.t0(ID);
const T = { yr: '2026', sx: 'SpaceX', xa: 'xAI', xs: '马斯克的AI公司', buy: '收购', tape: 'SPCX  2026.06.12', ipo: '6月上市', over: '超过', unit: '亿美元', head: '史上最大的一次上市', kick: '2026.6', n26: '26颗', s26: '新一代星链卫星' };

// ① Business cards
const card = (key, title, sub, w, h, dark) => V.spr('s11' + key, w, h, (g) => {
  if (dark) { g.fillStyle = C.black; g.fillRect(0, 0, w, h); } else V.paper(g, w, h, 81 + w % 7, { col: '#f4f2ec', torn: false, age: 0.08 });
  V.text(g, title, 44, sub ? h / 2 + 10 : h / 2 + 36, 96, F.black, dark ? C.paper : C.ink);
  if (sub) V.text(g, sub, 46, h / 2 + 70, 38, F.bold, dark ? 'rgba(238,237,235,.75)' : C.ink2);
});
const CA = xy(600, 760), CB = xy(1180, 1120), tBuy = G('收购');
const ARW = V.handPts('s11arw', [[560, 300], [420, 250], [250, 175]], { amp: 1.5, seed: 3 });   // Within SpaceX card coordinates: from xAI card toward SpaceX card
V.item({ key: 's11date', ...xy(1080, 640), r: 0.04, z: 13, at: G('2026') - 0.1, enter: { drop: 0.25, dur: 0.25 }, draw(g, T_) { g.fillStyle = C.paper; g.save(); g.translate(-110, -34); CL.tornRect(g, 220, 68, 5, 2); g.fill(); g.restore(); V.typed(g, '2026.2', -84, 16, V.nTyped(T_, G('2026'), 10), 40, F.type, C.ink); } });
V.item({ key: 's11xai', x: CB.x, y: CB.y, r: 0.04, z: 11, at: G('收购') - 0.35, enter: { from: [460, 160], tilt: 0.2, dur: 0.4 }, draw(g, T_) {
  // At xAI: small card moves over, upper edge slips beneath SpaceX card (full name remains visible), staple closes
  const st = step(T_), q = MO.quartOut(clamp((st - G('xAI')) / 0.45)); g.save(); g.translate(-450 * q, -150 * q); g.rotate(-0.07 * q); V.blit(g, card('xa', T.xa, T.xs, 460, 230, true)); g.restore();
} });
V.item({ key: 's11sx', ...CA, r: -0.02, z: 12, at: t0 - 1, draw(g, T_) {
  V.blit(g, card('sx', T.sx, null, 560, 250, false));
  const st = step(T_), tS = G('xAI') + 0.45;
  // Acquisition: red arrow from xAI to SpaceX, label centered on shaft; retract arrow after insertion, binder-clip both cards together
  const tTuck = G('xAI') + 0.45;
  if (st >= tBuy && st < tTuck) { g.save(); g.rotate(0.02); V.pen(g, ARW, MO.cubicOut(seg(st, tBuy, tBuy + 0.45)), { lw: 9 }); if (st >= tBuy + 0.4) { const e = ARW.p[ARW.p.length - 1]; g.strokeStyle = C.red; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(e[0] + 34, e[1] - 4); g.lineTo(e[0], e[1]); g.lineTo(e[0] + 14, e[1] + 32); g.stroke(); } g.restore(); }
  if (st >= tBuy) { g.save(); g.translate(470, 170); g.rotate(-0.06); V.label(g, T.buy, 60, { bg: C.red2, n: V.nTyped(T_, tBuy, 8) }); g.restore(); }
  if (st >= tTuck) { const k = 1 + 0.35 * (1 - MO.quartOut(clamp((st - tTuck) / 0.25))); g.save(); g.translate(240, 140); g.rotate(-0.12); g.scale(k * 0.8, k * 0.8); V.blit(g, V.PROP('clip')); g.restore(); }
} });
// ② Ticker tape and ransom-note large number
const TP = xy(1300, 560), TW = 1500;
V.item({ key: 's11tape', ...TP, r: -0.015, z: 10, at: G('6月') - 0.2, draw(g, T_) {
  const st = step(T_), q = MO.quartOut(seg(st, G('6月') - 0.2, G('6月') + 0.35)), w = TW * q;
  g.save(); g.beginPath(); g.rect(-TW / 2 - 20, -80, w + 40, 160); g.clip();
  g.save(); g.translate(-TW / 2, -46); V.paper(g, TW, 92, 101, { col: '#efe9d6', torn: false, age: 0.1 }); g.restore();
  g.fillStyle = 'rgba(40,36,30,.3)'; for (let x = -TW / 2 + 20; x < TW / 2; x += 30) { g.beginPath(); g.arc(x, -36, 3, 0, TAU); g.arc(x, 36, 3, 0, TAU); g.fill(); }
  V.typed(g, T.tape, -TW / 2 + 40, 18, V.nTyped(T_, G('6月'), 16), 54, F.type, C.ink);
  g.restore();
  if (st >= G('上市') - 0.05) { g.save(); g.translate(TW / 2 - 210, 4); g.rotate(0.04); V.label(g, T.ipo, 58, { bg: C.red2, n: V.nTyped(T_, G('上市') - 0.05, 10) }); g.restore(); }
} });
const RN = [['7', 'n', -0.08], ['5', 'r', 0.06], ['0', 'b', -0.04]];
const glyphScrap = (ch, kind) => V.spr('s11rn' + ch, 200, 270, (g, w, h) => {
  g.save(); CL.tornRect(g, w, h, ch.charCodeAt(0), 6); g.clip();
  if (kind === 'n') { V.paper(g, w, h, 3, { torn: false, col: '#f1efe8' }); g.fillStyle = 'rgba(40,36,30,.18)'; for (let y = 20; y < h; y += 22) g.fillRect(10, y, w - 20, 6); }
  else { g.fillStyle = kind === 'r' ? C.red2 : C.black; g.fillRect(0, 0, w, h); }
  g.restore(); V.text(g, ch, w / 2, h - 34, 250, F.num, kind === 'n' ? C.ink : C.paper, 'center');
});
const unitScrap = () => V.spr('s11unit', 420, 150, (g, w, h) => { V.paper(g, w, h, 33, { col: '#f6f4ee' }); V.text(g, T.unit, w / 2, h / 2 + 38, 104, F.black, C.ink, 'center'); });
const RNP = xy(1600, 900), tN = [G('750'), G('750') + 0.13, G('750') + 0.25], tU = G('亿美元');
V.item({ key: 's11num', ...RNP, r: 0, z: 14, rad: 1200, at: G('超过') - 0.05, draw(g, T_) {
  const st = step(T_);
  g.save(); g.translate(-430, -170); g.rotate(-0.04); V.label(g, T.over, 50, { bg: C.card, col: C.ink, n: V.nTyped(T_, G('超过'), 10) }); g.restore();
  RN.forEach(([ch, kind, r], i) => { if (st < tN[i] - 0.02) return; const k = 1 + 0.45 * (1 - MO.quartOut(clamp((st - tN[i] + 0.02) / 0.17))); g.save(); g.translate(-330 + i * 205, 30 + (i % 2) * 18); g.rotate(r); g.scale(k, k); V.blit(g, glyphScrap(ch, kind)); g.restore(); });
  if (st >= tU - 0.02) { const k = 1 + 0.35 * (1 - MO.quartOut(clamp((st - tU + 0.02) / 0.17))); g.save(); g.translate(380, 100); g.rotate(0.05); g.scale(k, k); V.blit(g, unitScrap()); g.restore(); }
} });
// ③ Clipping headline
const NW = 980, NH = 300, N = xy(1450, 1420);
const news = () => V.spr('s11news', NW, NH, (g, w, h) => { V.paper(g, w, h, 107, { amp: 5 }); V.text(g, T.kick, 56, 66, 34, F.type, C.ink2); g.fillStyle = C.ink; g.fillRect(56, 84, w - 112, 3); V.serifBold(g, T.head, 56, 190, 92); g.fillStyle = 'rgba(40,36,30,.26)'; g.fillRect(56, 232, 760, 10); g.fillRect(56, 256, 640, 10); });
const HS = (() => { const g = PAINT.scratch('vxmeasure').getContext('2d'); return [V.span(g, T.head, '史上最大', 56, 92, F.serif), V.span(g, T.head, '最大', 56, 92, F.serif)]; })();
const NC = V.circle('s11big', 120, 70, 37);
V.item({ key: 's11news', ...N, r: 0.015, z: 12, at: G('是史上') - 0.35, enter: { from: [0, 380], tilt: 0.08, dur: 0.35 }, draw(g, T_) {
  V.blit(g, news()); g.save(); g.translate(-NW / 2, -NH / 2); const st = step(T_);
  V.hl(g, HS[0].x - 6, 112, HS[0].w + 12, 100, MO.sineInOut(seg(st, G('史上'), G('最大') + 0.25)));
  g.translate(HS[1].x + HS[1].w / 2, 160); V.pen(g, NC, MO.cubicOut(seg(st, G('一次上市'), G('一次上市') + 0.5)), { lw: 8 }); g.restore();
} });
// ④ Return to 9.28 cell: 26 satellites leap from Starship photo
const c01 = V.cell('s01'), SHIP = [c01.x + 1290, c01.y + 1385];
const SATS = (() => { const o = [], a = [c01.x + 1470, c01.y + 1480], m = [c01.x + 1830, c01.y + 1840], b = [c01.x + 2290, c01.y + 1560]; for (let i = 0; i < 26; i++) { const u = i / 25, v = 1 - u; o.push([v * v * a[0] + 2 * u * v * m[0] + u * u * b[0], v * v * a[1] + 2 * u * v * m[1] + u * u * b[1]]); } return o; })();
const tSat = [G('放出') + 0.05, G('颗') + 0.4];
V.item({ key: 's11sats', x: SHIP[0], y: SHIP[1], z: 30, rad: 1200, at: tSat[0], draw(g, T_) {
  const st = step(T_), n = Math.min(26, Math.floor((st - tSat[0]) / ((tSat[1] - tSat[0]) / 26)) + 1);
  g.save(); g.translate(-SHIP[0], -SHIP[1]); g.shadowColor = 'rgba(40,30,20,.35)'; g.shadowBlur = 4; g.shadowOffsetY = 3;
  for (let i = 0; i < n; i++) { const [x, y] = SATS[i], age = st - (tSat[0] + i * (tSat[1] - tSat[0]) / 26), k = 1 + 0.6 * (1 - clamp(age / 0.17)); g.fillStyle = '#f4f2ec'; g.beginPath(); g.arc(x, y, 15 * k, 0, TAU); g.fill(); g.fillStyle = C.red; g.beginPath(); g.arc(x, y, 6 * k, 0, TAU); g.fill(); }
  g.restore();
  if (st >= G('26颗') - 0.05) { g.save(); g.translate(900, -170); g.rotate(-0.04); V.label(g, T.n26, 90, { bg: C.red2, padX: 30 }); g.translate(-30, 110); V.label(g, T.s26, 50, { n: V.nTyped(T_, G('新一代'), 14) }); g.restore(); }
} });

// ---------- Camera ----------
const at = (x, y, z, sy) => V.at(X0 + x, Y0 + y, z, sy);
const back = cue('9月') - 0.45, pushA = cue('星舰') - 0.4, ins0 = cue('入轨') - 0.08;
const cam0 = (lt) => CAM.at([
  V.key(0, at(710, 865, 0.99)),                                 // Entrance: business-card shot slapped onto desk (vox_slap)
  V.key(0.45, at(720, 870, 1.0), MO.sineInOut),
  V.key(cue('xAI') + 0.2, at(780, 900, 1.13), MO.sineInOut),          // Slow push toward both cards
  V.key(cue('6月') - 0.15, at(780, 895, 1.12), MO.sineInOut),
  V.key(cue('6月') + 0.35, at(1300, 790, 0.98), MO.cubicInOut),
  V.key(cue('是史上') - 0.25, at(1320, 800, 1.04), MO.sineInOut),
  V.key(cue('是史上') + 0.2, at(1450, 1360, 1.12), MO.cubicInOut),
  V.key(back, at(1460, 1365, 1.18), MO.sineInOut),
  V.key(back + 0.8, V.at(SHIP[0] + 300, SHIP[1] - 20, 1.0), MO.cubicInOut),      // Slide back to opening cell (whip pan and motion blur): 9.28 calendar and Starship photo
  V.key(TM.dur(ID), V.at(SHIP[0] + 300, SHIP[1] - 20, 1.04), MO.sineInOut),
], lt);
const cam = (lt) => { const b = cam0(lt); if (lt < pushA) return b; return CAM.pushTo(b, SHIP[0], SHIP[1], 5.2, MO.sineInOut(seg(lt, pushA, ins0))); };
// ---------- Insert: fill frame with Starship photo → hard-cut to large scan: Starship in orbit, red pen draws orbit, 26 satellites released behind it one by one (fourth highlight, hold to segment end) ----------
const OW = 1700, OH = 950, OC = [OW * 0.16, OH * 1.75], OS = [OW * 0.6, OH * 0.36], ORB = Math.hypot(OS[0] - OC[0], OS[1] - OC[1]), OA = Math.atan2(OS[1] - OC[1], OS[0] - OC[0]);
const orbitDraw = (g, w, h) => {
  g.fillStyle = '#0f0f0f'; g.fillRect(0, 0, w, h); PH.stars(g, w, h, 33, 140);
  PH.earthLimb(g, OC[0], OC[1], ORB * 0.84, 17);
  PH.glow(g, OS[0], OS[1], 70, 0.5);
  PH.rocket(g, RK.ship(), OS[0], OS[1], h / 112, OA);
};
const OP = V.handPts('s11orbit', DG.arcPts(OC[0] - OW / 2, OC[1] - OH / 2, ORB, ORB, OA - 0.55, OA + 0.5, 70), { amp: 2, seed: 4 });
const tSat2 = [cue('放出') + 0.05, cue('颗') + 0.45];
const insertShot = (c, lt) => {
  const sp = V.photo('s11orb', OW, OH, orbitDraw, { cell: 8, border: 22, S: 1 }), d = TM.dur(ID) - ins0;
  V.insert(c, sp, lt - ins0, { z0: 0.95, z1: 0.99, d, bg: C.desk, sy: -75 });
  const z = lerp(0.95, 0.99, MO.sineInOut(clamp((lt - ins0) / d))), st = step(lt);
  c.save(); c.translate(960, 465); c.scale(z, z);
  V.pen(c, OP, MO.cubicOut(seg(st, ins0 + 0.1, ins0 + 0.75)), { lw: 9 });
  // Satellites: released one by one along orbit behind Starship (12fps)
  const n = Math.min(26, Math.max(0, Math.floor((st - tSat2[0]) / ((tSat2[1] - tSat2[0]) / 26)) + 1));
  for (let i = 0; i < n; i++) { const a = OA + 0.13 + i * 0.0135, rr = ORB + 30 + (i % 2) * 14, x = OC[0] - OW / 2 + Math.cos(a) * rr, y = OC[1] - OH / 2 + Math.sin(a) * rr, age = st - (tSat2[0] + i * (tSat2[1] - tSat2[0]) / 26), k = 1 + 0.6 * (1 - clamp(age / 0.17));
    c.fillStyle = '#f4f2ec'; c.beginPath(); c.arc(x, y, 11 * k, 0, TAU); c.fill(); c.fillStyle = C.red; c.beginPath(); c.arc(x, y, 4.5 * k, 0, TAU); c.fill(); }
  c.restore();
  c.save(); c.translate(400, 150); c.rotate(-0.03); V.label(c, '2026.9.28 · 入轨', 60, { fam: F.heavy, n: TY.typedCount(st, ins0 + 0.05, 14) }); c.restore();
  if (st >= cue('26颗') - 0.05) { c.save(); c.translate(1420, 230); c.rotate(-0.04); const k = 1 + 0.3 * (1 - MO.quartOut(clamp(step(lt - cue('26颗') + 0.05) / 0.25))); c.scale(k, k); V.label(c, T.n26, 110, { bg: C.red2, padX: 34 }); c.translate(-20, 130); V.label(c, T.s26, 54, { n: TY.typedCount(st, cue('新一代'), 14) }); c.restore(); }
};
V.warm.push(() => V.photo('s11orb', OW, OH, orbitDraw, { cell: 8, border: 22, S: 1 }));
ERAS.find(e => e.id === ID).transition = { type: 'vox_slap', dur: 0.5, punch: 0 };
V.scene(ID, { cam, shots: [{ t: 0 }, { t: ins0, fn: insertShot }], init() { V.glyphs(ID, [[F.num, '750'], [F.black, T.sx + T.xa + T.unit], [F.bold, T.xs], [F.heavy, T.buy + T.ipo + T.over + T.n26 + T.s26 + '2026.9.28 · 入轨'], [F.type, T.tape + T.kick + '2026.2'], [F.serif, T.head]]); } });
})();
