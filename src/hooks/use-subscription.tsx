import { useAuth } from '@/hooks/use-auth'
import { getTierConfig, canGenerateIdea, canSaveIdea, canExportPDF, getRemainingIdeas } from '@/lib/subscription'
import type { SubscriptionTier } from '@/types/database'
import { supabase } from '@/lib/supabase'
import { useCallback, useMemo } from 'react'

export function useSubscription() {
  const { user, profile, refreshProfile } = useAuth()

  const tier: SubscriptionTier = (profile?.subscription_tier as SubscriptionTier) || 'free'
  const config = getTierConfig(tier)

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

  const incrementDailyGeneration = useCallback(async () => {
    if (!user) return
    // Use server-side RPC that enforces limits and can't be bypassed
    await (supabase.rpc as any)('increment_daily_generation')
    // Refresh profile so React state reflects the new count
    await refreshProfile()
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
    isPro: tier === 'pro' || tier === 'team',
    isTeam: tier === 'team',
    isFree: tier === 'free',
    dailyGenerated,
    remainingIdeas,
    checkCanGenerate,
    checkCanSave,
    checkCanExport,
    incrementDailyGeneration,
    createCheckout,
  }
}
