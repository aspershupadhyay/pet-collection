/* The original Petcraft cast. Each character is a draw(g, P) function over a
   pose P; the shared action timelines below turn poses into moves.

   Pose P:
     oy     vertical offset (+ down, - up)       sq   squash (breath / landing)
     eyes   'open' | 'shut' | 'happy'            leg  -1..1 stepping phase
     arm    0..2 raise                            lean -1..1 forward lean
     lie    lying down                            z    frame index for sleep Zs
     ball   ball height (null = no ball)          sp   special progress 0..1
     t      frame index                           flick little wobble -1..1 */

import { FLOOR } from './engine.mjs';

const zGlyph = (g, x, y) => g.px([[x, y], [x + 1, y], [x + 2, y], [x + 1, y + 1], [x, y + 2], [x + 1, y + 2], [x + 2, y + 2]], 'zz');

export function sleepZs(g, P, x = 33, y = 14) {
  const k = P.t % 8;
  zGlyph(g, x + Math.floor(k / 3), y - Math.floor(k / 2));
  if (k > 3) zGlyph(g, x + 5, y - 6 - Math.floor((k - 4) / 2));
}

export function ball(g, P, x = 41) {
  if (P.ball == null) return;
  const y = FLOOR - 3 - P.ball;
  g.ell(x, y, 3.2, P.ball === 0 ? 2.6 : 3.2, 'ball');
  g.set(x - 1, y - 1.5, 'shine');
}

/* ───────────────────────────── Miso · cat ───────────────────────────── */
const miso = (g, P) => {
  const oy = P.oy;
  if (P.lie) {
    // curled loaf with the tail wrapped round
    for (let i = 0; i < 9; i++) g.ell(31 + i * 0.9, FLOOR - 2 - Math.sin(i / 3) * 1.5, 1.8, 1.8, 'body');
    g.ell(26, FLOOR - 5, 12, 5.5, 'body');
    g.clipEll(25, FLOOR - 3, 7, 3, 'belly', ['body']);
    const h = FLOOR - 9;
    g.ell(17, h, 8.5, 7, 'body');
    g.poly([[9.5, h - 3], [11, h - 11], [15.5, h - 5]], 'body');
    g.poly([[18.5, h - 5], [23, h - 11], [24.5, h - 3]], 'body');
    g.poly([[11.5, h - 5], [12.3, h - 8.5], [14, h - 5.5]], 'extra');
    g.poly([[20.5, h - 5.5], [22.3, h - 8.5], [22.8, h - 5]], 'extra');
    g.clipEll(17, h + 3, 3.6, 2.2, 'belly', ['body']);
    g.eye(12, h - 1, 'shut');
    g.eye(19, h - 1, 'shut');
    g.px([[16, h + 1], [17, h + 1]], 'nose');
    g.px([[11, h + 2], [22, h + 2]], 'blush');
    sleepZs(g, P, 30, 16);
    return;
  }
  const sway = Math.round(Math.sin(P.t * 0.8) * 1.5);
  // tail (behind)
  for (let i = 0; i < 10; i++) {
    const tt = i / 9;
    const a = -0.3 + tt * 2.2;
    g.ell(33 + Math.sin(a) * 5 + (tt > 0.6 ? sway : 0), FLOOR - 2 - (1 - Math.cos(a)) * 5 - tt * 3, 1.8, 1.8, 'body');
  }
  // body
  const by = FLOOR - 7 + oy;
  g.ell(24 + P.lean, by + (P.sq ? 0.5 : 0), 9 + (P.sq ? 0.8 : 0), 7.2 - (P.sq ? 0.6 : 0), 'body');
  g.clipEll(24 + P.lean, by + 1, 5, 5.5, 'belly', ['body']);
  // paws
  const lp = P.leg > 0 ? -2 : 0;
  const rp = P.leg < 0 ? -2 : 0;
  g.ell(19 + P.lean, FLOOR - 1 + lp + Math.min(0, oy), 2.6, 1.7, 'belly');
  g.ell(29 + P.lean, FLOOR - 1 + rp + Math.min(0, oy), 2.6, 1.7, 'belly');
  // raised paw
  if (P.arm) {
    const ax = 31 + P.arm * 2;
    const ay = FLOOR - 9 - P.arm * 4 + oy;
    g.ell(ax - 1.5, ay + 2.5, 1.8, 3, 'body');
    g.ell(ax, ay, 2.4, 2.2, 'belly');
  }
  // head
  const hx = 24 + P.lean;
  const h = FLOOR - 19 + oy;
  g.ell(hx, h, 10, 8.4, 'body');
  const earBack = P.lean > 0 ? 1 : 0;
  g.poly([[hx - 9.5, h - 3], [hx - 7.5 - earBack, h - 12.5], [hx - 2.5, h - 6.5]], 'body');
  g.poly([[hx + 2.5, h - 6.5], [hx + 7.5 + earBack, h - 12.5], [hx + 9.5, h - 3]], 'body');
  g.poly([[hx - 7.5, h - 5], [hx - 6.8, h - 9.5], [hx - 4.5, h - 6]], 'extra');
  g.poly([[hx + 4.5, h - 6], [hx + 6.8, h - 9.5], [hx + 7.5, h - 5]], 'extra');
  if (P.stripes) {
    g.px([[hx, h - 8], [hx, h - 7], [hx - 2, h - 7], [hx + 2, h - 7], [hx - 1, h - 6], [hx + 1, h - 6]], 'detail');
    g.px([[hx - 9, h], [hx - 8, h], [hx + 8, h], [hx + 9, h], [hx - 9, h + 2], [hx + 9, h + 2]], 'detail');
  }
  g.clipEll(hx, h + 3.2, 4.2, 2.6, 'belly', ['body', 'detail']);
  const yawn = P.sp > 0.25 && P.sp < 0.8;
  const eyes = yawn ? 'shut' : P.eyes;
  g.eye(hx - 6, h - 2, eyes);
  g.eye(hx + 4, h - 2, eyes);
  g.px([[hx - 1, h + 1], [hx, h + 1]], 'nose');
  if (yawn) g.rect(hx - 1, h + 3, hx, h + 4, 'mouth');
  else g.px([[hx - 2, h + 2], [hx - 1, h + 3], [hx, h + 3], [hx + 1, h + 2]], 'ink');
  g.px([[hx - 8, h + 2], [hx - 7, h + 2], [hx + 7, h + 2], [hx + 8, h + 2]], 'blush');
  ball(g, P);
};

