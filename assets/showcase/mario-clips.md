# 花叔超级玛丽通关 · GIF片段

**中文** · [English](mario-clips.en.md)

从65.02秒成片《花叔超级玛丽通关》直接截取，保留显像管画面。这里只收录案例展示GIF，不包含该关卡的工程或完整视频。

- `mario-claude.gif`：00:06.30–00:11.80，5.5秒，800×450。会员选择→Claude星芒→变大。
- `mario-combo.gif`：00:28.60–00:32.60，4秒，640×360。踩敌人→踢球撞飞→顶碎砖块。
- `mario-pipe.gif`：00:17.00–00:24.70，7.7秒，640×360。钻管→金币密室→甩镜回到地面。

三段均保持原速，20fps，无声，无限循环；每段独立生成192色调色板，以Bayer抖动控制体积，再用`gifsicle -O3`做无损优化。循环在片段结束后回到开头，不是无缝循环。

导出示例（需要ffmpeg，自备原片）：

```sh
ffmpeg -ss 6.3 -t 5.5 -i input.mp4 -filter_complex "fps=20,scale=800:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff:max_colors=192[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle" -loop 0 mario-claude.gif
```

GIF中的花叔形象沿用仓库README中的示范用途限制。
