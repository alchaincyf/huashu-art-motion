// Brush and water: dry-brush bristles, double-tapered strokes, ink diffusion, long curved flow strokes, watercolor washes, impasto bristles, scissor-cut contours. All attached to PAINT (P).
// Sources: migration tests A (ink/Munch), B (Ghibli), C (Matisse), D (Rembrandt). Deterministic: all randomness is seeded.
//   P.brush(c, pts, opt)            Brush: pressure taper, wet core, individual dry bristles; reveal draws progressively (ink, calligraphy, clothing outlines)
//   P.leaf(c, x, y, ang, L, w)      Double-tapered stroke (bamboo/orchid leaves, bird wings, shrimp tails)
//   P.inkWash(c, key, grow, fn, o)  Ink diffusion: draw to scratch, multiply blurred halo and body onto paper; grow 0→1 spreads ink
//   P.flowSeeds / P.flowLines       Long curved strokes: seeds integrate a time-varying direction field into 200–300px strokes (Munch, unlike Van Gogh's short strokes)
//   P.deform / P.watercolor         Watercolor: midpoint-displaced polygons × low-alpha multiply layers, each with faint outline for pigment edges (Ghibli backgrounds)
//   P.rectPts / P.ellipsePts        Polygon point lists for washes
//   P.impasto(c, pts, w, col, hi)   Impasto bristles: parallel fine bristles per stroke (Rembrandt highlights, Van Gogh additions)
//   P.cut(pts, seed, step, amp)     Scissor contour: sample every step px, jitter and connect straight (Matisse cutouts, silhouettes, woodcuts)
(() => {
let W = 1920, H = 1080; U.onStage((w, h) => { W = w; H = h; });   // Canvas dimensions follow U.setStage (default 1920×1080)
const P = window.PAINT;
const { clamp, lerp, rng, ss } = U;

// ---------- Brush ----------
// pts control points (Catmull-Rom densification, then 4px equal-arc resampling; without resampling, dry-brush noise frequency varies with stroke length)
// w maximum width; tone ink alpha (scorched .9 / concentrated .8 / heavy .6 / light .35 / clear .15); dry 0..1 dryness (drier toward tail); reveal 0..1 drawn fraction
// head/tail start/end fractions; bristles count; col ink [r,g,b]; per densification factor
// Pitfall: each bristle needs one continuous butt-capped path; separate round-capped segment strokes overlap into dark joints resembling bamboo or rope.
P.brush = (c, pts, { w = 10, tone = 0.85, dry = 0.45, seed = 1, reveal = 1, bristles = 8, col = [16, 14, 12], head = 0.12, tail = 0.4, per = 5 } = {}) => {
  if (reveal <= 0) return;
  const D = KIT.resample(KIT.densify(pts, per), 4), n = D.length, m = Math.max(2, Math.ceil(n * clamp(reveal)));
  const r = rng(seed * 7919);
  const prof = q => ss(0, head, q) * (1 - 0.7 * ss(1 - tail, 1, q)) * (0.85 + 0.15 * P.noise(seed * 3.3, q * 6)) + 0.08;
  c.save(); c.lineCap = 'butt'; c.lineJoin = 'round';
  const N = [];
  for (let i = 0; i < n; i++) { const A = D[Math.max(0, i - 1)], B = D[Math.min(n - 1, i + 1)]; let dx = B[0] - A[0], dy = B[1] - A[1]; const d = Math.hypot(dx, dy) || 1; N.push([-dy / d, dx / d]); }
  const core = q => w * prof(q) * (1 - dry * 0.85 * Math.pow(q, 0.8));
  // Wet core: whole stroke, tapering and fading toward end as ink runs out
  c.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${tone * 0.72})`; c.fill(KIT.ribbon(D.slice(0, m), (q, i) => core(i / (n - 1))));
  // Bristles: continuous lines broken by noise (dry white = paper between bristles), increasingly broken toward tail
  for (let k = 0; k < bristles; k++) {
    const off = (k / (bristles - 1) - 0.5) * 0.95, bw = w / bristles * (0.9 + r() * 0.9), ph = r() * 50;
    c.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${tone * (0.45 + r() * 0.35)})`; c.lineWidth = Math.max(0.7, bw);
    c.beginPath(); let on = false;
    for (let i = 0; i < m; i++) {
      const q = i / (n - 1), dryness = dry * Math.pow(q, 1.2);
      const vis = P.noise(k * 1.9 + ph, i * 0.09) * 0.5 + 0.5 > dryness * 0.95 + 0.05;
      const o = off * w * prof(q), x = D[i][0] + N[i][0] * o, y = D[i][1] + N[i][1] * o;
      if (vis) { on ? c.lineTo(x, y) : c.moveTo(x, y); on = true; } else on = false;
    }
    c.stroke();
  }
  c.restore();
};
// Double-tapered stroke (bamboo/orchid leaves, bird wings): length L along ang, maximum width wmax, slight curve
P.leaf = (c, x, y, ang, L, wmax, tone = 0.88, col = [16, 14, 12]) => {
  if (!Array.isArray(col)) col = [16, 14, 12];
  const pts = []; for (let i = 0; i <= 10; i++) { const q = i / 10, bend = Math.sin(q * Math.PI) * 0.08 * L; pts.push([x + Math.cos(ang) * L * q - Math.sin(ang) * bend, y + Math.sin(ang) * L * q + Math.cos(ang) * bend]); }
  c.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${tone})`; c.fill(KIT.ribbon(pts, q => wmax * Math.pow(Math.sin(Math.PI * Math.min(1, q * 1.1)), 0.7) + 0.6));
};

// ---------- Ink halo / wash layer ----------
// fn(g) draws shape on scratch (solid color sufficient); grow 0..1 spreads ink: halo blur widens, body blur tightens.
// halo radius, haloA opacity, blur body radius, alpha overall opacity. Returns scratch (reusable for negative-space cutouts).
// Pitfall: transparent multiply reveals underlying ink lines (windowsill through cat ears). First fill silhouette with paper (clip then drawImage paper), then wash, reserving this space.
P.inkWash = (c, key, grow, fn, { blur = 2, halo = 10, haloA = 0.22, alpha = 1 } = {}) => {
  const S = P.scratch('inkw_' + key), g = S.getContext('2d'); g.reset(); fn(g);
  c.save(); c.globalCompositeOperation = 'multiply';
  if (grow > 0) {
    c.globalAlpha = haloA * alpha * grow; c.filter = `blur(${(halo * (0.4 + grow)).toFixed(2)}px)`; c.drawImage(S, 0, 0);
    c.globalAlpha = alpha * ss(0, 0.6, grow); c.filter = `blur(${(blur * (1.6 - grow * 0.6)).toFixed(2)}px)`; c.drawImage(S, 0, 0);
  }
  c.filter = 'none'; c.restore();
  return S;
};

// ---------- Long curved flow strokes (Munch's The Scream expressionism) ----------
// Seeds: cell-jittered grid, each with two random values [x, y, r1, r2]
P.flowSeeds = (cell = 24, seed = 5) => { const r = rng(seed), o = []; for (let y = -10; y < H + 10; y += cell) for (let x = -10; x < W + 10; x += cell) o.push([x + (r() - .5) * cell, y + (r() - .5) * cell, r(), r()]); return o; };
// Per seed: region(x,y,t) selects region → params[reg] = [steps, step, width, alpha] → integrate along angle(x,y,t,reg); stop at region boundary for clean edges.
// color(reg, sx, sy, r1, t) returns [r,g,b]. No outlines, translucent layers: Munch uses thin long strokes; Van Gogh's dark outlines would make short caterpillar-like marks.
// Lay related flat color underneath so gaps show matching color rather than black. Length: steps 26–42, step 6–8, yielding 200–300px strokes.
P.flowLines = (c, seeds, { t = 0, region, angle, color, params, extraSteps = 8 }) => {
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (const [sx, sy, r1, r2] of seeds) {
    const reg = region(sx, sy, t); const pr = params[reg]; if (!pr) continue; const [steps, step, width, alpha] = pr;
    const col = color(reg, sx, sy, r1, t);
    let x = sx, y = sy; c.beginPath(); c.moveTo(x, y);
    const n = steps + ((r2 * extraSteps) | 0);
    for (let i = 0; i < n; i++) { const a = angle(x, y, t, reg); x += Math.cos(a) * step; y += Math.sin(a) * step; if (region(x, y, t) !== reg) break; c.lineTo(x, y); }
    c.strokeStyle = P.rgb(col, alpha); c.lineWidth = width * (0.7 + r2 * 0.6); c.stroke();
  }
};

// ---------- Watercolor washes (Ghibli-style backgrounds) ----------
// Midpoint displacement: each round pushes edge midpoints normally by approximate Gaussian (sum of 3 uniform samples), proportional to edge length; amp×0.6 each round
P.deform = (pts, depth, amp, r) => {
  let out = pts;
  for (let d = 0; d < depth; d++) {
    const n = [];
    for (let i = 0; i < out.length; i++) {
      const a = out[i], b = out[(i + 1) % out.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const g = (r() + r() + r() - 1.5) * amp * Math.min(1, len / 80), nx = -(b[1] - a[1]) / (len || 1), ny = (b[0] - a[0]) / (len || 1);
      n.push(a, [(a[0] + b[0]) / 2 + nx * g, (a[1] + b[1]) / 2 + ny * g]);
    }
    out = n; amp *= 0.6;
  }
  return out;
};
const fillPts = (g, pts) => { g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); };
// One wash: deform base 3 rounds; each layer deform 2 more, low-alpha multiply fill (transparent pigment layering), same-color 1.6px outline at alpha=edge (edge pigment deposition).
// fill accepts gradients; opaque whites (window frames, clouds, tablecloth) use blend:'source-over', alpha .9.
// Typical: large wall layers5 alpha.4 amp12; color bloom layers3 alpha.045 amp40; planks layers3 alpha.5 amp3 edge.14.
// Pitfall: use strongly deformed polygons (amp 60) for shadows, not adjoining rectangles with hard seams. Bloom alpha must stay below .05×3 layers, or room looks like moldy parchment.
P.watercolor = (g, pts, color, { layers = 7, alpha = 0.13, amp = 10, seed = 1, edge = 0.1, blend = 'multiply', fill } = {}) => {
  const r = rng(seed * 7919 + 13), base = P.deform(pts, 3, amp, r);
  g.save(); g.globalCompositeOperation = blend; g.lineJoin = 'round';
  for (let k = 0; k < layers; k++) {
    const q = P.deform(base, 2, amp * 0.55, r);
    fillPts(g, q); g.globalAlpha = alpha; g.fillStyle = fill || color; g.fill();
    if (edge) { g.globalAlpha = edge; g.strokeStyle = color; g.lineWidth = 1.6; g.stroke(); }
  }
  g.restore();
};
P.rectPts = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
P.ellipsePts = (cx, cy, rx, ry, n = 18) => Array.from({ length: n }, (_, i) => [cx + Math.cos(i / n * Math.PI * 2) * rx, cy + Math.sin(i / n * Math.PI * 2) * ry]);

// ---------- Impasto bristles ----------
// One stroke = round(w/1.3) parallel fine bristles (brightness ±17, random 0–25% endpoint shortening), faint lower shadow, scattered upper highlights → thick paint brushed across.
// Use only on lit areas (blond hair, collar, ceramics, pearls, white fur). Pitfall: three neat shadow/body/ridge lines resemble white stickers or bandages.
P.impasto = (c, pts, w, col, hi) => {
  const base = col.startsWith('#') ? P.hex(col) : [240, 230, 210];
  const A = pts[0], B = pts[pts.length - 1], ang = Math.atan2(B[1] - A[1], B[0] - A[0]), nx = -Math.sin(ang), ny = Math.cos(ang);
  const r = rng((A[0] * 13 + A[1] * 7) | 0), nb = Math.max(3, Math.round(w / 1.3));
  c.save(); c.lineCap = 'round';
  c.strokeStyle = 'rgba(40,18,6,.28)'; c.lineWidth = w * 0.9; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0] + nx * w * 0.45 + 1, p[1] + ny * w * 0.45 + 1.5) : c.moveTo(p[0] + nx * w * 0.45 + 1, p[1] + ny * w * 0.45 + 1.5)); c.stroke();
  for (let k = 0; k < nb; k++) {
    const o = (k / (nb - 1) - 0.5) * w, s0 = r() * 0.25, s1 = 1 - r() * 0.25, sh = (r() - 0.5) * 34 + (k < nb / 2 ? 14 : -10);
    c.strokeStyle = P.rgb([base[0] + sh, base[1] + sh, base[2] + sh * 0.8], 0.55 + r() * 0.4); c.lineWidth = 1.4 + r() * 1.2; c.beginPath();
    const n = pts.length - 1; for (let i = 0; i <= 8; i++) { const q = lerp(s0, s1, i / 8), j = Math.min(n - 1, Math.floor(q * n)), f = q * n - j, x = lerp(pts[j][0], pts[j + 1][0], f) + nx * o, y = lerp(pts[j][1], pts[j + 1][1], f) + ny * o; i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke();
  }
  c.fillStyle = hi || 'rgba(255,250,232,.7)'; for (let k = 0; k < 2 + w / 3; k++) { const q = r(), x = lerp(A[0], B[0], q) - nx * w * 0.3, y = lerp(A[1], B[1], q) - ny * w * 0.3; c.beginPath(); c.arc(x, y, 0.9 + r(), 0, Math.PI * 2); c.fill(); }
  c.restore();
};

// ---------- Scissor contour ----------
// Resample closed contour every step, add seeded ±amp jitter, connect straight → hand-cut paper edge. Feed RIG part path.pts to recut.
P.cut = (pts, seed, step = 18, amp = 2.5) => {
  const r = rng(seed), out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / step));
    for (let k = 0; k < n; k++) { const q = k / n; out.push([lerp(a[0], b[0], q) + (r() - 0.5) * amp * 2, lerp(a[1], b[1], q) + (r() - 0.5) * amp * 2]); }
  }
  return U.poly(out);
};
})();
