/* Realistic quadruped rig for naturalistic pixel animals.

   An animal is a skeleton of tapered capsules (spine, neck, four jointed
   legs, a tail chain) plus a head built from ellipsoids. Every pixel keeps
   its depth and surface normal, so lighting comes from the actual form
   (a 4-tone ramp per material), legs overlap the body with proper depth,
   and coat patterns (tabby stripes, rosettes) are laid out along each
   body part so they move with it. */

export const RW = 84;
export const RH = 60;
export const RFLOOR = 56; // paws rest on this row

const L = (() => {
  const v = [-0.45, -0.72, 0.53];
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
})();

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

class Canvas {
  constructor() {
    this.z = new Float32Array(RW * RH).fill(-1e9);
    this.mat = new Array(RW * RH).fill(null);
    this.tone = new Float32Array(RW * RH);
    this.part = new Array(RW * RH).fill(null);
  }
  plot(x, y, z, mat, light, part) {
    if (x < 0 || y < 0 || x >= RW || y >= RH) return;
    const i = y * RW + x;
    if (z <= this.z[i]) return;
    this.z[i] = z;
    this.mat[i] = mat;
    this.tone[i] = light;
    this.part[i] = part;
  }
}

const shade = (nx, ny, nz) => Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);

/* Tapered capsule from a to b. pattern(u, v, x, y) → material, where u is
   the distance along the bone in px and v the side (-1 top … +1 bottom). */
function capsule(c, a, b, ra, rb, layer, part, pattern, dim = 0) {
  const [ax, ay] = a;
  const [bx, by] = b;
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy || 1e-6;
  const len = Math.sqrt(len2);
  const nxp = -dy / len; // side normal: points "down" for a bone pointing right
  const nyp = dx / len;
  const r = Math.max(ra, rb);
  for (let y = Math.floor(Math.min(ay, by) - r - 1); y <= Math.ceil(Math.max(ay, by) + r + 1); y++)
    for (let x = Math.floor(Math.min(ax, bx) - r - 1); x <= Math.ceil(Math.max(ax, bx) + r + 1); x++) {
      const px = x + 0.5 - ax;
      const py = y + 0.5 - ay;
      const t = Math.max(0, Math.min(1, (px * dx + py * dy) / len2));
      const rr = ra + (rb - ra) * t;
      const ox = px - dx * t;
      const oy = py - dy * t;
      const d = Math.hypot(ox, oy);
      if (d > rr) continue;
      const h = Math.sqrt(rr * rr - d * d);
      const lit = shade(ox / rr, oy / rr, h / rr) - dim;
      const v = (ox * nxp + oy * nyp) / rr;
      c.plot(x, y, layer + h, pattern(t * len, v, x, y), lit, part);
    }
}

function ellipsoid(c, cx, cy, rx, ry, layer, part, pattern, dim = 0, zScale = 1) {
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++)
    for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
      const ex = (x + 0.5 - cx) / rx;
      const ey = (y + 0.5 - cy) / ry;
      const q = ex * ex + ey * ey;
      if (q > 1) continue;
      const ez = Math.sqrt(1 - q);
      c.plot(x, y, layer + ez * Math.min(rx, ry) * zScale, pattern(ex, ey, x, y), shade(ex, ey, ez) - dim, part);
    }
}

function tri(c, pts, layer, part, mat, lit) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++)
    for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i];
        const [xj, yj] = pts[j];
        if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
      }
      if (inside) c.plot(x, y, layer, typeof mat === 'function' ? mat(x, y) : mat, lit, part);
    }
}

/* Two-bone IK: joint between root and end, bending to `side` (+1/-1). */
function ik(root, end, l1, l2, side) {
  const [rx, ry] = root;
  let dx = end[0] - rx;
  let dy = end[1] - ry;
  let d = Math.hypot(dx, dy);
  const max = l1 + l2 - 0.01;
  if (d > max) {
    dx *= max / d;
    dy *= max / d;
    d = max;
  }
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const mx = rx + (dx * a) / d;
  const my = ry + (dy * a) / d;
  return [mx + (side * -dy * h) / d, my + (side * dx * h) / d];
}

/* ───────────────────────── coats ───────────────────────── */

const frac = (x) => x - Math.floor(x);
const hash = (x, y) => frac(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);

