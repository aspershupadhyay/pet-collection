import type { CursorPalette, CursorRole, CursorSet } from '../types/item';

/* Cursors are drawn as 16×16 pixel art. Each shape is a function that says
   which pixels are inside (fill) or accent; the outline and the highlight
   are derived, so every glyph gets the same crisp one-pixel edge. */

const N = 16;
type Ink = 0 | 1 | 2; // empty, fill, accent
type Shape = (x: number, y: number) => Ink;

const inEllipse = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) =>
  ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

const inPoly = (x: number, y: number, pts: [number, number][]) => {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

const fromRows = (rows: string[]): Shape => (x, y) => {
  const c = rows[y]?.[x];
  return c === 'f' ? 1 : c === 'a' ? 2 : 0;
};

const ARROW: [number, number][] = [
  [1, 1], [1, 13.2], [4.2, 10.4], [6.6, 15], [8.6, 14], [6.4, 9.6], [10.6, 9.4],
];

const SHAPES: Record<CursorRole | CursorSet['glyph'], Shape> = {
  default: (x, y) => (inPoly(x, y, ARROW) ? 1 : 0),
  text: (x, y) => {
    if (x >= 7 && x < 9 && y >= 2 && y < 14) return 1;
    if ((y >= 1 && y < 3) || (y >= 13 && y < 15)) return x >= 5 && x < 11 && !(x >= 7 && x < 9 && (y === 1 || y === 14)) ? 1 : 0;
    return 0;
  },
  wait: (x, y) => {
    if (y >= 1 && y < 3 && x >= 3 && x < 13) return 1;
    if (y >= 13 && y < 15 && x >= 3 && x < 13) return 1;
    const half = Math.abs(y - 8) + 0.2;
    if (y >= 3 && y < 13 && Math.abs(x + 0.5 - 8) <= half * 0.85 + 0.6) {
      const sand = (y > 9 && Math.abs(x + 0.5 - 8) <= (y - 9) * 0.85) || (y < 7 && y > 4 && Math.abs(x + 0.5 - 8) <= 1.4);
      return sand ? 2 : 1;
    }
    return 0;
  },
  pointer: () => 0, // replaced by the set's glyph
  // Hand-placed: at 16 px, toes drawn from circles melt into the pad
  paw: fromRows([
    '................',
    '................',
    '....fff..fff....',
    '....fff..fff....',
    '....fff..fff....',
    '................',
    '.fff........fff.',
    '.fff........fff.',
    '.fff..ffff..fff.',
    '.....ffffff.....',
    '....ffffffff....',
    '....ffffffff....',
    '....ffffffff....',
    '.....ffffff.....',
    '................',
    '................',
  ]),
  claw: (x, y) => {
    const px = x + 0.5;
    const py = y + 0.5;
    if (!inEllipse(px, py, 8, 8.6, 6, 6.2)) return 0;
    if (py < 8.4 && Math.abs(px - 8.6) < (8.4 - py) * 0.62 + 0.6) return 0; // the notch
    return inEllipse(px, py, 8, 11, 2.4, 1.6) ? 2 : 1;
  },
  duck: (x, y) => {
    const px = x + 0.5;
    const py = y + 0.5;
    if (inEllipse(px, py, 12.6, 8.8, 3, 1.6)) return 2;
    if (inEllipse(px, py, 7, 7.6, 5, 5.2)) return Math.abs(px - 7.6) < 0.9 && Math.abs(py - 6.2) < 0.9 ? 0 : 1;
    return 0;
  },
  leaf: (x, y) => {
    const px = x + 0.5 - 8;
    const py = y + 0.5 - 8;
    const u = (px + py) / Math.SQRT2;
    const v = (px - py) / Math.SQRT2;
    if ((u / 7.2) ** 2 + (v / 3.6) ** 2 > 1) return 0;
    return Math.abs(v) < 0.55 ? 2 : 1;
  },
  bolt: (x, y) =>
    inPoly(x + 0.5, y + 0.5, [[9.5, 0.5], [3, 9], [7.5, 9], [5.5, 15.5], [13, 6.5], [8.5, 6.5], [10.5, 0.5]]) ? 1 : 0,
  star: (x, y) => {
    const pts: [number, number][] = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 2.9 : 6.8;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      pts.push([8 + Math.cos(a) * r, 8.6 + Math.sin(a) * r]);
    }
    return inPoly(x + 0.5, y + 0.5, pts) ? 1 : 0;
  },
  ghost: (x, y) => {
    const px = x + 0.5;
    const py = y + 0.5;
    const body = inEllipse(px, py, 8, 6.6, 5.6, 5.6) || (py >= 6.6 && py < 14 && px > 2.4 && px < 13.6);
    const hem = py > 12.4 && Math.floor((px - 2.4) / 2.8) % 2 === 1;
    if (!body || hem) return 0;
    if (inEllipse(px, py, 6, 7, 0.9, 1.3) || inEllipse(px, py, 10, 7, 0.9, 1.3)) return 2;
    return 1;
  },
  heart: (x, y) => {
    const px = (x + 0.5 - 8) / 6.6;
    const py = -(y + 0.5 - 7.4) / 6.6;
    return (px * px + py * py - 1) ** 3 - px * px * py ** 3 <= 0 ? 1 : 0;
  },
};

