# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy", "opencv-python-headless"]
# ///
"""film_gate.py —— 只读成片 mp4，量「翻页式 PPT 感」。交付前由 deliver.py 调用，也可以单独跑。

用法：
  uv run film_gate.py 成片.mp4 [--json] [--vertical auto|yes|no] [--sub-band 0.15]
                      [--template 示范片.mp4] [--no-template]

退出码：红灯 2；黄灯、绿灯 0；读不了文件 1。
只依赖 ffmpeg/ffprobe 和 opencv，不依赖 art-motion 引擎，任何来源的成片都能量。

门禁两条。第一条：快速运动帧占比（镜头内部相邻帧平均灰度差 ≥9 的帧对占比，12fps、320 宽灰度、
屏蔽底部字幕带；像切点的帧和交叉淡化窗口整段排除，转场再快也不算）。< 0.035 红灯，< 0.06 黄灯。
标定（2026-10-09）：作者本人表过态的 13 支片（9 支认可、4 支否定），它是唯一单独就能把两组干净分开、
阈值两侧都有余量的指标——认可的最低 0.068，否定的最高 0.021；帧差阈值在 6–13 之间取值都能分开。
样本只有 13 支，读作「这 13 支里没有反例」，不是已经证明。

第二条门禁是事实类硬伤，不靠品味标定：中段近乎纯色的空画面。去掉首尾各 0.5 秒和转场窗口（切点前后两帧、
交叉淡化整段），一帧里梯度 >24 的像素不到 0.2%（整帧几乎没有任何边缘或纹理，同样 12fps、320 宽灰度、屏蔽字幕带）
算空帧，连续 ≥0.3 秒红灯，报告给出每一段的时间码。按边缘判、不按颜色判：黑底 3b1b 的细线和公式、白板上的笔画
都是边缘，不会误伤；「画面 95% 是同一色」这种按颜色的判法在标定集里会把认可的白板片判成 3 秒空画面，所以不用。
标定数据里的 32 支片（含作者表过态的 13 支、9 支认可）没有一支出现过连续 2 帧的空帧。短片降级不适用于这一条。

其余指标只报告（最多黄灯，不拦）。静止类指标（静止帧占比、最长连续静止、最长无事件间隔）会把
「停住→猛动→停住」的好片判反，所以绝不能拿来当门禁；黄灯只是「去看这一段」。

拦不住的：每页硬塞一次快推的 PPT、前紧后松（看最差 30 秒窗口）、页框与米底小图、讲不明白。
「去看」的黄灯项和独立审片仍然要做。
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys

import cv2
import numpy as np

FPS = 12            # 分析帧率
WIDTH = 320         # 分析宽度（竖屏也是 320 宽）
SAMPLE_FPS = 2      # 面积类指标的抽样帧率
# 全风格样片随 Release 发布，不在仓库里；放到 assets/ 下才比「照搬示范构图」，没有就跳过这一项
DEFAULT_TEMPLATE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "全风格样片.mp4")

# ---------------------------------------------------------------- 阈值表
# gate=True 的指标才会亮红灯并让脚本非零退出；其余只报告（最多黄灯，'info' 不打灯）。
# 方向 'high_bad'：值越大越可疑；'low_bad'：值越小越可疑；'info'：只给数，不判好坏。
# 标定：2026-10-09 用作者本人判过的 13 支片（9 正 4 负），见文件头。阈值不要随手改：改了要用新的表态片重标。
# 门禁只放「单个指标就能把正负例干净分开、阈值两边都有余量」的指标（fast_ratio），和不需要标定的事实类硬伤（blank_run_s）。
# 黄线是从同一批片子读出来的经验线，样本太少，不能当判决，只提示「去看这一段」。
METRICS = {
    # key: (中文名, 方向, 黄线, 红线, 是否门禁, 单位)
    "fast_ratio":         ("快速运动帧占比", "low_bad", 0.06, 0.035, True, ""),
    "blank_run_s":        ("中段近乎纯色的空画面（最长连续）", "high_bad", None, 0.3, True, "秒"),
    "fast_ratio_worst_window": ("最差30秒窗口的快动帧占比", "low_bad", 0.02, None, False, ""),
    "top10_share":        ("运动集中度（前10%帧占运动量）", "info", None, None, False, ""),
    "drift_ratio":        ("慢漂帧占比", "high_bad", 0.65, None, False, ""),
    "still_ratio":        ("静止帧占比（静止本身不是坏事）", "info", None, None, False, ""),
    "longest_still_s":    ("最长连续静止", "high_bad", 6.0, None, False, "秒"),
    "event_rate":         ("视觉事件密度", "low_bad", 2.0, None, False, "次/10秒"),
    "max_event_gap_s":    ("最长无事件间隔", "high_bad", 15.0, None, False, "秒"),
    "dead_bg":            ("死背景（扣相机后镜内不变）", "high_bad", 0.80, None, False, ""),
    "dead_flat":          ("死且平的空底", "high_bad", 0.50, None, False, ""),
    "flat_area":          ("平底色/空底面积", "info", None, None, False, ""),
    "flat_light":         ("浅色空底面积（米底/白底）", "high_bad", 0.35, None, False, ""),
    "page_frame_share":   ("固定页框时长占比", "high_bad", 0.30, None, False, ""),
    "slow_zoom_share":    ("匀速慢缩放镜头时长占比", "high_bad", 0.70, None, False, ""),
    "slow_cam_share":     ("慢漂相机镜头时长占比", "info", None, None, False, ""),
    "dissolve_share":     ("交叉淡化占转场比例", "high_bad", 0.60, None, False, ""),
    "local_fade_ratio":   ("原地淡变占变化帧比例", "info", None, None, False, ""),
    "subject_box":        ("最大主体块占画面", "info", None, None, False, ""),
    "template_sim_share": ("与示范构图相似的时长占比", "high_bad", 0.30, None, False, ""),
}


# ---------------------------------------------------------------- 读帧
def probe(path):
    out = subprocess.check_output([
        "ffprobe", "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=width,height:format=duration", "-of", "json", path])
    j = json.loads(out)
    s = j["streams"][0]
    return int(s["width"]), int(s["height"]), float(j["format"].get("duration", 0) or 0)


def decode_gray(path, fps=FPS, width=WIDTH, limit=None):
    W, H, dur = probe(path)
    h = int(round(H * width / W / 2) * 2)
    cmd = ["ffmpeg", "-v", "error"] + (["-t", str(limit)] if limit else []) + ["-i", path, "-vf",
           f"fps={fps},scale={width}:{h}:flags=area", "-pix_fmt", "gray", "-f", "rawvideo", "-"]
    raw = subprocess.check_output(cmd)
    n = len(raw) // (width * h)
    F = np.frombuffer(raw[: n * width * h], np.uint8).reshape(n, h, width)
    return F, (W, H, dur)


# ---------------------------------------------------------------- 全局相机运动
def pair_transform(a, b):
    """a->b 的相似变换（LK 跟踪 + RANSAC）。返回 (M 2x3, 内点数, 内点率) 或 (None,0,0)。"""
    pts = cv2.goodFeaturesToTrack(a, maxCorners=300, qualityLevel=0.01, minDistance=6, blockSize=5)
    if pts is None or len(pts) < 15:
        return None, 0, 0.0
    nxt, st, _ = cv2.calcOpticalFlowPyrLK(a, b, pts, None, winSize=(21, 21), maxLevel=3)
    ok = st.ravel() == 1
    if ok.sum() < 12:
        return None, 0, 0.0
    p0, p1 = pts[ok].reshape(-1, 2), nxt[ok].reshape(-1, 2)
    M, inl = cv2.estimateAffinePartial2D(p0, p1, method=cv2.RANSAC, ransacReprojThreshold=1.0)
    if M is None:
        return None, 0, 0.0
    ni = int(inl.sum())
    return M, ni, ni / len(pts)


def cam_speed(M, w, h, fps):
    """变换在一组网格点上的平均位移，换算成「屏宽/秒」。"""
    if M is None:
        return 0.0
    xs, ys = np.meshgrid(np.linspace(0, w, 7), np.linspace(0, h, 7))
    P = np.stack([xs.ravel(), ys.ravel(), np.ones(xs.size)], 1)
    Q = P @ M.T
    return float(np.hypot(*(Q - P[:, :2]).T).mean() / w * fps)


def to3(M):
    return np.vstack([M, [0, 0, 1]]) if M is not None else np.eye(3)


# ---------------------------------------------------------------- 主分析
def analyze(path, sub_band=None, vertical="auto", template=None, verbose=False):
    F, (W0, H0, dur) = decode_gray(path)
    is_vert = (H0 > W0) if vertical == "auto" else (vertical == "yes")
    if sub_band is None:
        sub_band = 0.18 if is_vert else 0.15
    n, h, w = F.shape
    hc = int(round(h * (1 - sub_band)))
    F = np.ascontiguousarray(F[:, :hc])          # 屏蔽底部字幕带
    h = hc
    if n < 4:
        raise RuntimeError("帧太少，无法分析")
    F16 = F.astype(np.int16)

    # --- 逐帧对：帧差、相机变换、补偿后残差、亮度直方图
    d = np.zeros(n - 1); loc = np.zeros(n - 1); spd = np.zeros(n - 1); zr = np.zeros(n - 1)
    fade_px = np.zeros(n - 1)
    Ms = []
    for i in range(n - 1):
        a, b = F[i], F[i + 1]
        diff = np.abs(F16[i + 1] - F16[i])
        d[i] = diff.mean()
        moved, wa = False, None
        if d[i] < 0.05:                          # 完全一样：省掉估计
            Ms.append(None); loc[i] = d[i]; fade_px[i] = -1; continue
        M, ni, ir = pair_transform(a, b)
        if M is not None and ni >= 20 and ir >= 0.35:
            s = float(np.hypot(M[0, 0], M[1, 0]))
            moved = abs(np.log(s)) > 1e-4 or abs(M[0, 2]) > 0.05 or abs(M[1, 2]) > 0.05
            if moved:
                wa = cv2.warpAffine(a, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
                loc[i] = np.abs(F16[i + 1] - wa.astype(np.int16)).mean()
            else:
                loc[i] = d[i]
            spd[i] = cam_speed(M, w, h, FPS)
            zr[i] = np.log(s)
            Ms.append(M)
        else:
            loc[i] = d[i]; Ms.append(None)
        # 原地淡变：补偿相机后仍在变的像素里，光流几乎为 0（位置不动、只变亮度）的比例
        if d[i] > 0.3 and spd[i] < 0.05:
            base = wa if (Ms[-1] is not None and moved) else a
            ch = np.abs(F16[i + 1] - base.astype(np.int16)) > 10
            if ch.mean() > 0.003:
                fl = cv2.calcOpticalFlowFarneback(base, b, None, 0.5, 3, 15, 3, 5, 1.2, 0)
                mag = np.hypot(fl[..., 0], fl[..., 1])
                fade_px[i] = float((mag[ch] < 0.5).mean())
            else:
                fade_px[i] = -1
        else:
            fade_px[i] = -1
    # --- 硬切
    # cut_like：所有「整帧突变、且不能用相机运动解释」的帧（含多帧的瓦片/像素/甩切转场）——统计运动时全部排除
    # cut：连续的 cut_like 只取第一帧，用来数切点、分镜头
    cut_like = np.zeros(n - 1, bool)
    for i in range(n - 1):
        lo, hi = max(0, i - 6), min(n - 1, i + 7)
        nb = np.concatenate([d[lo:i], d[i + 1:hi]])
        med = np.median(nb) if len(nb) else 0
        cut_like[i] = d[i] >= max(8.0, 3 * med + 2) and loc[i] >= 0.6 * d[i]
    cut = cut_like & ~np.concatenate([[False], cut_like[:-1]])

    # --- 交叉淡化：端点差异大、中间每帧变化都温和、中间帧是两端的线性混合
    diss = []                               # (a, b, center)
    in_diss = np.zeros(n - 1, bool)
    cand = []
    for wdw in (2, 3, 5, 8, 12):            # 半窗 0.17s–1s
        for t in range(wdw, n - wdw):
            a_, b_ = t - wdw, t + wdw
            if cut_like[a_:b_].any():
                continue
            seg = d[a_:b_]
            if seg.max() > 0.75 * seg.sum() or seg.sum() < 10:
                continue
            Dab = np.abs(F16[b_] - F16[a_])
            if Dab.mean() < 10 or (Dab > 20).mean() < 0.20:   # 整帧级淡化；标题局部淡变一般只占几个百分点
                continue
            cand.append((t, wdw))
    cand_set = {}
    for t, wdw in cand:
        a_, b_ = t - wdw, t + wdw
        A = F16[a_].astype(np.float32); B = F16[b_].astype(np.float32)
        D = A - B; nd = float((D * D).sum()) + 1e-6
        res, alphas = [], []
        for k in range(a_ + 1, b_):
            X = F16[k].astype(np.float32) - B
            al = float((X * D).sum() / nd)
            r = np.abs(X - al * D).mean() / (np.abs(D).mean() + 1e-6)
            res.append(r); alphas.append(al)
        res = np.array(res); alphas = np.array(alphas)
        mono = np.all(np.diff(alphas) <= 0.08)
        mid = (alphas > 0.15) & (alphas < 0.85)        # 真正「两张叠在一起」的中间帧
        if (mid.sum() >= 2 and res[mid].mean() < 0.22 and res.mean() < 0.25 and mono
                and alphas[0] > 0.55 and alphas[-1] < 0.45):
            ks = np.arange(a_ + 1, b_)
            tc = int(ks[np.argmin(np.abs(alphas - 0.5))])       # 混合系数过 0.5 的那一帧
            cand_set[(t, wdw)] = (a_, b_, res.mean(), float(np.abs(D).mean()), tc)
    # 合并重叠：先取端点差最大的（整段淡化都在窗里），再看残差
    for key in sorted(cand_set, key=lambda k: (-round(cand_set[k][3], 0), cand_set[k][2])):
        a_, b_, _, _, tc = cand_set[key]
        if in_diss[a_:b_].any():
            continue
        in_diss[a_:b_] = True
        diss.append((a_, b_, tc))
    diss.sort()

    # --- 镜头
    bounds = sorted(set([0] + [i + 1 for i in np.where(cut)[0]] + [c for _, _, c in diss] + [n]))
    shots = []
    for s, e in zip(bounds[:-1], bounds[1:]):
        if e - s >= 3:
            shots.append((s, e))
        elif shots:
            shots[-1] = (shots[-1][0], e)
    if not shots:
        shots = [(0, n)]
    trans = cut_like | in_diss
    n_cut, n_diss = int(cut.sum()), len(diss)
    blank_runs = blank_frames(F, cut_like, in_diss)

    # --- 运动分布（排除转场帧）
    mv = np.where(trans, np.nan, d)
    good = ~np.isnan(mv)
    mvv = mv[good]
    # 帧差口径：12fps、320 宽灰度、屏蔽字幕带后的平均绝对差（0–255）。
    # 快动阈值 9 由标定得出（6–11 之间都能分开正负例，9 余量最大）；
    # LK 相机速度会漏掉 0.3 秒级快推，标定里单用它分不开，所以不进「快动」定义。
    STILL, DRIFT_HI, FAST = 0.30, 3.0, 9.0
    still = mvv < STILL
    fast = mvv >= FAST
    drift = (~still) & (~fast) & (mvv < DRIFT_HI)
    srt = np.sort(mvv)[::-1]
    top10 = srt[: max(1, len(srt) // 10)].sum() / max(srt.sum(), 1e-6)

    # 最长连续静止（全片帧序列，转场打断）
    st_full = (d < STILL) & ~trans
    longest = run = longest_at = 0
    for i, v in enumerate(st_full):
        run = run + 1 if v else 0
        if run > longest:
            longest, longest_at = run, i - run + 1

    # 事件：硬切、淡化、快速运动段（连续的快帧算一次）
    fast_full = np.zeros(n - 1, bool)
    fast_full[good] = fast
    ev_t = [i for i in np.where(cut)[0]] + [c for _, _, c in diss]
    prev = False
    for i, v in enumerate(fast_full):
        if v and not prev:
            ev_t.append(i)
        prev = v
    ev_t = sorted(ev_t)
    secs = n / FPS
    gaps = np.diff([0] + ev_t + [n - 1]) / FPS
    # 合并 0.3s 内重复的事件
    ev_m = []
    for t in ev_t:
        if not ev_m or t - ev_m[-1] > 0.3 * FPS:
            ev_m.append(t)
    event_rate = len(ev_m) / secs * 10

    # --- 每镜：死背景、慢缩放曲线
    dead_w, dead_flat_w, shot_w = [], [], []
    slow_zoom_dur, zoom_totals, slow_cam_dur = 0.0, [], 0.0
    for s, e in shots:
        L = e - s
        dur_s = L / FPS
        # 累积变换：A_k 把镜头首帧坐标映到第 k 帧
        A = [np.eye(3)]
        zc = [0.0]
        for k in range(s, e - 1):
            A.append(to3(Ms[k]) @ A[-1])
            zc.append(zc[-1] + (zr[k] if Ms[k] is not None else 0.0))
        zc = np.array(zc)
        # 慢缩放：总缩放 2%–25%，单调铺满大半个镜头，且没有快推
        if dur_s >= 1.2:
            rates = np.abs(zr[s:e - 1]) * FPS
            tot = abs(zc[-1] - zc[0])
            active = (rates > 0.004).mean()
            sgn = np.sign(zr[s:e - 1]); sgn = sgn[sgn != 0]
            mono = abs(sgn.mean()) if len(sgn) else 0
            if 0.02 <= tot <= 0.25 and active >= 0.6 and mono >= 0.7 and np.percentile(rates, 95) < 0.25:
                slow_zoom_dur += dur_s
                zoom_totals.append(tot / dur_s)
            sp_ = spd[s:e - 1]
            if (sp_ > 0.004).mean() >= 0.6 and np.percentile(sp_, 95) < 0.2:
                slow_cam_dur += dur_s
        if dur_s < 0.6:
            continue
        idx = np.unique(np.linspace(s, e - 1, min(L, 24)).astype(int))
        r = idx[len(idx) // 2]
        Ar = A[r - s]
        stack, valid = [], []
        ones = np.full((h, w), 255, np.uint8)
        for k in idx:
            T = (Ar @ np.linalg.inv(A[k - s]))[:2]
            stack.append(cv2.warpAffine(F[k], T, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT))
            valid.append(cv2.warpAffine(ones, T, (w, h), flags=cv2.INTER_NEAREST, borderMode=cv2.BORDER_CONSTANT) > 0)
        stack = np.array(stack, np.int16); valid = np.array(valid)
        vcount = valid.sum(0)
        ok = vcount >= 0.8 * len(idx)
        big = np.where(valid, stack, -1000).max(0); small = np.where(valid, stack, 1000).min(0)
        rng = big - small
        dead = ok & (rng <= 12)
        ref = F[r]
        gx = cv2.Sobel(ref, cv2.CV_32F, 1, 0); gy = cv2.Sobel(ref, cv2.CV_32F, 0, 1)
        flatpx = cv2.blur(np.hypot(gx, gy), (9, 9)) < FLAT_GRAD
        denom = max(ok.sum(), 1)
        dead_w.append(dead.sum() / denom); dead_flat_w.append((dead & flatpx).sum() / denom); shot_w.append(dur_s)
    shot_w = np.array(shot_w)
    dead_bg = float(np.average(dead_w, weights=shot_w)) if len(shot_w) else 0.0
    dead_flat = float(np.average(dead_flat_w, weights=shot_w)) if len(shot_w) else 0.0
    slow_zoom_share = slow_zoom_dur / secs
    zoom_cv = float(np.std(zoom_totals) / (np.mean(zoom_totals) + 1e-9)) if len(zoom_totals) >= 3 else float("nan")

    # --- 抽样帧上的面积类指标
    step = max(1, FPS // SAMPLE_FPS)
    sidx = np.arange(0, n, step)
    if len(sidx) > 240:
        sidx = np.unique(np.linspace(0, n - 1, 240).astype(int))
    S = F[sidx]
    flat_area, flat_light, subj = [], [], []
    BS = 8
    gh, gw = h // BS, w // BS
    cell_tex = np.zeros((len(sidx), gh, gw), bool)
    for j, fr in enumerate(S):
        gx = cv2.Sobel(fr, cv2.CV_32F, 1, 0); gy = cv2.Sobel(fr, cv2.CV_32F, 0, 1)
        g = np.hypot(gx, gy)[: gh * BS, : gw * BS].reshape(gh, BS, gw, BS).mean((1, 3))
        lum = fr[: gh * BS, : gw * BS].reshape(gh, BS, gw, BS).mean((1, 3))
        flat = (g < FLAT_GRAD).astype(np.uint8)
        nl, lab, stats, _ = cv2.connectedComponentsWithStats(flat, connectivity=4)
        big = np.zeros_like(flat, bool)
        for c in range(1, nl):
            if stats[c, cv2.CC_STAT_AREA] >= 0.03 * gh * gw:
                big |= lab == c
        flat_area.append(big.mean()); flat_light.append((big & (lum > 150)).mean())
        cell_tex[j] = g >= PAGE_GRAD
        tex = (g >= TEX_GRAD).astype(np.uint8)
        if tex.sum() == 0:
            subj.append(0.0); continue
        cl = cv2.morphologyEx(tex, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
        nl, lab, stats, _ = cv2.connectedComponentsWithStats(cl, connectivity=8)
        k = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        comp = (lab == k).astype(np.uint8)
        cs, _ = cv2.findContours(comp, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        fill = np.zeros_like(comp); cv2.drawContours(fill, cs, -1, 1, -1)
        subj.append(float(fill.mean()))
    flat_area = np.array(flat_area)

    # --- 固定页框：同一屏幕位置、有纹理（字/线/logo）、在画面其余部分已经大变的时刻仍原样出现
    page_share = page_frame(S, sidx, cell_tex, BS, gh, gw, shots)

    # --- 与示范构图相似
    tsim_share, tsim_max = float("nan"), float("nan")
    if template:
        tsim_share, tsim_max = template_similarity(F, shots, template)

    # --- 原地淡入淡出占比：变化帧里局部结构符号一致（只变亮度不位移）的平均比例
    chg = (~trans) & (fade_px >= 0)
    lf = float(np.mean(fade_px[chg] > 0.7)) if chg.sum() > 5 else 0.0

    # 前紧后松：最差的 30 秒窗口（片长不足 60 秒时取片长一半）里的快动帧占比
    win = int(min(30.0, secs / 2) * FPS)
    fr_full = np.where(trans, np.nan, fast_full.astype(float))
    worst, worst_t = float("nan"), None
    if win >= FPS * 4:
        for st0 in range(0, n - 1 - win + 1, FPS):
            seg = fr_full[st0: st0 + win]
            v = np.nanmean(seg) if np.isfinite(seg).any() else 0.0
            if not (worst == worst) or v < worst:
                worst, worst_t = float(v), st0 / FPS
    by10 = [round(float(np.nanmean(fr_full[k: k + 10 * FPS])), 3) if np.isfinite(fr_full[k: k + 10 * FPS]).any() else 0.0
            for k in range(0, n - 1, 10 * FPS)]
    if os.environ.get("FILM_GATE_DUMP"):
        np.savez_compressed(os.environ["FILM_GATE_DUMP"], d=d, spd=spd, loc=loc, zr=zr, cut=cut, in_diss=in_diss, fade_px=fade_px)

    shot_len = np.array([(e - s) / FPS for s, e in shots])
    res = {
        "file": os.path.basename(path),
        "orientation": "vertical" if is_vert else "horizontal",
        "duration_s": round(secs, 2),
        "sub_band": sub_band,
        "shots": len(shots), "hard_cuts": n_cut, "dissolves": n_diss,
        "asl_s": round(float(shot_len.mean()), 2),
        "dissolve_share": round(n_diss / max(1, n_cut + n_diss), 3),
        "fast_ratio": round(float(fast.mean()), 4),
        "top10_share": round(float(top10), 3),
        "drift_ratio": round(float(drift.mean()), 3),
        "still_ratio": round(float(still.mean()), 3),
        "longest_still_s": round(longest / FPS, 2),
        "longest_still_start_s": round(longest_at / FPS, 2),
        "event_rate": round(event_rate, 2),
        "max_event_gap_s": round(float(gaps.max()), 2),
        "dead_bg": round(dead_bg, 3),
        "dead_flat": round(dead_flat, 3),
        "flat_area": round(float(flat_area.mean()), 3),
        "flat40_frames": round(float((flat_area > 0.4).mean()), 3),
        "page_frame_share": round(page_share, 3),
        "slow_zoom_share": round(float(slow_zoom_share), 3),
        "slow_cam_share": round(float(slow_cam_dur / secs), 3),
        "zoom_curve_cv": round(zoom_cv, 3) if zoom_cv == zoom_cv else None,
        "subject_box": round(float(np.median(subj)), 3),
        "flat_light": round(float(np.mean(flat_light)), 3),
        "template_sim_share": round(tsim_share, 3) if tsim_share == tsim_share else None,
        "template_sim_max": round(tsim_max, 3) if tsim_max == tsim_max else None,
        "local_fade_ratio": round(lf, 3),
        "mean_diff": round(float(np.nanmean(mv)), 2),
        "fast_ratio_worst_window": round(worst, 4) if worst == worst else None,
        "worst_window_start_s": worst_t,
        "worst_window_len_s": round(win / FPS, 2),
        "fast_ratio_by_10s": by10,
        "blank_run_s": round(max((b - a for a, b in blank_runs), default=0.0), 2),
        "blank_runs_s": blank_runs,
        "cut_times_s": [round((i + 1) / FPS, 2) for i in np.where(cut)[0]],
        "dissolve_times_s": [round(c / FPS, 2) for _, _, c in diss],
    }
    return res


FLAT_GRAD = 6.0     # 8x8 块平均梯度低于它算「平」（320 宽灰度）
BLANK_GRAD, BLANK_FRAC = 24.0, 0.002   # 空帧：梯度 > 24 的像素不到 0.2%（标定集认可片的单帧最低是 0.30%，没有连续两帧低于它）
BLANK_EDGE_S, BLANK_MIN_S = 0.5, 0.3   # 去掉首尾各 0.5 秒；连续 ≥0.3 秒才算


def blank_frames(F, cut_like, in_diss):
    """中段近乎纯色的空画面：[(起, 止) 秒]，只列 ≥ BLANK_MIN_S 的段。
    按边缘判（整帧几乎没有梯度），不按颜色判；切点两侧的帧和交叉淡化窗口不算，跨过它们的段断开算。"""
    n = len(F)
    blank = np.zeros(n, bool)
    for i, fr in enumerate(F):
        g = np.hypot(cv2.Sobel(fr, cv2.CV_32F, 1, 0), cv2.Sobel(fr, cv2.CV_32F, 0, 1))
        blank[i] = (g > BLANK_GRAD).mean() < BLANK_FRAC
    ok = np.ones(n, bool)
    e = int(round(BLANK_EDGE_S * FPS)); ok[:e] = False; ok[max(0, n - e):] = False
    for i in np.where(cut_like | in_diss)[0]:
        ok[i] = False; ok[i + 1] = False
    runs, s0 = [], None
    for i, v in enumerate(list(blank & ok) + [False]):
        if v and s0 is None: s0 = i
        elif not v and s0 is not None:
            if (i - s0) / FPS >= BLANK_MIN_S - 1e-9: runs.append((round(s0 / FPS, 2), round(i / FPS, 2)))
            s0 = None
    return runs
TEX_GRAD = 14.0     # 高于它算「有纹理」
PAGE_GRAD = 25.0    # 页框格子要求的纹理（字、细线、logo 的强边）


def page_frame(S, sidx, cell_tex, BS, gh, gw, shots):
    """固定页框时长占比。
    一个格子在某帧「复现」= 强纹理，且在 ≥3 个相隔 ≥3 秒、整体画面已明显不同的帧里同位原样出现。
    全片里复现率 ≥25% 的格子算「页框格」（标题栏、页眉、页码、logo、进度条）；
    某帧里页框格（且当帧复现）合计 ≥ 画面 1.5%，这一帧算被页框框住。
    只复用同一段素材、同一张底纹的镜头，复现是零散的，过不了 25% 这一关。"""
    N = len(S)
    if N < 6:
        return 0.0
    desc = np.array([cv2.resize(fr[: gh * BS, : gw * BS], (gw * 4, gh * 4), interpolation=cv2.INTER_AREA)
                     for fr in S]).astype(np.float32)
    desc = desc.reshape(N, gh, 4, gw, 4).transpose(0, 1, 3, 2, 4).reshape(N, gh, gw, 16)
    small = np.array([cv2.resize(fr, (32, 18), interpolation=cv2.INTER_AREA) for fr in S]).astype(np.float32)
    t = sidx / FPS
    G = np.abs(small[:, None] - small[None]).mean((2, 3))
    far = (np.abs(t[:, None] - t[None]) >= 3.0) & (G > 12)
    persist = np.zeros((N, gh, gw), bool)
    for y in range(gh):
        for x in range(gw):
            tex = cell_tex[:, y, x]
            if tex.sum() < 3:
                continue
            v = desc[:, y, x]
            Dm = np.abs(v[:, None] - v[None]).mean(2)
            persist[:, y, x] = ((Dm < 6.0) & far & tex[:, None] & tex[None]).sum(1) >= 3
    chrome = persist.mean(0) >= 0.25
    framed = (persist & chrome).sum((1, 2)) / (gh * gw) >= 0.015
    return float(framed.mean())


def layout_desc(fr):
    e = cv2.Canny(fr, 60, 160).astype(np.float32)
    g = cv2.resize(e, (12, 8), interpolation=cv2.INTER_AREA).ravel()
    t = cv2.resize(fr, (12, 8), interpolation=cv2.INTER_AREA).astype(np.float32).ravel()
    g = (g - g.mean()) / (g.std() + 1e-6); t = (t - t.mean()) / (t.std() + 1e-6)
    return np.concatenate([g, t]) / np.sqrt(2 * g.size)


_TPL_CACHE = {}


def template_similarity(F, shots, template):
    if template not in _TPL_CACHE:
        T, _ = decode_gray(template, fps=2, limit=12)
        T = T[:24]                                       # 前 12 秒
        T = T[:, : int(T.shape[1] * 0.85)]
        _TPL_CACHE[template] = np.array([layout_desc(x) for x in T])
    TD = _TPL_CACHE[template]
    sims, durs = [], []
    for s, e in shots:
        k = (s + e) // 2
        v = layout_desc(F[k])
        sims.append(float((TD @ v).max())); durs.append(e - s)
    sims, durs = np.array(sims), np.array(durs, float)
    return float(durs[sims >= 0.70].sum() / durs.sum()), float(sims.max())


# ---------------------------------------------------------------- 打灯
SHORT_S = float(os.environ.get("FILM_GATE_MIN_S", 20))  # 标定集都是 45 秒以上的成片；短于这个时长的片段读数噪声大，红灯降为黄灯只提示


FACT_GATES = {"blank_run_s"}   # 事实类门禁：片长再短也照样红灯


def grade(res):
    rows, red = [], False
    short = (res.get("duration_s") or 0) < SHORT_S
    for k, (name, direc, y, r, gate, unit) in METRICS.items():
        v = res.get(k)
        if v is None or direc == "info":
            rows.append((k, name, v, "--", gate, unit)); continue
        bad = (lambda t: v >= t) if direc == "high_bad" else (lambda t: v <= t)
        lv = "red" if (gate and r is not None and bad(r)) else "yellow" if (y is not None and bad(y)) else "green"
        if lv == "red" and short and k not in FACT_GATES:
            lv = "yellow"; res["short_clip_note"] = f"片长 {res.get('duration_s')}s，短于 {SHORT_S}s，快动门禁只提示不拦（空画面照样拦）；拼进成片后在成片上再跑一次"
        red |= lv == "red"
        rows.append((k, name, v, lv, gate, unit))
    return rows, red


# ---------------------------------------------------------------- 读给人听
FIX = ("按 SKILL.md 窄桥第一条「动在事件上」改：每个镜头在口播节点上做「停住 → 快推 / 横移 / 砸入 → 停住」——"
       "快推 0.28 秒推近 18–32%、同倍率横移 0.30 秒、砸入 0.17 秒，用 CAM.track 写镜头动作表（MO.slam 砸入）；"
       "有截图、照片、录像就用 MD.cover 满幅铺开，念到哪一处就把焦点推近到哪一处。"
       "匀速慢推、淡入淡出、转场都不算数（转场再快也被排除在外）。"
       "别为了过门每页硬塞一次快推：门禁只拦「整片没有猛动作」这一种 PPT，页框、米底小图、前紧后松它拦不住。")

BLANK_FIX = ("空画面这一段让主角或主物留在画里：要换气就让它停住、拉远，或者镜头从它身上横移到下一个物；"
             "转场不要经过纯色底（黑场、纯色闪、渐变底）停留 0.3 秒以上。白板、黑底片只要画面上有笔画、线条、字，就不算空。")


# 只报告的黄灯项：一句「去看哪里」
LOOK = {
    "fast_ratio_worst_window": lambda r: f"{r['worst_window_start_s']:.0f}–{r['worst_window_start_s'] + r['worst_window_len_s']:.0f}s 这段几乎没有快动作（前紧后松）",
    "drift_ratio": lambda r: f"{r['drift_ratio']:.0%} 的帧在缓慢漂移",
    "longest_still_s": lambda r: f"从 {r['longest_still_start_s']:.1f}s 起连续 {r['longest_still_s']:.1f}s 一动不动",
    "event_rate": lambda r: f"平均每 10 秒只有 {r['event_rate']:.1f} 个视觉事件",
    "max_event_gap_s": lambda r: f"最长 {r['max_event_gap_s']:.1f}s 没有任何切换或快动作",
    "dead_bg": lambda r: f"扣掉相机运动后，平均 {r['dead_bg']:.0%} 的画面在镜头里一直不变",
    "dead_flat": lambda r: f"{r['dead_flat']:.0%} 的画面是一直不变的空底",
    "flat_light": lambda r: f"米底/白底空着的面积平均占 {r['flat_light']:.0%}（白板等浅底风格可以如此，确认是风格不是空着）",
    "page_frame_share": lambda r: f"{r['page_frame_share']:.0%} 的时长被固定的页眉、页码、标题栏、logo 框着",
    "slow_zoom_share": lambda r: f"{r['slow_zoom_share']:.0%} 的时长是匀速慢推/慢拉镜头",
    "dissolve_share": lambda r: f"转场里 {r['dissolve_share']:.0%} 是交叉淡化",
    "template_sim_share": lambda r: f"{r['template_sim_share']:.0%} 的时长和示范片构图几乎一样",
}


def explain(res):
    """一句话结论＋为什么＋怎么改＋黄灯项去看哪里。只用 res 里量出来的数。"""
    fr, lv = res["fast_ratio"], res["lights"]["fast_ratio"]
    if lv == "red":
        head = ("整片没有一次镜头内的快速动作，读起来像翻页" if fr < 0.005 else
                f"整片只有 {fr:.1%} 的帧在镜头内快速运动（红线 3.5%），读起来像翻页")
    elif lv == "yellow":
        head = f"镜头内的快速动作偏少（{fr:.1%}，黄线 6%），离翻页感不远"
    else:
        head = f"镜头内有足够的快速动作（{fr:.1%}）"
    if res.get("short_clip_note"):
        head += "。" + res["short_clip_note"]
    blank_red = res["lights"].get("blank_run_s") == "red"
    if blank_red:
        segs = "、".join(f"{a:.2f}–{b:.2f}s" for a, b in res["blank_runs_s"])
        head = (f"中段有 {len(res['blank_runs_s'])} 段近乎纯色的空画面（{segs}），最长 {res['blank_run_s']:.2f}s，"
                f"整帧几乎没有边缘或纹理、主体不在画里") + ("；另外" + head if lv != "green" else "")
    why = []
    if lv != "green":
        if res["slow_zoom_share"] >= 0.3:
            why.append(f"{res['slow_zoom_share']:.0%} 的时长在匀速慢推/慢拉")
        if res["still_ratio"] >= 0.5:
            why.append(f"{res['still_ratio']:.0%} 的帧完全停着")
        elif res["drift_ratio"] >= 0.4:
            why.append(f"{res['drift_ratio']:.0%} 的帧只是在缓慢漂移")
        if res["hard_cuts"] + res["dissolves"]:
            why.append(f"画面变化主要靠转场（硬切 {res['hard_cuts']}、淡化 {res['dissolves']}），转场不算镜头内动作")
    look = [(k, LOOK[k](res)) for k, l in res["lights"].items() if l == "yellow" and k in LOOK]
    ww = None
    if res.get("worst_window_start_s") is not None:
        a = res["worst_window_start_s"]
        ww = {"start_s": a, "end_s": round(a + res["worst_window_len_s"], 2), "fast_ratio": res["fast_ratio_worst_window"]}
    fix = " ".join(x for x in (BLANK_FIX if blank_red else None, FIX if lv != "green" else None) if x) or None
    return {"summary": head, "why": why, "fix": fix, "look": look, "worst_window": ww, "blank_runs": res["blank_runs_s"]}


def measure(path, sub_band=None, vertical="auto", template=DEFAULT_TEMPLATE):
    """量一支成片，返回带 lights / gate_light / verdict / explain 的结果。deliver.py 也调它。"""
    tpl = template if template and os.path.exists(template) else None
    cv2.setNumThreads(max(1, (os.cpu_count() or 2) // 2))
    res = analyze(path, sub_band=sub_band, vertical=vertical, template=tpl)
    rows, red = grade(res)
    res["lights"] = {k: lv for k, _, _, lv, _, _ in rows}
    res["gate_metrics"] = [k for k, _, _, _, gate, _ in rows if gate]
    gl = [res["lights"][k] for k in res["gate_metrics"]]
    res["gate_light"] = "red" if "red" in gl else "yellow" if "yellow" in gl else "green"
    res["verdict"] = "red" if red else "pass"
    res["explain"] = explain(res)
    return res, rows


LIGHT = {"red": "[红]", "yellow": "[黄]", "green": "[绿]", "--": "[  ]"}


def report_lines(res, rows):
    """文字报告（终端和交付说明共用）。"""
    L = [f"{res['file']}  {res['orientation']}  {res['duration_s']}s  "
         f"镜头 {res['shots']}（硬切 {res['hard_cuts']}，淡化 {res['dissolves']}）  平均镜长 {res['asl_s']}s"]
    for k, name, v, lv, gate, unit in rows:
        vs = "—" if v is None else (f"{v:.3f}" if isinstance(v, float) else str(v))
        L.append(f"  {LIGHT[lv]} {'门禁' if gate else '报告'}  {name}：{vs}{unit}")
    ex = res["explain"]
    if res.get("blank_runs_s"):
        L.append("  空画面时间码：" + "、".join(f"{a:.2f}–{b:.2f}s" for a, b in res["blank_runs_s"]))
    if ex["worst_window"]:
        w = ex["worst_window"]
        L.append(f"  最差 {w['end_s'] - w['start_s']:.0f} 秒窗口：{w['start_s']:.0f}–{w['end_s']:.0f}s，快动帧占比 {w['fast_ratio']}；"
                 f"每 10 秒快动帧占比：{res['fast_ratio_by_10s']}")
    return L


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("mp4")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--vertical", default="auto", choices=["auto", "yes", "no"],
                    help="横竖屏；auto 按宽高判断。只影响字幕带默认值")
    ap.add_argument("--sub-band", type=float, default=None,
                    help="屏蔽底部字幕带的比例；默认横屏 0.15、竖屏 0.18；0 表示不屏蔽")
    ap.add_argument("--template", default=DEFAULT_TEMPLATE, help="示范片（取前 12 秒比构图）")
    ap.add_argument("--no-template", action="store_true")
    a = ap.parse_args()
    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        print("需要 ffmpeg/ffprobe", file=sys.stderr); sys.exit(1)
    try:
        res, rows = measure(a.mp4, sub_band=a.sub_band, vertical=a.vertical, template=None if a.no_template else a.template)
    except (subprocess.CalledProcessError, KeyError, IndexError, RuntimeError, ValueError) as e:
        print(f"读不了这支片：{a.mp4}（{e}）", file=sys.stderr); sys.exit(1)
    red = res["verdict"] == "red"
    if a.json:
        print(json.dumps(res, ensure_ascii=False, indent=1))
    else:
        print("\n".join(report_lines(res, rows)))
        ex = res["explain"]
        tag = {"red": "红灯，不出片", "yellow": "黄灯，可以交付但要人看", "green": "门禁通过"}[res["gate_light"]]
        print(f"结论：{tag}——{ex['summary']}。" + ("".join(f"{w}；" for w in ex["why"]).rstrip("；") + "。" if ex["why"] else ""))
        if ex["fix"]:
            print("怎么改：" + ex["fix"])
        if ex["look"]:
            print("黄灯项（只报告，不拦；去看这一段，交付说明里逐条说清为什么可以这样）：")
            for _, t in ex["look"]:
                print("  - " + t)
        if not red:
            print("提醒：门禁只拦「整片几乎没有快动作」和「中段空画面」两种硬伤；独立审片仍然要做。")
    sys.exit(2 if red else 0)


if __name__ == "__main__":
    main()
