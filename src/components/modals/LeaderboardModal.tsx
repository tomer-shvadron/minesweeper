import { RECENT_TAB, useLeaderboardModalLogic } from './useLeaderboardModalLogic';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Modal } from '@/components/ui/Modal';
import { RightSheet } from '@/components/ui/RightSheet';
import { StableHeight } from '@/components/ui/StableHeight';
import { useUIStore } from '@/stores/ui.store';
import type { BoardKey } from '@/types/game.types';
import { formatRelativeDate } from '@/utils/date.utils';
import { formatTime } from '@/utils/time.utils';

const TAB_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
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

const LeaderboardContent = () => {
  const { allTabs, selectedTab, setSelectedTab, entries, gamesPlayedCount, recentGames } =
    useLeaderboardModalLogic();

  const isRecent = selectedTab === RECENT_TAB;

  return (
    <>
      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Difficulty levels"
        className="flex border-b border-[var(--color-border)]"
      >
        {allTabs.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={selectedTab === key}
            className={`flex-1 cursor-pointer border-none bg-transparent px-2 py-2 text-xs font-medium transition-colors duration-100 outline-none focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] ${
              selectedTab === key
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
            style={
              selectedTab === key
                ? { boxShadow: 'inset 0 -2px 0 var(--color-accent)', marginBottom: '-1px' }
                : { marginBottom: '-1px' }
            }
            onClick={() => setSelectedTab(key)}
          >
            {tabLabel(key)}
          </button>
        ))}
      </div>

      {/* Tab content — height is locked to the initial render (score tab with 10 rows).
          `clamp` ensures the Recent tab scrolls instead of growing the sheet. */}
      <StableHeight clamp>
        {isRecent ? (
          /* Recent games tab */
          <div role="tabpanel" aria-label="Recent games" className="w-full">
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
                      #
                    </th>
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
                  {recentGames.map((record, i) => (
                    <tr key={record.id} className="even:bg-black/[0.03]">
                      <td className="px-3 py-2 text-[var(--color-text-muted)]">{i + 1}</td>
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
            <div className="flex justify-center pt-2">
              {entries.length === 0 ? (
                <p className="py-6 text-center text-[0.9375rem] text-[var(--color-text-muted)]">
                  {gamesPlayedCount > 0
                    ? 'No high scores yet — keep playing!'
                    : 'Play a game to set a record!'}
                </p>
              ) : (
                <table className="scores-table border-collapse text-[0.9375rem]">
                  <caption className="sr-only">{tabLabel(selectedTab)} high scores</caption>
                  <thead>
                    <tr>
                      <th className="border-b border-[var(--color-border)] px-10 py-2 text-left text-xs font-medium tracking-wide text-[var(--color-text-muted)] uppercase">
                        #
                      </th>
                      <th className="border-b border-[var(--color-border)] px-10 py-2 text-left text-xs font-medium tracking-wide text-[var(--color-text-muted)] uppercase">
                        Name
                      </th>
                      <th className="border-b border-[var(--color-border)] px-10 py-2 text-left text-xs font-medium tracking-wide text-[var(--color-text-muted)] uppercase">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, i) => (
                      <tr key={`${entry.name}-${entry.date}`} className="even:bg-black/[0.03]">
                        <td className="px-10 py-2">{i + 1}</td>
                        <td className="px-10 py-2">{entry.name}</td>
                        <td className="px-10 py-2">{formatTime(entry.timeSeconds)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </StableHeight>
    </>
  );
};

export const LeaderboardModal = () => {
  const isOpen = useUIStore((s) => s.activeModal === 'leaderboard');
  const { layoutMode, closeModal } = useLeaderboardModalLogic();

  if (layoutMode === 'desktop') {
    return (
      <Modal
        isOpen={isOpen}
        title="Best Times"
        onClose={closeModal}
        className="modal-window fixed top-1/2 left-1/2 z-[101] flex max-h-[85dvh] w-[min(580px,92vw)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_24px_64px_rgba(0,0,0,0.2)]"
      >
        <LeaderboardContent />
      </Modal>
    );
  }

  if (layoutMode === 'mobile-landscape') {
    return (
      <RightSheet isOpen={isOpen} title="Best Times" onClose={closeModal}>
        <LeaderboardContent />
      </RightSheet>
    );
  }

  return (
    <BottomSheet isOpen={isOpen} title="Best Times" onClose={closeModal}>
      <LeaderboardContent />
    </BottomSheet>
  );
};
