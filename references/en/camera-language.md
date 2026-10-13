# Camera Language: how to use the camera

[中文](../镜头语言.md) · **English**

An expansion of the "director's requirements: how to use the camera" section in SKILL.md. Every number on this page comes with **when it applies and when to ignore it**. Numbers come from measured reference films and films the author has approved; they are a starting point, not a quota. If you have a better camera design, use it — then watch the finished film at normal speed and compare it to the reference.

## I. Three questions before moving the camera

1. **Where should the audience look right now? Can they see it clearly at the current shot size?** If they can, don't move. When the frame itself is moving (live footage, a line being drawn, a curve growing, water falling), it's even more reason not to — a camera move competes with the subject.
2. **Is this a transition or an accent?** Bringing the eye to the next point, establishing a relationship, building atmosphere — that is a transition; use something gentle. Reveal, reversal, key number landing, punchline — that is an accent; only then use something sharp.
3. **What was the last camera action?** After pushing in, find a chance to pull out or glide away. The same move three times in a row and the audience starts feeling the metronome.

## II. Camera action table

| Action | What it's for | Reference value | Where the number comes from | When to ignore it | Engine |
|---|---|---|---|---|---|
| 停 (hold) | Audience is reading text, frame is moving on its own, silence after a punchline | Duration follows voiceover; no upper or lower limit | Vox hold segments: frame delta 0.0–0.1; 3b1b `wait` is stationary | — | No camera action written |
| 缓推 (slow push) | Bring the eye to the next detail; push the mood forward one step | 0.6–1.5 s, sineInOut; push until "the thing to read is readable," often 10–40% | Vox push into photo 1.0–1.5 s, find card 0.5–0.9 s; 3b1b native push ~1 s; Heer & Robertson 2007 recommend ~1 s eased transitions for statistical charts | When the push distance is large (2× or more), up to 2 s; when following a music beat, follow the beat | `CAM.track` `push` (default 0.9 s), `to` |
| 拉远 (pull out) | Return to wide view, establish "where is it", end a section, closing | 0.8–2 s, fast start, long tail to settle | Vox pull-out ~1 s; Kurzgesagt fast pull-out reveal 0.2–2 s, long tail | Scale traversal (cell to Earth) follows the y1 card "④" timing | `pull` (default 1.1 s, `MO.longTail`) |
| 横移／找下一件 (pan / find the next thing) | From one item to the next along the same wall or desk; follow a moving object | 0.5–0.9 s, sineInOut; chase along a red line 1.3–1.8 s, long tail | Vox measured | When following a moving object, speed follows the object | `glide` (default 0.7 s) |
| 快推 (punch-in) | Accent: reveal, reversal, key number | 0.25–0.35 s, push 18–32% then hold | Nobel Literature film r3 on approval moment (doc 07 item 29, also swapped asset and background color simultaneously); School of Motion kinetic type "push 6 frames + 2 frames pull back" | In kinetic type (y5) punch-in is the main grammar — follow accents; in other grammars it is the exception | `punch`, `to` with `dur: MO.PULSE.punch` |
| 快移／甩镜 (whip / swish pan) | Sudden focus shift ("I open the laptop → (screen)"), comedic timing | 0.26–0.30 s, with motion blur | y4 whip measured 0.26 s expoInOut | — | `pan`, `TRANSITIONS.whip` |
| 砸入 (slam) | Big text, number, stamp, new frame dropping into place | 0.17 s, 1.55 → 0.94 → 1.0 | Measured in approved film | One per shot maximum; not on every cut | `slam`, `MO.slam` |
| 硬切／跳近 (hard cut / jump cut) | Change shot size without camera move: reaction close-up, jump one stop closer | 0 frames | y4 storytime: hold + jump cut, punchlines land on the cut | — | `cut` |
| 慢漂, 匀速慢推 (slow drift, constant slow push) | Atmosphere shots, artistic-style frames "the painting is always alive," MV lyrical sections, emotional long shots of 5 s+ | 1–4%/s as a starting point | No approved-film measurement: these numbers are from y1 and y2 demo films (4%/s, 1%/s); used on explainer shots, judged as an old approach; used on atmosphere shots, has not been rejected — finish and compare to the reference | **In an explainer film, pushing every shot a few percent is a slide deck** (07 item 29 film). That usage is wrong | `CAM.drift`, `CAM.at` |

