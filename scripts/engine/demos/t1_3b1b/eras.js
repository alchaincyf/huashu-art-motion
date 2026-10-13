// Demo ·3b1b/manim explainer: how a neural-network layer turns pixels into 'cat' (8 seconds,3 shots). Grammar: references/动画语法/t1_3b1b.md
//   Preview index.html?film=demos/t1_3b1b   Render render.py --film demos/t1_3b1b --out t1.mp4
// Shots1→2 no transition: first frame = previous last frame, continuous Transform (100 pixels become neuron column). Shots2→3 enter a hidden neuron to see its pattern.
window.PUNCH = 0;
window.SCENE_DIR = 'demos/t1_3b1b';
window.ERAS = [
  { id: 't1_s1', dur: 2.6 },
  { id: 't1_s2', dur: 2.8 },
  // cx,cy = target neuron screen position at end of shot2 (r=22×1.1); live: shot2 continues camera push during transition (vector redraw)
  { id: 't1_s3', dur: 2.6, transition: { type: 'zoomThrough', dur: 0.75, cx: 850, cy: 391.5, zoom: 48, r0: 24.2, live: true, focus: [640, 585] } },
];
