import React, { useRef } from 'react';
import type { CatalogItem } from '../../types/item';
import { itemKey, KIND_LABEL } from '../../types/item';
import type { PetFolder } from '../../types/pet';
import { itemTone } from '../../data/catalog';
import { SaveControls } from '../SaveControls';
import { useInView } from '../../hooks/useInView';
import { CursorGlyph, cursorStyle, PackExtras, PackLineup, TerminalPreview } from './Previews';

type NonCharacter = Exclude<CatalogItem, { kind: 'character' }>;

interface ItemCardProps {
  item: NonCharacter;
  index: number;
  width: number;
  ratio: number;
  isFavourite: boolean;
  onToggleFavourite: (key: string) => void;
  folders: PetFolder[];
  onToggleInFolder: (folderId: string, key: string) => void;
  onOpen: (item: CatalogItem, stage: HTMLElement | null) => void;
}

export const ITEM_RATIO: Record<NonCharacter['kind'], number> = { cursor: 1.04, theme: 1.3, pack: 1.16 };

/* Cards for cursors, themes and packs. Same plate as character cards so the
   wall reads as one collection. */
export const ItemCard: React.FC<ItemCardProps> = ({ item, index, width, ratio, isFavourite, onToggleFavourite, folders, onToggleInFolder, onOpen }) => {
  const key = itemKey(item);
  const stageRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const inView = useInView(articleRef);
  const height = Math.round(width / ratio);
  const compact = width < 240;
  const tone = itemTone(item);

  const open = () => onOpen(item, stageRef.current);

  let stage: React.ReactNode = null;
  let caption = '';
  let meta = '';
  if (item.kind === 'cursor') {
    const set = item.cursor;
    caption = 'Hover to try it';
    meta = `${KIND_LABEL.cursor.one} · 4 cursors`;
    stage = (
      <div className="absolute inset-0 grid place-items-center">
        <div className="flex items-end gap-[6%]">
          <CursorGlyph set={set} role="default" px={compact ? 3 : 4} className="pc-float" />
          <CursorGlyph set={set} role="pointer" px={compact ? 4 : 5} className="pc-float [animation-delay:-1.2s]" />
        </div>
      </div>
    );
  } else if (item.kind === 'theme') {
    const t = item.theme;
    caption = `${t.mood === 'dark' ? 'Dark' : 'Light'} · 16 colours`;
    meta = `${KIND_LABEL.theme.one} · 6 terminals`;
    stage = (
      <div className={`absolute inset-x-[8%] ${compact ? 'top-[30%]' : 'top-[26%]'}`}>
        <TerminalPreview theme={t} size="card" animate={inView} />
      </div>
    );
  } else {
    const p = item.pack;
    caption = `${p.petIds.length} characters${p.themeId ? ' + theme' : ''}${p.cursorId ? ' + cursor' : ''}`;
    meta = `${KIND_LABEL.pack.one}`;
    stage = inView ? <PackLineup pack={p} width={width} height={height} floor={compact ? 0.68 : 0.78} /> : null;
  }

  return (
    <article
      ref={articleRef}
      className="pc-card group/tile relative cursor-pointer outline-none"
      style={{ '--i': index } as React.CSSProperties}
      tabIndex={0}
      role="button"
      aria-label={`${item.name}, ${KIND_LABEL[item.kind].one}`}
      onClick={open}
      onKeyDown={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
    >
      <div
        ref={stageRef}
        data-pet-stage={key}
        className="pc-stage relative overflow-hidden rounded-[18px] group-focus-visible/tile:ring-2 group-focus-visible/tile:ring-brand"
        style={{ height, '--tint': tone, ...(item.kind === 'cursor' ? cursorStyle(item.cursor) : {}) } as React.CSSProperties}
      >
        <div className="absolute top-3 left-3 z-20 rounded-full bg-page/75 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-3 backdrop-blur-sm">
          {item.kind === 'pack' ? 'Pack' : item.kind === 'theme' ? 'Theme' : 'Cursor'}
        </div>
        <div className="absolute top-2.5 right-2 z-30">
          <SaveControls
            itemKey={key}
            name={item.name}
            isFavourite={isFavourite}
            onToggleFavourite={onToggleFavourite}
            folders={folders}
            onToggleInFolder={onToggleInFolder}
            variant="card"
          />
        </div>
        {stage}
        <p className={`absolute z-20 truncate leading-none text-ink-2 ${item.kind === 'theme' && compact ? 'hidden' : ''} ${compact ? 'inset-x-2.5 bottom-2.5 text-[11px]' : 'inset-x-3 bottom-3 text-[12px]'}`}>
          {item.kind === 'pack' ? (
            <span className="flex items-center justify-between gap-2">
              <span className="truncate">{compact ? '' : caption}</span>
              <PackExtras pack={item.pack} />
            </span>
          ) : (
            caption
          )}
        </p>
      </div>

      <div className="flex items-start justify-between gap-2 px-1 pt-2.5 pb-1">
        <div className="min-w-0">
          <h3 className={`truncate font-display font-medium leading-tight text-ink ${compact ? 'text-[13.5px]' : 'text-[15px]'}`}>{item.name}</h3>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12px] text-ink-3">
            <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: tone }} />
            <span className="truncate">{meta}</span>
          </p>
        </div>
      </div>
    </article>
  );
};
