import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart3, TrendingUp, Eye, ThumbsUp, ThumbsDown, Calendar,
  Loader2, Lightbulb, Globe, Lock, Bookmark, Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { useBookmarks } from '@/hooks/use-bookmarks'
import { supabase } from '@/lib/supabase'
import type { SaasIdea } from '@/types/database'

interface CategoryStat {
  category: string
  count: number
  totalVotes: number
}

export function StatsPage() {
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()
  const { bookmarkedIds } = useBookmarks()
  const [loading, setLoading] = useState(true)
  const [ideas, setIdeas] = useState<SaasIdea[]>([])
  const [voteStats, setVoteStats] = useState({ up: 0, down: 0 })
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([])
  const [streakDays, setStreakDays] = useState(0)

  const fetchStats = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const [ideasRes, votesRes] = await Promise.all([
      supabase
        .from('saas_ideas')
        .select('*')
        .eq('generated_for', user.id)
        .order('created_at', { ascending: false })
        .limit(200),
      (supabase.from('votes') as any)
        .select('vote_type')
        .eq('user_id', user.id),
    ])

    const allIdeas = (ideasRes.data as SaasIdea[]) || []
    setIdeas(allIdeas)

    const votes = votesRes.data || []
    setVoteStats({
      up: votes.filter((v: any) => v.vote_type === 'up').length,
      down: votes.filter((v: any) => v.vote_type === 'down').length,
    })

    // Category breakdown
    const catMap: Record<string, { count: number; totalVotes: number }> = {}
    for (const idea of allIdeas) {
      const cat = idea.category || 'Uncategorized'
      if (!catMap[cat]) catMap[cat] = { count: 0, totalVotes: 0 }
      catMap[cat].count++
      catMap[cat].totalVotes += (idea.upvotes || 0) - (idea.downvotes || 0)
    }
    const cats = Object.entries(catMap)
      .map(([category, s]) => ({ category, ...s }))
      .sort((a, b) => b.count - a.count)
    setCategoryStats(cats)

    // Streak calculation
    const dates = new Set(allIdeas.map(i => i.created_at?.split('T')[0]).filter(Boolean))
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      if (dates.has(key)) streak++
      else break
    }
    setStreakDays(streak)

    setLoading(false)
  }, [user])

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
      return
    }
    if (user) fetchStats()
  }, [user, authLoading, navigate, fetchStats])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
  }

  const totalIdeas = ideas.length
  const publicIdeas = ideas.filter(i => i.is_public).length
  const privateIdeas = ideas.filter(i => !i.is_public).length
  const totalUpvotes = ideas.reduce((s, i) => s + (i.upvotes || 0), 0)
  const totalViews = ideas.reduce((s, i) => s + (i.views || 0), 0)
  const today = new Date().toISOString().split('T')[0]
  const todayCount = ideas.filter(i => i.created_at?.startsWith(today)).length
  const avgMRR = ideas.filter(i => i.estimated_mrr_high).length > 0
    ? Math.round(ideas.reduce((s, i) => s + ((i.estimated_mrr_low || 0) + (i.estimated_mrr_high || 0)) / 2, 0) / ideas.filter(i => i.estimated_mrr_high).length)
    : 0
  const topIdea = [...ideas].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))[0]

  return (
    <div className="max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-brand" />
            Your Stats
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Overview of your SaaS idea activity
          </p>
        </div>

        {/* Hero stats row — large highlight cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <Card className="border-brand/20 bg-gradient-to-br from-brand/5 to-transparent">
              <CardContent className="p-5 text-center">
                <Lightbulb className="h-6 w-6 text-brand mx-auto mb-2" />
                <p className="text-3xl font-extrabold text-brand">{totalIdeas}</p>
                <p className="text-xs text-text-muted mt-1">Total Ideas</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="border-emerald/20 bg-gradient-to-br from-emerald/5 to-transparent">
              <CardContent className="p-5 text-center">
                <TrendingUp className="h-6 w-6 text-emerald mx-auto mb-2" />
                <p className="text-3xl font-extrabold text-emerald">{totalUpvotes}</p>
                <p className="text-xs text-text-muted mt-1">Upvotes Received</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
              <CardContent className="p-5 text-center">
                <Eye className="h-6 w-6 text-accent mx-auto mb-2" />
                <p className="text-3xl font-extrabold text-accent">{totalViews}</p>
                <p className="text-xs text-text-muted mt-1">Total Views</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="border-amber/20 bg-gradient-to-br from-amber/5 to-transparent">
              <CardContent className="p-5 text-center">
                <Zap className="h-6 w-6 text-amber mx-auto mb-2" />
                <p className="text-3xl font-extrabold text-amber">{streakDays}d</p>
                <p className="text-xs text-text-muted mt-1">Streak</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Ideas breakdown + Engagement — side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
          {/* Ideas Breakdown */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-brand" />
                  Ideas Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="flex items-center gap-2 text-sm"><Globe className="h-4 w-4 text-emerald" /> Public</span>
                  <span className="text-lg font-bold">{publicIdeas}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="flex items-center gap-2 text-sm"><Lock className="h-4 w-4 text-accent" /> Private</span>
                  <span className="text-lg font-bold">{privateIdeas}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="flex items-center gap-2 text-sm"><Bookmark className="h-4 w-4 text-amber" /> Saved</span>
                  <span className="text-lg font-bold">{bookmarkedIds.size}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4 text-brand" /> Today</span>
                  <span className="text-lg font-bold">{todayCount}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="flex items-center gap-2 text-sm"><BarChart3 className="h-4 w-4 text-accent" /> Categories</span>
                  <span className="text-lg font-bold">{categoryStats.length}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Engagement */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-emerald" />
                  Engagement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="flex items-center gap-2 text-sm"><ThumbsUp className="h-4 w-4 text-emerald" /> Your Likes</span>
                  <span className="text-lg font-bold text-emerald">{voteStats.up}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="flex items-center gap-2 text-sm"><ThumbsDown className="h-4 w-4 text-rose" /> Your Dislikes</span>
                  <span className="text-lg font-bold text-rose">{voteStats.down}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="flex items-center gap-2 text-sm"><TrendingUp className="h-4 w-4 text-emerald" /> Avg Est. MRR</span>
                  <span className="text-lg font-bold">{avgMRR > 0 ? `$${avgMRR.toLocaleString()}` : '—'}</span>
                </div>
                {/* Like/Dislike ratio bar */}
                <div className="pt-2">
                  <p className="text-[11px] text-text-muted mb-2">Like / Dislike Ratio</p>
                  <div className="h-3 rounded-full bg-surface-2 overflow-hidden flex">
                    {(voteStats.up + voteStats.down) > 0 ? (
                      <>
                        <div
                          className="h-full bg-emerald rounded-l-full transition-all duration-500"
                          style={{ width: `${(voteStats.up / (voteStats.up + voteStats.down)) * 100}%` }}
                        />
                        <div
                          className="h-full bg-rose rounded-r-full transition-all duration-500"
                          style={{ width: `${(voteStats.down / (voteStats.up + voteStats.down)) * 100}%` }}
                        />
                      </>
                    ) : (
                      <div className="h-full w-full bg-surface-3 rounded-full" />
                    )}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-emerald">{voteStats.up} likes</span>
                    <span className="text-[10px] text-rose">{voteStats.down} dislikes</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Top Idea */}
        {topIdea && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber" />
                  Top Performing Idea
                </CardTitle>
              </CardHeader>
              <CardContent>
                <a href={`/idea/${topIdea.id}`} className="group">
                  <h3 className="font-semibold group-hover:text-brand transition-colors">{topIdea.title}</h3>
                  <p className="text-xs text-text-muted mt-1 line-clamp-2">{topIdea.tagline}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="default">{topIdea.category}</Badge>
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3 text-emerald" /> {topIdea.upvotes}
                    </span>
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {topIdea.views} views
                    </span>
                  </div>
                </a>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Category breakdown */}
        {categoryStats.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-accent" />
                  Category Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categoryStats.slice(0, 15).map((cat, i) => {
                    const pct = totalIdeas > 0 ? (cat.count / totalIdeas) * 100 : 0
                    return (
                      <motion.div
                        key={cat.category}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.04 }}
                        className="flex items-center gap-3"
                      >
                        <span className="text-xs font-medium text-text-secondary w-32 truncate shrink-0">{cat.category}</span>
                        <div className="flex-1 h-6 bg-surface-2 rounded-lg overflow-hidden relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(pct, 3)}%` }}
                            transition={{ delay: 0.4 + i * 0.05, duration: 0.5 }}
                            className="h-full bg-brand/20 rounded-lg"
                          />
                          <span className="absolute inset-0 flex items-center px-2 text-[11px] font-medium">
                            {cat.count} ideas
                          </span>
                        </div>
                        <span className={`text-xs font-medium w-12 text-right ${cat.totalVotes >= 0 ? 'text-emerald' : 'text-rose'}`}>
                          {cat.totalVotes > 0 ? '+' : ''}{cat.totalVotes}
                        </span>
                      </motion.div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
