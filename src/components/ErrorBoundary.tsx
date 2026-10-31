import React from 'react';

interface State {
  error: Error | null;
}

/* Last line of defence: a broken view shouldn't blank the whole page. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <p className="font-display text-[18px] font-medium text-ink">Something went wrong.</p>
          <p className="mt-1 text-[14px] text-ink-3">Reloading usually fixes it. If it keeps happening, let us know.</p>
          <button
            type="button"
            onClick={() => window.location.assign(import.meta.env.BASE_URL)}
            className="surface surface-primary mt-5 h-9 rounded-full px-5 text-[14px] font-medium text-white"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
