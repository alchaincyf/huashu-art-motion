// 卡通与扁平插画 TOON：Kurzgesagt 式「无描边、双色分面」、柔光；故事型（storytime）极简豆子角色（默认中性造型，可换预设），
// pose-to-pose 换姿势（快切＋身体挤压回弹）、眨眼时刻表、口型读口播包络（一拍二）、汗滴、漫画符号。
(() => {
let W = 1920, H = 1080; U.onStage((w, h) => { W = w; H = h; });   // 画布尺寸跟 U.setStage 走（默认 1920×1080）
const { clamp, lerp } = U;
const TOON = window.TOON = {};

// ---------- 扁平插画 ----------
// 双色分面（无描边、靠色块分面）：clip(S) → 整块阴影色 → 往光源方向平移 v 填高光 → 再往回挪 w 填本色：右下留阴影带、左上留细高光边
TOON.flat = (c, path, base, sh, hi, v = [10, 12], w = [4, 5]) => {
  c.save(); c.clip(path);
  c.fillStyle = sh || base; c.fill(path);
  c.save(); c.translate(-v[0], -v[1]); c.fillStyle = hi || base; c.fill(path); c.restore();
  c.save(); c.translate(-v[0] + w[0], -v[1] + w[1]); c.fillStyle = base; c.fill(path); c.restore();
  c.restore();
};
// 柔光：径向渐变方块（发光物、眼睛、信号脉冲）
TOON.glow = (c, x, y, r, col, a = 1) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, PAINT.rgb(PAINT.hex(col), a)); g.addColorStop(1, PAINT.rgb(PAINT.hex(col), 0)); c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); };
// 竖向渐变（天空）
TOON.vgrad = (c, y0, y1, cols) => { const g = c.createLinearGradient(0, y0, 0, y1); cols.forEach((k, i) => g.addColorStop(i / (cols.length - 1), k)); return g; };
TOON.circle = (x, y, r) => { const p = new Path2D(); p.arc(x, y, r, 0, Math.PI * 2); return p; };
TOON.ellipse = (x, y, rx, ry, a = 0) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, a, 0, Math.PI * 2); return p; };

// ---------- 口型：读口播包络 ----------
// window.VO_ENV = {fps, a:[...]}（0..1 的 RMS 包络，由音频脚本从口播 wav 生成）。口型「一拍二」：每 1/12 秒才换一次形。
TOON.env = t => { const E = window.VO_ENV; if (!E) return 0; const i = Math.round(t * E.fps); return i < 0 || i >= E.a.length ? 0 : E.a[i]; };
TOON.mouth = (t, fps = 12) => { const v = TOON.env(MO.step(t, fps)); return v < 0.06 ? 0 : v < 0.22 ? 1 : 2; };   // 0 闭 1 半 2 张

