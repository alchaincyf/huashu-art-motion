# 31_haring · 1982 Keith Haring

[中文](../../风格配方/31_haring.md) · **English**

> Source: Migration Test C (stand-alone agent working read-only from skill, 2026-10-04). Scene code ported after integration to `scripts/engine/scenes/31_haring.js`.

Experimental filename: `scenes/k5_haring.js` (109 lines). ~4 ms per frame; frame diff 11.5%.

**Technique**
- Solid-colour base: yellow wall `#ffd51c`, green floor `#16a54a`, 14 px black horizon line.
- Everything is 13 px round-cap black outlines + flat fill, using `X.girl / X.cat` component-by-component "fill → outline."
- **Dancing figure**: 7 limb segments + round head built from the corrected `X.limb` capsule; **all segments first outlined at 2×LW black, then filled with a unified colour** to produce a union silhouette. 4 poses (partial keypoints, origin at feet) **cut hard at 8 fps with no interpolation** — that is Haring's dancing style; motion arcs beside the hands.
- **Radiant action lines**: n short straight lines around an object's enclosing ellipse (length 22–34, stroke width 7–9), changing angle at 8 fps. Used on the cat, the girl's head, the cup, the teapot, the red heart, and the right-side dancing figure.
- **Everything bounces on the beat**: `bounce=|sin(t·128/60·π)|^0.6`. Girl dy=−12·bb; cat half a beat off. Table squash-and-stretch anchored at its feet (sy 1−0.07(1−bb), sx 1+0.05(1−bb)), legs bowing; teapot jumps 26 px; window frame sways ±0.025 rad; "jump lines" on the floor change length with the beat.

**Motif animation**:
- Window's radiant baby (光芒宝宝, a Haring-style radiant figure): white union silhouette, alternating two frames of crawling; 14 rays, lengths alternating at 8 fps.
- 3 dancing figures on the wall (red/blue/pink, different phases, one mirrored).
- Red heart above the table, beating with radiant lines.

**Character**: 1980s New York girl. Oversized red sweater (a ribbed-hem line at the bottom), denim-blue long skirt, white high-top sneakers. Face reduced to a single eye-dot and a red lip stroke (Haring's figures have no facial features; these minimal marks are kept for identification). The thick black circles for ears look like a Walkman headset — perfect for the era.
**Pitfalls**: `RIG.limb`'s reverse end-cap leaves a gap at the joint under a thick outline (see ②-1). Window crossbars must be drawn below the radiant baby. RIG's `hairLines` are thin, violating Haring's "uniform line weight," and when tilting the head back to drink they pass through the face, so they were removed.

---
