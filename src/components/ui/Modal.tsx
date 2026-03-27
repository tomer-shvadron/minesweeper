import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { type ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export const Modal = ({ isOpen, title, onClose, children }: ModalProps) => (
  <DialogPrimitive.Root
    open={isOpen}
    onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}
  >
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/45" onClick={onClose} />
      <DialogPrimitive.Content
        className="fixed top-1/2 left-1/2 z-[101] flex max-h-[90dvh] max-w-[min(520px,94vw)] min-w-[340px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden bg-[var(--color-surface)] shadow-[inset_2px_2px_0_var(--color-border-light),inset_-2px_-2px_0_var(--color-border-darker),4px_4px_8px_rgba(0,0,0,0.4)]"
        aria-describedby={undefined}
      >
        <DialogPrimitive.Title className="flex items-center justify-between bg-[var(--color-titlebar-bg)] p-[4px_6px_4px_8px] text-[0.9375rem] font-bold text-[var(--color-titlebar-text)] select-none">
          <span>{title}</span>
          <DialogPrimitive.Close asChild>
            <button
              className="flex h-[18px] w-5 cursor-pointer items-center justify-center border-none bg-[var(--color-surface)] text-xs leading-none text-[var(--color-text)] shadow-[inset_1px_1px_0_var(--color-border-light),inset_-1px_-1px_0_var(--color-border-dark)] outline-none active:shadow-[inset_-1px_-1px_0_var(--color-border-light),inset_1px_1px_0_var(--color-border-dark)]"
              aria-label="Close"
            >
              <X size={10} strokeWidth={2.5} />
            </button>
          </DialogPrimitive.Close>
        </DialogPrimitive.Title>
        <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto p-[18px]">
          {children}
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
);
