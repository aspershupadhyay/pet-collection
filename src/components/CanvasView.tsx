import React, { useRef, useState, useCallback } from 'react';
import { PetAction, PetDefinition } from '../types/pet';
import { PetRenderer } from './PetRenderer';
import { ACTIONS } from '../data/pets';
import { playPetSound } from '../utils/audio';
import { RotateCcw, Sparkles } from 'lucide-react';

interface CanvasViewProps {
  pets: PetDefinition[];
  globalAction: PetAction | 'auto';
  renderMode: 'pixel' | 'ascii';
  onSelectPet: (pet: PetDefinition, action: PetAction) => void;
  onQuickCopy: (pet: PetDefinition) => void;
  favourites: string[];
  onToggleFavourite: (id: string) => void;
  muted: boolean;
}

const ZOOM_STEP = 0.15;
const MIN_ZOOM = 0.65;
const MAX_ZOOM = 1.6;

interface CanvasNodeProps {
  pet: PetDefinition;
  globalAction: PetAction | 'auto';
  renderMode: 'pixel' | 'ascii';
  isFav: boolean;
  onSelectPet: (pet: PetDefinition, action: PetAction) => void;
  onQuickCopy: (pet: PetDefinition) => void;
  onToggleFavourite: (id: string) => void;
  muted: boolean;
}

/* Each node owns its local action state so clicking an action pill re-renders
   exactly one node — never the whole canvas. */
