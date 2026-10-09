// 角色骨架：17 岁欧洲金发少女（侧身朝左坐）＋ 橘白猫（朝右坐）。
// 每个部位输出 Path2D，时代代码自己决定填色/描边/剪影/渲染器——同一副骨架、同一套动作，只换画法。
// 坐标基于标准构图（分镜表 §2.5）：人 (1120,200)-(1500,910)，猫 (390,610)-(690,905)，桌 (810,620)-(1200,905)。
(() => {
const { clamp, lerp } = U;
const R = window.RIG = {};

// 二骨 IK：肩 S，目标 T，上臂 a，前臂 b，bendSign 决定肘向
R.ik2 = (S, T, a, b, bendSign = 1) => {
  let dx = T[0] - S[0], dy = T[1] - S[1], d = Math.hypot(dx, dy);
  d = Math.min(d, a + b - 0.01);
  const ang = Math.atan2(dy, dx), cosA = clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1);
  const e = ang + bendSign * Math.acos(cosA);
  const E = [S[0] + Math.cos(e) * a, S[1] + Math.sin(e) * a];
  const H = [S[0] + Math.cos(ang) * d, S[1] + Math.sin(ang) * d];
  return { E, H };
};
// 粗细变化的肢体：沿 A→B 画一个圆头胶囊。两端半圆帽朝外（逆时针从 n 走到 n-π）。
// 旧版 arc 方向反了，帽子凹进胶囊、路径自交，粗描边/平涂时关节处露洞（迁移测试 C：哈林小人被画成奶牛）。
R.limb = (A, B, wA, wB) => {
  const p = new Path2D(), a = Math.atan2(B[1] - A[1], B[0] - A[0]), n = a + Math.PI / 2;
  p.moveTo(A[0] + Math.cos(n) * wA / 2, A[1] + Math.sin(n) * wA / 2);
  p.lineTo(B[0] + Math.cos(n) * wB / 2, B[1] + Math.sin(n) * wB / 2);
  p.arc(B[0], B[1], wB / 2, n, n - Math.PI, true);
  p.lineTo(A[0] - Math.cos(n) * wA / 2, A[1] - Math.sin(n) * wA / 2);
  p.arc(A[0], A[1], wA / 2, n - Math.PI, n - 2 * Math.PI, true);
  p.closePath(); return p;
};
// 非等比拉长（毕加索蓝色时期、El Greco 式的瘦长人物）：以 anchor 为轴把整副骨架按 (sx, sy) 缩放。
// 所有 Path2D（含 .pts 点列）、锚点、杯子、眼睛、HP/T 坐标函数一起变换；线宽不变（不像 setTransform 那样把描边也压扁）。
R.stretch = (O, sx = 1, sy = 1, anchor = [0, 0]) => {
  if (sx === 1 && sy === 1) return O;
  const m = new DOMMatrix().translate(anchor[0], anchor[1]).scale(sx, sy).translate(-anchor[0], -anchor[1]);
  const mp = q => { const r = m.transformPoint(new DOMPoint(q[0], q[1])); return [r.x, r.y]; };
  const isPt = v => Array.isArray(v) && v.length === 2 && typeof v[0] === 'number' && typeof v[1] === 'number';
  const map = v => {
    if (v instanceof Path2D) { const p = new Path2D(); p.addPath(v, m); if (v.pts) { p.pts = v.pts.map(mp); p.closed = v.closed; } return p; }
    if (isPt(v)) return mp(v);
    if (Array.isArray(v)) return v.map(map);
    if (v && typeof v === 'object' && 'x' in v && 'y' in v) { const q = mp([v.x, v.y]), o = { ...v, x: q[0], y: q[1] }; if ('w' in v) { o.w = v.w * sx; o.h = v.h * sy; } if ('r' in v) o.r = v.r * Math.sqrt(sx * sy); if ('rx' in v) { o.rx = v.rx * sx; o.ry = v.ry * sy; } return o; }
    if (v && typeof v === 'object' && v.constructor === Object) { const o = {}; for (const k in v) o[k] = map(v[k]); return o; }
    return v;
  };
  const out = {};
  for (const k in O) {
    if (typeof O[k] === 'function') { const f = O[k]; out[k] = (...a) => mp(f(...a)); }
    else if (k === 'rigid' || k === 'tilt' || k === 'blink' || k === 'tailW' || k === 'eyeR' || k === 'headR') out[k] = O[k];
    else out[k] = map(O[k]);
  }
  out.stretch = { sx, sy, anchor, matrix: m };
  return out;
};

// ---------------- 少女（v2：按设定稿逐部位量点，Catmull-Rom 平滑） ----------------
// 关键点取自 生图/plates/09_postimp.png（AI 设定稿）叠网格读数；参考姿势 = 端杯在嘴边。
R.smooth = (pts, closed = true, k = 0.5) => {              // Catmull-Rom → 三次贝塞尔
  const p = new Path2D(), n = pts.length; if (n < 2) return p;
  const P_ = i => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
  p.moveTo(...pts[0]);
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = P_(i - 1), p1 = P_(i), p2 = P_(i + 1), p3 = P_(i + 2);
    p.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * k / 3, p1[1] + (p2[1] - p0[1]) * k / 3, p2[0] - (p3[0] - p1[0]) * k / 3, p2[1] - (p3[1] - p1[1]) * k / 3, p2[0], p2[1]);
  }
  if (closed) p.closePath(); return p;
};
R.taper = (A, B, wA, wB, bulge = 0) => {                  // 锥形肢体（袖子/手臂），bulge 让中段鼓起
  const a = Math.atan2(B[1] - A[1], B[0] - A[0]), nx = Math.cos(a + Math.PI / 2), ny = Math.sin(a + Math.PI / 2);
  const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], wM = (wA + wB) / 2 + bulge;
  return R.smooth([[A[0] + nx * wA / 2, A[1] + ny * wA / 2], [M[0] + nx * wM / 2, M[1] + ny * wM / 2], [B[0] + nx * wB / 2, B[1] + ny * wB / 2],
    [B[0] + Math.cos(a) * wB * 0.35, B[1] + Math.sin(a) * wB * 0.35], [B[0] - nx * wB / 2, B[1] - ny * wB / 2], [M[0] - nx * wM / 2, M[1] - ny * wM / 2], [A[0] - nx * wA / 2, A[1] - ny * wA / 2], [A[0] - Math.cos(a) * wA * 0.3, A[1] - Math.sin(a) * wA * 0.3]]);
};
// opt: { cup:0..1, sip, dx, dy, s, hat:'straw'|null, hair:'bun'|'long'|'braid'|'down', breathe,
//        sx, sy, anchor:[x,y]（非等比拉长，默认以脚底 (1240,932) 为轴，见 R.stretch） }
// 返回 G：每个部件一个 Path2D（RIG.smooth 生成的带 .pts 点列，可沿轮廓逐点改线宽/重剪）；G.A 锚点；
//   G.pivots 关节枢轴＋G.rigid 刚体分组（皮影/剪纸偶：每组只绕自己的枢轴转，见文件末 R.rigidPose）。
R.girl = (opt = {}) => {
  const { cup = 0, sip = 0, dx = 0, dy = 0, s = 1, breathe = 0 } = opt;
  const T = (x, y) => [dx + 1300 + (x - 1300) * s, dy + 620 + (y - 620) * s];
  const neck = T(1300, 425), tilt = -0.07 * cup - sip * 0.6;
  const HP = (x, y) => { const p = T(x, y), c = Math.cos(tilt), si = Math.sin(tilt), X = p[0] - neck[0], Y = p[1] - neck[1]; return [neck[0] + X * c - Y * si, neck[1] + X * si + Y * c]; };
  const TB = (x, y) => T(x, y + (y < 600 ? breathe * 150 * (600 - y) / 170 : 0));       // 呼吸只动上身
  const sm = (f, pts, closed = true) => { const q = pts.map(p => f(...p)); return Object.assign(R.smooth(q, closed), { pts: q, closed }); };   // Path2D 带点列 .pts
  const G = {};
  // —— 头部组 ——
  G.hairBack = sm(HP, [[1262, 312], [1300, 290], [1350, 293], [1392, 322], [1408, 368], [1398, 420], [1372, 448], [1346, 442], [1332, 412], [1318, 380], [1292, 340]]);
  const style = opt.hair || 'bun';
  G.bun = style === 'bun' ? (() => { const c0 = HP(1390, 372), p = new Path2D(); p.arc(c0[0], c0[1], 31 * s, 0, Math.PI * 2); return p; })() : null;
  G.bunSpiral = HP(1390, 372);
  G.hairDown = (style === 'long' || style === 'down') ? sm(HP, [[1340, 420], [1385, 430], [1418, 480], [1425, 560], [1405, 600], [1385, 540], [1360, 470]]) : null;
  G.braid = style === 'braid' ? [0, 1, 2, 3, 4].map(k => HP(1392 - k * 2, 440 + k * 30)) : null;
  G.face = sm(HP, [[1258, 318], [1252, 335], [1250, 352], [1242, 366], [1249, 373], [1256, 378], [1253, 386], [1259, 391], [1255, 398], [1263, 406], [1276, 413], [1296, 412], [1316, 398], [1326, 370], [1320, 335], [1296, 314]]);
  G.neck = sm(T, [[1286, 400], [1314, 400], [1324, 445], [1290, 448]]);
  G.bangs = sm(HP, [[1248, 322], [1260, 300], [1290, 293], [1322, 304], [1338, 330], [1332, 364], [1320, 346], [1302, 328], [1282, 322], [1266, 330], [1257, 346]]);
  G.locks = [sm(HP, [[1318, 345], [1308, 372], [1314, 398], [1306, 420], [1314, 440]], false), sm(HP, [[1326, 352], [1322, 380], [1330, 405], [1324, 430]], false)];
  G.hairLines = [sm(HP, [[1262, 312], [1300, 300], [1345, 312], [1380, 340]], false), sm(HP, [[1275, 322], [1315, 318], [1350, 338], [1372, 372]], false), sm(HP, [[1300, 330], [1340, 352], [1360, 395]], false)];
  const ec = HP(1268, 350); G.eye = { x: ec[0], y: ec[1], r: 5.5 * s };
  G.lid = sm(HP, [[1259, 348], [1268, 343], [1279, 348]], false);
  G.lashes = [[HP(1259, 348), HP(1254, 343)], [HP(1262, 345), HP(1258, 339)]];
  G.brow = sm(HP, [[1257, 335], [1268, 330], [1281, 334]], false);
  G.nostril = HP(1250, 382);
  G.lips = [HP(1252, 389), HP(1259, 390), HP(1254, 397)];
  G.cheek = HP(1283, 380); G.ear = HP(1318, 372);
  if (opt.hat === 'straw' || opt.hat === 'bonnet') {
    G.brim = (() => { const c0 = HP(1326, 300), p = new Path2D(); p.ellipse(c0[0], c0[1], 130 * s, 25 * s, tilt + 0.19, 0, Math.PI * 2); return p; })();
    G.crown = (() => { const c0 = HP(1336, 290), p = new Path2D(); p.ellipse(c0[0], c0[1], 62 * s, 44 * s, tilt + 0.14, Math.PI, 0); p.closePath(); return p; })();
    G.band = sm(HP, [[1276, 283], [1336, 296], [1398, 306], [1396, 318], [1336, 309], [1276, 296]]);
    G.bow = HP(1404, 318);
  }
  // —— 身体 ——
  G.torso = sm(TB, [[1290, 432], [1318, 428], [1350, 434], [1380, 446], [1404, 482], [1416, 542], [1424, 600], [1412, 622], [1300, 618], [1285, 560], [1282, 500], [1286, 460]]);
  G.bib = sm(TB, [[1291, 438], [1313, 436], [1307, 500], [1303, 560], [1305, 612], [1286, 612], [1283, 520]]);
  G.skirt = sm(T, [[1300, 605], [1420, 612], [1446, 650], [1452, 722], [1440, 762], [1362, 772], [1342, 802], [1352, 926], [1220, 932], [1104, 926], [1118, 820], [1150, 722], [1190, 656], [1242, 630]]);
  G.apronSkirt = sm(T, [[1300, 612], [1352, 642], [1332, 702], [1316, 822], [1200, 824], [1192, 702], [1200, 656], [1252, 630]]);
  G.folds = [sm(T, [[1230, 670], [1222, 760], [1226, 815]], false), sm(T, [[1268, 668], [1262, 760], [1268, 818]], false), sm(T, [[1160, 760], [1150, 860], [1146, 920]], false), sm(T, [[1300, 820], [1306, 880], [1300, 925]], false)];
  G.apronBow = [T(1428, 616), T(1450, 600), T(1452, 634), T(1440, 690)];
  G.shoe = sm(T, [[1098, 918], [1120, 910], [1146, 914], [1150, 928], [1100, 930]]);
  // 远侧手臂：搭在桌上（在躯干后面画）
  G.farSleeve = sm(TB, [[1332, 468], [1364, 520], [1346, 600], [1250, 632], [1212, 626], [1220, 604], [1300, 584], [1318, 520]]);
  G.farCuff = sm(T, [[1222, 604], [1236, 604], [1238, 630], [1220, 632]]);
  G.farHand = sm(T, [[1218, 606], [1180, 604], [1150, 609], [1146, 618], [1180, 626], [1218, 630]]);
  // 近侧手臂：IK，杯子从桌面(1196,598)举到嘴边(1226,380)
  const S = TB(1352, 456);
  const cupTable = T(1190, 596), cupMouth = HP(1226, 376);
  const cp = [lerp(cupTable[0], cupMouth[0], cup), lerp(cupTable[1], cupMouth[1], cup)];
  const handT = [cp[0] + 28 * s, cp[1] + 16 * s];
  const { E, H } = R.ik2(S, handT, 165 * s, 122 * s, -1);
  G.upperArm = R.taper(S, E, 54 * s, 40 * s, 10 * s);
  const W_ = [lerp(E[0], H[0], 0.82), lerp(E[1], H[1], 0.82)];
  G.foreArm = R.taper(E, W_, 40 * s, 30 * s, 2 * s);
  G.cuff = R.taper([lerp(E[0], H[0], 0.76), lerp(E[1], H[1], 0.76)], W_, 32 * s, 31 * s);
  const fa = Math.atan2(H[1] - E[1], H[0] - E[0]);
  G.hand = (() => { const p = new Path2D(), r = 15 * s; p.ellipse(H[0], H[1], r * 1.15, r, fa, 0, Math.PI * 2); return p; })();
  G.thumb = [H[0] + Math.cos(fa - 1.2) * 14 * s, H[1] + Math.sin(fa - 1.2) * 14 * s];
  G.cup = { x: cp[0], y: cp[1] - 18 * s, w: 44 * s, h: 38 * s, tilt: -0.45 * cup };
  G.hipSeat = T(1400, 700);
  // 锚点：给时代代码加服饰/头饰/光环用（都已跟随缩放、头部点跟随头部倾斜）
  G.A = { headTop: HP(1320, 288), headC: HP(1318, 360), forehead: HP(1262, 318), nape: HP(1360, 420), ear: HP(1318, 372), chin: HP(1270, 410),
    neck: T(1305, 435), chest: TB(1300, 500), shoulder: S, back: TB(1410, 520), waist: T(1350, 612), lap: T(1250, 640), knee: T(1190, 660), hemL: T(1104, 926), hemR: T(1352, 926), elbow: E, hand: H };
  G.tilt = tilt;
  G.HP = HP; G.T = T;                                   // 头部局部坐标（随仰头旋转）与身体坐标，加头饰/服饰用
  G.A.wrist = W_; G.A.cupBottom = [G.cup.x, G.cup.y + G.cup.h];
  G.box = [T(1100, 240), T(1460, 935)];
  // 刚体部件＋枢轴：head 组绕 neck 转（仰头就是这么转的），upperArm 绕 shoulder，foreArm/cuff 绕 elbow，hand 绕 wrist
  G.pivots = { neck, shoulder: S, elbow: E, wrist: W_, hip: T(1400, 700), farShoulder: TB(1332, 468), knee: G.A.knee };
  G.rigid = { head: ['hairBack', 'bun', 'hairDown', 'braid', 'face', 'bangs', 'locks', 'hairLines', 'lid', 'brow', 'brim', 'crown', 'band'], neck: ['neck'],
    torso: ['torso', 'bib'], skirt: ['skirt', 'apronSkirt', 'folds', 'shoe'], farArm: ['farSleeve', 'farCuff', 'farHand'],
    upperArm: ['upperArm'], foreArm: ['foreArm', 'cuff'], hand: ['hand'] };
  G.rigidPivot = { head: 'neck', neck: 'neck', torso: 'hip', skirt: 'hip', farArm: 'farShoulder', upperArm: 'shoulder', foreArm: 'elbow', hand: 'wrist' };
  if (opt.sx || opt.sy) return R.stretch(G, opt.sx || 1, opt.sy || 1, opt.anchor || [1240, 932]);
  return G;
};
// ---------- 分层绘制的钩子（迁移测试 C 的 X.girl/X.cat 思路，正式并入） ----------
// pal.before = {部件名: (c, G, pal) => {}}、pal.after = {部件名: fn}：在任意部件前/后插画（领子、裙撑、刺绣、发饰、项圈……）。
// pal.hooks = {别名: fn}：常用插槽的简写，别名表见 GIRL_SLOTS / CAT_SLOTS。
// 钩子画的东西和部件一样参与遮挡：在 mode:'line'（visibleLines）下也只露出看得见的线——钩子里描线请用 pal.line，别写死颜色。
const GIRL_SLOTS = { back: ['before', 'farSleeve'], skirt: ['after', 'skirt'], torso: ['after', 'torso'], head: ['after', 'bangs'], face: ['after', 'features'], arm: ['after', 'cuff'], end: ['after', 'thumb'] };
const CAT_SLOTS = { back: ['before', 'tail'], body: ['after', 'white'], head: ['after', 'stripes'], end: ['after', 'whiskers'] };
const hooker = (c, O, pal, slots) => {
  const B = { ...(pal.before || {}) }, A = { ...(pal.after || {}) };
  if (pal.hooks) for (const k in pal.hooks) { const sl = slots[k]; if (!sl) throw new Error(`RIG 钩子别名不存在：${k}（可用 ${Object.keys(slots).join('/')}，或用 before/after:{部件名}）`); (sl[0] === 'before' ? B : A)[sl[1]] = pal.hooks[k]; }
  return (name, fn) => { if (B[name]) B[name](c, O, pal); fn(); if (A[name]) A[name](c, O, pal); };
};
// 少女部件画序（远→近）。自己逐部件上色时照这个顺序画，遮挡就是对的。
R.GIRL_ORDER = ['farSleeve', 'farHand', 'farCuff', 'hairDown', 'skirt', 'apronSkirt', 'folds', 'shoe', 'torso', 'bib', 'apronBow', 'neck', 'hairBack', 'bun', 'bunSpiral', 'face', 'cheek', 'ear',
  'bangs', 'hairLines', 'locks', 'features', 'hat', 'upperArm', 'foreArm', 'cuff', 'hand', 'cup', 'thumb'];
