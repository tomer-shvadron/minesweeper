import { Check } from 'lucide-react';

import { useSettingsModalLogic } from '../useSettingsModalLogic';

import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Slider } from '@/components/ui/Slider';
import { Toggle } from '@/components/ui/Toggle';
import { THEME_LABELS, THEME_PREVIEW, THEMES } from '@/constants/theme.constants';
import type { BackgroundStyle, BoardSize } from '@/types/settings.types';

const BOARD_SIZE_OPTIONS: readonly { value: BoardSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
] as const;

const BACKGROUND_OPTIONS: readonly { value: BackgroundStyle; label: string }[] = [
  { value: 'gradient', label: 'Gradient' },
  { value: 'pattern', label: 'Pattern' },
  { value: 'dynamic', label: 'Dynamic' },
  { value: 'solid', label: 'Solid' },
] as const;

// ── Appearance Tab ──────────────────────────────────────

export const AppearanceTab = () => {
  const {
    theme,
    boardSize,
    backgroundStyle,
    animationsEnabled,
    setTheme,
    setBoardSize,
    setBackgroundStyle,
    setAnimationsEnabled,
  } = useSettingsModalLogic();

  return (
    <div className="flex flex-col gap-4">
      {/* Theme cards — 2-column grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {THEMES.map((t) => {
          const isSelected = theme === t;
          return (
            <button
              key={t}
              type="button"
              className={`relative flex cursor-pointer flex-col overflow-hidden rounded-xl border-2 bg-transparent p-0 transition-[border-color] duration-100 ${
                isSelected
                  ? 'border-[var(--color-accent)]'
                  : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]'
              }`}
              onClick={() => setTheme(t)}
              aria-label={THEME_LABELS[t]}
              aria-pressed={isSelected}
            >
              {/* Color preview */}
              <span
                className="relative block h-10 w-full"
                style={{ backgroundColor: THEME_PREVIEW[t].surface }}
              >
                <span
                  className="absolute right-0 bottom-0 left-0 h-2.5"
                  style={{ backgroundColor: THEME_PREVIEW[t].accent }}
                />
              </span>
              {/* Name */}
              <span className="px-2 py-1.5 text-center text-xs font-medium text-[var(--color-text)]">
                {THEME_LABELS[t]}
              </span>
              {/* Checkmark */}
              {isSelected && (
                <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)] text-white">
                  <Check size={12} strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <SegmentedControl
        label="Board size"
        options={BOARD_SIZE_OPTIONS}
        value={boardSize}
        onChange={setBoardSize}
      />

      <SegmentedControl
        label="Background"
        options={BACKGROUND_OPTIONS}
        value={backgroundStyle}
        onChange={setBackgroundStyle}
      />

      <Toggle
        id="animations-toggle"
        label="Animations"
        checked={animationsEnabled}
        onChange={setAnimationsEnabled}
      />
    </div>
  );
};

// ── Sound Tab ───────────────────────────────────────────

export const SoundTab = () => {
  const {
    soundEnabled,
    volume,
    hapticEnabled,
    hapticSupported,
    setSoundEnabled,
    setVolume,
    setHapticEnabled,
  } = useSettingsModalLogic();

  return (
    <div className="flex flex-col gap-4">
      <Toggle
        id="sound-toggle"
        label="Sound effects"
        checked={soundEnabled}
        onChange={setSoundEnabled}
      />
      <Slider
        id="volume-slider"
        label="Volume"
        value={volume}
        onChange={setVolume}
        disabled={!soundEnabled}
      />
      {hapticSupported && (
        <Toggle
          id="haptic-toggle"
          label="Haptic feedback"
          checked={hapticEnabled}
          onChange={setHapticEnabled}
        />
      )}
    </div>
  );
};

// ── Gameplay Tab ─────────────────────────────────────────

export const GameplayTab = () => {
  const { noGuessMode, flagMode, setNoGuessMode, setFlagMode, openKeyboardModal } =
    useSettingsModalLogic();

  return (
    <div className="flex flex-col gap-4">
      <Toggle
        id="no-guess-toggle"
        label="No guessing (logic-solvable boards)"
        checked={noGuessMode}
        onChange={setNoGuessMode}
      />
      <Toggle
        id="flagmode-toggle"
        label="Flag + question mark cycle"
        checked={flagMode === 'flags-and-questions'}
        onChange={(v) => setFlagMode(v ? 'flags-and-questions' : 'flags-only')}
      />
      <div className="flex items-center justify-between gap-3 text-[0.9375rem]">
        <span>Keyboard shortcuts</span>
        <Button variant="ghost" onClick={openKeyboardModal} className="text-[var(--color-accent)]">
          Configure
        </Button>
      </div>
    </div>
  );
};
