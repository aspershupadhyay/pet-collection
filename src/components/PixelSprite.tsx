import React, { useMemo, useRef } from 'react';
import { PetAction, PetDefinition } from '../types/pet';
import { resolveSpritePath } from '../utils/sprites';
import { getShowreel } from '../data/showreel';
import { useInView } from '../hooks/useInView';
import { spriteMetaFor } from '../data/meta';
import { SpriteCanvas } from './SpriteCanvas';

/* [width, height, unit, x0, y0, x1, y1] — see scripts/sprite-meta.mjs */
type Meta = [number, number, number, number, number, number, number];


interface PixelSpriteProps {
  pet: PetDefinition;
  action: PetAction;
  variant?: string;
  /** Box the pet stands in, in CSS px. */
  width: number;
  height: number;
  /** Floor line as a fraction of height. */
  floor?: number;
  /** How much of the box height the pet's typical pose should fill. */
  fill?: number;
  shadow?: boolean;
  className?: string;
  /** Fixed on-screen scale (from petBox), so a line-up shares one size. */
  scale?: { scale: number; unit: number };
}

/** Typical pose height of a pet, in GIF pixels. */
export function petRefHeight(pet: PetDefinition): number {
  const heights = getShowreel(pet)
    .map((m) => spriteMetaFor(resolveSpritePath(pet, m.action)))
    .filter((m): m is NonNullable<typeof m> => !!m)
    .map((m) => m[6] - m[4])
    .sort((a, b) => a - b);
  return heights[Math.floor(heights.length / 2)] ?? 64;
}

function metaFor(path: string, fallback: string): Meta | undefined {
  return (spriteMetaFor(path) ?? spriteMetaFor(fallback)) as Meta | undefined;
}

/** A pet's typical pose in art pixels: height, width and pixel unit. */
export function petBox(pet: PetDefinition): { refH: number; fitW: number; unit: number } {
  const metas = getShowreel(pet)
    .map((m) => spriteMetaFor(resolveSpritePath(pet, m.action)))
    .filter(Boolean) as Meta[];
  if (!metas.length) return { refH: 64, fitW: 64, unit: 1 };
  const units = new Map<number, number>();
  metas.forEach((m) => units.set(m[2], (units.get(m[2]) || 0) + 1));
  const unit = [...units.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
  const heights = metas.map((m) => m[6] - m[4]).sort((a, b) => a - b);
  const widths = metas.map((m) => m[5] - m[3]).sort((a, b) => a - b);
  return { refH: heights[Math.floor(heights.length / 2)], fitW: widths[Math.floor(widths.length / 2)], unit };
}

/* One scale per pet (not per clip), so it never changes size between moves.
   Scales are whole GIF pixels — or whole art pixels for pre-scaled sheets —
   which is what keeps every pixel square and the same size. */
export function petScale(pet: PetDefinition, boxW: number, boxH: number, fill: number): { scale: number; unit: number } {
  const metas = getShowreel(pet)
    .map((m) => spriteMetaFor(resolveSpritePath(pet, m.action)))
    .filter(Boolean) as Meta[];
  if (!metas.length) return { scale: 1, unit: 1 };

  const unitVotes = new Map<number, number>();
  metas.forEach((m) => unitVotes.set(m[2], (unitVotes.get(m[2]) || 0) + 1));
  const unit = [...unitVotes.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];

  const heights = metas.map((m) => m[6] - m[4]).sort((a, b) => a - b);
  const widths = metas.map((m) => m[5] - m[3]).sort((a, b) => a - b);
  const refH = heights[Math.floor(heights.length / 2)];
  // An occasional extra-wide clip (a big swipe) may crop; it shouldn't shrink every pose
  const fitW = widths[Math.min(widths.length - 1, Math.floor(widths.length * 0.75))];

  // Nearest whole-pixel scale to the target size, within hard limits
  const target = boxH * fill;
  let best = 0;
  let bestDiff = Infinity;
  for (let k = 1; k <= 96; k += 1) {
    const s = k / unit;
    if (refH * s > boxH * 0.7 || fitW * s > boxW * 0.94) break;
    const diff = Math.abs(refH * s - target);
    if (diff < bestDiff) {
      best = s;
      bestDiff = diff;
    }
  }
  // Very large sheets (painted, not pixel art) may need to shrink below 1:1
  if (!best) best = [1 / 2, 1 / 3, 1 / 4].find((s) => refH * s <= boxH * 0.7 && fitW * s <= boxW * 0.94) ?? 1 / 4;
  return { scale: best, unit };
}

export const PixelSprite: React.FC<PixelSpriteProps> = React.memo(
  ({ pet, action, variant = pet.sprites.variant, width, height, floor = 0.8, fill = 0.56, shadow = true, className = '', scale: fixed }) => {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref);

    const auto = useMemo(() => (fixed ? null : petScale(pet, width, height, fill)), [fixed, pet, width, height, fill]);
    const { scale, unit } = fixed ?? auto!;

    const src = resolveSpritePath(pet, action, variant);
    const meta = metaFor(src, resolveSpritePath(pet, action));
    const floorY = Math.round(height * floor);
    const cx = width / 2;

    let imgStyle: React.CSSProperties = { display: 'none' };
    let shadowW = 0;
    if (meta) {
      const [w, h, , x0, , x1, y1] = meta;
      imgStyle = {
        position: 'absolute',
        maxWidth: 'none', // Tailwind's img reset would squeeze wide sheets
        width: Math.round(w * scale),
        height: Math.round(h * scale),
        left: Math.round(cx - ((x0 + x1) / 2) * scale),
        top: Math.round(floorY - y1 * scale),
      };
      shadowW = Math.round((x1 - x0) * scale * 0.72);
    }
    const px = Math.max(2, Math.round(scale * unit)); // one art pixel on screen

    return (
      <div ref={ref} className={`pointer-events-none absolute inset-0 ${className}`}>
        {shadow && shadowW > 0 && (
          <svg
            aria-hidden="true"
            width={shadowW}
            height={px * 2}
            className="absolute text-black/25 dark:text-black/45"
            style={{ left: Math.round(cx - shadowW / 2), top: floorY - px }}
          >
            <rect x={px * 2} y={0} width={Math.max(0, shadowW - px * 4)} height={px * 2} fill="currentColor" />
            <rect x={0} y={px / 2} width={shadowW} height={px} fill="currentColor" />
          </svg>
        )}
        {inView && meta && (
          <SpriteCanvas src={src} width={imgStyle.width as number} height={imgStyle.height as number} style={imgStyle} active={inView} />
        )}
      </div>
    );
  }
);
