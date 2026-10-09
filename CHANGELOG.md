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

- 2026-10-09 · y2_vox 片段：相机改为跟着下一张卡一起到位（at+0.45 落定，原 at−0.05），红线同步晚 0.5s 起描；修「镜头先停在空桌面、卡后进来」约 0.6s 的空档。10s 复现片空桌面帧 55→13（1.83s→0.43s，剩下的是甩镜中间帧）；cue 的 at 语义不变（仍是卡开始滑入的时刻）。Windows 11 渲染与 qa 复测通过。
