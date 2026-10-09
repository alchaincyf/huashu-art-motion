// 渲染器与光影：网点、点彩、赛璐珞、漫画阴影、体积、长影子、双版本光影、光照图、皮影皮件、手剪位移。全部挂在 PAINT（P）上。
// 来源：迁移测试 B（构成主义/达利/霍珀/吉卜力）、C（Kirby/修拉/马蒂斯）、D（伦勃朗/皮影/新海诚）。
//   P.halftoneGray(c, src, bx,by,bw,bh, cell, col, gain, ang)  灰度照片网点：45° 网格、点径 ∝ √暗度、全部点并成一条 path 一次填（照片拼贴）
//   P.shadeDots(c, path, bx,by,bw,bh, cell, col, f)           路径内按函数 f(x,y)∈0..1 落网点（网点阴影）
//   P.dotPattern(c, key, pitch, r, col, bg, angleDeg)          本戴点 createPattern，带网屏角（四色印刷 C15° M75° Y0° K45°）
//   P.pointillism(c, src, opt)                                 修拉点彩＝视觉混色：等大点、纯色板两两并置逼近目标色（P.dabs 是印象派，不是点彩）
//   P.clipBeside(c, path, dx, dy)                              clip 到「path 减去平移后的自身」——赛璐珞阴影带、Kirby 黑块、亮边的公共底
//   P.cel(c, p, base, shade, rim, opt)                         赛璐珞两调＋边缘光（新海诚、吉卜力角色）
//   P.kirbyShade(g, path, opt)                                 Kirby 黑块阴影（spotted blacks）＋羽化排线（feathering）
//   P.vol(c, path, x0,y0,x1,y1, a, b, occl, blur)              体积填色：线性渐变＋路径内模糊暗边（学院派，无勾线）
//   P.castShadow(c, layers, opt)                               剪切仿射长影子：剪影投到地面（达利的长影子、黄昏）
//   P.litClip(c, polys, drawLit)                               双版本光影裁切：背光版先画好，光斑多边形里画受光版（霍珀的硬光块）
//   P.pool / P.lightMap / P.applyLight                         光照图整幅相乘：环境光打底＋lighter 叠光池＋multiply（伦勃朗、烛光、夜景）
//   P.carve / P.piece / P.stamp                                皮影：皮件填色→镂空刻纹→补皮边→描边；印到幕布 = 软影＋multiply（剪影/镂空类风格）
//   P.roughen(layer, box, opt)                                 整层低频像素位移：RIG 角色的边也像手剪的（马蒂斯）
//   P.glowStroke(c, col, w, blur)                              霓虹灯管：对当前路径用 shadowBlur 描辉光（再描一道近白细芯线就是灯管）
(() => {
const TAU = Math.PI * 2;
let W = 1920, H = 1080; U.onStage((w, h) => { W = w; H = h; });   // 画布尺寸跟 U.setStage 走（默认 1920×1080）
const P = window.PAINT;
const { clamp, lerp, rng } = U;

// ---------- 网点 ----------
P.halftoneGray = (c, src, bx, by, bw, bh, cell, col, gain = 0.78, ang = Math.PI / 4) => {
  bx |= 0; by |= 0; bw |= 0; bh |= 0;
  const d = src.getContext('2d', { willReadFrequently: true }).getImageData(bx, by, bw, bh).data;
  const ca = Math.cos(ang), sa = Math.sin(ang), cx = bx + bw / 2, cy = by + bh / 2, R = Math.hypot(bw, bh) / 2;
  c.beginPath();
  for (let v = -R; v <= R; v += cell) for (let u = -R; u <= R; u += cell) {
    const x = cx + u * ca - v * sa, y = cy + u * sa + v * ca, ix = (x - bx) | 0, iy = (y - by) | 0;
    if (ix < 0 || iy < 0 || ix >= bw || iy >= bh) continue;
    const i = (iy * bw + ix) * 4; if (d[i + 3] < 128) continue;
    const L = (d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11) / 255, r = cell * gain * Math.sqrt(Math.max(0, 1 - L));
    if (r < 0.45) continue; c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU);
  }
  c.fillStyle = col; c.fill();
};
P.shadeDots = (c, path, bx, by, bw, bh, cell, col, f) => {
  c.save(); c.clip(path); c.beginPath();
  for (let y = by; y < by + bh; y += cell) for (let x = bx + ((((y - by) / cell) | 0) % 2) * cell / 2; x < bx + bw; x += cell) {
    const r = cell * 0.62 * f(x, y); if (r < 0.5) continue; c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU);
  }
  c.fillStyle = col; c.fill(); c.restore();
};
P.dotPattern = (c, key, pitch, r, col, bg, angleDeg = 45) => {
  const tile = P.cached('dotpat_' + key, pitch, pitch, g => { if (bg) { g.fillStyle = bg; g.fillRect(0, 0, pitch, pitch); } g.fillStyle = col;
    [[0, 0], [pitch, 0], [0, pitch], [pitch, pitch]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }); });
  const p = c.createPattern(tile, 'repeat');
  p.setTransform(new DOMMatrix().rotate(angleDeg));
  return p;
};

