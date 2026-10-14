// 1899 Monet's Japanese Bridge over the Water-Lily Pond. World = horizontal Giverny garden: willow shade, green arch bridge, hanging wisteria, lilies, water light, dragonflies.
// Demo interaction: skips flat gray-white stone from bridge4 times, intervals and arcs increase; ripples spread; fourth splash raises a lily matching pond flowers; he cheers.
// Technique: XING.monetWorld (underpainting→regional short strokes, bridge/near railing separate layer, prepainted lilies); hero uses XING monet texture (short strokes + world-space sliding light spots).
if (!window.YI) { const x = new XMLHttpRequest(); x.open('GET', 'demos/long_scroll/lib/xing2_yi.js', false); x.send(); (0, eval)(x.responseText + '\n//# sourceURL=demos/long_scroll/lib/xing2_yi.js'); }
(() => {
const W = 1920, H = 1080, TAU = Math.PI * 2, { clamp, lerp, ss } = U, P = PAINT, G = WORLD.GROUND;
const SW = 2150, AT = 760;
const MO = { key: 'yi_m', x0: 0, w: SW, waterTop: 560, bridge: { x0: 320, x1: 1200, yEnd: G, lift: 165 }, pond: [300, 1240], groundY: G };
const M = () => XING.monetWorld(MO);
// Events relative to action r (r = S.t - WORLD.actT(ME)). Demo:4 skips over1.36s, increasing intervals (0.22/0.30/0.38/0.46), increasing arc heights
let ME = null; const TA = 0;
const THROW = [[0, 0], [0.18, 1], [0.36, 2], [0.44, 3], [0.5, 4], [0.66, 5]], REL = 0.5;
const throwFrame = u => { let f = 0; for (const [tt, i] of THROW) if (u >= tt) f = i; return f; };
// Stone:4 skips after release (world coordinates, action seconds), approaches/grows; fourth splash raises lily
const HOPS = [{ x: AT + 170, y: 790, t: REL + 0.22, s: 0.5 }, { x: AT + 290, y: 850, t: REL + 0.52, s: 0.62, peak: 110 }, { x: AT + 390, y: 915, t: REL + 0.9, s: 0.74, peak: 150 }, { x: AT + 460, y: 985, t: REL + 1.36, s: 0.86, peak: 190 }];
const HIT = HOPS[3].t, DUR = HIT + 0.2;
const frameAt = u => u < 0.66 ? throwFrame(u) : u < HIT ? 5 : 6;
const plan = () => { const from = ACT.stoneFrom(AT, M().deckY(AT), 300); return { t0: TA + REL, from, s0: 0.4, firstArc: 90, hops: HOPS.map(h => ({ ...h, t: TA + h.t })) }; };
// Stone: Monet-stroked flat gray-white pebble (pale-purple shadows + cream highlights), rotating flight; trail of creamy foam strokes
function stone(c, st, trail) { if (!st) return; const sc = 1 + st.s * 1.3, flat = Math.abs(Math.cos(st.spin)) * 0.5 + 0.28;
  c.save(); c.lineCap = 'round';
  if (trail) for (let k = 1; k <= 5; k++) { const p = trail(k * 0.02); if (!p) break; c.strokeStyle = '#fffbea'; c.globalAlpha = 0.45 * (1 - k / 6); c.lineWidth = 6 * sc * (1 - k / 7); c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + 3, p.y); c.stroke(); }
  c.globalAlpha = 1; c.translate(st.x, st.y);
  c.fillStyle = 'rgba(70,72,120,.28)'; c.beginPath(); c.ellipse(2, 5, 13 * sc, 4 * sc, 0, 0, TAU); c.fill();
  [['#8a88a0', 0, 2, 13, 0.0], ['#b8b4c4', -2, 0, 11, -0.2], ['#d8d4e0', 1, -1.5, 8, 0.15], ['#efeaf2', -3, -2.5, 5, -0.1], ['#fffbea', -4, -3.4, 3, 0]].forEach(([col, dx, dy, L, a]) => {
    c.strokeStyle = col; c.lineWidth = 7 * sc * flat; c.beginPath(); c.moveTo((dx - L / 2) * sc, (dy + a * 10) * sc * flat); c.lineTo((dx + L / 2) * sc, (dy - a * 10) * sc * flat); c.stroke(); });
  c.restore(); }
// Emerging lily: same technique/size as pond (monetWorld leaf + flower → same short-stroke parameters), cached
let BLOOM = null;
function bloomImg() { if (BLOOM) return BLOOM; const s = 0.22 + 0.78 * clamp((985 - 560) / (H - 560)), rx = 36 * s * 1.7, ry = rx * (0.24 + 0.1 * s), pw = Math.ceil(rx * 2 + 16), ph = Math.ceil(ry * 2 + 34 * s + 16);
  const cc = P.canvas(pw, ph), q = cc.getContext('2d'), cx = pw / 2, cy = ph - ry - 8, notch = 1.2;
  q.fillStyle = '#7aa85a'; q.beginPath(); q.ellipse(cx, cy, rx, ry, 0, notch + 0.35, notch + TAU - 0.35); q.lineTo(cx, cy); q.closePath(); q.fill();
  q.fillStyle = 'rgba(40,70,60,0.35)'; q.beginPath(); q.ellipse(cx, cy + ry * 0.25, rx * 0.95, ry * 0.7, 0, 0, Math.PI); q.fill();
  const fr = 11 * s * 1.6 + 3; q.fillStyle = '#f2a6bf'; q.beginPath(); q.ellipse(cx + rx * 0.15, cy - fr * 0.5, fr * 1.4, fr * 0.8, 0, 0, TAU); q.fill(); q.fillStyle = '#fff0f2'; q.beginPath(); q.ellipse(cx + rx * 0.15, cy - fr * 0.8, fr * 0.6, fr * 0.45, 0, 0, TAU); q.fill();
  const out = P.canvas(pw, ph), og = out.getContext('2d'); og.drawImage(cc, 0, 0); og.globalCompositeOperation = 'source-atop';
  XING.strokes(og, cc, { cell: Math.max(3, 5 * s + 1), len: 10 * s + 5, width: 3 * s + 1.6, seed: 4242, alphaMask: true, alphaMin: 100, angle: (x, y, rr) => (rr() - 0.5) * 0.4,
    palette: (x, y, col, rr) => { const L = col[0] * 0.3 + col[1] * 0.59 + col[2] * 0.11; return col[1] > col[0] + 10 ? P.mix(P.hex(['#5f8f4a', '#7fae5a', '#9cc070', '#b4cc78', '#4a7a5a', '#c8d880'][(rr() * 6) | 0]), col, 0.3) : (L > 170 ? P.mix(P.hex(['#fff2f4', '#f7d0dc', '#fbf4e8', '#f0a0b8'][(rr() * 4) | 0]), col, 0.4) : null); } });
  out.ax = cx; out.ay = cy; return BLOOM = out; }

// Wisteria: pale-purple flower clusters hanging above bridge (dots decreasing in size, wind sway)
function wisteria(c, camX, t) {
  const B = MO.bridge, deck = M().deckY; c.save();
  // Wisteria trellis: leafy green arch above bridge
  c.lineCap = 'round'; c.strokeStyle = '#4f9a72'; c.lineWidth = 8; c.beginPath(); for (let wx = B.x0 + 40; wx <= B.x1 - 40; wx += 10) { const y = deck(wx) - 235; wx === B.x0 + 40 ? c.moveTo(wx - camX, y) : c.lineTo(wx - camX, y); } c.stroke();
  [B.x0 + 40, B.x1 - 40].forEach(wx => { c.beginPath(); c.moveTo(wx - camX, deck(wx) - 235); c.lineTo(wx - camX, deck(wx) - 10); c.stroke(); });
  for (let k = 0; k < 40; k++) { const wx = B.x0 + 50 + k * (B.x1 - B.x0 - 100) / 39, x = wx - camX + Math.sin(t * 1.8 + k) * 2; if (x < -40 || x > W + 40) continue; c.fillStyle = ['#6f9a40', '#9cbf58', '#4f7f3a'][k % 3]; c.beginPath(); c.ellipse(x, deck(wx) - 238 + (k % 3) * 5, 16, 7, (k % 5) * 0.6, 0, TAU); c.fill(); }
  for (let k = 0; k < 18; k++) { const wx = B.x0 + 70 + k * ((B.x1 - B.x0 - 140) / 17), x = wx - camX; if (x < -60 || x > W + 60) continue;
    const top = deck(wx) - 230, L = 7 + (k * 7) % 6, sw = Math.sin(t * 2.4 + 0.9 * k) * 8;
    for (let i = 0; i < L; i++) { const q = i / L, r = 9 * (1 - q * 0.7); c.fillStyle = ['#b8a0d8', '#d0bce8', '#9a84c8', '#e4d4f0'][(i + k) % 4]; c.globalAlpha = 0.92; c.beginPath(); c.ellipse(x + sw * q * q + Math.sin(i * 2.1 + k) * 4, top + i * 11, r, r * 0.8, 0, 0, TAU); c.fill(); } }
  c.restore();
}
// Dragonflies: zigzag above water, flickering wings
function dragonflies(c, camX, t) {
  c.save(); for (let k = 0; k < 3; k++) { const ph = k * 2.3, x = 700 + k * 380 + Math.sin(t * 0.9 + ph) * 160 + Math.sin(t * 3.1 + ph) * 30 - camX, y = 640 + k * 70 + Math.sin(t * 1.7 + ph) * 40;
    c.strokeStyle = '#3a6a8a'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - 18, y); c.lineTo(x + 14, y); c.stroke();
    const f = 0.5 + 0.5 * Math.sin(t * 40 + k); c.fillStyle = 'rgba(230,240,255,.75)'; [[-1, -1], [1, -1]].forEach(([a]) => { c.beginPath(); c.ellipse(x + 2 + a * 4, y - 6 * f, 12, 3.5, a * 0.4, 0, TAU); c.fill(); }); }
  c.restore();
}

