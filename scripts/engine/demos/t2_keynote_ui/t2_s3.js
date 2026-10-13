// t2 · shot 3 (2.4s, first 0.6s is middle card's shared-element expansion to fullscreen):
// We enter the long-term-memory card — same frosted glass background; huge number (same metric as card, no recount); tilted-back conversation panel below, bubbles spring in sequentially; final product lockup.
(() => {
const { clamp, lerp } = U;
const W = 1920, H = 1080;
const PW = 1180, PH = 360;
SCENES['t2_s3'] = {
  draw(c, lt, t) {
    t += T2.PHASE;
    const bgc = UI.scratch('t2bg3', W, H), bgx = bgc.getContext('2d');
    T2.bg(bgx, t, { dim: 0.25 });
    const bd = UI.backdrop(bgc, { blur: 40, key: 't2bd3' });
    // Fullscreen frosted glass = enlarged card texture (same material as expanding transition card)
    c.drawImage(bd, 0, 0, W, H); c.fillStyle = 'rgba(255,255,255,0.075)'; c.fillRect(0, 0, W, H);
    const tg = c.createLinearGradient(0, 0, 0, H * 0.5); tg.addColorStop(0, 'rgba(255,255,255,0.10)'); tg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = tg; c.fillRect(0, 0, W, H * 0.5);
    // Card heading stays upper left (same relative position as before expansion, preserving viewer orientation)
    c.fillStyle = 'rgba(255,255,255,0.09)'; c.beginPath(); c.roundRect(120, 96, 84, 84, 20); c.fill();
    UI.icon(c, 'memory', 162, 138, 52, '#f2f2f7', t);
    c.font = `600 44px ${T2.ZH}`; c.fillStyle = '#f5f5f7'; c.textBaseline = 'alphabetic'; c.textAlign = 'left'; c.fillText('长期记忆', 232, 154);
    // Huge number: same “100万” metric as card, no recount (counting again from 0 after expansion interrupts narrative); card number becomes hero
    const pin = MO.appleOut(MO.seg(lt, 0.0, 0.5));
    c.save(); c.textBaseline = 'alphabetic'; c.textAlign = 'left';
    c.font = `600 230px ${T2.SANS}`; T2.track(c, 230, -0.03); const w1 = c.measureText('100').width;
    c.letterSpacing = '0px'; c.font = `600 150px ${T2.ZH}`; const w2 = c.measureText('万').width;
    c.font = `500 56px ${T2.SANS}`; const w3 = c.measureText('tokens').width;
    const x0 = W / 2 - (w1 + w2 + w3 + 34) / 2, by = 400 - (1 - pin) * 20;
    c.font = `600 230px ${T2.SANS}`; T2.track(c, 230, -0.03); c.fillStyle = '#ffffff'; c.fillText('100', x0, by);
    c.letterSpacing = '0px'; c.font = `600 150px ${T2.ZH}`; c.fillText('万', x0 + w1 + 6, by);
    c.font = `500 56px ${T2.SANS}`; c.fillStyle = 'rgba(235,235,245,0.7)'; c.fillText('tokens', x0 + w1 + w2 + 34, by);
    c.restore();
    c.font = `400 34px ${T2.ZH}`; c.fillStyle = 'rgba(235,235,245,0.6)'; c.textAlign = 'center';
    TY.blurIn(c, '上下文窗口 —— 一年的对话，它都记得', W / 2, 478, MO.appleOut(MO.seg(lt, 0.35, 0.95)), { blur: 8, dy: 14 });
    // Conversation panel (texture → tilt back about X); bubbles spring in sequentially, entire panel slowly rises
    const tex = UI.scratch('t2panel', PW, PH), g = tex.getContext('2d'); g.reset();
    g.fillStyle = 'rgba(12,12,20,0.55)'; g.beginPath(); g.roundRect(0, 0, PW, PH, 30); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.16)'; g.lineWidth = 2; g.stroke();
    const bubble = (k, text, right, y, t0) => {
      const s = MO.spring(lt - t0, { duration: 0.5, bounce: 0.15 }); if (lt <= t0) return;
      g.save(); g.globalAlpha = clamp((lt - t0) / 0.2); g.font = `400 34px ${T2.ZH}`;
      const tw = g.measureText(text).width, bw = tw + 64, bh = 74, bx = right ? PW - 48 - bw : 48, by = y + (1 - s) * 40;
      g.translate(bx + (right ? bw : 0), by + bh); g.scale(lerp(0.85, 1, s), lerp(0.85, 1, s)); g.translate(-(bx + (right ? bw : 0)), -(by + bh));
      g.fillStyle = right ? '#3d6bff' : 'rgba(255,255,255,0.14)'; g.beginPath(); g.roundRect(bx, by, bw, bh, 37); g.fill();
      g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText(text, bx + 32, by + bh / 2 + 2); g.restore();
      void k;
    };
    bubble(0, '还记得我上个月说的旅行计划吗？', true, 36, 0.45);
    bubble(1, '记得：五月去京都，预算两万，不坐红眼航班。', false, 134, 0.8);
    bubble(2, '那帮我订吧。', true, 232, 1.15);
    // Blinking typing cursor (continuous small motion)
    if (lt > 1.35) { g.fillStyle = `rgba(255,255,255,${0.35 + 0.35 * Math.sin(lt * 9)})`; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(90 + k * 26, 330, 7, 0, Math.PI * 2); g.fill(); } }
    const pp = MO.spring(lt - 0.3, { duration: 0.8, bounce: 0 });
    c.save(); c.globalAlpha = clamp((lt - 0.3) / 0.3);
    UI.persp(c, tex, { cx: W / 2, cy: 725 + (1 - pp) * 120 - 8 * MO.smooth(clamp(lt / 2.4)), w: PW, h: PH, rx: lerp(0.55, 0.32, pp), persp: 1500, strip: 2 });
    c.restore();
    // Final lockup: brand name and launch information
    c.textAlign = 'center'; c.font = `600 40px ${T2.SANS}`; T2.track(c, 40, -0.01); c.fillStyle = '#ffffff';
    TY.blurIn(c, 'Plover 2 · 今天起可用', W / 2, 972, MO.appleOut(MO.seg(lt, 1.2, 1.8)), { blur: 10, dy: 12 });   // Settled at 1.8s, hold 0.6s; y=972 stays inside subtitle-safe area
    c.letterSpacing = '0px';
  },
};
})();