/* ───────────────────────── Moku · forest spirit ───────────────────────── */
const moku = (g, P) => {
  const oy = P.oy;
  const lie = P.lie;
  const cy = lie ? FLOOR - 8 : FLOOR - 12 + oy;
  const rx = lie ? 15 : 13 + (P.sq ? 0.8 : 0);
  const ry = lie ? 8.5 : 12.4 - (P.sq ? 0.8 : 0);
  const top = Math.round(cy - ry);
  // sprout (behind head top), sways
  const sw = Math.round(Math.sin(P.t * 0.9) * 1);
  g.rect(24, top - 3, 24, top, 'extra');
  g.ell(21.3 + sw, top - 4, 2.6, 1.5, 'accent');
  g.ell(26.7 + sw, top - 5, 2.6, 1.5, 'accent');
  if (P.sp > 0.3) {
    // the sprout blooms
    const f = top - 8;
    g.px([[23, f], [25, f], [24, f - 1], [24, f + 1], [23, f - 1], [25, f + 1]], 'flower');
    g.set(24, f, 'shine');
  }
  // twig arms
  const armL = [[11, cy], [10, cy - 1], [9, cy - 2], [8, cy - 2]];
  const lift = P.arm;
  const armR = [[37, cy], [38, cy - 1 - lift], [39, cy - 2 - lift * 2], [40, cy - 2 - lift * 3]];
  if (!lie) {
    g.px(armL, 'extra');
    g.px(armR, 'extra');
    g.set(8, cy - 3, 'accent');
    g.set(40, cy - 3 - lift * 3, 'accent');
  }
  g.ell(24, cy, rx, ry, 'body');
  // moss cap on the head
  g.clipEll(24, top + 1, rx - 3, 4, 'detail', ['body']);
  g.clipEll(16, cy - 6, 1.6, 1.6, 'spot', ['body', 'detail']);
  g.clipEll(31, cy - 8, 1.3, 1.3, 'spot', ['body', 'detail']);
  g.clipEll(33, cy - 3, 1, 1, 'spot', ['body']);
  // face
  g.clipEll(24, cy + 1, 8.5, 6.5, 'belly', ['body']);
  const ey = Math.round(cy - 2);
  const eyes = lie ? 'shut' : P.eyes;
  g.eye(18, ey, eyes, eyes === 'open' ? 'lg' : 'md');
  g.eye(27, ey, eyes, eyes === 'open' ? 'lg' : 'md');
  g.px([[16, ey + 5], [17, ey + 5], [31, ey + 5], [32, ey + 5]], 'blush');
  g.px([[23, ey + 6], [24, ey + 6], [22, ey + 5], [25, ey + 5]], 'ink');
  // stubby feet
  if (!lie) {
    const lf = P.leg > 0 ? -1 : 0;
    const rf = P.leg < 0 ? -1 : 0;
    g.ell(18, FLOOR + lf + Math.min(0, oy), 3.4, 1.4, 'extra');
    g.ell(30, FLOOR + rf + Math.min(0, oy), 3.4, 1.4, 'extra');
  }
  if (lie) sleepZs(g, P, 34, 12);
  ball(g, P, 42);
};

