// Login da equipe. Com Supabase: e-mail e senha de usuários criados no painel
// do Supabase. Sem Supabase (modo local de teste): PIN do config.js.
import { useEffect, useState } from 'react'
import { STORE } from '../config'
import { supabase } from './supabase'

const PIN_KEY = 'kami:admin'
const PIN_EVENT = 'kami:admin-changed'

export async function signIn({ email, password, pin }) {
  if (supabase) {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    return !error
  }
  if (pin !== STORE.adminPin) return false
  sessionStorage.setItem(PIN_KEY, '1')
  window.dispatchEvent(new Event(PIN_EVENT))
  return true
}

export async function signOut() {
  if (supabase) return supabase.auth.signOut()
  sessionStorage.removeItem(PIN_KEY)
  window.dispatchEvent(new Event(PIN_EVENT))
}

// { ready, authed }: ready = já sabemos se há sessão.
export function useStaffSession() {
  const [state, setState] = useState(() =>
    supabase ? { ready: false, authed: false } : { ready: true, authed: sessionStorage.getItem(PIN_KEY) === '1' },
  )

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => setState({ ready: true, authed: !!data.session }))
      const { data } = supabase.auth.onAuthStateChange((_e, session) => setState({ ready: true, authed: !!session }))
      return () => data.subscription.unsubscribe()
    }
    const onChange = () => setState({ ready: true, authed: sessionStorage.getItem(PIN_KEY) === '1' })
    window.addEventListener(PIN_EVENT, onChange)
    return () => window.removeEventListener(PIN_EVENT, onChange)
  }, [])

  return state
}
