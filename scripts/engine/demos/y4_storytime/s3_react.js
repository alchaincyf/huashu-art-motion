// S3 反应大特写：砸镜进来，死鱼眼，一言不发。整段是沉默 —— 笑点在「停顿」里。
// 动：砸镜回弹（转场里）、极慢推进 6%、镜片反光扫过、汗滴滑落、一次慢眨眼、背景暗角呼吸、嘴角抽一下。
(() => {
const S = STORY, C = S.C, W = 1920, H = 1080;
const { clamp } = U;
SCENES['s3_react'] = {
  draw(c, lt, t) {
    const ts = MO.step(t, 24);
    const lts = ts - 4.4;                               // 本段局部（步进后）
    // 虚空背景：纯色＋暗角（反应镜头把环境拿掉，只留脸）
    c.fillStyle = C.void; c.fillRect(0, 0, W, H);
    const vg = c.createRadialGradient(960, 560, 200, 960, 560, 1100); vg.addColorStop(0, 'rgba(255,255,255,0.10)'); vg.addColorStop(1, 'rgba(0,0,0,0.35)');
    c.fillStyle = vg; c.fillRect(0, 0, W, H);
    // 集中线（很淡、极慢转）：漫画「凝固」的符号
    c.save(); c.translate(960, 560); c.rotate(t * 0.04); c.strokeStyle = 'rgba(255,255,255,0.07)'; c.lineWidth = 6;
    for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; c.beginPath(); c.moveTo(Math.cos(a) * 640, Math.sin(a) * 640); c.lineTo(Math.cos(a) * 1300, Math.sin(a) * 1300); c.stroke(); }
    c.restore();
    const zoom = 1 + 0.06 * Math.min(1, lt / 1.2);
    CAM.with(c, { x: 960, y: 560, z: zoom }, c => {
      const R = 360;
      const blink = (lts >= 0.62 && lts < 0.62 + 0.125) ? 1 : 0;            // 慢眨眼：3 帧@24fps（比平时多 1 帧，读作「无语」）
      const twitch = lts > 0.78 ? 'worry' : 'blank';                         // 第二声蟋蟀后 0.15s 眉毛一垮（声画同一件事）
      const info = TOON.bean(c, { char: 'author', x: 960, y: 560 + R * 2.1 + 40, s: R, pose: TOON.POSES.stiff, expr: twitch, mouth: 0, blink, look: [0, 0], lw: 12 });
      // 镜片反光：一条白色斜带从左扫到右（0.15–0.45s）
      const g = MO.at(lts, 0.15, 0.3);
      if (g > 0 && g < 1) {
        const hy = info.head[1];
        for (const sx of [-1, 1]) { const gx = 960 + sx * R * 0.37, gy = hy + R * 0.2, gr = R * 0.27;
          c.save(); c.beginPath(); c.arc(gx, gy, gr - 4, 0, Math.PI * 2); c.clip();
          const bx = gx - gr * 1.6 + g * gr * 3.2; c.fillStyle = 'rgba(255,255,255,0.85)';
          c.beginPath(); c.moveTo(bx - 30, gy - gr); c.lineTo(bx + 20, gy - gr); c.lineTo(bx - 40, gy + gr); c.lineTo(bx - 90, gy + gr); c.closePath(); c.fill(); c.restore(); }
      }
      // 汗滴：太阳穴处，0.35s 起滑落 0.9s
      const sw = MO.at(lt, 0.35, 0.9);
      if (sw > 0) TOON.sweat(c, 960 + R * 0.88, info.head[1] - R * 0.1, 34, MO.expoOut(sw) * 0.6 + sw * 0.4);
    });
  },
};
})();
