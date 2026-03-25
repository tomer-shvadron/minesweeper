import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { type ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export const Modal = ({ isOpen, title, onClose, children }: ModalProps) => (
  <DialogPrimitive.Root
    open={isOpen}
    onOpenChange={(open) => {
      if (!open) {
        onClose()
      }
    }}
  >
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="modal-backdrop" onClick={onClose} />
      <DialogPrimitive.Content className="modal-window" aria-describedby={undefined}>
        <DialogPrimitive.Title className="modal-title-bar">
          <span>{title}</span>
          <DialogPrimitive.Close asChild>
            <button className="modal-close-btn" aria-label="Close">
              <X size={10} strokeWidth={2.5} />
            </button>
          </DialogPrimitive.Close>
        </DialogPrimitive.Title>
        <div className="modal-content">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
)
