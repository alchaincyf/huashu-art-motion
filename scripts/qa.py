#!/usr/bin/env python3
# /// script
# dependencies = ["playwright", "numpy", "pillow"]
# ///
"""One-command code-animation QA: stability, efficiency, motion, smoothness; numbers + contact sheets. Required before delivery; numbers go into delivery notes.

    uv run qa.py --project <代码工程目录> [--film gallery] [--ids 01_cave,09_postimp] [--fps 30] [--out <目录>]
    uv run qa.py --spec <片段 clip.json> [--out <目录>]      # Parameterized clips: measure whole clip as one segment, portrait supported; no transitions
                                                              # Same assets as render.py (engine/spec_assets.py): image, frames, data.image, data.character

Four checks per segment (each eras.js id):
  1. Stability: exit on scene load errors (engine __bootErrors); compare cold and two warm renders pixel-by-pixel at same time (determinism).
  2. Efficiency: frame time includes getImageData(1×1) to force GPU completion (JS-only timing falsely reports 1ms; migration test B).
  3. Motion: avoid 0.35s post-transition camera impact; sample continuously at --fps within stable section; mean moving area (adjacent pixel change >12),
     and still-pair fraction (almost unchanged <0.05%; migration test A found endpoint differences miss stepped stillness).
  4. Smoothness: adjacent difference peak/median. >6 with peak >3% is jump (8fps whole-screen stroke reseeding, glitches, flashes).
     Camera actions (punch 0.28s, pan 0.30s, slam 0.17s, slow push 0.9s, find next object 0.7s, pull out 1.1s) are separate camera events: expand both sides of jump until difference falls,
     at least two frame pairs, at most 2s (+1 frame), final frame farthest from first (move then stay, not flash/return); runs >0.35s also stay smooth,
     no single-frame spike >2.5× neighbors. Before 2026-10-12 only ≤0.35s qualified, making slow pushes look like jumps and pressuring faster cameras.
     Isolated one/two frames (glitches/white flashes/whole-screen reseeding), flash-and-return, and longer runs remain jumps. Pixels only, no camera-action tables,
     so handwritten pushes count like CAM.track; cost: monotonic smooth large changes (e.g. new full-screen image immediately followed by push) also count as camera events.
Separate transition smoke: render full frame (renderFrame) at p=.25/.5/.75 for every transition segment; errors count as page errors, because within-segment samples use renderSolo
which never runs transition code, so broken transitions otherwise still pass (found while porting all-style demos).
Criteria are empirical thresholds, not rules: most motion 0.5–8% looks good; still pairs >40% reads choppy; jumps >0 need visual judgment (intentional beat flashes may be fine).
  5. Text boundaries:
     Record screen bounds of all fillText/strokeText from page load; report when sustained ≥0.3s while sampling:
     cropped text (part outside frame), overlapping different strings, text inside subtitle band (burned subtitles cover it);
     also near-blank frames (almost no content: white flashes/black). Inspection hints, not errors, never fail QA.
     Bounds follow canvas: text in offscreen/sprite caches (including startup caches) composited via drawImage, and bitmap push-ins, are measured.
     Subtitle band: whole-film default y>920/1080 (--sub-band changes, 0 disables); --spec uses safe.bottom, absent means unchecked.
     Blind spots: ① sampling starts max(--skip, transition duration), missing segment starts/transitions; opening blank boards with pen/hand >0.3% are not near-blank.
     ② Clipped text (rolling numbers/stroke reveals) checks cropping/subtitle band but not overlap. ③ Occlusion by non-text objects (photos/paperclips/presenter/later cards) is invisible,
     both strings hidden may falsely report overlap. ④ Graphics (flames/ships) in subtitle band undetected; use finished-film scripts/subzone_gate.py for light backgrounds.
     ⑤ Per-glyph handwriting reports each glyph; inspect frames to locate. Intentional oversized decorative text in band/offscreen (y5 watermark numbers) is reported; accept after inspection.

Outputs: <out>/qa.json (all numbers), <out>/qa.md (table), <out>/<id>.jpg (four-frame sheet + motion heatmap).
"""
import argparse, base64, functools, http.server, io, json, socketserver, sys, threading, urllib.parse
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent / 'engine'))
import spec_assets
import numpy as np
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
ap.add_argument('--project'); ap.add_argument('--spec', help='参数化片段 spec（走 clip.html，和 render.py --spec 同一套）'); ap.add_argument('--ids'); ap.add_argument('--fps', type=float, default=30)
ap.add_argument('--out'); ap.add_argument('--film', default='', help='片子名：读 eras_<名>.js'); ap.add_argument('--skip', type=float, default=0.35, help='每段开头跳过的秒数（镜头冲击）')
ap.add_argument('--sub-band', type=float, default=None, help='字幕带上沿（占画高比例）；整片默认 0.852（920/1080），--spec 默认读 safe.bottom；写 0 关掉「进字幕带」检查')
a = ap.parse_args()
if not (a.project or a.spec): ap.error('--project 或 --spec 二选一')
spec, ALLOWED = None, set()
if a.spec:                                                 # Same as render.py: local image / frames / character frame library serves only files named in spec
    sp = Path(a.spec).resolve(); spec = json.loads(sp.read_text())
    try: spec_assets.localize(spec, sp.parent, ALLOWED)
    except FileNotFoundError as e: raise SystemExit(str(e))
