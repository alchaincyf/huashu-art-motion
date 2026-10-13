# 23_dali · 1931 Dalí Surrealism (*The Persistence of Memory*)

[中文](../../风格配方/23_dali.md) · **English**

> Source: Migration Test B (stand-alone agent working read-only from skill, 2026-10-04). Scene code ported after integration to `scripts/engine/scenes/23_dali.js`.

Experimental filename: `scenes/c2_dali.js` (~235 lines). Median per-frame 47 ms (first frame 84 ms); frame diff 4.6%.

**Pipeline**
1. Background split into three cached canvases, because shadows must be sandwiched in the middle: `dali_bg` (sky, sea, rock, ground) → shadows drawn each frame → `dali_wall` (broken wall fragment with open window + bare branch) → `dali_block` (stone-block table + stool) → soft watches → characters.
2. **Volumetric fill `vol(c, path, x0,y0,x1,y1, a, b, occl, blur)`**: linear-gradient fill, then a ring of inner shadow drawn inside the clip using `shadowBlur`. No outlines anywhere — the academic rounded quality comes entirely from this.
3. **Long shadows**: each object's silhouette is projected onto the ground using a shear transform, `setTransform(1, 0, −kx, ky, kx·yg, yg·(1−ky))`, where `yg` is the ground contact line for that object (wall 700, table/cat 905, figure 930). All silhouettes are first painted onto an offscreen canvas (pure black), then composited as a whole with α 0.55 and blur 1.5 px, to prevent shadows from darkening where they overlap. A clip keeps only the ground portion (y > 594). `kx = 0.85 + 0.6·easeInOut(lt/1.2)`, making shadows visibly lengthen over 1.2 s.
4. **Soft watch `softMap(o, sag)`**: local coordinates (u,v) → screen. The portion where v ≤ fold lies flat on the table surface (y compressed to 0.28–0.32); the portion where v > fold hangs down: `X = cx + u·(1 − flare·q)`, `Y = … + d·(0.62 + 0.3·sag) + central-droop Gaussian + sine ripple`. The outer rim, dial, 12 tick marks, two hands (sampled along the mapping into soft lines) — **all pass through the same mapping**.

**Key parameters**: `flare = −0.12`; a negative value makes the hanging portion spread outward like a soft cloth, with a rounded lower edge; a positive value would form an ice-cream cone shape. drip 0.18–0.4. sag goes from 0.1 → 1.4 over 1.2 s: the first version used 0.35→1.0 and review said "the watches don't visibly drip." Three watches: windowsill R72, table edge R88, bare branch R64 (fold −34, mostly hanging).  Hand rotation speeds 4.5–6.5 rad/s.

**Motif animation**: three soft watches continuously dripping, hands spinning at different speeds; stilted elephants on the horizon (four thin legs alternating with π/2 phase offset, knees bending slightly at 0.52 height, body with 14 Hz micro-bob, carrying an obelisk) move left at 70 px/s; 9 ants circling the orange pocket watch in an ellipse; shadows lengthening; cat's tail softening and drooping (tail tip y + q²·34).

**Character**: Spanish girl, light-blue long dress + white turnover collar, gold chignon, no outlines — volume from gradients + inner shadow, facial features as dark-brown fine lines. Cat rendered with gradient orange; stripes use blur-2 px semi-transparent strokes (soft); eyes use radial gradient; white chest replaced with a smooth ellipse at (606,768) 40×92 instead of `K.white`.

**Palette**: sky `#22407c → #5f88bd → #e9dcae`; sea `#8aa6b8 → #4f6f86`; rock `#e8c27a / #9a6a34`; ground `#d2ad70 → #7a5129`; wall `#f4ead2 → #cdbf9f`; watch gold `#f0d27c / #9a7426`, dial `#f6efd6`.

**Pitfalls**
- The first version projected shadows toward the viewer (ky>0 downward) — completely swallowed by the bottom edge. The sun must be positioned low-left in front; shadows fall back and to the right (y′ = yg − ky·(yg − y)).
- Shadows are projected onto the ground, so they must be drawn below the wall and table, requiring a layered background — a single cached canvas does not work.
- A soft watch with flare>0 and large drip becomes an ice-cream cone.
- The counter's background is deep blue sky; the original dark-brown text was invisible — changed to off-white text + dark drop shadow.

**Room for improvement**: the figure is still somewhat vector-illustration-like; finer highlights and dark-side reflected light could help. The reclining soft-body "self-portrait" creature in *The Persistence of Memory* could serve as a fourth motif.

---
