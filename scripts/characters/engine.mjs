/* Tiny pixel-art engine for the original Petcraft characters.

   Characters are drawn as *materials* (body, belly, eye…) with simple
   shapes. The engine then does what a pixel artist would by hand:
   - shading: the lower-right edge of every shadeable area gets its shade
     colour, the upper-left edge its highlight (light from the top left)
   - outline: one pixel of dark, hue-tinted outline around the silhouette
   - eyes: dark pupils with a one-pixel shine
   Output is a palette-indexed RGBA frame at art resolution (1 px = 1 art px). */

export const W = 48;
export const H = 44;
export const FLOOR = 41; // feet stand on this row

export class Grid {
  constructor() {
    this.m = Array.from({ length: H }, () => new Array(W).fill(null));
  }
  set(x, y, mat) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    this.m[y][x] = mat;
  }
  get(x, y) {
    if (x < 0 || y < 0 || x >= W || y >= H) return null;
    return this.m[y][x];
  }
  ell(cx, cy, rx, ry, mat) {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++)
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, mat);
      }
  }
  rect(x0, y0, x1, y1, mat) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, mat);
  }
  poly(pts, mat) {
    const ys = pts.map((p) => p[1]);
    const xs = pts.map((p) => p[0]);
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
        if (inside) this.set(x, y, mat);
      }
  }
  /** Only paint where something is already drawn (markings, bellies). */
  clipEll(cx, cy, rx, ry, mat, within) {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++)
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        const cur = this.get(x, y);
        if (dx * dx + dy * dy <= 1 && cur && (!within || within.includes(cur))) this.set(x, y, mat);
      }
  }
  px(list, mat) {
    for (const [x, y] of list) this.set(x, y, mat);
  }
  /** Eyes: open (pupil + shine), shut (a line), happy (^ ^), wide. */
  eye(x, y, style = 'open', size = 'md') {
    if (style === 'shut') {
      this.rect(x, y + 2, x + 2, y + 2, 'ink');
      return;
    }
    if (style === 'happy') {
      this.px([[x, y + 2], [x + 1, y + 1], [x + 2, y + 2]], 'ink');
      return;
    }
    if (size === 'lg') {
      this.rect(x, y, x + 3, y + 3, 'ink');
      this.set(x, y, 'shine');
      this.set(x + 1, y, 'shine');
      this.set(x, y + 1, 'shine');
      return;
    }
    this.rect(x, y, x + 1, y + 2, 'ink');
    this.set(x, y, 'shine');
  }
}

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

/* palette: { body, belly?, accent?, extra?, ink, blush, ... } as hex.
   Every material that ends in a colour name gets an automatic shade and
   highlight derived from it, hue-shifted toward the outline colour. */
export function render(grid, palette) {
  const SHADEABLE = new Set(['body', 'belly', 'accent', 'extra', 'detail']);
  const solid = (x, y) => !!grid.get(x, y);
  const outline = hex(palette.outline);
  const colour = {};
  for (const [k, v] of Object.entries(palette)) colour[k] = hex(v);
  colour.shine = colour.shine ?? [255, 255, 255];
  colour.ink = colour.ink ?? mix(outline, [0, 0, 0], 0.3);

  const out = new Uint8ClampedArray(W * H * 4);
  const put = (x, y, rgb) => {
    const i = (y * W + x) * 4;
    out[i] = rgb[0];
    out[i + 1] = rgb[1];
    out[i + 2] = rgb[2];
    out[i + 3] = 255;
  };

  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const mat = grid.get(x, y);
      if (mat) {
        const base = colour[mat];
        if (!base) throw new Error(`No colour for material "${mat}"`);
        let c = base;
        if (SHADEABLE.has(mat)) {
          const same = (dx, dy) => grid.get(x + dx, y + dy) === mat;
          // light from the top left: lower/right edges fall into shade,
          // upper/left silhouette edges catch the light
          if (!same(0, 1) || !solid(x + 1, y)) c = mix(base, outline, 0.3);
          else if (!solid(x, y - 1) || !solid(x - 1, y)) c = mix(base, [255, 255, 255], 0.4);
        }
        put(x, y, c);
        continue;
      }
      // outline: empty pixel touching the silhouette (4-neighbourhood keeps it 1px)
      if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) put(x, y, outline);
    }
  return out;
}

/* ───── PNG writer for preview sheets (no dependencies) ───── */
import zlib from 'node:zlib';

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};
export function png(rgba, w, h) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
