// Código Pix "copia e cola" (BR Code estático do Banco Central), com valor.
// Formato EMV: cada campo é ID (2 dígitos) + tamanho (2 dígitos) + valor,
// terminando com o CRC16 (CCITT-FALSE) do texto inteiro.
import { STORE } from '../config'

const field = (id, value) => `${id}${String(value.length).padStart(2, '0')}${value}`

// Nome e cidade: maiúsculas, sem acentos nem símbolos (exigência do padrão).
const clean = (text, max) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .trim()
    .toUpperCase()
    .slice(0, max)

function crc16(text) {
  let crc = 0xffff
  for (let i = 0; i < text.length; i++) {
    crc ^= text.charCodeAt(i) << 8
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

// Só gera o código quando nome e cidade da conta estão no config.js.
export const pixReady = Boolean(STORE.pixName && STORE.pixCity)

export function pixCode(amount) {
  if (!pixReady) return null
  const payload = [
    field('00', '01'),
    field('26', field('00', 'br.gov.bcb.pix') + field('01', STORE.pixKeyEmv)),
    field('52', '0000'),
    field('53', '986'),
    amount > 0 ? field('54', amount.toFixed(2)) : '',
    field('58', 'BR'),
    field('59', clean(STORE.pixName, 25)),
    field('60', clean(STORE.pixCity, 15)),
    field('62', field('05', '***')),
    '6304',
  ].join('')
  return payload + crc16(payload)
}
