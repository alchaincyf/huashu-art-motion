// 1982 Keith Haring (subway chalk drawings → Pop Shop flat-color graffiti) — entirely procedural.
// Technique: flat background (yellow walls, green floor); everything has 12–14px round-ended black marker outlines and flat fills; figures lack facial features (girl retains slight eyes/lips for recognition).
//   Figures = capsule limbs: outline all in thick black, then fill together to obtain union contour; hard cuts between 4 poses at 8fps (no interpolation) = Haring's dancers.
//   Radiating motion lines: paired short straight lines around objects, flashing at 8fps.
//   Everything bounces at 128 BPM: girl/cat bob, table squashes/stretches, teapot jumps, window frame rocks.
// Motifs: Radiant Baby in window (rays flash at 8fps), 3 dancers on wall, radiating red heart above table.
SCENES['31_haring'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2, { clamp, lerp } = U, P = PAINT;
  const C = { yel: '#ffd51c', green: '#16a54a', red: '#e8262b', blue: '#1f62d6', pink: '#ff6fb0', org: '#ff8a1c', white: '#ffffff', ink: '#111111', skin: '#ffd9b8' };
  const BEAT = 128 / 60;                                   // Beats per second
  const bounce = (t, ph = 0) => Math.pow(Math.abs(Math.sin((t * BEAT + ph) * Math.PI)), 0.6);   // 0..1, beat at 0
  const LW = 13;
  const ink = (c, p, fill, lw = LW) => { c.lineJoin = 'round'; c.lineCap = 'round'; if (fill) { c.fillStyle = fill; c.fill(p); } c.strokeStyle = C.ink; c.lineWidth = lw; c.stroke(p); };
  // Radiating motion lines: n pairs of short lines beyond radius r around (cx,cy), angles change at 8fps
  function action(c, cx, cy, rx, ry, n, t, seed, len = 34, lw = 9) {
    const st = Math.floor(t * 8), r = U.rng(seed * 97 + st * 13); c.save(); c.strokeStyle = C.ink; c.lineWidth = lw; c.lineCap = 'round';
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU + r() * 0.5; const x0 = cx + Math.cos(a) * rx, y0 = cy + Math.sin(a) * ry, L = len * (0.7 + r() * 0.6);
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + Math.cos(a) * L, y0 + Math.sin(a) * L); c.stroke(); }
    c.restore();
  }
  // Dancer: 4 poses (local coordinates, origin=center of soles, up is negative)
  const POSES = [
    { head: [0, -210], neck: [0, -168], hip: [0, -86], hl: [-74, -150], hr: [70, -250], kl: [-30, -42], kr: [34, -42], fl: [-46, 0], fr: [44, 0] },
    { head: [10, -200], neck: [6, -160], hip: [0, -84], hl: [-90, -220], hr: [86, -200], kl: [-40, -50], kr: [58, -64], fl: [-36, 0], fr: [96, -40] },
    { head: [-12, -206], neck: [-6, -166], hip: [0, -86], hl: [-70, -250], hr: [80, -150], kl: [-50, -60], kr: [26, -40], fl: [-100, -36], fr: [40, 0] },
    { head: [0, -224], neck: [0, -182], hip: [0, -100], hl: [-84, -256], hr: [84, -256], kl: [-40, -54], kr: [40, -54], fl: [-60, -14], fr: [60, -14] },
  ];
  function dancer(c, x, y, s, col, t, ph, flip = 1) {
    const k = (Math.floor(t * 8) + ph) % 4, p = POSES[k], T = q => [x + q[0] * s * flip, y + q[1] * s];
    const parts = [RIG.limb(T(p.neck), T(p.hip), 64 * s, 54 * s), RIG.limb(T(p.neck), T(p.hl), 34 * s, 30 * s), RIG.limb(T(p.neck), T(p.hr), 34 * s, 30 * s),
      RIG.limb(T(p.hip), T(p.kl), 36 * s, 32 * s), RIG.limb(T(p.kl), T(p.fl), 32 * s, 30 * s), RIG.limb(T(p.hip), T(p.kr), 36 * s, 32 * s), RIG.limb(T(p.kr), T(p.fr), 32 * s, 30 * s)];
    const hd = new Path2D(); const hc = T(p.head); hd.arc(hc[0], hc[1], 38 * s, 0, TAU); parts.push(hd);
    c.save(); c.lineJoin = 'round'; c.strokeStyle = C.ink; c.lineWidth = LW * 2 * Math.max(0.7, s); parts.forEach(q => c.stroke(q)); c.fillStyle = col; parts.forEach(q => c.fill(q)); c.restore();
    // Motion arcs beside hands and feet
    c.save(); c.strokeStyle = C.ink; c.lineWidth = 8 * s; c.lineCap = 'round';
    [p.hl, p.hr].forEach((h, i) => { const q = T(h); c.beginPath(); c.arc(q[0], q[1], 40 * s, (i ? -0.6 : 2.4), (i ? 0.4 : 3.4)); c.stroke(); });
    c.restore();
  }
  function radiantBaby(c, x, y, s, t) {
    // Rays: 12 short lines, alternating lengths at 8fps
    const st = Math.floor(t * 8); c.save(); c.strokeStyle = C.ink; c.lineWidth = 10; c.lineCap = 'round';
    for (let i = 0; i < 14; i++) { const a = -Math.PI + i / 13 * Math.PI, L = (i + st) % 2 ? 40 : 66; c.beginPath(); c.moveTo(x + Math.cos(a) * 120 * s, y + Math.sin(a) * 96 * s); c.lineTo(x + Math.cos(a) * (120 * s + L), y + Math.sin(a) * (96 * s + L)); c.stroke(); }
    c.restore();
    // Crawling baby: round head, body, limbs (two alternating crawling frames)
    const cr = st % 2, parts = [];
    const B = (q) => [x + q[0] * s, y + q[1] * s];
    parts.push(RIG.limb(B([-40, -10]), B([40, -20]), 70 * s, 60 * s));
    parts.push(RIG.limb(B([-34, 0]), B([-60 + cr * 14, 50]), 26 * s, 24 * s), RIG.limb(B([30, -8]), B([60 - cr * 14, 50]), 26 * s, 24 * s));
    const hd = new Path2D(), hc = B([-82, -40]); hd.arc(hc[0], hc[1], 40 * s, 0, TAU); parts.push(hd);
    c.save(); c.strokeStyle = C.ink; c.lineWidth = 22; parts.forEach(q => c.stroke(q)); c.fillStyle = C.white; parts.forEach(q => c.fill(q)); c.restore();
  }
  function heart(c, x, y, s, t) {
    const b = 1 + 0.15 * bounce(t, 0.5), p = new Path2D();
    p.moveTo(x, y + 40 * s * b); p.bezierCurveTo(x - 70 * s * b, y - 10 * s * b, x - 40 * s * b, y - 60 * s * b, x, y - 28 * s * b); p.bezierCurveTo(x + 40 * s * b, y - 60 * s * b, x + 70 * s * b, y - 10 * s * b, x, y + 40 * s * b); p.closePath();
    ink(c, p, C.red, 11); action(c, x, y - 6, 78 * s, 70 * s, 10, t, 5, 30, 8);
  }

  return {
    draw(c, lt, t) {
      const ch = P.choreo(lt, t);
      const bb = bounce(t), bob = -bb * 12;
      // Base color
      c.fillStyle = C.yel; c.fillRect(0, 0, W, 702); c.fillStyle = C.green; c.fillRect(0, 702, W, H - 702);
      c.strokeStyle = C.ink; c.lineWidth = 14; c.beginPath(); c.moveTo(0, 702); c.lineTo(W, 702); c.stroke();
      // Window: thick black frame, blue field, Radiant Baby; entire window rocks gently to beat
      c.save(); c.translate(580, 560); c.rotate(Math.sin(t * BEAT * Math.PI) * 0.025); c.translate(-580, -560);
      const win = new Path2D(); win.rect(350, 122, 460, 436); ink(c, win, C.blue, 16);
      c.strokeStyle = C.ink; c.lineWidth = 10; c.beginPath(); c.moveTo(580, 122); c.lineTo(580, 250); c.stroke();
      c.save(); c.clip(win); radiantBaby(c, 610, 430 + bob * 0.5, 1.05, t); c.restore();
      const sill = new Path2D(); sill.rect(326, 556, 508, 30); ink(c, sill, C.red, 12);
      c.restore();
      // Dancers on wall
      dancer(c, 175, 660, 0.95, C.red, t, 0);
      dancer(c, 1000, 520, 0.62, C.blue, t, 2, -1);
      dancer(c, 1720, 680, 1.05, C.pink, t, 1, -1);
      action(c, 1720, 520, 130, 160, 8, t, 9, 30, 8);
      heart(c, 1000, 210, 1.0, t);
      // Table: squash/stretch pivoting at floor contact of legs
      const sy = 1 - 0.07 * (1 - bb), sx = 1 + 0.05 * (1 - bb);
      c.save(); c.translate(1008, 904); c.scale(sx, sy); c.translate(-1008, -904);
      [[846, 640], [1150, 640]].forEach(([x, y], k) => { const leg = new Path2D(); leg.moveTo(x, y); leg.quadraticCurveTo(x + (k ? 18 : -18) * (1 - bb), 780, x + 6, 904); c.strokeStyle = C.ink; c.lineWidth = 36; c.lineCap = 'round'; c.stroke(leg); c.strokeStyle = C.red; c.lineWidth = 12; c.stroke(leg); });
      const top = new Path2D(); top.rect(806, 616, 404, 34); ink(c, top, C.red, 13);
      // Teapot bounces on table
      const jy = -Math.max(0, Math.sin((t * BEAT + 0.25) * Math.PI)) * 26;
      const pot = RIG.smooth([[870, 616], [858, 586], [874, 556], [912, 548], [948, 556], [962, 588], [952, 616]].map(([x, y]) => [x, y + jy]), true, 0.5);
      const sp = new Path2D(); sp.moveTo(864, 592 + jy); sp.lineTo(830, 562 + jy); ink(c, sp, null, 13); c.strokeStyle = C.white; c.lineWidth = 3; ink(c, pot, C.white, 12);
      c.restore();
      action(c, 910, 584 + jy, 70, 46, 6, t, 3, 22, 7);
      // Small horizontal floor-shadow strokes (Haring's jumping sign)
      c.strokeStyle = C.ink; c.lineWidth = 9; c.lineCap = 'round'; [[480, 932], [620, 932], [1200, 948], [1360, 948]].forEach(([x, y], k) => { const L = 30 + 30 * (1 - bb); c.beginPath(); c.moveTo(x - L, y); c.lineTo(x + L, y); c.stroke(); });
      // Cat (orange/white, thick black lines, bobs to beat; two black-dot eyes)
      const K = RIG.cat({ tail: ch.tail * 1.6, blink: ch.blink, breathe: ch.breathe, dy: -bounce(t, 0.5) * 16 })   // RIG.limb end caps fixed; thick outlines no longer expose holes at leg joints;
      RIG.drawCat(c, K, { line: C.ink, lw: LW, orange: C.org, white: C.white, stripe: C.ink, stripeW: 8, earInner: C.pink,
        tail: (c, K) => { c.lineCap = 'round'; c.strokeStyle = C.ink; c.lineWidth = K.tailW + LW * 2; c.stroke(K.tail); c.strokeStyle = C.org; c.lineWidth = K.tailW; c.stroke(K.tail); },
        face: (c, K) => { K.eyes.forEach(e => { c.fillStyle = C.ink; c.beginPath(); c.arc(e.x, e.y, K.blink ? 3 : 8, 0, TAU); c.fill(); }); c.fillStyle = C.pink; c.beginPath(); c.arc(K.nose[0], K.nose[1], 7, 0, TAU); c.fill(); } });
      action(c, 540, 760 - bounce(t, 0.5) * 16, 190, 200, 10, t, 7, 34, 9);
      // Girl: 1980s New York — oversized red sweater, denim-blue long skirt, white high-top sneakers; bobbing head, only eye dots and lips
      const G = RIG.girl({ cup: ch.cup, sip: ch.sip, hair: 'long', breathe: ch.breathe, dy: bob });
      RIG.drawGirl(c, G, { line: C.ink, lw: LW, lwOf: { hand: 9, farHand: 9, face: 10, neck: 9, cuff: 10, farCuff: 10 }, locks: false, skin: C.skin, hair: C.yel, dress: C.red, skirt: C.blue, sleeve: C.red, cuff: C.red, shoe: C.white, cupBody: C.white, cupRim: C.ink,
        features: (c, G) => { c.fillStyle = C.ink; c.beginPath(); c.arc(G.eye.x, G.eye.y, ch.blink ? 2.5 : 6, 0, TAU); c.fill(); c.strokeStyle = C.red; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(...G.lips[0]); c.lineTo(...G.lips[2]); c.stroke(); },
        hooks: { torso: (c, G) => { c.strokeStyle = C.ink; c.lineWidth = 8; const w = G.A.waist; c.beginPath(); c.moveTo(w[0] - 90, w[1] - 30); c.lineTo(w[0] + 60, w[1] - 26); c.stroke(); },   // Sweater hem ribbing
          } });
      action(c, G.A.headC[0] + 10, G.A.headC[1], 110, 110, 9, t, 11, 30, 9);
      // Rays and steam above cup (Haring-style wavy lines)
      action(c, G.cup.x, G.cup.y + 14, 48, 40, 7, t, 13, 24, 7);
      c.save(); c.strokeStyle = C.ink; c.lineWidth = 8; c.lineCap = 'round'; [0, 1].forEach(k => { c.beginPath(); for (let i = 0; i <= 10; i++) { const q = i / 10, x = G.cup.x - 10 + k * 20 + Math.sin(q * 8 + t * 14 + k) * 8, y = G.cup.y - 24 - q * 60; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }); c.restore();
    },
  };
})();
