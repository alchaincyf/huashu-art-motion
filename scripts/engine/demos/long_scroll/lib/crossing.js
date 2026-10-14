// Long-scroll journey · shared XING library (used in Huashu Travels Through Masterpieces, included with demos/long_scroll in skill).
// Character = AI style frames (gpt-image redraw per style → green-screen key → slice, see references/10-角色.md); code controls position, size, frame timing, texture.
// Scenes, camera, stones, ripples, lilies, frog, and transitions are code-drawn.
//   XING.sprites(keys)               Read demos/long_scroll/frames/<key>/meta.json synchronously, return assets (for era.assets)
//   XING.actor(c, key, i, o)         Draw frame i: o={x,y(feet),h(standing height),mat:'monet'|'ukiyoe'|'vangogh'|'none',wx,t,flip,alpha}
//   XING.hatTop(key,i,o)             Hat top on screen (frog landing point)
//   XING.strokes(g, src, opt)        Repaint arbitrary canvas with strokes, independent seed per cell (positions never reshuffle)
//   XING.monetWorld / ukiyoeWorld / vgWorld   Three worlds: static parts cached once (world coordinates), dynamic parts drawn each frame
//   XING.stone(t, plan)              Stone skipping: position + water-contact times
//   XING.frog(c, x, y, s, pose, style, o)
(() => {
const W = 1920, H = 1080, TAU = Math.PI * 2;
const { clamp, lerp, ss, rng } = U;
const P = window.PAINT;
const X = window.XING = {};
const hx = P.hex;
const cellRng = (i, j, seed) => rng((Math.floor(U.hash(i * 131 + seed * 7919, j * 31 + seed) * 4294967296)) >>> 0);
const lum = c => c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11;
const pick = (arr, r) => arr[(r() * arr.length) | 0];

// ================= Stroke repainting (any size, independent cell seeds) =================
X.strokes = (g, src, { cell = 10, len = 24, width = 6, angle, palette, seed = 1, mask, alphaMask = false, alphaMin = 180, outline = 0, outlineCol = [20, 25, 60], outlineMix = 0.55, jitterCol = 14, skip, cap = 'round', alpha = 1 } = {}) => {
  const w = src.width, h = src.height;
  const sd = src.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data;
  g.save(); g.lineCap = cap;
  for (let j = 0; j * cell < h + cell; j++) for (let i = 0; i * cell < w + cell; i++) {
    const r = cellRng(i, j, seed);
    const px = i * cell + (r() - 0.5) * cell, py = j * cell + (r() - 0.5) * cell;
    const ix = clamp(px | 0, 0, w - 1), iy = clamp(py | 0, 0, h - 1), k = (iy * w + ix) * 4;
    if (alphaMask && sd[k + 3] < alphaMin) continue;
    if (mask && !mask(px, py)) continue;
    let col = [sd[k], sd[k + 1], sd[k + 2]];
    if (skip && skip(col, px, py, r)) continue;
    const pc = palette ? palette(px, py, col, r) : null;
    col = pc || P.jitter(col, r, jitterCol);
    const a = angle ? angle(px, py, r) : 0, l = len * (0.7 + r() * 0.6);
    const dx = Math.cos(a) * l / 2, dy = Math.sin(a) * l / 2;
    if (outline > 0) { g.strokeStyle = P.rgb(P.mix(col, outlineCol, outlineMix), outline * alpha); g.lineWidth = width + 2.5; g.beginPath(); g.moveTo(px - dx, py - dy); g.lineTo(px + dx, py + dy); g.stroke(); }
    g.strokeStyle = P.rgb(col, alpha); g.lineWidth = width * (0.8 + r() * 0.4);
    g.beginPath(); g.moveTo(px - dx, py - dy); g.lineTo(px + dx, py + dy); g.stroke();
  }
  g.restore();
};

// ================= Character frames =================
X.SPR = {};
const syncJSON = url => { const x = new XMLHttpRequest(); x.open('GET', url, false); x.send(); if (x.status !== 200) throw new Error(url + ' ' + x.status); return JSON.parse(x.responseText); };
X.sprites = keys => {
  const list = [];
  for (const k of keys) {
    if (!X.SPR[k]) { const meta = syncJSON(`demos/long_scroll/frames/${k}/meta.json`); X.SPR[k] = { key: k, meta, imgs: null, mats: {} }; }
    X.SPR[k].meta.frames.forEach(f => list.push(`demos/long_scroll/frames/${k}/${f.file}`));
  }
  return list;
};
function ensure(key) {
  const S = X.SPR[key]; if (S.imgs) return S;
  S.imgs = S.meta.frames.map(f => window.IMG[`demos/long_scroll/frames/${key}/${f.file}`]);
  // Hat top: center of topmost opaque pixel row
  S.hat = S.imgs.map(im => { const c = P.canvas(im.width, im.height), g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0); const d = g.getImageData(0, 0, im.width, im.height).data;
    for (let y = 0; y < im.height; y++) { let x0 = -1, x1 = -1; for (let x = 0; x < im.width; x++) if (d[(y * im.width + x) * 4 + 3] > 140) { if (x0 < 0) x0 = x; x1 = x; } if (x0 >= 0 && x1 - x0 > 6) return [(x0 + x1) / 2, y]; } return [im.width / 2, 0]; });
  return S;
}
// Texture: repaint AI frames with this style's strokes so character and scene share a brush (skip dark areas to protect glasses, eyes, hair)
const MAT = {
  monet: { pad: 8, cell: 6, len: 12, width: 4.2, seed: 11, outline: 0, angle: (x, y, r) => -0.55 + (r() - 0.5) * 0.9,
    skip: (col, x, y, r) => lum(col) < 95 || r() < 0.35,
    palette: (x, y, col, r) => { const L = lum(col);
      if (L > 205) return P.mix(hx(pick(['#fbf6ea', '#efe6f6', '#e0e2f6', '#fff0d4', '#e6eef8', '#f6e4ee'], r)), col, 0.45);
      if (col[0] > 190 && col[0] > col[2] + 40 && col[1] > 120) return P.mix(hx(pick(['#f6c6a6', '#f0b4a0', '#fad6bc', '#e8a890', '#f8d0b0'], r)), col, 0.45);
      if (col[0] > 150 && col[1] > 140 && col[2] < col[1]) return P.mix(hx(pick(['#d8c8a0', '#c8b48a', '#e2d4ae', '#b8aaa8', '#d0c0b8'], r)), col, 0.45);
      return null; } },
  vangogh: { pad: 8, cell: 7, len: 17, width: 5, seed: 13, outline: 0.45, outlineCol: [20, 26, 80],
    angle: (x, y, r) => Math.PI / 2 + Math.sin(y * 0.05 + x * 0.02) * 0.7 + (r() - 0.5) * 0.4,
    skip: (col, x, y, r) => lum(col) < 90 || r() < 0.25,
    palette: (x, y, col, r) => { const L = lum(col);
      if (L > 200) return P.mix(hx(pick(['#f8f0b0', '#e8f0f8', '#c8d8f0', '#fff6c8', '#d8e4f4'], r)), col, 0.35);
      if (col[0] > 190 && col[0] > col[2] + 40) return P.mix(hx(pick(['#f0b060', '#e8a050', '#f8c878', '#e89060'], r)), col, 0.4);
      return null; } },
};
function material(S, i, mat) {
  const key = mat; S.mats[key] = S.mats[key] || [];
  if (S.mats[key][i]) return S.mats[key][i];
  const im = S.imgs[i], M = MAT[mat], pad = M ? M.pad : 0;
  const out = P.canvas(im.width + 2 * pad, im.height + 2 * pad), g = out.getContext('2d');
  g.drawImage(im, pad, pad);
  if (M) { const base = P.canvas(out.width, out.height), bgx = base.getContext('2d', { willReadFrequently: true }); bgx.drawImage(im, pad, pad);
    // Protect features: no strokes within 7px of dark pixels (glasses, eyes, mouth, hairline), to avoid smearing face
    const bw = base.width, bh = base.height, bd = bgx.getImageData(0, 0, bw, bh).data, dk = new Uint8Array(bw * bh);
    for (let k = 0; k < bw * bh; k++) dk[k] = bd[k * 4 + 3] > 150 && (bd[k * 4] * 0.3 + bd[k * 4 + 1] * 0.59 + bd[k * 4 + 2] * 0.11) < 110 ? 1 : 0;
    const nearDark = (x, y) => { for (let dy = -7; dy <= 7; dy += 3.5) for (let dx = -7; dx <= 7; dx += 3.5) { const xx = (x + dx) | 0, yy = (y + dy) | 0; if (xx >= 0 && yy >= 0 && xx < bw && yy < bh && dk[yy * bw + xx]) return true; } return false; };
    X.strokes(g, base, { cell: M.cell, len: M.len, width: M.width, seed: M.seed + i, angle: M.angle, palette: M.palette, skip: (col, x, y, r) => M.skip(col, x, y, r) || nearDark(x, y), alphaMask: true, alphaMin: 170, outline: M.outline, outlineCol: M.outlineCol, jitterCol: 12 }); }
  if (mat === 'ukiyoe') {             // Woodgrain + paper fibers pressed into color blocks (multiply, character only)
    { const d = g.getImageData(0, 0, out.width, out.height), q = d.data;   // Generated white hat/T-shirt came out beige: restore low-saturation highlights to paper white (hat must be pure white)
      for (let k = 0; k < q.length; k += 4) { const mx = Math.max(q[k], q[k + 1], q[k + 2]), mn = Math.min(q[k], q[k + 1], q[k + 2]); if (q[k + 3] > 0 && mx > 185 && mx - mn < 48) { const f = (mx - 185) / 70; q[k] = lerp(q[k], 251, f); q[k + 1] = lerp(q[k + 1], 249, f); q[k + 2] = lerp(q[k + 2], 242, f); } }
      g.putImageData(d, 0, 0); }
    const tex = P.canvas(out.width, out.height), tg = tex.getContext('2d'), r = rng(77 + i);
    tg.fillStyle = '#fff'; tg.fillRect(0, 0, tex.width, tex.height);
    for (let k = 0; k < 160; k++) { const y = r() * tex.height; tg.strokeStyle = `rgba(150,110,60,${0.05 + r() * 0.08})`; tg.lineWidth = 1 + r() * 1.5; tg.beginPath(); tg.moveTo(0, y); tg.bezierCurveTo(tex.width * 0.3, y + (r() - 0.5) * 8, tex.width * 0.7, y + (r() - 0.5) * 8, tex.width, y + (r() - 0.5) * 6); tg.stroke(); }
    tg.globalCompositeOperation = 'destination-in'; tg.drawImage(out, 0, 0);
    g.globalCompositeOperation = 'multiply'; g.drawImage(tex, 0, 0); g.globalCompositeOperation = 'source-over';
  }
  out.pad = pad; S.mats[key][i] = out; return out;
}
// Draw frame. x,y = feet anchor (screen); h = standing height (scaled by meta.ref_h, same scale for entire frame set)
X.actor = (c, key, i, o) => {
  const S = ensure(key), f = S.meta.frames[i], mat = o.mat || 'none';
  const im = material(S, i, mat), pad = im.pad || 0, s = o.h / S.meta.ref_h * (o.scale || 1);
  const fx = o.flip ? -1 : 1;
  const dw = im.width * s, dh = im.height * s, x0 = o.x - (f.ax + pad) * s * fx, y0 = o.y - (f.ay + pad) * s;
  // Dappled Monet light: warm yellow spots and pale purple shadows in world coordinates slide across him as he walks
  const S2 = P.scratch('actorTmp'), g = S2.getContext('2d');
  const bw = Math.ceil(dw) + 4, bh = Math.ceil(dh) + 4;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, Math.min(W, bw + 4), Math.min(H, bh + 4));
  g.save(); if (o.flip) { g.translate(bw - 2, 2); g.scale(-1, 1); } else g.translate(2, 2); g.drawImage(im, 0, 0, dw, dh); g.restore();
  if (mat === 'monet' && o.dapple !== false) {
    g.save(); g.globalCompositeOperation = 'source-atop';
    const wx0 = (o.flip ? x0 - dw : x0) + ((o.wx ?? o.x) - o.x), t = o.t || 0;    // Sprite upper-left world x
    const cs = 70;
    for (let j = -1; j * cs < bh + cs; j++) for (let ii = Math.floor(wx0 / cs) - 1; ii * cs < wx0 + bw + cs; ii++) {
      const hh = U.hash(ii, j + 40), hv = U.hash(ii + 7, j); if (hh < 0.45) continue;
      const cx = ii * cs + hv * cs + Math.sin(t * 0.9 + ii) * 10 - wx0, cy = j * cs + U.hash(ii, j + 3) * cs + Math.cos(t * 0.7 + j) * 6, rr = 18 + hh * 26;
      const warm = U.hash(ii + 3, j + 9) > 0.35, rg = g.createRadialGradient(cx, cy, 0, cx, cy, rr);
      rg.addColorStop(0, warm ? 'rgba(255,238,170,0.42)' : 'rgba(110,96,190,0.26)'); rg.addColorStop(1, warm ? 'rgba(255,238,170,0)' : 'rgba(110,96,190,0)');
      g.fillStyle = rg; g.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
    }
    const sg = g.createLinearGradient(0, bh * 0.45, 0, bh); sg.addColorStop(0, 'rgba(120,110,200,0)'); sg.addColorStop(1, 'rgba(120,110,200,0.22)'); g.fillStyle = sg; g.fillRect(0, 0, bw, bh);
    g.restore();
  }
  c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha;
  if (o.shadow) { c.fillStyle = o.shadow; c.beginPath(); c.ellipse(o.x, o.y + 2, o.h * 0.2, o.h * 0.035, 0, 0, TAU); c.fill(); }
  c.drawImage(S2, 0, 0, bw, bh, (o.flip ? x0 - dw : x0) - 2, y0 - 2, bw, bh);
  c.restore();
};
X.hatTop = (key, i, o) => { const S = ensure(key), f = S.meta.frames[i], s = o.h / S.meta.ref_h * (o.scale || 1), [hxp, hyp] = S.hat[i], fx = o.flip ? -1 : 1;
  return [o.x + (hxp - f.ax) * s * fx, o.y + (hyp - f.ay) * s]; };
