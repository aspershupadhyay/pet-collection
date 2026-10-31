import React, { Suspense, lazy, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { PetDefinition, PetFolder } from '../types/pet';
import { PixelSprite } from './PixelSprite';
import { getShowreel } from '../data/showreel';
import { EXPORT_TOOLS, ExportToolId, generateToolSnippet } from '../utils/toolExport';
import { RARITY_COLOR } from './PetCard';
import { FolderPlus, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';

const Voxel3D = lazy(() => import('../three/Voxel3D'));

interface PetDetailProps {
  pet: PetDefinition;
  /** Neighbours in the current grid order, for ← / → browsing. */
  siblings: PetDefinition[];
  allPets: PetDefinition[];
  initialVariant?: string;
  isFavourite: boolean;
  onToggleFavourite: (id: string) => void;
  folders: PetFolder[];
  onTogglePetInFolder: (folderId: string, petId: string) => void;
  onSelect: (pet: PetDefinition) => void;
  onClose: () => void;
  onCopied: (message: string, sub?: string) => void;
}

const MOMENT_MS = 3400;

const HABITAT_LABEL: Record<string, string> = {
  forest: 'Forest',
  castle: 'Castle',
  beach: 'Beach',
  winter: 'Snowfield',
  autumn: 'Autumn park',
  library: 'Library',
  none: '—',
};

/* Swatch colours for coat names, so coats read as colours, not words. */
const COAT_HEX: Record<string, string> = {
  akita: '#d9893f', red: '#c2452f', brown: '#7a4b2a', black: '#26262b', white: '#f2f2f2', gray: '#9a9aa2',
  orange: '#e7883a', lightbrown: '#b8865a', yellow: '#f4c430', green: '#4caf50', blue: '#3b82f6', purple: '#8b5cf6',
  pink: '#f19ac2', piedpearl: '#e8dcc0', whiteface: '#d9d9d9', magical: '#c9a7ff', warrior: '#8a6d4a',
  paint_beige: '#d8bf9a', socks_black: '#3a3a40', gray_jimothy: '#7d7d86',
};

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }));
    ro.observe(node);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

const has3D = (() => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
})();

