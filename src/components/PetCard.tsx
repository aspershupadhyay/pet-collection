import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PetAction, PetDefinition, PetFolder } from '../types/pet';
import { PetRenderer, resolveSpritePath } from './PetRenderer';
import { getShowreel, petHash } from '../data/showreel';
import { useInView } from '../hooks/useInView';
import { FolderPlus, Check } from 'lucide-react';

interface PetCardProps {
  pet: PetDefinition;
  /** Collection number shown as "No. 07". */
  serial: number;
  /** Position in the grid, used to stagger the entrance. */
  index: number;
  /** Stage width/height, picked by the masonry layout. */
  ratio: number;
  /** Rendered column width in px, so the sprite scales with the tile. */
  width: number;
  renderMode: 'pixel' | 'ascii';
  onSelectPet: (pet: PetDefinition, currentAction: PetAction, variant?: string) => void;
  isFavourite: boolean;
  onToggleFavourite: (petId: string) => void;
  folders?: PetFolder[];
  onTogglePetInFolder?: (folderId: string, petId: string) => void;
}

/* How long each moment of the showreel plays before the next one. */
const MOMENT_MS = 3400;

const RARITY_COLOR: Record<PetDefinition['rarity'], string> = {
  Mythic: '#a78bfa',
  Legendary: '#f0a92e',
  Epic: '#4d8dff',
  Rare: '#22b8e8',
  Common: '#8b8b92',
};

const FOIL_CLASS: Partial<Record<PetDefinition['rarity'], string>> = {
  Legendary: 'pc-tier-legendary',
  Mythic: 'pc-tier-mythic',
};

