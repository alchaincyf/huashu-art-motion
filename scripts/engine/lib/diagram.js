// Diagrams/morphs DG: point lists, draw-on, reveal masks, hand-drawn jitter, manim Transform / Write, whiteboard stroke timeline and following pen,
// Neural networks (neurons/connections/signals), Indicate / Circumscribe / braces, 3b1b palette.
// Convention: pts = [[x,y],...]; cum = DG.cum(pts) cumulative arc length; drawn distance always uses arc length. All randomness seeded.
(() => {
let W = 1920, H = 1080; U.onStage((w, h) => { W = w; H = h; });   // Canvas dimensions follow U.setStage (default 1920×1080)
const { clamp, lerp, rng } = U;
const DG = window.DG = {};

// ---------- Point lists ----------
DG.cum = pts => { const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return L; };
DG.len = pts => { const L = DG.cum(pts); return L[L.length - 1]; };
// Point at arc length d on polyline
DG.pointAt = (pts, cum, d) => {
  if (d <= 0) return pts[0]; const n = pts.length; if (d >= cum[n - 1]) return pts[n - 1];
  let lo = 0, hi = n - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] < d) lo = m; else hi = m; }
  const q = (d - cum[lo]) / (cum[hi] - cum[lo] || 1); return [lerp(pts[lo][0], pts[hi][0], q), lerp(pts[lo][1], pts[hi][1], q)];
};
// Draw-on: first d length of polyline (current strokeStyle/lineWidth), returns pen tip; whiteboards, red circles, red connections.
DG.drawPartial = (c, pts, cum, d) => {
  const n = pts.length; if (d <= 0 || n < 2) return pts[0];
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
  let i = 1; for (; i < n && cum[i] <= d; i++) c.lineTo(pts[i][0], pts[i][1]);
  let tip = pts[n - 1];
  if (i < n) { tip = DG.pointAt(pts, cum, d); c.lineTo(tip[0], tip[1]); }
  c.stroke(); return tip;
};
// Transform points: translation (dx,dy), scale s
DG.xform = (pts, dx, dy, s = 1) => pts.map(([x, y]) => [dx + x * s, dy + y * s]);
// Elliptical arc points (a0→a1)
DG.arcPts = (cx, cy, rx, ry, a0, a1, n = 24) => { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; };
// Hand-drawn circle: starts a0, turns revolutions (>1 slightly crosses endpoints like a real pen)
DG.ellipsePts = (cx, cy, rx, ry, a0 = -Math.PI / 2, turns = 1.08, n = 64) => DG.arcPts(cx, cy, rx, ry, a0, a0 + turns * Math.PI * 2, n);
// Hand-drawn jitter: Catmull-Rom densification plus seeded low-frequency jitter (static, no boiling; completed whiteboard lines stay still)
DG.hand = (pts, { per = 8, amp = 1.6, seed = 1, freq = 0.035 } = {}) => {
  const d = KIT.densify(pts, per), r = rng(seed), ph = r() * 100;
  return KIT.resample(d, 3).map(([x, y], i) => [x + PAINT.noise(i * freq + ph, 3.1) * amp * 2, y + PAINT.noise(i * freq + ph, 7.7) * amp * 2]);
};
// Reveal mask: turn first d length of polyline into consistently wound rectangular segments (square caps extended w/2), combine into Path2D for clipping.
// VideoScribe Reveal: zigzag strokes reveal image top-to-bottom, also used for writing. Consistent winding prevents overlapping nonzero cancellation.
DG.revealMask = (pts, cum, d, w) => {
  const p = new Path2D(), h = w / 2;
  for (let i = 1; i < pts.length && cum[i - 1] < d; i++) {
    const a = pts[i - 1], b0 = pts[i], L = cum[i] - cum[i - 1]; if (L <= 0) continue;
    const q = Math.min(1, (d - cum[i - 1]) / L), b = [a[0] + (b0[0] - a[0]) * q, a[1] + (b0[1] - a[1]) * q];
    const ux = (b0[0] - a[0]) / L, uy = (b0[1] - a[1]) / L, nx = -uy * h, ny = ux * h;
    const A = [a[0] - ux * h, a[1] - uy * h], B = [b[0] + ux * h, b[1] + uy * h];
    p.moveTo(A[0] + nx, A[1] + ny); p.lineTo(B[0] + nx, B[1] + ny); p.lineTo(B[0] - nx, B[1] - ny); p.lineTo(A[0] - nx, A[1] - ny); p.closePath();
  }
  return p;
};
// Zigzag reveal path: rows passes top-to-bottom in (x,y,w,h)
DG.zigzag = (x, y, w, h, rows) => { const o = []; for (let r = 0; r <= rows; r++) { const yy = y + h * r / rows; o.push(r % 2 ? [x + w, yy] : [x, yy]); } return o; };

