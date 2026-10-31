import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false, // registered from src/pwa/pwa.ts
      manifest: {
        name: 'PetCraft — Interactive AI Companions',
        short_name: 'PetCraft',
        description:
          'A curated collection of 27 interactive AI companion pets with 11 realistic actions for Claude Code, Cursor, CLI tools, and your terminal.',
        lang: 'en',
        id: '/?source=pwa',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        orientation: 'any',
        theme_color: '#ffffff',
        background_color: '#0b0e14',
        categories: ['productivity', 'developer', 'entertainment'],
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/icon-512-maskable.png',
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
        globIgnores: ['**/sprites/**', '**/node_modules/**'],
        additionalManifestEntries: [
          { url: '/icons/apple-touch-icon.png', revision: null },
          { url: '/icons/icon.svg', revision: null },
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
          'vendor-motion': ['framer-motion', 'canvas-confetti'],
        },
      },
    },
  },
});
