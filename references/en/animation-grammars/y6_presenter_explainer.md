# Y6 · Presenter-led finance explainers

[中文](../../动画语法/y6_presenter_explainer.md) · **English**

A cartoon presenter connects information across paper, charts, and keywords. Suitable for business history, product mechanisms, and knowledge explainers with emotional reactions. Reference code lives in `scripts/engine/reference_films/spacex/spacex_lin/`; this is the ninth grammar card. It currently has no standalone parameterized clip and includes no character sprites.

## Pre-flight checklist

- Assign layouts in the storyboard first: side-on explanation, full-screen numbers, side-by-side comparison, the character entering a chart, and reaction close-ups. Do not keep the person on the left and the chart on the right for the whole film.
- Generate at least full-body and bust frames; sitting and leaning need actual matching pose frames.
- Explicitly set `x` and `s` in each segment's first `cast` keyframe to prevent regressions from state inherited across segments.
- Use `*=` for nested drawing opacity so the outer fade-out is preserved.
- Read the top-bar year, subtitles, and segment title from the same time source.
- Run `qa.py` text-boundary checks on the first version. For a finished film with a light background and no subtitles, also run `subzone_gate.py`.

## Frames and motion

The character uses AI-generated frames; code controls the foot anchor, position, size, and frame switching. Hard-cut between poses with a slight pop to avoid double images caused by dissolving different silhouettes. Switch talking and closed-mouth frames with the narration timing; stop mouth movement during pauses, and use complete gait frames for walking. Align pose heights to their median. Use bust assets for reaction close-ups rather than heavily enlarging a screenshot of the full frame.

Numbers settle when they are spoken in the narration. Do not show assertions such as "more than" or "+" prematurely during counting; emphasis circles appear after the number settles. Allow for the pause after a highlight during the script and narration stages.

## Reference implementation

`common.js` provides `presenterFrame`, `drawFigure`, `hud`, `yearAt`, `popK`, and `L.cast`. `prep_presenter.py` demonstrates frame slicing and foot anchors. The `transitions/lin_page.js` transition turns only the page; the presenter and top bar can remain continuous across pages.

Known limitations: characters obscuring text or being cropped by a push-in still need visual review. Full-frame bitmap push-ins in the reference code crop easily; prefer a scene camera for new films. Supply your own assets and narration; this card is not a complete finished-film template.
