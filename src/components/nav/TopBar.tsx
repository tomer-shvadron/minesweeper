import { BarChart2, Bomb, Settings, Timer, Trophy } from 'lucide-react';

import { useNavBarLogic } from './useNavBarLogic';

import { useGameStore } from '@/stores/game.store';

interface TopBarProps {
  /** Use compact sizing (44px) for mobile landscape, standard (52px) for desktop */
  compact?: boolean;
}

/**
 * Unified top toolbar for desktop and mobile-landscape modes.
 * Merges the nav actions with mine counter + timer into one horizontal bar.
 */
export const TopBar = ({ compact = false }: TopBarProps) => {
  const {
    emoji,
    smileyAnimClass,
    smileyTint,
    clearSmileyAnimClass,
    openSettingsModal,
    openLeaderboardModal,
    openStatisticsModal,
    openNewGameModal,
  } = useNavBarLogic();

  const minesRemaining = useGameStore((s) => s.minesRemaining);
  const elapsedSeconds = useGameStore((s) => s.elapsedSeconds);

  const height = compact ? 44 : 52;
  const iconSize = compact ? 18 : 20;
  const counterFontSize = compact ? 18 : 22;
  const smileySize = compact ? 'h-9 w-9 text-xl' : 'h-10 w-10 text-[1.5rem]';
  const btnSize = compact ? 'h-9 w-9' : 'h-10 w-10';

  const counterStyle = {
    fontSize: counterFontSize,
    fontVariantNumeric: 'tabular-nums' as const,
    lineHeight: 1,
    letterSpacing: '-0.02em',
  };

  return (
    <nav
      className="fixed top-0 right-0 left-0 z-50 flex items-center justify-center border-b border-[var(--color-border)] bg-[var(--color-glass-bg,var(--color-surface))] backdrop-blur-xl"
      style={{ height }}
      aria-label="Game navigation"
    >
      <div className="flex w-full max-w-3xl items-center justify-between px-4">
        {/* Left: mine counter */}
        <div className="flex items-center gap-2">
          <Bomb size={iconSize} className="text-[var(--color-text-muted)]" strokeWidth={2} />
          <span
            className="font-extrabold text-[var(--color-text)]"
            style={counterStyle}
            aria-live="polite"
            aria-atomic="true"
            aria-label={`${minesRemaining} mines remaining`}
            data-testid="mine-counter"
          >
            {minesRemaining}
          </span>
        </div>

        {/* Center: action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`flex ${btnSize} cursor-pointer items-center justify-center rounded-xl border-none bg-transparent text-[var(--color-text-muted)] transition-colors outline-none hover:bg-[var(--color-surface-2)] active:bg-[var(--color-surface-2)]`}
            aria-label="Leaderboard"
            onClick={openLeaderboardModal}
          >
            <Trophy size={iconSize} strokeWidth={1.75} />
          </button>

          <button
            type="button"
            className={`flex ${btnSize} cursor-pointer items-center justify-center rounded-xl border-none bg-transparent text-[var(--color-text-muted)] transition-colors outline-none hover:bg-[var(--color-surface-2)] active:bg-[var(--color-surface-2)]`}
            aria-label="Statistics"
            onClick={openStatisticsModal}
          >
            <BarChart2 size={iconSize} strokeWidth={1.75} />
          </button>

          <button
            type="button"
            aria-label="New game"
            onClick={openNewGameModal}
            onAnimationEnd={clearSmileyAnimClass}
            className={`smiley-button flex ${smileySize} cursor-pointer items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-glass-bg,var(--color-surface))] leading-none shadow-sm backdrop-blur-sm transition-shadow outline-none active:shadow-none ${smileyTint}${smileyAnimClass ? ` ${smileyAnimClass}` : ''}`}
          >
            {emoji}
          </button>

          <button
            type="button"
            className={`flex ${btnSize} cursor-pointer items-center justify-center rounded-xl border-none bg-transparent text-[var(--color-text-muted)] transition-colors outline-none hover:bg-[var(--color-surface-2)] active:bg-[var(--color-surface-2)]`}
            aria-label="Settings"
            onClick={openSettingsModal}
          >
            <Settings size={iconSize} strokeWidth={1.75} />
          </button>
        </div>

        {/* Right: timer */}
        <div className="flex items-center gap-2">
          <span
            className="font-extrabold text-[var(--color-text)]"
            style={counterStyle}
            aria-live="polite"
            aria-atomic="true"
            aria-label={`${elapsedSeconds} seconds elapsed`}
            data-testid="timer"
          >
            {String(elapsedSeconds).padStart(3, '0')}
          </span>
          <Timer size={iconSize} className="text-[var(--color-text-muted)]" strokeWidth={2} />
        </div>
      </div>
    </nav>
  );
};