root = Path(a.project).resolve() if a.project else Path(__file__).resolve().parent / 'engine'
out = Path(a.out) if a.out else (Path(a.spec).resolve().parent / 'qa' if a.spec else root.parent / 'qa'); out.mkdir(parents=True, exist_ok=True)
VW, VH = (spec.get('width', 1920), spec.get('height', 1080)) if spec else (1920, 1080)
if a.sub_band is None:   # Pipeline clips reserve subtitles via spec safe.bottom; absent means no burned-in subtitles
    sb = ((spec or {}).get('safe') or {}).get('bottom', 0) if spec else None
    a.sub_band = 0.852 if sb is None else (1 - sb / VH if sb else 0)

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *x): pass
    def translate_path(self, path):
        if path.startswith('/__file__/'):
            f = urllib.parse.unquote(path[len('/__file__/'):].split('?')[0])
            return f if f in ALLOWED else '/nonexistent'
        return super().translate_path(path)
# Chromium may open idle connections while loading scripts in parallel.
class LocalServer(socketserver.ThreadingTCPServer):
    request_queue_size = 128
    daemon_threads = True

srv = LocalServer(('127.0.0.1', 0), functools.partial(Q, directory=str(root))); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()

# Text-boundary checks: wrap fillText/strokeText, record transformed screen bounds for text on full-screen-sized canvases
TEXT_HOOK = '''(() => {
  // 字的外框记在「它被画上的那张画布」上；这张画布被 drawImage 贴到别处时，外框跟着变换过去。
  // 这样先画进离屏缓冲再整体推镜（讲解员片的位图推镜）、画进精灵缓存再贴上桌（Vox 的剪纸）的字也量得到。
  const P = CanvasRenderingContext2D.prototype;
  const sv = P.save, rs = P.restore, cl = P.clip, di = P.drawImage, cr = P.clearRect, fr = P.fillRect;
  // 记住「当前有没有 clip」：滚动数字、按笔顺揭开的字都画在 clip 里，外框比看得见的大，不拿来判叠字
  P.save = function () { (this.__cs || (this.__cs = [])).push(!!this.__clip); return sv.apply(this, arguments); };
  P.restore = function () { if (this.__cs && this.__cs.length) this.__clip = this.__cs.pop(); return rs.apply(this, arguments); };
  P.clip = function () { this.__clip = true; return cl.apply(this, arguments); };
  // 「整张画布被盖掉」时清空这张画布的外框记录，不然缓存画布重画后，上一段的字还留在记录里（白板 s03 的「火箭」误报到 s04）
  const full = (ctx, x, y, w, h) => {                        // 这个矩形经过当前变换后是否盖满整张画布（只认无旋转的变换）
    const T = ctx.getTransform(); if (T.b !== 0 || T.c !== 0) return false;
    const xs = [T.a * x + T.e, T.a * (x + w) + T.e], ys = [T.d * y + T.f, T.d * (y + h) + T.f];
    return Math.min(...xs) <= 0 && Math.min(...ys) <= 0 && Math.max(...xs) >= ctx.canvas.width && Math.max(...ys) >= ctx.canvas.height;
  };
  const opaque = ctx => { const f = ctx.fillStyle; if (typeof f !== 'string') return false; const m = f.match(/^(rgba|hsla)\\(([^)]*)\\)/); return !m || +m[2].split(/[ ,\\/]+/).filter(Boolean)[3] >= 1; };
  P.clearRect = function (x, y, w, h) { if (full(this, x, y, w, h)) this.canvas.__tb = []; return cr.apply(this, arguments); };
  P.fillRect = function (x, y, w, h) { if (this.globalAlpha >= 1 && (this.globalCompositeOperation === 'copy' || (this.globalCompositeOperation === 'source-over' && opaque(this))) && full(this, x, y, w, h)) this.canvas.__tb = []; return fr.apply(this, arguments); };
  if (P.reset) { const rz = P.reset; P.reset = function () { this.canvas.__tb = []; this.__cs = []; this.__clip = false; return rz.apply(this, arguments); }; }
  const pid = P.putImageData;
  P.putImageData = function (im, x, y) { if (x <= 0 && y <= 0 && x + im.width >= this.canvas.width && y + im.height >= this.canvas.height) this.canvas.__tb = []; return pid.apply(this, arguments); };
  for (const k of ['width', 'height']) {                       // 改画布尺寸会清空画布，外框也清掉
    const d = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, k);
    Object.defineProperty(HTMLCanvasElement.prototype, k, { get: d.get, set(v) { this.__tb = []; d.set.call(this, v); }, configurable: true });
  }
  const push = (ctx, rec) => { const L = ctx.canvas.__tb || (ctx.canvas.__tb = []); L.push(rec); if (L.length > 6000) L.splice(0, 3000); };   // 只局部清、反复重画的画布会越记越多，留最近的
  for (const fn of ['fillText', 'strokeText']) {
    const orig = P[fn];
    P[fn] = function (text, x, y, maxW) {
      if (this.globalAlpha > 0.15 && String(text).trim()) {     // 从加载起一直记：启动时预画进缓存的字（Vox 的 prewarm）也要有外框
        const m = this.measureText(text), T = this.getTransform();
        let x0 = x - m.actualBoundingBoxLeft, x1 = x + m.actualBoundingBoxRight;
        if (maxW && x1 - x0 > maxW) x1 = x0 + maxW;
        const y0 = y - m.actualBoundingBoxAscent, y1 = y + m.actualBoundingBoxDescent;
        const xs = [], ys = [];
        for (const [px, py] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) { xs.push(T.a * px + T.c * py + T.e); ys.push(T.b * px + T.d * py + T.f); }
        push(this, [String(text).slice(0, 24), xs, ys, !!this.__clip]);
      }
      return orig.apply(this, arguments);
    };
  }
  P.drawImage = function (src, ...a) {
    if (this.globalCompositeOperation === 'copy') this.canvas.__tb = [];
    const L = src && src.__tb;
    if (L && L.length && src !== this.canvas && this.globalAlpha > 0.5) {   // ≤0.5 多半是运动残影／拖尾叠层，不传（白板甩镜残影会叠出满屏假叠字）
      let sx = 0, sy = 0, sw = src.width, sh = src.height, dx, dy, dw = sw, dh = sh;
      if (a.length === 2) [dx, dy] = a; else if (a.length === 4) [dx, dy, dw, dh] = a; else [sx, sy, sw, sh, dx, dy, dw, dh] = a;
      const T = this.getTransform(), kx = dw / sw, ky = dh / sh, clip = !!this.__clip || a.length === 8;
      for (const [txt, xs, ys, c0] of L) {
        if (Math.max(...xs) < sx || Math.min(...xs) > sx + sw || Math.max(...ys) < sy || Math.min(...ys) > sy + sh) continue;
        const X = [], Y = [];
        for (let k = 0; k < 4; k++) { const u = dx + (xs[k] - sx) * kx, v = dy + (ys[k] - sy) * ky; X.push(T.a * u + T.c * v + T.e); Y.push(T.b * u + T.d * v + T.f); }
        push(this, [txt, X, Y, c0 || clip]);
      }
    }
    return di.call(this, src, ...a);
  };
})();'''
GRAB = '''async ([id, lt, full]) => {
  window.__tb = true; window.__canvas.__tb = [];
  const s = performance.now();
  if (full) { await window.prepare(lt); window.renderFrame(lt); } else window.renderSolo(id, lt);
  window.__canvas.getContext('2d').getImageData(0, 0, 1, 1);           // 强制 GPU 画完再停表
  const ms = performance.now() - s;
  const M = window.__canvas, tb = (M.__tb || []).map(([t, xs, ys, c]) => [t, xs.map(v => v / M.width), ys.map(v => v / M.height), c]); window.__tb = null;
  return [ms, window.__canvas.toDataURL('image/png').split(',')[1], tb];
}'''

