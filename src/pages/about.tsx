import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Check, Lightbulb, Target, Code2, Zap, TrendingUp, Shield, Users, ArrowRight, Crown, Globe, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { siteConfig } from '@/lib/site-config'
import { TIERS } from '@/lib/subscription'
import type { SubscriptionTier } from '@/types/database'

const FEATURES = [
  { icon: Lightbulb, title: 'AI-Powered Ideas', desc: 'Fresh ideas generated daily with revenue estimates and execution plans.', color: 'text-brand', bg: 'bg-brand/10' },
  { icon: Target, title: 'Market Validated', desc: 'Competitor analysis, target audience, and realistic MRR projections.', color: 'text-accent', bg: 'bg-accent/10' },
  { icon: Code2, title: 'Developer First', desc: 'Full tech stack recommendations, implementation guides, and API access.', color: 'text-emerald', bg: 'bg-emerald/10' },
  { icon: TrendingUp, title: 'Smart Personalization', desc: 'Ideas tailored to your skills and interests. The more you vote, the better they get.', color: 'text-amber', bg: 'bg-amber/10' },
  { icon: Shield, title: 'Private by Default', desc: 'Your generated ideas stay private until you choose to share them.', color: 'text-rose', bg: 'bg-rose/10' },
  { icon: Users, title: 'Community Driven', desc: 'Vote, comment, and collaborate on public ideas with other builders.', color: 'text-accent', bg: 'bg-accent/10' },
]

const TIER_ICONS: Record<SubscriptionTier, typeof Zap> = { free: Zap, pro: Crown, team: Users }
const TIER_COLORS: Record<SubscriptionTier, string> = { free: 'text-text-muted', pro: 'text-brand', team: 'text-accent' }
const TIER_BORDER: Record<SubscriptionTier, string> = { free: 'border-border', pro: 'border-brand ring-2 ring-brand/20', team: 'border-accent' }

const HOW_IT_WORKS = [
  { step: '1', title: 'Sign Up', desc: 'Create a free account and tell us your skills and interests.' },
  { step: '2', title: 'Generate', desc: `AI creates personalized ${siteConfig.ideaLabelPlural} with full breakdowns.` },
  { step: '3', title: 'Evaluate', desc: 'Review revenue estimates, competition, and execution plans.' },
  { step: '4', title: 'Build', desc: 'Pick your favorite and start building with a clear roadmap.' },
]

const FAQ = [
  { q: 'What kind of ideas do you generate?', a: `${siteConfig.name} generates detailed business and project ideas with revenue projections, tech stacks, competitor analysis, and go-to-market strategies.` },
  { q: 'Is there a free tier?', a: 'Yes. The Free tier gives you 1 idea per day, public feed access, and the ability to vote and comment.' },
  { q: 'Can I cancel anytime?', a: 'Yes, you can cancel your subscription at any time. You\'ll keep access until the end of your billing period.' },
  { q: 'How does personalization work?', a: 'We use your skills, interests, and voting history to tailor idea generation. The more you use it, the better the ideas get.' },
]

