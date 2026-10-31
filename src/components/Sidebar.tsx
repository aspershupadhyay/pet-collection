import React, { useState, useEffect, useRef } from 'react';
import { PetDefinition, PetFolder } from '../types/pet';
import { PETS } from '../data/pets';
import { Folder as FolderIcon, Trash2 } from 'lucide-react';
import { PetcraftLogo } from './PetcraftMark';

export type NavSection = 'finds' | 'inspiration' | 'resources' | 'tools' | 'portfolios' | 'favourites' | 'folders' | 'info';

interface SidebarProps {
  activeNav: NavSection;
  onSelectNav: (nav: NavSection) => void;
  favouritesCount: number;
  onOpenSponsor: () => void;
  onSelectPet: (pet: PetDefinition) => void;
  folders: PetFolder[];
  activeFolderId: string | null;
  onSelectFolder: (folderId: string) => void;
  onCreateFolder: (name: string, color: string) => void;
  onDeleteFolder: (folderId: string) => void;
}

const FEATURED_ITEMS = [
  {
    petId: 'void_cat',
    name: 'Claude Code',
    sublabel: 'Sponsored',
    description: 'Agentic coding companion with /buddy terminal sprites and 10 interactive actions.',
    cta: 'Inspect companion',
    isPrimary: true,
    iconUrl: '/sprites/cat/orange_idle_8fps.gif',
    badgeColor: '#D97757',
  },
  {
    petId: 'ferris_crab',
    name: 'Orca CLI',
    sublabel: 'Sponsored',
    description: 'Deep-sea orchestrator for multi-agent worktrees, terminals, and browser automation.',
    cta: 'Inspect companion',
    isPrimary: true,
    iconUrl: '/sprites/crab/red_idle_8fps.gif',
    badgeColor: '#0066FA',
  },
  {
    petId: 'rubber_duck',
    name: 'VS Code Pets',
    sublabel: 'Sponsored',
    description: 'Authentic 8fps hand-drawn pixel companions roaming inside your editor and terminal.',
    cta: 'Inspect companion',
    isPrimary: true,
    iconUrl: '/sprites/rubber-duck/yellow_idle_8fps.gif',
    badgeColor: '#EAB308',
  },
  {
    petId: '',
    name: 'Your product here',
    sublabel: 'Open slot',
    description: 'Put your product in front of people who build with AI tools every day.',
    cta: 'Become a sponsor',
    isPrimary: false,
    iconUrl: '',
    badgeColor: '',
  },
];

