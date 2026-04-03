import { BarChart2, Settings, Trophy } from 'lucide-react';

import { useNavBarLogic } from './useNavBarLogic';

/**
 * Bottom navigation bar for mobile-portrait mode only.
 * Desktop and mobile-landscape use TopBar instead.
 */
export const NavBar = () => {
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

  return (
    <nav
      className="nav-bar fixed right-0 bottom-0 left-0 z-50 flex items-center justify-center gap-5 border-t border-[var(--color-border)] bg-[var(--color-glass-bg,var(--color-surface))] backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', height: '64px' }}
      aria-label="Game navigation"
    >
      <button
        type="button"
        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border-none bg-transparent text-[var(--color-text-muted)] transition-colors outline-none active:bg-[var(--color-surface-2)]"
        aria-label="Leaderboard"
        onClick={openLeaderboardModal}
      >
        <Trophy size={22} strokeWidth={1.75} />
      </button>

      <button
        type="button"
        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border-none bg-transparent text-[var(--color-text-muted)] transition-colors outline-none active:bg-[var(--color-surface-2)]"
        aria-label="Statistics"
        onClick={openStatisticsModal}
      >
        <BarChart2 size={22} strokeWidth={1.75} />
      </button>

      <button
        type="button"
        aria-label="New game"
        onClick={openNewGameModal}
        onAnimationEnd={clearSmileyAnimClass}
        className={`smiley-button flex h-12 w-12 cursor-pointer items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-glass-bg,var(--color-surface))] text-[1.75rem] leading-none shadow-sm backdrop-blur-sm transition-shadow outline-none active:shadow-none ${smileyTint}${smileyAnimClass ? ` ${smileyAnimClass}` : ''}`}
      >
        {emoji}
      </button>

      <button
        type="button"
        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border-none bg-transparent text-[var(--color-text-muted)] transition-colors outline-none active:bg-[var(--color-surface-2)]"
        aria-label="Settings"
        onClick={openSettingsModal}
      >
        <Settings size={22} strokeWidth={1.75} />
      </button>
    </nav>
  );
};
