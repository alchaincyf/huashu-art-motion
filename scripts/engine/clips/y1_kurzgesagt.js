// Clip · Kurzgesagt flat science explainer (y1): flat dark-ink background without theme (no indigo night gradient); central object is the concept; each point is a satellite node,
// with capsule label springing in (108% overshoot), signals along edges. Stars/particles/pulses move subtly; center/nodes/labels stop once settled,
// no constant slow camera push: highlight pushes ~30%, successive highlights pan at same zoom, then stop.
// spec data.camera 'smooth' (default, push 0.9s, node change 0.7s, sineInOut)|'snap' (emphasis: punch-in 0.28s, pan 0.30s).
// Signature scale journey: enter zooms logarithmically into a satellite until its color fills screen, then pulls out from same-colored new center: what's inside.
// cues: title (characters rise at top; text) · point (satellite + label in current layer: text; data.color overrides accent)
//       highlight (push toward data.index node (current-layer points only, from 0, default latest), dim others/labels; completes in 1.2s)
//       enter (enter data.index node, default latest: zoom → solid color → pull out of new center; text = new center name, default node name;
//              subsequent points belong to new layer; default dur 1.6s, push begins on frame at at)
// data.center: first-layer center name. data.center_style: {color,shape:'circle'|'rounded'|'hex'|'diamond',ring:true (orbital ring)},
//   Omitted: neutral name-hashed style (same name/color/shape; no ring). data.image: image inside center (screenshot/photo, shape-clipped), name moves to capsule below.
//   New enter-layer center uses node color and name-hashed shape; enter data.style overrides.
// data.flow:true: chain nodes (center→1→2→3), sequential signals and numbered nodes; use for sequences.
// Same layout in landscape/portrait: ≤3 nodes in upper semicircle left→right; ≥4 full circle clockwise from left. safe: layout within top..H−bottom.
// spec.theme (film-wide ctx.pal): flat bg (no gradient/glow), low-alpha sub stars/particles, sub connections, accent2 signals,
//   accent/accent2 node shades (explicit data.color wins), default accent2 center; capsules use surface/ink on light palettes or ink/bg on dark; ink title.
CLIPS.y1_kurzgesagt = (() => {
const { clamp, lerp, rng } = U;
// Default (no theme): dark ink bg with nearly invisible same-hue shading; no purple/magenta/blue-purple nodes/center
const P0 = { sky: ['#0F1114', '#121417', '#171A1E'], star: '#F2EFE8', line: 'rgba(125,211,220,.35)', pulse: '#32BAEE', pulseCore: '#e9fdff', mote: '#fff6d0', pill: '#ffffff', pillInk: '#1B1A17', title: '#fff', ring: 'rgba(255,230,190,.55)', arrow: 'rgba(125,211,220,.7)', shadow: 'rgba(20,40,20,.25)' };
const ACC0 = ['#32BAEE', '#FACC12', '#E07A3F', '#5CD0B3', '#FC6255', '#A3B84B'];
// Neutral center style: name-hashed color/shape (same name, same style), no orbital ring
const CPAL0 = ['#4F86C6', '#3FA796', '#D99A3A', '#C8574A', '#5BA4CF', '#6FAF5A'], SHAPES = ['circle', 'rounded', 'hex'];
let P = P0, ACC = ACC0, CPAL = CPAL0, PL = null;
// Film palette → grammar colors (derived only from 6 keys)
const fromPal = p => { const dk = PAL.dark(p), spot = dk ? p.ink : p.sub;
  return { P: { sky: [p.bg], star: spot, line: PAL.alpha(p.sub, 0.5), pulse: p.accent2, pulseCore: PAL.mix(p.accent2, p.surface, 0.6), mote: spot, pill: dk ? p.ink : p.surface, pillInk: dk ? p.bg : p.ink, title: p.ink,
      ring: PAL.alpha(p.ink, 0.4), arrow: PAL.alpha(p.sub, 0.85), shadow: PAL.alpha(dk ? '#000000' : p.ink, dk ? 0.3 : 0.14) },
    ACC: [p.accent, p.accent2, PAL.mix(p.accent, p.ink, 0.35), PAL.mix(p.accent2, p.ink, 0.35), PAL.mix(p.accent, p.bg, 0.3), PAL.mix(p.accent2, p.bg, 0.3)],
    CPAL: [p.accent2] }; };
const hashStr = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.codePointAt(0), 16777619); return h >>> 0; };
const styleFor = (name, over = {}, col) => { const h = hashStr(name || '·'); return { color: over.color || col || CPAL[h % CPAL.length], shape: over.shape || SHAPES[(h >>> 8) % SHAPES.length], ring: !!over.ring }; };
const shapePath = (kind, x, y, R) => { const p = new Path2D();
  if (kind === 'rounded') p.roundRect(x - R * 0.92, y - R * 0.92, R * 1.84, R * 1.84, R * 0.36);
  else if (kind === 'hex') for (let i = 0; i <= 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; i ? p.lineTo(x + Math.cos(a) * R * 1.06, y + Math.sin(a) * R * 1.06) : p.moveTo(x + Math.cos(a) * R * 1.06, y + Math.sin(a) * R * 1.06); }
  else if (kind === 'diamond') { p.moveTo(x, y - R * 1.2); p.lineTo(x + R * 1.2, y); p.lineTo(x, y + R * 1.2); p.lineTo(x - R * 1.2, y); p.closePath(); }
  else p.arc(x, y, R, 0, Math.PI * 2);
  return p; };
