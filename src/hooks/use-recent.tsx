import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export interface RecentItem {
  id: string
  title: string
  category: string
  path: string
  viewedAt: number
  upvotes?: number
}

interface RecentContextValue {
  recentItems: RecentItem[]
  addRecent: (item: Omit<RecentItem, 'viewedAt'>) => void
  clearRecent: () => void
}

const MAX_RECENT = 12

const RecentContext = createContext<RecentContextValue | undefined>(undefined)

export function RecentProvider({ children }: { children: ReactNode }) {
  const [recentItems, setRecentItems] = useState<RecentItem[]>([])

  const addRecent = useCallback((item: Omit<RecentItem, 'viewedAt'>) => {
    setRecentItems(prev => {
      const filtered = prev.filter(r => r.id !== item.id)
      return [{ ...item, viewedAt: Date.now() }, ...filtered].slice(0, MAX_RECENT)
    })
  }, [])

  const clearRecent = useCallback(() => {
    setRecentItems([])
  }, [])

  return (
    <RecentContext.Provider value={{ recentItems, addRecent, clearRecent }}>
      {children}
    </RecentContext.Provider>
  )
}

export function useRecent() {
  const ctx = useContext(RecentContext)
  if (!ctx) throw new Error('useRecent must be used within a RecentProvider')
  return ctx
}
