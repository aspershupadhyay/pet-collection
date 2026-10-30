import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PetAction, PetDefinition, PetFolder } from '../types/pet';
import { ACTIONS } from '../data/pets';
import { PetRenderer } from './PetRenderer';
import { playPetSound } from '../utils/audio';
import { FolderPlus, Check } from 'lucide-react';

interface PetCardProps {
  pet: PetDefinition;
  globalAction: PetAction | 'auto';
  renderMode: 'pixel' | 'ascii';
  onSelectPet: (pet: PetDefinition, currentAction: PetAction, variant?: string) => void;
  onQuickCopy: (pet: PetDefinition) => void;
  isFavourite: boolean;
  onToggleFavourite: (petId: string) => void;
  muted: boolean;
  cardStyle?: 'finds' | 'catalogue';
  folders?: PetFolder[];
  onTogglePetInFolder?: (folderId: string, petId: string) => void;
}

const ACTION_SPEECH: Record<PetAction, string[]> = {
  idle: ['Ready to pair!', 'Standing by...', '*blinks*'],
  walk: ['Patrolling repo...', 'On the move!', 'Checking diffs...'],
  sleep: ['Zzz... compiling...', 'Dreaming in binary...', 'Snoozing...'],
  eat: ['Nom nom! Tokens!', 'Refueling context!', 'Yum!'],
  play: ['Catch the bug!', 'Wheee! 8fps!', 'Playtime!'],
  dance: ['Deploy Friday!', 'Grooving!', '♪ ♫ ♪'],
  code: ['git push --force', 'Shipping fast!', 'Zero warnings!'],
  celebrate: ['All tests pass!', 'LGTM! Ship it!', '100% coverage!'],
  alert: ['Prod is down?!', 'Merge conflict!', 'Check line 42!'],
  special: ['✨ ULTRA INSTINCT ✨', 'MAX OVERDRIVE!', 'S-Rank Companion!'],
  pet: ['Purrrr ♥', 'Best dev ever ♥', 'Happy companion!'],
};

const HABITAT_BACKGROUNDS: Record<string, string> = {
  forest: '/sprites/backgrounds/forest/background-light-medium.png',
  castle: '/sprites/backgrounds/castle/background-light-medium.png',
  beach: '/sprites/backgrounds/beach/background-light-medium.png',
  winter: '/sprites/backgrounds/winter/background-light-medium.png',
  autumn: '/sprites/backgrounds/autumn/background-light-medium.png',
  library: '/sprites/backgrounds/library/background-light-medium.png',
  none: '',
};

const AUTO_SEQUENCE: PetAction[] = ['idle', 'walk', 'play', 'code', 'celebrate', 'sleep'];

/* Masonry profiles — deterministic card aspect + sprite size per pet (hashed by
   id) so the column flow is stable across re-renders. Taller shapes host larger
   sprites; the narrowest simply gets a cosier stage. */
const MASONRY_RATIOS: { ratio: number; size: number }[] = [
  { ratio: 1.2, size: 210 },
  { ratio: 1.3, size: 200 },
  { ratio: 1.45, size: 190 },
  { ratio: 1.6, size: 180 },
  { ratio: 1.75, size: 170 },
];

function petMasonryProfile(id: string): { ratio: number; size: number } {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return MASONRY_RATIOS[hash % MASONRY_RATIOS.length];
}

/* Rarity tier accents — subtle, colour-coded, always legible in both themes */
const RARITY_TIER: Record<string, { color: string; glow: string }> = {
  Mythic: { color: '#a78bfa', glow: 'rgba(167,139,250,0.16)' },
  Legendary: { color: '#f59e0b', glow: 'rgba(245,158,11,0.14)' },
  Epic: { color: '#1f78ff', glow: 'rgba(31,120,255,0.13)' },
  Rare: { color: '#00bbff', glow: 'rgba(0,187,255,0.13)' },
  Common: { color: '#8b8b92', glow: 'rgba(139,139,146,0.12)' },
};

