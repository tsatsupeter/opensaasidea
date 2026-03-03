import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'

const db = (table: string): any => (supabase.from as any)(table)

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  data: Record<string, any>
  read: boolean
  created_at: string
}

interface NotificationsContextType {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  markAsRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  refetch: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  unreadCount: 0,
  loading: true,
  markAsRead: async () => {},
  markAllRead: async () => {},
  deleteNotification: async () => {},
  refetch: async () => {},
})

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    if (!user) { setNotifications([]); setLoading(false); return }

    // Check for pending team invites matching this user's email
    const email = user.email
    if (email) {
      const { data: pendingInvites } = await db('team_members')
        .select('id, team_id, invite_token')
        .eq('invited_email', email)
        .eq('status', 'pending')
        .not('invite_token', 'is', null)

      if (pendingInvites && pendingInvites.length > 0) {
        for (const invite of pendingInvites as any[]) {
          const { data: teamData } = await db('teams').select('name').eq('id', invite.team_id).single()
          // Check if notification already exists for this invite
          const { data: existing } = await db('notifications')
            .select('id')
            .eq('user_id', user.id)
            .eq('type', 'team_invite')
            .contains('data', { invite_token: invite.invite_token })
            .limit(1)

          if (!existing || existing.length === 0) {
            await db('notifications').insert({
              user_id: user.id,
              type: 'team_invite',
              title: `You're invited to join ${teamData?.name || 'a team'}`,
              body: 'Accept to join the team workspace and collaborate on ideas.',
              data: { team_id: invite.team_id, invite_token: invite.invite_token },
            })
          }
        }
      }
    }

    const { data } = await db('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) setNotifications(data as Notification[])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  // Realtime subscription for new notifications
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          setNotifications(prev => [payload.new as Notification, ...prev])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = useCallback(async (id: string) => {
    await db('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  const markAllRead = useCallback(async () => {
    if (!user) return
    await db('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [user])

  const deleteNotification = useCallback(async (id: string) => {
    await db('notifications').delete().eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  return (
    <NotificationsContext.Provider value={{
      notifications, unreadCount, loading,
      markAsRead, markAllRead, deleteNotification, refetch: fetchNotifications,
    }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationsContext)
}

// Helper to create a notification for a user
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body?: string,
  data?: Record<string, any>
) {
  await db('notifications').insert({
    user_id: userId,
    type,
    title,
    body: body || null,
    data: data || {},
  })
}
