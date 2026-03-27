import { useState } from 'react';

import { DEFAULT_KEY_BINDINGS, KEYBOARD_ACTION_LABELS } from '@/constants/keyboard.constants';
import { useSettingsStore } from '@/stores/settings.store';
import { useUIStore } from '@/stores/ui.store';
import type { KeyboardAction } from '@/types/settings.types';

export const useKeyboardModalLogic = () => {
  const isOpen = useUIStore((s) => s.keyboardModalOpen);
  const closeModal = useUIStore((s) => s.closeKeyboardModal);
  const keyboardBindings = useSettingsStore((s) => s.keyboardBindings);
  const setKeyBinding = useSettingsStore((s) => s.setKeyBinding);

  const [recordingAction, setRecordingAction] = useState<KeyboardAction | null>(null);

  const actions: KeyboardAction[] = [
    'moveUp',
    'moveDown',
    'moveLeft',
    'moveRight',
    'reveal',
    'flag',
    'chord',
    'newGame',
  ];

  // Check for duplicate bindings
  const getDuplicateActions = (action: KeyboardAction): KeyboardAction[] => {
    const key = keyboardBindings[action];
    return actions.filter((a) => a !== action && keyboardBindings[a] === key);
  };

  const startRecording = (action: KeyboardAction) => {
    setRecordingAction(action);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!recordingAction) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Escape') {
      setRecordingAction(null);
      return;
    }

    setKeyBinding(recordingAction, e.key);
    setRecordingAction(null);
  };

  const resetToDefaults = () => {
    for (const [action, key] of Object.entries(DEFAULT_KEY_BINDINGS) as [
      KeyboardAction,
      string,
    ][]) {
      setKeyBinding(action, key);
    }
    setRecordingAction(null);
  };

  const formatKey = (key: string): string => {
    if (key === ' ') {
      return 'Space';
    }
    if (key === 'ArrowUp') {
      return '↑';
    }
    if (key === 'ArrowDown') {
      return '↓';
    }
    if (key === 'ArrowLeft') {
      return '←';
    }
    if (key === 'ArrowRight') {
      return '→';
    }
    if (key === 'Enter') {
      return 'Enter';
    }
    if (key === 'Escape') {
      return 'Esc';
    }
    if (key === 'Backspace') {
      return '⌫';
    }
    if (key === 'Tab') {
      return 'Tab';
    }
    return key.length === 1 ? key.toUpperCase() : key;
  };

  return {
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
  };
};
