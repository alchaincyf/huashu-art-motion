// Demo · storytime stick-figure character "The first time I asked AI to write code for me" (8.75s, five shots). Grammar card: references/动画语法/y4_storytime.md
//   Preview: index.html?film=demos/y4_storytime   Render: render.py --film demos/y4_storytime --out y4.mp4 (voiceover track added separately; lip sync reads vo_env.js envelope)
// Shots cut on voiceover (not on beats): one voiceover sentence ≈ one shot; reaction shots placed in the "silence" between sentences.
window.PUNCH = 0;                    // Storytime does not synchronize to musical beats
window.FILM_DURATION = 8.75;
window.SCENE_LIBS = ['demos/y4_storytime/vo_env.js', 'demos/y4_storytime/story.js', 'demos/y4_storytime/world.js'];
window.SCENE_DIR = 'demos/y4_storytime';
window.ERAS = [
  { id: 's1_desk', dur: 2.0 },                                                  // medium shot: talking to camera
  { id: 's2_screen', dur: 2.4, transition: { type: 'whip', dur: 0.26, dir: 1 } }, // whip-pan → screen (over-shoulder). Whip falls in the breath between sentences, never mid-sentence
  { id: 's3_react', dur: 1.2, transition: { type: 'smash', dur: 0.32 } },        // slam-cut → reaction close-up (silence)
  { id: 's4_wide', dur: 1.65, transition: { type: 'cut', dur: 0.02 } },          // hard cut → same room wide shot
  { id: 's5_close', dur: 1.5, transition: { type: 'cut', dur: 0.02 } },          // jump-cut → close-up, punchline + hold
];
