// t3 · shot 2 (2.7s, first 0.5s panel-slide transition): share-price line. Grid first → line draws chronologically left to right (head dot and following price) →
// event annotation pops at March 2023 (one event per shot) → camera slowly pushes toward latest point; push continues through transition (vector redraw), entering candle shot.
(() => {
const { clamp, lerp } = U;
const W = 1920, H = 1080;
const DUR = 2.7;
SCENES['t3_s2'] = {
  draw(c, lt) {
    const { COL, CN, NUM, F, PRICE, frame } = T3;
    const yS = CH.lin(0, 300, F.y + F.h, F.y), xm = m => F.x + m / 59 * (F.w - 220);
    const pts = PRICE.map((v, m) => [xm(m), yS(v)]);
    const P = pts[59];
    // Camera: 1 → 1.05 within shot, exponential push to ×6 during transition (lt > DUR), always around latest point (fixed screen position)
    const tr = ERAS.find(e => e.id === 't3_s3').transition;
    const z = lt <= DUR ? lerp(1, 1.05, MO.smooth(lt / DUR)) : 1.05 * Math.pow(tr.zoom / 1.05, MO.smooth(clamp((lt - DUR) / tr.dur)));
    c.fillStyle = COL.bg; c.fillRect(0, 0, W, H);
    c.save(); c.translate(P[0], P[1]); c.scale(z, z); c.translate(-P[0], -P[1]);
    frame(c, lt, { title: '股价：先跌后涨，五年涨到原来的 7.5 倍', sub: '月收盘价，元' });
    CH.grid(c, F, [0, 100, 200, 300], yS, MO.seg(lt, 0.2, 0.75), { col: COL.grid, zeroCol: COL.ink, font: `400 30px ${NUM}`, labelCol: '#5b666b', side: 'right', lw: 1.5, zeroLw: 3 });
    CH.xLabels(c, [2021, 2022, 2023, 2024, 2025].map((y, i) => ({ x: xm(i * 12 + 5.5), label: String(y) })), F.y + F.h + 50, MO.seg(lt, 0.3, 0.8), { font: `400 32px ${NUM}`, col: '#3a4246' });
    // Short year-divider ticks
    c.save(); c.strokeStyle = 'rgba(12,12,12,.35)'; c.lineWidth = 2; c.globalAlpha = MO.seg(lt, 0.3, 0.6);
    for (let y = 1; y < 5; y++) { const x = xm(y * 12 - 0.5); c.beginPath(); c.moveTo(x, F.y + F.h); c.lineTo(x, F.y + F.h + 14); c.stroke(); } c.restore();
    // Line draws chronologically at 0.45–1.95s (smooth: slow start/end, latest price lands on point)
    const lp = MO.smooth(MO.seg(lt, 0.45, 1.95));
    const hp = CH.line(c, pts, lp, { col: COL.red, lw: 5, headR: 9, area: { top: F.y, base: F.y + F.h, c0: 'rgba(227,18,11,0.14)', c1: 'rgba(227,18,11,0)' } });
    if (hp) {                                                            // Price label follows head (tabular figures avoid jitter)
      const v = yS.inv(hp[1]);
      c.save(); c.globalAlpha = 1 - clamp((lt - DUR) / 0.2);           // Remove as push transition begins to avoid ghosting with next shot's upper-right price
      c.font = `700 38px ${NUM}`; c.fillStyle = COL.red; c.textAlign = 'left'; c.textBaseline = 'middle';
      TY.tabular(c, '¥' + v.toFixed(0), hp[0] + 22, hp[1] - 4); c.restore();
    }
    // Event annotation triggered when line head passes March 2023 (month 26)
    const m26 = xm(26), tHit = 0.45 + 1.5 * invSmooth((m26 - pts[0][0]) / (pts[59][0] - pts[0][0]));
    CH.callout(c, lt, tHit, { x: m26, y: pts[26][1], tx: m26 - 30, ty: pts[26][1] - 150, lines: ['2023.3', '发布自研大模型'], col: COL.ink, dotCol: COL.ink,
      font: `700 34px ${NUM}`, font2: `400 30px ${CN}`, align: 'right', r: 8 });
    c.restore();
  },
};
// Inverse smooth (bisection), for time when line head reaches given x
function invSmooth(y) { let a = 0, b = 1; for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (MO.smooth(m) < y) a = m; else b = m; } return (a + b) / 2; }
})();
