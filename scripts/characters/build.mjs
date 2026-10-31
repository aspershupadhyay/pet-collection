/* Renders the original cast to GIFs in public/sprites/<folder>/ and a
   preview sheet. Run: node scripts/characters/build.mjs [--preview out.png] */
import fs from 'node:fs';
import path from 'node:path';
import gifenc from 'gifenc';
import { Grid, render, png, W, H } from './engine.mjs';
import { CAST, ACTIONS } from './cast.mjs';

const { GIFEncoder } = gifenc;
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const FLAGS = ['stripes', 'patches'];

function frames(char, variant, action) {
  const pal = { ...char.variants[variant] };
  const flags = {};
  FLAGS.forEach((f) => {
    if (f in pal) {
      flags[f] = pal[f];
      delete pal[f];
    }
  });
  return ACTIONS[action].map((pose) => {
    const g = new Grid();
    char.draw(g, { ...pose, ...flags });
    return render(g, pal);
  });
}

function writeGif(file, list) {
  const colours = new Map([['t', 0]]);
  const palette = [[0, 0, 0]];
  const indexed = list.map((rgba) => {
    const idx = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) {
      if (!rgba[i * 4 + 3]) continue;
      const key = `${rgba[i * 4]},${rgba[i * 4 + 1]},${rgba[i * 4 + 2]}`;
      let k = colours.get(key);
      if (k == null) {
        k = palette.length;
        colours.set(key, k);
        palette.push([rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]]);
      }
      idx[i] = k;
    }
    return idx;
  });
  if (palette.length > 256) throw new Error(`${file}: ${palette.length} colours`);
  while (palette.length & (palette.length - 1) || palette.length < 4) palette.push([0, 0, 0]);
  const enc = GIFEncoder();
  indexed.forEach((idx, i) =>
    enc.writeFrame(idx, W, H, { palette: i === 0 ? palette : undefined, transparent: true, transparentIndex: 0, delay: 125, repeat: 0, dispose: 2 })
  );
  enc.finish();
  fs.writeFileSync(file, enc.bytes());
}

const preview = process.argv.includes('--preview') ? process.argv[process.argv.indexOf('--preview') + 1] : null;
const sheet = [];
for (const char of CAST) {
  const dir = path.join(root, 'public/sprites', char.folder);
  fs.mkdirSync(dir, { recursive: true });
  for (const variant of Object.keys(char.variants)) {
    for (const action of Object.keys(ACTIONS)) {
      const list = frames(char, variant, action);
      writeGif(path.join(dir, `${variant}_${action}_8fps.gif`), list);
      if (preview && variant === Object.keys(char.variants)[0]) sheet.push({ char: char.id, action, first: list[Math.min(2, list.length - 1)] });
    }
  }
  console.log('drew', char.id, Object.keys(char.variants).join(', '));
}

if (preview) {
  // one row per character, one column per move, 3x scale on a soft background
  const S = 3;
  const cols = Object.keys(ACTIONS).length;
  const rows = CAST.length;
  const PW = cols * W * S;
  const PH = rows * H * S;
  const out = new Uint8ClampedArray(PW * PH * 4);
  for (let i = 0; i < PW * PH; i++) {
    out[i * 4] = 236; out[i * 4 + 1] = 232; out[i * 4 + 2] = 240; out[i * 4 + 3] = 255;
  }
  sheet.forEach(({ first }, n) => {
    const cx = (n % cols) * W * S;
    const cy = Math.floor(n / cols) * H * S;
    for (let y = 0; y < H * S; y++)
      for (let x = 0; x < W * S; x++) {
        const si = (Math.floor(y / S) * W + Math.floor(x / S)) * 4;
        if (!first[si + 3]) continue;
        const di = ((cy + y) * PW + cx + x) * 4;
        out[di] = first[si]; out[di + 1] = first[si + 1]; out[di + 2] = first[si + 2];
      }
  });
  fs.writeFileSync(preview, png(out, PW, PH));
  console.log('preview', preview);
}
