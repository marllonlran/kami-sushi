import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import Icone from './Icone'

// Modal que vira "bottom sheet" no celular.
export default function Gaveta({ onClose, label, children, wide = false }) {
  useEffect(() => {
    const aoTeclar = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', aoTeclar)
    document.body.classList.add('no-scroll')
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.classList.remove('no-scroll')
    }
  }, [onClose])

  return createPortal(
    <div className="sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`sheet ${wide ? 'sheet--wide' : ''}`} role="dialog" aria-modal="true" aria-label={label}>
        <button type="button" className="sheet__close icon-btn" onClick={onClose} aria-label="Fechar">
          <Icone name="close" />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  )
}
