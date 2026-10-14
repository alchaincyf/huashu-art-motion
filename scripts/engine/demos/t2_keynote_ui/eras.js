// Demo · keynote-style product launch UI (Apple keynote): “Plover 2's Three Features” (8s, three shots; fictional product and figures). Grammar card: references/动画语法/t2_keynote_ui.md
//   Preview index.html?film=demos/t2_keynote_ui   Render render.py --film demos/t2_keynote_ui --out t2.mp4
// Light-patch background depends only on film time t, seamless across all three shots; card → fullscreen is shared-element expansion (rect = middle card's screen rectangle at shot 2's final frame).
window.PUNCH = 0;
window.SCENE_DIR = 'demos/t2_keynote_ui';
window.ERAS = [
  { id: 't2_s1', dur: 2.6 },
  { id: 't2_s2', dur: 3.0, transition: { type: 'blurPush', dur: 0.55 } },
  { id: 't2_s3', dur: 2.4, transition: { type: 'expandRect', dur: 0.6, rect: { x: 705.6, y: 252.6, w: 508.8, h: 614.8 }, r: 38 } },
];