/* ───────────────────────────── Beep · desk bot ───────────────────────────── */
const HEART = [[1, 0], [2, 0], [4, 0], [5, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [2, 4], [3, 4], [4, 4], [3, 5]];
const beep = (g, P) => {
  const oy = P.lie ? 3 : P.oy;
  const x0 = 14 + P.lean;
  const top = FLOOR - 31 + oy;
  // antenna
  g.rect(24 + P.lean, top - 3, 24 + P.lean, top - 1, 'extra');
  g.ell(24 + P.lean, top - 4.5, 1.7, 1.7, P.lie || P.t % 4 > 1 ? 'lightoff' : 'light');
  // monitor head
  g.rect(x0, top, x0 + 20, top + 18, 'body');
  [[0, 0], [20, 0], [0, 18], [20, 18]].forEach(([dx, dy]) => g.set(x0 + dx, top + dy, null));
  g.rect(x0 + 2, top + 2, x0 + 18, top + 14, 'screen');
  g.px([[x0 + 2, top + 2], [x0 + 18, top + 2], [x0 + 2, top + 14], [x0 + 18, top + 14]], 'body');
  g.rect(x0 + 15, top + 16, x0 + 17, top + 16, 'accent'); // power light
  g.set(x0 + 3, top + 16, 'detail');
  // face on screen
  const fx = x0 + 10;
  const fy = top + 6;
  if (P.sp > 0.25 && P.sp < 0.85) g.px(HEART.map(([x, y]) => [fx - 3 + x, fy - 1 + y]), 'heart');
  else if (P.lie || P.eyes === 'shut') {
    g.rect(fx - 6, fy + 2, fx - 4, fy + 2, 'glow');
    g.rect(fx + 4, fy + 2, fx + 6, fy + 2, 'glow');
  } else if (P.eyes === 'happy') {
    g.px([[fx - 6, fy + 2], [fx - 5, fy + 1], [fx - 4, fy + 2], [fx + 4, fy + 2], [fx + 5, fy + 1], [fx + 6, fy + 2]], 'glow');
    g.px([[fx - 2, fy + 5], [fx - 1, fy + 6], [fx, fy + 6], [fx + 1, fy + 6], [fx + 2, fy + 5]], 'glow');
  } else {
    g.rect(fx - 6, fy, fx - 4, fy + 3, 'glow');
    g.rect(fx + 4, fy, fx + 6, fy + 3, 'glow');
    g.px([[fx - 1, fy + 6], [fx, fy + 6], [fx + 1, fy + 6]], 'glow');
  }
  // neck, body, arms
  const by = top + 19;
  g.rect(22 + P.lean, by, 26 + P.lean, by + 1, 'extra');
  g.rect(17 + P.lean, by + 2, 31 + P.lean, by + 8 - (P.lie ? 3 : 0), 'accent');
  g.px([[20 + P.lean, by + 4], [22 + P.lean, by + 4]], 'detail');
  g.set(28 + P.lean, by + 4, 'light');
  const ay = by + 3;
  g.px([[16, ay], [15, ay + 1], [14, ay + 2]], 'extra');
  g.set(13, ay + 3, 'detail');
  const lift = P.arm;
  g.px([[32, ay - lift], [33, ay - 1 - lift * 2], [34, ay - 2 - lift * 3]], 'extra');
  g.set(35, ay - 3 - lift * 3, 'detail');
  // wheels
  if (!P.lie) {
    const wb = P.leg ? 1 : 0;
    g.ell(19, FLOOR - 1 + Math.min(0, oy) - (P.leg > 0 ? wb : 0), 3, 2, 'extra');
    g.ell(29, FLOOR - 1 + Math.min(0, oy) - (P.leg < 0 ? wb : 0), 3, 2, 'extra');
  }
  if (P.lie) sleepZs(g, P, 36, 8);
  ball(g, P, 42);
};

/* ───────────────────────────── Hoot · owl ───────────────────────────── */
const hoot = (g, P) => {
  const oy = P.oy;
  const puff = P.lie ? 1.2 : 0;
  const cy = FLOOR - 12 + oy;
  // wings behind, flap outward with arm
  const fl = P.arm;
  g.ell(13.5 - fl * 2, cy + 1 - fl * 3, 3.2, 6.5 - fl, 'detail');
  g.ell(34.5 + fl * 2, cy + 1 - fl * 3, 3.2, 6.5 - fl, 'detail');
  // ear tufts
  const top = cy - 12;
  g.poly([[14, top + 5], [15, top - 1], [20, top + 4]], 'body');
  g.poly([[28, top + 4], [33, top - 1], [34, top + 5]], 'body');
  g.ell(24, cy, 11 + puff, 12.4 + (P.sq ? -0.6 : 0), 'body');
  // chest with feather marks
  g.clipEll(24, cy + 5, 7, 6.2, 'belly', ['body']);
  [[21, cy + 4], [25, cy + 4], [23, cy + 7], [27, cy + 7], [20, cy + 7]].forEach(([x, y]) => g.px([[x, y], [x + 1, y + 1], [x + 2, y]], 'detail'));
  // face discs + eyes
  const ey = cy - 5;
  g.clipEll(19, ey, 4.8, 4.6, 'face', ['body']);
  g.clipEll(29, ey, 4.8, 4.6, 'face', ['body']);
  const wink = P.sp > 0.3 && P.sp < 0.7;
  const eyes = P.lie ? 'shut' : P.eyes;
  const drawEye = (x, style) => {
    if (style === 'open') {
      g.ell(x, ey, 2.8, 2.8, 'eyewhite');
      g.rect(x - 1, ey - 1, x, ey + 1, 'ink');
      g.set(x - 1, ey - 1, 'shine');
    } else g.eye(x - 1.5, ey - 2, style);
  };
  drawEye(19, wink ? 'happy' : eyes);
  drawEye(29, eyes);
  // beak
  g.poly([[22.5, ey + 2], [25.5, ey + 2], [24, ey + 5]], 'accent');
  // feet
  g.px([[20, FLOOR], [21, FLOOR], [22, FLOOR], [26, FLOOR], [27, FLOOR], [28, FLOOR]], 'accent');
  if (P.leg > 0) g.px([[20, FLOOR], [21, FLOOR], [22, FLOOR]], null);
  if (P.leg < 0) g.px([[26, FLOOR], [27, FLOOR], [28, FLOOR]], null);
  if (P.lie) sleepZs(g, P, 34, 10);
  ball(g, P, 42);
};

/* ───────────────────────────── Ember · fire sprite ───────────────────────────── */
const ember = (g, P) => {
  const lie = P.lie;
  const hover = lie ? 0 : -2 + (P.t % 4 < 2 ? 0 : -1);
  const oy = P.oy + hover;
  const cy = FLOOR - 8 + oy;
  const f = P.flick;
  const tall = lie ? 8 : P.sp > 0.2 && P.sp < 0.85 ? 26 : 20 + (P.sq ? -2 : 0);
  const r = lie ? 10 : 9;
  g.ell(24, cy, r, lie ? 6 : 8.5, 'body');
  g.poly([[24 - r + 1, cy - 2], [24 + f * 2, cy - tall], [24 + r - 1, cy - 2]], 'body');
  // side licks
  g.poly([[15, cy - 1], [12 - f, cy - 8], [18, cy - 4]], 'body');
  g.poly([[30, cy - 4], [36 - f, cy - 9 + f], [33, cy - 1]], 'body');
  // hotter layers
  g.clipEll(24, cy + 1, r - 3.5, (lie ? 6 : 8.5) - 2.5, 'belly', ['body']);
  g.poly([[19, cy - 2], [24 + f, cy - tall + 7], [29, cy - 2]], 'belly');
  g.clipEll(24, cy + 2.5, 3, 3, 'extra', ['belly']);
  // sparks
  if (!lie) {
    const s = P.t % 6;
    g.set(14 + (s % 2), cy - 10 - s * 2, 'accent');
    g.set(34 - (s % 2), cy - 14 - ((s + 3) % 6) * 2, 'accent');
  }
  const eyes = lie ? 'shut' : P.eyes;
  g.eye(19, cy - 3, eyes);
  g.eye(27, cy - 3, eyes);
  g.px([[23, cy + 1], [24, cy + 1], [25, cy + 1]], 'ink');
  g.px([[17, cy + 1], [31, cy + 1]], 'blush');
  if (lie) sleepZs(g, P, 33, 18);
  ball(g, P, 42);
};

/* ───────────────────────────── Puff · cloud sheep ───────────────────────────── */
const puff = (g, P) => {
  const lie = P.lie;
  const float = P.sp > 0.2 && P.sp < 0.85 ? -5 : 0;
  const oy = P.oy + float;
  const cy = FLOOR - (lie ? 8 : 13) + oy;
  // legs
  if (!lie) {
    const l = P.leg;
    g.rect(18, cy + 6, 19, FLOOR - (l > 0 ? 2 : 0) + Math.min(0, oy), 'extra');
    g.rect(29, cy + 6, 30, FLOOR - (l < 0 ? 2 : 0) + Math.min(0, oy), 'extra');
  }
  // scalloped wool
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    g.ell(24 + Math.cos(a) * 9.5, cy + Math.sin(a) * (lie ? 5 : 6.5), 4.6, 4.2, 'body');
  }
  g.ell(24, cy, 11, lie ? 6.5 : 8, 'body');
  g.ell(24, cy - 8.5, 3.4, 2.4, 'body'); // tuft
  // face: dark oval with little droopy ears and a wool fringe
  const fy = cy + 1;
  g.ell(16.4, fy + 1, 1.3, 1.9, 'extra');
  g.ell(31.6, fy + 1, 1.3, 1.9, 'extra');
  g.ell(24, fy + 0.5, 5, 6, 'extra');
  g.clipEll(24, fy - 5.2, 3.2, 1.6, 'body', ['extra']);
  const eyes = lie ? 'shut' : P.eyes;
  if (eyes === 'open') {
    g.rect(20, fy - 1, 21, fy + 1, 'eyewhite');
    g.rect(27, fy - 1, 28, fy + 1, 'eyewhite');
    g.rect(21, fy, 21, fy + 1, 'ink');
    g.rect(28, fy, 28, fy + 1, 'ink');
  } else if (eyes === 'happy') {
    g.px([[20, fy + 1], [21, fy], [22, fy + 1], [26, fy + 1], [27, fy], [28, fy + 1]], 'eyewhite');
  } else {
    g.rect(20, fy + 1, 22, fy + 1, 'eyewhite');
    g.rect(26, fy + 1, 28, fy + 1, 'eyewhite');
  }
  g.px([[19, fy + 3], [29, fy + 3]], 'blush');
  g.px([[23, fy + 3], [24, fy + 3]], 'nose');
  g.px([[23, fy + 4], [24, fy + 4]], 'ink');
  if (float) {
    // a little weather below
    const k = P.t % 3;
    g.px([[19, FLOOR - 2 + k - 2], [24, FLOOR - 1 + ((k + 1) % 3) - 2], [29, FLOOR - 2 + ((k + 2) % 3) - 2]], 'accent');
  }
  if (lie) sleepZs(g, P, 34, 16);
  ball(g, P, 42);
};

