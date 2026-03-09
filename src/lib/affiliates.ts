// Dynamic affiliate link system — loads from Supabase `affiliates` table
// Admin can manage these from the admin panel
import { supabase } from '@/lib/supabase'

interface AffiliateEntry {
  name: string
  display_name: string
  url: string
  tag: string
  logo_url: string
  category: string
  is_active: boolean
}

// In-memory cache (refreshed on load and after admin edits)
let affiliateCache: AffiliateEntry[] = []
let cacheLoaded = false

export async function loadAffiliates(): Promise<void> {
  try {
    const { data } = await supabase
      .from('affiliates')
      .select('name, display_name, url, tag, logo_url, category, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    affiliateCache = (data || []) as AffiliateEntry[]
    cacheLoaded = true
  } catch (err) {
    console.error('Failed to load affiliates:', err)
  }
}

export function getAffiliateLink(tool: string): { url: string; tag: string; logo_url?: string } | null {
  if (!cacheLoaded) return null
  const lower = tool.toLowerCase().trim()
  // Exact match
  const exact = affiliateCache.find(a => a.name.toLowerCase() === lower)
  if (exact) return { url: exact.url, tag: exact.tag, logo_url: exact.logo_url || undefined }
  // Partial match
  const partial = affiliateCache.find(a =>
    lower.includes(a.name.toLowerCase()) || a.name.toLowerCase().includes(lower)
  )
  if (partial) return { url: partial.url, tag: partial.tag, logo_url: partial.logo_url || undefined }
  return null
}

export function hasAffiliateLink(tool: string): boolean {
  return getAffiliateLink(tool) !== null
}

export function getAllAffiliates(): AffiliateEntry[] {
  return affiliateCache
}
