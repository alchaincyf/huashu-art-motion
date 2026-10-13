# 兼容性与验证范围

**中文** · [English](en/compatibility.md)

验证日期：2026-10-08。以下区分安装/配置、宿主在线执行、实际媒体生成，不以一个层面的通过代替另一个。

## 安装与配置升级

在隔离Git工作区，用官方skills CLI实际执行`skills add <本地发布包> --skill huashu-art-motion --agent <宿主> --yes --copy`，每个目标连续安装两次。claude-code、codex、kimi-code-cli三个目标均成功，安装目录外media.json逐字节不变。这里验证的是覆盖式重装后的偏好保留，不冒称完整模拟了所有历史版本或所有安装器的update实现。

旧语音配置不需改写即可合并新默认字段；新增图片能力仍未选择、未授权。Codex安装副本的CLI读取了原system偏好和revision，未恢复为公共默认。

## 宿主在线运行

- Codex CLI 0.160.1：真实会话加载安装后的skill和指南，运行未配置状态、禁用生成、无工具、已有图片导入、私人system偏好保存；输出图片与源逐字节一致，配置来源符合预期。
- Claude Code 2.1.287：安装和本地CLI可用；在线会话因当前测试环境周配额返回429，未完成模型执行回归。不能据此标为在线通过，也不能据此判断Skill不兼容。
- Kimi Code CLI 0.38.0：安装和本地CLI可用；在线会话因当前测试账户访问权限返回403，未完成模型执行回归。该版本非交互`--prompt`不能同时带`--auto`或`--yolo`，重试命令已修正后仍为账户403。

这些会话使用隔离的工作区与媒体配置，复用本机既有登录；并非三个全新账号。Claude/Kimi账户条件恢复后仍需补跑在线用例。工具能力取决于实际会话，不能从宿主名称推断一定有生图。

## 实际媒体与自动测试

macOS系统声音和火山复刻已完成真实短句生成；当前Codex会话实际调用内置生图，得到带透明像素的1536×1024 PNG，并通过plan→工具调用→回执→项目复制与SHA验收。图片工具调用由Agent完成，CLI未代替调用。此测试只证明接入路径和文件属性，不代替美术质量判断。

自动测试覆盖配置合并、权限收紧、并发写入、旧PCM输出、未完成语音流、图片特性/计费选择、跨会话计划、配置撤销、图片并发替换和发布对象检查。CI在Linux上运行；真实系统声音仅验证macOS，Windows/Linux的系统声音后端尚未实现。

## 可复现的最低检查

```sh
python scripts/capabilities.py status --config <一个空JSON文件> --explain
python scripts/capabilities.py image-status --config <禁止生图的JSON> --mode generate
python scripts/capabilities.py use-image --file <现有PNG> --out <项目>/配图/新文件.png
python -m unittest discover -s tests -v
```

实际图片工具验证按images.md从当前工具schema形成快照；没有工具时明确返回unavailable，不能用虚构工具冒充成功。没有凭证或授权的CI不会调用付费媒体服务。
