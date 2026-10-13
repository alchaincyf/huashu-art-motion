// S4 wide shot (same room pulled back to 0.5x): Huashu tiny in the large room. Voiceover: "I asked it: all these..."
// Wide shot makes the character look small and helpless — the wide itself is setup for the punchline. Revision: added "glance at laptop then back to camera" in two pauses, pointing at laptop on "all these".
// Animation: lip sync, eye direction (6.2 glance laptop → 6.6 back to camera), pose rebound (talk → point), chandelier swing, cloud drift, screen flicker, very slow pullback.
(() => {
const S = STORY;
SCENES['s4_wide'] = {
  draw(c, lt, t) {
    const ts = MO.step(t, 24);
    const zoom = 0.53 - 0.03 * MO.quintOut(Math.min(1, lt / 1.65));          // 0.53 → 0.50
    CAM.with(c, { x: 900, y: 470, z: zoom }, c => {
      const st = S.poseAt(S.KEYS_END, ts), al = S.alive(ts, 165);
      S.world(c, t, { pose: st.pose, expr: st.expr, mouth: TOON.mouth(t), blink: S.blinkAt(ts), look: S.lookEnd(ts), squash: st.squash * al.breathe, bob: al.bob, lw: 10 });
    });
  },
};
})();