// ---------- manim Transform: matching point counts and aligned starts (upper-left, clockwise) allow pointwise interpolation ----------
DG.rectPts = (cx, cy, w, h, n = 64) => {
  const per = 2 * (w + h), out = [];
  for (let i = 0; i < n; i++) {
    let d = i / n * per; let x, y;
    if (d < w) { x = cx - w / 2 + d; y = cy - h / 2; }
    else if ((d -= w) < h) { x = cx + w / 2; y = cy - h / 2 + d; }
    else if ((d -= h) < w) { x = cx + w / 2 - d; y = cy + h / 2; }
    else { d -= w; x = cx - w / 2; y = cy + h / 2 - d; }
    out.push([x, y]);
  }
  return out;
};
DG.circlePts = (cx, cy, r, n = 64) => { const out = []; for (let i = 0; i < n; i++) { const a = -3 * Math.PI / 4 + i / n * 2 * Math.PI; out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return out; };
DG.morph = (A, B, p) => A.map((a, i) => [lerp(a[0], B[i][0], p), lerp(a[1], B[i][1], p)]);
DG.shape = (c, pts, { fill, stroke, lw = 2 } = {}) => {
  c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke && lw > 0) { c.strokeStyle = stroke; c.lineWidth = lw; c.lineJoin = 'round'; c.stroke(); }
};

// ---------- Color (accepts '#hex' or [r,g,b]) ----------
DG.arr = h => Array.isArray(h) ? h : PAINT.hex(h);
DG.mixA = (h1, h2, t) => { const a = DG.arr(h1), b = DG.arr(h2); return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; };
DG.rgba = (h, a = 1) => { const v = DG.arr(h); return `rgba(${v[0] | 0},${v[1] | 0},${v[2] | 0},${a})`; };
DG.mix = (h1, h2, t) => DG.rgba(DG.mixA(h1, h2, t));
// 3b1b palette: Grant's custom_config uses ffmpeg saturation=1.5; raw manim colors look gray, so DG.MANIM is saturated.
DG.MANIM_RAW = { BLUE_C: '#58C4DD', BLUE_D: '#29ABCA', BLUE_E: '#1C758A', TEAL_C: '#5CD0B3', GREEN_C: '#83C167', YELLOW: '#FFFF00', GOLD_C: '#F0AC5F',
  RED_C: '#FC6255', MAROON_C: '#C55F73', PURPLE_C: '#9A72AC', GREY_A: '#DDDDDD', GREY_B: '#BBBBBB', GREY_C: '#888888', GREY_D: '#444444', GREY_E: '#222222', WHITE: '#FFFFFF', BLACK: '#000000' };
DG.saturate = (hex, s = 1.5) => {                         // CSS/SVG saturate matrix
  const [r, g, b] = PAINT.hex(hex);
  const R = (0.213 + 0.787 * s) * r + (0.715 - 0.715 * s) * g + (0.072 - 0.072 * s) * b;
  const G = (0.213 - 0.213 * s) * r + (0.715 + 0.285 * s) * g + (0.072 - 0.072 * s) * b;
  const B = (0.213 - 0.213 * s) * r + (0.715 - 0.715 * s) * g + (0.072 + 0.928 * s) * b;
  const f = v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0');
  return '#' + f(R) + f(G) + f(B);
};
DG.MANIM = {}; for (const k in DG.MANIM_RAW) DG.MANIM[k] = DG.saturate(DG.MANIM_RAW[k]);
DG.U = H / 8;                                             // manim: screen height 8 units → 1 unit = 135px (1080p)

