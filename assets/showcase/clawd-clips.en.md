# Clawd: Night at the Museum · GIF clips

[中文](clawd-clips.md) · **English**

Cut directly from v2 of the 98-second film *Clawd: Night at the Museum*. The full film (MP4, with score) is in Releases. The film's project files are not included here.

- `clawd-vangogh.gif`: 00:28.40–00:33.40, 5 s, 720×405, 15 fps. Jumps into Van Gogh's *Wheat Field with Cypresses* → impasto Clawd runs through the wheat.
- `clawd-trex.gif`: 01:20.50–01:24.50, 4 s, 640×360. A T. rex skeleton chases the flashlight spot like a cat chasing a laser pointer.
- `clawd-dawn.gif`: 01:34.00–01:38.00, 4 s, 640×360. Dawn: the guard puts down his coffee, and Clawd blinks inside the frame.

Export settings match the Super Mario set: original speed, 20 fps, silent, infinite loop, a separate 192-color palette per clip, Bayer dithering, then `gifsicle -O3`. The Van Gogh clip's impasto strokes are so dense that those settings gave 12.5 MB; switching to 15 fps, 160 colors and `gifsicle --lossy=40` brought it down to 7.7 MB.

## What the film uses

- Style: a charcoal night scene on dark brown paper; only what the flashlight hits shows color. Entering a painting switches to that painter's own technique.
- The five paintings entered: Van Gogh, *Wheat Field with Cypresses* (Met 436535); Seurat, *Circus Sideshow* (437654); Vermeer, *Young Woman with a Water Pitcher* (437881); Rembrandt, *Aristotle with a Bust of Homer* (437394); Leutze, *Washington Crossing the Delaware* (11417). All from The Metropolitan Museum of Art Open Access, `isPublicDomain: true` (CC0).
- The dinosaurs and elephant herd are charcoal line drawings based on real skeletons and anatomy; the guard only appears as hands and a shadow, and the code draws no human faces.

## Copyright

Clawd is Anthropic's Claude Code mascot, and its likeness belongs to Anthropic. This film is an unofficial fan demo, not affiliated with Anthropic; the GIFs and film exist only to show what this skill can do and are not covered by the repository's MIT license.
