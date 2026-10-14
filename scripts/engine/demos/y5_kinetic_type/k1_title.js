// K1 title: “AI 写代码” slams in over two beats → “的 3 个阶段” lands on third → other words exit quickly on fourth, only “3” remains, camera dives into its circle.
// Slow entrance (0.3–0.4s spring), fast exit (0.18s expoIn) — exit faster because viewer attention has moved on.
(() => {
const K = KT, C = K.C, b = K.b;
const { clamp, lerp } = U;
// Exit: from t0 over 0.18s, shrink to 0.6, drop 60px, fade
const exitK = (t, t0) => MO.expoIn(clamp((t - t0) / 0.18));
SCENES['k1_title'] = {
  draw(c, lt, t) {
    c.fillStyle = C.yellow; c.fillRect(0, 0, 1920, 1080);
    K.dots(c, t, C.ink, 0.08);
    K.cam(c, t, c => {
      // First row: AI ｜ 写代码
      const s1 = 300, wAI = TY.width(c, 'AI', s1), wCode = TY.width(c, '写代码', s1), gap = 50, x0 = 960 - (wAI + gap + wCode) / 2, y1 = 470;
      const ex = [exitK(t, 1.45), exitK(t, 1.48), exitK(t, 1.51), exitK(t, 1.54)];
      // AI: slams in on beat 0, rotates −8° → 0°
      if (t >= 0) { const k = MO.springHz(t, 2.2, 10), e = ex[0];
        TY.text(c, 'AI', x0, y1 + 60 * e, { size: s1, align: 'left', color: C.ink, scale: lerp(1.7, 1, k) * (1 - 0.4 * e), rot: -0.14 * (1 - k), alpha: clamp(t / 0.06) * (1 - e), ox: x0 + wAI / 2, oy: y1 - s1 * 0.36 }); }
      // “写代码”: rises from slot mask on beat 1, 0.35s expoOut
      { const e = ex[1]; c.save(); c.globalAlpha = 1 - e; c.translate(0, 60 * e);
        TY.rise(c, '写代码', x0 + wAI + gap, y1, MO.at(t, b(1), 0.35), { size: s1, color: C.ink }); c.restore(); }
      // Second row: 的 ｜ (3) ｜ 个阶段     center (960, 773) — transition dives here
      const cy = 773, r = 165;
      const pc = MO.at(t, b(2), 0.42);
      if (pc > 0) {
        const k = MO.backOut(pc, 3.0) * (t > b(3) ? 1 + 0.12 * MO.expoOut(clamp((t - b(3)) / 0.2)) : 1);
        c.save(); c.translate(960, cy); c.scale(k, k); c.rotate(0.25 * (1 - MO.expoOut(pc)));
        c.fillStyle = C.coral; c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
        TY.text(c, '3', 0, 92, { size: 270, color: C.white });
        c.restore();
      }
      { const e = ex[2]; TY.text(c, '的', 960 - r - 40, cy + 40 + 60 * e, { size: 120, fam: 'PuHui-Heavy', align: 'right', color: C.ink, alpha: MO.at(t, b(1.75), 0.08) * (1 - e) }); }
      { const e = ex[3]; c.save(); c.globalAlpha = 1 - e; c.translate(0, 60 * e);
        TY.rise(c, '个阶段', 960 + r + 40, cy + 52, MO.at(t, b(2.25), 0.35), { size: 150, fam: 'PuHui-Heavy', color: C.ink }); c.restore(); }
    });
  },
};
})();
