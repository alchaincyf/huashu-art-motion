// t2 · shot 2 (3.0s): three frosted-glass feature cards enter 3D space (spring, bounce 0.15, stagger 0.1s), rotate frontward about Y;
// card numbers count up; group floats continuously; light sweeps all three; finally middle card is selected (enlarges, others recede/dim), leading into shared-element expansion.
(() => {
const { clamp, lerp } = U;
const W = 1920, H = 1080;
const CW = 480, CH_ = 580, GAP = 52, CY = 560, R = 36;
const CARDS = [
  { icon: 'wave', title: '实时语音', desc: '像打电话一样自然地打断和追问', num: 320, dec: 0, unit: 'ms', label: '端到端延迟' },
  { icon: 'memory', title: '长期记忆', desc: '记得你说过的每一个偏好', num: 100, dec: 0, unit: '万', label: 'tokens 上下文' },
  { icon: 'agent', title: '自主执行', desc: '拆解任务、调用工具、交付结果', num: 87, dec: 0, unit: '%', label: '任务一次完成率' },
];
const DUR = 3.0, FOCUS = 2.15;                         // Middle card selected from 2.15s
// Card state at lt (screen center, rotation, scale, opacity); transition also needs middle card's final rectangle
const state = (i, lt, t) => {
  const t0 = 0.05 + i * 0.1;                           // Stagger 0.1s
  const sp = MO.spring(lt - t0, { duration: 0.75, bounce: 0.15 });
  const f = MO.smooth(MO.seg(lt, FOCUS, FOCUS + 0.6));
  const floatAmp = lerp(1, i === 1 ? 0 : 0.6, f);      // Selected card stops floating so transition expands from stable rectangle
  const cx = 960 + (i - 1) * (CW + GAP) + (i - 1) * 40 * f;
  const cy = CY + (1 - sp) * 170 + MO.float(t, 7, 3.4 + i * 0.45, i * 2) * floatAmp;
  const ry = (1 - sp) * (i - 1 || 0.001) * -0.55 + 0.06 * Math.sin(t * 0.9 + i) * floatAmp + (i - 1) * 0.12 * f;
  const sc = (0.9 + 0.1 * sp) * (i === 1 ? lerp(1, 1.06, f) : lerp(1, 0.94, f));
  const a = clamp((lt - t0) / 0.25) * (i === 1 ? 1 : lerp(1, 0.45, f));
  return { cx, cy, ry, sc, a, t0 };
};
const cardRectAt = (lt, t) => { const s = state(1, lt, t); return { x: s.cx - CW * s.sc / 2, y: s.cy - CH_ * s.sc / 2, w: CW * s.sc, h: CH_ * s.sc }; };

SCENES['t2_s2'] = {
  cardRectAt, CW, CH: CH_,
  draw(c, lt, t) {
    t += T2.PHASE;
    const bgc = UI.scratch('t2bg', W, H), bgx = bgc.getContext('2d');
    T2.bg(bgx, t); c.drawImage(bgc, 0, 0);
    const bd = UI.backdrop(bgc, { blur: 40, key: 't2bd' });
    // Draw side cards before middle (middle on top)
    [0, 2, 1].forEach(i => {
      const S = state(i, lt, t); if (S.a <= 0) return;
      const d = CARDS[i], cw = CW * S.sc, ch = CH_ * S.sc;
      // Card texture: frosted glass (sample background at card screen position), content
      const tex = UI.scratch('t2card' + i, CW + 120, CH_ + 120), g = tex.getContext('2d'); g.reset();
      const ox = 60, oy = 60;
      UI.glass(g, { x: ox, y: oy, w: CW, h: CH_, r: R, bd, sample: { x: S.cx - cw / 2, y: S.cy - ch / 2, w: cw, h: ch }, tint: 0.075, stroke: 0.2, light: 0.14, shadow: false });
      g.save(); g.translate(ox, oy);
      // Icon backing: concentric corners (child radius = parent radius − padding)
      const pad = 44; g.fillStyle = 'rgba(255,255,255,0.09)'; g.beginPath(); g.roundRect(pad, pad, 96, 96, R - 14); g.fill();
      UI.icon(g, d.icon, pad + 48, pad + 48, 60, '#f2f2f7', t);
      g.textBaseline = 'alphabetic'; g.textAlign = 'left';
      g.font = `600 50px ${T2.ZH}`; g.fillStyle = '#f5f5f7'; g.fillText(d.title, pad, 230);
      g.font = `400 28px ${T2.ZH}`; g.fillStyle = 'rgba(235,235,245,0.62)'; g.fillText(d.desc, pad, 278);
      // Divider
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(pad, 330, CW - pad * 2, 1.5);
      // Large number: count for 0.9s starting 0.25s after card settles (easeOutExpo, final digit settles slowly), tabular layout avoids jitter
      const v = TY.count(lt, S.t0 + 0.35, 0.9, 0, d.num);
      g.font = `600 132px ${T2.SANS}`; T2.track(g, 132, -0.03); g.fillStyle = '#ffffff';
      const nw = TY.tabular(g, TY.fmt(v, d.dec), pad, 488);
      g.letterSpacing = '0px'; g.font = `500 52px ${T2.SANS}`; g.fillStyle = 'rgba(235,235,245,0.7)'; g.fillText(d.unit, pad + nw + 10, 488);
      g.font = `400 28px ${T2.ZH}`; g.fillStyle = 'rgba(235,235,245,0.55)'; g.fillText(d.label, pad, 535);
      g.restore();
      // Light sweep: left to right across group at 1.2–2.0s (progress from each card's screen position creates one continuous light)
      const sp = MO.seg(lt, 1.15, 2.05), gx = lerp(-200, W + 200, sp), lx = (gx - (S.cx - cw / 2)) / cw;
      if (sp > 0 && sp < 1) UI.sheen(g, UI.rrPath(ox, oy, CW, CH_, R), clamp((lx + 0.35) / 1.7), { x0: ox, x1: ox + CW, width: 110, angle: -0.35, alpha: 0.22 });
      // Shadow (screen-projected dimensions) and perspective texture
      c.save(); c.globalAlpha = S.a;
      UI.shadow(c, S.cx - cw / 2 + 10, S.cy - ch / 2 + 20, cw - 20, ch - 20, R, { blur: 80, oy: 40, alpha: 0.55 });
      UI.persp(c, tex, { cx: S.cx, cy: S.cy, w: (CW + 120) * S.sc, h: (CH_ + 120) * S.sc, ry: S.ry, persp: 1800, strip: 3, shade: 0.4 });
      c.restore();
    });
  },
};
})();
