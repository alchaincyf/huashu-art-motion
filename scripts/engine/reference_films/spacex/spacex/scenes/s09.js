// S09 · Keynote UI (t2): most launches carry Starlink; first 60 in 2019; over 11,000 in orbit and over 12 million users now.
// Dark mesh (UI.mesh, Stripe-like purple/blue/cyan + warm red) + dot Earth; generic bright satellites move along tilted orbits (3D projection, occluded behind globe).
//   ① Launch cue: three light trails rise to orbit, each lights satellites → Starlink title emerges from blur.
//   ② 2019: Earth moves left, glass card at right shows first 60; 60-dot train follows orbit; count settles as 60 ends.
//   ③ Now: cards disperse, satellites explode from 60 to full shell, 11,000+ settles on count cue; ④ Users: two glass cards, 12 million+ settles, ground terminals light up.
// Text emerges from blur with gentle spring rebound; constant camera push 1→1.045 throughout (decelerating to rest makes scene lifeless).
// Facts (rows 19–21, 21a): first 60 in 2019; ~11,156 in orbit as of 2026-10-02 → 11,000+; users >12 million → 12 million+.
(() => {
const W = 1920, H = 1080, ID = 's09';
const { clamp, lerp, rng } = U;
const seg = MO.seg, TAU = Math.PI * 2;
const SANS = '"Inter", "PuHui-Medium"', ZH = '"PuHui-Medium"', ZHB = '"PuHui-Bold"';

const Q = {
  these: TM.cue(ID, '这些发射'), sl: TM.cue(ID, '星链卫星'), y19: TM.cue(ID, '2019年'), n60: TM.cue(ID, '60颗'), land60: TM.end(ID, '60'),
  now: TM.cue(ID, '现在'), n11: TM.cue(ID, '1.1万'), land11: TM.end(ID, '1.1万'), users: TM.cue(ID, '用户'), land12: TM.end(ID, '1200') + 0.05, dur: TM.dur(ID),
};

// ---------- Mesh background ----------
const BLOBS = [
  { x: 380, y: 260, r: 760, col: [150, 90, 238], a: 0.62, ax: 220, ay: 120, period: 11, ph: 0 },
  { x: 1560, y: 240, r: 700, col: [56, 104, 255], a: 0.6, ax: 200, ay: 160, period: 13, ph: 2.1 },
  { x: 1380, y: 920, r: 560, col: [120, 214, 255], a: 0.42, ax: 260, ay: 100, period: 9.5, ph: 4 },
  { x: 480, y: 960, r: 520, col: [255, 96, 84], a: 0.32, ax: 180, ay: 90, period: 12, ph: 1.3 },
];
const bg = (c, lt) => {
  UI.mesh(c, lt + 20, { base: '#050508', blobs: BLOBS, blur: 90, scale: 0.25, grain: 0.035, key: 's09mesh' });
  const g = c.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 1000); g.addColorStop(0, 'rgba(0,0,0,0.42)'); g.addColorStop(1, 'rgba(0,0,0,0.12)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
};
const track = (c, size, em = -0.02) => { c.letterSpacing = (size * em).toFixed(2) + 'px'; };

// ---------- Earth/orbits (3D: Y north, Z toward viewer; view pitched TILT) ----------
const TILT = 0.36;
const view = lt => 0.6 + lt * 0.07;                                         // Whole scene rotates slowly around Earth's axis.
function proj(G, X, Y, Z, psi) {
  const x1 = X * Math.cos(psi) + Z * Math.sin(psi), z1 = -X * Math.sin(psi) + Z * Math.cos(psi);
  const y2 = Y * Math.cos(TILT) - z1 * Math.sin(TILT), z2 = Y * Math.sin(TILT) + z1 * Math.cos(TILT);
  return [G.x + G.r * x1, G.y - G.r * y2, z2];
}
const GLOBE_DOTS = (() => { const n = 1100, o = []; for (let i = 0; i < n; i++) { const y = 1 - 2 * (i + 0.5) / n, rr = Math.sqrt(1 - y * y), th = i * 2.399963; o.push([rr * Math.cos(th), y, rr * Math.sin(th)]); } return o; })();
// Satellites: 0..59 = 2019 train; others on 72 orbital planes, three inclinations (generic bright dots).
const SATS = (() => {
  const r = rng(909), a = [];
  for (let i = 0; i < 60; i++) a.push({ inc: 0.925, raan: 2.35, u0: 0.55 - i * 0.0085, sh: 1.2, train: true });
  const planes = []; for (let k = 0; k < 72; k++) planes.push({ inc: k % 9 === 0 ? 1.7 : k % 4 === 0 ? 1.22 : 0.925, raan: k * TAU / 72 + r() * 0.03 });
  for (let i = 60; i < 1560; i++) { const p = planes[i % 72]; a.push({ inc: p.inc, raan: p.raan, u0: r() * TAU, sh: 1.13 + 0.12 * r(), ph: r() }); }
  return a;
})();
const satXYZ = (s, lt) => { const u = s.u0 + lt * TAU / 26, ci = Math.cos(s.inc), si = Math.sin(s.inc);
  const X = Math.cos(u), Y = Math.sin(u) * si, Z = Math.sin(u) * ci;
  const cr = Math.cos(s.raan), sr = Math.sin(s.raan); return [s.sh * (X * cr + Z * sr), s.sh * Y, s.sh * (-X * sr + Z * cr)]; };
const ORBITS = [0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66].map(k => ({ inc: k % 9 === 0 ? 1.7 : k % 4 === 0 ? 1.22 : 0.925, raan: k * TAU / 72 }));
const TERM = (() => { const r = rng(910), o = []; for (let i = 0; i < 170; i++) { const lat = -0.95 + 1.95 * r(), lon = r() * TAU; o.push({ v: [Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)], k: r(), ph: r() * TAU }); } return o; })();
const LAUNCH = [{ t: 0.35, lat: 0.5, lon: 0.9 }, { t: 0.95, lat: 0.2, lon: 0.3 }, { t: 1.55, lat: 0.62, lon: 1.35 }].map(L => ({ ...L, v: [Math.cos(L.lat) * Math.sin(L.lon), Math.sin(L.lat), Math.cos(L.lat) * Math.cos(L.lon)] }));
const LAUNCH_DUR = 0.85;

// Earth position: ① center → ② left in 2019 → ③ center now (spring, no rebound).
function globeAt(lt) {
  const a = { x: 960, y: 640, r: 196 }, b = { x: 600, y: 590, r: 186 };
  const k1 = MO.spring(lt - (Q.y19 - 0.05), { duration: 0.8 }), k2 = MO.spring(lt - (Q.now + 0.05), { duration: 0.8 });
  const k = clamp(k1) * (1 - clamp(k2));
  return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), r: lerp(a.r, b.r, k) };
}
// Lighting time of satellite j (① batches with three launches; ③ rapid count growth).
const A_PER = 80;
const appearA = j => { const L = Math.floor(j / A_PER); return L < LAUNCH.length ? LAUNCH[L].t + LAUNCH_DUR + (j % A_PER) * 0.004 : 1e9; };
const C0 = Q.now + 0.15, cntE = p => MO.expoOut(p);
const appearC = j => C0 + MO.invert(cntE, (j + 1) / 1500) * (Q.land11 - C0);

