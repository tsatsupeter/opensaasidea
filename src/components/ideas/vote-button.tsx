import { useState } from 'react'
import { motion } from 'framer-motion'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { useNavigate } from 'react-router-dom'

interface VoteButtonProps {
  ideaId: string
  upvotes: number
  downvotes: number
  currentVote?: 'up' | 'down' | null
  onVoteChange?: () => void
}

export function VoteButton({ ideaId, upvotes, downvotes, currentVote: initialVote, onVoteChange }: VoteButtonProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [vote, setVote] = useState<'up' | 'down' | null>(initialVote ?? null)
  const [counts, setCounts] = useState({ up: upvotes, down: downvotes })
  const [animating, setAnimating] = useState<'up' | 'down' | null>(null)

  const handleVote = async (type: 'up' | 'down') => {
    if (!user) {
      navigate('/login')
      return
    }

    setAnimating(type)
    setTimeout(() => setAnimating(null), 300)

    if (vote === type) {
      // Remove vote
      setVote(null)
      setCounts(prev => ({
        ...prev,
        [type]: prev[type] - 1,
      }))
      await supabase.from('votes').delete().eq('user_id', user.id).eq('idea_id', ideaId)
    } else if (vote) {
      // Switch vote
      const oldType = vote
      setVote(type)
      setCounts(prev => ({
        [oldType]: prev[oldType as 'up' | 'down'] - 1,
        [type]: prev[type] + 1,
      } as { up: number; down: number }))
      await (supabase.from('votes') as any).update({ vote_type: type }).eq('user_id', user.id).eq('idea_id', ideaId)
    } else {
      // New vote
      setVote(type)
      setCounts(prev => ({
        ...prev,
        [type]: prev[type] + 1,
      }))
      await supabase.from('votes').insert({ user_id: user.id, idea_id: ideaId, vote_type: type } as any)
    }

    onVoteChange?.()
  }

  const score = counts.up - counts.down

  return (
    <div className="flex items-center rounded-full bg-surface-2 overflow-hidden">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => handleVote('up')}
        className={cn(
          'flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium transition-all duration-150 cursor-pointer',
          vote === 'up'
            ? 'text-emerald'
            : 'text-text-muted hover:text-emerald'
        )}
      >
        <ThumbsUp className="h-3.5 w-3.5" />
        <span>{counts.up}</span>
      </motion.button>

      <span className={cn(
        'text-[12px] font-bold px-1',
        score > 0 ? 'text-emerald' : score < 0 ? 'text-rose' : 'text-text-muted'
      )}>
        {score > 0 ? '+' : ''}{score}
      </span>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => handleVote('down')}
        className={cn(
          'flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium transition-all duration-150 cursor-pointer',
          vote === 'down'
            ? 'text-rose'
            : 'text-text-muted hover:text-rose'
        )}
      >
        <ThumbsDown className="h-3.5 w-3.5" />
        <span>{counts.down}</span>
      </motion.button>
    </div>
  )
}
