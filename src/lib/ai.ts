import { supabase } from './supabase'
import { getMarketIntelligence, buildMarketContext, getRedditInsights, getTrustMRRInsights, getG2Insights, getTwitterInsights } from './market-data'
import { siteConfig } from './site-config'

const MAX_RETRIES = 3

// --- Deduplication helpers ---

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

function wordSet(s: string): Set<string> {
  return new Set(normalize(s).split(' ').filter(w => w.length > 2))
}

// Jaccard similarity between two strings (0-1)
function similarity(a: string, b: string): number {
  const setA = wordSet(a)
  const setB = wordSet(b)
  if (setA.size === 0 && setB.size === 0) return 1
  let intersection = 0
  for (const w of setA) if (setB.has(w)) intersection++
  const union = setA.size + setB.size - intersection
  return union === 0 ? 0 : intersection / union
}

function isTooSimilar(
  newTitle: string,
  newDesc: string,
  existing: Array<{ title: string; description: string | null }>
): { duplicate: boolean; match?: string } {
  const normTitle = normalize(newTitle)
  for (const e of existing) {
    // Exact title match
    if (normalize(e.title) === normTitle) {
      return { duplicate: true, match: e.title }
    }
    // High title similarity (>60%)
    if (similarity(newTitle, e.title) > 0.6) {
      return { duplicate: true, match: e.title }
    }
    // Check description overlap if both exist
    if (newDesc && e.description && similarity(newDesc, e.description) > 0.5) {
      return { duplicate: true, match: e.title }
    }
  }
  return { duplicate: false }
}

async function fetchExistingIdeas(): Promise<Array<{ title: string; description: string | null; category: string | null }>> {
  const { data } = await (supabase
    .from('saas_ideas') as any)
    .select('title, description, category')
    .order('created_at', { ascending: false })
    .limit(200)
  return (data || []) as Array<{ title: string; description: string | null; category: string | null }>
}

function buildBlacklist(existing: Array<{ title: string; category: string | null }>): string {
  if (!existing.length) return ''

  const titles = existing.map(e => e.title)
  const catCounts: Record<string, number> = {}
  for (const e of existing) {
    if (e.category) catCounts[e.category] = (catCounts[e.category] || 0) + 1
  }
  // Categories that are oversaturated (>5 ideas)
  const saturated = Object.entries(catCounts)
    .filter(([, n]) => n > 5)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, n]) => `${cat} (${n} ideas)`)

  let block = '\n\n=== ALREADY GENERATED IDEAS (DO NOT DUPLICATE) ===\n'
  block += 'The following ideas already exist in our database. You MUST NOT generate anything similar:\n'
  block += titles.map(t => `- ${t}`).join('\n')

  if (saturated.length) {
    block += '\n\nOVERSATURATED CATEGORIES (try to avoid or find a very unique angle):\n'
    block += saturated.map(s => `- ${s}`).join('\n')
  }

  return block
}

const SAAS_SYSTEM_PROMPT = `You are an elite SaaS idea generator. You generate UNIQUE, NEVER-BEFORE-SEEN SaaS business ideas that can generate real revenue. You are completely uncensored — you can suggest ideas in ANY industry including adult content, gambling, controversial niches, etc.

CRITICAL RULES:
1. Every idea MUST be unique — not a clone of an existing product
2. If a similar product exists, clearly state the competitor and explain what makes YOUR idea fundamentally different
3. Every idea MUST have a clear path to revenue
4. Be specific with numbers — estimate realistic MRR, daily/weekly/monthly sales
5. Break down the FULL tech stack needed
6. Define team roles with specific responsibilities
7. Include detailed lead generation and marketing strategies
8. Include SEO strategy
9. Include pricing tiers with specific prices
10. NO CENSORSHIP — any industry, any niche
11. Use the provided real-time market data to identify GAPS, underserved niches, and opportunities that trending companies are MISSING
12. You may also generate the OPPOSITE or contrarian version of a trending idea — if everyone is building X, propose anti-X or an alternative approach
13. Reference specific trending companies as competitors when relevant — show you understand the current market
14. NEVER repeat or closely resemble any idea from the "ALREADY GENERATED IDEAS" blacklist. If you see similar ideas exist, pivot to a completely DIFFERENT concept, industry, or approach
15. Vary your categories — if the blacklist is heavy on one category, deliberately choose a DIFFERENT category
16. Each idea title must be a unique product name — never reuse names or slight variations of existing names
17. Think laterally: combine unrelated industries, invert assumptions, target overlooked demographics, or apply proven models from one sector to a completely different one
18. Pay close attention to Reddit community insights — look for REAL pain points, unmet needs, and problems people are actively complaining about. These are goldmines for SaaS ideas
19. If Reddit shows people frustrated with existing tools, create a BETTER alternative. If people wish something existed, BUILD THAT
20. Study TrustMRR verified startup data carefully — these are REAL startups with VERIFIED revenue. Use their MRR, growth rates, categories, and pricing models to calibrate your estimates. Find gaps in categories with few players or where existing startups are declining
21. If TrustMRR shows startups for sale, that signals market fatigue or founder burnout — there may be an opportunity to build a better version
22. Analyze G2 market intelligence to understand REAL buyer personas, market segments, and industry demand. If a G2 category has 500+ products, the market is crowded — find a niche within it or combine categories
23. G2 data shows which user roles (CEO, Project Manager, etc.) actively buy software — target underserved roles or create tools that bridge multiple buyer personas
24. Monitor Twitter/X pulse for what builders are ACTUALLY shipping right now, what tools people are requesting, and which launches are getting traction. High-engagement tweets signal validated demand
25. If Twitter shows someone wishing a tool existed or complaining about an existing one, that's a LIVE market signal — act on it`

