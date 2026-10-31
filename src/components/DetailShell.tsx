import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { PetFolder } from '../types/pet';
import { SaveControls } from './SaveControls';

export function useSize<T extends HTMLElement>() {
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

interface DetailShellProps {
  label: string;
  title: string;
  subtitle: string;
  avatar: React.ReactNode;
  /** Stage background colour. */
  tone: string;
  stageRef?: React.Ref<HTMLElement>;
  /** Controls pinned top-left of the stage (e.g. 3D / 2D). */
  stageControls?: React.ReactNode;
  stage: React.ReactNode;
  /** Caption pinned bottom-left of the stage. */
  caption?: React.ReactNode;
  onPrev?: () => void;
  onNext?: () => void;
  onClose: () => void;
  /** Favourites + folders, keyed by item key. */
  saveKey?: string;
  isFavourite?: boolean;
  onToggleFavourite?: (key: string) => void;
  folders?: PetFolder[];
  onToggleInFolder?: (folderId: string, key: string) => void;
  /** Resets rail scroll when it changes. */
  resetKey: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

const ctrl =
  'tap grid size-8 place-items-center rounded-full bg-page/80 text-ink-2 shadow-[inset_0_0_0_1px_var(--line)] backdrop-blur-sm hover:text-ink';

/* The open view for anything in the collection: a big stage and a rail that
   lines up with the sidebar, over the softly blurred grid. */
export const DetailShell: React.FC<DetailShellProps> = ({
  label,
  title,
  subtitle,
  avatar,
  tone,
  stageRef,
  stageControls,
  stage,
  caption,
  onPrev,
  onNext,
  onClose,
  saveKey,
  isFavourite,
  onToggleFavourite,
  folders = [],
  onToggleInFolder,
  resetKey,
  children,
  footer,
}) => {
  const railScrollRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    railScrollRef.current?.scrollTo({ top: 0 });
  }, [resetKey]);

  // Keyboard: Esc closes, arrows browse. Page scroll is locked while open.
  const keys = useRef({ onClose, onPrev, onNext });
  keys.current = { onClose, onPrev, onNext };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, textarea, select')) return;
      if (e.key === 'Escape') keys.current.onClose();
      if (e.key === 'ArrowRight') keys.current.onNext?.();
      if (e.key === 'ArrowLeft') keys.current.onPrev?.();
    };
    window.addEventListener('keydown', onKey);
    const prevFocus = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus({ preventScroll: true });
    document.documentElement.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
      prevFocus?.focus?.({ preventScroll: true });
    };
  }, []);

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

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="pet-detail fixed inset-y-0 right-0 z-50 outline-none"
      style={{ left: railLeft }}
      role="dialog"
      aria-modal="true"
      aria-label={`${label}: ${title}`}
    >
      <div className="pd-scrim absolute inset-0 bg-page/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative flex h-full flex-col max-lg:bg-page lg:flex-row">
        <section
          ref={stageRef as React.Ref<HTMLElement>}
          className="pd-stage relative order-1 m-2 mb-0 h-[46dvh] shrink-0 overflow-hidden rounded-[22px] lg:order-2 lg:m-3 lg:ml-0 lg:h-auto lg:flex-1"
          style={{ background: `color-mix(in srgb, ${tone} 12%, var(--well))`, viewTransitionName: 'pet-stage' } as React.CSSProperties}
        >
          {stageControls && <div className="absolute top-3 left-3 z-20">{stageControls}</div>}
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1">
            {onPrev && (
              <button type="button" onClick={onPrev} aria-label="Previous" className={ctrl}>
                <ChevronLeft className="size-4" />
              </button>
            )}
            {onNext && (
              <button type="button" onClick={onNext} aria-label="Next" className={ctrl}>
                <ChevronRight className="size-4" />
              </button>
            )}
            <button type="button" onClick={onClose} aria-label="Close" className={`${ctrl} ml-1`}>
              <X className="size-4" />
            </button>
          </div>
          {stage}
          {caption && <p className="absolute bottom-4 left-4 z-20 font-mono text-[12px] text-ink-2">{caption}</p>}
        </section>

        <aside className="pd-rail relative order-2 flex min-h-0 flex-1 flex-col bg-page lg:order-1 lg:w-[22rem] lg:flex-none lg:border-r lg:border-dashed lg:border-line-strong">
          <header className="flex h-16 shrink-0 items-center gap-3 border-b border-dashed border-line-strong px-4">
            <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-well shadow-[inset_0_0_0_1px_var(--line)]">
              {avatar}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-display text-[16px] font-medium leading-tight text-ink">{title}</h2>
              <p className="truncate text-[12px] text-ink-3">{subtitle}</p>
            </div>
            {saveKey && onToggleFavourite && (
              <SaveControls
                itemKey={saveKey}
                name={title}
                isFavourite={!!isFavourite}
                onToggleFavourite={onToggleFavourite}
                folders={folders}
                onToggleInFolder={onToggleInFolder}
                variant="rail"
              />
            )}
          </header>

          <div ref={railScrollRef} className="scrollbar-none min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-6">
            {children}
          </div>

          <footer className="flex shrink-0 items-center gap-2 border-t border-dashed border-line-strong p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
            {footer}
          </footer>
        </aside>
      </div>
    </div>
  );
};

/* Small shared pieces for rails */
export const RailHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="mt-6 text-[12px] font-medium text-ink-3">{children}</h3>
);

export const RailRows: React.FC<{ rows: [string, React.ReactNode][] }> = ({ rows }) => (
  <dl className="mt-5 divide-y divide-line border-y border-line text-[13px]">
    {rows.map(([k, v]) => (
      <div key={k} className="flex items-center justify-between gap-3 py-2.5">
        <dt className="text-ink-3">{k}</dt>
        <dd className="truncate text-right text-ink">{v}</dd>
      </div>
    ))}
  </dl>
);

export const Tabs = <T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) => (
  <div className="scrollbar-none mt-2 flex gap-1 overflow-x-auto">
    {options.map((t) => (
      <button
        key={t.id}
        type="button"
        onClick={() => onChange(t.id)}
        className={`h-7 shrink-0 rounded-full px-2.5 text-[12px] transition-colors ${value === t.id ? 'bg-ink text-page' : 'bg-well text-ink-2 hover:text-ink'}`}
      >
        {t.label}
      </button>
    ))}
  </div>
);

export const CodeBlock: React.FC<{ filename: string; badge?: string; code: string }> = ({ filename, badge, code }) => (
  <div className="mt-2 overflow-hidden rounded-[12px] bg-well shadow-[inset_0_0_0_1px_var(--line)]">
    <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-1.5 font-mono text-[11px] text-ink-3">
      <span className="truncate">{filename}</span>
      {badge && <span className="shrink-0">{badge}</span>}
    </div>
    <pre className="scrollbar-none max-h-44 overflow-auto p-3 font-mono text-[11px] leading-[1.6] text-ink-2">{code}</pre>
  </div>
);

export const FooterButtons: React.FC<{ onCopyLink: () => void; primaryLabel: string; onPrimary: () => void; done?: boolean }> = ({
  onCopyLink,
  primaryLabel,
  onPrimary,
  done,
}) => (
  <>
    <button type="button" onClick={onCopyLink} className="tap inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full text-[13px] font-medium text-ink-2 hover:bg-wash hover:text-ink">
      Copy link
    </button>
    <button type="button" onClick={onPrimary} className="surface surface-primary inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full text-[13px] font-medium text-white">
      {done ? 'Copied' : primaryLabel}
    </button>
  </>
);
