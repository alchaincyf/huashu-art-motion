// World camera CAM: explainer film is one continuous world canvas and camera, rather than separate pictures and transitions.
// Rule: camera derives only from film/segment time; redraw scene vectors per frame, keeping zoom transitions sharp instead of enlarging a 1920 bitmap 20-fold;
//       Engine continues rendering preceding segment into A buffer at t during transition, naturally continuing its camera push (live progression).
// cam = { x, y, z, r }: world (x,y) at screen center, zoom z (>1 pushes in), rotation r around center (radians). Defaults x=960,y=540,z=1,r=0.
(() => {
let W = 1920, H = 1080; U.onStage((w, h) => { W = w; H = h; });   // Canvas dimensions follow U.setStage (default 1920×1080)
const { clamp, lerp } = U;
const CAM = window.CAM = {};
const n = cam => ({ x: cam.x ?? W / 2, y: cam.y ?? H / 2, z: cam.z ?? 1, r: cam.r || 0 });

// Apply camera transform to c (caller handles save/restore)
CAM.apply = (c, cam) => { const k = n(cam); c.translate(W / 2, H / 2); if (k.r) c.rotate(k.r); c.scale(k.z, k.z); c.translate(-k.x, -k.y); };
// Draw fn(c) under camera, with automatic save/restore
CAM.with = (c, cam, fn) => { c.save(); CAM.apply(c, cam); fn(c); c.restore(); };
// World → screen / screen → world
CAM.toScreen = (cam, x, y) => { const k = n(cam); let dx = (x - k.x) * k.z, dy = (y - k.y) * k.z; if (k.r) { const cs = Math.cos(k.r), sn = Math.sin(k.r); [dx, dy] = [dx * cs - dy * sn, dx * sn + dy * cs]; } return [W / 2 + dx, H / 2 + dy]; };
CAM.toWorld = (cam, sx, sy) => { const k = n(cam); let dx = sx - W / 2, dy = sy - H / 2; if (k.r) { const cs = Math.cos(-k.r), sn = Math.sin(-k.r); [dx, dy] = [dx * cs - dy * sn, dx * sn + dy * cs]; } return [k.x + dx / k.z, k.y + dy / k.z]; };

// ---------- Zoom ----------
// Log interpolation: z0→z1 multiplies by equal factors each frame for perceptually constant scale travel; linear interpolation starts slow and accelerates. Use for all zooms.
CAM.zlerp = (z0, z1, e) => z0 * Math.pow(z1 / z0, e);
// Minimum zoom to enter radius-r circular opening and cover screen before transition ends = distance from opening center to farthest screen corner / r.
// Centered opening ≈ 1101/r (card says zoom ≥ 1100/radius). Smaller zoom leaves uncovered pixels and a final-frame jump.
CAM.coverZoom = (r, cx = W / 2, cy = H / 2) => Math.max(Math.hypot(cx, cy), Math.hypot(W - cx, cy), Math.hypot(cx, H - cy), Math.hypot(W - cx, H - cy)) / r;
// Return camera placing world (wx,wy) at screen (sx,sy) with zoom z; enables smoothly centering a pushed-in subject.
CAM.anchor = (wx, wy, z, sx, sy) => ({ x: wx - (sx - W / 2) / z, y: wy - (sy - H / 2) / z, z });
// Push toward world point: start at base camera, log-interpolate zoom to Z (progress e); point moves from original screen position toward center (progress k, default e; k=0 zooms in place).
// For entering a lens (y1), filling photo before hard cut (y2), pushing toward latest data point (t3, k=0).
CAM.pushTo = (base, wx, wy, Z, e, k = e, to = [W / 2, H / 2]) => {
  const s0 = CAM.toScreen(base, wx, wy), z = CAM.zlerp(n(base).z, Z, e);
  return CAM.anchor(wx, wy, z, lerp(s0[0], to[0], k), lerp(s0[1], to[1], k));
};

// ---------- Keyframes ----------
// keys = [{t, x, y, z, r, ease}]; ease applies from preceding key to this one, default cubicInOut; z log-interpolates.
// Path pans (Vox desk, whiteboard pans/whips) are keyframe sequences: sineInOut for smooth moves, cubicInOut plus blur for long jumps, MO.longTail for following lines.
CAM.at = (keys, t) => {
  if (t <= keys[0].t) return { ...keys[0] };
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (t <= b.t) { const e = (b.ease || MO.cubicInOut)(MO.seg(t, a.t, b.t));
      return { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), z: CAM.zlerp(a.z, b.z, e), r: lerp(a.r || 0, b.r || 0, e), v: e }; }
  }
  return { ...keys[keys.length - 1] };
};

