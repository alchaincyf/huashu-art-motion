// 片段 · 发布会式界面（t2），做教程、功能、参数最顺手：一屏一件事。有截图就让截图当主画面：满幅铺开，口播点到哪块就快推到哪块。
// data: { eyebrow?（标题上方小字）, title?, subtitle?, accent?:'#3d6bff', frame?: 'full'（默认）| 'glass' }
// cues：title（at 这一帧标题开始从模糊里浮出；text/sub 覆盖 data）
//       card | step | image（一张卡：text 卡标题，sub 说明，image 截图路径（或 frames 录屏帧序列）；at 这一帧出现；步骤号按出现顺序 01、02…，data.step 可指定）
//         · 有 image，默认 frame 'full'：截图满幅（等比放进内容框、不裁；data.fit:'cover' 才按焦点 data.focus=[fx,fy] 裁满），
//           四周垫一层同图的压暗模糊放大版，不留死背景；text / sub 是左下角的黑底撕边标签（12fps 打字）。at 这一帧硬切进来（0.17s 轻砸），
//           上一屏也是满幅截图时改成同倍率横移 0.30s 换过去。highlight 这一刻快推 0.28s 到那块（推到框占画面约 42%，至少推近 18%、最多 2.6 倍），连着的 highlight 横移过去。
//         · data.frame:'glass'（或 spec 级 data.frame）：旧版毛玻璃卡——截图等比放进卡里，横图横卡；竖图在横屏里是「左字右图」。光斑、玻璃是可选包装，慎用
//         · 没有 image：功能卡。连着的几张（最多 3 张）并排站在一屏里，新卡进来时旧卡让位（像示范片的三卡并列）；
//           卡上有图标（data.icon：wave memory agent clock phone layers chart code check play bolt lock，不写就画步骤号）、
//           大标题、说明，可选一个大数字（data.value / prefix / suffix / decimals ＋ data.label，卡片落定后计数）
//       highlight（框出当前截图里的一块：data.rect = [x, y, w, h]，相对截图的 0..1；text 可选标签；满幅模式下镜头同时快推过去，data.fill 改推近后框占画面的比例）
//       number（大数字单独一屏：data {value, prefix, suffix, decimals, label?（数字上方小字）}；at = 数字落定时刻，提前 0.9s 开始计数，
//               上一屏这时开始退场，不叠在卡片上；说明写 text 或 sub 都认）
// 竖屏：第一张卡进来时标题缩成页眉留在顶上（不让上下大片空着）；卡片按剩余高度放大。safe：版面只排在 top..H−bottom 之间。
// alpha：不画光斑底；卡片垫一层深色、字带投影，压在亮画面上也看得清。
CLIPS.t2_keynote_ui = (() => {
const { clamp, lerp } = U;
const SANS = '"Inter", "PuHui-Medium"', SANSB = '"Inter", "PuHui-Bold"', ZH = '"PuHui-Medium"', ZHB = '"PuHui-Bold"';
let BL, slides, scr = {}, G;
const track = (c, size, em = -0.02) => { c.letterSpacing = (size * em).toFixed(2) + 'px'; };
// 本语法自带的几个线性图标（UI.icon 只有 wave/memory/agent）：单位框 ±0.5，圆头等线宽
const ICON = {
  clock: c => { c.beginPath(); c.arc(0, 0, 0.42, 0, 7); c.stroke(); c.beginPath(); c.moveTo(0, -0.24); c.lineTo(0, 0); c.lineTo(0.18, 0.1); c.stroke(); },
  phone: c => { c.beginPath(); c.roundRect(-0.25, -0.45, 0.5, 0.9, 0.1); c.stroke(); c.beginPath(); c.moveTo(-0.08, 0.32); c.lineTo(0.08, 0.32); c.stroke(); },
  layers: c => { for (let k = 0; k < 3; k++) { const y = -0.22 + k * 0.22; c.globalAlpha = k ? 0.6 : 1; c.beginPath(); c.moveTo(-0.45, y); c.lineTo(0, y - 0.18); c.lineTo(0.45, y); c.lineTo(0, y + 0.18); c.closePath(); c.stroke(); } c.globalAlpha = 1; },
  chart: c => { c.beginPath(); c.moveTo(-0.42, -0.42); c.lineTo(-0.42, 0.4); c.lineTo(0.44, 0.4); c.stroke(); c.beginPath(); c.moveTo(-0.28, 0.18); c.lineTo(-0.06, -0.04); c.lineTo(0.1, 0.06); c.lineTo(0.36, -0.26); c.stroke(); },
  code: c => { c.beginPath(); c.moveTo(-0.18, -0.28); c.lineTo(-0.42, 0); c.lineTo(-0.18, 0.28); c.moveTo(0.18, -0.28); c.lineTo(0.42, 0); c.lineTo(0.18, 0.28); c.moveTo(0.08, -0.38); c.lineTo(-0.08, 0.38); c.stroke(); },
  check: c => { c.beginPath(); c.arc(0, 0, 0.42, 0, 7); c.stroke(); c.beginPath(); c.moveTo(-0.2, 0); c.lineTo(-0.05, 0.16); c.lineTo(0.22, -0.16); c.stroke(); },
  play: c => { c.beginPath(); c.moveTo(-0.22, -0.34); c.lineTo(0.34, 0); c.lineTo(-0.22, 0.34); c.closePath(); c.fill(); },
  bolt: c => { c.beginPath(); c.moveTo(0.08, -0.46); c.lineTo(-0.28, 0.06); c.lineTo(0, 0.06); c.lineTo(-0.08, 0.46); c.lineTo(0.28, -0.06); c.lineTo(0, -0.06); c.closePath(); c.fill(); },
  lock: c => { c.beginPath(); c.roundRect(-0.32, -0.04, 0.64, 0.46, 0.08); c.stroke(); c.beginPath(); c.arc(0, -0.04, 0.2, Math.PI, 0); c.stroke(); },
};
const icon = (g, kind, x, y, s, col, t) => {
  if (['wave', 'memory', 'agent'].includes(kind)) return UI.icon(g, kind, x, y, s, col, t);
  const f = ICON[kind]; if (!f) return false;
  g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 0.075; g.lineCap = 'round'; g.lineJoin = 'round'; f(g); g.restore();
};
// 放得下才算：TY.fit 量每行宽度，多行折成等长（说明文字不留一个字挂在下一行）
const fitB = (g, text, maxW, size, fam, o = {}) => TY.fit(g, text, maxW, size, fam, { ...o, balance: true });
const fmtNum = (d, k) => (d.prefix || '') + TY.fmt((+d.value || 0) * k, d.decimals ?? 0) + (d.suffix || '');
return {
  fonts: ['PuHui-Medium', 'PuHui-Bold'],
  safe: true,
  init(ctx) {
    const { W, H, u, safe } = ctx;
    BL = [{ x: .22 * W, y: .28 * H, r: .4 * Math.max(W, H), col: [150, 90, 238], a: .75, ax: .11 * W, ay: .11 * H, period: 11, ph: 0 },
      { x: .79 * W, y: .24 * H, r: .37 * Math.max(W, H), col: [56, 104, 255], a: .7, ax: .1 * W, ay: .15 * H, period: 13, ph: 2.1 },
      { x: .69 * W, y: .86 * H, r: .3 * Math.max(W, H), col: [120, 214, 255], a: .5, ax: .13 * W, ay: .09 * H, period: 9.5, ph: 4 },
      { x: .27 * W, y: .89 * H, r: .27 * Math.max(W, H), col: [255, 96, 84], a: .42, ax: .09 * W, ay: .08 * H, period: 12, ph: 1.3 }];
    const hasTitle = ctx.of('title').length > 0, hdr = ctx.portrait && hasTitle;
    G = { y0: safe.top + (hdr ? 250 * u : 40 * u), y1: H - safe.bottom - 40 * u, hdrY: safe.top + 150 * u, hdr };
    G.cy = (G.y0 + G.y1) / 2; G.bh = G.y1 - G.y0;
    // 分屏：截图卡一张一屏；连着的无图卡最多 3 张一屏；number 单独一屏
    slides = []; let k = 0;
    for (const q of ctx.cues) {
      if (['card', 'step', 'image'].includes(q.kind)) {
        const n = q.data && q.data.step != null ? q.data.step : ++k, im = ctx.still(q), cd = { q, n, im };
        const last = slides[slides.length - 1], full = im && ((q.data && q.data.frame) || ctx.data.frame || 'full') !== 'glass';
        if (!im && last && last.type === 'cards' && last.cards.length < 3) last.cards.push(cd);
        else slides.push({ type: im ? 'img' : 'cards', cards: [cd], start: q.at, full });
      } else if (q.kind === 'number') slides.push({ type: 'num', q, start: q.at - 0.9 });
    }
    slides.forEach((s, i) => { s.next = slides[i + 1] ? slides[i + 1].start : 1e9; s.panIn = s.full && i > 0 && slides[i - 1].full; s.panOut = s.full && !!slides[i + 1] && slides[i + 1].full; });
    // 满幅截图：内容框（让开 safe，四边留一点）、截图的几何、这一屏的脉冲镜头（highlight 快推 / 横移）
    for (const s of slides) if (s.full) {
      const cd = s.cards[0], q = cd.q, m = 24 * u, bx = { x: ctx.box.x + m, y: ctx.box.y + m, w: ctx.box.w - 2 * m, h: ctx.box.h - 2 * m };
      const fit = (q.data && q.data.fit) === 'cover' ? 'cover' : 'contain', fo = (q.data && q.data.focus) || [0.5, 0.5];
      s.geo = { box: bx, fit, fx: fo[0], fy: fo[1] };
      const [iw, ih] = MD.size(cd.im), s0 = (fit === 'cover' ? Math.max : Math.min)(bx.w / iw, bx.h / ih), dw = iw * s0, dh = ih * s0;
      const ix = fit === 'cover' ? clamp(bx.x + bx.w * fo[0] - dw * fo[0], bx.x + bx.w - dw, bx.x) : bx.x + (bx.w - dw) / 2, iy = fit === 'cover' ? clamp(bx.y + bx.h * fo[1] - dh * fo[1], bx.y + bx.h - dh, bx.y) : bx.y + (bx.h - dh) / 2;
      s.f = { x: ix, y: iy, w: dw, h: dh };
      const bcx = bx.x + bx.w / 2, bcy = bx.y + bx.h / 2; s.base = { x: W / 2, y: H / 2, z: 1 }; s.events = []; let zoomed = false;
      for (const qh of ctx.of('highlight')) {
        if (qh.at < s.start || qh.at >= s.next || !qh.data || !qh.data.rect) continue;
        const R = CLIP.sub(qh.data.rect, s.f), fill = qh.data.fill || 0.42, z = clamp(Math.min(bx.w * fill / R.w, bx.h * fill / R.h), 1.18, 2.6);   // 下限 18%；框太小时最多推到 2.6 倍
        const tx = R.x + R.w / 2 - (bcx - W / 2) / z, ty = R.y + R.h / 2 - (bcy - H / 2) / z;   // 框中心落到内容框中心（让开 safe）
        s.events.push({ at: qh.at, kind: 'to', x: tx, y: ty, z, dur: zoomed ? MO.PULSE.pan : MO.PULSE.punch });
        zoomed = true;
      }
    }
    // 截图卡的版式：标题行 ＋ 截图区；截图区按截图比例定。竖图在横屏里改成「左字右图」
    const maxW = W * (ctx.portrait ? 0.9 : 0.8), maxH = G.bh * (ctx.portrait ? 0.92 : 0.86), head = (ctx.portrait ? 230 : 130) * u, pad = 36 * u;
    for (const s of slides) if (s.type === 'img' && !s.full) {
      const cd = s.cards[0], [iw0, ih0] = MD.size(cd.im), ar = iw0 / ih0;
      if (!ctx.portrait && ar < 0.9) {                                         // 横屏放竖图：左字右图，图撑满卡高
        const ih = maxH - 2 * pad, iw = ih * ar, tw = 560 * u;
        cd.box = { w: tw + iw + 3 * pad, h: maxH, img: { x: tw + 2 * pad, y: pad, w: iw, h: ih }, side: tw };
      } else {
        let iw = maxW - 2 * pad, ih = iw / ar; if (ih > maxH - head - 2 * pad) { ih = maxH - head - 2 * pad; iw = ih * ar; }
        const cw = Math.max(iw + 2 * pad, Math.min(maxW, 760 * u)), ch = ih + head + 2 * pad;
        cd.box = { w: cw, h: ch, img: { x: (cw - iw) / 2, y: head + pad, w: iw, h: ih } };
      }
    }
  },
  draw(c, t, ctx) {
    const { W, H, u, data: d } = ctx, acc = d.accent || '#3d6bff';
    // ---- 底：光斑（只依赖片段时间，连续） ----
    let bd = null;
    const covered = slides.some(s => s.full && t >= s.start + (s.panIn ? MO.PULSE.pan : 0) - 1e-6 && t < s.next - 1e-6);   // 满幅截图整屏盖住时不画光斑底（省 2/3 的渲染时间）
    if (!ctx.alpha && !covered) {
      const bgc = UI.scratch('clip_t2bg', W, H), g = bgc.getContext('2d'); g.clearRect(0, 0, W, H);   // 先清空：不清的话上一帧的残留会透过半透明边缘，同一时刻先后渲出来差 1 个色阶（qa 确定性 ✗）
      UI.mesh(g, t, { base: '#050508', blobs: BL, blur: 90, scale: 0.25, grain: 0.035, key: 'clip_t2mesh' });
      const vg = g.createRadialGradient(W / 2, H / 2, 100 * u, W / 2, H / 2, Math.max(W, H) * 0.55); vg.addColorStop(0, 'rgba(0,0,0,0.38)'); vg.addColorStop(1, 'rgba(0,0,0,0.1)');
      g.fillStyle = vg; g.fillRect(0, 0, W, H); c.drawImage(bgc, 0, 0); bd = UI.backdrop(bgc, { blur: 40, key: 'clip_t2bd' });
    }
    const shadowText = g => { if (ctx.alpha) { g.shadowColor = 'rgba(0,0,0,0.75)'; g.shadowBlur = 18 * u; g.shadowOffsetY = 3 * u; } };
    // ---- 标题：眉题 → 主标题（模糊→清晰＋上移）→ 副标题；第一屏进来时：横屏退到后面，竖屏缩成页眉留在顶上 ----
    const qt = ctx.of('title')[0], first = slides[0] ? slides[0].start : 1e9;
    if (qt) {
      const out = MO.appleOut(MO.seg(t, first - 0.15, first + 0.5));
      const keep = G.hdr, title = qt.text ?? d.title ?? '', eb = (qt.data && qt.data.eyebrow) ?? d.eyebrow, sub = qt.sub ?? d.subtitle;
      if (out < 1 || keep) {
        c.save(); c.textAlign = 'center'; c.textBaseline = 'alphabetic'; shadowText(c);
        let sz = TY.fit(c, title, W * 0.86, (ctx.portrait ? 150 : 190) * u, 'Inter', { maxLines: 1, min: 0.55, weight: '600 ', soft: true });   // 先缩字号放一行，放不下再折两行
        if (!sz.ok) sz = fitB(c, title, W * 0.86, (ctx.portrait ? 150 : 190) * u, 'Inter', { maxLines: 2, weight: '600 ' });
        const cy = G.cy - (sz.lines.length - 1) * sz.size * 0.55;
        // 竖屏：整块缩到页眉（主标题 → 约 64px），眉题和副标题淡出
        const hs = keep ? Math.min(1, 68 * u / sz.size) : 1, sc = keep ? lerp(1, hs, out) : lerp(1, 0.92, out), ty = keep ? lerp(0, G.hdrY - cy, out) : 0;
        c.translate(W / 2, cy + ty); c.scale(sc, sc); c.translate(-W / 2, -cy);
        const aSide = 1 - out;
        if (!keep) { c.globalAlpha = 1 - out; if (out > 0) c.filter = `blur(${(20 * out * u).toFixed(1)}px)`; }
        if (eb && aSide > 0) { c.save(); c.globalAlpha *= keep ? aSide : 1; c.font = `500 ${34 * u}px ${ZH}`; c.fillStyle = '#a7a7b4'; c.letterSpacing = `${6 * u}px`; TY.blurIn(c, eb, W / 2, cy - sz.size * 0.95, MO.appleOut(ctx.p(t, qt.at, 0.7)), { blur: 10 * u, dy: 16 * u }); c.restore(); }
        c.font = `600 ${sz.size}px ${SANSB}`; track(c, sz.size); c.fillStyle = '#f5f3ff';
        sz.lines.forEach((ln, i) => TY.blurIn(c, ln, W / 2, cy + i * sz.size * 1.1, MO.appleOut(ctx.p(t, qt.at + 0.15 + i * 0.12, 1.0)), { blur: 26 * u, dy: 40 * u }));
        if (sub && aSide > 0) { c.save(); c.globalAlpha *= keep ? aSide : 1; c.letterSpacing = '0px'; c.font = `400 ${46 * u}px ${ZH}`; c.fillStyle = '#c9c9d4';
          TY.wrap(c, sub, W * 0.84).forEach((ln, i) => TY.blurIn(c, ln, W / 2, cy + (sz.lines.length - 1) * sz.size * 1.1 + 110 * u + i * 62 * u, MO.appleOut(ctx.p(t, qt.at + 0.5, 0.9)), { blur: 12 * u, dy: 22 * u })); c.restore(); }
        c.restore();
      }
    }
    // ---- 每一屏：下一屏开始时往左后方退走（0.65s），不和下一屏的内容叠着 ----
    slides.forEach((s, si) => {
      if (t < s.start - 1e-6) return;
      const nx = slides[si + 1], leave = MO.appleOut(MO.seg(t, s.next - 0.15, s.next + (nx && nx.type === 'num' ? 0.3 : 0.5))); if (leave >= 1) return;
      if (s.full) return drawFull(c, s, t, ctx, acc);
      if (s.type === 'num') return drawNumber(c, s, t, leave, ctx, shadowText);
      if (s.type === 'img') return drawCard(c, s.cards[0], 0, t, leave, ctx, bd, cardGeoImg(s.cards[0], ctx), 'i' + si);
      // 无图卡并排：n 张时的位置；新卡进来时旧卡按弹簧挪到新位置
      const vis = s.cards.filter(cd => t >= cd.q.at - 1e-6), n = vis.length, last = vis[n - 1]; ctx._stat = s.cards.some(cd => cd.q.data && cd.q.data.value != null);
      const rf = n > 1 ? MO.spring(t - last.q.at, { duration: 0.7, bounce: 0.12 }) : 1;
      vis.forEach((cd, j) => { const A = rowGeo(j, n, ctx, s.cards.length), Bp = j < n - 1 ? rowGeo(j, n - 1, ctx, s.cards.length) : A;
        const geo = { cx: lerp(Bp.cx, A.cx, rf), cy: lerp(Bp.cy, A.cy, rf), w: lerp(Bp.w, A.w, rf), h: lerp(Bp.h, A.h, rf), focus: j === n - 1 ? 1 : 1 - 0.25 * rf };
        drawCard(c, cd, j, t, leave, ctx, bd, geo, 'c' + si + '_' + j); });
    });
  },
};
// 满幅截图一屏：底是同图的压暗模糊放大版（缓存一次），截图等比铺满内容框，镜头按 s.events 脉冲；左上角黑底撕边标签。
// 进场：上一屏也是满幅截图 → 同倍率横移 0.30s（at 这一帧露出第一条边）；否则硬切＋0.17s 轻砸。离场：下一屏是满幅截图就让它横移盖过来，否则在下一屏开始时硬切掉
function drawFull(c, s, t, ctx, acc) {
  const { W, H, u } = ctx, cd = s.cards[0], q = cd.q;
  if (t < s.start - 1e-6) return;
  const nx = slides[slides.indexOf(s) + 1], P = MO.PULSE;
  if (nx && t >= s.next + (s.panOut ? P.pan : 0) - 1e-6) return;
  const panIn = s.panIn ? MO.pulse(ctx.lt(t, s.start), 0, P.pan) : 1, panOut = s.panOut ? MO.pulse(ctx.lt(t, s.next), 0, P.pan) : 0;
  const dx = (1 - panIn) * W - panOut * W;
  const slam = s.panIn ? 1 : MO.slamK(ctx.lt(t, s.start) / P.slam, 1.06, 0.985);
  const cam = CAM.track(s.base, s.events, t), im = ctx.frame(q, t);
  c.save(); c.translate(dx, 0);
  if (!ctx.alpha) { c.fillStyle = '#0b0b0f'; c.fillRect(0, 0, W, H); }
  CAM.with(c, { x: cam.x, y: cam.y, z: cam.z * slam }, g => {
    if (!ctx.alpha) { const bg = PAINT.cached('t2full_bg_' + slides.indexOf(s) + '_' + W + 'x' + H, W, H, gg => { gg.filter = 'blur(48px) brightness(0.42) saturate(0.8)'; MD.cover(gg, cd.im, { x: -80, y: -80, w: W + 160, h: H + 160, clip: false }); gg.filter = 'none'; });
      g.drawImage(bg, -W * 0.5, -H * 0.5, W * 2, H * 2); }
    const f = s.f;
    g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 40 * u; g.shadowOffsetY = 14 * u; g.fillStyle = '#000'; g.fillRect(f.x, f.y, f.w, f.h); g.restore();
    if (s.geo.fit === 'cover') MD.cover(g, im, { ...s.geo.box, fx: s.geo.fx, fy: s.geo.fy });
    else g.drawImage(im, f.x, f.y, f.w, f.h);
    hlOn(g, cd, f, t, ctx, acc, u, s.next);
  });
  // 标签：屏幕层，不跟镜头；压在内容框左下角（截图自己的标题多在上面，不挡它），at 这一帧出现、12fps 打字
  const size = (ctx.portrait ? 54 : 46) * u, ss = size * 0.66, lx = ctx.box.x + 56 * u, yb = ctx.box.y + ctx.box.h - (ctx.portrait ? 110 : 60) * u;
  const ySub = yb - ss * 0.75, yMain = q.sub ? ySub - ss * 0.75 - 12 * u - size * 0.75 : yb - size * 0.75;
  if (q.text) MD.label(c, q.text, lx, yMain, { t, at: q.at, size });
  if (q.sub) MD.label(c, q.sub, lx, q.text ? ySub : yb - ss * 0.75, { t, at: q.at + (q.text ? 0.25 : 0), size: ss, fam: 'PuHui-Bold', bg: acc, fg: '#ffffff' });
  c.restore();
}
// 截图上的 highlight：at 这一帧框开始弹出，其余压暗，一道光扫过框内；只认落在这一屏在屏期间的 highlight
function hlOn(g, cd, f, t, ctx, acc, u, until) {
  const q = cd.q;
  for (const qh of ctx.of('highlight')) {
    if (qh.at < q.at || qh.at >= until || !qh.data || !qh.data.rect) continue;
    const hl = ctx.lt(t, qh.at); if (hl <= 0) continue;
    const R = CLIP.sub(qh.data.rect, f), s = MO.spring(hl, { duration: 0.45, bounce: 0.25 }), e = 8 * u * (1 - s);
    g.save(); g.fillStyle = 'rgba(0,0,0,0.38)'; g.beginPath(); g.rect(f.x, f.y, f.w, f.h); g.roundRect(R.x - e, R.y - e, R.w + 2 * e, R.h + 2 * e, 10 * u); g.globalAlpha = clamp(hl / 0.3); g.fill('evenodd'); g.restore();
    g.save(); g.strokeStyle = acc; g.lineWidth = 5 * u; g.shadowColor = acc; g.shadowBlur = 18 * u * 0.85; g.globalAlpha = clamp(hl / 0.15);
    g.beginPath(); g.roundRect(R.x - e, R.y - e, R.w + 2 * e, R.h + 2 * e, 10 * u); g.stroke(); g.restore();
    UI.sheen(g, UI.rrPath(R.x, R.y, R.w, R.h, 10 * u), MO.seg(hl, 0.25, 1.0), { x0: R.x, x1: R.x + R.w, width: Math.max(60 * u, R.w * 0.2), alpha: 0.35 });
    if (qh.text) { g.font = `600 ${30 * u}px ${ZHB}`; const lw = g.measureText(qh.text).width + 36 * u, ly = R.y + R.h + 16 * u + 48 * u > f.y + f.h ? R.y - 64 * u : R.y + R.h + 16 * u;
      g.save(); g.globalAlpha = clamp((hl - 0.15) / 0.25); g.fillStyle = acc; g.beginPath(); g.roundRect(clamp(R.x, f.x, f.x + f.w - lw), ly, lw, 48 * u, 24 * u); g.fill(); g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText(qh.text, clamp(R.x, f.x, f.x + f.w - lw) + 18 * u, ly + 25 * u); g.restore(); }
  }
}
// 截图卡的屏幕几何
function cardGeoImg(cd, ctx) { return { cx: ctx.W / 2, cy: G.cy, w: cd.box.w, h: cd.box.h, focus: 1 }; }
// 无图卡：横屏排一行（1 张时宽一点），竖屏叠成一列；total = 这一屏最终有几张（排版按当前张数，但尺寸上限按最终张数，挪位时不忽大忽小）
function rowGeo(j, n, ctx, total) {
  const { W, u } = ctx, gap = 44 * u;
  if (ctx.portrait) { const w = W * 0.86, h = Math.min(400 * u, (G.bh - (total - 1) * gap) / total), y0 = G.cy - (n * h + (n - 1) * gap) / 2; return { cx: W / 2, cy: y0 + j * (h + gap) + h / 2, w, h }; }
  const w = total === 1 ? 760 * u : Math.min(540 * u, (W * 0.9 - (total - 1) * gap) / total), h = Math.min((ctx._stat ? 660 : 540) * u, G.bh * 0.9), x0 = W / 2 - (n * w + (n - 1) * gap) / 2;
  return { cx: x0 + j * (w + gap) + w / 2, cy: G.cy, w, h };
}
// 一张卡：弹簧从下方升起＋绕 Y 轴转正；内容画进离屏纹理（毛玻璃按卡片的屏幕位置取样），再伪 3D 贴回
function drawCard(c, cd, i, t, leave, ctx, bd, geo, key) {
  const { u, data: d } = ctx, q = cd.q, lt = ctx.lt(t, q.at); if (lt <= 0) return;
  const sp = MO.spring(lt, { duration: 0.7, bounce: 0.15 }), acc = d.accent || '#3d6bff';
  const Bw = geo.w, Bh = geo.h, cx = geo.cx - leave * ctx.W * 0.35, cy = geo.cy + (1 - sp) * 170 * u;   // 落定后停住：不漂浮、不摇
  const sc = (0.9 + 0.1 * sp) * (1 - 0.12 * leave) * lerp(0.97, 1, geo.focus), ry = (1 - sp) * -0.45 - 0.35 * leave, a = clamp(lt / 0.2) * (1 - leave) * lerp(0.6, 1, geo.focus);
  const pad = 60, tex = scr[key] || (scr[key] = document.createElement('canvas')); tex.width = Math.ceil(Bw + 2 * pad); tex.height = Math.ceil(Bh + 2 * pad);
  const g = tex.getContext('2d'); g.reset();
  const sw = Bw * sc, sh = Bh * sc;
  if (ctx.alpha) { g.fillStyle = 'rgba(12,12,22,0.62)'; g.beginPath(); g.roundRect(pad, pad, Bw, Bh, 34 * u); g.fill(); }
  UI.glass(g, { x: pad, y: pad, w: Bw, h: Bh, r: 34 * u, bd, sample: { x: cx - sw / 2, y: cy - sh / 2, w: sw, h: sh }, tint: ctx.alpha ? 0.08 : 0.075, stroke: 0.22, light: 0.14, shadow: false });
  g.save(); g.translate(pad, pad);
  if (cd.im) imgContent(g, cd, Bw, Bh, t, ctx, acc); else featContent(g, cd, Bw, Bh, lt, t, ctx, acc);
  UI.sheen(g, UI.rrPath(0, 0, Bw, Bh, 34 * u), MO.seg(lt, 0.4, 1.2), { x0: 0, x1: Bw, width: 120 * u, angle: -0.35, alpha: 0.16 });   // 光扫过整张卡（入场后 0.4s）
  g.restore();
  c.save(); c.globalAlpha = a;
  UI.shadow(c, cx - sw / 2 + 10 * u, cy - sh / 2 + 20 * u, sw - 20 * u, sh - 20 * u, 34 * u, { blur: 80 * u, oy: 40 * u, alpha: 0.55 });
  UI.persp(c, tex, { cx, cy, w: tex.width * sc, h: tex.height * sc, ry, persp: 1800 * u, strip: 3, shade: 0.35 });
  c.restore();
}
// 步骤号徽章
function badge(g, x, y, s, n, acc, u) { g.fillStyle = acc; g.beginPath(); g.roundRect(x, y, s, s, s * 0.28); g.fill();
  g.fillStyle = '#fff'; g.font = `700 ${s * 0.5}px ${SANSB}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n).padStart(2, '0'), x + s / 2, y + s / 2 + 2 * u); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; }
// 截图卡的内容：步骤号＋标题＋说明，截图 contain；highlight 框出一块
function imgContent(g, cd, Bw, Bh, t, ctx, acc) {
  const { u } = ctx, q = cd.q, B = cd.box, I = B.img, hp = 40 * u, bs = 70 * u;
  badge(g, hp, hp, bs, cd.n, acc, u);
  if (B.side) {                                                           // 左字右图：标题、说明在左栏往下排
    const tw = B.side - hp, tl = fitB(g, q.text || '', tw, 58 * u, 'PuHui-Bold', { maxLines: 3, weight: '600 ' });
    g.font = `600 ${tl.size}px ${ZHB}`; g.fillStyle = '#f5f5f7'; tl.lines.forEach((ln, k) => g.fillText(ln, hp, hp + bs + 70 * u + k * tl.size * 1.25));
    if (q.sub) { const sl = fitB(g, q.sub, tw, 34 * u, 'PuHui-Medium', { maxLines: 5 }); g.font = `400 ${sl.size}px ${ZH}`; g.fillStyle = 'rgba(235,235,245,0.66)';
      sl.lines.forEach((ln, k) => g.fillText(ln, hp, hp + bs + 70 * u + tl.lines.length * tl.size * 1.25 + 30 * u + k * sl.size * 1.4)); }
  } else {
    const tx = hp + bs + 26 * u, tw = Bw - tx - hp;
    if (ctx.portrait) {                                                    // 竖屏：卡头高一些，标题、说明字大一号
      const tl = fitB(g, q.text || '', tw, 56 * u, 'PuHui-Bold', { maxLines: 2, weight: '600 ', min: 0.7 }); g.font = `600 ${tl.size}px ${ZHB}`; g.fillStyle = '#f5f5f7';
      tl.lines.forEach((ln, k) => g.fillText(ln, tx, hp + tl.size * 0.85 + k * tl.size * 1.2));
      // 标题占两行时说明只留一行，卡头放得下
      if (q.sub) { const sl = fitB(g, q.sub, tw, 34 * u, 'PuHui-Medium', { maxLines: tl.lines.length > 1 ? 1 : 2, min: 0.75 }); g.font = `400 ${sl.size}px ${ZH}`; g.fillStyle = 'rgba(235,235,245,0.66)';
        sl.lines.forEach((ln, k) => g.fillText(ln, tx, hp + tl.size * 0.85 + (tl.lines.length - 1) * tl.size * 1.2 + 24 * u + sl.size + k * sl.size * 1.35)); }
    } else {
    const tl = TY.fit(g, q.text || '', tw, 46 * u, 'PuHui-Bold', { maxLines: 1, weight: '600 ' });
    g.font = `600 ${tl.size}px ${ZHB}`; g.fillStyle = '#f5f5f7'; g.fillText(tl.lines[0] || '', tx, hp + (q.sub ? 32 * u : 48 * u));
    if (q.sub) { const sl = TY.fit(g, q.sub, tw, 28 * u, 'PuHui-Medium', { maxLines: 1 }); g.font = `400 ${sl.size}px ${ZH}`; g.fillStyle = 'rgba(235,235,245,0.62)'; g.fillText(sl.lines[0] || '', tx, hp + 74 * u); }
    }
  }
  const [iw, ih] = MD.size(cd.im), f = CLIP.fit(iw, ih, I.x, I.y, I.w, I.h);
  g.save(); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 30 * u; g.shadowOffsetY = 12 * u; g.fillStyle = '#000'; g.beginPath(); g.roundRect(f.x, f.y, f.w, f.h, 10 * u); g.fill(); g.restore();
  g.save(); g.beginPath(); g.roundRect(f.x, f.y, f.w, f.h, 10 * u); g.clip(); g.drawImage(ctx.frame(q, t), f.x, f.y, f.w, f.h); g.restore();
  g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 1.5; g.beginPath(); g.roundRect(f.x + .75, f.y + .75, f.w - 1.5, f.h - 1.5, 10 * u); g.stroke();
  // 框出重点（和满幅模式同一套）：只认落在这张卡在屏期间的 highlight
  const nxAt = (() => { const i = ctx.cues.indexOf(q); const n = ctx.cues.slice(i + 1).find(z => ['card', 'step', 'image', 'number'].includes(z.kind)); return n ? (n.kind === 'number' ? n.at - 0.9 : n.at) : 1e9; })();
  hlOn(g, cd, f, t, ctx, acc, u, nxAt);
}
// 无图功能卡的内容：图标（或步骤号）→ 大标题 → 说明 →（可选）大数字计数。横屏竖卡上下排，竖屏横卡左右排
function featContent(g, cd, Bw, Bh, lt, t, ctx, acc) {
  const { u } = ctx, q = cd.q, dd = q.data || {}, hasNum = dd.value != null, pad = 48 * u, tile = (ctx.portrait ? 110 : 120) * u;
  const drawTile = (x, y) => { g.fillStyle = 'rgba(255,255,255,0.10)'; g.beginPath(); g.roundRect(x, y, tile, tile, 26 * u); g.fill();
    if (!dd.icon || icon(g, dd.icon, x + tile / 2, y + tile / 2, tile * 0.6, '#f2f2f7', t) === false) {
      g.fillStyle = acc; g.beginPath(); g.roundRect(x, y, tile, tile, 26 * u); g.fill(); g.fillStyle = '#fff'; g.font = `700 ${tile * 0.46}px ${SANSB}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(String(cd.n).padStart(2, '0'), x + tile / 2, y + tile / 2 + 3 * u); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; } };
  const num = (x, y, size, align) => { const v = MO.expoOut(clamp((lt - 0.35) / 0.9)); g.save(); g.font = `600 ${size}px ${SANSB}`; track(g, size, -0.03); g.fillStyle = '#fff';
    TY.tabular(g, fmtNum(dd, v), x, y, { align }); g.restore(); if (dd.label) { g.font = `400 ${28 * u}px ${ZH}`; g.fillStyle = 'rgba(235,235,245,0.6)'; g.textAlign = align; g.fillText(dd.label, x, y + 46 * u); g.textAlign = 'left'; } };
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  if (!ctx.portrait) {
    drawTile(pad, pad);
    const tl = fitB(g, q.text || '', Bw - 2 * pad, 64 * u, 'PuHui-Bold', { maxLines: 2, weight: '600 ', min: 0.6 });
    let y = pad + tile + 40 * u + tl.size; g.font = `600 ${tl.size}px ${ZHB}`; g.fillStyle = '#f5f5f7'; tl.lines.forEach((ln, k) => g.fillText(ln, pad, y + k * tl.size * 1.2)); y += (tl.lines.length - 1) * tl.size * 1.2;
    if (q.sub) { const sl = fitB(g, q.sub, Bw - 2 * pad, (hasNum ? 32 : 38) * u, 'PuHui-Medium', { maxLines: hasNum ? 2 : 4, min: 0.75 }); g.font = `400 ${sl.size}px ${ZH}`; g.fillStyle = 'rgba(235,235,245,0.66)';
      sl.lines.forEach((ln, k) => g.fillText(ln, pad, y + 26 * u + sl.size + k * sl.size * 1.45)); }
    if (hasNum) { g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(pad, Bh - pad - 200 * u, Bw - 2 * pad, 1.5); num(pad, Bh - pad - 66 * u, Math.min(128 * u, (Bw - 2 * pad) / Math.max(3, fmtNum(dd, 1).length) * 1.6), 'left'); }
  } else {
    drawTile(pad, (Bh - tile) / 2);
    const tx = pad + tile + 34 * u, nw = hasNum ? Math.min(340 * u, Bw * 0.36) : 0, tw = Bw - tx - pad - nw;
    const tl = fitB(g, q.text || '', tw, 62 * u, 'PuHui-Bold', { maxLines: 2, weight: '600 ', min: 0.6 });   // 标题放不下就折两行，不再截掉后半句
    const sl = q.sub ? fitB(g, q.sub, tw, 38 * u, 'PuHui-Medium', { maxLines: tl.lines.length > 1 ? 1 : 2, min: 0.75 }) : { lines: [], size: 0 };
    const tH = tl.size + (tl.lines.length - 1) * tl.size * 1.15, blk = tH + (sl.lines.length ? 22 * u + sl.lines.length * sl.size * 1.4 : 0), y0 = (Bh - blk) / 2 + tl.size * 0.85;
    g.font = `600 ${tl.size}px ${ZHB}`; g.fillStyle = '#f5f5f7'; tl.lines.forEach((ln, k) => g.fillText(ln, tx, y0 + k * tl.size * 1.15));
    const ys = y0 + (tl.lines.length - 1) * tl.size * 1.15;
    g.font = `400 ${sl.size}px ${ZH}`; g.fillStyle = 'rgba(235,235,245,0.66)'; sl.lines.forEach((ln, k) => g.fillText(ln, tx, ys + 22 * u + sl.size + k * sl.size * 1.4));
    if (hasNum) num(Bw - pad, Bh / 2 + 20 * u, Math.min(96 * u, nw / Math.max(3, fmtNum(dd, 1).length) * 1.7), 'right');
  }
}
// 大数字一屏：at 落定（提前 0.9s 开始滚）；数字上方可有小字 label，下方说明（text 或 sub）
function drawNumber(c, s, t, leave, ctx, shadowText) {
  const { W, u } = ctx, q = s.q, nd = q.data || {}, k = MO.expoOut(clamp((t - s.start) / 0.9)), a = MO.appleOut(clamp((t - s.start - 0.12) / 0.3)) * (1 - leave);
  const cap = q.text ?? q.sub;
  c.save(); c.globalAlpha = a; shadowText(c); c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  if (leave > 0) { c.filter = `blur(${(16 * leave * u).toFixed(1)}px)`; }
  const str = fmtNum(nd, k), full = fmtNum(nd, 1);
  c.font = `600 ${220 * u}px ${SANSB}`; track(c, 220 * u, -0.03); let size = 220 * u; const fw = c.measureText(full).width; if (fw > W * 0.88) size *= W * 0.88 / fw;
  c.font = `600 ${size}px ${SANSB}`; track(c, size, -0.03); c.fillStyle = '#fff';
  const y = G.cy + size * 0.32 - (cap ? 30 * u : 0);
  TY.tabular(c, str, W / 2, y, { align: 'center' });
  c.letterSpacing = '0px';
  if (nd.label) { c.font = `500 ${34 * u}px ${ZH}`; c.fillStyle = '#a7a7b4'; c.fillText(nd.label, W / 2, y - size * 0.85); }
  if (cap) { c.font = `400 ${(ctx.portrait ? 46 : 44) * u}px ${ZH}`; c.fillStyle = 'rgba(235,235,245,0.78)'; TY.wrap(c, cap, W * 0.84).forEach((ln, i) => c.fillText(ln, W / 2, y + 100 * u + i * 60 * u)); }
  c.restore();
}
})();
