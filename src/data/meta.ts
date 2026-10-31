import spriteMeta from './spriteMeta.json';
import { canonical } from '../utils/asset';

/* [width, height, unit, x0, y0, x1, y1, lum] — see scripts/sprite-meta.mjs */
export type SpriteMeta = [number, number, number, number, number, number, number, number?];
const META = spriteMeta as unknown as Record<string, SpriteMeta>;

export const spriteMetaFor = (path: string): SpriteMeta | undefined => META[canonical(path)];
