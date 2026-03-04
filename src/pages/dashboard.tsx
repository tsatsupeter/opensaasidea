import { useState, useEffect, useCallback } from 'react'
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
import { generateSaasIdea, saveIdeaToSupabase, type GenerationStep } from '@/lib/ai'
import { useBookmarks } from '@/hooks/use-bookmarks'
import { Logo } from '@/components/ui/logo'
import { UpgradePrompt } from '@/components/subscription/upgrade-prompt'
import { siteConfig } from '@/lib/site-config'
import type { SaasIdea } from '@/types/database'

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

  const handleGenerate = async () => {
    if (!user) return
    if (!checkCanGenerate()) return

    // Fresh server-side limit check before starting
    const canGo = await serverCheckCanGenerate()
    if (!canGo) {
      console.warn('Server-side limit check failed')
      return
    }

    setGenerating(true)
    setGenStep(null)

    // Optimistic deduction: increment count BEFORE generating
    // This prevents double-generation even if the user somehow triggers twice
    const incremented = await incrementDailyGeneration()
    if (!incremented) {
      console.warn('Failed to increment daily generation — limit may be reached')
      setGenerating(false)
      return
    }

    try {
      const { data: skills } = await supabase
        .from('user_skills')
        .select('skill_name')
        .eq('user_id', user.id)

      const { data: feedback } = await supabase
        .from('saas_ideas')
        .select('category, vote_score')
        .eq('generated_for', user.id)
        .order('vote_score', { ascending: false })
        .limit(20)

      const likedCategories = (feedback || [])
        .filter((f: any) => f.vote_score > 0)
        .map((f: any) => f.category)
        .filter(Boolean)
      const dislikedCategories = (feedback || [])
        .filter((f: any) => f.vote_score < 0)
        .map((f: any) => f.category)
        .filter(Boolean)

      const idea = await generateSaasIdea({
        userSkills: (skills || []).map((s: any) => s.skill_name),
        userInterests: profile?.interests || [],
        preferredPlatforms: profile?.preferred_platforms || [],
        experienceLevel: profile?.experience_level || undefined,
        voteFeedback: {
          liked_categories: [...new Set(likedCategories)] as string[],
          disliked_categories: [...new Set(dislikedCategories)] as string[],
        },
        priorityGeneration: !isFree,
        onProgress: (step) => setGenStep(step),
      })

      if (idea) {
        setGenStep('done')
        const { error: saveErr } = await saveIdeaToSupabase(idea, false, user.id)
        if (saveErr) {
          console.error('Failed to save idea:', saveErr)
        }
        await fetchMyIdeas()
        await new Promise(r => setTimeout(r, 1500))
      }
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