X.nFrames = key => X.SPR[key].meta.frames.length;

// ================= Monet: lily pond + Japanese bridge =================
// o: { key, x0, w, waterTop, bridge:{x0,x1,yEnd,lift}, pond:[px0,px1]|null, groundY, willows:[x...] }
const SW = {
  water: P.swatch(['#5b6fb5', '#7d8fd0', '#9db5e0', '#6aa0a8', '#b7a6d8', '#d9c8e8', '#8fb8a8', '#a6c4e8', '#c8b0d8'], 0.45),
  deep: P.swatch(['#2e5048', '#3f6a58', '#4a5f8a', '#355a4a', '#5a6a9a', '#2a4a5a', '#6a8a5a'], 0.45),
  fol: P.swatch(['#4f7f3a', '#6f9a40', '#2f5a30', '#9cbf58', '#c0d070', '#3a6a5a', '#7aa86a', '#5a8a9a', '#d8d890', '#4a5a8a'], 0.6),
  grass: P.swatch(['#5f8f4a', '#7fae5a', '#3f6f4a', '#9cc070', '#b4cc78', '#6a9a8a'], 0.35),
  path: P.swatch(['#d8b890', '#c89a78', '#e8c8a0', '#b88a8a', '#a89ab8', '#e0c0a8'], 0.35),
};
X.monetWorld = (o) => {
  const key = 'mw_' + o.key; if (X[key]) return X[key];
  const w = o.w, x0 = o.x0, B = o.bridge, mid = (B.x0 + B.x1) / 2, half = (B.x1 - B.x0) / 2;
  const deckY = x => { const q = clamp((x - mid) / half, -1, 1); return B.yEnd - B.lift * (1 - q * q); };
  const inPond = wx => !o.pond || (wx > o.pond[0] && wx < o.pond[1]);
  const pondEdge = (wx, y) => { if (!o.pond) return true; const sl = (y - o.groundY) * 0.25; return wx > o.pond[0] - sl && wx < o.pond[1] + sl; };
  const WT = o.waterTop, G = o.groundY;
  const isWater = (wx, y) => y > WT && (y < G - 10 ? inPond(wx) || true : pondEdge(wx, y)) && !(y < G + 30 && !inPond(wx) && y > G - 40);
  // ---- Underpainting ----
  const base = P.canvas(w, H), g = base.getContext('2d');
  g.fillStyle = '#2f4a36'; g.fillRect(0, 0, w, H);
  const r = rng(301);
  // Tree shade: low-frequency noise creates large light/dark masses (dark blue-green willow shade / mid green / sunlit yellow-green), then willow strands
  for (let i = 0; i < w * 0.12; i++) { const x = r() * w, y = r() * (G + 20), n = P.fbm((x + x0) * 0.0035, y * 0.005);
    const pal = n < -0.12 ? ['#1f3a2e', '#2a4a4a', '#34507a', '#2e5a40'] : n < 0.12 ? ['#3f6a3a', '#5a8a3e', '#4a7a6a', '#6a8a9a', '#5f8a4a'] : ['#9cc060', '#b8cc68', '#d8d890', '#c0d070', '#e8e0a0'];
    g.fillStyle = pick(pal, r); g.globalAlpha = 0.85; g.beginPath(); g.ellipse(x, y, 30 + r() * 80, 24 + r() * 50, r() * 3, 0, TAU); g.fill(); }
  for (let i = 0; i < w * 0.01; i++) { const x = r() * w, y = r() * 200; g.fillStyle = pick(['#cfd8e8', '#e6e0f0', '#d8e8d0', '#f0e8d0'], r); g.globalAlpha = 0.75; g.beginPath(); g.ellipse(x, y, 16 + r() * 34, 12 + r() * 18, 0, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
  for (let i = 0; i < w * 0.04; i++) { const x = r() * w, L = 180 + r() * 360, n = P.fbm((x + x0) * 0.0035, 0.5); g.strokeStyle = pick(n < 0 ? ['#3a6a4a', '#4a7a3a', '#2e5a48'] : ['#8ab050', '#a8c868', '#c8d878'], r); g.lineWidth = 5 + r() * 8; g.beginPath(); g.moveTo(x, -10); g.quadraticCurveTo(x + (r() - 0.5) * 30, L / 2, x + (r() - 0.5) * 40, L); g.stroke(); }
  // Water
  const wg = g.createLinearGradient(0, WT, 0, H); wg.addColorStop(0, '#34503f'); wg.addColorStop(0.18, '#456a7a'); wg.addColorStop(0.5, '#7590c0'); wg.addColorStop(1, '#a9b6dc');
  g.save(); g.beginPath();
  if (o.pond) { g.moveTo(o.pond[0] - x0, WT); g.lineTo(o.pond[1] - x0, WT); g.lineTo(o.pond[1] + (H - G) * 0.25 - x0, H); g.lineTo(o.pond[0] - (H - G) * 0.25 - x0, H); g.closePath(); }
  else g.rect(0, WT, w, H - WT);
  g.fillStyle = wg; g.fill(); g.clip();
  for (let i = 0; i < w * 0.03; i++) { const x = r() * w, y = WT + r() * 260, L = 60 + r() * 200; g.fillStyle = pick(['#2e5048', '#3f6a58', '#4a6a3a', '#5a7a4a'], r); g.globalAlpha = 0.6; g.fillRect(x, y, 10 + r() * 20, L); }
  for (let i = 0; i < w * 0.012; i++) { const x = r() * w, y = WT + 250 + r() * (H - WT - 250); g.fillStyle = pick(['#e8d6e8', '#f2e2c4', '#d0dcf0'], r); g.globalAlpha = 0.55; g.beginPath(); g.ellipse(x, y, 60 + r() * 120, 12 + r() * 16, 0, 0, TAU); g.fill(); }
  g.restore(); g.globalAlpha = 1;
  // Bank (when pond bounded): path + grass + irises
  if (o.pond) {
    g.save(); g.beginPath(); g.rect(0, G - 40, w, H); g.moveTo(o.pond[0] - x0, G - 40); g.lineTo(o.pond[1] - x0, G - 40); g.lineTo(o.pond[1] + (H - G + 40) * 0.25 - x0, H); g.lineTo(o.pond[0] - (H - G + 40) * 0.25 - x0, H); g.closePath(); g.clip('evenodd');
    g.fillStyle = '#5f8f4a'; g.fillRect(0, G - 40, w, H);
    g.fillStyle = '#d8b890'; g.fillRect(0, G - 8, w, 46);
    for (let i = 0; i < w * 0.03; i++) { const x = r() * w, y = G + 60 + r() * (H - G - 60); g.strokeStyle = '#4f7f3a'; g.lineWidth = 5; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + (k - 2) * 9 + (r() - 0.5) * 8, y - 50 - r() * 40); g.stroke(); } g.fillStyle = pick(['#7a5ab8', '#9a7ad0', '#f0e080', '#e890b0'], r); g.beginPath(); g.ellipse(x + (r() - 0.5) * 20, y - 70 - r() * 20, 12, 15, 0, 0, TAU); g.fill(); }
    g.restore();
  }
  // ---- Strokes ----
  const bg = P.canvas(w, H), bgc = bg.getContext('2d'); bgc.drawImage(base, 0, 0);
  const regionOf = (lx, y) => { const wx = lx + x0;
    if (y > WT) { if (!o.pond) return 'water'; const sl = (y - G + 40) * 0.25; if (y > G - 40 && (wx < o.pond[0] - Math.max(0, sl) || wx > o.pond[1] + Math.max(0, sl))) return (y < G + 38 && y > G - 8) ? 'path' : 'grass'; return 'water'; }
    if (o.pond && !inPond(wx) && y > G - 40) return (y > G - 8) ? 'path' : 'grass';
    return 'fol'; };
  X.strokes(bgc, base, { cell: 9, len: 30, width: 7, seed: 21, jitterCol: 12,
    angle: (lx, y, rr) => { const reg = regionOf(lx, y); if (reg === 'water') return 0.05 * Math.sin(y * 0.05 + lx * 0.004) + (rr() - 0.5) * 0.08; if (reg === 'path') return (rr() - 0.5) * 0.2; if (reg === 'grass') return -1.35 + (rr() - 0.5) * 0.6; return (y < WT - 120 ? -1.5 + 0.35 * P.noise((lx + x0) * 0.01, y * 0.01) : -0.9 + 0.8 * P.noise((lx + x0) * 0.01, y * 0.01)) + (rr() - 0.5) * 0.4; },
    palette: (lx, y, col, rr) => { const reg = regionOf(lx, y); if (reg === 'water') return y < WT + 120 + rr() * 200 ? SW.deep(col, rr) : SW.water(col, rr); return SW[reg](col, rr); } });
  // ---- Bridge (far railing + deck); near railing on separate layer (in front of hero) ----
  const mkBridge = (near) => { const c = P.canvas(w, H), q = c.getContext('2d'); q.lineCap = 'round'; q.lineJoin = 'round';
    const line = (dy, lw, col) => { q.strokeStyle = col; q.lineWidth = lw; q.beginPath(); for (let x = B.x0; x <= B.x1; x += 6) { const y = deckY(x) + dy; x === B.x0 ? q.moveTo(x - x0, y) : q.lineTo(x - x0, y); } q.stroke(); };
    if (!near) {
      // Bridge body (thickness below arch) + deck
      q.fillStyle = '#2f6a4a'; q.beginPath(); for (let x = B.x0; x <= B.x1; x += 6) q.lineTo(x - x0, deckY(x) - 4); for (let x = B.x1; x >= B.x0; x -= 6) q.lineTo(x - x0, deckY(x) + 30); q.closePath(); q.fill();
      line(-2, 10, '#8fdcae');
      line(-16 - 96, 8, '#4f9a72'); line(-16 - 52, 6, '#5fae82');
      q.strokeStyle = '#4f9a72'; q.lineWidth = 6; for (let x = B.x0 + 20; x < B.x1; x += 58) { q.beginPath(); q.moveTo(x - x0, deckY(x) - 10); q.lineTo(x - x0, deckY(x) - 16 - 96); q.stroke(); }
      // Piers
      [B.x0 + 30, B.x1 - 30].forEach(x => { q.fillStyle = '#2a5a3e'; q.fillRect(x - x0 - 10, deckY(x) + 20, 20, 120); });
    } else {
      line(-80, 9, '#7fcf9a'); line(-38, 6, '#6fbf8a');
      q.strokeStyle = '#6fbf8a'; q.lineWidth = 6; for (let x = B.x0 + 44; x < B.x1; x += 64) { q.beginPath(); q.moveTo(x - x0, deckY(x) + 22); q.lineTo(x - x0, deckY(x) - 80); q.stroke(); }
    }
    const out = P.canvas(w, H), og = out.getContext('2d'); og.drawImage(c, 0, 0);
    og.globalCompositeOperation = 'source-atop';
    X.strokes(og, c, { cell: 5, len: 11, width: 4, seed: near ? 31 : 32, alphaMask: true, alphaMin: 120, angle: (x, y, rr) => 0.1 + (rr() - 0.5) * 0.5,
      palette: (x, y, col, rr) => P.mix(hx(pick(['#8fdcae', '#a8e8c0', '#6fc49a', '#c0f0d0', '#4f9a8a', '#7fb8d8', '#3f7a5a'], rr)), col, 0.35) });
    return out; };
  const bridge = mkBridge(false), nearRail = mkBridge(true);
  // ---- Lilies (each prepainted to small image, ripple-driven bobbing each frame) ----
  const pads = [], rp = rng(505);
  const sc = y => 0.22 + 0.78 * clamp((y - WT) / (H - WT));
  for (let y = WT + 26; y < H + 20;) {
    const s = sc(y); let x = x0 + (rp() - 0.5) * 200;
    while (x < x0 + w + 100) {
      const clusterN = 2 + ((rp() * 5) | 0);
      for (let k = 0; k < clusterN; k++) {
        const wx = x + (rp() - 0.3) * 60 * s, wy = y + (rp() - 0.5) * 14 * s;
        if (!pondEdge(wx, wy) || (o.pond && wy > G - 30 && !inPond(wx))) continue;
        const rx = (22 + rp() * 26) * s * 1.7, ry = rx * (0.24 + 0.1 * s), flower = rp() < 0.3 ? (rp() < 0.6 ? 'pink' : 'white') : null;
        pads.push({ x: wx, y: wy, rx, ry, flower, notch: rp() * TAU, ph: rp() * TAU, img: null, s });
        x += rx * 1.6;
      }
      x += (60 + rp() * 260) * s * 1.6;
    }
    y += 18 + 44 * s;
  }
  pads.forEach((p, i) => { const pw = Math.ceil(p.rx * 2 + 16), ph = Math.ceil(p.ry * 2 + 34 * p.s + 16); const cc = P.canvas(pw, ph), q = cc.getContext('2d'), cx = pw / 2, cy = ph - p.ry - 8;
    q.fillStyle = pick(['#5f8f4a', '#7aa85a', '#6a9a4a', '#8ab860'], rng(i + 9)); q.beginPath(); q.ellipse(cx, cy, p.rx, p.ry, 0, p.notch + 0.35, p.notch + TAU - 0.35); q.lineTo(cx, cy); q.closePath(); q.fill();
    q.fillStyle = 'rgba(40,70,60,0.35)'; q.beginPath(); q.ellipse(cx, cy + p.ry * 0.25, p.rx * 0.95, p.ry * 0.7, 0, 0, Math.PI); q.fill();
    if (p.flower) { const fr = 11 * p.s * 1.6 + 3; q.fillStyle = p.flower === 'pink' ? '#f2a6bf' : '#fbf4f0'; q.beginPath(); q.ellipse(cx + p.rx * 0.15, cy - fr * 0.5, fr * 1.4, fr * 0.8, 0, 0, TAU); q.fill(); q.fillStyle = p.flower === 'pink' ? '#fff0f2' : '#f6d86a'; q.beginPath(); q.ellipse(cx + p.rx * 0.15, cy - fr * 0.8, fr * 0.6, fr * 0.45, 0, 0, TAU); q.fill(); }
    const out = P.canvas(pw, ph), og = out.getContext('2d'); og.drawImage(cc, 0, 0); og.globalCompositeOperation = 'source-atop';
    X.strokes(og, cc, { cell: Math.max(3, 5 * p.s + 1), len: 10 * p.s + 5, width: 3 * p.s + 1.6, seed: 600 + i, alphaMask: true, alphaMin: 100, angle: (x, y, rr) => (rr() - 0.5) * 0.4,
      palette: (x, y, col, rr) => col[1] > col[0] + 10 ? P.mix(hx(pick(['#5f8f4a', '#7fae5a', '#9cc070', '#b4cc78', '#4a7a5a', '#c8d880'], rr)), col, 0.3) : (lum(col) > 170 ? P.mix(hx(pick(['#fff2f4', '#f7d0dc', '#fbf4e8', '#f0a0b8'], rr)), col, 0.4) : null) });
    p.img = out; p.ax = cx; p.ay = cy; });
  // Water light spots (world coordinates)
  const glints = []; const rg = rng(909);
  for (let i = 0; i < w * 0.16; i++) { const wx = x0 + rg() * w, y = WT + 20 + rg() * (H - WT - 20); if (!pondEdge(wx, y)) continue; glints.push({ x: wx, y, f: 5 + rg() * 6, ph: rg() * TAU, l: (14 + rg() * 26) * (0.4 + sc(y)), col: pick(['#fffbe8', '#fdf0d0', '#f8e0ec', '#e8f4ff'], rg), w: (3 + rg() * 3) * (0.5 + sc(y) * 0.7) }); }
  const M = X[key] = { o, base, bg, bridge, nearRail, pads, glints, deckY, sc, x0, w, WT, G, pondEdge, inPond };
  return M;
};
// Each frame: base → lilies (ripple bobbing) → light → ripples → bridge (far railing); after hero, X.monetFront (near railing + foreground willow)
X.monetBack = (c, M, camX, t, ev = {}) => {
  c.drawImage(M.bg, M.x0 - camX, 0);
  const hops = ev.hops || [];
  // Lilies
  for (const p of M.pads) { const sx = p.x - camX; if (sx < -200 || sx > W + 200) continue;
    let dy = Math.sin(t * 1.1 + p.ph) * 1.5 * p.s, rot = 0;
    for (const h of hops) { const a = t - h.t; if (a < 0 || a > 2.2) continue; const d = Math.hypot(p.x - h.x, (p.y - h.y) * 3.2), R = 40 + a * 260 * h.s; const near = Math.exp(-Math.pow((d - R) / (60 * h.s + 20), 2)) * Math.exp(-a * 1.6);
      dy += Math.sin(a * 16) * 7 * h.s * near; rot += Math.sin(a * 13 + 1) * 0.06 * near; }
    if (ev.padBump && ev.padBump.pad === p) { const a = t - ev.padBump.t; if (a > 0 && a < 1.2) dy += Math.sin(a * 18) * 16 * Math.exp(-a * 3) * p.s + (a < 0.12 ? 10 * p.s : 0); }
    c.save(); c.translate(sx, p.y + dy); c.rotate(rot); c.drawImage(p.img, -p.ax, -p.ay); c.restore(); }
  // Shimmering light spots (fixed positions, irregular brightness, small horizontal jumps at 10fps)
  const st = Math.floor(t * 10); c.save(); c.lineCap = 'round';
  for (let i = 0; i < M.glints.length; i++) { const gl = M.glints[i], sx = gl.x - camX; if (sx < -60 || sx > W + 60) continue;
    const a = clamp(Math.sin(t * gl.f + gl.ph) * Math.sin(t * 2.3 + i), 0, 1); if (a < 0.12) continue;
    const jx = (U.hash(i, st) - 0.5) * 8; c.strokeStyle = gl.col; c.globalAlpha = 0.85 * a; c.lineWidth = gl.w; c.beginPath(); c.moveTo(sx + jx, gl.y); c.lineTo(sx + jx + gl.l, gl.y + 1); c.stroke(); }
  c.restore();
  // Ripples: broken bright short strokes forming perspective ellipses, expanding in rings
  for (const h of hops) X.ripple(c, h.x - camX, h.y, t - h.t, h.s, h.big);
  c.drawImage(M.bridge, M.x0 - camX, 0);
};
X.ripple = (c, x, y, a, s, big) => {
  if (a < 0 || a > 2.0) return;
  c.save(); c.lineCap = 'round';
  for (let k = 0; k < (big ? 4 : 3); k++) { const ak = a - k * 0.16; if (ak <= 0) continue; const R = (22 + ak * (big ? 380 : 300)) * s, al = clamp(1 - ak / 1.6) * (1 - k * 0.15); if (al <= 0) continue;
    const n = Math.max(10, Math.round(R / 7)); for (let i = 0; i < n; i++) { if (U.hash(i, k * 17 + 3) < 0.3) continue; const th = i / n * TAU + k * 0.4, th2 = th + TAU / n * 0.55;
      c.strokeStyle = ['#ffffff', '#fffbe8', '#eef0ff'][(i + k) % 3]; c.globalAlpha = al; c.lineWidth = (9 - k * 1.4) * (0.5 + s * 0.6);
      c.beginPath(); c.ellipse(x, y, R, R * 0.27, 0, th, th2); c.stroke(); } }
  // Splash (short vertical strokes flung upward)
  if (a < 0.1) { c.globalAlpha = 1 - a / 0.1; c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(x, y, 40 * s, 12 * s, 0, 0, TAU); c.fill(); }
  if (a < 0.4) { const r = rng(Math.round(x * 7 + y)); for (let i = 0; i < (big ? 22 : 14); i++) { const ang = -Math.PI / 2 + (r() - 0.5) * 1.6, sp = (90 + r() * 150) * s * (big ? 1.6 : 1), q = a / 0.4;
      const px = x + Math.cos(ang) * sp * a * 2.2, py = y + Math.sin(ang) * sp * a * 2.2 + 300 * a * a * s; c.globalAlpha = 1 - q; c.strokeStyle = i % 2 ? '#ffffff' : '#dfe8ff'; c.lineWidth = 6 * (0.5 + s * 0.6); c.beginPath(); c.moveTo(px, py); c.lineTo(px - Math.cos(ang) * 8 * s, py - Math.sin(ang) * 8 * s); c.stroke(); } }
  c.restore();
};
X.monetFront = (c, M, camX, t, willows = []) => {
  c.drawImage(M.nearRail, M.x0 - camX, 0);
  // Foreground willow: hangs from top, sways in masses
  c.save(); c.lineCap = 'round';
  willows.forEach((wx, k) => { const sx = wx - camX; if (sx < -200 || sx > W + 200) return; const r = rng(80 + k);
    for (let f = 0; f < 9; f++) { const fx = sx + (r() - 0.5) * 150, L = 260 + r() * 300, ph = r() * TAU;
      for (let i = 0; i < 26; i++) { const q = i / 25, sw = Math.sin(t * 1.6 + ph + q * 2) * 26 * q * q, px = fx + sw + Math.sin(q * 5 + f) * 6, py = -10 + L * q;
        c.strokeStyle = pick(['#6f9a40', '#9cbf58', '#4f7f3a', '#c0d070', '#3a6a5a'], r); c.lineWidth = 5; c.globalAlpha = 0.9; c.beginPath(); c.moveTo(px, py); c.lineTo(px + 4 + sw * 0.05, py + 14); c.stroke(); } } });
  c.restore();
};

