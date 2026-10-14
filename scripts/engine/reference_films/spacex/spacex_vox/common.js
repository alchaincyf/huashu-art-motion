// SpaceX's 24 years · Shared VOX library for the single-style Vox collage version (film name vox).
// World: the whole film is one investigation desk. Desk 9600×5400 (world-coordinate px), divided into 4 columns × 3 rows, one narration segment per cell in serpentine order:
//   Row 1 →: S02 2002 | S03 2006–08 | S04 2008–12 | S05 2015–17
//   Row 2 ←: S09 Starlink | S08 launch counts | S07 2020 | S06 2018
//   Row 3 →: S10 Starship | S11 2026 | S01 9.28 | S12 next (Mars farther right)
// One red investigation thread runs along the top band of each row, joining all 12 cells, each with a hanging black year label. Opening (S01) investigates the 9.28 cell;
// At these 24 years in two minutes, camera pulls out to the whole desk and thread traces the entire route; S12 ends on the whole desk, now covered in 24 years of evidence.
// Two frame-rate layers (y2 research): camera smooth at 60fps; desk papers, highlighter, red pen, typing, and cutouts step at 12fps on twos.
// Desk items use film-wide time T: once a segment places them, they remain on the desk (accumulating evidence).
// Draw only silhouettes and faceless symbols; no official logos/wordmarks. Example text is historical creative material; verify before reuse.
(() => {
const W = 1920, H = 1080, TAU = Math.PI * 2, { clamp, lerp, rng } = U;

const VOX = window.VOX = {};
const C = VOX.C = { desk: '#e4ddcf', paper: '#eeedeb', card: '#f6f4ee', ink: '#171716', ink2: '#2a2723', red: '#b8433f', red2: '#93403c', yel: '#dacf08', black: '#1b1b1a', graphite: '#4a4a48', blue: 'rgba(80,140,200,.30)' };
const F = VOX.F = { heavy: 'PuHui-Heavy', black: 'PuHui-Black', bold: 'PuHui-Bold', med: 'PuHui-Medium', serif: 'LXGWWenKai-500', type: 'CMU-rm', num: 'Anton-400', hand: 'LXGWWenKai-500' };
const font = VOX.font = (sz, fam) => `${sz}px "${fam}"`;
const step = VOX.step = (t) => MO.step(t, 12);
const seg = MO.seg;

// ---------- Time ----------
VOX.t0 = id => TIMING.seg[id].t0;
VOX.cue = (id, k) => VOX.t0(id) + TM.cue(id, k);            // Film-wide seconds
VOX.cend = (id, k) => VOX.t0(id) + TM.end(id, k);
// Local seconds for the nth occurrence of a spoken word (zero-based)
VOX.cueN = (id, key, n) => { const s = TIMING.seg[id]; let i = -1; for (let k = 0; k <= n; k++) { i = s.text.indexOf(key, i + 1); if (i < 0) { console.error('VOX.cueN: 段 ' + id + ' 没有第 ' + (n + 1) + ' 个「' + key + '」'); return 0; } } return s.charStart[i]; };

// ---------- Cells ----------
VOX.CW = 2400; VOX.CH = 1800; VOX.DW = 9600; VOX.DH = 5400;
const CELL = { s02: [0, 0], s03: [1, 0], s04: [2, 0], s05: [3, 0], s06: [3, 1], s07: [2, 1], s08: [1, 1], s09: [0, 1], s10: [0, 2], s11: [1, 2], s01: [2, 2], s12: [3, 2] };
VOX.cell = id => { const [c, r] = CELL[id]; return { x: c * 2400, y: r * 1800, cx: c * 2400 + 1200, cy: r * 1800 + 900, col: c, row: r }; };
VOX.BAND = r => r * 1800 + 170;                               // y of each row's red-thread band

// ---------- Camera ----------
// Map world point (x,y) to screen (960, sy): default sy=470 keeps subjects above subtitle band (y>920)
VOX.at = (x, y, z, sy = 470, sx = 960) => CAM.anchor(x, y, z, sx, sy);
VOX.cams = {};                                                // Segment camera lt → cam (next segment uses it to match preceding final frame)
VOX.camEnd = id => VOX.cams[id](TM.dur(id));
VOX.key = (t, cam, ease) => ({ t, x: cam.x, y: cam.y, z: cam.z, ease });
VOX.overview = () => ({ x: VOX.DW / 2, y: VOX.DH / 2 + 100, z: Math.min(W / (VOX.DW + 260), H / (VOX.DH + 200)) });

// ---------- Sprites: cache once, bake shadows in ----------
// fn(g, w, h) draws within (0,0)-(w,h); returns canvas with vw/vh/vpad (world dimensions). S-times resolution (sharp on push-in).
VOX.spr = (key, w, h, fn, { pad = 26, S = 2, shadow = true, sh = {} } = {}) => PAINT.cached('vx_' + key, Math.ceil((w + pad * 2) * S), Math.ceil((h + pad * 2) * S), (g, cv) => {
  const tmp = PAINT.canvas(Math.ceil(w * S), Math.ceil(h * S)), tg = tmp.getContext('2d'); tg.scale(S, S); fn(tg, w, h);
  if (shadow) { g.shadowColor = sh.col || 'rgba(50,40,25,.30)'; g.shadowBlur = (sh.blur ?? 12) * S; g.shadowOffsetX = (sh.x ?? 3) * S; g.shadowOffsetY = (sh.y ?? 7) * S; }
  g.drawImage(tmp, pad * S, pad * S);
  cv.vw = w; cv.vh = h; cv.vpad = pad;
});
// Draw sprite centered at (x,y)
// ---------- Self-check: text visibility log (enabled by VOX.DBG = []; QA reads each frame to detect text covered by later papers, clipped by frame, or entering subtitle band) ----------
VOX.DBG = null; VOX._cur = ''; let _noRec = 0;
VOX.rec = (g, kind, x, y, w, h, s) => {
  if (!VOX.DBG || _noRec) return; const m = g.getTransform(); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [px, py] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) { const X = m.a * px + m.c * py + m.e, Y = m.b * px + m.d * py + m.f; x0 = Math.min(x0, X); y0 = Math.min(y0, Y); x1 = Math.max(x1, X); y1 = Math.max(y1, Y); }
  VOX.DBG.push({ kind, item: VOX._cur, s, b: [x0, y0, x1, y1] });
};
VOX.blit = (g, sp, x = 0, y = 0, k = 1) => { const p = sp.vpad, w = (sp.vw + p * 2) * k, h = (sp.vh + p * 2) * k; g.drawImage(sp, x - w / 2, y - h / 2, w, h); VOX.rec(g, 'spr', x - sp.vw * k / 2, y - sp.vh * k / 2, sp.vw * k, sp.vh * k); };

// ---------- Paper ----------
VOX.tile = (key, base, o = {}) => CL.paperTile('vx' + key, base, { amt: 10, fibers: 220, seed: 5, ...o });
VOX.deskTile = () => CL.paperTile('vxdesk', C.desk, { amt: 12, fibers: 320, fiberCol: [110, 95, 70], seed: 7 });
// Torn paper (paper texture fill and aged yellow rim)
VOX.paper = (g, w, h, seed, { col = C.paper, amp = 4, torn = true, age = 0.2 } = {}) => {
  g.save(); if (torn) CL.tornRect(g, w, h, seed, amp); else { g.beginPath(); g.rect(0, 0, w, h); }
  g.clip(); g.fillStyle = g.createPattern(VOX.tile('p' + col, col, { seed: seed % 9 + 1 }), 'repeat'); g.fillRect(0, 0, w, h);
  if (age) { const r = g.createRadialGradient(w * 0.45, h * 0.42, Math.min(w, h) * 0.2, w * 0.5, h * 0.5, Math.max(w, h) * 0.75); r.addColorStop(0, 'rgba(255,255,255,0)'); r.addColorStop(1, `rgba(170,150,110,${age})`); g.fillStyle = r; g.fillRect(0, 0, w, h); }
  g.restore();
};
// Ruled index card
VOX.indexCard = (g, w, h, { top = 64, gap = 46 } = {}) => {
  g.fillStyle = C.card; g.fillRect(0, 0, w, h);
  g.fillStyle = g.createPattern(VOX.tile('card', C.card, { amt: 6, fibers: 80 }), 'repeat'); g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(184,67,63,.45)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, top); g.lineTo(w, top); g.stroke();
  g.strokeStyle = C.blue; g.lineWidth = 1.6; for (let y = top + gap; y < h; y += gap) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
};
// Black cardstock (Missing Chapter black background)
VOX.blackCard = (g, w, h, seed) => {
  g.save(); CL.tornRect(g, w, h, seed, 3); g.clip();
  g.fillStyle = g.createPattern(CL.paperTile('vxblack', C.black, { amt: 5, fibers: 90, fiberCol: [90, 90, 85], seed: 4 }), 'repeat'); g.fillRect(0, 0, w, h); g.restore();
};
// Tape
VOX.tape = (g, x, y, a, w = 120) => CL.tape(g, x, y, a, w);