// ---------- 豆子角色（故事型极简角色） ----------
// 正面、圆头、豆子身体、面条手臂。造型由 o.char 决定（预设名或对象），默认 'neutral'：
//   neutral  短发、蓝 T、深色裤子，不戴帽子和眼镜——给任何人的故事当主角
//   bun      丸子头、芥黄 T、深色裤子
//   author   本 skill 作者的卡通形象（纯白渔夫帽、圆框黑眼镜、白 T、卡其短裤、黑手表）。只在讲作者自己的故事时显式指定；
//            作者形象不随 MIT 授权（见 README）
//   对象：{ base: 预设名, skin, hair, shirt, pants, shoe, hairStyle: 'short'|'bun'|'none', hat: true/false, glasses: true/false, watch: true/false } 覆盖预设里的项
// o: { x, y(脚底), s(头半径 px), char, pose:{l,r}(手臂目标点，相对肩，头半径单位), expr, mouth(0/1/2), blink, look:[dx,dy](眼珠方向),
//      squash(竖向缩放，以脚底为轴，体积守恒), tilt(头歪), bob(头下沉), browUp, lw }
// expr: 'talk' | 'happy' | 'blank'(死鱼眼) | 'worry' | 'shock'。返回 { hl, hr(两手位置), head:[x,y] }
const LINE = '#1B1B1F', BAND = '#E4E4E8', HATC = '#FFFFFF';
TOON.LOOKS = {
  neutral: { skin: '#F3CDAE', hair: '#2A2420', hairStyle: 'short', shirt: '#6E9CCB', pants: '#3E4656', shoe: '#FAFAF6', hat: false, glasses: false, watch: false },
  bun:     { skin: '#E9B994', hair: '#3B2A22', hairStyle: 'bun', shirt: '#E2B33C', pants: '#3E4656', shoe: '#FAFAF6', hat: false, glasses: false, watch: false },
  author:  { skin: '#FFE2CC', hair: '#1B1B1F', hairStyle: 'none', shirt: '#FFFFFF', pants: '#CDBB97', shoe: '#FAFAF6', hat: true, glasses: true, watch: true },
};
// 预设名或对象 → 完整造型；不认识的预设名 console.error（qa / render 判失败），不悄悄换成别的
TOON.look = ch => {
  if (ch == null) return TOON.LOOKS.neutral;
  if (typeof ch === 'string') { if (TOON.LOOKS[ch]) return TOON.LOOKS[ch]; console.error(`TOON：没有这个角色预设「${ch}」（可选 ${Object.keys(TOON.LOOKS).join(' / ')}，或传造型对象）`); return TOON.LOOKS.neutral; }
  return { ...(TOON.LOOKS[ch.base] || TOON.LOOKS.neutral), ...ch };
};
TOON.POSES = {
  rest:  { l: [-0.95, 1.05], r: [0.95, 1.05] },
  talk:  { l: [-0.95, 1.05], r: [1.05, 0.55] },          // 一只手微抬，口播默认
  point: { l: [-0.95, 1.05], r: [1.75, -0.15] },         // 指向画右
  type:  { l: [-0.55, 0.62], r: [0.55, 0.62] },          // 双手在胸前（打字）
  shrug: { l: [-1.45, -0.05], r: [1.45, -0.05], palms: 1 },
  stiff: { l: [-0.78, 1.25], r: [0.78, 1.25] },          // 僵住
};
TOON.bean = (c, o) => {
  const R = o.s, x = o.x, y = o.y, lw = o.lw || Math.max(4, R * 0.05), sq = o.squash || 1, LK = TOON.look(o.char);
  const SK = LK.skin, SHIRT = LK.shirt, SHORTS = LK.pants, HAIR = LK.hair;
  const pose = o.pose || TOON.POSES.rest;
  c.save(); c.translate(x, y); c.scale(1 / Math.sqrt(sq), sq);
  c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = LINE; c.lineWidth = lw;
  const bodyTop = -R * 1.32;
  const shoulderY = bodyTop + R * 0.32, shL = [-R * 0.42, shoulderY], shR = [R * 0.42, shoulderY];
  for (const sx of [-1, 1]) {                                          // 腿：两截短圆柱＋白鞋
    c.fillStyle = SK; c.beginPath(); c.roundRect(sx * R * 0.2 - R * 0.09, -R * 0.24, R * 0.18, R * 0.2, R * 0.05); c.fill(); c.stroke();
    c.fillStyle = LK.shoe; c.beginPath(); c.ellipse(sx * R * 0.22, -R * 0.03, R * 0.17, R * 0.08, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  }
  const body = new Path2D();                                           // 身体（豆子）
  body.moveTo(-R * 0.5, -R * 0.2);
  body.bezierCurveTo(-R * 0.62, -R * 0.75, -R * 0.55, bodyTop + R * 0.05, 0, bodyTop);
  body.bezierCurveTo(R * 0.55, bodyTop + R * 0.05, R * 0.62, -R * 0.75, R * 0.5, -R * 0.2);
  body.bezierCurveTo(R * 0.3, -R * 0.12, -R * 0.3, -R * 0.12, -R * 0.5, -R * 0.2); body.closePath();
  c.fillStyle = SHIRT; c.fill(body);
  c.save(); c.clip(body); c.fillStyle = SHORTS; c.fillRect(-R, -R * 0.42, R * 2, R * 0.5);
  c.strokeStyle = LINE; c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(0, -R * 0.36); c.lineTo(0, -R * 0.12); c.stroke(); c.restore();
  c.stroke(body);
  c.beginPath(); c.moveTo(-R * 0.6, -R * 0.42); c.quadraticCurveTo(0, -R * 0.36, R * 0.6, -R * 0.42); c.lineWidth = lw * 0.8; c.stroke(); c.lineWidth = lw;
  // 面条手臂：肩 → 手（二次曲线，肘自然下垂），双描边做出「管子」
  const arm = (sh, tgt, side) => {
    const hx = sh[0] + tgt[0] * R * 0.62, hy = sh[1] + tgt[1] * R * 0.62;
    const mx = (sh[0] + hx) / 2 + side * R * 0.08, my = Math.max(sh[1], hy) + R * 0.12;
    c.beginPath(); c.moveTo(sh[0], sh[1]); c.quadraticCurveTo(mx, my, hx, hy);
    c.strokeStyle = LINE; c.lineWidth = R * 0.17 + lw; c.stroke(); c.strokeStyle = SK; c.lineWidth = R * 0.17; c.stroke();
    c.beginPath(); c.moveTo(sh[0], sh[1]); const q = 0.28; c.lineTo(lerp(sh[0], mx, q * 2), lerp(sh[1], my, q * 2));
    c.strokeStyle = LINE; c.lineWidth = R * 0.26 + lw; c.stroke(); c.strokeStyle = SHIRT; c.lineWidth = R * 0.26; c.stroke();
    c.fillStyle = SK; c.strokeStyle = LINE; c.lineWidth = lw; c.beginPath(); c.arc(hx, hy, R * 0.13, 0, Math.PI * 2); c.fill(); c.stroke();
    if (side > 0 && LK.watch) {                                        // 近侧（画右）手腕黑手表
      const ang = Math.atan2(hy - my, hx - mx), wx = hx - Math.cos(ang) * R * 0.17, wy = hy - Math.sin(ang) * R * 0.17;
      c.save(); c.translate(wx, wy); c.rotate(ang + Math.PI / 2); c.fillStyle = '#1D1F22'; c.fillRect(-R * 0.1, -R * 0.04, R * 0.2, R * 0.08); c.restore();
    }
    return [hx, hy];
  };
  c.lineWidth = lw;
  const hl = arm(shL, pose.l, -1), hr = arm(shR, pose.r, 1);
  // 头：略宽的圆，压在身体上
  c.restore(); c.save(); c.translate(x, y); c.scale(1 / Math.sqrt(sq), sq);
  c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = LINE; c.lineWidth = lw;
  const hy = bodyTop - R * 0.78 + (o.bob || 0);
  c.translate(0, hy); c.rotate(o.tilt || 0);
  if (LK.hairStyle === 'bun') { c.fillStyle = HAIR; c.beginPath(); c.arc(0, -R * 0.98, R * 0.34, 0, Math.PI * 2); c.fill(); c.stroke(); }   // 丸子（压在头后面）
  if (LK.hat) { c.fillStyle = HAIR;                                    // 鬓角（帽檐下露一点黑发）
    for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(sx * R * 0.86, -R * 0.12, R * 0.16, R * 0.3, sx * 0.2, 0, Math.PI * 2); c.fill(); } }
  c.fillStyle = SK; c.beginPath(); c.ellipse(0, 0, R * 1.0, R * 0.93, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  if (LK.hairStyle === 'short' || LK.hairStyle === 'bun') {           // 头发：比头略大的一顶，前沿是一道带分缝的刘海，两侧盖到耳朵上沿
    const edge = new Path2D(); edge.moveTo(-R * 1.2, R * 0.05);
    for (let i = 0; i <= 24; i++) { const k = i / 24, xx = -R * 1.05 + k * R * 2.1, ax = Math.abs(xx) / R, side = U.ss(0.55, 0.98, ax);
      edge.lineTo(xx, -R * 0.42 + R * 0.06 * Math.cos(k * Math.PI * 3) * (1 - side) + side * R * (LK.hairStyle === 'bun' ? 0.32 : 0.45) + (xx > R * 0.15 && xx < R * 0.35 ? -R * 0.08 : 0)); }
    edge.lineTo(R * 1.2, R * 0.05); edge.lineTo(R * 1.2, -R * 1.4); edge.lineTo(-R * 1.2, -R * 1.4); edge.closePath();
    c.save(); c.clip(edge); c.fillStyle = HAIR; c.beginPath(); c.ellipse(0, -R * 0.05, R * 1.05, R * 0.99, 0, 0, Math.PI * 2); c.fill(); c.stroke(); c.restore();
  }
  if (LK.hat) {
  // 帽子：帽冠＋帽带＋往下斜的帽檐
  const crown = new Path2D(); crown.moveTo(-R * 0.78, -R * 0.42); crown.bezierCurveTo(-R * 0.8, -R * 1.25, R * 0.8, -R * 1.25, R * 0.78, -R * 0.42); crown.closePath();
  c.fillStyle = HATC; c.fill(crown); c.stroke(crown);
  c.save(); c.clip(crown); c.fillStyle = BAND; c.fillRect(-R, -R * 0.62, R * 2, R * 0.18); c.restore();
  c.beginPath(); c.moveTo(-R * 0.79, -R * 0.62); c.quadraticCurveTo(0, -R * 0.7, R * 0.79, -R * 0.62); c.lineWidth = lw * 0.7; c.stroke(); c.lineWidth = lw;
  const brim = new Path2D(); brim.moveTo(-R * 1.18, -R * 0.24); brim.quadraticCurveTo(0, -R * 0.66, R * 1.18, -R * 0.24);
  brim.quadraticCurveTo(R * 1.22, -R * 0.12, R * 1.08, -R * 0.12); brim.quadraticCurveTo(0, -R * 0.44, -R * 1.08, -R * 0.12); brim.quadraticCurveTo(-R * 1.22, -R * 0.12, -R * 1.18, -R * 0.24); brim.closePath();
  c.fillStyle = HATC; c.fill(brim); c.stroke(brim);
  }
  // 眉毛（表情主载体）：[整体上下, 内端相对外端的高差]（负 = 内端抬高 = 担心/委屈）
  const ex = o.expr || 'talk', lk = o.look || [0, 0];
  const brow = { talk: [0, 0], happy: [-0.05, 0.03], blank: [0.03, 0], worry: [-0.02, -0.11], shock: [-0.11, 0.02] }[ex] || [0, 0];
  if (o.browUp) brow[0] -= o.browUp;
  c.lineWidth = lw * 1.4;
  for (const sx of [-1, 1]) { const by = -R * 0.13 + brow[0] * R; c.beginPath(); c.moveTo(sx * R * 0.52, by); c.lineTo(sx * R * 0.2, by + brow[1] * R); c.stroke(); }
  c.lineWidth = lw;
  // 眼睛是黑点；戴眼镜的造型（author）加两只圆框（线比轮廓粗 1.5 倍）＋鼻梁
  const gy = R * 0.2, gr = R * 0.27;
  for (const sx of [-1, 1]) {
    const gx = sx * R * 0.37;
    if (LK.glasses) { c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(gx, gy, gr, 0, Math.PI * 2); c.fill(); }
    const pr = (ex === 'blank' ? R * 0.035 : ex === 'shock' ? R * 0.05 : R * 0.075) * (LK.glasses ? 1 : 1.15);
    c.fillStyle = LINE;
    if (o.blink) { c.beginPath(); c.moveTo(gx - R * 0.08 + lk[0] * R * 0.08, gy + lk[1] * R * 0.06); c.lineTo(gx + R * 0.08 + lk[0] * R * 0.08, gy + lk[1] * R * 0.06); c.lineWidth = lw; c.stroke(); }
    else { c.beginPath(); c.ellipse(gx + lk[0] * R * 0.09, gy + lk[1] * R * 0.07, pr, pr * (ex === 'blank' ? 1 : 1.25), 0, 0, Math.PI * 2); c.fill();
      if (ex !== 'blank') { c.fillStyle = '#fff'; c.beginPath(); c.arc(gx + lk[0] * R * 0.09 - pr * 0.35, gy + lk[1] * R * 0.07 - pr * 0.45, pr * 0.32, 0, Math.PI * 2); c.fill(); } }
    if (LK.glasses) { c.lineWidth = lw * 1.5; c.strokeStyle = LINE; c.beginPath(); c.arc(gx, gy, gr, 0, Math.PI * 2); c.stroke(); }
  }
  if (LK.glasses) { c.beginPath(); c.moveTo(-R * 0.1, gy - R * 0.02); c.quadraticCurveTo(0, gy - R * 0.08, R * 0.1, gy - R * 0.02); c.stroke(); }
  c.lineWidth = lw;
  c.fillStyle = 'rgba(255,140,120,0.35)'; for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(sx * R * 0.68, R * 0.5, R * 0.11, R * 0.06, 0, 0, Math.PI * 2); c.fill(); }
  // 嘴
  const m = o.mouth || 0, my = R * 0.6;
  c.strokeStyle = LINE; c.lineWidth = lw;
  if (ex === 'blank' && !m) { c.beginPath(); c.moveTo(-R * 0.1, my); c.lineTo(R * 0.1, my); c.stroke(); }
  else if (ex === 'worry' && !m) { c.beginPath(); c.moveTo(-R * 0.13, my + R * 0.03); c.quadraticCurveTo(-R * 0.05, my - R * 0.04, 0, my + R * 0.01); c.quadraticCurveTo(R * 0.06, my + R * 0.05, R * 0.13, my - R * 0.01); c.stroke(); }
  else if (!m) { c.beginPath(); c.moveTo(-R * 0.13, my - R * 0.02); c.quadraticCurveTo(0, my + R * 0.1, R * 0.13, my - R * 0.02); c.stroke(); }
  else {
    const mh = m === 1 ? R * 0.1 : R * 0.2, mw = m === 1 ? R * 0.14 : R * 0.18;
    c.fillStyle = '#6E2430'; c.beginPath(); c.moveTo(-mw, my - R * 0.03); c.quadraticCurveTo(0, my - R * 0.06, mw, my - R * 0.03); c.quadraticCurveTo(mw * 0.9, my + mh, 0, my + mh); c.quadraticCurveTo(-mw * 0.9, my + mh, -mw, my - R * 0.03); c.closePath(); c.fill();
    c.save(); c.clip(); c.fillStyle = '#F07B7B'; c.beginPath(); c.ellipse(0, my + mh, mw * 0.6, mh * 0.45, 0, 0, Math.PI * 2); c.fill(); c.restore(); c.stroke();
  }
  c.restore();
  return { hl, hr, head: [x, y + hy * sq] };
};

