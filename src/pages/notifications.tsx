import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, CheckCheck, Trash2, Users, X, Settings, Lightbulb, Sparkles } from 'lucide-react'
import { useNotifications, type Notification } from '@/hooks/use-notifications'
import { useTeam } from '@/hooks/use-team'
import { useAuth } from '@/hooks/use-auth'
import { useAuthModal } from '@/components/ui/auth-modal'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

const typeIcons: Record<string, typeof Users> = {
  team_invite: Users,
  team_joined: Users,
  team_removed: Users,
  idea_generated: Lightbulb,
  new_ideas: Sparkles,
}

const typeColors: Record<string, string> = {
  team_invite: 'bg-accent/10 text-accent',
  team_joined: 'bg-emerald/10 text-emerald',
  team_removed: 'bg-rose/10 text-rose',
  idea_generated: 'bg-brand/10 text-brand',
  new_ideas: 'bg-amber/10 text-amber',
}

export function NotificationsPage() {
  const { user } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllRead, deleteNotification } = useNotifications()
  const { acceptInvite } = useTeam()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { openAuthModal } = useAuthModal()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-3">
        <Bell className="h-10 w-10 text-text-muted mx-auto" />
        <h2 className="text-xl font-bold">Sign in to view notifications</h2>
        <p className="text-sm text-text-muted">You need to be logged in to see your notifications.</p>
        <Button onClick={() => openAuthModal('login')}>Sign In</Button>
      </div>
    )
  }

  const filtered = filter === 'unread' ? notifications.filter(n => !n.read) : notifications

  const handleAcceptInvite = async (notif: Notification) => {
    const token = notif.data?.invite_token
    if (!token) return
    const result = await acceptInvite(token)
    if (result.success) {
      toast(`Joined ${result.teamName}!`)
      await markAsRead(notif.id)
      navigate('/team')
    } else {
      toast('Invite expired or already used')
    }
  }

  const handleDeclineInvite = async (notif: Notification) => {
    await deleteNotification(notif.id)
    toast('Invite declined')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Notifications</h1>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-[12px] text-accent hover:text-accent/80 font-medium transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-surface-2"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {(['all', 'unread'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2.5 text-[13px] font-medium capitalize transition-colors cursor-pointer border-b-2 -mb-px',
              filter === f
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            )}
          >
            {f}
            {f === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 bg-brand text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <Bell className="h-10 w-10 text-text-muted mx-auto" />
          <p className="text-[14px] font-medium text-text-muted">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
          <p className="text-[12px] text-text-muted max-w-sm mx-auto">
            {filter === 'unread'
              ? "You're all caught up!"
              : 'Notifications about team invites, updates, and more will appear here.'
            }
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {filtered.map(notif => {
            const Icon = typeIcons[notif.type] || Bell
            const colorClass = typeColors[notif.type] || 'bg-surface-2 text-text-muted'
            const isInvite = notif.type === 'team_invite' && !notif.read
            const isIdeaNotif = notif.type === 'idea_generated' || notif.type === 'new_ideas'

            const handleNotifClick = () => {
              if (isIdeaNotif) {
                const slug = notif.data?.idea_slug
                if (slug) {
                  navigate(`/idea/${slug}`)
                } else {
                  navigate(notif.type === 'idea_generated' ? '/dashboard' : '/explore')
                }
                markAsRead(notif.id)
              }
            }

            return (
              <div
                key={notif.id}
                onClick={isIdeaNotif ? handleNotifClick : undefined}
                className={cn(
                  'px-5 py-4 transition-colors',
                  !notif.read ? 'bg-accent/[0.03]' : 'hover:bg-surface-1',
                  isIdeaNotif ? 'cursor-pointer hover:bg-surface-2' : ''
                )}
              >
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className={cn('h-10 w-10 rounded-full flex items-center justify-center shrink-0', colorClass)}>
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={cn(
                          'text-[13px] leading-snug',
                          !notif.read ? 'font-semibold text-text-primary' : 'font-medium text-text-secondary'
                        )}>
                          {notif.title}
                        </p>
                        {notif.body && (
                          <p className="text-[12px] text-text-muted mt-0.5 line-clamp-2">{notif.body}</p>
                        )}
                        <p className="text-[11px] text-text-muted mt-1.5">{timeAgo(notif.created_at)}</p>
                      </div>

                      {/* Unread dot */}
                      {!notif.read && !isInvite && (
                        <span className="h-2.5 w-2.5 rounded-full bg-accent shrink-0 mt-1" />
                      )}
                    </div>

                    {/* Invite actions */}
                    {isInvite && (
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => handleAcceptInvite(notif)}
                          className="flex items-center gap-1.5 text-[12px] font-semibold bg-accent text-white rounded-lg px-4 py-2 hover:bg-accent/90 transition-colors cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" /> Accept
                        </button>
                        <button
                          onClick={() => handleDeclineInvite(notif)}
                          className="flex items-center gap-1.5 text-[12px] font-semibold bg-surface-2 text-text-secondary rounded-lg px-4 py-2 hover:bg-surface-3 transition-colors cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" /> Decline
                        </button>
                      </div>
                    )}

                    {/* Actions for non-invite */}
                    {!isInvite && (
                      <div className="flex items-center gap-1 mt-2">
                        {!notif.read && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="flex items-center gap-1 text-[11px] text-text-muted hover:text-accent font-medium transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-surface-2"
                          >
                            <Check className="h-3 w-3" /> Mark as read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="flex items-center gap-1 text-[11px] text-text-muted hover:text-rose font-medium transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-surface-2"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