All timing constants are in `MO.PULSE`. `CAM.track` with no `kind` defaults to slow push. `pull` with no `k` exactly cancels one default slow push — the most reliable way back to the wide view is `z: base.z`. For parameterized segments (t2, y1, y2), highlights default to slow push; write `"camera": "snap"` inside `data` at the spec top level (`{"data": {"camera": "snap"}}`; placing `"camera": "snap"` directly at the top level beside `grammar`, or inside a cue's `data`, has no effect and produces no error) to switch to punch-in — this changes the entire segment, so only use it for the one segment that needs the accent.

## III. Frequency and density: when to manage it, when not to

**Principle**: accents are like bold text in an article — bold everything and nothing is bold. Push-ins need a round trip.

| Situation | Manage? | How to judge |
|---|---|---|
| Explainer, science pop, finance, whiteboard, Vox-style | Yes | Punch-in + slam + whip: under one-third of total shots (lint ⑯); no three consecutive inward pushes (lint ⑮); film_gate flags "push-in count" above 8 per minute as yellow — watch at normal speed |
| TikTok / Channels first-3-second hook | No density limit | Hook can be dense; after 3 s return to normal rhythm |
| Kinetic type (y5), music beat-sync sections | No punch-in limit | Camera follows beats and accents; rhythm given by music |
| Story, comedy (y4) | Manage push, not cut | Mainly hold + hard-cut jump-close; push is rare |
| MV, emotional film | Follow emotion | Author (2026-10-11): "camera moves and transitions feel monotonous and dry, lacking variety and emotional expression." Verse: slow push, slow drift; chorus: speed up; bridge: pull out; transitions: peak on the beat |
| Art-style speedrun, scroll-through | Don't manage push; manage "is the painting alive" | Each tableau: one primary action + 2 motif loops; camera may drift slowly throughout |
| 3b1b (t1) | Manage push | Camera follows the object being looked at: one smooth push to ~1 s, stationary during `wait`; only punch-in when a conclusion lands |
| Product launch, screenshot tutorial (t2) | Manage push | Screenshot full-frame; slow push only when a detail is unreadable at that size — one or two pushes per image, then pull back to the full image or glide to the next section |
| Finance chart (t3) | Manage push | Hold when the chart is growing; slow push ~1 s to a data point; punch-in only for the one or two most critical numbers |
| Kurzgesagt (y1) | Manage push, not environment layer | Environment layer may move gently throughout; named nodes: slow push; drilling in and pulling out: follow scale-traversal timing |
| Vox investigation desk (y2), whiteboard (y3) | Manage push; pan freely | One large world canvas; panning between items is the main grammar — consecutive pans are fine; push in to the row that needs reading; pull out after |

**Counter-example**: a Nobel Economics short film from 2026-10-12, 102 s, 44 shots, ~48 inward pushes in the code (avg 2.1 s apart), all inward, each 0.28 s pushing 10–26%, almost no pull-outs or pans. Author quote: "There are an enormous number of zoom-in camera moves. Too many, and the rhythm is too fast — not smooth at all." film_gate measured push-in rate on this film at ~12 per minute (this is a lower bound; about half of live-footage push-ins can't be counted).

## IV. Real assets full-frame: the easiest trap

One photo or video clip full-frame per shot means the only camera option is push-in — the whole film becomes "cut to a frame, push in, cut to a frame, push in." That Nobel Economics film is exactly this. Solutions:

- **When live footage is moving, hold the camera still.** The person in the video is walking, the hand is moving — add a push on top of that and the audience feels shaken.
- **One push maximum per image**, and only when "that detail is unreadable at the current scale."
- **Change the entry style**: pull out from a close-up to reveal the full frame; glide in from one side; hard-cut from the previous shot's resting point at the same scale.
- **When several assets need to be discussed in sequence, place them on one world canvas** (`MD.print` prints onto the investigation desk — see y2 card); camera glides between items, so push-in and pan naturally alternate.
- **A cut does not mean you have to push again.** If every shot starts at 1.0 and pushes, the stack becomes one push after another.
- **The investigation desk is not a bunch of thumbnails.** When the camera stops on an item, it should fill about 80–90% of the frame (y2 card); large expanses of desk surface should only appear while the camera is moving or at the closing pull-out. In the 2026-10-12 A/B comparison, the new-rules version switched to the investigation desk, push-ins dropped from 15 to 8, but photos only filled half the frame width when stopped, leaving too much of the beige desk visible.
- **A landscape illustration placed in a portrait frame must be cropped first.** A 16:9 illustration pasted into 9:16 leaves only a strip in the middle with the top and bottom empty. Crop to the section the voiceover is describing, compose it as a portrait image, then use it as a print-item or full-frame — leave the full-frame version only for the closing pull-out. Two independent agents made this mistake on the same day.

## V. Self-check

- Shot-list stage: `storyboard_lint.py` flags three consecutive same actions (hold excluded), three consecutive inward pushes, accents exceeding one-third, and no camera action anywhere in the table.
- Finished-film stage: `film_gate.py` "push-in count" yellow means too many pushes — investigate; "fast-motion frame ratio" red means the film barely moves. Note: a slow push of ~1 s moving 20% and a 0.28 s punch-in register similar fast-frame counts on this metric (2026-10-12, three-frame test on the Nobel Economics short: 0.28 s push 3 frames; 1.0 s push 4–7 frames; 2.0 s push 3–10 frames counted as fast motion) — you don't need to make the camera faster just to pass the gate.
- **You can't judge camera rhythm from stills.** A still collage only shows composition. Watch the finished film at normal speed at least once; at minimum watch the densest 30 seconds.

## VI. Sources and history

| Date | Film | What happened | Where it lands in this page |
|---|---|---|---|
| 2026-10-08 | Nobel Literature science film r2 → r3 | r2 pushed every shot a constant 7.5%; also had a fixed beige background, title bar, and frame borders — judged "feels completely like playing a slideshow." r3 changed four things simultaneously: live footage full-frame, dark realistic environment, removed the frame, hold → 0.28 s punch-in → hold — "much better, go publish it." | Slow-drift row "wrong usage"; punch-in row source. Four things changed at once; impossible to isolate which one mattered. Later it was written up as "punch on every voiceover node" — which is just the same disease at a different speed. On 2026-10-12 the author looked back and said "the literature film is ordinary; the physics one is quite good." |
| 2026-10-10 | A Day with Claude opening r4 | "Very good, keep this rhythm going": slam, 0.35 s yank open to cross-section wide view, paper-plane pan, floating dust added to stills | What was approved was a mix of actions — pull-out and pan were both in it |
| 2026-10-05 | SpaceX whiteboard | Author chose r6; r17 had 5 more push-ins than r6 (unconfirmed whether that was the deciding factor) | Pending confirmation |
| 2026-10-11 | Monet Qili Xiang MV | "Camera moves and transitions feel monotonous and dry, lacking variety and emotional expression" | Section III, MV row |
| 2026-10-12 | Nobel Economics short | "There are an enormous number of zoom-in camera moves. Too many, and the rhythm is too fast — not smooth at all." | Section III counter-example; Section IV |
