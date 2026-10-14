// K4 stage three “代理” (from beat 12, 6.0–8.5s)
// Beat 12 main word slams with huge “3” → 12.5 “Agent” and task card rise → 13 support “你只说”, 13.25 “要什么” →
// 13.5 / 14 / 14.5 tasks check themselves → 15 “要什么” enlarges with underline → 16 final downbeat: camera pulls back 6%, whole frame bumps, hold 0.5s.
// Revision: first climax weakest — no final hit, checked tasks all gray, bottom 28% empty. Now content 70px lower, checks retain color, beat-16 ending added.
(() => {
const K = KT, C = K.C, b = K.b;
const { clamp } = U;
const TASKS = [['写代码', 13.5], ['跑测试', 14], ['上线', 14.5]];
SCENES['k4_agent'] = {
  draw(c, lt, t) {
    c.fillStyle = C.paper; c.fillRect(0, 0, 1920, 1080);
    K.dots(c, t, C.ink, 0.06);
    const pull = MO.expoOut(MO.at(t, b(16), 0.45)), hit = t >= b(16) ? 0.035 * Math.exp(-(t - b(16)) * 9) : 0;
    K.cam(c, t, c => {
      K.bigNum(c, t, '3', b(12), 1880, 1150, 'rgba(17,17,17,0.05)');
      TY.rise(c, '阶段 03', 140, 300, MO.at(t, b(12), 0.3), { size: K.SZ.label, fam: 'PuHui-Bold', color: C.coral, track: 6 });
      TY.underline(c, 140, 322, 170, MO.at(t, b(12.25), 0.3), C.coral, 6);
      K.slam(c, '代理', 130, 650, t, b(12), { color: C.ink });
      const hw = TY.width(c, '代理', K.SZ.hero);
      TY.rise(c, 'Agent', 150 + hw, 650, MO.at(t, b(12.5), 0.35), { size: 96, fam: 'PuHui-Black', color: C.coral });
      const s1 = '你只说', key = '要什么', w1 = TY.width(c, s1, K.SZ.sub, 'PuHui-Heavy'), wk = TY.width(c, key, K.SZ.sub, 'PuHui-Heavy');
      const ky = 825, kx = 152 + w1;
      TY.rise(c, s1, 140, ky, MO.at(t, b(13), 0.35), { size: K.SZ.sub, fam: 'PuHui-Heavy', color: C.ink });
      const ksc = K.key(c, key, kx, ky, t, b(13.25), b(15), { size: K.SZ.sub, fam: 'PuHui-Heavy', color: C.coral });
      TY.underline(c, kx, ky + 30 * ksc, wk * ksc, MO.at(t, b(15), 0.3), C.coral, 12);
      // Task card rises from below at beat 12.5
      const pc = MO.expoOut(MO.at(t, b(12.5), 0.4)); if (pc <= 0) return;
      c.save(); c.translate(1220, 360 + 260 * (1 - pc)); c.globalAlpha = clamp(pc * 2);
      c.fillStyle = 'rgba(0,0,0,0.08)'; c.beginPath(); c.roundRect(12, 16, 600, 470, 28); c.fill();
      c.fillStyle = C.white; c.beginPath(); c.roundRect(0, 0, 600, 470, 28); c.fill();
      TY.text(c, 'TODO', 50, 80, { size: 40, fam: 'PuHui-Black', color: '#B5AFA4', align: 'left', track: 4 });
      TASKS.forEach(([s, beat], i) => {
        const y = 170 + i * 115, ck = MO.at(t, b(beat), 0.22), done = t >= b(beat);
        // On check beat, box grows 1.25× then returns; check draws by arc length
        const bs = done ? 1 + 0.25 * Math.exp(-(t - b(beat)) * 10) * Math.sin(Math.min(Math.PI, (t - b(beat)) * 20)) : 1;
        c.save(); c.translate(80, y); c.scale(bs, bs);
        c.fillStyle = done ? C.green : C.paper; c.strokeStyle = done ? C.green : '#CFC7BA'; c.lineWidth = 6;
        c.beginPath(); c.roundRect(-30, -30, 60, 60, 14); c.fill(); c.stroke();
        if (ck > 0) { c.strokeStyle = C.white; c.lineWidth = 10; c.lineCap = 'round'; c.lineJoin = 'round';
          const L1 = Math.hypot(11, 12), L2 = Math.hypot(22, 26), d = MO.expoOut(ck) * (L1 + L2);
          c.beginPath(); c.moveTo(-15, 0); if (d <= L1) c.lineTo(-15 + 11 * d / L1, 12 * d / L1); else { c.lineTo(-4, 12); const q = (d - L1) / L2; c.lineTo(-4 + 22 * q, 12 - 26 * q); } c.stroke(); }
        c.restore();
        TY.text(c, s, 140, y + 24, { size: 66, fam: 'PuHui-Heavy', color: done ? C.green : C.ink, align: 'left' });
      });
      c.restore();
    }, { zoom: (1 - 0.06 * pull) * (1 + hit) });
  },
};
})();
