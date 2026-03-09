import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Loader2, Zap, BarChart3, Clock, Users, MessageSquare,
  CreditCard, Cpu, Trash2, Eye, EyeOff,
  RefreshCw, Globe, Lock, Crown, CheckCircle2,
  ArrowUpRight, Search, ExternalLink, TrendingUp, DollarSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GenerationAnimation } from '@/components/ideas/generation-animation'
import { Logo } from '@/components/ui/logo'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase'
import { generateSaasIdea, saveIdeaToSupabase } from '@/lib/ai'
import { siteConfig } from '@/lib/site-config'
import { cn } from '@/lib/utils'

type Tab = 'overview' | 'users' | 'ideas' | 'comments' | 'revenue' | 'generation'

const TABS: { id: Tab; label: string; icon: typeof Shield }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'ideas', label: 'Ideas', icon: Zap },
  { id: 'comments', label: 'Comments', icon: MessageSquare },
  { id: 'revenue', label: 'Revenue', icon: CreditCard },
  { id: 'generation', label: 'Generation', icon: Cpu },
]

interface UserRow {
  id: string
  email: string | null
  full_name: string | null
  subscription_tier: string
  role: 'user' | 'admin'
  daily_ideas_generated: number
  last_generation_date: string | null
  created_at: string
}

interface IdeaRow {
  id: string
  title: string
  slug: string | null
  category: string | null
  idea_type: string
  is_public: boolean
  vote_score: number
  views: number
  comment_count: number
  created_at: string
  generated_for: string | null
}

interface CommentRow {
  id: string
  content: string
  created_at: string
  user_id: string
  idea_id: string
  profiles: { full_name: string | null; email: string | null } | null
  saas_ideas: { title: string; slug: string | null } | null
}

interface SubRow {
  id: string
  user_id: string
  tier: string
  status: string
  billing_period: string | null
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
  profiles: { full_name: string | null; email: string | null } | null
}