export const PetCard: React.FC<PetCardProps> = ({
  pet,
  globalAction,
  renderMode,
  onSelectPet,
  onQuickCopy,
  isFavourite,
  onToggleFavourite,
  muted,
  cardStyle = 'finds',
  folders = [],
  onTogglePetInFolder,
}) => {
  const [localAction, setLocalAction] = useState<PetAction>('idle');
  const [selectedVariant, setSelectedVariant] = useState<string>(pet.sprites.variant);
  const [showHabitat, setShowHabitat] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState(false);
  const [folderMenuOpen, setFolderMenuOpen] = useState(false);
  const [speech, setSpeech] = useState<string | null>(null);
  const [hearts, setHearts] = useState<{ id: number; x: number }[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  const effectiveAction: PetAction = globalAction === 'auto' ? localAction : globalAction;

  useEffect(() => {
    if (globalAction !== 'auto' || isHovered) return;
    const offset = (pet.id.charCodeAt(0) * 370) % 2800;
    const timer = setInterval(() => {
      setLocalAction((prev) => {
        const idx = AUTO_SEQUENCE.indexOf(prev);
        return AUTO_SEQUENCE[(idx + 1) % AUTO_SEQUENCE.length];
      });
    }, 4800 + offset);
    return () => clearInterval(timer);
  }, [globalAction, isHovered, pet.id]);

  const triggerAction = useCallback(
    (act: PetAction, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setLocalAction(act);
      playPetSound(act, pet.soundPitch, muted);

      const phrases = ACTION_SPEECH[act];
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      setSpeech(randomPhrase);

      if (act === 'pet' || act === 'celebrate') {
        setHearts((prev) => [...prev.slice(-4), { id: Date.now(), x: Math.random() * 40 - 20 }]);
      }
    },
    [pet.soundPitch, muted]
  );

  useEffect(() => {
    if (!speech) return;
    const t = setTimeout(() => setSpeech(null), 2000);
    return () => clearTimeout(t);
  }, [speech]);

  const cycleVariant = (e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = pet.availableVariants.indexOf(selectedVariant);
    const next = pet.availableVariants[(idx + 1) % pet.availableVariants.length];
    setSelectedVariant(next);
    playPetSound('play', pet.soundPitch * 1.1, muted);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectPet(pet, effectiveAction, selectedVariant);
    }
  };

  const stageHovered = isHovered && cardStyle !== 'catalogue';
  const tier = RARITY_TIER[pet.rarity] || RARITY_TIER.Common;
  const bgUrl = showHabitat && pet.habitat !== 'none' ? HABITAT_BACKGROUNDS[pet.habitat] : '';
  const masonry = cardStyle === 'catalogue' ? { ratio: 1.6, size: 180 } : petMasonryProfile(pet.id);

  return (
    <article className="group/tile cv-card relative mb-3 w-full break-inside-avoid" tabIndex={0} role="button"
      aria-label={`${pet.name}, ${pet.rarity} ${pet.species}`}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setFolderMenuOpen(false);
      }}
    >
      <div
        ref={cardRef}
        onClick={() => onSelectPet(pet, effectiveAction, selectedVariant)}
        className={`focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-page cursor-pointer relative overflow-hidden rounded-tile bg-well shadow-[inset_0_0_0_1px_var(--line)] transition-[transform,box-shadow] duration-200 ease-out hover:shadow-[inset_0_0_0_1px_var(--line-strong),0_18px_40px_-18px_rgba(0,0,0,0.35)] ${
          stageHovered ? '-translate-y-0.5' : ''
        }`}
        style={{ aspectRatio: `${masonry.ratio}` }}
      >
        <div className="round-clip relative size-full flex flex-col items-center justify-center">
          {/* Optional Pixel Habitat Background */}
          {bgUrl && (
            <img
              src={bgUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="pointer-events-none absolute inset-0 size-full object-cover pixelated opacity-70 transition-opacity duration-300"
            />
          )}

          {/* Ambient rarity wash — always on, deepens on hover */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 transition-opacity duration-300 opacity-70 group-hover/tile:opacity-100"
            style={{
              background: `radial-gradient(circle at 50% 46%, ${tier.glow} 0%, transparent 62%)`,
            }}
          />

          {/* Premium top-edge sheen on hover */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-3 top-0 h-14 opacity-0 transition-opacity duration-300 group-hover/tile:opacity-100"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.13) 0%, transparent 100%)',
              maskImage: 'radial-gradient(60% 100% at 50% 0%, black, transparent)',
              WebkitMaskImage: 'radial-gradient(60% 100% at 50% 0%, black, transparent)',
            }}
          />

          {/* Floating Speech Bubble — gentle pop, never bouncy */}
          {speech && (
            <div className="pointer-events-none absolute top-3 left-1/2 z-30 animate-speech-pop whitespace-nowrap rounded-full px-2.5 py-0.5 text-micro font-medium text-page bg-ink shadow-[0_6px_16px_-4px_rgba(0,0,0,0.45)]">
              {speech}
            </div>
          )}

          {/* Floating Hearts */}
          {hearts.map((h) => (
            <span
              key={h.id}
              className="pointer-events-none absolute top-1/3 left-1/2 z-30 text-xs select-none animate-heart-float"
              style={{ transform: `translateX(${h.x}px)` }}
            >
              ♥
            </span>
          ))}

          {/* Interactive Sprite Stage */}
          <div className="relative z-10 flex w-full items-center justify-center transition-transform duration-200 ease-out group-hover/tile:scale-[1.045]">
            <PetRenderer
              pet={pet}
              action={effectiveAction}
              size={masonry.size}
              tilt={false}
              bubbleClick={true}
              variantOverride={selectedVariant}
              habitatOverride={showHabitat ? pet.habitat : 'none'}
              renderMode={renderMode}
              onActionTrigger={(act) => triggerAction(act)}
            />
          </div>
        </div>

        {/* Top-left: Rarity tier chip + Coat / Variant cycler */}
        <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1">
          <span
            className="pointer-events-none inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-micro font-semibold tracking-wide text-white backdrop-blur-sm shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)]"
            style={{ color: tier.color }}
          >
            <span className="size-1.5 rounded-full" style={{ backgroundColor: tier.color, boxShadow: `0 0 6px ${tier.color}` }} />
            {pet.rarity}
          </span>

          {pet.availableVariants.length > 1 && (
            <button
              type="button"
              onClick={cycleVariant}
              title="Click to cycle coat colour"
              className={`tap pointer-events-auto inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-micro font-medium text-white backdrop-blur-sm shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)] transition-all duration-150 hover:bg-black/85 active:scale-95 capitalize group-hover/tile:opacity-100 max-sm:opacity-100 ${
                stageHovered ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <span className="size-1.5 rounded-full" style={{ backgroundColor: pet.primaryColor }} />
              {selectedVariant} · {pet.availableVariants.length}
            </button>
          )}

          {pet.habitat !== 'none' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowHabitat((prev) => !prev);
              }}
              title="Toggle pixel habitat scene"
              className={`tap pointer-events-auto inline-flex items-center rounded-full px-2 py-0.5 text-micro font-medium backdrop-blur-sm transition-all duration-150 max-sm:opacity-100 ${
                stageHovered ? 'opacity-100' : 'opacity-0'
              } ${
                showHabitat
                  ? 'bg-[#1f78ff] text-white shadow-[0_0_10px_rgba(31,120,255,0.5)]'
                  : 'bg-black/65 text-white/90 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)] hover:bg-black/85'
              }`}
            >
              Scene
            </button>
          )}
        </div>

        {/* Top-right: Save to Folder + Favourite */}
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
          {folders.length > 0 && onTogglePetInFolder && (
            <div className="relative">
              <button
                type="button"
                aria-label="Save to folder"
                title="Save to folder"
                onClick={(e) => {
                  e.stopPropagation();
                  setFolderMenuOpen((prev) => !prev);
                }}
                className={`tap grid size-7 place-items-center rounded-full text-white transition-all duration-200 bg-black/65 backdrop-blur-sm shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)] hover:bg-black/85 active:scale-90 pointer-events-auto ${
                  folderMenuOpen
                    ? 'opacity-100 translate-y-0'
                    : `opacity-0 -translate-y-1.5 group-hover/tile:translate-y-0 group-hover/tile:opacity-100 max-sm:opacity-100 max-sm:translate-y-0`
                }`}
              >
                <FolderPlus className="size-3.5" />
              </button>

              {folderMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="animate-popup-in absolute top-full right-0 mt-1.5 w-44 rounded-tray layer-float p-1 z-40"
                >
                  <div className="px-2 py-1 text-micro font-medium text-ink-3">Save to folder</div>
                  {folders.map((folder) => {
                    const inFolder = folder.petIds.includes(pet.id);
                    return (
                      <button
                        key={folder.id}
                        type="button"
                        onClick={() => onTogglePetInFolder(folder.id, pet.id)}
                        className="flex w-full items-center justify-between rounded-[7px] px-2 py-1.5 text-small text-ink hover:bg-wash"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: folder.color }} />
                          <span className="truncate">{folder.name}</span>
                        </span>
                        {inFolder && <Check className="size-3.5 text-brand shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            aria-label={isFavourite ? `Remove ${pet.name} from favourites` : `Add ${pet.name} to favourites`}
            aria-pressed={isFavourite}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavourite(pet.id);
            }}
            className={`tap grid size-[30px] max-sm:size-7 place-items-center rounded-full text-white pointer-events-auto transition-[opacity,transform,background-color] duration-200 active:scale-90 ${
              isFavourite
                ? 'opacity-100 translate-y-0 bg-black/70 hover:bg-black/85 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.16)]'
                : `opacity-0 -translate-y-1.5 bg-black/65 hover:bg-black/85 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)] group-hover/tile:translate-y-0 group-hover/tile:opacity-100 max-sm:opacity-100 max-sm:translate-y-0`
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill={isFavourite ? '#fcbb00' : 'none'}
              stroke={isFavourite ? '#fcbb00' : 'currentColor'}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className={`size-3.5 transition-transform duration-150 ${isFavourite ? 'scale-110' : ''}`}
            >
              <path d="M13.7276 3.4442C14.3142 4.6271 14.9008 5.81 15.4874 6.9929C15.7274 7.4869 16.3673 7.9607 16.9073 8.0514C17.9705 8.2295 19.0337 8.4076 20.0969 8.5858C22.1367 8.9285 22.6167 10.4206 21.1468 11.8925C20.3202 12.7259 19.4937 13.5593 18.6671 14.3927C18.2471 14.8161 18.0172 15.6327 18.1471 16.2175C18.3838 17.2492 18.6204 18.2808 18.8571 19.3125C19.417 21.7623 18.1271 22.71 15.9774 21.4296C14.9808 20.8348 13.9843 20.24 12.9877 19.6452C12.4478 19.3226 11.5579 19.3226 11.0079 19.6452C10.0114 20.24 9.0148 20.8348 8.0183 21.4296C5.8785 22.71 4.5787 21.7522 5.1386 19.3125C5.3752 18.2808 5.6119 17.2492 5.8485 16.2175C5.9785 15.6327 5.7485 14.8161 5.3286 14.3927C4.502 13.5593 3.6754 12.7259 2.8488 11.8925C1.389 10.4206 1.859 8.9285 3.8987 8.5858C4.9619 8.4076 6.0252 8.2295 7.0884 8.0514C7.6183 7.9607 8.2582 7.4869 8.4982 6.9929C9.0848 5.81 9.6714 4.6271 10.258 3.4442C11.2179 1.5186 12.7777 1.5186 13.7276 3.4442Z" />
            </svg>
          </button>
        </div>

        {/* Hover 6-Action Interactive Dock */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`pointer-events-auto absolute bottom-11 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 rounded-full p-0.5 backdrop-blur-md bg-black/70 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.16),0_10px_24px_-8px_rgba(0,0,0,0.5)] transition-all duration-200 max-sm:hidden ${
            stageHovered
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-1.5 scale-95'
          }`}
        >
          {ACTIONS.slice(0, 6).map((act) => {
            const active = effectiveAction === act.id;
            return (
              <button
                key={act.id}
                type="button"
                onClick={(e) => triggerAction(act.id, e)}
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                  active
                    ? 'bg-[#1f78ff] text-white shadow-[0_0_10px_rgba(31,120,255,0.55)]'
                    : 'text-white/80 hover:bg-white/15 hover:text-white'
                }`}
              >
                {act.label}
              </button>
            );
          })}
        </div>

        {/* Bottom-left Coat / Item Pill & Bottom-right Quick Export */}
        {cardStyle === 'catalogue' ? (
          <>
            <span
              aria-hidden="true"
              style={{ width: 20, height: 20, fontSize: 9 }}
              className="grid shrink-0 place-items-center overflow-hidden font-semibold uppercase rounded-full absolute bottom-3 left-3 bg-page text-ink-2 shadow-[inset_0_0_0_1px_var(--line-strong)] z-20"
            >
              {pet.name.charAt(0)}
            </span>
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute bottom-2.5 left-10 z-20 flex max-w-[calc(100%-5.5rem)] items-center gap-1.5 origin-bottom-left rounded-full bg-black/70 px-2.5 py-1 text-small font-medium text-white backdrop-blur-sm shadow-[inset_0_0_0_1px_rgb(255_255_255/0.16)] transition-[opacity,transform] duration-200 ${
                stageHovered
                  ? 'scale-100 opacity-100'
                  : 'scale-[0.96] opacity-0 max-sm:scale-100 max-sm:opacity-100'
              }`}
            >
              <span className="truncate">{pet.name}</span>
              <span className="text-white/60 text-micro">· {pet.toolOrigin}</span>
            </span>
          </>
        ) : (
          <div
            data-always-mobile="true"
            className={`pointer-events-none absolute inset-x-2 bottom-2 z-20 flex items-center justify-between gap-2 transition-all duration-200 ${
              stageHovered
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-1.5 max-sm:opacity-100 max-sm:translate-y-0'
            }`}
          >
            <span className="inline-flex max-w-[calc(100%-3rem)] items-center gap-1.5 rounded-full bg-black/70 py-1 pr-2.5 pl-1 text-small font-medium text-white backdrop-blur-sm shadow-[inset_0_0_0_1px_rgb(255_255_255/0.16)]">
              <span
                className="grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white"
                style={{ backgroundColor: pet.primaryColor }}
              >
                {pet.name.charAt(0)}
              </span>
              <span className="truncate">{pet.name}</span>
              <span className="text-white/60 text-micro font-normal truncate">{pet.species}</span>
            </span>
          </div>
        )}

        {/* Bottom-right Quick Export Arrow */}
        <button
          type="button"
          aria-label={`Export ${pet.name} snippet`}
          title={`Copy ${pet.toolOrigin} config`}
          onClick={(e) => {
            e.stopPropagation();
            onQuickCopy(pet);
          }}
          className={`tap grid size-7 place-items-center rounded-full bg-black/65 text-white backdrop-blur-sm shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)] hover:bg-black/85 active:scale-95 pointer-events-auto absolute right-2 bottom-2 z-20 transition-all duration-200 ${
            stageHovered
              ? 'translate-y-0 opacity-100'
              : 'translate-y-1.5 opacity-0 max-sm:translate-y-0 max-sm:opacity-100'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 6.6503C9 6.6503 15.9383 6.1076 16.9154 7.0846C17.8924 8.0617 17.3496 15 17.3496 15M16.5 7.5C13.1667 10.8333 9.8333 14.1667 6.5 17.5" />
          </svg>
        </button>
      </div>
    </article>
  );
};