// ---------- Camera action table (explainers; usage in references/镜头语言.md) ----------
// Default transitional moves: push, glide to next item, pull (0.6–1.5s, sineInOut / long tail); accent moves: punch, pan, slam,
// Reserved for reveals, numbers, reversals. Durations in MO.PULSE. Balance pushes with pulls, glides, or hard cuts; never push inward shot after shot.
// CAM.track(base, events, t) → cam: base initial {x, y, z}; events chronological camera actions; camera derives solely from t (deterministic, seekable).
// Each action starts from preceding action's final camera and settles at at + dur; overlapping action starts from preceding action's position at that instant.
//   {at, kind: 'push', k?, x?, y?, dur?}    Slow push (default kind): multiply z by (1+k), default k 0.2; 0.9s sineInOut; x,y also center this world point.
//   {at, kind: 'pull', k?, x?, y?, z?, dur?} Pull: multiply z by (1+k), default -1/6 cancels default push; z: base.z safest for full view; 1.1s long tail, for restoring context or ending paragraph.
//   {at, kind: 'glide', x, y, dur?}         Next item: constant zoom, center moves smoothly to world (x,y), 0.7s sineInOut; move between items on same wall.
//   {at, kind: 'to', x?, y?, z?, dur?, ease?} Move to specified camera (screenshot detail zoom via MD.zoomFor); default 0.9s sineInOut, dur: MO.PULSE.punch gives accent.
//   {at, kind: 'punch', k?, x?, y?, dur?}   Accent push: 0.28s cubicInOut, default k 0.25 (0.18–0.32); negative k gives fast pullback.
//   {at, kind: 'pan', x, y, dur?}            Accent pan: same zoom, 0.30s; sudden attention shift or comic beat.
//   {at, kind: 'slam', dur?, from?}          Whole-frame impact: multiply z by MO.slamK (1.55→0.94→1.0, 0.17s); large type, numbers, stamping frame.
//   {at, kind: 'shake', amp?, dur?}          Shake: vertical amp pixels (default 14) over dur (default 4 frames ≈ 0.13s), with slam/stamp; at most twice per film.
//   {at, kind: 'cut', x?, y?, z?}            Hard cut to camera (no transition). Shot-size changes can be cuts instead of moves.
// Returned cam includes moving: true/false for motion blur and label visibility.
CAM.track = (base, events, t) => {
  let cam = { x: base.x ?? W / 2, y: base.y ?? H / 2, z: base.z ?? 1 }, zMul = 1, dy = 0, moving = false;
  const evs = [...events].sort((a, b) => a.at - b.at);
  for (const e of evs) {
    if (t < e.at) break;
    const P = MO.PULSE, kind = e.kind || 'push';
    if (kind === 'cut') { cam = { x: e.x ?? cam.x, y: e.y ?? cam.y, z: e.z ?? cam.z }; continue; }
    if (kind === 'slam') { const d = e.dur || P.slam, k = (t - e.at) / d; if (k < 1) { zMul *= MO.slamK(k, e.from); moving = true; } continue; }
    if (kind === 'shake') { const d = e.dur || 4 / 30, k = (t - e.at) / d; if (k < 1) { dy += (e.amp ?? 14) * Math.sin(k * Math.PI * 4) * (1 - k) / cam.z; moving = true; } continue; }
    const D = { pan: P.pan, punch: P.punch, glide: P.glide, pull: P.pull, push: P.push, to: P.push }[kind] ?? P.push;
    const E = kind === 'punch' || kind === 'pan' || (e.dur && e.dur <= 0.35) ? MO.cubicInOut : kind === 'pull' ? MO.longTail : MO.sineInOut;   // Accent-duration to also uses punch curve
    const d = e.dur || D, p = (e.ease || E)(clamp((t - e.at) / d));
    let to;
    if (kind === 'pan' || kind === 'glide') to = { x: e.x ?? cam.x, y: e.y ?? cam.y, z: cam.z };
    else if (kind === 'to') to = { x: e.x ?? cam.x, y: e.y ?? cam.y, z: e.z ?? cam.z };
    else if (kind === 'pull') to = { x: e.x ?? cam.x, y: e.y ?? cam.y, z: e.z ?? cam.z * (1 + (e.k ?? -1 / 6)) };   // Default ×5/6 exactly cancels default push (×1.2)
    else to = { x: e.x ?? cam.x, y: e.y ?? cam.y, z: cam.z * (1 + (e.k ?? (kind === 'push' ? 0.2 : P.k))) };
    if (p < 1) moving = true;
    cam = { x: lerp(cam.x, to.x, p), y: lerp(cam.y, to.y, p), z: CAM.zlerp(cam.z, to.z, p) };
  }
  return { x: cam.x, y: cam.y + dy, z: cam.z * zMul, moving };
};

// ---------- Parallax ----------
// d=1 subject plane, d<1 distant, d>1 near. Translation scales linearly with d, zoom by z^d: deep pushes barely move distant layers (Kurzgesagt five-layer parallax).
CAM.layer = (c, cam, d, fn) => { const k = n(cam); c.save(); CAM.apply(c, { x: lerp(W / 2, k.x, d), y: lerp(H / 2, k.y, d), z: Math.pow(k.z, d) }); fn(c); c.restore(); };

// ---------- Movement ----------
// Instantaneous camera screen velocity (pixels/frame at 60fps): camFn(t) → cam, for motionBlur.
CAM.velocity = (camFn, t, dt = 1 / 60) => { const a = camFn(t), b = camFn(t - dt); const z = n(a).z; return [(n(a).x - n(b).x) * z, (n(a).y - n(b).y) * z]; };
// Motion blur: layer whole frame n times along velocity (whip pans; speed <1.5px falls back to single draw). Blur length should be shorter than camera displacement (PremiumBeat).
CAM.motionBlur = (c, src, vx, vy, k = 7) => {
  const sp = Math.hypot(vx, vy); if (sp < 1.5) { c.drawImage(src, 0, 0); return; }
  c.save(); for (let i = 0; i < k; i++) { const q = i / (k - 1) - 0.5; c.globalAlpha = i === 0 ? 1 : 1 / (i + 1); c.drawImage(src, -vx * q, -vy * q); } c.restore();
};
// Subtle handheld drift: two different-period sinusoids (continuous, no flicker), returns [dx,dy] pixels. Only artistic or atmospheric shots; stopped explainer cameras stay still.
CAM.drift = (t, amp = 6, seed = 0) => [amp * Math.sin(t * 0.9 + seed) + amp * 0.4 * Math.sin(t * 2.3 + seed * 2), amp * 0.7 * Math.sin(t * 1.1 + seed * 3)];
})();
