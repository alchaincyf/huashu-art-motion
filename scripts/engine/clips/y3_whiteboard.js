// 片段 · 白板手绘（y3，RSA 型）：说一句写一句、讲到东西就画出来。一支马克笔在白板上写字、画图标、画箭头、圈重点，相机跟着往下走，最后拉远看全图。
// cues：title（标题，7.5 字/秒起，赶不上下一个 cue 会自动提速）· point（要点：先画一个小圈当项目符号再写，16 字/秒起）
//       draw（画一个手绘图标：data.icon 见下方 ICONS，text = 图标下的手写说明；和刚写的那条字并排；连续的 draw 用橙箭头连起来，像示范片「一摞图 → 网络」；data.arrow:false 不画箭头）
//       image（截图/草图：笔走之字形把它「揭开」，再描一圈手绘框；等比放，不裁）
//       highlight（橙圈圈住一条：data.index = 第几个要点（只数 point，从 0 起，和 t1/y1 同一口径）；
//                 data.target = 'title' | 'draw' | 'image' 改圈那一类（配 index 数那一类，默认最新）；不写 = 最新写出的那一条；data.style:'underline' 改成划线）
// 版式：横屏有 draw/image 时左文右图，竖屏有 draw 时图标在右侧窄栏；图标和刚写的那条字并排，连续的图标之间画往下的橙箭头。
//       横屏纯文字、要点 ≥5 条时分左右两栏。字号随内容多少在 0.72–1.2 倍之间取，尽量一屏放下并撑满；放不下才让相机往下走。
// 每一笔都在 at 这一帧落下第一点；写字速度＝max(基准速度, 字数 / 到下一个 cue 的间隔)，说到下一句时这句已写完。
// 笔：两笔之间空档 <0.6s 沿弧线滑过去；更长就 0.35s 退出右下屏外，下一笔前 0.3s 再进来；最后一笔画完一定退场，不留在字上。
// safe（spec.safe）：内容只排在 top..H−bottom 之间，收尾拉远也只拉进这一带。alpha：墨色外面描一圈白边，叠在深色画面上也看得见。
// spec.theme（全片色板 ctx.pal）：板面就是片子的底色 bg（和前后镜头连成一片；深底色板就是一块黑板），字和线 ink，
//   项目符号、箭头、圈重点 accent，图标里的浅色铺底是 accent 的淡色。
CLIPS.y3_whiteboard = (() => {
const { clamp, lerp } = U;
let INK = '#0A0503', ORANGE = '#EF7226', WASH = 'rgba(239,114,38,.22)', BOARD = '#FBFBFB';
const FONT = 'LXGWWenKai-500';
// ---------- 手绘图标：单位框 [-0.5,0.5]²（y 朝下）里的笔画；o:1 = 橙色强调，seg:1 = 快速直线（网络连线），fill = 铺浅橙 ----------
const A = (cx, cy, rx, ry, a0, a1, n = 22) => DG.arcPts(cx, cy, rx, ry, a0, a1, n);
const box = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0 + 0.01]];
const ICONS = {
  person: () => [{ p: A(0, -0.3, 0.13, 0.13, -Math.PI / 2, Math.PI * 1.55) }, { p: [[0, -0.17], [0, 0.14]] }, { p: [[-0.24, -0.04], [0, -0.1], [0.24, -0.04]] }, { p: [[-0.17, 0.44], [0, 0.14], [0.17, 0.44]] }],
  cat: () => { const k = 1 / 380, T = pts => pts.map(([x, y]) => [x * k, y * k + 0.44]);
    return [{ p: T([[-60, -250], [-92, -330], [-30, -300], [30, -300], [92, -330], [60, -250]]) }, { p: T(A(0, -230, 100, 82, -0.55, Math.PI + 0.55, 26).reverse()) },
      { p: T([[-80, -170], [-120, -60], [-110, 0], [110, 0], [120, -60], [80, -170]]), fill: T([[-80, -170], [-120, -60], [-110, 0], [110, 0], [120, -60], [80, -170], [0, -150]]) },
      { p: T([[110, -20], [190, -40], [210, -130], [170, -190]]) }, { p: T(A(-38, -240, 12, 16, 0, Math.PI * 2, 14)), w: 0.8 }, { p: T(A(38, -240, 12, 16, 0, Math.PI * 2, 14)), w: 0.8 },
      { p: T([[-30, -196], [-110, -206]]), w: 0.6 }, { p: T([[30, -196], [110, -206]]), w: 0.6 }]; },
  network: () => { const C = [[-0.38, [-0.28, 0, 0.28]], [0, [-0.33, -0.11, 0.11, 0.33]], [0.38, [-0.14, 0.14]]], r = 0.06, out = [];
    for (const [x, ys] of C) for (const y of ys) out.push({ p: A(x, y, r, r, -Math.PI / 2, Math.PI * 1.55, 14), fast: 1 });
    for (let a = 0; a < 2; a++) for (const y0 of C[a][1]) for (const y1 of C[a + 1][1]) out.push({ seg: [[C[a][0] + r, y0], [C[a + 1][0] - r, y1]] });
    return out; },
  doc: () => [{ p: [[0.14, -0.42], [-0.3, -0.42], [-0.3, 0.42], [0.3, 0.42], [0.3, -0.26], [0.14, -0.42], [0.14, -0.26], [0.3, -0.26]] },
    { p: [[-0.18, -0.12], [0.18, -0.12]], w: 0.7 }, { p: [[-0.18, 0.04], [0.18, 0.04]], w: 0.7 }, { p: [[-0.18, 0.2], [0.06, 0.2]], w: 0.7 }],
  chat: () => [{ p: [[-0.3, -0.36], [0.3, -0.36], [0.42, -0.24], [0.42, 0.1], [0.3, 0.22], [-0.06, 0.22], [-0.24, 0.4], [-0.2, 0.22], [-0.3, 0.22], [-0.42, 0.1], [-0.42, -0.24], [-0.3, -0.36]] },
    ...[-0.18, 0, 0.18].map(x => ({ p: A(x, -0.07, 0.035, 0.035, 0, Math.PI * 2, 10), w: 0.9, fast: 1 }))],
  bulb: () => [{ p: A(0, -0.12, 0.26, 0.26, Math.PI * 0.72, Math.PI * 2.28, 30), fill: A(0, -0.12, 0.26, 0.26, 0, Math.PI * 2, 30) }, { p: [[-0.11, 0.12], [-0.11, 0.27], [0.11, 0.27], [0.11, 0.12]] },
    { p: [[-0.08, 0.36], [0.08, 0.36]] }, ...[-2.4, -1.57, -0.74].map(a => ({ p: [[Math.cos(a) * 0.34, -0.12 + Math.sin(a) * 0.34], [Math.cos(a) * 0.46, -0.12 + Math.sin(a) * 0.46]], o: 1, fast: 1 }))],
  check: () => [{ p: [[-0.32, 0.0], [-0.08, 0.26], [0.36, -0.32]], o: 1, w: 1.5 }],
  cross: () => [{ p: [[-0.28, -0.28], [0.28, 0.28]], o: 1, w: 1.5 }, { p: [[0.28, -0.28], [-0.28, 0.28]], o: 1, w: 1.5 }],
  screen: () => [{ p: box(-0.44, -0.36, 0.44, 0.2) }, { p: [[0, 0.2], [0, 0.34]] }, { p: [[-0.2, 0.36], [0.2, 0.36]] },
    { p: [[-0.32, -0.22], [0.06, -0.22]], w: 0.6, fast: 1 }, { p: [[-0.24, -0.1], [0.24, -0.1]], w: 0.6, fast: 1 }, { p: [[-0.24, 0.02], [0.12, 0.02]], w: 0.6, fast: 1 }],
  stack: () => [2, 1, 0].map(i => ({ p: box(-0.4 + i * 0.09, -0.22 - i * 0.09, 0.2 + i * 0.09, 0.3 - i * 0.09), paper: 1 })).concat([{ p: [[-0.3, 0.2], [-0.14, 0.02], [0, 0.14], [0.1, 0.06], [0.2, 0.2]], w: 0.7 }]),
  gear: () => { const pts = []; for (let i = 0; i <= 64; i++) { const a = i / 64 * Math.PI * 2, r = (Math.floor(i / 4) % 2) ? 0.3 : 0.4; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
    return [{ p: pts }, { p: A(0, 0, 0.12, 0.12, 0, Math.PI * 2.1, 16) }]; },
  target: () => [{ p: A(0, 0.04, 0.4, 0.4, -Math.PI / 2, Math.PI * 1.55, 32) }, { p: A(0, 0.04, 0.25, 0.25, -Math.PI / 2, Math.PI * 1.55, 24) }, { p: A(0, 0.04, 0.09, 0.09, 0, Math.PI * 2, 12), fill: A(0, 0.04, 0.09, 0.09, 0, Math.PI * 2, 12) },
    { p: [[0.46, -0.42], [0.02, 0.02]], o: 1 }, { p: [[0.3, -0.42], [0.46, -0.42], [0.46, -0.26]], o: 1 }],
  clock: () => [{ p: A(0, 0, 0.4, 0.4, -Math.PI / 2, Math.PI * 1.55, 32) }, { p: [[0, -0.26], [0, 0], [0.18, 0.1]] }],
  chart: () => [{ p: [[-0.42, -0.42], [-0.42, 0.38], [0.44, 0.38]] }, { p: [[-0.32, 0.22], [-0.12, 0.04], [0.06, 0.12], [0.34, -0.26]], o: 1 }, { p: [[0.18, -0.26], [0.34, -0.26], [0.34, -0.1]], o: 1 }],
};
let B, keys, items, OFF, lastEnd, band;
const halo = (c, src, W, H, col, r) => {                          // 透明底：墨色外描一圈白边（8 个方向各压一次剪影）
  const s2 = UI.scratch('clip_y3halo', W, H), g = s2.getContext('2d'); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H);
  g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; c.drawImage(s2, Math.cos(a) * r, Math.sin(a) * r); }
  c.drawImage(src, 0, 0);
};
// 折行但各行等长：先按栏宽折出 n 行，再找「仍是 n 行」的最窄宽度重折（不留一个字孤零零挂在第二行）
const balance = (g, text, maxW, font) => { const n = TY.wrap(g, text, maxW, font).length; if (n < 2) return [text];
  let lo = maxW * 0.4, hi = maxW; for (let k = 0; k < 14; k++) { const m = (lo + hi) / 2; if (TY.wrap(g, text, m, font).length > n) lo = m; else hi = m; } return TY.wrap(g, text, hi, font); };
