"""全片主题色板（spec.theme → ctx.pal）与 y4 停用代码画的小人：

  色板名解析成完整 6 键；{name, 覆盖}用那套补缺的键；名字写错、对象缺键 → 启动失败，报错里列出可用名字 / 缺的键；
  色板真的落到画面上（t3 的底色）；不写 theme 时 y1 的底不再是靛紫渐变；
  y4 没有角色帧库（缺 data.character 或写预设名）→ 启动失败，报错说清楚；同一时刻渲两次逐像素一致。

需要 uv 和 Playwright Chromium（没装就跳过，和 test_clip_world 一样）；像素只用 Pillow 读。
"""
import colorsys
import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / 'scripts' / 'engine'
EX = ENGINE / 'examples'
W = {}

# 在一张空页里加载 lib/palettes.js，逐个调用 PAL.resolve，结果（或报错信息）按 JSON 打出来
RESOLVE = r'''
import json, sys
from playwright.sync_api import sync_playwright
cases = json.loads(sys.argv[2])
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(); pg.set_content('<html></html>'); pg.add_script_tag(path=sys.argv[1])
    out = pg.evaluate("""cases => cases.map(th => { try { return { ok: PAL.resolve(th) }; } catch (e) { return { err: e.message }; } })""", cases)
    b.close()
print(json.dumps(out, ensure_ascii=False))
'''
CASES = ['paper', {'name': 'ink', 'accent': '#ABCDEF'}, {'bg': '#000', 'surface': '#111111', 'ink': '#ffffff', 'sub': '#888888', 'accent': '#ff0000', 'accent2': '#00ff00'},
         'purple', {'bg': '#000000'}, {'name': 'nope'}, None, {}, {'name': 'snow', 'accent': 'red'}]


def uv(args, timeout=600):
    r = subprocess.run(['uv', 'run', '--quiet', '--with', 'playwright', 'python', *args], capture_output=True, text=True, timeout=timeout)
    if r.returncode != 0 and 'Executable doesn' in (r.stdout + r.stderr):
        raise unittest.SkipTest('Playwright Chromium 没装：uv run --with playwright playwright install chromium')
    return r


def render(spec, out, stills):
    """渲几张静帧；返回 (CompletedProcess, {t: png 路径})。spec 是 dict（写进临时目录，图片路径要是绝对路径）或现成的 json 路径。"""
    if isinstance(spec, dict):
        p = Path(W['tmp'].name) / (out.name + '.json'); p.write_text(json.dumps(spec, ensure_ascii=False), encoding='utf-8'); spec = p
    r = uv([str(ENGINE / 'render.py'), '--spec', str(spec), '--stills', ','.join(map(str, stills)), '--out', str(out)])
    return r, {t: out / f't{t:06.2f}.png' for t in stills}


def absolutize(spec):
    """样例 spec 拷到临时目录渲：帧库、图片的相对路径改成绝对路径。"""
    spec = json.loads(json.dumps(spec))
    ch = (spec.get('data') or {}).get('character')
    if isinstance(ch, dict) and isinstance(ch.get('frames'), dict):
        ch['frames'] = {k: str((EX / v).resolve()) for k, v in ch['frames'].items()}
    for q in spec.get('cues', []):
        if q.get('image'):
            q['image'] = str((EX / q['image']).resolve())
    return spec


def ex(name):
    if name == 'y4_storytime':   # 样例里的帧库是占位路径；测试用作者本人的帧（只给测试用，见 fixtures 里的说明）
        return json.loads((ROOT / 'tests' / 'fixtures' / 'y4_storytime_test_frames.json').read_text(encoding='utf-8'))
    return json.loads((EX / f'{name}.json').read_text(encoding='utf-8'))


def setUpModule():
    if not shutil.which('uv'):
        raise unittest.SkipTest('需要 uv')
    try:
        from PIL import Image  # noqa: F401
    except ImportError:
        raise unittest.SkipTest('需要 Pillow')
    W['tmp'] = tempfile.TemporaryDirectory()
    tmp = Path(W['tmp'].name)
    r = uv(['-c', RESOLVE, str(ENGINE / 'lib' / 'palettes.js'), json.dumps(CASES)])
    assert r.returncode == 0, r.stdout + r.stderr
    W['resolve'] = json.loads(r.stdout.strip().splitlines()[-1])
    t3 = absolutize(ex('t3_finance_chart'))
    y4 = absolutize(ex('y4_storytime'))
    W['runs'] = {
        't3_snow': render({**t3, 'theme': 'snow'}, tmp / 't3_snow', [6.5]),
        't3_override': render({**t3, 'theme': {'name': 'snow', 'bg': '#102030'}}, tmp / 't3_override', [6.5]),
        'y1_default': render({k: v for k, v in ex('y1_kurzgesagt').items() if k != 'theme'}, tmp / 'y1_default', [0.2]),
        'bad_name': render({**t3, 'theme': 'purple'}, tmp / 'bad_name', [1]),
        'bad_obj': render({**ex('y5_kinetic_type'), 'theme': {'bg': '#000000', 'ink': '#ffffff'}}, tmp / 'bad_obj', [1]),   # t3 把这种对象当旧主题写法，换 y5 测
        't3_legacy_obj': render({**t3, 'theme': {'bg': '#000000', 'ink': '#ffffff'}}, tmp / 't3_legacy_obj', [6.5]),
        'y4_none': render({k: v for k, v in y4.items() if k != 'data'}, tmp / 'y4_none', [1]),
        'y4_preset': render({**y4, 'data': {'character': 'neutral'}}, tmp / 'y4_preset', [1]),
        'y4_a': render(y4, tmp / 'y4_a', [1.2, 4.6]),
        'y4_b': render(y4, tmp / 'y4_b', [1.2, 4.6]),
    }


