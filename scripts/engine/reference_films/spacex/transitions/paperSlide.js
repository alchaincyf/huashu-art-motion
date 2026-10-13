// paperSlide: whiteboard paper slides in from right over previous page (left-edge shadow, gently straightening 1.2° tilt); paper settling begins whiteboard segment.
// For color-block page → hand-drawn whiteboard: white paper is whiteboard's signature, so transition is paper itself entering. Reveal point ≈ p 0.6 (90% covered).
(() => {
const { clamp } = U;
TRANSITIONS.paperSlide = (c, A, B, p, o) => {
  const W = o.W, H = o.H, e = MO.cubicInOut(clamp(p)), x = W * (1 - e) * 1.03, rot = 0.021 * (1 - e);
  c.drawImage(A, 0, 0);
  c.fillStyle = `rgba(0,0,0,${0.18 * e})`; c.fillRect(0, 0, W, H);                // Slightly darken old page before paper covers it
  c.save(); c.translate(x, 0); c.rotate(rot);
  const g = c.createLinearGradient(-60, 0, 0, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.28)');
  c.fillStyle = g; c.fillRect(-60, -40, 60, H + 80);                                   // Paper's left-edge shadow
  c.drawImage(B, 0, 0); c.fillStyle = '#FBFBFB'; c.fillRect(0, H, W, 80); c.fillRect(0, -80, W, 80);   // Extend top/bottom paper edges during tilt
  c.restore();
};
})();
