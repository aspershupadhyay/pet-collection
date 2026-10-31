/* Everything the site serves from /public goes through here, so the app works
   at a domain root and under a sub-path (GitHub Pages: /pet-collection/). */
export const BASE: string = import.meta.env.BASE_URL || '/';

/** "/sprites/cat/x.gif" → "<base>sprites/cat/x.gif". Leaves full URLs alone. */
export function asset(path: string): string {
  if (!path || /^(https?:|data:|blob:)/.test(path)) return path;
  if (BASE !== '/' && path.startsWith(BASE)) return path;
  return BASE + path.replace(/^\//, '');
}

/** Inverse of asset(): the canonical "/sprites/..." key used by sprite metadata. */
export function canonical(path: string): string {
  if (BASE !== '/' && path.startsWith(BASE)) return '/' + path.slice(BASE.length);
  return path;
}

/** Absolute URL for sharing / exports. */
export function absoluteUrl(path: string): string {
  return new URL(asset(path), window.location.origin).toString();
}
