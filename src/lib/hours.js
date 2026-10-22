import { STORE } from '../config'

// Hora atual no fuso da loja (independe do fuso do aparelho do cliente).
function storeHour() {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: STORE.timeZone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(new Date())
  const h = Number(parts.find((p) => p.type === 'hour').value)
  const m = Number(parts.find((p) => p.type === 'minute').value)
  return h + m / 60
}

export function isOpen() {
  // Para testar fora do horário: localStorage.setItem('kami:forceOpen', '1')
  try {
    if (localStorage.getItem('kami:forceOpen') === '1') return true
  } catch {}
  const h = storeHour()
  return h >= STORE.hours.open && h < STORE.hours.close
}

export const hoursLabel = `${STORE.hours.open}h às ${STORE.hours.close}h`
