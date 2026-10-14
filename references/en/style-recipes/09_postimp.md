# 09_postimp · 1889 Van Gogh (reference implementation)

[中文](../../风格配方/09_postimp.md) · **English**

File: `scripts/engine/scenes/09_postimp.js`, about 110ms per frame (three full-frame brushstroke passes). Follow its structure for other eras.

## Pipeline
Flat-color underpainting (large wall/floor/window/bed areas) → repaint with flow-field strokes (regional palettes) → prop layer (table, chairs, vase, picture frame, pendant light; separate small `source-atop` strokes) → environment linework (dark blue, 4.5px, 8fps boil) → characters (flat colors → fine `source-atop` strokes → restore outlines and facial features) → moving highlights (expanding dashed lamp-halo rings, twinkling stars, steam).

## Key parameters
- Direction field: walls vertical at −π/2 ± 0.22·noise; floor follows perspective lines toward vanishing point (960,330); starry sky follows the nearest vortex tangent, rotating by +0.3t; lamp halo follows its circumference; headboard vertical, bed sheet nearly horizontal.
- Three stroke passes: neither wall nor floor cell10 len22 w6.5; walls cell14 len64 w8; floor cell12 len46 w8. Stroke outline 0.8–0.9, blending 40–45% dark blue. Change seed at 8fps.
- Regional palettes (`P.swatch`, mixBase 0.3–0.45): walls `#7f9be6 #5f7fd8 #a7bbf2 #6c6fd2 #8ad0e6 #c3cbf6 #4f6cc8 #9a8fe0`; sky `#22339a #2f4fb8 #5c86dc #8fb6ee #1b2a78 #3c6bd0`; floor `#c0573c #a8453a #d7774a #8e3b30 #5f8f6a #c96a52 #e08a5c`.
- Seven orange/light-orange spiral markings on the cat (clipped to the body, rotating at 0.6rad/s): the reference film's "vortex cat."

## Pitfalls
- Using the same parameters across the image turns it into a blurry carpet: walls, floor, and everything else require separate passes.
- Large strokes break up small objects: always move these into a prop layer.
- Color jitter alone produces "noise in the same blue." The Van Gogh feel comes from a dozen or more hues in the regional palettes.