def frame_issues(tb, band):
    """Boundary issues in one frame: [(category, text)]. Coordinates normalized to image."""
    out, vis = [], []
    for txt, cxs, cys, clipped in tb:
        x0, y0, x1, y1 = min(cxs), min(cys), max(cxs), max(cys)
        ang = float(np.arctan2((cys[1] - cys[0]) * VH, (cxs[1] - cxs[0]) * VW))
        w, h = x1 - x0, y1 - y0
        if w <= 0 or h <= 0 or h < 0.008: continue                 # Ignore tiny text (<9px)
        ix0, iy0, ix1, iy1 = max(x0, 0), max(y0, 0), min(x1, 1), min(y1, 1)
        if ix1 <= ix0 or iy1 <= iy0: continue                      # Entirely offscreen: camera does not show it, ignore
        frac = (ix1 - ix0) * (iy1 - iy0) / (w * h)
        if frac < 0.9 and frac > 0.1: out.append(('半截字', txt))
        if band and iy1 > band + 0.004 and frac > 0.1: out.append(('进字幕带', txt))
        if not clipped: vis.append((txt, ang, cxs, cys))
    def box(v, ang):                                                    # Measure bounds in ang coordinates: two tilted label lines do not falsely overlap through enlarged axis-aligned boxes
        c, s_ = np.cos(-ang), np.sin(-ang)
        u = [x * c - y * s_ * VH / VW for x, y in zip(v[2], v[3])]; w = [x * s_ * VW / VH + y * c for x, y in zip(v[2], v[3])]
        return min(u), min(w), max(u), max(w)
    for i in range(len(vis)):
        for j in range(i + 1, len(vis)):
            a, b = vis[i], vis[j]
            if a[0] == b[0]: continue                                   # Same text drawn twice (outline + fill, shadow)
            same = abs(a[1] - b[1]) < 0.02; ang = a[1] if same else 0.0
            A, B = box(a, ang), box(b, ang)
            if not same:                                                # Different angles (per-glyph handwriting jitter): axis-aligned bounds expand; inset each 12% before comparison
                A, B = [(r[0] + (r[2] - r[0]) * .12, r[1] + (r[3] - r[1]) * .12, r[2] - (r[2] - r[0]) * .12, r[3] - (r[3] - r[1]) * .12) for r in (A, B)]
            ow = min(A[2], B[2]) - max(A[0], B[0]); oh = min(A[3], B[3]) - max(A[1], B[1])
            if ow <= 0 or oh <= 0: continue
            small = min((A[2] - A[0]) * (A[3] - A[1]), (B[2] - B[0]) * (B[3] - B[1]))
            if ow * oh / small > 0.3: out.append(('叠字', a[0] + '｜' + b[0]))
    return out

