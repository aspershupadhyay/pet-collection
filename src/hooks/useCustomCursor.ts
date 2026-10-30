import { useCallback, useEffect, useState } from 'react';

const CURSOR_KEY = 'petcraft-cursor';

function readInitial(): boolean {
  try {
    return localStorage.getItem(CURSOR_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Settings → "Custom cursor": swaps the system pointer for a pixel paw.
 * State persists in localStorage; the class lives on <html> so the CSS
 * rule (`.custom-cursor *`) covers every element.
 */
export function useCustomCursor() {
  const [customCursor, setCustomCursor] = useState<boolean>(readInitial);

  useEffect(() => {
    document.documentElement.classList.toggle('custom-cursor', customCursor);
    try {
      localStorage.setItem(CURSOR_KEY, customCursor ? '1' : '0');
    } catch {
      // storage unavailable — cursor is ephemeral, that's fine
    }
  }, [customCursor]);

  const onChangeCustomCursor = useCallback((value: boolean) => {
    setCustomCursor(value);
  }, []);

  return { customCursor, onChangeCustomCursor };
}
