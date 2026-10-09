// 转场库：每个函数 (c, A, B, p, o) —— A=旧画面 canvas，B=新画面 canvas，p∈[0,1]，
// o: {W,H,lt,t,tmp,IMG, ...该转场在 eras.js 里的参数}。确定性：随机数一律 U.rng(种子)。
// 每个转场都取「新时代」最有辨识度的形式元素（见 经验日志「转场」）。
(() => {
let W = 1920, H = 1080; U.onStage((w, h) => { W = w; H = h; });   // 画布尺寸跟 U.setStage 走：竖屏整片（render.py --width 1080 --height 1920）的转场按当前画布算
const sx = x => x * W / 1920, sy = y => y * H / 1080;          // 按 1920×1080 写的默认位置换算到当前画布（横屏时原样）
const { clamp, lerp, ease, rng } = U, TAU = Math.PI * 2;
const seg = (p, a, b) => clamp((p - a) / (b - a));          // 把 p 的 [a,b] 段拉成 0..1

// 缓存：同一转场里不随时间变化的预计算（瓦片表、离屏画布…）。
// 只缓存「和画面内容无关」的东西（几何表、scratch 画布）。依赖 A/B 画面内容的东西不要缓存：
// 缓存的是第一次被调用那一帧，同名转场在片中用第二次会画出第一次的内容，乱序渲染时还依赖调用顺序（迁移测试 B ②-10）。
// 确实要按段缓存时传 o：once(k, f, o) 的键带上进入段 id。
const cache = {};
const once = (k, f, o) => { const kk = o ? `${o.id}|${k}` : k; return cache[kk] || (cache[kk] = f()); };

const mkc = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

const T = window.TRANSITIONS = {
  crossfade(c, A, B, p) { c.drawImage(A, 0, 0); c.globalAlpha = p; c.drawImage(B, 0, 0); c.globalAlpha = 1; },
  cut(c, A, B, p) { c.drawImage(p < 0.5 ? A : B, 0, 0); },

  // ① 洞穴→埃及：新画面拆成大小不一的石块，从左向右（带随机）拼进来，落位时从略大略偏处「砌」进去
  tiles(c, A, B, p, o) {
    const tiles = once('tiles', () => {
      const r = rng(7), out = [];
      // 三种块尺寸混排：先铺大块网格，再随机把一部分拆成小块
      const bw = 240, bh = 180;
      for (let y = 0; y < H; y += bh) for (let x = 0; x < W; x += bw) {
        if (r() < 0.45) { for (let yy = 0; yy < 2; yy++) for (let xx = 0; xx < 2; xx++) out.push({ x: x + xx * bw / 2, y: y + yy * bh / 2, w: bw / 2, h: bh / 2 }); }
        else out.push({ x, y, w: bw, h: bh });
      }
      out.forEach(t => { t.t = clamp((t.x + t.w / 2) / W * 0.62 + r() * 0.3); t.dx = (r() - 0.5) * 60; t.dy = -30 - r() * 50; t.rot = (r() - 0.5) * 0.12; });
      return out;
    });
    c.drawImage(A, 0, 0);
    for (const t of tiles) {
      const q = clamp((p - t.t * 0.7) / 0.28); if (q <= 0) continue;
      const e = ease.outBack(q);
      c.save();
      c.translate(t.x + t.w / 2 + t.dx * (1 - e), t.y + t.h / 2 + t.dy * (1 - e));
      c.rotate(t.rot * (1 - e));
      const s = 1.08 - 0.08 * e; c.scale(s, s);
      if (q < 1) { c.shadowColor = 'rgba(30,15,5,.55)'; c.shadowBlur = 18 * (1 - q); c.shadowOffsetY = 10 * (1 - q); }
      c.drawImage(B, t.x, t.y, t.w, t.h, -t.w / 2, -t.h / 2, t.w, t.h);
      c.restore();
    }
  },

  // ② 埃及→希腊：立方体绕竖轴转面（旧面向左转走，新面从右转入），面上有明暗
  cube(c, A, B, p) {
    const e = ease.inOut(p), th = e * Math.PI / 2;
    c.fillStyle = '#0d0a08'; c.fillRect(0, 0, W, H);
    const face = (img, ang, side) => {
      // 正交近似透视：面宽 = W*cos(ang)，远端边缩短 k
      const w = W * Math.cos(ang); if (w < 2) return;
      const N = 48, k = 0.18 * Math.sin(ang);
      for (let i = 0; i < N; i++) {
        const u0 = i / N, u1 = (i + 1) / N;
        const far = side === 'left' ? 1 - u0 : u0;                 // 远端在转出去的那一侧
        const sh = 1 - k * far, hh = H * sh;
        const x = side === 'left' ? u0 * w : W - w + u0 * w;
        c.drawImage(img, u0 * W, 0, W / N + 1, H, x, (H - hh) / 2, w / N + 1, hh);
      }
      c.fillStyle = `rgba(0,0,0,${0.55 * Math.sin(ang)})`;
      c.fillRect(side === 'left' ? 0 : W - w, 0, w, H);
    };
    face(A, th, 'left');
    face(B, Math.PI / 2 - th, 'right');
  },

  // ③ 希腊→罗马：马赛克小砖翻面——从猫的位置向外扩散，翻面瞬间露出深色砖背
  mosaic(c, A, B, p, o) {
    const tw = 18, th = 34, ox = W * 0.27, oy = H * 0.72;
    const grid = once('mosaic', () => {
      const r = rng(11), g = [], maxd = Math.hypot(W, H) * 0.8;
      for (let y = 0; y < H; y += th) for (let x = 0; x < W; x += tw) {
        const d = Math.hypot(x - ox, (y - oy) * 1.3) / maxd;
        g.push({ x, y, t: clamp(d * 0.75 + r() * 0.25) });
      }
      return g;
    });
    c.drawImage(A, 0, 0);
    for (const g of grid) {
      const q = (p - g.t * 0.78) / 0.16;
      if (q <= 0) continue;
      if (q >= 1) { c.drawImage(B, g.x, g.y, tw, th, g.x, g.y, tw, th); continue; }
      // 翻面：宽度按 |cos| 缩放，前半显示深色砖背，后半显示新砖
      const sx = Math.abs(Math.cos(q * Math.PI));
      c.fillStyle = '#17110d'; c.fillRect(g.x, g.y, tw, th);
      const w = tw * sx;
      if (q > 0.5) c.drawImage(B, g.x, g.y, tw, th, g.x + (tw - w) / 2, g.y, w, th);
      else { c.fillStyle = '#2a1c14'; c.fillRect(g.x + (tw - w) / 2, g.y, w, th); }
    }
  },

  // ④ 罗马→哥特：羊皮纸翻页，卷边从右向左扫过，背面是带淡淡旧画透印的羊皮纸
  pageTurn(c, A, B, p) {
    const e = ease.inOut(p);
    const band = 260;
    const x = lerp(W + band, -band * 1.4, e);          // 卷边位置
    c.drawImage(B, 0, 0);
    // 旧页：卷边左侧
    c.save(); c.beginPath(); c.rect(0, 0, Math.max(0, x - band * 0.15), H); c.clip(); c.drawImage(A, 0, 0); c.restore();
    // 卷起的页背：羊皮纸色＋旧画镜像透印＋圆柱明暗
    c.save();
    c.beginPath(); c.rect(x - band * 0.15, 0, band, H); c.clip();
    c.fillStyle = '#e9dcc0'; c.fillRect(x - band * 0.15, 0, band, H);
    c.globalAlpha = 0.18; c.save(); c.translate(2 * x + band * 0.7, 0); c.scale(-1, 1); c.drawImage(A, 0, 0); c.restore(); c.globalAlpha = 1;
    const g = c.createLinearGradient(x - band * 0.15, 0, x + band * 0.85, 0);
    g.addColorStop(0, 'rgba(60,40,20,.45)'); g.addColorStop(0.18, 'rgba(255,248,230,.25)'); g.addColorStop(0.55, 'rgba(120,90,50,.12)'); g.addColorStop(1, 'rgba(40,25,10,.55)');
    c.fillStyle = g; c.fillRect(x - band * 0.15, 0, band, H);
    c.restore();
    // 卷边投在新页上的影子
    const sg = c.createLinearGradient(x + band * 0.85, 0, x + band * 0.85 + 90, 0);
    sg.addColorStop(0, 'rgba(30,20,10,.35)'); sg.addColorStop(1, 'rgba(30,20,10,0)');
    c.fillStyle = sg; c.fillRect(x + band * 0.85, 0, 90, H);
  },

  // ⑤ 哥特→文艺复兴：窗口迸出金色神光，光芒里旧画渐隐、新画浮现
  godRays(c, A, B, p, o) {
    const cx = o.cx || sx(440), cy = o.cy || sy(300);
    c.drawImage(A, 0, 0);
    c.globalAlpha = ease.out(seg(p, 0.05, 0.5)); c.drawImage(B, 0, 0); c.globalAlpha = 1;
    // 光晕
    const glow = Math.sin(Math.PI * Math.pow(seg(p, 0, 1), 0.6));
    const rg = c.createRadialGradient(cx, cy, 0, cx, cy, 520);
    rg.addColorStop(0, `rgba(255,246,210,${0.85 * glow})`); rg.addColorStop(0.35, `rgba(255,220,140,${0.35 * glow})`); rg.addColorStop(1, 'rgba(255,220,140,0)');
    c.globalCompositeOperation = 'lighter'; c.fillStyle = rg; c.fillRect(0, 0, W, H);
    // 光芒
    const r = rng(5), n = 34, rot = p * 0.35;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + rot + r() * 0.08, len = 2400, wd = 0.006 + r() * 0.01;
      const al = glow * (0.25 + r() * 0.45);
      c.fillStyle = `rgba(255,214,120,${al})`;
      c.beginPath(); c.moveTo(cx, cy);
      c.lineTo(cx + Math.cos(a - wd) * len, cy + Math.sin(a - wd) * len);
      c.lineTo(cx + Math.cos(a + wd) * len, cy + Math.sin(a + wd) * len); c.fill();
    }
    c.globalCompositeOperation = 'source-over';
  },

  // ⑥ 文艺复兴→浮世绘：神奈川冲浪里的巨浪从左向右横扫，浪头白沫爪＋飞溅浪花，浪后是新画面
  wave(c, A, B, p) {
    const e = ease.inOut(p);
    const bw = 300;                                     // 浪带宽
    const x0 = lerp(-bw - 120, W + 260, e);             // 浪带左缘
    const edge = y => x0 + Math.sin(y / H * Math.PI * 1.6 + 0.6) * 70;   // S 形
    c.drawImage(A, 0, 0);
    // 新画面：浪带左侧
    c.save(); c.beginPath(); c.moveTo(-10, 0);
    for (let y = 0; y <= H; y += 20) c.lineTo(edge(y) + 10, y);
    c.lineTo(-10, H); c.closePath(); c.clip(); c.drawImage(B, 0, 0); c.restore();
    // 浪带本体
    c.save(); c.beginPath();
    for (let y = 0; y <= H; y += 20) c.lineTo(edge(y), y);
    for (let y = H; y >= 0; y -= 20) c.lineTo(edge(y) + bw, y);
    c.closePath(); c.fillStyle = '#1f3f8a'; c.fill(); c.clip();
    // 浪纹：几条平行的浅蓝曲线
    c.strokeStyle = 'rgba(170,200,240,.75)'; c.lineWidth = 6;
    for (let k = 1; k < 7; k++) {
      c.beginPath();
      for (let y = 0; y <= H; y += 20) c.lineTo(edge(y) + k * bw / 7 + Math.sin(y / 60 + k) * 6, y);
      c.stroke();
    }
    c.restore();
    // 浪头白沫爪（右缘锯齿）
    c.fillStyle = '#fbf7ec'; c.strokeStyle = '#1b2a55'; c.lineWidth = 2;
    for (let y = -20; y < H + 40; y += 54) {
      const ex = edge(y) + bw;
      c.beginPath(); c.moveTo(ex - 6, y);
      c.quadraticCurveTo(ex + 40, y + 6, ex + 58, y + 22);
      c.quadraticCurveTo(ex + 30, y + 26, ex + 22, y + 40);
      c.quadraticCurveTo(ex + 10, y + 46, ex - 6, y + 54); c.closePath(); c.fill(); c.stroke();
    }
    // 飞沫
    const r = rng(19);
    for (let i = 0; i < 70; i++) {
      const y = r() * H, ex = edge(y) + bw + 30 + r() * 170, rr = 3 + r() * 7;
      c.globalAlpha = 0.9 * (1 - r() * 0.5);
      c.beginPath(); c.arc(ex, y, rr, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;
  },

  // ⑦ 浮世绘→印象派：一笔笔短促的彩色笔触把新画面「画」上去
  dabs(c, A, B, p) {
    const D = once('dabs', () => {
      const r = rng(23), out = [];
      for (let i = 0; i < 2600; i++) out.push({ x: r() * W, y: r() * H, a: -0.9 + r() * 0.5, l: 34 + r() * 46, w: 10 + r() * 10, t: r() });
      return out;
    });
    c.drawImage(A, 0, 0);
    const q = ease.out(seg(p, 0, 0.7));
    c.save(); c.beginPath();
    let any = false;
    for (const d of D) {
      if (d.t > q) continue; any = true;
      const s = clamp((q - d.t) / 0.12);
      c.moveTo(d.x + Math.cos(d.a) * d.l * s / 2, d.y + Math.sin(d.a) * d.l * s / 2);
      c.ellipse(d.x, d.y, d.l * s / 2, d.w / 2, d.a, 0, Math.PI * 2);
    }
    if (any) { c.clip(); c.drawImage(B, 0, 0); }
    c.restore();
    // 浮在上面的零星亮色笔触（印象派光斑）
    const r = rng(29), al = Math.sin(Math.PI * p) * 0.8;
    const cols = ['#f6e27a', '#f2a7c3', '#b9d9f2', '#c6e8a8', '#ffffff'];
    for (let i = 0; i < 260; i++) {
      const x = r() * W, y = r() * H, a = -0.8 + r() * 0.4, l = 20 + r() * 30, col = cols[(r() * cols.length) | 0];
      if (r() > al) continue;
      c.fillStyle = col; c.globalAlpha = 0.75; c.beginPath(); c.ellipse(x, y, l / 2, 4 + r() * 3, a, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;
    if (p > 0.7) { c.globalAlpha = seg(p, 0.7, 1); c.drawImage(B, 0, 0); c.globalAlpha = 1; }
  },

  // ⑧ 印象派→梵高：星空漩涡——以窗户为中心的旋涡扭曲，新画面带着旋转卷进来、最后摆正
  swirl(c, A, B, p, o) {
    const cx = o.cx || sx(420), cy = o.cy || sy(300);
    const S = 2;                                        // 半分辨率做像素扭曲
    const w = W / S, h = H / S;
    const src = once('swirlSrc', () => ({ a: mkc(w, h), b: mkc(w, h), out: mkc(w, h) }));
    const sa = src.a.getContext('2d'), sb = src.b.getContext('2d'), so = src.out.getContext('2d');
    sa.drawImage(A, 0, 0, w, h); sb.drawImage(B, 0, 0, w, h);
    const da = sa.getImageData(0, 0, w, h).data, db = sb.getImageData(0, 0, w, h).data;
    const out = so.createImageData(w, h), d = out.data;
    const e = ease.out(p);
    const R = 1100 / S, ccx = cx / S, ccy = cy / S;
    const twA = e * 5.0, twB = (1 - e) * 4.2, rotB = -(1 - e) * 0.9;
    const mixR = e * 2.4;                               // 新画面从中心向外占领的半径（相对 R）
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = x - ccx, dy = y - ccy, r = Math.hypot(dx, dy), ang = Math.atan2(dy, dx), f = Math.max(0, 1 - r / R);
      const useB = r / R < mixR - 0.15 + Math.sin(ang * 3 + r / 40) * 0.08;
      let a2, sd;
      if (useB) { a2 = ang + twB * f * f + rotB * Math.min(1, f * 1.6); sd = db; } else { a2 = ang - twA * f * f; sd = da; }
      let sx = (ccx + Math.cos(a2) * r) | 0, sy = (ccy + Math.sin(a2) * r) | 0;
      sx = sx < 0 ? 0 : sx >= w ? w - 1 : sx; sy = sy < 0 ? 0 : sy >= h ? h - 1 : sy;
      const i = (y * w + x) * 4, j = (sy * w + sx) * 4;
      d[i] = sd[j]; d[i + 1] = sd[j + 1]; d[i + 2] = sd[j + 2]; d[i + 3] = 255;
    }
    so.putImageData(out, 0, 0);
    c.imageSmoothingQuality = 'high'; c.drawImage(src.out, 0, 0, W, H);
    if (p > 0.85) { c.globalAlpha = seg(p, 0.85, 1); c.drawImage(B, 0, 0); c.globalAlpha = 1; }
  },

  // ⑨ 梵高→新艺术：从人物头部长出一块带金边的有机形状（慕夏式曲线轮廓），向外生长吞没画面
  organic(c, A, B, p, o) {
    const cx = o.cx || sx(1500), cy = o.cy || sy(330);
    const e = ease.out(p) * 0.7 + p * 0.3;
    const R = e * 2300;
    const path = () => {
      c.beginPath();
      for (let i = 0; i <= 120; i++) {
        const a = i / 120 * Math.PI * 2;
        const rr = R * (1 + 0.22 * Math.sin(a * 3 + 0.7) + 0.12 * Math.sin(a * 5 + 2.1) + 0.06 * Math.sin(a * 9 + p * 3));
        const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.92;
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.closePath();
    };
    c.drawImage(A, 0, 0);
    if (R < 1) return;
    c.save(); path(); c.clip(); c.drawImage(B, 0, 0); c.restore();
    path(); c.lineJoin = 'round';
    c.strokeStyle = '#6b4a24'; c.lineWidth = 14; c.stroke();
    c.strokeStyle = '#d9b25a'; c.lineWidth = 8; c.stroke();
  },

  // ⑩ 新艺术→立体主义：画面碎成几何碎片，碎片错位旋转，新画面的碎片拼合落位
  shards(c, A, B, p) {
    const tris = once('shards', () => {
      const r = rng(31), nx = 9, ny = 6, pts = [];
      for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
        const edge = i === 0 || j === 0 || i === nx || j === ny;
        pts.push([i / nx * W + (edge ? 0 : (r() - 0.5) * W / nx * 0.8), j / ny * H + (edge ? 0 : (r() - 0.5) * H / ny * 0.8)]);
      }
      const out = [];
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const a = pts[j * (nx + 1) + i], b = pts[j * (nx + 1) + i + 1], cc = pts[(j + 1) * (nx + 1) + i], d = pts[(j + 1) * (nx + 1) + i + 1];
        const flip = r() < 0.5;
        const t1 = flip ? [a, b, d] : [a, b, cc], t2 = flip ? [a, d, cc] : [b, d, cc];
        for (const t of [t1, t2]) out.push({ p: t, cx: (t[0][0] + t[1][0] + t[2][0]) / 3, cy: (t[0][1] + t[1][1] + t[2][1]) / 3, t: r(), dx: (r() - 0.5) * 160, dy: (r() - 0.5) * 120, rot: (r() - 0.5) * 0.5, sh: 0.75 + r() * 0.5 });
      }
      return out;
    });
    const draw = (img, tr, q, out) => {
      c.save(); c.beginPath(); tr.p.forEach((v, i) => i ? c.lineTo(v[0], v[1]) : c.moveTo(v[0], v[1])); c.closePath();
      c.translate(tr.cx, tr.cy);
      const k = out ? q : 1 - q;                       // 旧片：越来越偏；新片：越来越正
      c.translate(tr.dx * k, tr.dy * k); c.rotate(tr.rot * k); c.translate(-tr.cx, -tr.cy);
      c.clip(); c.drawImage(img, 0, 0);
      c.fillStyle = `rgba(${out ? '60,45,30' : '255,250,235'},${0.12 * tr.sh * Math.sin(Math.PI * q)})`; c.fill();
      c.strokeStyle = 'rgba(40,30,20,.35)'; c.lineWidth = 2; c.stroke();
      c.restore();
    };
    c.fillStyle = '#cbbfa8'; c.fillRect(0, 0, W, H);
    for (const tr of tris) {
      const qo = ease.inOut(clamp((p - tr.t * 0.4) / 0.45));   // 旧片碎裂进度
      const qi = ease.out(clamp((p - 0.25 - tr.t * 0.45) / 0.3)); // 新片落位进度
      if (qi > 0) draw(B, tr, qi, false); else draw(A, tr, qo, true);
    }
  },

  // ⑪ 立体→包豪斯：蓝方块＋红圆＋黄三角的构成旋转放大，中心的米白圆里是新画面，最后构成扫出画面
  bauhaus(c, A, B, p, o) {
    const cx = o.cx || sx(1010), cy = o.cy || sy(560);
    c.drawImage(A, 0, 0);
    const s = Math.pow(30, ease.out(seg(p, 0, 0.7))) * 0.35;   // 指数放大
    const rot = -0.5 + p * 0.9;
    const shift = ease.in(seg(p, 0.4, 1)) * -1600;          // 构成整体扫向左边
    c.save(); c.translate(cx + shift, cy); c.rotate(rot); c.scale(s, s);
    c.fillStyle = '#1d4fa3'; c.fillRect(-170, -170, 340, 340);
    c.rotate(-rot * 0.6);
    c.fillStyle = '#d0262b'; c.beginPath(); c.arc(0, 0, 150, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f2c81c'; c.beginPath(); c.moveTo(0, -150); c.lineTo(130, 75); c.lineTo(-130, 75); c.closePath(); c.fill();
    c.restore();
    // 米白圆里是新画面（不跟随整体扫出，持续放大直到铺满）
    const rr = Math.pow(40, ease.inOut(seg(p, 0.15, 0.85))) * 30;
    c.save(); c.beginPath(); c.arc(cx, cy, rr, 0, Math.PI * 2); c.clip(); c.drawImage(B, 0, 0); c.restore();
  },

  // ⑫ 包豪斯→波普：黄色闪电劈开＋本戴网点化，旧画面变网点、新画面从网点里显影
  zigzag(c, A, B, p) {
    const halftone = (img, amt, key) => {
      const sc = 16;
      const sm = once('ht_' + key, () => mkc(W / sc, H / sc));
      const sg = sm.getContext('2d'); sg.drawImage(img, 0, 0, W / sc, H / sc);
      const d = sg.getImageData(0, 0, W / sc, H / sc).data;
      c.globalAlpha = 1; c.drawImage(img, 0, 0); c.fillStyle = 'rgba(244,236,216,.55)'; c.fillRect(0, 0, W, H);
      for (let y = 0; y < H / sc; y++) for (let x = 0; x < W / sc; x++) {
        const i = (y * W / sc + x) * 4, L = (d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11) / 255;
        const r = sc * 0.62 * (0.35 + (1 - L) * 0.85) * amt + 1;
        c.fillStyle = `rgb(${d[i]},${d[i + 1]},${d[i + 2]})`;
        c.beginPath(); c.arc(x * sc + sc / 2 + (y % 2) * sc / 2, y * sc + sc / 2, r, 0, Math.PI * 2); c.fill();
      }
    };
    if (p < 0.35) c.drawImage(A, 0, 0);
    else if (p < 0.55) halftone(A, 1, 'a');
    else if (p < 0.75) halftone(B, 1, 'b');
    else { c.drawImage(B, 0, 0); c.globalAlpha = 1 - seg(p, 0.75, 1); halftone(B, 1, 'b'); c.globalAlpha = 1; }
    // 闪电：黑边黄色锯齿带，从左上劈到右下
    const q = seg(p, 0.05, 0.6); if (q <= 0 || q >= 1) return;
    const pts = [], n = 9;
    for (let i = 0; i <= n; i++) pts.push([lerp(780, 1450, i / n) + (i % 2 ? 90 : -90), lerp(-40, H + 40, i / n)]);
    const k = Math.min(n, Math.floor(q * 2 * n) + 1);
    c.save(); c.lineJoin = 'miter';
    c.beginPath(); pts.slice(0, k + 1).forEach((v, i) => i ? c.lineTo(v[0], v[1]) : c.moveTo(v[0], v[1]));
    c.strokeStyle = '#111'; c.lineWidth = 34; c.stroke(); c.strokeStyle = '#ffe02a'; c.lineWidth = 22; c.stroke();
    c.restore();
    // 起点星爆
    if (q < 0.5) {
      c.save(); c.translate(70, 990); c.fillStyle = '#ffe02a'; c.strokeStyle = '#111'; c.lineWidth = 4; c.beginPath();
      for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2, r = i % 2 ? 70 : 105; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      c.closePath(); c.fill(); c.stroke(); c.restore();
    }
  },

  // ⑬ 波普→8-bit：旧画面像素块越来越大，切到新画面后像素块由大变小直至清晰
  pixelate(c, A, B, p) {
    const img = p < 0.5 ? A : B;
    const q = p < 0.5 ? p / 0.5 : 1 - (p - 0.5) / 0.5;
    const bs = Math.max(1, Math.round(lerp(1, 72, ease.in(q))));
    if (bs <= 1) { c.drawImage(img, 0, 0); return; }
    const sm = once('px', () => mkc(W, H)), sg = sm.getContext('2d');
    const w = Math.ceil(W / bs), h = Math.ceil(H / bs);
    sg.imageSmoothingEnabled = true; sg.clearRect(0, 0, w, h); sg.drawImage(img, 0, 0, w, h);
    c.imageSmoothingEnabled = false; c.drawImage(sm, 0, 0, w, h, 0, 0, w * bs, h * bs); c.imageSmoothingEnabled = true;
  },

  // ⑭ 8-bit→光追：黑底绿色霓虹线框（新画面的边缘＋透视网格地面），扫描线自上而下把渲染结果「算」出来
  wireframe(c, A, B, p) {
    const edges = (() => {                                   // 每帧从当前 B 重算（半分辨率 Sobel，约 10ms）：缓存会串段、依赖渲染顺序
      const s = 2, w = W / s, h = H / s, sm = once('edgesCanvas', () => mkc(w, h)), g = sm.getContext('2d', { willReadFrequently: true });
      g.clearRect(0, 0, w, h); g.drawImage(B, 0, 0, w, h);
      const d = g.getImageData(0, 0, w, h).data, out = g.createImageData(w, h), o = out.data;
      const L = (x, y) => { const i = (y * w + x) * 4; return d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11; };
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        const gx = L(x + 1, y) - L(x - 1, y), gy = L(x, y + 1) - L(x, y - 1), m = Math.hypot(gx, gy);
        const i = (y * w + x) * 4, v = m > 38 ? 255 : 0;
        o[i] = 60; o[i + 1] = 255; o[i + 2] = 150; o[i + 3] = v;
      }
      g.putImageData(out, 0, 0); return sm;
    })();
    const wire = () => {
      c.fillStyle = '#02060a'; c.fillRect(0, 0, W, H);
      // 透视网格地面
      c.strokeStyle = 'rgba(60,255,150,.8)'; c.lineWidth = 2;
      const hy = 640, vx = W / 2;
      for (let i = -24; i <= 24; i++) { c.beginPath(); c.moveTo(vx + i * 30, hy); c.lineTo(vx + i * 260, H); c.stroke(); }
      for (let k = 0; k < 12; k++) { const y = hy + Math.pow(k / 12, 2) * (H - hy); c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
      c.shadowColor = '#3cff96'; c.shadowBlur = 8; c.drawImage(edges, 0, 0, W, H); c.shadowBlur = 0;
    };
    if (p < 0.12) { c.drawImage(A, 0, 0); c.globalAlpha = p / 0.12; wire(); c.globalAlpha = 1; return; }
    wire();
    const q = ease.inOut(seg(p, 0.3, 1)), yy = q * H;
    if (yy > 0) { c.save(); c.beginPath(); c.rect(0, 0, W, yy); c.clip(); c.drawImage(B, 0, 0); c.restore(); }
    if (q > 0 && q < 1) { c.fillStyle = 'rgba(200,255,230,.9)'; c.fillRect(0, yy - 3, W, 6); }
  },

  // ⑮ 光追→2026：三色同心环从杯子(992,601)线性扩张，外径约 143px/帧，每环厚 137px，最内环里是新画面（分镜表 T15）
  iris(c, A, B, p, o) {
    const cx = o.cx || sx(992), cy = o.cy || sy(601);
    const R = 19 + p * (1159 - 19 + 3 * 137 + 900);           // 线性；到 p=1 时最内环也超出画面对角
    c.drawImage(A, 0, 0);
    const ring = (r, col) => { if (r <= 0) return; c.fillStyle = col; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill(); };
    ring(R, 'rgb(33,42,81)'); ring(R - 137, 'rgb(234,124,107)'); ring(R - 274, 'rgb(250,246,235)');
    const ri = R - 411;
    if (ri > 0) { c.save(); c.beginPath(); c.arc(cx, cy, ri, 0, Math.PI * 2); c.clip(); c.drawImage(B, 0, 0); c.restore(); }
  },

  // ===================== 迁移测试 A–D 收进来的转场（名字同 references/风格配方 里的配方卡） =====================
  // 每个都长在「进入段」风格的签名语言上：先找新风格里会「出现/点亮/扫过」的物理过程，旧画先被它污染，新画从它的形状里露出来。
  // ---- A：水墨 / 克里姆特 / 蒙克 / 敦煌 / 草间 ----
  // 水墨 → 克里姆特：金箔一片片贴上来。从少女头部按螺旋次序落下方形金箔（带螺旋/眼形/同心圆压纹），
  // 贴实后金色褪去露出新画面。q<0.5 贴金箔（从 1.3 倍、带旋转落位），0.5..1 金箔变透明露出 B。
  goldLeaf(c, A, B, p, o) {
    const ts = 72, cx = o.cx || sx(1300), cy = o.cy || sy(380);
    const tiles = once('goldLeaf', () => { const r = rng(21), out = [], maxd = Math.hypot(W, H) * 0.8;
      for (let y = 0; y < H; y += ts) for (let x = 0; x < W; x += ts) { const mx = x + ts / 2, my = y + ts / 2; const d = Math.hypot(mx - cx, my - cy) / maxd, a = (Math.atan2(my - cy, mx - cx) / (Math.PI * 2) + 1) % 1;
        out.push({ x, y, key: d * 0.78 + a * 0.12 + r() * 0.08, rot: (r() - .5) * 0.8, m: (r() * 3) | 0 }); }
      return out; });
    c.drawImage(A, 0, 0);
    for (const t of tiles) {
      const q = clamp((p * 1.32 - t.key) / 0.32); if (q <= 0) continue;
      if (q >= 1) { c.drawImage(B, t.x, t.y, ts, ts, t.x, t.y, ts, ts); continue; }
      const mx = t.x + ts / 2, my = t.y + ts / 2;
      if (q > 0.5) c.drawImage(B, t.x, t.y, ts, ts, t.x, t.y, ts, ts);
      const u = q < 0.5 ? q / 0.5 : 1, fadeOut = q < 0.5 ? 1 : 1 - (q - 0.5) / 0.5;
      c.save(); c.translate(mx, my); c.rotate(t.rot * (1 - ease.out(u))); const s = 1.3 - 0.3 * ease.out(u); c.scale(s, s);
      c.globalAlpha = Math.min(1, u * 2.5) * fadeOut;
      const g = c.createLinearGradient(-ts / 2, -ts / 2, ts / 2, ts / 2); const sh = clamp(u);
      g.addColorStop(0, '#a8741e'); g.addColorStop(clamp(0.2 + sh * 0.5), '#fbe6a0'); g.addColorStop(1, '#c8962e');
      c.fillStyle = g; c.fillRect(-ts / 2, -ts / 2, ts, ts);
      c.strokeStyle = 'rgba(70,40,10,.75)'; c.lineWidth = 2.2; c.beginPath();
      if (t.m === 0) { for (let a = 0; a < Math.PI * 5; a += 0.25) { const rr = 26 * a / (Math.PI * 5); a ? c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : c.moveTo(0, 0); } }
      else if (t.m === 1) { c.moveTo(-24, 0); c.quadraticCurveTo(0, -20, 24, 0); c.quadraticCurveTo(0, 20, -24, 0); c.moveTo(7, 0); c.arc(0, 0, 7, 0, Math.PI * 2); }
      else { [8, 16, 24].forEach(rr => { c.moveTo(rr, 0); c.arc(0, 0, rr, 0, Math.PI * 2); }); }
      c.stroke(); c.restore();
    }
  },
  // 克里姆特 → 蒙克：《呐喊》的血色天空从上往下「流」过画面。旧画按行正弦扭曲、幅度越来越大；
  // 波浪形前沿以上是新画面（扭曲幅度由大变小），前沿上压 4 道黄橙红色带。
  screamWarp(c, A, B, p, o) {
    const e = ease.inOut(p), ph = o.lt * 9;
    const yF = x => lerp(-180, H + 220, e) + 80 * Math.sin(x * 0.0055 + p * 7);
    c.fillStyle = '#3a1410'; c.fillRect(0, 0, W, H);
    KIT.warpRows(c, A, y => 70 * e * Math.sin(y * 0.014 + ph) + 20 * e * Math.sin(y * 0.05 - ph), 6, 92 * e);
    const tg = o.tmp.getContext('2d'); tg.reset(); tg.fillStyle = '#3a1410'; tg.fillRect(0, 0, W, H);
    KIT.warpRows(tg, B, y => 60 * (1 - e) * Math.sin(y * 0.013 - ph), 6, 62 * (1 - e));
    c.save(); c.beginPath(); c.moveTo(0, -10); for (let x = 0; x <= W; x += 24) c.lineTo(x, yF(x)); c.lineTo(W, -10); c.closePath(); c.clip(); c.drawImage(o.tmp, 0, 0); c.restore();
    c.save(); c.lineCap = 'round';
    ['#b82a1e', '#e2541c', '#f08a24', '#f4c03a'].forEach((col, k) => { c.strokeStyle = col; c.lineWidth = 26; c.beginPath(); for (let x = -20; x <= W + 20; x += 16) { const y = yF(x) - k * 22 + 10 * Math.sin(x * 0.02 + ph + k); x > -20 ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); });
    c.restore();
  },
  // 蒙克 → 敦煌：飞天的飘带从右往左扫过，带后是壁画；前沿处旧画剥落成碎片掉下去。
  apsara(c, A, B, p, o) {
    const e = ease.inOut(p);
    const xF = y => lerp(W + 260, -300, e) + 110 * Math.sin(y * 0.006 + p * 5);
    c.drawImage(A, 0, 0);
    c.save(); c.beginPath(); c.moveTo(W + 10, -10); for (let y = -10; y <= H + 10; y += 20) c.lineTo(xF(y), y); c.lineTo(W + 10, H + 10); c.closePath(); c.clip(); c.drawImage(B, 0, 0); c.restore();
    // 剥落：前沿左侧旧画碎片（取 A 的像素）旋转落下
    const fl = once('apsaraFlakes', () => { const r = rng(33), o2 = []; for (let i = 0; i < 70; i++) o2.push([r() * H, 20 + r() * 34, 10 + r() * 26, r() * 6.28, r()]); return o2; });
    fl.forEach(([y0, s, dx, rot, k]) => { const born = clamp(1 - (xF(y0) + 40) / (W + 300)); const age = e - born * 0.9; if (age < 0) return;
      const x = xF(y0) - dx + age * 120, y = y0 + age * age * 900; if (y > H + 40) return;
      c.save(); c.translate(x, y); c.rotate(rot + age * 9); c.scale(1, Math.cos(age * 12 + k * 6)); c.drawImage(A, clamp(x, 0, W - s), clamp(y0, 0, H - s), s, s * 0.7, -s / 2, -s * 0.35, s, s * 0.7); c.restore(); });
    // 三条飘带沿前沿翻卷（石绿、土红、石青），带白色描花
    [['#6ab08e', 0, 44], ['#a5452f', 70, 38], ['#5a86b0', 140, 32]].forEach(([col, off, w], k) => {
      const pts = []; for (let y = -60; y <= H + 60; y += 18) pts.push([xF(y) + off + 46 * Math.sin(y * 0.011 - p * 14 + k * 1.7), y]);
      const path = KIT.ribbon(pts, q => w * (0.6 + 0.4 * Math.sin(q * 14 + p * 10 + k)));
      c.fillStyle = col; c.fill(path); c.strokeStyle = '#5a2414'; c.lineWidth = 2.4; c.stroke(path);
      c.strokeStyle = '#ecdfc4'; c.lineWidth = 2; c.setLineDash([4, 10]); c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke(); c.setLineDash([]);
    });
  },
  // 敦煌 → 草间：波点从猫的位置一圈圈长出来，点里是新画面；点胀到彼此相接就整幅换完。
  dotBloom(c, A, B, p, o) {
    const sp = 58, cx = o.cx || sx(540), cy = o.cy || sy(760), maxd = Math.hypot(W, H);
    c.drawImage(A, 0, 0);
    const pts = once('dotBloom', () => { const r = rng(44), out = []; for (let y = 0, j = 0; y < H + sp; y += sp * 0.87, j++) for (let x = (j % 2) * sp / 2; x < W + sp; x += sp) out.push([x + (r() - .5) * 8, y + (r() - .5) * 8, Math.hypot(x - cx, y - cy) / maxd, r()]); return out; });
    const path = new Path2D(), rims = [];
    for (const [x, y, d, k] of pts) { const q = clamp((p * 1.55 - d * 1.1 - k * 0.08) / 0.42); if (q <= 0) continue; const r = ease.outBack(q) * sp * 0.74; path.moveTo(x + r, y); path.arc(x, y, r, 0, Math.PI * 2); if (q < 1) rims.push([x, y, r, q]); }
    c.save(); c.clip(path); c.drawImage(B, 0, 0); c.restore();
    c.lineWidth = 5; rims.forEach(([x, y, r, q]) => { c.strokeStyle = `rgba(251,246,238,${1 - q})`; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke(); });
  },
  // ---- C：Kirby / 莫奈 / 修拉 / 马蒂斯 / 哈林 ----
  // ① Kirby → 莫奈：旧画面「落进水里」——逐行横向正弦错位（水面倒影的抖动）越来越强；
  //    新画面从杯子位置以「横向短笔触」一圈圈荡开（涟漪由笔触组成），亮色水光短横线闪烁。
  ripple(c, A, B, p, o) {
    const cx = o.cx || sx(1000), cy = o.cy || sy(600), e = ease.inOut(p);
    const amp = 46 * Math.sin(Math.PI * Math.min(1, p * 1.2)), rowH = 6;
    for (let y = 0; y < H; y += rowH) { const d = Math.abs(y - cy) / H, dx = Math.sin(y * 0.045 - p * 26) * amp * (0.4 + d); c.drawImage(A, 0, y, W, rowH, dx, y, W, rowH); }
    const S = once('rip', () => { const r = rng(41), out = []; for (let i = 0; i < 3600; i++) { const x = r() * W, y = r() * H; out.push({ x, y, l: 40 + r() * 70, h: 9 + r() * 8, d: Math.hypot(x - cx, (y - cy) * 1.9) / 1700 + r() * 0.06 }); } return out; });
    const front = e * 1.15 - 0.05;
    c.save(); c.beginPath(); let any = false;
    for (const s of S) { if (s.d > front) continue; any = true; const k = clamp((front - s.d) / 0.06); c.ellipse(s.x, s.y, s.l * k / 2 + 1, s.h / 2, 0, 0, TAU); }
    if (any) { c.clip(); c.drawImage(B, 0, 0); }
    c.restore();
    // 涟漪前沿：几圈浅色虚线椭圆＋水光短横线
    c.save(); c.lineCap = 'round';
    for (let k = 0; k < 3; k++) { const R = front * 2300 - k * 70; if (R <= 0) continue; c.strokeStyle = `rgba(240,246,255,${0.7 - k * 0.2})`; c.lineWidth = 10 - k * 2; c.setLineDash([46, 22]); c.lineDashOffset = -p * 300; c.beginPath(); c.ellipse(cx, cy, R, R / 1.9, 0, 0, TAU); c.stroke(); }
    c.setLineDash([]);
    const r = rng(7 + Math.floor(p * 30)), al = Math.sin(Math.PI * p);
    for (let i = 0; i < 140; i++) { const x = r() * W, y = r() * H; c.strokeStyle = ['#fffbe8', '#f8e0ec', '#e8f4ff'][i % 3]; c.globalAlpha = al * 0.8; c.lineWidth = 5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 18 + r() * 30, y); c.stroke(); }
    c.restore();
    if (p > 0.7) { c.globalAlpha = seg(p, 0.7, 0.95); c.drawImage(B, 0, 0); c.globalAlpha = 1; }
  },

  // ② 莫奈 → 修拉：画面「结晶」成一样大的圆点——先旧画面长出点（点长大、底下淡成纸色），
  //    点按对角线波次逐个换成新画面的颜色，最后新画面在点下面显影、点收回去。
  pointill(c, A, B, p, o) {
    const pitch = 14, rowh = pitch * 0.866;
    const sa = once('ptA', () => mkc(W, H)), sb = once('ptB', () => mkc(W, H));
    const ga = sa.getContext('2d', { willReadFrequently: true }), gb = sb.getContext('2d', { willReadFrequently: true });
    ga.drawImage(A, 0, 0); gb.drawImage(B, 0, 0);
    const da = ga.getImageData(0, 0, W, H).data, db = gb.getImageData(0, 0, W, H).data;
    // 底：旧画面 → 纸色 → 新画面
    c.drawImage(A, 0, 0);
    c.fillStyle = `rgba(246,238,220,${seg(p, 0.05, 0.4)})`; c.fillRect(0, 0, W, H);
    if (p > 0.6) { c.globalAlpha = seg(p, 0.6, 0.95); c.drawImage(B, 0, 0); c.globalAlpha = 1; }
    const grow = ease.out(seg(p, 0, 0.3)), shrink = 1 - ease.in(seg(p, 0.7, 1)), R = pitch * 0.46 * grow * shrink;
    if (R < 0.4) return;
    for (let j = 0, y = pitch / 2; y < H + pitch; j++, y += rowh) for (let x = (j % 2) * pitch / 2; x < W + pitch; x += pitch) {
      const sw = clamp(((x / W) * 0.6 + (y / H) * 0.4) * 0.5 + U.hash(x | 0, y | 0) * 0.25 + 0.15);   // 换色时刻：左上先、带随机
      const useB = p > sw;
      const i = (clamp(y | 0, 0, H - 1) * W + clamp(x | 0, 0, W - 1)) * 4, d = useB ? db : da;
      // 换色瞬间点会「跳」一下（变大）
      const pop = Math.abs(p - sw) < 0.04 ? 1.35 : 1;
      c.fillStyle = `rgb(${d[i]},${d[i + 1]},${d[i + 2]})`; c.beginPath(); c.arc(x, y, R * pop, 0, TAU); c.fill();
    }
  },

  // ③ 修拉 → 马蒂斯：一大张刷过水粉的钴蓝纸（剪刀边）从右往左扫过，纸上钉着白海藻、黄星、粉纸片（带投影）；
  //    纸经过的地方，后面换成了新画面。
  cutouts(c, A, B, p, o) {
    const e = ease.inOut(p), w = 1100;                       // 纸宽
    const x0 = lerp(W + 40, -w - 360, e);                   // 纸左缘
    const edge = (y, side) => { const r = Math.sin(y * 0.021 + side * 3) * 26 + Math.sin(y * 0.067 + side) * 12; return r; };
    // 新画面在纸的右缘之后
    c.drawImage(A, 0, 0);
    c.save(); c.beginPath(); c.moveTo(W + 10, 0); for (let y = 0; y <= H; y += 18) c.lineTo(x0 + w + edge(y, 1), y); c.lineTo(W + 10, H); c.closePath(); c.clip(); c.drawImage(B, 0, 0); c.restore();
    // 纸（带投影）
    const sheet = new Path2D(); for (let y = 0; y <= H; y += 18) sheet.lineTo(x0 + edge(y, 0), y); for (let y = H; y >= 0; y -= 18) sheet.lineTo(x0 + w + edge(y, 1), y); sheet.closePath();
    c.save(); c.shadowColor = 'rgba(10,20,40,.45)'; c.shadowOffsetX = 14; c.shadowOffsetY = 10; c.shadowBlur = 12; c.fillStyle = '#1d4fb8'; c.fill(sheet); c.restore();
    c.save(); c.clip(sheet);
    const r0 = rng(83); c.lineCap = 'round';
    for (let i = 0; i < 260; i++) { const x = x0 + r0() * w, y = r0() * H; c.strokeStyle = r0() < 0.5 ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)'; c.lineWidth = 8 + r0() * 14; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 160, y - 40); c.stroke(); }
    // 纸上的剪纸：海藻（茎＋手指）、星、圆片；随纸移动并各自晃
    const pin = (fn, col, x, y, rot) => { c.save(); c.translate(x, y); c.rotate(rot); c.shadowColor = 'rgba(10,20,40,.35)'; c.shadowOffsetX = 6; c.shadowOffsetY = 7; c.shadowBlur = 4; c.fillStyle = col; c.fill(fn); c.restore(); };
    const algae = once('ctAlg', () => { const p2 = new Path2D(); p2.addPath(RIG.limb([0, 0], [0, -420], 50, 26));
      for (let k = 0; k < 7; k++) { const u = 0.12 + k * 0.12, s = k % 2 ? 1 : -1, A0 = [0, -u * 420], th = s * (1.0 - 0.5 * u), L = 190 * (1 - 0.45 * u), d = [Math.sin(th), -Math.cos(th)];
        p2.addPath(RIG.limb(A0, [A0[0] + d[0] * L, A0[1] + d[1] * L], 64 * (1 - 0.3 * u), 56 * (1 - 0.3 * u))); } return p2; });
    const star = once('ctStar', () => KIT.star(0, 0, 120, 52, 6));
    pin(algae, '#f7f3e8', x0 + 260, 900, Math.sin(p * 9) * 0.1);
    pin(algae, '#f7d21e', x0 + 760, 1060, -0.2 + Math.sin(p * 11) * 0.1);
    pin(star, '#f7d21e', x0 + 540, 260, p * 3);
    pin(star, '#ef6f9a', x0 + 900, 520, -p * 2.5);
    const blob = once('ctBlob', () => { const q = new Path2D(); q.ellipse(0, 0, 130, 90, 0, 0, TAU); return q; }); pin(blob, '#e2322a', x0 + 180, 300, 0.3);
    c.restore();
  },

  // ④ 马蒂斯 → 哈林：一个粗黑轮廓的跳舞小人（双臂 V 字）从杯子处放大，身体里面是新画面，
  //    周围一圈哈林式放射动作线；小人越长越大直到身体铺满整个画面。
  radiant(c, A, B, p, o) {
    const cx = o.cx || sx(1000), cy = o.cy || sy(600), s = 0.15 * Math.pow(320, ease.inOut(p));
    const pose = { head: [0, -224], neck: [0, -182], hip: [0, -100], hl: [-84, -256], hr: [84, -256], kl: [-40, -54], kr: [40, -54], fl: [-60, -14], fr: [60, -14] };
    const T = q => [cx + q[0] * s, cy + (q[1] + 130) * s];
    const parts = [RIG.limb(T(pose.neck), T(pose.hip), 70 * s, 60 * s), RIG.limb(T(pose.neck), T(pose.hl), 36 * s, 32 * s), RIG.limb(T(pose.neck), T(pose.hr), 36 * s, 32 * s),
      RIG.limb(T(pose.hip), T(pose.kl), 38 * s, 34 * s), RIG.limb(T(pose.kl), T(pose.fl), 34 * s, 32 * s), RIG.limb(T(pose.hip), T(pose.kr), 38 * s, 34 * s), RIG.limb(T(pose.kr), T(pose.fr), 34 * s, 32 * s)];
    const hd = new Path2D(), hc = T(pose.head); hd.arc(hc[0], hc[1], 42 * s, 0, TAU); parts.push(hd);
    c.drawImage(A, 0, 0);
    // 黑色外轮廓（描粗＋填黑）
    c.save(); c.lineJoin = 'round'; c.strokeStyle = '#111'; c.lineWidth = 30; c.fillStyle = '#111'; parts.forEach(q => { c.stroke(q); c.fill(q); }); c.restore();
    // 身体里是新画面：离屏做遮罩
    const m = once('rdM', () => mkc()), mg = m.getContext('2d'); mg.globalCompositeOperation = 'source-over'; mg.clearRect(0, 0, W, H);
    mg.fillStyle = '#fff'; parts.forEach(q => mg.fill(q)); mg.globalCompositeOperation = 'source-in'; mg.drawImage(B, 0, 0);
    c.drawImage(m, 0, 0);
    // 放射动作线（8fps 跳）
    const st = Math.floor(o.t * 8), r = rng(300 + st); c.save(); c.strokeStyle = '#111'; c.lineCap = 'round'; c.lineWidth = 14;
    const R0 = 300 * s + 30;
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + r() * 0.2, L = 50 + r() * 60; c.beginPath(); c.moveTo(cx + Math.cos(a) * R0, cy + Math.sin(a) * R0 * 0.9); c.lineTo(cx + Math.cos(a) * (R0 + L), cy + Math.sin(a) * (R0 + L) * 0.9); c.stroke(); }
    c.restore();
    if (p > 0.82) { c.globalAlpha = seg(p, 0.82, 1); c.drawImage(B, 0, 0); c.globalAlpha = 1; }
  },
  // ---- D：伦勃朗 / 橡皮管 / 皮影 / 新海诚 / 蓝色时期 ----
  // 伦勃朗 → 橡皮管卡通：旧画先褪成棕褐老胶片（闪烁＋划痕），黑色光圈收到少女杯口，再从同一点「弹」开（outBack 过冲）
  irisFilm(c, A, B, p, o) {
    const cx = o.cx || W / 2, cy = o.cy || H / 2, R0 = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) + 20;
    const close = p < 0.5, q = close ? seg(p, 0, 0.5) : seg(p, 0.5, 1);
    if (close) { c.save(); c.filter = `sepia(${q}) grayscale(${q * 0.7}) contrast(${1 + q * 0.3})`; c.drawImage(A, 0, 0); c.restore(); }
    else c.drawImage(B, 0, 0);
    const R = close ? R0 * (1 - ease.in(q)) : R0 * ease.outBack(q);
    c.save(); c.fillStyle = '#0b0906'; c.beginPath(); c.rect(0, 0, W, H);
    // 光圈边缘微微手抖（12fps 换形）
    const wr = rng(Math.floor(o.t * 12) + 9); c.moveTo(cx + Math.max(0, R), cy);
    for (let i = 1; i <= 48; i++) { const a = i / 48 * Math.PI * 2, rr = Math.max(0, R * (1 + (wr() - 0.5) * 0.015)); c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
    c.fill('evenodd'); c.restore();
    filmDirt(c, o.t, close ? q : 1 - q * 0.5);
  },
  // 橡皮管 → 皮影：旧片像灯灭一样压成暗褐剪影；幕后的油灯从中心点亮，暖光圈（边缘带灯焰抖动）向外推开，新画面在光里出现
  lampGlow(c, A, B, p, o) {
    const cx = o.cx || W / 2, cy = o.cy || sy(470);
    c.drawImage(A, 0, 0);
    c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgba(70,34,12,${Math.min(1, p * 2.2)})`; c.fillRect(0, 0, W, H); c.restore();
    const fl = Math.sin(o.t * 37) * 0.04 + Math.sin(o.t * 23) * 0.03;
    const R = 1500 * ease.inOut(seg(p, 0.12, 1)) * (1 + fl);
    if (R > 1) {
      const T = o.tmp, g = T.getContext('2d'); g.reset(); g.drawImage(B, 0, 0);
      g.globalCompositeOperation = 'destination-in'; const m = g.createRadialGradient(cx, cy, R * 0.55, cx, cy, R); m.addColorStop(0, '#000'); m.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = m; g.fillRect(0, 0, W, H);
      c.drawImage(T, 0, 0);
    }
    c.save(); c.globalCompositeOperation = 'lighter'; const gl = Math.sin(Math.PI * seg(p, 0.05, 1)), rg = c.createRadialGradient(cx, cy, 0, cx, cy, 300 + R * 0.4);
    rg.addColorStop(0, `rgba(255,200,110,${0.7 * gl})`); rg.addColorStop(1, 'rgba(255,170,60,0)'); c.fillStyle = rg; c.fillRect(0, 0, W, H);
    // 灯焰本身：一朵小火苗在光心跳
    c.fillStyle = `rgba(255,240,190,${gl})`; c.beginPath(); c.ellipse(cx, cy, 14 * (1 + fl * 4), 34 * (1 + fl * 3), 0, 0, 7); c.fill(); c.restore();
  },
  // 皮影 → 新海诚：一道斜向的强光从左扫到右（漏光），光带身后是新画面；带横向拉丝、彩色光斑和飘起的光粒
  flareSweep(c, A, B, p, o) {
    const e = ease.inOut(p), X = lerp(-500, W + 700, e), k = 0.35;
    c.drawImage(A, 0, 0);
    c.save(); c.beginPath(); c.moveTo(-10, 0); c.lineTo(X, 0); c.lineTo(X - H * k, H); c.lineTo(-10, H); c.closePath(); c.clip(); c.drawImage(B, 0, 0); c.restore();
    c.save(); c.globalCompositeOperation = 'lighter';
    const band = (w, a, col) => { c.save(); c.translate(X - H * k / 2, H / 2); c.transform(1, 0, -k, 1, 0, 0); const g = c.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(0.5, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(-w, -H, 2 * w, 2 * H); c.restore(); };
    band(520, 0.55, '255,236,200'); band(160, 0.85, '255,255,250'); band(60, 0.6, '200,240,255');
    const hz = c.createLinearGradient(0, 0, W, 0); hz.addColorStop(0, 'rgba(150,210,255,0)'); hz.addColorStop(clamp(X / W), `rgba(220,240,255,${0.7 * Math.sin(Math.PI * p)})`); hz.addColorStop(1, 'rgba(150,210,255,0)'); c.fillStyle = hz; c.fillRect(Math.max(0, X - 700), 300, 1400, 5);
    const r = rng(77);
    for (let i = 0; i < 40; i++) { const x = X - H * k * r() + (r() - 0.5) * 500, y = r() * H - p * 120 * r(), rr = 3 + r() * 14, a = (1 - Math.abs(x - X) / 700) * 0.6; if (a <= 0) continue;
      const g = c.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, `rgba(255,252,235,${a})`); g.addColorStop(1, 'rgba(255,252,235,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, rr, 0, 7); c.fill(); }
    [[0.3, 40, '120,255,200'], [0.6, 24, '255,170,120'], [0.9, 60, '140,170,255']].forEach(([f, rr, col]) => { const x = lerp(X, W - X, f), y = lerp(300, 780, f); c.fillStyle = `rgba(${col},${0.18 * Math.sin(Math.PI * p)})`; c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; i ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.fill(); });
    c.restore();
  },
  // 新海诚 → 蓝色时期：先把旧画的颜色「抽走」只剩蓝（color 混合），再由 6 道宽大的干笔从左到右刷过，笔下就是新画；笔头带鬃毛拖痕
  blueBrush(c, A, B, p, o) {
    c.drawImage(A, 0, 0);
    c.save(); c.globalCompositeOperation = 'color'; c.fillStyle = `rgba(45,90,148,${Math.min(1, p * 2.2)})`; c.fillRect(0, 0, W, H); c.restore();
    c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgba(90,120,170,${Math.min(0.6, p * 1.5)})`; c.fillRect(0, 0, W, H); c.restore();
    const N = 6, bh = H / N + 90, r = rng(21);
    for (let k = 0; k < N; k++) {
      const s = ease.inOut(seg(p, 0.12 + k * 0.07, 0.62 + k * 0.07)), x1 = lerp(-120, W + 260, s); if (s <= 0) continue;
      const y0 = k * (H / N) - 20 + (k % 2 ? 10 : -10), tilt = (k % 2 ? 1 : -1) * 18;
      const path = new Path2D(); path.moveTo(-20, y0 + tilt); const n = 24;
      for (let i = 0; i <= n; i++) { const x = lerp(-20, x1, i / n); path.lineTo(x, y0 + tilt * (1 - i / n) + Math.sin(i * 1.7 + k) * 6); }
      path.quadraticCurveTo(x1 + 70, y0 + bh / 2, x1, y0 + bh);
      for (let i = n; i >= 0; i--) { const x = lerp(-20, x1, i / n); path.lineTo(x, y0 + bh + tilt * (1 - i / n) + Math.cos(i * 1.3 + k) * 7); }
      path.closePath();
      c.save(); c.clip(path); c.drawImage(B, 0, 0);
      // 鬃毛拖痕：笔头后 260px 内的深浅细线（颜料还没刷匀）
      for (let i = 0; i < 26; i++) { const y = y0 + 6 + r() * (bh - 12), L = 80 + r() * 200; const g = c.createLinearGradient(x1 - L, 0, x1, 0); g.addColorStop(0, 'rgba(15,30,60,0)'); g.addColorStop(1, `rgba(${r() < .5 ? '15,30,60' : '170,195,220'},.5)`);
        c.strokeStyle = g; c.lineWidth = 1 + r() * 3; c.beginPath(); c.moveTo(x1 - L, y); c.lineTo(x1 + 10, y + (r() - 0.5) * 4); c.stroke(); }
      c.restore();
    }
  },
};

// D 组转场共用：老胶片的闪烁、竖划痕、灰尘（24fps 换一次）
const filmDirt = (c, t, amt = 1) => {                       // 24fps 换一次：闪烁、竖划痕、灰尘
  const r = rng(Math.floor(t * 24) * 7919 + 3);
  c.fillStyle = `rgba(255,248,230,${(0.03 + r() * 0.1) * amt})`; c.fillRect(0, 0, W, H);
  for (let k = 0; k < 3; k++) { const x = r() * W; c.strokeStyle = `rgba(${r() < .5 ? '255,250,235' : '20,16,10'},${0.5 * amt})`; c.lineWidth = 1 + r() * 2; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + (r() - .5) * 10, H); c.stroke(); }
  for (let k = 0; k < 12; k++) { c.fillStyle = `rgba(20,16,10,${0.6 * amt})`; c.beginPath(); c.arc(r() * W, r() * H, 1 + r() * 3, 0, 7); c.fill(); }
};

// ---- B：构成主义 / 达利 / 霍珀 / 吉卜力 / 蒸汽波 ----
// ① 构成主义 → 达利：新画面像颜料一样从上往下「流」下来——下缘 edge(x) 是整体下落线 + 一排圆头液滴
//    （剖面 (1-(dx/w)²)^0.3：长条＋圆头，往下挂）；旧画面被压着逐列下垂（融化）；液面一道高光＋一道暗边。
T.melt = function (c, A, B, p) {
  const r = rng(41), drips = [];
  for (let i = 0; i < 26; i++) drips.push([r() * W, 10 + r() * 22, 60 + r() * 220, r() * 0.25]);
  const e = ease.inOut(p), fall = lerp(-160, H + 40, e);
  const edge = x => { let d = 0; for (const [dx, w, h, t0] of drips) { const u = (x - dx) / w; if (u > -1 && u < 1) d = Math.max(d, h * seg(p, t0, t0 + 0.5) * Math.pow(1 - u * u, 0.3)); } return fall + d + Math.sin(x * 0.005 + 1) * 24; };
  // 旧画面逐列下垂（越靠近液面压得越多）
  const sw = 4;
  for (let x = 0; x < W; x += sw) { const ed = edge(x), sag = Math.max(0, ed) * 0.22 * e; c.drawImage(A, x, 0, sw, H, x, sag, sw, H + sag * 0.3); }
  // 新画面：液面以上
  c.save(); c.beginPath(); c.moveTo(0, -10); for (let x = 0; x <= W; x += 4) c.lineTo(x, edge(x)); c.lineTo(W, -10); c.closePath(); c.clip(); c.drawImage(B, 0, 0); c.restore();
  // 液面：内侧暗边（厚度感）＋高光
  c.save(); c.beginPath(); for (let x = 0; x <= W; x += 4) { const y = edge(x); x ? c.lineTo(x, y) : c.moveTo(x, y); }
  c.strokeStyle = 'rgba(40,20,10,.35)'; c.lineWidth = 9; c.filter = 'blur(3px)'; c.stroke(); c.filter = 'none';
  c.translate(0, -5); c.strokeStyle = 'rgba(255,250,232,.7)'; c.lineWidth = 3; c.stroke(); c.restore();
};

// ② 达利 → 霍珀：一道硬边斜光块从左侧切进来——光块里是新画面（带暖光），光块外的旧画面逐渐沉进冷绿阴影；
//    光块里有一根窗棂竖影跟着走。最后暖光褪去，只剩新画面。
T.sunShaft = function (c, A, B, p) {
  const e = ease.out(p) * 0.4 + ease.inOut(p) * 0.6, slant = 260;
  const xR = lerp(-slant, W + slant + 60, e), xL = lerp(-slant - 20, -slant - 900, e) ;   // 右缘扫过全屏，左缘留在左外
  const band = () => { c.beginPath(); c.moveTo(xL, 0); c.lineTo(xR, 0); c.lineTo(xR - slant, H); c.lineTo(xL - slant, H); c.closePath(); };
  c.drawImage(A, 0, 0);
  c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgba(70,120,110,${0.7 * Math.min(1, p * 2)})`; c.fillRect(0, 0, W, H); c.restore();
  c.save(); band(); c.clip(); c.drawImage(B, 0, 0);
  const warm = 0.45 * (1 - seg(p, 0.6, 1));
  c.globalCompositeOperation = 'screen'; c.fillStyle = `rgba(255,214,140,${warm})`; c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgba(80,120,110,${0.8 * (1 - seg(p, 0.7, 1))})`;
  const mx = xR - 420; c.beginPath(); c.moveTo(mx, 0); c.lineTo(mx + 34, 0); c.lineTo(mx + 34 - slant, H); c.lineTo(mx - slant, H); c.closePath(); c.fill();
  c.restore();
  // 光块前缘一道亮边
  c.save(); c.strokeStyle = `rgba(255,236,190,${0.8 * (1 - seg(p, 0.8, 1))})`; c.lineWidth = 6; c.beginPath(); c.moveTo(xR, 0); c.lineTo(xR - slant, H); c.stroke(); c.restore();
};

// ③ 霍珀 → 吉卜力：水彩在湿纸上晕开。几团色晕从窗口先后绽开、边界是噪声扰动的圆，
//    边缘一圈颜料沉积的深色水痕＋外侧一圈被水冲淡的亮晕；色晕里是新画面。
//    水痕/亮晕的 α 跟着「这一团的扩张进度」淡出，否则长大后的水痕线会横穿新画面（第一版踩到）。
T.bleed = function (c, A, B, p, o) {
  const cx = o.cx || sx(580), cy = o.cy || sy(330);
  const blobs = [[cx, cy, 0, 1.0], [1300, 420, 0.14, 0.75], [520, 880, 0.24, 0.6], [1650, 860, 0.3, 0.6], [1050, 100, 0.34, 0.55]];
  const st = blobs.map(([x, y, t0, k]) => ({ x, y, q: ease.inOut(seg(p, t0, t0 + 0.66)), k }));
  const one = (i) => { const b = st[i], R = b.q * 1400 * b.k; if (R <= 0) return;
    for (let j = 0; j <= 90; j++) { const a = j / 90 * Math.PI * 2, n = PAINT.fbm(Math.cos(a) * 1.6 + i * 7, Math.sin(a) * 1.6 + p * 0.8, 3);
      const rr = R * (1 + 0.28 * n + 0.05 * Math.sin(a * 9 + i)); const X = b.x + Math.cos(a) * rr, Y = b.y + Math.sin(a) * rr; j ? c.lineTo(X, Y) : c.moveTo(X, Y); }
    c.closePath(); };
  c.drawImage(A, 0, 0);
  // 水痕只在刚绽开时有（q<0.55 内淡到 0）——审片抓到长大后的残圈横穿画面
  st.forEach((b, i) => { if (b.q <= 0 || b.q >= 1) return; c.save(); c.beginPath(); one(i); c.strokeStyle = `rgba(255,250,236,${0.6 * (1 - b.q)})`; c.lineWidth = 70; c.filter = 'blur(18px)'; c.stroke(); c.restore(); });
  c.save(); c.beginPath(); st.forEach((b, i) => one(i)); c.clip(); c.drawImage(B, 0, 0); c.restore();
  st.forEach((b, i) => { if (b.q <= 0 || b.q >= 0.55) return; c.save(); c.beginPath(); one(i); c.globalCompositeOperation = 'multiply'; c.strokeStyle = `rgba(150,110,70,${0.6 * Math.pow(1 - b.q / 0.55, 2)})`; c.lineWidth = 5; c.filter = 'blur(1.2px)'; c.stroke(); c.restore(); });
};

// ④ 吉卜力 → 蒸汽波：VHS 磁带故障。前半旧画面被横向撕裂＋RGB 分离，中段一下「场同步丢失」整幅上滚＋黑条，
//    后半新画面带着逐渐收敛的撕裂稳定下来。
T.vhs = function (c, A, B, p) {
  const f = Math.floor(p * 18), r = rng(900 + f), amp = Math.sin(Math.PI * p);
  const src = p < 0.5 ? A : B;
  const roll = p > 0.38 && p < 0.62 ? (seg(p, 0.38, 0.62) * H * 0.8) | 0 : 0;
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  if (roll) { c.drawImage(src, 0, roll); c.drawImage(src, 0, roll - H - 40); c.fillStyle = '#05010a'; c.fillRect(0, roll - 40, W, 40); }
  else c.drawImage(src, 0, 0);
  // 撕裂带（从 A 或 B 里取，横向错位）
  let y = 0; while (y < H) { const h = 6 + r() * 48, use = r() < p ? B : A;
    if (r() < 0.55 * amp + 0.08) { const dx = (r() - 0.5) * 260 * amp; c.drawImage(use, 0, y, W, h, dx, y, W, h); }
    y += h; }
  // RGB 分离：洋红/青两份半透明错位
  c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = 0.45 * amp;
  const T2 = PAINT.scratch('vhsT'), tg = T2.getContext('2d');
  [['#ff00ff', 14 * amp], ['#00ffff', -14 * amp]].forEach(([col, dx]) => { tg.globalCompositeOperation = 'source-over'; tg.clearRect(0, 0, W, H); tg.drawImage(src, 0, 0); tg.globalCompositeOperation = 'multiply'; tg.fillStyle = col; tg.fillRect(0, 0, W, H); c.drawImage(T2, dx, 0); });
  c.restore();
  // 雪花线
  c.save(); c.globalAlpha = 0.7 * amp; for (let i = 0; i < 160; i++) { c.fillStyle = r() < 0.5 ? '#fff' : '#9a9a9a'; c.fillRect(r() * W, r() * H, 30 + r() * 200, 2); } c.restore();
};


// ---- 样片补的 4 个：A–D 每组第一段在片头没有进入转场，这里按「进入段的签名语言」补上 ----
Object.assign(T, {
  // 进入水墨：旧画先被「洗」成宣纸（去色、提亮、减对比），几团墨点从落笔处先后洇开，边缘带一圈墨晕，新画在墨里出现
  inkBloom(c, A, B, p, o) {
    const cx = o.cx || sx(560), cy = o.cy || sy(740);
    c.save(); c.filter = `grayscale(${seg(p, 0, 0.5)}) brightness(${1 + 0.35 * seg(p, 0, 0.6)}) contrast(${1 - 0.3 * seg(p, 0, 0.6)})`; c.drawImage(A, 0, 0); c.restore();
    const blobs = once('inkBloom', () => { const r = rng(17), out = [[cx, cy, 0, 1.0]]; for (let i = 0; i < 6; i++) out.push([200 + r() * 1520, 120 + r() * 840, 0.08 + r() * 0.3, 0.45 + r() * 0.4]); return out; });
    const outline = (g, x, y, R) => { g.beginPath(); for (let j = 0; j <= 72; j++) { const a = j / 72 * TAU, n = PAINT.fbm(Math.cos(a) * 1.8 + x * 0.01, Math.sin(a) * 1.8 + y * 0.01, 3), rr = R * (1 + 0.35 * n); j ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); };
    const st = blobs.map(([x, y, t0, k]) => { const q = ease.out(seg(p, t0, t0 + 0.7)); return [x, y, q, q * 1500 * k]; });
    // 遮罩与墨边都在 1/4 分辨率上画再放大（边缘本来就是软的；全分辨率 blur 要 ~170ms）
    const sm = once('inkBloomSm', () => [mkc(W / 4, H / 4), mkc(W / 4, H / 4)]), [mk, rim] = sm, mg = mk.getContext('2d'), rg = rim.getContext('2d');
    mg.reset(); mg.scale(0.25, 0.25); mg.filter = 'blur(3px)'; mg.fillStyle = '#000';
    st.forEach(([x, y, q, R]) => { if (q > 0) { outline(mg, x, y, R); mg.fill(); } });
    rg.reset(); rg.scale(0.25, 0.25); rg.filter = 'blur(2.5px)'; rg.lineWidth = 34;                  // 墨晕边：刚洇开时浓，长大后淡出（否则残圈横穿新画面）
    st.forEach(([x, y, q, R]) => { if (q <= 0 || q >= 1) return; rg.strokeStyle = `rgba(30,26,22,${0.55 * Math.pow(1 - q, 1.5)})`; outline(rg, x, y, R); rg.stroke(); });
    c.save(); c.globalCompositeOperation = 'multiply'; c.drawImage(rim, 0, 0, W, H); c.restore();
    const T2 = o.tmp, g = T2.getContext('2d'); g.reset(); g.drawImage(B, 0, 0); g.globalCompositeOperation = 'destination-in'; g.drawImage(mk, 0, 0, W, H);
    c.drawImage(T2, 0, 0);
    if (p > 0.8) { c.globalAlpha = seg(p, 0.8, 1); c.drawImage(B, 0, 0); c.globalAlpha = 1; }
  },
  // 进入构成主义：李西茨基「红楔打白圈」——一枚红楔从左下斜刺过画面，楔尖后面是新画面；三根黑排版条跟着楔子冲进来
  redWedge(c, A, B, p, o) {
    const e = ease.inOut(p), ang = -0.32, ca = Math.cos(ang), sa = Math.sin(ang);
    const X = lerp(-700, W + 900, e);                                           // 楔尖沿斜轴的位置
    const mx = W / 2, my = H / 2, tf = (u, v) => [mx + (u - mx) * ca - (v - my) * sa, my + (u - mx) * sa + (v - my) * ca];
    c.drawImage(A, 0, 0);
    c.save(); c.beginPath(); [tf(-3000, -3000), tf(X - 420, -3000), tf(X - 420, 4000), tf(-3000, 4000)].forEach((q, i) => i ? c.lineTo(...q) : c.moveTo(...q)); c.closePath(); c.clip(); c.drawImage(B, 0, 0); c.restore();
    c.save(); c.fillStyle = '#c8231c'; c.beginPath(); [tf(X, my), tf(X - 520, my - 330), tf(X - 520, my + 330)].forEach((q, i) => i ? c.lineTo(...q) : c.moveTo(...q)); c.closePath(); c.fill();
    c.fillStyle = '#151311'; [[-150, 26, 0], [120, 18, 0.12], [260, 34, 0.2]].forEach(([dv, h, lag]) => { const x1 = lerp(-700, W + 900, ease.inOut(clamp(p - lag))) - 560;
      c.beginPath(); [tf(-2000, my + dv), tf(x1, my + dv), tf(x1, my + dv + h), tf(-2000, my + dv + h)].forEach((q, i) => i ? c.lineTo(...q) : c.moveTo(...q)); c.closePath(); c.fill(); });
    c.restore();
  },
  // 进入 Kirby 漫画：新画面按漫画分格一格格「砸」进来（从 1.18 倍落位、黑格线），没换到的旧画面先被盖上一层本戴网点
  comicPanels(c, A, B, p, o) {
    const cells = once('comicPanels', () => [[0, 0, 820, 520, 0], [820, 0, 1100, 520, 0.12], [0, 520, 640, 560, 0.24], [640, 520, 700, 560, 0.34], [1340, 520, 580, 560, 0.44]].map(([x, y, w, h, t0]) => [sx(x), sy(y), sx(w), sy(h), t0]));
    c.drawImage(A, 0, 0);
    c.save(); c.globalAlpha = Math.min(1, p * 2.5) * 0.85; c.fillStyle = PAINT.dotPattern(c, 'comicTr', 12, 3.4, '#e0287a', null, 75); c.fillRect(0, 0, W, H); c.restore();
    for (const [x, y, w, h, t0] of cells) {
      const q = seg(p, t0, t0 + 0.32); if (q <= 0) continue; const s = 1.18 - 0.18 * ease.outBack(q);
      c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
      c.translate(x + w / 2, y + h / 2); c.scale(s, s); c.translate(-x - w / 2, -y - h / 2); c.drawImage(B, 0, 0); c.restore();
      c.save(); c.strokeStyle = '#141212'; c.lineWidth = 14 * (1 - seg(p, 0.8, 1)); if (c.lineWidth > 0.5) c.strokeRect(x, y, w, h); c.restore();
    }
  },
  // 进入伦勃朗：旧画沉进暗褐（暗角从四周合拢），然后一道从窗口斜下来的光柱把新画面照出来，最后暗部也慢慢显影
  chiaroscuro(c, A, B, p, o) {
    const lx = o.cx || sx(580), ly = o.cy || sy(300);
    c.drawImage(A, 0, 0);
    c.save(); c.globalCompositeOperation = 'multiply'; const d = seg(p, 0, 0.45);
    const vg = c.createRadialGradient(W / 2, H / 2, lerp(1100, 80, d), W / 2, H / 2, lerp(1400, 700, d)); vg.addColorStop(0, 'rgba(255,255,255,1)'); vg.addColorStop(1, `rgba(28,18,10,${0.9 * d + 0.1})`);
    c.fillStyle = vg; c.fillRect(0, 0, W, H); c.fillStyle = `rgba(40,26,14,${0.85 * d})`; c.fillRect(0, 0, W, H); c.restore();
    const q = ease.inOut(seg(p, 0.25, 0.9)); if (q <= 0) return;
    const T2 = o.tmp, g = T2.getContext('2d'); g.reset(); g.drawImage(B, 0, 0); g.globalCompositeOperation = 'destination-in'; g.filter = 'blur(40px)'; g.fillStyle = '#000';
    const spread = lerp(60, 1400, q); g.beginPath(); g.moveTo(lx - 180, ly - 200); g.lineTo(lx + 180, ly - 200); g.lineTo(lx + 500 + spread, ly + 900); g.lineTo(lx - 200 - spread * 0.6, ly + 900); g.closePath(); g.fill();
    g.beginPath(); g.arc(lx + 420, ly + 260, lerp(40, 1500, q), 0, TAU); g.fill(); g.filter = 'none';
    c.drawImage(T2, 0, 0);
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 * Math.sin(Math.PI * q); c.fillStyle = 'rgba(255,214,150,1)'; c.beginPath(); c.moveTo(lx - 140, ly - 160); c.lineTo(lx + 140, ly - 160); c.lineTo(lx + 420 + spread * 0.5, ly + 900); c.lineTo(lx - 120 - spread * 0.3, ly + 900); c.closePath(); c.filter = 'blur(30px)'; c.fill(); c.restore();
    if (p > 0.8) { c.globalAlpha = seg(p, 0.8, 1); c.drawImage(B, 0, 0); c.globalAlpha = 1; }
  },
});

// ================= YouTube 解说语法的转场（references/09-视频动画语法.md） =================
// 解说片的转场原则和艺术速通相反：不抢戏、保持空间连续（观众知道「镜头去了哪」）——多数是相机运动和共享元素。
// 相机运动在场景里按时间算好（CAM），转场只负责「A、B 怎么合」。这些段一般写 punch: 0 或片级 window.PUNCH = 0（关掉拍点冲击）。
Object.assign(T, {
  // 【同一世界】same：A、B 本来是同一幅画（同一世界画布、相机连续运动），直接用 B。Vox 桌面快摇、白板平移都走它。
  same(c, A, B) { c.drawImage(B, 0, 0); },
  // 【Kurzgesagt】lensReveal 钻进镜头：A 里相机正指数推进某个圆（眼睛/镜头），B 只露在这个圆里，圆随推进长大到盖满屏，圆边一圈光环。
  //   o.lens(t) → {x, y, r} 屏幕上的圆（由上一镜的相机算，必须和 A 的推进同步）；o.ring 光环色。圆要盖满屏：推进倍数 ≥ CAM.coverZoom(r)。
  lensReveal(c, A, B, p, o) {
    const L = o.lens(o.t);
    c.drawImage(A, 0, 0);
    if (L.r < 1) return;
    c.save(); c.beginPath(); c.arc(L.x, L.y, L.r, 0, TAU); c.clip(); c.drawImage(B, 0, 0); c.restore();
    const ring = Math.max(3, L.r * 0.06), col = o.ring || [120, 240, 255], col2 = o.ring2 || [70, 230, 255];
    c.save(); c.strokeStyle = `rgba(${col},.85)`; c.lineWidth = ring; c.beginPath(); c.arc(L.x, L.y, L.r + ring / 2, 0, TAU); c.stroke();
    c.strokeStyle = `rgba(${col2},.25)`; c.lineWidth = ring * 3; c.beginPath(); c.arc(L.x, L.y, L.r + ring * 2, 0, TAU); c.stroke(); c.restore();
  },
  // 【Kurzgesagt】matchCut 填满再拉出：A 推进到某个色块满屏，B 从同色的东西里拉出；只在 o.at（默认中点）±o.width/2 内交叉溶解（±3 帧），两边颜色本来一样，剪点看不见。
  matchCut(c, A, B, p, o) {
    const w = o.width || 0.06, q = clamp((p - (o.at ?? 0.5) + w / 2) / w);
    if (q <= 0) { c.drawImage(A, 0, 0); return; }
    if (q >= 1) { c.drawImage(B, 0, 0); return; }
    c.drawImage(A, 0, 0); c.globalAlpha = q; c.drawImage(B, 0, 0); c.globalAlpha = 1;
  },
  // 【storytime】whip 甩镜：旧画面加速甩出、新画面减速甩入，中段整屏横向运动模糊（采样 ≤8px 一张，少了读成残影）。o.dir=1 往左甩
  whip(c, A, B, p, o) {
    const e = MO.expoInOut(p), dir = o.dir || 1, off = e * W * dir;
    const v = Math.max(0, 1 - Math.abs(p - 0.5) * 2.2);
    const n = 1 + Math.round(v * 40), spread = v * 320;
    for (let k = 0; k < n; k++) {
      const d = n === 1 ? 0 : (k / (n - 1) - 0.5) * spread * dir;
      c.globalAlpha = 1 / (k + 1) > 0.999 ? 1 : 1 / (k + 1);
      c.drawImage(A, -off + d, 0); c.drawImage(B, W * dir - off + d, 0);
    }
    c.globalAlpha = 1;
  },
  // 【storytime】smash 砸镜：第一帧就是新画面，带 1.22 倍放大从猛到停（弹簧，夹在 ≥1 防黑边），首两帧白闪。反应特写用
  smash(c, A, B, p, o) {
    const lt = p * o.dur, s = Math.max(1, 1 + 0.22 * (1 - MO.springHz(lt, o.freq || 3, o.decay || 11)));
    c.save(); c.translate(W / 2, H / 2); c.scale(s, s); c.translate(-W / 2, -H / 2); c.drawImage(B, 0, 0); c.restore();
    if (lt < 2 / 60) { c.fillStyle = 'rgba(255,255,255,0.55)'; c.fillRect(0, 0, W, H); }
  },
  // 【动态文字】fillZoom 冲进色块：镜头冲进旧画面里某个形（o.cx,o.cy；形的颜色 o.fill = 新画面底色），冲满屏后新画面从 1.25 落回 1。
  //   揭开点 = o.k（默认 .55）：卡拍时段起点 = 小节线 − k×dur（MO.onBeat）。o.maxZoom 冲进倍数（指数缩放本身就是加速，别再套 expoIn）
  fillZoom(c, A, B, p, o) {
    const k = o.k || 0.55;
    if (p < k) { const q = Math.pow(p / k, 2.2), s = Math.pow(o.maxZoom || 40, q);
      c.save(); c.translate(o.cx, o.cy); c.scale(s, s); c.translate(-o.cx, -o.cy); c.drawImage(A, 0, 0); c.restore(); }
    else { const q = MO.expoOut((p - k) / (1 - k)), s = lerp(1.25, 1, q);
      c.fillStyle = o.fill || '#000'; c.fillRect(0, 0, W, H);
      c.save(); c.globalAlpha = clamp(q * 3); c.translate(W / 2, H / 2); c.scale(s, s); c.translate(-W / 2, -H / 2); c.drawImage(B, 0, 0); c.restore(); }
  },
  // 【动态文字】bands 色带擦除：o.colors 几条斜切色带接力扫过（间隔 o.gap），最后一条后面是新画面。揭开点 ≈ .6
  bands(c, A, B, p, o) {
    const cols = o.colors || ['#FFD23F', '#FF5A36', '#14213D'], n = cols.length, sk = H * 0.35, gap = o.gap || 0.13;
    const edge = q => lerp(-sk - 40, W + sk + 40, MO.expoInOut(clamp(q)));
    c.drawImage(A, 0, 0);
    const clipTo = x => { c.beginPath(); c.moveTo(-sk - 60, 0); c.lineTo(x + sk, 0); c.lineTo(x, H); c.lineTo(-sk - 60, H); c.closePath(); };
    for (let i = 0; i < n; i++) { const x = edge((p - i * gap) / (1 - (n - 1) * gap)); c.save(); clipTo(x); c.clip(); c.fillStyle = cols[i]; c.fillRect(0, 0, W, H); c.restore(); }
    const xb = edge((p - n * gap) / (1 - (n - 1) * gap));
    c.save(); clipTo(xb); c.clip(); c.drawImage(B, 0, 0); c.restore();
  },
  // 【动态文字】push 推页：新旧一起平移（expoInOut），像镜头在长画布上滑到下一块。o.dir: 'left'（默认）| 'up'。到 90% 位移在 p≈.58
  push(c, A, B, p, o) {
    const e = MO.expoInOut(p);
    if (o.dir === 'up') { c.drawImage(A, 0, -e * H); c.drawImage(B, 0, H - e * H); }
    else { c.drawImage(A, -e * W, 0); c.drawImage(B, W - e * W, 0); }
  },
  // 【3b1b / 财经】zoomThrough 镜头穿越：相机推向 (cx,cy)，新画面从该物体「里面」长出来。
  //   o: {cx, cy, zoom, r0=物体半径（圆形开口；0=不裁）, live, bg, focus:[x,y] 新画面主体位置, bScale0, ease}
  //   live:true = 旧镜头自己在转场里继续推相机（矢量重画，线条不糊；推荐）；否则把 A 当位图放大（10× 以上会糊）。
  //   有 r0 时 zoom 要 ≥ CAM.coverZoom(r0, cx, cy)（≈1100/r0），否则开口到结束都盖不满屏，最后一帧会跳。
  zoomThrough(c, A, B, p, o) {
    const cx = o.cx, cy = o.cy, Z = o.zoom || 7, e = (o.ease || MO.smooth)(p);
    const sA = Math.pow(Z, e);
    c.fillStyle = o.bg || '#000'; c.fillRect(0, 0, W, H);
    c.save(); if (!o.live) { c.translate(cx, cy); c.scale(sA, sA); c.translate(-cx, -cy); }
    c.globalAlpha = 1 - (o.bScale0 ? seg(p, 0.5, 0.8) : o.r0 ? seg(p, 0.45, 0.8) : seg(p, 0.6, 0.95));   // 开口外的旧画面早点退，新镜头标题出来时不挂残影
    c.drawImage(A, 0, 0); c.restore();
    c.save();
    if (o.r0) {
      const R = o.r0 * sA; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.clip();
      c.fillStyle = o.bg || '#000'; c.globalAlpha = seg(p, 0.18, 0.45); c.fillRect(0, 0, W, H);   // 穿过物体表面：亮面渐暗成内部
    }
    // 新画面从「1/Z 大小、主体 focus 对准 (cx,cy)」走到原位全屏；没有圆形开口时用 bScale0（如 0.6）从较大尺寸起、晚一点溶进来，免得像浮着的小卡片
    const [fx, fy] = o.focus || [W / 2, H / 2], sB = o.bScale0 ? Math.pow(o.bScale0, 1 - e) : Math.pow(Z, e - 1);
    c.globalAlpha = o.r0 ? seg(p, 0.22, 0.55) : o.bScale0 ? seg(p, 0.45, 0.85) : seg(p, 0.25, 0.7);
    const m = MO.smooth(seg(e, 0.55, 1));                // 开口没盖满屏前，主体一直待在开口正中；最后才归位
    c.translate(lerp(cx, fx, m), lerp(cy, fy, m)); c.scale(sB, sB); c.translate(-fx, -fy); c.drawImage(B, 0, 0);
    c.restore();
  },
  // 【发布会】blurPush 模糊推进：旧画面后退（0.92）＋模糊＋变暗，新画面从 1.06 带模糊落到 1.0 清晰；底下垫一张放大重模糊的旧画面防黑边
  blurPush(c, A, B, p) {
    const e = MO.appleOut(p);
    c.save(); c.filter = 'blur(30px)'; c.translate(W / 2, H / 2); c.scale(1.08, 1.08); c.translate(-W / 2, -H / 2); c.drawImage(A, 0, 0); c.restore();
    const draw = (img, s, blur, a) => { if (a <= 0) return; c.save(); c.globalAlpha = a; if (blur > 0.3) c.filter = `blur(${blur.toFixed(1)}px)`;
      c.translate(W / 2, H / 2); c.scale(s, s); c.translate(-W / 2, -H / 2); c.drawImage(img, 0, 0); c.restore(); };
    draw(A, lerp(1, 0.92, e), 24 * e, 1 - seg(p, 0.2, 0.75));
    draw(B, lerp(1.06, 1, e), 24 * (1 - e), seg(p, 0.15, 0.7));
  },
  // 【发布会】expandRect 卡片展开成全屏（共享元素）：o.rect={x,y,w,h} 是卡片在上一镜末帧的屏幕矩形、o.r 圆角；弹簧展开，里面装新画面，旧画面后退变暗。
  //   新画面第一帧就不透明地装进卡片（卡内硬切被展开运动盖住）：卡片半透明时任何溶接都会看到新旧两层字叠在一起。
  expandRect(c, A, B, p, o) {
    const e = MO.spring(p * (o.dur || 0.6), { duration: 0.55, bounce: 0 });
    const R = o.rect, x = lerp(R.x, 0, e), y = lerp(R.y, 0, e), w = lerp(R.w, W, e), h = lerp(R.h, H, e), r = lerp(o.r || 28, 0, e);
    c.save(); c.filter = 'blur(30px)'; c.translate(W / 2, H / 2); c.scale(1.08, 1.08); c.translate(-W / 2, -H / 2); c.drawImage(A, 0, 0); c.restore();
    c.save(); c.globalAlpha = 1 - 0.6 * e;
    const s = lerp(1, 0.94, e); c.translate(W / 2, H / 2); c.scale(s, s); c.translate(-W / 2, -H / 2); c.drawImage(A, 0, 0); c.restore();
    c.save(); c.beginPath(); c.roundRect(x, y, w, h, r); c.clip();
    const k = Math.max(w / W, h / H); c.translate(x + w / 2, y + h / 2); c.scale(k, k); c.translate(-W / 2, -H / 2);
    c.drawImage(B, 0, 0); c.restore();
  },
  // 【财经】slidePush 面板横推：新面板从右推入、旧面板向左推出（bezier .7,0,.2,1），一道品牌色竖条 o.bar 领路
  slidePush(c, A, B, p, o) {
    const e = MO.bezier(0.7, 0, 0.2, 1)(p), dx = -W * e;
    c.drawImage(A, dx, 0); c.drawImage(B, dx + W, 0);
    if (o.bar) { c.fillStyle = o.bar; c.fillRect(dx + W - 14, 0, 14, H); }
  },
  // 【3b1b】fadeShift 淡出上移 / 淡入上移（manim FadeOut(shift=UP) + FadeIn(shift=UP)），o.shift 位移像素
  fadeShift(c, A, B, p, o) {
    const d = o.shift || 60, a = MO.smooth(seg(p, 0, 0.6)), b = MO.smooth(seg(p, 0.4, 1));
    c.fillStyle = o.bg || '#000'; c.fillRect(0, 0, W, H);
    c.save(); c.globalAlpha = 1 - a; c.drawImage(A, 0, -d * a); c.restore();
    c.save(); c.globalAlpha = b; c.drawImage(B, 0, d * (1 - b)); c.restore();
  },
});

// 项目自己的转场（transitions/<名>.js）可以复用这几个工具
window.TR_UTIL = { once, seg, mkc };
})();
