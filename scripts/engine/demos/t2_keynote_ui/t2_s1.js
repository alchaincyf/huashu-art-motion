// t2 · keynote style: “An AI product launch: three feature cards”
// Shot 1 (2.6s): soft light patches drift over dark background; eyebrow → product name (blur→sharp, upward motion, gradient lettering, light sweep) → one-line subtitle. Extremely slow camera push.
// This file also contains t2 shared resources (window.T2): light-patch background, fonts, colors.
(() => {
const { clamp, lerp } = U;
const W = 1920, H = 1080;
const BASE = '#050508';
const BLOBS = [                                                   // Stripe-like purple/blue/cyan hues with a little warmth; avoid 5s periods (HIG: avoid sustained ~0.2Hz oscillation)
  { x: 430, y: 300, r: 760, col: [150, 90, 238], a: 0.75, ax: 220, ay: 120, period: 11, ph: 0 },
  { x: 1520, y: 260, r: 700, col: [56, 104, 255], a: 0.7, ax: 200, ay: 160, period: 13, ph: 2.1 },
  { x: 1320, y: 930, r: 560, col: [120, 214, 255], a: 0.5, ax: 260, ay: 100, period: 9.5, ph: 4 },
  { x: 520, y: 960, r: 520, col: [255, 96, 84], a: 0.42, ax: 180, ay: 90, period: 12, ph: 1.3 },
];
const SANS = '"Inter", "NotoSansSC"', ZH = '"NotoSansSC"';
// Light-patch background depends only on film time t, seamless across three shots (no background jump on cuts)
const bg = (c, t, { dim = 0.38 } = {}) => {
  UI.mesh(c, t, { base: BASE, blobs: BLOBS, blur: 90, scale: 0.25, grain: 0.035, key: 't2mesh' });
  // Darken center slightly for white-text contrast
  const g = c.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 1000); g.addColorStop(0, `rgba(0,0,0,${dim})`); g.addColorStop(1, 'rgba(0,0,0,0.1)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
};
// Large text: tight −0.02em tracking (Apple/Linear sites use −0.015–−0.03em above 64px)
const track = (c, size, em = -0.02) => { c.letterSpacing = (size * em).toFixed(2) + 'px'; };
// Light drift, card float, icon pulses all use film time t. PHASE retains the experiment's 8–16s timeline phase and approved composition (remove or change for a new topic)
const PHASE = 8;
window.T2 = { bg, SANS, ZH, track, BASE, PHASE };

const DUR = 2.6;
SCENES['t2_s1'] = {
  draw(c, lt, t) {
    t += T2.PHASE;
    bg(c, t);
    // Constant slow push: 1.0 → 1.045 (linear throughout shot; keynote pushes do not decelerate, stopping would make image feel dead)
    const s = lerp(1, 1.045, lt / (DUR + 0.55));
    c.save(); c.translate(W / 2, H / 2); c.scale(s, s); c.translate(-W / 2, -H / 2);
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    // Eyebrow
    c.font = `500 34px ${ZH}`; c.fillStyle = '#a7a7b4'; c.letterSpacing = '6px';
    TY.blurIn(c, '全 新 发 布', W / 2, 372, MO.appleOut(MO.seg(lt, 0.1, 0.8)), { blur: 10, dy: 16 });
    // Product name: gradient text offscreen → light sweep (source-atop lights text only) → composite blur→sharp
    const p = MO.appleOut(MO.seg(lt, 0.3, 1.3));
    if (p > 0) {
      const tx = UI.scratch('t2title', W, 420), g = tx.getContext('2d'); g.reset();
      g.font = `600 220px ${SANS}`; track(g, 220); g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      const gr = g.createLinearGradient(600, 0, 1320, 0); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.55, '#ddd2ff'); gr.addColorStop(1, '#a8dcff');
      g.fillStyle = gr; g.fillText('Plover 2', W / 2, 300);
      UI.sheen(g, null, MO.seg(lt, 1.25, 2.15), { x0: 560, x1: 1360, width: 140, angle: -0.38, alpha: 0.85, comp: 'source-atop' });
      c.save(); c.globalAlpha = clamp(p * 1.5); const b = (1 - p) * 26; if (b > 0.3) c.filter = `blur(${b.toFixed(1)}px)`;
      c.drawImage(tx, 0, 620 - 300 + (1 - p) * 40); c.restore();               // Texture baseline y=300 → screen y=620
    }
    // Subtitle
    c.font = `400 50px ${ZH}`; c.fillStyle = '#c9c9d4'; c.letterSpacing = '1px';
    TY.blurIn(c, '会思考、会记忆、会动手的 AI 助手', W / 2, 740, MO.appleOut(MO.seg(lt, 0.7, 1.6)), { blur: 12, dy: 22 });
    c.restore();
  },
};
})();
