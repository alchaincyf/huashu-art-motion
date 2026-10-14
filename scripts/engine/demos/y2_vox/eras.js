// Demo · Vox-style collage explainer "How AI Learned to Recognize Cats" (8s, three shots). Grammar card: references/动画语法/y2_vox.md
//   Preview: index.html?film=demos/y2_vox   Render: render.py --film demos/y2_vox --out y2.mp4
// One large desktop = the world; camera pans smoothly at 60fps; papers/highlighter/red pen/typing on the desk step at 12fps.
window.PUNCH = 0;
window.SCENE_LIBS = ['demos/_shared/hero.js', 'demos/y2_vox/vox.js'];
window.ERAS = [
  { id: 'y2_s1', dur: 2.6 },                                                 // Clipping and halftone photo: highlighter sweeps lines, red pen circles words, slow camera push
  { id: 'y2_s2', dur: 3.3, transition: { type: 'same', dur: 1.1 } },         // Track red line to investigation wall (same desk, continuous camera move)
  { id: 'y2_s3', dur: 2.1, transition: { type: 'cut', dur: 1 / 60 } },       // Fill frame with small photo → hard cut to large scan of same image, pull out to reveal black collage
];
