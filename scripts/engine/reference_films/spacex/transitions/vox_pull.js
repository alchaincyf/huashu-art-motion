// Vox collage desk (vox film) paper pull: preceding shot tilts and slides away like paper, revealing next shot underneath (12fps steps).
TRANSITIONS.vox_pull = (c, A, B, p, o) => {
  const n = Math.max(1, Math.round(o.dur * 12)), q = Math.floor(p * n + 1e-6) / n, e = MO.cubicIn(q), W = o.W, H = o.H;
  c.drawImage(B, 0, 0);
  c.save(); c.translate(W / 2 - e * W * 1.12, H / 2 - e * 90); c.rotate(-e * 0.14);
  c.shadowColor = 'rgba(40,30,20,.45)'; c.shadowBlur = 10 + 30 * e; c.shadowOffsetX = 12; c.shadowOffsetY = 18; c.drawImage(A, -W / 2, -H / 2); c.restore();
};