// ---------- 点彩（修拉：视觉混色） ----------
// 固定六角网格、点等大（pitch 10、rad 4.5、位置 ±1.2px 静态抖）；每个点从纯色板 pal 里挑一对 (i,j)：
//   目标色投影到 Pj→Pi 上得连续比例 w（clamp .2–.8），距离加 0.004·|Pi−Pj|² 惩罚（别用黑白点混出灰），格子哈希 < w 选 i 否则 j。
// 取色前给目标色加 ±colorJitter 哈希抖动——配对色分界变成交错的点，不出竖向色带（两个坑都踩过：偏好纯色→色带；连续比例→整列切换）。
// compRate 的点换成补色 comp[idx]；光渗：和 (+14,+6) 处亮度差 >45 时，亮侧放 white 点、暗侧放 dark 点。
// shimmer(x,y) 为真的区域按 fps 重掷哈希（水面波光）；flicker 比例的点按 fps 换成配对色（空气在颤，太低会被判「基本定格」）。
// 色板要带淡色（和白混过的色），否则亮墙被拆成白＋肤色＋零星蓝点，像雪花噪声。约 2.4 万点、每色一条 Path2D 一次 fill，每帧约 100ms。
const pointCache = new WeakMap();
P.pointillism = (c, src, { pal, comp = {}, pitch = 10, rad = 4.5, posJitter = 2.4, colorJitter = 40, compRate = 0.08, flicker = 0.07, fps = 6, t = 0, shimmer, white = 12, dark = 0, bleed = 45 } = {}) => {
  const PAL = pal.map(v => typeof v === 'string' ? P.hex(v) : v);
  let cache = pointCache.get(pal); if (!cache) { cache = new Map(); pointCache.set(pal, cache); }
  const pick = (r, g, b) => {
    const key = (r >> 3) << 10 | (g >> 3) << 5 | (b >> 3);
    let v = cache.get(key); if (v) return v;
    let best = 1e18, bi = 0, bj = 0, bw = 1;
    for (let i = 0; i < PAL.length; i++) for (let j = i + 1; j < PAL.length; j++) {
      const pi = PAL[i], pj = PAL[j], ex = pi[0] - pj[0], ey = pi[1] - pj[1], ez = pi[2] - pj[2];
      const w = clamp(((r - pj[0]) * ex + (g - pj[1]) * ey + (b - pj[2]) * ez) / (ex * ex + ey * ey + ez * ez + 1e-6), 0.2, 0.8);
      const dr = pj[0] + w * ex - r, dg = pj[1] + w * ey - g, db = pj[2] + w * ez - b;
      const d = dr * dr * 0.9 + dg * dg * 1.2 + db * db * 0.8 + ex * ex * 0.004 + ey * ey * 0.004 + ez * ez * 0.004;
      if (d < best) { best = d; bi = i; bj = j; bw = w; }
    }
    v = [bi, bj, bw]; cache.set(key, v); return v;
  };
  const sd = src.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data;
  const L = (x, y) => { const i = (clamp(y | 0, 0, H - 1) * W + clamp(x | 0, 0, W - 1)) * 4; return sd[i] * 0.3 + sd[i + 1] * 0.59 + sd[i + 2] * 0.11; };
  const paths = PAL.map(() => new Path2D()), st = Math.floor(t * fps), ROWH = pitch * 0.866, hj = posJitter / 2;
  for (let j = 0, y = 0; y < H + ROWH; j++, y += ROWH) for (let i = 0, x = (j % 2) * pitch / 2; x < W + pitch; i++, x += pitch) {
    const jx = (U.hash(i, j * 7 + 1) - 0.5) * 2 * hj, jy = (U.hash(i * 3, j + 5) - 0.5) * 2 * hj, px = x + jx, py = y + jy;
    const k = (clamp(py | 0, 0, H - 1) * W + clamp(px | 0, 0, W - 1)) * 4;
    const dj = (U.hash(i * 7 + 3, j * 11) - 0.5) * colorJitter;
    const [a, bb, w] = pick(clamp(sd[k] + dj, 0, 255), clamp(sd[k + 1] + dj * 0.8, 0, 255), clamp(sd[k + 2] - dj * 0.6, 0, 255));
    const hseed = shimmer && shimmer(px, py) ? U.hash(i + st * 977, j) : U.hash(i, j);
    let idx = hseed < w ? a : bb;
    const h2 = U.hash(i * 5 + 2, j * 3 + 9);
    if (h2 < compRate && comp[idx] != null) idx = comp[idx];
    else if (U.hash(i * 13 + st * 31, j * 17) < flicker) idx = (U.hash(i, j + st) < w) ? bb : a;
    else { const dl = L(px, py) - L(px + 14, py + 6); if (Math.abs(dl) > bleed && h2 < 0.45) idx = dl > 0 ? white : dark; }
    paths[idx].moveTo(px + rad, py); paths[idx].arc(px, py, rad, 0, TAU);
  }
  paths.forEach((p, k) => { c.fillStyle = P.rgb(PAL[k]); c.fill(p); });
};

