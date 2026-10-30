import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { PetAction, PetDefinition, PetHabitat } from '../types/pet';
import { PET_ACTIONS } from '../data/pets';
import { PetRenderer } from './PetRenderer';
import { HabitatBackdrop } from './HabitatBackdrop';
import { EXPORT_TOOLS, ExportToolId, generateToolSnippet } from '../utils/toolExport';
import { soundEngine } from '../utils/audio';
import {
  X,
  Copy,
  Check,
  Star,
  Link2,
  ArrowUpRight,
  Pause,
  Play,
} from 'lucide-react';

interface PetModalProps {
  pet: PetDefinition | null;
  allPets: PetDefinition[];
  onClose: () => void;
  onSelectSimilar: (pet: PetDefinition) => void;
  onOpenSandbox: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  onCopySuccess: (msg: string) => void;
}

const HABITATS: { id: PetHabitat; label: string }[] = [
  { id: 'none', label: 'Studio' },
  { id: 'forest', label: 'Forest' },
  { id: 'castle', label: 'Castle' },
  { id: 'beach', label: 'Beach' },
  { id: 'autumn', label: 'Autumn' },
  { id: 'winter', label: 'Winter' },
  { id: 'library', label: 'Library' },
];

const RARITY_HEX: Record<string, string> = {
  Mythic: '#a78bfa',
  Legendary: '#f59e0b',
  Epic: '#1f78ff',
  Rare: '#00bbff',
  Common: '#8b8b92',
};

/* Inspector rail width (px). The rail docks against the right edge of the
   site sidebar on desktop, exactly like a drawer sliding out from under it. */
const RAIL_W = 312;
const EXIT_MS = 260;

const MetaRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center justify-between gap-3 border-t border-dashed border-line py-2.5 first:border-t-0">
    <span className="shrink-0 text-small text-ink-3">{label}</span>
    <span className="flex min-w-0 items-center justify-end gap-1.5 text-right text-small font-medium text-ink">
      {children}
    </span>
  </div>
);

