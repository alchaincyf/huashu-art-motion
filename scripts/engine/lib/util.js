// Shared utilities (loaded first, shared by transitions/engine)
(() => {
// ---------- Helpers ----------
window.U = {
  TAU: Math.PI * 2,
  clamp: (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)),
  lerp: (a, b, p) => a + (b - a) * p,
  // smoothstep: x in [a,b] smoothly maps 0→1 (draw-on, fades, segment rhythm)
  ss: (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); },
  // Map p interval [a,b] linearly to 0..1 (transition phases)
  seg: (p, a, b) => Math.max(0, Math.min(1, (p - a) / (b - a))),
  // Stepped fps quantizes time; discrete motion defines many styles:
  // Rubber-hose cartoons12fps on twos, rod-operated shadows10fps, Haring dancers8fps cuts, boiling line8–12fps, film24fps.
  stepTime: (t, fps) => Math.floor(t * fps) / fps,
  ease: {
    linear: p => p,
    inOut: p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2,
    out: p => 1 - Math.pow(1 - p, 3),
    in: p => p * p * p,
    outBack: p => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
  },
  // Seeded random: mulberry32
  rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; },
  hash(i, j = 0) { let h = (i * 374761393 + j * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; },
  // Points → Path2D (polyline)
  poly(pts, closed = true) { const p = new Path2D(); pts.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); if (closed) p.closePath(); return p; },
};

// ---------- Canvas dimensions ----------
// Default 1920×1080. Portrait clips (clip.html spec.width/height), portrait films (index.html?w=1080&h=1920 or eras.js window.FILM_SIZE = [1080,1920])
// Call U.setStage(w,h) once at startup. Size-dependent libraries (PAINT / BRUSH / RENDER / POST / KIT / TOON / CAM / UI / CH / DG / CL / MD, transitions.js, engine.js)
// Register U.onStage to update on size changes; immediate callback uses current size, including late-loaded libraries.
// 35 art scenes (scenes/) assume 1920×1080; portrait guaranteed only for explainer grammars, transitions, engine.
const stageHooks = [];
window.STAGE = { W: 1920, H: 1080 };
U.onStage = f => { stageHooks.push(f); f(window.STAGE.W, window.STAGE.H); };
U.setStage = (w, h) => { w = Math.round(+w); h = Math.round(+h); if (!(w > 0 && h > 0)) throw new Error(`U.setStage：尺寸不对 ${w}×${h}`); window.STAGE = { W: w, H: h }; stageHooks.forEach(f => f(w, h)); };

