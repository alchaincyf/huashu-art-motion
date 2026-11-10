// engine.js — the film's painter. A scene is described once per frame (regions: shape, colour, direction of
// the brush), then painted in a medium: strokes of loaded paint, dabs, dots, tesserae, flat printed colour,
// halftone, pixels. Every random choice comes from a hash of (cell, pass, seed): the same time gives the same
// frame, and a stroke stays where it was in the next frame unless the picture under it changed.
(function () {
  const W = 1920, H = 1080;
  const rng = (seed) => { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  const hash = (x, y, s) => { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 2147483647); h = Math.imul(h ^ h >>> 13, 1274126177); return ((h ^ h >>> 16) >>> 0) / 4294967296; };
  const noise = (x, y, s = 1) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
  const fbm = (x, y, s = 1) => noise(x, y, s) * .6 + noise(x * 2.1, y * 2.1, s + 7) * .3 + noise(x * 4.3, y * 4.3, s + 13) * .1;
  const mk = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  // ---------- geometry ----------
  const ell = (cx, cy, rx, ry, rot = 0, n = 56) => { const p = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, x = Math.cos(a) * rx, y = Math.sin(a) * ry; p.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]); } return p; };
  const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  const smooth = (pts, closed = true, seg = 10) => { const n = pts.length, out = []; const g = (i) => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
      for (let k = 0; k < seg; k++) { const t = k / seg, t2 = t * t, t3 = t2 * t;
        out.push([.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          .5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } }
    if (!closed) out.push(pts[n - 1]); return out; };
  const ribbon = (curve, w0, w1 = w0) => { const c = smooth(curve, false, 8), L = [], Rr = [];
    for (let i = 0; i < c.length; i++) { const a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, w = (w0 + (w1 - w0) * i / (c.length - 1)) / 2;
      L.push([c[i][0] - dy / d * w, c[i][1] + dx / d * w]); Rr.push([c[i][0] + dy / d * w, c[i][1] - dx / d * w]); }
    return L.concat(Rr.reverse()); };
  const tx = (pts, s, dx, dy) => pts.map(([x, y]) => [x * s + dx, y * s + dy]);
  const star = (cx, cy, r0, r1, n, rot = 0) => { const p = []; for (let i = 0; i < n * 2; i++) { const a = rot + i / (n * 2) * Math.PI * 2, r = i % 2 ? r0 : r1; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return p; };
  const pathOf = (pts) => { const p = new Path2D(); pts.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); p.closePath(); return p; };

  // ---------- direction fields ----------
  const F = {
    dir: (deg, wob = 0, sc = 200, seed = 3) => (x, y) => deg * Math.PI / 180 + (wob ? (fbm(x / sc, y / sc, seed) - .5) * wob : 0),
    radial: (cx, cy, wob = 0) => (x, y) => Math.atan2(y - cy, x - cx) + (wob ? (fbm(x / 120, y / 120, 5) - .5) * wob : 0),
    ring: (cx, cy, wob = 0) => (x, y) => Math.atan2(y - cy, x - cx) + Math.PI / 2 + (wob ? (fbm(x / 120, y / 120, 5) - .5) * wob : 0),
    swirl: (vs, base = 0, wob = .5, sc = 260) => (x, y) => { let vx = Math.cos(base), vy = Math.sin(base);
      const n = (fbm(x / sc, y / sc, 9) - .5) * wob, c = Math.cos(n), s = Math.sin(n); [vx, vy] = [vx * c - vy * s, vx * s + vy * c];
      for (const v of vs) { const dx = x - v.x, dy = y - v.y, d = Math.hypot(dx, dy) || 1, k = Math.exp(-(d * d) / (2 * v.r * v.r)) * 2.6; vx += -dy / d * v.s * k; vy += dx / d * v.s * k; }
      return Math.atan2(vy, vx); },
    along: (guides, wob = 0) => { const segs = []; for (const g of guides) { const c = smooth(g, false, 4); for (let i = 0; i + 1 < c.length; i++) segs.push([c[i][0], c[i][1], c[i + 1][0], c[i + 1][1]]); }
      return (x, y) => { let best = 1e9, ang = 0; for (const [ax, ay, bx, by] of segs) { const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1))), d = (x - ax - dx * t) ** 2 + (y - ay - dy * t) ** 2; if (d < best) { best = d; ang = Math.atan2(dy, dx); } }
        return ang + (wob ? (fbm(x / 90, y / 90, 4) - .5) * wob : 0); }; },
  };

  // ---------- colour ----------
  const hex = (h) => { if (typeof h !== 'string') return h; const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const shade = (c, k) => k >= 0 ? mix(c, [255, 250, 235], k) : mix(c, [18, 20, 46], -k);
  const sat = (c, k) => { const g = c[0] * .3 + c[1] * .59 + c[2] * .11; return [g + (c[0] - g) * k, g + (c[1] - g) * k, g + (c[2] - g) * k].map((v) => Math.max(0, Math.min(255, v))); };
  const lumOf = (c) => (c[0] * .3 + c[1] * .59 + c[2] * .11) / 255;

  // ---------- the scene: canvases are pooled, one pair per slot ----------
  const POOL = {};
  function Scene(seed = 1, slot = 'a') {
    const p = POOL[slot] || (POOL[slot] = { albedo: mk(), ids: mk() });
    const A = p.albedo.getContext('2d', { willReadFrequently: true }), I = p.ids.getContext('2d', { willReadFrequently: true });
    A.clearRect(0, 0, W, H); I.clearRect(0, 0, W, H);
    const regions = [];
    // region: { pts, fill: css | (ctx) => {}, flow, w, len, outline, ow, accents, accentP, jit, group, bare, drift, tone, key }
    const add = (r) => { r.id = regions.length + 1; r.path = pathOf(r.pts); regions.push(r);
      A.save(); A.clip(r.path); if (typeof r.fill === 'function') r.fill(A); else { A.fillStyle = r.fill; A.fillRect(0, 0, W, H); } A.restore();
      I.fillStyle = `rgb(${r.id},${(r.id * 53) % 256},${(r.id * 97) % 256})`; I.fill(r.path); I.strokeStyle = I.fillStyle; I.lineWidth = 1.5; I.stroke(r.path); return r; };
    // a picture that already exists (a character's drawn frame) enters the scene as a region of its own:
    // its pixels are the colour, its silhouette is the region, and the medium paints over it like everything else
    const sprite = (img0, o) => { let img = img0;
      if (o.map) { const c = img0.__maps || (img0.__maps = {}); if (!c[o.mapKey]) { const m = mk(img0.width, img0.height), mg = m.getContext('2d'); mg.drawImage(img0, 0, 0); const im = mg.getImageData(0, 0, m.width, m.height), d = im.data; for (let i = 0; i < d.length; i += 4) { if (!d[i + 3]) continue; const q = o.map([d[i], d[i + 1], d[i + 2]]); d[i] = q[0]; d[i + 1] = q[1]; d[i + 2] = q[2]; } mg.putImageData(im, 0, 0); c[o.mapKey] = m; } img = c[o.mapKey]; }
      const sc = o.h / img.height, w = img.width * sc, x0 = o.x - w / 2, y0 = o.y - o.h, r = Object.assign({ key: 'hero', sprite: true, pts: [], flow: F.dir(80, .7, 28, 5), w: .36, len: .4, jit: .03, accentP: 0, box: [x0, y0, w, o.h] }, o.region || {}); r.id = regions.length + 1; r.path = new Path2D(); regions.push(r);
      const put = (g) => { g.save(); if (o.flip) { g.translate(o.x * 2, 0); g.scale(-1, 1); } if (o.rot) { g.translate(o.x, o.y); g.rotate(o.rot); g.translate(-o.x, -o.y); } g.drawImage(img, x0, y0, w, o.h); g.restore(); };
      put(A); const T = p.tmp || (p.tmp = mk()), tg = T.getContext('2d'); tg.globalCompositeOperation = 'source-over'; tg.clearRect(0, 0, W, H); put(tg); tg.globalCompositeOperation = 'source-in'; tg.fillStyle = `rgb(${r.id},${(r.id * 53) % 256},${(r.id * 97) % 256})`; tg.fillRect(0, 0, W, H); I.drawImage(T, 0, 0); r.put = put; return r; };
    return { regions, albedo: p.albedo, ids: p.ids, add, sprite, seed, A, I };
  }

  const CELLS = new Map();
  const cellsOf = (pass, pi, seed) => { const k = pass.gap + '|' + pi + '|' + seed + '|' + (pass.kind || ''); if (CELLS.has(k)) return CELLS.get(k);
    const R = rng(seed * 7919 + pi * 131 + 17), cells = [], j = pass.kind === 'tile' ? .22 : 1.1; let n = 0;
    for (let y = -pass.gap; y < H + pass.gap; y += pass.gap) for (let x = -pass.gap; x < W + pass.gap; x += pass.gap) cells.push([x + (R() - .5) * pass.gap * j, y + (R() - .5) * pass.gap * j, R(), n++]);
    cells.sort((a, b) => a[2] - b[2]); CELLS.set(k, cells); return cells; };

  // read the scene once: who is where, what colour, where the detail is
  function probe(scene) {
    const { regions, albedo, ids } = scene;
    const aD = albedo.getContext('2d').getImageData(0, 0, W, H).data, iD = ids.getContext('2d').getImageData(0, 0, W, H).data;
    const idAt = (x, y) => { x = x | 0; y = y | 0; if (x < 0 || y < 0 || x >= W || y >= H) return 0; const k = (y * W + x) * 4, id = iD[k]; return iD[k + 1] === (id * 53) % 256 ? id : -1; };
    const colAt = (x, y) => { x = Math.max(0, Math.min(W - 1, x | 0)); y = Math.max(0, Math.min(H - 1, y | 0)); const k = (y * W + x) * 4; return [aD[k], aD[k + 1], aD[k + 2]]; };
    const dw = W >> 2, dh = H >> 2, det = new Float32Array(dw * dh), lum = new Float32Array(dw * dh);
    for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) { const k = ((y * 4) * W + x * 4) * 4; lum[y * dw + x] = aD[k] * .3 + aD[k + 1] * .59 + aD[k + 2] * .11; }
    for (let y = 1; y < dh - 1; y++) for (let x = 1; x < dw - 1; x++) { const i = y * dw + x; let e = Math.hypot(lum[i + 1] - lum[i - 1], lum[i + dw] - lum[i - dw]) / 60; const k = ((y * 4) * W + x * 4) * 4;
      if (iD[k] !== iD[k + 16] || iD[k] !== iD[k + W * 16]) e += .8; det[i] = Math.min(1, e); }
    const det2 = new Float32Array(dw * dh); for (let y = 2; y < dh - 2; y++) for (let x = 2; x < dw - 2; x++) { let m = 0; for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const v = det[(y + j) * dw + x + i] * (1 - (Math.abs(i) + Math.abs(j)) * .12); if (v > m) m = v; } det2[y * dw + x] = m; }
    const detAt = (x, y) => det2[Math.max(0, Math.min(dh - 1, y >> 2)) * dw + Math.max(0, Math.min(dw - 1, x >> 2))];
    const grp = (id) => id > 0 ? (regions[id - 1].group ?? id) : id;
    return { idAt, colAt, detAt, grp };
  }

  const lineP = (ctx, pts, w, style) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.lineWidth = w; ctx.strokeStyle = style; ctx.stroke(); };
  const off = (pts, d) => pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy) || 1; return [p[0] - dy / n * d, p[1] + dx / n * d]; });
  // one stroke of loaded paint, laid by the hairs of the brush: each hair starts and lifts at its own place
  function brush(ctx, pts, w, col, P, alpha, R, L = [-.6, -.8]) {
    if (pts.length < 2) return; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const nb = Math.max(2, Math.round(w / (P.bristleGap || 3.2))), n = pts.length;
    const hair = (k, wd, c, al) => { const a0 = n > 4 ? (R() * n * .2) | 0 : 0, b0 = n > 4 ? n - ((R() * n * .24) | 0) : n, o = ((k + .5) / nb - .5) * (w - w / nb); lineP(ctx, off(pts.slice(a0, Math.max(a0 + 2, b0)), o), wd, css(c, al)); };
    for (let k = 0; k < nb; k++) hair(k, w / nb * 1.9, shade(col, (R() - .5) * .06), alpha);
    const br = P.bristles ?? .22; if (br) for (let k = 0; k < nb; k++) hair(k, w / nb * (.4 + R() * .6), shade(col, (R() - .5) * br * 1.5), alpha * (.4 + R() * .45));
    if (P.relief) { const a = pts[0], b = pts[n - 1], nx = -(b[1] - a[1]), ny = b[0] - a[0], side = (nx * L[0] + ny * L[1]) > 0 ? 1 : -1;
      lineP(ctx, off(pts, side * w * .43), Math.max(1, w * .1), css([255, 252, 240], P.relief * (.5 + R() * .5)));
      lineP(ctx, off(pts, -side * w * .45), Math.max(1, w * .13), css([20, 18, 50], P.relief * 1.15)); }
  }

  // ---------- the painter ----------
  // P: { base: 'ground' | 'flat' | 'none', ground, groundFill, passes: [{ kind, w, len, gap, detail, calm, alpha }],
  //      bristles, relief, jit, sat, colorMap, contour: { style: 'brush' | 'ink' | 'charcoal', w, color, alpha }, driftK }
  function paint(ctx, scene, P, o = {}) {
    const { regions, albedo } = scene, t = o.t || 0, seed = scene.seed, pr = o.probe || probe(scene), { idAt, colAt, detAt, grp } = pr;
    if (P.base === 'flat') ctx.drawImage(albedo, 0, 0);
    else if (P.groundFill) { ctx.fillStyle = P.groundFill; ctx.fillRect(0, 0, W, H); }
    else if (P.base !== 'none') { ctx.save(); ctx.drawImage(albedo, 0, 0); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = P.ground || '#8f8a9c'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    if (o.under) o.under(ctx, pr);
    const follow = (x, y, id, r, w, len) => { const flow = r.flow || F.dir(0), step = Math.max(2.5, w * .55), n = Math.max(1, Math.round(len / step / 2)), fwd = [], back = [];
      for (const [arr, sgn] of [[fwd, 1], [back, -1]]) { let px = x, py = y, pa = null; for (let i = 0; i < n; i++) { let a = flow(px, py); if (sgn < 0) a += Math.PI; if (pa != null && Math.cos(a - pa) < 0) a += Math.PI; pa = a; px += Math.cos(a) * step; py += Math.sin(a) * step; if (idAt(px, py) !== id) break; arr.push([px, py]); } }
      return back.reverse().concat([[x, y]], fwd); };
    (P.passes || []).forEach((pass, pi) => {
      for (const [cx, cy, , ci] of cellsOf(pass, pi, seed)) {
        let id = idAt(cx, cy); if (id <= 0) continue; let r = regions[id - 1], x = cx, y = cy, life = 1;
        const R = rng((hash(ci, pi * 7 + 1, seed) * 4294967296) >>> 0);
        const dr = (r.drift || 0) * (P.driftK ?? 1), ph = R();
        if (dr) { const T = r.life || 2.4, u = (t / T + ph) % 1, a = (r.flow || F.dir(0))(cx, cy); x += Math.cos(a) * dr * T * (u - .5); y += Math.sin(a) * dr * T * (u - .5); life = Math.min(1, u * 5, (1 - u) * 5);
          const id2 = idAt(x, y); if (id2 !== id) { if (id2 <= 0) continue; id = id2; r = regions[id - 1]; } }
        if (r.bare && !pass.bareToo) continue;
        if ((pass.skipSprite && r.sprite) || (pass.onlySprite && !r.sprite)) continue;
        const d = detAt(x | 0, y | 0);
        if (pass.detail != null && d < pass.detail) continue;
        if (pass.calm != null && d > pass.calm) continue;
        const w = pass.w * (pass.kind ? 1 : (r.w || 1)) * (.75 + R() * .5), len = pass.len * (r.len || 1) * (.6 + R() * .8);
        let c = colAt(x, y); const j = (r.jit ?? P.jit ?? .12) * (P.jitK ?? 1);
        if (r.accents && R() < (r.accentP ?? .14) * (P.accK ?? 1)) c = mix(c, hex(r.accents[(R() * r.accents.length) | 0]), .55 + R() * .4);
        c = sat(shade(c, (R() - .5) * j * 2), (P.sat || 1) * (1 + (R() - .5) * .3));
        if (P.tint) c = mix(c, P.tint, P.tintK || .2);
        if (P.colorMap) c = P.colorMap(c, R, r, d);
        const al = (pass.alpha ?? .94) * life;
        if (pass.kind === 'dot') { ctx.fillStyle = css(c, al); ctx.beginPath(); ctx.arc(x, y, w / 2, 0, 6.2832); ctx.fill(); }
        else if (pass.kind === 'tile') { const a = (r.flow || F.dir(0))(x, y) + (R() - .5) * .25, s = pass.w * (.82 + R() * .16) / 2, ca = Math.cos(a), sa = Math.sin(a), q = () => 1 + (R() - .5) * .28;
          const pt = (u, v) => [x + (u * ca - v * sa) * s, y + (u * sa + v * ca) * s], p0 = pt(-q(), -q()), p1 = pt(q(), -q()), p2 = pt(q(), q()), p3 = pt(-q(), q());
          if (d > (P.edgeDark ?? 2) && r.outline) c = mix(c, hex(P.contourColor || '#2a2030'), .55);
          ctx.fillStyle = css(c, al); ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p3[0], p3[1]); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = css([255, 250, 230], .16 + R() * .2); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
          ctx.strokeStyle = css([20, 14, 30], .22); ctx.beginPath(); ctx.moveTo(p3[0], p3[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke(); }
        else brush(ctx, follow(x, y, id, r, w, len), w, c, P, al, R);
      }
    });
    if (P.contour) contours(ctx, scene, P.contour, pr, o);
    if (o.over) o.over(ctx, pr);
  }

  // the drawn line round the forms that have one, only where the edge is really seen
  function contours(ctx, scene, C, pr, o = {}) {
    const { regions, seed } = scene, { idAt, grp } = pr;
    const dense = (pts, d) => { const out = []; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], k = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / d)); for (let j = 0; j < k; j++) out.push([a[0] + (b[0] - a[0]) * j / k, a[1] + (b[1] - a[1]) * j / k]); } out.push(pts[pts.length - 1]); return out; };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const r of regions) { if (!r.outline) continue; const pts = dense(r.pts.concat([r.pts[0]]), 10), col = hex(r.outline === true ? C.color : (C.force ? C.color : r.outline)), g = r.group ?? r.id, R = rng((hash(r.id, 91, seed) * 4294967296) >>> 0), w0 = C.w * (r.ow || 1);
      const seen = (a, b) => { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy) || 1, nx = -dy / n * 5, ny = dx / n * 5, g1 = grp(idAt(mx + nx, my + ny)), g2 = grp(idAt(mx - nx, my - ny)); return g1 !== 0 && g2 !== 0 && (g1 === g) !== (g2 === g); };
      let i = 0; while (i < pts.length - 1) { if (!seen(pts[i], pts[i + 1])) { i++; continue; } const seg = [pts[i]]; let L2 = 0; const want = C.style === 'brush' ? 50 + R() * 110 : C.style === 'charcoal' ? 90 + R() * 160 : 1e9;
        while (i < pts.length - 1 && L2 < want && seen(pts[i], pts[i + 1])) { L2 += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); i++; seg.push(pts[i]); }
        if (seg.length < 3) continue;
        if (C.style === 'ink') lineP(ctx, seg, w0, css(col, C.alpha ?? 1));
        else if (C.style === 'charcoal') { for (let k = 0; k < 4; k++) lineP(ctx, seg.map(([x, y]) => [x + (R() - .5) * 5, y + (R() - .5) * 5]), w0 * (.25 + R() * .5), css(col, (C.alpha ?? .5) * (.5 + R() * .6))); }
        else brush(ctx, seg.map(([x, y]) => [x + (R() - .5) * 2.4, y + (R() - .5) * 2.4]), w0 * (.7 + R() * .6), shade(col, (R() - .5) * .16), C.P || { bristles: .26, relief: .2 }, .9, R); } }
  }

  // ---------- surfaces, made once ----------
  const TEX = {};
  function tex(name) {
    if (TEX[name]) return TEX[name]; const c = mk(), g = c.getContext('2d'), R = rng(name.length * 977 + name.charCodeAt(0));
    if (name === 'grain') { const im = g.createImageData(W, H), d = im.data; for (let i = 0; i < W * H; i++) { const v = 205 + R() * 50; d[i * 4] = v; d[i * 4 + 1] = v; d[i * 4 + 2] = v; d[i * 4 + 3] = 255; } g.putImageData(im, 0, 0); }
    else if (name === 'rock') { const w = W / 2, h = H / 2, s = mk(w, h), sg = s.getContext('2d'), im = sg.createImageData(w, h), d = im.data;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const a = fbm(x / 110, y / 90, 3), b = fbm(x / 30, y / 26, 8), cr = Math.abs(fbm(x / 70, y / 50, 21) - .5), k = (y * w + x) * 4;
        let c0 = mix([150, 118, 84], [206, 178, 136], a); c0 = mix(c0, [96, 78, 62], Math.max(0, .55 - b) * .9); if (cr < .012) c0 = mix(c0, [50, 38, 30], .7); const n = (hash(x, y, 5) - .5) * 16;
        d[k] = c0[0] + n; d[k + 1] = c0[1] + n; d[k + 2] = c0[2] + n; d[k + 3] = 255; }
      sg.putImageData(im, 0, 0); g.imageSmoothingQuality = 'high'; g.drawImage(s, 0, 0, W, H); }
    else if (name === 'crackle') { g.lineWidth = 1; for (let k = 0; k < 520; k++) { let x = R() * W, y = R() * H, a = R() * 6.28; g.strokeStyle = `rgba(30,22,14,${.12 + R() * .2})`; g.beginPath(); g.moveTo(x, y); const n = 6 + R() * 22; for (let i = 0; i < n; i++) { a += (R() - .5) * 1.5; x += Math.cos(a) * 9; y += Math.sin(a) * 9; g.lineTo(x, y); } g.stroke(); } }
    else if (name === 'wood') { g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); for (let y = 0; y < H; y += 3.5) { g.strokeStyle = `rgba(60,40,20,${.03 + R() * .08})`; g.lineWidth = .8 + R() * 1.4; g.beginPath(); for (let x = 0; x <= W; x += 40) { const yy = y + Math.sin(x / 190 + y / 37) * 5 + (fbm(x / 300, y / 22, 4) - .5) * 14; x ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke(); } }
    else if (name === 'weave') { g.strokeStyle = 'rgba(26,24,48,.05)'; g.lineWidth = 1; g.beginPath(); for (let y = 0; y < H; y += 3) { g.moveTo(0, y + .5); g.lineTo(W, y + .5); } for (let x = 0; x < W; x += 3) { g.moveTo(x + .5, 0); g.lineTo(x + .5, H); } g.stroke(); }
    else if (name === 'fibre') { g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); for (let k = 0; k < 2600; k++) { const x = R() * W, y = R() * H, a = R() * 6.28, l = 8 + R() * 30; g.strokeStyle = `rgba(90,70,40,${.04 + R() * .09})`; g.lineWidth = .7; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * .5 + (R() - .5) * 8, y + Math.sin(a) * l * .5 + (R() - .5) * 8, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); } }
    return (TEX[name] = c);
  }
  const lay = (ctx, name, mode = 'multiply', alpha = 1) => { ctx.save(); ctx.globalCompositeOperation = mode; ctx.globalAlpha = alpha; ctx.drawImage(tex(name), 0, 0); ctx.restore(); };

  window.ENG = { W, H, rng, hash, noise, fbm, mk, ell, rect, smooth, ribbon, tx, star, pathOf, F, hex, css, mix, shade, sat, lumOf, Scene, probe, paint, contours, brush, lineP, tex, lay };
})();
