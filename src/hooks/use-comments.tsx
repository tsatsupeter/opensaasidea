import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { sanitizeInput } from '@/lib/utils'
import type { Comment } from '@/types/database'

export interface CommentWithAuthor extends Comment {
  author_name: string | null
  author_avatar: string | null
  replies: CommentWithAuthor[]
  userVote: 'up' | 'down' | null
}

export function useComments(ideaId: string) {
  const { user, profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [comments, setComments] = useState<CommentWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchComments = useCallback(async () => {
    setLoading(true)

    // Fetch all comments for this idea
    const { data: rawComments } = await (supabase
      .from('comments') as any)
      .select('*')
      .eq('idea_id', ideaId)
      .order('created_at', { ascending: true })

    if (!rawComments) {
      setComments([])
      setLoading(false)
      return
    }

    // Fetch author profiles
    const userIds = [...new Set((rawComments as Comment[]).map(c => c.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds)

    const profileMap = new Map<string, { full_name: string | null; avatar_url: string | null }>()
    profiles?.forEach((p: any) => profileMap.set(p.id, p))

    // Fetch user's votes on these comments
    let userVoteMap = new Map<string, 'up' | 'down'>()
    if (user) {
      const commentIds = (rawComments as Comment[]).map(c => c.id)
      const { data: votes } = await (supabase
        .from('comment_votes') as any)
        .select('comment_id, vote_type')
        .eq('user_id', user.id)
        .in('comment_id', commentIds)
      if (votes) {
        votes.forEach((v: any) => userVoteMap.set(v.comment_id, v.vote_type))
      }
    }

    // Build threaded structure
    const allComments: CommentWithAuthor[] = (rawComments as Comment[]).map(c => {
      const profile = profileMap.get(c.user_id)
      return {
        ...c,
        author_name: profile?.full_name || 'Anonymous',
        author_avatar: profile?.avatar_url || null,
        replies: [],
        userVote: userVoteMap.get(c.id) || null,
      }
    })

    const commentMap = new Map<string, CommentWithAuthor>()
    allComments.forEach(c => commentMap.set(c.id, c))

    const topLevel: CommentWithAuthor[] = []
    allComments.forEach(c => {
      if (c.parent_id && commentMap.has(c.parent_id)) {
        commentMap.get(c.parent_id)!.replies.push(c)
      } else {
        topLevel.push(c)
      }
    })

    setComments(topLevel)
    setLoading(false)
  }, [ideaId, user])

  const addComment = useCallback(async (content: string, parentId: string | null = null) => {
    if (!user || !content.trim()) return false
    setSubmitting(true)

    const { error } = await (supabase.from('comments') as any).insert({
      idea_id: ideaId,
      user_id: user.id,
      parent_id: parentId,
      content: sanitizeInput(content),
    })

    setSubmitting(false)
    if (!error) {
      await fetchComments()
      return true
    }
    return false
  }, [user, ideaId, fetchComments])

  const editComment = useCallback(async (commentId: string, content: string) => {
    if (!user || !content.trim()) return false

    let query = (supabase.from('comments') as any)
      .update({ content: sanitizeInput(content), is_edited: true, updated_at: new Date().toISOString() })
      .eq('id', commentId)
    // Non-admin can only edit their own
    if (!isAdmin) query = query.eq('user_id', user.id)

    const { error } = await query
    if (!error) {
      await fetchComments()
      return true
    }
    return false
  }, [user, isAdmin, fetchComments])

  const deleteComment = useCallback(async (commentId: string) => {
    if (!user) return false

    let query = (supabase.from('comments') as any)
      .delete()
      .eq('id', commentId)
    // Non-admin can only delete their own
    if (!isAdmin) query = query.eq('user_id', user.id)

    const { error } = await query
    if (!error) {
      await fetchComments()
      return true
    }
    return false
  }, [user, isAdmin, fetchComments])

  const voteComment = useCallback(async (commentId: string, voteType: 'up' | 'down') => {
    if (!user) return

    // Check existing vote
    const { data: existing } = await (supabase.from('comment_votes') as any)
      .select('id, vote_type')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      if (existing.vote_type === voteType) {
        // Remove vote
        await (supabase.from('comment_votes') as any).delete().eq('id', existing.id)
      } else {
        // Switch vote
        await (supabase.from('comment_votes') as any).update({ vote_type: voteType }).eq('id', existing.id)
      }
    } else {
      // New vote
      await (supabase.from('comment_votes') as any).insert({
        comment_id: commentId,
        user_id: user.id,
        vote_type: voteType,
      })
    }

    await fetchComments()
  }, [user, fetchComments])

  return {
    comments,
    loading,
    submitting,
    fetchComments,
    addComment,
    editComment,
    deleteComment,
    voteComment,
  }
}