// ---------- 赛璐珞 / 漫画阴影 ----------
let BIG; U.onStage((w, h) => { BIG = new Path2D(); BIG.rect(-60, -60, w + 120, h + 120); });   // 比画布四边各大 60px 的矩形，跟画布尺寸走
// clip 到 path ∩ ¬translate(path, dx, dy)：沿 (dx,dy) 方向的那一侧之外留下一条带（光从 -(dx,dy) 来时就是背光侧的阴影带）
P.clipBeside = (c, path, dx, dy) => { const m = new Path2D(); m.addPath(BIG); m.addPath(path, new DOMMatrix().translate(dx, dy)); c.clip(path); c.clip(m, 'evenodd'); };
// 底色 → 背光侧硬阴影带（宽 sd，光方向 (lx,ly) 指向光源的反方向：lx=-1 光从左来、阴影在右）→ 受光侧亮边（宽 rw）→ 细描线。
// 按部件顺序逐个 cel，遮挡天然正确，不需要 visibleLines。逆光（窗下的猫）：lx/ly 取反并另加 lighter 暖色亮边。
P.cel = (c, p, base, shade, rim, { sd = 22, rw = 7, line = '#6a4632', lw = 2.2, lx = -1, ly = -0.55 } = {}) => {
  if (!p) return;
  c.fillStyle = base; c.fill(p);
  if (shade) { c.save(); P.clipBeside(c, p, lx * sd, ly * sd); c.fillStyle = shade; c.fill(p); c.restore(); }
  if (rim) { c.save(); P.clipBeside(c, p, -lx * rw, -ly * rw); c.fillStyle = rim; c.fill(p); c.restore(); }
  if (lw) { c.strokeStyle = line; c.lineWidth = lw; c.lineJoin = 'round'; c.stroke(p); }
};
// Kirby：light 指向光源（默认左上），黑块 = path ∩ ¬shift(d1)，羽化带 = path ∩ ¬shift(d2) 里沿光方向的平行线（间距 gap）
P.kirbyShade = (g, path, { d1 = 14, d2 = 30, gap = 9, light = [-0.86, -0.5], ink = '#141212', lw = 2.6 } = {}) => {
  g.save(); P.clipBeside(g, path, light[0] * d2, light[1] * d2);
  g.strokeStyle = ink; g.lineWidth = lw; g.lineCap = 'butt'; g.beginPath();
  const a = Math.atan2(light[1], light[0]), nx = -Math.sin(a), ny = Math.cos(a);
  for (let k = -260; k < 260; k++) { const ox = 960 + nx * k * gap, oy = 540 + ny * k * gap; g.moveTo(ox - light[0] * 1400, oy - light[1] * 1400); g.lineTo(ox + light[0] * 1400, oy + light[1] * 1400); }
  g.stroke(); g.restore();
  g.save(); P.clipBeside(g, path, light[0] * d1, light[1] * d1); g.fillStyle = ink; g.fillRect(0, 0, W, H); g.restore();
};

