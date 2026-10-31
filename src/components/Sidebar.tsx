import React, { useState, useEffect, useRef } from 'react';
import { PetFolder } from '../types/pet';
import type { CatalogItem } from '../types/item';
import { Folder as FolderIcon, Trash2 } from 'lucide-react';
import { PetcraftLogo } from './PetcraftMark';
import { COLLECTION, BRAND } from '../collection';
import type { SectionId } from '../collections/types';
import { itemByKey } from '../data/catalog';
import { ItemIcon } from './items/Previews';

export type NavSection = SectionId;

interface SidebarProps {
  activeNav: NavSection;
  onSelectNav: (nav: NavSection) => void;
  favouritesCount: number;
  onOpenSponsor: () => void;
  onOpenItem: (item: CatalogItem) => void;
  counts: Partial<Record<SectionId, number>>;
  folders: PetFolder[];
  activeFolderId: string | null;
  onSelectFolder: (folderId: string) => void;
  onCreateFolder: (name: string, color: string) => void;
  onDeleteFolder: (folderId: string) => void;
}

export const SECTION_LABEL: Record<SectionId, string> = {
  all: 'Everything',
  characters: 'Characters',
  cursors: 'Cursors',
  themes: 'Terminal themes',
  packs: 'Sprite packs',
  showcase: 'Showcase',
  favourites: 'Favourites',
  folders: 'Folders',
  info: 'Info',
};

const icon = (d: string) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

export const SECTION_ICON: Partial<Record<SectionId, React.ReactNode>> = {
  all: icon('M4 5.5C4 4.67 4.67 4 5.5 4h4C10.33 4 11 4.67 11 5.5v4c0 .83-.67 1.5-1.5 1.5h-4C4.67 11 4 10.33 4 9.5v-4ZM13 5.5c0-.83.67-1.5 1.5-1.5h4c.83 0 1.5.67 1.5 1.5v4c0 .83-.67 1.5-1.5 1.5h-4c-.83 0-1.5-.67-1.5-1.5v-4ZM4 14.5c0-.83.67-1.5 1.5-1.5h4c.83 0 1.5.67 1.5 1.5v4c0 .83-.67 1.5-1.5 1.5h-4C4.67 20 4 19.33 4 18.5v-4ZM13 14.5c0-.83.67-1.5 1.5-1.5h4c.83 0 1.5.67 1.5 1.5v4c0 .83-.67 1.5-1.5 1.5h-4c-.83 0-1.5-.67-1.5-1.5v-4Z'),
  characters: icon('M8 4h2v2H8zM14 4h2v2h-2zM6 6h12v2H6zM5 8h14v7H5zM7 15h3v4H7zM14 15h3v4h-3zM9 10.5h.01M15 10.5h.01'),
  cursors: icon('M5 3.5 18.5 10l-6 1.8L10 18 5 3.5ZM12.5 11.8 17 16.5'),
  themes: icon('M3.5 6.5c0-1.1.9-2 2-2h13c1.1 0 2 .9 2 2v11c0 1.1-.9 2-2 2h-13c-1.1 0-2-.9-2-2v-11ZM7 10l3 2.5L7 15M12.5 15H17'),
  packs: icon('M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3ZM4 7.5 12 12l8-4.5M12 12v9'),
  showcase: icon('M4 6.5C4 5.12 5.12 4 6.5 4h11C18.88 4 20 5.12 20 6.5v8c0 1.38-1.12 2.5-2.5 2.5h-11A2.5 2.5 0 0 1 4 14.5v-8ZM10.5 8.5v4l3.5-2-3.5-2ZM8 20h8'),
};

const FEATURED = COLLECTION.featured;