def persistent(ts, per_frame, min_s=0.3):
    """Report only issues lasting ≥min_s (brief cropped text while camera pans is normal)."""
    runs, open_ = [], {}
    for k, t in enumerate(ts):
        cur = set(per_frame[k])
        for key in list(open_):
            if key not in cur:
                t0, t1 = open_.pop(key)
                if t1 - t0 >= min_s: runs.append((key, t0, t1))
        for key in cur:
            if key in open_: open_[key] = (open_[key][0], t)
            else: open_[key] = (t, t)
    runs += [(key, t0, t1) for key, (t0, t1) in open_.items() if t1 - t0 >= min_s]
    return sorted(runs, key=lambda r: r[1])

def merge_runs(runs):
    """Character-by-character writing produces individual entries: merge same-category overlapping spans and concatenate text."""
    out = []
    for (kind, txt), t0, t1 in sorted(runs, key=lambda r: (r[0][0], r[1])):
        if out and out[-1][0] == kind and t0 <= out[-1][3] + 0.05:
            o = out[-1]; o[3] = max(o[3], t1)
            if txt and txt not in o[1].split('、') and len(o[1]) < 60: o[1] = (o[1] + '、' + txt).strip('、')
        else: out.append([kind, txt, t0, t1])
    return sorted(out, key=lambda r: r[2])

