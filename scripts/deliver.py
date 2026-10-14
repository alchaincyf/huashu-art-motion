# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy", "opencv-python-headless"]
# ///
"""deliver.py —— one-command delivery: run the gate → red light aborts; green/yellow copies the finished film and writes the delivery note, facts written by the script.

    uv run deliver.py <成片.mp4> --out output/ [--spec 片段.json | --project <代码工程>] [--qa <qa 输出目录>] [--root <项目目录>]
                      [--sub-band 0.15] [--vertical auto|yes|no] [--allow-blue-purple "理由"]
    uv run deliver.py --verify output/交付说明.md       # verify that the facts section has not been modified

Does three things:
  1. Runs film_gate.py from the same directory. Red light: does not copy the film or write the note, prints reason and fix, exits with code 2.
  2. Green/yellow light: copies the film to --out and writes --out/交付说明.md. The facts section is fully script-written:
     duration, resolution, frame rate, audio track, file fingerprint; gate metrics and lights; worst 30-second window;
     whether qa was run and its results (reads qa.json in the qa output dir; if absent writes "not run");
     whether an independent review exists (<project dir>/审片/*.md, lists filenames; if absent writes "no reviewer assigned").
  3. Facts section ends with a fingerprint. The creator only adds subjective notes in the "production notes" section
     (syntax used, why yellow-light items are acceptable, six-failure-mode self-check); do not edit the facts section — --verify will catch changes.

Conventions:
  - qa output dir: --qa takes priority; otherwise matches qa.py default — --spec → <spec dir>/qa, --project → <project parent>/qa.
  - project dir: --root first; then --project parent; then --spec dir; then film dir.
  - Reviewer (agent or person not involved in production) writes conclusions to <project dir>/审片/<any name>.md. Script only checks file existence, does not read content.
"""
from __future__ import annotations

import argparse
import datetime
import hashlib
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import film_gate  # noqa: E402

DOC = "交付说明.md"
START = "<!-- deliver.py 事实段：开始。这一段由脚本生成，不要改；改了 deliver.py --verify 会报出来 -->"
END_RE = re.compile(r"<!-- deliver\.py 事实段：结束 sha256=([0-9a-f]{64}) -->")
LIGHT_ZH = {"red": "红灯", "yellow": "黄灯", "green": "绿灯", "--": ""}


def probe(path):
    out = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries",
                                   "stream=codec_type,codec_name,width,height,avg_frame_rate:format=duration",
                                   "-of", "json", str(path)])
    j = json.loads(out)
    v = next(s for s in j["streams"] if s.get("codec_type") == "video")
    a = [s for s in j["streams"] if s.get("codec_type") == "audio"]
    num, _, den = (v.get("avg_frame_rate") or "0/1").partition("/")
    fps = float(num) / float(den or 1) if float(den or 1) else 0.0
    return {"duration": float(j["format"].get("duration") or 0), "width": v["width"], "height": v["height"],
            "fps": round(fps, 3), "vcodec": v.get("codec_name"), "audio": a[0].get("codec_name") if a else None}


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


def stamp(p):
    return datetime.datetime.fromtimestamp(p.stat().st_mtime).strftime("%Y-%m-%d %H:%M:%S")


def qa_facts(qa_dir, spec):
    """Read qa.py output. Return factual lines (list)."""
    if qa_dir is None:
        return ["- 没跑（没给 --spec / --project / --qa，不知道去哪找 qa 输出）"]
    f = qa_dir / "qa.json"
    if not f.is_file():
        return [f"- 没跑（{f} 不存在）"]
    try:
        r = json.loads(f.read_text())
    except (ValueError, OSError) as e:
        return [f"- qa.json 读不了：{f}（{type(e).__name__}），按没跑算"]
    segs = r.get("segments", [])
    det = sum(1 for s in segs if s.get("deterministic"))
    spikes = sum(len(s.get("spikes_at_lt", [])) for s in segs)
    cams = sum(len(s.get("camera_events_lt", [])) for s in segs)
    framing = sum(len(s.get("framing", [])) for s in segs)
    errs = r.get("page_errors", [])
    L = [f"- 跑过：`{f}`（写于 {stamp(f)}）",
         f"- 页面报错 {len(errs)} 条" + ("（qa 判失败）" if errs else ""),
         f"- 确定性：{det}/{len(segs)} 段逐像素一致",
         f"- 跳变 {spikes} 处" + (f"；另有镜头事件 {cams} 个（2 秒以内单调、平滑的推拉/横移，不算跳变）" if "camera_events_lt" in (segs[0] if segs else {}) else ""),
         f"- 框景线索 {framing} 条（半截字、叠字、进字幕带、近空白；是「去看这一帧」，不是错误）"]
    for s in segs:
        L.append(f"  - {s.get('id')}：运动 {s.get('motion_pct')}%，静止帧对 {s.get('still_pairs_pct')}%，"
                 f"跳变 {len(s.get('spikes_at_lt', []))}，{s.get('ms_mean')}/{s.get('ms_max')} ms/帧")
    if spec is not None and r.get("spec") and Path(r["spec"]).resolve() != spec.resolve():
        L.append(f"- 注意：这份 qa.json 量的是另一份 spec（{r['spec']}），不是 {spec}")
    if spec is not None and spec.is_file() and spec.stat().st_mtime > f.stat().st_mtime:
        L.append(f"- 注意：spec 在 qa 之后改过（spec 写于 {stamp(spec)}），这份 qa 结果可能已经过期")
    return L