function drawGlobe(c, G, lt, psi) {
  // Outer atmospheric glow.
  const ag = c.createRadialGradient(G.x, G.y, G.r * 0.9, G.x, G.y, G.r * 1.45);
  ag.addColorStop(0, 'rgba(110,170,255,0.35)'); ag.addColorStop(0.35, 'rgba(90,120,255,0.12)'); ag.addColorStop(1, 'rgba(90,120,255,0)');
  c.fillStyle = ag; c.fillRect(G.x - G.r * 1.5, G.y - G.r * 1.5, G.r * 3, G.r * 3);
  // Globe: radial gradient lit from upper left.
  const sg = c.createRadialGradient(G.x - G.r * 0.38, G.y - G.r * 0.45, G.r * 0.05, G.x, G.y, G.r);
  sg.addColorStop(0, '#3a56b8'); sg.addColorStop(0.45, '#1a2766'); sg.addColorStop(1, '#070a22');
  c.fillStyle = sg; c.beginPath(); c.arc(G.x, G.y, G.r, 0, TAU); c.fill();
  // Dot surface rotates with scene, darker toward edge.
  c.fillStyle = '#9fb8ff';
  for (const [X, Y, Z] of GLOBE_DOTS) { const [x, y, z] = proj(G, X, Y, Z, psi); if (z <= 0.02) continue; c.globalAlpha = 0.08 + 0.32 * z * z; c.fillRect(x - 1.1, y - 1.1, 2.2, 2.2); }
  c.globalAlpha = 1;
  // Right rim light.
  c.save(); c.beginPath(); c.arc(G.x, G.y, G.r, 0, TAU); c.clip();
  const rg = c.createRadialGradient(G.x - G.r * 0.25, G.y - G.r * 0.1, G.r * 0.88, G.x - G.r * 0.25, G.y - G.r * 0.1, G.r * 1.25);
  rg.addColorStop(0, 'rgba(140,200,255,0)'); rg.addColorStop(1, 'rgba(140,200,255,0.55)'); c.fillStyle = rg; c.fillRect(G.x - G.r, G.y - G.r, G.r * 2, G.r * 2); c.restore();
}