def tearDownModule():
    if 'tmp' in W:
        W['tmp'].cleanup()


def img(p):
    from PIL import Image
    return Image.open(p).convert('RGB')


class Resolve(unittest.TestCase):
    def test_name_gives_all_six_keys(self):
        r = W['resolve'][0]['ok']
        self.assertEqual(r['name'], 'paper')
        self.assertEqual({k: r[k] for k in ('bg', 'surface', 'ink', 'sub', 'accent', 'accent2')},
                         {'bg': '#F3EDE2', 'surface': '#FBF8F2', 'ink': '#1B1A17', 'sub': '#6B655B', 'accent': '#C8402F', 'accent2': '#2F5D62'})

    def test_name_plus_override_fills_from_that_palette(self):
        r = W['resolve'][1]['ok']
        self.assertEqual(r['accent'], '#ABCDEF')
        self.assertEqual(r['bg'], '#121417')                              # 其余键来自 ink 那套
        self.assertEqual(r['accent2'], '#5FB3A1')

    def test_full_object_without_name_is_accepted(self):
        r = W['resolve'][2]['ok']
        self.assertEqual(r['bg'], '#000000')                              # #rgb 规整成 #RRGGBB
        self.assertEqual(r['accent2'], '#00FF00')

    def test_unknown_name_lists_available(self):
        e = W['resolve'][3]['err']
        self.assertIn('purple', e)
        for n in ('paper', 'poster', 'ink', 'navy', 'bauhaus', 'snow', 'wood', 'chalk'):
            self.assertIn(n, e)
        self.assertIn('nope', W['resolve'][5]['err'])

    def test_object_without_name_names_missing_keys(self):
        e = W['resolve'][4]['err']
        for k in ('surface', 'ink', 'sub', 'accent', 'accent2'):
            self.assertIn(k, e)

    def test_no_theme_is_null(self):
        self.assertIsNone(W['resolve'][6]['ok'])
        self.assertIsNone(W['resolve'][7]['ok'])

    def test_non_hex_value_rejected(self):
        self.assertIn('accent', W['resolve'][8]['err'])


class OnScreen(unittest.TestCase):
    def test_palette_reaches_the_frame(self):
        r, st = W['runs']['t3_snow']
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        px = img(st[6.5]).getpixel((20, 540))
        self.assertTrue(all(abs(a - b) <= 2 for a, b in zip(px, (0xE9, 0xEE, 0xF0))), px)

    def test_override_reaches_the_frame(self):
        r, st = W['runs']['t3_override']
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        px = img(st[6.5]).getpixel((20, 540))
        self.assertTrue(all(abs(a - b) <= 2 for a, b in zip(px, (0x10, 0x20, 0x30))), px)

    def test_y1_default_sky_is_not_blue_purple(self):
        r, st = W['runs']['y1_default']
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        im = img(st[0.2])
        for xy in ((10, 10), (im.width - 10, 10), (10, im.height - 10), (im.width // 2, im.height - 10)):
            h, l, s = colorsys.rgb_to_hls(*[v / 255 for v in im.getpixel(xy)])
            self.assertFalse(230 <= h * 360 <= 300 and s > 0.25, (xy, im.getpixel(xy)))


class BootFails(unittest.TestCase):
    def check(self, key, *needles):
        r, _ = W['runs'][key]
        out = r.stdout + r.stderr
        self.assertNotEqual(r.returncode, 0, out)
        for n in needles:
            self.assertIn(n, out)

    def test_bad_theme_name(self):
        self.check('bad_name', '不是色板名', 'paper', 'chalk')

    def test_theme_object_missing_keys(self):
        self.check('bad_obj', '缺', 'surface', 'accent2')

    def test_t3_old_theme_object_still_works(self):
        r, st = W['runs']['t3_legacy_obj']
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertLess(sum(img(st[6.5]).getpixel((20, 540))), 30)

    def test_y4_without_character(self):
        self.check('y4_none', 'y4 需要角色帧库', '代码画的小人已停用')

    def test_y4_preset_name_no_longer_draws(self):
        self.check('y4_preset', 'y4 需要角色帧库', 'neutral')


class Deterministic(unittest.TestCase):
    def test_same_time_twice_is_pixel_identical(self):
        from PIL import ImageChops
        (ra, a), (rb, b) = W['runs']['y4_a'], W['runs']['y4_b']
        self.assertEqual(ra.returncode, 0, ra.stdout + ra.stderr)
        self.assertEqual(rb.returncode, 0, rb.stdout + rb.stderr)
        for t in a:
            self.assertIsNone(ImageChops.difference(img(a[t]), img(b[t])).getbbox(), f'{t}s 两次渲染不一致')


if __name__ == '__main__':
    unittest.main()