const CanvasNode = React.memo<CanvasNodeProps>(function CanvasNode({
  pet,
  globalAction,
  renderMode,
  isFav,
  onSelectPet,
  onQuickCopy,
  onToggleFavourite,
  muted,
}) {
  const [localAction, setLocalAction] = useState<PetAction>('idle');
  const act: PetAction = globalAction === 'auto' ? localAction : globalAction;

  const triggerAction = useCallback(
    (a: PetAction, e: React.MouseEvent) => {
      e.stopPropagation();
      setLocalAction(a);
      playPetSound(a, pet.soundPitch, muted);
    },
    [pet.soundPitch, muted]
  );

  return (
    <div
      onClick={() => onSelectPet(pet, act)}
      className="group/node layer layer-hover relative flex cursor-pointer flex-col items-center rounded-tile p-4 transition-transform duration-200 hover:-translate-y-1"
    >
      {/* Top bar inside node */}
      <div className="flex w-full items-center justify-between">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-micro font-medium"
          style={{
            backgroundColor: `${pet.primaryColor}16`,
            color: pet.primaryColor,
          }}
        >
          <span
            className="size-1.5 rounded-full"
            style={{ backgroundColor: pet.primaryColor }}
          />
          {pet.toolOrigin}
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavourite(pet.id);
          }}
          aria-label="Toggle favourite"
          aria-pressed={isFav}
          className={`text-xs transition-colors ${
            isFav ? 'text-amber-400' : 'text-ink-3/40 hover:text-ink'
          }`}
        >
          ★
        </button>
      </div>

      {/* Sprite */}
      <div className="my-2 flex h-32 w-full items-center justify-center">
        <PetRenderer
          pet={pet}
          action={act}
          size={128}
          habitatOverride="none"
          renderMode={renderMode}
        />
      </div>

      {/* Name & Species */}
      <div className="w-full text-center">
        <h3 className="truncate text-body font-medium text-ink">{pet.name}</h3>
        <p className="truncate text-micro text-ink-3">{pet.species}</p>
      </div>

      {/* Quick Action Pills on Hover (pure CSS reveal) */}
      <div className="mt-3 flex w-full items-center justify-center gap-1 opacity-0 transition-opacity duration-150 group-hover/node:opacity-100 focus-within:opacity-100">
        {ACTIONS.slice(0, 4).map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={(e) => triggerAction(a.id, e)}
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
              act === a.id
                ? 'bg-brand text-white'
                : 'bg-well text-ink-2 hover:text-ink'
            }`}
          >
            {a.label}
          </button>
        ))}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onQuickCopy(pet);
          }}
          title="Copy export config"
          className="rounded-full bg-well px-2 py-0.5 text-[10px] font-medium text-ink-2 hover:text-ink"
        >
          ↗
        </button>
      </div>
    </div>
  );
});

export const CanvasView: React.FC<CanvasViewProps> = ({
  pets,
  globalAction,
  renderMode,
  onSelectPet,
  onQuickCopy,
  favourites,
  onToggleFavourite,
  muted,
}) => {
  /* Pan/zoom deliberately live outside React state: keeping them in state would
     re-render every node + sprite stage on every mousemove. */
  const surfaceRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const zoomLabelRef = useRef<HTMLSpanElement>(null);
  const transform = useRef({ zoom: 1, panX: 0, panY: 0 });
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0, active: false });
  const rafId = useRef<number>();

  const applyTransform = () => {
    if (rafId.current) return;
    rafId.current = requestAnimationFrame(() => {
      rafId.current = undefined;
      const { zoom, panX, panY } = transform.current;
      if (surfaceRef.current) {
        surfaceRef.current.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
      }
      if (gridRef.current) {
        const g = 24 * zoom;
        gridRef.current.style.backgroundSize = `${g}px ${g}px`;
        gridRef.current.style.backgroundPosition = `${panX}px ${panY}px`;
      }
      if (zoomLabelRef.current) {
        zoomLabelRef.current.textContent = `${Math.round(zoom * 100)}%`;
      }
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      panX: transform.current.panX,
      panY: transform.current.panY,
      active: true,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStart.current.active) return;
    transform.current.panX = e.clientX - dragStart.current.x + dragStart.current.panX;
    transform.current.panY = e.clientY - dragStart.current.y + dragStart.current.panY;
    applyTransform();
  };

  const handleMouseUp = () => {
    dragStart.current.active = false;
  };

  const changeZoom = (delta: number) => {
    transform.current.zoom = Math.min(
      MAX_ZOOM,
      Math.max(MIN_ZOOM, +(transform.current.zoom + delta).toFixed(2))
    );
    applyTransform();
  };

  const resetView = () => {
    transform.current = { zoom: 1, panX: 0, panY: 0 };
    applyTransform();
  };

  return (
    <div className="relative h-[calc(100dvh-11rem)] min-h-[34rem] w-full overflow-hidden rounded-sheet border border-dashed border-line-strong bg-well select-none">
      {/* Subtle Blueprint Dot Grid */}
      <div
        ref={gridRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--line-strong) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top-Left Canvas Status Pill */}
      <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-2">
        <div className="layer-float flex items-center gap-2 rounded-full px-3 py-1.5 text-small font-medium text-ink">
          <Sparkles className="size-3.5 text-brand" />
          <span>Interactive Canvas</span>
          <span className="text-ink-3">· {pets.length} companions</span>
        </div>
        <span className="max-sm:hidden rounded-full bg-page/80 px-2.5 py-1 text-micro text-ink-3 ring-1 ring-line">
          Drag to pan · Click any companion to inspect
        </span>
      </div>

      {/* Top-Right Canvas Controls */}
      <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5">
        <div className="surface surface-outline flex h-8 items-center gap-1 rounded-full px-2 text-small font-medium text-ink">
          <button
            type="button"
            onClick={() => changeZoom(-ZOOM_STEP)}
            className="px-1.5 text-ink-2 hover:text-ink"
            aria-label="Zoom out"
          >
            −
          </button>
          <span ref={zoomLabelRef} className="min-w-[3rem] text-center tabular-nums text-micro">
            {Math.round(transform.current.zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => changeZoom(ZOOM_STEP)}
            className="px-1.5 text-ink-2 hover:text-ink"
            aria-label="Zoom in"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={resetView}
          title="Reset canvas pan & zoom"
          className="surface surface-outline grid size-8 place-items-center rounded-full text-ink-2 hover:text-ink"
        >
          <RotateCcw className="size-3.5" />
        </button>
      </div>

      {/* Pannable / Zoomable Spatial Canvas Surface */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="size-full overflow-auto p-8 cursor-grab active:cursor-grabbing"
      >
        <div
          ref={surfaceRef}
          style={{ transformOrigin: 'center top' }}
          className="mx-auto grid max-w-[84rem] grid-cols-2 gap-5 pt-10 pb-16 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        >
          {pets.map((pet) => (
            <CanvasNode
              key={pet.id}
              pet={pet}
              globalAction={globalAction}
              renderMode={renderMode}
              isFav={favourites.includes(pet.id)}
              onSelectPet={onSelectPet}
              onQuickCopy={onQuickCopy}
              onToggleFavourite={onToggleFavourite}
              muted={muted}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
