import type { CursorPalette, CursorSet } from '../types/item';

/* One house palette for every set: the same ink outline and the same
   lightness and saturation band, so the sets read as one family. */
const INK = '#1b1a22';
const HOUSE = {
  ember: '#f2994a',
  coral: '#eb5e55',
  sun: '#f2c94c',
  sage: '#6fcf97',
  sky: '#56ccf2',
  iris: '#9b8cff',
  bone: '#f4f1ea',
  rose: '#f28db2',
} as const;

const tint = (hex: string, amount: number) => {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `#${[n >> 16, (n >> 8) & 255, n & 255].map((c) => mix(c).toString(16).padStart(2, '0')).join('')}`;
};

const palette = (fill: keyof typeof HOUSE, accent: keyof typeof HOUSE | 'ink'): CursorPalette => ({
  outline: INK,
  fill: HOUSE[fill],
  highlight: tint(HOUSE[fill], 0.5),
  accent: accent === 'ink' ? INK : HOUSE[accent],
});

/* Eight pixel cursor sets, each drawn for a character in the collection.
   Every set ships four cursors: pointer, link, text and busy. */
export const CURSORS: CursorSet[] = [
  {
    id: 'paw-print',
    name: 'Paw Print',
    tagline: 'Socrates leaves a print on everything you click.',
    description: 'A warm ember pointer with a paw for links. Easy to find on light and dark pages.',
    author: 'Petcraft',
    glyph: 'paw',
    palette: palette('ember', 'bone'),
    tone: HOUSE.ember,
    petId: 'void_cat',
  },
  {
    id: 'ferris-claw',
    name: 'Ferris Claw',
    tagline: 'Pinch a link. Borrow nothing.',
    description: 'Coral red with a pincer for links, drawn for Ferris and anyone who writes Rust.',
    author: 'Petcraft',
    glyph: 'claw',
    palette: palette('coral', 'bone'),
    tone: HOUSE.coral,
    petId: 'ferris_crab',
  },
  {
    id: 'quack',
    name: 'Quack',
    tagline: 'A rubber duck that points at the bug for you.',
    description: 'Sun yellow with an ember bill. The link cursor is Quackers himself.',
    author: 'Petcraft',
    glyph: 'duck',
    palette: palette('sun', 'ember'),
    tone: HOUSE.sun,
    petId: 'rubber_duck',
  },
  {
    id: 'moss',
    name: 'Moss',
    tagline: 'Slow, green and quietly precise.',
    description: 'A soft sage green set for calm, low-contrast setups. The link cursor is a leaf.',
    author: 'Petcraft',
    glyph: 'leaf',
    palette: palette('sage', 'ink'),
    tone: HOUSE.sage,
    petId: 'zen_turtle',
  },
  {
    id: 'live-wire',
    name: 'Live Wire',
    tagline: 'Every click lands with a little charge.',
    description: 'Electric sky blue with a sun-yellow spark, after Zappy. The link cursor is a bolt.',
    author: 'Petcraft',
    glyph: 'bolt',
    palette: palette('sky', 'sun'),
    tone: HOUSE.sky,
    petId: 'zappy_bolt',
  },
  {
    id: 'starlight',
    name: 'Starlight',
    tagline: 'For pages that deserve a little magic.',
    description: 'Iris and rose, drawn for Celestia. The link cursor is a five-point star.',
    author: 'Petcraft',
    glyph: 'star',
    palette: palette('iris', 'rose'),
    tone: HOUSE.iris,
    petId: 'magical_unicorn',
  },
  {
    id: 'boo',
    name: 'Boo',
    tagline: 'Haunts your links, politely.',
    description: 'Bone white with ink outlines. Skelly approves.',
    author: 'Petcraft',
    glyph: 'ghost',
    palette: palette('bone', 'ink'),
    tone: HOUSE.bone,
    petId: 'skeleton_warrior',
  },
  {
    id: 'sweetheart',
    name: 'Sweetheart',
    tagline: 'A pink pointer for things you love.',
    description: 'Rose pink with a heart for links, after Usagi the bunny.',
    author: 'Petcraft',
    glyph: 'heart',
    palette: palette('rose', 'bone'),
    tone: HOUSE.rose,
    petId: 'pixel_bunny',
  },
];
