// S1 medium shot: Huashu sits behind desk talking to camera. Voiceover: "The first time I asked AI to write code for me,"
// Animation: lip sync (voiceover envelope, on-twos), talking head nod, breathing, pose rebound (talk → point), eyes track hand, blink, window cloud, slow camera push + drift.
// Room, desk, and laptop are in world.js (S4/S5 same room, different shot).
(() => {
const S = STORY;
const KEYS = [[0, 'talk', 'happy'], [1.12, 'point', 'talk']];
SCENES['s1_desk'] = {
  draw(c, lt, t) {
    const ts = MO.step(t, 24);                                     // character steps at 24fps (Flash default), camera smoothed at 60fps
    const zoom = 1.01 + 0.035 * MO.expoOut(Math.min(1, lt / 2.0)) + 0.03 * (1 - MO.expoOut(Math.min(1, lt / 0.5)));   // opening 1.04→1.01 settle, then slow push 3.5%
    const [dx, dy] = CAM.drift(t, 4, 1);
    CAM.with(c, { x: 900 + dx, y: 520 + dy, z: zoom }, c => {
      const st = S.poseAt(KEYS, ts), al = S.alive(ts, 165);
      S.world(c, t, { pose: st.pose, expr: st.expr, mouth: TOON.mouth(t), blink: S.blinkAt(ts), look: ts > 1.12 ? [1, 0] : [0, 0], squash: st.squash * al.breathe, bob: al.bob, tilt: ts > 1.12 ? 0.05 : -0.03 });
    });
  },
};
})();
