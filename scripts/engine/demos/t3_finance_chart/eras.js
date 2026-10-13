// Demo · finance chart (The Economist / financial channel): “DeepCompute Revenue and Share Price” (8s, three shots; fictional company/data, every shot marked “示意数据”). Grammar card: references/动画语法/t3_finance_chart.md
//   Preview index.html?film=demos/t3_finance_chart   Render render.py --film demos/t3_finance_chart --out t3.mp4
// Shot 2→3: camera pushes around latest share-price point (vector redraw, fixed screen position), entering latest 20 daily candles.
window.PUNCH = 0;
window.SCENE_DIR = 'demos/t3_finance_chart';
window.ERAS = [
  { id: 't3_s1', dur: 2.8 },
  { id: 't3_s2', dur: 2.7, transition: { type: 'slidePush', dur: 0.5, bar: '#E3120B' } },
  { id: 't3_s3', dur: 2.5, transition: { type: 'zoomThrough', dur: 0.6, cx: 1530, cy: 297.65, zoom: 6, live: true, bScale0: 0.6, bg: '#FFFFFF',
      get focus() { return SCENES.t3_s3.focus; } } },                 // focus = latest candle
];
