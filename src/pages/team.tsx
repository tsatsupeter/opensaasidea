import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users, Plus, Trash2, Crown, Shield, UserPlus, Loader2,
  Check, X, ThumbsUp, ThumbsDown, Minus, Copy, Key, Tag,
  LayoutDashboard, Settings, ExternalLink, Headphones, Mail,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useSubscription } from '@/hooks/use-subscription'
import { siteConfig } from '@/lib/site-config'
import { useTeam } from '@/hooks/use-team'
import { useToast } from '@/components/ui/toast'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { TeamSkeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import type { TeamIdea, TeamMember } from '@/hooks/use-team'

type Tab = 'ideas' | 'members' | 'settings'

export function TeamPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { isTeam, tier } = useSubscription()
  const {
    team, members, teamIdeas, customCategories, apiKeys, loading, dataLoading,
    createTeam, inviteMember, removeMember, updateMemberRole,
    updateTeamIdeaStatus, assignTeamIdea, voteOnTeamIdea, assignCategory,
    addCustomCategory, deleteCustomCategory,
    generateApiKey, revokeApiKey, deleteApiKey,
  } = useTeam()
  const { toast } = useToast()

  const [tab, setTab] = useState<Tab>('ideas')
  const [teamName, setTeamName] = useState('')
  const [creatingTeam, setCreatingTeam] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatDesc, setNewCatDesc] = useState('')

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-4">
        <Users className="h-12 w-12 text-text-muted mx-auto" />
        <h2 className="text-xl font-bold">Sign in to access Team features</h2>
        <Button onClick={() => navigate('/login')}>Sign In</Button>
      </div>
    )
  }

  if (loading || (team && dataLoading)) {
    return <TeamSkeleton />
  }

  // Allow access if user has team subscription OR is already a member of a team
  if (!isTeam && !team) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-4">
        <div className="mx-auto h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
          <Users className="h-8 w-8 text-accent" />
        </div>
        <h2 className="text-xl font-bold">Team Workspace</h2>
        <p className="text-text-muted">Upgrade to the Team plan to collaborate with up to 5 members, share ideas, vote on them, and more.</p>
        <Link to="/pricing">
          <Button className="mt-2"><Crown className="h-4 w-4 mr-1.5" /> Upgrade to Team - $45/mo</Button>
        </Link>
      </div>
    )
  }

  // --- CREATE TEAM ---
  if (!team) {
    return (
      <div className="max-w-md mx-auto py-20 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
            <Users className="h-8 w-8 text-accent" />
          </div>
          <h2 className="text-xl font-bold">Create Your Team</h2>
          <p className="text-sm text-text-muted">Give your team a name to get started. You can invite members after.</p>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Input
              placeholder="Team name (e.g. Acme Labs)"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && teamName.trim() && !creatingTeam && document.getElementById('create-team-btn')?.click()}
            />
            <Button
              id="create-team-btn"
              className="w-full"
              disabled={!teamName.trim() || creatingTeam}
              onClick={async () => {
                setCreatingTeam(true)
                const result = await createTeam(teamName.trim())
                if (result) toast('Team created!')
                else toast('Failed to create team')
                setCreatingTeam(false)
              }}
            >
              {creatingTeam ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
              Create Team
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isOwner = team.owner_id === user.id
  const myMembership = members.find(m => m.user_id === user.id)
  const isAdmin = myMembership?.role === 'owner' || myMembership?.role === 'admin'
  const activeMembers = members.filter(m => m.status === 'active').length

  const tabs: { id: Tab; label: string; icon: typeof Users; count?: string }[] = [
    { id: 'ideas', label: 'Shared Ideas', icon: LayoutDashboard, count: teamIdeas.length > 0 ? String(teamIdeas.length) : undefined },
    { id: 'members', label: 'Members', icon: Users, count: `${activeMembers}/5` },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{team.name}</h1>
            <p className="text-xs text-text-muted">{activeMembers} member{activeMembers !== 1 ? 's' : ''} - Team plan</p>
          </div>
          <Badge variant="accent" className="ml-auto">Team</Badge>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              tab === t.id
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
            {t.count && (
              <span className={`ml-1 text-[10px] rounded-full px-1.5 ${
                t.id === 'ideas' ? 'bg-accent/10 text-accent' : 'bg-surface-2'
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div key={tab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {tab === 'ideas' && <IdeasTab teamIdeas={teamIdeas} members={members} user={user} isAdmin={isAdmin} categories={customCategories} updateTeamIdeaStatus={updateTeamIdeaStatus} assignTeamIdea={assignTeamIdea} voteOnTeamIdea={voteOnTeamIdea} assignCategory={assignCategory} toast={toast} />}
        {tab === 'members' && (
          <MembersTab
            members={members} isOwner={isOwner} isAdmin={isAdmin} userId={user.id}
            inviteEmail={inviteEmail} setInviteEmail={setInviteEmail}
            inviting={inviting}
            onCopyLink={(token) => {
              const link = `${window.location.origin}/team/invite/${token}`
              navigator.clipboard.writeText(link)
              toast('Invite link copied!')
            }}
            onInvite={async () => {
              if (!inviteEmail.trim()) return
              setInviting(true)
              const result = await inviteMember(inviteEmail.trim())
              if (result === 'limit') toast('Team member limit reached (5 max)')
              else if (result === 'exists') toast('Already invited')
              else if (typeof result === 'object' && result.success) {
                setInviteEmail('')
                if (result.token) {
                  const link = `${window.location.origin}/team/invite/${result.token}`
                  await navigator.clipboard.writeText(link)
                  toast('Invited! Invite link copied to clipboard - send it to them.')
                } else {
                  toast('Member added to team!')
                }
              }
              else toast('Failed to invite')
              setInviting(false)
            }}
            onRemove={async (id) => {
              const ok = await removeMember(id)
              toast(ok ? 'Member removed' : 'Failed to remove')
            }}
            onRoleChange={async (id, role) => {
              await updateMemberRole(id, role)
              toast('Role updated')
            }}
          />
        )}
        {tab === 'settings' && (
          <SettingsTab
            categories={customCategories} isAdmin={isAdmin}
            newCatName={newCatName} setNewCatName={setNewCatName}
            newCatDesc={newCatDesc} setNewCatDesc={setNewCatDesc}
            onAddCategory={async () => {
              if (!newCatName.trim()) return
              const ok = await addCustomCategory(newCatName.trim(), newCatDesc.trim() || undefined)
              if (ok) { toast('Category added!'); setNewCatName(''); setNewCatDesc('') }
              else toast('Failed to add category')
            }}
            onDeleteCategory={async (id) => {
              await deleteCustomCategory(id)
              toast('Category deleted')
            }}
          />
        )}
      </motion.div>
    </div>
  )
}

// ============================================================
// IDEAS TAB
// ============================================================
function IdeasTab({ teamIdeas, members, user, isAdmin, categories, updateTeamIdeaStatus, assignTeamIdea, voteOnTeamIdea, assignCategory, toast }: {
  teamIdeas: TeamIdea[]; members: TeamMember[]; user: any; isAdmin: boolean
  categories: { id: string; name: string }[]
  updateTeamIdeaStatus: (id: string, s: TeamIdea['status']) => Promise<void>
  assignTeamIdea: (id: string, uid: string | null) => Promise<void>
  voteOnTeamIdea: (id: string, v: 'approve' | 'reject' | 'maybe') => Promise<void>
  assignCategory: (id: string, catId: string | null) => Promise<void>
  toast: (msg: string) => void
}) {
  const [filterCat, setFilterCat] = useState<string | null>(null)
  const statusColors: Record<string, string> = {
    new: 'bg-blue-500/10 text-blue-400',
    reviewing: 'bg-amber/10 text-amber',
    approved: 'bg-emerald/10 text-emerald',
    rejected: 'bg-rose/10 text-rose',
    in_progress: 'bg-accent/10 text-accent',
  }
  const catMap = new Map(categories.map(c => [c.id, c.name]))

  if (teamIdeas.length === 0) {
    return (
      <div className="space-y-6 py-4">
        <div className="text-center space-y-2">
          <LayoutDashboard className="h-10 w-10 text-text-muted mx-auto" />
          <h3 className="text-[15px] font-bold">No shared ideas yet</h3>
          <p className="text-[12px] text-text-muted">Here's how your team workspace works:</p>
        </div>

        {/* Step-by-step guide */}
        <div className="grid gap-3 max-w-lg mx-auto">
          {[
            { step: '1', title: 'Find ideas you like', desc: 'Browse the Explore page or generate new ideas from your Dashboard.', href: '/explore', cta: 'Browse Ideas' },
            { step: '2', title: 'Share to your team', desc: 'On any idea page, click the "Share to Team" button to add it here.' },
            { step: '3', title: 'Vote together', desc: 'Team members can approve, reject, or mark ideas as "maybe".' },
            { step: '4', title: 'Track progress', desc: 'Admins can change status (reviewing, approved, in progress) and assign ideas to members.' },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-3 rounded-xl border border-border bg-surface-0 p-4">
              <span className="h-7 w-7 rounded-full bg-accent/10 text-accent text-[12px] font-bold flex items-center justify-center shrink-0">{s.step}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold">{s.title}</p>
                <p className="text-[11px] text-text-muted mt-0.5">{s.desc}</p>
                {s.href && s.cta && (
                  <Link to={s.href} className="inline-block mt-2">
                    <Button size="sm" variant="outline" className="text-[11px] h-7 px-3">{s.cta}</Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-3">
          <Link to="/explore"><Button variant="outline">Browse Ideas</Button></Link>
          <Link to="/dashboard"><Button>Generate New Idea</Button></Link>
        </div>
      </div>
    )
  }

  const filtered = filterCat ? teamIdeas.filter(ti => ti.category_id === filterCat) : teamIdeas

  return (
    <div className="space-y-3">
      {/* Category filter bar */}
      {categories.length > 0 && teamIdeas.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterCat(null)}
            className={`text-[11px] font-medium px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              !filterCat ? 'bg-accent text-white' : 'bg-surface-2 text-text-muted hover:text-text-secondary'
            }`}
          >
            All ({teamIdeas.length})
          </button>
          {categories.map(cat => {
            const count = teamIdeas.filter(ti => ti.category_id === cat.id).length
            return (
              <button
                key={cat.id}
                onClick={() => setFilterCat(filterCat === cat.id ? null : cat.id)}
                className={`text-[11px] font-medium px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  filterCat === cat.id ? 'bg-accent text-white' : 'bg-surface-2 text-text-muted hover:text-text-secondary'
                }`}
              >
                {cat.name} {count > 0 && `(${count})`}
              </button>
            )
          })}
          <button
            onClick={() => setFilterCat('none')}
            className={`text-[11px] font-medium px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              filterCat === 'none' ? 'bg-accent text-white' : 'bg-surface-2 text-text-muted hover:text-text-secondary'
            }`}
          >
            Uncategorized ({teamIdeas.filter(ti => !ti.category_id).length})
          </button>
        </div>
      )}

      {(filterCat === 'none' ? teamIdeas.filter(ti => !ti.category_id) : filtered).map(ti => {
        const myVote = ti.votes?.find(v => v.user_id === user.id)
        const approves = ti.votes?.filter(v => v.vote === 'approve').length || 0
        const rejects = ti.votes?.filter(v => v.vote === 'reject').length || 0
        const maybes = ti.votes?.filter(v => v.vote === 'maybe').length || 0
        const catName = ti.category_id ? catMap.get(ti.category_id) : null

        return (
          <Card key={ti.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link to={`/idea/${ti.idea?.slug || ti.idea_id}`} className="text-[14px] font-bold hover:text-accent transition-colors truncate">
                      {ti.idea?.title || 'Unknown Idea'}
                    </Link>
                    <ExternalLink className="h-3 w-3 text-text-muted shrink-0" />
                  </div>
                  {ti.idea?.tagline && <p className="text-[12px] text-text-muted truncate">{ti.idea.tagline}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`text-[10px] font-semibold uppercase rounded-full px-2 py-0.5 ${statusColors[ti.status] || ''}`}>
                      {ti.status.replace('_', ' ')}
                    </span>
                    {catName && (
                      <span className="flex items-center gap-1 text-[10px] font-medium bg-accent/10 text-accent rounded-full px-2 py-0.5">
                        <Tag className="h-2.5 w-2.5" /> {catName}
                      </span>
                    )}
                    {ti.idea?.category && <Badge variant="secondary" className="text-[10px]">{ti.idea.category}</Badge>}
                    {ti.idea?.estimated_mrr_low && ti.idea?.estimated_mrr_high && (
                      <span className="text-[11px] text-emerald font-medium">
                        {formatCurrency(ti.idea.estimated_mrr_low)} - {formatCurrency(ti.idea.estimated_mrr_high)}/mo
                      </span>
                    )}
                    <span className="text-[10px] text-text-muted">by {ti.shared_by_profile?.full_name || 'Unknown'}</span>
                  </div>
                </div>

                {/* Voting */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => voteOnTeamIdea(ti.id, 'approve')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${myVote?.vote === 'approve' ? 'bg-emerald/20 text-emerald' : 'text-text-muted hover:bg-surface-2'}`}
                  >
                    <ThumbsUp className="h-3 w-3" />
                    {approves > 0 && <span>{approves}</span>}
                  </button>
                  <button
                    onClick={() => voteOnTeamIdea(ti.id, 'maybe')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${myVote?.vote === 'maybe' ? 'bg-amber/20 text-amber' : 'text-text-muted hover:bg-surface-2'}`}
                  >
                    <Minus className="h-3 w-3" />
                    {maybes > 0 && <span>{maybes}</span>}
                  </button>
                  <button
                    onClick={() => voteOnTeamIdea(ti.id, 'reject')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${myVote?.vote === 'reject' ? 'bg-rose/20 text-rose' : 'text-text-muted hover:bg-surface-2'}`}
                  >
                    <ThumbsDown className="h-3 w-3" />
                    {rejects > 0 && <span>{rejects}</span>}
                  </button>
                </div>
              </div>

              {/* Admin controls */}
              {isAdmin && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border flex-wrap">
                  <select
                    value={ti.status}
                    onChange={e => updateTeamIdeaStatus(ti.id, e.target.value as TeamIdea['status'])}
                    className="text-[11px] bg-surface-2 border border-border rounded-lg px-2 py-1 text-text-secondary"
                  >
                    <option value="new">New</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="in_progress">In Progress</option>
                  </select>
                  <select
                    value={ti.assigned_to || ''}
                    onChange={e => assignTeamIdea(ti.id, e.target.value || null)}
                    className="text-[11px] bg-surface-2 border border-border rounded-lg px-2 py-1 text-text-secondary"
                  >
                    <option value="">Unassigned</option>
                    {members.filter(m => m.status === 'active' && m.user_id).map(m => (
                      <option key={m.user_id!} value={m.user_id!}>{m.profile?.full_name || m.invited_email || 'Unknown'}</option>
                    ))}
                  </select>
                  {categories.length > 0 && (
                    <select
                      value={ti.category_id || ''}
                      onChange={e => assignCategory(ti.id, e.target.value || null)}
                      className="text-[11px] bg-surface-2 border border-border rounded-lg px-2 py-1 text-text-secondary"
                    >
                      <option value="">No category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                  {ti.assigned_to_profile && (
                    <span className="text-[11px] text-accent">Assigned to {ti.assigned_to_profile.full_name}</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ============================================================
// MEMBERS TAB
// ============================================================
function MembersTab({ members, isOwner, isAdmin, userId, inviteEmail, setInviteEmail, inviting, onInvite, onRemove, onRoleChange, onCopyLink }: {
  members: TeamMember[]; isOwner: boolean; isAdmin: boolean; userId: string
  inviteEmail: string; setInviteEmail: (v: string) => void
  inviting: boolean; onInvite: () => void
  onRemove: (id: string) => void; onRoleChange: (id: string, role: 'admin' | 'member') => void
  onCopyLink: (token: string) => void
}) {
  const roleIcons: Record<string, typeof Crown> = { owner: Crown, admin: Shield, member: Users }

  return (
    <div className="space-y-4">
      {/* Invite */}
      {isAdmin && (
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Email address to invite"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onInvite()}
              />
              <Button onClick={onInvite} disabled={inviting || !inviteEmail.trim()}>
                {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4 mr-1" />}
                Invite
              </Button>
            </div>
            <p className="text-[11px] text-text-muted mt-2">Up to 5 team members. {members.filter(m => m.status === 'active' || m.status === 'pending').length}/5 slots used.</p>
          </CardContent>
        </Card>
      )}

      {/* Member list */}
      <div className="space-y-2">
        {members.map(m => {
          const RoleIcon = roleIcons[m.role] || Users
          return (
            <Card key={m.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-surface-2 flex items-center justify-center text-[12px] font-bold shrink-0 overflow-hidden">
                  {m.profile?.avatar_url ? (
                    <img src={m.profile.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (m.profile?.full_name || m.invited_email || '?')[0].toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate">
                    {m.profile?.full_name || m.invited_email || 'Pending'}
                    {m.user_id === userId && <span className="text-text-muted ml-1">(you)</span>}
                  </p>
                  <p className="text-[11px] text-text-muted truncate">{m.profile?.email || m.invited_email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {m.status === 'pending' && (
                    <>
                      <Badge variant="secondary" className="text-[10px]">Pending</Badge>
                      {m.invite_token && (
                        <button
                          onClick={() => onCopyLink(m.invite_token!)}
                          className="flex items-center gap-1 text-[11px] text-accent hover:text-accent/80 font-medium transition-colors cursor-pointer"
                          title="Copy invite link"
                        >
                          <Copy className="h-3 w-3" /> Copy Link
                        </button>
                      )}
                    </>
                  )}
                  {m.status === 'active' && (
                    <span className={`flex items-center gap-1 text-[11px] font-medium capitalize ${
                      m.role === 'owner' ? 'text-brand' : m.role === 'admin' ? 'text-accent' : 'text-text-muted'
                    }`}>
                      <RoleIcon className="h-3 w-3" />
                      {m.role}
                    </span>
                  )}
                  {/* Role change dropdown */}
                  {isOwner && m.role !== 'owner' && m.user_id !== userId && m.status === 'active' && (
                    <select
                      value={m.role}
                      onChange={e => onRoleChange(m.id, e.target.value as 'admin' | 'member')}
                      className="text-[11px] bg-surface-2 border border-border rounded px-1.5 py-0.5"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                  {/* Remove button */}
                  {isAdmin && m.role !== 'owner' && m.user_id !== userId && (
                    <button onClick={() => onRemove(m.id)} className="p-1 text-text-muted hover:text-rose transition-colors cursor-pointer" title="Remove">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// SETTINGS TAB (Categories + API Keys + Support combined)
// ============================================================
function SettingsTab({ categories, isAdmin, newCatName, setNewCatName, newCatDesc, setNewCatDesc, onAddCategory, onDeleteCategory }: {
  categories: any[]; isAdmin: boolean
  newCatName: string; setNewCatName: (v: string) => void
  newCatDesc: string; setNewCatDesc: (v: string) => void
  onAddCategory: () => void; onDeleteCategory: (id: string) => void
}) {
  return (
    <div className="space-y-6">
      {/* API Keys - Link to dedicated page */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <Key className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold">API Keys & Credits</p>
              <p className="text-[11px] text-text-muted">Manage API keys, view usage, and top up credits.</p>
            </div>
            <Link to="/developer-api">
              <Button variant="outline" className="text-[12px] h-8 px-3">
                <ExternalLink className="h-3 w-3 mr-1.5" /> Open Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Custom Categories */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-semibold">Custom Categories</h3>
            <p className="text-[11px] text-text-muted">Create custom categories to organize your team's ideas.</p>
          </div>
        </div>

        {isAdmin && (
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Input placeholder="Category name" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="flex-1" />
                <Input placeholder="Description (optional)" value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)} className="flex-1" />
                <Button onClick={onAddCategory} disabled={!newCatName.trim()} className="shrink-0">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {categories.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <Tag className="h-7 w-7 text-text-muted mx-auto" />
            <p className="text-[12px] text-text-muted">No custom categories yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map(cat => (
              <Card key={cat.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <Tag className="h-4 w-4 text-accent shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium">{cat.name}</p>
                    {cat.description && <p className="text-[11px] text-text-muted truncate">{cat.description}</p>}
                  </div>
                  {isAdmin && (
                    <button onClick={() => onDeleteCategory(cat.id)} className="p-1 text-text-muted hover:text-rose transition-colors cursor-pointer">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Support */}
      <Card className="border-accent/20 bg-accent/5">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <Headphones className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold">Priority Support</p>
            <p className="text-[11px] text-text-muted">24-hour response time, feature requests, onboarding help.</p>
          </div>
          <a
            href={`mailto:support@${siteConfig.domain}?subject=Team Support Request`}
            className="inline-flex items-center gap-1.5 bg-accent text-white rounded-lg px-4 py-2 text-[12px] font-semibold hover:bg-accent/90 transition-colors shrink-0"
          >
            <Mail className="h-3.5 w-3.5" /> Contact
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
