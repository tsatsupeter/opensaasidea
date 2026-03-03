import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn, sanitizeSearchQuery } from '@/lib/utils'
import { Logo } from '@/components/ui/logo'

interface SearchResult {
  id: string
  slug: string | null
  title: string
  category: string
  tagline: string
}

export function SearchBar() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    const safeQ = sanitizeSearchQuery(q)
    if (!safeQ) { setResults([]); setLoading(false); return }
    const { data } = await supabase
      .from('saas_ideas')
      .select('id, slug, title, category, tagline')
      .eq('is_public', true)
      .or(`title.ilike.%${safeQ}%,tagline.ilike.%${safeQ}%,category.ilike.%${safeQ}%,description.ilike.%${safeQ}%`)
      .limit(8)
    setResults((data as SearchResult[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300)
    return () => clearTimeout(timer)
  }, [query, search])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (e.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const handleSelect = (result: SearchResult) => {
    navigate(`/idea/${result.slug || result.id}`)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className={cn(
        'flex items-center gap-2 rounded-xl border bg-surface-1 px-3 py-2 transition-all duration-200',
        open ? 'border-brand/40 ring-2 ring-brand/10' : 'border-border hover:border-border-hover'
      )}>
        <Search className="h-4 w-4 text-text-muted shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Search ideas..."
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
        />
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-text-muted" />}
        {query && !loading && (
          <button onClick={() => { setQuery(''); setResults([]) }} className="cursor-pointer">
            <X className="h-3.5 w-3.5 text-text-muted hover:text-text-primary" />
          </button>
        )}
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md bg-surface-3 px-1.5 py-0.5 text-[10px] font-mono text-text-muted">
          <span className="text-xs">&#8984;</span>K
        </kbd>
      </div>

      <AnimatePresence>
        {open && (query.length >= 2 || results.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border bg-surface-1 shadow-xl overflow-hidden z-50"
          >
            {results.length === 0 ? (
              <div className="flex items-center gap-2 px-4 py-6 text-sm text-text-muted justify-center">
                <Logo className="h-4 w-4" />
                {query.length < 2 ? 'Type to search...' : 'No ideas found'}
              </div>
            ) : (
              <div className="py-1 max-h-80 overflow-y-auto">
                {results.map(r => (
                  <button
                    key={r.id}
                    onClick={() => handleSelect(r)}
                    className="w-full text-left px-4 py-2.5 hover:bg-surface-2 transition-colors cursor-pointer"
                  >
                    <p className="text-sm font-medium text-text-primary line-clamp-1">{r.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-brand">{r.category}</span>
                      {r.tagline && <span className="text-[11px] text-text-muted line-clamp-1">{r.tagline}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