def review_facts(root):
    d = root / "审片"
    files = sorted(p.name for p in d.glob("*.md")) if d.is_dir() else []
    if not files:
        return [f"- 没派审片（`{d}` 下没有 .md 文件）"]
    return [f"- 有 {len(files)} 份审片记录（`{d}`）：" + "、".join(files),
            "- 脚本只确认文件存在，没有读内容；审片结论以文件本身为准"]


def facts_block(src, dst, info, res, rows, qa_lines, rv_lines):
    ex = res["explain"]
    gl = res["gate_light"]
    L = ["## 事实（deliver.py 写入）", "",
         f"- 生成时间：{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
         f"- 成片：`{dst.name}`（sha256 {sha256(dst)[:16]}；源文件 `{src}`）",
         f"- 时长 {info['duration']:.2f}s ｜ {info['width']}×{info['height']} ｜ {info['fps']:g}fps ｜ 视频 {info['vcodec']} ｜ "
         f"音轨：{info['audio'] or '无'}",
         "", "### 门禁（film_gate）", "",
         f"- 结论：{LIGHT_ZH[gl]}。快速运动帧占比 {res['fast_ratio']}（< 0.035 红灯，< 0.06 黄灯）",
         f"- 一句话：{ex['summary']}。" + ("；".join(ex["why"]) + "。" if ex["why"] else "")]
    if res.get("allow_blue_purple"):
        L.append(f"- 制作者声明题材需要蓝紫（蓝紫门禁降为黄灯）：{res['allow_blue_purple']}；蓝紫底占 {res['blue_purple_share']:.0%}")
    if ex["worst_window"]:
        w = ex["worst_window"]
        L.append(f"- 最差 {w['end_s'] - w['start_s']:.0f} 秒窗口：{w['start_s']:.0f}–{w['end_s']:.0f}s，快动帧占比 {w['fast_ratio']}")
    if ex["fix"]:
        L.append(f"- 怎么改：{ex['fix']}")
    L += ["", "| 灯 | 类型 | 指标 | 值 |", "|---|---|---|---|"]
    for k, name, v, lv, gate, unit in rows:
        vs = "—" if v is None else (f"{v:.3f}" if isinstance(v, float) else str(v))
        L.append(f"| {LIGHT_ZH[lv] or '只给数'} | {'门禁' if gate else '报告'} | {name} | {vs}{unit} |")
    L += ["", "### qa", ""] + qa_lines + ["", "### 独立审片", ""] + rv_lines
    return "\n".join(L) + "\n"


def write_doc(out, dst, facts, res):
    h = hashlib.sha256(facts.encode()).hexdigest()
    look = [t for _, t in res["explain"]["look"]]
    if res["lights"]["fast_ratio"] == "yellow":
        look.insert(0, f"门禁黄灯：快速运动帧占比 {res['fast_ratio']}（黄线 0.06）")
    tail = ["## 制作说明（制作者填写；只写在这一段，事实段不要动）", "",
            "- 用了哪个语法 / 风格：",
            "- 「六种做坏方式」逐条自查：",
            "- 黄灯项逐条说明（时间码＋为什么可以这样）：" + ("" if look else "无黄灯项")]
    tail += [f"  - {t}：" for t in look]
    doc = f"# 交付说明：{dst.name}\n\n{START}\n{facts}<!-- deliver.py 事实段：结束 sha256={h} -->\n\n" + "\n".join(tail) + "\n"
    (out / DOC).write_text(doc)
    return out / DOC


