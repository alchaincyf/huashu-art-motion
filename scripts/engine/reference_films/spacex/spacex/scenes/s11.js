// S11 · Presenter-style finance explainer. Visual grammar only: off-white paper, cute flat infographic icons, rounded sticker cards with even dark outlines,
// Keywords in colorful rounded boxes/highlights, hand-drawn arrows/circles (8fps boil), big-head/small-body presenter at one side pointing to graphics; one topic per screen.
// Presenter = Huashu's cartoon likeness (method C, style 10): gpt-image generates four three-frame sprites in this flat style (point / present / show size / surprised hand raise),
// Green-screen keying and feet-center frame alignment (spacex/assets/s11_*); voiceover switches poses, 8.5fps mouth frames; code adds blinking, nodding, breathing, speech bounce and pose-change squash/rebound.
// Three screens: ① acquisition (SpaceX card swallows xAI card) → ② June listing, over $75bn raised (count settles + growing coin pile + largest-ever highlight)
//       → ③ September 28 Starship orbit (calendar tear, small Starship circles Earth, 26 satellites pop out and line up). All actions use TM.cue.
// Motif loops: drifting doodles, swaying header, presenter breath/mouth, sparkling coins, rotating Earth, flowing orbit dashes, floating/sparkling satellites, boiling circles.
(() => {
const W = 1920, H = 1080, ID = 's11';
const { clamp, lerp, rng } = U;
const TAU = Math.PI * 2;

// ---------- Presenter frames (registered before engine boot; paths relative to 代码工程/) ----------
// Four AI frame sets (s11_sheet_* generated, keyed, cut with feet-center alignment) + closed-eye variants *_b (skin-colored pupils + closed-eye arcs);
// Number-counting frames copied from Xiao Lin single-style count frames (in spacex/assets/s11_count_*; films are independent).
// m: ax/ay = feet center within frame; px/py = neck pivot for nodding head tile (py at chin bottom); k = size correction; nod = nod enabled; blink = closed-eye frames exist.
const SA = 'spacex/assets/';
const POSES = {
  point:   { n: 3, src: i => `${SA}s11_point_${i}.png`,   ax: 206, ay: 782, px: 237, py: 301, k: 1,    nod: 1, blink: 1 },
  present: { n: 3, src: i => `${SA}s11_present_${i}.png`, ax: 209, ay: 784, px: 241, py: 302, k: 1,    nod: 1, blink: 1 },
  big:     { n: 3, src: i => `${SA}s11_big_${i}.png`,     ax: 260, ay: 707, px: 280, py: 280, k: 1.11, nod: 0, blink: 1 },
  wow:     { n: 3, src: i => `${SA}s11_wow_${i}.png`,     ax: 258, ay: 855, px: 0, py: 0,     k: 1,    nod: 0, blink: 0 },
  count:   { n: 3, src: i => `spacex/assets/s11_count_${i}.png`, ax: 193, ay: 787, px: 194, py: 312, k: 1, nod: 0, blink: 0 },
};
const ALLFR = [];
for (const P of Object.values(POSES)) for (let i = 0; i < P.n; i++) { ALLFR.push(P.src(i)); if (P.blink) ALLFR.push(P.src(i).replace('.png', '_b.png')); }
(window.EXTRA_ASSETS = window.EXTRA_ASSETS || []).push(...ALLFR);

const C = { bg: '#F7F0E1', dot: '#E3D8C2', ink: '#2B2A33', sub: '#6E6878', white: '#FFFFFF', red: '#F25F5C', yel: '#FFD447',
  hl: 'rgba(255,222,77,0.85)', blue: '#4C8DF6', teal: '#22B39C', purple: '#8A72F0', pink: '#FF9BB0', orange: '#FF9F43',
  gold: '#F7C948', goldD: '#D9961C', sea: '#5BAEF2', seaD: '#3E8FD6', land: '#7DCB78', steel: '#E8ECF2', tile: '#3A3F4B' };
const F = (s, w = 'Heavy') => `${s}px "PuHui-${w}"`;

let Q = null;
const q = () => Q || (Q = {
  y26: TM.cue(ID, '2026年'), spx: TM.cue(ID, 'SpaceX'), sg: TM.cue(ID, '收购'), msk: TM.cue(ID, '马斯克'), xai: TM.cue(ID, 'xAI'),
  jun: TM.cue(ID, '6月上市'), ss: TM.cue(ID, '上市'), mz: TM.cue(ID, '募资'), n750: TM.cue(ID, '750亿美元'),
  zd: TM.cue(ID, '史上最大'), ycE: TM.end(ID, '一次上市'), d928: TM.cue(ID, '9月28号'), rg: TM.cue(ID, '星舰入轨'),
  fc: TM.cue(ID, '放出'), n26E: TM.end(ID, '26颗'), xyd: TM.cue(ID, '新一代'),
});

// ---------- Helpers ----------
const rrp = (x, y, w, h, r) => { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; };
// Flat sticker card: fill + dark outline + offset hard shadow.
function card(g, x, y, w, h, { fill = C.white, r = 26, lw = 4, sh = 8 } = {}) {
  const p = rrp(x, y, w, h, r);
  g.save(); g.translate(sh * 0.6, sh); g.fillStyle = 'rgba(43,42,51,0.14)'; g.fill(p); g.restore();
  g.fillStyle = fill; g.fill(p); g.lineWidth = lw; g.strokeStyle = C.ink; g.lineJoin = 'round'; g.stroke(p);
}
const popK = (lt, t0, d = 0.38, s = 2.2) => lt < t0 ? 0 : MO.backOut(clamp((lt - t0) / d), s);   // Pop-in (overshoot).
const outK = (lt, t0, d = 0.22) => MO.cubicIn(clamp((lt - t0) / d));                            // Exit faster than entrance.
function at(g, x, y, k, fn, rot = 0) { if (k <= 0.001) return; g.save(); g.translate(x, y); g.rotate(rot); g.scale(k, k); fn(g); g.restore(); }
function txt(g, s, x, y, size, { w = 'Heavy', col = C.ink, align = 'left', base = 'alphabetic' } = {}) {
  g.font = F(size, w); g.fillStyle = col; g.textAlign = align; g.textBaseline = base; g.fillText(s, x, y);
}
// Hand-drawn lines: slight point jitter with new seed at 8fps (line boil only, no full-screen resampling).
const boil = (lt, seed) => rng(seed * 977 + Math.floor(lt * 8 + 1e-6));
function jitter(pts, r, amp) { return pts.map(([x, y]) => [x + (r() - 0.5) * 2 * amp, y + (r() - 0.5) * 2 * amp]); }
function strokePart(g, pts, frac) { if (frac <= 0) return; const cum = DG.cum(pts); DG.drawPartial(g, pts, cum, cum[cum.length - 1] * clamp(frac)); }
function spark(g, x, y, r, col = C.yel) {          // Small four-corner glints.
  g.save(); g.translate(x, y); g.fillStyle = col; g.strokeStyle = C.ink; g.lineWidth = 2.5; g.lineJoin = 'round';
  g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, rr = i % 2 ? r * 0.38 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  g.closePath(); g.fill(); g.stroke(); g.restore();
}

// ---------- Background: off-white paper + cached faint dots + drifting doodles ----------
const bg = () => PAINT.cached('s11_bg', W, H, g => {
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
  g.fillStyle = C.dot; for (let y = 30; y < H; y += 44) for (let x = 30; x < W; x += 44) { g.beginPath(); g.arc(x, y, 2.4, 0, TAU); g.fill(); }
  const r = rng(1107); g.fillStyle = 'rgba(120,100,70,0.05)'; for (let i = 0; i < 2600; i++) g.fillRect(r() * W, r() * H, 2, 2);
});
const DOODLES = (() => { const r = rng(2611), pos = [[110, 120], [560, 90], [1860, 120], [1880, 420], [1860, 760], [640, 980], [1180, 1000], [1560, 990], [80, 520], [260, 60]];
  return pos.map(([x, y], i) => ({ x, y, k: i % 4, s: 16 + r() * 12, ph: r() * TAU, col: [C.pink, C.yel, C.blue, C.teal][(i + 1) % 4] })); })();
function doodles(g, lt) {
  g.save(); g.lineWidth = 3.5; g.lineCap = 'round'; g.lineJoin = 'round';
  for (const d of DOODLES) {
    const x = d.x + 6 * Math.sin(lt * 0.9 + d.ph), y = d.y + 8 * Math.sin(lt * 1.3 + d.ph * 1.7), a = 0.35 * Math.sin(lt * 0.7 + d.ph);
    g.save(); g.translate(x, y); g.rotate(a); g.globalAlpha = 0.55; g.strokeStyle = d.col; g.fillStyle = d.col; const s = d.s;
    if (d.k === 0) { g.beginPath(); g.moveTo(-s, 0); g.lineTo(s, 0); g.moveTo(0, -s); g.lineTo(0, s); g.stroke(); }
    else if (d.k === 1) { g.beginPath(); g.arc(0, 0, s * 0.7, 0, TAU); g.stroke(); }
    else if (d.k === 2) { g.beginPath(); for (let i = 0; i <= 12; i++) g.lineTo(-s * 1.3 + i * s * 2.6 / 12, Math.sin(i * 1.3) * s * 0.35); g.stroke(); }
    else { g.globalAlpha = 0.45; spark(g, 0, 0, s * 0.9, d.col); }
    g.restore();
  }
  g.restore();
}

// ---------- Presenter (AI frames; code controls position, frames, blinking, nodding, breathing, squash/rebound) ----------
// Voiceover-driven poses: acquisition → open-hand presentation; $75bn → arms wide showing amount (third frame thumbs-up); largest ever → surprised hand raise;
// Starship orbit → present toward Earth; 26 satellites → count; next-gen Starlink → present. Otherwise point to graphics.
const TALK = [1, 0, 1, 1, 0, 2, 2, 1, 0, 1, 2, 1];
function speaking(lt) {
  const s = TIMING.seg[ID];
  for (let i = 0; i < s.text.length; i++) { if ('，。、；'.includes(s.text[i])) continue; if (lt >= s.charStart[i] && lt < s.charEnd[i] + 0.05) return true; }
  return false;
}
const env = lt => { let k = 0; for (let j = 0; j < 6; j++) k += speaking(lt - j * 0.03) ? 1 : 0; return k / 6; };   // Speech envelope (debounced).
let SCHED = null;
const sched = () => SCHED || (SCHED = (() => { const Qv = q(); return [
  [-9, 'point'], [Qv.sg - 0.06, 'present'], [Qv.jun - 0.04, 'point'], [Qv.n750 - 0.1, 'big'], [Qv.zd - 0.05, 'wow'], [Qv.ycE + 0.12, 'point'],
  [Qv.rg - 0.06, 'present'], [TM.cue(ID, '26颗') - 0.06, 'count'], [Qv.xyd - 0.04, 'present']]; })());
const ACC = () => { const Qv = q(); return [Qv.y26, Qv.sg, Qv.jun, Qv.mz, Qv.d928, Qv.rg, Qv.xyd]; };   // Nodding accents.
const BLINKS = (() => { const r = rng(1111), a = []; for (let t = 0.9; t < 13; t += 1.9 + r() * 1.4) a.push(t); return a; })();
const PX = 330, PY = 902, PS = 0.74;
const headClip = (m, w, cut) => { const p = new Path2D(); p.rect(-10, -10, w + 20, 238); p.rect(-10, 228, m.px + 70 + 10, cut - 228); return p; };
function presenter(g, lt) {
  const S = sched(); let k = 0; while (k + 1 < S.length && lt >= S[k + 1][0]) k++;
  const pose = S[k][1], ts = S[k][0], m = POSES[pose];
  const f = (fps) => Math.floor(lt * fps + 1e-6), e = env(lt);
  let fi;
  if (pose === 'wow') fi = [0, 1, 2, 1][f(8.5) % 4];
  else if (pose === 'big') fi = [0, 1, 2, 2, 2, 1][f(6) % 6];
  else if (pose === 'count') fi = [0, 1, 2][f(4) % 3];
  else fi = e > 0.5 ? TALK[f(8.5) % TALK.length] : 0;
  const blink = m.blink && BLINKS.some(b => lt >= b && lt < b + 0.12);
  const im = window.IMG[blink ? m.src(fi).replace('.png', '_b.png') : m.src(fi)];
  const en = popK(lt, 0.18, 0.45, 1.8), sq = MO.settle(lt - ts, 0.08, 3, 6);
  const br = 1 + 0.014 * Math.sin(lt * TAU / 1.7), sway = 0.012 * Math.sin(lt * TAU / 2.6) + 0.01 * e * Math.sin(lt * TAU * 1.05);
  const hop = -4 * e * Math.abs(Math.sin(lt * TAU * 1.05));                        // Gentle body bounce while speaking.
  g.save(); g.fillStyle = 'rgba(43,42,51,0.13)'; g.beginPath(); g.ellipse(PX, PY + 4, 150 * en * (1 + 0.04 * hop / -4), 20 * en, 0, 0, TAU); g.fill(); g.restore();
  if (en <= 0.001 || !im) return;
  g.save(); g.translate(PX, PY + hop); g.rotate(sway); g.scale(PS * m.k * en * (1 - sq * 0.5), PS * m.k * en * (1 + sq) * br);
  if (m.nod) {
    let nod = 0.035 * e * Math.sin(lt * TAU * 2.1); for (const ta of ACC()) nod += MO.settle(lt - ta, 0.09, 2.2, 5);
    const cut = m.py, W2 = im.width;
    const body = new Path2D(); body.rect(-m.ax - 10, -m.ay - 10, W2 + 20, im.height + 20); body.addPath(headClip(m, W2, cut), new DOMMatrix().translate(-m.ax, -m.ay));
    g.save(); g.clip(body, 'evenodd'); g.drawImage(im, -m.ax, -m.ay); g.restore();            // Body (head tile removed).
    g.save(); g.translate(m.px - m.ax, cut - m.ay); g.rotate(nod); g.translate(0, 4 * Math.max(0, nod) / 0.09); g.translate(-m.px, -cut);
    g.clip(headClip(m, W2, cut + 7)); g.drawImage(im, 0, 0); g.restore();
  } else g.drawImage(im, -m.ax, -m.ay);
  g.restore();
}

// ---------- Header: 2026 ----------
function header(g, lt) {
  at(g, 790, 116, popK(lt, q().y26, 0.4), h => { card(h, -100, -32, 200, 64, { fill: C.red, r: 32, lw: 3.5, sh: 5 }); txt(h, '2026年', 0, 3, 38, { col: C.white, align: 'center', base: 'middle' }); },
    0.025 * Math.sin(lt * 1.7));
}

// ---------- Calendar (June → tear page → September 28) ----------
function calPage(g, top, big, col, unit) {
  card(g, -110, -110, 220, 220, { r: 22 });
  g.save(); g.clip(rrp(-110, -110, 220, 220, 22)); g.fillStyle = col; g.fillRect(-110, -110, 220, 64); g.restore();
  g.lineWidth = 4; g.strokeStyle = C.ink; g.beginPath(); g.moveTo(-110, -46); g.lineTo(110, -46); g.stroke(); g.stroke(rrp(-110, -110, 220, 220, 22));
  for (const x of [-56, 56]) { g.fillStyle = C.white; g.fill(rrp(x - 8, -128, 16, 36, 8)); g.stroke(rrp(x - 8, -128, 16, 36, 8)); }
  txt(g, top, 0, -76, 34, { col: C.white, align: 'center', base: 'middle' });
  if (unit) { txt(g, big, -14, 44, 104, { w: 'Black', align: 'center', base: 'middle' }); txt(g, unit, 62, 76, 34, { w: 'Bold', col: C.sub, align: 'center' }); }
  else txt(g, big, 0, 44, 92, { w: 'Black', align: 'center', base: 'middle' });
}
function calendar(g, lt) {
  const Qv = q(), k = popK(lt, Qv.jun, 0.42);
  at(g, 810, 292, k, h => {
    const fl = clamp((lt - Qv.d928) / 0.6);
    if (fl > 0) calPage(h, '9月', '28', C.blue, '号');
    if (fl < 1) {                                                 // June page tears from upper left, flips and falls offscreen.
      const e = MO.cubicIn(fl); h.save(); h.translate(-100, -100); h.rotate(-e * 1.1); h.translate(100 - e * 60, 100 + e * e * 700);
      h.globalAlpha = 1 - clamp((fl - 0.7) / 0.3); calPage(h, '2026', '6月', C.red); h.restore();
    }
  });
}

// ---------- Upper-right keyword box: listing → Starship orbit ----------
function upArrow(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s); g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = C.white;
  g.beginPath(); g.moveTo(-18, 14); g.lineTo(-4, -2); g.lineTo(6, 8); g.lineTo(20, -12); g.stroke();
  g.beginPath(); g.moveTo(8, -13); g.lineTo(21, -13); g.lineTo(21, 0); g.stroke(); g.restore();
}
function slot(g, lt) {
  const Qv = q(), k1 = popK(lt, Qv.ss, 0.36), o1 = outK(lt, Qv.d928 - 0.12);
  at(g, 950, 292, k1 * (1 - o1), h => { card(h, 0, -44, 200, 88, { fill: C.teal, r: 24 }); upArrow(h, 50, 0, 1.2); txt(h, '上市', 86, 3, 50, { col: C.white, base: 'middle' }); });
  at(g, 950, 292, popK(lt, Qv.rg, 0.36), h => { card(h, 0, -44, 270, 88, { fill: C.blue, r: 24 }); txt(h, '星舰入轨', 135, 3, 50, { col: C.white, align: 'center', base: 'middle' }); });
}

// ---------- Screen ①: acquisition ----------
function rocketIcon(g, x, y, s) {                // Generic flat rocket (no branding).
  g.save(); g.translate(x, y); g.scale(s, s); g.lineWidth = 3.5; g.strokeStyle = C.ink; g.lineJoin = 'round';
  const fin = (d) => { g.beginPath(); g.moveTo(d * 13, 10); g.lineTo(d * 30, 30); g.lineTo(d * 30, 40); g.lineTo(d * 13, 32); g.closePath(); g.fillStyle = C.red; g.fill(); g.stroke(); };
  fin(-1); fin(1);
  g.beginPath(); g.moveTo(0, -46); g.bezierCurveTo(22, -28, 16, 20, 13, 36); g.lineTo(-13, 36); g.bezierCurveTo(-16, 20, -22, -28, 0, -46); g.closePath(); g.fillStyle = C.steel; g.fill(); g.stroke();
  g.beginPath(); g.arc(0, -8, 8, 0, TAU); g.fillStyle = C.blue; g.fill(); g.stroke();
  g.restore();
}
function chipIcon(g, x, y, s) {                  // Generic AI chip icon.
  g.save(); g.translate(x, y); g.scale(s, s); g.lineWidth = 3.5; g.strokeStyle = C.ink; g.lineCap = 'round';
  for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(i * 14, -34); g.lineTo(i * 14, -42); g.moveTo(i * 14, 34); g.lineTo(i * 14, 42); g.moveTo(-34, i * 14); g.lineTo(-42, i * 14); g.moveTo(34, i * 14); g.lineTo(42, i * 14); g.stroke(); }
  card(g, -32, -32, 64, 64, { fill: C.purple, r: 12, lw: 3.5, sh: 0 });
  txt(g, 'AI', 0, 2, 28, { w: 'Black', col: C.white, align: 'center', base: 'middle' }); g.restore();
}
function handArrow(g, lt, x0, y0, x1, y1, p, seed) {
  if (p <= 0) return;
  const r = boil(lt, seed), n = 16, pts = [];
  for (let i = 0; i <= n; i++) { const u = i / n; pts.push([lerp(x0, x1, u), lerp(y0, y1, u) - Math.sin(Math.PI * u) * 26]); }
  const jp = jitter(pts, r, 1.6);
  g.save(); g.strokeStyle = C.ink; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round';
  strokePart(g, jp, p);
  if (p > 0.85) { const hk = clamp((p - 0.85) / 0.15), e = jp[n], a = Math.atan2(jp[n][1] - jp[n - 2][1], jp[n][0] - jp[n - 2][0]);
    g.beginPath(); for (const d of [-1, 1]) { g.moveTo(e[0], e[1]); g.lineTo(e[0] - Math.cos(a + d * 0.6) * 34 * hk, e[1] - Math.sin(a + d * 0.6) * 34 * hk); } g.stroke(); }
  g.restore();
}
function panelA(g, lt) {
  const Qv = q(), out = outK(lt, Qv.jun + 0.4, 0.25); if (out >= 1) return;
  g.save(); g.globalAlpha = 1 - out; g.translate(0, -50 * out);
  const sw = MO.cubicInOut(clamp((lt - (Qv.xai + 0.06)) / 0.42));        // Acquisition progress.
  g.save(); g.globalAlpha *= 1 - sw; handArrow(g, lt, 1070, 545, 1392, 545, MO.cubicOut(clamp((lt - Qv.sg) / 0.4)), 11); g.restore();
  at(g, 1231, 452, popK(lt, Qv.sg, 0.35), h => { card(h, -78, -34, 156, 68, { fill: C.yel, r: 20, lw: 3.5, sh: 5 }); txt(h, '收购', 0, 3, 42, { align: 'center', base: 'middle' }); });
  if (sw < 1) {                                                      // xAI card: pulled into SpaceX card, shrinks away (drawn behind it).
    const cx = lerp(1610, 870, sw), cy = 545 - Math.sin(Math.PI * sw) * 70, sc = lerp(1, 0.12, MO.cubicIn(sw));
    at(g, cx, cy, popK(lt, Qv.msk, 0.4) * sc, h => {
      card(h, -190, -115, 380, 230); chipIcon(h, 0, -48, 0.8);
      txt(h, 'xAI', 0, 46, 62, { align: 'center' }); txt(h, '马斯克的AI公司', 0, 92, 32, { w: 'Bold', col: C.sub, align: 'center' });
    }, -0.5 * sw);
  }
  const gulp = MO.settle(lt - (Qv.xai + 0.46), 0.09, 3, 6);
  at(g, 870, 545, popK(lt, Qv.spx, 0.4) * (1 + gulp), h => {
    card(h, -170, -115, 340, 230); rocketIcon(h, 0, -44, 1);
    txt(h, 'SpaceX', 0, 80, 60, { align: 'center' });
    at(h, 150, -112, popK(lt, Qv.xai + 0.46, 0.35, 2.6), b => { card(b, -66, -26, 132, 52, { fill: C.purple, r: 26, lw: 3.5, sh: 4 }); txt(b, '+ xAI', 0, 2, 32, { col: C.white, align: 'center', base: 'middle' }); }, 0.12);
  });
  g.restore();
}

