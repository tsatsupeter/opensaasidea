import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      setProfile(data as Profile | null)
    } catch (err) {
      console.error('fetchProfile failed:', err)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id)
  }, [user, fetchProfile])

  useEffect(() => {
    let settled = false

    // Safety timeout: if getSession hangs (e.g. corrupted localStorage / navigator.locks stuck),
    // force-clear auth state so the app doesn't stay stuck forever.
    const timeout = setTimeout(() => {
      if (!settled) {
        console.warn('Auth init timed out – clearing stale session')
        settled = true
        setLoading(false)
      }
    }, 5000)

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        try { await fetchProfile(s.user.id) } catch (e) { console.error('Profile fetch failed:', e) }
      }
      setLoading(false)
    }).catch((err) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      console.error('getSession failed:', err)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        try { await fetchProfile(s.user.id) } catch (e) { console.error('Profile fetch failed:', e) }
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    return { error: error as Error | null }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('signOut failed:', err)
    }
    setSession(null)
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
