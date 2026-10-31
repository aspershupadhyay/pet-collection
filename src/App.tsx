import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { PETS } from './data/pets';
import { PetAction, PetCategory, PetDefinition, PetFolder } from './types/pet';
import { CatalogItem, itemKey, KIND_LABEL } from './types/item';
import { Sidebar, SECTION_LABEL } from './components/Sidebar';
import { Header, SortMode } from './components/Header';
import { PetCard } from './components/PetCard';
import { ItemCard, ITEM_RATIO } from './components/items/ItemCard';
import { ItemIcon } from './components/items/Previews';
import { Masonry } from './components/Masonry';
import { Toast, ToastItem } from './components/Toast';
import { petHash } from './data/showreel';
import { petScale, petRefHeight } from './components/PixelSprite';
import { CURSOR_ITEMS, THEME_ITEMS, PACK_ITEMS, characterItem, cursorById, itemByKey, itemOf, mixCatalog } from './data/catalog';
import { COLLECTION, BRAND } from './collection';
import type { SectionId } from './collections/types';
import { SECTION_KIND } from './collections/types';
import { detailPath, go, parseRoute, sectionPath } from './router';
import { backend, viewOnce } from './backend';
import { cursorCss } from './utils/cursorArt';
import { Folder as FolderIcon, Plus, Trash2 } from 'lucide-react';

// Heavier views load on demand
const PetDetail = lazy(() => import('./components/PetDetail'));
const ItemDetail = lazy(() => import('./components/items/ItemDetail'));
const Showcase = lazy(() => import('./components/showcase/Showcase'));
const InfoPage = lazy(() => import('./components/InfoPage').then((m) => ({ default: m.InfoPage })));
const ListView = lazy(() => import('./components/ListView').then((m) => ({ default: m.ListView })));
const CanvasView = lazy(() => import('./components/CanvasView').then((m) => ({ default: m.CanvasView })));
const StudioView = lazy(() => import('./components/StudioView').then((m) => ({ default: m.StudioView })));
const CommandPalette = lazy(() => import('./components/CommandPalette').then((m) => ({ default: m.CommandPalette })));
const SubmitModal = lazy(() => import('./components/InfoSubmitModals').then((m) => ({ default: m.SubmitModal })));

type NonCharacter = Exclude<CatalogItem, { kind: 'character' }>;
type OpenDetail = { kind: 'character'; pet: PetDefinition; action?: PetAction; variant?: string } | { kind: 'item'; item: NonCharacter } | null;

/* Tile shapes for the masonry wall (stage width ÷ height). Each character
   keeps the same shape everywhere, so the wall's rhythm is stable. */
const TILE_RATIOS = [0.8, 0.92, 1.04, 1.16, 1.3];
const IDEAL_FILL = 0.55;

/* The card takes the shape that lets its character render largest at a
   whole-pixel scale; among near-equal fits the hash picks, so the wall varies. */
const ratioCache = new Map<string, number>();
const tileRatio = (pet: PetDefinition, colWidth: number) => {
  const key = `${pet.id}:${Math.round(colWidth)}`;
  const cached = ratioCache.get(key);
  if (cached) return cached;
  const scored = TILE_RATIOS.map((ratio) => {
    const h = colWidth / ratio;
    const { scale } = petScale(pet, colWidth, h, IDEAL_FILL);
    return { ratio, score: Math.abs((petRefHeight(pet) * scale) / h - IDEAL_FILL) };
  });
  const best = Math.min(...scored.map((s) => s.score));
  const good = scored.filter((s) => s.score <= best + 0.06);
  const ratio = good[petHash(pet.id) % good.length].ratio;
  ratioCache.set(key, ratio);
  return ratio;
};
const itemRatio = (item: CatalogItem, w: number) => (item.kind === 'character' ? tileRatio(item.pet, w) : ITEM_RATIO[item.kind]);

