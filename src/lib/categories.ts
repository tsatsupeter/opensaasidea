import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { siteConfig } from './site-config'

export interface DynamicCategory {
  slug: string
  label: string
  count: number
  color: string
  bgColor: string
}

const COLORS = [
  { color: 'text-brand', bgColor: 'bg-brand/10' },
  { color: 'text-emerald', bgColor: 'bg-emerald/10' },
  { color: 'text-accent', bgColor: 'bg-accent/10' },
  { color: 'text-rose', bgColor: 'bg-rose/10' },
  { color: 'text-amber', bgColor: 'bg-amber/10' },
]

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function toSlug(raw: string): string {
  return raw
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('')
}

export function categoryColor(slug: string) {
  const idx = hashString(slug) % COLORS.length
  return COLORS[idx]
}

export function useCategories() {
  const [categories, setCategories] = useState<DynamicCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      let query = supabase
        .from('saas_ideas')
        .select('category')
        .eq('is_public', true)
      if (siteConfig.mode === 'saas') query = query.eq('idea_type', 'saas')
      const { data } = await query

      if (data) {
        const counts: Record<string, number> = {}
        data.forEach((row: any) => {
          const cat = (row.category || 'Other').trim()
          counts[cat] = (counts[cat] || 0) + 1
        })

        const cats: DynamicCategory[] = Object.entries(counts)
          .map(([label, count]) => {
            const slug = toSlug(label)
            const c = categoryColor(slug)
            return { slug, label, count, ...c }
          })
          .sort((a, b) => b.count - a.count)

        setCategories(cats)
      }
      setLoading(false)
    }
    fetch()
  }, [])

  return { categories, loading }
}
