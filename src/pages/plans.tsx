import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BookOpen, ArrowLeft, ExternalLink, Copy, Check,
  Share2, Trash2, Globe, Lock, Clock, Play
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/components/ui/toast'
import { PlanWizard } from '@/components/ideas/plan-wizard'
import { cn } from '@/lib/utils'
import { renderMarkdown } from '@/lib/markdown'
import { PlansSkeleton, SharedPlanSkeleton } from '@/components/ui/skeleton'
import type { SaasIdea } from '@/types/database'

interface PlanRow {
  id: string
  idea_id: string
  summary: string | null
  questions: any[]
  plan_content: string | null
  recommended_affiliates: any[]
  status: string
  share_token: string | null
  is_public: boolean
  created_at: string
  updated_at: string
  idea?: { title: string; slug: string | null; category: string }
}

// Shared plan view (public, no auth required)
export function SharedPlanPage() {
  const { token } = useParams<{ token: string }>()
  const [plan, setPlan] = useState<PlanRow | null>(null)
  const [ideaTitle, setIdeaTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!token) return
    const fetchPlan = async () => {
      const { data } = await supabase
        .from('idea_plans')
        .select('*, idea:saas_ideas(title, slug, category)')
        .eq('share_token', token)
        .single()
      if (data) {
        setPlan(data as any)
        setIdeaTitle((data as any).idea?.title || 'Untitled Idea')
      } else {
        setError('Plan not found or not shared publicly.')
      }
      setLoading(false)
    }
    fetchPlan()
  }, [token])

  if (loading) {
    return <SharedPlanSkeleton />
  }

  if (error || !plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <BookOpen className="h-12 w-12 text-text-muted" />
        <h2 className="text-xl font-bold">{error || 'Plan not found'}</h2>
        <Link to="/" className="text-brand hover:underline">Back to Feed</Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="text-text-muted hover:text-text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1">
            <h1 className="text-[18px] font-bold text-text-primary">Implementation Plan</h1>
            <p className="text-[13px] text-text-muted">for {ideaTitle}</p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              setCopied(true)
              toast('Link copied!')
              setTimeout(() => setCopied(false), 2000)
            }}
            className="flex items-center gap-1.5 text-[12px] text-text-muted hover:text-text-primary px-3 py-1.5 rounded-lg hover:bg-surface-2 transition-colors cursor-pointer"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald" /> : <Share2 className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Share'}
          </button>
        </div>

        {/* Summary */}
        {plan.summary && (
          <div className="rounded-xl bg-surface-1 border border-border p-4 mb-4">
            <h3 className="text-[13px] font-semibold text-text-primary mb-1">Summary</h3>
            <p className="text-[13px] text-text-secondary leading-relaxed">{plan.summary}</p>
          </div>
        )}

        {/* Plan content */}
        {plan.plan_content && (
          <div className="rounded-xl border border-border bg-surface-0 p-5">
            <div
              className="plan-markdown"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(plan.plan_content) }}
            />
          </div>
        )}

        {/* Recommended tools */}
        {plan.recommended_affiliates?.length > 0 && (
          <div className="rounded-xl border border-brand/20 bg-brand/5 p-4 mt-4">
            <h3 className="text-[13px] font-semibold text-brand mb-3">Recommended Tools</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {plan.recommended_affiliates.map((aff: any, i: number) => (
                <a
                  key={i}
                  href={aff.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-surface-0 border border-border hover:border-brand/30 transition-colors group"
                >
                  {aff.logo_url ? (
                    <img src={aff.logo_url} alt={aff.display_name} className="h-8 w-8 rounded object-contain" />
                  ) : (
                    <div className="h-8 w-8 rounded bg-surface-2 flex items-center justify-center">
                      <ExternalLink className="h-3.5 w-3.5 text-text-muted" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-text-primary group-hover:text-brand truncate">{aff.display_name}</p>
                    <p className="text-[10px] text-text-muted truncate">{aff.reason || aff.tag}</p>
                  </div>
                  <ExternalLink className="h-3 w-3 text-text-muted shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Link to idea */}
        {plan.idea && (
          <div className="mt-6 text-center">
            <Link
              to={`/idea/${(plan.idea as any).slug || plan.idea_id}`}
              className="text-[13px] text-brand hover:underline"
            >
              View original idea →
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  )
}

// My Plans page (dashboard tab or standalone)
export function MyPlansPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [plans, setPlans] = useState<PlanRow[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [resumingPlan, setResumingPlan] = useState<PlanRow | null>(null)
  const [resumeIdea, setResumeIdea] = useState<SaasIdea | null>(null)

  const fetchPlans = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await (supabase
      .from('idea_plans') as any)
      .select('*, idea:saas_ideas(id, title, slug, category, tagline, description, platform, monetization_model, tech_stack, estimated_mrr_low, estimated_mrr_high)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setPlans((data || []) as PlanRow[])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  const handleResume = (plan: PlanRow) => {
    // Build a minimal SaasIdea object from the joined idea data
    const ideaData = plan.idea as any
    if (!ideaData) {
      toast('The original idea was deleted. This plan can no longer be resumed.')
      return
    }
    setResumeIdea({
      id: ideaData.id || plan.idea_id,
      title: ideaData.title || 'Untitled',
      slug: ideaData.slug,
      category: ideaData.category,
      tagline: ideaData.tagline || '',
      description: ideaData.description || '',
      platform: ideaData.platform || '',
      monetization_model: ideaData.monetization_model || '',
      tech_stack: ideaData.tech_stack || {},
      estimated_mrr_low: ideaData.estimated_mrr_low || 0,
      estimated_mrr_high: ideaData.estimated_mrr_high || 0,
    } as SaasIdea)
    setResumingPlan(plan)
  }

  const deletePlan = async (id: string) => {
    await (supabase.from('idea_plans') as any).delete().eq('id', id)
    setPlans(prev => prev.filter(p => p.id !== id))
    toast('Plan deleted')
  }

  const togglePublic = async (plan: PlanRow) => {
    const newVal = !plan.is_public
    await (supabase.from('idea_plans') as any).update({ is_public: newVal }).eq('id', plan.id)
    setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_public: newVal } : p))
    toast(newVal ? 'Plan is now public' : 'Plan is now private')
  }

  const copyShareLink = (plan: PlanRow) => {
    if (!plan.share_token) return
    navigator.clipboard.writeText(`${window.location.origin}/plan/${plan.share_token}`)
    setCopiedId(plan.id)
    toast('Share link copied!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <BookOpen className="h-12 w-12 text-text-muted" />
        <h2 className="text-xl font-bold">Sign in to view your plans</h2>
        <Link to="/login" className="text-brand hover:underline">Sign in</Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <Link to="/dashboard" className="text-text-muted hover:text-text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-[20px] font-bold text-text-primary">My Plans</h1>
            <p className="text-[13px] text-text-muted">{plans.length} implementation plan{plans.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {loading ? (
          <PlansSkeleton />
        ) : plans.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface-0 p-8 text-center">
            <BookOpen className="h-10 w-10 text-text-muted mx-auto mb-3" />
            <h3 className="text-[15px] font-bold text-text-primary mb-1">No plans yet</h3>
            <p className="text-[13px] text-text-muted mb-4">
              Go to any idea and click "Plan" to generate a personalized implementation plan.
            </p>
            <Link to="/" className="text-[13px] text-brand hover:underline">Browse Ideas</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {plans.map(plan => (
              <div
                key={plan.id}
                onClick={() => {
                  if (plan.status === 'complete' && plan.share_token) {
                    navigate(`/plan/${plan.share_token}`)
                  } else if (plan.status !== 'complete') {
                    handleResume(plan)
                  }
                }}
                className="rounded-xl border border-border bg-surface-0 p-4 hover:border-brand/20 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                    <BookOpen className="h-5 w-5 text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-text-primary">
                      {(plan.idea as any)?.title || 'Untitled Plan'}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={cn(
                        'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                        plan.status === 'complete' ? 'bg-emerald/10 text-emerald' :
                        plan.status === 'error' ? 'bg-rose/10 text-rose' :
                        'bg-amber/10 text-amber'
                      )}>
                        {plan.status === 'complete' ? 'Complete' :
                         plan.status === 'questioning' ? 'In Progress' :
                         plan.status === 'planning' ? 'Generating...' :
                         plan.status === 'error' ? 'Error' : 'Draft'}
                      </span>
                      {(plan.idea as any)?.category && (
                        <span className="text-[10px] text-text-muted bg-surface-2 rounded-full px-2 py-0.5">
                          {(plan.idea as any).category}
                        </span>
                      )}
                      <span className="text-[10px] text-text-muted flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(plan.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    {plan.summary && (
                      <p className="text-[12px] text-text-muted mt-2 line-clamp-2">{plan.summary}</p>
                    )}
                  </div>
                </div>

                {/* Actions — stop propagation so clicks here don't navigate */}
                {plan.status !== 'complete' && plan.status !== 'error' && (
                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleResume(plan)}
                      className="flex items-center gap-1.5 text-[12px] font-semibold text-brand hover:text-brand/80 px-3 py-1.5 rounded-lg bg-brand/10 hover:bg-brand/15 transition-colors cursor-pointer"
                    >
                      <Play className="h-3 w-3" /> Continue Planning
                    </button>
                    <div className="flex-1" />
                    <button
                      onClick={() => deletePlan(plan.id)}
                      className="flex items-center gap-1 text-[11px] text-rose hover:text-rose/80 px-2 py-1 rounded hover:bg-rose/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                )}
                {plan.status === 'complete' && (
                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => copyShareLink(plan)}
                      className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-primary px-2 py-1 rounded hover:bg-surface-2 transition-colors cursor-pointer"
                    >
                      {copiedId === plan.id ? <Check className="h-3 w-3 text-emerald" /> : <Share2 className="h-3 w-3" />}
                      {copiedId === plan.id ? 'Copied' : 'Share'}
                    </button>
                    <button
                      onClick={() => {
                        if (plan.plan_content) {
                          navigator.clipboard.writeText(plan.plan_content)
                          toast('Plan copied as markdown!')
                        }
                      }}
                      className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-primary px-2 py-1 rounded hover:bg-surface-2 transition-colors cursor-pointer"
                    >
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                    <button
                      onClick={() => togglePublic(plan)}
                      className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-primary px-2 py-1 rounded hover:bg-surface-2 transition-colors cursor-pointer"
                    >
                      {plan.is_public ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      {plan.is_public ? 'Public' : 'Private'}
                    </button>
                    <div className="flex-1" />
                    <button
                      onClick={() => deletePlan(plan.id)}
                      className="flex items-center gap-1 text-[11px] text-rose hover:text-rose/80 px-2 py-1 rounded hover:bg-rose/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Plan Wizard for resuming in-progress plans */}
      {resumeIdea && resumingPlan && (
        <PlanWizard
          idea={resumeIdea}
          open={!!resumingPlan}
          existingPlanId={resumingPlan.id}
          onClose={() => {
            setResumingPlan(null)
            setResumeIdea(null)
            // Refresh the list to pick up status changes
            fetchPlans()
          }}
        />
      )}
    </div>
  )
}

