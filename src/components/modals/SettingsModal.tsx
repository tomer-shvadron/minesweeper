import type React from 'react';

import { useSettingsModalLogic } from './useSettingsModalLogic';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';
import { Toggle } from '@/components/ui/Toggle';
import { THEME_LABELS, THEME_PREVIEW, THEMES } from '@/constants/theme.constants';
import { useUIStore } from '@/stores/ui.store';
import type { BoardSize } from '@/types/settings.types';

const BOARD_SIZE_OPTIONS: { value: BoardSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-1 border-b border-[var(--color-border)] pb-1 text-xs font-semibold tracking-widest text-[var(--color-text-muted)] uppercase">
    {children}
  </p>
);

export const SettingsModal = () => {
  const isOpen = useUIStore((s) => s.activeModal === 'settings');
  const {
    theme,
    flagMode,
    soundEnabled,
    volume,
    animationsEnabled,
    hapticEnabled,
    noGuessMode,
    boardSize,
    hapticSupported,
    setTheme,
    setFlagMode,
    setSoundEnabled,
    setVolume,
    setAnimationsEnabled,
    setHapticEnabled,
    setNoGuessMode,
    setBoardSize,
    openKeyboardModal,
    closeModal,
  } = useSettingsModalLogic();

  return (
    <BottomSheet isOpen={isOpen} title="Settings" onClose={closeModal}>
      {/* Theme */}
      <div className="flex flex-col gap-3">
        <SectionHeading>Theme</SectionHeading>
        <div className="flex flex-wrap gap-2.5">
          {THEMES.map((t) => (
            <button
              key={t}
              type="button"
              className="flex cursor-pointer flex-col items-center gap-1 border-none bg-transparent p-0"
              onClick={() => setTheme(t)}
              aria-label={THEME_LABELS[t]}
              aria-pressed={theme === t}
            >
              <span
                className={`relative block h-10 w-12 overflow-hidden rounded-lg border-2 shadow-sm transition-[border-color] duration-100 after:absolute after:right-0 after:bottom-0 after:left-0 after:h-2.5 after:bg-[var(--swatch-accent)] after:content-[''] ${theme === t ? 'border-[var(--swatch-accent)]' : 'border-transparent'}`}
                style={
                  {
                    backgroundColor: THEME_PREVIEW[t].surface,
                    '--swatch-accent': THEME_PREVIEW[t].accent,
                  } as React.CSSProperties & Record<`--${string}`, string>
                }
              />
              <span className="max-w-12 overflow-hidden text-center text-[0.625rem] leading-tight text-ellipsis whitespace-nowrap text-[var(--color-text)]">
                {THEME_LABELS[t]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Display */}
      <div className="flex flex-col gap-3">
        <SectionHeading>Display</SectionHeading>
        <div className="flex items-center justify-between gap-3 text-[0.9375rem]">
          <span>Board size</span>
          <div className="flex overflow-hidden rounded-lg border border-[var(--color-border)]">
            {BOARD_SIZE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`cursor-pointer border-none px-3 py-1 text-sm transition-colors duration-100 ${
                  boardSize === opt.value
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-2,var(--color-surface))]'
                }`}
                onClick={() => setBoardSize(opt.value)}
                aria-pressed={boardSize === opt.value}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <Toggle
          id="animations-toggle"
          label="Animations"
          checked={animationsEnabled}
          onChange={setAnimationsEnabled}
        />
      </div>

      {/* Audio */}
      <div className="flex flex-col gap-3">
        <SectionHeading>Audio</SectionHeading>
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

      {/* Gameplay */}
      <div className="flex flex-col gap-3">
        <SectionHeading>Gameplay</SectionHeading>
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
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3">
        <SectionHeading>Controls</SectionHeading>
        <div className="flex items-center justify-between gap-3 text-[0.9375rem]">
          <span>Keyboard shortcuts</span>
          <Button
            variant="ghost"
            onClick={openKeyboardModal}
            className="text-[var(--color-accent)]"
          >
            Configure →
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-2 py-2">
        <Button variant="primary" onClick={closeModal}>
          Done
        </Button>
      </div>
    </BottomSheet>
  );
};
