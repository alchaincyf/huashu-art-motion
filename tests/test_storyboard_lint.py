"""storyboard_lint.py：模板里的示例镜头表要绿灯，一张「要点墙」镜头表要红灯，红灯理由要对。只用标准库，CI 里也跑。"""
import importlib.util
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "storyboard_lint.py"
TEMPLATE = ROOT / "references" / "镜头表模板.md"
spec = importlib.util.spec_from_file_location("storyboard_lint", SCRIPT)
SL = importlib.util.module_from_spec(spec)
spec.loader.exec_module(SL)

# 一个白板片段从头撑到尾：标题开场、要点逐条出现、一镜十几秒、同一个片段 60 秒。
WALL = """# 镜头表

| 时间段 | 画面里的物 | 它在做什么 | 镜头 | 屏上字 | 做法 |
|---|---|---|---|---|---|
| 0–5 | 标题 | 出现 | 停 | 为什么会这样呢我们来看看 | y3 片段 白板.json |
| 5–20 | 要点列表 | 要点逐条出现 | 停 | 第一点原因是这样的 | y3 片段 白板.json |
| 20–35 | 图标 | 显示 | 停 | | y3 片段 白板.json |
| 35–50 | 文字 | 淡入 | 停 | 第二点 | y3 片段 白板.json |
| 50–60 | 白板上的总结 | 逐条出现 | 停 | 记住这三点就够了 | y3 片段 白板.json |
"""


def tags(res, level):
    out = {t for r in res["rows"] for lv, t, *_ in r["issues"] if lv == level}
    return out | {t for lv, t, *_ in res["table"] if lv == level}


class TemplateExample(unittest.TestCase):
    def test_example_is_green(self):
        res = SL.lint(TEMPLATE.read_text(encoding="utf-8"))
        self.assertNotIn("error", res)
        self.assertEqual(res["verdict"], SL.GREEN, "\n".join(SL.report(res)))
        self.assertGreaterEqual(len(res["rows"]), 10)
        self.assertGreaterEqual(res["total"], 45)

    def test_blank_template_in_code_block_is_skipped(self):
        # 模板里的空表在代码块里，lint 只认示例那张。
        res = SL.lint(TEMPLATE.read_text(encoding="utf-8"))
        self.assertTrue(res["rows"][0]["obj"].startswith("小满"))

    def test_cli_exit_zero(self):
        p = subprocess.run([sys.executable, str(SCRIPT), str(TEMPLATE)], capture_output=True, text=True)
        self.assertEqual(p.returncode, 0, p.stdout + p.stderr)
        self.assertIn("绿灯", p.stdout)


class BulletWall(unittest.TestCase):
    def setUp(self):
        self.res = SL.lint(WALL)

    def test_red(self):
        self.assertEqual(self.res["verdict"], SL.RED)

    def test_reasons(self):
        red = tags(self.res, SL.RED)
        for t in ("①物", "②做什么", "③屏上字", "④开头", "⑤文字占比", "⑥时长", "做法"):
            self.assertIn(t, red, "\n".join(SL.report(self.res)))
        self.assertIn("⑦镜头", tags(self.res, SL.YELLOW))

    def test_points_appearing_is_not_an_action(self):
        r = self.res["rows"][1]
        self.assertTrue(any(t == "②做什么" for _, t, *_ in r["issues"]))

    def test_one_clip_carrying_the_film(self):
        whats = [w for lv, t, w, _ in self.res["table"] if t == "做法"]
        self.assertTrue(any("白板.json" in w and "60" in w for w in whats), whats)
        self.assertTrue(any("1 种画面做法" in w for w in whats), whats)

    def test_cli_exit_nonzero(self):
        with tempfile.TemporaryDirectory() as d:
            f = Path(d) / "镜头表.md"
            f.write_text(WALL, encoding="utf-8")
            p = subprocess.run([sys.executable, str(SCRIPT), str(f)], capture_output=True, text=True)
        self.assertEqual(p.returncode, 1, p.stdout)
        self.assertIn("红灯", p.stdout)


class Rules(unittest.TestCase):
    HEAD = "| 时间段 | 画面里的物 | 它在做什么 | 镜头 | 屏上字 | 做法 |\n|---|---|---|---|---|---|\n"

    def lint(self, *rows):
        return SL.lint(self.HEAD + "\n".join(rows) + "\n")

    def test_concrete_object_with_text_word_is_not_empty(self):
        self.assertTrue(SL.obj_residue("白板上的一只猫"))
        self.assertFalse(SL.obj_residue("三个要点"))
        self.assertFalse(SL.obj_residue("白底上的标题和图标"))

    def test_object_appearing_alone_is_weak(self):
        self.assertFalse(SL.act_residue("孢子出现", "孢子"))
        self.assertTrue(SL.act_residue("孢子从窗缝飘进来", "孢子"))

    def test_text_length(self):
        self.assertEqual(SL.text_len("淀粉→糖"), 3)
        self.assertEqual(SL.text_len("28°C"), 1)
        self.assertEqual(SL.text_len("AI 编了一本书"), 6)
        self.assertEqual(SL.text_len("—"), 0)

    def test_durations(self):
        res = self.lint("| 0–3 | 一只猫 | 跳上桌子 | 停 | | scenes/a.js |",
                        "| 3–10 | 那只猫 | 打翻杯子 | 快推 | | scenes/a.js |",
                        "| 10–19 | 杯子 | 摔成两半 | 砸入 | | 素材 照片 |",
                        "| 19–20 | 碎片 | 弹起来 | 横移 | | t3 片段 a.json |")
        by = {r["n"]: {(lv, t) for lv, t, *_ in r["issues"]} for r in res["rows"]}
        self.assertIn((SL.YELLOW, "⑥时长"), by[2])
        self.assertIn((SL.RED, "⑥时长"), by[3])
        self.assertIn((SL.YELLOW, "⑥时长"), by[4])

    def test_vertical_bar_fullwidth_and_mmss(self):
        res = SL.lint("｜时间段｜画面里的物｜它在做什么｜镜头｜屏上字｜\n｜---｜---｜---｜---｜---｜\n｜0:00–0:03｜一只猫｜跳上桌子｜快推｜｜\n")
        self.assertEqual(res["rows"][0]["dur"], 3)

    def test_missing_column(self):
        res = SL.lint("| 时间段 | 画面里的物 | 它在做什么 |\n|---|---|---|\n| 0–3 | 猫 | 跳 |\n")
        self.assertIn("缺列", res["error"])


if __name__ == "__main__":
    unittest.main()
