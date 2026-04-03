import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { type ReactNode, useCallback, useRef } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Bottom sheet component for heavy content panels (Settings, Leaderboard, Statistics).
 * Slides up from the bottom with a drag handle. Swipe down to dismiss.
 */
export const BottomSheet = ({ isOpen, title, onClose, children }: BottomSheetProps) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const currentTranslateY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) {
      return;
    }
    dragStartY.current = touch.clientY;
    currentTranslateY.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (dragStartY.current === null) {
      return;
    }
    const touch = e.touches[0];
    if (!touch) {
      return;
    }
    const dy = touch.clientY - dragStartY.current;
    // Only allow dragging downward
    if (dy > 0 && sheetRef.current) {
      currentTranslateY.current = dy;
      sheetRef.current.style.transform = `translateY(${dy}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (dragStartY.current === null) {
      return;
    }
    const sheet = sheetRef.current;
    dragStartY.current = null;

    if (currentTranslateY.current > 100) {
      // Dismiss
      onClose();
    }
    // Reset position
    if (sheet) {
      sheet.style.transform = '';
    }
    currentTranslateY.current = 0;
  }, [onClose]);

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="modal-backdrop fixed inset-0 z-[100] bg-black/35 backdrop-blur-[2px] data-[state=closed]:animate-[fadeOut_0.1s_ease] data-[state=open]:animate-[fadeIn_0.15s_ease]" />
        <DialogPrimitive.Content
          ref={sheetRef}
          className="modal-window fixed right-0 bottom-0 left-0 z-[101] flex max-h-[85dvh] flex-col overflow-hidden rounded-t-2xl border-t border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_-16px_48px_rgba(0,0,0,0.15)] data-[state=closed]:animate-[slideDown_0.15s_ease] data-[state=open]:animate-[slideUp_0.2s_ease]"
          aria-describedby={undefined}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Drag handle */}
          <div className="flex justify-center py-2">
            <div className="h-1 w-9 rounded-full bg-[var(--color-text-muted)] opacity-30" />
          </div>

          {/* Title bar */}
          <DialogPrimitive.Title className="modal-title-bar flex items-center justify-between px-5 pb-3 text-lg font-semibold text-[var(--color-text)] select-none">
            <span>{title}</span>
            <DialogPrimitive.Close asChild>
              <button
                className="modal-close-btn flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2,var(--color-surface))] text-[var(--color-text-muted)] transition-colors duration-100 hover:bg-[var(--color-border)] hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                aria-label="Close"
              >
                <X size={14} strokeWidth={2} />
              </button>
            </DialogPrimitive.Close>
          </DialogPrimitive.Title>

          {/* Content */}
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pb-[max(20px,env(safe-area-inset-bottom))]">
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
