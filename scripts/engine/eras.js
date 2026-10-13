// Code-only version: each era drawn procedurally by scenes/<id>.js draw(c, lt, t).
// 15 eras +2026 ending. eighths = eighth notes per segment (128 BPM, see references/风格配方/_音轨_艺术史速通.md).
const R = 1866;                                   // Right-aligned baseline
const box = (x0, y0, x1, y1, fill, stroke, lw = 4, inset = 0) => c => {
  c.save(); c.fillStyle = fill; c.fillRect(x0, y0, x1 - x0, y1 - y0);
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.strokeRect(x0 + inset, y0 + inset, x1 - x0 - 2 * inset, y1 - y0 - 2 * inset); }
  c.restore();
};
// Original-film recreation: fixed year plate, continuously rolling digits; old/new counters transition with both layers (engine default hard-cuts at midpoint, see drawCounter)
window.COUNTER_IN_TRANSITION = 'layers';
window.ERAS = [
 { id: '01_cave', eighths: 6, 
   counter: { year: -40000, roll: 0, x: R, y: 114, size: 84, font: 'GochiHand-400', color: '#f3ead8', spacing: 14,
     suffix: { text: 'BC', size: 44, gap: 18, dy: 0 }, label: { text: 'Cave painting', font: '38px "Kalam-700"', color: '#efe4cf', y: 178 } } },
 { id: '02_egypt', eighths: 4, transition: { type: 'tiles', dur: 0.42, delay: 0 },
   counter: { year: -1350, roll: 0.45, x: R, y: 129, size: 100, font: 'IMFellEnglish-400', color: '#6b2318', spacing: 6,
     suffix: { text: 'BC', size: 50, gap: 14 }, label: { text: 'Egyptian wall painting', font: '34px "EBGaramond-400"', color: '#4a3424', y: 186 } } },
 { id: '03_greek', eighths: 4, transition: { type: 'cube', dur: 0.32, delay: 0 },
   counter: { year: -530, roll: 0.47, x: 1855, y: 136, size: 98, font: 'Cinzel-700', color: '#e3a066',
     box: box(1544, 42, 1888, 208, '#1b1310', '#c8743c', 3, 4),
     suffix: { text: 'BC', size: 48, gap: 14 }, label: { text: 'ATTIC BLACK-FIGURE', font: '29px "Cinzel-700"', color: '#e8b27c', x: 1855, y: 184, spacing: 2 } } },
 { id: '04_roman', eighths: 4, transition: { type: 'mosaic', dur: 0.38, delay: 0 },
   counter: { year: 79, roll: 0.43, x: 1852, y: 132, size: 96, font: 'Cinzel-400', color: '#1d1a17',
     box: box(1607, 40, 1888, 208, '#f4ede0', '#2b2724', 4, 0),
     suffix: { text: 'AD', size: 46, gap: 18 }, label: { text: 'ROMAN MOSAIC', font: '26px "Cinzel-400"', color: '#2b2724', x: 1860, y: 182, spacing: 2 } } },
 { id: '05_gothic', eighths: 4, transition: { type: 'pageTurn', dur: 0.32, delay: 0 },
   counter: { year: 1290, roll: 0.45, x: R, y: 134, size: 100, font: 'LibreBaskerville-700', color: '#b3222b',
     label: { text: 'Gothic illumination', font: '36px "IMFellEnglish-400"', color: '#2b211a', y: 184 } } },
 { id: '06_renaissance', eighths: 4, transition: { type: 'godRays', dur: 0.4, delay: 0, cx: 560, cy: 290 },
   counter: { year: 1503, roll: 0.42, x: R, y: 142, size: 104, font: 'CormorantGaramond-500', color: '#ece0bf', spacing: 22,
     label: { text: 'HIGH RENAISSANCE', font: '30px "Cinzel-700"', color: '#e7d9b4', y: 184, spacing: 2 } } },
 { id: '08_impressionism', eighths: 3, transition: { type: 'dabs', dur: 0.28, delay: 0 },
   counter: { year: 1874, roll: 0.37, x: R, y: 139, size: 104, font: 'PlayfairDisplay-400i', color: '#5a4f9a',
     label: { text: 'Impressionism', font: '30px "EBGaramond-600"', color: '#6a5a9a', y: 182 } } },
 { id: '09_postimp', eighths: 3, transition: { type: 'swirl', dur: 0.28, delay: 0, cx: 560, cy: 340 },
   counter: { year: 1889, roll: 0.34, x: R, y: 134, size: 104, font: 'LilitaOne-400', color: '#f5d03b', shadow: { color: '#2a2a6a', x: 3, y: 4 },
     label: { text: 'Post-Impressionism', font: '34px "LilitaOne-400"', color: '#f5d03b', y: 182, shadow: { color: '#2a2a6a', x: 2, y: 3 } } } },
 { id: '10_nouveau', eighths: 3, transition: { type: 'organic', dur: 0.24, delay: 0, cx: 1330, cy: 320 },
   counter: { year: 1896, roll: 0.37, x: R, y: 134, size: 96, font: 'LibreBaskerville-700', color: '#3a2a1c',
     label: { text: 'ART NOUVEAU POSTER', font: '29px "EBGaramond-600"', color: '#3a2a1c', y: 182, spacing: 3 } } },
 { id: '11_cubism', eighths: 2, transition: { type: 'shards', dur: 0.24, delay: 0 },
   counter: { year: 1912, roll: 0.23, x: R, y: 134, size: 98, font: 'AlfaSlabOne-400', color: '#1e1b18', spacing: 4,
     label: { text: 'CUBISM', font: '27px "AlfaSlabOne-400"', color: '#1e1b18', y: 182, spacing: 3 } } },
 { id: '12_bauhaus', eighths: 2, transition: { type: 'bauhaus', dur: 0.2, delay: 0, cx: 1330, cy: 590 },
   counter: { year: 1923, roll: 0.2, x: R, y: 134, size: 104, font: 'ArchivoBlack-400', color: '#151515',
     label: { text: 'bauhaus', font: '36px "Poppins-800"', color: '#c4202b', y: 184 } } },
 { id: '13_pop', eighths: 2, transition: { type: 'zigzag', dur: 0.16, delay: 0 },
   counter: { year: 1962, roll: 0.22, x: 1852, y: 144, size: 104, font: 'Anton-400', color: '#111',
     box: c => { c.save(); c.fillStyle = '#111'; c.fillRect(1637, 40, 253, 170); c.fillStyle = '#f7e23a'; c.fillRect(1643, 46, 241, 158); c.restore(); },
     label: { text: 'POP ART', font: '30px "Anton-400"', color: '#111', x: 1852, y: 192, spacing: 1 } } },
 { id: '14_8bit', eighths: 1, transition: { type: 'pixelate', dur: 0.12, delay: 0 },
   counter: { year: 1985, roll: 0.07, x: R + 4, y: 86, size: 60, font: 'PressStart2P-400', color: '#ffffff', shadow: { color: '#0b1d24', x: 4, y: 4 },
     label: { text: '8-BIT', font: '30px "PressStart2P-400"', color: '#ffffff', y: 138, shadow: { color: '#0b1d24', x: 3, y: 3 } } } },
 { id: '15_raytrace', eighths: 1, transition: { type: 'wireframe', dur: 0.14, delay: 0 },
   counter: { year: 1993, roll: 0.07, x: R, y: 129, size: 104, font: 'Exo2-800i', color: '#ffffff', shadow: { color: '#d23aa6', x: 5, y: 5 },
     label: { text: 'RAY-TRACED CGI', font: '30px "Exo2-800i"', gradient: ['#ffd84a', '#f08a2a'], y: 182, shadow: { color: '#7a2a7a', x: 2, y: 2 } } } },
 { id: '16_2026', eighths: 1 + 9 + 8, dur: 4.28, finale: true, transition: { type: 'iris', dur: 0.183, delay: 0 },
   counter: { year: 2026, roll: 0.4, x: R, y: 132, size: 100, font: 'Poppins-800', color: '#232a5c',
     label: { text: 'Flat vector illustration', font: '30px "Poppins-600"', color: '#e2554e', y: 182 } } },
];
