import { useState } from 'react'
import { STORE } from '../config'
import { money } from '../lib/format'
import Icon from './Icon'

export default function PixBox({ amount, compact = false }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(STORE.pixKey)
    } catch {
      const t = document.createElement('textarea')
      t.value = STORE.pixKey
      document.body.appendChild(t)
      t.select()
      document.execCommand('copy')
      t.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`pix-box ${compact ? 'pix-box--compact' : ''}`}>
      <div className="pix-box__row">
        <div>
          <p className="pix-box__label">Chave Pix ({STORE.pixKeyType})</p>
          <p className="pix-box__key">{STORE.pixKeyDisplay}</p>
        </div>
        <button type="button" className={`btn btn--ghost btn--sm ${copied ? 'is-done' : ''}`} onClick={copy}>
          <Icon name={copied ? 'check' : 'copy'} size={16} />
          {copied ? 'Copiada!' : 'Copiar'}
        </button>
      </div>
      {amount != null && (
        <p className="pix-box__hint">
          Valor: <strong>{money(amount)}</strong>. Depois de pagar, envie o comprovante pelo WhatsApp.
        </p>
      )}
    </div>
  )
}