export function coatPattern(coat) {
  return (part, u, v, x, y) => {
    // pale undersides: belly, throat, inner legs, muzzle
    if (part === 'body' && v > 0.55) return coat.spots ? spot(u, v, 'light', 0.6) : 'light';
    if (part === 'neck' && v > 0.25) return 'light';
    if (coat.socks && (part === 'leg') && u > coat.socks) return 'light';
    if (coat.stripes) {
      if (part === 'body' && v < 0.3 && frac(u / 3.1 + Math.sin(v * 3.1 + u * 0.35) * 0.32) < 0.24) return 'dark';
      if (part === 'leg' && u < 9 && u > 2 && frac(u / 3) < 0.22) return 'dark';
      if (part === 'tail' && frac(u / 2.6) < 0.38) return 'dark';
      if (part === 'neck' && v < 0 && frac(u / 3) < 0.3) return 'dark';
    }
    if (coat.spots) {
      if (part === 'body' || part === 'neck') return spot(u, v * 7, 'fur', 1);
      if (part === 'leg' && u < 10) return spot(u, v * 3, 'fur', 0.7);
      if (part === 'tail') return frac(u / 2.8) < 0.33 ? 'dark' : 'fur';
    }
    return 'fur';
  };
  // rosettes: dark ring with a warm centre, on a jittered grid along the body
  function spot(u, w, base, size) {
    const cs = 4.4;
    const gx = Math.floor(u / cs);
    const gy = Math.floor(w / cs);
    for (let oy = -1; oy <= 1; oy++)
      for (let ox = -1; ox <= 1; ox++) {
        const cx = (gx + ox + 0.25 + hash(gx + ox, gy + oy) * 0.5) * cs;
        const cy = (gy + oy + 0.25 + hash(gy + oy, gx + ox + 7) * 0.5) * cs;
        // spots are ovals stretched along the body, sized per cell
        const d = Math.hypot((u - cx) / 1.12, w - cy);
        if (hash(gx + ox + 3, gy + oy + 5) < 0.12) continue; // some cells stay clear
        const r = (1 + hash(gx + ox + 11, gy + oy) * 0.55) * size;
        if (d < r) return d < r * 0.38 && r > 1.6 ? 'rosette' : 'dark';
      }
    return base;
  }
}

/* ───────────────────────── poses ───────────────────────── */

const STAND = { hip: [28, 38], sh: [52, 37], head: [62, 26] };

/* Builds the joint layout for a pose description. */
function standingLegs(P, sh, hip) {
  // neutral paw spots
  const F = 51 + (P.fx ?? 0);
  const Hn = 29 + (P.hx ?? 0);
  return {
    frontNear: P.frontNear ?? [F, RFLOOR],
    frontFar: P.frontFar ?? [F - 3, RFLOOR],
    hindNear: P.hindNear ?? [Hn, RFLOOR],
    hindFar: P.hindFar ?? [Hn - 3, RFLOOR],
  };
}

