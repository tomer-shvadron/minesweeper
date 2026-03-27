import { useKeyboardModalLogic } from './useKeyboardModalLogic';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

export const KeyboardModal = () => {
  const {
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
    <Modal isOpen={isOpen} title="Keyboard Shortcuts" onClose={closeModal}>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        className="flex flex-col gap-[6px]"
        onKeyDown={recordingAction ? handleKeyDown : undefined}
      >
        <p className="text-[0.8125rem] text-[var(--color-text-muted)]">
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
                className={`flex items-center justify-between gap-3 border-b border-[var(--color-border-dark)] px-1 py-2 text-left text-base transition-colors last:border-b-0 ${
                  isRecording
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'cursor-pointer hover:bg-[var(--color-surface-2)]'
                }`}
              >
                <span>{KEYBOARD_ACTION_LABELS[action]}</span>
                <span
                  className={`min-w-[60px] rounded border px-2 py-0.5 text-center font-mono text-sm ${
                    isRecording
                      ? 'border-white/50 bg-white/20 text-white'
                      : hasDuplicate
                        ? 'border-[var(--color-n3)] bg-[var(--color-surface)] text-[var(--color-n3)]'
                        : 'border-[var(--color-border-dark)] bg-[var(--color-surface)] text-[var(--color-text)]'
                  }`}
                >
                  {isRecording ? 'Press key…' : formatKey(keyboardBindings[action])}
                </span>
              </button>
            );
          })}
        </div>
        {actions.some((a) => getDuplicateActions(a).length > 0) && (
          <p className="text-[0.8125rem] text-[var(--color-n3)]">⚠ Duplicate bindings detected</p>
        )}
      </div>
      <div className="flex justify-end gap-1.5 px-3 py-2 pb-[10px]">
        <Button variant="primary" onClick={closeModal}>
          Done
        </Button>
        <Button variant="secondary" onClick={resetToDefaults}>
          Reset defaults
        </Button>
      </div>
    </Modal>
  );
};
