# Style index (35 styles, updated 2026-10-05)

[中文](../../风格配方/INDEX.md) · **English**

> **Read this first: all 35 demo films share one composition** (window upper-left, cat lower-left, girl on the right holding a cup; so does `assets/全风格总览.jpg`, the all-style overview). That is the Art History Speedrun film's mechanism, changing style while keeping the scene fixed, not the composition inherent to these styles. Compose anew for a new subject: reuse the cards' renderers, brushwork, color logic, and motif motion, but do not transplant the room coordinates, characters, or furniture.

Choose a style using the two tables below, then open its card. "Quality" means current implementation quality (★★★ immediately recognizable, ready to use; ★★ recognizable with obvious shortcomings; ★ needs reworking), not difficulty of the style. The shortcomings are what to improve first when next using it.

Styles have two layers. **Material treatments**: brushwork, material, light, and color handling transferable to any subject (products, data, stories). **Era specimens**: closely tied to an era or artist, suitable for speedruns, time travel, and homage; they often feel out of place on other subjects. Uncertain cases go in the material layer; when a style fits both (such as Hopper's transferable hard-edged lighting), classify according to your use.

## Material treatments (transferable to any subject)

| id | Style | Core renderer / technique | Motif motion (bringing the painting to life) | Signature transition (entering it) | Quality | Current shortcomings |
|---|---|---|---|---|---|---|
| 09_postimp | Van Gogh | Three flow-field stroke passes (long vertical walls / perspective floor / other areas) + regional palettes + outlines; prop layer; visibleLines restores lines | Sky vortices, expanding lamp-halo rings, flame-like direction-field sway, vortex cat | Starry vortex draws image in | ★★★ (reference) | Heaviest at 120ms/frame |
| 08_impressionism | Impressionism | Fixed-position short strokes with regional pastel palettes, fine window-view strokes | Drifting/pulsing light spots, swaying poppies, moving clouds, floating ribbons | Brushstroke color dots fill screen | ★★ | Strokes break up face and hands |
| 29_seurat | Seurat pointillism | Optical mixing: 21 pure colors juxtaposed in proportion, complementary dots, equal-sized dots | Light seepage, breathing dots | Image crystallizes into dots | ★★ | Rather static; regular grid |
| 25_ghibli | Ghibli watercolor backgrounds | Watercolor washes (transparent layered color + tide marks), cel crescent shadows | Wind inflates curtains, grass sways in groups, dappled tree shadows | Wet paper blooms | ★★ | Characters weaker than background |
| 17_ink | Chinese expressive ink | Dry-brush bristles, blurred ink washes, reserved paper, seals | Strokes write themselves at opening, spreading washes, shrimp whiskers | Speedrun opening | ★★ | Characters insufficiently expressive (review 6/10) |
| 13_pop | Lichtenstein Pop Art | Ben-Day dots createPattern, thick black outlines | Warhol four-panel color changes, thought dots flash, cat rear wiggle, shaking sound-effect burst | Lightning + halftoning | ★★★ | — |
| 14_8bit | 8-bit pixel art | Per-pixel 240×135, 14-color palette, 1px black part outlines | Tail, flashing HUD hearts, question-block coin pop (15–30fps steps) | Pixel blocks enlarge/shrink | ★★★ | Cat head overlaps sill |
| 26_vaporwave | Vaporwave/cyber neon | Two-color neon glow, perspective grid, VHS channel-separation postprocessing, path-drawn tube kana | Sunset strips rise, grid rolls forward, sign flickers, tracking noise bands | VHS tears + upward roll | ★★★ | Part joins glow too |
| 35_shinkai | Shinkai lighting | Cumulonimbus, Tyndall beams, hard cel-shadow bands, lens flare | Floating light particles, moving clouds | Diagonal light sweep | ★★ | Interior background insufficiently dense |
| 32_rembrandt | Rembrandt chiaroscuro | Whole-image lighting-map multiplication, window + candlelight | Dust in beams, cloud shadows change window light | Old-film iris closes/opens | ★ | Flat characters (review 5/10); most in need of reworking |
| 11_cubism | Analytic Cubism | Translucent gradient planes build space, faceter (unclipped triangles), Picasso dual-view face | CAFÉ letters jump/reorder, window facets slide, newspaper trembles | Geometric fragments shift and assemble | ★★ | Too bright, too few large dark-brown planes |
| 30_matisse | Matisse cutouts | Irregular scissor edges, pinned-paper shadows, saturated flat fills | Paper flutters, seaweed sways | Blue paper bearing cutouts sweeps across | ★★★ | Gouache brush texture too heavy |
| 16_2026 | Contemporary flat illustration | Grain-stipple density function, outline-free color blocks | Character acting (jump / cup taps / shattering / gasp / signature), damped secondary motion | Three-color concentric iris | ★★★ | — |
| 22_constructivism | Russian Constructivism (narrow use) | Grayscale photo halftone (variable dot radius at 45°), red wedges/black circles, path-drawn block Cyrillic | Slogan stamped letter-by-letter, then wave jumps | Film B opening | ★★★ | Missing megaphone-shaped text cone |
| 12_bauhaus | Bauhaus (narrow use) | Pure geometric composition, Schlemmer puppet joint discs | Pointer rod steepens, Mondrian cells change color, cat taps ball | Red/yellow/blue geometry rotates/enlarges | ★★★ | Cat head off rig position |
| 04_roman | Pompeian mosaic (narrow use) | Distance-field stones along contours, weighted L∞ Voronoi mortar, calculate layout once, color flows each frame | Wave border flows clockwise, Vesuvius smokes/sparks | Mosaic tiles flip outward from cat | ★★★ | Little facial detail at small scale |
| 15_raytrace | Early ray-traced CGI (narrow use) | Uniform plastic shading, per-pixel checker reflection, chrome-sphere environment mapping | Purple torus rotation, lens flare, green cat eyes | Green wireframe → scanline rendering | ★★ | Straight cylindrical cat legs, mask-like face |

## Era specimens (speedruns, time travel, homage)

| id | Style | Core renderer / technique | Motif motion (bringing the painting to life) | Signature transition (entering it) | Quality | Current shortcomings |
|---|---|---|---|---|---|---|
| 01_cave | Cave painting | Noise-relief rock + ragged charcoal dots + ochre absorbed into rock | Two-pose running animals, flickering fire, embers | Opening | ★★★ | Human figures too cartoonish, not primitive enough |
| 02_egypt | Egyptian tomb mural | Profile face/frontal eye convention, flat fill/fine outlines, 24 handwritten hieroglyphs | Scarab pushes sun, Aten-ray hands open/close, hieroglyph strokes redraw | Tapestry strips drop/rebound | ★★★ | Stiff cup-holding elbow |
| 03_greek | Attic black-figure | Black silhouettes + clay incised lines + purple-red bands/white dots | Meander bands roll oppositely, ship bobs/dolphins leap, lyre swings | Pottery-cylinder rotation | ★★★ | Heavy skirt hem |
| 05_gothic | Gothic illuminated manuscript | Per-pixel gold leaf (brushing + embossed 1px offset bright line), goldness-mask highlight | Diagonal gold highlight sweep, swaying vines, crawling snail, running mouse | Parchment page turn | ★★★ | Blond hair looks like hood |
| 06_renaissance | Renaissance sfumato | Slightly blurred whole layer + high-opacity sharp layer, cracks/canvas/yellow glaze | Leonardo ornithopter passes, fragmented river light, dust | Divine light through window | ★★ | Cartoonish cat; rather still overall |
| 10_nouveau | Mucha Art Nouveau | Variable-width paths (thick outside, fine inside), offset silhouette underlay | Sunrise, rotating halos, swaying flowers, S steam, curl waves | Gold-edged organic shape grows | ★★★ | Stiff cat pose |
| 18_klimt | Klimt Golden Phase | Reused Gothic gold leaf, spiral/eye patterns, realistic face/flat golden robe | Robe eyes blink in sequence, falling gold fragments | Gold leaf spirals from head | ★★★ | Table hand disconnected from sleeve |
| 19_munch | Munch Expressionism | Long curved flow-field strokes (20–30 steps), row-wise sine warp of whole world | Whole painting twists, blood-red sky flows | Scream bands press downward | ★★ | Wall previously read as Van Gogh |
| 20_dunhuang | Dunhuang mural | Earth-red mineral pigments, peeling patches (background only), saturation fading | Apsara ribbons, falling celestial flowers, lamp flames | Ribbon sweep, old paint peels/falls | ★★ | Rough apsara forms |
| 21_kusama | Yayoi Kusama dots | Irregular hand-drawn circles, hex-grid modulus with real period | Dots expand/contract outward from cat, pumpkin, infinity room | Growing dots clip new image | ★★★ | Character/wall same color, relies on contours |
| 23_dali | Dalí Surrealism | Soft-clock deformation, sheared affine long shadows | Melting clock, walking long-legged elephant, ants circling watch, lengthening shadow | New image flows down with round-ended drops | ★★ | Characters too vector-like |
| 24_hopper | Hopper American realism | Two light/shadow versions clipped by light shapes, hard-edged patches | Slowly shifting light sweeps face, wall silhouette drinks tea in sync | Hard-edged sunlight sweep | ★★★ | Cat always in shadow |
| 27_kirby | Marvel Kirby cosmic era | Four-color halftone, print misregistration, feathered black-shadow hatching, krackle energy dots | Large sound-effect text, panel cat-eye close-up, energy dots | Film C opening | ★★ | Too Lichtenstein-like, lacks Kirby perspective/block hands |
| 28_monet | Monet water lilies/Japanese bridge | Short-stroke water reflections, trembling light | Drifting lilies, swaying willow reflections, spreading ripples | Water ripples open | ★★ | Awkward space: pond-water wall, wooden floor |
| 31_haring | Keith Haring | Thick uniform black lines, radiating motion lines | Figures hard-cut dance at 8fps, everything bounces to BPM | Dancing figure enlarges, new image inside body | ★★★ | Girl not Haring-like enough |
| 33_rubberhose | 1930 rubber-hose cartoon | Pie-cut eyes, noodle arms, white gloves, 12fps steps, film scratches/flicker | Everything bounces on beat | Old film before backstage lamp lights | ★★★ | Motion mostly film noise |
| 34_shadowpuppet | Chinese shadow puppetry | Translucent pierced cowhide, riveted joints, 10fps steps, backstage oil lamp | Rod-controlled stiff joints, wrist flicks | Backstage lamp lights | ★★★ | Overlaps multiply too dark; slow at 121ms |
| 36_picasso_blue | Picasso Blue Period | Monochrome blues, broad strokes, thick Prussian-blue outlines, elongated bodies | Slow breathing | Color drains to blue, broad brush sweeps | ★★ | Forms not melancholy enough |

## Quality distribution and next steps

- ★★★ 20 styles, ★★ 14 styles, ★ one style.
- **Characters are the most common weakness**: the background looks right after its style renderer, but characters using only flat vector rigs look pasted on (proven practices item eight). Improve next by passing characters through the same renderer or reshaping them in the style: Rembrandt, Picasso Blue, ink painting, Ghibli, Dalí, Marvel.
- Transition collection: `_transition-migration-test.md` (19 additions from A–D), plus descriptions within individual cards.