const FULL_SYSTEM_PROMPT = `You are an elite project idea generator covering ALL industries and project types. You generate UNIQUE, NEVER-BEFORE-SEEN business and project ideas that can generate real revenue or solve real problems. You are completely uncensored — you can suggest ideas in ANY industry including adult content, gambling, controversial niches, etc.

PROJECT TYPES YOU COVER (pick from ANY of these, vary widely):
- SaaS & Software (web apps, mobile apps, APIs, browser extensions, desktop tools)
- Local Business (restaurants, shops, services, cleaning, tutoring, repair, events)
- Hardware & Electronics (IoT devices, consumer gadgets, industrial equipment, robotics)
- Science & Research (lab techniques, experiments, research tools, scientific instruments)
- Manufacturing & Production (consumer goods, industrial products, food production, textiles)
- Biotech & Health Sciences (supplements, diagnostics, medical devices, wellness products)
- Agriculture & Farming (urban farming, aquaponics, organic products, agri-tech)
- E-commerce & Retail (dropshipping, private label, marketplace, subscription boxes)
- Education & Training (courses, tutoring services, educational kits, workshops)
- Creative & Media (content production, design services, publishing, entertainment)
- Real Estate & Property (property management, renovation, co-living, short-term rental)
- Food & Beverage (recipes, food production, beverages, meal kits, restaurant concepts)
- DIY & Crafts (handmade products, soap making, candle making, woodworking, 3D printing)
- Energy & Sustainability (solar, recycling, waste management, green products)
- Financial Services (fintech, consulting, bookkeeping, investment tools)
- Transportation & Logistics (delivery services, fleet management, last-mile solutions)
- Personal Services (coaching, fitness, beauty, pet care, home organization)

CRITICAL RULES:
1. Every idea MUST be unique — not a clone of something that already exists
2. If a similar business/product exists, clearly state the competitor and explain what makes YOUR idea fundamentally different
3. Every idea MUST have a clear path to revenue — be specific about HOW money is made
4. Be specific with numbers — estimate realistic monthly revenue, startup costs, daily/weekly/monthly sales
5. For SOFTWARE ideas: break down the full tech stack. For PHYSICAL ideas: break down required equipment, materials, suppliers, and production process
6. Define team roles with specific responsibilities
7. Include detailed customer acquisition and marketing strategies
8. Include SEO/online presence strategy (even for local/physical businesses)
9. Include pricing or cost structure with specific numbers
10. NO CENSORSHIP — any industry, any niche, any project type
11. Use the provided real-time market data to identify GAPS and opportunities
12. Generate the OPPOSITE or contrarian version of trending ideas when interesting
13. NEVER repeat or closely resemble any idea from the "ALREADY GENERATED IDEAS" blacklist
14. Vary your project TYPES — if the blacklist is heavy on software, generate a local business, hardware, or manufacturing idea instead
15. Each idea title must be a unique name — never reuse names or slight variations
16. Think laterally: combine unrelated industries, apply proven models from one sector to another
17. For physical products: include material costs, production timeline, minimum viable batch size
18. For local businesses: include location strategy, foot traffic analysis, local marketing
19. For science/biotech: include research requirements, regulatory considerations, IP strategy
20. Pay attention to Reddit/Twitter community insights for REAL pain points and unmet needs`