// ---------- Text ----------
VOX.text = (g, s, x, y, size, fam, col = C.ink, align = 'left', base = 'alphabetic') => { g.font = font(size, fam); g.fillStyle = col; g.textAlign = align; g.textBaseline = base; g.fillText(s, x, y); if (VOX.DBG) { const w = g.measureText(s).width, x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x; VOX.rec(g, 'txt', x0, y - size * 0.8, w, size * 0.9, s); } };
// Bold serif: thin same-color outline (Source Han Serif has only Regular)
VOX.serifBold = (g, s, x, y, size, col = C.ink, k = 0.045, align = 'left') => { g.font = font(size, F.serif); g.fillStyle = col; g.strokeStyle = col; g.lineWidth = size * k; g.lineJoin = 'round'; g.textAlign = align; g.textBaseline = 'alphabetic'; g.strokeText(s, x, y); g.fillText(s, x, y); if (VOX.DBG) VOX.rec(g, 'txt', x, y - size * 0.8, g.measureText(s).width, size * 0.9, s); };
// Typewriter: first n characters (measure character widths individually; caller supplies stepped time for twos)
VOX.typed = (g, s, x, y, n, size, fam, col = C.ink) => { g.font = font(size, fam); g.fillStyle = col; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; let xx = x, vis = 0; [...s].forEach((ch, i) => { if (i < n) { g.fillText(ch, xx, y); vis = xx + g.measureText(ch).width; } xx += g.measureText(ch).width; }); if (n > 0) VOX.rec(g, 'txt', x, y - size * 0.8, vis - x, size * 0.9, [...s].slice(0, n).join('')); return xx - x; };
VOX.nTyped = (T, t0, rate = 13) => TY.typedCount(step(T), t0, rate);
// Measure substring position in text (for highlighter underneath): return {x, w}
VOX.span = (g, s, sub, x, size, fam) => { g.font = font(size, fam); const i = s.indexOf(sub); if (i < 0) { console.error('VOX.span: 没有「' + sub + '」于「' + s + '」'); return { x, w: 0 }; } return { x: x + g.measureText(s.slice(0, i)).width, w: g.measureText(sub).width }; };
// Borders-style black label strip (static): returns width
VOX.labelW = (g, s, size, fam = F.heavy, padX = 24) => { g.font = font(size, fam); return g.measureText(s).width + padX * 2; };
VOX.label = (g, s, size, { fam = F.heavy, bg = C.black, col = C.paper, padX = 24, h = size * 1.62, n = 1e9, seed = 77 } = {}) => {
  if (n <= 0) return 0;                                         // Before typing starts, hide the whole label (no empty black strip)
  g.font = font(size, fam); const w = g.measureText(s).width + padX * 2;
  g.save(); g.translate(-w / 2, -h / 2); g.fillStyle = bg; CL.tornRect(g, w, h, seed, 2.5); g.fill(); g.restore();
  _noRec++; VOX.typed(g, s, -w / 2 + padX, size * 0.36, n, size, fam, col); _noRec--; VOX.rec(g, 'txt', -w / 2, -h / 2, w, h, [...s].slice(0, n).join('')); return w;
};