// ---------- Write and formulas (CMU = LaTeX Computer Modern; Chinese uses Source Han Serif) ----------
DG.FONT = { rm: 'CMU-rm', it: 'CMU-it', zh: 'NotoSerifSC' };
const famOf = tk => tk.zh ? DG.FONT.zh : tk.it ? DG.FONT.it : DG.FONT.rm;
// tokens: [{s, it, zh, col, sub, sup, size, gap}]; returns each token {x,w,sz} relative to start
DG.layout = (c, tokens, size) => {
  let x = 0; return tokens.map(tk => {
    const sz = (tk.size || 1) * size; c.font = `${sz}px "${famOf(tk)}"`;
    const w = c.measureText(tk.s).width; let sw = 0;
    if (tk.sub || tk.sup) { c.font = `${sz * 0.62}px "${DG.FONT.rm}"`; sw = c.measureText(tk.sub || tk.sup).width + sz * 0.04; }
    const r = { x, w: w + sw, sz }; x += w + sw + (tk.gap != null ? tk.gap : sz * 0.06); return r;
  });
};
// manim Write: each token outline first (lineDash advances), fill in second half while outline fades; token lag = min(4/(n+1), 0.2) (3b1b creation.py).
// Respect outer globalAlpha (FadeOut fades entire formula). Returns token screen {x,w}.
DG.math = (c, tokens, x, y, size, { p = 1, align = 'center', col = '#fff', lag } = {}) => {
  const L = DG.layout(c, tokens, size), total = L.length ? L[L.length - 1].x + L[L.length - 1].w : 0;
  const x0 = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const n = tokens.length, r = lag != null ? lag : Math.min(4 / (n + 1), 0.2);
  const A0 = c.globalAlpha;
  c.save(); c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  tokens.forEach((tk, i) => {
    const q = MO.lagged(i, n, clamp(p), r); if (q <= 0) return;
    const sz = L[i].sz, fx = x0 + L[i].x, colr = tk.col || col;
    const draw = (txt, xx, yy, f, mode) => { c.font = f; mode === 's' ? c.strokeText(txt, xx, yy) : c.fillText(txt, xx, yy); };
    const main = `${sz}px "${famOf(tk)}"`, small = `${sz * 0.62}px "${DG.FONT.rm}"`;
    c.font = main; const mw = c.measureText(tk.s).width;
    const parts = [[tk.s, fx, y, main]]; if (tk.sub) parts.push([tk.sub, fx + mw + sz * 0.02, y + sz * 0.22, small]); if (tk.sup) parts.push([tk.sup, fx + mw + sz * 0.02, y - sz * 0.42, small]);
    const qs = MO.doubleSmooth(q);
    if (qs < 1) { c.strokeStyle = colr; c.lineWidth = Math.max(1.2, sz * 0.025); c.setLineDash([sz * 5 * clamp(qs * 2), 1e5]); c.globalAlpha = A0 * (1 - clamp((qs - 0.6) / 0.4)); parts.forEach(pt => draw(pt[0], pt[1], pt[2], pt[3], 's')); c.setLineDash([]); }
    const fa = clamp((qs - 0.4) / 0.6); if (fa > 0) { c.globalAlpha = A0 * fa; c.fillStyle = colr; parts.forEach(pt => draw(pt[0], pt[1], pt[2], pt[3], 'f')); }
    c.globalAlpha = A0;
  });
  c.restore();
  return L.map(l => ({ x: x0 + l.x, w: l.w }));
};
// Plain-text Write (also Chinese titles: non-ASCII automatically uses DG.FONT.zh)
DG.write = (c, text, x, y, size, p, opt = {}) => DG.math(c, [...text].map(ch => ({ s: ch, zh: /[^\x00-\x7f]/.test(ch) || opt.zh, gap: 0 })), x, y, size, { ...opt, p });

