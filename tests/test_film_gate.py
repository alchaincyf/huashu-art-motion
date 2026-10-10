"""film_gate.py / deliver.py / qa.py 镜头事件的端到端测试。

用引擎渲两支合成小片：同三张图（仓库 assets/ 里有纹理的总览图）、每镜 3 秒、硬切，
  slow  —— 每镜匀速慢推 7.5%（翻页式 PPT 的做法）  → film_gate 应红灯
  punch —— 每镜停住、一次 0.3 秒快推 30%、再停住    → film_gate 应绿灯
测试只在本机装了 uv、ffmpeg 和 Playwright Chromium 时跑（CI 的媒体契约任务没有这些，自动跳过）。
测试用的语法文件写在临时复制的引擎里，不进仓库。
"""
import os
os.environ["FILM_GATE_MIN_S"] = "0"  # 合成片只有 9 秒；这里测判定本身，不测短片降级
import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / 'scripts'
ENGINE = SCRIPTS / 'engine'
_HERO = ROOT / 'assets' / 'showcase' / 'hero.png'   # 只在公开仓库里；私有版没有就用样例里的图表截图
IMAGES = [_HERO if _HERO.exists() else ROOT / 'scripts' / 'engine' / 'examples' / 'assets' / 'K线图_横屏.png',
          ROOT / 'assets' / '全风格总览.jpg', ROOT / 'assets' / '动画语法' / 'y2_vox_总览.jpg']
SHOT = 3.0

# 测试专用语法：kind=shot 的 cue 一镜一张图，满幅（MD.cover），镜头由 data.mode 决定。
PROBE = r'''
CLIPS._gate_probe = { draw(c, t, ctx) {
  const shots = ctx.of('shot'); let i = 0;
  for (let k = 0; k < shots.length; k++) if (t >= shots[k].at) i = k;
  const q = shots[i], end = i + 1 < shots.length ? shots[i + 1].at : ctx.dur, len = end - q.at, mode = ctx.data.mode;
  let z = 1;
  if (mode === 'slow') z = CAM.zlerp(1, 1.075, U.clamp((t - q.at) / len));                                   // 匀速慢推
  if (mode === 'punch') z = CAM.track({}, [{ at: q.at + len * 0.4, kind: 'punch', k: 0.3, dur: 0.3 }], t).z;  // 停住→快推→停住
  c.fillStyle = '#000'; c.fillRect(0, 0, ctx.W, ctx.H);
  MD.cover(c, ctx.still(q), { z });
} };
'''

# 整片模式（qa --project --film gateprobe）：三段「停住→0.3 秒快推→停住」，第四段中间闪一下白。画面是种子随机的色块。
PROBE_FILM = r'''
const tex = (c, seed) => { const r = U.rng(seed); c.fillStyle = '#1d2330'; c.fillRect(0, 0, 1920, 1080);
  for (let i = 0; i < 600; i++) { c.fillStyle = `hsl(${r() * 360},60%,${30 + r() * 50}%)`; const s = 20 + r() * 120; c.fillRect(r() * 1920, r() * 1080, s, s * (0.3 + r())); } };
window.ERAS = [1, 2, 3].map(k => ({ id: 'punch' + k, dur: 2.5,
  draw: (c, lt) => CAM.with(c, CAM.track({}, [{ at: 1.2, kind: 'punch', k: 0.3, dur: 0.3 }], lt), cc => tex(cc, k)) }));
window.ERAS.push({ id: 'flash', dur: 2.5, draw: (c, lt) => { tex(c, 9); if (lt >= 1.5 && lt < 1.55) { c.fillStyle = '#fff'; c.fillRect(0, 0, 1920, 1080); } } });
'''


def tools_ready():
    return all(shutil.which(x) for x in ('uv', 'ffmpeg', 'ffprobe'))


def run(*args, cwd=None):
    return subprocess.run(['uv', 'run', '--quiet', *map(str, args)], cwd=cwd, capture_output=True, text=True, timeout=900)


W = {}   # 模块级夹具：引擎副本、spec、渲好的两支片


