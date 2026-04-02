import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

import { useGameStore } from '@/stores/game.store';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  private handleReset = () => {
    useGameStore.getState().startNewGame();
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-bg)] p-8 text-[var(--color-text)]">
          <h1 className="text-xl font-bold">Something went wrong</h1>
          <p className="text-sm opacity-70">
            An unexpected error occurred. Your game state has been preserved where possible.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="rounded bg-[var(--color-accent)] px-4 py-2 text-white shadow hover:opacity-90"
          >
            New Game
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
