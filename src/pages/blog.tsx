import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Newspaper, Calendar, ArrowRight, Clock, Tag, ChevronDown,
  Lightbulb, Code2, TrendingUp, Users, Rocket, Shield, Zap, Globe,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { siteConfig } from '@/lib/site-config'
import { SEO } from '@/components/seo'
import { cn } from '@/lib/utils'

interface BlogPost {
  slug: string
  title: string
  excerpt: string
  content: string[]
  date: string
  readTime: string
  category: string
  categoryColor: string
  icon: typeof Newspaper
}

const CATEGORIES = ['All', 'Guide', 'Product', 'Engineering', 'Case Study', 'Tips']

const POSTS: BlogPost[] = [
  {
    slug: 'how-ai-generates-ideas',
    icon: Lightbulb,
    title: `How ${siteConfig.name} Generates 50+ Ideas Daily with AI`,
    excerpt: `A behind-the-scenes look at the AI pipeline that powers ${siteConfig.name} — from real-time market data to fully validated business ideas.`,
    content: [
      `Every day, ${siteConfig.name} generates over 50 unique ${siteConfig.mode === 'full' ? 'project' : 'SaaS'} ideas using a multi-stage AI pipeline. But how does it actually work? Let's walk through the process from start to finish.`,
      `**Stage 1: Market Data Collection** — We pull real-time data from multiple sources including SaasyTrends (trending companies and growth data), Reddit (community pain points and feature requests from subreddits like r/SaaS, r/startups, r/Entrepreneur), TrustMRR (verified startup revenue data), G2 (market intelligence and category trends), and Twitter/X (builder conversations and emerging trends). This gives us a comprehensive picture of what the market actually needs right now.`,
      `**Stage 2: Gap Analysis** — Our system identifies patterns: what problems are people complaining about? What categories are underserved? Where are existing solutions falling short? This analysis narrows down thousands of data points into actionable opportunity areas.`,
      `**Stage 3: AI Generation** — We feed the market context into advanced language models via OpenRouter. The AI doesn't just generate a name and description — it produces a complete breakdown: revenue estimates (daily, weekly, monthly, yearly), pricing tiers, tech stack recommendations, team roles, marketing strategy, SEO keywords, lead generation funnels, competitor analysis, and unique differentiators.`,
      `**Stage 4: Deduplication & Quality** — Every generated idea is checked against our existing database to ensure uniqueness. We normalize titles, compare core concepts, and filter out anything too similar to what already exists. Only truly novel ideas make it through.`,
      `**Stage 5: Personalization** — When you generate an idea from your Dashboard, the AI also factors in your skills (e.g. React, Python, Machine Learning), interests (e.g. FinTech, Health, Education), experience level, and voting history. This means the ideas you see are tailored to what you can actually build.`,
      `The result? Fresh, market-validated ideas every single day — each one a potential business waiting to be built.`,
    ],
    date: '2026-03-01',
    readTime: '6 min',
    category: 'Engineering',
    categoryColor: 'text-emerald bg-emerald/10',
  },
  {
    slug: 'getting-started-guide',
    icon: Rocket,
    title: `Getting Started with ${siteConfig.name}: From Sign-Up to Your First Idea`,
    excerpt: 'A step-by-step guide to creating your account, setting up your profile, and generating your first AI-powered business idea in under 5 minutes.',
    content: [
      `Welcome to ${siteConfig.name}! Whether you're a developer looking for your next project, a founder seeking a validated concept, or just exploring — here's how to get the most out of the platform.`,
      `**Step 1: Create Your Account** — Sign up using your email, Google, or GitHub. It takes about 30 seconds. You'll start on our free tier which gives you 1 idea generation per day, access to the public feed, and voting.`,
      `**Step 2: Complete Onboarding** — This is the most important step. Tell us your skills (frameworks, languages, tools you know), your interests (industries and domains you care about), your preferred platforms (web, mobile, desktop, API), and your experience level. The AI uses all of this to personalize your ideas — the more detail you provide, the better the results.`,
      `**Step 3: Generate Your First Idea** — Head to your Dashboard and click "Generate My Idea". The AI will spend about 30 seconds researching market trends, analyzing gaps, and crafting a unique idea tailored to your profile. You'll see a full breakdown including revenue estimates, tech stack, marketing strategy, and more.`,
      `**Step 4: Explore the Feed** — Browse publicly shared ideas from the community on the Explore page. Upvote ideas you like, bookmark ones you want to revisit later, and use filters to find ideas in specific categories or revenue ranges.`,
      `**Step 5: Go Deeper** — For any idea that excites you, you can export it as a PDF (Pro/Team), purchase a Deep Dive Report for a full business plan, or share it with your team for collaborative evaluation.`,
      `**Pro Tip:** The more you vote on ideas (upvote or downvote), the better the AI understands your preferences. After a few days of voting, your personalized generations will be noticeably more aligned with what you're looking for.`,
    ],
    date: '2026-02-25',
    readTime: '5 min',
    category: 'Guide',
    categoryColor: 'text-brand bg-brand/10',
  },
  {
    slug: 'understanding-idea-breakdowns',
    icon: TrendingUp,
    title: 'Understanding Your Idea Breakdown: What Every Section Means',
    excerpt: 'Each generated idea comes with 15+ sections of analysis. Here\'s what they all mean and how to use them to evaluate whether an idea is worth building.',
    content: [
      `When ${siteConfig.name} generates an idea, it doesn't just give you a title and a paragraph. You get a comprehensive breakdown designed to help you evaluate and execute. Here's what each section means:`,
      `**Revenue Estimates** — Projected daily, weekly, monthly, and yearly revenue based on the pricing model, target market size, and comparable products. These are estimates, not guarantees — use them as a benchmark for your own financial modeling.`,
      `**Pricing Tiers** — Suggested pricing plans (typically Free, Pro, Enterprise or similar) with recommended price points and feature sets. Based on what competitors in the same space charge.`,
      `**Tech Stack** — Recommended technologies for building the product, tailored to your skills when personalized. Includes frontend, backend, database, hosting, and third-party services.`,
      `**Team & Roles** — The key roles needed to build and launch (e.g. Full-Stack Developer, Designer, Marketing). Useful for solo founders figuring out what to outsource, or teams deciding how to allocate resources.`,
      `**Marketing Strategy** — Specific channels and tactics to acquire your first customers. Includes content marketing, SEO, social media, partnerships, and paid acquisition suggestions.`,
      `**SEO Keywords** — High-value keywords to target for organic search. Great for planning your content strategy and landing pages from day one.`,
      `**Lead Generation Funnel** — A suggested path from visitor to paying customer, including lead magnets, email sequences, and conversion optimization tips.`,
      `**Competitor Analysis** — Known competitors in the space, their strengths and weaknesses, and how your idea differentiates. This is one of the most valuable sections for validating whether there's room in the market.`,
      `**Pros & Cons** — An honest assessment of the idea's strengths and potential challenges. No idea is perfect — understanding the risks upfront helps you plan accordingly.`,
      `**Unique Differentiators** — What makes this idea stand out from existing solutions. The specific angles and features that give you a competitive edge.`,
    ],
    date: '2026-02-20',
    readTime: '7 min',
    category: 'Guide',
    categoryColor: 'text-brand bg-brand/10',
  },
  {
    slug: 'developer-api-launch',
    icon: Code2,
    title: 'Introducing the Developer API: Build on Top of Our Idea Engine',
    excerpt: 'Programmatic access to our entire idea database. Fetch ideas, generate new ones, and integrate into your own tools — starting with $5 free credit.',
    content: [
      `We're excited to announce the ${siteConfig.name} Developer API — giving you programmatic access to our AI-powered idea generation engine and the full idea database.`,
      `**What Can You Build?** — The possibilities are broad: a Slack bot that suggests daily ideas to your team, a dashboard that tracks trending categories over time, a newsletter tool that curates the best ideas weekly, or a browser extension that surfaces relevant ideas while you browse.`,
      `**Available Endpoints:** \n- \`GET /ideas\` — Search and list ideas with filters for category, revenue range, date, and more.\n- \`GET /ideas/:id\` — Fetch the full breakdown for a single idea.\n- \`POST /ideas/generate\` — Generate a brand-new AI idea on demand with optional personalization parameters.`,
      `**Pricing** — Every new API key comes with $5 of free credit. After that, calls are billed at $0.01 per read request and $0.02 per generation request. Simple, transparent, no hidden fees.`,
      `**Getting Started** — Go to the Developer API page in your dashboard, generate an API key, and you're ready to make your first call. Full documentation, code examples, and rate limits are all on that page.`,
      `**Rate Limits** — Free tier: 100 calls/day. Pro: 1,000 calls/day. Team: 5,000 calls/day. Need more? Contact support for enterprise pricing.`,
      `We can't wait to see what you build with it.`,
    ],
    date: '2026-02-15',
    readTime: '4 min',
    category: 'Product',
    categoryColor: 'text-accent bg-accent/10',
  },
  {
    slug: 'team-workspaces',
    icon: Users,
    title: 'Team Workspaces: Collaborate on Your Next Big Idea',
    excerpt: 'Share ideas with your team, vote on the best ones, and work together from concept to execution — all inside one workspace.',
    content: [
      `Building a startup is rarely a solo effort. That's why we built Team Workspaces — a collaborative environment where you and your co-founders can evaluate, discuss, and prioritize ideas together.`,
      `**How It Works** — Subscribe to the Team plan ($29/mo), create your team, and invite members by email. Everyone on the team shares a pool of 30 idea generations per day. Generated ideas can be shared to the team workspace where all members can view them.`,
      `**Collaborative Evaluation** — Team members can vote on shared ideas, helping you quickly identify which concepts have the most internal buy-in. No more endless Slack threads debating which idea to pursue.`,
      `**Shared Dashboard** — See all team-generated ideas in one place, filtered and sorted by date, votes, or category. Know exactly what your team is exploring.`,
      `**Use Cases** — Startup accelerators using it for brainstorming sessions, agencies generating concept ideas for clients, university teams exploring capstone projects, and remote teams running async ideation sprints.`,
      `**Getting Started** — Upgrade to the Team plan, go to the Team page, name your workspace, and start inviting members. It takes about 2 minutes to get fully set up.`,
    ],
    date: '2026-02-10',
    readTime: '4 min',
    category: 'Product',
    categoryColor: 'text-accent bg-accent/10',
  },
  {
    slug: 'two-platforms',
    icon: Globe,
    title: 'OpenSaaSIdea vs OpenProjectIdea: Which Platform Is Right for You?',
    excerpt: 'We run two versions of our platform — one focused on SaaS, one covering every industry. Here\'s how to pick the right one (hint: your data syncs across both).',
    content: [
      `One of the most common questions we get: "What's the difference between OpenSaaSIdea and OpenProjectIdea?" Great question — let's break it down.`,
      `**OpenSaaSIdea (opensaasidea.com)** — The focused, SaaS-only edition. Every idea generated here is a software-as-a-service product: web apps, APIs, mobile apps, browser extensions, desktop tools, and developer platforms. If you're a developer or technical founder looking specifically for your next software product, this is your lane.`,
      `**OpenProjectIdea (openprojectidea.com)** — The full, broad edition. This generates ideas across every industry — SaaS (yes, it includes SaaS too), local businesses, hardware, science, manufacturing, biotech, e-commerce, real estate, food & beverage, education, and more. Example ideas: a unique laptop case line for remote workers, an urban vertical farming kit, a niche repair service for vintage electronics, a subscription coffee roasting service.`,
      `**What Syncs?** — Everything. Both sites share the same Supabase backend. Your account, subscription plan, generated ideas, bookmarks, votes, notifications, team data, and API keys all sync automatically. Log in with the same credentials on either site and everything is there.`,
      `**When to Switch** — Use OpenSaaSIdea when you want focused software inspiration. Switch to OpenProjectIdea when you want to explore broader opportunities or diversify beyond tech. Many of our users check both daily.`,
      `**Same Plans, Same Pricing** — Free, Pro, and Team plans are identical on both platforms. An upgrade on one applies to both.`,
    ],
    date: '2026-02-05',
    readTime: '4 min',
    category: 'Guide',
    categoryColor: 'text-brand bg-brand/10',
  },
  {
    slug: 'validate-before-building',
    icon: Shield,
    title: '5 Ways to Validate an AI-Generated Idea Before You Build',
    excerpt: 'An AI idea is a starting point, not a business plan. Here are 5 practical steps to validate whether an idea is worth your time and energy.',
    content: [
      `${siteConfig.name} gives you detailed, market-informed ideas — but every idea still needs real-world validation before you commit to building. Here are 5 steps we recommend:`,
      `**1. Search for Existing Solutions** — Google the problem your idea solves. Check Product Hunt, G2, Capterra, and Reddit. If there are zero competitors, that could mean there's no market (be cautious). If there are a few competitors, that's actually a good sign — it means the market is validated and there's room for a better solution.`,
      `**2. Talk to 5 Potential Customers** — This is the single most valuable thing you can do. Find people who match your target audience (the idea breakdown tells you who they are) and ask them: "Do you have this problem? How do you currently solve it? Would you pay for a better solution?" Five conversations will tell you more than any amount of desk research.`,
      `**3. Check the Revenue Estimates** — Our AI provides daily/weekly/monthly/yearly revenue projections. Cross-reference these with real data: What do similar products charge? How large is the addressable market? Are the assumptions reasonable? Adjust the numbers based on your own research.`,
      `**4. Build a Landing Page First** — Before writing a single line of code, create a simple landing page describing the product and put a "Join Waitlist" button on it. Share it in relevant communities. If people sign up, you have demand signal. If crickets, reconsider.`,
      `**5. Prototype the Core Feature** — Don't build the whole thing. Pick the one feature that solves the core problem and build a minimal version. Ship it to your waitlist in 2-4 weeks. Get feedback. Iterate. Only then should you think about the full product.`,
      `AI-generated ideas are meant to accelerate your research, not replace it. Use them as a launchpad, then validate with real humans and real data.`,
    ],
    date: '2026-01-28',
    readTime: '6 min',
    category: 'Tips',
    categoryColor: 'text-amber bg-amber/10',
  },
  {
    slug: 'maximize-free-tier',
    icon: Zap,
    title: 'How to Get the Most Out of the Free Tier',
    excerpt: 'Even with 1 idea per day, free users can build a powerful pipeline of validated business concepts. Here\'s how to maximize your free account.',
    content: [
      `The free tier gives you 1 personalized idea per day, access to the full public feed, voting, bookmarking, and commenting. That might sound limited, but here's how to make it incredibly productive:`,
      `**Complete Your Profile Thoroughly** — The #1 factor in idea quality is your profile. Add every relevant skill, interest, and platform preference. The more the AI knows about you, the better your daily idea will be. Update your profile as your skills and interests evolve.`,
      `**Vote on Everything** — Every upvote and downvote trains the AI on your preferences. Spend 5 minutes each day voting on ideas in the Explore feed. After a week of consistent voting, your generated ideas will be noticeably more aligned with what you're looking for.`,
      `**Bookmark Strategically** — Think of bookmarks as your idea pipeline. Over a month of daily generation, you'll have 30 ideas. Bookmark the top 5-10 that excite you most. Review your bookmarks weekly and evaluate which ones are worth pursuing.`,
      `**Use the Explore Feed** — Your 1 daily generation isn't your only source. The public feed has hundreds of community-shared ideas. Use filters and sorting (category, votes, revenue) to find gems. Some of the best ideas come from the community, not your own generations.`,
      `**Time It Right** — Generate your daily idea at the start of your day when you have energy to evaluate it properly. Read the full breakdown, check the competitors, and decide immediately: bookmark it or move on.`,
      `**When to Upgrade** — If you find yourself consistently wanting more than 1 idea/day, or you want PDF exports and Deep Dive Reports, the Pro plan at $12/month is a great next step. But many users build successful businesses starting from the free tier alone.`,
    ],
    date: '2026-01-20',
    readTime: '5 min',
    category: 'Tips',
    categoryColor: 'text-amber bg-amber/10',
  },
]

