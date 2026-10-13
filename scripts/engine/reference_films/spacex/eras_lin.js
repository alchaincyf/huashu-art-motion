// SpaceX's 24 years · single-style lin. Durations from spacex/timing.js (same voiceover as mixed-style version); do not edit manually.
// Each scene sets incoming transition: ERAS.find(e => e.id === 'sXX').transition = { type, dur } (single-style films often use same: camera movement on one canvas).
window.PUNCH = 0;
window.SCENE_LIBS = ['spacex/timing.js', 'spacex/tm.js', 'spacex/rockets.js', 'transitions/lin_page.js', 'spacex_lin/presenter_meta.js', 'spacex_lin/common.js'];   // Shared: page transitions, presenter frame table, LIN library (presenter + header in GLOBAL_OVERLAY).
window.SCENE_DIR = 'spacex_lin/scenes';
window.ERAS = ['s01','s02','s03','s04','s05','s06','s07','s08','s09','s10','s11','s12'].map(id => ({ id, get dur() { return TIMING.seg[id].dur; } }));
