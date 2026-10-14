// S02 · Whiteboard drawing (y3 RSA: one large board, camera, marker). Grammar references/动画语法/y3_whiteboard.md.
// Write each spoken phrase 0.3–0.5s after voiceover; black lines + orange sole accent.
// Block one: 2002 → Musk stick figure → arrow → SpaceX; camera moves to goal block: Earth → rocket follows orange dashes to hatched planet → small house; end pulls back to whole board.
// Incoming paperSlide (transitions/paperSlide.js): white sheet covers previous coral title card from right.
(() => {
const W = 1920, H = 1080, ID = 's02';
const { clamp, lerp } = U;
const INK = '#0A0503', OR = '#EF7226', BOARD = '#FBFBFB';
const SPEED = 2600;
let B = null, CAMK = null, END = 0;

function build() {
  const q = k => TM.cue(ID, k);
  const tY = q('2002年'), tM = q('马斯克'), tS = q('SpaceX'), tG = q('目标'), tR = q('有一天'), tP = q('别的星球'), tZ = q('住到');
  B = DG.board({ ink: INK, lw: 6.5, speed: SPEED, font: '"LXGWWenKai-500"' });
  const arc = DG.arcPts;
  // ===== Block one =====
  B.at(Math.max(0.52, tY + 0.3)); B.text('2002年', 260, 380, 150, { rate: 12 });
  // Stick figure (no face): head, body, arms, legs.
  B.at(Math.max(B.cur, tM - 0.38));
  B.line(arc(430, 470, 44, 48, -Math.PI / 2, Math.PI * 1.55, 22), { w: 7 });
  B.line([[430, 520], [432, 600], [430, 680]], { w: 7 });
  B.line([[350, 600], [390, 570], [432, 560], [476, 572], [520, 548]], { w: 7 });
  B.line([[372, 790], [404, 740], [430, 680], [458, 740], [490, 792]], { w: 7 });
  B.text('马斯克', 430, 875, 66, { align: 'center', rate: 16 });
  // Arrow → SpaceX (plain handwriting, no wordmark).
  B.at(Math.max(B.cur, tS - 0.28));
  B.line([[548, 620], [640, 610], [722, 616]], { speed: SPEED * 1.4 });
  B.line([[694, 590], [726, 616], [692, 642]], { smooth: false, speed: SPEED * 1.4 });
  B.text('SpaceX', 768, 650, 128, { rate: 18 });
  B.line([[772, 690], [960, 700], [1150, 688]], { col: OR, w: 9, speed: SPEED * 1.6 });
  // ===== Block two (camera moves smoothly at 2.45→3.25) =====
  B.at(Math.max(B.cur + 0.05, tG + 0.3)); B.text('目标', 1440, 330, 118, { col: OR, rate: 11 });
  // Earth: circle + two continents.
  B.at(Math.max(B.cur, tG + 0.55));
  B.line(DG.ellipsePts(1560, 640, 140, 140, -Math.PI / 2, 1.04, 48), { w: 7 });
  B.line([[1452, 560], [1490, 536], [1540, 548], [1566, 532], [1600, 556], [1572, 590], [1588, 626], [1546, 640], [1528, 610], [1494, 622], [1466, 600], [1452, 560]], { w: 5, speed: SPEED * 2.2 });
  B.line([[1556, 690], [1610, 668], [1662, 684], [1676, 718], [1640, 750], [1600, 772], [1584, 740], [1556, 690]], { w: 5, speed: SPEED * 2.2 });
  // Small rocket leaves orange dashed path from Earth to planet (animated element, no hand).
  const P0 = [1655, 545], P1 = [2000, 250], P2 = [2300, 470];
  const bez = u => [lerp(lerp(P0[0], P1[0], u), lerp(P1[0], P2[0], u), u), lerp(lerp(P0[1], P1[1], u), lerp(P1[1], P2[1], u), u)];
  const pts = []; for (let i = 0; i <= 60; i++) pts.push(bez(i / 60));
  const cum = DG.cum(pts), L = cum[cum.length - 1];
  const fly0 = Math.max(B.cur + 0.05, tR + 0.25), fly1 = fly0 + 1.0;
  B.push({ kind: 'custom', t0: fly0, t1: fly1, handed: false, start: () => P0, end: () => P2,
    draw(g, qq) {
      const e = MO.sineInOut(qq), d = L * e;
      g.save(); g.strokeStyle = OR; g.lineWidth = 6; g.setLineDash([22, 16]); DG.drawPartial(g, pts, cum, Math.max(0, d - 40)); g.setLineDash([]);
      // Arrowhead drawn at destination after arrival.
      const [x, y] = DG.pointAt(pts, cum, d), [x2, y2] = DG.pointAt(pts, cum, Math.min(L, d + 2)), a = Math.atan2(y2 - y, x2 - x) || 0.3;
      if (qq >= 1) { g.lineWidth = 6; g.beginPath(); g.moveTo(x - Math.cos(a - 0.5) * 30, y - Math.sin(a - 0.5) * 30); g.lineTo(x, y); g.lineTo(x - Math.cos(a + 0.5) * 30, y - Math.sin(a + 0.5) * 30); g.stroke(); }
      else { // Small rocket (line art).
        g.translate(x, y); g.rotate(a + Math.PI / 2); g.strokeStyle = INK; g.fillStyle = BOARD; g.lineWidth = 5; g.lineJoin = 'round';
        g.beginPath(); g.moveTo(0, -38); g.quadraticCurveTo(16, -22, 14, 4); g.lineTo(14, 22); g.lineTo(-14, 22); g.lineTo(-14, 4); g.quadraticCurveTo(-16, -22, 0, -38); g.closePath(); g.fill(); g.stroke();
        g.beginPath(); g.moveTo(-14, 8); g.lineTo(-26, 26); g.lineTo(-14, 22); g.moveTo(14, 8); g.lineTo(26, 26); g.lineTo(14, 22); g.stroke();
        g.fillStyle = OR; g.beginPath(); g.moveTo(-8, 26); g.lineTo(0, 46 + 6 * Math.sin(qq * 40)); g.lineTo(8, 26); g.closePath(); g.fill();
      }
      g.restore(); return null;
    } });
  // Other planet: circle + orange hatching + small house.
  B.at(Math.max(fly0 + 0.55, tP + 0.05));
  const MX = 2420, MY = 500, MR = 112;
  B.line(DG.ellipsePts(MX, MY, MR, MR, Math.PI, 1.04, 44), { w: 7, speed: SPEED * 1.3 });
  for (let d = -84; d <= 84; d += 21) { const h = Math.sqrt(MR * MR - d * d) * 0.86, nx = Math.SQRT1_2, ux = Math.SQRT1_2;
    const cx = MX + nx * d, cy = MY + nx * d; B.line([[cx - ux * h, cy + ux * h], [cx + ux * h, cy - ux * h]], { col: OR, w: 5, speed: SPEED * 3.2, gap: 0.004, min: 0.025 }); }
  B.at(Math.max(B.cur, tZ + 0.62));
  B.line([[2378, 394], [2378, 306], [2462, 306], [2462, 394]], { w: 7, speed: SPEED * 1.4, smooth: false });
  B.line([[2358, 314], [2420, 250], [2482, 314]], { w: 7, speed: SPEED * 1.4, smooth: false });
  B.line([[2408, 394], [2408, 350], [2434, 350], [2434, 394]], { w: 6, speed: SPEED * 1.8, smooth: false });
  END = B.cur;
  // Camera: block one → smooth sineInOut move to block two → whole-board pullback.
  const mv0 = Math.max(tG - 0.15, 2.4), out0 = Math.max(END + 0.08, TM.vo(ID)[1] - 0.25);
  CAMK = [
    { t: 0, x: 700, y: 600, z: 1.08 },
    { t: mv0, x: 724, y: 604, z: 1.11, ease: MO.sineInOut },
    { t: mv0 + 0.8, x: 2080, y: 560, z: 1.1, ease: MO.sineInOut },        // After settling, block one (including SpaceX) is fully offscreen, no clipped text.
    { t: out0, x: 2094, y: 556, z: 1.12, ease: MO.sineInOut },
    { t: out0 + 0.6, x: 1390, y: 600, z: 0.7, ease: MO.sineInOut },
    { t: out0 + 3, x: 1390, y: 600, z: 0.69, ease: MO.sineInOut },
  ];
}

const smudge = () => PAINT.cached('s02smudge', 1024, 1024, g => { const r = U.rng(5); for (let i = 0; i < 22; i++) { g.fillStyle = `rgba(120,120,130,${0.0015 + r() * 0.0025})`; g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 80 + r() * 200, 14 + r() * 40, r() * 3, 0, 7); g.fill(); } });

SCENES[ID] = {
  init() { U.assertGlyphs('LXGWWenKai-500', '2002年马斯克SpaceX目标', ID); build(); },
  draw(c, lt, t) {
    if (!B) build();
    const cam = CAM.at(CAMK, lt);
    c.fillStyle = BOARD; c.fillRect(0, 0, W, H);
    c.save(); const ox = -(((cam.x * cam.z) % 1024) + 1024) % 1024, oy = -(((cam.y * cam.z) % 1024) + 1024) % 1024;
    c.translate(ox, oy); c.fillStyle = c.createPattern(smudge(), 'repeat'); c.fillRect(0, 0, W + 1024, H + 1024); c.restore();
    c.save(); CAM.apply(c, cam); const { tip, col } = B.draw(c, lt); c.restore();
    // Pen: follows tip while drawing, arcs between strokes, exits lower right 0.25s after completion.
    let [hx, hy] = B.penAt(lt, cam, tip);
    const out = MO.cubicIn(clamp((lt - END - 0.2) / 0.4)), inn = MO.cubicOut(clamp((lt - 0.3) / 0.25));
    hx = lerp(lerp(W * 0.9, hx, inn), W + 200, out); hy = lerp(lerp(H * 1.1, hy, inn), H + 300, out);
    DG.pen(c, hx, hy, col || B.penColor(lt), Math.sin(lt * 7) * 0.03);
  },
};
ERAS.find(e => e.id === ID).transition = { type: 'paperSlide', dur: 0.5 };
})();
