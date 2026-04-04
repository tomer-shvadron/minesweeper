import { type ReactNode } from 'react';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Modal } from '@/components/ui/Modal';
import { RightSheet } from '@/components/ui/RightSheet';
import type { LayoutMode } from '@/types/settings.types';

interface ResponsiveModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  layoutMode: LayoutMode;
  children: ReactNode;
  /** Extra Tailwind classes for the desktop Modal (e.g. custom width). */
  modalClassName?: string;
  /** Lock height to max (50 dvh). Use for content-heavy modals like Leaderboard. */
  fullHeight?: boolean;
}

/**
 * Renders a `<Modal>`, `<BottomSheet>`, or `<RightSheet>` based on the
 * current layout mode.  All modal screens should use this wrapper so the
 * layout selection logic lives in one place.
 */
export const ResponsiveModal = ({
  isOpen,
  title,
  onClose,
  layoutMode,
  children,
  modalClassName,
  fullHeight = false,
}: ResponsiveModalProps) => {
  if (layoutMode === 'desktop') {
    return (
      <Modal
        isOpen={isOpen}
        title={title}
        onClose={onClose}
        {...(modalClassName !== undefined ? { className: modalClassName } : {})}
        fullHeight={fullHeight}
      >
        {children}
      </Modal>
    );
  }

  if (layoutMode === 'mobile-landscape') {
    return (
      <RightSheet isOpen={isOpen} title={title} onClose={onClose}>
        {children}
      </RightSheet>
    );
  }

  return (
    <BottomSheet isOpen={isOpen} title={title} onClose={onClose} fullHeight={fullHeight}>
      {children}
    </BottomSheet>
  );
};
