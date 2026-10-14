// 1942 Hopper American Realism (hard light planes of Morning Sun and Nighthawks) — entirely procedural.
// Core technique: dual-version clipping. Cache two complete backgrounds: shaded (cool green walls, dark floor) and lit (warm yellow walls, bright floor);
// clip the lit version into a moving light polygon each frame → hard light/shadow edges that move together. Draw characters twice too (shaded/lit palettes),
// clipping the second pass into diagonal light bands. Girl's wall shadow = reveal shaded version inside light patch (translated silhouette ∩ light patch).
// Animated motifs: light patch slowly moves right→left (edge sweeps across girl's face), barber pole outside, swaying blind cord, dust in light, steam.
SCENES['24_hopper'] = (() => {
  const W = 1920, H = 1080, { clamp, lerp, ease } = U, P = PAINT, TAU = Math.PI * 2;
  const FLOOR = 730;
  const SH = { wall: '#5d8679', dado: '#4b6d63', floor: '#5b3d2b', board: '#4a3122', trim: '#a7b3a5', trimD: '#7f8d80', blind: '#cfc3a0' };
  const LT = { wall: '#efcf8f', dado: '#d8ad68', floor: '#c98b52', board: '#b0743e', trim: '#f7eed2', trimD: '#d9c9a2', blind: '#f4e8c4' };
  const poly = (c, pts) => { c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); };

  // Outside: red-brick facade across street (Early Sunday Morning); sunlight from left casts hard shadows on right of each window opening
  function street(g) {
    g.save(); g.beginPath(); g.rect(370, 140, 420, 400); g.clip();
    const sk = g.createLinearGradient(0, 140, 0, 220); sk.addColorStop(0, '#5f97c9'); sk.addColorStop(1, '#a9c8dc'); g.fillStyle = sk; g.fillRect(370, 140, 420, 80);
    g.fillStyle = '#b4553a'; g.fillRect(370, 205, 420, 335);                                   // Brick facade
    g.fillStyle = '#d27a52'; g.fillRect(370, 196, 420, 14); g.fillStyle = '#5a2418'; g.fillRect(370, 210, 420, 10);   // Cornice and hard shadow beneath
    for (let row = 0; row < 2; row++) for (let k = 0; k < 4; k++) {
      const x = 392 + k * 102, y = 240 + row * 92;
      g.fillStyle = '#e8dcc0'; g.fillRect(x - 6, y - 6, 58, 76);                               // Window surrounds
      g.fillStyle = '#1f2a24'; g.fillRect(x, y, 46, 64);
      const sh = [0.55, 0.3, 0.7, 0.42, 0.25, 0.6, 0.5, 0.35][row * 4 + k];                      // Partly lowered dark-green blinds at different heights
      g.fillStyle = '#3d6a4e'; g.fillRect(x, y, 46, 64 * sh);
      g.fillStyle = 'rgba(40,10,5,.55)'; g.fillRect(x + 46, y - 6, 10, 76);                     // Hard shadow at right of window opening
    }
    g.fillStyle = '#2d5a44'; g.fillRect(370, 432, 420, 108);                                    // Storefront
    g.fillStyle = '#c9d6c8'; [[386, 448, 150], [560, 448, 150]].forEach(([x, y, w]) => { g.fillRect(x, y, w, 70); });
    g.fillStyle = 'rgba(30,50,40,.75)'; [[386, 448, 150], [560, 448, 150]].forEach(([x, y, w]) => { g.fillRect(x, y + 30, w, 40); });
    g.fillStyle = '#e9e0c8'; g.fillRect(370, 424, 420, 10);
    g.fillStyle = '#d8c9a8'; g.fillRect(370, 526, 420, 14);                                     // Sidewalk
    g.restore();
  }
  function room(g, K) {
    g.fillStyle = K.wall; g.fillRect(0, 0, W, FLOOR);
    g.fillStyle = K.dado; g.fillRect(0, 640, W, FLOOR - 640); g.fillStyle = K.trim; g.fillRect(0, 636, W, 8); g.fillRect(0, FLOOR - 14, W, 14);
    g.fillStyle = K.floor; g.fillRect(0, FLOOR, W, H - FLOOR);
    g.strokeStyle = K.board; g.lineWidth = 3; for (let k = 1; k < 8; k++) { const y = FLOOR + Math.pow(k / 8, 1.5) * (H - FLOOR); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    street(g);
    // White-painted surrounds, sill, and mullion
    g.fillStyle = K.trim; g.fillRect(346, 116, 468, 24); g.fillRect(346, 116, 24, 446); g.fillRect(790, 116, 24, 446); g.fillRect(330, 540, 500, 26);
    g.fillStyle = K.trimD; g.fillRect(330, 566, 500, 10); g.fillRect(370, 330, 420, 10); g.fillRect(575, 140, 10, 400);
    // Partly lowered roller blind
    g.fillStyle = K.blind; g.fillRect(366, 140, 428, 92); g.fillStyle = K.trimD; g.fillRect(366, 228, 428, 6);
    // Small framed picture on wall (the blank little pictures common in Hopper interiors)
    g.fillStyle = K.trimD; g.fillRect(1560, 300, 160, 120); g.fillStyle = K.dado; g.fillRect(1572, 312, 136, 96);
  }
  const bgShade = () => P.cached('hop_sh', W, H, g => room(g, SH));
  const bgLit = () => P.cached('hop_lt', W, H, g => room(g, LT));
  // Oil brush marks: mainly vertically stretched fbm, diagonal secondary, soft-light overlay α0.2
  const brush = () => P.cached('hop_brush', W, H, (g) => {
    const s = 4, w = W / s, h = H / s, sm = P.canvas(w, h), sg = sm.getContext('2d'), im = sg.createImageData(w, h), d = im.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const n = P.fbm(x * 0.06, y * 0.006, 4) * 0.7 + P.fbm(x * 0.02 + y * 0.02, 3.3, 3) * 0.3, v = 128 + n * 110, i = (y * w + x) * 4; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    sg.putImageData(im, 0, 0); g.imageSmoothingQuality = 'high'; g.drawImage(sm, 0, 0, W, H);
  });

  // ---------- Furniture and characters: same function with shaded/lit palettes ----------
  const TS = { wood: '#4f3322', woodD: '#3a2418', skin: '#c89a84', skinD: '#a87866', hair: '#a8893f', hairD: '#7f6428', dress: '#7a2c2a', dressD: '#5e1f1e', collar: '#b9b09c',
    orange: '#a6602c', orangeD: '#80461c', white: '#dcd6c8', stripe: '#6e3a18', cup: '#bfb8a8', eye: '#6a8a3a', band: '#3a5a8a' };
  const TL = { wood: '#a86c3c', woodD: '#7a4a26', skin: '#f7d3b4', skinD: '#e0ad8c', hair: '#f3d67e', hairD: '#c9a24a', dress: '#cc4a3c', dressD: '#9e3328', collar: '#f6efdc',
    orange: '#f0a04a', orangeD: '#c8722a', white: '#fbf5e6', stripe: '#c0642a', cup: '#fbf8f0', eye: '#a8d050', band: '#4a78c0' };
  function furniture(c, K) {
    c.fillStyle = K.wood; c.fillRect(810, 618, 400, 26); c.fillStyle = K.woodD; c.fillRect(826, 644, 368, 22);
    c.fillStyle = K.wood; c.fillRect(840, 644, 20, 261); c.fillRect(1160, 644, 20, 261);
    c.fillStyle = K.woodD; c.fillRect(1436, 470, 18, 440); c.fillRect(1474, 478, 18, 430); c.fillStyle = K.wood; c.fillRect(1290, 744, 210, 18); c.fillRect(1300, 760, 16, 150);
  }
  function cat(c, K, KK) {
    c.save(); c.lineCap = 'round';
    c.strokeStyle = K.orange; c.lineWidth = KK.tailW; c.stroke(KK.tail);
    const tip = KK.tailPts[KK.tailPts.length - 1]; c.fillStyle = K.white; c.beginPath(); c.arc(tip[0], tip[1], KK.tailW / 2, 0, TAU); c.fill();
    c.fillStyle = K.orange; c.fill(KK.body);
    c.save(); c.clip(KK.body); c.fillStyle = K.orangeD; c.beginPath(); c.ellipse(450, 830, 70, 120, 0.1, 0, TAU); c.fill(); c.restore();   // Rear shaded plane
    KK.legs.forEach(l => { c.fillStyle = K.white; c.fill(l); });
    c.save(); c.clip(KK.body); c.fillStyle = K.white; c.beginPath(); c.ellipse(606, 768, 40, 92, -0.05, 0, TAU); c.fill(); c.restore();   // White chest: smooth ellipse (RIG white is a straight-edged polygon and looks pasted on without outlines)
    c.fillStyle = K.orange; c.fill(KK.head);
    c.save(); c.clip(KK.head); c.fillStyle = K.white; c.beginPath(); c.ellipse(KK.nose[0] - 22, KK.nose[1] + 12, 36, 26, 0, 0, TAU); c.fill(); c.restore();
    c.strokeStyle = K.stripe; c.lineWidth = 7; KK.stripes.forEach(s => { c.beginPath(); c.moveTo(...s[0]); c.lineTo(...s[1]); c.stroke(); });
    KK.eyes.forEach(e => { if (KK.blink) { c.strokeStyle = '#2a1a0e'; c.lineWidth = 3; c.beginPath(); c.moveTo(e.x - 8, e.y + 1); c.lineTo(e.x + 8, e.y + 1); c.stroke(); }
      else { c.fillStyle = K.eye; c.beginPath(); c.arc(e.x, e.y, 8, 0, TAU); c.fill(); c.fillStyle = '#1a120a'; c.beginPath(); c.ellipse(e.x + 2, e.y, 2.4, 6.5, 0, 0, TAU); c.fill(); } });
    c.fillStyle = '#b8605a'; c.beginPath(); c.arc(KK.nose[0], KK.nose[1], 5, 0, TAU); c.fill();
    c.strokeStyle = '#3a2416'; c.lineWidth = 2; c.beginPath(); c.moveTo(...KK.mouth[0]); c.quadraticCurveTo(...KK.mouth[1], ...KK.mouth[2]); c.stroke();
    c.restore();
  }
  function girl(c, K, G, ch) {
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    const f = (p, col) => { if (p) { c.fillStyle = col; c.fill(p); } };
    f(G.farSleeve, K.dressD); f(G.farHand, K.skinD); f(G.farCuff, K.collar);
    f(G.skirt, K.dress);
    c.save(); c.clip(G.skirt); c.fillStyle = K.dressD; c.beginPath(); c.moveTo(1330, 640); c.lineTo(1460, 640); c.lineTo(1460, 940); c.lineTo(1300, 940); c.lineTo(1352, 780); c.closePath(); c.fill(); c.restore();   // Dark plane behind knee
    c.strokeStyle = K.dressD; c.lineWidth = 4; G.folds.forEach(p => c.stroke(p));
    f(G.shoe, '#2a1810');
    f(G.torso, K.dress);
    c.save(); c.clip(G.torso); c.fillStyle = K.dressD; c.fillRect(1375, 420, 80, 220); c.restore();
    const nk = G.A.neck; c.fillStyle = K.collar; c.beginPath(); c.moveTo(nk[0] - 20, nk[1] - 2); c.lineTo(nk[0] + 24, nk[1]); c.lineTo(nk[0] + 6, nk[1] + 30); c.closePath(); c.fill();   // White collar tip
    f(G.hairDown, K.hair); f(G.neck, K.skinD); f(G.hairBack, K.hair);
    c.save(); c.clip(G.hairBack); c.fillStyle = K.hairD; c.beginPath(); c.ellipse(G.A.nape[0] + 20, G.A.nape[1] - 10, 50, 40, 0, 0, TAU); c.fill(); c.restore();
    f(G.face, K.skin);
    c.save(); c.clip(G.face); c.fillStyle = K.skinD; c.beginPath(); c.ellipse(G.A.ear[0] + 6, G.A.ear[1] + 10, 26, 46, 0, 0, TAU); c.fill(); c.restore();   // Shaded plane behind cheek
    f(G.bangs, K.hair);
    { const a = G.A.headTop, nk = G.A.nape; c.strokeStyle = K.band; c.lineWidth = 9; c.beginPath(); c.moveTo(a[0] - 52, a[1] + 26); c.quadraticCurveTo(a[0] + 10, a[1] - 6, nk[0] + 30, nk[1] - 62); c.stroke(); }   // Hair ribbon (girlish detail)
    c.strokeStyle = K.hairD; c.lineWidth = 3; G.hairLines.forEach(p => c.stroke(p));
    if (ch.blink) { c.strokeStyle = '#3a2418'; c.lineWidth = 2.6; c.stroke(G.lid); }
    else { c.fillStyle = '#2e2018'; c.beginPath(); c.ellipse(G.eye.x - 1, G.eye.y + 1, 3.6, 4.6, 0, 0, TAU); c.fill(); c.strokeStyle = '#3a2418'; c.lineWidth = 2.4; c.stroke(G.lid); }
    c.strokeStyle = K.hairD; c.lineWidth = 2.4; c.stroke(G.brow);
    c.fillStyle = '#a83a36'; c.beginPath(); c.moveTo(...G.lips[0]); c.lineTo(...G.lips[1]); c.lineTo(...G.lips[2]); c.closePath(); c.fill();
    f(G.upperArm, K.dress); f(G.foreArm, K.dress); f(G.cuff, K.collar); f(G.hand, K.skin);
    RIG.drawCup(c, G.cup, { body: K.cup, rim: '#5a3a22', hw: 6 });
    c.fillStyle = K.skin; c.beginPath(); c.arc(G.thumb[0], G.thumb[1], 7, 0, TAU); c.fill();
    c.restore();
  }

  return {
    draw(c, lt, t) {
      const ch = P.choreo(lt, t);
      const dx = 30 - 95 * ease.inOut(clamp(lt / 1.25));          // Light patch shifts ~95px left over 1.2s (sun moves)
      const KK = RIG.cat({ tail: ch.tail * 0.6, blink: ch.blink, breathe: ch.breathe });
      const G = RIG.girl({ cup: ch.cup, sip: ch.sip, breathe: ch.breathe, hair: 'long' });
      // ① Shaded base → reveal lit base inside wall/floor light patches
      c.drawImage(bgShade(), 0, 0);
      const WP = [[1420 + dx, 250], [1920, 470], [1920, FLOOR], [1420 + dx, FLOOR]];
      const FP = [[1420 + dx, FLOOR], [1920, FLOOR], [1920, H], [1700 + dx, H]];
      P.litClip(c, [WP, FP], c => { c.drawImage(bgLit(), 0, 0);
      // Mullion shadows (vertical and diagonal horizontal) and girl's wall shadow inside light patch both reveal shaded version
      const S = P.scratch('hopSh'), sg = S.getContext('2d'); sg.reset(); sg.clearRect(0, 0, W, H); sg.fillStyle = '#000';
      sg.fillRect(1650 + dx, 200, 24, FLOOR - 200); poly(sg, [[1650 + dx, FLOOR], [1674 + dx, FLOOR], [1820 + dx, H], [1796 + dx, H]]); sg.fill();
      poly(sg, [[1420 + dx, 470], [1920, 680], [1920, 702], [1420 + dx, 492]]); sg.fill();
      sg.save(); sg.translate(150, 18); [G.torso, G.hairBack, G.bun, G.face, G.bangs, G.upperArm, G.foreArm, G.hand, G.skirt].forEach(p => p && sg.fill(p)); sg.restore();
      sg.globalCompositeOperation = 'source-in'; sg.drawImage(bgShade(), 0, 0); sg.globalCompositeOperation = 'source-over';
      c.drawImage(S, 0, 0); });
      // ② Barber pole outside (red/white/blue diagonals move upward)
      c.save(); const bx = 742, by = 446, bw = 18, bh = 64; c.beginPath(); c.rect(bx, by, bw, bh); c.clip(); c.fillStyle = '#f4efe2'; c.fillRect(bx, by, bw, bh);
      const off = (lt * 60) % 24; c.lineWidth = 6; for (let k = -4; k < 6; k++) { const y = by + k * 24 - off; c.strokeStyle = k % 2 ? '#c8302a' : '#2a4a9a'; c.beginPath(); c.moveTo(bx - 4, y + 14); c.lineTo(bx + bw + 4, y); c.stroke(); }
      c.restore(); c.fillStyle = '#d9d2bf'; c.fillRect(bx - 3, by - 8, bw + 6, 8); c.fillRect(bx - 3, by + bh, bw + 6, 8);
      // Blind cord sways gently
      const sw = Math.sin(lt * 4.2) * 0.07; c.save(); c.translate(580, 232); c.rotate(sw); c.strokeStyle = '#7a6a4a'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 70); c.stroke();
      c.strokeStyle = '#c9b88a'; c.lineWidth = 4; c.beginPath(); c.arc(0, 78, 8, 0, TAU); c.stroke(); c.restore();
      // ③ Furniture and characters: shaded colors first, lit colors clipped into diagonal light band
      furniture(c, TS); cat(c, TS, KK); girl(c, TS, G, ch);
      const OP = [[1345 + dx, 0], [W, 0], [W, H], [1185 + dx, H]];
      P.litClip(c, [OP], c => { furniture(c, TL); girl(c, TL, G, ch); });
      // Dust floating in light band
      c.save(); c.globalCompositeOperation = 'lighter'; P.particles(26, 42, t, { x0: 1250, x1: 1900, y0: 760, y1: 120, speed: 40, drift: 18, life: 9 }).forEach(p => {
        const ex = 1345 + dx - (p.y / H) * 160; if (p.x < ex) return; c.fillStyle = `rgba(255,235,180,${0.35 + 0.3 * Math.sin(t * 6 + p.i)})`; c.beginPath(); c.arc(p.x, p.y, 2.2 * p.s, 0, TAU); c.fill(); });
      c.restore();
      P.steam(c, t, G.cup.x, G.cup.y - 8, { h: 55, n: 2, color: 'rgba(255,248,230,.5)', width: 3, spread: 12, wobble: 6 });
      // Canvas brush marks
      c.save(); c.globalCompositeOperation = 'soft-light'; c.globalAlpha = 0.2; c.drawImage(brush(), 0, 0); c.restore();
    },
  };
})();