def near_blank(f):
    """<0.3% pixels differing >24 from dominant image color means almost no content."""
    med = np.median(f.reshape(-1, 3), axis=0)
    return float((np.abs(f - med).max(axis=2) > 24).mean()) < 0.003
def img(b64, w=480): return np.asarray(Image.open(io.BytesIO(base64.b64decode(b64))).convert('RGB').resize((w, round(w * VH / VW)))).astype(np.int16)   # Scale with canvas size without squashing portrait

def camera_events(frames, diffs, idx, fps, max_s=2.0):
    """Extract camera actions (push/pull/pan/slam) from jumps (header criterion four). idx: jump pair indices. Returns (remaining jump indices, camera events [(l, r)])."""
    keep, events = [], []
    for i in idx:
        if any(l <= i <= r for l, r in events): continue
        thr = max(0.5, 0.1 * diffs[i]); l = r = i
        while l > 0 and diffs[l - 1] > thr: l -= 1
        while r < len(diffs) - 1 and diffs[r + 1] > thr: r += 1
        n = r - l + 1
        far = [float(np.abs(frames[k] - frames[l]).mean()) for k in range(l + 1, r + 2)]   # Distance of every frame in run from first frame
        smooth = n <= 0.35 * fps + 1 or all(diffs[k] <= 2.5 * max(diffs[k - 1], diffs[k + 1]) + 0.5 for k in range(l + 1, r))   # Runs over 0.35s must stay smooth, no isolated spikes
        if 2 <= n <= max_s * fps + 1 and far[-1] >= 0.8 * max(far) and smooth: events.append((l, r))
        else: keep.append(i)
    return [i for i in keep if not any(l <= i <= r for l, r in events)], events

