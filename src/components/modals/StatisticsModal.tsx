import { useEffect, useRef } from 'react';

import { tabLabel, useStatisticsModalLogic } from './useStatisticsModalLogic';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { useUIStore } from '@/stores/ui.store';
import { formatTime } from '@/utils/time.utils';

const HEATMAP_CELL_SIZE = 8;

function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

function formatEfficiency(eff: number): string {
  return `×${eff.toFixed(1)}`;
}

function HeatmapCanvas({
  heatmap,
  rows,
  cols,
}: {
  heatmap: number[][];
  rows: number;
  cols: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const value = heatmap[r]?.[c] ?? 0;
        const alpha = 0.15 + value * 0.85;
        ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
        ctx.fillRect(
          c * HEATMAP_CELL_SIZE,
          r * HEATMAP_CELL_SIZE,
          HEATMAP_CELL_SIZE - 1,
          HEATMAP_CELL_SIZE - 1
        );
      }
    }
  }, [heatmap, rows, cols]);

  return (
    <canvas
      ref={canvasRef}
      width={cols * HEATMAP_CELL_SIZE}
      height={rows * HEATMAP_CELL_SIZE}
      className="rounded-lg border border-[var(--color-border)]"
    />
  );
}

export const StatisticsModal = () => {
  const isOpen = useUIStore((s) => s.activeModal === 'statistics');
  const {
    allTabs,
    selectedTab,
    setSelectedTab,
    closeModal,
    totalGames,
    wins,
    winRate,
    bestTime,
    averageTime,
    currentStreak,
    bestStreak,
    totalTimePlayed,
    averageEfficiency,
    heatmap,
    heatmapDims,
    showHeatmap,
  } = useStatisticsModalLogic();

  return (
    <BottomSheet isOpen={isOpen} title="Statistics" onClose={closeModal}>
      {/* Difficulty tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {allTabs.map((key) => (
          <button
            key={key}
            type="button"
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

      {totalGames === 0 ? (
        <p className="py-6 text-center text-[0.9375rem] text-[var(--color-text-muted)]">
          Play a game to see statistics!
        </p>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <div>
              <div className="text-xs tracking-wide text-[var(--color-text-muted)] uppercase">
                Win rate
              </div>
              <div className="text-lg font-bold">
                {formatPercent(winRate)}{' '}
                <span className="text-sm font-normal text-[var(--color-text-muted)]">
                  ({wins}/{totalGames})
                </span>
              </div>
            </div>

            <div>
              <div className="text-xs tracking-wide text-[var(--color-text-muted)] uppercase">
                Best time
              </div>
              <div className="text-lg font-bold">
                {bestTime !== null ? formatTime(bestTime) : '—'}
              </div>
            </div>

            <div>
              <div className="text-xs tracking-wide text-[var(--color-text-muted)] uppercase">
                Avg time
              </div>
              <div className="text-lg font-bold">
                {averageTime !== null ? formatTime(Math.round(averageTime)) : '—'}
              </div>
            </div>

            <div>
              <div className="text-xs tracking-wide text-[var(--color-text-muted)] uppercase">
                Total played
              </div>
              <div className="text-lg font-bold">{formatTime(totalTimePlayed)}</div>
            </div>

            <div>
              <div className="text-xs tracking-wide text-[var(--color-text-muted)] uppercase">
                Current streak
              </div>
              <div className="text-lg font-bold">{currentStreak}</div>
            </div>

            <div>
              <div className="text-xs tracking-wide text-[var(--color-text-muted)] uppercase">
                Best streak
              </div>
              <div className="text-lg font-bold">{bestStreak}</div>
            </div>

            {averageEfficiency !== null && (
              <div>
                <div className="text-xs tracking-wide text-[var(--color-text-muted)] uppercase">
                  Avg efficiency
                </div>
                <div className="text-lg font-bold">
                  {formatEfficiency(averageEfficiency)}{' '}
                  <span className="text-sm font-normal text-[var(--color-text-muted)]">
                    per click
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Heatmap */}
          {showHeatmap && heatmap && heatmapDims && (
            <div className="flex flex-col gap-2">
              <p className="mb-1 border-b border-[var(--color-border)] pb-1 text-xs font-semibold tracking-widest text-[var(--color-text-muted)] uppercase">
                Where you first click
              </p>
              <div className="flex justify-center overflow-x-auto">
                <HeatmapCanvas heatmap={heatmap} rows={heatmapDims.rows} cols={heatmapDims.cols} />
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-[var(--color-text-muted)]">
                <span>Less</span>
                <div className="flex gap-px">
                  {[0.15, 0.35, 0.55, 0.75, 0.95].map((alpha) => (
                    <div
                      key={alpha}
                      className="h-3 w-3 rounded-sm"
                      style={{ background: `rgba(34,197,94,${alpha})` }}
                    />
                  ))}
                </div>
                <span>More</span>
              </div>
            </div>
          )}
        </>
      )}
    </BottomSheet>
  );
};
