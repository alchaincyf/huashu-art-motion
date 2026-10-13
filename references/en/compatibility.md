# Compatibility and verification scope

[中文](../compatibility.md) · **English**

Verified: 2026-10-08. The sections below separate install/config, online host execution and actual media generation; passing one layer is not taken as passing another.

## Install and config upgrade

In an isolated Git workspace, the official skills CLI was actually run as `skills add <local release package> --skill huashu-art-motion --agent <host> --yes --copy`, installing twice in a row per target. All three targets (claude-code, codex, kimi-code-cli) succeeded, and the media.json outside the install directory stayed byte-for-byte unchanged. This verifies that preferences survive an overwrite reinstall; it does not claim to fully simulate every historical version or every installer's update implementation.

Old voice config merges in new default fields without being rewritten; the new image capability stays unselected and unauthorized. The CLI in the Codex install copy read the original system preference and revision and did not revert to public defaults.

## Online host runs

- Codex CLI 0.160.1: a real session loaded the installed skill and guides, and ran unconfigured status, generation disabled, no tools, existing-image import, and saving a private system preference. The output image was byte-identical to the source, and config sources were as expected.
- Claude Code 2.1.287: install and local CLI work; the online session returned 429 due to the test environment's weekly quota, so the model execution regression was not completed. This cannot be marked as an online pass, nor taken as evidence the skill is incompatible.
- Kimi Code CLI 0.38.0: install and local CLI work; the online session returned 403 due to the test account's access rights, so the model execution regression was not completed. This version's non-interactive `--prompt` can't be combined with `--auto` or `--yolo`; after correcting the retry command it still returned the account 403.

These sessions used isolated workspaces and media config, reusing existing logins on the machine; they were not three fresh accounts. Online cases for Claude/Kimi still need re-running once account conditions recover. Tool capability depends on the actual session; you can't infer from a host's name that it can generate images.

## Actual media and automated tests

macOS system voice and Volcengine cloning have produced real short phrases. The current Codex session actually called its built-in image generation, producing a 1536×1024 PNG with transparent pixels, which passed plan → tool call → receipt → project copy and SHA verification. The image tool call was made by the agent; the CLI did not make it on the agent's behalf. This test only proves the integration path and file properties; it does not replace an artistic quality judgment.

Automated tests cover config merging, permission tightening, concurrent writes, legacy PCM output, incomplete voice streams, image feature/billing selection, cross-session plans, config revocation, concurrent image replacement and release object checks. CI runs on Linux; real system voice is only verified on macOS, and Windows/Linux system voice backends are not yet implemented.

## Minimal reproducible checks

```sh
python scripts/capabilities.py status --config <an empty JSON file> --explain
python scripts/capabilities.py image-status --config <JSON that forbids image generation> --mode generate
python scripts/capabilities.py use-image --file <existing PNG> --out <project>/images/new_file.png
python -m unittest discover -s tests -v
```

Real image tool verification follows images.md, building a snapshot from the current tool schema; with no tools it clearly returns unavailable, and a made-up tool must never be used to fake success. CI without credentials or authorization never calls paid media services.
