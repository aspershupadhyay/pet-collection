import React, { useEffect, useMemo, useState } from 'react';
import type { CatalogItem } from '../../types/item';
import { itemKey, KIND_LABEL } from '../../types/item';
import type { PetFolder } from '../../types/pet';
import { itemTone, petById, themeById, cursorById, characterItem } from '../../data/catalog';
import { DetailShell, RailHeading, RailRows, Tabs, CodeBlock, FooterButtons, useSize } from '../DetailShell';
import { CursorGlyph, CursorPlayground, cursorStyle, ItemIcon, PackLineup, Swatches, TerminalPreview } from './Previews';
import { CURSORS as CURSOR_LIST } from '../../data/cursors';
import { THEMES as THEME_LIST } from '../../data/themes';
import { THEME_TARGETS, ThemeTarget, themeSnippet } from '../../utils/themeExport';
import { cursorCss, cursorSvg, CURSOR_ROLES } from '../../utils/cursorArt';
import { generateToolSnippet } from '../../utils/toolExport';
import { detailPath, shareUrl } from '../../router';
import { BRAND } from '../../collection';

type NonCharacter = Exclude<CatalogItem, { kind: 'character' }>;

interface ItemDetailProps {
  item: NonCharacter;
  siblings: CatalogItem[];
  views: number | null;
  isFavourite: boolean;
  onToggleFavourite: (key: string) => void;
  folders: PetFolder[];
  onToggleInFolder: (folderId: string, key: string) => void;
  onSelect: (item: CatalogItem) => void;
  onClose: () => void;
  onCopied: (message: string, sub?: string) => void;
  /** Cursor set currently worn across the site. */
  wornCursor: string | null;
  onWearCursor: (id: string | null) => void;
}

/* A row of small chips: "none" first, then every option. */
const Picker: React.FC<{
  value: string | null;
  onChange: (id: string | null) => void;
  noneLabel: string;
  options: { id: string; label: string; icon: React.ReactNode }[];
}> = ({ value, onChange, noneLabel, options }) => (
  <div className="scrollbar-none -mx-1 mt-2 flex gap-1 overflow-x-auto px-1 pb-1">
    <button
      type="button"
      aria-pressed={value === null}
      onClick={() => onChange(null)}
      className={`h-9 shrink-0 rounded-full px-3 text-[12px] transition-colors ${value === null ? 'bg-ink text-page' : 'bg-well text-ink-2 hover:text-ink'}`}
    >
      {noneLabel}
    </button>
    {options.map((o) => (
      <button
        key={o.id}
        type="button"
        title={o.label}
        aria-label={o.label}
        aria-pressed={value === o.id}
        onClick={() => onChange(o.id)}
        className={`grid size-9 shrink-0 place-items-center rounded-full transition-[background-color,box-shadow] ${
          value === o.id ? 'bg-page shadow-[inset_0_0_0_1.5px_var(--ink)]' : 'bg-well hover:bg-wash'
        }`}
      >
        {o.icon}
      </button>
    ))}
  </div>
);