/* ───────────────────────────── Glim · jellyfish ───────────────────────────── */
const glim = (g, P) => {
  const lie = P.lie;
  const oy = lie ? 6 : P.oy + (P.t % 4 < 2 ? -2 : -3);
  const cy = FLOOR - 21 + oy;
  // tentacles
  const bases = [16, 20, 24, 28, 32];
  bases.forEach((bx, i) => {
    for (let y = cy + 3; y <= (lie ? FLOOR : FLOOR - 2 + oy + 2); y++) {
      const wave = Math.round(Math.sin((y - cy) / 2.6 + P.t * 0.9 + i) * (lie ? 2 : 1));
      if (lie && y > FLOOR - 2) continue;
      g.set(bx + wave, y, i % 2 ? 'accent' : 'detail');
    }
  });
  // bell
  g.ell(24, cy, 12 + (P.sq ? 1 : 0), 10 - (P.sq ? 1 : 0), 'body');
  for (let y = cy + 3; y < cy + 12; y++) for (let x = 0; x < 48; x++) if (g.get(x, y) === 'body') g.set(x, y, null);
  for (let x = 13; x <= 35; x += 3) g.ell(x, cy + 2.5, 1.7, 1.2, 'belly');
  g.clipEll(19, cy - 5, 3, 2, 'extra', ['body']);
  if (P.sp > 0.2 && P.sp < 0.9) {
    // glow pulse: bubbles drift up
    const k = Math.floor(P.sp * 10);
    g.ell(12, cy - 6 - k, 1.2, 1.2, 'shine');
    g.ell(36, cy - 10 - (k % 4), 1, 1, 'shine');
    g.clipEll(24, cy - 1, 7, 4, 'glow', ['body', 'extra']);
  }
  const eyes = lie ? 'shut' : P.eyes;
  g.eye(19, cy - 3, eyes);
  g.eye(27, cy - 3, eyes);
  g.px([[23, cy + 0], [24, cy + 1], [25, cy + 0]], 'ink');
  g.px([[16, cy], [17, cy], [31, cy], [32, cy]], 'blush');
  if (lie) sleepZs(g, P, 35, 12);
  ball(g, P, 42);
};