def setUpModule():
    if not tools_ready():
        raise unittest.SkipTest('需要 uv、ffmpeg、ffprobe')
    W['tmp'] = tempfile.TemporaryDirectory()
    tmp = Path(W['tmp'].name)
    eng = tmp / 'engine'
    shutil.copytree(ENGINE, eng, ignore=shutil.ignore_patterns('demos', 'reference_films', 'examples', '__pycache__'))
    (eng / 'clips' / '_gate_probe.js').write_text(PROBE)
    (eng / 'eras_gateprobe.js').write_text(PROBE_FILM)
    (tmp / 'img').mkdir()
    for f in IMAGES:
        shutil.copy(f, tmp / 'img' / f.name)
    W['eng'] = eng
    for mode in ('slow', 'punch'):
        d = tmp / mode
        d.mkdir()
        spec = {'grammar': '_gate_probe', 'duration': SHOT * len(IMAGES), 'fps': 30, 'width': 960, 'height': 540,
                'data': {'mode': mode},
                'cues': [{'at': SHOT * k, 'kind': 'shot', 'image': f'../img/{f.name}'} for k, f in enumerate(IMAGES)]}
        (d / 'spec.json').write_text(json.dumps(spec, ensure_ascii=False))
        W[mode] = d
    for mode in ('slow', 'punch'):
        r = run('--with', 'playwright', 'python', eng / 'render.py', '--spec', W[mode] / 'spec.json', '--out', W[mode] / f'{mode}.mp4')
        if r.returncode != 0 and 'Executable doesn' in (r.stdout + r.stderr):
            raise unittest.SkipTest('Playwright Chromium 没装：uv run --with playwright playwright install chromium')
        assert r.returncode == 0, r.stdout + r.stderr


def tearDownModule():
    if 'tmp' in W:
        W['tmp'].cleanup()


def gate(mp4):
    r = run(SCRIPTS / 'film_gate.py', mp4, '--json', '--no-template')
    return r.returncode, json.loads(r.stdout)


class FilmGateTests(unittest.TestCase):
    def test_slow_push_is_red(self):
        code, res = gate(W['slow'] / 'slow.mp4')
        self.assertEqual(code, 2)
        self.assertEqual(res['gate_light'], 'red')
        self.assertLess(res['fast_ratio'], 0.035)
        self.assertIn('读起来像翻页', res['explain']['summary'])
        self.assertIn('CAM.track', res['explain']['fix'])
        self.assertIn('MD.cover', res['explain']['fix'])

    def test_punch_is_green(self):
        code, res = gate(W['punch'] / 'punch.mp4')
        self.assertEqual(code, 0)
        self.assertEqual(res['gate_light'], 'green')
        self.assertGreaterEqual(res['fast_ratio'], 0.06)
        self.assertIsNone(res['explain']['fix'])

    def test_short_clip_only_warns(self):
        # 短于 20 秒的片段读数没标定过：同一支慢推片默认只亮黄灯、不拦
        env = dict(os.environ, FILM_GATE_MIN_S='20')
        r = subprocess.run(['uv', 'run', '--quiet', str(SCRIPTS / 'film_gate.py'), str(W['slow'] / 'slow.mp4'), '--no-template'],
                           capture_output=True, text=True, timeout=900, env=env)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertIn('只提示不拦', r.stdout)

    def test_unreadable_file_exits_1(self):
        bad = Path(W['tmp'].name) / 'bad.mp4'
        bad.write_bytes(b'not a video')
        self.assertEqual(run(SCRIPTS / 'film_gate.py', bad).returncode, 1)

    def test_text_report_names_worst_window_and_fix(self):
        r = run(SCRIPTS / 'film_gate.py', W['slow'] / 'slow.mp4', '--no-template')
        self.assertEqual(r.returncode, 2)
        self.assertIn('最差', r.stdout)
        self.assertIn('怎么改', r.stdout)