// ================= Stone skipping =================
// plan: { t0, from:[x,y], hops:[{x,y,t,s}], sinkT, sinkS }
X.stone = (t, plan) => {
  if (t < plan.t0) return null;
  const pts = [{ x: plan.from[0], y: plan.from[1], t: plan.t0, s: plan.s0 || 0.5 }].concat(plan.hops);
  for (let i = 1; i < pts.length; i++) { const A = pts[i - 1], B = pts[i]; if (t <= B.t) { const q = (t - A.t) / (B.t - A.t);
      const pk = i === 1 ? (plan.firstArc || 80) : (B.peak ?? 60) * (B.s ?? 1);
      return { x: lerp(A.x, B.x, q), y: lerp(A.y, B.y, q) - 4 * pk * q * (1 - q), s: lerp(A.s, B.s, q), spin: t * 30 }; } }
  return null;
};
X.drawStone = (c, st, trail) => { if (!st) return; const s = 1.2 + st.s * 1.4;
  if (trail) { c.save(); c.lineCap = 'round'; for (let k = 1; k <= 6; k++) { const p = trail(k * 0.018); if (!p) break; c.strokeStyle = '#fffbea'; c.globalAlpha = 0.5 * (1 - k / 7); c.lineWidth = 9 * s * (1 - k / 8); c.beginPath(); c.moveTo(p.x, p.y); const q = trail((k - 1) * 0.018) || st; c.lineTo(q.x, q.y); c.stroke(); } c.restore(); }
  c.save(); c.translate(st.x, st.y);
  c.fillStyle = 'rgba(40,40,80,.3)'; c.beginPath(); c.ellipse(2, 4, 13 * s, 6 * s, 0, 0, TAU); c.fill();
  c.fillStyle = '#4a4a6a'; c.beginPath(); c.ellipse(0, 0, 11 * s, 11 * s * Math.abs(Math.cos(st.spin)) * 0.5 + 3 * s, 0, 0, TAU); c.fill();
  c.fillStyle = '#d8d8f0'; c.beginPath(); c.ellipse(-2 * s, -1.5 * s, 4.5 * s, 2 * s, 0, 0, TAU); c.fill(); c.restore(); };
