// Keynote UI: gradient blobs (mesh approximation), frosted cards, sliced pseudo-3D perspective, sheen, shadow-only projection, line icons.
// Convention: 1920×1080 screen coordinates; caller supplies time-derived animation values, library never reads clock.
// Full-screen card expansion and blur pushes are transitions (transitions.js expandRect / blurPush).
// Pitfall: blur draws transparent pixels from outside canvas; uncleared offscreens accumulate per frame (QA determinism fails), so draw original before blurred overlay;
//     Perspective slices must meet at integer boundaries; 0.75px overlap to hide seams creates stripes under alpha.
(() => {
let W = 1920, H = 1080; U.onStage((w, h) => { W = w; H = h; });   // Canvas dimensions follow U.setStage (default 1920×1080)
const { clamp, lerp } = U;
const UI = window.UI = {};
const cvs = {};
const scratch = (k, w, h) => { let c = cvs[k]; if (!c || c.width !== w || c.height !== h) { c = cvs[k] = document.createElement('canvas'); c.width = w; c.height = h; } return c; };
UI.scratch = scratch;

UI.rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
UI.rrPath = (x, y, w, h, r) => { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; };

// ---------- Gradient blobs (cheap mesh-gradient approximation) ----------
// Radial blobs on small canvas (screen blend) → blur there → upscale full-frame → static grain against banding.
// blobs: [{x,y,r,col:[r,g,b],a, ax,ay,period,ph}]; positions screen pixels, ax/ay drift amplitude, period seconds
UI.mesh = (c, t, { base = '#05060a', blobs = [], blur = 40, scale = 0.25, grain = 0.04, key = 'mesh' } = {}) => {
  const sw = Math.round(W * scale), sh = Math.round(H * scale);
  const a = scratch(key + 'a', sw, sh), g = a.getContext('2d');
  g.globalCompositeOperation = 'source-over'; g.fillStyle = base; g.fillRect(0, 0, sw, sh);
  g.globalCompositeOperation = 'screen';
  for (const b of blobs) {
    const w = 2 * Math.PI / (b.period || 10), ph = b.ph || 0;
    const x = (b.x + (b.ax || 0) * Math.sin(w * t + ph)) * scale, y = (b.y + (b.ay || 0) * Math.cos(w * t * 0.83 + ph)) * scale, r = b.r * scale * (1 + 0.06 * Math.sin(w * t * 1.3 + ph));
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    const [R, G, B] = b.col, A = b.a == null ? 1 : b.a;
    gr.addColorStop(0, `rgba(${R},${G},${B},${A})`); gr.addColorStop(0.45, `rgba(${R},${G},${B},${A * 0.45})`); gr.addColorStop(1, `rgba(${R},${G},${B},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, sw, sh);
  }
  const bb = scratch(key + 'b', sw, sh), gb = bb.getContext('2d');
  // Original under blurred copy: blur imports transparent pixels from outside, making translucent edges that accumulate on uncleared offscreens (source of QA determinism failure)
  gb.clearRect(0, 0, sw, sh); gb.drawImage(a, 0, 0); gb.filter = `blur(${blur * scale}px)`; gb.drawImage(a, 0, 0); gb.filter = 'none';
  c.save(); c.imageSmoothingQuality = 'high'; c.drawImage(bb, 0, 0, W, H);
  if (grain) { c.globalAlpha = grain; c.drawImage(UI.grainTex(), 0, 0); }
  c.restore();
};
// Static seeded grain counters banding in large gradients under 8bit video encoding
UI.grainTex = () => PAINT.cached('gl_grain' + W + 'x' + H, W, H, (g) => {
  const r = U.rng(77), im = g.createImageData(W, H), d = im.data;
  for (let i = 0; i < d.length; i += 4) { const v = r() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
  g.putImageData(im, 0, 0);
});

// ---------- Blurred background copy (frosted sampling) ----------
UI.backdrop = (src, { scale = 0.25, blur = 28, key = 'bd' } = {}) => {
  const sw = Math.round(W * scale), sh = Math.round(H * scale);
  const a = scratch(key, sw, sh), g = a.getContext('2d');
  g.clearRect(0, 0, sw, sh); g.drawImage(src, 0, 0, sw, sh); g.filter = `blur(${blur * scale}px)`; g.drawImage(src, 0, 0, sw, sh); g.filter = 'none';   // As above: original underneath prevents transparent edges
  return a;
};

// ---------- Shadow only: move shape offscreen and offset shadow back ----------
UI.shadow = (c, x, y, w, h, r, { blur = 60, oy = 28, alpha = 0.45 } = {}) => {
  c.save(); c.shadowColor = `rgba(0,0,0,${alpha})`; c.shadowBlur = blur; c.shadowOffsetX = 4000; c.shadowOffsetY = oy;
  c.fillStyle = '#000'; UI.rr(c, x - 4000, y, w, h, r); c.fill(); c.restore();
};

// ---------- Frosted card ----------
// bd = UI.backdrop(...) result; sample = screen sampling rectangle (defaults to card location; pass screen coordinates when drawing card into offscreen texture)
UI.glass = (c, { x, y, w, h, r = 28, bd, sample, tint = 0.07, stroke = 0.22, light = 0.16, shadow = true }) => {
  if (shadow) UI.shadow(c, x, y, w, h, r, { blur: 70, oy: 30, alpha: 0.5 });
  c.save(); UI.rr(c, x, y, w, h, r); c.clip();
  if (bd) { const s = bd.width / W, S = sample || { x, y, w, h }; c.drawImage(bd, S.x * s, S.y * s, S.w * s, S.h * s, x, y, w, h); }
  c.fillStyle = `rgba(255,255,255,${tint})`; c.fillRect(x, y, w, h);
  // Top light: soft upper-edge band gives glass thickness
  const g = c.createLinearGradient(0, y, 0, y + h * 0.5); g.addColorStop(0, `rgba(255,255,255,${light})`); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(x, y, w, h * 0.5);
  c.restore();
  // 1px outline: bright upper left, dark lower right (upper-left light)
  c.save(); const sg = c.createLinearGradient(x, y, x + w, y + h);
  sg.addColorStop(0, `rgba(255,255,255,${stroke * 1.8})`); sg.addColorStop(0.5, `rgba(255,255,255,${stroke * 0.5})`); sg.addColorStop(1, `rgba(255,255,255,${stroke})`);
  c.strokeStyle = sg; c.lineWidth = 1.5; UI.rr(c, x + 0.75, y + 0.75, w - 1.5, h - 1.5, r); c.stroke(); c.restore();
};

// ---------- Sheen ----------
// Diagonal bright band sweeps left→right within clip; p∈[0,1], width, angle radians
// comp: default 'lighter' over image; 'source-atop' on text-only offscreen confines light to glyphs
UI.sheen = (c, clipPath, p, { x0 = 0, x1 = W, width = 260, angle = -0.35, alpha = 0.32, col = '255,255,255', comp = 'lighter' } = {}) => {
  if (p <= 0 || p >= 1) return;
  const cx = lerp(x0 - width * 2, x1 + width * 2, p);
  c.save(); if (clipPath) c.clip(clipPath);
  c.globalCompositeOperation = comp;
  c.translate(cx, H / 2); c.rotate(angle);
  const g = c.createLinearGradient(-width, 0, width, 0);
  g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(0.5, `rgba(${col},${alpha})`); g.addColorStop(1, `rgba(${col},0)`);
  c.fillStyle = g; c.fillRect(-width, -H * 1.5, width * 2, H * 3);
  c.restore();
};

// ---------- Pseudo-3D: rotate texture around Y (vertical slices) or X (horizontal slices) ----------
// tex: arbitrary-resolution card texture; screen center cx,cy, unrotated size w×h, ry/rx radians, persp distance px
// Far-side shade (0..1) simulates side light. strip width px.
// Integer slice boundaries meet without overlap/gaps; old 0.75px overlap trick compounds alpha on translucent textures/drawing, causing vertical/horizontal stripes.
// Also draw to offscreen then composite once with alpha, preventing stripes during whole-card fades.
UI.persp = (c0, tex, { cx, cy, w, h, ry = 0, rx = 0, persp = 1600, strip = 3, shade = 0.35, alpha = 1 }) => {
  const sc = scratch('persp', W, H), c = sc.getContext('2d'); c.reset();
  c.save();
  const tw = tex.width, th = tex.height;
  if (Math.abs(ry) >= Math.abs(rx)) {
    const n = Math.max(8, Math.ceil(w / strip)), cs = Math.cos(ry), sn = Math.sin(ry);
    const P = u => { const X = (u - 0.5) * w, z = X * sn, s = persp / (persp + z); return [cx + X * cs * s, s]; };
    for (let i = 0; i < n; i++) {
      const u0 = i / n, u1 = (i + 1) / n, [x0, s0] = P(u0), [x1, s1] = P(u1), s = (s0 + s1) / 2;
      const hh = h * s, xa = Math.round(Math.min(x0, x1)), xb = Math.round(Math.max(x0, x1)); if (xb > xa) c.drawImage(tex, u0 * tw, 0, (u1 - u0) * tw, th, xa, cy - hh / 2, xb - xa, hh);
    }
    if (shade && ry) { // Darken side turned away from viewer
      const [xa] = P(0), [xb] = P(1), g = c.createLinearGradient(xa, 0, xb, 0), k = Math.min(1, Math.abs(Math.sin(ry)) * 2) * shade;
      g.addColorStop(0, `rgba(0,0,0,${ry > 0 ? 0 : k})`); g.addColorStop(1, `rgba(0,0,0,${ry > 0 ? k : 0})`);
      c.globalCompositeOperation = 'source-atop'; c.fillStyle = g; c.fillRect(Math.min(xa, xb), cy - h, Math.abs(xb - xa), h * 2);
    }
  } else {
    const n = Math.max(8, Math.ceil(h / strip)), cs = Math.cos(rx), sn = Math.sin(rx);
    const P = v => { const Y = (v - 0.5) * h, z = -Y * sn, s = persp / (persp + z); return [cy + Y * cs * s, s]; };
    for (let i = 0; i < n; i++) {
      const v0 = i / n, v1 = (i + 1) / n, [y0, s0] = P(v0), [y1, s1] = P(v1), s = (s0 + s1) / 2;
      const ww = w * s, ya = Math.round(Math.min(y0, y1)), yb = Math.round(Math.max(y0, y1)); if (yb > ya) c.drawImage(tex, 0, v0 * th, tw, (v1 - v0) * th, cx - ww / 2, ya, ww, yb - ya);
    }
  }
  c.restore();
  c0.save(); c0.globalAlpha *= alpha; c0.drawImage(sc, 0, 0); c0.restore();
};

// ---------- Line icons (SF Symbols feel: round caps, uniform width) ----------
UI.icon = (c, kind, x, y, s, col, t = 0, lw = 0.075) => {
  c.save(); c.translate(x, y); c.scale(s, s); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round';
  if (kind === 'wave') {                    // Voice: five animated vertical bars
    const hs = [0.35, 0.7, 1, 0.6, 0.3];
    hs.forEach((h0, i) => { const h = h0 * (0.75 + 0.25 * Math.sin(t * 7 + i * 1.3)); const xx = -0.4 + i * 0.2; c.beginPath(); c.moveTo(xx, -h * 0.45); c.lineTo(xx, h * 0.45); c.stroke(); });
  } else if (kind === 'memory') {           // Memory: three stacked layers
    for (let k = 0; k < 3; k++) { const yy = -0.28 + k * 0.24 + 0.02 * Math.sin(t * 2 + k); c.beginPath(); c.moveTo(-0.45, yy); c.lineTo(0, yy - 0.18); c.lineTo(0.45, yy); c.lineTo(0, yy + 0.18); c.closePath(); c.globalAlpha = k === 0 ? 1 : 0.6; c.stroke(); }
  } else if (kind === 'agent') {            // Agent: four-point star and small star
    const r = 0.42 * (1 + 0.05 * Math.sin(t * 3));
    c.beginPath(); c.moveTo(0, -r); c.quadraticCurveTo(0, 0, r, 0); c.quadraticCurveTo(0, 0, 0, r); c.quadraticCurveTo(0, 0, -r, 0); c.quadraticCurveTo(0, 0, 0, -r); c.fill();
    const r2 = 0.16; c.translate(0.36, -0.36); c.beginPath(); c.moveTo(0, -r2); c.quadraticCurveTo(0, 0, r2, 0); c.quadraticCurveTo(0, 0, 0, r2); c.quadraticCurveTo(0, 0, -r2, 0); c.quadraticCurveTo(0, 0, 0, -r2); c.globalAlpha = 0.7; c.fill();
  }
  c.restore();
};
})();
