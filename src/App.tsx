import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PETS } from './data/pets';
import { PetAction, PetCategory, PetDefinition, PetFolder } from './types/pet';
import { Sidebar, NavSection } from './components/Sidebar';
import { Header } from './components/Header';
import { PetCard } from './components/PetCard';
import { ListView } from './components/ListView';
import { CanvasView } from './components/CanvasView';
import { PetModal } from './components/PetModal';
import { StudioView } from './components/StudioView';
import { CommandPalette } from './components/CommandPalette';
import { InfoModal, SubmitModal } from './components/InfoSubmitModals';
import { Toast, ToastItem } from './components/Toast';
import { generateToolSnippets } from './utils/toolExport';
import { Folder as FolderIcon, Plus, Trash2 } from 'lucide-react';

const DEFAULT_FOLDERS: PetFolder[] = [
  {
    id: 'terminal-buddies',
    name: 'Terminal Buddies',
    color: '#0066fa',
    petIds: ['void_cat', 'kitsune_fox', 'rubber_duck', 'ferris_crab'],
    createdAt: '2026-10-30',
  },
  {
    id: 'mythic-squad',
    name: 'Mythic Squad',
    color: '#a78bfa',
    petIds: ['totoro_spirit', 'magical_unicorn', 'morph_shapeshifter'],
    createdAt: '2026-10-30',
  },
];

