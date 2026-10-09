#!/usr/bin/env python3
"""逐帧渲染：起本地 http 服务 → 无头 Chromium 打开 index.html → 对每帧调用 window.renderFrame(t)
→ 读 canvas 像素 → 管道送 ffmpeg 出 60fps mp4，最后混入音轨。

uv run --with playwright python render.py --out ../成片/复刻_v1.mp4 [--audio ../音频/复刻音轨.wav] [--from 0 --to 片长] [--fps 60]
    [--film gallery]（读 eras_gallery.js）[--solo <id> --stills 0.2,0.6 --no-counter] [--width 1080 --height 1920]（竖屏整片：传给 index.html?w=&h=，
    引擎、转场、相机和各库按这个画布算；不写就用 eras.js 的 window.FILM_SIZE，再不写 1920×1080）
uv run --with playwright python render.py --spec clip.json --out 片段.mp4 [--alpha] [--stills 0.5,2]
    参数化片段（口播管线的「动画段」，契约见 references/09）：时长严格 = spec.duration（帧数 round(duration×fps)），
    宽高/fps 从 spec 读；默认无声 H.264 yuv420p、每秒一个关键帧（GOP=fps，管线渲染器按秒 seek），--alpha 出 ProRes 4444 带透明（.mov）。spec 里图片路径相对 spec 文件。
页面里有 pageerror 或 console.error（场景报错、缺字形）→ 渲完后非零退出。
"""
import argparse, base64, http.server, json, socketserver, subprocess, sys, threading, functools, time, urllib.parse
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import spec_assets
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument('--out', required=True)
ap.add_argument('--audio')
ap.add_argument('--fps', type=int, default=60)
ap.add_argument('--from', dest='t0', type=float, default=0)
ap.add_argument('--to', dest='t1', type=float, default=None, help='默认 = 段落表算出的片长 window.__total')
ap.add_argument('--stills', help='逗号分隔秒数：只导出这些时刻的 png 到 --out 目录')
ap.add_argument('--solo', help='只渲某个时代（时间为本段局部时间），配合 --stills 或 --from/--to')
ap.add_argument('--film', default='', help='片子名：读 eras_<名>.js（默认 eras.js）')
ap.add_argument('--no-counter', action='store_true', help='--solo 时不画角标')
ap.add_argument('--crf', type=int, default=14)
ap.add_argument('--spec', help='参数化片段 spec.json（走 clip.html，不读段落表）')
ap.add_argument('--alpha', action='store_true', help='--spec 时出 ProRes 4444 带透明（背景不画）')
ap.add_argument('--width', type=int, help='整片模式的画布宽（竖屏 1080）；--spec 时宽高从 spec 读，写了这个会覆盖 spec')
ap.add_argument('--height', type=int, help='整片模式的画布高（竖屏 1920）')
a = ap.parse_args()

root = Path(__file__).parent
spec, ALLOWED = None, set()
if a.spec:
    sp = Path(a.spec).resolve(); spec = json.loads(sp.read_text())
    try: spec_assets.localize(spec, sp.parent, ALLOWED)   # image / frames / data.character 里的本地路径 → /__file__/<绝对路径>（只服务 spec 里点名的文件）
    except FileNotFoundError as e: raise SystemExit(str(e))
    if a.alpha: spec['alpha'] = True
    if a.width or a.height: spec['width'], spec['height'] = a.width or spec.get('width', 1920), a.height or spec.get('height', 1080)
# 单个参数化片段撑太久会读成一页 PPT（一个版式到底、要点越堆越长）。只警告不报错：管线里有合法的长片段。
LONG_CLIP = None
if spec and float(spec.get('duration', 0)) > 8:
    LONG_CLIP = ('\n' + '!' * 72 + f'\n!! 警告：这个片段 duration = {spec["duration"]} 秒，超过 8 秒。\n'
                 '!! 单个片段撑太久会读成一页 PPT：一个版式到底，要点越堆越长，背景从头死到尾。\n'
                 '!! 拆成多镜：每镜 2–6 秒、换语法或换做法（scenes、真实素材），再拼接（SKILL.md 轨道档第 3–4 步）。\n'
                 '!! 口播管线里确实要一段长片段的，可以忽略这条。\n' + '!' * 72 + '\n')
    print(LONG_CLIP, file=sys.stderr, flush=True)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *x): pass
    def translate_path(self, path):
        if path.startswith('/__file__/'):
            f = urllib.parse.unquote(path[len('/__file__/'):].split('?')[0])
            return f if spec and f in ALLOWED else '/nonexistent'
        return super().translate_path(path)