report = {'project': str(root), 'spec': str(Path(a.spec).resolve()) if a.spec else None, 'segments': []}
errors = []
with sync_playwright() as p:
    br = p.chromium.launch(args=['--enable-gpu-rasterization', '--ignore-gpu-blocklist'])
    pg = br.new_page(viewport={'width': VW, 'height': VH})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('console', lambda m: errors.append('console.error: ' + m.text) if m.type == 'error' else None)   # Missing glyphs etc. reported via console.error
    pg.add_init_script(TEXT_HOOK)
    if spec:
        pg.add_init_script('window.CLIP_SPEC = ' + json.dumps(spec, ensure_ascii=False) + ';')
        pg.goto(f'http://127.0.0.1:{port}/clip.html?render=1')
    else:
        pg.goto(f'http://127.0.0.1:{port}/index.html?render=1' + (f'&film={a.film}' if a.film else ''))
    pg.wait_for_function('window.__ready === true || !!window.__bootFailed', timeout=180000)
    bf = pg.evaluate('window.__bootFailed || null')
    if bf: raise SystemExit('❌ 场景加载失败：\n' + bf)
    segs = [{'id': Path(a.spec).resolve().parent.name, 't0': 0, 't1': spec['duration'], 'tr': 0}] if spec else \
        pg.evaluate('ERAS.map(e => ({id: e.id, t0: e.t0, t1: Math.min(e.t1, window.__total), tr: e.transition ? e.transition.dur + (e.transition.delay || 0) : 0}))')
    want = set(a.ids.split(',')) if a.ids else None
    for s in segs:
        if want and s['id'] not in want: continue
        dur = s['t1'] - s['t0']; lt0 = max(a.skip, s['tr']) if s['t0'] > 0 else 0.0
        lt1 = max(lt0 + 0.2, dur - 0.02)
        n = max(4, int((lt1 - lt0) * a.fps))
        ts = [lt0 + (lt1 - lt0) * i / (n - 1) for i in range(n)]
        full = bool(spec)                                   # Clips lack renderSolo; render whole frame
        cold_ms, cold, _ = pg.evaluate(GRAB, [s['id'], ts[-1], full])
        frames, ms, tbs = [], [], []
        for t in ts:
            m, b64, tb = pg.evaluate(GRAB, [s['id'], t, full]); ms.append(m); frames.append(img(b64)); tbs.append(tb or [])
        _, again, _ = pg.evaluate(GRAB, [s['id'], ts[-1], full])
        det = int(np.abs(img(again) - frames[-1]).max()); det_cold = int(np.abs(img(cold) - frames[-1]).max())
        diffs = np.array([(np.abs(frames[i + 1] - frames[i]).max(axis=2) > 12).mean() * 100 for i in range(len(frames) - 1)])
        med = float(np.median(diffs)) if len(diffs) else 0
        if spec:   # Clips often move then hold: median≈0, continuous pushes/slides otherwise look like jumps. Only isolated jumps count: >6× median of three pairs before/after
            loc = lambda i: float(np.median(np.r_[diffs[max(0, i - 3):i], diffs[i + 1:i + 4]])) if len(diffs) > 1 else 0
            sidx = [i for i, d in enumerate(diffs) if d > 3 and d > 6 * max(loc(i), 0.05)]
        else:
            sidx = [i for i, d in enumerate(diffs) if d > 3 and d > 6 * max(med, 0.05)]
        sidx, cams = camera_events(frames, diffs, sidx, a.fps)
        spikes = [round(ts[i + 1], 3) for i in sidx]
        still = float((diffs < 0.05).mean() * 100)
        heat = np.zeros(frames[0].shape[:2]); [heat.__iadd__((np.abs(frames[i + 1] - frames[i]).max(axis=2) > 12)) for i in range(len(frames) - 1)]
        rec = {'id': s['id'], 'window_lt': [round(lt0, 3), round(lt1, 3)], 'frames': n,
               'ms_mean': round(float(np.mean(ms)), 1), 'ms_max': round(float(np.max(ms)), 1), 'ms_cold': round(cold_ms, 1),
               'deterministic': det == 0 and det_cold == 0, 'det_maxdiff': max(det, det_cold),
               'motion_pct': round(float(diffs.mean()), 2), 'motion_max': round(float(diffs.max()), 2), 'still_pairs_pct': round(still, 1),
               'spike_ratio': round(float(diffs.max() / max(med, 0.05)), 1), 'spikes_at_lt': spikes,
               'camera_events_lt': [[round(ts[l], 3), round(ts[r + 1], 3)] for l, r in cams]}
        frame_runs = merge_runs(persistent(ts, [frame_issues(tb, a.sub_band) for tb in tbs]) +
                                persistent(ts, [[('近空白', '')] if near_blank(f) else [] for f in frames]))
        rec['framing'] = [{'kind': k, 'text': txt, 'lt': [round(t0, 2), round(t1, 2)], 't': [round(s['t0'] + t0, 2), round(s['t0'] + t1, 2)]} for k, txt, t0, t1 in frame_runs]
        rec['text_tracked'] = sum(map(len, tbs))
        report['segments'].append(rec)
        # Contact sheet: four frames + heatmap
        pick = [frames[int(k)] for k in np.linspace(0, n - 1, 4)]
        H_, W_ = frames[0].shape[:2]; S = Image.new('RGB', (W_ * 5, H_ + 20), 'white'); dr = ImageDraw.Draw(S)
        for k, f in enumerate(pick): S.paste(Image.fromarray(f.astype(np.uint8)), (k * W_, 20))
        hm = np.clip(heat / max(1, heat.max()) * 255, 0, 255).astype(np.uint8)
        base = Image.fromarray(pick[0].astype(np.uint8)).convert('L').convert('RGB'); red = np.zeros((H_, W_, 3), np.uint8); red[..., 0] = hm
        S.paste(Image.blend(base, Image.fromarray(red), 0.6), (4 * W_, 20))
        dr.text((4, 4), f"{s['id']}  运动 {rec['motion_pct']}%  静止帧对 {rec['still_pairs_pct']}%  跳变 {len(spikes)}  镜头事件 {len(cams)}  {rec['ms_mean']}/{rec['ms_max']}ms  确定性 {'✓' if rec['deterministic'] else '✗'}", fill='black')
        S.save(out / f"{s['id']}.jpg", quality=85)
        print(f"{s['id']:<18} 运动 {rec['motion_pct']:>5}%  静止帧对 {rec['still_pairs_pct']:>5}%  跳变 {len(spikes)}  镜头事件 {len(cams)}  {rec['ms_mean']:>6}/{rec['ms_max']:>6}ms  确定性 {'✓' if rec['deterministic'] else '✗ ' + str(rec['det_maxdiff'])}  框景 {len(rec['framing'])}")
        for r in rec['framing']: print(f"    {r['kind']}  {r['t'][0]:.2f}–{r['t'][1]:.2f}s  {r['text']}")
    # Transition smoke: renderability/timing only, not motion/smoothness criteria
    report['transitions'] = []
    for s in ([] if spec else pg.evaluate('ERAS.map(e => ({id: e.id, t0: e.t0, tr: e.transition ? {type: e.transition.type, dur: e.transition.dur, delay: e.transition.delay || 0} : null}))')):
        if not s['tr'] or (want and s['id'] not in want): continue
        ms_tr = []
        for p in (0.25, 0.5, 0.75):
            t = s['t0'] + s['tr']['delay'] + s['tr']['dur'] * p
            try:
                m, *_ = pg.evaluate(GRAB, [s['id'], t, True]); ms_tr.append(m)
            except Exception as ex:
                errors.append(f"转场 {s['tr']['type']}（进入 {s['id']}）p={p}: {str(ex).splitlines()[0]}")
        report['transitions'].append({'id': s['id'], 'type': s['tr']['type'], 'ms_max': round(max(ms_tr), 1) if ms_tr else None})
    if report['transitions']: print('转场冒烟', len(report['transitions']), '个，最慢', max((r['ms_max'] or 0, r['type']) for r in report['transitions']))
    br.close()
