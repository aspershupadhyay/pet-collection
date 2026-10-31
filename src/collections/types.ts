import type { ItemKind } from '../types/item';

/** A browsable section in the sidebar. */
export type SectionId =
  | 'all'
  | 'characters'
  | 'cursors'
  | 'themes'
  | 'packs'
  | 'showcase'
  | 'favourites'
  | 'folders'
  | 'info';

export const SECTION_KIND: Partial<Record<SectionId, ItemKind>> = {
  characters: 'character',
  cursors: 'cursor',
  themes: 'theme',
  packs: 'pack',
};

export interface FeaturedSlot {
  /** Item key (see itemKey) or empty for an open sponsor slot. */
  key: string;
  title: string;
  label: string;
  description: string;
}

/**
 * Everything brand- and content-specific about a site lives in one of these.
 * Launch a new themed collection by adding a file next to this one and
 * building with VITE_COLLECTION=<file name>.
 */
export interface CollectionConfig {
  id: string;
  brand: {
    name: string;
    /** Shown after the logo mark, e.g. "petcraft". */
    wordmark: string;
    tagline: string;
    /** One-sentence intro in the sidebar and mobile header. */
    intro: string;
    /** Meta description / PWA description. */
    description: string;
    sponsorEmail: string;
    contactEmail: string;
  };
  /** Sidebar sections, in order. The first is the home page. */
  sections: SectionId[];
  /** Which kinds the collection carries. */
  kinds: ItemKind[];
  heroes: Partial<Record<SectionId, { title: string; subtitle: string }>>;
  featured: FeaturedSlot[];
  sponsorPlacements: { name: string; price: string; detail: string }[];
}
