# Maintenance and extension

[中文](CONTRIBUTING.md) · **English**

Public code and public recommendations live in the package; personal platforms, voices and credential references are kept outside the install directory. Don't turn personal experience into default authorization for everyone.

## Translations

Chinese documents remain the source; English references live under `references/en/`, with sibling `.en.md` files elsewhere. When changing documentation, update both versions and their reciprocal language links. Keep English links and reference paths pointed at English counterparts.

Use consistent terms: voiceover/narration, shot list, style recipe, animation grammar, frame-first, long-scroll film, gate, motif motion, signature transition, proven practices, finished film, frame library, art style, palette, and blue-purple. Translate completely; retain numbers, units, examples, and ordering.

Preserve executable code, commands, literal strings, parsed Chinese keys, and runtime filenames. Translate comments/docstrings without changing code, indentation, or line counts. Keep machine tokens quoted in comments and tool directives intact. The storyboard validator remains Chinese-keyed; English object/action wording needs manual review because its vocabulary checks are not fully bilingual.

## Local checks

```sh
python -m pip install requests Pillow
# ffmpeg/ffprobe must also be installed system-wide; they are not auto-installed when the skill activates
python -m unittest discover -s tests -v
```

Unit tests never call real voice/image generation services. For real host verification see the [compatibility record](references/en/compatibility.md). A new adapter must specify: configuration, probing, request and output contract, and failure behavior; you can't claim compatibility with another platform just by swapping base_url.

## Image tool bridge

Read the [image guide](references/en/images.md). The host provides the actual tool declarations, the agent makes the calls, and the CLI produces plans and verifies outputs. A receipt is not platform-signed provenance. Existing images, generation disabled, no tools, unknown billing, reference image permissions and generation failures all need coverage.

A standalone image API executor remains an optional extension; this version does not auto-install it, register accounts, or borrow other agents' logins.

## Preserve user config on update

The install directory may be replaced; the user's media.json must never be written into it. Old config gains new fields by merging with defaults; new capabilities default to unselected/unauthorized, and existing voices are never retrained or reset automatically. When a field's meaning changes, provide an explicit migration and rollback method.

## Release checks

After reviewing changes, stage this release's public files, then generate the file manifest:

```sh
python scripts/check_release.py manifest --repo .
git add release-manifest.json
python scripts/check_release.py check --repo . --ref INDEX
# After committing, check all outgoing commits; replace base with the actual remote baseline
python scripts/check_release.py check --repo . --ref HEAD --base origin/main
```

The check inspects Git objects, not just files on disk; credentials written in an intermediate commit and later deleted are also caught. The manifest only proves the reviewed file set matches; it does not replace code review, real media verification or license checks. Do not bypass the check or rewrite history to pass it off as a first release.

When reusing code, keep the original license boundaries of fonts, stroke-order data and character demos. Personal feedback stays in personal config; only methods and interface findings with reproducible evidence go into public docs, labeled with date, scope and verification status.
