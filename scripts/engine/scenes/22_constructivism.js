// 1924 Russian Constructivist poster (Rodchenko / El Lissitzky) — entirely procedural.
// Pipeline: ① cached base (aged cream paper, diagonal red floor, black circle, halftone photo and Shukhov Tower in window, small typographic elements)
//      → ② animated motifs (red wedge pierces black circle, radio waves expand from tower top, dashed ring rotates around circle, slogan letters stamp in then bounce in a wave)
//      → ③ characters: flat paper cutouts (Komsomol girl with red headscarf), 45° photographic halftone skin (photomontage), white cut edges
SCENES['22_constructivism'] = (() => {
  const W = 1920, H = 1080, { clamp, lerp, ease } = U, P = PAINT, TAU = Math.PI * 2;
  const C = { paper: '#e9dfc4', red: '#c8231c', redD: '#8f1711', ink: '#151311', cream: '#f4ecd6', gray: '#4a4640', ochre: '#e3b03e', ochreD: '#a87a1c', orange: '#e2741c' };
  const poly = U.poly;

  // Halftones: P.halftoneGray (grayscale photographic dots, core of photomontage), P.shadeDots (function-distributed dots inside paths for shadows)
  const halftone = P.halftoneGray, shadeDots = P.shadeDots;

  // ---------- Geometric Cyrillic letters (5×7 modules, Rodchenko-style hand-drawn block lettering) ----------
  const GL = {
    'П': [[0, 0, 5, 1.3], [0, 0, 1.3, 7], [3.7, 0, 1.3, 7]],
    'Е': [[0, 0, 1.3, 7], [0, 0, 5, 1.3], [0, 2.9, 4, 1.2], [0, 5.7, 5, 1.3]],
    'Т': [[0, 0, 5, 1.3], [1.85, 0, 1.3, 7]],
    'Ч': [[0, 0, 1.3, 4], [3.7, 0, 1.3, 7], [0, 2.9, 5, 1.2]],
    'А': [{ p: [[0, 7], [1.8, 0], [3.2, 0], [1.4, 7]] }, { p: [[5, 7], [3.2, 0], [1.8, 0], [3.6, 7]] }, [1.0, 4.3, 3.0, 1.15]],
    'Й': [[0, 1.7, 1.3, 5.3], [3.7, 1.7, 1.3, 5.3], { p: [[1.3, 5.5], [3.7, 2.0], [3.7, 3.7], [1.3, 7]] }, [1.2, 0, 2.6, 1.0]],   // Keep the breve inside the glyph cell: protruding marks get covered by adjacent letters/characters (found in first version)
    '!': [[1.85, 0, 1.3, 4.8], [1.85, 5.7, 1.3, 1.3]],
  };
  function glyph(c, ch, x, y, u) {
    const g = GL[ch]; if (!g) return;
    // Fill each component separately: opposite winding of diagonal legs in one path cancels into holes under nonzero fill (found with А in first version)
    g.forEach(r => { c.beginPath(); if (r.p) { r.p.forEach((q, i) => i ? c.lineTo(x + q[0] * u, y + q[1] * u) : c.moveTo(x + q[0] * u, y + q[1] * u)); c.closePath(); } else c.rect(x + r[0] * u, y + r[1] * u, r[2] * u, r[3] * u); c.fill(); });
  }

  // ---------- ① Base ----------
  const TOWER = [[540, 170, 430, 108], [430, 100, 342, 70], [342, 66, 268, 47], [268, 44, 208, 32], [208, 30, 168, 22]];
  const TX = 600;
  const bg = () => P.cached('cs_bg', W, H, (g) => {
    g.drawImage(P.texture('cs_paper', C.paper, { scale: 0.0035, amt: 16, grain: 18, seed: 5, dark: '#d9c9a4' }), 0, 0);
    // Left typography: diagonal black bar, red square, several black bars for body text
    g.save(); g.translate(170, 610); g.rotate(-0.5); g.fillStyle = C.ink; g.fillRect(-260, -30, 560, 58); g.restore();
    g.save(); g.translate(150, 200); g.rotate(0.26); g.fillStyle = C.red; g.fillRect(-70, -70, 140, 140); g.restore();
    g.save(); g.translate(60, 330); g.rotate(-0.08); g.fillStyle = C.ink; [180, 150, 200, 120, 170].forEach((w, k) => g.fillRect(0, k * 26, w, 10)); g.restore();
    // Right: thin diagonal lines, red dot, vertical “ЧАЙ”
    g.strokeStyle = C.ink; g.lineWidth = 6; g.beginPath(); g.moveTo(1520, 250); g.lineTo(1920, 760); g.stroke();
    g.fillStyle = C.red; g.beginPath(); g.arc(1790, 340, 46, 0, TAU); g.fill();
    g.fillStyle = C.ink; g.fillRect(1660, 430, 120, 400);
    g.fillStyle = C.cream; ['Ч', 'А', 'Й'].forEach((ch, k) => glyph(g, ch, 1682, 470 + k * 120, 15.5));
    // Large black circle (behind character's head)
    g.fillStyle = C.ink; g.beginPath(); g.arc(1330, 395, 215, 0, TAU); g.fill();
    // Diagonal red floor
    g.fillStyle = C.red; g.beginPath(); g.moveTo(0, 905); g.lineTo(W, 856); g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fill();
    g.fillStyle = C.ink; g.beginPath(); g.moveTo(0, 899); g.lineTo(W, 850); g.lineTo(W, 862); g.lineTo(0, 911); g.closePath(); g.fill();
    // Window: halftone photo (sky and clouds)
    const ph = P.canvas(), pg = ph.getContext('2d');
    const sg = pg.createLinearGradient(0, 140, 0, 540); sg.addColorStop(0, '#5e5e5e'); sg.addColorStop(0.75, '#cfcfcf'); sg.addColorStop(1, '#e8e8e8');
    pg.fillStyle = sg; pg.fillRect(370, 140, 420, 400);
    [[460, 240, 90, 34], [700, 300, 110, 30], [520, 400, 140, 26]].forEach(([x, y, rx, ry]) => { const rg = pg.createRadialGradient(x, y, 4, x, y, rx); rg.addColorStop(0, 'rgba(250,250,250,.95)'); rg.addColorStop(1, 'rgba(250,250,250,0)'); pg.fillStyle = rg; pg.beginPath(); pg.ellipse(x, y, rx, ry * 2, 0, 0, TAU); pg.fill(); });
    pg.fillStyle = '#2a2a2a'; pg.fillRect(370, 505, 420, 35);               // Distant factory roofline (dark)
    [[390, 470, 50], [470, 485, 36], [690, 460, 70], [760, 480, 30]].forEach(([x, y, w]) => pg.fillRect(x, y, w, 60));
    pg.fillRect(712, 360, 18, 120);                                           // Chimney
    g.fillStyle = C.cream; g.fillRect(370, 140, 420, 400);
    halftone(g, ph, 370, 140, 420, 400, 7, C.ink, 0.8);
    // Shukhov Tower: five hyperboloid sections, two sets of straight generators
    g.save(); g.beginPath(); g.rect(370, 140, 420, 400); g.clip();
    g.strokeStyle = C.ink; g.lineCap = 'round';
    TOWER.forEach(([y0, w0, y1, w1], k) => {
      g.lineWidth = 2.6 - k * 0.25;
      for (const dir of [1, -1]) for (let i = 0; i < 18; i++) {
        const a = i / 18 * TAU, b = a + dir * 1.1;
        const x0 = TX + Math.cos(a) * w0 / 2, x1 = TX + Math.cos(b) * w1 / 2;
        if (Math.sin(a) < -0.2 && Math.sin(b) < -0.2) continue;               // Omit rear lines for clearer reading
        g.beginPath(); g.moveTo(x0, y0 + Math.sin(a) * w0 * 0.08); g.lineTo(x1, y1 + Math.sin(b) * w1 * 0.08); g.stroke();
      }
      g.lineWidth = 4; g.beginPath(); g.ellipse(TX, y1, w1 / 2, w1 * 0.08, 0, 0, TAU); g.stroke();
    });
    g.lineWidth = 4; g.beginPath(); g.moveTo(TX, 168); g.lineTo(TX, 140); g.stroke();
    g.restore();
    // Window frame (thick black) and red sill
    g.strokeStyle = C.ink; g.lineWidth = 26; g.strokeRect(357, 127, 446, 426);
    g.fillStyle = C.red; g.fillRect(330, 554, 500, 30); g.fillStyle = C.ink; g.fillRect(330, 584, 500, 8);
    // Table: black top, red edge, diagonal brace
    g.fillStyle = C.ink; g.fillRect(810, 618, 400, 34); g.fillStyle = C.red; g.fillRect(810, 652, 400, 12);
    g.fillStyle = C.ink; g.fillRect(842, 664, 24, 220); g.fillRect(1158, 664, 24, 220);
    g.lineWidth = 14; g.strokeStyle = C.ink; g.beginPath(); g.moveTo(854, 870); g.lineTo(1170, 680); g.stroke();
    // Stool: black block
    g.fillStyle = C.ink; g.fillRect(1440, 470, 34, 420); g.fillRect(1290, 740, 190, 26); g.fillRect(1300, 760, 22, 120);
  });

  // ---------- Girl ----------
  const girlPal = { skin: C.cream, hair: C.ochre, dress: '#2f2c29', sleeve: C.cream, cuff: C.red, line: C.ink, lw: 3 };
  function girl(c, G, ch, lt) {
    const tilt = G.tilt, nk = [1300, 425];
    const HP = (x, y) => { const X = x - nk[0], Y = y - nk[1], cs = Math.cos(tilt), sn = Math.sin(tilt); return [nk[0] + X * cs - Y * sn, nk[1] + X * sn + Y * cs]; };
    const L = C.ink;
    const F = (p, col, lw = 3) => { if (!p) return; c.fillStyle = col; c.fill(p); if (lw) { c.strokeStyle = L; c.lineWidth = lw; c.stroke(p); } };
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    // Far sleeve (white shirt) and hand
    F(G.farSleeve, C.cream); F(G.farCuff, C.red, 2);
    // Skirt: dark gray flat fill and halftone shadow
    F(G.skirt, '#34302c', 0);
    shadeDots(c, G.skirt, 1090, 600, 380, 340, 9, '#0d0c0b', (x, y) => clamp((x - 1180) / 260) * 0.9);
    c.strokeStyle = L; c.lineWidth = 3; c.stroke(G.skirt);
    F(G.shoe, L, 0);
    // Torso: white shirt and red neckerchief triangle
    F(G.torso, C.cream);
    shadeDots(c, G.torso, 1270, 420, 170, 210, 8, '#7d766a', (x, y) => clamp((x - 1350) / 80));
    const nkA = G.A.neck;
    c.fillStyle = C.red; c.beginPath(); c.moveTo(nkA[0] - 18, nkA[1] - 2); c.lineTo(nkA[0] + 26, nkA[1] + 2); c.lineTo(nkA[0] - 2, nkA[1] + 62); c.closePath(); c.fill();
    // Golden hair and red headscarf
    F(G.hairBack, C.ochre, 0); F(G.bangs, C.ochre, 0);
    c.strokeStyle = C.ochreD; c.lineWidth = 3; G.hairLines.forEach(h => c.stroke(h));
    // Skin: paint grayscale photo offscreen, then halftone → photomontage
    const S = P.scratch('csSkin'), sg = S.getContext('2d', { willReadFrequently: true });
    sg.reset(); sg.clearRect(1100, 270, 300, 400);
    const shade = (p, x0, x1, a, b) => { const gr = sg.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, a); gr.addColorStop(1, b); sg.fillStyle = gr; sg.fill(p); };
    shade(G.neck, 1285, 1325, '#b4b4b4', '#767676');
    shade(G.face, 1250, 1330, '#fafafa', '#9c9c9c');
    sg.fillStyle = 'rgba(90,90,90,.28)'; sg.beginPath(); sg.ellipse(G.cheek[0] + 16, G.cheek[1] + 4, 16, 12, 0, 0, TAU); sg.fill();   // Subtle shadow beneath cheekbone
    shade(G.hand, G.A.hand[0] - 20, G.A.hand[0] + 20, '#d8d8d8', '#8a8a8a'); shade(G.farHand, 1146, 1218, '#f4f4f4', '#b0b0b0');
    // White cut edge and halftone
    c.save(); c.strokeStyle = '#fbf7ea'; c.lineWidth = 7; [G.neck, G.face, G.farHand].forEach(p => c.stroke(p)); c.restore();
    [G.neck, G.face, G.farHand].forEach(p => { c.fillStyle = C.cream; c.fill(p); });
    halftone(c, S, 1135, 280, 220, 360, 4.6, C.ink, 0.74);
    // Features (clear strokes manually added over photo) and red lips
    if (ch.blink) { c.strokeStyle = L; c.lineWidth = 3; c.stroke(G.lid); }
    else { c.fillStyle = L; c.beginPath(); c.ellipse(G.eye.x - 1, G.eye.y + 1, 5, 6.5, 0, 0, TAU); c.fill(); c.strokeStyle = L; c.lineWidth = 3; c.stroke(G.lid); G.lashes.forEach(l => { c.beginPath(); c.moveTo(...l[0]); c.lineTo(...l[1]); c.stroke(); }); }
    c.lineWidth = 3.4; c.stroke(G.brow);
    c.fillStyle = C.red; c.beginPath(); c.moveTo(...G.lips[0]); c.lineTo(...G.lips[1]); c.lineTo(...G.lips[2]); c.closePath(); c.fill();
    // Headscarf: covers crown and back of head, exposes golden fringe; tied at nape with two tails
    const kf = poly([[1280, 296], [1300, 285], [1330, 280], [1368, 291], [1402, 321], [1415, 368], [1405, 414], [1382, 440], [1356, 442], [1350, 410], [1342, 372], [1326, 334], [1304, 309]].map(p => HP(...p)));
    const lock = poly([[1352, 425], [1372, 432], [1380, 470], [1372, 505], [1360, 470]].map(p => HP(...p)));
    F(lock, C.ochre, 0); c.strokeStyle = C.ochreD; c.lineWidth = 2.5; c.stroke(lock);
    F(kf, C.red, 3);
    c.strokeStyle = C.redD; c.lineWidth = 3; c.beginPath(); [[1300, 300, 1390, 360], [1330, 292, 1400, 330]].forEach(([a, b, x, y]) => { const p0 = HP(a, b), p1 = HP(x, y); c.moveTo(...p0); c.lineTo(...p1); }); c.stroke();
    const sw = Math.sin(lt * 9) * 6;                       // Headscarf tails sway gently with motion
    [[[1384, 432], [1446, 470 + sw], [1416, 478 + sw]], [[1378, 438], [1428, 500 - sw], [1400, 498 - sw]]].forEach(tri => F(poly(tri.map(p => HP(...p))), C.red, 3));
    // Near arm (white sleeve, red cuff), cup, hand
    F(G.upperArm, C.cream); F(G.foreArm, C.cream); F(G.cuff, C.red, 2);
    sg.reset(); sg.clearRect(1100, 270, 300, 400); shade(G.hand, G.A.hand[0] - 18, G.A.hand[0] + 18, '#dcdcdc', '#7a7a7a');
    c.save(); c.strokeStyle = '#fbf7ea'; c.lineWidth = 7; c.stroke(G.hand); c.restore(); c.fillStyle = C.cream; c.fill(G.hand);
    halftone(c, S, G.A.hand[0] - 26, G.A.hand[1] - 26, 52, 52, 4.6, C.ink, 0.74);
    RIG.drawCup(c, G.cup, { body: C.cream, rim: C.ink, line: L, lw: 3, hw: 7 });
    c.save(); c.translate(G.cup.x, G.cup.y); c.rotate(G.cup.tilt); c.fillStyle = C.red; c.fillRect(-G.cup.w * 0.46, G.cup.h * 0.38, G.cup.w * 0.92, 9); c.restore();
    c.fillStyle = C.cream; c.beginPath(); c.arc(G.thumb[0], G.thumb[1], 7, 0, TAU); c.fill(); c.strokeStyle = L; c.lineWidth = 2.4; c.stroke();
    c.restore();
  }

  // ---------- Cat: flat paper cutout, halftone shadow, thick black stripes ----------
  function cat(c, K) {
    c.save(); c.lineJoin = 'round'; c.lineCap = 'butt';
    c.strokeStyle = C.ink; c.lineWidth = K.tailW + 8; c.stroke(K.tail); c.strokeStyle = C.orange; c.lineWidth = K.tailW; c.stroke(K.tail);
    c.setLineDash([12, 14]); c.strokeStyle = C.ink; c.lineWidth = K.tailW * 0.9; c.stroke(K.tail); c.setLineDash([]);
    const tip = K.tailPts[K.tailPts.length - 1]; c.fillStyle = C.cream; c.beginPath(); c.arc(tip[0], tip[1], K.tailW / 2, 0, TAU); c.fill();
    c.fillStyle = C.orange; c.fill(K.body); shadeDots(c, K.body, 420, 660, 250, 250, 9, '#7a2f0c', (x, y) => clamp((x - 520) / 140) * 0.8 + clamp((y - 820) / 90) * 0.3);
    c.strokeStyle = C.ink; c.lineWidth = 4; c.stroke(K.body);
    K.legs.forEach(l => { c.fillStyle = C.cream; c.fill(l); c.stroke(l); });
    c.fillStyle = C.cream; c.fill(K.white);
    c.fillStyle = C.orange; c.fill(K.head); c.stroke(K.head);
    c.save(); c.clip(K.head); c.fillStyle = C.cream; c.beginPath(); c.ellipse(K.nose[0] - 22, K.nose[1] + 12, 36, 26, 0, 0, TAU); c.fill(); c.restore();
    c.fillStyle = C.red; K.earInner.forEach(e => { c.beginPath(); e.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.fill(); });
    c.strokeStyle = C.ink; c.lineWidth = 10; K.stripes.forEach(s => { c.beginPath(); c.moveTo(...s[0]); c.lineTo(...s[1]); c.stroke(); });
    K.eyes.forEach(e => { if (K.blink) { c.lineWidth = 4; c.beginPath(); c.moveTo(e.x - 9, e.y); c.lineTo(e.x + 9, e.y); c.stroke(); }
      else { c.fillStyle = C.cream; c.beginPath(); c.arc(e.x, e.y, 10, 0, TAU); c.fill(); c.lineWidth = 3; c.stroke(); c.fillStyle = C.ink; c.fillRect(e.x - 1, e.y - 8, 5, 16); } });
    c.fillStyle = C.red; c.beginPath(); c.moveTo(K.nose[0] - 7, K.nose[1] - 4); c.lineTo(K.nose[0] + 7, K.nose[1] - 4); c.lineTo(K.nose[0], K.nose[1] + 5); c.fill();
    c.lineWidth = 2; K.whiskers.forEach(w => { c.beginPath(); c.moveTo(...w[0]); c.lineTo(...w[1]); c.stroke(); });
    c.restore();
  }

  const SLOGAN = 'ПЕЙТЕ ЧАЙ!';
  return {
    draw(c, lt, t) {
      const ch = P.choreo(lt, t);
      c.drawImage(bg(), 0, 0);
      // Red dashed ring around black circle (rotates)
      c.save(); c.strokeStyle = C.red; c.lineWidth = 12; c.setLineDash([46, 22]); c.lineDashOffset = -lt * 260;
      c.beginPath(); c.arc(1330, 395, 242, 0, TAU); c.stroke(); c.restore();
      // El Lissitzky's red wedge: pierces black circle along its axis (1.6Hz in/out)
      const thrust = 70 * (0.5 - 0.5 * Math.cos(lt * TAU * 1.6)), ax = Math.cos(0.34), ay = Math.sin(0.34);
      const tipX = 1150 + ax * thrust, tipY = 360 + ay * thrust;
      c.fillStyle = C.red; c.beginPath(); c.moveTo(tipX, tipY); c.lineTo(tipX - ax * 330 - ay * 95, tipY - ay * 330 + ax * 95); c.lineTo(tipX - ax * 330 + ay * 95, tipY - ay * 330 - ax * 95); c.closePath(); c.fill();
      // Inside window: radio waves from tower top (expanding red arcs)
      c.save(); c.beginPath(); c.rect(370, 140, 420, 400); c.clip(); c.strokeStyle = C.red; c.lineCap = 'butt';
      for (let k = 0; k < 4; k++) { const ph = (lt * 1.4 + k / 4) % 1, r = 18 + ph * 230; c.globalAlpha = 1 - ph; c.lineWidth = 10 - ph * 6;
        c.beginPath(); c.arc(TX, 150, r, Math.PI * 0.05, Math.PI * 0.95, true); c.stroke(); }
      c.restore();
      // Characters
      const K = RIG.cat({ tail: ch.tail, blink: ch.blink, breathe: ch.breathe });
      cat(c, K);
      const G = RIG.girl({ cup: ch.cup, sip: ch.sip, breathe: ch.breathe });
      girl(c, G, ch, lt);
      // Floor slogan (above characters: poster lettering overlaps figures): stamps in letter by letter (0–0.5s), then bounces in a wave
      c.save(); c.translate(0, 0); const ang = Math.atan2(-49, W); c.rotate(ang);
      const u = 19, adv = 6.3 * u; let x = 350;
      [...SLOGAN].forEach((chh, k) => {
        if (chh === ' ') { x += 3.5 * u; return; }
        const q = clamp((lt - k * 0.045) / 0.12); if (q <= 0) { x += adv; return; }
        const s = 1 + 0.5 * (1 - ease.out(q)), hop = -10 * Math.max(0, Math.sin(lt * 11 - k * 0.8));
        c.save(); c.translate(x + 2.5 * u, 990 + hop); c.scale(s, s); c.globalAlpha = q;
        c.fillStyle = k % 4 === 3 ? C.ink : C.cream; glyph(c, chh, -2.5 * u, -3.5 * u, u); c.restore();
        x += adv;
      });
      c.restore();
      // Cup steam: three rising black zigzags
      c.save(); c.strokeStyle = C.ink; c.lineWidth = 4; c.lineJoin = 'miter';
      for (let k = 0; k < 3; k++) { const ph = (lt * 2 + k / 3) % 1, x0 = G.cup.x - 14 + k * 14, y0 = G.cup.y - 12 - ph * 60; c.globalAlpha = 1 - ph;
        c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + 7, y0 - 9); c.lineTo(x0, y0 - 18); c.lineTo(x0 + 7, y0 - 27); c.stroke(); }
      c.restore();
    },
  };
})();
