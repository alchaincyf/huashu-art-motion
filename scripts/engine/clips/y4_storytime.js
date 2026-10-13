// Clip · storytime character (y4): AI-generated pose library character talks in small room; quick 0.1s pose cuts then holds; humor via reaction close-ups/inserts.
// No slow push, handheld drift, or breathing: holds remain still; changes via cuts, punch-in reactions, inserts.
// data.character (required): pose library; render.py directory (filenames without extension = pose names), or {frames:{rest,talk,point,shrug,type,stiff,react,back,<pose>_open:path}}.
//                 Code-drawn presets ('neutral'/'bun'/'author'/appearance object) disabled; missing frame library fails startup.
//                   Requires rest or talk; missing poses fall back talk → rest; <pose>_open is open-mouth frame (on twos); react close-up, back head foreground for inserts.
//                   Transparent images, feet at bottom center, drawn height ~3.15 head radii. No back frame → no foreground head during inserts.
// cues: point|title (spoken line: bubble/open mouth starts at at; text length drives ~6.5 chars/s speech; data.pose talk/point/shrug/type)
//         Bubble uses sub if present (short ≤12-character phrases best), otherwise text; pipeline subtitles carry voiceover transcript, avoid repeating it in bubble
//       highlight (pop '?'/'!' + worried shrug: data.mark defaults to '？')
//       react (at cuts to extreme close-up, react frame (fallback talk/rest) + sweat, silent; default dur until next cue)
//       insert (at cuts to close-up of room computer screen; sub typed/sent line, then AI reply scrolls increasingly fast as code wall,
//               text = slammed large text (e.g. '3000行'), at data.hit (absolute seconds, default at+1.3, or at+0.4 without sub), screen shake;
//               data.count + data.unit stop upper-right counter at this value on impact; default dur until next cue)
// Room has desk computer (insert zooms into its screen), mug, wall bookshelf/plants; right wall no longer empty.
// Without voiceover envelope, synthesize mouth from text length/time (on twos, 0/1/2 mouths); otherwise pipeline sets window.VO_ENV (TOON.mouth reads automatically).
// safe: bubbles/insert text within top..H−bottom. alpha: omit room, keep character/bubble (white/black); insert only monitor/back head, transparent surroundings.
// spec.theme (film-wide ctx.pal): bg wall, floor/desk bg shaded toward ink/sub, accent/accent2 books/mug/plants, surface bubble/ink text,
//   dark screen (ink/darkened bg); code blocks/counter/impact text use only accent/accent2 shades.
CLIPS.y4_storytime = (() => {
const { clamp, lerp, rng } = U;
// Code-wall syntax colors: no purple/blue-purple
const COLS = ['#E06C75', '#5FB3A1', '#C3E88D', '#F78C6C', '#89DDFF', '#FFCB6B', '#8A9199'];
const C0 = { wall: '#DCE9EC', floor: '#E8DCC8', desk: '#E2C29B', deskSide: '#CDA97F', line: '#5B6470', sky: '#BFE3F5', screen: '#20222D', cloud: '#fff', shelf: '#D9C3A0',
  books: ['#8FB3C9', '#E7A37B', '#B9C98F', '#C9B28F'], pot: '#E7A37B', leaf: '#8DBF8B', stand: '#9AA0AC', bezel: '#2B2D36', mug: '#F26B4F', codes: COLS,
  insertBg: '#15161C', gutter: '#4A4F66', bubble: '#2F3342', sent: '#3B82F6', sentInk: '#fff', bar: '#2A2D3A', dots: ['#FF5F57', '#FEBC2E', '#28C840'], appText: '#9AA3B8', hot: '#FFCB6B',
  slamDim: '10,10,16', fast: '32,34,45', sayBg: '#fff', sayInk: '#1B1B1F', type: '#fff' };
// Film palette → room/screen colors (derived only from 6 keys)
const fromPal = p => { const dk = PAL.dark(p), light = dk ? p.ink : p.surface, screen = dk ? PAL.mix(p.bg, '#000000', 0.35) : PAL.mix(p.ink, p.bg, 0.08);
  return { wall: p.bg, floor: PAL.mix(p.bg, p.ink, 0.07), desk: PAL.mix(p.bg, p.sub, 0.25), deskSide: PAL.mix(p.bg, p.sub, 0.4), line: dk ? PAL.mix(p.sub, p.bg, 0.2) : p.sub,
    sky: PAL.mix(p.bg, p.accent2, 0.3), screen, cloud: PAL.mix(light, PAL.mix(p.bg, p.accent2, 0.3), 0.3), shelf: PAL.mix(p.bg, p.sub, 0.3),
    books: [p.accent, p.accent2, PAL.mix(p.accent, p.bg, 0.45), PAL.mix(p.accent2, p.bg, 0.45)], pot: p.accent, leaf: p.accent2, stand: PAL.mix(p.sub, p.bg, 0.3), bezel: PAL.mix(screen, light, 0.12), mug: p.accent,
    codes: [p.accent, PAL.mix(p.accent2, light, 0.4), PAL.mix(light, p.accent, 0.3), PAL.mix(p.accent2, light, 0.65), PAL.mix(light, screen, 0.45), PAL.mix(p.accent, light, 0.5), PAL.mix(light, screen, 0.65)],   // Visible on dark screen: brighten accent2
    insertBg: dk ? PAL.mix(p.bg, '#000000', 0.55) : PAL.mix(p.ink, '#000000', 0.25), gutter: PAL.mix(screen, light, 0.25), bubble: PAL.mix(screen, light, 0.15), sent: p.accent2,
    sentInk: PAL.on(p.accent2, [p.surface, p.ink, p.bg]), bar: PAL.mix(screen, light, 0.08), dots: [p.accent, PAL.mix(light, screen, 0.5), p.accent2], appText: PAL.mix(light, screen, 0.4), hot: p.accent,
    slamDim: PAL.rgb(screen).join(','), fast: PAL.rgb(screen).join(','), sayBg: p.surface, sayInk: p.ink, type: light }; };
const LINES = (() => { const r = rng(42), out = []; let ind = 0;   // Blocks store color indices; resolve via C.codes when drawing
  for (let i = 0; i < 400; i++) { if (r() < 0.18) ind = Math.min(4, ind + 1); else if (r() < 0.2) ind = Math.max(0, ind - 1);
    const toks = []; let x = ind * 34; const n = 1 + (r() * 4 | 0); for (let k = 0; k < n; k++) { const w = 30 + r() * 150; toks.push([x, w, (r() * COLS.length) | 0]); x += w + 14; } out.push(toks); } return out; })();
const NEED_FRAMES = 'y4 需要角色帧库 data.character.frames（AI 生帧，见 references/10-角色.md）；代码画的小人已停用。没有生图能力就别用 y4：用 y2/y5 或 scenes 里用手、物件、背影讲故事。';
let keys, says, L, shots, FR, C = C0;
return {
  fonts: ['PuHui-Bold', 'PuHui-Black'],
  safe: true,
  init(ctx) {
    const { W, H, u } = ctx, ch = ctx.data.character;
    C = ctx.pal ? fromPal(ctx.pal) : C0;
    // Character requires frame library (object.frames, loaded by clip.js; missing images fail startup). Missing library/preset name → startup failure
    if (!ch || typeof ch !== 'object' || !ch.frames || typeof ch.frames !== 'object') throw new Error(NEED_FRAMES + (ch != null ? `（收到的 data.character = ${JSON.stringify(ch)}）` : '（spec 里没写 data.character）'));
    FR = Object.fromEntries(Object.entries(ch.frames).map(([k, v]) => [k, ctx.IMG[v]]));
    if (!FR.rest && !FR.talk) throw new Error('y4 data.character.frames 至少要有 rest 或 talk 一张（现有：' + Object.keys(FR).join(' ') + '）');
    L = { cx: ctx.portrait ? W * 0.42 : W * 0.3, fy: ctx.portrait ? H * 0.8 : H * 1.02, R: (ctx.portrait ? 230 : 215) * u };
    L.dy = L.fy - L.R * 0.55;                                             // Desktop height
    L.mon = ctx.portrait ? { x: W * 0.66, w: 330 * u, h: 240 * u } : { x: W * 0.6, w: 520 * u, h: 340 * u };   // Desk computer (screen top-left x, width/height)
    says = ctx.of('point', 'title').map(q => ({ q, end: q.at + Math.max(0.6, [...(q.text || '')].length / 6.5) }));
    keys = [[0, 'rest', 'happy']]; let n = 0;
    for (const q of ctx.cues) {
      if (q.kind === 'point' || q.kind === 'title') keys.push([q.at, (q.data && q.data.pose) || (n++ % 2 ? 'point' : 'talk'), 'talk']);
      if (q.kind === 'highlight') keys.push([q.at, 'shrug', 'worry']);
      if (q.kind === 'react' || q.kind === 'insert') keys.push([q.at, 'stiff', 'blank']);
    }
    // Close-up intervals (react/insert)
    shots = ctx.of('react', 'insert').map(q => { const nx = ctx.cues.find(z => z.at > q.at + 1e-6); const end = q.dur ? q.at + q.dur : nx ? nx.at : ctx.dur + 1;
      const hit = q.kind === 'insert' ? (q.data && q.data.hit != null ? +q.data.hit : q.at + (q.sub ? 1.3 : 0.4)) : 0; return { q, end, hit }; });
  },
  draw(c, t, ctx) {
    const { W, H, u } = ctx, ts = MO.step(t, 24);                         // Character 24fps, camera 60fps
    const shot = shots.find(s => t >= s.q.at - 1e-6 && t < s.end);
    if (shot && shot.q.kind === 'insert') return insert(c, t, ctx, shot);
    const inReact = !!shot;
    // Camera: hold medium shot; reaction jumps same angle to 1.9× close-up (smash: springs from 2.2 for first 0.3s, then holds)
    let z = 1, cy = L.fy - L.R * 1.6;
    if (inReact) { const l = t - shot.q.at; z = 1.9 * (1 + 0.15 * Math.max(0, 1 - MO.springHz(l, 3, 11))); cy = L.fy - L.R * 2.2; }
    if (!ctx.alpha) { c.fillStyle = C.wall; c.fillRect(0, 0, W, H); }
    CAM.with(c, { x: inReact ? L.cx : W / 2, y: inReact ? cy : H / 2, z }, g => {
      if (!ctx.alpha) room(g, t, ctx);
      const st = TOON.poseAt(keys, ts), say = says.find(s => t >= s.q.at - 1e-6 && t < s.end);
      const mouth = window.VO_ENV ? TOON.mouth(t) : say ? [1, 2, 1, 0, 2, 1][Math.floor(MO.step(t - say.q.at + 1e-6, 12) * 12) % 6] : 0;
      const info = frameChar(g, ts, st, inReact, mouth);
      if (!ctx.alpha) desk(g, t, ctx);
      if (inReact) { const sw = clamp((t - shot.q.at - 0.3) / 0.9); if (sw > 0) TOON.sweat(g, L.cx + L.R * 0.88, info.head[1] - L.R * 0.1, 30 * u, MO.expoOut(sw) * 0.6 + sw * 0.4); }
      for (const h of ctx.of('highlight')) { const l = ctx.lt(t, h.at); if (l <= 0) continue;
        g.save(); g.translate(info.head[0] + L.R * 1.35, info.head[1] - L.R * 0.6); g.rotate(0.14 + MO.settle(l, 0.12, 3, 6)); TOON.mark(g, (h.data && h.data.mark) || '？', 0, 0, clamp(l / 0.26), 130 * u, C === C0 ? undefined : ctx.pal.accent); g.restore(); }
    });
    // Speech bubble (screen space, independent of camera): pops at at, hides 0.6s after speech; returning from close-up does not restore old line
    if (!inReact) for (const s of says) {
      const l = ctx.lt(t, s.q.at), out = clamp((t - s.end - 0.6) / 0.2); if (l <= 0 || out >= 1) continue;
      const nx = says[says.indexOf(s) + 1]; if (nx && t >= nx.q.at - 1e-6) continue;
      if (shots.some(sh => sh.q.at > s.q.at && sh.q.at <= t)) continue;
      const txt = s.q.sub || s.q.text || '';
      const bw0 = ctx.portrait ? W * 0.84 : W * 0.42, f = TY.fit(c, txt, bw0 - 80 * u, (ctx.portrait ? 64 : 62) * u, 'PuHui-Bold', { maxLines: 2, min: 0.72, balance: true });
      c.font = `${f.size}px "PuHui-Bold"`; const bw = Math.min(bw0, Math.max(...f.lines.map(x => c.measureText(x).width)) + 80 * u);
      const bh = f.lines.length * f.size * 1.3 + 56 * u, bx = ctx.portrait ? (W - bw) / 2 : W * 0.5, by = ctx.safe.top + (ctx.portrait ? H * 0.06 : H * 0.09);
      const sc = MO.backOut(clamp(l / 0.25), 2.2) * (1 - out);
      c.save(); c.translate(bx + 60 * u, by + bh); c.scale(sc, sc); c.translate(-(bx + 60 * u), -(by + bh));
      c.fillStyle = C.sayBg; c.strokeStyle = C.sayInk; c.lineWidth = 6 * u; c.lineJoin = 'round';
      c.beginPath(); c.roundRect(bx, by, bw, bh, 40 * u); c.moveTo(bx + 70 * u, by + bh); c.lineTo(bx + (ctx.portrait ? 40 : 10) * u, by + bh + 60 * u); c.lineTo(bx + 130 * u, by + bh); c.fill(); c.stroke();
      c.fillStyle = C.sayBg; c.fillRect(bx + 76 * u, by + bh - 8 * u, 50 * u, 12 * u);
      c.fillStyle = C.sayInk; c.textBaseline = 'alphabetic';
      f.lines.forEach((ln, i) => c.fillText(ln, bx + 40 * u, by + 26 * u + (i + 1) * f.size * 1.2));
      c.restore();
    }
  },
};
// Frame character: current pose (fallback talk→rest); mouth alternates <pose>_open on twos; pose changes retain poseAt squash/rebound
function frameChar(g, ts, st, inReact, mouth) {
  let name = 'rest'; for (const k of keys) if (ts >= k[0]) name = k[1];
  if (inReact) name = 'react';
  const pick = n => FR[n] || FR.talk || FR.rest;
  const im = (!inReact && mouth && FR[name + '_open']) || pick(name), [iw, ih] = MD.size(im), h = L.R * 3.15, w = iw * h / ih;
  g.save(); g.translate(L.cx, L.fy); g.scale(1 / Math.sqrt(st.squash), st.squash); g.drawImage(im, -w / 2, -h, w, h); g.restore();
  return { head: [L.cx, L.fy - h * 0.78], hl: [L.cx - w * 0.4, L.fy - h * 0.45], hr: [L.cx + w * 0.4, L.fy - h * 0.45] };
}
// Room: wall/floor/window (slow clouds)/bookshelf/frame. No caching static objects; clips short enough to afford redraw
function room(g, t, ctx) {
  const { W, H, u } = ctx, X0 = -W, Y0 = -H, fy = L.fy;
  g.fillStyle = C.wall; g.fillRect(X0, Y0, W * 3, H * 3);
  g.fillStyle = C.floor; g.fillRect(X0, fy + 10 * u, W * 3, H * 2);
  g.lineWidth = 3 * u; g.strokeStyle = C.line; g.lineJoin = 'round'; g.beginPath(); g.moveTo(X0, fy + 10 * u); g.lineTo(X0 + W * 3, fy + 10 * u); g.stroke();
  // Window: sky + slow clouds
  const wx = ctx.portrait ? W * 0.08 : W * 0.05, wy = ctx.portrait ? H * 0.2 : H * 0.12, ww = ctx.portrait ? W * 0.3 : W * 0.17, wh = ww * 0.7;
  g.save(); g.beginPath(); g.roundRect(wx, wy, ww, wh, 12 * u); g.clip(); g.fillStyle = C.sky; g.fillRect(wx, wy, ww, wh);
  for (const [k, r, sp] of [[0.2, 46, 18], [0.7, 34, 12]]) { const x = wx - 60 * u + ((k * ww + t * sp * u) % (ww + 120 * u)), y = wy + wh * (0.35 + k * 0.3); g.fillStyle = C.cloud; g.beginPath(); g.arc(x, y, r * u, 0, 7); g.arc(x + r * 0.9 * u, y + 6 * u, r * 0.75 * u, 0, 7); g.arc(x - r * 0.9 * u, y + 8 * u, r * 0.65 * u, 0, 7); g.fill(); }
  g.restore(); g.strokeStyle = C.line; g.beginPath(); g.roundRect(wx, wy, ww, wh, 12 * u); g.moveTo(wx + ww / 2, wy); g.lineTo(wx + ww / 2, wy + wh); g.moveTo(wx, wy + wh / 2); g.lineTo(wx + ww, wy + wh / 2); g.stroke();
  // Wall: bookshelf right in landscape; below-right of window in portrait
  const r = rng(9), sx = ctx.portrait ? W * 0.62 : W * 0.68, sy = ctx.portrait ? H * 0.3 : H * 0.36, sw = ctx.portrait ? W * 0.3 : W * 0.22;
  g.fillStyle = C.shelf; g.fillRect(sx, sy, sw, 16 * u); g.strokeRect(sx, sy, sw, 16 * u);
  let x = sx + 16 * u; while (x < sx + sw * 0.7) { const w = (22 + r() * 22) * u, h = (70 + r() * 40) * u; g.fillStyle = C.books[(r() * 4) | 0]; g.fillRect(x, sy - h, w, h); g.strokeRect(x, sy - h, w, h); x += w + 5 * u; }
  g.fillStyle = C.pot; const px = sx + sw * 0.83; g.beginPath(); g.moveTo(px - 30 * u, sy); g.lineTo(px - 38 * u, sy - 56 * u); g.lineTo(px + 38 * u, sy - 56 * u); g.lineTo(px + 30 * u, sy); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = C.leaf; for (const [dx, a] of [[-18, -0.5], [0, 0], [18, 0.5]]) { g.beginPath(); g.ellipse(px + dx * u, sy - 100 * u, 16 * u, 46 * u, a, 0, 7); g.fill(); g.stroke(); }
}
// Desk occludes waist (character strokes darkest/thickest, background thin/gray); desk computer/mug
function desk(g, t, ctx) {
  const { W, H, u } = ctx, X0 = -W, dy = L.dy; g.lineWidth = 3 * u; g.strokeStyle = C.line;
  // Computer: faint glowing screen with scrolling code blocks (insert cuts into it)
  const M = L.mon, mx = M.x, my = dy - M.h - 60 * u;
  g.fillStyle = C.stand; g.fillRect(mx + M.w / 2 - 18 * u, dy - 62 * u, 36 * u, 62 * u); g.strokeRect(mx + M.w / 2 - 18 * u, dy - 62 * u, 36 * u, 62 * u);
  g.beginPath(); g.ellipse(mx + M.w / 2, dy, 90 * u, 10 * u, 0, 0, 7); g.fill(); g.stroke();
  g.fillStyle = C.bezel; g.beginPath(); g.roundRect(mx, my, M.w, M.h, 16 * u); g.fill(); g.stroke();
  g.save(); g.beginPath(); g.roundRect(mx + 14 * u, my + 14 * u, M.w - 28 * u, M.h - 28 * u, 6 * u); g.clip(); g.fillStyle = C.screen; g.fillRect(mx, my, M.w, M.h);
  const lh = 22 * u, off = (t * 30 * u) % lh; for (let i = 0; i < 20; i++) { const y = my + 30 * u + i * lh - off; for (const [x, w, col] of LINES[i % LINES.length]) { g.fillStyle = C.codes[col % C.codes.length]; g.globalAlpha = 0.75; g.fillRect(mx + 26 * u + x * 0.3 * u, y, w * 0.3 * u, 8 * u); } }
  g.restore(); g.globalAlpha = 1;
  g.fillStyle = C.desk; g.fillRect(X0, dy, W * 3, 40 * u); g.strokeRect(X0, dy, W * 3, 40 * u);
  g.fillStyle = C.deskSide; g.fillRect(X0, dy + 40 * u, W * 3, H); g.strokeRect(X0, dy + 40 * u, W * 3, H);
  // Mug
  const cx = ctx.portrait ? W * 0.1 : L.cx - L.R * 1.9; g.fillStyle = C.mug; g.beginPath(); g.roundRect(cx, dy - 92 * u, 70 * u, 92 * u, 10 * u); g.fill(); g.stroke();
  g.beginPath(); g.arc(cx + 78 * u, dy - 52 * u, 22 * u, -1.2, 1.2); g.lineWidth = 9 * u; g.stroke(); g.lineWidth = 3 * u;
}
// Insert: over-shoulder computer close-up, type→send→accelerating code wall→large text slam/shake (same as demo s2_screen)
function insert(c, t, ctx, shot) {
  const { W, H, u, safe } = ctx, q = shot.q, d = q.data || {}, t0 = q.at, msg = q.sub || '', T_SEND = t0 + (msg ? 0.1 + Math.min(0.9, [...msg].length / 14) + 0.1 : 0.05), T_HIT = Math.max(shot.hit, T_SEND + 0.2);
  const lt = t - t0, slam = t - T_HIT;
  const scrollAt = tt => { const k = Math.max(0, tt - T_SEND - 0.15), span = Math.max(0.3, T_HIT - T_SEND - 0.15); return 46 * u * (k * 6 + Math.pow(k / span * 1.8, 3) * 6); };
  const shake = slam > 0 && slam < 0.3 ? MO.settle(slam, 14 * u, 9, 14) : 0;
  const zoom = 1.06 - 0.06 * MO.expoOut(clamp(lt / 0.25)) + (slam > 0 ? 0.04 * MO.expoOut(clamp(slam / 0.12)) : 0);   // Entry: settle 1.06→1 (brief push); impact pushes another step, then holds
  if (!ctx.alpha) { c.fillStyle = C.insertBg; c.fillRect(0, 0, W, H); }   // Transparent mode: only monitor/back head; voiceover footage visible around them
  const bx = W * 0.06, by = safe.top + H * 0.05, bw = W * 0.88, bh = H - safe.bottom - by - H * (ctx.portrait ? 0.2 : 0.06);
  CAM.with(c, { x: W / 2 + shake, y: H / 2 - shake * 0.5, z: zoom }, c => {
    c.fillStyle = C.bezel; c.beginPath(); c.roundRect(bx, by, bw, bh, 34 * u); c.fill();
    const sx = bx + 40 * u, sy = by + 40 * u, sw = bw - 80 * u, sh = bh - 80 * u;
    c.save(); c.beginPath(); c.roundRect(sx, sy, sw, sh, 14 * u); c.clip(); c.fillStyle = C.screen; c.fillRect(sx, sy, sw, sh);
    const scr = scrollAt(t), top = sy + 64 * u;
    // User line: right bubble, typing/blinking cursor; blue after sending
    if (msg) { const bubY = top + 110 * u - Math.min(scr, 600 * u), p = clamp((t - t0 - 0.1) / Math.max(0.2, T_SEND - t0 - 0.2));
      const mf = TY.fit(c, msg, sw * 0.7 - 60 * u, (ctx.portrait ? 44 : 40) * u, 'PuHui-Bold', { maxLines: 3, min: 0.75, balance: true }), fs = mf.size, lh = fs * 1.3;   // Wrap long lines (max 3), bubble grows downward
      const bwid = Math.max(...mf.lines.map(l => TY.width(c, l, fs, 'PuHui-Bold'))) + 60 * u, bht = 78 * u + (mf.lines.length - 1) * lh;
      if (bubY > sy) { c.fillStyle = t >= T_SEND ? C.sent : C.bubble; c.beginPath(); c.roundRect(sx + sw - 30 * u - bwid, bubY - 52 * u, bwid, bht, 24 * u); c.fill();
        let left = Math.round(p * mf.lines.reduce((a, l) => a + [...l].length, 0));   // Type line by line, cursor follows latest line
        const ns = mf.lines.map(ln => { const n = Math.min(left, [...ln].length); left -= n; return n; }), curK = Math.max(0, ns.findLastIndex(n => n > 0)), blink = t < T_SEND && Math.floor(t * 4) % 2;
        mf.lines.forEach((ln, k) => { if (k > curK) return;
          TY.text(c, [...ln].slice(0, ns[k]).join('') + (blink && k === curK ? '|' : ''), sx + sw - 30 * u - bwid + 30 * u, bubY + 2 * u + k * lh, { size: fs, fam: 'PuHui-Bold', color: t >= T_SEND ? C.sentInk : C.type, align: 'left' }); }); } }
    // AI reply: accelerating code wall
    if (t > T_SEND + 0.05) { const lh = 46 * u, y0 = top + (msg ? 220 : 40) * u - scr;
      for (let i = Math.max(0, Math.floor((top - y0) / lh)); ; i++) { const y = y0 + i * lh; if (y > sy + sh) break; if (y < top) continue;
        const shown = clamp((t - T_SEND - 0.05 - Math.min(i, 12) * 0.03) / 0.05); if (shown <= 0) continue;
        c.fillStyle = C.gutter; c.fillRect(sx + 30 * u, y - 12 * u, 44 * u, 16 * u);
        for (const [x, w, col] of LINES[i % LINES.length]) { c.fillStyle = C.codes[col % C.codes.length]; c.globalAlpha = 0.9; c.beginPath(); c.roundRect(sx + 110 * u + x * u, y - 14 * u, w * u * shown, 20 * u, 10 * u); c.fill(); } c.globalAlpha = 1; }
      const v = (scrollAt(t + 1 / 60) - scr) * 60; if (v > 1500 * u) { c.fillStyle = `rgba(${C.fast},${clamp((v - 1500 * u) / (6000 * u)) * 0.5})`; c.fillRect(sx, top, sw, sh); } }
    // Top bar: three dots/title/counter (stops at data.count on impact)
    c.fillStyle = C.bar; c.fillRect(sx, sy, sw, 64 * u);
    C.dots.forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(sx + 42 * u + i * 34 * u, sy + 32 * u, 10 * u, 0, 7); c.fill(); });
    TY.text(c, d.app || 'AI助手', sx + sw / 2, sy + 44 * u, { size: 30 * u, fam: 'PuHui-Bold', color: C.appText });
    if (d.count != null && t > T_SEND + 0.1) { const N = +d.count, k = slam >= 0 ? N : Math.min(N - 1, Math.floor(Math.pow(clamp((t - T_SEND - 0.15) / Math.max(0.2, T_HIT - T_SEND - 0.15)), 2.4) * (N - 1)));
      TY.text(c, `${k}${d.unit || ''}`, sx + sw - 30 * u, sy + 44 * u, { size: 32 * u, fam: 'PuHui-Bold', color: slam >= 0 ? C.hot : C.appText, align: 'right' }); }
    // Large text impact (backOut overshoot) + dimming
    if (slam > 0 && q.text) { c.fillStyle = `rgba(${C.slamDim},${0.6 * MO.expoOut(clamp(slam / 0.15))})`; c.fillRect(sx, sy, sw, sh);
      const fs = TY.fit(c, q.text, sw * 0.86, (ctx.portrait ? 200 : 230) * u, 'PuHui-Black', { maxLines: 2, min: 0.4, balance: true });
      fs.lines.forEach((ln, i) => TY.pop(c, ln, sx + sw / 2, sy + sh / 2 + fs.size * 0.35 + (i - (fs.lines.length - 1) / 2) * fs.size * 1.1, clamp(slam / 0.24), { size: fs.size, fam: 'PuHui-Black', color: C.hot, over: 3.5, stroke: C.insertBg, strokeW: 18 * u })); }
    c.restore();
  });
  // Foreground: back frame shows head from behind, held still; recoils on impact. No back frame → omit (no code-drawn head)
  const hx = W * (ctx.portrait ? 0.2 : 0.17), hy = by + bh - 60 * u + (slam > 0 ? -MO.settle(slam, 18 * u, 4, 7) : 0), s = (ctx.portrait ? 0.8 : 0.75) * u;
  if (FR.back) { const [iw, ih] = MD.size(FR.back), h = 560 * s, w = iw * h / ih; c.drawImage(FR.back, hx - w / 2, hy + 500 * s - h, w, h); }
}
})();
