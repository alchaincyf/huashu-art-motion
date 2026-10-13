// S08 · Economist-style finance chart (t3): launches increase after reuse; 165 Falcon 9 launches in 2025; one booster flew 37 times.
// Layout first (top red line + flag + conclusion title + unit subtitle + source) → grid left-to-right → bars grow from 0 → 2025 highlighted, others gray →
// 2025 bar settles as 165 ends → average one launch every two-plus days → text compares with all other rockets combined (no unsourced comparison figures) →
// One-booster cue: layout stays fixed, content slides horizontally to booster icon + flight counter rising stepwise to 37, settling as 37 ends.
// Data (fact-check rows 16–18): 2017 18, 2022 61, 2023 96, 2024 134, 2025 165 (2018–2021 only Wikipedia totals, omitted with … gap). Real data, no illustrative badge.
(() => {
const W = 1920, H = 1080, ID = 's08';
const { clamp, lerp } = U;
const seg = MO.seg;
const RED = '#E3120B', BLUE = '#006BA2', DIM = '#C6D2D8', INK = '#0C0C0C', SUB = '#4F5B61', SRC = '#6b767b', GRID = 'rgba(12,12,12,0.13)';
const CN = 'PuHui-Medium', CNB = 'PuHui-Bold', NUM = '"RobotoCondensed", "PuHui-Medium"';
const f = (size, fam, w = '') => `${w}${size}px "${fam}"`;

const Q = {
  rec: TM.cue(ID, '回收之后'), dense: TM.cue(ID, '发射越来越密'), y25: TM.cue(ID, '2025年'), f9: TM.cue(ID, '猎鹰9号'),
  land: TM.end(ID, '165') - 0.15, avg: TM.cue(ID, '平均两天多一发'), more: TM.cue(ID, '比全世界'),
  one: TM.cue(ID, '有一枚助推器'), n37: TM.cue(ID, '37次'), land37: TM.end(ID, '37') - 0.08, dur: TM.dur(ID),
};

// ---- Chart geometry ----
const DATA = [{ l: '2017', v: 18 }, { l: '…', v: null }, { l: '2022', v: 61 }, { l: '2023', v: 96 }, { l: '2024', v: 134 }, { l: '2025', v: 165 }];
const F = { x: 150, y: 300, w: 1590, h: 460 };
const TICKS = [0, 50, 100, 150, 200], yS = CH.lin(0, 200, F.y + F.h, F.y);
const SLOT = (F.w - 90) / DATA.length, XS = DATA.map((_, i) => F.x + SLOT * (i + 0.5)), BW = 132;
const HI = 5;

// Bar grows from 0 (quintOut) + synchronized monospaced count.
function bar(c, i, p, col, { big = false } = {}) {
  const d = DATA[i]; if (p <= 0) return yS(0);
  const e = MO.quintOut(clamp(p)), v = d.v * e, y = yS(v), x = XS[i];
  c.fillStyle = col; c.fillRect(x - BW / 2, y, BW, yS(0) - y);
  c.save(); c.globalAlpha = seg(p, 0.02, 0.3); c.fillStyle = big ? RED : INK; c.font = `${big ? 700 : 600} ${big ? 58 : 36}px ${NUM}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  TY.tabular(c, TY.fmt(v, 0), x, y - (big ? 18 : 14), { align: 'center' }); c.restore();
  return y;
}
// Layout: top red line, flag, changeable title, subtitle, source.
function header(c, lt, title, sub, src, a = 1, dy = 0) {
  c.save(); c.globalAlpha *= a; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  const tp = MO.quintOut(seg(lt, 0.05, 0.5)); c.globalAlpha *= tp; c.fillStyle = INK; c.font = f(60, CNB, '700 '); c.fillText(title, 96, 168 + (1 - tp) * 18 + dy);
  const sp = MO.quintOut(seg(lt, 0.15, 0.6)); c.globalAlpha = a * sp; c.font = f(34, CN); c.fillStyle = SUB; c.fillText(sub, 96, 224 + (1 - sp) * 14 + dy);
  c.globalAlpha = a * seg(lt, 0.2, 0.6); c.font = f(26, CN); c.fillStyle = SRC; c.fillText(src, 96, 900);
  c.restore();
}
// Annotation: red dot pops → leader draws → text fades in.
function note(c, k, x, y, tx, ty, lines) {
  if (k <= 0) return;
  const s = MO.spring(k, { duration: 0.45, bounce: 0.25 }), lp = MO.quintOut(seg(k, 0.12, 0.45)), fp = MO.quintOut(seg(k, 0.3, 0.7));
  c.save(); c.fillStyle = RED; c.beginPath(); c.arc(x, y, 11 * Math.max(0, s), 0, 7); c.fill();
  const pr = seg(k, 0, 0.6); if (pr > 0 && pr < 1) { c.strokeStyle = RED; c.globalAlpha = 1 - pr; c.lineWidth = 3; c.beginPath(); c.arc(x, y, 11 + pr * 34, 0, 7); c.stroke(); c.globalAlpha = 1; }
  if (lp > 0) { c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 12, y - 4); c.lineTo(lerp(x - 12, tx, lp), lerp(y - 4, ty, lp)); c.stroke(); }
  c.globalAlpha = fp; c.textAlign = 'right'; c.textBaseline = 'alphabetic';
  c.fillStyle = INK; c.font = f(50, CNB, '700 '); c.fillText(lines[0], tx - 14 - (1 - fp) * 16, ty + 14);
  c.fillStyle = SUB; c.font = f(30, CN); c.fillText(lines[1], tx - 14 - (1 - fp) * 16, ty + 62);
  c.restore();
}
// Booster (Falcon 9 stage 1, legs deployed): Economist-style outline icon.
const BOOST = RK.falcon9({ stage: 'booster', legs: 1, fins: 1 });
function booster(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s * 1.45, s);
  const sg = c.createLinearGradient(0, -41, 0, 0); sg.addColorStop(0, '#F2F5F6'); sg.addColorStop(0.45, '#d9dfe2'); sg.addColorStop(1, '#7d878c');
  RK.fill(c, BOOST, { body: sg, dark: '#2a3236', engine: '#2a3236', nose: '#F2F5F6' });
  c.restore();
  RK.at(c, x, y, 1, 0, g => { g.scale(s * 1.45, s); g.lineWidth = 2.6 / s; g.strokeStyle = INK; g.lineJoin = 'round'; for (const q of BOOST.parts) if (q.k === 'body') g.stroke(q.p); });
}
// Count marker: small rocket (rounded body + pointed nose).
function mark(c, x, y, s, col) {
  c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = col;
  c.beginPath(); c.moveTo(-11, 0); c.lineTo(-11, -52); c.quadraticCurveTo(-11, -70, 0, -78); c.quadraticCurveTo(11, -70, 11, -52); c.lineTo(11, 0); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-11, -14); c.lineTo(-20, 0); c.lineTo(-11, 0); c.closePath(); c.fill(); c.beginPath(); c.moveTo(11, -14); c.lineTo(20, 0); c.lineTo(11, 0); c.closePath(); c.fill();
  c.restore();
}

SCENES[ID] = {
  init() {
    U.assertGlyphs(CNB, '猎鹰火箭的发射越来越密一枚助推器飞行次数', ID);
    U.assertGlyphs(CN, '猎鹰9号与重型猎鹰年发射次数，次（2025 年全部为猎鹰9号）来源：SpaceNews、CBS News、CNBC、Ars Technica2018–2021 未画出365 天 ÷ 165 次 ≈ 2.2 天比全世界其他火箭加起来还多9号一级助推器Space.comSpaceflight Now已经飞了', ID);
    U.assertGlyphs(NUM, '0123456789,', ID);
  },
  draw(c, lt) {
    c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, W, H);
    // Top red line + flag (fixed throughout segment).
    const p0 = MO.quintOut(seg(lt, 0, 0.45)); c.fillStyle = RED; c.fillRect(0, 0, W * p0, 8); CH.tag(c, 96, 70, 96 * p0, 22, RED);
    // Camera: constant slow push 1 → 1.03 (chart-shot breathing).
    const z = 1 + 0.03 * lt / (Q.dur + 0.6);
    c.save(); c.translate(960, 560); c.scale(z, z); c.translate(-960, -560);
    // Horizontal content push: at booster cue chart exits left, booster panel enters right; layout stays fixed.
    const sw = MO.bezier(0.7, 0, 0.2, 1)(seg(lt, Q.one - 0.05, Q.one + 0.6));
    // ---------- Page one: annual launches ----------
    if (sw < 1) {
      header(c, lt, '猎鹰火箭的发射越来越密', '猎鹰9号与重型猎鹰年发射次数，次（2025 年全部为猎鹰9号）', '来源：SpaceNews、CBS News、CNBC、Ars Technica', 1 - seg(sw, 0, 0.5));
      c.save(); c.translate(-sw * W, 0);
      CH.grid(c, F, TICKS, yS, seg(lt, 0.35, 0.95), { col: GRID, zeroCol: INK, font: `400 30px ${NUM}`, labelCol: '#5b666b', side: 'right', lw: 1.5, zeroLw: 3, labelDy: -10 });
      // x axis: years; … marks omitted years.
      const xp = seg(lt, 0.5, 1.0), hiq = MO.smooth(seg(lt, Q.y25, Q.y25 + 0.35));
      DATA.forEach((d, i) => {
        const q = MO.quintOut(MO.lagged(i, DATA.length, xp, 0.1)); if (q <= 0) return;
        c.save(); c.globalAlpha = q; c.textAlign = 'center';
        if (d.v == null) {
          c.fillStyle = '#5b666b'; for (const k of [-1, 0, 1]) { c.beginPath(); c.arc(XS[i] + k * 20, F.y + F.h + 40 + (1 - q) * 14, 5, 0, 7); c.fill(); }
          c.font = f(22, CN); c.fillText('2018–2021 未画出', XS[i], F.y + F.h + 82);
          c.strokeStyle = INK; c.lineWidth = 3; for (const k of [-1, 1]) { c.beginPath(); c.moveTo(XS[i] + k * 9 - 8, yS(0) + 12); c.lineTo(XS[i] + k * 9 + 8, yS(0) - 12); c.stroke(); }
        } else {
          const isHi = i === HI; c.font = `${isHi ? 700 : 400} 36px ${NUM}`; c.fillStyle = isHi ? CH.mixHex('#3a4246', RED, hiq) : '#3a4246';
          c.fillText(d.l, XS[i], F.y + F.h + 50 + (1 - q) * 14);
        }
        c.restore();
      });
      // 2025 cue: pale highlight band appears first.
      if (hiq > 0) { c.save(); c.globalAlpha = hiq * (0.55 + 0.1 * Math.sin(lt * 2.4)); c.fillStyle = 'rgba(227,18,11,0.07)'; c.fillRect(XS[HI] - SLOT / 2 + 8, F.y - 10, SLOT - 16, F.h + 10); c.restore(); }
      // Bars: 2017 and 2022–2024 grow in sequence at density cue, gray after 2025 cue; 2025 settles at 165.
      const bp = seg(lt, Q.dense - 0.1, Q.dense + 1.25), dimP = MO.smooth(seg(lt, Q.y25 + 0.15, Q.y25 + 0.6));
      [0, 2, 3, 4].forEach((i, k) => bar(c, i, MO.lagged(k, 4, bp, 0.22), CH.mixHex(BLUE, DIM, dimP)));
      const g0 = Q.land - 1.5, top = bar(c, HI, seg(lt, g0, Q.land) ** 0.8, BLUE, { big: true });
      // Annotation: average every two-plus days (365 ÷ 165 ≈ 2.2, arithmetic).
      note(c, lt - Q.avg, XS[HI] - BW / 2, top + 4, 1060, 352, ['平均两天多一发', '365 天 ÷ 165 次 ≈ 2.2 天']);
      // Key-point pulse ring every 1.3s (continuous micro-motion).
      if (lt > Q.avg + 0.8) { const q = ((lt - Q.avg - 0.8) / 1.3) % 1; c.save(); c.strokeStyle = RED; c.globalAlpha = (1 - q) * 0.7; c.lineWidth = 3; c.beginPath(); c.arc(XS[HI] - BW / 2, top + 4, 12 + q * 40, 0, 7); c.stroke(); c.restore(); }
      // Text compares with all other rockets combined (words only, no comparison figures).
      const mk = lt - Q.more;
      if (mk > 0) {
        const fp = MO.quintOut(seg(mk, 0, 0.45)), tx = 1046, ty = 478;
        c.save(); c.font = f(40, CNB, '700 '); const tw = c.measureText('比全世界其他火箭加起来还多').width;
        TY.marker(c, tx - tw - 10, ty - 36, tw + 20, 48, seg(mk, 0.15, 0.75), 'rgba(227,18,11,0.16)', 0.1);
        c.globalAlpha = fp; c.fillStyle = INK; c.textAlign = 'right'; c.fillText('比全世界其他火箭加起来还多', tx - (1 - fp) * 16, ty);
        c.fillStyle = RED; c.fillRect(tx - tw - 34, ty - 34, 6, 42 * fp);
        c.restore();
      }
      c.restore();
    }
    // ---------- Page two: one booster, 37 flights ----------
    if (sw > 0) {
      header(c, lt - Q.one - 0.1, '一枚助推器的飞行次数', '同一枚猎鹰9号一级助推器，次', '来源：Space.com、Spaceflight Now', seg(sw, 0.4, 1));
      c.save(); c.translate((1 - sw) * W, 0);
      const bx = 300, by = 862;
      booster(c, bx, by + MO.float(lt, 3, 4.1) * 0, 11.6);
      // 37 rocket markers appear stepwise with same easing as large count, settling as 37 ends.
      const c0 = Q.one + 0.55, cp = MO.sineInOut(seg(lt, c0, Q.land37)), n = Math.floor(cp * 37 + 1e-6);
      for (let i = 0; i < 37; i++) {
        const col = i % 10, row = Math.floor(i / 10), x = 560 + col * 84, y = 448 + row * 128;
        const ti = c0 + MO.invert(MO.sineInOut, (i + 1) / 37) * (Q.land37 - c0), k = lt - ti;
        c.save(); c.globalAlpha = 0.9; mark(c, x, y, 1, '#E4EAED'); c.restore();
        if (k > 0) {
          const s = MO.backOut(clamp(k / 0.22), 2.2), wave = lt > Q.land37 ? 0.06 * Math.max(0, Math.sin((lt - Q.land37) * 5 - i * 0.18)) * Math.exp(-(lt - Q.land37) * 1.2) : 0;
          mark(c, x, y, s * (1 + wave), i === 36 ? RED : BLUE);
        }
      }
      // Later: faint light sweeps across markers (continuous micro-motion).
      if (lt > Q.land37 + 0.3) { const sp = ((lt - Q.land37 - 0.3) * 0.55) % 1.4;
        const gx = lerp(480, 1400, sp); const g = c.createLinearGradient(gx - 60, 0, gx + 60, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g; c.fillRect(gx - 60, 360, 120, 420); }
      // Large number.
      const v = Math.round(cp * 37);
      c.save(); c.textAlign = 'right'; c.textBaseline = 'alphabetic'; c.globalAlpha = seg(lt, c0 - 0.2, c0 + 0.1);
      c.fillStyle = SUB; c.font = f(36, CN); c.fillText('已经飞了', 1724, 500);
      c.fillStyle = RED; c.font = `700 230px ${NUM}`; const nw = TY.tabular(c, String(v), 1660, 720, { align: 'right' });
      c.fillStyle = INK; c.font = f(56, CNB, '700 '); c.textAlign = 'left'; c.fillText('次', 1670, 718);
      const lk = lt - Q.land37; if (lk > 0) { c.strokeStyle = RED; c.lineWidth = 6; c.beginPath(); c.moveTo(1660 - nw, 752); c.lineTo(1660 - nw + (nw + 64) * MO.quintOut(clamp(lk / 0.35)), 752); c.stroke(); }
      c.restore();
      c.restore();
    }
    c.restore();
  },
};

// Entry: Economist-style panel push led by vertical brand-red strip (layout assembles during entrance).
ERAS.find(e => e.id === ID).transition = { type: 'slidePush', dur: 0.55, bar: RED };
})();
