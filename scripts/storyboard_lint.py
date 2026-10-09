#!/usr/bin/env python3
# /// script
# requires-python = ">=3.9"
# dependencies = []
# ///
"""storyboard_lint.py —— 动手写代码之前，机械检查一张镜头表。

用法：
  uv run storyboard_lint.py 镜头表.md          # 或 python3 storyboard_lint.py 镜头表.md

镜头表是一张 markdown 表（模板与示例见 references/镜头表模板.md），每行一镜，列：
  时间段 ｜ 画面里的物 ｜ 它在做什么 ｜ 镜头 ｜ 屏上字 ｜ 做法（可选，建议写）
代码块（```）里的表不检查。文件里有多张表时只查第一张带「物」和「做什么」两列的表。

逐行检查：
  ① 物：不能空，也不能只是「标题、要点、文字、列表、标签、字幕、卡片、背景、画面、图标」这类词      → 红
  ② 做什么：不能空，也不能只是「出现、显示、展示、淡入……」这类万能词                              → 红
  ③ 屏上字 ≤ 8 字（汉字一字一个，一串英文或数字算一个）                                             → 红
  ④ 第一镜不能是文字主导（物列是标题/字，或屏上字 ≥ 7 个，或做法是 y5 动态文字）                     → 红
  ⑥ 单镜 2–6 秒；6–8 秒、短于 2 秒 → 黄；长于 8 秒 → 红；6–8 秒的镜头超过两成 → 红
  ⑦ 连续三镜「镜头」列相同 → 黄
整表检查：
  ⑤ 文字主导的镜头占比 ≤ 30%                                                                     → 红
  做法列（写了才查）：同一个参数化片段（同一个 .json）合计超过 8 秒 → 红；20 秒以上的片子画面做法少于 3 种 → 红
  时间段前后接不上、整表没有一次快推/横移/砸入 → 黄

退出码：有红灯 1；只有黄灯或全绿 0；读不了文件或找不到表 2。只用标准库。
"""
import re
import sys
from pathlib import Path

RED, YELLOW, GREEN = "红", "黄", "绿"

# ① 物：去掉这些词、量词、方位词、颜色和标点之后什么都不剩，就算「没写物」。
ABSTRACT = sorted("""标题 副标题 小标题 大标题 主标题 要点 文字 文本 大字 字 列表 清单 标签 字幕 卡片 字卡 背景 底色 白底 黑底
纯色 画面 图标 icon 关键词 金句 口号 标语 总结 结论 概念 内容 信息 元素 东西 示意图 示意 图片 图 白板 黑板 页面 版面 动画 效果
文案 段落 句子 bullet 圆点 符号 编号 序号 箭头 线条 形状 方块 色块 渐变 光斑 粒子 装饰""".split(), key=len, reverse=True)
FILLER = re.compile(r"[\d一二三四五六七八九十两几个条张行句段组页块排些堆串的和与及跟或上下左右中里边侧旁内外前后大小新白黑红蓝绿黄灰橙紫色底空"
                    r"、，,。.;；:：/／+＋&＆\s（）()\[\]【】「」『』“”\"'‘’\-—–~～·…|]")
# ④ 物列里出现这些词，这一镜就算文字主导。
TEXTY = re.compile(r"标题|文字|文本|要点|列表|清单|字幕|大字|关键词|金句|口号|标语|字卡|bullet|字$|^字")
# ② 做什么：去掉这些修饰之后只剩万能词，就算「没有动作」。
WEAK = sorted("""出现 显示 展示 呈现 浮现 淡入 淡出 渐显 弹出 出来 列出 亮起 停留 停住 静止 不动 保持 摆着 放着 存在 显现 罗列 排列 介绍 说明 讲解
解释 强调 标注 写出 打出 入场 出场""".split(), key=len, reverse=True)
ACT_FILLER = re.compile(r"[\d一二三四五六七八九十两几个条张行句段组页块排些堆串的地着了过和与及跟或也都再又并、，,。.;；:：/／+＋\s（）()「」“”\"'\-—–~～…|]"
                        r"|逐条|依次|一一|逐个|逐一|逐渐|渐渐|慢慢|缓缓|然后|开始|同时|接着|陆续|一起|一下|画面|屏幕|上")
CAM_FAST = ("快推", "横移", "砸入", "推近", "甩")
EMPTY_CELL = {"", "-", "—", "–", "无", "空", "（空）", "(空)", "/", "／", "——"}
GRAMMAR = re.compile(r"\b([ty][1-9])(?:_[a-z_]+)?\b", re.I)


