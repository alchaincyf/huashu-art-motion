// 02_egypt · Ancient Egyptian tomb mural (c.1350 BCE, New Kingdom) — horizontal register-based mural world
// World = three tomb-wall registers: top kheker frieze + colored border; upper register Meidum geese, winged sun disk, waterbirds startled from papyrus (Nebamun hunting motif), hieroglyph panels;
// Colored divider at 540 (horizon); middle walking register (offering table, pointed jars, blue lotus); colored ground line at 760; lower register Nile zigzags, fish, blue lotus.
// Same technique as scenes/02_egypt.js: plaster base + flat colors + dark contours + four-color border + hieroglyph library + full-surface multiply weathering (mottling, hairline cracks, grain).
// Motion: flowing water, swimming fish, flapping birds, geese pecking, swaying papyrus, pulsing sun disk.
// Interaction: scarab rolls solar ball toward him; he jumps aside like an Egyptian dancer; ball/scarab pass beneath feet and exit; he looks back, proudly puts hands on hips.
// Scarab rolls ball away; hat stays pure white, no souvenir accumulation
if (!window.XJ) { const x = new XMLHttpRequest(); x.open('GET', 'demos/long_scroll/lib/xing2_jia.js', false); x.send(); (0, eval)(x.responseText + '\n//# sourceURL=demos/long_scroll/lib/xing2_jia.js'); }
(() => {
const { clamp, lerp, rng, ss } = U, P = PAINT, TAU = Math.PI * 2, H = 1080, W = 1920;
const w = 2100, OX = 160, WW = w + 2 * OX, G = WORLD.GROUND, REG = 540;
const WALK = { st: [49.0, 23.6, -1.4, -53.7, 51.4, 27.0, -22.6, -55.4], fps: 12.6 };   // Support-foot x (height300), frame rate at speed330, measured frame by frame
const K = { walk: 'egypt_walk8', act: 'egypt_dodge' };
const AT = 1000, DUR = 1.6;
const AX = AT + WORLD.V * 0.11;   // Actual standing position during action (after XJ.glide braking displacement)
const T_HIT = 0.6, V_SC = 650;     // Action seconds: ball reaches feet; scarab speed (px/s, independent of walking). Faster beetle and longer airtime let entire beetle pass before landing
const C = { wall: [234, 220, 184], wall2: [216, 197, 151], line: '#2a1810', rule: '#9a2b22', red: '#b8322a', blue: '#2a58a8', green: '#2e8a55', yellow: '#e2b13a', black: '#231a14',
  gold: '#e0ab38', cream: '#f2ead6', white: '#f6f2e8', terra: '#d4936a', lapis: '#2c56b0', turq: '#3fa6a0', water: '#2f5fa8', papy: '#3f8a4a', papyL: '#7ab45a' };
const BAND = [C.red, C.blue, C.yellow, C.green];
const poly = (g, pts, close = true) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); if (close) g.closePath(); };
const fs = (g, fill, stroke, lw = 2.5) => { if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); } };

