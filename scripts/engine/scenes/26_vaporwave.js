// 2011 Vaporwave / cyber neon — entirely procedural.
// Pipeline: ① draw entire scene offscreen to S: deep-purple gradient wall, scrolling magenta perspective-grid floor, window sunset (horizontal cuts rise), cyan grid, swaying palm silhouettes
//        + procedural neon-tube “カフェ” sign (frame-hashed flicker), Win95 TEA.EXE dialog with progress bar, marble bust, characters (dark flats and pink/cyan rim glows)
//      → ② VHS postprocessing: offset RGB channels (multiply isolates channels, lighter recombines), downward tracking-noise bands with horizontal tearing, scanlines, OSD (PLAY ▶, timecode)
SCENES['26_vaporwave'] = (() => {
  const W = 1920, H = 1080, { clamp, lerp, ease, rng } = U, P = PAINT, TAU = Math.PI * 2;
  const FLOOR = 720;
  const C = { pink: '#ff4fd8', hot: '#ff2f8f', cyan: '#3ff6ff', purple: '#2a0b4a', deep: '#12052a', violet: '#7a2ae0', yellow: '#ffd84a', orange: '#ff8a3a' };
  const glowLine = P.glowStroke;   // Neon tube: shadowBlur glow and near-white core

  // ---------- Static base: wall, window-frame tubes, bust pedestal ----------
  const bg = () => P.cached('vw_bg', W, H, (g) => {
    const wg = g.createLinearGradient(0, 0, 0, FLOOR); wg.addColorStop(0, '#0d0322'); wg.addColorStop(0.7, '#2c0b52'); wg.addColorStop(1, '#4a0f6a'); g.fillStyle = wg; g.fillRect(0, 0, W, FLOOR);
    // Faint vertical pink-to-cyan gradient bands on wall, like reflected neon
    const bl = g.createRadialGradient(580, 340, 60, 580, 340, 760); bl.addColorStop(0, 'rgba(255,79,216,.35)'); bl.addColorStop(1, 'rgba(255,79,216,0)'); g.fillStyle = bl; g.fillRect(0, 0, W, FLOOR);
    const br = g.createRadialGradient(1000, 220, 20, 1000, 220, 520); br.addColorStop(0, 'rgba(63,246,255,.22)'); br.addColorStop(1, 'rgba(63,246,255,0)'); g.fillStyle = br; g.fillRect(0, 0, W, FLOOR);
    g.fillStyle = '#08020f'; g.fillRect(0, FLOOR, W, H - FLOOR);
    // Light strip at wall base
    g.beginPath(); g.moveTo(0, FLOOR); g.lineTo(W, FLOOR); glowLine(g, C.cyan, 4, 18);
    // Chair: black acrylic with pink edge lighting
    g.fillStyle = '#1a0830'; g.fillRect(1436, 470, 18, 440); g.fillRect(1474, 478, 18, 430); g.fillRect(1290, 744, 210, 16);
    g.beginPath(); g.rect(1436, 470, 18, 440); g.rect(1474, 478, 18, 430); glowLine(g, C.pink, 2, 10);
  });

  // ---------- Sunset in window ----------
  function sunset(c, t) {
    c.save(); c.beginPath(); c.rect(370, 140, 420, 400); c.clip();
    const sk = c.createLinearGradient(0, 140, 0, 470); sk.addColorStop(0, '#1a0640'); sk.addColorStop(0.55, '#a0207a'); sk.addColorStop(1, '#ff7a5a'); c.fillStyle = sk; c.fillRect(370, 140, 420, 330);
    // Sun: yellow-to-magenta gradient, horizontal cuts rise over time (wider toward bottom)
    const sx = 580, sy = 400, sr = 118;
    c.save(); c.beginPath(); c.arc(sx, sy, sr, 0, TAU); c.clip();
    const sg = c.createLinearGradient(0, sy - sr, 0, sy + sr); sg.addColorStop(0, C.yellow); sg.addColorStop(0.5, C.orange); sg.addColorStop(1, C.hot); c.fillStyle = sg; c.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
    c.globalCompositeOperation = 'destination-out';
    const ph = (t * 0.9) % 1;
    for (let k = 0; k < 7; k++) { const q = (k + ph) / 7, y = sy + sr * (q * 1.1 - 0.05), h = 2 + q * q * 16; c.fillRect(sx - sr, y, sr * 2, h); }
    c.restore();
    // Wireframe mountains on horizon
    c.beginPath(); c.moveTo(370, 470); [[420, 430], [470, 452], [520, 410], [560, 460], [640, 420], [700, 448], [760, 418], [790, 440]].forEach(p => c.lineTo(...p)); c.lineTo(790, 470);
    c.fillStyle = '#1a0636'; c.fill(); glowLine(c, C.pink, 2.5, 10);
    // Cyan ground grid scrolls toward viewer
    c.fillStyle = '#0b0220'; c.fillRect(370, 470, 420, 70);
    c.save(); c.beginPath(); c.rect(370, 470, 420, 70); c.clip(); c.strokeStyle = C.cyan; c.lineWidth = 1.6; c.shadowColor = C.cyan; c.shadowBlur = 8;
    for (let i = -10; i <= 10; i++) { c.beginPath(); c.moveTo(580 + i * 12, 470); c.lineTo(580 + i * 70, 540); c.stroke(); }
    const sc = (t * 1.6) % 1; for (let k = 0; k < 8; k++) { const d = k + 1 - sc, y = 470 + 70 * (1 / (1 + 6 / (d * d + 0.01))) ; c.beginPath(); c.moveTo(370, y); c.lineTo(790, y); c.stroke(); }
    c.restore();
    // Palm silhouettes (one on each side, swaying)
    [[400, 540, 1], [770, 540, -1]].forEach(([x, y, s], k) => {
      const sw = Math.sin(t * 2.2 + k * 1.4) * 0.06;
      c.save(); c.translate(x, y); c.rotate(sw * s); c.fillStyle = '#0a0216'; c.strokeStyle = '#0a0216';
      c.lineWidth = 10; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * 18, -120, s * 6, -230); c.stroke();
      for (let f = 0; f < 7; f++) { const a = -Math.PI / 2 + (f - 3) * 0.45 + Math.sin(t * 3 + f) * 0.05, L = 70 + (f % 3) * 16; c.save(); c.translate(s * 6, -230); c.rotate(a); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(L * 0.5, -14, L, 12); c.quadraticCurveTo(L * 0.5, 4, 0, 4); c.fill(); c.restore(); }
      c.restore(); });
    c.restore();
    // Window frame: cyan light tubes
    c.beginPath(); c.rect(360, 130, 440, 420); glowLine(c, C.cyan, 6, 26); c.beginPath(); c.rect(360, 130, 440, 420); c.strokeStyle = '#e8ffff'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#1a0830'; c.fillRect(330, 550, 500, 22); c.beginPath(); c.moveTo(330, 550); c.lineTo(830, 550); glowLine(c, C.pink, 3, 14);
  }

  // ---------- Floor: scrolling magenta perspective grid ----------
  function floorGrid(c, t) {
    c.save(); c.beginPath(); c.rect(0, FLOOR, W, H - FLOOR); c.clip();
    const VX = 960, VY = 600; c.strokeStyle = C.pink; c.shadowColor = C.pink; c.shadowBlur = 12; c.lineWidth = 2.5;
    for (let i = -16; i <= 16; i++) { c.beginPath(); c.moveTo(VX + i * 160 * (FLOOR - VY) / (H - VY), FLOOR); c.lineTo(VX + i * 160, H); c.stroke(); }
    const ph = (t * 1.3) % 1;
    for (let k = 0; k < 14; k++) { const d = k + 1 - ph, y = VY + 520 / d; if (y < FLOOR || y > H + 4) continue; c.lineWidth = 1.2 + 2.4 * (y - FLOOR) / (H - FLOOR); c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    c.restore();
  }

  // ---------- Neon-tube “カフェ” lettering (procedural polylines, independent of fonts) ----------
  const KANA = {
    'カ': [[[0.12, 0.34], [0.86, 0.34], [0.84, 0.62], [0.74, 0.94], [0.6, 0.86]], [[0.46, 0.08], [0.42, 0.5], [0.3, 0.78], [0.12, 0.96]]],
    'フ': [[[0.12, 0.24], [0.86, 0.24], [0.8, 0.56], [0.62, 0.82], [0.34, 0.96]]],
    'ェ': [[[0.28, 0.46], [0.72, 0.46]], [[0.5, 0.46], [0.5, 0.86]], [[0.18, 0.86], [0.82, 0.86]]],
  };
  function neonSign(c, t) {
    const f = Math.floor(t * 30), on = (k) => { const h = U.hash(f, k); return !(h < 0.07 || (k === 1 && h < 0.22 && (f % 17) < 5)); };
    const x0 = 868, y0 = 150, s = 104;
    // Tube backing plate
    c.fillStyle = 'rgba(10,2,20,.55)'; c.fillRect(x0 - 18, y0 - 18, s * 3 + 24, s + 70);
    [...'カフェ'].forEach((ch, k) => {
      const lit = on(k), col = k === 1 ? C.cyan : C.pink;
      KANA[ch].forEach(st => { c.beginPath(); st.forEach(([u, v], i) => { const x = x0 + k * s + u * (s - 14), y = y0 + v * s; i ? c.lineTo(x, y) : c.moveTo(x, y); });
        c.lineJoin = 'round'; c.lineCap = 'round';
        if (lit) { glowLine(c, col, 9, 30); c.strokeStyle = '#fff4fd'; c.lineWidth = 3; c.stroke(); } else { c.strokeStyle = 'rgba(120,60,120,.6)'; c.lineWidth = 6; c.stroke(); } });
    });
    // Small TEA ROOM lettering (font-based neon)
    c.save(); c.font = '34px "Righteous-400"'; c.letterSpacing = '10px'; c.textBaseline = 'alphabetic';
    c.shadowColor = C.yellow; c.shadowBlur = on(5) ? 18 : 0; c.fillStyle = on(5) ? '#fff2b0' : 'rgba(140,110,60,.6)'; c.fillText('TEA ROOM', x0 + 34, y0 + s + 44); c.restore();
  }

  // ---------- Win95 TEA.EXE dialog ----------
  function dialog(c, lt) {
    const x = 26, y = 330, w = 300, h = 168;
    c.save(); c.fillStyle = '#c0c0c0'; c.fillRect(x, y, w, h);
    c.fillStyle = '#ffffff'; c.fillRect(x, y, w, 3); c.fillRect(x, y, 3, h); c.fillStyle = '#404040'; c.fillRect(x, y + h - 3, w, 3); c.fillRect(x + w - 3, y, 3, h);
    const tg = c.createLinearGradient(x, 0, x + w, 0); tg.addColorStop(0, '#000080'); tg.addColorStop(1, '#1084d0'); c.fillStyle = tg; c.fillRect(x + 6, y + 6, w - 12, 30);
    c.font = '18px "Poppins-700"'; c.fillStyle = '#fff'; c.textBaseline = 'middle'; c.fillText('TEA.EXE', x + 14, y + 22);
    c.fillStyle = '#c0c0c0'; c.fillRect(x + w - 32, y + 10, 22, 20); c.fillStyle = '#000'; c.font = '16px "Poppins-700"'; c.fillText('×', x + w - 26, y + 20);
    c.font = '17px "Poppins-600"'; c.fillStyle = '#000'; c.fillText('Brewing tea...  ' + Math.min(99, Math.floor(18 + lt * 70)) + '%', x + 16, y + 64);
    c.fillStyle = '#fff'; c.fillRect(x + 16, y + 86, w - 32, 26); c.fillStyle = '#808080'; c.fillRect(x + 16, y + 86, w - 32, 2);
    const n = Math.min(17, Math.floor(3 + lt * 14)); c.fillStyle = '#000080'; for (let i = 0; i < n; i++) c.fillRect(x + 20 + i * 15.5, y + 90, 12, 18);
    c.fillStyle = '#c0c0c0'; c.fillRect(x + w / 2 - 44, y + 124, 88, 30); c.fillStyle = '#fff'; c.fillRect(x + w / 2 - 44, y + 124, 88, 2); c.fillStyle = '#404040'; c.fillRect(x + w / 2 - 44, y + 152, 88, 2);
    c.fillStyle = '#000'; c.font = '16px "Poppins-600"'; c.fillText('OK', x + w / 2 - 12, y + 140);
    c.restore();
  }

  // ---------- Table and marble bust ----------
  function table(c, t) {
    c.fillStyle = '#0e0420'; c.fillRect(810, 618, 400, 28); c.fillRect(842, 646, 20, 259); c.fillRect(1160, 646, 20, 259);
    c.beginPath(); c.moveTo(810, 618); c.lineTo(1210, 618); glowLine(c, C.cyan, 3, 16);
    c.beginPath(); c.moveTo(810, 646); c.lineTo(1210, 646); glowLine(c, C.pink, 2, 10);
    // Bust (right-facing profile silhouette, marble gradient, pink/cyan rim light)
    const bust = new Path2D(); const bx = 900, by = 618;
    [[-48, 0], [-50, -22], [-30, -38], [-18, -44], [-16, -62], [-24, -76], [-26, -100], [-18, -122], [0, -132], [20, -128], [30, -112], [36, -100], [44, -92], [38, -86], [42, -78], [36, -72], [36, -62], [24, -58], [20, -46], [34, -38], [52, -22], [50, 0]].forEach(([x, y], i) => i ? bust.lineTo(bx + x, by + y) : bust.moveTo(bx + x, by + y)); bust.closePath();
    const mg = c.createLinearGradient(bx - 50, by - 130, bx + 50, by); mg.addColorStop(0, '#f6eefa'); mg.addColorStop(0.6, '#c9b8d8'); mg.addColorStop(1, '#8a6aa8'); c.fillStyle = mg; c.fill(bust);
    c.save(); c.clip(bust); c.strokeStyle = 'rgba(140,110,160,.5)'; c.lineWidth = 1.2; [[[-40, -10], [-10, -40], [10, -70]], [[20, -20], [30, -50]], [[-20, -90], [0, -110]]].forEach(v => { c.beginPath(); v.forEach(([x, y], i) => i ? c.lineTo(bx + x, by + y) : c.moveTo(bx + x, by + y)); c.stroke(); }); c.restore();
    c.strokeStyle = 'rgba(255,79,216,.9)'; c.lineWidth = 2.5; c.shadowColor = C.pink; c.shadowBlur = 14; c.stroke(bust); c.shadowBlur = 0;
    c.fillStyle = '#5a3a7a'; c.beginPath(); c.arc(bx + 22, by - 98, 3, 0, TAU); c.fill();
    // Retro sunglasses on bust (visual joke)
    c.fillStyle = '#111'; c.fillRect(bx + 8, by - 104, 34, 9); c.fillStyle = C.cyan; c.fillRect(bx + 12, by - 102, 26, 2);
  }

  // ---------- Characters: dark flats → two-color rim glow ----------
  function girl(c, G, ch, t) {
    const pal = { skin: '#f4c4d8', skinS: '#b8789e', hair: '#ffe08a', hairS: '#d89a5a', top: '#8f7cf6', topS: '#5a44c8', skirt: '#4fd0e0', skirtS: '#2a7a9a' };
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    const fill = (p, a, b, x0 = 1100, x1 = 1460) => { if (!p) return; const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fill(p); };
    fill(G.farSleeve, pal.topS, pal.topS); fill(G.farHand, pal.skinS, pal.skinS);
    fill(G.skirt, pal.skirt, pal.skirtS);
    c.save(); c.clip(G.skirt); c.strokeStyle = 'rgba(20,40,80,.35)'; c.lineWidth = 3; for (let x = 1100; x < 1460; x += 22) { c.beginPath(); c.moveTo(x, 640); c.lineTo(x - 30, 940); c.stroke(); } c.restore();   // Pleats
    fill(G.shoe, '#fff', '#c8c8ff');
    fill(G.torso, pal.top, pal.topS, 1290, 1420);
    fill(G.neck, pal.skin, pal.skinS, 1286, 1324);
    { const nk = G.A.neck; c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(nk[0] - 22, nk[1] - 4); c.lineTo(nk[0] + 26, nk[1]); c.lineTo(nk[0] + 4, nk[1] + 34); c.closePath(); c.fill(); c.fillStyle = C.cyan; c.fillRect(nk[0] - 4, nk[1] + 40, 6, 120); }   // White collar and cyan zipper line
    fill(G.hairBack, pal.hair, pal.hairS, 1260, 1410); fill(G.bun, pal.hair, pal.hairS);
    // Pink hair tie
    c.strokeStyle = C.hot; c.lineWidth = 8; c.beginPath(); c.arc(G.bunSpiral[0] - 18, G.bunSpiral[1] + 6, 14, -1.2, 1.6); c.stroke();
    fill(G.face, pal.skin, pal.skinS, 1250, 1330); fill(G.bangs, pal.hair, pal.hairS, 1250, 1335);
    c.strokeStyle = 'rgba(200,120,60,.6)'; c.lineWidth = 2; G.hairLines.forEach(h => c.stroke(h));
    if (ch.blink) { c.strokeStyle = '#2a0a3a'; c.lineWidth = 2.6; c.stroke(G.lid); }
    else { c.fillStyle = '#2a0a3a'; c.beginPath(); c.ellipse(G.eye.x - 1, G.eye.y + 1, 4, 5.5, 0, 0, TAU); c.fill(); c.fillStyle = C.cyan; c.beginPath(); c.arc(G.eye.x - 2, G.eye.y - 1, 1.6, 0, TAU); c.fill(); c.strokeStyle = '#2a0a3a'; c.lineWidth = 2.4; c.stroke(G.lid); }
    c.fillStyle = C.hot; c.beginPath(); c.moveTo(...G.lips[0]); c.lineTo(...G.lips[1]); c.lineTo(...G.lips[2]); c.closePath(); c.fill();
    fill(G.upperArm, pal.top, pal.topS, 1200, 1380); fill(G.foreArm, pal.top, pal.topS, 1200, 1380); fill(G.cuff, '#fff', '#d8c8ff', 1200, 1300); fill(G.hand, pal.skin, pal.skinS, 1180, 1260);
    RIG.drawCup(c, G.cup, { body: '#1a0830', rim: '#ff9ad6', hw: 6 });
    c.save(); c.translate(G.cup.x, G.cup.y); c.rotate(G.cup.tilt); c.beginPath(); c.moveTo(-G.cup.w / 2, 0); c.lineTo(-G.cup.w * 0.42, G.cup.h); c.lineTo(G.cup.w * 0.42, G.cup.h); c.lineTo(G.cup.w / 2, 0); glowLine(c, C.cyan, 2, 10); c.restore();
    c.fillStyle = pal.skin; c.beginPath(); c.arc(G.thumb[0], G.thumb[1], 7, 0, TAU); c.fill();
    // Rim glow: window-facing left side pink, back cyan — stroke same path twice with half-screen clips
    const outline = [G.skirt, G.torso, G.face, G.hairBack, G.bun, G.upperArm, G.foreArm];
    [[C.pink, 0, 1290], [C.cyan, 1290, W]].forEach(([col, a, b]) => { c.save(); c.beginPath(); c.rect(a, 0, b - a, H); c.clip(); c.shadowColor = col; c.shadowBlur = 16; c.strokeStyle = col; c.lineWidth = 3; outline.forEach(p => p && c.stroke(p)); c.restore(); });
    c.restore();
  }
  function cat(c, K) {
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = '#ff9a4a'; c.lineWidth = K.tailW; c.stroke(K.tail);
    const tip = K.tailPts[K.tailPts.length - 1]; c.fillStyle = '#fff0fa'; c.beginPath(); c.arc(tip[0], tip[1], K.tailW / 2, 0, TAU); c.fill();
    const og = c.createLinearGradient(420, 0, 660, 0); og.addColorStop(0, '#ffb070'); og.addColorStop(1, '#c0502a'); c.fillStyle = og; c.fill(K.body);
    K.legs.forEach(l => { c.fillStyle = '#fff0fa'; c.fill(l); }); c.fillStyle = '#fff0fa'; c.fill(K.white);
    c.fillStyle = og; c.fill(K.head);
    c.save(); c.clip(K.head); c.fillStyle = '#fff0fa'; c.beginPath(); c.ellipse(K.nose[0] - 22, K.nose[1] + 12, 36, 26, 0, 0, TAU); c.fill(); c.restore();
    c.strokeStyle = '#a03a1a'; c.lineWidth = 7; K.stripes.forEach(s => { c.beginPath(); c.moveTo(...s[0]); c.lineTo(...s[1]); c.stroke(); });
    c.fillStyle = '#ff9ad6'; K.earInner.forEach(e => { c.beginPath(); e.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.fill(); });
    K.eyes.forEach(e => { if (K.blink) { c.strokeStyle = '#2a0a3a'; c.lineWidth = 3; c.beginPath(); c.moveTo(e.x - 8, e.y); c.lineTo(e.x + 8, e.y); c.stroke(); }
      else { c.shadowColor = C.cyan; c.shadowBlur = 10; c.fillStyle = C.cyan; c.beginPath(); c.arc(e.x, e.y, 8, 0, TAU); c.fill(); c.shadowBlur = 0; c.fillStyle = '#12052a'; c.beginPath(); c.ellipse(e.x + 2, e.y, 2.4, 6.5, 0, 0, TAU); c.fill(); } });
    c.fillStyle = C.hot; c.beginPath(); c.arc(K.nose[0], K.nose[1], 5, 0, TAU); c.fill();
    c.strokeStyle = '#ffe8ff'; c.lineWidth = 1.4; K.whiskers.forEach(w => { c.beginPath(); c.moveTo(...w[0]); c.lineTo(...w[1]); c.stroke(); });
    [[C.pink, 0, 560], [C.cyan, 560, 900]].forEach(([col, a, b]) => { c.save(); c.beginPath(); c.rect(a, 0, b - a, H); c.clip(); c.shadowColor = col; c.shadowBlur = 14; c.strokeStyle = col; c.lineWidth = 3; [K.body, K.head].forEach(p => c.stroke(p)); c.restore(); });
    c.restore();
  }

  // ---------- ② VHS postprocessing: P.vhs (RGB separation, tracking-band tearing, scanlines, OSD, vignette) ----------
  const vhs = (c, S, t, lt) => P.vhs(c, S, t, lt, { osd: { label: 'PLAY', date: 'SEP. 04 2011', clock: '23:59' } });

  return {
    draw(c, lt, t) {
      const ch = P.choreo(lt, t);
      const S = P.scratch('vwS'), g = S.getContext('2d'); g.reset();
      g.drawImage(bg(), 0, 0);
      floorGrid(g, t);
      sunset(g, t);
      neonSign(g, t);
      dialog(g, lt);
      table(g, t);
      const K = RIG.cat({ tail: ch.tail, blink: ch.blink, breathe: ch.breathe });
      cat(g, K);
      const G = RIG.girl({ cup: ch.cup, sip: ch.sip, breathe: ch.breathe });
      girl(g, G, ch, t);
      P.steam(g, t, G.cup.x, G.cup.y - 8, { h: 60, n: 2, color: 'rgba(63,246,255,.85)', width: 3, spread: 12, wobble: 8 });
      vhs(c, S, t, lt);
    },
  };
})();
