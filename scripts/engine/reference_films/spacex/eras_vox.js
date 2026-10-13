// SpaceX's 24 years · single-style vox. Durations from spacex/timing.js (same voiceover as mixed-style version); do not edit manually.
// Each scene sets incoming transition: ERAS.find(e => e.id === 'sXX').transition = { type, dur } (single-style films often use same: camera movement on one canvas).
window.PUNCH = 0;
window.SCENE_LIBS = ['spacex/timing.js', 'spacex/tm.js', 'spacex/rockets.js', 'spacex_vox/common.js'];   // Append film-specific shared scripts here (such as 'spacex_vox/common.js').
window.SCENE_DIR = 'spacex_vox/scenes';
window.ERAS = ['s01','s02','s03','s04','s05','s06','s07','s08','s09','s10','s11','s12'].map(id => ({ id, get dur() { return TIMING.seg[id].dur; } }));