// ---------- Red pen / highlighter ----------
const strokeCache = {};
VOX.handPts = (key, pts, o = {}) => strokeCache[key] || (strokeCache[key] = (() => { const p = DG.hand(pts, { amp: 1.8, seed: 3, ...o }); return { p, L: DG.cum(p) }; })());
// Draw first q (0..1) of a stroke, with round tip
VOX.pen = (g, S, q, { col = C.red, lw = 7, alpha = 1 } = {}) => { if (q <= 0) return; g.save(); g.globalAlpha *= alpha; g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round'; DG.drawPartial(g, S.p, S.L, S.L[S.L.length - 1] * Math.min(1, q)); g.restore(); };
VOX.circle = (key, rx, ry, seed = 5, a0 = -2.4, turns = 1.1) => VOX.handPts('c' + key, DG.ellipsePts(0, 0, rx, ry, a0, turns, 56), { amp: 2.2, seed });
// Red cross: two strokes
VOX.cross = (key, s, seed = 2) => [VOX.handPts('x1' + key, [[-s, -s * 0.92], [s * 0.95, s]], { amp: 2.6, seed, per: 10 }), VOX.handPts('x2' + key, [[s * 0.96, -s], [-s, s * 0.9]], { amp: 2.6, seed: seed + 7, per: 10 })];
VOX.drawCross = (g, X, T, t0, { lw = 12, d = 0.25 } = {}) => { const st = step(T); VOX.pen(g, X[0], seg(st, t0, t0 + d), { lw }); VOX.pen(g, X[1], seg(st, t0 + d * 0.9, t0 + d * 1.9), { lw }); };
VOX.hl = (g, x, y, w, h, q) => CL.highlight(g, x, y, w, h, q);
// Tally marks (five-stroke groups, red pen): n strokes, dur seconds each
VOX.tally = (g, x, y, n, h = 60, gapX = 20, groupGap = 34, lw = 6) => {
  g.save(); g.strokeStyle = C.red; g.lineWidth = lw; g.lineCap = 'round';
  for (let i = 0; i < n; i++) { const gi = Math.floor(i / 5), k = i % 5, gx = x + gi * (gapX * 4 + groupGap);
    g.beginPath(); if (k < 4) { const xx = gx + k * gapX + Math.sin(i * 7.3) * 2; g.moveTo(xx, y + Math.sin(i * 3.1) * 3); g.lineTo(xx + 3, y + h); } else { g.moveTo(gx - 10, y + h * 0.75); g.lineTo(gx + gapX * 3 + 12, y + h * 0.2); } g.stroke(); }
  g.restore();
};
// Pushpin
VOX.pin = (g, x, y, col = C.red, r = 12) => CL.pin(g, x, y, col);

// ---------- Photo studio: grayscale source → 45° halftone photo ----------
const GREY = { body: '#ececec', dark: '#262626', nose: '#f2f2f2', engine: '#3c3c3c', window: '#1c1c1c', trunk: '#b8b8b8', flap: '#303030', tiles: '#2a2a2a', truss: '#5a5a5a' };
VOX.GREY = GREY;
const PH = VOX.PH = {};
PH.sky = (g, w, h, top = '#7a7a7a', bot = '#cfcfcf') => { const s = g.createLinearGradient(0, 0, 0, h); s.addColorStop(0, top); s.addColorStop(1, bot); g.fillStyle = s; g.fillRect(0, 0, w, h); };
PH.blob = (g, x, y, rx, ry, col, blur) => { g.save(); g.filter = `blur(${blur}px)`; g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); g.restore(); };
// Smoke puff: several soft circles (fixed seed)
PH.smoke = (g, x, y, r, n, seed, col = '#e6e6e6', spread = 1) => { const q = rng(seed); for (let i = 0; i < n; i++) { const a = q() * TAU, d = q() * r * spread; PH.blob(g, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6, r * (0.35 + q() * 0.45), r * (0.3 + q() * 0.4), col, r * 0.12); } };
// Smoke column: widening chain of soft circles from (x0,y0) to (x1,y1)
PH.plume = (g, pts, r0, r1, seed, col = '#e2e2e2') => { const q = rng(seed); const L = DG.cum(pts), tot = L[L.length - 1]; for (let d = 0; d <= tot; d += Math.max(6, r0 * 0.6)) { const k = d / tot, p = DG.pointAt(pts, L, d), r = lerp(r0, r1, k); PH.blob(g, p[0] + (q() - .5) * r * 0.5, p[1] + (q() - .5) * r * 0.4, r * (0.8 + q() * 0.4), r * (0.7 + q() * 0.4), col, r * 0.18); } };
PH.glow = (g, x, y, r, a = 1, col = '255,255,255') => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
PH.flame = (g, x, y, len, w, rot = 0) => { g.save(); g.translate(x, y); g.rotate(rot); RK.flame(g, 0, 0, len, w, 0.37, ['rgba(255,255,255,.75)', 'rgba(255,255,255,.92)', '#ffffff']); g.restore(); };
// Rocket: flat fill plus cylindrical shading (dark left, left-offset highlight, dark right); halftone reads as a dimensional metal rocket body rather than a white rod
VOX.shadeFill = (q, shape, pal) => {
  RK.fill(q, shape, pal);
  q.save(); const all = new Path2D(); shape.parts.forEach(pp => all.addPath(pp.p)); q.clip(all);
  const W2 = shape.w * 0.62, gr = q.createLinearGradient(-W2, 0, W2, 0);
  gr.addColorStop(0, 'rgba(0,0,0,.5)'); gr.addColorStop(0.3, 'rgba(0,0,0,.05)'); gr.addColorStop(0.45, 'rgba(255,255,255,.35)'); gr.addColorStop(0.7, 'rgba(0,0,0,.12)'); gr.addColorStop(1, 'rgba(0,0,0,.55)');
  q.fillStyle = gr; q.fillRect(-shape.w * 3, -shape.h - 20, shape.w * 6, shape.h + 40); q.restore();
};
PH.rocket = (g, shape, x, y, s, rot = 0, pal = GREY) => RK.at(g, x, y, s, rot, q => VOX.shadeFill(q, shape, pal));
// Photo texture: low-frequency cloud shading (overlay) and vignette give halftone photographic tonal variation instead of flat blocks
const NOISE = () => PAINT.cached('vxphnoise', 256, 256, (g) => { const im = g.createImageData(256, 256), d = im.data; for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) { const v = 128 + PAINT.fbm(x / 48 + 3.1, y / 48 + 7.7, 5) * 150, i = (y * 256 + x) * 4; d[i] = d[i + 1] = d[i + 2] = clamp(v, 0, 255); d[i + 3] = 255; } g.putImageData(im, 0, 0); });
PH.texture = (g, w, h, seed = 0) => {
  g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.32; const n = NOISE(), o = (seed * 37) % 128; g.drawImage(n, o, o, 128, 128, 0, 0, w, h); g.restore();
  g.save(); const r = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) * 0.62); r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(1, 'rgba(0,0,0,.28)'); g.fillStyle = r; g.fillRect(0, 0, w, h); g.restore();
};
PH.stars = (g, w, h, seed, n = 80) => { const q = rng(seed); g.fillStyle = '#fff'; for (let i = 0; i < n; i++) { const r = q() < 0.85 ? 1.2 : 2.2; g.beginPath(); g.arc(q() * w, q() * h, r, 0, TAU); g.fill(); } };
// Earth's limb (large arc with clouds)
PH.earthLimb = (g, cx, cy, R, seed = 3) => {
  g.save(); g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.clip();
  const e = g.createRadialGradient(cx - R * 0.2, cy - R * 0.3, R * 0.2, cx, cy, R); e.addColorStop(0, '#9c9c9c'); e.addColorStop(0.85, '#6e6e6e'); e.addColorStop(1, '#4a4a4a'); g.fillStyle = e; g.fillRect(cx - R, cy - R, R * 2, R * 2);
  const q = rng(seed); for (let i = 0; i < 160; i++) { const a = -Math.PI / 2 + (q() - 0.5) * 1.9, d = R * (0.55 + q() * 0.44), x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;   // Cloud bands: thin clouds stretched along latitude
    g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2); g.filter = `blur(${R * 0.006}px)`; g.fillStyle = `rgba(238,238,238,${0.35 + q() * 0.5})`; g.beginPath(); g.ellipse(0, 0, R * (0.03 + q() * 0.08), R * (0.006 + q() * 0.012), 0, 0, TAU); g.fill(); g.restore(); }
  for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (q() - 0.5) * 1.4, d = R * (0.7 + q() * 0.25); PH.blob(g, cx + Math.cos(a) * d, cy + Math.sin(a) * d, R * (0.08 + q() * 0.1), R * (0.03 + q() * 0.03), 'rgba(40,40,40,.45)', R * 0.02); }
  g.restore();
  g.save(); g.strokeStyle = 'rgba(235,235,235,.8)'; g.lineWidth = R * 0.012; g.filter = `blur(${R * 0.006}px)`; g.beginPath(); g.arc(cx, cy, R * 1.004, 0, TAU); g.stroke(); g.restore();
};
// Whole Earth (disc): per-pixel spherical projection, noise continents (dark), ocean (mid-gray), clouds (light), lit from upper left; halftone reads as an Earth photo
PH.globe = (g, cx, cy, R, seed = 4) => {
  const S = Math.ceil(R * 2), img = g.createImageData(S, S), d = img.data, ox = seed * 13.7, L = [-0.55, -0.6, 0.58];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const nx = (x + 0.5 - R) / R, ny = (y + 0.5 - R) / R, r2 = nx * nx + ny * ny, i = (y * S + x) * 4; if (r2 > 1) continue;
    const nz = Math.sqrt(1 - r2), lon = Math.atan2(nx, nz) * 1.6 + ox, lat = Math.asin(ny) * 1.6;
    const land = PAINT.fbm(lon * 1.1 + 3, lat * 1.3 + 7, 5), cloud = PAINT.fbm(lon * 2.2 + 11, lat * 6 + 2, 4);
    let v = land > 0.06 ? 70 + (land - 0.06) * 60 : 128 + land * 30;
    if (cloud > 0.18) v = lerp(v, 240, clamp((cloud - 0.18) * 4));
    const lam = clamp(nx * L[0] + ny * L[1] + nz * L[2]); v = v * (0.35 + 0.75 * lam) + 25 * Math.pow(1 - nz, 3);
    d[i] = d[i + 1] = d[i + 2] = clamp(v, 0, 255); d[i + 3] = 255;
  }
  const tmp = PAINT.canvas(S, S); tmp.getContext('2d').putImageData(img, 0, 0); g.drawImage(tmp, cx - R, cy - R);
};
// Moon / Mars: disc and ring craters
PH.moon = (g, cx, cy, R, seed = 8, base = '#cfcfcf') => {
  g.save(); g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.clip();
  const e = g.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R); e.addColorStop(0, base); e.addColorStop(1, '#4c4c4c'); g.fillStyle = e; g.fillRect(cx - R, cy - R, R * 2, R * 2);
  const q = rng(seed); for (let i = 0; i < 26; i++) { const x = cx + (q() - .5) * R * 1.6, y = cy + (q() - .5) * R * 1.6, r = R * (0.04 + q() * 0.12); PH.blob(g, x, y, r, r * 0.9, 'rgba(70,70,70,.45)', r * 0.25); PH.blob(g, x - r * 0.25, y - r * 0.25, r * 0.5, r * 0.45, 'rgba(230,230,230,.35)', r * 0.2); }
  g.restore();
};
// Halftone photo sprite: w×h photo, border paper rim, aged paper color, baked shadow
VOX.photo = (key, w, h, draw, { cell = 6, border = 14, S = 2, contrast = 1.3, pad = 26, tex = true } = {}) => VOX.spr('ph_' + key, w + border * 2, h + border * 2, (g) => {
  const ph = CL.photo('vx_' + key, Math.round(w * S), Math.round(h * S), (gg, ww, hh) => { gg.scale(S, S); draw(gg, w, h); if (tex) PH.texture(gg, w, h, key.length); }, { border: border * S, cell: cell * S, contrast });
  const W2 = w + border * 2, H2 = h + border * 2; g.drawImage(ph, 0, 0, W2, H2);
  // Slightly lifted lower-right corner: bright edge and soft shadow underneath (photo rests on the desk rather than being a pasted-flat layer)
  const k = Math.min(W2, H2) * 0.16, cg = g.createLinearGradient(W2 - k, H2 - k, W2, H2); cg.addColorStop(0, 'rgba(255,255,255,0)'); cg.addColorStop(0.55, 'rgba(255,255,255,.22)'); cg.addColorStop(1, 'rgba(60,45,30,.25)');
  g.fillStyle = cg; g.beginPath(); g.moveTo(W2, H2 - k); g.lineTo(W2, H2); g.lineTo(W2 - k, H2); g.closePath(); g.fill();
}, { S, pad, sh: { blur: 16, x: 5, y: 10, col: 'rgba(50,40,25,.32)' } });
// Cutout: draw(g, w, h) paints flat shapes on transparency → optional halftone → edge-expanded white sticker border → shadow
VOX.cutout = (key, w, h, draw, { edge = 7, S = 2, ht = true, cell = 5, contrast = 1.35, paper = '#f1ede4', ink = '#1b1b1b', edgeCol = '#f4f2ec', pad = 24, sh } = {}) => VOX.spr('co_' + key, w + edge * 2, h + edge * 2, (g) => {
  const cw = Math.ceil((w + edge * 2) * S), ch = Math.ceil((h + edge * 2) * S);
  const src = PAINT.canvas(cw, ch), sg = src.getContext('2d'); sg.scale(S, S); sg.translate(edge, edge); draw(sg, w, h);
  const art = ht ? CL.halftone('vxco_' + key, src, { cell: cell * S, paper, ink, contrast }) : src;
  const tmp = PAINT.canvas(cw, ch), tg = tmp.getContext('2d');
  if (edge > 0) { for (let a = 0; a < 16; a++) tg.drawImage(art, Math.cos(a / 16 * TAU) * edge * S, Math.sin(a / 16 * TAU) * edge * S); tg.globalCompositeOperation = 'source-in'; tg.fillStyle = edgeCol; tg.fillRect(0, 0, cw, ch); tg.globalCompositeOperation = 'source-over'; }
  tg.drawImage(art, 0, 0);
  g.drawImage(tmp, 0, 0, w + edge * 2, h + edge * 2);
}, { S, pad, sh });

