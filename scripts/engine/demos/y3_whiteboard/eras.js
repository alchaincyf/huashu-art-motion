// Demo · whiteboard explainer (RSA Animate): “How AI Learned to Recognize Cats” (8s, three shots). Grammar card: references/动画语法/y3_whiteboard.md
//   Preview index.html?film=demos/y3_whiteboard   Render render.py --film demos/y3_whiteboard --out y3.mp4
// One large whiteboard world, camera moves across it; all three sections share one draw function (DG.board stroke timeline), split only for QA shots.
window.PUNCH = 0;
window.SCENE_LIBS = ['demos/_shared/hero.js', 'demos/y3_whiteboard/whiteboard.js'];
window.ERAS = [
  { id: 'y3_s1', dur: 2.5 },                                                  // Draw cat, write “猫？” and question
  { id: 'y3_s2', dur: 2.25, transition: { type: 'same', dur: 0.8 } },         // Whip pan (0.8s with motion blur, pen stays on board)
  { id: 'y3_s3', dur: 3.25, transition: { type: 'same', dur: 0.85 } },        // Smooth board move → draw Huashu and “是猫！” → pull back to full board
];
