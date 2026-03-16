import type { SubscriptionTier } from '@/types/database'
import { supabase } from '@/lib/supabase'

// ============================================================
// DODO PAYMENTS CONFIG (dynamic — managed from Admin → Settings → Payments)
// Hardcoded defaults used as fallback before settings load
// ============================================================
const DODO_DEFAULTS = {
  api_url: 'https://test.dodopayments.com',
  checkout_url: 'https://test.checkout.dodopayments.com',
  products: {
    pro_monthly: 'pdt_0NZeflk6sMciMDCDaISyM',
    pro_yearly: 'pdt_0NZeg9SRFVl8jmcddwvYr',
    team_monthly: 'pdt_0NZegK9n5gtXuS0DMCxg0',
    team_yearly: 'pdt_0NZegQobfQot4otEu6uUi',
    deep_dive_report: 'pdt_0NZegZxNdvYC509J4arcj',
  },
}

// In-memory cache for payment settings
let _dodoCache: Record<string, string> = {}
let _dodoCacheLoaded = false

export async function loadDodoConfig(): Promise<void> {
  try {
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .eq('category', 'payments')
    if (data) {
      for (const row of data as { key: string; value: string }[]) {
        _dodoCache[row.key] = row.value
      }
      _dodoCacheLoaded = true
    }
  } catch (err) {
    console.error('Failed to load dodo config:', err)
  }
}

export function getDodoApiUrl(): string {
  return _dodoCache.dodo_api_url || DODO_DEFAULTS.api_url
}

export function getDodoCheckoutUrl(): string {
  return _dodoCache.dodo_checkout_url || DODO_DEFAULTS.checkout_url
}

export const DODO_PRODUCTS = DODO_DEFAULTS.products
export const DODO_API_URL = DODO_DEFAULTS.api_url
export const DODO_CHECKOUT_URL = DODO_DEFAULTS.checkout_url

// ============================================================
// TIER CONFIGURATION
// ============================================================
export interface TierConfig {
  name: string
  tier: SubscriptionTier
  tagline: string
  monthlyPrice: number
  yearlyPrice: number
  features: string[]
  limits: {
    dailyIdeas: number        // ideas per day (-1 = unlimited)
    maxSavedIdeas: number     // bookmarks (-1 = unlimited)
    pdfExports: boolean       // can export PDFs
    detailedReports: boolean  // full market reports
    priorityGeneration: boolean
    teamWorkspace: boolean
    teamMembers: number       // max team members (0 = n/a)
    apiAccess: boolean
    commentVoting: boolean
  }
}

export const TIERS: Record<SubscriptionTier, TierConfig> = {
  free: {
    name: 'Free',
    tier: 'free',
    tagline: 'Get started for free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      '1 idea per day',
      'Browse public ideas',
      'Vote & comment on ideas',
      'Save up to 10 ideas',
      'Basic idea details',
    ],
    limits: {
      dailyIdeas: 1,
      maxSavedIdeas: 10,
      pdfExports: false,
      detailedReports: false,
      priorityGeneration: false,
      teamWorkspace: false,
      teamMembers: 0,
      apiAccess: false,
      commentVoting: true,
    },
  },
  pro: {
    name: 'Pro',
    tier: 'pro',
    tagline: 'For serious builders',
    monthlyPrice: 15,
    yearlyPrice: 144,
    features: [
      '10 ideas per day',
      'Everything in Free',
      'Detailed market reports',
      'Export ideas to PDF',
      'Priority AI generation',
      'Unlimited saved ideas',
      'Deep-dive business plans',
    ],
    limits: {
      dailyIdeas: 10,
      maxSavedIdeas: -1,
      pdfExports: true,
      detailedReports: true,
      priorityGeneration: true,
      teamWorkspace: false,
      teamMembers: 0,
      apiAccess: false,
      commentVoting: true,
    },
  },
  team: {
    name: 'Team',
    tier: 'team',
    tagline: 'Build together',
    monthlyPrice: 45,
    yearlyPrice: 468,
    features: [
      '30 ideas per day',
      'Everything in Pro',
      'Shared team workspace',
      'Up to 5 team members',
      'Team idea voting & assignment',
      'API access',
      'Priority support',
    ],
    limits: {
      dailyIdeas: 30,
      maxSavedIdeas: -1,
      pdfExports: true,
      detailedReports: true,
      priorityGeneration: true,
      teamWorkspace: true,
      teamMembers: 5,
      apiAccess: true,
      commentVoting: true,
    },
  },
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export function getTierConfig(tier: SubscriptionTier): TierConfig {
  return TIERS[tier] || TIERS.free
}

export function canGenerateIdea(tier: SubscriptionTier, dailyCount: number): boolean {
  const config = getTierConfig(tier)
  if (config.limits.dailyIdeas === -1) return true
  return dailyCount < config.limits.dailyIdeas
}

export function canSaveIdea(tier: SubscriptionTier, savedCount: number): boolean {
  const config = getTierConfig(tier)
  if (config.limits.maxSavedIdeas === -1) return true
  return savedCount < config.limits.maxSavedIdeas
}

export function canExportPDF(tier: SubscriptionTier): boolean {
  return getTierConfig(tier).limits.pdfExports
}

export function canViewDetailedReports(tier: SubscriptionTier): boolean {
  return getTierConfig(tier).limits.detailedReports
}

export function getProductId(tier: 'pro' | 'team', billing: 'monthly' | 'yearly'): string {
  const settingKey = `dodo_product_${tier}_${billing}`
  if (_dodoCacheLoaded && _dodoCache[settingKey]) return _dodoCache[settingKey]
  const key = `${tier}_${billing}` as keyof typeof DODO_PRODUCTS
  return DODO_PRODUCTS[key]
}

export function getDeepDiveProductId(): string {
  if (_dodoCacheLoaded && _dodoCache.dodo_product_deep_dive) return _dodoCache.dodo_product_deep_dive
  return DODO_PRODUCTS.deep_dive_report
}

export function getRemainingIdeas(tier: SubscriptionTier, dailyCount: number): number | null {
  const config = getTierConfig(tier)
  if (config.limits.dailyIdeas === -1) return null // unlimited
  return Math.max(0, config.limits.dailyIdeas - dailyCount)
}
