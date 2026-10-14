// Typography TY: character/word stagger, masked rise, pop, typewriter, blur reveal, highlighter, underline, main-word slam, keyword emphasis, counters/tabular numerals.
// Convention: p progress 0..1, lt/t seconds. Fonts CSS strings or families (Chinese default PuHui-*, bundled Noto Sans SC, lib/fonts.js).
// Readability (y5/y1 cards): main : supporting : label ≈3.4:1:0.4; supporting sentence ≥1.2s on screen; slower entrance 0.3–0.4s, faster exit ≈0.18s.
(() => {
const { clamp, lerp } = U;
const TY = window.TY = {};

// ---------- Basics ----------
TY.font = (size, fam = 'PuHui-Black') => `${size}px "${fam}"`;
// Draw text with alpha, scale, rotation around ox,oy, tracking, outline
TY.text = (c, s, x, y, { size = 120, fam = 'PuHui-Black', color = '#111', align = 'center', base = 'alphabetic', alpha = 1, scale = 1, rot = 0, track = 0, stroke, strokeW = 0, ox = x, oy = y } = {}) => {
  if (alpha <= 0 || scale <= 0) return;
  c.save(); c.globalAlpha *= alpha; c.translate(ox, oy); c.rotate(rot); c.scale(scale, scale); c.translate(-ox, -oy);
  c.font = TY.font(size, fam); c.textAlign = align; c.textBaseline = base; if (track) c.letterSpacing = track + 'px';
  if (stroke && strokeW) { c.lineJoin = 'round'; c.strokeStyle = stroke; c.lineWidth = strokeW; c.strokeText(s, x, y); }
  c.fillStyle = color; c.fillText(s, x, y); c.restore();
};
TY.width = (c, s, size, fam = 'PuHui-Black', track = 0) => { c.save(); c.font = TY.font(size, fam); if (track) c.letterSpacing = track + 'px'; const w = c.measureText(s).width; c.restore(); return w; };
// Wrap to maxW (Chinese breaks per character, English/numbers per word, no leading Chinese punctuation); font CSS string
TY.wrap = (c, text, maxW, font) => {
  c.save(); if (font) c.font = font;
  const toks = String(text).match(/[A-Za-z0-9.,%+\-'’]+\s*|\s+|./gu) || [], lines = []; let cur = '';
  for (const tk of toks) {
    if (tk === '\n') { lines.push(cur); cur = ''; continue; }
    if (cur && c.measureText(cur + tk.trimEnd()).width > maxW && !/^[，。、：；！？」』）》,.!?)]$/.test(tk)) { lines.push(cur.trimEnd()); cur = tk.trimStart(); }
    else cur += tk;
  }
  if (cur.trim()) lines.push(cur.trimEnd());
  c.restore(); return lines;
};
// Shrink size until truly fitting: ≤maxLines after wrapping and every measured line ≤maxW (unbreakable long words/numbers defeat line-count-only checks). Returns {size, lines, ok}
// Search scale [min,1] first; failure with soft:true returns ok:false for alternative layout, otherwise shrink to minimum 0.2. balance:true equalizes line lengths.
TY.fit = (c, text, maxW, size, fam, { maxLines = 2, min = 0.45, weight = '', soft = false, balance = false } = {}) => {
  const font = s => `${weight}${s}px "${fam}"`, ok = (s, lines) => { c.save(); c.font = font(s); const r = lines.length <= maxLines && lines.every(l => c.measureText(l).width <= maxW + 0.5); c.restore(); return r; };
  let s = size, lines = [String(text)], good = false;
  for (; s >= size * (soft ? min : 0.2) - 1e-9; s *= 0.94) { lines = TY.wrap(c, text, maxW, font(s)); if (ok(s, lines)) { good = true; break; } if (s < size * min && soft) break; }
  if (!good && !soft) s /= 0.94;
  if (good && balance && lines.length > 1) { const n = lines.length; let lo = maxW * 0.4, hi = maxW; for (let k = 0; k < 14; k++) { const m = (lo + hi) / 2; if (TY.wrap(c, text, m, font(s)).length > n) lo = m; else hi = m; } lines = TY.wrap(c, text, hi, font(s)); }
  return { size: s, lines, ok: good };
};

// ---------- Entrance ----------
// Stagger characters: dur each, rise from dy, fade, optional scale; Kurzgesagt titles 0.5s/character, 45ms stagger. Returns total width.
TY.charsIn = (c, str, x, y, lt, { font, color, dur = 0.35, stagger = 0.04, dy = 24, scale0 = 1, align = 'left', ease = MO.cubicOut, shadow, spacing = 0 } = {}) => {
  c.save(); c.font = font; c.textBaseline = 'alphabetic'; c.fillStyle = color; const A0 = c.globalAlpha;   // Multiply caller alpha so outer fade-out works
  const chars = [...str]; const ws = chars.map(ch => c.measureText(ch).width + spacing); const tw = ws.reduce((a, b) => a + b, 0) - spacing;
  let cx = align === 'center' ? x - tw / 2 : align === 'right' ? x - tw : x;
  chars.forEach((ch, i) => {
    const q = clamp((lt - i * stagger) / dur); if (q > 0) {
      const e = ease(q); c.save(); c.globalAlpha = A0 * clamp(q * 2.2);
      c.translate(cx + ws[i] / 2, y + dy * (1 - e)); const s = lerp(scale0, 1, e); c.scale(s, s);
      if (shadow) { c.shadowColor = shadow.color; c.shadowOffsetX = shadow.x || 0; c.shadowOffsetY = shadow.y || 0; c.shadowBlur = shadow.blur || 0; }
      c.fillText(ch, -ws[i] / 2 + spacing / 2, 0); c.restore();
    }
    cx += ws[i];
  });
  c.restore(); return tw;
};
// Masked rise: text emerges from below-baseline slot (common kinetic type). p 0..1, o.dir=+1 upward entrance, -1 downward exit; o like TY.text
TY.rise = (c, s, x, y, p, o = {}) => {
  const size = o.size || 120, e = MO.expoOut(clamp(p)), w = TY.width(c, s, size, o.fam, o.track), a = o.align || 'left';
  const x0 = a === 'left' ? x : a === 'center' ? x - w / 2 : x - w;
  c.save(); c.beginPath(); c.rect(x0 - 20, y - size * 1.05, w + 40, size * 1.32); c.clip();
  TY.text(c, s, x, y + size * 1.2 * (1 - e) * (o.dir || 1), { ...o, align: a }); c.restore();
};
// Pop: scale 0→1 with backOut overshoot around text center. o.over = backOut s
TY.pop = (c, s, x, y, p, o = {}) => {
  if (p <= 0) return; const size = o.size || 120, sc = MO.backOut(clamp(p), o.over ?? 2.2) * (o.scale || 1);
  TY.text(c, s, x, y, { ...o, scale: sc, ox: x, oy: y - size * 0.36 });
};
// Blur reveal (keynote title): blur→sharp, rise, fade-in; caller font/fillStyle/textAlign
TY.blurIn = (c, text, x, y, p, { blur = 18, dy = 28, scale = 0 } = {}) => {
  if (p <= 0) return;
  c.save(); c.globalAlpha *= clamp(p * 1.4);
  const b = (1 - p) * blur; if (b > 0.3) c.filter = `blur(${b.toFixed(2)}px)`;
  c.translate(x, y + (1 - p) * dy); if (scale) { const s = 1 + (1 - p) * scale; c.scale(s, s); }
  c.fillText(text, 0, 0); c.restore();
};
// Typewriter: truncate by character count (p 0..1)
TY.typed = (s, p) => [...s].slice(0, Math.round(clamp(p) * [...s].length)).join('');
// Typed count at t (rate characters/s, optional fps steps; Vox 13/s at12fps, whiteboard body16/s)
TY.typedCount = (t, t0, rate, fps = 0) => Math.max(0, Math.floor(((fps ? MO.step(t, fps) : t) - t0) * rate + 1e-6) + 1);

// ---------- Emphasis ----------
// Highlighter: beveled block sweeps left→right behind type (kinetic text); rough multiply collage highlight CL.highlight
TY.marker = (c, x, y, w, h, p, color = '#FFE14D', skew = 0.18) => {
  if (p <= 0) return; const e = MO.expoOut(clamp(p)), ww = w * e;
  c.save(); c.fillStyle = color; c.beginPath(); c.moveTo(x + h * skew, y); c.lineTo(x + ww + h * skew, y); c.lineTo(x + ww, y + h); c.lineTo(x, y + h); c.closePath(); c.fill(); c.restore();
};
TY.underline = (c, x, y, w, p, color, lw = 10) => { if (p <= 0) return; c.save(); c.strokeStyle = color; c.lineCap = 'round'; c.lineWidth = lw; c.beginPath(); c.moveTo(x, y); c.lineTo(x + w * MO.expoOut(clamp(p)), y); c.stroke(); c.restore(); };
// Main word slam: from scale→1 (spring 2.2Hz/10, ≈8% overshoot), fade-in first 0.06s. lt seconds since word appearance
TY.slam = (c, s, x, y, lt, o = {}) => {
  if (lt < 0) return; const size = o.size || 340, k = MO.springHz(lt, o.freq || 2.2, o.decay || 10), sc = lerp(o.from || 1.7, 1, k);
  TY.text(c, s, x, y, { size, fam: 'PuHui-Black', align: 'left', ...o, scale: sc * (o.scale || 1), alpha: clamp(lt / 0.06), ox: o.ox ?? x, oy: o.oy ?? y - size * 0.36 });
};
// Keyword: masked rise from tIn, at accent beat tHit springs to 1.35 and holds (2.5Hz/9). Returns scale for matching highlight/underline.
// Text/action align: next-line emphasis coincides exactly with Tab press (y5).
TY.keyword = (c, s, x, y, t, tIn, tHit, o) => {
  if (t < tHit) { TY.rise(c, s, x, y, MO.at(t, tIn, 0.35), { ...o, align: 'left' }); return 1; }
  const sc = lerp(1, 1.35, MO.springHz(t - tHit, 2.5, 9));
  TY.text(c, s, x, y, { ...o, align: 'left', scale: sc, ox: x, oy: y });
  return sc;
};
// Keyword highlight: same entrance beat and scale
TY.keywordMarker = (c, x, y, w, size, t, tHit, sc, col) => { if (t < tHit) return; TY.marker(c, x - 8, y - size * 0.98 * sc, (w + 16) * sc, size * 1.18 * sc, MO.at(t, tHit, 0.3), col); };

// ---------- Numbers ----------
// Thousands formatting; true minus sign −
TY.fmt = (v, dec = 0, sep = true) => { const s = Math.abs(v).toFixed(dec); const [i, f] = s.split('.'); const ii = sep ? i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : i; return (v < 0 ? '−' : '') + ii + (f ? '.' + f : ''); };
// Counter: a→b over [start,start+dur], default expoOut (fast then slow, final digit settles). Numbers/animation change appearance, never scope.
TY.count = (lt, start, dur, a, b, ease = MO.expoOut) => lerp(a, b, ease(clamp((lt - start) / dur)));
// Tabular numerals: canvas lacks tnum; changing widths jitter, so lay each digit in equal-width cell; caller font/fillStyle. Returns total width
TY.tabular = (c, str, x, y, { align = 'left', digitW } = {}) => {
  const dw = digitW || c.measureText('0').width;
  const ws = [...str].map(ch => /[0-9]/.test(ch) ? dw : c.measureText(ch).width);
  const total = ws.reduce((s, w) => s + w, 0);
  let cx = align === 'right' ? x - total : align === 'center' ? x - total / 2 : x;
  const ta = c.textAlign; c.textAlign = 'center';
  [...str].forEach((ch, i) => { c.fillText(ch, cx + ws[i] / 2, y); cx += ws[i]; });
  c.textAlign = ta; return total;
};
})();
