import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Clock, TrendingUp, ChevronDown, Zap, DollarSign, ArrowUpRight } from 'lucide-react'

export type SortBy = 'best' | 'hot' | 'newest' | 'top' | 'rising' | 'mrr_high' | 'mrr_low'

export const sortOptions: { value: SortBy; label: string; icon: typeof Flame }[] = [
  { value: 'best', label: 'Best', icon: Flame },
  { value: 'hot', label: 'Hot', icon: Zap },
  { value: 'newest', label: 'New', icon: Clock },
  { value: 'top', label: 'Top', icon: TrendingUp },
  { value: 'rising', label: 'Rising', icon: ArrowUpRight },
  { value: 'mrr_high', label: 'Highest MRR', icon: DollarSign },
  { value: 'mrr_low', label: 'Lowest MRR', icon: DollarSign },
]

export function SortDropdown({ value, onChange }: { value: SortBy; onChange: (v: SortBy) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = sortOptions.find(o => o.value === value)!

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full bg-surface-2 border border-border px-4 py-1.5 text-[13px] font-semibold text-text-primary hover:bg-surface-3 transition-colors cursor-pointer"
      >
        <current.icon className="h-4 w-4 text-brand" />
        {current.label}
        <ChevronDown className={`h-3.5 w-3.5 text-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-1.5 z-50 w-48 rounded-xl border border-border bg-surface-1 shadow-xl overflow-hidden"
          >
            <div className="px-4 py-2.5 border-b border-border">
              <p className="text-[13px] font-semibold text-text-primary">Sort by</p>
            </div>
            <div className="py-1">
              {sortOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false) }}
                  className={`flex items-center gap-3 w-full px-4 py-2.5 text-[14px] font-medium transition-colors cursor-pointer ${
                    value === opt.value
                      ? 'bg-surface-2 text-text-primary'
                      : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                  }`}
                >
                  <opt.icon className={`h-4 w-4 ${value === opt.value ? 'text-brand' : 'text-text-muted'}`} />
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