export const PetCard: React.FC<PetCardProps> = ({
  pet,
  serial,
  index,
  ratio,
  width,
  renderMode,
  onSelectPet,
  isFavourite,
  onToggleFavourite,
  folders = [],
  onTogglePetInFolder,
}) => {
  const reel = useMemo(() => getShowreel(pet), [pet]);
  const hash = useMemo(() => petHash(pet.id), [pet.id]);

  // Every tile starts at a different beat so the wall never moves in lockstep
  const [{ step, cycle }, setPlayhead] = useState(() => ({
    step: hash % reel.length,
    cycle: hash % pet.availableVariants.length,
  }));
  const [folderMenuOpen, setFolderMenuOpen] = useState(false);

  const articleRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const inView = useInView(articleRef);

  const variant = pet.availableVariants[cycle % pet.availableVariants.length] || pet.sprites.variant;
  const moment = reel[step];

  // The loop: always running while the tile is on screen, never user-controlled
  useEffect(() => {
    if (!inView) return;
    const timer = setInterval(() => {
      if (document.hidden) return;
      setPlayhead((prev) => {
        const next = (prev.step + 1) % reel.length;
        // A full pass shows off the next coat
        return { step: next, cycle: next === 0 ? prev.cycle + 1 : prev.cycle };
      });
    }, MOMENT_MS);
    return () => clearInterval(timer);
  }, [inView, reel.length]);

  // Warm the next clip so moments swap without a blank frame
  useEffect(() => {
    if (!inView || renderMode !== 'pixel') return;
    const nextStep = (step + 1) % reel.length;
    const nextVariant =
      nextStep === 0
        ? pet.availableVariants[(cycle + 1) % pet.availableVariants.length] || variant
        : variant;
    const img = new Image();
    img.src = resolveSpritePath(pet, reel[nextStep].action, nextVariant);
  }, [step, cycle, inView, pet, reel, variant, renderMode]);

  // Pointer light + foil follow the cursor via CSS vars (no re-render)
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const node = stageRef.current;
    if (!node || e.pointerType !== 'mouse') return;
    const rect = node.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    node.style.setProperty('--mx', `${x}%`);
    node.style.setProperty('--my', `${y}%`);
    node.style.setProperty('--fx', `${100 - x}%`);
    node.style.setProperty('--fy', `${100 - y}%`);
  };

  const open = () => onSelectPet(pet, moment.action, variant);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  };

  const stageHeight = width / ratio;
  const spriteBox = Math.round(Math.min(stageHeight * 0.78, width * 0.95));
  const compact = width < 240;
  const foil = FOIL_CLASS[pet.rarity];
  const rarityColor = RARITY_COLOR[pet.rarity];

  return (
    <article
      ref={articleRef}
      className="pc-card group/tile relative cursor-pointer outline-none"
      style={{ '--i': index } as React.CSSProperties}
      tabIndex={0}
      role="button"
      aria-label={`${pet.name}, ${pet.rarity} ${pet.species}. ${moment.caption}.`}
      onClick={open}
      onKeyDown={handleKeyDown}
      onMouseLeave={() => setFolderMenuOpen(false)}
    >
      <div
        ref={stageRef}
        onPointerMove={handlePointerMove}
        className={`pc-stage relative overflow-hidden rounded-[18px] group-focus-visible/tile:ring-2 group-focus-visible/tile:ring-brand ${foil ?? ''}`}
        style={{ height: stageHeight, '--tint': pet.primaryColor } as React.CSSProperties}
      >
        <div className="pc-floor" aria-hidden="true" />
        <div className="pc-light" aria-hidden="true" />

        {/* Loop progress — one segment per moment in this pet's showreel */}
        <div aria-hidden="true" className={`absolute inset-x-3 top-3 z-20 flex gap-1 ${compact ? 'inset-x-2.5 top-2.5' : ''}`}>
          {reel.map((m, i) => (
            <span key={m.action} className="relative h-[2px] flex-1 overflow-hidden rounded-full bg-ink/10">
              {i < step && <span className="absolute inset-0 bg-ink/45" />}
              {i === step && (
                <span
                  key={`${cycle}-${step}`}
                  className="pc-seg-fill absolute inset-0 origin-left bg-ink/70"
                  style={{ '--seg-ms': `${MOMENT_MS}ms` } as React.CSSProperties}
                />
              )}
            </span>
          ))}
        </div>

        {/* Rarity mark */}
        <span
          className={`absolute left-3 top-6 z-20 inline-flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] ${compact ? 'left-2.5 top-5 text-[9px]' : ''}`}
          style={{ color: rarityColor }}
        >
          <svg width="7" height="7" viewBox="0 0 7 7" aria-hidden="true" className="shrink-0">
            <path d="M3 0h1v1h1v1h1v1h1v1H6v1H5v1H4v1H3V6H2V5H1V4H0V3h1V2h1V1h1z" fill="currentColor" />
          </svg>
          {pet.rarity}
        </span>

        {/* Save actions — out of the way until you reach for them */}
        <div className="absolute right-2 top-5 z-30 flex items-center gap-1">
          {folders.length > 0 && onTogglePetInFolder && (
            <div className="relative max-sm:hidden">
              <button
                type="button"
                aria-label="Save to folder"
                title="Save to folder"
                onClick={(e) => {
                  e.stopPropagation();
                  setFolderMenuOpen((prev) => !prev);
                }}
                className={`tap grid size-7 place-items-center rounded-full bg-page/80 text-ink-2 shadow-[inset_0_0_0_1px_var(--line-strong)] backdrop-blur-sm transition-[opacity,transform,color] duration-200 hover:text-ink active:scale-90 ${
                  folderMenuOpen ? 'opacity-100' : 'opacity-0 -translate-y-1 group-hover/tile:translate-y-0 group-hover/tile:opacity-100'
                }`}
              >
                <FolderPlus className="size-3.5" />
              </button>

              {folderMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="animate-popup-in absolute top-full right-0 z-40 mt-1.5 w-44 rounded-tray layer-float p-1"
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
                          <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: folder.color }} />
                          <span className="truncate">{folder.name}</span>
                        </span>
                        {inFolder && <Check className="size-3.5 shrink-0 text-brand" />}
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
            className={`tap grid size-7 place-items-center rounded-full bg-page/80 shadow-[inset_0_0_0_1px_var(--line-strong)] backdrop-blur-sm transition-[opacity,transform,color] duration-200 active:scale-90 ${
              isFavourite
                ? 'text-[#f5b400] opacity-100'
                : 'text-ink-2 hover:text-ink opacity-0 -translate-y-1 group-hover/tile:translate-y-0 group-hover/tile:opacity-100 max-sm:opacity-100 max-sm:translate-y-0'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={isFavourite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3.2l2.6 5.3 5.8.85-4.2 4.1 1 5.8L12 16.5l-5.2 2.75 1-5.8-4.2-4.1 5.8-.85z" />
            </svg>
          </button>
        </div>

        {/* The companion */}
        <div className="absolute inset-x-0 top-[46%] z-10 -translate-y-1/2">
          <PetRenderer
            pet={pet}
            action={moment.action}
            size={spriteBox}
            interactive={false}
            variantOverride={variant}
            habitatOverride="none"
            renderMode={renderMode}
            lite
          />
        </div>

        {/* What it's doing right now */}
        <p
          className={`absolute inset-x-3 bottom-3 z-20 flex items-center gap-2 text-[12px] leading-none text-ink-2 ${compact ? 'inset-x-2.5 bottom-2.5 text-[11px]' : ''}`}
        >
          <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: pet.primaryColor }} />
          <span key={`${cycle}-${step}`} className="pc-caption truncate">
            {moment.caption}
          </span>
        </p>

        {foil && (
          <>
            <div className="pc-foil" aria-hidden="true" />
            <div className="pc-foil-ring" aria-hidden="true" />
          </>
        )}
      </div>

      {/* Caption plate */}
      <div className="flex items-start justify-between gap-2 px-1 pt-2.5 pb-1">
        <div className="min-w-0">
          <h3 className={`truncate font-display font-medium leading-tight text-ink ${compact ? 'text-[13.5px]' : 'text-[15px]'}`}>
            {pet.name}
          </h3>
          <p className="mt-0.5 truncate text-[12px] text-ink-3">
            {pet.species}
            {!compact && <span className="text-ink-3/70"> · {pet.toolOrigin}</span>}
          </p>
        </div>
        <span className="shrink-0 pt-0.5 font-mono text-[10.5px] tabular-nums text-ink-3">
          No.&nbsp;{String(serial).padStart(2, '0')}
        </span>
      </div>
    </article>
  );
};
