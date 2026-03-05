import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, CheckCheck, Trash2, Users, X, Lightbulb, Sparkles } from 'lucide-react'
import { useNotifications, type Notification } from '@/hooks/use-notifications'
import { useTeam } from '@/hooks/use-team'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
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

export function NotificationsDropdown() {
  const { notifications, unreadCount, markAsRead, markAllRead, deleteNotification } = useNotifications()
  const { acceptInvite } = useTeam()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

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
    setOpen(false)
  }

  const handleDeclineInvite = async (notif: Notification) => {
    await deleteNotification(notif.id)
    toast('Invite declined')
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface-2 transition-colors cursor-pointer"
      >
        <Bell className="h-[18px] w-[18px] text-text-secondary" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] flex items-center justify-center rounded-full bg-brand text-white text-[9px] font-bold px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[360px] max-h-[480px] rounded-xl border border-border bg-surface-0 shadow-xl overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-[13px] font-semibold">Notifications</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[11px] text-accent hover:text-accent/80 font-medium transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-surface-2"
                >
                  <CheckCheck className="h-3 w-3" /> Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-surface-2 text-text-muted cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[400px]">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="h-8 w-8 text-text-muted mx-auto mb-2" />
                <p className="text-[12px] text-text-muted">No notifications yet</p>
              </div>
            ) : (
              notifications.map(notif => {
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
                    setOpen(false)
                  }
                }

                return (
                  <div
                    key={notif.id}
                    onClick={isIdeaNotif ? handleNotifClick : undefined}
                    className={cn(
                      'px-4 py-3 border-b border-border last:border-b-0 transition-colors',
                      !notif.read ? 'bg-accent/[0.03]' : '',
                      isIdeaNotif ? 'cursor-pointer hover:bg-surface-2' : ''
                    )}
                  >
                    <div className="flex gap-3">
                      <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', colorClass)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn('text-[12px] leading-tight', !notif.read ? 'font-semibold' : 'font-medium text-text-secondary')}>
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="h-2 w-2 rounded-full bg-accent shrink-0 mt-1" />
                          )}
                        </div>
                        {notif.body && (
                          <p className="text-[11px] text-text-muted mt-0.5 line-clamp-2">{notif.body}</p>
                        )}
                        <p className="text-[10px] text-text-muted mt-1">{timeAgo(notif.created_at)}</p>

                        {/* Action buttons for invites */}
                        {isInvite && (
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => handleAcceptInvite(notif)}
                              className="flex items-center gap-1 text-[11px] font-semibold bg-accent text-white rounded-lg px-3 py-1.5 hover:bg-accent/90 transition-colors cursor-pointer"
                            >
                              <Check className="h-3 w-3" /> Accept
                            </button>
                            <button
                              onClick={() => handleDeclineInvite(notif)}
                              className="flex items-center gap-1 text-[11px] font-semibold bg-surface-2 text-text-secondary rounded-lg px-3 py-1.5 hover:bg-surface-3 transition-colors cursor-pointer"
                            >
                              <X className="h-3 w-3" /> Decline
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Read / Delete actions for non-invite items */}
                      {!isInvite && (
                        <div className="flex items-center gap-0.5 shrink-0">
                          {!notif.read && (
                            <button
                              onClick={() => markAsRead(notif.id)}
                              className="p-1 rounded text-text-muted hover:text-accent transition-colors cursor-pointer"
                              title="Mark as read"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notif.id)}
                            className="p-1 rounded text-text-muted hover:text-rose transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
