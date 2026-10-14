// S12 · Shinkai light/shadow ending: future ship catch, orbital refueling, return Americans to Moon, then Mars.
// Style 35_shinkai: cumulonimbus (silhouette + sun-facing bright lobes + blurred/sharp layers), light shafts, cel hard shadow bands/lit rims, light dust, lens flare, bloom, warm/cool separation.
// Exterior sky on tall world canvas; camera only pans upward, never back:
//   A Sunset tower: dashed Starship silhouette descends to open chopsticks; dashes mark future preview, not news footage → catch closes arms, catch points flash.
//   B Orbital refueling: two high-altitude Starships side by side, thin connecting light with flowing dots.
//   C Moon: camera pans up to Moon, Starship trail arcs toward it from lower left.
//   D Mars: small red star lights farther above/right of Moon; ending holds 1.8s while sky dims slightly (no black frame or credits).
SCENES['s12'] = (() => {
  const ID = 's12', W = 1920, H = 1080, { clamp, lerp, ss, ease, rng } = U, P = PAINT;
  const cue = k => TM.cue(ID, k), DUR = TM.dur(ID), VO = TM.vo(ID);
  const T_KZ = cue('筷子'), T_JZ = cue('夹住'), T_TK = cue('在太空里'), T_JY = cue('加油'), T_ZQ = cue('争取'), T_YQ = cue('月球'), T_ZWH = cue('再往后'), T_HX = cue('火星');
  // ---------- Camera: upward pans only ----------
  const OY1 = 720, OY2 = 1470;
  function camAt(lt) {
    let oy = lerp(0, OY1, ease.inOut(ss(T_TK - 0.2, T_JY + 0.05, lt)));
    oy += (OY2 - OY1) * ease.inOut(ss(T_ZQ + 0.1, T_YQ - 0.15, lt));
    oy += 26 * ss(T_YQ, DUR, lt);                                        // Very slow upward drift even during hold.
    const ox = -70 * ease.inOut(ss(T_ZWH - 0.2, T_HX + 0.4, lt));        // Later cue shifts gently right to bring Mars in.
    return { ox, oy };
  }
  // ---------- Objects in world coordinates ----------
  const SUN = [960, 900];
  const TW = { x: 1560, base: 1100, pxm: 6.4, armY: 95 };
  const SHIP_CATCH = TW.armY + 0.8 - 38;                                  // Ship-base height on catch (m): catch points ~38m below forward flaps.
  const SHIPX = TW.x - 16 * TW.pxm;
  const MOON = [1236, -1110], MR = 148, MARS = [1650, -1335];
  const TRAIL = [[210, -110], [300, -780], [780, -1210], [1076, -1124]];
  // Sky: world y → color (horizon gold → pink → purple → blue → deep indigo).
  const SKY = [[1100, '#ffd28a'], [930, '#ffae7c'], [720, '#f08c98'], [470, '#a77cc4'], [160, '#5d6fd0'], [-350, '#3550b4'], [-850, '#253684'], [-1700, '#151b52']];

  // Seeded cumulonimbus groups: main left tower + lower-right cloud.
  // g: cloud group (0 main tower, 1 lower right, 2 lower left), used to determine sun-facing lobes.
  const GC = [[400, 640], [1500, 1000], [100, 1020]];
  const BLOBS = (() => { const r = rng(1212), out = [];
    for (let i = 0; i < 170; i++) { const h = Math.pow(r(), 0.75), y = 1100 - h * 820, w = h > 0.84 ? 620 : lerp(760, 420, h); out.push({ g: 0, h, x: 380 + (r() - 0.5) * w + h * 90 + (h > 0.84 ? 150 : 0), y: y + (r() - 0.5) * 40, r: lerp(118, 52, h) * (0.6 + r() * 0.7), ph: r() * 6 }); }
    for (let i = 0; i < 30; i++) out.push({ g: 1, h: 0.2, x: 1220 + r() * 760, y: 960 + r() * 110, r: 30 + r() * 40, ph: r() * 6 });
    for (let i = 0; i < 12; i++) out.push({ g: 2, h: 0.2, x: -40 + r() * 280, y: 1000 + r() * 80, r: 40 + r() * 36, ph: r() * 6 });
    return out.sort((a, b) => b.y - a.y); })();
  const STARS = (() => { const r = rng(77), out = []; for (let i = 0; i < 260; i++) out.push([r() * W * 1.1 - 40, -1720 + r() * 1900, 0.6 + r() * 1.6, r() * 6]); return out; })();

  function skyFill(c, cam) {
    const g = c.createLinearGradient(0, SKY[SKY.length - 1][0] + cam.oy, 0, SKY[0][0] + cam.oy);
    const y0 = SKY[SKY.length - 1][0], y1 = SKY[0][0];
    SKY.forEach(([y, col]) => g.addColorStop((y - y0) / (y1 - y0), col));
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // Large warm-white halo around Sun.
    const sx = SUN[0] + cam.ox, sy = SUN[1] + cam.oy;
    if (sy < 1700) { const sg = c.createRadialGradient(sx, sy, 0, sx, sy, 900); sg.addColorStop(0, 'rgba(255,248,225,.95)'); sg.addColorStop(0.12, 'rgba(255,226,170,.55)'); sg.addColorStop(0.45, 'rgba(255,170,140,.18)'); sg.addColorStop(1, 'rgba(255,160,140,0)'); c.fillStyle = sg; c.fillRect(0, 0, W, H); }
  }
  function stars(c, cam, t) {
    for (const [x, y, s, ph] of STARS) { const sy = y + cam.oy, sx = x + cam.ox; if (sy < -10 || sy > H + 10) continue;
      const a = ss(-60, -800, y) * (0.55 + 0.45 * Math.sin(t * (2 + ph) + ph * 3)); if (a < 0.03) continue;
      c.fillStyle = `rgba(255,250,235,${a})`; c.beginPath(); c.arc(sx, sy, s, 0, 7); c.fill(); }
  }
  // Light shafts: wedges fanning upward from Sun (cached, 22px blur), screen blend, pulsing.
  const RAYS = () => P.cached('s12_rays', W, 1700, (g) => {
    g.filter = 'blur(22px)'; const sx = SUN[0], sy = 1200;
    [[-2.35, 0.07, .30], [-2.05, 0.05, .22], [-1.82, 0.09, .34], [-1.55, 0.05, .26], [-1.3, 0.08, .3], [-1.02, 0.05, .22], [-0.78, 0.06, .2]].forEach(([a, w, al]) => {
      const L = 1500, g2 = g.createLinearGradient(sx, sy, sx + Math.cos(a) * L, sy + Math.sin(a) * L); g2.addColorStop(0, `rgba(255,236,200,${al})`); g2.addColorStop(1, 'rgba(255,236,200,0)');
      g.fillStyle = g2; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(a - w) * L, sy + Math.sin(a - w) * L); g.lineTo(sx + Math.cos(a + w) * L, sy + Math.sin(a + w) * L); g.closePath(); g.fill(); });
  });
  function rays(c, cam, t) {
    const top = SUN[1] - 1200 + cam.oy; if (top > H) return;
    c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = 0.8 + 0.2 * Math.sin(t * 2.6); c.drawImage(RAYS(), cam.ox * 0.5, SUN[1] - 1200 + cam.oy); c.restore();
  }
  // High cirrus: pink threads lit from below by sunset.
  const CIRRUS = () => P.cached('s12_cirrus', W + 400, 520, (g) => {
    const r = rng(404); g.filter = 'blur(2.5px)';
    for (let i = 0; i < 46; i++) { const x = r() * (W + 400), y = 60 + r() * 400, L = 160 + r() * 420, h = 4 + r() * 10, a = 0.12 + r() * 0.28;
      const lg = g.createLinearGradient(x - L / 2, 0, x + L / 2, 0); lg.addColorStop(0, 'rgba(255,190,200,0)'); lg.addColorStop(0.5, `rgba(255,${200 + (r() * 40 | 0)},${200 + (r() * 30 | 0)},${a})`); lg.addColorStop(1, 'rgba(255,190,200,0)');
      g.fillStyle = lg; g.beginPath(); g.ellipse(x, y, L / 2, h, -0.06, 0, 7); g.fill(); }
  });
  function cirrus(c, cam, lt) { const y = -520 + cam.oy; if (y > H || y + 520 < 0) return; c.save(); c.globalAlpha = 0.9; c.drawImage(CIRRUS(), -200 + cam.ox - (lt * 12) % 200, y); c.restore(); }
  // Altocumulus: small dark-purple silhouettes + lit upper rims (source-atop confines light), slow drift.
  const ALTO = () => P.cached('s12_alto', W + 600, 280, (g) => {
    const r = rng(515);
    for (let k = 0; k < 16; k++) { const cx = 60 + k * 150 + r() * 80, cy = 120 + (r() - 0.5) * 120, s = 0.6 + r() * 0.7, bl = [];
      for (let i = 0; i < 6; i++) bl.push([cx + (i - 2.5) * 22 * s + (r() - 0.5) * 10, cy - Math.sin(i / 5 * Math.PI) * 18 * s + (r() - 0.5) * 8, (16 + r() * 14) * s]);
      g.globalCompositeOperation = 'source-over'; g.fillStyle = '#6f66ad'; g.beginPath(); bl.forEach(([x, y, rr]) => { g.moveTo(x + rr, y); g.arc(x, y, rr, 0, 7); }); g.fill();
      g.globalCompositeOperation = 'source-atop'; g.fillStyle = '#e9def6'; g.beginPath(); bl.forEach(([x, y, rr]) => { g.moveTo(x + rr * 0.85, y - rr * 0.32); g.arc(x, y - rr * 0.32, rr * 0.85, 0, 7); }); g.fill(); }
  });
  function alto(c, cam, lt) { const y = -720 + cam.oy; if (y > H || y + 280 < 0) return; c.save(); c.globalAlpha = 0.85; c.drawImage(ALTO(), -300 + cam.ox + lt * 10, y); c.restore(); }
  // Moon (cached sprite): cool-white disk + faint maria + sharp edge, outer halo.
  const MOONIMG = () => P.cached('s12_moon', 520, 520, (g) => {
    const cx = 260, cy = 260;
    const halo = g.createRadialGradient(cx, cy, MR * 0.9, cx, cy, 255); halo.addColorStop(0, 'rgba(255,244,220,.32)'); halo.addColorStop(1, 'rgba(255,244,220,0)'); g.fillStyle = halo; g.fillRect(0, 0, 520, 520);
    const d = g.createRadialGradient(cx - 30, cy - 34, 10, cx, cy, MR); d.addColorStop(0, '#fffdf6'); d.addColorStop(0.75, '#fbf1da'); d.addColorStop(1, '#ecdcb8'); g.fillStyle = d; g.beginPath(); g.arc(cx, cy, MR, 0, 7); g.fill();
    g.save(); g.beginPath(); g.arc(cx, cy, MR, 0, 7); g.clip(); g.filter = 'blur(3px)';
    [[-34, -30, 36, 26], [12, -40, 26, 20], [30, 6, 34, 30], [-18, 22, 22, 16], [-52, 10, 16, 22], [46, 50, 18, 12]].forEach(([dx, dy, rx, ry]) => { g.fillStyle = 'rgba(205,190,165,.42)'; g.beginPath(); g.ellipse(cx + dx, cy + dy, rx, ry, 0.4, 0, 7); g.fill(); });
    g.filter = 'none'; g.fillStyle = 'rgba(150,140,190,.09)'; g.beginPath(); g.arc(cx + 34, cy + 30, MR, 0, 7); g.fill();          // Cool shadow on unlit side (cel hard edge).
    g.restore();
    g.strokeStyle = 'rgba(255,255,250,.85)'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, MR - 1, Math.PI * 0.75, Math.PI * 1.6); g.stroke();
  });
  function moon(c, cam, t) { const x = MOON[0] + cam.ox, y = MOON[1] + cam.oy; if (y < -400 || y > H + 400) return; c.drawImage(MOONIMG(), x - 260, y - 260); }
  function mars(c, cam, lt, t) {
    const a = ease.out(ss(T_HX - 0.12, T_HX + 0.3, lt)); if (a <= 0) return;
    const x = MARS[0] + cam.ox, y = MARS[1] + cam.oy, pulse = 1 + 0.12 * Math.sin(t * 3.1);
    c.save(); c.globalCompositeOperation = 'lighter';
    const gl = c.createRadialGradient(x, y, 0, x, y, 95 * pulse); gl.addColorStop(0, `rgba(255,120,80,${0.85 * a})`); gl.addColorStop(0.3, `rgba(255,80,60,${0.32 * a})`); gl.addColorStop(1, 'rgba(255,80,60,0)'); c.fillStyle = gl; c.fillRect(x - 100, y - 100, 200, 200);
    // Cross-shaped flare on ignition shrinks into steady glow.
    const fl = a * (0.35 + 0.65 * (1 - ss(T_HX + 0.2, T_HX + 1.4, lt))) * (0.85 + 0.15 * Math.sin(t * 5));
    c.strokeStyle = `rgba(255,190,160,${0.7 * fl})`; c.lineWidth = 1.6;
    for (let k = 0; k < 4; k++) { const ang = k * Math.PI / 2 + 0.2 + t * 0.15, L = (k % 2 ? 36 : 62) * (0.6 + fl); c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(ang) * L, y + Math.sin(ang) * L); c.stroke(); }
    c.restore();
    c.fillStyle = `rgba(240,86,56,${a})`; c.beginPath(); c.arc(x, y, 12 * (0.6 + 0.4 * a), 0, 7); c.fill();
    c.fillStyle = `rgba(255,205,175,${a})`; c.beginPath(); c.arc(x - 3, y - 3, 4, 0, 7); c.fill();
  }
  // Cumulonimbus: style 35 silhouette/sun-facing lobes become three-tone cel shading; union of round lobes forms dark-purple silhouette,
  // Sun-facing lobes shifted toward Sun and shrunk form warm lit areas, shifted again for highlights; destination-in clips to silhouette. Hard edges avoid soap-bubble appearance.
  BLOBS.forEach(b => { const [gx, gy] = GC[b.g], vx = b.x - gx, vy = b.y - gy, vl = Math.hypot(vx, vy) || 1, sxg = SUN[0] - gx, syg = SUN[1] - gy, sl = Math.hypot(sxg, syg) || 1;
    const face = (vx * sxg + vy * syg) / vl / sl; b.lit = clamp(0.15 + 0.9 * Math.max(0, face) * Math.min(1, vl / 150) + 0.7 * Math.max(0, b.h - 0.6)); });
  function clouds(c, cam, lt, t) {
    if (cam.oy > 1180) return;
    const S = P.scratch('s12CloudS'), g = S.getContext('2d'); g.reset();
    const L = P.scratch('s12CloudL'), l = L.getContext('2d'); l.reset();
    const at = b => [b.x + lt * 7 + cam.ox, b.y + cam.oy - Math.sin(t * 0.8 + b.ph) * 3, b.r * (1 + 0.05 * Math.sin(t * 1.3 + b.ph))];
    const vis = []; BLOBS.forEach(b => { const [x, y, r] = at(b); if (y - r > H + 40 || y + r < -40) return; vis.push([b, x, y, r]); });
    if (!vis.length) return;
    const sg = g.createLinearGradient(0, 260 + cam.oy, 0, 1100 + cam.oy); sg.addColorStop(0, '#a48fcf'); sg.addColorStop(0.6, '#7d6cb4'); sg.addColorStop(1, '#5e5098');
    g.fillStyle = sg; g.beginPath(); vis.forEach(([b, x, y, r]) => { g.moveTo(x + r, y); g.arc(x, y, r, 0, 7); }); g.fill();
    const sx = SUN[0] + cam.ox, sy = SUN[1] + cam.oy;
    const lg = l.createRadialGradient(sx, sy, 0, sx, sy, 1150); lg.addColorStop(0, '#fff3de'); lg.addColorStop(0.45, '#ffd4ae'); lg.addColorStop(1, '#f2a9bd');
    const off = (x, y, r, k, sh) => { const dx = sx - x, dy = sy - y, d = Math.hypot(dx, dy) || 1; return [x + dx / d * r * k, y + dy / d * r * k - r * 0.06, r * sh]; };
    l.fillStyle = lg; l.beginPath(); vis.forEach(([b, x, y, r]) => { if (b.lit < 0.32) return; const [ox, oy, rr] = off(x, y, r, 0.26, 0.86); l.moveTo(ox + rr, oy); l.arc(ox, oy, rr, 0, 7); }); l.fill();
    l.fillStyle = 'rgba(255,251,242,.92)'; l.beginPath(); vis.forEach(([b, x, y, r]) => { if (b.lit < 0.62) return; const [ox, oy, rr] = off(x, y, r, 0.5, 0.6); l.moveTo(ox + rr, oy); l.arc(ox, oy, rr, 0, 7); }); l.fill();
    l.globalCompositeOperation = 'destination-in'; l.drawImage(S, 0, 0);
    g.drawImage(L, 0, 0);
    // Cool halo below clouds adds internal volume.
    g.globalCompositeOperation = 'source-atop'; const vg = g.createLinearGradient(0, 700 + cam.oy, 0, 1100 + cam.oy); vg.addColorStop(0, 'rgba(70,60,140,0)'); vg.addColorStop(1, 'rgba(70,60,140,.35)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
    c.drawImage(S, 0, 0);
  }
  // ---------- Tower, chopsticks, ship (sunset silhouette: cel shadows + sun-facing rim) ----------
  // Local-coordinate cel shading (P.cel's inverse rectangle uses screen pixels; in meters it would include whole upper body in lit rim).
  const BIGL = (() => { const p = new Path2D(); p.rect(-1e4, -1e4, 2e4, 2e4); return p; })();
  const beside = (c, path, dx, dy) => { const m = new Path2D(); m.addPath(BIGL); m.addPath(path, new DOMMatrix().translate(dx, dy)); c.clip(path); c.clip(m, 'evenodd'); };
  function cel(c, p, base, shade, rim, { sd = 1, rw = 0.3, line, lw = 0, lx = -1, ly = -0.55 } = {}) {
    c.fillStyle = base; c.fill(p);
    if (shade) { c.save(); beside(c, p, lx * sd, ly * sd); c.fillStyle = shade; c.fill(p); c.restore(); }
    if (rim) { c.save(); beside(c, p, -lx * rw, -ly * rw); c.fillStyle = rim; c.fill(p); c.restore(); }
    if (lw) { c.strokeStyle = line; c.lineWidth = lw; c.lineJoin = 'round'; c.stroke(p); }
  }
  const SIL = { b: '#2c2752', s: '#1d1a3c', r: '#ffb27c' };
  const lit = { lx: -1, ly: 0.35 };     // Light comes from lower-left Sun.
  function armTheta(lt) { return lerp(0.55, 0.03, ease.in(ss(T_JZ - 0.28, T_JZ + 0.1, lt))); }
  function tower(c, cam, lt, t, front) {
    const th = armTheta(lt);
    c.save(); c.translate(TW.x + cam.ox, TW.base + cam.oy); c.scale(TW.pxm, TW.pxm);
    const arm = (s) => { const L = 30, kV = 0.5, x1 = -L * Math.cos(th), y1 = -TW.armY + s * L * Math.sin(th) * kV, y0 = -TW.armY + s * (0.2 + Math.sin(th) * 1.4);
      const ang = Math.atan2(y1 - y0, x1), nx = -Math.sin(ang), ny = Math.cos(ang);
      const p = U.poly([[nx * 0.9, y0 + ny * 0.9], [x1 + nx * 0.65, y1 + ny * 0.65], [x1 - nx * 0.65, y1 - ny * 0.65], [-nx * 0.9, y0 - ny * 0.9]]);
      cel(c, p, s < 0 ? '#25213f' : SIL.b, null, SIL.r, { rw: 0.3, lw: 0, ...lit }); };
    if (!front) {
      const tw = RK.tower({ armY: TW.armY });
      const body = tw.parts.find(q => q.k === 'body').p;
      cel(c, body, SIL.b, SIL.s, SIL.r, { sd: 4, rw: 0.45, lw: 0, ...lit });
      c.save(); c.clip(body); c.strokeStyle = 'rgba(120,100,170,.55)'; c.lineWidth = 0.18; for (let y = 0; y < 146; y += 6) { c.beginPath(); c.moveTo(0, -y); c.lineTo(12, -y - 6); c.moveTo(0, -y); c.lineTo(12, -y); c.stroke(); } c.restore();
      c.fillStyle = SIL.s; c.fillRect(5.6, -158, 0.8, 12);                                          // Lightning rod.
      const blink = 0.5 + 0.5 * Math.sin(t * 4);                                                    // Tower-top aircraft warning light.
      c.fillStyle = `rgba(255,70,60,${0.4 + 0.6 * blink})`; c.beginPath(); c.arc(6, -158.5, 0.7, 0, 7); c.fill();
      c.fillStyle = '#211d3a'; c.fillRect(-1.2, -TW.armY - 4, 4.4, 8);
      arm(-1);
    } else arm(1);
    c.restore();
  }
  const SHIP = RK.ship({});
  function shipHull(sh) { const h = new Path2D(); sh.parts.forEach(q => { if (q.k === 'body' || q.k === 'nose') h.addPath(q.p); }); return h; }
  function shipPose(lt) {
    const p = clamp(lt / (T_JZ + 0.06)), e = 1 - Math.pow(1 - p, 1.8);
    let base = lerp(SHIP_CATCH + 150, SHIP_CATCH + 0.6, e);
    const settle = ss(T_JZ + 0.02, T_JZ + 0.25, lt); base -= 0.6 * settle - 0.25 * Math.sin(settle * Math.PI);
    return { x: SHIPX + Math.sin(lt * 1.9) * 1.2 * (1 - p) * TW.pxm, y: TW.base - base * TW.pxm, p };
  }
  function ship(c, cam, lt, t) {
    const S = shipPose(lt), hull = shipHull(SHIP);
    // Preview: dashed landing silhouette + descent path (future tense).
    const ga = ss(0.3, 0.9, lt) * (1 - ss(T_JZ - 0.1, T_JZ + 0.3, lt));
    if (ga > 0) { c.save(); c.translate(SHIPX + cam.ox, TW.base - SHIP_CATCH * TW.pxm + cam.oy); c.scale(TW.pxm, TW.pxm);
      c.setLineDash([2.2, 1.6]); c.lineDashOffset = -t * 6; c.strokeStyle = `rgba(255,232,196,${0.75 * ga})`; c.lineWidth = 0.32; c.stroke(hull); c.setLineDash([]); c.restore(); }
    c.save(); c.translate(S.x + cam.ox, S.y + cam.oy); c.scale(TW.pxm, TW.pxm);
    const fl = 1 - ss(T_JZ - 0.05, T_JZ + 0.2, lt);
    if (fl > 0) RK.flame(c, 0, 1.6, 16 * fl * (1 - 0.3 * S.p), 5.5 * (0.6 + 0.4 * fl), t, ['rgba(255,150,90,.75)', 'rgba(255,214,150,.9)', '#fff8e6'], 4);
    const flaps = SHIP.parts.filter(q => q.k === 'flap' || q.k === 'engine');
    const flapSh = RK.ship({ flap: Math.sin(t * 2.2) * 0.25 * fl });
    flapSh.parts.filter(q => q.k === 'flap').forEach(q => cel(c, q.p, '#26223f', null, SIL.r, { rw: 0.3, lw: 0, ...lit }));
    cel(c, hull, '#38325f', SIL.s, SIL.r, { sd: 2.6, rw: 0.42, lw: 0, ...lit });
    flaps.filter(q => q.k === 'engine').forEach(q => { c.fillStyle = SIL.s; c.fill(q.p); });
    c.restore();
  }
  // Catch instant: two four-point stars at catch points.
  function glints(c, cam, lt, t) {
    const u = lt - T_JZ; if (u < -0.02 || u > 0.9) return;
    const a = Math.sin(Math.PI * clamp(u / 0.9));
    [[SHIPX - 6 * TW.pxm, 0], [SHIPX + 6 * TW.pxm, 0.12]].forEach(([x, d]) => {
      const y = TW.base - TW.armY * TW.pxm + cam.oy, xx = x + cam.ox, k = a * (1 - d), L = 60 * k;
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,236,200,${0.9 * k})`;
      c.beginPath(); c.moveTo(xx - L, y); c.quadraticCurveTo(xx, y, xx, y - L * 0.7); c.quadraticCurveTo(xx, y, xx + L, y); c.quadraticCurveTo(xx, y, xx, y + L * 0.7); c.quadraticCurveTo(xx, y, xx - L, y); c.fill();
      const g = c.createRadialGradient(xx, y, 0, xx, y, 40); g.addColorStop(0, `rgba(255,240,210,${0.8 * k})`); g.addColorStop(1, 'rgba(255,240,210,0)'); c.fillStyle = g; c.fillRect(xx - 40, y - 40, 80, 80); c.restore(); });
  }
  // ---------- B: two high-altitude Starships, thin connecting light ----------
  const PAIR = [{ x: 780, y: -350, a: -0.1 }, { x: 1120, y: -232, a: -0.1 }], PXB = 6.2;
  function refuelShip(c, cam, S, lt) {
    const hull = shipHull(SHIP), dr = lt * 9;
    c.save(); c.translate(S.x + cam.ox + dr, S.y + cam.oy + Math.sin(lt * 1.3 + S.x) * 4); c.rotate(Math.PI / 2 + S.a); c.scale(PXB, PXB); c.translate(0, SHIP.h / 2 - 1);
    const th = Math.PI / 2 + S.a, Lx = -1, Ly = 0.35, lx = Lx * Math.cos(th) + Ly * Math.sin(th), ly = -Lx * Math.sin(th) + Ly * Math.cos(th);
    const L = { lx, ly, line: '#3b3460', lw: 0.12 };
    SHIP.parts.filter(q => q.k === 'flap').forEach(q => cel(c, q.p, '#9aa0bf', '#6a6f96', '#ffd2a2', { sd: 0.7, rw: 0.3, ...L }));
    cel(c, hull, '#d9dcea', '#8e93b6', '#ffe0b6', { sd: 2.2, rw: 0.45, ...L });
    c.save(); c.clip(hull); const tl = SHIP.parts.find(q => q.k === 'tiles'); c.fillStyle = '#3a3a5c'; c.fill(tl.p); c.restore();
    SHIP.parts.filter(q => q.k === 'engine').forEach(q => { c.fillStyle = '#3a3a5c'; c.fill(q.p); });
    c.restore();
  }
  function belly(S, s, cam, t) { const n = [-Math.sin(S.a), Math.cos(S.a)], u = [Math.cos(S.a), Math.sin(S.a)]; return [S.x + cam.ox + t * 9 + n[0] * 4.6 * PXB * s - u[0] * 30, S.y + cam.oy + Math.sin(t * 1.3 + S.x) * 4 + n[1] * 4.6 * PXB * s - u[1] * 30]; }
  function refuel(c, cam, lt, t) {
    if (cam.oy < 200) return;
    refuelShip(c, cam, PAIR[0], lt); refuelShip(c, cam, PAIR[1], lt);
    const A = belly(PAIR[0], 1, cam, lt), B = belly(PAIR[1], -1, cam, lt), q = ease.inOut(ss(T_JY - 0.15, T_JY + 0.3, lt)); if (q <= 0) return;
    const E = [lerp(A[0], B[0], q), lerp(A[1], B[1], q)];
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    c.strokeStyle = 'rgba(255,214,160,.22)'; c.lineWidth = 12; c.beginPath(); c.moveTo(...A); c.lineTo(...E); c.stroke();
    c.strokeStyle = 'rgba(255,246,226,.95)'; c.lineWidth = 2.2; c.stroke();
    // Light dots flow left ship → right ship.
    if (q >= 1) for (let i = 0; i < 7; i++) { const s = ((lt - T_JY) * 0.9 + i / 7) % 1, x = lerp(A[0], B[0], s), y = lerp(A[1], B[1], s), g = c.createRadialGradient(x, y, 0, x, y, 11);
      g.addColorStop(0, 'rgba(255,250,235,.95)'); g.addColorStop(1, 'rgba(255,220,170,0)'); c.fillStyle = g; c.fillRect(x - 11, y - 11, 22, 22); }
    c.restore();
  }
  // ---------- C: Starship trail arcs toward Moon ----------
  const bez = (s) => { const [a, b, c2, d] = TRAIL, m = 1 - s; return [m * m * m * a[0] + 3 * m * m * s * b[0] + 3 * m * s * s * c2[0] + s * s * s * d[0], m * m * m * a[1] + 3 * m * m * s * b[1] + 3 * m * s * s * c2[1] + s * s * s * d[1]]; };
  function trail(c, cam, lt, t) {
    const s1 = ease.inOut(ss(T_ZQ + 0.15, T_YQ + 0.05, lt)); if (s1 <= 0) return;
    const n = 70, s0 = Math.max(0, s1 - 0.95);
    const pts = []; for (let i = 0; i <= n; i++) { const s = lerp(s0, s1, i / n), p = bez(s); pts.push([p[0] + cam.ox, p[1] + cam.oy, i / n]); }
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (const [w, a0, col] of [[22, 0.1, '255,200,170'], [8, 0.3, '255,226,196'], [2.4, 0.95, '255,250,238']]) {
      for (let i = 0; i < n; i++) { const [x0, y0, u] = pts[i], [x1, y1] = pts[i + 1], shimmer = 0.85 + 0.15 * Math.sin(t * 6 - u * 14);
        c.strokeStyle = `rgba(${col},${a0 * Math.pow(u, 1.4) * shimmer})`; c.lineWidth = w * (0.4 + 0.6 * u); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); } }
    // Arc tip: bright dot (Starship) + small flare.
    const [hx, hy] = pts[n], k = 1 - 0.4 * ss(T_YQ + 0.1, T_YQ + 1.2, lt), g = c.createRadialGradient(hx, hy, 0, hx, hy, 30 * k);
    g.addColorStop(0, 'rgba(255,252,240,1)'); g.addColorStop(0.3, 'rgba(255,230,190,.55)'); g.addColorStop(1, 'rgba(255,220,180,0)'); c.fillStyle = g; c.fillRect(hx - 32, hy - 32, 64, 64);
    c.strokeStyle = `rgba(255,246,226,${0.6 * k})`; c.lineWidth = 1.4; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + t * 0.4, L = (i % 2 ? 16 : 30) * k; c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + Math.cos(a) * L, hy + Math.sin(a) * L); c.stroke(); }
    c.restore();
  }
  // Bird flock (A, flapping silhouettes).
  function birds(c, cam, lt, t) {
    for (let k = 0; k < 5; k++) { const x = 220 + lt * 70 + k * 38 + cam.ox, y = 470 + k * 13 + Math.sin(t * 2.4 + k) * 7 + cam.oy, f = Math.sin(t * 13 + k * 2) * 7; if (y > H + 20) continue;
      c.strokeStyle = '#3a2f5a'; c.lineWidth = 2.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - 11, y - f); c.quadraticCurveTo(x - 4, y - 2, x, y); c.quadraticCurveTo(x + 4, y - 2, x + 11, y - f); c.stroke(); }
  }
  // Ending callback: 2002 → 2026 fades below Moon/Mars (thin white text + glow, path arrow), after voiceover through segment end.
  function coda(c, lt) {
    const a = ss(VO[1] + 0.15, VO[1] + 1.0, lt); if (a <= 0) return;
    const y = 772 - 10 * ease.out(a), sz = 64, gap = 128;
    c.save(); c.globalAlpha = a; c.font = `${sz}px "PuHui-Medium"`; c.textBaseline = 'middle'; c.letterSpacing = '6px';
    const wL = c.measureText('2002').width, wR = c.measureText('2026').width, x0 = 960 - (wL + gap + wR) / 2;
    c.shadowColor = 'rgba(255,236,210,.85)'; c.shadowBlur = 22; c.fillStyle = '#fffaf0';
    c.textAlign = 'left'; c.fillText('2002', x0, y); c.fillText('2026', x0 + wL + gap, y);
    const ax0 = x0 + wL + 30, ax1 = x0 + wL + gap - 30; c.strokeStyle = '#fffaf0'; c.lineWidth = 3; c.lineCap = 'round';
    c.beginPath(); c.moveTo(ax0, y); c.lineTo(ax1, y); c.moveTo(ax1 - 14, y - 11); c.lineTo(ax1, y); c.lineTo(ax1 - 14, y + 11); c.stroke();
    c.restore();
  }
  // Light dust (screen space, slowly rising/flickering).
  function motes(c, t) {
    const ms = P.particles(34, 91, t * 0.5, { x0: 40, x1: 1880, y0: 1060, y1: 40, speed: 24, drift: 36, life: 9 });
    c.save(); c.globalCompositeOperation = 'lighter';
    ms.forEach((m, i) => { const tw = 0.5 + 0.5 * Math.sin(t * 5 + i * 1.3), rr = (1 + m.s * 2) * 2.4, g = c.createRadialGradient(m.x, m.y, 0, m.x, m.y, rr); g.addColorStop(0, `rgba(255,244,220,${0.55 * tw})`); g.addColorStop(1, 'rgba(255,244,220,0)'); c.fillStyle = g; c.fillRect(m.x - rr, m.y - rr, rr * 2, rr * 2); });
    c.restore();
  }

  return {
    init() { U.assertGlyphs('PuHui-Medium', '20022026', ID); RAYS(); CIRRUS(); MOONIMG(); ALTO();   // Prewarm cache to avoid first-use frame timeout.
      ['筷子', '夹住', '在太空里', '加油', '争取', '月球', '再往后', '火星'].forEach(k => { if (!TM.text(ID).includes(k)) throw new Error('s12 cue 不在字幕里：' + k); }); },
    draw(c, lt, t) {
      const cam = camAt(lt);
      skyFill(c, cam);
      stars(c, cam, t);
      rays(c, cam, t);
      cirrus(c, cam, lt);
      alto(c, cam, lt);
      moon(c, cam, t);
      mars(c, cam, lt, t);
      clouds(c, cam, lt, t);
      trail(c, cam, lt, t);
      refuel(c, cam, lt, t);
      if (cam.oy < 1100) { birds(c, cam, lt, t); tower(c, cam, lt, t, false); ship(c, cam, lt, t); tower(c, cam, lt, t, true); glints(c, cam, lt, t); }
      motes(c, t);
      const sy = SUN[1] + cam.oy; if (sy < 1250) P.lensFlare(c, [SUN[0] + cam.ox, sy], t, { core: 120 });
      P.bloom(c, { key: 's12Bloom', alpha: 0.3 });
      c.save(); c.globalCompositeOperation = 'soft-light'; const tg = c.createLinearGradient(0, 0, 0, H); tg.addColorStop(0, 'rgba(70,100,220,.35)'); tg.addColorStop(1, 'rgba(255,200,150,.35)'); c.fillStyle = tg; c.fillRect(0, 0, W, H); c.restore();
      // Ending afterglow: sky dims slightly after voiceover (no black screen).
      const dk = 0.3 * ss(VO[1] + 0.1, DUR - 0.6, lt);
      if (dk > 0) { c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgba(60,60,120,${dk})`; c.fillRect(0, 0, W, H); c.restore(); }
      coda(c, lt);
    },
  };
})();
ERAS.find(e => e.id === 's12').transition = { type: 'flareSweep', dur: 0.6 };
