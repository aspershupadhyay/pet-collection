import { asset } from '../utils/asset';
import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { PetDefinition, PetFolder } from '../types/pet';
import { PixelSprite } from './PixelSprite';
import { getShowreel } from '../data/showreel';
import { EXPORT_TOOLS, ExportToolId, generateToolSnippet } from '../utils/toolExport';
import { RARITY_COLOR } from './PetCard';
import { DetailShell, RailHeading, Tabs, CodeBlock, FooterButtons, useSize } from './DetailShell';
import { detailPath, shareUrl } from '../router';
import { CatalogItem, itemKey, KIND_LABEL } from '../types/item';
import { CURSORS } from '../data/cursors';
import { THEMES } from '../data/themes';
import { PACKS } from '../data/packs';
import { CursorGlyph } from './items/Previews';

const Voxel3D = lazy(() => import('../three/Voxel3D'));

interface PetDetailProps {
  pet: PetDefinition;
  /** Neighbours in the current grid order, for ← / → browsing. */
  siblings: PetDefinition[];
  allPets: PetDefinition[];
  initialVariant?: string;
  isFavourite: boolean;
  onToggleFavourite: (id: string) => void;
  folders: PetFolder[];
  onTogglePetInFolder: (folderId: string, petId: string) => void;
  onSelect: (pet: PetDefinition) => void;
  onClose: () => void;
  onCopied: (message: string, sub?: string) => void;
  /** Open a cursor, theme or pack from "Goes well with". */
  onOpenItem: (item: CatalogItem) => void;
  views: number | null;
}

const MOMENT_MS = 3400;

const HABITAT_LABEL: Record<string, string> = {
  forest: 'Forest',
  castle: 'Castle',
  beach: 'Beach',
  winter: 'Snowfield',
  autumn: 'Autumn park',
  library: 'Library',
  none: '—',
};

/* Swatch colours for coat names, so coats read as colours, not words. */
const COAT_HEX: Record<string, string> = {
  akita: '#d9893f', red: '#c2452f', brown: '#7a4b2a', black: '#26262b', white: '#f2f2f2', gray: '#9a9aa2',
  orange: '#e7883a', lightbrown: '#b8865a', yellow: '#f4c430', green: '#4caf50', blue: '#3b82f6', purple: '#8b5cf6',
  pink: '#f19ac2', piedpearl: '#e8dcc0', whiteface: '#d9d9d9', magical: '#c9a7ff', warrior: '#8a6d4a',
  paint_beige: '#d8bf9a', socks_black: '#3a3a40', gray_jimothy: '#7d7d86',
};

const has3D = (() => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
})();