const RARITY_RANK: Record<PetDefinition['rarity'], number> = { Mythic: 0, Legendary: 1, Epic: 2, Rare: 3, Common: 4 };
const SERIALS = new Map(PETS.map((p, i) => [p.id, i + 1]));

const COLOR_GROUPS: Record<string, string[]> = {
  orange: ['#d97757', '#ea580c', '#eab308', '#ca8a04', '#f59e0b', '#dc2626', '#b45309'],
  blue: ['#0066fa', '#0284c7', '#0891b2', '#2563eb'],
  purple: ['#9333ea', '#ec4899', '#8b5cf6'],
  green: ['#16a34a', '#10b981', '#65a30d'],
  dark: ['#52525b', '#64748b', '#78716c', '#18181b'],
};

const DEFAULT_FOLDERS: PetFolder[] = [
  { id: 'terminal-buddies', name: 'Terminal Buddies', color: '#0066fa', petIds: ['void_cat', 'kitsune_fox', 'rubber_duck', 'ferris_crab', 'theme:void'], createdAt: '2026-10-30' },
  { id: 'mythic-squad', name: 'Mythic Squad', color: '#a78bfa', petIds: ['totoro_spirit', 'magical_unicorn', 'morph_shapeshifter', 'cursor:starlight'], createdAt: '2026-10-30' },
];

const ALWAYS: SectionId[] = ['favourites', 'folders', 'info'];
const HOME = COLLECTION.sections[0];
const validSection = (s?: SectionId): SectionId => (s && (COLLECTION.sections.includes(s) || ALWAYS.includes(s)) ? s : HOME);

function useStored<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage full or blocked — keep working in memory
    }
  }, [key, value]);
  return [value, setValue] as const;
}