/* ───────────────────────────── Chip · hamster ───────────────────────────── */
const chip = (g, P) => {
  const lie = P.lie;
  const oy = P.oy;
  const cy = FLOOR - (lie ? 6 : 10) + oy;
  const rx = lie ? 13.5 : 11.5 + (P.sq ? 1 : 0);
  const ry = lie ? 6.5 : 9.5 - (P.sq ? 1 : 0);
  // ears
  g.ell(15.5, cy - ry + 2, 2.8, 2.8, 'body');
  g.ell(32.5, cy - ry + 2, 2.8, 2.8, 'body');
  g.ell(15.5, cy - ry + 2, 1.4, 1.4, 'nose');
  g.ell(32.5, cy - ry + 2, 1.4, 1.4, 'nose');
  g.ell(24, cy, rx, ry, 'body');
  if (P.patches) {
    g.clipEll(15.5, cy - ry + 2, 2.8, 2.8, 'detail', ['body', 'nose']);
    g.clipEll(32.5, cy - ry + 2, 2.8, 2.8, 'detail', ['body', 'nose']);
  }
  // cream belly low, a small muzzle, eyes up on the fur
  g.clipEll(24, cy + 5, 7, 5, 'belly', ['body']);
  const cheek = P.sp > 0.25 && P.sp < 0.8 ? 4.4 : 2.2;
  g.clipEll(15.5 - (cheek > 3 ? 0.6 : 0), cy + 0.5, cheek, cheek - 0.4, 'belly', ['body']);
  g.clipEll(32.5 + (cheek > 3 ? 0.6 : 0), cy + 0.5, cheek, cheek - 0.4, 'belly', ['body']);
  const ey = cy - 5;
  if (P.patches) {
    g.clipEll(19.5, ey + 1.5, 2.8, 2.6, 'detail', ['body', 'belly']);
    g.clipEll(28.5, ey + 1.5, 2.8, 2.6, 'detail', ['body', 'belly']);
  }
  g.clipEll(24, cy + 0.5, 3.6, 2.4, 'belly', ['body', 'belly']);
  const eyes = lie ? 'shut' : P.eyes;
  g.eye(19, ey, eyes);
  g.eye(28, ey, eyes);
  if (P.patches && eyes === 'open') {
    g.set(19, ey, 'shine');
    g.set(28, ey, 'shine');
  }
  g.px([[23, cy - 1], [24, cy - 1]], 'nose');
  g.px([[22, cy], [23, cy + 1], [24, cy + 1], [25, cy]], 'ink');
  g.px([[15, cy - 2], [16, cy - 2], [32, cy - 2], [33, cy - 2]], 'blush');
  if (!lie) {
    // little paws held at the chest (raised in swipe)
    const lift = P.arm * 2;
    g.ell(21, cy + 4 - lift, 1.5, 1.2, 'nose');
    g.ell(27, cy + 4 - lift, 1.5, 1.2, 'nose');
    if (cheek > 3 || P.arm) {
      g.ell(24, cy + 4 - lift, 2.2, 1.3, 'seed');
      g.set(23, cy + 4 - lift, 'shine');
    }
    const lf = P.leg > 0 ? -1 : 0;
    const rf = P.leg < 0 ? -1 : 0;
    g.ell(18, FLOOR + lf + Math.min(0, oy), 2.6, 1.2, 'nose');
    g.ell(30, FLOOR + rf + Math.min(0, oy), 2.6, 1.2, 'nose');
  }
  if (lie) sleepZs(g, P, 34, 18);
  ball(g, P, 42);
};

