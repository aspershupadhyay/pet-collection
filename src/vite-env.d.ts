/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform?: string }>;
}

interface ImportMetaEnv {
  /** Which collection config to build (file name in src/collections). */
  readonly VITE_COLLECTION?: string;
  /** Optional Supabase backend for sign-in, submissions and view counts. */
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}
