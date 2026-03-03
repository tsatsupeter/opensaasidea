import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Zap, Users, Crown, Loader2, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { useSubscription } from '@/hooks/use-subscription'
import { useToast } from '@/components/ui/toast'
import { TIERS, getProductId, DODO_PRODUCTS } from '@/lib/subscription'
import type { SubscriptionTier } from '@/types/database'

const TIER_ICONS: Record<SubscriptionTier, typeof Zap> = {
  free: Zap,
  pro: Crown,
  team: Users,
}

const TIER_COLORS: Record<SubscriptionTier, string> = {
  free: 'text-text-muted',
  pro: 'text-brand',
  team: 'text-accent',
}

const TIER_BORDER: Record<SubscriptionTier, string> = {
  free: 'border-border',
  pro: 'border-brand ring-2 ring-brand/20',
  team: 'border-accent',
}

export function PricingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { tier: currentTier, createCheckout } = useSubscription()
  const { toast } = useToast()
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  const [loadingTier, setLoadingTier] = useState<string | null>(null)

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (tier === 'free' || tier === currentTier) return

    if (!user) {
      navigate('/login')
      return
    }

    setLoadingTier(tier)
    try {
      const productId = getProductId(tier as 'pro' | 'team', billing)
      const url = await createCheckout(productId)
      if (url) {
        window.location.href = url
      } else {
        toast('Failed to create checkout. Please try again.')
      }
    } finally {
      setLoadingTier(null)
    }
  }

  const handleBuyReport = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    setLoadingTier('report')
    try {
      const url = await createCheckout(DODO_PRODUCTS.deep_dive_report)
      if (url) {
        window.location.href = url
      } else {
        toast('Failed to create checkout. Please try again.')
      }
    } finally {
      setLoadingTier(null)
    }
  }

  const tiers = (['free', 'pro', 'team'] as SubscriptionTier[]).map(t => TIERS[t])

  return (
    <div className="max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold">Choose Your Plan</h1>
          <p className="text-text-secondary mt-2 max-w-lg mx-auto">
            Unlock unlimited ideas, detailed market reports, PDF exports, and more.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                billing === 'monthly'
                  ? 'bg-brand text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                billing === 'yearly'
                  ? 'bg-brand text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
              }`}
            >
              Yearly
              <Badge variant="success" className="ml-2 text-[10px]">Save 20%</Badge>
            </button>
          </div>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {tiers.map((config, i) => {
            const Icon = TIER_ICONS[config.tier]
            const isCurrent = currentTier === config.tier
            const price = billing === 'monthly' ? config.monthlyPrice : Math.round(config.yearlyPrice / 12)
            const totalYearly = config.yearlyPrice
            const isPopular = config.tier === 'pro'

            return (
              <motion.div
                key={config.tier}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`relative h-full ${TIER_BORDER[config.tier]} ${isPopular ? 'shadow-lg shadow-brand/10' : ''}`}>
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="default" className="bg-brand text-white px-3">Most Popular</Badge>
                    </div>
                  )}
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                        config.tier === 'pro' ? 'bg-brand/10' : config.tier === 'team' ? 'bg-accent/10' : 'bg-surface-2'
                      }`}>
                        <Icon className={`h-5 w-5 ${TIER_COLORS[config.tier]}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">{config.name}</h3>
                        <p className="text-xs text-text-muted">{config.tagline}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      {config.monthlyPrice === 0 ? (
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-extrabold">$0</span>
                          <span className="text-text-muted text-sm">/ forever</span>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-extrabold">${price}</span>
                            <span className="text-text-muted text-sm">/ mo</span>
                          </div>
                          {billing === 'yearly' && (
                            <p className="text-xs text-text-muted mt-1">
                              ${totalYearly}/year — billed annually
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    {isCurrent ? (
                      <Button variant="outline" className="w-full mb-6" disabled>
                        Current Plan
                      </Button>
                    ) : config.tier === 'free' ? (
                      <Button variant="outline" className="w-full mb-6" disabled>
                        Free Forever
                      </Button>
                    ) : (
                      <Button
                        className={`w-full mb-6 ${config.tier === 'pro' ? '' : 'bg-accent hover:bg-accent/90'}`}
                        onClick={() => handleUpgrade(config.tier)}
                        disabled={loadingTier === config.tier}
                      >
                        {loadingTier === config.tier ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            Upgrade to {config.name}
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </>
                        )}
                      </Button>
                    )}

                    {/* Features */}
                    <ul className="space-y-2.5">
                      {config.features.map(feature => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <Check className={`h-4 w-4 shrink-0 mt-0.5 ${TIER_COLORS[config.tier]}`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Deep Dive Report — pay-per-use */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-amber/30 bg-gradient-to-r from-amber/5 to-transparent">
            <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="accent" className="bg-amber/10 text-amber">Pay-per-use</Badge>
                </div>
                <h3 className="text-lg font-bold">Deep-Dive Business Report</h3>
                <p className="text-sm text-text-secondary mt-1">
                  Get a comprehensive PDF with full financials, tech stack analysis, marketing playbook,
                  team structure, and competitive analysis for any idea.
                </p>
                <p className="text-xs text-text-muted mt-2">
                  Pro & Team users get this included with their plan.
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-3xl font-extrabold">$9.99</p>
                <p className="text-xs text-text-muted mb-3">per report</p>
                <Button
                  variant="outline"
                  onClick={handleBuyReport}
                  disabled={loadingTier === 'report'}
                >
                  {loadingTier === 'report' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Buy Report'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-10"
        >
          <h2 className="text-lg font-bold mb-4">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { q: 'Can I cancel anytime?', a: 'Yes, you can cancel your subscription at any time. You\'ll keep access until the end of your billing period.' },
              { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, debit cards, and local payment methods through Dodo Payments.' },
              { q: 'Is there a free trial?', a: 'The Free tier is always available. Upgrade when you\'re ready to unlock unlimited features.' },
              { q: 'Can I switch plans?', a: 'Yes, you can upgrade or downgrade at any time. Changes take effect immediately with prorated billing.' },
            ].map(({ q, a }) => (
              <Card key={q}>
                <CardContent className="p-4">
                  <h4 className="text-sm font-semibold mb-1">{q}</h4>
                  <p className="text-xs text-text-secondary">{a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
