// Clip · Vox collage (y2): large desktop world, assets arranged in entry order and linked by red thread; camera smoothly follows at 60fps,
// desk actions (slide, marker, red circle, typing) step at 12fps on twos.
// cues: image|clip (screenshot/photo/clipping: image path or frames sequence; printed copy (white border, aged paper, tape, MD.print); optional text lower-left black torn label (12fps typing);
//              data.halftone:true makes grayscale dots, otherwise original color; data.fit:'cover' crops around data.focus=[fx,fy] to data.aspect (default 16:9/portrait 4:5), otherwise contain; slides in at at)
//       title (Borders-style black/white label strip, 13 chars/s typing) · point (ruled index card, typing)
//       highlight (data.rect=[x,y,w,h] normalized to current image: marker sweep from at → red circle → camera push to region)
// Photos/screenshots lead: held asset fills 80–90% screen (landscape width ~90% or height ~86%); landscape left→right, portrait top→bottom;
// Camera arrives before next asset's at (red thread draws first, camera follows), pushes during highlight, otherwise holds.
//   spec data.camera 'smooth' (default, next asset 0.7s, push 0.9s, sineInOut; Vox measured 0.5–1.5s)|'snap' (emphasis: pan 0.30s, punch-in 0.28s).
// spec.theme (film-wide ctx.pal): bg paper desktop, surface index cards/ink text, ink title strip/surface text, accent red thread/pins/circles,
//   pale accent2 card rules, brightened accent marker; physical photo borders/tape unchanged.
CLIPS.y2_vox = (() => {
const { clamp, lerp, rng } = U;
const C0 = { desk: '#e4ddcf', ink: '#171716', red: '#b8433f', paper: '#eeedeb', card: '#f6f4ee', fiber: [110, 95, 70], rule: 'rgba(80,140,200,.3)', margin: 'rgba(184,67,63,.5)', vig: '40,30,20', hi: undefined };
let C = C0;
const fromPal = p => ({ desk: p.bg, ink: p.ink, red: p.accent, paper: p.surface, card: p.surface, fiber: PAL.rgb(p.sub), rule: PAL.alpha(p.accent2, 0.3), margin: PAL.alpha(p.accent, 0.5),
  vig: PAL.rgb(PAL.dark(p) ? '#000000' : p.ink).join(','), hi: PAL.alpha(PAL.mix(p.accent, '#FFFFFF', 0.35), 0.85) });
const BOLD = '"PuHui-Heavy"', TXT = '"PuHui-Bold"';
let items, keys, strings;
// Clip-local time on twos: already >0 at at
const ls = (t, at) => MO.step(t - at + 1e-6, 12) + 1 / 12;
return {
  fonts: ['PuHui-Heavy', 'PuHui-Bold'],
  safe: true,
  init(ctx) {
    const { W, H, u, portrait } = ctx, r = rng(7), g = document.createElement('canvas').getContext('2d');
    C = ctx.pal ? fromPal(ctx.pal) : C0;
    items = []; let cur = 0, prev = null;
    for (const q of ctx.of('image', 'clip', 'title', 'point')) {
      let w, h, kind = q.kind === 'clip' ? 'image' : q.kind, lines = null, size = 0;
      if (kind === 'image') {
        const im = ctx.still(q); if (!im) continue;
        const [iw, ih] = MD.size(im), cov = q.data && q.data.fit === 'cover', ar = cov ? (q.data.aspect || (portrait ? 0.8 : 16 / 9)) : iw / ih;
        const bw = W * (portrait ? 0.86 : 0.78), bh = H * (portrait ? 0.5 : 0.76), f = CLIP.fit(ar, 1, 0, 0, bw, bh);
        w = f.w + 32 * u; h = f.h + 32 * u;
      } else {
        if (!String(q.text ?? '').trim()) { console.warn(`y2 ${q.kind} at=${q.at}：text 是空的，这张卡跳过`); continue; }   // Empty card width is −Infinity, causing torn-edge point generation to loop forever
        size = (kind === 'title' ? 64 : 48) * u;
        lines = TY.wrap(g, q.text || '', W * (portrait ? 0.74 : 0.5), `${size}px ${kind === 'title' ? BOLD : TXT}`);
        g.font = `${size}px ${kind === 'title' ? BOLD : TXT}`;
        w = Math.max(...lines.map(l => g.measureText(l).width)) + (kind === 'title' ? 80 : 110) * u; h = lines.length * size * 1.45 + (kind === 'title' ? 50 : 100) * u;
      }
      const gap = 260 * u, jitter = (r() - 0.5) * (portrait ? W * 0.12 : H * 0.12);
      const x = portrait ? W / 2 + jitter : (prev ? prev.x + prev.w / 2 + gap + w / 2 : W / 2);
      const y = portrait ? (prev ? prev.y + prev.h / 2 + gap + h / 2 : H / 2) : H / 2 + jitter;
      const it = { q, kind, x, y, w, h, rot: (r() - 0.5) * 0.07, lines, size, seed: 11 + items.length * 7 };
      items.push(it); prev = it; cur++;
    }
    // Card typing/read time: default 13 chars/s, speed up near next asset (max 40 chars/s) to finish before camera leaves with 0.5s reading hold
    items.forEach((it, i) => {
      if (it.kind === 'image') { it.done = it.q.at + 0.6; return; }
      const nC = [...(it.q.text || '')].length, next = items[i + 1] ? items[i + 1].q.at : ctx.dur;
      it.cps = clamp(nC / Math.max(0.3, next - it.q.at - 0.95 - 0.5), 13, 40);
      it.done = it.q.at + nC / it.cps + 0.5;
    });
    // Thread: pin previous right edge (portrait bottom) to next left edge (top)
    strings = items.slice(1).map((b, i) => { const a = items[i];
      const pa = portrait ? [a.x + a.w * 0.2, a.y + a.h / 2 - 20 * u] : [a.x + a.w / 2 - 30 * u, a.y + a.h * 0.25];
      const pb = portrait ? [b.x - b.w * 0.2, b.y - b.h / 2 + 20 * u] : [b.x - b.w / 2 + 30 * u, b.y - b.h * 0.25];
      const pts = CL.stringPts(pa, pb, 0.06); return { a: pa, b: pb, pts, cum: DG.cum(pts), at: b.q.at }; });
    // Camera keyframes: follow ~0.9s before each entry (long tail), settle before at; push to highlight region
    const Hs = H - ctx.safe.top - ctx.safe.bottom;                           // Available height after subtitle margins; shift screen center down/up accordingly (draw translation)
    const zFor = it => it.kind === 'image' ? clamp(Math.min(W * 0.9 / it.w, Hs * 0.86 / it.h), 0.5, 2.4) : clamp(Math.min(W * 0.82 / it.w, Hs * 0.8 / it.h), 0.5, 1.6);   // Photos fill frame, text cards should not be oversized
    keys = []; let last = null;
    const snap = (ctx.data && ctx.data.camera) === 'snap', MV = snap ? { next: MO.PULSE.pan, in: MO.PULSE.punch, ease: MO.cubicInOut } : { next: MO.PULSE.glide, in: MO.PULSE.push, ease: MO.sineInOut };
    const hls = ctx.of('highlight');
    const events = [...items.map(it => ({ at: it.q.at, it })), ...hls.map(h => ({ at: h.at, h }))].sort((a, b) => a.at - b.at);
    let curItem = null;
    for (const e of events) {
      if (e.it) {
        const tgt = { x: e.it.x, y: e.it.y, z: zFor(e.it) };
        if (!last) { keys.push({ t: 0, ...tgt }); }
        else { const P = MV.next, t0 = Math.max(last.t + 0.05, e.at - P - 1 / ctx.FPS), t1 = t0 + P;   // Move to next asset, arrive frame before at (continue unfinished previous movement)
          keys.push({ t: t0, x: last.x, y: last.y, z: last.z }); keys.push({ t: t1, ...tgt, ease: MV.ease }); }
        last = keys[keys.length - 1]; curItem = e.it;
      } else if (curItem && curItem.kind === 'image' && e.h.data && e.h.data.rect) {
        const R = e.h.data.rect, ib = imgBox(curItem, u);
        const cx = curItem.x + (ib.x + (R[0] + R[2] / 2) * ib.w) - curItem.w / 2, cy = curItem.y + (ib.y + (R[1] + R[3] / 2) * ib.h) - curItem.h / 2;
        const rw = R[2] * ib.w, rh = R[3] * ib.h;
        let zFit = Math.min(W * 0.8 / (rw * 1.4 + 32 * u), Hs * 0.8 / (rh * 1.44 + 20 * u));   // Keep full red ellipse (drawItem below) in frame after push, 10% margins each side (review: 0.9 still clips shaky circle/motion blur)
        if (R[2] >= 0.5) zFit = Math.min(zFit, Math.max(last.z, W * 0.96 / curItem.w));          // Region covers over half image: push would crop side text, so skip
        const z = Math.min(clamp(Math.min(W * (ctx.portrait ? 0.78 : 0.55) / rw, Hs * 0.55 / rh), last.z, last.z * 2.6), zFit);   // Portrait width limits zoom: region fills ~80% width
        // If region start (marker left edge) visible: draw first, push at at+0.2; if offscreen after prior zoom:
        // move camera there before frame at at, then reveal; otherwise first reveal is offscreen, visible >0.2s late (2026-10 portrait: 7 frames late)
        const x0 = cx - rw / 2, inView = Math.abs(x0 - last.x) * last.z < W / 2 - 20 * u && Math.abs(cy - last.y) * last.z < Hs / 2 - rh * last.z / 2;
        const P = MV.in, t0 = inView ? Math.max(last.t + 0.05, e.at + 0.2) : Math.max(last.t + 0.05, e.at - P - 1 / ctx.FPS), t1 = t0 + P;   // Push (default smooth, snap punch-in)
        keys.push({ t: t0, x: last.x, y: last.y, z: last.z }); keys.push({ t: t1, x: cx, y: cy, z, ease: MV.ease });
        last = keys[keys.length - 1];
      }
    }
    if (!keys.length) keys.push({ t: 0, x: W / 2, y: H / 2, z: 1 });
    const end = keys[keys.length - 1]; keys.push({ t: Math.max(end.t + 0.01, ctx.dur), x: end.x, y: end.y, z: end.z, ease: MO.linear });   // Hold after final action
  },
  draw(c, t, ctx) {
    const { W, H, u } = ctx, cam = CAM.at(keys, t);
    const buf = UI.scratch('clip_vox', W, H), g = buf.getContext('2d'); g.reset();
    g.save(); g.translate(0, (ctx.safe.top - ctx.safe.bottom) / 2); CAM.apply(g, cam);
    if (!ctx.alpha) { g.fillStyle = g.createPattern(CL.paperTile('clipdesk' + (C === C0 ? '' : '_' + C.desk), C.desk, { amt: 12, fibers: 320, fiberCol: C.fiber }), 'repeat'); const s = 4 / cam.z; g.fillRect(cam.x - W * s, cam.y - H * s, W * 2 * s, H * 2 * s); }
    // Red thread draws with next asset entry (12fps)
    for (const s of strings) { const q = MO.sineInOut(clamp(ls(t, s.at - 0.9) / 0.7)); if (t < s.at - 0.9) continue;
      CL.string(g, s.pts, s.cum, s.cum[s.cum.length - 1] * q, { col: C.red, lw: 5 * u }); CL.pin(g, s.a[0], s.a[1], C.red); if (q >= 1) CL.pin(g, s.b[0], s.b[1], C.red); }
    for (const it of items) {
      const q = it.q; if (t < q.at - 1e-6) continue;
      // Twos start from at (ls), not absolute 12fps grid: grid rounding reveals assets 1–2 frames early (2026-10 portrait: 2 frames early)
      CL.slideIn(g, q.at + ls(t, q.at), q.at, it.x, it.y, it.rot, gg => drawItem(gg, it, t, ctx), { from: ctx.portrait ? [120 * u, 360 * u] : [420 * u, -60 * u], tilt: 0.2, dur: 0.55, fps: 1e6 });
    }
    g.restore();
    const [vx, vy] = CAM.velocity(tt => CAM.at(keys, tt), t);
    if (Math.hypot(vx, vy) >= 1.5) c.drawImage(buf, 0, 0);   // Back with unshifted image: motionBlur starts shifted, leaving translucent borders (gray edges in output)
    CAM.motionBlur(c, buf, vx * 0.6, vy * 0.6, 7);
    if (!ctx.alpha) {                                                   // Vignette + static grain (fixed paper texture, no per-frame jitter)
      const v = PAINT.cached('clip_vox_vig' + W + 'x' + H + C.vig, W, H, gg => { const r = gg.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.62); r.addColorStop(0, `rgba(${C.vig},0)`); r.addColorStop(1, `rgba(${C.vig},${C === C0 ? .34 : .18})`); gg.fillStyle = r; gg.fillRect(0, 0, W, H); });
      c.drawImage(v, 0, 0);
    }
  },
};
function imgBox(it, u) { return { x: 16 * u, y: 16 * u, w: it.w - 32 * u, h: it.h - 32 * u }; }   // Image rectangle within print (relative to print top-left)
function drawItem(g, it, t, ctx) {
  const { u } = ctx, q = it.q, w = it.w, h = it.h;
  if (it.kind === 'image') {
    const f = imgBox(it, u), fr = ctx.frame(q, t), cov = q.data && q.data.fit === 'cover', fo = (q.data && q.data.focus) || [0.5, 0.5];
    let src = fr;
    if (q.data && q.data.halftone) { const hs = PAINT.canvas(Math.round(f.w), Math.round(f.h)); MD.cover(hs.getContext('2d'), fr, { x: 0, y: 0, w: hs.width, h: hs.height, fit: cov ? 'cover' : 'contain', fx: fo[0], fy: fo[1] }); src = CL.halftone('clipimg' + it.seed + (q.frames ? '_' + Math.floor((t - q.at) * (q.fps || 30)) : ''), hs, { cell: 5 * u, contrast: 1.25 }); }
    MD.print(g, src, f.w, f.h, { border: 16 * u, fx: fo[0], fy: fo[1], tape: true, key: q.frames ? null : 'y2print' + it.seed });   // Print: white border, aged paper, shadow, tape
    if (q.text) { const fs = TY.fit(g, q.text, w * 0.8, 40 * u, 'PuHui-Heavy', { maxLines: 1, min: 0.5 });   // Lower-left black torn label, 12fps typing
      MD.label(g, q.text, -w / 2 - 14 * u, h / 2 - 34 * u, { t, at: q.at + 0.25, size: fs.size, r: -0.02, bg: C.ink, fg: C.paper }); }
    // Highlight: marker (multiply, on-twos sweep) → red circle
    for (const hq of ctx.of('highlight')) {
      if (!hq.data || !hq.data.rect || hq.at < q.at) continue;
      const own = ctx.of('image', 'clip').filter(z => z.at <= hq.at).pop(); if (own !== q) continue;
      const l = t - hq.at; if (l < -1e-6) continue;
      const R = hq.data.rect, x0 = -w / 2 + f.x + R[0] * f.w, y0 = -h / 2 + f.y + R[1] * f.h, rw = R[2] * f.w, rh = R[3] * f.h;
      CL.highlight(g, x0 - 6 * u, y0 - 4 * u, rw + 12 * u, rh + 8 * u, MO.sineInOut(clamp(ls(t, hq.at) / 0.6)), C.hi);
      const cq = MO.cubicOut(clamp((ls(t, hq.at) - 0.5) / 0.6));
      const newer = ctx.of('highlight').find(z => z.at > hq.at && z.at <= t + 1e-6 && z.data && z.data.rect && ctx.of('image', 'clip').filter(y => y.at <= z.at).pop() === q);
      const fa = newer ? 1 - 0.75 * clamp((t - newer.at) / 0.3) : 1;   // Next region on same image: old circle fades to faint trace to avoid overlaps/offscreen old circles
      if (cq > 0) { const pts = DG.hand(DG.ellipsePts(x0 + rw / 2, y0 + rh / 2, rw * 0.7 + 16 * u, rh * 0.72 + 10 * u, -2.6, 1.08, 44), { amp: 2.2 * u, seed: it.seed }), L = DG.cum(pts);
        g.save(); g.globalAlpha *= fa; g.strokeStyle = C.red; g.lineWidth = 7 * u; g.lineCap = 'round'; g.lineJoin = 'round'; DG.drawPartial(g, pts, L, L[L.length - 1] * cq); g.restore(); }
    }
  } else {
    const n = Math.ceil(ls(t, q.at) * (it.cps || 13)), title = it.kind === 'title';
    CL.shadowed(g, () => { g.fillStyle = title ? C.ink : C.card; g.save(); g.translate(-w / 2, -h / 2); CL.tornRect(g, w, h, it.seed, 3 * u); g.fill(); g.restore(); }, { blur: 10 * u, x: 3 * u, y: 6 * u });
    if (!title) { g.strokeStyle = C.rule; g.lineWidth = 2 * u; for (let y = -h / 2 + 90 * u; y < h / 2; y += it.size * 1.45) { g.beginPath(); g.moveTo(-w / 2, y); g.lineTo(w / 2, y); g.stroke(); }
      g.strokeStyle = C.margin; g.beginPath(); g.moveTo(-w / 2, -h / 2 + 56 * u); g.lineTo(w / 2, -h / 2 + 56 * u); g.stroke(); }
    g.fillStyle = title ? C.paper : C.ink; g.font = `${it.size}px ${title ? BOLD : TXT}`; g.textBaseline = 'alphabetic';
    let k = 0; it.lines.forEach((ln, li) => { let x = -w / 2 + (title ? 40 : 55) * u; const y = -h / 2 + (title ? 25 * u : 70 * u) + (li + 1) * it.size * 1.3;
      for (const ch of ln) { if (k < n) g.fillText(ch, x, y); x += g.measureText(ch).width; k++; } });
  }
}
})();