SCENES[ID] = {
  init() {
    U.assertGlyphs('PuHui-Medium', '这些发射，大多在送2019年第一批颗现在在轨卫星用户万', ID);
    U.assertGlyphs('PuHui-Bold', '星链卫星颗万', ID);
    U.assertGlyphs('Inter', '0123456789,+', ID);
  },
  draw(c, lt) {
    const bgc = UI.scratch('s09bg', W, H), bx = bgc.getContext('2d'); bg(bx, lt); c.drawImage(bgc, 0, 0);
    const bd = UI.backdrop(bgc, { blur: 40, key: 's09bd' });
    const z = lerp(1, 1.045, lt / (Q.dur + 0.8));
    c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2);
    const G = globeAt(lt), psi = view(lt);
    const bFade = 1 - MO.smooth(seg(lt, Q.y19 - 0.1, Q.y19 + 0.35));            // ① dots disperse at 2019 cue.
    // Per-satellite visibility and newly-lit flash.
    const satA = (i) => {
      if (i < 60) { const ti = Q.y19 + 0.25 + (i / 59) * (Q.land60 - Q.y19 - 0.25); return [clamp((lt - ti) / 0.12), lt - ti]; }
      const j = i - 60, ta = appearA(j), tc = appearC(j);
      if (lt < Q.now) return [clamp((lt - ta) / 0.15) * bFade, lt - ta];
      return [clamp((lt - tc) / 0.15), lt - tc];
    };
    const trainHi = MO.smooth(seg(lt, Q.y19 + 0.2, Q.y19 + 0.6)) * (1 - MO.smooth(seg(lt, Q.now + 0.2, Q.now + 0.9)));
    const pts = [];
    for (let i = 0; i < SATS.length; i++) { const [a, k] = satA(i); if (a <= 0) continue; const [X, Y, Z] = satXYZ(SATS[i], lt); const [x, y, zz] = proj(G, X, Y, Z, psi); pts.push([x, y, zz, a, k, i]); }
    const hidden = (x, y, zz) => zz < 0 && Math.hypot(x - G.x, y - G.y) < G.r;
    const dot = (x, y, zz, a, k, i) => {
      const tr = i < 60, fl = k < 0.35 ? 1 - k / 0.35 : 0, back = zz < 0 ? 0.35 : 1;
      const r = (tr ? lerp(2.4, 3.6, trainHi) : 2.3) * (1 + 1.3 * fl);
      c.globalAlpha = a * back * (0.55 + 0.45 * Math.max(0, zz));
      c.fillStyle = tr && trainHi > 0 ? '#ffffff' : '#cfe4ff'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      if (fl > 0 || (tr && trainHi > 0)) { c.globalAlpha = a * back * Math.max(fl, tr ? trainHi * 0.7 : 0); TOON.glow(c, x, y, 14, tr ? '#9fe3ff' : '#ffffff', 0.6); }
    };
    // Thin orbit lines suggest shell shape.
    c.save(); c.lineWidth = 1.2; c.strokeStyle = 'rgba(170,200,255,1)';
    for (const o of ORBITS) { c.beginPath(); let pen = false;
      for (let s = 0; s <= 96; s++) { const [X, Y, Z] = satXYZ({ inc: o.inc, raan: o.raan, u0: s / 96 * TAU, sh: 1.2 }, 0); const [x, y, zz] = proj(G, X, Y, Z, psi);
        if (hidden(x, y, zz)) { pen = false; continue; } c.globalAlpha = zz < 0 ? 0.035 : 0.08; if (pen) c.lineTo(x, y); else { c.stroke(); c.beginPath(); c.moveTo(x, y); pen = true; } }
      c.stroke(); }
    c.restore();
    // Rear dots → Earth → front dots.
    c.save(); for (const p of pts) if (p[2] < 0 && !hidden(p[0], p[1], p[2])) dot(...p); c.restore();
    drawGlobe(c, G, lt, psi);
    // ④ User terminals: warm dots light across surface.
    const u0 = Q.users + 0.1;
    if (lt > u0) { c.save();
      for (const T of TERM) { const ti = u0 + MO.invert(MO.expoOut, Math.max(0.02, T.k)) * (Q.land12 - u0), k = lt - ti; if (k <= 0) continue;
        const [x, y, zz] = proj(G, T.v[0] * 1.002, T.v[1] * 1.002, T.v[2] * 1.002, psi); if (zz <= 0.05) continue;
        const fl = k < 0.3 ? 1 - k / 0.3 : 0; c.globalAlpha = clamp(k / 0.1) * (0.5 + 0.5 * zz) * (0.8 + 0.2 * Math.sin(lt * 5 + T.ph));
        c.fillStyle = '#FFB35C'; c.beginPath(); c.arc(x, y, 2.6 + 2 * fl, 0, TAU); c.fill(); TOON.glow(c, x, y, 12 + 10 * fl, '#FF9A3C', 0.5); }
      c.restore(); }
    c.save(); for (const p of pts) if (p[2] >= 0) dot(...p); c.restore();
    // ① Launch trails from surface to orbit.
    for (const L of LAUNCH) { const k = (lt - L.t) / LAUNCH_DUR; if (k <= 0 || k > 1.6) continue;
      const head = MO.cubicInOut(clamp(k)), tail = MO.cubicInOut(clamp(k - 0.35)), fade = 1 - clamp((k - 1) / 0.6);
      const at = q => { const rr = 1 + 0.2 * q, ex = 0.5 * q * q; const v = [L.v[0] + ex * 0.6, L.v[1] + ex * 0.1, L.v[2] - ex * 0.3], n = Math.hypot(...v); return proj(G, v[0] / n * rr, v[1] / n * rr, v[2] / n * rr, psi); };
      c.save(); c.globalAlpha = fade; c.lineCap = 'round'; c.lineWidth = 4;
      const N = 16; for (let s = 0; s < N; s++) { const q0 = lerp(tail, head, s / N), q1 = lerp(tail, head, (s + 1) / N), A = at(q0), B = at(q1); c.strokeStyle = `rgba(255,214,150,${(s + 1) / N})`; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke(); }
      const Hh = at(head); TOON.glow(c, Hh[0], Hh[1], 26, '#FFD08A', 0.9); c.fillStyle = '#fff'; c.beginPath(); c.arc(Hh[0], Hh[1], 4, 0, TAU); c.fill();
      if (k > 1) { const q = (k - 1) / 0.6; c.strokeStyle = `rgba(207,228,255,${1 - q})`; c.lineWidth = 2; c.beginPath(); c.arc(Hh[0], Hh[1], 10 + q * 60, 0, TAU); c.stroke(); }
      c.restore(); }

    // ---------- Text and cards ----------
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    // ① Eyebrow + title.
    const tOut = MO.appleOut(seg(lt, Q.y19 - 0.15, Q.y19 + 0.3));
    if (tOut < 1) { c.save(); c.globalAlpha = 1 - tOut; if (tOut > 0) c.filter = `blur(${(tOut * 16).toFixed(1)}px)`;
      c.font = `500 40px ${ZH}`; c.fillStyle = '#a7a7b4'; c.letterSpacing = '6px';
      TY.blurIn(c, '这些发射，大多在送', W / 2, 168, MO.appleOut(seg(lt, Q.these - 0.15, Q.these + 0.75)), { blur: 12, dy: 18 });
      const tp = MO.appleOut(seg(lt, Q.sl - 0.35, Q.sl + 0.55));
      if (tp > 0) { const tx = UI.scratch('s09title', W, 220), g = tx.getContext('2d'); g.reset();
        g.font = `150px ${ZHB}`; track(g, 150, -0.02); g.textAlign = 'center'; g.textBaseline = 'alphabetic';
        const gr = g.createLinearGradient(640, 0, 1280, 0); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.55, '#ddd2ff'); gr.addColorStop(1, '#a8dcff'); g.fillStyle = gr; g.fillText('星链卫星', W / 2, 170);
        UI.sheen(g, null, seg(lt, Q.sl + 0.3, Q.sl + 1.1), { x0: 640, x1: 1280, width: 120, angle: -0.38, alpha: 0.85, comp: 'source-atop' });
        c.save(); c.globalAlpha *= clamp(tp * 1.5); const b = (1 - tp) * 24; if (b > 0.3) c.filter = `blur(${b.toFixed(1)}px)`; c.drawImage(tx, 0, 330 - 170 + (1 - tp) * 36); c.restore(); }
      c.restore(); }
    // ② 2019 card: render offscreen, exit blur affects only small image (glass-card filter on main canvas costs 600ms/frame).
    const k2 = lt - (Q.y19 + 0.1), k2o = MO.appleOut(seg(lt, Q.now - 0.05, Q.now + 0.35));
    if (k2 > 0 && k2o < 1) {
      const sp = MO.spring(k2, { duration: 0.75, bounce: 0.15 }), x = 1050, y = 250 + (1 - sp) * 140 + MO.float(lt, 6, 3.6), w = 640, h = 520, s = (0.92 + 0.08 * sp) * (1 - 0.04 * k2o);
      const ox = x - 110, oy = y - 110, cs = UI.scratch('s09card2', w + 220, h + 260), g = cs.getContext('2d'); g.reset(); g.translate(-ox, -oy);
      g.translate(x + w / 2, y + h / 2); g.scale(s, s); g.translate(-x - w / 2, -y - h / 2);
      UI.glass(g, { x, y, w, h, r: 36, bd, tint: 0.075, stroke: 0.2, light: 0.14 });
      g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.font = `500 40px ${ZH}`; g.fillStyle = '#a7a7b4'; g.letterSpacing = '4px';
      TY.blurIn(g, '2019年', x + 56, y + 100, MO.appleOut(seg(k2, 0.15, 0.85)), { blur: 10, dy: 14 });
      g.letterSpacing = '0px'; g.font = `500 46px ${ZH}`; g.fillStyle = 'rgba(235,235,245,0.7)';
      TY.blurIn(g, '第一批', x + 56, y + 176, MO.appleOut(seg(lt, Q.y19 + 0.7, Q.y19 + 1.4)), { blur: 10, dy: 14 });
      const v = TY.count(lt, Q.land60 - 0.9, 0.9, 0, 60);
      if (lt > Q.land60 - 0.95) { g.font = `600 250px ${SANS}`; track(g, 250, -0.03); g.fillStyle = '#ffffff'; const nw = TY.tabular(g, TY.fmt(v, 0), x + 44, y + 420);
        g.letterSpacing = '0px'; g.font = `90px ${ZHB}`; g.fillStyle = 'rgba(235,235,245,0.75)'; g.fillText('颗', x + 44 + nw + 18, y + 420); }
      // Card bottom: train of 60 dots lights sequentially with count.
      for (let i = 0; i < 60; i++) { const on = v >= i + 1 - 1e-6, xx = x + 60 + i * 8.9, yy = y + 470 - i * 0.6 + 2 * Math.sin(lt * 2.4 - i * 0.18);
        g.globalAlpha = on ? 0.95 : 0.18; g.fillStyle = on ? '#ffffff' : '#8a8aa0'; g.beginPath(); g.arc(xx, yy, 2.8, 0, TAU); g.fill(); }
      c.save(); c.globalAlpha = clamp(k2 / 0.25) * (1 - k2o); if (k2o > 0.01) c.filter = `blur(${(k2o * 20).toFixed(1)}px)`; c.drawImage(cs, ox, oy); c.restore();
    }
    // ③ 11,000+ in orbit; ④ shift to left card, right card 12 million+.
    const k3 = lt - (Q.now + 0.1);
    if (k3 > 0) {
      const m = MO.spring(lt - (Q.users - 0.05), { duration: 0.7, bounce: 0 }), mm = clamp(m);
      const cx = lerp(960, 640, mm), base = lerp(300, 300, mm), sz = lerp(176, 120, mm);
      // Left card (appears only in ④).
      if (mm > 0.01) { c.save(); c.globalAlpha = mm; UI.glass(c, { x: 340, y: 116 + (1 - mm) * 20, w: 600, h: 254, r: 36, bd, tint: 0.075, stroke: 0.2, light: 0.14 }); c.restore(); }
      c.save(); c.textAlign = 'center';
      c.font = `500 ${lerp(40, 34, mm)}px ${ZH}`; c.fillStyle = '#a7a7b4'; c.letterSpacing = '4px';
      TY.blurIn(c, '在轨卫星', cx, lerp(150, 186, mm), MO.appleOut(seg(k3, 0, 0.7)), { blur: 12, dy: 16 });
      c.letterSpacing = '0px';
      const v = TY.count(lt, C0, Q.land11 - C0, 60, 11000, cntE), str = TY.fmt(v, 0), plus = MO.appleOut(seg(lt, Q.land11 - 0.05, Q.land11 + 0.45));
      c.font = `600 ${sz}px ${SANS}`; track(c, sz, -0.03); c.fillStyle = '#ffffff';
      const dw = c.measureText('0').width, wNum = [...'11,000'].reduce((s, ch) => s + (/[0-9]/.test(ch) ? dw : c.measureText(ch).width), 0);
      c.font = `${sz * 0.42}px ${ZHB}`; const wU = c.measureText('颗').width; c.font = `600 ${sz}px ${SANS}`; const wP = c.measureText('+').width;
      const x0 = cx - (wNum + wP + wU + sz * 0.1) / 2;
      c.globalAlpha = clamp(k3 / 0.2); TY.tabular(c, str, x0 + wNum, base + (1 - clamp(k3 / 0.4)) * 20, { align: 'right' });
      if (plus > 0) { c.save(); c.globalAlpha = plus; c.textAlign = 'left'; if (plus < 1) c.filter = `blur(${((1 - plus) * 10).toFixed(1)}px)`; c.fillText('+', x0 + wNum + 4, base - (1 - plus) * 14); c.restore(); }
      c.letterSpacing = '0px'; c.font = `${sz * 0.42}px ${ZHB}`; c.fillStyle = 'rgba(235,235,245,0.75)'; c.textAlign = 'left'; c.globalAlpha = plus; c.fillText('颗', x0 + wNum + wP + sz * 0.1, base);
      c.restore();
      // Right card: 12 million+ users.
      const k4 = lt - (Q.users - 0.05);
      if (k4 > 0) {
        const sp = MO.spring(k4, { duration: 0.75, bounce: 0.15 }), x = 980, y = 116 + (1 - sp) * 120, w = 600, h = 254;
        c.save(); c.globalAlpha = clamp(k4 / 0.25); UI.glass(c, { x, y, w, h, r: 36, bd, tint: 0.075, stroke: 0.2, light: 0.14 });
        c.textAlign = 'center'; c.font = `500 34px ${ZH}`; c.fillStyle = '#a7a7b4'; c.letterSpacing = '4px';
        TY.blurIn(c, '用户', x + w / 2, y + 70, MO.appleOut(seg(k4, 0.1, 0.8)), { blur: 10, dy: 14 }); c.letterSpacing = '0px';
        const v2 = TY.count(lt, Q.land12 - 0.95, 0.95, 0, 1200), p2 = MO.appleOut(seg(lt, Q.land12 - 0.05, Q.land12 + 0.45));
        c.font = `600 120px ${SANS}`; track(c, 120, -0.03); c.fillStyle = '#ffffff';
        const dw2 = c.measureText('0').width, wN = dw2 * 4; c.font = `50px ${ZHB}`; const wW = c.measureText('万').width; c.font = `600 120px ${SANS}`; const wP2 = c.measureText('+').width;
        const xs = x + w / 2 - (wN + wW + wP2 + 16) / 2, by = y + 184;
        if (lt > Q.land12 - 1.0) { TY.tabular(c, TY.fmt(v2, 0, false), xs + wN, by, { align: 'right' });
          c.letterSpacing = '0px'; c.font = `50px ${ZHB}`; c.fillStyle = 'rgba(235,235,245,0.75)'; c.textAlign = 'left'; c.fillText('万', xs + wN + 8, by);
          if (p2 > 0) { c.save(); c.globalAlpha *= p2; c.font = `600 120px ${SANS}`; c.fillStyle = '#ffffff'; if (p2 < 1) c.filter = `blur(${((1 - p2) * 10).toFixed(1)}px)`; c.fillText('+', xs + wN + 8 + wW + 6, by - (1 - p2) * 14); c.restore(); } }
        // Light sweeps over both cards after settling.
        const sw = seg(lt, Q.land12 + 0.2, Q.land12 + 1.0);
        if (sw > 0 && sw < 1) { UI.sheen(c, UI.rrPath(x, y, w, h, 36), sw, { x0: 340, x1: 1580, width: 110, angle: -0.35, alpha: 0.2 }); UI.sheen(c, UI.rrPath(340, 116, 600, 254, 36), sw, { x0: 340, x1: 1580, width: 110, angle: -0.35, alpha: 0.2 }); }
        c.restore();
      }
    }
    c.restore();
  },
};

// Entry: keynote blur push (old frame recedes, blurs/darkens; new frame settles from 1.06 blurred to 1.0).
ERAS.find(e => e.id === ID).transition = { type: 'blurPush', dur: 0.55 };
})();
