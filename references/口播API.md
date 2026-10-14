# 火山豆包声音复刻 2.0 · 接口细节与实测记录

**中文** · [English](en/voiceover-api.md)

历史接口记录来自2026-09-13，查询段更新于2026-09-18；新用户先按capabilities.md配置，服务限制以调用时实际响应为准。官方文档：火山引擎文档中心「豆包语音」库（LibraryID 6561）。

## 鉴权

旧版控制台（APP ID + Access Token）：

```
X-Api-App-Id:      {APPID}
X-Api-Access-Key:  {Access Token}
X-Api-Resource-Id: volc.megatts.voiceclone   # 训练 / 查询
                   seed-icl-2.0              # 合成
X-Api-Request-Id:  {uuid}
Content-Type:      application/json
```

新版控制台改用 `X-Api-Key`（API Key 管理里拿）。旧版官方说会逐步下线。

## 三个接口

| 用途 | 路径 |
|---|---|
| 训练音色 | `POST /api/v3/tts/voice_clone` |
| 查询状态 | `POST /api/v3/tts/get_voice` |
| 合成 | `POST /api/v3/tts/unidirectional`（HTTP chunked 流式） |

Host 一律 `https://openspeech.bytedance.com`。

### 训练

```json
{
  "speaker_id": "S_xxxxxxxx",
  "audio": { "data": "<base64>", "format": "wav" },
  "source": 2,
  "language": 0,
  "model_type": 5
}
```

- **`model_type: 5` 才是复刻 2.0。** 不传或传别的值会训成 1.0。
- **请求体是单个 `audio` 对象，不是 `audios` 数组。** v1 接口用数组，v3 改了；
  传数组会报 `45000000 add unmapped key audios`。
- 可选：`text`（参考音频对应文本，服务端做 WER 校验，差太多返回 `45001109`）、
  `enable_audio_denoise`（降噪，会损失相似度）、
  `disable_volume_normalization`（关音量归一化，合成音量更贴参考音频）。
- 返回 `status`：0 NotFound / 1 Training / 2 Success / 3 Failed / 4 Active。
  **2 和 4 都可以直接合成。**
- 返回里 `speaker_status` 是个数组，同时含 1.0 和 2.0 两版；
  `model_type: 5` 那条才是 2.0，各自带一个一小时有效的 `demo_audio` 试听链接。

### 查询（2026-09-18实测）

v3 `get_voice`请求体使用单数`{"speaker_id":"S_xxxxxxxx"}`，不是`speaker_ids`数组。多个槽逐个查，HTTP错误必须显式报出，不能当成音色不存在。`koubo.py voices`已按此修正。

### 合成

```json
{
  "user": { "uid": "koubo" },
  "req_params": {
    "text": "...",
    "speaker": "S_xxxxxxxx",
    "model": "seed-tts-2.0-expressive",
    "tone_fidelity": true,
    "audio_params": { "format": "wav", "sample_rate": 48000, "speech_rate": -20 }
  }
}
```

响应是流式的，每行一个 JSON，音频在 `data` 字段里按 base64 分片，拼起来就是完整文件。

## 两个反直觉的参数位置

1. **`speech_rate` 必须放在 `audio_params` 里。** 放 `req_params` 顶层会被**静默忽略**——
   不报错，返回 200，音频正常，但语速纹丝不动。
   实测 `audio_params.speech_rate = -50` 让同一句从 10.36s 变 21.53s（正好 2 倍）。
   取值 `[-50, 100]`，0 默认，100 = 2.0 倍速，-50 = 0.5 倍速，线性。
   同样被静默忽略的还有 `speed_ratio`（无论放哪层）——那是别的产品线的参数名。

2. **`tone_fidelity` 放 `req_params` 顶层**，不在 `audio_params` 里。仅 2.0 音色生效。

## 采样率

`sample_rate` 支持 `[8000, 16000, 22050, 24000, 32000, 44100, 48000]`，**默认只有 24000**。
贴回 48k 剪辑工程一定要显式传 48000，否则听感发闷。
`ogg_opus` 只支持 48000。流式场景官方建议用 pcm，不建议 wav。

## 其他限制

- 参考音频 **10MB 上限算的是原始文件，不是 base64 后**（实测 9.16MB 的 wav 能过）。
  支持 wav / mp3 / ogg / m4a / aac / pcm，pcm 仅 24k 单声道。
- 合成文本单次建议 < 300 字（约 60 秒音频），长文要自己切分再拼。
- 音色槽位每个 15 次训练机会，可重复覆盖训练。
- 「音色升级」接口（`/api/v3/tts/upgrade_voice`）只是 V1→V3 迁移，
  **不能给已有音色追加参考音频**。想换参考音频只能拿同一个槽位重训。

## 常见错误码

| 码 | 含义 | 怎么办 |
|---|---|---|
| `45000000` | 请求体字段不对 | 看 message 里的 unmapped key |
| `45001122` | `no speaker detected` | 参考音频里没人声。先查平均电平，低于 -36dB 基本就是底噪 |
| `45001109` | `WERError` | 传的 `text` 和音频内容对不上，去掉 text 或改准 |
| `45000030` | `resource not granted` | 这个 Resource-Id 对应的服务没开通 |

## 网络

`openspeech.bytedance.com` 是国内接口。如果本机开着 socks 代理，
**光给 requests 传 `proxies=None` 挡不住**——它仍会读环境里的 `ALL_PROXY`，
表现为间歇性 `SSL: UNEXPECTED_EOF_WHILE_READING`。
受影响环境可配置`bindings.volcengine.trust_env=false`；默认遵从环境代理，不对所有用户强制绕过。

## 关于「参考音频要喂多长」

历史听选中，较长的干净口播参考比三十秒更像原声。这是单一声音的经验，不是所有音色的统一默认；以用户自己的样本试听和当前服务限制为准。

我这边做过一次时长梯度实测（15/30/60/120/200/400 秒嵌套取样，每档合成 3 次），
用基频中位数和频谱质心跟真人原声比，各档差异（1.7%~8.5%）和同一档三次之间的
标准差（1.7~9.5）是同一量级，**在这两个指标上分不出高下**。

但这不构成反驳——这两个指标只覆盖音色的音高和明暗，
**完全不覆盖韵律、停顿、气口、语气**，而那些恰恰是「听起来像不像本人」的主要成分。
指标测不出差异，不等于没有差异。以耳朵为准。
