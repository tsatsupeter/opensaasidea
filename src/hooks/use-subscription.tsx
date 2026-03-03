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
    const today = new Date().toISOString().split('T')[0]
    const isNewDay = profile?.last_generation_date !== today

    await (supabase.from('profiles') as any)
      .update({
        daily_ideas_generated: isNewDay ? 1 : (profile?.daily_ideas_generated || 0) + 1,
        last_generation_date: today,
      })
      .eq('id', user.id)

    // Refresh profile so React state reflects the new count
    await refreshProfile()
  }, [user, profile, refreshProfile])

  const createCheckout = useCallback(async (productId: string) => {
    if (!user) return null

    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { product_id: productId },
    })

    if (error) {
      console.error('Checkout error:', error)
      return null
    }

    return data?.checkout_url as string | null
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
