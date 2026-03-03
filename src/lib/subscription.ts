import type { SubscriptionTier } from '@/types/database'

// ============================================================
// DODO PAYMENTS PRODUCT IDS
// Replace these with your actual product IDs from the Dodo dashboard
// https://app.dodopayments.com/
// ============================================================
export const DODO_PRODUCTS = {
  pro_monthly: 'prd_REPLACE_WITH_PRO_MONTHLY_ID',
  pro_yearly: 'prd_REPLACE_WITH_PRO_YEARLY_ID',
  team_monthly: 'prd_REPLACE_WITH_TEAM_MONTHLY_ID',
  team_yearly: 'prd_REPLACE_WITH_TEAM_YEARLY_ID',
  deep_dive_report: 'prd_REPLACE_WITH_DEEP_DIVE_ID',
} as const

// Dodo API base URL (switch to live when ready)
export const DODO_API_URL = 'https://test.dodopayments.com'
export const DODO_CHECKOUT_URL = 'https://test.checkout.dodopayments.com'

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
    tagline: 'Get started with SaaS ideas',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'Browse public ideas',
      'Vote & comment on ideas',
      '1 private idea per day',
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
      'Everything in Free',
      'Unlimited private ideas',
      'Detailed market reports',
      'Export ideas to PDF',
      'Priority AI generation',
      'Unlimited saved ideas',
      'Deep-dive business plans',
    ],
    limits: {
      dailyIdeas: -1,
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
      'Everything in Pro',
      'Shared team workspace',
      'Up to 5 team members',
      'Team idea voting & assignment',
      'API access',
      'Priority support',
      'Custom idea categories',
    ],
    limits: {
      dailyIdeas: -1,
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
  const key = `${tier}_${billing}` as keyof typeof DODO_PRODUCTS
  return DODO_PRODUCTS[key]
}

export function getRemainingIdeas(tier: SubscriptionTier, dailyCount: number): number | null {
  const config = getTierConfig(tier)
  if (config.limits.dailyIdeas === -1) return null // unlimited
  return Math.max(0, config.limits.dailyIdeas - dailyCount)
}