export function drawQuadruped(spec, P) {
  const c = new Canvas();
  const pat = coatPattern(spec.coat);
  const S = spec.size ?? 1;
  // Poses are authored for a long-bodied frame; each species compresses it
  const k = spec.length ?? 1;
  const T = (p) => (p ? [40 + (p[0] - 40) * k, p[1]] : p);
  const sh = T(P.sh ?? STAND.sh);
  const hip = T(P.hip ?? STAND.hip);
  const hd = T(P.head ?? STAND.head);
  const rawLegs = P.legs ?? standingLegs(P, sh, hip);
  const legs = { frontNear: T(rawLegs.frontNear), frontFar: T(rawLegs.frontFar), hindNear: T(rawLegs.hindNear), hindFar: T(rawLegs.hindFar) };
  P = { ...P, ball: T(P.ball) };
  const breathe = P.breathe ?? 0;

  // ── far legs (behind the body, a touch darker)
  const leg = (root, paw, kind, layer, dim) => {
    if (!paw) return;
    if (kind === 'front') {
      const elbow = ik(root, [paw[0], paw[1] - 1], 9.5 * S, 9 * S, 1);
      capsule(c, root, elbow, 3.6 * S, 2.7 * S, layer, 'leg', (u, v, x, y) => pat('leg', u, v, x, y), dim);
      capsule(c, elbow, [paw[0], paw[1] - 1], 2.7 * S, 2.3 * S, layer, 'leg', (u, v, x, y) => pat('leg', u + 9, v, x, y), dim);
      ellipsoid(c, paw[0] + 1.2, paw[1] - 1.3, 2.6 * S, 1.6, layer + 1, 'leg', () => pat('leg', 20, 0, 0, 0), dim);
    } else {
      const hock = [paw[0] - 1.5, paw[1] - 5.5 * S];
      const knee = ik(root, hock, 9 * S, 8.5 * S, -1);
      capsule(c, root, knee, 5 * S, 3.2 * S, layer, 'leg', (u, v, x, y) => pat('leg', u, v, x, y), dim);
      capsule(c, knee, hock, 3 * S, 2.2 * S, layer, 'leg', (u, v, x, y) => pat('leg', u + 8, v, x, y), dim);
      capsule(c, hock, [paw[0], paw[1] - 1], 2.2 * S, 2.1 * S, layer, 'leg', (u, v, x, y) => pat('leg', u + 14, v, x, y), dim);
      ellipsoid(c, paw[0] + 1.2, paw[1] - 1.3, 2.6 * S, 1.6, layer + 1, 'leg', () => pat('leg', 20, 0, 0, 0), dim);
    }
  };
  const shoulderJ = [sh[0] - 1, sh[1] + 3];
  const hipJ = [hip[0] + 1, hip[1] + 2];
  if (!P.tuck) {
    leg([shoulderJ[0] - 2, shoulderJ[1]], legs.frontFar, 'front', -30, 0.22);
    leg([hipJ[0] - 2, hipJ[1]], legs.hindFar, 'hind', -30, 0.22);
  }

  // ── tail (a chain of segments)
  const tail = P.tail ?? { base: 205, curl: -9, flick: 0 };
  let tp = [hip[0] - 5 * S, hip[1] - 3 * S];
  let ang = (tail.base * Math.PI) / 180;
  const segs = spec.tailSegs ?? 12;
  for (let i = 0; i < segs; i++) {
    const k = i / (segs - 1);
    ang += ((tail.curl + (i > segs * 0.6 ? tail.flick : 0)) * Math.PI) / 180;
    const nx = tp[0] + Math.cos(ang) * 2.3;
    const ny = tp[1] + Math.sin(ang) * 2.3;
    const r0 = (spec.tailR ?? 2.5) * (1 - k * 0.35);
    capsule(c, tp, [nx, ny], r0, r0 * 0.96, tail.front ? 4 : -12, 'tail', (u, v, x, y) => pat('tail', u + i * 2.3, v, x, y));
    tp = [nx, ny];
  }

  // ── torso: haunch, ribcage, belly, chest
  const bodyPat = (u, v, x, y) => pat('body', u, v, x, y);
  capsule(c, hip, sh, (6.6 + breathe) * S * (spec.hipR ?? 1), (7.2 + breathe) * S, 0, 'body', bodyPat);
  ellipsoid(c, (hip[0] + sh[0]) / 2, (hip[1] + sh[1]) / 2 + 2.2 * S, 9.5 * S, (5.4 + breathe) * S, -1, 'body', (ex, ey) => pat('body', 12 + ex * 8, ey > 0.35 ? 0.8 : ey, 0, 0));
  if (P.sitting) ellipsoid(c, hip[0] + 1, hip[1] + 1.5, 8 * S, 7 * S, 1, 'body', (ex, ey) => pat('body', 4 + ex * 4, ey * 0.5, 0, 0));

  // ── neck + head
  const neckTop = [hd[0] - 3 * S, hd[1] + 2 * S];
  capsule(c, sh, neckTop, 5.8 * S, 4.4 * S, 2, 'neck', (u, v, x, y) => pat('neck', u, v, x, y));
  const tilt = P.headTilt ?? 0;
  const [hx, hy] = hd;
  const R = spec.headR ?? 1;
  // far ear, skull, cheeks, muzzle, near ear
  const twitch = P.earTwitch ? 1 : 0;
  tri(c, [[hx - 5.5 * R, hy - 3 * R], [hx - 3.5 * R - twitch, hy - 11.5 * R], [hx - 0.5 * R, hy - 4.5 * R]], 4, 'ear', 'fur', 0.25);
  ellipsoid(c, hx, hy, 6.6 * R, 5.6 * R, 6, 'head', (ex, ey) => (spec.coat.stripes && ey < -0.35 && Math.abs(ex) < 0.6 && frac((ex + 1) * 3.5) < 0.35 ? 'dark' : spec.coat.spots && ey < -0.3 && hash(Math.round(ex * 5), Math.round(ey * 5)) > 0.78 ? 'dark' : 'fur'));
  if (spec.jowls) ellipsoid(c, hx - 0.5, hy + 2.6 * R, 5.8 * R, 3.6 * R, 7, 'head', (ex, ey) => (ey > 0.2 ? 'light' : 'fur'));
  ellipsoid(c, hx + 5.4 * R + tilt, hy + 2.2 * R, 3.6 * R, 2.8 * R, 8, 'muzzle', (ex, ey) => (ey > -0.1 || ex > 0.2 ? 'light' : 'fur'));
  tri(c, [[hx - 1 * R, hy - 4.5 * R], [hx + 2 * R + twitch, hy - 12 * R], [hx + 4.5 * R, hy - 4 * R]], 9, 'ear', 'fur', 0.6);
  tri(c, [[hx + 0.4 * R, hy - 5 * R], [hx + 2 * R + twitch, hy - 9.6 * R], [hx + 3.4 * R, hy - 4.9 * R]], 10, 'ear', 'pink', 0.6);
  // eye: almond with iris and slit pupil, or a closed line
  const ex = Math.round(hx + 3 * R);
  const ey = Math.round(hy - 1 * R);
  if (P.eyes === 'shut') {
    c.plot(ex - 1, ey + 1, 20, 'line', 0.5, 'eye');
    c.plot(ex, ey + 1, 20, 'line', 0.5, 'eye');
    c.plot(ex + 1, ey + 1, 20, 'line', 0.5, 'eye');
  } else {
    [[ex - 1, ey], [ex, ey], [ex + 1, ey], [ex, ey + 1], [ex + 1, ey + 1], [ex - 1, ey + 1]].forEach(([x, y]) => c.plot(x, y, 20, 'iris', 0.7, 'eye'));
    c.plot(ex + 2, ey + 1, 20, 'line', 0.5, 'eye');
    c.plot(ex + 1, ey, 21, 'pupil', 0.5, 'eye');
    c.plot(ex + 1, ey + 1, 21, 'pupil', 0.5, 'eye');
    c.plot(ex - 1, ey, 22, 'shine', 1, 'eye');
  }
  // nose, mouth, whiskers
  const nx = Math.round(hx + 8.6 * R + tilt);
  const ny = Math.round(hy + 1 * R);
  c.plot(nx, ny, 20, 'nose', 0.6, 'eye');
  c.plot(nx - 1, ny, 20, 'nose', 0.6, 'eye');
  if (P.yawn) {
    for (let y = ny + 2; y <= ny + 4; y++) for (let x = nx - 4; x <= nx; x++) c.plot(x, y, 21, y === ny + 2 ? 'line' : 'mouth', 0.5, 'eye');
  } else {
    c.plot(nx - 1, ny + 2, 20, 'line', 0.5, 'eye');
    c.plot(nx - 2, ny + 3, 20, 'line', 0.5, 'eye');
  }
  [[nx - 2, ny + 1], [nx - 5, ny + 1]].forEach(([x, y]) => {
    for (let k = 0; k < 3; k++) c.plot(x + 3 + k, y + Math.floor(k / 3) - 1 + (x === nx - 5 ? 1 : 0), 15, 'whisker', 1, 'whisker');
  });

  // ── near legs (in front)
  if (P.tuck) {
    ellipsoid(c, sh[0] + 4, RFLOOR - 2, 4.5 * S, 2.2, 10, 'leg', () => pat('leg', 20, 0, 0, 0));
  } else {
    leg(shoulderJ, legs.frontNear, 'front', 3, 0);
    leg(hipJ, legs.hindNear, 'hind', 3, 0);
  }

  // ── props
  if (P.ball) ellipsoid(c, P.ball[0], P.ball[1], 2.8, 2.8, 30, 'ball', (ex, ey) => (Math.abs(ex + ey * 0.3) < 0.18 ? 'ballline' : 'ball'));

  return c;
}

