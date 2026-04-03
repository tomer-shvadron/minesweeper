import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { type ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Optional class overrides for the dialog content (e.g. width). */
  className?: string;
  /** When true the modal uses a fixed height (min 420px, max 85dvh) instead of auto-sizing. Prevents layout shifts when tab content changes. */
  fixedHeight?: boolean;
}

export const Modal = ({
  isOpen,
  title,
  onClose,
  children,
  className,
  fixedHeight = false,
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
        className={
          className ??
          `modal-window fixed top-1/2 left-1/2 z-[101] flex max-w-[min(480px,92vw)] min-w-[320px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_24px_64px_rgba(0,0,0,0.2)] ${fixedHeight ? 'h-[min(500px,85dvh)]' : 'max-h-[85dvh]'}`
        }
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