export function App() {
  const [customPets, setCustomPets] = useState<PetDefinition[]>(() => {
    try {
      const saved = localStorage.getItem('petcraft_custom_pets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const allPets = useMemo(() => [...customPets, ...PETS], [customPets]);

  const [activeNav, setActiveNav] = useState<NavSection>('finds');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PetCategory>('All');
  const [selectedColorFilter, setSelectedColorFilter] = useState<string>('all');
  const [globalAction, setGlobalAction] = useState<PetAction | 'auto'>('auto');
  const [viewMode, setViewMode] = useState<'tile' | 'list' | 'canvas'>('tile');
  const [renderMode, setRenderMode] = useState<'pixel' | 'ascii'>('pixel');

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('petcraft-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });
  const [muted, setMuted] = useState<boolean>(false);

  const [favourites, setFavourites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('petcraft_favourites');
      return saved ? JSON.parse(saved) : ['void_cat', 'kitsune_fox', 'rubber_duck', 'ferris_crab'];
    } catch {
      return ['void_cat', 'kitsune_fox', 'rubber_duck', 'ferris_crab'];
    }
  });

  const [folders, setFolders] = useState<PetFolder[]>(() => {
    try {
      const saved = localStorage.getItem('petcraft_folders');
      return saved ? JSON.parse(saved) : DEFAULT_FOLDERS;
    } catch {
      return DEFAULT_FOLDERS;
    }
  });

  const [activePetModal, setActivePetModal] = useState<{
    pet: PetDefinition;
    action: PetAction;
    variant?: string;
  } | null>(null);
  const [studioOpen, setStudioOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('petcraft-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('petcraft-theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-view', viewMode);
  }, [viewMode]);

  useEffect(() => {
    try {
      localStorage.setItem('petcraft_favourites', JSON.stringify(favourites));
    } catch {
      // ignore storage errors
    }
  }, [favourites]);

  useEffect(() => {
    try {
      localStorage.setItem('petcraft_folders', JSON.stringify(folders));
    } catch {
      // ignore storage errors
    }
  }, [folders]);

  useEffect(() => {
    try {
      localStorage.setItem('petcraft_custom_pets', JSON.stringify(customPets));
    } catch {
      // ignore storage errors
    }
  }, [customPets]);

  const addToast = useCallback((message: string, submessage?: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, submessage }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Global keyboard shortcuts (⌘K search, Escape close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleFavourite = useCallback(
    (petId: string) => {
      const pet = allPets.find((p) => p.id === petId);
      setFavourites((prev) => {
        const exists = prev.includes(petId);
        if (exists) {
          addToast(`Removed ${pet?.name || 'companion'}`, 'Removed from Favourites');
          return prev.filter((id) => id !== petId);
        } else {
          addToast(`Saved ${pet?.name || 'companion'}`, 'Added to Favourites ★');
          return [...prev, petId];
        }
      });
    },
    [allPets, addToast]
  );

  const handleCreateFolder = useCallback(
    (name: string, color: string) => {
      const newFolder: PetFolder = {
        id: `folder-${Date.now()}`,
        name,
        color,
        petIds: [],
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setFolders((prev) => [...prev, newFolder]);
      setActiveNav('folders');
      setActiveFolderId(newFolder.id);
      addToast(`Created folder "${name}"`, 'Add companions using the folder button on any tile');
    },
    [addToast]
  );

  const handleDeleteFolder = useCallback(
    (folderId: string) => {
      const target = folders.find((f) => f.id === folderId);
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      if (activeFolderId === folderId) {
        setActiveFolderId(null);
      }
      if (target) {
        addToast(`Deleted "${target.name}"`, 'Folder removed');
      }
    },
    [folders, activeFolderId, addToast]
  );

  const handleTogglePetInFolder = useCallback(
    (folderId: string, petId: string) => {
      const folder = folders.find((f) => f.id === folderId);
      const pet = allPets.find((p) => p.id === petId);
      setFolders((prev) =>
        prev.map((f) => {
          if (f.id !== folderId) return f;
          const exists = f.petIds.includes(petId);
          return {
            ...f,
            petIds: exists ? f.petIds.filter((id) => id !== petId) : [...f.petIds, petId],
          };
        })
      );
      if (folder && pet) {
        const alreadyIn = folder.petIds.includes(petId);
        addToast(
          alreadyIn ? `Removed ${pet.name} from ${folder.name}` : `Saved ${pet.name} to ${folder.name}`,
          `Folder now has ${alreadyIn ? folder.petIds.length - 1 : folder.petIds.length + 1} items`
        );
      }
    },
    [folders, allPets, addToast]
  );

  const handleQuickCopy = useCallback(
    (pet: PetDefinition) => {
      const snippets = generateToolSnippets(pet, 'idle');
      navigator.clipboard.writeText(snippets[0].code);
      addToast(`Copied ${pet.name} snippet!`, `Ready to paste into ${snippets[0].name}`);
    },
    [addToast]
  );

  const handleSelectNav = useCallback((nav: NavSection) => {
    setActiveNav(nav);
    setActiveFolderId(null);
    setMobileMenuOpen(false);
  }, []);

  const handleSelectFolder = useCallback((folderId: string) => {
    setActiveNav('folders');
    setActiveFolderId(folderId);
    setMobileMenuOpen(false);
  }, []);

  // Filter pets by Nav section, Category, Folder, and Color swatch
  const filteredPets = useMemo(() => {
    return allPets.filter((pet) => {
      if (activeNav === 'favourites' && !favourites.includes(pet.id)) {
        return false;
      }
      if (activeNav === 'folders' && activeFolderId) {
        const folder = folders.find((f) => f.id === activeFolderId);
        if (folder && !folder.petIds.includes(pet.id)) return false;
      }
      if (activeNav === 'inspiration' && !['Mythical', 'Avian', 'Aquatic & Nature'].includes(pet.category)) {
        return false;
      }
      if (activeNav === 'resources' && pet.availableVariants.length <= 1 && pet.habitat === 'none') {
        return false;
      }
      if (activeNav === 'tools' && !['Claude Code', 'Orca CLI', 'Cursor IDE', 'Codex Desktop'].includes(pet.toolOrigin)) {
        return false;
      }

      if (selectedCategory !== 'All' && pet.category !== selectedCategory) {
        return false;
      }

      if (selectedColorFilter !== 'all') {
        const hex = pet.primaryColor.toLowerCase();
        if (selectedColorFilter === 'orange' && !['#d97757', '#ea580c', '#eab308', '#ca8a04', '#f59e0b', '#dc2626', '#b45309'].includes(hex)) {
          return false;
        }
        if (selectedColorFilter === 'blue' && !['#0066fa', '#0284c7', '#0891b2', '#2563eb'].includes(hex)) {
          return false;
        }
        if (selectedColorFilter === 'purple' && !['#9333ea', '#ec4899', '#8b5cf6'].includes(hex)) {
          return false;
        }
        if (selectedColorFilter === 'green' && !['#16a34a', '#10b981', '#65a30d'].includes(hex)) {
          return false;
        }
        if (selectedColorFilter === 'dark' && !['#52525b', '#64748b', '#78716c', '#18181b'].includes(hex)) {
          return false;
        }
      }

      return true;
    });
  }, [allPets, activeNav, activeFolderId, folders, favourites, selectedCategory, selectedColorFilter]);

  const activeFolder = useMemo(
    () => folders.find((f) => f.id === activeFolderId) || null,
    [folders, activeFolderId]
  );

  // Determine whether cards use 'finds' or 'catalogue' overlay style
  const cardStyle = activeNav === 'finds' || activeNav === 'favourites' || activeNav === 'folders' ? 'finds' : 'catalogue';

  return (
    <div className="hatch min-h-dvh">
      {/* Outer Frame with left/right 16px hatched gutters and 1px solid line-strong borders (Exact designeer.xyz .frame) */}
      <div className="frame relative mx-auto min-h-dvh max-w-[100rem] lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
        {/* Top 64px horizontal dashed divider across the main column (Exact designeer.xyz line 183) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 left-64 z-10 h-16 border-b border-dashed border-line-strong max-lg:hidden"
        />

        {/* Left Sticky Sidebar */}
        <Sidebar
          activeNav={activeNav}
          onSelectNav={handleSelectNav}
          favouritesCount={favourites.length}
          onOpenSubmit={() => setSubmitOpen(true)}
          onSelectPet={(pet) => setActivePetModal({ pet, action: 'idle' })}
          folders={folders}
          activeFolderId={activeFolderId}
          onSelectFolder={handleSelectFolder}
          onCreateFolder={handleCreateFolder}
          onDeleteFolder={handleDeleteFolder}
        />

        {/* Right Main Content Column */}
        <div className="relative flex min-h-dvh min-w-0 flex-col lg:col-start-2">
          <main id="main-content" className="relative flex-1 outline-none">
            <div className="px-[16px] pb-16">
              <Header
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                globalAction={globalAction}
                onSelectGlobalAction={setGlobalAction}
                viewMode={viewMode}
                onChangeViewMode={setViewMode}
                renderMode={renderMode}
                onChangeRenderMode={setRenderMode}
                selectedColorFilter={selectedColorFilter}
                onSelectColorFilter={setSelectedColorFilter}
                onOpenSearch={() => setSearchOpen(true)}
                onOpenStudio={() => setStudioOpen(true)}
                onOpenInfo={() => setInfoOpen(true)}
                onOpenSubmit={() => setSubmitOpen(true)}
                onSelectPet={(pet) => setActivePetModal({ pet, action: 'idle' })}
                darkMode={darkMode}
                onChangeDarkMode={setDarkMode}
                muted={muted}
                onChangeMuted={setMuted}
                activeNav={activeNav}
                onSelectNav={handleSelectNav}
                favouritesCount={favourites.length}
                totalShowing={filteredPets.length}
              />

              {/* Folders Overview Banner when in 'folders' view */}
              {activeNav === 'folders' && (
                <div className="mb-6">
                  {activeFolder ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-tile bg-well p-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="grid size-10 place-items-center rounded-xl"
                          style={{
                            backgroundColor: `${activeFolder.color}20`,
                            color: activeFolder.color,
                          }}
                        >
                          <FolderIcon className="size-5" />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveFolderId(null)}
                              className="text-small text-ink-3 hover:text-ink"
                            >
                              Folders
                            </button>
                            <span className="text-small text-ink-3">/</span>
                            <h2 className="font-display text-lead font-medium text-ink">
                              {activeFolder.name}
                            </h2>
                          </div>
                          <p className="text-small text-ink-3">
                            {activeFolder.petIds.length} saved companions · Created {activeFolder.createdAt}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveFolderId(null)}
                        className="surface surface-outline h-8 rounded-full px-3.5 text-small font-medium text-ink"
                      >
                        All folders
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                      {folders.map((folder) => {
                        const previewPets = allPets
                          .filter((p) => folder.petIds.includes(p.id))
                          .slice(0, 4);
                        return (
                          <div
                            key={folder.id}
                            onClick={() => setActiveFolderId(folder.id)}
                            className="group/fcard cursor-pointer rounded-tile bg-well p-4 transition-all hover:ring-1 hover:ring-line-strong"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <span
                                  className="grid size-8 place-items-center rounded-lg"
                                  style={{
                                    backgroundColor: `${folder.color}20`,
                                    color: folder.color,
                                  }}
                                >
                                  <FolderIcon className="size-4" />
                                </span>
                                <div>
                                  <h3 className="font-medium text-ink">{folder.name}</h3>
                                  <p className="text-micro text-ink-3">
                                    {folder.petIds.length} companions
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFolder(folder.id);
                                }}
                                aria-label={`Delete ${folder.name}`}
                                className="grid size-7 place-items-center rounded-full text-ink-3 opacity-0 transition-opacity hover:bg-page hover:text-ink group-hover/fcard:opacity-100"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                            <div className="mt-4 grid grid-cols-4 gap-2">
                              {previewPets.map((p) => (
                                <div
                                  key={p.id}
                                  className="grid aspect-square place-items-center rounded-xl bg-page p-1.5"
                                >
                                  <img
                                    src={p.sprites.idle}
                                    alt={p.name}
                                    className="size-8 object-contain pixelated"
                                  />
                                </div>
                              ))}
                              {Array.from({ length: Math.max(0, 4 - previewPets.length) }).map(
                                (_, idx) => (
                                  <div
                                    key={idx}
                                    className="aspect-square rounded-xl border border-dashed border-line-strong bg-page/40"
                                  />
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() =>
                          handleCreateFolder(`Collection #${folders.length + 1}`, '#0066fa')
                        }
                        className="flex min-h-[9.5rem] flex-col items-center justify-center gap-2 rounded-tile border border-dashed border-line-strong bg-well/40 p-4 text-ink-3 transition-colors hover:bg-well hover:text-ink"
                      >
                        <Plus className="size-5" />
                        <span className="text-body font-medium">Create new folder</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Main View Switcher: Tile vs List vs Canvas */}
              {filteredPets.length === 0 ? (
                <div className="my-12 flex flex-col items-center justify-center rounded-sheet border border-dashed border-line-strong py-20 text-center">
                  <p className="font-display text-title font-medium text-ink">
                    No companions match the current filter
                  </p>
                  <p className="mt-1 max-w-sm text-small text-ink-3">
                    Try resetting your category or colour filter, or browse all 20 interactive companions.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('All');
                      setSelectedColorFilter('all');
                      if (activeNav === 'favourites' || activeFolderId) {
                        handleSelectNav('finds');
                      }
                    }}
                    className="surface surface-primary mt-5 h-8 rounded-full px-4 text-body font-medium text-white"
                  >
                    Reset filters
                  </button>
                </div>
              ) : viewMode === 'tile' ? (
                /* Masonry tile wall: CSS columns flow, card heights vary per pet */
                <div className="columns-1 gap-3 sm:columns-2 lg:columns-3 2xl:columns-4">
                  {filteredPets.map((pet) => (
                    <PetCard
                      key={pet.id}
                      pet={pet}
                      globalAction={globalAction}
                      renderMode={renderMode}
                      onSelectPet={(p, act, variant) =>
                        setActivePetModal({ pet: p, action: act, variant })
                      }
                      onQuickCopy={handleQuickCopy}
                      isFavourite={favourites.includes(pet.id)}
                      onToggleFavourite={toggleFavourite}
                      muted={muted}
                      cardStyle={cardStyle}
                      folders={folders}
                      onTogglePetInFolder={handleTogglePetInFolder}
                    />
                  ))}
                </div>
              ) : viewMode === 'list' ? (
                <ListView
                  pets={filteredPets}
                  globalAction={globalAction}
                  renderMode={renderMode}
                  onSelectPet={(p) => setActivePetModal({ pet: p, action: 'idle' })}
                  onQuickCopy={handleQuickCopy}
                  bookmarks={favourites}
                  onToggleBookmark={toggleFavourite}
                />
              ) : (
                <CanvasView
                  pets={filteredPets}
                  globalAction={globalAction}
                  renderMode={renderMode}
                  onSelectPet={(p, act) => setActivePetModal({ pet: p, action: act })}
                  onQuickCopy={handleQuickCopy}
                  favourites={favourites}
                  onToggleFavourite={toggleFavourite}
                  muted={muted}
                />
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Floating Bottom Dock (lg:hidden - Exact designeer.xyz S:2 dock) */}
      <div className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] left-1/2 z-40 flex w-fit -translate-x-1/2 items-center gap-0.5 rounded-[10px] layer-float p-[3px] lg:hidden">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="tap flex min-h-[30px] items-center gap-1.5 rounded-[7px] pr-2.5 pl-3 text-small text-ink-3 transition-colors duration-150 hover:text-ink"
        >
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
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="tap grid size-[30px] place-items-center rounded-[7px] text-ink-3 transition-colors hover:bg-wash hover:text-ink relative"
        >
          <span
            aria-hidden="true"
            className={`absolute top-1/2 left-1/2 h-px w-3 -translate-x-1/2 bg-current transition-transform duration-200 ${
              mobileMenuOpen ? '-translate-y-1/2 rotate-45' : '-translate-y-[2.5px]'
            }`}
          />
          <span
            aria-hidden="true"
            className={`absolute top-1/2 left-1/2 h-px w-3 -translate-x-1/2 bg-current transition-transform duration-200 ${
              mobileMenuOpen ? '-translate-y-1/2 -rotate-45' : 'translate-y-[1.5px]'
            }`}
          />
        </button>
      </div>

      {/* Mobile Navigation Sheet */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-page/80 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-popup-in fixed inset-x-4 bottom-14 rounded-sheet layer-float p-4"
          >
            <div className="mb-2 text-micro font-medium text-ink-3 uppercase tracking-wider">
              Browse Collections
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {(['finds', 'inspiration', 'resources', 'tools', 'portfolios', 'favourites', 'folders'] as NavSection[]).map(
                (nav) => (
                  <button
                    key={nav}
                    type="button"
                    onClick={() => handleSelectNav(nav)}
                    className={`flex items-center justify-between rounded-[10px] px-3 py-2 text-body capitalize ${
                      activeNav === nav
                        ? 'bg-brand text-white font-medium'
                        : 'bg-well text-ink-2 hover:text-ink'
                    }`}
                  >
                    <span>{nav}</span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

        {/* Companion Inspector Drawer / Sheet (PetModal) */}
        <PetModal
          pet={activePetModal ? activePetModal.pet : null}
          allPets={allPets}
          onClose={() => setActivePetModal(null)}
          onSelectSimilar={(next) => setActivePetModal({ pet: next, action: 'idle' })}
          onOpenSandbox={() => {
            setActivePetModal(null);
            setStudioOpen(true);
          }}
          isBookmarked={activePetModal ? favourites.includes(activePetModal.pet.id) : false}
          onToggleBookmark={toggleFavourite}
          onCopySuccess={(msg) => addToast(msg, 'Copied to clipboard')}
        />

      {/* Multi-Pet Interactive Sandbox */}
      {studioOpen && (
        <StudioView
          onClose={() => setStudioOpen(false)}
          muted={muted}
          onCopy={(msg, sub) => addToast(msg, sub)}
        />
      )}

      {/* Command Palette (⌘K) */}
      {searchOpen && (
        <CommandPalette
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          pets={allPets}
          onSelectPet={(pet) => {
            setSearchOpen(false);
            setActivePetModal({ pet, action: 'idle' });
          }}
          onCopySuccess={(msg) => addToast(msg, 'Copied to clipboard')}
        />
      )}

      {/* Info Modal */}
      {infoOpen && (
        <InfoModal
          onClose={() => setInfoOpen(false)}
          onOpenStudio={() => setStudioOpen(true)}
        />
      )}

      {/* Submit Companion Modal */}
      {submitOpen && (
        <SubmitModal
          onClose={() => setSubmitOpen(false)}
          onAddPet={(newPet) => {
            setCustomPets((prev) => [newPet, ...prev]);
            addToast(`Submitted ${newPet.name}!`, 'Now live in your directory');
          }}
        />
      )}

      {/* Toast Notification Stack */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
