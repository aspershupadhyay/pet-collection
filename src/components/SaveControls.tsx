import React, { useEffect, useRef, useState } from 'react';
import { Check, FolderPlus } from 'lucide-react';
import type { PetFolder } from '../types/pet';

interface SaveControlsProps {
  itemKey: string;
  name: string;
  isFavourite: boolean;
  onToggleFavourite: (key: string) => void;
  folders?: PetFolder[];
  onToggleInFolder?: (folderId: string, key: string) => void;
  /** 'card' hides until hover; 'rail' is always visible. */
  variant: 'card' | 'rail';
}

export const Star: React.FC<{ filled: boolean; size?: number }> = ({ filled, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3.2l2.6 5.3 5.8.85-4.2 4.1 1 5.8L12 16.5l-5.2 2.75 1-5.8-4.2-4.1 5.8-.85z" />
  </svg>
);

/* Star + save-to-folder, shared by every card and every detail rail. */
export const SaveControls: React.FC<SaveControlsProps> = ({
  itemKey,
  name,
  isFavourite,
  onToggleFavourite,
  folders = [],
  onToggleInFolder,
  variant,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const card = variant === 'card';
  const hidden = card ? '-translate-y-1 opacity-0 group-hover/tile:translate-y-0 group-hover/tile:opacity-100 group-focus-within/tile:opacity-100' : '';
  const base = card
    ? 'tap grid size-7 place-items-center rounded-full bg-page/85 shadow-[inset_0_0_0_1px_var(--line)] backdrop-blur-sm transition-[opacity,transform,color] duration-200 active:scale-90'
    : 'tap grid size-8 place-items-center rounded-full hover:bg-wash';

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {folders.length > 0 && onToggleInFolder && (
        <div ref={ref} className={`relative ${card ? 'max-sm:hidden' : ''}`}>
          <button
            type="button"
            aria-label="Save to folder"
            aria-expanded={open}
            title="Save to folder"
            onClick={() => setOpen((v) => !v)}
            className={`${base} text-ink-2 hover:text-ink ${open ? '' : hidden}`}
          >
            <FolderPlus className={card ? 'size-3.5' : 'size-4'} />
          </button>
          {open && (
            <div className="animate-popup-in absolute top-full right-0 z-40 mt-1.5 w-44 rounded-tray layer-float p-1">
              <div className="px-2 py-1 text-micro font-medium text-ink-3">Save to folder</div>
              {folders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onToggleInFolder(f.id, itemKey)}
                  className="flex w-full items-center justify-between rounded-[7px] px-2 py-1.5 text-small text-ink hover:bg-wash"
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: f.color }} />
                    <span className="truncate">{f.name}</span>
                  </span>
                  {f.petIds.includes(itemKey) && <Check className="size-3.5 shrink-0 text-brand" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <button
        type="button"
        aria-pressed={isFavourite}
        aria-label={isFavourite ? `Remove ${name} from favourites` : `Add ${name} to favourites`}
        onClick={() => onToggleFavourite(itemKey)}
        className={`${base} ${
          isFavourite ? 'text-[#f5b400] opacity-100' : `text-ink-2 hover:text-ink ${hidden} ${card ? 'max-sm:translate-y-0 max-sm:opacity-100' : ''}`
        }`}
      >
        <Star filled={isFavourite} size={card ? 14 : 16} />
      </button>
    </div>
  );
};