// 端杯手与杯子的前后：杯子在手前面（侧身朝左时杯子靠观众这侧）
// pal 颜色：dress（skirt/torso/farSleeve 可单独覆盖）sleeve skin hair hairLine cuff apron fold shoe iris lip cheek browC hat hatBand cupBody cupRim
// pal 线：line lw lwOf:{部件名:线宽} mode:'both'|'fill'|'line'（line 内部走 visibleLines）lineKey
// pal 分层：before/after/hooks（见上）；paint(c, path, color, name) 接管每个部件的「填＋描」（赛璐珞、网点、剪纸边……）；
//   features(c, G, pal) 接管五官；cup(c, G, pal) 接管杯子；blink 闭眼；locks:false 不画鬓角发绺。
R.drawGirl = (c, G, pal) => {
  if (pal.mode === 'line') {      // 线稿模式：内部走 visibleLines，被遮住的轮廓（远侧袖子、帽檐后半圈、被手臂挡住的躯干线）不会画穿
    const [a, b] = G.box, box = [a[0] - 60, a[1] - 90, b[0] + 60, b[1] + 30];
    c.drawImage(R.visibleLines(pal.lineKey || 'girl', (g, lc) => R.drawGirl(g, G, { ...pal, mode: 'both', line: lc }), pal.line || '#1b1d3a', box), 0, 0); return;
  }
  const L = pal.line || '#1b1d3a', lw = pal.lw ?? 3, mode = pal.mode || 'both';
  const step = hooker(c, G, pal, GIRL_SLOTS);
  const LWof = (name, d = lw) => pal.lwOf && pal.lwOf[name] != null ? pal.lwOf[name] : d;
  const F = (name, p, col, line = true) => step(name, () => {
    if (!p || !col) return;
    if (pal.paint) { pal.paint(c, p, col, name); return; }
    if (mode !== 'line') { c.fillStyle = col; c.fill(p); }
    const w = LWof(name); if (w && line && mode !== 'fill') { c.strokeStyle = L; c.lineWidth = w; c.stroke(p); }
  });
  const S_ = (p, col, w) => { if (!p) return; c.strokeStyle = col; c.lineWidth = w; c.stroke(p); };
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
  F('farSleeve', G.farSleeve, pal.farSleeve || pal.dress); F('farHand', G.farHand, pal.skin); F('farCuff', G.farCuff, pal.cuff || pal.apron || '#f3eee2');
  F('hairDown', G.hairDown, pal.hair);
  F('skirt', G.skirt, pal.skirt || pal.dress); if (pal.apron) F('apronSkirt', G.apronSkirt, pal.apron);
  step('folds', () => { if (pal.fold) G.folds.forEach(f => S_(f, pal.fold, 2.5)); });
  F('shoe', G.shoe, pal.shoe || '#4a2c1a');
  F('torso', G.torso, pal.torso || pal.dress); if (pal.apron) F('bib', G.bib, pal.apron);
  step('apronBow', () => { if (!pal.apron) return; c.strokeStyle = L; c.lineWidth = lw; c.fillStyle = pal.apron; const b = G.apronBow; c.beginPath(); c.ellipse(b[0][0] + 10, b[0][1] - 6, 16, 10, -0.5, 0, Math.PI * 2); c.fill(); c.stroke(); c.beginPath(); c.moveTo(...b[0]); c.lineTo(...b[3]); c.lineWidth = 9; c.strokeStyle = pal.apron; c.stroke(); });
  F('neck', G.neck, pal.skin);
  F('hairBack', G.hairBack, pal.hair); F('bun', G.bun, pal.hair);
  step('bunSpiral', () => { if (G.bun && pal.hairLine) { c.strokeStyle = pal.hairLine; c.lineWidth = 2.5; c.beginPath(); for (let a = 0; a < 9; a += 0.2) { const r = 4 + a * 2.6; const x = G.bunSpiral[0] + Math.cos(a) * r, y = G.bunSpiral[1] + Math.sin(a) * r; a ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); } });
  F('face', G.face, pal.skin);
  step('cheek', () => { c.save(); c.clip(G.face); if (pal.cheek) { c.fillStyle = pal.cheek; c.beginPath(); c.arc(G.cheek[0], G.cheek[1], 13, 0, Math.PI * 2); c.fill(); } c.restore(); });
  step('ear', () => { if (G.ear && pal.skin) { c.fillStyle = pal.skin; c.beginPath(); c.ellipse(G.ear[0], G.ear[1], 8, 12, 0.2, 0, Math.PI * 2); c.fill(); const w = LWof('ear', lw * 0.7); if (w) { c.strokeStyle = L; c.lineWidth = w; c.stroke(); } } });
  F('bangs', G.bangs, pal.hair);
  step('hairLines', () => { if (pal.hairLine) { G.hairLines.forEach(h => S_(h, pal.hairLine, 2.2)); } });
  step('locks', () => { if (pal.locks !== false) G.locks.forEach(h => { S_(h, L, 9); S_(h, pal.hair, 6); }); });
  // 五官
  step('features', () => {
    if (pal.features) { pal.features(c, G, pal); return; }
    if (pal.blink) { c.strokeStyle = L; c.lineWidth = 2.8; c.beginPath(); c.arc(G.eye.x, G.eye.y - 1, 7, 0.25, Math.PI - 0.25); c.stroke(); }
    else {
      S_(G.lid, L, 2.6); G.lashes.forEach(l => { c.beginPath(); c.moveTo(...l[0]); c.lineTo(...l[1]); c.strokeStyle = L; c.lineWidth = 2; c.stroke(); });
      c.fillStyle = pal.iris || '#2b4d8a'; c.beginPath(); c.ellipse(G.eye.x - 1, G.eye.y + 1.5, G.eye.r * 0.8, G.eye.r, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(G.eye.x - 2.5, G.eye.y - 0.5, 1.6, 0, Math.PI * 2); c.fill();
    }
    S_(G.brow, pal.browC || pal.hairLine || L, 2.4);
    c.fillStyle = pal.lip || '#cf5a58'; c.beginPath(); c.moveTo(...G.lips[0]); c.lineTo(...G.lips[1]); c.lineTo(...G.lips[2]); c.closePath(); c.fill();
  });
  // 帽
  step('hat', () => { if (G.brim && pal.hat) { F('brim', G.brim, pal.hat); F('crown', G.crown, pal.hat); F('band', G.band, pal.hatBand || '#2d4fa0', false); c.fillStyle = pal.hatBand || '#2d4fa0'; c.beginPath(); c.ellipse(G.bow[0], G.bow[1], 14, 9, 0.6, 0, Math.PI * 2); c.fill(); } });
  // 近侧手臂、杯、手
  F('upperArm', G.upperArm, pal.sleeve || pal.dress); F('foreArm', G.foreArm, pal.sleeve || pal.dress); F('cuff', G.cuff, pal.cuff || pal.apron || '#f3eee2');
  F('hand', G.hand, pal.skin);
  step('cup', () => { if (pal.cup) pal.cup(c, G, pal); else R.drawCup(c, G.cup, { body: pal.cupBody || '#2a4fa8', rim: pal.cupRim || '#5a3216', line: L, lw: lw * 0.8, hw: 7 }); });
  step('thumb', () => { c.fillStyle = pal.skin; c.beginPath(); c.arc(G.thumb[0], G.thumb[1], 7, 0, Math.PI * 2); c.fill(); const w = LWof('thumb', lw * 0.7); if (w) { c.strokeStyle = L; c.lineWidth = w; c.stroke(); } });
  c.restore();
};

// 只画五官（迁移测试 C 的 X.features）：「先渲染器、后补五官」的画法用——平涂进笔触/点彩后五官会糊，最后单独补一遍。
// s: { line, featureW(线宽倍数), iris, brow, lip, cheek, blink }
R.drawFeatures = (c, G, s = {}) => {
  const L = s.line || '#111', k = s.featureW || 1;
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  if (s.blink) { c.strokeStyle = L; c.lineWidth = 3 * k; c.beginPath(); c.arc(G.eye.x, G.eye.y - 1, 7, 0.25, Math.PI - 0.25); c.stroke(); }
  else {
    c.strokeStyle = L; c.lineWidth = 2.8 * k; c.stroke(G.lid);
    G.lashes.forEach(l => { c.beginPath(); c.moveTo(...l[0]); c.lineTo(...l[1]); c.lineWidth = 2 * k; c.stroke(); });
    c.fillStyle = s.iris || '#2b4d8a'; c.beginPath(); c.ellipse(G.eye.x - 1, G.eye.y + 1.5, G.eye.r * 0.8, G.eye.r, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(G.eye.x - 2.5, G.eye.y - 0.5, 1.6, 0, Math.PI * 2); c.fill();
  }
  c.strokeStyle = s.brow || L; c.lineWidth = 2.6 * k; c.stroke(G.brow);
  c.fillStyle = s.lip || '#cf5a58'; c.beginPath(); c.moveTo(...G.lips[0]); c.lineTo(...G.lips[1]); c.lineTo(...G.lips[2]); c.closePath(); c.fill();
  if (s.cheek) { c.save(); c.clip(G.face); c.fillStyle = s.cheek; c.beginPath(); c.arc(G.cheek[0], G.cheek[1], 13, 0, Math.PI * 2); c.fill(); c.restore(); }
  c.restore();
};

// 画杯子（通用）：c.translate 到杯口中心再画，style: {body, rim, line, handle:true}
R.drawCup = (c, cup, st = {}) => {
  c.save(); c.translate(cup.x, cup.y); c.rotate(cup.tilt || 0);
  const w = cup.w, h = cup.h;
  c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(-w * 0.42, h); c.quadraticCurveTo(0, h * 1.12, w * 0.42, h); c.lineTo(w / 2, 0); c.closePath();
  c.fillStyle = st.body || '#2a4fa8'; c.fill();
  if (st.line) { c.strokeStyle = st.line; c.lineWidth = st.lw || 3; c.stroke(); }
  if (st.handle !== false) { c.beginPath(); c.arc(w * 0.55, h * 0.4, h * 0.26, -1.2, 1.4); c.strokeStyle = st.body || '#2a4fa8'; c.lineWidth = st.hw || 7; c.stroke(); }
  c.beginPath(); c.ellipse(0, 0, w / 2, h * 0.14, 0, 0, Math.PI * 2); c.fillStyle = st.rim || '#6b3f1f'; c.fill();
  if (st.line) { c.strokeStyle = st.line; c.lineWidth = st.lw || 3; c.stroke(); }
  c.restore();
};

// ---------------- 猫（橘白，朝右坐） ----------------
// opt: { tail(弧度), blink, ear, breathe, dx, dy, s, look, sx, sy, anchor }
// 返回 K：K.body 已平滑（Catmull-Rom，带 .pts；旧折线在 K.bodyPoly）；白区拆成 K.chest / K.muzzle / K.paws，
//   K.white = 三者合在一条 Path2D（兼容旧代码），K.whitePts 给点列/椭圆参数；K.pivots / K.rigid 同少女。
R.cat = (opt = {}) => {
  const { tail = 0, blink = 0, breathe = 0, dx = 0, dy = 0, s = 1, look = 0 } = opt;
  const T = (x, y) => [dx + 540 + (x - 540) * s, dy + 905 + (y - 905) * s];
  const P = {};
  // 身体：梨形
  const body = new Path2D();
  P.bodyPts = [[470, 900], [430, 860], [425, 790], [450, 720], [500, 680], [570, 668], [625, 690], [650, 750], [660, 830], [650, 900]].map(p => T(p[0], p[1] - (p[1] < 800 ? breathe * 300 : 0)));
  P.bodyPts.forEach((p, i) => i ? body.lineTo(...p) : body.moveTo(...p)); body.closePath(); P.bodyPoly = body;
  P.body = Object.assign(R.smooth(P.bodyPts), { pts: P.bodyPts, closed: true });     // 卡通/赛璐珞/不描线的画法里折线身体会露直边（迁移测试 B、D）
  // 头
  const hc = T(600 + look * 6, 625); P.headC = hc; P.headR = 64 * s;
  const head = new Path2D(); head.ellipse(hc[0], hc[1], 66 * s, 58 * s, 0, 0, Math.PI * 2);
  // 耳朵
  const ear = (bx, by, tx, ty, ex, ey) => { head.moveTo(...T(bx, by)); head.lineTo(...T(tx, ty)); head.lineTo(...T(ex, ey)); head.closePath(); };
  ear(555, 590, 560, 535, 595, 575); ear(615, 575, 652, 540, 650, 600);
  P.head = head;
  P.earInner = [[T(563, 585), T(565, 550), T(588, 578)], [T(622, 578), T(646, 553), T(644, 596)]];
  // 白色部分：口鼻、胸口、爪子（橘白猫的标志）。胸口用平滑闭合曲线：旧版直线多边形在不描线的画法里像一块「盾牌」（迁移测试 B）
  const mz = T(628, 650), chestPts = [[560, 700], [610, 690], [640, 740], [630, 820], [590, 860], [560, 800]].map(p => T(...p));
  P.chest = Object.assign(R.smooth(chestPts), { pts: chestPts, closed: true });
  P.muzzle = new Path2D(); P.muzzle.ellipse(mz[0], mz[1], 34 * s, 24 * s, 0, 0, Math.PI * 2);
  P.paws = new Path2D(); const pawC = [585, 635].map(x => T(x, 893));
  pawC.forEach(c0 => { P.paws.moveTo(c0[0] + 22 * s, c0[1]); P.paws.ellipse(c0[0], c0[1], 22 * s, 13 * s, 0, 0, Math.PI * 2); });
  const white = new Path2D(); white.addPath(P.muzzle); white.addPath(P.chest); white.addPath(P.paws);
  P.white = white;
  P.whitePts = { chest: chestPts, muzzle: { x: mz[0], y: mz[1], rx: 34 * s, ry: 24 * s }, paws: pawC.map(c0 => ({ x: c0[0], y: c0[1], rx: 22 * s, ry: 13 * s })) };
  // 前腿
  P.legs = [R.limb(T(588, 740), T(584, 888), 34 * s, 28 * s), R.limb(T(630, 742), T(634, 888), 34 * s, 28 * s)];
  // 眼睛（朝右看）、鼻、嘴、胡须
  P.eyes = [{ x: T(612, 615)[0], y: T(612, 615)[1] }, { x: T(648, 612)[0], y: T(648, 612)[1] }]; P.eyeR = 9 * s; P.blink = blink;
  P.nose = T(655, 640); P.mouth = [T(645, 655), T(655, 650), T(664, 655)];
  P.whiskers = [[T(660, 645), T(712, 632)], [T(660, 650), T(715, 655)], [T(598, 648), T(552, 640)]];
  // 虎斑条纹（头顶、背）
  P.stripes = [[T(585, 572), T(590, 595)], [T(605, 568), T(607, 592)], [T(625, 572), T(622, 594)],
    [T(452, 740), T(490, 750)], [T(440, 780), T(482, 790)], [T(436, 822), T(478, 830)], [T(500, 690), T(520, 715)]];
  // 尾巴：从臀部绕到身前，末端随 tail 摆
  const t0 = T(455, 885), tip = T(380 + Math.sin(tail) * 40, 830 - Math.cos(tail) * 30);
  P.tailPts = P_bez(t0, T(360, 900), T(330, 860 + tail * 40), tip);
  P.tail = (() => { const p = new Path2D(); const pts = P.tailPts; pts.forEach((q, i) => i ? p.lineTo(...q) : p.moveTo(...q)); return p; })();
  P.tailW = 26 * s;
  P.box = [T(390, 540), T(700, 905)];
  P.pivots = { neck: T(588 + look * 6, 680), tailBase: t0, shoulder: T(600, 735), hip: T(470, 870) };
  P.rigid = { head: ['head', 'earInner', 'eyes', 'nose', 'mouth', 'whiskers', 'muzzle'], body: ['body', 'chest', 'stripes'], legs: ['legs', 'paws'], tail: ['tail'] };
  P.rigidPivot = { head: 'neck', body: 'hip', legs: 'shoulder', tail: 'tailBase' };
  if (opt.sx || opt.sy) return R.stretch(P, opt.sx || 1, opt.sy || 1, opt.anchor || [540, 905]);
  return P;
};
function P_bez(p0, p1, p2, p3, n = 20) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]); } return o; }

