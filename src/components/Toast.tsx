import React, { useEffect } from 'react';
import { Check, X } from 'lucide-react';

export interface ToastItem {
  id: number;
  message: string;
  submessage?: string;
}

interface ToastProps {
  message?: string | null;
  toasts?: ToastItem[];
  onDismiss?: (id: number) => void;
}

export const Toast: React.FC<ToastProps> = ({ message, toasts = [], onDismiss }) => {
  useEffect(() => {
    if (!toasts.length || !onDismiss) return;
    const timers = toasts.map((t) =>
      setTimeout(() => {
        onDismiss(t.id);
      }, 3200)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, onDismiss]);

  if (toasts.length > 0) {
    return (
      <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2 max-w-xs w-full pointer-events-none">
        {toasts.slice(-3).map((t) => (
          <div
            key={t.id}
            className="animate-popup-in pointer-events-auto flex items-center justify-between gap-3 rounded-tray layer-float px-3.5 py-2.5 text-ink"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand text-white">
                <Check className="size-3" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-small font-medium text-ink">{t.message}</p>
                {t.submessage && (
                  <p className="truncate text-micro text-ink-3">{t.submessage}</p>
                )}
              </div>
            </div>
            {onDismiss && (
              <button
                type="button"
                onClick={() => onDismiss(t.id)}
                aria-label="Dismiss notification"
                className="grid size-5 shrink-0 place-items-center rounded-full text-ink-3 hover:bg-wash hover:text-ink"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full layer-float text-ink font-sans text-small font-medium">
      <div className="size-5 rounded-full bg-brand text-white grid place-items-center shrink-0">
        <Check className="size-3" />
      </div>
      <span>{message}</span>
    </div>
  );
};
