// 后期：整幅叠在画面上的「媒介层」。全部挂在 PAINT（P）上。
// 来源：迁移测试 B（蒸汽波 VHS、吉卜力角色水彩肌理）、D（橡皮管胶片、新海诚泛光/光晕）、A（敦煌褪色）。
//   P.rgbSplit(c, S, opt)               RGB 三通道分离错位：multiply 取单通道 → lighter 合成到黑底（VHS、故障、3D 眼镜）
//   P.vhs(c, S, t, lt, opt)             VHS 全套：通道分离＋跟踪噪声带下滚撕裂＋扫描线＋OSD＋暗角（先把整幅画进离屏 S）
//   P.scanlines(c, a1, a2)              4px 扫描线 pattern
//   P.film(c, t, opt)                   老胶片层：24fps 闪烁、跨格存活的竖划痕、灰尘毛发、颗粒抖动、圆角片门（1930 卡通、默片）
//   P.gateWeave(c, t, fn, amp)          抖片：fn 里画的内容整体按 24fps 微抖
//   P.bloom(c, opt)                     泛光：整帧缩小糊化后 screen 回叠（新海诚、CG）
//   P.lensFlare(c, sun, t, opt)         镜头光晕：太阳核＋慢转星芒＋横向拉丝＋沿 太阳→画心 的六边形光斑
//   P.textureInside(c, shapeLayer, drawTex, opt)  纹理只「乘」在角色上：纹理层 destination-in 角色剪影 → multiply 叠回
//   P.fade(c, opt)                      褪色/单色化：saturation 混合去色＋multiply 染色（壁画褪色、胶片单色）
//   P.vignette(c, opt)                  径向暗角
(() => {
let W = 1920, H = 1080; U.onStage((w, h) => { W = w; H = h; });   // 画布尺寸跟 U.setStage 走（默认 1920×1080）
const P = window.PAINT;
const { rng } = U;

// ---------- 通道分离 / VHS ----------
P.rgbSplit = (c, S, { r = [-3, 0], g = [0, 0], b = [3, 1], key = 'rgbSplit' } = {}) => {
  const T = P.scratch(key), tg = T.getContext('2d');
  c.save(); c.fillStyle = '#000'; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'lighter';
  [['#ff0000', r], ['#00ff00', g], ['#0000ff', b]].forEach(([col, [dx, dy]]) => {
    tg.globalCompositeOperation = 'source-over'; tg.clearRect(0, 0, W, H); tg.drawImage(S, 0, 0);
    tg.globalCompositeOperation = 'multiply'; tg.fillStyle = col; tg.fillRect(0, 0, W, H);
    c.drawImage(T, dx, dy);
  });
  c.restore();
};
P.scanlines = (c, a1 = 0.28, a2 = 0.12) => {
  const tile = P.cached(`scan_${a1}_${a2}`, 4, 4, g => { g.fillStyle = `rgba(0,0,0,${a1})`; g.fillRect(0, 0, 4, 1); g.fillStyle = `rgba(0,0,0,${a2})`; g.fillRect(0, 2, 4, 1); });
  c.save(); c.fillStyle = c.createPattern(tile, 'repeat'); c.fillRect(0, 0, W, H); c.restore();
};
// osd: false 关掉；或 {label:'PLAY', date:'SEP. 04 2011', clock:'23:59', font:'PressStart2P-400'}（▶ 自己画：像素字体里没有这个字形）
P.vhs = (c, S, t, lt, { osd = {}, band = 70, bandSpeed = 520, vignette = 'rgba(10,0,25,.55)' } = {}) => {
  const f = Math.floor(t * 60), jit = U.hash(f >> 2, 9) < 0.12 ? 1 : 0;
  const ca = 3 + jit * 6 + Math.sin(t * 7) * 1.5;                          // 色差错位量（偶发加大）
  P.rgbSplit(c, S, { r: [-ca, 0], g: [0, 0], b: [ca, 1], key: 'vhsSplit' });
  // 跟踪噪声带：从上往下滚，带内每 6px 横向撕裂＋白噪声线
  const by = ((lt * bandSpeed + 200) % (H + 160)) - 80, bh = band, r = rng(f * 7 + 1);
  for (let y = by; y < by + bh; y += 6) { const dx = (r() - 0.5) * 60 * Math.sin((y - by) / bh * Math.PI); c.drawImage(S, 0, y, W, 6, dx, y, W, 6); }
  c.save(); c.globalAlpha = 0.5; for (let i = 0; i < 90; i++) { c.fillStyle = r() < 0.5 ? '#ffffff' : '#bbbbbb'; c.fillRect(r() * W, by + r() * bh, 20 + r() * 120, 1.5); } c.restore();
  P.scanlines(c);
  if (osd) {
    const font = osd.font || 'PressStart2P-400';
    c.save(); c.font = `34px "${font}"`; c.fillStyle = '#ffffff'; c.shadowColor = 'rgba(0,0,0,.8)'; c.shadowOffsetX = 3; c.shadowOffsetY = 3;
    if ((f >> 4) % 2 === 0 || lt < 0.2) { c.fillText(osd.label || 'PLAY', 60, 92); c.beginPath(); c.moveTo(232, 60); c.lineTo(262, 77); c.lineTo(232, 94); c.closePath(); c.fill(); }
    c.font = `26px "${font}"`; c.fillText(osd.date || 'SEP. 04 2011', 60, 1020); c.fillText((osd.clock || '23:59') + ':' + String(30 + Math.floor(lt)).padStart(2, '0') + ':' + String(Math.floor(lt * 30) % 30).padStart(2, '0'), 60, 1056);
    c.restore();
  }
  if (vignette) P.vignette(c, { inner: 500, outer: 1150, col: vignette });
};

// ---------- 胶片 ----------
P.film = (c, t, { fps = 24, flicker = [0.02, 0.07, 0.06], scratches = 3, dust = 14, grain = 'film', grainDensity = 0.18, gate = true, ink = '20,16,10', light = '255,252,240' } = {}) => {
  const fq = Math.floor(t * fps), r = rng(fq * 7919 + 11);
  c.fillStyle = `rgba(255,250,235,${flicker[0] + r() * flicker[1]})`; c.fillRect(0, 0, W, H);
  c.fillStyle = `rgba(${ink},${r() * flicker[2]})`; c.fillRect(0, 0, W, H);
  // 竖划痕：用 floor(t*6) 当寿命，一条划痕能活好几格
  const r6 = rng(Math.floor(t * 6) * 131 + 5);
  for (let k = 0; k < scratches; k++) { const x = r6() * W + (r() - 0.5) * 6; c.strokeStyle = r6() < 0.5 ? `rgba(${light},.55)` : `rgba(${ink},.5)`; c.lineWidth = 1 + r6() * 2; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + (r() - 0.5) * 12, H); c.stroke(); }
  for (let k = 0; k < dust; k++) { c.fillStyle = r() < 0.6 ? `rgba(${ink},.7)` : `rgba(${light},.8)`; c.beginPath(); c.arc(r() * W, r() * H, 1 + r() * 3.5, 0, 7); c.fill(); }
  if (r() < 0.5) { c.strokeStyle = `rgba(${ink},.6)`; c.lineWidth = 1.6; const x = r() * W, y = r() * H; c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + 30, y - 20, x + 10, y + 40, x + 50, y + 30); c.stroke(); }
  if (grain) c.drawImage(P.grain(grain, grainDensity, ink.split(',').map(Number), 0.25), (r() - 0.5) * 40, (r() - 0.5) * 40);
  if (gate) c.drawImage(P.cached('film_gate', W, H, (g) => {
    const vg = g.createRadialGradient(960, 540, 420, 960, 540, 1150); vg.addColorStop(0, 'rgba(10,8,5,0)'); vg.addColorStop(0.7, 'rgba(10,8,5,.18)'); vg.addColorStop(1, 'rgba(10,8,5,.85)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
    g.fillStyle = '#0c0a07'; g.beginPath(); g.rect(0, 0, W, H); g.roundRect(18, 14, W - 36, H - 28, 60); g.fill('evenodd');
  }), 0, 0);
};
P.gateWeave = (c, t, fn, amp = [3, 4], fps = 24) => { const r = rng(Math.floor(t * fps) * 31 + 7); c.save(); c.translate((r() - 0.5) * amp[0], (r() - 0.5) * amp[1]); fn(); c.restore(); };

// ---------- 光 ----------
P.bloom = (c, { scale = 4, blur = 6, brightness = 1.1, alpha = 0.28, key = 'bloom' } = {}) => {
  const w = W / scale, h = H / scale, bl = P.scratch(key), g = bl.getContext('2d'); g.reset();
  g.filter = `blur(${blur}px) brightness(${brightness})`; g.drawImage(c.canvas, 0, 0, w, h);
  c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = alpha; c.drawImage(bl, 0, 0, w, h, 0, 0, W, H); c.restore();
};
// 坑：太阳要放在玻璃里面、核半径 ≤130，否则光晕溢到墙上像墙上挂了盏灯；横丝别超过 ~840px，否则像 bug 线。
P.lensFlare = (c, sun, t, { core = 130, rays = 10, streak = 840, ghosts = [[0.45, 34, '120,255,200', 0.09], [0.75, 18, '255,180,120', 0.12], [1.25, 56, '140,170,255', 0.06], [1.6, 24, '255,140,220', 0.09], [2.0, 90, '120,220,255', 0.04]] } = {}) => {
  c.save(); c.globalCompositeOperation = 'lighter';
  const sg = c.createRadialGradient(...sun, 0, ...sun, core); sg.addColorStop(0, 'rgba(255,255,250,.95)'); sg.addColorStop(0.18, 'rgba(255,248,220,.55)'); sg.addColorStop(1, 'rgba(255,230,180,0)'); c.fillStyle = sg; c.beginPath(); c.arc(...sun, core, 0, 7); c.fill();
  for (let k = 0; k < rays; k++) { const a = k / rays * Math.PI * 2 + t * 0.25, L = (k % 2 ? 90 : 170) * (0.9 + 0.1 * Math.sin(t * 5 + k)); c.strokeStyle = 'rgba(255,250,235,.28)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(...sun); c.lineTo(sun[0] + Math.cos(a) * L, sun[1] + Math.sin(a) * L); c.stroke(); }
  const hz = c.createLinearGradient(sun[0] - streak / 2, 0, sun[0] + streak / 2, 0); hz.addColorStop(0, 'rgba(120,200,255,0)'); hz.addColorStop(0.5, 'rgba(200,235,255,.35)'); hz.addColorStop(1, 'rgba(120,200,255,0)'); c.fillStyle = hz; c.fillRect(sun[0] - streak / 2, sun[1] - 2, streak, 4);
  const cxp = 960 + Math.sin(t * 0.7) * 20, cyp = 540;
  ghosts.forEach(([k, r, col, a]) => {
    const x = sun[0] + (cxp - sun[0]) * k, y = sun[1] + (cyp - sun[1]) * k; c.fillStyle = `rgba(${col},${a})`; c.beginPath(); for (let i = 0; i < 6; i++) { const aa = i / 6 * Math.PI * 2 + 0.3; i ? c.lineTo(x + Math.cos(aa) * r, y + Math.sin(aa) * r) : c.moveTo(x + Math.cos(aa) * r, y + Math.sin(aa) * r); } c.closePath(); c.fill(); });
  c.restore();
};

// ---------- 纹理叠在角色上 ----------
// shapeLayer：只画了角色的离屏（透明底）；drawTex(g) 往纹理层上画纸纹/颗粒/色晕。
// 坑：直接 source-atop 叠纸纹会把纸的颜色盖上去，人物整体发白；正确做法是纹理层 destination-in 角色剪影，再 multiply 叠回（迁移测试 B）。
P.textureInside = (c, shapeLayer, drawTex, { op = 'multiply', alpha = 1, key = 'texInside' } = {}) => {
  const M = P.scratch(key), mg = M.getContext('2d'); mg.reset(); mg.clearRect(0, 0, W, H);
  drawTex(mg);
  mg.globalCompositeOperation = 'destination-in'; mg.globalAlpha = 1; mg.drawImage(shapeLayer, 0, 0);
  c.save(); c.globalCompositeOperation = op; c.globalAlpha = alpha; c.drawImage(M, 0, 0); c.restore();
};

// ---------- 色调 ----------
// sat: saturation 混合灰的 α（1 = 完全去色）；tint: multiply 一层颜色（暖灰 '#f2e8d2' = 老胶片；土色纹理 = 壁画）
P.fade = (c, { sat = 1, tint } = {}) => {
  c.save(); c.globalCompositeOperation = 'saturation'; c.fillStyle = `rgba(128,128,128,${sat})`; c.fillRect(0, 0, W, H); c.restore();
  if (tint) { c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = tint; c.fillRect(0, 0, W, H); c.restore(); }
};
P.vignette = (c, { cx = 960, cy = 540, inner = 520, outer = 1150, col = 'rgba(0,0,0,.4)' } = {}) => {
  const vg = c.createRadialGradient(cx, cy, inner, cx, cy, outer); vg.addColorStop(0, col.replace(/[\d.]+\)$/, '0)')); vg.addColorStop(1, col); c.fillStyle = vg; c.fillRect(0, 0, W, H);
};
})();