// ---------- Photo sources (shared by S01 and S03) ----------
const sky = (g, w, h, a, b) => PH.sky(g, w, h, a, b), RK0 = RK;
VOX.DRAW = {};
const tower = (g, x, gy, hgt, wd = 14) => { g.fillStyle = '#3c3c3c'; g.fillRect(x, gy - hgt, 4, hgt); g.fillRect(x + wd, gy - hgt, 4, hgt); g.strokeStyle = '#3c3c3c'; g.lineWidth = 2; for (let y = gy - hgt; y < gy - 8; y += 14) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + wd + 4, y + 14); g.stroke(); } };
const failDraw = VOX.DRAW.failDraw = (k) => (g, w, h) => {
  const s = w / 52;
  if (k === 0) {                                    // 2006: tips just after liftoff, side fire (launch tower on left)
    sky(g, w, h, '#7c7c7c', '#d2d2d2'); g.fillStyle = '#3a3a3a'; g.fillRect(0, h * 0.86, w, h * 0.14); tower(g, w * 0.12, h * 0.86, h * 0.62);
    PH.smoke(g, w * 0.26, h * 0.86, 30, 7, 4, '#eeeeee'); PH.plume(g, [[w * 0.26, h * 0.84], [w * 0.36, h * 0.72], [w * 0.47, h * 0.62]], 7, 14, 11, '#f0f0f0');
    PH.flame(g, w * 0.5, h * 0.6, 40, 12, 2.0); PH.rocket(g, RK0.falcon1(), w * 0.5, h * 0.6, s, 0.75); PH.glow(g, w * 0.53, h * 0.55, 34, 0.9);
  } else if (k === 1) {                             // 2007: high altitude, spinning body and spiral trail; Earth curve below
    sky(g, w, h, '#161616', '#5c5c5c'); PH.earthLimb(g, w * 0.5, h * 3.2, h * 2.45, 7);
    const pts = []; for (let i = 0; i <= 40; i++) { const u = i / 40; pts.push([w * (0.08 + 0.52 * u) + Math.sin(u * 16) * 14 * u, h * (0.92 - 0.5 * u) + Math.cos(u * 16) * 8 * u]); }
    PH.plume(g, pts, 4, 10, 12, '#e8e8e8'); PH.flame(g, w * 0.66, h * 0.4, 30, 10, 1.3 + Math.PI / 2); PH.rocket(g, RK0.falcon1(), w * 0.66, h * 0.4, s * 0.9, 1.3 - Math.PI / 2 + Math.PI); 
  } else {                                          // August 2008: stages collide after separation, flash cloud
    sky(g, w, h, '#141414', '#525252');
    PH.plume(g, [[w * 0.36, h * 1.02], [w * 0.42, h * 0.7]], 5, 10, 13, '#dcdcdc');
    PH.rocket(g, RK0.falcon1(), w * 0.44, h * 0.74, s * 0.85, 0.22);
    g.save(); g.translate(w * 0.62, h * 0.3); g.rotate(-0.9); PH.rocket(g, RK0.falcon1(), 0, 0, s * 0.85, 0); g.restore();
    PH.glow(g, w * 0.53, h * 0.47, 46, 1); PH.smoke(g, w * 0.53, h * 0.47, 22, 7, 7, '#f4f4f4');
  }
};
const padDraw = VOX.DRAW.padDraw = (g, w, h) => {                      // Falcon 1 on launchpad (last launch)
  sky(g, w, h, '#9a9a9a', '#e2e2e2');
  g.fillStyle = '#3c3c3c'; g.fillRect(0, h * 0.86, w, h * 0.14);
  g.fillStyle = '#555'; g.fillRect(w * 0.66, h * 0.2, 9, h * 0.66); g.fillRect(w * 0.76, h * 0.2, 9, h * 0.66);
  g.strokeStyle = '#555'; g.lineWidth = 3; for (let y = h * 0.22; y < h * 0.84; y += 26) { g.beginPath(); g.moveTo(w * 0.66, y); g.lineTo(w * 0.77, y + 26); g.stroke(); }
  PH.rocket(g, RK0.falcon1(), w * 0.47, h * 0.86, h / 31);
  PH.smoke(g, w * 0.4, h * 0.86, 26, 5, 21, 'rgba(250,250,250,.85)');
};
const launchDraw = VOX.DRAW.launchDraw = (g, w, h) => {                   // Large scan: September 28, 2008 launch
  sky(g, w, h, '#2c2c2c', '#bdbdbd');
  PH.plume(g, [[w * 0.47, h * 1.05], [w * 0.475, h * 0.82], [w * 0.48, h * 0.66]], 26, 60, 31, '#efefef');
  PH.smoke(g, w * 0.46, h * 1.02, 150, 14, 33, '#f6f6f6', 1.5);
  PH.glow(g, w * 0.482, h * 0.66, 150, 0.95);
  PH.flame(g, w * 0.482, h * 0.62, 210, 54, 0.03);
  PH.rocket(g, RK0.falcon1(), w * 0.482, h * 0.62, h / 40, 0.03);
};
const shipDraw = VOX.DRAW.shipDraw = (g, w, h) => {                     // 2026: Starship in orbit, Earth's limb below
  g.fillStyle = '#121212'; g.fillRect(0, 0, w, h); PH.stars(g, w, h, 9, 60);
  PH.earthLimb(g, w * 0.5, h * 1.75, h * 1.05, 5);
  PH.rocket(g, RK0.ship(), w * 0.54, h * 0.52, w / 72, 1.05);
};

