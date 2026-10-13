# Optional voice: configure, skip, and existing assets

[中文](../capabilities.md) · **English**

This page covers optional voice: existing audio, macOS system voices, and Volcengine voice cloning. For images see the [image capability guide](images.md). Configuration shares one external file; no services or plugins are installed.

## Before use

Only check when the task needs voice; silent animation goes straight to the visual workflow. If the user has already provided a suitable audio track, use it unless they explicitly ask for re-voicing. Audio-only tasks don't need to start animation design or film review.

`S` means the skill directory actually loaded for this run; it is not fixed to the author's machine or any agent-specific directory. Claude Code, Codex and Kimi all call the same CLI and don't depend on host-specific hooks.

```sh
python "$S/scripts/capabilities.py" status --explain
# Add --project only when you need to read preferences from a trusted project
python "$S/scripts/capabilities.py" status --project <project> --explain
```

The check only reads this tool's config, the credential source named by the selected adapter, and required local dependencies; it does not verify anything online. `configured_unverified` means the conditions for a call are met, not that the account or voice quality has been verified. Only `needs_configuration` requires choosing a voice method; `prompt:false` means the user chose manual configuration earlier, so don't ask again. Whether a real request succeeded is judged by its output and receipt.

When config is missing the first time, ask only about the one thing this task needs: use the recording, system voice, your own clone, or skip. If the user already specified, carry out that choice. For new cloud calls/paid use/training, use authorization already given for this run; if there is none, state the gap. Never ask the user to paste a key into chat.

## Save scope and skipping

An ordinary choice applies to this run only; save it as a user default only when the user says "from now on / default / remember". Ordinary config lives outside the install directory: on macOS/Linux at `$XDG_CONFIG_HOME/huashu/media.json` (`~/.config/huashu/media.json` when unset), on Windows at `%APPDATA%/huashu/media.json`. `HUASHU_CONFIG_HOME` overrides the directory; `--config` replaces the default user file.

After collecting choices, the agent writes non-sensitive JSON and hands it to the script to save; the script never blocks waiting for interactive stdin.

```sh
# Example JSON: {"preferences":{"voice":{"mode":"system"}}}
python "$S/scripts/capabilities.py" configure --scope user --input <choice.json>
python "$S/scripts/capabilities.py" skip --scope task  # not written to disk, skip for this run
python "$S/scripts/capabilities.py" skip --scope user  # enable manually later, don't keep asking
python "$S/scripts/capabilities.py" reset --field preferences.voice
python "$S/scripts/capabilities.py" reset --field onboarding.voice
```

"Skip this time" is recorded in this task's state; the next action must not reopen the questionnaire. No answer is not consent, and configure is not run. When a batch job lacks required config it exits non-zero with the reason. A silent preview may be delivered only if the user accepts a basic preview, and it must not be called a fully narrated film.

Precedence: this run's arguments → project preferences → user preferences → public defaults. The project file `<project>/.huashu/media.json` only accepts a limited set of preferences and `deny` policies; it cannot hold credentials, private voice bindings, or grant permissions. `status --explain` shows where each field came from. Writes use a cross-process lock, and `--expected-revision` prevents a whole-file edit based on stale config from overwriting newer config.

## Three voice paths

```sh
# 1. Reuse existing audio: kept byte-for-byte with metadata generated; if no copy is needed, reference the original track directly
python "$S/scripts/capabilities.py" use-audio --audio original.wav --out <project>/audio/narration.wav
# 2. System voice: macOS only, fixed 48 kHz WAV; for Chinese, picks from installed Mandarin voices by default
python "$S/scripts/capabilities.py" say "text to speak" --mode system --out <project>/audio/narration.wav
# 3. A configured and authorized Volcengine clone
python "$S/scripts/capabilities.py" say "text to speak" --mode clone --out <project>/audio/narration.wav
# Legacy calls stay compatible and share the same config
python "$S/scripts/koubo.py" say "confirmed pickup line" --out <project>/audio/pickup.wav \
  --fit 3.5 --match original_track.wav --match-ss 10 --match-t 3.5
```

Existing outputs are never overwritten. On success an adjacent `audio_file.json` is written recording duration, sample rate, SHA and source; clones record the requested model and don't claim to be the actual model the server reported. Raw PCM is first verified as container audio, then exported as s16le, with sample rate and mono format written into the sidecar. System voices do not accept Volcengine's model and speed parameters.

The public default is "no voice method selected", not the author's voice. Recommended Volcengine defaults are expressive, restore mode, speed 0; users can adjust them under `provider_options.volcengine`. Private config may keep a different speed and voice. See `schemas/media.schema.json` for the full fields; don't guess field names.

Existing platform voices don't need retraining:

```sh
python "$S/scripts/capabilities.py" bind --name narrator --speaker-id S_xxx --default
```

bind only registers a local alias: it doesn't call the platform, doesn't modify the existing `~/.koubo/voices.json`, and doesn't enable cloud calls automatically. `--default` only changes the default reference; the generation method must still be set to clone.

## Volcengine config and authorization

Credentials are read from process environment variables; alternatively, point private `bindings.volcengine.env_file` at an existing file, or set `KOUBO_ENV` temporarily. Environment variables take precedence. The current directory, home directory and author workspace are never scanned for .env files. Config stores variable names/file references, never key values.

Enabling cloud cloning requires `preferences.voice.mode=clone`, a resolvable voice, and `policy.cloud` and `policy.paid_api` both set to allow, or explicit authorization from the user for this run. `--allow-cloud` and `--allow-paid-api` only express authorization already given for this run; they are not a way to bypass rules and cannot override deny. When users change their own prohibitions, change the corresponding config explicitly first; host/organization restrictions still apply. Projects can only tighten, never authorize.

Network proxy behavior is controlled by private `bindings.volcengine.trust_env`; the public default follows the environment. Don't impose one machine's proxy troubleshooting on every installer. Basic config and existing audio need only the Python standard library; audio verification needs ffprobe, system voice and fitting need ffmpeg, Volcengine also needs requests. Missing dependencies are reported, never installed automatically.

Training is a separate operation and needs an explicit voice slot and authorization for this training run; `--force` only skips the low-level check, not authorization. Only passing `--default` makes the trained result the registry default.

```sh
python "$S/scripts/koubo.py" train --audio my_recording.wav --speaker S_xxx --name my_voice \
  --allow-cloud --allow-paid-api --allow-voice-training
```

Training changes the remote voice. The authorization flags in the example may be used only after the user has actually agreed; don't treat this as a routine prerequisite for synthesis.

## Verification and failure

Fitting keeps the existing coarse adjustment + atempo and generates at most 3 times; each attempt may be billed. If the final difference exceeds ±0.05 s it returns failure and keeps the `.unfitted` candidate, never claiming the duration passed. Synthesis must receive the server's final success message; near-empty, silent or error responses are not committed as final output. A network timeout may still have been accepted server-side, so the result is marked uncertain and the request is not blindly repeated.

Final films still need a word-by-word read-back and a listen for proper nouns; the CLI does not automatically do three-candidate listening or ASR. Pickups should be checked for seams, subtitles and the picture timeline; if video-pipeline is in use, plug into its paste-back and subtitle flow, and standalone users can use their own editing project.

## Maintenance and evolution

Source: 2026-10-08, P0/P1 capability config implementation. Read this page and the relevant API notes before use; for reproducible interface failures, add a test first, then fix the code. Public parameter rules go on this page or in `口播API.md` with date and scope; personal listening preferences go in private config/private feedback and must not become public hard requirements. Correct outdated conclusions by editing the original text; config upgrades must not wipe preferences or enable new capabilities automatically.
