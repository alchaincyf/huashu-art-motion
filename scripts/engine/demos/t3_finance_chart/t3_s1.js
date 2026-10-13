// t3 · finance chart: “Five-year revenue growth and share price of a fictional AI company” (all fictional, “示意数据” corner label every shot)
// Shot 1 (2.8s): layout first (top red line, red flag, title, unit) → grid draws left to right (zero line darkest) → bars grow sequentially from 0, values count with them →
// highlight last bar (others gray) → “8.7×” annotation. This file also holds t3 shared layout/data (window.T3).
(() => {
const { clamp, lerp, rng } = U;
const W = 1920, H = 1080;
// Colors: Economist chart palette (2017 chart style guide)
const COL = { red: '#E3120B', blue: '#006BA2', blue2: '#3EBCD2', grey: '#758D99', dim: '#C6D2D8', ink: '#0C0C0C', sub: '#4F5B61', grid: 'rgba(12,12,12,0.13)', bg: '#FFFFFF', up: '#E3120B', down: '#1B9E5A', gold: '#EBB434' };
const CN = '"NotoSansSC"', NUM = '"RobotoCondensed", "NotoSansSC"';
const F = { x: 170, y: 270, w: 1580, h: 610 };                            // Plot area
// ---- Fictional data ----
const REV = [{ y: 2021, v: 12.4 }, { y: 2022, v: 19.8 }, { y: 2023, v: 34.6 }, { y: 2024, v: 61.2 }, { y: 2025, v: 107.9 }];
// 60 monthly closes: seeded random walk, 2022 drawdown, 2023-03 jump, then scaled overall from 38 → 286.4
const PRICE = (() => { const r = rng(2025), a = []; let v = 0;
  for (let m = 0; m < 60; m++) { const drift = m < 12 ? 0.02 : m < 24 ? -0.035 : m === 26 ? 0.35 : 0.045; v += drift + (r() - 0.5) * 0.11; a.push(v); }
  const e = a.map(Math.exp), k0 = e[0], k1 = e[59], out = e.map(x => 38 + (x - k0) / (k1 - k0) * (286.4 - 38));
  out[58] = 242; return out; })();                                     // Last point = latest 286.4; penultimate monthly close = daily-candle start 242 (consistent figures between shots)
// Latest 20 trading-day candles: 242 to 286.4 (+18.3%), gains and losses
const KL = (() => { const r = rng(77), out = []; let c = 242;
  for (let i = 0; i < 20; i++) { const tgt = 242 + (286.4 - 242) * (i + 1) / 20; const o = c; const cl = i === 19 ? 286.4 : tgt + (r() - 0.5) * 9 + (i % 5 === 3 ? -7 : 0);
    const hi = Math.max(o, cl) + 1.5 + r() * 4, lo = Math.min(o, cl) - 1.5 - r() * 4; out.push({ o, c: cl, h: hi, l: lo, vol: 0.4 + r() * 0.6 + (Math.abs(cl - o) / 10) }); c = cl; }
  return out; })();

// ---- Layout (every shot): Economist full-page CH.frame (top red rule, upper-left red flag, title, subtitle=unit, source, illustrative-data label) ----
const frame = (c, lt, { title, sub, source = '来源：示意数据，公司与数字均为虚构' } = {}) => CH.frame(c, lt, { title, sub, source, font: CN, red: COL.red, ink: COL.ink, subCol: COL.sub });
window.T3 = { COL, CN, NUM, F, REV, PRICE, KL, frame };

// ---- Shot 1 ----
const yS = CH.lin(0, 120, F.y + F.h, F.y);
const xs = REV.map((d, i) => F.x + 130 + i * ((F.w - 330) / 4));
SCENES['t3_s1'] = {
  draw(c, lt) {
    c.fillStyle = T3.COL.bg; c.fillRect(0, 0, 1920, 1080);
    const z = 1 + 0.03 * lt / 2.8;                                       // Constant slow push 1→1.03 (typical subtle motion in financial-channel charts)
    c.save(); c.translate(960, 575); c.scale(z, z); c.translate(-960, -575);
    frame(c, lt, { title: '深算科技：营收五年涨到原来的近 9 倍', sub: '年营收，亿元' });
    CH.grid(c, F, [0, 30, 60, 90, 120], yS, MO.seg(lt, 0.25, 0.85), { col: COL.grid, zeroCol: COL.ink, font: `400 30px ${NUM}`, labelCol: '#5b666b', side: 'right', lw: 1.5, zeroLw: 3 });
    CH.xLabels(c, REV.map((d, i) => ({ x: xs[i], label: String(d.y) })), F.y + F.h + 50, MO.seg(lt, 0.45, 1.0), { font: `400 32px ${NUM}`, col: '#3a4246' });
    const hiP = MO.smooth(MO.seg(lt, 1.95, 2.35));
    const tops = CH.bars(c, REV.map((d, i) => ({ x: xs[i], v: d.v })), yS, 150, MO.seg(lt, 0.65, 1.95),
      { lag: 0.22, col: COL.blue, hi: lt > 1.95 ? 4 : -1, hiP, hiCol: COL.blue, dimCol: COL.dim, fmt: v => v.toFixed(1), font: `600 34px ${NUM}`, labelCol: COL.ink });
    // Annotation beside final bar: dot → leader → two text lines (number first, comparison second)
    CH.callout(c, lt, 2.15, { x: xs[4] - 75, y: tops[4][1], tx: xs[4] - 330, ty: yS(96), lines: ['8.7 倍', '2025 年 107.9 亿 ÷ 2021 年 12.4 亿'],
      col: COL.ink, dotCol: COL.red, font: `700 54px ${NUM}`, font2: `400 28px ${CN}`, align: 'right', r: 9 });
    c.restore();
  },
};
})();
