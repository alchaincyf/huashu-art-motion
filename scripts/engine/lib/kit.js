// 跨场景共用的小工具：点列加密/等弧长重采样、可变线宽路径 ribbon、整幅行/列扭曲、手绘不规则圆、全片连续编舞、近侧手臂补盖、角标。
// 渲染器在 lib/brush.js（笔与水）、lib/render.js（网点/点彩/赛璐珞/光影/皮影）、lib/post.js（VHS/胶片/泛光/纹理叠角色）。
(() => {
let W = 1920, H = 1080; U.onStage((w, h) => { W = w; H = h; });   // 画布尺寸跟 U.setStage 走（默认 1920×1080）
const { clamp, lerp, rng } = U;
const K = window.KIT = {};

// Catmull-Rom 加密点列（开放）
K.densify = (pts, per = 6) => {
  const out = [], n = pts.length, P_ = i => pts[Math.max(0, Math.min(n - 1, i))];
  for (let i = 0; i < n - 1; i++) {
    const p0 = P_(i - 1), p1 = P_(i), p2 = P_(i + 1), p3 = P_(i + 2);
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
                0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
    }
  }
  out.push(pts[n - 1]); return out;
};
// 按弧长等距重采样（让噪声、飞白、行波的频率与笔画长短无关）
K.resample = (pts, step = 4) => {
  const out = [pts[0]]; let acc = 0;
  for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); let d = step - acc;
    while (d <= L) { const q = d / L; out.push([a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q]); d += step; } acc = L - (d - step); }
  out.push(pts[pts.length - 1]); return out;
};
// 可变线宽路径：点列两侧按 w(q) 偏移成闭合多边形（书法线、飘带、表现主义长笔）
K.ribbon = (pts, w) => {
  const n = pts.length, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const hw = (typeof w === 'function' ? w(i / (n - 1), i) : w) / 2;
    L.push([pts[i][0] - dy * hw, pts[i][1] + dx * hw]); R.push([pts[i][0] + dy * hw, pts[i][1] - dx * hw]);
  }
  const p = new Path2D(); L.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1]));
  for (let i = n - 1; i >= 0; i--) p.lineTo(R[i][0], R[i][1]); p.closePath(); return p;
};
// 少女部件按画序列出（远→近），给「不调 drawGirl、自己逐部件上色」的风格用
K.girlOrder = ['farSleeve', 'farHand', 'farCuff', 'hairDown', 'skirt', 'shoe', 'torso', 'neck', 'hairBack', 'bun', 'face', 'bangs', 'upperArm', 'foreArm', 'cuff', 'hand'];   // 完整画序（含五官、杯、钩子插槽名）见 RIG.GIRL_ORDER

// 把 src 按「水平条带位移」画到 dst：fx(y) 返回该行的 x 位移（蒙克式整个世界在流动）
// margin：每行横向多拉伸 2·margin 像素，位移后左右不露缝（margin ≥ 最大位移）
K.warpRows = (dst, src, fx, band = 6, margin = 0) => {
  for (let y = 0; y < H; y += band) { const dx = fx(y + band / 2); dst.drawImage(src, 0, y, W, band, dx - margin, y, W + 2 * margin, band); }
};
K.warpCols = (dst, src, fy, band = 6, margin = 0) => {
  for (let x = 0; x < W; x += band) { const dy = fy(x + band / 2); dst.drawImage(src, x, 0, band, H, x, dy - margin, band, H + 2 * margin); }
};

// n 角星（剪纸星、爆炸框、闪光）：外半径 r0、内半径 r1
K.star = (cx, cy, r0, r1, n, rot = 0) => { const pts = []; for (let i = 0; i < n * 2; i++) { const a = rot + i / (n * 2) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? r1 : r0; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return U.poly(pts); };
// 手绘不规则圆（草间的点不是完美圆）：n 个顶点、半径按种子起伏
K.blob = (c, x, y, r, seed, wob = 0.08, n = 14) => {
  const rr = rng(seed); const off = []; for (let i = 0; i < n; i++) off.push(1 + (rr() - .5) * 2 * wob);
  const pts = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; pts.push([x + Math.cos(a) * r * off[i], y + Math.sin(a) * r * off[i]]); }
  c.moveTo((pts[0][0] + pts[n - 1][0]) / 2, (pts[0][1] + pts[n - 1][1]) / 2);
  for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; c.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
  c.closePath();
};

// 全片连续的编舞：端杯按全局时间走（周期 = 两段 = 2.34s，在嘴边和桌上各停一会儿），
// 换风格时姿势不重置——速通看的是「同一瞬间换了画风」，而不是每段重喝一次。转场正好落在杯子停住的时刻。
K.choreo = (lt, t) => {
  const ch = PAINT.choreo(lt, t), k = 0.5 - 0.5 * Math.cos(2 * Math.PI * t / 2.34375);
  let q = clamp((k - 0.15) / 0.7); q = q * q * (3 - 2 * q);
  ch.cup = q; ch.sip = Math.max(0, Math.sin(t * 6)) * 0.15 * q; return ch;
};
// drawGirl(mode:'line') 会把被近侧手臂挡住的躯干线画穿：线稿画完后，把近侧手臂、袖口、手、杯重新盖一遍
K.nearArm = (c, G, { fill, line = '#111', lw = 3, skin, cuff, cupBody, cupRim, pattern } = {}) => {
  const arm = new Path2D(); arm.addPath(G.upperArm); arm.addPath(G.foreArm);
  c.save(); c.lineJoin = 'round'; c.fillStyle = fill; c.fill(arm); if (pattern) { c.save(); c.clip(arm); pattern(c); c.restore(); }
  c.strokeStyle = line; c.lineWidth = lw; c.stroke(G.upperArm); c.stroke(G.foreArm);
  if (cuff) { c.fillStyle = cuff; c.fill(G.cuff); c.stroke(G.cuff); }
  c.fillStyle = skin; c.fill(G.hand); c.lineWidth = lw * 0.8; c.stroke(G.hand);
  RIG.drawCup(c, G.cup, { body: cupBody, rim: cupRim, line, lw: lw * 0.8, hw: 7 });
  c.fillStyle = skin; c.beginPath(); c.arc(G.thumb[0], G.thumb[1], 7, 0, Math.PI * 2); c.fill(); c.lineWidth = lw * 0.7; c.stroke();
  c.restore();
};
// 右上角角标：标题（中文）＋副标题；入场 0.18s 由各风格的 reveal(c,p) 决定怎么出现
K.label = (c, { title, sub, tFont, sFont, tCol, sCol, x = 1866, y = 128, sy = 182, shadow, before, after, spacing = 0 }) => {
  c.save(); c.textAlign = 'right'; c.textBaseline = 'alphabetic';
  if (before) before(c);
  if (shadow) { c.shadowColor = shadow.color; c.shadowOffsetX = shadow.x || 0; c.shadowOffsetY = shadow.y || 0; c.shadowBlur = shadow.blur || 0; }
  c.font = tFont; c.fillStyle = tCol; if (spacing) c.letterSpacing = spacing + 'px'; c.fillText(title, x, y); c.letterSpacing = '0px';
  if (sub) { c.font = sFont; c.fillStyle = sCol || tCol; c.fillText(sub, x, sy); }
  if (after) after(c);
  c.restore();
};
})();