# Chromium may open idle connections while loading scripts in parallel.
class LocalServer(socketserver.ThreadingTCPServer):
    request_queue_size = 128
    daemon_threads = True

srv = LocalServer(('127.0.0.1', 0), functools.partial(Q, directory=str(root)))
port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()

with sync_playwright() as p:
    b = p.chromium.launch(args=['--disable-web-security', '--enable-gpu-rasterization', '--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width': 1920, 'height': 1080}, device_scale_factor=1)
    errors = []
    def on_console(m):
        if m.type in ('error', 'warning'): print('[page]', m.text)
        if m.type == 'error': errors.append(m.text)
    pg.on('console', on_console)
    pg.on('pageerror', lambda e: (print('[pageerror]', e), errors.append(str(e))))
    if spec:
        pg.set_viewport_size({'width': spec.get('width', 1920), 'height': spec.get('height', 1080)})
        pg.add_init_script('window.CLIP_SPEC = ' + json.dumps(spec, ensure_ascii=False) + ';')
        pg.goto(f'http://127.0.0.1:{port}/clip.html?render=1')
    else:
        if a.width or a.height:
            if not (a.width and a.height): raise SystemExit('--width 和 --height 要一起写')
            pg.set_viewport_size({'width': a.width, 'height': a.height})
        pg.goto(f'http://127.0.0.1:{port}/index.html?render=1' + (f'&film={a.film}' if a.film else '') + (f'&w={a.width}&h={a.height}' if a.width else ''))
    pg.wait_for_function('window.__ready === true || !!window.__bootFailed', timeout=120000)
    bf = pg.evaluate('window.__bootFailed || null')
    if bf: raise SystemExit('场景加载失败，拒绝渲染：\n' + bf)
    if a.t1 is None: a.t1 = pg.evaluate('window.__total')
    if spec: a.fps = spec.get('fps', 30); a.t0 = 0; a.t1 = spec['duration']
    grab = '''async (t)=>{ await window.prepare(t); window.renderFrame(t); return window.__canvas.toDataURL('image/png').split(',')[1]; }'''
    if a.solo:
        grab = '''async (t)=>{ window.renderSolo(%s, t, {counter: %s}); return window.__canvas.toDataURL('image/png').split(',')[1]; }''' % (repr(a.solo), 'false' if a.no_counter else 'true')
    if a.stills:
        out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
        for s in a.stills.split(','):
            (out / f't{float(s):06.2f}.png').write_bytes(base64.b64decode(pg.evaluate(grab, float(s))))
        print('stills ->', out)
    else:
        Path(a.out).parent.mkdir(parents=True, exist_ok=True)
        vid = a.out if not a.audio else a.out + '.noaudio.mp4'
        enc = ['-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', '-alpha_bits', '16'] if (spec and a.alpha) else \
              ['-c:v', 'libx264', '-preset', 'slow', '-crf', str(a.crf), '-pix_fmt', 'yuv420p', '-movflags', '+faststart'] + \
              (['-g', str(a.fps), '-keyint_min', str(a.fps), '-sc_threshold', '0'] if spec else [])   # 片段要被管线的渲染器按秒 seek：每秒一个关键帧，否则冻帧
        if spec and a.alpha and not vid.endswith('.mov'): print('提示：ProRes 4444 一般用 .mov 容器')
        ff = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'image2pipe', '-framerate', str(a.fps), '-c:v', 'png', '-i', '-'] + enc + [vid],
                              stdin=subprocess.PIPE)
        n0, n1 = round(a.t0 * a.fps), round(a.t1 * a.fps)
        st = time.time()
        for i in range(n0, n1):
            ff.stdin.write(base64.b64decode(pg.evaluate(grab, i / a.fps)))
            if (i - n0) % 60 == 0:
                print(f'{i}/{n1}  {time.time()-st:.0f}s', flush=True)
        ff.stdin.close(); ff.wait()
        if a.audio:
            subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', vid, '-ss', str(a.t0), '-t', str(a.t1 - a.t0), '-i', a.audio,
                            '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', a.out], check=True)
            Path(vid).unlink()
        print('done ->', a.out)
    b.close()
srv.shutdown()
srv.server_close()
if LONG_CLIP: print(LONG_CLIP, file=sys.stderr)   # 渲完再说一遍，免得被进度行冲掉
if errors: raise SystemExit(f'❌ 页面报错 {len(errors)} 条（见上方 [page]/[pageerror]）')