/* ───────────────────────────── Palettes ───────────────────────────── */
const common = { blush: '#ff8fa3', shine: '#ffffff', zz: '#9aa7ff', ball: '#ff6b5a', heart: '#ff5c8a', eyewhite: '#fffaf0' };

export const CAST = [
  {
    id: 'miso_cat', folder: 'miso', draw: miso,
    variants: {
      cream: { ...common, outline: '#3b2314', body: '#f2a65a', belly: '#fff1dc', extra: '#ffb3c1', detail: '#c96f2d', nose: '#ff8fa3', mouth: '#5a2a2a', stripes: true },
      charcoal: { ...common, outline: '#141420', body: '#5c5f73', belly: '#e9e6f2', extra: '#ffb3c1', detail: '#3c3e4f', nose: '#ff8fa3', mouth: '#2a1b2b' },
      snow: { ...common, outline: '#2e2a3a', body: '#f4f1ee', belly: '#ffffff', extra: '#ffb3c1', detail: '#c9c3d6', nose: '#ff8fa3', mouth: '#5a2a3a' },
    },
  },
  {
    id: 'moku_spirit', folder: 'moku', draw: moku,
    variants: {
      moss: { ...common, outline: '#1d2a1c', body: '#7d9a6a', belly: '#e8edd2', detail: '#5d7f3f', extra: '#7a5636', accent: '#8fd16a', spot: '#f2e6c8', flower: '#ffd166' },
      dusk: { ...common, outline: '#1d1830', body: '#7b74a8', belly: '#e7e2f6', detail: '#5a5290', extra: '#6b4a3a', accent: '#9fe0b4', spot: '#ffe8f4', flower: '#ff9ad5' },
    },
  },
  {
    id: 'beep_bot', folder: 'beep', draw: beep,
    variants: {
      mint: { ...common, outline: '#14262a', body: '#cfe9df', screen: '#173238', glow: '#7cf2c8', extra: '#6c8a92', accent: '#9bd4c3', detail: '#3b5a62', light: '#ff6b6b', lightoff: '#7a3b3b' },
      retro: { ...common, outline: '#2b2216', body: '#e9dcc2', screen: '#1f2a1b', glow: '#a6f28b', extra: '#8a7a62', accent: '#d9c49d', detail: '#5d4e38', light: '#ffb84d', lightoff: '#7a5a2b' },
    },
  },
  {
    id: 'hoot_owl', folder: 'hoot', draw: hoot,
    variants: {
      barn: { ...common, outline: '#2b1a10', body: '#b9824f', belly: '#f6e6cf', detail: '#8a5a33', face: '#fff4e4', accent: '#f2a13a' },
      snowy: { ...common, outline: '#232838', body: '#eef1f7', belly: '#ffffff', detail: '#aab3c8', face: '#ffffff', accent: '#f2c14e' },
    },
  },
  {
    id: 'ember_sprite', folder: 'ember', draw: ember,
    variants: {
      blaze: { ...common, outline: '#4a1408', body: '#ff6a2b', belly: '#ffb13b', extra: '#fff1a8', accent: '#ffd36b', blush: '#ff3d6e' },
      azure: { ...common, outline: '#0c1b4a', body: '#3d7bff', belly: '#7fd3ff', extra: '#e6fbff', accent: '#a8e8ff', blush: '#ff8fd0' },
    },
  },
  {
    id: 'puff_sheep', folder: 'puff', draw: puff,
    variants: {
      cloud: { ...common, outline: '#3a3550', body: '#fbfaff', extra: '#4a4560', nose: '#ff9fb0', accent: '#8fd3ff', eyewhite: '#ffffff' },
      storm: { ...common, outline: '#1b1d2c', body: '#b9bfd6', extra: '#2c2f45', nose: '#ff9fb0', accent: '#ffe066', eyewhite: '#ffffff' },
    },
  },
  {
    id: 'glim_jelly', folder: 'glim', draw: glim,
    variants: {
      lagoon: { ...common, outline: '#103248', body: '#7fd6ef', belly: '#c9f3ff', extra: '#e8fbff', accent: '#9be7ff', detail: '#4fb3d6', glow: '#d6fbff' },
      berry: { ...common, outline: '#3a1238', body: '#f29bd0', belly: '#ffd6ef', extra: '#fff0fa', accent: '#ffc2e6', detail: '#d66bb0', glow: '#fff0fb' },
    },
  },
  {
    id: 'chip_hamster', folder: 'chip', draw: chip,
    variants: {
      golden: { ...common, outline: '#3a2410', body: '#f0b46a', belly: '#fff3e0', nose: '#ff9fb0', detail: '#c98a46', seed: '#5a4636' },
      panda: { ...common, outline: '#1a1a22', body: '#fbfbfb', belly: '#ffffff', nose: '#ff9fb0', detail: '#2a2a33', seed: '#5a4636', patches: true },
    },
  },
];

