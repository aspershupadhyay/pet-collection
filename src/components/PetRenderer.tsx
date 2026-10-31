import { asset } from '../utils/asset';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext';
import { PetAction, PetDefinition, PetHabitat } from '../types/pet';
import { soundEngine } from '../utils/audio';
import { useInView } from '../hooks/useInView';

interface PetRendererProps {
  pet: PetDefinition;
  action: PetAction;
  size?: number;
  interactive?: boolean;
  tilt?: boolean;
  bubbleClick?: boolean;
  onActionTrigger?: (action: PetAction) => void;
  className?: string;
  showShadow?: boolean;
  variantOverride?: string;
  habitatOverride?: PetHabitat;
  renderMode?: 'pixel' | 'ascii';
  /** Lightweight tile mode: no sprite filter, no ambient wash, no action badges. */
  lite?: boolean;
  /** Anchor the sprite to the bottom of its box so it can stand on a floor line. */
  align?: 'center' | 'bottom';
}

const ACTION_THOUGHTS: Record<PetAction, string[]> = {
  idle: [
    'watching your active git branch and waiting for the next prompt...',
    'monitoring file watcher events with zero memory overhead...',
  ],
  walk: [
    'patrolling the editor status bar for stray console.logs...',
    'pacing across your workspace dock while tests compile...',
  ],
  sleep: [
    'zZz... entering low-power idle sleep until keyboard activity resumes...',
    'curled up on your terminal tab dreaming of 0ms cold starts...',
  ],
  eat: [
    'munching on warm treats and garbage-collecting orphaned heap nodes...',
    'refueling stamina after a 40-file TypeScript refactor...',
  ],
  play: [
    'chasing the physics ball across the IDE viewport at 60fps!',
    'bouncing between split panes and catching thrown rubber balls!',
  ],
  dance: [
    'grooving to lo-fi synth beats while the production bundle builds ♪',
    'celebrating clean lint checks with an 8-bit victory dance ♫',
  ],
  code: [
    'pair-programming beside your cursor and reviewing AST diffs...',
    'streaming tokens and verifying type safety across modules...',
  ],
  celebrate: [
    'SHIP IT! All 142 unit tests passed with zero warnings! ★',
    'deployment succeeded! performing celebratory backflips!',
  ],
  alert: [
    'ALERT! Unhandled promise rejection detected in build pipeline!',
    'GUARD MODE: swiping away regressions before git push!',
  ],
  special: [
    'unleashing signature species move across the active window edge!',
    'maximum overdrive! climbing vertical IDE borders!',
  ],
  pet: [
    'purring happily ♥ affection level increased to 100%!',
    'leaning into your cursor pets ♥ morale boost activated!',
  ],
};

/* 1x1 transparent GIF — swapped in when the sprite scrolls far offscreen so the
   browser can drop the animated GIF decode entirely (big CPU/battery win). */
const BLANK_SPRITE =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/* GPU-composited CSS motion replaces the old per-card requestAnimationFrame
   loops — zero React re-renders, zero JS on the main thread. */
const MOTION_CLASS: Partial<Record<PetAction, string>> = {
  walk: 'pet-glide',
  dance: 'pet-groove',
  play: 'pet-chase',
  celebrate: 'pet-hop',
  special: 'pet-hop',
};

export { resolveSpritePath } from '../utils/sprites';
import { resolveSpritePath } from '../utils/sprites';

