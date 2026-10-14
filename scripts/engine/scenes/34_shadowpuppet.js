// Chinese shadow puppetry — entirely procedural.
// Pipeline: ① screen (warm oil-lamp pool behind cloth and fabric texture; flickering flame jitters light position/brightness) → ② each leather piece offscreen: translucent color fill → cutouts (destination-out carving)
//      → restore leather edge → multiply entire layer onto screen (transmitted light = screen color × leather color, overlaps naturally darken), offset soft shadow (leather held away from screen)
//      → ③ rivets, control rods (behind screen, slightly blurred) → ④ fabric texture and wooden frame
// Motion: stiff rod-operated joints — each leather piece is rigid and rotates only about rivet; wrist is loose and swings; whole figure sways with main rod; stepped 10fps rhythm.
SCENES['34_shadowpuppet'] = (() => {
  const W = 1920, H = 1080, { clamp, lerp, rng } = U, P = PAINT;
  const RED = '#c0352a', GRN = '#2f7d4c', AMB = '#d99a2e', YEL = '#e2bd4a', EDGE = '#3a160a', BLU = '#2c5a8a', ORG = '#d9782a';
  const step = (t, fps = 10) => U.stepTime(t, fps);   // Rod-operated staccato: 10fps stepping
  // ---------- Carving (destination-out inside clip) ----------
  // P.carve pattern library (roe dots/floral medallions/clouds/grid/incised lines); P.piece (fill→carve→restore leather edge→outline); P.stamp onto screen (soft shadow and multiply)
  const K = P.carve;
  const piece = (g, path, col, carve, edge = 5) => P.piece(g, path, col, carve, { edge, line: EDGE });
  const rivet = (c, x, y, r = 7) => { c.fillStyle = '#2a1006'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.fillStyle = '#b07a3a'; c.beginPath(); c.arc(x - 1, y - 1, r * 0.42, 0, 7); c.fill(); };
  const rod = (c, A, B) => { c.save(); c.filter = 'blur(1.2px)'; c.globalCompositeOperation = 'multiply'; c.strokeStyle = 'rgba(60,30,12,.85)'; c.lineWidth = 5; c.beginPath(); c.moveTo(...A); c.lineTo(...B); c.stroke(); c.restore(); };
  const rot = (p, o, a) => { const c = Math.cos(a), s = Math.sin(a), x = p[0] - o[0], y = p[1] - o[1]; return [o[0] + x * c - y * s, o[1] + x * s + y * c]; };
  const tr = (path, o, a) => { const m = new DOMMatrix().translate(o[0], o[1]).rotate(a * 180 / Math.PI).translate(-o[0], -o[1]); const p = new Path2D(); p.addPath(path, m); return p; };
  const stamp = (c, layer, dx = 7, dy = 5) => P.stamp(c, layer, { dx, dy });

  // ---------- Shadow screen ----------
  function screen(c, t) {
    const ft = step(t, 15), fl = 0.5 * P.noise(ft * 3, 1) + 0.3 * P.noise(ft * 9, 4);
    const cx = 960 + fl * 26, cy = 470 + P.noise(ft * 2, 7) * 18;
    const g = c.createRadialGradient(cx, cy, 30, cx, cy + 40, 1150);
    g.addColorStop(0, `rgb(${255},${246 + fl * 8},${214 + fl * 20})`); g.addColorStop(0.35, '#f2d7a0'); g.addColorStop(0.7, '#cf9a58'); g.addColorStop(1, '#7a4a20');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // Wick hotspot: small brighter pool flickering with flame
    c.save(); c.globalCompositeOperation = 'screen'; const hg = c.createRadialGradient(cx, cy - 10, 0, cx, cy - 10, 260 + fl * 40); hg.addColorStop(0, `rgba(255,236,190,${0.55 + fl * 0.25})`); hg.addColorStop(1, 'rgba(255,236,190,0)'); c.fillStyle = hg; c.fillRect(0, 0, W, H); c.restore();
    // Fabric texture (cached)
    c.save(); c.globalCompositeOperation = 'multiply'; c.drawImage(P.cached('py_weave', W, H, (w) => {
      w.fillStyle = '#fff'; w.fillRect(0, 0, W, H); w.strokeStyle = 'rgba(120,90,50,.08)'; w.lineWidth = 1;
      for (let x = 0; x < W; x += 3) { w.beginPath(); w.moveTo(x, 0); w.lineTo(x, H); w.stroke(); } for (let y = 0; y < H; y += 3) { w.beginPath(); w.moveTo(0, y); w.lineTo(W, y); w.stroke(); }
      w.drawImage(P.grain('pyg', 0.06, [120, 80, 40], 0.3), 0, 0);
    }), 0, 0); c.restore();
    return fl;
  }

  // ---------- Props: window (lattice and plum branch), table (fret-pattern apron), flower vase ----------
  const props = () => P.cached('py_props', W, H, (g) => {
    // Window: outer frame and cracked-ice/square lattice (large cutouts)
    const win = new Path2D(); win.rect(350, 120, 460, 440);
    piece(g, win, '#8a4a22', (q) => {
      q.fillRect(372, 142, 416, 396);
    }, 4);
    g.save(); g.beginPath(); g.rect(372, 142, 416, 396); g.clip();
    g.strokeStyle = '#8a4a22'; g.lineWidth = 9; const r = rng(3);
    for (let x = 372; x <= 788; x += 69) { g.beginPath(); g.moveTo(x, 142); g.lineTo(x, 538); g.stroke(); }
    for (let y = 142; y <= 538; y += 66) { g.beginPath(); g.moveTo(372, y); g.lineTo(788, y); g.stroke(); }
    g.strokeStyle = EDGE; g.lineWidth = 2; for (let x = 372; x <= 788; x += 69) { g.strokeRect(x - 4.5, 142, 9, 396); } for (let y = 142; y <= 538; y += 66) g.strokeRect(372, y - 4.5, 416, 9);
    g.restore();
    // Sill
    piece(g, (() => { const p = new Path2D(); p.rect(326, 556, 508, 26); return p; })(), '#8a4a22', (q) => K.dots(q, 336, 562, 830, 580, 14, 3), 3);
    // Table: top, cutout fret-pattern apron, two legs
    const top = new Path2D(); top.rect(806, 612, 410, 30); piece(g, top, '#9a3a1c', (q) => K.dots(q, 816, 620, 1210, 640, 16, 3));
    const apron = new Path2D(); apron.rect(826, 642, 370, 70); piece(g, apron, '#9a3a1c', (q) => K.lattice(q, 834, 648, 1190, 708, 30, 14));
    [[836, 642], [1076, 642]].forEach(([x, y]) => { const l = new Path2D(); l.moveTo(x, y); l.lineTo(x + 28, y); l.lineTo(x + 24 + (x < 900 ? -6 : 6), 905); l.lineTo(x + 4 + (x < 900 ? -6 : 6), 905); l.closePath(); piece(g, l, '#9a3a1c', (q) => K.dots(q, x + 8, y + 90, x + 22, 890, 30, 4)); });
    // Vase and peony
    const vase = RIG.smooth([[860, 612], [846, 578], [866, 548], [900, 548], [922, 578], [908, 612]]); piece(g, vase, BLU, (q) => K.clouds(q, 852, 560, 916, 608, 26));
    g.strokeStyle = GRN; g.lineWidth = 7; [[878, 548, 850, 480], [890, 548, 920, 470]].forEach(([a, b, c2, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c2, d); g.stroke(); });
    [[850, 474, 30, RED], [922, 462, 34, '#d0506a']].forEach(([x, y, rr, col]) => { const f = new Path2D(); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; f.moveTo(x + Math.cos(a) * rr * 0.5, y + Math.sin(a) * rr * 0.5); f.ellipse(x + Math.cos(a) * rr * 0.6, y + Math.sin(a) * rr * 0.6, rr * 0.45, rr * 0.3, a, 0, 7); }
      piece(g, f, col, (q) => { q.beginPath(); q.arc(x, y, rr * 0.22, 0, 7); q.fill(); K.dots(q, x - rr, y - rr, x + rr, y + rr, 12, 2); }, 3); });
    // Chair: square-backed
    const chair = new Path2D(); chair.rect(1430, 470, 64, 440); piece(g, chair, '#7a3a1a', (q) => K.lattice(q, 1436, 480, 1490, 900, 32, 18), 4);
  });

  return {
    draw(c, lt, t) {
      const fl = screen(c, t);
      const ts = step(t), ls = step(lt);
      stamp(c, props(), 6, 4);
      // Shadow-puppet butterfly outside: wings flap at 12fps (scaleX flip), rod guides it along arc
      { const L = P.scratch('pyBf'), g = L.getContext('2d'); g.reset();
        const q = step(lt, 12), bx = 520 + q * 150, by = 300 - Math.sin(q * 3) * 50, flap = Math.abs(Math.cos(q * 15));
        g.save(); g.translate(bx, by); g.rotate(0.3);
        [-1, 1].forEach(sd => { g.save(); g.scale(sd * (0.25 + flap * 0.75), 1);
          piece(g, RIG.smooth([[0, -4], [40, -46], [74, -30], [62, 4], [30, 10]]), sd > 0 ? RED : GRN, (k) => K.dots(k, 10, -40, 70, 6, 14, 3.5), 3);
          piece(g, RIG.smooth([[0, 4], [34, 14], [46, 44], [16, 40]]), YEL, (k) => K.dots(k, 8, 10, 44, 40, 12, 3), 3); g.restore(); });
        piece(g, (() => { const p = new Path2D(); p.ellipse(0, 6, 7, 22, 0, 0, 7); return p; })(), EDGE, null, 2); g.restore();
        stamp(c, L, 5, 4); rod(c, [bx + 4, by + 24], [780, 1080]); }
      // ---------- Cat ----------
      const ch = P.choreo(lt, t);
      const KT = RIG.cat({ breathe: 0 });
      { const L = P.scratch('pyCat'), g = L.getContext('2d'); g.reset();
        const sway = 0.02 * Math.sin(ts * 5);
        g.save(); g.translate(540, 905); g.rotate(sway); g.translate(-540, -905);
        // Tail: 4 hinged leather segments, each rotates relative to previous with phase lag (whip tip)
        let o = [452, 884], ang = -3.0;
        const segs = [];
        for (let i = 0; i < 4; i++) { ang += 0.3 * Math.sin(ts * 7 - i * 0.9) + (i ? 0.38 : 0); const L_ = 64 - i * 6, e = [o[0] + Math.cos(ang) * L_, o[1] + Math.sin(ang) * L_];
          const p = RIG.taper(o, e, 30 - i * 4, 26 - i * 4); segs.push([p, o, i]); o = e; }
        segs.forEach(([p, oo, i]) => piece(g, p, i === 3 ? '#efe6cc' : ORG, i === 3 ? null : (k) => K.lines(k, [[[oo[0] - 6, oo[1] - 10], [oo[0] + 8, oo[1] + 10]]], 4), 3));
        // Body (orange leather with carved tabby stripes; white belly = cutout leaving edge)
        const body = RIG.smooth(KT.bodyPts);
        piece(g, body, ORG, (k) => {
          k.fill(RIG.smooth([[566, 704], [612, 694], [640, 744], [632, 828], [596, 868], [562, 802]]));       // White chest/belly: entirely cut out
          K.lines(k, [[[448, 742], [492, 752]], [[440, 782], [486, 792]], [[436, 824], [480, 832]], [[500, 692], [524, 718]], [[470, 860], [510, 866]]], 7);
          K.dots(k, 470, 700, 540, 880, 22, 3);
        }, 5);
        g.strokeStyle = EDGE; g.lineWidth = 2.2; g.stroke(RIG.smooth([[566, 704], [612, 694], [640, 744], [632, 828], [596, 868], [562, 802]]));
        // Front leg as one piece (white paw also cut out)
        [[588, 1], [636, 1]].forEach(([x]) => { const leg = RIG.taper([x, 750], [x, 892], 30, 34);
          piece(g, leg, '#f0e4c4', (k) => { k.fillRect(x - 10, 770, 20, 104); }, 4); });                      // White leg/paw: almost entirely cut out, leather edge only
        g.strokeStyle = EDGE; g.lineWidth = 2; [[588], [636]].forEach(([x]) => { g.beginPath(); g.moveTo(x - 8, 892); g.lineTo(x - 8, 880); g.moveTo(x + 4, 892); g.lineTo(x + 4, 880); g.stroke(); });
        g.restore();
        // Head: separate piece, nods about neck rivet (staccato 10fps)
        const nk = [588, 680], nod = 0.1 * Math.sin(ts * 6) + 0.05;
        g.save(); g.translate(540, 905); g.rotate(sway); g.translate(-540, -905);
        g.save(); g.translate(nk[0], nk[1]); g.rotate(nod); g.translate(-nk[0], -nk[1]);
        piece(g, KT.head, ORG, (k) => {
          k.beginPath(); k.ellipse(632, 650, 36, 24, 0, 0, 7); k.fill();                                           // White muzzle cutout
          K.lines(k, [[[585, 572], [590, 598]], [[605, 566], [607, 594]], [[625, 572], [622, 596]]], 6);            // Crown tabby stripes
          k.beginPath(); k.moveTo(598, 612); k.quadraticCurveTo(612, 600, 626, 612); k.quadraticCurveTo(612, 620, 598, 612); k.fill();  // Eyes: willow-leaf cutouts
          k.beginPath(); k.moveTo(636, 610); k.quadraticCurveTo(650, 598, 664, 608); k.quadraticCurveTo(650, 618, 636, 610); k.fill();
          K.clouds(k, 560, 620, 600, 680, 30);
        }, 4);
        g.strokeStyle = EDGE; g.lineWidth = 2; g.beginPath(); g.ellipse(632, 650, 36, 24, 0, 0, 7); g.stroke();
        g.fillStyle = EDGE; g.beginPath(); g.arc(612, 610, 4, 0, 7); g.arc(650, 607, 4, 0, 7); g.fill(); g.beginPath(); g.arc(656, 640, 5, 0, 7); g.fill();
        g.lineWidth = 1.8; [[660, 645, 712, 632], [660, 650, 715, 655]].forEach(([a, b, c2, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c2, d); g.stroke(); });
        g.restore(); g.restore();
        stamp(c, L, 7, 5);
        const nk2 = rot(nk, [540, 905], sway); rivet(c, nk2[0], nk2[1]); segs.forEach(([, oo]) => { const q = rot(oo, [540, 905], sway); rivet(c, q[0], q[1], 5); });
        rod(c, rot([520, 760], [540, 905], sway), [470, 1080]); rod(c, rot([600, 600], [540, 905], sway), [610, 1080]);
      }
      // ---------- Girl ----------
      { const L = P.scratch('pyGirl'), g = L.getContext('2d'); g.reset();
        const cupJ = 0.5 - 0.5 * Math.cos(clamp(ls / 0.85) * Math.PI);           // Rod-operated cup lift: 10fps stepping
        const G = RIG.girl({ cup: cupJ, hair: 'bun' });
        const pivot = [1260, 930], sway = 0.012 * Math.sin(ts * 4.4);
        g.save(); g.translate(...pivot); g.rotate(sway); g.translate(-pivot[0], -pivot[1]);
        // Far green sleeve and hand
        piece(g, G.farSleeve, GRN, (k) => K.clouds(k, 1220, 470, 1360, 630, 34));
        piece(g, G.farHand, '#efe2c4', null, 3);
        // Skirt: long green skirt, vertically carved pleats and roe-dot hem border
        piece(g, G.skirt, GRN, (k) => {
          K.lines(k, [[[1170, 700], [1150, 900]], [[1210, 690], [1196, 910]], [[1250, 680], [1244, 910]], [[1290, 680], [1292, 900]], [[1330, 700], [1340, 790]]], 3.5);
          K.dots(k, 1110, 880, 1360, 920, 14, 3.2); K.flowers(k, 1380, 640, 1450, 760, 40, 4.5);
        });
        // Top: red jacket with carved floral medallions; broad yellow collar/front border
        piece(g, G.torso, RED, (k) => K.flowers(k, 1300, 470, 1420, 610, 44, 5));
        piece(g, RIG.smooth([[1290, 436], [1318, 430], [1316, 470], [1306, 540], [1300, 610], [1286, 610], [1284, 520]]), YEL, (k) => K.dots(k, 1286, 446, 1318, 600, 12, 2.5), 3);
        // Head: hair (amber leather = golden hair, carved clouds) → hollow face (entirely cut out except edge and feature lines) → headdress (forehead ornament, pins, dangling beads)
        const nk = G.A.neck, hTilt = 0.06 * Math.sin(ts * 3);                     // Head rotates slightly about neck rivet
        g.save(); g.translate(...nk); g.rotate(hTilt); g.translate(-nk[0], -nk[1]);
        piece(g, G.hairBack, AMB, (k) => K.clouds(k, 1290, 300, 1420, 440, 30));
        piece(g, G.bun, AMB, (k) => K.clouds(k, 1360, 340, 1420, 404, 22));
        g.save(); g.globalCompositeOperation = 'destination-out'; g.fill(G.face); g.restore();
        g.strokeStyle = EDGE; g.lineWidth = 3; g.stroke(G.face);
        g.strokeStyle = AMB; g.lineWidth = 7; g.save(); g.clip(G.face); g.stroke(G.face); g.restore();
        piece(g, G.bangs, AMB, (k) => K.clouds(k, 1250, 296, 1340, 360, 24));
        // Features: upturned slender phoenix eyes, willow-leaf brows, dotted lips — all retained leather lines
        const e = G.eye; g.strokeStyle = EDGE; g.lineWidth = 2.6; g.beginPath(); g.moveTo(e.x - 12, e.y + 1); g.quadraticCurveTo(e.x, e.y - 6, e.x + 16, e.y - 4); g.stroke();
        g.lineWidth = 2; g.beginPath(); g.moveTo(e.x - 10, e.y + 2); g.quadraticCurveTo(e.x, e.y + 4, e.x + 12, e.y - 1); g.stroke();
        g.fillStyle = EDGE; g.beginPath(); g.arc(e.x - 2, e.y - 1, 2.6, 0, 7); g.fill();
        g.lineWidth = 2.4; g.stroke(G.brow);
        g.fillStyle = RED; g.beginPath(); g.arc(G.lips[1][0] - 1, G.lips[1][1] + 2, 4, 0, 7); g.fill();
        // Headdress: large crown flower, two hairpins, dangling ornaments
        const ht = G.A.headTop; const flw = new Path2D(); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; flw.moveTo(ht[0] + 20 + Math.cos(a) * 26, ht[1] + 6 + Math.sin(a) * 26); flw.arc(ht[0] + 20 + Math.cos(a) * 18, ht[1] + 6 + Math.sin(a) * 18, 12, 0, 7); }
        piece(g, flw, RED, (k) => { k.beginPath(); k.arc(ht[0] + 20, ht[1] + 6, 7, 0, 7); k.fill(); }, 3);
        g.strokeStyle = BLU; g.lineWidth = 5; g.beginPath(); g.moveTo(ht[0] + 40, ht[1] + 30); g.lineTo(ht[0] + 110, ht[1] - 10); g.stroke(); g.strokeStyle = EDGE; g.lineWidth = 1.6; g.stroke();
        const sw = 0.4 * Math.sin(ts * 9);                                         // Dangling beads swing with head movement
        g.fillStyle = YEL; g.strokeStyle = EDGE; g.lineWidth = 1.5; for (let k = 0; k < 4; k++) { const bx = ht[0] + 108 + Math.sin(sw) * k * 11, by = ht[1] - 4 + Math.cos(sw) * k * 11; g.beginPath(); g.arc(bx, by, 5, 0, 7); g.fill(); g.stroke(); }
        g.restore();
        // Near arm: upper arm/forearm/hand are three rigid riveted pieces; loose wrist swings
        const S = G.A.shoulder, E = G.A.elbow, Hd = G.A.hand;
        piece(g, RIG.taper(S, E, 50, 42), RED, (k) => K.clouds(k, Math.min(S[0], E[0]) - 30, Math.min(S[1], E[1]) - 30, Math.max(S[0], E[0]) + 30, Math.max(S[1], E[1]) + 30, 30));
        const Wr = [lerp(E[0], Hd[0], 0.8), lerp(E[1], Hd[1], 0.8)];
        piece(g, RIG.taper(E, Wr, 44, 50), RED, (k) => K.flowers(k, Math.min(E[0], Wr[0]) - 30, Math.min(E[1], Wr[1]) - 30, Math.max(E[0], Wr[0]) + 30, Math.max(E[1], Wr[1]) + 30, 36, 4));
        piece(g, RIG.taper([lerp(E[0], Hd[0], 0.66), lerp(E[1], Hd[1], 0.66)], Wr, 52, 58), YEL, (k) => K.dots(k, Wr[0] - 40, Wr[1] - 40, Wr[0] + 40, Wr[1] + 40, 10, 2.2), 3);
        const dangle = 0.35 * Math.sin(ls * 11) * (1 - cupJ * 0.6);
        g.save(); g.translate(...Wr); g.rotate(dangle); g.translate(-Wr[0], -Wr[1]);
        const hand = new Path2D(); hand.ellipse(Hd[0], Hd[1], 17, 13, Math.atan2(Hd[1] - E[1], Hd[0] - E[0]), 0, 7);
        g.save(); g.globalCompositeOperation = 'destination-out'; g.fill(hand); g.restore(); g.strokeStyle = EDGE; g.lineWidth = 2.6; g.stroke(hand);   // Hand is hollow too
        const cp = G.cup, cup = RIG.smooth([[cp.x - 24, cp.y], [cp.x - 20, cp.y + 34], [cp.x, cp.y + 42], [cp.x + 20, cp.y + 34], [cp.x + 24, cp.y]]);
        piece(g, tr(cup, [cp.x, cp.y], cp.tilt), BLU, (k) => K.flowers(k, cp.x - 30, cp.y, cp.x + 30, cp.y + 44, 24, 3.5), 3);
        g.restore();
        g.restore();
        stamp(c, L, 8, 5);
        // Rivets and rods: neck, shoulder, elbow, wrist; main rod at neck, hand rod at wrist
        const R = p => rot(p, pivot, sway);
        [nk, S, E, Wr].forEach(p => { const q = R(p); rivet(c, q[0], q[1]); });
        rod(c, R(nk), [1420, 1080]); rod(c, R(Wr), [1180, 1080]); rod(c, [1170, 615], [1060, 1080]);
        // Steam: carved cloud-pattern leather strip, floating with cup
        const sx = G.cup.x, sy = G.cup.y - 20;
        c.save(); c.globalCompositeOperation = 'multiply'; c.strokeStyle = 'rgba(160,110,60,.55)'; c.lineWidth = 5; c.lineCap = 'round';
        for (let k = 0; k < 2; k++) { c.beginPath(); for (let i = 0; i <= 14; i++) { const q = i / 14; const x = sx + k * 14 + Math.sin(q * 6 - ts * 6 + k) * 8, y = sy - q * 60; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); } c.restore();
      }
      // Wooden frame (screen edge)
      c.drawImage(P.cached('py_frame', W, H, (g) => {
        g.fillStyle = '#2a140a'; g.beginPath(); g.rect(0, 0, W, H); g.rect(28, 24, W - 56, H - 48); g.fill('evenodd');
        g.strokeStyle = '#a8742e'; g.lineWidth = 3; g.strokeRect(34, 30, W - 68, H - 60);
        const vg = g.createRadialGradient(960, 500, 500, 960, 540, 1150); vg.addColorStop(0, 'rgba(40,15,0,0)'); vg.addColorStop(1, 'rgba(40,15,0,.45)'); g.fillStyle = vg; g.fillRect(28, 24, W - 56, H - 48);
      }), 0, 0);
    },
  };
})();
