# 06 · Voiceover-driven art shorts (method draft — pending validation on a first real film)

[中文](../06-口播驱动的艺术短片.md) · **English**

Goal: using voiceover as the driver, produce animation with coherent shots and visuals in a chosen era or artist's style. For the latest full-film method see [12-full-narrated-films-and-feedback-loop.md](12-full-narrated-films-and-feedback-loop.md).

> ⚠️ This page is a plan extrapolated from the Art History Speedrun engine; **it has not yet been run on real voiceover**. Once the first film is done, delete this line and write the actual results back in.

## Differences from a speedrun film

| | Speedrun film | Voiceover short |
|---|---|---|
| Timeline | BPM grid | Word-level voiceover timestamps (from your transcription tool, e.g. Whisper-style word-level timestamps) |
| Style | Changes every segment | **One style throughout** (one artist / one era) |
| Camera | Fixed position | Camera language required: push, pull, pan, glide, cut to different focal lengths, follow |
| Narrative | Skeleton constant, style changes | Style constant, content changes with voiceover |

## Workflow

1. **Voiceover → shot list**: cut by sentence; for each sentence define "what is on screen" (concrete object / metaphor / character action / text), label camera type (wide / medium / close / push / pan) and duration (from word-level timestamps). Show Huashu 5–10 rows of the shot list before starting work.
2. **Define style = define renderer + palette + line weight**: pick the closest card from `style-recipes/` as a starting point; for a style not yet there, write a new renderer following section 3 of [04-pure-code-drawing.md](04-pure-code-drawing.md). Render one frame first (three-direction hard gate: one frame for the same voiceover line in three style interpretations — let Huashu choose).
3. **World, not frame**: a voiceover film needs to cut shots, so build the scene as a "world canvas" larger than the frame (e.g. 5760×3240), with world coordinates for each element; the camera is a viewport (centre, zoom, rotation). The renderer works on the frame the viewport draws out; brushstroke size is defined in screen pixels, so a push-in shot does not make the strokes coarser — this is the difference between "the painting moves" and "an image is being zoomed".
4. **Flow between shots**:
   - Within the same scene: viewport interpolation (push/pull/pan), with ease-in/ease-out.
   - Scene change: use that style's own language as the transition (Van Gogh = brushstroke vortex sweeps it away, Ukiyo-e = the great wave, ink wash = the ink blooms open) — layer 3 of the mechanism in reference 02.
   - Match cut: the shape in the outgoing shot matches the shape in the incoming shot (rim of cup → moon).
5. **Text and voiceover**: key words can be lettered in the frame using that style's typeface/brushwork (mosaic characters, calligraphy, neon), not as a generic subtitle strip; subtitles go on a separate track in the edit project.
6. **Music**: the grid method from reference 05 applies directly — the grid simply yields to voiceover rhythm (transitions and musical accents land in the silences between sentences).
7. **Review**: watch alongside the voiceover; does every sentence have matching picture? Is every shot moving? Is the style immediately recognisable?

## Division of labour with the video pipeline

Voiceover transcription, timeline, mixing, and delivery go through your video pipeline; this skill is responsible only for the "art animation picture" track, producing one silent MP4 or ProRes to use as the picture track in the edit.
