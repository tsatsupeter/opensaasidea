import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Lock, Globe, RefreshCw, BookmarkCheck, Crown } from 'lucide-react'
import { DashboardSkeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { IdeaCard } from '@/components/ideas/idea-card'
import { GenerationAnimation } from '@/components/ideas/generation-animation'
import { useAuth } from '@/hooks/use-auth'
import { useAuthModal } from '@/components/ui/auth-modal'
import { useSubscription } from '@/hooks/use-subscription'
import { supabase, SAFE_IDEA_COLUMNS } from '@/lib/supabase'
import type { GenerationStep } from '@/lib/ai'
import { useBookmarks } from '@/hooks/use-bookmarks'
import { Logo } from '@/components/ui/logo'
import { UpgradePrompt } from '@/components/subscription/upgrade-prompt'
import { siteConfig } from '@/lib/site-config'
import type { SaasIdea } from '@/types/database'

const GEN_PENDING_KEY = 'gen_pending'
const GEN_PENDING_MAX_AGE = 120_000 // 2 minutes

// Time-based step schedule (ms from start)
const STEP_SCHEDULE: Array<{ step: GenerationStep; delay: number }> = [
  { step: 'preparing', delay: 0 },
  { step: 'researching', delay: 2000 },
  { step: 'building_context', delay: 6000 },
  { step: 'generating', delay: 8500 },
  { step: 'finalizing', delay: 24000 },
]

export function DashboardPage() {
  const navigate = useNavigate()
  const { openAuthModal } = useAuthModal()
  const { user, profile, loading: authLoading } = useAuth()
  const { checkCanGenerate, serverCheckCanGenerate, remainingIdeas, isFree, tier, incrementDailyGeneration } = useSubscription()
  const [privateIdeas, setPrivateIdeas] = useState<SaasIdea[]>([])
  const [publicIdeas, setPublicIdeas] = useState<SaasIdea[]>([])
  const [savedIdeas, setSavedIdeas] = useState<SaasIdea[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [genStep, setGenStep] = useState<GenerationStep | null>(null)
  const { bookmarkedIds } = useBookmarks()

  const stepTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Warn user before leaving while generating
  useEffect(() => {
    if (!generating) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [generating])

  // Time-based step progression
  const startStepTimers = useCallback(() => {
    stepTimersRef.current.forEach(clearTimeout)
    stepTimersRef.current = []
    for (const { step, delay } of STEP_SCHEDULE) {
      stepTimersRef.current.push(setTimeout(() => setGenStep(step), delay))
    }
  }, [])

  const clearStepTimers = useCallback(() => {
    stepTimersRef.current.forEach(clearTimeout)
    stepTimersRef.current = []
  }, [])

  const fetchMyIdeas = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('saas_ideas')
        .select(SAFE_IDEA_COLUMNS)
        .eq('generated_for', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) console.error('Dashboard ideas error:', error)
      const all = (data as SaasIdea[]) || []
      setPrivateIdeas(all.filter(i => !i.is_public))
      setPublicIdeas(all.filter(i => i.is_public))
    } catch (err) {
      console.error('Dashboard fetch failed:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  const fetchSavedIdeas = useCallback(async () => {
    if (!user || bookmarkedIds.size === 0) {
      setSavedIdeas([])
      return
    }
    try {
      const ids = Array.from(bookmarkedIds)
      const { data } = await supabase
        .from('saas_ideas')
        .select(SAFE_IDEA_COLUMNS)
        .in('id', ids)
        .order('created_at', { ascending: false })
      setSavedIdeas((data as SaasIdea[]) || [])
    } catch (err) {
      console.error('Saved ideas fetch failed:', err)
    }
  }, [user, bookmarkedIds])

  useEffect(() => {
    fetchSavedIdeas()
  }, [fetchSavedIdeas])

  useEffect(() => {
    if (!authLoading && !user) {
      openAuthModal('login')
      return
    }
    if (user && profile && !profile.onboarding_completed) {
      navigate('/onboarding')
      return
    }
    if (user) fetchMyIdeas()
  }, [user, profile, authLoading, openAuthModal, navigate, fetchMyIdeas])

  // Refresh recovery: check for pending generation on mount
  useEffect(() => {
    if (!user || authLoading) return
    const pending = localStorage.getItem(GEN_PENDING_KEY)
    if (!pending) return
    const elapsed = Date.now() - parseInt(pending, 10)
    if (elapsed > GEN_PENDING_MAX_AGE) {
      localStorage.removeItem(GEN_PENDING_KEY)
      return
    }
    // Generation was in progress — poll for newly created idea
    setGenerating(true)
    startStepTimers()
    let cancelled = false
    const poll = async () => {
      const since = new Date(parseInt(pending, 10)).toISOString()
      const { data } = await supabase
        .from('saas_ideas')
        .select('id, slug, title')
        .eq('generated_for', user.id)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(1)
      if (data && data.length > 0) {
        localStorage.removeItem(GEN_PENDING_KEY)
        clearStepTimers()
        setGenStep('done')
        await fetchMyIdeas()
        await new Promise(r => setTimeout(r, 1500))
        setGenerating(false)
        setGenStep(null)
        return
      }
      if (!cancelled && Date.now() - parseInt(pending, 10) < GEN_PENDING_MAX_AGE) {
        setTimeout(poll, 3000)
      } else {
        localStorage.removeItem(GEN_PENDING_KEY)
        setGenerating(false)
        setGenStep(null)
        clearStepTimers()
      }
    }
    poll()
    return () => { cancelled = true }
  }, [user, authLoading, startStepTimers, clearStepTimers, fetchMyIdeas])

  const handleGenerate = async () => {
    if (!user) return
    if (!checkCanGenerate()) return

    const canGo = await serverCheckCanGenerate()
    if (!canGo) {
      console.warn('Server-side limit check failed')
      return
    }

    setGenerating(true)
    setGenStep(null)

    const incremented = await incrementDailyGeneration()
    if (!incremented) {
      console.warn('Failed to increment daily generation — limit may be reached')
      setGenerating(false)
      return
    }

    // Mark generation as pending (survives refresh)
    localStorage.setItem(GEN_PENDING_KEY, Date.now().toString())
    startStepTimers()

    try {
      // Gather user context for personalization
      const [{ data: skills }, { data: feedback }] = await Promise.all([
        supabase.from('user_skills').select('skill_name').eq('user_id', user.id),
        supabase.from('saas_ideas').select('category, vote_score').eq('generated_for', user.id).order('vote_score', { ascending: false }).limit(20),
      ])

      const likedCategories = (feedback || []).filter((f: any) => f.vote_score > 0).map((f: any) => f.category).filter(Boolean)
      const dislikedCategories = (feedback || []).filter((f: any) => f.vote_score < 0).map((f: any) => f.category).filter(Boolean)

      // Call server-side edge function (runs to completion even if client disconnects)
      const { data, error } = await supabase.functions.invoke('generate-user-idea', {
        body: {
          skills: (skills || []).map((s: any) => s.skill_name),
          interests: profile?.interests || [],
          platforms: profile?.preferred_platforms || [],
          experience_level: profile?.experience_level || undefined,
          vote_feedback: {
            liked_categories: [...new Set(likedCategories)] as string[],
            disliked_categories: [...new Set(dislikedCategories)] as string[],
          },
          site_mode: siteConfig.mode,
          priority: !isFree,
        },
      })

      localStorage.removeItem(GEN_PENDING_KEY)
      clearStepTimers()

      if (error || !data?.success) {
        console.error('Generation failed:', error || data?.error)
        // Server already handles credit rollback on failure
      } else {
        setGenStep('done')
        await fetchMyIdeas()
        await new Promise(r => setTimeout(r, 1500))
      }
    } catch (err) {
      console.error('Generation error:', err)
      localStorage.removeItem(GEN_PENDING_KEY)
      clearStepTimers()
    } finally {
      setGenerating(false)
      setGenStep(null)
    }
  }

  if (authLoading || loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <LayoutDashboard className="h-6 w-6 text-brand" />
              Your Dashboard
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}!
            </p>
          </div>
          {!generating && (
            <div className="flex items-center gap-3 shrink-0">
              {remainingIdeas !== null ? (
                <span className={`text-xs ${remainingIdeas === 0 ? 'text-rose' : 'text-text-muted'}`}>
                  {remainingIdeas === 0 ? 'Daily limit reached' : `${remainingIdeas} idea${remainingIdeas !== 1 ? 's' : ''} left today`}
                </span>
              ) : (
                <span className="text-xs text-brand font-medium flex items-center gap-1">
                  <Crown className="h-3 w-3" /> Unlimited
                </span>
              )}
              <Button onClick={handleGenerate} className="group" disabled={!checkCanGenerate()}>
                <Logo className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                Generate My Idea
              </Button>
            </div>
          )}
        </div>

        {/* Upgrade prompt when limit hit */}
        {isFree && !checkCanGenerate() && !generating && (
          <div className="mb-6">
            <UpgradePrompt
              feature="You've used your daily free idea"
              description="Upgrade to Pro for unlimited idea generation, PDF exports, and detailed market reports."
            />
          </div>
        )}

        {/* Fun generation animation */}
        <AnimatePresence>
          {generating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <GenerationAnimation isGenerating={generating} currentStep={genStep} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Private ideas */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Lock className="h-4 w-4 text-text-muted" />
              Your Private Ideas
            </h2>
            <Button variant="ghost" size="sm" onClick={fetchMyIdeas}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>

          {privateIdeas.length === 0 && !generating ? (
            <Card className="border-dashed border-border">
              <CardContent className="flex flex-col items-center justify-center py-14">
                <div className="h-14 w-14 rounded-2xl bg-brand/10 flex items-center justify-center mb-4">
                  <Logo className="h-7 w-7" />
                </div>
                <h3 className="font-semibold mb-1">No private ideas yet</h3>
                <p className="text-sm text-text-secondary mb-5 text-center max-w-sm">
                  Hit "Generate My Idea" to get a personalized {siteConfig.mode === 'full' ? 'project' : 'SaaS'} idea based on your skills and interests.
                </p>
                <Button onClick={handleGenerate} disabled={!checkCanGenerate()}>
                  <Logo className="h-4 w-4" />
                  Generate Now
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border bg-surface-0 overflow-hidden">
              {privateIdeas.map((idea, i) => (
                <IdeaCard key={idea.id} idea={idea} index={i} onPublicToggle={fetchMyIdeas} />
              ))}
            </div>
          )}
        </div>

        {/* Shared to Public */}
        {publicIdeas.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald" />
                Shared to Public
              </h2>
            </div>
            <div className="divide-y divide-border rounded-xl border border-border bg-surface-0 overflow-hidden">
              {publicIdeas.map((idea, i) => (
                <IdeaCard key={idea.id} idea={idea} index={i} onPublicToggle={fetchMyIdeas} />
              ))}
            </div>
          </div>
        )}

        {/* Saved Ideas */}
        {savedIdeas.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <BookmarkCheck className="h-4 w-4 text-brand" />
                Saved Ideas
              </h2>
            </div>
            <div className="divide-y divide-border rounded-xl border border-border bg-surface-0 overflow-hidden">
              {savedIdeas.map((idea, i) => (
                <IdeaCard key={idea.id} idea={idea} index={i} />
              ))}
            </div>
          </div>
        )}

      </motion.div>
    </div>
  )
}
