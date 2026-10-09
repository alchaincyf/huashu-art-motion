// 参数化片段运行时：一份 spec（JSON）→ 一段时长严格等于 spec.duration 的动画。给口播视频管线当「动画段」用。
// 契约见 references/09-视频动画语法.md「片段契约」。和 engine.js 的区别：没有段落表/转场，一个语法一个 draw(c, t, ctx)，画布尺寸从 spec 读（竖屏也行）。
//
// spec = { grammar, duration, fps=30, width=1920, height=1080, safe?: {top,bottom,left,right（px，留给字幕/平台 UI）, fill?（让开的边涂这个色）}, theme?, alpha?, data?, cues: [{at, kind, text?, sub?, data?, image?, frames?, fps?, dur?}] }
// 素材路径（render.py 用 spec_assets.py 核存在并改写）：cue.image、cue.frames（帧序列：目录或路径数组）、data.image、data.character.frames（y4 帧库）。
// 任何一张加载失败 → 启动失败、拒绝渲染（不出空白帧）。语法里取素材：ctx.still(q) = 这条 cue 的静态图（有 frames 时是第一帧），ctx.frame(q, t) = t 时刻该画的那一帧。
// 语法文件 clips/<grammar>.js 注册 CLIPS[grammar] = { init?(ctx), draw(c, t, ctx), safe?: true（按 ctx.safe / ctx.box 排版了才写，否则 spec.safe 会告警） }。
// 对齐约定（CLIP.lt）：cue 的「揭开那一帧」= at 所在的那一帧——元素在 t = at 这一帧第一次可见，动画内部时间从 at − 1 帧起算。
(() => {
const cv = document.getElementById('c'), c = cv.getContext('2d');
window.__canvas = cv;
window.CLIPS = window.CLIPS || {};
const C = window.CLIP = {};
const fail = msg => { window.__bootFailed = msg; console.error('CLIP BOOT FAILED\n' + msg); };

// ---------- 给语法文件用的小工具 ----------
// 片内时间：cue 在 at 这一帧第一次可见
C.lt = (t, at, fps) => t - at + 1 / fps;
// 进度：从 at 起 dur 秒走完 0→1（at 这一帧已经 >0）
C.p = (t, at, dur, fps) => U.clamp(C.lt(t, at, fps) / dur);
// 等比放进框里（contain，不裁）：返回 {x, y, w, h}
C.fit = (iw, ih, bx, by, bw, bh) => { const s = Math.min(bw / iw, bh / ih); const w = iw * s, h = ih * s; return { x: bx + (bw - w) / 2, y: by + (bh - h) / 2, w, h, s }; };
// 归一化矩形 [x,y,w,h]（0..1，相对图片）→ 画面矩形
C.sub = (r, box) => ({ x: box.x + r[0] * box.w, y: box.y + r[1] * box.h, w: r[2] * box.w, h: r[3] * box.h });
C.text = (cue, ...fallback) => (cue && (cue.text ?? cue.data?.text)) ?? fallback.find(v => v != null) ?? '';

async function boot() {
  let spec = window.CLIP_SPEC;
  if (!spec) {                                                           // 预览：?spec=<相对 engine 的路径>
    const u = new URLSearchParams(location.search).get('spec');
    if (!u) return fail('没有 spec：render.py --spec 会注入 window.CLIP_SPEC；预览用 clip.html?spec=examples/<名>.json');
    spec = await (await fetch(u)).json();
    const base = u.replace(/[^/]*$/, '');
    const fix = p => p && !/^(data:|https?:|\/)/.test(p) ? base + p : p;   // 预览模式：frames 要写成路径数组（浏览器列不了目录），帧库要写 {frames: {姿势: 路径}}
    (spec.cues || []).forEach(q => { if (q.image) q.image = fix(q.image); if (Array.isArray(q.frames)) q.frames = q.frames.map(fix); });
    if (spec.data && spec.data.image) spec.data.image = fix(spec.data.image);
    const ch = spec.data && spec.data.character; if (ch && typeof ch === 'object' && ch.frames && typeof ch.frames === 'object') for (const k in ch.frames) ch.frames[k] = fix(ch.frames[k]);
  }
  if (location.search.includes('render=1')) document.body.classList.add('render');
  const W = spec.width || 1920, H = spec.height || 1080, FPS = spec.fps || 30;
  if (!spec.grammar) return fail('spec 缺 grammar');
  if (!(spec.duration > 0)) return fail('spec.duration 必须 > 0');
  cv.width = W; cv.height = H; U.setStage(W, H);
  // 语法文件（同步 XHR + eval，带 sourceURL，报错能定位）
  const x = new XMLHttpRequest(); x.open('GET', `clips/${spec.grammar}.js`, false);
  try { x.send(); } catch (e) { return fail('请求语法文件失败 ' + e); }
  if (x.status !== 200) return fail(`没有这个语法：clips/${spec.grammar}.js（HTTP ${x.status}）`);
  try { (0, eval)(x.responseText + `\n//# sourceURL=clips/${spec.grammar}.js`); } catch (e) { return fail(`clips/${spec.grammar}.js 执行出错 ${e.stack || e}`); }
  const G = CLIPS[spec.grammar]; if (!G || typeof G.draw !== 'function') return fail(`clips/${spec.grammar}.js 没注册 CLIPS['${spec.grammar}'] = { draw }`);
  // 图片
  const IMG = {}, urls = new Set();
  for (const q of (spec.cues || [])) {
    if (q.image) urls.add(q.image);
    if (q.frames != null) { if (!Array.isArray(q.frames) || !q.frames.length) return fail(`cue ${q.kind} at=${q.at} 的 frames 要是非空的路径数组（render.py 会把目录展开成数组；预览模式只认数组）`); q.frames.forEach(f => urls.add(f)); }
  }
  if (spec.data && spec.data.image) urls.add(spec.data.image);
  const chr = spec.data && spec.data.character;
  if (chr && typeof chr === 'object') { if (!chr.frames || typeof chr.frames !== 'object' || Array.isArray(chr.frames)) return fail('data.character 写成对象时要有 frames: {姿势名: 图片路径}（或在 render.py 里给一个帧库目录）');
    Object.values(chr.frames).forEach(f => urls.add(f)); }
  try { await Promise.all([...urls].map(u => new Promise((res, rej) => { const im = new Image(); im.onload = () => { IMG[u] = im; res(); }; im.onerror = () => rej(u); im.src = u; }))); }
  catch (u) { return fail('图片加载失败：' + u); }
  // 字体＋字形检查（spec 里的字缺字形只警告：回退系统字体照样能渲，但换台机器会变样）
  for (const f of (window.FONT_FACES || [])) { const ff = new FontFace(f.family, `url(${f.url})`, f.desc || {}); await ff.load(); document.fonts.add(ff); }
  await document.fonts.ready; await U.loadCmaps();
  const cues0 = (spec.cues || []).map((q, i) => ({ ...q, i, at: +q.at || 0 })).sort((a, b) => a.at - b.at || a.i - b.i);
  for (const q of cues0) if (q.at > spec.duration + 1e-9) console.warn(`cue ${q.kind} at=${q.at} 超出片段时长 ${spec.duration}s，看不到，已丢掉（不占版面）`);
  const cues = cues0.filter(q => q.at <= spec.duration + 1e-9);   // 看不到的 cue 不进语法：否则照样占排版位置、进度轨照样数它
  // number 的说明字段各语法以前各认各的（t2/t3 认 text，y5 认 sub），写错了不报错只是没字。统一：text 与 sub 互为别名，data.text 也算
  for (const q of cues) if (q.kind === 'number') { const cap = q.text ?? q.sub ?? (q.data && q.data.text); if (cap != null) { q.text = cap; q.sub = cap; } }
  const safe = { top: 0, bottom: 0, left: 0, right: 0, ...(spec.safe || {}) };   // 让开的边（px）：管线烧录字幕、平台 UI 压在这里，带字的语法不往里排
  const box = { x: safe.left, y: safe.top, w: W - safe.left - safe.right, h: H - safe.top - safe.bottom };   // 让开之后的内容框，语法排版用它（ctx.box）
  const ctx = { spec, data: spec.data || {}, theme: spec.theme || {}, cues, W, H, FPS, u: Math.min(W, H) / 1080, portrait: H > W, alpha: !!spec.alpha, IMG, dur: spec.duration, safe, box,
    of: (...kinds) => cues.filter(q => kinds.includes(q.kind)), lt: (t, at) => C.lt(t, at, FPS), p: (t, at, d) => C.p(t, at, d, FPS),
    // 素材：still = 定版式用的那张（image，或 frames 的第一帧）；frame = t 时刻画哪一帧（frames 从 at 起按 q.fps（默认 30）播，播完停在最后一帧，q.loop 循环）
    still: q => q && (q.image ? IMG[q.image] : q.frames ? IMG[q.frames[0]] : null),
    frame: (q, t) => !q ? null : q.frames ? MD.frameAt(q.frames.map(f => IMG[f]), t - q.at, q.fps || 30, !!q.loop) : q.image ? IMG[q.image] : null };
  if (G.fonts) { const txt = cues.map(q => [q.text, q.sub, q.data && q.data.text].filter(Boolean).join('')).join('') + JSON.stringify(spec.data || {});
    for (const fam of G.fonts) { const miss = U.missingGlyphs(fam, [...txt].filter(ch => ch.codePointAt(0) >= 0x2E80).join(''));   /* 只查汉字与全角符号：拉丁/希腊/数学符号各语法另有字体 */ if (miss.length) console.warn(`字体「${fam}」缺字：${miss.join('')}（会回退系统字体；常用字已在 GB2312 子集里，生僻字用 scripts/font_subset.py --text 补）`); } }
  if (spec.safe && (safe.top || safe.bottom || safe.left || safe.right) && !G.safe)
    console.warn(`语法 ${spec.grammar} 还没接 safe（语法对象里没有 safe: true），spec.safe 被忽略：字幕带可能压在字上`);
  if (G.init) G.init(ctx);
  window.CLIP_CTX = ctx;
  window.__total = spec.duration; window.__fps = FPS; window.__size = [W, H];
  // safe.fill：让开的边涂成这个颜色（竖屏片把图表做成和相邻 contain 素材同一块「卡片」，外面是片子的底色）；透明模式下不涂
  const band = (safe.fill && !spec.alpha) ? (cc => { cc.fillStyle = safe.fill; const { top: t0, bottom: b0, left: l0, right: r0 } = safe;
    if (t0) cc.fillRect(0, 0, W, t0); if (b0) cc.fillRect(0, H - b0, W, b0); if (l0) cc.fillRect(0, 0, l0, H); if (r0) cc.fillRect(W - r0, 0, r0, H); }) : null;
  window.renderFrame = t => { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); c.save(); G.draw(c, t, ctx); c.restore(); if (band) band(c); };
  window.prepare = async () => {};
  window.__ready = true;
  window.renderFrame(0);
  const sc = document.getElementById('scrub'), tt = document.getElementById('tt'); sc.max = spec.duration; sc.step = 1 / FPS;
  sc.oninput = () => { window.renderFrame(+sc.value); tt.textContent = (+sc.value).toFixed(3); };
}
boot().catch(e => fail(String(e && e.stack || e)));
})();
