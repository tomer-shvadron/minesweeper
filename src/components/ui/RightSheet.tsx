import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { type ReactNode, useCallback, useRef } from 'react';

interface RightSheetProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Right-side sheet for mobile landscape settings.
 * Slides in from the right. Swipe right to dismiss.
 */
export const RightSheet = ({ isOpen, title, onClose, children }: RightSheetProps) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number | null>(null);
  const currentTranslateX = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) {
      return;
    }
    dragStartX.current = touch.clientX;
    currentTranslateX.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (dragStartX.current === null) {
      return;
    }
    const touch = e.touches[0];
    if (!touch) {
      return;
    }
    const dx = touch.clientX - dragStartX.current;
    // Only allow dragging rightward (positive dx)
    if (dx > 0 && sheetRef.current) {
      currentTranslateX.current = dx;
      sheetRef.current.style.transform = `translateX(${dx}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (dragStartX.current === null) {
      return;
    }
    const sheet = sheetRef.current;
    dragStartX.current = null;

    if (currentTranslateX.current > 100) {
      onClose();
    }
    if (sheet) {
      sheet.style.transform = '';
    }
    currentTranslateX.current = 0;
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
          className="modal-window fixed top-0 right-0 bottom-0 z-[101] flex w-[min(70vw,320px)] flex-col overflow-hidden border-l border-[var(--color-border)] bg-[var(--color-surface)] shadow-[-16px_0_48px_rgba(0,0,0,0.15)] data-[state=closed]:animate-[slideOutRight_0.15s_ease] data-[state=open]:animate-[slideInRight_0.2s_ease]"
          aria-describedby={undefined}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Title bar */}
          <DialogPrimitive.Title className="modal-title-bar flex items-center justify-between px-4 py-3 text-base font-semibold text-[var(--color-text)] select-none">
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
          <div
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4"
            style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 0px))' }}
          >
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
