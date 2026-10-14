// Munch's The Scream Expressionism (1893) — pure code.
// Pipeline: ① streamline renderer covers wall/sky/fjord/floor (9–14 integration steps per seed along time-warped direction field, regional color bands)
//      → ② window: bridge, railing, small screaming figure holding face, two distant figures → ③ table, chair with wobbling legs
//      → ④ characters: flat colors + source-atop streamlines + thick dark outlines → ⑤ sinusoidal row displacement: entire world flows
SCENES['19_munch'] = (() => {
  const W = 1920, H = 1080, { clamp, lerp, rng } = U, P = PAINT;
  const { ss } = U;
  const WIN = [370, 140, 790, 540];
  const inWin = (x, y) => x > WIN[0] && x < WIN[2] && y > WIN[1] && y < WIN[3];
  const VP = [1000, 640];
  const PAL = {
    sky: ['#e2541c', '#f08a24', '#f4c03a', '#c8301e', '#e8743a', '#f6a63a', '#b82a1e'],
    fjord: ['#1d3a6a', '#2c5a8a', '#3a4a7a', '#14243e', '#4a6aa0'],
    hill: ['#2a4a2a', '#1e3a3a', '#43603a', '#5a6a2a'],
    wall: ['#8a2e1c', '#a8441e', '#6a2418', '#b8562a', '#7a3020', '#c86a2a', '#3a2a4a'],
    floor: ['#8a5a2a', '#a8703a', '#6a3a1e', '#c88a42', '#4a2a1a'],
  };
  const hx = Object.fromEntries(Object.entries(PAL).map(([k, v]) => [k, v.map(P.hex)]));
  // Regions: upper window sky (undulating bands), central fjord, lower-left slope; outside window wall/floor
  function region(x, y, t) {
    if (inWin(x, y)) {
      const shore = 330 + 60 * Math.sin((x - 370) * 0.012 + 0.5) + 10 * Math.sin(t * 2 + x * 0.02);
      if (y < shore) return 'sky';
      if (x < 470 + (y - shore) * 0.6) return 'hill';
      return 'fjord';
    }
    return y > 700 ? 'floor' : 'wall';
  }
  function angle(x, y, t, reg) {
    switch (reg) {
      case 'sky': return 0.55 * Math.sin(x * 0.011 + y * 0.018 - t * 2.4) + 0.15 * Math.sin(y * 0.05 + t * 3);
      case 'fjord': { const a = Math.atan2(y - 470, x - 620); return a + Math.PI / 2 + 0.3 * Math.sin(t * 2 + a * 2); }
      case 'hill': return -0.9 + 0.4 * Math.sin(y * 0.03 + t * 2);
      case 'floor': return Math.atan2(y - VP[1], x - VP[0]) + 0.18 * Math.sin(x * 0.01 + t * 2.6);
      default: return -Math.PI / 2 + 0.5 * Math.sin(y * 0.011 + x * 0.005 + t * 2.4) + 0.2 * Math.sin(x * 0.03 - t * 3);
    }
  }
  const SEEDS = P.flowSeeds(24, 5);
  // Flat regional bases show matching color, not black, between long strokes
  function baseFill(g, t) {
    const wg = g.createLinearGradient(0, 0, 0, 700); wg.addColorStop(0, '#a8401e'); wg.addColorStop(1, '#5a1a14'); g.fillStyle = wg; g.fillRect(0, 0, W, 700);
    const fg = g.createLinearGradient(0, 700, 0, H); fg.addColorStop(0, '#7a4a22'); fg.addColorStop(1, '#4a2614'); g.fillStyle = fg; g.fillRect(0, 700, W, H - 700);
    const sg = g.createLinearGradient(0, 140, 0, 400); sg.addColorStop(0, '#f08a24'); sg.addColorStop(0.5, '#d8401c'); sg.addColorStop(1, '#2c4a7a'); g.fillStyle = sg; g.fillRect(370, 140, 420, 400);
  }
  // Long curved field-integrated strokes (unoutlined translucent color layers: Munch's thin long strokes, unlike Van Gogh's thick short ones)
  // Wavy y selects sky bands — The Scream's blood-red horizontal bands twist
  const RS = { sky: [32, 7, 10, 0.78], fjord: [26, 6, 9, 0.78], hill: [12, 6, 8, 0.8], wall: [42, 7, 13, 0.5], floor: [32, 8, 12, 0.55] };   // Long/wide/thin: each stroke travels 200–300px
  // P.flowLines integrates seeds until region boundary; supply only regions, direction field, colors
  const flowColor = (reg, sx, sy, r1, t) => {
    if (reg === 'sky') { const yy = sy + 22 * Math.sin(sx * 0.014 - t * 2.2) + 8 * Math.sin(sx * 0.05 + t * 3); const band = Math.floor((yy - 140) / 28 + r1 * 0.6); return hx.sky[((band % 7) + 7) % 7]; }
    const pal = hx[reg]; const col = pal[(r1 * pal.length) | 0]; return reg === 'wall' ? P.mix(col, [30, 12, 10], clamp((sy - 300) / 900) * 0.4) : col;
  };
  const flowLines = (c, t) => P.flowLines(c, SEEDS, { t, region, angle, color: flowColor, params: RS });

  function bridge(c, t) {
    c.save(); c.beginPath(); c.rect(370, 140, 420, 400); c.clip();
    // Bridge/railing diagonal lower-right→upper-left, railing warps with world
    c.fillStyle = '#8a5a3a'; c.beginPath(); c.moveTo(790, 470); c.lineTo(370, 410); c.lineTo(370, 540); c.lineTo(790, 540); c.closePath(); c.fill();
    c.lineCap = 'round'; for (let k = 0; k < 14; k++) { c.strokeStyle = ['#a8703a', '#6a3a22', '#c88a52', '#7a4a2a'][k % 4]; c.lineWidth = 6; c.beginPath(); for (let i = 0; i <= 12; i++) { const q = i / 12, x = lerp(800, 360, q), y = lerp(478 + k * 5, 418 + k * 9, q) + Math.sin(q * 5 + t * 3 + k) * 3; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    c.strokeStyle = '#3a1e14'; c.lineCap = 'round';
    for (let k = 0; k < 3; k++) { c.lineWidth = 6 - k; c.beginPath(); for (let i = 0; i <= 20; i++) { const q = i / 20, x = lerp(800, 360, q), y = lerp(452 + k * 18, 372 + k * 12, q) + Math.sin(q * 6 + t * 3) * 4; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    for (let i = 0; i < 9; i++) { const q = i / 8, x = lerp(790, 380, q); c.lineWidth = 4; c.beginPath(); c.moveTo(x, lerp(452, 372, q)); c.lineTo(x + 2, lerp(500, 410, q)); c.stroke(); }
    // Two distant hatted silhouettes
    [[480, 395], [515, 400]].forEach(([x, y], k) => { c.fillStyle = '#1a1420'; c.beginPath(); c.ellipse(x, y, 7, 22, 0.05 * Math.sin(t * 2 + k), 0, Math.PI * 2); c.fill(); c.fillRect(x - 9, y - 26, 18, 4); c.fillRect(x - 5, y - 32, 10, 7); });
    // Screamer: skull-like head, hands on face, body a twisting black robe
    const fx = 690, fy = 470, sway = Math.sin(t * 3.2) * 0.12;
    c.save(); c.translate(fx, fy + 70); c.rotate(sway);
    c.fillStyle = '#2a1e2e'; c.beginPath(); c.moveTo(-30, 0); c.bezierCurveTo(-40, -40, -14, -50, -20, -86); c.lineTo(20, -86); c.bezierCurveTo(20, -50, 44, -30, 34, 0); c.closePath(); c.fill();
    c.translate(0, -104); c.rotate(-sway * 0.6);
    c.fillStyle = '#d8c890'; c.beginPath(); c.ellipse(0, 0, 21, 28, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#2a1e2e'; c.lineWidth = 2.5; c.stroke();
    c.fillStyle = '#2a1e2e'; c.beginPath(); c.ellipse(-8, -6, 5, 7, 0, 0, Math.PI * 2); c.ellipse(8, -6, 5, 7, 0, 0, Math.PI * 2); c.fill();
    const mo = 7 + Math.sin(t * 9) * 2; c.beginPath(); c.ellipse(0, 13, 5, mo, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#c8b480'; [[-1], [1]].forEach(([s]) => { c.beginPath(); c.ellipse(s * 22, 4, 7, 15, -s * 0.25, 0, Math.PI * 2); c.fill(); c.stroke(); });
    c.strokeStyle = '#2a1e2e'; c.lineWidth = 9; [[-1], [1]].forEach(([s]) => { c.beginPath(); c.moveTo(s * 22, 14); c.quadraticCurveTo(s * 30, 50, s * 20, 72); c.stroke(); });
    c.restore();
    c.restore();
  }
  function furniture(c, t) {
    const wob = (x0, y0, x1, y1, w, col, ph) => { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); for (let i = 0; i <= 12; i++) { const q = i / 12; const x = lerp(x0, x1, q) + Math.sin(q * 5 + t * 3.5 + ph) * 7 * Math.sin(q * Math.PI), y = lerp(y0, y1, q); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); };
    // Chair behind girl
    wob(1440, 470, 1446, 910, 16, '#2a1a14', 0); wob(1486, 480, 1490, 910, 16, '#2a1a14', 1);
    // Table
    c.fillStyle = '#5a2e1c'; c.beginPath(); c.moveTo(808, 618); c.quadraticCurveTo(1010, 606 + Math.sin(t * 3) * 6, 1212, 620); c.lineTo(1206, 652); c.quadraticCurveTo(1010, 642, 814, 652); c.closePath(); c.fill();
    c.strokeStyle = '#1a0e14'; c.lineWidth = 5; c.stroke();
    wob(846, 650, 840, 905, 22, '#3a1e14', 2); wob(1176, 650, 1182, 905, 22, '#3a1e14', 3);
    wob(846, 650, 840, 905, 6, '#8a4a2a', 2.3); wob(1176, 650, 1182, 905, 6, '#8a4a2a', 3.3);
    // Dark crooked window frame
    c.strokeStyle = '#1a1020'; c.lineWidth = 16; c.lineJoin = 'round'; c.beginPath(); c.moveTo(358, 128); c.quadraticCurveTo(580, 116 + Math.sin(t * 2.5) * 8, 804, 132); c.quadraticCurveTo(810, 340, 800, 552); c.quadraticCurveTo(580, 562, 360, 550); c.quadraticCurveTo(352, 340, 358, 128); c.stroke();
    c.lineWidth = 9; c.beginPath(); c.moveTo(580, 128); c.quadraticCurveTo(586 + Math.sin(t * 3) * 6, 340, 578, 552); c.stroke();
  }
  // Characters
  const girlPal = { skin: '#e8d4a0', hair: '#e2b84a', hairLine: '#a8782a', dress: '#1e2238', line: '#120c18', lw: 5, cheek: 'rgba(200,90,70,.18)', lip: '#a8282a', iris: '#1a1420', cuff: '#e8e0c8', cupBody: '#e8e0c8', cupRim: '#6a2a1a', shoe: '#120c18', browC: '#6a4a2a' };
  const catPal = { orange: '#e07a2a', white: '#efe6c8', stripe: '#8a3a14', line: '#120c18', lw: 5, eye: '#c8d040', noseC: '#c84a3a' };
  function chars(c, t, lt, ch) {
    const L = P.scratch('mu_chars'), g = L.getContext('2d'); g.reset();
    const K = RIG.cat({ tail: ch.tail * 1.4, blink: 0, breathe: ch.breathe });
    const G = RIG.girl({ cup: ch.cup, sip: ch.sip, breathe: ch.breathe, hair: 'long' });
    RIG.drawCat(g, K, { ...catPal, lw: 0 });
    RIG.drawGirl(g, G, { ...girlPal, lw: 0, mode: 'fill', apron: null });
    // Green shading: Munch's yellow-green face shadows
    g.save(); g.clip(G.face); g.fillStyle = 'rgba(120,150,70,.4)'; g.filter = 'blur(8px)'; g.beginPath(); g.ellipse(G.A.headC[0] + 20, G.A.headC[1] + 10, 40, 50, 0, 0, Math.PI * 2); g.fill(); g.filter = 'none'; g.restore();
    // Character streamline texture (also long curved strokes)
    g.save(); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = 0.55; g.lineCap = 'round';
    const r = rng(17 + P.boilSeed(t, 10));
    for (let i = 0; i < 900; i++) { const x = 380 + r() * 1100, y = 260 + r() * 680;
      const a = x < 760 ? Math.atan2(y - 780, x - 540) + Math.PI / 2 : -Math.PI / 2 + 0.6 * Math.sin(y * 0.02 + t * 3);
      g.strokeStyle = x < 760 ? (r() < 0.5 ? '#f0a040' : '#b8501a') : (y < 450 ? (r() < 0.5 ? '#f4d070' : '#b88a2a') : (r() < 0.5 ? '#34406a' : '#0e1020')); g.lineWidth = 5;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * 14 + Math.sin(t * 4 + i) * 6, y + Math.sin(a) * 14, x + Math.cos(a) * 28, y + Math.sin(a) * 28); g.stroke(); }
    g.restore();
    c.drawImage(L, 0, 0);
    // White collar (proper 1890s Norwegian dress)
    c.fillStyle = '#ece4cc'; c.beginPath(); c.ellipse(G.A.neck[0] + 4, G.A.neck[1] + 8, 30, 12, -0.15, 0, Math.PI * 2); c.fill();
    RIG.drawCat(c, K, { ...catPal, mode: 'line' });
    RIG.drawGirl(c, G, { ...girlPal, mode: 'line', apron: null });
    KIT.nearArm(c, G, { fill: girlPal.dress, line: girlPal.line, lw: 5, skin: girlPal.skin, cuff: girlPal.cuff, cupBody: girlPal.cupBody, cupRim: girlPal.cupRim,
      pattern: g3 => { g3.lineCap = 'round'; g3.lineWidth = 5; for (let i = 0; i < 26; i++) { const x = 1150 + (i * 37) % 280, y = 330 + (i * 53) % 300; g3.strokeStyle = i % 2 ? '#34406a' : '#0e1020'; g3.beginPath(); g3.moveTo(x, y); g3.quadraticCurveTo(x + 6 + Math.sin(t * 4 + i) * 6, y + 14, x + 2, y + 30); g3.stroke(); } } });
    // Long blonde wavy strands, downward traveling wave
    c.save(); c.lineCap = 'round';
    for (let k = 0; k < 9; k++) { const x0 = G.A.nape[0] - 30 + k * 7, y0 = G.A.nape[1] - 60 + k * 4; c.strokeStyle = k % 2 ? '#f0c858' : '#b8862a'; c.lineWidth = 7;
      c.beginPath(); for (let i = 0; i <= 16; i++) { const q = i / 16; const x = x0 + 18 * q + Math.sin(q * 9 - t * 7 + k) * (4 + 12 * q), y = y0 + q * 230; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    c.restore();
    // Cat opens mouth, affected by offscreen scream
    c.fillStyle = '#3a1418'; c.beginPath(); c.ellipse(K.nose[0] - 4, K.nose[1] + 16, 6, 7 + Math.sin(t * 9) * 3, 0, 0, Math.PI * 2); c.fill();
    return G;
  }

  return {
    draw(c, lt, t) {
      const ch = KIT.choreo(lt, t);
      const S = P.scratch('mu_frame'), g = S.getContext('2d'); g.reset();
      baseFill(g, t);
      flowLines(g, t);
      bridge(g, t);
      furniture(g, t);
      const G = chars(g, t, lt, ch);
      // Steam: three thick waves like sky bands
      g.save(); g.lineCap = 'round'; [0, 1].forEach(k => { g.strokeStyle = ['#f6e0a0', '#f4c03a'][k]; g.lineWidth = 3.5; g.beginPath(); for (let i = 0; i <= 20; i++) { const q = i / 20, x = G.cup.x - 10 + k * 10 - q * 60 * ch.cup + Math.sin(q * 7 - t * 8 + k) * 12 * q, y = G.cup.y - 10 - q * 90; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }); g.restore();
      // Whole world flows: row displacement + slight column displacement
      const T2 = P.scratch('mu_warp'), g2 = T2.getContext('2d'); g2.reset();
      g2.fillStyle = '#3a1410'; g2.fillRect(0, 0, W, H);
      KIT.warpRows(g2, S, y => 9 * Math.sin(y * 0.012 + t * 4.2) + 4 * Math.sin(y * 0.031 - t * 6), 4, 14);
      c.fillStyle = '#3a1410'; c.fillRect(0, 0, W, H);
      KIT.warpCols(c, T2, x => 6 * Math.sin(x * 0.009 - t * 3.6), 4, 8);
    },
    label(c, lt, t) {
      const L = P.scratch('mu_label'), g = L.getContext('2d'); g.reset();
      KIT.label(g, { title: '表现主义', sub: 'EDVARD MUNCH · 1893', tFont: '84px "LXGWWenKai-500"', sFont: '34px "IMFellEnglish-400"', tCol: '#f4c03a', sCol: '#f08a24', y: 132, sy: 186, spacing: 4,
        before: g2 => { g2.save(); g2.font = '84px "LXGWWenKai-500"'; g2.letterSpacing = '4px'; g2.textAlign = 'right'; g2.lineWidth = 10; g2.strokeStyle = '#1a0a10'; g2.lineJoin = 'round'; g2.strokeText('表现主义', 1866, 132); g2.font = '34px "IMFellEnglish-400"'; g2.letterSpacing = '0px'; g2.lineWidth = 7; g2.strokeText('EDVARD MUNCH · 1893', 1866, 186); g2.restore(); } });
      KIT.warpRows(c, L, y => (y > 30 && y < 210) ? 5 * Math.sin(y * 0.09 + t * 7) : 0, 3);
    },
  };
})();
