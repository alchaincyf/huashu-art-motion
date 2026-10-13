# Shot-List Template: shot list first, then code

[中文](../镜头表模板.md) · **English**

Step 1 of the tracked workflow. Open-canvas projects can also write one first; running lint is optional for those.

A shot list is this film's storyboard: first lock in one art style, then one row per shot — what objects are in frame, what they are doing, how the camera moves, how many words are on screen, and what tool does the work. If you can write this table, the film will not become a slide deck that keeps piling up, and it will not become a collage of a different style per shot. If you cannot write a particular row, that shot is not yet clear in your mind — do not start writing code until it is.

## How to write it

Copy the block below into `<project>/镜头表.md` (shot list), fill in the first three lines, then add one row per shot:

> **Note: `scripts/storyboard_lint.py` is Chinese-keyed.** The lock lines (`画风:`, `色板:`, `角色:`, `允许蓝紫:`) and the column headers (`时间段`, `画面里的物`, `它在做什么`, `镜头`, `屏上字`, `做法`, `标签`) must appear verbatim in Chinese for the lint to parse them. English glosses are provided here for reference only — do not replace the Chinese tokens in the actual `镜头表.md` (shot list) file you feed to the lint.

Keep the Chinese camera and character-control terms too. Object/action descriptions can be English, but the validator's abstract-object, weak-action, text-led-shot, and character vocabularies mainly recognize Chinese. Check those rules manually for English descriptions; a green verdict does not establish full semantic coverage.

```markdown
画风：<one style card or drawing method for the whole film>
色板：<preset from references/en/palettes.md, or 3–6 hex values>
角色：<choose 无 / 只出手和背影 / 帧库 path>

| 时间段 | 画面里的物 | 它在做什么 | 镜头 | 屏上字 | 做法 |
|---|---|---|---|---|---|
| 0–3 | （noun: a person, an object） | （verb: what it is doing） | 停／缓推／拉远／横移／快推／砸入／切 (hold/slow-push/pull-out/pan/punch-in/slam/cut) | （≤8 text units, may be blank） | （y4 segment 镜01.json／scenes/xxx.js／asset photo） |
```

| Column | What to write | Do not write |
|---|---|---|
| 时间段 (time) | `0–3`, `3–7.5`, or `0:03–0:07`; the end of one shot is the start of the next | |
| 画面里的物 (object in frame) | A noun — something in the frame you can point to and say "that's it": a slice of bread, a spore, the protagonist's hand | Title, bullet point, text, list, label, subtitle, card, background, frame, icon; empty shot, solid color, black, gradient background (protagonist not in frame) |
| 它在做什么 (action) | A verb — the object's own action: drifts in, cracks open, drills inside, gets cut off | Appears, displays, shows, fades in, lists one by one |
| 镜头 (camera) | The main camera action for this shot, chosen by "where should the audience look right now": 停 (hold) ／ 缓推 (slow push) ／ 拉远 (pull out) ／ 横移 (pan/glide) ／ 快推 (punch-in) ／ 砸入 (slam) ／ 切 (cut). Punch-in and slam are accents — only for reveals, reversals, key numbers; push back out after. See `references/en/camera-language.md` (camera-language) for usage and timing | Pushing every shot once; slow-pushing every shot at a constant rate |
| 屏上字 (on-screen text) | ≤8 text units per shot, may be blank; verbatim voiceover goes to subtitles | Full voiceover sentence, three bullet points |
| 做法 (method) | What tool: which grammar's parameterized segment (spec filename), `scenes/<id>.js` code, or real asset full-frame | Switching to a different grammar every shot |
| 标签 (tags, optional column) | Labels on objects in this shot, separated by ／ | More than 3 per shot; a row of glowing capsules |

Lock lines at the top (画风 lock):

- **画风 (art style)**: one sentence — which drawing method the whole film uses, e.g. "warm-wood paper illustration, flat color with fine pencil lines, kitchen afternoon sidelight." Changing scenes is fine; changing art style is not: cartoon figures, dark code screens, starfield icons, white-background bar charts, paper, and webpage screenshots taking turns each looks fine on its own, but the whole film is a collage.
- **色板 (palette)**: one preset from `references/en/palettes.md` (palettes), or 3–6 hex values. All segment specs write the same `"theme"`; scenes also use only these colors. No blue-purple gradients, no deep-purple starfields, no neon cyan-purple. Add `允许蓝紫：<reason>` (allow blue-purple) only when the user explicitly calls for blue-purple (cyberpunk purple, Van Gogh Starry Night).
- **角色 (character)**: if the film shows a person or anthropomorphic character, read `references/en/character-detail.md` (character-detail) first. With image-generation capability, use AI-generated frames and write "帧库 `<path>`"; without it, write "只出手和背影" or "无" and tell the story through hands, back-views, silhouettes, and objects. Code-drawn chibi figures, white-shell robots, and objects with face expressions are discontinued.

Five requirements — check each when done:

1. **The first 3 seconds are a concrete small scene; the last shot ends on an action of the protagonist or main object**: the opening is a person or object doing something related to the topic — not a title slide, not "today we're going to talk about"; the closing is an action like slipping into a pocket, closing a book, or pulling back for a wide view. Words can appear on objects in the frame; do not end on a centered pull-quote card.
2. **One example runs through the whole film; one art style throughout**: the same slice of bread, the same pair of hands, the same machine from start to finish — each shot is about something that happens to it; every shot is inside the art style locked at the top.
3. **Each shot 2–6 seconds**: individual shots may reach 8 seconds.
4. **Text-led shots ≤30%**: a shot is text-led if its object column is a title/text, its on-screen text is 7+ text units, or its method is a y5 kinetic-type segment.
5. **No two adjacent shots share the same composition**: if this shot is a full-frame close-up, the next shot switches to a pan, a different object, or a different shot size. Change composition and camera — not art style.

