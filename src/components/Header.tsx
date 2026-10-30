import React, { useState, useRef, useEffect } from 'react';
import { PetAction, PetCategory, PetDefinition } from '../types/pet';
import { ACTIONS, PET_CATEGORIES, PETS } from '../data/pets';
import { NavSection } from './Sidebar';
import { PetcraftMark } from './PetcraftMark';
import { usePwaInstall } from '../pwa/pwa';
import { useCustomCursor } from '../hooks/useCustomCursor';
import { Download } from 'lucide-react';

interface HeaderProps {
  selectedCategory: PetCategory;
  onSelectCategory: (cat: PetCategory) => void;
  globalAction: PetAction | 'auto';
  onSelectGlobalAction: (act: PetAction | 'auto') => void;
  viewMode: 'tile' | 'list' | 'canvas';
  onChangeViewMode: (mode: 'tile' | 'list' | 'canvas') => void;
  renderMode: 'pixel' | 'ascii';
  onChangeRenderMode: (mode: 'pixel' | 'ascii') => void;
  selectedColorFilter: string;
  onSelectColorFilter: (color: string) => void;
  onOpenSearch: () => void;
  onOpenStudio: () => void;
  onOpenInfo: () => void;
  onOpenSubmit: () => void;
  onSelectPet: (pet: PetDefinition) => void;
  darkMode: boolean;
  onChangeDarkMode: (value: boolean) => void;
  muted: boolean;
  onChangeMuted: (value: boolean) => void;
  activeNav: NavSection;
  onSelectNav: (nav: NavSection) => void;
  favouritesCount: number;
  totalShowing: number;
}

const SECTION_HEADERS: Record<NavSection, { title: string; subtitle: string }> = {
  finds: {
    title: 'Interactive details and companion moments.',
    subtitle: 'Short-form recordings of interface craft, 8fps pixel animations, and AI coding companions.',
  },
  inspiration: {
    title: 'Visual references for research and direction.',
    subtitle: 'Design galleries, mythical companions, and editorial collections for visual research.',
  },
  resources: {
    title: 'Component libraries and sprite packs.',
    subtitle: 'Hand-crafted pixel sheets, Pretext ASCII rigs, and habitat assets ready to drop in.',
  },
  tools: {
    title: 'Software for design and development workflows.',
    subtitle: 'Claude Code /buddy, VS Code Pets, Orca CLI, and Cursor IDE companion integrations.',
  },
  portfolios: {
    title: 'Personal sites of designers and engineers.',
    subtitle: 'Curated companion creators, pixel artists, and creative toolmakers.',
  },
  favourites: {
    title: 'Your saved companions and tool presets.',
    subtitle: 'Starred companions persisted locally for instant one-click export.',
  },
  folders: {
    title: 'Organized collections and custom folders.',
    subtitle: 'Group companions by project, editor workflow, or aesthetic palette.',
  },
};

const COLOR_SWATCHES = [
  { id: 'all', label: 'All colours', hex: 'conic-gradient(#f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' },
  { id: 'orange', label: 'Warm & Amber', hex: '#f97316' },
  { id: 'blue', label: 'Cyan & Ocean', hex: '#0066fa' },
  { id: 'purple', label: 'Violet & Mythic', hex: '#a855f7' },
  { id: 'green', label: 'Emerald & Nature', hex: '#10b981' },
  { id: 'dark', label: 'Obsidian & Mono', hex: '#27272a' },
];

const HEADER_SPONSORS = [
  {
    petId: 'void_cat',
    name: 'Claude Code /buddy',
    icon: '/sprites/cat/orange_idle_8fps.gif',
  },
  {
    petId: 'ferris_crab',
    name: 'Orca CLI',
    icon: '/sprites/crab/red_idle_8fps.gif',
  },
  {
    petId: 'rubber_duck',
    name: 'VS Code Pets',
    icon: '/sprites/rubber-duck/yellow_idle_8fps.gif',
  },
];