export const PetDetail: React.FC<PetDetailProps> = ({
  pet,
  siblings,
  allPets,
  initialVariant,
  isFavourite,
  onToggleFavourite,
  folders,
  onTogglePetInFolder,
  onSelect,
  onClose,
  onCopied,
}) => {
  const reel = useMemo(() => getShowreel(pet), [pet]);
  const [variant, setVariant] = useState(initialVariant && pet.availableVariants.includes(initialVariant) ? initialVariant : pet.sprites.variant);
  const [mode, setMode] = useState<'3d' | '2d'>(has3D ? '3d' : '2d');
  const [moment, setMoment] = useState(0);
  const [tool, setTool] = useState<ExportToolId>('claude');
  const [folderMenu, setFolderMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stageRef, stageSize] = useSize<HTMLDivElement>();
  const railScrollRef = useRef<HTMLDivElement>(null);

  // Fresh state for each companion
  useEffect(() => {
    setVariant(initialVariant && pet.availableVariants.includes(initialVariant) ? initialVariant : pet.sprites.variant);
    setMoment(0);
    setFolderMenu(false);
    railScrollRef.current?.scrollTo({ top: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pet.id]);

  // 2D mode runs the same showreel the cards do (3D drives its own clock)
  useEffect(() => {
    if (mode !== '2d') return;
    const t = setInterval(() => setMoment((m) => (m + 1) % reel.length), MOMENT_MS);
    return () => clearInterval(t);
  }, [mode, reel.length, pet.id]);

  const index = siblings.findIndex((p) => p.id === pet.id);
  const prev = index > 0 ? siblings[index - 1] : siblings[siblings.length - 1];
  const next = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : siblings[0];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, textarea, select')) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && next) onSelect(next);
      if (e.key === 'ArrowLeft' && prev) onSelect(prev);
    };
    window.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
    };
  }, [onClose, onSelect, next, prev]);

  // Line the rail up with the end of the sidebar, like the page header
  const [railLeft, setRailLeft] = useState(0);
  useLayoutEffect(() => {
    const measure = () => {
      const side = document.querySelector('[data-shell-sidebar]') as HTMLElement | null;
      const r = side?.getBoundingClientRect();
      setRailLeft(r && r.width > 0 && window.innerWidth >= 1024 ? Math.round(r.right) : 0);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const similar = useMemo(() => {
    const same = allPets.filter((p) => p.id !== pet.id && p.category === pet.category);
    const rest = allPets.filter((p) => p.id !== pet.id && p.category !== pet.category);
    return [...same, ...rest].slice(0, 6);
  }, [allPets, pet]);

  const snippet = generateToolSnippet(pet, tool, reel[moment % reel.length].action, variant);
  const toolMeta = EXPORT_TOOLS.find((t) => t.id === tool)!;

  const copySnippet = () => {
    navigator.clipboard?.writeText(snippet);
    setCopied(true);
    onCopied(`Copied ${pet.name} for ${toolMeta.label}`, `Paste into ${toolMeta.filename}`);
    setTimeout(() => setCopied(false), 1600);
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(`${window.location.origin}/pets/${pet.id}`);
    onCopied(`Copied link to ${pet.name}`);
  };

  const handle = `@${pet.author.replace(/[^a-z0-9]/gi, '').toLowerCase()}`;

  return (
    <div className="pet-detail fixed inset-y-0 right-0 z-50" style={{ left: railLeft }} role="dialog" aria-modal="true" aria-label={pet.name}>
      {/* The grid stays visible, softly out of focus */}
      <div className="pd-scrim absolute inset-0 bg-page/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative flex h-full flex-col max-lg:bg-page lg:flex-row">
        {/* Stage */}
        <section
          ref={stageRef}
          className="pd-stage relative order-1 m-2 mb-0 h-[46dvh] shrink-0 overflow-hidden rounded-[22px] lg:order-2 lg:m-3 lg:ml-0 lg:h-auto lg:flex-1"
          style={{ background: `color-mix(in srgb, ${pet.primaryColor} 12%, var(--well))`, viewTransitionName: 'pet-stage' } as React.CSSProperties}
        >
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1 rounded-full bg-page/80 p-0.5 shadow-[inset_0_0_0_1px_var(--line)] backdrop-blur-sm">
            {(has3D ? (['3d', '2d'] as const) : (['2d'] as const)).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
                className={`h-7 rounded-full px-3 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                  mode === m ? 'bg-ink text-page' : 'text-ink-3 hover:text-ink'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="absolute top-3 right-3 z-20 flex items-center gap-1">
            <button type="button" onClick={() => prev && onSelect(prev)} aria-label="Previous companion" className="tap grid size-8 place-items-center rounded-full bg-page/80 text-ink-2 shadow-[inset_0_0_0_1px_var(--line)] backdrop-blur-sm hover:text-ink">
              <ChevronLeft className="size-4" />
            </button>
            <button type="button" onClick={() => next && onSelect(next)} aria-label="Next companion" className="tap grid size-8 place-items-center rounded-full bg-page/80 text-ink-2 shadow-[inset_0_0_0_1px_var(--line)] backdrop-blur-sm hover:text-ink">
              <ChevronRight className="size-4" />
            </button>
            <button type="button" onClick={onClose} aria-label="Close" className="tap ml-1 grid size-8 place-items-center rounded-full bg-page/80 text-ink-2 shadow-[inset_0_0_0_1px_var(--line)] backdrop-blur-sm hover:text-ink">
              <X className="size-4" />
            </button>
          </div>

          {mode === '3d' ? (
            <Suspense fallback={null}>
              <Voxel3D pet={pet} variant={variant} onMoment={setMoment} className="absolute inset-0" />
            </Suspense>
          ) : (
            stageSize.w > 0 && (
              <PixelSprite
                pet={pet}
                action={reel[moment % reel.length].action}
                variant={variant}
                width={stageSize.w}
                height={stageSize.h}
                floor={0.72}
                fill={0.42}
              />
            )
          )}

          <p className="absolute bottom-4 left-4 z-20 font-mono text-[12px] text-ink-2">
            <span key={`${pet.id}-${moment}`} className="pc-caption inline-block">
              {String((moment % reel.length) + 1).padStart(2, '0')} / {String(reel.length).padStart(2, '0')} · {reel[moment % reel.length].caption}
            </span>
          </p>
        </section>

        {/* Rail */}
        <aside className="pd-rail relative order-2 flex min-h-0 flex-1 flex-col bg-page lg:order-1 lg:w-[22rem] lg:flex-none lg:border-r lg:border-dashed lg:border-line-strong">
          <header className="flex h-16 shrink-0 items-center gap-3 border-b border-dashed border-line-strong px-4">
            <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-well shadow-[inset_0_0_0_1px_var(--line)]">
              <img src={`/sprites/${pet.sprites.folder}/${variant}_idle_8fps.gif`} alt="" className="pixelated size-7 object-contain" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-display text-[16px] font-medium leading-tight text-ink">{pet.name}</h2>
              <p className="truncate text-[12px] text-ink-3">{handle}</p>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setFolderMenu((v) => !v)}
                aria-label="Save to folder"
                className="tap grid size-8 place-items-center rounded-full text-ink-3 hover:bg-wash hover:text-ink"
              >
                <FolderPlus className="size-4" />
              </button>
              {folderMenu && (
                <div className="animate-popup-in absolute top-full right-0 z-40 mt-1 w-44 rounded-tray layer-float p-1">
                  {folders.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => onTogglePetInFolder(f.id, pet.id)}
                      className="flex w-full items-center justify-between rounded-[7px] px-2 py-1.5 text-small text-ink hover:bg-wash"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span className="size-2 rounded-full" style={{ backgroundColor: f.color }} />
                        {f.name}
                      </span>
                      {f.petIds.includes(pet.id) && <Check className="size-3.5 text-brand" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              aria-pressed={isFavourite}
              aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
              onClick={() => onToggleFavourite(pet.id)}
              className={`tap grid size-8 place-items-center rounded-full hover:bg-wash ${isFavourite ? 'text-[#f5b400]' : 'text-ink-3 hover:text-ink'}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={isFavourite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3.2l2.6 5.3 5.8.85-4.2 4.1 1 5.8L12 16.5l-5.2 2.75 1-5.8-4.2-4.1 5.8-.85z" />
              </svg>
            </button>
          </header>

          <div ref={railScrollRef} className="scrollbar-none min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-6">
            <p className="text-[14px] leading-[1.6] text-ink-2">{pet.tagline}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-well px-2.5 py-1 text-[12px] text-ink-2">{pet.category}</span>
              <span className="rounded-full bg-well px-2.5 py-1 text-[12px]" style={{ color: RARITY_COLOR[pet.rarity] }}>
                {pet.rarity}
              </span>
            </div>

            <dl className="mt-5 divide-y divide-line border-y border-line text-[13px]">
              {[
                ['Species', pet.species],
                ['Works with', pet.toolOrigin],
                ['Habitat', HABITAT_LABEL[pet.habitat]],
                ['Favourite food', pet.favoriteFood],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="text-ink-3">{k}</dt>
                  <dd className="truncate text-right text-ink">{v}</dd>
                </div>
              ))}
              {pet.availableVariants.length > 1 && (
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="text-ink-3">Coat</dt>
                  <dd className="flex items-center gap-1.5 pr-1">
                    {pet.availableVariants.map((v) => (
                      <button
                        key={v}
                        type="button"
                        title={v.replace(/_/g, ' ')}
                        aria-label={`${v.replace(/_/g, ' ')} coat`}
                        aria-pressed={variant === v}
                        onClick={() => setVariant(v)}
                        className={`size-4 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25)] transition-transform ${
                          variant === v ? 'scale-110 ring-[1.5px] ring-ink ring-offset-[1.5px] ring-offset-page' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: COAT_HEX[v] ?? '#999' }}
                      />
                    ))}
                  </dd>
                </div>
              )}
            </dl>

            <h3 className="mt-6 text-[12px] font-medium text-ink-3">What {pet.name} does</h3>
            <ol className="mt-2 flex flex-col">
              {reel.map((m, i) => {
                const now = i === moment % reel.length;
                return (
                  <li key={m.action} className={`flex items-center gap-3 py-1.5 text-[13px] transition-colors ${now ? 'text-ink' : 'text-ink-3'}`}>
                    <span className="w-5 font-mono text-[11px] tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                    <span className="flex-1 truncate">{m.caption}</span>
                    <span className={`size-1.5 rounded-full transition-opacity ${now ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundColor: pet.primaryColor }} />
                  </li>
                );
              })}
            </ol>

            <h3 className="mt-6 text-[12px] font-medium text-ink-3">Add to your tool</h3>
            <div className="scrollbar-none mt-2 flex gap-1 overflow-x-auto">
              {EXPORT_TOOLS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTool(t.id)}
                  className={`h-7 shrink-0 rounded-full px-2.5 text-[12px] transition-colors ${tool === t.id ? 'bg-ink text-page' : 'bg-well text-ink-2 hover:text-ink'}`}
                >
                  {t.label.replace(/ \(.*\)$/, '')}
                </button>
              ))}
            </div>
            <div className="mt-2 overflow-hidden rounded-[12px] bg-well shadow-[inset_0_0_0_1px_var(--line)]">
              <div className="flex items-center justify-between border-b border-line px-3 py-1.5 font-mono text-[11px] text-ink-3">
                <span className="truncate">{toolMeta.filename}</span>
                <span>{toolMeta.badge}</span>
              </div>
              <pre className="scrollbar-none max-h-44 overflow-auto p-3 font-mono text-[11px] leading-[1.6] text-ink-2">{snippet}</pre>
            </div>

            <h3 className="mt-6 text-[12px] font-medium text-ink-3">Similar companions</h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {similar.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelect(p)}
                  className="group/sim relative aspect-[4/3] overflow-hidden rounded-[12px] text-left transition-transform active:scale-[0.98]"
                  style={{ background: `color-mix(in srgb, ${p.primaryColor} 12%, var(--well))` }}
                >
                  <PixelSprite pet={p} action="idle" width={150} height={112} floor={0.8} fill={0.5} shadow={false} />
                  <span className="absolute bottom-1.5 left-2 text-[11px] text-ink-2 opacity-0 transition-opacity group-hover/sim:opacity-100">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          <footer className="flex shrink-0 items-center gap-2 border-t border-dashed border-line-strong p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
            <button type="button" onClick={copyLink} className="tap inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full text-[13px] font-medium text-ink-2 hover:bg-wash hover:text-ink">
              Copy link
            </button>
            <button
              type="button"
              onClick={copySnippet}
              className="surface surface-primary inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full text-[13px] font-medium text-white"
            >
              {copied ? <Check className="size-3.5" /> : null}
              {copied ? 'Copied' : 'Copy config'}
            </button>
          </footer>
        </aside>
      </div>
    </div>
  );
};
