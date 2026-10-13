// Monet's Japanese Bridge: fixed-camera stone-skipping vignette. Used directly in direction B; direction C uses it as a living painting inside a frame.
// ACT.monet(c, lt, sc) draws a frame and returns hero state {x,y,h,key,i,hat}; sc = script parameters (see SCRIPTS).
(() => {
const W = 1920, H = 1080, TAU = Math.PI * 2;
const { clamp, lerp, ss } = U;
const X = window.XING, P = window.PAINT;
const ACT = window.ACT = {};
ACT.monetWorld = () => X.monetWorld({ key: 'fixed', x0: 0, w: 1920, waterTop: 520, bridge: { x0: -160, x1: 2080, yEnd: 690, lift: 210 }, pond: null, groundY: 700 });
const HERO_H = 330;

// Water lilies (code + Monet strokes, cached)
let LILY = null;
ACT.lily = (c, x, y, s, rot = 0) => {
  if (!LILY) { const cc = P.canvas(140, 100), q = cc.getContext('2d'); q.translate(70, 70);
    q.fillStyle = '#7aa85a'; q.beginPath(); q.ellipse(0, 10, 58, 16, 0, 0.4, TAU - 0.4); q.lineTo(0, 10); q.fill();
    for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.42; q.fillStyle = k % 2 ? '#f2a6bf' : '#f7c4d4'; q.save(); q.rotate(a + Math.PI / 2); q.beginPath(); q.ellipse(0, -22, 10, 24, 0, 0, TAU); q.fill(); q.restore(); }
    q.fillStyle = '#f6d86a'; q.beginPath(); q.arc(0, -4, 8, 0, TAU); q.fill();
    const out = P.canvas(140, 100), og = out.getContext('2d'); og.drawImage(cc, 0, 0); og.globalCompositeOperation = 'source-atop';
    X.strokes(og, cc, { cell: 4, len: 8, width: 3, seed: 91, alphaMask: true, alphaMin: 100, angle: (x, y, r) => Math.atan2(y - 66, x - 70) + Math.PI / 2 + (r() - 0.5) * 0.4, jitterCol: 22 });
    LILY = out; }
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); c.drawImage(LILY, -70, -80); c.restore();
};

// Stone-skipping storyboard (seconds relative to throw start T) — monet_throw 8 frames: 0 look at stone, 1 wind up, 2 swing, 3 release (stone in image), 4 follow through, 5 shade eyes, 6 cheer, 7 look up surprised
const THROW = [[0, 0], [0.22, 1], [0.48, 2], [0.56, 3], [0.66, 4], [0.9, 5]];
ACT.throwFrame = (u) => { let f = 0; for (const [tt, i] of THROW) if (u >= tt) f = i; return f; };
ACT.RELEASE = 0.66;                                   // Frame 3 ends; code-drawn stone takes over
// Stone position in frame 3 sprite (pixels, measured when slicing: 309–346 × 186–210), converted to screen coordinates
ACT.stoneFrom = (x, y, h) => { const s = h / 439.0; return [x + (327 - 132.5) * s, y + (198 - 420) * s]; };

// Find lily leaf nearest a point
const nearestPad = (M, x, y, flower) => { let best = null, bd = 1e9; for (const p of M.pads) { if (flower === true && !p.flower) continue; if (flower === false && p.flower) continue; const d = Math.hypot(p.x - x, (p.y - y) * 2); if (d < bd) { bd = d; best = p; } } return best; };

