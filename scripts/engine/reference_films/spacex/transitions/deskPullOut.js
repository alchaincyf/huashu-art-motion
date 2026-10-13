// S03 → S04 entrance (Vox pullback from one photo to reveal entire collage):
// Old frame becomes halftone photo on desk in place — at p=0 inner photo fills screen exactly (= original frame); long-tail pullback reveals desk, clippings, and red thread;
// Old frame receives 45° halftone and aged paper tint each frame; at p=1 matches S04's cached photo pixel for pixel. Camera and halftone are in spacex/scenes/s04.js (S04X).
TRANSITIONS.deskPullOut = (c, A, B, p, o) => { c.drawImage(B, 0, 0); S04X.photoLive(c, A, o.lt, p); };
