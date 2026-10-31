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

/* Each companion's own take on every moment. Anything missing falls back to
   the generic caption above. Keep lines short: they share a card with the pet. */
const PET_LINES: Record<string, Partial<Record<PetAction, string>>> = {
  akita_inu: { idle: 'Sits by your prompt', walk: 'Walks the terminal beat', code: 'Guards the test run', play: 'Fetches a stray ball', celebrate: 'Bolts when tests pass', sleep: 'Dozes, one ear up' },
  totoro_spirit: { idle: 'Breathes like a forest', walk: 'Pads across your tabs', code: 'Shakes acorns loose', play: 'Bounces a seed', celebrate: 'Leaps over the canopy', sleep: 'Naps on a tab' },
  kitsune_fox: { idle: 'Watches your cursor', walk: 'Trots through autumn', code: 'Pounces on a bug', play: 'Chases the ball', celebrate: 'Dashes on deploy', sleep: 'Curls up for deep work' },
  void_cat: { idle: 'Judges your commits', walk: 'Strolls the status bar', code: 'Swipes at your cursor', play: 'Bats the ball around', celebrate: 'Zooms after a merge', sleep: 'Lands on all fours' },
  ferris_crab: { idle: 'Waits on cargo build', walk: 'Scuttles sideways', code: 'Pinches a borrow error', play: 'Juggles a lifetime', celebrate: 'Zero panics, full sprint' },
  rubber_duck: { idle: 'Listens. Just listens.', walk: 'Waddles to the bug', code: 'Quacks at line 42', play: 'Bobs with the ball', celebrate: 'Race condition solved' },
  clippy_assistant: { idle: 'Has a suggestion', walk: 'Wiggles a little closer', code: 'Refactors, unasked', play: 'Plays fetch with a doc', celebrate: 'Was right all along' },
  deno_dino: { idle: 'Checks permissions', walk: 'Stomps through TS', code: 'Blocks --allow-all', play: 'Kicks a dependency', celebrate: 'No build step needed' },
  bamboo_panda: { idle: 'Chews on bamboo', walk: 'Ambles to the snacks', code: 'Swats a warning away', play: 'Rolls with the ball', celebrate: 'Tumbles on a merge', sleep: 'Belly-flops for a nap', dance: 'Waddles at full speed' },
  jimothy_raccoon: { idle: 'Eyes your node_modules', walk: 'Sneaks past the linter', code: 'Steals unused imports', play: 'Found a shiny ball', celebrate: 'Bundle shrank 40%', sleep: 'Sleeps till midnight' },
  morph_shapeshifter: { idle: 'Floats by your cursor', walk: 'Drifts across the doc', code: 'Mimics your syntax', play: 'Blobs around a ball', celebrate: 'Bubbles on success' },
  mod_dotnet_bot: { idle: 'Hovers on standby', walk: 'Patrols the services', code: 'Compiles in parallel', play: 'Scans the ball', celebrate: 'All pods green' },
  magical_unicorn: { idle: 'Tosses a rainbow mane', walk: 'Canters across monitors', code: 'Kicks a stale branch', play: 'Noses the ball along', celebrate: 'Prismatic Canter', sleep: 'Stands like a statue' },
  pixel_bunny: { idle: 'Twitches its nose', walk: 'Hops across the dock', code: 'Thumps at a bug', play: 'Nudges the ball', celebrate: 'Binkies on green tests', sleep: 'Flops for a nap', special: 'Stands up to listen' },
  cockatiel_bird: { idle: 'Bobs to your typing', walk: 'Struts the keyboard', code: 'Pecks out a typo', play: 'Rolls a millet ball', celebrate: 'Whistles a release' },
  tree_frog: { idle: 'Sits on a lily tab', walk: 'Hops between files', code: 'Snaps up exceptions', play: 'Bounces the ball', celebrate: 'Leaps a merge conflict' },
  wall_squirrel: { idle: 'Guards the nut cache', walk: 'Scurries the sidebar', code: 'Digs for lost files', play: 'Hoards the ball', celebrate: 'Sprints, caffeinated', sleep: 'Naps on the wall', special: 'Climbs the window edge' },
  zappy_bolt: { idle: 'Crackles at cold start', walk: 'Zips between regions', code: 'Zaps a hot path', play: 'Charges the ball', celebrate: 'Scales up instantly' },
  skeleton_warrior: { idle: 'Rattles at idle', walk: 'Marches on legacy code', code: 'Slashes dead code', play: 'Bones and a ball', celebrate: 'Survived another sprint', sleep: 'Keeps eternal watch' },
  zen_turtle: { idle: 'Reads every line', walk: 'Reviews, slowly', code: 'Blocks a regression', play: 'Nudges the ball, wisely', celebrate: 'Approves the PR', sleep: 'Retreats into its shell' },
  python_snake: { idle: 'Checks indentation', walk: 'Slithers through scripts', code: 'Strikes a TypeError', play: 'Coils round the ball', celebrate: 'pip install: success' },
  finley_fish: { idle: 'Floats by a container', walk: 'Swims across pods', code: 'Puffs up at a bug', play: 'Bubbles the ball', celebrate: 'Splashes on deploy' },
  pixel_chicken: { idle: 'Up before the cron', walk: 'Struts the timeline', code: 'Pecks away bugs', play: 'Kicks the ball', celebrate: 'Clucks right on time' },
  plush_monkey: { idle: 'Hugs its plush pal', walk: 'Swings by your tabs', code: 'Swats a bug, one-handed', play: 'Tosses the ball', celebrate: 'Monkey-patches prod' },
  lab_rat: { idle: 'Sniffs through your logs', walk: 'Scurries in the walls', code: 'Gnaws a loose wire', play: 'Rolls the cheese ball', celebrate: 'Escapes the maze' },
  mossy_rocky: { idle: 'Is a rock. Mostly.', walk: 'Shuffles, somehow', code: 'Squashes a bug', celebrate: 'Rocks steady' },
  garden_snail: { idle: 'Takes its time', walk: 'Slides toward the bug', code: 'Slimes a typo', play: 'Pushes the ball', celebrate: 'Ships, eventually' },
};

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
    reel.push({ action: c.action, caption: PET_LINES[pet.id]?.[c.action] ?? c.caption(pet) });
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