// ---------- Hieroglyphs (shapes from scenes/02_egypt.js) ----------
const GL = {
  ankh: { h: 60, cols: [C.blue, C.green, C.black, C.red], d(g) { g.lineWidth = 3.6; g.beginPath(); g.ellipse(0, -17, 8, 11, 0, 0, 7); g.moveTo(-16, -3); g.lineTo(16, -3); g.moveTo(0, -5); g.lineTo(0, 29); g.stroke(); } },
  sun: { h: 40, cols: [C.black, C.blue, C.red], d(g) { g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 15, 0, 7); g.stroke(); g.beginPath(); g.arc(0, 0, 4, 0, 7); g.fill(); } },
  bread: { h: 26, cols: [C.red, C.blue, C.green], d(g) { g.beginPath(); g.arc(0, 9, 19, Math.PI, 0); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(-12, 4); g.lineTo(12, 4); g.stroke(); } },
  reed: { h: 62, cols: [C.black, C.green, C.red], d(g) { g.beginPath(); g.moveTo(-2, 29); g.quadraticCurveTo(-11, 0, 1, -29); g.quadraticCurveTo(7, -2, 4, 29); g.stroke(); g.beginPath(); g.moveTo(1, -29); g.quadraticCurveTo(9, -31, 10, -24); g.stroke(); } },
  owl: { h: 60, cols: [C.black, C.blue], d(g) { g.beginPath(); g.ellipse(3, 6, 12, 19, 0.1, 0, 7); g.stroke(); g.beginPath(); g.arc(-2, -18, 10, 0, 7); g.stroke(); g.beginPath(); g.arc(-6, -19, 2.4, 0, 7); g.arc(2, -19, 2.4, 0, 7); g.fill(); g.beginPath(); g.moveTo(-2, -14); g.lineTo(-3, -9); g.moveTo(9, 22); g.lineTo(18, 29); g.moveTo(-3, 24); g.lineTo(-5, 30); g.moveTo(4, 24); g.lineTo(3, 30); g.stroke(); } },
  falcon: { h: 60, cols: [C.black, C.red, C.blue], d(g) { g.beginPath(); g.arc(-6, -20, 7, 0, 7); g.fill(); poly(g, [[-12, -21], [-19, -16], [-11, -15]]); g.fill(); g.beginPath(); g.ellipse(2, 1, 10, 20, -0.35, 0, 7); g.stroke(); poly(g, [[8, 16], [20, 30], [6, 27]]); g.fill(); g.beginPath(); g.moveTo(-3, 19); g.lineTo(-5, 30); g.moveTo(2, 19); g.lineTo(1, 30); g.moveTo(-1, -8); g.quadraticCurveTo(10, 0, 12, 14); g.stroke(); } },
  eye: { h: 36, cols: [C.green, C.black, C.blue], d(g) { g.beginPath(); g.moveTo(-18, 0); g.quadraticCurveTo(0, -12, 18, 0); g.quadraticCurveTo(0, 9, -18, 0); g.stroke(); g.beginPath(); g.arc(0, -1, 4.5, 0, 7); g.fill(); g.beginPath(); g.moveTo(-18, -12); g.quadraticCurveTo(0, -20, 20, -11); g.moveTo(-4, 6); g.lineTo(-6, 16); g.moveTo(6, 5); g.quadraticCurveTo(14, 18, 4, 16); g.stroke(); } },
  cartouche: { h: 74, cols: [C.black, C.red], d(g) { g.beginPath(); g.ellipse(0, -2, 15, 31, 0, 0, 7); g.stroke(); g.beginPath(); g.moveTo(-14, 33); g.lineTo(14, 33); g.stroke(); g.lineWidth = 2; g.beginPath(); g.arc(0, -18, 5, 0, 7); g.moveTo(-7, -2); g.lineTo(7, -2); g.moveTo(-6, 8); g.lineTo(-3, 13); g.lineTo(0, 8); g.lineTo(3, 13); g.lineTo(6, 8); g.stroke(); } },
  snake: { h: 30, cols: [C.green, C.black, C.red], d(g) { g.lineWidth = 3.2; g.beginPath(); g.moveTo(22, 8); g.bezierCurveTo(10, -4, 4, 14, -6, 6); g.bezierCurveTo(-14, 0, -16, -4, -20, -2); g.stroke(); g.beginPath(); g.moveTo(-20, -2); g.lineTo(-23, -9); g.moveTo(-17, -3); g.lineTo(-15, -10); g.stroke(); } },
  seated: { h: 58, cols: [C.red, C.black, C.blue], d(g) { g.beginPath(); g.arc(-2, -21, 6.5, 0, 7); g.fill(); poly(g, [[-6, -13], [4, -13], [6, 6], [16, 8], [17, 18], [-10, 18], [-10, 2]]); g.fill(); g.beginPath(); g.moveTo(-6, -8); g.lineTo(-17, -16); g.stroke(); g.beginPath(); g.moveTo(-14, 26); g.lineTo(18, 26); g.stroke(); } },
  djed: { h: 62, cols: [C.blue, C.green], d(g) { g.beginPath(); g.moveTo(-6, 29); g.lineTo(-6, -10); g.moveTo(6, 29); g.lineTo(6, -10); for (let k = 0; k < 4; k++) { g.moveTo(-13, -12 - k * 5); g.lineTo(13, -12 - k * 5); } g.moveTo(-12, 29); g.lineTo(12, 29); g.stroke(); } },
  jug: { h: 50, cols: [C.red, C.green, C.blue], d(g) { g.beginPath(); g.moveTo(-6, -22); g.lineTo(6, -22); g.lineTo(5, -14); g.quadraticCurveTo(16, -6, 12, 12); g.quadraticCurveTo(8, 22, 0, 22); g.quadraticCurveTo(-8, 22, -12, 12); g.quadraticCurveTo(-16, -6, -5, -14); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(-10, 0); g.lineTo(10, 0); g.stroke(); } },
  lotus: { h: 56, cols: [C.green, C.blue], d(g) { g.beginPath(); g.moveTo(0, 27); g.lineTo(0, -6); g.stroke(); poly(g, [[0, -6], [-12, -18], [-6, -26], [0, -16], [6, -26], [12, -18]]); g.stroke(); } },
  nfr: { h: 56, cols: [C.black, C.red], d(g) { g.beginPath(); g.ellipse(0, 12, 10, 14, 0, 0, 7); g.moveTo(0, -2); g.lineTo(0, -26); g.moveTo(-6, -18); g.lineTo(6, -18); g.moveTo(-6, -12); g.lineTo(6, -12); g.stroke(); } },
  water: { h: 30, cols: [C.blue], d(g) { g.lineWidth = 2.6; for (let r = -1; r <= 1; r++) { g.beginPath(); for (let i = 0; i <= 16; i++) { const x = -21 + i * 2.625, y = r * 9 + (i % 2 < 1 ? -3 : 3); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); } } },
  feather: { h: 60, cols: [C.blue, C.green, C.black], d(g) { g.beginPath(); g.moveTo(-2, 29); g.quadraticCurveTo(-8, -10, 4, -29); g.quadraticCurveTo(12, -18, 6, 0); g.quadraticCurveTo(3, 15, 2, 29); g.stroke(); } },
};
const GN = Object.keys(GL);
const glyphCols = (g, xs, y0, y1, seed) => { const r = rng(seed); g.lineCap = 'round';
  xs.forEach(x => { g.strokeStyle = C.rule; g.lineWidth = 2.6; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke(); });
  for (let k = 0; k < xs.length - 1; k++) { const cx = (xs[k] + xs[k + 1]) / 2, s = (xs[k + 1] - xs[k]) / 78; let y = y0 + 8, prev = '';
    while (true) { let n; do { n = GN[(r() * GN.length) | 0]; } while (n === prev); prev = n; const gl = GL[n]; if (y + gl.h * s > y1) break;
      g.save(); g.translate(cx, y + gl.h * s / 2); g.scale(s, s); const col = gl.cols[(r() * gl.cols.length) | 0]; g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 3.1; g.lineJoin = 'round'; gl.d(g); g.restore(); y += gl.h * s + 7; } } };