function BlogPostCard({ post, index, onSelect }: { post: BlogPost; index: number; onSelect: () => void }) {
  const Icon = post.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="hover:border-accent/30 transition-all duration-200 cursor-pointer hover:shadow-md" onClick={onSelect}>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-surface-2 flex items-center justify-center shrink-0 mt-0.5">
              <Icon className="h-5 w-5 text-text-muted" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={cn('text-[10px] font-semibold uppercase rounded-full px-2 py-0.5', post.categoryColor)}>{post.category}</span>
                <span className="text-[11px] text-text-muted flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span className="text-[11px] text-text-muted flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime}</span>
              </div>
              <h2 className="text-[15px] font-bold text-text-primary mb-1 leading-snug">{post.title}</h2>
              <p className="text-[12px] text-text-secondary leading-relaxed">{post.excerpt}</p>
              <p className="text-[12px] text-accent font-medium mt-3 flex items-center gap-1 hover:underline">
                Read article <ArrowRight className="h-3 w-3" />
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function BlogPostDetail({ post, onBack }: { post: BlogPost; onBack: () => void }) {
  const Icon = post.icon
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <button onClick={onBack} className="text-[13px] text-text-muted hover:text-text-primary mb-6 flex items-center gap-1">
        <ArrowRight className="h-3.5 w-3.5 rotate-180" /> Back to all posts
      </button>
      <Card>
        <CardContent className="p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className={cn('text-[10px] font-semibold uppercase rounded-full px-2 py-0.5', post.categoryColor)}>{post.category}</span>
            <span className="text-[11px] text-text-muted flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <span className="text-[11px] text-text-muted flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime} read</span>
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-11 w-11 rounded-xl bg-brand/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-brand" />
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold leading-tight">{post.title}</h1>
          </div>
          <div className="space-y-4">
            {post.content.map((paragraph, i) => (
              <p key={i} className="text-sm text-text-secondary leading-relaxed [&_strong]:text-text-primary [&_strong]:font-semibold" dangerouslySetInnerHTML={{
                __html: paragraph
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/`(.*?)`/g, '<code class="text-xs bg-surface-2 px-1.5 py-0.5 rounded font-mono">$1</code>')
                  .replace(/\n/g, '<br />')
              }} />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function BlogPage() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('All')

  const selectedPost = POSTS.find(p => p.slug === selectedSlug)
  const filteredPosts = activeCategory === 'All' ? POSTS : POSTS.filter(p => p.category === activeCategory)

  if (selectedPost) {
    return (
      <div className="w-full max-w-4xl">
        <BlogPostDetail post={selectedPost} onBack={() => setSelectedSlug(null)} />
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl">
      <SEO
        title="Blog — SaaS Ideas, AI, and Startup Insights"
        description="Read articles about AI-powered idea generation, SaaS business strategies, startup validation, market analysis, and building profitable software products."
        url="/blog"
        keywords="SaaS blog, startup blog, AI idea generation, business ideas blog, indie hacker blog, micro-SaaS insights"
      />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="h-14 w-14 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
            <Newspaper className="h-7 w-7 text-brand" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Blog</h1>
          <p className="text-text-secondary mt-2 max-w-lg mx-auto">
            Guides, product updates, and tips from the {siteConfig.name} team to help you find and validate your next big idea.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'text-[12px] font-medium px-3 py-1.5 rounded-full transition-colors',
                activeCategory === cat
                  ? 'bg-brand text-white'
                  : 'bg-surface-2 text-text-secondary hover:text-text-primary hover:bg-surface-2/80'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured Post */}
        {activeCategory === 'All' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-brand/30 hover:border-brand/50 transition-all duration-200 cursor-pointer hover:shadow-lg" onClick={() => setSelectedSlug(POSTS[0].slug)}>
              <CardContent className="p-6 md:p-8">
                <Badge variant="default" className="bg-brand text-white text-[10px] px-2 mb-3">Featured</Badge>
                <h2 className="text-lg md:text-xl font-extrabold text-text-primary mb-2 leading-snug">{POSTS[0].title}</h2>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">{POSTS[0].excerpt}</p>
                <div className="flex items-center gap-3">
                  <span className={cn('text-[10px] font-semibold uppercase rounded-full px-2 py-0.5', POSTS[0].categoryColor)}>{POSTS[0].category}</span>
                  <span className="text-[11px] text-text-muted flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(POSTS[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="text-[11px] text-text-muted flex items-center gap-1"><Clock className="h-3 w-3" />{POSTS[0].readTime}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Post Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {(activeCategory === 'All' ? filteredPosts.slice(1) : filteredPosts).map((post, i) => (
            <BlogPostCard key={post.slug} post={post} index={i} onSelect={() => setSelectedSlug(post.slug)} />
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-sm text-text-muted">No posts in this category yet. Check back soon!</p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-sm font-semibold mb-1">Want to share your story?</h3>
            <p className="text-xs text-text-secondary">
              Built something using a {siteConfig.name} idea? We'd love to feature you.{' '}
              <a href={`mailto:support@${siteConfig.domain}?subject=Blog Contribution`} className="text-brand hover:underline">
                Reach out to us
              </a>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
