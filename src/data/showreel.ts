import { PetAction, PetDefinition } from '../types/pet';
import { resolveSpritePath } from '../components/PetRenderer';

/* A pet's showreel: the short, self-playing loop each tile runs so a visitor
   learns what the companion does without touching a control. Moments are
   listed in story order; any that resolve to the same clip as an earlier one
   (e.g. "sleep" on a species with no nap sprite) are dropped. */

export interface ReelMoment {
  action: PetAction;
  caption: string;
}

const CANDIDATES: { action: PetAction; caption: (pet: PetDefinition) => string }[] = [
  { action: 'idle', caption: () => 'Waits by your prompt' },
  { action: 'walk', caption: () => 'Patrols the status bar' },
  { action: 'code', caption: () => 'Swats stray bugs' },
  { action: 'play', caption: () => 'Plays while tests run' },
  { action: 'celebrate', caption: () => 'Cheers a green build' },
  {
    action: 'sleep',
    caption: (pet) =>
      pet.sprites.sleep.includes('_stand_')
        ? 'Stands guard'
        : pet.sprites.sleep.includes('_land_')
        ? 'Lands on your dock'
        : 'Naps while you’re away',
  },
  { action: 'special', caption: (pet) => pet.signatureMove },
  // Species without a climb/stand clip show their signature move as a dash instead
  { action: 'dance', caption: (pet) => pet.signatureMove },
];

const cache = new Map<string, ReelMoment[]>();

export function getShowreel(pet: PetDefinition): ReelMoment[] {
  const cached = cache.get(pet.id);
  if (cached) return cached;

  const seen = new Set<string>();
  const reel: ReelMoment[] = [];
  for (const c of CANDIDATES) {
    const clip = resolveSpritePath(pet, c.action);
    if (seen.has(clip)) continue;
    if (c.action === 'dance' && reel.some((m) => m.action === 'special')) continue;
    seen.add(clip);
    reel.push({ action: c.action, caption: c.caption(pet) });
  }
  cache.set(pet.id, reel);
  return reel;
}

/** Stable small hash so every tile starts its loop at a different beat. */
export function petHash(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash;
}