def strip_cells(line):
    s = line.strip().replace("｜", "|")
    if s.startswith("|"): s = s[1:]
    if s.endswith("|"): s = s[:-1]
    return [c.strip() for c in s.split("|")]


def find_table(text):
    """返回 (表头, 行列表[(行号, 单元格)])。跳过代码块；取第一张同时有「物」和「做什么/动作」列的表。"""
    lines, fence, i = text.splitlines(), False, 0
    while i < len(lines):
        ln = lines[i]
        if ln.strip().startswith("```"):
            fence = not fence; i += 1; continue
        if not fence and ln.strip().startswith(("|", "｜")) and i + 1 < len(lines) and re.match(r"^\s*[|｜]?\s*:?-{2,}", lines[i + 1]):
            head = strip_cells(ln)
            rows, j = [], i + 2
            while j < len(lines) and lines[j].strip().startswith(("|", "｜")):
                rows.append((j + 1, strip_cells(lines[j]))); j += 1
            if any("物" in h for h in head) and any(("做什么" in h or "动作" in h) for h in head):
                return head, rows
            i = j; continue
        i += 1
    return None, []


def columns(head):
    col = {}
    for k, h in enumerate(head):
        if "时间" in h and "time" not in col: col["time"] = k
        elif "物" in h and "obj" not in col: col["obj"] = k
        elif ("做什么" in h or "动作" in h) and "act" not in col: col["act"] = k
        elif "镜头" in h and "cam" not in col: col["cam"] = k
        elif "字" in h and "text" not in col: col["text"] = k
        elif "做法" in h and "how" not in col: col["how"] = k
    return col


def parse_t(tok):
    tok = tok.strip()
    if ":" in tok:
        m, s = tok.split(":", 1)
        return int(m) * 60 + float(s)
    return float(tok)


def parse_span(cell):
    nums = re.findall(r"\d+:\d+(?:\.\d+)?|\d+(?:\.\d+)?", cell)
    if len(nums) < 2: return None
    a, b = parse_t(nums[0]), parse_t(nums[1])
    return (a, b) if b > a else None


def clean_cell(c):
    c = re.sub(r"<br\s*/?>", " ", c or "")
    return c.strip().strip("`*_").strip()


def is_empty(c):
    return clean_cell(c) in EMPTY_CELL


def obj_residue(obj):
    s = clean_cell(obj).lower()
    for w in ABSTRACT: s = s.replace(w.lower(), "")
    return FILLER.sub("", s)


def act_residue(act, obj=""):
    """去掉万能词、版面词和物列里的名词之后还剩什么。「要点逐条出现」「孢子出现」都剩不下东西。"""
    s = clean_cell(act).lower()
    for w in sorted((t for t in FILLER.split(clean_cell(obj).lower()) if len(t) >= 2), key=len, reverse=True): s = s.replace(w, "")
    for w in WEAK + ABSTRACT: s = s.replace(w.lower(), "")
    return ACT_FILLER.sub("", s)


def text_len(t):
    t = clean_cell(t)
    if t in EMPTY_CELL: return 0
    t = re.sub(r"[「」『』“”\"'‘’《》]", "", t)
    return len(re.findall(r"[㐀-鿿]|[A-Za-z0-9][A-Za-z0-9.%°'’]*", t))


def how_kind(how):
    """做法列 → 画面做法的种类：语法编号（t1…y6）、scenes、素材，其它按原文。"""
    h = clean_cell(how)
    if h in EMPTY_CELL: return None
    m = GRAMMAR.search(h)
    if m: return m.group(1).lower()
    if re.search(r"scenes?|\.js\b|代码画", h, re.I): return "scenes"
    if re.search(r"素材|截图|照片|录像|实拍|原图|原文|录屏", h): return "素材"
    return h


def clip_name(how):
    m = re.search(r"[^\s|，,：:（）()]+\.json", clean_cell(how))
    return m.group(0) if m else None


