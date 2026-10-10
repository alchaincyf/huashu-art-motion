// 片段 · 动态文字（y5）：字就是演员。一个 cue 一页：主词在 at 这一帧砸进来（弹簧过冲 ≈8%），辅句从槽里升起；
// 换页是色带擦除，新页面露出来的那一帧＝at（擦除在 at 之前 0.3s 开始）。
// cues：title | point（一页：text 主词（太长自动缩字号、最多两行），sub 辅句，data.label 左上小标签如「01」）
//       number（一页大数字：data {value, prefix, suffix, decimals}，at = 数字落定的时刻，页面提前 0.7s 出现开始滚）
//       highlight（当前页里 data.word 这个词刷荧光笔＋放大一下；不给 word 就刷整个主词）
//       sub 里的关键词：data.key 写辅句里的一个词，那个词用强调色（示范片「下一行」那样）
//       number 的说明写 text 或 sub 都行（clip.js 已统一）；data.label 照样有
// 两个以上的 point 页 = 一份清单：画进度轨（01/02/03，告诉观众第几个、一共几个；横屏右上、竖屏在下方）和背景巨型序号（低对比、斜向慢漂，data.num 可指定）。
// data.palette = [[底色, 字色], ...] 换配色（写了就优先，盖过 spec.theme）。alpha 模式不画底，字白色带深色描边。safe：主词块在 top..H−bottom 之间居中，进度轨也在这一带里。
// spec.theme（全片色板 ctx.pal）：页面轮换 [bg 底 ink 字] → [accent 底] → [ink 底 bg 字] → [accent2 底]（强调色页的字取 surface/ink/bg 里最清楚的那个）；
//   荧光笔、辅句关键词、换页色带都只从 bg / ink / accent / accent2 里挑和当前页底色不同的。
CLIPS.y5_kinetic_type = (() => {
const { clamp, lerp } = U;
const PAGES0 = [['#FFD23F', '#111111'], ['#FF5A36', '#FFFFFF'], ['#14213D', '#FFD23F'], ['#F4EFE6', '#111111']];
let pages, LIST, TP = null;                                                // TP：全片色板（没写 data.palette 时才用）
const same = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();
// 在候选色里挑一个和页底、字色都不同、压在页底上最清楚的
const pick = (bg, fg, cands) => { const ok = cands.filter(x => !same(x, bg) && !same(x, fg)); return ok.length ? PAL.on(bg, ok) : cands[0]; };
const accentOf = col => TP ? pick(col[0], col[1], [TP.accent, TP.accent2]) : col[0] === '#FFD23F' || col[0] === '#F4EFE6' || col[1] === '#FFD23F' ? '#FF5A36' : '#FFD23F';   // 字本身是黄的（深蓝页）就用橙，不然着色看不出来
const fromPal = p => { const txt = bg => PAL.on(bg, [p.surface, p.ink, p.bg]); return [[p.bg, p.ink], [p.accent, txt(p.accent)], [p.ink, p.bg], [p.accent2, txt(p.accent2)]]; };
return {
  fonts: ['PuHui-Black', 'PuHui-Heavy', 'PuHui-Bold'],
  safe: true,
  init(ctx) {
    TP = ctx.data.palette ? null : ctx.pal;
    const { W, u } = ctx, pal = ctx.data.palette || (TP ? fromPal(TP) : PAGES0), g = document.createElement('canvas').getContext('2d');
    pages = ctx.of('title', 'point', 'number').map((q, i) => {
      const num = q.kind === 'number', nd = q.data || {};
      const text = num ? (nd.prefix || '') + TY.fmt(nd.value || 0, nd.decimals ?? 0) + (nd.suffix || '') : (q.text || '');
      const S0 = (ctx.portrait ? 250 : 300) * u;
      let f = TY.fit(g, text, W * 0.86, S0, 'PuHui-Black', { maxLines: 1, min: 0.55, soft: true });   // 先缩字号放一行，再不行折两行；单个长英文词再缩也要放得下
      if (!f.ok) f = num ? TY.fit(g, text, W * 0.86, S0, 'PuHui-Black', { maxLines: 1 })   // 数字不折行（滚动时逐字变宽，折开会跳）：只缩字号
                     : TY.fit(g, text, W * 0.86, S0, 'PuHui-Black', { maxLines: 2, min: 0.3, balance: true });
      const sf = q.sub ? TY.fit(g, q.sub, W * 0.86, (ctx.portrait ? 64 : 80) * u, 'PuHui-Heavy', { maxLines: 2, min: 0.6, balance: true }) : null;   // 辅句：放不下先缩、再折两行
      const show = num ? q.at - 0.7 : q.at;
      return { q, i, num, nd, text, f, sf, show, col: pal[i % pal.length] };
    });
    const pts = pages.filter(p => p.q.kind === 'point'); pts.forEach((p, k) => { p.ord = k + 1; });
    LIST = pts.length >= 2 ? pts : null;
    // 高亮的词不在页上：只告警（以前什么都不发生）
    for (const h of ctx.of('highlight')) { const w = h.data && h.data.word; if (!w) continue; const pg = [...pages].reverse().find(p => p.show <= h.at + 1e-6);
      if (pg && !pg.f.lines.some(l => l.includes(w))) console.warn(`y5 highlight at=${h.at}：主词里没有「${w}」（主词「${pg.text}」；荧光笔只刷主词，辅句里的词用 data.key 着色），这一下什么都不做`); }
  },
  draw(c, t, ctx) {
    const { W, H, u } = ctx;
    let k = -1; pages.forEach((p, i) => { if (t >= p.show - 1e-6) k = i; });
    const P = pages[Math.max(0, k)]; if (!P) return;
    const page = (p, c2) => drawPage(c2, p, t, ctx);
    // 底＋点阵
    if (!ctx.alpha) { c.fillStyle = P.col[0]; c.fillRect(0, 0, W, H); dots(c, t, P.col[1], 0.07, u, W, H); }
    if (k >= 0) {
      // 拍点微冲：每个 cue 落下时整屏放大 1.5%，0.15s 衰减
      let bump = 1; for (const q of ctx.cues) { const l = t - q.at; if (l >= 0 && l < 0.4) bump += 0.015 * Math.exp(-l * 22); }
      // 镜头不漂不晃：落定就停，运动只在拍点上（上面的微冲、主词砸入、换页色带）
      CAM.with(c, { x: W / 2, y: H / 2, z: bump }, cc => { ghost(cc, P, t, ctx); page(P, cc); });
      track(c, P, t, ctx);
    }
    // 换页：两条色带从左扫到右，最后一条后面露出新页（露出那一帧＝新页的 show 时刻）
    const N = pages[k + 1];
    if (N && !ctx.alpha) {
      const p = (t - (N.show - 0.3)) / 0.36; if (p > 0 && p < 1) {
        const mid = (TP ? [TP.accent, TP.accent2, TP.ink, TP.bg] : ['#FFD23F', '#FF5A36', '#14213D', '#3A86FF']).find(x => !same(x, P.col[0]) && !same(x, N.col[0])), cols = [mid, N.col[0]], sk = H * 0.35;   // 两条：一条和前后底色都不同的强调色＋新底色（以前第一条是字色，白字页前会整屏闪一帧白）
        const edge = q => lerp(-sk - 40, W + sk + 40, MO.expoInOut(clamp(q)));
        cols.forEach((col, i) => { const x = edge((p - i * 0.12) / 0.76); c.save(); c.beginPath(); c.moveTo(-sk - 60, 0); c.lineTo(x + sk, 0); c.lineTo(x, H); c.lineTo(-sk - 60, H); c.closePath(); c.clip(); c.fillStyle = col; c.fillRect(0, 0, W, H); c.restore(); });
      }
    }
  },
};
function dots(c, t, col, a, u, W, H) { const g = 64 * u, ox = (t * 36 * u) % g, oy = (t * 18 * u) % g; c.save(); c.globalAlpha = a; c.fillStyle = col; for (let y = -g; y < H + g; y += g) for (let x = -g; x < W + g; x += g) { c.beginPath(); c.arc(x + ox, y + oy, 4 * u, 0, Math.PI * 2); c.fill(); } c.restore(); }
function drawPage(c, P, t, ctx) {
  const { W, H, u } = ctx, q = P.q, fg = ctx.alpha ? '#FFFFFF' : P.col[1], lt = ctx.lt(t, P.num ? P.show : q.at);
  const stroke = ctx.alpha ? { stroke: '#111', strokeW: P.f.size * 0.06 } : {};
  const lines = P.num ? [P.text] : P.f.lines, size = P.f.size, lh = size * 1.08;
  const sub = q.sub, subSz = P.sf ? P.sf.size : 0, subL = P.sf ? P.sf.lines : [];
  const by0 = ctx.safe.top, by1 = H - ctx.safe.bottom - (ctx.portrait && LIST ? 220 * u : 0), cyB = ctx.portrait ? by0 + (by1 - by0) * 0.44 : (by0 + by1) / 2;
  const blockH = lines.length * lh + (sub ? subSz * (0.6 + subL.length * 1.15) : 0), y0 = cyB - blockH / 2 + size * 0.82;
  // 标签（左上）
  const label = q.data && q.data.label;
  if (label) TY.rise(c, label, (ctx.portrait ? 80 : 140) * u, ctx.safe.top + (ctx.portrait ? 260 : 210) * u, MO.at(lt, 0, 0.3), { size: (ctx.portrait ? 56 : 52) * u, fam: 'PuHui-Bold', color: fg, track: 6 * u, ...(ctx.alpha ? { stroke: '#111', strokeW: 6 * u } : {}) });
  // 高亮（画在字后面）
  const hq = ctx.of('highlight').filter(h => h.at >= (P.num ? P.show : q.at) - 1e-6).find(h => { const nx = ctx.of('title', 'point', 'number').find(z => z.at > q.at); return !nx || h.at < nx.at; });
  let hiScale = 1, knock = null;
  if (hq) {
    const hl = ctx.lt(t, hq.at), wd = hq.data && hq.data.word, found = !wd || lines.some(l => l.includes(wd));
    hiScale = hl > 0 && found ? 1 + 0.06 * MO.settle(hl, 1, 2.5, 6) : 1;                     // 词不在主词里：不刷也不放大（init 里已告警）
    if (hl > 0) lines.forEach((ln, i) => {
      const word = wd || ln, at = ln.indexOf(word); if (at < 0) return;
      const wPre = TY.width(c, ln.slice(0, at), size), wW = TY.width(c, word, size), wl = TY.width(c, ln, size), x = W / 2 - wl / 2 + wPre, y = y0 + i * lh;
      const mc = ctx.alpha ? (TP ? TP.accent : '#FF5A36') : TP ? (same(P.col[0], TP.accent) ? TP.accent2 : TP.accent) : (P.col[0] === '#FFD23F' ? '#FF5A36' : '#FFD23F'), mr = [x - 12 * u, y - size * 0.86, wW + 24 * u, size * 1.0, MO.at(hl, 0, 0.3)];
      TY.marker(c, ...mr, mc);
      if (mc.toLowerCase() === fg.toLowerCase()) (knock = knock || []).push({ i, mr });   // 荧光笔和字同色（深蓝页黄字）：笔下面的字反白成底色，不然整个词被涂没
    });
  }
  // 主词：每行在 at（+0.08s/行）砸进来；数字页从 0 滚到落定
  lines.forEach((ln, i) => {
    let s = ln; if (P.num) { const k = MO.expoOut(clamp(lt / 0.7)); s = (P.nd.prefix || '') + TY.fmt((P.nd.value || 0) * k, P.nd.decimals ?? 0) + (P.nd.suffix || ''); }
    const w = TY.width(c, s, size), x = W / 2 - w / 2, y = y0 + i * lh;
    TY.slam(c, s, x, y, lt - i * 0.08, { size, color: fg, scale: hiScale, ox: W / 2, oy: y - size * 0.36, ...stroke });
    for (const k of (knock || []).filter(k => k.i === i)) {             // 只在荧光笔那块平行四边形里，用底色再砸一遍同一行（和 TY.marker 同一形状）
      const [mx, my, mw, mh, mp] = k.mr, ww = mw * MO.expoOut(clamp(mp)), sk = mh * 0.18;
      c.save(); c.beginPath(); c.moveTo(mx + sk, my); c.lineTo(mx + ww + sk, my); c.lineTo(mx + ww, my + mh); c.lineTo(mx, my + mh); c.closePath(); c.clip();
      TY.slam(c, s, x, y, lt - i * 0.08, { size, color: P.col[0], scale: hiScale, ox: W / 2, oy: y - size * 0.36 }); c.restore();
    }
  });
  if (sub) subL.forEach((ln, k) => {                                      // 辅句（可两行）；data.key 那个词用强调色
    const sw = TY.width(c, ln, subSz, 'PuHui-Heavy'), sy = y0 + (lines.length - 1) * lh + subSz * (1.7 + k * 1.15), sp = MO.at(lt, 0.35 + k * 0.08, 0.35), so = { size: subSz, fam: 'PuHui-Heavy', color: fg, ...(ctx.alpha ? { stroke: '#111', strokeW: subSz * 0.08 } : {}) };
    const key = q.data && q.data.key, ki = key ? ln.indexOf(key) : -1, x0 = W / 2 - sw / 2;
    if (ki < 0) return TY.rise(c, ln, x0, sy, sp, so);
    const pre = ln.slice(0, ki), post = ln.slice(ki + key.length), wp = TY.width(c, pre, subSz, 'PuHui-Heavy'), wk = TY.width(c, key, subSz, 'PuHui-Heavy');
    if (pre) TY.rise(c, pre, x0, sy, sp, so); TY.rise(c, key, x0 + wp, sy, sp, { ...so, color: ctx.alpha ? (TP ? TP.accent : '#FFD23F') : accentOf(P.col) }); if (post) TY.rise(c, post, x0 + wp + wk, sy, sp, so);
  });
}
// 背景巨型序号：清单页右下角（竖屏落在下半屏），低对比、弹簧落位后斜向慢漂；不和主词抢（字色 12% 透明度）
function ghost(c, P, t, ctx) {
  if (!LIST || !P.ord || ctx.alpha) return;
  const { W, H, u } = ctx, lt = t - P.show, k = MO.springHz(lt, 2.0, 8), sc = lerp(1.35, 1, k), s = String((P.q.data && P.q.data.num) ?? P.ord);
  const size = (ctx.portrait ? 1000 : 900) * u, x = W - (ctx.portrait ? 40 : 60) * u + lt * 14 * u, y = H - ctx.safe.bottom + (ctx.portrait ? -120 : 70) * u - lt * 10 * u;
  TY.text(c, s, x, y, { size, fam: 'PuHui-Black', align: 'right', color: P.col[1], alpha: 0.12 * clamp(lt / 0.08), scale: sc, ox: x - size * 0.28, oy: y - size * 0.36 });
}
// 进度轨：01/02/03 三格（几个 point 页就几格），当前页那一格在换页露出那一帧点亮；画在相机外，不跟页面晃
function track(c, P, t, ctx) {
  if (!LIST) return;
  const { W, H, u } = ctx, n = LIST.length, k = LIST.filter(p => p.show <= t + 1e-6).length; if (k === 0) return;
  const fg = ctx.alpha ? '#FFFFFF' : P.col[1], gap = 18 * u, seg = Math.min((ctx.portrait ? 150 : 110) * u, ((ctx.portrait ? W * 0.86 : W * 0.4) - (n - 1) * gap) / n), tot = n * seg + (n - 1) * gap;   // 要点多时每格变窄，不出画
  const x0 = ctx.portrait ? (W - tot) / 2 : W - (ctx.portrait ? 80 : 140) * u - tot, y = ctx.portrait ? H - ctx.safe.bottom - 130 * u : ctx.safe.top + 120 * u;
  const a = MO.expoOut(clamp((t - LIST[0].show) / 0.3));
  c.save(); c.globalAlpha = a;
  for (let i = 0; i < n; i++) { const x = x0 + i * (seg + gap), on = i < k, fill = on ? MO.expoOut(clamp((t - LIST[i].show) / 0.3)) : 0;
    c.fillStyle = fg; c.globalAlpha = a * 0.25; c.fillRect(x, y, seg, 10 * u); c.globalAlpha = a; c.fillRect(x, y, seg * fill, 10 * u);
    TY.text(c, String(i + 1).padStart(2, '0'), x, y - 20 * u, { size: (ctx.portrait ? 40 : 32) * u, fam: 'PuHui-Bold', color: fg, align: 'left', alpha: on ? 1 : 0.4, track: 2 * u, ...(ctx.alpha ? { stroke: '#111', strokeW: 5 * u } : {}) }); }
  c.restore();
}
})();
