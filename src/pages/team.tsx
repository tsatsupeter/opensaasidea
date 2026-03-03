import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users, Plus, Trash2, Crown, Shield, UserPlus, Loader2,
  Check, X, ThumbsUp, ThumbsDown, Minus, Copy, Key, Tag,
  LayoutDashboard, Settings, ChevronDown, ExternalLink, Headphones,
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
import { formatCurrency } from '@/lib/utils'
import type { TeamIdea, TeamMember } from '@/hooks/use-team'

type Tab = 'ideas' | 'members' | 'categories' | 'api' | 'support'

export function TeamPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { isTeam, tier } = useSubscription()
  const {
    team, members, teamIdeas, customCategories, apiKeys, loading,
    createTeam, inviteMember, removeMember, updateMemberRole,
    updateTeamIdeaStatus, assignTeamIdea, voteOnTeamIdea,
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
  const [apiKeyName, setApiKeyName] = useState('')
  const [generatingKey, setGeneratingKey] = useState(false)
  const [newApiKey, setNewApiKey] = useState<string | null>(null)

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-4">
        <Users className="h-12 w-12 text-text-muted mx-auto" />
        <h2 className="text-xl font-bold">Sign in to access Team features</h2>
        <Button onClick={() => navigate('/login')}>Sign In</Button>
      </div>
    )
  }

  if (!isTeam) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-4">
        <div className="mx-auto h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
          <Users className="h-8 w-8 text-accent" />
        </div>
        <h2 className="text-xl font-bold">Team Workspace</h2>
        <p className="text-text-muted">Upgrade to the Team plan to collaborate with up to 5 members, share ideas, vote on them, and more.</p>
        <Link to="/pricing">
          <Button className="mt-2"><Crown className="h-4 w-4 mr-1.5" /> Upgrade to Team — $45/mo</Button>
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
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
          <p className="text-sm text-text-muted">Set up a shared workspace for your team.</p>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Input
              placeholder="Team name (e.g. Acme Labs)"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
            />
            <Button
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

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: 'ideas', label: 'Ideas', icon: LayoutDashboard },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'support', label: 'Support', icon: Headphones },
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
            <p className="text-xs text-text-muted">{members.filter(m => m.status === 'active').length} members · Team plan</p>
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
            {t.id === 'ideas' && teamIdeas.length > 0 && (
              <span className="ml-1 text-[10px] bg-accent/10 text-accent rounded-full px-1.5">{teamIdeas.length}</span>
            )}
            {t.id === 'members' && (
              <span className="ml-1 text-[10px] bg-surface-2 rounded-full px-1.5">{members.filter(m => m.status === 'active').length}/5</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div key={tab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {tab === 'ideas' && <IdeasTab teamIdeas={teamIdeas} members={members} user={user} isAdmin={isAdmin} updateTeamIdeaStatus={updateTeamIdeaStatus} assignTeamIdea={assignTeamIdea} voteOnTeamIdea={voteOnTeamIdea} toast={toast} />}
        {tab === 'members' && (
          <MembersTab
            members={members} isOwner={isOwner} isAdmin={isAdmin} userId={user.id}
            inviteEmail={inviteEmail} setInviteEmail={setInviteEmail}
            inviting={inviting}
            onInvite={async () => {
              if (!inviteEmail.trim()) return
              setInviting(true)
              const result = await inviteMember(inviteEmail.trim())
              if (result === 'limit') toast('Team member limit reached (5 max)')
              else if (result === 'exists') toast('Already invited')
              else if (result === true) { toast('Member invited!'); setInviteEmail('') }
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
        {tab === 'categories' && (
          <CategoriesTab
            categories={customCategories} isAdmin={isAdmin}
            newName={newCatName} setNewName={setNewCatName}
            newDesc={newCatDesc} setNewDesc={setNewCatDesc}
            onAdd={async () => {
              if (!newCatName.trim()) return
              const ok = await addCustomCategory(newCatName.trim(), newCatDesc.trim() || undefined)
              if (ok) { toast('Category added!'); setNewCatName(''); setNewCatDesc('') }
              else toast('Failed to add category')
            }}
            onDelete={async (id) => {
              await deleteCustomCategory(id)
              toast('Category deleted')
            }}
          />
        )}
        {tab === 'api' && (
          <ApiKeysTab
            apiKeys={apiKeys} newApiKey={newApiKey}
            keyName={apiKeyName} setKeyName={setApiKeyName}
            generating={generatingKey}
            onGenerate={async () => {
              if (!apiKeyName.trim()) return
              setGeneratingKey(true)
              const key = await generateApiKey(apiKeyName.trim())
              if (key) { setNewApiKey(key); setApiKeyName(''); toast('API key generated! Copy it now — it won\'t be shown again.') }
              else toast('Failed to generate key')
              setGeneratingKey(false)
            }}
            onRevoke={async (id) => { await revokeApiKey(id); toast('Key revoked') }}
            onDelete={async (id) => { await deleteApiKey(id); toast('Key deleted') }}
            onCopy={(key) => { navigator.clipboard.writeText(key); toast('Copied to clipboard') }}
          />
        )}
        {tab === 'support' && <SupportTab />}
      </motion.div>
    </div>
  )
}

// ============================================================
// IDEAS TAB
// ============================================================
function IdeasTab({ teamIdeas, members, user, isAdmin, updateTeamIdeaStatus, assignTeamIdea, voteOnTeamIdea, toast }: {
  teamIdeas: TeamIdea[]; members: TeamMember[]; user: any; isAdmin: boolean
  updateTeamIdeaStatus: (id: string, s: TeamIdea['status']) => Promise<void>
  assignTeamIdea: (id: string, uid: string | null) => Promise<void>
  voteOnTeamIdea: (id: string, v: 'approve' | 'reject' | 'maybe') => Promise<void>
  toast: (msg: string) => void
}) {
  const statusColors: Record<string, string> = {
    new: 'bg-blue-500/10 text-blue-400',
    reviewing: 'bg-amber/10 text-amber',
    approved: 'bg-emerald/10 text-emerald',
    rejected: 'bg-rose/10 text-rose',
    in_progress: 'bg-accent/10 text-accent',
  }

  if (teamIdeas.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <LayoutDashboard className="h-10 w-10 text-text-muted mx-auto" />
        <h3 className="text-[15px] font-bold">No shared ideas yet</h3>
        <p className="text-sm text-text-muted max-w-md mx-auto">Share ideas from any idea detail page using the "Share to Team" button.</p>
        <Link to="/explore"><Button variant="outline" className="mt-2">Browse Ideas</Button></Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {teamIdeas.map(ti => {
        const myVote = ti.votes?.find(v => v.user_id === user.id)
        const approves = ti.votes?.filter(v => v.vote === 'approve').length || 0
        const rejects = ti.votes?.filter(v => v.vote === 'reject').length || 0
        const maybes = ti.votes?.filter(v => v.vote === 'maybe').length || 0

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
                    {ti.idea?.category && <Badge variant="secondary" className="text-[10px]">{ti.idea.category}</Badge>}
                    {ti.idea?.estimated_mrr_low && ti.idea?.estimated_mrr_high && (
                      <span className="text-[11px] text-emerald font-medium">
                        {formatCurrency(ti.idea.estimated_mrr_low)} – {formatCurrency(ti.idea.estimated_mrr_high)}/mo
                      </span>
                    )}
                    <span className="text-[10px] text-text-muted">by {ti.shared_by_profile?.full_name || 'Unknown'}</span>
                  </div>
                </div>

                {/* Voting */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => voteOnTeamIdea(ti.id, 'approve')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${myVote?.vote === 'approve' ? 'bg-emerald/20 text-emerald' : 'text-text-muted hover:bg-surface-2'}`}
                    title="Approve"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => voteOnTeamIdea(ti.id, 'maybe')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${myVote?.vote === 'maybe' ? 'bg-amber/20 text-amber' : 'text-text-muted hover:bg-surface-2'}`}
                    title="Maybe"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => voteOnTeamIdea(ti.id, 'reject')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${myVote?.vote === 'reject' ? 'bg-rose/20 text-rose' : 'text-text-muted hover:bg-surface-2'}`}
                    title="Reject"
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[10px] text-text-muted ml-1">{approves}/{maybes}/{rejects}</span>
                </div>
              </div>

              {/* Admin controls */}
              {isAdmin && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
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
function MembersTab({ members, isOwner, isAdmin, userId, inviteEmail, setInviteEmail, inviting, onInvite, onRemove, onRoleChange }: {
  members: TeamMember[]; isOwner: boolean; isAdmin: boolean; userId: string
  inviteEmail: string; setInviteEmail: (v: string) => void
  inviting: boolean; onInvite: () => void
  onRemove: (id: string) => void; onRoleChange: (id: string, role: 'admin' | 'member') => void
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
                  {m.status === 'pending' && <Badge variant="secondary" className="text-[10px]">Pending</Badge>}
                  <span className={`flex items-center gap-1 text-[11px] font-medium capitalize ${
                    m.role === 'owner' ? 'text-brand' : m.role === 'admin' ? 'text-accent' : 'text-text-muted'
                  }`}>
                    <RoleIcon className="h-3 w-3" />
                    {m.role}
                  </span>
                  {/* Role change dropdown */}
                  {isOwner && m.role !== 'owner' && m.user_id !== userId && (
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
// CATEGORIES TAB
// ============================================================
function CategoriesTab({ categories, isAdmin, newName, setNewName, newDesc, setNewDesc, onAdd, onDelete }: {
  categories: any[]; isAdmin: boolean
  newName: string; setNewName: (v: string) => void
  newDesc: string; setNewDesc: (v: string) => void
  onAdd: () => void; onDelete: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      {isAdmin && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-[13px] font-semibold">Add Custom Category</h3>
            <Input placeholder="Category name" value={newName} onChange={e => setNewName(e.target.value)} />
            <Input placeholder="Description (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
            <Button onClick={onAdd} disabled={!newName.trim()} className="w-full">
              <Plus className="h-4 w-4 mr-1" /> Add Category
            </Button>
          </CardContent>
        </Card>
      )}

      {categories.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <Tag className="h-8 w-8 text-text-muted mx-auto" />
          <p className="text-sm text-text-muted">No custom categories yet</p>
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
                <Badge variant="secondary" className="text-[10px]">{cat.slug}</Badge>
                {isAdmin && (
                  <button onClick={() => onDelete(cat.id)} className="p-1 text-text-muted hover:text-rose transition-colors cursor-pointer">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// API KEYS TAB
// ============================================================
function ApiKeysTab({ apiKeys, newApiKey, keyName, setKeyName, generating, onGenerate, onRevoke, onDelete, onCopy }: {
  apiKeys: any[]; newApiKey: string | null
  keyName: string; setKeyName: (v: string) => void
  generating: boolean; onGenerate: () => void
  onRevoke: (id: string) => void; onDelete: (id: string) => void; onCopy: (key: string) => void
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="text-[13px] font-semibold">Generate API Key</h3>
          <p className="text-[11px] text-text-muted">API keys let you access ideas programmatically. Keys are shown only once — save them securely.</p>
          <div className="flex gap-2">
            <Input placeholder="Key name (e.g. My App)" value={keyName} onChange={e => setKeyName(e.target.value)} />
            <Button onClick={onGenerate} disabled={generating || !keyName.trim()}>
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4 mr-1" />}
              Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Show newly generated key */}
      {newApiKey && (
        <Card className="border-emerald/30 bg-emerald/5">
          <CardContent className="p-4 space-y-2">
            <p className="text-[12px] font-semibold text-emerald">New API Key Created — Copy it now!</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[11px] bg-surface-2 rounded-lg px-3 py-2 font-mono break-all">{newApiKey}</code>
              <button onClick={() => onCopy(newApiKey)} className="p-2 bg-surface-2 rounded-lg hover:bg-surface-3 transition-colors cursor-pointer">
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[10px] text-text-muted">This key will not be shown again. Store it securely.</p>
          </CardContent>
        </Card>
      )}

      {apiKeys.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <Key className="h-8 w-8 text-text-muted mx-auto" />
          <p className="text-sm text-text-muted">No API keys yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {apiKeys.map(key => (
            <Card key={key.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <Key className={`h-4 w-4 shrink-0 ${key.is_active ? 'text-accent' : 'text-text-muted'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium">{key.name}</p>
                  <p className="text-[11px] text-text-muted font-mono">{key.key_prefix}••••••••</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!key.is_active && <Badge variant="secondary" className="text-[10px] text-rose">Revoked</Badge>}
                  {key.is_active && (
                    <button onClick={() => onRevoke(key.id)} className="text-[11px] text-text-muted hover:text-amber transition-colors cursor-pointer">
                      Revoke
                    </button>
                  )}
                  <button onClick={() => onDelete(key.id)} className="p-1 text-text-muted hover:text-rose transition-colors cursor-pointer">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* API Docs */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <h3 className="text-[13px] font-semibold">API Usage</h3>
          <div className="bg-surface-2 rounded-lg p-3 text-[11px] font-mono space-y-1">
            <p className="text-text-muted"># Fetch public ideas</p>
            <p>curl -H "x-api-key: YOUR_API_KEY" \</p>
            <p className="pl-4">https://{siteConfig.domain}/v1/api/ideas</p>
          </div>
          <p className="text-[10px] text-text-muted">Include your API key in the x-api-key header. Read-only access.</p>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// SUPPORT TAB
// ============================================================
function SupportTab() {
  return (
    <div className="space-y-4">
      <Card className="border-accent/20 bg-accent/5">
        <CardContent className="p-6 text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
            <Headphones className="h-6 w-6 text-accent" />
          </div>
          <h3 className="text-[15px] font-bold">Priority Support</h3>
          <p className="text-[13px] text-text-muted max-w-md mx-auto">
            As a Team plan member, you get priority support. Reach out to us anytime and we'll respond within 24 hours.
          </p>
          <a
            href={`mailto:support@${siteConfig.domain}?subject=Team Support Request`}
            className="inline-flex items-center gap-1.5 bg-accent text-white rounded-full px-5 py-2 text-[13px] font-semibold hover:bg-accent/90 transition-colors"
          >
            <Headphones className="h-3.5 w-3.5" /> Contact Priority Support
          </a>
          <p className="text-[11px] text-text-muted">support@{siteConfig.domain}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-2">
          <h4 className="text-[13px] font-semibold">What's included with Priority Support:</h4>
          <ul className="space-y-1.5 text-[12px] text-text-secondary">
            <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald shrink-0" /> 24-hour response time guarantee</li>
            <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald shrink-0" /> Dedicated support channel</li>
            <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald shrink-0" /> Feature request prioritization</li>
            <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald shrink-0" /> Custom integration assistance</li>
            <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald shrink-0" /> Onboarding help for new team members</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
