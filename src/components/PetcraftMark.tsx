import React from 'react';

/* PetcraftMark — original brand mark: a little terminal window that grew cat
   ears and feet. The screen is the face; two pixel eyes blink on a slow loop
   and the prompt cursor (its mouth) ticks like a real shell. On hover of any
   `.group/brand` ancestor the ears twitch.

   Drawn on a 16×14 pixel grid with crisp edges so it stays sharp at any size.

   Legend:  # = shell frame   s = screen   e = eye   c = cursor   . = empty */
const GRID = [
  '.##..........##.',
  '.###........###.',
  '.####......####.',
  '################',
  '#ssssssssssssss#',
  '#ssssssssssssss#',
  '#sseesssssseess#',
  '#sseesssssseess#',
  '#ssssssssssssss#',
  '#sssssccccsssss#',
  '#ssssssssssssss#',
  '################',
  '.##############.',
  '..##........##..',
];

type Run = { x: number; y: number; w: number };

function runsFor(chars: string[]): Run[] {
  const runs: Run[] = [];
  GRID.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (chars.includes(row[x])) {
        const start = x;
        while (x < row.length && chars.includes(row[x])) x += 1;
        runs.push({ x: start, y, w: x - start });
      } else {
        x += 1;
      }
    }
  });
  return runs;
}

/* Ears are rows 0-2; split so they can twitch independently of the body. */
const FRAME_RUNS = runsFor(['#']);
const EAR_RUNS = FRAME_RUNS.filter((r) => r.y <= 2);
const BODY_RUNS = FRAME_RUNS.filter((r) => r.y > 2);
const SCREEN_RUNS = runsFor(['s', 'e', 'c']);
const EYE_RUNS = runsFor(['e']);
const CURSOR_RUNS = runsFor(['c']);

export const PetcraftMark: React.FC<{ size?: number; className?: string; animated?: boolean }> = ({
  size = 32,
  className = '',
  animated = true,
}) => {
  const id = React.useId().replace(/:/g, '');
  return (
    <svg
      aria-hidden="true"
      viewBox="-1 -1 18 16"
      width={size}
      height={Math.round((size * 16) / 18)}
      shapeRendering="crispEdges"
      className={`pc-mark shrink-0 overflow-visible ${animated ? 'pc-mark--live' : ''} ${className}`}
    >
      <defs>
        <linearGradient id={`pc-screen-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3d8bff" />
          <stop offset="100%" stopColor="#7a5cff" />
        </linearGradient>
      </defs>

      <g className="pc-mark-ears" fill="var(--ink)">
        {EAR_RUNS.map((r) => (
          <rect key={`ear-${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} />
        ))}
      </g>
      <g fill="var(--ink)">
        {BODY_RUNS.map((r) => (
          <rect key={`b-${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} />
        ))}
      </g>
      <g fill={`url(#pc-screen-${id})`}>
        {SCREEN_RUNS.map((r) => (
          <rect key={`s-${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} />
        ))}
      </g>
      {/* Screen scanline highlight */}
      <rect x={1} y={4} width={14} height={1} fill="#ffffff" fillOpacity={0.18} />
      <g className="pc-mark-eyes" fill="#ffffff">
        {EYE_RUNS.map((r) => (
          <rect key={`e-${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} />
        ))}
      </g>
      <g className="pc-mark-cursor" fill="#ffffff">
        {CURSOR_RUNS.map((r) => (
          <rect key={`c-${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} />
        ))}
      </g>
    </svg>
  );
};

/* Wordmark lockup used in the sidebar, mobile hero and info sheet. */
export const PetcraftLogo: React.FC<{ size?: number; textClassName?: string }> = ({
  size = 30,
  textClassName = 'text-[17px]',
}) => (
  <span className="inline-flex items-center gap-2.5">
    <PetcraftMark size={size} />
    <span className={`inline-flex items-baseline font-pixel leading-none tracking-[-0.01em] text-ink whitespace-nowrap ${textClassName}`}>
      petcraft
      <span className="pc-mark-blink ml-[1px] text-[#5b7cff]">_</span>
    </span>
  </span>
);
