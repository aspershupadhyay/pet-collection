import { parseGIF, decompressFrames } from 'gifuct-js';
import { spriteMetaFor } from '../data/meta';

/* One decoder for every renderer. GIFs are composited into full frames once
   and cached, so the 2D canvas and the 3D voxels share the work. */

export interface DecodedGif {
  W: number;
  H: number;
  out: { pixels: Uint8ClampedArray; delay: number }[];
}

const cache = new Map<string, Promise<DecodedGif>>();

async function decode(url: string): Promise<DecodedGif> {
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


export function decodeGif(url: string): Promise<DecodedGif> {
  let job = cache.get(url);
  if (!job) {
    job = decode(url);
    cache.set(url, job);
    job.catch(() => cache.delete(url));
  }
  return job;
}

/* Frames snapped back to the art grid: pre-scaled sheets are sampled at the
   centre of each art pixel, so soft resampling in the source disappears and
   the renderer can scale up with hard edges. */
export interface ArtClip {
  frames: HTMLCanvasElement[];
  delays: number[];
  /** Art pixels → GIF pixels. */
  unit: number;
}

const artCache = new Map<string, Promise<ArtClip>>();

export function loadArtClip(url: string): Promise<ArtClip> {
  let job = artCache.get(url);
  if (job) return job;
  job = decodeGif(url).then(({ W, H, out }) => {
    const unit = Math.max(1, spriteMetaFor(url)?.[2] ?? 1);
    const w = Math.ceil(W / unit);
    const h = Math.ceil(H / unit);
    const frames = out.map(({ pixels }) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const img = new ImageData(w, h);
      for (let y = 0; y < h; y += 1) {
        const sy = Math.min(H - 1, Math.floor(y * unit + unit / 2));
        for (let x = 0; x < w; x += 1) {
          const sx = Math.min(W - 1, Math.floor(x * unit + unit / 2));
          const si = (sy * W + sx) * 4;
          const di = (y * w + x) * 4;
          img.data[di] = pixels[si];
          img.data[di + 1] = pixels[si + 1];
          img.data[di + 2] = pixels[si + 2];
          img.data[di + 3] = pixels[si + 3] > 127 ? 255 : 0;
        }
      }
      c.getContext('2d')!.putImageData(img, 0, 0);
      return c;
    });
    return { frames, delays: out.map((f) => f.delay), unit };
  });
  artCache.set(url, job);
  job.catch(() => artCache.delete(url));
  return job;
}
