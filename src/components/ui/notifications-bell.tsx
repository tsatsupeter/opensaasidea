import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useNotifications } from '@/hooks/use-notifications'

export function NotificationsBell() {
  const { unreadCount } = useNotifications()

  return (
    <Link
      to="/notifications"
      className="relative h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface-2 transition-colors"
    >
      <Bell className="h-[18px] w-[18px] text-text-secondary" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] flex items-center justify-center rounded-full bg-brand text-white text-[9px] font-bold px-1">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
