import type { PetDefinition } from './pet';

/** Everything the shell can list. Characters are the existing pets. */
export type ItemKind = 'character' | 'cursor' | 'theme' | 'pack';

export type CursorRole = 'default' | 'pointer' | 'text' | 'wait';

export interface CursorPalette {
  outline: string;
  fill: string;
  highlight: string;
  accent: string;
}

export interface CursorSet {
  id: string;
  name: string;
  tagline: string;
  description: string;
  author: string;
  /** Signature glyph used for the link/hover cursor. */
  glyph: 'paw' | 'claw' | 'duck' | 'leaf' | 'bolt' | 'star' | 'ghost' | 'heart';
  palette: CursorPalette;
  /** Card / stage tone. */
  tone: string;
  /** Character it was drawn for, if any. */
  petId?: string;
}

export interface TerminalPalette {
  background: string;
  foreground: string;
  cursor: string;
  selection: string;
  /** 16 ANSI colours: black red green yellow blue magenta cyan white, then brights. */
  ansi: [string, string, string, string, string, string, string, string, string, string, string, string, string, string, string, string];
}

export interface TerminalTheme {
  id: string;
  name: string;
  tagline: string;
  description: string;
  author: string;
  mood: 'dark' | 'light';
  petId: string;
  colors: TerminalPalette;
}

export interface SpritePack {
  id: string;
  name: string;
  tagline: string;
  description: string;
  petIds: string[];
  themeId?: string;
  cursorId?: string;
  accent: string;
}

export type CatalogItem =
  | { kind: 'character'; id: string; name: string; pet: PetDefinition }
  | { kind: 'cursor'; id: string; name: string; cursor: CursorSet }
  | { kind: 'theme'; id: string; name: string; theme: TerminalTheme }
  | { kind: 'pack'; id: string; name: string; pack: SpritePack };

/** Stable key for favourites and folders. Characters keep their bare id so
    existing saved favourites keep working. */
export const itemKey = (item: Pick<CatalogItem, 'kind' | 'id'>) =>
  item.kind === 'character' ? item.id : `${item.kind}:${item.id}`;

export const KIND_LABEL: Record<ItemKind, { one: string; many: string }> = {
  character: { one: 'Character', many: 'Characters' },
  cursor: { one: 'Cursor set', many: 'Cursors' },
  theme: { one: 'Terminal theme', many: 'Terminal themes' },
  pack: { one: 'Sprite pack', many: 'Sprite packs' },
};
