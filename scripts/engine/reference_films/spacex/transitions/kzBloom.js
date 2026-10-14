// Kurzgesagt kzBloom fills screen with light: warm glow (#F9EF93 core) grows from (o.cx, o.cy), covers screen white in first half, retreats in second; new world settles from 1.1 scale to 1.
//   Kurzgesagt transition 4: use in-scene light source for white field, about 0.5s; enter Kurzgesagt from other styles: light retreats to reveal luminous world on deep indigo.
TRANSITIONS.kzBloom = (c, A, B, p, o) => {
  const W = o.W || 1920, H = o.H || 1080, cx = o.cx ?? W / 2, cy = o.cy ?? H / 2, k = o.peak ?? 0.48;
  const veil = (a) => { if (a <= 0) return; c.save(); c.globalAlpha = Math.min(1, a); c.fillStyle = '#FFF8DC'; c.fillRect(0, 0, W, H); c.restore(); };
  if (p < k) {
    const q = p / k, s = 1 + 0.06 * q * q;
    c.save(); c.translate(cx, cy); c.scale(s, s); c.translate(-cx, -cy); c.drawImage(A, 0, 0); c.restore();
    const r = 40 + Math.pow(q, 2.1) * 2500;
    const g = c.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, 'rgba(255,253,240,0.85)'); g.addColorStop(0.3, 'rgba(249,239,147,0.7)'); g.addColorStop(0.62, 'rgba(250,204,18,0.55)'); g.addColorStop(1, 'rgba(244,131,1,0)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    veil(MO.smooth(Math.max(0, (q - 0.55) / 0.45)) * 0.5);   // White-field cap 0.95→0.5: both adjacent scenes are dark, so full-screen white flash is too harsh
  } else {
    const q = (p - k) / (1 - k), e = MO.k75(q), s = 1.1 - 0.1 * e;
    c.save(); c.translate(cx, cy); c.scale(s, s); c.translate(-cx, -cy); c.drawImage(B, 0, 0); c.restore();
    const r = 2600 * (1 - e) + 60;
    const g = c.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `rgba(255,253,240,${0.9 * (1 - e)})`); g.addColorStop(0.5, `rgba(249,239,147,${0.6 * (1 - e)})`); g.addColorStop(1, 'rgba(250,204,18,0)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    veil(Math.pow(1 - q, 2.2) * 0.5);
  }
};