export function AdminPage() {
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)

  // Overview state
  const [stats, setStats] = useState({
    totalUsers: 0, totalIdeas: 0, publicIdeas: 0, privateIdeas: 0,
    todayIdeas: 0, totalVotes: 0, totalComments: 0, totalBookmarks: 0,
    freeUsers: 0, proUsers: 0, teamUsers: 0,
  })

  // Users state
  const [users, setUsers] = useState<UserRow[]>([])
  const [userSearch, setUserSearch] = useState('')

  // Ideas state
  const [ideas, setIdeas] = useState<IdeaRow[]>([])
  const [ideaSearch, setIdeaSearch] = useState('')
  const [ideaSort, setIdeaSort] = useState<'newest' | 'views' | 'votes'>('newest')

  // Comments state
  const [comments, setComments] = useState<CommentRow[]>([])

  // Revenue state
  const [subs, setSubs] = useState<SubRow[]>([])

  // Generation state
  const [generating, setGenerating] = useState(false)
  const [lastGenerated, setLastGenerated] = useState<string | null>(null)
  const [triggeringCron, setTriggeringCron] = useState(false)
  const [cronResult, setCronResult] = useState<string | null>(null)

  const isAdmin = profile?.role === 'admin'

  // Only redirect when we're sure: auth is done AND profile is loaded (or user is null)
  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/'); return }
    // User exists but profile not loaded yet — wait
    if (!profile) return
    // Profile loaded but not admin — redirect
    if (!isAdmin) navigate('/')
  }, [user, profile, authLoading, navigate, isAdmin])

  const fetchOverview = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0]
    const [usersRes, ideasRes, publicRes, privateRes, todayRes, votesRes, commentsRes, bookmarksRes, freeRes, proRes, teamRes] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('saas_ideas').select('*', { count: 'exact', head: true }),
      supabase.from('saas_ideas').select('*', { count: 'exact', head: true }).eq('is_public', true),
      supabase.from('saas_ideas').select('*', { count: 'exact', head: true }).eq('is_public', false),
      supabase.from('saas_ideas').select('*', { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('votes').select('*', { count: 'exact', head: true }),
      supabase.from('comments').select('*', { count: 'exact', head: true }),
      supabase.from('bookmarks').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'free'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'pro'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'team'),
    ])
    setStats({
      totalUsers: usersRes.count || 0, totalIdeas: ideasRes.count || 0,
      publicIdeas: publicRes.count || 0, privateIdeas: privateRes.count || 0,
      todayIdeas: todayRes.count || 0, totalVotes: votesRes.count || 0,
      totalComments: commentsRes.count || 0, totalBookmarks: bookmarksRes.count || 0,
      freeUsers: freeRes.count || 0, proUsers: proRes.count || 0, teamUsers: teamRes.count || 0,
    })
  }, [])

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, email, full_name, subscription_tier, role, daily_ideas_generated, last_generation_date, created_at')
      .order('created_at', { ascending: false })
      .limit(100)
    setUsers((data || []) as UserRow[])
  }, [])

  const fetchIdeas = useCallback(async () => {
    const order = ideaSort === 'views' ? 'views' : ideaSort === 'votes' ? 'vote_score' : 'created_at'
    const { data } = await supabase
      .from('saas_ideas')
      .select('id, title, slug, category, idea_type, is_public, vote_score, views, comment_count, created_at, generated_for')
      .order(order, { ascending: false })
      .limit(100)
    setIdeas((data || []) as IdeaRow[])
  }, [ideaSort])

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from('comments')
      .select('id, content, created_at, user_id, idea_id, profiles(full_name, email), saas_ideas(title, slug)')
      .order('created_at', { ascending: false })
      .limit(50)
    setComments((data || []) as unknown as CommentRow[])
  }, [])

  const fetchRevenue = useCallback(async () => {
    const { data } = await supabase
      .from('subscriptions')
      .select('id, user_id, tier, status, billing_period, current_period_start, current_period_end, created_at, profiles(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(50)
    setSubs((data || []) as unknown as SubRow[])
  }, [])

  // Load data per tab
  useEffect(() => {
    if (!isAdmin) return
    setLoading(true)
    const load = async () => {
      switch (tab) {
        case 'overview': await fetchOverview(); break
        case 'users': await fetchUsers(); break
        case 'ideas': await fetchIdeas(); break
        case 'comments': await fetchComments(); break
        case 'revenue': await fetchRevenue(); break
      }
      setLoading(false)
    }
    load()
  }, [tab, isAdmin, fetchOverview, fetchUsers, fetchIdeas, fetchComments, fetchRevenue])

  // Re-fetch ideas when sort changes
  useEffect(() => { if (tab === 'ideas') fetchIdeas() }, [ideaSort, fetchIdeas, tab])

  // --- Actions ---
  const toggleIdeaPublic = async (id: string, current: boolean) => {
    await (supabase.from('saas_ideas') as any).update({ is_public: !current }).eq('id', id)
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, is_public: !current } : i))
    toast(`Idea ${!current ? 'made public' : 'set to private'}`)
  }

  const deleteIdea = async (id: string) => {
    if (!confirm('Delete this idea permanently?')) return
    await supabase.from('saas_ideas').delete().eq('id', id)
    setIdeas(prev => prev.filter(i => i.id !== id))
    toast('Idea deleted')
  }

  const deleteComment = async (id: string) => {
    if (!confirm('Delete this comment?')) return
    await supabase.from('comments').delete().eq('id', id)
    setComments(prev => prev.filter(c => c.id !== id))
    toast('Comment deleted')
  }

  const toggleAdmin = async (userId: string, current: boolean) => {  
    if (userId === user?.id) { toast('Cannot modify your own admin status'); return }
    const newRole = current ? 'user' : 'admin'
    await (supabase.from('profiles') as any).update({ role: newRole }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as 'user' | 'admin' } : u))
    toast(`Role changed to ${newRole}`)
  }

  const changeTier = async (userId: string, newTier: string) => {
    await (supabase.from('profiles') as any).update({ subscription_tier: newTier }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, subscription_tier: newTier } : u))
    toast(`Tier changed to ${newTier}`)
  }

  const handleForceGenerate = async () => {
    if (!user) return
    setGenerating(true)
    setLastGenerated(null)
    try {
      const idea = await generateSaasIdea()
      if (idea) {
        await saveIdeaToSupabase(idea, true, user.id)
        setLastGenerated(idea.title as string)
      }
    } finally {
      setGenerating(false)
    }
  }

  const handleTriggerCron = async () => {
    setTriggeringCron(true)
    setCronResult(null)
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-daily`, { method: 'POST' })
      const data = await res.json()
      setCronResult(JSON.stringify(data, null, 2))
    } catch (err) {
      setCronResult(`Error: ${err}`)
    } finally {
      setTriggeringCron(false)
    }
  }

  // --- Helpers ---
  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const tierBadge = (t: string) => {
    if (t === 'pro') return <Badge variant="default">Pro</Badge>
    if (t === 'team') return <Badge variant="accent">Team</Badge>
    return <Badge variant="secondary">Free</Badge>
  }

  if (authLoading || (user && !profile)) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-brand" /></div>
  }

  if (!isAdmin) return null

  // Filter helpers
  const filteredUsers = users.filter(u =>
    !userSearch || (u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase()))
  )
  const filteredIdeas = ideas.filter(i =>
    !ideaSearch || i.title.toLowerCase().includes(ideaSearch.toLowerCase()) || i.category?.toLowerCase().includes(ideaSearch.toLowerCase())
  )

  return (
    <div className="w-full max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Shield className="h-6 w-6 text-brand" />
            Admin Panel
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Manage {siteConfig.name} — users, ideas, comments, revenue, and generation.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1 border-b border-border">
          {TABS.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap cursor-pointer',
                  tab === t.id
                    ? 'text-brand border-b-2 border-brand bg-brand/5'
                    : 'text-text-muted hover:text-text-primary hover:bg-surface-2'
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        )}

        {/* Tab Content */}
        {!loading && (
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {/* ========== OVERVIEW ========== */}
              {tab === 'overview' && (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-brand' },
                      { label: 'Total Ideas', value: stats.totalIdeas, icon: Zap, color: 'text-accent' },
                      { label: 'Public Ideas', value: stats.publicIdeas, icon: Globe, color: 'text-emerald' },
                      { label: 'Today Generated', value: stats.todayIdeas, icon: Clock, color: 'text-amber' },
                      { label: 'Total Votes', value: stats.totalVotes, icon: TrendingUp, color: 'text-brand' },
                      { label: 'Comments', value: stats.totalComments, icon: MessageSquare, color: 'text-accent' },
                      { label: 'Bookmarks', value: stats.totalBookmarks, icon: CheckCircle2, color: 'text-emerald' },
                      { label: 'Private Ideas', value: stats.privateIdeas, icon: Lock, color: 'text-text-muted' },
                    ].map(s => (
                      <Card key={s.label}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <s.icon className={cn('h-4 w-4', s.color)} />
                            <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">{s.label}</span>
                          </div>
                          <p className="text-2xl font-bold">{s.value.toLocaleString()}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* User Distribution */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2"><Crown className="h-4 w-4 text-brand" /> Subscription Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 rounded-lg bg-surface-2">
                          <p className="text-2xl font-bold">{stats.freeUsers}</p>
                          <p className="text-xs text-text-muted mt-1">Free</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-brand/5 border border-brand/20">
                          <p className="text-2xl font-bold text-brand">{stats.proUsers}</p>
                          <p className="text-xs text-brand mt-1">Pro</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-accent/5 border border-accent/20">
                          <p className="text-2xl font-bold text-accent">{stats.teamUsers}</p>
                          <p className="text-xs text-accent mt-1">Team</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => setTab('generation')}><Cpu className="h-3.5 w-3.5" /> Generate Idea</Button>
                        <Button size="sm" variant="secondary" onClick={() => setTab('users')}><Users className="h-3.5 w-3.5" /> Manage Users</Button>
                        <Button size="sm" variant="secondary" onClick={() => setTab('comments')}><MessageSquare className="h-3.5 w-3.5" /> Moderate Comments</Button>
                        <Button size="sm" variant="secondary" onClick={() => setTab('ideas')}><Zap className="h-3.5 w-3.5" /> Manage Ideas</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ========== USERS ========== */}
              {tab === 'users' && (
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-border bg-surface-0 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30"
                    />
                  </div>

                  <Card>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left">
                            <th className="px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">User</th>
                            <th className="px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Tier</th>
                            <th className="px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Admin</th>
                            <th className="px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Generated</th>
                            <th className="px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Joined</th>
                            <th className="px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map(u => (
                            <tr key={u.id} className="border-b border-border/50 hover:bg-surface-2/50 transition-colors">
                              <td className="px-4 py-3">
                                <p className="font-medium text-text-primary">{u.full_name || 'No name'}</p>
                                <p className="text-xs text-text-muted">{u.email || '—'}</p>
                              </td>
                              <td className="px-4 py-3">{tierBadge(u.subscription_tier)}</td>
                              <td className="px-4 py-3">
                                {u.role === 'admin' ? (
                                  <Badge variant="warning">Admin</Badge>
                                ) : (
                                  <Badge variant="secondary">User</Badge>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-text-secondary">{u.daily_ideas_generated || 0}</span>
                                <span className="text-text-muted text-xs ml-1">today</span>
                              </td>
                              <td className="px-4 py-3 text-text-muted text-xs">{timeAgo(u.created_at)}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <select
                                    value={u.subscription_tier}
                                    onChange={e => changeTier(u.id, e.target.value)}
                                    className="text-xs px-2 py-1 rounded border border-border bg-surface-0 text-text-primary cursor-pointer"
                                  >
                                    <option value="free">Free</option>
                                    <option value="pro">Pro</option>
                                    <option value="team">Team</option>
                                  </select>
                                  <Button
                                    size="sm"
                                    variant={u.role === 'admin' ? 'destructive' : 'ghost'}
                                    className="h-7 px-2 text-xs"
                                    onClick={() => toggleAdmin(u.id, u.role === 'admin')}
                                  >
                                    <Shield className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredUsers.length === 0 && (
                            <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">No users found</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              )}

              {/* ========== IDEAS ========== */}
              {tab === 'ideas' && (
                <div className="space-y-4">
                  {/* Controls */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                      <input
                        type="text"
                        placeholder="Search ideas..."
                        value={ideaSearch}
                        onChange={e => setIdeaSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-border bg-surface-0 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30"
                      />
                    </div>
                    <div className="flex gap-1">
                      {(['newest', 'views', 'votes'] as const).map(s => (
                        <Button
                          key={s}
                          size="sm"
                          variant={ideaSort === s ? 'default' : 'ghost'}
                          onClick={() => setIdeaSort(s)}
                          className="capitalize"
                        >
                          {s}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Card>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left">
                            <th className="px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Idea</th>
                            <th className="px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Type</th>
                            <th className="px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider text-center">Votes</th>
                            <th className="px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider text-center">Views</th>
                            <th className="px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredIdeas.map(idea => (
                            <tr key={idea.id} className="border-b border-border/50 hover:bg-surface-2/50 transition-colors">
                              <td className="px-4 py-3 max-w-[250px]">
                                <Link
                                  to={`/idea/${idea.slug || idea.id}`}
                                  className="font-medium text-text-primary hover:text-brand transition-colors line-clamp-1"
                                >
                                  {idea.title}
                                </Link>
                                <p className="text-xs text-text-muted">{idea.category || 'Uncategorized'}</p>
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant={idea.idea_type === 'saas' ? 'default' : 'accent'}>
                                  {idea.idea_type}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                {idea.is_public ? (
                                  <Badge variant="success"><Globe className="h-3 w-3 mr-1" />Public</Badge>
                                ) : (
                                  <Badge variant="secondary"><Lock className="h-3 w-3 mr-1" />Private</Badge>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={cn('font-medium', idea.vote_score > 0 ? 'text-emerald' : idea.vote_score < 0 ? 'text-rose' : 'text-text-muted')}>
                                  {idea.vote_score > 0 ? '+' : ''}{idea.vote_score}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center text-text-secondary">{idea.views}</td>
                              <td className="px-4 py-3 text-text-muted text-xs">{timeAgo(idea.created_at)}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0"
                                    onClick={() => toggleIdeaPublic(idea.id, idea.is_public)}
                                    title={idea.is_public ? 'Make private' : 'Make public'}
                                  >
                                    {idea.is_public ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                  </Button>
                                  <Link to={`/idea/${idea.slug || idea.id}`}>
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="View">
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </Button>
                                  </Link>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-rose hover:text-rose"
                                    onClick={() => deleteIdea(idea.id)}
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredIdeas.length === 0 && (
                            <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted">No ideas found</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              )}

              {/* ========== COMMENTS ========== */}
              {tab === 'comments' && (
                <div className="space-y-3">
                  <p className="text-sm text-text-secondary mb-2">{comments.length} recent comments</p>
                  {comments.length === 0 && (
                    <Card><CardContent className="p-8 text-center text-text-muted">No comments yet</CardContent></Card>
                  )}
                  {comments.map(c => (
                    <Card key={c.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-text-primary">
                                {c.profiles?.full_name || c.profiles?.email || 'Unknown'}
                              </span>
                              <span className="text-xs text-text-muted">{timeAgo(c.created_at)}</span>
                            </div>
                            <p className="text-sm text-text-secondary mb-2">{c.content}</p>
                            {c.saas_ideas && (
                              <Link
                                to={`/idea/${c.saas_ideas.slug || c.idea_id}`}
                                className="text-xs text-brand hover:underline flex items-center gap-1"
                              >
                                <ArrowUpRight className="h-3 w-3" />
                                {c.saas_ideas.title}
                              </Link>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-rose hover:text-rose shrink-0"
                            onClick={() => deleteComment(c.id)}
                            title="Delete comment"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* ========== REVENUE ========== */}
              {tab === 'revenue' && (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <DollarSign className="h-4 w-4 text-emerald mx-auto mb-1" />
                        <p className="text-2xl font-bold">{subs.filter(s => s.status === 'active').length}</p>
                        <p className="text-xs text-text-muted">Active Subscriptions</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Crown className="h-4 w-4 text-brand mx-auto mb-1" />
                        <p className="text-2xl font-bold">{stats.proUsers}</p>
                        <p className="text-xs text-text-muted">Pro Users</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Users className="h-4 w-4 text-accent mx-auto mb-1" />
                        <p className="text-2xl font-bold">{stats.teamUsers}</p>
                        <p className="text-xs text-text-muted">Team Users</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <TrendingUp className="h-4 w-4 text-amber mx-auto mb-1" />
                        <p className="text-2xl font-bold">{subs.length}</p>
                        <p className="text-xs text-text-muted">Total Subscriptions</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Subscription Table */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Subscriptions</CardTitle>
                    </CardHeader>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left">
                            <th className="px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">User</th>
                            <th className="px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Tier</th>
                            <th className="px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Billing</th>
                            <th className="px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Period End</th>
                            <th className="px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subs.map(s => (
                            <tr key={s.id} className="border-b border-border/50 hover:bg-surface-2/50 transition-colors">
                              <td className="px-4 py-3">
                                <p className="font-medium">{s.profiles?.full_name || 'Unknown'}</p>
                                <p className="text-xs text-text-muted">{s.profiles?.email || '—'}</p>
                              </td>
                              <td className="px-4 py-3">{tierBadge(s.tier)}</td>
                              <td className="px-4 py-3">
                                <Badge variant={s.status === 'active' ? 'success' : s.status === 'canceled' ? 'error' : 'warning'}>
                                  {s.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-text-secondary capitalize">{s.billing_period || '—'}</td>
                              <td className="px-4 py-3 text-text-muted text-xs">
                                {s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : '—'}
                              </td>
                              <td className="px-4 py-3 text-text-muted text-xs">{timeAgo(s.created_at)}</td>
                            </tr>
                          ))}
                          {subs.length === 0 && (
                            <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">No subscriptions yet</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              )}

              {/* ========== GENERATION ========== */}
              {tab === 'generation' && (
                <div className="space-y-6">
                  {/* Force Generate */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Logo className="h-4 w-4" />
                        Force Generate Public Idea
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-text-secondary mb-4">
                        Manually trigger a new public idea using the AI pipeline (client-side). Uses your account's generation slot.
                      </p>
                      {!generating && (
                        <Button onClick={handleForceGenerate}><Logo className="h-4 w-4" /> Force Generate Now</Button>
                      )}
                      {generating && <div className="mt-4"><GenerationAnimation isGenerating={generating} /></div>}
                      {lastGenerated && !generating && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 p-3 rounded-xl bg-emerald/10 border border-emerald/20 text-sm"
                        >
                          <p className="font-medium text-emerald">Successfully generated!</p>
                          <p className="text-text-secondary mt-0.5">{lastGenerated}</p>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Trigger Daily Cron */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Trigger Daily Cron
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-text-secondary mb-4">
                        Invoke the <code className="text-xs bg-surface-2 px-1.5 py-0.5 rounded font-mono">generate-daily</code> edge function directly. Generates 1 SaaS + 1 project idea (if not already done today).
                      </p>
                      <Button
                        onClick={handleTriggerCron}
                        disabled={triggeringCron}
                        variant="secondary"
                      >
                        {triggeringCron ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        {triggeringCron ? 'Running...' : 'Trigger Now'}
                      </Button>
                      {cronResult && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-4"
                        >
                          <pre className="text-xs font-mono bg-surface-2 rounded-lg p-3 overflow-x-auto max-h-60 text-text-secondary whitespace-pre-wrap">
                            {cronResult}
                          </pre>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Generation Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Generation Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="text-center p-3 rounded-lg bg-surface-2">
                          <p className="text-xl font-bold">{stats.totalIdeas}</p>
                          <p className="text-xs text-text-muted">All-Time Ideas</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-surface-2">
                          <p className="text-xl font-bold">{stats.publicIdeas}</p>
                          <p className="text-xs text-text-muted">Public</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-surface-2">
                          <p className="text-xl font-bold">{stats.privateIdeas}</p>
                          <p className="text-xs text-text-muted">Private (User)</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-emerald/5 border border-emerald/20">
                          <p className="text-xl font-bold text-emerald">{stats.todayIdeas}</p>
                          <p className="text-xs text-emerald">Today</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  )
}
