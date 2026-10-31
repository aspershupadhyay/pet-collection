import React, { useEffect, useMemo, useState } from 'react';
import type { CursorRole, CursorSet, SpritePack, TerminalTheme } from '../../types/item';
import type { PetDefinition } from '../../types/pet';
import { cursorSvg, svgDataUri, CURSOR_ROLES, cursorCssValue } from '../../utils/cursorArt';
import { petById, themeById, cursorById } from '../../data/catalog';
import { PixelSprite, petBox } from '../PixelSprite';
import { petHash } from '../../data/showreel';

/* ───────────────────────── Terminal ───────────────────────── */

type Seg = [string, number | 'fg' | 'dim'];
type Line = Seg[];

const prompt = (cmd: string): Line => [['~/petcraft ', 4], ['❯ ', 5], [cmd, 'fg']];

const SESSIONS: Line[][] = [
  [
    prompt('cargo build'),
    [['   Compiling ', 2], ['ferris v0.3.1', 'fg']],
    [['warning', 3], [': unused variable `bug`', 'fg']],
    [['error[E0382]', 1], [': borrow of moved value', 'fg']],
    [['    Finished ', 2], ['dev in 2.41s', 'dim']],
  ],
  [
    prompt('npm test'),
    [[' PASS ', 2], [' src/pets.test.ts', 'fg']],
    [[' PASS ', 2], [' src/cursor.test.ts', 'fg']],
    [[' FAIL ', 1], [' src/duck.test.ts', 'fg']],
    [['Tests: ', 'dim'], ['1 failed', 1], [', ', 'dim'], ['41 passed', 2]],
  ],
  [
    prompt('git status'),
    [['On branch ', 'fg'], ['main', 6]],
    [['  modified: ', 3], ['src/App.tsx', 'fg']],
    [['  new file: ', 2], ['src/themes.ts', 'fg']],
    [['  deleted:  ', 1], ['legacy.css', 'fg']],
  ],
];

interface TerminalPreviewProps {
  theme: TerminalTheme;
  size: 'card' | 'stage';
  /** Types the session out line by line, on a loop. */
  animate?: boolean;
  /** Optional character sitting on the window; none by default. */
  pet?: PetDefinition | null;
  className?: string;
}

