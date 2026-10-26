// Datas no fuso da loja (America/Fortaleza = UTC-3 o ano todo, sem horário de verão).
import { LOJA } from '../configuracao'

const FUSO = '-03:00'
const formatoDia = new Intl.DateTimeFormat('en-CA', { timeZone: LOJA.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
const formatoHora = new Intl.DateTimeFormat('en-GB', { timeZone: LOJA.timeZone, hour: '2-digit', hour12: false })
const DIA = 24 * 3600 * 1000

// "2026-10-22"
export const chaveDia = (dados) => formatoDia.format(new Date(dados))
export const horaDe = (dados) => Number(formatoHora.format(new Date(dados))) % 24
export const inicioDoDia = (chave) => new Date(`${chave}T00:00:00${FUSO}`)
export const somarDias = (dados, n) => new Date(dados.getTime() + n * DIA)

// Lista de dias (chaves) de `inicio` até hoje.
export function diasAteHoje(inicio) {
  const hoje = chaveDia(new Date())
  const saida = []
  for (let d = inicio; ; d = somarDias(d, 1)) {
    const k = chaveDia(d)
    saida.push(k)
    if (k >= hoje) break
  }
  return saida
}

const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
// "22/10" e "qua"
export function rotuloDia(chave) {
  const [, m, d] = chave.split('-')
  return `${d}/${m}`
}
export function diaSemana(chave) {
  return DIAS_SEMANA[new Date(`${chave}T12:00:00Z`).getUTCDay()]
}