export const PetDetail: React.FC<PetDetailProps> = ({
  pet,
  siblings,
  allPets,
  initialVariant,
  isFavourite,
  onToggleFavourite,
  folders,
  onTogglePetInFolder,
  onSelect,
  onClose,
  onCopied,
  onOpenItem,
  views,
}) => {
  const reel = useMemo(() => getShowreel(pet), [pet]);
  const [variant, setVariant] = useState(initialVariant && pet.availableVariants.includes(initialVariant) ? initialVariant : pet.sprites.variant);
  const [mode, setMode] = useState<'3d' | '2d'>(has3D ? '3d' : '2d');
  const [moment, setMoment] = useState(0);
  const [tool, setTool] = useState<ExportToolId>('claude');
  const [copied, setCopied] = useState(false);
  const [stageRef, stageSize] = useSize<HTMLElement>();

  // Fresh state for each companion
  useEffect(() => {
    setVariant(initialVariant && pet.availableVariants.includes(initialVariant) ? initialVariant : pet.sprites.variant);
    setMoment(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pet.id]);

  // 2D mode runs the same showreel the cards do (3D drives its own clock)
  useEffect(() => {
    if (mode !== '2d') return;
    const t = setInterval(() => setMoment((m) => (m + 1) % reel.length), MOMENT_MS);
    return () => clearInterval(t);
  }, [mode, reel.length, pet.id]);

  const index = siblings.findIndex((p) => p.id === pet.id);
  const prev = siblings.length > 1 ? siblings[(index - 1 + siblings.length) % siblings.length] : undefined;
  const next = siblings.length > 1 ? siblings[(index + 1) % siblings.length] : undefined;

  const similar = useMemo(() => {
    const same = allPets.filter((p) => p.id !== pet.id && p.category === pet.category);
    const rest = allPets.filter((p) => p.id !== pet.id && p.category !== pet.category);
    return [...same, ...rest].slice(0, 6);
  }, [allPets, pet]);

  // Themes, cursors and packs drawn for (or including) this character
  const related = useMemo<CatalogItem[]>(
    () => [
      ...THEMES.filter((t) => t.petId === pet.id).map((theme) => ({ kind: 'theme' as const, id: theme.id, name: theme.name, theme })),
      ...CURSORS.filter((c) => c.petId === pet.id).map((cursor) => ({ kind: 'cursor' as const, id: cursor.id, name: cursor.name, cursor })),
      ...PACKS.filter((p) => p.petIds.includes(pet.id)).map((pack) => ({ kind: 'pack' as const, id: pack.id, name: pack.name, pack })),
    ],
    [pet.id]
  );

  const snippet = generateToolSnippet(pet, tool, reel[moment % reel.length].action, variant);
  const toolMeta = EXPORT_TOOLS.find((t) => t.id === tool)!;

  const copySnippet = () => {
    navigator.clipboard?.writeText(snippet);
    setCopied(true);
    onCopied(`Copied ${pet.name} for ${toolMeta.label}`, `Paste into ${toolMeta.filename}`);
    setTimeout(() => setCopied(false), 1600);
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(shareUrl(detailPath('character', pet.id)));
    onCopied(`Copied link to ${pet.name}`);
  };

  const handle = `@${pet.author.replace(/[^a-z0-9]/gi, '').toLowerCase()}`;

  const stageControls = (
    <div className="flex items-center gap-1 rounded-full bg-page/80 p-0.5 shadow-[inset_0_0_0_1px_var(--line)] backdrop-blur-sm">
      {(has3D ? (['3d', '2d'] as const) : (['2d'] as const)).map((m) => (
        <button
          key={m}
          type="button"
          aria-pressed={mode === m}
          onClick={() => setMode(m)}
          className={`h-7 rounded-full px-3 font-mono text-[11px] uppercase tracking-wider transition-colors ${
            mode === m ? 'bg-ink text-page' : 'text-ink-3 hover:text-ink'
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );

  return (
    <DetailShell
      label="Character"
      title={pet.name}
      subtitle={views != null ? `${handle} · ${views.toLocaleString()} views` : handle}
      avatar={<img src={asset(`/sprites/${pet.sprites.folder}/${variant}_idle_8fps.gif`)} alt="" className="pixelated size-7 object-contain" />}
      tone={pet.primaryColor}
      stageRef={stageRef}
      stageControls={stageControls}
      stage={
        mode === '3d' ? (
          <Suspense fallback={null}>
            <Voxel3D pet={pet} variant={variant} onMoment={setMoment} className="absolute inset-0" />
          </Suspense>
        ) : (
          stageSize.w > 0 && (
            <PixelSprite
              pet={pet}
              action={reel[moment % reel.length].action}
              variant={variant}
              width={stageSize.w}
              height={stageSize.h}
              floor={0.72}
              fill={0.42}
            />
          )
        )
      }
      caption={
        <span key={`${pet.id}-${moment}`} className="pc-caption inline-block">
          {String((moment % reel.length) + 1).padStart(2, '0')} / {String(reel.length).padStart(2, '0')} · {reel[moment % reel.length].caption}
        </span>
      }
      onPrev={prev && (() => onSelect(prev))}
      onNext={next && (() => onSelect(next))}
      onClose={onClose}
      saveKey={pet.id}
      isFavourite={isFavourite}
      onToggleFavourite={onToggleFavourite}
      folders={folders}
      onToggleInFolder={onTogglePetInFolder}
      resetKey={pet.id}
      footer={<FooterButtons onCopyLink={copyLink} primaryLabel="Copy config" onPrimary={copySnippet} done={copied} />}
    >
      <p className="text-[14px] leading-[1.6] text-ink-2">{pet.tagline}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-well px-2.5 py-1 text-[12px] text-ink-2">{pet.category}</span>
        <span className="rounded-full bg-well px-2.5 py-1 text-[12px]" style={{ color: RARITY_COLOR[pet.rarity] }}>
          {pet.rarity}
        </span>
      </div>

      <dl className="mt-5 divide-y divide-line border-y border-line text-[13px]">
        {[
          ['Species', pet.species],
          ['Works with', pet.toolOrigin],
          ['Habitat', HABITAT_LABEL[pet.habitat]],
          ['Favourite food', pet.favoriteFood],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-3 py-2.5">
            <dt className="text-ink-3">{k}</dt>
            <dd className="truncate text-right text-ink">{v}</dd>
          </div>
        ))}
        {pet.availableVariants.length > 1 && (
          <div className="flex items-center justify-between gap-3 py-2.5">
            <dt className="text-ink-3">Coat</dt>
            <dd className="flex items-center gap-1.5 pr-1">
              {pet.availableVariants.map((v) => (
                <button
                  key={v}
                  type="button"
                  title={v.replace(/_/g, ' ')}
                  aria-label={`${v.replace(/_/g, ' ')} coat`}
                  aria-pressed={variant === v}
                  onClick={() => setVariant(v)}
                  className={`size-4 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25)] transition-transform ${
                    variant === v ? 'scale-110 ring-[1.5px] ring-ink ring-offset-[1.5px] ring-offset-page' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: COAT_HEX[v] ?? '#999' }}
                />
              ))}
            </dd>
          </div>
        )}
      </dl>

      <RailHeading>What {pet.name} does</RailHeading>
      <ol className="mt-2 flex flex-col">
        {reel.map((m, i) => {
          const now = i === moment % reel.length;
          return (
            <li key={m.action} className={`flex items-center gap-3 py-1.5 text-[13px] transition-colors ${now ? 'text-ink' : 'text-ink-3'}`}>
              <span className="w-5 font-mono text-[11px] tabular-nums">{String(i + 1).padStart(2, '0')}</span>
              <span className="flex-1 truncate">{m.caption}</span>
              <span className={`size-1.5 rounded-full transition-opacity ${now ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundColor: pet.primaryColor }} />
            </li>
          );
        })}
      </ol>

      <RailHeading>Add to your tool</RailHeading>
      <Tabs value={tool} onChange={setTool} options={EXPORT_TOOLS.map((t) => ({ id: t.id, label: t.label.replace(/ \(.*\)$/, '') }))} />
      <CodeBlock filename={toolMeta.filename} badge={toolMeta.badge} code={snippet} />

      {related.length > 0 && (
        <>
          <RailHeading>Goes well with</RailHeading>
          <div className="mt-2 flex flex-col gap-1">
            {related.map((r) => (
              <button key={itemKey(r)} type="button" onClick={() => onOpenItem(r)} className="flex items-center gap-3 rounded-[10px] p-1.5 text-left hover:bg-wash">
                <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-[8px] bg-well">
                  {r.kind === 'cursor' ? (
                    <CursorGlyph set={r.cursor} role="pointer" px={1.5} />
                  ) : r.kind === 'theme' ? (
                    <span className="size-5 rounded-full" style={{ background: `conic-gradient(${r.theme.colors.ansi.slice(1, 7).join(',')}, ${r.theme.colors.ansi[1]})` }} />
                  ) : (
                    <span className="size-3 rotate-45 rounded-[2px]" style={{ background: r.kind === 'pack' ? r.pack.accent : '#999' }} />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-ink">{r.name}</span>
                  <span className="block truncate text-[12px] text-ink-3">{KIND_LABEL[r.kind].one}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <RailHeading>Similar characters</RailHeading>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {similar.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p)}
            className="group/sim relative aspect-[4/3] overflow-hidden rounded-[12px] text-left transition-transform active:scale-[0.98]"
            style={{ background: `color-mix(in srgb, ${p.primaryColor} 12%, var(--well))` }}
          >
            <PixelSprite pet={p} action="idle" width={150} height={112} floor={0.8} fill={0.5} shadow={false} />
            <span className="absolute bottom-1.5 left-2 text-[11px] text-ink-2 opacity-0 transition-opacity group-hover/sim:opacity-100">{p.name}</span>
          </button>
        ))}
      </div>
    </DetailShell>
  );
};

export default PetDetail;