/* ───────────────────────── render ───────────────────────── */

export function renderQuadruped(c, spec) {
  const ramps = {};
  for (const [k, v] of Object.entries(spec.ramps)) ramps[k] = v.map(hex);
  const flat = {};
  for (const [k, v] of Object.entries(spec.flat)) flat[k] = hex(v);
  const out = new Uint8ClampedArray(RW * RH * 4);
  const put = (i, rgb, a = 255) => {
    out[i * 4] = rgb[0];
    out[i * 4 + 1] = rgb[1];
    out[i * 4 + 2] = rgb[2];
    out[i * 4 + 3] = a;
  };
  const toneOf = (lit) => (lit > 0.78 ? 3 : lit > 0.5 ? 2 : lit > 0.24 ? 1 : 0);
  for (let y = 0; y < RH; y++)
    for (let x = 0; x < RW; x++) {
      const i = y * RW + x;
      const m = c.mat[i];
      if (m) {
        if (ramps[m]) {
          let t = toneOf(c.tone[i]);
          // contact shading: a pixel sitting right behind a nearer part darkens
          const z = c.z[i];
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, -1], [0, 1]]) {
            const j = (y + dy) * RW + x + dx;
            if (x + dx < 0 || x + dx >= RW || y + dy < 0 || y + dy >= RH) continue;
            if (c.mat[j] && c.z[j] > z + 6 && c.part[j] !== c.part[i]) t = Math.min(t, 0);
          }
          put(i, ramps[m][t]);
        } else put(i, flat[m] ?? [255, 0, 255]);
        continue;
      }
      // outline: the darkest tone of the neighbouring material
      let best = null;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (x + dx < 0 || x + dx >= RW || y + dy < 0 || y + dy >= RH) continue;
        const j = (y + dy) * RW + x + dx;
        const mm = c.mat[j];
        if (mm && mm !== 'whisker') best = mm;
      }
      if (best) put(i, spec.outline ? hex(spec.outline) : ramps[best]?.[0] ?? flat.line);
    }
  return out;
}

