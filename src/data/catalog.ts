import { PETS } from './pets';
import { CURSORS } from './cursors';
import { THEMES } from './themes';
import { PACKS } from './packs';
import type { CatalogItem, ItemKind } from '../types/item';
import type { PetDefinition } from '../types/pet';

export const characterItem = (pet: PetDefinition): CatalogItem => ({ kind: 'character', id: pet.id, name: pet.name, pet });

export const CURSOR_ITEMS: CatalogItem[] = CURSORS.map((cursor) => ({ kind: 'cursor', id: cursor.id, name: cursor.name, cursor }));
export const THEME_ITEMS: CatalogItem[] = THEMES.map((theme) => ({ kind: 'theme', id: theme.id, name: theme.name, theme }));
export const PACK_ITEMS: CatalogItem[] = PACKS.map((pack) => ({ kind: 'pack', id: pack.id, name: pack.name, pack }));

export const petById = new Map(PETS.map((p) => [p.id, p]));
export const cursorById = new Map(CURSORS.map((c) => [c.id, c]));
export const themeById = new Map(THEMES.map((t) => [t.id, t]));

/** The "Everything" wall: characters with the other kinds woven in, so the
    page reads as one collection rather than four lists stacked up. */
export function mixCatalog(characters: CatalogItem[], others: CatalogItem[][]): CatalogItem[] {
  const queues = others.map((list) => [...list]);
  const out: CatalogItem[] = [];
  characters.forEach((c, i) => {
    out.push(c);
    if (i % 2 === 1) {
      const q = queues[Math.floor(i / 2) % queues.length];
      const next = q?.shift();
      if (next) out.push(next);
    }
  });
  queues.forEach((q) => out.push(...q));
  return out;
}

/* Cursors, themes, packs and showcase work all sit on the same neutral
   studio grey, so the artwork brings the colour and the wall stays calm.
   Characters keep a tint from their own palette. */
export const STUDIO_TONE = '#8b8b92';

export function itemTone(item: CatalogItem): string {
  return item.kind === 'character' ? item.pet.primaryColor : STUDIO_TONE;
}

export function itemTagline(item: CatalogItem): string {
  switch (item.kind) {
    case 'character':
      return item.pet.tagline;
    case 'cursor':
      return item.cursor.tagline;
    case 'theme':
      return item.theme.tagline;
    case 'pack':
      return item.pack.tagline;
  }
}

export const KINDS: ItemKind[] = ['character', 'cursor', 'theme', 'pack'];

const BY_KEY = new Map<string, CatalogItem>(
  [...PETS.map(characterItem), ...CURSOR_ITEMS, ...THEME_ITEMS, ...PACK_ITEMS].map((item) => [
    item.kind === 'character' ? item.id : `${item.kind}:${item.id}`,
    item,
  ])
);

/** Look up anything by its favourites/folder key. */
export const itemByKey = (key: string): CatalogItem | undefined => BY_KEY.get(key);

export const itemOf = (kind: ItemKind, id: string): CatalogItem | undefined => BY_KEY.get(kind === 'character' ? id : `${kind}:${id}`);
