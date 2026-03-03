import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Loader2, Lock, Globe, RefreshCw, BookmarkCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { IdeaCard } from '@/components/ideas/idea-card'
import { GenerationAnimation } from '@/components/ideas/generation-animation'
import { useAuth } from '@/hooks/use-auth'
import { useSubscription } from '@/hooks/use-subscription'
import { supabase } from '@/lib/supabase'
import { generateSaasIdea, saveIdeaToSupabase } from '@/lib/ai'
import { useBookmarks } from '@/hooks/use-bookmarks'
import { Logo } from '@/components/ui/logo'
import { UpgradePrompt } from '@/components/subscription/upgrade-prompt'
import type { SaasIdea } from '@/types/database'

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()
  const { checkCanGenerate, remainingIdeas, isFree, tier, incrementDailyGeneration } = useSubscription()
  const [privateIdeas, setPrivateIdeas] = useState<SaasIdea[]>([])
  const [publicIdeas, setPublicIdeas] = useState<SaasIdea[]>([])
  const [savedIdeas, setSavedIdeas] = useState<SaasIdea[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const { bookmarkedIds } = useBookmarks()

  const fetchMyIdeas = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('saas_ideas')
      .select('*')
      .eq('generated_for', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    const all = (data as SaasIdea[]) || []
    setPrivateIdeas(all.filter(i => !i.is_public))
    setPublicIdeas(all.filter(i => i.is_public))

    setLoading(false)
  }, [user])

  const fetchSavedIdeas = useCallback(async () => {
    if (!user || bookmarkedIds.size === 0) {
      setSavedIdeas([])
      return
    }
    const ids = Array.from(bookmarkedIds)
    const { data } = await supabase
      .from('saas_ideas')
      .select('*')
      .in('id', ids)
      .order('created_at', { ascending: false })
    setSavedIdeas((data as SaasIdea[]) || [])
  }, [user, bookmarkedIds])

  useEffect(() => {
    fetchSavedIdeas()
  }, [fetchSavedIdeas])

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
      return
    }
    if (user && profile && !profile.onboarding_completed) {
      navigate('/onboarding')
      return
    }
    if (user) fetchMyIdeas()
  }, [user, profile, authLoading, navigate, fetchMyIdeas])

  const handleGenerate = async () => {
    if (!user) return
    if (!checkCanGenerate()) return
    setGenerating(true)
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
      })

      if (idea) {
        await saveIdeaToSupabase(idea, false, user.id)
        await incrementDailyGeneration()
        await fetchMyIdeas()
      }
    } finally {
      setGenerating(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
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
              {remainingIdeas !== null && (
                <span className="text-xs text-text-muted">
                  {remainingIdeas} idea{remainingIdeas !== 1 ? 's' : ''} left today
                </span>
              )}
              <Button onClick={handleGenerate} className="group" disabled={!checkCanGenerate()}>
                <Logo className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                Generate My Idea
              </Button>
            </div>
          )}
        </div>

        {/* Fun generation animation */}
        <AnimatePresence>
          {generating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <GenerationAnimation isGenerating={generating} />
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
                  Hit "Generate My Idea" to get a personalized SaaS idea based on your skills and interests.
                </p>
                <Button onClick={handleGenerate}>
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
