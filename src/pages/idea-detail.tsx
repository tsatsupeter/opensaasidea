import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, DollarSign, Code2, Users, Megaphone, Search,
  Shield, Zap, Target, BarChart3, Loader2, Globe, Smartphone, Monitor,
  Puzzle, Layers, CreditCard, UserCheck, ArrowUpRight
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { useRecent } from '@/hooks/use-recent'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { VoteButton } from '@/components/ideas/vote-button'
import { formatCurrency } from '@/lib/utils'
import type { SaasIdea, PricingTier, TeamRole, TechStack, Competitor } from '@/types/database'

const platformIcons: Record<string, typeof Globe> = {
  web: Globe, mobile: Smartphone, desktop: Monitor,
  browser_extension: Puzzle, api: Code2, multi_platform: Layers,
}

const fadeIn = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

export function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { addRecent } = useRecent()
  const [idea, setIdea] = useState<SaasIdea | null>(null)
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const fetchData = async () => {
      const { data } = await supabase
        .from('saas_ideas')
        .select('*')
        .eq('id', id)
        .single()
      const ideaData = data as SaasIdea | null
      setIdea(ideaData)

      if (ideaData) {
        addRecent({
          id: ideaData.id,
          title: ideaData.title,
          category: ideaData.category || 'SaaS',
          path: `/idea/${ideaData.id}`,
          upvotes: ideaData.upvotes || 0,
        })
      }

      if (user) {
        const { data: voteData } = await supabase
          .from('votes')
          .select('vote_type')
          .eq('user_id', user.id)
          .eq('idea_id', id)
          .single()
        if (voteData) setUserVote((voteData as any).vote_type)
      }
      setLoading(false)
    }
    fetchData()
  }, [id, user, addRecent])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
  }

  if (!idea) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-xl font-bold mb-2">Idea not found</h2>
        <Link to="/explore" className="text-brand hover:underline">Back to Explore</Link>
      </div>
    )
  }

  const PlatformIcon = platformIcons[idea.platform] || Globe
  const techStack = idea.tech_stack as TechStack | null
  const pricingTiers = (idea.pricing_tiers || []) as PricingTier[]
  const teamRoles = (idea.team_roles || []) as TeamRole[]
  const competitors = (idea.existing_competitors || []) as Competitor[]
  const leadGen = idea.lead_generation as any
  const marketing = idea.marketing_strategy as any
  const seoStrategy = idea.seo_strategy as any
  const revenue = idea.revenue_breakdown as any

  return (
    <div className="max-w-4xl">
      <motion.div {...fadeIn}>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Feed
        </Link>

        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="default">{idea.monetization_model?.replace('_', ' ')}</Badge>
            <Badge variant="accent">
              <PlatformIcon className="h-3 w-3 mr-1" />
              {idea.platform?.replace('_', ' ')}
            </Badge>
            <Badge variant="secondary">{idea.category}</Badge>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">{idea.title}</h1>
          {idea.tagline && <p className="text-lg text-text-secondary">{idea.tagline}</p>}

          <div className="flex items-center gap-4 mt-4">
            <VoteButton
              ideaId={idea.id}
              upvotes={idea.upvotes}
              downvotes={idea.downvotes}
              currentVote={userVote}
            />
          </div>
        </div>

        <Separator className="mb-8" />

        <div className="space-y-8">
          {/* Description */}
          <section>
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
              <Zap className="h-5 w-5 text-brand" />
              About This Idea
            </h2>
            <p className="text-text-secondary leading-relaxed whitespace-pre-line">{idea.description}</p>
          </section>

          {/* Revenue Estimates */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-success" />
              Revenue Estimates
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-success/10 to-surface-2 border-success/20">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-text-muted uppercase">Daily Sales</p>
                  <p className="text-xl font-bold text-success mt-1">
                    {idea.estimated_daily_sales ? formatCurrency(idea.estimated_daily_sales) : 'N/A'}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-success/10 to-surface-2 border-success/20">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-text-muted uppercase">Weekly Sales</p>
                  <p className="text-xl font-bold text-success mt-1">
                    {idea.estimated_weekly_sales ? formatCurrency(idea.estimated_weekly_sales) : 'N/A'}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-success/10 to-surface-2 border-success/20">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-text-muted uppercase">Monthly Sales</p>
                  <p className="text-xl font-bold text-success mt-1">
                    {idea.estimated_monthly_sales ? formatCurrency(idea.estimated_monthly_sales) : 'N/A'}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-brand/10 to-surface-2 border-brand/20">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-text-muted uppercase">Est. MRR</p>
                  <p className="text-lg font-bold text-brand mt-1">
                    {idea.estimated_mrr_low && idea.estimated_mrr_high
                      ? `${formatCurrency(idea.estimated_mrr_low)} - ${formatCurrency(idea.estimated_mrr_high)}`
                      : 'N/A'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {revenue && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                {revenue.primary_revenue && (
                  <div className="p-3 rounded-lg bg-surface-3 border border-border">
                    <p className="text-xs text-text-muted">Primary Revenue</p>
                    <p className="text-sm font-medium mt-1">{revenue.primary_revenue}</p>
                  </div>
                )}
                {revenue.free_trial_conversion_rate && (
                  <div className="p-3 rounded-lg bg-surface-3 border border-border">
                    <p className="text-xs text-text-muted">Free Trial Conversion</p>
                    <p className="text-sm font-medium mt-1">{revenue.free_trial_conversion_rate}%</p>
                  </div>
                )}
                {revenue.customer_acquisition_cost && (
                  <div className="p-3 rounded-lg bg-surface-3 border border-border">
                    <p className="text-xs text-text-muted">CAC</p>
                    <p className="text-sm font-medium mt-1">{formatCurrency(revenue.customer_acquisition_cost)}</p>
                  </div>
                )}
                {revenue.lifetime_value && (
                  <div className="p-3 rounded-lg bg-surface-3 border border-border">
                    <p className="text-xs text-text-muted">LTV</p>
                    <p className="text-sm font-medium mt-1">{formatCurrency(revenue.lifetime_value)}</p>
                  </div>
                )}
                {revenue.average_customer_lifetime_months && (
                  <div className="p-3 rounded-lg bg-surface-3 border border-border">
                    <p className="text-xs text-text-muted">Avg Lifetime</p>
                    <p className="text-sm font-medium mt-1">{revenue.average_customer_lifetime_months} months</p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Pricing Tiers */}
          {pricingTiers.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-brand" />
                Pricing Tiers
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {pricingTiers.map((tier, i) => (
                  <Card key={i} className={i === 1 ? 'border-brand/40 ring-1 ring-brand/20' : ''}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{tier.name}</CardTitle>
                        {i === 1 && <Badge variant="default">Popular</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-3">
                        <span className="text-2xl font-black">{formatCurrency(tier.price)}</span>
                        <span className="text-text-muted text-sm">/{tier.billing}</span>
                      </div>
                      <ul className="space-y-1.5">
                        {tier.features?.map((f, fi) => (
                          <li key={fi} className="text-sm text-text-secondary flex items-start gap-2">
                            <span className="text-success mt-0.5">•</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Tech Stack */}
          {techStack && (
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Code2 className="h-5 w-5 text-accent" />
                Tech Stack
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(techStack).map(([category, techs]) => (
                  Array.isArray(techs) && techs.length > 0 && (
                    <Card key={category}>
                      <CardContent className="p-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                          {category.replace('_', ' / ')}
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {techs.map((t: string) => (
                            <Badge key={t} variant="secondary">{t}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                ))}
              </div>
            </section>
          )}

          {/* Team Roles */}
          {teamRoles.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-brand" />
                Team Breakdown
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {teamRoles.map((role, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm">{role.role}</h4>
                        <Badge variant={
                          role.priority === 'critical' ? 'error' :
                          role.priority === 'important' ? 'warning' : 'secondary'
                        }>
                          {role.priority}
                        </Badge>
                      </div>
                      {role.responsibilities?.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs text-text-muted mb-1">Responsibilities:</p>
                          <ul className="space-y-0.5">
                            {role.responsibilities.map((r, ri) => (
                              <li key={ri} className="text-xs text-text-secondary">• {r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {role.skills_needed?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {role.skills_needed.map((s) => (
                            <Badge key={s} variant="accent" className="text-[10px]">{s}</Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Lead Generation */}
          {leadGen && (
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-brand" />
                Lead Generation
              </h2>
              <Card>
                <CardContent className="p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {leadGen.channels?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Channels</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {leadGen.channels.map((c: string) => (
                            <Badge key={c} variant="secondary">{c}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {leadGen.strategies?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Strategies</h4>
                        <ul className="space-y-1">
                          {leadGen.strategies.map((s: string, i: number) => (
                            <li key={i} className="text-sm text-text-secondary">• {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {leadGen.conversion_funnel?.length > 0 && (
                      <div className="sm:col-span-2">
                        <h4 className="text-sm font-semibold mb-2">Conversion Funnel</h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          {leadGen.conversion_funnel.map((step: string, i: number) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-lg bg-surface-3 border border-border text-xs font-medium">
                                {step}
                              </span>
                              {i < leadGen.conversion_funnel.length - 1 && (
                                <ArrowUpRight className="h-3 w-3 text-text-muted" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {leadGen.estimated_cost_per_lead && (
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Cost per Lead</h4>
                        <p className="text-lg font-bold text-brand">{formatCurrency(leadGen.estimated_cost_per_lead)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Marketing Strategy */}
          {marketing && (
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-accent" />
                Marketing Strategy
              </h2>
              <Card>
                <CardContent className="p-5 space-y-4">
                  {marketing.channels?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Marketing Channels</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {marketing.channels.map((c: string) => (
                          <Badge key={c} variant="default">{c}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {marketing.content_strategy?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Content Strategy</h4>
                      <ul className="space-y-1">
                        {marketing.content_strategy.map((s: string, i: number) => (
                          <li key={i} className="text-sm text-text-secondary">• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {marketing.launch_strategy && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Launch Strategy</h4>
                      <p className="text-sm text-text-secondary">{marketing.launch_strategy}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          )}

          {/* SEO Strategy */}
          {seoStrategy && (
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Search className="h-5 w-5 text-success" />
                SEO Strategy
              </h2>
              <Card>
                <CardContent className="p-5 space-y-4">
                  {seoStrategy.target_keywords?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Target Keywords</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {seoStrategy.target_keywords.map((k: string) => (
                          <Badge key={k} variant="success">{k}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {seoStrategy.content_plan?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Content Plan</h4>
                      <ul className="space-y-1">
                        {seoStrategy.content_plan.map((s: string, i: number) => (
                          <li key={i} className="text-sm text-text-secondary">• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {seoStrategy.estimated_organic_traffic_monthly && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Est. Monthly Organic Traffic</h4>
                      <p className="text-lg font-bold text-success">
                        {seoStrategy.estimated_organic_traffic_monthly.toLocaleString()} visits/mo
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          )}

          {/* Competitors */}
          {competitors.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-warning" />
                Competitive Analysis
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {competitors.map((comp, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-sm mb-2">{comp.name}</h4>
                      {comp.url && (
                        <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">
                          {comp.url}
                        </a>
                      )}
                      {comp.weakness && (
                        <div className="mt-2">
                          <p className="text-xs text-error font-medium">Weakness:</p>
                          <p className="text-xs text-text-secondary">{comp.weakness}</p>
                        </div>
                      )}
                      {comp.our_advantage && (
                        <div className="mt-1">
                          <p className="text-xs text-success font-medium">Our Advantage:</p>
                          <p className="text-xs text-text-secondary">{comp.our_advantage}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Pros & Cons */}
          {(idea.pros?.length > 0 || idea.cons?.length > 0) && (
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-text-secondary" />
                Pros & Cons
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {idea.pros?.length > 0 && (
                  <Card className="border-success/20">
                    <CardContent className="p-4">
                      <h4 className="text-sm font-semibold text-success mb-2">Pros</h4>
                      <ul className="space-y-1">
                        {idea.pros.map((p, i) => (
                          <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                            <span className="text-success">✓</span> {p}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
                {idea.cons?.length > 0 && (
                  <Card className="border-error/20">
                    <CardContent className="p-4">
                      <h4 className="text-sm font-semibold text-error mb-2">Cons</h4>
                      <ul className="space-y-1">
                        {idea.cons.map((c, i) => (
                          <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                            <span className="text-error">✗</span> {c}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>
          )}

          {/* Unique Differentiators */}
          {idea.unique_differentiators?.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-brand" />
                What Makes This Unique
              </h2>
              <div className="flex flex-wrap gap-2">
                {idea.unique_differentiators.map((d, i) => (
                  <Badge key={i} variant="default">{d}</Badge>
                ))}
              </div>
            </section>
          )}
        </div>
      </motion.div>
    </div>
  )
}
