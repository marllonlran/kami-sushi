import { LOJA } from '../configuracao'

// Hora atual no fuso da loja (independe do fuso do aparelho do cliente).
function horaLoja() {
  const partes = new Intl.DateTimeFormat('pt-BR', {
    timeZone: LOJA.timeZone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(new Date())
  const h = Number(partes.find((p) => p.type === 'hour').value)
  const m = Number(partes.find((p) => p.type === 'minute').value)
  return h + m / 60
}

export function estaAberto() {
  // Para testar fora do horário: localStorage.setItem('kami:forceOpen', '1')
  try {
    if (localStorage.getItem('kami:forceOpen') === '1') return true
  } catch {}
  const h = horaLoja()
  return h >= LOJA.hours.open && h < LOJA.hours.close
}

export const rotuloHorario = `${LOJA.hours.open}h às ${LOJA.hours.close}h`