class DeliverTests(unittest.TestCase):
    def deliver(self, mode, out, *extra):
        return run(SCRIPTS / 'deliver.py', W[mode] / f'{mode}.mp4', '--out', out, *extra)

    def test_red_does_not_copy(self):
        out = Path(W['tmp'].name) / 'out_red'
        r = self.deliver('slow', out, '--spec', W['slow'] / 'spec.json')
        self.assertEqual(r.returncode, 2, r.stdout + r.stderr)
        self.assertFalse((out / 'slow.mp4').exists())
        self.assertFalse((out / '交付说明.md').exists())
        self.assertIn('怎么改', r.stdout)

    def test_green_copies_and_writes_facts(self):
        out = Path(W['tmp'].name) / 'out_green'
        r = self.deliver('punch', out, '--spec', W['punch'] / 'spec.json')
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertTrue((out / 'punch.mp4').is_file())
        doc = (out / '交付说明.md').read_text()
        self.assertIn('没派审片', doc)
        self.assertIn('没跑', doc)                       # 没跑 qa
        self.assertIn('960×540', doc)
        self.assertIn(f'{SHOT * len(IMAGES):.2f}s', doc)
        self.assertIn('快速运动帧占比', doc)
        self.assertEqual(run(SCRIPTS / 'deliver.py', '--verify', out / '交付说明.md').returncode, 0)
        # 改了事实段 → verify 报出来
        (out / '交付说明.md').write_text(doc.replace('没派审片', '已通过独立审片'))
        self.assertNotEqual(run(SCRIPTS / 'deliver.py', '--verify', out / '交付说明.md').returncode, 0)
        # 只在制作说明段补主观描述 → verify 仍然通过
        (out / '交付说明.md').write_text(doc + '\n补充：节奏按口播停顿。\n')
        self.assertEqual(run(SCRIPTS / 'deliver.py', '--verify', out / '交付说明.md').returncode, 0)

    def test_review_files_and_qa_are_listed(self):
        proj = W['punch']
        (proj / '审片').mkdir(exist_ok=True)
        (proj / '审片' / '审片人A.md').write_text('结论写在这里')
        qa = proj / 'qa'
        qa.mkdir(exist_ok=True)
        (qa / 'qa.json').write_text(json.dumps({'spec': str(proj / 'spec.json'), 'page_errors': [], 'segments': [
            {'id': 'punch', 'deterministic': True, 'spikes_at_lt': [], 'camera_events_lt': [[1.6, 1.9]], 'framing': [],
             'motion_pct': 1.0, 'still_pairs_pct': 80.0, 'ms_mean': 10, 'ms_max': 20}]}))
        try:
            out = Path(W['tmp'].name) / 'out_review'
            r = self.deliver('punch', out, '--spec', proj / 'spec.json')
            self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
            doc = (out / '交付说明.md').read_text()
            self.assertIn('审片人A.md', doc)
            self.assertNotIn('没派审片', doc)
            self.assertIn('跑过', doc)
            self.assertIn('确定性：1/1', doc)
        finally:
            shutil.rmtree(proj / '审片')
            shutil.rmtree(qa)


class QaCameraEventTests(unittest.TestCase):
    """整片模式下段内中位数≈0，一次 0.3 秒快推以前会被整串记成跳变；现在记成一个镜头事件。闪一下白仍是跳变。"""
    @classmethod
    def setUpClass(cls):
        out = Path(W['tmp'].name) / 'qa_film'
        r = run('--with', 'playwright', SCRIPTS / 'qa.py', '--project', W['eng'], '--film', 'gateprobe', '--out', out)
        assert r.returncode == 0, r.stdout + r.stderr
        cls.segs = {s['id']: s for s in json.loads((out / 'qa.json').read_text())['segments']}

    def test_pulse_push_is_camera_event_not_spike(self):
        for k in (1, 2, 3):
            s = self.segs[f'punch{k}']
            self.assertEqual(s['spikes_at_lt'], [], s)
            self.assertEqual(len(s['camera_events_lt']), 1, s)
            t0, t1 = s['camera_events_lt'][0]
            self.assertLessEqual(t1 - t0, 0.35 + 2 / 30)
            self.assertTrue(t0 <= 1.5 and t1 >= 1.2, s)                 # 落在快推那 0.3 秒上

    def test_single_frame_flash_is_still_spike(self):
        s = self.segs['flash']
        self.assertGreaterEqual(len(s['spikes_at_lt']), 1, s)
        self.assertEqual(s['camera_events_lt'], [], s)


if __name__ == '__main__':
    unittest.main()
