# Petcraft

A premium collection of animated pixel characters, cursor sets, terminal themes and sprite packs for the tools you code in, plus a community showcase.

**Live:** https://aspershupadhyay.github.io/pet-collection/

- **Characters**: 27 animated pixel characters. Each one loops through its own moves, turns 360° in 3D, and exports configs for Claude Code `/buddy`, VS Code Pets, Orca CLI, Cursor and React.
- **Cursors**: 8 pixel cursor sets (pointer, link, text, busy). You can try them on the card, wear one across the site, or export them as CSS or SVG.
- **Terminal themes**: 8 sixteen-colour schemes with configs for Ghostty, Kitty, Alacritty, WezTerm, Windows Terminal and VS Code.
- **Sprite packs**: characters bundled with a matching theme and cursor, downloadable as one file.
- **Showcase**: community submissions (images or screen recordings). Sign-in and review are handled by the optional backend.
- Installable PWA that works offline.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build                                # Petcraft at the domain root
BASE_PATH=/pet-collection/ npm run build     # served from a sub-path (GitHub Pages)
VITE_COLLECTION=folio npm run build          # a different collection on the same shell
```

## Deploy (GitHub Pages)

Every push to `main` (or the working branch) runs `.github/workflows/deploy.yml`. The workflow builds the site, adds `404.html` so deep links work, and publishes to the `gh-pages` branch.

One-time setup: **Settings → Pages → Build and deployment → Source: Deploy from a branch → `gh-pages` / root**.

`vercel.json` and `public/_redirects` cover Vercel and Netlify, so the same build can be hosted there too.

## Backend (optional): Supabase

The site works fully without a backend. In that case Showcase submissions, favourites and folders are kept in the visitor's browser.

To turn on accounts, public submissions with uploads, moderation and shared view counts:

1. Create a project at [supabase.com](https://supabase.com). The free tier is enough to start.
2. Open **SQL editor**, paste `supabase/schema.sql` and run it. This creates the tables, row-level-security policies, the view counter and the `previews` storage bucket.
3. Go to **Authentication → URL configuration** and add your site URL (for example `https://aspershupadhyay.github.io/pet-collection/`) as a redirect URL. For GitHub sign-in, also enable the GitHub provider.
4. In the GitHub repo, open **Settings → Secrets and variables → Actions** and add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The anon key is designed to be public; the RLS policies are what protect the data.
5. Push or re-run the workflow.

New submissions arrive with status `pending`. To publish one, set its `status` to `approved` in **Table editor → works**.

Supabase was chosen because a static GitHub Pages site needs a backend that the browser can call directly. Supabase provides Postgres, auth (magic link and GitHub), file storage for preview videos, and row-level security in one service. The client talks to it over `fetch`, with no SDK, so it adds no bundle weight. Its free tier includes 500 MB of database and 1 GB of storage.

## Launch another collection on this shell

Everything brand- and content-specific lives in one file in `src/collections/`:

```ts
// src/collections/mysite.ts
const config: CollectionConfig = {
  id: 'mysite',
  brand: { name, wordmark, tagline, intro, description, sponsorEmail, contactEmail },
  sections: ['showcase', 'themes', 'cursors'],   // sidebar order; the first is home
  kinds: ['theme', 'cursor'],                    // which content types it carries
  heroes: { showcase: { title, subtitle }, ... },
  featured: [{ key: 'theme:celestial', title, label, description }],
  sponsorPlacements: [...],
};
```

Build it with `VITE_COLLECTION=mysite`. The repo ships two collections:

- `petcraft`: the live site.
- `folio`: a design showcase built on the same shell.

## Project layout

```
src/
  collections/      brand + content config per site
  data/             characters, cursors, themes, packs, catalog lookups
  backend/          Supabase client (fetch) + local fallback
  components/       shell, cards, detail views, showcase
  three/            voxel 3D renderer
  utils/            asset paths, cursor pixel art, theme/tool exports
supabase/schema.sql database, policies, storage
```

## Original characters

Miso, Moku, Beep, Hoot, Ember, Puff, Glim and Chip are Petcraft originals. They are generated from code in `scripts/characters/`:

```bash
node scripts/characters/build.mjs --preview /tmp/cast.png   # GIFs for every coat and move, plus a preview sheet
node scripts/sprite-meta.mjs                                 # refresh sprite measurements
```

To add a character, write a `draw(g, pose)` function in `cast.mjs`. The engine handles the outline, shading, eyes and every move (idle, walk, run, sleep, swipe, ball, jump, special).

## Rendering

- **2D:** GIFs are decoded once, snapped back to their true pixel grid and drawn on a canvas at the screen's real resolution with smoothing off, so pixels stay sharp at any size.
- **3D:** every art pixel becomes a voxel column with a rounded, plush-like depth. The back of each character shows its body colour instead of a mirrored face.