srv.shutdown()
srv.server_close()
report['page_errors'] = errors
json.dump(report, open(out / 'qa.json', 'w'), ensure_ascii=False, indent=1)
rows = ['| 段 | 运动% | 静止帧对% | 跳变 | 镜头事件 | 均/峰 ms | 冷启动 ms | 确定性 | 框景 |', '|---|---|---|---|---|---|---|---|---|']
for r in report['segments']:
    rows.append(f"| {r['id']} | {r['motion_pct']} | {r['still_pairs_pct']} | {len(r['spikes_at_lt'])} {r['spikes_at_lt'][:3]} | {len(r['camera_events_lt'])} | {r['ms_mean']}/{r['ms_max']} | {r['ms_cold']} | {'✓' if r['deterministic'] else '✗'} | {len(r['framing'])} |")
fr = [(r['id'], x) for r in report['segments'] for x in r['framing']]
if fr: rows += ['', '框景线索（全片秒，持续 ≥0.3s；去看这一帧再判断）：'] + [f"- {x['kind']} {x['t'][0]:.2f}–{x['t'][1]:.2f}s（{i}）{x['text']}" for i, x in fr]
if report.get('transitions'): rows += ['', '转场冒烟（整帧，峰值 ms）：' + '，'.join(f"{r['type']}→{r['id']} {r['ms_max']}" for r in report['transitions'])]
(out / 'qa.md').write_text('\n'.join(rows) + ('\n\n页面报错：\n' + '\n'.join(errors) if errors else '') + '\n')
print('->', out / 'qa.md')
if not spec and root != Path(__file__).resolve().parent / 'engine':   # Feedback fallback (reference 11 section one): QA required before delivery; remind here without failing QA
    import re, time
    draft = next((d / '经验回流-草稿.md' for d in (root.parent, root.parent.parent) if (d / '经验回流-草稿.md').exists()), None)
    if not draft: print(f'回流提醒：项目根（{root.parent.name}）还没有 经验回流-草稿.md。每轮改完追加几条，格式见 skill 的 references/11-进化协议.md 第四节。')
    else:
        txt = draft.read_text(); age = (time.time() - draft.stat().st_mtime) / 60
        tail = txt.rsplit('> 水位线', 1)[-1] if '> 水位线' in txt else txt     # Below watermark = not yet written back to skill
        n = len(re.findall(r'^### \[', tail, re.M))
        print(f'回流提醒：经验回流-草稿.md 最近一次写入在 {age:.0f} 分钟前；还没写回 skill 的有 {n} 条（收活时按 11 号归宿表整合，整合完在草稿末尾加一行「> 水位线 <时间>」）。')
if errors: raise SystemExit('❌ 页面运行时报错 %d 条，见 qa.md' % len(errors))
