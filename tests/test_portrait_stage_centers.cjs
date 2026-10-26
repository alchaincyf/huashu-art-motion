const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const repo = path.resolve(__dirname, '..');
const stageListeners = [];
const U = {
  onStage(fn) { stageListeners.push(fn); },
  rng() { return () => 0.5; },
  hash() { return 0.5; },
  clamp(value, min, max) { return Math.max(min, Math.min(max, value)); },
  lerp(a, b, t) { return a + (b - a) * t; }
};
class Path2DStub { rect() {} addPath() {} }
class DOMMatrixStub { translate() { return this; } rotate() { return this; } }
const PAINT = {};
const context = { U, window: { PAINT }, Path2D: Path2DStub, DOMMatrix: DOMMatrixStub, console };
vm.createContext(context);
for (const file of ['post.js', 'render.js']) {
  vm.runInContext(fs.readFileSync(path.join(repo, 'scripts/engine/lib', file), 'utf8'), context);
}

function makeCanvas(log) {
  const gradient = { addColorStop() {} };
  const methods = {
    createRadialGradient(...args) { log.radial.push(args); return gradient; },
    createLinearGradient(...args) { log.linear.push(args); return gradient; },
    moveTo(x, y) { log.moves.push([x, y]); },
    lineTo(x, y) { log.lines.push([x, y]); },
    save() {}, restore() {}, clip() {}, beginPath() {}, rect() {}, roundRect() {},
    fill() {}, stroke() {}, fillRect() {}, drawImage() {}, arc() {}, closePath() {},
    bezierCurveTo() {}
  };
  return new Proxy(methods, {
    get(target, key) { return key in target ? target[key] : undefined; },
    set(target, key, value) { target[key] = value; return true; }
  });
}
function freshLog() { return { radial: [], linear: [], moves: [], lines: [] }; }
function setStage(width, height) { for (const update of stageListeners) update(width, height); }
function verifyStageCenter(width, height) {
  setStage(width, height);
  const expected = [width / 2, height / 2];

  const filmLog = freshLog();
  PAINT.cached = (_key, _width, _height, draw) => { draw(makeCanvas(filmLog)); return {}; };
  PAINT.film(makeCanvas(filmLog), 0, { scratches: 0, dust: 0, grain: false, gate: true });
  assert.deepEqual(filmLog.radial[0].slice(0, 2), expected, `film gate center at ${width}x${height}`);
  assert.deepEqual(filmLog.radial[0].slice(3, 5), expected, `film gate outer center at ${width}x${height}`);

  const flareLog = freshLog();
  PAINT.lensFlare(makeCanvas(flareLog), [100, 100], 0, { core: 1, rays: 0, streak: 0, ghosts: [[1, 0, '0,0,0', 1]] });
  assert.deepEqual(flareLog.moves[0], expected, `lens flare ghost center at ${width}x${height}`);

  const shadeLog = freshLog();
  PAINT.kirbyShade(makeCanvas(shadeLog), {}, { gap: 1 });
  const centerLine = 260; // k runs from -260 through 259, so index 260 is k=0.
  const midpoint = shadeLog.moves[centerLine].map((value, axis) => (value + shadeLog.lines[centerLine][axis]) / 2);
  assert.deepEqual(midpoint, expected, `Kirby hatch center at ${width}x${height}`);
}

verifyStageCenter(1920, 1080);
verifyStageCenter(1080, 1920);
console.log('Stage-relative effect centers pass for landscape and portrait stages.');
