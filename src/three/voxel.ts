import { parseGIF, decompressFrames } from 'gifuct-js';
import spriteMeta from '../data/spriteMeta.json';

/* Turns an 8fps pixel GIF into stacks of voxels, one per art pixel. Depth
   grows with distance from the silhouette edge, so a flat sprite becomes a
   rounded little figure you can turn all the way around. */

type Meta = [number, number, number, number, number, number, number, number];
const META = spriteMeta as unknown as Record<string, Meta>;

export interface VoxelFrame {
  count: number;
  /** x, y, thickness per voxel */
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

async function decodeFrames(url: string) {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const gif = parseGIF(buf);
  const frames = decompressFrames(gif, true);
  const W = gif.lsd.width;
  const H = gif.lsd.height;
  const canvas = new Uint8ClampedArray(W * H * 4);
  const out: { pixels: Uint8ClampedArray; delay: number }[] = [];

  for (const f of frames) {
    const { width: w, height: h, left, top } = f.dims;
    const before = f.disposalType === 3 ? canvas.slice() : null;
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const si = (y * w + x) * 4;
        if (f.patch[si + 3] === 0) continue;
        const cx = left + x;
        const cy = top + y;
        if (cx >= W || cy >= H) continue;
        const di = (cy * W + cx) * 4;
        canvas[di] = f.patch[si];
        canvas[di + 1] = f.patch[si + 1];
        canvas[di + 2] = f.patch[si + 2];
        canvas[di + 3] = 255;
      }
    }
    out.push({ pixels: canvas.slice(), delay: Math.max(60, f.delay || 125) });
    if (f.disposalType === 2) {
      for (let y = 0; y < h; y += 1) {
        canvas.fill(0, ((top + y) * W + left) * 4, ((top + y) * W + left + w) * 4);
      }
    } else if (before) {
      canvas.set(before);
    }
  }
  return { W, H, out };
}

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

  let count = 0;
  for (let k = 0; k < solid.length; k += 1) count += solid[k];
  const cells = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  let n = 0;
  for (let j = 0; j < gh; j += 1) {
    for (let i = 0; i < gw; i += 1) {
      const k = j * gw + i;
      if (!solid[k]) continue;
      cells[n * 3] = i - gw / 2 + 0.5;
      cells[n * 3 + 1] = gh - j - 0.5; // feet on y = 0
      cells[n * 3 + 2] = Math.min(9, 1 + Math.sqrt(dist[k] - 0.5) * 1.6);
      colors[n * 3] = rgb[k * 3];
      colors[n * 3 + 1] = rgb[k * 3 + 1];
      colors[n * 3 + 2] = rgb[k * 3 + 2];
      n += 1;
    }
  }
  return { count, cells, colors };
}

export function loadVoxelClip(url: string): Promise<VoxelClip> {
  const hit = cache.get(url);
  if (hit) return hit;
  const job = (async () => {
    const { W, H, out } = await decodeFrames(url);
    const meta = META[url];
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
