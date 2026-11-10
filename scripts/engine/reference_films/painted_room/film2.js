// film2.js — v2: he walks through. Sixteen ways of painting one room; the change is always something he does:
// he pulls the next one across like a sheet, walks with it riding on him, lands a jump that spills it, or waves it in.
// His frames are drawn pictures that already exist (角色帧/<动作>/*.png, optional: without them the room plays empty);
// the medium of each era paints them like everything else.
(function () {
  const E = window.ENG, { W, H, rng, hash, fbm, mk, ell, ribbon, F, hex, css, mix, shade, sat, lumOf, probe, paint, contours, tex, lay } = E;
  const { room, PAL, MEDIA, swipes, drawLabel } = window.FILM, FPS = 24, PAINT_FPS = 12, B = .6;

  // ---------- six more palettes ----------
  Object.assign(PAL, {
    greek: { wall: '#c8662a', floor: '#a84e1e', frieze: ['#16120f', '#c8662a'], frame: '#16120f', sky: ['#16120f', '#1c1612'], skyCalm: 1, star: ['#d9772e', '#d9772e'], starShape: 'five', moon: ['#efe3c8', '#efe3c8'], moonEdge: '#efe3c8', hill: '#7a2a22', tree: '#16120f', sill: '#16120f', chair: '#16120f', seat: '#7a2a22',
      tableLeg: '#16120f', tableSide: '#16120f', table: '#16120f', stem: '#16120f', leaf: '#16120f', vase: ['#16120f', '#7a2a22'], petal: '#16120f', disc: '#7a2a22', cup: '#efe3c8', catW: '#efe3c8', catO: '#16120f', ear: '#16120f', accP: 0 },
    ink: { bare: ['wall'], wall: '#e8dfc6', floor: ['#cfc6ae', '#bdb49c'], frame: '#5a544c', sky: ['#d9d2bc', '#ebe4cf'], skyCalm: 1, moon: ['#f4eeda', '#e2dbc6'], moonEdge: '#cfc8b2', hill: ['#6a6a66', '#a8a69a'], mist: '#ece5d0', tree: '#2a2a2c', sill: '#8a8478', chair: '#6a6258', seat: '#b9b09a',
      tableLeg: '#4a443e', tableSide: '#5a544c', table: ['#7a7266', '#6a6258'], stem: '#3a3a38', leaf: '#5a5e54', vase: ['#8a8478', '#d9d2bc'], petal: ['#c9a45a', '#d9b870'], disc: '#3a342c', cup: ['#e8e0cc', '#b9b2a0'], catW: ['#f1ead6', '#d9d2bc'], catO: '#b9865a', ear: '#a8744a', steam: '#f4eeda', accP: .15 },
    glass: { wall: ['#7a1a2a', '#5a1422'], floor: ['#1a5a3a', '#144a30'], frame: '#e0a82a', sky: ['#102a8a', '#1f4fc0'], star: ['#fff2a0', '#f0c040'], starEdge: '#1f4fc0', moon: ['#fff6c0', '#f0c040'], moonEdge: '#1f4fc0', hill: ['#1a7a5a', '#126046'], tree: '#0e5a3a', sill: '#e8dcae', chair: '#c9821e', seat: '#e0b23a',
      tableLeg: '#5a2a8a', tableSide: '#6a34a0', table: ['#7a3ab0', '#6a2e9a'], stem: '#2a9a4a', leaf: '#34b058', vase: ['#1f6fd0', '#e8e4f0'], petal: ['#f6c21a', '#f0a01a'], disc: '#8a4a12', cup: ['#f1eee0', '#b9c8e8'], catW: ['#f8f2e0', '#e0d8c0'], catO: '#f0862a', ear: '#d86a1a', accP: .2 },
    cub: { wall: ['#a89878', '#948468'], floor: ['#6a5a48', '#56483a'], frame: '#3a3028', sky: ['#56626a', '#7a8488'], skyCalm: 1, star: ['#d9d0b8', '#9aa09a'], starK: .6, starEdge: '#6a747a', moon: ['#e6dcc0', '#b9b09a'], moonEdge: '#6a747a', hill: ['#6a6a5a', '#56564a'], tree: '#2e2e28', sill: '#b9ad90', chair: '#7a6444', seat: '#a8946a',
      tableLeg: '#4a3a2a', tableSide: '#5a4834', table: ['#8a7250', '#765f42'], stem: '#4a5238', leaf: '#5a6244', vase: ['#8a8478', '#c9c0a8'], petal: ['#b9984a', '#c9a85a'], disc: '#3a2e1e', cup: ['#d9d2be', '#a8a290'], catW: ['#e6dfca', '#b9b29c'], catO: '#a8703a', ear: '#8e5c2e', accP: .2 },
    mond: { wall: '#f4f1e8', floor: '#cfd0cc', frame: '#16161a', sky: '#1f3f9a', skyCalm: 1, star: ['#f2c81a', '#f2c81a'], starShape: 'five', moon: ['#f2c81a', '#f2c81a'], moonEdge: '#f2c81a', hill: '#16161a', tree: '#16161a', sill: '#f4f1e8', chair: '#d8281f', seat: '#f2c81a', tableLeg: '#16161a', tableSide: '#16161a', table: '#f2c81a',
      stem: '#16161a', leaf: '#1f3f9a', vase: ['#1f3f9a', '#f4f1e8'], petal: '#f2c81a', disc: '#16161a', cup: '#f4f1e8', catW: '#f4f1e8', catO: '#d8281f', ear: '#d8281f', accP: 0 },
    cut: { wall: '#f4ead2', floor: '#1f4fa8', frame: '#141414', sky: '#16306e', skyCalm: 1, star: ['#f6d21a', '#f6d21a'], starShape: 'five', moon: ['#f6d21a', '#f6d21a'], moonEdge: '#f6d21a', hill: '#2a9a5a', tree: '#141414', sill: '#e8502a', chair: '#e8502a', seat: '#f6d21a', tableLeg: '#e63a7a', tableSide: '#e63a7a', table: '#f2a81a',
      stem: '#2a9a5a', leaf: '#2a9a5a', vase: ['#ffffff', '#1f4fa8'], petal: '#f6d21a', disc: '#141414', cup: '#ffffff', catW: '#ffffff', catO: '#f07a1a', ear: '#f07a1a', accP: 0 },
  });

  // ---------- his frames, re-toned for the eras whose colour is not his own ----------
  const tone3 = (d, m, l, a = .38, b = .72) => { d = hex(d); m = hex(m); l = hex(l); return (c) => { const v = lumOf(c); return v < a ? d : v < b ? m : l; }; };
  const HEROMAP = {
    cave: (c) => { const v = lumOf(c); return v < .5 ? mix([42, 35, 32], [168, 96, 50], v * 2) : mix([168, 96, 50], [239, 230, 210], (v - .5) * 2); },
    greek: tone3('#16120f', '#8a3a22', '#efe3c8'),
    ink: (c) => { const v = lumOf(c) * 255; return mix(mix(c, [v, v, v], .8), [232, 223, 198], .1); },
    glass: (c) => sat(c, 1.5), ren: (c) => mix(c, [96, 62, 30], .26),
    cub: (c) => { const v = lumOf(c) * 255; return mix(mix(c, [v, v, v], .6), [150, 122, 84], .25); },
    cut: tone3('#141414', '#f07a1a', '#ffffff', .3, .75),
    mond: (c) => { let b = null, bd = 1e9; for (const q of [[244, 241, 232], [216, 40, 31], [242, 200, 26], [31, 63, 154], [22, 22, 26]]) { const d = (q[0] - c[0]) ** 2 + (q[1] - c[1]) ** 2 + (q[2] - c[2]) ** 2; if (d < bd) { bd = d; b = q; } } return b; },
  };
  const KEEP = { vg: .3, imp: .32, point: .36, ren: .2, glass: .25, mosaic: .2, cub: .55, mond: 1 };

  // ---------- six more media ----------
  const spritesUnder = (S, a) => (c) => { c.save(); c.globalAlpha = a; for (const r of S.regions) if (r.sprite) r.put(c); c.restore(); };
  Object.assign(MEDIA, {
    // black figures on fired clay, the lines scratched through the black
    greek(g, S, t, pr) {
      paint(g, S, { base: 'flat', contour: { style: 'ink', w: 2.4, color: '#d9772e', force: true } }, { t, probe: pr });
      g.save(); g.fillStyle = '#16120f'; const o = (t * 40) % 60; for (let x = -60 + o; x < W; x += 60) { g.fillRect(x, 1040, 44, 8); g.fillRect(x, 1040, 8, 30); g.fillRect(x, 1062, 30, 8); g.fillRect(x + 22, 1052, 8, 18); } g.fillRect(0, 1026, W, 6); g.restore();   // a running meander
      g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = .16; g.drawImage(tex('rock'), 0, 0); g.restore(); lay(g, 'grain');
      const x = ((t * 420) % 3400) - 700, gr = g.createLinearGradient(x, 0, x + 500, 260); gr.addColorStop(0, 'rgba(255,230,190,0)'); gr.addColorStop(.5, 'rgba(255,230,190,.2)'); gr.addColorStop(1, 'rgba(255,230,190,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    },
    // ink and water on paper: washes that pool, a dry brush for the line, the paper left for light
    ink(g, S, t, pr) {
      const cm = (c) => { const v = lumOf(c), k = Math.pow(1 - v, 1.25), gy = mix([232, 223, 198], [26, 24, 30], k); return mix(gy, c, .14); };
      paint(g, S, { groundFill: '#e8dfc6', bristles: .5, relief: 0, jit: .1, colorMap: cm, contour: { style: 'charcoal', w: 6, color: '#1a181c', alpha: .62, force: true },
        passes: [{ w: 34, len: 120, gap: 24, alpha: .22, calm: .7 }, { w: 16, len: 60, gap: 12, alpha: .26 }, { w: 7, len: 30, gap: 8, alpha: .32, detail: .2 }] }, { t, probe: pr, under: spritesUnder(S, .92) });
      g.save(); g.fillStyle = '#b3261e'; g.fillRect(1778, 934, 58, 58); g.strokeStyle = '#e8dfc6'; g.lineWidth = 4; g.strokeRect(1788, 944, 38, 38); g.beginPath(); g.moveTo(1807, 944); g.lineTo(1807, 982); g.moveTo(1788, 963); g.lineTo(1826, 963); g.stroke(); g.restore();   // a seal, no characters
      lay(g, 'fibre', 'multiply', 1); lay(g, 'grain');
    },
    // coloured glass in lead, lit from behind
    glass(g, S, t, pr) {
      paint(g, S, { groundFill: '#0c0a10', jit: .2, sat: 1.4, passes: [{ kind: 'tile', w: 23, gap: 24, alpha: 1, skipSprite: true }, { kind: 'tile', w: 11, gap: 11, alpha: 1, onlySprite: true }], contour: { style: 'ink', w: 10, color: '#0c0a10', force: true } }, { t, probe: pr });
      g.save(); g.globalCompositeOperation = 'soft-light'; const gx = 960 + Math.sin(t * .9) * 520, gr = g.createRadialGradient(gx, 380, 60, gx, 420, 900); gr.addColorStop(0, 'rgba(255,246,210,.95)'); gr.addColorStop(1, 'rgba(10,6,30,.55)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore(); lay(g, 'grain');
    },
    // the room seen from several places at once
    cub(g, S, t, pr) {
      const base = MEDIA._cub || (MEDIA._cub = mk()), bg = base.getContext('2d'); bg.clearRect(0, 0, W, H);
      paint(bg, S, { base: 'flat', bristles: .1, relief: 0, jit: .07, accK: .5, passes: [{ w: 14, len: 30, gap: 9, alpha: .34 }, { w: 7, len: 16, gap: 6, alpha: .32, detail: .2 }] }, { t, probe: pr });
      g.drawImage(base, 0, 0); const N = 150, vx = (i, j) => (i <= 0 ? 0 : i * N >= W ? W : i * N + (hash(i, j, 31) - .5) * 96), vy = (i, j) => (j <= 0 ? 0 : j * N >= H ? H : j * N + (hash(i, j, 37) - .5) * 96);
      for (let j = 0; j * N < H; j++) for (let i = 0; i * N < W; i++) { const P = [[vx(i, j), vy(i, j)], [vx(i + 1, j), vy(i + 1, j)], [vx(i + 1, j + 1), vy(i + 1, j + 1)], [vx(i, j + 1), vy(i, j + 1)]], d = (i + j) & 1;
        for (const tri of (d ? [[P[0], P[1], P[2]], [P[0], P[2], P[3]]] : [[P[0], P[1], P[3]], [P[1], P[2], P[3]]])) { const h0 = hash(i * 2 + (tri[1] === P[2] ? 1 : 0), j, 41 + (tri[0] === P[1] ? 7 : 0)), ph = h0 * 6.28, cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
          const dx = (h0 - .5) * 30 + Math.sin(t * 1.3 + ph) * 6, dy = (hash(i, j, 43 + (h0 * 9 | 0)) - .5) * 26 + Math.cos(t * 1.1 + ph) * 5, ro = (h0 - .5) * .1;
          g.save(); g.beginPath(); g.moveTo(tri[0][0], tri[0][1]); g.lineTo(tri[1][0], tri[1][1]); g.lineTo(tri[2][0], tri[2][1]); g.closePath(); g.clip();
          g.save(); g.translate(cx + dx, cy + dy); g.rotate(ro); g.translate(-cx, -cy); g.drawImage(base, 0, 0); g.restore();
          const a = ph, gr = g.createLinearGradient(cx - Math.cos(a) * 110, cy - Math.sin(a) * 110, cx + Math.cos(a) * 110, cy + Math.sin(a) * 110); gr.addColorStop(0, 'rgba(255,242,214,.24)'); gr.addColorStop(1, 'rgba(30,20,10,.34)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
          g.restore(); g.strokeStyle = 'rgba(30,22,14,.36)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(tri[0][0], tri[0][1]); g.lineTo(tri[1][0], tri[1][1]); g.lineTo(tri[2][0], tri[2][1]); g.closePath(); g.stroke(); } }
      lay(g, 'crackle', 'multiply', .6); lay(g, 'grain');
    },
    // everything reduced to rectangles, black lines and three colours; where the room has detail the rectangles divide
    mond(g, S, t, pr) {
      const PM = ['#f4f1e8', '#d8281f', '#f2c81a', '#1f3f9a', '#16161a', '#cfd0cc'].map(hex), near = (c) => { let b = 0, bd = 1e9; PM.forEach((p, i) => { const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (d < bd) { bd = d; b = i; } }); return PM[b]; };
      const edge = (x, y, w, h) => { const a = pr.grp(pr.idAt(x + w / 2, y + h / 2)); for (const [u, v] of [[.12, .12], [.88, .12], [.12, .88], [.88, .88], [.5, .15], [.5, .85], [.15, .5], [.85, .5]]) if (pr.grp(pr.idAt(x + w * u, y + h * v)) !== a) return true; return false; };
      const leaves = []; const split = (x, y, w, h, d) => { if (d < 5 && Math.max(w, h) > 30 && edge(x, y, w, h)) { const k = .4 + hash(x | 0, y | 0, (w | 0) + d) * .2; if (w >= h) { const a = Math.round(w * k); split(x, y, a, h, d + 1); split(x + a, y, w - a, h, d + 1); } else { const a = Math.round(h * k); split(x, y, w, a, d + 1); split(x, y + a, w, h - a, d + 1); } } else leaves.push([x, y, w, h, d]); };
      for (let j = 0; j < 4; j++) for (let i = 0; i < 8; i++) split(i * 240, j * 270, 240, 270, 0);
      for (const [x, y, w, h] of leaves) { g.fillStyle = css(near(pr.colAt(x + w / 2, y + h / 2))); g.fillRect(x, y, w + 1, h + 1); }
      g.strokeStyle = '#16161a'; for (const [x, y, w, h, d] of leaves) { g.lineWidth = d < 2 ? 7 : d < 4 ? 4.5 : 2.6; g.strokeRect(x, y, w, h); }
      for (let k = 0; k < 26; k++) { const hz = k % 2, ln = 1 + (hash(k, 3, 2) * (hz ? 3 : 7) | 0), sp = (hash(k, 5, 2) - .5) * 520, u = (((hash(k, 7, 2) * 2400 + t * sp) % 2400) + 2400) % 2400 - 240; g.fillStyle = ['#d8281f', '#f2c81a', '#1f3f9a'][k % 3]; hz ? g.fillRect(u, ln * 270 - 7, 14, 14) : g.fillRect(ln * 240 - 7, u * .5, 14, 14); }   // little squares running the lines
      lay(g, 'grain');
    },
    // painted paper cut with scissors and pinned down
    cut(g, S, t, pr) {
      const st = Math.floor(t * 6); g.fillStyle = S.regions[0].fill; g.fillRect(0, 0, W, H);
      for (const r of S.regions) { g.save(); g.shadowColor = 'rgba(40,24,10,.3)'; g.shadowBlur = 7; g.shadowOffsetX = 3; g.shadowOffsetY = 4;
        if (r.sprite) r.put(g); else if (r.id > 1 && r.pts.length) { let cx = 0, cy = 0; for (const p of r.pts) { cx += p[0]; cy += p[1]; } cx /= r.pts.length; cy /= r.pts.length; g.fillStyle = typeof r.fill === 'string' ? r.fill : css(pr.colAt(cx, cy));
          g.beginPath(); r.pts.forEach(([x, y], i) => { const n = (fbm(i / 5 + r.id * 3.1, st * .37 + r.id, 6) - .5) * 9, m = (fbm(i / 5 + r.id * 1.7, st * .41 + 9, 8) - .5) * 9; i ? g.lineTo(x + n, y + m) : g.moveTo(x + n, y + m); }); g.closePath(); g.fill(); }
        g.restore(); }
      lay(g, 'fibre', 'multiply', .8); lay(g, 'grain');
    },
  });

  // ---------- the film ----------
  const ERAS = [
    ['cave', '约四万年前', '洞穴壁画', 6], ['egypt', '公元前1350', '古埃及墓室壁画', 4], ['greek', '公元前530', '希腊黑绘陶瓶', 4], ['mosaic', '547', '拜占庭镶嵌画', 4], ['ink', '1072', '宋代水墨', 4], ['glass', '1220', '哥特彩色玻璃', 4], ['ren', '1503', '文艺复兴油画', 4], ['ukiyo', '1831', '浮世绘', 4],
    ['imp', '1872', '印象派', 4], ['point', '1886', '点彩', 4], ['vg', '1889', '后印象派', 6], ['cub', '1910', '立体主义', 4], ['mond', '1921', '风格派', 4], ['cut', '1947', '剪纸', 4], ['pop', '1962', '波普', 4], ['pixel', '1985', '像素', 4],
  ].map(([id, year, name, beats]) => ({ id, year, name, beats }));
  let bt = 0; ERAS.forEach((e) => { e.t0 = bt * B; bt += e.beats; }); const T_FIN = bt * B, DUR = T_FIN + 6 * B, N = ERAS.length, T = ERAS.map((e) => e.t0).concat([T_FIN]);
  // what he does at each change: P pulls it from the right, Pf from the left, W walks right with it, Wl walks left, J jumps, S waves
  const TRN = [null, 'P', 'W', 'J', 'S', 'Pf', 'Wl', 'J', 'P', 'S', 'W', 'J', 'Pf', 'S', 'W', 'J'], WX = { 2: 1320, 6: 560, 10: 1090, 14: 1560 }, FEET = 1042, HH = 480;
  const segs = [{ a: 0, b: 2.3, act: '走路', x0: -170, x1: 520, loop: 1 }]; { let x = 520; for (let k = 1; k < N; k++) { const tk = T[k], ty = TRN[k];
    if (ty === 'P' || ty === 'Pf') segs.push({ a: tk - .55, b: tk + .6, act: '伸手拖拽', x0: x, x1: x, flip: ty === 'Pf' });
    else if (ty === 'W' || ty === 'Wl') { segs.push({ a: tk - 1, b: tk + 1, act: '走路', x0: x, x1: WX[k], loop: 1, flip: WX[k] < x }); x = WX[k]; }
    else if (ty === 'J') segs.push({ a: tk - .62, b: tk + .58, act: '欢呼跳', x0: x, x1: x });
    else segs.push({ a: tk - .5, b: tk + .6, act: '挥手', x0: x, x1: x, wave: 1 }); }
    segs.push({ a: T[3] + .62, b: T[4] - .55, act: '思考想通', x0: 1320, x1: 1320 }, { a: T[12] + .64, b: T[13] - .55, act: '思考想通', x0: 1090, x1: 1090 });
    segs.push({ a: T[10] + 1.12, b: T[10] + 2.5, act: '伸手拖拽', x0: 1090, x1: 1090, flip: true, moon: 1 });
    segs.push({ a: T_FIN + .25, b: T_FIN + 1.45, act: '欢呼跳', x0: x, x1: x }, { a: T_FIN + 1.7, b: T_FIN + 2.9, act: '挥手', x0: x, x1: x, wave: 1 }); segs.sort((p, q) => p.a - q.a); }
  function heroAt(t) { let s = null, x = -170; for (const g of segs) { if (g.a <= t) { if (t < g.b) s = g; x = t < g.b ? g.x0 + (g.x1 - g.x0) * (t - g.a) / (g.b - g.a) : g.x1; } }
    if (!s) return { act: '待机眨眼', f: Math.floor(t * 8) % 8, x, flip: false, seg: null };
    const n = (window.SPR[s.act] || { length: 8 }).length, f = s.loop ? Math.floor((t - s.a) * 10) % n : Math.min(n - 1, Math.floor((t - s.a) / (s.b - s.a) * n)); return { act: s.act, f, x, flip: !!s.flip, seg: s, u: (t - s.a) / (s.b - s.a) }; }
  const ease = (x) => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x), eo = (x) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
  function envAt(t) { let bump = 0; for (let k = 1; k < N; k++) if (TRN[k] === 'J' && t >= T[k]) bump = Math.max(bump, Math.exp(-(t - T[k]) * 5) * Math.abs(Math.cos((t - T[k]) * 16))); if (t >= T_FIN + .85) bump = Math.max(bump, Math.exp(-(t - T_FIN - .85) * 5) * Math.abs(Math.cos((t - T_FIN - .85) * 16)));
    const h = heroAt(t); return { bump, wave: h.seg && h.seg.wave ? Math.sin(Math.PI * h.u) : 0 }; }
  const cache = {};
  function eraCanvas(i, tq) { const e = ERAS[i], c = cache[e.id] || (cache[e.id] = { cv: mk(), tq: -1 }); if (c.tq === tq) return c.cv; c.tq = tq; const g = c.cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none'; g.clearRect(0, 0, W, H);
    const h = heroAt(tq); let hr = null;
    const S = room(PAL[e.id], tq, 'a', (S, hp) => {
      if (h.seg && h.seg.moon && window.SPR[h.act]) { const k = Math.sin(Math.PI * Math.min(1, h.u * 1.15)) ** .7, hand = [h.x - 124, FEET - 190], end = [1090 + (hand[0] - 1090) * k, 205 + (hand[1] - 205) * k], cv = [[1090, 205], [1090 + 40 * k, 205 + (end[1] - 205) * .4], [1090 - 30 * k, 205 + (end[1] - 205) * .75], end];
        if (k > .05) { hp.put('moon', ribbon(cv, 58, 18), F.along([cv], .25), { w: .5, len: .8, accentP: .35, drift: 40 }); hp.put('moon', ell(end[0], end[1], 30, 30), F.ring(end[0], end[1]), { fillFn: null, fill: hp.c0('moon'), w: .45, len: .5, outline: true, ow: .6 }); } }
      if (window.SPR[h.act]) hr = S.sprite(window.SPR[h.act][h.f], { x: h.x, y: FEET, h: HH, flip: h.flip, map: HEROMAP[e.id], mapKey: e.id });
    }, envAt(tq));
    MEDIA[e.id](g, S, tq, probe(S)); if (hr && KEEP[e.id]) { g.save(); g.globalAlpha = KEEP[e.id]; hr.put(g); g.restore(); } return c.cv; }

  const tmpC = mk(), frameC = mk();
  const poly = (g, pts) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); };
  function compose(t) {
    const tq = Math.floor(t * PAINT_FPS + 1e-6) / PAINT_FPS, f = frameC.getContext('2d'); f.setTransform(1, 0, 0, 1, 0, 0); f.globalAlpha = 1; f.globalCompositeOperation = 'source-over';
    if (t >= T_FIN) { f.drawImage(eraCanvas(N - 1, tq), 0, 0); const sx = (i, y) => i <= 0 ? -10 : i >= N ? W + 10 : i * (W / N) + (fbm(y / 150, i * 3.1, 7) - .5) * 70;
      for (let i = 0; i < N; i++) { const p = eo((t - T_FIN - i * .05) / .3); if (p <= 0) continue; const top = i % 2 === 0, y0 = top ? 0 : H * (1 - p), y1 = top ? H * p : H, pts = []; for (let y = y0; y <= y1 + 1; y += 12) pts.push([sx(i, y), y]); for (let y = y1; y >= y0 - 1; y -= 12) pts.push([sx(i + 1, y), y]); f.save(); poly(f, pts); f.clip(); f.drawImage(eraCanvas(i, tq), 0, 0); f.restore(); }
      return { year: '四万年', name: '同一扇窗' }; }
    let k = 0; for (let j = 1; j < N; j++) { const ty = TRN[j], w0 = ty[0] === 'W' ? 1 : ty === 'J' ? 0 : .45, w1 = ty[0] === 'W' ? 1 : ty === 'J' ? .5 : .45; if (t >= T[j] - w0 && t < T[j] + w1) { k = j; break; } }
    if (!k) { let i = N - 1; while (i > 0 && t < T[i]) i--; f.drawImage(eraCanvas(i, tq), 0, 0); return ERAS[i]; }
    const ty = TRN[k], h = heroAt(t), old = eraCanvas(k - 1, tq), nw = eraCanvas(k, tq); f.drawImage(old, 0, 0); let p = 0, shade = null;
    if (ty === 'S') { p = (t - (T[k] - .45)) / .9; const c = tmpC.getContext('2d'); c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, W, H); c.drawImage(nw, 0, 0); c.globalCompositeOperation = 'destination-in'; c.drawImage(swipes(p, k), 0, 0); f.drawImage(tmpC, 0, 0); }
    else if (ty === 'J') { p = (t - T[k]) / .5; const R = eo(p) * 2500, pts = []; for (let a = 0; a < 6.283; a += .05) { const r = R * (1 + (fbm(a * 3, k * 2.2, 5) - .5) * .16); pts.push([h.x + Math.cos(a) * r, FEET + Math.sin(a) * r * .8]); } f.save(); poly(f, pts); f.clip(); f.drawImage(nw, 0, 0); f.restore(); p = p > .2 ? 1 : 0; }
    else { let seam, right;   // right: the new painting is on the right of the seam
      if (ty[0] === 'P') { p = (t - (T[k] - .45)) / .9; const e = ease(p), fl = ty === 'Pf', x0 = fl ? -180 + (W + 360) * e : W + 180 - (W + 360) * e, bg = 110 * Math.sin(Math.PI * Math.max(0, Math.min(1, p))) * (fl ? 1 : -1); seam = (y) => x0 + bg * Math.exp(-(((y - (FEET - 228)) / 190) ** 2)) + (fbm(y / 130, k * 2.2, 4) - .5) * 46; right = !fl; shade = [seam, right]; }
      else { p = (t - (T[k] - 1)) / 2; const lf = ty === 'Wl', from = lf ? W + 120 : -120, to = lf ? -120 : W + 120, xs = p < .2 ? from + (h.x - from) * ease(p / .2) : p > .8 ? h.x + (to - h.x) * ease((p - .8) / .2) : h.x; seam = (y) => xs + (fbm(y / 150, k * 3.3, 7) - .5) * 100; right = lf; }
      const pts = []; for (let y = 0; y <= H; y += 12) pts.push([seam(y), y]); pts.push(right ? [W + 20, H] : [-20, H], right ? [W + 20, 0] : [-20, 0]); f.save(); poly(f, pts); f.clip(); f.drawImage(nw, 0, 0); f.restore(); }
    if (shade) { const [seam, right] = shade, d = right ? 1 : -1; for (let y = 0; y <= H; y += 4) { const x = seam(y), gr = f.createLinearGradient(x - 6 * d, 0, x + 46 * d, 0); gr.addColorStop(0, 'rgba(255,250,230,.5)'); gr.addColorStop(.18, 'rgba(20,16,40,.4)'); gr.addColorStop(1, 'rgba(20,16,40,0)'); f.fillStyle = gr; f.fillRect(Math.min(x - 6 * d, x + 46 * d), y, 52, 4); } }
    return p > .5 ? ERAS[k] : ERAS[k - 1];
  }
  function camera(t) { let hx = 0; for (const d of [-.6, -.3, 0, .3, .6]) hx += Math.max(200, Math.min(1700, heroAt(Math.max(0, t + d)).x)) / 5;
    let s = 1.15 + .04 * Math.sin(t * .4), x = 960 + (hx - 960) * .5, y = 600; const k0 = ease(t / 2.4); s = 1 + (s - 1) * k0; x = 960 + (x - 960) * k0; y = 540 + (y - 540) * k0;
    const m = ease((t - T[10] - 1) / .5) * (1 - ease((t - T[10] - 2.5) / .5)); s += .16 * m; x += (1010 - x) * m; y += (560 - y) * m;
    const fz = ease((t - T_FIN + .2) / .9); s = s + (1 - s) * fz + .03 * fz * ease((t - T_FIN - .9) / 2.7); x += (960 - x) * fz; y += (540 - y) * fz;
    for (let k = 1; k < N; k++) if (t >= T[k] - .05 && t < T_FIN) s += .03 * Math.exp(-(t - T[k] + .05) * 5);
    x = Math.max(W / 2 / s, Math.min(W - W / 2 / s, x)); y = Math.max(H / 2 / s, Math.min(H - H / 2 / s, y)); return [s, x, y]; }
  window.FILM2 = { FPS, DUR, frames: Math.round(DUR * FPS), ERAS, T, TRN, T_FIN,
    frame(i) { const t = i / FPS, c = document.getElementById('c'), g = c.getContext('2d'), lab = compose(t), [s, x, y] = camera(t); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.setTransform(s, 0, 0, s, W / 2 - s * x, H / 2 - s * y); g.imageSmoothingQuality = 'high'; g.drawImage(frameC, 0, 0); g.setTransform(1, 0, 0, 1, 0, 0); drawLabel(g, lab, t); return c.toDataURL('image/jpeg', .95); },
    still(id, t) { const i = ERAS.findIndex((e) => e.id === id), c = document.getElementById('c'), g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(eraCanvas(i, t), 0, 0); drawLabel(g, ERAS[i], t); return c.toDataURL('image/jpeg', .93); } };
})();
