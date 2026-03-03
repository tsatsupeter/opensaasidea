import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Loader2, Globe, Smartphone, Monitor,
  Puzzle, Code2, Layers, Share2, Bookmark, BookmarkCheck, Calendar, Eye, Users, TrendingUp, DollarSign, Zap, Lock, MessageSquare, FileDown, Crown
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { useRecent } from '@/hooks/use-recent'
import { useBookmarks } from '@/hooks/use-bookmarks'
import { useSubscription } from '@/hooks/use-subscription'
import { useTeam } from '@/hooks/use-team'
import { useToast } from '@/components/ui/toast'
import { exportIdeaToPDF } from '@/lib/pdf-export'
import { DODO_PRODUCTS } from '@/lib/subscription'
import { VoteButton } from '@/components/ideas/vote-button'
import { CommentSection } from '@/components/comments/comment-section'
import { UpgradePrompt } from '@/components/subscription/upgrade-prompt'
import { formatCurrency, formatNumber, timeAgo } from '@/lib/utils'
import { categoryColor, toSlug, useCategories } from '@/lib/categories'
import { getAffiliateLink } from '@/lib/affiliates'
import { siteConfig } from '@/lib/site-config'
import type { SaasIdea, PricingTier, TeamRole, TechStack, Competitor } from '@/types/database'

const platformIcons: Record<string, typeof Globe> = {
  web: Globe, mobile: Smartphone, desktop: Monitor,
  browser_extension: Puzzle, api: Code2, multi_platform: Layers,
}