// ---------- Desk objects ----------
VOX.ITEMS = [];
// o: { key, x, y, r, at (film-wide appearance seconds), until?, z (layer, default 10), rad (culling radius), enter?: {from:[dx,dy], tilt, dur}, draw(g, T) }
VOX.item = (o) => { const it = { r: 0, z: 10, rad: 900, ...o }; VOX.ITEMS.push(it); VOX._sorted = null; return it; };
const enterXf = (it, T) => {
  const en = it.enter; if (!en) return null;
  const q = clamp(step(T - it.at) / (en.dur || 0.5)); if (q >= 1) return null;
  const e = MO.quartOut(q), from = en.from || [0, -300];
  if (en.drop) { const s = 1 + (en.drop) * (1 - e); return { dx: 0, dy: 0, dr: (en.tilt || 0) * (1 - e), s }; }
  return { dx: from[0] * (1 - e), dy: from[1] * (1 - e), dr: (en.tilt ?? 0.18) * (1 - Math.min(1, e * 1.15)), s: 1 };
};
VOX.view = (cam) => { const a = CAM.toWorld(cam, 0, 0), b = CAM.toWorld(cam, W, H); return [a[0], a[1], b[0], b[1]]; };
VOX.drawWorld = (g, cam, T, { only } = {}) => {
  if (!VOX._sorted) VOX._sorted = VOX.ITEMS.map((it, i) => [it, i]).sort((a, b) => (a[0].z - b[0].z) || (a[1] - b[1])).map(a => a[0]);
  const [x0, y0, x1, y1] = VOX.view(cam);
  g.save(); CAM.apply(g, cam); g.imageSmoothingQuality = 'high';
  g.fillStyle = g.createPattern(VOX.deskTile(), 'repeat'); g.fillRect(x0 - 10, y0 - 10, x1 - x0 + 20, y1 - y0 + 20);
  VOX.zoom = cam.z;
  for (const it of VOX._sorted) {
    if (T < it.at || (it.until != null && T >= it.until)) continue;
    if (only && !only(it)) continue;
    const rad = it.rad; if (it.x + rad < x0 || it.x - rad > x1 || it.y + rad < y0 || it.y - rad > y1) continue;
    const xf = enterXf(it, T);
    g.save(); g.translate(it.x + (xf ? xf.dx : 0), it.y + (xf ? xf.dy : 0)); if (it.r || xf) g.rotate(it.r + (xf ? xf.dr : 0)); if (xf && xf.s !== 1) g.scale(xf.s, xf.s);
    VOX._cur = it.key; it.draw(g, T); g.restore();
  }
  g.restore();
};
// ---------- Foreground props (near layer, parallax d>1, slightly defocused): pencil, binder clip, tape roll, magnifier; move faster than papers during camera travel, giving desk depth ----------
const propSpr = {
  pencil: () => VOX.spr('prop_pencil', 620, 40, (g, w, h) => {
    g.fillStyle = '#b8433f'; g.fillRect(70, 4, w - 130, h - 8); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(70, 8, w - 130, 7); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(70, h - 14, w - 130, 6);
    g.fillStyle = '#c9a77a'; g.fillRect(w - 60, 4, 30, h - 8); g.fillStyle = '#9a9a96'; g.fillRect(w - 66, 4, 8, h - 8);
    g.fillStyle = '#e2c9a0'; g.beginPath(); g.moveTo(70, 4); g.lineTo(10, h / 2); g.lineTo(70, h - 4); g.closePath(); g.fill(); g.fillStyle = '#2a2a28'; g.beginPath(); g.moveTo(28, h / 2 - 7); g.lineTo(6, h / 2); g.lineTo(28, h / 2 + 7); g.closePath(); g.fill();
  }, { sh: { blur: 22, x: 14, y: 26, col: 'rgba(40,30,20,.38)' } }),
  clip: () => VOX.spr('prop_clip', 150, 150, (g, w, h) => {
    g.fillStyle = '#1e1e1d'; g.beginPath(); g.moveTo(15, 70); g.lineTo(135, 70); g.lineTo(122, 140); g.lineTo(28, 140); g.closePath(); g.fill();
    g.strokeStyle = '#b9b9b6'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(38, 78); g.lineTo(52, 12); g.lineTo(98, 12); g.lineTo(112, 78); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(22, 78, 106, 10);
  }, { sh: { blur: 20, x: 12, y: 22, col: 'rgba(40,30,20,.4)' } }),
  tape: () => VOX.spr('prop_tape', 220, 220, (g, w, h) => {
    g.fillStyle = 'rgba(226,220,200,.92)'; g.beginPath(); g.arc(w / 2, h / 2, 104, 0, TAU); g.arc(w / 2, h / 2, 62, 0, TAU, true); g.fill();
    g.strokeStyle = 'rgba(180,170,150,.6)'; g.lineWidth = 2; for (let r = 66; r < 104; r += 7) { g.beginPath(); g.arc(w / 2, h / 2, r, 0, TAU); g.stroke(); }
    g.fillStyle = '#8a7a62'; g.beginPath(); g.arc(w / 2, h / 2, 62, 0, TAU); g.arc(w / 2, h / 2, 52, 0, TAU, true); g.fill();
  }, { sh: { blur: 22, x: 12, y: 24, col: 'rgba(40,30,20,.35)' } }),
  lens: () => VOX.spr('prop_lens', 360, 200, (g, w, h) => {
    g.fillStyle = '#2a2826'; g.save(); g.translate(190, 100); g.rotate(0); g.fillRect(0, -14, 170, 28); g.restore();
    g.strokeStyle = '#3a3836'; g.lineWidth = 16; g.beginPath(); g.arc(100, 100, 86, 0, TAU); g.stroke();
    const r = g.createRadialGradient(80, 76, 10, 100, 100, 80); r.addColorStop(0, 'rgba(255,255,255,.35)'); r.addColorStop(1, 'rgba(255,255,255,.06)'); g.fillStyle = r; g.beginPath(); g.arc(100, 100, 80, 0, TAU); g.fill();
  }, { sh: { blur: 26, x: 16, y: 30, col: 'rgba(40,30,20,.35)' } }),
};
VOX.PROP = (k) => propSpr[k]();
const PROPS = [
  { k: 'pencil', x: 2330, y: 1450, r: 0.6, d: 1.14, s: 1 }, { k: 'clip', x: 4700, y: 1560, r: -0.3, d: 1.1, s: 1 }, { k: 'tape', x: 7140, y: 1560, r: 0, d: 1.12, s: 1 },
  { k: 'lens', x: 4720, y: 3320, r: 0.5, d: 1.15, s: 1 }, { k: 'pencil', x: 2470, y: 5060, r: -0.35, d: 1.14, s: 0.8 },
];
VOX.drawProps = (g, cam) => {
  for (const p of PROPS) {
    const sp = propSpr[p.k](), [sx0, sy0] = CAM.toScreen(cam, p.x, p.y), k = p.d, sx = W / 2 + (sx0 - W / 2) * k, sy = H / 2 + (sy0 - H / 2) * k, sc = cam.z * Math.pow(k, 1.6) * p.s;
    const R = (sp.vw + sp.vpad * 2) * sc * 0.6; if (sx + R < 0 || sx - R > W || sy + R < 0 || sy - R > H) continue;
    g.save(); g.translate(sx, sy); g.rotate(p.r); g.scale(sc, sc); g.filter = `blur(${Math.max(0.5, 1.6 * cam.z).toFixed(2)}px)`; VOX.blit(g, sp); g.restore();
  }
};
// Screen-space finish: vignette and static grain (paper texture stays fixed, never jitters per frame)
VOX.finish = (c) => {
  c.drawImage(PAINT.cached('vx_vig', W, H, (g) => { const r = g.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05); r.addColorStop(0, 'rgba(40,30,20,0)'); r.addColorStop(1, 'rgba(40,30,20,.30)'); g.fillStyle = r; g.fillRect(0, 0, W, H); }), 0, 0);
  c.drawImage(PAINT.grain('vxgrain', 0.05, [40, 30, 20], 0.14), 0, 0);
};
// One desk frame: camFn(lt) supplies camera; during whip pans, layer motion blur along velocity (shorter than displacement)
VOX.desk = (c, camFn, lt, T, { blur = 0.5 } = {}) => {
  const cam = camFn(lt), buf = PAINT.scratch('vxdesk'), g = buf.getContext('2d'); g.reset();
  VOX.drawWorld(g, cam, T); VOX.drawProps(g, cam);
  c.fillStyle = C.desk; c.fillRect(0, 0, W, H);
  const [vx, vy] = CAM.velocity(camFn, lt), z0 = camFn(Math.max(0, lt - 1 / 30)).z, dz = Math.abs(Math.log(cam.z / z0));
  // Fast zooms cause halftone moiré: add slight blur proportional to zoom speed (like pan motion blur, a trace of camera movement)
  const zb = dz > 0.02 && dz < 1 ? Math.min(2.5, (dz - 0.02) * 40) : 0;
  if (zb > 0.2) { c.save(); c.filter = `blur(${zb.toFixed(2)}px)`; }
  if (Math.hypot(vx, vy) > 220) c.drawImage(buf, 0, 0); else CAM.motionBlur(c, buf, vx * blur, vy * blur, 7);   // Extreme velocity means a hard-cut frame: no blending
  if (zb > 0.2) c.restore();
  VOX.finish(c);
};
// Insert shot (hard cut after filling frame with photo): full-frame photo sprite with slow push
VOX.insert = (c, sp, lt, { z0 = 1.0, z1 = 1.05, d = 2, cx = 0, cy = 0, bg = C.black, sy = 0 } = {}) => {
  c.fillStyle = bg; c.fillRect(0, 0, W, H);
  const z = lerp(z0, z1, MO.sineInOut(clamp(lt / d)));
  c.save(); c.translate(W / 2, H / 2 + sy); c.scale(z, z); c.imageSmoothingQuality = 'high'; VOX.blit(c, sp, cx, cy); c.restore();
  VOX.finish(c);
};

