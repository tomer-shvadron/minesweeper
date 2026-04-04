import { RECENT_TAB, useLeaderboardModalLogic } from './useLeaderboardModalLogic';

import { ResponsiveModal } from '@/components/ui/ResponsiveModal';
import { TabBar } from '@/components/ui/TabBar';
import { useUIStore } from '@/stores/ui.store';
import type { BoardKey } from '@/types/game.types';
import { formatBoardKeyLabel } from '@/utils/board.utils';
import { formatRelativeDate } from '@/utils/date.utils';
import { formatTime } from '@/utils/time.utils';

function tabLabel(key: BoardKey): string {
  if (key === RECENT_TAB) {
    return 'Recent';
  }
  return formatBoardKeyLabel(key);
}

const LeaderboardContent = () => {
  const { allTabs, selectedTab, setSelectedTab, entries, gamesPlayedCount, recentGames } =
    useLeaderboardModalLogic();

  const isRecent = selectedTab === RECENT_TAB;

  return (
    <>
      <TabBar
        tabs={allTabs}
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        tabLabel={tabLabel}
        ariaLabel="Difficulty levels"
      />

      {/* Tab content — flex-1 fills available modal space; overflow scrolls long tables */}
      <div className="min-h-0 flex-1 overflow-y-auto">
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
                    <tr
                      key={record.id}
                      className="even:bg-[color-mix(in_srgb,var(--color-text)_5%,transparent)]"
                    >
                      <td className="px-3 py-2 text-[var(--color-text-muted)]">{i + 1}</td>
                      <td className="px-3 py-2">{formatBoardKeyLabel(record.boardKey)}</td>
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
                      <tr
                        key={`${entry.name}-${entry.date}`}
                        className="even:bg-[color-mix(in_srgb,var(--color-text)_5%,transparent)]"
                      >
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
      </div>
    </>
  );
};

export const LeaderboardModal = () => {
  const isOpen = useUIStore((s) => s.activeModal === 'leaderboard');
  const { layoutMode, closeModal } = useLeaderboardModalLogic();

  return (
    <ResponsiveModal
      isOpen={isOpen}
      title="Best Times"
      onClose={closeModal}
      layoutMode={layoutMode}
      modalClassName="w-[min(580px,92vw)]"
      fullHeight
    >
      <LeaderboardContent />
    </ResponsiveModal>
  );
};
