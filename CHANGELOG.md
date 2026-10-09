# 发布包更新 · 2026-10-06

- 同步35种当前艺术风格目录和第9种讲解员语法；8种语法仍提供参数化片段。
- 加入口播整片代码快照、文字框景QA和浅底字幕区检查；说明需自备素材的范围。
- 私人反馈、角色源提示词、未公开依赖与开发Git历史不随包发布。
- 保留公开副本的思源黑体、原创示例配乐和角色使用边界；补齐第三方笔顺数据许可。

# CHANGELOG

- 2026-10-04 v0.1 · 从「艺术史速通」复刻沉淀：拆解法（01）、五层机制（02）、一帧先行四路线（03）、纯代码绘制（04）、节奏与配乐（05）、口播驱动草案（06）；16 张风格配方卡；完整引擎＋16 个场景；breakdown.py 拆解脚本（网格拟合取「80% 内点下最大步长」）；key_green.py 保坐标抠图；音轨合成模板。
- 2026-10-04 v0.3 · 迁移测试 A–D 回流进库：lib 拆出 brush.js（毛笔飞白/墨晕/流线长笔/水彩/厚涂/剪刀折线）、render.js（照片网点/点彩/赛璐珞/Kirby 阴影/体积/长影子/双版本光影/光照图/皮影/手剪位移/霓虹）、post.js（VHS/胶片/泛光/光晕/纹理叠角色/褪色）；RIG.limb 端帽修正、猫身与白胸平滑、drawGirl/drawCat 分层钩子、非等比拉长、刚体枢轴；角标可插拔且转场中点硬切；转场按 eras 自动加载、缓存可按段；霞鹜文楷子集＋font_subset.py＋U.assertGlyphs（查 cmap）；20 段新风格进 scenes/，全风格样片 eras_gallery.js（36 段，?film=gallery）；qa 加转场冒烟、--film。
- 2026-10-04 v0.4 · YouTube 解说动画语法 8 种（Kurzgesagt / Vox / 白板 / storytime / 动态文字 / 3b1b / 发布会 / 财经图表）收进 skill：
  lib 新增 motion（MO）、camera（CAM）、diagram（DG）、typo（TY）、chart（CH）、ui（UI）、collage（CL）、toon（TOON）八个库；transitions.js 新增 13 个解说转场（same / lensReveal / matchCut / whip / smash / fillZoom / bands / push / zoomThrough / blurPush / expandRect / slidePush / fadeShift）；
  引擎支持 window.BPM、段写 dur（秒）、transition.punch / window.PUNCH、SCENE_LIBS / SCENE_DIR、?film=demos/<语法>；8 支示范片进 demos/（与实验原片逐像素一致）；
  参数化片段 clip.html＋clips/<语法>.js＋render.py --spec（时长精确、竖屏、--alpha 出 ProRes 4444），给口播管线当动画段，8 份样例在 engine/examples/；
  字体：普惠体四字重与霞鹜文楷扩到 GB2312 全部汉字（font_subset.py --gb2312），CMU / Inter / Roboto Condensed / 思源子集；
  文档 references/09-视频动画语法.md（总览、选语法决策表、跨语法通用规律、库速查、片段契约），语法卡 8 张进 references/动画语法/、总览图进 assets/动画语法/。

- 2026-10-05 00:34:23 +0800：一支口播片实战回流：按解释任务混用Vox与3b1b、固定音轨字幕后重构画面，证据与边界见07号新条目。

- 2026-10-05 v0.5 · 开源整理：去掉本机路径与合作项目信息；中文黑体换成思源黑体 Noto Sans SC（family 名沿用 PuHui-*），补字体许可清单；全风格样片移到 Release；加 README / LICENSE。
- 2026-10-05 v0.6 · 开源第二轮：Vox 示范片的人物改用卡通帧，写实人像不再随仓库；配乐脚本换成原创示例乐谱，音轨文档改成「方法＋原创示例」；洞穴段标题换成原创文字；收进长卷穿越片示范 demos/long_scroll（骨架＋埃及、莫奈、8-bit 三段）与 11 号文档。

- 2026-10-08 · P0/P1本地实现：可选语音配置、已有音频/macOS系统声音/火山复刻、安装目录外私人默认、按需配置与跳过、旧koubo入口兼容；共享文件清单同步。图片能力桥接与跨宿主完整发布验收留后续。