// Colored border (horizontal/vertical), black gaps between blocks
function blocks(g, x0, y0, x1, y1, len, off = 0) {
  const hor = (x1 - x0) > (y1 - y0), L = hor ? x1 - x0 : y1 - y0;
  g.fillStyle = C.cream; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  for (let s = 0, k = off; s < L; s += len, k++) { g.fillStyle = BAND[k % 4];
    if (hor) g.fillRect(x0 + s + 3, y0 + 3, Math.min(len - 6, L - s - 3), y1 - y0 - 6); else g.fillRect(x0 + 3, y0 + s + 3, x1 - x0 - 6, Math.min(len - 6, L - s - 3));
    g.fillStyle = C.black; if (hor) g.fillRect(x0 + s, y0, 2, y1 - y0); else g.fillRect(x0, y0 + s, x1 - x0, 2); }
  g.strokeStyle = C.black; g.lineWidth = 2; g.strokeRect(x0, y0, x1 - x0, y1 - y0);
}
function jar(g, cx, y0, s) {
  g.save(); g.translate(cx, y0); g.scale(s, s);
  poly(g, [[-26, 256], [-20, 256], [10, 196], [4, 196]]); fs(g, C.white, C.line, 2); poly(g, [[26, 256], [20, 256], [-10, 196], [-4, 196]]); fs(g, C.white, C.line, 2);
  g.fillStyle = C.white; g.fillRect(-24, 198, 48, 6); g.strokeStyle = C.line; g.strokeRect(-24, 198, 48, 6);
  g.beginPath(); g.moveTo(-10, 30); g.bezierCurveTo(-40, 50, -38, 120, -20, 180); g.quadraticCurveTo(-6, 222, 0, 228); g.quadraticCurveTo(6, 222, 20, 180); g.bezierCurveTo(38, 120, 40, 50, 10, 30); g.closePath(); fs(g, C.terra, C.line, 2.5);
  g.save(); g.clip(); g.fillStyle = C.green; g.fillRect(-40, 52, 80, 6); g.fillStyle = C.blue; g.fillRect(-40, 58, 80, 4);
  g.fillStyle = '#2f9a8a'; for (let x = -36; x < 36; x += 9) { poly(g, [[x, 62], [x + 9, 62], [x + 4.5, 82]]); g.fill(); } g.restore();
  g.fillStyle = C.terra; g.fillRect(-9, 18, 18, 14); g.strokeStyle = C.line; g.lineWidth = 2; g.strokeRect(-9, 18, 18, 14);
  g.beginPath(); g.moveTo(-14, 20); g.quadraticCurveTo(-14, -6, 0, -6); g.quadraticCurveTo(14, -6, 14, 20); g.closePath(); fs(g, '#3a302a', C.line, 2);
  g.restore();
}
// Offering table: bread, blue lotus, duck, grapes stacked on reed mat
function offering(g, x, y) {
  g.fillStyle = C.yellow; g.fillRect(x - 70, y - 120, 140, 10); g.strokeStyle = C.line; g.lineWidth = 2; g.strokeRect(x - 70, y - 120, 140, 10);
  g.fillStyle = C.yellow; g.fillRect(x - 8, y - 110, 16, 110); g.strokeRect(x - 8, y - 110, 16, 110); g.fillRect(x - 30, y - 8, 60, 8); g.strokeRect(x - 30, y - 8, 60, 8);
  [[-52, -136, C.terra], [-20, -140, C.yellow], [14, -138, C.terra], [44, -134, '#c8802a']].forEach(([dx, dy, col]) => { g.beginPath(); g.ellipse(x + dx, y + dy, 18, 12, 0, 0, TAU); fs(g, col, C.line, 2); });
  g.beginPath(); g.ellipse(x - 4, y - 166, 40, 13, 0, 0, TAU); fs(g, '#e8e0cc', C.line, 2);
  for (let k = 0; k < 7; k++) { g.beginPath(); g.arc(x + 40 + (k % 3) * 9, y - 176 + Math.floor(k / 3) * 9, 5, 0, TAU); fs(g, '#5a3a7a', C.line, 1.2); }
  // Two blue lotuses hang from table
  [[-60, 1], [60, -1]].forEach(([dx, sg]) => { g.strokeStyle = C.green; g.lineWidth = 3; g.beginPath(); g.moveTo(x + dx * 0.6, y - 120); g.quadraticCurveTo(x + dx * 1.3, y - 80, x + dx * 1.2, y - 30); g.stroke();
    poly(g, [[x + dx * 1.2, y - 30], [x + dx * 1.2 - 12, y - 4], [x + dx * 1.2, y - 12], [x + dx * 1.2 + 12, y - 4]]); fs(g, C.blue, C.line, 1.6); void sg; });
}

