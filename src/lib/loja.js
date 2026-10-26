// Estado da loja controlado pelo painel: pedidos pausados e itens esgotados.
// Com Supabase fica na tabela store_settings; sem ele, neste navegador (teste).
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const CHAVE_LOCAL = 'kami:store'
const EVENTO_LOCAL = 'kami:store-changed'
const PADRAO = { paused: false, soldOut: [] }

function lerLocal() {
  try {
    return { ...PADRAO, ...JSON.parse(localStorage.getItem(CHAVE_LOCAL)) }
  } catch {
    return PADRAO
  }
}

export async function obterConfigLoja() {
  if (!supabase) return lerLocal()
  const { data, error } = await supabase.from('store_settings').select('paused, sold_out').eq('id', 1).maybeSingle()
  if (error) throw error
  return data ? { paused: data.paused, soldOut: data.sold_out || [] } : PADRAO
}

export async function atualizarConfigLoja(alteracoes) {
  if (!supabase) {
    localStorage.setItem(CHAVE_LOCAL, JSON.stringify({ ...lerLocal(), ...alteracoes }))
    window.dispatchEvent(new Event(EVENTO_LOCAL))
    return
  }
  const registro = { updated_at: new Date().toISOString() }
  if ('paused' in alteracoes) registro.paused = alteracoes.paused
  if ('soldOut' in alteracoes) registro.sold_out = alteracoes.soldOut
  const { data, error } = await supabase.from('store_settings').update(registro).eq('id', 1).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('store_settings sem permissão ou sem a linha id = 1')
}

function assinar(cb) {
  if (!supabase) {
    const aoMudarArmazenamento = (e) => e.key === CHAVE_LOCAL && cb()
    window.addEventListener('storage', aoMudarArmazenamento)
    window.addEventListener(EVENTO_LOCAL, cb)
    return () => {
      window.removeEventListener('storage', aoMudarArmazenamento)
      window.removeEventListener(EVENTO_LOCAL, cb)
    }
  }
  const ch = supabase
    .channel(`store-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, () => cb())
    .subscribe()
  const temporizador = setInterval(cb, 30000)
  return () => {
    clearInterval(temporizador)
    supabase.removeChannel(ch)
  }
}

// { paused, soldOut: string[], loaded }. Se falhar (ex.: SQL ainda não rodado),
// segue com a loja aberta e nada esgotado.
export function useConfigLoja() {
  const [estado, setEstado] = useState({ ...PADRAO, loaded: false })
  useEffect(() => {
    const carregar = () =>
      obterConfigLoja().then(
        (s) => setEstado({ ...s, loaded: true }),
        (e) => console.error(e),
      )
    carregar()
    return assinar(carregar)
  }, [])
  return estado
}
