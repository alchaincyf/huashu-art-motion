// Voiceover alignment: TM.cue('s03', '2007年') = start of spoken '2007年' (segment-local seconds, lt).
// TM.end('s03', '2007年') = end of phrase. TM.dur('s03') = segment duration; TM.vo('s03') = [voiceover start, voiceover end] (local seconds).
// Keys must exactly match a subtitle substring in that segment (first occurrence); mistakes console.error and fail rendering.
window.TM = (() => {
  const seg = id => { const s = TIMING.seg[id]; if (!s) throw new Error('TIMING 没有段 ' + id); return s; };
  function find(id, key, which) {
    const s = seg(id), i = s.text.indexOf(key);
    if (i < 0) { console.error(`TM: 段 ${id} 的字幕里没有「${key}」`); return 0; }
    const j = which === 'end' ? i + key.length - 1 : i;
    return which === 'end' ? s.charEnd[j] : s.charStart[j];
  }
  return {
    cue: (id, key) => find(id, key, 'start'),
    end: (id, key) => find(id, key, 'end'),
    dur: id => seg(id).dur,
    vo: id => [seg(id).voStart, seg(id).voEnd],
    text: id => seg(id).text,
  };
})();
