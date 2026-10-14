// SpaceX's 24 years · presenter-style finance/science single-style lin shared library window.LIN.
// Visual grammar only, no real-person likeness or channel branding: off-white paper + faint dots, cute flat infographic icons (even dark outline, flat fill, offset hard-shadow stickers),
// Keywords in colored rounded boxes/highlights, hand-drawn arrows/circles (8fps boil), one topic per screen; original cartoon presenter (AI frames) throughout film.
// Layering: scenes draw pages → engine page transitions → GLOBAL_OVERLAY draws 2002→2026 header timeline and presenter (global time, continuous across transitions).
(() => {
const W = 1920, H = 1080, TAU = Math.PI * 2;
const { clamp, lerp, rng } = U;

const C = { bg: '#F8F2E6', dot: '#E4DAC6', ink: '#2B2A33', sub: '#6E6878', mute: '#B9B2A6', white: '#FFFFFF', red: '#F25F5C', redD: '#C9413F',
  yel: '#FFD447', hl: 'rgba(255,214,64,0.78)', blue: '#4C8DF6', blueL: '#DCE9FF', teal: '#22B39C', tealL: '#D4F2EB', purple: '#8A72F0', pink: '#FF9BB0',
  orange: '#FF9F43', green: '#3CB371', gold: '#F7C948', goldD: '#D9961C', sea: '#5BAEF2', land: '#7DCB78', steel: '#E8ECF2', steelD: '#C5CCD8',
  tile: '#3A3F4B', mars: '#E8774A', marsD: '#C25A33', moon: '#E6E1D6', moonD: '#C9C2B4', cream: '#FFF8E7', shadow: 'rgba(43,42,51,0.14)' };
const F = (s, w = 'Heavy') => `${s}px "PuHui-${w}"`;

// ---------- Time ----------
const T0 = id => TIMING.seg[id].t0;
const popK = (lt, t0, d = 0.38, s = 2.2) => lt < t0 ? 0 : 0.3 + 0.7 * MO.backOut(clamp((lt - t0) / d), s);   // Overshoot pop-in starts at 30% size, not a noisy speck on first frame.
const inK = (lt, t0, d = 0.4, ease = MO.cubicOut) => ease(clamp((lt - t0) / d));
const outK = (lt, t0, d = 0.25) => MO.cubicIn(clamp((lt - t0) / d));                         // Exit faster than entrance.
const boil = (lt, seed) => rng(seed * 977 + Math.floor(lt * 8 + 1e-6));                         // Line art boils at 8fps.
// Is a character being spoken now? Check global character timings for mouth motion.
function speakingAt(T) {
  for (const id in TIMING.seg) { const s = TIMING.seg[id], lt = T - s.t0; if (lt < 0 || lt >= s.dur) continue;
    for (let i = 0; i < s.text.length; i++) { if ('，。、；'.includes(s.text[i])) continue; if (lt >= s.charStart[i] - 0.02 && lt < s.charEnd[i] + 0.04) return true; }
    return false; }
  return false;
}

// Time of nth occurrence of a word (zero-based).
function cueN(id, key, n = 0, end = false) { const s = TIMING.seg[id]; let i = -1; for (let k = 0; k <= n; k++) { i = s.text.indexOf(key, i + 1); if (i < 0) { console.error(`LIN.cueN: ${id} 里没有第 ${n + 1} 个「${key}」`); return 0; } }
  return end ? s.charEnd[i + key.length - 1] : s.charStart[i]; }

// ---------- Drawing helpers ----------
const rrp = (x, y, w, h, r) => { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; }, L_rrp = rrp;
function card(g, x, y, w, h, { fill = C.white, r = 26, lw = 4, sh = 8, stroke = C.ink } = {}) {
  const p = rrp(x, y, w, h, r);
  if (sh) { g.save(); g.translate(sh * 0.6, sh); g.fillStyle = C.shadow; g.fill(p); g.restore(); }
  g.fillStyle = fill; g.fill(p); if (lw) { g.lineWidth = lw; g.strokeStyle = stroke; g.lineJoin = 'round'; g.stroke(p); }
}
function at(g, x, y, k, fn, rot = 0) { if (k <= 0.001) return; g.save(); g.translate(x, y); g.rotate(rot); g.scale(k, k); fn(g); g.restore(); }
function txt(g, s, x, y, size, { w = 'Heavy', col = C.ink, align = 'left', base = 'alphabetic', ls = 0 } = {}) {
  g.font = F(size, w); g.fillStyle = col; g.textAlign = align; g.textBaseline = base; if (ls) g.letterSpacing = ls + 'px'; g.fillText(s, x, y); if (ls) g.letterSpacing = '0px';
}
const tw = (s, size, w = 'Heavy', g) => { const c = g || LIN._mc || (LIN._mc = document.createElement('canvas').getContext('2d')); c.font = F(size, w); return c.measureText(s).width; };
// Colored keyword box centered at (x,y).
function kw(g, s, x, y, { size = 48, fill = C.red, col = C.white, w = 'Heavy', padX = 26, h, r, lw = 4, sh = 6, align = 'center' } = {}) {
  const ww = tw(s, size, w, g) + padX * 2, hh = h || size * 1.62, x0 = align === 'left' ? x : align === 'right' ? x - ww : x - ww / 2;
  card(g, x0, y - hh / 2, ww, hh, { fill, r: r ?? hh * 0.32, lw, sh });
  txt(g, s, x0 + ww / 2, y + size * 0.05, size, { w, col, align: 'center', base: 'middle' });
  return ww;
}
// Highlighter sweeps left→right (p 0..1), with slightly shaky slanted edge.
function marker(g, x, y, w, h, p, col = C.hl, seed = 3) {
  if (p <= 0) return; const r = rng(seed), x1 = x + w * p;
  g.fillStyle = col; g.beginPath(); g.moveTo(x - 4, y + r() * 5); g.lineTo(x1, y - 2 + r() * 5); g.lineTo(x1 - 6, y + h + r() * 4); g.lineTo(x - 2, y + h - 3 + r() * 4); g.closePath(); g.fill();
}
function jitter(pts, r, amp) { return pts.map(([x, y]) => [x + (r() - 0.5) * 2 * amp, y + (r() - 0.5) * 2 * amp]); }
function strokePart(g, pts, frac) { if (frac <= 0) return; const cum = DG.cum(pts); DG.drawPartial(g, pts, cum, cum[cum.length - 1] * clamp(frac)); }
// Hand-drawn curved arrow (x0,y0)→(x1,y1); bend = arch height, p = draw progress.
function arrow(g, lt, x0, y0, x1, y1, p, { seed = 1, bend = 30, col = C.ink, lw = 7, head = 30, dash } = {}) {
  if (p <= 0) return;
  const r = boil(lt, seed), n = 18, pts = [], dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  for (let i = 0; i <= n; i++) { const u = i / n, b = Math.sin(Math.PI * u) * bend; pts.push([x0 + dx * u + nx * b, y0 + dy * u + ny * b]); }
  const jp = jitter(pts, r, 1.4);
  g.save(); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round'; if (dash) g.setLineDash(dash);
  strokePart(g, jp, p); g.setLineDash([]);
  if (p > 0.85) { const hk = clamp((p - 0.85) / 0.15), e = jp[n], a = Math.atan2(jp[n][1] - jp[n - 2][1], jp[n][0] - jp[n - 2][0]);
    g.beginPath(); for (const d of [-1, 1]) { g.moveTo(e[0], e[1]); g.lineTo(e[0] - Math.cos(a + d * 0.55) * head * hk, e[1] - Math.sin(a + d * 0.55) * head * hk); } g.stroke(); }
  g.restore();
}
// Hand-drawn rounded-rectangle superellipse, ends stay open.
function ring(g, lt, cx, cy, rx, ry, p, { seed = 7, col = C.red, lw = 8 } = {}) {
  if (p <= 0) return;
  const r = rng(seed), pts = [], a0 = -2.5, n = 72, sp = v => Math.sign(v) * Math.pow(Math.abs(v), 0.55);
  for (let i = 0; i <= n; i++) { const u = i / n, a = a0 + u * TAU * 1.08, k = 1 + 0.03 * Math.sin(u * 9 + r() * 0.3) + 0.04 * u; pts.push([cx + sp(Math.cos(a)) * rx * k, cy + sp(Math.sin(a)) * ry * k]); }
  g.save(); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round'; strokePart(g, jitter(pts, boil(lt, seed), 2), MO.cubicOut(clamp(p))); g.restore();
}
// Hand-drawn wavy underline.
function underline(g, lt, x, y, w, p, { col = C.red, lw = 7, seed = 5 } = {}) {
  if (p <= 0) return; const pts = []; for (let i = 0; i <= 20; i++) pts.push([x + w * i / 20, y + Math.sin(i * 1.1) * 4]);
  g.save(); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; strokePart(g, jitter(pts, boil(lt, seed), 1.5), p); g.restore();
}
function spark(g, x, y, r, col = C.yel) {
  if (r <= 0.5) return;
  g.save(); g.translate(x, y); g.fillStyle = col; g.strokeStyle = C.ink; g.lineWidth = 2.5; g.lineJoin = 'round';
  g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, rr = i % 2 ? r * 0.38 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  g.closePath(); g.fill(); g.stroke(); g.restore();
}
// Glint ring: n small stars around (x,y) sparkle in turn.
function twinkles(g, lt, pts, { r = 18, col = C.yel, speed = 1.4 } = {}) {
  pts.forEach(([x, y], i) => { const ph = (lt * speed + i * 0.37) % 1; spark(g, x, y, r * (0.55 + 0.45 * Math.sin(ph * TAU)), col); });
}
// Emphasis impact rays.
function burstLines(g, x, y, r0, r1, k, { n = 8, col = C.ink, lw = 6, a0 = 0 } = {}) {
  if (k <= 0 || k >= 1) return; const e = MO.cubicOut(k);
  g.save(); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.globalAlpha = 1 - clamp((k - 0.6) / 0.4);
  for (let i = 0; i < n; i++) { const a = a0 + i * TAU / n, ra = r0 + (r1 - r0) * e * 0.55, rb = r0 + (r1 - r0) * e;
    g.beginPath(); g.moveTo(x + Math.cos(a) * ra, y + Math.sin(a) * ra); g.lineTo(x + Math.cos(a) * rb, y + Math.sin(a) * rb); g.stroke(); }
  g.restore();
}
// Confetti bursts from (x,y); k = seconds since burst.
function confetti(g, x, y, k, { n = 46, seed = 9, spread = 620, up = 760, life = 2.2 } = {}) {
  if (k <= 0 || k > life) return; const r = rng(seed), cols = [C.red, C.yel, C.blue, C.teal, C.pink, C.purple, C.orange];
  g.save(); g.globalAlpha = 1 - clamp((k - life + 0.5) / 0.5);
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (r() - 0.5) * 2.4, v = 0.45 + r() * 0.75, vx = Math.cos(a) * spread * v, vy = Math.sin(a) * up * v;
    const px = x + vx * k * (1 - 0.35 * k / life), py = y + vy * k + 820 * k * k * 0.5, rot = r() * TAU + k * (r() - 0.5) * 14, col = cols[i % cols.length];
    if (py > 880) continue;   // Confetti disappears at subtitle band.
    g.save(); g.translate(px, py); g.rotate(rot); g.fillStyle = col; g.strokeStyle = C.ink; g.lineWidth = 2;
    if (i % 3 === 0) { g.beginPath(); g.arc(0, 0, 8, 0, TAU); g.fill(); g.stroke(); } else { g.beginPath(); g.rect(-11, -5, 22, 10); g.fill(); g.stroke(); }
    g.restore();
  }
  g.restore();
}
// Cartoon explosion (orange/yellow fireball + gray smoke); k = seconds since explosion.
function puff(g, x, y, k, { s = 1, seed = 4, smoke = true } = {}) {
  if (k <= 0 || k > 1.6) return; const r = rng(seed);
  g.save(); g.translate(x, y); g.scale(s, s); g.lineWidth = 4; g.strokeStyle = C.ink; g.lineJoin = 'round';
  const fire = MO.backOut(clamp(k / 0.28), 2.5) * (1 - clamp((k - 0.5) / 0.5)), sm = clamp(k / 0.5);
  if (smoke) for (let i = 0; i < 9; i++) { const a = r() * TAU, d = 50 + r() * 40, rr = (34 + r() * 26) * MO.cubicOut(sm) * (1 - clamp((k - 1.1) / 0.5));
    if (rr > 1) { g.beginPath(); g.arc(Math.cos(a) * d * sm, Math.sin(a) * d * sm - k * 30, rr, 0, TAU); g.fillStyle = '#D9D4CB'; g.fill(); g.stroke(); } }
  if (fire > 0.01) {
    const star = (R, col) => { g.beginPath(); for (let i = 0; i < 20; i++) { const a = i * TAU / 20, rr = (i % 2 ? 0.62 : 1) * R * (1 + 0.08 * Math.sin(i * 3.1)); g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fillStyle = col; g.fill(); g.stroke(); };
    star(110 * fire, C.orange); star(70 * fire, C.yel); g.beginPath(); g.arc(0, 0, 28 * fire, 0, TAU); g.fillStyle = C.white; g.fill();
  }
  g.restore();
}
// Touchdown dust: flat clouds on both sides spread/rise/fade; k = seconds since landing.
function dust(g, x, y, k, { spread = 260, seed = 7, n = 7 } = {}) {
  if (k <= 0 || k > 1.5) return; const r = rng(seed), e = MO.cubicOut(clamp(k / 1.2));
  g.save(); g.globalAlpha *= 0.75 * (1 - clamp((k - 0.5) / 1.0));
  for (let i = 0; i < n * 2; i++) { const d = i % 2 ? 1 : -1, u = r(), dx = d * (40 + spread * (0.4 + 0.6 * u) * e), dy = -12 - 50 * e * r(), rr = (16 + 22 * r()) * (0.6 + 0.9 * e);
    g.fillStyle = i % 3 ? '#E9E2D6' : '#DCD3C4'; g.beginPath(); g.arc(x + dx, y + dy, rr, 0, TAU); g.fill(); }
  g.restore();
}
// Stamp ✓ / ✗: k = seconds after stamp (large-to-small slam + vibration).
function stamp(g, kind, x, y, k, { s = 1, rot = -0.12 } = {}) {
  if (k <= 0) return; const e = k < 0.16 ? lerp(2.1, 1, MO.cubicIn(k / 0.16)) : 1 + MO.settle(k - 0.16, 0.08, 3, 7);
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s * e, s * e); g.globalAlpha = clamp(k / 0.08); g.lineCap = 'round'; g.lineJoin = 'round';
  const path = new Path2D();
  if (kind === 'x') { path.moveTo(-42, -42); path.lineTo(42, 42); path.moveTo(42, -42); path.lineTo(-42, 42); }
  else { path.moveTo(-50, 0); path.lineTo(-14, 36); path.lineTo(52, -40); }
  g.strokeStyle = C.ink; g.lineWidth = 34; g.stroke(path); g.strokeStyle = kind === 'x' ? C.red : C.green; g.lineWidth = 22; g.stroke(path);
  g.restore();
}

// ---------- Icons (origin at center, scale s) ----------
// Cute rocket: RK real-proportion outline widened sx times for icon look; thick outline, flat fill.
const PAL = { body: C.white, dark: C.tile, nose: C.white,   // Falcon 9 fairing is white; Falcon 1 icon (fins) uses red nose for distinction.
  window: C.blue, trunk: C.tile, flap: C.tile, engine: C.tile, tiles: C.tile, truss: C.tile };
function rocket(g, shape, x, y, pxm, { rot = 0, sx = 1.6, pal = {}, lw = 4, flame = 0, lt = 0, seed = 0, fins = false } = {}) {
  const P = { ...PAL, ...(fins ? { nose: C.red } : {}), ...pal };
  RK.at(g, x, y, pxm, rot, h => {
    h.scale(sx, 1);
    if (fins) { const w = shape.w / 2, fh = shape.h * 0.2; h.fillStyle = C.red; h.strokeStyle = C.ink; h.lineJoin = 'round'; h.lineWidth = lw / (pxm * Math.sqrt(sx));   // Iconic tail fins make small rocket recognizable.
      for (const d of [-1, 1]) { h.beginPath(); h.moveTo(d * w * 0.9, -fh); h.lineTo(d * w * 2.1, -fh * 0.25); h.lineTo(d * w * 2.1, 0.6); h.lineTo(d * w * 0.9, 0); h.closePath(); h.fill(); h.stroke(); } }
    if (flame > 0) RK.flame(h, 0, shape.a.base ? shape.a.base[1] : 1, shape.w * 2.2 * flame, shape.w * 0.75, lt, ['rgba(255,159,67,0.92)', 'rgba(255,212,71,0.96)', '#FFF6D8'], seed);
    for (const q of shape.parts) { const col = P[q.k] ?? P.body; if (!col) continue; h.fillStyle = col; h.fill(q.p);
      if (q.k === 'body' || q.k === 'nose') { h.save(); h.clip(q.p); h.fillStyle = 'rgba(43,42,51,0.10)'; h.fillRect(shape.w * 0.12, -400, shape.w, 800);   // Flat illustration's unlit side: right dark band gives body volume.
        h.fillStyle = 'rgba(255,255,255,0.55)'; h.fillRect(-shape.w * 0.36, -400, shape.w * 0.09, 800); h.restore(); } }
    h.lineJoin = 'round'; h.strokeStyle = C.ink;
    // Keep outline lw screen pixels (average approximation for nonuniform scale).
    h.lineWidth = lw / (pxm * Math.sqrt(sx));
    for (const q of shape.parts) if (q.k !== 'truss' && q.k !== 'tiles') h.stroke(q.p);
  });
}
const SH = {};
const shape = (k, o) => SH[k] || (SH[k] = o());
const F1 = () => shape('f1', () => RK.falcon1());
const F9 = (legs = 0, fins = 0, payload = 'fairing') => RK.falcon9({ legs, fins, payload });
const F9B = (legs = 0, fins = 0) => RK.falcon9({ legs, fins, stage: 'booster' });
// Starship: stainless-steel gray Ship.
const SS_PAL = { body: C.steel, nose: C.steel, dark: C.tile, flap: C.tile, engine: C.tile, tiles: C.tile };

function earth(g, x, y, R, lt, { spin = 30, k = 1 } = {}) {
  at(g, x, y, k, h => {
    h.save(); h.beginPath(); h.arc(0, 0, R, 0, TAU); h.fillStyle = C.sea; h.fill(); h.clip();
    const LW = 540, tex = landTex(), sc = R / 135, off = ((lt * spin) % LW + LW) % LW;
    h.scale(sc, sc); h.drawImage(tex, -135 - off, -135); h.drawImage(tex, -135 - off + LW, -135); h.scale(1 / sc, 1 / sc);
    h.fillStyle = 'rgba(43,62,120,0.16)'; h.beginPath(); h.arc(R * 0.35, R * 0.15, R * 1.05, 0, TAU); h.arc(-R * 0.2, -R * 0.1, R * 1.1, 0, TAU, true); h.fill('evenodd');
    h.restore();
    h.lineWidth = 4.5; h.strokeStyle = C.ink; h.beginPath(); h.arc(0, 0, R, 0, TAU); h.stroke();
    h.fillStyle = 'rgba(255,255,255,0.55)'; h.beginPath(); h.ellipse(-R * 0.48, -R * 0.5, R * 0.16, R * 0.08, -0.7, 0, TAU); h.fill();
  });
}
const landTex = () => PAINT.cached('lin_land', 540, 270, g => {
  g.lineWidth = 3; g.strokeStyle = C.ink; g.fillStyle = C.land; g.lineJoin = 'round';
  const blobs = [[60, 80, 46], [190, 150, 60], [300, 70, 38], [420, 190, 52], [500, 110, 40], [130, 230, 30], [350, 250, 34]];
  for (const [bx, by, br] of blobs) for (const off of [-540, 0, 540]) {
    g.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU, rr = br * (1 + 0.22 * Math.sin(a * 3 + bx) + 0.12 * Math.sin(a * 5 + by)); g.lineTo(bx + off + Math.cos(a) * rr, by + Math.sin(a) * rr * 0.8); }
    g.closePath(); g.fill(); g.stroke();
  }
});
function planet(g, x, y, R, { col = C.mars, colD = C.marsD, craters = 3, seed = 2, k = 1, rot = 0 } = {}) {
  at(g, x, y, k, h => {
    h.beginPath(); h.arc(0, 0, R, 0, TAU); h.fillStyle = col; h.fill();
    h.save(); h.clip(); const r = rng(seed); h.fillStyle = colD;
    for (let i = 0; i < craters; i++) { const a = r() * TAU + rot, d = r() * R * 0.6, rr = R * (0.1 + r() * 0.14); h.beginPath(); h.arc(Math.cos(a) * d, Math.sin(a) * d, rr, 0, TAU); h.fill(); }
    h.fillStyle = 'rgba(43,42,51,0.13)'; h.beginPath(); h.arc(R * 0.35, R * 0.2, R * 1.05, 0, TAU); h.arc(-R * 0.2, -R * 0.1, R * 1.1, 0, TAU, true); h.fill('evenodd'); h.restore();
    h.lineWidth = 4.5; h.strokeStyle = C.ink; h.beginPath(); h.arc(0, 0, R, 0, TAU); h.stroke();
  });
}
function sun(g, x, y, R, lt, k = 1) {
  at(g, x, y, k, h => {
    h.save(); h.rotate(lt * 0.4); h.fillStyle = C.orange; h.strokeStyle = C.ink; h.lineWidth = 4; h.lineJoin = 'round';
    h.beginPath(); for (let i = 0; i < 24; i++) { const a = i * TAU / 24, rr = i % 2 ? R * 1.12 : R * 1.36; h.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } h.closePath(); h.fill(); h.stroke(); h.restore();
    h.beginPath(); h.arc(0, 0, R, 0, TAU); h.fillStyle = C.yel; h.fill(); h.lineWidth = 4.5; h.strokeStyle = C.ink; h.stroke();
    h.fillStyle = 'rgba(255,255,255,0.6)'; h.beginPath(); h.ellipse(-R * 0.4, -R * 0.45, R * 0.18, R * 0.09, -0.7, 0, TAU); h.fill();
  });
}
function sat(g, x, y, k, tw = 0, rot = 0) {                    // Flat small satellite.
  if (k <= 0.001) return;
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(k, k); g.lineWidth = 2.5; g.strokeStyle = C.ink; g.lineJoin = 'round'; g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, -10); g.lineTo(0, -17); g.stroke(); g.fillStyle = C.red; g.beginPath(); g.arc(0, -18, 3, 0, TAU); g.fill(); g.stroke();
  for (const d of [-1, 1]) { const x0 = d < 0 ? -22 : 10; g.fillStyle = C.blue; g.fill(rrp(x0, -8, 12, 16, 2)); g.stroke(rrp(x0, -8, 12, 16, 2)); g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + 12, 0); g.stroke(); }
  g.fillStyle = C.steel; g.fill(rrp(-10, -10, 20, 20, 5)); g.stroke(rrp(-10, -10, 20, 20, 5));
  if (tw > 0) spark(g, 15, -15, 9 * tw, C.white);
  g.restore();
}
function iss(g, x, y, s = 1, rot = 0) {                        // Station: truss + four solar-array pairs + modules.
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.lineWidth = 3.5 / s * s; g.strokeStyle = C.ink; g.lineJoin = 'round';
  g.fillStyle = C.tile; g.fill(rrp(-150, -6, 300, 12, 4)); g.stroke(rrp(-150, -6, 300, 12, 4));
  for (const px of [-128, -84, 84, 128]) for (const d of [-1, 1]) { g.fillStyle = C.blue; const p = rrp(px - 17, d < 0 ? -92 : 10, 34, 82, 4); g.fill(p); g.stroke(p);
    g.beginPath(); for (let i = 1; i < 4; i++) { const yy = (d < 0 ? -92 : 10) + i * 20.5; g.moveTo(px - 17, yy); g.lineTo(px + 17, yy); } g.stroke(); }
  g.fillStyle = C.white; const m1 = rrp(-46, -20, 92, 40, 16); g.fill(m1); g.stroke(m1);
  const m2 = rrp(-16, 14, 32, 58, 12); g.fill(m2); g.stroke(m2);
  g.fillStyle = C.steelD; g.beginPath(); g.arc(0, 0, 9, 0, TAU); g.fill(); g.stroke();
  g.restore();
}
function capsule(g, x, y, s = 1, { rot = 0, crew = 0, flame = 0, lt = 0, cargo = false } = {}) {   // Flat Dragon: truncated-cone capsule + nose cover + window row + bottom heat shield, origin at base center; cargo = Cargo Dragon with trunk/two arrays.
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.lineWidth = 4; g.strokeStyle = C.ink; g.lineJoin = 'round';
  if (cargo) { for (const d of [-1, 1]) { g.fillStyle = C.blue; const p = rrp(d < 0 ? -190 : 62, 40, 128, 34, 4); g.fill(p); g.stroke(p); g.beginPath(); for (let i = 1; i < 4; i++) { const xx = (d < 0 ? -190 : 62) + i * 32; g.moveTo(xx, 40); g.lineTo(xx, 74); } g.stroke(); }
    g.fillStyle = C.white; g.fill(rrp(-56, 8, 112, 96, 6)); g.stroke(rrp(-56, 8, 112, 96, 6)); g.fillStyle = C.tile; g.fill(rrp(-56, 44, 112, 22, 3)); }
  if (flame) RK.flame(g, 0, cargo ? 104 : 4, 46 * flame, 30, lt);
  g.beginPath(); g.moveTo(-56, 0); g.lineTo(56, 0); g.lineTo(32, -96); g.lineTo(-32, -96); g.closePath(); g.fillStyle = C.white; g.fill(); g.stroke();
  g.beginPath(); g.moveTo(-32, -96); g.quadraticCurveTo(-30, -128, 0, -130); g.quadraticCurveTo(30, -128, 32, -96); g.closePath(); g.fillStyle = C.steel; g.fill(); g.stroke();   // Nose cover.
  g.lineWidth = 3; g.beginPath(); g.moveTo(-44, -48); g.lineTo(44, -48); g.stroke();                                  // Capsule seam.
  g.fillStyle = C.tile; for (const wx of [-27, -9, 9, 27]) { g.beginPath(); g.arc(wx, -70, 5.5, 0, TAU); g.fill(); }   // Small window row.
  g.lineWidth = 4; g.fillStyle = C.tile; g.fill(L_rrp(-58, -6, 116, 14, 6)); g.stroke(L_rrp(-58, -6, 116, 14, 6));
  g.restore();
}
function astro(g, x, y, s = 1) {                               // Astronaut icon: opaque helmet visor, no face.
  g.save(); g.translate(x, y); g.scale(s, s); g.lineWidth = 4; g.strokeStyle = C.ink; g.lineJoin = 'round';
  g.fillStyle = C.white; g.beginPath(); g.moveTo(-46, 70); g.quadraticCurveTo(-48, 10, 0, 8); g.quadraticCurveTo(48, 10, 46, 70); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = C.blue; g.fill(rrp(-14, 26, 28, 20, 5)); g.stroke(rrp(-14, 26, 28, 20, 5));
  g.beginPath(); g.arc(0, -24, 40, 0, TAU); g.fillStyle = C.white; g.fill(); g.stroke();
  g.beginPath(); g.ellipse(2, -22, 28, 21, 0, 0, TAU); g.fillStyle = C.tile; g.fill(); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(-8, -30, 9, 5, -0.5, 0, TAU); g.fill();
  g.restore();
}
function person(g, x, y, s = 1, col = C.mute) {                // Faceless human icon.
  g.save(); g.translate(x, y); g.scale(s, s); g.lineWidth = 4; g.strokeStyle = C.ink; g.fillStyle = col;
  g.beginPath(); g.moveTo(-40, 60); g.quadraticCurveTo(-42, 8, 0, 6); g.quadraticCurveTo(42, 8, 40, 60); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.arc(0, -24, 26, 0, TAU); g.fill(); g.stroke(); g.restore();
}
function coin(g, x, y, r = 42, th = 11) {
  g.lineWidth = 2.5; g.strokeStyle = C.ink; const ry = r * 0.31;
  g.beginPath(); g.ellipse(x, y, r, ry, 0, 0, Math.PI); g.lineTo(x - r, y - th); g.ellipse(x, y - th, r, ry, 0, Math.PI, 0, true); g.closePath(); g.fillStyle = C.goldD; g.fill(); g.stroke();
  g.beginPath(); g.ellipse(x, y - th, r, ry, 0, 0, TAU); g.fillStyle = C.gold; g.fill(); g.stroke();
  g.beginPath(); g.ellipse(x, y - th, r * 0.62, ry * 0.55, 0, 0, TAU); g.strokeStyle = 'rgba(43,42,51,0.35)'; g.lineWidth = 2; g.stroke();
}
function flatCoin(g, x, y, r = 30) {                           // Front-facing gold coin.
  g.save(); g.lineWidth = 3.5; g.strokeStyle = C.ink; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = C.gold; g.fill(); g.stroke();
  g.beginPath(); g.arc(x, y, r * 0.66, 0, TAU); g.strokeStyle = 'rgba(43,42,51,0.35)'; g.lineWidth = 2.5; g.stroke();
  g.font = F(r * 0.9, 'Black'); g.fillStyle = C.goldD; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('$', x, y + r * 0.04); g.restore();
}
// Calendar page (2026 upper red bar + large text), origin at center.
function calPage(g, top, big, col = C.red, unit = '', { w = 220, h = 220, bigSize } = {}) {
  const x = -w / 2, y = -h / 2;
  card(g, x, y, w, h, { r: 22 });
  g.save(); g.clip(rrp(x, y, w, h, 22)); g.fillStyle = col; g.fillRect(x, y, w, h * 0.29); g.restore();
  g.lineWidth = 4; g.strokeStyle = C.ink; g.beginPath(); g.moveTo(x, y + h * 0.29); g.lineTo(x + w, y + h * 0.29); g.stroke(); g.stroke(rrp(x, y, w, h, 22));
  for (const dx of [-w * 0.25, w * 0.25]) { g.fillStyle = C.white; g.fill(rrp(dx - 8, y - 18, 16, 36, 8)); g.stroke(rrp(dx - 8, y - 18, 16, 36, 8)); }
  txt(g, top, 0, y + h * 0.145 + 2, h * 0.155, { col: C.white, align: 'center', base: 'middle' });
  const bs = bigSize || h * (unit ? 0.47 : 0.42);
  if (unit) { const bw = tw(big, bs, 'Black', g), uw = tw(unit, h * 0.155, 'Bold', g), x0 = -(bw + uw + 6) / 2;
    txt(g, big, x0, y + h * 0.66, bs, { w: 'Black', base: 'middle' }); txt(g, unit, x0 + bw + 6, y + h * 0.82, h * 0.155, { w: 'Bold', col: C.sub }); }
  else txt(g, big, 0, y + h * 0.66, bs, { w: 'Black', align: 'center', base: 'middle' });
}
function stopwatch(g, x, y, R, frac, { col = C.red, k = 1 } = {}) {
  at(g, x, y, k, h => {
    h.lineWidth = 4.5; h.strokeStyle = C.ink; h.lineJoin = 'round';
    h.fillStyle = C.tile; h.fill(rrp(-16, -R - 30, 32, 22, 6)); h.stroke(rrp(-16, -R - 30, 32, 22, 6));
    h.beginPath(); h.arc(0, 0, R, 0, TAU); h.fillStyle = C.white; h.fill(); h.stroke();
    h.beginPath(); h.moveTo(0, 0); h.arc(0, 0, R - 12, -Math.PI / 2, -Math.PI / 2 + TAU * frac); h.closePath(); h.fillStyle = col; h.save(); h.globalAlpha *= 0.85; h.fill(); h.restore();
    for (let i = 0; i < 12; i++) { const a = i * TAU / 12; h.beginPath(); h.moveTo(Math.cos(a) * (R - 4), Math.sin(a) * (R - 4)); h.lineTo(Math.cos(a) * (R - 14), Math.sin(a) * (R - 14)); h.stroke(); }
    const a = -Math.PI / 2 + TAU * frac; h.lineWidth = 6; h.lineCap = 'round'; h.beginPath(); h.moveTo(0, 0); h.lineTo(Math.cos(a) * (R - 18), Math.sin(a) * (R - 18)); h.stroke();
    h.beginPath(); h.arc(0, 0, 8, 0, TAU); h.fillStyle = C.ink; h.fill();
  });
}
// Topic header: colored pill at upper left.
function pageTitle(g, lt, s, t0, { col = C.blue, x = 120, y = 104, size = 42, num } = {}) {
  const k = popK(lt, t0, 0.42, 1.8); if (k <= 0) return;
  const pk = LIN.CUR_T != null ? pushK(LIN.CUR_T) : 0; if (pk >= 0.98) return;   // Header moves aside on close-up to avoid clipping.
  g.save(); g.globalAlpha *= 1 - pk;
  at(g, x, y, k, h => {
    let ox = 0;
    if (num) { h.beginPath(); h.arc(30, 0, 30, 0, TAU); h.fillStyle = C.ink; h.fill(); txt(h, num, 30, 2, 32, { col: C.white, align: 'center', base: 'middle', w: 'Black' }); ox = 70; }
    kw(h, s, ox, 0, { size, fill: col, align: 'left', sh: 5 });
  }, 0.02 * Math.sin(lt * 1.6));
  g.restore();
}