// ---------- Investigation thread (one across the whole desk) ----------
// Nodes: one year label per cell hangs below thread; row ends turn down along desk edge. reveal: traces all at S01's two-minute promise.
const TAGS = [['s02', '2002'], ['s03', '2006–2008'], ['s04', '2008–2012'], ['s05', '2015–2017'], ['s06', '2018'], ['s07', '2020'], ['s08', '发射次数'], ['s09', '星链'], ['s10', '星舰'], ['s11', '2026'], ['s01', '2026.9.28'], ['s12', '接下来']];
VOX.TAGS = TAGS;
VOX.tagPos = id => { const c = VOX.cell(id), rtl = c.row === 1; return [c.x + (rtl ? 2400 - 300 : 300), VOX.BAND(c.row)]; };
const NODES = (() => {
  const o = [[60, VOX.BAND(0)]];
  for (const [id] of TAGS) {
    const p = VOX.tagPos(id), c = VOX.cell(id);
    if (id === 's06') { o.push([9540, VOX.BAND(0)]); o.push([9540, VOX.BAND(1)]); }
    if (id === 's10') { o.push([60, VOX.BAND(1)]); o.push([60, VOX.BAND(2)]); }
    o.push(p);
  }
  o.push([9540, VOX.BAND(2)]);
  return o;
})();
const STRING = (() => { let pts = []; for (let i = 1; i < NODES.length; i++) { const a = NODES[i - 1], b = NODES[i], s = CL.stringPts(a, b, Math.abs(a[1] - b[1]) > 10 ? 0.01 : 0.025, 40); pts = pts.concat(i > 1 ? s.slice(1) : s); } return { pts, cum: DG.cum(pts) }; })();
VOX.STRING = STRING;
// Thread reveal: grows both ways from opening 9.28 node while camera pulls out from that cell; viewer watches thread run outward from underfoot (12fps steps)
const ND = NODES.map((n) => { let best = 0, bd = 1e18; STRING.pts.forEach((p, i) => { const d = Math.hypot(p[0] - n[0], p[1] - n[1]); if (d < bd) { bd = d; best = i; } }); return STRING.cum[best]; });
VOX.nodeD = (k) => ND[k];
const D01 = ND[NODES.findIndex(n => { const p = VOX.tagPos('s01'); return n[0] === p[0] && n[1] === p[1]; })], LTOT = STRING.cum[STRING.cum.length - 1];
VOX.stringReveal = (T) => { const a = VOX.cue('s01', '两分钟') + 0.05; return MO.sineInOut(clamp((step(T) - a) / 1.75)); };
const CHEV = (() => { const o = [], step = 520; for (let d = 300; d < LTOT - 100; d += step) { const p = DG.pointAt(STRING.pts, STRING.cum, d), q = DG.pointAt(STRING.pts, STRING.cum, d + 6); if (NODES.some(n => Math.hypot(n[0] - p[0], n[1] - p[1]) < 260)) continue; o.push([p[0], p[1], Math.atan2(q[1] - p[1], q[0] - p[0]), d]); } return o; })();
VOX.strR = (T) => VOX.stringReveal(T) * Math.max(D01, LTOT - D01) * 1.001;
VOX.strVisible = (T, d) => VOX.stringReveal(T) > 0 && Math.abs(d - D01) <= VOX.strR(T) + 1;
const drawRange = (g, pts, cum, d0, d1) => { g.beginPath(); const a = DG.pointAt(pts, cum, d0); g.moveTo(a[0], a[1]); for (let i = 0; i < pts.length; i++) if (cum[i] > d0 && cum[i] < d1) g.lineTo(pts[i][0], pts[i][1]); const b = DG.pointAt(pts, cum, d1); g.lineTo(b[0], b[1]); g.stroke(); };
VOX.item({ key: 'string', x: VOX.DW / 2, y: VOX.DH / 2, rad: 1e6, z: 50, at: 0, draw(g, T) {
  if (VOX.stringReveal(T) <= 0) return;
  g.save(); g.translate(-VOX.DW / 2, -VOX.DH / 2);
  const r = VOX.strR(T), d0 = Math.max(0, D01 - r), d1 = Math.min(LTOT, D01 + r), lw = Math.max(5, 2.4 / VOX.zoom);
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.save(); g.strokeStyle = 'rgba(0,0,0,.16)'; g.lineWidth = lw; g.translate(3, 6); drawRange(g, STRING.pts, STRING.cum, d0, d1); g.restore();
  g.strokeStyle = C.red; g.lineWidth = lw; drawRange(g, STRING.pts, STRING.cum, d0, d1);
  NODES.forEach((n, k) => { if (VOX.strVisible(T, ND[k])) { g.save(); g.translate(n[0], n[1]); const s = Math.max(1, 0.5 / VOX.zoom); g.scale(s, s); VOX.pin(g, 0, 0); g.restore(); } });
  // Direction arrows: small red arrows show thread direction (second row right-to-left, downward turn at row end), making chronology readable in wide shot
  CHEV.forEach(([x, y, a, d]) => { if (!VOX.strVisible(T, d)) return; const s = Math.max(1, 0.55 / VOX.zoom); g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s); g.strokeStyle = C.red; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(-14, -16); g.lineTo(6, 0); g.lineTo(-14, 16); g.stroke(); g.restore(); });
  g.restore();
} });
// Year labels (large white-on-black below thread; appear only when thread reaches them)
TAGS.forEach(([id, s], k) => {
  const [x, y] = VOX.tagPos(id), ni = NODES.findIndex(n => n[0] === x && n[1] === y);
  VOX.item({ key: 'tag' + id, x, y: y + 140, r: (k % 2 ? 0.02 : -0.018), rad: 700, z: 49, at: 0, draw(g, T) {
    if (!VOX.strVisible(T, VOX.nodeD(ni))) return;
    const sp = VOX.spr('tag' + id, VOX.tagW(s), 230, (gg, w, h) => { gg.save(); CL.tornRect(gg, w, h, 31 + k, 3); gg.fillStyle = C.black; gg.fill(); gg.restore(); VOX.text(gg, s, w / 2, h / 2 + 56, 160, /\d/.test(s) ? F.num : F.heavy, C.paper, 'center'); }, { S: 1.2 });
    VOX.blit(g, sp);
  } });
});
VOX.tagW = (s) => { const g = PAINT.scratch('vxmeasure').getContext('2d'); g.font = font(160, /\d/.test(s) ? F.num : F.heavy); return g.measureText(s).width + 90; };

