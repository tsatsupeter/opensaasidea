import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  HelpCircle, Mail, Book, Zap, ChevronDown, ChevronUp,
  Sparkles, Compass, CreditCard, Users, FileText, Bell,
  Shield, Settings, Rocket, UserPlus, BarChart3, Search,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { siteConfig } from '@/lib/site-config'
import { cn } from '@/lib/utils'

interface FaqItem {
  q: string
  a: string
}

interface FaqSection {
  icon: typeof HelpCircle
  title: string
  color: string
  bg: string
  items: FaqItem[]
}

const FAQ_SECTIONS: FaqSection[] = [
  {
    icon: Rocket,
    title: 'Getting Started',
    color: 'text-brand',
    bg: 'bg-brand/10',
    items: [
      { q: 'How do I create an account?', a: 'Click "Get Started" or "Sign Up" on the homepage. You can register with your email or use Google/GitHub sign-in. After signing up, you\'ll go through a quick onboarding to set your skills, interests, and experience level.' },
      { q: 'What is onboarding for?', a: 'Onboarding tells the AI about you — your skills (e.g. React, Python), interests (e.g. FinTech, Health), and experience level. This helps generate ideas tailored specifically to what you can build.' },
      { q: 'Can I change my profile later?', a: 'Yes! Go to your Profile page anytime to update your skills, interests, preferred platforms, and experience level. Your future ideas will reflect those changes.' },
    ],
  },
  {
    icon: Sparkles,
    title: 'Generating Ideas',
    color: 'text-amber',
    bg: 'bg-amber/10',
    items: [
      { q: 'How do I generate an idea?', a: `Go to your Dashboard and click "Generate My Idea". The AI will research real-time market trends, analyze gaps, and create a unique ${siteConfig.ideaLabel} personalized to your profile.` },
      { q: 'How many ideas can I generate per day?', a: 'Free users get 1 idea/day, Pro users get 10/day, and Team members get 30/day. Limits reset at midnight UTC.' },
      { q: 'What happens if I refresh while generating?', a: 'No worries! Generation runs on our servers. Even if you close the tab or refresh, your idea will be saved and waiting for you when you come back. You\'ll also get a notification when it\'s ready.' },
      { q: 'How does personalization work?', a: 'The AI uses your skills, interests, voting history, and preferred platforms to tailor each idea. The more you vote on ideas, the better it learns your preferences.' },
      { q: 'What data sources does the AI use?', a: 'We pull real-time data from SaasyTrends (trending companies), Reddit (community pain points), TrustMRR (verified startup revenue), G2 (market intelligence), and Twitter/X (builder trends) to ensure every idea is market-informed.' },
      { q: 'Are generated ideas private?', a: 'Yes. Your generated ideas are private by default. Only you can see them unless you choose to make them public.' },
    ],
  },
  {
    icon: Compass,
    title: 'Exploring & Discovering',
    color: 'text-accent',
    bg: 'bg-accent/10',
    items: [
      { q: 'What is the Explore page?', a: 'The Explore page shows all publicly shared ideas from the community. You can browse, search, filter by category, and sort by votes, date, or estimated revenue.' },
      { q: 'How do I vote on ideas?', a: 'Click the upvote or downvote arrow on any idea card. Voting helps surface the best ideas and also improves AI personalization for your own generations.' },
      { q: 'Can I bookmark ideas?', a: 'Yes! Click the bookmark icon on any idea card to save it to your collection. View all your saved ideas in the "Saved" tab on your Dashboard.' },
      { q: 'What is the Stats page?', a: 'The Stats page shows analytics like trending categories, most-voted ideas, generation counts, and community activity over time.' },
    ],
  },
  {
    icon: Search,
    title: 'Idea Details',
    color: 'text-emerald',
    bg: 'bg-emerald/10',
    items: [
      { q: 'What\'s included in an idea breakdown?', a: 'Every idea includes: description, revenue estimates (MRR, daily/weekly/monthly sales), pricing tiers, tech stack, team roles, marketing strategy, SEO plan, lead generation funnel, competitor analysis, pros & cons, and unique differentiators.' },
      { q: 'Can I share an idea?', a: 'Click the share button on any idea to copy a link, share to Twitter/X, or make a private idea public so others can see it.' },
      { q: 'Can I export ideas as PDF?', a: 'Pro and Team users can export any idea as a beautifully formatted PDF from the idea detail page. Great for presentations or sharing with co-founders.' },
    ],
  },
  {
    icon: CreditCard,
    title: 'Plans & Billing',
    color: 'text-brand',
    bg: 'bg-brand/10',
    items: [
      { q: 'What plans are available?', a: 'Free: 1 idea/day, public feed access, voting. Pro ($12/mo or $99/yr): 10 ideas/day, PDF export, priority AI, deep dive reports. Team ($29/mo or $249/yr): 30 ideas/day, team workspace, shared ideas, everything in Pro.' },
      { q: 'How do I upgrade?', a: 'Go to the Pricing page and select a plan. You\'ll be taken to a secure checkout. Once payment is confirmed, your account upgrades instantly.' },
      { q: 'Can I cancel anytime?', a: 'Yes. Go to Settings → Manage Subscription. You can cancel anytime and keep access until the end of your current billing period. No questions asked.' },
      { q: 'Do you offer refunds?', a: 'We offer a 7-day money-back guarantee on all paid plans. Contact support within 7 days of purchase if you\'re not satisfied.' },
    ],
  },
  {
    icon: Users,
    title: 'Teams',
    color: 'text-accent',
    bg: 'bg-accent/10',
    items: [
      { q: 'How do I create a team?', a: 'Subscribe to the Team plan, then go to the Team page. You can name your team and start inviting members right away.' },
      { q: 'How do I invite team members?', a: 'On the Team page, go to the Members tab and enter their email address. They\'ll receive a notification to join. They need to have an account on the platform.' },
      { q: 'What can team members do?', a: 'Team members share the team\'s generation pool (30/day total), can view shared team ideas, and collaborate on evaluating and refining ideas together.' },
      { q: 'Can I remove a team member?', a: 'Yes. Team owners can remove members from the Team page at any time.' },
    ],
  },
  {
    icon: Bell,
    title: 'Notifications',
    color: 'text-amber',
    bg: 'bg-amber/10',
    items: [
      { q: 'What notifications will I receive?', a: 'You\'ll get notified when: your generated idea is ready, new daily AI ideas drop (community ideas), someone invites you to a team, or you\'re added/removed from a team.' },
      { q: 'How do I manage notifications?', a: 'Click the bell icon in the top bar to see recent notifications. Click "View All" to see your full notification history where you can mark as read or delete them.' },
    ],
  },
  {
    icon: FileText,
    title: 'Developer API',
    color: 'text-emerald',
    bg: 'bg-emerald/10',
    items: [
      { q: 'How does the API work?', a: `Generate an API key from the Developer API page. You get $5 free credit. Use the REST API to programmatically fetch ideas, generate new ones, or integrate ${siteConfig.name} into your own tools.` },
      { q: 'What endpoints are available?', a: 'GET /ideas (list & search ideas), GET /ideas/:id (single idea details), POST /ideas/generate (generate a new idea). Full docs are on the Developer API page.' },
      { q: 'How much does API usage cost?', a: 'Each API call costs $0.01–$0.02 depending on the endpoint. Generation calls cost more due to AI compute. Check the API page for detailed pricing.' },
    ],
  },
  {
    icon: Shield,
    title: 'Privacy & Security',
    color: 'text-rose',
    bg: 'bg-rose/10',
    items: [
      { q: 'Is my data secure?', a: 'Yes. We use Supabase with row-level security policies. Your private ideas are encrypted and only accessible to you. We never sell your data.' },
      { q: 'What data does the AI see?', a: 'When generating ideas, the AI receives your skills, interests, and voting preferences — never your email, name, or personal details.' },
      { q: 'Can I delete my account?', a: 'Yes. Contact support and we\'ll permanently delete your account and all associated data within 48 hours.' },
    ],
  },
  {
    icon: Settings,
    title: 'Account & Settings',
    color: 'text-text-muted',
    bg: 'bg-surface-2',
    items: [
      { q: 'How do I change my email or password?', a: 'Go to Settings to update your email address or change your password. If you signed up with Google/GitHub, you can add a password from Settings.' },
      { q: 'How do I switch between light and dark mode?', a: 'Click the theme toggle in the sidebar or top navigation. Your preference is saved automatically.' },
      { q: 'What are credits?', a: 'Credits are used for one-time purchases like Deep Dive Reports. You can buy credit packs from the idea detail page. They don\'t expire.' },
    ],
  },
]

