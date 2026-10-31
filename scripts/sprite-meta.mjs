/* Measures every sprite GIF so the app can draw pixel art at exact integer
   scales and keep each pet planted on the same floor line across clips.
   Writes src/data/spriteMeta.json: { "/sprites/dog/akita_idle_8fps.gif": [w, h, unit, x0, y0, x1, y1, lum] }
   - unit: how many GIF pixels make one art pixel (some sheets are pre-scaled)
   - x0..y1: union bounding box of opaque pixels across all frames
   - lum: 90th-percentile luminance (0-100) of the first frame, so very
     dark sprites can be given a light stage instead of vanishing into it
   Run: node scripts/sprite-meta.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { parseGIF, decompressFrames } from 'gifuct-js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const spritesDir = path.join(root, 'public/sprites');
const out = {};

function gcd(a, b) {
  return b ? gcd(b, a % b) : a;
}

function measure(file) {
  const buf = fs.readFileSync(file);
  const gif = parseGIF(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  const frames = decompressFrames(gif, true);
  const W = gif.lsd.width;
  const H = gif.lsd.height;
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  const runCounts = new Map();
  let interiorRuns = 0;
  const lums = [];

  const countRun = (n) => {
    interiorRuns += 1;
    runCounts.set(n, (runCounts.get(n) || 0) + 1);
  };

  frames.forEach((f, fi) => {
    const { width: w, height: h, left, top } = f.dims;
    const px = f.patch;
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        if (px[(y * w + x) * 4 + 3] > 0) {
          x0 = Math.min(x0, left + x); y0 = Math.min(y0, top + y);
          x1 = Math.max(x1, left + x); y1 = Math.max(y1, top + y);
        }
      }
    }
    if (fi === 0) {
      for (let i = 0; i < px.length; i += 4) {
        if (px[i + 3] < 128) continue;
        lums.push(0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]);
      }
    }
    if (fi > 2) return; // a few frames are plenty for the grid size
    const same = (a, b) => px[a] === px[b] && px[a + 1] === px[b + 1] && px[a + 2] === px[b + 2] && px[a + 3] === px[b + 3];
    for (let y = 0; y < h; y += 1) {
      let start = 0;
      for (let x = 1; x <= w; x += 1) {
        if (x === w || !same((y * w + x) * 4, (y * w + start) * 4)) {
          if (start > 0 && x < w) countRun(x - start);
          start = x;
        }
      }
    }
    for (let x = 0; x < w; x += 1) {
      let start = 0;
      for (let y = 1; y <= h; y += 1) {
        if (y === h || !same((y * w + x) * 4, (start * w + x) * 4)) {
          if (start > 0 && y < h) countRun(y - start);
          start = y;
        }
      }
    }
  });

  // Largest grid size that nearly every interior run is a multiple of
  let unit = 1;
  for (let k = 12; k >= 2; k -= 1) {
    let ok = 0;
    for (const [n, c] of runCounts) if (n % k === 0) ok += c;
    if (interiorRuns && ok / interiorRuns >= 0.96) { unit = k; break; }
  }
  if (x1 < 0) { x0 = 0; y0 = 0; x1 = W - 1; y1 = H - 1; }
  return [W, H, unit, x0, y0, x1 + 1, y1 + 1, lums.length ? Math.round((lums.sort((a, b) => a - b)[Math.floor(lums.length * 0.9)] / 255) * 100) : 50];
}

for (const folder of fs.readdirSync(spritesDir).sort()) {
  const dir = path.join(spritesDir, folder);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir).sort()) {
    if (!f.endsWith('_8fps.gif')) continue;
    out[`/sprites/${folder}/${f}`] = measure(path.join(dir, f));
  }
}

fs.writeFileSync(path.join(root, 'src/data/spriteMeta.json'), JSON.stringify(out));
console.log(`measured ${Object.keys(out).length} sprites`);
