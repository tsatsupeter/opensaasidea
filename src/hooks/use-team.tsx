import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { useSubscription } from '@/hooks/use-subscription'
import { createNotification } from '@/hooks/use-notifications'

// Helper — cast to bypass missing generated types for new tables
const db = (table: string): any => (supabase.from as any)(table)

export interface Team {
  id: string
  name: string
  slug: string
  owner_id: string
  created_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string | null
  role: 'owner' | 'admin' | 'member'
  status: 'pending' | 'active' | 'removed'
  invited_by: string
  invited_email: string | null
  invite_token: string | null
  created_at: string
  profile?: { full_name: string | null; email: string | null; avatar_url: string | null }
}

export interface TeamIdea {
  id: string
  team_id: string
  idea_id: string
  shared_by: string
  assigned_to: string | null
  status: 'new' | 'reviewing' | 'approved' | 'rejected' | 'in_progress'
  notes: string | null
  created_at: string
  updated_at: string
  idea?: {
    id: string; title: string; tagline: string; slug: string; category: string
    estimated_mrr_low: number; estimated_mrr_high: number; vote_score: number
  }
  votes?: TeamIdeaVote[]
  shared_by_profile?: { full_name: string | null }
  assigned_to_profile?: { full_name: string | null }
}

export interface TeamIdeaVote {
  id: string
  team_idea_id: string
  user_id: string
  vote: 'approve' | 'reject' | 'maybe'
}

export interface CustomCategory {
  id: string
  team_id: string | null
  user_id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  created_at: string
}