// ---------- Static layer (world coordinates +OX, cached) ----------
const WALLTEX = () => P.cached('je_walltex', WW, H, g => {
  const hw = Math.ceil(WW / 2), hh = H / 2, s = P.canvas(hw, hh), sg = s.getContext('2d'), img = sg.createImageData(hw, hh), d = img.data, r = rng(13);
  for (let y = 0; y < hh; y++) for (let x = 0; x < hw; x++) { const n = P.fbm(x * 0.007 + 3, y * 0.007, 4), m = P.fbm(x * 0.05, y * 0.05 + 9, 2), k = (y * hw + x) * 4;
    const col = P.mix(C.wall, C.wall2, clamp(0.35 - n * 1.2)); const v = 1 + m * 0.05 + (r() - 0.5) * 0.04; d[k] = col[0] * v; d[k + 1] = col[1] * v; d[k + 2] = col[2] * v; d[k + 3] = 255; }
  sg.putImageData(img, 0, 0); g.imageSmoothingQuality = 'high'; g.drawImage(s, 0, 0, WW, H);
});
const SURF = () => P.cached('je_surface', WW, H, g => {          // Mural surface (multiply): mottling + hairline cracks + grain
  const hw = Math.ceil(WW / 2), hh = H / 2, s = P.canvas(hw, hh), sg = s.getContext('2d'), img = sg.createImageData(hw, hh), d = img.data, r = rng(99);
  for (let y = 0; y < hh; y++) for (let x = 0; x < hw; x++) { const n = P.fbm(x * 0.012 + 40, y * 0.012, 4), m = P.fbm(x * 0.06, y * 0.06 + 9, 2), v = 243 + n * 30 + m * 12 + (r() - 0.5) * 18, k = (y * hw + x) * 4; d[k] = v; d[k + 1] = v - 6; d[k + 2] = v - 16; d[k + 3] = 255; }
  sg.putImageData(img, 0, 0); g.drawImage(s, 0, 0, WW, H);
  const rr = rng(5); for (let q = 0; q < 9; q++) { let x = rr() * WW, y = rr() < 0.5 ? 0 : rr() * H, a = rr() * TAU; g.strokeStyle = 'rgba(90,70,50,.5)'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 34; k++) { a += (rr() - 0.5) * 0.7; x += Math.cos(a) * 14; y += Math.sin(a) * 14; g.lineTo(x, y); } g.stroke(); }
  for (let x = 0; x < WW; x += W) g.drawImage(P.grain('eg_specks', 0.018, [70, 50, 30], 0.4), x, 0);
});
const GEESE = [[300, 498, 1], [520, 498, -1], [700, 498, 1]];          // Meidum geese (world x, feet y, facing)
const PAPY = [1260, 1760];                                               // Papyrus x range (upper register)
const DISC = [880, 210];
const STATIC = () => P.cached('je_static', WW, H, g => {
  g.drawImage(WALLTEX(), 0, 0); const X = x => x + OX;
  // Top: kheker frieze (bundled reed tips) + colored border
  g.fillStyle = C.cream; g.fillRect(0, 0, WW, 74);
  for (let x = 0, k = 0; x < WW; x += 34, k++) { g.beginPath(); g.moveTo(x + 6, 74); g.lineTo(x + 6, 26); g.quadraticCurveTo(x + 17, 0, x + 28, 26); g.lineTo(x + 28, 74); g.closePath(); fs(g, [C.red, C.blue, C.green][k % 3], C.black, 2);
    g.fillStyle = C.cream; g.fillRect(x + 12, 34, 10, 8); g.fillStyle = C.yellow; g.beginPath(); g.arc(x + 17, 22, 5, 0, TAU); g.fill(); }
  blocks(g, 0, 74, WW, 96, 44, 0);
  // Upper register: hieroglyph panels (three groups)
  glyphCols(g, [X(-120), X(-44), X(32), X(108)], 112, 500, 1350);
  glyphCols(g, [X(1060), X(1132), X(1204)], 112, 520, 1351);
  glyphCols(g, [X(1880), X(1956), X(2032), X(2108), X(2184)], 112, 520, 1352);
  // Winged sun-disk wings (static; disk drawn per frame for pulse)
  const [dx, dy] = [X(DISC[0]), DISC[1]];
  for (const sg2 of [-1, 1]) { for (let r2 = 0; r2 < 3; r2++) { g.beginPath(); g.moveTo(dx + sg2 * 40, dy - 10 + r2 * 12); g.quadraticCurveTo(dx + sg2 * 150, dy - 34 + r2 * 18, dx + sg2 * (250 - r2 * 40), dy - 4 + r2 * 18); g.lineTo(dx + sg2 * (240 - r2 * 40), dy + 12 + r2 * 18); g.quadraticCurveTo(dx + sg2 * 140, dy - 6 + r2 * 18, dx + sg2 * 40, dy + 6 + r2 * 12); g.closePath(); fs(g, [C.blue, C.green, C.red][r2], C.black, 2); }
    for (let f = 0; f < 9; f++) { g.strokeStyle = C.black; g.lineWidth = 1.4; g.beginPath(); g.moveTo(dx + sg2 * (60 + f * 22), dy - 18); g.lineTo(dx + sg2 * (60 + f * 22), dy + 40); g.stroke(); } }
  // Water band below upper register (marsh beneath papyrus)
  g.fillStyle = C.water; g.fillRect(X(1180), 500, 680, 40); g.strokeStyle = C.black; g.lineWidth = 2; g.strokeRect(X(1180), 500, 680, 40);
  // Divider 540, ground760: colored bands
  blocks(g, 0, REG - 8, WW, REG + 8, 38, 1);
  blocks(g, 0, G, WW, G + 16, 38, 2);
  // Middle register: pointed jars, offering table (behind him as he passes)
  jar(g, X(250), G - 256 * 0.86, 0.86); jar(g, X(330), G - 256 * 0.8, 0.8);
  offering(g, X(620), G);
  jar(g, X(1660), G - 256 * 0.86, 0.86);
  offering(g, X(1880), G);
  glyphCols(g, [X(1420), X(1490), X(1560)], 562, 740, 1353);
  // Lower register: Nile (water band + separately animated black zigzags) + bottom dado
  g.fillStyle = C.water; g.fillRect(0, G + 16, WW, 230);
  blocks(g, 0, G + 246, WW, G + 262, 38, 3);
  g.fillStyle = '#7a2a1c'; g.fillRect(0, G + 262, WW, H - G - 262); g.fillStyle = C.black; g.fillRect(0, G + 290, WW, 6); g.fillStyle = C.yellow; g.fillRect(0, G + 296, WW, 3);
});

