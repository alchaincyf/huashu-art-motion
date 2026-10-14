// Code-only painting helpers: noise, texture, rough lines, style renderers (strokes/dots/mosaic/halftone/pixels/facets), shared choreography.
// Convention: all randomness seeded; rough lines change seed at boilFps (boiling line), everything else stable across frames.
(() => {
let W = 1920, H = 1080; U.onStage((w, h) => { W = w; H = h; });   // Canvas dimensions follow U.setStage (default 1920×1080)
const P = window.PAINT = {};
const { clamp, lerp, ease, rng } = U;

// ---------- Canvas ----------
P.canvas = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const CACHE = {};
P.cached = (key, w, h, fn) => { if (!CACHE[key]) { const c = P.canvas(w, h); fn(c.getContext('2d'), c); CACHE[key] = c; } return CACHE[key]; };
P.scratch = (key) => { if (!CACHE['s_' + key]) CACHE['s_' + key] = P.canvas(); return CACHE['s_' + key]; };

// ---------- Noise ----------
const perm = new Uint8Array(512); { const r = rng(1337); const p = [...Array(256).keys()]; for (let i = 255; i > 0; i--) { const j = (r() * (i + 1)) | 0; [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) perm[i] = p[i & 255]; }
const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
const grad = (h, x, y) => { const u = (h & 1) ? x : -x, v = (h & 2) ? y : -y; return (h & 4) ? u + v * 0.5 : u * 0.5 + v; };
P.noise = (x, y) => {                                   // Perlin 2D, approximately [-1,1]
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255; x -= Math.floor(x); y -= Math.floor(y);
  const u = fade(x), v = fade(y), a = perm[X] + Y, b = perm[X + 1] + Y;
  return lerp(lerp(grad(perm[a], x, y), grad(perm[b], x - 1, y), u), lerp(grad(perm[a + 1], x, y - 1), grad(perm[b + 1], x - 1, y - 1), u), v);
};
P.fbm = (x, y, o = 4) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * P.noise(x * f, y * f); a *= 0.5; f *= 2; } return s; };

// ---------- Color ----------
P.hex = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
P.rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
P.mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
P.jitter = (c, r, amt) => [c[0] + (r() - .5) * amt, c[1] + (r() - .5) * amt, c[2] + (r() - .5) * amt];

// ---------- Texture (cached) ----------
// Paper/wall/rock: base color, layered noise mottling, fine grain
P.texture = (key, base, opt = {}) => P.cached('tex_' + key, W, H, (g) => {
  const { scale = 0.004, amt = 26, grain = 14, dark = null, seed = 1 } = opt;
  const img = g.createImageData(W, H), d = img.data, b = P.hex(base), r = rng(seed);
  const dk = dark ? P.hex(dark) : null;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const n = P.fbm(x * scale + seed, y * scale, 5), gr = (r() - .5) * grain;
    const i = (y * W + x) * 4;
    let c = b;
    if (dk) c = P.mix(b, dk, clamp(n * 1.2 + 0.25));
    d[i] = c[0] + n * amt + gr; d[i + 1] = c[1] + n * amt + gr; d[i + 2] = c[2] + n * amt * 0.8 + gr; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
});
// Grain overlay (flat illustration, aged print): random dots on transparency
P.grain = (key, density = 0.08, col = [0, 0, 0], alpha = 0.18) => P.cached('grain_' + key, W, H, (g) => {
  const img = g.createImageData(W, H), d = img.data, r = rng(key.length * 97 + 3);
  for (let i = 0; i < W * H; i++) if (r() < density) { d[i * 4] = col[0]; d[i * 4 + 1] = col[1]; d[i * 4 + 2] = col[2]; d[i * 4 + 3] = 255 * alpha * (0.4 + r() * 0.6); }
  g.putImageData(img, 0, 0);
});
// Craquelure (classical oil): random-walk fine crack network
P.craquelure = (key, alpha = 0.35) => P.cached('crack_' + key, W, H, (g) => {
  const r = rng(77); g.strokeStyle = `rgba(40,25,10,${alpha})`; g.lineWidth = 0.8;
  for (let k = 0; k < 900; k++) {
    let x = r() * W, y = r() * H, a = r() * Math.PI * 2; g.beginPath(); g.moveTo(x, y);
    for (let s = 0; s < 6 + r() * 10; s++) { a += (r() - .5) * 1.6; x += Math.cos(a) * (6 + r() * 14); y += Math.sin(a) * (6 + r() * 14); g.lineTo(x, y); }
    g.stroke();
  }
});

// ---------- Rough lines ----------
// Sample polyline/curve and add noise jitter; boil = time-based seed-change frequency (0 = static)
P.boilSeed = (t, fps = 12) => Math.floor(t * fps);
P.roughPath = (c, pts, { amp = 2, seed = 1, closed = false, step = 6 } = {}) => {
  const r = rng(seed);
  // Resample at step first
  const out = [];
  const N = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < N; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / step));
    for (let k = 0; k < n; k++) { const q = k / n; out.push([lerp(a[0], b[0], q) + (r() - .5) * amp, lerp(a[1], b[1], q) + (r() - .5) * amp]); }
  }
  if (!closed) out.push([pts[pts.length - 1][0] + (r() - .5) * amp, pts[pts.length - 1][1] + (r() - .5) * amp]);
  c.beginPath(); out.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); if (closed) c.closePath();
};
// Cubic Bézier to point list (for roughPath / deformation)
P.bez = (p0, p1, p2, p3, n = 24) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]); } return o; };
// SVG path string → Path2D (simplest complex contours)
P.path = (d) => new Path2D(d);

