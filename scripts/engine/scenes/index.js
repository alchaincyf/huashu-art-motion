// Load scenes/<id>.js by id; auto-load transitions/<type>.js by transition.type (synchronous XHR ensures registration before engine starts).
// Any missing scene file, syntax error, failed registration, or transition name absent from both TRANSITIONS and transitions/ → record in window.__bootErrors,
// engine refuses to start; render.py/qa.py exit with an error.
// (Migration test B exposed this: missing scenes previously rendered a placeholder for 1.2 seconds on gray, found only by 0.0% frame difference; misspelled transitions silently fell back to crossfade.)
(() => {
  window.SCENES = window.SCENES || {}; window.__bootErrors = [];
  const load = (url) => { const x = new XMLHttpRequest(); x.open('GET', url, false); try { x.send(); } catch (err) { return { err: `请求失败 ${err}` }; }
    if (x.status !== 200) return { err: `${url} 不存在 (HTTP ${x.status})` };
    try { (0, eval)(x.responseText + `\n//# sourceURL=${url}`); } catch (err) { return { err: `${url} 执行出错 ${err && err.stack || err}` }; } return {}; };
  // Films may first load shared scripts (window.SCENE_LIBS, in order); scene directory is window.SCENE_DIR (default scenes).
  // Sections already registered as SCENES[id] by shared scripts need no separate scene file (demos/ films use this arrangement).
  for (const f of window.SCENE_LIBS || []) { const r = load(f); if (r.err) __bootErrors.push(`共用脚本 ${r.err}`); }
  const dir = window.SCENE_DIR || 'scenes';
  for (const e of ERAS) {
    if (!e.draw) {                                          // Eras with inline draw need no file
      const r = SCENES[e.id] ? {} : load(`${dir}/${e.id}.js`);
      if (r.err) { __bootErrors.push(`${e.id}: ${r.err}`); continue; }
      const sc = SCENES[e.id];
      if (!sc || typeof sc.draw !== 'function') { __bootErrors.push(`${e.id}: 文件里没有 SCENES['${e.id}'] = { draw(c, lt, t) }`); continue; }
      e.draw = sc.draw; if (sc.init) e.init = sc.init;
    }
    const ty = e.transition && e.transition.type;
    if (ty && !TRANSITIONS[ty]) {                            // Project transitions: place in transitions/<type>.js and attach same-named function to TRANSITIONS
      const r = load(`transitions/${ty}.js`);
      if (r.err || !TRANSITIONS[ty]) __bootErrors.push(`${e.id}: 转场「${ty}」不在 transitions.js 里，也没有 transitions/${ty}.js（${r.err || '文件里没注册 TRANSITIONS.' + ty}）`);
    }
  }
})();