export function AboutPage() {
  const tiers = (['free', 'pro', 'team'] as SubscriptionTier[]).map(t => TIERS[t])

  return (
    <div className="w-full max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold">About {siteConfig.name}</h1>
          <p className="text-text-secondary mt-2 max-w-lg mx-auto">
            {siteConfig.tagline}. Discover validated ideas backed by real market data so you can focus on building.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${f.bg}`}>
                        <Icon className={`h-5 w-5 ${f.color}`} />
                      </div>
                      <h3 className="text-lg font-bold">{f.title}</h3>
                    </div>
                    <p className="text-sm text-text-secondary">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-10"
        >
          <h2 className="text-lg font-bold mb-4">How It Works</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {HOW_IT_WORKS.map(s => (
              <Card key={s.step}>
                <CardContent className="p-4 text-center">
                  <div className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-sm font-bold text-brand">{s.step}</span>
                  </div>
                  <h4 className="text-sm font-semibold mb-1">{s.title}</h4>
                  <p className="text-xs text-text-secondary">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Pricing - uses exact same TIERS config as the pricing page */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-10"
        >
          <h2 className="text-lg font-bold mb-4">Plans & Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tiers.map((config, i) => {
              const Icon = TIER_ICONS[config.tier]
              const isPopular = config.tier === 'pro'

              return (
                <motion.div
                  key={config.tier}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                >
                  <Card className={`relative h-full ${TIER_BORDER[config.tier]} ${isPopular ? 'shadow-lg shadow-brand/10' : ''}`}>
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge variant="default" className="bg-brand text-white px-3">Most Popular</Badge>
                      </div>
                    )}
                    <CardContent className="p-6">
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

                      <div className="mb-6">
                        {config.monthlyPrice === 0 ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-extrabold">$0</span>
                            <span className="text-text-muted text-sm">/ forever</span>
                          </div>
                        ) : (
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-extrabold">${config.monthlyPrice}</span>
                            <span className="text-text-muted text-sm">/ mo</span>
                          </div>
                        )}
                      </div>

                      <Link to={config.tier === 'free' ? '/signup' : '/pricing'}>
                        <Button
                          variant={config.tier === 'free' ? 'outline' : 'default'}
                          className={`w-full mb-6 ${config.tier === 'team' ? 'bg-accent hover:bg-accent/90' : ''}`}
                        >
                          {config.tier === 'free' ? 'Get Started Free' : `Upgrade to ${config.name}`}
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>

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
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-10"
        >
          <h2 className="text-lg font-bold mb-4">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FAQ.map(({ q, a }) => (
              <Card key={q}>
                <CardContent className="p-4">
                  <h4 className="text-sm font-semibold mb-1">{q}</h4>
                  <p className="text-xs text-text-secondary">{a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Our Platforms */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mb-10"
        >
          <h2 className="text-lg font-bold mb-4">Our Platforms</h2>
          <p className="text-sm text-text-secondary mb-4">
            We run two versions of our platform. Your account, subscription, and data sync across both — pick the one that fits your needs.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className={siteConfig.mode === 'saas' ? 'border-brand ring-2 ring-brand/20' : ''}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center">
                    <Code2 className="h-5 w-5 text-brand" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold">OpenSaaSIdea</h4>
                      {siteConfig.mode === 'saas' && <Badge variant="default" className="bg-brand text-white text-[10px] px-1.5 py-0">You are here</Badge>}
                    </div>
                    <p className="text-xs text-text-muted">opensaasidea.com</p>
                  </div>
                </div>
                <p className="text-xs text-text-secondary mb-3">
                  The focused, SaaS-only edition. Generates exclusively software-as-a-service business ideas — web apps, APIs, mobile apps, browser extensions, and desktop tools. Ideal if you're a developer or founder looking for your next SaaS product.
                </p>
                <a href="https://opensaasidea.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                  Visit opensaasidea.com <ExternalLink className="h-3 w-3" />
                </a>
              </CardContent>
            </Card>
            <Card className={siteConfig.mode === 'full' ? 'border-accent ring-2 ring-accent/20' : ''}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold">OpenProjectIdea</h4>
                      {siteConfig.mode === 'full' && <Badge variant="default" className="bg-accent text-white text-[10px] px-1.5 py-0">You are here</Badge>}
                    </div>
                    <p className="text-xs text-text-muted">openprojectidea.com</p>
                  </div>
                </div>
                <p className="text-xs text-text-secondary mb-3">
                  The full, broad edition. Generates ideas across every industry — SaaS, local businesses, hardware, science, manufacturing, biotech, e-commerce, real estate, food & beverage, and more. For example: a unique laptop case line, an urban farming kit, or a niche repair service. Same plans, same account, more variety.
                </p>
                <a href="https://openprojectidea.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">
                  Visit openprojectidea.com <ExternalLink className="h-3 w-3" />
                </a>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Contact */}
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-sm font-semibold mb-1">Have questions?</h3>
            <p className="text-xs text-text-secondary">
              Reach us at <a href={`mailto:support@${siteConfig.domain}`} className="text-brand hover:underline">support@{siteConfig.domain}</a>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