/* ───────────────────────────── Moves ───────────────────────────── */
const base = { oy: 0, sq: 0, eyes: 'open', leg: 0, arm: 0, lean: 0, lie: false, ball: null, sp: 0, flick: 0 };
const seq = (n, f) => Array.from({ length: n }, (_, t) => ({ ...base, t, flick: [0, 1, 0, -1][t % 4], ...f(t) }));

export const ACTIONS = {
  idle: seq(8, (t) => ({ oy: [0, 0, 0, 1, 1, 1, 0, 0][t], sq: t >= 3 && t <= 5 ? 1 : 0, eyes: t === 6 ? 'shut' : 'open' })),
  walk: seq(6, (t) => ({ leg: [1, 1, 0, -1, -1, 0][t], oy: [0, -1, 0, 0, -1, 0][t] })),
  run: seq(4, (t) => ({ leg: [1, 0, -1, 0][t], oy: [0, -1, 0, -1][t], lean: 1 })),
  lie: seq(8, () => ({ lie: true, eyes: 'shut' })),
  swipe: seq(6, (t) => ({ arm: [0, 1, 2, 2, 1, 0][t], eyes: t === 2 || t === 3 ? 'happy' : 'open' })),
  with_ball: seq(8, (t) => ({ ball: [0, 3, 6, 8, 9, 8, 6, 3][t], oy: t === 0 ? 1 : 0, sq: t === 0 ? 1 : 0, eyes: t === 4 ? 'happy' : 'open' })),
  jump: seq(6, (t) => ({ oy: [1, -3, -6, -4, 1, 0][t], sq: t === 0 || t === 4 ? 1 : 0, eyes: t === 2 || t === 3 ? 'happy' : 'open' })),
  stand: seq(8, (t) => ({ sp: t / 7, eyes: t >= 2 && t <= 5 ? 'happy' : 'open' })),
};
