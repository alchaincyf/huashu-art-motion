# Optional images: existing assets and current-agent image generation

[中文](../images.md) · **English**

Image integration has two halves: the agent observes the current tools and calls them per the user's authorization; the script resolves choices, checks outputs and saves them into the project. The script does not simulate host tools, borrow other agents' logins, or switch image APIs automatically.

## Task first, then config

Import existing images directly with `use-image`. Code animations that need no images skip this page. For new generation, first read explicit preferences in the rules loaded for this run, then this tool's config; if the user has already asked for generation, proceed with the actual tools and existing authorization, without asking again just to fill in config.

```sh
# S is the skill directory actually loaded for this run
python "$S/scripts/capabilities.py" image-status
python "$S/scripts/capabilities.py" use-image --file original.png --out <project>/images/asset.png
```

`preferences.image.mode` supports `unconfigured/off/existing/generate`; provider is the exact ID of the current tool, or auto. `off` is a preference not to generate by default, which an explicit request for this run can override; `policy.image_generation=deny` is a prohibition that temporary authorization flags cannot override. Save a user's explicit "forbid" as policy, not just as mode.

When config is missing the first time, only ask: existing assets / allow the current tool to generate / skip. `skip --capability image --scope task` is not written to disk; `--scope user` means enable manually long-term. If the user only chose for this run, don't save it as a long-term default. Existing voice config remains valid after upgrade; the new image capability stays unselected and is not automatically permitted.

## Current tool snapshot

The agent reads names and schemas from the tool list already exposed in the current session (or the host's official tool search), confirms supported operations, then writes an in-task snapshot. Do not infer it by scanning keys, installed skills or agent names. With no tools, write `tools: []`.

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

Chinese example strings are preserved verbatim: the session ID is unique to this task and the tool ID is the actual current tool ID.

The example is not a capability declaration: `observed_at` must be the current Unix time, and tool features and IDs must come from this run's actual schema; a snapshot is valid for 15 minutes. host can be codex, claude-code, kimi or other; kind can be host or mcp. Cost is subscription/paid_api/unknown/none; network is cloud/local. Subscription does not mean unlimited quota; if billing is unclear use unknown, never none.

All three hosts use this same generic contract. One Codex session having image_gen doesn't mean every Codex product surface does; Claude Code/Kimi may use a suitable MCP image tool if one is exposed, otherwise import existing images or write a to-be-made asset brief. Never invent same-named built-in tools for those two hosts.

## Plan → host executes → verify

Request JSON:

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

The prompt placeholder means the image description confirmed by the user. For edits use edit and supply reference files; relative paths are relative to the request JSON. The script verifies reference images decode and stores their hashes; later changes invalidate the old plan.

```sh
python "$S/scripts/capabilities.py" image-plan --request request.json \
  --host-tools current_tools.json --session this_session_id --mode generate \
  --allow-image-generation --allow-cloud --out plan.json
```

Authorization flags only express authorization the user has already given for this run. Uploading reference images to the cloud also needs `--allow-reference-upload`; explicitly paid APIs need `--allow-paid-api`; unknown billing needs `--allow-unknown-image-cost`. Long-term permission can be stored in the matching policy field. Projects can only set deny, never grant these rights. Prohibitions are handled first; if several allowed tools still can't be chosen between, it returns needs_selection rather than guessing a platform.

After receiving `host_action_required`, the agent calls the tool according to its real schema; the plan is a semantic requirement, not a cross-platform parameter body. Write a receipt only when generation succeeds:

```json
{
  "status": "success",
  "plan_id": "执行计划中的ID",
  "session_id": "本次标识",
  "tool_id": "实际调用工具ID",
  "output_sha256": "实际输出文件SHA256"
}
```

The receipt placeholders mean the plan ID, this session ID, actual tool ID, and actual output file SHA256 respectively. Keep the actual tool call record as evidence. The receipt is a call record supplied by the agent, not a platform-signed attestation; PNG metadata alone cannot prove which model produced an image.

```sh
python "$S/scripts/capabilities.py" accept-image --plan plan.json --receipt receipt.json \
  --host-tools current_tools.json --session this_session_id --file host_output.png \
  --out <project>/images/final_asset.png --allow-image-generation --allow-cloud
```

Verification re-checks current authorization, image-related config, tool, session, reference images, file hash, actual dimensions and transparent pixels. A plan is valid for 1 hour; if the capability snapshot has expired, refresh it first; don't edit an old plan to pretend it's still valid. If the target image or its sidecar already exists, nothing is overwritten. Static PNG/JPEG/WebP are supported and need Pillow, which the tool won't install automatically. Image content and reference identity still need a visual check; hash/dimensions don't replace looking at the picture.

Once accepted, the image is copied into the project with an adjacent JSON containing dimensions, transparency, SHA, tool ID, plan link and `provenance: agent_reported_tool_call`. Don't reference the agent's cache as the project's final asset, and don't claim a model name the server didn't return.

## Extension and feedback

When adding an image API adapter, pick a real provider first, then implement its auth, request, output and error protocol, and write success/failure contract tests. A URL claiming to be OpenAI-compatible doesn't automatically become a usable backend; this version has no generic API executor or self-installer. Existing MCP tools belong to the current agent's tool channel; follow their schema.

2026-10-08: P2 established the choose → host action → asset verification interface. Before reuse, read this page and the provider's current tool docs; for reproducible failures add a test and fix the original logic; personal taste goes only into private config. Voice and image are enabled separately, and upgrades never widen existing authorization. Deterministic verification and visual quality conclusions are recorded separately.
