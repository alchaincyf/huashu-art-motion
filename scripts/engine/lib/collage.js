// Collage materials CL (Vox / Missing Chapter / Borders): paper texture, torn edges, halftone photos, tape, pins, sagging red investigation thread,
// Rough highlighter (multiply), subtle shadows, tilted slide-in settling flat, white sticker cutout edges.
// Timing rule (y2 research): smooth 60fps camera; papers/highlighter/red pen/typewriter at 12fps on twos (MO.step), half the stop-motion feel.
// Paper texture remains fixed (static grain, no frame jitter). Draw assets once via PAINT.cached, deterministic.
(() => {
let W = 1920, H = 1080; U.onStage((w, h) => { W = w; H = h; });   // Canvas dimensions follow U.setStage (default 1920×1080)
const { clamp, lerp, rng } = U;
const CL = window.CL = {};

// ---------- Paper ----------
// Seamless paper tile: toroidally sampled fbm shading, short fibers, fine grain. Tile using c.createPattern(tile, 'repeat')
CL.paperTile = (key, base, { size = 512, amt = 10, fibers = 260, grain = 10, fiberCol = [120, 100, 70], seed = 3 } = {}) => PAINT.cached('ytpaper_' + key, size, size, (g) => {
  const img = g.createImageData(size, size), d = img.data, b = PAINT.hex(base), r = rng(seed);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const ax = x / size * Math.PI * 2, ay = y / size * Math.PI * 2;
    const n = PAINT.fbm(Math.cos(ax) * 1.6 + 10, Math.sin(ax) * 1.6 + Math.cos(ay) * 1.6, 4) * 0.6 + PAINT.noise(Math.sin(ay) * 3 + 5, Math.cos(ay) * 3) * 0.4;
    const gr = (r() - .5) * grain, i = (y * size + x) * 4;
    d[i] = b[0] + n * amt + gr; d[i + 1] = b[1] + n * amt + gr; d[i + 2] = b[2] + n * amt * 0.9 + gr; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  g.lineCap = 'round';
  for (let k = 0; k < fibers; k++) { const x = r() * size, y = r() * size, a = r() * Math.PI, l = 4 + r() * 14;
    g.strokeStyle = PAINT.rgb(fiberCol, 0.05 + r() * 0.08); g.lineWidth = 0.6 + r() * 0.8;
    for (const ox of [0, -size, size]) for (const oy of [0, -size, size]) { g.beginPath(); g.moveTo(x + ox, y + oy); g.quadraticCurveTo(x + ox + Math.cos(a + 1) * l * 0.5, y + oy + Math.sin(a + 1) * l * 0.5, x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l); g.stroke(); } }
});
CL.fillPaper = (c, tile, x, y, w, h) => { c.save(); c.fillStyle = c.createPattern(tile, 'repeat'); c.fillRect(x, y, w, h); c.restore(); };
// Torn edge: serrated/fibrous point list along line (left→right), amp variation, fixed seed
CL.tornEdge = (x0, y0, x1, y1, { step = 9, amp = 10, seed = 5 } = {}) => {
  const r = rng(seed), L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.round(L / step)), nx = -(y1 - y0) / L, ny = (x1 - x0) / L, o = [];
  for (let i = 0; i <= n; i++) { const q = i / n, k = PAINT.noise(i * 0.18, seed) * amp + (r() - .5) * amp * 0.9; o.push([lerp(x0, x1, q) + nx * k, lerp(y0, y1, q) + ny * k]); }
  return o;
};
// Torn rectangle (0,0,w,h): only builds path (beginPath…closePath); caller fills/clips
CL.tornRect = (g, w, h, seed, amp = 5) => {
  const pts = [...CL.tornEdge(0, 0, w, 0, { amp, seed }), ...CL.tornEdge(w, 0, w, h, { amp, seed: seed + 1 }), ...CL.tornEdge(w, h, 0, h, { amp, seed: seed + 2 }), ...CL.tornEdge(0, h, 0, 0, { amp, seed: seed + 3 })];
  g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath();
};

// ---------- Halftone photos ----------
// Grayscale halftone: source canvas luminance to 45° dots, cell pixels per cell; only opaque source areas. Cache result (unique key)
CL.halftone = (key, src, { cell = 7, ink = '#1b1b1b', paper = '#efe9dc', angle = Math.PI / 4, gamma = 1, contrast = 1.15 } = {}) => PAINT.cached('ytht_' + key, src.width, src.height, (g) => {
  const w = src.width, h = src.height, sd = src.getContext('2d').getImageData(0, 0, w, h).data;
  g.fillStyle = paper; g.fillRect(0, 0, w, h); g.fillStyle = ink;
  const ca = Math.cos(angle), sa = Math.sin(angle), R = Math.hypot(w, h);
  g.beginPath();
  for (let v = -R; v < R; v += cell) for (let u = -R; u < R; u += cell) {
    const x = w / 2 + u * ca - v * sa, y = h / 2 + u * sa + v * ca; if (x < -cell || y < -cell || x > w + cell || y > h + cell) continue;
    const ix = clamp(x | 0, 0, w - 1), iy = clamp(y | 0, 0, h - 1), i = (iy * w + ix) * 4;
    if (sd[i + 3] < 10) continue;
    let L = (sd[i] * .3 + sd[i + 1] * .59 + sd[i + 2] * .11) / 255; L = clamp((L - 0.5) * contrast + 0.5); L = Math.pow(L, gamma);
    const rr = cell * 0.62 * Math.sqrt(1 - L); if (rr < 0.4) continue;
    g.moveTo(x + rr, y); g.arc(x, y, rr, 0, Math.PI * 2);
  }
  g.fill();
  g.globalCompositeOperation = 'destination-in'; g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-over';
});
// Halftone photo sticker: draw(g,w,h) source → halftone → border-width paper rim and aged tint (multiply). Returns cached canvas (w+2b × h+2b)
CL.photo = (key, w, h, draw, { border = 14, cell = 6, paper = '#f2f0ea', ink = '#1a1a1a', htPaper = '#e8e4da', contrast = 1.3 } = {}) => PAINT.cached('clphoto_' + key, w + border * 2, h + border * 2, (g) => {
  const src = PAINT.canvas(w, h); draw(src.getContext('2d'), w, h);
  const ht = CL.halftone(key + '_ht', src, { cell, ink, paper: htPaper, contrast });
  g.fillStyle = paper; g.fillRect(0, 0, w + border * 2, h + border * 2); g.drawImage(ht, border, border);
  g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(214,205,185,.3)'; g.fillRect(0, 0, w + border * 2, h + border * 2); g.globalCompositeOperation = 'source-over';
});

// ---------- Placement ----------
CL.placed = (g, x, y, r, fn) => { g.save(); g.translate(x, y); g.rotate(r); fn(g); g.restore(); };
// Subtle shadow (little needed on Vox desk; almost none on black cards)
CL.shadowed = (g, fn, { col = 'rgba(50,40,25,.28)', blur = 10, x = 3, y = 6 } = {}) => { g.save(); g.shadowColor = col; g.shadowBlur = blur; g.shadowOffsetX = x; g.shadowOffsetY = y; fn(); g.restore(); };
// Tilted slide-in settling flat (MC measured 5–15° tilt, about 0.6–0.8s), 12fps steps. Returns progress q
CL.slideIn = (g, t, t0, x, y, r, fn, { from = [420, -60], tilt = 0.2, dur = 0.6, fps = 12 } = {}) => {
  const q = clamp((MO.step(t, fps) - t0) / dur); if (q <= 0) return 0;
  const e = MO.quartOut(q);
  g.save(); g.translate(x + from[0] * (1 - e), y + from[1] * (1 - e)); g.rotate(r + tilt * (1 - Math.min(1, e * 1.15))); fn(g); g.restore(); return q;
};
// Tape: translucent torn strip
CL.tape = (g, x, y, a, w = 120, col = 'rgba(226,220,200,.85)') => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = col; g.translate(-w / 2, -17); CL.tornRect(g, w, 34, (x * 7 + y) | 0, 3); g.fill(); g.restore(); };
// Pushpin
CL.pin = (g, x, y, col = '#b8433f') => { g.save(); g.translate(x, y); g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(3, 5, 12, 0, 7); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(0, 0, 12, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.arc(-4, -4, 4, 0, 7); g.fill(); g.restore(); };
// Investigation-wall thread: quadratic point list sagging by length between a→b (DG.cum / DG.drawPartial progressively draws)
CL.stringPts = (a, b, sag = 0.08, n = 48) => { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + Math.hypot(b[0] - a[0], b[1] - a[1]) * sag; const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * a[0] + 2 * u * t * mx + t * t * b[0], u * u * a[1] + 2 * u * t * my + t * t * b[1]]); } return o; };
// Red thread: draw first arc length d with shadow (1e9 draws all)
CL.string = (g, pts, cum, d, { col = '#b8433f', lw = 5, shadow = 'rgba(0,0,0,.16)' } = {}) => {
  if (shadow) { g.save(); g.strokeStyle = shadow; g.lineWidth = lw; g.translate(3, 6); DG.drawPartial(g, pts, cum, d); g.restore(); }
  g.save(); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; DG.drawPartial(g, pts, cum, d); g.restore();
};
// Rough highlighter (multiply over print): q 0..1 sweeps left→right
CL.highlight = (g, x0, y0, w, h, q, col = 'rgba(218,207,8,.9)') => { if (q <= 0) return; g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = col;
  g.beginPath(); const ww = w * q; g.moveTo(x0, y0 + 4); for (let i = 0; i <= 20; i++) g.lineTo(x0 + ww * i / 20, y0 + Math.sin(i * 1.7) * 2); g.lineTo(x0 + ww + 6, y0 + h / 2); g.lineTo(x0 + ww, y0 + h);
  for (let i = 20; i >= 0; i--) g.lineTo(x0 + ww * i / 20, y0 + h + Math.sin(i * 2.3) * 2); g.closePath(); g.fill(); g.restore(); };
// White cutout border: expand src (full-screen offscreen character/object) by border pixels in col, return same-size offscreen; draw result then src
CL.stickerEdge = (src, key, border = 12, col = '#f4f2ec', dirs = 16) => {
  const sil = PAINT.scratch(key), sg = sil.getContext('2d'); sg.reset();
  for (let a = 0; a < dirs; a++) sg.drawImage(src, Math.cos(a / dirs * 6.283) * border, Math.sin(a / dirs * 6.283) * border);
  sg.globalCompositeOperation = 'source-in'; sg.fillStyle = col; sg.fillRect(0, 0, W, H);
  return sil;
};
})();
