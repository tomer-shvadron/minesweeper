import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { type ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Extra Tailwind classes appended to the dialog content (e.g. custom width). Height constraints are always enforced by the component. */
  className?: string;
  /** Lock height to max (50 dvh). Use for content-heavy modals like Leaderboard. */
  fullHeight?: boolean;
}

/** Base layout classes — always applied so no caller can bypass them. */
const BASE_CLASS =
  'modal-window fixed top-1/2 left-1/2 z-[101] flex -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_24px_64px_rgba(0,0,0,0.2)]';

/** Default width when no className override is provided. */
const DEFAULT_WIDTH = 'max-w-[min(480px,92vw)] min-w-[320px]';

export const Modal = ({
  isOpen,
  title,
  onClose,
  children,
  className,
  fullHeight = false,
}: ModalProps) => (
  <DialogPrimitive.Root
    open={isOpen}
    onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}
  >
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className="modal-backdrop fixed inset-0 z-[100] bg-black/35 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <DialogPrimitive.Content
        className={`${BASE_CLASS} ${fullHeight ? 'h-[50dvh]' : 'max-h-[50dvh] min-h-[33dvh]'} ${className ?? DEFAULT_WIDTH}`}
        aria-describedby={undefined}
      >
        <DialogPrimitive.Title className="modal-title-bar flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3 text-base font-semibold text-[var(--color-text)] select-none">
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
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
);