// ---------- Style renderers (repaint source canvas) ----------
// 1) Flow-field strokes (Van Gogh/Impressionism): sample source color on jittered grid, short strokes along angle(x,y,t) with dark outline
//    cap: dense wide strokes (width ≥30) with round caps form rows of heads/pebbles (migration test D Blue Period); use 'butt'.
//    boil: boil only motif regions; fixed seeds and boil=0 for floors/props/characters; full-screen 8fps seed changes flicker (migration test C Monet).
P.strokes = (dst, src, { cell = 12, len = 22, width = 7, angle, seed = 1, t = 0, boil = 8, outline = 0.35, outlineCol = [20, 25, 60], outlineMix = 0.55, jitterCol = 18, mask, alphaMask = false, palette, cap = 'round' } = {}) => {
  const sd = src.getContext('2d').getImageData(0, 0, W, H).data;
  const r = rng(seed * 1000 + P.boilSeed(t, boil));
  dst.lineCap = cap;
  for (let y = 0; y < H + cell; y += cell) for (let x = 0; x < W + cell; x += cell) {
    const px = x + (r() - .5) * cell, py = y + (r() - .5) * cell;
    const ix = clamp(px | 0, 0, W - 1), iy = clamp(py | 0, 0, H - 1), i = (iy * W + ix) * 4;
    if (mask && !mask(px, py)) continue;
    if (alphaMask && sd[i + 3] < 200) continue;
    let col = [sd[i], sd[i + 1], sd[i + 2]];
    const pc = palette ? palette(px, py, col, r) : null; if (pc) col = pc;       // Regional palette: sample color from group
    const a = angle ? angle(px, py, t) : 0, l = len * (0.7 + r() * 0.6);
    const dx = Math.cos(a) * l / 2, dy = Math.sin(a) * l / 2;
    if (outline > 0) { dst.strokeStyle = P.rgb(P.mix(col, outlineCol, outlineMix), outline); dst.lineWidth = width + 2.5; dst.beginPath(); dst.moveTo(px - dx, py - dy); dst.lineTo(px + dx, py + dy); dst.stroke(); }
    dst.strokeStyle = P.rgb(pc ? col : P.jitter(col, r, jitterCol)); dst.lineWidth = width;
    dst.beginPath(); dst.moveTo(px - dx, py - dy); dst.lineTo(px + dx, py + dy); dst.stroke();
  }
};
// Color-group helper: hex colors/weights → random color-sampling function (strokes palette); mixBase mixes source color to retain shading
P.swatch = (hexes, mixBase = 0.35) => { const cs = hexes.map(P.hex); return (col, r) => { const k = cs[(r() * cs.length) | 0]; return P.mix(k, col, mixBase); }; };
// 2) Impressionist dabs: short ellipses, warm/cool shifts and varied size. Unlike Seurat pointillism's equal dots/pure palette optical mixing; use P.pointillism (lib/render.js).
P.dabs = (dst, src, { cell = 10, size = 9, seed = 2, t = 0, boil = 8, angle = -0.6, shift = 22 } = {}) => {
  const sd = src.getContext('2d').getImageData(0, 0, W, H).data, r = rng(seed * 1000 + P.boilSeed(t, boil));
  for (let y = 0; y < H + cell; y += cell) for (let x = 0; x < W + cell; x += cell) {
    const px = x + (r() - .5) * cell * 1.2, py = y + (r() - .5) * cell * 1.2;
    const i = (clamp(py | 0, 0, H - 1) * W + clamp(px | 0, 0, W - 1)) * 4;
    const warm = r() < 0.5 ? [shift, shift * 0.5, -shift] : [-shift * 0.6, 0, shift];
    dst.fillStyle = `rgb(${sd[i] + warm[0]},${sd[i + 1] + warm[1]},${sd[i + 2] + warm[2]})`;
    dst.beginPath(); dst.ellipse(px, py, size * (0.8 + r() * 0.6), size * 0.45, angle + (r() - .5) * 0.5, 0, Math.PI * 2); dst.fill();
  }
};
// 3) Mosaic: small stones with gaps, center-sampled color, slight jitter/bevel
P.mosaic = (dst, src, { tile = 14, grout = '#3b352e', seed = 3, jitter = 0.25 } = {}) => {
  const sd = src.getContext('2d').getImageData(0, 0, W, H).data, r = rng(seed);
  dst.fillStyle = grout; dst.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += tile) { const off = (y / tile) % 2 ? tile * 0.5 * jitter : 0; for (let x = -tile; x < W; x += tile) {
    const cx = x + off + tile / 2, cy = y + tile / 2, i = (clamp(cy | 0, 0, H - 1) * W + clamp(cx | 0, 0, W - 1)) * 4;
    const c = P.jitter([sd[i], sd[i + 1], sd[i + 2]], r, 14), s = tile * (0.82 + r() * 0.1);
    dst.fillStyle = P.rgb(c); dst.fillRect(cx - s / 2 + (r() - .5) * 1.5, cy - s / 2 + (r() - .5) * 1.5, s, s);
    dst.fillStyle = 'rgba(255,255,255,.12)'; dst.fillRect(cx - s / 2, cy - s / 2, s, 2);
  } }
};
// 4) Halftone (Ben-Day dots): center color, radius follows darkness
P.halftone = (dst, src, { cell = 14, paper = '#f4ecd8', seed = 4 } = {}) => {
  const sd = src.getContext('2d').getImageData(0, 0, W, H).data;
  dst.fillStyle = paper; dst.fillRect(0, 0, W, H);
  for (let y = 0; y < H + cell; y += cell) for (let x = 0; x < W + cell; x += cell) {
    const cx = x + ((y / cell) % 2) * cell / 2, i = (clamp(y | 0, 0, H - 1) * W + clamp(cx | 0, 0, W - 1)) * 4;
    const L = (sd[i] * .3 + sd[i + 1] * .59 + sd[i + 2] * .11) / 255;
    dst.fillStyle = `rgb(${sd[i]},${sd[i + 1]},${sd[i + 2]})`;
    dst.beginPath(); dst.arc(cx, y, cell * 0.72 * (0.3 + (1 - L) * 0.9), 0, Math.PI * 2); dst.fill();
  }
};
// 5) Pixels: nearest-neighbor downsampling, optional palette quantization
P.pixelate = (dst, src, { size = 8, palette } = {}) => {
  const w = Math.ceil(W / size), h = Math.ceil(H / size), s = P.scratch('px'), g = s.getContext('2d');
  g.imageSmoothingEnabled = false; g.clearRect(0, 0, w, h); g.drawImage(src, 0, 0, w, h);
  if (palette) { const pal = palette.map(P.hex), im = g.getImageData(0, 0, w, h), d = im.data;
    for (let i = 0; i < d.length; i += 4) { let best = 0, bd = 1e9; for (let k = 0; k < pal.length; k++) { const q = pal[k], dd = (d[i] - q[0]) ** 2 + (d[i + 1] - q[1]) ** 2 + (d[i + 2] - q[2]) ** 2; if (dd < bd) { bd = dd; best = k; } } d[i] = pal[best][0]; d[i + 1] = pal[best][1]; d[i + 2] = pal[best][2]; }
    g.putImageData(im, 0, 0); }
  dst.imageSmoothingEnabled = false; dst.drawImage(s, 0, 0, w, h, 0, 0, w * size, h * size); dst.imageSmoothingEnabled = true;
};
// 6) Cubist facets: jittered triangular mesh, shifted-viewpoint sample colors as linear gradients, dark outlines
P.facets = (dst, src, { nx = 22, ny = 13, seed = 5, t = 0, shiftAmt = 26, edge = 'rgba(40,30,20,.45)' } = {}) => {
  const sd = src.getContext('2d').getImageData(0, 0, W, H).data, r = rng(seed);
  const pts = []; for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { const e = i === 0 || j === 0 || i === nx || j === ny; pts.push([i / nx * W + (e ? 0 : (r() - .5) * W / nx * .9), j / ny * H + (e ? 0 : (r() - .5) * H / ny * .9)]); }
  const col = (x, y) => { const i = (clamp(y | 0, 0, H - 1) * W + clamp(x | 0, 0, W - 1)) * 4; return [sd[i], sd[i + 1], sd[i + 2]]; };
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const a = pts[j * (nx + 1) + i], b = pts[j * (nx + 1) + i + 1], c2 = pts[(j + 1) * (nx + 1) + i], d2 = pts[(j + 1) * (nx + 1) + i + 1];
    for (const tri of (r() < .5 ? [[a, b, d2], [a, d2, c2]] : [[a, b, c2], [b, d2, c2]])) {
      const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
      const sh = Math.sin(t * 3 + cx * 0.01) * shiftAmt * r();
      const c0 = col(cx + sh, cy), c1 = P.mix(c0, [60, 45, 30], 0.35);
      const g = dst.createLinearGradient(tri[0][0], tri[0][1], tri[2][0], tri[2][1]); g.addColorStop(0, P.rgb(P.mix(c0, [255, 250, 235], 0.12))); g.addColorStop(1, P.rgb(c1));
      dst.fillStyle = g; dst.beginPath(); tri.forEach((p, k) => k ? dst.lineTo(p[0], p[1]) : dst.moveTo(p[0], p[1])); dst.closePath(); dst.fill();
      dst.strokeStyle = edge; dst.lineWidth = 1.5; dst.stroke();
    }
  }
};

