# SpaceX口播动画参考代码

**中文** · [English](README.en.md)

包含混合风格、白板、Vox拼贴、讲解员四种表达的场景代码快照。用于学习并迁移镜头、关键词时间锚和布局方法，不是开箱可渲染的完整示范；不代表最新公开成片的完整工程。

- `spacex/tm.js`：`TM.cue(段, '原文子串')`将动作挂到口播关键词；`timing.js`是这条示例的时间数据，做新题材时需要替换。
- `spacex_wb/common.js`：内容取景`fit/declip/shot`、笔画调度`build`、按笔顺揭示`so/soAt`。
- `spacex_vox/common.js`：累积桌面`item/drawWorld/camEnd`、插入镜头、遮挡登记。
- `spacex_lin/common.js`：讲解员换帧、脚底锚点、跨段姿态和顶栏；`tools/prep_presenter.py`演示绿幕切帧。
- `eras_*.js`：四种段落表；`transitions/`：配套转场。

## 使用边界

1. 先复制上层`scripts/engine/`到自己的工程，再将这里选中的片子目录、段落表和转场放到工程根对应位置。白板段落表文件名保留`eras_wbx.js`，实际素材路径统一为`spacex_wb/`。
2. 讲解员sprite、混合版人物帧、源生图提示词和口播音频不随本快照分发。`presenter_meta.js`只提供帧表结构；需要用自己的角色重新生成素材和元数据。已有帧表不代表素材存在。
3. 字体沿用上层工程`lib/fonts.js`及随包字体；Vox正文和打字机数字已分别改用随包霞鹜文楷与CMU，避免额外字体缺失，预处理脚本需`numpy`和`Pillow`；运行`make_hand.py`须先在其目录准备自己的`hand_raw_1.png`至`hand_raw_3.png`。
4. 这里的示例文字和数字是历史创作素材，不是可直接引用的最新SpaceX事实资料。新作品需自行核实脚本，并重建口播时间轴。
5. 如只想先运行完整示范，使用上层`demos/`或`clips/`，不要从本目录开始。

## 第三方笔顺数据

`spacex_wb/assets/strokes.js`取自hanzi-writer-data 2.0.1／Make Me a Hanzi的笔画中线；只保留示例所用字符的medians数组并包装为浏览器变量，不包括原始字形轮廓。该衍生数据沿用Arphic Public License，原文见同目录`ARPHICPL.TXT`，不属于本仓库MIT授权范围。

上游：https://github.com/chanind/hanzi-writer-data/tree/v2.0.1
原始数据项目：https://github.com/skishore/makemeahanzi
许可原文：https://github.com/chanind/hanzi-writer-data/blob/master/ARPHICPL.TXT
