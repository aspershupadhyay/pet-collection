import { decodeGif } from '../utils/gifDecode';
import { spriteMetaFor } from '../data/meta';

/* Turns an 8fps pixel GIF into stacks of voxels, one per art pixel. Depth
   grows with distance from the silhouette edge, so a flat sprite becomes a
   rounded little figure you can turn all the way around. */


export interface VoxelFrame {
  count: number;
  /** x, y, depth, z-centre per voxel column */
  cells: Float32Array;
  /** r, g, b per voxel, already in linear space for three.js */
  colors: Float32Array;
}

export interface VoxelClip {
  frames: VoxelFrame[];
  delays: number[];
  /** Grid size in voxels (bounding box of the opaque art). */
  width: number;
  height: number;
  maxCount: number;
}

const MAX_GRID = 72;

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const cache = new Map<string, Promise<VoxelClip>>();

function voxelize(
  pixels: Uint8ClampedArray,
  W: number,
  box: [number, number, number, number],
  step: number,
  gw: number,
  gh: number
): VoxelFrame {
  const [x0, y0] = box;
  const solid = new Uint8Array(gw * gh);
  const rgb = new Float32Array(gw * gh * 3);
  for (let j = 0; j < gh; j += 1) {
    for (let i = 0; i < gw; i += 1) {
      const sx = Math.min(W - 1, Math.floor(x0 + i * step + step / 2));
      const sy = Math.floor(y0 + j * step + step / 2);
      const p = (sy * W + sx) * 4;
      if (pixels[p + 3] > 127) {
        const k = j * gw + i;
        solid[k] = 1;
        rgb[k * 3] = toLinear(pixels[p] / 255);
        rgb[k * 3 + 1] = toLinear(pixels[p + 1] / 255);
        rgb[k * 3 + 2] = toLinear(pixels[p + 2] / 255);
      }
    }
  }

  // Distance to the nearest empty cell (two-pass chamfer), for rounded depth
  const INF = 1e6;
  const dist = new Float32Array(gw * gh);
  for (let k = 0; k < dist.length; k += 1) dist[k] = solid[k] ? INF : 0;
  const at = (i: number, j: number) => (i < 0 || j < 0 || i >= gw || j >= gh ? 0 : dist[j * gw + i]);
  for (let j = 0; j < gh; j += 1) {
    for (let i = 0; i < gw; i += 1) {
      const k = j * gw + i;
      if (!solid[k]) continue;
      dist[k] = Math.min(dist[k], at(i - 1, j) + 1, at(i, j - 1) + 1, at(i - 1, j - 1) + 1.4, at(i + 1, j - 1) + 1.4);
    }
  }
  for (let j = gh - 1; j >= 0; j -= 1) {
    for (let i = gw - 1; i >= 0; i -= 1) {
      const k = j * gw + i;
      if (!solid[k]) continue;
      dist[k] = Math.min(dist[k], at(i + 1, j) + 1, at(i, j + 1) + 1, at(i + 1, j + 1) + 1.4, at(i - 1, j + 1) + 1.4);
    }
  }

  // Inflate like a plush toy: a round cross-section, so a disc becomes a ball
  // and thin parts (ears, legs, tails) stay slender. R is the widest radius.
  let R = 1;
  for (let k = 0; k < dist.length; k += 1) if (solid[k] && dist[k] > R) R = dist[k];
  R = Math.min(R, Math.max(gw, gh) * 0.32);
  const half = (d: number) => {
    const t = Math.min(d, R);
    return Math.max(0.5, Math.sqrt(Math.max(0, R * R - (R - t) * (R - t))) * 0.85);
  };

  // The back of a character is its body, not a mirrored face: interior
  // pixels take the most common mid-tone colour around them (eyes, mouths
  // and highlights drop out), edges keep their own colour as the seam.
  const lum = (k: number) => 0.2126 * rgb[k * 3] + 0.7152 * rgb[k * 3 + 1] + 0.0722 * rgb[k * 3 + 2];
  const back = new Float32Array(rgb);
  const R2 = 3;
  for (let j = 0; j < gh; j += 1) {
    for (let i = 0; i < gw; i += 1) {
      const k = j * gw + i;
      if (!solid[k] || dist[k] < 1.9) continue;
      const votes = new Map<number, { n: number; k: number }>();
      for (let dj = -R2; dj <= R2; dj += 1) {
        for (let di = -R2; di <= R2; di += 1) {
          const ii = i + di;
          const jj = j + dj;
          if (ii < 0 || jj < 0 || ii >= gw || jj >= gh) continue;
          const q = jj * gw + ii;
          if (!solid[q] || dist[q] < 1.9) continue;
          const L = lum(q);
          if (L < 0.02 || L > 0.85) continue; // outlines, pupils, eye whites, shine
          const key = (Math.round(rgb[q * 3] * 20) << 12) | (Math.round(rgb[q * 3 + 1] * 20) << 6) | Math.round(rgb[q * 3 + 2] * 20);
          const v = votes.get(key);
          if (v) v.n += 1;
          else votes.set(key, { n: 1, k: q });
        }
      }
      let best: { n: number; k: number } | null = null;
      votes.forEach((v) => {
        if (!best || v.n > best.n) best = v;
      });
      if (best) {
        const src = (best as { k: number }).k;
        back[k * 3] = rgb[src * 3];
        back[k * 3 + 1] = rgb[src * 3 + 1];
        back[k * 3 + 2] = rgb[src * 3 + 2];
      }
    }
  }

  let solidCount = 0;
  for (let k = 0; k < solid.length; k += 1) solidCount += solid[k];
  const count = solidCount * 2;
  const cells = new Float32Array(count * 4);
  const colors = new Float32Array(count * 3);
  let n = 0;
  const push = (x: number, y: number, depth: number, zc: number, src: Float32Array, k: number) => {
    cells[n * 4] = x;
    cells[n * 4 + 1] = y;
    cells[n * 4 + 2] = depth;
    cells[n * 4 + 3] = zc;
    colors[n * 3] = src[k * 3];
    colors[n * 3 + 1] = src[k * 3 + 1];
    colors[n * 3 + 2] = src[k * 3 + 2];
    n += 1;
  };
  for (let j = 0; j < gh; j += 1) {
    for (let i = 0; i < gw; i += 1) {
      const k = j * gw + i;
      if (!solid[k]) continue;
      const h = half(dist[k]);
      const x = i - gw / 2 + 0.5;
      const y = gh - j - 0.5; // feet on y = 0
      push(x, y, h, h / 2, rgb, k); // front half
      push(x, y, h, -h / 2, back, k); // back half
    }
  }
  return { count, cells, colors };
}

export function loadVoxelClip(url: string): Promise<VoxelClip> {
  const hit = cache.get(url);
  if (hit) return hit;
  const job = (async () => {
    const { W, H, out } = await decodeGif(url);
    const meta = spriteMetaFor(url);
    const unit = meta?.[2] ?? 1;
    const box: [number, number, number, number] = meta ? [meta[3], meta[4], meta[5], meta[6]] : [0, 0, W, H];
    const bw = box[2] - box[0];
    const bh = box[3] - box[1];
    // One voxel per art pixel, capped so painted sheets stay light
    const step = Math.max(unit, Math.ceil(Math.max(bw, bh) / MAX_GRID));
    const gw = Math.max(1, Math.floor(bw / step));
    const gh = Math.max(1, Math.floor(bh / step));
    const frames = out.map((f) => voxelize(f.pixels, W, box, step, gw, gh));
    return {
      frames,
      delays: out.map((f) => f.delay),
      width: gw,
      height: gh,
      maxCount: Math.max(1, ...frames.map((f) => f.count)),
    };
  })();
  cache.set(url, job);
  job.catch(() => cache.delete(url));
  return job;
}
