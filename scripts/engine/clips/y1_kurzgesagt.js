// 片段 · Kurzgesagt 式扁平科普（y1）：深靛紫夜空、发光的扁平中心物＝要讲的那个概念；每个要点是一颗卫星节点，
// 带标签胶囊弹出（过冲 108%）、信号沿连线流动。环境层（星闪、粒子、信号脉冲）一直轻轻动；中心物、节点、标签落定后停住，
// 相机不慢推：只在 highlight 这一刻快推 0.28s（推近约 30%）、连着的 highlight 同倍率横移 0.30s，然后停住。
// 招牌是尺度穿行：enter 让相机对数推进一颗卫星，推到它的颜色填满整屏，再从同色的新中心物里拉出来——「里面是什么」。
// cues：title（顶部标题逐字上浮；text）· point（当前这一层的一个卫星节点＋标签：text；data.color 换强调色）
//       highlight（相机推近第 data.index 个节点（只数当前这一层的 point，从 0 起；默认最新），其余节点和标签变暗；1.2s 推完）
//       enter（钻进第 data.index 个节点（默认最新）：推进→满屏同色→从新的中心物拉出；text = 新中心的名字（默认用那个节点的名字）；
//              之后的 point 都是新这一层的卫星；dur 默认 1.6s，at 这一帧开始推）
// data.center：第一层中心物的名字。data.center_style：{ color, shape: 'circle'|'rounded'|'hex'|'diamond', ring: true（加一道轨道环）}，
//   不写就按名字生成一个中性样式（颜色、形状由文字决定，同名同样式；没有轨道环）。data.image：中心物里放一张图（截图、照片，按形状裁），名字改到下方胶囊里。
//   新一层（enter 钻进去的）中心物用那个节点的颜色，形状同样按名字生成；enter 的 data.style 可覆盖。
// data.flow:true：节点按顺序串成一条链（中心→1→2→3），信号依次流过，节点带序号——讲「先后」时用。
// 节点排法横竖屏一致：≤3 个排在上半圈（从左到右），≥4 个绕一整圈（从左边起顺时针）。safe：版面只排在 top..H−bottom 之间。
CLIPS.y1_kurzgesagt = (() => {
const { clamp, lerp, rng } = U;
const P = { sky: ['#05020F', '#0E0631', '#2a1a6e'], star: '#F9FCFB', line: 'rgba(125,211,220,.35)', pulse: '#32BAEE' };
const ACC = ['#32BAEE', '#FACC12', '#BE3A95', '#5CD0B3', '#FC6255', '#8A6CF0'];
// 中心物的中性样式：按名字哈希取色和形状（同名同样式），没有轨道环
const CPAL = ['#4F86C6', '#3FA796', '#8A6CF0', '#D9667A', '#5BA4CF', '#6FAF5A'], SHAPES = ['circle', 'rounded', 'hex'];
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
    flow = !!ctx.data.flow;
    const y0 = safe.top + (ctx.of('title').length ? (ctx.portrait ? 300 : 210) * u : 60 * u), y1 = H - safe.bottom - 40 * u;
    const R = (ctx.portrait ? 160 : 140) * u, cx = W / 2, cy = (y0 + y1) / 2 + (ctx.portrait ? 0 : 30 * u);
    S = { cx, cy, R, stars: Array.from({ length: 160 }, () => ({ x: r() * W * 1.4 - W * 0.2, y: r() * H * 1.4 - H * 0.2, r: (0.8 + r() * r() * 3) * u, ph: r() * 6.28, sp: 1 + r() * 2.5 })),
      motes: Array.from({ length: 24 }, () => ({ x: r() * W, y: r() * H, ph: r() * 6.28, d: 0.8 + r() * 0.5, s: (2 + r() * 3) * u })) };
    // 分层：enter 把后面的 point 放进新的一层
    const cs0 = styleFor(ctx.data.center || '', ctx.data.center_style || {});
    levels = [{ start: 0, center: ctx.data.center || '', col: cs0.color, style: cs0, img: ctx.data.image ? ctx.IMG[ctx.data.image] : null, pts: [], hls: [] }];
    for (const q of ctx.cues) {
      const L = levels[levels.length - 1];
      if (q.kind === 'point') L.pts.push(q);
      else if (q.kind === 'highlight') L.hls.push(q);
      else if (q.kind === 'enter') { const D = q.dur || 1.6; L.exit = { q, at: q.at, D, sw: q.at + D * 0.55, idx: q.data && q.data.index };
        levels.push({ start: q.at + D * 0.55, end0: q.at + D, center: '', col: null, pts: [], hls: [], from: L }); }
    }
    // 每层的节点位置（横竖屏同一套角度：≤3 上半圈左→右，≥4 从左边起顺时针一整圈）
    const lab = 46 * u + 70 * u + 45 * u;                               // 节点半径＋标签偏移＋半个标签高：最下面的标签也要在 y1 之内
    const rx = ctx.portrait ? W * 0.34 : Math.min(W * 0.32, 640 * u), ryHalf = Math.min(y1 - y0, H) * (ctx.portrait ? 0.3 : 0.42), ryRing = Math.min((y1 - y0) * (ctx.portrait ? 0.34 : 0.36), y1 - cy - lab, cy - y0 - 60 * u);
    levels.forEach((L, li) => {
      const n = L.pts.length, ring = n >= 4;
      L.nodes = L.pts.map((q, i) => { const ang = ring ? Math.PI + i / n * Math.PI * 2 : Math.PI + (i + 0.5) / n * Math.PI;
        const ry = ring ? ryRing : ryHalf; return { q, i, x: cx + Math.cos(ang) * rx, y: cy + Math.sin(ang) * ry, col: (q.data && q.data.color) || ACC[(i + li * 2) % ACC.length] }; });
      if (L.exit) { const nd = L.exit.idx != null ? L.nodes[L.exit.idx] : L.nodes.filter(z => z.q.at <= L.exit.at).pop() || L.nodes[L.nodes.length - 1];
        L.exit.node = nd; const N = levels[li + 1]; N.col = nd ? nd.col : ACC[0]; N.center = L.exit.q.text || (nd && nd.q.text) || '';
        N.style = styleFor(N.center, (L.exit.q.data && L.exit.q.data.style) || {}, N.col); N.col = N.style.color; }
      // 本层的镜头：停住；highlight 这一刻快推 0.28s 到节点（推近约 30%，目标点往中心物偏一点，中心不被裁掉太多），
      // 已经推近时下一次 highlight 同倍率横移 0.30s 到新节点；之后停住
      const Z = ctx.portrait ? 1.28 : 1.32; L.events = []; let zoomed = false;
      for (const h of L.hls) {
        const nd = h.data && h.data.index != null ? L.nodes[h.data.index] : L.nodes.filter(z => z.q.at <= h.at).pop(); if (!nd) continue;
        L.events.push(zoomed ? { at: h.at, kind: 'pan', x: lerp(nd.x, cx, 0.35), y: lerp(nd.y, cy, 0.35) } : { at: h.at, kind: 'to', x: lerp(nd.x, cx, 0.35), y: lerp(nd.y, cy, 0.35), z: Z });
        zoomed = true; h.node = nd;
      }
    });
  },
  draw(c, t, ctx) {
    const { W, H, u } = ctx;
    // 当前层：过了切换点就是新的一层；切换点 ±0.05s 两层交叉溶解（两边都是满屏同一种颜色，剪点看不见）
    let k = 0; levels.forEach((L, i) => { if (i > 0 && t >= L.start) k = i; });
    drawLevel(c, k, t, ctx);
    const L = levels[k], ex = L.exit;
    if (ex && t > ex.sw - 0.05 && t < ex.sw) { const buf = UI.scratch('clip_y1x', W, H), g = buf.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
      drawLevel(g, k + 1, t, ctx); c.save(); c.globalAlpha = (t - (ex.sw - 0.05)) / 0.1; c.drawImage(buf, 0, 0); c.restore(); }
    // 标题：逐字上浮（屏幕层，不跟相机）；第一次 highlight / enter 时淡出
    const qt = ctx.of('title')[0];
    if (qt) { const nx = ctx.of('highlight', 'enter')[0], out = nx ? 1 - MO.sineInOut(clamp((t - nx.at) / 0.5)) : 1;
      if (out > 0) { c.save(); c.globalAlpha = out; const fs = TY.fit(c, qt.text || '', W * 0.88, (ctx.portrait ? 84 : 76) * u, 'PuHui-Heavy', { maxLines: 2, balance: true });
        fs.lines.forEach((ln, i) => TY.charsIn(c, ln, W / 2, ctx.safe.top + (ctx.portrait ? 200 : 130) * u + i * fs.size * 1.2, ctx.lt(t, qt.at) - i * 0.2, { font: `${fs.size}px "PuHui-Heavy"`, color: '#fff', dur: 0.5, stagger: 0.045, dy: 30 * u, align: 'center', shadow: { color: 'rgba(10,8,40,.6)', y: 6 * u, blur: ctx.alpha ? 14 * u : 0 } }));
        c.restore(); } }
  },
};
// 相机：本层的脉冲镜头；正在钻出去 → 推进那个节点到满屏；刚钻进来 → 从满屏的中心物拉出
function camAt(L, t, ctx) {
  const { W, H } = ctx;
  if (L.from && t < L.end0) {                                            // 拉出：z 从「中心物盖满屏」对数降到 1，中心物从屏幕中心回到它的位置
    const e = MO.cubicInOut(clamp((t - L.start) / (L.end0 - L.start))), Z = CAM.coverZoom(S.R * 0.84) * 1.15;   // 0.84：菱形、六边形的内切圆比 R 小，也要盖满屏
    return CAM.anchor(S.cx, S.cy, CAM.zlerp(Z, 1, e), lerp(W / 2, S.cx, e), lerp(H / 2, S.cy, e));
  }
  const ex = L.exit;
  if (ex && t >= ex.at && ex.node) {                                      // 推进：对数缩放，节点平滑移到画面中心，推到它的圆盖满屏
    const base = CAM.track({}, L.events, ex.at), e = MO.cubicIn(clamp((t - ex.at) / (ex.sw - ex.at)) ) * 0.5 + MO.cubicInOut(clamp((t - ex.at) / (ex.sw - ex.at))) * 0.5;
    return CAM.pushTo(base, ex.node.x, ex.node.y, CAM.coverZoom(46 * ctx.u) * 1.2, e, e);
  }
  return CAM.track({}, L.events, t);
}
function drawLevel(c, k, t, ctx) {
  const { W, H, u } = ctx, L = levels[k], cam = camAt(L, t, ctx), { cx, cy, R } = S;
  if (!ctx.alpha) {
    c.fillStyle = TOON.vgrad(c, 0, H, P.sky); c.fillRect(0, 0, W, H);
    CAM.layer(c, cam, 0.05, g => { for (const s of S.stars) { g.globalAlpha = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph)); g.fillStyle = P.star; g.beginPath(); g.arc(s.x, s.y, s.r, 0, 7); g.fill(); } g.globalAlpha = 1; });
  }
  // highlight 生效时：被推近的节点亮，其余节点和标签暗下去
  const hNow = [...L.hls].reverse().find(h => t >= h.at && h.node), dimK = hNow ? MO.smooth(clamp((t - hNow.at) / 0.6)) : 0;
  const col = L.col, st = L.style, pull = L.from && t < L.end0 ? MO.smooth(clamp(((t - L.start) / (L.end0 - L.start) - 0.45) / 0.45)) : 1;   // 刚钻进来：先是满屏纯色，名字和环在拉出后半段才出来
  CAM.layer(c, cam, 1, g => {
    // 连线＋信号脉冲（flow：中心→1→2→3 串成链，信号依次流过）
    L.nodes.forEach((nd, i) => {
      const l = ctx.lt(t, nd.q.at); if (l <= 0) return;
      const from = flow && i > 0 ? L.nodes[i - 1] : { x: cx, y: cy }, p = MO.cubicOut(clamp(l / 0.4)), ex = lerp(from.x, nd.x, p), ey = lerp(from.y, nd.y, p);
      g.save(); g.globalAlpha = 1 - 0.6 * dimK * (hNow && hNow.node === nd ? 0 : 1);
      g.strokeStyle = P.line; g.lineWidth = 4 * u; g.beginPath(); g.moveTo(from.x, from.y); g.lineTo(ex, ey); g.stroke();
      if (flow && l > 0.4) { const ax = lerp(from.x, nd.x, 0.55), ay = lerp(from.y, nd.y, 0.55), a = Math.atan2(nd.y - from.y, nd.x - from.x); g.fillStyle = 'rgba(125,211,220,.7)'; g.translate(ax, ay); g.rotate(a); g.beginPath(); g.moveTo(10 * u, 0); g.lineTo(-8 * u, -9 * u); g.lineTo(-8 * u, 9 * u); g.closePath(); g.fill(); }
      g.restore();
      for (let kk = 0; kk < 3; kk++) { if (l < 0.4) break; const q = flow ? ((t * 0.7 - i * 0.33 + kk / 3) % 1 + 1) % 1 : ((l * 0.8 + kk / 3) % 1); const x = lerp(from.x, nd.x, q), y = lerp(from.y, nd.y, q); TOON.glow(g, x, y, 20 * u, P.pulse, 0.6 * (1 - 0.7 * dimK)); g.fillStyle = '#e9fdff'; g.beginPath(); g.arc(x, y, 5 * u, 0, 7); g.fill(); }
    });
    // 中心物：双色分面＋柔光（形状、颜色来自 data.center_style 或按名字生成）；可选轨道环；有 data.image 就把图裁进形状里
    const shape = shapePath(st.shape, cx, cy, R);
    TOON.glow(g, cx, cy, R * 2.4, light(col), 0.28);
    TOON.flat(g, shape, col, dark(col), light(col), [-18 * u, 14 * u], [-6 * u, 5 * u]);
    if (L.img) { g.save(); g.clip(shapePath(st.shape, cx, cy, R * 0.9)); MD.cover(g, L.img, { x: cx - R, y: cy - R, w: 2 * R, h: 2 * R }); g.restore(); }
    if (st.ring) { g.save(); g.globalAlpha = pull; g.strokeStyle = 'rgba(255,230,190,.55)'; g.lineWidth = 6 * u; g.beginPath(); g.ellipse(cx, cy, R * 1.55, R * 0.35, -0.25, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); g.restore(); }
    if (L.center && !L.img) { const f = TY.fit(g, L.center, R * 1.7, 56 * u, 'PuHui-Heavy', { maxLines: 2, min: 0.5, balance: true });   // 名字放进中心物里：先缩字号，再折两行
      g.save(); g.globalAlpha = pull; g.font = `${f.size}px "PuHui-Heavy"`; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      f.lines.forEach((ln, i) => g.fillText(ln, cx, cy + (i - (f.lines.length - 1) / 2) * f.size * 1.1)); g.restore(); }
    else if (L.center) { const f = TY.fit(g, L.center, R * 3, 44 * u, 'PuHui-Heavy', { maxLines: 1, min: 0.6 });   // 有图：名字放到下方白胶囊里
      g.save(); g.globalAlpha = pull; g.font = `${f.size}px "PuHui-Heavy"`; const tw = g.measureText(f.lines[0] || '').width, bw = tw + 56 * u, bh = f.size * 1.6, by = cy + R * 1.12;
      g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(cx - bw / 2, by, bw, bh, bh / 2); g.fill(); g.fillStyle = '#1f1a3a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(f.lines[0] || '', cx, by + bh / 2 + 2 * u); g.restore(); }
    // 节点＋标签胶囊（弹出 0.5s，过冲 108%）
    for (const nd of L.nodes) {
      const l = ctx.lt(t, nd.q.at); if (l <= 0) continue;
      const on = hNow && hNow.node === nd, a = 1 - 0.65 * dimK * (on ? 0 : 1);
      const pop = MO.backOut(clamp(l / 0.5), 1.1), fy = 0, nr = 46 * u * pop * (on ? 1 + 0.15 * dimK : 1);
      g.save(); g.globalAlpha = a;
      TOON.glow(g, nd.x, nd.y + fy, nr * (on ? 4.2 : 2.6), nd.col, on ? 0.7 : 0.45);
      TOON.flat(g, TOON.circle(nd.x, nd.y + fy, nr), nd.col, dark(nd.col), '#ffffff', [-8 * u, -8 * u], [-3 * u, -3 * u]);
      if (flow) { g.font = `${30 * u * pop}px "PuHui-Heavy"`; g.fillStyle = '#1f1a3a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(nd.i + 1), nd.x, nd.y + fy + 2 * u); }
      const gone = L.exit ? 1 - clamp((t - L.exit.at) / 0.2) : 1;   // 钻进去时：推进一开始这一层的标签全收掉（不然被放大成半屏白块，邻居的也会）
      const lp = MO.backOut(clamp((l - 0.15) / 0.5), 1.1) * gone; if (lp > 0) {
        const sc = lp * (on ? 1 + 0.18 * dimK : 1);
        const lf = TY.fit(g, nd.q.text || '', ctx.W * 0.44 - 56 * u, (ctx.portrait ? 44 : 38) * u, 'PuHui-Medium', { maxLines: 1 });   // 长标签先缩字号
        g.font = `${lf.size}px "PuHui-Medium"`; const tw = g.measureText(nd.q.text || '').width, bw = tw + 56 * u, bh = 70 * u;
        const ly = nd.y + fy + (nd.y < cy - R * 0.5 && ctx.portrait ? -nr - 70 * u : nr + 70 * u);   // 标签放节点下方（竖屏上半圈放上方）
        const z = cam.z || 1, vx0 = cam.x - ctx.W / 2 / z, vx1 = cam.x + ctx.W / 2 / z, hw = bw * sc / 2 + 20 * u / z;   // 当前镜头里看得见的世界范围（慢推会把边上的标签推出画）
        const lx = nd.x > vx0 && nd.x < vx1 ? (vx1 - vx0 > 2 * hw ? clamp(nd.x, vx0 + hw, vx1 - hw) : cam.x) : nd.x;   // 节点在画里，标签就夹回画里
        g.translate(lx, ly); g.scale(sc, sc);
        g.fillStyle = 'rgba(20,40,20,.25)'; g.beginPath(); g.roundRect(-bw / 2 + 6 * u, -bh / 2 + 8 * u, bw, bh, bh / 2); g.fill();
        g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(-bw / 2, -bh / 2, bw, bh, bh / 2); g.fill();
        if (on) { g.strokeStyle = nd.col; g.lineWidth = 5 * u * dimK; g.stroke(); }
        g.fillStyle = '#1f1a3a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(nd.q.text || '', 0, 2 * u);
      }
      g.restore();
    }
    // 萤火微粒
    for (const m of S.motes) { const x = m.x + Math.sin(t * 0.8 + m.ph) * 30 * u, y = m.y - ((t * 22 * u + m.ph * 40 * u) % (120 * u)); g.globalAlpha = 0.4 + 0.4 * Math.sin(t * 2 + m.ph); g.fillStyle = '#fff6d0'; g.beginPath(); g.arc(x, y, m.s, 0, 7); g.fill(); }
    g.globalAlpha = 1;
  });
}
})();
