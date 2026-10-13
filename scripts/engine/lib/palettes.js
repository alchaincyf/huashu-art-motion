// Film-wide palettes: spec.theme name (or {name, overridden keys} / full six-key object), clip.js resolves ctx.pal; all eight grammars use it —
// Mixed-grammar films share background/text/accent colors rather than separate hardcoded palettes.
// Each has six keys: bg background · surface card/paper/panel · ink main text · sub secondary text/lines · accent emphasis · accent2 second emphasis.
// Derive all other colors from these six (PAL.mix brightness, PAL.alpha opacity), without outside hues.
(() => {
window.PALETTES = {
  paper:   { bg: '#F3EDE2', surface: '#FBF8F2', ink: '#1B1A17', sub: '#6B655B', accent: '#C8402F', accent2: '#2F5D62' },   // Paper
  poster:  { bg: '#FFD23F', surface: '#FFF6D6', ink: '#111111', sub: '#4A4433', accent: '#FF5A36', accent2: '#14213D' },   // Poster yellow
  ink:     { bg: '#121417', surface: '#1E2226', ink: '#F2EFE8', sub: '#A39E93', accent: '#F2B33D', accent2: '#5FB3A1' },   // Deep ink
  navy:    { bg: '#0D1B2A', surface: '#16293D', ink: '#EEF3F6', sub: '#8FA3B3', accent: '#5CC8E0', accent2: '#F2A93B' },   // Navy (flat, no gradient)
  bauhaus: { bg: '#EFE9DD', surface: '#FFFFFF', ink: '#111111', sub: '#555555', accent: '#D62828', accent2: '#1D4E89' },   // Bauhaus
  snow:    { bg: '#E9EEF0', surface: '#FFFFFF', ink: '#1F2A30', sub: '#5E6B72', accent: '#D9482B', accent2: '#3E7C8C' },   // Snowfield
  wood:    { bg: '#EDE3D1', surface: '#F7F1E6', ink: '#2B2622', sub: '#7A6E62', accent: '#C4552D', accent2: '#3F5B4B' },   // Warm wood
  chalk:   { bg: '#23302B', surface: '#2E3D37', ink: '#F1EFE6', sub: '#A9B3AA', accent: '#F4D35E', accent2: '#E87D5A' },   // Chalkboard
};
const KEYS = ['bg', 'surface', 'ink', 'sub', 'accent', 'accent2'];
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const rgb = h => { h = String(h).trim().replace('#', ''); if (h.length === 3) h = [...h].map(x => x + x).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const hex = v => '#' + v.map(x => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('');
const lin = x => { x /= 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
const PAL = window.PAL = {
  KEYS,
  names: () => Object.keys(window.PALETTES),
  rgb, hex,
  mix: (a, b, t) => { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v + (y[i] - v) * t)); },   // a→b at t (0..1), returns hex
  alpha: (c, a) => { const v = rgb(c); return `rgba(${v[0]},${v[1]},${v[2]},${a})`; },
  lum: c => { const [r, g, b] = rgb(c).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; },   // WCAG relative luminance
  contrast: (a, b) => { const x = PAL.lum(a), y = PAL.lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); },
  dark: p => PAL.lum(p.bg) < 0.2,                                                            // Dark palettes (ink / navy / chalk)
  on: (bg, cands) => cands.reduce((best, c) => PAL.contrast(bg, c) > PAL.contrast(bg, best) ? c : best),   // Most legible text color over bg
  // spec.theme → full six keys plus name. null / {} → null (grammar defaults). Invalid → throw; clip.js refuses startup
  resolve(theme) {
    if (theme == null || (typeof theme === 'object' && !Array.isArray(theme) && !Object.keys(theme).length)) return null;
    const avail = `可用：${PAL.names().join(' / ')}`;
    let out;
    if (typeof theme === 'string') {
      if (!window.PALETTES[theme]) throw new Error(`spec.theme「${theme}」不是色板名。${avail}`);
      out = { name: theme, ...window.PALETTES[theme] };
    } else if (typeof theme === 'object' && !Array.isArray(theme)) {
      const unknown = Object.keys(theme).filter(k => k !== 'name' && !KEYS.includes(k));
      if (unknown.length) throw new Error(`spec.theme 里有不认识的键：${unknown.join(' ')}（只认 name 和 ${KEYS.join(' ')}）`);
      if (theme.name != null) {
        if (!window.PALETTES[theme.name]) throw new Error(`spec.theme.name「${theme.name}」不是色板名。${avail}`);
        out = { name: theme.name, ...window.PALETTES[theme.name], ...theme };
      } else {
        const miss = KEYS.filter(k => theme[k] == null);
        if (miss.length) throw new Error(`spec.theme 对象缺 ${miss.join(' ')}：写全 6 个键（${KEYS.join(' ')}），或加 name 用那套色板补缺的键。${avail}`);
        out = { name: 'custom', ...theme };
      }
    } else throw new Error(`spec.theme 要写色板名（字符串）或对象，收到的是 ${JSON.stringify(theme)}。${avail}`);
    const bad = KEYS.filter(k => !HEX.test(String(out[k])));
    if (bad.length) throw new Error(`spec.theme 的 ${bad.map(k => `${k}=${JSON.stringify(out[k])}`).join(' ')} 不是 #rgb / #rrggbb 色值`);
    for (const k of KEYS) out[k] = hex(rgb(out[k])).toUpperCase();
    return out;
  },
};
})();
