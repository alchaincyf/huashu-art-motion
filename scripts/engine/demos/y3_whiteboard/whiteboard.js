// Y3 · whiteboard explainer (RSA Animate: one large board and moving camera): “How AI Learned to Recognize Cats”
// Basis: grammar y3_whiteboard.md (RSA measurements: black #0A0503 and single orange accent #EB701F; writing ≈16 characters/second, 0.5s behind voiceover;
//       smooth easeInOutSine moves median 1.8s; distant jumps use 0.8s blurred whip; hand enters lower right, exits after drawing; ending pulls back to entire board)
// ① draw cat, write “猫？” and question → transition A: whip pan, pen stays down as camera whips to distant board region over 0.8s with blur
// ② draw stack of 10 million images (orange number pops directly, no hand), arrow, neural network, “自己找规律”
// → transition B: smooth board move, sine ease-in/out diagonal track to adjacent blank region over 0.95s, hand starts before camera settles
// ③ draw Huashu pointing at cat, checkmark, orange “是猫！” pops → ending full-board pullback (RSA / VideoScribe default Zoom at end), gray wash over board
// Libraries: DG.board (stroke timeline and following pen), DG.pen, DG.revealMask/zigzag (character reveal), CAM (keyframe camera, motion blur).
(() => {
const W = 1920, H = 1080;
const { clamp, lerp, rng } = U;
const seg = MO.seg;
const Y3 = window.Y3 = {};
const F0 = 0; Y3.F0 = F0;
Y3.SHOTS = { s1: [0, 2.5], s2: [2.5, 4.75], s3: [4.75, 8.0] };
const INK = '#0A0503', ORANGE = '#EF7226', WASH = 'rgba(239,114,38,.22)', BOARD = '#FBFBFB';
const LW = 6.5;                                         // Measured RSA stroke width ≈0.6–0.7% of image height (1080p≈6–7px)
const R1 = [960, 540], R2 = [3000, 540], R3 = [3700, 1360], K3 = 0.8;
const L3 = (x, y) => [R3[0] + (x - 960) * K3, R3[1] + (y - 540) * K3];
const SPEED = 2600;                                    // Line drawing speed: world pixels/second (demo about twice RSA live-action speed, see card)

// ---------- Stroke timeline: ordered, duration = length / drawing speed ----------
const B = DG.board({ ink: INK, lw: LW, speed: SPEED, font: '"LXGWWenKai-500"' });
const tr = DG.xform, arc = DG.arcPts, pathOf = pts => U.poly(pts);

// Cat strokes (local coordinates, origin=bottom center of seated pose, about 400 high)
const catStrokes = (ox, oy, s, sp, w, whiskers = true) => {
  const P = (pts) => tr(pts, ox, oy, s);
  B.line(P([[-60, -250], [-92, -330], [-30, -300], [30, -300], [92, -330], [60, -250]]), { w, speed: sp });
  B.line(P(arc(0, -230, 100, 82, -0.55, Math.PI + 0.55, 26).reverse()), { w, speed: sp });
  B.line(P([[-80, -170], [-120, -60], [-110, 0], [110, 0], [120, -60], [80, -170]]), { w, speed: sp });
  B.line(P([[110, -20], [190, -40], [210, -130], [170, -190]]), { w, speed: sp });
  B.line(P(arc(-38, -240, 12, 16, 0, Math.PI * 2, 14)), { w: w * 0.8, speed: sp * 1.6 });
  B.line(P(arc(38, -240, 12, 16, 0, Math.PI * 2, 14)), { w: w * 0.8, speed: sp * 1.6 });
  B.line(P([[-10, -205], [10, -205], [0, -194], [-10, -205]]), { w: w * 0.8, speed: sp * 1.6, smooth: false });
  if (whiskers) for (const k of [-1, 1]) B.line(P([[k * 30, -196], [k * 110, -206]]), { w: w * 0.6, speed: sp * 2 });
};
const catBody = (ox, oy, s) => pathOf(tr([[-80, -170], [-120, -60], [-110, 0], [110, 0], [120, -60], [80, -170], [60, -160], [0, -150], [-60, -160]], ox, oy, s));

// ===== First region =====
B.at(0.12);
catStrokes(760, 820, 1.0, SPEED * 0.75, LW + 1);
B.fill(catBody(760, 820, 1.0), WASH);
B.text('猫？', 1060, 560, 150, { col: ORANGE, rate: 7.5 });                                    // Heading: 7.5 characters/second
B.line([[1080, 610], [1020, 660], [930, 690]], { col: ORANGE });
B.line([[960, 668], [928, 690], [966, 704]], { col: ORANGE, smooth: false });
B.text('AI 怎么认出它？', 960, 960, 84, { align: 'center' });                                 // Body: 16 characters/second
B.line([[1290, 590], [1500, 560], [1760, 540]], { col: ORANGE, speed: SPEED * 1.6 });           // Orange arrow toward next region gives whip direction
B.line([[1725, 512], [1764, 540], [1728, 572]], { col: ORANGE, smooth: false });
const END1 = B.cur;
// Pen stays on board during whip: onscreen tip slides from first arrowhead to second starting point, board flies underneath, leaving orange connector (pen keeps drawing and guiding gaze).
// Trajectory = onscreen pen positions inverse-transformed by camera at each time into world points (computed at first draw).
const trail = { kind: 'custom', from: [1764, 540], to: [2382, 278], t0: B.cur + 0.01, t1: 3.3, col: ORANGE, w: LW, wob: 14,
  draw(g, q) {
    const s = this;
    if (!s.pts) { const N = 72, a = CAM.toScreen(camAt(s.t0), ...s.from), b = CAM.toScreen(camAt(s.t1), ...s.to); s.pts = [];
      for (let i = 0; i <= N; i++) { const u = i / N, cm = camAt(lerp(s.t0, s.t1, u)), e = MO.sineInOut(u), sx = lerp(a[0], b[0], e), sy = lerp(a[1], b[1], e) + Math.sin(u * Math.PI * 3) * s.wob * Math.sin(u * Math.PI);
        s.pts.push(CAM.toWorld(cm, sx, sy)); }
      s.cum = DG.cum(s.pts); }
    const k = q * (s.pts.length - 1), i = Math.floor(k), f = k - i, d = s.cum[i] + (i < s.pts.length - 1 ? (s.cum[i + 1] - s.cum[i]) * f : 0);
    g.strokeStyle = s.col; g.lineWidth = s.w; return DG.drawPartial(g, s.pts, s.cum, d);
  },
  start() { return this.from; }, end() { return this.pts ? this.pts[this.pts.length - 1] : this.to; } };
B.push(trail);

// ===== Second region (camera whips in at 2.5→3.3) =====
B.at(3.31);
for (let i = 2; i >= 0; i--) { const x = 2330 + i * 26, y = 330 - i * 26; B.fill(pathOf([[x, y], [x + 260, y], [x + 260, y + 190], [x, y + 190]]), BOARD, 0.01); B.line([[x, y], [x + 260, y], [x + 260, y + 190], [x, y + 190], [x, y + 3]], { w: 6, speed: SPEED * 4.5, smooth: false, amp: 0 }); }
B.line(tr([[-60, -250], [-92, -330], [-30, -300], [30, -300], [92, -330], [60, -250], ...arc(0, -230, 100, 82, -0.55, Math.PI + 0.55, 20).reverse(), [-60, -250]], 2460, 560, 0.4), { w: 5, speed: SPEED * 3, gap: 0 });
B.line(tr([[-38, -240], [-38, -236], [38, -236], [38, -240]], 2460, 560, 0.4), { w: 6, speed: SPEED, smooth: false, gap: 0.01 });
B.pop('×1000万张', 2470, 690, 74, { col: ORANGE });
B.line([[2680, 450], [2800, 452], [2860, 450]]);
B.line([[2830, 425], [2864, 450], [2830, 476]], { smooth: false });
const NET = [[2960, [330, 450, 570]], [3090, [300, 450, 600]], [3220, [400, 500]]];
for (const [x, ys] of NET) for (const y of ys) B.line(arc(x, y, 26, 26, -Math.PI / 2, Math.PI * 1.55, 16), { w: 6, speed: SPEED * 5, amp: 0.8, min: 0.03, gap: 0.01 });
for (let a = 0; a < 2; a++) for (const y0 of NET[a][1]) for (const y1 of NET[a + 1][1]) B.segment([NET[a][0] + 26, y0], [NET[a + 1][0] - 26, y1], { w: 3 });
B.at(B.cur + 0.05);
B.text('自己找规律', 3090, 780, 64, { align: 'center' });
// Orange connector: network to next region (draws as camera starts moving, hand leads camera)
B.at(4.62); B.line([[3250, 470], [3420, 560], [3480, 760], [3420, 900]], { col: ORANGE, speed: SPEED * 1.4 }); B.line([[3392, 868], [3420, 902], [3452, 872]], { col: ORANGE, smooth: false });
const END2 = B.cur;

// ===== Third region (camera smoothly tracks diagonally 5.1→6.05; hand enters and draws at 5.8) =====
B.at(5.35);
// VideoScribe reveal: complete line art underneath, pen follows 8 zigzag rows downward, revealing beneath tip (tip always on reveal front)
const huashu = () => { const [x, y] = L3(500, 1010); return HUASHU.build({ x, y, s: 0.95 * K3, face: 1, pose: HUASHU.pose('point', 0, { ua1: 1.25, mouth: 0.8 }) }); };
const rigZig = (HSb) => { if (rigZig.c) return rigZig.c; const js = Object.values(HSb.J).filter(v => Array.isArray(v)); const xs = js.map(v => v[0]), ys = js.map(v => v[1]);
  const x0 = Math.min(...xs) - 70, x1 = Math.max(...xs) + 50, y0 = Math.min(...ys) - 20, y1 = Math.max(...ys) + 40, rows = 8;
  rigZig.rowH = (y1 - y0) / rows; const zz = DG.zigzag(x0, y0, x1 - x0, y1 - y0, rows); return (rigZig.c = { zz, cum: DG.cum(zz) }); };
const RIG3 = { t0: B.cur, t1: B.cur + 0.7 };
B.push({ kind: 'custom', t0: RIG3.t0, t1: RIG3.t1,
  draw(g, q, ft) {
    const HSb = huashu(), { zz, cum } = rigZig(HSb), d = cum[cum.length - 1] * q;
    g.save(); if (q < 1) g.clip(DG.revealMask(zz, cum, d, rigZig.rowH * 2.2)); g.lineJoin = 'round'; g.lineCap = 'round';   // Remove clip after reveal: zigzag corners miss triangles
    const [fx, fy] = L3(500, 1010);
    if (!HERO.y3(g, fx, fy, 0.95 * K3 * 740, ft)) {
      for (const p of HSb.parts) { g.fillStyle = p.role === 'hair' ? INK : BOARD; g.fill(p.path); g.strokeStyle = INK; g.lineWidth = LW * 0.9; g.stroke(p.path); }
      HUASHU.details(g, HSb, { line: INK, lw: 4.5, glass: INK, cheek: null, earLine: 'rgba(0,0,0,.5)', shoeHole: INK });
    }
    g.restore();
    return q < 1 ? DG.pointAt(zz, cum, d) : null;
  },
  start() { return rigZig(huashu()).zz[0]; }, end() { const z = rigZig(huashu()).zz; return z[z.length - 1]; } });
B.at(RIG3.t1 + 0.03);
catStrokes(...L3(1150, 900), K3 * 0.95, SPEED * 1.6, LW, false);
B.line([L3(1000, 330), L3(1070, 400), L3(1240, 200)], { col: ORANGE, w: LW + 2, speed: SPEED * 1.5, smooth: false });
B.pop('是猫！', ...L3(1500, 410), 150 * K3, { col: ORANGE, align: 'left' });
// Ending: circle “是猫！” while pulling back; when wide shot stops, return to first region and underline question — connect question to answer, pen rests on final stroke
B.at(Math.max(B.cur + 0.02, 6.95));
B.line(DG.ellipsePts(...L3(1720, 360), 300 * K3, 120 * K3, -2.9, 1.08, 40), { col: ORANGE, w: LW, speed: SPEED * 1.1 });
B.at(Math.max(B.cur + 0.06, 7.52));
B.line([[640, 1000], [960, 1006], [1290, 998]], { col: ORANGE, w: LW + 2, speed: SPEED * 0.9 });
const END3 = B.cur;
Y3.timeline = { END1, END2, END3, RIG3 };
Y3.board = B;

// ---------- Camera ----------
const OVER = { x: 2400, y: 930, z: 0.45 };
const camAt = ft => CAM.at([
  { t: 0, x: R1[0], y: R1[1], z: 1.0 },
  { t: 2.5, x: R1[0] + 12, y: R1[1] + 6, z: 1.02, ease: MO.sineInOut },
  // Whip: 0.8s (RSA measured distant jumps about 0.8s, with blur)
  { t: 3.3, x: R2[0], y: R2[1], z: 1.0, ease: MO.cubicInOut },
  { t: 4.7, x: R2[0] + 16, y: R2[1] + 6, z: 1.02, ease: MO.sineInOut },
  // Smooth board move: easeInOutSine 0.9s (measured median 1.8s, compressed for demo)
  { t: 5.6, x: R3[0], y: R3[1] - 20, z: 1.12, ease: MO.sineInOut },
  { t: 6.85, x: R3[0] + 10, y: R3[1] - 14, z: 1.14, ease: MO.sineInOut },
  // Pull back to whole board, hold 0.5s
  { t: 7.5, ...OVER, ease: MO.sineInOut },
  { t: 8.0, ...OVER, z: OVER.z * 0.985, ease: MO.sineInOut },
], ft);
Y3.camAt = camAt;

// ---------- Draw ----------
const drawBoard = (c, cam, ft) => {
  // Final gray wash over entire board (RSA measurement), fades in over 0.5s during pullback
  const gray = MO.sineInOut(seg(ft, 6.9, 7.4));
  c.fillStyle = gray > 0 ? PAINT.rgb(PAINT.mix(PAINT.hex(BOARD), [238, 238, 236], gray)) : BOARD; c.fillRect(0, 0, W, H);
  // Very faint erasure marks: screen-space tiling follows camera translation (does not enlarge with zoom)
  const sm = PAINT.cached('y3smudge', 1024, 1024, g => { const r = rng(5); for (let i = 0; i < 22; i++) { g.fillStyle = `rgba(120,120,130,${0.003 + r() * 0.005})`; g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 80 + r() * 200, 14 + r() * 40, r() * 3, 0, 7); g.fill(); } });
  c.save(); const ox = -(((cam.x * cam.z) % 1024) + 1024) % 1024, oy = -(((cam.y * cam.z) % 1024) + 1024) % 1024; c.translate(ox, oy); c.fillStyle = c.createPattern(sm, 'repeat'); c.fillRect(0, 0, W + 1024, H + 1024); c.restore();
  c.save(); CAM.apply(c, cam);
  const r = B.draw(c, ft);
  c.restore();
  return r;
};
const shot = (c, lt, t) => {
  const ft = t - F0, cam = camAt(ft);
  const buf = PAINT.scratch('yt_y3board'), g = buf.getContext('2d'); g.reset();
  const { tip, col } = drawBoard(g, cam, ft);
  const [vx, vy] = CAM.velocity(camAt, ft);
  c.fillStyle = BOARD; c.fillRect(0, 0, W, H);
  const whip = ft > 2.5 && ft < 3.3;                    // Only whip has blur; smooth board movement and final pullback stay sharp (RSA measurement)
  CAM.motionBlur(c, buf, whip ? vx * 0.8 : 0, whip ? vy * 0.8 : 0, 9);
  const [hx, hy] = B.penAt(ft, cam, tip);
  DG.pen(c, hx, hy, col || B.penColor(ft), Math.sin(ft * 7) * 0.03);   // Only one marker, tail cap = ink color
};
Y3.shot1 = shot; Y3.shot2 = shot; Y3.shot3 = shot;
SCENES['y3_s1'] = { draw: shot };
SCENES['y3_s2'] = { draw: shot };
SCENES['y3_s3'] = { draw: shot };
})();
