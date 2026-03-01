import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Loader2, Globe, Smartphone, Monitor,
  Puzzle, Code2, Layers, Share2, Bookmark, BookmarkCheck, Calendar, Eye, Users, TrendingUp, DollarSign, Zap, Lock
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { useRecent } from '@/hooks/use-recent'
import { useBookmarks } from '@/hooks/use-bookmarks'
import { useToast } from '@/components/ui/toast'
import { VoteButton } from '@/components/ideas/vote-button'
import { formatCurrency, formatNumber, timeAgo } from '@/lib/utils'
import { categoryColor, toSlug, useCategories } from '@/lib/categories'
import type { SaasIdea, PricingTier, TeamRole, TechStack, Competitor } from '@/types/database'

const platformIcons: Record<string, typeof Globe> = {
  web: Globe, mobile: Smartphone, desktop: Monitor,
  browser_extension: Puzzle, api: Code2, multi_platform: Layers,
}

export function IdeaDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  const { addRecent } = useRecent()
  const { categories } = useCategories()
  const [idea, setIdea] = useState<SaasIdea | null>(null)
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPublic, setIsPublic] = useState(false)
  const [toggling, setToggling] = useState(false)
  const { isBookmarked, toggleBookmark } = useBookmarks()
  const { toast } = useToast()

  useEffect(() => {
    if (!slug) return
    const fetchData = async () => {
      // Try slug first, fall back to id for old links
      let { data } = await supabase
        .from('saas_ideas')
        .select('*')
        .eq('slug', slug)
        .single()

      // Fallback: if slug looks like a UUID, try by id
      if (!data && /^[0-9a-f]{8}-/.test(slug)) {
        const res = await supabase
          .from('saas_ideas')
          .select('*')
          .eq('id', slug)
          .single()
        data = res.data
      }

      const ideaData = data as SaasIdea | null
      setIdea(ideaData)

      if (ideaData) {
        setIsPublic(ideaData.is_public)
        addRecent({
          id: ideaData.id,
          title: ideaData.title,
          category: ideaData.category || 'SaaS',
          path: `/idea/${ideaData.slug || ideaData.id}`,
          upvotes: ideaData.upvotes || 0,
        })
        // Increment view count (deduplicate per session)
        const viewKey = `viewed_${ideaData.id}`
        if (!sessionStorage.getItem(viewKey)) {
          sessionStorage.setItem(viewKey, '1')
          ;(supabase.rpc as any)('increment_views', { idea_id: ideaData.id }).then(() => {
            setIdea(prev => prev ? { ...prev, views: (prev.views || 0) + 1 } : prev)
          })
        }
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
    fetchData()
  }, [slug, user, addRecent])

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
                  {idea.estimated_daily_sales && <li>Daily Sales: <strong className="text-emerald">{formatCurrency(idea.estimated_daily_sales)}</strong></li>}
                  {idea.estimated_weekly_sales && <li>Weekly Sales: <strong className="text-emerald">{formatCurrency(idea.estimated_weekly_sales)}</strong></li>}
                  {idea.estimated_monthly_sales && <li>Monthly Sales: <strong className="text-emerald">{formatCurrency(idea.estimated_monthly_sales)}</strong></li>}
                  {idea.estimated_mrr_low && idea.estimated_mrr_high && (
                    <li>Estimated MRR: <strong className="text-brand">{formatCurrency(idea.estimated_mrr_low)} – {formatCurrency(idea.estimated_mrr_high)}</strong></li>
                  )}
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
              </div>

              {/* Pricing */}
              {pricingTiers.length > 0 && (
                <div>
                  <p className="text-text-primary font-semibold mb-2">Pricing Tiers:</p>
                  {pricingTiers.map((tier, i) => (
                    <div key={i} className="mb-3">
                      <p className="font-medium text-text-primary">
                        {tier.name} — <strong>{formatCurrency(tier.price)}</strong>/{tier.billing}
                        {i === 1 && <span className="text-brand ml-1">(most popular)</span>}
                      </p>
                      {tier.features && tier.features.length > 0 && (
                        <ul className="list-disc list-inside space-y-0.5 ml-1 mt-1">
                          {tier.features.map((f, fi) => (
                            <li key={fi}>{f}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Tech Stack */}
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
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  toast('Link copied to clipboard')
                }}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-text-muted hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5" /> Share
              </button>
              <button
                onClick={async () => {
                  if (!user) return
                  const saved = await toggleBookmark(idea.id)
                  toast(saved ? 'Idea saved' : 'Removed from saved')
                }}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors cursor-pointer ${
                  isBookmarked(idea.id) ? 'text-brand' : 'text-text-muted hover:bg-surface-2'
                }`}
              >
                {isBookmarked(idea.id) ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
                {isBookmarked(idea.id) ? 'Saved' : 'Save'}
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
                  <p className="text-[13px] font-bold">{catData?.count || 0}</p>
                  <p className="text-[10px] text-text-muted">Ideas in Category</p>
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

          {/* Revenue card */}
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
              </div>
            </div>
          )}

          {/* Team card */}
          {teamRoles.length > 0 && (
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
                        {techs.map((t: string) => (
                          <span key={t} className="text-[10px] font-medium bg-surface-2 border border-border rounded-full px-2 py-0.5 text-text-secondary">{t}</span>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Competitors card */}
          {competitors.length > 0 && (
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
              OpenSaaSIdea, Inc. © {new Date().getFullYear()}. All rights reserved.
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
