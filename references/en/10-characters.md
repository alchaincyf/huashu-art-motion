# 10 · Characters: humans via AI-generated frames, code handles compositing

[中文](../10-角色.md) · **English**

When working with generated images or character artwork, first follow the [image capability guide](images.md) to select currently available tools or import existing assets; private character assets and platform choices are not set as defaults for all users.

## Implementation options

The same character can be implemented in three ways (side-by-side comparison of A and B: `assets/角色/花叔形象_对比.jpg`; C in action: see the Kurzgesagt and whiteboard demo films):

- **A — code-drawn**: only for motion white-models, animatics, and pure geometric symbols (blocks, terminal windows, and things that are inherently geometric). Human, anthropomorphic, robot, or anything with a face: do not code-draw these into finished films — see `references/en/character-detail.md` (character-detail).
- **B — paste from an existing frame library**: easy to maintain character consistency, but requires matching the frame library to the scene's art style.
- **C — generate action frames in the film's art style, then composite**: use a reference image to preserve identity; chroma-key, then hand off to code for motion and material control.

Human and anthropomorphic characters use B or C only; when done, check against the delivery criteria in `references/en/character-detail.md` (character-detail). Without image-generation capability, show only hands and back-views, or omit people entirely. Each style card lists known shortcomings for various character types.

## B: paste from an existing frame library

- Frame library: your own finalized character frames (e.g. wave, drag — 8 frames per action as transparent PNG; general-purpose action frames must be prepared by the user; three sets of character frames that ship with the long-scroll demo: `scripts/engine/demos/long_scroll/frames/`).
- Loaded as image assets at engine startup; rendering cycles frames with `floor(t*9)%8` — limited animation, no tweening.
- Anchored at the center of the foot; `face=-1` flips horizontally.
- Apply the current film's material treatment to the frames (Vox: add white paper-cut edge and drop shadow; brushstroke styles: run a fine-brushstroke pass over the frame with source-atop).

## C: generate a version in the art style

1. **Image generation**: use an image model that supports reference images (e.g. gpt-image — prompt tips at [huashu-gpt-image](https://github.com/alchaincyf/huashu-gpt-image)); run serially for batch generation. ref = three-view character sheet or master frame from the existing frame library; prompt must specify:
   - The style's **visual grammar** (not just "XX style"): Kurzgesagt solid shapes no outline, shadow one shade darker same hue; Vox black-and-white halftone newspaper photo + white paper-cut edge; whiteboard black marker line art + orange hatching; Monet short-stroke light patches…
   - **Pose and camera alignment** ("side-on facing right, arm extended pointing right"); for motion, output multiple frames as a sprite in one image (4×2 eight frames, frame count in the caption, "same character" to lock consistency, supply only key poses and let the model fill the in-betweens, "each frame centered at the bottom of its cell, consistent size").
   - Green screen `#00B140` (white hat + white T-shirt cannot use white background).
   - Fixed traits (using Huashu's appearance as example): **pure white** fisherman hat (models tend to render it light grey — write it explicitly), round-frame black glasses, white T-shirt, khaki shorts, white perforated shoes, black watch on left wrist, large head small body.
2. **Verification**: based on actual tool-call logs, input/output associations, and human visual inspection; PNG metadata does not prove which model generated the image. For asset integration, see the [image capability guide](images.md).
3. **Chroma key and frame splitting**: `scripts/key_split.py` (remove green spill, split by column; whiteboard line art uses `--white` — crop only, no keying, composite into the scene with multiply); use `scripts/key_green.py` when the original canvas coordinates need to be preserved.
4. **Compositing**: code only controls position, size, facing, frame-cycle timing, and material; interactive props (pebbles, ripples, items) are still code-drawn and aligned to the hand's position.

## When to still use code

In finished films: silhouettes, back-views, hands (drawn to match the art style), and things that are inherently geometric (blocks, terminal windows). Robots, chibi figures, stick-figure stories, and giving objects faces — these are discontinued; reasons and alternatives are in `references/en/character-detail.md` (character-detail). `lib/rig.js` girl/cat skeleton plus `rig_huashu.js` and `lib/toon.js` are kept: for motion reference (where are the hands, where are the feet — to set anchor points for AI frames), white-model animatics, and characters already finalized in style-demo films such as Art History Speedrun.
