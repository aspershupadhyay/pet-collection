export type PetAction =
  | 'idle'
  | 'walk'
  | 'sleep'
  | 'eat'
  | 'play'
  | 'dance'
  | 'code'
  | 'celebrate'
  | 'alert'
  | 'special'
  | 'pet';

export type PetCategory =
  | 'All'
  | 'Mammals'
  | 'Mythical'
  | 'Cyber & AI'
  | 'Aquatic & Nature'
  | 'Avian';

export type PetHabitat = 'forest' | 'castle' | 'beach' | 'winter' | 'autumn' | 'library' | 'none';

export interface PetStats {
  codingSpeed: number;
  cuteness: number;
  energy: number;
  intelligence: number;
}

export interface PetSprites {
  folder: string;
  variant: string;
  idle: string;
  walk: string;
  run: string;
  sleep: string;
  swipe: string;
  withBall: string;
  climb?: string;
  jump?: string;
  stand?: string;
  land?: string;
}

export interface ClaudeBuddyAscii {
  species: string;
  hat: string;
  frames: [string[], string[], string[]];
}

export interface PetDefinition {
  id: string;
  name: string;
  species: string;
  tagline: string;
  description: string;
  category: Exclude<PetCategory, 'All'>;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  eyeColor: string;
  author: string;
  toolOrigin: 'Claude Code' | 'VS Code Pets' | 'Orca CLI' | 'Cursor IDE' | 'Codex Desktop';
  habitat: PetHabitat;
  availableVariants: string[];
  sprites: PetSprites;
  claudeAscii: ClaudeBuddyAscii;
  stats: PetStats;
  favoriteFood: string;
  signatureMove: string;
  personality: string[];
  soundPitch: number;
}

export interface ActionMeta {
  id: PetAction;
  label: string;
  shortcut: string;
  description: string;
  iconName: string;
}

export interface PetFolder {
  id: string;
  name: string;
  color: string;
  petIds: string[];
  createdAt: string;
}