const FOLDER_COLORS = ['#0066fa', '#00bbff', '#a78bfa', '#f59e0b', '#10b981', '#ec4899'];

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav,
  onSelectNav,
  onOpenSponsor,
  onOpenItem,
  counts,
  folders,
  activeFolderId,
  onSelectFolder,
  onCreateFolder,
  onDeleteFolder,
}) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % FEATURED.length);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isCreatingFolder) {
      setTimeout(() => folderInputRef.current?.focus(), 30);
    }
  }, [isCreatingFolder]);

  const handleFeaturedClick = (slot: (typeof FEATURED)[number]) => {
    const found = slot.key ? itemByKey(slot.key) : undefined;
    if (found) onOpenItem(found);
    else onOpenSponsor();
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    onCreateFolder(trimmed, newFolderColor);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const browseItems = COLLECTION.sections.map((id) => ({ id, label: SECTION_LABEL[id], icon: SECTION_ICON[id] }));

  return (
    <aside
      data-shell-sidebar="true"
      aria-label="Sidebar"
      className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-dashed border-line-strong bg-page select-none lg:row-span-2 lg:flex"
    >
      {/* Top 64px Brand Header */}
      <div className="flex h-16 shrink-0 items-center border-b border-dashed border-line-strong px-5">
        <button
          type="button"
          onClick={() => onSelectNav(COLLECTION.sections[0])}
          aria-label={`${BRAND.name}, home`}
          className="group/brand flex items-center gap-2.5 text-left"
        >
          <PetcraftLogo size={32} textClassName="text-[18px]" />
        </button>
      </div>

      {/* Scrollable Navigation & Featured Carousel */}
      <div className="scrollbar-none flex min-h-0 flex-1 flex-col overflow-y-auto px-2.5 pt-4 pb-3">
        <p className="px-2.5 text-body leading-[1.5] text-ink-2">
          {BRAND.intro}
        </p>

        <hr className="mx-2.5 my-5 border-t border-dashed border-line-strong" />

        <nav aria-label="Collections" className="relative isolate flex flex-col gap-4">
          <section aria-label="Browse">
            <h2 className="mb-2 px-2.5 text-small font-medium text-ink-3">Browse</h2>
            <ul className="flex flex-col gap-0.5">
              {browseItems.map((item) => {
                const isActive = activeNav === item.id && !activeFolderId;
                const isHovered = hoveredKey === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      data-plate-key={item.id}
                      aria-current={isActive ? 'page' : undefined}
                      onMouseEnter={() => setHoveredKey(item.id)}
                      onMouseLeave={() => setHoveredKey(null)}
                      onClick={() => onSelectNav(item.id)}
                      className={`group/nav relative flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-body transition-colors duration-150 ${
                        isActive
                          ? 'bg-[color-mix(in_oklab,var(--ink)_6%,transparent)] font-medium text-ink'
                          : isHovered
                          ? 'bg-[color-mix(in_oklab,var(--ink)_4%,transparent)] text-ink'
                          : 'text-ink-2 hover:text-ink'
                      }`}
                    >
                      <span className="nav-icon">{item.icon}</span>
                      <span className="flex-1 truncate text-left">{item.label}</span>
                      {counts[item.id] != null && <span className="text-micro tabular-nums text-ink-3">{counts[item.id]}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-label="Folders">
            <h2 className="mb-1">
              <button
                type="button"
                data-plate-key="folders"
                onClick={() => onSelectNav('folders')}
                onMouseEnter={() => setHoveredKey('folders')}
                onMouseLeave={() => setHoveredKey(null)}
                className={`group/folders relative flex min-h-9 w-full items-center justify-between rounded-[10px] px-2.5 text-small font-medium transition-colors ${
                  activeNav === 'folders' && !activeFolderId
                    ? 'bg-[color-mix(in_oklab,var(--ink)_6%,transparent)] text-ink'
                    : hoveredKey === 'folders'
                    ? 'bg-[color-mix(in_oklab,var(--ink)_4%,transparent)] text-ink'
                    : 'text-ink-3 hover:text-ink'
                }`}
              >
                <span>Folders</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-ink-3">
                  <path d="M9.0001 6C9.0001 6 15 10.4189 15 12C15 13.5812 9 18 9 18" />
                </svg>
              </button>
            </h2>
            <ul className="flex flex-col gap-0.5">
              {folders.map((folder) => {
                const isSelected = activeNav === 'folders' && activeFolderId === folder.id;
                return (
                  <li key={folder.id} className="group/folder-item relative flex items-center">
                    <button
                      type="button"
                      onClick={() => onSelectFolder(folder.id)}
                      className={`relative flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-body transition-colors duration-150 ${
                        isSelected
                          ? 'bg-[color-mix(in_oklab,var(--ink)_6%,transparent)] font-medium text-ink'
                          : 'text-ink-2 hover:bg-[color-mix(in_oklab,var(--ink)_4%,transparent)] hover:text-ink'
                      }`}
                    >
                      <span
                        className="grid size-5 shrink-0 place-items-center rounded-md"
                        style={{ backgroundColor: `${folder.color}18`, color: folder.color }}
                      >
                        <FolderIcon className="size-3.5" />
                      </span>
                      <span className="truncate flex-1 text-left">{folder.name}</span>
                      <span className="text-micro text-ink-3 tabular-nums group-hover/folder-item:opacity-0">
                        {folder.petIds.length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFolder(folder.id);
                      }}
                      aria-label={`Delete folder ${folder.name}`}
                      className="absolute right-2 grid size-6 place-items-center rounded-md text-ink-3 opacity-0 transition-opacity hover:bg-wash hover:text-ink group-hover/folder-item:opacity-100"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </li>
                );
              })}

              {isCreatingFolder ? (
                <li className="px-1.5 py-1">
                  <form onSubmit={handleCreateSubmit} className="rounded-[10px] bg-well p-2">
                    <input
                      ref={folderInputRef}
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Folder name..."
                      className="w-full rounded-md bg-page px-2 py-1 text-small text-ink outline-none ring-1 ring-line-strong focus:ring-brand"
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setIsCreatingFolder(false);
                      }}
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {FOLDER_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setNewFolderColor(color)}
                            className={`size-3.5 rounded-full transition-transform ${
                              newFolderColor === color ? 'scale-125 ring-2 ring-ink/40' : 'opacity-70 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: color }}
                            aria-label={`Select color ${color}`}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setIsCreatingFolder(false)}
                          className="rounded px-1.5 py-0.5 text-micro text-ink-3 hover:text-ink"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="surface surface-primary rounded-full px-2 py-0.5 text-micro font-medium text-white"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </form>
                </li>
              ) : (
                <li>
                  <button
                    type="button"
                    data-plate-key="new-folder"
                    onClick={() => setIsCreatingFolder(true)}
                    onMouseEnter={() => setHoveredKey('new-folder')}
                    onMouseLeave={() => setHoveredKey(null)}
                    className={`relative flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-body transition-colors duration-150 ${
                      hoveredKey === 'new-folder'
                        ? 'bg-[color-mix(in_oklab,var(--ink)_4%,transparent)] text-ink'
                        : 'text-ink-2 hover:text-ink'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
                      <path d="M12.001 5C12.001 9.6674 12.001 14.3347 12.001 19.002M19.002 12.002C14.3347 12.002 9.6673 12.002 5 12.002" />
                    </svg>
                    <span>Create folder</span>
                  </button>
                </li>
              )}
            </ul>
          </section>
        </nav>

        {/* Featured slots, rotating */}
        <div className="mt-auto px-0 pt-6">
          <div className="flex flex-col gap-2">
            <div className="grid">
              {FEATURED.map((slot, idx) => {
                const item = { ...slot, found: slot.key ? itemByKey(slot.key) : undefined, isPrimary: !!slot.key };
                const isCurrent = idx === activeSlide;
                return (
                  <div
                    key={item.title}
                    aria-hidden={!isCurrent}
                    className={`col-start-1 row-start-1 transition-opacity duration-200 ${
                      isCurrent ? 'opacity-100 z-10' : 'pointer-events-none opacity-0'
                    }`}
                  >
                    <button
                      type="button"
                      tabIndex={isCurrent ? 0 : -1}
                      onClick={() => handleFeaturedClick(slot)}
                      className="group/ad relative flex h-full w-full flex-col gap-2.5 rounded-xl bg-well p-3 text-left transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="grid size-7 shrink-0 place-items-center rounded-lg bg-page shadow-[inset_0_0_0_1px_var(--line)] overflow-hidden"
                        >
                          {item.found ? (
                            <ItemIcon item={item.found} size={24} />
                          ) : (
                            <span className="grid size-full place-items-center rounded-lg border border-dashed border-line-strong text-ink-3">+</span>
                          )}
                        </span>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-body leading-tight font-medium text-ink">
                            {item.title}
                          </span>
                          <span className="text-micro leading-tight text-ink-3">
                            {item.label}
                          </span>
                        </div>
                      </div>
                      <p className="line-clamp-2 text-small leading-[1.4] text-ink-2">
                        {item.description}
                      </p>
                      <span
                        className={`surface mt-auto inline-flex h-7 w-full items-center justify-center gap-1 rounded-full text-small font-medium ${
                          item.isPrimary
                            ? 'surface-primary text-white'
                            : 'surface-outline text-ink'
                        }`}
                      >
                        {item.isPrimary ? 'Take a look' : 'Become a sponsor'}
                        {item.isPrimary ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform duration-150 group-hover/ad:translate-x-0.5 group-hover/ad:-translate-y-0.5">
                            <path d="M9 6.6503C9 6.6503 15.9383 6.1076 16.9154 7.0846C17.8924 8.0617 17.3496 15 17.3496 15M16.5 7.5C13.1667 10.8333 9.8333 14.1667 6.5 17.5" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-ink-3 transition-transform duration-150 group-hover/ad:translate-x-0.5">
                            <path d="M9.0001 6C9.0001 6 15 10.4189 15 12C15 13.5812 9 18 9 18" />
                          </svg>
                        )}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Carousel pagination dots */}
            <div role="tablist" aria-label="Sponsored slots" className="flex items-center justify-center gap-1">
              {FEATURED.map((item, idx) => {
                const isSelected = idx === activeSlide;
                return (
                  <button
                    key={item.title}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    aria-label={item.title}
                    onClick={() => setActiveSlide(idx)}
                    className="group grid h-4 place-items-center px-0.5"
                  >
                    <span
                      className={`block h-1.5 rounded-full transition-all duration-200 ${
                        isSelected
                          ? 'w-4 bg-ink'
                          : 'w-1.5 bg-ink-3/40 group-hover:bg-ink-3/70'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Credit Footer */}
      <div className="flex h-12 shrink-0 items-center border-t border-dashed border-line-strong px-5">
        <p className="credit flex items-center gap-1.5 whitespace-nowrap">
          <span>© {new Date().getFullYear()} {BRAND.name}</span>
          <span aria-hidden="true">·</span>
          <a href={`mailto:${BRAND.contactEmail}`} className="transition-colors hover:text-ink">
            Contact
          </a>
        </p>
      </div>
    </aside>
  );
};
