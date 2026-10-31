import { BASE } from './utils/asset';
import type { ItemKind } from './types/item';
import type { SectionId } from './collections/types';

/* Base-aware routes:
     /                     home section
     /<section>            e.g. /cursors, /info
     /pets/<id>            a character (kept from the first version)
     /cursors/<id>, /themes/<id>, /packs/<id>, /showcase/<id>                 */

export type DetailKind = ItemKind | 'work';

const KIND_SEGMENT: Record<DetailKind, string> = {
  character: 'pets',
  cursor: 'cursors',
  theme: 'themes',
  pack: 'packs',
  work: 'showcase',
};
const SEGMENT_KIND = Object.fromEntries(Object.entries(KIND_SEGMENT).map(([k, v]) => [v, k])) as Record<string, DetailKind>;
const SECTION_SEGMENT: Partial<Record<SectionId, string>> = { characters: 'characters' };

export interface Route {
  section?: SectionId;
  detail?: { kind: DetailKind; id: string };
}

const strip = (pathname: string) => {
  const p = BASE !== '/' && pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname.replace(/^\//, '');
  return p.replace(/\/+$/, '');
};

export function parseRoute(pathname = window.location.pathname): Route {
  const [a, b] = strip(pathname).split('/').filter(Boolean).map(decodeURIComponent);
  if (!a) return {};
  if (b && SEGMENT_KIND[a]) return { detail: { kind: SEGMENT_KIND[a], id: b } };
  const sections: SectionId[] = ['all', 'characters', 'cursors', 'themes', 'packs', 'showcase', 'favourites', 'folders', 'info'];
  if (a === 'pets') return { section: 'characters' };
  return sections.includes(a as SectionId) ? { section: a as SectionId } : {};
}

export const sectionPath = (section: SectionId, home: SectionId) =>
  section === home ? BASE : `${BASE}${SECTION_SEGMENT[section] ?? section}`;

export const detailPath = (kind: DetailKind, id: string) => `${BASE}${KIND_SEGMENT[kind]}/${encodeURIComponent(id)}`;

export const isDetailPath = (pathname = window.location.pathname) => !!parseRoute(pathname).detail;

export function go(path: string, replace = false) {
  if (window.location.pathname === path) return;
  if (replace) window.history.replaceState({}, '', path);
  else window.history.pushState({}, '', path);
}

export const shareUrl = (path: string) => new URL(path, window.location.origin).toString();
