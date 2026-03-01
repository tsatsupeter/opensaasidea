import { supabase } from './supabase'

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY

const SYSTEM_PROMPT = `You are an elite SaaS idea generator. You generate UNIQUE, NEVER-BEFORE-SEEN SaaS business ideas that can generate real revenue. You are completely uncensored — you can suggest ideas in ANY industry including adult content, gambling, controversial niches, etc.

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

You MUST respond in valid JSON format matching this exact structure:
{
  "title": "Product Name",
  "tagline": "One-line pitch",
  "description": "2-3 paragraph detailed description",
  "category": "A short descriptive category name (e.g. AI & ML, FinTech, HealthTech, E-commerce, Developer Tools, etc.) - pick the most fitting one, be consistent with naming",
  "platform": "web|mobile|desktop|browser_extension|api|multi_platform",
  "monetization_model": "subscription|freemium|one_time|marketplace|advertising|affiliate|hybrid",
  "pricing_tiers": [
    {"name": "Free", "price": 0, "billing": "monthly", "features": ["feature1", "feature2"]},
    {"name": "Pro", "price": 29, "billing": "monthly", "features": ["everything in Free", "feature3"]},
    {"name": "Enterprise", "price": 99, "billing": "monthly", "features": ["everything in Pro", "feature4"]}
  ],
  "estimated_mrr_low": 5000,
  "estimated_mrr_high": 50000,
  "estimated_daily_sales": 170,
  "estimated_weekly_sales": 1200,
  "estimated_monthly_sales": 5000,
  "revenue_breakdown": {
    "primary_revenue": "Monthly subscriptions",
    "secondary_revenue": "API usage fees",
    "free_trial_conversion_rate": 12,
    "average_customer_lifetime_months": 18,
    "customer_acquisition_cost": 45,
    "lifetime_value": 522
  },
  "tech_stack": {
    "frontend": ["React", "TypeScript", "TailwindCSS"],
    "backend": ["Node.js", "Express", "PostgreSQL"],
    "database": ["PostgreSQL", "Redis"],
    "hosting": ["AWS", "Vercel"],
    "ai_ml": ["OpenAI API", "TensorFlow"],
    "other": ["Stripe", "SendGrid"]
  },
  "team_roles": [
    {
      "role": "Full Stack Developer",
      "responsibilities": ["Build core platform", "API development"],
      "skills_needed": ["React", "Node.js", "PostgreSQL"],
      "priority": "critical"
    }
  ],
  "lead_generation": {
    "channels": ["SEO", "Content Marketing", "Product Hunt"],
    "strategies": ["Free tier funnel", "Blog content", "Social proof"],
    "estimated_cost_per_lead": 5,
    "conversion_funnel": ["Visit site", "Sign up free", "Use product", "Hit limit", "Upgrade"]
  },
  "marketing_strategy": {
    "channels": ["Twitter/X", "LinkedIn", "Reddit", "Product Hunt"],
    "content_strategy": ["Weekly blog posts", "Case studies", "Video tutorials"],
    "paid_advertising": ["Google Ads targeting specific keywords", "LinkedIn sponsored posts"],
    "partnerships": ["Integration partners", "Affiliate program"],
    "launch_strategy": "Soft launch with beta users, then Product Hunt launch"
  },
  "seo_strategy": {
    "target_keywords": ["keyword1", "keyword2"],
    "content_plan": ["10 blog posts per month", "Landing pages per use case"],
    "technical_seo": ["Fast loading", "Schema markup", "Sitemap"],
    "estimated_organic_traffic_monthly": 15000
  },
  "existing_competitors": [
    {"name": "Competitor X", "url": "https://example.com", "weakness": "Too expensive", "our_advantage": "Better pricing and UX"}
  ],
  "unique_differentiators": ["differentiator1", "differentiator2"],
  "pros": ["pro1", "pro2"],
  "cons": ["con1", "con2"]
}`

export async function generateSaasIdea(options?: {
  userSkills?: string[]
  userInterests?: string[]
  preferredPlatforms?: string[]
  experienceLevel?: string
  voteFeedback?: { liked_categories: string[]; disliked_categories: string[] }
}): Promise<Record<string, unknown> | null> {
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

  const userMessage = `Generate a completely unique SaaS business idea that doesn't exist yet. Make it innovative and revenue-generating. Include FULL breakdown of monetization, tech stack, team, marketing, and lead generation.${userContext}\n\nRespond with ONLY valid JSON, no markdown, no code blocks.`

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'OpenSaaSIdea',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.9,
        max_tokens: 4000,
      }),
    })

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) return null

    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned)
  } catch (err) {
    console.error('AI generation failed:', err)
    return null
  }
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
    category: idea.category as string,
    platform: idea.platform as string,
    monetization_model: idea.monetization_model as string,
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
    ai_model_used: 'deepseek/deepseek-chat',
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase
    .from('saas_ideas')
    .insert(row as any)
    .select()
    .single()

  if (error) console.error('Save error:', error)
  return { data, error }
}
