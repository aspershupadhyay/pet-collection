/* Backend for the community side of the site: sign-in, showcase submissions,
   preview uploads and view counts.

   With VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY set, everything goes to
   Supabase (Postgres + Auth + Storage) over its REST APIs; schema and
   policies are in supabase/schema.sql. Without them the site runs in
   "local" mode: submissions are kept in this browser, so the static GitHub
   Pages build is fully usable before a database exists. */

export type MediaType = 'image' | 'video' | 'item';

export interface Work {
  id: string;
  title: string;
  description: string;
  author_name: string;
  /** What it is: character, setup, theme, cursor, other. */
  category: string;
  media_type: MediaType;
  /** URL for image/video, item key for 'item' previews. */
  media_url: string;
  link: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user_id?: string | null;
  views?: number;
}

export interface NewWork {
  title: string;
  description: string;
  author_name: string;
  category: string;
  link: string;
  file?: File | null;
  media_url?: string;
}

export interface User {
  id: string;
  email: string;
}

export interface Backend {
  mode: 'supabase' | 'local';
  /** Whether view counts are shared across visitors. */
  sharedViews: boolean;
  getUser(): Promise<User | null>;
  signInWithEmail(email: string): Promise<void>;
  signInWithGitHub(): void;
  signOut(): Promise<void>;
  listWorks(): Promise<Work[]>;
  submitWork(work: NewWork): Promise<Work>;
  recordView(key: string): Promise<number | null>;
  getViews(keys: string[]): Promise<Record<string, number>>;
}

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

const SEED: Work[] = [
  {
    id: 'house-terminal-buddies',
    title: 'Terminal Buddies desk',
    description: 'Four characters, the Void theme and the Paw Print cursor. Our own daily setup.',
    author_name: 'Petcraft',
    category: 'Setup',
    media_type: 'item',
    media_url: 'pack:terminal-buddies',
    link: null,
    status: 'approved',
    created_at: '2026-10-28T10:00:00Z',
  },
  {
    id: 'house-celestial',
    title: 'Celestial night shift',
    description: 'Indigo terminal, lilac prompts and Celestia keeping watch.',
    author_name: 'Petcraft',
    category: 'Theme',
    media_type: 'item',
    media_url: 'theme:celestial',
    link: null,
    status: 'approved',
    created_at: '2026-10-27T10:00:00Z',
  },
  {
    id: 'house-ferris',
    title: 'Ferris in the reef',
    description: 'Rustacean theme with Ferris and Finley, ready for a long compile.',
    author_name: 'Petcraft',
    category: 'Setup',
    media_type: 'item',
    media_url: 'pack:rustacean-kit',
    link: null,
    status: 'approved',
    created_at: '2026-10-26T10:00:00Z',
  },
  {
    id: 'house-quack',
    title: 'Rubber-duck debugging, literally',
    description: 'The Quack cursor set on a light page. Point at the bug, explain it to the duck.',
    author_name: 'Petcraft',
    category: 'Cursor',
    media_type: 'item',
    media_url: 'cursor:quack',
    link: null,
    status: 'approved',
    created_at: '2026-10-25T10:00:00Z',
  },
];

/* ───────────────────────── local (this browser) ───────────────────────── */

const LOCAL_KEY = 'petcraft_works_v1';
const VIEWS_KEY = 'petcraft_views_v1';

const readJSON = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const writeJSON = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota or private mode — the in-memory state still works for this visit
  }
};

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

const mediaTypeOf = (file: File | null | undefined, url?: string): MediaType =>
  file?.type.startsWith('video/') || /\.(mp4|webm|mov)(\?|$)/i.test(url ?? '') ? 'video' : 'image';

