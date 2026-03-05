import { Link } from 'react-router-dom'
import { ThumbsUp } from 'lucide-react'
import { useRecent } from '@/hooks/use-recent'
import { categoryColor, toSlug } from '@/lib/categories'
import { siteConfig } from '@/lib/site-config'

function timeAgoShort(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function RightSidebar() {
  const { recentItems, clearRecent } = useRecent()

  return (
    <aside className="fixed right-0 top-14 bottom-0 w-[300px] border-l border-border bg-[var(--sidebar-bg)] z-30 hidden xl:flex flex-col">
      {/* Header - Reddit style */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Recent Posts</h3>
        {recentItems.length > 0 && (
          <button
            onClick={clearRecent}
            className="text-[11px] text-accent hover:text-accent/80 transition-colors cursor-pointer font-medium"
          >
            Clear
          </button>
        )}
      </div>

      {/* Recent items - Reddit style */}
      <div className="flex-1 overflow-y-auto sidebar-scroll">
        {recentItems.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-text-muted">No recently viewed ideas yet.</p>
            <p className="text-[11px] text-text-muted mt-1">Browse ideas and they'll show up here.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentItems.map((item) => {
              const catLabel = item.category || 'Other'
              const slug = toSlug(catLabel)
              const colors = categoryColor(slug)
              return (
                <Link key={item.id} to={item.path}>
                  <div className="px-4 py-3 hover:bg-surface-2 transition-colors group">
                    {/* Category + time */}
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className={`h-5 w-5 rounded-full ${colors.bgColor} flex items-center justify-center shrink-0`}>
                        <span className={`text-[10px] font-bold ${colors.color}`}>{catLabel[0]}</span>
                      </div>
                      <span className="text-[11px] font-medium text-text-secondary">{catLabel}</span>
                      <span className="text-[11px] text-text-muted">· {timeAgoShort(item.viewedAt)}</span>
                    </div>
                    {/* Title */}
                    <p className="text-[13px] font-medium text-text-primary group-hover:text-brand transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </p>
                    {/* Stats */}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-[11px] text-text-muted">
                        <ThumbsUp className="h-3 w-3" />
                        {item.upvotes || 0} upvotes
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-3 space-y-2">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <Link to="/privacy" className="text-[11px] text-text-muted hover:text-text-secondary hover:underline">Privacy Policy</Link>
          <Link to="/terms" className="text-[11px] text-text-muted hover:text-text-secondary hover:underline">Terms & Conditions</Link>
          <Link to="/accessibility" className="text-[11px] text-text-muted hover:text-text-secondary hover:underline">Accessibility</Link>
        </div>
        <p className="text-[10px] text-text-muted">
          {siteConfig.name}, Inc. © {new Date().getFullYear()}. All rights reserved.
        </p>
      </div>
    </aside>
  )
}
