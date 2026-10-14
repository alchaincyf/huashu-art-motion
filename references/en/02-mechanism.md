# 02 · Mechanism: why the "Art History Speedrun" works

[中文](../02-机制.md) · **English**

This page covers the mechanism for "speedrun / traversal" films: the same scene, cycling through a series of styles or eras (Art History Speedrun, a city's 100 years, one person from age 18 to 80). All subjects of this type can be built from these five layers; explainer films, narrative films, and single-style shorts do not use this structure — design their composition around the subject.

## Five-layer mechanism

**1. One fixed scene skeleton.** Across 16 eras, the positions of the window, desk, cat, person, and year plaque barely change (±40 px). The viewer's eye has an anchor and can therefore perceive "what changes is the style". Because the positions are fixed, transitions can use objects within the frame as an origin (mosaic tiles spreading from the cat's position, an iris opening from the cup).
→ How to use (speedrun/traversal only): define the composition coordinates for this film first; align all eras to them. In code this is a single set of constants, not per-segment definitions. Do not reuse this room's coordinates for other subjects.

**2. Every era is a living painting.** Each one stays on screen for 0.25–1.4 seconds, but the painting is always moving: the protagonist performs one continuous action (lifting a cup to drink) plus 2–4 small loops **drawn from that era's own visual motifs** — cave animals cycling between two poses at a gallop (the animation equivalent of multi-legged cave-painting figures conveying motion), an Egyptian scarab pushing the sun disk, a Greek meander border scrolling, a Roman volcano smoking, Gothic gold-leaf highlights, Renaissance ornithopter flying past, Edo-period cresting wave, Van Gogh swirling stars, Bauhaus clock hands, Pop Art four-panel colour cycling.
→ How to use: for each segment, list "the 3 most recognisable formal elements of this era" and animate them. The motion must be readable within the segment's on-screen window (short segments need faster rhythms).

**3. Transition = the signature language of the next era.** Into Egypt: stone blocks / tapestry falling. Into Greece: pottery rolling to reveal a new face. Into Rome: mosaic tiles flipping. Into Gothic: parchment page turn. Into Renaissance: divine light. Into Ukiyo-e (Edo): the Great Wave sweeping across. Into Impressionism: brushstrokes and colour dabs filling in. Into Van Gogh: starry-night vortex. Into Art Nouveau: gold-outlined organic forms growing. Into Cubism: geometric shards. Into Bauhaus: red/yellow/blue geometry rotating and expanding. Into Pop Art: lightning + halftone. Into 8-bit: pixelation. Into ray tracing: green wireframe → scanline rendering. Into 2026: tri-colour concentric ring iris.
→ How to use: don't pick from a generic transition library — grow the transition from "the most recognisable formal element of the new style". On the first frame of every transition add a lens impact (scene layer scales to 1.03, returns to 1.0 over ~20 frames; the year plaque does not scale) — that is the source of the snap on the beat.

**4. Beat grid with acceleration.** BPM stays at 128; the number of eighth notes per segment decreases: 6 → 4×5 → 3×4 → 2×3 → 1×3 → extended ending at 9+. The speed never changes, but the perceived pace feels increasingly urgent; the final segment is extended to make room for the punchline. Transition durations shrink accordingly (0.4 s → 0.13 s), year-counter scroll durations shrink too (0.55 s → 0.07 s).
→ How to use: list the desired duration for each segment, round to eighth notes, then adjust the whole to a regular decreasing pattern. All cut points, musical onsets, and sound effects land on the grid.

**5. One continuous narrative anchor + end-of-film character gag.** The year counter is the only element that is continuous throughout: its value is determined solely by global time; during transitions both the old and new layers show the same scrolling number, each in its own typeface (hand-carved at 40,000 BC → reed brush at 1350 BC → … → geometric sans-serif at 2026). At the end, give the character a gag (the cat flicks the cup off the table three times, the girl cries out, the signature writes itself); animate it fully with anticipation, squash-and-stretch, follow-through, and secondary action — the first 11 seconds are for looking, these 4 seconds are for laughing, and the laugh drives the share.

## Addendum (2026-10-04 migration tests A–D)

- **Protagonist action is continuous across segments**: the narrative anchor is not only the counter — the protagonist's action also plays out on global film time; each segment re-enters the action in progress, so viewers see "lifting the cup five times" rather than "the same instant replayed in five styles".
- **When the counter uses years, segments must appear in chronological order**; if they cannot be reordered, replace the counter with a segment number or style name (the engine's counter widget is swappable). At the transition midpoint, hard-cut to the new counter to avoid overlapping digits.
- **When the first segment has no transition to borrow, let the painting "draw itself"** (brushstrokes writing in, colour layers landing one by one, pixels lighting up row by row).
- **The more complex the signature transition, the longer it needs**: the original film's simple shapes made 0.4 s enough; gold leaf, colour ribbons, and banners need 0.48–0.5 s.

## Adapting to other subjects

| Layer | This film | "A city's 100 years" could be |
|---|---|---|
| Skeleton | Window / desk / cat / person | Same street corner: lamp post, shop sign, pedestrian, skyline |
| Living painting | Era-motif small loops | Each decade's vehicles passing, sign typefaces flickering, things in the sky (kite → plane → drone) |
| Transition | Next era's signature language | Next decade's medium: film burn edge, TV static, pixels, scan lines |
| Beat | 128 BPM decreasing | Same |
| Anchor + gag | Year counter + cat knocks cup | Year counter + the same pigeon stealing food in every decade |

## What not to copy wrongly

- Do not treat "16 eras" as a quota. The mechanism for speedrun/traversal is "style changes, skeleton stays" — 3 eras work fine; it is not the mechanism for every subject.
- Do not replicate the original pixel-for-pixel. Replication is a learning tool; the deliverable is your own version after understanding (Huashu chose a blonde girl + orange-and-white cat — that is swapping the characters on the original skeleton).
