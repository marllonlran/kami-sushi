// Login da equipe. Com Supabase: e-mail e senha de usuários criados no painel
// do Supabase. Sem Supabase (modo local de teste): PIN do configuracao.js.
import { useEffect, useState } from 'react'
import { LOJA } from '../configuracao'
import { supabase } from './supabase'

const CHAVE_PIN = 'kami:admin'
const EVENTO_PIN = 'kami:admin-changed'

export async function entrar({ email, password, pin }) {
  if (supabase) {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    return !error
  }
  if (pin !== LOJA.adminPin) return false
  sessionStorage.setItem(CHAVE_PIN, '1')
  window.dispatchEvent(new Event(EVENTO_PIN))
  return true
}

export async function sair() {
  if (supabase) return supabase.auth.signOut()
  sessionStorage.removeItem(CHAVE_PIN)
  window.dispatchEvent(new Event(EVENTO_PIN))
}

// { ready, authed }: ready = já sabemos se há sessão.
export function useSessaoEquipe() {
  const [estado, setEstado] = useState(() =>
    supabase ? { ready: false, authed: false } : { ready: true, authed: sessionStorage.getItem(CHAVE_PIN) === '1' },
  )

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => setEstado({ ready: true, authed: !!data.session }))
      const { data } = supabase.auth.onAuthStateChange((_e, sessao) => setEstado({ ready: true, authed: !!sessao }))
      return () => data.subscription.unsubscribe()
    }
    const aoMudar = () => setEstado({ ready: true, authed: sessionStorage.getItem(CHAVE_PIN) === '1' })
    window.addEventListener(EVENTO_PIN, aoMudar)
    return () => window.removeEventListener(EVENTO_PIN, aoMudar)
  }, [])

  return estado
}
