// Datas no fuso da loja (America/Fortaleza = UTC-3 o ano todo, sem horário de verão).
import { STORE } from '../config'

const OFFSET = '-03:00'
const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: STORE.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
const hourFmt = new Intl.DateTimeFormat('en-GB', { timeZone: STORE.timeZone, hour: '2-digit', hour12: false })
const DAY = 24 * 3600 * 1000

// "2026-10-22"
export const dayKey = (date) => dayFmt.format(new Date(date))
export const hourOf = (date) => Number(hourFmt.format(new Date(date))) % 24
export const startOfDay = (key) => new Date(`${key}T00:00:00${OFFSET}`)
export const addDays = (date, n) => new Date(date.getTime() + n * DAY)

// Lista de dias (chaves) de `from` até hoje.
export function daysUntilToday(from) {
  const today = dayKey(new Date())
  const out = []
  for (let d = from; ; d = addDays(d, 1)) {
    const k = dayKey(d)
    out.push(k)
    if (k >= today) break
  }
  return out
}

const WEEKDAY = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
// "22/10" e "qua"
export function dayLabel(key) {
  const [, m, d] = key.split('-')
  return `${d}/${m}`
}
export function weekday(key) {
  return WEEKDAY[new Date(`${key}T12:00:00Z`).getUTCDay()]
}