// ---------- 体积 / 影子 / 光 ----------
P.vol = (c, path, x0, y0, x1, y1, a, b, occl = 'rgba(40,20,10,.45)', blur = 14) => {
  const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b);
  c.fillStyle = g; c.fill(path);
  if (occl) { c.save(); c.clip(path); c.shadowColor = occl; c.shadowBlur = blur; c.strokeStyle = occl; c.lineWidth = blur * 0.6; c.stroke(path); c.restore(); }
};
// layers: [[yg, g => { 在 g 上用黑色画这一组物体的剪影 }], ...]，yg 是这组物体的着地线。
// 剪切仿射 y' = yg − ky·(yg − y)、x' = x − kx·(y' 方向的高度)，影子往右后方躺（太阳在左前方低空）；kx 变大 = 影子变长（黄昏）。
// 所有剪影先画进一张离屏（纯黑）再整体以 alpha 叠，重叠处不会加深；clipY 以下才是地面。坑：ky>0 往观众方向投会被画框底边吃掉。
P.castShadow = (c, layers, { kx = 1, ky = 0.22, clipY = 0, alpha = 0.55, blur = 1.5, key = 'castShadow' } = {}) => {
  const S = P.scratch(key), g = S.getContext('2d'); g.reset(); g.clearRect(0, 0, W, H); g.fillStyle = '#000'; g.strokeStyle = '#000';
  for (const [yg, fn] of layers) { g.setTransform(1, 0, -kx, ky, kx * yg, yg * (1 - ky)); fn(g); }
  g.setTransform(1, 0, 0, 1, 0, 0);
  c.save(); c.beginPath(); c.rect(0, clipY, W, H); c.clip(); c.globalAlpha = alpha; if (blur) c.filter = `blur(${blur}px)`; c.drawImage(S, 0, 0); c.restore();
};
// 双版本光影裁切：先把整幅画成背光版，再 clip 到光斑多边形（可多个、可每帧平移）画受光版 → 光影边缘是硬的、能整体移动。
// 人物同理：drawLit 里用受光色再画一遍。人在墙上的投影＝剪影平移后 source-in 背光版，再画回光斑里。
P.litClip = (c, polys, drawLit) => {
  c.save(); c.beginPath(); polys.forEach(pp => { pp.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); }); c.clip(); drawLit(c); c.restore();
};
// 光池：径向渐变的一团光（col 为 'r,g,b' 字符串）
P.pool = (g, x, y, r, col, a) => { const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, `rgba(${col},${a})`); rg.addColorStop(0.45, `rgba(${col},${a * 0.55})`); rg.addColorStop(1, `rgba(${col},0)`); g.fillStyle = rg; g.fillRect(x - r, y - r, 2 * r, 2 * r); };
// 光照图：ambient 打底（环境光，伦勃朗约 rgb(30,21,13) = 0.13），fn(g) 里用 P.pool 叠光池（已是 lighter），返回画布
P.lightMap = (key, ambient, fn) => {
  const S = P.scratch('light_' + key), g = S.getContext('2d'); g.reset();
  g.fillStyle = ambient; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'lighter'; fn(g); g.globalCompositeOperation = 'source-over';
  return S;
};
// 整幅乘光：亮态底稿 × 光照图。所有明暗法、烛光、夜景都这么做——比逐个物体画明暗统一得多。
P.applyLight = (c, map) => { c.save(); c.globalCompositeOperation = 'multiply'; c.drawImage(map, 0, 0); c.restore(); };

