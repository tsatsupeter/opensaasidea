import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { Flame, Clock, TrendingUp, Loader2, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { IdeaCard } from '@/components/ideas/idea-card'
import type { SaasIdea } from '@/types/database'

type SortBy = 'best' | 'newest' | 'top'

function getDefaultSort(path: string): SortBy {
  if (path === '/popular') return 'top'
  if (path === '/trending') return 'best'
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
    let query = supabase
      .from('saas_ideas')
      .select('*')
      .eq('is_public', true)

    if (sortBy === 'best') {
      query = query.order('vote_score', { ascending: false }).order('created_at', { ascending: false })
    } else if (sortBy === 'newest') {
      query = query.order('created_at', { ascending: false })
    } else {
      query = query.order('upvotes', { ascending: false })
    }

    query = query.limit(50)
    const { data } = await query
    setIdeas((data as SaasIdea[]) || [])
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

  const sortOptions: { value: SortBy; label: string; icon: typeof Flame }[] = [
    { value: 'best', label: 'Best', icon: Flame },
    { value: 'newest', label: 'New', icon: Clock },
    { value: 'top', label: 'Top', icon: TrendingUp },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      {/* Sort tabs - Reddit style */}
      <div className="flex items-center gap-1 px-2 py-2 border-b border-border mb-0">
        {sortOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSortBy(opt.value)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-150 cursor-pointer ${
              sortBy === opt.value
                ? 'bg-surface-2 text-text-primary'
                : 'text-text-muted hover:bg-surface-2 hover:text-text-secondary'
            }`}
          >
            <opt.icon className="h-4 w-4" />
            {opt.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      ) : ideas.length === 0 ? (
        <div className="text-center py-20">
          <div className="h-14 w-14 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-7 w-7 text-brand" />
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
              onVoteChange={() => { fetchIdeas(); fetchUserVotes() }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
