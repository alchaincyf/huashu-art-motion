#!/usr/bin/env python3
# /// script
# dependencies = ["fonttools"]
# ///
"""Subset a Chinese font into woff under engine/lib/fonts/. Missing glyphs silently fall back to system fonts (different across machines),
so required Chinese glyphs must be in the subset; engine U.assertGlyphs checks counter text at startup, console.error on missing glyphs makes QA fail.

    uv run scripts/font_subset.py                         # Rebuild preset LXGW WenKai subset (scan Chinese in all engine/ .js + built-in common glyphs)
    uv run scripts/font_subset.py --scan <代码工程目录>     # Also include Chinese used by another project
    uv run scripts/font_subset.py --text "皮影戏蓝色时期"   # Append specified text
    uv run scripts/font_subset.py --font path/to/XXX.ttf --out <工程>/lib/fonts/XXX-400.woff --text "..."   # Other font
    uv run scripts/font_subset.py --gb2312 ...           # Include all 6763 GB2312 Han glyphs (no per-topic additions for explainers; about 1MB per weight)
    uv run scripts/font_subset.py --fix-widths engine/lib/fonts/PuHui-Medium.woff   # Only fix zero-width full-width space (PuHui Medium/Bold source bug)

Preset explainer fonts (YouTube grammar demos/new films, references/09) use this method (public version uses Noto Sans SC, --font points to weight-instantiated ttf; PuHui forbids redistribution after conversion, so generate locally only):
    uv run scripts/font_subset.py --gb2312                                                     # LXGW WenKai (whiteboard)
    for w in 65-Medium:Medium 85-Bold:Bold 105-Heavy:Heavy 115-Black:Black; do                # Alibaba PuHuiTi 3.0 four weights
      uv run scripts/font_subset.py --gb2312 --font path/to/AlibabaPuHuiTi-3-${w%%:*}.ttf --out scripts/engine/lib/fonts/PuHui-${w##*:}.woff; done

Default font: LXGW WenKai Medium (SIL Open Font License 1.1, commercial use/redistribution/embedding permitted);
if missing, download LXGWWenKai-Medium.ttf from https://github.com/lxgw/LxgwWenKai/releases and point --font at it.
Register new fonts in engine/lib/fonts.js (family = filename without extension).
"""
import argparse, re, sys
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

HERE = Path(__file__).resolve().parent
ENGINE = HERE / 'engine'
# Preset characters: digits, punctuation, eras/dynasties, common styles/art terms. Keep subset small (tens of KB); rerun when new glyphs are needed.
BASE = ('0123456789０１２３４５６７８９ ，。、：；！？「」『』《》（）·—…～'
        '年代世纪公元前后约初中晚期朝唐宋元明清汉魏晋隋周秦商夏民国现当今古'
        '水墨写意工笔山水花鸟人物画法风格派主义时期艺术家作品壁窟敦煌莫高佛飞天供养'
        '浮世绘木版印刷版画剪纸皮影戏偶灯影窗花年画书法篆隶楷行草印章钤朱文白'
        '油画素描水彩粉笔丙烯蛋彩湿壁金箔马赛克镶嵌玻璃彩窗手抄本插图漫画动画卡通'
        '古典文艺复兴巴洛克洛可可新浪漫写实印象后点彩野兽表现立体未来达达超现实抽象波普极简构成包豪斯装饰'
        '蓝色玫瑰红黄绿青紫黑灰橙金银光影明暗烛夜日月星云雨雪风天海河湖林竹梅兰菊松'
        '少女猫茶杯桌椅窗门墙地屋室灯花瓶书纸笔'
        '八大山人齐白石克里姆特蒙克呐喊草间弥生波点伦勃朗吉卜力宫崎骏新海诚毕加索修拉莫奈睡莲马蒂斯哈林达利霍珀凯斯杰克柯比'
        '蒸汽波像素光追橡皮管一二三四五六七八九十百千万')


# Common full-width punctuation/symbols for explainers
PUNCT = '，。、：；！？「」『』《》（）【】·—–…～“”‘’％＋－×÷→←↑↓▲▼≈±°¥€①②③④⑤⑥⑦⑧⑨⑩✓'


