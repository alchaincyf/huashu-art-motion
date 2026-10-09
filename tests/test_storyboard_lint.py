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


class EndingAndEmpty(unittest.TestCase):
    HEAD = Rules.HEAD

    def lint(self, *rows, **kw):
        return SL.lint(self.HEAD + "\n".join(rows) + "\n", **kw)

    BODY = ("| 0–3 | 一部手机 | 从桌上滑进口袋 | 停 | | scenes/a.js |",
            "| 3–6 | 那部手机 | 屏幕亮起又暗下 | 快推 | | 素材 截图 |")

    def test_last_shot_text_card_is_red(self):
        for last in ("| 6–9 | 金句 | 砸进画面 | 砸入 | 贴身口袋 | t2 片段 a.json |",
                     "| 6–9 | 黄底大字 | 弹出来 | 停 | 贴身口袋 | t2 片段 a.json |",
                     "| 6–9 | 那部手机 | 被塞回口袋 | 停 | 贴身口袋 | y5 片段 a.json |"):
            res = self.lint(*self.BODY, last)
            self.assertIn((SL.RED, "⑧结尾"), {(lv, t) for lv, t, *_ in res["rows"][-1]["issues"]}, last)

    def test_last_shot_on_the_object_passes(self):
        res = self.lint(*self.BODY, "| 6–9 | 那部手机 | 被塞回贴身口袋，镜头拉远看全貌 | 横移 | 贴身口袋 | scenes/b.js |")
        self.assertFalse(any(t == "⑧结尾" for r in res["rows"] for _, t, *_ in r["issues"]))

    def test_empty_scene_object_is_red(self):
        for obj in ("空镜", "纯色背景", "黑场", "黑屏", "全黑", "渐变底", "空景", "橙色纯色底"):
            res = self.lint(*self.BODY, f"| 6–9 | {obj} | 慢慢变亮 | 停 | | scenes/b.js |")
            hits = [w for lv, t, w, _ in res["rows"][-1]["issues"] if lv == SL.RED and t == "①物"]
            self.assertTrue(hits and "空画面" in hits[0], (obj, hits))

    def test_object_on_dark_background_is_fine(self):
        self.assertTrue(SL.obj_residue("黑屏上的一只猫"))
        self.assertTrue(SL.obj_residue("渐变底上的一部手机"))


class ScriptNumbers(unittest.TestCase):
    HEAD = Rules.HEAD
    SCRIPT = "这一年它涨了百分之六十。换成 sum() 之后快了十五点二倍，二零二五年起每人一万两千元，大概六成的人用过。"

    def row_issues(self, text, script=SCRIPT):
        res = SL.lint(self.HEAD + f"| 0–3 | 一部手机 | 从桌上滑进口袋 | 快推 | {text} | scenes/a.js |\n| 3–6 | 那部手机 | 被塞回口袋 | 停 | | 素材 截图 |\n", script=script)
        return [(lv, t, w) for lv, t, w, _ in res["rows"][0]["issues"]], res

    def test_mismatch_is_red(self):
        iss, _ = self.row_issues("涨了 27%")
        hit = [w for lv, t, w in iss if t == "⑨数字"]
        self.assertTrue(hit and "27" in hit[0] and "口播" in hit[0], iss)
        self.assertTrue(all(lv == SL.RED for lv, t, _ in iss if t == "⑨数字"))

    def test_chinese_numerals_in_script_match(self):
        for text in ("涨了 60%", "快了 15.2 倍", "2025 年起", "1.2 万元", "60% 的人"):
            iss, _ = self.row_issues(text)
            self.assertFalse([t for _, t, _ in iss if t == "⑨数字"], (text, iss))

    def test_rounded_speech_matches_precise_screen(self):
        iss, _ = self.row_issues("8.7 倍", script="营收涨到了原来的近九倍")
        self.assertFalse([t for _, t, _ in iss if t == "⑨数字"], iss)
        iss, _ = self.row_issues("15.3 倍", script="快了十五点二倍")
        self.assertTrue([t for _, t, _ in iss if t == "⑨数字"], iss)

    def test_no_script_skips_and_hints(self):
        iss, res = self.row_issues("涨了 27%", script=None)
        self.assertFalse([t for _, t, _ in iss if t == "⑨数字"])
        self.assertIn("--script", "\n".join(SL.report(res)))

    def test_cli_script(self):
        with tempfile.TemporaryDirectory() as d:
            ok, bad = Path(d) / "ok.txt", Path(d) / "bad.txt"
            ok.write_text("厨房里从十五度升到二十八度，霉菌长得最快。", encoding="utf-8")
            bad.write_text("厨房里很暖和，霉菌长得最快。", encoding="utf-8")
            p = subprocess.run([sys.executable, str(SCRIPT), str(TEMPLATE), "--script", str(ok)], capture_output=True, text=True)
            self.assertEqual(p.returncode, 0, p.stdout)
            p = subprocess.run([sys.executable, str(SCRIPT), "--script", str(bad), str(TEMPLATE)], capture_output=True, text=True)
            self.assertEqual(p.returncode, 1, p.stdout)
            self.assertIn("屏上数字和口播不一致", p.stdout)
            self.assertIn("28", p.stdout)


class TagsColumn(unittest.TestCase):
    HEAD = "| 时间段 | 画面里的物 | 它在做什么 | 镜头 | 屏上字 | 标签 | 做法 |\n|---|---|---|---|---|---|---|\n"

    def test_more_than_three_tags_is_yellow(self):
        res = SL.lint(self.HEAD + "| 0–3 | 一部手机 | 从桌上滑进口袋 | 快推 | 轻 | 快、省、稳、准 | scenes/a.js |\n"
                                  "| 3–6 | 那部手机 | 被塞回口袋 | 停 | | 快、省、稳 | 素材 截图 |\n")
        self.assertEqual(res["rows"][0]["tags"], 4)
        self.assertIn((SL.YELLOW, "⑩标签"), {(lv, t) for lv, t, *_ in res["rows"][0]["issues"]})
        self.assertFalse(any(t == "⑩标签" for _, t, *_ in res["rows"][1]["issues"]))
        self.assertEqual(res["rows"][0]["text"], "轻")          # 标签列不会被当成屏上字

    def test_tag_count(self):
        self.assertEqual(SL.tag_count("快 · 省 · 稳 · 准"), 4)
        self.assertEqual(SL.tag_count("Claude Code"), 2)
        self.assertEqual(SL.tag_count("—"), 0)


if __name__ == "__main__":
    unittest.main()


class NumberCardRule(unittest.TestCase):
    def test_middle_number_card_warns(self):
        t = """| 时间段 | 画面里的物 | 它在做什么 | 镜头 | 屏上字 | 做法 |
|---|---|---|---|---|---|
| 0–3 | 一个人和一只杯子 | 人把热水倒进杯子，杯壁起雾 | 停 | | scenes/a.js |
| 3–6 | 大字 | 大字砸进画面 | 砸入 | 60% | y5 片段 a.json |
| 6–9 | 那只杯子 | 杯子里的水慢慢变凉，雾散了 | 快推 | | scenes/a.js |
"""
        res = SL.lint(t)
        msgs = [i[1] for r in res["rows"] for i in r["issues"]]
        self.assertIn("⑪数字字卡", msgs)