// ---------- Neural networks ----------
// Neuron: white 2px outline, fill opacity = activation (original 3b1b nn/part1.py)
DG.neuron = (c, x, y, r, a, { stroke = '#fff', fill = '#fff', lw = 2, sa = 1 } = {}) => {
  c.save(); c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
  if (a > 0) { c.globalAlpha = clamp(a); c.fillStyle = fill; c.fill(); }
  c.globalAlpha = sa; c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); c.restore();
};
// Connection endpoints on circle circumferences
DG.edgeEnds = (ax, ay, ar, bx, by, br) => { const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 1; return [ax + dx / d * ar, ay + dy / d * ar, bx - dx / d * br, by - dy / d * br]; };
// Connections: positive weights blue, negative red; width = minW + maxW·|w|³ (nn/part2.py: 3·(|w|/max)³); p drawn fraction (ShowCreation)
DG.edge = (c, e, w, p = 1, { maxW = 3.2, minW = 0.6, pos = DG.MANIM.BLUE_C, neg = DG.MANIM.RED_C, alpha = 0.85, from = 0 } = {}) => {
  if (p <= from) return;
  const [x1, y1, x2, y2] = e;
  c.save(); c.strokeStyle = w >= 0 ? pos : neg; c.globalAlpha = alpha; c.lineWidth = minW + maxW * Math.pow(Math.min(1, Math.abs(w)), 3);
  c.beginPath(); c.moveTo(lerp(x1, x2, from), lerp(y1, y2, from)); c.lineTo(lerp(x1, x2, p), lerp(y1, y2, p)); c.stroke(); c.restore();
};
// ShowPassingFlash (time_width=2.0): signal travels along line, returns visible segment [lo, hi] (0..1)
DG.flash = (alpha, tw = 2) => { const up = lerp(0, 1 + tw, alpha); return [clamp(up - tw), clamp(up)]; };

// ---------- Indication ----------
DG.indicate = p => ({ s: 1 + 0.2 * MO.thereAndBack(clamp(p)), k: MO.thereAndBack(clamp(p)) });   // Enlarge 1.2, tint yellow (k), return
// Circumscribe: rectangle draws around perimeter then retracts (time_width 0.3 approximation)
DG.circumscribe = (c, x, y, w, h, p, { col = DG.MANIM.YELLOW, lw = 4, tw = 0.3 } = {}) => {
  if (p <= 0 || p >= 1) return; const pts = DG.rectPts(x + w / 2, y + h / 2, w, h, 160);
  const hi = clamp(lerp(0, 1 + tw, p)), lo = clamp(hi - tw - (1 - p) * 0.7);
  c.save(); c.strokeStyle = col; c.lineWidth = lw; c.beginPath();
  const i0 = Math.floor(lo * 160), i1 = Math.floor(hi * 160); for (let i = i0; i <= Math.min(160, i1); i++) { const q = pts[i % 160]; i === i0 ? c.moveTo(q[0], q[1]) : c.lineTo(q[0], q[1]); } c.stroke(); c.restore();
};
// Vertical right-opening brace grows from center to ends
DG.brace = (c, x, y0, y1, { col = '#fff', lw = 3, depth = 22, p = 1 } = {}) => {
  if (p <= 0) return; const ym = (y0 + y1) / 2;
  c.save(); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.globalAlpha = clamp(p * 1.5);
  const k = MO.smooth(p), a0 = lerp(ym, y0, k), a1 = lerp(ym, y1, k);
  c.beginPath(); c.moveTo(x, a0); c.quadraticCurveTo(x - depth * 0.5, a0, x - depth * 0.5, a0 + Math.min(40, (ym - a0) * 0.3));
  c.lineTo(x - depth * 0.5, ym - Math.min(40, (ym - a0) * 0.3)); c.quadraticCurveTo(x - depth * 0.5, ym, x - depth, ym);
  c.quadraticCurveTo(x - depth * 0.5, ym, x - depth * 0.5, ym + Math.min(40, (a1 - ym) * 0.3));
  c.lineTo(x - depth * 0.5, a1 - Math.min(40, (a1 - ym) * 0.3)); c.quadraticCurveTo(x - depth * 0.5, a1, x, a1); c.stroke(); c.restore();
};

