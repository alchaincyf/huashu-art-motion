// y4 shared config: palette, pose timeline (pose-to-pose + rebound), blink schedule, subtitles.
// Libraries used: TOON (bean character, poseAt, blinkAt, alive, lip sync reads VO_ENV), TY.text (subtitles), CAM (camera), MO (step, spring).
(() => {
const S = window.STORY = {};
// Background: reduced saturation and contrast, thinner/grayer lines; character lines darkest and thickest — eye always lands on the character first
S.C = { wall: '#DCE9EC', wall2: '#CFE0E4', floor: '#E8DCC8', desk: '#E2C29B', deskSide: '#CDA97F', bgLine: '#5B6470', line: '#1B1B1F',
  sky: '#BFE3F5', cloud: '#FFFFFF', laptop: '#C9CDD6', screen: '#20222D', glow: 'rgba(120,200,255,0.35)', void: '#3D405B' };
S.bgLW = 3;
// Voiceover timing (seconds, film time): matches placement in 共享/音频/build_y4.py
S.LINES = [[0.12, 2.0, '我第一次让AI帮我写代码，'], [2.13, 4.40, '它一口气，给了我三千行。'], [5.75, 8.75, '我问它：这些……贴哪儿？']];   // Subtitles and shot cuts change on same frame

// Pose timeline: keys = [[t, poseName, expr], ...] (film time). Pose change = TOON.poseAt: arms cut in 0.1s, body squashes 7% then spring-rebounds
S.poseAt = TOON.poseAt;
// Blink: fixed schedule ("random" 2.4–3.6s intervals hardcoded), eyes closed 2 frames @24fps ≈ 0.083s
S.blinkAt = (t, extra = []) => TOON.blinkAt(t, [0.9, 3.4, 6.1, ...extra]);
// Talking: head nods with syllables + breathing (1.6s cycle, ±1.2%)
S.alive = TOON.alive;

// Subtitles (Chinese platforms need burn-in; YouTube native storytime uses CC instead): white text with black stroke, full sentence cut in/out, no effects
window.GLOBAL_OVERLAY = (c, t) => {
  for (const [a, b, s] of S.LINES) if (t >= a && t < b) {
    TY.text(c, s, 960, 1022, { size: 50, fam: 'PuHui-Bold', color: '#fff', stroke: '#1B1B1F', strokeW: 10, track: 1 });
  }
};
})();