const dark = (col, k = 0.72) => PAINT.rgb(PAINT.hex(col).map(v => v * k)), light = col => PAINT.rgb(PAINT.hex(col).map(v => v + (255 - v) * 0.4));
let S, levels, flow;
return {
  fonts: ['PuHui-Heavy', 'PuHui-Medium'],
  safe: true,
  init(ctx) {
    const { W, H, u, safe } = ctx, r = rng(11);
    PL = ctx.pal; if (PL) ({ P, ACC, CPAL } = fromPal(PL)); else { P = P0; ACC = ACC0; CPAL = CPAL0; }
    flow = !!ctx.data.flow;
    const y0 = safe.top + (ctx.of('title').length ? (ctx.portrait ? 300 : 210) * u : 60 * u), y1 = H - safe.bottom - 40 * u;
    const R = (ctx.portrait ? 160 : 140) * u, cx = W / 2, cy = (y0 + y1) / 2 + (ctx.portrait ? 0 : 30 * u);
    S = { cx, cy, R, stars: Array.from({ length: 160 }, () => ({ x: r() * W * 1.4 - W * 0.2, y: r() * H * 1.4 - H * 0.2, r: (0.8 + r() * r() * 3) * u, ph: r() * 6.28, sp: 1 + r() * 2.5 })),
      motes: Array.from({ length: 24 }, () => ({ x: r() * W, y: r() * H, ph: r() * 6.28, d: 0.8 + r() * 0.5, s: (2 + r() * 3) * u })) };
    // Layers: enter puts subsequent points in a new layer
    const cs0 = styleFor(ctx.data.center || '', ctx.data.center_style || {});
    levels = [{ start: 0, center: ctx.data.center || '', col: cs0.color, style: cs0, img: ctx.data.image ? ctx.IMG[ctx.data.image] : null, pts: [], hls: [] }];
    for (const q of ctx.cues) {
      const L = levels[levels.length - 1];
      if (q.kind === 'point') L.pts.push(q);
      else if (q.kind === 'highlight') L.hls.push(q);
      else if (q.kind === 'enter') { const D = q.dur || 1.6; L.exit = { q, at: q.at, D, sw: q.at + D * 0.55, idx: q.data && q.data.index };
        levels.push({ start: q.at + D * 0.55, end0: q.at + D, center: '', col: null, pts: [], hls: [], from: L }); }
    }
    // Node positions per layer (same angles both orientations: ≤3 upper semicircle left→right; ≥4 full circle clockwise from left)
    const lab = 46 * u + 70 * u + 45 * u;                               // Node radius + label offset + half label height: lowest label must stay within y1
    const rx = ctx.portrait ? W * 0.34 : Math.min(W * 0.32, 640 * u), ryHalf = Math.min(y1 - y0, H) * (ctx.portrait ? 0.3 : 0.42), ryRing = Math.min((y1 - y0) * (ctx.portrait ? 0.34 : 0.36), y1 - cy - lab, cy - y0 - 60 * u);
    levels.forEach((L, li) => {
      const n = L.pts.length, ring = n >= 4;
      L.nodes = L.pts.map((q, i) => { const ang = ring ? Math.PI + i / n * Math.PI * 2 : Math.PI + (i + 0.5) / n * Math.PI;
        const ry = ring ? ryRing : ryHalf; return { q, i, x: cx + Math.cos(ang) * rx, y: cy + Math.sin(ang) * ry, col: (q.data && q.data.color) || ACC[(i + li * 2) % ACC.length] }; });
      if (L.exit) { const nd = L.exit.idx != null ? L.nodes[L.exit.idx] : L.nodes.filter(z => z.q.at <= L.exit.at).pop() || L.nodes[L.nodes.length - 1];
        L.exit.node = nd; const N = levels[li + 1]; N.col = nd ? nd.col : ACC[0]; N.center = L.exit.q.text || (nd && nd.q.text) || '';
        N.style = styleFor(N.center, (L.exit.q.data && L.exit.q.data.style) || {}, N.col); N.col = N.style.color; }
      // Layer camera: hold; highlight pushes to node (~30%, target biased toward center to avoid excessive clipping),
      // If already zoomed, next highlight pans to node at same scale, then holds. Timings from data.camera
      const Z = ctx.portrait ? 1.28 : 1.32; L.events = []; let zoomed = false;
      for (const h of L.hls) {
        const nd = h.data && h.data.index != null ? L.nodes[h.data.index] : L.nodes.filter(z => z.q.at <= h.at).pop(); if (!nd) continue;
        const snap = (ctx.data && ctx.data.camera) === 'snap';
        L.events.push(zoomed ? { at: h.at, kind: snap ? 'pan' : 'glide', x: lerp(nd.x, cx, 0.35), y: lerp(nd.y, cy, 0.35) } : { at: h.at, kind: 'to', x: lerp(nd.x, cx, 0.35), y: lerp(nd.y, cy, 0.35), z: Z, ...(snap ? { dur: MO.PULSE.punch, ease: MO.cubicInOut } : {}) });
        zoomed = true; h.node = nd;
      }
    });
  },
  draw(c, t, ctx) {
    const { W, H, u } = ctx;
    // Current layer changes at switch point; crossfade within ±0.05s (both solid same color; invisible cut)
    let k = 0; levels.forEach((L, i) => { if (i > 0 && t >= L.start) k = i; });
    drawLevel(c, k, t, ctx);
    const L = levels[k], ex = L.exit;
    if (ex && t > ex.sw - 0.05 && t < ex.sw) { const buf = UI.scratch('clip_y1x', W, H), g = buf.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
      drawLevel(g, k + 1, t, ctx); c.save(); c.globalAlpha = (t - (ex.sw - 0.05)) / 0.1; c.drawImage(buf, 0, 0); c.restore(); }
    // Title: characters rise (screen layer, independent of camera); fades at first highlight/enter
    const qt = ctx.of('title')[0];
    if (qt) { const nx = ctx.of('highlight', 'enter')[0], out = nx ? 1 - MO.sineInOut(clamp((t - nx.at) / 0.5)) : 1;
      if (out > 0) { c.save(); c.globalAlpha = out; const fs = TY.fit(c, qt.text || '', W * 0.88, (ctx.portrait ? 84 : 76) * u, 'PuHui-Heavy', { maxLines: 2, balance: true });
        fs.lines.forEach((ln, i) => TY.charsIn(c, ln, W / 2, ctx.safe.top + (ctx.portrait ? 200 : 130) * u + i * fs.size * 1.2, ctx.lt(t, qt.at) - i * 0.2, { font: `${fs.size}px "PuHui-Heavy"`, color: P.title, dur: 0.5, stagger: 0.045, dy: 30 * u, align: 'center', shadow: PL && !ctx.alpha ? null : { color: 'rgba(0,0,0,.5)', y: 6 * u, blur: ctx.alpha ? 14 * u : 0 } }));
        c.restore(); } }
  },
};
// Camera: layer motion table; exiting → zoom node to fill screen; entering → pull out from screen-filling center
function camAt(L, t, ctx) {
  const { W, H } = ctx;
  if (L.from && t < L.end0) {                                            // Pull out: z logarithmically drops from full-cover center to 1; center returns from screen center to its position
    const e = MO.cubicInOut(clamp((t - L.start) / (L.end0 - L.start))), Z = CAM.coverZoom(S.R * 0.84) * 1.15;   // 0.84: diamond/hexagon incircles smaller than R must still cover screen
    return CAM.anchor(S.cx, S.cy, CAM.zlerp(Z, 1, e), lerp(W / 2, S.cx, e), lerp(H / 2, S.cy, e));
  }
  const ex = L.exit;
  if (ex && t >= ex.at && ex.node) {                                      // Push: logarithmic scale, node smoothly centers until its circle covers screen
    const base = CAM.track({}, L.events, ex.at), e = MO.cubicIn(clamp((t - ex.at) / (ex.sw - ex.at)) ) * 0.5 + MO.cubicInOut(clamp((t - ex.at) / (ex.sw - ex.at))) * 0.5;
    return CAM.pushTo(base, ex.node.x, ex.node.y, CAM.coverZoom(46 * ctx.u) * 1.2, e, e);
  }
  return CAM.track({}, L.events, t);
}
function drawLevel(c, k, t, ctx) {
  const { W, H, u } = ctx, L = levels[k], cam = camAt(L, t, ctx), { cx, cy, R } = S;
  if (!ctx.alpha) {
    c.fillStyle = P.sky.length > 1 ? TOON.vgrad(c, 0, H, P.sky) : P.sky[0]; c.fillRect(0, 0, W, H);
    const sa = PL ? 0.35 : 1;                                             // Stars on palette background are a very faint texture
    CAM.layer(c, cam, 0.05, g => { for (const s of S.stars) { g.globalAlpha = sa * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph))); g.fillStyle = P.star; g.beginPath(); g.arc(s.x, s.y, s.r, 0, 7); g.fill(); } g.globalAlpha = 1; });
  }
  // During highlight: zoomed node bright, other nodes/labels dim
  const hNow = [...L.hls].reverse().find(h => t >= h.at && h.node), dimK = hNow ? MO.smooth(clamp((t - hNow.at) / 0.6)) : 0;
  const col = L.col, st = L.style, pull = L.from && t < L.end0 ? MO.smooth(clamp(((t - L.start) / (L.end0 - L.start) - 0.45) / 0.45)) : 1;   // Entry: initially solid color; name/ring appear in second half of pull-out
  CAM.layer(c, cam, 1, g => {
    // Connections + signal pulses (flow: center→1→2→3 chain with sequential signals)
    L.nodes.forEach((nd, i) => {
      const l = ctx.lt(t, nd.q.at); if (l <= 0) return;
      const from = flow && i > 0 ? L.nodes[i - 1] : { x: cx, y: cy }, p = MO.cubicOut(clamp(l / 0.4)), ex = lerp(from.x, nd.x, p), ey = lerp(from.y, nd.y, p);
      g.save(); g.globalAlpha = 1 - 0.6 * dimK * (hNow && hNow.node === nd ? 0 : 1);
      g.strokeStyle = P.line; g.lineWidth = 4 * u; g.beginPath(); g.moveTo(from.x, from.y); g.lineTo(ex, ey); g.stroke();
      if (flow && l > 0.4) { const ax = lerp(from.x, nd.x, 0.55), ay = lerp(from.y, nd.y, 0.55), a = Math.atan2(nd.y - from.y, nd.x - from.x); g.fillStyle = P.arrow; g.translate(ax, ay); g.rotate(a); g.beginPath(); g.moveTo(10 * u, 0); g.lineTo(-8 * u, -9 * u); g.lineTo(-8 * u, 9 * u); g.closePath(); g.fill(); }
      g.restore();
      for (let kk = 0; kk < 3; kk++) { if (l < 0.4) break; const q = flow ? ((t * 0.7 - i * 0.33 + kk / 3) % 1 + 1) % 1 : ((l * 0.8 + kk / 3) % 1); const x = lerp(from.x, nd.x, q), y = lerp(from.y, nd.y, q); if (!PL) TOON.glow(g, x, y, 20 * u, P.pulse, 0.6 * (1 - 0.7 * dimK)); g.fillStyle = PL ? P.pulse : P.pulseCore; g.beginPath(); g.arc(x, y, (PL ? 7 : 5) * u, 0, 7); g.fill(); }
    });
    // Center: two-tone facets + soft light (data.center_style or name-hashed), optional ring; data.image clipped inside shape
    const shape = shapePath(st.shape, cx, cy, R);
    if (!PL) TOON.glow(g, cx, cy, R * 2.4, light(col), 0.28);
    TOON.flat(g, shape, col, dark(col), light(col), [-18 * u, 14 * u], [-6 * u, 5 * u]);
    if (L.img) { g.save(); g.clip(shapePath(st.shape, cx, cy, R * 0.9)); MD.cover(g, L.img, { x: cx - R, y: cy - R, w: 2 * R, h: 2 * R }); g.restore(); }
    if (st.ring) { g.save(); g.globalAlpha = pull; g.strokeStyle = P.ring; g.lineWidth = 6 * u; g.beginPath(); g.ellipse(cx, cy, R * 1.55, R * 0.35, -0.25, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); g.restore(); }
    if (L.center && !L.img) { const f = TY.fit(g, L.center, R * 1.7, 56 * u, 'PuHui-Heavy', { maxLines: 2, min: 0.5, balance: true });   // Name inside center: shrink font, then wrap to two lines
      g.save(); g.globalAlpha = pull; g.font = `${f.size}px "PuHui-Heavy"`; g.fillStyle = PL ? PAL.on(col, [PL.surface, PL.ink, PL.bg]) : '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      f.lines.forEach((ln, i) => g.fillText(ln, cx, cy + (i - (f.lines.length - 1) / 2) * f.size * 1.1)); g.restore(); }
    else if (L.center) { const f = TY.fit(g, L.center, R * 3, 44 * u, 'PuHui-Heavy', { maxLines: 1, min: 0.6 });   // With image: name in white capsule below
      g.save(); g.globalAlpha = pull; g.font = `${f.size}px "PuHui-Heavy"`; const tw = g.measureText(f.lines[0] || '').width, bw = tw + 56 * u, bh = f.size * 1.6, by = cy + R * 1.12;
      g.fillStyle = P.pill; g.beginPath(); g.roundRect(cx - bw / 2, by, bw, bh, bh / 2); g.fill(); g.fillStyle = P.pillInk; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(f.lines[0] || '', cx, by + bh / 2 + 2 * u); g.restore(); }
    // Nodes + capsule labels (0.5s pop, 108% overshoot)
    for (const nd of L.nodes) {
      const l = ctx.lt(t, nd.q.at); if (l <= 0) continue;
      const on = hNow && hNow.node === nd, a = 1 - 0.65 * dimK * (on ? 0 : 1);
      const pop = MO.backOut(clamp(l / 0.5), 1.1), fy = 0, nr = 46 * u * pop * (on ? 1 + 0.15 * dimK : 1);
      g.save(); g.globalAlpha = a;
      if (!PL) TOON.glow(g, nd.x, nd.y + fy, nr * (on ? 4.2 : 2.6), nd.col, on ? 0.7 : 0.45);
      TOON.flat(g, TOON.circle(nd.x, nd.y + fy, nr), nd.col, dark(nd.col), PL ? light(nd.col) : '#ffffff', [-8 * u, -8 * u], [-3 * u, -3 * u]);
      if (flow) { g.font = `${30 * u * pop}px "PuHui-Heavy"`; g.fillStyle = PL ? PAL.on(nd.col, [PL.surface, PL.ink, PL.bg]) : P.pillInk; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(nd.i + 1), nd.x, nd.y + fy + 2 * u); }
      const gone = L.exit ? 1 - clamp((t - L.exit.at) / 0.2) : 1;   // On enter: hide all layer labels as push begins (otherwise they become half-screen white blocks, including neighbors)
      const lp = MO.backOut(clamp((l - 0.15) / 0.5), 1.1) * gone; if (lp > 0) {
        const sc = lp * (on ? 1 + 0.18 * dimK : 1);
        const lf = TY.fit(g, nd.q.text || '', ctx.W * 0.44 - 56 * u, (ctx.portrait ? 44 : 38) * u, 'PuHui-Medium', { maxLines: 1 });   // Shrink long labels first
        g.font = `${lf.size}px "PuHui-Medium"`; const tw = g.measureText(nd.q.text || '').width, bw = tw + 56 * u, bh = 70 * u;
        const ly = nd.y + fy + (nd.y < cy - R * 0.5 && ctx.portrait ? -nr - 70 * u : nr + 70 * u);   // Labels below nodes (above for portrait upper semicircle)
        const z = cam.z || 1, vx0 = cam.x - ctx.W / 2 / z, vx1 = cam.x + ctx.W / 2 / z, hw = bw * sc / 2 + 20 * u / z;   // Visible world bounds in current camera (slow push may move edge labels offscreen)
        const lx = nd.x > vx0 && nd.x < vx1 ? (vx1 - vx0 > 2 * hw ? clamp(nd.x, vx0 + hw, vx1 - hw) : cam.x) : nd.x;   // If node visible, clamp label back into frame
        g.translate(lx, ly); g.scale(sc, sc);
        g.fillStyle = P.shadow; g.beginPath(); g.roundRect(-bw / 2 + 6 * u, -bh / 2 + 8 * u, bw, bh, bh / 2); g.fill();
        g.fillStyle = P.pill; g.beginPath(); g.roundRect(-bw / 2, -bh / 2, bw, bh, bh / 2); g.fill();
        if (on) { g.strokeStyle = nd.col; g.lineWidth = 5 * u * dimK; g.stroke(); }
        g.fillStyle = P.pillInk; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(nd.q.text || '', 0, 2 * u);
      }
      g.restore();
    }
    // Firefly particles
    for (const m of S.motes) { const x = m.x + Math.sin(t * 0.8 + m.ph) * 30 * u, y = m.y - ((t * 22 * u + m.ph * 40 * u) % (120 * u)); g.globalAlpha = (PL ? 0.3 : 1) * (0.4 + 0.4 * Math.sin(t * 2 + m.ph)); g.fillStyle = P.mote; g.beginPath(); g.arc(x, y, m.s, 0, 7); g.fill(); }
    g.globalAlpha = 1;
  });
}
})();
