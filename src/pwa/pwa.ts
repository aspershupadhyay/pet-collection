import { registerSW } from 'virtual:pwa-register';
import { useEffect, useState } from 'react';

let registered = false;

/**
 * Registers the service worker (vite-plugin-pwa, autoUpdate mode).
 * Call once from the app entry.
 */
export function setupPwa(): void {
  if (registered || typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  registered = true;

  // When a new version takes over, reload once so nobody keeps running an
  // old copy of the app (or seeing characters that have been removed).
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true;
    window.location.reload();
  });

  // Caches from older versions of the site
  caches?.keys().then((keys) => keys.filter((k) => k === 'petcraft-sprites-v1').forEach((k) => caches.delete(k)));

  registerSW({
    immediate: true,
    onRegisteredSW(swUrl) {
      const check = async () => {
        try {
          const reg = await navigator.serviceWorker.getRegistration(swUrl);
          await reg?.update();
        } catch {
          // offline or SW unavailable — ignore
        }
      };
      // Check when the tab comes back and every 15 minutes while open
      document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check());
      setInterval(check, 15 * 60 * 1000);
    },
  });
}

export interface PwaInstallState {
  canInstall: boolean;
  installed: boolean;
  install: () => Promise<boolean>;
}

/**
 * Exposes the native install prompt when the browser supports it.
 */
export function usePwaInstall(): PwaInstallState {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(
    () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS Safari
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!promptEvent) return false;
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalled(true);
        return true;
      }
    } catch {
      // user dismissed or browser refused
    } finally {
      setPromptEvent(null);
    }
    return false;
  };

  return { canInstall: !!promptEvent && !installed, installed, install };
}