// Draw stone with trail: x can include camera offset
X.stoneAt = (c, lt, plan, camX = 0) => { const sh = p => p ? { ...p, x: p.x - camX } : null; X.drawStone(c, sh(X.stone(lt, plan)), dt => sh(X.stone(lt - dt, plan))); };

// ================= Frog (geometric animal, code-drawn; textured per style) =================
const FROG = {};
function frogImg(pose, style) {
  const k = pose + style; if (FROG[k]) return FROG[k];
  const cw = 200, ch = 160, cc = P.canvas(cw, ch), q = cc.getContext('2d'); q.translate(100, 110); q.lineJoin = 'round';
  const body = style === 'vangogh' ? '#3f8a3a' : '#6aa84a', dark = style === 'vangogh' ? '#1f4a2a' : '#3f6a3a', belly = '#d8e8a0';
  if (pose === 'leap') {
    q.fillStyle = dark; q.beginPath(); q.ellipse(-62, 20, 38, 9, 0.3, 0, TAU); q.fill(); q.beginPath(); q.ellipse(-60, 34, 36, 8, 0.15, 0, TAU); q.fill();
    q.fillStyle = body; q.beginPath(); q.ellipse(0, 0, 50, 26, -0.15, 0, TAU); q.fill();
    q.fillStyle = belly; q.beginPath(); q.ellipse(4, 10, 32, 12, -0.15, 0, TAU); q.fill();
    q.fillStyle = dark; q.beginPath(); q.ellipse(46, 18, 20, 7, 0.6, 0, TAU); q.fill();
    [[28, -22], [8, -26]].forEach(([x, y]) => { q.fillStyle = body; q.beginPath(); q.arc(x, y, 13, 0, TAU); q.fill(); q.fillStyle = '#fbf6e0'; q.beginPath(); q.arc(x + 2, y - 1, 8, 0, TAU); q.fill(); q.fillStyle = '#1a1a2a'; q.beginPath(); q.arc(x + 4, y - 1, 4.5, 0, TAU); q.fill(); });
  } else {
    q.fillStyle = dark; q.beginPath(); q.ellipse(-30, 18, 34, 18, -0.2, 0, TAU); q.fill(); q.beginPath(); q.ellipse(30, 18, 34, 18, 0.2, 0, TAU); q.fill();
    q.fillStyle = body; q.beginPath(); q.ellipse(0, -2, 46, 34, 0, 0, TAU); q.fill();
    q.fillStyle = belly; q.beginPath(); q.ellipse(0, 12, 28, 16, 0, 0, TAU); q.fill();
    q.fillStyle = dark; [[-18, 30], [18, 30]].forEach(([x, y]) => { q.beginPath(); q.ellipse(x, y, 10, 6, 0, 0, TAU); q.fill(); });
    [[-20, -30], [20, -30]].forEach(([x, y]) => { q.fillStyle = body; q.beginPath(); q.arc(x, y, 15, 0, TAU); q.fill(); q.fillStyle = '#fbf6e0'; q.beginPath(); q.arc(x, y - 2, 9.5, 0, TAU); q.fill(); q.fillStyle = '#1a1a2a'; q.beginPath(); q.arc(x, y - 1, 5, 0, TAU); q.fill(); });
    q.strokeStyle = '#2a3a2a'; q.lineWidth = 3; q.lineCap = 'round'; q.beginPath(); q.arc(0, -4, 16, 0.25, Math.PI - 0.25); q.stroke();
  }
  const out = P.canvas(cw, ch), og = out.getContext('2d'); og.drawImage(cc, 0, 0); og.globalCompositeOperation = 'source-atop';
  const M = MAT[style] || MAT.monet;
  X.strokes(og, cc, { cell: 5, len: style === 'vangogh' ? 12 : 9, width: 3.6, seed: 71, alphaMask: true, alphaMin: 120, outline: style === 'vangogh' ? 0.4 : 0, outlineCol: [20, 30, 60],
    angle: (x, y, r) => (style === 'vangogh' ? Math.atan2(y - 110, x - 100) + Math.PI / 2 : -0.4) + (r() - 0.5) * 0.5, skip: (col) => lum(col) < 60 || lum(col) > 235,
    palette: (x, y, col, r) => col[1] > col[0] + 20 ? P.mix(hx(pick(style === 'vangogh' ? ['#3f8a3a', '#6aaa40', '#2a6a4a', '#c8d040'] : ['#6aa84a', '#8ac060', '#4f8a4a', '#a8d070', '#5a9a8a'], r)), col, 0.35) : null });
  out.ax = 100; out.ay = 128; FROG[k] = out; return out;
}
// x,y = feet; s = scale (1 ≈ 100px wide); o.rot rotation, o.croak 0..1 vocal-sac inflation
X.frog = (c, x, y, s, pose, style, o = {}) => {
  const im = frogImg(pose, style); c.save(); c.translate(x, y); c.rotate(o.rot || 0); c.scale(s * (o.flip ? -1 : 1), s * (o.sy || 1)); c.drawImage(im, -im.ax, -im.ay);
  if (o.croak > 0) { c.fillStyle = 'rgba(240,236,190,0.92)'; c.beginPath(); c.ellipse(0, -14 + 26, 14 + 22 * o.croak, 8 + 15 * o.croak, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(120,130,80,.6)'; c.lineWidth = 2; c.stroke(); }
  c.restore();
};

// ================= Ukiyo-e: coast, Fuji, great wave =================
const INK = '#1c1a1e';
const uF = (g, path, fill, lw = 2.6) => { if (fill) { g.save(); g.translate(3, 2); g.fillStyle = fill; g.fill(path); g.restore(); } if (lw) { g.strokeStyle = INK; g.lineWidth = lw; g.stroke(path); } };
const poly = pts => { const p = new Path2D(); pts.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); p.closePath(); return p; };
X.ukiyoeWorld = (o) => {
  const key = 'uw_' + o.key; if (X[key]) return X[key];
  const w = o.w, x0 = o.x0, G = o.groundY, SEA = o.sea || 560;
  const c = P.canvas(w, H), g = c.getContext('2d');
  const sg = g.createLinearGradient(0, 0, 0, SEA); sg.addColorStop(0, '#2c4a80'); sg.addColorStop(0.1, '#4a6a98'); sg.addColorStop(0.3, '#e8d8a0'); sg.addColorStop(0.75, '#f2dc96'); sg.addColorStop(1, '#f3c98a');
  g.fillStyle = sg; g.fillRect(0, 0, w, SEA);
  const r = rng(41); for (let i = 0; i < w * 0.3; i++) { const y = r() * SEA; g.strokeStyle = y < 90 ? `rgba(30,50,110,${0.06 + r() * 0.1})` : `rgba(140,90,40,${0.03 + r() * 0.05})`; g.lineWidth = 1 + r() * 2; g.beginPath(); g.moveTo(r() * w, y); g.lineTo(r() * w, y + (r() - 0.5) * 3); g.stroke(); }
  // Fuji
  (o.fuji || []).forEach(fx => { const lx = fx - x0; uF(g, poly([[lx - 230, SEA], [lx - 30, SEA - 230], [lx + 30, SEA - 232], [lx + 240, SEA]]), '#26467e', 2.4);
    uF(g, poly([[lx - 70, SEA - 190], [lx - 30, SEA - 230], [lx + 30, SEA - 232], [lx + 72, SEA - 192], [lx + 50, SEA - 196], [lx + 34, SEA - 176], [lx + 16, SEA - 196], [lx - 4, SEA - 172], [lx - 24, SEA - 196], [lx - 46, SEA - 180]]), '#fbf8ee', 1.8); });
  // Distant sea
  g.save(); g.translate(3, 2); g.fillStyle = '#18305e'; g.fillRect(0, SEA, w, G - 40 - SEA); g.restore();
  g.strokeStyle = INK; g.lineWidth = 2.4; g.beginPath(); g.moveTo(0, SEA); g.lineTo(w, SEA); g.stroke();
  // Shore
  const shore = new Path2D(); shore.moveTo(0, G - 30); for (let x = 0; x <= w; x += 40) shore.lineTo(x, G - 30 + Math.sin(x * 0.013) * 8); shore.lineTo(w, H); shore.lineTo(0, H); shore.closePath();
  uF(g, shore, '#e8c890', 3);
  g.save(); g.clip(shore); for (let i = 0; i < w * 0.05; i++) { const x = r() * w, y = G + r() * (H - G); g.fillStyle = 'rgba(150,100,50,.25)'; g.beginPath(); g.ellipse(x, y, 3 + r() * 6, 1.5 + r() * 2, 0, 0, TAU); g.fill(); }
  const pg = g.createLinearGradient(0, G + 120, 0, H); pg.addColorStop(0, 'rgba(160,120,70,0)'); pg.addColorStop(1, 'rgba(160,120,70,.35)'); g.fillStyle = pg; g.fillRect(0, G, w, H - G); g.restore();
  g.strokeStyle = INK; g.lineWidth = 2; for (let x = 20; x < w; x += 140) { g.beginPath(); g.moveTo(x, G + 70 + (x % 3) * 30); g.quadraticCurveTo(x + 40, G + 64 + (x % 3) * 30, x + 80, G + 72 + (x % 3) * 30); g.stroke(); }
  // Pine
  (o.pines || []).forEach(px => { const lx = px - x0; const trunk = poly([[lx - 14, G - 20], [lx - 30, G - 200], [lx + 10, G - 330], [lx + 60, G - 400], [lx + 40, G - 330], [lx + 12, G - 200], [lx + 14, G - 20]]); uF(g, trunk, '#8a4a2a', 2.6);
    [[lx - 60, G - 260, 90], [lx + 80, G - 400, 110], [lx - 10, G - 360, 80], [lx + 120, G - 300, 70]].forEach(([x, y, rr]) => { const p = new Path2D(); p.ellipse(x, y, rr, rr * 0.32, -0.08, 0, TAU); uF(g, p, '#2f5a3a', 2.4); g.strokeStyle = 'rgba(20,40,30,.6)'; g.lineWidth = 1.4; for (let k = -rr + 10; k < rr - 10; k += 12) { g.beginPath(); g.moveTo(x + k, y - 6); g.lineTo(x + k + 6, y + 8); g.stroke(); } }); });
  // Paper texture overlay
  const ov = P.canvas(w, H), og = ov.getContext('2d'); const ro = rng(5);
  for (let i = 0; i < w * 0.7; i++) { const y = ro() * H, x = ro() * w, L = 200 + ro() * 700; og.strokeStyle = `rgba(120,80,40,${0.025 + ro() * 0.04})`; og.lineWidth = 1 + ro(); og.beginPath(); og.moveTo(x, y); og.lineTo(x + L, y + (ro() - 0.5) * 6); og.stroke(); }
  for (let i = 0; i < w * 1.2; i++) { const x = ro() * w, y = ro() * H; og.strokeStyle = ro() < 0.5 ? 'rgba(255,250,235,.12)' : 'rgba(90,60,30,.07)'; og.lineWidth = 1; og.beginPath(); og.arc(x, y, 3 + ro() * 6, ro() * 6, ro() * 6 + 1); og.stroke(); }
  return X[key] = { o, bg: c, over: ov, x0, w, G, SEA };
};
// Great wave (each frame): body + inner flow lines (advancing dashes) + foam band + curling claws + spray
X.greatWave = (c, bx, by, S, t) => {
  c.save(); c.translate(bx, by); c.scale(S, S); c.lineCap = 'round'; c.lineJoin = 'round';
  const k = Math.sin(t * 2.4) * 0.5 + 0.5;                       // Forward curl of wave lip
  const back = K => KIT.densify(K, 6);
  const O = back([[-420, 0], [-300, -90], [-190, -220], [-80, -350], [40, -430], [150, -432 + k * 8], [240, -380 + k * 14], [282 + k * 30, -300 + k * 34]]);
  const tip = O[O.length - 1];
  const I = back([tip, [220 + k * 12, -290 + k * 20], [150, -300], [100, -250], [96, -160], [130, -70], [220, 0]]);
  const body = new Path2D(); O.forEach((p, i) => i ? body.lineTo(p[0], p[1]) : body.moveTo(p[0], p[1])); I.forEach(p => body.lineTo(p[0], p[1])); body.closePath();
  uF(c, body, '#26467e', 3.2);
  // Wave flow lines: offset inward from back contour, dashes surge toward crest
  c.save(); c.clip(body); c.setLineDash([30, 16]); c.lineDashOffset = -t * 140;
  for (let m = 1; m < 9; m++) { c.strokeStyle = m % 2 ? 'rgba(150,182,226,.9)' : 'rgba(236,242,250,.8)'; c.lineWidth = 7; c.beginPath();
    O.forEach((p, i) => { const q = i / (O.length - 1); const x = p[0] + m * 26 * (0.4 + q) , y = p[1] + m * 30 * (1 - q * 0.6); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); }
  c.restore(); c.setLineDash([]);
  // Foam band (upper wave back)
  const top = O.slice(Math.floor(O.length * 0.35));
  c.strokeStyle = INK; c.lineWidth = 40; c.beginPath(); top.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
  c.strokeStyle = '#fbf7ec'; c.lineWidth = 35; c.stroke();
  // Wave claws: clusters of plump fingers along lip, pointing forward/down and curling inward
  const claw = (x, y, ang, L, kk) => { const lens = [1, 0.66, 0.56, 0.42], offs = [0, -0.6, 0.45, -0.25];
    for (let f = 0; f < 4; f++) { let a = ang + offs[f], px = x, py = y; const LL = L * lens[f], pts = [[px, py]], cv = 1.1 + Math.sin(t * 5 + kk * 0.9) * 0.6;
      for (let s2 = 0; s2 < 7; s2++) { a += cv * 0.34 * (0.5 + s2 / 7) / 2.4; px += Math.cos(a) * LL / 7; py += Math.sin(a) * LL / 7; pts.push([px, py]); }
      [[LL * 0.32 + 4, INK], [LL * 0.32, '#fbf7ec'], [LL * 0.1, '#9ab0c8']].forEach(([lw, col]) => { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); }); } };
  const lipStart = Math.floor(O.length * 0.55);
  for (let j = lipStart, kk = 0; j < O.length; j += 3, kk++) { const p = O[j], q = O[Math.max(0, j - 1)]; const nx = p[1] - q[1], ny = -(p[0] - q[0]); const a = Math.atan2(ny, nx) * -1; claw(p[0], p[1], Math.atan2(-(p[0] - q[0]), (p[1] - q[1])) + 0.6, 60 + (kk % 3) * 16, kk); }
  for (let j = 0, kk = 20; j < 4; j++, kk++) { const p = I[1 + j]; claw(p[0], p[1], 1.3, 46, kk); }
  // Spray (Hokusai's snow)
  const r = rng(13); c.fillStyle = '#fbf7ec'; c.strokeStyle = INK; c.lineWidth = 1.6;
  for (let i = 0; i < 40; i++) { const ph = (t * 0.7 + r()) % 1, x = tip[0] - 20 + r() * 150 + ph * 90, y = tip[1] - 30 - r() * 90 + ph * ph * 260, rr = 2.5 + r() * 4; c.globalAlpha = 1 - ph * 0.7; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill(); c.stroke(); }
  c.restore();
};
// Near-sea wave lines (translate each frame)
X.seaLines = (c, x0, y0, w, h, t) => { c.save(); c.beginPath(); c.rect(x0, y0, w, h); c.clip(); c.strokeStyle = 'rgba(230,236,245,.85)'; c.lineWidth = 3; const r = rng(3);
  for (let k = 0; k < 9; k++) { const y = y0 + 12 + k * (h / 9), off = (t * 40 * (k % 2 ? 1 : -0.6)) % 120; for (let x = x0 - 120 + off + r() * 60; x < x0 + w; x += 120) { c.beginPath(); c.arc(x, y + 10, 22, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); } } c.restore(); };

// ================= Van Gogh: Starry Night =================
X.vgWorld = (o) => {
  const key = 'vg_' + o.key; if (X[key]) return X[key];
  const w = o.w, x0 = o.x0, G = o.groundY, HOR = o.horizon || 600;
  const stars = []; const rs = rng(17); for (let x = 120; x < w; x += 200 + rs() * 140) { const sx = x0 + x; if ((o.cypress || []).some(cx => Math.abs(cx - sx) < 160)) continue; stars.push({ x: sx, y: 70 + rs() * 360, r: 16 + rs() * 16 }); }
  const swirls = (o.swirls || []).map(([x, y, R]) => ({ x, y, R }));
  const moon = o.moon;
  const angleSky = (wx, y) => { let a = 0.15 * Math.sin(wx * 0.004 + y * 0.01);
    for (const s of swirls) { const dx = wx - s.x, dy = (y - s.y) * 1.6, d = Math.hypot(dx, dy); const f = Math.exp(-Math.pow(d / s.R, 2) * 0.8); a = lerp(a, Math.atan2(dy, dx) + Math.PI / 2, f); }
    for (const s of stars.concat(moon ? [{ x: moon[0], y: moon[1], r: 60 }] : [])) { const dx = wx - s.x, dy = y - s.y, d = Math.hypot(dx, dy); if (d < s.r * 3.2) a = Math.atan2(dy, dx) + Math.PI / 2; }
    return a; };
  const base = P.canvas(w, H), g = base.getContext('2d');
  const sg = g.createLinearGradient(0, 0, 0, HOR); sg.addColorStop(0, '#13246a'); sg.addColorStop(0.5, '#25479e'); sg.addColorStop(1, '#5a7ec0'); g.fillStyle = sg; g.fillRect(0, 0, w, HOR + 40);
  swirls.forEach(s => { g.strokeStyle = '#9ab8e0'; g.lineWidth = 46; g.beginPath(); for (let a = 0; a < TAU * 1.4; a += 0.1) { const rr = s.R * (0.3 + a / (TAU * 1.4) * 0.7); g.lineTo(s.x - x0 + Math.cos(a) * rr, s.y + Math.sin(a) * rr / 1.6); } g.stroke(); });
  stars.forEach(s => { const rg = g.createRadialGradient(s.x - x0, s.y, 0, s.x - x0, s.y, s.r * 2.6); rg.addColorStop(0, '#fff8c0'); rg.addColorStop(0.35, '#f0e070'); rg.addColorStop(0.6, '#c8d8a0'); rg.addColorStop(1, 'rgba(90,126,192,0)'); g.fillStyle = rg; g.beginPath(); g.arc(s.x - x0, s.y, s.r * 2.6, 0, TAU); g.fill(); });
  if (moon) { const rg = g.createRadialGradient(moon[0] - x0, moon[1], 0, moon[0] - x0, moon[1], 150); rg.addColorStop(0, '#fff0a0'); rg.addColorStop(0.4, '#f0c840'); rg.addColorStop(0.7, '#e8d080'); rg.addColorStop(1, 'rgba(90,126,192,0)'); g.fillStyle = rg; g.beginPath(); g.arc(moon[0] - x0, moon[1], 150, 0, TAU); g.fill(); }
  // Distant hills, village
  g.fillStyle = '#2a3a78'; g.beginPath(); g.moveTo(0, HOR); for (let x = 0; x <= w; x += 30) g.lineTo(x, HOR - 70 - Math.sin(x * 0.004 + 1) * 50 - Math.sin(x * 0.011) * 20); g.lineTo(w, HOR + 60); g.lineTo(0, HOR + 60); g.fill();
  const rv = rng(23); for (let x = 30; x < w; x += 46 + rv() * 30) { const hh = 26 + rv() * 30, y = HOR + 10 + rv() * 30; g.fillStyle = pick(['#3a4a6a', '#4a5a8a', '#5a6a5a'], rv); g.fillRect(x, y - hh, 40, hh); g.fillStyle = '#2a3058'; g.beginPath(); g.moveTo(x - 4, y - hh); g.lineTo(x + 20, y - hh - 18); g.lineTo(x + 44, y - hh); g.fill(); if (rv() < 0.6) { g.fillStyle = '#f8d850'; g.fillRect(x + 12, y - hh + 8, 10, 10); } }
  g.fillStyle = '#3a5a3a'; g.fillRect(0, HOR + 50, w, G - HOR - 50);
  const pg = g.createLinearGradient(0, G - 30, 0, H); pg.addColorStop(0, '#8a8a3a'); pg.addColorStop(0.3, '#c8a040'); pg.addColorStop(1, '#7a6a3a'); g.fillStyle = pg; g.fillRect(0, G - 30, w, H - G + 30);
  (o.cypress || []).forEach(cx => { const lx = cx - x0; g.fillStyle = '#1e2e1e'; g.beginPath(); g.moveTo(lx - 70, G + 10); g.bezierCurveTo(lx - 90, G - 300, lx - 30, G - 500, lx + 6, G - 760); g.bezierCurveTo(lx + 40, G - 520, lx + 90, G - 300, lx + 70, G + 10); g.fill(); });
  const out = P.canvas(w, H), oc = out.getContext('2d'); oc.drawImage(base, 0, 0);
  const isCyp = (lx, y) => (o.cypress || []).some(cx => Math.abs(lx + x0 - cx) < 80 * (0.2 + (y - (G - 760)) / 760) && y > G - 760 && y < G + 10);
  X.strokes(oc, base, { cell: 10, len: 28, width: 7, seed: 51, outline: 0.5, outlineCol: [16, 22, 70], jitterCol: 16,
    angle: (lx, y, r) => isCyp(lx, y) ? -Math.PI / 2 + Math.sin(y * 0.03) * 0.5 : y < HOR + 20 ? angleSky(lx + x0, y) : y < G - 30 ? Math.sin(lx * 0.02) * 0.4 : 0.2 * Math.sin(lx * 0.01 + y * 0.02),
    palette: (lx, y, col, r) => { const L = lum(col);
      if (isCyp(lx, y)) return P.mix(hx(pick(['#1e3a24', '#2a4a2a', '#3a5a2a', '#14241a', '#4a6a3a'], r)), col, 0.3);
      if (y < HOR + 20) { if (L > 180) return P.mix(hx(pick(['#fff8c0', '#f0e070', '#f8d850', '#e8f0d0'], r)), col, 0.4); if (L > 120) return P.mix(hx(pick(['#9ab8e0', '#c8d8f0', '#e8e8c0', '#6a8ad0'], r)), col, 0.4); return P.mix(hx(pick(['#1e3a8a', '#2a52a8', '#3a6ac0', '#5a86d0', '#1a2a6a', '#3a4aa0'], r)), col, 0.4); }
      if (y > G - 30) return P.mix(hx(pick(['#c8a040', '#e0b850', '#8a7a3a', '#a89a4a', '#6a7a3a'], r)), col, 0.4);
      return null; } });
  return X[key] = { o, bg: out, x0, w, G, stars, moon, swirls, angleSky };
};
// Moving starry sky: rotating star halos, short strokes flowing along spiral bands
X.vgSky = (c, V, camX, t) => {
  c.save(); c.lineCap = 'round';
  V.stars.forEach((s, k) => { const sx = s.x - camX; if (sx < -150 || sx > W + 150) return; const pul = 1 + 0.12 * Math.sin(t * 3 + k);
    for (let ring = 0; ring < 2; ring++) { const R = s.r * (1.5 + ring * 0.8) * pul, n = 16 + ring * 6; for (let i = 0; i < n; i++) { const a = i / n * TAU + t * (0.8 - ring * 0.3) * (k % 2 ? 1 : -1);
      c.strokeStyle = ring ? '#c8d8a0' : '#fff2a0'; c.lineWidth = 5; c.globalAlpha = 0.85; c.beginPath(); c.arc(sx, s.y, R, a, a + 0.22); c.stroke(); } } });
  V.swirls.forEach((s, k) => { const sx = s.x - camX; if (sx < -s.R * 1.5 || sx > W + s.R * 1.5) return;
    for (let i = 0; i < 60; i++) { const q = ((i / 60) + t * 0.12) % 1, a = q * TAU * 1.4, rr = s.R * (0.3 + q * 0.7), x = sx + Math.cos(a) * rr, y = s.y + Math.sin(a) * rr / 1.6, ta = a + Math.PI / 2;
      c.strokeStyle = ['#e8f0ff', '#c8d8f0', '#fff8d0'][i % 3]; c.lineWidth = 6; c.globalAlpha = 0.8 * Math.sin(q * Math.PI); c.beginPath(); c.moveTo(x - Math.cos(ta) * 14, y - Math.sin(ta) * 9); c.lineTo(x + Math.cos(ta) * 14, y + Math.sin(ta) * 9); c.stroke(); } });
  if (V.moon) { const sx = V.moon[0] - camX; c.globalAlpha = 1; c.fillStyle = '#ffe680'; c.beginPath(); c.arc(sx, V.moon[1], 52, 0, TAU); c.fill(); c.fillStyle = '#e8a830'; c.beginPath(); c.arc(sx + 22, V.moon[1] - 12, 46, 0, TAU); c.fill();
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU - t * 0.5, R = 90 + 8 * Math.sin(t * 2 + i); c.strokeStyle = '#f8e070'; c.lineWidth = 6; c.globalAlpha = 0.75; c.beginPath(); c.arc(sx, V.moon[1], R, a, a + 0.18); c.stroke(); } }
  c.restore();
};

// ================= Style-colored paint bursts (jumping into/out of frames, crossing boundaries) =================
X.burst = (c, x, y, a, R, style, seed = 1) => { if (a < 0 || a > 1) return; const r = rng(seed), cols = style === 'monet' ? ['#f2a6bf', '#9db5e0', '#9cc070', '#fff2d4', '#b7a6d8', '#8fdcae'] : ['#f8d850', '#2a52a8', '#fff8c0', '#5a86d0'];
  c.save(); c.lineCap = 'round'; for (let i = 0; i < 70; i++) { const ang = r() * TAU, sp = R * (0.4 + r() * 0.8), d = sp * U.ease.out(a), x1 = x + Math.cos(ang) * d, y1 = y + Math.sin(ang) * d * 0.8 + 120 * a * a;
    c.strokeStyle = cols[i % cols.length]; c.globalAlpha = 1 - a; c.lineWidth = 7 + r() * 6; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 + Math.cos(ang) * 16, y1 + Math.sin(ang) * 10); c.stroke(); } c.restore(); };
})();