const download = (filename: string, text: string, type = 'text/plain') => {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const ItemDetail: React.FC<ItemDetailProps> = ({
  item,
  siblings,
  views,
  isFavourite,
  onToggleFavourite,
  folders,
  onToggleInFolder,
  onSelect,
  onClose,
  onCopied,
  wornCursor,
  onWearCursor,
}) => {
  const key = itemKey(item);
  const [stageRef, stage] = useSize<HTMLElement>();
  const [target, setTarget] = useState<ThemeTarget>('ghostty');
  const [copied, setCopied] = useState(false);
  // "Try it with": nothing by default, the visitor picks
  const [withPet, setWithPet] = useState<string | null>(null);
  const [withCursor, setWithCursor] = useState<string | null>(null);
  const [withTheme, setWithTheme] = useState<string | null>(null);

  useEffect(() => {
    setCopied(false);
    setWithPet(null);
    setWithCursor(null);
    setWithTheme(null);
  }, [key]);

  const same = siblings.filter((s) => s.kind === item.kind);
  const i = same.findIndex((s) => s.id === item.id);
  const prev = same.length > 1 ? same[(i - 1 + same.length) % same.length] : undefined;
  const next = same.length > 1 ? same[(i + 1) % same.length] : undefined;

  const flash = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  const copy = (text: string, msg: string, sub?: string) => {
    navigator.clipboard?.writeText(text);
    onCopied(msg, sub);
    flash();
  };
  const copyLink = () => {
    navigator.clipboard?.writeText(shareUrl(detailPath(item.kind, item.id)));
    onCopied(`Copied link to ${item.name}`);
  };

  const viewsRow: [string, React.ReactNode][] = views != null ? [['Views', views.toLocaleString()]] : [];

  let stageNode: React.ReactNode;
  let body: React.ReactNode;
  let primary: { label: string; run: () => void };
  let avatar: React.ReactNode;
  let caption: React.ReactNode = null;

  if (item.kind === 'theme') {
    const t = item.theme;
    const snippet = themeSnippet(t, target);
    const meta = THEME_TARGETS.find((x) => x.id === target)!;
    avatar = <span className="size-5 rounded-full" style={{ background: `conic-gradient(${t.colors.ansi.slice(1, 7).join(',')}, ${t.colors.ansi[1]})` }} />;
    stageNode = (
      <div
        className="absolute inset-0 grid place-items-center p-6 pt-24 lg:p-14 lg:pt-28"
        style={withCursor && cursorById.get(withCursor) ? cursorStyle(cursorById.get(withCursor)!) : undefined}
      >
        <TerminalPreview theme={t} size="stage" animate pet={withPet ? petById.get(withPet) : null} className="w-full max-w-[40rem]" />
      </div>
    );
    caption = `${t.mood === 'dark' ? 'Dark' : 'Light'} theme · 16 colours`;
    primary = { label: 'Copy config', run: () => copy(snippet, `Copied ${t.name} for ${meta.label}`, `Paste into ${meta.filename(t)}`) };
    body = (
      <>
        <p className="text-[14px] leading-[1.6] text-ink-2">{t.description}</p>
        <RailRows
          rows={[
            ['Mood', t.mood === 'dark' ? 'Dark' : 'Light'],
            ['Background', <code key="bg" className="font-mono text-[12px]">{t.colors.background}</code>],
            ['Cursor', <code key="c" className="font-mono text-[12px]">{t.colors.cursor}</code>],
            ['Made by', t.author],
            ...viewsRow,
          ]}
        />
        <RailHeading>Palette</RailHeading>
        <div className="mt-2">
          <Swatches theme={t} />
        </div>
        <RailHeading>Try it with a character</RailHeading>
        <Picker
          value={withPet}
          onChange={setWithPet}
          noneLabel="None"
          options={[...petById.values()].map((p) => ({ id: p.id, label: p.name, icon: <ItemIcon item={characterItem(p)} size={22} /> }))}
        />
        <RailHeading>Try it with a cursor</RailHeading>
        <Picker
          value={withCursor}
          onChange={setWithCursor}
          noneLabel="System"
          options={CURSOR_LIST.map((c) => ({ id: c.id, label: c.name, icon: <CursorGlyph set={c} role="pointer" px={1.25} /> }))}
        />
        <RailHeading>Install</RailHeading>
        <Tabs value={target} onChange={setTarget} options={THEME_TARGETS.map((x) => ({ id: x.id, label: x.label }))} />
        <CodeBlock filename={meta.filename(t)} code={snippet} />
      </>
    );
  } else if (item.kind === 'cursor') {
    const set = item.cursor;
    const css = cursorCss(set);
    const wearing = wornCursor === set.id;
    avatar = <CursorGlyph set={set} role="pointer" px={1.5} />;
    stageNode = <CursorPlayground set={set} theme={withTheme ? themeById.get(withTheme) : undefined} />;
    caption = 'Move around the stage to try every cursor';
    primary = { label: 'Copy CSS', run: () => copy(css, `Copied ${set.name} cursor CSS`, 'Paste into your global stylesheet') };
    const pet = set.petId ? petById.get(set.petId) : undefined;
    body = (
      <>
        <p className="text-[14px] leading-[1.6] text-ink-2">{set.description}</p>
        <button
          type="button"
          onClick={() => {
            onWearCursor(wearing ? null : set.id);
            onCopied(wearing ? 'Back to your system cursor' : `Wearing ${set.name}`, wearing ? undefined : `Across all of ${BRAND.name}, in this browser`);
          }}
          className={`mt-4 inline-flex h-9 w-full items-center justify-center rounded-full text-[13px] font-medium ${wearing ? 'surface surface-outline text-ink' : 'bg-ink text-page'}`}
        >
          {wearing ? 'Take it off' : `Wear it on ${BRAND.name}`}
        </button>
        <RailHeading>Try it on</RailHeading>
        <Picker
          value={withTheme}
          onChange={setWithTheme}
          noneLabel="This page"
          options={THEME_LIST.map((th) => ({
            id: th.id,
            label: th.name,
            icon: <span className="block size-4 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)]" style={{ background: th.colors.background }} />,
          }))}
        />
        <RailRows rows={[['Cursors', '4 · 32 px'], ['Format', 'SVG, CSS'], ['Drawn for', pet?.name ?? '—'], ['Made by', set.author], ...viewsRow]} />
        <RailHeading>Download</RailHeading>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {CURSOR_ROLES.map(({ role, label }) => (
            <button
              key={role}
              type="button"
              onClick={() => download(`${set.id}-${role}.svg`, cursorSvg(set, role), 'image/svg+xml')}
              className="flex flex-col items-center gap-1.5 rounded-[12px] bg-well py-3 text-[11px] text-ink-3 hover:bg-wash hover:text-ink"
            >
              <CursorGlyph set={set} role={role} px={2} />
              {label}
            </button>
          ))}
        </div>
        <RailHeading>CSS</RailHeading>
        <CodeBlock filename="cursors.css" badge="CSS" code={css.replace(/url\("data:[^"]+"\)/g, 'url("…svg")')} />
      </>
    );
  } else {
    const p = item.pack;
    const theme = p.themeId ? themeById.get(p.themeId) : undefined;
    const cursor = p.cursorId ? cursorById.get(p.cursorId) : undefined;
    const pets = p.petIds.map((id) => petById.get(id)).filter(Boolean) as NonNullable<ReturnType<typeof petById.get>>[];
    const manifest = JSON.stringify(
      {
        pack: p.id,
        name: p.name,
        characters: pets.map((pet) => JSON.parse(generateToolSnippet(pet, 'manifest', 'idle'))),
        theme: theme ? { id: theme.id, ghostty: themeSnippet(theme, 'ghostty') } : undefined,
        cursor: cursor ? { id: cursor.id, css: cursorCss(cursor) } : undefined,
      },
      null,
      2
    );
    avatar = <span className="size-4 rotate-45 rounded-[3px]" style={{ background: p.accent }} />;
    stageNode = stage.w > 0 && (
      <>
        <PackLineup pack={p} width={stage.w} height={stage.h * (theme ? 0.62 : 1)} floor={theme ? 0.86 : 0.72} />
        {theme && (
          <div className="absolute inset-x-[10%] bottom-[7%] h-[30%]">
            <TerminalPreview theme={theme} size="stage" className="h-full" />
          </div>
        )}
      </>
    );
    caption = `${pets.length} characters${theme ? ` · ${theme.name} theme` : ''}${cursor ? ` · ${cursor.name} cursor` : ''}`;
    primary = { label: 'Download pack', run: () => { download(`${p.id}.petcraft.json`, manifest, 'application/json'); onCopied(`Downloaded ${p.name}`, `${p.id}.petcraft.json`); } };
    const parts: CatalogItem[] = [
      ...pets.map(characterItem),
      ...(theme ? [{ kind: 'theme', id: theme.id, name: theme.name, theme } as CatalogItem] : []),
      ...(cursor ? [{ kind: 'cursor', id: cursor.id, name: cursor.name, cursor } as CatalogItem] : []),
    ];
    body = (
      <>
        <p className="text-[14px] leading-[1.6] text-ink-2">{p.description}</p>
        <RailRows rows={[['Characters', pets.length], ['Theme', theme?.name ?? '—'], ['Cursor', cursor?.name ?? '—'], ...viewsRow]} />
        <RailHeading>In this pack</RailHeading>
        <ul className="mt-2 flex flex-col gap-1">
          {parts.map((part) => (
            <li key={itemKey(part)}>
              <button type="button" onClick={() => onSelect(part)} className="flex w-full items-center gap-3 rounded-[10px] p-1.5 text-left hover:bg-wash">
                <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-[8px] bg-well">
                  <ItemIcon item={part} size={28} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-ink">{part.name}</span>
                  <span className="block truncate text-[12px] text-ink-3">{KIND_LABEL[part.kind].one}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </>
    );
  }

  const tone = itemTone(item);
  const label = useMemo(() => KIND_LABEL[item.kind].one, [item.kind]);

  return (
    <DetailShell
      label={label}
      title={item.name}
      subtitle={label}
      avatar={avatar}
      tone={tone}
      stageRef={stageRef}
      stage={stageNode}
      caption={caption && <span key={key} className="pc-caption inline-block">{caption}</span>}
      onPrev={prev && (() => onSelect(prev))}
      onNext={next && (() => onSelect(next))}
      onClose={onClose}
      saveKey={key}
      isFavourite={isFavourite}
      onToggleFavourite={onToggleFavourite}
      folders={folders}
      onToggleInFolder={onToggleInFolder}
      resetKey={key}
      footer={<FooterButtons onCopyLink={copyLink} primaryLabel={primary.label} onPrimary={primary.run} done={copied && primary.label.startsWith('Copy')} />}
    >
      {body}
    </DetailShell>
  );
};

export default ItemDetail;
