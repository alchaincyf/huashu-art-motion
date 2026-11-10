// film.js — one room, one window, one cat; forty thousand years of ways to paint them.
(function () {
  const E = window.ENG, { W, H, rng, hash, fbm, mk, ell, rect, smooth, ribbon, tx, star, F, hex, css, mix, shade, sat, lumOf, Scene, probe, paint, tex, lay } = E;
  const FPS = 24, PAINT_FPS = 12;
  const lg = (x0, y0, x1, y1, stops) => (g) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(0, 0, W, H); };
  const rg = (x, y, r, stops) => (g) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); stops.forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(0, 0, W, H); };

  // ---------- the room, at time t, in a palette ----------
  const BUMP = { cup: 30, vase: 14, petal: 20, disc: 20, stem: 14, leaf: 14, chair: 12, seat: 12 };
  function room(pal, t, slot, extra, env = {}) {
    const S = Scene(pal.seed || 11, slot), sw = (f, ph = 0, a = 1) => Math.sin(t * f + ph) * a;
    const c0 = (k) => Array.isArray(pal[k]) ? pal[k][0] : pal[k], c1 = (k) => Array.isArray(pal[k]) ? pal[k][1] : pal[k];
    const acc = (k) => { const c = hex(c0(k)); return [shade(c, .26), shade(c, -.3)].concat(((pal.acc || {})[k] || []).map(hex)); };
    const put = (key, pts, flow, x = {}) => { const dyB = (env.bump || 0) * (BUMP[key] || 0); if (dyB) pts = pts.map(([px, py]) => [px, py - dyB]); let y0 = 1e9, y1 = -1e9, x0 = 1e9, x1 = -1e9; for (const p of pts) { if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; }
      const tone = (pal.tones || {})[key];
      return S.add(Object.assign({ key, pts, flow, fill: x.fillFn || (Array.isArray(pal[key]) ? (x.h ? lg(x0, 0, x1, 0, [[0, pal[key][0]], [1, pal[key][1]]]) : x.split ? lg(0, y0, 0, y1, [[0, pal[key][0]], [x.split, pal[key][0]], [x.split + .01, pal[key][1]], [1, pal[key][1]]]) : lg(0, y0, 0, y1, [[0, pal[key][0]], [1, pal[key][1]]])) : pal[key]),
        accents: acc(key), accentP: pal.accP ?? .3, bare: (pal.bare || []).includes(key), tone: tone && tone[0], toneColor: tone && tone[1] }, x)); };
    const last = () => S.regions[S.regions.length - 1].id;

    put('wall', rect(0, 0, W, 782), F.dir(55, 2.4, 260), { accentP: .16, len: .55, jit: .08 });
    put('floor', rect(0, 780, W, 300), F.radial(960, 330, .12), { len: 1.3 });
    if (pal.frieze) { for (let i = 0; i < 24; i++) S.add({ key: 'frieze', pts: rect(i * 80, 0, 80, 46), fill: pal.frieze[i % pal.frieze.length], flow: F.dir(90, .1), outline: true, ow: .7, w: .6 }); S.add({ key: 'frieze', pts: rect(0, 46, W, 12), fill: pal.frieze[0], flow: F.dir(0), outline: true, ow: .7 }); }
    // the window and the night (or the day) outside
    put('frame', rect(520, 90, 680, 564), F.ring(860, 370, .1), { outline: true, w: .7 });
    const vs = [{ x: 760 + sw(.5, 0, 26), y: 290 + sw(.4, 1, 14), r: 80, s: 1 }, { x: 930 + sw(.45, 2, 22), y: 250 + sw(.5, 3, 10), r: 60, s: -1 }];
    put('sky', rect(558, 128, 604, 488), pal.skyCalm ? F.dir(0, .3, 160) : F.swirl(vs, -.1, .7, 200), { w: .7, len: .8, jit: .16, accentP: (pal.accP ?? .3) + .04, drift: pal.skyCalm ? 14 : 30 });
    if (pal.mist) [[640 + ((t * 16) % 700), 300, 150], [1180 - ((t * 11) % 760), 380, 190], [700 + ((t * 9 + 300) % 600), 470, 120]].forEach(([x, y, l]) => { const a = Math.max(566, x - l), b = Math.min(1154, x + l); if (b - a > 40) S.add({ key: 'mist', pts: ell((a + b) / 2, y, (b - a) / 2, 8, 0, 40), fill: pal.mist, flow: F.dir(0), w: .6 }); });
    if (pal.star) [[610, 180, 30], [700, 420, 24], [800, 170, 26], [1010, 330, 30], [960, 170, 20], [1120, 420, 22], [640, 310, 18]].forEach(([x, y, r0], i) => { const r = r0 * (pal.starK || 1) * (1 + .18 * Math.sin(t * 2.6 + i * 1.7));
      if (pal.starShape === 'five') S.add({ key: 'star', pts: star(x, y, r * .34, r * .8, 5, -Math.PI / 2 + sw(.5, i, .2)), fill: pal.star[0], flow: F.radial(x, y), w: .5, len: .4, outline: pal.starLine || false, ow: .6 });
      else { S.add({ key: 'halo', pts: ell(x, y, r, r), fill: rg(x, y, r, [[0, pal.star[0]], [.45, pal.star[1]], [1, pal.starEdge || c1('sky')]]), flow: F.ring(x, y, .2), w: .55, len: .7, accents: [hex(pal.star[0]), hex(pal.star[1])], accentP: .3, jit: .1, drift: 18 });
        S.add({ key: 'star', pts: ell(x, y, r * .3, r * .3), fill: pal.star[0], flow: F.ring(x, y), w: .4, len: .4 }); } });
    { const r = 62 * (1 + .05 * Math.sin(t * 1.9));
      S.add({ key: 'halo', pts: ell(1090, 205, r, r), fill: rg(1090, 205, r, [[0, pal.moon[0]], [.5, pal.moon[1]], [1, pal.moonEdge || c0('sky')]]), flow: F.ring(1090, 205, .15), w: .6, len: .8, accents: [hex(pal.moon[0]), hex(pal.moon[1])], accentP: .3, drift: 22, outline: pal.moonLine || false });
      S.add({ key: 'moon', pts: ell(1090, 205, 27, 27), fill: pal.moon[0], flow: F.ring(1090, 205), w: .45, len: .5 }); }
    if (pal.fuji) { put('hill', smooth([[558, 566], [690, 548], [790, 480], [846, 404], [880, 396], [912, 404], [970, 480], [1066, 548], [1162, 566], [1162, 616], [558, 616]], true, 4), F.dir(8, .4, 80), { w: .6, len: .7, outline: true, ow: .6 });
      S.add({ key: 'snow', group: last(), pts: smooth([[820, 446], [846, 404], [880, 396], [912, 404], [940, 446], [912, 432], [896, 452], [878, 430], [856, 450], [842, 432]], true, 3), fill: pal.snow, flow: F.dir(70, .3), w: .5, len: .5 }); }
    else put('hill', smooth([[558, 540], [640, 505], [740, 530], [840, 495], [960, 520], [1060, 490], [1162, 515], [1162, 616], [558, 616]], true, 6), F.dir(8, .5, 80), { w: .6, len: .7, outline: true, ow: .6 });
    { const b = sw(.9, 0, 7), k = (y) => b * Math.pow((616 - y) / 366, 1.6);
      put('tree', smooth([[590, 616], [600, 520], [585, 440], [612, 380], [600, 320], [628, 250], [650, 330], [640, 400], [668, 460], [655, 540], [672, 616]].map(([x, y]) => [x + k(y), y]), true, 6), F.dir(-90, 1.1, 50), { accentP: .4, w: .55, len: .8, outline: true, ow: .6 }); }
    put('sill', rect(488, 650, 744, 36), F.dir(0, .1), { outline: true, w: .7 });
    // the chair
    const ch = { outline: true, w: .5, ow: .7 };
    [[[196, 800], [188, 1010]], [[430, 790], [440, 990]], [[236, 760], [228, 470]], [[396, 742], [404, 452]]].forEach((c) => put('chair', ribbon(c, 26), F.dir(90, .1), ch));
    put('chair', ribbon([[232, 520], [400, 502]], 30), F.dir(-6, .1), ch); put('chair', ribbon([[234, 610], [400, 592]], 26), F.dir(-6, .1), ch);
    put('seat', [[176, 770], [410, 742], [462, 800], [214, 836]], F.dir(-8, .5, 40), { accentP: .4, outline: true, w: .5, len: .6 });
    put('chair', ribbon([[208, 900], [436, 880]], 20), F.dir(-5, .1), ch);
    // the table, the flowers, the cup
    put('tableLeg', rect(1250, 790, 80, 250), F.dir(90, .1), { outline: true, w: .6 });
    put('tableSide', rect(1236, 786, 700, 56), F.dir(0, .1), { outline: true, w: .7 });
    put('table', [[1290, 696], [1930, 696], [1930, 790], [1222, 790]], F.dir(0, .25, 120), { outline: true });
    const fl = [[1436, 420, 60], [1568, 350, 66], [1672, 450, 56], [1498, 290, 46], [1640, 270, 40]].map(([x, y, r], i) => [x + sw(1.1, i * 1.3, 6), y + sw(.8, i * 2.1, 3), r, i + sw(.6, i, .1)]);
    fl.forEach(([x, y]) => put('stem', ribbon([[1524, 540], [(1524 + x) / 2 + 12, (540 + y) / 2 + 20], [x, y]], 12), F.dir(-70, .4), { w: .4, len: .6, outline: true, ow: .5 }));
    put('leaf', smooth([[1560, 500], [1620, 470 + sw(1, 1, 3)], [1700, 500 + sw(1, 1, 5)], [1640, 530]]), F.dir(10, .4), { accentP: .35, w: .5, len: .6, outline: true, ow: .6 });
    put('leaf', smooth([[1480, 505], [1420, 490 + sw(1, 2, 3)], [1370, 520 + sw(1, 2, 5)], [1430, 540]]), F.dir(170, .4), { accentP: .35, w: .5, len: .6, outline: true, ow: .6 });
    put('vase', smooth([[1470, 700], [1448, 640], [1462, 572], [1494, 532], [1554, 532], [1586, 572], [1600, 640], [1578, 700]]), F.ring(1524, 600, .3), { split: .49, accentP: .25, outline: true, w: .6, len: .7 });
    fl.forEach(([x, y, r, rot]) => {
      put('petal', smooth(star(x, y, r * .72, r * 1.08, 13, rot), true, 3), F.radial(x, y, .35), { fillFn: Array.isArray(pal.petal) ? rg(x, y, r, [[0, pal.petal[0]], [1, pal.petal[1]]]) : null, accentP: .35, w: .5, len: .5, outline: true, ow: .55 });
      put('disc', ell(x, y, r * .46, r * .46), F.ring(x, y, .3), { group: last(), accentP: .45, w: .35, len: .35 }); });
    { const u = (t / 3.4 + .2) % 1, x = 1610 + Math.sin(u * 8) * 46 - u * 60, y = 430 + u * 262, a = u * 7; put('petal', ell(x, y, 17, 8, a, 14), F.dir(a * 57.3), { fillFn: null, fill: c1('petal'), w: .4, len: .3, outline: true, ow: .5 }); }
    put('cup', smooth([[1340, 690], [1332, 640], [1420, 640], [1412, 690], [1376, 700]]), F.dir(90, .2), { h: 1, outline: true, w: .45, len: .5, ow: .6 });
    if (pal.steam) for (const k of [0, 1]) { const x = 1362 + k * 28, p = t * 1.4 + k * 2; S.add({ key: 'steam', pts: ribbon([[x, 632], [x + Math.sin(p) * 12, 600], [x + Math.sin(p + 1.2) * 16, 566], [x + Math.sin(p + 2.4) * 12, 534]], 9, 3), fill: pal.steam, flow: F.dir(90, .3), w: .35, len: .5 }); }
    // the cat, from behind
    const wv = env.wave || 0, br = 1 + .014 * Math.sin(t * 1.8) - (env.bump || 0) * .06, hx = sw(.7, 0, 5) + wv * sw(7, 0, 5), hy = -200 * (br - 1) * 1.2, tw = Math.pow(Math.max(0, Math.sin(t * 2.7 + 1)), 10) * 12 + wv * Math.abs(Math.sin(t * 11)) * 14, ta = (sw(1.6, 0, 24) + Math.pow(Math.max(0, Math.sin(t * 1.1)), 6) * 26) * (1 + wv * 1.6) + wv * sw(9, 0, 30);
    const C = (pts) => tx(pts, 1.08, 900, 652), fur = F.dir(90, .6, 50, 21), tail = [[60, -16], [130, -8], [176 + ta * .3, 36], [168 + ta, 96], [136 + ta * 1.6, 150]];
    put('catO', C(ribbon(tail, 36, 20)), F.along([C(tail)], .3), { accentP: .4, w: .45, len: .5, outline: true, ow: .7 });
    put('catW', C(smooth([[-80, 0], [-90, -62], [-72, -132], [-42, -186], [0, -202], [42, -186], [72, -132], [90, -62], [80, 0], [40, 8], [-40, 8]]).map(([x, y]) => [x, y * br])), fur, { h: 1, w: .5, len: .6, outline: true });
    put('catO', C(smooth([[-62, -150], [-10, -178], [52, -152], [72, -90], [30, -58], [-30, -72], [-72, -102]]).map(([x, y]) => [x, y * br])), fur, { group: last(), accentP: .4, w: .45, len: .55 });
    put('ear', C([[-60 + hx, -258 + hy], [-52 + hx - tw, -334 + hy], [-10 + hx, -286 + hy]]), F.dir(80, .2), { w: .4, len: .4, outline: true, ow: .7 });
    put('ear', C([[60 + hx, -258 + hy], [56 + hx + tw * .4, -334 + hy], [12 + hx, -286 + hy]]), F.dir(100, .2), { w: .4, len: .4, outline: true, ow: .7 });
    put('catW', C(ell(2 + hx, -242 + hy, 68, 58)), F.ring(902 + hx, 390, .5), { fillFn: null, fill: c0('catW'), w: .45, len: .5, outline: true });
    put('catO', C(smooth([[-58, -250], [-42, -288], [0, -298], [44, -288], [60, -250], [24, -238], [2, -222], [-20, -238]]).map(([x, y]) => [x + hx, y + hy])), F.dir(90, .5, 40), { group: last(), accentP: .4, w: .4, len: .45 });
    if (extra) extra(S, { put, pal, sw, c0, c1 });
    return S;
  }

  // ---------- palettes ----------
  const VG = { wall: ['#6b9cc4', '#93bccb'], floor: ['#a8643a', '#7a4028'], frame: '#c9b04a', sky: ['#1b3580', '#3566b8'], star: ['#fff6c4', '#e9d36a'], starEdge: '#7fb6c9', moon: ['#ffe98a', '#f0a83a'], moonEdge: '#8fbf9f', hill: ['#3a66ad', '#22407f'], tree: '#16352f', sill: '#e2d6a8', chair: '#d9a82e', seat: '#c9b46a',
    tableLeg: '#8a4a22', tableSide: '#a85a26', table: ['#d39a3a', '#c07f2a'], stem: '#4f7a34', leaf: '#557f36', vase: ['#c98f1e', '#ecdca6'], petal: ['#e9a51a', '#f0c62a'], disc: '#6f5a22', cup: ['#f1ecdc', '#b9c9d9'], catW: ['#f4ead4', '#d9cdb6'], catO: '#d9812a', ear: '#c9701f', steam: '#dfe9ee',
    acc: { sky: ['#7fb0e6', '#e9e2a0', '#16306e', '#4f8fd6', '#9fd0d8'], wall: ['#a9cfc6', '#a9c4e6'], floor: ['#c98a4a', '#5d6b3a', '#d9a05a'], tree: ['#3c6a3a', '#5a7f3a', '#3a2a1a'], table: ['#e9c05a', '#8fa04a'], hill: ['#6f9fd6', '#5f8f6a'], catW: ['#ffffff', '#c9c0d6'], catO: ['#f0b05a', '#a8521a'], petal: ['#f8e06a', '#d9841a'], disc: ['#c9862a', '#3a2a14'] } };
  const PAL = {
    cave: { bare: ['wall', 'floor'], wall: '#b08a5e', floor: '#8a6a4a', frame: '#8a3b22', sky: ['#33261f', '#5a4034'], star: ['#efe6d2', '#b9a88a'], starEdge: '#4a3830', moon: ['#efe6d2', '#c08a3a'], moonEdge: '#4a3830', hill: '#6a3a24', tree: '#2a2320', sill: '#c08a3a', chair: '#8a3b22', seat: '#c08a3a', tableLeg: '#7a3a20', tableSide: '#8a4424', table: ['#a8582c', '#96481f'],
      stem: '#2a2320', leaf: '#5a4a2a', vase: ['#8a3b22', '#c9a26a'], petal: ['#c08a3a', '#d9a84a'], disc: '#3a2a20', cup: ['#e6dcc8', '#b9a88a'], catW: ['#efe6d2', '#d6c6a8'], catO: '#a8502a', ear: '#8a3b22', accP: .2 },
    egypt: { wall: ['#e6cf96', '#dcc084'], floor: ['#b98a52', '#a3743e'], frieze: ['#2e6f73', '#c2452d', '#e0b23a', '#2f4f8a'], frame: '#2e6f73', sky: ['#1f3560', '#274a7a'], skyCalm: 1, star: ['#f0c648', '#f0c648'], starShape: 'five', moon: ['#c2452d', '#d9642d'], moonEdge: '#e0863a', moonLine: true, hill: ['#d9a85a', '#c08a3e'], tree: '#3f6f4a', sill: '#f1e6c8',
      chair: '#b9822e', seat: '#e0c98a', tableLeg: '#7a4a22', tableSide: '#8a5226', table: ['#c08a3e', '#a8742e'], stem: '#3f6f4a', leaf: '#4f8a5a', vase: ['#2e6f73', '#e6d9b0'], petal: ['#e0b23a', '#e8c04a'], disc: '#7a3a1c', cup: ['#f1e6c8', '#d9c9a0'], catW: ['#f6eedb', '#e6dcc0'], catO: '#c9722a', ear: '#b9621f', accP: .12 },
    mosaic: { wall: ['#c9a23a', '#b98a2a'], floor: ['#b9a88a', '#9a8a70'], frame: '#7a2e2e', sky: ['#1a2f6a', '#27478f'], star: ['#f1d67a', '#c9a23a'], starEdge: '#27478f', moon: ['#f6ecc8', '#d9b04a'], moonEdge: '#27478f', hill: ['#2f6a5a', '#1f4a4a'], tree: '#1f3f2f', sill: '#e6dcc0', chair: '#8a4a2a', seat: '#c9a26a', tableLeg: '#5a2e2e', tableSide: '#6a3434', table: ['#8a3a3a', '#7a2e2e'],
      stem: '#2f6a3a', leaf: '#3f7a4a', vase: ['#27478f', '#e6dcc0'], petal: ['#e0a82a', '#f0c64a'], disc: '#5a3a1a', cup: ['#f1ead8', '#b9c0c9'], catW: ['#f1ead8', '#d6cbb4'], catO: '#c9722a', ear: '#a85a1f', acc: { wall: ['#e6c65a', '#8a6a1a', '#d9b04a', '#f1d67a'], sky: ['#3f6fb8', '#101f4a'] }, accP: .4 },
    ren: { wall: ['#6f6248', '#574a36'], floor: ['#7a4e34', '#5a3624'], frame: '#4a3420', sky: ['#6f97a8', '#dccda0'], skyCalm: 1, star: ['#f6ecc8', '#b9c0b0'], starK: .5, starEdge: '#8fa9a8', moon: ['#f8f0d0', '#e6d6a0'], moonEdge: '#8faaa8', hill: ['#6a8a8a', '#4f6f6a'], tree: '#2a3a26', sill: '#8a7a5a', chair: '#6a4a2a', seat: '#8a6a3a', tableLeg: '#4a2e1c', tableSide: '#5a3a22', table: ['#6a4428', '#5a3a22'],
      stem: '#3a5a2a', leaf: '#3f5f2e', vase: ['#7a5a30', '#b9a070'], petal: ['#c9982a', '#d9aa3a'], disc: '#3a2a14', cup: ['#d9d0b8', '#9a9280'], catW: ['#ebdfc4', '#a89878'], catO: '#b9682a', ear: '#9a5420', accP: .2 },
    ukiyo: { wall: ['#eadfc6', '#e2d4b6'], floor: ['#b9b47e', '#a8a26c'], frame: '#3a2a22', sky: ['#16346e', '#c9dde6'], skyCalm: 1, star: ['#ffffff', '#dfe9ee'], starK: .45, starEdge: '#5f7fae', moon: ['#f8f4e6', '#eef1ea'], moonEdge: '#5f80b0', fuji: 1, hill: ['#3f5f8f', '#6f8fb0'], snow: '#f8f4e6', mist: '#f1ece0', tree: '#2f4f3a', sill: '#5a4030', chair: '#7a4a32', seat: '#c9b98a',
      tableLeg: '#6a2a22', tableSide: '#8a2e26', table: ['#a83a2a', '#96322a'], stem: '#3a6a3a', leaf: '#4a7a4a', vase: ['#e9ecea', '#3f5f9a'], petal: ['#e0a82a', '#e8b83a'], disc: '#5a3a1a', cup: ['#f1ece0', '#b9c6d6'], catW: ['#f8f4e6', '#e9e2d0'], catO: '#d9862f', ear: '#c9722a', steam: '#f1ece0', accP: 0 },
    imp: { wall: ['#c4cbe0', '#d6d0e0'], floor: ['#c9a27a', '#b08a6a'], frame: '#ebe6da', sky: ['#8fb8e0', '#e9dccb'], skyCalm: 1, moon: ['#fff4cc', '#f6d08a'], moonEdge: '#b9cfe6', hill: ['#8fb08a', '#6f9a7a'], tree: '#4f8a5a', sill: '#f1ece0', chair: '#c99a4a', seat: '#d9c08a', tableLeg: '#9a6a4a', tableSide: '#e6e0d6', table: ['#f4efe6', '#dcd6e0'],
      stem: '#5a8a4a', leaf: '#6a9a52', vase: ['#6a8fc0', '#e6e6ea'], petal: ['#f0b82a', '#f6d04a'], disc: '#7a4a1c', cup: ['#f6f1e6', '#c9d0e0'], catW: ['#f8f2e6', '#d6d0dc'], catO: '#e08a34', ear: '#d07a2a', steam: '#ffffff',
      acc: { sky: ['#ffffff', '#f6c6b0', '#b0c6f0', '#f6e6b0'], wall: ['#e6c6d0', '#b0c0e6', '#f1e6c0'], floor: ['#e6b08a', '#9a8ab0'], hill: ['#c9d98a', '#6a8ab0'], tree: ['#8fc06a', '#3a6a7a'], table: ['#ffffff', '#c6c0e6', '#f6dcc0'], catW: ['#ffffff', '#c9c0e6'] }, accP: .42 },
    point: { wall: ['#dcb98a', '#e6c79a'], floor: ['#8f6fa8', '#7a5a96'], frame: '#efe3ba', sky: ['#9fc0e6', '#f4e6b8'], skyCalm: 1, moon: ['#fff2b0', '#f6c85a'], moonEdge: '#b9d0e0', hill: ['#7fae6a', '#5f9460'], tree: '#3f7a5a', sill: '#f4ecd0', chair: '#d99a3a', seat: '#e6c98a', tableLeg: '#8a4a5a', tableSide: '#a85a5a', table: ['#c9624a', '#b0523f'],
      stem: '#4f8a44', leaf: '#5f9a4a', vase: ['#3f6fb0', '#f1e6c8'], petal: ['#f0b020', '#f6cc40'], disc: '#7a4a1c', cup: ['#f6f1e0', '#c0c9e0'], catW: ['#fbf4e0', '#d9cfe0'], catO: '#e88a2a', ear: '#d0762a', accP: .1 },
    vg: VG,
    pop: { wall: '#ffd62e', floor: '#e23b3b', frame: '#1e6fe0', sky: '#1a2fa8', skyCalm: 1, star: ['#ffffff', '#ffffff'], starShape: 'five', starLine: true, moon: ['#fff36a', '#fff36a'], moonEdge: '#fff36a', moonLine: true, hill: '#ff5fa2', tree: '#12a05a', sill: '#ffffff', chair: '#28b8e0', seat: '#ffffff', tableLeg: '#1e6fe0', tableSide: '#1e6fe0', table: '#28b8e0',
      stem: '#12a05a', leaf: '#12a05a', vase: ['#ff5fa2', '#ffffff'], petal: '#fff36a', disc: '#7a2e0a', cup: '#ffffff', catW: '#ffffff', catO: '#ff8a1e', ear: '#ff8a1e', steam: '#ffffff', accP: 0, tones: { wall: [.26, '#ff8a2e'], sky: [.34, '#4f7fff'], catW: [.2, '#9fb6e6'], floor: [.3, '#a81e2e'], hill: [.26, '#d93a82'], table: [.26, '#1a8fb8'] } },
    pixel: { wall: ['#4a5ac8', '#5a6ad8'], floor: ['#8a4a2a', '#6a3418'], frame: '#d8b838', sky: ['#0c1238', '#18246a'], skyCalm: 1, star: ['#ffffff', '#a8c8ff'], starK: .5, starEdge: '#18246a', moon: ['#f8e86a', '#e8a838'], moonEdge: '#18246a', hill: ['#243a9a', '#1a2a7a'], tree: '#146a3a', sill: '#e8e0b8', chair: '#d89828', seat: '#e8c868', tableLeg: '#7a3a18', tableSide: '#9a4a20', table: ['#c8822a', '#b06a20'],
      stem: '#2a8a3a', leaf: '#3aa04a', vase: ['#c88a20', '#f0e0a0'], petal: ['#f8c828', '#f8d848'], disc: '#6a3a10', cup: ['#f8f0e0', '#a8b8d8'], catW: ['#f8f0e0', '#d8d0c0'], catO: '#e8862a', ear: '#c86a1a', steam: '#ffffff', accP: 0 },
  };

  // ---------- media ----------
  const hands = {};
  function hand(seed) { if (hands[seed]) return hands[seed]; const c = mk(240, 280), g = c.getContext('2d'), R = rng(seed);
    const gr = g.createRadialGradient(120, 150, 30, 120, 150, 130); gr.addColorStop(0, 'rgba(138,52,30,.85)'); gr.addColorStop(.6, 'rgba(150,66,34,.5)'); gr.addColorStop(1, 'rgba(150,66,34,0)'); g.fillStyle = gr; g.fillRect(0, 0, 240, 280);
    for (let i = 0; i < 900; i++) { const a = R() * 6.28, d = 40 + R() * 95; g.fillStyle = `rgba(120,44,26,${R() * .5})`; g.fillRect(120 + Math.cos(a) * d, 150 + Math.sin(a) * d, 1.6, 1.6); }
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.strokeStyle = '#000'; g.lineCap = 'round'; g.beginPath(); g.ellipse(120, 176, 34, 40, 0, 0, 6.3); g.fill();
    [[-66, 52, 15], [-22, 76, 14], [0, 84, 15], [22, 74, 14], [46, 56, 12]].forEach(([deg, l, w], i) => { const a = (deg - 90) * Math.PI / 180, bx = 120 + (i - 2) * 13, by = i ? 150 : 176; g.lineWidth = w; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + Math.cos(a) * l, by + Math.sin(a) * l); g.stroke(); });
    return (hands[seed] = c); }
  const IMPASTO = { ground: '#7d7f9e', bristles: .26, relief: .2, jit: .13, sat: 1.12, contour: { style: 'brush', w: 7, color: '#1d2a66' },
    passes: [{ w: 30, len: 150, gap: 26, calm: .5, alpha: .96 }, { w: 17, len: 95, gap: 13, alpha: .95 }, { w: 9, len: 52, gap: 9, detail: .12, alpha: .95 }, { w: 4.6, len: 26, gap: 5.5, detail: .34, alpha: .96 }] };
  const MEDIA = {
    cave(g, S, t, pr) {
      paint(g, S, { base: 'none', bristles: .5, relief: 0, jit: .16, passes: [{ w: 20, len: 60, gap: 15, alpha: .42 }, { w: 9, len: 30, gap: 9, alpha: .4, detail: .2 }], contour: { style: 'charcoal', w: 11, color: '#221a16', alpha: .55, force: true } }, { t, probe: pr,
        under: (c) => { c.drawImage(tex('rock'), 0, 0); [[150, 150, 3, -.2], [330, 250, 5, .15], [1300, 110, 8, .3], [1790, 300, 11, -.1]].forEach(([x, y, s, a]) => { c.save(); c.translate(x, y); c.rotate(a); c.globalAlpha = .8; c.drawImage(hand(s), -120, -140); c.restore(); }); c.save(); c.globalAlpha = .9; for (const r of S.regions) if (r.sprite) r.put(c); c.restore(); } });
      lay(g, 'grain'); const fl = .5 + .5 * fbm(t * 5, 2.2, 3), gr = g.createRadialGradient(900 + Math.sin(t * 3) * 30, 470, 300 + fl * 60, 900, 500, 1180); gr.addColorStop(0, 'rgba(255,170,80,.06)'); gr.addColorStop(.45, `rgba(60,30,14,${.3 + fl * .1})`); gr.addColorStop(1, 'rgba(14,8,6,.9)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    },
    egypt(g, S, t, pr) {
      paint(g, S, { base: 'flat', bristles: .1, relief: 0, jit: .05, accK: .3, passes: [{ w: 14, len: 40, gap: 11, alpha: .45 }], contour: { style: 'ink', w: 5, color: '#5a2416', force: true } }, { t, probe: pr });
      g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = .22; g.drawImage(tex('rock'), 0, 0); g.restore(); lay(g, 'crackle', 'multiply', .8); lay(g, 'grain');
      const x = ((t * 260) % 3200) - 600, gr = g.createLinearGradient(x, 0, x + 520, 300); gr.addColorStop(0, 'rgba(255,236,170,0)'); gr.addColorStop(.5, 'rgba(255,236,170,.2)'); gr.addColorStop(1, 'rgba(255,236,170,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);   // a lamp carried past
    },
    mosaic(g, S, t, pr) {
      paint(g, S, { groundFill: '#33291f', jit: .15, edgeDark: .86, contourColor: '#241826', passes: [{ kind: 'tile', w: 9.5, gap: 9.5, alpha: 1 }] }, { t, probe: pr });
      g.save(); g.globalCompositeOperation = 'soft-light'; const x = ((t * 520) % 3600) - 800, gr = g.createLinearGradient(x, 0, x + 700, 400); gr.addColorStop(0, 'rgba(255,240,190,0)'); gr.addColorStop(.5, 'rgba(255,240,190,.75)'); gr.addColorStop(1, 'rgba(255,240,190,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
      const n = (t * PAINT_FPS) | 0; for (let i = 0; i < 110; i++) { const gx = (hash(i, n, 5) * 202) | 0, gy = (hash(i, n, 9) * 114) | 0, x0 = gx * 9.5, y0 = gy * 9.5, id = pr.idAt(x0, y0); if (id > 0 && S.regions[id - 1].key === 'wall') { g.fillStyle = 'rgba(255,246,200,.75)'; g.fillRect(x0 - 4, y0 - 4, 8, 8); } }   // gold catching the light
      lay(g, 'grain');
    },
    ren(g, S, t, pr) {
      paint(g, S, { base: 'flat', bristles: .08, relief: 0, jit: .05, accK: 0, passes: [{ w: 12, len: 34, gap: 8, alpha: .3 }, { w: 6, len: 16, gap: 6, alpha: .3, detail: .2 }] }, { t, probe: pr });
      g.save(); g.globalCompositeOperation = 'multiply'; let gr = g.createRadialGradient(860, 400, 200, 900, 480, 1250); gr.addColorStop(0, '#fff6e0'); gr.addColorStop(.5, '#b89a70'); gr.addColorStop(1, '#3a2a1c'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
      g.save(); g.globalCompositeOperation = 'screen'; const sx = Math.sin(t * .6) * 40; gr = g.createLinearGradient(860, 620, 760 + sx, 1080); gr.addColorStop(0, 'rgba(255,226,160,.34)'); gr.addColorStop(1, 'rgba(255,226,160,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(600, 650); g.lineTo(1120, 650); g.lineTo(1180 + sx, 1080); g.lineTo(360 + sx, 1080); g.closePath(); g.fill();
      for (let i = 0; i < 46; i++) { const u = (hash(i, 3, 1) + t * (.03 + hash(i, 4, 1) * .05)) % 1, x = 640 + hash(i, 5, 1) * 440 + Math.sin(t * .8 + i) * 22 + (u - .5) * 60, y = 660 + u * 400; g.fillStyle = `rgba(255,236,190,${.25 + .4 * Math.sin(u * 3.14)})`; g.beginPath(); g.arc(x, y, 1.2 + hash(i, 6, 1) * 1.8, 0, 6.3); g.fill(); } g.restore();
      lay(g, 'crackle', 'multiply', 1); lay(g, 'grain');
    },
    ukiyo(g, S, t, pr) {
      g.fillStyle = '#eadfc6'; g.fillRect(0, 0, W, H); g.drawImage(S.albedo, 3, 2);
      lay(g, 'wood', 'multiply', 1); lay(g, 'wood', 'multiply', 1);
      E.contours(g, S, { style: 'ink', w: 3.2, color: '#1c1a20', force: true }, pr); E.contours(g, S, { style: 'ink', w: 1.2, color: '#1c1a20', force: true, alpha: .5 }, pr);
      lay(g, 'fibre', 'multiply', 1); lay(g, 'grain');
    },
    imp(g, S, t, pr) {
      paint(g, S, { ground: '#cfc9d6', bristles: .16, relief: .08, jit: .2, sat: .98, tint: [236, 226, 240], tintK: .08, passes: [{ w: 22, len: 34, gap: 18, calm: .6, alpha: .9 }, { w: 13, len: 22, gap: 9, alpha: .9 }, { w: 7, len: 13, gap: 6, detail: .15, alpha: .92 }] }, { t, probe: pr });
      lay(g, 'weave', 'source-over');
    },
    point(g, S, t, pr) {
      const cm = (c, R) => { const l = lumOf(c), u = R(), k = sat(c, 1.3); return u < .1 + .2 * l ? mix(k, [255, 214, 90], .38) : u > 1 - (.07 + .16 * (1 - l)) ? mix(k, [58, 70, 190], .36) : k; };
      paint(g, S, { groundFill: '#ebe2ca', jit: .1, colorMap: cm, passes: [{ kind: 'dot', w: 8.4, gap: 5.6, alpha: .96 }, { kind: 'dot', w: 7.4, gap: 5.6, alpha: .96 }, { kind: 'dot', w: 6.4, gap: 5.6, alpha: .96 }] }, { t, probe: pr });
      lay(g, 'weave', 'source-over');
    },
    vg(g, S, t, pr) {
      paint(g, S, IMPASTO, { t, probe: pr, over: (c) => { const R = rng(77); for (let i = 0; i < 9; i++) { const x = 700 + R() * 420, y = 560 + R() * 40; if (Math.sin(t * 2 + i * 2.1) > -.4) E.brush(c, [[x, y], [x + 9, y + 1]], 6, hex('#f2c94a'), IMPASTO, .95, R); } } });
      lay(g, 'weave', 'source-over');
    },
    pop(g, S, t, pr) {
      paint(g, S, { base: 'flat', contour: { style: 'ink', w: 8, color: '#111111', force: true } }, { t, probe: pr,
        under: (c) => { const gp = 15, k = gp * .7071; for (let i = -100; i <= 100; i++) for (let j = -100; j <= 100; j++) { const x = 960 + (i - j) * k, y = 540 + (i + j) * k; if (x < -8 || y < -8 || x > W + 8 || y > H + 8) continue; const id = pr.idAt(x, y); if (id <= 0) continue; const r = S.regions[id - 1]; if (!r.tone) continue;
          const rad = r.tone * gp * (1 + .28 * Math.sin(t * 4 - (x + y) / 170)); c.fillStyle = r.toneColor; c.beginPath(); c.arc(x, y, rad, 0, 6.2832); c.fill(); } } });
      lay(g, 'grain');
    },
    pixel(g, S, t, pr) {
      const px = 8, lw = W / px, lh = H / px, low = MEDIA._low || (MEDIA._low = mk(lw, lh)), l = low.getContext('2d', { willReadFrequently: true }); l.imageSmoothingEnabled = true; l.drawImage(S.albedo, 0, 0, lw, lh);
      const im = l.getImageData(0, 0, lw, lh), d = im.data, B = [0, 2, 3, 1], Lv = 6, tw = (t * 6) | 0;
      for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) { const k = (y * lw + x) * 4, b = (B[(x & 1) + (y & 1) * 2] + .5) / 4 - .5, id = pr.idAt(x * px + 4, y * px + 4), ir = pr.idAt(x * px + 12, y * px + 4), idn = pr.idAt(x * px + 4, y * px + 12), g0 = pr.grp(id);
        const rA = id > 0 && S.regions[id - 1], line = id > 0 && ((ir > 0 && pr.grp(ir) !== g0 && (rA.outline || S.regions[ir - 1].outline)) || (idn > 0 && pr.grp(idn) !== g0 && (rA.outline || S.regions[idn - 1].outline)));
        if (line) { d[k] = 16; d[k + 1] = 16; d[k + 2] = 44; continue; }
        if (rA && rA.key === 'sky' && hash(x, y, 3) > .993 && ((hash(x, y, 4) * 8 + tw) & 3)) { d[k] = d[k + 1] = d[k + 2] = 255; continue; }
        for (let c = 0; c < 3; c++) d[k + c] = Math.max(0, Math.min(255, Math.round((d[k + c] / 255 * (Lv - 1)) + b * .45) / (Lv - 1) * 255)); }
      l.putImageData(im, 0, 0); g.imageSmoothingEnabled = false; g.drawImage(low, 0, 0, W, H); g.imageSmoothingEnabled = true;
      g.fillStyle = 'rgba(0,0,20,.07)'; for (let y = 0; y < H; y += px) g.fillRect(0, y + px - 2, W, 2);
    },
  };

  // ---------- the film ----------
  const ERAS = [
    { id: 'cave', year: '约四万年前', name: '洞穴壁画', dur: 3.6 }, { id: 'egypt', year: '公元前1350', name: '古埃及墓室壁画', dur: 2.4 }, { id: 'mosaic', year: '547', name: '拜占庭镶嵌画', dur: 2.4 },
    { id: 'ren', year: '1503', name: '文艺复兴油画', dur: 2.4 }, { id: 'ukiyo', year: '1831', name: '浮世绘', dur: 2.4 }, { id: 'imp', year: '1872', name: '印象派', dur: 2.4 }, { id: 'point', year: '1886', name: '点彩', dur: 2.4 },
    { id: 'vg', year: '1889', name: '后印象派', dur: 3.6 }, { id: 'pop', year: '1962', name: '波普', dur: 2.4 }, { id: 'pixel', year: '1985', name: '像素', dur: 2.4 },
  ];
  let acc = 0; ERAS.forEach((e) => { e.t0 = acc; acc += e.dur; }); const T_FIN = acc, DUR = T_FIN + 3.6, TR = .35;
  const cache = {};
  function eraCanvas(i, tq) { const e = ERAS[i], c = cache[e.id] || (cache[e.id] = { cv: mk(), tq: -1 }); if (c.tq !== tq) { const g = c.cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H); const S = room(PAL[e.id], tq, 'a'); MEDIA[e.id](g, S, tq, probe(S)); c.tq = tq; } return c.cv; }
  const ease = (x) => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x), eo = (x) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
  const maskC = mk(), tmpC = mk(), frameC = mk();
  // the next way of painting arrives as sweeps of a wide brush
  function swipes(p, k) { const m = maskC.getContext('2d'); m.clearRect(0, 0, W, H); const ang = [-.32, .5, 2.7, .2, -1.2, 3.4, .9, -.5, 2.2, 1.57][k % 10], dx = Math.cos(ang), dy = Math.sin(ang), N = 15, Ln = 2500, span = 2400; m.lineCap = 'round'; m.strokeStyle = '#fff';
    for (let i = 0; i < N; i++) { const a0 = (i / N) * .55 + hash(i, k, 2) * .06, q = eo((p - a0) / .42); if (q <= 0) continue; const o = ((i + .5) / N - .5) * span, x0 = 960 - dy * o - dx * Ln / 2, y0 = 540 + dx * o - dy * Ln / 2, wd = span / N * 1.5, nh = 12;
      for (let h = 0; h < nh; h++) { const oo = ((h + .5) / nh - .5) * wd, l = Ln * q * (.9 + .1 * hash(h, i, k + 3)) - 40, sx = x0 - dy * oo, sy = y0 + dx * oo; if (l <= 0) continue; m.lineWidth = wd / nh * 1.7; m.beginPath(); m.moveTo(sx, sy); m.lineTo(sx + dx * l, sy + dy * l); m.stroke(); } } return maskC; }
  const seamX = (i, y) => i <= 0 ? -10 : i >= 10 ? W + 10 : i * 192 + (fbm(y / 150, i * 3.1, 7) - .5) * 90;
  // the film sits on a 100 BPM grid (a beat is 0.6 s): 6 beats in the cave, 4 for each way of painting, 6 for Van Gogh, 6 for the end
  const CAM = [[0, 1, 960, 540], [3.6, 1.1, 900, 500], [8.4, 1.2, 940, 470], [13.2, 1.24, 1180, 480], [18, 1.3, 900, 440], [21.4, 1.4, 880, 400], [24, 1.14, 960, 520], [T_FIN, 1.06, 960, 540], [T_FIN + .9, 1, 960, 540], [DUR, 1.03, 960, 540]];
  function camera(t) { let i = 0; while (i < CAM.length - 2 && t > CAM[i + 1][0]) i++; const a = CAM[i], b = CAM[i + 1], u = ease((t - a[0]) / (b[0] - a[0])); let s = a[1] + (b[1] - a[1]) * u, x = a[2] + (b[2] - a[2]) * u, y = a[3] + (b[3] - a[3]) * u;
    for (const e of ERAS) if (e.t0 > 0 && t >= e.t0 - .05 && t < T_FIN) s += .035 * Math.exp(-(t - e.t0 + .05) * 5);
    x = Math.max(W / 2 / s, Math.min(W - W / 2 / s, x)); y = Math.max(H / 2 / s, Math.min(H - H / 2 / s, y)); return [s, x, y]; }

  function compose(t) {
    const tq = Math.floor(t * PAINT_FPS + 1e-6) / PAINT_FPS, f = frameC.getContext('2d'); f.setTransform(1, 0, 0, 1, 0, 0); f.globalAlpha = 1; f.globalCompositeOperation = 'source-over';
    let label = null;
    if (t < T_FIN) { let i = ERAS.length - 1; while (i > 0 && t < ERAS[i].t0 - TR) i--; const e = ERAS[i], nx = ERAS[i + 1];
      f.drawImage(eraCanvas(i, tq), 0, 0); label = e;
      if (nx && t > nx.t0 - TR) { const p = (t - (nx.t0 - TR)) / (2 * TR); const c = tmpC.getContext('2d'); c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, W, H); c.drawImage(eraCanvas(i + 1, tq), 0, 0); c.globalCompositeOperation = 'destination-in'; c.drawImage(swipes(p, i), 0, 0); f.drawImage(tmpC, 0, 0); if (p > .3) label = nx; }
      else if (i > 0 && t < e.t0 + TR) { /* arriving: the mask of the previous transition is still closing */ const p = (t - (e.t0 - TR)) / (2 * TR), pv = ERAS[i - 1]; f.drawImage(eraCanvas(i - 1, tq), 0, 0); const c = tmpC.getContext('2d'); c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, W, H); c.drawImage(eraCanvas(i, tq), 0, 0); c.globalCompositeOperation = 'destination-in'; c.drawImage(swipes(p, i - 1), 0, 0); f.drawImage(tmpC, 0, 0); label = p > .3 ? e : pv; }
    } else { // all of it at once: ten strips, ten ways of painting the same window
      f.drawImage(eraCanvas(ERAS.length - 1, tq), 0, 0);
      for (let i = 0; i < 10; i++) { const p = eo((t - T_FIN - i * .085) / .3); if (p <= 0) continue; const top = i % 2 === 0, y0 = top ? 0 : H * (1 - p), y1 = top ? H * p : H;
        f.save(); f.beginPath(); for (let y = y0; y <= y1 + 1; y += 12) f.lineTo(seamX(i, y), y); for (let y = y1; y >= y0 - 1; y -= 12) f.lineTo(seamX(i + 1, y), y); f.closePath(); f.clip(); f.drawImage(eraCanvas(i, tq), 0, 0); f.restore(); }
      label = { year: '四万年', name: '同一扇窗', fin: 1 };
    }
    return label;
  }
  function drawLabel(g, lab, t) { if (!lab) return; g.save(); g.textBaseline = 'alphabetic'; g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 14; g.shadowOffsetY = 2; g.fillStyle = '#fffaf0';
    const serif = '"Songti SC","Noto Serif CJK SC","Source Han Serif SC",serif';
    g.font = `900 62px ${serif}`; g.fillText(lab.year, 76, 1000); const w = g.measureText(lab.year).width; g.font = `600 30px ${serif}`; g.globalAlpha = .92; g.fillText(lab.name, 76 + w + 22, 998); g.restore(); }
  // a still of one way of painting, with something added to the room (a character, a prop)
  const paintEra = (id, t, extra, cv) => { cv = cv || mk(); const g = cv.getContext('2d'); g.clearRect(0, 0, W, H); const S = room(PAL[id], t, 'x', extra); MEDIA[id](g, S, t, probe(S)); return cv; };
  window.SPR = {}; window.loadSprites = (map) => Promise.all(Object.entries(map).map(([k, urls]) => Promise.all(urls.map((u) => new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.src = u; }))).then((a) => { window.SPR[k] = a; }))).then(() => Object.keys(window.SPR));
  window.FILM = { room, PAL, MEDIA, IMPASTO, lg, rg, swipes, paintEra, drawLabel, FPS, DUR, frames: Math.round(DUR * FPS), ERAS, T_FIN,
    frame(i) { const t = i / FPS, c = document.getElementById('c'), g = c.getContext('2d'), lab = compose(t), [s, x, y] = camera(t); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.setTransform(s, 0, 0, s, W / 2 - s * x, H / 2 - s * y); g.imageSmoothingQuality = 'high'; g.drawImage(frameC, 0, 0); g.setTransform(1, 0, 0, 1, 0, 0); drawLabel(g, lab, t); return c.toDataURL('image/jpeg', .95); },
    still(id, t) { const i = ERAS.findIndex((e) => e.id === id), c = document.getElementById('c'), g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(eraCanvas(i, t), 0, 0); drawLabel(g, ERAS[i], t); return c.toDataURL('image/jpeg', .93); } };
})();