// ---------- Screen ②: listing proceeds ----------
const STACKS = [{ x: 1562, n: 12 }, { x: 1662, n: 18 }, { x: 1762, n: 15 }], CB = 712, CT = 11;
function coin(g, x, y) {
  g.lineWidth = 2.5; g.strokeStyle = C.ink;
  g.beginPath(); g.ellipse(x, y, 42, 13, 0, 0, Math.PI); g.lineTo(x - 42, y - CT); g.ellipse(x, y - CT, 42, 13, 0, Math.PI, 0, true); g.closePath(); g.fillStyle = C.goldD; g.fill(); g.stroke();
  g.beginPath(); g.ellipse(x, y - CT, 42, 13, 0, 0, TAU); g.fillStyle = C.gold; g.fill(); g.stroke();
  g.beginPath(); g.ellipse(x, y - CT, 26, 7, 0, 0, TAU); g.strokeStyle = 'rgba(43,42,51,0.35)'; g.lineWidth = 2; g.stroke();
}
function coins(g, lt, cp) {
  for (const [si, s] of STACKS.entries()) {
    const f = s.n * cp, n = Math.floor(f + 1e-6), fr = f - n;
    for (let i = 0; i < n; i++) coin(g, s.x, CB - i * CT);
    if (fr > 0.02) { g.save(); g.globalAlpha = clamp(fr * 3); coin(g, s.x, CB - n * CT - (1 - MO.cubicOut(fr)) * 90); g.restore(); }
    if (cp > 0.98) {                                                   // Motif: top coins sparkle in turn.
      const ph = (lt * 0.9 + si * 0.37) % 1; if (ph < 0.3) spark(g, s.x + 22, CB - s.n * CT - 14, 14 * Math.sin(Math.PI * ph / 0.3), C.white);
    }
  }
}
function ringPts(cx, cy, rx, ry, seed) {        // Hand-drawn circle (rounded-rectangle superellipse fitting text box): ends stay open, with slight extra overlap.
  const r = rng(seed), pts = [], a0 = -2.5, n = 72, sp = (v) => Math.sign(v) * Math.pow(Math.abs(v), 0.5);
  for (let i = 0; i <= n; i++) { const u = i / n, a = a0 + u * TAU * 1.08, k = 1 + 0.025 * Math.sin(u * 9 + r() * 0.3) + 0.035 * u; pts.push([cx + sp(Math.cos(a)) * rx * k, cy + sp(Math.sin(a)) * ry * k]); }
  return pts;
}
const RING = ringPts(1058, 622, 420, 108, 7);
function panelB(g, lt) {
  const Qv = q(); if (lt < Qv.mz - 0.02) return; const out = outK(lt, Qv.d928 - 0.12, 0.25); if (out >= 1) return;
  g.save(); g.globalAlpha = 1 - out; g.translate(0, 50 * out);
  const a1 = MO.expoOut(clamp((lt - Qv.mz) / 0.35));
  g.save(); g.globalAlpha *= a1; txt(g, '募资超过', 724, 496 + 24 * (1 - a1), 50, { w: 'Bold', col: C.sub }); g.restore();
  const c0 = Qv.mz + 0.08, c1 = Qv.n750 + 0.42, cp = MO.expoOut(clamp((lt - c0) / (c1 - c0)));
  const v = Math.round(750 * cp), nk = popK(lt, c0, 0.35);
  // Largest ever: highlighter sweeps behind text first.
  const hk = MO.cubicOut(clamp((lt - Qv.zd - 0.12) / 0.32));
  if (hk > 0) { const r = rng(31); g.fillStyle = C.hl; g.beginPath(); g.moveTo(708, 796 + r() * 4);
    const x1 = 708 + 600 * hk; g.lineTo(x1, 790 + r() * 4); g.lineTo(x1 - 6, 858); g.lineTo(712, 862); g.closePath(); g.fill(); }
  at(g, 1110, 700, nk, h => { txt(h, String(v), 0, 0, 230, { w: 'Black', col: C.red, align: 'right' }); txt(h, '亿美元', 22, 0, 92); });
  coins(g, lt, cp);
  const bp = popK(lt, Qv.zd + 0.05, 0.36);
  at(g, 720, 840, bp, h => txt(h, '史上最大的一次上市', 0, 0, 62));
  const rp = clamp((lt - Qv.zd) / 0.42);
  if (rp > 0) { g.save(); g.strokeStyle = C.red; g.lineWidth = 8; g.lineCap = 'round'; g.lineJoin = 'round'; strokePart(g, jitter(RING, boil(lt, 5), 2.2), MO.cubicOut(rp)); g.restore();
    if (rp >= 1) for (const [i, [x, y]] of [[640, 520], [1490, 512], [1500, 735]].entries()) { const ph = (lt * 1.6 + i * 0.33) % 1; spark(g, x, y, 20 * (0.6 + 0.4 * Math.sin(ph * TAU)), C.yel); } }
  g.restore();
}

