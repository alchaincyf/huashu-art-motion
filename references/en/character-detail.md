# Character Detail: either draw it properly or keep the face off screen

[中文](../角色精细度.md) · **English**

Read this page before any scene that includes a human, anthropomorphic character, mascot, robot, or anything with a face. The author has reviewed films from multiple models; direct quotes:

- "A lot of the chibi figures and robot characters used in these videos are far too low quality. We should define some of our own standards for detail and effort."
- "The color and character style both have some AI slop." "The coin and chibi figure interface has some AI slop."

**A crude character is worse than no character.** The moment viewers see a round-headed, bead-eyed figure, their first reaction is "AI-made" — no matter how good the narration that follows, that impression drags it down.

## Choose a path first: three paths, only three

The `角色` (character) line at the top of the shot list records which path was chosen:

| Character line says | When to use | How to do it |
|---|---|---|
| `帧库 <路径>` (frame library `<path>`) | Image-generation capability available (this session has an image-gen tool, or the user provided character images) | Follow the B/C method in `references/en/10-characters.md` (characters) to generate AI frame libraries; check against the "delivery criteria" below |
| `只出手和背影` (hands and back-views only) | No image-generation capability, but the story needs a person | Show only hands (holding, pointing, slipping something into a pocket), back-views, silhouettes, over-the-shoulder; face stays off screen |
| `无` (none) | The story can be told entirely through objects | The object itself is the protagonist: a battery, a loaf of bread, a book — told through shape, color, and motion, without a face |

**Discontinued** (code-drawn versions read as AI-default; lint and review will flag them):

- Generic chibi: round head, bead eyes, rosy cheeks, no neck, body is a rounded rectangle.
- White-shell robot: white round shell, blue visor, one antenna, hovering or rocket-propelled.
- Objects with faces: smiling coins, frowning lithium ions, balls with eyes, emoji-style batteries.
- Stick figures and Harlem-style figures used as story actors (drawing one as a schematic symbol in whiteboard grammar does not count as story acting).

**Exception: the whole film's protagonist is a prop-character.** A jumping paintbrush, a desk lamp — as the star of the entire film, approved through the three-direction gate and chosen by the user, it may have a face and expressions: the author made a promotional film where a faceless paintbrush was judged "too formal, too boring" and changed to a cartoon paintbrush with a face before it was accepted. The distinction is the effort: the protagonist is designed (identity prop, body structure, performance) and passes the delivery criteria below; the discontinued category is expression-sticker faces casually added to coins, balls, and ions.

`y4` segments only accept a frame library (`data.character.frames`); starting without one fails. Engine code-drawn characters (`lib/toon.js` neutral/bun/author) are no longer used in finished films.

## Delivery criteria: frame-library characters must pass all eight

Take a close-up screenshot of the character (2× zoom) and go through this list one by one; record results in the delivery notes. Any failure: go back to the image-generation step and redo, or switch to "hands and back-views only."

1. **Silhouette is readable**: fill the character solid black — is it still recognizable who it is and what pose they are in? A person assembled from circles and rounded rectangles is not.
2. **Proportions have a skeleton**: visible neck, shoulders, elbows, wrists; head-to-body ratio follows the art style and is consistent throughout the film.
3. **Hands are hands**: finger or glove shapes visible; the character can actually hold an object (the object is in the hand, not pasted beside it).
4. **At least two values of shading**: base color + shadow; add highlight or rim light; light direction matches the scene.
5. **At least three material details**: fabric folds, seam stitching, hair grouped, fabric texture, shoelaces, watch strap… pick ones that belong on this character.
6. **Performance is specific**: each appearance has an expression + pose that matches this shot's content (furrowing brows at the phone, letting out a relieved breath as the phone goes into the pocket) — not just blinking or floating up and down.
7. **Same visual system as the art style**: the character's linework, coloring, palette, and background all belong to the same style — not a sticker pasted onto a different painting.
8. **Consistent across shots**: the same character has the same facial features, hairstyle, clothing, and color scheme in every shot.

## Objects without faces: how to make an object "perform"

A concept doesn't need a face to come alive.

- **Shape and motion**: lithium ions contract and move slowly in the cold; they spread out and run fast when warm. A battery bar shrinks one segment at a time in cold wind.
- **Scale**: something the size of a palm slams across the whole frame.
- **Contrast**: the same object, two copies side by side — one frozen, one normal.
- **Real materials**: an actual battery cross-section, actual frost patterns, an actual screenshot.

## Self-check

Extract 6 frames with characters or objects and look at them side by side; ask three questions:

1. Is there anything that instantly reads as "AI default chibi" or "white-shell robot"? If yes, switch paths.
2. Did any object get a face that shouldn't have one? If yes, remove the face and use motion to communicate instead.
3. Are the characters and background drawn in the same style? If not, redo the character in the art style, or limit the person to hands only.
