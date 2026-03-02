import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Globe, Lock, Bookmark, Clock, ThumbsUp, ThumbsDown,
  Loader2, MapPin, Calendar, Briefcase, FileText, MessageSquare
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { IdeaCard } from '@/components/ideas/idea-card'
import { useAuth } from '@/hooks/use-auth'
import { useBookmarks } from '@/hooks/use-bookmarks'
import { useRecent } from '@/hooks/use-recent'
import { supabase } from '@/lib/supabase'
import type { SaasIdea } from '@/types/database'

type ProfileTab = 'public' | 'private' | 'saved' | 'history' | 'votes' | 'comments'

const TABS: { id: ProfileTab; label: string; icon: typeof Globe }[] = [
  { id: 'public', label: 'Public', icon: Globe },
  { id: 'private', label: 'Private', icon: Lock },
  { id: 'saved', label: 'Saved', icon: Bookmark },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'votes', label: 'Votes', icon: ThumbsUp },
  { id: 'comments', label: 'Comments', icon: MessageSquare },
]

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()
  const { bookmarkedIds } = useBookmarks()
  const { recentItems } = useRecent()
  const [activeTab, setActiveTab] = useState<ProfileTab>('public')
  const [publicIdeas, setPublicIdeas] = useState<SaasIdea[]>([])
  const [privateIdeas, setPrivateIdeas] = useState<SaasIdea[]>([])
  const [savedIdeas, setSavedIdeas] = useState<SaasIdea[]>([])
  const [votedIdeas, setVotedIdeas] = useState<{ idea: SaasIdea; vote_type: 'up' | 'down' }[]>([])
  const [loading, setLoading] = useState(true)
  const [userComments, setUserComments] = useState<{ id: string; content: string; idea_id: string; idea_title: string; idea_slug: string | null; upvotes: number; created_at: string }[]>([])
  const [stats, setStats] = useState({ total: 0, public: 0, private: 0, saved: 0, upvotes: 0, downvotes: 0, comments: 0 })

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)

    // Fetch all user ideas
    const { data: allIdeas } = await supabase
      .from('saas_ideas')
      .select('*')
      .eq('generated_for', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    const ideas = (allIdeas as SaasIdea[]) || []
    const pub = ideas.filter(i => i.is_public)
    const priv = ideas.filter(i => !i.is_public)
    setPublicIdeas(pub)
    setPrivateIdeas(priv)

    // Fetch saved
    if (bookmarkedIds.size > 0) {
      const { data: saved } = await supabase
        .from('saas_ideas')
        .select('*')
        .in('id', Array.from(bookmarkedIds))
        .order('created_at', { ascending: false })
      setSavedIdeas((saved as SaasIdea[]) || [])
    }

    // Fetch votes
    const { data: votes } = await (supabase.from('votes') as any)
      .select('idea_id, vote_type')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (votes && votes.length > 0) {
      const voteIdeaIds = votes.map((v: any) => v.idea_id)
      const { data: voteIdeas } = await supabase
        .from('saas_ideas')
        .select('*')
        .in('id', voteIdeaIds)

      const ideaMap = new Map((voteIdeas || []).map((i: any) => [i.id, i as SaasIdea]))
      const merged = votes
        .map((v: any) => ({ idea: ideaMap.get(v.idea_id), vote_type: v.vote_type as 'up' | 'down' }))
        .filter((v: any) => v.idea)
      setVotedIdeas(merged)
    }

    // Fetch user comments
    const { data: rawComments } = await (supabase.from('comments') as any)
      .select('id, content, idea_id, upvotes, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (rawComments && rawComments.length > 0) {
      const commentIdeaIds = [...new Set(rawComments.map((c: any) => c.idea_id))]
      const { data: commentIdeas } = await supabase
        .from('saas_ideas')
        .select('id, title, slug')
        .in('id', commentIdeaIds as string[])
      const ideaMap = new Map((commentIdeas || []).map((i: any) => [i.id, i]))
      setUserComments(rawComments.map((c: any) => ({
        ...c,
        idea_title: ideaMap.get(c.idea_id)?.title || 'Unknown idea',
        idea_slug: ideaMap.get(c.idea_id)?.slug || null,
      })))
    } else {
      setUserComments([])
    }

    // Stats
    const upVotes = (votes || []).filter((v: any) => v.vote_type === 'up').length
    const downVotes = (votes || []).filter((v: any) => v.vote_type === 'down').length
    setStats({
      total: ideas.length,
      public: pub.length,
      private: priv.length,
      saved: bookmarkedIds.size,
      upvotes: upVotes,
      downvotes: downVotes,
      comments: (rawComments || []).length,
    })

    setLoading(false)
  }, [user, bookmarkedIds])

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
      return
    }
    if (user) fetchData()
  }, [user, authLoading, navigate, fetchData])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
  }

  const historyIdeas = recentItems

  return (
    <div className="max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Profile Header */}
        <Card className="mb-6 overflow-hidden">
          <div className="h-24 gradient-brand opacity-80" />
          <CardContent className="relative pb-5">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
              {/* Avatar */}
              <div className="h-20 w-20 rounded-2xl bg-surface-1 border-4 border-[var(--bg)] flex items-center justify-center shadow-lg overflow-hidden shrink-0">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-brand">
                    {(profile?.full_name || user?.email || '?')[0].toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0 pt-1">
                <h1 className="text-xl font-bold truncate">{profile?.full_name || 'User'}</h1>
                <p className="text-sm text-text-secondary truncate">{user?.email}</p>
                {profile?.bio && (
                  <p className="text-xs text-text-muted mt-1 line-clamp-2">{profile.bio}</p>
                )}
              </div>

              {/* Quick stats */}
              <div className="flex gap-4 text-center shrink-0">
                <div>
                  <p className="text-lg font-bold">{stats.total}</p>
                  <p className="text-[10px] text-text-muted">Ideas</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald">{stats.upvotes}</p>
                  <p className="text-[10px] text-text-muted">Likes</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-amber">{stats.comments}</p>
                  <p className="text-[10px] text-text-muted">Comments</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-accent">{stats.saved}</p>
                  <p className="text-[10px] text-text-muted">Saved</p>
                </div>
              </div>
            </div>

            {/* Profile badges */}
            <div className="flex flex-wrap gap-1.5 mt-4">
              {profile?.experience_level && (
                <Badge variant="secondary" className="gap-1">
                  <Briefcase className="h-3 w-3" />
                  {profile.experience_level}
                </Badge>
              )}
              {profile?.cv_text && (
                <Badge variant="success" className="gap-1">
                  <FileText className="h-3 w-3" />
                  CV uploaded
                </Badge>
              )}
              {profile?.interests?.slice(0, 5).map(interest => (
                <Badge key={interest} variant="default">{interest}</Badge>
              ))}
              {profile?.preferred_platforms?.map(p => (
                <Badge key={p} variant="accent">{p.replace(/_/g, ' ')}</Badge>
              ))}
              {(profile?.interests?.length || 0) > 5 && (
                <Badge variant="secondary">+{(profile?.interests?.length || 0) - 5} more</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-surface-1 rounded-xl border border-border mb-6 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              <span className={`text-[11px] ml-0.5 ${
                activeTab === tab.id ? 'text-white/70' : 'text-text-muted'
              }`}>
                {tab.id === 'public' && stats.public}
                {tab.id === 'private' && stats.private}
                {tab.id === 'saved' && stats.saved}
                {tab.id === 'history' && historyIdeas.length}
                {tab.id === 'votes' && (stats.upvotes + stats.downvotes)}
                {tab.id === 'comments' && stats.comments}
              </span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === 'public' && (
            <TabPanel key="public">
              {publicIdeas.length === 0 ? (
                <EmptyState icon={Globe} text="No public ideas yet" sub="Share ideas to the public feed from your dashboard" />
              ) : (
                <IdeaList ideas={publicIdeas} />
              )}
            </TabPanel>
          )}

          {activeTab === 'private' && (
            <TabPanel key="private">
              {privateIdeas.length === 0 ? (
                <EmptyState icon={Lock} text="No private ideas yet" sub="Generate ideas from your dashboard" />
              ) : (
                <IdeaList ideas={privateIdeas} />
              )}
            </TabPanel>
          )}

          {activeTab === 'saved' && (
            <TabPanel key="saved">
              {savedIdeas.length === 0 ? (
                <EmptyState icon={Bookmark} text="No saved ideas" sub="Bookmark ideas you like from the feed" />
              ) : (
                <IdeaList ideas={savedIdeas} />
              )}
            </TabPanel>
          )}

          {activeTab === 'history' && (
            <TabPanel key="history">
              {historyIdeas.length === 0 ? (
                <EmptyState icon={Clock} text="No browsing history" sub="Ideas you view will appear here" />
              ) : (
                <div className="divide-y divide-border rounded-xl border border-border bg-surface-0 overflow-hidden">
                  {historyIdeas.map((item, i) => (
                    <motion.a
                      key={item.id}
                      href={item.path}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center justify-between px-4 py-3 hover:bg-surface-2 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="default" className="text-[10px] px-1.5 py-0">{item.category}</Badge>
                          <span className="text-[11px] text-text-muted flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(item.viewedAt)}
                          </span>
                        </div>
                      </div>
                      {item.upvotes !== undefined && (
                        <span className="text-xs text-text-muted ml-3">{item.upvotes} votes</span>
                      )}
                    </motion.a>
                  ))}
                </div>
              )}
            </TabPanel>
          )}

          {activeTab === 'comments' && (
            <TabPanel key="comments">
              {userComments.length === 0 ? (
                <EmptyState icon={MessageSquare} text="No comments yet" sub="Share your thoughts on ideas in the community" />
              ) : (
                <div className="divide-y divide-border rounded-xl border border-border bg-surface-0 overflow-hidden">
                  {userComments.map((comment, i) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <a href={`/idea/${comment.idea_slug || comment.idea_id}`} className="block px-4 py-3 hover:bg-surface-2 transition-colors">
                        <div className="flex items-start gap-3">
                          <MessageSquare className="h-4 w-4 text-amber shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-text-primary line-clamp-2">{comment.content}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[11px] text-text-muted">on</span>
                              <span className="text-[11px] font-medium text-brand truncate">{comment.idea_title}</span>
                              <span className="text-[11px] text-text-muted">·</span>
                              <span className="text-[11px] text-text-muted flex items-center gap-1">
                                <ThumbsUp className="h-3 w-3" /> {comment.upvotes}
                              </span>
                              <span className="text-[11px] text-text-muted">·</span>
                              <span className="text-[11px] text-text-muted">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </a>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabPanel>
          )}

          {activeTab === 'votes' && (
            <TabPanel key="votes">
              {votedIdeas.length === 0 ? (
                <EmptyState icon={ThumbsUp} text="No votes yet" sub="Vote on ideas in the explore feed" />
              ) : (
                <div className="divide-y divide-border rounded-xl border border-border bg-surface-0 overflow-hidden">
                  {votedIdeas.map(({ idea, vote_type }, i) => (
                    <motion.div
                      key={idea.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="relative"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{
                        backgroundColor: vote_type === 'up' ? 'var(--emerald)' : 'var(--rose)'
                      }} />
                      <div className="flex items-center gap-3 pl-5 pr-4 py-3">
                        {vote_type === 'up' ? (
                          <ThumbsUp className="h-4 w-4 text-emerald shrink-0" />
                        ) : (
                          <ThumbsDown className="h-4 w-4 text-rose shrink-0" />
                        )}
                        <a href={`/idea/${idea.slug || idea.id}`} className="min-w-0 flex-1 hover:opacity-80 transition-opacity">
                          <p className="text-sm font-medium truncate">{idea.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="default" className="text-[10px] px-1.5 py-0">{idea.category}</Badge>
                            {idea.tagline && (
                              <span className="text-[11px] text-text-muted truncate">{idea.tagline}</span>
                            )}
                          </div>
                        </a>
                        <span className="text-xs text-text-muted shrink-0">
                          {idea.upvotes} / {idea.downvotes}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabPanel>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function TabPanel({ children, ...props }: { children: React.ReactNode; key: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

function IdeaList({ ideas }: { ideas: SaasIdea[] }) {
  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-surface-0 overflow-hidden">
      {ideas.map((idea, i) => (
        <IdeaCard key={idea.id} idea={idea} index={i} />
      ))}
    </div>
  )
}

function EmptyState({ icon: Icon, text, sub }: { icon: typeof Globe; text: string; sub: string }) {
  return (
    <Card className="border-dashed border-border">
      <CardContent className="flex flex-col items-center justify-center py-14">
        <div className="h-12 w-12 rounded-2xl bg-surface-2 flex items-center justify-center mb-3">
          <Icon className="h-6 w-6 text-text-muted" />
        </div>
        <h3 className="font-semibold text-sm mb-1">{text}</h3>
        <p className="text-xs text-text-secondary">{sub}</p>
      </CardContent>
    </Card>
  )
}

function formatTimeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