export const PetRenderer: React.FC<PetRendererProps> = React.memo(({
  pet,
  action,
  size = 250,
  interactive = true,
  tilt = false,
  bubbleClick = false,
  onActionTrigger,
  className = '',
  showShadow = true,
  variantOverride,
  habitatOverride,
  renderMode = 'pixel',
  lite = false,
  align = 'center',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const tiltRafRef = useRef<number>();
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [asciiFrame, setAsciiFrame] = useState(0);

  const activeVariant = variantOverride || pet.sprites.variant;

  /* Viewport gating via one shared observer: offscreen sprites swap to a 1px
     placeholder so the browser stops decoding their animated GIFs. */
  const inViewport = useInView(containerRef);

  /* ASCII frame ticker — only runs in ASCII mode and only while visible.
     (Previously it ticked every 420ms on every card, even in pixel mode.) */
  useEffect(() => {
    if (!inViewport || renderMode !== 'ascii') return;
    const interval = setInterval(() => setAsciiFrame((f) => (f + 1) % 3), 420);
    return () => clearInterval(interval);
  }, [inViewport, renderMode]);

  useEffect(() => () => {
    if (tiltRafRef.current) cancelAnimationFrame(tiltRafRef.current);
  }, []);

  /* Tilt writes straight to the DOM node — no React re-render per mouse frame. */
  const baseOffset = action === 'sleep' ? 6 : align === 'bottom' ? 0 : -2;
  const applyTilt = (rx: number, ry: number) => {
    const node = tiltRef.current;
    if (!node) return;
    node.style.transform = `translateY(${baseOffset}px)${
      rx || ry ? ` perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg)` : ''
    }`;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tilt || !containerRef.current) return;
    if (tiltRafRef.current) return; // throttle to one transform per frame
    const rect = containerRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    tiltRafRef.current = requestAnimationFrame(() => {
      tiltRafRef.current = undefined;
      applyTilt(-ny * 10, nx * 12);
    });
  };

  const handleMouseLeave = () => {
    if (tilt) applyTilt(0, 0);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!interactive) return;
    if (!bubbleClick) e.stopPropagation();
    soundEngine.play('purr', pet.soundPitch);
    const id = Date.now() + Math.random();
    setHearts((prev) => [
      ...prev.slice(-5),
      { id, x: (Math.random() - 0.5) * 64, y: -14 - Math.random() * 28 },
    ]);
    if (onActionTrigger) {
      onActionTrigger('pet');
    }
  };

  // Use @chenglou/pretext for zero-reflow multiline text measurement in ASCII mode
  const pretextLines = useMemo(() => {
    if (renderMode !== 'ascii') return [] as string[];
    const pool = ACTION_THOUGHTS[action] || ACTION_THOUGHTS.idle;
    const rawThought = `[${pet.name.toLowerCase()}@${action}]: ${pool[asciiFrame % pool.length]}`;
    try {
      const prepared = prepareWithSegments(rawThought, '11px "Geist Mono", monospace');
      const maxWidth = Math.max(170, Math.min(280, size - 36));
      const laidOut = layoutWithLines(prepared, maxWidth, 15);
      return laidOut.lines.map((l) => l.text);
    } catch {
      return [rawThought];
    }
  }, [pet.name, action, asciiFrame, size, renderMode]);

  const activeHabitat = habitatOverride ?? pet.habitat;
  const hasHabitatBg = activeHabitat !== 'none';
  const spriteDisplaySize = Math.round(size * 0.72);
  const spriteSrc = inViewport ? resolveSpritePath(pet, action, activeVariant) : BLANK_SPRITE;
  const motionClass = MOTION_CLASS[action] || '';
  const showBadges = !lite && inViewport;

  if (renderMode === 'ascii') {
    const lines = pet.claudeAscii.frames[asciiFrame] || pet.claudeAscii.frames[0];
    const actionGlyph =
      action === 'sleep'
        ? 'zZz'
        : action === 'code'
        ? '>_<'
        : action === 'celebrate'
        ? '★ ✦ ★'
        : action === 'alert'
        ? '!! ALERT !!'
        : action === 'eat'
        ? '🍙 nom'
        : action === 'dance'
        ? '♪ ♫ ♪'
        : action === 'play'
        ? '● ~'
        : '● live';

    return (
      <div
        ref={containerRef}
        onClick={handleClick}
        className={`relative flex flex-col items-center justify-center select-none font-mono p-3 ${
          interactive ? 'cursor-pointer' : ''
        } ${className}`}
        style={{ width: '100%', height: size }}
      >
        <div className="w-full max-w-[21rem] rounded-2xl border border-white/12 bg-[#0D0D0F]/95 px-4 py-3 text-[#FAFAFA] shadow-[0_14px_34px_rgba(0,0,0,0.65)] backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-1.5 text-[10px] text-[#8B8B92]">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#FF5F56]" />
              <span className="size-2 rounded-full bg-[#FFBD2E]" />
              <span className="size-2 rounded-full bg-[#27C93F]" />
              <span className="ml-1 font-mono text-[#A8A8AD]">claude /buddy</span>
            </div>
            <span className="rounded bg-white/8 px-1.5 py-0.5 text-[10px] text-[#4D94FF]">
              {actionGlyph}
            </span>
          </div>

          <div className="my-2 flex items-center justify-center py-1">
            <pre className="text-[14px] sm:text-[15px] leading-[1.2] font-mono text-[#FAFAFA] whitespace-pre">
              <span className="text-[#FACC15] font-semibold">{pet.claudeAscii.hat}</span>
              {'\n'}
              {lines.join('\n')}
            </pre>
          </div>

          <div className="mt-2 rounded-lg bg-white/[0.04] px-2.5 py-1.5 border border-white/8">
            {pretextLines.map((lineText, idx) => (
              <div
                key={idx}
                className="font-mono text-[10.5px] leading-[15px] text-[#A8A8AD] truncate"
              >
                {lineText}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={`relative flex justify-center select-none ${
        align === 'bottom' ? 'items-end' : 'items-center overflow-hidden'
      } ${interactive ? 'cursor-pointer' : ''} ${className}`}
      style={{ width: '100%', height: size }}
    >
      {/* Pixel Habitat Diorama Background (lazy-decoded, parallax-free) */}
      {hasHabitatBg ? (
        <>
          <img
            src={inViewport ? asset(`/sprites/backgrounds/${activeHabitat}/background-dark-medium.png`) : BLANK_SPRITE}
            alt=""
            loading="lazy"
            decoding="async"
            className="pointer-events-none absolute inset-0 size-full object-cover opacity-55 pixelated"
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_22%,rgba(0,0,0,0.5)_100%)]" />
        </>
      ) : (
        !lite && align !== 'bottom' && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(circle at 50% 45%, ${pet.primaryColor}20 0%, transparent 62%)`,
            }}
          />
        )
      )}

      {/* Ground Contact Shadow (static, GPU-painted — no per-frame JS) */}
      {showShadow && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute rounded-full ${align === 'bottom' ? '-bottom-1' : 'bottom-[16%]'}`}
          style={{
            width: Math.round(spriteDisplaySize * 0.56),
            height: Math.round(spriteDisplaySize * 0.12),
            background:
              'radial-gradient(ellipse at center, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.14) 55%, transparent 72%)',
          }}
        />
      )}

      {/* Hero Sprite — single image layer, CSS-only motion */}
      <div className={`relative z-10 flex justify-center ${align === 'bottom' ? 'items-end' : 'items-center'} ${motionClass}`}>
        <div
          ref={tiltRef}
          className="flex items-end justify-center"
          style={{
            width: spriteDisplaySize,
            height: spriteDisplaySize,
            transform: `translateY(${baseOffset}px)`,
            transition: tilt ? 'transform 120ms ease-out' : undefined,
          }}
        >
          <img
            src={spriteSrc}
            alt={`${pet.name} (${pet.species}) - ${action}`}
            width={spriteDisplaySize}
            height={spriteDisplaySize}
            loading="eager"
            decoding="async"
            draggable={false}
            className={`relative z-10 size-full select-none object-contain pixelated ${
              align === 'bottom' ? 'object-bottom' : ''
            } ${lite ? '' : 'pet-stage-sprite'}`}
          />
        </div>
      </div>

      {/* Contextual Action Badges — kept inside the stage bounds */}
      {showBadges && action === 'sleep' && (
        <div className="pointer-events-none absolute top-2 right-3 z-20 font-pixel text-[13px] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-bounce">
          <span>Zzz</span>
        </div>
      )}

      {showBadges && action === 'code' && (
        <div className="pointer-events-none absolute bottom-3 right-3 z-20 flex items-center gap-1.5 rounded-md bg-black/80 px-2 py-1 font-mono text-[10.5px] font-medium text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)]">
          <span className="inline-block size-1.5 rounded-full bg-[#10B981]" />
          <span>&gt;_ coding</span>
        </div>
      )}

      {showBadges && action === 'dance' && (
        <div className="pointer-events-none absolute top-2 left-3 z-20 font-pixel text-[14px] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-pulse">
          ♪ ♫
        </div>
      )}

      {showBadges && action === 'alert' && (
        <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 z-20 rounded-full bg-[#E40014] px-2.5 py-0.5 font-pixel text-[11px] font-bold text-white shadow-lg">
          ! ALERT
        </div>
      )}

      {showBadges && action === 'celebrate' && (
        <div className="pointer-events-none absolute top-2 inset-x-3 z-20 flex justify-between font-pixel text-[14px] text-[#FACC15] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          <span>✦</span>
          <span className="animate-bounce">★</span>
        </div>
      )}

      {inViewport &&
        hearts.map((h) => (
          <span
            key={h.id}
            className="pointer-events-none absolute z-20 font-pixel text-[13px] text-[#FF6568] animate-heart-float"
            style={{
              left: `calc(50% + ${h.x}px)`,
              top: `calc(22% + ${h.y}px)`,
            }}
          >
            ♥
          </span>
        ))}
    </div>
  );
});
