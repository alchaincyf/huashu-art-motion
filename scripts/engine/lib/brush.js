// 笔与水：毛笔飞白、两头尖单笔、墨晕晕染、长弯流线笔、水彩洗染、厚涂鬃毛笔、剪刀折线。全部挂在 PAINT（P）上。
// 来源：迁移测试 A（水墨/蒙克）、B（吉卜力）、C（马蒂斯）、D（伦勃朗）。确定性：所有随机都走种子。
//   P.brush(c, pts, opt)            毛笔：笔压起收＋湿笔芯＋逐根笔毛飞白，可按 reveal 写出（水墨、书法、白描衣纹）
//   P.leaf(c, x, y, ang, L, w)      两头尖的单笔（竹叶、兰叶、鸟翅、虾尾）
//   P.inkWash(c, key, grow, fn, o)  墨晕：形状先画到 scratch，再「外晕＋本体」两遍模糊 multiply 到纸上，grow 0→1 是洇开
//   P.flowSeeds / P.flowLines       长弯流线笔：种子沿随时间扭动的方向场积分成 200–300px 的长笔（蒙克，不是梵高的短笔）
//   P.deform / P.watercolor         水彩洗染：中点位移变形多边形 × 多层低 α multiply ＋ 每层淡描边＝水痕边（吉卜力背景）
//   P.rectPts / P.ellipsePts        洗染常用的多边形点列
//   P.impasto(c, pts, w, col, hi)   厚涂鬃毛笔：一笔＝若干平行细鬃（伦勃朗高光、梵高厚涂补笔）
//   P.cut(pts, seed, step, amp)     剪刀折线：沿轮廓每 step px 取点＋抖动、直线相连（马蒂斯剪纸、剪影、木刻）
(() => {
let W = 1920, H = 1080; U.onStage((w, h) => { W = w; H = h; });   // 画布尺寸跟 U.setStage 走（默认 1920×1080）
const P = window.PAINT;
const { clamp, lerp, rng, ss } = U;

// ---------- 毛笔 ----------
// pts 控制点（会 Catmull-Rom 加密再按 4px 等弧长重采样——不重采样的话飞白噪声频率随笔画长短变）
// w 最大宽；tone 墨色透明度（焦 .9／浓 .8／重 .6／淡 .35／清 .15）；dry 0..1 飞白程度（越到笔尾越干）；reveal 0..1 写出比例
// head/tail 起笔/收笔占比；bristles 笔毛数；col 墨色 [r,g,b]；per 加密倍数
// 坑：笔毛必须每根一条连续 path（butt 头）；按小段单独 stroke＋round 头，接头处会叠出一节节深点，像竹节/麻绳。
P.brush = (c, pts, { w = 10, tone = 0.85, dry = 0.45, seed = 1, reveal = 1, bristles = 8, col = [16, 14, 12], head = 0.12, tail = 0.4, per = 5 } = {}) => {
  if (reveal <= 0) return;
  const D = KIT.resample(KIT.densify(pts, per), 4), n = D.length, m = Math.max(2, Math.ceil(n * clamp(reveal)));
  const r = rng(seed * 7919);
  const prof = q => ss(0, head, q) * (1 - 0.7 * ss(1 - tail, 1, q)) * (0.85 + 0.15 * P.noise(seed * 3.3, q * 6)) + 0.08;
  c.save(); c.lineCap = 'butt'; c.lineJoin = 'round';
  const N = [];
  for (let i = 0; i < n; i++) { const A = D[Math.max(0, i - 1)], B = D[Math.min(n - 1, i + 1)]; let dx = B[0] - A[0], dy = B[1] - A[1]; const d = Math.hypot(dx, dy) || 1; N.push([-dy / d, dx / d]); }
  const core = q => w * prof(q) * (1 - dry * 0.85 * Math.pow(q, 0.8));
  // 湿的笔芯：整笔都有，越往后越细越淡（墨在用完）
  c.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${tone * 0.72})`; c.fill(KIT.ribbon(D.slice(0, m), (q, i) => core(i / (n - 1))));
  // 笔毛：每根一条连续线，按噪声断开（飞白＝笔毛之间露出的纸），越到笔尾断得越多
  for (let k = 0; k < bristles; k++) {
    const off = (k / (bristles - 1) - 0.5) * 0.95, bw = w / bristles * (0.9 + r() * 0.9), ph = r() * 50;
    c.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${tone * (0.45 + r() * 0.35)})`; c.lineWidth = Math.max(0.7, bw);
    c.beginPath(); let on = false;
    for (let i = 0; i < m; i++) {
      const q = i / (n - 1), dryness = dry * Math.pow(q, 1.2);
      const vis = P.noise(k * 1.9 + ph, i * 0.09) * 0.5 + 0.5 > dryness * 0.95 + 0.05;
      const o = off * w * prof(q), x = D[i][0] + N[i][0] * o, y = D[i][1] + N[i][1] * o;
      if (vis) { on ? c.lineTo(x, y) : c.moveTo(x, y); on = true; } else on = false;
    }
    c.stroke();
  }
  c.restore();
};
// 两头尖的单笔（个字竹叶、兰叶描、鸟翅）：沿 ang 方向长 L，最宽 wmax，微弯
P.leaf = (c, x, y, ang, L, wmax, tone = 0.88, col = [16, 14, 12]) => {
  if (!Array.isArray(col)) col = [16, 14, 12];
  const pts = []; for (let i = 0; i <= 10; i++) { const q = i / 10, bend = Math.sin(q * Math.PI) * 0.08 * L; pts.push([x + Math.cos(ang) * L * q - Math.sin(ang) * bend, y + Math.sin(ang) * L * q + Math.cos(ang) * bend]); }
  c.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${tone})`; c.fill(KIT.ribbon(pts, q => wmax * Math.pow(Math.sin(Math.PI * Math.min(1, q * 1.1)), 0.7) + 0.6));
};

// ---------- 墨晕 / 晕染层 ----------
// fn(g) 在 scratch 上画形状（实色即可）；grow 0..1 控制洇开：外晕 blur 随 grow 变宽，本体 blur 随 grow 收紧。
// halo 外晕模糊半径、haloA 外晕透明度、blur 本体模糊、alpha 整体透明度。返回 scratch（可再拿来做留白挖洞）。
// 坑：multiply 是透明的，背后的墨线会透过晕染（窗台线透过猫耳）。先在剪影里补一层纸色（clip 后 drawImage 纸）再上晕染＝「先留出这块地方」。
P.inkWash = (c, key, grow, fn, { blur = 2, halo = 10, haloA = 0.22, alpha = 1 } = {}) => {
  const S = P.scratch('inkw_' + key), g = S.getContext('2d'); g.reset(); fn(g);
  c.save(); c.globalCompositeOperation = 'multiply';
  if (grow > 0) {
    c.globalAlpha = haloA * alpha * grow; c.filter = `blur(${(halo * (0.4 + grow)).toFixed(2)}px)`; c.drawImage(S, 0, 0);
    c.globalAlpha = alpha * ss(0, 0.6, grow); c.filter = `blur(${(blur * (1.6 - grow * 0.6)).toFixed(2)}px)`; c.drawImage(S, 0, 0);
  }
  c.filter = 'none'; c.restore();
  return S;
};

// ---------- 长弯流线笔（蒙克《呐喊》式表现主义） ----------
// 种子：cell 抖动网格，每个种子带两个随机数 [x, y, r1, r2]
P.flowSeeds = (cell = 24, seed = 5) => { const r = rng(seed), o = []; for (let y = -10; y < H + 10; y += cell) for (let x = -10; x < W + 10; x += cell) o.push([x + (r() - .5) * cell, y + (r() - .5) * cell, r(), r()]); return o; };
// 每个种子：region(x,y,t) 判区 → 取该区参数 params[reg] = [steps, step, width, alpha] → 沿 angle(x,y,t,reg) 积分；越出本区就停（区域边界干净）。
// color(reg, sx, sy, r1, t) 返回 [r,g,b]。不描边、半透明叠色——蒙克是薄涂长笔；照搬梵高的深色描边会变成一节节毛毛虫短笔。
// 底下先铺同色系平涂，笔缝里露出的是同色而不是黑。长度：steps 26–42、step 6–8，一根笔走 200–300px。
P.flowLines = (c, seeds, { t = 0, region, angle, color, params, extraSteps = 8 }) => {
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (const [sx, sy, r1, r2] of seeds) {
    const reg = region(sx, sy, t); const pr = params[reg]; if (!pr) continue; const [steps, step, width, alpha] = pr;
    const col = color(reg, sx, sy, r1, t);
    let x = sx, y = sy; c.beginPath(); c.moveTo(x, y);
    const n = steps + ((r2 * extraSteps) | 0);
    for (let i = 0; i < n; i++) { const a = angle(x, y, t, reg); x += Math.cos(a) * step; y += Math.sin(a) * step; if (region(x, y, t) !== reg) break; c.lineTo(x, y); }
    c.strokeStyle = P.rgb(col, alpha); c.lineWidth = width * (0.7 + r2 * 0.6); c.stroke();
  }
};

// ---------- 水彩洗染（吉卜力式背景美术） ----------
// 中点位移：每轮在每条边中点沿法向推一个近似高斯量（3 个均匀数相加），幅度与边长成比例，每轮 amp×0.6
P.deform = (pts, depth, amp, r) => {
  let out = pts;
  for (let d = 0; d < depth; d++) {
    const n = [];
    for (let i = 0; i < out.length; i++) {
      const a = out[i], b = out[(i + 1) % out.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const g = (r() + r() + r() - 1.5) * amp * Math.min(1, len / 80), nx = -(b[1] - a[1]) / (len || 1), ny = (b[0] - a[0]) / (len || 1);
      n.push(a, [(a[0] + b[0]) / 2 + nx * g, (a[1] + b[1]) / 2 + ny * g]);
    }
    out = n; amp *= 0.6;
  }
  return out;
};
const fillPts = (g, pts) => { g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); };
// 一次洗染：基形 deform 3 轮；每层再 deform 2 轮、低 α 填（multiply = 透明颜料叠色）、α=edge 描 1.6px 同色边（颜料在边缘沉积 = 水痕边）。
// fill 可传渐变；不透明的白（窗框、云、桌布）用 blend:'source-over'、alpha .9。
// 常用：大墙 layers5 α.4 amp12；色晕 layers3 α.045 amp40；木板 layers3 α.5 amp3 edge.14。
// 坑：暗部用大幅变形多边形（amp 60），别用矩形拼——矩形接缝处会出硬边。色晕 α 别超 .05×3 层，否则房间像发霉的羊皮纸。
P.watercolor = (g, pts, color, { layers = 7, alpha = 0.13, amp = 10, seed = 1, edge = 0.1, blend = 'multiply', fill } = {}) => {
  const r = rng(seed * 7919 + 13), base = P.deform(pts, 3, amp, r);
  g.save(); g.globalCompositeOperation = blend; g.lineJoin = 'round';
  for (let k = 0; k < layers; k++) {
    const q = P.deform(base, 2, amp * 0.55, r);
    fillPts(g, q); g.globalAlpha = alpha; g.fillStyle = fill || color; g.fill();
    if (edge) { g.globalAlpha = edge; g.strokeStyle = color; g.lineWidth = 1.6; g.stroke(); }
  }
  g.restore();
};
P.rectPts = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
P.ellipsePts = (cx, cy, rx, ry, n = 18) => Array.from({ length: n }, (_, i) => [cx + Math.cos(i / n * Math.PI * 2) * rx, cy + Math.sin(i / n * Math.PI * 2) * ry]);

// ---------- 厚涂鬃毛笔 ----------
// 一笔 = round(w/1.3) 条平行细鬃（亮度各自 ±17 抖、两端随机缩 0–25%）＋下侧一条淡投影＋上侧零星亮点 → 读成「被刷开的一坨厚颜料」。
// 只用在受光处（金发、领口、瓷器、珍珠、白毛）。坑：画成「暗影＋主笔＋亮脊」三条整齐的线会读成白色贴纸/创可贴。
P.impasto = (c, pts, w, col, hi) => {
  const base = col.startsWith('#') ? P.hex(col) : [240, 230, 210];
  const A = pts[0], B = pts[pts.length - 1], ang = Math.atan2(B[1] - A[1], B[0] - A[0]), nx = -Math.sin(ang), ny = Math.cos(ang);
  const r = rng((A[0] * 13 + A[1] * 7) | 0), nb = Math.max(3, Math.round(w / 1.3));
  c.save(); c.lineCap = 'round';
  c.strokeStyle = 'rgba(40,18,6,.28)'; c.lineWidth = w * 0.9; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0] + nx * w * 0.45 + 1, p[1] + ny * w * 0.45 + 1.5) : c.moveTo(p[0] + nx * w * 0.45 + 1, p[1] + ny * w * 0.45 + 1.5)); c.stroke();
  for (let k = 0; k < nb; k++) {
    const o = (k / (nb - 1) - 0.5) * w, s0 = r() * 0.25, s1 = 1 - r() * 0.25, sh = (r() - 0.5) * 34 + (k < nb / 2 ? 14 : -10);
    c.strokeStyle = P.rgb([base[0] + sh, base[1] + sh, base[2] + sh * 0.8], 0.55 + r() * 0.4); c.lineWidth = 1.4 + r() * 1.2; c.beginPath();
    const n = pts.length - 1; for (let i = 0; i <= 8; i++) { const q = lerp(s0, s1, i / 8), j = Math.min(n - 1, Math.floor(q * n)), f = q * n - j, x = lerp(pts[j][0], pts[j + 1][0], f) + nx * o, y = lerp(pts[j][1], pts[j + 1][1], f) + ny * o; i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke();
  }
  c.fillStyle = hi || 'rgba(255,250,232,.7)'; for (let k = 0; k < 2 + w / 3; k++) { const q = r(), x = lerp(A[0], B[0], q) - nx * w * 0.3, y = lerp(A[1], B[1], q) - ny * w * 0.3; c.beginPath(); c.arc(x, y, 0.9 + r(), 0, Math.PI * 2); c.fill(); }
  c.restore();
};

// ---------- 剪刀折线 ----------
// 把一圈（闭合）点列按 step 重采样，每点加 ±amp 种子抖动，直线相连 → 手剪纸的边。RIG 部件可用 path.pts 喂进来重剪。
P.cut = (pts, seed, step = 18, amp = 2.5) => {
  const r = rng(seed), out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / step));
    for (let k = 0; k < n; k++) { const q = k / n; out.push([lerp(a[0], b[0], q) + (r() - 0.5) * amp * 2, lerp(a[1], b[1], q) + (r() - 0.5) * amp * 2]); }
  }
  return U.poly(out);
};
})();
