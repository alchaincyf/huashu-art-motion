// 1350 BC Egyptian tomb mural (Amarna period) — pure code.
// Pipeline: ① cached static layer (plaster wall + colored geometric borders + hieroglyph columns + window/Aten disk + jars/offering table/chair)
//      → ② animated motifs (hands at Aten ray tips open/close, flowing water hieroglyphs, scarab pushing sun ball)
//      → ③ Egyptian conventions (profile face/frontal eye, frontal shoulders, flat colors + dark outlines) → ④ mural surface (multiply mottling + cracks + grain)
SCENES['02_egypt'] = (() => {
  const W = 1920, H = 1080, { clamp, lerp } = U, P = PAINT;
  const C = {
    wall: '#eadcb8', wall2: '#d8c597', line: '#2a1810', rule: '#9a2b22',
    red: '#b8322a', blue: '#2a58a8', green: '#2e8a55', yellow: '#e2b13a', black: '#231a14',
    gold: '#e0ab38', goldD: '#a8741c', goldL: '#f3d27a', navy: '#1c2236', cream: '#f2ead6', white: '#f6f2e8',
    skin: '#e6b282', skinD: '#c98d5c', terra: '#d4936a', lapis: '#2c56b0', turq: '#3fa6a0',
    catO: '#e08a3c', catS: '#b45a1c', catW: '#f6efe0',
  };
  const BAND = [C.red, C.blue, C.yellow, C.green];        // Four Egyptian border colors

  // ---------------- Utilities ----------------
  const poly = (g, pts, close = true) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); if (close) g.closePath(); };
  const fs = (g, fill, stroke, lw = 2.5) => { if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); } };
  const sm = (pts, closed = true) => RIG.smooth(pts, closed);

  // ---------------- Hieroglyph library (origin centered, ~50px wide; h = allocated height) ----------------
  // Each glyph: {h, cols:[optional colors], d(g)}; g already has strokeStyle/fillStyle/lineWidth
  const GL = {
    ankh: { h: 60, cols: [C.blue, C.green, C.black, C.red], d(g) { g.lineWidth = 3.6; g.beginPath(); g.ellipse(0, -17, 8, 11, 0, 0, 7); g.moveTo(-16, -3); g.lineTo(16, -3); g.moveTo(0, -5); g.lineTo(0, 29); g.stroke(); } },
    sun: { h: 40, cols: [C.black, C.blue, C.red], d(g) { g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 15, 0, 7); g.stroke(); g.beginPath(); g.arc(0, 0, 4, 0, 7); g.fill(); } },
    bread: { h: 26, cols: [C.red, C.blue, C.green], d(g) { g.beginPath(); g.arc(0, 9, 19, Math.PI, 0); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(-12, 4); g.lineTo(12, 4); g.stroke(); } },
    reed: { h: 62, cols: [C.black, C.green, C.red], d(g) { g.beginPath(); g.moveTo(-2, 29); g.quadraticCurveTo(-11, 0, 1, -29); g.quadraticCurveTo(7, -2, 4, 29); g.stroke(); g.beginPath(); g.moveTo(1, -29); g.quadraticCurveTo(9, -31, 10, -24); g.stroke(); } },
    owl: { h: 60, cols: [C.black, C.blue], d(g) { g.beginPath(); g.ellipse(3, 6, 12, 19, 0.1, 0, 7); g.stroke(); g.beginPath(); g.arc(-2, -18, 10, 0, 7); g.stroke(); g.beginPath(); g.arc(-6, -19, 2.4, 0, 7); g.arc(2, -19, 2.4, 0, 7); g.fill(); g.beginPath(); g.moveTo(-2, -14); g.lineTo(-3, -9); g.moveTo(9, 22); g.lineTo(18, 29); g.moveTo(-3, 24); g.lineTo(-5, 30); g.moveTo(4, 24); g.lineTo(3, 30); g.stroke(); } },
    falcon: { h: 60, cols: [C.black, C.red, C.blue], d(g) { g.beginPath(); g.arc(-6, -20, 7, 0, 7); g.fill(); poly(g, [[-12, -21], [-19, -16], [-11, -15]]); g.fill(); g.beginPath(); g.ellipse(2, 1, 10, 20, -0.35, 0, 7); g.stroke(); poly(g, [[8, 16], [20, 30], [6, 27]]); g.fill(); g.beginPath(); g.moveTo(-3, 19); g.lineTo(-5, 30); g.moveTo(2, 19); g.lineTo(1, 30); g.moveTo(-1, -8); g.quadraticCurveTo(10, 0, 12, 14); g.stroke(); } },
    heron: { h: 64, cols: [C.green, C.black, C.blue], d(g) { g.beginPath(); g.moveTo(-20, -22); g.lineTo(-8, -26); g.quadraticCurveTo(0, -28, -1, -18); g.quadraticCurveTo(-6, -8, 2, -2); g.stroke(); g.beginPath(); g.ellipse(8, 4, 13, 8, 0.4, 0, 7); g.stroke(); g.beginPath(); g.moveTo(4, 11); g.lineTo(2, 31); g.moveTo(10, 11); g.lineTo(12, 31); g.moveTo(18, 9); g.lineTo(24, 14); g.stroke(); } },
    snake: { h: 30, cols: [C.green, C.black, C.red], d(g) { g.lineWidth = 3.2; g.beginPath(); g.moveTo(22, 8); g.bezierCurveTo(10, -4, 4, 14, -6, 6); g.bezierCurveTo(-14, 0, -16, -4, -20, -2); g.stroke(); g.beginPath(); g.moveTo(-20, -2); g.lineTo(-23, -9); g.moveTo(-17, -3); g.lineTo(-15, -10); g.stroke(); } },
    eye: { h: 36, cols: [C.green, C.black, C.blue], d(g) { g.beginPath(); g.moveTo(-18, 0); g.quadraticCurveTo(0, -12, 18, 0); g.quadraticCurveTo(0, 9, -18, 0); g.stroke(); g.beginPath(); g.arc(0, -1, 4.5, 0, 7); g.fill(); g.beginPath(); g.moveTo(-18, -12); g.quadraticCurveTo(0, -20, 20, -11); g.moveTo(-4, 6); g.lineTo(-6, 16); g.moveTo(6, 5); g.quadraticCurveTo(14, 18, 4, 16); g.stroke(); } },
    cartouche: { h: 74, cols: [C.black, C.red], d(g) { g.beginPath(); g.ellipse(0, -2, 15, 31, 0, 0, 7); g.stroke(); g.beginPath(); g.moveTo(-14, 33); g.lineTo(14, 33); g.stroke(); g.lineWidth = 2; g.beginPath(); g.arc(0, -18, 5, 0, 7); g.moveTo(-7, -2); g.lineTo(7, -2); g.moveTo(-6, 8); g.lineTo(-3, 13); g.lineTo(0, 8); g.lineTo(3, 13); g.lineTo(6, 8); g.stroke(); } },
    scarab: { h: 46, cols: [C.blue, C.black], d(g) { g.beginPath(); g.ellipse(0, 6, 10, 14, 0, 0, 7); g.fill(); g.beginPath(); g.arc(0, -11, 6, 0, 7); g.fill(); g.beginPath(); for (const s of [-1, 1]) for (const k of [-1, 0, 1]) { g.moveTo(s * 9, 6 + k * 8); g.lineTo(s * 17, 2 + k * 11); } g.stroke(); } },
    seated: { h: 58, cols: [C.red, C.black, C.blue], d(g) { g.beginPath(); g.arc(-2, -21, 6.5, 0, 7); g.fill(); poly(g, [[-6, -13], [4, -13], [6, 6], [16, 8], [17, 18], [-10, 18], [-10, 2]]); g.fill(); g.beginPath(); g.moveTo(-6, -8); g.lineTo(-17, -16); g.stroke(); g.beginPath(); g.moveTo(-14, 26); g.lineTo(18, 26); g.stroke(); } },
    leg: { h: 50, cols: [C.green, C.black, C.red], d(g) { poly(g, [[-3, -24], [6, -24], [6, 18], [16, 22], [16, 26], [-4, 26]]); g.stroke(); } },
    arm: { h: 24, cols: [C.black, C.red], d(g) { poly(g, [[-22, -4], [10, -4], [16, -8], [22, -6], [16, 2], [-22, 4]]); g.stroke(); } },
    basket: { h: 26, cols: [C.blue, C.green, C.black], d(g) { g.beginPath(); g.moveTo(-20, -4); g.lineTo(20, -4); g.quadraticCurveTo(18, 12, 0, 12); g.quadraticCurveTo(-18, 12, -20, -4); g.stroke(); g.beginPath(); g.arc(22, 2, 5, -1.5, 1.6); g.stroke(); } },
    house: { h: 36, cols: [C.black, C.red], d(g) { g.beginPath(); g.moveTo(-6, 14); g.lineTo(-18, 14); g.lineTo(-18, -14); g.lineTo(18, -14); g.lineTo(18, 14); g.lineTo(6, 14); g.stroke(); } },
    strokes: { h: 34, cols: [C.red, C.black], d(g) { g.beginPath(); for (const x of [-8, 0, 8]) { g.moveTo(x, -14); g.lineTo(x, 14); } g.stroke(); } },
    feather: { h: 60, cols: [C.blue, C.green, C.black], d(g) { g.beginPath(); g.moveTo(-2, 29); g.quadraticCurveTo(-8, -10, 4, -29); g.quadraticCurveTo(12, -18, 6, 0); g.quadraticCurveTo(3, 15, 2, 29); g.stroke(); } },
    djed: { h: 62, cols: [C.blue, C.green], d(g) { g.beginPath(); g.moveTo(-6, 29); g.lineTo(-6, -10); g.moveTo(6, 29); g.lineTo(6, -10); for (let k = 0; k < 4; k++) { g.moveTo(-13, -12 - k * 5); g.lineTo(13, -12 - k * 5); } g.moveTo(-12, 29); g.lineTo(12, 29); g.stroke(); } },
    shen: { h: 42, cols: [C.red, C.blue], d(g) { g.beginPath(); g.arc(0, -4, 13, 0, 7); g.stroke(); g.beginPath(); g.moveTo(-14, 13); g.lineTo(14, 13); g.stroke(); } },
    jug: { h: 50, cols: [C.red, C.green, C.blue], d(g) { g.beginPath(); g.moveTo(-6, -22); g.lineTo(6, -22); g.lineTo(5, -14); g.quadraticCurveTo(16, -6, 12, 12); g.quadraticCurveTo(8, 22, 0, 22); g.quadraticCurveTo(-8, 22, -12, 12); g.quadraticCurveTo(-16, -6, -5, -14); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(-10, 0); g.lineTo(10, 0); g.stroke(); } },
    lotus: { h: 56, cols: [C.green, C.blue], d(g) { g.beginPath(); g.moveTo(0, 27); g.lineTo(0, -6); g.stroke(); poly(g, [[0, -6], [-12, -18], [-6, -26], [0, -16], [6, -26], [12, -18]]); g.stroke(); } },
    nfr: { h: 56, cols: [C.black, C.red], d(g) { g.beginPath(); g.ellipse(0, 12, 10, 14, 0, 0, 7); g.moveTo(0, -2); g.lineTo(0, -26); g.moveTo(-6, -18); g.lineTo(6, -18); g.moveTo(-6, -12); g.lineTo(6, -12); g.stroke(); } },
    mouth: { h: 20, cols: [C.red], d(g) { g.beginPath(); g.moveTo(-18, 0); g.quadraticCurveTo(0, -9, 18, 0); g.quadraticCurveTo(0, 9, -18, 0); g.stroke(); } },
    water: { h: 30, cols: [C.blue], water: true, d(g, ph = 0) { g.lineWidth = 2.6; for (let r = -1; r <= 1; r++) { g.beginPath(); for (let i = 0; i <= 16; i++) { const x = -21 + i * 2.625, y = r * 9 + ((i + ph) % 2 < 1 ? -3 : 3); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); } } },
  };
  const GN = Object.keys(GL);
  // Columns: [divider x list, y0, y1] (measured from source)
  const GROUPS = [[[78, 154, 230, 306], 66, 566], [[852, 932, 1012, 1092, 1172], 66, 452], [[1560, 1637, 1713, 1790, 1866], 252, 882], [[298, 366], 614, 886]];
  const GLYPHS = (() => {          // Seeded arrangement computed at module init (water glyph animation needs known positions)
    const r = U.rng(1350), out = [];
    GROUPS.forEach(([xs, y0, y1]) => { for (let k = 0; k < xs.length - 1; k++) {
      const used = {};
      const cx = (xs[k] + xs[k + 1]) / 2; let y = y0 + 8, prev = '';
      while (true) {
        let n; do { n = GN[(r() * GN.length) | 0]; } while (n === prev || used[n] > 2 || ((n === 'scarab' || n === 'water') && r() < 0.6)); prev = n; used[n] = (used[n] || 0) + 1;
        const gl = GL[n], s = (xs[k + 1] - xs[k]) / 78 * (1.0 + r() * 0.14);
        if (y + gl.h * s > y1) break;
        out.push({ n, x: cx + (r() - 0.5) * 4, y: y + gl.h * s / 2, s, col: gl.cols[(r() * gl.cols.length) | 0], ph: r() * 2 });
        y += gl.h * s + 6 + r() * 5;
      }
    } });
    // Ensure ≥6 flowing water glyphs; replace flat glyphs if needed
    let nw = out.filter(q => q.n === 'water').length;
    for (const q of out) { if (nw >= 6) break; if (['mouth', 'bread', 'basket', 'arm', 'strokes'].includes(q.n)) { q.n = 'water'; q.col = C.blue; nw++; } }
    return out;
  })();
  const drawGlyph = (g, q, ph = 0, rv = 1) => { g.save(); g.translate(q.x, q.y); g.scale(q.s, q.s); g.strokeStyle = q.col; g.fillStyle = q.col; g.lineWidth = 3.1; g.lineCap = 'round'; g.lineJoin = 'round';
    if (rv < 1) { g.setLineDash([Math.max(0.01, rv * 95), 999]); if (rv < 0.55) g.fillStyle = 'rgba(0,0,0,0)'; }
    GL[q.n].d(g, ph); g.restore(); };
  // Writing inscriptions: every 0.12s select 4 shuffled glyphs across columns, erase → reveal strokes via dash; bright gold settles to original color
  const WRITERS = (() => { const r = U.rng(77), idx = GLYPHS.map((q, i) => i).filter(i => !GL[GLYPHS[i].n].water); for (let i = idx.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0; [idx[i], idx[j]] = [idx[j], idx[i]]; } return idx; })();
  const WRITE_SLOT = 0.12, WRITE_DUR = 0.36, WRITE_N = 6;
  function writeGlyphs(c, lt) {
    const wall = P.texture('eg_wall', C.wall), s0 = Math.floor(lt / WRITE_SLOT);
    for (let s = Math.max(0, s0 - 2); s <= s0; s++) for (let m = 0; m < WRITE_N; m++) {
      const q = GLYPHS[WRITERS[(s * WRITE_N + m) % WRITERS.length]], p = clamp((lt - s * WRITE_SLOT) / WRITE_DUR);
      if (p >= 1) continue;
      const w = 64 * q.s, h = (GL[q.n].h + 10) * q.s, x0 = q.x - w / 2, y0 = q.y - h / 2;
      c.drawImage(wall, x0, y0, w, h, x0, y0, w, h);
      const glow = 1 - p, col = P.rgb(P.mix(P.hex(q.col), [246, 200, 70], glow * 0.85));
      c.save(); c.shadowColor = `rgba(255,200,80,${0.9 * glow})`; c.shadowBlur = 10 * glow;
      drawGlyph(c, { ...q, col }, q.ph, Math.min(1, p * 1.35));
      c.restore();
    }
  }

  // ---------------- Colored geometric borders ----------------
  function blocks(g, x0, y0, x1, y1, len, off = 0) {      // Color blocks along long edge, cream seams, black outer outline
    const hor = (x1 - x0) > (y1 - y0), L = hor ? x1 - x0 : y1 - y0;
    g.fillStyle = C.cream; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    for (let s = 0, k = off; s < L; s += len, k++) {
      g.fillStyle = BAND[k % 4];
      if (hor) g.fillRect(x0 + s + 3, y0 + 3, Math.min(len - 6, L - s - 3), y1 - y0 - 6); else g.fillRect(x0 + 3, y0 + s + 3, x1 - x0 - 6, Math.min(len - 6, L - s - 3));
      g.fillStyle = C.black; if (hor) g.fillRect(x0 + s, y0, 2, y1 - y0); else g.fillRect(x0, y0 + s, x1 - x0, 2);
    }
    g.strokeStyle = C.black; g.lineWidth = 2; g.strokeRect(x0, y0, x1 - x0, y1 - y0);
  }

  // ---------------- Static layer ----------------
  const DISK = [580, 266];
  function staticLayer(g) {
    // Plaster wall: base color + mottling + grain
    g.drawImage(P.texture('eg_wall', C.wall, { scale: 0.0035, amt: 16, grain: 12, dark: C.wall2, seed: 13 }), 0, 0);
    // Hieroglyph columns: red dividers + glyphs
    g.lineCap = 'round';
    GROUPS.forEach(([xs, y0, y1]) => xs.forEach(x => { g.strokeStyle = C.rule; g.lineWidth = 2.6; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke(); }));
    GLYPHS.forEach(q => { if (!GL[q.n].water) drawGlyph(g, q); });
    // —— Window ——
    // Cavetto cornice: vertically striped curved surface, wider above
    const top = [338, 822], bot = [362, 798], cy0 = 128, cy1 = 172, st = [C.blue, C.white, C.red, C.white, C.green, C.white];
    const n = 30;
    for (let i = 0; i < n; i++) {
      const a = i / n, b = (i + 1) / n;
      poly(g, [[lerp(top[0], top[1], a), cy0], [lerp(top[0], top[1], b), cy0], [lerp(bot[0], bot[1], b), cy1], [lerp(bot[0], bot[1], a), cy1]]);
      g.fillStyle = st[i % 6]; g.fill();
    }
    g.strokeStyle = C.black; g.lineWidth = 1.5;
    for (let i = 0; i <= n; i++) { const a = i / n; g.beginPath(); g.moveTo(lerp(top[0], top[1], a), cy0); g.lineTo(lerp(bot[0], bot[1], a), cy1); g.stroke(); }
    // Recessed cornice shadow (darker above)
    const cg = g.createLinearGradient(0, cy0, 0, cy1); cg.addColorStop(0, 'rgba(40,20,10,.28)'); cg.addColorStop(0.5, 'rgba(40,20,10,0)'); g.fillStyle = cg;
    poly(g, [[top[0], cy0], [top[1], cy0], [bot[1], cy1], [bot[0], cy1]]); g.fill();
    g.fillStyle = C.gold; g.fillRect(334, 118, 492, 11); g.strokeStyle = C.black; g.lineWidth = 2; g.strokeRect(334, 118, 492, 11);
    g.fillStyle = C.gold; g.fillRect(358, 172, 444, 13); g.strokeRect(358, 172, 444, 13);
    g.fillStyle = C.goldD; for (let x = 364; x < 798; x += 14) g.fillRect(x, 175, 6, 7);
    // Window frame: color blocks left/right/bottom + blue top band
    blocks(g, 378, 185, 408, 560, 40, 1); blocks(g, 772, 185, 802, 560, 40, 3); blocks(g, 378, 530, 802, 560, 40, 0);
    g.fillStyle = C.blue; g.fillRect(408, 185, 364, 15); g.strokeStyle = C.black; g.strokeRect(408, 185, 364, 15);
    // Window interior: white base (faint plaster texture)
    g.fillStyle = '#f2ede1'; g.fillRect(408, 200, 364, 330);
    g.globalAlpha = 0.25; g.drawImage(P.texture('eg_wall', C.wall), 408, 200, 364, 330, 408, 200, 364, 330); g.globalAlpha = 1;
    g.fillStyle = C.blue; g.fillRect(408, 200, 364, 9); g.fillRect(762, 200, 10, 30); poly(g, [[740, 209], [772, 209], [772, 222]]); g.fill();
    g.strokeStyle = C.black; g.lineWidth = 2; g.strokeRect(408, 200, 364, 330);
    // Aten disk + uraeus + ankh
    g.beginPath(); g.arc(DISK[0], DISK[1], 46, 0, 7); g.fillStyle = '#c8372b'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#7a1c14'; g.stroke();
    g.beginPath(); g.arc(DISK[0], DISK[1], 38, 0, 7); g.strokeStyle = 'rgba(255,200,150,.35)'; g.lineWidth = 2; g.stroke();
    g.fillStyle = C.gold; g.beginPath(); g.ellipse(580, 300, 7, 10, 0, 0, 7); g.fill(); g.strokeStyle = C.black; g.lineWidth = 1.6; g.stroke();
    g.beginPath(); g.moveTo(580, 290); g.quadraticCurveTo(592, 305, 580, 318); g.lineWidth = 4; g.strokeStyle = C.gold; g.stroke();
    drawGlyph(g, { n: 'ankh', x: 580, y: 332, s: 0.42, col: C.blue });
    // —— Two pointed jars on left, small jar by table ——
    jar(g, 108, 644, 1); jar(g, 212, 644, 1); jar(g, 886, 714, 0.72);
    // —— Offering table ——
    poly(g, [[975, 660], [962, 702], [984, 748], [984, 792], [950, 862], [930, 900], [1090, 900], [1070, 862], [1036, 792], [1036, 748], [1058, 702], [1045, 660]]); fs(g, C.white, C.line, 2.5);
    g.save(); g.clip(); g.fillStyle = C.blue; g.fillRect(940, 752, 140, 10); g.fillStyle = C.red; g.fillRect(940, 768, 140, 10); g.restore();
    g.strokeStyle = 'rgba(140,110,80,.5)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(1000, 800); g.quadraticCurveTo(990, 850, 960, 890); g.stroke();
    g.fillStyle = C.white; g.fillRect(820, 640, 380, 20); g.strokeStyle = C.line; g.lineWidth = 2.5; g.strokeRect(820, 640, 380, 20);
    g.strokeStyle = C.red; g.lineWidth = 2; g.beginPath(); g.moveTo(824, 655); g.lineTo(1196, 655); g.stroke();
    // Offerings: white conical bread, gold dish, blue grapes, green lotus-leaf plate
    poly(g, [[836, 640], [844, 590], [852, 568], [860, 590], [870, 640]]); fs(g, C.white, C.line, 2.2);
    g.beginPath(); g.moveTo(870, 640); g.quadraticCurveTo(872, 604, 908, 602); g.quadraticCurveTo(944, 604, 946, 640); g.closePath(); fs(g, C.gold, C.line, 2.2);
    g.beginPath(); g.arc(908, 626, 5, 0, 7); g.strokeStyle = C.goldD; g.lineWidth = 2; g.stroke();
    [[892, 600], [906, 600], [920, 600], [899, 587], [913, 587], [906, 574], [885, 588], [927, 588], [892, 575], [920, 575], [906, 561]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 8, 0, 7); fs(g, '#2c4aa0', '#141a3a', 1.5); g.fillStyle = 'rgba(160,190,255,.6)'; g.beginPath(); g.arc(x - 2.5, y - 2.5, 2.2, 0, 7); g.fill(); });
    g.beginPath(); g.ellipse(888, 541, 52, 9, 0, 0, 7); fs(g, C.green, C.line, 2); g.strokeStyle = '#1f6a40'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(842, 541); g.lineTo(934, 541); g.stroke();
    // —— Chair (slender gold legs, red/blue back blocks) ——
    chair(g);
    // Blue bowl by feet
    g.beginPath(); g.moveTo(1342, 878); g.lineTo(1418, 878); g.quadraticCurveTo(1412, 900, 1380, 900); g.quadraticCurveTo(1348, 900, 1342, 878); fs(g, '#3a78c8', C.line, 2);
    g.beginPath(); g.ellipse(1380, 878, 38, 5, 0, 0, 7); fs(g, '#8cc0ee', C.line, 1.6);
    // —— Ground line and layered lower bands ——
    g.fillStyle = C.black; g.fillRect(0, 898, W, 6);
    g.fillStyle = C.cream; g.fillRect(0, 904, W, 106);
    blocks(g, -20, 914, W + 20, 948, 64, 0);
    g.fillStyle = C.yellow; g.fillRect(0, 961, W, 15); g.fillStyle = C.red; g.fillRect(0, 984, W, 14);
    g.fillStyle = C.black; [912, 960, 977, 983, 999, 1008].forEach(y => g.fillRect(0, y, W, 1.6));
    // Dark-blue band (fine grain)
    g.fillStyle = C.navy; g.fillRect(0, 1010, W, 70);
    const r = U.rng(7); for (let i = 0; i < 2600; i++) { g.fillStyle = r() < 0.5 ? 'rgba(90,100,140,.35)' : 'rgba(5,8,20,.45)'; g.fillRect(r() * W, 1010 + r() * 70, 1 + r() * 2, 1 + r() * 2); }
    // —— Colored top and side borders ——
    blocks(g, -10, 6, W + 10, 40, 56, 2);
    blocks(g, 32, 40, 58, 898, 46, 1); blocks(g, 1890, 40, 1916, 898, 46, 3);
  }
  function jar(g, cx, y0, s) {
    g.save(); g.translate(cx, y0); g.scale(s, s);
    // Stand (white X legs)
    g.strokeStyle = C.line; g.lineWidth = 2.5; g.fillStyle = C.white;
    poly(g, [[-26, 256], [-20, 256], [10, 196], [4, 196]]); fs(g, C.white, C.line, 2); poly(g, [[26, 256], [20, 256], [-10, 196], [-4, 196]]); fs(g, C.white, C.line, 2);
    g.fillRect(-24, 198, 48, 6); g.strokeRect(-24, 198, 48, 6);
    // Jar body: round shoulders, pointed bottom
    g.beginPath(); g.moveTo(-10, 30); g.bezierCurveTo(-40, 50, -38, 120, -20, 180); g.quadraticCurveTo(-6, 222, 0, 228); g.quadraticCurveTo(6, 222, 20, 180); g.bezierCurveTo(38, 120, 40, 50, 10, 30); g.closePath(); fs(g, C.terra, C.line, 2.5);
    g.save(); g.clip();
    g.fillStyle = C.green; g.fillRect(-40, 52, 80, 6); g.fillStyle = C.blue; g.fillRect(-40, 58, 80, 4);
    g.fillStyle = '#2f9a8a'; for (let x = -36; x < 36; x += 9) { poly(g, [[x, 62], [x + 9, 62], [x + 4.5, 82]]); g.fill(); }
    g.strokeStyle = 'rgba(80,40,20,.6)'; g.lineWidth = 1.6; [[150], [158]].forEach(([y]) => { g.beginPath(); g.moveTo(-40, y); g.lineTo(40, y); g.stroke(); });
    g.fillStyle = 'rgba(255,230,200,.25)'; g.beginPath(); g.ellipse(-14, 110, 6, 40, 0, 0, 7); g.fill();
    g.restore();
    // Neck and lid
    g.fillStyle = C.terra; g.fillRect(-9, 18, 18, 14); g.strokeStyle = C.line; g.lineWidth = 2; g.strokeRect(-9, 18, 18, 14);
    g.beginPath(); g.moveTo(-14, 20); g.quadraticCurveTo(-14, -6, 0, -6); g.quadraticCurveTo(14, -6, 14, 20); g.closePath(); fs(g, '#3a302a', C.line, 2);
    g.restore();
  }
  function chair(g) {
    g.lineJoin = 'round';
    // Rear/front legs (tapered gold + red/white striped lion-paw feet)
    const leg = (x) => { g.beginPath(); g.moveTo(x - 9, 748); g.bezierCurveTo(x - 16, 790, x - 4, 830, x - 12, 872); g.lineTo(x + 12, 872); g.bezierCurveTo(x + 4, 830, x + 16, 790, x + 9, 748); g.closePath(); fs(g, C.gold, C.line, 2.4);
      g.fillStyle = C.white; g.fillRect(x - 16, 872, 32, 26); g.strokeStyle = C.line; g.lineWidth = 2; g.strokeRect(x - 16, 872, 32, 26); g.fillStyle = C.red; g.fillRect(x - 16, 878, 32, 5); g.fillRect(x - 16, 888, 32, 5); };
    leg(1458); leg(1312);
    // Vertical bars + crossbar below seat
    g.fillStyle = C.gold; for (let x = 1330; x < 1446; x += 20) { g.fillRect(x, 750, 7, 54); g.strokeStyle = C.line; g.lineWidth = 1.4; g.strokeRect(x, 750, 7, 54); }
    g.fillRect(1300, 802, 170, 8); g.strokeRect(1300, 802, 170, 8);
    // Chair back: upright posts (red/blue blocks)
    g.beginPath(); g.moveTo(1476, 742); g.lineTo(1478, 478); g.quadraticCurveTo(1480, 458, 1492, 458); g.quadraticCurveTo(1504, 460, 1500, 478); g.lineTo(1498, 742); g.closePath(); fs(g, C.gold, C.line, 2.4);
    for (let k = 0; k < 9; k++) { g.fillStyle = k % 2 ? C.blue : C.red; g.fillRect(1483, 494 + k * 28, 10, 13); }
    // Seat
    g.fillStyle = C.gold; g.fillRect(1292, 734, 210, 16); g.strokeStyle = C.line; g.lineWidth = 2.4; g.strokeRect(1292, 734, 210, 16);
    g.fillStyle = C.red; for (let x = 1300; x < 1496; x += 24) g.fillRect(x, 739, 10, 6);
  }

  // ---------------- Mural surface: multiply mottling + cracks + grain ----------------
  const surface = () => P.cached('eg_surface', W, H, (g) => {
    const img = g.createImageData(W, H), d = img.data, r = U.rng(99);
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
      const n = P.fbm(x * 0.006 + 40, y * 0.006, 4), m = P.fbm(x * 0.03, y * 0.03 + 9, 2);
      const v = 243 + n * 30 + m * 12 + (r() - 0.5) * 18;
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const i = ((y + dy) * W + x + dx) * 4; d[i] = v; d[i + 1] = v - 6; d[i + 2] = v - 16; d[i + 3] = 255; }
    }
    g.putImageData(img, 0, 0);
    // Hairline cracks (aged wall, across figures)
    const rr = U.rng(5);
    [[0, 610, 0.1], [700, 0, 1.3], [1210, 0, 1.1], [1500, 980, -0.9], [380, 1080, -1.2], [1920, 420, 2.9]].forEach(([x, y, a0]) => {
      g.strokeStyle = 'rgba(90,70,50,.55)'; g.lineWidth = 1.1; let a = a0;
      g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 34; s++) { a += (rr() - 0.5) * 0.7; x += Math.cos(a) * 14; y += Math.sin(a) * 14; g.lineTo(x, y); if (rr() < 0.08) { g.moveTo(x, y); } } g.stroke();
    });
  });
  const specks = () => P.grain('eg_specks', 0.018, [70, 50, 30], 0.4);

  // ---------------- Aten rays: small tip hands open/close ----------------
  const HANDS = [[444, 322], [436, 358], [428, 402], [440, 462], [446, 508], [492, 512], [538, 498], [612, 470], [680, 452], [712, 424], [732, 390], [746, 356], [748, 326]];
  function handAt(g, x, y, ang, open, col = '#b4452c') {
    g.save(); g.translate(x, y); g.rotate(ang);
    g.fillStyle = col; g.strokeStyle = '#5a1c10'; g.lineWidth = 1.3;
    g.scale(1.35, 1.35);
    g.lineCap = 'round'; g.lineWidth = 4.2;
    g.scale(0.9 + 0.3 * open, 0.9 + 0.3 * open);
    for (let k = 0; k < 4; k++) { const a = (k - 1.5) * (0.03 + open * 0.42); g.beginPath(); g.moveTo(Math.cos(a) * 5, Math.sin(a) * 5); g.lineTo(Math.cos(a) * (12.5 + open * 1.5), Math.sin(a) * (12.5 + open * 1.5)); g.strokeStyle = '#5a1c10'; g.lineWidth = 5.6; g.stroke(); g.strokeStyle = col; g.lineWidth = 3.4; g.stroke(); }
    g.beginPath(); g.moveTo(1, -5); g.lineTo(5, -10 - open * 3); g.strokeStyle = '#5a1c10'; g.lineWidth = 5.4; g.stroke(); g.strokeStyle = col; g.lineWidth = 3.2; g.stroke();
    g.beginPath(); g.ellipse(0, 0, 8, 6.6, 0, 0, 7); g.fillStyle = col; g.fill(); g.strokeStyle = '#5a1c10'; g.lineWidth = 1.2; g.stroke();
    g.beginPath(); g.moveTo(-9, 0); g.lineTo(-14, 0); g.strokeStyle = col; g.lineWidth = 4; g.stroke();       // Wrist
    g.restore();
  }
  function rays(c, lt, t) {
    c.save(); c.lineCap = 'round';
    // Pulsing disk halo (0.45s period)
    const pu = 0.5 + 0.5 * Math.sin(lt * Math.PI * 2 / 0.45);
    c.save(); c.beginPath(); c.rect(408, 200, 364, 330); c.clip();
    const hg = c.createRadialGradient(DISK[0], DISK[1], 46, DISK[0], DISK[1], 70 + 30 * pu); hg.addColorStop(0, `rgba(255,180,80,${0.5 * pu + 0.12})`); hg.addColorStop(1, 'rgba(255,170,70,0)');
    c.fillStyle = hg; c.beginPath(); c.arc(DISK[0], DISK[1], 100 + 30 * pu, 0, 7); c.fill();
    c.beginPath(); c.arc(DISK[0], DISK[1], 52 + 6 * pu, 0, 7); c.strokeStyle = `rgba(255,214,110,${0.75 * pu})`; c.lineWidth = 5; c.stroke();
    c.beginPath(); c.arc(DISK[0], DISK[1], 46, 0, 7); c.fillStyle = '#c8372b'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#7a1c14'; c.stroke();
    c.fillStyle = C.gold; c.beginPath(); c.ellipse(580, 300, 7, 10, 0, 0, 7); c.fill(); c.strokeStyle = C.black; c.lineWidth = 1.6; c.stroke();
    c.restore();
    const ray = (ex0, ey0, k, long) => {
      // Rays extend/retract across fan (wave along k), tips ±9%
      const ext = 1 + 0.09 * Math.sin(lt * Math.PI * 2 / 0.45 - k * 0.55);
      let ex = DISK[0] + (ex0 - DISK[0]) * ext, ey = DISK[1] + (ey0 - DISK[1]) * ext; if (!long) { ex = clamp(ex, 428, 752); ey = Math.min(ey, 512); }
      const wob = Math.sin(t * 7 + k * 1.3) * 3, wx = ex + wob, wy = ey + Math.cos(t * 6 + k) * 2;
      const ang = Math.atan2(wy - DISK[1], wx - DISK[0]);
      c.strokeStyle = '#c23a2a'; c.lineWidth = (long ? 2.6 : 2.2) + 1.6 * (ext - 0.91) / 0.18;
      c.beginPath(); c.moveTo(DISK[0] + Math.cos(ang) * 44, DISK[1] + Math.sin(ang) * 44); c.lineTo(wx - Math.cos(ang) * 6, wy - Math.sin(ang) * 6); c.stroke();
      const open = 0.5 + 0.5 * Math.sin(lt * Math.PI * 2 / 0.4 + k * 0.9);
      handAt(c, wx, wy, ang, open);
      return [wx, wy, ang];
    };
    c.save(); c.beginPath(); c.rect(408, 200, 364, 330); c.clip();
    HANDS.forEach(([x, y], k) => ray(x, y, k, false));
    c.restore();
    // Window segments of two long rays (outer segments/hands added after cat, over it)
    LONG.forEach(([x, y, k]) => { const wx = x + Math.sin(t * 7 + k * 1.3) * 3, wy = y + Math.cos(t * 6 + k) * 2, ang = Math.atan2(wy - DISK[1], wx - DISK[0]);
      c.strokeStyle = '#c23a2a'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(DISK[0] + Math.cos(ang) * 44, DISK[1] + Math.sin(ang) * 44); c.lineTo(lerp(DISK[0], wx, 0.64), lerp(DISK[1], wy, 0.64)); c.stroke(); });
    c.restore();
  }

  // ---------------- Scarab pushing sun ball ----------------
  function scarab(c, lt) {
    let x = 800 + 642 * (lt - 0.394); x = ((x + 120) % 2160 + 2160) % 2160 - 120;
    const y = 1044, bx = x + 54, br = 23, rot = bx / br, pose = Math.floor(lt * 15) % 2;
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    c.translate(x + 27, y); c.scale(1.22, 1.22); c.translate(-x - 27, -y);
    // Sun ball: red with yellow dots, rolls forward
    c.beginPath(); c.arc(bx, y - 2, br, 0, 7); c.fillStyle = '#c8302a'; c.fill(); c.strokeStyle = '#3a0c08'; c.lineWidth = 2.2; c.stroke();
    c.save(); c.clip(); c.fillStyle = '#f2c23a';
    for (let k = 0; k < 9; k++) { const a = rot + k * 0.698, rr = k % 3 === 0 ? 0 : 14; const px = bx + Math.cos(a) * rr, py = y - 2 + Math.sin(a) * rr * 0.9; if (k % 3 === 0 && k) continue; c.beginPath(); c.arc(px, py, 3.6, 0, 7); c.fill(); }
    c.restore();
    // Legs: two poses alternating every 4 frames (60fps)
    c.strokeStyle = '#141a30'; c.lineWidth = 3;
    const legs = pose ? [[-14, -16, -26], [0, -18, -6], [14, -14, 18]] : [[-14, -14, -32], [0, -19, 2], [14, -18, 24]];
    legs.forEach(([lx, ly, ex], i) => { for (const s of [-1, 1]) { const q = s * (i === 1 ? 1 : (pose ? 1 : -1)); c.beginPath(); c.moveTo(x + lx, y); c.lineTo(x + lx + (ex - lx) * 0.5, y + s * (ly - 4)); c.lineTo(x + ex + q * 2, y + s * (ly + 4)); c.stroke(); } });
    // Front feet push ball
    c.beginPath(); c.moveTo(x + 26, y - 4); c.lineTo(bx - br + 2, y - 12 + pose * 3); c.moveTo(x + 26, y + 4); c.lineTo(bx - br + 1, y + 8 - pose * 3); c.stroke();
    // Body: lapis blue + turquoise wing-case highlights
    c.beginPath(); c.ellipse(x - 4, y, 24, 17, 0, 0, 7); c.fillStyle = C.lapis; c.fill(); c.strokeStyle = '#0d1430'; c.lineWidth = 2.2; c.stroke();
    c.beginPath(); c.moveTo(x - 28, y); c.lineTo(x + 18, y); c.stroke();
    c.fillStyle = C.turq; c.beginPath(); c.ellipse(x - 8, y - 8, 12, 4, -0.1, 0, 7); c.fill(); c.beginPath(); c.ellipse(x - 8, y + 8, 12, 4, 0.1, 0, 7); c.fill();
    c.beginPath(); c.ellipse(x + 22, y, 8, 11, 0, 0, 7); c.fillStyle = '#3a68c4'; c.fill(); c.strokeStyle = '#0d1430'; c.stroke();
    c.fillStyle = C.gold; c.beginPath(); c.arc(x + 25, y, 3, 0, 7); c.fill();
    c.restore();
  }

  // ---------------- Orange-white cat in Bastet seated pose ----------------
  const CAT_S = 0.85, CAT_ANCHOR = [540, 898];
  const catPt = (x, y) => [CAT_ANCHOR[0] + (x - CAT_ANCHOR[0]) * CAT_S, CAT_ANCHOR[1] + (y - CAT_ANCHOR[1]) * CAT_S];
  const LONG = [[...catPt(540, 676), 20], [...catPt(668, 626), 21]];     // Two long-ray tips scale with cat head
  function cat(c, K, ch) {
    const L = C.line, hc = K.headC, br = ch.breathe * 260;
    const B = (x, y) => [x, y - (y < 800 ? br * (800 - y) / 130 : 0)];
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    // Scale 0.85 about feet (540,898): ear tips y≈530 → ≈585, clear window bottom y≈560
    c.translate(CAT_ANCHOR[0], CAT_ANCHOR[1]); c.scale(CAT_S, CAT_S); c.translate(-CAT_ANCHOR[0], -CAT_ANCHOR[1]);
    // Tail curls from rear around front
    const tp = K.tailPts;
    c.strokeStyle = L; c.lineWidth = 24; c.beginPath(); tp.forEach((p, i) => i ? c.lineTo(p[0], p[1] - 4) : c.moveTo(p[0], p[1] - 4)); c.stroke();
    c.strokeStyle = C.catO; c.lineWidth = 19; c.stroke();
    c.strokeStyle = C.catS; c.lineWidth = 4;
    for (let i = 3; i < tp.length - 3; i += 3) { const a = tp[i], b = tp[i + 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2; c.beginPath(); c.moveTo(a[0] + Math.cos(ang) * 8, a[1] - 4 + Math.sin(ang) * 8); c.lineTo(a[0] - Math.cos(ang) * 8, a[1] - 4 - Math.sin(ang) * 8); c.stroke(); }
    const tip = tp[tp.length - 1]; c.fillStyle = C.catW; c.beginPath(); c.arc(tip[0], tip[1] - 4, 9, 0, 7); c.fill(); c.strokeStyle = L; c.lineWidth = 2; c.beginPath(); c.arc(tip[0], tip[1] - 4, 10.5, -1.2, 1.9); c.stroke();
    // Body: upright torso, round haunches; front legs within silhouette (white chest through paws)
    const body = sm([[568, 666], [538, 690], [506, 726], [482, 772], [468, 818], [464, 860], [474, 897], [560, 899], [666, 899], [663, 862], [659, 800], [654, 744], [646, 706], [640, 680]].map(p => B(...p)));
    const cw = sm([B(616, 688), B(640, 678), B(650, 716), B(656, 790), [661, 860], [666, 899], [598, 899], [600, 850], [604, 790], B(610, 736)]);
    c.fillStyle = C.catO; c.fill(body);
    c.save(); c.clip(body);
    c.fillStyle = C.catW; c.fill(cw);
    c.strokeStyle = C.catS; c.lineWidth = 6;
    [[[548, 690], [532, 716]], [[524, 704], [508, 736]], [[500, 730], [484, 766]], [[480, 764], [466, 800]], [[464, 806], [456, 840]], [[558, 716], [542, 748]], [[536, 744], [520, 780]], [[512, 776], [498, 812]], [[578, 742], [566, 770]]].forEach(([a, b]) => { c.beginPath(); c.moveTo(...B(...a)); c.quadraticCurveTo(a[0] - 14, (a[1] + b[1]) / 2, ...B(...b)); c.stroke(); });
    // Hind thigh arc + leg stripes
    c.strokeStyle = C.catS; c.lineWidth = 5; [[496, 850, 512, 826], [520, 836, 536, 812], [546, 830, 560, 810], [568, 836, 578, 818]].forEach(([a, b, x2, y2]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(x2, y2); c.stroke(); });
    c.strokeStyle = L; c.lineWidth = 2.6; c.beginPath(); c.moveTo(492, 897); c.bezierCurveTo(484, 830, 552, 796, 598, 852); c.stroke();
    // Front-leg separation and toe lines
    c.lineWidth = 2.2; c.beginPath(); c.moveTo(631, 792); c.quadraticCurveTo(634, 850, 632, 899); c.stroke();
    c.beginPath(); c.moveTo(604, 800); c.quadraticCurveTo(600, 850, 601, 899); c.stroke();
    c.lineWidth = 1.4; for (const x of [612, 621, 642, 652]) { c.beginPath(); c.moveTo(x, 890); c.lineTo(x, 898); c.stroke(); }
    c.restore();
    c.strokeStyle = L; c.lineWidth = 2.8; c.stroke(body);
    // Rear paw (white)
    c.beginPath(); c.ellipse(574, 893, 22, 6.5, 0, 0, 7); c.fillStyle = C.catW; c.fill(); c.lineWidth = 2.2; c.stroke();
    // Head: profile, tall pointed ears
    const Hd = (x, y) => [hc[0] + x, hc[1] + y];
    // Ear twitch: quick 0.1s twitch every ~0.38s (offset ears), rotate around ear-base midpoint
    const twitch = (ph) => { const f = (ch.lt * 2.6 + ph) % 1; return f < 0.26 ? Math.sin(f / 0.26 * Math.PI) : 0; };
    const earRot = (e, a) => { const bx = (e[0][0] + e[2][0]) / 2, by = (e[0][1] + e[2][1]) / 2, cs = Math.cos(a), sn = Math.sin(a); return e.map(([x, y]) => [bx + (x - bx) * cs - (y - by) * sn, by + (x - bx) * sn + (y - by) * cs]); };
    const ear1 = earRot([Hd(-40, -26), Hd(-30, -84), Hd(-8, -36)], -0.38 * twitch(0.1)), ear2 = earRot([Hd(4, -38), Hd(22, -90), Hd(36, -28)], 0.32 * twitch(0.6));
    [ear1, ear2].forEach((e, k) => { poly(c, e); fs(c, C.catO, L, 2.6); poly(c, [[lerp(e[0][0], e[1][0], 0.2) + 4, lerp(e[0][1], e[1][1], 0.2)], [lerp(e[0][0], e[1][0], 0.85) + (k ? 2 : 3), lerp(e[0][1], e[1][1], 0.85) + 4], [lerp(e[2][0], e[1][0], 0.2) - 3, lerp(e[2][1], e[1][1], 0.2)]]); c.fillStyle = '#e99a86'; c.fill(); });
    const head = sm([Hd(-44, 40), Hd(-50, 4), Hd(-38, -30), Hd(-6, -40), Hd(30, -32), Hd(52, -16), Hd(64, 2), Hd(72, 14), Hd(68, 30), Hd(52, 44), Hd(22, 52), Hd(-10, 52)]);
    c.fillStyle = C.catO; c.fill(head);
    c.save(); c.clip(head);
    c.fillStyle = C.catW; c.beginPath(); c.ellipse(...Hd(54, 34), 30, 22, -0.2, 0, 7); c.fill(); c.beginPath(); c.ellipse(...Hd(30, 52), 30, 12, 0, 0, 7); c.fill();
    c.strokeStyle = C.catS; c.lineWidth = 4.5; [[-8, -38, -4, -20], [6, -40, 8, -22], [18, -36, 20, -20], [-34, -6, -18, 0], [-36, 10, -20, 12]].forEach(([a, b, x2, y2]) => { c.beginPath(); c.moveTo(...Hd(a, b)); c.lineTo(...Hd(x2, y2)); c.stroke(); });
    c.restore();
    c.strokeStyle = L; c.lineWidth = 2.8; c.stroke(head);
    // Frontal eye (Egyptian large almond + extended eyeliner)
    const e = Hd(32, -8);
    if (K.blink) { c.strokeStyle = L; c.lineWidth = 3; c.beginPath(); c.moveTo(e[0] - 14, e[1]); c.quadraticCurveTo(e[0], e[1] + 5, e[0] + 14, e[1]); c.stroke(); }
    else {
      c.beginPath(); c.moveTo(e[0] - 15, e[1]); c.quadraticCurveTo(e[0], e[1] - 13, e[0] + 15, e[1] - 1); c.quadraticCurveTo(e[0], e[1] + 10, e[0] - 15, e[1]); c.closePath(); fs(c, '#e8cf4a', L, 2.6);
      c.fillStyle = L; c.beginPath(); c.ellipse(e[0] + 2, e[1] - 1, 3, 7, 0, 0, 7); c.fill();
    }
    c.strokeStyle = L; c.lineWidth = 3.4; c.beginPath(); c.moveTo(e[0] - 15, e[1]); c.lineTo(e[0] - 30, e[1] - 3); c.stroke();
    // Nose, mouth, whiskers
    poly(c, [Hd(66, 8), Hd(73, 9), Hd(70, 15)]); c.fillStyle = '#d0706a'; c.fill();
    c.strokeStyle = L; c.lineWidth = 2; c.beginPath(); c.moveTo(...Hd(70, 15)); c.quadraticCurveTo(...Hd(66, 26), ...Hd(58, 28)); c.stroke();
    c.lineWidth = 1.2; [[60, 22, 104, 12], [60, 26, 106, 28], [58, 30, 100, 40]].forEach(([a, b, x2, y2]) => { c.beginPath(); c.moveTo(...Hd(a, b)); c.lineTo(...Hd(x2, y2)); c.stroke(); });
    // Gold earring
    c.strokeStyle = C.gold; c.lineWidth = 3.4; c.beginPath(); c.arc(...Hd(-28, -18), 7, 0.3, 5.9); c.stroke();
    // Colored collar (red/blue/gold) + Eye of Horus pendant
    const clipU = new Path2D(); clipU.addPath(body); clipU.addPath(head);
    c.save(); c.clip(clipU);
    const col = [B(556, 664), B(600, 690), B(652, 694)];
    [[C.gold, 22], [C.red, 16], [C.blue, 9], [C.gold, 3]].forEach(([cc, w]) => { c.strokeStyle = cc; c.lineWidth = w; c.beginPath(); c.moveTo(...col[0]); c.quadraticCurveTo(...col[1], ...col[2]); c.stroke(); });
    c.strokeStyle = L; c.lineWidth = 1.6; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(col[0][0], col[0][1] + s * 11); c.quadraticCurveTo(col[1][0], col[1][1] + s * 11, col[2][0], col[2][1] + s * 11); c.stroke(); }
    c.fillStyle = C.gold; for (let q = 0.1; q < 1; q += 0.12) { const x = (1 - q) * (1 - q) * col[0][0] + 2 * q * (1 - q) * col[1][0] + q * q * col[2][0], y = (1 - q) * (1 - q) * col[0][1] + 2 * q * (1 - q) * col[1][1] + q * q * col[2][1]; c.beginPath(); c.arc(x, y + 15, 3, 0, 7); c.fill(); }
    c.restore();
    const pd = B(640, 742);
    c.strokeStyle = C.goldD; c.lineWidth = 2; c.beginPath(); c.moveTo(col[2][0] - 14, col[2][1] + 8); c.lineTo(pd[0], pd[1] - 14); c.stroke();
    c.beginPath(); c.arc(pd[0], pd[1], 13, 0, 7); fs(c, C.gold, L, 2);
    c.beginPath(); c.moveTo(pd[0] - 8, pd[1]); c.quadraticCurveTo(pd[0], pd[1] - 6, pd[0] + 8, pd[1]); c.quadraticCurveTo(pd[0], pd[1] + 5, pd[0] - 8, pd[1]); fs(c, '#f4f0e4', '#14204a', 1.5);
    c.fillStyle = '#14204a'; c.beginPath(); c.arc(pd[0], pd[1], 2.4, 0, 7); c.fill();
    c.strokeStyle = '#14204a'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(pd[0] - 1, pd[1] + 3); c.lineTo(pd[0] - 3, pd[1] + 9); c.stroke();
    c.restore();
  }

  // ---------------- Girl: Egyptian conventions (profile/frontal eye, frontal shoulders, white linen dress, broad collar, golden braids) ----------------
  const DY = -25;
  function girl(c, G, ch) {
    const L = C.line, tilt = G.tilt, nk = [1300, 425 + DY], cs = Math.cos(tilt), sn = Math.sin(tilt);
    const HP = (x, y) => { const X = x - nk[0], Y = y + DY - nk[1]; return [nk[0] + X * cs - Y * sn, nk[1] + X * sn + Y * cs]; };
    const TB = (x, y) => [x, y + DY + (y < 600 ? ch.breathe * 150 * (600 - y) / 170 : 0)];
    const T = (x, y) => [x, y + DY];
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    // Torso (frontal shoulders; translucent linen: skin first, then white)
    const torso = sm([[1270, 466], [1298, 450], [1340, 447], [1420, 454], [1452, 474], [1452, 530], [1440, 590], [1432, 616], [1300, 616], [1288, 560], [1280, 504]].map(p => TB(...p)));
    // Dress hem drops vertically from knees to ankles
    const skirt = sm([[1300, 600], [1238, 620], [1186, 642], [1156, 670], [1145, 724], [1140, 800], [1134, 905], [1262, 905], [1270, 820], [1282, 762], [1330, 754], [1462, 758], [1470, 700], [1452, 640], [1432, 602]].map(p => T(...p)));
    // Feet (bare, profile)
    [[1198, 1118], [1170, 1092]].forEach(([hx, tx], k) => { const y0 = 900 - 0; const f = sm([[hx + 10, y0 - 22], [hx + 14, y0 - 6], [hx + 6, y0], [tx + 4, y0], [tx - 2, y0 - 6], [tx + 10, y0 - 12], [hx - 30, y0 - 20]]); c.fillStyle = k ? C.skin : C.skinD; c.fill(f); c.strokeStyle = L; c.lineWidth = 2.2; c.stroke(f); });
    c.fillStyle = C.skin; c.fill(torso);
    c.globalAlpha = 0.9; c.fillStyle = C.white; c.fill(torso); c.fill(skirt); c.globalAlpha = 1;
    // Fine fan-shaped folds (waist to knee, then down to hem)
    c.save(); c.clip(skirt); c.strokeStyle = 'rgba(120,96,70,.5)'; c.lineWidth = 1.3;
    for (let i = 0; i <= 26; i++) { const a = i / 26; c.beginPath(); c.moveTo(lerp(1290, 1460, a), 600 + DY); c.bezierCurveTo(lerp(1200, 1460, a), lerp(650, 752, a) + DY, lerp(1150, 1272, a), lerp(700, 790, a) + DY, lerp(1134, 1262, a), 905 + DY); c.stroke(); }
    c.strokeStyle = 'rgba(90,60,40,.55)'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(1170, 686 + DY); c.quadraticCurveTo(1320, 700 + DY, 1462, 742 + DY); c.stroke();
    c.restore();
    c.save(); c.clip(torso); c.strokeStyle = 'rgba(120,96,70,.45)'; c.lineWidth = 1.2;
    for (let x = 1290; x < 1455; x += 9) { c.beginPath(); c.moveTo(x, 470 + DY); c.quadraticCurveTo(x + 6, 540 + DY, x + 2, 620 + DY); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,.0)'; c.restore();
    c.strokeStyle = L; c.lineWidth = 2.4; c.stroke(skirt); c.stroke(torso);
    // Belt (thin red with two hanging ends)
    c.strokeStyle = C.red; c.lineWidth = 6; c.beginPath(); c.moveTo(...T(1298, 604)); c.quadraticCurveTo(...T(1370, 616), ...T(1440, 606)); c.stroke();
    c.lineWidth = 4; c.beginPath(); c.moveTo(...T(1306, 606)); c.lineTo(...T(1292, 660)); c.moveTo(...T(1316, 607)); c.lineTo(...T(1310, 664)); c.stroke();
    // Broad collar (concentric bands + teardrop pendant)
    const cc = TB(1358, 440);
    const bands = [[C.blue, 50, 24], [C.red, 60, 32], [C.green, 70, 40], [C.gold, 80, 48], [C.blue, 88, 55]];
    for (let k = bands.length - 1; k >= 0; k--) { const [col, rx, ry] = bands[k]; c.beginPath(); c.ellipse(cc[0], cc[1], rx + 4, ry + 4, 0.05, 0, Math.PI); c.lineTo(cc[0] - rx - 4, cc[1]); c.fillStyle = col; c.fill(); }
    c.strokeStyle = L; c.lineWidth = 1.2; bands.forEach(([, rx, ry]) => { c.beginPath(); c.ellipse(cc[0], cc[1], rx + 4, ry + 4, 0.05, 0.05, Math.PI - 0.05); c.stroke(); });
    for (let a = 0.12; a < Math.PI - 0.1; a += 0.17) { const x = cc[0] + Math.cos(a) * 99, y = cc[1] + Math.sin(a) * 66; c.save(); c.translate(x, y); c.rotate(a - Math.PI / 2); c.beginPath(); c.moveTo(-4, -6); c.quadraticCurveTo(-5, 4, 0, 7); c.quadraticCurveTo(5, 4, 4, -6); c.closePath(); c.fillStyle = (Math.round(a / 0.17) % 2) ? C.red : C.blue; c.fill(); c.lineWidth = 1; c.stroke(); c.restore(); }
    // Far arm hangs beside body, forearm on legs (gold armlet/bracelet)
    const sh2 = TB(1446, 478), el2 = T(1452, 612), hd2 = T(1300, 662);
    c.fillStyle = C.skin; c.strokeStyle = L; c.lineWidth = 2.4;
    const ua = RIG.taper(sh2, el2, 36, 28, 4), fa = RIG.taper(el2, hd2, 28, 20, 2);
    c.fill(ua); c.stroke(ua); c.fill(fa); c.stroke(fa);
    const hand2 = sm([[hd2[0] + 14, hd2[1] - 10], [hd2[0] - 14, hd2[1] - 8], [hd2[0] - 36, hd2[1] - 2], [hd2[0] - 38, hd2[1] + 5], [hd2[0] - 10, hd2[1] + 9], [hd2[0] + 14, hd2[1] + 9]]); c.fill(hand2); c.stroke(hand2);
    c.lineWidth = 1.2; for (const s of [-3, 2]) { c.beginPath(); c.moveTo(hd2[0] - 12, hd2[1] + s); c.lineTo(hd2[0] - 34, hd2[1] + s + 2); c.stroke(); }
    const band = (A, B, q, w) => { const x = lerp(A[0], B[0], q), y = lerp(A[1], B[1], q), a = Math.atan2(B[1] - A[1], B[0] - A[0]) + Math.PI / 2; c.strokeStyle = C.gold; c.lineWidth = 8; c.beginPath(); c.moveTo(x + Math.cos(a) * w, y + Math.sin(a) * w); c.lineTo(x - Math.cos(a) * w, y - Math.sin(a) * w); c.stroke(); c.strokeStyle = C.blue; c.lineWidth = 2.5; c.stroke(); };
    band(sh2, el2, 0.32, 19); band(el2, hd2, 0.84, 12);
    // Neck, face
    const neck = sm([[1286, 400], [1316, 400], [1326, 450], [1288, 452]].map(p => T(...p)));
    c.fillStyle = C.skin; c.fill(neck); c.strokeStyle = L; c.lineWidth = 2.2; c.stroke(neck);
    // Wig: golden segmented vertical braids from crown to rear shoulder
    const wig = sm([[1258, 322], [1266, 298], [1300, 283], [1348, 285], [1388, 304], [1410, 342], [1416, 400], [1422, 470], [1418, 548], [1396, 556], [1372, 548], [1360, 470], [1344, 432], [1328, 404], [1316, 372], [1312, 336], [1290, 324]].map(p => HP(...p)));
    c.fillStyle = '#9a6a18'; c.fill(wig);
    c.save(); c.clip(wig);
    // Each vertical braid: gold round-ended strip + diagonal herringbone segments, staggered ends
    for (let i = 0; i < 15; i++) {
      const x0 = 1260 + i * 11, yEnd = (i < 5 ? 420 : 560) - (i * 37 % 23);
      const pts = []; for (let y = 284; y <= yEnd; y += 8) pts.push(HP(x0 + (y > 420 ? (y - 420) * 0.06 : 0), y));
      c.strokeStyle = '#7a4e10'; c.lineWidth = 11.5; c.beginPath(); pts.forEach((p, k) => k ? c.lineTo(...p) : c.moveTo(...p)); c.stroke();
      c.strokeStyle = (i % 3 === 1) ? C.goldL : C.gold; c.lineWidth = 8.5; c.stroke();
      c.strokeStyle = '#8a5a12'; c.lineWidth = 1.4;
      for (let k = 1; k < pts.length; k++) { const p = pts[k], side = k % 2 ? 1 : -1; c.beginPath(); c.moveTo(p[0] - 4.2, p[1] - 3 * side); c.lineTo(p[0] + 4.2, p[1] + 3 * side); c.stroke(); }
    }
    c.restore();
    c.strokeStyle = L; c.lineWidth = 2.4; c.stroke(wig);
    // Face (rig profile contour)
    c.fillStyle = C.skin; c.fill(G.face); c.strokeStyle = L; c.lineWidth = 2.4; c.stroke(G.face);
    // Ear + large gold earring
    c.beginPath(); c.ellipse(G.ear[0] - 2, G.ear[1], 7, 11, 0.2, 0, 7); fs(c, C.skin, L, 1.8);
    c.beginPath(); c.arc(G.ear[0] - 2, G.ear[1] + 22, 9, 0, 7); fs(c, C.gold, L, 1.8); c.beginPath(); c.arc(G.ear[0] - 2, G.ear[1] + 22, 3.5, 0, 7); c.fillStyle = C.red; c.fill();
    // Gold headband + hanging rear ribbons
    const hb = [HP(1260, 314), HP(1300, 300), HP(1352, 302), HP(1398, 324)];
    c.strokeStyle = L; c.lineWidth = 15; c.beginPath(); c.moveTo(...hb[0]); c.bezierCurveTo(...hb[1], ...hb[2], ...hb[3]); c.stroke();
    c.strokeStyle = C.gold; c.lineWidth = 11; c.stroke(); c.strokeStyle = C.goldL; c.lineWidth = 3; c.stroke();
    const kn = HP(1402, 326), kt = HP(1440, 392), kt2 = HP(1430, 410);
    poly(c, [kn, kt, kt2, HP(1396, 340)]); fs(c, C.gold, L, 1.8);
    c.fillStyle = C.blue; c.beginPath(); c.arc(...HP(1262, 314), 5, 0, 7); c.fill();
    // Frontal eye (almond, trailing black eyeliner, long brow)
    const ex = G.eye.x + 2, ey = G.eye.y;
    if (ch.blink) { c.strokeStyle = L; c.lineWidth = 3; c.beginPath(); c.moveTo(ex - 11, ey); c.quadraticCurveTo(ex, ey + 4, ex + 12, ey); c.stroke(); }
    else {
      c.beginPath(); c.moveTo(ex - 11, ey); c.quadraticCurveTo(ex, ey - 9, ex + 12, ey - 1); c.quadraticCurveTo(ex, ey + 6, ex - 11, ey); c.closePath(); fs(c, '#fbf7ee', null);
      c.fillStyle = '#1a120c'; c.beginPath(); c.arc(ex - 1, ey - 1.5, 4.2, 0, 7); c.fill();
    }
    c.strokeStyle = '#140c08'; c.lineWidth = 3.2; c.beginPath(); c.moveTo(ex - 12, ey); c.quadraticCurveTo(ex, ey - 10, ex + 12, ey - 1); c.lineTo(ex + 30, ey - 3); c.stroke();
    c.lineWidth = 1.8; c.beginPath(); c.moveTo(ex - 10, ey + 1); c.quadraticCurveTo(ex, ey + 6, ex + 14, ey + 1); c.stroke();
    c.lineWidth = 3; c.beginPath(); c.moveTo(ex - 12, ey - 12); c.quadraticCurveTo(ex + 4, ey - 19, ex + 26, ey - 12); c.stroke();
    // Lips
    c.fillStyle = '#b6443a'; c.beginPath(); c.moveTo(...G.lips[0]); c.lineTo(...G.lips[1]); c.lineTo(...G.lips[2]); c.closePath(); c.fill();
    // Near arm: front shoulder to lips holding cup (custom IK, elbow down)
    // Hand supports bowl/holds foot instead of rig's default side grip, letting elbow hang before chest as in design
    const cpp = G.cup, hd = [cpp.x + 4 - Math.sin(cpp.tilt) * 40, cpp.y + Math.cos(cpp.tilt) * 42];
    const sh = TB(1282, 476);
    const { E } = RIG.ik2(sh, hd, 140, 160, -1);
    const ua1 = RIG.taper(sh, E, 38, 30, 4), fa1 = RIG.taper(E, hd, 30, 22, 2);
    c.fillStyle = C.skin; c.strokeStyle = L; c.lineWidth = 2.4; c.fill(ua1); c.stroke(ua1); c.fill(fa1); c.stroke(fa1);
    band(sh, E, 0.4, 19); band(E, hd, 0.8, 13);
    // Blue lotus cup
    const cp = G.cup;
    c.save(); c.translate(cp.x, cp.y); c.rotate(cp.tilt);
    c.beginPath(); c.moveTo(-26, 0); c.quadraticCurveTo(-22, 26, -5, 34); c.lineTo(-4, 44); c.quadraticCurveTo(-14, 46, -14, 50); c.lineTo(14, 50); c.quadraticCurveTo(14, 46, 4, 44); c.lineTo(5, 34); c.quadraticCurveTo(22, 26, 26, 0); c.closePath(); fs(c, '#2f62c4', L, 2.2);
    c.strokeStyle = '#8ab8f0'; c.lineWidth = 1.6; [[-14, 2, -4, 30], [0, 1, 0, 32], [14, 2, 4, 30]].forEach(([a, b, x2, y2]) => { c.beginPath(); c.moveTo(a, b); c.quadraticCurveTo((a + x2) / 2 + (a < 0 ? -4 : a > 0 ? 4 : 0), 18, x2, y2); c.stroke(); });
    c.beginPath(); c.ellipse(0, 0, 26, 4.5, 0, 0, 7); fs(c, '#1c3f8a', L, 1.8);
    c.restore();
    // Hand holding cup
    const hf = sm([[hd[0] - 20, hd[1] - 4], [hd[0] - 8, hd[1] - 10], [hd[0] + 10, hd[1] - 8], [hd[0] + 16, hd[1] + 6], [hd[0] + 2, hd[1] + 14], [hd[0] - 18, hd[1] + 6]]);
    c.fillStyle = C.skin; c.fill(hf); c.strokeStyle = L; c.lineWidth = 2.2; c.stroke(hf);
    c.lineWidth = 1.2; for (const s of [-4, 2]) { c.beginPath(); c.moveTo(hd[0] - 18, hd[1] + s); c.lineTo(hd[0] - 4, hd[1] + s + 1); c.stroke(); }
    c.restore();
  }

  return {
    init() { P.cached('eg_static', W, H, staticLayer); surface(); specks(); },
    draw(c, lt, t) {
      const ch = P.choreo(lt, t);
      c.drawImage(P.cached('eg_static', W, H, staticLayer), 0, 0);
      // Water hieroglyph: flowing zigzag phase (12fps steps, hand-drawn feel)
      const wp = Math.floor(lt * 12) * 0.5;          // Half a tooth per 1/12s, four-step cycle (0.33s)
      GLYPHS.forEach(q => { if (GL[q.n].water) drawGlyph(c, q, wp + q.ph); });
      rays(c, lt, t);
      writeGlyphs(c, lt);
      ch.lt = lt;
      const K = RIG.cat({ tail: ch.tail * 2.1 + 0.25 * Math.sin(t * 9.5), blink: ch.blink, breathe: ch.breathe, dy: -5 });
      cat(c, K, ch);
      // Two long rays must overlay cat
      c.save(); c.lineCap = 'round';
      LONG.forEach(([x, y, k]) => {
        const wx = x + Math.sin(t * 7 + k * 1.3) * 3, wy = y + Math.cos(t * 6 + k) * 2, ang = Math.atan2(wy - DISK[1], wx - DISK[0]);
        c.strokeStyle = '#c23a2a'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(lerp(DISK[0], wx, 0.62), lerp(DISK[1], wy, 0.62)); c.lineTo(wx - Math.cos(ang) * 6, wy - Math.sin(ang) * 6); c.stroke();
        handAt(c, wx, wy, ang, 0.5 + 0.5 * Math.sin(lt * Math.PI * 2 / 0.4 + k * 0.9));       // handAt already amplifies opening/closing
        drawGlyph(c, { n: 'ankh', x: wx + Math.cos(ang) * 16, y: wy + Math.sin(ang) * 16 + 4, s: 0.36, col: C.blue });
      });
      c.restore();
      // Girl: cup stays near lips as in source; choreo lift covers final short distance + small sips
      // Lift with choreo first; from lt>0.35, 0.6s cycles lower cup (1→0.62) then return; tilt head back drinking at lips (~0.2rad)
      let cupV = lerp(0.8, 1, ch.cup), sipV = ch.sip;
      if (lt > 0.35) { const u = (lt - 0.35) / 0.6; cupV = 1 - 0.46 * (1 - Math.cos(u * Math.PI * 2)) / 2; }
      sipV += 0.3 * clamp((cupV - 0.78) / 0.22) * (0.65 + 0.35 * Math.sin(lt * 13));
      const G = RIG.girl({ cup: cupV, sip: sipV, breathe: ch.breathe, dy: DY, hair: 'down' });
      girl(c, G, ch);
      scarab(c, lt);
      // Mural surface: multiply mottling + grain
      c.save(); c.globalCompositeOperation = 'multiply'; c.drawImage(surface(), 0, 0); c.restore();
      c.drawImage(specks(), 0, 0);
    },
  };
})();
