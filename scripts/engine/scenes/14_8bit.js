// 1985 8-bit pixel game (Super Mario style) — pure code.
// Pipeline: draw per pixel at 240×135 (1 low-res pixel = 8 screen pixels) → scale/fill RIG character paths at low resolution
//      → palette quantization + threshold antialias removal + individual 1px black part outlines (layered NES sprite outlines) → nearest-neighbor 8× upscale
//      → HUD: PressStart2P 64px (1 font pixel = 8 screen pixels; coordinates multiples of 8) drawn directly at full resolution.
// Scene lasts ~0.23s (~11 visible frames), so all small loops are stepped 15–30fps animation with integer-pixel amplitudes.
SCENES['14_8bit'] = (() => {
  const W = 1920, H = 1080, S = 8, LW = 240, LH = 135, P = PAINT;
  const C = {
    wall: '#064556', plus: '#0b988a', black: '#000000', white: '#fcfcfc', gray: '#bcbcbc',
    wood: '#a77f06', woodHi: '#eeba18', brick: '#d85214', mortar: '#fbe2a6', base: '#0b988a',
    sky0: '#0856ef', sky1: '#47c4f8', sky2: '#aae9fb', sun: '#f1bc08', hill: '#62ee58', hill2: '#0dc405',
    red: '#e82704', redDk: '#7c0b02', blue: '#0856ef', blueDk: '#0838a8', skin: '#f9e0ab', skinDk: '#e8a878',
    hair: '#f8d038', hairDk: '#c89010', orange: '#f39d48', orangeDk: '#d85214', pink: '#f8a0b0', leaf: '#0dc405', leafHi: '#62ee58',
  };
  const PAL_CHAR = ['#000000', '#fcfcfc', '#bcbcbc', '#e82704', '#7c0b02', '#0856ef', '#0838a8', '#f9e0ab', '#e8a878', '#f8d038', '#c89010', '#f39d48', '#d85214', '#f8a0b0'].map(P.hex);

  // ---------- Low-resolution canvas utilities ----------
  const lc = (k) => P.cached('8b_' + k, LW, LH, () => {});
  const px = (g, x, y, w = 1, h = 1, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  // Quantize low-res antialiased path layer, threshold alpha, add 1px black outer outline
  function spriteize(g, outline = true) {
    const im = g.getImageData(0, 0, LW, LH), d = im.data, N = LW * LH, op = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      const a = d[i * 4 + 3];
      if (a < 110) { d[i * 4 + 3] = 0; continue; }
      // Unpremultiply before finding nearest color
      const r = d[i * 4], gg = d[i * 4 + 1], b = d[i * 4 + 2];
      let best = 0, bd = 1e9; for (let j = 0; j < PAL_CHAR.length; j++) { const q = PAL_CHAR[j], dd = (r - q[0]) ** 2 + (gg - q[1]) ** 2 + (b - q[2]) ** 2; if (dd < bd) { bd = dd; best = j; } }
      const q = PAL_CHAR[best]; d[i * 4] = q[0]; d[i * 4 + 1] = q[1]; d[i * 4 + 2] = q[2]; d[i * 4 + 3] = 255; op[i] = 1;
    }
    if (outline) for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) {
      const i = y * LW + x; if (op[i]) continue;
      if ((x > 0 && op[i - 1]) || (x < LW - 1 && op[i + 1]) || (y > 0 && op[i - LW]) || (y < LH - 1 && op[i + LW])) { d[i * 4] = 0; d[i * 4 + 1] = 0; d[i * 4 + 2] = 0; d[i * 4 + 3] = 255; }
    }
    g.putImageData(im, 0, 0);
  }
  // Sprite layer: draw full-res paths at 1/8 scale on low-res canvas, then spriteize
  function layer(key, fn, outline = true) {
    const cv = lc('L_' + key), g = cv.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, LW, LH);
    g.save(); g.scale(1 / S, 1 / S); fn(g); g.restore();
    spriteize(g, outline); return cv;
  }

  // ---------- Static background (low-resolution, per-pixel) ----------
  function background(g) {
    px(g, 0, 0, LW, LH, C.wall);
    // Cross-dot wall: 6px grid, alternate rows offset 3px
    for (let j = 0; j * 6 < 100; j++) for (let i = -1; i * 6 < LW + 6; i++) {
      const x = i * 6 + (j % 2 ? 3 : 0) + 1, y = j * 6 + 2;
      if (y > 97) continue;
      px(g, x, y - 1, 1, 3, C.plus); px(g, x - 1, y, 3, 1, C.plus);
    }
    px(g, 0, 100, LW, 1, C.base);
    // Wood floor strips
    px(g, 0, 106, LW, 1, C.black); px(g, 0, 107, LW, 6, C.wood); px(g, 0, 107, LW, 1, C.woodHi);
    for (let x = 7; x < LW; x += 24) px(g, x, 107, 1, 6, C.black);
    // Brick floor: row height 7 including seam, width 16, alternate rows offset 8
    px(g, 0, 113, LW, LH - 113, C.black);
    for (let r = 0; 113 + r * 7 < LH; r++) { const y = 114 + r * 7; for (let x = -16 + (r % 2 ? 8 : 0); x < LW; x += 16) {
      px(g, x, y, 15, 6, C.brick); px(g, x, y, 15, 1, C.mortar); px(g, x, y, 1, 6, C.mortar);
    } }
    // Window (45,15)-(100,73)
    px(g, 44, 14, 57, 60, C.black); px(g, 45, 15, 55, 58, C.white); px(g, 98, 15, 2, 58, C.gray); px(g, 45, 71, 55, 2, C.gray);
    const pane = (x0, y0, w, h) => {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const q = (y0 + y - 17) / 52, X = x0 + x, Y = y0 + y;
        // Sky: dark→light→pale blue, 2×2 checker dithering at boundaries (NES gradient)
        let col = q < 0.36 ? C.sky0 : q < 0.62 ? C.sky1 : C.sky2;
        if (Math.abs(q - 0.36) < 0.05 && (X + Y) % 2) col = C.sky1;
        if (Math.abs(q - 0.62) < 0.05 && (X + Y) % 2) col = q < 0.62 ? C.sky2 : C.sky1;
        px(g, X, Y, 1, 1, col);
      }
    };
    pane(47, 17, 24, 25); pane(75, 17, 23, 25); pane(47, 45, 24, 25); pane(75, 45, 23, 25);
    px(g, 71, 17, 4, 53, C.white); px(g, 73, 17, 2, 53, C.gray); px(g, 47, 42, 51, 3, C.white); px(g, 47, 44, 51, 1, C.gray);
    // Pixel-circle sun
    for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) if (x * x + y * y <= 17) px(g, 58 + x, 28 + y, 1, 1, (x + y < -3) ? '#f8e858' : C.sun);
    // Green hills (lower two panes)
    const hill = (cx, cy, r, x0, x1, col) => { for (let x = x0; x < x1; x++) { const h = Math.sqrt(Math.max(0, r * r - (x - cx) ** 2)); if (h <= 0) continue; const top = Math.round(cy - h); px(g, x, top, 1, 70 - top, col); px(g, x, top, 1, 1, C.black); } };
    hill(56, 70, 9, 47, 71, C.hill); hill(66, 72, 8, 47, 71, C.hill2);
    hill(90, 76, 18, 75, 98, C.hill2);
    for (const [x, y] of [[52, 64], [55, 62], [86, 63], [92, 66], [80, 68]]) px(g, x, y, 2, 1, C.hill);
    // Bricks + question block above lower-right pane
    for (let k = 0; k < 2; k++) { const x = 81 + k * 4; px(g, x, 47, 4, 4, C.black); px(g, x, 47, 3, 3, C.brick); px(g, x, 47, 3, 1, C.mortar); }
    px(g, 89, 47, 4, 4, C.black); px(g, 89, 47, 3, 3, C.sun); px(g, 90, 48, 1, 1, C.black);
    px(g, 43, 73, 59, 3, C.black); px(g, 43, 73, 59, 2, C.gray); px(g, 43, 73, 59, 1, C.white);
    // Fish picture frame
    px(g, 114, 29, 20, 15, C.black); px(g, 115, 30, 18, 13, C.woodHi); px(g, 117, 32, 14, 9, C.sky2);
    px(g, 120, 35, 7, 3, C.brick); px(g, 119, 36, 1, 1, C.brick); px(g, 127, 34, 2, 5, C.brick); px(g, 121, 35, 1, 1, C.black);
    px(g, 123, 27, 2, 2, C.gray);
    // Ladder-back chair behind girl
    px(g, 178, 57, 3, 57, C.black); px(g, 179, 58, 2, 55, C.woodHi);
    px(g, 185, 59, 3, 55, C.black); px(g, 186, 60, 2, 53, C.woodHi);
    for (let k = 0; k < 4; k++) { px(g, 180, 63 + k * 7, 6, 2, C.black); px(g, 180, 63 + k * 7, 6, 1, C.wood); }
    px(g, 160, 91, 28, 3, C.black); px(g, 160, 91, 28, 2, C.woodHi);
    px(g, 163, 94, 2, 19, C.woodHi); px(g, 162, 94, 1, 19, C.black);
    // Table (102,80)-(150,113)
    px(g, 101, 79, 50, 4, C.black); px(g, 102, 79, 48, 2, C.woodHi); px(g, 102, 81, 48, 1, C.wood);
    px(g, 104, 83, 44, 3, C.wood); px(g, 104, 85, 44, 1, C.black);
    for (const x of [106, 144]) { px(g, x - 1, 86, 4, 27, C.black); px(g, x, 86, 2, 27, C.woodHi); }
    px(g, 107, 102, 38, 2, C.black); px(g, 107, 102, 38, 1, C.wood);
  }
  // Swaying plant: integer-pixel leaf sway offsets
  function plant(g, sway) {
    const pot = (x, y, w, h) => { px(g, x - 1, y - 1, w + 2, h + 2, C.black); px(g, x, y, w, h, C.brick); px(g, x + 1, y, 2, h, '#f39d48'); };
    pot(208, 99, 20, 13); px(g, 206, 97, 24, 3, C.black); px(g, 207, 97, 22, 2, C.brick);
    px(g, 217, 82, 2, 16, C.black); px(g, 218, 82, 1, 16, C.leaf);
    const leaf = (cx, cy, w, h, dx) => {     // Rounded pixel leaf: black clipped-corner outline, green fill, top highlight row, central vein
      const x0 = cx + dx - w / 2;
      for (let j = -1; j <= h; j++) { const cut = (j === -1 || j === h) ? 1 : 0; px(g, x0 - 1 + cut, cy + j, w + 2 - cut * 2, 1, C.black); }
      for (let j = 0; j < h; j++) { const cut = (j === 0 || j === h - 1) ? 1 : 0; px(g, x0 + cut, cy + j, w - cut * 2, 1, C.leaf); }
      px(g, x0 + 1, cy, w - 3, 1, C.leafHi); px(g, x0 + 1, cy + (h >> 1), w - 2, 1, '#0a8a04');
    };
    leaf(218, 70, 6, 6, sway); leaf(213, 76, 6, 4, sway); leaf(224, 76, 6, 4, sway);
    leaf(209, 84, 8, 4, Math.round(sway * 0.6)); leaf(227, 84, 8, 4, Math.round(sway * 0.6)); leaf(212, 91, 7, 3, 0); leaf(225, 91, 7, 3, 0);
  }

  // ---------- HUD (full resolution, PressStart2P 64px, 8px grid) ----------
  const BM = {   // Bitmap: . transparent, o orange, w white, k black, r red, p pink
    cat: ['o.....o.', 'oo...oo.', 'ooooooo.', 'okoooko.', 'ooopooo.', 'wwwwwww.', '.wwwww..'],
    heart: ['.rr.rr.', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'],
    heartE: ['.ww.ww.', 'w..w..w', 'w.....w', '.w...w.', '..w.w..', '...w...'],
    apple: ['...w....', '..w.....', '.wwwwww.', 'wwwwwwww', 'wwwwwwkw', 'wwwwwwww', '.wwwwww.', '..w..w..'],
  };
  const COL = { o: C.orange, w: C.white, k: C.black, r: C.red, p: C.pink, R: C.white };
  const bitmap = (c, rows, x, y, map = COL, shadow = true) => {
    if (shadow) rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') { c.fillStyle = '#0b1d24'; c.fillRect(x + i * S + S, y + j * S + S, S, S); } }));
    rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') { c.fillStyle = map[ch]; c.fillRect(x + i * S, y + j * S, S, S); } }));
  };
  const text = (c, s, x, y) => { c.font = '48px "PressStart2P-400"'; c.textBaseline = 'top'; c.fillStyle = '#0b1d24'; c.fillText(s, x + S, y + S); c.fillStyle = C.white; c.fillText(s, x, y); };
  function hud(c, lt) {
    bitmap(c, BM.cat, 64, 40);
    text(c, 'x9', 144, 48);
    // Hearts flash at frame 630 (lt≈0.19): two full hearts white, empty heart red, switch every 2 frames
    const fl = lt > 0.16 && lt < 0.23 && Math.floor(lt * 30) % 2 === 0;
    const red = fl ? { ...COL, r: C.white } : COL, emp = fl ? { ...COL, w: C.red } : COL;
    bitmap(c, BM.heart, 312, 48, red); bitmap(c, BM.heart, 384, 48, red); bitmap(c, fl ? BM.heart.map(r => r) : BM.heartE, 456, 48, fl ? { ...COL, r: C.red } : emp);
    text(c, 'WORLD 1-1', 624, 48);
    bitmap(c, BM.apple, 1168, 40);
    text(c, 'x03', 1248, 48);
  }

  // ---------- Characters ----------
  const legs = (g, G) => {    // Jeans + white sneakers (replace RIG skirt)
    const hip = G.hipSeat, knee = [1222, 724], ank = [1214, 872];
    g.fillStyle = C.blueDk; g.fill(RIG.taper([hip[0] + 10, hip[1] - 6], [knee[0] + 26, knee[1] - 8], 84, 70)); g.fill(RIG.taper([knee[0] + 26, knee[1] - 8], [ank[0] + 30, ank[1]], 64, 50));
    g.fillStyle = C.blue; g.fill(RIG.taper(hip, knee, 92, 76)); g.fill(RIG.taper(knee, ank, 70, 56));
    g.fillStyle = C.white; g.fill(RIG.smooth([[1150, 868], [1238, 862], [1250, 900], [1124, 904], [1118, 888]]));
    g.fillStyle = C.red; g.fillRect(1176, 880, 30, 8);
  };
  function girlLayers(ch, lt) {
    const G = RIG.girl({ cup: ch.cup, sip: ch.sip, hair: 'long', breathe: ch.breathe });
    // Separate outlined part layers: NES inner contours distinguish hair/face/arms
    const back = layer('gBack', g => { g.fillStyle = C.red; g.fill(G.farSleeve); g.fillStyle = C.skin; g.fill(G.farHand); });
    const body = layer('gBody', g => {
      legs(g, G);
      g.fillStyle = C.red; g.fill(G.torso);
      g.fillStyle = C.redDk; g.fillRect(G.A.waist[0] - 40, G.A.waist[1] - 18, 120, 16);  // Ribbed sweater hem
      g.fillStyle = C.red; g.fillRect(G.A.neck[0] - 28, G.A.neck[1] - 10, 56, 22);        // Turtleneck
    });
    const hair = layer('gHair', g => { g.fillStyle = C.hair; g.fill(G.hairBack); g.fill(G.hairDown); g.fillStyle = C.hairDk; g.fillRect(G.A.nape[0] + 10, G.A.nape[1] + 20, 14, 120); });
    const face = layer('gFace', g => { g.fillStyle = C.skin; g.fill(G.face); g.beginPath(); g.ellipse(G.ear[0], G.ear[1], 9, 13, 0.2, 0, 7); g.fill(); });
    const bangs = layer('gBangs', g => { g.fillStyle = C.hair; g.fill(G.bangs); });
    const arm = layer('gArm', g => {
      g.fillStyle = C.red; g.fill(G.upperArm); g.fill(G.foreArm); g.fillStyle = C.redDk; g.fill(G.cuff);
      g.fillStyle = C.skin; g.fill(G.hand);
    });
    return { G, back, body, hair, face, bangs, arm };
  }
  // White/red striped mug: per-pixel low-res (6×5 + handle), follows hand
  function cupPx(g, G) {
    const x = Math.round(G.cup.x / S) - 3, y = Math.round(G.cup.y / S);
    px(g, x - 1, y - 1, 8, 7, C.black); px(g, x + 6, y, 3, 4, C.black); px(g, x + 6, y + 1, 2, 2, C.white); px(g, x + 6, y + 1, 1, 2, C.black);
    px(g, x, y, 6, 5, C.white); px(g, x, y, 6, 1, C.gray); px(g, x, y + 2, 6, 1, C.red); px(g, x, y + 4, 6, 1, C.red); px(g, x + 5, y + 1, 1, 4, C.gray);
    px(g, Math.round(G.thumb[0] / S), Math.round(G.thumb[1] / S), 2, 2, C.skin);
    return [x + 3, y - 1];
  }
  function catLayers(ch, lt) {
    // Tail: 15fps stepped four-pose loop (pixel animation alternates a few drawings)
    const step = Math.floor(lt * 15) % 4, tail = [-0.55, 0, 0.55, 0][step];
    const K = RIG.cat({ tail, blink: ch.blink, breathe: 0 });
    const body = layer('catB', g => {
      g.lineCap = 'round'; g.strokeStyle = C.orange; g.lineWidth = K.tailW; g.stroke(K.tail);
      const tip = K.tailPts[K.tailPts.length - 1]; g.fillStyle = C.white; g.beginPath(); g.arc(tip[0], tip[1], 14, 0, 7); g.fill();
      g.fillStyle = C.orange; g.fill(K.body);
      g.fillStyle = C.white; g.fill(K.white); K.legs.forEach(l => g.fill(l));
      g.strokeStyle = C.orangeDk; g.lineWidth = 9; K.stripes.slice(3).forEach(s => { g.beginPath(); g.moveTo(...s[0]); g.lineTo(...s[1]); g.stroke(); });
    });
    const head = layer('catH', g => {
      g.fillStyle = C.orange; g.fill(K.head);
      g.save(); g.clip(K.head); g.fillStyle = C.white; g.beginPath(); g.ellipse(K.nose[0] - 14, K.nose[1] + 20, 34, 22, 0, 0, 7); g.fill(); g.restore();
      g.strokeStyle = C.orangeDk; g.lineWidth = 9; K.stripes.slice(0, 3).forEach(s => { g.beginPath(); g.moveTo(...s[0]); g.lineTo(...s[1]); g.stroke(); });
      g.fillStyle = C.pink; K.earInner.forEach(e => { g.beginPath(); e.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.fill(); });
    });
    return { K, body, head };
  }

  return {
    draw(c, lt, t) {
      const ch = P.choreo(lt, t);
      const L = lc('frame'), g = L.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.drawImage(P.cached('8b_bg', LW, LH, background), 0, 0);
      // Window clouds move 1px left every 2 frames; question block releases coin at lt≈0.08 (up then down)
      const cx = 92 - Math.floor(lt * 30);
      for (const [x, y, w] of [[cx - 34, 35, 8], [cx, 22, 9]]) { if (x < 47 || x + w > 98 || (x + w > 70 && x < 75)) continue; px(g, x + 1, y - 1, w - 2, 1, C.white); px(g, x, y, w, 2, C.white); px(g, x, y + 2, w, 1, C.gray); }
      const cq = (lt - 0.06) / 0.16;
      if (cq > 0 && cq < 1) { const y = Math.round(46 - Math.sin(cq * Math.PI) * 9); px(g, 90, y - 3, 2, 3, C.sun); px(g, 90, y - 3, 1, 3, '#f8e858'); }
      // Plant twitches at frame 630 (lt≈0.19)
      const sw = lt > 0.15 && lt < 0.24 ? [0, 1, 0, -1][Math.floor(lt * 30) % 4] : 0;
      plant(g, sw);
      // Characters
      const CL = catLayers(ch, lt), K = CL.K;
      g.drawImage(CL.body, 0, 0); g.drawImage(CL.head, 0, 0);
      // Cat face: pixel eyes (2×2 black + 1 white highlight), pink nose, white whiskers
      K.eyes.forEach(e => { const x = Math.round(e.x / S), y = Math.round(e.y / S); if (ch.blink) px(g, x - 1, y, 2, 1, C.black); else { px(g, x - 1, y - 1, 2, 2, C.black); px(g, x - 1, y - 1, 1, 1, C.white); } });
      px(g, Math.round(K.nose[0] / S), Math.round(K.nose[1] / S), 1, 1, C.pink);
      const hx = Math.round((K.headC[0] + 70) / S), hy = Math.round(K.headC[1] / S) + 2;
      px(g, hx, hy, 3, 1, C.white); px(g, hx, hy + 2, 3, 1, C.white); px(g, hx - 17, hy + 1, 2, 1, C.white); px(g, hx - 17, hy + 3, 2, 1, C.white);
      const GL = girlLayers(ch, lt), G = GL.G;
      g.drawImage(GL.back, 0, 0); g.drawImage(GL.body, 0, 0); g.drawImage(GL.hair, 0, 0); g.drawImage(GL.face, 0, 0); g.drawImage(GL.bangs, 0, 0);
      // Girl's per-pixel features: 1×2 black eye + brow, blush, red lips
      const ex = Math.round(G.eye.x / S), ey = Math.round(G.eye.y / S);
      if (ch.blink) px(g, ex - 1, ey, 2, 1, C.black); else { px(g, ex, ey - 1, 1, 2, C.black); px(g, ex - 1, ey - 3, 2, 1, C.hairDk); }
      px(g, Math.round(G.cheek[0] / S) - 1, Math.round(G.cheek[1] / S), 2, 1, C.pink);
      px(g, Math.round(G.lips[1][0] / S), Math.round(G.lips[1][1] / S), 1, 1, C.red);
      g.drawImage(GL.arm, 0, 0);
      const [sx, sy0] = cupPx(g, G);
      // Pixel steam: three columns of 1×2 dots, rise 1px per frame at 30fps, 6px loop
      const ph = Math.floor(lt * 30), sy = sy0 - 1;
      for (let k = 0; k < 3; k++) for (let j = 0; j < 2; j++) { const y = sy - ((ph + k * 2 + j * 3) % 6) - j * 3; px(g, sx - 2 + k * 2 + ((ph + k) % 2), y, 1, 2, k === 1 ? C.white : C.gray); }
      // 8× nearest-neighbor upscale
      c.imageSmoothingEnabled = false; c.drawImage(L, 0, 0, LW, LH, 0, 0, W, H); c.imageSmoothingEnabled = true;
      hud(c, lt);
    },
  };
})();
