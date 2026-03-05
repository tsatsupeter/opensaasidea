import { useAuth } from '@/hooks/use-auth'
import { getTierConfig, canGenerateIdea, canSaveIdea, canExportPDF, getRemainingIdeas } from '@/lib/subscription'
import type { SubscriptionTier } from '@/types/database'
import { supabase } from '@/lib/supabase'
import { useCallback, useMemo, useState, useEffect } from 'react'

export function useSubscription() {
  const { user, profile, refreshProfile } = useAuth()
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly' | null>(null)

  const tier: SubscriptionTier = (profile?.subscription_tier as SubscriptionTier) || 'free'
  const config = getTierConfig(tier)

  // Fetch billing period from subscriptions table
  useEffect(() => {
    if (!user || tier === 'free') {
      setBillingPeriod(null)
      return
    }
    ;(async () => {
      try {
        const { data } = await supabase
          .from('subscriptions' as any)
          .select('billing_period')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .eq('tier', tier)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        setBillingPeriod((data as any)?.billing_period ?? null)
      } catch {
        setBillingPeriod(null)
      }
    })()
  }, [user, tier])

  // Date-aware daily count: reset to 0 if last_generation_date is not today
  const dailyGenerated = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    if (profile?.last_generation_date !== today) return 0
    return profile?.daily_ideas_generated || 0
  }, [profile?.last_generation_date, profile?.daily_ideas_generated])

  const checkCanGenerate = useCallback((): boolean => {
    return canGenerateIdea(tier, dailyGenerated)
  }, [tier, dailyGenerated])

  const checkCanSave = useCallback((savedCount: number): boolean => {
    return canSaveIdea(tier, savedCount)
  }, [tier])

  const checkCanExport = useCallback((): boolean => {
    return canExportPDF(tier)
  }, [tier])

  const remainingIdeas = getRemainingIdeas(tier, dailyGenerated)

  // Fresh server-side check: query DB directly to avoid stale React state
  const serverCheckCanGenerate = useCallback(async (): Promise<boolean> => {
    if (!user) return false
    try {
      const { data } = await supabase
        .from('profiles')
        .select('subscription_tier, daily_ideas_generated, last_generation_date')
        .eq('id', user.id)
        .single()
      if (!data) return false
      const today = new Date().toISOString().split('T')[0]
      const count = (data as any).last_generation_date === today ? ((data as any).daily_ideas_generated || 0) : 0
      const t = ((data as any).subscription_tier || 'free') as SubscriptionTier
      return canGenerateIdea(t, count)
    } catch {
      return false
    }
  }, [user])

  const incrementDailyGeneration = useCallback(async (): Promise<boolean> => {
    if (!user) return false
    try {
      // Use server-side RPC that enforces limits atomically
      const { data, error } = await (supabase.rpc as any)('increment_daily_generation')
      if (error) {
        console.error('incrementDailyGeneration RPC error:', error)
        return false
      }
      if (data?.error) {
        console.warn('incrementDailyGeneration RPC limit:', data)
        await refreshProfile()
        return false
      }
      await refreshProfile()
      return true
    } catch (err) {
      console.error('incrementDailyGeneration exception:', err)
      return false
    }
  }, [user, refreshProfile])

  const decrementDailyGeneration = useCallback(async (): Promise<boolean> => {
    if (!user) return false
    try {
      const { data, error } = await (supabase.rpc as any)('decrement_daily_generation')
      if (error) {
        console.error('decrementDailyGeneration RPC error:', error)
        return false
      }
      if (data?.error) {
        console.warn('decrementDailyGeneration RPC:', data)
        return false
      }
      await refreshProfile()
      return true
    } catch (err) {
      console.error('decrementDailyGeneration exception:', err)
      return false
    }
  }, [user, refreshProfile])

  const createCheckout = useCallback(async (productId: string, options?: { idea_id?: string; idea_slug?: string }) => {
    if (!user) return null

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { product_id: productId, ...options },
      })

      if (error) {
        console.error('Checkout error:', error)
        // Try to parse response body from FunctionsHttpError
        if (error.context?.body) {
          try {
            const body = typeof error.context.body === 'string'
              ? JSON.parse(error.context.body)
              : error.context.body
            if (body?.checkout_url) return body.checkout_url as string
          } catch { /* ignore parse errors */ }
        }
        return null
      }

      return data?.checkout_url as string | null
    } catch (err) {
      console.error('Checkout exception:', err)
      return null
    }
  }, [user])

  return {
    tier,
    config,
    billingPeriod,
    isPro: tier === 'pro' || tier === 'team',
    isTeam: tier === 'team',
    isFree: tier === 'free',
    dailyGenerated,
    remainingIdeas,
    checkCanGenerate,
    serverCheckCanGenerate,
    checkCanSave,
    checkCanExport,
    incrementDailyGeneration,
    decrementDailyGeneration,
    createCheckout,
  }
}
