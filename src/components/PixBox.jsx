import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { STORE } from '../config'
import { money } from '../lib/format'
import { pixCode } from '../lib/pix'
import Icon from './Icon'

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const t = document.createElement('textarea')
    t.value = text
    document.body.appendChild(t)
    t.select()
    document.execCommand('copy')
    t.remove()
  }
}

export default function PixBox({ amount, compact = false }) {
  const [copied, setCopied] = useState(null)
  const [qr, setQr] = useState(null)
  // Código "copia e cola" com o valor (só existe com nome e cidade no config.js).
  const code = amount != null ? pixCode(amount) : null

  useEffect(() => {
    if (!code) return setQr(null)
    let alive = true
    QRCode.toString(code, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } }).then(
      (svg) => alive && setQr(svg),
      (e) => console.error(e),
    )
    return () => {
      alive = false
    }
  }, [code])

  async function copy(text, which) {
    await copyText(text)
    setCopied(which)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className={`pix-box ${compact ? 'pix-box--compact' : ''}`}>
      {code && (
        <div className="pix-qr">
          {qr && <div className="pix-qr__img" role="img" aria-label="QR Code Pix" dangerouslySetInnerHTML={{ __html: qr }} />}
          <div className="pix-qr__body">
            <p className="pix-qr__title">Pague {money(amount)} com Pix</p>
            <p className="pix-box__hint">No app do banco, escolha <strong>Pix copia e cola</strong> e cole o código. O valor já vem preenchido.</p>
            <button type="button" className={`btn btn--primary btn--sm btn--block ${copied === 'code' ? 'is-done' : ''}`} onClick={() => copy(code, 'code')}>
              <Icon name={copied === 'code' ? 'check' : 'copy'} size={16} />
              {copied === 'code' ? 'Código copiado!' : 'Copiar código Pix'}
            </button>
          </div>
        </div>
      )}
      <div className="pix-box__row">
        <div>
          <p className="pix-box__label">{code ? 'Ou use a chave' : 'Chave Pix'} ({STORE.pixKeyType})</p>
          <p className="pix-box__key">{STORE.pixKeyDisplay}</p>
        </div>
        <button type="button" className={`btn btn--ghost btn--sm ${copied === 'key' ? 'is-done' : ''}`} onClick={() => copy(STORE.pixKey, 'key')}>
          <Icon name={copied === 'key' ? 'check' : 'copy'} size={16} />
          {copied === 'key' ? 'Copiada!' : 'Copiar'}
        </button>
      </div>
      {amount != null && (
        <p className="pix-box__hint">
          {code ? 'Depois de pagar, envie o comprovante pelo WhatsApp.' : <>Valor: <strong>{money(amount)}</strong>. Depois de pagar, envie o comprovante pelo WhatsApp.</>}
        </p>
      )}
    </div>
  )
}
