# Palettes: one palette per film

[中文](../色板.md) · **English**

The `色板` (palette) line at the top of the shot list (镜头表.md): pick a preset name from here, or define 3–6 hex values following the rules at the end of this page. All parameterized segments write the same `"theme"` in their spec; scenes only use these colors (adjusting lightness and opacity is fine; do not introduce new hues).

## Forbidden zone first

**Blue-purple gradient backgrounds, deep-purple starfield backgrounds, neon cyan-purple glow effects, purple frosted glass**: the author's own words — "we need to avoid the garbage color scheme of blue and purple gradients; this is very AI slop." These are the AI animation defaults that audiences instantly read as "AI-made."

`deliver.py` measures this: if 30%+ of a frame is blue-purple (hue 225°–300°, saturation ≥ 0.30), that frame counts as a blue-purple frame; if blue-purple frames exceed 30% of the whole film, red light — no delivery. When the subject genuinely requires blue-purple (user-specified cyberpunk purple, Van Gogh Starry Night, and similar stylistically mandated scenes), add `--allow-blue-purple "reason"` at delivery — this downgrades to yellow light — and write the reason into the facts section of the delivery notes.

Navy flat-fill (hue ~210°, see `navy` below) is not in the forbidden zone: it is an intentional single base color, not a gradient and not glowing.

## Eight preset palettes

Each palette has 6 keys: `bg` base, `surface` card/paper/panel, `ink` primary text, `sub` secondary text and fine lines, `accent` primary emphasis, `accent2` secondary emphasis. In a segment spec, write `"theme": "wood"`, or `{"name": "wood", "accent": "#B8452A"}` to override a single key.

| Name | Suits | bg | surface | ink | sub | accent | accent2 |
|---|---|---|---|---|---|---|---|
| `paper` | humanities, history, books, explaining an idea | #F3EDE2 | #FBF8F2 | #1B1A17 | #6B655B | #C8402F | #2F5D62 |
| `poster` | opinions, conflict, science pop with one punchy line | #FFD23F | #FFF6D6 | #111111 | #4A4433 | #FF5A36 | #14213D |
| `ink` | tech, night scenes, serious topics | #121417 | #1E2226 | #F2EFE8 | #A39E93 | #F2B33D | #5FB3A1 |
| `navy` | products, data, phones and electronics (flat, no gradient) | #0D1B2A | #16293D | #EEF3F6 | #8FA3B3 | #5CC8E0 | #F2A93B |
| `bauhaus` | design, structure, geometry, process | #EFE9DD | #FFFFFF | #111111 | #555555 | #D62828 | #1D4E89 |
| `snow` | winter, medical, clean, laboratory | #E9EEF0 | #FFFFFF | #1F2A30 | #5E6B72 | #D9482B | #3E7C8C |
| `wood` | everyday life, kitchen, craft, home | #EDE3D1 | #F7F1E6 | #2B2622 | #7A6E62 | #C4552D | #3F5B4B |
| `chalk` | classroom, derivations, formulas, worked problems | #23302B | #2E3D37 | #F1EFE6 | #A9B3AA | #F4D35E | #E87D5A |

## Defining your own palette

- 3–6 colors: one base, one surface, one primary text, one secondary text, one or two accents. Accent color points to one thing per shot.
- Set the base first: light base (paper, snow, wood) or dark base (ink, navy, chalk) — do not alternate between light and dark across the film.
- Avoid the blue-purple zone in your color values: hue 225°–300° with saturation ≥ 0.30 cannot be used as the base or in large areas. `storyboard_lint` checks palette hex values and flags anything in this zone as a red light.
- No gradient bases, no neon outer glows. For depth, use paper texture, grain, or two-value flat shading.
- When working with real assets (screenshots, photos), pull one or two accent colors from the assets; the base still uses this palette.

## Self-check

Before delivery, lay the extracted frames in a row and ask: is the base color in the same lightness range from start to finish; are there only those one or two accent colors; does any shot suddenly introduce a white-background bar chart, purple starfield, or neon-border look from "a different film"? If yes, redraw that shot using the palette.
