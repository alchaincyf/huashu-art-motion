// Motion timing MO: easing, springs, stepping, stagger, beats. Pure time→value functions, no clock, deterministic.
// Source: eight YouTube explainer demos (references/09-视频动画语法.md). Convention: p progress 0..1, t/lt seconds.
//   Easing rule: explainers (3b1b/whiteboard) smooth/sineInOut stop at both ends; keynote appleOut/springs; kinetic type expoOut plus springs;
//   Vox camera sineInOut or longTail, papers 12fps steps; Kurzgesagt actions k75, loops easyEase.
(() => {
const { clamp, lerp } = U;
const MO = window.MO = {};

// Canvas sizing U.setStage / U.onStage in util.js (earlier paint/brush/render/post also register).

// ---------- Time slices ----------
MO.seg = (t, a, b) => clamp((t - a) / (b - a));                          // [a,b] → 0..1
MO.at = (t, t0, dur) => clamp((t - t0) / dur);                           // [t0, t0+dur] → 0..1
MO.anim = (lt, start, dur, ease = MO.smooth) => ease(clamp((lt - start) / dur));
// Stepped time: quantize continuous time to fps steps. Collage paper/type/highlighter on twos = 12fps; story characters 24fps; camera smooth 60fps.
MO.step = (t, fps = 12) => Math.floor(t * fps + 1e-6) / fps;

// ---------- manim easing (3b1b/manim rate_functions.py) ----------
// smooth = 6t⁵−15t⁴+10t³: zero endpoint velocity/acceleration. Default explainer easing.
MO.smooth = t => { t = clamp(t); return t * t * t * (10 - 15 * t + 6 * t * t); };
const sig = x => 1 / (1 + Math.exp(-x));
MO.smoothCE = (t, inflection = 10) => { const e = sig(-inflection / 2); return clamp((sig(inflection * (t - 0.5)) - e) / (1 - 2 * e)); };   // ManimCE version
MO.thereAndBack = t => MO.smooth(t < 0.5 ? 2 * t : 2 * (1 - t));          // Indicate: out and back
MO.rushInto = t => 2 * MO.smooth(t / 2);                                  // Slow start, rush to finish
MO.rushFrom = t => 2 * MO.smooth(t / 2 + 0.5) - 1;                        // Rush out, slow finish
MO.doubleSmooth = t => t < 0.5 ? 0.5 * MO.smooth(2 * t) : 0.5 * (1 + MO.smooth(2 * t - 1));
MO.wiggle = (t, wiggles = 2) => MO.thereAndBack(t) * Math.sin(wiggles * Math.PI * t);
// manim LaggedStart(lag_ratio=r): local progress of subanimation i among n at total p. Total length 1+(n-1)·r units; i occupies [i·r, i·r+1].
MO.lagged = (i, n, p, r = 0.05) => clamp(p * (1 + (n - 1) * r) - i * r);

// ---------- Common analytic easing (AE / CSS names) ----------
MO.linear = p => p;
MO.sineInOut = p => -(Math.cos(Math.PI * p) - 1) / 2;
MO.cubicIn = p => p * p * p;
MO.cubicOut = p => 1 - Math.pow(1 - p, 3);
MO.cubicInOut = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
MO.quartOut = p => 1 - Math.pow(1 - p, 4);
MO.quintOut = p => 1 - Math.pow(1 - p, 5);
MO.quintInOut = p => p < .5 ? 16 * p ** 5 : 1 - Math.pow(-2 * p + 2, 5) / 2;
MO.expoIn = p => p <= 0 ? 0 : Math.pow(2, 10 * p - 10);
MO.expoOut = p => p >= 1 ? 1 : 1 - Math.pow(2, -10 * p);                // Motion design's common fast-start, slow-stop curve
MO.expoInOut = p => p <= 0 ? 0 : p >= 1 ? 1 : p < .5 ? Math.pow(2, 20 * p - 10) / 2 : (2 - Math.pow(2, -20 * p + 10)) / 2;
// backOut overshoot: s=1.70158 about 10%; 2.2 about 13%; 2.6 about 17%; 3.5 about 23%
MO.backOut = (p, s = 1.70158) => { const q = p - 1; return 1 + (s + 1) * q * q * q + s * q * q; };
// Elastic settle: one overshoot and return (sticker slap)
MO.elasticOut = p => p <= 0 ? 0 : p >= 1 ? 1 : Math.pow(2, -10 * p) * Math.sin((p * 10 - 0.75) * (2 * Math.PI / 3)) + 1;

// ---------- CSS cubic-bezier(x1,y1,x2,y2): Newton solve x for parameter, then evaluate y ----------
MO.bezier = (x1, y1, x2, y2) => {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = s => ((ax * s + bx) * s + cx) * s, Y = s => ((ay * s + by) * s + cy) * s, dX = s => (3 * ax * s + 2 * bx) * s + cx;
  return p => {
    if (p <= 0) return 0; if (p >= 1) return 1;
    let s = p; for (let k = 0; k < 8; k++) { const e = X(s) - p, d = dX(s); if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break; s -= e / d; }
    s = clamp(s); return Y(s);
  };
};
MO.appleOut = MO.bezier(0.25, 0.1, 0.25, 1);        // CSS `ease`: Apple website/keynote transitions
MO.emphasized = MO.bezier(0.2, 0, 0, 1);            // Material 3 emphasized: long-tail deceleration
MO.k75 = MO.bezier(0.75, 0, 0.25, 1);               // Kurzgesagt other actions use 75% influence (y1 research §6.2)
MO.easyEase = MO.bezier(0.333, 0, 0.667, 1);        // AE Easy Ease: looping actions
MO.longTail = MO.bezier(0.33, 0, 0.2, 1);           // Vox follow line / pullback reveal: fast start, long-tail settle (y2 research)

// ---------- Springs ----------
// SwiftUI parameters (WWDC23 Animate with springs): stiffness=(2π/duration)², damping=4π(1-bounce)/duration → ζ=1-bounce, ω=2π/duration.
// Returns 0→1 displacement (may exceed 1 for overshoot), t seconds. Keynote UI: .smooth(bounce 0) / .snappy(0.15) / .bouncy(0.3).
MO.spring = (t, { duration = 0.5, bounce = 0, v0 = 0 } = {}) => {
  if (t <= 0) return 0;
  const w = 2 * Math.PI / duration, z = 1 - bounce;
  let x;                                                                 // x = remaining displacement (1→0)
  if (Math.abs(z - 1) < 1e-4) x = Math.exp(-w * t) * (1 + (w - v0) * t);
  else if (z < 1) { const wd = w * Math.sqrt(1 - z * z); x = Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w - v0) / wd) * Math.sin(wd * t)); }
  else { const r = Math.sqrt(z * z - 1), a = -w * (z - r), b = -w * (z + r); const A = (-v0 - b) / (a - b); x = A * Math.exp(a * t) + (1 - A) * Math.exp(b * t); }
  return 1 - x;
};
MO.smoothSpring = t => MO.spring(t, { duration: 0.5, bounce: 0 });
MO.snappy = t => MO.spring(t, { duration: 0.5, bounce: 0.15 });
MO.bouncy = t => MO.spring(t, { duration: 0.5, bounce: 0.3 });
// Frequency/decay underdamped spring step response (kinetic type): freq Hz, decay 1/s.
//   freq 3 / decay 6 first overshoot ≈37% (slamming large type); 2.5 / 9 ≈16% (standard pop); 2.2 / 10 ≈8% (main word settle)
MO.springHz = (t, freq = 2.5, decay = 9) => t <= 0 ? 0 : 1 - Math.exp(-decay * t) * Math.cos(2 * Math.PI * freq * t);
// Residual vibration (Dan Ebberts inertial bounce): amp·sin(2πft)/e^(decay·t). Body squash on pose changes, screen shakes.
MO.settle = (t, amp, freq = 3, decay = 5) => t <= 0 ? 0 : amp * Math.sin(2 * Math.PI * freq * t) / Math.exp(decay * t);

