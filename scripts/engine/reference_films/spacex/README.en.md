# SpaceX Voiceover Animation — Reference Code

[中文](README.md) · **English**

Scene-code snapshots covering four styles of expression: mixed-style, whiteboard, Vox collage, and presenter. Use these to learn and adapt shot patterns, keyword time-anchors, and layout methods. This is not a complete, out-of-the-box renderable project, and does not represent the full production of the latest published finished film.

- `spacex/tm.js`: `TM.cue(segment, 'source-text substring')` attaches actions to voiceover keywords; `timing.js` holds the timing data for this example — replace it when working on new material.
- `spacex_wb/common.js`: content framing `fit/declip/shot`, stroke scheduling `build`, reveal by stroke order `so/soAt`.
- `spacex_vox/common.js`: cumulative desktop `item/drawWorld/camEnd`, insert shots, occlusion registration.
- `spacex_lin/common.js`: presenter frame-swap, foot anchor, cross-segment pose and top bar; `tools/prep_presenter.py` demonstrates green-screen frame extraction.
- `eras_*.js`: segment tables for the four styles; `transitions/`: matching transitions.

## Usage boundaries

1. First copy the parent `scripts/engine/` directory into your own project, then place the selected film directories, segment tables, and transitions from here into the corresponding positions at the project root. Keep the whiteboard segment-table filename as `eras_wbx.js`; all actual asset paths should be `spacex_wb/`.
2. Presenter sprites, mixed-style character frames, source image prompts, and voiceover audio are not distributed with this snapshot. `presenter_meta.js` provides only the frame-table structure; you need to regenerate assets and metadata with your own character. An existing frame table does not imply the assets exist.
3. Fonts follow the parent project's `lib/fonts.js` and the bundled fonts; the Vox body text and typewriter numerals have been switched to the bundled LXGW WenKai (霞鹜文楷) and CMU respectively to avoid missing-font issues. The pre-processing scripts require `numpy` and `Pillow`; to run `make_hand.py` you must first prepare your own `hand_raw_1.png` through `hand_raw_3.png` in its directory.
4. The example text and numbers here are historical production material, not current SpaceX facts for direct quotation. New works must verify their own scripts and rebuild the voiceover timeline.
5. If you just want to run a complete demo, use the parent `demos/` or `clips/` directories — do not start from this directory.

## Third-party stroke-order data

`spacex_wb/assets/strokes.js` is derived from hanzi-writer-data 2.0.1 / Make Me a Hanzi stroke medians. Only the `medians` arrays for the characters used in the example are kept, wrapped as a browser variable; the original glyph outlines are not included. This derived data is distributed under the Arphic Public License; the full text is in `ARPHICPL.TXT` in the same directory and is not covered by the MIT license of this repository.

Upstream: https://github.com/chanind/hanzi-writer-data/tree/v2.0.1
Original data project: https://github.com/skishore/makemeahanzi
License text: https://github.com/chanind/hanzi-writer-data/blob/master/ARPHICPL.TXT