// sc: { entry:'walk'|'drop', tIn, standX, T (throw start), gag:'frog'|'lily', hideAfter, hideBefore, heroH }
ACT.monet = (c, lt, sc) => {
  const M = ACT.monetWorld(), h = sc.heroH || HERO_H, T = sc.T;
  const pad = sc.gag === 'frog' ? nearestPad(M, 1640, 975) : nearestPad(M, 1560, 930, false);
  const sx = sc.standX, sy = M.deckY(sx);
  const rel = T + ACT.RELEASE, from = ACT.stoneFrom(sx, sy, h);
  const hops = [{ x: 1000, y: 700, t: rel + 0.26, s: 0.45 }, { x: 1230, y: 790, t: rel + 0.5, s: 0.6, peak: 120 }, { x: 1410, y: 868, t: rel + 0.68, s: 0.74, peak: 80 }];
  const last = { x: pad.x, y: pad.y, t: rel + 0.82, s: 0.85, peak: 55 };
  const plan = { t0: rel, from, s0: 0.4, firstArc: 90, hops: hops.concat([last]) };
  const ev = { hops: plan.hops.map((p, i) => ({ x: p.x, y: p.y, t: p.t, s: p.s, big: i === 3 })), padBump: { pad, t: last.t } };
  const hitT = last.t, landT = hitT + 1.0;
  c.save(); if (sc.zoom) { const z = 1 + 0.16 * ss(hitT + 0.5, landT + 0.2, lt); const zx = sx + 60, zy = sy - h * 0.7; c.translate(zx, zy); c.scale(z, z); c.translate(-zx, -zy); }
  X.monetBack(c, M, 0, lt, ev);
  // Frog or flower: sitting on leaf → hit by stone, bounces up → lands on his hat
  // Hero
  let hero = null;
  const hidden = (sc.hideBefore != null && lt < sc.hideBefore) || (sc.hideAfter != null && lt >= sc.hideAfter);
  if (!hidden) {
    let key = 'monet_throw', i = 0, x = sx, y = sy, sq = 1;
    if (sc.entry === 'walk' && lt < sc.tIn) { key = 'monet_walk'; const q = lt / sc.tIn; x = lerp(sc.walkFrom, sx, q); y = M.deckY(x); i = Math.floor((x - sc.walkFrom) / 17) % 8; }
    else if (sc.entry === 'drop' && lt < sc.tIn) { key = 'monet_jump'; const q = clamp((lt - (sc.hideBefore || 0)) / (sc.tIn - (sc.hideBefore || 0))); x = lerp(sc.dropFrom[0], sx, q); y = lerp(sc.dropFrom[1], sy, q) - Math.sin(q * Math.PI) * 90; i = q < 0.7 ? 3 : 4; }
    else if (sc.entry === 'drop' && lt < sc.tIn + 0.3) { key = 'monet_jump'; i = lt < sc.tIn + 0.12 ? 5 : 6; }
    else if (lt < T) i = 0;
    else { const u = lt - T; i = ACT.throwFrame(u); if (lt >= hitT - 0.1) i = 6; if (lt >= hitT + 0.35) i = 5; if (lt >= landT) i = 7; }
    if (sc.override) ({ key, i, x, y } = Object.assign({ key, i, x, y }, sc.override(lt, { key, i, x, y })));
    if (lt >= landT && lt < landT + 0.3) { const a = (lt - landT) / 0.3; y -= Math.sin(a * Math.PI) * 26; x += Math.sin(a * 40) * 4 * (1 - a); }   // Hat impact: startled jump and shake
    X.actor(c, key, i, { x, y, h, mat: 'monet', t: lt, wx: x, shadow: 'rgba(60,70,120,.18)' });
    if (lt >= landT && lt < landT + 0.9) { const a = (lt - landT) / 0.9, [hx0, hy0] = X.hatTop(key, i, { x, y, h }); c.save(); c.lineCap = 'round'; c.globalAlpha = 1 - a * a;   // Surprise lines (short Monet-colored strokes)
      [-0.9, -0.35, 0.25].forEach((ang, k) => { const r0 = h * 0.42 + a * 30, r1 = r0 + 34; const cx = hx0 + 30, cy = hy0 + h * 0.25; c.strokeStyle = ['#fffbe8', '#f2a6bf', '#9db5e0'][k]; c.lineWidth = 9; c.beginPath(); c.moveTo(cx + Math.cos(ang - 1.2) * r0, cy + Math.sin(ang - 1.2) * r0); c.lineTo(cx + Math.cos(ang - 1.2) * r1, cy + Math.sin(ang - 1.2) * r1); c.stroke(); }); c.restore(); }
    hero = { key, i, x, y, h, hat: X.hatTop(key, i, { x, y, h }) };
  }
  X.monetFront(c, M, 0, lt, [90, 1830]);
  X.stoneAt(c, lt, plan);
  // Props: frog / water lily
  const hatAt = hero ? hero.hat : (sc.hatFallback || [sx, sy - h]);
  const padY = pad.y - 4 * pad.s;
  if (sc.gag === 'frog') {
    const fs = 0.7 + 0.5 * pad.s;
    if (lt < hitT) X.frog(c, pad.x, padY + Math.sin(lt * 2) * 1.5, fs, 'sit', 'monet', { croak: lt > 0.3 && lt < 0.7 ? Math.sin((lt - 0.3) / 0.4 * Math.PI) : 0, flip: true });
    else if (lt < landT) { const q = (lt - hitT) / (landT - hitT), x = lerp(pad.x, hatAt[0], q), y = lerp(padY, hatAt[1] + 4, q) - Math.sin(q * Math.PI) * 360, s = lerp(fs, 0.62, q) + Math.sin(q * Math.PI) * 0.55;
      X.frog(c, x, y, s, 'leap', 'monet', { rot: -q * TAU * 1.0 - 0.5, flip: true }); }
    else if (!sc.hideFrogAfter || lt < sc.hideFrogAfter) { const a = lt - landT, sq = 1 - 0.3 * Math.exp(-a * 9) * Math.cos(a * 30);
      X.frog(c, hatAt[0], hatAt[1] + 8, 0.62, 'sit', 'monet', { sy: sq, croak: a > 0.25 && a < 0.75 ? Math.sin((a - 0.25) / 0.5 * Math.PI) : 0, flip: true }); }
  } else if (sc.gag === 'lily') {
    const ls = 0.5 + 0.5 * pad.s;
    if (lt < hitT) ACT.lily(c, pad.x, padY + 4, ls * 0.8, 0);
    else if (lt < landT) { const q = (lt - hitT) / (landT - hitT), x = lerp(pad.x, hatAt[0], q), y = lerp(padY, hatAt[1] + 8, q) - Math.sin(q * Math.PI) * 300; ACT.lily(c, x, y, lerp(ls, 0.5, q) + Math.sin(q * Math.PI) * 0.7, q * TAU * 1.5);
      if (q < 0.25) X.ripple(c, pad.x, pad.y, (lt - hitT), 0.9, true); }
    else if (lt >= landT && !(sc.hideAfter != null && lt >= sc.hideAfter)) { const a = lt - landT; ACT.lily(c, hatAt[0], hatAt[1] + 10, 0.5 * (1 + 0.15 * Math.exp(-a * 8) * Math.sin(a * 30)), 0); }
  }
  c.restore();
  return { hero, hitT, landT, pad, hatAt };
};
})();