// 猫只描线（给「先渲染器、后补线」的时代用）
R.drawCatLines = (c, K, pal) => {
  const L = pal.line || '#1b1d3a', lw = pal.lw ?? 3; c.save(); c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = L; c.lineWidth = lw;
  c.stroke(K.body); c.stroke(K.head); K.legs.forEach(l => c.stroke(l));
  K.eyes.forEach(e => { if (K.blink) { c.beginPath(); c.arc(e.x, e.y, K.eyeR, 0.2, Math.PI - 0.2); c.stroke(); } else { c.fillStyle = pal.eye || '#6aa84f'; c.beginPath(); c.arc(e.x, e.y, K.eyeR, 0, Math.PI * 2); c.fill(); c.stroke(); c.fillStyle = L; c.beginPath(); c.ellipse(e.x + 2, e.y, K.eyeR * 0.35, K.eyeR * 0.8, 0, 0, Math.PI * 2); c.fill(); } });
  c.fillStyle = pal.noseC || '#d8746a'; c.beginPath(); c.arc(K.nose[0], K.nose[1], 6, 0, Math.PI * 2); c.fill();
  c.lineWidth = 2.5; c.beginPath(); c.moveTo(...K.mouth[0]); c.quadraticCurveTo(...K.mouth[1], ...K.mouth[2]); c.stroke();
  c.lineWidth = 1.5; K.whiskers.forEach(w => { c.beginPath(); c.moveTo(...w[0]); c.lineTo(...w[1]); c.stroke(); });
  c.restore();
};
// 只取「看得见的线」：同一个完整画法（填色＋描线，按部件顺序所以遮挡正确）画两遍，一遍用真线色、一遍用白色当哨兵；
// 两遍不同的像素 = 没被遮住的线（含用线色画的眼睑、眉、胡须、嘴）。取第一遍的颜色输出。
// 用于「平涂→风格肌理→补线」：直接 mode:'line' 叠最上层会把被遮住的轮廓（远侧袖子、帽檐后半圈）画穿。
// drawWith(g, lineColor) 由调用方提供，box=[x0,y0,x1,y1] 限定计算范围。
R._lc = {};
R.visibleLines = (key, drawWith, lineColor, box, thresh = 90) => {
  const [x0, y0, x1, y1] = box.map(Math.round), w = x1 - x0, h = y1 - y0;
  const mk = n => R._lc[key + n] || (R._lc[key + n] = (() => { const c = document.createElement('canvas'); c.width = window.STAGE.W; c.height = window.STAGE.H; return c; })());
  const A = mk('a'), B = mk('b'), O = mk('o');
  const ga = A.getContext('2d', { willReadFrequently: true }), gb = B.getContext('2d', { willReadFrequently: true }), go = O.getContext('2d');
  ga.clearRect(0, 0, ga.canvas.width, ga.canvas.height); gb.clearRect(0, 0, gb.canvas.width, gb.canvas.height); go.clearRect(0, 0, go.canvas.width, go.canvas.height);
  drawWith(ga, lineColor); drawWith(gb, '#ffffff');
  const da = ga.getImageData(x0, y0, w, h), db = gb.getImageData(x0, y0, w, h).data, d = da.data;
  for (let i = 0; i < d.length; i += 4) {
    const diff = Math.abs(d[i] - db[i]) + Math.abs(d[i + 1] - db[i + 1]) + Math.abs(d[i + 2] - db[i + 2]);
    if (diff < thresh) d[i + 3] = 0; else d[i + 3] = Math.min(255, d[i + 3] * Math.min(1, diff / 300));
  }
  go.putImageData(da, x0, y0); return O;
};
// 一站式默认画法见上方 R.drawGirl；猫：
// pal：orange white stripe stripeW eye earInner noseC(=nose) whisker line lw lwOf mode('line' 走 visibleLines) lineKey
//   分层：before/after/hooks（别名 back/body/head/end）；paint(c, path, color, name, stroke) 接管部件填描；
//   face(c, K, pal) 接管眼鼻嘴须；tail(c, K, pal) 接管尾巴；noStripes 不画条纹。
// 部件画序：tail body legs white head muzzleWhite earInner stripes eyes nose mouth whiskers
R.drawCat = (c, K, pal) => {
  const L = pal.line || '#1b1d3a', lw = pal.lw ?? 3;
  if (pal.mode === 'line') { const [a, b] = K.box, box = [a[0] - 60, a[1] - 40, b[0] + 70, b[1] + 30];
    c.drawImage(R.visibleLines(pal.lineKey || 'cat', (g, lc) => R.drawCat(g, K, { ...pal, mode: 'both', line: lc, whisker: lc }), pal.line || '#1b1d3a', box), 0, 0); return; }
  const step = hooker(c, K, pal, CAT_SLOTS), O = pal.orange || '#e8913a', Wt = pal.white || '#fff6ea';
  const LWof = name => pal.lwOf && pal.lwOf[name] != null ? pal.lwOf[name] : lw;
  const F = (name, p, col, stroke = true) => { if (pal.paint) { pal.paint(c, p, col, name, stroke); return; } c.fillStyle = col; c.fill(p); const w = LWof(name); if (w && stroke) { c.strokeStyle = L; c.lineWidth = w; c.stroke(p); } };
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
  // 尾巴
  step('tail', () => { if (pal.tail) { pal.tail(c, K, pal); return; }
    c.strokeStyle = L; c.lineWidth = K.tailW + lw * 2; c.stroke(K.tail); c.strokeStyle = O; c.lineWidth = K.tailW; c.stroke(K.tail);
    const tip = K.tailPts[K.tailPts.length - 1]; c.fillStyle = Wt; c.beginPath(); c.arc(tip[0], tip[1], K.tailW / 2, 0, Math.PI * 2); c.fill(); });
  // 身体、腿、头
  step('body', () => F('body', K.body, O));
  step('legs', () => K.legs.forEach(l => F('leg', l, Wt)));
  step('white', () => F('white', K.white, Wt, false));
  step('head', () => F('head', K.head, O));
  step('muzzleWhite', () => { c.save(); c.clip(K.head); c.fillStyle = Wt; c.beginPath(); c.ellipse(K.nose[0] - 22, K.nose[1] + 12, 36, 26, 0, 0, Math.PI * 2); c.fill(); c.restore(); });
  step('earInner', () => { c.fillStyle = pal.earInner || '#f2a7a0'; K.earInner.forEach(e => { c.beginPath(); e.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.fill(); }); });
  // 条纹
  step('stripes', () => { if (pal.noStripes) return; c.strokeStyle = pal.stripe || '#c0621a'; c.lineWidth = pal.stripeW || 7; K.stripes.forEach(s => { c.beginPath(); c.moveTo(...s[0]); c.lineTo(...s[1]); c.stroke(); }); });
  if (pal.face) step('face', () => pal.face(c, K, pal));
  else {
    // 眼
    step('eyes', () => K.eyes.forEach(e => { if (K.blink) { c.strokeStyle = L; c.lineWidth = 3; c.beginPath(); c.arc(e.x, e.y, K.eyeR, 0.2, Math.PI - 0.2); c.stroke(); }
      else { c.fillStyle = pal.eye || '#6aa84f'; c.beginPath(); c.arc(e.x, e.y, K.eyeR, 0, Math.PI * 2); c.fill(); c.fillStyle = L; c.beginPath(); c.ellipse(e.x + 2, e.y, K.eyeR * 0.35, K.eyeR * 0.8, 0, 0, Math.PI * 2); c.fill(); } }));
    step('nose', () => { c.fillStyle = pal.noseC || pal.nose || '#d8746a'; c.beginPath(); c.arc(K.nose[0], K.nose[1], 6, 0, Math.PI * 2); c.fill(); });
    step('mouth', () => { c.strokeStyle = L; c.lineWidth = 2.5; c.beginPath(); c.moveTo(...K.mouth[0]); c.quadraticCurveTo(...K.mouth[1], ...K.mouth[2]); c.stroke(); });
    step('whiskers', () => { c.lineWidth = 1.5; c.strokeStyle = pal.whisker || L; K.whiskers.forEach(w => { c.beginPath(); c.moveTo(...w[0]); c.lineTo(...w[1]); c.stroke(); }); });
  }
  c.restore();
};
// 刚体姿态（皮影、剪纸偶、提线木偶）：把 rigid 分组里的部件绕各自枢轴旋转。angles = {组名: 弧度}，
// 返回新对象（Path2D 与点都转好），子组不自动跟随父组——需要链式时自己把父组的角度加到子组上（如 foreArm += upperArm）。
R.rigidPose = (O, angles) => {
  const out = { ...O };
  for (const grp in angles) {
    const a = angles[grp], piv = O.pivots[O.rigidPivot[grp]]; if (!a || !piv) continue;
    const m = new DOMMatrix().translate(piv[0], piv[1]).rotate(a * 180 / Math.PI).translate(-piv[0], -piv[1]);
    const mp = q => { const r = m.transformPoint(new DOMPoint(q[0], q[1])); return [r.x, r.y]; };
    const map = v => { if (v instanceof Path2D) { const p = new Path2D(); p.addPath(v, m); if (v.pts) { p.pts = v.pts.map(mp); p.closed = v.closed; } return p; }
      if (Array.isArray(v) && v.length === 2 && typeof v[0] === 'number') return mp(v); if (Array.isArray(v)) return v.map(map);
      if (v && typeof v === 'object' && 'x' in v) { const q = mp([v.x, v.y]); return { ...v, x: q[0], y: q[1] }; } return v; };
    O.rigid[grp].forEach(name => { if (out[name] != null) out[name] = map(out[name]); });
  }
  return out;
};
})();