def verify(path):
    t = Path(path).read_text()
    i = t.find(START)
    m = END_RE.search(t)
    if i < 0 or not m or m.start() < i:
        print(f"❌ {path}：找不到事实段的开始/结束标记（被删了或不是 deliver.py 写的）"); return 3
    facts = t[i + len(START) + 1: m.start()]
    if hashlib.sha256(facts.encode()).hexdigest() != m.group(1):
        print(f"❌ {path}：事实段被改过，和 deliver.py 写入时不一致。重跑 deliver.py 生成。"); return 3
    print(f"✓ {path}：事实段和 deliver.py 写入时一致"); return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("mp4", nargs="?")
    ap.add_argument("--out", help="交付目录（如 output/）")
    ap.add_argument("--spec", help="参数化片段 spec（用来找 qa 输出：<spec 所在目录>/qa）")
    ap.add_argument("--project", help="代码工程目录（用来找 qa 输出：<代码工程的上一级>/qa）")
    ap.add_argument("--qa", help="qa 输出目录（qa.py --out 写到别处时用）")
    ap.add_argument("--root", help="项目目录（在它下面找 审片/*.md）")
    ap.add_argument("--sub-band", type=float, default=None, help="同 film_gate.py：屏蔽底部字幕带的比例")
    ap.add_argument("--vertical", default="auto", choices=["auto", "yes", "no"])
    ap.add_argument("--verify", metavar="交付说明.md", help="只核对事实段有没有被改过")
    ap.add_argument("--allow-blue-purple", metavar="理由", default=None,
                    help="同 film_gate.py：题材本身要蓝紫时写理由，理由写进交付说明事实段")
    a = ap.parse_args()
    if a.verify:
        sys.exit(verify(a.verify))
    if not a.mp4 or not a.out:
        ap.error("要给成片和 --out")
    src = Path(a.mp4).resolve()
    if not src.is_file():
        print(f"成片不存在：{src}", file=sys.stderr); sys.exit(1)
    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        print("需要 ffmpeg/ffprobe", file=sys.stderr); sys.exit(1)
    spec = Path(a.spec).resolve() if a.spec else None
    proj = Path(a.project).resolve() if a.project else None
    qa_dir = Path(a.qa).resolve() if a.qa else spec.parent / "qa" if spec else proj.parent / "qa" if proj else None
    root = Path(a.root).resolve() if a.root else proj.parent if proj else spec.parent if spec else src.parent

    try:
        info = probe(src)
        res, rows = film_gate.measure(str(src), sub_band=a.sub_band, vertical=a.vertical, allow_blue_purple=a.allow_blue_purple)
    except (subprocess.CalledProcessError, StopIteration, KeyError, RuntimeError, ValueError) as e:
        print(f"读不了这支片：{src}（{e}）", file=sys.stderr); sys.exit(1)
    print("\n".join(film_gate.report_lines(res, rows)))
    ex = res["explain"]
    if res["verdict"] == "red":
        print(f"\n❌ 红灯，不交付：{ex['summary']}。" + ("；".join(ex["why"]) + "。" if ex["why"] else ""))
        print("怎么改：" + ex["fix"])
        print(f"没有复制成片，也没有写{DOC}。改完重渲，再跑一次 deliver.py。")
        sys.exit(2)

    out = Path(a.out).resolve()
    out.mkdir(parents=True, exist_ok=True)
    dst = out / src.name
    if dst != src:
        shutil.copy2(src, dst)
    qa_lines, rv_lines = qa_facts(qa_dir, spec), review_facts(root)
    facts = facts_block(src, dst, info, res, rows, qa_lines, rv_lines)
    doc = write_doc(out, dst, facts, res)
    gl = res["gate_light"]
    print(f"\n{'✓ 绿灯' if gl == 'green' else '⚠ 黄灯'}，已交付：{dst}")
    print(f"交付说明：{doc}（事实段由脚本写；主观描述只补在「制作说明」段）")
    print("qa：" + qa_lines[0][2:])
    print("审片：" + rv_lines[0][2:])
    if ex["look"]:
        print("黄灯项要在交付说明里逐条写时间码和理由：" + "；".join(t for _, t in ex["look"]))
    sys.exit(0)


if __name__ == "__main__":
    main()