const SectionLabel: React.FC<{ children: React.ReactNode; aside?: React.ReactNode }> = ({ children, aside }) => (
  <div className="mb-2 flex items-center justify-between">
    <span className="text-small font-medium text-ink-3">{children}</span>
    {aside}
  </div>
);

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const PetModal: React.FC<PetModalProps> = ({
  pet,
  allPets,
  onClose,
  onSelectSimilar,
  onOpenSandbox,
  isBookmarked,
  onToggleBookmark,
  onCopySuccess,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number>();
  const [activeAction, setActiveAction] = useState<PetAction>('idle');
  const [activeTool, setActiveTool] = useState<ExportToolId>('claude');
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [selectedHabitat, setSelectedHabitat] = useState<PetHabitat>('none');
  const [renderMode, setRenderMode] = useState<'pixel' | 'ascii'>('pixel');
  const [isAutoLoop, setIsAutoLoop] = useState<boolean>(true);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [closing, setClosing] = useState(false);
  const [railLeft, setRailLeft] = useState(0);

  /* Dock the rail to the live sidebar edge (0 on mobile where it is hidden). */
  const measureRail = useCallback(() => {
    const el = document.querySelector('[data-shell-sidebar]');
    const rect = el?.getBoundingClientRect();
    setRailLeft(rect && rect.width > 0 && window.innerWidth >= 1024 ? Math.round(rect.right) : 0);
  }, []);

  const isOpen = !!pet;

  useLayoutEffect(() => {
    if (!isOpen) return;
    measureRail();
    window.addEventListener('resize', measureRail);
    return () => window.removeEventListener('resize', measureRail);
  }, [isOpen, measureRail]);

  /* Open / close the native dialog and lock page scroll while it is up. */
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
      document.documentElement.style.overflow = 'hidden';
    }
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  /* Reset the inspector every time the companion switches (incl. Similar finds) */
  useEffect(() => {
    if (!pet) return;
    setActiveAction('idle');
    setActiveTool('claude');
    setSelectedVariant(pet.sprites.variant);
    setSelectedHabitat(pet.habitat);
    setRenderMode('pixel');
    setIsAutoLoop(true);
    setCopied(false);
    setLinkCopied(false);
    railRef.current?.scrollTo({ top: 0 });
  }, [pet]);

  /* Animated close: play the exit choreography, then unmount. */
  const requestClose = useCallback(() => {
    if (closing) return;
    if (prefersReducedMotion()) {
      dialogRef.current?.close();
      onClose();
      return;
    }
    setClosing(true);
    closeTimer.current = window.setTimeout(() => {
      dialogRef.current?.close();
      setClosing(false);
      onClose();
    }, EXIT_MS);
  }, [closing, onClose]);

  useEffect(() => {
    if (!pet || !isAutoLoop) return;
    const timer = setInterval(() => {
      setActiveAction((prev) => {
        const idx = PET_ACTIONS.findIndex((a) => a.id === prev);
        const nextIdx = (idx + 1) % 10;
        return PET_ACTIONS[nextIdx].id;
      });
    }, 3200);
    return () => clearInterval(timer);
  }, [pet, isAutoLoop]);

  useEffect(() => {
    if (!pet) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const found = PET_ACTIONS.find(
        (a) => a.shortcut.toLowerCase() === e.key.toLowerCase()
      );
      if (found) {
        setIsAutoLoop(false);
        setActiveAction(found.id);
        soundEngine.play('ui_click', pet.soundPitch);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pet]);

  /* Same-category neighbours first, rotated by an id hash so each pet
     surfaces a different shelf of similar picks */
  const similarPets = useMemo(() => {
    if (!pet) return [];
    const others = allPets.filter((p) => p.id !== pet.id);
    const sameCategory = others.filter((p) => p.category === pet.category);
    const sameRarity = others.filter(
      (p) => p.category !== pet.category && p.rarity === pet.rarity
    );
    const rest = others.filter(
      (p) => p.category !== pet.category && p.rarity !== pet.rarity
    );
    const pool = [...sameCategory, ...sameRarity, ...rest];
    let hash = 0;
    for (const ch of pet.id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    const start = pool.length ? hash % pool.length : 0;
    const rotated = pool.slice(start).concat(pool.slice(0, start));
    return rotated.slice(0, 6);
  }, [allPets, pet]);

  if (!pet) return null;

  const variant = selectedVariant || pet.sprites.variant;
  const snippet = generateToolSnippet(pet, activeTool, activeAction, variant);
  const activeTabMeta = EXPORT_TOOLS.find((t) => t.id === activeTool)!;
  const rarityHex = RARITY_HEX[pet.rarity] || RARITY_HEX.Common;
  const activeActionMeta = PET_ACTIONS.find((a) => a.id === activeAction);

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    soundEngine.play('celebrate', pet.soundPitch);
    setCopied(true);
    onCopySuccess(`Copied ${pet.name} snippet for ${activeTabMeta.label}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://petcraft.xyz/pets/${pet.id}`);
    soundEngine.play('ui_click', pet.soundPitch);
    setLinkCopied(true);
    onCopySuccess(`Copied ${pet.name} profile link`);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const shellVars = {
    '--rail-left': `${railLeft}px`,
    '--rail-w': `${RAIL_W}px`,
  } as React.CSSProperties;

  return (
    <dialog
      ref={dialogRef}
      data-state={closing ? 'closing' : 'open'}
      aria-label={`${pet.name} inspector`}
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
      className="pet-inspector fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden bg-transparent p-0 text-ink outline-none backdrop:bg-transparent"
      style={shellVars}
    >
      {/* Scrim — leaves the site sidebar crisp on desktop */}
      <div
        className="pm-scrim absolute inset-y-0 right-0 left-0 bg-black/65 lg:left-[var(--rail-left)]"
        onClick={requestClose}
        aria-hidden="true"
      />

      <div className="pointer-events-none absolute inset-0 flex flex-col overflow-y-auto max-lg:pointer-events-auto max-lg:bg-page lg:block lg:overflow-hidden">
        {/* ───────────── Stage card (enters second) ───────────── */}
        <section
          aria-label={`${pet.name} preview`}
          className="pm-stage pointer-events-auto relative order-1 m-2 flex h-[54dvh] min-h-[22rem] shrink-0 flex-col overflow-hidden rounded-[22px] bg-[#0e0e11] text-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] ring-1 ring-white/10 lg:absolute lg:inset-y-3 lg:right-3 lg:left-[calc(var(--rail-left)+var(--rail-w)+12px)] lg:m-0 lg:h-auto lg:rounded-[26px]"
        >
          <HabitatBackdrop habitat={selectedHabitat} tint={pet.primaryColor} />

          {/* Top bar: breadcrumb + mode controls · close pinned top-right */}
          <div className="relative z-20 flex items-start justify-between gap-3 p-4 sm:p-5">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <p className="mr-1 hidden min-w-0 items-center gap-1.5 truncate text-[13px] text-white/45 sm:flex">
                <span>{pet.category}</span>
                <span>/</span>
                <span className="truncate font-medium text-white/90">{pet.name}</span>
              </p>
              <div
                role="radiogroup"
                aria-label="Sprite engine"
                className="flex items-center rounded-full bg-white/[0.07] p-0.5 ring-1 ring-white/10"
              >
                {(['pixel', 'ascii'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    role="radio"
                    aria-checked={renderMode === mode}
                    onClick={() => setRenderMode(mode)}
                    className={`tap rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      renderMode === mode ? 'bg-white text-[#111]' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {mode === 'pixel' ? 'Pixel' : '/buddy'}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setIsAutoLoop((v) => !v)}
                aria-pressed={isAutoLoop}
                title={isAutoLoop ? 'Pause auto-loop' : 'Resume auto-loop'}
                className="tap inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] px-2.5 py-1 font-mono text-[11px] text-white/75 ring-1 ring-white/10 transition-colors hover:text-white"
              >
                {isAutoLoop ? <Pause className="size-3" /> : <Play className="size-3" />}
                <span className={isAutoLoop ? 'text-[#4ade80]' : ''}>{isAutoLoop ? 'loop' : 'manual'}</span>
                <span className="text-white/35">·</span>
                <span>{activeActionMeta?.label.toLowerCase()}</span>
              </button>
            </div>
            <button
              type="button"
              onClick={requestClose}
              aria-label="Close inspector (Esc)"
              title="Close (Esc)"
              className="tap grid size-9 shrink-0 place-items-center rounded-full bg-white/[0.08] text-white/80 ring-1 ring-white/10 transition-colors hover:bg-white/15 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Companion — stands on the scene floor */}
          <div
            className="absolute inset-x-0 z-10 flex justify-center"
            style={{ bottom: selectedHabitat === 'none' ? '18%' : '11%' }}
          >
            <div key={`${pet.id}-${renderMode}`} className="pm-sprite-in w-full max-w-[26rem]">
              <PetRenderer
                pet={pet}
                action={activeAction}
                size={renderMode === 'ascii' ? 300 : 330}
                interactive={true}
                tilt={true}
                align={renderMode === 'ascii' ? 'center' : 'bottom'}
                variantOverride={variant}
                habitatOverride="none"
                renderMode={renderMode}
                onActionTrigger={(a) => {
                  setIsAutoLoop(false);
                  setActiveAction(a);
                }}
              />
            </div>
          </div>

          {/* Action dock */}
          <div className="relative z-20 mt-auto flex justify-center p-3 sm:p-4">
            <div className="scrollbar-none flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full bg-[#151518]/95 p-1 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.8)] ring-1 ring-white/10">
              {PET_ACTIONS.map((act) => {
                const active = activeAction === act.id;
                return (
                  <button
                    key={act.id}
                    type="button"
                    title={act.description}
                    onClick={() => {
                      setIsAutoLoop(false);
                      setActiveAction(act.id);
                      soundEngine.play('ui_click', pet.soundPitch);
                    }}
                    className={`tap inline-flex shrink-0 items-center gap-1.5 rounded-full py-1.5 pr-1.5 pl-3 text-[12px] font-medium transition-colors ${
                      active ? 'bg-white text-[#111]' : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {act.label}
                    <kbd
                      className={`grid h-[18px] min-w-[18px] place-items-center rounded-[5px] px-1 font-mono text-[10px] ${
                        active ? 'bg-black/10 text-[#111]' : 'bg-white/10 text-white/60'
                      }`}
                    >
                      {act.shortcut}
                    </kbd>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ───────────── Info rail (enters first, slides out from the sidebar) ───────────── */}
        <div className="pointer-events-auto relative order-2 lg:absolute lg:inset-y-0 lg:left-[var(--rail-left)] lg:w-[var(--rail-w)] lg:overflow-hidden">
          <aside className="pm-rail flex flex-col bg-page lg:h-full lg:border-r lg:border-dashed lg:border-line-strong">
            <div ref={railRef} className="scrollbar-none flex flex-1 flex-col gap-5 px-5 pt-5 pb-5 lg:overflow-y-auto">
              {/* Identity */}
              <div className="flex items-center gap-3">
                <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-well ring-1 ring-line">
                  <img
                    src={`/sprites/${pet.sprites.folder}/${variant}_idle_8fps.gif`}
                    alt=""
                    width={34}
                    height={34}
                    className="size-[34px] shrink-0 object-contain pixelated"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-display text-[17px] font-medium leading-tight text-ink">
                    {pet.name}
                  </h2>
                  <p className="mt-0.5 truncate text-small text-ink-3">@{pet.author.replace(/\s+/g, '').toLowerCase()}</p>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    aria-label="Copy profile link"
                    title="Copy profile link"
                    className="tap grid size-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-wash hover:text-ink"
                  >
                    {linkCopied ? <Check className="size-4 text-brand" /> : <Link2 className="size-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleBookmark(pet.id)}
                    aria-label={isBookmarked ? 'Remove from favourites' : 'Add to favourites'}
                    aria-pressed={isBookmarked}
                    title={isBookmarked ? 'Saved to favourites' : 'Save to favourites'}
                    className="tap grid size-8 place-items-center rounded-full transition-colors hover:bg-wash"
                  >
                    <Star
                      className={`size-4 transition-[fill,color] ${
                        isBookmarked ? 'fill-[#fcbb00] text-[#fcbb00]' : 'text-ink-3'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Tagline + tags */}
              <div>
                <p className="text-lead leading-[1.5] text-ink-2">{pet.tagline}</p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-well px-2.5 py-1 text-small text-ink-2 ring-1 ring-line">
                    {pet.category}
                  </span>
                  <span className="rounded-full bg-well px-2.5 py-1 text-small text-ink-2 ring-1 ring-line">
                    {pet.species}
                  </span>
                  <span className="rounded-full bg-well px-2.5 py-1 font-mono text-[11px] text-ink-2 ring-1 ring-line">
                    {pet.toolOrigin}
                  </span>
                </div>
              </div>

              {/* Meta */}
              <div className="border-y border-dashed border-line-strong">
                <MetaRow label="Rarity">
                  <span className="size-2 rotate-45 rounded-[1px]" style={{ backgroundColor: rarityHex }} />
                  {pet.rarity}
                </MetaRow>
                <MetaRow label="Favourite snack">{pet.favoriteFood}</MetaRow>
                <MetaRow label="Signature move">{pet.signatureMove}</MetaRow>
                <MetaRow label="Palette">
                  <span className="flex -space-x-1">
                    {[pet.primaryColor, pet.secondaryColor, pet.accentColor].map((hex) => (
                      <span
                        key={hex}
                        title={hex}
                        className="size-3.5 rounded-full ring-2 ring-page"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </span>
                </MetaRow>
              </div>

              {/* Scene picker */}
              <div>
                <SectionLabel aside={<span className="font-mono text-[10px] text-ink-3">{HABITATS.length}</span>}>
                  Scene
                </SectionLabel>
                <div className="grid grid-cols-4 gap-1.5">
                  {HABITATS.map((h) => {
                    const active = selectedHabitat === h.id;
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => setSelectedHabitat(h.id)}
                        aria-pressed={active}
                        className={`tap group/scene flex flex-col gap-1 rounded-[10px] p-1 text-left transition-colors ${
                          active ? 'bg-well ring-1 ring-ink/40' : 'hover:bg-wash'
                        }`}
                      >
                        <span
                          className="block aspect-[4/3] w-full overflow-hidden rounded-[7px] bg-[#16161a] pixelated ring-1 ring-inset ring-white/5"
                          style={
                            h.id === 'none'
                              ? {
                                  backgroundImage: 'radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)',
                                  backgroundSize: '6px 6px',
                                }
                              : {
                                  backgroundImage: `url(/sprites/backgrounds/${h.id}/background-dark-nano.png)`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center bottom',
                                }
                          }
                        />
                        <span className={`px-0.5 text-[10.5px] ${active ? 'font-medium text-ink' : 'text-ink-3'}`}>
                          {h.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Coat picker */}
              {pet.availableVariants.length > 1 && (
                <div>
                  <SectionLabel>Coat</SectionLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {pet.availableVariants.map((v) => (
                      <button
                        key={v}
                        type="button"
                        aria-pressed={variant === v}
                        onClick={() => {
                          soundEngine.play('ui_click', pet.soundPitch);
                          setSelectedVariant(v);
                        }}
                        className={`tap inline-flex items-center gap-1.5 rounded-full py-1 pr-2.5 pl-1 text-small capitalize transition-colors ${
                          variant === v
                            ? 'bg-ink text-page'
                            : 'bg-well text-ink-2 ring-1 ring-line hover:text-ink'
                        }`}
                      >
                        <img
                          src={`/sprites/${pet.sprites.folder}/${v}_idle_8fps.gif`}
                          alt=""
                          loading="lazy"
                          className="size-5 rounded-full bg-page/10 object-contain pixelated"
                        />
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* About */}
              <div>
                <SectionLabel>About</SectionLabel>
                <p className="text-small leading-relaxed text-ink-2">{pet.description}</p>
              </div>

              {/* Similar finds */}
              <div>
                <SectionLabel aside={<span className="font-mono text-[10px] text-ink-3">{similarPets.length}</span>}>
                  Similar finds
                </SectionLabel>
                <div className="grid grid-cols-3 gap-1.5">
                  {similarPets.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onSelectSimilar(p)}
                      title={p.name}
                      className="group/sim tap relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-xl bg-well ring-1 ring-line transition-[box-shadow] hover:ring-line-strong"
                    >
                      <img
                        src={p.sprites.idle}
                        alt={p.name}
                        loading="lazy"
                        decoding="async"
                        className="h-10 max-w-[80%] object-contain pixelated transition-transform duration-200 group-hover/sim:-translate-y-0.5"
                      />
                      <span className="absolute inset-x-1 bottom-1 truncate text-center text-[10px] text-ink-3 transition-colors group-hover/sim:text-ink">
                        {p.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Rail footer: export tool switch + Copy / View in Sandbox */}
            <div className="sticky bottom-0 shrink-0 border-t border-dashed border-line-strong bg-page px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
              <div role="tablist" aria-label="Export format" className="mb-2.5 flex items-center gap-1 overflow-x-auto scrollbar-none">
                {EXPORT_TOOLS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    title={tab.label}
                    aria-selected={activeTool === tab.id}
                    onClick={() => setActiveTool(tab.id)}
                    className={`tap shrink-0 rounded-full px-2.5 py-1 font-mono text-[10.5px] font-medium transition-colors ${
                      activeTool === tab.id
                        ? 'bg-ink text-page'
                        : 'text-ink-3 hover:bg-wash hover:text-ink'
                    }`}
                  >
                    {tab.badge}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="surface surface-outline tap inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full text-body font-medium text-ink"
                >
                  {copied ? <Check className="size-3.5 text-brand" /> : <Copy className="size-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenSandbox}
                  className="surface surface-primary tap inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-full text-body font-medium text-white"
                >
                  Open sandbox
                  <ArrowUpRight className="size-3.5" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </dialog>
  );
};