export const HOTSPOT: Record<CursorRole, [number, number]> = {
  default: [1, 1],
  pointer: [7, 2],
  text: [8, 8],
  wait: [8, 8],
};

function grid(shape: Shape): string[] {
  const ink: Ink[][] = Array.from({ length: N }, (_, y) => Array.from({ length: N }, (_, x) => shape(x, y)));
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= N || y >= N ? 0 : ink[y][x]);
  return ink.map((row, y) =>
    row
      .map((v, x) => {
        if (v === 2) return 'a';
        if (v === 1) return at(x - 1, y) === 0 || at(x, y - 1) === 0 ? 'h' : 'f';
        // Outline: empty pixels touching ink (8-neighbourhood keeps diagonals sealed)
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (at(x + dx, y + dy)) return 'o';
        return '.';
      })
      .join('')
  );
}

const cache = new Map<string, string[]>();
export function cursorGrid(set: CursorSet, role: CursorRole): string[] {
  const key = role === 'pointer' ? set.glyph : role;
  let g = cache.get(key);
  if (!g) {
    g = grid(SHAPES[key]);
    cache.set(key, g);
  }
  return g;
}

/** Pixel grid → SVG, merging horizontal runs so files stay tiny. */
export function cursorSvg(set: CursorSet, role: CursorRole, px = 2): string {
  const g = cursorGrid(set, role);
  const colour: Record<string, string> = {
    o: set.palette.outline,
    f: set.palette.fill,
    h: set.palette.highlight,
    a: set.palette.accent,
  };
  const rects: string[] = [];
  g.forEach((row, y) => {
    let x = 0;
    while (x < N) {
      const c = row[x];
      if (c === '.') {
        x++;
        continue;
      }
      let w = 1;
      while (x + w < N && row[x + w] === c) w++;
      rects.push(`<rect x="${x}" y="${y}" width="${w}" height="1" fill="${colour[c] ?? colour.f}"/>`);
      x += w;
    }
  });
  const size = N * px;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges">${rects.join('')}</svg>`;
}

export const svgDataUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

export function cursorCssValue(set: CursorSet, role: CursorRole, fallback: string): string {
  const [hx, hy] = HOTSPOT[role];
  return `url("${svgDataUri(cursorSvg(set, role))}") ${hx * 2} ${hy * 2}, ${fallback}`;
}

export function cursorCss(set: CursorSet, selector = ':root'): string {
  return [
    `${selector}, ${selector} * { cursor: ${cursorCssValue(set, 'default', 'auto')}; }`,
    `${selector} a, ${selector} button, ${selector} [role="button"], ${selector} summary { cursor: ${cursorCssValue(set, 'pointer', 'pointer')}; }`,
    `${selector} input, ${selector} textarea, ${selector} [contenteditable] { cursor: ${cursorCssValue(set, 'text', 'text')}; }`,
    `${selector} [aria-busy="true"] { cursor: ${cursorCssValue(set, 'wait', 'wait')}; }`,
  ].join('\n');
}

export const CURSOR_ROLES: { role: CursorRole; label: string }[] = [
  { role: 'default', label: 'Pointer' },
  { role: 'pointer', label: 'Link' },
  { role: 'text', label: 'Text' },
  { role: 'wait', label: 'Busy' },
];

export type { CursorPalette };
