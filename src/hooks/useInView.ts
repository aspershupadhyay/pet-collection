import { RefObject, useEffect, useState } from 'react';

/* One IntersectionObserver shared by every sprite on the page instead of one
   observer per card. Callbacks are keyed by element, so the cost of watching
   twenty tiles is a single observer and a Map lookup per entry. */
type Listener = (visible: boolean) => void;

const listeners = new Map<Element, Listener>();
let sharedObserver: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') return null;
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          listeners.get(entry.target)?.(entry.isIntersecting);
        }
      },
      { rootMargin: '360px 0px', threshold: 0 }
    );
  }
  return sharedObserver;
}

export function useInView<T extends Element>(ref: RefObject<T>, enabled = true): boolean {
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!enabled || !node) return;
    const io = getObserver();
    if (!io) return;
    listeners.set(node, setInView);
    io.observe(node);
    return () => {
      listeners.delete(node);
      io.unobserve(node);
    };
  }, [ref, enabled]);

  return inView;
}
