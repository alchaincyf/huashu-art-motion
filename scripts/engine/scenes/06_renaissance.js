// 1503 High Renaissance oil painting (Leonardo style) — pure code.
// Pipeline: ① static layer (dark-brown plaster + window glow, stone arch/window with aerial-perspective blue mountains/lake/winding silver river/cypresses, perspective checker tiles, white-clothed square table, ladder-back chair)
//      blur layer 1.3px for sfumato → ② each frame: ornithopter flaps past window, birds, river glints, dust in light shaft
//      → ③ offscreen characters (volume gradients + velvet highlights + short realistic fur strokes), blur 1.6px then overlay 0.45 sharp layer = soft sfumato edges
//      → ④ cached painting overlay: craquelure + canvas weave + vignette + yellow glaze (one drawImage)
SCENES['06_renaissance'] = (() => {
  const W = 1920, H = 1080, { clamp, lerp } = U, P = PAINT;
  const R_ = (s) => U.rng(s);
  const poly = (pts, closed = true) => { const p = new Path2D(); pts.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); if (closed) p.closePath(); return p; };
  const archPath = (xl, xr, cy, yb) => { const p = new Path2D(), r = (xr - xl) / 2; p.moveTo(xl, yb); p.lineTo(xl, cy); p.arc(xl + r, cy, r, Math.PI, 0); p.lineTo(xr, yb); p.closePath(); return p; };
  const OUTER = archPath(360, 810, 335, 560), INNER = archPath(422, 800, 330, 542);

  // ---------- Distant landscape (inside window) ----------
  const RIVER = [[548, 362], [620, 372], [676, 388], [652, 404], [580, 420], [548, 438], [590, 458], [668, 474], [720, 492], [748, 512], [790, 534]];
  function landscape(g) {
    g.save(); g.clip(INNER);
    const sky = g.createLinearGradient(0, 140, 0, 350); sky.addColorStop(0, '#93b0b6'); sky.addColorStop(0.6, '#c8d4cc'); sky.addColorStop(1, '#e4e2cf');
    g.fillStyle = sky; g.fillRect(400, 130, 420, 230);
    // Clouds: soft horizontal masses
    const r = R_(7);
    for (let k = 0; k < 14; k++) { const x = 420 + r() * 380, y = 175 + r() * 90, rw = 50 + r() * 70; const cg = g.createRadialGradient(x, y, 0, x, y, rw); cg.addColorStop(0, 'rgba(240,238,225,.55)'); cg.addColorStop(1, 'rgba(240,238,225,0)'); g.fillStyle = cg; g.save(); g.translate(x, y); g.scale(1, 0.32); g.translate(-x, -y); g.beginPath(); g.arc(x, y, rw, 0, 7); g.fill(); g.restore(); }
    // Layered mountains (farther = bluer/paler, aerial perspective)
    const ranges = [[300, '#9fb4b8', 0.010, 26, 3], [318, '#8aa1a6', 0.016, 22, 5], [336, '#7d9294', 0.02, 14, 9]];
    for (const [base, col, f, amp, sd] of ranges) { g.fillStyle = col; g.beginPath(); g.moveTo(410, 360); for (let x = 410; x <= 810; x += 4) g.lineTo(x, base - Math.abs(P.fbm(x * f, sd, 4)) * amp * 3 - P.noise(x * f * 3, sd) * amp * 0.4); g.lineTo(810, 360); g.closePath(); g.fill(); }
    // Lake
    const lake = g.createLinearGradient(0, 340, 0, 366); lake.addColorStop(0, '#dfe3d6'); lake.addColorStop(1, '#c9d2c2'); g.fillStyle = lake; g.fillRect(410, 340, 400, 24);
    // River valley: warmer foreground
    const vg = g.createLinearGradient(0, 360, 0, 545); vg.addColorStop(0, '#93a08a'); vg.addColorStop(0.45, '#7a8462'); vg.addColorStop(1, '#7c7048');
    g.fillStyle = vg; g.beginPath(); g.moveTo(410, 366); for (let x = 410; x <= 810; x += 6) g.lineTo(x, 362 + P.noise(x * 0.02, 3) * 4); g.lineTo(810, 545); g.lineTo(410, 545); g.closePath(); g.fill();
    // Distant hill patches
    for (let k = 0; k < 40; k++) { const x = 420 + r() * 380, y = 380 + r() * 150, s = 0.4 + (y - 370) / 180; g.fillStyle = `rgba(${90 + r() * 30},${100 + r() * 20},${60 + r() * 15},.35)`; g.beginPath(); g.ellipse(x, y, 30 * s, 6 * s, 0, 0, 7); g.fill(); }
    // River: width grows with distance
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (let pass = 0; pass < 2; pass++) for (let i = 0; i < RIVER.length - 1; i++) {
      const a = RIVER[i], b = RIVER[i + 1], w = 3 + i * 1.3;
      g.strokeStyle = pass ? '#eef0e8' : 'rgba(90,100,80,.6)'; g.lineWidth = pass ? w : w + 3;
      g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke();
    }
    // Small path
    g.strokeStyle = 'rgba(200,190,150,.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(470, 545); g.bezierCurveTo(500, 500, 470, 470, 510, 440); g.stroke();
    // Trees: cypresses (dark vertical ovals) + round trees
    for (let k = 0; k < 26; k++) { const x = 425 + r() * 370, y = 395 + r() * 140, s = 0.4 + (y - 380) / 150; if (Math.abs(x - 640) < 30 && y < 420) continue;
      g.fillStyle = r() < 0.5 ? '#3f4c30' : '#4c5a36';
      if (r() < 0.55) { g.beginPath(); g.ellipse(x, y - 14 * s, 4 * s, 15 * s, 0, 0, 7); g.fill(); } else { g.beginPath(); g.arc(x, y - 6 * s, 9 * s, 0, 7); g.fill(); } }
    // Stone bridge
    g.fillStyle = '#b8ad8c'; g.fillRect(566, 452, 56, 7); g.fillStyle = '#6e6650'; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(578 + k * 16, 460, 5, Math.PI, 0); g.fill(); }
    g.restore();
  }

  // ---------- Static layer ----------
  const VP = { yh: 420, cx: 960, f: 1029, h: 5.75 };
  const proj = (X, Z) => [VP.cx + VP.f * X / Z, VP.yh + VP.f * VP.h / Z];
  function room(g) {
    // Wall: mottled plaster + window glow
    g.drawImage(P.texture('ren_wall', '#43321f', { scale: 0.0024, amt: 30, grain: 12, dark: '#22180e', seed: 21 }), 0, 0);
    const top = g.createLinearGradient(0, 0, 0, 780); top.addColorStop(0, 'rgba(12,7,3,.45)'); top.addColorStop(0.5, 'rgba(12,7,3,0)'); top.addColorStop(1, 'rgba(12,7,3,.15)'); g.fillStyle = top; g.fillRect(0, 0, W, 780);
    const glow = g.createRadialGradient(585, 360, 60, 585, 380, 900); glow.addColorStop(0, 'rgba(190,150,100,.42)'); glow.addColorStop(0.45, 'rgba(150,110,70,.16)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = glow; g.fillRect(0, 0, W, H);
    // Dado shadow line
    const bb = g.createLinearGradient(0, 760, 0, 792); bb.addColorStop(0, 'rgba(20,12,6,0)'); bb.addColorStop(0.7, 'rgba(20,12,6,.45)'); bb.addColorStop(1, 'rgba(20,12,6,.7)'); g.fillStyle = bb; g.fillRect(0, 760, W, 32);
    // Perspective checker tiles (Z forward from wall 16, tile width 1.4)
    const zs = []; for (let z = 16; z > 5; z -= 1.4) zs.push(z);
    for (let j = 0; j < zs.length; j++) { const z0 = zs[j], z1 = z0 - 1.4;
      for (let i = -14; i < 14; i++) { const X0 = i * 1.4, X1 = X0 + 1.4;
        const p = [proj(X0, z0), proj(X1, z0), proj(X1, z1), proj(X0, z1)];
        if (p[2][0] < -300 || p[3][0] > W + 300) continue;
        g.fillStyle = (i + j) % 2 ? '#a88c64' : '#5c2418'; g.beginPath(); p.forEach((q, k) => k ? g.lineTo(...q) : g.moveTo(...q)); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(30,15,8,.35)'; g.lineWidth = 1.2; g.stroke(); } }
    // Window light on floor ahead of cat
    g.save(); g.globalCompositeOperation = 'soft-light';
    const lp = g.createRadialGradient(700, 950, 30, 700, 950, 520); lp.addColorStop(0, 'rgba(255,230,180,.95)'); lp.addColorStop(1, 'rgba(255,230,180,0)'); g.fillStyle = lp; g.fillRect(0, 780, W, 300);
    g.restore();
    const fd = g.createLinearGradient(0, 790, 0, 1080); fd.addColorStop(0, 'rgba(25,14,8,.55)'); fd.addColorStop(0.35, 'rgba(25,14,8,.2)'); fd.addColorStop(1, 'rgba(25,14,8,.45)'); g.fillStyle = fd; g.fillRect(0, 790, W, 290);
    const fside = g.createRadialGradient(760, 960, 120, 760, 960, 1100); fside.addColorStop(0, 'rgba(18,9,4,0)'); fside.addColorStop(0.5, 'rgba(18,9,4,.3)'); fside.addColorStop(1, 'rgba(18,9,4,.75)'); g.fillStyle = fside; g.fillRect(0, 790, W, 290);
    // Arched window: stone frame (lit left side) + opening
    g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 30; g.shadowOffsetX = 10; g.shadowOffsetY = 14;
    const st = g.createLinearGradient(360, 0, 810, 0); st.addColorStop(0, '#c6b08a'); st.addColorStop(0.5, '#a48c68'); st.addColorStop(1, '#7c6a4e');
    g.fillStyle = st; g.fill(OUTER); g.restore();
    const lightR = g.createLinearGradient(360, 0, 430, 0); lightR.addColorStop(0, 'rgba(255,240,210,.0)'); lightR.addColorStop(1, 'rgba(255,240,210,.35)'); g.fillStyle = lightR; g.fill(OUTER);
    landscape(g);
    g.strokeStyle = 'rgba(60,40,20,.55)'; g.lineWidth = 3; g.stroke(INNER);
    // Windowsill
    const sl = g.createLinearGradient(0, 556, 0, 582); sl.addColorStop(0, '#d8c8a4'); sl.addColorStop(1, '#8c7a5a'); g.fillStyle = sl; g.fillRect(335, 556, 490, 24);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(345, 580, 480, 10);
    // Table shadow
    g.fillStyle = 'rgba(15,8,4,.45)'; g.beginPath(); g.ellipse(1000, 905, 230, 22, 0, 0, 7); g.fill();
    // Ladder-back chair behind girl
    const wood = (x, y, w, h) => { const wg = g.createLinearGradient(x, 0, x + w, 0); wg.addColorStop(0, '#7a4a26'); wg.addColorStop(0.4, '#9a6234'); wg.addColorStop(1, '#4a2c16'); g.fillStyle = wg; g.fillRect(x, y, w, h); };
    wood(1458, 445, 18, 455); g.fillStyle = '#9a6234'; g.beginPath(); g.ellipse(1467, 447, 11, 6, 0, 0, 7); g.fill();
    for (let k = 0; k < 4; k++) wood(1440, 490 + k * 58, 30, 8);
    wood(1430, 560, 14, 340);
    g.fillStyle = 'rgba(15,8,4,.4)'; g.beginPath(); g.ellipse(1400, 905, 130, 14, 0, 0, 7); g.fill();
    // Square table: legs + braces + white cloth
    wood(838, 750, 16, 155); wood(1160, 750, 16, 155); wood(852, 818, 310, 9); wood(905, 748, 12, 120);
    const cl = poly([[815, 626], [1205, 626], [1210, 758], [812, 760]]);
    const cg = g.createLinearGradient(815, 0, 1210, 0); cg.addColorStop(0, '#e8dcbc'); cg.addColorStop(0.5, '#d6c8a4'); cg.addColorStop(1, '#a8987a'); g.fillStyle = cg; g.fill(cl);
    g.save(); g.clip(cl);
    for (let x = 830; x < 1210; x += 34) { const fg = g.createLinearGradient(x, 0, x + 34, 0); fg.addColorStop(0, 'rgba(255,250,235,.25)'); fg.addColorStop(0.5, 'rgba(80,60,40,.12)'); fg.addColorStop(1, 'rgba(255,250,235,.0)'); g.fillStyle = fg; g.fillRect(x, 640, 34, 120); }
    g.fillStyle = 'rgba(255,250,235,.55)'; g.fillRect(815, 626, 395, 12);
    g.fillStyle = '#7f95a8'; g.fillRect(812, 734, 400, 3); g.fillRect(812, 741, 400, 2);
    g.restore();
    g.strokeStyle = 'rgba(60,45,30,.35)'; g.lineWidth = 2; g.stroke(cl);
  }
  const STATIC = () => P.cached('ren_static', W, H, (g) => {
    const raw = P.canvas(), rg = raw.getContext('2d'); room(rg);
    g.filter = 'blur(1.3px)'; g.drawImage(raw, 0, 0); g.filter = 'none';
  });
  // Overlay: craquelure + canvas texture + vignette + yellow glaze
  const OVER = () => P.cached('ren_over', W, H, (g) => {
    const v = g.createRadialGradient(820, 520, 300, 900, 560, 1250); v.addColorStop(0, 'rgba(20,10,4,0)'); v.addColorStop(0.55, 'rgba(20,10,4,.3)'); v.addColorStop(1, 'rgba(10,5,2,.8)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(150,110,40,.07)'; g.fillRect(0, 0, W, H);
    const r = R_(4); g.lineWidth = 1;
    for (let y = 0; y < H; y += 3) { g.strokeStyle = `rgba(0,0,0,${0.03 + r() * 0.04})`; g.beginPath(); g.moveTo(0, y + .5); g.lineTo(W, y + .5); g.stroke(); }
    for (let x = 0; x < W; x += 3) { g.strokeStyle = `rgba(255,240,210,${0.015 + r() * 0.03})`; g.beginPath(); g.moveTo(x + .5, 0); g.lineTo(x + .5, H); g.stroke(); }
    // Oil brush texture: tens of thousands of faint short strokes (half light/dark, noise-driven directions) make flat areas look brushed
    g.lineCap = 'round';
    for (let k = 0; k < 9000; k++) { const x = r() * W, y = r() * H, a = r() * Math.PI, L = 10 + r() * 16;
      g.strokeStyle = r() < 0.5 ? 'rgba(255,235,200,.022)' : 'rgba(20,10,0,.028)'; g.lineWidth = 5 + r() * 5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
    // Craquelure: dark lines + 1px lower-right light edge (lifting paint)
    g.globalAlpha = 0.32; g.drawImage(P.craquelure('ren', 0.55), 0, 0);
    g.globalAlpha = 0.16; g.globalCompositeOperation = 'lighter'; g.filter = 'brightness(0) invert(1)'; g.drawImage(P.craquelure('ren', 0.55), 1, 1); g.filter = 'none';
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  });

  // ---------- Animation: ornithopter, birds, river light, dust ----------
  function ornithopter(c, lt, t) {
    // Leonardo ornithopter: red-clad pilot prone on wood frame, two flapping bat wings (leading beam + radial ribs + scalloped rear membrane), fan-shaped tail rudder
    const q = clamp(lt / 1.3), x = lerp(440, 790, q), y = 226 + Math.sin(lt * 5) * 14 - q * 24, flap = Math.sin(t * 12);
    c.save(); c.clip(INNER); c.translate(x, y); c.rotate(-0.08 + Math.sin(lt * 5 + 1) * 0.07); c.scale(1.6, 1.6);              // Scale 1.6 for clear window visibility
    const wing = (sc, dark, ph) => {
      const up = 0.5 + 0.5 * Math.sin(t * 12 + ph);                 // 0=wing down, 1=wing up
      const tip = [-26 * sc, (-118 * up + 24 * (1 - up)) * sc];
      const back = [-128 * sc, (-30 * up + 18) * sc];
      const ribs = 5, ends = [];
      for (let k = 0; k <= ribs; k++) { const u = k / ribs; ends.push([lerp(tip[0], back[0], u) - Math.sin(u * Math.PI) * 26 * sc, lerp(tip[1], back[1], u) - Math.sin(u * Math.PI) * 8 * sc * (up - 0.3)]); }
      c.fillStyle = dark ? 'rgba(150,118,80,.92)' : 'rgba(214,188,140,.95)';
      c.beginPath(); c.moveTo(0, 0); c.lineTo(...ends[0]);
      for (let k = 1; k <= ribs; k++) { const a = ends[k - 1], b = ends[k], m = [(a[0] + b[0]) / 2 + 6 * sc, (a[1] + b[1]) / 2 + 9 * sc]; c.quadraticCurveTo(m[0], m[1], b[0], b[1]); }
      c.lineTo(-30 * sc, 6 * sc); c.closePath(); c.fill();
      c.strokeStyle = '#4e321a'; c.lineWidth = 1.6; c.stroke();
      c.lineWidth = 2.2; ends.forEach((e, k) => { c.beginPath(); c.moveTo(-4, 0); c.lineTo(e[0], e[1]); c.lineWidth = k ? 1.4 : 3; c.stroke(); });
    };
    wing(0.78, true, 0.5);                       // Far wing: smaller, darker, slightly offset phase
    c.strokeStyle = '#4e321a'; c.lineWidth = 3.5; c.beginPath(); c.moveTo(40, 8); c.lineTo(-80, 12); c.stroke();
    c.lineWidth = 2; c.beginPath(); c.moveTo(-10, 10); c.lineTo(-30, 30); c.lineTo(10, 30); c.closePath(); c.stroke();
    // Tail rudder
    c.fillStyle = 'rgba(214,188,140,.95)'; c.beginPath(); c.moveTo(-78, 12); c.lineTo(-118, -6 + Math.sin(t * 6) * 4); c.quadraticCurveTo(-112, 12, -116, 32 + Math.sin(t * 6) * 4); c.closePath(); c.fill(); c.strokeStyle = '#4e321a'; c.lineWidth = 1.6; c.stroke();
    // Pilot
    c.fillStyle = '#a02a1e'; c.beginPath(); c.ellipse(6, 14, 30, 6.5, 0.03, 0, 7); c.fill();
    c.fillStyle = '#d8b090'; c.beginPath(); c.arc(38, 11, 6, 0, 7); c.fill();
    c.strokeStyle = '#a02a1e'; c.lineWidth = 3.5; c.beginPath(); c.moveTo(-22, 15); c.lineTo(-40, 18 + flap * 4); c.stroke();
    wing(1.0, false, 0);
    c.restore();
  }
  function birds(c, lt, t) {
    c.save(); c.clip(INNER); c.strokeStyle = 'rgba(50,40,30,.85)'; c.lineWidth = 1.8; c.lineCap = 'round';
    const r = R_(9);
    for (let k = 0; k < 14; k++) { const x0 = 520 + r() * 300, y0 = 180 + r() * 120, s = 1.0 + r() * 0.8, sp = 30 + r() * 40, ph = r() * 7;
      const x = x0 - lt * sp, y = y0 + Math.sin(lt * 3 + ph) * 4, f = Math.sin(t * 11 + ph) * 5 * s;
      c.beginPath(); c.moveTo(x - 7 * s, y - f); c.quadraticCurveTo(x - 3 * s, y - 2, x, y + 1); c.quadraticCurveTo(x + 3 * s, y - 2, x + 7 * s, y - f); c.stroke(); }
    c.restore();
  }
  function riverGlints(c, t) {
    // Cloud shadows: faint dark ovals cross valley left-to-right (sunlight fluctuates)
    c.save(); c.clip(INNER); for (let k = 0; k < 3; k++) { const x = 360 + ((t * 70 + k * 190) % 560), y = 400 + k * 45; const g = c.createRadialGradient(x, y, 5, x, y, 90); g.addColorStop(0, 'rgba(30,40,40,.28)'); g.addColorStop(1, 'rgba(30,40,40,0)'); c.fillStyle = g; c.save(); c.translate(x, y); c.scale(1, 0.35); c.translate(-x, -y); c.beginPath(); c.arc(x, y, 90, 0, 7); c.fill(); c.restore(); } c.restore();
    c.save(); c.clip(INNER); c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 24; k++) { const u = ((t * 0.22 + k / 24) % 1) * (RIVER.length - 1), i = Math.floor(u), f = u - i, a = RIVER[i], b = RIVER[i + 1];
      const x = lerp(a[0], b[0], f), y = lerp(a[1], b[1], f), tw = Math.max(0, Math.sin(t * 9 + k * 2.3));
      c.fillStyle = `rgba(255,255,245,${0.6 * tw})`; c.beginPath(); c.ellipse(x, y, 2 + i * 0.5, 1.2, 0, 0, 7); c.fill(); }
    c.restore();
  }
  // Light shaft (window→floor) + floating dust
  const BEAM = poly([[440, 330], [790, 360], [1000, 1080], [400, 1080]]);
  const BEAMC = () => P.cached('ren_beam', W, H, (g) => {          // Compute beam once: large blur softens both edges
    const bg = g.createLinearGradient(560, 300, 700, 1080); bg.addColorStop(0, 'rgba(255,225,170,.0)'); bg.addColorStop(0.3, 'rgba(255,225,170,.13)'); bg.addColorStop(1, 'rgba(255,225,170,.07)');
    g.filter = 'blur(28px)'; g.fillStyle = bg; g.fill(BEAM); g.filter = 'none';
  });
  function beamAndDust(c, lt, t) {
    c.save(); c.globalCompositeOperation = 'screen';
    c.globalAlpha = 0.75 + 0.35 * Math.sin(t * 2.3); c.drawImage(BEAMC(), 0, 0); c.globalAlpha = 1;      // Passing clouds vary beam strength
    const ps = P.particles(70, 17, t, { x0: 440, x1: 880, y0: 1000, y1: 430, speed: 60, drift: 18, life: 6 });
    for (const p of ps) { const tw = 0.5 + 0.5 * Math.sin(t * 6 + p.i * 1.7), a = 0.9 * tw * Math.sin(p.q * Math.PI);
      const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, 4 * p.s + 1); g.addColorStop(0, `rgba(255,240,200,${a})`); g.addColorStop(1, 'rgba(255,240,200,0)'); c.fillStyle = g; c.fillRect(p.x - 6, p.y - 6, 12, 12); }
    c.restore();
  }

  // ---------- Characters ----------
  const SK = '#e6bf9c', SK_D = '#b88866', HAIR = '#c49a4e', HAIR_L = '#e8c87e', HAIR_D = '#6e4a1c';
  const VEL = '#2c4628', VEL_L = '#6e8c56', RED = '#7c1818', RED_L = '#b8302a', RED_D = '#3e0808', GOLD = '#c9a24a';
  // Light bands along bones within path: velvet highlights sit on fold ridges, brightest parts nearly white
  const sheen = (c, path, A, B, col, w) => { c.save(); c.clip(path); c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(...A); c.lineTo(...B); c.stroke(); c.restore(); };
  function girl(c, G, lt, t, ch) {
    const A = G.A;
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    // Long rear hair: center part, waves to waist
    const nape = A.nape, sw = Math.sin(t * 3) * 11;
    const hair = RIG.smooth([[nape[0] - 40, nape[1] - 120], [nape[0] + 40, nape[1] - 110], [nape[0] + 66, nape[1] - 40], [nape[0] + 74, nape[1] + 30], [nape[0] + 92 + sw, nape[1] + 80], [nape[0] + 82 + sw, nape[1] + 130], [nape[0] + 98 + sw, nape[1] + 180], [nape[0] + 84 + sw, nape[1] + 228],
      [nape[0] + 58 + sw, nape[1] + 236], [nape[0] + 36, nape[1] + 170], [nape[0] + 20, nape[1] + 90], [nape[0] - 10, nape[1] + 30], [nape[0] - 40, nape[1] - 20]]);
    const hg = c.createLinearGradient(nape[0], nape[1] - 100, nape[0] + 80, nape[1] + 220); hg.addColorStop(0, HAIR_L); hg.addColorStop(0.5, HAIR); hg.addColorStop(1, HAIR_D);
    c.fillStyle = hg; c.fill(hair);
    c.save(); c.clip(hair); c.lineWidth = 3;
    for (let k = 0; k < 9; k++) { c.strokeStyle = k % 2 ? 'rgba(255,226,150,.7)' : 'rgba(80,50,14,.65)'; c.beginPath(); for (let s = 0; s <= 24; s++) { const q = s / 24, x = nape[0] - 20 + k * 11 + q * 50 + Math.sin(q * 11 + k) * 7, y = nape[1] - 110 + q * 340; s ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    c.restore();
    // Far sleeve and hand
    c.fillStyle = VEL; c.fill(G.farSleeve); c.fillStyle = GOLD; c.fill(G.farCuff); c.fillStyle = SK; c.fill(G.farHand);
    // Red velvet dress: base + fold highlights + dark troughs
    const sg = c.createLinearGradient(1100, 600, 1450, 940); sg.addColorStop(0, RED_L); sg.addColorStop(0.5, RED); sg.addColorStop(1, RED_D);
    c.fillStyle = sg; c.fill(G.skirt);
    c.save(); c.clip(G.skirt);
    const folds = [[1150, 700, 1120, 925, 22], [1200, 680, 1180, 930, 26], [1250, 660, 1250, 932, 20], [1300, 660, 1310, 930, 18], [1360, 700, 1380, 920, 16]];
    folds.forEach(([x0, y0, x1, y1, w], k) => { c.strokeStyle = 'rgba(200,70,60,.3)'; c.lineWidth = w; c.beginPath(); c.moveTo(x0 - 6, y0 + 60); c.quadraticCurveTo((x0 + x1) / 2 - 10, (y0 + y1) / 2, x1, y1); c.stroke();
      c.strokeStyle = 'rgba(40,0,0,.45)'; c.lineWidth = w * 0.7; c.beginPath(); c.moveTo(x0 + 26, y0 + 10); c.quadraticCurveTo((x0 + x1) / 2 + 18, (y0 + y1) / 2, x1 + 26, y1); c.stroke(); });
    c.strokeStyle = GOLD; c.lineWidth = 5; c.beginPath(); c.moveTo(1100, 922); c.quadraticCurveTo(1230, 940, 1360, 922); c.stroke();
    c.restore();
    c.fillStyle = '#2a1608'; c.fill(G.shoe);
    // Red bodice, square neckline with gold trim
    const tg = c.createLinearGradient(1280, 430, 1420, 620); tg.addColorStop(0, RED_L); tg.addColorStop(1, RED_D); c.fillStyle = tg; c.fill(G.torso);
    sheen(c, G.torso, [1300, 470], [1300, 600], 'rgba(230,100,80,.35)', 18);
    c.fillStyle = SK; c.fill(G.neck);
    c.strokeStyle = GOLD; c.lineWidth = 5; c.beginPath(); c.moveTo(A.neck[0] - 16, A.neck[1] + 4); c.lineTo(A.neck[0] - 6, A.neck[1] + 34); c.lineTo(A.neck[0] + 34, A.neck[1] + 30); c.lineTo(A.neck[0] + 36, A.neck[1] + 2); c.stroke();
    c.fillStyle = '#7a1414'; c.beginPath(); c.arc(A.neck[0] + 4, A.neck[1] + 24, 4, 0, 7); c.fill();     // Small pendant
    // Crown hair + face
    c.fillStyle = HAIR; c.fill(G.hairBack);
    const fg = c.createLinearGradient(G.A.forehead[0] - 10, 0, G.A.ear[0] + 10, 0); fg.addColorStop(0, '#f0d0b0'); fg.addColorStop(0.6, SK); fg.addColorStop(1, SK_D);
    c.fillStyle = fg; c.fill(G.face);
    c.save(); c.clip(G.face); c.fillStyle = 'rgba(220,120,100,.28)'; c.beginPath(); c.arc(G.cheek[0] - 2, G.cheek[1], 18, 0, 7); c.fill();
    c.fillStyle = 'rgba(120,70,40,.22)'; c.beginPath(); c.ellipse(G.eye.x + 8, G.eye.y + 2, 14, 9, 0, 0, 7); c.fill(); c.restore();      // Eye-socket sfumato shadow
    c.fillStyle = SK_D; c.beginPath(); c.ellipse(G.ear[0], G.ear[1], 7, 11, 0.2, 0, 7); c.fill();
    // Center-part bangs: two sections swept back from part
    c.fillStyle = HAIR; c.fill(G.bangs);
    c.save(); c.clip(G.bangs); c.strokeStyle = 'rgba(250,225,160,.6)'; c.lineWidth = 2.5; G.hairLines.forEach(h => c.stroke(h)); c.restore();
    c.strokeStyle = HAIR_D; c.lineWidth = 2; G.hairLines.forEach(h => c.stroke(h));
    G.locks.forEach(h => { c.strokeStyle = HAIR_D; c.lineWidth = 8; c.stroke(h); c.strokeStyle = HAIR; c.lineWidth = 5; c.stroke(h); });
    // Pearl forehead chain
    const f0 = A.forehead, e0 = A.ear; for (let k = 0; k <= 12; k++) { const q = k / 12, x = lerp(f0[0] + 6, e0[0] + 4, q), y = lerp(f0[1] + 4, e0[1] - 28, q) - Math.sin(q * Math.PI) * 10; c.fillStyle = '#f4ecd8'; c.beginPath(); c.arc(x, y, 2.6, 0, 7); c.fill(); c.fillStyle = 'rgba(120,100,80,.6)'; c.beginPath(); c.arc(x + .8, y + .8, 1, 0, 7); c.fill(); }
    // Features: eyes closed while sipping
    const closed = ch.blink || ch.cup > 0.7;
    c.strokeStyle = '#4a2a18'; c.lineWidth = 2.2;
    if (closed) { c.beginPath(); c.arc(G.eye.x + 1, G.eye.y - 3, 7, 0.35, Math.PI - 0.5); c.stroke(); c.lineWidth = 1.4; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(G.eye.x - 4 + k * 4, G.eye.y + 3); c.lineTo(G.eye.x - 6 + k * 4, G.eye.y + 7); c.stroke(); } }
    else { c.fillStyle = '#f2e6d8'; c.beginPath(); c.ellipse(G.eye.x, G.eye.y, 7.5, 4.2, 0, 0, 7); c.fill(); c.fillStyle = '#4a3420'; c.beginPath(); c.arc(G.eye.x - 2.5, G.eye.y + 0.5, 3.2, 0, 7); c.fill(); c.stroke(G.lid); }
    c.strokeStyle = 'rgba(120,80,40,.7)'; c.lineWidth = 1.8; c.stroke(G.brow);
    c.fillStyle = '#a8423a'; c.beginPath(); c.moveTo(...G.lips[0]); c.lineTo(...G.lips[1]); c.lineTo(...G.lips[2]); c.closePath(); c.fill();
    // Near arm: green velvet sleeve with lengthwise highlight + gold shoulder lines/pearls + gold cuff
    for (const [p, a, b] of [[G.upperArm, A.shoulder, A.elbow], [G.foreArm, A.elbow, A.hand]]) {
      const ag = c.createLinearGradient(a[0] - 30, a[1] - 30, a[0] + 30, a[1] + 30); ag.addColorStop(0, VEL_L); ag.addColorStop(1, VEL); c.fillStyle = ag; c.fill(p);
      sheen(c, p, [lerp(a[0], b[0], 0.1) - 4, lerp(a[1], b[1], 0.1) - 6], [lerp(a[0], b[0], 0.85) - 4, lerp(a[1], b[1], 0.85) - 6], 'rgba(170,200,140,.45)', 10);
    }
    for (let k = 0; k < 4; k++) { const q = k / 3; c.fillStyle = '#f4ecd8'; c.beginPath(); c.arc(lerp(A.shoulder[0] - 22, A.shoulder[0] + 24, q), lerp(A.shoulder[1] - 8, A.shoulder[1] + 10, q), 3.4, 0, 7); c.fill(); }
    c.fillStyle = GOLD; c.fill(G.cuff);
    c.fillStyle = SK; c.fill(G.hand);
    goblet(c, G.cup);
    c.fillStyle = SK; c.beginPath(); c.arc(G.thumb[0], G.thumb[1], 6.5, 0, 7); c.fill();
    c.restore();
  }
  function goblet(c, cup) {           // Silver goblet, red wine
    c.save(); c.translate(cup.x, cup.y); c.rotate(cup.tilt || 0);
    const sg = c.createLinearGradient(-24, 0, 24, 0); sg.addColorStop(0, '#6c6c70'); sg.addColorStop(0.3, '#f4f4f0'); sg.addColorStop(0.55, '#b4b4b6'); sg.addColorStop(1, '#4a4a50');
    c.fillStyle = sg; c.beginPath(); c.moveTo(-23, 0); c.bezierCurveTo(-23, 22, -8, 32, 0, 32); c.bezierCurveTo(8, 32, 23, 22, 23, 0); c.closePath(); c.fill();
    c.fillRect(-3, 30, 6, 24); c.beginPath(); c.ellipse(0, 42, 6, 3.5, 0, 0, 7); c.fill();
    c.beginPath(); c.ellipse(0, 56, 17, 4.5, 0, 0, 7); c.fill();
    c.fillStyle = '#5a0c14'; c.beginPath(); c.ellipse(0, 1, 21, 5, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(-15, 6, 3, 14);
    c.restore();
  }
  function cat(c, K, t, ch) {
    const OR = '#d88a3e', OR_D = '#9a5520', OR_L = '#f2b46a', WH = '#f4ece0';
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    // Ground shadow
    c.fillStyle = 'rgba(20,10,4,.45)'; c.beginPath(); c.ellipse(545, 905, 150, 18, 0, 0, 7); c.fill();
    // Orange tail, rings, white tip
    c.strokeStyle = OR; c.lineWidth = K.tailW; c.stroke(K.tail);
    const tp = K.tailPts; c.strokeStyle = OR_D; c.lineWidth = 5; for (let i = 2; i < tp.length - 2; i += 3) { const a = Math.atan2(tp[i + 1][1] - tp[i][1], tp[i + 1][0] - tp[i][0]) + Math.PI / 2; c.beginPath(); c.moveTo(tp[i][0] - Math.cos(a) * 11, tp[i][1] - Math.sin(a) * 11); c.lineTo(tp[i][0] + Math.cos(a) * 11, tp[i][1] + Math.sin(a) * 11); c.stroke(); }
    const tip = tp[tp.length - 1]; c.fillStyle = WH; c.beginPath(); c.arc(tip[0], tip[1], K.tailW / 2, 0, 7); c.fill();
    // Body: radial volume
    const body = RIG.smooth(K.bodyPts);
    // White chest/belly base → orange back fur blended by broad radial gradients, no hard boundary
    const bg = c.createLinearGradient(430, 0, 660, 0); bg.addColorStop(0, '#e8dccb'); bg.addColorStop(0.55, WH); bg.addColorStop(1, '#a89478');
    c.fillStyle = bg; c.fill(body);
    c.save(); c.clip(body);
    const coat = c.createRadialGradient(455, 760, 30, 470, 770, 170); coat.addColorStop(0, OR); coat.addColorStop(0.55, 'rgba(216,138,62,.92)'); coat.addColorStop(1, 'rgba(216,138,62,0)');
    c.fillStyle = coat; c.fillRect(380, 640, 300, 280);
    const coat2 = c.createRadialGradient(520, 690, 10, 520, 690, 90); coat2.addColorStop(0, OR); coat2.addColorStop(1, 'rgba(216,138,62,0)'); c.fillStyle = coat2; c.fillRect(420, 600, 200, 200);
    // Tabby stripes: orange fur only, soft edges
    c.strokeStyle = 'rgba(150,75,20,.38)';
    for (let k = 0; k < 7; k++) { const y = 706 + k * 27 + Math.sin(k * 2.7) * 6; c.lineWidth = 5 + (k % 3) * 2; c.beginPath(); c.moveTo(420, y + 14); c.quadraticCurveTo(450 + k * 3, y - 10, 488 + (k % 2) * 20, y + 16 - k); c.stroke(); }
    // Belly-side shadow
    const sh = c.createLinearGradient(0, 760, 0, 905); sh.addColorStop(0, 'rgba(80,40,10,0)'); sh.addColorStop(1, 'rgba(80,40,10,.35)'); c.fillStyle = sh; c.fillRect(400, 760, 280, 150);
    // Fur: short strokes (light on lit side, dark on shaded side)
    const r = R_(3);
    for (let k = 0; k < 420; k++) { const x = 425 + r() * 240, y = 670 + r() * 230, a = Math.PI / 2 + (x - 540) * 0.004 + (r() - .5) * 0.5, L = 6 + r() * 8;
      c.strokeStyle = r() < 0.5 ? 'rgba(255,220,170,.45)' : 'rgba(110,55,15,.35)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); c.stroke(); }
    c.strokeStyle = 'rgba(90,50,15,.22)'; c.lineWidth = 14; c.stroke(body);           // Slightly darken inside contour for volume (too strong looks like glass casing)
    c.restore();
    K.legs.forEach(l => { const lg = c.createLinearGradient(570, 0, 650, 0); lg.addColorStop(0, '#fbf6ec'); lg.addColorStop(1, '#c8bcaa'); c.fillStyle = lg; c.fill(l); });
    c.fillStyle = 'rgba(120,90,60,.25)'; K.legs.forEach(l => { c.save(); c.clip(l); c.fillRect(600, 740, 60, 160); c.restore(); });
    for (const x of [585, 635]) { const pg = c.createRadialGradient(x - 4, 886, 2, x, 890, 22); pg.addColorStop(0, '#fffaf0'); pg.addColorStop(1, '#cfc2ae'); c.fillStyle = pg; c.beginPath(); c.ellipse(x, 892, 21, 12, 0, 0, 7); c.fill(); }
    // Head rubs side-to-side around neck (contented squint), 0.1rad amplitude
    const pv = [K.headC[0] - 10, K.headC[1] + 58]; c.save(); c.translate(...pv); c.rotate(0.16 * Math.sin(t * 3.4) + 0.05 * Math.sin(t * 8.1)); c.translate(-pv[0], -pv[1]);
    const hc = K.headC, hg = c.createRadialGradient(hc[0] - 10, hc[1] - 20, 8, hc[0], hc[1], 80); hg.addColorStop(0, OR_L); hg.addColorStop(0.6, OR); hg.addColorStop(1, OR_D);
    c.fillStyle = hg; c.fill(K.head);
    c.fillStyle = 'rgba(230,150,140,.8)'; K.earInner.forEach(e => { c.beginPath(); e.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.fill(); });
    c.save(); c.clip(K.head);
    c.strokeStyle = 'rgba(140,70,20,.6)'; c.lineWidth = 6; K.stripes.slice(0, 3).forEach(s => { c.beginPath(); c.moveTo(...s[0]); c.lineTo(...s[1]); c.stroke(); });
    const mg = c.createRadialGradient(K.nose[0] - 20, K.nose[1] + 10, 4, K.nose[0] - 20, K.nose[1] + 10, 46); mg.addColorStop(0, WH); mg.addColorStop(0.7, 'rgba(244,236,224,.9)'); mg.addColorStop(1, 'rgba(244,236,224,0)');
    c.fillStyle = mg; c.beginPath(); c.arc(K.nose[0] - 20, K.nose[1] + 10, 46, 0, 7); c.fill();
    c.strokeStyle = 'rgba(80,35,8,.4)'; c.lineWidth = 18; c.stroke(K.head);
    c.restore();
    // Squinting smile
    c.strokeStyle = '#3a2210'; c.lineWidth = 3;
    const sq = 0.5 + 0.5 * Math.sin(t * 4.5);                 // Alternate tighter/looser squint
    K.eyes.forEach(e => { c.beginPath(); c.arc(e.x, e.y + 4 + sq * 2, 9, Math.PI * (1.15 + sq * 0.08), Math.PI * (1.85 - sq * 0.08)); c.stroke(); });
    c.fillStyle = '#d07a70'; c.beginPath(); c.moveTo(K.nose[0] - 5, K.nose[1] - 3); c.lineTo(K.nose[0] + 5, K.nose[1] - 3); c.lineTo(K.nose[0], K.nose[1] + 3); c.closePath(); c.fill();
    c.strokeStyle = '#4a2a18'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(K.nose[0], K.nose[1] + 3); c.lineTo(K.nose[0], K.nose[1] + 8);
    c.moveTo(K.nose[0] - 12, K.nose[1] + 8); c.quadraticCurveTo(K.nose[0] - 6, K.nose[1] + 15, K.nose[0], K.nose[1] + 8); c.quadraticCurveTo(K.nose[0] + 6, K.nose[1] + 15, K.nose[0] + 12, K.nose[1] + 7); c.stroke();
    c.strokeStyle = 'rgba(250,245,235,.85)'; c.lineWidth = 1.3; K.whiskers.forEach(w => { c.beginPath(); c.moveTo(...w[0]); c.lineTo(...w[1]); c.stroke(); });
    c.restore();
    c.restore();
  }

  return {
    init() { STATIC(); OVER(); },
    draw(c, lt, t) {
      const ch = P.choreo(lt, t);
      c.drawImage(STATIC(), 0, 0);
      riverGlints(c, t); birds(c, lt, t); ornithopter(c, lt, t);
      // Characters: offscreen → blurred + sharp layers = sfumato
      const L = P.scratch('renChars'), g = L.getContext('2d'); g.clearRect(320, 180, 1200, 780);
      const K = RIG.cat({ tail: ch.tail * 2.2 + Math.sin(t * 2.6) * 0.35, blink: 0, breathe: ch.breathe * 3, look: Math.sin(t * 2.5) * 1.6 });
      const G = RIG.girl({ cup: ch.cup, sip: ch.sip * 1.6, hair: 'long', breathe: ch.breathe * 2.5 });
      g.fillStyle = 'rgba(15,8,4,.35)'; g.beginPath(); g.ellipse(1240, 935, 170, 16, 0, 0, 7); g.fill();
      cat(g, K, t, ch); girl(g, G, lt, t, ch);
      c.filter = 'blur(1.6px)'; c.drawImage(L, 320, 180, 1200, 780, 320, 180, 1200, 780); c.filter = 'none';
      c.globalAlpha = 0.82; c.drawImage(L, 320, 180, 1200, 780, 320, 180, 1200, 780); c.globalAlpha = 1;
      beamAndDust(c, lt, t);
      c.drawImage(OVER(), 0, 0);
    },
  };
})();
