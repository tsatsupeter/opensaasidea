// SaasyTrends API integration for real market intelligence
// Free endpoints — no API key required

const BASE = 'https://saasytrends.com/api'

export interface TrendingCompany {
  name: string
  description: string
  shortDescription: string
  category: string[]
  businessModel: string
  growthRate: number
}

export interface SaaSCategory {
  name: string
  slug: string
  parentName?: string
}

interface CompaniesResponse {
  chartData: Array<{
    datasets: Array<{ label: string }>
    description: string
    shortDescription: string
    category: string[]
    businessModel: string
    growthRate: number
  }>
  totalResults: number
}

async function fetchJSON<T>(url: string, timeoutMs = 8000): Promise<T | null> {
  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(id)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

function parseCompanies(data: CompaniesResponse | null): TrendingCompany[] {
  if (!data?.chartData) return []
  return data.chartData
    .filter(c => c.datasets?.[0]?.label && c.description)
    .map(c => ({
      name: c.datasets[0].label,
      description: c.description,
      shortDescription: c.shortDescription || '',
      category: c.category || [],
      businessModel: c.businessModel || 'unknown',
      growthRate: c.growthRate || 0,
    }))
}

// Fetch multiple endpoints in parallel for diverse market data
export async function getMarketIntelligence(): Promise<{
  trending: TrendingCompany[]
  categories: string[]
}> {
  const [
    top48h,
    b2b24h,
    b2c24h,
    niche24h,
    categoriesRaw,
  ] = await Promise.all([
    fetchJSON<CompaniesResponse>(`${BASE}/companies?timeFrame=48&page=1`),
    fetchJSON<CompaniesResponse>(`${BASE}/companies?timeFrame=24&page=1&model=B2B`),
    fetchJSON<CompaniesResponse>(`${BASE}/companies?timeFrame=24&page=1&model=B2C`),
    fetchJSON<CompaniesResponse>(`${BASE}/companies?timeFrame=24&page=1&model=B2B%2FB2C&volumeMin=5&volumeMax=100`),
    fetchJSON<SaaSCategory[]>(`${BASE}/categories`),
  ])

  // Merge & dedupe companies by name
  const allCompanies = [
    ...parseCompanies(top48h),
    ...parseCompanies(b2b24h),
    ...parseCompanies(b2c24h),
    ...parseCompanies(niche24h),
  ]
  const seen = new Set<string>()
  const unique: TrendingCompany[] = []
  for (const c of allCompanies) {
    if (!seen.has(c.name)) {
      seen.add(c.name)
      unique.push(c)
    }
  }

  // Sort by growth rate descending, take top 30
  unique.sort((a, b) => b.growthRate - a.growthRate)
  const trending = unique.slice(0, 30)

  // Extract parent categories
  const cats = (categoriesRaw || [])
    .filter(c => c.parentName)
    .map(c => c.parentName!)
  const uniqueCats = [...new Set(cats)].sort()

  return { trending, categories: uniqueCats }
}

// Build a concise market context string for the AI prompt
export function buildMarketContext(data: {
  trending: TrendingCompany[]
  categories: string[]
}): string {
  if (!data.trending.length) return ''

  const lines: string[] = []
  lines.push('=== REAL-TIME SAAS MARKET DATA (from SaasyTrends) ===')
  lines.push('')
  lines.push('TOP TRENDING SAAS COMPANIES RIGHT NOW (sorted by growth rate):')

  // Include top 15 for the prompt (keep it concise)
  for (const c of data.trending.slice(0, 15)) {
    const cats = c.category.join(', ')
    lines.push(`- ${c.name} (${c.businessModel.toUpperCase()}, growth: ${c.growthRate.toFixed(1)}x): ${c.shortDescription || c.description.slice(0, 120)}`)
    if (cats) lines.push(`  Categories: ${cats}`)
  }

  lines.push('')
  lines.push('EMERGING NICHE SAAS (low volume, high growth — untapped opportunities):')
  const niche = data.trending.filter(c => c.growthRate > 4).slice(10, 20)
  for (const c of niche) {
    lines.push(`- ${c.name}: ${c.shortDescription || c.description.slice(0, 100)} [${c.businessModel}]`)
  }

  lines.push('')
  lines.push(`ACTIVE SAAS CATEGORIES: ${data.categories.slice(0, 30).join(', ')}`)

  return lines.join('\n')
}

// === Reddit Community Insights (via proxy Edge Function) ===

export async function getRedditInsights(accessToken?: string): Promise<string> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!supabaseUrl) return ''
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 15000)
    const headers: Record<string, string> = {}
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
      headers['apikey'] = import.meta.env.VITE_SUPABASE_ANON_KEY
    }
    const res = await fetch(`${supabaseUrl}/functions/v1/reddit-insights`, {
      signal: controller.signal,
      headers,
    })
    clearTimeout(id)
    if (!res.ok) return ''
    const json = await res.json()
    return json.context || ''
  } catch {
    return ''
  }
}

// === Twitter/X Real-Time SaaS Pulse (via proxy Edge Function) ===

export async function getTwitterInsights(accessToken?: string): Promise<string> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!supabaseUrl) return ''
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 20000)
    const headers: Record<string, string> = {}
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
      headers['apikey'] = import.meta.env.VITE_SUPABASE_ANON_KEY
    }
    const res = await fetch(`${supabaseUrl}/functions/v1/twitter-insights`, {
      signal: controller.signal,
      headers,
    })
    clearTimeout(id)
    if (!res.ok) return ''
    const json = await res.json()
    return json.context || ''
  } catch {
    return ''
  }
}

// === G2 Software Market Intelligence (via proxy Edge Function) ===

export async function getG2Insights(accessToken?: string): Promise<string> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!supabaseUrl) return ''
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 25000)
    const headers: Record<string, string> = {}
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
      headers['apikey'] = import.meta.env.VITE_SUPABASE_ANON_KEY
    }
    const res = await fetch(`${supabaseUrl}/functions/v1/g2-insights`, {
      signal: controller.signal,
      headers,
    })
    clearTimeout(id)
    if (!res.ok) return ''
    const json = await res.json()
    return json.context || ''
  } catch {
    return ''
  }
}

// === TrustMRR Verified Startup Data (via proxy Edge Function) ===

export async function getTrustMRRInsights(accessToken?: string): Promise<string> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!supabaseUrl) return ''
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 20000)
    const headers: Record<string, string> = {}
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
      headers['apikey'] = import.meta.env.VITE_SUPABASE_ANON_KEY
    }
    const res = await fetch(`${supabaseUrl}/functions/v1/trustmrr-insights`, {
      signal: controller.signal,
      headers,
    })
    clearTimeout(id)
    if (!res.ok) return ''
    const json = await res.json()
    return json.context || ''
  } catch {
    return ''
  }
}