def lint(text):
    """返回 dict：rows（逐行结果）、table（整表结果）、verdict、summary。"""
    head, raw = find_table(text)
    if head is None:
        return {"error": "找不到镜头表：要一张 markdown 表，表头至少有「画面里的物」和「它在做什么」两列（代码块里的表不算）。"}
    col = columns(head)
    miss = [n for k, n in (("time", "时间段"), ("obj", "画面里的物"), ("act", "它在做什么"), ("cam", "镜头"), ("text", "屏上字")) if k not in col]
    if miss:
        return {"error": "镜头表缺列：" + "、".join(miss) + "。列：时间段｜画面里的物｜它在做什么｜镜头｜屏上字｜做法。"}
    get = lambda cells, k: cells[col[k]] if k in col and col[k] < len(cells) else ""
    rows, table = [], []
    for n, (lineno, cells) in enumerate(raw, 1):
        if all(is_empty(c) for c in cells): continue
        obj, act, cam, txt, how = (get(cells, k) for k in ("obj", "act", "cam", "text", "how"))
        span = parse_span(get(cells, "time"))
        r = {"n": len(rows) + 1, "line": lineno, "obj": clean_cell(obj), "act": clean_cell(act), "cam": clean_cell(cam),
             "text": clean_cell(txt), "how": clean_cell(how), "span": span, "dur": (span[1] - span[0]) if span else None,
             "chars": text_len(txt), "issues": []}
        bad = r["issues"].append
        if is_empty(obj):
            bad((RED, "①物", "物列空着", "写一个画面里能指着说「就是它」的东西：一个人、一只手、一台机器、一件具体的东西"))
        elif not obj_residue(obj):
            bad((RED, "①物", f"「{r['obj']}」不是物，是版面元素", "要点背后一定有一个东西在做事，把它画出来：「三个原因」→ 三个具体的东西各占一镜、各做一件事"))
        if is_empty(act):
            bad((RED, "②做什么", "做什么列空着", "写一个动词：掉下来、裂开、钻进去、被切掉"))
        elif not act_residue(act, obj):
            bad((RED, "②做什么", f"「{r['act']}」只是出现/显示，没有动作", "写这个物自己的动作：它从哪来、往哪去、撞上了什么、变成了什么"))
        if r["chars"] > 8:
            bad((RED, "③屏上字", f"屏上字 {r['chars']} 个，超过 8", "只留一个词或半句，其余交给口播或字幕"))
        r["texty"] = bool(TEXTY.search(r["obj"])) or r["chars"] >= 7 or how_kind(how) == "y5"
        if span is None:
            bad((RED, "⑥时长", f"时间段「{clean_cell(get(cells, 'time'))}」读不出来", "写成 0–3 或 0:03–0:07"))
        elif r["dur"] > 8:
            bad((RED, "⑥时长", f"这一镜 {r['dur']:g} 秒，超过 8 秒", "拆成两三镜，每镜 2–6 秒，换一个画面或换一个镜头动作"))
        elif r["dur"] > 6:
            bad((YELLOW, "⑥时长", f"这一镜 {r['dur']:g} 秒（6–8 秒只允许个别）", "能拆就拆；不拆就保证镜头里有一次快推或横移"))
        elif r["dur"] < 2:
            bad((YELLOW, "⑥时长", f"这一镜只有 {r['dur']:g} 秒", "插入镜可以短，口播在这里念不完一句就并到相邻一镜"))
        if is_empty(cam):
            bad((YELLOW, "镜头", "镜头列空着", "写一个：停／快推／横移／砸入／切"))
        rows.append(r)
    if not rows:
        return {"error": "镜头表是空的：表头下面一行一镜。"}

    # ④ 第一镜
    f = rows[0]
    if f["texty"]:
        f["issues"].append((RED, "④开头", "第一镜是文字主导（标题/字）", "开头 3 秒换成一个具体的小场景：一个人或一个物在做一件和题目有关的事，标题晚一镜再给或不给"))
    elif f["chars"] >= 4:
        f["issues"].append((YELLOW, "④开头", f"第一镜屏上就有 {f['chars']} 个字", "开场先让画面讲，字留到第二镜"))
    # ⑦ 连续三镜镜头相同
    for k in range(2, len(rows)):
        c = rows[k]["cam"]
        if c and not is_empty(c) and c == rows[k - 1]["cam"] == rows[k - 2]["cam"]:
            rows[k]["issues"].append((YELLOW, "⑦镜头", f"连续三镜都是「{c}」", "中间那镜换一个动作：停／快推／横移／砸入／切轮着用"))
    # 时间段接续
    for k in range(1, len(rows)):
        a, b = rows[k - 1]["span"], rows[k]["span"]
        if a and b and abs(b[0] - a[1]) > 0.05:
            rows[k]["issues"].append((YELLOW, "时间段", f"上一镜到 {a[1]:g}s 结束，这一镜从 {b[0]:g}s 开始", "前后接上，或写明这里有空镜"))

    n = len(rows)
    texty = [r["n"] for r in rows if r["texty"]]
    if len(texty) / n > 0.30:
        table.append((RED, "⑤文字占比", f"文字主导的镜头 {len(texty)}/{n}（{len(texty) / n:.0%}），超过 30%：第 {'、'.join(map(str, texty))} 镜",
                      "挑其中一半，把字换成一个物在做事；字交给口播和字幕"))
    long_ = [r["n"] for r in rows if r["dur"] and 6 < r["dur"] <= 8]
    if len(long_) > max(1, n // 5):
        table.append((RED, "⑥时长", f"6–8 秒的镜头有 {len(long_)} 个（第 {'、'.join(map(str, long_))} 镜），只允许个别",
                      "拆开，每镜 2–6 秒"))
    if not any(any(w in r["cam"] for w in CAM_FAST) for r in rows):
        table.append((YELLOW, "镜头", "整表没有一次快推、横移或砸入", "交付门禁量的是镜头内快动作，没有的话 deliver.py 多半红灯；每两三镜放一次"))
    total = sum(r["dur"] or 0 for r in rows)
    if "how" in col:
        clips = {}
        for r in rows:
            c = clip_name(r["how"])
            if c: clips.setdefault(c, []).append(r)
        for c, rs in clips.items():
            s = sum(r["dur"] or 0 for r in rs)
            if s > 8:
                table.append((RED, "做法", f"参数化片段 {c} 撑了 {s:g} 秒（第 {'、'.join(str(r['n']) for r in rs)} 镜）",
                              "单个参数化片段最多 8 秒，撑久了读成一页 PPT；拆成几个 spec，中间换别的做法"))
        kinds = {how_kind(r["how"]) for r in rows} - {None}
        if total >= 20 and len(kinds) < 3:
            table.append((RED, "做法", f"全片只用了 {len(kinds)} 种画面做法（{'、'.join(sorted(kinds)) or '没写'}）",
                          "至少 3 种：不同语法的片段、scenes 代码画、真实素材满幅，各算一种"))
        empty_how = [r["n"] for r in rows if how_kind(r["how"]) is None]
        if empty_how:
            table.append((YELLOW, "做法", f"第 {'、'.join(map(str, empty_how))} 镜没写做法", "写上用哪个语法的片段（镜NN.json）、scenes/<id>.js 还是素材"))
    else:
        table.append((YELLOW, "做法", "没有「做法」列，查不了单个片段撑多久、用了几种做法", "加一列：y4 片段 镜01.json／scenes/<id>.js／素材 照片"))

    issues = [x for r in rows for x in r["issues"]] + table
    verdict = RED if any(x[0] == RED for x in issues) else YELLOW if issues else GREEN
    return {"rows": rows, "table": table, "verdict": verdict, "total": total, "texty": texty}


def report(res):
    if "error" in res: return [res["error"]]
    L = []
    for r in res["rows"]:
        light = RED if any(x[0] == RED for x in r["issues"]) else YELLOW if r["issues"] else GREEN
        span = f"{r['span'][0]:g}–{r['span'][1]:g}s" if r["span"] else "?"
        L.append(f"[{light}] 第 {r['n']} 镜  {span:<10} {r['obj'][:18]}")
        for lv, tag, what, fix in r["issues"]:
            L.append(f"      [{lv}] {tag}：{what}。改：{fix}")
    L.append("")
    L.append(f"整表：{len(res['rows'])} 镜，{res['total']:g} 秒，文字主导 {len(res['texty'])} 镜")
    for lv, tag, what, fix in res["table"]:
        L.append(f"  [{lv}] {tag}：{what}。改：{fix}")
    L.append("")
    L.append({RED: "结论：红灯。先改镜头表、重跑这条命令，红灯清掉之前不要开始写代码。",
              YELLOW: "结论：黄灯。可以开始做；黄灯项想清楚理由，交付说明里逐条写。",
              GREEN: "结论：绿灯。可以开始做。"}[res["verdict"]])
    L.append("机器查不了、要你自己对的：全片是不是一个具体例子或角色贯穿；相邻两镜的版式是不是不同；开头 3 秒是不是一个小场景而不是题目。")
    return L


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    if len(argv) != 1 or argv[0] in ("-h", "--help"):
        print(__doc__); return 0 if argv and argv[0] in ("-h", "--help") else 2
    p = Path(argv[0])
    try:
        text = p.read_text(encoding="utf-8")
    except OSError as e:
        print(f"读不了 {p}：{e}", file=sys.stderr); return 2
    res = lint(text)
    print("\n".join(report(res)))
    if "error" in res: return 2
    return 1 if res["verdict"] == RED else 0


if __name__ == "__main__":
    sys.exit(main())
