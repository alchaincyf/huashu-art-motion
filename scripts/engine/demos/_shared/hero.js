// Huashu in the y1/y2/y3 demos. window.HERO_MODE = 'C' (default) | 'A' | 'rig'.
//   C Native to each film (used in demos): gpt-image character sheet per style (Kurzgesagt flat without outlines / Vox reuses that sheet in grayscale as a clipping sticker /
//     whiteboard marker line art), stored in demos/_shared/hero/. Explicit exception to the code-drawn approach: character is an image, everything else is code.
//   A Minimal geometry: code-drawn chibi (large round head + white bucket hat + round glasses), colored/outlined per film. Use when images are unwanted.
//   rig Old skeleton: FK character in lib/rig_huashu.js (fallback branches in each film).
// (Experimental direction B, 'G2 picture-book frame library', required 24 frames and was not included in the skill.)
(() => {
const { clamp, lerp } = U;
const H = window.HERO = {};
const MODE = () => window.HERO_MODE || 'C';
H.mode = MODE;
const PNG = n => `demos/_shared/hero/${n}.png`;
window.EXTRA_ASSETS = (window.EXTRA_ASSETS || []).concat(['c1_0', 'c1_1', 'c1_2', 'c3_line'].map(PNG));
const img = p => window.IMG[p];

// Place an image at (x, y), anchored at bottom-center of feet, height h; face=-1 flips horizontally
const place = (c, im, x, y, h, face = 1, anchorY = 0.97) => {
  const w = im.width * h / im.height; c.save(); c.translate(x, y); if (face < 0) c.scale(-1, 1); c.drawImage(im, -w / 2, -h * anchorY, w, h); c.restore();
};

// ---------- A: minimal geometric chibi ----------
// Origin = ground between feet; unit height 1 ≈ full height; opt.style: 'flat' (no outline, darker same-color shadows) | 'line' (black on white) | 'print' (flat fill + thin black outline)
H.geo = (c, x, y, h, { face = 1, t = 0, style = 'flat', point = true, ink = '#1d1b19' } = {}) => {
  const s = h / 100; c.save(); c.translate(x, y); c.scale(face * s, s);
  const bob = Math.sin(t * 6.5) * 0.8;
  const line = style !== 'flat', lw = style === 'line' ? 2.2 : 1.4;
  const P = { skin: '#ffd8bd', skinSh: '#f2b493', hat: '#ffffff', hatSh: '#dfe3ef', tee: '#ffffff', teeSh: '#e3e6f0', shorts: '#d8c7a6', shortsSh: '#bfa982', shoe: '#ffffff', hair: '#1f1b2e', glass: '#1f1b2e', cheek: 'rgba(255,128,120,.45)' };
  if (style === 'line') Object.assign(P, { skin: '#fbfbf8', skinSh: '#fbfbf8', hatSh: '#fbfbf8', tee: '#fbfbf8', teeSh: '#fbfbf8', shorts: '#fbfbf8', shortsSh: '#fbfbf8', cheek: 'rgba(239,114,38,.35)' });
  // Flat facets: lay darker color, then offset base color upper-left by 2.5 units, leaving lower-right shadow strip (same as Y1 flat)
  const shape = (path, fill, sh) => { if (sh && sh !== fill) { c.save(); c.clip(path); c.fillStyle = sh; c.fill(path); c.translate(-2.5, -2); c.fillStyle = fill; c.fill(path); c.restore(); } else { c.fillStyle = fill; c.fill(path); } if (line) { c.strokeStyle = ink; c.lineWidth = lw; c.stroke(path); } };
  const rr = (x0, y0, w, hh, r) => { const p = new Path2D(); p.roundRect(x0, y0, w, hh, r); return p; };
  const el = (cx, cy, rx, ry) => { const p = new Path2D(); p.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); return p; };
  c.lineJoin = 'round'; c.lineCap = 'round';
  // Legs + clogs
  for (const lx of [-7, 7]) { shape(rr(lx - 3, -14, 6, 12, 3), P.skin, P.skinSh); shape(el(lx + 2.5, -2, 7.5, 4), P.shoe, P.hatSh); }
  c.fillStyle = ink; for (const lx of [-7, 7]) for (const [dx, dy] of [[-1, -3], [2, -3.5], [5, -2.5]]) { c.beginPath(); c.arc(lx + 2.5 + dx, -2 + dy + 1, 0.8, 0, 7); c.fill(); }
  c.translate(0, bob);
  shape(rr(-12, -26, 24, 13, 4), P.shorts, P.shortsSh);                      // Shorts
  // Far arm (hanging naturally, watch)
  shape(rr(-15, -42, 6, 16, 3), P.skin, P.skinSh); c.fillStyle = ink; c.fillRect(-15.5, -30, 7, 3);
  shape(rr(-14, -46, 28, 22, 7), P.tee, P.teeSh);                            // T-shirt
  // Near arm: pointing forward (point) or hanging
  if (point) { c.save(); c.translate(10, -42); c.rotate(-1.35 + Math.sin(t * 3.4) * 0.06); shape(rr(-3.2, 0, 6.4, 20, 3.2), P.skin, P.skinSh); shape(el(0, 21, 3.6, 3.6), P.skin); c.restore(); }
  else shape(rr(9, -42, 6, 16, 3), P.skin, P.skinSh);
  // Head: large round front-facing face (head/body ratio about 1:1.2). Easier to draw and recognize than profile: bangs below brim, two ears, centered round glasses
  c.translate(0, -66); c.rotate(Math.sin(t * 2.1) * 0.03);
  for (const ex of [-19, 19]) shape(el(ex, 4, 3.6, 4.6), P.skin, P.skinSh);   // Ears
  shape(el(0, 2, 19, 18.5), P.skin, P.skinSh);                               // Face
  const crown = new Path2D(); crown.moveTo(-17, -9); crown.bezierCurveTo(-17, -33, 17, -33, 17, -9); crown.closePath();
  const brim = new Path2D(); brim.ellipse(0, -9, 29, 7, 0, 0, Math.PI * 2);
  shape(brim, P.hat, P.hatSh); shape(crown, P.hat, P.hatSh);
  // Bangs + sideburns: draw after brim, black hair showing below it (without this row, he looks bald)
  c.fillStyle = P.hair; c.beginPath(); c.moveTo(-19.5, -4); c.lineTo(19.5, -4); c.lineTo(19, 5); c.lineTo(16.5, 1); c.lineTo(13, -0.5); c.lineTo(9, 1.5); c.lineTo(5, -1); c.lineTo(0, 1); c.lineTo(-5, -1.5); c.lineTo(-9, 1); c.lineTo(-13, -1); c.lineTo(-16.5, 1.5); c.lineTo(-19, 5); c.closePath(); c.fill();
  shape(brim, P.hat, P.hatSh);
  if (!line) { c.fillStyle = P.hatSh; c.beginPath(); c.ellipse(0, -9.5, 17, 2.2, 0, 0, Math.PI * 2); c.fill(); }   // Dark band between hat crown and brim (color block, not outline)
  // Round glasses + eyes (blink 0.12s/3.2s)
  const blink = (t % 3.2) > 3.08;
  c.strokeStyle = P.glass; c.lineWidth = 1.8; for (const ex of [-7.5, 7.5]) { c.beginPath(); c.arc(ex, 3, 6, 0, 7); c.stroke(); }
  c.beginPath(); c.moveTo(-1.5, 3); c.lineTo(1.5, 3); c.stroke();
  c.fillStyle = P.glass; for (const ex of [-7.5, 7.5]) { if (blink) c.fillRect(ex - 2.2, 3, 4.4, 1.1); else { c.beginPath(); c.ellipse(ex, 3.4, 1.8, 2.3, 0, 0, 7); c.fill(); } }
  c.fillStyle = P.cheek; for (const ex of [-11, 11]) { c.beginPath(); c.ellipse(ex, 10.5, 3.2, 1.9, 0, 0, 7); c.fill(); }
  const m = 0.4 + 0.6 * Math.max(0, Math.sin(t * 9));                       // Mouth: opens/closes while speaking
  c.fillStyle = '#c4473f'; c.beginPath(); c.ellipse(0, 12.5, 2.8, 0.9 + 1.7 * m, 0, 0, 7); c.fill();
  c.restore();
};

// ---------- Per-film integration ----------
// Y1 shot 3: Huashu stands left on grassy slope, pointing at black cat (feet (470,900), full height about 440px)
H.y1 = (g, ft, flatFn) => {
  const m = MODE();
  if (m === 'A') return H.geo(g, 470, 900, 440, { face: 1, t: ft, style: 'flat' });
  if (m === 'C') {
    // Three poses from one sheet become three keyframes: wave during pullout → point at black cat during scan → cheer after label pops in.
    // Pose change gets 0.12s squash/rebound (Kurzgesagt 108% pop overshoot); standing breath pivots around feet.
    const l = ft - Y1.SHOTS.s3[0], k = l < 1.25 ? 1 : l < 2.3 ? 0 : 2, t0 = [0, 1.25, 2.3][[1, 0, 2].indexOf(k)];
    const pop = l - t0 < 0.14 && t0 > 0 ? 1 + 0.06 * Math.sin((l - t0) / 0.14 * Math.PI) : 1;
    const br = 1 + 0.012 * Math.sin(ft * 5.2);
    g.save(); g.translate(470, 905); g.scale(1 / Math.sqrt(br * pop), br * pop); place(g, img(PNG('c1_' + k)), 0, 0, 450, 1); g.restore(); return;
  }
  return false;
};
// Y2 shot 3: cutout sticker drawn into sp (white border/shadow added later), feet (1500,1040), facing left
H.y2 = (g, st) => {
  const m = MODE();
  if (m === 'A') return H.geo(g, 1500, 1040, 560, { face: -1, t: st, style: 'print', ink: '#171716' }), true;
  if (m === 'C') { const k = Math.floor(st * 12); g.save(); g.translate(1500, 1015); g.rotate(((k * 7919) % 13 - 6) * 0.0012); g.filter = 'grayscale(1) contrast(1.25) brightness(1.04)'; place(g, img(PNG('c1_0')), 20, 8, 520, -1); g.restore(); return true; }   // Cartoon frames in grayscale as clipping stickers: slight jitter at 12fps (stop-motion feel)
  return false;
};
// Y3 shot 3: image revealed by zigzag strokes (world coordinates, feet (fx, fy), height hh)
H.y3 = (g, fx, fy, hh, ft) => {
  const m = MODE();
  if (m === 'A') return H.geo(g, fx, fy, hh, { face: 1, t: ft, style: 'line', ink: '#0A0503' }), true;
  if (m === 'C') { g.save(); g.globalCompositeOperation = 'multiply'; place(g, img(PNG('c3_line')), fx, fy + 4, hh * 1.08, 1); g.restore(); return true; }
  return false;
};
})();