const FOLDER_COLORS = ['#0066fa', '#00bbff', '#a78bfa', '#f59e0b', '#10b981', '#ec4899'];

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav,
  onSelectNav,
  onOpenSponsor,
  onSelectPet,
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
      setActiveSlide((prev) => (prev + 1) % FEATURED_ITEMS.length);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isCreatingFolder) {
      setTimeout(() => folderInputRef.current?.focus(), 30);
    }
  }, [isCreatingFolder]);

  const handleFeaturedClick = (item: (typeof FEATURED_ITEMS)[number]) => {
    if (!item.isPrimary) {
      onOpenSponsor();
      return;
    }
    const found = PETS.find((p) => p.id === item.petId);
    if (found) onSelectPet(found);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    onCreateFolder(trimmed, newFolderColor);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const browseItems: { id: NavSection; label: string; icon: React.ReactNode }[] = [
    {
      id: 'finds',
      label: 'Finds',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17.5 5.7304C17.5 5.9174 17.5 6.1043 17.5 6.2913M17.7801 6.0009C17.6034 6.0009 17.4267 6.0009 17.25 6.0009M18 6.0009C18 6.277 17.7761 6.5009 17.5 6.5009C17.2239 6.5009 17 6.277 17 6.0009C17 5.7247 17.2239 5.5009 17.5 5.5009C17.7761 5.5009 18 5.7247 18 6.0009ZM9.5 7.9995C9.5 5.171 9.5 3.7568 10.3787 2.8781C11.2574 1.9995 12.6716 1.9995 15.5 1.9995C18.3284 1.9995 19.7426 1.9995 20.6213 2.8781C21.5 3.7568 21.5 5.171 21.5 7.9995C21.5 9.3328 21.5 10.6662 21.5 11.9995C21.5 14.8279 21.5 16.2421 20.6213 17.1208C19.7426 17.9995 18.3284 17.9995 15.5 17.9995C12.6716 17.9995 11.2574 17.9995 10.3787 17.1208C9.5 16.2421 9.5 14.8279 9.5 11.9995C9.5 10.6662 9.5 9.3328 9.5 7.9995ZM6.6228 5.9988C4.4909 6.5812 3.3641 6.978 2.8162 7.9269C2.1949 9.0031 2.5609 10.3691 3.293 13.1012C3.6381 14.3891 3.9832 15.677 4.3283 16.9649C5.0603 19.6969 5.4263 21.0629 6.5025 21.6843C7.5786 22.3056 8.9447 21.9396 11.6767 21.2075C12.1593 21.0782 12.5992 20.9603 13 20.8479M9.5 13.9995C10.6231 12.8764 11.7462 11.7532 12.8693 10.6301C13.2731 10.2263 13.8208 9.9995 14.3919 9.9995C15.0873 9.9995 15.7399 10.3353 16.1441 10.9011C17.5961 12.9339 19.048 14.9667 20.5 16.9995" />
        </svg>
      ),
    },
    {
      id: 'inspiration',
      label: 'Inspiration',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 9.6207C19 12.1999 17.7302 14.1852 15.7983 15.4917C15.3483 15.796 15.1233 15.9482 15.0122 16.1212C14.9012 16.2942 14.8633 16.5214 14.7876 16.9757C14.768 17.0934 14.7483 17.2111 14.7287 17.3288C14.5957 18.127 14.5292 18.526 14.2494 18.763C13.9697 19 13.5651 19 12.7559 19C11.8854 19 11.0149 19 10.1444 19C9.3353 19 8.9307 19 8.651 18.763C8.3712 18.526 8.3047 18.127 8.1717 17.3288C8.152 17.2111 8.1324 17.0934 8.1128 16.9757C8.0373 16.5229 7.9996 16.2965 7.8897 16.1243C7.7798 15.9521 7.5543 15.798 7.1033 15.4897C5.1919 14.1832 4 12.1986 4 9.6207C4 5.4119 7.3579 2 11.5 2C12.0137 2 12.5153 2.0525 13 2.1524M16.5 2C16.586 2.2323 16.6719 2.4647 16.7579 2.697C17.0961 3.611 17.2652 4.068 17.5986 4.4014C17.932 4.7348 18.389 4.9039 19.303 5.2421C19.5353 5.3281 19.7677 5.414 20 5.5C19.7677 5.586 19.5353 5.6719 19.303 5.7579C18.389 6.0961 17.932 6.2652 17.5986 6.5986C17.2652 6.932 17.0961 7.389 16.7579 8.303C16.6719 8.5353 16.586 8.7677 16.5 9C16.414 8.7677 16.3281 8.5353 16.2421 8.303C15.9039 7.389 15.7348 6.932 15.4014 6.5986C15.068 6.2652 14.611 6.0961 13.697 5.7579C13.4647 5.6719 13.2323 5.586 13 5.5C13.2323 5.414 13.4647 5.3281 13.697 5.2421C14.611 4.9039 15.068 4.7348 15.4014 4.4014C15.7348 4.068 15.9039 3.611 16.2421 2.697C16.3281 2.4647 16.414 2.2323 16.5 2ZM13.5 19C13.5 19.3333 13.5 19.6667 13.5 20C13.5 20.9428 13.5 21.4142 13.2071 21.7071C12.9142 22 12.4428 22 11.5 22C10.5572 22 10.0858 22 9.7929 21.7071C9.5 21.4142 9.5 20.9428 9.5 20C9.5 19.6667 9.5 19.3333 9.5 19" />
        </svg>
      ),
    },
    {
      id: 'resources',
      label: 'Resources',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2.5 6C2.5 4.4596 2.5 3.6893 2.8467 3.1235C3.0407 2.8069 3.3069 2.5407 3.6235 2.3467C4.1893 2 4.9596 2 6.5 2C8.0404 2 8.8107 2 9.3765 2.3467C9.6931 2.5407 9.9593 2.8069 10.1533 3.1235C10.5 3.6893 10.5 4.4596 10.5 6C10.5 7.5404 10.5 8.3107 10.1533 8.8765C9.9593 9.1931 9.6931 9.4593 9.3765 9.6533C8.8107 10 8.0404 10 6.5 10C4.9596 10 4.1893 10 3.6235 9.6533C3.3069 9.4593 3.0407 9.1931 2.8467 8.8765C2.5 8.3107 2.5 7.5404 2.5 6ZM3.7817 14.7817C4.8285 13.7348 5.352 13.2114 5.9721 13.0625C6.3191 12.9792 6.6809 12.9792 7.0279 13.0625C7.6481 13.2114 8.1715 13.7348 9.2183 14.7817C10.2652 15.8285 10.7886 16.3519 10.9375 16.9721C11.0208 17.3191 11.0208 17.6809 10.9375 18.0279C10.7886 18.6481 10.2652 19.1715 9.2183 20.2183C8.1715 21.2652 7.6481 21.7886 7.0279 21.9375C6.6809 22.0208 6.3191 22.0208 5.9721 21.9375C5.352 21.7886 4.8285 21.2652 3.7817 20.2183C2.7348 19.1715 2.2114 18.6481 2.0625 18.0279C1.9792 17.6809 1.9792 17.3191 2.0625 16.9721C2.2114 16.3519 2.7348 15.8285 3.7817 14.7817ZM14 18C14 16.4596 14 15.6893 14.3467 15.1235C14.5407 14.8069 14.8069 14.5407 15.1235 14.3467C15.6893 14 16.4596 14 18 14C19.5404 14 20.3107 14 20.8765 14.3467C21.1931 14.5407 21.4593 14.8069 21.6533 15.1235C22 15.6893 22 16.4596 22 18C22 19.5404 22 20.3107 21.6533 20.8765C21.4593 21.1931 21.1931 21.4593 20.8765 21.6533C20.3107 22 19.5404 22 18 22C16.4596 22 15.6893 22 15.1235 21.6533C14.8069 21.4593 14.5407 21.1931 14.3467 20.8765C14 20.3107 14 19.5404 14 18ZM18 2C18 4.6667 18 7.3333 18 10M22 6C19.3333 6 16.6667 6 14 6" />
        </svg>
      ),
    },
    {
      id: 'tools',
      label: 'Tools',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17 8C17.6133 8.6167 18.2265 9.2334 18.8398 9.8501C19.6133 10.6279 20 11.0168 20 11.5C20 11.9832 19.6133 12.3721 18.8398 13.1499C18.2265 13.7666 17.6133 14.3833 17 15M7 8C6.3867 8.6167 5.7735 9.2334 5.1602 9.8501C4.3867 10.6279 4 11.0168 4 11.5C4 11.9832 4.3867 12.3721 5.1602 13.1499C5.7735 13.7666 6.3867 14.3833 7 15M14.5 4C12.8333 9.3333 11.1667 14.6667 9.5 20" />
        </svg>
      ),
    },
    {
      id: 'portfolios',
      label: 'Portfolios',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M8.5001 3.708C8.1939 3.5742 7.8557 3.5 7.5001 3.5C6.1194 3.5 5.0001 4.6193 5.0001 6C5.0001 6.8178 5.3928 7.5439 5.9999 8M3.3751 16.5C2.6157 16.5 2.0001 15.8588 2.0001 15.0677C2.0001 13.4585 3.6666 11.8492 6.5001 11.5402M15.4999 3.7075C15.8061 3.5737 16.1443 3.4995 16.4999 3.4995C17.8806 3.4995 18.9999 4.6188 18.9999 5.9995C18.9999 6.8173 18.6072 7.5434 18.0001 7.9995M20.6249 16.4995C21.3843 16.4995 21.9999 15.8582 21.9999 15.0672C21.9999 13.458 20.3335 11.8488 17.5001 11.5397M15.0001 8.5C15.0001 10.1569 13.657 11.5 12.0001 11.5C10.3432 11.5 9.0001 10.1569 9.0001 8.5C9.0001 6.8431 10.3432 5.5 12.0001 5.5C13.657 5.5 15.0001 6.8431 15.0001 8.5ZM12.0001 14.5C8.2501 14.5 6.0001 16.6429 6.0001 18.7857C6.0001 19.7325 6.6717 20.5 7.5001 20.5C10.5001 20.5 13.5001 20.5 16.5001 20.5C17.3285 20.5 18.0001 19.7325 18.0001 18.7857C18.0001 16.6429 15.7501 14.5 12.0001 14.5Z" />
        </svg>
      ),
    },
  ];

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
          onClick={() => onSelectNav('finds')}
          aria-label="PetCraft.xyz, home"
          className="group/brand flex items-center gap-2.5 text-left"
        >
          <PetcraftLogo size={32} textClassName="text-[18px]" />
        </button>
      </div>

      {/* Scrollable Navigation & Featured Carousel */}
      <div className="scrollbar-none flex min-h-0 flex-1 flex-col overflow-y-auto px-2.5 pt-4 pb-3">
        <p className="px-2.5 text-body leading-[1.5] text-ink-2">
          A hand-picked collection of pixel companions that live next to your code.
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
                      <span className="truncate">{item.label}</span>
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

        {/* Bottom Featured / Sponsor Carousel (Exact designeer.xyz stacked card DOM) */}
        <div className="mt-auto px-0 pt-6">
          <div className="flex flex-col gap-2">
            <div className="grid">
              {FEATURED_ITEMS.map((item, idx) => {
                const isCurrent = idx === activeSlide;
                return (
                  <div
                    key={item.name}
                    aria-hidden={!isCurrent}
                    className={`col-start-1 row-start-1 transition-opacity duration-200 ${
                      isCurrent ? 'opacity-100 z-10' : 'pointer-events-none opacity-0'
                    }`}
                  >
                    <button
                      type="button"
                      tabIndex={isCurrent ? 0 : -1}
                      onClick={() => handleFeaturedClick(item)}
                      className="group/ad relative flex h-full w-full flex-col gap-2.5 rounded-xl bg-well p-3 text-left transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="grid size-7 shrink-0 place-items-center rounded-lg bg-page shadow-[inset_0_0_0_1px_var(--line)] overflow-hidden"
                        >
                          {item.iconUrl ? (
                            <img
                              src={item.iconUrl}
                              alt=""
                              width={24}
                              height={24}
                              className="size-6 object-contain pixelated"
                            />
                          ) : (
                            <span className="grid size-full place-items-center rounded-lg border border-dashed border-line-strong text-ink-3">+</span>
                          )}
                        </span>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-body leading-tight font-medium text-ink">
                            {item.name}
                          </span>
                          <span className="text-micro leading-tight text-ink-3">
                            {item.sublabel}
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
                        {item.cta}
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
              {FEATURED_ITEMS.map((item, idx) => {
                const isSelected = idx === activeSlide;
                return (
                  <button
                    key={item.name}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    aria-label={item.name}
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
        <p className="credit flex items-center gap-1 whitespace-nowrap">
          <span>Curated by</span>
          <a
            href="https://designeer.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 transition-colors hover:text-ink"
          >
            <img
              src="/sprites/cat/orange_idle_8fps.gif"
              alt=""
              width={14}
              height={14}
              className="size-3.5 rounded-full object-cover pixelated"
            />
            <span>Petcraft &amp; Designeer</span>
          </a>
        </p>
      </div>
    </aside>
  );
};
