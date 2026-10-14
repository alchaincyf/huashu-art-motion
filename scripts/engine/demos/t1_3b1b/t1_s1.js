// t1 ·3b1b: how one neural-network layer turns pixels into 'cat'
// Shot1 (2.6s):10×10 cat image appears cellwise → brightness labels →100 pixels Transform into input column (16 visible +⋮)
// Also contains shared data/layout for all three t1 shots (window.T1), used directly by following shots.
(() => {
const { clamp, lerp, hash } = U;
const C = DG.MANIM;

// ---------- Shared data ----------
const CAT = [
  '0000000000',
  '0600000060',
  '0870000780',
  '0899999980',
  '0929999290',
  '0999999990',
  '0999449990',
  '0099999900',
  '0007887000',
  '0000000000'];
const PIX = []; for (let r = 0; r < 10; r++) for (let q = 0; q < 10; q++) { const d = +CAT[r][q]; PIX.push(d ? clamp(d / 10 + (hash(r, q) - 0.5) * 0.08, 0, 1) : 0); }
// Cat-neuron weights: positive inside cat (blue), negative ring outside (red), negative eyes (cat's eyes are dark)
const WTS = PIX.map((v, i) => {
  const r = (i / 10) | 0, q = i % 10;
  if (+CAT[r][q] === 2) return -0.55;
  if (v > 0.5) return 0.55 + 0.4 * hash(q, r + 7);
  let near = false; for (let dr = -1; dr <= 1; dr++) for (let dq = -1; dq <= 1; dq++) { const rr = r + dr, qq = q + dq; if (rr >= 0 && rr < 10 && qq >= 0 && qq < 10 && PIX[rr * 10 + qq] > 0.5) near = true; }
  return near ? -0.6 - 0.3 * hash(r, q + 3) : -0.12 * hash(q, r);
});

// ---------- Layout (screen px;1 manim unit=135px) ----------
const GRID = { cx: 960, cy: 545, cell: 52 };
const cellXY = i => [GRID.cx + ((i % 10) - 4.5) * GRID.cell, GRID.cy + (((i / 10) | 0) - 4.5) * GRID.cell];
const IN_X = 330, IN_R = 17;
const VIS = Array.from({ length: 16 }, (_, k) => Math.round(k * 99 / 15));           //16 visible inputs
const inY = j => 540 + (j - 7.5) * 44 + (j >= 8 ? 30 : -30);
const HID_X = 900, HID_R = 22, HID_N = 10, hidY = j => 540 + (j - 4.5) * 70;
const OUT_X = 1470, OUT_R = 32, OUT = [{ y: 400, name: '猫', a: 0.92 }, { y: 540, name: '狗', a: 0.07 }, { y: 680, name: '鸟', a: 0.03 }];
const HID_A = [0.82, 0.12, 0.95, 0.3, 0.64, 0.06, 0.71, 0.22, 0.88, 0.41];
const W1 = (j, k) => Math.sin(j * 12.9898 + k * 78.233) * 0.5 + (hash(j, k + 11) - 0.5) * 1.1;   // Input→hidden
const W2 = (k, o) => [[0.9, -0.5, 0.95, -0.2, 0.7, -0.8, 0.85, -0.3, 0.8, 0.1], [-0.6, 0.4, -0.7, 0.5, -0.2, 0.6, -0.5, 0.3, -0.4, 0.2], [-0.3, 0.2, -0.5, 0.6, -0.6, 0.4, -0.2, 0.7, -0.5, 0.3]][o][k];

// Input column (end of S1, entire S2)
const drawInputs = (c, a = 1) => {
  VIS.forEach((pi, j) => DG.neuron(c, IN_X, inY(j), IN_R, PIX[pi] * a, { sa: a }));
  c.save(); c.fillStyle = `rgba(255,255,255,${a})`; for (let d = -1; d <= 1; d++) { c.beginPath(); c.arc(IN_X, 540 + d * 16, 4, 0, Math.PI * 2); c.fill(); } c.restore();
};
const drawBrace = (c, p) => {
  DG.brace(c, IN_X - 34, inY(0) - IN_R, inY(15) + IN_R, { p: MO.smooth(p), lw: 3 });
  c.save(); c.translate(IN_X - 92, 540); c.rotate(-Math.PI / 2);
  DG.write(c, '100 个输入', 0, 0, 40, p, { align: 'center' }); c.restore();
};
window.T1 = { PIX, WTS, CAT, GRID, cellXY, IN_X, IN_R, VIS, inY, HID_X, HID_R, HID_N, hidY, OUT_X, OUT_R, OUT, HID_A, W1, W2, drawInputs, drawBrace };

// ---------- Shot1 ----------
const DUR = 2.6;
SCENES['t1_s1'] = {
  draw(c, lt) {
    c.fillStyle = '#000'; c.fillRect(0, 0, 1920, 1080);
    // Camera: first1.4s very slow grid-centered push1→1.025; smooth return to1 at Transform start (pixel match to shot2 first frame)
    const z = 1 + 0.025 * MO.smooth(MO.seg(lt, 0, 1.4)) * (1 - MO.smooth(MO.seg(lt, 1.4, 2.2)));
    c.save(); c.translate(960, 545); c.scale(z, z); c.translate(-960, -545);
    // Title: Write (linear,<15 characters in1 second)
    const out = MO.smooth(MO.seg(lt, 1.4, 1.9));                  // FadeOut(shift=UP)
    c.save(); c.globalAlpha = 1 - out; c.translate(0, -40 * out);
    DG.write(c, '一张 10×10 的「猫」', 960, 150, 58, MO.seg(lt, 0.1, 1.1));
    c.restore();

    const morph = MO.seg(lt, 1.45, 2.55);                          //100 child Transforms, LaggedStart0.01
    const appear = MO.seg(lt, 0.0, 0.9);
    const order = i => ((i % 10) + ((i / 10) | 0));                // Diagonal reveal, scan-like
    for (let i = 0; i < 100; i++) {
      const [x, y] = cellXY(i), v = PIX[i];
      const qa = MO.smooth(clamp(appear * 1.6 - order(i) / 18 * 0.6));
      if (qa <= 0) continue;
      const qm = MO.smooth(MO.lagged(i, 100, morph, 0.01));
      const j = VIS.indexOf(i), vis = j >= 0;
      // Invisible pixels fly to central⋮ and shrink to dots
      const tx = IN_X, ty = vis ? inY(j) : 540 + (((i * 7) % 3) - 1) * 16, tr = vis ? IN_R : 3;
      const s = GRID.cell * (0.92 + 0.08 * qa);
      const A = DG.rectPts(x, y, s, s, 48), B = DG.circlePts(tx, ty, tr, 48);
      const pts = qm > 0 ? DG.morph(A, B, qm) : A;
      const fadeHidden = vis ? 1 : 1 - clamp((qm - 0.6) / 0.4);
      if (qm >= 1) { if (vis) DG.neuron(c, tx, ty, IN_R, v); continue; }   // True circles after settling: pixel match to shot2 first frame (48-gon antialiasing differs from arc)
      c.save(); c.globalAlpha = qa * fadeHidden;
      DG.shape(c, pts, { fill: `rgba(255,255,255,${v})`, stroke: `rgba(255,255,255,${lerp(0.22, 1, qm)})`, lw: lerp(1, 2, qm) });
      c.restore();
      // Brightness labels (fade in from0.7s, fade out at Transform start)
      const na = clamp((lt - 0.7) / 0.3) * (1 - clamp((lt - 1.35) / 0.2));
      if (na > 0) { c.save(); c.globalAlpha = na; c.font = `20px "${DG.FONT.rm}"`; c.textAlign = 'center'; c.fillStyle = v > 0.55 ? '#000' : C.GREY_B; c.fillText(v.toFixed(1), x, y + 7); c.restore(); }
    }
    // Bottom explanation: FadeIn(shift=UP), fades with title
    const la = MO.smooth(MO.seg(lt, 0.55, 1.15)) * (1 - out);
    if (la > 0) { c.save(); c.globalAlpha = la; c.font = `600 38px "${DG.FONT.zh}"`; c.textAlign = 'center'; c.fillStyle = C.GREY_A; c.fillText('每个像素 = 一个 0 到 1 之间的数', 960, 905 + 24 * (1 - la)); c.restore(); }
    //⋮ and brace
    const dots = MO.smooth(MO.seg(lt, 2.25, 2.55));
    if (dots > 0) { c.save(); c.fillStyle = '#fff'; c.globalAlpha = dots; for (let d = -1; d <= 1; d++) { c.beginPath(); c.arc(IN_X, 540 + d * 16, 4, 0, Math.PI * 2); c.fill(); } c.restore(); }
    T1.drawBrace(c, MO.seg(lt, 1.95, 2.6));
    c.restore();
  },
};
})();
