import { useState, memo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { DollarSign, ArrowRight, Globe, Lock, Bookmark, BookmarkCheck, MessageSquare } from 'lucide-react'
import { VoteButton } from './vote-button'
import { ShareMenu } from './share-menu'
import { formatCurrency, timeAgo } from '@/lib/utils'
import { categoryColor, toSlug } from '@/lib/categories'
import { supabase } from '@/lib/supabase'
import { useBookmarks } from '@/hooks/use-bookmarks'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/hooks/use-auth'
import { useAuthModal } from '@/components/ui/auth-modal'
import type { SaasIdea } from '@/types/database'

interface IdeaCardProps {
  idea: SaasIdea
  index?: number
  currentVote?: 'up' | 'down' | null
  onVoteChange?: () => void
  onPublicToggle?: () => void
}

export const IdeaCard = memo(function IdeaCard({ idea, index = 0, currentVote, onVoteChange, onPublicToggle }: IdeaCardProps) {
  const navigate = useNavigate()
  const { openAuthModal } = useAuthModal()
  const { user } = useAuth()
  const { isBookmarked, toggleBookmark } = useBookmarks()
  const { toast } = useToast()
  const [isPublic, setIsPublic] = useState(idea.is_public)
  const [sharing, setSharing] = useState(false)
  const catLabel = idea.category || 'Other'
  const slug = toSlug(catLabel)
  const colors = categoryColor(slug)

  const handleCardClick = () => {
    navigate(`/idea/${idea.slug || idea.id}`)
  }

  const handleTogglePublic = async () => {
    if (!user || idea.generated_for !== user.id) return
    setSharing(true)
    try {
      const newVal = !isPublic
      const { error } = await (supabase
        .from('saas_ideas') as any)
        .update({ is_public: newVal })
        .eq('id', idea.id)
      if (!error) {
        setIsPublic(newVal)
        toast(newVal ? 'Shared to public' : 'Made private')
        onPublicToggle?.()
      }
    } catch (err) {
      console.error('Toggle public failed:', err)
    } finally {
      setSharing(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03, ease: 'easeOut' }}
    >
      <article
        onClick={handleCardClick}
        className="group border-b border-border hover:bg-surface-1 transition-colors duration-150 cursor-pointer"
      >
        <div className="px-4 py-3">
          {/* Top: category + time (like subreddit header) */}
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <div className={`h-5 w-5 rounded-full ${colors.bgColor} flex items-center justify-center shrink-0`}>
              <span className={`text-[10px] font-bold ${colors.color}`}>{catLabel[0]}</span>
            </div>
            <Link
              to={`/explore/${slug}`}
              onClick={(e) => e.stopPropagation()}
              className="text-[12px] font-semibold text-text-secondary hover:text-text-primary hover:underline"
            >
              {catLabel}
            </Link>
            <span className="text-[12px] text-text-muted">· {timeAgo(idea.created_at)}</span>
            {idea.monetization_model && (
              <>
                <span className="text-[12px] text-text-muted">·</span>
                <span className="text-[12px] text-text-muted capitalize">{idea.monetization_model.replace('_', ' ')}</span>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="text-[15px] font-semibold text-text-primary group-hover:text-brand transition-colors leading-snug mb-1">
            {idea.title}
          </h3>

          {/* Tagline */}
          {idea.tagline && (
            <p className="text-[13px] text-text-secondary mb-1 line-clamp-1">{idea.tagline}</p>
          )}

          {/* Description */}
          <p className="text-[13px] text-text-muted line-clamp-2 leading-relaxed mb-2">
            {idea.description}
          </p>

          {/* Revenue badge */}
          {idea.estimated_mrr_low && idea.estimated_mrr_high && (
            <div className="inline-flex items-center gap-1 text-[11px] text-emerald font-medium bg-emerald/10 rounded-full px-2 py-0.5 mb-2.5">
              <DollarSign className="h-3 w-3" />
              {formatCurrency(idea.estimated_mrr_low)} - {formatCurrency(idea.estimated_mrr_high)} MRR
            </div>
          )}

          {/* Bottom actions bar - Reddit style */}
          <div className="flex items-center gap-0.5 sm:gap-1 -ml-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
            <VoteButton
              ideaId={idea.id}
              upvotes={idea.upvotes}
              downvotes={idea.downvotes}
              currentVote={currentVote}
              onVoteChange={onVoteChange}
            />
            <Link
              to={`/idea/${idea.slug || idea.id}`}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-text-muted hover:bg-surface-2 transition-colors"
              title="Comments"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{idea.comment_count || 0}</span>
            </Link>
            <Link
              to={`/idea/${idea.slug || idea.id}`}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-text-muted hover:bg-surface-2 transition-colors"
              title="Full Breakdown"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Details</span>
            </Link>
            {user && idea.generated_for === user.id && (
              !isPublic ? (
                <button
                  onClick={handleTogglePublic}
                  disabled={sharing}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-emerald hover:bg-emerald/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{sharing ? 'Publishing...' : 'Share'}</span>
                </button>
              ) : (
                <button
                  onClick={handleTogglePublic}
                  disabled={sharing}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-text-muted hover:bg-surface-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{sharing ? 'Updating...' : 'Private'}</span>
                </button>
              )
            )}
            <ShareMenu idea={idea} />
            <button
              onClick={async () => {
                if (!user) { openAuthModal('login'); return }
                const result = await toggleBookmark(idea.id)
                if (result === 'limit') {
                  toast('Save limit reached. Upgrade to Pro for unlimited saves!')
                  return
                }
                toast(result ? 'Idea saved' : 'Removed from saved')
              }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors cursor-pointer ${
                isBookmarked(idea.id) ? 'text-brand' : 'text-text-muted hover:bg-surface-2'
              }`}
            >
              {isBookmarked(idea.id) ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isBookmarked(idea.id) ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>
      </article>
    </motion.div>
  )
})
