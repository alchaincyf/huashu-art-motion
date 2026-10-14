// Klimt's Golden Phase (The Kiss, Portrait of Adele Bloch-Bauer I, 1907) — pure code.
// Pipeline: ① cached per-pixel gold wall (mottling + brushing + gold dust) → ② Birch Forest pointillist window + black/white checked gold frame
//      → ③ flower meadow (The Kiss cliff carpet) → ④ Wiener Werkstätte checked table → ⑤ decorative orange-spiral/white-ring cat
//      → ⑥ girl: flat gold robe (eyes, spirals, concentric rings, black/white rectangles) + realistic gradient face/hands
//      → ⑦ flickering gold dust, diagonal light sweep, robe eyes blink in turn, rotating spirals, nodding flowers, falling window leaves
SCENES['18_klimt'] = (() => {
  const W = 1920, H = 1080, { clamp, lerp, rng } = U, P = PAINT;
  const { ss } = U;
  const C = { goldLo: [120, 78, 18], gold: [196, 148, 52], goldHi: [246, 216, 128], ink: '#1d140c', skin: '#f2d6c2' };

  // ---------- Per-pixel gold leaf ----------
  const goldTex = () => P.cached('kl_gold', W, H, (g) => {
    const img = g.createImageData(W, H), d = img.data, r = rng(19);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const mott = P.fbm(x * 0.004 + 3, y * 0.004, 4), brush = P.noise(x * 0.003, y * 0.08) * 0.45, gr = (r() - 0.5) * 0.1;
      let f = clamp(0.5 + mott * 0.55 + brush * 0.5 + gr);
      const lo = C.goldLo, mi = C.gold, hi = C.goldHi; let col = f < 0.5 ? P.mix(lo, mi, f * 2) : P.mix(mi, hi, (f - 0.5) * 2);
      const i = (y * W + x) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    // Gold seams: individually applied square sheets
    g.strokeStyle = 'rgba(90,55,10,.18)'; g.lineWidth = 1; for (let y = 0; y < H; y += 96) for (let x = (y / 96 % 2) * 48; x < W; x += 96) g.strokeRect(x + 0.5, y + 0.5, 96, 96);
  });
  // Wall: darken leaf into The Kiss brown-gold mottling, scatter gold dust
  const wall = () => P.cached('kl_wall', W, H, (g) => {
    g.drawImage(goldTex(), 0, 0);
    g.globalCompositeOperation = 'multiply';
    const img = P.cached('kl_mott', 480, 270, (h) => { const im = h.createImageData(480, 270), d = im.data; for (let y = 0; y < 270; y++) for (let x = 0; x < 480; x++) { const n = P.fbm(x * 0.012 + 9, y * 0.012, 4); const v = clamp(0.62 + n * 0.7); const i = (y * 480 + x) * 4; d[i] = 255 * v; d[i + 1] = 235 * v; d[i + 2] = 190 * v; d[i + 3] = 255; } h.putImageData(im, 0, 0); });
    g.drawImage(img, 0, 0, W, H);
    g.globalCompositeOperation = 'source-over';
    const r = rng(23); for (let i = 0; i < 9000; i++) { const x = r() * W, y = r() * H, s = 0.6 + r() * 2.2; g.fillStyle = r() < 0.7 ? `rgba(250,226,140,${0.3 + r() * 0.5})` : `rgba(70,40,10,${0.2 + r() * 0.3})`; g.fillRect(x, y, s, s); }
  });
  const DUST = (() => { const r = rng(31), o = []; for (let i = 0; i < 420; i++) o.push([r() * W, r() * H, 1.5 + r() * 3.5, r() * 6.28, 3 + r() * 6]); return o; })();

  // ---------- Window: Klimt's Birch Forest ----------
  const windowArt = () => P.cached('kl_win', W, H, (g) => {
    g.save(); g.beginPath(); g.rect(370, 140, 420, 400); g.clip();
    g.fillStyle = '#5a3a1c'; g.fillRect(370, 140, 420, 400);
    const r = rng(41);
    for (let i = 0; i < 2600; i++) { const x = 370 + r() * 420, y = 140 + r() * 400; const deep = (y - 140) / 400;
      const pal = deep < 0.65 ? ['#c86a2a', '#e09a3a', '#a84c22', '#d8b04a', '#7a8a3a', '#e8c070'] : ['#b8502a', '#d8803a', '#8a3a1a', '#e0a050', '#c86a7a'];
      g.fillStyle = pal[(r() * pal.length) | 0]; g.beginPath(); g.ellipse(x, y, 3 + r() * 5, 2 + r() * 4, r() * 3, 0, Math.PI * 2); g.fill(); }
    [[410, 10], [470, 14], [545, 9], [612, 16], [690, 11], [748, 13]].forEach(([x, w], k) => {
      g.fillStyle = '#efe8da'; g.fillRect(x, 140, w, 400); g.fillStyle = '#2a2018';
      for (let y = 150; y < 540; y += 14 + (k * 7 + y) % 19) g.fillRect(x + ((y * 3) % w) * 0.4, y, w * (0.3 + ((y * 7) % 10) / 20), 3 + (y % 4)); });
    g.restore();
    // Gold frame + small black/white checks (Vienna Secession)
    g.fillStyle = '#d6a845'; g.fillRect(346, 116, 468, 24); g.fillRect(346, 540, 468, 26); g.fillRect(346, 116, 24, 450); g.fillRect(790, 116, 24, 450);
    for (let x = 350; x < 812; x += 12) { g.fillStyle = ((x / 12) | 0) % 2 ? '#111' : '#f4efe2'; g.fillRect(x, 122, 10, 10); g.fillRect(x, 549, 10, 10); }
    for (let y = 140; y < 540; y += 12) { g.fillStyle = ((y / 12) | 0) % 2 ? '#111' : '#f4efe2'; g.fillRect(352, y, 10, 10); g.fillRect(798, y, 10, 10); }
    g.strokeStyle = C.ink; g.lineWidth = 3; g.strokeRect(346, 116, 468, 450); g.strokeRect(370, 140, 420, 400);
  });

  // ---------- Ground: flower meadow ----------
  const FLOW = (() => { const r = rng(57), o = []; for (let i = 0; i < 260; i++) { const y = 712 + Math.pow(r(), 0.8) * 370; o.push([r() * W, y, 6 + (y - 700) / 380 * 14 * (0.6 + r() * 0.6), (r() * 5) | 0, r() * 6.28]); } return o.sort((a, b) => a[1] - b[1]); })();
  const FCOL = [['#d8402a', '#f4d65a'], ['#3a5ab0', '#f2eee0'], ['#f2eee0', '#d8402a'], ['#8a4ab0', '#f4d65a'], ['#e08aa0', '#3a5ab0']];
  function meadow(c, t) {
    c.drawImage(P.cached('kl_meadowBase', W, H, (g) => { const gr = g.createLinearGradient(0, 700, 0, H); gr.addColorStop(0, '#2c4a2a'); gr.addColorStop(1, '#1a3020'); g.fillStyle = gr; g.fillRect(0, 700, W, H - 700);
      const r = rng(61); for (let i = 0; i < 1600; i++) { g.strokeStyle = r() < 0.5 ? '#4f7a3a' : '#7aa04a'; g.lineWidth = 2; const x = r() * W, y = 705 + r() * 380; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * 8, y - 8 - r() * 14); g.stroke(); }
      g.fillStyle = '#d6a845'; g.fillRect(0, 696, W, 8); }), 0, 0);
    FLOW.forEach(([x, y, s, k, ph]) => { const nod = Math.sin(t * 4.2 + ph) * s * 0.35, fc = FCOL[k];
      c.fillStyle = fc[0]; c.beginPath(); c.arc(x + nod, y, s, 0, Math.PI * 2); c.fill();
      c.strokeStyle = fc[1]; c.lineWidth = Math.max(1.5, s * 0.18); c.beginPath(); c.arc(x + nod, y, s * 0.62, 0, Math.PI * 2); c.stroke();
      c.fillStyle = fc[1]; c.beginPath(); c.arc(x + nod, y, s * 0.25, 0, Math.PI * 2); c.fill(); });
  }

  // ---------- Checked table (Josef Hoffmann) ----------
  const table = () => P.cached('kl_table', W, H, (g) => {
    g.fillStyle = '#111'; g.fillRect(810, 616, 400, 36); g.fillRect(836, 652, 348, 50); g.fillRect(842, 700, 26, 205); g.fillRect(1156, 700, 26, 205);
    g.fillStyle = '#f4efe2'; for (let x = 814; x < 1206; x += 16) for (let y = 620; y < 648; y += 16) if (((x - 814) / 16 + (y - 620) / 16) % 2 === 0) g.fillRect(x, y, 12, 12);
    for (let x = 842; x < 1180; x += 22) g.fillRect(x, 662, 14, 30);
    for (let y = 706; y < 900; y += 20) { g.fillRect(848, y, 14, 12); g.fillRect(1162, y, 14, 12); }
    g.fillStyle = '#d6a845'; g.fillRect(810, 612, 400, 6); g.fillRect(836, 698, 348, 5);
  });

  // ---------- Patterns ----------
  function spiral(c, x, y, R, rot, col, lw = 2.2) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); for (let a = 0; a < Math.PI * 5.2; a += 0.22) { const rr = R * a / (Math.PI * 5.2); const px = x + Math.cos(a + rot) * rr, py = y + Math.sin(a + rot) * rr; a ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); }
  function eye(c, x, y, L, open, iris) {
    const h = L * 0.42 * open;
    c.fillStyle = '#f6f0e0'; c.strokeStyle = C.ink; c.lineWidth = 2.2;
    c.beginPath(); c.moveTo(x - L / 2, y); c.quadraticCurveTo(x, y - h * 2, x + L / 2, y); c.quadraticCurveTo(x, y + h * 2, x - L / 2, y); c.closePath(); c.fill(); c.stroke();
    if (open > 0.25) { c.save(); c.clip(); c.fillStyle = iris; c.beginPath(); c.arc(x, y, L * 0.22, 0, Math.PI * 2); c.fill(); c.fillStyle = C.ink; c.beginPath(); c.arc(x, y, L * 0.1, 0, Math.PI * 2); c.fill(); c.restore(); }
    c.beginPath(); c.moveTo(x - L / 2 - 4, y); c.quadraticCurveTo(x, y - L * 0.42 * 2 - 3, x + L / 2 + 4, y); c.stroke();      // Upper-lid arc remains fixed while blinking, like Eye of Horus hook
  }
  const ROBE = (() => { const r = rng(71), o = []; for (let i = 0; i < 150; i++) { const x = 1090 + r() * 380, y = 420 + r() * 520; o.push({ x, y, k: r(), s: 0.7 + r() * 0.6, ph: r() * 6.28 }); } return o; })();
  function robePattern(c, t, lt) {
    c.drawImage(goldTex(), 0, 0);
    // Vertical black/white hem rectangles (man's robe in The Kiss)
    const r = rng(77); for (let i = 0; i < 60; i++) { const x = 1100 + r() * 360, y = 640 + r() * 300, w = 10 + r() * 14, h = 26 + r() * 40; c.fillStyle = r() < 0.55 ? '#141010' : '#f4efe2'; c.fillRect(x, y, w, h); c.strokeStyle = '#d6a845'; c.lineWidth = 2; c.strokeRect(x, y, w, h); }
    ROBE.forEach(({ x, y, k, s, ph }, i) => {
      if (k < 0.3) {                         // Colored concentric circles
        const R = 16 * s, cols = [['#c03a2a', '#f4efe2', '#2a4a9a'], ['#2a4a9a', '#d6a845', '#c03a2a'], ['#6a3a8a', '#f4efe2', '#d6a845']][i % 3];
        cols.forEach((col, j) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, R * (1 - j * 0.3), 0, Math.PI * 2); c.fill(); });
      } else if (k < 0.62) {                 // Rotating gold spiral on dark brown
        c.fillStyle = '#3a2410'; c.beginPath(); c.arc(x, y, 15 * s, 0, Math.PI * 2); c.fill();
        spiral(c, x, y, 13 * s, t * 5 * (i % 2 ? 1 : -1) + ph, '#f2cf6a', 2);
      } else if (k < 0.84) {                 // Eye motif: sequential blinks
        const bl = Math.sin(t * 2.2 + ph * 3); const open = bl > 0.86 ? clamp(1 - (bl - 0.86) / 0.07) : 1;
        eye(c, x, y, 34 * s, Math.max(0.08, open), ['#2a4a9a', '#2a7a5a', '#8a2a2a'][i % 3]);
      } else {                               // Small triangles + dot clusters
        c.fillStyle = '#f4efe2'; for (let j = 0; j < 5; j++) { c.beginPath(); c.arc(x + Math.cos(j * 1.26) * 9 * s, y + Math.sin(j * 1.26) * 9 * s, 3.2 * s, 0, Math.PI * 2); c.fill(); }
        c.fillStyle = '#c03a2a'; c.beginPath(); c.arc(x, y, 4 * s, 0, Math.PI * 2); c.fill();
      }
    });
  }

  // ---------- Realistic face/hands: soft volume gradients, nearly no outline (contrasts flat robe) ----------
  function skin(c, path, cx, cy, R, lightDx = -0.35, lightDy = -0.4) {
    const g = c.createRadialGradient(cx + R * lightDx, cy + R * lightDy, R * 0.1, cx, cy, R * 1.25);
    g.addColorStop(0, '#fbe8da'); g.addColorStop(0.5, '#f0cfb8'); g.addColorStop(0.85, '#d8a88c'); g.addColorStop(1, '#b88068');
    c.fillStyle = g; c.fill(path);
  }
  function face(c, G, ch) {
    skin(c, G.neck, G.A.neck[0] - 8, G.A.neck[1] - 10, 36, -0.5, -0.6);
    c.save(); c.clip(G.neck); c.fillStyle = 'rgba(120,70,50,.28)'; c.filter = 'blur(6px)'; c.beginPath(); c.ellipse(G.A.chin[0] + 20, G.A.chin[1] + 8, 40, 14, 0, 0, Math.PI * 2); c.fill(); c.filter = 'none'; c.restore();
    skin(c, G.face, G.A.headC[0] - 20, G.A.headC[1], 72);
    c.save(); c.clip(G.face); c.filter = 'blur(7px)';
    c.fillStyle = 'rgba(232,120,110,.38)'; c.beginPath(); c.arc(G.cheek[0] - 6, G.cheek[1] - 2, 15, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(150,90,70,.3)'; c.beginPath(); c.ellipse(G.eye.x + 2, G.eye.y - 2, 14, 8, 0, 0, Math.PI * 2); c.fill();       // Eye-socket shadow
    c.filter = 'none'; c.restore();
    // Eyes: heavy lashes, half-lowered (Klimt's weary women)
    c.strokeStyle = '#3a2216'; c.lineWidth = 2.6; c.stroke(G.lid);
    if (!ch.blink) { c.fillStyle = '#4a3020'; c.beginPath(); c.ellipse(G.eye.x - 1, G.eye.y + 2, 3.4, 3.6, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(G.eye.x - 2.4, G.eye.y + 0.6, 1.1, 0, Math.PI * 2); c.fill(); }
    G.lashes.forEach(l => { c.beginPath(); c.moveTo(...l[0]); c.lineTo(...l[1]); c.lineWidth = 1.8; c.stroke(); });
    c.strokeStyle = 'rgba(120,80,40,.8)'; c.lineWidth = 2; c.stroke(G.brow);
    const lp = G.lips; c.fillStyle = '#b8323a'; c.beginPath(); c.moveTo(...lp[0]); c.quadraticCurveTo(lp[1][0] + 2, lp[1][1] - 2, lp[1][0], lp[1][1]); c.quadraticCurveTo(lp[1][0] + 1, lp[2][1] + 2, lp[2][0], lp[2][1]); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(150,90,70,.55)'; c.lineWidth = 1.2; c.stroke(G.face);
  }
  function hair(c, G, t) {
    const hg = c.createLinearGradient(G.A.headTop[0], G.A.headTop[1], G.A.nape[0], G.A.nape[1] + 30); hg.addColorStop(0, '#f6dc8a'); hg.addColorStop(0.5, '#dcae4a'); hg.addColorStop(1, '#a8782a');
    c.fillStyle = hg; [G.hairBack, G.bun].forEach(p => p && c.fill(p));
    c.strokeStyle = 'rgba(120,80,20,.55)'; c.lineWidth = 1.3; G.hairLines.forEach(h => c.stroke(h));
    if (G.bun) { spiral(c, G.bunSpiral[0], G.bunSpiral[1], 26, 0.5, 'rgba(130,90,25,.75)', 1.6); }
  }
  // Flower crown: small flowers in hair (The Kiss), slight rotation
  function wreath(c, G, t) {
    const A = G.A, pts = [[A.headTop[0] - 40, A.headTop[1] + 18], [A.headTop[0] - 8, A.headTop[1] + 2], [A.headTop[0] + 28, A.headTop[1] + 6], [A.headTop[0] + 60, A.headTop[1] + 22], [A.headTop[0] + 82, A.headTop[1] + 50]];
    pts.forEach(([x, y], k) => { const fc = FCOL[k % 5], rr = 11; c.save(); c.translate(x, y); c.rotate(t * 1.5 + k);
      c.fillStyle = fc[0]; for (let j = 0; j < 5; j++) { c.beginPath(); c.arc(Math.cos(j * 1.256) * rr * 0.6, Math.sin(j * 1.256) * rr * 0.6, rr * 0.5, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = fc[1]; c.beginPath(); c.arc(0, 0, rr * 0.35, 0, Math.PI * 2); c.fill(); c.restore(); });
  }
  function bangs(c, G) {
    const hg = c.createLinearGradient(G.A.forehead[0], G.A.forehead[1] - 20, G.A.forehead[0] + 70, G.A.forehead[1] + 40); hg.addColorStop(0, '#f8e098'); hg.addColorStop(1, '#c89a3a');
    c.fillStyle = hg; c.fill(G.bangs); c.strokeStyle = 'rgba(120,80,20,.5)'; c.lineWidth = 1.2; c.stroke(G.bangs);
    G.locks.forEach(h => { c.strokeStyle = '#c89a3a'; c.lineWidth = 6; c.stroke(h); });
  }

  // ---------- Cat ----------
  function cat(c, K, t) {
    const L = P.scratch('kl_cat'), g = L.getContext('2d'); g.reset();
    RIG.drawCat(g, K, { orange: '#d8873a', white: '#f6ecd8', stripe: '#a8501a', line: '#3a2414', lw: 3, eye: '#5aa04a' });
    // Orange area: gold spirals + red dots (decorative fur)
    g.save(); g.globalCompositeOperation = 'source-atop';
    const r = rng(91); for (let i = 0; i < 46; i++) { const x = 420 + r() * 260, y = 560 + r() * 340; const inWhite = g.isPointInPath(K.white, x, y); if (inWhite) { g.strokeStyle = ['#3a5ab0', '#d8402a', '#d6a845'][i % 3]; g.lineWidth = 2.4; g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.stroke(); } else if (g.isPointInPath(K.body, x, y) && !g.isPointInPath(K.head, x, y)) { spiral(g, x, y, 9, t * 2.5 + i, '#f2cf6a', 1.8); } }
    g.restore();
    c.drawImage(L, 0, 0);
  }

  return {
    draw(c, lt, t) {
      const ch = KIT.choreo(lt, t);
      c.drawImage(wall(), 0, 0);
      // Gold-dust four-point glints slowly rise, motion every frame
      c.save(); c.globalCompositeOperation = 'lighter';
      DUST.forEach(([x0, y0, s, ph, sp]) => { const x = x0 + Math.sin(t * 0.8 + ph) * 14, y = ((y0 - t * 26) % H + H) % H; const tw = Math.sin(t * sp + ph); if (tw < 0.55) return; const a = (tw - 0.55) / 0.45, R = s * (0.6 + a * 1.1);
        c.fillStyle = `rgba(255,236,160,${0.8 * a})`; c.beginPath(); c.moveTo(x, y - R * 2); c.lineTo(x + R * 0.35, y - R * 0.35); c.lineTo(x + R * 2, y); c.lineTo(x + R * 0.35, y + R * 0.35); c.lineTo(x, y + R * 2); c.lineTo(x - R * 0.35, y + R * 0.35); c.lineTo(x - R * 2, y); c.lineTo(x - R * 0.35, y - R * 0.35); c.closePath(); c.fill(); });
      c.restore();
      // Falling gold fragments (The Kiss background): flipping squares/disks, motion every frame
      P.particles(34, 77, t, { x0: 0, x1: W, y0: -30, y1: 720, speed: 150, drift: 36, life: 3.2 }).forEach(p => { c.save(); c.translate(p.x, p.y); c.rotate(p.a); c.scale(1, Math.cos(t * 5 + p.i));
        const s2 = 7 + p.s * 8, g2 = c.createLinearGradient(-s2, -s2, s2, s2); g2.addColorStop(0, '#fbe6a0'); g2.addColorStop(1, '#a8741e'); c.fillStyle = g2;
        if (p.i % 3) c.fillRect(-s2, -s2, s2 * 2, s2 * 2); else { c.beginPath(); c.arc(0, 0, s2, 0, Math.PI * 2); c.fill(); } c.strokeStyle = 'rgba(70,40,10,.6)'; c.lineWidth = 1.2; c.strokeRect && (p.i % 3) && c.strokeRect(-s2, -s2, s2 * 2, s2 * 2); c.restore(); });
      // Window + falling leaves
      c.drawImage(windowArt(), 0, 0);
      c.save(); c.beginPath(); c.rect(370, 140, 420, 400); c.clip();
      P.particles(14, 5, t, { x0: 380, x1: 780, y0: 130, y1: 560, speed: 120, drift: 22, life: 2.4 }).forEach(p => { c.save(); c.translate(p.x, p.y); c.rotate(p.a); c.scale(1, Math.cos(t * 6 + p.i)); c.fillStyle = ['#e8a83a', '#d8603a', '#f2d070'][p.i % 3]; c.beginPath(); c.ellipse(0, 0, 9, 5, 0, 0, Math.PI * 2); c.fill(); c.restore(); });
      c.restore();
      meadow(c, t);
      c.drawImage(table(), 0, 0);
      // Diagonal bright sweep across gold wall at constant speed (characters drawn later naturally occlude it)
      const sweep = (c2, x0) => { const gr = c2.createLinearGradient(x0 - 260, 0, x0 + 260, 0); gr.addColorStop(0, 'rgba(255,240,180,0)'); gr.addColorStop(0.5, 'rgba(255,240,180,.24)'); gr.addColorStop(1, 'rgba(255,240,180,0)'); c2.save(); c2.globalCompositeOperation = 'lighter'; c2.transform(1, 0, -0.45, 1, 0, 0); c2.fillStyle = gr; c2.fillRect(x0 - 260 - 600, 0, 520 + 1200, 700); c2.restore(); };
      const sx = lerp(-200, 2300, clamp(lt / 1.15));
      sweep(c, sx);
      // Cat
      const K = RIG.cat({ tail: ch.tail, blink: ch.blink, breathe: ch.breathe });
      cat(c, K, t);
      // Girl: gold/pattern silhouette first, then realistic face/hands
      const G = RIG.girl({ cup: ch.cup, sip: ch.sip, breathe: ch.breathe, hair: 'bun' });
      const R_ = P.scratch('kl_robe'), rg = R_.getContext('2d'); rg.reset();
      const Pt = P.scratch('kl_pat'), pt = Pt.getContext('2d'); pt.reset(); robePattern(pt, t, lt);          // Draw full pattern layer, then source-in entire silhouette once (source-in each pattern would erase others)
      rg.fillStyle = '#000'; [G.farSleeve, G.skirt, G.torso].forEach(p => rg.fill(p));
      rg.globalCompositeOperation = 'source-in'; rg.drawImage(Pt, 0, 0);
      rg.globalCompositeOperation = 'source-atop'; sweep(rg, sx + 260);
      rg.globalCompositeOperation = 'source-over';
      rg.strokeStyle = C.ink; rg.lineWidth = 3; [G.farSleeve, G.skirt, G.torso].forEach(p => rg.stroke(p));
      skin(rg, G.farHand, 1180, 614, 40);
      hair(rg, G, t);
      // Far cuff: black/white check ring
      face(rg, G, ch); bangs(rg, G); wreath(rg, G, t);
      // Near gold-sleeved arm before face
      rg.save(); rg.beginPath(); rg.rect(0, 0, W, H); rg.clip();
      rg.fillStyle = '#000'; const arm = new Path2D(); arm.addPath(G.upperArm); arm.addPath(G.foreArm);
      rg.save(); rg.clip(arm); rg.drawImage(Pt, 0, 0); rg.restore(); rg.strokeStyle = C.ink; rg.lineWidth = 3; rg.stroke(G.upperArm); rg.stroke(G.foreArm);
      rg.fillStyle = '#141010'; rg.fill(G.cuff); rg.save(); rg.clip(G.cuff); rg.fillStyle = '#f4efe2'; for (let k = 0; k < 40; k++) rg.fillRect(G.A.elbow[0] - 100 + (k % 10) * 20, G.A.elbow[1] - 100 + ((k / 10) | 0) * 50 + (k % 2) * 8, 8, 8); rg.restore();
      rg.restore();
      skin(rg, G.hand, G.A.hand[0], G.A.hand[1], 20);
      // Gold cup (black checks)
      const cp = G.cup; rg.save(); rg.translate(cp.x, cp.y); rg.rotate(cp.tilt);
      rg.beginPath(); rg.moveTo(-cp.w / 2, 0); rg.lineTo(-cp.w * 0.38, cp.h); rg.lineTo(cp.w * 0.38, cp.h); rg.lineTo(cp.w / 2, 0); rg.closePath();
      const cg = rg.createLinearGradient(-cp.w / 2, 0, cp.w / 2, 0); cg.addColorStop(0, '#f6d880'); cg.addColorStop(0.5, '#c8962e'); cg.addColorStop(1, '#8a5a14'); rg.fillStyle = cg; rg.fill(); rg.strokeStyle = C.ink; rg.lineWidth = 2; rg.stroke();
      rg.fillStyle = '#141010'; for (let k = 0; k < 3; k++) rg.fillRect(-cp.w * 0.3 + k * cp.w * 0.24, cp.h * 0.35, 7, 7);
      rg.restore();
      rg.fillStyle = '#f0cfb8'; rg.beginPath(); rg.arc(G.thumb[0], G.thumb[1], 6.5, 0, Math.PI * 2); rg.fill();
      c.drawImage(R_, 0, 0);
      // Steam: rising fine gold spirals
      c.save(); c.globalAlpha = 0.85; [0, 1].forEach(k => { c.strokeStyle = '#f6e6a8'; c.lineWidth = 2.4; c.beginPath(); for (let i = 0; i <= 30; i++) { const q = i / 30; const x = G.cup.x - 6 + k * 14 - q * 50 * ch.cup + Math.sin(t * 4 + q * 8 + k * 2) * 9 * q, y = G.cup.y - 8 - q * 85; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }); c.restore();
    },
    label(c, lt) {
      c.save();
      c.fillStyle = '#141010'; c.fillRect(1468, 36, 422, 176);
      c.fillStyle = '#d6a845'; c.fillRect(1468, 36, 422, 6); c.fillRect(1468, 206, 422, 6);
      for (let x = 1472; x < 1886; x += 14) { c.fillStyle = ((x - 1472) / 14) % 2 ? '#f4efe2' : '#d6a845'; c.fillRect(x, 48, 9, 9); c.fillRect(x, 192, 9, 9); }
      c.restore();
      const g = c.createLinearGradient(0, 60, 0, 136); g.addColorStop(0, '#fbe6a0'); g.addColorStop(0.5, '#d6a845'); g.addColorStop(1, '#9a6a1c');
      KIT.label(c, { title: '金色时期', sub: 'GUSTAV KLIMT · 1907', tFont: '78px "LXGWWenKai-500"', sFont: '27px "Marcellus-400"', tCol: g, sCol: '#e8cf86', x: 1858, y: 140, sy: 182, spacing: 8 });
    },
  };
})();
