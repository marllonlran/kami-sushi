import { useEffect, useState } from 'react'
import { LOJA } from '../configuracao'
import { moeda } from '../lib/formatacao'
import { codigoPix } from '../lib/pix'
import Icone from './Icone'

async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto)
  } catch {
    const t = document.createElement('textarea')
    t.value = texto
    document.body.appendChild(t)
    t.select()
    document.execCommand('copy')
    t.remove()
  }
}

export default function CaixaPix({ amount, compact = false }) {
  const [copiado, setCopiado] = useState(null)
  const [qr, setQr] = useState(null)
  // Código "copia e cola" com o valor (só existe com nome e cidade no configuracao.js).
  const codigo = amount != null ? codigoPix(amount) : null

  useEffect(() => {
    if (!codigo) return setQr(null)
    let emExecucao = true
    // A biblioteca de QR só é baixada quando o cliente escolhe Pix.
    import('qrcode')
      .then(({ default: QRCode }) =>
        QRCode.toString(codigo, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } }),
      )
      .then(
        (svg) => emExecucao && setQr(svg),
        (e) => console.error(e),
      )
    return () => {
      emExecucao = false
    }
  }, [codigo])

  async function copiar(texto, qual) {
    await copiarTexto(texto)
    setCopiado(qual)
    setTimeout(() => setCopiado(null), 2000)
  }

  return (
    <div className={`pix-box ${compact ? 'pix-box--compact' : ''}`}>
      {codigo && (
        <div className="pix-qr">
          {qr && <div className="pix-qr__img" role="img" aria-label="QR Code Pix" dangerouslySetInnerHTML={{ __html: qr }} />}
          <div className="pix-qr__body">
            <p className="pix-qr__title">Pague {moeda(amount)} com Pix</p>
            <p className="pix-box__hint">No app do banco, escolha <strong>Pix copia e cola</strong> e cole o código. O valor já vem preenchido.</p>
            <button type="button" className={`btn btn--primary btn--sm btn--block ${copiado === 'code' ? 'is-done' : ''}`} onClick={() => copiar(codigo, 'code')}>
              <Icone name={copiado === 'code' ? 'check' : 'copy'} size={16} />
              {copiado === 'code' ? 'Código copiado!' : 'Copiar código Pix'}
            </button>
          </div>
        </div>
      )}
      <div className="pix-box__row">
        <div>
          <p className="pix-box__label">{codigo ? 'Ou use a chave' : 'Chave Pix'} ({LOJA.pixKeyType})</p>
          <p className="pix-box__key">{LOJA.pixKeyDisplay}</p>
        </div>
        <button type="button" className={`btn btn--ghost btn--sm ${copiado === 'key' ? 'is-done' : ''}`} onClick={() => copiar(LOJA.pixKey, 'key')}>
          <Icone name={copiado === 'key' ? 'check' : 'copy'} size={16} />
          {copiado === 'key' ? 'Copiada!' : 'Copiar'}
        </button>
      </div>
      {amount != null && (
        <p className="pix-box__hint">
          {codigo ? 'Depois de pagar, envie o comprovante pelo WhatsApp.' : <>Valor: <strong>{moeda(amount)}</strong>. Depois de pagar, envie o comprovante pelo WhatsApp.</>}
        </p>
      )}
    </div>
  )
}
