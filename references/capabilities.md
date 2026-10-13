# 可选语音：配置、跳过与已有素材

**中文** · [English](en/capabilities.md)

本页说明可选语音：已有音频、macOS系统声音、火山复刻。图片通道见[图片能力指南](images.md)。配置共用一个外置文件；不会安装服务或插件。

## 使用前

只在任务需要语音时检查；无声动画直接进入画面流程。用户已给合适音轨就沿用，除非明确要求重新配音。仅音频任务不用启动动画设计或审片。

`S`表示本次实际读取的skill目录，不固定为作者机器或某个Agent专属目录。Claude Code、Codex、Kimi均按相同CLI调用，不依赖专属钩子。

```sh
python "$S/scripts/capabilities.py" status --explain
# 需要读取已信任项目的偏好时才加--project
python "$S/scripts/capabilities.py" status --project <项目> --explain
```

检查只读本工具配置、已选适配器的指定凭证来源和必要本地依赖，不联网验证。`configured_unverified`表示具备调用条件，不能说账户或音质已经验证；`needs_configuration`才需要选择声音方式，`prompt:false`表示用户曾选择手动配置，不主动再问。实际请求的成功以产物与回执为准。

首次缺配置时只问这次需要的一项：沿用录音、系统声音、自己的复刻，或跳过。用户已经指定时直接执行其选择；涉及新的云调用/付费/训练时使用本次已有授权，没有授权就说明缺口。不要要求用户把Key贴进聊天。

## 保存范围与跳过

普通选择只用于本次；用户说「以后/默认/记住」才保存为用户默认。普通配置位于安装目录外：macOS/Linux为`$XDG_CONFIG_HOME/huashu/media.json`（未设时`~/.config/huashu/media.json`），Windows为`%APPDATA%/huashu/media.json`。`HUASHU_CONFIG_HOME`可覆盖目录；`--config`替代默认用户文件。

Agent收集选择后生成非敏感JSON，再交脚本写入；脚本不会阻塞等待stdin交互。

```sh
# 示例JSON：{"preferences":{"voice":{"mode":"system"}}}
python "$S/scripts/capabilities.py" configure --scope user --input <选择.json>
python "$S/scripts/capabilities.py" skip --scope task  # 不落盘，本次跳过
python "$S/scripts/capabilities.py" skip --scope user  # 以后手动启用，不反复问
python "$S/scripts/capabilities.py" reset --field preferences.voice
python "$S/scripts/capabilities.py" reset --field onboarding.voice
```

「这次跳过」记录在本次任务状态，不能下一条动作又重开问卷。没有回答不是同意，也不执行configure。批处理缺必需配置时以非零退出码返回原因；只能在用户接受基础预览时交无声预览，不能把它叫完整口播成片。

偏好顺序：本次参数→项目偏好→用户偏好→公共默认。项目`<项目>/.huashu/media.json`只接受有限偏好与`deny`策略，不能放凭证、私人音色绑定或授予权限。`status --explain`标明字段来源；写入有跨进程锁，`--expected-revision`用于防止把基于旧配置的整份修改覆盖新配置。

## 三条声音路径

```sh
# 1. 复用已有音频，逐字节保留并生成元数据；若不需要复制，可直接引用原轨
python "$S/scripts/capabilities.py" use-audio --audio 原录音.wav --out <项目>/音频/口播.wav
# 2. 系统声音：仅macOS，固定48kHz WAV；中文默认从已安装普通话音色中选
python "$S/scripts/capabilities.py" say "要念的原文" --mode system --out <项目>/音频/口播.wav
# 3. 已配置并已授权的火山复刻
python "$S/scripts/capabilities.py" say "要念的原文" --mode clone --out <项目>/音频/口播.wav
# 旧调用保持兼容，共用同一套配置
python "$S/scripts/koubo.py" say "确认的补配台词" --out <项目>/音频/补配.wav \
  --fit 3.5 --match 原音轨.wav --match-ss 10 --match-t 3.5
```

不覆盖已存在输出。成功后写相邻`音频文件.json`，记录时长、采样率、SHA和来源；复刻记录请求模型，不冒称服务端回报的实际模型。原始PCM先以容器音频验收再导出s16le，采样率与单声道格式写进sidecar。系统音色不支持套用火山的模型和语速参数。

公共默认是「未选择声音方式」，不是作者音色。火山默认参数建议为expressive、还原模式、语速0；用户可在`provider_options.volcengine`调整。私人配置可保留不同的语速和音色。完整字段见`schemas/media.schema.json`，不要猜字段。

已有平台音色不用重训：

```sh
python "$S/scripts/capabilities.py" bind --name narrator --speaker-id S_xxx --default
```

bind只登记本地别名，不调用平台、不改原来的`~/.koubo/voices.json`、不自动开启云调用。`--default`只改变默认引用；生成方式仍需选clone。

## 火山配置与授权

凭证读取进程环境变量；也可在私人`bindings.volcengine.env_file`指定现有文件，或用`KOUBO_ENV`临时指定。环境变量优先；不自动遍历当前目录、家目录或作者工作区的.env。配置里保存变量名/文件引用，不保存Key值。

启用云复刻需要：`preferences.voice.mode=clone`、可解析音色，以及`policy.cloud`、`policy.paid_api`均为allow，或用户明确给过本次授权。`--allow-cloud`、`--allow-paid-api`只用于表达已有的本次授权，不作为工具绕过规则的办法，也不能覆盖deny。用户改变自己的禁止项时先明确改相应配置；宿主/组织限制仍有效。项目只能收紧，不能授权。

网络代理由私人`bindings.volcengine.trust_env`控制，公共默认遵从环境；不要把某台机器的代理故障经验强加给所有安装者。基础配置/已有音频只需Python标准库；音频验收需ffprobe，系统声音和拟合需ffmpeg，火山另需requests。缺依赖就报告，不自动安装。

训练是独立操作，需明确音色槽位和本次训练授权；`--force`只跳过低电平检查，不跳过授权。只有传`--default`才把训练结果设为登记表默认。

```sh
python "$S/scripts/koubo.py" train --audio 自己的录音.wav --speaker S_xxx --name 我的声音 \
  --allow-cloud --allow-paid-api --allow-voice-training
```

训练会改变远端音色。示例中的授权flags只有在用户实际同意后才可使用；不要把它当常规合成前置步骤。

## 验收与失败

拟合保留原有粗调+atempo，最多生成3次；每次可能计费。最终差异超过±0.05秒会返回失败并保留`.unfitted`候选，不冒称时长合格。合成必须收到服务端结束成功消息，近空、静音或错误响应不提交最终产物。网络超时可能已收单，标记结果不确定，不盲目重复请求。

正式片仍需逐字回读和专名试听；CLI不会自动做三候选听选或ASR。补配应检查接缝、字幕和画面时间轴；已使用video-pipeline时接它的贴回与字幕流程，独立用户也可使用自己的剪辑工程。

## 维护与进化

来源：2026-10-08，P0/P1能力配置实施。使用前读本页及相关API经验；接口的可复现故障先补测试再修代码。公共参数规律写本页或`口播API.md`，说明日期与适用范围；个人听选写私人配置/私有反馈，不能变成公共硬要求。纠正旧结论应改原文；升级配置不得清空偏好或自动启用新能力。