Two hard rules for the method column (also in step 3 of the tracked workflow): **a single parameterized segment may cover at most 8 seconds in total** (the same `.json` combined across all rows); **a film uses at most 2 segment grammars** — all specs write the same `theme`; remaining shots use scenes drawn in the same palette, or real assets full-frame.

A text unit is one Chinese character or one Latin alphanumeric run (usually an English word). The validator uses these units for the 8-unit limit and 7-unit text-led threshold.

## Check

```sh
uv run <skill>/scripts/storyboard_lint.py <project>/镜头表.md --script <project>/文稿.txt   # include --script if you have a voiceover script
```

Per-shot red/yellow/green with suggested fixes; non-zero exit on red. Fix the shot list and re-run — **do not start writing code until red lights are cleared.** Yellow lights are acceptable; write a reason for each in the delivery notes. The lint checks: whether the 画风, 色板, 角色 lock lines are present; whether the palette has blue-purple values; whether the character line specifies a code-drawn figure; whether the object column contains robots, chibi figures, or stick figures when character is not a frame library; whether y4 is used without a frame library; whether any coins, balls, or ions are given faces; whether the object column is empty, contains only layout words, or is a blank scene like a black frame; whether the action column has an actual action; whether on-screen text ≤8; whether the first and last shots are text-led; whether text-led shots exceed 30%; whether numbers in on-screen text are found in the voiceover script (when `--script` is given); whether any shot has more than 3 tags; whether each shot is 2–6 seconds (6–8 s → yellow, >8 s → red); whether three consecutive shots use the same camera action (hold and pan excluded); whether three consecutive shots all push inward; whether punch-in / slam / whip exceed one-third of all shots; whether any segment total exceeds 8 seconds; whether more than 2 segment grammars are used. "One example throughout" and "same art style every shot" and "adjacent compositions differ" cannot be checked by machine — verify those yourself.

## Example: Why Does Bread Go Mouldy (54 s, landscape)

This is a writing example. Do not copy the subject, objects, or shot order into your own film. The through-line is the same bag of toast and the protagonist Xiaoman's two hands — her face stays off screen.

画风：warm-wood paper illustration, flat color with fine pencil lines, all shots in the same kitchen afternoon sidelight
色板：wood
角色：只出手（Xiaoman's hands, face off screen）

| 时间段 | 画面里的物 | 它在做什么 | 镜头 | 屏上字 | 做法 |
|---|---|---|---|---|---|
| 0–3 | Xiaoman's hands and a bag of toast | Hands tear open the bread bag; fingertips stop on a blue-green spot | 停 | | scenes/kitchen.js |
| 3–6 | That green spot | White fuzz appears along the edge and spreads outward like a map | 缓推 | Three days ago it wasn't there | 素材 mouldy-bread photo, full-bleed |
| 6–10 | A single spore | The spore drifts in through a window crack, tumbling, and lands on the bread | 横移 | Spore | scenes/spore.js |
| 10–14 | That spore | The shell cracks; a white filament extends and pierces the bread | 快推 | | scenes/spore.js |
| 14–18 | The air pockets in the bread cross-section | The filament branches along the pockets, drilling downward like tree roots | 拉远 | Hyphae | scenes/hyphae.js |
| 18–22 | Starch granules inside the bread | The filament tip sprays enzymes that clip the starch granules into individual sugars | 缓推 | Starch → sugar | scenes/hyphae.js |
| 22–26 | The kitchen wall thermohygrometer | The needle slides from 15°C to 28°C; water droplets condense on the inside of the bag | 切 | 28°C | scenes/kitchen.js |
| 26–31 | Two mould-area curves | The countertop curve climbs; the fridge curve barely moves | 停 | Much slower in the fridge | t3 片段 镜08.json |
| 31–35 | Tiny stalks on the mould surface | Each stalk raises a black spore ball; the ball pops open | 砸入 | | scenes/hyphae.js |
| 35–39 | A cloud of spores | The cloud drifts across the counter and descends toward the bag of steamed buns beside it | 横移 | Next stop | scenes/spore.js |
| 39–43 | Xiaoman's hands and a bread knife | The knife tip traces the green patch — she is about to cut it off and eat the rest | 停 | Just cut it off? | scenes/kitchen.js |
| 43–47 | The cut bread cross-section | Perspective peels away layer by layer; invisible hyphae already cover half the slice | 快推 | The invisible part | scenes/hyphae.js |
| 47–51 | Xiaoman's hands and a bin | She drops the whole bag into the bin and closes the lid | 切 | | scenes/kitchen.js |
| 51–54 | Xiaoman's hands and a new bag of toast | She pushes the new bag into the freezer; the door closes; frost slowly creeps up the bag | 拉远 | Cold · dry · sealed | scenes/kitchen.js |

Why this table passes: the 画风, 色板, 角色 lock lines are all filled; the opening is two hands tearing open a bag and finding mould — not a title; the close returns to the same two hands pushing new toast into the freezer, three words written on the world, not a pull-quote card; the same bag of toast runs through the whole film; none of the 14 shots is text-led; the only parameterized segment is shot 8's t3 curve, whose spec writes `"theme": "wood"`, same palette as the scenes; camera follows "where should the audience look": slow push when details need reading (green spot, starch granules), pan when following something moving (spore, spore cloud), pull out for wide view (hyphae drilling down, closing the freezer), hold when the frame itself is moving (curve growing, knife tracing); punch-in and slam are used three times only — spore shell cracking, spore ball popping, cross-section reveal; after each push-in there is a pull-out, pan, hold, or hard cut to change things up; no three consecutive inward pushes. Shot 8's curves are schematic — label "schematic data" in the finished film.
