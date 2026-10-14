# 15_raytrace · 1993 early ray-traced CGI

[中文](../../风格配方/15_raytrace.md) · **English**

No 3D engine: use 2D Canvas shading conventions to imitate renderer output.

## Plastic shading (apply to every part)
`plastic(c, path, base, hx, hy, R)`:
1. Base-color fill;
2. radial gradient centered on highlight (hx,hy), radius R: 0→white .55, 0.28→white .06, 0.62→transparent, 1→deep purple `rgba(10,0,30,.42)` (darkened edges create volume);
3. environmental reflection: `lighter` outline `rgba(70,150,150,.28)`, width 0.18R, offset left 0.04R; the wall is teal, so the reflection is teal;
4. hard-edged white elliptical specular highlight (0.16R × 0.09R, opacity .85). This stroke most resembles 1990s Phong shading.

Limbs use `cyl()`: gradient across the limb normal (dark .25 → narrow white .5 band at 22% → dark .45), then a fine white highlight line along 20%–75%.
Girl uses RIG.girl Path2D (long hair), replacing skirt with blue plastic cylindrical legs + spherical knee joints and adding spherical shoulder joints, giving toy-doll articulation.
RIG cat body is a polyline that looks angular when plastic-shaded: first `RIG.smooth(K.bodyPts)`, then shade. Draw tabby markings with `filter: blur(2px)` as soft stripes printed beneath the plastic.

## Scene
- Wall: radial gradient `#7dbcb9 → #64a6a6 → #3f8285`, light at the window; window shadow `blur(10px)`, offset lower-right.
- Outside: pink-purple gradient sky (`#a24cc4 → #df62ae → #f5a08a → #f8c070`), two mountain layers, 28×26 pink wireframe grid on mountains (early-CG terrain), jagged triangular snowcaps.
- **Floor**: per-pixel perspective checkerboard, vanishing point (960,480), `X=(x-960)/dy, Z=1/dy`, cells TX=0.27, TZ=0.00029; 2×2 supersampling antialiasing; 35% fog within 140px of the wall. Cached; whole-scene cold start 53ms.
- **Reflections**: draw object layer (chair/table/girl/cat) offscreen, mirror using `translate(0, 2*906); scale(1,-1)`, draw at `globalAlpha .34` into floor clip; mirror props around their own contact lines (cone 780, purple torus 846, chrome sphere 800), **first draw separately, then apply translucency to the whole layer**; otherwise the purple torus's 140 individual .34 spheres accumulate to opaque.
- Glass table: translucent green ellipse + thick edge + white outline, diagonal reflection sliding at 260px/s.

## Short loops (must be visible within 0.23s)
- Purple torus: 140 spheres in a ring, rotates around vertical axis at 7 rad/s, tilt 0.35, draw depth-sorted (dark-purple base connects spheres into a tube, then individual radial highlights). Turns 1.6 rad within 0.23s, front to side, very obvious.
- Chrome sphere: per-frame per-pixel environment map (reflection vector down→checkerboard, up→pink-purple sky + window light), checkerboard u coordinate shifts with `t*4.5`, indicating rotation; brighten Fresnel edge. Diameter 104px, <2ms per frame.
- Lens flare (`lighter`): sun-core glow 170px pulses ±8% at 23 rad/s; 12 star rays rotate at 1.6 rad/s; horizontal light streak 960px; five ghosts (circles + hexagons) along sun→image-center line slide with `sin(t*5)*0.03`.
- Cat-eye green glow: `lighter` radial gradient radius 46px, pulses ±25% at 18 rad/s.
- Cup lifting (choreo.cup), tail flicks, blinking, and steam as usual.

## Pitfalls
- Wireframe transition computes and caches edges from the new image's first appearance (`once('edges')`), so the lt≈0 frame must be complete; do not leave it blank or fade in at lt=0.
- Performance: warm frames 23ms, cold start 53ms.
