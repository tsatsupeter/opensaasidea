import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, ThumbsUp, ThumbsDown, Reply, Pencil, Trash2, Loader2, ChevronDown, ChevronUp, Send } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useAuthModal } from '@/components/ui/auth-modal'
import { useComments, type CommentWithAuthor } from '@/hooks/use-comments'
import { timeAgo } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface CommentSectionProps {
  ideaId: string
  commentCount: number
}

export function CommentSection({ ideaId, commentCount }: CommentSectionProps) {
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()
  const { comments, loading, submitting, fetchComments, addComment, editComment, deleteComment, voteComment } = useComments(ideaId)
  const [newComment, setNewComment] = useState('')
  const [sortBy, setSortBy] = useState<'best' | 'newest' | 'oldest'>('best')

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleSubmit = async () => {
    if (!user) { openAuthModal('login'); return }
    if (!newComment.trim()) return
    const success = await addComment(newComment)
    if (success) setNewComment('')
  }

  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes)
  })

  const totalComments = commentCount || comments.reduce((acc, c) => acc + 1 + countReplies(c), 0)

  return (
    <div className="mt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-text-secondary" />
          <h2 className="text-[16px] font-bold text-text-primary">
            {totalComments} {totalComments === 1 ? 'Comment' : 'Comments'}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          {(['best', 'newest', 'oldest'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={cn(
                'rounded-full px-3 py-1 text-[12px] font-medium transition-colors cursor-pointer capitalize',
                sortBy === s ? 'bg-surface-2 text-text-primary' : 'text-text-muted hover:bg-surface-2'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* New comment input */}
      <div className="mb-6">
        <div className="flex gap-3">
          {user && (
            <div className="h-8 w-8 shrink-0 rounded-full bg-brand/20 flex items-center justify-center">
              <span className="text-[12px] font-bold text-brand">
                {user.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={user ? 'What are your thoughts?' : 'Sign in to comment...'}
              disabled={!user}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
              }}
              className="w-full rounded-xl border border-border bg-surface-1 px-4 py-3 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/10 resize-none min-h-[80px] transition-all"
              rows={3}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-[11px] text-text-muted">
                {user ? 'Ctrl+Enter to submit' : ''}
              </p>
              <button
                onClick={handleSubmit}
                disabled={submitting || !newComment.trim() || !user}
                className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-1.5 text-[13px] font-semibold text-white hover:bg-brand/90 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Comment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </div>
      ) : sortedComments.length === 0 ? (
        <div className="text-center py-12 border border-border rounded-xl bg-surface-1/50">
          <MessageSquare className="h-10 w-10 text-text-muted mx-auto mb-3" />
          <p className="text-[14px] font-medium text-text-secondary mb-1">No comments yet</p>
          <p className="text-[13px] text-text-muted">Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-0">
          {sortedComments.map(comment => (
            <CommentThread
              key={comment.id}
              comment={comment}
              depth={0}
              onVote={voteComment}
              onReply={addComment}
              onEdit={editComment}
              onDelete={deleteComment}
              submitting={submitting}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function countReplies(comment: CommentWithAuthor): number {
  return comment.replies.reduce((acc, r) => acc + 1 + countReplies(r), 0)
}

interface CommentThreadProps {
  comment: CommentWithAuthor
  depth: number
  onVote: (commentId: string, type: 'up' | 'down') => Promise<void>
  onReply: (content: string, parentId: string | null) => Promise<boolean>
  onEdit: (commentId: string, content: string) => Promise<boolean>
  onDelete: (commentId: string) => Promise<boolean>
  submitting: boolean
}

function CommentThread({ comment, depth, onVote, onReply, onEdit, onDelete, submitting }: CommentThreadProps) {
  const { user, profile } = useAuth()
  const { openAuthModal } = useAuthModal()
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(comment.content)
  const [collapsed, setCollapsed] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isOwner = user?.id === comment.user_id
  const canModerate = isOwner || profile?.role === 'admin'
  const score = comment.upvotes - comment.downvotes
  const maxDepth = 6

  const handleReply = async () => {
    if (!user) { openAuthModal('login'); return }
    if (!replyText.trim()) return
    const success = await onReply(replyText, comment.id)
    if (success) {
      setReplyText('')
      setShowReply(false)
    }
  }

  const handleEdit = async () => {
    if (!editText.trim()) return
    const success = await onEdit(comment.id, editText)
    if (success) setEditing(false)
  }

  const handleDelete = async () => {
    await onDelete(comment.id)
    setConfirmDelete(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('relative', depth > 0 && 'ml-4 sm:ml-6')}
    >
      {/* Thread line */}
      {depth > 0 && (
        <div className="absolute left-[-12px] sm:left-[-16px] top-0 bottom-0 w-[2px] bg-border hover:bg-brand/40 transition-colors cursor-pointer"
          onClick={() => setCollapsed(!collapsed)}
        />
      )}

      <div className="py-2.5">
        {/* Author row */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className="h-6 w-6 shrink-0 rounded-full bg-surface-2 flex items-center justify-center overflow-hidden">
            {comment.author_avatar ? (
              <img src={comment.author_avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold text-text-muted">
                {(comment.author_name || 'A')[0].toUpperCase()}
              </span>
            )}
          </div>
          <span className="text-[13px] font-semibold text-text-primary">
            {comment.author_name || 'Anonymous'}
          </span>
          <span className="text-[11px] text-text-muted">·</span>
          <span className="text-[11px] text-text-muted">{timeAgo(comment.created_at)}</span>
          {comment.is_edited && (
            <>
              <span className="text-[11px] text-text-muted">·</span>
              <span className="text-[11px] text-text-muted italic">edited</span>
            </>
          )}
          {depth > 0 && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="ml-auto text-text-muted hover:text-text-secondary cursor-pointer"
            >
              {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={false}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Content */}
              {editing ? (
                <div className="mb-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-[14px] text-text-primary focus:outline-none focus:border-brand/40 resize-none min-h-[60px]"
                    rows={3}
                  />
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      onClick={handleEdit}
                      disabled={submitting || !editText.trim()}
                      className="rounded-full bg-brand px-3 py-1 text-[12px] font-medium text-white hover:bg-brand/90 cursor-pointer disabled:opacity-40"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => { setEditing(false); setEditText(comment.content) }}
                      className="rounded-full px-3 py-1 text-[12px] font-medium text-text-muted hover:bg-surface-2 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-[14px] text-text-secondary leading-relaxed mb-2 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              )}

              {/* Action bar */}
              {!editing && (
                <div className="flex items-center gap-0.5 -ml-1.5 mb-1 flex-wrap">
                  {/* Vote buttons */}
                  <button
                    onClick={() => onVote(comment.id, 'up')}
                    className={cn(
                      'flex items-center gap-1 rounded-full px-2 py-1 text-[12px] font-medium transition-colors cursor-pointer',
                      comment.userVote === 'up' ? 'text-emerald' : 'text-text-muted hover:text-emerald hover:bg-emerald/10'
                    )}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </button>
                  <span className={cn(
                    'text-[12px] font-bold min-w-[20px] text-center',
                    score > 0 ? 'text-emerald' : score < 0 ? 'text-rose' : 'text-text-muted'
                  )}>
                    {score}
                  </span>
                  <button
                    onClick={() => onVote(comment.id, 'down')}
                    className={cn(
                      'flex items-center gap-1 rounded-full px-2 py-1 text-[12px] font-medium transition-colors cursor-pointer',
                      comment.userVote === 'down' ? 'text-rose' : 'text-text-muted hover:text-rose hover:bg-rose/10'
                    )}
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </button>

                  {/* Reply */}
                  {depth < maxDepth && (
                    <button
                      onClick={() => {
                        if (!user) { openAuthModal('login'); return }
                        setShowReply(!showReply)
                      }}
                      className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium text-text-muted hover:bg-surface-2 transition-colors cursor-pointer ml-1"
                    >
                      <Reply className="h-3.5 w-3.5" />
                      Reply
                    </button>
                  )}

                  {/* Owner / Admin actions */}
                  {canModerate && (
                    <>
                      <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium text-text-muted hover:bg-surface-2 transition-colors cursor-pointer"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                      {confirmDelete ? (
                        <div className="flex items-center gap-1 ml-1">
                          <button
                            onClick={handleDelete}
                            className="rounded-full px-2.5 py-1 text-[12px] font-medium text-rose hover:bg-rose/10 transition-colors cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmDelete(false)}
                            className="rounded-full px-2.5 py-1 text-[12px] font-medium text-text-muted hover:bg-surface-2 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(true)}
                          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium text-text-muted hover:text-rose hover:bg-rose/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Reply input */}
              <AnimatePresence>
                {showReply && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="mb-2 overflow-hidden"
                  >
                    <div className="border border-border rounded-xl bg-surface-1 overflow-hidden">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Reply to ${comment.author_name || 'Anonymous'}...`}
                        className="w-full px-3 py-2.5 text-[14px] text-text-primary placeholder:text-text-muted bg-transparent focus:outline-none resize-none min-h-[60px]"
                        rows={2}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleReply()
                          if (e.key === 'Escape') { setShowReply(false); setReplyText('') }
                        }}
                      />
                      <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-border bg-surface-0/50">
                        <button
                          onClick={() => { setShowReply(false); setReplyText('') }}
                          className="rounded-full px-3 py-1 text-[12px] font-medium text-text-muted hover:bg-surface-2 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleReply}
                          disabled={submitting || !replyText.trim()}
                          className="flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-[12px] font-semibold text-white hover:bg-brand/90 cursor-pointer disabled:opacity-40"
                        >
                          {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                          Reply
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Replies */}
              {comment.replies.length > 0 && (
                <div>
                  {comment.replies.map(reply => (
                    <CommentThread
                      key={reply.id}
                      comment={reply}
                      depth={depth + 1}
                      onVote={onVote}
                      onReply={onReply}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      submitting={submitting}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
