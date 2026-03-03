import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'
import { canSaveIdea } from '@/lib/subscription'
import type { SubscriptionTier } from '@/types/database'

export function useBookmarks() {
  const { user, profile } = useAuth()
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const fetchBookmarks = useCallback(async () => {
    if (!user) {
      setBookmarkedIds(new Set())
      return
    }
    const { data } = await supabase
      .from('bookmarks')
      .select('idea_id')
      .eq('user_id', user.id)
    if (data) {
      setBookmarkedIds(new Set(data.map((b: any) => b.idea_id)))
    }
  }, [user])

  useEffect(() => {
    fetchBookmarks()
  }, [fetchBookmarks])

  const toggleBookmark = useCallback(async (ideaId: string): Promise<boolean | 'limit'> => {
    if (!user) return false
    setLoading(true)
    const isCurrentlyBookmarked = bookmarkedIds.has(ideaId)

    // Enforce save limit for non-bookmarked ideas
    if (!isCurrentlyBookmarked) {
      const tier = (profile?.subscription_tier as SubscriptionTier) || 'free'
      if (!canSaveIdea(tier, bookmarkedIds.size)) {
        setLoading(false)
        return 'limit'
      }
    }

    if (isCurrentlyBookmarked) {
      setBookmarkedIds(prev => {
        const next = new Set(prev)
        next.delete(ideaId)
        return next
      })
      await (supabase.from('bookmarks') as any)
        .delete()
        .eq('user_id', user.id)
        .eq('idea_id', ideaId)
    } else {
      setBookmarkedIds(prev => new Set(prev).add(ideaId))
      await (supabase.from('bookmarks') as any)
        .insert({ user_id: user.id, idea_id: ideaId })
    }

    setLoading(false)
    return !isCurrentlyBookmarked
  }, [user, bookmarkedIds])

  const isBookmarked = useCallback((ideaId: string) => bookmarkedIds.has(ideaId), [bookmarkedIds])

  return { isBookmarked, toggleBookmark, loading, bookmarkedIds }
}
