import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { FeedSkeleton, Skeleton } from '@/components/ui/skeleton'
import { supabase, SAFE_IDEA_COLUMNS } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { IdeaCard } from '@/components/ideas/idea-card'
import { Logo } from '@/components/ui/logo'
import { SortDropdown, type SortBy } from '@/components/ui/sort-dropdown'
import { SEO } from '@/components/seo'
import type { SaasIdea } from '@/types/database'
import { siteConfig } from '@/lib/site-config'
import { useCategories, categoryColor, toSlug, type DynamicCategory } from '@/lib/categories'

export function ExplorePage() {
  const { category } = useParams<{ category?: string }>()

  if (category) {
    return <CategoryFeedPage categorySlug={category} />
  }

  return <CommunitiesGrid />
}

function CommunitiesGrid() {
  const { categories, loading } = useCategories()
  const [activeTab, setActiveTab] = useState('all')
  const [showAllPopular, setShowAllPopular] = useState(false)
  const [showAllMore, setShowAllMore] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollTabs = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' })
    }
  }

  const popular = categories.slice(0, showAllPopular ? 12 : 6)
  const more = categories.slice(6, showAllMore ? categories.length : 12)

  if (loading) {
    return (
      <div className="w-full space-y-4">
        <Skeleton className="h-7 w-48" />
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <SEO
        title="Explore SaaS Ideas by Category"
        description="Browse AI-generated SaaS and startup ideas organized by category. Find business ideas in AI, DevTools, FinTech, HealthTech, EdTech, and more."
        url="/explore"
        keywords="SaaS categories, startup ideas by category, AI business ideas, DevTools ideas, FinTech ideas, HealthTech ideas, EdTech ideas"
      />
      {/* Header */}
      <h1 className="text-[22px] font-bold mb-4">Explore Categories</h1>

      {/* Horizontal scrollable tabs */}
      <div className="relative mb-6">
        <button
          onClick={() => scrollTabs('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full bg-surface-2 border border-border flex items-center justify-center text-text-muted hover:text-text-primary transition-colors cursor-pointer shadow-sm"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div
          ref={scrollRef}
          className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-8"
          style={{ scrollbarWidth: 'none' }}
        >
          <button
            onClick={() => setActiveTab('all')}
            className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium border transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-text-primary text-surface-0 border-text-primary'
                : 'bg-surface-1 text-text-secondary border-border hover:bg-surface-2'
            }`}
          >
            All
          </button>
          {categories.slice(0, 15).map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setActiveTab(cat.slug)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium border transition-all cursor-pointer ${
                activeTab === cat.slug
                  ? 'bg-text-primary text-surface-0 border-text-primary'
                  : 'bg-surface-1 text-text-secondary border-border hover:bg-surface-2'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => scrollTabs('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full bg-surface-2 border border-border flex items-center justify-center text-text-muted hover:text-text-primary transition-colors cursor-pointer shadow-sm"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Filtered view if a tab is selected */}
      {activeTab !== 'all' ? (
        <CategorySection
          title={categories.find(c => c.slug === activeTab)?.label || activeTab}
          categories={categories.filter(c => c.slug === activeTab)}
          showAll={true}
        />
      ) : (
        <>
          {/* Popular Categories */}
          {popular.length > 0 && (
            <>
              <CategorySection title="Popular Categories" categories={popular} />
              {!showAllPopular && categories.length > 6 && (
                <div className="flex justify-center mt-3 mb-8">
                  <button
                    onClick={() => setShowAllPopular(true)}
                    className="text-[13px] font-medium text-accent hover:text-accent/80 border border-border rounded-full px-5 py-1.5 hover:bg-surface-2 transition-all cursor-pointer"
                  >
                    Show more
                  </button>
                </div>
              )}
            </>
          )}

          {/* More Categories */}
          {more.length > 0 && (
            <>
              <CategorySection title="More Categories" categories={more} />
              {!showAllMore && categories.length > 12 && (
                <div className="flex justify-center mt-3 mb-8">
                  <button
                    onClick={() => setShowAllMore(true)}
                    className="text-[13px] font-medium text-accent hover:text-accent/80 border border-border rounded-full px-5 py-1.5 hover:bg-surface-2 transition-all cursor-pointer"
                  >
                    Show more
                  </button>
                </div>
              )}
            </>
          )}

          {categories.length === 0 && (
            <div className="text-center py-20">
              <div className="h-14 w-14 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
                <Logo className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
              <p className="text-sm text-text-secondary max-w-sm mx-auto">
                Categories appear automatically as ideas are generated. Check back soon!
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function CategorySection({ title, categories, showAll }: { title: string; categories: DynamicCategory[]; showAll?: boolean }) {
  return (
    <div className="mb-6">
      <h2 className="text-[15px] font-semibold mb-3">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.slug}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Link to={`/explore/${cat.slug}`}>
              <div className="group flex items-start gap-3 rounded-xl border border-border bg-surface-1 p-4 hover:border-brand/30 hover:bg-surface-2 transition-all duration-200">
                {/* Category icon circle */}
                <div className={`h-9 w-9 shrink-0 rounded-full ${cat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <span className={`text-sm font-bold ${cat.color}`}>{cat.label[0]}</span>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-text-primary truncate">{cat.label}</p>
                      <p className="text-[11px] text-text-muted">{cat.count} {cat.count === 1 ? 'idea' : 'ideas'}</p>
                    </div>
                    <span className="shrink-0 text-[12px] font-medium text-accent border border-accent/30 rounded-full px-3 py-0.5 hover:bg-accent/10 transition-colors">
                      Browse
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function CategoryFeedPage({ categorySlug }: { categorySlug: string }) {
  const { user } = useAuth()
  const { categories } = useCategories()
  const cat = categories.find(c => c.slug === categorySlug)
  const catLabel = cat?.label || categorySlug
  const colors = cat ? { color: cat.color, bgColor: cat.bgColor } : categoryColor(categorySlug)

  const [ideas, setIdeas] = useState<SaasIdea[]>([])
  const [userVotes, setUserVotes] = useState<Record<string, 'up' | 'down'>>({})
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortBy>('best')

  const fetchIdeas = useCallback(async () => {
    setLoading(true)
    try {
      // Determine DB sort column
      let orderCol = 'vote_score'
      let ascending = false
      if (sortBy === 'newest') orderCol = 'created_at'
      else if (sortBy === 'top') orderCol = 'upvotes'
      else if (sortBy === 'hot' || sortBy === 'rising') orderCol = 'views'
      else if (sortBy === 'mrr_high') orderCol = 'estimated_mrr_high'
      else if (sortBy === 'mrr_low') { orderCol = 'estimated_mrr_low'; ascending = true }

      let query = supabase
        .from('saas_ideas')
        .select(SAFE_IDEA_COLUMNS)
        .eq('is_public', true)
      if (siteConfig.mode === 'saas') query = query.eq('idea_type', 'saas')
      const { data: allData, error } = await query
        .order(orderCol, { ascending })
        .limit(200)

      if (error) console.error('Explore query error:', error)

      let filtered = ((allData as SaasIdea[]) || []).filter(idea => {
        return toSlug(idea.category || '') === categorySlug
      })

      // Client-side sort refinements
      if (sortBy === 'hot') {
        filtered.sort((a, b) => {
          const aAge = (Date.now() - new Date(a.created_at).getTime()) / 3600000
          const bAge = (Date.now() - new Date(b.created_at).getTime()) / 3600000
          const aScore = (a.vote_score || 0) / Math.pow(aAge + 2, 1.5)
          const bScore = (b.vote_score || 0) / Math.pow(bAge + 2, 1.5)
          return bScore - aScore
        })
      } else if (sortBy === 'rising') {
        filtered.sort((a, b) => {
          const aAge = (Date.now() - new Date(a.created_at).getTime()) / 3600000
          const bAge = (Date.now() - new Date(b.created_at).getTime()) / 3600000
          const aScore = ((a.upvotes || 0) + (a.views || 0)) / (aAge + 1)
          const bScore = ((b.upvotes || 0) + (b.views || 0)) / (bAge + 1)
          return bScore - aScore
        })
      } else if (sortBy === 'mrr_low') {
        filtered = filtered.filter(i => i.estimated_mrr_low != null)
        filtered.sort((a, b) => (a.estimated_mrr_low || 0) - (b.estimated_mrr_low || 0))
      } else if (sortBy === 'mrr_high') {
        filtered.sort((a, b) => (b.estimated_mrr_high || 0) - (a.estimated_mrr_high || 0))
      }

      setIdeas(filtered)
    } catch (err) {
      console.error('Explore fetch failed:', err)
    } finally {
      setLoading(false)
    }
  }, [sortBy, categorySlug])

  const fetchUserVotes = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await supabase.from('votes').select('idea_id, vote_type').eq('user_id', user.id)
      if (data) {
        const voteMap: Record<string, 'up' | 'down'> = {}
        data.forEach((v: any) => { voteMap[v.idea_id] = v.vote_type })
        setUserVotes(voteMap)
      }
    } catch (err) {
      console.error('Explore votes fetch failed:', err)
    }
  }, [user])

  useEffect(() => { fetchIdeas() }, [fetchIdeas])
  useEffect(() => { fetchUserVotes() }, [fetchUserVotes])

  return (
    <div className="w-full">
      <SEO
        title={`${catLabel} SaaS Ideas`}
        description={`Explore AI-generated ${catLabel} SaaS and startup ideas with revenue projections, market analysis, and execution plans. Find your next ${catLabel.toLowerCase()} business idea.`}
        url={`/explore/${categorySlug}`}
        keywords={`${catLabel} SaaS ideas, ${catLabel} startup ideas, ${catLabel.toLowerCase()} business ideas, ${catLabel.toLowerCase()} software`}
      />
      {/* Category header */}
      <div className="flex items-center gap-3 mb-4">
        <Link to="/explore" className="text-text-muted hover:text-text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className={`h-8 w-8 rounded-full ${colors.bgColor} flex items-center justify-center`}>
          <span className={`text-sm font-bold ${colors.color}`}>{catLabel[0]}</span>
        </div>
        <div>
          <h1 className="text-lg font-bold">{catLabel}</h1>
          <p className="text-[12px] text-text-muted">{ideas.length} ideas in this category</p>
        </div>
      </div>

      {/* Sort dropdown */}
      <div className="flex items-center gap-2 px-2 py-2 border-b border-border mb-0">
        <SortDropdown value={sortBy} onChange={setSortBy} />
      </div>

      {/* Feed */}
      {loading ? (
        <FeedSkeleton count={6} />
      ) : ideas.length === 0 ? (
        <div className="text-center py-20">
          <div className={`h-14 w-14 rounded-2xl ${colors.bgColor} flex items-center justify-center mx-auto mb-4`}>
            <Logo className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No ideas in {catLabel} yet</h3>
          <p className="text-sm text-text-secondary max-w-sm mx-auto">
            New ideas are generated daily. This category will fill up soon!
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
