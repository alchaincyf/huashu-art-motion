// y4 的「世界画布」：S1 中景、S4 大全景、S5 近景是同一个房间、同一套世界坐标，只换镜头。
// （返修：第一版 S4 另画了一个房间，审片指出空间不连贯；中景镜头偏移露出画框外的黑边。
//   现在世界铺到 x −1000..2900、y −700..1700，最远的全景 zoom 0.5 也盖得满。）
// S1 镜头看到的范围 ≈ x 0..1920、y 0..1080；全景时才看得到书架、绿植、吊灯、地板。
(() => {
const S = STORY, C = S.C;
const X0 = -1000, Y0 = -700, WW = 3900, WH = 2400;
const back = () => PAINT.cached('y4_world_back', WW, WH, g => {
  g.translate(-X0, -Y0);
  g.lineWidth = S.bgLW; g.strokeStyle = C.bgLine; g.lineJoin = 'round';
  g.fillStyle = C.wall; g.fillRect(X0, Y0, WW, WH);
  // 天花板线、地板
  g.fillStyle = C.wall2; g.fillRect(X0, Y0, WW, 330); g.beginPath(); g.moveTo(X0, Y0 + 330); g.lineTo(X0 + WW, Y0 + 330); g.stroke();
  g.fillStyle = C.floor; g.fillRect(X0, 1150, WW, 600); g.fillStyle = '#D2C3AA'; g.fillRect(X0, 1132, WW, 18);
  g.beginPath(); g.moveTo(X0, 1132); g.lineTo(X0 + WW, 1132); g.moveTo(X0, 1150); g.lineTo(X0 + WW, 1150); g.stroke();
  // 猫画框（小猫补光灯的草图）
  g.fillStyle = '#F4EEE2'; g.beginPath(); g.roundRect(1380, 210, 230, 170, 10); g.fill(); g.stroke();
  g.strokeStyle = '#B9A88E'; g.lineWidth = 4; g.beginPath(); g.arc(1495, 300, 46, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(1462, 266); g.lineTo(1470, 238); g.lineTo(1484, 258); g.moveTo(1528, 266); g.lineTo(1520, 238); g.lineTo(1506, 258); g.stroke();
  g.strokeStyle = C.bgLine; g.lineWidth = S.bgLW;
  // 书架（S1 画外左侧）
  const r = U.rng(9); g.fillStyle = '#D9C3A0'; g.beginPath(); g.roundRect(-700, 420, 420, 712, 8); g.fill(); g.stroke();
  for (const sy of [420, 600, 780, 960]) { g.beginPath(); g.moveTo(-700, sy + 160); g.lineTo(-280, sy + 160); g.stroke();
    let x = -675; while (x < -310) { const w = 22 + r() * 24, h = 90 + r() * 50; g.fillStyle = ['#8FB3C9', '#E7A37B', '#B9C98F', '#C6A0C9'][(r() * 4) | 0]; g.fillRect(x, sy + 160 - h, w, h); g.strokeRect(x, sy + 160 - h, w, h); x += w + 6; } }
  // 绿植（画外右侧，地上）
  g.fillStyle = '#E7A37B'; g.beginPath(); g.moveTo(2240, 1140); g.lineTo(2270, 990); g.lineTo(2410, 990); g.lineTo(2440, 1140); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#8DBF8B'; for (const [x, y, rx, ry, a] of [[2290, 900, 40, 110, -0.5], [2340, 870, 40, 128, 0], [2392, 905, 40, 106, 0.5]]) { g.beginPath(); g.ellipse(x, y, rx, ry, a, 0, Math.PI * 2); g.fill(); g.stroke(); }
});
// 桌子：S1 里只看得到桌面和挡板上沿；全景看得到桌腿
const desk = (g) => {
  g.lineWidth = S.bgLW; g.strokeStyle = C.bgLine; g.lineJoin = 'round';
  g.fillStyle = C.deskSide; for (const x of [-120, 1960]) { g.fillRect(x, 740, 60, 400); g.strokeRect(x, 740, 60, 400); }
  g.fillRect(-60, 740, 2020, 320); g.strokeRect(-60, 740, 2020, 320);
  g.fillStyle = C.desk; g.beginPath(); g.rect(-160, 690, 2240, 50); g.fill(); g.stroke();
  // 马克杯
  g.fillStyle = '#F26B4F'; g.beginPath(); g.roundRect(470, 600, 70, 92, 10); g.fill(); g.stroke();
  g.beginPath(); g.arc(548, 640, 22, -1.2, 1.2); g.lineWidth = 9; g.stroke(); g.lineWidth = S.bgLW;
};
const front = () => PAINT.cached('y4_world_front', WW, WH, g => { g.translate(-X0, -Y0); desk(g); });

// ch: 角色参数（TOON.bean 的 o，不含 x/y/s）；返回 bean 的 info
S.world = (c, t, ch) => {
  c.drawImage(back(), X0, Y0);
  // 窗：天空＋慢飘的云（18px/s、12px/s）
  c.save(); c.beginPath(); c.roundRect(220, 190, 420, 300, 12); c.clip(); c.fillStyle = C.sky; c.fillRect(220, 190, 420, 300);
  for (const [cx, cy, r, sp] of [[300, 300, 46, 18], [560, 400, 34, 12]]) { const x = 180 + ((cx + t * sp) % 520); c.fillStyle = C.cloud;
    c.beginPath(); c.arc(x, cy, r, 0, Math.PI * 2); c.arc(x + r * 0.9, cy + 6, r * 0.75, 0, Math.PI * 2); c.arc(x - r * 0.9, cy + 8, r * 0.65, 0, Math.PI * 2); c.fill(); }
  c.restore();
  c.lineWidth = S.bgLW; c.strokeStyle = C.bgLine; c.beginPath(); c.roundRect(220, 190, 420, 300, 12); c.stroke();
  c.beginPath(); c.moveTo(430, 190); c.lineTo(430, 490); c.moveTo(220, 340); c.lineTo(640, 340); c.stroke();
  // 吊灯（只有全景看得到）：钟摆 1.9s、±4°
  c.save(); c.translate(860, -370); c.rotate(0.07 * Math.sin(2 * Math.PI * t / 1.9)); c.lineWidth = S.bgLW; c.strokeStyle = C.bgLine;
  c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 240); c.stroke();
  c.fillStyle = '#F2C86B'; c.beginPath(); c.moveTo(-90, 330); c.lineTo(-42, 240); c.lineTo(42, 240); c.lineTo(90, 330); c.closePath(); c.fill(); c.stroke(); c.restore();
  // 角色
  const info = TOON.bean(c, { x: 860, y: 760, s: 165, char: 'author', ...ch });   // 示范片讲的是作者自己的经历，显式用作者造型（TOON.bean 默认是中性角色）
  c.drawImage(front(), X0, Y0);
  // 笔记本（背面朝镜头、斜对着他），屏幕光打在桌上，光随代码滚动微闪
  c.save(); c.lineWidth = S.bgLW; c.strokeStyle = C.bgLine; c.lineJoin = 'round';
  const glow = c.createRadialGradient(1240, 690, 10, 1240, 690, 260); glow.addColorStop(0, `rgba(140,210,255,${0.42 + 0.06 * Math.sin(t * 9)})`); glow.addColorStop(1, 'rgba(140,210,255,0)');
  c.fillStyle = glow; c.fillRect(980, 560, 520, 180);
  c.fillStyle = C.laptop; c.beginPath(); c.moveTo(1080, 692); c.lineTo(1130, 470); c.lineTo(1420, 470); c.lineTo(1380, 692); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#AEB3BE'; c.beginPath(); c.roundRect(1050, 684, 360, 16, 6); c.fill(); c.stroke();
  const k = 1 + 0.06 * Math.sin(t * 5);
  c.translate(1255, 580); c.scale(k, k); c.fillStyle = '#F2A33A'; c.beginPath();
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, r = i % 2 ? 14 : 36; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); c.stroke();
  c.restore();
  return info;
};
// S4/S5 共用的姿势时间线（全片时间，跨两个镜头连续）
S.KEYS_END = [[5.6, 'talk', 'worry'], [6.81, 'point', 'worry'], [7.45, 'shrug', 'worry']];
S.lookEnd = t => t >= 7.45 ? [0, 0] : t >= 6.81 ? [1, 0.1] : (t >= 6.2 && t < 6.6) ? [1, 0.35] : [0, 0];
})();
