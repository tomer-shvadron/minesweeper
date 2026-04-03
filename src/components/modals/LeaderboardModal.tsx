import { RECENT_TAB, useLeaderboardModalLogic } from './useLeaderboardModalLogic';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { useUIStore } from '@/stores/ui.store';
import type { BoardKey } from '@/types/game.types';
import { formatRelativeDate } from '@/utils/date.utils';
import { formatTime } from '@/utils/time.utils';

const TAB_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Inter.',
  expert: 'Expert',
  [RECENT_TAB]: 'Recent',
};

const BOARD_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  expert: 'Expert',
};

function tabLabel(key: BoardKey): string {
  return TAB_LABELS[key] ?? key;
}

function boardLabel(key: BoardKey): string {
  return BOARD_LABELS[key] ?? key;
}

export const LeaderboardModal = () => {
  const isOpen = useUIStore((s) => s.activeModal === 'leaderboard');
  const {
    allTabs,
    selectedTab,
    setSelectedTab,
    entries,
    gamesPlayedCount,
    recentGames,
    closeModal,
  } = useLeaderboardModalLogic();

  const isRecent = selectedTab === RECENT_TAB;

  return (
    <BottomSheet isOpen={isOpen} title="Best Times" onClose={closeModal}>
      {/* Tabs */}
      <div role="tablist" aria-label="Difficulty levels" className="flex gap-1 overflow-x-auto">
        {allTabs.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={selectedTab === key}
            className={`cursor-pointer rounded-lg border border-[var(--color-border)] px-3.5 py-1.5 text-sm transition-colors duration-100 ${
              selectedTab === key
                ? 'bg-[var(--color-accent)] font-semibold text-white'
                : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2,var(--color-surface))]'
            }`}
            onClick={() => setSelectedTab(key)}
          >
            {tabLabel(key)}
          </button>
        ))}
      </div>

      {isRecent ? (
        /* Recent games tab */
        <div role="tabpanel" aria-label="Recent games" className="min-h-[180px] w-full">
          {recentGames.length === 0 ? (
            <p className="py-6 text-center text-[0.9375rem] text-[var(--color-text-muted)]">
              Play a game to see recent history!
            </p>
          ) : (
            <table className="scores-table w-full border-collapse text-[0.9375rem]">
              <caption className="sr-only">Recent games history</caption>
              <thead>
                <tr>
                  <th className="border-b border-[var(--color-border)] px-3 py-2 text-left text-xs font-medium tracking-wide text-[var(--color-text-muted)] uppercase">
                    Level
                  </th>
                  <th className="border-b border-[var(--color-border)] px-3 py-2 text-left text-xs font-medium tracking-wide text-[var(--color-text-muted)] uppercase">
                    Result
                  </th>
                  <th className="border-b border-[var(--color-border)] px-3 py-2 text-left text-xs font-medium tracking-wide text-[var(--color-text-muted)] uppercase">
                    Time
                  </th>
                  <th className="border-b border-[var(--color-border)] px-3 py-2 text-left text-xs font-medium tracking-wide text-[var(--color-text-muted)] uppercase">
                    When
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentGames.map((record) => (
                  <tr key={record.id} className="even:bg-black/[0.03]">
                    <td className="px-3 py-2">{boardLabel(record.boardKey)}</td>
                    <td className="px-3 py-2">{record.result === 'won' ? '✅' : '💣'}</td>
                    <td className="px-3 py-2">{formatTime(record.timeSeconds)}</td>
                    <td className="px-3 py-2 text-[var(--color-text-muted)]">
                      {formatRelativeDate(record.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div role="tabpanel" aria-label={`${tabLabel(selectedTab)} high scores`}>
          {/* Games played stat */}
          <p className="m-0 text-sm text-[var(--color-text-muted)]">
            {gamesPlayedCount > 0
              ? `${gamesPlayedCount} game${gamesPlayedCount !== 1 ? 's' : ''} played`
              : 'No games played yet'}
          </p>

          {/* Scores table */}
          <div className="min-h-[180px] w-full pt-2">
            {entries.length === 0 ? (
              <p className="py-6 text-center text-[0.9375rem] text-[var(--color-text-muted)]">
                {gamesPlayedCount > 0
                  ? 'No high scores yet — keep playing!'
                  : 'Play a game to set a record!'}
              </p>
            ) : (
              <table className="scores-table w-full border-collapse text-[0.9375rem]">
                <caption className="sr-only">{tabLabel(selectedTab)} high scores</caption>
                <thead>
                  <tr>
                    <th className="border-b border-[var(--color-border)] px-3 py-2 text-left text-xs font-medium tracking-wide text-[var(--color-text-muted)] uppercase">
                      #
                    </th>
                    <th className="border-b border-[var(--color-border)] px-3 py-2 text-left text-xs font-medium tracking-wide text-[var(--color-text-muted)] uppercase">
                      Name
                    </th>
                    <th className="border-b border-[var(--color-border)] px-3 py-2 text-left text-xs font-medium tracking-wide text-[var(--color-text-muted)] uppercase">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, i) => (
                    <tr key={`${entry.name}-${entry.date}`} className="even:bg-black/[0.03]">
                      <td className="px-3 py-2">{i + 1}</td>
                      <td className="px-3 py-2">{entry.name}</td>
                      <td className="px-3 py-2">{formatTime(entry.timeSeconds)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </BottomSheet>
  );
};