/* ───────────────────────── moves ───────────────────────── */

const lerp = (a, b, t) => a + (b - a) * t;
const lp = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

/* Walk: lateral-sequence gait, each paw on the ground 60% of the cycle. */
function walkPaw(home, phase, stride, lift) {
  const p = frac(phase);
  if (p < 0.6) return [home[0] + stride / 2 - (p / 0.6) * stride, RFLOOR];
  const s = (p - 0.6) / 0.4;
  return [home[0] - stride / 2 + s * stride, RFLOOR - Math.sin(Math.PI * s) * lift];
}

const SIT = { hip: [33, 46], sh: [46, 32], head: [53, 21], sitting: true, fx: -4 };
const sitLegs = (near = [49, RFLOOR], far = [46, RFLOOR]) => ({ frontNear: near, frontFar: far, hindNear: [40, RFLOOR], hindFar: [37, RFLOOR] });

export const REAL_ACTIONS = {
  // sitting, tail tip flicking, a blink and an ear twitch
  idle: Array.from({ length: 8 }, (_, t) => ({
    ...SIT,
    legs: sitLegs(),
    tail: { base: 160, curl: -12, flick: [0, 6, 12, 6, 0, -6, -10, -4][t], front: true },
    eyes: t === 5 ? 'shut' : 'open',
    earTwitch: t === 2,
    breathe: t >= 3 && t <= 5 ? 0.35 : 0,
  })),
  walk: Array.from({ length: 8 }, (_, t) => {
    const ph = t / 8;
    const bob = Math.abs(Math.sin(ph * Math.PI * 2)) * 0.8;
    return {
      hip: [28, 38 + bob], sh: [52, 37 + bob], head: [62, 26 + bob],
      legs: {
        hindNear: walkPaw([29, RFLOOR], ph, 12, 3),
        frontNear: walkPaw([51, RFLOOR], ph + 0.25, 12, 3),
        hindFar: walkPaw([26, RFLOOR], ph + 0.5, 12, 3),
        frontFar: walkPaw([48, RFLOOR], ph + 0.75, 12, 3),
      },
      tail: { base: 200, curl: -7 + Math.sin(ph * 6.28) * 1.5, flick: 0 },
    };
  }),
  // bounding gallop: spine stretches and gathers
  run: Array.from({ length: 6 }, (_, t) => {
    const ph = t / 6;
    const ext = Math.sin(ph * Math.PI * 2);
    const up = Math.max(0, Math.sin(ph * Math.PI * 2 + 0.6)) * 4;
    return {
      hip: [27 - ext * 2, 38 - up], sh: [53 + ext * 2, 37 - up - ext], head: [63 + ext * 2, 26 - up - ext],
      legs: {
        frontNear: walkPaw([53, RFLOOR], ph, 20, 7),
        frontFar: walkPaw([51, RFLOOR], ph + 0.08, 20, 7),
        hindNear: walkPaw([28, RFLOOR], ph + 0.5, 20, 7),
        hindFar: walkPaw([26, RFLOOR], ph + 0.58, 20, 7),
      },
      tail: { base: 190, curl: -3, flick: 0 },
    };
  }),
  // curled loaf, breathing, eyes closed
  lie: Array.from({ length: 8 }, (_, t) => ({
    hip: [30, 49], sh: [49, 49], head: [58, 45], tuck: true, eyes: 'shut', headTilt: 0,
    breathe: [0, 0.2, 0.4, 0.5, 0.4, 0.2, 0, 0][t],
    tail: { base: 140, curl: -16, flick: 0, front: true },
  })),
  // seated paw swipe
  swipe: Array.from({ length: 6 }, (_, t) => ({
    ...SIT,
    legs: sitLegs([[49, RFLOOR], [53, 46], [58, 38], [60, 40], [55, 48], [49, RFLOOR]][t]),
    tail: { base: 160, curl: -12, flick: 4, front: true },
    eyes: 'open',
  })),
  // crouched, batting a ball that rolls away and back
  with_ball: Array.from({ length: 8 }, (_, t) => {
    const bx = [64, 66, 69, 72, 74, 72, 68, 65][t];
    const tap = t === 0 || t === 7;
    return {
      hip: [28, 40], sh: [51, 42], head: [61, 34],
      legs: { frontNear: tap ? [61, RFLOOR - 3] : [52, RFLOOR], frontFar: [48, RFLOOR], hindNear: [30, RFLOOR], hindFar: [27, RFLOOR] },
      tail: { base: 195, curl: -4, flick: t % 2 ? 8 : -8 },
      ball: [bx, RFLOOR - 2.8],
    };
  }),
  // a pounce: crouch, launch, fly, land
  jump: [
    { hip: [28, 42], sh: [51, 42], head: [61, 33], legs: { frontNear: [53, RFLOOR], frontFar: [50, RFLOOR], hindNear: [32, RFLOOR], hindFar: [29, RFLOOR] }, tail: { base: 200, curl: -3 } },
    { hip: [27, 34], sh: [50, 26], head: [60, 16], legs: { frontNear: [58, 34], frontFar: [55, 35], hindNear: [22, RFLOOR], hindFar: [19, RFLOOR] }, tail: { base: 185, curl: -2 } },
    { hip: [30, 24], sh: [54, 22], head: [64, 13], legs: { frontNear: [66, 30], frontFar: [63, 31], hindNear: [17, 38], hindFar: [14, 37] }, tail: { base: 180, curl: -1 } },
    { hip: [32, 28], sh: [55, 30], head: [64, 21], legs: { frontNear: [63, 44], frontFar: [60, 44], hindNear: [22, 40], hindFar: [19, 40] }, tail: { base: 175, curl: -3 } },
    { hip: [30, 42], sh: [53, 43], head: [62, 34], legs: { frontNear: [58, RFLOOR], frontFar: [55, RFLOOR], hindNear: [34, RFLOOR], hindFar: [31, RFLOOR] }, tail: { base: 195, curl: -6 } },
    { hip: [28, 38], sh: [52, 37], head: [62, 26], tail: { base: 205, curl: -9 } },
  ],
  // the big stretch: front low, rear up, tail high — then a yawn
  stand: Array.from({ length: 8 }, (_, t) => {
    const k = [0, 0.5, 1, 1, 1, 0.7, 0.3, 0][t];
    return {
      hip: [28, 38 - k * 2], sh: lp([52, 37], [52, 46], k), head: lp([62, 26], [66, 41], k),
      legs: { frontNear: [51 + k * 9, RFLOOR], frontFar: [48 + k * 9, RFLOOR], hindNear: [29, RFLOOR], hindFar: [26, RFLOOR] },
      tail: { base: lerp(205, 245, k), curl: lerp(-9, 4, k), flick: 0 },
      yawn: t === 3 || t === 4,
      eyes: t === 3 || t === 4 ? 'shut' : 'open',
    };
  }),
};