// 手绘矩形：先把四条边各加密成多点，再加抖动，角还是角（直接对 4 个角点做 Catmull-Rom 会画成一个圆团）
const rectPts = (x, y, w, h) => { const P = [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y + 3]], out = [];
  for (let i = 0; i < 4; i++) for (let k = 0; k < 12; k++) out.push([lerp(P[i][0], P[i + 1][0], k / 12), lerp(P[i][1], P[i + 1][1], k / 12)]); out.push(P[4]); return out; };
function layout(ctx, f) {
  const { W, H, u, FPS, safe } = ctx, pad = (ctx.portrait ? 80 : 150) * u, lw = 6.5 * u, g = document.createElement('canvas').getContext('2d');
  const cues = ctx.cues, next = q => { const i = cues.indexOf(q); const n = cues.slice(i + 1).find(z => z.at > q.at + 1e-6); return n ? n.at : ctx.dur; };
  const hasDraw = cues.some(q => q.kind === 'draw'), hasImg = cues.some(q => q.kind === 'image' && ctx.IMG[q.image]);
  // 栏：横屏有图就左文右图；竖屏有 draw 时图标排在右侧窄栏、和它说的那条字并排（截图仍整宽）
  const S = (ctx.portrait ? 250 : 210) * u * f, gap = 70 * u * f;
  const two = ctx.portrait ? hasDraw : (hasDraw || hasImg);
  const colP = !two ? null : ctx.portrait ? { x: W - pad - S, w: S } : { x: W * 0.55, w: W * 0.45 - pad };
  const nPt = cues.filter(q => q.kind === 'point').length, split = !ctx.portrait && !two && nPt >= 5 ? Math.ceil(nPt / 2) : 0;   // 横屏纯文字、要点 ≥5 条：分左右两栏写
  const colT = { x: pad, w: split ? W / 2 - pad - 40 * u : !two ? W - 2 * pad : ctx.portrait ? colP.x - gap - pad : W * 0.5 - pad };
  let kPt = 0, col0 = null;
  // 同一份清单的要点用同一个字号：取「放进一行」要缩到的最小那个（最小 0.72），还放不下的那条再折行
  const pSize = Math.min(74 * u * f, ...cues.filter(q => q.kind === 'point').map(q => { const r = TY.fit(g, q.text || '', colT.w - 80 * u, 74 * u * f, FONT, { maxLines: 1, min: 0.72, soft: true }); return r.ok ? r.size : 74 * u * f * 0.72; }));
  const B = DG.board({ ink: INK, lw, speed: 2600 * u, font: `"${FONT}"` }), items = [];
  const top = (ctx.portrait ? 240 : 130) * u + safe.top;
  let yT = top, yP = top, lastText = null, lastDraw = null;               // 文字流 / 图流的当前 y
  const start = q => B.at(Math.max(0, q.at - 1 / FPS));                  // 第一笔在 at 这一帧可见
  const capSz = (ctx.portrait ? 52 : 50) * u * Math.max(0.85, Math.min(1.1, f)), capRight = !ctx.portrait;   // 横屏说明写在图标右边，竖屏写在下面
  for (const q of cues) {
    if (q.kind === 'title' || q.kind === 'point') {
      const title = q.kind === 'title', indent = title ? 0 : 80 * u, colW = title ? W - 2 * pad : colT.w;
      const ft = title ? TY.fit(g, q.text || '', colW - indent, 112 * u * f, FONT, { maxLines: 1, min: 0.72, soft: true }) : { size: pSize, lines: TY.wrap(g, q.text || '', colW - indent, `${pSize}px "${FONT}"`) };   // 标题先缩字号放一行，放不下再折行
      const size = ft.size, lines = ft.lines.length > 1 ? balance(g, q.text || '', colW - indent, `${size}px "${FONT}"`) : ft.lines;
      const n = [...(q.text || '')].length, room = Math.max(0.35, next(q) - q.at - 0.15 - (title ? 0 : 0.15)), rate = Math.max(title ? 7.5 : 16, n / room);
      if (title) yT = Math.max(yT, yP);
      else { if (col0 == null) col0 = yT; if (split && kPt === split) { colT.x = W / 2 + 40 * u; yT = col0; } kPt++; }
      let y = yT + size * (title ? 1.1 : 1.0);
      start(q);
      if (!title) B.line(DG.ellipsePts(colT.x + 26 * u, y - size * 0.32, 15 * u, 15 * u, -1.6, 1.05, 18), { w: lw * 0.9, col: ORANGE, speed: 9000 * u, min: 0.08, gap: 0.02 });
      const x = (title ? pad : colT.x) + indent, it = { q, kind: q.kind, x, y0: y - size, lines, size };
      lines.forEach((ln, k) => B.text(ln, x, y + k * size * 1.3, size, { col: INK, rate }));
      g.font = `${size}px "${FONT}"`; it.w = Math.max(...lines.map(l => g.measureText(l).width)); it.y1 = y + (lines.length - 1) * size * 1.3 + size * 0.25;
      yT = it.y1 + (title ? 60 : 44) * u * f; items.push(it);
      if (title) yP = Math.max(yP, yT); else lastText = it;
    } else if (q.kind === 'draw') {
      const icon = (q.data && q.data.icon) || '', mk = ICONS[icon];
      if (!mk && icon) console.warn(`y3 draw：没有图标「${icon}」，可用：${Object.keys(ICONS).join(' ')}（只写说明字）`);
      // 和刚写的那条字并排（那条字还没配图、且在图流下面）；否则接在图流下面
      const pair = lastText && !lastText.pic && lastText.y0 >= yP - 1;
      const y0 = two ? (pair ? lastText.y0 + (lastText.y1 - lastText.y0) / 2 - S / 2 : yP) : yT;
      const x0 = two ? colP.x : pad, cx = x0 + S / 2, cy = Math.max(y0, two ? yP : y0) + S / 2;
      if (pair) lastText.pic = true;
      const prev = lastDraw && !(q.data && q.data.arrow === false) ? lastDraw : null;
      start(q);
      const room = Math.max(0.5, next(q) - q.at - 0.15), strokes = mk ? mk() : [];
      const P = pts => pts.map(([x, y]) => [cx + x * S, cy + y * S]);
      const capN = [...(q.text || '')].length, arrowL = prev ? Math.max(0, cy - S / 2 - prev.y1) : 0;
      const len = strokes.reduce((s, k) => s + (k.p ? DG.len(P(k.p)) : 0), 0) + arrowL;
      const budget = clamp(room - (capN ? Math.max(0.3, capN / 16) : 0) - 0.1, 0.4, 1.4), sp = Math.max(2600 * u, len / budget);
      if (prev && arrowL > 30 * u) { const ax = prev.cx, ay0 = prev.y1 + 8 * u, ay1 = cy - S / 2 - 8 * u;   // 箭头：上一个图标 → 这一个（往下）
        B.line([[ax, ay0], [ax + 6 * u, lerp(ay0, ay1, 0.5)], [ax, ay1]], { col: ORANGE, w: lw, speed: sp });
        const h = Math.min(20 * u, (ay1 - ay0) * 0.4); B.line([[ax - h, ay1 - h], [ax, ay1], [ax + h, ay1 - h]], { col: ORANGE, w: lw, speed: sp, smooth: false }); }
      for (const k of strokes) {
        if (k.seg) { B.segment(P([k.seg[0]])[0], P([k.seg[1]])[0], { w: 2.5 * u, dur: 0.05, gap: 0.008 }); continue; }
        const pts = P(k.p);
        if (k.paper) B.fill(U.poly(pts), BOARD, 0.01);
        B.line(pts, { col: k.o ? ORANGE : INK, w: lw * (k.w || 1), speed: sp * (k.fast ? 2 : 1), gap: 0.015 });
        if (k.fill) B.fill(U.poly(P(k.fill)), WASH);
      }
      B.at(B.cur + 0.02);
      const capMax = capRight ? W - pad - (x0 + S + 24 * u) : W - 2 * pad, cs = q.text ? TY.fit(g, q.text, capMax, capSz, FONT, { maxLines: 1 }).size : capSz;   // 说明字放不下先缩字号
      g.font = `${cs}px "${FONT}"`; const cw = q.text ? g.measureText(q.text).width : 0, crate = Math.max(16, capN / Math.max(0.3, room - (B.cur - q.at)));
      const capX = capRight ? x0 + S + 24 * u : clamp(cx, pad + cw / 2, W - pad - cw / 2), capY = capRight ? cy + cs * 0.35 : cy + S / 2 + cs * 1.05;   // 竖屏图标在右侧窄栏：居中的说明字夹回画内
      if (q.text) B.text(q.text, capX, capY, cs, { col: INK, align: capRight ? 'left' : 'center', rate: crate });
      const it = { q, kind: 'draw', x: x0, w: S, cx, y0: cy - S / 2, y1: cy + S / 2 + (capRight ? 0 : cs * 1.3),
        hx: capRight ? x0 : Math.min(x0, capX - cw / 2), hw: capRight ? S + 24 * u + cw : Math.max(x0 + S, capX + cw / 2) - Math.min(x0, capX - cw / 2) };
      items.push(it); lastDraw = it;
      if (two) { yP = it.y1 + gap; if (!ctx.portrait) yT = Math.max(yT, pair ? it.y1 + gap * 0.5 : yT); else yT = Math.max(yT, it.y1 + gap * 0.6); }
      else yT = it.y1 + gap;
    } else if (q.kind === 'image') {
      const im = ctx.IMG[q.image]; if (!im) continue;
      // 右栏的图只用剩下的高度，不让相机为右栏往下走、把左栏的字推出画
      const inCol = two && !ctx.portrait, y = (inCol ? yP : Math.max(yT, yP)) + 30 * u, box = inCol ? colP : { x: pad, w: W - 2 * pad };
      const f2 = CLIP.fit(im.width, im.height, box.x, y, box.w, inCol ? Math.max(H * 0.2, Math.min(H * 0.5 * Math.max(0.8, f), H - safe.bottom - 80 * u - y)) : H * (ctx.portrait ? 0.32 : 0.45) * Math.max(0.8, f)), it = { q, kind: 'image', x: f2.x, y0: f2.y, w: f2.w, y1: f2.y + f2.h };
      const zz = DG.zigzag(f2.x - 20 * u, f2.y - 10 * u, f2.w + 40 * u, f2.h + 20 * u, 7), cum = DG.cum(zz), rowH = (f2.h + 20 * u) / 7;
      start(q);
      const s = B.push({ kind: 'custom', t0: B.cur, t1: B.cur + Math.min(1.0, Math.max(0.4, next(q) - q.at - 0.5)), col: INK,
        draw(gg, p) { gg.save(); if (p < 1) gg.clip(DG.revealMask(zz, cum, cum[cum.length - 1] * p, rowH * 2.6)); gg.drawImage(im, f2.x, f2.y, f2.w, f2.h); gg.restore(); return p < 1 ? DG.pointAt(zz, cum, cum[cum.length - 1] * p) : null; },
        start() { return zz[0]; }, end() { return zz[zz.length - 1]; } });
      B.at(s.t1 + 0.02);
      B.line(rectPts(f2.x - 10 * u, f2.y - 10 * u, f2.w + 20 * u, f2.h + 20 * u), { w: lw * 0.8, speed: 9000 * u, amp: 1.0 * u });
      yP = f2.y + f2.h + 60 * u; if (!inCol) yT = yP; items.push(it); lastDraw = null;
    } else if (q.kind === 'highlight') {
      const d = q.data || {}, written = items.filter(z => z.q.at <= q.at), kind = d.target || (d.index != null ? 'point' : null);
      const pool = kind ? written.filter(z => z.kind === kind) : written, all = kind ? items.filter(z => z.kind === kind) : items;
      const it = d.index != null ? all[d.index] : pool[pool.length - 1];
      if (!it) { console.warn(`y3 highlight at=${q.at}：找不到要圈的条目（index=${d.index} target=${d.target || 'point'}）`); continue; }
      start(q);
      const hx = it.hx ?? it.x, hw = it.hw ?? it.w;
      if (d.style === 'underline') B.line([[hx - 10 * u, it.y1 + 12 * u], [hx + hw / 2, it.y1 + 18 * u], [hx + hw + 10 * u, it.y1 + 10 * u]], { col: ORANGE, w: lw * 1.3, speed: 3000 * u });
      else B.line(DG.ellipsePts(hx + hw / 2, (it.y0 + it.y1) / 2, hw * 0.56 + 30 * u, (it.y1 - it.y0) * 0.62 + 24 * u, -2.9, 1.08, 44), { col: ORANGE, w: lw, speed: 3600 * u, amp: 1.6 * u });
    }
  }
  const bottom = Math.max(...items.map(z => z.y1), top);
  return { B, items, bottom, top, pad };
}
return {
  fonts: [FONT],
  safe: true,
  init(ctx) {
    const { W, H, u, safe } = ctx, p = ctx.pal;
    if (p) { INK = p.ink; ORANGE = p.accent; WASH = PAL.alpha(p.accent, 0.22); BOARD = p.bg; } else { INK = '#0A0503'; ORANGE = '#EF7226'; WASH = 'rgba(239,114,38,.22)'; BOARD = '#FBFBFB'; }
    band = { y0: safe.top, y1: H - safe.bottom }; band.h = band.y1 - band.y0;
    // 字号系数 f 从 1.2 往下试：内容少就放大撑满版面，内容多就缩（最小 0.72），还放不下才让相机往下走
    let L; for (let f = 1.2; f >= 0.7; f -= 0.04) { L = layout(ctx, f); if (L.bottom + 70 * u <= band.y1) break; }   // 内容少就放大（最大 1.2）把版面撑满
    ({ B, items } = L);
    OFF = [W + 140 * u, H + 280 * u];
    lastEnd = Math.max(0, ...B.S.map(s => s.t1));
    // 相机：内容超出可用带就在下一条开写前平移过去（sineInOut）；最后有空就拉远看全图（只拉进 safe 带）
    keys = [{ t: 0, x: W / 2, y: H / 2, z: 1 }]; let cy = H / 2, panned = false;
    for (const it of items) {
      const need = it.y1 + 70 * u - (cy + band.y1 - H / 2); if (need <= 0) continue;
      panned = true; cy += need + band.h * 0.12; const t1 = Math.max(keys[keys.length - 1].t + 0.2, it.q.at), t0 = Math.max(keys[keys.length - 1].t + 0.01, t1 - 0.6);
      keys.push({ t: t0, x: W / 2, y: keys[keys.length - 1].y, z: 1 }); keys.push({ t: t1, x: W / 2, y: cy, z: 1, ease: MO.sineInOut });
    }
    const y0c = Math.min(L.top, ...items.map(z => z.y0)) - 50 * u, y1c = L.bottom + 40 * u, total = y1c - y0c;
    const zEnd = Math.min(0.94, band.h / total * 0.96);
    // 收尾拉远：最后一笔后有 ≥0.6s 才拉；相机走过了的话，就算时间紧也在最后 0.8s 拉（不然末帧标题被切在顶上）
    const tz0 = Math.max(keys[keys.length - 1].t + 0.01, panned ? Math.min(lastEnd + 0.1, ctx.dur - 0.8) : lastEnd + 0.1);
    if (ctx.dur - tz0 >= 0.6) {
      const prev = keys[keys.length - 1]; keys.push({ ...prev, t: tz0, ease: undefined });
      const midW = (y0c + y1c) / 2, ty = midW - ((band.y0 + band.y1) / 2 - H / 2) / zEnd;     // 全图中心落在 safe 带中心
      keys.push({ t: Math.min(ctx.dur - 0.15, tz0 + 0.8), x: W / 2, y: ty, z: zEnd, ease: MO.sineInOut });
    }
  },
  draw(c, t, ctx) {
    const { W, H, u } = ctx, cam = CAM.at(keys, t);
    const g = ctx.alpha ? (() => { const b = UI.scratch('clip_y3buf', W, H), x = b.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H); return x; })() : c;
    if (!ctx.alpha) { c.fillStyle = BOARD; c.fillRect(0, 0, W, H); }
    g.save(); CAM.apply(g, cam); const { tip, col } = B.draw(g, t); g.restore();
    const pen = penAt(t, cam, tip, ctx);
    if (pen) DG.pen(g, pen[0], pen[1], col || B.penColor(t), Math.sin(t * 7) * 0.03);
    if (ctx.alpha) halo(c, g.canvas, W, H, 'rgba(255,255,255,0.92)', 4 * u);
  },
};
// 笔的位置（屏幕）：在画 → 笔尖；空档短 → 沿弧线滑；空档长 → 退出右下再进来；画完最后一笔 → 0.35s 退场（返回 null = 不画）
function penAt(t, cam, tip, ctx) {
  if (tip) return CAM.toScreen(cam, tip[0], tip[1]);
  const hs = B.S.filter(s => s.kind !== 'pop' && s.kind !== 'fill' && (s.kind !== 'custom' || s.handed !== false));
  let prev = null, next = null; for (const s of hs) { if (s.t1 <= t) prev = s; else if (s.t0 > t && !next) next = s; }
  if (prev && next && next.t0 - prev.t1 <= 0.6) return B.penAt(t, cam, null);
  const end = s => B.penAt(s.t1, cam, null);                       // 上一笔终点（屏幕）
  if (next && next.t0 - t <= 0.3) { const b = CAM.toScreen(cam, ...(next.kind === 'custom' ? next.start() : next.kind === 'line' ? next.pts[0] : [next.x, next.y - next.size * 0.3])), q = MO.cubicOut(1 - (next.t0 - t) / 0.3); return [lerp(OFF[0], b[0], q), lerp(OFF[1], b[1], q)]; }
  if (prev && t - prev.t1 < 0.35) { const a = end(prev), q = MO.cubicIn((t - prev.t1) / 0.35); return [lerp(a[0], OFF[0], q), lerp(a[1], OFF[1], q)]; }
  return null;
}
})();