// ---------- Background: off-white paper + cached faint dots + floating doodles ----------
const bgImg = () => PAINT.cached('lin_bg', W, H, g => {
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
  g.fillStyle = C.dot; for (let y = 30; y < H; y += 44) for (let x = 30; x < W; x += 44) { g.beginPath(); g.arc(x, y, 2.4, 0, TAU); g.fill(); }
  const r = rng(1107); g.fillStyle = 'rgba(120,100,70,0.05)'; for (let i = 0; i < 2600; i++) g.fillRect(r() * W, r() * H, 2, 2);
});
const DOODLE_POS = [[110, 200], [560, 92], [1860, 230], [1880, 470], [1856, 800], [700, 1000], [1240, 1010], [1600, 1000], [70, 560], [1030, 60], [1500, 160]];
function bg(g, lt, { seed = 2611, skip = [] } = {}) {
  g.drawImage(bgImg(), 0, 0);
  const r = rng(seed);
  g.save(); g.lineWidth = 3.5; g.lineCap = 'round'; g.lineJoin = 'round';
  DOODLE_POS.forEach(([x0, y0], i) => {
    const kind = Math.floor(r() * 4), s = 15 + r() * 12, ph = r() * TAU, col = [C.pink, C.yel, C.blue, C.teal][Math.floor(r() * 4)];
    if (skip.includes(i)) return;
    const x = x0 + 6 * Math.sin(lt * 0.9 + ph), y = y0 + 8 * Math.sin(lt * 1.3 + ph * 1.7);
    g.save(); g.translate(x, y); g.rotate(0.35 * Math.sin(lt * 0.7 + ph)); g.globalAlpha = 0.5; g.strokeStyle = col; g.fillStyle = col;
    if (kind === 0) { g.beginPath(); g.moveTo(-s, 0); g.lineTo(s, 0); g.moveTo(0, -s); g.lineTo(0, s); g.stroke(); }
    else if (kind === 1) { g.beginPath(); g.arc(0, 0, s * 0.7, 0, TAU); g.stroke(); }
    else if (kind === 2) { g.beginPath(); for (let k = 0; k <= 12; k++) g.lineTo(-s * 1.3 + k * s * 2.6 / 12, Math.sin(k * 1.3) * s * 0.35); g.stroke(); }
    else { g.globalAlpha = 0.42; spark(g, 0, 0, s * 0.9, col); }
    g.restore();
  });
  g.restore();
}
// Page camera: scale s around (cx,cy), then translate.
function cam(g, s, cx = W / 2, cy = H / 2, dx = 0, dy = 0) { g.translate(cx + dx, cy + dy); g.scale(s, s); g.translate(-cx, -cy); }

