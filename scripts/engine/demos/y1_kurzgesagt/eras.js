// Demo · Kurzgesagt-style flat science explainer "How AI Learned to Recognize Cats" (8s, three shots). Grammar card: references/动画语法/y1_kurzgesagt.md
//   Preview: index.html?film=demos/y1_kurzgesagt   Render: render.py --film demos/y1_kurzgesagt --out y1.mp4
// Shots cut on voiceover, dur in seconds; explainer films don't use beat-punch (PUNCH = 0). Camera motion fully handled in scenes by time (CAM); transitions only define how A and B blend.
window.PUNCH = 0;
window.SCENE_LIBS = ['demos/_shared/hero.js', 'demos/y1_kurzgesagt/kurzgesagt.js'];
window.ERAS = [
  { id: 'y1_s1', dur: 2.6 },                                                                         // night hillside: 5-layer parallax slow push, robot scanning cat
  { id: 'y1_s2', dur: 2.7, transition: { type: 'lensReveal', dur: 1.0, lens: t => Y1.lensAt(t) } },  // drill into lens: camera exponentially pushes into eye, next world inside the eye
  { id: 'y1_s3', dur: 2.7, transition: { type: 'matchCut', dur: 0.9 } },                             // fill then pull back: push fills yellow output node → pull out from yellow eye
];