// ---------- Shared choreography: 16 eras use same motion curves, each renders in own style ----------
// lt = segment-local seconds. Returns 0..1 or angles for era code.
// Cup cycle (global time): 2.4s — lift 0.9s, drink hold 0.7s, lower 0.8s
P.cupCycle = (t, period = 2.4) => { const q = ((t % period) + period) % period;
  if (q < 0.9) return 0.5 - 0.5 * Math.cos(q / 0.9 * Math.PI); if (q < 1.6) return 1; return 0.5 + 0.5 * Math.cos((q - 1.6) / 0.8 * Math.PI); };
P.choreo = (lt, t) => ({
  cupG: P.cupCycle(t),                                         // Global-time cup lift (continuous across segments; no speedrun pose reset)
  cup: 0.5 - 0.5 * Math.cos(Math.min(1, lt / 0.9) * Math.PI),   // Cup: 0=table, 1=mouth (about 0.9s lift)
  sip: Math.max(0, Math.sin(lt * 6)) * 0.15,                    // Slight head tilt while drinking
  tail: Math.sin(t * 5.2) * 0.35 + Math.sin(t * 11) * 0.08,      // Cat-tail sway (radians)
  blink: (t % 2.3) > 2.18 ? 1 : 0,                              // Blink
  ear: Math.max(0, Math.sin(t * 9)) > 0.97 ? 1 : 0,
  breathe: Math.sin(t * 4) * 0.012,
  steam: t,                                                     // Steam uses global time
});

