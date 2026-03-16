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

// --- Smart affiliate matching for ideas ---

interface AffiliateMatch {
  name: string
  display_name: string
  url: string
  tag: string
  logo_url: string
  category: string
  score: number
  reason: string
}

// Category → affiliate category mapping for contextual matching
const CATEGORY_AFFINITY: Record<string, string[]> = {
  hosting: ['web', 'saas', 'api', 'multi_platform', 'desktop'],
  database: ['web', 'saas', 'api', 'multi_platform'],
  payment: ['subscription', 'freemium', 'one_time', 'marketplace', 'hybrid', 'retail', 'service_fee'],
  framework: ['web', 'mobile', 'desktop', 'multi_platform'],
  ai: ['ai', 'ml', 'automation', 'chatbot', 'analytics'],
  auth: ['web', 'saas', 'mobile', 'api'],
  analytics: ['web', 'saas', 'mobile', 'marketing'],
  email: ['marketing', 'saas', 'lead_generation'],
  domain: ['web', 'saas', 'hosting'],
  other: [],
}

export function matchAffiliatesForIdea(idea: {
  title?: string
  description?: string
  category?: string
  platform?: string
  monetization_model?: string
  tech_stack?: Record<string, string[]>
  marketing_strategy?: { channels?: string[] }
  seo_strategy?: { target_keywords?: string[] }
}): AffiliateMatch[] {
  if (!cacheLoaded || affiliateCache.length === 0) return []

  // Build a searchable text from the idea
  const techItems: string[] = []
  if (idea.tech_stack) {
    for (const techs of Object.values(idea.tech_stack)) {
      if (Array.isArray(techs)) techItems.push(...techs.map(t => t.toLowerCase()))
    }
  }
  const fullText = [
    idea.title || '',
    idea.description || '',
    idea.category || '',
    idea.platform || '',
    idea.monetization_model || '',
    ...techItems,
    ...(idea.marketing_strategy?.channels || []),
    ...(idea.seo_strategy?.target_keywords || []),
  ].join(' ').toLowerCase()

  const scored: AffiliateMatch[] = []

  for (const aff of affiliateCache) {
    let score = 0
    const reasons: string[] = []
    const affName = aff.name.toLowerCase()
    const affDisplay = aff.display_name.toLowerCase()

    // Direct tech stack match (strongest signal)
    const techMatch = techItems.find(t =>
      t.toLowerCase() === affName ||
      t.toLowerCase().includes(affName) ||
      affName.includes(t.toLowerCase())
    )
    if (techMatch) {
      score += 50
      reasons.push(`Matches tech stack: ${techMatch}`)
    }

    // Name appears in description/title
    if (fullText.includes(affName) || fullText.includes(affDisplay)) {
      score += 30
      reasons.push('Mentioned in idea')
    }

    // Category affinity match
    const affinities = CATEGORY_AFFINITY[aff.category] || []
    if (idea.platform && affinities.includes(idea.platform)) {
      score += 15
      reasons.push(`${aff.category} tools fit ${idea.platform} projects`)
    }
    if (idea.monetization_model && affinities.includes(idea.monetization_model)) {
      score += 10
      reasons.push(`Useful for ${idea.monetization_model} monetization`)
    }

    // Keyword-based contextual matching
    if (aff.category === 'hosting' && /deploy|host|server|cloud|infrastructure/i.test(fullText)) {
      score += 10
      reasons.push('Hosting needs detected')
    }
    if (aff.category === 'database' && /database|storage|data|backend|sql|nosql|postgres|mongo/i.test(fullText)) {
      score += 10
      reasons.push('Database needs detected')
    }
    if (aff.category === 'payment' && /payment|billing|subscri|checkout|stripe|revenue/i.test(fullText)) {
      score += 10
      reasons.push('Payment processing needs detected')
    }
    if (aff.category === 'ai' && /ai|machine learning|ml|gpt|llm|neural|chatbot|automation/i.test(fullText)) {
      score += 10
      reasons.push('AI/ML needs detected')
    }
    if (aff.category === 'auth' && /auth|login|sign.?up|user.?management|sso|oauth/i.test(fullText)) {
      score += 10
      reasons.push('Auth needs detected')
    }
    if (aff.category === 'email' && /email|newsletter|transactional|smtp|marketing.?email/i.test(fullText)) {
      score += 10
      reasons.push('Email needs detected')
    }
    if (aff.category === 'analytics' && /analytics|tracking|metrics|dashboard|monitoring/i.test(fullText)) {
      score += 10
      reasons.push('Analytics needs detected')
    }
    if (aff.category === 'domain' && /domain|dns|registrar|website/i.test(fullText)) {
      score += 10
      reasons.push('Domain needs detected')
    }
    if (aff.category === 'framework' && /framework|react|next|vue|svelte|angular|flutter|expo/i.test(fullText)) {
      score += 10
      reasons.push('Framework needs detected')
    }

    if (score > 0) {
      scored.push({
        name: aff.name,
        display_name: aff.display_name,
        url: aff.url,
        tag: aff.tag,
        logo_url: aff.logo_url,
        category: aff.category,
        score,
        reason: reasons.join('; '),
      })
    }
  }

  // Sort by score descending, return top matches
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, 8)
}

export type { AffiliateEntry, AffiliateMatch }