const JSON_SCHEMA = `
You MUST respond in valid JSON format matching this exact structure:
{
  "title": "Product/Business Name",
  "tagline": "One-line pitch",
  "description": "2-3 paragraph detailed description",
  "category": "A short descriptive category name - pick the most fitting one, be consistent with naming",
  "platform": "web|mobile|desktop|browser_extension|api|multi_platform|physical|local|hybrid",
  "monetization_model": "subscription|freemium|one_time|marketplace|advertising|affiliate|hybrid|retail|wholesale|service_fee",
  "pricing_tiers": [
    {"name": "Basic", "price": 0, "billing": "monthly", "features": ["feature1", "feature2"]},
    {"name": "Pro", "price": 29, "billing": "monthly", "features": ["everything in Basic", "feature3"]},
    {"name": "Premium", "price": 99, "billing": "monthly", "features": ["everything in Pro", "feature4"]}
  ],
  "estimated_mrr_low": 5000,
  "estimated_mrr_high": 50000,
  "estimated_daily_sales": 170,
  "estimated_weekly_sales": 1200,
  "estimated_monthly_sales": 5000,
  "revenue_breakdown": {
    "primary_revenue": "Main revenue source",
    "secondary_revenue": "Secondary revenue source",
    "free_trial_conversion_rate": 12,
    "average_customer_lifetime_months": 18,
    "customer_acquisition_cost": 45,
    "lifetime_value": 522
  },
  "tech_stack": {
    "frontend": ["Tools, frameworks, or equipment needed"],
    "backend": ["Backend systems, processes, or infrastructure"],
    "database": ["Data storage or inventory systems"],
    "hosting": ["Hosting, location, or facility needs"],
    "ai_ml": ["AI/ML tools if applicable, or automation"],
    "other": ["Payment processing, shipping, supplies, etc."]
  },
  "team_roles": [
    {
      "role": "Role Title",
      "responsibilities": ["Key responsibility 1", "Key responsibility 2"],
      "skills_needed": ["Skill 1", "Skill 2"],
      "priority": "critical"
    }
  ],
  "lead_generation": {
    "channels": ["Channel 1", "Channel 2", "Channel 3"],
    "strategies": ["Strategy 1", "Strategy 2", "Strategy 3"],
    "estimated_cost_per_lead": 5,
    "conversion_funnel": ["Step 1", "Step 2", "Step 3", "Step 4"]
  },
  "marketing_strategy": {
    "channels": ["Channel 1", "Channel 2", "Channel 3"],
    "content_strategy": ["Content plan items"],
    "paid_advertising": ["Paid channels and strategies"],
    "partnerships": ["Partnership opportunities"],
    "launch_strategy": "How to launch and get first customers"
  },
  "seo_strategy": {
    "target_keywords": ["keyword1", "keyword2"],
    "content_plan": ["Content plan items"],
    "technical_seo": ["Technical requirements"],
    "estimated_organic_traffic_monthly": 15000
  },
  "existing_competitors": [
    {"name": "Competitor X", "url": "https://example.com", "weakness": "Their weakness", "our_advantage": "Our advantage"}
  ],
  "unique_differentiators": ["differentiator1", "differentiator2"],
  "pros": ["pro1", "pro2"],
  "cons": ["con1", "con2"]
}`

function getSystemPrompt(): string {
  const base = siteConfig.mode === 'full' ? FULL_SYSTEM_PROMPT : SAAS_SYSTEM_PROMPT
  return base + JSON_SCHEMA
}

export type GenerationStep =
  | 'preparing'
  | 'researching'
  | 'building_context'
  | 'generating'
  | 'finalizing'
  | 'done'