WORLD.add(ME = { id: '28_monet', year: 1899, name: '莫奈《睡莲池上的日本桥》', w: SW, burst: 'monet', labelColor: 'rgba(16,22,40,.92)',
  hero: { walk: 'monet_walk', mat: 'monet', shadow: 'rgba(60,70,120,.18)', draw(c, key, i, o) { YI.whitenHat(key); XING.actor(c, key, i, o); } },
  ground: lx => M().deckY(lx),
  acts: [{ at: AT, dur: DUR, key: 'monet_throw', frame: frameAt, lead: 0 }],
  back(c, S) {
    const lt = S.t - WORLD.actT(ME), pl = plan();
    YI.edge(c, M().bg, S.camX, SW);
    XING.monetBack(c, M(), S.camX, lt, { hops: pl.hops.map((p, i) => ({ x: p.x, y: p.y, t: p.t, s: p.s, big: i === 3 })) });
    dragonflies(c, S.camX, lt);
    wisteria(c, S.camX, lt);
    // Fourth skip: lily emerges from splash — leaf rises first, petals spring open, then rock gently with ripples
    if (lt >= HIT + 0.06) { const a = lt - HIT - 0.06, x = HOPS[3].x - S.camX, y = HOPS[3].y, im = bloomImg(), rise = U.ease.out(clamp(a / 0.45)), bob = Math.sin(a * 9) * 3 * Math.exp(-a * 2);
      if (x > -200 && x < W + 200) { c.save(); c.globalAlpha = clamp(a / 0.15); c.translate(x, y + (1 - rise) * 14 + bob); c.scale(1, 0.3 + 0.7 * rise); c.drawImage(im, -im.ax, -im.ay); c.restore(); } }
  },
  front(c, S) {
    const lt = S.t - WORLD.actT(ME), u = S.act ? S.act.u : -1;
    XING.monetFront(c, M(), S.camX, lt, [200, 1600, 2000]);
    { const pl = plan(), sh = p => p ? { ...p, x: p.x - S.camX } : null; stone(c, sh(XING.stone(lt, pl)), dt => sh(XING.stone(lt - dt, pl))); }
  },
  // Incoming boundary: Impressionist short strokes (pink, blue, green, cream), slight tremble
  seam(c, y, sx, t) {
    const k = Math.floor(y / 6), cols = ['#f2a6bf', '#9db5e0', '#9cc070', '#fff2d4', '#b7a6d8', '#8fdcae'];
    c.save(); c.lineCap = 'round'; c.strokeStyle = cols[k % 6]; c.lineWidth = 7; const a = -0.5 + U.hash(k, 3) * 0.6, L = 12 + U.hash(k, 4) * 10, x = sx + (U.hash(k, 6) - 0.5) * 10 + Math.sin(t * 4 + k) * 1.5;
    c.beginPath(); c.moveTo(x - Math.cos(a) * L / 2, y + 3 - Math.sin(a) * L / 2); c.lineTo(x + Math.cos(a) * L / 2, y + 3 + Math.sin(a) * L / 2); c.stroke(); c.restore();
  },
});
})();
