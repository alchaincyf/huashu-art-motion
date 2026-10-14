// S10 · Lichtenstein-style pop comic: Starship, through the first successful booster catch.
// Style card 13_pop: Ben-Day dots = createPattern (zero cost, screen-aligned); 5px black outlines + saturated primary flat fills; yellow narration boxes; large PuHui-Black sound effects with black outlines/red shadows.
// Panels (all voiceover-driven):
//   ① Heroic low angle: stainless-steel Starship stack + rays; narration box names Starship as the largest, most powerful rocket.
//   ② Diagonal panel push for 2023 maiden flight: launch, vertical speed lines, rolling comic clouds; tumbling starts around four minutes.
//   ③ Explosion cue: hard cut to layered spiky blast + radial action lines + BOOM lettering.
//   ④ Diagonal panel push for October 2024: tower, booster descends with exhaust/speed lines; arms open on cue; inset chopsticks at upper right close in sync;
//      On catch frame: arms close + click lettering + camera jolt.
SCENES['s10'] = (() => {
  const ID = 's10', W = 1920, H = 1080, { clamp, lerp, ss, ease } = U, P = PAINT, TAU = Math.PI * 2;
  const C = { ink: '#141414', paper: '#f3eedb', blue: '#2f5cc8', blueL: '#9fc2ee', yellow: '#f7d52c', red: '#d8232a', redD: '#a8161c', white: '#fbf8ee',
    steel: '#d4d9e0', steelD: '#8c97a8', orange: '#f39a2c', wood: '#e8b56a' };
  const cue = k => TM.cue(ID, k), DUR = TM.dur(ID);
  const T_SX = cue('星舰'), T_SHI = cue('史上'), T_2023 = cue('2023年'), T_FIRE = cue('首飞'), T_4MIN = cue('四分钟左右'), T_BOOM = cue('炸'),
    T_2024 = cue('2024年10月'), T_TA = cue('发射塔'), T_SHEN = cue('伸出'), T_KZ = cue('筷子'), T_LUO = cue('落回来'), T_JZ = cue('夹住');
  const W12 = [T_2023 - 0.1, T_2023 + 0.22];       // ①→② panel push.
  const W34 = [T_2024 - 0.06, T_2024 + 0.26];       // ③→④ panel push.
  const poly = U.poly;
  const pxs = c => { const m = c.getTransform(); return Math.hypot(m.a, m.b) || 1; };
  const ink = (c, p, fill, lw = 5) => { if (fill) { c.fillStyle = fill; c.fill(p); } c.strokeStyle = C.ink; c.lineWidth = lw / pxs(c); c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(p); };
  // Ben-Day dots: pattern uses screen pixels (no enlargement in meter coordinates); screen angle ang.
  const dots = (c, key, pitch, r, col, bg, ang = 45) => { const p = P.dotPattern(c, 's10' + key, pitch, r, col, bg, ang), s = pxs(c); p.setTransform(new DOMMatrix().scale(1 / s, 1 / s).rotate(ang)); return p; };
  const fps15 = t => Math.floor(t * 15);

  // ---------- Shared comic elements ----------
  // Union outline: outline all paths in thick black, then fill all (style 13 thought-bubble technique).
  function union(c, paths, fill, lw = 10) { c.save(); c.lineJoin = 'round'; c.strokeStyle = C.ink; c.lineWidth = lw / pxs(c); paths.forEach(p => c.stroke(p)); c.fillStyle = fill; paths.forEach(p => c.fill(p)); c.restore(); }
  function puff(c, x, y, r, seed, fill = C.white) {
    const rr = U.rng(seed), ps = [];
    for (let i = 0; i < 7; i++) { const a = rr() * TAU, d = r * (0.25 + rr() * 0.5); const p = new Path2D(); p.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6, r * (0.4 + rr() * 0.3), 0, TAU); ps.push(p); }
    union(c, ps, fill, 9);
  }
  // Comic flame: jagged edge (15fps stepped jitter), red/yellow/white layers, black outline.
  function flame(c, x, y, len, w, t, seed = 0) {
    const f = fps15(t);
    const layer = (k, col) => { const L = len * k, ww = w * (0.5 + 0.5 * k), n = 9, pts = [[x - ww / 2, y]];
      for (let i = 1; i <= n; i++) { const q = i / n, j = (U.hash(f + i, seed + k * 10) - 0.5) * ww * 0.5; const side = i % 2 ? -1 : 1, prof = (1 - q) * 0.5 + 0.08;
        pts.push([x + side * ww * prof + j, y + L * q * (0.85 + 0.3 * U.hash(f, i + seed))]); }
      pts.push([x + ww / 2, y]); ink(c, poly(pts), col, 4); };
    layer(1, C.red); layer(0.68, C.yellow); layer(0.36, C.white);
  }
  // Spiky explosion box.
  function burst(c, x, y, R, n, seed, fill, t, lw = 6) {
    const f = fps15(t), p = new Path2D();
    for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU + seed, rr = i % 2 ? R * (0.55 + 0.1 * U.hash(i, seed * 7 + f)) : R * (0.85 + 0.25 * U.hash(i, seed * 3 + f)); const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; i ? p.lineTo(px, py) : p.moveTo(px, py); }
    p.closePath(); ink(c, p, fill, lw);
  }
  // Sound-effect lettering: PuHui-Black, yellow + thick black outline + red shadow, 30fps beat jitter.
  function sfx(c, text, x, y, size, t, a = 1, rot = -0.08) {
    const f = Math.floor(t * 30), jx = (U.hash(f, 1) - 0.5) * 12, jy = (U.hash(f, 2) - 0.5) * 10, jr = (U.hash(f, 3) - 0.5) * 0.05;
    c.save(); c.translate(x + jx, y + jy); c.rotate(rot + jr); c.scale(a, a); c.font = `${size}px "PuHui-Black"`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    c.fillStyle = C.ink; c.fillText(text, 12, 12);
    c.strokeStyle = C.ink; c.lineWidth = size * 0.16; c.strokeText(text, 0, 0);
    c.fillStyle = C.yellow; c.fillText(text, 0, 0);
    c.restore();
  }
  // Yellow narration box (pop-in: 1.15 → 1 rebound).
  function caption(c, lines, x, y, at, lt) {
    const q = clamp((lt - at) / 0.18); if (q <= 0) return;
    const s = 1.15 - 0.15 * ease.outBack(q);
    c.save(); c.font = `${lines[0][1]}px "PuHui-Heavy"`;
    let w = 0, h = 26; lines.forEach(([tx, sz]) => { c.font = `${sz}px "PuHui-Heavy"`; w = Math.max(w, c.measureText(tx).width); h += sz * 1.22; });
    w += 52;
    c.translate(x, y); c.scale(s, s); c.globalAlpha = Math.min(1, q * 3);
    c.fillStyle = C.ink; c.fillRect(8, 8, w, h); c.fillStyle = C.yellow; c.fillRect(0, 0, w, h); c.strokeStyle = C.ink; c.lineWidth = 5; c.strokeRect(0, 0, w, h);
    let yy = 14; c.fillStyle = C.ink; c.textBaseline = 'top';
    lines.forEach(([tx, sz, at2]) => { const qa = at2 == null ? 1 : clamp((lt - at2) / 0.12); c.globalAlpha = Math.min(1, q * 3) * qa; c.font = `${sz}px "PuHui-Heavy"`; c.fillText(tx, 26, yy + sz * 0.04); yy += sz * 1.22; });
    c.restore();
  }
  // Vertical speed lines: dir=+1 flows down (object shoots up); -1 flows up.
  function speedLines(c, t, dir, x0, x1, n, seed, col = C.white, lw = 5) {
    c.save(); c.strokeStyle = col; c.lineCap = 'round';
    for (let i = 0; i < n; i++) { const x = lerp(x0, x1, U.hash(i, seed)), L = 180 + U.hash(i, seed + 1) * 380, sp = 1600 + U.hash(i, seed + 2) * 900;
      const y = ((U.hash(i, seed + 3) * 2000 + dir * t * sp) % 2000 + 2000) % 2000 - 500; c.lineWidth = lw * (0.5 + U.hash(i, seed + 4));
      c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + L); c.stroke(); }
    c.restore();
  }

  // ---------- Stainless-steel body: light steel-gray flat fill + Ben-Day shadow at right (breathing dot scale) + white left highlight + thick black outline ----------
  function steel(c, sh, t) {
    const hull = new Path2D(); sh.parts.forEach(q => { if (q.k === 'body' || q.k === 'nose') hull.addPath(q.p); });
    sh.parts.forEach(q => { if (q.k !== 'body' && q.k !== 'nose' && q.k !== 'tiles' && q.k !== 'truss') { c.fillStyle = q.k === 'flap' ? '#5b6474' : C.ink; c.fill(q.p); } });
    c.fillStyle = C.steel; c.fill(hull);
    c.save(); c.clip(hull);
    const s = pxs(c), pat = dots(c, 'steelDot', 14, 3.6, C.steelD, null, 45), br = 1 + 0.12 * Math.sin(t * 3.2);   // Breathing halftone shadow.
    pat.setTransform(new DOMMatrix().scale(br / s, br / s).rotate(45));
    c.fillStyle = pat; c.fillRect(sh.w * 0.12, -sh.h - 2, sh.w, sh.h + 4);
    c.fillStyle = C.blueL; c.fillRect(-sh.w * 0.36, -sh.h - 2, sh.w * 0.08, sh.h + 4);          // Sky-reflection strip.
    c.fillStyle = C.white; c.fillRect(-sh.w * 0.25, -sh.h - 2, sh.w * 0.07, sh.h + 4);          // White highlight strip.
    const tl = sh.parts.find(q => q.k === 'tiles'); if (tl) { c.fillStyle = C.ink; c.fill(tl.p); }
    c.strokeStyle = C.ink; c.lineWidth = 2.2 / s; for (let y = -6; y > -sh.h; y -= 6) { c.beginPath(); c.moveTo(-sh.w, y); c.lineTo(sh.w, y); c.stroke(); }
    c.restore();
    sh.parts.forEach(q => { if (q.k !== 'truss' && q.k !== 'tiles' && q.k !== 'body' && q.k !== 'nose') ink(c, q.p, null, 4); });
    ink(c, hull, null, 5.5);
  }
  const FULL = RK.starship({ fins: 1 }), BOOST = RK.superHeavy({ fins: 1 });

  // ---------- ① Heroic low angle ----------
  function sunburst(c, cx, cy, t, cols, n = 24) {
    const a0 = t * 0.06;
    for (let i = 0; i < n; i++) { const a = a0 + i / n * TAU, b = a + TAU / n; c.fillStyle = cols[i % 2]; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * 2600, cy + Math.sin(a) * 2600); c.lineTo(cx + Math.cos(b) * 2600, cy + Math.sin(b) * 2600); c.closePath(); c.fill(); }
  }
  function panel1(c, lt, t) {
    const zoom = 1 + 0.05 * ss(0, T_2023, lt);
    c.save(); c.translate(1180, 620); c.scale(zoom, zoom); c.translate(-1180, -620);
    sunburst(c, 1180, 470, t, [C.yellow, C.orange]);
    c.save(); c.globalAlpha = 0.5; c.fillStyle = dots(c, 'burstDot', 18, 3.4, C.red, null, 15); c.fillRect(-200, -200, W + 400, H + 400); c.restore();
    // Launch pad.
    ink(c, poly([[960, 1100], [1010, 990], [1350, 990], [1400, 1100]]), '#57606e', 5);
    c.save(); c.clip(poly([[960, 1100], [1010, 990], [1350, 990], [1400, 1100]])); c.fillStyle = dots(c, 'mountDot', 12, 3, C.ink, null, 45); c.fillRect(1180, 980, 240, 140); c.restore();
    // Full stack, low angle: render offscreen, then apply trapezoid perspective in horizontal strips (wider below = nearer camera) to convey huge scale.
    const R1 = P.scratch('s10hero'), rg = R1.getContext('2d'); rg.reset();
    rg.translate(1180, 1010); rg.scale(7.9, 7.9); steel(rg, FULL, t); rg.setTransform(1, 0, 0, 1, 0, 0);
    const top = 1010 - FULL.h * 7.9;
    for (let y = Math.floor(top) - 4; y < 1080; y += 6) { const q = clamp((y - top) / (1010 - top)), f = lerp(0.95, 2.1, Math.pow(q, 1.35)), hw = 120;
      c.drawImage(R1, 1180 - hw, y, hw * 2, 6.6, 1180 - hw * f, y, hw * 2 * f, 6.6); }
    // Glints: two four-point stars on body.
    [[1150, 330, 0], [1210, 720, 1.7]].forEach(([x, y, ph]) => { const k = 0.5 + 0.5 * Math.sin(t * 4 + ph), L = 30 + 26 * k; c.fillStyle = C.white; c.strokeStyle = C.ink; c.lineWidth = 3;
      const p = new Path2D(); p.moveTo(x - L, y); p.quadraticCurveTo(x, y, x, y - L); p.quadraticCurveTo(x, y, x + L, y); p.quadraticCurveTo(x, y, x, y + L); p.quadraticCurveTo(x, y, x - L, y); c.fill(p); c.stroke(p); });
    // Loading vapor: comic clouds roll outward at base.
    for (let i = 0; i < 6; i++) { const side = i % 2 ? 1 : -1, ph = (lt * 0.35 + i * 0.17) % 1; puff(c, 1180 + side * (140 + ph * 260 + i * 20), 990 - (i % 3) * 30 - ph * 40, 55 + (i % 3) * 18, 70 + i); }
    c.restore();
    caption(c, [['星舰', 92, T_SX - 0.05], ['史上最大、最强的火箭', 54, T_SHI - 0.03]], 96, 66, T_SX - 0.08, lt);
  }

  // ---------- ② Launch → tumble ----------
  function panel2(c, lt, t) {
    const u = Math.max(0, lt - (T_FIRE + 0.08));
    const climb = 260 * ss(0, 0.9, u) + 1100 * u * u * 0.18;     // Ground's downward displacement (camera tracks rocket upward).
    c.fillStyle = C.white; c.fillRect(0, 0, W, H);
    c.fillStyle = dots(c, 'sky2', 22, 6.2, C.blue, C.blueL, 45); c.fillRect(0, 0, W, H);
    if (u > 0) speedLines(c, t, 1, 120, 1800, 34, 11, C.white, 6);
    // Ground, tower and pad recede downward with camera.
    c.save(); c.translate(0, climb);
    ink(c, poly([[-20, 1020], [W + 20, 1000], [W + 20, 1200], [-20, 1200]]), C.yellow, 6);
    c.save(); c.translate(960, 1010); c.scale(4.25, 4.25); const tw = RK.tower({ armY: 88, open: 0.9 });
    ink(c, tw.parts.find(q => q.k === 'body').p, '#8b95a5', 5); c.fillStyle = C.ink; c.fill(tw.parts.find(q => q.k === 'truss').p); c.restore();
    ink(c, poly([[700, 1010], [740, 900], [1020, 900], [1060, 1010]]), '#57606e', 5);
    c.restore();
    // Rocket: ignite on pad, rise to mid-frame, begin tumbling around the four-minute cue.
    const rise = Math.min(260, 120 * u + 160 * u * u);
    const tumble = lt > T_4MIN ? 0.9 * Math.pow(clamp((lt - T_4MIN) / (T_BOOM - T_4MIN)), 1.6) + 0.06 * Math.sin(lt * 18) * ss(T_4MIN, T_4MIN + 0.3, lt) : 0;
    const bx = 880 + 60 * tumble, by = 900 - rise;
    c.save(); c.translate(bx, by - 260); c.rotate(tumble); c.translate(0, 260); c.scale(4.25, 4.25);
    const ig = ss(T_FIRE - 0.08, T_FIRE + 0.15, lt);
    if (ig > 0) flame(c, 0, 1.2, (30 + 26 * ss(0, 1, u)) * ig, 12, t, 1);
    steel(c, FULL, t);
    c.restore();
    // Wobble marks (while tumbling).
    if (tumble > 0.05) { c.save(); c.strokeStyle = C.ink; c.lineWidth = 6; c.lineCap = 'round'; const k = fps15(t) % 2;
      [[-1, 0], [1, 0.4]].forEach(([s, ph]) => { const x = bx + s * 150, y = by - 380 + ph * 120, a0 = s > 0 ? 0 : Math.PI; c.beginPath(); c.arc(x - s * 60, y, 60 + k * 10, a0 - 0.8, a0 + 0.8); c.stroke(); c.beginPath(); c.arc(x - s * 60, y, 90 + k * 10, a0 - 0.6, a0 + 0.6); c.stroke(); }); c.restore(); }
    // Comic clouds rolling from ground.
    if (u > 0) for (let i = 0; i < 10; i++) { const side = i % 2 ? 1 : -1, g = ss(0, 0.8, u), x = 880 + side * (90 + g * (120 + i * 46)), y = 960 + climb - (i % 3) * 40 - g * 50;
      if (y < 1200) puff(c, x, y, (60 + (i % 4) * 16) * (0.45 + 0.55 * g), 200 + i); }
    caption(c, [['2023年首飞', 72], ['四分钟左右……', 50, T_4MIN - 0.03]], 96, 66, T_2023 - 0.05, lt);
  }

  // ---------- ③ Explosion panel ----------
  function panel3(c, lt, t) {
    const u = Math.max(0, lt - T_BOOM + 0.03);
    sunburst(c, 900, 470, t * 3, [C.red, C.yellow], 28);
    c.save(); c.globalAlpha = 0.55; c.fillStyle = dots(c, 'boomDot', 16, 3.6, C.redD, null, 75); c.fillRect(0, 0, W, H); c.restore();
    // Radial action lines.
    c.save(); c.strokeStyle = C.ink; c.lineCap = 'round';
    for (let i = 0; i < 26; i++) { const a = i / 26 * TAU + 0.1, r0 = 330 + 60 * U.hash(i, 4), L = (120 + 140 * U.hash(i, 5)) * (0.8 + 0.3 * Math.sin(t * 30 + i)); c.lineWidth = 6 + 6 * U.hash(i, 6);
      c.beginPath(); c.moveTo(900 + Math.cos(a) * r0, 470 + Math.sin(a) * r0 * 0.8); c.lineTo(900 + Math.cos(a) * (r0 + L), 470 + Math.sin(a) * (r0 + L) * 0.8); c.stroke(); }
    c.restore();
    const g = ease.outBack(clamp(u / 0.22));
    burst(c, 900, 470, 380 * g, 14, 0.2, C.white, t, 7);
    burst(c, 900, 470, 290 * g, 12, 0.9, C.yellow, t, 6);
    burst(c, 900, 470, 190 * g, 10, 1.7, C.red, t, 6);
    // Debris.
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + 0.4, v = 520 + 300 * U.hash(i, 8), x = 900 + Math.cos(a) * v * u, y = 470 + Math.sin(a) * v * u * 0.8 + 300 * u * u;
      c.save(); c.translate(x, y); c.rotate(u * (8 + i)); ink(c, poly([[-22, -8], [26, -12], [20, 10], [-18, 8]]), i % 2 ? C.steel : '#57606e', 4); c.restore(); }
    sfx(c, '轰！', 930, 470, 260, t, 0.6 + 0.4 * ease.outBack(clamp(u / 0.18)));
  }

  // ---------- ④ Tower chopsticks catch booster ----------
  const PX4 = 10, TWX = 1190, GY = 380 + 88 * PX4, RX = TWX - 16 * PX4, ARMY = 88, BASE_CATCH = ARMY + 0.8 - 63;
  function armTheta(lt) {
    let th = lerp(1.25, 0.5, ease.inOut(ss(T_SHEN, T_SHEN + 0.7, lt)));
    const q = clamp((lt - T_KZ) / 0.75); th -= 0.26 * Math.abs(Math.sin(q * Math.PI * 2));
    return lerp(th, 0.03, ease.in(ss(T_JZ - 0.3, T_JZ + 0.05, lt)));
  }
  function arm(c, th, s) {
    const L = 30, kV = 0.5, r0 = 0.25 + Math.sin(th) * 1.6, x1 = -L * Math.cos(th), y1 = -ARMY + s * L * Math.sin(th) * kV, y0 = -ARMY + s * r0;
    const ang = Math.atan2(y1 - y0, x1), nx = -Math.sin(ang), ny = Math.cos(ang);
    const body = poly([[nx, y0 + ny], [x1 + nx * 0.75, y1 + ny * 0.75], [x1 - nx * 0.75, y1 - ny * 0.75], [-nx, y0 - ny]]);
    ink(c, body, s < 0 ? '#3b4250' : '#57606e', 5);
    c.save(); c.clip(body); c.strokeStyle = C.ink; c.lineWidth = 2.5 / pxs(c); for (let i = 0; i < 12; i++) { const a = i / 12, b = (i + 1) / 12; c.beginPath(); c.moveTo(x1 * a + nx, lerp(y0, y1, a) + ny); c.lineTo(x1 * b - nx, lerp(y0, y1, b) - ny); c.stroke(); } c.restore();
    ink(c, poly([[x1 + 1.3, y1 - 1.1], [x1 - 0.4, y1 - 1.1], [x1 - 0.4, y1 + 1.1], [x1 + 1.3, y1 + 1.1]]), C.red, 4);
  }
  function boosterY(lt) {
    const t0 = T_TA + 0.05, t1 = T_JZ - 0.06, p = clamp((lt - t0) / (t1 - t0));
    let base = lerp(122, BASE_CATCH + 0.9, 1 - Math.pow(1 - p, 1.7));
    const st = ss(T_JZ - 0.02, T_JZ + 0.16, lt); base -= 0.9 * st - 0.4 * Math.sin(st * Math.PI);
    return { y: GY - base * PX4, p, x: RX + Math.sin(lt * 2.3) * 9 * (1 - p) };
  }
  function chopsticks(c, lt, t, th) {      // Upper-right inset: chopsticks close in sync with arms.
    const q0 = clamp((lt - (T_KZ - 0.12)) / 0.25), qi = ease.outBack(q0), qo = ss(T_LUO + 0.1, T_LUO + 0.4, lt); if (q0 <= 0 || qo >= 1) return;
    const x = 1500, y = 150, w = 330, h = 250;
    c.save(); c.translate(x + w / 2, y + h / 2 + 40 * qo); const s = (0.6 + 0.4 * qi) * (1 - qo); c.scale(s, s); c.rotate(0.03); c.translate(-w / 2, -h / 2);
    c.fillStyle = C.ink; c.fillRect(10, 10, w, h);
    c.fillStyle = C.yellow; c.fillRect(0, 0, w, h); c.save(); c.beginPath(); c.rect(0, 0, w, h); c.clip();
    c.fillStyle = dots(c, 'insetDot', 14, 3.2, C.orange, null, 0); c.fillRect(0, 0, w, h);
    const open = Math.sin(th) * 0.55;
    [[-1, '#e8b56a'], [1, '#d99c48']].forEach(([sd, col]) => { c.save(); c.translate(w + 20, h / 2 + sd * 26); c.rotate(Math.PI + sd * (0.087 - open * 1.1)); ink(c, poly([[0, -12], [300, -5], [300, 5], [0, 12]]), col, 5); c.fillStyle = C.red; c.fillRect(0, -12, 46, 24); c.strokeRect(0, -12, 46, 24); c.restore(); });
    c.restore(); c.strokeStyle = C.ink; c.lineWidth = 6; c.strokeRect(0, 0, w, h);
    c.restore();
  }
  function panel4(c, lt, t) {
    // Camera impact on catch.
    const hit = lt - T_JZ, punch = hit > 0 ? 1 + 0.07 * Math.exp(-hit * 5) * Math.cos(hit * 14) + 0.03 * ss(0, 0.3, hit) : 1;
    c.save(); c.translate(RX, 400); c.scale(punch, punch); c.translate(-RX, -400);
    c.fillStyle = C.white; c.fillRect(-100, -100, W + 200, H + 200);
    c.fillStyle = dots(c, 'sky4', 22, 6.2, C.blue, C.blueL, 45); c.fillRect(-100, -100, W + 200, H + 200);
    // Drifting white comic clouds.
    [[260, 300, 70, 1], [560, 600, 54, 2], [1560, 700, 60, 3], [330, 820, 64, 4]].forEach(([x, y, r, k]) => puff(c, x + lt * (14 + k * 4), y, r, 400 + k));
    const B = boosterY(lt), th = armTheta(lt);
    // Tower body.
    c.save(); c.translate(TWX, GY); c.scale(PX4, PX4); const tw = RK.tower({ armY: ARMY });
    ink(c, tw.parts.find(q => q.k === 'body').p, '#8b95a5', 6);
    c.save(); c.clip(tw.parts.find(q => q.k === 'body').p); c.fillStyle = dots(c, 'towerDot', 12, 3.2, C.ink, null, 45); c.fillRect(7, -150, 6, 152); c.restore();
    c.fillStyle = C.ink; c.fill(tw.parts.find(q => q.k === 'truss').p);
    ink(c, poly([[-1.4, -ARMY - 4.5], [3.5, -ARMY - 4.5], [3.5, -ARMY + 4.5], [-1.4, -ARMY + 4.5]]), C.yellow, 5);
    arm(c, th, -1);
    c.restore();
    // Booster + exhaust + speed lines above.
    if (lt > T_TA - 0.1) {
      const fl = 1 - ss(T_JZ - 0.05, T_JZ + 0.2, lt);
      if (fl > 0.02 && B.p < 0.97) { c.save(); c.beginPath(); c.rect(B.x - 70, -100, 140, B.y - 700 + 100); c.clip(); speedLines(c, t, -1, B.x - 60, B.x + 60, 7, 31, C.ink, 5); c.restore(); }
      c.save(); c.translate(B.x, B.y); c.scale(PX4, PX4);
      if (fl > 0) flame(c, 0, 1.2, (24 - 8 * B.p) * fl, 7 * (0.6 + 0.4 * fl), t, 3);
      steel(c, BOOST, t); c.restore();
    }
    c.save(); c.translate(TWX, GY); c.scale(PX4, PX4); arm(c, th, 1); c.restore();
    // Catch: radial action lines.
    if (hit > 0 && hit < 1.2) { const k = 1 - ss(0.4, 1.2, hit); c.save(); c.strokeStyle = C.ink; c.lineCap = 'round';
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + 0.2, r0 = 120 + 40 * U.hash(i, 9), L = (80 + 90 * U.hash(i, 10)) * k; c.lineWidth = 5; c.beginPath(); c.moveTo(RX + Math.cos(a) * r0, 380 + Math.sin(a) * r0); c.lineTo(RX + Math.cos(a) * (r0 + L), 380 + Math.sin(a) * (r0 + L)); c.stroke(); } c.restore(); }
    c.restore();
    chopsticks(c, lt, t, th);
    if (hit > -0.02) { const a = ease.outBack(clamp((hit + 0.02) / 0.16)); burst(c, 760, 300, 150 * a, 11, 0.4, C.white, t, 6); sfx(c, '咔！', 770, 300, 150, t, a, -0.1); }
    caption(c, [['2024年10月', 72]], 96, 66, T_2024 - 0.02, lt);
  }

  // ---------- Panel push: new panel enters diagonally from right, with white gutter + two black borders ----------
  function wipe(c, q, drawA, drawB) {
    const X = lerp(W + 420, -420, ease.inOut(q)), k = 0.32, edge = y => X + (y - 540) * k;
    drawA(c);
    c.save(); c.beginPath(); c.moveTo(edge(-20), -20); c.lineTo(W + 600, -20); c.lineTo(W + 600, H + 20); c.lineTo(edge(H + 20), H + 20); c.closePath(); c.clip(); drawB(c); c.restore();
    c.save(); c.strokeStyle = C.paper; c.lineWidth = 30; c.beginPath(); c.moveTo(edge(-20) - 12, -20); c.lineTo(edge(H + 20) - 12, H + 20); c.stroke();
    c.strokeStyle = C.ink; c.lineWidth = 6; [-30, 4].forEach(d => { c.beginPath(); c.moveTo(edge(-20) + d, -20); c.lineTo(edge(H + 20) + d, H + 20); c.stroke(); }); c.restore();
  }
  const FRAME = () => P.cached('s10_frame', W, H, (g) => {
    g.fillStyle = C.paper; g.beginPath(); g.rect(0, 0, W, H); g.rect(20, 17, W - 40, H - 34); g.fill('evenodd');
    g.strokeStyle = C.ink; g.lineWidth = 6; g.strokeRect(17, 14, W - 34, H - 28);
    g.drawImage(P.grain('s10pop', 0.03, [60, 50, 30], 0.1), 0, 0);
  });

  return {
    init() {
      U.assertGlyphs('PuHui-Heavy', '星舰史上最大、最强的火箭2023年首飞四分钟左右……2024年10月', ID);
      U.assertGlyphs('PuHui-Black', '轰！咔！', ID);
    },
    draw(c, lt, t) {
      const p1 = g => panel1(g, lt, t), p2 = g => panel2(g, lt, t), p3 = g => panel3(g, lt, t), p4 = g => panel4(g, lt, t);
      c.save(); c.beginPath(); c.rect(20, 17, W - 40, H - 34); c.clip();
      if (lt < W12[0]) p1(c);
      else if (lt < W12[1]) wipe(c, (lt - W12[0]) / (W12[1] - W12[0]), p1, p2);
      else if (lt < T_BOOM - 0.03) p2(c);
      else if (lt < W34[0]) { p3(c); if (lt < T_BOOM + 0.03) { c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(0, 0, W, H); } }
      else if (lt < W34[1]) wipe(c, (lt - W34[0]) / (W34[1] - W34[0]), p3, p4);
      else p4(c);
      c.restore();
      c.drawImage(FRAME(), 0, 0);
    },
  };
})();
ERAS.find(e => e.id === 's10').transition = { type: 'zigzag', dur: 0.55 };