- 2026-10-08 · P2/P3：增加现有图片与当前宿主工具桥接、需求计划/回执/透明背景/尺寸与SHA验收；旧配置保留，新增能力不自动授权；补充贡献与兼容性说明、CI及增量发布检查。三家安装重装通过，Codex在线验收通过，Claude/Kimi在线验收因账户条件待补。
- 2026-10-09 · 换掉把模型往坏处带的默认值（只改文档与样例）：SKILL.md 首屏加模型分档（开阔档／轨道档）、「五种做坏方式」、窄桥改成「动在事件上」的脉冲节奏并写明真实素材当主画面、示范不许原样进成片；各语法卡删掉「静止就加慢推」药方、补「起手必查」，t2 的光斑、毛玻璃、渐变字降为可选；风格 INDEX 拆成材料层／时代标本，写明 35 张样片同构图是速通机制；固定场景骨架限定为速通／穿越类；8 份样例 spec 改成画面事件开场、每条字 ≤14。
- 2026-10-10 · 把认可过的做法做成引擎能力（改动包B，改代码）：新增 `CAM.track` 脉冲镜头（快推 0.28s／同倍率横移 0.30s／整帧砸入 0.17s／震镜／硬切）与 `MO.PULSE/slamK/slam/pulse`；新增 `lib/media.js`（`MD.cover` 满幅＋焦点推近、`MD.print` 冲印件、`MD.label` 黑底撕边标签、`MD.frameAt` 帧序列），素材缺失一律报错；片段 spec 认 `cues[].frames` 录像帧与 y4 角色帧库（`engine/spec_assets.py`）；t2 截图默认满幅＋highlight 快推＋两屏之间横移，玻璃卡改为 `data.frame:"glass"` 可选；y1 中心物由 `data.center_style`／`data.image` 指定，默认按名字生成中性样式、不再是橙色带轨道星球；y2 照片改冲印件、占画面八九成；y4 默认角色换成中性造型（`data.character`：neutral／bun／author／造型对象／帧库目录），作者形象需显式指定；去掉 y1/y2/y4/y5/t2 内置的匀速慢推、手持微漂、呼吸、漂浮；引擎和转场按当前画布算，`render.py --film --width 1080 --height 1920` 出竖屏整片；引擎视频帧改为等比铺满、缺帧拒绝渲染；新增样例 `examples/t2_fullbleed_pulse.json`（两张真实终端截图）。横屏示范片、原片与全风格样片逐像素不变。
- 2026-10-10 · 反 PPT 门禁装进交付（改动包C）：新增 `scripts/film_gate.py`（只读成片，门禁只有快速运动帧占比，< 0.035 红灯、< 0.06 黄灯，阈值来自作者表过态的 13 支片；其余指标只报告，静止类不当门禁；报告给最差 30 秒窗口、一句话原因和修法）与 `scripts/deliver.py`（一条命令交付：红灯不复制成片、非零退出；绿灯、黄灯复制成片并写 `交付说明.md`，时长、分辨率、门禁各项、qa 结果、`审片/*.md` 有无都由脚本写，事实段带指纹、`--verify` 可查）；qa 把短于 0.35 秒的单调推拉、横移记作镜头事件不算跳变，`--spec` 改用 `spec_assets` 解析，认 `frames` 与角色帧库；SKILL.md 轨道档第 5、6 步改为 qa → deliver.py，验收段、五种做坏方式第 1 条、09 号同步；`tests/test_film_gate.py` 用两支合成片端到端测门禁、交付与镜头事件。
- 2026-10-10 · 轨道档改成「先镜头表，再动手」（改动包A2）：轨道档第 1 步照新增的 `references/镜头表模板.md` 写镜头表（时间段｜物｜做什么｜镜头｜屏上字｜做法，附一份「为什么面包会发霉」完整示例），第 2 步过新增的 `scripts/storyboard_lint.py`（只用标准库：物不能是版面词、做什么不能只是出现/显示、屏上字 ≤8、首镜不能文字主导、文字主导 ≤30%、单镜 2–6 秒、连续三镜同一镜头报黄、同一参数化片段合计 >8 秒和做法少于 3 种报红；有红非零退出），红灯不许写代码；第 3 步逐镜做（片段或 scenes，单片段最多 8 秒，至少 3 种做法），第 4 步给出 ffmpeg concat 硬切拼接命令；之后照旧 qa → deliver.py。`render.py --spec` 在 duration > 8 秒时首尾各打印一次警告（不报错），09 号片段契约同步；开阔档建议先写镜头表、不强制 lint。门禁阈值、窄桥、五种做坏方式、引擎能力不变；`tests/test_storyboard_lint.py` 测示例绿灯、要点墙红灯。
- 2026-10-10 · 盲评反复点名的残留问题改成机械检查（改动包D）：`storyboard_lint.py` 新增 ⑧最后一镜不能是文字主导（居中金句卡/纯字卡）报红、①物列是空镜/空景/纯色/黑场/黑屏/全黑/渐变底报红（单独的改法）、⑨可选 `--script 文稿.txt` 时屏上阿拉伯数字（百分数、年份、带单位的数）在文稿里找不到报红（文稿里的中文数字也认，按文稿那个数的精度容差）、⑩可选「标签」列一镜超过 3 个报黄；`film_gate.py` 新增第二条门禁 `blank_run_s`：去掉首尾各 0.5 秒和转场窗口，梯度 >24 的像素不到 0.2% 的帧算空帧，连续 ≥0.3 秒红灯并给时间码，按边缘判不按颜色判、不受短片降级；标定数据 32 支（含 13 支表过态、9 支认可）全部不触发、快动帧占比与标定表逐位一致，快动门禁阈值不变；t3 片段新增 `theme`（light/paper/dark/对象，spec 级或 data 级），没写主题时跟 `safe.fill` 的底色走，默认白底逐帧不变；t2 的 number 新增 `data.over`（拉回整张截图、压暗、数字砸在截图上），`examples/t2_fullbleed_pulse.json` 改用它，去掉 5.5 秒前后的空光斑底；镜头表模板示例结尾改成小满把吐司塞进冷冻层；SKILL.md 五种做坏方式第 1、4 条并入结尾金句卡与空画面，09 号与 t2/t3 卡同步；新增 `tests/test_film_gate_blank.py`（ffmpeg 合成片）、`tests/test_clip_world.py`（渲染核对），`test_storyboard_lint.py` 补新规则。