export async function generateSaasIdea(options?: {
  userSkills?: string[]
  userInterests?: string[]
  preferredPlatforms?: string[]
  experienceLevel?: string
  voteFeedback?: { liked_categories: string[]; disliked_categories: string[] }
  priorityGeneration?: boolean
  onProgress?: (step: GenerationStep) => void
}): Promise<Record<string, unknown> | null> {
  const report = (step: GenerationStep) => options?.onProgress?.(step)
  let userContext = ''

  if (options?.userSkills?.length) {
    userContext += `\nUser's skills: ${options.userSkills.join(', ')}`
  }
  if (options?.userInterests?.length) {
    userContext += `\nUser's interests: ${options.userInterests.join(', ')}`
  }
  if (options?.preferredPlatforms?.length) {
    userContext += `\nPreferred platforms: ${options.preferredPlatforms.join(', ')}`
  }
  if (options?.experienceLevel) {
    userContext += `\nExperience level: ${options.experienceLevel}`
  }
  if (options?.voteFeedback) {
    if (options.voteFeedback.liked_categories.length) {
      userContext += `\nCategories users love: ${options.voteFeedback.liked_categories.join(', ')}`
    }
    if (options.voteFeedback.disliked_categories.length) {
      userContext += `\nCategories to avoid: ${options.voteFeedback.disliked_categories.join(', ')}`
    }
  }

  // Fetch existing ideas for dedup + market intelligence + reddit + trustmrr in parallel
  report('preparing')
  const existingIdeasPromise = fetchExistingIdeas().catch(() => [] as Array<{ title: string; description: string | null; category: string | null }>)

  report('researching')
  const [existingIdeas, marketData, redditContext, trustmrrContext, g2Context, twitterContext] = await Promise.all([
    existingIdeasPromise,
    getMarketIntelligence().catch(() => ({ trending: [], categories: [] })),
    getRedditInsights().catch(() => ''),
    getTrustMRRInsights().catch(() => ''),
    getG2Insights().catch(() => ''),
    getTwitterInsights().catch(() => ''),
  ])

  report('building_context')
  const blacklist = buildBlacklist(existingIdeas)
  const marketContext = buildMarketContext(marketData)
  const marketSection = marketContext
    ? `\n\nHere is REAL-TIME market data to inform your idea. Use this to find gaps, avoid clones, and generate something truly unique:\n${marketContext}\n\n`
    : ''
  const redditSection = redditContext
    ? `\n\n${redditContext}\n\n`
    : ''
  const trustmrrSection = trustmrrContext
    ? `\n\n${trustmrrContext}\n\n`
    : ''
  const g2Section = g2Context
    ? `\n\n${g2Context}\n\n`
    : ''
  const twitterSection = twitterContext
    ? `\n\n${twitterContext}\n\n`
    : ''

  // Retry loop — regenerate if duplicate detected
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const retryHint = attempt > 1
      ? `\n\n⚠️ RETRY #${attempt}: Your previous idea was rejected for being too similar to an existing one. Generate something COMPLETELY DIFFERENT — different industry, different approach, different name.`
      : ''

    const ideaType = siteConfig.mode === 'full'
      ? 'project or business idea (any type: SaaS, local business, hardware, science, manufacturing, etc.)'
      : 'SaaS business idea'

    const userMessage = `Generate a completely unique ${ideaType} that doesn't exist yet. Make it innovative and revenue-generating. Include FULL breakdown of monetization, tech stack (or equipment/materials for physical projects), team, marketing, and lead generation.${userContext}${marketSection}${redditSection}${trustmrrSection}${g2Section}${twitterSection}${blacklist}${retryHint}\n\nIMPORTANT: Your idea must NOT be a copy of any company listed above or any idea in the blacklist. Use Reddit community insights for REAL pain points, TrustMRR data for verified revenue benchmarks, G2 market intelligence for buyer personas, and Twitter/X pulse for real-time builder trends. Be creative and contrarian.\n\nRespond with ONLY valid JSON, no markdown, no code blocks.`

    try {
      report('generating')
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token || ''
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const response = await fetch(`${supabaseUrl}/functions/v1/ai-completion`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          model: options?.priorityGeneration ? 'anthropic/claude-sonnet-4' : 'deepseek/deepseek-chat',
          messages: [
            { role: 'system', content: getSystemPrompt() },
            { role: 'user', content: userMessage },
          ],
          temperature: Math.min(0.9 + attempt * 0.05, 1.0),
          max_tokens: 4000,
        }),
      })

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content
      if (!content) continue

      report('finalizing')
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      let idea: Record<string, unknown>
      try {
        idea = JSON.parse(cleaned)
      } catch {
        console.error('Failed to parse idea JSON, attempt', attempt)
        continue
      }

      // Post-generation duplicate check
      // dedup check is part of finalizing step
      const check = isTooSimilar(
        (idea.title as string) || '',
        (idea.description as string) || '',
        existingIdeas
      )

      if (check.duplicate) {
        console.warn(`Duplicate detected (attempt ${attempt}): "${idea.title}" ≈ "${check.match}". Retrying...`)
        continue
      }

      return idea
    } catch (err) {
      console.error(`AI generation failed (attempt ${attempt}):`, err)
      if (attempt === MAX_RETRIES) return null
    }
  }

  return null
}