export const Header: React.FC<HeaderProps> = ({
  selectedCategory,
  onSelectCategory,
  globalAction,
  onSelectGlobalAction,
  viewMode,
  onChangeViewMode,
  renderMode,
  onChangeRenderMode,
  selectedColorFilter,
  onSelectColorFilter,
  onOpenSearch,
  onOpenStudio,
  onOpenInfo,
  onOpenSubmit,
  onSelectPet,
  darkMode,
  onChangeDarkMode,
  muted,
  onChangeMuted,
  activeNav,
  onSelectNav,
  favouritesCount,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [moreCatsOpen, setMoreCatsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { canInstall, install, installed } = usePwaInstall();
  const { customCursor, onChangeCustomCursor } = useCustomCursor();

  const settingsRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);
  const moreCatsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf: number | undefined;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = undefined;
        setScrolled(window.scrollY > 32);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) {
        setColorMenuOpen(false);
      }
      if (actionRef.current && !actionRef.current.contains(e.target as Node)) {
        setActionMenuOpen(false);
      }
      if (moreCatsRef.current && !moreCatsRef.current.contains(e.target as Node)) {
        setMoreCatsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentHero = SECTION_HEADERS[activeNav] || SECTION_HEADERS.finds;
  const visibleCategories = PET_CATEGORIES.slice(0, 4);
  const overflowCategories = PET_CATEGORIES.slice(4);
  const activeSwatch = COLOR_SWATCHES.find((c) => c.id === selectedColorFilter) || COLOR_SWATCHES[0];
  const activeActionLabel =
    globalAction === 'auto'
      ? activeNav === 'finds'
        ? 'Recent'
        : 'Curated'
      : ACTIONS.find((a) => a.id === globalAction)?.label || 'Recent';

  return (
    <>
      {/* Top 3-Column Desktop Header (h-16 grid-cols-[1fr_auto_1fr]) - Exact designeer.xyz DOM */}
      <div
        style={{ viewTransitionName: 'page-header' }}
        className="-mx-[16px] relative z-30 grid h-16 grid-cols-[1fr_auto_1fr] items-center px-[16px] max-lg:hidden"
      >
        <p className="sr-only">{activeNav}</p>

        {/* Left: Login / Sandbox pill + Favourites + Info */}
        <nav aria-label="Site" className="flex items-center gap-5">
          <button
            type="button"
            onClick={onOpenStudio}
            className="group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap outline-none select-none transition-[color,opacity,transform] duration-150 active:scale-[0.98] surface surface-outline text-ink h-[32px] px-3.5 text-lead"
          >
            Sandbox
          </button>
          <button
            type="button"
            onClick={() => onSelectNav('favourites')}
            className={`text-lead font-medium transition-colors duration-150 ${
              activeNav === 'favourites' ? 'text-ink' : 'text-ink-3 hover:text-ink'
            }`}
          >
            Favourites{favouritesCount > 0 ? ` (${favouritesCount})` : ''}
          </button>
          <button
            type="button"
            onClick={onOpenInfo}
            className="text-lead font-medium transition-colors duration-150 text-ink-3 hover:text-ink"
          >
            Info
          </button>
        </nav>

        {/* Center: Search Pill */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap outline-none select-none transition-[color,opacity,transform] duration-150 active:scale-[0.98] surface surface-outline text-ink h-[32px] px-3.5 text-lead"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-ink-3">
            <path d="M17 17C18.3333 18.3333 19.6667 19.6667 21 21M19 11C19 6.5817 15.4183 3 11 3C6.5817 3 3 6.5817 3 11C3 15.4183 6.5817 19 11 19C15.4183 19 19 15.4183 19 11Z" />
          </svg>
          Search
        </button>

        {/* Right: Quick Sponsor Icons + Plus Button + 3D Keycap Submit + Settings Gear */}
        <div className="page-header-actions flex items-center justify-end gap-3">
          <div className="flex items-center gap-3">
            {HEADER_SPONSORS.map((sp) => (
              <button
                key={sp.petId}
                type="button"
                title={sp.name}
                aria-label={`${sp.name}, featured companion`}
                onClick={() => {
                  const found = PETS.find((p) => p.id === sp.petId);
                  if (found) onSelectPet(found);
                }}
                className="tap inline-flex rounded-lg bg-well p-0.5 ring-1 ring-line transition-transform hover:scale-105 active:scale-95"
              >
                <img
                  src={sp.icon}
                  alt=""
                  width={28}
                  height={28}
                  style={{ width: 26, height: 26 }}
                  className="shrink-0 rounded-md object-contain pixelated"
                />
              </button>
            ))}
            <button
              type="button"
              onClick={onOpenSubmit}
              aria-label="Submit or become a sponsor"
              title="Add custom companion"
              className="group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap outline-none select-none transition-[color,opacity,transform] duration-150 active:scale-[0.98] surface surface-outline text-ink size-[28px] tap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12.001 5C12.001 9.6674 12.001 14.3347 12.001 19.002M19.002 12.002C14.3347 12.002 9.6673 12.002 5 12.002" />
              </svg>
            </button>
          </div>

          {/* 3D Skueomorphic Keycap Button */}
          <button
            type="button"
            onClick={onOpenSubmit}
            aria-label="Submit a listing"
            className="key shrink-0 font-medium focus-visible:outline-offset-3"
          >
            <span>Submit</span>
          </button>

          {/* Settings Gear Button & Popover */}
          <div className="relative" ref={settingsRef}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={settingsOpen}
              aria-label="Settings"
              onClick={() => setSettingsOpen((prev) => !prev)}
              className="group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap outline-none select-none transition-[color,opacity,transform] duration-150 active:scale-[0.98] surface surface-outline size-[28px] compact-header-icon tap text-ink-2 aria-expanded:text-ink"
            >
              <span className="inline-flex">
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M16.3083 4.3839C15.7173 4.3839 15.4217 4.3839 15.1525 4.2841C15.1151 4.2702 15.0783 4.2549 15.042 4.2383C14.781 4.1186 14.5721 3.9096 14.1541 3.4917C13.1922 2.5298 12.7113 2.0488 12.1195 2.0045C12.04 1.9985 11.96 1.9985 11.8805 2.0045C11.2887 2.0488 10.8077 2.5298 9.8459 3.4917C9.4279 3.9096 9.219 4.1186 8.958 4.2383C8.9217 4.2549 8.8849 4.2702 8.8475 4.2841C8.5783 4.3839 8.2827 4.3839 7.6917 4.3839C7.6554 4.3839 7.619 4.3839 7.5827 4.3839C6.0748 4.3839 5.3208 4.3839 4.8524 4.8524C4.3839 5.3208 4.3839 6.0748 4.3839 7.5827C4.3839 7.619 4.3839 7.6554 4.3839 7.6917C4.3839 8.2827 4.3839 8.5783 4.2841 8.8475C4.2702 8.8849 4.2549 8.9217 4.2383 8.958C4.1186 9.219 3.9096 9.4279 3.4917 9.8459C2.5298 10.8077 2.0488 11.2887 2.0045 11.8805C1.9985 11.96 1.9985 12.04 2.0045 12.1195C2.0488 12.7113 2.5298 13.1922 3.4917 14.1541C3.9096 14.5721 4.1186 14.781 4.2383 15.042C4.2549 15.0783 4.2702 15.1151 4.2841 15.1525C4.3839 15.4217 4.3839 15.7173 4.3839 16.3083C4.3839 16.3446 4.3839 16.381 4.3839 16.4173C4.3839 17.9252 4.3839 18.6792 4.8524 19.1476C5.3208 19.6161 6.0748 19.6161 7.5827 19.6161C7.619 19.6161 7.6554 19.6161 7.6917 19.6161C8.2827 19.6161 8.5783 19.6161 8.8475 19.716C8.8849 19.7298 8.9217 19.7451 8.958 19.7617C9.219 19.8815 9.4279 20.0904 9.8459 20.5083C10.8077 21.4702 11.2887 21.9512 11.8805 21.9955C11.96 22.0015 12.0399 22.0015 12.1195 21.9955C12.7113 21.9512 13.1922 21.4702 14.1541 20.5083C14.5721 20.0904 14.781 19.8815 15.042 19.7617C15.0783 19.7451 15.1151 19.7298 15.1525 19.716C15.4217 19.6161 15.7173 19.6161 16.3083 19.6161C16.3446 19.6161 16.381 19.6161 16.4173 19.6161C17.9252 19.6161 18.6792 19.6161 19.1476 19.1476C19.6161 18.6792 19.6161 17.9252 19.6161 16.4173C19.6161 16.381 19.6161 16.3446 19.6161 16.3083C19.6161 15.7173 19.6161 15.4217 19.716 15.1525C19.7298 15.1151 19.7451 15.0783 19.7617 15.042C19.8815 14.781 20.0904 14.5721 20.5083 14.1541C21.4702 13.1922 21.9512 12.7113 21.9955 12.1195C22.0015 12.0399 22.0015 11.96 21.9955 11.8805C21.9512 11.2887 21.4702 10.8077 20.5083 9.8459C20.0904 9.4279 19.8815 9.219 19.7617 8.958C19.7451 8.9217 19.7298 8.8849 19.716 8.8475C19.6161 8.5783 19.6161 8.2827 19.6161 7.6917C19.6161 7.6554 19.6161 7.619 19.6161 7.5827C19.6161 6.0748 19.6161 5.3208 19.1476 4.8524C18.6792 4.3839 17.9252 4.3839 16.4173 4.3839C16.381 4.3839 16.3446 4.3839 16.3083 4.3839ZM15.5 12C15.5 13.933 13.933 15.5 12 15.5C10.067 15.5 8.5 13.933 8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12Z" />
                </svg>
              </span>
            </button>

            {settingsOpen && (
              <div
                role="menu"
                className="animate-popup-in absolute top-full right-0 z-50 mt-2 w-60 rounded-tray layer-float p-1.5"
              >
                {/* Theme — light / dark segmented pill */}
                <div className="flex w-full items-center justify-between gap-2 rounded-[8px] px-2.5 py-1.5">
                  <span className="text-body text-ink">Theme</span>
                  <div
                    role="group"
                    aria-label="Theme"
                    className="flex shrink-0 items-center gap-0.5 rounded-full bg-well p-0.5 shadow-[inset_0_0_0_1px_var(--line)]"
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={!darkMode}
                      aria-label="Light theme"
                      title="Light"
                      onClick={() => onChangeDarkMode(false)}
                      className={`tap grid size-6 place-items-center rounded-full transition-[color,background-color] duration-150 ${
                        !darkMode
                          ? 'bg-page text-ink shadow-[inset_0_0_0_1px_var(--line-strong)]'
                          : 'text-ink-3 hover:text-ink'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={darkMode}
                      aria-label="Dark theme"
                      title="Dark"
                      onClick={() => onChangeDarkMode(true)}
                      className={`tap grid size-6 place-items-center rounded-full transition-[color,background-color] duration-150 ${
                        darkMode
                          ? 'bg-page text-ink shadow-[inset_0_0_0_1px_var(--line-strong)]'
                          : 'text-ink-3 hover:text-ink'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 3a6 6 0 0 1 9 9 9 9 0 1 1-9-9Z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Sound — on / off segmented pill */}
                <div className="flex w-full items-center justify-between gap-2 rounded-[8px] px-2.5 py-1.5">
                  <span className="text-body text-ink">Sound</span>
                  <div
                    role="group"
                    aria-label="Sound effects"
                    className="flex shrink-0 items-center gap-0.5 rounded-full bg-well p-0.5 shadow-[inset_0_0_0_1px_var(--line)]"
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={!muted}
                      aria-label="Sound on"
                      title="Sound on"
                      onClick={() => onChangeMuted(false)}
                      className={`tap grid size-6 place-items-center rounded-full transition-[color,background-color] duration-150 ${
                        !muted
                          ? 'bg-page text-ink shadow-[inset_0_0_0_1px_var(--line-strong)]'
                          : 'text-ink-3 hover:text-ink'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3.5 10v4h3.2L11 17.6V6.4L6.7 10H3.5Z" />
                        <path d="M15 9.5a3.5 3.5 0 0 1 0 5" />
                        <path d="M17.5 7a7 7 0 0 1 0 10" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={muted}
                      aria-label="Sound off"
                      title="Sound off"
                      onClick={() => onChangeMuted(true)}
                      className={`tap grid size-6 place-items-center rounded-full transition-[color,background-color] duration-150 ${
                        muted
                          ? 'bg-page text-ink shadow-[inset_0_0_0_1px_var(--line-strong)]'
                          : 'text-ink-3 hover:text-ink'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3.5 10v4h3.2L11 17.6V6.4L6.7 10H3.5Z" />
                        <path d="M15.5 9.5l5 5" />
                        <path d="M20.5 9.5l-5 5" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Custom cursor — pixel paw / system pointer segmented pill */}
                <div className="flex w-full items-center justify-between gap-2 rounded-[8px] px-2.5 py-1.5">
                  <span className="text-body text-ink">Custom cursor</span>
                  <div
                    role="group"
                    aria-label="Custom cursor"
                    className="flex shrink-0 items-center gap-0.5 rounded-full bg-well p-0.5 shadow-[inset_0_0_0_1px_var(--line)]"
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={customCursor}
                      aria-label="Pixel paw cursor"
                      title="Pixel paw cursor"
                      onClick={() => onChangeCustomCursor(true)}
                      className={`tap grid size-6 place-items-center rounded-full transition-[color,background-color] duration-150 ${
                        customCursor
                          ? 'bg-page text-ink shadow-[inset_0_0_0_1px_var(--line-strong)]'
                          : 'text-ink-3 hover:text-ink'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <ellipse cx="12.2" cy="15.6" rx="4.6" ry="3.6" />
                        <ellipse cx="6.3" cy="10.8" rx="1.9" ry="2.4" />
                        <ellipse cx="9.9" cy="7" rx="1.9" ry="2.5" />
                        <ellipse cx="14.5" cy="6.8" rx="1.9" ry="2.5" />
                        <ellipse cx="18.1" cy="10.6" rx="1.9" ry="2.4" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={!customCursor}
                      aria-label="System cursor"
                      title="System cursor"
                      onClick={() => onChangeCustomCursor(false)}
                      className={`tap grid size-6 place-items-center rounded-full transition-[color,background-color] duration-150 ${
                        !customCursor
                          ? 'bg-page text-ink shadow-[inset_0_0_0_1px_var(--line-strong)]'
                          : 'text-ink-3 hover:text-ink'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M4.5 3.5 10.9 18.8l2.2-6.1 6.1-2.2L4.5 3.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>

                <hr className="my-1 border-t border-dashed border-line" />

                <button
                  type="button"
                  onClick={() => onChangeRenderMode(renderMode === 'pixel' ? 'ascii' : 'pixel')}
                  className="flex w-full items-center justify-between rounded-[8px] px-2.5 py-1.5 text-body text-ink hover:bg-wash"
                >
                  <span>Sprite Engine</span>
                  <span className="rounded-full bg-well px-2 py-0.5 text-micro font-medium text-ink-2">
                    {renderMode === 'pixel' ? '8fps Pixel' : 'Claude /buddy'}
                  </span>
                </button>
                {(canInstall || installed) && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (installed) return;
                      const ok = await install();
                      if (ok) setSettingsOpen(false);
                    }}
                    disabled={!canInstall}
                    className="flex w-full items-center justify-between gap-2 rounded-[8px] px-2.5 py-1.5 text-body hover:bg-wash disabled:opacity-60 text-ink"
                  >
                    <span className="shrink-0">Install app</span>
                    <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-well px-2 py-0.5 text-micro font-medium text-ink-2 whitespace-nowrap">
                      <Download className="size-3" />
                      {installed ? 'Installed' : 'Add to desktop'}
                    </span>
                  </button>
                )}
                <hr className="my-1 border-t border-dashed border-line" />
                <button
                  type="button"
                  onClick={() => {
                    setSettingsOpen(false);
                    onOpenStudio();
                  }}
                  className="flex w-full items-center justify-between rounded-[8px] px-2.5 py-1.5 text-body text-ink hover:bg-wash"
                >
                  <span>Multi-Pet Sandbox</span>
                  <span className="text-micro text-ink-3">Open ↗</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Intro Section (lg:hidden) - Exact designeer.xyz mobile hero */}
      <section
        data-mobile-intro="true"
        aria-label="About Petcraft"
        className="flex flex-col pt-4 pb-6 lg:hidden"
      >
        <div className="flex items-start justify-between">
          <button
            type="button"
            onClick={() => onSelectNav('finds')}
            aria-label="PetCraft.xyz, home"
            className="group/brand tap rounded-2xl"
          >
            <PetcraftMark size={72} />
          </button>
          <div className="-mt-1 -mr-2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenStudio}
              className="surface surface-outline text-ink rounded-full px-3 h-8 text-body font-medium"
            >
              Sandbox
            </button>
            <button
              type="button"
              onClick={() => onChangeDarkMode(!darkMode)}
              aria-label="Toggle theme"
              className="surface surface-outline size-8 rounded-full grid place-items-center text-ink-2"
            >
              {darkMode ? '☾' : '☀'}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSelectNav('finds')}
          className="tap mt-5 flex w-fit items-center rounded-full font-pixel text-[19px] leading-none text-ink"
        >
          petcraft<span className="pc-mark-blink text-[#5b7cff]">_</span>
        </button>
        <p className="mt-4 text-[15px] leading-[1.6] text-pretty text-ink">
          A curated collection of interface craft, interactive AI companions, pixel sprites, and resources for builders.
        </p>
      </section>

      {/* Centered Editorial Hero Title (Hidden in List view, just like designeer.xyz) */}
      {viewMode !== 'list' && (
        <section className="mx-auto flex max-w-[36rem] flex-col items-center gap-2 px-0 pt-7 pb-6 text-center sm:gap-2.5 sm:px-4 sm:pt-16 sm:pb-[2.95rem]">
          <h1 className="font-display text-[22px] leading-[1.25] sm:text-[20px] sm:leading-[1.2] font-medium tracking-[-0.02em] text-balance text-ink">
            {currentHero.title}
          </h1>
          <p className="text-[14px] leading-[1.55] text-ink-3 text-pretty">
            {currentHero.subtitle}
          </p>
        </section>
      )}

      {/* Sticky Filter Row (data-filter-row="true") - Exact designeer.xyz DOM */}
      <div
        data-filter-row="true"
        className="sticky top-0 isolate z-20 -mx-[16px] flex items-center gap-2 sm:gap-3 px-[16px] pt-1 pb-3 sm:pt-4 sm:pb-5"
      >
        {/* Scroll backdrop blur fade */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 top-0 -bottom-6 -z-10 bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--page)_88%,transparent)_0%,color-mix(in_srgb,var(--page)_75%,transparent)_45%,color-mix(in_srgb,var(--page)_20%,transparent)_80%,transparent_100%)] backdrop-blur-xs [mask-image:linear-gradient(to_bottom,#000_50%,transparent)] transition-opacity duration-200 ${
            scrolled ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Left: Category Pills + "+N more" dropdown */}
        <div className="flex min-w-0 flex-1 items-center sm:max-w-[38rem]">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <div role="group" aria-label="Category" className="relative flex w-max gap-1.5">
              {visibleCategories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onSelectCategory(cat)}
                    className={`surface inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 font-medium max-sm:h-7 max-sm:px-3 max-sm:text-small whitespace-nowrap transition-[color] duration-150 ${
                      isSelected
                        ? 'surface-primary text-white'
                        : 'surface-outline text-ink-2 hover:text-ink'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* +2 more dropdown */}
            {overflowCategories.length > 0 && (
              <div className="relative" ref={moreCatsRef}>
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={moreCatsOpen}
                  onClick={() => setMoreCatsOpen((prev) => !prev)}
                  className={`surface inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 font-medium max-sm:h-7 max-sm:px-3 max-sm:text-small whitespace-nowrap transition-[color] duration-150 ${
                    overflowCategories.includes(selectedCategory)
                      ? 'surface-primary text-white'
                      : 'surface-outline text-ink-2 hover:text-ink'
                  }`}
                >
                  {overflowCategories.includes(selectedCategory)
                    ? selectedCategory
                    : `+${overflowCategories.length} more`}
                  <svg className="size-4 shrink-0 opacity-70" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="4,6 8,10 12,6" />
                  </svg>
                </button>

                {moreCatsOpen && (
                  <div className="animate-popup-in absolute top-full left-0 z-50 mt-2 w-44 rounded-tray layer-float p-1">
                    {overflowCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          onSelectCategory(cat);
                          setMoreCatsOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-[8px] px-2.5 py-1.5 text-body transition-colors ${
                          selectedCategory === cat
                            ? 'bg-wash font-medium text-ink'
                            : 'text-ink-2 hover:bg-wash hover:text-ink'
                        }`}
                      >
                        <span>{cat}</span>
                        {selectedCategory === cat && <span className="size-1.5 rounded-full bg-brand" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: View Switcher + All colours conic wheel + Recent/Action dropdown */}
        <div className="shrink-0 sm:ml-auto">
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Tile / List / Canvas View Switcher (Exact designeer.xyz group) */}
            <div
              role="group"
              aria-label="View"
              className="surface surface-outline flex h-8 shrink-0 items-center gap-0.5 rounded-full p-0.5"
            >
              <button
                type="button"
                aria-label="Tile view"
                title="Tile view"
                aria-pressed={viewMode === 'tile'}
                onClick={() => onChangeViewMode('tile')}
                className={`surface grid size-7 place-items-center rounded-full transition-[color] duration-150 ${
                  viewMode === 'tile'
                    ? 'surface-primary text-white'
                    : 'text-ink-3 hover:text-ink'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10.5 8.75C10.5 8.0833 10.5 7.4167 10.5 6.75C10.5 5.1063 10.5 4.2844 10.046 3.7312C9.9629 3.63 9.8701 3.5371 9.7688 3.454C9.2156 3 8.3937 3 6.75 3C5.1063 3 4.2844 3 3.7312 3.454C3.63 3.5371 3.5371 3.63 3.454 3.7312C3 4.2844 3 5.1063 3 6.75C3 7.4167 3 8.0833 3 8.75C3 10.3937 3 11.2156 3.454 11.7688C3.5371 11.8701 3.63 11.9629 3.7312 12.046C4.2844 12.5 5.1063 12.5 6.75 12.5C8.3937 12.5 9.2156 12.5 9.7688 12.046C9.8701 11.9629 9.9629 11.8701 10.046 11.7688C10.5 11.2156 10.5 10.3937 10.5 8.75ZM7.75 15.5C7.0833 15.5 6.4167 15.5 5.75 15.5C5.0522 15.5 4.7033 15.5 4.4194 15.5861C3.7802 15.78 3.28 16.2802 3.0861 16.9194C3 17.2033 3 17.5522 3 18.25C3 18.9478 3 19.2967 3.0861 19.5806C3.28 20.2198 3.7802 20.72 4.4194 20.9139C4.7033 21 5.0522 21 5.75 21C6.4167 21 7.0833 21 7.75 21C8.4478 21 8.7967 21 9.0806 20.9139C9.7198 20.72 10.22 20.2198 10.4139 19.5806C10.5 19.2967 10.5 18.9478 10.5 18.25C10.5 17.5522 10.5 17.2033 10.4139 16.9194C10.22 16.2802 9.7198 15.78 9.0806 15.5861C8.7967 15.5 8.4478 15.5 7.75 15.5ZM21 17.25C21 16.5833 21 15.9167 21 15.25C21 13.6063 21 12.7844 20.546 12.2312C20.4629 12.1299 20.3701 12.0371 20.2688 11.954C19.7156 11.5 18.8937 11.5 17.25 11.5C15.6063 11.5 14.7844 11.5 14.2312 11.954C14.1299 12.0371 14.0371 12.1299 13.954 12.2312C13.5 12.7844 13.5 13.6063 13.5 15.25C13.5 15.9167 13.5 16.5833 13.5 17.25C13.5 18.8937 13.5 19.7156 13.954 20.2688C14.0371 20.3701 14.1299 20.4629 14.2312 20.546C14.7844 21 15.6063 21 17.25 21C18.8937 21 19.7156 21 20.2688 20.546C20.3701 20.4629 20.4629 20.3701 20.546 20.2688C21 19.7156 21 18.8937 21 17.25ZM18.25 3C17.5833 3 16.9167 3 16.25 3C15.5522 3 15.2033 3 14.9194 3.0861C14.2802 3.28 13.78 3.7802 13.5861 4.4194C13.5 4.7033 13.5 5.0522 13.5 5.75C13.5 6.4478 13.5 6.7967 13.5861 7.0806C13.78 7.7198 14.2802 8.22 14.9194 8.4139C15.2033 8.5 15.5522 8.5 16.25 8.5C16.9167 8.5 17.5833 8.5 18.25 8.5C18.9478 8.5 19.2967 8.5 19.5806 8.4139C20.2198 8.22 20.72 7.7198 20.9139 7.0806C21 6.7967 21 6.4478 21 5.75C21 5.0522 21 4.7033 20.9139 4.4194C20.72 3.7802 20.2198 3.28 19.5806 3.0861C19.2967 3 18.9478 3 18.25 3Z" />
                </svg>
              </button>

              <button
                type="button"
                aria-label="List view"
                title="List view"
                aria-pressed={viewMode === 'list'}
                onClick={() => onChangeViewMode('list')}
                className={`surface grid size-7 place-items-center rounded-full transition-[color] duration-150 ${
                  viewMode === 'list'
                    ? 'surface-primary text-white'
                    : 'text-ink-3 hover:text-ink'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3.5126 9.4874C4.0251 10 4.8501 10 6.5 10C8.1499 10 8.9749 10 9.4874 9.4874C10 8.9749 10 8.1499 10 6.5C10 4.8501 10 4.0251 9.4874 3.5126C8.9749 3 8.1499 3 6.5 3C4.8501 3 4.0251 3 3.5126 3.5126C3 4.0251 3 4.8501 3 6.5C3 8.1499 3 8.9749 3.5126 9.4874ZM3.5126 20.4874C4.0251 21 4.8501 21 6.5 21C8.1499 21 8.9749 21 9.4874 20.4874C10 19.9749 10 19.1499 10 17.5C10 15.8501 10 15.0251 9.4874 14.5126C8.9749 14 8.1499 14 6.5 14C4.8501 14 4.0251 14 3.5126 14.5126C3 15.0251 3 15.8501 3 17.5C3 19.1499 3 19.9749 3.5126 20.4874ZM15 4C17 4 19 4 21 4M15 15C17 15 19 15 21 15M15 9C17 9 19 9 21 9M15 20C17 20 19 20 21 20" />
                </svg>
              </button>

              <button
                type="button"
                aria-label="Canvas view"
                title="Canvas view"
                aria-pressed={viewMode === 'canvas'}
                onClick={() => onChangeViewMode('canvas')}
                className={`surface grid size-7 place-items-center rounded-full transition-[color] duration-150 ${
                  viewMode === 'canvas'
                    ? 'surface-primary text-white'
                    : 'text-ink-3 hover:text-ink'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="7" cy="7" r="3" />
                  <circle cx="17" cy="7" r="3" />
                  <circle cx="7" cy="17" r="3" />
                  <circle cx="17" cy="17" r="3" />
                </svg>
              </button>
            </div>

            {/* Conic-gradient Color Filter Pill (All colours) */}
            <div className="relative" ref={colorRef}>
              <button
                type="button"
                aria-haspopup="dialog"
                aria-expanded={colorMenuOpen}
                onClick={() => setColorMenuOpen((prev) => !prev)}
                className="group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap outline-none select-none transition-[color,opacity,transform] duration-150 active:scale-[0.98] surface surface-outline text-ink h-[32px] px-3.5 text-lead tap max-sm:h-7 max-sm:px-2.5 max-sm:text-small"
              >
                <span
                  aria-hidden="true"
                  className="size-3.5 shrink-0 rounded-full ring-1 ring-ink/15"
                  style={{ background: activeSwatch.hex }}
                />
                <span>{activeSwatch.label}</span>
                <svg className="size-4 shrink-0 text-ink-3 max-sm:size-3.5" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="4,6 8,10 12,6" />
                </svg>
              </button>

              {colorMenuOpen && (
                <div className="animate-popup-in absolute top-full right-0 z-50 mt-2 w-48 rounded-tray layer-float p-1.5">
                  {COLOR_SWATCHES.map((swatch) => (
                    <button
                      key={swatch.id}
                      type="button"
                      onClick={() => {
                        onSelectColorFilter(swatch.id);
                        setColorMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-1.5 text-body transition-colors ${
                        selectedColorFilter === swatch.id
                          ? 'bg-wash font-medium text-ink'
                          : 'text-ink-2 hover:bg-wash hover:text-ink'
                      }`}
                    >
                      <span
                        className="size-3.5 shrink-0 rounded-full ring-1 ring-ink/15"
                        style={{ background: swatch.hex }}
                      />
                      <span className="truncate">{swatch.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Recent / Animation Loop Dropdown Pill */}
            <div className="relative max-md:hidden" ref={actionRef}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={actionMenuOpen}
                onClick={() => setActionMenuOpen((prev) => !prev)}
                className="group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap outline-none select-none transition-[color,opacity,transform] duration-150 active:scale-[0.98] surface surface-outline text-ink tap h-7 px-2.5 text-small sm:h-8 sm:px-3.5 sm:text-lead"
              >
                <span>{activeActionLabel}</span>
                <svg className="size-4 shrink-0 text-ink-3" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="4,6 8,10 12,6" />
                </svg>
              </button>

              {actionMenuOpen && (
                <div className="animate-popup-in absolute top-full right-0 z-50 mt-2 w-52 rounded-tray layer-float p-1.5">
                  <div className="px-2.5 py-1 text-micro font-medium text-ink-3 uppercase tracking-wider">
                    Sort &amp; Live State
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectGlobalAction('auto');
                      setActionMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-[8px] px-2.5 py-1.5 text-body transition-colors ${
                      globalAction === 'auto'
                        ? 'bg-wash font-medium text-ink'
                        : 'text-ink-2 hover:bg-wash hover:text-ink'
                    }`}
                  >
                    <span>Recent (Auto Loop)</span>
                    {globalAction === 'auto' && <span className="size-1.5 rounded-full bg-brand" />}
                  </button>
                  <hr className="my-1 border-t border-line" />
                  <div className="max-h-56 overflow-y-auto scrollbar-none">
                    {ACTIONS.map((act) => (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => {
                          onSelectGlobalAction(act.id);
                          setActionMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-[8px] px-2.5 py-1.5 text-body transition-colors ${
                          globalAction === act.id
                            ? 'bg-wash font-medium text-ink'
                            : 'text-ink-2 hover:bg-wash hover:text-ink'
                        }`}
                      >
                        <span>Action: {act.label}</span>
                        <kbd className="font-mono text-micro text-ink-3">{act.shortcut}</kbd>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
