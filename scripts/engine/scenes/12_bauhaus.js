// 1923 Bauhaus poster (Schlemmer's Triadic Ballet doll + Mondrian window + Constructivist diagonal rod) — pure code.
// Pipeline: ① cached base (aged cream paper + mottling + vertical bauhaus lettering + red/black bars + katze + two small lower-right lines + ground line + yellow triangle)
//      → ② animated composition (black rod rotates like pointer, growing steeper; window colors cycle on beat; concentric arcs sweep right of red circle; wavy cup steam)
//      → ③ geometric characters: doll = round head/trapezoid torso/black limbs/white joint disks (RIG.girl anchors); cat = round body/square head/triangle ears, batting ball
SCENES['12_bauhaus'] = (() => {
  const W = 1920, H = 1080, { clamp, lerp, ease } = U, P = PAINT, TAU = Math.PI * 2;
  const C = { paper: '#ebe3cf', ink: '#161514', red: '#d3262b', blue: '#2a58b4', yellow: '#efc12f', lblue: '#b9cee0', lblue2: '#a6c0da', grey: '#c6c3bb', cream: '#f2ecdf', orange: '#ee8a2a', orangeD: '#c25a14', chrome: '#c9c9c6' };
  const font = (px, f = 'Poppins-800') => `${px}px "${f}"`;

  // Small mottled noise image (enlarged): ages paper, red circle, black letters
  const mottle = (key, seed, col, amt) => P.cached('bh_m_' + key, 320, 180, (g) => {
    const im = g.createImageData(320, 180), r = U.rng(seed);
    for (let y = 0; y < 180; y++) for (let x = 0; x < 320; x++) { const v = P.fbm(x * 0.045 + seed, y * 0.045, 4), i = (y * 320 + x) * 4;
      im.data[i] = col[0]; im.data[i + 1] = col[1]; im.data[i + 2] = col[2]; im.data[i + 3] = clamp(v * 1.6 + 0.1) * 255 * amt + r() * 10; }
    g.putImageData(im, 0, 0); });

  // ---------- ① Base ----------
  const bg = () => P.cached('bh_bg', W, H, (g) => {
    g.fillStyle = C.paper; g.fillRect(0, 0, W, H);
    g.globalAlpha = 0.5; g.drawImage(mottle('paper', 3, [150, 130, 95], 0.35), 0, 0, W, H); g.globalAlpha = 1;
    // Long fine diagonal through scene, behind window
    g.strokeStyle = C.ink; g.lineWidth = 2.2; g.beginPath(); g.moveTo(40, 170); g.lineTo(1900, 840); g.stroke();
    // Upper-left black horizontal/red vertical bars
    g.fillStyle = C.ink; g.fillRect(60, 61, 256, 13);
    g.fillStyle = C.red; g.fillRect(292, 105, 24, 468);
    // Vertical bauhaus (read bottom-up)
    g.save(); g.translate(262, 1000); g.rotate(-Math.PI / 2); g.font = font(210); g.fillStyle = C.ink; g.textBaseline = 'alphabetic';
    const w = g.measureText('bauhaus').width; g.scale(820 / w, 1); g.fillText('bauhaus', 0, 0); g.restore();
    // Small gray squares
    g.fillStyle = '#9a9894'; g.fillRect(875, 150, 31, 31);
    // Ground line, yellow triangle
    g.fillStyle = C.ink; g.fillRect(345, 898, 1515, 17);
    g.fillStyle = C.yellow; g.beginPath(); g.moveTo(1738, 898); g.lineTo(1822, 898); g.lineTo(1822, 793); g.closePath(); g.fill();
    // Fine right diagonal
    g.strokeStyle = C.ink; g.lineWidth = 2; g.beginPath(); g.moveTo(1610, 740); g.lineTo(1900, 842); g.stroke();
    // katze
    g.fillStyle = C.ink; g.fillRect(345, 946, 25, 25);
    g.font = font(150); g.fillStyle = C.red; g.textBaseline = 'alphabetic'; g.fillText('katze', 392, 1042);
    g.strokeStyle = C.ink; g.lineWidth = 2; g.beginPath(); g.moveTo(800, 1040); g.lineTo(1180, 1040); g.stroke();
    // Two small lower-right text lines
    g.fillStyle = C.ink; g.fillRect(1224, 953, 12, 60);
    g.font = font(31, 'Poppins-600'); g.letterSpacing = '1px'; g.fillText('staatliches bauhaus weimar', 1250, 977); g.fillText('ausstellung  juli – september', 1250, 1014); g.letterSpacing = '0px';
    // Table: black top + chrome tube legs + black base
    g.fillStyle = C.ink; g.fillRect(820, 643, 380, 21); g.fillRect(925, 883, 170, 17);
    const cg = g.createLinearGradient(1000, 0, 1017, 0); cg.addColorStop(0, '#8a8a88'); cg.addColorStop(0.4, '#f2f2ee'); cg.addColorStop(1, '#7a7a78');
    g.fillStyle = cg; g.fillRect(1000, 664, 17, 220); g.strokeStyle = '#555'; g.lineWidth = 1.5; g.strokeRect(1000, 664, 17, 220);
    // Breuer-style chrome cantilever chair
    const tube = (pts) => { [[15, '#4a4a48'], [10, C.chrome], [3, '#fafaf6']].forEach(([w, col], k) => { g.strokeStyle = col; g.lineWidth = w; g.lineJoin = 'round'; g.lineCap = 'round'; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0] - (k === 2 ? 2 : 0), p[1] - (k === 2 ? 2 : 0)) : g.moveTo(p[0], p[1])); g.stroke(); }); };
    tube([[1508, 888], [1318, 888], [1300, 868], [1300, 770], [1318, 742], [1450, 736]]);
    tube([[1466, 738], [1470, 480]]);
    g.fillStyle = C.ink; g.fillRect(1450, 486, 14, 44);
    // Paper grain + black specks (aged print)
    g.drawImage(P.grain('bh', 0.02, [40, 35, 30], 0.35), 0, 0);
  });

  // Red circle (mottled, cached)
  const redDisc = () => P.cached('bh_red', 520, 520, (g) => {
    g.fillStyle = C.red; g.beginPath(); g.arc(260, 260, 252, 0, TAU); g.fill();
    g.save(); g.clip(); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = 0.55; g.drawImage(mottle('red', 9, [245, 150, 140], 0.5), -100, -60, 760, 640); g.restore();
  });

  // ---------- ② Mondrian window (cycling colors) ----------
  const GX = 366, GY = 126, CW = 100, CH = 101, GAP = 9.5;
  const base = [['cream', 'lblue', 'quarter', 'lblue'], ['yellow', 'grey', 'cream', 'lblue'], ['lblue', 'grid', 'lblue2', 'cream'], ['blue', 'cream', 'grid', 'lblue']];
  const cycle = ['red', 'yellow', 'blue', 'cream', 'lblue', 'grey'];
  const swaps = { '0,0': 0, '1,2': 2, '2,0': 4, '3,1': 1, '0,3': 3, '2,3': 5 };   // Changing cells and individual phases
  const fillOf = { cream: C.cream, lblue: C.lblue, lblue2: C.lblue2, yellow: C.yellow, grey: C.grey, blue: C.blue, red: C.red, ink: '#222' };
  function grid(c, lt) {
    c.fillStyle = C.ink; c.fillRect(352, 112, 456, 463); c.fillRect(800, 565, 32, 10);
    const step = Math.floor(clamp(lt, 0, 9) * 13);
    for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) {
      const x = GX + k * (CW + GAP) - (k ? 0 : 0), y = GY + r * (CH + GAP);
      let kind = base[r][k]; const sw = swaps[r + ',' + k];
      if (sw !== undefined && lt > 0.12) { const s = (step + sw * 2) % 9; if (s < cycle.length) kind = cycle[(s + sw) % cycle.length]; }
      if (kind === 'grid') { c.fillStyle = C.cream; c.fillRect(x, y, CW, CH); c.strokeStyle = 'rgba(30,30,30,.7)'; c.lineWidth = 1; c.beginPath(); for (let q = 6; q < CW; q += 9) { c.moveTo(x + q, y); c.lineTo(x + q, y + CH); } for (let q = 6; q < CH; q += 9) { c.moveTo(x, y + q); c.lineTo(x + CW, y + q); } c.stroke(); }
      else if (kind === 'quarter') { c.fillStyle = C.grey; c.fillRect(x, y, CW, CH); c.fillStyle = C.cream; c.beginPath(); c.moveTo(x, y + CH); c.arc(x, y + CH, CW * 0.72, -Math.PI / 2, 0); c.closePath(); c.fill(); }
      else { c.fillStyle = fillOf[kind]; c.fillRect(x, y, CW, CH); }
    }
    c.save(); c.globalAlpha = 0.35; c.drawImage(mottle('paper', 3, [150, 130, 95], 0.35), 352, 112, 456, 463, 352, 112, 456, 463); c.restore();
  }

  // ---------- Long black rod rotates around hub (source frames 575–591: 28°→49.5°) ----------
  const PIV = [1125, 195];
  function rod(c, lt) {
    const k = ease.out(clamp((lt - 0.26) / 0.22)), deg = 28 + 21.5 * k + Math.sin(clamp((lt - 0.48) / 0.3) * Math.PI) * 1.5;
    const a = deg * Math.PI / 180, u = [Math.cos(a), -Math.sin(a)], n = [Math.sin(a), Math.cos(a)];   // n = perpendicular direction (lower-right)
    const at = (s, o = 0) => [PIV[0] + u[0] * s + n[0] * o, PIV[1] + u[1] * s + n[1] * o];
    // Hub circle
    c.strokeStyle = C.ink; c.lineWidth = 2.2; c.beginPath(); c.arc(PIV[0], PIV[1], 76, 0, TAU); c.stroke();
    c.beginPath(); c.arc(PIV[0], PIV[1], 58, -a + 0.9, -a + 0.9 + 3.6); c.stroke();
    // Fine parallel lines
    c.lineWidth = 2.4; c.beginPath(); c.moveTo(...at(-540, 30)); c.lineTo(...at(240, 30)); c.stroke();
    // Thick black rod
    c.lineWidth = 27; c.lineCap = 'butt'; c.beginPath(); c.moveTo(...at(-432)); c.lineTo(...at(150)); c.stroke();
    // Short red rod
    c.strokeStyle = C.red; c.lineWidth = 12; c.beginPath(); c.moveTo(...at(52, -30)); c.lineTo(...at(150, -30)); c.stroke();
    c.fillStyle = C.ink; c.beginPath(); c.arc(PIV[0], PIV[1], 13, 0, TAU); c.fill();
  }
  // Concentric arcs right of red circle sweep outward like sound waves
  function arcs(c, lt) {
    c.strokeStyle = C.ink; c.lineCap = 'butt';
    const sweep = clamp(lt / 0.4);
    [[272, -1.05, 0.95, 2.2], [292, -1.0, 0.9, 2.2], [312, -0.95, 0.85, 2.2], [332, -0.88, 0.8, 2.2], [352, -0.8, 0.7, 2.2], [420, -0.25, 0.62, 2]].forEach(([r, a0, a1, w], i) => {
      const d = Math.sin(lt * 9 - i * 0.7) * 0.05; c.lineWidth = w; c.beginPath(); c.arc(1410, 595, r + Math.sin(lt * 12 - i) * 3, a0 + d, lerp(a0, a1, 0.55 + 0.45 * sweep) + d); c.stroke(); });
  }

  // ---------- Schlemmer girl doll: RIG.girl anchors ----------
  const joint = (c, x, y, r) => { c.fillStyle = C.cream; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.strokeStyle = C.ink; c.lineWidth = 5; c.stroke(); c.fillStyle = C.ink; c.beginPath(); c.arc(x, y, r * 0.3, 0, TAU); c.fill(); };
  const bar = (c, A, B, w, col = C.ink) => { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke(); };
  function doll(c, G, lt, t, ch) {
    const a = G.A, hc = [a.headC[0] + 14, a.headC[1] - 18];
    // Far arm flat on table
    bar(c, [1352, 482], [1300, 600], 24); bar(c, [1300, 600], [1150, 614], 22); joint(c, 1300, 600, 17); joint(c, 1140, 616, 16);
    // Golden rear hair semicircle
    c.fillStyle = C.yellow; c.beginPath(); c.arc(a.back[0] - 18, a.back[1] - 32, 56, -Math.PI / 2, Math.PI / 2); c.closePath(); c.fill();
    // Skirt: black fan + blue trapezoid
    c.fillStyle = C.ink; c.beginPath(); c.moveTo(1356, 612); c.arc(1356, 612, 178, -0.05, 1.05); c.closePath(); c.fill();
    c.fillStyle = C.blue; c.beginPath(); c.moveTo(1278, 606); c.lineTo(1420, 606); c.lineTo(1446, 728); c.lineTo(1236, 728); c.closePath(); c.fill();
    // Legs
    const hip = [1390, 716], knee = [1224, 722], ank = [1198, 878];
    bar(c, hip, knee, 42); bar(c, knee, ank, 36);
    c.fillStyle = C.ink; c.beginPath(); c.moveTo(1214, 860); c.lineTo(1224, 900); c.lineTo(1124, 900); c.lineTo(1150, 878); c.closePath(); c.fill();
    joint(c, hip[0], hip[1], 24); joint(c, knee[0], knee[1], 21); joint(c, ank[0], ank[1], 10);
    // Torso: breathing blue trapezoid
    const top = a.neck[1] + 12, bot = 612, br = ch.breathe * 140;
    c.fillStyle = C.blue; c.beginPath(); c.moveTo(1298, top - br); c.lineTo(1398, top + 8 - br); c.lineTo(1414, bot); c.lineTo(1290, bot); c.closePath(); c.fill();
    c.fillStyle = C.ink; c.beginPath(); c.moveTo(1340, top - br); c.lineTo(1398, top + 8 - br); c.lineTo(1414, bot); c.lineTo(1380, bot); c.closePath(); c.globalAlpha = 0.9; c.fill(); c.globalAlpha = 1;
    // Neck
    bar(c, [a.neck[0] + 8, a.neck[1] - 24], [a.neck[0] + 8, top - br + 4], 15);
    // Head rotates with drinking tilt
    c.save(); c.translate(a.neck[0], a.neck[1]); c.rotate(G.tilt); c.translate(-a.neck[0], -a.neck[1]);
    const R = 70;
    c.fillStyle = C.cream; c.beginPath(); c.arc(hc[0], hc[1], R, 0, TAU); c.fill();
    // Golden geometric hair: rear half-head + forehead triangle + round bun
    c.fillStyle = C.yellow; c.beginPath(); c.moveTo(hc[0], hc[1]); c.arc(hc[0], hc[1], R, -1.95, 1.15); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(hc[0] - 50, hc[1] - 50); c.lineTo(hc[0] + 2, hc[1] - R); c.lineTo(hc[0] + 4, hc[1] - 18); c.closePath(); c.fill();
    c.beginPath(); c.arc(hc[0] + 78, hc[1] + 30, 34, 0, TAU); c.fill(); c.strokeStyle = C.ink; c.lineWidth = 3; c.stroke();
    c.strokeStyle = C.ink; c.lineWidth = 5; c.beginPath(); c.arc(hc[0], hc[1], R, 0, TAU); c.stroke();
    c.lineWidth = 2.5; c.beginPath(); c.moveTo(hc[0], hc[1] - R); c.lineTo(hc[0], hc[1] + R); c.stroke();
    // Features: black vertical eyes, red square cheeks, protruding black mouth bar
    if (ch.blink) { c.fillStyle = C.ink; c.fillRect(hc[0] - 42, hc[1] - 4, 14, 5); } else { c.fillStyle = C.ink; c.fillRect(hc[0] - 40, hc[1] - 18, 10, 30); }
    c.fillStyle = C.red; c.fillRect(hc[0] - 22, hc[1] + 2, 20, 20);
    c.fillStyle = C.ink; c.fillRect(hc[0] - 62, hc[1] + 30, 24, 6);
    c.restore();
    // Near arm (IK follows cup)
    bar(c, a.shoulder, a.elbow, 28); bar(c, a.elbow, a.hand, 24);
    mug(c, G, t);
    joint(c, a.shoulder[0], a.shoulder[1], 22); joint(c, a.elbow[0], a.elbow[1], 19); joint(c, a.hand[0], a.hand[1], 17);
  }
  function mug(c, G, t) {
    const k = G.cup; c.save(); c.translate(k.x, k.y); c.rotate(k.tilt);
    c.fillStyle = '#fbf8f0'; c.strokeStyle = C.ink; c.lineWidth = 3.5; c.fillRect(-28, -6, 56, 64); c.strokeRect(-28, -6, 56, 64);
    c.fillStyle = C.blue; c.fillRect(-28, 14, 56, 8);
    c.lineWidth = 6; c.beginPath(); c.arc(30, 24, 14, -1.3, 1.3); c.stroke();
    c.restore();
    // Single spring-like wavy steam line
    c.strokeStyle = C.ink; c.lineWidth = 2.2; c.beginPath();
    for (let i = 0; i <= 60; i++) { const q = i / 60, y = k.y - 16 - q * 170, x = k.x - 4 + Math.sin(q * 26 - t * 18) * 9 * (1 - q * 0.3); i ? c.lineTo(x, y) : c.moveTo(x, y); }
    const gg = c.createLinearGradient(0, k.y, 0, k.y - 190); gg.addColorStop(0, C.ink); gg.addColorStop(1, 'rgba(22,21,20,0)'); c.strokeStyle = gg; c.stroke();
  }

  // ---------- Geometric cat: round body, square head, triangular ears, batting ball ----------
  function cat(c, K, lt, t, ch) {
    const bc = [K.box[0][0] + 146, K.box[1][1] - 100], br = 100 * (1 + ch.breathe * 2);
    // Motion arcs
    c.strokeStyle = C.ink; c.lineWidth = 2.5; [[150, -2.5, -1.75], [130, -2.45, -1.95]].forEach(([r, a0, a1]) => { c.beginPath(); c.arc(bc[0] + 50, bc[1] + 20, r, a0 + Math.PI * 0.62, a1 + Math.PI * 0.62); c.stroke(); });
    // Thick orange tail arc, dark-orange stripes, choreo sway
    const ta0 = Math.PI * 0.62 + ch.tail * 0.5, ta1 = Math.PI * 1.22 + ch.tail * 0.5, tc = [bc[0] - 20, bc[1] + 10];
    c.lineCap = 'butt'; c.strokeStyle = C.orange; c.lineWidth = 26; c.beginPath(); c.arc(tc[0], tc[1], 108, ta0, ta1); c.stroke();
    c.strokeStyle = C.orangeD; c.lineWidth = 26; c.setLineDash([10, 14]); c.beginPath(); c.arc(tc[0], tc[1], 108, ta0 + 0.08, ta1); c.stroke(); c.setLineDash([]);
    // Round body + left stripes clipped inside
    c.fillStyle = C.orange; c.beginPath(); c.arc(bc[0], bc[1], br, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.arc(bc[0], bc[1], br, 0, TAU); c.clip();
    c.fillStyle = C.orangeD; [[-100, -40, 70], [-100, -12, 80], [-100, 16, 74], [-100, 44, 60]].forEach(([x, y, w]) => c.fillRect(bc[0] + x, bc[1] + y, w, 13));
    c.fillStyle = C.cream; c.beginPath(); c.moveTo(bc[0] + 10, bc[1] + br); c.arc(bc[0], bc[1], br, 0.15, 1.45); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,240,220,.18)'; c.beginPath(); c.arc(bc[0] - 30, bc[1] - 30, 40, 0, TAU); c.fill();
    c.restore();
    // Three white circular paws; rightmost extends to bat ball at 0.06–0.2s
    const tap = Math.sin(clamp((lt - 0.05) / 0.16) * Math.PI);
    [[-62, 0], [16, 0], [88 + tap * 36, -tap * 10]].forEach(([dx, dy], i) => { const x = bc[0] + dx, y = 878 + dy; c.fillStyle = C.cream; c.beginPath(); c.arc(x, y, 23, 0, TAU); c.fill(); c.strokeStyle = C.ink; c.lineWidth = 2.5; c.stroke(); });
    // Blue ball rolls after bat (rotation = displacement / radius)
    const roll = ease.out(clamp((lt - 0.13) / 0.34)), bx = 712 + roll * 104, rb = 31;
    c.fillStyle = C.blue; c.beginPath(); c.arc(bx, 898 - rb, rb, 0, TAU); c.fill();
    c.save(); c.translate(bx, 898 - rb); c.rotate(roll * 104 / rb); c.strokeStyle = C.cream; c.lineWidth = 4; c.beginPath(); c.moveTo(-rb + 6, 0); c.lineTo(rb - 6, 0); c.stroke(); c.fillStyle = C.cream; c.beginPath(); c.arc(0, -rb * 0.55, 5, 0, TAU); c.fill(); c.restore();
    if (roll > 0 && roll < 0.95) { c.strokeStyle = C.ink; c.lineWidth = 2; [0, 1].forEach(j => { c.beginPath(); c.moveTo(bx - rb - 14 - j * 16, 850 + j * 18); c.lineTo(bx - rb - 44 - j * 16 - 30 * (1 - roll), 850 + j * 18); c.stroke(); }); }
    // Square head (slight rotation), yellow triangle ears, white muzzle block
    const hc = [K.headC[0] + 14, K.headC[1] + 48], s = 104, rot = -0.06 + ch.tail * 0.08;
    c.save(); c.translate(hc[0], hc[1]); c.rotate(rot);
    c.fillStyle = C.yellow; c.beginPath(); c.moveTo(-52, -50); c.lineTo(-38, -104); c.lineTo(-4, -50); c.closePath(); c.fill(); c.beginPath(); c.moveTo(14, -50); c.lineTo(50, -104); c.lineTo(54, -50); c.closePath(); c.fill();
    c.fillStyle = C.orange; c.fillRect(-s / 2, -s / 2, s, s);
    c.fillStyle = C.cream; c.fillRect(-s / 2, 8, s, s / 2 - 8);
    c.fillStyle = C.orangeD; c.fillRect(-s / 2, -s / 2, s, 12);
    [[-22, -10], [22, -10]].forEach(([x, y]) => { if (ch.blink) { c.fillStyle = C.ink; c.fillRect(x - 13, y, 26, 4); return; } c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, 15, 0, TAU); c.fill(); c.strokeStyle = C.ink; c.lineWidth = 3; c.stroke(); c.fillStyle = C.ink; c.fillRect(x - 1, y - 11, 8, 22); });
    c.fillStyle = C.ink; c.beginPath(); c.moveTo(-8, 16); c.lineTo(8, 16); c.lineTo(0, 27); c.closePath(); c.fill();
    c.strokeStyle = C.ink; c.lineWidth = 1.8; c.beginPath(); [[16, 20, 140, 6], [16, 26, 142, 30], [16, 32, 136, 52], [-16, 22, -120, 10], [-16, 30, -122, 34]].forEach(([x0, y0, x1, y1]) => { c.moveTo(x0, y0); c.lineTo(x1, y1); }); c.stroke();
    c.restore();
  }

  return {
    draw(c, lt, t) {
      const ch = P.choreo(lt, t);
      c.drawImage(bg(), 0, 0);
      c.drawImage(redDisc(), 1410 - 260, 595 - 260);
      arcs(c, lt);
      grid(c, lt);
      rod(c, lt);
      const G = RIG.girl({ cup: ch.cup, sip: ch.sip, breathe: ch.breathe });
      doll(c, G, lt, t, ch);
      const K = RIG.cat({ tail: ch.tail, blink: ch.blink, breathe: ch.breathe });
      cat(c, K, lt, t, ch);
      c.drawImage(P.grain('bh2', 0.012, [30, 28, 26], 0.5), 0, 0);
    },
  };
})();
