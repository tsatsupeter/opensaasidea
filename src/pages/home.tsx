import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { Loader2, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { IdeaCard } from '@/components/ideas/idea-card'
import { Logo } from '@/components/ui/logo'
import { SortDropdown, type SortBy } from '@/components/ui/sort-dropdown'
import type { SaasIdea } from '@/types/database'

function getDefaultSort(path: string): SortBy {
  if (path === '/popular') return 'top'
  if (path === '/trending') return 'hot'
  return 'best'
}

export function HomePage() {
  const { user } = useAuth()
  const location = useLocation()
  const [ideas, setIdeas] = useState<SaasIdea[]>([])
  const [userVotes, setUserVotes] = useState<Record<string, 'up' | 'down'>>({})
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortBy>(getDefaultSort(location.pathname))

  const fetchIdeas = useCallback(async () => {
    setLoading(true)

    let orderCol = 'vote_score'
    let ascending = false
    if (sortBy === 'newest') orderCol = 'created_at'
    else if (sortBy === 'top') orderCol = 'upvotes'
    else if (sortBy === 'hot' || sortBy === 'rising') orderCol = 'views'
    else if (sortBy === 'mrr_high') orderCol = 'estimated_mrr_high'
    else if (sortBy === 'mrr_low') { orderCol = 'estimated_mrr_low'; ascending = true }

    const { data } = await supabase
      .from('saas_ideas')
      .select('*')
      .eq('is_public', true)
      .order(orderCol, { ascending })
      .limit(100)

    let results = (data as SaasIdea[]) || []

    // Client-side sort refinements
    if (sortBy === 'hot') {
      results.sort((a, b) => {
        const aAge = (Date.now() - new Date(a.created_at).getTime()) / 3600000
        const bAge = (Date.now() - new Date(b.created_at).getTime()) / 3600000
        return (b.vote_score || 0) / Math.pow(bAge + 2, 1.5) - (a.vote_score || 0) / Math.pow(aAge + 2, 1.5)
      })
    } else if (sortBy === 'rising') {
      results.sort((a, b) => {
        const aAge = (Date.now() - new Date(a.created_at).getTime()) / 3600000
        const bAge = (Date.now() - new Date(b.created_at).getTime()) / 3600000
        return ((b.upvotes || 0) + (b.views || 0)) / (bAge + 1) - ((a.upvotes || 0) + (a.views || 0)) / (aAge + 1)
      })
    } else if (sortBy === 'mrr_low') {
      results = results.filter(i => i.estimated_mrr_low != null)
      results.sort((a, b) => (a.estimated_mrr_low || 0) - (b.estimated_mrr_low || 0))
    } else if (sortBy === 'mrr_high') {
      results.sort((a, b) => (b.estimated_mrr_high || 0) - (a.estimated_mrr_high || 0))
    }

    setIdeas(results)
    setLoading(false)
  }, [sortBy])

  const fetchUserVotes = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('votes')
      .select('idea_id, vote_type')
      .eq('user_id', user.id)
    if (data) {
      const voteMap: Record<string, 'up' | 'down'> = {}
      data.forEach((v: any) => { voteMap[v.idea_id] = v.vote_type })
      setUserVotes(voteMap)
    }
  }, [user])

  useEffect(() => { fetchIdeas() }, [fetchIdeas])
  useEffect(() => { fetchUserVotes() }, [fetchUserVotes])

  return (
    <div className="w-full">
      {/* Next generation countdown */}
      <NextGenCountdown />

      {/* Sort dropdown */}
      <div className="flex items-center gap-2 px-2 py-2 border-b border-border mb-0">
        <SortDropdown value={sortBy} onChange={setSortBy} />
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      ) : ideas.length === 0 ? (
        <div className="text-center py-20">
          <div className="h-14 w-14 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
            <Logo className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No ideas yet</h3>
          <p className="text-sm text-text-secondary max-w-sm mx-auto">
            New SaaS ideas are auto-generated daily. Check back soon!
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border bg-surface-0 overflow-hidden">
          {ideas.map((idea, i) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              index={i}
              currentVote={userVotes[idea.id] || null}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function NextGenCountdown() {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 })

  useEffect(() => {
    const calc = () => {
      const now = new Date()
      const nextMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0))
      const diff = nextMidnight.getTime() - now.getTime()
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [])

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-surface-1/50">
      <div className="flex items-center gap-1.5">
        <Zap className="h-3.5 w-3.5 text-brand" />
        <span className="text-[12px] font-medium text-text-secondary">Next AI Generation</span>
      </div>
      <div className="flex items-center gap-1 ml-auto">
        <span className="text-[13px] font-mono font-bold text-brand tabular-nums">
          {pad(timeLeft.h)}:{pad(timeLeft.m)}:{pad(timeLeft.s)}
        </span>
      </div>
    </div>
  )
}
