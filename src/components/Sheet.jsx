import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'

// Modal que vira "bottom sheet" no celular.
export default function Sheet({ onClose, label, children, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.classList.add('no-scroll')
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('no-scroll')
    }
  }, [onClose])

  return createPortal(
    <div className="sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`sheet ${wide ? 'sheet--wide' : ''}`} role="dialog" aria-modal="true" aria-label={label}>
        <button type="button" className="sheet__close icon-btn" onClick={onClose} aria-label="Fechar">
          <Icon name="close" />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  )
}