// ---------- pose-to-pose ----------
// keys = [[t, poseName, expr], ...]（同一条时间轴的秒）。换姿势：手臂 0.1s expoOut 过去（24fps 下 3 帧的「快切」），
// 身体同时挤压 7% 后按弹簧回弹（3.5Hz / 衰减 9）。返回 { pose, expr, squash, since }
TOON.poseAt = (keys, t, poses = TOON.POSES) => {
  let k = 0; for (let i = 0; i < keys.length; i++) if (t >= keys[i][0]) k = i;
  const cur = poses[keys[k][1]], prv = poses[keys[Math.max(0, k - 1)][1]];
  const dt = t - keys[k][0], q = k === 0 ? 1 : MO.expoOut(clamp(dt / 0.1));
  const mix = (a, b) => [lerp(a[0], b[0], q), lerp(a[1], b[1], q)];
  return { pose: { l: mix(prv.l, cur.l), r: mix(prv.r, cur.r), palms: cur.palms }, expr: keys[k][2], squash: k === 0 ? 1 : 1 + MO.settle(dt, -0.07, 3.5, 9), since: dt };
};
// 眨眼：固定时刻表（间隔 2.4–3.6s 的「随机」写死），闭眼 dur 秒（24fps 下 2 帧 ≈ 0.083s；「无语」的慢眨眼 3 帧）
TOON.blinkAt = (t, times, dur = 0.083) => times.some(b => t >= b && t < b + dur) ? 1 : 0;
// 活着：说话时头随口型轻点（每次张嘴下沉 0.015R）＋呼吸（1.6s 一周期，身体 ±1.2%）
TOON.alive = (t, R) => ({ bob: TOON.mouth(t) * R * 0.015, breathe: 1 + 0.012 * Math.sin(2 * Math.PI * t / 1.6) });

// ---------- 漫画符号 ----------
// 汗滴：p 0..1 沿脸侧滑下
TOON.sweat = (c, x, y, r, p) => {
  const yy = y + p * r * 3.2, a = p < 0.85 ? 1 : 1 - (p - 0.85) / 0.15;
  c.save(); c.globalAlpha = a; c.fillStyle = '#9ED8F5'; c.strokeStyle = LINE; c.lineWidth = Math.max(3, r * 0.12);
  c.beginPath(); c.moveTo(x, yy - r * 1.5); c.quadraticCurveTo(x + r * 1.05, yy + r * 0.1, x, yy + r); c.quadraticCurveTo(x - r * 1.05, yy + r * 0.1, x, yy - r * 1.5); c.fill(); c.stroke();
  c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x - r * 0.3, yy - r * 0.05, r * 0.18, r * 0.32, 0, 0, Math.PI * 2); c.fill(); c.restore();
};
// 「？」「！」弹出（白描边，过冲 30%）
TOON.mark = (c, ch, x, y, p, size = 160, color = LINE) => { if (p <= 0) return; TY.pop(c, ch, x, y, p, { size, fam: 'PuHui-Black', color, stroke: '#fff', strokeW: size * 0.12, over: 3 }); };
})();