// ---------- Presenter (AI frames; code controls position, facing, frame changes, squash/rebound and material) ----------
const META = window.LIN_META || {};
const POSES = Object.keys(META);
(window.EXTRA_ASSETS = window.EXTRA_ASSETS || []).push(...POSES.flatMap(p => META[p].map(f => f.src)));
const BODY = 780;                                   // Uniform hat-to-feet height (sprite pixels).
const POSE_K = {}; for (const p of POSES) { const b = META[p].map(f => f.body).sort((a, b) => a - b); POSE_K[p] = BODY / b[Math.floor(b.length / 2)]; }
// Seated/bust crops align to standing hat→hip 530px / hat→chest 367px, keeping the same character size.
if (META.sit) POSE_K.sit = 530 / META.sit[0].body; if (META.bust) POSE_K.bust = 367 / META.bust[0].body;
const SHADOWS = {};
function shadowOf(src) {                            // Material: sticker-style offset hard shadow (14% ink).
  if (SHADOWS[src]) return SHADOWS[src];
  const im = window.IMG[src], c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
  const g = c.getContext('2d'); g.drawImage(im, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgb(43,42,51)'; g.fillRect(0, 0, c.width, c.height);
  return (SHADOWS[src] = c);
}
const CAST = [];                                    // Global keyframes (film seconds).
// cast(id, [{t, pose, fr, x, y, s, flip, walk}...]): t is segment-local seconds; walk>0 walks from previous position using walk frames.
function cast(id, keys) { const t0 = T0(id); for (const k of keys) CAST.push({ ...k, T: t0 + k.t, id }); CAST.sort((a, b) => a.T - b.T); }
const TALK = [1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1];
const WALK_FPS = 10;   // Switch only open/closed mouth at 8.5fps, keeping gesture from jittering with mouth.
const ALT = { stick: 1, present: 1, shrug: 1, lookup: 1, point: 1 };   // These poses have a different gesture in frame 3; switch gestures every 1.4s during speech.
const LIFT = { cheer: [0, 90, 0] };            // Jump frame's lift off ground (sprite pixels).
function presenterState(T) {
  let i = -1; for (let j = 0; j < CAST.length; j++) if (CAST[j].T <= T + 1e-9) i = j;
  if (i < 0) return null;
  const k = CAST[i], prev = CAST[i - 1] || k;
  const st = { pose: k.pose, x: k.x ?? 300, y: k.y ?? 908, s: k.s ?? 0.66, flip: !!k.flip, fr: k.fr ?? 'talk', T0: k.T, hide: !!k.hide, enter: k.enter };
  // Inherit position/size from previous keyframe when omitted.
  for (let j = i; j >= 0; j--) { if (CAST[j].x != null) { st.x = CAST[j].x; break; } }
  for (let j = i; j >= 0; j--) { if (CAST[j].s != null) { st.s = CAST[j].s; break; } }
  for (let j = i; j >= 0; j--) { if (CAST[j].y != null) { st.y = CAST[j].y; break; } }
  if (k.glide) {                                   // Sliding reposition/scale without walking: shrink into corner for large graphics, return afterward.
    let px = st.x, ps = st.s; for (let j = i - 1; j >= 0; j--) if (CAST[j].x != null) { px = CAST[j].x; break; }
    for (let j = i - 1; j >= 0; j--) if (CAST[j].s != null) { ps = CAST[j].s; break; }
    const u = MO.cubicInOut(clamp((T - k.T) / k.glide)); st.x = lerp(px, st.x, u); st.s = lerp(ps, st.s, u);
  }
  if (k.walk) {
    let px = st.x; for (let j = i - 1; j >= 0; j--) if (CAST[j].x != null) { px = CAST[j].x; break; }
    const u = clamp((T - k.T) / k.walk);
    if (u < 1) { st.walking = true; st.pose = 'walk'; st.flip = k.x < px; st.x = lerp(px, st.x, MO.sineInOut(u)); st.fr = 'walk'; st.wT = T - k.T; }
    else st.T0 = k.T + k.walk;
  }
  return st;
}
function presenterFrame(st, T) {
  const fr = META[st.pose], n = fr.length, dt = T - st.T0, f8 = Math.floor(T * 8.5 + 1e-6), wT = st.wT ?? dt;
  let fi = 0;
  if (st.fr === 'walk') fi = Math.floor(wT * WALK_FPS + 1e-6) % n;
  else if (st.fr === 'talk') { fi = speakingAt(T) ? TALK[f8 % TALK.length] : 0; if (fi === 1 && n > 2 && ALT[st.pose] && Math.floor(dt / 1.4) % 2 === 1) fi = 2; }
  else if (st.fr === 'cycle') fi = Math.floor(dt * 3 + 1e-6) % n;
  else if (st.fr === 'loop') fi = f8 % n;
  else if (st.fr === 'bounce') fi = [0, 1, 2, 1][Math.floor(T * 4 + 1e-6) % 4] % n;   // 4fps: happy jumping without twitching.
  else if (typeof st.fr === 'number') fi = Math.min(n - 1, st.fr);
  else if (Array.isArray(st.fr)) { const sq = st.fr; let v = sq[0]; for (const [tt, ff] of sq) if (dt >= tt) v = ff; fi = typeof v === 'number' ? v : 0; if (v === 'talk') fi = speakingAt(T) ? TALK[f8 % TALK.length] : 0; }
  return fi;
}
function drawFigure(g, st, T, alpha, withShadow) {
  const fr = META[st.pose], fi = presenterFrame(st, T), m = fr[fi], im = window.IMG[m.src]; if (!im) return;
  const dt = T - st.T0, wT = st.wT ?? dt, walking = st.walking || st.fr === 'walk', kk = POSE_K[st.pose] * st.s;
  const sq = walking ? 0 : MO.settle(dt, 0.1, 3, 6), pop = walking ? 1 : 0.93 + 0.07 * MO.backOut(clamp(dt / 0.16), 3);   // Pose change: shrink then pop + squash/rebound.
  const br = 1 + 0.007 * Math.sin(T * TAU / 1.7);                                         // Breathing.
  const talkBob = !walking && speakingAt(T) ? 0.012 * Math.abs(Math.sin(T * 8.5)) : 0;   // Gentle rhythmic body bounce during speech.
  const sway = walking ? 0 : 0.018 * Math.sin(T * 1.25 + 0.7) + 0.008 * Math.sin(T * 2.9);  // Standing stays alive with gentle rocking around feet.
  const bob = (walking ? -Math.abs(Math.sin(wT * WALK_FPS * Math.PI / (META.walk.length / 2))) * 7 : 0) - (LIFT[st.pose] ? LIFT[st.pose][fi] * st.s : 0);
  if (withShadow) { g.save(); g.globalAlpha *= alpha; g.fillStyle = 'rgba(43,42,51,0.12)'; g.beginPath(); g.ellipse(st.x, st.y + 6, 150 * st.s, 20 * st.s, 0, 0, TAU); g.fill(); g.restore(); }
  g.save(); g.translate(st.x, st.y + bob); g.rotate(sway); g.scale((st.flip ? -1 : 1) * kk * pop * (1 - sq * 0.5), kk * pop * (1 + sq + talkBob) * br);
  g.globalAlpha = 0.15 * alpha; g.drawImage(shadowOf(m.src), -m.ax + (st.flip ? -16 : 16), -m.ay + 10, m.w, m.h);   // Material: sticker-style offset hard shadow.
  g.globalAlpha = alpha; g.drawImage(im, -m.ax, -m.ay, m.w, m.h);
  g.restore();
}
// Reaction close-up: bust in sticker card replaces full-body presenter; actual shot-size change, not a camera push.
const BUSTS = [];
function bustCard(id, a, b, frames, { x = 70, y = 300, w = 520, h = 590 } = {}) { BUSTS.push({ a: T0(id) + a, b: T0(id) + b, frames: frames.map(([t, f]) => [T0(id) + t, f]), x, y, w, h }); }
function drawBust(g, T) {
  for (const B of BUSTS) { if (T < B.a || T > B.b || !META.bust) continue;
    const kin = MO.backOut(clamp((T - B.a) / 0.28), 2.2), kout = 1 - MO.cubicIn(clamp((T - (B.b - 0.18)) / 0.18)), k = Math.max(0, Math.min(kin, kout));
    let fi = B.frames[0][1]; for (const [t, f] of B.frames) if (T >= t) fi = f;
    if (fi === 'talk') fi = speakingAt(T) ? TALK[Math.floor(T * 8.5 + 1e-6) % TALK.length] : 0;
    const m = META.bust[fi], im = window.IMG[m.src]; if (!im) return true;
    g.save(); g.translate(B.x + B.w / 2, B.y + B.h); g.scale(k, k); g.rotate(-0.03 + 0.012 * Math.sin(T * 2));
    const rr = rrp(-B.w / 2, -B.h, B.w, B.h, 34);
    g.save(); g.translate(10, 12); g.fillStyle = C.shadow; g.fill(rr); g.restore();
    g.fillStyle = C.blueL; g.fill(rr);
    g.save(); g.clip(rr); const sc = (B.w * 0.98) / m.w, bob = speakingAt(T) ? 4 * Math.abs(Math.sin(T * 8.5)) : 0;
      g.drawImage(im, -m.w * sc / 2, -m.h * sc + 6 - bob, m.w * sc, m.h * sc); g.restore();
    g.lineWidth = 6; g.strokeStyle = C.ink; g.stroke(rr);
    g.restore(); return true; }
  return false;
}
function drawPresenter(g, T) {
  if (drawBust(g, T)) return;
  const st = presenterState(T); if (!st || st.hide || !META[st.pose]) return;
  // Smooth pose change: 0.12s crossfade + squash/rebound.
  const dt = T - st.T0, XF = 0;   // No dissolve: hard cut + pop.
  if (dt < XF && dt >= 0) { const pv = presenterState(st.T0 - 1e-4);
    if (pv && !pv.hide && META[pv.pose] && pv.pose !== st.pose && pv.pose !== 'walk' && st.pose !== 'walk' && Math.abs(pv.x - st.x) < 5) { const a = dt / XF; drawFigure(g, st, T, 1, true); drawFigure(g, pv, T, 1 - a, false); return; } }
  drawFigure(g, st, T, 1, true);
}

// ---------- Header timeline (2002 → 2026, global time) ----------
const TL = { x0: 1300, x1: 1700, y: 72, y0: 2002, y1: 2026 };
const yearX = y => lerp(TL.x0, TL.x1, (y - TL.y0) / (TL.y1 - TL.y0));
const YEARKEYS = [];                                // [T, year]
function year(id, keys) { const t0 = T0(id); for (const [lt, y] of keys) YEARKEYS.push([t0 + lt, y]); YEARKEYS.sort((a, b) => a[0] - b[0]); }
function yearAt(T) {
  let v = YEARKEYS.length ? YEARKEYS[0][1] : 2002, from = v, t = -9;
  for (let i = 0; i < YEARKEYS.length; i++) { if (YEARKEYS[i][0] <= T) { from = i ? YEARKEYS[i - 1][1] : YEARKEYS[i][1]; v = YEARKEYS[i][1]; t = YEARKEYS[i][0]; } }
  // Roll between nearby years (≤3); large jumps (2026→2002, 2019→now) replace directly, no backward roll.
  const big = Math.abs(v - from) > 5, u = big ? (T >= t ? 1 : 0) : MO.cubicInOut(clamp((T - t) / 0.35));
  return { y: lerp(from, v, u), target: v, moving: u > 0 && u < 1, since: T - t };
}
let HUD_ON = 0, HUD_OFF = 1e9;                                     // Global time when header appears (s01 title card folds in).
function hud(g, T) {
  if (T < HUD_ON) return;
  const k = clamp((T - HUD_ON) / 0.5) * (1 - clamp((T - HUD_OFF) / 0.4)), Y = yearAt(T);
  if (k <= 0) return;
  const x = yearX(Math.min(Y.y, 2026.6)), fut = Math.max(0, Y.y - 2026);
  g.save(); g.globalAlpha *= k;
  // Base card.
  card(g, TL.x0 - 150, TL.y - 34, TL.x1 - TL.x0 + 300, 68, { fill: 'rgba(255,255,255,0.92)', r: 34, lw: 3.5, sh: 5 });
  txt(g, '2002', TL.x0 - 62, TL.y + 1, 26, { w: 'Heavy', col: C.sub, align: 'right', base: 'middle' });
  g.save(); g.globalAlpha *= 1 - clamp((Y.y - 2025.2) / 0.4); txt(g, '2026', TL.x1 + 62, TL.y + 1, 26, { w: 'Heavy', col: C.sub, align: 'left', base: 'middle' }); g.restore();
  g.lineCap = 'round'; g.lineWidth = 8; g.strokeStyle = '#E7DFD0'; g.beginPath(); g.moveTo(TL.x0, TL.y); g.lineTo(TL.x1, TL.y); g.stroke();
  g.strokeStyle = C.red; g.beginPath(); g.moveTo(TL.x0, TL.y); g.lineTo(Math.min(x, TL.x1), TL.y); g.stroke();
  // Passed milestone dots.
  for (const yy of [2002, 2008, 2012, 2015, 2018, 2020, 2025, 2026]) { const px = yearX(yy), on = px <= x + 1;
    g.beginPath(); g.arc(px, TL.y, 6, 0, TAU); g.fillStyle = on ? C.red : C.white; g.fill(); g.lineWidth = 2.5; g.strokeStyle = C.ink; g.stroke(); }
  // Current position: moving year badge, slightly tilted in motion.
  const wob = Y.moving ? 0.12 * Math.sin(T * 30) : MO.settle(Y.since - 0.35, 0.12, 2.5, 5);
  g.save(); g.translate(x, TL.y); g.rotate(wob);
  const lab = fut > 0.5 ? '未来' : String(Math.round(Y.y));
  card(g, -48, -22, 96, 44, { fill: C.ink, r: 22, lw: 0, sh: 0 }); txt(g, lab, 0, 2, 28, { col: C.white, align: 'center', base: 'middle', w: 'Black' });
  g.restore();
  g.restore();
}

// ---------- Global overlay ----------
const FRONT = {};                                   // Segment id → (c, lt, T): objects drawn in front of presenter.
// Global close-up including presenter for highlights: push(id, start, end, factor, centerX, centerY).
const PUSHES = [];
function push(id, a, b, z, x = W / 2, y = H / 2, cut = false, then) { PUSHES.push({ a: T0(id) + a, b: T0(id) + b, z, x, y, cut, then: then && { ...then, t: T0(id) + then.t } }); }   // then: {t, z, x, y} adds another push halfway; cut = hard-cut reaction close-up (no push/pull).
function pushAt(T) { for (const p of PUSHES) { if (T < p.a || T > p.b) continue; if (p.cut) return { z: p.z, x: p.x, y: p.y }; const k = Math.min(MO.cubicInOut(clamp((T - p.a) / 0.45)), 1 - MO.cubicInOut(clamp((T - (p.b - 0.4)) / 0.4)));
  if (k > 0) { if (p.then && T > p.then.t) { const u = MO.cubicInOut(clamp((T - p.then.t) / 0.6)); return { z: lerp(1 + (p.z - 1) * k, p.then.z, u), x: lerp(p.x, p.then.x, u), y: lerp(p.y, p.then.y, u) }; }
    return { z: 1 + (p.z - 1) * k, x: p.x, y: p.y }; } } return null; }
function pushK(T) { for (const p of PUSHES) { if (T < p.a || T > p.b) continue; if (p.cut) return 1; const k = Math.min(MO.cubicInOut(clamp((T - p.a) / 0.45)), 1 - MO.cubicInOut(clamp((T - (p.b - 0.4)) / 0.4))); if (k > 0) return k; } return 0; }
let TMP = null;
// Header yields at highlight moments.
const HUD_HIDE = [];
function hudHide(id, a, b) { HUD_HIDE.push([T0(id) + a, T0(id) + b]); }
function hudVis(T) { let v = 1; for (const [a, b] of HUD_HIDE) v = Math.min(v, 1 - Math.min(clamp((T - a) / 0.25), clamp((b - T) / 0.25))); return v; }
window.GLOBAL_OVERLAY = (c, T) => {
  drawPresenter(c, T);
  let id = null; for (const k in TIMING.seg) { const s = TIMING.seg[k]; if (T >= s.t0 && T < s.t0 + s.dur) id = k; }
  if (id && FRONT[id]) FRONT[id](c, T - T0(id), T);
  const P = pushAt(T);
  if (P) { if (!TMP) { TMP = document.createElement('canvas'); TMP.width = W; TMP.height = H; }
    const t = TMP.getContext('2d'); t.clearRect(0, 0, W, H); t.drawImage(c.canvas, 0, 0);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = C.bg; c.fillRect(0, 0, W, H); c.translate(P.x, P.y); c.scale(P.z, P.z); c.translate(-P.x, -P.y); c.drawImage(TMP, 0, 0); c.restore(); }
  c.save(); c.globalAlpha = hudVis(T); if (c.globalAlpha > 0.01) hud(c, T); c.restore();
};

window.LIN = { W, H, TAU, C, F, T0, cueN, popK, inK, outK, boil, speakingAt, rrp, card, at, txt, tw, kw, marker, jitter, strokePart, arrow, ring, underline, spark, twinkles,
  burstLines, confetti, puff, stamp, dust, rocket, F1, F9, F9B, SS_PAL, earth, planet, sun, sat, iss, capsule, astro, person, coin, flatCoin, calPage, stopwatch, pageTitle,
  bg, cam, cast, year, yearX, FRONT, push, hudHide, pushK, bustCard, CUR_T: null, presenterState, setHud: T => { HUD_ON = T; }, setHudOff: T => { HUD_OFF = T; }, TL, META };
})();
