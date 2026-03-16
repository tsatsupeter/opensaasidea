import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react'
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

  // Track current user ID to avoid unnecessary state updates on token refresh.
  // Token refresh fires onAuthStateChange with a NEW user object (different reference,
  // same ID). Without this guard, every refresh cascades through useCallback/useEffect
  // chains across the app, triggering loading states on every page.
  const userIdRef = useRef<string | null>(null)

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
      userIdRef.current = s?.user?.id ?? null
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
      // Always keep session fresh (supabase client uses it for API calls)
      setSession(s)

      const newUserId = s?.user?.id ?? null
      const userChanged = newUserId !== userIdRef.current
      userIdRef.current = newUserId

      if (userChanged) {
        // Actual sign-in / sign-out — update user + profile
        setUser(s?.user ?? null)
        if (s?.user) {
          try { await fetchProfile(s.user.id) } catch (e) { console.error('Profile fetch failed:', e) }
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
      // Token refresh (same user ID) — session updated above, skip user/profile
      // to avoid cascading re-renders and loading flashes across all pages
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  // Proactively refresh session when tab becomes visible after idle.
  // Browsers throttle background timers, so the supabase auto-refresh may
  // have missed a tick. This ensures API calls work immediately on tab focus.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        supabase.auth.getSession()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

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