// ---------- Screen ③: Starship orbit + 26 satellites ----------
const EX = 1040, EY = 650, ER = 135, RX = 300, RY = 92, TILT = -0.14, CT_ = Math.cos(TILT), ST_ = Math.sin(TILT), OMEGA = TAU / 2.0;
const orbitAt = th => { const x = RX * Math.cos(th), y = RY * Math.sin(th); return [EX + x * CT_ - y * ST_, EY + x * ST_ + y * CT_]; };
const orbitVel = th => { const x = -RX * Math.sin(th), y = RY * Math.cos(th); return [x * CT_ - y * ST_, x * ST_ + y * CT_]; };
const SHIP = RK.ship(), SHIP_S = 1.75;
const TH0 = Math.PI;
function shipState(lt) {                          // → {x, y, rot, s, th, front, launching}
  const Qv = q(), tL = Qv.d928 + 0.6, tR = Qv.rg;
  if (lt < tR) {
    const e = MO.cubicInOut(clamp((lt - tL) / (tR - tL))), [ox, oy] = orbitAt(TH0), dx = ox - EX, dy = oy - EY, dl = Math.hypot(dx, dy);
    const sx = EX + dx / dl * ER * 0.8, sy = EY + dy / dl * ER * 0.8, [vx, vy] = orbitVel(TH0);
    const aOut = Math.atan2(dy, dx) + Math.PI / 2, aTan = Math.atan2(vy, vx) + Math.PI / 2;
    return { x: lerp(sx, ox, e), y: lerp(sy, oy, e), rot: lerp(aOut, aTan, MO.smooth(e)), s: lerp(0.55, 1, e), th: TH0, front: e > 0.6, launching: lt >= tL, burn: 1 };
  }
  const th = TH0 + OMEGA * (lt - tR), [x, y] = orbitAt(th), [vx, vy] = orbitVel(th);
  return { x, y, rot: Math.atan2(vy, vx) + Math.PI / 2, s: 1, th, front: Math.sin(th) > 0, launching: true, burn: clamp(1 - (lt - tR) / 0.4) };
}
function drawShip(g, st, lt) {
  if (!st.launching) return;
  const s = SHIP_S * st.s;
  RK.at(g, st.x, st.y, s, st.rot, h => {
    h.scale(1.45, 1); h.translate(0, 26);   // Rotate around rocket's midsection.
    if (st.burn > 0) RK.flame(h, 0, 2, 22 * st.burn, 8, lt, ['rgba(255,159,67,0.9)', 'rgba(255,212,71,0.95)', '#FFF6D8']);
    h.lineJoin = 'round';
    for (const p of SHIP.parts) { h.fillStyle = p.k === 'tiles' || p.k === 'flap' || p.k === 'engine' ? C.tile : C.steel; h.fill(p.p); }
    h.lineWidth = 2.6 / s; h.strokeStyle = C.ink; for (const p of SHIP.parts) if (p.k !== 'tiles') h.stroke(p.p);
  });
}
// Earth: ocean + horizontally repeating land texture (period = texture width).
const LANDW = ER * 4;
const landTex = () => PAINT.cached('s11_land', LANDW, ER * 2, g => {
  const r = rng(4242); g.lineWidth = 3; g.strokeStyle = C.ink; g.fillStyle = C.land; g.lineJoin = 'round';
  const blobs = [[60, 80, 46], [190, 150, 60], [300, 70, 38], [420, 190, 52], [500, 110, 40], [130, 230, 30], [350, 250, 34]];
  for (const [bx, by, br] of blobs) for (const off of [-LANDW, 0, LANDW]) {
    g.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU, rr = br * (1 + 0.22 * Math.sin(a * 3 + bx) + 0.12 * Math.sin(a * 5 + by)); g.lineTo(bx + off + Math.cos(a) * rr, by + Math.sin(a) * rr * 0.8); }
    g.closePath(); g.fill(); g.stroke();
  }
});
function earth(g, lt, k) {
  at(g, EX, EY, k, h => {
    h.save(); h.beginPath(); h.arc(0, 0, ER, 0, TAU); h.fillStyle = C.sea; h.fill(); h.clip();
    const off = (lt * 34) % LANDW, tex = landTex();
    h.drawImage(tex, -ER - off, -ER); h.drawImage(tex, -ER - off + LANDW, -ER);
    h.fillStyle = 'rgba(43,62,120,0.16)'; h.beginPath(); h.arc(ER * 0.35, ER * 0.15, ER * 1.05, 0, TAU); h.arc(-ER * 0.2, -ER * 0.1, ER * 1.1, 0, TAU, true); h.fill('evenodd');
    h.restore();
    h.lineWidth = 4.5; h.strokeStyle = C.ink; h.beginPath(); h.arc(0, 0, ER, 0, TAU); h.stroke();
    h.fillStyle = 'rgba(255,255,255,0.55)'; h.beginPath(); h.ellipse(-ER * 0.48, -ER * 0.5, 22, 11, -0.7, 0, TAU); h.fill();
  });
}
function orbitLine(g, lt, p, half) {             // half: 'back' upper half (behind Earth) / 'front' lower half.
  if (p <= 0) return;
  g.save(); g.strokeStyle = C.ink; g.globalAlpha = half === 'back' ? 0.35 : 0.6; g.lineWidth = 3.5; g.setLineDash([14, 12]); g.lineDashOffset = -lt * 40; g.lineCap = 'round';
  g.beginPath(); const a0 = half === 'back' ? Math.PI : 0, n = 40;
  for (let i = 0; i <= n; i++) { const u = i / n; if (u > p) break; const [x, y] = orbitAt(a0 + u * Math.PI); i ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.stroke(); g.restore();
}
function sat(g, x, y, k, tw) {                    // Flat satellite: body + two solar panels + small antenna.
  if (k <= 0.001) return;
  g.save(); g.translate(x, y); g.scale(k, k); g.lineWidth = 2.5; g.strokeStyle = C.ink; g.lineJoin = 'round'; g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, -10); g.lineTo(0, -17); g.stroke(); g.fillStyle = C.red; g.beginPath(); g.arc(0, -18, 3, 0, TAU); g.fill(); g.stroke();
  for (const d of [-1, 1]) { const x0 = d < 0 ? -22 : 10; g.fillStyle = C.blue; g.fill(rrp(x0, -8, 12, 16, 2)); g.stroke(rrp(x0, -8, 12, 16, 2));
    g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + 12, 0); g.stroke(); }
  g.fillStyle = C.steel; g.fill(rrp(-10, -10, 20, 20, 5)); g.stroke(rrp(-10, -10, 20, 20, 5));
  if (tw > 0) spark(g, 15, -15, 9 * tw, C.white);
  g.restore();
}
const NS = 26, emitT = i => q().fc + 0.1 + i * 0.038;
const slotXY = i => [990 + (i % 13) * 66, 398 + Math.floor(i / 13) * 66];
function panelC(g, lt) {
  const Qv = q(); if (lt < Qv.d928) return;
  const ek = popK(lt, Qv.d928 + 0.1, 0.45, 1.8), op = MO.cubicOut(clamp((lt - (Qv.d928 + 0.45)) / 0.55)), st = shipState(lt);
  orbitLine(g, lt, op, 'back');
  if (!st.front) drawShip(g, st, lt);
  earth(g, lt, ek);
  orbitLine(g, lt, op, 'front');
  if (st.front) drawShip(g, st, lt);
  // 26 satellites pop from ship's current position, arc to two rows at upper right.
  let n = 0;
  for (let i = 0; i < NS; i++) {
    const te = emitT(i); if (lt < te) continue; n++;
    const u = clamp((lt - te) / 0.5), e = MO.quintOut(u), s0 = shipState(te), [x1, y1] = slotXY(i);
    const cx = (s0.x + x1) / 2 + 40, cy = Math.min(s0.y, y1) - 140;
    const x = (1 - e) * (1 - e) * s0.x + 2 * (1 - e) * e * cx + e * e * x1, y = (1 - e) * (1 - e) * s0.y + 2 * (1 - e) * e * cy + e * e * y1;
    const bob = u >= 1 ? 2.5 * Math.sin(lt * 3 + i * 0.7) : 0, ph = (lt * 0.8 + i * 0.137) % 1;
    sat(g, x, y + bob, 1.22 * lerp(0.4, 1, MO.backOut(clamp(u * 1.6), 2)), u >= 1 && ph < 0.12 ? Math.sin(Math.PI * ph / 0.12) : 0);
  }
  // Count increases per satellite; last appears as the 26-satellite phrase ends.
  if (lt >= emitT(0)) at(g, 1640, 690, popK(lt, emitT(0), 0.3), h => { txt(h, String(n), 0, 0, 180, { w: 'Black', col: C.blue, align: 'right' }); txt(h, '颗', 14, 0, 76); });
  at(g, 1450, 775, popK(lt, Qv.xyd, 0.36), h => { card(h, 0, -40, 360, 80, { fill: C.yel, r: 22, lw: 3.5, sh: 5 }); txt(h, '新一代星链卫星', 180, 3, 44, { align: 'center', base: 'middle' }); });
}

SCENES[ID] = {
  init() {
    U.assertGlyphs('PuHui-Heavy', '2026年收购上市亿美元史上最大的一次星舰入轨颗新一代星链卫星SpaceX+xAI6月9月28号0123456789', ID);
    U.assertGlyphs('PuHui-Bold', '马斯克的AI公司募资超过号', ID);
    U.assertGlyphs('PuHui-Black', '0123456789AI月', ID);
    for (const k of ALLFR) if (!window.IMG[k]) console.error(`s11 讲解员帧没加载：${k}`);
  },
  draw(c, lt) {
    c.drawImage(bg(), 0, 0);
    doodles(c, lt);
    panelA(c, lt); panelB(c, lt); panelC(c, lt);
    calendar(c, lt); slot(c, lt); header(c, lt);
    presenter(c, lt);
  },
};
ERAS.find(e => e.id === ID).transition = { type: 'cardFlip', dur: 0.6, bg: C.bg };
})();