// ---------- Animated motifs ----------
function goose(c, x, y, fx, t, k) {               // Meidum goose: profile, flat fill, outline; nodding/pecking
  const peck = Math.max(0, Math.sin(t * 2.2 + k * 2.1)) ** 3;
  c.save(); c.translate(x, y); c.scale(fx * 1.2, 1.2);
  c.strokeStyle = C.line; c.lineWidth = 2; c.beginPath(); c.moveTo(-6, -14); c.lineTo(-10, 0); c.moveTo(6, -14); c.lineTo(10, 0); c.stroke();
  c.fillStyle = C.red; c.fillRect(-16, -2, 12, 3); c.fillRect(6, -2, 12, 3);
  c.beginPath(); c.moveTo(-60, -48); c.quadraticCurveTo(-30, -78, 20, -66); c.quadraticCurveTo(44, -56, 40, -36); c.quadraticCurveTo(20, -12, -30, -16); c.quadraticCurveTo(-56, -22, -60, -48); c.closePath(); fs(c, '#d8c8a8', C.line, 2);
  c.save(); c.clip(); c.fillStyle = '#8a6a4a'; c.fillRect(-60, -80, 120, 26); c.strokeStyle = '#4a3a2a'; c.lineWidth = 1.4; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(-50 + i * 14, -64); c.lineTo(-40 + i * 14, -52); c.stroke(); } c.restore();
  c.save(); c.translate(30, -58); c.rotate(peck * 0.9);
  c.beginPath(); c.moveTo(-6, 4); c.quadraticCurveTo(0, -40, 10, -56); c.lineTo(20, -54); c.quadraticCurveTo(12, -34, 8, 6); c.closePath(); fs(c, '#a8886a', C.line, 1.8);
  c.beginPath(); c.ellipse(16, -58, 11, 8, 0, 0, TAU); fs(c, '#6a5a4a', C.line, 1.6); poly(c, [[24, -60], [40, -56], [24, -52]]); fs(c, '#d86a2a', C.line, 1.2);
  c.fillStyle = '#fff'; c.beginPath(); c.arc(18, -60, 2.4, 0, TAU); c.fill();
  c.restore(); c.restore();
}
function papyrus(c, x0, x1, t, camX) {            // Papyrus: stems + umbrella heads, swaying mass; waterbirds fly out
  const r = rng(77);
  for (let i = 0; i < 26; i++) { const bx = lerp(x0, x1, r()) - camX, top = 170 + r() * 120, sw = Math.sin(t * 1.4 + i * 0.7) * 10 * (0.5 + r() * 0.5);
    if (bx < -100 || bx > W + 100) { r(); continue; }
    c.strokeStyle = C.papy; c.lineWidth = 4; c.beginPath(); c.moveTo(bx, 500); c.quadraticCurveTo(bx + sw * 0.3, (500 + top) / 2, bx + sw, top); c.stroke();
    c.save(); c.translate(bx + sw, top); c.rotate(sw * 0.02); poly(c, [[0, 0], [-34, -46], [34, -46]]); fs(c, i % 3 ? C.papyL : C.papy, C.line, 2);
    c.strokeStyle = C.line; c.lineWidth = 1.2; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(k * 15, -46); c.stroke(); } c.fillStyle = C.yellow; c.fillRect(-34, -50, 68, 5); c.restore(); }
  // Waterbirds circle above papyrus, flapping (two wing poses alternate at10fps)
  for (let k = 0; k < 6; k++) { const ph = t * 0.9 + k * 1.05, bx = (x0 + x1) / 2 + Math.cos(ph) * 220 + (k - 2.5) * 30 - camX, by = 200 + Math.sin(ph * 1.3) * 60 + k * 8; if (bx < -60 || bx > W + 60) continue;
    const up = Math.floor(t * 10 + k) % 2, fx = Math.sin(ph) < 0 ? 1 : -1;
    c.save(); c.translate(bx, by); c.scale(fx, 1); c.beginPath(); c.ellipse(0, 0, 18, 8, 0, 0, TAU); fs(c, k % 2 ? C.white : '#5a8ab0', C.line, 1.6);
    c.beginPath(); c.arc(18, -4, 6, 0, TAU); fs(c, k % 2 ? C.green : '#2a3a5a', C.line, 1.4); poly(c, [[23, -4], [32, -2], [23, 0]]); fs(c, C.yellow, null);
    poly(c, up ? [[-6, -2], [-16, -30], [6, -4]] : [[-6, 2], [-18, 22], [6, 4]]); fs(c, k % 2 ? '#c8d8e8' : '#3a6a9a', C.line, 1.4); c.restore(); }
}
function nile(c, t, camX) {                       // Lower register: black water zigzags flow left, fish swim, blue lotus nods
  const y0 = G + 30, y1 = G + 236, step = 26, off = (t * 60) % (step * 2);
  c.save(); c.strokeStyle = '#13213f'; c.lineWidth = 3; c.lineJoin = 'miter';
  for (let y = y0; y < y1; y += 30) { c.beginPath(); const sh = ((y / 30) % 2) * step; for (let x = -step * 2 - off + sh - (camX % (step * 2)); x < W + step * 2; x += step) { const yy = y + ((Math.round((x + off - sh + camX) / step)) % 2 ? 9 : -9); x === -step * 2 - off + sh - (camX % (step * 2)) ? c.moveTo(x, yy) : c.lineTo(x, yy); } c.stroke(); }
  c.restore();
  const r = rng(19);
  for (let k = 0; k < 9; k++) { const sp = 30 + r() * 40, dir = r() < 0.5 ? -1 : 1, base = r() * (w + 400) - 200, fy = y0 + 30 + r() * 160;
    let wx = base + dir * sp * t; wx = ((wx + 300) % (w + 600) + (w + 600)) % (w + 600) - 300; const fx = wx - camX; if (fx < -80 || fx > W + 80) continue;
    const wig = Math.sin(t * 9 + k) * 0.12;
    c.save(); c.translate(fx, fy); c.scale(dir, 1); c.rotate(wig * 0.3);
    c.beginPath(); c.ellipse(0, 0, 30, 14, 0, 0, TAU); fs(c, k % 2 ? '#8aa0b8' : '#c8a060', C.black, 1.8);
    poly(c, [[-26, 0], [-44, -12 + wig * 30], [-44, 12 + wig * 30]]); fs(c, k % 2 ? '#8aa0b8' : '#c8a060', C.black, 1.6);
    c.strokeStyle = C.black; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-10, -12); c.quadraticCurveTo(4, -22, 18, -10); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.arc(18, -3, 3.2, 0, TAU); c.fill(); c.fillStyle = C.black; c.beginPath(); c.arc(19, -3, 1.6, 0, TAU); c.fill();
    c.restore(); }
  for (let k = 0; k < 14; k++) { const lx = k * 170 + 40 - camX; if (lx < -40 || lx > W + 40) continue; const nod = Math.sin(t * 2 + k) * 0.12;
    c.save(); c.translate(lx, G + 18); c.rotate(nod); c.strokeStyle = C.green; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 30); c.lineTo(0, -10); c.stroke();
    poly(c, [[0, -8], [-14, -36], [-5, -30], [0, -44], [5, -30], [14, -36]]); fs(c, k % 2 ? C.blue : C.white, C.line, 1.6); c.restore(); }
}
// Winged sun disk: red disk + two uraei, pulsing halo
function disc(c, x, y, t) { const pu = 0.5 + 0.5 * Math.sin(t * TAU / 0.9);
  const hg = c.createRadialGradient(x, y, 30, x, y, 80 + 20 * pu); hg.addColorStop(0, `rgba(255,180,80,${0.35 * pu + 0.1})`); hg.addColorStop(1, 'rgba(255,170,70,0)'); c.fillStyle = hg; c.fillRect(x - 110, y - 110, 220, 220);
  c.beginPath(); c.arc(x, y, 34, 0, TAU); fs(c, '#c8372b', '#7a1c14', 3);
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x + s * 30, y + 26); c.quadraticCurveTo(x + s * 44, y + 6, x + s * 38, y - 14); c.lineWidth = 6; c.strokeStyle = C.gold; c.stroke(); c.beginPath(); c.arc(x + s * 38, y - 16, 6, 0, TAU); fs(c, C.gold, C.black, 1.4); } }

