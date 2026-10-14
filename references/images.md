# 可选图片：已有素材与当前Agent生图

**中文** · [English](en/images.md)

图片接入分两段：Agent观察当前工具、按用户授权调用；脚本解析选择、检查产物并保存到项目。脚本不模拟宿主工具、不借用其他Agent登录态，也不自动切换图片API。

## 先看任务，再看配置

已有图片直接用`use-image`导入。无须图片的代码动画跳过本页。新生图先读本次已加载规则中的明确偏好，再读本工具配置；用户已经要求生成时，按实际工具和既有授权执行，不再为填配置强行问一遍。

```sh
# S为本次实际加载的skill目录
python "$S/scripts/capabilities.py" image-status
python "$S/scripts/capabilities.py" use-image --file 原图.png --out <项目>/配图/素材.png
```

`preferences.image.mode`支持`unconfigured/off/existing/generate`，provider是当前工具的准确ID或auto。`off`是默认不生成的偏好，本次明确生成可覆盖；`policy.image_generation=deny`是禁止项，临时授权flags不能覆盖。将用户明确的「禁止」保存为policy，不只保存为mode。

首次缺配置时，只询问现有素材/允许当前工具生成/跳过。`skip --capability image --scope task`不落盘，`--scope user`表示长期手动启用。用户仅选择这次时不存成长期默认。既有语音配置升级后继续有效，新增图片能力保持未选择，不自动获准。

## 当前工具快照

Agent从当前会话已经暴露的工具清单（或宿主正式工具搜索）读取名称和schema，确认支持的操作，再写一份任务内快照。不能通过扫描Key、已安装skill或Agent名称推断。没有工具就写`tools: []`。

```json
{
  "host": "codex",
  "session_id": "本次任务唯一标识",
  "observed_at": 0,
  "tools": [{
    "id": "当前实际工具ID",
    "kind": "host",
    "operations": ["generate", "edit"],
    "reference_images": true,
    "transparent_background": true,
    "cost": "subscription",
    "network": "cloud"
  }]
}
```

示例不是能力声明：`observed_at`必须填写本次Unix时间，工具特性和ID必须来自本次实际schema；快照15分钟有效。host可为codex、claude-code、kimi、other，kind可为host或mcp。计费类型为subscription/paid_api/unknown/none；网络为cloud/local。订阅不代表无额度限制；不清楚计费时用unknown，不能填none。

三家宿主均走这份通用契约。某个Codex会话有image_gen，不代表所有Codex产品表面都有；Claude Code/Kimi若暴露合适MCP图片工具也可使用，若没有就导入现有图片或给出待制作素材说明。不得虚构这两家内置同名工具。

## 计划→宿主执行→验收

需求JSON：

```json
{
  "prompt": "用户确认的图片描述",
  "operation": "generate",
  "references": [],
  "transparent_background": true,
  "min_width": 512,
  "min_height": 512
}
```

改图用edit并提供参考文件；相对路径相对需求JSON。脚本验证参考图可解码并保存hash，之后变动会使旧计划失效。

```sh
python "$S/scripts/capabilities.py" image-plan --request 需求.json \
  --host-tools 当前工具.json --session 本次标识 --mode generate \
  --allow-image-generation --allow-cloud --out 执行计划.json
```

授权flags只表达用户已经给出的本次授权。云端参考图上传另需`--allow-reference-upload`；明确付费API需`--allow-paid-api`；未知计费需`--allow-unknown-image-cost`。长期允许可存入相应policy字段。项目只能设置deny，不能授予这些权利。禁止项先处理，多个已允许工具仍无法明确选择时返回needs_selection，不擅自猜平台。

拿到`host_action_required`后，Agent按该工具的真实schema调用；计划是语义要求，不是跨平台通用参数体。生成成功才写回执：

```json
{
  "status": "success",
  "plan_id": "执行计划中的ID",
  "session_id": "本次标识",
  "tool_id": "实际调用工具ID",
  "output_sha256": "实际输出文件SHA256"
}
```

保留实际工具调用记录作依据。回执是Agent提供的调用记录，不是平台签名认证；只读PNG元数据不能证明由哪个模型生成。

```sh
python "$S/scripts/capabilities.py" accept-image --plan 执行计划.json --receipt 回执.json \
  --host-tools 当前工具.json --session 本次标识 --file 宿主输出.png \
  --out <项目>/配图/正式素材.png --allow-image-generation --allow-cloud
```

验收重新核对当前授权、图片相关配置、工具、会话、参考图、文件hash、实际尺寸和透明像素。计划1小时有效；能力快照过期时先刷新，不能改旧计划假装仍有效。原图/旁车有任一存在时不覆盖；支持静态PNG/JPEG/WebP，需Pillow，工具不会自动安装。图片内容与参考身份仍要视觉核对，hash/尺寸不能代替看图。

通过后复制进项目并写相邻JSON，包含尺寸、透明性、SHA、工具ID、计划关联和`provenance: agent_reported_tool_call`。不要引用Agent缓存作为项目最终素材，也不要宣称已核实服务端未返回的模型名。

## 扩展与回流

添加图片API适配器时先选定真实供应商，再实现其鉴权、请求、输出和错误协议，并写成功/失败契约测试。一个自称OpenAI-compatible的URL不自动成为可用后端；本版没有通用API执行器或自安装器。现有MCP工具属于当前Agent工具通道，照其schema执行。

2026-10-08：P2建立选择→宿主动作→素材验收的接口。复用前读本页和供应商当前工具说明；遇到可重复失败补测试并修原逻辑，个人喜好只写私人配置。语音和图片各自启用，升级不会扩大已有授权。确定性验收与视觉质量结论分开记录。
