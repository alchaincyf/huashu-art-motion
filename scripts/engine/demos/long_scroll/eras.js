// Demo · long-scroll journey: contiguous world sections form one horizontal scroll; hero walks left to right, changing style at boundaries.
// Only 3 sections here (Egyptian mural → Monet's Japanese Bridge → 8-bit pixels); full film has 24, see references/11-长卷穿越片.md.
//   Preview index.html?film=demos/long_scroll   Render render.py --film demos/long_scroll --out long_scroll.mp4
// lib/world.js manages timeline, hero travel, forward-only camera, boundary-clipped hero, corner labels; one file per section, segments/<id>.js, calls WORLD.add({...}).
(() => {
  window.__bootErrors = window.__bootErrors || [];
  const base = 'demos/long_scroll/';
  const load = url => { const x = new XMLHttpRequest(); x.open('GET', url, false); x.send(); if (x.status !== 200) { __bootErrors.push(`${url} 不存在 (HTTP ${x.status})`); return; }
    try { (0, eval)(x.responseText + `\n//# sourceURL=${url}`); } catch (e) { __bootErrors.push(`${url} 执行出错 ${e && e.stack || e}`); } };
  load(base + 'lib/crossing.js');                 // XING: character frames, brush textures, Monet world
  load(base + 'lib/acts.js');                     // ACT: stone-skipping trajectories and other mini-script tools
  load(base + 'lib/world.js');                    // WORLD: long-scroll framework
  // Film order: change order/add section here only (add = put a file in segments/, then list its id)
  window.FILM_ORDER = ['02_egypt', '28_monet', '14_8bit'];
  for (const id of window.FILM_ORDER) { const n = WORLD.segs.length; load(`${base}segments/${id}.js`);
    if (WORLD.segs.length === n || WORLD.segs[WORLD.segs.length - 1].id !== id) __bootErrors.push(`segments/${id}.js 没有 WORLD.add({ id: '${id}', ... })`); }
  // Register every section's frame libraries (hero.walk, acts[].key, sprites) as assets, all loaded before engine starts
  const sprites = new Set(); WORLD.segs.forEach(s => { if (s.hero && s.hero.walk) sprites.add(s.hero.walk); (s.acts || []).forEach(a => a.key && sprites.add(a.key)); (s.sprites || []).forEach(k => sprites.add(k)); });
  try { window.EXTRA_ASSETS = (window.EXTRA_ASSETS || []).concat(XING.sprites([...sprites])); } catch (e) { __bootErrors.push('帧库缺失：' + e.message); }
  WORLD.layout();
  window.PUNCH = 0;
  window.ERAS = [{ id: 'film', dur: WORLD.total, draw: (c, lt, t) => WORLD.draw(c, t) }];
})();
