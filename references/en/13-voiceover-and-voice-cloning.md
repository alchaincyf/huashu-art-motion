# 13 · Voiceover and Voice Cloning

[中文](../13-口播与语音复刻.md) · **English**

For the unified entry point and configuration see the [optional voice guide](capabilities.md); for interface details see the [voiceover API](voiceover-api.md).

Use existing recordings first; when new voiceover is needed, choose between system voice and a bound cloned voice based on the user's configuration. `scripts/koubo.py say/train/voices` keeps the old CLI entry points and shares the same out-of-install-directory config file as `scripts/capabilities.py`.

Each `say` call generates one clip — it does not automatically produce three candidates or run ASR. Supplemental recording retains `--fit/--match`; after generating, still verify the transcript, proper nouns, seams, and subtitles. Specific model, speech rate, voice, and licensing are not hard-coded in this document.
