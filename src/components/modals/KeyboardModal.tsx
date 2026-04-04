import { useKeyboardModalLogic } from './useKeyboardModalLogic';

import { Button } from '@/components/ui/Button';
import { ResponsiveModal } from '@/components/ui/ResponsiveModal';

export const KeyboardModal = () => {
  const {
    layoutMode,
    isOpen,
    closeModal,
    actions,
    keyboardBindings,
    recordingAction,
    startRecording,
    handleKeyDown,
    resetToDefaults,
    getDuplicateActions,
    formatKey,
    KEYBOARD_ACTION_LABELS,
  } = useKeyboardModalLogic();

  return (
    <ResponsiveModal
      isOpen={isOpen}
      title="Keyboard Shortcuts"
      onClose={closeModal}
      layoutMode={layoutMode}
    >
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div className="flex flex-col gap-2" onKeyDown={recordingAction ? handleKeyDown : undefined}>
        <p className="text-sm text-[var(--color-text-muted)]">
          Click a row to rebind a key. Press Escape to cancel.
        </p>
        <div className="flex flex-col">
          {actions.map((action) => {
            const isRecording = recordingAction === action;
            const duplicates = getDuplicateActions(action);
            const hasDuplicate = duplicates.length > 0;

            return (
              <button
                key={action}
                type="button"
                onClick={() => startRecording(action)}
                className={`flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-left text-[0.9375rem] transition-colors ${
                  isRecording
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'cursor-pointer hover:bg-[var(--color-surface-2,var(--color-surface))]'
                }`}
              >
                <span>{KEYBOARD_ACTION_LABELS[action]}</span>
                <span
                  className={`min-w-[60px] rounded-md border px-2.5 py-0.5 text-center font-mono text-sm ${
                    isRecording
                      ? 'border-white/40 bg-white/20 text-white'
                      : hasDuplicate
                        ? 'border-[var(--color-n3)] bg-[var(--color-surface)] text-[var(--color-n3)]'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'
                  }`}
                >
                  {isRecording ? 'Press key…' : formatKey(keyboardBindings[action])}
                </span>
              </button>
            );
          })}
        </div>
        {actions.some((a) => getDuplicateActions(a).length > 0) && (
          <p className="text-sm text-[var(--color-n3)]">⚠ Duplicate bindings detected</p>
        )}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="primary" onClick={closeModal}>
          Done
        </Button>
        <Button variant="secondary" onClick={resetToDefaults}>
          Reset defaults
        </Button>
      </div>
    </ResponsiveModal>
  );
};
