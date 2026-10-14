// 2016 Makoto Shinkai lighting — entirely procedural.
// Pipeline: ① sky (clear blue gradient, cumulonimbus: lit spherical clumps and warm lit edges, slowly billowing), utility poles/wires/distant roofs, contrail
//      → ② realistic background (warm/cool wall gradients, reflected wooden floor, table/chair/potted plant) → ③ window droplets (refract sky, highlights, one slowly slides down)
//      → ④ cel characters: each component base color → hard shaded-side shadow → lit-side rim → fine outline; shadow/rim = self minus translated self (evenodd inverse selection)
//      → ⑤ Tyndall light shafts and dust → ⑥ lens flare (starburst, colored spots along sun–image-center axis, horizontal streaks) → ⑦ downscale/blur and screen back = bloom
SCENES['35_shinkai'] = (() => {
  const W = 1920, H = 1080, { clamp, lerp, rng } = U, P = PAINT;
  const SUN = [712, 196], GL = [360, 132, 800, 548];
  // ---------- Cel coloring ----------
  const cel = P.cel;   // Cel: base color → hard shaded-side band (self minus translated self) → lit-side rim → fine outline
  // ---------- Sky and cumulonimbus ----------
  const cloudBlobs = (() => { const r = rng(808), out = [];
    // Main tower: broad base, tapering upward, anvil top slightly right; two smaller clouds
    for (let i = 0; i < 70; i++) { const h = Math.pow(r(), 0.8); const y = 540 - h * 360, w = h > 0.85 ? 300 : lerp(240, 110, h); out.push({ x: 590 + (r() - 0.5) * w * 1.5 + h * 50, y: y + (r() - 0.5) * 30, r: lerp(64, 34, h) * (0.7 + r() * 0.6), ph: r() * 6 }); }
    for (let i = 0; i < 12; i++) out.push({ x: 410 + r() * 90, y: 290 + r() * 50, r: 22 + r() * 22, ph: r() * 6 });
    return out.sort((a, b) => b.y - a.y); })();
  function sky(c, t) {
    c.save(); c.beginPath(); c.rect(GL[0], GL[1], GL[2] - GL[0], GL[3] - GL[1]); c.clip();
    const sg = c.createLinearGradient(0, GL[1], 0, GL[3]); sg.addColorStop(0, '#1360d0'); sg.addColorStop(0.45, '#3f9bf0'); sg.addColorStop(0.85, '#a8dcff'); sg.addColorStop(1, '#e4f6ff');
    c.fillStyle = sg; c.fillRect(GL[0], GL[1], 440, 416);
    // Cumulonimbus offscreen: ① blue-gray silhouette for all clumps (shade) ② sunward bright sphere per clump (lit side) ③ blur layer 3px, overlay 55% sharp layer (soft without being blurry)
    const drift = t * 10, CL = P.scratch('skCloud'), cg = CL.getContext('2d'); cg.reset();
    const at = b => [b.x + drift, b.y - Math.sin(t * 0.8 + b.ph) * 3, b.r * (1 + 0.05 * Math.sin(t * 1.3 + b.ph))];
    cloudBlobs.forEach(b => { const [x, y, r] = at(b); const g = cg.createLinearGradient(0, y - r, 0, y + r); g.addColorStop(0, '#b7c6e6'); g.addColorStop(1, '#8297c6'); cg.fillStyle = g; cg.beginPath(); cg.arc(x, y, r, 0, 7); cg.fill(); });
    cloudBlobs.forEach(b => { const [x, y, r] = at(b); const ox = x + r * 0.22, oy = y - r * 0.3, rr = r * 0.82;
      const g = cg.createRadialGradient(ox + rr * 0.3, oy - rr * 0.3, rr * 0.05, ox, oy, rr); g.addColorStop(0, '#ffffff'); g.addColorStop(0.6, '#f6f8ff'); g.addColorStop(0.9, '#e2e9fa'); g.addColorStop(1, 'rgba(226,233,250,0)');
      cg.fillStyle = g; cg.beginPath(); cg.arc(ox, oy, rr, 0, 7); cg.fill(); });
    c.save(); c.filter = 'blur(3px)'; c.drawImage(CL, 0, 0); c.restore(); c.globalAlpha = 0.55; c.drawImage(CL, 0, 0); c.globalAlpha = 1;
    // Distant roofs and utility poles (backlit, hazy blue)
    c.fillStyle = '#7d9cc6'; c.beginPath(); c.moveTo(360, 548); [[360, 500], [420, 500], [420, 480], [470, 480], [480, 462], [540, 462], [545, 490], [610, 490], [615, 470], [690, 470], [700, 495], [760, 495], [760, 476], [800, 476], [800, 548]].forEach(p => c.lineTo(...p)); c.fill();
    c.fillStyle = '#5f7fae'; c.fillRect(708, 300, 8, 250); c.fillRect(690, 318, 46, 6); c.fillRect(694, 338, 38, 5);
    c.strokeStyle = 'rgba(50,70,110,.8)'; c.lineWidth = 1.6; [[318, 330], [338, 352], [321, 400]].forEach(([y0, y1], k) => { c.beginPath(); c.moveTo(360, y1 + 30 + k * 6); c.quadraticCurveTo(540, y1 + 60, 712, y0); c.quadraticCurveTo(760, y0 + 10, 800, y0 + 18 + k * 4); c.stroke(); });
    // Contrail: plane flies left to right, trail broadens and fades behind
    const px = 380 + (t * 140) % 520, py = 196 - (px - 380) * 0.05;
    const ctg = c.createLinearGradient(px - 260, 0, px, 0); ctg.addColorStop(0, 'rgba(255,255,255,0)'); ctg.addColorStop(1, 'rgba(255,255,255,.9)');
    c.strokeStyle = ctg; c.lineWidth = 3; c.beginPath(); c.moveTo(px - 260, py + 13); c.lineTo(px, py); c.stroke(); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(px + 3, py, 2.5, 0, 7); c.fill();
    // Three birds, V-shaped flapping wings
    for (let k = 0; k < 3; k++) { const bx = 470 + t * 90 + k * 34, by = 250 + k * 14 + Math.sin(t * 3 + k) * 6, f = Math.sin(t * 16 + k * 2) * 6; c.strokeStyle = '#3a4a6a'; c.lineWidth = 2; c.beginPath(); c.moveTo(bx - 9, by - f); c.lineTo(bx, by); c.lineTo(bx + 9, by - f); c.stroke(); }
    c.restore();
  }
  // ---------- Static interior (cached) ----------
  const room = () => P.cached('sk_room', W, H, (g) => {
    const wg = g.createLinearGradient(0, 0, W, 0); wg.addColorStop(0, '#f2ece2'); wg.addColorStop(0.45, '#e9e4dc'); wg.addColorStop(1, '#bfc3d2'); g.fillStyle = wg; g.fillRect(0, 0, W, 720);
    const vg = g.createLinearGradient(0, 0, 0, 720); vg.addColorStop(0, 'rgba(120,130,170,.25)'); vg.addColorStop(0.5, 'rgba(0,0,0,0)'); g.fillStyle = vg; g.fillRect(0, 0, W, 720);
    // Baseboard and wooden floor (perspective seams, reflections)
    g.fillStyle = '#d8d4cc'; g.fillRect(0, 700, W, 18);
    const fg = g.createLinearGradient(0, 718, 0, H); fg.addColorStop(0, '#9a6a48'); fg.addColorStop(1, '#6a4430'); g.fillStyle = fg; g.fillRect(0, 718, W, H - 718);
    g.strokeStyle = 'rgba(60,36,20,.45)'; g.lineWidth = 2; for (let i = -20; i <= 20; i++) { g.beginPath(); g.moveTo(960 + i * 70, 718); g.lineTo(960 + i * 190, H); g.stroke(); }
    // Window: aluminum sliding frame (opening, frame, mullion, sill)
    g.fillStyle = '#d4d2d4'; g.fillRect(330, 104, 500, 470); g.fillStyle = '#f6f6f8'; g.fillRect(342, 116, 476, 448);
    g.fillStyle = '#b8bcc8'; g.fillRect(352, 124, 456, 432);
    g.fillStyle = '#eef0f4'; g.fillRect(570, 124, 22, 432); g.fillStyle = '#c6cad4'; g.fillRect(588, 124, 4, 432);
    g.fillStyle = '#fbfbfc'; g.fillRect(316, 562, 530, 22); g.fillStyle = '#c4c4cc'; g.fillRect(316, 584, 530, 8);
    // Wall: calendar and photo (small realistic details)
    g.fillStyle = '#ffffff'; g.fillRect(1580, 250, 150, 200); g.fillStyle = '#e2534a'; g.fillRect(1580, 250, 150, 40); g.fillStyle = '#9aa0b0'; for (let i = 0; i < 5; i++) for (let j = 0; j < 7; j++) g.fillRect(1592 + j * 19, 304 + i * 26, 12, 12);
    // Table: pale wooden desk
    g.fillStyle = '#7a5236'; g.fillRect(836, 650, 26, 255); g.fillRect(1160, 650, 26, 255);
    g.fillStyle = '#c99a68'; g.fillRect(806, 612, 410, 30); g.fillStyle = '#f0cf9c'; g.fillRect(806, 612, 410, 6); g.fillStyle = '#8e623e'; g.fillRect(806, 638, 410, 14);
    // Chair
    g.fillStyle = '#8e623e'; g.fillRect(1430, 470, 18, 440); g.fillRect(1478, 480, 18, 430); g.fillRect(1426, 470, 74, 60);
    g.fillStyle = '#b8865a'; g.fillRect(1426, 470, 74, 8);
    // Tabletop: book
    g.fillStyle = '#3d5a8e'; g.fillRect(1040, 594, 110, 18); g.fillStyle = '#f2ecdc'; g.fillRect(1044, 590, 102, 6); g.fillStyle = '#c94f4a'; g.fillRect(1052, 578, 90, 14);
  });
  // ---------- Girl (cel shading per component) ----------
  const SK = { b: '#ffe8dc', s: '#f2b6a8', r: '#fffaf4' }, HR = { b: '#f8d681', s: '#d8a050', r: '#fff6d6' }, WT = { b: '#fbfbfe', s: '#b9c3dc', r: '#ffffff' }, NV = { b: '#2c3a66', s: '#1b2446', r: '#5a6ea8' };
  function girl(c, G, t, lt) {
    const L = '#6a4632', o = { line: L };
    cel(c, G.farSleeve, WT.b, WT.s, null, o); cel(c, G.farHand, SK.b, SK.s, null, o);
    cel(c, G.skirt, NV.b, NV.s, NV.r, { ...o, sd: 30 });
    c.save(); c.clip(G.skirt); c.strokeStyle = '#141a33'; c.lineWidth = 2.5; [[1170, 700, 1140, 925], [1210, 690, 1190, 930], [1250, 680, 1244, 930], [1290, 680, 1296, 925], [1330, 760, 1346, 925]].forEach(([a, b, c2, d]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(c2, d); c.stroke(); }); c.restore();
    cel(c, G.shoe, '#3a2a24', '#22160f', null, o);
    cel(c, G.torso, WT.b, WT.s, WT.r, { ...o, sd: 26 });
    // Sailor collar (large square back collar, navy with two white lines)
    const nape = G.A.nape, bk = G.A.back, nk = G.A.neck;
    const col = RIG.smooth([[nk[0] - 8, nk[1] - 6], [nape[0] + 10, nape[1] - 4], [bk[0] + 6, bk[1] - 20], [bk[0] - 4, bk[1] + 30], [nk[0] + 40, nk[1] + 70], [nk[0] + 6, nk[1] + 30]]);
    cel(c, col, NV.b, NV.s, NV.r, { ...o, sd: 14 });
    c.save(); c.clip(col); c.strokeStyle = '#f2f4fa'; c.lineWidth = 3; c.stroke(RIG.smooth([[nk[0] + 4, nk[1] + 6], [nape[0] + 12, nape[1] + 8], [bk[0] - 6, bk[1] - 14], [bk[0] - 14, bk[1] + 18], [nk[0] + 38, nk[1] + 58], [nk[0] + 12, nk[1] + 28]])); c.restore();
    // Red neckerchief knot
    const ch = G.A.chest; const tie = RIG.smooth([[nk[0] - 8, nk[1] + 14], [nk[0] + 16, nk[1] + 18], [ch[0] + 10, ch[1] + 10], [ch[0] - 4, ch[1] + 50], [ch[0] - 16, ch[1] + 8]]);
    cel(c, tie, '#e04454', '#a8243a', '#ff8a96', { ...o, sd: 10, rw: 4 });
    cel(c, G.neck, SK.b, SK.s, null, { ...o, sd: 14 });
    cel(c, G.hairBack, HR.b, HR.s, HR.r, { ...o, line: '#8a5a2a', sd: 26, rw: 9 }); cel(c, G.bun, HR.b, HR.s, HR.r, { ...o, line: '#8a5a2a', sd: 16 });
    // Hair highlight ring: bright band across back of head
    c.save(); c.clip(G.hairBack); c.strokeStyle = 'rgba(255,250,226,.85)'; c.lineWidth = 9; c.beginPath(); c.arc(G.A.headC[0] + 10, G.A.headC[1] + 10, 64, -2.2, -0.6); c.stroke(); c.restore();
    cel(c, G.face, SK.b, SK.s, null, { ...o, sd: 10 });
    c.save(); c.clip(G.face); c.fillStyle = 'rgba(255,140,140,.35)'; c.beginPath(); c.ellipse(G.cheek[0] - 4, G.cheek[1], 16, 9, 0, 0, 7); c.fill(); c.restore();
    c.fillStyle = SK.b; c.beginPath(); c.ellipse(G.ear[0], G.ear[1], 8, 12, 0.2, 0, 7); c.fill(); c.strokeStyle = L; c.lineWidth = 1.8; c.stroke();
    cel(c, G.bangs, HR.b, HR.s, HR.r, { ...o, line: '#8a5a2a', sd: 12, rw: 6 });
    c.strokeStyle = 'rgba(170,110,50,.7)'; c.lineWidth = 1.6; G.hairLines.forEach(h => c.stroke(h));
    // Hair strands blown by window breeze
    const wind = Math.sin(t * 3.2) * 6 + Math.sin(t * 7.1) * 2;
    c.save(); c.translate(wind * 0.5, 0); G.locks.forEach(h => { c.strokeStyle = '#8a5a2a'; c.lineWidth = 8; c.stroke(h); c.strokeStyle = HR.b; c.lineWidth = 5.5; c.stroke(h); }); c.restore();
    c.strokeStyle = HR.s; c.lineWidth = 3; for (let k = 0; k < 3; k++) { const s = G.A.nape; c.beginPath(); c.moveTo(s[0] + 10 + k * 8, s[1] - 10); c.quadraticCurveTo(s[0] + 26 + k * 8 + wind, s[1] + 30, s[0] + 18 + k * 10 + wind * 1.6, s[1] + 70); c.stroke(); }
    // Anime eyes: large, vertically graduated irises, two highlights; thick lids
    const e = G.eye, bl = P.choreo(lt, t).blink;
    if (bl) { c.strokeStyle = '#3a2418'; c.lineWidth = 3.2; c.beginPath(); c.moveTo(e.x - 9, e.y + 3); c.quadraticCurveTo(e.x, e.y + 7, e.x + 9, e.y + 3); c.stroke(); }
    else {
      const ig = c.createLinearGradient(0, e.y - 12, 0, e.y + 12); ig.addColorStop(0, '#1f3f7a'); ig.addColorStop(0.6, '#3f7fd0'); ig.addColorStop(1, '#9fd4ff');
      c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(e.x, e.y + 1, 8, 12, 0, 0, 7); c.fill();
      c.fillStyle = ig; c.beginPath(); c.ellipse(e.x - 1.5, e.y + 2, 6.5, 11, 0, 0, 7); c.fill();
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(e.x - 3.5, e.y - 3, 2.6, 0, 7); c.fill(); c.beginPath(); c.arc(e.x + 1, e.y + 7, 1.3, 0, 7); c.fill();
      c.strokeStyle = '#3a2418'; c.lineWidth = 3.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(e.x - 10, e.y - 7); c.quadraticCurveTo(e.x, e.y - 14, e.x + 9, e.y - 9); c.stroke();
      c.lineWidth = 2; c.beginPath(); c.moveTo(e.x - 10, e.y - 7); c.lineTo(e.x - 15, e.y - 11); c.stroke();
    }
    c.strokeStyle = '#a07040'; c.lineWidth = 2; c.stroke(G.brow);
    c.fillStyle = '#e07a78'; c.beginPath(); c.moveTo(...G.lips[0]); c.lineTo(...G.lips[1]); c.lineTo(...G.lips[2]); c.closePath(); c.fill();
    // Near arm (white short sleeve changed to long sleeve: demure 17-year-old style)
    cel(c, G.upperArm, WT.b, WT.s, WT.r, { ...o, sd: 16 }); cel(c, G.foreArm, WT.b, WT.s, WT.r, { ...o, sd: 12 }); cel(c, G.cuff, NV.b, NV.s, null, { ...o, sd: 8 });
    cel(c, G.hand, SK.b, SK.s, SK.r, { ...o, sd: 8, rw: 3 });
    const cp = G.cup; c.save(); c.translate(cp.x, cp.y); c.rotate(cp.tilt);
    const cup = RIG.smooth([[-22, 0], [-19, 32], [0, 40], [19, 32], [22, 0]]); cel(c, cup, '#ffffff', '#c6d0e6', null, { ...o, sd: 10 });
    c.strokeStyle = '#ffffff'; c.lineWidth = 6; c.beginPath(); c.arc(25, 15, 10, -1.3, 1.5); c.stroke(); c.strokeStyle = L; c.lineWidth = 1.6; c.stroke();
    c.fillStyle = '#c98a4a'; c.beginPath(); c.ellipse(0, 1, 20, 4.5, 0, 0, 7); c.fill(); c.restore();
    c.fillStyle = SK.b; c.beginPath(); c.arc(G.thumb[0], G.thumb[1], 7, 0, 7); c.fill(); c.strokeStyle = L; c.lineWidth = 1.8; c.stroke();
  }
  function cat(c, K, t) {
    const o = { line: '#7a4a28', lw: 2.2 };
    const OR = { b: '#f4a758', s: '#c8743a', r: '#fff0c8' }, WH = { b: '#fff8ee', s: '#c6cce2', r: '#ffffff' };
    // Tail
    c.save(); c.lineCap = 'round'; c.strokeStyle = o.line; c.lineWidth = K.tailW + 4; c.stroke(K.tail); c.strokeStyle = OR.b; c.lineWidth = K.tailW; c.stroke(K.tail);
    c.strokeStyle = OR.s; c.lineWidth = K.tailW * 0.45; c.save(); c.translate(4, 5); c.stroke(K.tail); c.restore();
    const tip = K.tailPts[K.tailPts.length - 1]; c.fillStyle = WH.b; c.beginPath(); c.arc(tip[0], tip[1], K.tailW / 2, 0, 7); c.fill(); c.restore();
    const body = RIG.smooth(K.bodyPts);
    cel(c, body, OR.b, OR.s, OR.r, { ...o, sd: 34, rw: 8, lx: 0.5, ly: 1 });                       // Cat under window: backlit, shade underneath
    c.save(); c.clip(body); c.strokeStyle = '#d07a34'; c.lineWidth = 8; c.lineCap = 'round'; K.stripes.slice(3).forEach(s => { c.beginPath(); c.moveTo(...s[0]); c.lineTo(...s[1]); c.stroke(); });
    cel(c, RIG.smooth([[566, 700], [612, 690], [642, 742], [636, 830], [596, 870], [560, 800]]), WH.b, WH.s, null, { ...o, lw: 0, sd: 18, lx: 0.5, ly: 1 }); c.restore();
    c.strokeStyle = o.line; c.lineWidth = 2.2; c.stroke(body);
    [[588, 812], [634, 814]].forEach(([x, y]) => cel(c, RIG.taper([x, y], [x, 890], 30, 30), WH.b, WH.s, null, { ...o, sd: 10, lx: 0.5, ly: 1 }));
    cel(c, K.head, OR.b, OR.s, OR.r, { ...o, sd: 22, rw: 8, lx: 0.5, ly: 1 });
    c.save(); c.clip(K.head); c.strokeStyle = '#d07a34'; c.lineWidth = 7; c.lineCap = 'round'; K.stripes.slice(0, 3).forEach(s => { c.beginPath(); c.moveTo(...s[0]); c.lineTo(...s[1]); c.stroke(); });
    c.fillStyle = WH.b; c.beginPath(); c.ellipse(K.nose[0] - 24, K.nose[1] + 12, 36, 25, 0, 0, 7); c.fill(); c.restore();
    c.fillStyle = '#f6b0b0'; K.earInner.forEach(e => { c.beginPath(); e.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.fill(); });
    K.eyes.forEach(e => { if (K.blink) { c.strokeStyle = '#3a2418'; c.lineWidth = 3; c.beginPath(); c.arc(e.x, e.y, 9, 0.2, Math.PI - 0.2); c.stroke(); return; }
      const g = c.createLinearGradient(0, e.y - 10, 0, e.y + 10); g.addColorStop(0, '#5a8a2a'); g.addColorStop(1, '#d8f080'); c.fillStyle = g; c.beginPath(); c.ellipse(e.x, e.y, 9, 11, 0, 0, 7); c.fill();
      c.fillStyle = '#1a1a1a'; c.beginPath(); c.ellipse(e.x + 1.5, e.y, 3, 8, 0, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(e.x - 2.5, e.y - 4, 2.4, 0, 7); c.fill(); c.strokeStyle = '#3a2418'; c.lineWidth = 2; c.beginPath(); c.ellipse(e.x, e.y, 9, 11, 0, 0, 7); c.stroke(); });
    c.fillStyle = '#e88a8a'; c.beginPath(); c.arc(K.nose[0], K.nose[1], 5, 0, 7); c.fill();
    c.strokeStyle = '#7a4a28'; c.lineWidth = 2; c.beginPath(); c.moveTo(...K.mouth[0]); c.quadraticCurveTo(...K.mouth[1], ...K.mouth[2]); c.stroke();
    c.lineWidth = 1.2; c.strokeStyle = 'rgba(255,255,255,.9)'; K.whiskers.forEach(w => { c.beginPath(); c.moveTo(...w[0]); c.lineTo(...w[1]); c.stroke(); });
    // Backlighting: bright rim across cat's crown and back (window overhead)
    c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,220,160,.55)'; c.lineWidth = 4; c.save(); c.clip(K.head); c.translate(0, 5); c.stroke(K.head); c.restore(); c.save(); c.clip(body); c.translate(4, 6); c.stroke(body); c.restore(); c.restore();
  }

  return {
    draw(c, lt, t) {
      const ch = P.choreo(lt, t);
      c.drawImage(room(), 0, 0);
      sky(c, t);
      // Window droplets (refract small sky patch, dark lower rim, upper-left highlight), one slides down glass
      const dr = rng(64);
      for (let i = 0; i < 20; i++) { let x = 366 + dr() * 428, y = 140 + dr() * 400, r = 2 + dr() * 3.5; if (i === 0) { r = 8; x = 470; y = 180 + clamp(lt - 0.2) * 220; }
        if (x > 566 && x < 596) continue;
        c.strokeStyle = 'rgba(30,60,120,.45)'; c.lineWidth = 1.4; c.beginPath(); c.arc(x, y, r, 0.3, Math.PI - 0.3); c.stroke();
        c.fillStyle = 'rgba(220,240,255,.22)'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
        c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x - r * 0.35, y - r * 0.35, r * 0.28, 0, 7); c.fill();
        if (i === 0) { c.strokeStyle = 'rgba(220,240,255,.45)'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y - 10); c.lineTo(x, 180); c.stroke(); } }
      // Curtain: white sheer at right billows in breeze (Bézier edge sways over time)
      const wv = Math.sin(t * 2.6) * 22 + Math.sin(t * 5.3) * 6;
      const cur = new Path2D(); cur.moveTo(760, 108); cur.lineTo(840, 108); cur.bezierCurveTo(850, 260, 830 + wv * 0.3, 420, 846, 600); cur.lineTo(760 - wv, 600); cur.bezierCurveTo(720 - wv * 1.4, 430, 760 - wv * 0.6, 260, 760, 108); cur.closePath();
      c.fillStyle = 'rgba(255,255,255,.55)'; c.fill(cur); c.strokeStyle = 'rgba(200,210,230,.6)'; c.lineWidth = 2; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(775 + k * 18, 110); c.bezierCurveTo(780 + k * 18, 300, 770 + k * 16 - wv * (0.4 + k * 0.1), 460, 770 + k * 20 - wv * (0.8 - k * 0.15), 598); c.stroke(); }
      // Warm window-shaped floor light (projected parallelogram) and lit tabletop corner
      c.save(); c.globalCompositeOperation = 'screen';
      c.drawImage(P.cached('sk_floorlight', W, H, (g) => { g.filter = 'blur(14px)'; g.fillStyle = 'rgba(255,214,150,.6)'; g.beginPath(); g.moveTo(560, 740); g.lineTo(980, 740); g.lineTo(1240, 1040); g.lineTo(720, 1040); g.closePath(); g.fill();
        g.fillStyle = 'rgba(80,60,40,1)'; g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.moveTo(760, 740); g.lineTo(790, 740); g.lineTo(990, 1040); g.lineTo(950, 1040); g.closePath(); g.fill(); }), 0, 0);
      c.fillStyle = 'rgba(255,214,150,.3)'; c.fillRect(806, 612, 300, 26);
      // Window-shaped wall light (upper-right to lower-right parallelogram), curtain shadow sways inside
      const WL = P.scratch('skWallLight'), wlg = WL.getContext('2d'); wlg.reset(); wlg.filter = 'blur(10px)';
      wlg.fillStyle = 'rgba(255,222,170,.55)'; wlg.beginPath(); wlg.moveTo(980, 150); wlg.lineTo(1330, 230); wlg.lineTo(1330, 600); wlg.lineTo(980, 560); wlg.closePath(); wlg.fill();
      wlg.globalCompositeOperation = 'destination-out'; wlg.fillStyle = '#000'; wlg.beginPath(); wlg.moveTo(1140, 186); wlg.lineTo(1166, 192); wlg.lineTo(1166, 580); wlg.lineTo(1140, 578); wlg.fill();
      const cs = Math.sin(t * 2.6) * 30 + Math.sin(t * 5.3) * 8; wlg.globalAlpha = 0.7; wlg.beginPath(); wlg.moveTo(1240 + cs * 0.3, 200); wlg.bezierCurveTo(1230 + cs, 330, 1250 - cs * 0.4, 460, 1220 + cs, 600); wlg.lineTo(1340, 600); wlg.lineTo(1340, 200); wlg.fill();
      c.drawImage(WL, 0, 0);
      c.restore();
      // Potted plant (leaves sway in breeze)
      const sway = Math.sin(t * 2.6) * 0.06;
      c.fillStyle = '#e8e2d6'; c.fillRect(872, 566, 56, 46); c.fillStyle = '#c9c0b0'; c.fillRect(900, 566, 28, 46);
      [[-0.8, 60], [-0.3, 74], [0.2, 70], [0.7, 58], [-1.2, 44], [1.1, 46]].forEach(([a, l], k) => { c.save(); c.translate(900, 566); c.rotate(a + sway * (1 + k * 0.3)); const leaf = new Path2D(); leaf.ellipse(0, -l * 0.6, 13, l * 0.55, 0, 0, 7); cel(c, leaf, '#5fae5a', '#2f7a42', '#b8f09a', { line: '#2a5a32', lw: 1.6, sd: 7, rw: 3 }); c.restore(); });
      // Characters
      const K = RIG.cat({ tail: ch.tail, blink: ch.blink, breathe: ch.breathe });
      const G = RIG.girl({ cup: ch.cup, sip: ch.sip, breathe: ch.breathe, hair: 'bun' });
      cat(c, K, t); girl(c, G, t, lt);
      P.steam(c, t, G.cup.x, G.cup.y - 6, { h: 60, n: 2, color: 'rgba(255,255,255,.7)', width: 3, spread: 12, wobble: 8 });
      // Tyndall shafts (cached blurred wedges, slight temporal flicker) and light dust
      c.save(); c.globalCompositeOperation = 'screen';
      const beams = P.cached('sk_beams', W, H, (g) => { g.filter = 'blur(18px)'; [[380, 130, 470, 130, 1060, 1000, 860, 1000, 0.32], [520, 130, 600, 130, 1220, 980, 1080, 1000, 0.22], [640, 130, 790, 130, 1450, 900, 1240, 1000, 0.26]].forEach(([a, b, c2, d, e, f, gx, h, al]) => {
        const lg = g.createLinearGradient(a, b, e, f); lg.addColorStop(0, `rgba(255,240,205,${al})`); lg.addColorStop(1, 'rgba(255,240,205,0)'); g.fillStyle = lg; g.beginPath(); g.moveTo(a, b); g.lineTo(c2, d); g.lineTo(e, f); g.lineTo(gx, h); g.closePath(); g.fill(); }); });
      c.globalAlpha = 0.75 + 0.25 * Math.sin(t * 3.4); c.drawImage(beams, 0, 0); c.globalAlpha = 1;
      const motes = P.particles(60, 91, t * 0.5, { x0: 480, x1: 1300, y0: 980, y1: 140, speed: 30, drift: 30, life: 8 });
      motes.forEach((m, i) => { const tw = 0.5 + 0.5 * Math.sin(t * 6 + i * 1.3); const rr = 1.5 + m.s * 3; const g2 = c.createRadialGradient(m.x, m.y, 0, m.x, m.y, rr * 2.5); g2.addColorStop(0, `rgba(255,250,230,${0.8 * tw})`); g2.addColorStop(1, 'rgba(255,250,230,0)'); c.fillStyle = g2; c.beginPath(); c.arc(m.x, m.y, rr * 2.5, 0, 7); c.fill(); });
      c.restore();
      // Lens flare (P.lensFlare: sun core, slowly rotating starburst, horizontal streaks, hexagonal spots along sun→image center) and bloom (P.bloom: downscale/blur and screen back)
      P.lensFlare(c, SUN, t);
      P.bloom(c, { key: 'skBloom' });
      // Overall grade: warm highlights, blue shadows (Shinkai warm/cool separation)
      c.save(); c.globalCompositeOperation = 'soft-light'; const tg = c.createLinearGradient(0, 0, W, H); tg.addColorStop(0, 'rgba(255,220,170,.35)'); tg.addColorStop(1, 'rgba(80,120,220,.35)'); c.fillStyle = tg; c.fillRect(0, 0, W, H); c.restore();
    },
  };
})();