// ---------- Scarab (top view: lapis body, turquoise wing cases), faces left pushing red solar ball ----------
function scarab(c, x, y, s, t) {
  c.save(); c.translate(x, y); c.scale(s, s); c.lineCap = 'round'; c.lineJoin = 'round'; c.rotate(-Math.PI / 2);
  const pose = Math.floor(t * 15) % 2;
  c.strokeStyle = '#141a30'; c.lineWidth = 3;                  // Legs: alternate two poses
  const legs = pose ? [[-14, -16, -26], [0, -18, -6], [14, -14, 18]] : [[-14, -14, -32], [0, -19, 2], [14, -18, 24]];
  legs.forEach(([ly, lx, ex]) => { for (const sg of [-1, 1]) { c.beginPath(); c.moveTo(sg * 10, ly + 14); c.lineTo(sg * 24, ly + 14 + (ex - ly) * 0.3); c.lineTo(sg * 30, ly + 24 + (pose ? 3 : -3) * sg); c.stroke(); } void lx; });
  c.beginPath(); c.ellipse(0, 8, 17, 23, 0, 0, TAU); fs(c, C.lapis, '#0d1430', 2.2);
  c.beginPath(); c.moveTo(0, -12); c.lineTo(0, 30); c.stroke();
  c.fillStyle = C.turq; c.beginPath(); c.ellipse(-7, 6, 4, 13, 0.1, 0, TAU); c.fill(); c.beginPath(); c.ellipse(7, 6, 4, 13, -0.1, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(0, -18, 12, 8, 0, 0, TAU); fs(c, '#3a68c4', '#0d1430', 2);
  c.beginPath(); c.moveTo(-10, -24); for (let k = 0; k < 5; k++) c.lineTo(-10 + k * 5, -28 - (k % 2) * 4); c.lineTo(10, -24); fs(c, '#3a68c4', '#0d1430', 1.6);
  const by = -52, br = 23;                                       // Solar ball: ahead of head, rotates while rolling
  c.beginPath(); c.arc(0, by, br, 0, TAU); fs(c, '#c8302a', '#3a0c08', 2.2);
  c.save(); c.clip(); c.fillStyle = '#f2c23a'; for (let k = 0; k < 6; k++) { const a = t * 10 + k * 1.05; c.beginPath(); c.arc(Math.cos(a) * br * 0.55, by + Math.sin(a) * br * 0.55, 3.4, 0, TAU); c.fill(); } c.restore();
  c.restore();
}
// Scarab world position (ta = action seconds): rolls left, passes beneath him, exits frame
const SC_S = 1.9, scX = ta => AX + 52 * SC_S + V_SC * (T_HIT - ta);   // Scarab body center; ball 52*SC_S to left, reaches feet at T_HIT
function scarabWorld(c, s, seg) {
  const ta = XJ.ta(seg, s); if (ta < -3 || ta > 6) return;
  const x = scX(ta) - s.camX; if (x < -200 || x > W + 150) return;
  scarab(c, x, G - 23 * SC_S - 3, SC_S, s.t);
}
// ---------- Hero texture: plaster mottling multiply (character only), whites stay white ----------
const heroMat = (g, ww, hh, i) => {
  XJ.texInside(g, ww, hh, (tg, w2, h2) => { const S = SURF(); tg.drawImage(S, -((i * 137) % 600) - 200, -300); });
};

WORLD.add({
  id: '02_egypt', year: -1350, name: '古埃及壁画', w, burst: 'jia_egypt', labelColor: 'rgba(42,24,16,.85)',
  hero: { walk: K.walk, h: 300, fps: WALK.fps,   // Walk cycle 8 frames (4 per step); fps from measured stride, foot lock in XJ.walkLock
    shadow: null, draw(c, key, i, o, S) { if (key === K.act) { const gw = XJ.glideWalk(S, DUR, WALK.fps, 8, 0.22, true); if (gw != null) { key = K.walk; i = gw; } } if (key === K.walk) o.lock = (S.act ? 0 : XJ.walkLock({ w }, S, i, WALK.st, WALK.fps)); XJ.actor(c, key, i, o, 'egypt', heroMat); } },
  acts: [{ at: AT, dur: DUR, key: K.act, lead: 0, ...XJ.glide(DUR),
    frame: XJ.actFrame([[0, 1], [0.22, 2], [0.3, 3], [0.42, 4], [1.04, 5], [1.2, 6], [1.4, 7]]),
    y: (lx, u) => G - 140 * Math.sin(Math.PI * clamp((u - 0.22) / 0.9)) }],
  back(c, s) {
    c.drawImage(STATIC(), -OX - s.camX, 0);
    if (XJ.vis(s, DISC[0], 400)) disc(c, DISC[0] - s.camX, DISC[1], s.t);
    GEESE.forEach(([x, y, f], k) => { if (XJ.vis(s, x, 120)) goose(c, x - s.camX, y, f, s.t, k); });
    papyrus(c, PAPY[0], PAPY[1], s.t, s.camX);
    nile(c, s.t, s.camX);
    scarabWorld(c, s, this);
    c.save(); c.globalCompositeOperation = 'multiply'; c.drawImage(SURF(), -OX - s.camX, 0); c.restore();
  },
  front(c, s) {
    // Small golden dust puff beneath jumping feet (Egyptian-style triangular specks)
    const ta = XJ.ta(this, s);
    if (ta > 1.1 && ta < 1.5) { const q = (ta - 1.1) / 0.4, x = AX - s.camX; c.save(); c.globalAlpha = 1 - q; c.fillStyle = C.gold; for (let k = 0; k < 8; k++) { const a = Math.PI + (k / 7) * Math.PI, d = 30 + q * 60; c.beginPath(); c.arc(x + Math.cos(a) * d, G - 6 + Math.sin(a) * d * 0.3, 4, 0, TAU); c.fill(); } c.restore(); }
  },
  // Incoming Egyptian boundary: vertical four-color border (tomb mural framing language)
  seam(c, y, sx, t) { const k = Math.floor((y + 1000) / 36), yy = (y + 1000) % 36; c.fillStyle = yy < 3 ? C.black : BAND[k % 4]; c.fillRect(sx - 10, y, 20, 6); c.fillStyle = C.black; c.fillRect(sx - 12, y, 2, 6); c.fillRect(sx + 10, y, 2, 6); },
});
})();