export function IdeaDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addRecent } = useRecent()
  const { categories } = useCategories()
  const [idea, setIdea] = useState<SaasIdea | null>(null)
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPublic, setIsPublic] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [buyingReport, setBuyingReport] = useState(false)
  const [hasPurchasedReport, setHasPurchasedReport] = useState(false)
  const { isBookmarked, toggleBookmark, bookmarkedIds } = useBookmarks()
  const { isPro, isFree, isTeam, createCheckout } = useSubscription()
  const { team, shareIdeaToTeam } = useTeam()
  const [sharingToTeam, setSharingToTeam] = useState(false)
  const { toast } = useToast()

  // Determines if user can view Pro content (Pro subscriber OR purchased report for this idea)
  const canViewPro = isPro || hasPurchasedReport

  const fetchIdeaData = async () => {
    if (!slug) return
    // Use secure RPC that strips Pro-only fields server-side
    const { data } = await (supabase.rpc as any)('get_idea_by_slug', { p_slug: slug })

    const ideaData = data as (SaasIdea & { has_purchased_report?: boolean }) | null
    setIdea(ideaData)

    if (ideaData) {
      setIsPublic(ideaData.is_public)
      setHasPurchasedReport(!!ideaData.has_purchased_report)
      addRecent({
        id: ideaData.id,
        title: ideaData.title,
        category: ideaData.category || 'SaaS',
        path: `/idea/${ideaData.slug || ideaData.id}`,
        upvotes: ideaData.upvotes || 0,
      })
    }

    if (user && ideaData) {
      const { data: voteData } = await supabase
        .from('votes')
        .select('vote_type')
        .eq('user_id', user.id)
        .eq('idea_id', ideaData.id)
        .single()
      if (voteData) setUserVote((voteData as any).vote_type)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchIdeaData()
  }, [slug, user, addRecent])

  // Handle return from successful report purchase
  useEffect(() => {
    if (searchParams.get('report_purchased') === 'true') {
      toast('Report purchased! Full details are now unlocked.')
      // Remove query param from URL
      navigate(`/idea/${slug}`, { replace: true })
      // Re-fetch to get unlocked data
      fetchIdeaData()
    }
  }, [searchParams])

  const handleBuyReport = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    if (!idea) return
    setBuyingReport(true)
    try {
      const url = await createCheckout(DODO_PRODUCTS.deep_dive_report, {
        idea_id: idea.id,
        idea_slug: idea.slug || idea.id,
      })
      if (url) {
        window.location.href = url
      } else {
        toast('Failed to create checkout. Please try again.')
      }
    } finally {
      setBuyingReport(false)
    }
  }

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
        <Link to="/" className="text-brand hover:underline">Back to Feed</Link>
      </div>
    )
  }

  const techStack = idea.tech_stack as TechStack | null
  const pricingTiers = (idea.pricing_tiers || []) as PricingTier[]
  const teamRoles = (idea.team_roles || []) as TeamRole[]
  const competitors = (idea.existing_competitors || []) as Competitor[]
  const leadGen = idea.lead_generation as any
  const marketing = idea.marketing_strategy as any
  const seoStrategy = idea.seo_strategy as any
  const revenue = idea.revenue_breakdown as any
  const catLabel = idea.category || 'Other'
  const catSlug = toSlug(catLabel)
  const colors = categoryColor(catSlug)
  const catData = categories.find(c => c.slug === catSlug)

  return (
    <div className="flex gap-6 w-full">
      {/* Main post column */}
      <div className="flex-1 min-w-0">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Post card */}
          <article className="rounded-xl border border-border bg-surface-0 overflow-hidden">
            {/* Header row: back arrow + category + time */}
            <div className="flex items-center gap-2 px-4 pt-3 pb-0">
              <Link to="/" className="text-text-muted hover:text-text-primary transition-colors shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className={`h-6 w-6 rounded-full ${colors.bgColor} flex items-center justify-center shrink-0`}>
                <span className={`text-[11px] font-bold ${colors.color}`}>{catLabel[0]}</span>
              </div>
              <Link to={`/explore/${catSlug}`} className="text-[13px] font-semibold text-text-secondary hover:text-text-primary hover:underline">
                {catLabel}
              </Link>
              <span className="text-[12px] text-text-muted">· {timeAgo(idea.created_at)}</span>
              <span className="text-[12px] text-text-muted ml-auto">···</span>
            </div>

            {/* Title */}
            <div className="px-4 pt-2 pb-1">
              <h1 className="text-[20px] font-bold tracking-tight leading-tight">{idea.title}</h1>
            </div>

            {/* Flair tags */}
            <div className="flex items-center gap-2 px-4 pb-3">
              {idea.category && (
                <span className={`text-[11px] font-semibold ${colors.color} ${colors.bgColor} rounded-full px-2.5 py-0.5`}>
                  {idea.category}
                </span>
              )}
              {idea.monetization_model && (
                <span className="text-[11px] font-medium text-text-muted bg-surface-2 rounded-full px-2.5 py-0.5 capitalize">
                  {idea.monetization_model.replace('_', ' ')}
                </span>
              )}
              {idea.platform && (
                <span className="text-[11px] font-medium text-text-muted bg-surface-2 rounded-full px-2.5 py-0.5 capitalize">
                  {idea.platform.replace('_', ' ')}
                </span>
              )}
            </div>

            {/* Post body — flowing text like Reddit */}
            <div className="px-4 pb-4 text-[14px] text-text-secondary leading-relaxed space-y-5">
              {/* Tagline */}
              {idea.tagline && (
                <p className="text-text-primary font-medium italic">{idea.tagline}</p>
              )}

              {/* Description */}
              <p className="whitespace-pre-line">{idea.description}</p>

              {/* Revenue */}
              <div>
                <p className="text-text-primary font-semibold mb-2">Revenue Estimates:</p>
                <ul className="list-disc list-inside space-y-1 ml-1">
                  {idea.estimated_mrr_low && idea.estimated_mrr_high && (
                    <li>Estimated MRR: <strong className="text-brand">{formatCurrency(idea.estimated_mrr_low)} – {formatCurrency(idea.estimated_mrr_high)}</strong></li>
                  )}
                  {idea.estimated_monthly_sales && <li>Monthly Sales: <strong className="text-emerald">{formatCurrency(idea.estimated_monthly_sales)}</strong></li>}
                </ul>
                {canViewPro ? (
                  <>
                    <ul className="list-disc list-inside space-y-1 ml-1 mt-1">
                      {idea.estimated_daily_sales && <li>Daily Sales: <strong className="text-emerald">{formatCurrency(idea.estimated_daily_sales)}</strong></li>}
                      {idea.estimated_weekly_sales && <li>Weekly Sales: <strong className="text-emerald">{formatCurrency(idea.estimated_weekly_sales)}</strong></li>}
                    </ul>
                    {revenue && (
                      <>
                        <p className="text-text-primary font-medium mt-3 mb-1">Revenue breakdown:</p>
                        <ul className="list-disc list-inside space-y-1 ml-1">
                          {revenue.primary_revenue && <li>Primary revenue: {revenue.primary_revenue}</li>}
                          {revenue.free_trial_conversion_rate && <li>Free trial conversion: {revenue.free_trial_conversion_rate}%</li>}
                          {revenue.customer_acquisition_cost && <li>Customer acquisition cost: {formatCurrency(revenue.customer_acquisition_cost)}</li>}
                          {revenue.lifetime_value && <li>Lifetime value: {formatCurrency(revenue.lifetime_value)}</li>}
                          {revenue.average_customer_lifetime_months && <li>Average customer lifetime: {revenue.average_customer_lifetime_months} months</li>}
                        </ul>
                      </>
                    )}
                  </>
                ) : (
                  <div className="mt-3 rounded-lg border border-brand/20 bg-surface-1/50 px-4 py-3 flex flex-wrap items-center gap-2">
                    <Crown className="h-4 w-4 text-brand shrink-0" />
                    <p className="text-[13px] font-semibold text-brand">Pro feature — Detailed revenue breakdown</p>
                    <div className="flex items-center gap-2 ml-auto">
                      <button onClick={handleBuyReport} disabled={buyingReport} className="text-[11px] font-semibold text-white bg-brand rounded-full px-3 py-1 hover:bg-brand/90 transition-colors disabled:opacity-50">
                        {buyingReport ? 'Loading...' : 'Buy Report $9.99'}
                      </button>
                      <Link to="/pricing" className="text-[11px] font-medium text-brand hover:underline">or Upgrade</Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing — Pro only */}
              {canViewPro && pricingTiers.length > 0 && (
                <div>
                  <p className="text-text-primary font-semibold mb-2">Pricing Tiers:</p>
                  {pricingTiers.map((t, i) => (
                    <div key={i} className="mb-3">
                      <p className="font-medium text-text-primary">
                        {t.name} — <strong>{formatCurrency(t.price)}</strong>/{t.billing}
                        {i === 1 && <span className="text-brand ml-1">(most popular)</span>}
                      </p>
                      {t.features && t.features.length > 0 && (
                        <ul className="list-disc list-inside space-y-0.5 ml-1 mt-1">
                          {t.features.map((f, fi) => (
                            <li key={fi}>{f}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {!canViewPro && pricingTiers.length > 0 && (
                <div className="rounded-lg border border-brand/20 bg-surface-1/50 px-4 py-3 flex flex-wrap items-center gap-2">
                  <Crown className="h-4 w-4 text-brand shrink-0" />
                  <p className="text-[13px] font-semibold text-brand">Pro feature — Pricing tier details</p>
                  <div className="flex items-center gap-2 ml-auto">
                    <button onClick={handleBuyReport} disabled={buyingReport} className="text-[11px] font-semibold text-white bg-brand rounded-full px-3 py-1 hover:bg-brand/90 transition-colors disabled:opacity-50">
                      {buyingReport ? 'Loading...' : 'Buy Report $9.99'}
                    </button>
                    <Link to="/pricing" className="text-[11px] font-medium text-brand hover:underline">or Upgrade</Link>
                  </div>
                </div>
              )}

              {/* Tech Stack — visible to all */}
              {techStack && (
                <div>
                  <p className="text-text-primary font-semibold mb-2">Tech Stack:</p>
                  {Object.entries(techStack).map(([category, techs]) => (
                    Array.isArray(techs) && techs.length > 0 && (
                      <div key={category} className="mb-1.5">
                        <span className="font-medium text-text-primary capitalize">{category.replace('_', ' / ')}:</span>{' '}
                        {techs.join(', ')}
                      </div>
                    )
                  ))}
                </div>
              )}

              {/* === PRO-GATED SECTIONS: Team, Lead Gen, Marketing, SEO, Competitors === */}
              {canViewPro ? (
                <>
                  {/* Team */}
                  {teamRoles.length > 0 && (
                    <div>
                      <p className="text-text-primary font-semibold mb-2">Team Breakdown:</p>
                      {teamRoles.map((role, i) => (
                        <div key={i} className="mb-3">
                          <p className="font-medium text-text-primary">
                            {role.role}
                            <span className={`ml-2 text-[12px] ${
                              role.priority === 'critical' ? 'text-rose' :
                              role.priority === 'important' ? 'text-amber' : 'text-text-muted'
                            }`}>({role.priority})</span>
                          </p>
                          {role.responsibilities?.length > 0 && (
                            <ul className="list-disc list-inside space-y-0.5 ml-1 mt-0.5">
                              {role.responsibilities.map((r, ri) => (
                                <li key={ri}>{r}</li>
                              ))}
                            </ul>
                          )}
                          {role.skills_needed?.length > 0 && (
                            <p className="mt-1 text-[13px]">Skills: {role.skills_needed.join(', ')}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Lead Generation */}
                  {leadGen && (
                    <div>
                      <p className="text-text-primary font-semibold mb-2">Lead Generation:</p>
                      {leadGen.channels?.length > 0 && (
                        <p className="mb-1">Channels: {leadGen.channels.join(', ')}</p>
                      )}
                      {leadGen.strategies?.length > 0 && (
                        <>
                          <p className="font-medium text-text-primary mt-2 mb-1">Strategies:</p>
                          <ul className="list-disc list-inside space-y-0.5 ml-1">
                            {leadGen.strategies.map((s: string, i: number) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </>
                      )}
                      {leadGen.conversion_funnel?.length > 0 && (
                        <p className="mt-2">
                          Conversion funnel: {leadGen.conversion_funnel.join(' → ')}
                        </p>
                      )}
                      {leadGen.estimated_cost_per_lead && (
                        <p className="mt-1">Cost per lead: <strong className="text-brand">{formatCurrency(leadGen.estimated_cost_per_lead)}</strong></p>
                      )}
                    </div>
                  )}

                  {/* Marketing */}
                  {marketing && (
                    <div>
                      <p className="text-text-primary font-semibold mb-2">Marketing Strategy:</p>
                      {marketing.channels?.length > 0 && (
                        <p className="mb-1">Marketing channels: {marketing.channels.join(', ')}</p>
                      )}
                      {marketing.content_strategy?.length > 0 && (
                        <>
                          <p className="font-medium text-text-primary mt-2 mb-1">Content strategy:</p>
                          <ul className="list-disc list-inside space-y-0.5 ml-1">
                            {marketing.content_strategy.map((s: string, i: number) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </>
                      )}
                      {marketing.launch_strategy && (
                        <p className="mt-2">Launch strategy: {marketing.launch_strategy}</p>
                      )}
                    </div>
                  )}

                  {/* SEO */}
                  {seoStrategy && (
                    <div>
                      <p className="text-text-primary font-semibold mb-2">SEO Strategy:</p>
                      {seoStrategy.target_keywords?.length > 0 && (
                        <p className="mb-1">Target keywords: {seoStrategy.target_keywords.join(', ')}</p>
                      )}
                      {seoStrategy.content_plan?.length > 0 && (
                        <>
                          <p className="font-medium text-text-primary mt-2 mb-1">Content plan:</p>
                          <ul className="list-disc list-inside space-y-0.5 ml-1">
                            {seoStrategy.content_plan.map((s: string, i: number) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </>
                      )}
                      {seoStrategy.estimated_organic_traffic_monthly && (
                        <p className="mt-1">Estimated organic traffic: <strong className="text-emerald">{seoStrategy.estimated_organic_traffic_monthly.toLocaleString()} visits/mo</strong></p>
                      )}
                    </div>
                  )}

                  {/* Competitors */}
                  {competitors.length > 0 && (
                    <div>
                      <p className="text-text-primary font-semibold mb-2">Competitive Analysis:</p>
                      {competitors.map((comp, i) => (
                        <div key={i} className="mb-2">
                          <p className="font-medium text-text-primary">
                            {comp.name}
                            {comp.url && (
                              <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline ml-2 text-[13px]">
                                ({comp.url})
                              </a>
                            )}
                          </p>
                          {comp.weakness && <p className="ml-1">Weakness: <span className="text-rose">{comp.weakness}</span></p>}
                          {comp.our_advantage && <p className="ml-1">Our advantage: <span className="text-emerald">{comp.our_advantage}</span></p>}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Free user — no content rendered, just upgrade prompt + buy report option */
                <div className="rounded-xl border border-border bg-surface-1/30 p-6 text-center space-y-3">
                  <div className="mx-auto h-12 w-12 rounded-full bg-brand/10 flex items-center justify-center">
                    <Crown className="h-6 w-6 text-brand" />
                  </div>
                  <h3 className="text-[15px] font-bold text-text-primary">Detailed Market Reports</h3>
                  <p className="text-[13px] text-text-muted max-w-md mx-auto">Unlock team breakdowns, lead generation strategies, marketing playbooks, SEO plans, and competitive analysis.</p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={handleBuyReport}
                      disabled={buyingReport}
                      className="inline-flex items-center gap-1.5 bg-brand text-white rounded-full px-5 py-2 text-[13px] font-semibold hover:bg-brand/90 transition-colors disabled:opacity-50"
                    >
                      {buyingReport ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <DollarSign className="h-3.5 w-3.5" />}
                      {buyingReport ? 'Creating checkout...' : 'Buy This Report — $9.99'}
                    </button>
                    <Link
                      to="/pricing"
                      className="inline-flex items-center gap-1.5 border border-brand/30 text-brand rounded-full px-5 py-2 text-[13px] font-semibold hover:bg-brand/5 transition-colors"
                    >
                      <Crown className="h-3.5 w-3.5" /> Upgrade to Pro
                    </Link>
                  </div>
                  <p className="text-[11px] text-text-muted">One-time purchase for this idea, or upgrade for unlimited access</p>
                </div>
              )}

              {/* Pros & Cons */}
              {(idea.pros?.length > 0 || idea.cons?.length > 0) && (
                <div>
                  {idea.pros?.length > 0 && (
                    <>
                      <p className="text-text-primary font-semibold mb-1">Pros:</p>
                      <ul className="list-disc list-inside space-y-0.5 ml-1 mb-3">
                        {idea.pros.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {idea.cons?.length > 0 && (
                    <>
                      <p className="text-text-primary font-semibold mb-1">Cons:</p>
                      <ul className="list-disc list-inside space-y-0.5 ml-1">
                        {idea.cons.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}

              {/* Unique differentiators */}
              {idea.unique_differentiators?.length > 0 && (
                <div>
                  <p className="text-text-primary font-semibold mb-1">What makes this unique:</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-1">
                    {idea.unique_differentiators.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Bottom action bar */}
            <div className="flex items-center gap-1 px-2 py-2 border-t border-border">
              <VoteButton ideaId={idea.id} upvotes={idea.upvotes} downvotes={idea.downvotes} currentVote={userVote} />
              <a
                href="#comments"
                onClick={(e) => {
                  e.preventDefault()
                  document.querySelector('#comments')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-text-muted hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {idea.comment_count || 0}
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  toast('Link copied to clipboard')
                }}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-text-muted hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5" /> Share
              </button>
              {isTeam && team && (
                <button
                  onClick={async () => {
                    setSharingToTeam(true)
                    const ok = await shareIdeaToTeam(idea.id)
                    toast(ok ? 'Shared to team workspace!' : 'Already shared or failed')
                    setSharingToTeam(false)
                  }}
                  disabled={sharingToTeam}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-accent hover:bg-accent/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Users className="h-3.5 w-3.5" /> {sharingToTeam ? 'Sharing...' : 'Team'}
                </button>
              )}
              <button
                onClick={async () => {
                  if (!user) return
                  const result = await toggleBookmark(idea.id)
                  if (result === 'limit') {
                    toast('Save limit reached. Upgrade to Pro for unlimited saves!')
                    return
                  }
                  toast(result ? 'Idea saved' : 'Removed from saved')
                }}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors cursor-pointer ${
                  isBookmarked(idea.id) ? 'text-brand' : 'text-text-muted hover:bg-surface-2'
                }`}
              >
                {isBookmarked(idea.id) ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
                {isBookmarked(idea.id) ? 'Saved' : 'Save'}
              </button>
              <button
                onClick={async () => {
                  if (!canViewPro) {
                    toast('Upgrade to Pro or buy this report to export PDF')
                    return
                  }
                  setExporting(true)
                  try {
                    await exportIdeaToPDF(idea)
                    toast('PDF downloaded!')
                  } catch {
                    toast('Failed to export PDF')
                  }
                  setExporting(false)
                }}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors cursor-pointer ${
                  canViewPro ? 'text-text-muted hover:bg-surface-2' : 'text-text-muted/50'
                }`}
              >
                {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
                {canViewPro ? 'Export PDF' : <><Crown className="h-3 w-3 text-brand" /> PDF</>}
              </button>
              {idea.generated_for === user?.id && (
                <button
                  onClick={async () => {
                    setToggling(true)
                    const newVal = !isPublic
                    const { error } = await (supabase.from('saas_ideas') as any).update({ is_public: newVal }).eq('id', idea.id)
                    if (!error) {
                      setIsPublic(newVal)
                      toast(newVal ? 'Shared to public' : 'Made private')
                    }
                    setToggling(false)
                  }}
                  disabled={toggling}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors cursor-pointer disabled:opacity-50 ml-auto ${
                    !isPublic ? 'text-emerald hover:bg-emerald/10' : 'text-text-muted hover:bg-surface-2'
                  }`}
                >
                  {!isPublic ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                  {toggling ? 'Updating...' : !isPublic ? 'Share to Public' : 'Make Private'}
                </button>
              )}
            </div>
          </article>

          {/* Comments Section */}
          <div id="comments" className="rounded-xl border border-border bg-surface-0 p-4 sm:p-6">
            <CommentSection ideaId={idea.id} commentCount={idea.comment_count || 0} />
          </div>
        </motion.div>
      </div>

      {/* Right sidebar — full idea details (like Reddit community card) */}
      <aside className="hidden lg:block w-[280px] shrink-0">
        <div className="sticky top-18 space-y-4">
          {/* Category card */}
          <div className="rounded-xl border border-border bg-surface-0 overflow-hidden">
            <div className={`h-14 ${colors.bgColor}`} />
            <div className="px-4 pb-4 -mt-4">
              <div className={`h-9 w-9 rounded-full ${colors.bgColor} border-2 border-surface-0 flex items-center justify-center mb-2`}>
                <span className={`text-sm font-bold ${colors.color}`}>{catLabel[0]}</span>
              </div>
              <h3 className="text-[14px] font-bold">{catLabel}</h3>
              <p className="text-[11px] text-text-muted mt-0.5">
                AI-generated SaaS ideas in the {catLabel} space.
              </p>

              <Link
                to={`/explore/${catSlug}`}
                className="block w-full mt-3 text-center rounded-full bg-brand text-white text-[12px] font-semibold py-1.5 hover:bg-brand/90 transition-colors"
              >
                Browse Category
              </Link>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border">
                <div>
                  <p className="text-[13px] font-bold">{formatNumber(idea.views || 0)}</p>
                  <p className="text-[10px] text-text-muted">Views</p>
                </div>
                <div>
                  <p className={`text-[13px] font-bold ${(idea.vote_score || 0) > 0 ? 'text-emerald' : (idea.vote_score || 0) < 0 ? 'text-rose' : ''}`}>{idea.vote_score || 0}</p>
                  <p className="text-[10px] text-text-muted">Vote Score</p>
                </div>
                <div>
                  <p className="text-[13px] font-bold">{idea.upvotes || 0}</p>
                  <p className="text-[10px] text-text-muted">Upvotes</p>
                </div>
                <div>
                  <p className="text-[13px] font-bold">{idea.comment_count || 0}</p>
                  <p className="text-[10px] text-text-muted">Comments</p>
                </div>
              </div>
            </div>
          </div>

          {/* Idea details card */}
          <div className="rounded-xl border border-border bg-surface-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h4 className="text-[12px] font-semibold uppercase tracking-wider text-text-muted">Idea Details</h4>
            </div>
            <div className="px-4 py-3 space-y-3">
              <SidebarRow icon={Calendar} label="Created" value={new Date(idea.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} />
              <SidebarRow icon={Eye} label="Visibility" value={idea.is_public ? 'Public' : 'Private'} />
              <SidebarRow icon={Globe} label="Platform" value={idea.platform?.replace('_', ' ') || '—'} capitalize />
              <SidebarRow icon={DollarSign} label="Model" value={idea.monetization_model?.replace('_', ' ') || '—'} capitalize />
              <SidebarRow icon={TrendingUp} label="Vote Score" value={String(idea.vote_score || 0)} highlight={idea.vote_score > 0 ? 'emerald' : idea.vote_score < 0 ? 'rose' : undefined} />
            </div>
          </div>

          {/* Revenue card — basic MRR for all, details for Pro */}
          {(idea.estimated_mrr_low || idea.estimated_mrr_high || idea.estimated_monthly_sales) && (
            <div className="rounded-xl border border-border bg-surface-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h4 className="text-[12px] font-semibold uppercase tracking-wider text-text-muted">Revenue</h4>
              </div>
              <div className="px-4 py-3 space-y-3">
                {idea.estimated_mrr_low && idea.estimated_mrr_high && (
                  <SidebarRow icon={DollarSign} label="Est. MRR" value={`${formatCurrency(idea.estimated_mrr_low)} – ${formatCurrency(idea.estimated_mrr_high)}`} highlight="emerald" />
                )}
                {idea.estimated_monthly_sales && (
                  <SidebarRow icon={DollarSign} label="Monthly Sales" value={formatCurrency(idea.estimated_monthly_sales)} highlight="emerald" />
                )}
                {canViewPro && (
                  <>
                    {idea.estimated_daily_sales && (
                      <SidebarRow icon={DollarSign} label="Daily Sales" value={formatCurrency(idea.estimated_daily_sales)} />
                    )}
                    {revenue?.customer_acquisition_cost && (
                      <SidebarRow icon={DollarSign} label="CAC" value={formatCurrency(revenue.customer_acquisition_cost)} />
                    )}
                    {revenue?.lifetime_value && (
                      <SidebarRow icon={DollarSign} label="LTV" value={formatCurrency(revenue.lifetime_value)} />
                    )}
                    {revenue?.free_trial_conversion_rate && (
                      <SidebarRow icon={Zap} label="Trial Conv." value={`${revenue.free_trial_conversion_rate}%`} />
                    )}
                  </>
                )}
                {!canViewPro && (
                  <button onClick={handleBuyReport} disabled={buyingReport} className="flex items-center gap-1.5 text-[11px] text-brand font-medium hover:underline mt-1">
                    <Crown className="h-3 w-3" /> {buyingReport ? 'Loading...' : 'Unlock report — $9.99'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Team card — Pro only */}
          {canViewPro && teamRoles.length > 0 && (
            <div className="rounded-xl border border-border bg-surface-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h4 className="text-[12px] font-semibold uppercase tracking-wider text-text-muted">Team</h4>
              </div>
              <div className="px-4 py-3 space-y-3">
                <SidebarRow icon={Users} label="Team Size" value={`${teamRoles.length} roles`} />
                {teamRoles.map((role, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-[12px] text-text-secondary truncate mr-2">{role.role}</span>
                    <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 shrink-0 ${
                      role.priority === 'critical' ? 'text-rose bg-rose/10' :
                      role.priority === 'important' ? 'text-amber bg-amber/10' :
                      'text-text-muted bg-surface-2'
                    }`}>
                      {role.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tech Stack card */}
          {techStack && (
            <div className="rounded-xl border border-border bg-surface-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h4 className="text-[12px] font-semibold uppercase tracking-wider text-text-muted">Tech Stack</h4>
              </div>
              <div className="px-4 py-3 space-y-2.5">
                {Object.entries(techStack).map(([category, techs]) => (
                  Array.isArray(techs) && techs.length > 0 && (
                    <div key={category}>
                      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">{category.replace('_', ' / ')}</p>
                      <div className="flex flex-wrap gap-1">
                        {techs.map((t: string) => {
                          const affiliate = getAffiliateLink(t)
                          return affiliate ? (
                            <a
                              key={t}
                              href={affiliate.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-medium bg-brand/10 border border-brand/20 rounded-full px-2 py-0.5 text-brand hover:bg-brand/20 transition-colors"
                              title={affiliate.tag}
                            >
                              {t} ↗
                            </a>
                          ) : (
                            <span key={t} className="text-[10px] font-medium bg-surface-2 border border-border rounded-full px-2 py-0.5 text-text-secondary">{t}</span>
                          )
                        })}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Competitors card — Pro only */}
          {canViewPro && competitors.length > 0 && (
            <div className="rounded-xl border border-border bg-surface-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h4 className="text-[12px] font-semibold uppercase tracking-wider text-text-muted">Competitors</h4>
              </div>
              <div className="px-4 py-3 space-y-2">
                {competitors.map((comp, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-[12px] text-text-secondary truncate mr-2">{comp.name}</span>
                    {comp.url && (
                      <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-accent hover:underline shrink-0">
                        Visit
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-1 py-3 space-y-2">
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <Link to="/privacy" className="text-[11px] text-text-muted hover:text-text-secondary hover:underline">Privacy Policy</Link>
              <Link to="/terms" className="text-[11px] text-text-muted hover:text-text-secondary hover:underline">User Agreement</Link>
              <Link to="/accessibility" className="text-[11px] text-text-muted hover:text-text-secondary hover:underline">Accessibility</Link>
            </div>
            <p className="text-[10px] text-text-muted">
              {siteConfig.name}, Inc. © {new Date().getFullYear()}. All rights reserved.
            </p>
          </div>
        </div>
      </aside>
    </div>
  )
}

function SidebarRow({ icon: Icon, label, value, capitalize: cap, highlight }: {
  icon: typeof Globe; label: string; value: string; capitalize?: boolean; highlight?: 'emerald' | 'rose'
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-text-muted shrink-0" />
      <span className="text-[12px] text-text-muted">{label}</span>
      <span className={`text-[12px] font-medium ml-auto ${
        highlight === 'emerald' ? 'text-emerald' :
        highlight === 'rose' ? 'text-rose' : ''
      } ${cap ? 'capitalize' : ''}`}>
        {value}
      </span>
    </div>
  )
}