function localBackend(): Backend {
  return {
    mode: 'local',
    sharedViews: false,
    // No accounts without a database: everything you add stays in this browser
    async getUser() {
      return { id: 'local', email: '' };
    },
    async signInWithEmail() {},
    signInWithGitHub() {},
    async signOut() {},
    async listWorks() {
      return [...readJSON<Work[]>(LOCAL_KEY, []), ...SEED];
    },
    async submitWork(input) {
      let media_url = input.media_url?.trim() ?? '';
      if (input.file) {
        // Without a backend, only small images fit in browser storage
        if (input.file.type.startsWith('video/') || input.file.size > 1.5 * 1024 * 1024) {
          throw new Error('Video and large uploads need the database connected. Paste a link to the file instead.');
        }
        media_url = await fileToDataUrl(input.file);
      }
      if (!media_url) throw new Error('Add an image, a video or a link to one.');
      const work: Work = {
        id: `local-${Date.now()}`,
        title: input.title,
        description: input.description,
        author_name: input.author_name,
        category: input.category,
        media_type: mediaTypeOf(input.file, media_url),
        media_url,
        link: input.link || null,
        status: 'approved', // nothing to moderate when it only lives in your browser
        created_at: new Date().toISOString(),
        user_id: 'local',
      };
      writeJSON(LOCAL_KEY, [work, ...readJSON<Work[]>(LOCAL_KEY, [])]);
      return work;
    },
    async recordView(key) {
      const views = readJSON<Record<string, number>>(VIEWS_KEY, {});
      views[key] = (views[key] ?? 0) + 1;
      writeJSON(VIEWS_KEY, views);
      return views[key];
    },
    async getViews(keys) {
      const views = readJSON<Record<string, number>>(VIEWS_KEY, {});
      return Object.fromEntries(keys.map((k) => [k, views[k] ?? 0]));
    },
  };
}

/* ─────────────────────────────── Supabase ─────────────────────────────── */

interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch seconds
  user: User;
}

const SESSION_KEY = 'petcraft_session_v1';