const QUICK_LINKS = [
  { icon: Mail, title: 'Email Support', desc: `support@${siteConfig.domain}`, href: `mailto:support@${siteConfig.domain}?subject=Support Request`, external: true, color: 'text-accent', bg: 'bg-accent/10' },
  { icon: Book, title: 'API Documentation', desc: 'REST API reference & guides', href: '/developer/api', external: false, color: 'text-emerald', bg: 'bg-emerald/10' },
  { icon: Zap, title: 'Plans & Pricing', desc: 'Compare features & upgrade', href: '/pricing', external: false, color: 'text-brand', bg: 'bg-brand/10' },
  { icon: BarChart3, title: 'Platform Stats', desc: 'Community analytics', href: '/stats', external: false, color: 'text-amber', bg: 'bg-amber/10' },
]

function AccordionFaq({ section, index }: { section: FaqSection; index: number }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const Icon = section.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
    >
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', section.bg)}>
              <Icon className={cn('h-5 w-5', section.color)} />
            </div>
            <h3 className="text-lg font-bold">{section.title}</h3>
          </div>
          <div className="space-y-1">
            {section.items.map((faq, i) => {
              const isOpen = openIndex === i
              return (
                <div key={i} className="border-b border-border last:border-b-0">
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="w-full flex items-center justify-between py-3 text-left group"
                  >
                    <span className={cn(
                      'text-sm font-medium transition-colors',
                      isOpen ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary'
                    )}>
                      {faq.q}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-text-muted shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-text-muted shrink-0 ml-2" />
                    )}
                  </button>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pb-3"
                    >
                      <p className="text-sm text-text-secondary leading-relaxed pl-0.5">{faq.a}</p>
                    </motion.div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function HelpPage() {
  return (
    <div className="max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="h-7 w-7 text-accent" />
          </div>
          <h1 className="text-3xl font-extrabold">Help Center</h1>
          <p className="text-text-secondary mt-2 max-w-lg mx-auto">
            Everything you need to know about using {siteConfig.name}. Browse topics below or reach out to support.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {QUICK_LINKS.map((link, i) => {
            const Icon = link.icon
            const content = (
              <Card className="hover:border-accent/50 transition-all duration-200 cursor-pointer h-full hover:shadow-md">
                <CardContent className="p-4 text-center space-y-2.5">
                  <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center mx-auto', link.bg)}>
                    <Icon className={cn('h-5 w-5', link.color)} />
                  </div>
                  <p className="text-sm font-semibold">{link.title}</p>
                  <p className="text-xs text-text-muted">{link.desc}</p>
                </CardContent>
              </Card>
            )
            return link.external ? (
              <motion.a
                key={link.title}
                href={link.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                {content}
              </motion.a>
            ) : (
              <motion.div
                key={link.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={link.href}>{content}</Link>
              </motion.div>
            )
          })}
        </div>

        {/* How to Use */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <h2 className="text-lg font-bold mb-4">Quick Start Guide</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: '1', icon: UserPlus, title: 'Sign Up', desc: 'Create a free account and complete onboarding with your skills and interests.' },
              { step: '2', icon: Sparkles, title: 'Generate', desc: 'Hit "Generate My Idea" on the Dashboard. AI crafts a unique idea just for you.' },
              { step: '3', icon: Search, title: 'Explore', desc: 'Browse the public feed, vote on ideas, bookmark your favorites.' },
              { step: '4', icon: Rocket, title: 'Build', desc: 'Pick your best idea and use the detailed breakdown to start building.' },
            ].map((s, i) => {
              const Icon = s.icon
              return (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                >
                  <Card className="h-full">
                    <CardContent className="p-4 text-center">
                      <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-3">
                        <Icon className="h-5 w-5 text-brand" />
                      </div>
                      <div className="text-[10px] font-bold text-brand uppercase tracking-wide mb-1">Step {s.step}</div>
                      <h4 className="text-sm font-semibold mb-1">{s.title}</h4>
                      <p className="text-xs text-text-secondary">{s.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* FAQ Sections */}
        <div className="mb-10">
          <h2 className="text-lg font-bold mb-4">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FAQ_SECTIONS.map((section, i) => (
              <AccordionFaq key={section.title} section={section} index={i} />
            ))}
          </div>
        </div>

        {/* Contact Footer */}
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-sm font-semibold mb-1">Still need help?</h3>
            <p className="text-xs text-text-secondary">
              Reach out to us at{' '}
              <a href={`mailto:support@${siteConfig.domain}?subject=Help Request`} className="text-brand hover:underline">
                support@{siteConfig.domain}
              </a>
              {' '}— we typically respond within 24 hours.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
