import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Sparkles, Loader2, Lock, RefreshCw, TrendingUp, Eye, ThumbsUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { IdeaCard } from '@/components/ideas/idea-card'
import { GenerationAnimation } from '@/components/ideas/generation-animation'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { generateSaasIdea, saveIdeaToSupabase } from '@/lib/ai'
import type { SaasIdea } from '@/types/database'

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()
  const [privateIdeas, setPrivateIdeas] = useState<SaasIdea[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [stats, setStats] = useState({ totalIdeas: 0, totalUpvotes: 0, todayIdeas: 0 })

  const fetchPrivateIdeas = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('saas_ideas')
      .select('*')
      .eq('generated_for', user.id)
      .eq('is_public', false)
      .order('created_at', { ascending: false })
      .limit(20)
    setPrivateIdeas((data as SaasIdea[]) || [])

    const today = new Date().toISOString().split('T')[0]
    const todayCount = (data || []).filter((d: any) => d.created_at?.startsWith(today)).length

    const { count } = await supabase
      .from('saas_ideas')
      .select('*', { count: 'exact', head: true })
      .eq('generated_for', user.id)

    setStats({
      totalIdeas: count || 0,
      totalUpvotes: (data || []).reduce((sum: number, d: any) => sum + (d.upvotes || 0), 0),
      todayIdeas: todayCount,
    })
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
      return
    }
    if (user && profile && !profile.onboarding_completed) {
      navigate('/onboarding')
      return
    }
    if (user) fetchPrivateIdeas()
  }, [user, profile, authLoading, navigate, fetchPrivateIdeas])

  const handleGenerate = async () => {
    if (!user) return
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
        await fetchPrivateIdeas()
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
            <Button onClick={handleGenerate} className="shrink-0 group">
              <Sparkles className="h-4 w-4 group-hover:rotate-12 transition-transform" />
              Generate My Idea
            </Button>
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                  <Eye className="h-4 w-4 text-brand" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats.totalIdeas}</p>
                  <p className="text-[11px] text-text-muted">Total Ideas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <ThumbsUp className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats.totalUpvotes}</p>
                  <p className="text-[11px] text-text-muted">Upvotes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-4 w-4 text-emerald" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats.todayIdeas}</p>
                  <p className="text-[11px] text-text-muted">Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Private ideas */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Lock className="h-4 w-4 text-text-muted" />
              Your Private Ideas
            </h2>
            <Button variant="ghost" size="sm" onClick={fetchPrivateIdeas}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>

          {privateIdeas.length === 0 && !generating ? (
            <Card className="border-dashed border-border">
              <CardContent className="flex flex-col items-center justify-center py-14">
                <div className="h-14 w-14 rounded-2xl bg-brand/10 flex items-center justify-center mb-4">
                  <Sparkles className="h-7 w-7 text-brand" />
                </div>
                <h3 className="font-semibold mb-1">No private ideas yet</h3>
                <p className="text-sm text-text-secondary mb-5 text-center max-w-sm">
                  Hit "Generate My Idea" to get a personalized SaaS idea based on your skills and interests.
                </p>
                <Button onClick={handleGenerate}>
                  <Sparkles className="h-4 w-4" />
                  Generate Now
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border bg-surface-0 overflow-hidden">
              {privateIdeas.map((idea, i) => (
                <IdeaCard key={idea.id} idea={idea} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Profile badges */}
        {profile && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {profile.interests?.map((interest) => (
                  <Badge key={interest} variant="default">{interest}</Badge>
                ))}
                {profile.preferred_platforms?.map((p) => (
                  <Badge key={p} variant="accent">{p}</Badge>
                ))}
                {profile.experience_level && (
                  <Badge variant="secondary">{profile.experience_level}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  )
}
