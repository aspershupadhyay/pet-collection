import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/* BASE_PATH: where the site is served from ("/" or "/pet-collection/" on
   GitHub Pages). VITE_COLLECTION: which content file to build. */
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  const base = (env.BASE_PATH || '/').replace(/\/?$/, '/');
  const collection = env.VITE_COLLECTION || 'petcraft';
  const collectionFile = fileURLToPath(new URL(`./src/collections/${collection}.ts`, import.meta.url));
  if (!existsSync(collectionFile)) throw new Error(`Unknown collection "${collection}" (no src/collections/${collection}.ts)`);
  // Brand strings for the manifest, read straight from the content file
  const src = readFileSync(collectionFile, 'utf8');
  const pick = (key: string, fallback: string) => src.match(new RegExp(`${key}:\\s*'([^']+)'`))?.[1] ?? fallback;
  const name = pick('name', 'Petcraft');
  const description = pick('description', '');

  return {
  base,
  resolve: { alias: { '@collection': collectionFile } },
  plugins: [
    react(),
    {
      name: 'brand-html',
      transformIndexHtml: (html: string) =>
        html
          .replace(/%BRAND_NAME%/g, name)
          .replace(/%BRAND_TAGLINE%/g, pick('tagline', ''))
          .replace(/%BRAND_DESCRIPTION%/g, description.replace(/"/g, '&quot;')),
    },
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false, // registered from src/pwa/pwa.ts
      manifest: {
        name: `${name} — ${pick('tagline', '')}`.replace(/ — $/, ''),
        short_name: name,
        description,
        lang: 'en',
        id: `${base}?source=pwa`,
        start_url: base,
        scope: base,
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        orientation: 'any',
        theme_color: '#ffffff',
        background_color: '#0b0e14',
        categories: ['productivity', 'developer', 'entertainment'],
        icons: [
          {
            src: `${base}icons/icon-192.png`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: `${base}icons/icon-512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: `${base}icons/icon-192-maskable.png`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: `${base}icons/icon-512-maskable.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache ONLY the app shell — the 16MB sprite library is runtime-cached on demand
        // The plugin adds manifest.webmanifest and the manifest icons itself; listing
        // them again gave duplicate precache entries, which made Workbox throw on
        // start-up and left the offline cache empty.
        globPatterns: ['**/*.{js,css,html,json,woff2}'],
        globIgnores: ['**/sprites/**', '**/node_modules/**', '404.html'],
        navigateFallback: `${base}index.html`,
        additionalManifestEntries: [
          { url: `${base}icons/apple-touch-icon.png`, revision: null },
          { url: `${base}icons/icon.svg`, revision: null },
        ],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // Animated sprite library + app icons — cache on demand, never precache.
        runtimeCaching: [
          {
            urlPattern: /\/(sprites|icons)\//i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'petcraft-sprites-v1',
              expiration: {
                maxEntries: 800,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                purgeOnQuotaError: true,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'petcraft-fonts-v1',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-three': ['three'],
        },
      },
    },
  },
};
});
