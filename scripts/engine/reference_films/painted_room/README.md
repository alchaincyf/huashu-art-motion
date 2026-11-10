# 参考实现：同一个房间，十六种画法（2026-11-09）

一个房间、一扇窗、一只背对观众的猫，从洞穴壁画一路画到像素，44.4 秒、16 种画法；可选一个角色走进来，每次换画法都是他亲手做的（拉过来、带着走、跳一下溅开、挥手刷出来），结尾 16 种画法同时落下。方法见 `references/18-媒介层与角色入画.md`。

和 `scenes/`（01–55）不是一套引擎：这里的场景不直接画成最终像素，而是先交出「颜色图＋区域号图＋每个区域的笔触方向」，再由媒介那道工序一笔一笔画出来。同一个房间函数换媒介，只换那道工序。

## 文件

| 文件 | 是什么 | 最值得抄的 |
|---|---|---|
| `engine.js` | 画法引擎 `window.ENG` | `Scene / add / sprite`（场景两张图）、`paint`（按格子撒笔、沿方向场走、到区域边缘停）、`brush`（一笔拆成刷毛）、`contours`（只画看得见的轮廓）、`tex`（纸、石、裂纹、木、织物）、方向场 `F.dir / radial / ring / swirl / along` |
| `film.js` | 房间 `room(pal, t, …)`、10 套色板与媒介、`swipes`（刷子扫出的遮罩） | 一个房间函数吃不同色板；每种媒介一个二三十行的函数 |
| `film2.js` | 另 6 种媒介、16 段时间轴、角色轨、四种转场、镜头 | `segs / heroAt`（角色在哪、做什么）、`compose`（接缝跟着手／骑在身上／从脚下溅开）、`HEROMAP`（把角色帧映射成该时代的几个色）、`KEEP`（画完再把原帧叠回一点） |
| `render.py` | 静帧、指定帧、整片（多进程，按 12 帧一块轮流分） | 角色帧转 data URL 传进页面 |
| `score.abc` | 配乐谱：一个四音动机，每种画法换一件乐器 | 段落与画法同一张拍子表（100 BPM，每段 4 或 6 拍） |

## 跑起来

需要 `uv`、Playwright 的 Chromium（首次 `uv run --with playwright playwright install chromium`），渲整片另需 `ffmpeg`。

```sh
uv run --with playwright python render.py --stills                 # 每种画法一张，写到 out/
uv run --with playwright python render.py --film --workers 6       # 整片 1066 帧，out/painted_room.mp4
uv run --with playwright python render.py --film --audio 配乐.wav    # 带上自己的音轨
```

`score.abc` 只是乐谱，仓库里不带音频。用任何能把 ABC 谱合成音频的工具出 wav（节拍网格的做法见 `references/05-节奏与配乐.md`），或者换成自己的配乐，对齐 100 BPM 的拍子表即可。

整片逐笔绘制，比 `scenes/` 的片子慢得多，先用 `--stills` 和 `--frames` 看对了再渲整片。厚涂和点彩那几段最慢。

## 角色帧

仓库里不带角色帧。没有帧时房间照常播放，只是没有人，转场仍然按时发生。要让自己的角色走进来：在本目录建 `角色帧/`，每个动作一个子目录，放按文件名排序的透明底 PNG（每个动作 8 帧左右，角色朝右，脚底贴图片下沿）：

```
角色帧/走路/  伸手拖拽/  挥手/  欢呼跳/  思考想通/  待机眨眼/
```

或 `--sprites <目录>` 指到别处。帧可以是已有的绘本帧库、手绘、三渲二导出，任何已经画好的角色帧。

## 改成自己的片子

- 换题材：重写 `film.js` 的 `room`，保留它交出 `Scene` 的方式（每样东西 `S.add({ key, pts, fill, flow, … })`）。
- 换画法或加画法：`PAL` 加一套色，`MEDIA` 加一个函数，`film2.js` 的 `ERAS` 加一行，`TRN` 同时补一个转场字母（`TRN` 必须和 `ERAS` 一样长，少一个会报错）。
- 换节奏：改 `ERAS` 每段的拍数和 `TRN` 的转场字母；配乐谱的小节跟着改。
- 在中间插段或删段之前先看 `film2.js` 的 `segs` 那一段：有几处动作是按段落序号写死的（`T[3]`、`T[12]` 后的「思考想通」、`T[10]` 的拽月亮、`WX` 里走到哪的下标 2／6／10／14，`camera` 里 `T[10]` 的推近）。加在末尾不受影响，插在中间要把这些序号一起挪。

代码里一种画法叫一个 era（`ERAS` 的一行），色板和媒介函数用同一个 id 对上。`film.js` 后半还留着只有猫、10 种画法的第一版时间轴（它自己的 `ERAS`、`compose`、`window.FILM.frame`），渲染不走它，`render.py` 用的是 `film2.js` 的 `FILM2`；改时间轴改 `film2.js`，那一段可以删。

片尾标题和左下角年份是这支片子自己的内容，换题材时一起换掉（`drawLabel`、`compose` 里 `T_FIN` 那一支）。
