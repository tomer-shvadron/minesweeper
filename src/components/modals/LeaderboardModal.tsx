import { useLeaderboardModalLogic } from './useLeaderboardModalLogic'

import { Button } from '@/components/ui/Button'
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
  const {
    allTabs,
    selectedTab,
    setSelectedTab,
    entries,
    gamesPlayedCount,
    clearScores,
    closeModal,
  } = useLeaderboardModalLogic()

  return (
    <Modal isOpen={isOpen} title="Best Times" onClose={closeModal}>
      {/* Board selector tabs */}
      <div className="leaderboard-tabs">
        {allTabs.map((key) => (
          <button
            key={key}
            type="button"
            className={`leaderboard-tab ${selectedTab === key ? 'leaderboard-tab--active' : ''}`}
            onClick={() => setSelectedTab(key)}
          >
            {tabLabel(key)}
          </button>
        ))}
      </div>

      {/* Games played stat */}
      <p className="leaderboard-games-played">
        {gamesPlayedCount > 0
          ? `${gamesPlayedCount} game${gamesPlayedCount !== 1 ? 's' : ''} played`
          : 'No games played yet'}
      </p>

      {/* Scores table */}
      <div className="leaderboard-table">
        {entries.length === 0 ? (
          <p className="leaderboard-empty">
            {gamesPlayedCount > 0
              ? 'No high scores yet — keep playing!'
              : 'Play a game to set a record!'}
          </p>
        ) : (
          <table className="scores-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr key={`${entry.name}-${entry.date}`}>
                  <td>{i + 1}</td>
                  <td>{entry.name}</td>
                  <td>{formatTime(entry.timeSeconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="modal-actions">
        {entries.length > 0 && (
          <Button variant="secondary" onClick={clearScores}>
            Clear
          </Button>
        )}
        <Button variant="primary" onClick={closeModal}>
          Close
        </Button>
      </div>
    </Modal>
  )
}
