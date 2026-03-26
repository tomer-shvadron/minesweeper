import { useLeaderboardModalLogic } from './useLeaderboardModalLogic'

import { Modal } from '@/components/ui/Modal'
import { useUIStore } from '@/stores/ui.store'
import type { BoardKey } from '@/types/game.types'
import { formatTime } from '@/utils/time.utils'

const TAB_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Inter.',
  expert: 'Expert',
}

function tabLabel(key: BoardKey): string {
  return TAB_LABELS[key] ?? key
}

export const LeaderboardModal = () => {
  const isOpen = useUIStore((s) => s.leaderboardModalOpen)
  const { allTabs, selectedTab, setSelectedTab, entries, gamesPlayedCount, closeModal } =
    useLeaderboardModalLogic()

  return (
    <Modal isOpen={isOpen} title="Best Times" onClose={closeModal}>
      {/* Board selector tabs */}
      <div className="flex flex-wrap gap-0.5 border-b-2 border-[var(--color-border-dark)]">
        {allTabs.map((key) => (
          <button
            key={key}
            type="button"
            className={`cursor-pointer border border-b-0 border-[var(--color-border-dark)] bg-[var(--color-surface)] px-[14px] py-[5px] text-[0.9375rem] shadow-[inset_1px_1px_0_var(--color-border-light),inset_-1px_0_0_var(--color-border-dark)] ${selectedTab === key ? 'bg-[var(--color-border-light)] font-bold' : ''}`}
            onClick={() => setSelectedTab(key)}
          >
            {tabLabel(key)}
          </button>
        ))}
      </div>

      {/* Games played stat */}
      <p className="m-0 text-[0.8125rem] text-[var(--color-text-muted)]">
        {gamesPlayedCount > 0
          ? `${gamesPlayedCount} game${gamesPlayedCount !== 1 ? 's' : ''} played`
          : 'No games played yet'}
      </p>

      {/* Scores table */}
      <div className="min-h-[180px] w-full">
        {entries.length === 0 ? (
          <p className="py-6 text-center text-[0.9375rem] text-[var(--color-text-muted)]">
            {gamesPlayedCount > 0
              ? 'No high scores yet — keep playing!'
              : 'Play a game to set a record!'}
          </p>
        ) : (
          <table className="w-full border-collapse text-[0.9375rem]">
            <thead>
              <tr>
                <th className="border-b border-[var(--color-border-dark)] px-[10px] py-[5px] text-left font-bold">
                  #
                </th>
                <th className="border-b border-[var(--color-border-dark)] px-[10px] py-[5px] text-left font-bold">
                  Name
                </th>
                <th className="border-b border-[var(--color-border-dark)] px-[10px] py-[5px] text-left font-bold">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr key={`${entry.name}-${entry.date}`} className="even:bg-black/5">
                  <td className="px-[10px] py-[5px]">{i + 1}</td>
                  <td className="px-[10px] py-[5px]">{entry.name}</td>
                  <td className="px-[10px] py-[5px]">{formatTime(entry.timeSeconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Modal>
  )
}
