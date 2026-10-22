// Estado da loja controlado pelo painel: pedidos pausados e itens esgotados.
// Com Supabase fica na tabela store_settings; sem ele, neste navegador (teste).
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const LOCAL_KEY = 'kami:store'
const LOCAL_EVENT = 'kami:store-changed'
const DEFAULT = { paused: false, soldOut: [] }

function readLocal() {
  try {
    return { ...DEFAULT, ...JSON.parse(localStorage.getItem(LOCAL_KEY)) }
  } catch {
    return DEFAULT
  }
}

export async function getStoreSettings() {
  if (!supabase) return readLocal()
  const { data, error } = await supabase.from('store_settings').select('paused, sold_out').eq('id', 1).maybeSingle()
  if (error) throw error
  return data ? { paused: data.paused, soldOut: data.sold_out || [] } : DEFAULT
}

export async function updateStoreSettings(patch) {
  if (!supabase) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify({ ...readLocal(), ...patch }))
    window.dispatchEvent(new Event(LOCAL_EVENT))
    return
  }
  const row = { updated_at: new Date().toISOString() }
  if ('paused' in patch) row.paused = patch.paused
  if ('soldOut' in patch) row.sold_out = patch.soldOut
  const { data, error } = await supabase.from('store_settings').update(row).eq('id', 1).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('store_settings sem permissão ou sem a linha id = 1')
}

function subscribe(cb) {
  if (!supabase) {
    const onStorage = (e) => e.key === LOCAL_KEY && cb()
    window.addEventListener('storage', onStorage)
    window.addEventListener(LOCAL_EVENT, cb)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(LOCAL_EVENT, cb)
    }
  }
  const ch = supabase
    .channel(`store-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, () => cb())
    .subscribe()
  const timer = setInterval(cb, 30000)
  return () => {
    clearInterval(timer)
    supabase.removeChannel(ch)
  }
}

// { paused, soldOut: string[], loaded }. Se falhar (ex.: SQL ainda não rodado),
// segue com a loja aberta e nada esgotado.
export function useStoreSettings() {
  const [state, setState] = useState({ ...DEFAULT, loaded: false })
  useEffect(() => {
    const load = () =>
      getStoreSettings().then(
        (s) => setState({ ...s, loaded: true }),
        (e) => console.error(e),
      )
    load()
    return subscribe(load)
  }, [])
  return state
}
