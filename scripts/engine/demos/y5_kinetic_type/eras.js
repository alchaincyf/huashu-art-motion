// Demo · kinetic typography: “Three Stages of AI Coding”, 120 BPM, 8 seconds = 4 bars = 16 beats, then hold 0.5s.
//   Grammar card: references/动画语法/y5_kinetic_type.md
//   Preview index.html?film=demos/y5_kinetic_type   Render render.py --film demos/y5_kinetic_type --out y5.mp4
// Reveal frame lands on beat: section start = bar line − reveal point × transition duration (MO.onBeat) —
//   fillZoom reveal .55, dur .45 → 2.0−.25 = 1.75; bands reveal ≈.6, dur .5 → 4.0−.3 = 3.7; push reaches 90% displacement at p≈.58, dur .35 → 6.0−.2 ≈ 5.80
window.PUNCH = 0;                    // kinetic.js K.bump supplies beat impact (1.2% each beat)
window.FILM_DURATION = 8.5;
window.SCENE_LIBS = ['demos/y5_kinetic_type/kinetic.js'];
window.SCENE_DIR = 'demos/y5_kinetic_type';
window.ERAS = [
  { id: 'k1_title', dur: 1.75 },
  { id: 'k2_complete', dur: 1.95,   // Dive point inside circle, avoiding “3” glyph (diving into white text fills frame white)
    transition: { type: 'fillZoom', dur: 0.45, k: 0.55, cx: 1075, cy: 773, maxZoom: 30, fill: '#FF5A36' } },
  { id: 'k3_chat', dur: 2.1, transition: { type: 'bands', dur: 0.5, gap: 0.12, colors: ['#FFD23F', '#FFFFFF', '#14213D'] } },
  { id: 'k4_agent', dur: 2.7, transition: { type: 'push', dur: 0.35 } },
];