// ---------- Warmup: draw all cached sprites at startup (otherwise first-use halftone generation can take 1–2 seconds for one frame) ----------
VOX.warm = [];                                                 // Additional scene warmup functions (large insert photos)
VOX.prewarm = () => {
  const g = PAINT.scratch('vxwarm').getContext('2d'); VOX.zoom = 1;
  for (const it of VOX.ITEMS) for (const T of [it.at + 0.02, it.at + 0.6, it.at + 1.5, it.at + 3, 1e4]) { g.reset(); g.translate(960, 540); try { it.draw(g, T); } catch (e) { console.error('prewarm ' + it.key + ' ' + e); } }
  VOX.warm.forEach(f => f()); Object.values(propSpr).forEach(f => f());
};
// ---------- Shared: scene registration ----------
// Each segment has shots: [{t: start lt, kind: 'desk'|'fn', fn?}]; desk shots use segment camera. No inter-segment transitions (one desk: camera movement provides transitions, or hard cuts at sentence breaks).
VOX.scene = (id, { cam, shots = [], init } = {}) => {
  VOX.cams[id] = cam;
  SCENES[id] = {
    init() { if (init) init(); },
    draw(c, lt, t) {
      let sh = null; for (const s of shots) if (lt >= s.t) sh = s;
      if (sh && sh.fn) { VOX._cur = 'insert:' + id; sh.fn(c, lt, t); return; }
      VOX.desk(c, cam, lt, t);
    },
  };
};
// Glyph check: all on-screen text in a segment
VOX.glyphs = (id, list) => { for (const [fam, s] of list) U.assertGlyphs(fam, s, id); };
VOX.checkTags = () => { TAGS.forEach(([, s]) => U.assertGlyphs(/\d/.test(s) ? F.num : F.heavy, s, 'tags')); };
})();
