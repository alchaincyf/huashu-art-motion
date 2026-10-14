# Full Narrated Films and Feedback Loop

[中文](../12-口播整片与经验回流.md) · **English**

This page covers general methods for producing full narrated (voiceover-driven) films; it does not include the author's private feedback archive. For segment interfaces see doc 09, characters see doc 10, the long-scroll demo see doc 11.

## From voiceover to picture

Confirm the script, voiceover, and word-level timing before building the style table and highlight list. Cue actions to keywords (e.g. `TM.cue` in the reference code) rather than hard-coding every timestamp. The camera follows the content's outer bounds; the subtitle zone is a constraint in camera space and must remain clear even when pushing in.

Whiteboard content accumulates on one large canvas; the first stroke of each block syncs with the camera reaching its position, and within the block each stroke follows the speech rate. After calling `const B = DG.board(...)` to create a board, use `B.line(points, {smooth:false})` for rectangles to avoid smooth splines bowing out into ellipses. For a complete list, reading time starts when the last item finishes rendering — drawing time must not count as readable hold time.

Vox collage: establish objects, relationships, and camera first; add paper texture and decoration after. For presenter-explainer films, plan varied layouts and shot sizes up front — repositioning the character in post cannot compensate for monotonous shot design.

## Review and freeze

`qa.py` checks determinism, efficiency, motion, smoothness, and text-frame clues. Frame-gate checks for text clipping, overlapping text, subtitle zone, and near-blank frames; decorative large text may produce false positives — check the corresponding frame. For light-background finished films, run `subzone_gate.py` as a supplemental check for graphics entering the subtitle band; this dark-pixel threshold is not suitable for textured backgrounds.

Before delivery, an agent with no involvement in production reviews the film independently; for long films, at least two such reviewers. Issues are logged with timecode, root cause, change made, and re-verification; regressions of old issues and new discoveries are tracked separately. Accept based on specific issues — don't chase a total score. If the same class of issue appears three rounds in a row and neither of two fixes works, go back to the assets or the engine capability. Upstream script issues go back to the script.

Once the user approves, freeze code, timeline, mix, and subtitles simultaneously. Candidate finished films and the frozen version are saved in the project; do not overwrite without confirmation.

## How experience flows back to the skill

Each round: record phenomenon → root cause → fix → verification → destination. Style-specific issues go into the corresponding grammar card; cross-style methods go into doc 09; machine-measurable items go into QA. Recurring pitfalls are distilled into a pre-flight checklist; once an issue becomes an engine capability, reduce the text rule. After changes, have an independent agent verify, and log in CHANGELOG.

Private feedback for the project, personal appearance prompts, and unpublished assets stay in the project; the public skill only collects reusable methods and necessary evidence.
