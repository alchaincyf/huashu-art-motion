# 03 · Frame-first, then animate: four routes

[中文](../03-一帧先行四条路线.md) · **English**

When the work involves image generation or character art, first consult the [image capability guide](images.md) to choose currently available tools or import existing assets; private character assets and platform choices are not treated as defaults for all users.

Huashu's method: design one artistically resolved frame first, then animate it. All four routes below were run in a single project on 2026-10-04; each has its own ideal context.

| Route | Who draws the picture | Who does the motion | Tested | When to use |
|---|---|---|---|---|
| **A Pure code** | Canvas procedural drawing + style renderer | Code (choreography curves, IK, particles, boiling lines) | Art History replication main line (Huashu's choice) | To prove "model produces art animation directly in code"; to control every element's motion precisely; to switch dozens of styles (swap renderer = swap style); to sync frame-accurately with voiceover |
| **B AI layered assets + code motion** | Image model draws per layer (green screen, preserving original-frame coordinates) | Code (translation, arcs, squash, physics, effects) | 2026 ending segment — 11 assets composited in one pass | When the highest image quality is required, character performance is complex; the style is realistic/illustration and code cannot draw it |
| **C Video model first-and-last frame** | Image model draws one frame | Seedance first-and-last-frame (same image for both) | Lovart Seedance 2.0 Van Gogh test: girl sets cup down and lifts it again, stars rotate, cat swishes tail, composition held throughout | For organic "the whole painting is flowing" feel without precise control; illustrative / atmosphere shots |
| **D Mixed** | Background via B/C, character via A, or reverse | Code orchestrates the timeline | — | Feature film: background needs texture, character needs controllability |

## Shared first step: a key-frame design sheet

Regardless of route, start with one "right frame":
- **With reference footage**: feed the "last frame before the transition starts" from the reference footage to gpt-image as a reference image; write the prompt as "keep the composition, camera angle, position and size of every object, colour palette and brushwork of the reference image exactly; change only two things: …". Tests show that 50% opacity overlap with the original is nearly pixel-perfect — composition locking comes from the reference image, not from writing coordinates in text.
- **Without reference footage**: design the composition for the subject first (what is the subject, where in frame, where does the camera move), then render a rough and use that as the reference image. Only speedrun/traversal films define a single fixed scene skeleton first (standard composition coordinates), with all segments aligned to it.
- **Three-direction hard gate**: character interpretation (this film: period costumes / same person across eras / original character with head swap) — render three variants of the same frame and let the director choose. Use the frame with the original film's male character; the difference is most pronounced there.

Pitfalls on the design sheet (all encountered):
- Writing a minor character (age 17) plus any mention of a "short skirt" triggers a sexual-content rejection of the entire image. Always write long garments and add "modest clothing".
- Describe fur markings down to body part: "orange-and-white cat (orange tabby stripes on head, back and tail; white on muzzle, chest, belly and all four paws)". Writing just "orange cat" produces a fully orange body.
- Writing an action in the description ("lifting a cup to drink") overrides the pose in the reference image. To keep the original pose, write only "keep the hand gesture in the reference image".
- For text that needs to move (year counter, title) ask the model to "remove it, leave a clean background"; have code draw it. Decorative text inside the scene: write each character explicitly in the prompt.
- Batch image generation runs serially; provenance is established by actual tool-call records, input/output pairing, and manual visual verification; PNG metadata does not prove which model produced an image. See the [image capability guide](images.md) for how assets are ingested.

## Route B key: green-screen assets preserve original-frame coordinates

Use the design frame as the reference image. Prompt: "Draw only the XX in the reference image … everything else is solid flat #00FF00 with no shadows, ground, or text. Position, size, and orientation exactly match the reference image." The character generated already stands at its original-frame coordinates. When keying, **do not crop to the subject's bounding box and discard the coordinates** — `scripts/key_green.py` trims edges while writing the top-left corner into `sprites.json`; compositing pastes back at the original coordinates, aligned in one step.

## Route C key: same frame for first and last

Seedance 2.5/2.0 supports frames2video. Give the same design frame for both first and last frame → everything in the painting animates and returns to the original composition; the clip's start and end connect seamlessly to transitions. Prompt structure: ① camera completely fixed (no push, pull, pan, zoom, or shake) ② maintain composition/style/palette throughout — no increase in realism, no added or removed objects, no new text ③ list item by item "what moves in the painting and how" (from the breakdown's motion list). Render 5 seconds, take the best ~1 second, retime to rhythm.
Channel: any Seedance integration that supports first-and-last-frame (frames2video) works; the key is the prompt itself. Video generation is billed per render — test with a short duration first.

## Route A key

See [04-pure-code-drawing.md](04-pure-code-drawing.md). In one sentence (speedrun/traversal): same scene skeleton × shared choreography × one renderer per style × character on a separate final layer × line pass at the end. For other subjects, replace the first two items with composition and motion designed around the subject.
