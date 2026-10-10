"""film_gate.py 的蓝紫底门禁：蓝紫帧占比 ≥0.30 红灯，--allow-blue-purple "理由" 降为黄灯。

只用 ffmpeg 的 lavfi 合成 6 秒小片（不需要引擎和 Playwright），每支都叠一层网格，免得被空画面门禁先拦：
  purple —— 深紫底（#2A1A6E）整片                           → 红灯，报告给时间码
  navy   —— 海军蓝平涂（#0D1B2A，色相约 210°）整片            → 不算蓝紫
  paper  —— 纸色底（#F3EDE2）整片                           → 不算
6 秒短于 20 秒，快动门禁只会黄灯；退出码 2 只可能来自蓝紫这一条（它不受短片降级）。
"""
import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / 'scripts'
SIZE, FPS = '960x540', 30
GRID = 'drawgrid=w=96:h=96:t=2:c=0xE0E0E0@0.8'
CLIPS = {
    'purple': f'color=c=0x2A1A6E:s={SIZE}:r={FPS}:d=6,{GRID}',
    'navy': f'color=c=0x0D1B2A:s={SIZE}:r={FPS}:d=6,{GRID}',
    'paper': f'color=c=0xF3EDE2:s={SIZE}:r={FPS}:d=6,drawgrid=w=96:h=96:t=2:c=0x333333@0.8',
}
W = {}
ENV = dict(os.environ, FILM_GATE_MIN_S='20')


def setUpModule():
    if not all(shutil.which(x) for x in ('uv', 'ffmpeg', 'ffprobe')):
        raise unittest.SkipTest('需要 uv、ffmpeg、ffprobe')
    W['tmp'] = tempfile.TemporaryDirectory()
    for name, src in CLIPS.items():
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', src, '-pix_fmt', 'yuv420p', '-c:v', 'libx264',
                        '-crf', '18', str(Path(W['tmp'].name) / f'{name}.mp4')], check=True, capture_output=True)


def tearDownModule():
    if 'tmp' in W:
        W['tmp'].cleanup()


def gate(name, *extra):
    p = subprocess.run(['uv', 'run', '--quiet', str(SCRIPTS / 'film_gate.py'), str(Path(W['tmp'].name) / f'{name}.mp4'),
                        '--no-template', '--json', *extra], capture_output=True, text=True, timeout=600, env=ENV)
    return p.returncode, json.loads(p.stdout)


class BluePurpleGate(unittest.TestCase):
    def test_purple_is_red(self):
        code, r = gate('purple')
        self.assertEqual(code, 2)
        self.assertGreaterEqual(r['blue_purple_share'], 0.9)
        self.assertEqual(r['lights']['blue_purple_share'], 'red')
        self.assertTrue(r['blue_purple_spans_s'])
        self.assertIn('蓝紫', r['explain']['summary'])

    def test_navy_and_paper_pass(self):
        for name in ('navy', 'paper'):
            code, r = gate(name)
            self.assertEqual(r['lights']['blue_purple_share'], 'green', name)
            self.assertEqual(code, 0, name)

    def test_override_downgrades_to_yellow(self):
        code, r = gate('purple', '--allow-blue-purple', '用户点名要赛博朋克紫')
        self.assertEqual(code, 0)
        self.assertEqual(r['lights']['blue_purple_share'], 'yellow')
        self.assertEqual(r['allow_blue_purple'], '用户点名要赛博朋克紫')


if __name__ == '__main__':
    unittest.main()