export interface ApiKey {
  id: string
  user_id: string
  name: string
  key_prefix: string
  scopes: string[]
  last_used_at: string | null
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export function useTeam() {
  const { user } = useAuth()
  const { isTeam } = useSubscription()
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [teamIdeas, setTeamIdeas] = useState<TeamIdea[]>([])
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([])
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(true)

  const fetchTeam = useCallback(async () => {
    if (!user) { setLoading(false); return }

    const { data: profile } = await db('profiles').select('team_id').eq('id', user.id).single()

    let teamId = profile?.team_id
    if (!teamId) {
      const { data: membership } = await db('team_members')
        .select('team_id').eq('user_id', user.id).eq('status', 'active').limit(1).single()
      if (!membership) { setLoading(false); return }
      await db('profiles').update({ team_id: membership.team_id }).eq('id', user.id)
      teamId = membership.team_id
    }

    const { data: teamData } = await db('teams').select('*').eq('id', teamId).single()
    if (teamData) setTeam(teamData as Team)
    setLoading(false)
  }, [user])

  const fetchMembers = useCallback(async () => {
    if (!team) return
    const { data } = await db('team_members')
      .select('*').eq('team_id', team.id).in('status', ['active', 'pending']).order('created_at')

    if (data) {
      const userIds = (data as any[]).filter((m: any) => m.user_id).map((m: any) => m.user_id)
      const { data: profiles } = userIds.length
        ? await db('profiles').select('id, full_name, email, avatar_url').in('id', userIds)
        : { data: [] }

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
      setMembers((data as any[]).map((m: any) => ({
        ...m,
        profile: m.user_id ? profileMap.get(m.user_id) || undefined : undefined,
      })))
    }
  }, [team])

  const fetchTeamIdeas = useCallback(async () => {
    if (!team) return
    const { data } = await db('team_ideas')
      .select('*').eq('team_id', team.id).order('created_at', { ascending: false })

    if (data && (data as any[]).length) {
      const items = data as any[]
      const ideaIds = items.map((ti: any) => ti.idea_id)
      const { data: ideas } = await db('saas_ideas')
        .select('id, title, tagline, slug, category, estimated_mrr_low, estimated_mrr_high, vote_score')
        .in('id', ideaIds)

      const teamIdeaIds = items.map((ti: any) => ti.id)
      const { data: votes } = await db('team_idea_votes').select('*').in('team_idea_id', teamIdeaIds)

      const pIds = [...new Set([...items.map((d: any) => d.shared_by), ...items.filter((d: any) => d.assigned_to).map((d: any) => d.assigned_to)])]
      const { data: profiles } = pIds.length ? await db('profiles').select('id, full_name').in('id', pIds) : { data: [] }

      const ideaMap = new Map((ideas || []).map((i: any) => [i.id, i]))
      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))

      setTeamIdeas(items.map((ti: any) => ({
        ...ti,
        idea: ideaMap.get(ti.idea_id) || undefined,
        votes: (votes || []).filter((v: any) => v.team_idea_id === ti.id),
        shared_by_profile: profileMap.get(ti.shared_by) || undefined,
        assigned_to_profile: ti.assigned_to ? profileMap.get(ti.assigned_to) || undefined : undefined,
      })))
    } else {
      setTeamIdeas([])
    }
  }, [team])

  const fetchCustomCategories = useCallback(async () => {
    if (!user) return
    const { data } = await db('custom_categories').select('*').order('created_at')
    if (data) setCustomCategories(data as CustomCategory[])
  }, [user])

  const fetchApiKeys = useCallback(async () => {
    if (!user) return
    const { data } = await db('api_keys').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (data) setApiKeys(data as ApiKey[])
  }, [user])

  useEffect(() => { fetchTeam() }, [fetchTeam])
  useEffect(() => {
    if (team) {
      setDataLoading(true)
      Promise.all([fetchMembers(), fetchTeamIdeas()]).finally(() => setDataLoading(false))
    } else {
      setDataLoading(false)
    }
  }, [team, fetchMembers, fetchTeamIdeas])
  useEffect(() => { if (user && isTeam) { fetchCustomCategories(); fetchApiKeys() } }, [user, isTeam, fetchCustomCategories, fetchApiKeys])

  // --- ACTIONS ---

  const createTeam = useCallback(async (name: string) => {
    if (!user) return null
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    const { data: teamData, error } = await db('teams').insert({ name, slug, owner_id: user.id }).select().single()
    if (error || !teamData) return null

    await db('team_members').insert({
      team_id: teamData.id, user_id: user.id,
      role: 'owner', status: 'active', invited_by: user.id,
    })
    await db('profiles').update({ team_id: teamData.id }).eq('id', user.id)

    setTeam(teamData as Team)
    await fetchMembers()
    return teamData as Team
  }, [user, fetchMembers])

  const inviteMember = useCallback(async (email: string): Promise<{ success: boolean; token?: string } | 'limit' | 'exists'> => {
    if (!team || !user) return { success: false }
    const activeMembers = members.filter(m => m.status === 'active' || m.status === 'pending')
    if (activeMembers.length >= 5) return 'limit'

    const existing = members.find(m => m.invited_email === email || m.profile?.email === email)
    if (existing) return 'exists'

    const { data: existingProfile } = await db('profiles').select('id, email').eq('email', email).single()

    // Generate a unique invite token
    const tokenArray = new Uint8Array(16)
    crypto.getRandomValues(tokenArray)
    const inviteToken = Array.from(tokenArray).map(b => b.toString(16).padStart(2, '0')).join('')

    const { error } = await db('team_members').insert({
      team_id: team.id, user_id: existingProfile?.id || null,
      role: 'member', status: existingProfile ? 'active' : 'pending',
      invited_by: user.id, invited_email: email,
      invite_token: existingProfile ? null : inviteToken,
    })
    if (error) return { success: false }

    const inviterName = (await db('profiles').select('full_name').eq('id', user.id).single())?.data?.full_name || 'Someone'

    if (existingProfile) {
      await db('profiles').update({ team_id: team.id }).eq('id', existingProfile.id)
      // Notify existing user they were added
      await createNotification(
        existingProfile.id,
        'team_joined',
        `You were added to ${team.name}`,
        `${inviterName} added you to the team. Head to the Team workspace to get started.`,
        { team_id: team.id }
      )
    } else {
      // For pending invites - notification will be created when they sign up and we match their email
      // But also create one keyed to the invite token for the accept flow
    }

    await fetchMembers()
    return { success: true, token: existingProfile ? undefined : inviteToken }
  }, [team, user, members, fetchMembers])

  const removeMember = useCallback(async (memberId: string) => {
    if (!team) return false
    const member = members.find(m => m.id === memberId)
    if (!member || member.role === 'owner') return false
    await db('team_members').update({ status: 'removed' }).eq('id', memberId)
    if (member.user_id) {
      await db('profiles').update({ team_id: null }).eq('id', member.user_id)
      // Notify removed user
      await createNotification(
        member.user_id,
        'team_removed',
        `You were removed from ${team.name}`,
        'You no longer have access to this team workspace.',
        { team_id: team.id }
      )
    }
    await fetchMembers()
    return true
  }, [team, members, fetchMembers])

  const updateMemberRole = useCallback(async (memberId: string, role: 'admin' | 'member') => {
    if (!team) return false
    await db('team_members').update({ role }).eq('id', memberId)
    await fetchMembers()
    return true
  }, [team, fetchMembers])

  const shareIdeaToTeam = useCallback(async (ideaId: string) => {
    if (!team || !user) return false
    const { error } = await db('team_ideas').insert({
      team_id: team.id, idea_id: ideaId, shared_by: user.id,
    })
    if (error) return false
    await fetchTeamIdeas()
    return true
  }, [team, user, fetchTeamIdeas])

  const updateTeamIdeaStatus = useCallback(async (teamIdeaId: string, status: TeamIdea['status']) => {
    await db('team_ideas').update({ status, updated_at: new Date().toISOString() }).eq('id', teamIdeaId)
    await fetchTeamIdeas()
  }, [fetchTeamIdeas])

  const assignTeamIdea = useCallback(async (teamIdeaId: string, userId: string | null) => {
    await db('team_ideas').update({ assigned_to: userId, updated_at: new Date().toISOString() }).eq('id', teamIdeaId)
    await fetchTeamIdeas()
  }, [fetchTeamIdeas])

  const voteOnTeamIdea = useCallback(async (teamIdeaId: string, vote: 'approve' | 'reject' | 'maybe') => {
    if (!user) return
    await db('team_idea_votes').upsert({
      team_idea_id: teamIdeaId, user_id: user.id, vote,
    }, { onConflict: 'team_idea_id,user_id' })
    await fetchTeamIdeas()
  }, [user, fetchTeamIdeas])

  const addCustomCategory = useCallback(async (name: string, description?: string) => {
    if (!user) return false
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const { error } = await db('custom_categories').insert({
      team_id: team?.id || null, user_id: user.id, name, slug, description: description || null,
    })
    if (error) return false
    await fetchCustomCategories()
    return true
  }, [user, team, fetchCustomCategories])

  const deleteCustomCategory = useCallback(async (categoryId: string) => {
    await db('custom_categories').delete().eq('id', categoryId)
    await fetchCustomCategories()
  }, [fetchCustomCategories])

  const generateApiKey = useCallback(async (name: string): Promise<string | null> => {
    if (!user) return null
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    const rawKey = 'osk_' + Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
    const prefix = rawKey.substring(0, 12)

    const encoder = new TextEncoder()
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(rawKey))
    const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

    const { error } = await db('api_keys').insert({
      user_id: user.id, name, key_prefix: prefix, key_hash: keyHash, scopes: ['read'],
    })
    if (error) return null
    await fetchApiKeys()
    return rawKey
  }, [user, fetchApiKeys])

  const acceptInvite = useCallback(async (token: string): Promise<{ success: boolean; teamName?: string }> => {
    if (!user) return { success: false }

    // Look up the invite by token
    const { data: invite } = await db('team_members')
      .select('id, team_id, status')
      .eq('invite_token', token)
      .eq('status', 'pending')
      .single()

    if (!invite) return { success: false }

    // Activate the member
    await db('team_members')
      .update({ user_id: user.id, status: 'active', invite_token: null })
      .eq('id', invite.id)

    // Link profile to team
    await db('profiles').update({ team_id: invite.team_id }).eq('id', user.id)

    // Get team info + notify the team owner
    const { data: teamData } = await db('teams').select('name, owner_id').eq('id', invite.team_id).single()
    const userName = (await db('profiles').select('full_name').eq('id', user.id).single())?.data?.full_name || 'A new member'

    if (teamData?.owner_id) {
      await createNotification(
        teamData.owner_id,
        'team_joined',
        `${userName} joined ${teamData.name}`,
        'They accepted the team invite and are now a member.',
        { team_id: invite.team_id, user_id: user.id }
      )
    }

    // Re-fetch everything
    await fetchTeam()
    return { success: true, teamName: teamData?.name || 'your team' }
  }, [user, fetchTeam])

  const revokeApiKey = useCallback(async (keyId: string) => {
    await db('api_keys').update({ is_active: false }).eq('id', keyId)
    await fetchApiKeys()
  }, [fetchApiKeys])

  const deleteApiKey = useCallback(async (keyId: string) => {
    await db('api_keys').delete().eq('id', keyId)
    await fetchApiKeys()
  }, [fetchApiKeys])

  return {
    team, members, teamIdeas, customCategories, apiKeys, loading, dataLoading,
    createTeam, inviteMember, removeMember, updateMemberRole,
    shareIdeaToTeam, updateTeamIdeaStatus, assignTeamIdea, voteOnTeamIdea,
    addCustomCategory, deleteCustomCategory,
    generateApiKey, revokeApiKey, deleteApiKey,
    acceptInvite, fetchTeamIdeas,
  }
}