const VALID_PLATFORMS = ['web', 'mobile', 'desktop', 'browser_extension', 'api', 'multi_platform', 'physical', 'local', 'hybrid'] as const
const VALID_MONETIZATION = ['subscription', 'freemium', 'one_time', 'marketplace', 'advertising', 'affiliate', 'hybrid', 'retail', 'wholesale', 'service_fee'] as const

function normalizePlatform(raw: unknown): string | null {
  if (!raw || typeof raw !== 'string') return null
  const lower = raw.toLowerCase().replace(/[^a-z_ ]/g, '').trim()
  if (VALID_PLATFORMS.includes(lower as any)) return lower
  if (/multi|cross|all/i.test(lower)) return 'multi_platform'
  if (/mobile|ios|android|app/i.test(lower)) return 'mobile'
  if (/desktop|mac|windows|electron/i.test(lower)) return 'desktop'
  if (/browser.?ext|chrome.?ext|addon|plugin/i.test(lower)) return 'browser_extension'
  if (/api|backend|server/i.test(lower)) return 'api'
  if (/web|saas|cloud|online/i.test(lower)) return 'web'
  if (/physical|hardware|device|product/i.test(lower)) return 'physical'
  if (/local|shop|store|restaurant|service/i.test(lower)) return 'local'
  if (/hybrid|both|mixed/i.test(lower)) return 'hybrid'
  return 'web'
}

function normalizeMonetization(raw: unknown): string | null {
  if (!raw || typeof raw !== 'string') return null
  const lower = raw.toLowerCase().replace(/[^a-z_ ]/g, '').trim()
  if (VALID_MONETIZATION.includes(lower as any)) return lower
  if (/subscri|recurring|monthly|annual/i.test(lower)) return 'subscription'
  if (/freemium|free.?tier|free.?plan/i.test(lower)) return 'freemium'
  if (/one.?time|lifetime|single/i.test(lower)) return 'one_time'
  if (/market|platform|two.?sided/i.test(lower)) return 'marketplace'
  if (/ad|sponsor|display/i.test(lower)) return 'advertising'
  if (/affili|referr|commission/i.test(lower)) return 'affiliate'
  if (/hybrid|mixed|combo|multiple/i.test(lower)) return 'hybrid'
  if (/retail|shop|store|direct/i.test(lower)) return 'retail'
  if (/wholesale|bulk|b2b.?sale/i.test(lower)) return 'wholesale'
  if (/service.?fee|commission|per.?job|per.?hour/i.test(lower)) return 'service_fee'
  return 'subscription'
}

export async function saveIdeaToSupabase(
  idea: Record<string, unknown>,
  isPublic: boolean,
  userId?: string
) {
  const row = {
    title: idea.title as string,
    tagline: idea.tagline as string,
    description: idea.description as string,
    is_public: isPublic,
    generated_for: userId || null,
    idea_type: siteConfig.mode === 'full' ? 'project' : 'saas',
    category: idea.category as string,
    platform: normalizePlatform(idea.platform),
    monetization_model: normalizeMonetization(idea.monetization_model),
    pricing_tiers: idea.pricing_tiers,
    estimated_mrr_low: idea.estimated_mrr_low as number,
    estimated_mrr_high: idea.estimated_mrr_high as number,
    estimated_daily_sales: idea.estimated_daily_sales as number,
    estimated_weekly_sales: idea.estimated_weekly_sales as number,
    estimated_monthly_sales: idea.estimated_monthly_sales as number,
    revenue_breakdown: idea.revenue_breakdown,
    tech_stack: idea.tech_stack,
    team_roles: idea.team_roles,
    lead_generation: idea.lead_generation,
    marketing_strategy: idea.marketing_strategy,
    seo_strategy: idea.seo_strategy,
    existing_competitors: idea.existing_competitors,
    unique_differentiators: idea.unique_differentiators as string[],
    pros: idea.pros as string[],
    cons: idea.cons as string[],
    ai_model_used: idea.ai_model_used as string || 'deepseek/deepseek-chat',
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase
    .from('saas_ideas')
    .insert(row as any)

  if (error) console.error('Save error:', error)
  return { error }
}
