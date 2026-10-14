// SpaceX's 24 years · single-style version (wbx: whiteboard reference). Durations come from spacex/timing.js (same voiceover as the mixed-style version); do not edit them manually.
// Each scene defines its incoming transition: ERAS.find(e => e.id === 'sXX').transition = { type, dur } (single-style films often use same: camera movement on one canvas).
window.PUNCH = 0;
window.SCENE_LIBS = ['spacex/timing.js', 'spacex/tm.js', 'spacex/rockets.js', 'spacex_wb/assets/strokes.js', 'spacex_wb/common.js'];   // Append film-specific shared scripts here (such as 'spacex_wb/common.js').
window.SCENE_DIR = 'spacex_wb/scenes';
window.EXTRA_ASSETS = ['spacex_wb/assets/hand_1.png', 'spacex_wb/assets/hand_2.png', 'spacex_wb/assets/hand_3.png'];   // Pen-holding hand (gpt-image line art, green-screen keying; see assets/make_hand.py).
window.ERAS = ['s01','s02','s03','s04','s05','s06','s07','s08','s09','s10','s11','s12'].map(id => ({ id, get dur() { return TIMING.seg[id].dur; } }));