// ---------- Shared elements ----------
// Steam: several upward-moving sinusoids (stylized S-curves accept width/color)
P.steam = (c, t, x, y, { h = 80, n = 3, color = 'rgba(255,255,255,.8)', width = 4, spread = 16, wobble = 10, seed = 1 } = {}) => {
  c.save(); c.lineCap = 'round'; c.lineWidth = width;
  for (let k = 0; k < n; k++) {
    const ox = (k - (n - 1) / 2) * spread, ph = t * 3 + k * 2.1 + seed;
    const g = c.createLinearGradient(0, y, 0, y - h); g.addColorStop(0, color); g.addColorStop(1, 'rgba(255,255,255,0)'); c.strokeStyle = g;
    c.beginPath(); for (let s = 0; s <= 20; s++) { const q = s / 20; const xx = x + ox + Math.sin(ph - q * 5) * wobble * q, yy = y - q * h; s ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke();
  }
  c.restore();
};
// Particles: deterministic positions for seed and time (falling/rising)
P.particles = (n, seed, t, { x0 = 0, x1 = W, y0 = -40, y1 = H + 40, speed = 80, drift = 30, life = 6 } = {}) => {
  const r = rng(seed), out = [];
  for (let i = 0; i < n; i++) { const bx = lerp(x0, x1, r()), ph = r() * life, sp = speed * (0.6 + r() * 0.8), q = ((t + ph) % life) / life;
    out.push({ x: bx + Math.sin((t + ph) * 1.7 + i) * drift, y: lerp(y0, y1, q), a: r() * Math.PI * 2 + t * (r() - .5) * 3, s: 0.6 + r() * 0.8, q, i }); }
  return out;
};
})();
