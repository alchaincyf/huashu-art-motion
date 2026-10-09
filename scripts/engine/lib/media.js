// 真实素材 MD：把截图、照片、录像帧放进画面当主体。解说片里有真实素材就让它满幅当主画面，代码负责解释、标注和运镜。
// 出处：两支被认可的片子——一支把照片满幅铺开再按口播节点快推（cover），一支把照片冲印成带白边的件摆在调查桌上、配黑底撕边标签。
// 约定：素材缺失一律报错（throw → render.py / qa.py 判失败），不静默画空白；所有参数由调用方用时间算好传进来，本库不读时钟。
//
//   MD.size(src)                                  素材的像素尺寸 [w, h]（图片 / 视频帧 / canvas 都行）；缺失或没加载完 → throw
//   MD.cover(c, src, o) → geo                     满幅铺开：等比放大到盖满框（裁掉多出的边），按焦点裁、按 z 推近
//       o = { x=0, y=0, w=画宽, h=画高（框）, fx=.5, fy=.5（焦点，0..1 相对素材：裁切和推近都绕它）, z=1（推近倍数，≥1）,
//             crop:[sx,sy,sw,sh]（先取素材的这一块，0..1）, fit:'cover'|'contain'（contain = 整张放进框里、不裁，留边）, clip=true }
//       返回 geo = { x, y, w, h（素材在画面上的矩形）, s（缩放）, box }，配 MD.toScreen 把素材上的点/框换算到画面
//   MD.toScreen(geo, r)                           素材上 0..1 的点 [u,v] 或框 [u,v,w,h] → 画面坐标（[x,y] 或 {x,y,w,h}）
//   MD.focusFor(rect) → {fx, fy}                  框 [u,v,w,h] 的中心当焦点
//   MD.zoomFor(rect, iw, ih, bw, bh, fill=.6, fit='cover') → z    要让素材上的框 rect 占框宽/高的 fill，cover 之上还要推几倍（≥1）
//   MD.print(c, src, w, h, o)                     冲印件：白边＋旧纸色＋投影＋胶带，原点在冲印件中心（调用方先 translate/rotate）
//       o = { border=16·u, crop, fx, fy（按焦点 cover 进 w×h）, tape=true, caption（白边下方小字）, polaroid=false（底边加宽、caption 写在底边里）,
//             shadow=true, key（给了 key 且素材是静态图就缓存成位图）}
//   MD.label(c, text, x, y, o)                    黑底撕边标签：o = { size=48·u, fam='PuHui-Heavy', bg='#191817', fg='#f3efe6', align='left'|'center'|'right',
//             t, at（at 这一帧出现：先 1.12 倍一拍再落定，字按 rate 字/秒、12fps 打出；不给 t 就直接画完整的）, rate=14, r（旋转）}
//       返回 {w, h}
//   MD.frameAt(frames, lt, fps=30, loop=false)    帧序列（图片数组）在片内时间 lt 的那一帧；缺帧 → throw
(() => {
let W = 1920, H = 1080; U.onStage((w, h) => { W = w; H = h; });   // 画布尺寸跟 U.setStage 走（默认 1920×1080）
const { clamp } = U;
const MD = window.MD = {};
const u0 = () => Math.min(W, H) / 1080;

MD.size = src => {
  if (!src) throw new Error('MD：素材缺失（图片没加载或路径写错）——不画空白帧');
  const w = src.videoWidth || src.naturalWidth || src.width, h = src.videoHeight || src.naturalHeight || src.height;
  if (!(w > 0 && h > 0)) throw new Error(`MD：素材尺寸是 0（还没加载完或解不开）：${src.src || src.currentSrc || src}`);
  return [w, h];
};

MD.cover = (c, src, o = {}) => {
  const [iw0, ih0] = MD.size(src);
  const bx = o.x ?? 0, by = o.y ?? 0, bw = o.w ?? W, bh = o.h ?? H, fx = o.fx ?? 0.5, fy = o.fy ?? 0.5, z = Math.max(1e-3, o.z ?? 1);
  const cr = o.crop || [0, 0, 1, 1], sx = cr[0] * iw0, sy = cr[1] * ih0, iw = cr[2] * iw0, ih = cr[3] * ih0;
  const s0 = (o.fit === 'contain' ? Math.min : Math.max)(bw / iw, bh / ih), s = s0 * z, w = iw * s, h = ih * s;
  // 焦点：cover 时让焦点尽量落在框的同一相对位置（不露边）；推近绕焦点
  const ax = bx + bw * fx, ay = by + bh * fy;
  let x = ax - w * fx, y = ay - h * fy;
  if (o.fit !== 'contain') { x = Math.min(bx, Math.max(bx + bw - w, x)); y = Math.min(by, Math.max(by + bh - h, y)); }
  else if (z <= 1) { x = bx + (bw - w) / 2; y = by + (bh - h) / 2; }
  c.save();
  if (o.clip !== false) { c.beginPath(); c.rect(bx, by, bw, bh); c.clip(); }
  c.drawImage(src, sx, sy, iw, ih, x, y, w, h);
  c.restore();
  return { x, y, w, h, s, box: { x: bx, y: by, w: bw, h: bh } };
};

MD.toScreen = (geo, r) => r.length === 2 ? [geo.x + r[0] * geo.w, geo.y + r[1] * geo.h]
  : { x: geo.x + r[0] * geo.w, y: geo.y + r[1] * geo.h, w: r[2] * geo.w, h: r[3] * geo.h };
MD.focusFor = r => ({ fx: r[0] + r[2] / 2, fy: r[1] + r[3] / 2 });
MD.zoomFor = (rect, iw, ih, bw = W, bh = H, fill = 0.6, fit = 'cover') => {
  const s0 = (fit === 'contain' ? Math.min : Math.max)(bw / iw, bh / ih), rw = rect[2] * iw * s0, rh = rect[3] * ih * s0;
  return Math.max(1, Math.min(bw * fill / rw, bh * fill / rh));
};

const printCache = {};
MD.print = (c, src, w, h, o = {}) => {
  const u = u0(), b = o.border ?? 16 * u, bot = o.polaroid ? Math.max(b * 4, h * 0.2) : b, PW = w + 2 * b, PH = h + b + bot;
  const paint = g => {
    g.fillStyle = '#f7f5ef'; g.fillRect(0, 0, PW, PH);
    const f = o.crop ? null : MD.focusFor([o.fx ?? 0.5, o.fy ?? 0.5, 0, 0]);
    MD.cover(g, src, { x: b, y: b, w, h, crop: o.crop, fx: f ? f.fx : 0.5, fy: f ? f.fy : 0.5 });
    g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(214,205,185,.16)'; g.fillRect(0, 0, PW, PH); g.restore();   // 印在纸上：压一层旧纸色
    if (o.polaroid && o.caption) { g.save(); g.fillStyle = '#2b2925'; g.font = `${Math.min(bot * 0.42, 40 * u)}px "LXGWWenKai-500", "PuHui-Medium"`; g.textBaseline = 'middle'; g.fillText(o.caption, b * 1.2, b + h + bot / 2); g.restore(); }
  };
  MD.size(src);
  let sp;
  if (o.key && !(src instanceof HTMLVideoElement)) { const k = `${o.key}|${Math.round(PW)}x${Math.round(PH)}`; sp = printCache[k] || (printCache[k] = (() => { const cv = document.createElement('canvas'); cv.width = Math.ceil(PW); cv.height = Math.ceil(PH); paint(cv.getContext('2d')); return cv; })()); }
  c.save();
  if (o.shadow !== false) { c.shadowColor = 'rgba(30,22,10,.32)'; c.shadowBlur = 14 * u; c.shadowOffsetX = 3 * u; c.shadowOffsetY = 8 * u; }
  if (sp) c.drawImage(sp, -PW / 2, -PH / 2);
  else { c.translate(-PW / 2, -PH / 2); c.fillStyle = '#f7f5ef'; c.fillRect(0, 0, PW, PH); c.shadowColor = 'transparent'; paint(c); }
  c.restore();
  if (o.tape !== false && window.CL) { CL.tape(c, -w / 2 + 30 * u, -PH / 2 + 6 * u, -0.6, 110 * u); CL.tape(c, w / 2 - 30 * u, -PH / 2 + 6 * u, 0.55, 110 * u); }
  if (o.caption && !o.polaroid) { c.save(); c.font = `${22 * u}px "PuHui-Medium"`; c.fillStyle = 'rgba(40,36,30,.78)'; c.textBaseline = 'top'; c.fillText(o.caption, -PW / 2, PH / 2 + 10 * u); c.restore(); }
  return { w: PW, h: PH };
};

const labCache = {};
MD.label = (c, text, x, y, o = {}) => {
  text = String(text ?? ''); if (!text) return { w: 0, h: 0 };
  const u = u0(), size = o.size ?? 48 * u, fam = o.fam || 'PuHui-Heavy', bg = o.bg || '#191817', fg = o.fg || '#f3efe6';
  if (o.t != null && o.at != null && o.t < o.at) return { w: 0, h: 0 };
  c.save(); c.font = `${size}px "${fam}"`;
  const tw = c.measureText(text).width, padX = size * 0.42, w = Math.round(tw + padX * 2), h = Math.round(size * 1.5);
  const key = `${text}|${size}|${fam}|${bg}`;
  const sp = labCache[key] || (labCache[key] = (() => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
    if (window.CL) CL.tornRect(g, w, h, [...text].length * 7 + Math.round(size), 3 * u); else { g.beginPath(); g.rect(0, 0, w, h); }
    g.fillStyle = bg; g.fill(); return cv; })());
  const k = o.t != null && o.at != null ? MO.step(o.t - o.at + 1e-6, 12) : 1e9;     // 一拍二：从 at 起算，at 这一帧就是第一帧
  const pop = k < 1 / 12 ? 1.12 : 1, ox = o.align === 'center' ? -w / 2 : o.align === 'right' ? -w : 0;
  c.translate(x, y); if (o.r) c.rotate(o.r); c.scale(pop, pop);
  c.drawImage(sp, ox, -h / 2);
  const n = o.t != null && o.at != null ? Math.ceil((k + 1 / 12) * (o.rate || 14)) : 1e9;
  c.fillStyle = fg; c.textBaseline = 'middle'; c.textAlign = 'left';
  c.fillText([...text].slice(0, n).join(''), ox + padX, size * 0.04);
  c.restore();
  return { w, h };
};

MD.frameAt = (frames, lt, fps = 30, loop = false) => {
  if (!frames || !frames.length) throw new Error('MD.frameAt：帧序列是空的');
  let i = Math.floor(Math.max(0, lt) * fps + 1e-6);
  i = loop ? i % frames.length : Math.min(frames.length - 1, i);
  const im = frames[i]; MD.size(im); return im;
};
})();
