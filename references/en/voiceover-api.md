# Volcengine Doubao Voice Cloning 2.0 · API Details and Measured Results

[中文](../口播API.md) · **English**

Historical API records from 2026-09-13; query-endpoint entries updated 2026-09-18. New users: configure via `capabilities.md` first. Service limits are as reported by the live API at call time. Official docs: Volcengine Documentation Center, "Doubao Voice" library (LibraryID 6561).

## Authentication

Legacy console (APP ID + Access Token):

```
X-Api-App-Id:      {APPID}
X-Api-Access-Key:  {Access Token}
X-Api-Resource-Id: volc.megatts.voiceclone   # training / query
                   seed-icl-2.0              # synthesis
X-Api-Request-Id:  {uuid}
Content-Type:      application/json
```

The new console switched to `X-Api-Key` (obtained from the API Key management page). Volcengine has announced that the legacy version will be gradually retired.

## Three endpoints

| Purpose | Path |
|---|---|
| Train a voice | `POST /api/v3/tts/voice_clone` |
| Query status | `POST /api/v3/tts/get_voice` |
| Synthesize | `POST /api/v3/tts/unidirectional` (HTTP chunked streaming) |

Host is always `https://openspeech.bytedance.com`.

### Training

```json
{
  "speaker_id": "S_xxxxxxxx",
  "audio": { "data": "<base64>", "format": "wav" },
  "source": 2,
  "language": 0,
  "model_type": 5
}
```

- **`model_type: 5` is required for Cloning 2.0.** Omitting it or passing another value trains a 1.0 model.
- **The request body takes a single `audio` object, not an `audios` array.** The v1 API used an array; v3 changed this. Passing an array returns `45000000 add unmapped key audios`.
- Optional: `text` (reference transcript for server-side WER validation — a large mismatch returns `45001109`), `enable_audio_denoise` (denoising, reduces similarity), `disable_volume_normalization` (disables volume normalization, synthesis volume stays closer to the reference audio).
- Returned `status`: 0 NotFound / 1 Training / 2 Success / 3 Failed / 4 Active. **Both 2 and 4 can synthesize immediately.**
- The returned `speaker_status` is an array containing both the 1.0 and 2.0 versions; the entry with `model_type: 5` is the 2.0 version; each carries a one-hour-valid `demo_audio` preview link.

### Query (tested 2026-09-18)

The v3 `get_voice` request body uses the singular form `{"speaker_id":"S_xxxxxxxx"}`, not a `speaker_ids` array. Query slots one at a time; HTTP errors must be explicitly surfaced — they must not be treated as "voice not found." `koubo.py voices` has been corrected accordingly.

### Synthesis

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

The response is streaming; each line is a JSON object; audio is in the `data` field as base64 chunks — concatenate them for the complete file.

## Two counter-intuitive parameter locations

1. **`speech_rate` must go inside `audio_params`.** Placing it at the `req_params` top level is **silently ignored** — no error, HTTP 200, audio produced normally, but speech rate is unchanged. Measured: `audio_params.speech_rate = -50` changed the same sentence from 10.36 s to 21.53 s (exactly 2×). Range `[-50, 100]`, default 0; 100 = 2.0× speed, -50 = 0.5× speed, linear. `speed_ratio` (wherever placed) is also silently ignored — that is a different product line's parameter name.

2. **`tone_fidelity` goes at the `req_params` top level**, not inside `audio_params`. Only effective for 2.0 voices.

## Sample rate

`sample_rate` supports `[8000, 16000, 22050, 24000, 32000, 44100, 48000]`; **default is 24000 only**. For a 48k editing project, always pass 48000 explicitly — otherwise the audio sounds muffled. `ogg_opus` only supports 48000. For streaming, Volcengine recommends pcm over wav.

## Other limits

- Reference audio **10 MB limit is on the raw file, not the base64-encoded size** (measured: a 9.16 MB wav passes).  Supported formats: wav / mp3 / ogg / m4a / aac / pcm (pcm: 24k mono only).
- Synthesis text: recommended < 300 characters per call (about 60 s of audio); split longer texts and concatenate.
- Each voice slot has 15 training uses; re-training with the same slot ID overwrites.
- The "voice upgrade" endpoint (`/api/v3/tts/upgrade_voice`) only migrates V1→V3 — **it cannot append new reference audio to an existing voice.** To change the reference audio, re-train using the same slot ID.

## Common error codes

| Code | Meaning | Fix |
|---|---|---|
| `45000000` | Wrong request body field | Check `message` for the unmapped key |
| `45001122` | `no speaker detected` | No human voice in reference audio. Check average level; below −36 dB is usually just noise |
| `45001109` | `WERError` | The `text` field does not match the audio content; remove `text` or correct it |
| `45000030` | `resource not granted` | The service for this Resource-Id has not been activated |

## Network

`openspeech.bytedance.com` is a mainland-China endpoint. If the local machine has a SOCKS proxy running, **passing `proxies=None` to `requests` is not enough** — it still reads `ALL_PROXY` from the environment, manifesting as intermittent `SSL: UNEXPECTED_EOF_WHILE_READING`. In affected environments, configure `bindings.volcengine.trust_env=false`; the default follows the system proxy and does not bypass it for all users.

## On reference audio length

From historical listening tests, a longer clean voiceover reference sounds closer to the original voice than a thirty-second clip. This is the experience of one specific voice, not a universal default for all voices; use your own samples for listening tests and follow current service limits.

One duration-ladder test was conducted (15/30/60/120/200/400 s nested sampling, 3 synthesis runs per level), comparing fundamental-frequency median and spectral centroid against the real voice. Variation across levels (1.7%–8.5%) and within-level standard deviation across the three runs (1.7–9.5) are the same order of magnitude — **indistinguishable on these two metrics.**

This is not a refutation — these two metrics only cover pitch and brightness of timbre, and **completely miss rhythm, pauses, breath, and intonation**, which are the primary components of "sounds like the real person." Unmeasurable difference does not mean no difference. Trust your ears.