def gb2312_l1():
    """All 6763 GB2312 Han glyphs (3755 common level-one + 3008 less-common level-two, e.g. 渲/浏)"""
    out = set()
    for hi in range(0xB0, 0xF8):
        for lo in range(0xA1, 0xFF):
            try: out.add(bytes([hi, lo]).decode('gb2312'))
            except UnicodeDecodeError: pass
    return out


def cjk(text):
    return set(ch for ch in text if ord(ch) > 0x2E7F)


STR = re.compile(r"'(?:[^'\\\n]|\\.)*'|\"(?:[^\"\\\n]|\\.)*\"|`(?:[^`\\]|\\.)*`")


def scan(d):
    """Collect Chinese only from JS string literals (comments are not rendered; including them bloats subset 20×)"""
    out = set()
    for f in Path(d).rglob('*.js'):
        try: src = f.read_text(encoding='utf-8')
        except Exception: continue
        src = '\n'.join(re.sub(r'^\s*//.*$', '', l) for l in src.splitlines())
        for m in STR.finditer(src): out |= cjk(m.group(0))
    return out


def fix_blank_widths(font):
    """Full-width space U+3000 has zero width in Alibaba PuHuiTi 3.0 Medium/Bold source (Heavy/Black normal 984/990),
    joining "月收盘价，美元　纵轴未从 0 开始". Set width equal to "一". Return number fixed."""
    cmap, hm, n = font.getBestCmap(), font['hmtx'], 0
    ref = cmap.get(0x4E00)
    for cp in (0x3000,):
        g = cmap.get(cp)
        if g and ref and hm[g][0] == 0:
            hm[g] = (hm[ref][0], 0); n += 1
    return n


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('--font', default=str(Path.home() / 'Library/Fonts/LXGWWenKai-Medium.ttf'))
    ap.add_argument('--out', default=str(ENGINE / 'lib/fonts/LXGWWenKai-500.woff'))
    ap.add_argument('--scan', action='append', default=[], help='额外扫描的目录（可多次）')
    ap.add_argument('--text', default='', help='额外要的字')
    ap.add_argument('--no-default-scan', action='store_true', help='不扫 skill 自己的 engine/')
    ap.add_argument('--gb2312', action='store_true', help='并进 GB2312 全部汉字（6763 个）')
    ap.add_argument('--fix-widths', nargs='+', metavar='WOFF', help='不抽子集，只修已有字体文件里字宽为 0 的全角空格')
    a = ap.parse_args()
    if a.fix_widths:
        for f in a.fix_widths:
            ft = TTFont(f); n = fix_blank_widths(ft); ft.flavor = 'woff'
            if n: ft.save(f)
            print(f'{f}：修了 {n} 个字宽')
        return
    if not Path(a.font).exists(): sys.exit(f'找不到字体 {a.font}（见脚本说明的下载地址）')
    chars = set(BASE) | set(a.text)
    if not a.no_default_scan: chars |= scan(ENGINE)
    for d in a.scan: chars |= scan(d)
    chars |= set(chr(c) for c in range(0x20, 0x7F))           # Include all ASCII (years, English subtitles)
    if a.gb2312: chars |= gb2312_l1() | set(PUNCT)
    font = TTFont(a.font)
    cmap = font.getBestCmap()
    miss = sorted(ch for ch in chars if ord(ch) not in cmap and not ch.isspace())
    opts = subset.Options(); opts.flavor = 'woff'; opts.layout_features = ['*']; opts.name_IDs = ['*']; opts.notdef_outline = True
    sub = subset.Subsetter(opts); sub.populate(text=''.join(sorted(chars))); sub.subset(font)
    if fix_blank_widths(font): print('源字体全角空格字宽为 0，已设成和「一」同宽')
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    font.flavor = 'woff'; font.save(a.out)
    print(f'{a.out}  {len(chars)} 字  {Path(a.out).stat().st_size // 1024} KB' + (f'\n源字体里也没有：{"".join(miss)}' if miss else ''))


if __name__ == '__main__':
    main()
