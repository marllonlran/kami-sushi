// Código Pix "copia e cola" (BR Code estático do Banco Central), com valor.
// Formato EMV: cada campo é ID (2 dígitos) + tamanho (2 dígitos) + valor,
// terminando com o CRC16 (CCITT-FALSE) do texto inteiro.
import { LOJA } from '../configuracao'

const campo = (id, valor) => `${id}${String(valor.length).padStart(2, '0')}${valor}`

// Nome e cidade: maiúsculas, sem acentos nem símbolos (exigência do padrão).
const higienizar = (texto, max) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .trim()
    .toUpperCase()
    .slice(0, max)

function crc16(texto) {
  let crc = 0xffff
  for (let i = 0; i < texto.length; i++) {
    crc ^= texto.charCodeAt(i) << 8
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

// Só gera o código quando nome e cidade da conta estão no configuracao.js.
export const pixPronto = Boolean(LOJA.pixName && LOJA.pixCity)

export function codigoPix(valorTotal) {
  if (!pixPronto) return null
  const payload = [
    campo('00', '01'),
    campo('26', campo('00', 'br.gov.bcb.pix') + campo('01', LOJA.pixKeyEmv)),
    campo('52', '0000'),
    campo('53', '986'),
    valorTotal > 0 ? campo('54', valorTotal.toFixed(2)) : '',
    campo('58', 'BR'),
    campo('59', higienizar(LOJA.pixName, 25)),
    campo('60', higienizar(LOJA.pixCity, 15)),
    campo('62', campo('05', '***')),
    '6304',
  ].join('')
  return payload + crc16(payload)
}