// ---------- Camera action durations (usage in references/镜头语言.md) ----------
// Two groups: transitional push/glide/pull (0.6–1.5s easing) default; accent punch/pan/slam reserved for reveals, numbers, reversals.
// Transitional measurements: Vox push 1.0–1.5s, find card 0.5–0.9s, pullback about 1s; 3b1b push about 1s.
// Accent measurements: film with constant 7.5% push every shot looked like slides; hold→0.28s punch→hold was approved. But 2026-10-12 Nobel short's punch every 2s was judged too frequent/fast, not smooth.
// Central durations used by CAM.track / MD / scenes; adjust timing here, never duplicate per scene.
MO.PULSE = { punch: 0.28, pan: 0.30, slam: 0.17, k: 0.25, kMin: 0.18, kMax: 0.32, push: 0.9, glide: 0.7, pull: 1.1 };
// Slam curve: k=0..1 → scale. 1.55 → 0.94 (first 60%, three impact frames) → 1.0 (last 40%, two rebound frames). k≤0 returns 1.55 (not landed).
MO.slamK = (k, from = 1.55, under = 0.94) => k <= 0 ? from : k < 0.6 ? from - (from - under) * (k / 0.6) : k < 1 ? under + (1 - under) * ((k - 0.6) / 0.4) : 1;
// Element slams at at frame: return current scale (before at = 0, do not draw). o: {dur=0.17, from=1.55, under=0.94}
MO.slam = (t, at, o = {}) => t < at ? 0 : MO.slamK((t - at) / (o.dur || MO.PULSE.slam), o.from, o.under);
// Action progress: ease 0→1 over dur from at, then hold 1 (default punch duration/curve; slow push: MO.pulse(t, at, MO.PULSE.push, MO.sineInOut))
MO.pulse = (t, at, dur = MO.PULSE.punch, ease = MO.cubicInOut) => ease(clamp((t - at) / dur));

// ---------- Continuous subtle motion ----------
// Only environment layers (stars, particles, distant clouds) and artistic scenes. Explainer subjects, labels, cards stay still once settled; no floating/breathing.
// Float: two sinusoidal frequencies. Avoid ≈5s periods (HIG: sustained ~0.2Hz sway causes discomfort)
MO.float = (t, amp = 6, period = 4, ph = 0) => amp * (0.75 * Math.sin(2 * Math.PI * t / period + ph) + 0.25 * Math.sin(2 * Math.PI * t / (period * 0.53) + ph * 1.7));

// ---------- Inversion and beats ----------
// Inverse easing (bisection): when line tip/count reaches y. E.g. smooth-drawn line's time at x (t3 shot2 event callout).
MO.invert = (ease, y, iters = 30) => { let a = 0, b = 1; for (let i = 0; i < iters; i++) { const m = (a + b) / 2; if (ease(m) < y) a = m; else b = m; } return (a + b) / 2; };
// Beats → seconds
MO.beat = (n, bpm = 120) => n * 60 / bpm;
// Align reveal frame to beat: segment start = bar line − reveal fraction × transition duration (y5: zoom .55, bands .6, push 90% displacement at .58)
MO.onBeat = (barTime, revealP, trDur) => barTime - revealP * trDur;
})();