export const TerminalPreview: React.FC<TerminalPreviewProps> = ({ theme, size, animate = false, pet = null, className = '' }) => {
  const c = theme.colors;
  const session = SESSIONS[petHash(theme.id) % SESSIONS.length];
  const [shown, setShown] = useState(animate ? 1 : session.length);

  useEffect(() => {
    if (!animate) {
      setShown(session.length);
      return;
    }
    setShown(1);
    const t = setInterval(() => setShown((n) => (n >= session.length + 3 ? 1 : n + 1)), 650);
    return () => clearInterval(t);
  }, [animate, session.length, theme.id]);

  const colour = (k: Seg[1]) => (k === 'fg' ? c.foreground : k === 'dim' ? c.ansi[8] : c.ansi[k]);
  const stage = size === 'stage';

  return (
    <div className={`relative ${className}`}>
      {pet && (
        <img
          src={pet.sprites.idle}
          alt=""
          className="pixelated pointer-events-none absolute right-[8%] bottom-full z-10 -mb-[3px] object-contain"
          style={{ height: stage ? 72 : 40 }}
          loading="lazy"
        />
      )}
      <div
        className="overflow-hidden rounded-[10px] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.45),inset_0_0_0_1px_rgba(255,255,255,0.06)]"
        style={{ background: c.background, color: c.foreground }}
      >
        <div className="flex items-center gap-1.5 px-3" style={{ height: stage ? 30 : 20, background: `color-mix(in srgb, ${c.background} 82%, ${c.foreground})` }}>
          {[c.ansi[1], c.ansi[3], c.ansi[2]].map((dot) => (
            <span key={dot} className="rounded-full" style={{ background: dot, width: stage ? 10 : 7, height: stage ? 10 : 7 }} />
          ))}
          {stage && <span className="ml-2 font-mono text-[11px] opacity-50">petcraft — {theme.name.toLowerCase()}</span>}
        </div>
        <div className={`font-mono ${stage ? 'p-4 text-[13px] leading-[1.75]' : 'px-2.5 py-2 text-[9.5px] leading-[1.6]'}`}>
          {session.slice(0, Math.min(shown, session.length)).map((line, i) => (
            <div key={i} className="truncate whitespace-pre">
              {line.map(([text, k], j) => (
                <span key={j} style={{ color: colour(k) }}>
                  {text}
                </span>
              ))}
            </div>
          ))}
          {shown >= session.length && (
            <div className="whitespace-pre">
              <span style={{ color: c.ansi[4] }}>~/petcraft </span>
              <span style={{ color: c.ansi[5] }}>❯ </span>
              <span className="term-caret inline-block align-[-2px]" style={{ background: c.cursor, width: stage ? 8 : 5, height: stage ? 15 : 10 }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const Swatches: React.FC<{ theme: TerminalTheme }> = ({ theme }) => (
  <div className="grid grid-cols-8 gap-1">
    {theme.colors.ansi.map((hex, i) => (
      <span key={i} title={hex} className="aspect-square rounded-[5px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]" style={{ background: hex }} />
    ))}
  </div>
);

/* ───────────────────────── Cursors ───────────────────────── */

export const CursorGlyph: React.FC<{ set: CursorSet; role: CursorRole; px: number; className?: string }> = ({ set, role, px, className = '' }) => {
  const src = useMemo(() => svgDataUri(cursorSvg(set, role, 1)), [set, role]);
  return <img src={src} alt="" width={16 * px} height={16 * px} className={`pixelated ${className}`} draggable={false} />;
};

/** Inline cursor styles so hovering an element shows the set. */
export function cursorStyle(set: CursorSet): React.CSSProperties {
  return { cursor: cursorCssValue(set, 'default', 'auto') };
}

export const CursorPlayground: React.FC<{ set: CursorSet; theme?: TerminalTheme }> = ({ set, theme }) => {
  const [busy, setBusy] = useState(false);
  const zone = (role: CursorRole) => ({ cursor: cursorCssValue(set, role, role === 'default' ? 'auto' : role === 'pointer' ? 'pointer' : role) });
  return (
    <div
      className="absolute inset-0 grid place-items-center p-6 transition-colors duration-300"
      style={{ ...zone('default'), ...(theme ? { background: theme.colors.background, color: theme.colors.foreground } : {}) }}
    >
      <div className="w-full max-w-[26rem]">
        <div className="mx-auto flex w-fit items-end gap-5 pb-8">
          {CURSOR_ROLES.map(({ role, label }) => (
            <figure key={role} className="flex flex-col items-center gap-2">
              <CursorGlyph set={set} role={role} px={role === 'pointer' ? 5 : 4} />
              <figcaption className={`font-mono text-[11px] ${theme ? 'opacity-60' : 'text-ink-3'}`}>{label}</figcaption>
            </figure>
          ))}
        </div>
        <div className="rounded-[16px] bg-page/85 p-4 shadow-[inset_0_0_0_1px_var(--line)] backdrop-blur-sm">
          <p className="text-[12px] text-ink-3">Try it here</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <a href="#try" onClick={(e) => e.preventDefault()} style={zone('pointer')} className="text-[13px] font-medium text-brand underline underline-offset-2">
              Hover a link
            </a>
            <button type="button" style={zone('pointer')} className="surface surface-outline h-8 rounded-full px-3 text-[13px] text-ink">
              A button
            </button>
            <button
              type="button"
              aria-busy={busy}
              onClick={() => {
                setBusy(true);
                setTimeout(() => setBusy(false), 2400);
              }}
              style={zone(busy ? 'wait' : 'pointer')}
              className="surface surface-outline h-8 rounded-full px-3 text-[13px] text-ink"
            >
              {busy ? 'Working…' : 'Make it busy'}
            </button>
          </div>
          <input
            type="text"
            placeholder="Type something"
            style={zone('text')}
            className="mt-3 h-9 w-full rounded-[10px] bg-well px-3 text-[13px] text-ink outline-none ring-1 ring-line focus:ring-brand"
          />
        </div>
      </div>
    </div>
  );
};

/* ───────────────────────── Packs ───────────────────────── */

/* A pack's cast standing together. Pixel art only stays crisp at whole-pixel
   scales, so each character gets the whole-pixel scale closest to one shared
   on-screen height, and the row is sized from what they really measure. */
export const PackLineup: React.FC<{ pack: SpritePack; width: number; height: number; floor?: number }> = ({ pack, width, height, floor = 0.78 }) => {
  const layout = useMemo(() => {
    const pets = pack.petIds.map((id) => petById.get(id)).filter(Boolean) as NonNullable<ReturnType<typeof petById.get>>[];
    const boxes = pets.map((pet) => ({ pet, ...petBox(pet) }));
    const gap = width * 0.035;
    const avail = width * 0.86 - gap * (boxes.length - 1);
    // Shared height: as tall as the row allows, capped by the stage
    const aspect = boxes.reduce((sum, b) => sum + b.fitW / b.refH, 0);
    const target = Math.min(height * floor * 0.5, avail / Math.max(aspect, 0.01));
    const placed = boxes.map((b) => {
      const share = (avail * (b.fitW / b.refH)) / aspect; // fair width for this character
      const ideal = Math.min(target / b.refH, share / b.fitW);
      // Whole art pixels when we can; oversized painted sheets step down by halves
      let scale = Math.round(ideal * b.unit) / b.unit;
      if (scale * b.fitW > share * 1.12) scale = Math.floor(ideal * b.unit) / b.unit;
      if (scale <= 0) scale = [1 / 2, 1 / 3, 1 / 4, 1 / 6, 1 / 8].find((f) => f <= ideal) ?? 1 / 8;
      return { ...b, scale, w: Math.max(b.fitW * scale, 12) };
    });
    return { placed, gap };
  }, [pack.petIds, width, height, floor]);

  return (
    <div className="absolute inset-0 flex items-stretch justify-center" style={{ gap: layout.gap }}>
      {layout.placed.map(({ pet, scale, unit, w }) => (
        <div key={pet.id} className="relative h-full shrink-0" style={{ width: w }}>
          <PixelSprite pet={pet} action="idle" width={w} height={height} floor={floor} scale={{ scale, unit }} shadow />
        </div>
      ))}
    </div>
  );
};

export const PackExtras: React.FC<{ pack: SpritePack }> = ({ pack }) => {
  const theme = pack.themeId ? themeById.get(pack.themeId) : undefined;
  const cursor = pack.cursorId ? cursorById.get(pack.cursorId) : undefined;
  return (
    <div className="flex items-center gap-1.5">
      {theme && (
        <span className="flex h-5 overflow-hidden rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)]" title={`${theme.name} theme`}>
          {[theme.colors.background, theme.colors.ansi[1], theme.colors.ansi[2], theme.colors.ansi[3], theme.colors.ansi[4], theme.colors.ansi[5]].map((h, i) => (
            <span key={i} className="w-2.5" style={{ background: h }} />
          ))}
        </span>
      )}
      {cursor && (
        <span className="grid size-5 place-items-center rounded-full bg-page/80" title={`${cursor.name} cursor`}>
          <CursorGlyph set={cursor} role="pointer" px={1} />
        </span>
      )}
    </div>
  );
};

/* ───────────────────────── Any item, as a small icon ───────────────────────── */

export const ItemIcon: React.FC<{ item: import('../../types/item').CatalogItem; size?: number }> = ({ item, size = 26 }) => {
  if (item.kind === 'character') {
    return <img src={item.pet.sprites.idle} alt="" width={size} height={size} style={{ width: size, height: size }} className="pixelated shrink-0 object-contain" loading="lazy" />;
  }
  if (item.kind === 'cursor') return <CursorGlyph set={item.cursor} role="pointer" px={size / 18} />;
  if (item.kind === 'theme') {
    const a = item.theme.colors.ansi;
    return <span className="block shrink-0 rounded-full" style={{ width: size * 0.7, height: size * 0.7, background: `conic-gradient(${a.slice(1, 7).join(',')}, ${a[1]})` }} />;
  }
  return <span className="block shrink-0 rotate-45 rounded-[3px]" style={{ width: size * 0.45, height: size * 0.45, background: item.pack.accent }} />;
};
