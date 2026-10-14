// Card flip (S10 ukiyo-e → S11 presenter-led finance): preceding image recedes into paper card and flips around vertical axis,
// Back is ivory information page; card returns to full screen after flip. Perspective uses vertical slices: each scales height by depth (camera distance d), switches face after 90°.
// Parameters: o.bg revealed background during flip (default S11 ivory). p=0 matches old frame and p=1 matches new frame pixel for pixel.
(() => {
const W = 1920, H = 1080;
TRANSITIONS.cardFlip = (c, A, B, p, o) => {
  const e = MO.cubicInOut(U.clamp(p)), ang = e * Math.PI;
  const s = 1 - 0.24 * Math.sin(Math.PI * e);                 // Card recedes during flip
  const front = ang < Math.PI / 2, img = front ? A : B, a = front ? ang : ang - Math.PI;
  const cs = Math.cos(a), sn = Math.sin(a), d = 2600, N = 120, sw = W / N;
  c.fillStyle = o.bg || '#F7F0E1'; c.fillRect(0, 0, W, H);
  const proj = u => { const f = d / (d + u * sn); return [W / 2 + u * cs * f * s, f]; };
  const [xl, fl] = proj(-W / 2), [xr, fr] = proj(W / 2);
  const k = Math.sin(Math.PI * e);                            // Card edge and shadow appear only during flip
  if (k < 0.002) { c.drawImage(img, 0, 0); return; }         // Do not slice endpoints, avoiding resampling blur
  if (k > 0.001) {                                         // Soft shadow on paper
    c.save(); c.globalAlpha = 0.16 * k; c.fillStyle = '#2B2A33';
    c.beginPath(); c.moveTo(xl + 14, H / 2 - H * fl * s / 2 + 22); c.lineTo(xr + 14, H / 2 - H * fr * s / 2 + 22);
    c.lineTo(xr + 14, H / 2 + H * fr * s / 2 + 22); c.lineTo(xl + 14, H / 2 + H * fl * s / 2 + 22); c.closePath(); c.fill(); c.restore();
  }
  for (let i = 0; i < N; i++) {
    const [x0, f0] = proj(-W / 2 + i * sw), [x1, f1] = proj(-W / 2 + (i + 1) * sw);
    const h = H * (f0 + f1) / 2 * s, lo = Math.min(x0, x1), w = Math.abs(x1 - x0) + 0.8;
    if (w < 0.85) continue;
    c.drawImage(img, i * sw, 0, sw, H, lo, H / 2 - h / 2, w, h);
  }
  if (k > 0.001) {                                            // Card outline (dark flat-infographic stroke)
    c.save(); c.globalAlpha = k; c.strokeStyle = '#2B2A33'; c.lineWidth = 5; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(xl, H / 2 - H * fl * s / 2); c.lineTo(xr, H / 2 - H * fr * s / 2);
    c.lineTo(xr, H / 2 + H * fr * s / 2); c.lineTo(xl, H / 2 + H * fl * s / 2); c.closePath(); c.stroke(); c.restore();
  }
};
})();
