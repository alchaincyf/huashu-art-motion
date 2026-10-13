// Shared SpaceX geometry: rockets, spacecraft and launch towers (no official logos or lettering).
// Coordinates: meters, origin at engine-plane center, upward is -y. Callers translate/rotate/scale(px/m).
// Each function returns { parts:[{k, p:Path2D}], h (total height m), w (maximum width m), a:{anchors} }.
//   k: 'body' main body (white paint/stainless steel), 'dark' dark parts (interstage, grid fins, landing legs, engines), 'nose' nose cone/fairing,
//      'window' windows, 'trunk' Dragon trunk, 'flap' Starship flaps, 'engine' engine nozzles.
// Scenes choose rendering style: RK.fill(c, shape, palette) is basic flat fill; each style can render parts itself.
// Approximate real proportions: Falcon 1 21×1.7m; Falcon 9 70×3.7m; Falcon Heavy three cores; full Starship ~123×9m (booster 71m + ship 52m).
window.RK = (() => {
  const rect = (p, x, y, w, h) => p.rect(x, y, w, h);
  const P2 = () => new Path2D();
  const poly = (pts) => { const p = P2(); pts.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); p.closePath(); return p; };
  // Ogive nose cone: base width w, height h, base y0.
  const ogive = (w, h, y0, n = 18) => { const pts = []; for (let i = 0; i <= n; i++) { const u = i / n; pts.push([-w / 2 * Math.sqrt(1 - u * u) * (1 - 0.15 * u), y0 - h * u]); }
    for (let i = n; i >= 0; i--) { const u = i / n; pts.push([w / 2 * Math.sqrt(1 - u * u) * (1 - 0.15 * u), y0 - h * u]); } return poly(pts); };
  const bell = (x, y, w, h) => poly([[x - w * 0.28, y - h], [x + w * 0.28, y - h], [x + w / 2, y], [x - w / 2, y]]);

  // Falcon 1: slender first stage + second stage + small fairing (2006–2008).
  function falcon1() {
    const D = 1.7, parts = [];
    const body = P2(); rect(body, -D / 2, -15.5, D, 15.5); rect(body, -D / 2 * 0.95, -19.5, D * 0.95, 3.6); parts.push({ k: 'body', p: body });
    const dark = P2(); rect(dark, -D / 2, -16.1, D, 0.6); rect(dark, -D / 2, -1.2, D, 1.2); parts.push({ k: 'dark', p: dark });
    parts.push({ k: 'nose', p: ogive(D * 0.95, 3.2, -19.5) });
    parts.push({ k: 'engine', p: bell(0, 0.9, 1.2, 0.9) });
    return { parts, h: 22.7, w: D, a: { top: [0, -22.7], base: [0, 0.9] } };
  }

  // Falcon 9: opts.payload = 'fairing' | 'dragon' | 'none'; opts.legs 0..1 landing-leg deployment; opts.fins 0..1 grid-fin deployment; opts.stage = 'full' | 'booster'.
  function falcon9(o = {}) {
    const D = 3.7, parts = [], legs = o.legs ?? 0, fins = o.fins ?? 0, booster = o.stage === 'booster';
    const H1 = 41;                          // First stage (including interstage).
    const body = P2(); rect(body, -D / 2, -H1, D, H1);
    if (!booster) rect(body, -D / 2, -H1 - 13, D, 13);
    parts.push({ k: 'body', p: body });
    const dark = P2();
    rect(dark, -D / 2, -H1, D, 4.2);         // Black interstage.
    rect(dark, -D / 2, -1.4, D, 1.4);        // Bottom engine housing.
    parts.push({ k: 'dark', p: dark });
    // Grid fins (four at the top, two in side view): swing outward when deployed.
    const gf = P2(), fy = -H1 + 0.6, fl = 1.0 + fins * 0.9;
    rect(gf, -D / 2 - fl, fy, fl, 1.4); rect(gf, D / 2, fy, fl, 1.4); parts.push({ k: 'dark', p: gf });
    // Landing legs: hinged at the base, stowed upward against the body, deployed outward/downward; feet sit just below the engine plane (y≈+1.3 at legs=1).
    const lg = P2(), L = 9.5, ang = legs * 1.82;
    for (const s of [-1, 1]) { const x0 = s * D / 2, y0 = -1.2, x1 = x0 + s * Math.sin(ang) * L, y1 = y0 - Math.cos(ang) * L;
      lg.moveTo(x0, y0); lg.lineTo(x0, y0 - 0.6); lg.lineTo(x1 + s * 0.15, y1 - 0.2); lg.lineTo(x1 + s * 0.45, y1 + 0.3); lg.lineTo(x1 - s * 0.35, y1 + 0.3); lg.closePath(); }
    parts.push({ k: 'dark', p: lg });
    parts.push({ k: 'engine', p: bell(0, 1.0, 2.6, 1.0) });
    let h = H1;
    if (!booster) {
      if (o.payload === 'dragon') { const dr = dragon({ trunk: true }); dr.parts.forEach(q => { const p = P2(); p.addPath(q.p, new DOMMatrix().translate(0, -H1 - 13)); parts.push({ k: q.k, p }); }); h = H1 + 13 + dr.h; }
      else if (o.payload !== 'none') { const f = P2(); rect(f, -2.6, -H1 - 13 - 6.5, 5.2, 6.5); parts.push({ k: 'nose', p: f }); parts.push({ k: 'nose', p: ogive(5.2, 6.5, -H1 - 13 - 6.5) }); h = H1 + 26; }
      else h = H1 + 13;
    }
    return { parts, h, w: D, a: { top: [0, -h], base: [0, 1.0], interstage: [0, -H1], legs: [0, -9.5] } };
  }

  // Dragon (Crew Dragon shape: truncated-cone capsule + trunk), base at y=0.
  function dragon(o = {}) {
    const parts = [], tr = o.trunk !== false, y0 = tr ? -2.8 : 0;
    if (tr) { const t = P2(); rect(t, -1.85, -2.8, 3.7, 2.8); parts.push({ k: 'trunk', p: t }); }
    parts.push({ k: 'body', p: poly([[-1.95, y0], [1.95, y0], [1.25, y0 - 3.6], [-1.25, y0 - 3.6]]) });
    const nose = P2(); nose.ellipse(0, y0 - 3.6, 1.25, 0.75, 0, Math.PI, 0); parts.push({ k: 'nose', p: nose });
    const win = P2(); for (const x of [-0.75, 0.75]) { win.moveTo(x + 0.28, y0 - 2.0); win.ellipse(x, y0 - 2.0, 0.28, 0.32, 0, 0, Math.PI * 2); } parts.push({ k: 'window', p: win });
    const h = (tr ? 2.8 : 0) + 4.35;
    return { parts, h, w: 3.9, a: { top: [0, -h], port: [0, -h] } };
  }

  // Falcon Heavy: three first stages side by side + center-core second stage + fairing; same opts as falcon9.
  function heavy(o = {}) {
    const parts = [], D = 3.7, gap = 0.35;
    const c = falcon9({ ...o, payload: o.payload || 'fairing' });
    c.parts.forEach(q => parts.push(q));
    for (const s of [-1, 1]) {
      const sb = falcon9({ ...o, stage: 'booster' });
      const m = new DOMMatrix().translate(s * (D + gap), 0);
      sb.parts.forEach(q => { const p = P2(); p.addPath(q.p, m); parts.push({ k: q.k, p }); });
      const cone = P2(); cone.addPath(ogive(D, 4.5, -41), m); parts.push({ k: 'nose', p: cone });
    }
    return { parts, h: c.h, w: 3 * D + 2 * gap, a: { top: [0, -c.h], base: [0, 1.0] } };
  }

  // Super Heavy booster: 9m stainless-steel body, hot-staging ring and four grid fins (two in side view).
  function superHeavy(o = {}) {
    const D = 9, H = 71, parts = [];
    const b = P2(); rect(b, -D / 2, -H, D, H); parts.push({ k: 'body', p: b });
    const d = P2(); rect(d, -D / 2, -H, D, 1.8); for (let i = 0; i < 6; i++) rect(d, -D / 2 + 0.6 + i * 1.35, -H + 0.3, 0.7, 1.2);   // Hot-staging ring (open lattice).
    rect(d, -D / 2 - 2.6 * (o.fins ?? 1), -H + 3.5, 2.6 * (o.fins ?? 1), 2.2); rect(d, D / 2, -H + 3.5, 2.6 * (o.fins ?? 1), 2.2);   // Grid fins.
    parts.push({ k: 'dark', p: d });
    // Catch pins (where the chopsticks catch it), below the grid fins on both sides.
    const pin = P2(); rect(pin, -D / 2 - 0.9, -H + 7.2, 0.9, 0.8); rect(pin, D / 2, -H + 7.2, 0.9, 0.8); parts.push({ k: 'dark', p: pin });
    const eng = P2(); for (let i = -3; i <= 3; i++) { eng.addPath(bell(i * 1.2, 1.2, 1.1, 1.2)); } parts.push({ k: 'engine', p: eng });
    return { parts, h: H, w: D, a: { top: [0, -H], base: [0, 1.2], pins: [0, -H + 7.6] } };
  }

  // Starship Ship: stainless-steel cylinder + ogive nose + forward/aft flap pairs (two of each in side view).
  function ship(o = {}) {
    const D = 9, H = 52, Hc = 36, parts = [], fl = o.flap ?? 0;   // flap: flap angle (radians, ±0.6).
    const b = P2(); rect(b, -D / 2, -Hc, D, Hc); parts.push({ k: 'body', p: b });
    parts.push({ k: 'nose', p: ogive(D, H - Hc, -Hc) });
    const f = P2();
    for (const s of [-1, 1]) {
      const fx = s * D / 2;   // Aft flaps (large).
      const aft = [[fx, -2], [fx + s * 3.2, -1 + Math.sin(fl) * 2], [fx + s * 3.2, -9 + Math.sin(fl) * 2], [fx, -11]];
      f.addPath(poly(aft));
      const fw = [[s * D * 0.42, -Hc - 6], [s * (D * 0.42 + 2.2), -Hc - 5 + Math.sin(-fl) * 1.5], [s * (D * 0.38 + 2.0), -Hc - 11 + Math.sin(-fl) * 1.5], [s * D * 0.36, -Hc - 12]];
      f.addPath(poly(fw));
    }
    parts.push({ k: 'flap', p: f });
    const eng = P2(); for (let i = -1; i <= 1; i++) eng.addPath(bell(i * 2.4, 1.6, 2.0, 1.6)); parts.push({ k: 'engine', p: eng });
    const tiles = P2(); rect(tiles, -D / 2, -Hc, D * 0.32, Hc); parts.push({ k: 'tiles', p: tiles });   // Black heat-shield tiles on windward side (left half).
    return { parts, h: H, w: D, a: { top: [0, -H], base: [0, 1.6] } };
  }

  // Full stack: Super Heavy + Ship.
  function starship(o = {}) {
    const sh = superHeavy(o), sp = ship(o), parts = [...sh.parts];
    const m = new DOMMatrix().translate(0, -sh.h);
    sp.parts.forEach(q => { if (q.k === 'engine') return; const p = P2(); p.addPath(q.p, m); parts.push({ k: q.k, p }); });
    return { parts, h: sh.h + sp.h, w: 9, a: { top: [0, -(sh.h + sp.h)], base: [0, 1.2], stage: [0, -sh.h] } };
  }

  // Launch tower (Mechazilla): truss tower + two chopstick arms. opts.armY = arm height (m, positive upward), opts.open 0..1 opening angle.
  function tower(o = {}) {
    const H = 146, Wt = 12, parts = [], armY = o.armY ?? 70, open = o.open ?? 0;
    const t = P2(); rect(t, 0, -H, Wt, H); parts.push({ k: 'body', p: t });
    const lat = P2();                                   // Truss diagonals (thin strips filled as dark parts).
    for (let y = 0; y < H; y += 8) { lat.moveTo(0, -y); lat.lineTo(Wt, -y - 8); lat.lineTo(Wt, -y - 7.4); lat.lineTo(0.6, -y); lat.closePath(); }
    parts.push({ k: 'truss', p: lat });
    const arm = P2(), L = o.len ?? 30;                  // Two arms extend from the tower's left side (V in slight overhead view): open=0 closed, 1 open.
    for (const s of [-1, 1]) {
      const y0 = -armY, dy = s * (1.3 + open * 5.5);
      arm.moveTo(0, y0 + s * 1.3 - 1.1); arm.lineTo(-L, y0 + dy - 0.9); arm.lineTo(-L, y0 + dy + 0.9); arm.lineTo(0, y0 + s * 1.3 + 1.1); arm.closePath();
    }
    parts.push({ k: 'dark', p: arm });
    return { parts, h: H, w: Wt, a: { top: [Wt / 2, -H], armRoot: [0, -armY], armTip: [-L, -armY] } };
  }

  // Exhaust: at (x, y), downward (local +y), length len, width w; t drives deterministic flicker; pal = [outer, middle, core].
  function flame(c, x, y, len, w, t, pal = ['rgba(255,120,30,0.85)', 'rgba(255,200,80,0.95)', '#fff6d8'], seed = 0) {
    const fl = (k) => 1 + 0.08 * Math.sin(t * 37 + k + seed) + 0.05 * Math.sin(t * 61 + 2 * k + seed);
    const layer = (sc, col, k) => { const L = len * sc * fl(k), ww = w * (0.55 + 0.45 * sc);
      c.fillStyle = col; c.beginPath(); c.moveTo(x - ww / 2, y); c.quadraticCurveTo(x - ww * 0.55, y + L * 0.45, x, y + L); c.quadraticCurveTo(x + ww * 0.55, y + L * 0.45, x + ww / 2, y); c.closePath(); c.fill(); };
    layer(1, pal[0], 1); layer(0.66, pal[1], 2); layer(0.36, pal[2], 3);
  }

  // Basic flat fill: pal = {body, dark, nose, window, trunk, flap, engine, tiles, truss, line?, lw?}.
  function fill(c, shape, pal) {
    for (const q of shape.parts) { const col = pal[q.k] ?? pal.body; if (!col) continue; c.fillStyle = col; c.fill(q.p); }
    if (pal.line) { c.lineWidth = pal.lw || 0.25; c.strokeStyle = pal.line; c.lineJoin = 'round'; for (const q of shape.parts) if (q.k !== 'truss') c.stroke(q.p); }
  }
  // Placement: draw fn(c) at screen (x, y), scale px/m, rotation rot (radians, 0 = upright).
  function at(c, x, y, s, rot, fn) { c.save(); c.translate(x, y); c.rotate(rot || 0); c.scale(s, s); fn(c); c.restore(); }

  return { falcon1, falcon9, dragon, heavy, superHeavy, ship, starship, tower, flame, fill, at, ogive, poly };
})();
