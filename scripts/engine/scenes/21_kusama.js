// Yayoi Kusama's infinite polka dots (Infinity Mirror Room, 1965–; Yellow Pumpkin, 1994) — entirely procedural.
// Pipeline: ① red room: white dots on walls/floor (two grid sizes; floor dots flatten into perspective ellipses) → ② window = infinite mirror room: colored lights approach from the dark distance, mirrored reflections
//      → ③ yellow pumpkin on table (lobes and black dots) → ④ characters: flat colors and thin black outlines; white dots on red dress and orange cat patches, red dots on white patches
//      → ⑤ motion: dots pulse in a traveling wave originating at the cat; dress dots crawl downward, mirror-room lights approach, pumpkin breathes
//      → ⑥ final 0.3s: self-dissolution (dots expand until they engulf everything)
SCENES['21_kusama'] = (() => {
  const W = 1920, H = 1080, { clamp, lerp, rng } = U, P = PAINT;
  const { ss } = U;
  const C = { red: '#d8181e', redDk: '#a80e14', white: '#fbf6ee', yellow: '#f6d02a', black: '#141210', skin: '#f6dcc8' };
  const O = [540, 760];                                         // Traveling-wave origin (cat)
  const wave = (x, y, t, k = 1) => 0.82 + 0.28 * Math.sin(Math.hypot(x - O[0], y - O[1]) * 0.012 - t * 6 * k);
  const grid = (x0, y0, x1, y1, sp, seed, jit = 0.25) => { const r = rng(seed), o = []; for (let y = y0, j = 0; y < y1; y += sp * 0.87, j++) for (let x = x0 + (j % 2) * sp / 2; x < x1; x += sp) o.push([x + (r() - .5) * sp * jit, y + (r() - .5) * sp * jit, 0.75 + r() * 0.5, r() * 6.28, 0.85 + r() * 0.3]); return o; };
  const WALL_BIG = grid(-40, 20, W + 40, 720, 104, 3), WALL_SM = grid(12, 64, W + 40, 720, 104, 4, 0.5);
  const FLOOR = (() => { const r = rng(6), o = []; for (let row = 0; row < 9; row++) { const q = row / 8, y = 712 + Math.pow(q, 1.4) * 360, sp = 46 + q * 70, rr = 6 + q * 22; for (let x = -40 + (row % 2) * sp / 2; x < W + 40; x += sp) o.push([x + (r() - .5) * 10, y, rr * (0.8 + r() * 0.4), r() * 6.28, 0.9]); } return o; })();
  const dot = (c, x, y, r, rot, asp, col) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, r, r * asp, rot, 0, Math.PI * 2); c.fill(); };
  let OBL = 0;                                                  // Dissolution amount (ending)

  function room(c, t) {
    c.fillStyle = C.red; c.fillRect(0, 0, W, 708);
    const fg = c.createLinearGradient(0, 700, 0, H); fg.addColorStop(0, '#c0141a'); fg.addColorStop(1, '#e02024'); c.fillStyle = fg; c.fillRect(0, 700, W, H - 700);
    c.fillStyle = C.redDk; c.fillRect(0, 700, W, 6);
    const g = 1 + OBL * 2.2;
    WALL_BIG.forEach(([x, y, s, rot, asp]) => dot(c, x, y, 30 * s * wave(x, y, t) * g, rot, asp, C.white));
    WALL_SM.forEach(([x, y, s, rot, asp]) => dot(c, x, y, 10 * s * wave(x, y, t, 1.3) * g, rot, asp, C.white));
    FLOOR.forEach(([x, y, rr, rot]) => dot(c, x, y, rr * wave(x, y, t) * g, 0, 0.42, C.white));
  }
  // Infinite mirror room: 3D dots fly toward camera (looping z), projection and glow; floor reflection
  // Lights occupy a 3D grid (regular repetition suggests infinite mirror reflections); looping z moves toward camera
  const LIGHTS = (() => { const r = rng(9), o = []; for (let gx = -6; gx <= 6; gx++) for (let gy = -3; gy <= 3; gy++) for (let gz = 0; gz < 3; gz++) o.push([gx * 0.42 + (r() - .5) * 0.06, gy * 0.38 + (r() - .5) * 0.06, (gz + r() * 0.3) / 3, ['#ff3a4a', '#ffd43a', '#3aa8ff', '#6aff7a', '#ff7ad0', '#ffffff'][(r() * 6) | 0]]); return o; })();
  function mirrorRoom(c, t) {
    c.save(); c.beginPath(); c.rect(370, 140, 420, 400); c.clip();
    c.fillStyle = '#05040a'; c.fillRect(370, 140, 420, 400);
    const cx = 580, cy = 330, F = 150;
    c.strokeStyle = 'rgba(120,120,160,.22)'; c.lineWidth = 1; [[370, 140], [790, 140], [370, 540], [790, 540]].forEach(([x, y]) => { c.beginPath(); c.moveTo(cx, cy); c.lineTo(x, y); c.stroke(); });
    c.globalCompositeOperation = 'lighter';
    const sorted = LIGHTS.map(([x, y, z0, col]) => [x, y, ((z0 - t * 0.3) % 1 + 1) % 1 * 3.6 + 0.4, col]).sort((a, b) => b[2] - a[2]);
    for (const [x, y, z, col] of sorted) {
      const px = cx + x * F / z, py = cy + y * F / z, r = 3.2 / z + 0.6; if (px < 350 || px > 810 || py < 120 || py > 560) continue;
      const fade = clamp((4 - z) / 1.0) * clamp((z - 0.4) / 0.25);
      c.globalAlpha = fade * 0.5; const g = c.createRadialGradient(px, py, 0, px, py, r * 3.2); g.addColorStop(0, col); g.addColorStop(1, col + '00'); c.fillStyle = g; c.beginPath(); c.arc(px, py, r * 3.2, 0, Math.PI * 2); c.fill();
      c.globalAlpha = fade; c.fillStyle = col; c.beginPath(); c.arc(px, py, r, 0, Math.PI * 2); c.fill();
    }
    c.restore();
    // Window frame: yellow with black dots
    c.save(); c.fillStyle = C.yellow; c.fillRect(348, 118, 464, 22); c.fillRect(348, 540, 464, 24); c.fillRect(348, 118, 22, 446); c.fillRect(790, 118, 22, 446);
    c.fillStyle = C.black; for (let x = 360; x < 806; x += 22) { dot(c, x, 129, 6 * wave(x, 129, t), 0, 1, C.black); dot(c, x, 552, 6 * wave(x, 552, t), 0, 1, C.black); } for (let y = 150; y < 540; y += 22) { dot(c, 359, y, 6 * wave(359, y, t), 0, 1, C.black); dot(c, 801, y, 6 * wave(801, y, t), 0, 1, C.black); }
    c.strokeStyle = C.black; c.lineWidth = 3; c.strokeRect(348, 118, 464, 446); c.restore();
  }
  // Yellow pumpkin: 5 lobes, black separating lines, rows of black dots on each lobe (large at center, small at edges); whole shape breathes
  function pumpkin(c, t) {
    const cx = 960, cy = 540, br = 1 + Math.sin(t * 5) * 0.025;
    c.save(); c.translate(cx, cy + 78); c.scale(br, 2 - br); c.translate(-cx, -(cy + 78));
    const lobes = [[-88, 46, 70], [-44, 58, 74], [0, 62, 80], [44, 58, 74], [88, 46, 70]];
    [0, 4, 1, 3, 2].forEach(k => { const [dx, rx, ry] = lobes[k]; const p = new Path2D(); p.ellipse(cx + dx, cy + 8, rx, ry, 0, 0, Math.PI * 2);
      c.fillStyle = C.yellow; c.fill(p); c.strokeStyle = C.black; c.lineWidth = 4; c.stroke(p);
      c.save(); c.clip(p);
      for (let row = -4; row <= 4; row++) { const y = cy + 8 + row * 17; const wRow = Math.sqrt(Math.max(0, 1 - Math.pow(row * 17 / ry, 2))) * rx; for (let col = -3; col <= 3; col++) { const x = cx + dx + col * wRow * 0.3; const edge = 1 - Math.abs(col) / 4; const r = (3 + 6.5 * edge) * (1 - Math.abs(row) / 6) * wave(x, y, t, 1.5); if (r > 0.8) dot(c, x, y, r, 0, 1, C.black); } }
      c.restore(); });
    c.fillStyle = '#2a3a14'; c.beginPath(); c.moveTo(cx - 10, cy - 50); c.quadraticCurveTo(cx - 14, cy - 86, cx + 6, cy - 92); c.lineTo(cx + 14, cy - 84); c.quadraticCurveTo(cx + 4, cy - 70, cx + 10, cy - 50); c.closePath(); c.fill(); c.strokeStyle = C.black; c.lineWidth = 3; c.stroke();
    c.restore();
  }
  function table(c, t) {
    c.fillStyle = C.yellow; c.strokeStyle = C.black; c.lineWidth = 4;
    [[806, 616, 408, 34], [834, 650, 352, 46], [842, 696, 26, 210], [1152, 696, 26, 210]].forEach(([x, y, w, h]) => { c.fillRect(x, y, w, h); c.strokeRect(x, y, w, h);
      c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); for (let yy = y + 8; yy < y + h; yy += 18) for (let xx = x + 8 + ((yy / 18) | 0) % 2 * 9; xx < x + w; xx += 18) dot(c, xx, yy, 4.2 * wave(xx, yy, t), 0, 1, C.black); c.restore(); });
  }
  // Characters: flat RIG fills, dots in each region, thin black outlines
  function chars(c, t, lt, ch) {
    const L = P.scratch('ku_chars'), g = L.getContext('2d'); g.reset();
    const K = RIG.cat({ tail: ch.tail, blink: ch.blink, breathe: ch.breathe });
    const G = RIG.girl({ cup: ch.cup, sip: ch.sip, breathe: ch.breathe, hair: 'bun' });
    const gp = { skin: C.skin, hair: '#f2c84a', hairLine: '#c8962a', dress: C.red, line: C.black, lw: 3, cheek: 'rgba(240,110,110,.4)', lip: '#d8181e', iris: '#2a2a2a', cuff: C.white, apron: null, cupBody: C.yellow, cupRim: '#6a3a14', shoe: C.black };
    RIG.drawCat(g, K, { orange: '#ec8a2a', white: C.white, stripe: '#b85a14', line: C.black, lw: 3, eye: '#2a2a2a' });
    // Cat: white dots on orange patches, red dots on white patches
    const catDots = (path, col, sp, r0, dy) => { g.save(); g.clip(path); for (let y = 540 + dy, j = 0; y < 920; y += sp * 0.87, j++) for (let x = 380 + (j % 2) * sp / 2; x < 720; x += sp) dot(g, x, y, r0 * wave(x, y, t) * (1 + OBL * 2), 0, 1, col); g.restore(); };
    catDots(K.body, C.white, 34, 7, (t * 30) % (34 * 0.87 * 2)); catDots(K.head, C.white, 26, 5, 0);
    RIG.drawCat(g, K, { line: C.black, lw: 3, mode: 'line', eye: '#2a2a2a' });
    // Girl
    RIG.drawGirl(g, G, { ...gp, mode: 'fill' });
    // White dots crawl down red skirt (y shifts with time, exiting at hem and returning at waist)
    const dress = new Path2D(); [G.skirt, G.torso, G.farSleeve].forEach(p => dress.addPath(p));
    g.save(); g.clip(dress); const off = (t * 46) % (52 * 0.87 * 2);      // Period must span two rows (alternating staggered rows); using 52 causes a full-field one-frame jump at wraparound
    for (let y = 380 - 52, j = 0; y < 960; y += 52 * 0.87, j++) for (let x = 1080 + (j % 2) * 26; x < 1480; x += 52) dot(g, x, y + off, 13 * wave(x, y, t) * (1 + OBL * 2.2), 0.2, 0.92, C.white);
    g.restore();
    const arm = new Path2D(); arm.addPath(G.upperArm); arm.addPath(G.foreArm);
    g.fillStyle = C.red; g.fill(arm);
    g.save(); g.clip(arm); for (let y = 300, j = 0; y < 700; y += 30, j++) for (let x = 1130 + (j % 2) * 15; x < 1420; x += 30) dot(g, x, y + off * 0.6, 8 * wave(x, y, t), 0, 1, C.white); g.restore();
    RIG.drawGirl(g, G, { ...gp, mode: 'line', lw: 4.5 });
    KIT.nearArm(g, G, { fill: C.red, line: C.black, lw: 4, skin: C.skin, cuff: C.white, cupBody: C.yellow, cupRim: '#6a3a14', pattern: gg => { for (let y = 300, j = 0; y < 700; y += 30, j++) for (let x = 1130 + (j % 2) * 15; x < 1420; x += 30) dot(gg, x, y + (off * 0.6) % 60, 8 * wave(x, y, t), 0, 1, C.white); } });
    // Two cheek dots (Kusama's body painting)
    dot(g, G.cheek[0] - 4, G.cheek[1] + 2, 5 * wave(G.cheek[0], G.cheek[1], t), 0, 1, C.red);
    // Headband: red bow with white dots
    const ht = G.A.headTop; g.fillStyle = C.red; g.beginPath(); g.ellipse(ht[0] + 34, ht[1] + 6, 24, 13, 0.4, 0, Math.PI * 2); g.ellipse(ht[0] + 70, ht[1] + 26, 22, 12, 0.9, 0, Math.PI * 2); g.fill(); g.strokeStyle = C.black; g.lineWidth = 2.5; g.stroke();
    dot(g, ht[0] + 34, ht[1] + 6, 5, 0, 1, C.white); dot(g, ht[0] + 70, ht[1] + 26, 5, 0, 1, C.white);
    c.drawImage(L, 0, 0);
    return G;
  }

  return {
    draw(c, lt, t) {
      const ch = KIT.choreo(lt, t);
      OBL = Math.pow(ss(1.0, 1.26, lt), 1.4);       // Hold for 0.15s after 1.26 to give the ending a landing point
      room(c, t);
      mirrorRoom(c, t);
      table(c, t);
      pumpkin(c, t);
      const G = chars(c, t, lt, ch);
      // Steam: a rising string of white dots growing from small to large (steam is dots too)
      for (let i = 0; i < 7; i++) { const q = ((t * 1.4 + i / 7) % 1); dot(c, G.cup.x - 4 - q * 50 * ch.cup + Math.sin(q * 6 + t * 3) * 10, G.cup.y - 10 - q * 90, 3 + q * 7, 0, 1, `rgba(251,246,238,${1 - q})`); }
      // Self-dissolution: final 0.3s, white dots on red expand in rings from cat, dissolving girl, cat, and pumpkin into dots (ends on dot field, not white)
      if (OBL > 0) { const sp = 120; c.save(); c.globalAlpha = clamp(OBL * 1.4); c.fillStyle = C.red; c.fillRect(0, 0, W, H); c.globalAlpha = 1;
        for (let y = 0, j = 0; y < H + sp; y += sp * 0.87, j++) for (let x = (j % 2) * sp / 2; x < W + sp; x += sp) { const d = Math.hypot(x - O[0], y - O[1]); const r = clamp(OBL * 1.5 - d / 2600) * 0.47 * sp * wave(x, y, t); if (r > 0.5) dot(c, x, y, r, 0, 1, C.white); }
        c.restore(); }
    },
    label(c, lt, t) {
      c.save(); c.fillStyle = C.yellow; c.strokeStyle = C.black; c.lineWidth = 5;
      c.beginPath(); c.roundRect(1488, 44, 392, 160, 80); c.fill(); c.stroke();
      c.beginPath(); c.roundRect(1488, 44, 392, 160, 80); c.clip();
      [[1520, 76, 12], [1530, 172, 9], [1850, 80, 10], [1858, 170, 13], [1690, 60, 6], [1612, 192, 7], [1780, 196, 6]].forEach(([x, y, r]) => dot(c, x, y, r * wave(x, y, t, 1.4), 0, 1, C.black));
      c.restore();
      KIT.label(c, { title: '无限波点', sub: 'YAYOI KUSAMA · 1965–', tFont: '74px "LXGWWenKai-500"', sFont: '26px "Poppins-800"', tCol: C.black, sCol: C.red, x: 1838, y: 128, sy: 172, spacing: 6 });
    },
  };
})();