const canMorph = () => 'startViewTransition' in document && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function App() {
  const [customPets, setCustomPets] = useStored<PetDefinition[]>('petcraft_custom_pets', []);
  const allPets = useMemo(() => [...customPets, ...PETS], [customPets]);
  const hasCharacters = COLLECTION.kinds.includes('character');

  const [section, setSection] = useState<SectionId>(() => validSection(parseRoute().section ?? (parseRoute().detail?.kind === 'work' ? 'showcase' : undefined)));
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PetCategory>('All');
  const [selectedColorFilter, setSelectedColorFilter] = useState('all');
  const [sortMode, setSortMode] = useState<SortMode>('curated');
  const [sponsorFocus, setSponsorFocus] = useState(false);
  const [viewMode, setViewMode] = useState<'tile' | 'list' | 'canvas'>('tile');
  const [renderMode, setRenderMode] = useState<'pixel' | 'ascii'>('pixel');
  const [muted, setMuted] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('petcraft-theme');
      return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });
  const [favourites, setFavourites] = useStored<string[]>(COLLECTION.id === 'petcraft' ? 'petcraft_favourites' : `${COLLECTION.id}_favourites`, COLLECTION.kinds.includes('character') ? ['void_cat', 'kitsune_fox', 'rubber_duck', 'ferris_crab'] : []);
  const [folders, setFolders] = useStored<PetFolder[]>(COLLECTION.id === 'petcraft' ? 'petcraft_folders' : `${COLLECTION.id}_folders`, COLLECTION.kinds.includes('character') ? DEFAULT_FOLDERS : []);
  const [wornCursorId, setWornCursorId] = useStored<string | null>('petcraft_cursor_set', null);

  const [detail, setDetail] = useState<OpenDetail>(null);
  const [workId, setWorkId] = useState<string | null>(null);
  const [views, setViews] = useState<Record<string, number>>({});
  const [studioOpen, setStudioOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [workSubmitOpen, setWorkSubmitOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, submessage?: string) => {
    setToasts((prev) => [...prev, { id: Date.now() + Math.random(), message, submessage }]);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  /* ── Theme, cursor, keyboard ── */
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try {
      localStorage.setItem('petcraft-theme', darkMode ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-view', viewMode);
  }, [viewMode]);

  const wornCursor = wornCursorId ? cursorById.get(wornCursorId) ?? null : null;
  useEffect(() => {
    let tag = document.getElementById('worn-cursor') as HTMLStyleElement | null;
    if (!wornCursor) {
      tag?.remove();
      return;
    }
    if (!tag) {
      tag = document.createElement('style');
      tag.id = 'worn-cursor';
      document.head.appendChild(tag);
    }
    tag.textContent = cursorCss(wornCursor, ':root');
  }, [wornCursor]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ── Opening things: shared-element morph from the card + a real URL ── */
  const findPet = useCallback((id: string) => allPets.find((p) => p.id === id), [allPets]);

  const openItem = useCallback(
    (item: CatalogItem, opts: { action?: PetAction; variant?: string; stage?: HTMLElement | null } = {}) => {
      go(detailPath(item.kind, item.id), !!parseRoute().detail);
      const commit = () =>
        setDetail(item.kind === 'character' ? { kind: 'character', pet: item.pet, action: opts.action, variant: opts.variant } : { kind: 'item', item });
      const stage = opts.stage;
      if (stage && canMorph()) {
        stage.style.viewTransitionName = 'pet-stage';
        document.startViewTransition(() => {
          stage.style.viewTransitionName = '';
          flushSync(commit);
        });
      } else {
        commit();
      }
    },
    []
  );
  const openPet = useCallback((pet: PetDefinition, opts?: { action?: PetAction; variant?: string; stage?: HTMLElement | null }) => openItem(characterItem(pet), opts), [openItem]);

  const detailKey = detail ? (detail.kind === 'character' ? detail.pet.id : itemKey(detail.item)) : null;

  const closeDetail = useCallback(
    (fromHistory = false) => {
      if (!fromHistory) go(sectionPath(section, HOME));
      const card = detailKey ? (document.querySelector(`[data-pet-stage="${CSS.escape(detailKey)}"]`) as HTMLElement | null) : null;
      const r = card?.getBoundingClientRect();
      if (card && r && r.bottom > 0 && r.top < window.innerHeight && canMorph()) {
        const t = document.startViewTransition(() => {
          flushSync(() => setDetail(null));
          card.style.viewTransitionName = 'pet-stage';
        });
        t.finished.finally(() => (card.style.viewTransitionName = ''));
      } else {
        setDetail(null);
      }
    },
    [detailKey, section]
  );

  // Deep links and the back button
  useEffect(() => {
    const sync = (fromHistory: boolean) => {
      const route = parseRoute();
      if (route.detail) {
        const { kind, id } = route.detail;
        if (kind === 'work') {
          setSection('showcase');
          setWorkId(id);
          setDetail(null);
          return;
        }
        const item = kind === 'character' ? (findPet(id) ? characterItem(findPet(id)!) : undefined) : itemOf(kind, id);
        if (item) {
          setDetail((cur) =>
            cur && (cur.kind === 'character' ? cur.pet.id : itemKey(cur.item)) === itemKey(item)
              ? cur
              : item.kind === 'character'
                ? { kind: 'character', pet: item.pet }
                : { kind: 'item', item }
          );
          return;
        }
      }
      setWorkId(null);
      if (fromHistory) {
        setSection(validSection(route.section));
        setDetail(null);
      }
    };
    sync(false);
    const onPop = () => sync(true);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [findPet]);

  // Count a view once per session, show shared counts when there's a database
  useEffect(() => {
    if (!detailKey) return;
    let live = true;
    viewOnce(detailKey).then(async (n) => {
      if (!backend.sharedViews || !live) return;
      const count = n ?? (await backend.getViews([detailKey]))[detailKey] ?? 0;
      if (live) setViews((v) => ({ ...v, [detailKey]: count }));
    });
    return () => {
      live = false;
    };
  }, [detailKey]);

  // Titles for tabs, history and shared links
  useEffect(() => {
    const name = detail ? (detail.kind === 'character' ? detail.pet.name : detail.item.name) : null;
    document.title = name ? `${name} · ${BRAND.name}` : section === HOME ? `${BRAND.name} — ${BRAND.tagline}` : `${SECTION_LABEL[section]} · ${BRAND.name}`;
  }, [detail, section]);

  /* ── Favourites and folders (keys cover every kind) ── */
  const nameOf = useCallback((key: string) => itemByKey(key)?.name ?? findPet(key)?.name ?? 'item', [findPet]);

  const toggleFavourite = useCallback(
    (key: string) => {
      setFavourites((prev) => {
        const had = prev.includes(key);
        addToast(had ? `Removed ${nameOf(key)}` : `Saved ${nameOf(key)}`, had ? 'Removed from favourites' : 'Added to favourites ★');
        return had ? prev.filter((k) => k !== key) : [...prev, key];
      });
    },
    [addToast, nameOf, setFavourites]
  );

  const createFolder = useCallback(
    (name: string, color: string) => {
      const folder: PetFolder = { id: `folder-${Date.now()}`, name, color, petIds: [], createdAt: new Date().toISOString().slice(0, 10) };
      setFolders((prev) => [...prev, folder]);
      setSection('folders');
      setActiveFolderId(folder.id);
      addToast(`Created folder "${name}"`, 'Add things with the folder button on any card');
    },
    [addToast, setFolders]
  );

  const deleteFolder = useCallback(
    (folderId: string) => {
      const target = folders.find((f) => f.id === folderId);
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      if (activeFolderId === folderId) setActiveFolderId(null);
      if (target) addToast(`Deleted "${target.name}"`, 'Folder removed');
    },
    [folders, activeFolderId, addToast, setFolders]
  );

  const toggleInFolder = useCallback(
    (folderId: string, key: string) => {
      const folder = folders.find((f) => f.id === folderId);
      if (!folder) return;
      const had = folder.petIds.includes(key);
      setFolders((prev) => prev.map((f) => (f.id !== folderId ? f : { ...f, petIds: had ? f.petIds.filter((k) => k !== key) : [...f.petIds, key] })));
      addToast(had ? `Removed ${nameOf(key)} from ${folder.name}` : `Saved ${nameOf(key)} to ${folder.name}`, `Folder now has ${folder.petIds.length + (had ? -1 : 1)} items`);
    },
    [folders, addToast, nameOf, setFolders]
  );

  /* ── Navigation ── */
  const selectSection = useCallback((nav: SectionId) => {
    setSection(nav);
    setSponsorFocus(false);
    setActiveFolderId(null);
    setMobileMenuOpen(false);
    setDetail(null);
    go(sectionPath(nav, HOME));
    window.scrollTo({ top: 0 });
  }, []);

  const selectFolder = useCallback((folderId: string) => {
    setSection('folders');
    setActiveFolderId(folderId);
    setMobileMenuOpen(false);
    go(sectionPath('folders', HOME));
  }, []);

  const openSponsor = useCallback(() => {
    selectSection('info');
    setSponsorFocus(true);
  }, [selectSection]);

  /* ── What's on the wall ── */
  const filteredPets = useMemo(() => {
    if (section !== 'characters') return allPets;
    const list = allPets.filter((pet) => {
      if (selectedCategory !== 'All' && pet.category !== selectedCategory) return false;
      if (selectedColorFilter !== 'all' && !COLOR_GROUPS[selectedColorFilter]?.includes(pet.primaryColor.toLowerCase())) return false;
      return true;
    });
    if (sortMode === 'rarity') list.sort((a, b) => RARITY_RANK[a.rarity] - RARITY_RANK[b.rarity]);
    if (sortMode === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [allPets, section, selectedCategory, selectedColorFilter, sortMode]);

  const kindItems = useMemo(
    () => ({
      cursor: COLLECTION.kinds.includes('cursor') ? CURSOR_ITEMS : [],
      theme: COLLECTION.kinds.includes('theme') ? THEME_ITEMS : [],
      pack: COLLECTION.kinds.includes('pack') ? PACK_ITEMS : [],
    }),
    []
  );

  const wall = useMemo<CatalogItem[]>(() => {
    const characters = hasCharacters ? filteredPets.map(characterItem) : [];
    const byKey = (key: string) => itemByKey(key) ?? (findPet(key) ? characterItem(findPet(key)!) : undefined);
    switch (section) {
      case 'all':
        return mixCatalog(characters, [kindItems.theme, kindItems.cursor, kindItems.pack]);
      case 'characters':
        return characters;
      case 'cursors':
      case 'themes':
      case 'packs':
        return kindItems[SECTION_KIND[section] as 'cursor' | 'theme' | 'pack'];
      case 'favourites':
        return favourites.map(byKey).filter(Boolean) as CatalogItem[];
      case 'folders': {
        const folder = folders.find((f) => f.id === activeFolderId);
        return folder ? (folder.petIds.map(byKey).filter(Boolean) as CatalogItem[]) : [];
      }
      default:
        return [];
    }
  }, [section, filteredPets, hasCharacters, kindItems, favourites, folders, activeFolderId, findPet]);

  const counts = useMemo<Partial<Record<SectionId, number>>>(
    () => ({
      all: (hasCharacters ? allPets.length : 0) + kindItems.cursor.length + kindItems.theme.length + kindItems.pack.length,
      characters: allPets.length,
      cursors: kindItems.cursor.length,
      themes: kindItems.theme.length,
      packs: kindItems.pack.length,
    }),
    [allPets.length, hasCharacters, kindItems]
  );

  const activeFolder = folders.find((f) => f.id === activeFolderId) ?? null;
  const characterView = section === 'characters' ? viewMode : 'tile';
  const wallPets = useMemo(() => wall.filter((i): i is Extract<CatalogItem, { kind: 'character' }> => i.kind === 'character').map((i) => i.pet), [wall]);

  const renderCard = (item: CatalogItem, { index, width, ratio }: { index: number; width: number; ratio: number }) =>
    item.kind === 'character' ? (
      <PetCard
        pet={item.pet}
        serial={SERIALS.get(item.pet.id) ?? allPets.indexOf(item.pet) + 1}
        index={index}
        width={width}
        ratio={ratio}
        renderMode={renderMode}
        onSelectPet={(p, action, variant, stage) => openPet(p, { action, variant, stage })}
        isFavourite={favourites.includes(item.pet.id)}
        onToggleFavourite={toggleFavourite}
        folders={folders}
        onTogglePetInFolder={toggleInFolder}
      />
    ) : (
      <ItemCard
        item={item}
        index={index}
        width={width}
        ratio={ratio}
        isFavourite={favourites.includes(itemKey(item))}
        onToggleFavourite={toggleFavourite}
        folders={folders}
        onToggleInFolder={toggleInFolder}
        onOpen={(i, stage) => openItem(i, { stage })}
      />
    );

  const emptyState = (
    <div className="my-12 flex flex-col items-center justify-center rounded-sheet border border-dashed border-line-strong py-20 text-center">
      <p className="font-display text-title font-medium text-ink">
        {section === 'favourites' ? 'Nothing starred yet' : section === 'folders' ? 'This folder is empty' : 'Nothing matches the current filter'}
      </p>
      <p className="mt-1 max-w-sm text-small text-ink-3">
        {section === 'favourites' || section === 'folders'
          ? 'Use the star or the folder button on any card to keep it here.'
          : `Try another category or colour, or browse all ${allPets.length} characters.`}
      </p>
      <button
        type="button"
        onClick={() => {
          setSelectedCategory('All');
          setSelectedColorFilter('all');
          if (section !== 'characters') selectSection(HOME);
        }}
        className="surface surface-primary mt-5 h-8 rounded-full px-4 text-body font-medium text-white"
      >
        {section === 'characters' ? 'Reset filters' : 'Browse the collection'}
      </button>
    </div>
  );

  const fallback = <div className="h-[50vh]" />;

  return (
    <div className="hatch min-h-dvh">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-page">
        Skip to content
      </a>
      <div className="frame relative mx-auto min-h-dvh max-w-[100rem] lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
        <div aria-hidden="true" className="pointer-events-none absolute top-0 right-0 left-64 z-10 h-16 border-b border-dashed border-line-strong max-lg:hidden" />

        <Sidebar
          activeNav={section}
          onSelectNav={selectSection}
          favouritesCount={favourites.length}
          onOpenSponsor={openSponsor}
          onOpenItem={(item) => openItem(item)}
          counts={counts}
          folders={folders}
          activeFolderId={activeFolderId}
          onSelectFolder={selectFolder}
          onCreateFolder={createFolder}
          onDeleteFolder={deleteFolder}
        />

        <div className="relative flex min-h-dvh min-w-0 flex-col lg:col-start-2">
          <main id="main-content" tabIndex={-1} className="relative flex-1 outline-none">
            <div className="px-[16px] pb-16">
              <Header
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                sortMode={sortMode}
                onChangeSort={setSortMode}
                viewMode={viewMode}
                onChangeViewMode={setViewMode}
                renderMode={renderMode}
                onChangeRenderMode={setRenderMode}
                selectedColorFilter={selectedColorFilter}
                onSelectColorFilter={setSelectedColorFilter}
                onOpenSearch={() => setSearchOpen(true)}
                onOpenStudio={() => setStudioOpen(true)}
                onOpenInfo={() => selectSection('info')}
                onOpenSubmit={() => {
                  if (COLLECTION.sections.includes('showcase')) {
                    selectSection('showcase');
                    setWorkSubmitOpen(true);
                  } else {
                    setSubmitOpen(true);
                  }
                }}
                onOpenItem={(item) => openItem(item)}
                showFilters={section === 'characters'}
                wornCursor={wornCursor}
                onClearCursor={() => setWornCursorId(null)}
                onBrowseCursors={() => selectSection(COLLECTION.sections.includes('cursors') ? 'cursors' : HOME)}
                darkMode={darkMode}
                onChangeDarkMode={setDarkMode}
                muted={muted}
                onChangeMuted={setMuted}
                activeNav={section}
                onSelectNav={selectSection}
                favouritesCount={favourites.length}
                totalShowing={wall.length}
              />

              {section === 'folders' && (
                <div className="mb-6">
                  {activeFolder ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-tile bg-well p-4">
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-xl" style={{ backgroundColor: `${activeFolder.color}20`, color: activeFolder.color }}>
                          <FolderIcon className="size-5" />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setActiveFolderId(null)} className="text-small text-ink-3 hover:text-ink">
                              Folders
                            </button>
                            <span className="text-small text-ink-3">/</span>
                            <h2 className="font-display text-lead font-medium text-ink">{activeFolder.name}</h2>
                          </div>
                          <p className="text-small text-ink-3">
                            {activeFolder.petIds.length} saved · Created {activeFolder.createdAt}
                          </p>
                        </div>
                      </div>
                      <button type="button" onClick={() => setActiveFolderId(null)} className="surface surface-outline h-8 rounded-full px-3.5 text-small font-medium text-ink">
                        All folders
                      </button>
                    </div>
                  ) : (
                    <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {folders.map((folder) => {
                        const preview = folder.petIds.map((k) => itemByKey(k) ?? (findPet(k) ? characterItem(findPet(k)!) : undefined)).filter(Boolean).slice(0, 4) as CatalogItem[];
                        return (
                          <div
                            key={folder.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setActiveFolderId(folder.id)}
                            onKeyDown={(e) => e.key === 'Enter' && setActiveFolderId(folder.id)}
                            className="group/fcard cursor-pointer rounded-tile bg-well p-4 transition-all hover:ring-1 hover:ring-line-strong"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <span className="grid size-8 place-items-center rounded-lg" style={{ backgroundColor: `${folder.color}20`, color: folder.color }}>
                                  <FolderIcon className="size-4" />
                                </span>
                                <div>
                                  <h3 className="font-medium text-ink">{folder.name}</h3>
                                  <p className="text-micro text-ink-3">{folder.petIds.length} items</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteFolder(folder.id);
                                }}
                                aria-label={`Delete ${folder.name}`}
                                className="grid size-7 place-items-center rounded-full text-ink-3 opacity-0 transition-opacity hover:bg-page hover:text-ink group-hover/fcard:opacity-100 focus-visible:opacity-100"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                            <div className="mt-4 grid grid-cols-4 gap-2">
                              {preview.map((item) => (
                                <div key={itemKey(item)} className="grid aspect-square place-items-center rounded-xl bg-page p-1.5">
                                  <ItemIcon item={item} size={30} />
                                </div>
                              ))}
                              {Array.from({ length: Math.max(0, 4 - preview.length) }).map((_, idx) => (
                                <div key={idx} className="aspect-square rounded-xl border border-dashed border-line-strong bg-page/40" />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => createFolder(`Collection #${folders.length + 1}`, '#0066fa')}
                        className="flex min-h-[9.5rem] flex-col items-center justify-center gap-2 rounded-tile border border-dashed border-line-strong bg-well/40 p-4 text-ink-3 transition-colors hover:bg-well hover:text-ink"
                      >
                        <Plus className="size-5" />
                        <span className="text-body font-medium">Create new folder</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              <Suspense fallback={fallback}>
                {section === 'info' ? (
                  <InfoPage onOpenSubmit={() => setSubmitOpen(true)} focusSponsor={sponsorFocus} />
                ) : section === 'showcase' ? (
                  <Showcase
                    openId={workId}
                    onOpen={(id) => {
                      setWorkId(id);
                      go(id ? detailPath('work', id) : sectionPath('showcase', HOME), !!id && !!parseRoute().detail);
                    }}
                    submitOpen={workSubmitOpen}
                    onSubmitOpen={setWorkSubmitOpen}
                    onToast={addToast}
                  />
                ) : section === 'folders' && !activeFolder ? null : wall.length === 0 ? (
                  emptyState
                ) : characterView === 'list' ? (
                  <ListView pets={wallPets} bookmarks={favourites} onSelectPet={(p) => openPet(p)} />
                ) : characterView === 'canvas' ? (
                  <CanvasView pets={wallPets} onSelectPet={(p) => openPet(p)} />
                ) : (
                  <Masonry
                    key={`${section}-${activeFolderId}-${selectedCategory}-${selectedColorFilter}-${sortMode}`}
                    items={wall}
                    getKey={itemKey}
                    getRatio={itemRatio}
                    renderItem={renderCard}
                  />
                )}
              </Suspense>
            </div>
          </main>
        </div>
      </div>

      {/* Mobile dock */}
      <div className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] left-1/2 z-40 flex w-fit -translate-x-1/2 items-center gap-0.5 rounded-[10px] layer-float p-[3px] lg:hidden">
        <button type="button" onClick={() => setSearchOpen(true)} className="tap flex min-h-[30px] items-center gap-1.5 rounded-[7px] pr-2.5 pl-3 text-small text-ink-3 transition-colors duration-150 hover:text-ink">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 17L21 21" />
            <path d="M19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19C15.4183 19 19 15.4183 19 11Z" />
          </svg>
          Search
        </button>
        <span aria-hidden="true" className="h-4 w-px bg-line-strong" />
        <button
          type="button"
          aria-label="Menu"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="tap relative grid size-[30px] place-items-center rounded-[7px] text-ink-3 transition-colors hover:bg-wash hover:text-ink"
        >
          <span aria-hidden="true" className={`absolute top-1/2 left-1/2 h-px w-3 -translate-x-1/2 bg-current transition-transform duration-200 ${mobileMenuOpen ? '-translate-y-1/2 rotate-45' : '-translate-y-[2.5px]'}`} />
          <span aria-hidden="true" className={`absolute top-1/2 left-1/2 h-px w-3 -translate-x-1/2 bg-current transition-transform duration-200 ${mobileMenuOpen ? '-translate-y-1/2 -rotate-45' : 'translate-y-[1.5px]'}`} />
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-page/80 backdrop-blur-xs lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="animate-popup-in fixed inset-x-4 bottom-14 rounded-sheet layer-float p-4">
            <div className="mb-2 text-micro font-medium uppercase tracking-wider text-ink-3">Browse</div>
            <div className="grid grid-cols-2 gap-1.5">
              {[...COLLECTION.sections, ...ALWAYS].map((nav) => (
                <button
                  key={nav}
                  type="button"
                  onClick={() => selectSection(nav)}
                  className={`flex items-center justify-between rounded-[10px] px-3 py-2 text-body ${section === nav ? 'bg-brand font-medium text-white' : 'bg-well text-ink-2 hover:text-ink'}`}
                >
                  <span>{SECTION_LABEL[nav]}</span>
                  {counts[nav] != null && <span className="text-micro opacity-70">{counts[nav]}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Suspense fallback={null}>
        {detail?.kind === 'character' && (
          <PetDetail
            pet={detail.pet}
            initialVariant={detail.variant}
            siblings={wallPets.some((p) => p.id === detail.pet.id) ? wallPets : allPets}
            allPets={allPets}
            views={backend.sharedViews ? views[detail.pet.id] ?? null : null}
            isFavourite={favourites.includes(detail.pet.id)}
            onToggleFavourite={toggleFavourite}
            folders={folders}
            onTogglePetInFolder={toggleInFolder}
            onSelect={(p) => openPet(p)}
            onOpenItem={(i) => openItem(i)}
            onClose={() => closeDetail()}
            onCopied={(msg, sub) => addToast(msg, sub ?? 'Copied to clipboard')}
          />
        )}
        {detail?.kind === 'item' && (
          <ItemDetail
            item={detail.item}
            siblings={wall.some((i) => itemKey(i) === itemKey(detail.item)) ? wall : kindItems[detail.item.kind]}
            views={backend.sharedViews ? views[itemKey(detail.item)] ?? null : null}
            isFavourite={favourites.includes(itemKey(detail.item))}
            onToggleFavourite={toggleFavourite}
            folders={folders}
            onToggleInFolder={toggleInFolder}
            onSelect={(i) => openItem(i)}
            onClose={() => closeDetail()}
            onCopied={(msg, sub) => addToast(msg, sub ?? 'Copied to clipboard')}
            wornCursor={wornCursorId}
            onWearCursor={setWornCursorId}
          />
        )}

        {studioOpen && <StudioView onClose={() => setStudioOpen(false)} muted={muted} onCopy={(msg, sub) => addToast(msg, sub)} />}

        {searchOpen && (
          <CommandPalette
            isOpen={searchOpen}
            onClose={() => setSearchOpen(false)}
            pets={hasCharacters ? allPets : []}
            items={[...kindItems.cursor, ...kindItems.theme, ...kindItems.pack]}
            onSelectItem={(item) => {
              setSearchOpen(false);
              openItem(item);
            }}
            onSelectPet={(pet) => {
              setSearchOpen(false);
              openPet(pet);
            }}
            onCopySuccess={(msg) => addToast(msg, 'Copied to clipboard')}
          />
        )}

        {submitOpen && (
          <SubmitModal
            onClose={() => setSubmitOpen(false)}
            onAddPet={(pet) => {
              setCustomPets((prev) => [pet, ...prev]);
              addToast(`Added ${pet.name}`, `Now in your ${KIND_LABEL.character.many.toLowerCase()}`);
            }}
          />
        )}
      </Suspense>

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
