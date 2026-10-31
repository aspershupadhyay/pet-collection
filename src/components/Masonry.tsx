import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';

interface MasonryProps<T> {
  items: T[];
  getKey: (item: T) => string;
  /** Stage width ÷ height for an item at the given column width; lower is taller. */
  getRatio: (item: T, columnWidth: number) => number;
  /** Fixed height below the stage (caption plate), in px. */
  footerHeight?: number;
  gap?: number;
  renderItem: (item: T, ctx: { index: number; width: number; ratio: number }) => React.ReactNode;
}

function columnsFor(width: number): number {
  if (width < 900) return 2;
  if (width < 1500) return 3;
  return 4;
}

/* Order-preserving masonry: each item drops into the currently shortest
   column, so the grid reads left-to-right like a page (CSS columns read
   top-to-bottom, which scrambles "first" vs "latest"). Heights are known
   up-front from each item's ratio, so there is no measure-then-reflow jump. */
export function Masonry<T>({
  items,
  getKey,
  getRatio,
  footerHeight = 52,
  gap = 14,
  renderItem,
}: MasonryProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    setWidth(node.clientWidth);
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const cols = columnsFor(width);
  const colWidth = width ? (width - gap * (cols - 1)) / cols : 0;

  const columns = useMemo(() => {
    const buckets: { item: T; index: number; ratio: number }[][] = Array.from({ length: cols }, () => []);
    const heights = new Array(cols).fill(0);
    items.forEach((item, index) => {
      const ratio = getRatio(item, colWidth || 300);
      let target = 0;
      for (let c = 1; c < cols; c += 1) {
        // Small bias keeps near-ties flowing left-to-right
        if (heights[c] < heights[target] - 8) target = c;
      }
      buckets[target].push({ item, index, ratio });
      heights[target] += (colWidth || 300) / ratio + footerHeight + gap;
    });
    return buckets;
  }, [items, cols, colWidth, getRatio, footerHeight, gap]);

  return (
    <div ref={ref} className="flex items-start" style={{ gap }}>
      {width > 0 &&
        columns.map((col, c) => (
          <div key={c} className="flex min-w-0 flex-1 flex-col" style={{ gap }}>
            {col.map(({ item, index, ratio }) => (
              <React.Fragment key={getKey(item)}>
                {renderItem(item, { index, width: colWidth, ratio })}
              </React.Fragment>
            ))}
          </div>
        ))}
    </div>
  );
}