function supabaseBackend(url: string, anon: string): Backend {
  const base = url.replace(/\/+$/, '');
  let session: Session | null = readJSON<Session | null>(SESSION_KEY, null);
  const redirectTo = () => window.location.origin + window.location.pathname;

  const headers = (auth = true, extra: Record<string, string> = {}) => ({
    apikey: anon,
    Authorization: `Bearer ${auth && session ? session.access_token : anon}`,
    ...extra,
  });

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${base}${path}`, init);
    if (!res.ok) {
      let message = res.statusText;
      try {
        const body = await res.json();
        message = body.message || body.msg || body.error_description || body.error || message;
      } catch {
        // non-JSON error body
      }
      throw new Error(message);
    }
    const text = await res.text();
    return (text ? JSON.parse(text) : null) as T;
  }

  const saveSession = (s: Session | null) => {
    session = s;
    if (s) writeJSON(SESSION_KEY, s);
    else localStorage.removeItem(SESSION_KEY);
  };

  async function fetchUser(token: string): Promise<User> {
    const u = await request<{ id: string; email: string }>('/auth/v1/user', {
      headers: { apikey: anon, Authorization: `Bearer ${token}` },
    });
    return { id: u.id, email: u.email };
  }

  // Coming back from a magic link or OAuth: tokens arrive in the URL hash
  const ready = (async () => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const access = hash.get('access_token');
    const refresh = hash.get('refresh_token');
    if (access && refresh) {
      history.replaceState({}, '', window.location.pathname + window.location.search);
      try {
        const user = await fetchUser(access);
        saveSession({
          access_token: access,
          refresh_token: refresh,
          expires_at: Math.floor(Date.now() / 1000) + Number(hash.get('expires_in') ?? 3600),
          user,
        });
      } catch {
        saveSession(null);
      }
    }
  })();

  async function freshSession(): Promise<Session | null> {
    await ready;
    if (!session) return null;
    if (session.expires_at - 60 > Date.now() / 1000) return session;
    try {
      const s = await request<{ access_token: string; refresh_token: string; expires_in: number; user: User }>(
        '/auth/v1/token?grant_type=refresh_token',
        { method: 'POST', headers: headers(false, { 'Content-Type': 'application/json' }), body: JSON.stringify({ refresh_token: session.refresh_token }) }
      );
      saveSession({
        access_token: s.access_token,
        refresh_token: s.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + s.expires_in,
        user: { id: s.user.id, email: s.user.email },
      });
    } catch {
      saveSession(null);
    }
    return session;
  }

  return {
    mode: 'supabase',
    sharedViews: true,
    async getUser() {
      return (await freshSession())?.user ?? null;
    },
    async signInWithEmail(email) {
      await request(`/auth/v1/otp?redirect_to=${encodeURIComponent(redirectTo())}`, {
        method: 'POST',
        headers: headers(false, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ email, create_user: true }),
      });
    },
    signInWithGitHub() {
      window.location.href = `${base}/auth/v1/authorize?provider=github&redirect_to=${encodeURIComponent(redirectTo())}`;
    },
    async signOut() {
      const s = await freshSession();
      if (s) {
        await fetch(`${base}/auth/v1/logout`, { method: 'POST', headers: headers() }).catch(() => {});
      }
      saveSession(null);
    },
    async listWorks() {
      await freshSession();
      const rows = await request<Work[]>('/rest/v1/works?select=*&order=created_at.desc&limit=200', { headers: headers() });
      return [...rows, ...SEED];
    },
    async submitWork(input) {
      const s = await freshSession();
      if (!s) throw new Error('Sign in to submit.');
      let media_url = input.media_url?.trim() ?? '';
      if (input.file) {
        if (input.file.size > MAX_UPLOAD_BYTES) throw new Error('Uploads are limited to 25 MB.');
        const ext = (input.file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
        const path = `${s.user.id}/${crypto.randomUUID()}.${ext}`;
        await request(`/storage/v1/object/previews/${path}`, {
          method: 'POST',
          headers: headers(true, { 'Content-Type': input.file.type || 'application/octet-stream', 'x-upsert': 'false' }),
          body: input.file,
        });
        media_url = `${base}/storage/v1/object/public/previews/${path}`;
      }
      if (!media_url) throw new Error('Add an image, a video or a link to one.');
      const [row] = await request<Work[]>('/rest/v1/works', {
        method: 'POST',
        headers: headers(true, { 'Content-Type': 'application/json', Prefer: 'return=representation' }),
        body: JSON.stringify({
          title: input.title,
          description: input.description,
          author_name: input.author_name,
          category: input.category,
          media_type: mediaTypeOf(input.file, media_url),
          media_url,
          link: input.link || null,
        }),
      });
      return row;
    },
    async recordView(key) {
      try {
        return await request<number>('/rest/v1/rpc/record_view', {
          method: 'POST',
          headers: headers(false, { 'Content-Type': 'application/json' }),
          body: JSON.stringify({ item_key: key }),
        });
      } catch {
        return null;
      }
    },
    async getViews(keys) {
      if (!keys.length) return {};
      try {
        const list = keys.map((k) => `"${k.replace(/"/g, '')}"`).join(',');
        const rows = await request<{ item_key: string; count: number }[]>(
          `/rest/v1/item_views?select=item_key,count&item_key=in.(${encodeURIComponent(list)})`,
          { headers: headers(false) }
        );
        return Object.fromEntries(rows.map((r) => [r.item_key, r.count]));
      } catch {
        return {};
      }
    },
  };
}

const env = import.meta.env;
export const backend: Backend =
  env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY
    ? supabaseBackend(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
    : localBackend();

/** Count each item once per browser session, so refreshes don't inflate it. */
export function viewOnce(key: string): Promise<number | null> {
  const seenKey = `pc_seen_${key}`;
  try {
    if (sessionStorage.getItem(seenKey)) return Promise.resolve(null);
    sessionStorage.setItem(seenKey, '1');
  } catch {
    // no sessionStorage — just count it
  }
  return backend.recordView(key);
}
