import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Share2, DollarSign, ArrowRight } from 'lucide-react'
import { VoteButton } from './vote-button'
import { formatCurrency, timeAgo } from '@/lib/utils'
import { categoryColor, toSlug } from '@/lib/categories'
import type { SaasIdea } from '@/types/database'

interface IdeaCardProps {
  idea: SaasIdea
  index?: number
  currentVote?: 'up' | 'down' | null
  onVoteChange?: () => void
}

export function IdeaCard({ idea, index = 0, currentVote, onVoteChange }: IdeaCardProps) {
  const catLabel = idea.category || 'Other'
  const slug = toSlug(catLabel)
  const colors = categoryColor(slug)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03, ease: 'easeOut' }}
    >
      <article className="group border-b border-border hover:bg-surface-1 transition-colors duration-150">
        <div className="px-4 py-3">
          {/* Top: category + time (like subreddit header) */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className={`h-5 w-5 rounded-full ${colors.bgColor} flex items-center justify-center shrink-0`}>
              <span className={`text-[10px] font-bold ${colors.color}`}>{catLabel[0]}</span>
            </div>
            <Link
              to={`/explore/${slug}`}
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
          <Link to={`/idea/${idea.id}`} className="block">
            <h3 className="text-[15px] font-semibold text-text-primary group-hover:text-brand transition-colors leading-snug mb-1">
              {idea.title}
            </h3>
          </Link>

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
          <div className="flex items-center gap-1 -ml-1.5">
            <VoteButton
              ideaId={idea.id}
              upvotes={idea.upvotes}
              downvotes={idea.downvotes}
              currentVote={currentVote}
              onVoteChange={onVoteChange}
            />
            <Link
              to={`/idea/${idea.id}`}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-text-muted hover:bg-surface-2 transition-colors"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              Full Breakdown
            </Link>
            <button className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-text-muted hover:bg-surface-2 transition-colors cursor-pointer">
              <Share2 className="h-3.5 w-3.5" />
              Share
            </button>
          </div>
        </div>
      </article>
    </motion.div>
  )
}
