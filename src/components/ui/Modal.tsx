import { type ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  isOpen: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

/**
 * Base modal — renders via portal to avoid z-index issues.
 * XP-style: blue title bar + gray content panel.
 */
export const Modal = ({ isOpen, title, onClose, children }: ModalProps) => {
  // Lock body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  return createPortal(
    <div className="modal-backdrop" role="dialog" aria-modal aria-label={title}>
      {/* Backdrop click closes modal */}
      <div className="modal-backdrop__hit" onClick={onClose} aria-hidden />
      <div className="modal-window">
        <div className="modal-title-bar">
          <span className="modal-title">{title}</span>
          <button className="modal-close-btn" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-content">{children}</div>
      </div>
    </div>,
    document.body
  )
}