// ---------- Whiteboard: stroke timeline and following pen ----------
// Add strokes sequentially, duration = length / pen speed, automatically scheduled; pen stays at newest stroke tip, slides on arcs between strokes, never leaves frame.
//   const B = DG.board({ ink, lw, speed, font });  B.at(0.12); B.line(pts); B.text('猫？', x, y, 150, {rate: 7.5}); B.pop('×1000万张', x, y, 74); ...
//   Each frame: const { tip, col } = B.draw(g, ft) (world coordinates, caller applies camera); const [sx, sy] = B.penAt(ft, cam, tip); DG.pen(c, sx, sy, col || B.penColor(ft)).
// Custom stroke B.push({ kind:'custom', t0, t1, col, draw(g, q, ft) → tip|null, start() → world point, end() → world point, handed:true }).
// Speed (RSA measured): body ≈16 characters/s, titles ≈7.5 characters/s; accent keywords pop as whole words without hand (postproduction).
DG.board = ({ ink = '#0A0503', lw = 6.5, speed = 2600, font = '"LXGWWenKai-500"' } = {}) => {
  const B = { S: [], cur: 0, ink, lw, speed, font };
  B.at = t => { B.cur = t; return B; };
  B.push = s => { B.S.push(s); return s; };
  B.line = (raw, { w = lw, col = ink, speed: sp = speed, seed = B.S.length + 1, amp = 1.4, smooth = true, min = 0.04, gap = 0.02 } = {}) => {
    const pts = smooth ? DG.hand(raw, { amp, seed, per: 8 }) : raw, cum = DG.cum(pts), len = cum[cum.length - 1];
    const d = Math.max(min, len / sp); B.S.push({ kind: 'line', pts, cum, len, w, col, t0: B.cur, t1: B.cur + d }); B.cur += d + gap;
  };
  // Straight stroke (no jitter, fixed duration, e.g. network connection), advances little time
  B.segment = (a, b, { w = 3, col = ink, dur = 0.06, gap = 0.012 } = {}) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]); B.S.push({ kind: 'line', pts: [a, b], cum: [0, L], len: L, w, col, t0: B.cur, t1: B.cur + dur }); B.cur += gap;
  };
  // Handwriting: rate characters/s
  B.text = (str, x, y, size, { col = ink, rate = 16, align = 'left', dur } = {}) => {
    const d = dur || [...str].length / rate; B.S.push({ kind: 'text', str, x, y, size, col, align, t0: B.cur, t1: B.cur + d }); B.cur += d + 0.03;
  };
  // Accent word: hand-free whole-word pop with 0.3s scale overshoot and settle
  B.pop = (str, x, y, size, { col = ink, align = 'center', dur = 0.3 } = {}) => { B.S.push({ kind: 'pop', str, x, y, size, col, align, t0: B.cur, t1: B.cur + dur }); B.cur += 0.12; };
  // Color fill (fade-in, no timeline advance)
  B.fill = (path, col, dur = 0.18) => { B.S.push({ kind: 'fill', path, col, t0: B.cur, t1: B.cur + dur }); };

  const drawOne = (g, s, ft) => {
    if (ft < s.t0) return null;
    const q = clamp((ft - s.t0) / (s.t1 - s.t0));
    if (s.kind === 'custom') return s.draw(g, q, ft);
    if (s.kind === 'fill') { g.save(); g.globalAlpha = q; g.fillStyle = s.col; g.fill(s.path); g.restore(); return null; }
    if (s.kind === 'line') { g.strokeStyle = s.col; g.lineWidth = s.w; return DG.drawPartial(g, s.pts, s.cum, s.len * MO.sineInOut(q)); }
    if (s.kind === 'pop') {
      g.save(); g.font = `${s.size}px ${B.font}`; g.fillStyle = s.col; g.textBaseline = 'alphabetic'; g.textAlign = s.align;
      const e = MO.backOut(q, 2.2); g.globalAlpha = clamp(q * 4); g.translate(s.x, s.y - s.size * 0.35); g.scale(e, e); g.fillText(s.str, 0, s.size * 0.35); g.restore(); return null;
    }
    if (s.kind === 'text') {
      // Write character by character: tip zigzags three rows within glyph box, mask reveals glyph behind tip (single-character Reveal)
      g.save(); g.font = `${s.size}px ${B.font}`; g.fillStyle = s.col; g.textBaseline = 'alphabetic';
      const chars = [...s.str], ws = chars.map(ch => g.measureText(ch).width), w = ws.reduce((a, b) => a + b, 0), x0 = s.align === 'center' ? s.x - w / 2 : s.x;
      const n = chars.length, k = Math.min(n, q * n), done = Math.floor(k);
      let x = x0, tip = null;
      chars.forEach((ch, i) => {
        if (i < done) g.fillText(ch, x, s.y);
        else if (i === done && k < n) {
          const zz = DG.zigzag(x - 2, s.y - s.size * 0.95, ws[i] + 4, s.size * 1.15, 3), cum = DG.cum(zz), d = cum[cum.length - 1] * (k - done);
          g.save(); g.clip(DG.revealMask(zz, cum, d, s.size * 0.62)); g.fillText(ch, x, s.y); g.restore(); tip = DG.pointAt(zz, cum, d);
        }
        x += ws[i];
      });
      g.restore(); return tip || [x0 + w, s.y - s.size * 0.35];
    }
    return null;
  };
  // Draw all strokes (world coordinates). Returns active stroke tip and ink color (none active → tip=null)
  B.draw = (g, ft) => {
    g.lineJoin = 'round'; g.lineCap = 'round';
    let tip = null, col = null;
    for (const s of B.S) { const p = drawOne(g, s, ft); if (p && ft < s.t1) { tip = p; col = s.col; } }
    return { tip, col };
  };
  const handed = () => B.S.filter(s => s.kind !== 'pop' && s.kind !== 'fill' && (s.kind !== 'custom' || s.handed !== false));
  const tw = s => s.size * [...s.str].length * 0.9;
  const endPt = s => s.kind === 'custom' ? s.end() : s.kind === 'line' ? s.pts[s.pts.length - 1] : [s.align === 'center' ? s.x + tw(s) / 2 : s.x + tw(s), s.y - s.size * 0.3];
  const startPt = s => s.kind === 'custom' ? s.start() : s.kind === 'line' ? s.pts[0] : [s.align === 'center' ? s.x - tw(s) / 2 : s.x, s.y - s.size * 0.3];
  // Screen pen position: active → tip; gap → arc from preceding end to next start; opening → enter from lower right
  B.penAt = (ft, cam, tip) => {
    if (tip) return CAM.toScreen(cam, tip[0], tip[1]);
    let prev = null, next = null;
    for (const s of handed()) { if (s.t1 <= ft) prev = s; else if (s.t0 > ft && !next) next = s; }
    if (prev && next) {
      const q = MO.sineInOut((ft - prev.t1) / (next.t0 - prev.t1)), a = CAM.toScreen(cam, ...endPt(prev)), b = CAM.toScreen(cam, ...startPt(next));
      return [lerp(a[0], b[0], q), lerp(a[1], b[1], q) - Math.sin(q * Math.PI) * Math.min(80, 20 + Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.15)];
    }
    if (next) { const b = CAM.toScreen(cam, ...startPt(next)), q = MO.cubicOut(clamp(ft / next.t0)); return [lerp(W * 0.62, b[0], q), lerp(H * 0.7, b[1], q)]; }
    return CAM.toScreen(cam, ...endPt(prev));
  };
  // Pen color in gaps = next stroke ink (previous if no next)
  B.penColor = ft => { const hs = handed(), nx = hs.find(s => s.t0 > ft), pv = [...hs].reverse().find(s => s.t1 <= ft); return (nx || pv || { col: ink }).col; };
  return B;
};
// Marker in screen space, tip at (x,y), body points upper right. Cap = ink color; highlight/shadow floats over board. Pen guides attention.
DG.pen = (c, x, y, col, tilt = 0) => {
  c.save(); c.translate(x, y); c.rotate(-0.72 + tilt);
  c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.roundRect(30, 14, 250, 34, 16); c.fill();
  c.fillStyle = col; c.beginPath(); c.moveTo(0, 0); c.lineTo(26, -8); c.lineTo(26, 8); c.closePath(); c.fill();
  c.fillStyle = '#e8e8e4'; c.beginPath(); c.roundRect(24, -12, 26, 24, 4); c.fill();
  c.fillStyle = '#26262a'; c.beginPath(); c.roundRect(48, -17, 190, 34, 12); c.fill();
  c.fillStyle = col; c.beginPath(); c.roundRect(212, -18, 46, 36, 10); c.fill();
  c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.roundRect(60, -12, 140, 7, 4); c.fill();
  c.restore();
};
})();
