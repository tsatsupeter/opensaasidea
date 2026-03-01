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

const STORAGE_KEY = 'opensaasidea-recent'
const MAX_RECENT = 12

function loadRecent(): RecentItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveRecent(items: RecentItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

const RecentContext = createContext<RecentContextValue | undefined>(undefined)

export function RecentProvider({ children }: { children: ReactNode }) {
  const [recentItems, setRecentItems] = useState<RecentItem[]>(loadRecent)

  const addRecent = useCallback((item: Omit<RecentItem, 'viewedAt'>) => {
    setRecentItems(prev => {
      const filtered = prev.filter(r => r.id !== item.id)
      const updated = [{ ...item, viewedAt: Date.now() }, ...filtered].slice(0, MAX_RECENT)
      saveRecent(updated)
      return updated
    })
  }, [])

  const clearRecent = useCallback(() => {
    setRecentItems([])
    localStorage.removeItem(STORAGE_KEY)
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