// ---------- Glyph checking ----------
// Missing glyphs silently fall back to system fonts: measureText succeeds with correct widths, but machines differ (migration tests B,D: full-width letters, ▶, 戏, 蓝).
// At startup after fonts load (engine boot), read each FONT_FACES font's cmap (WOFF1 zlib via DecompressionStream), check glyph presence directly.
// Avoid measureText fallback comparison: macOS Chromium per-character fallback chooses system fonts based on primary family, so two expressions fall back differently and miss missing glyphs (observed false results).
// font accepts family ('LXGWWenKai-500') or CSS ('80px "LXGWWenKai-500"'); family absent from FONT_FACES → all glyphs missing.
const famOf = font => { const m = /"([^"]+)"/.exec(font) || /'([^']+)'/.exec(font); return m ? m[1] : String(font).replace(/^(italic\s+|bold\s+|\d+\s+)*[\d.]+px\s+/, '').trim(); };
const CMAPS = {};
const inflate = async (buf) => new Uint8Array(await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
async function readCmap(url) {
  const ab = await (await fetch(url)).arrayBuffer(), dv = new DataView(ab), sig = dv.getUint32(0);
  let tab = null;
  if (sig === 0x774F4646) {                                            // 'wOFF'
    const n = dv.getUint16(12);
    for (let i = 0; i < n; i++) { const o = 44 + i * 20; if (dv.getUint32(o) !== 0x636D6170) continue;   // 'cmap'
      const off = dv.getUint32(o + 4), comp = dv.getUint32(o + 8), orig = dv.getUint32(o + 12), raw = new Uint8Array(ab, off, comp);
      tab = comp < orig ? await inflate(raw) : raw.slice(); }
  } else {                                                             // Raw TTF/OTF
    const n = dv.getUint16(4);
    for (let i = 0; i < n; i++) { const o = 12 + i * 16; if (dv.getUint32(o) === 0x636D6170) tab = new Uint8Array(ab, dv.getUint32(o + 8), dv.getUint32(o + 12)).slice(); }
  }
  if (!tab) throw new Error('没有 cmap 表');
  const t = new DataView(tab.buffer, tab.byteOffset, tab.byteLength), set = new Set(), nt = t.getUint16(2);
  for (let i = 0; i < nt; i++) {
    const so = t.getUint32(4 + i * 8 + 4), fmt = t.getUint16(so);
    if (fmt === 4) { const segX2 = t.getUint16(so + 6), ends = so + 14, starts = ends + segX2 + 2, deltas = starts + segX2, ros = deltas + segX2;
      for (let k = 0; k < segX2 / 2; k++) { const e = t.getUint16(ends + k * 2), s = t.getUint16(starts + k * 2), d = t.getInt16(deltas + k * 2), ro = t.getUint16(ros + k * 2);
        for (let ch = s; ch <= e && ch !== 0xFFFF; ch++) { let g; if (!ro) g = (ch + d) & 0xFFFF; else { g = t.getUint16(ros + k * 2 + ro + (ch - s) * 2); if (g) g = (g + d) & 0xFFFF; } if (g) set.add(ch); } } }
    else if (fmt === 12 || fmt === 13) { const ng = t.getUint32(so + 12); for (let k = 0; k < ng; k++) { const o = so + 16 + k * 12, s = t.getUint32(o), e = t.getUint32(o + 4), g = t.getUint32(o + 8);
      for (let ch = s; ch <= e; ch++) if (fmt === 13 ? g : g + ch - s) set.add(ch); } }
    else if (fmt === 0) { for (let ch = 0; ch < 256; ch++) if (t.getUint8(so + 6 + ch)) set.add(ch); }
    else if (fmt === 6) { const first = t.getUint16(so + 6), cnt = t.getUint16(so + 8); for (let k = 0; k < cnt; k++) if (t.getUint16(so + 10 + k * 2)) set.add(first + k); }
  }
  return set;
}
// Call once during engine boot after font loading. Font read failures console.error without blocking startup.
U.loadCmaps = async (faces = window.FONT_FACES || []) => {
  await Promise.all(faces.map(async f => { try { CMAPS[f.family] = await readCmap(f.url); } catch (e) { console.error(`读不了字体 ${f.family} 的 cmap：${e}`); } }));
};
U.missingGlyphs = (font, text) => {
  const fam = famOf(font), cm = CMAPS[fam];
  const chars = [...new Set([...String(text)])].filter(ch => !/\s/.test(ch));
  if (!cm) return chars;
  return chars.filter(ch => !cm.has(ch.codePointAt(0)));
};
// Missing glyphs console.error (qa.py / render.py fail on page console.error). Returns true when all present.
U.assertGlyphs = (font, text, where = '') => {
  const fam = famOf(font), miss = U.missingGlyphs(font, text);
  if (miss.length) console.error(!CMAPS[fam] ? `字体「${fam}」没注册或没读到 cmap（lib/fonts.js 的 FONT_FACES）${where ? '（' + where + '）' : ''}`
    : `缺字形：字体「${fam}」里没有「${miss.join('')}」${where ? '（' + where + '）' : ''}——会静默回退系统字体。用 scripts/font_subset.py 补进子集，或改用路径自画。`);
  return miss.length === 0;
};
U.fontFamily = famOf;

})();
