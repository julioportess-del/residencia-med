import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

type Estado = {
  carregado: boolean
  session: Session | null
  user: User | null
  signIn: (email: string, senha: string) => Promise<{ erro: string | null }>
  signUp: (email: string, senha: string, nome?: string) => Promise<{ erro: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<Estado | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [carregado, setCarregado] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCarregado(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signIn: Estado['signIn'] = async (email, senha) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: senha,
    })
    return { erro: error?.message ?? null }
  }

  const signUp: Estado['signUp'] = async (email, senha, nome) => {
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: senha,
      options: { data: { name: nome } },
    })
    return { erro: error?.message ?? null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{ carregado, session, user: session?.user ?? null, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthSession() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthSession deve estar dentro de <AuthProvider>')
  return ctx
}