// ---------- 皮影 / 镂空 ----------
// 刻纹库（在 clip 内用 destination-out 画）：dots 鱼子纹、flowers 团花、clouds 云纹、lattice 方格、lines 刻线
P.carve = {
  dots(g, x0, y0, x1, y1, s = 18, r = 3.2) { for (let y = y0; y < y1; y += s) for (let x = x0 + ((y / s | 0) % 2) * s / 2; x < x1; x += s) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } },
  flowers(g, x0, y0, x1, y1, s = 46, r = 5) { for (let y = y0; y < y1; y += s) for (let x = x0 + ((y / s | 0) % 2) * s / 2; x < x1; x += s) { for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; g.beginPath(); g.ellipse(x + Math.cos(a) * r * 1.5, y + Math.sin(a) * r * 1.5, r, r * 0.6, a, 0, 7); g.fill(); } } },
  clouds(g, x0, y0, x1, y1, s = 40) { g.lineWidth = 3.4; g.lineCap = 'round'; for (let y = y0; y < y1; y += s) for (let x = x0 + ((y / s | 0) % 2) * s / 2; x < x1; x += s) { g.beginPath(); for (let a = 0; a < 7; a += 0.3) { const rr = 2 + a * 1.9; const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; a ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); } },
  lattice(g, x0, y0, x1, y1, s = 26, w = 12) { for (let y = y0; y < y1; y += s) for (let x = x0; x < x1; x += s) g.fillRect(x + (s - w) / 2, y + (s - w) / 2, w, w); },
  lines(g, segs, w = 3.2) { g.lineWidth = w; g.lineCap = 'round'; segs.forEach(sg => { g.beginPath(); sg.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.stroke(); }); },
};
// 一块皮件：填色 → carve(g) 在 clip 内镂空 → 补 edge 宽的同色皮边（刻纹不刻穿外轮廓）→ 深色描边。
// 白色部位（猫的白胸白爪）直接整块镂空只留皮边——所有剪影/镂空类风格都适用。
P.piece = (g, path, col, carve, { edge = 5, line = '#3a160a', lw = 2.6 } = {}) => {
  g.save(); g.fillStyle = col; g.fill(path);
  if (carve) { g.save(); g.clip(path); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.strokeStyle = '#000'; carve(g); g.restore(); }
  g.strokeStyle = col; g.lineWidth = edge * 2; g.lineJoin = 'round'; g.save(); g.clip(path); g.stroke(path); g.restore();
  g.strokeStyle = line; g.lineWidth = lw; g.stroke(path); g.restore();
};
// 把一层皮件印到幕布上：先 multiply 一层偏移软影（皮件没贴紧幕布的虚影），再 multiply 本体（透光 = 幕布色 × 皮色，重叠处自然变深）
P.stamp = (c, layer, { dx = 7, dy = 5, shadow = 0.28, blur = 6 } = {}) => {
  c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = shadow; c.filter = `blur(${blur}px)`; c.drawImage(layer, dx, dy); c.restore();
  c.save(); c.globalCompositeOperation = 'multiply'; c.drawImage(layer, 0, 0); c.restore();
};

// ---------- 霓虹 ----------
P.glowStroke = (c, col, w, blur) => { c.shadowColor = col; c.shadowBlur = blur; c.strokeStyle = col; c.lineWidth = w; c.stroke(); c.shadowBlur = 0; };

// ---------- 手剪位移 ----------
// 对 layer 的 box=[x0,y0,x1,y1] 区域做静态低频位移（fbm 频率 freq、幅度 amp px）：RIG 角色不给剪刀折线时，整层边缘也像手剪的。约 15ms。
const fields = {};
P.roughen = (layer, box, { freq = 0.028, amp = 9, key = 'rough' } = {}) => {
  const [X0, Y0, X1, Y1] = box, w = X1 - X0, h = Y1 - Y0, fk = `${key}|${box}|${freq}|${amp}`;
  const f = fields[fk] || (fields[fk] = (() => { const o = { dx: new Int8Array(w * h), dy: new Int8Array(w * h) };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const gx = (x + X0) * freq, gy = (y + Y0) * freq; o.dx[y * w + x] = Math.round(P.fbm(gx, gy, 2) * amp); o.dy[y * w + x] = Math.round(P.fbm(gx + 40, gy + 17, 2) * amp); } return o; })());
  const g = layer.getContext('2d', { willReadFrequently: true });
  const src = g.getImageData(X0, Y0, w, h), out = g.createImageData(w, h), s = src.data, o = out.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = y * w + x, sx = clamp(x + f.dx[k], 0, w - 1), sy = clamp(y + f.dy[k], 0, h - 1), j = (sy * w + sx) * 4, i = k * 4;
    o[i] = s[j]; o[i + 1] = s[j + 1]; o[i + 2] = s[j + 2]; o[i + 3] = s[j + 3]; }
  g.putImageData(out, X0, Y0);
};
})();
