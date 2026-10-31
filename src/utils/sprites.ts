import { asset } from './asset';
import type { PetAction, PetDefinition } from '../types/pet';

/** Resolve the GIF for an action + coat, falling back to the closest clip the
    species actually ships (every coat has idle, walk, run, swipe and ball). */
export function resolveSpritePath(pet: PetDefinition, action: PetAction, variant: string = pet.sprites.variant): string {
  const folder = pet.sprites.folder;
  const base = asset(`/sprites/${folder}/${variant}`);

  switch (action) {
    case 'idle':
      return `${base}_idle_8fps.gif`;
    case 'walk':
      return `${base}_walk_8fps.gif`;
    case 'sleep':
      if (pet.sprites.sleep.includes('_lie_')) return `${base}_lie_8fps.gif`;
      if (pet.sprites.sleep.includes('_wallnap_')) return `${base}_wallnap_8fps.gif`;
      if (pet.sprites.sleep.includes('_stand_')) return `${base}_stand_8fps.gif`;
      if (pet.sprites.sleep.includes('_land_')) return `${base}_land_8fps.gif`;
      return `${base}_idle_8fps.gif`;
    case 'eat':
      return `${base}_swipe_8fps.gif`;
    case 'play':
      if (folder === 'rocky') return `${base}_walk_fast_8fps.gif`;
      return `${base}_with_ball_8fps.gif`;
    case 'dance':
      if (pet.sprites.stand && pet.sprites.stand.includes('_walk_fast_')) {
        return `${base}_walk_fast_8fps.gif`;
      }
      return `${base}_run_8fps.gif`;
    case 'code':
      return `${base}_swipe_8fps.gif`;
    case 'celebrate':
      if (pet.sprites.jump && pet.sprites.jump.includes('_jump_')) {
        return `${base}_jump_8fps.gif`;
      }
      return `${base}_run_8fps.gif`;
    case 'alert':
      if (pet.sprites.stand && pet.sprites.stand.includes('_stand_')) {
        return `${base}_stand_8fps.gif`;
      }
      return `${base}_swipe_8fps.gif`;
    case 'special':
      if (pet.sprites.climb && pet.sprites.climb.includes('_wallclimb_')) {
        return `${base}_wallclimb_8fps.gif`;
      }
      if (pet.sprites.stand && pet.sprites.stand.includes('_stand_')) {
        return `${base}_stand_8fps.gif`;
      }
      return `${base}_run_8fps.gif`;
    default:
      return `${base}_idle_8fps.gif`;
  }
}
