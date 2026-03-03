import { motion } from 'framer-motion'
import { HelpCircle, Mail, MessageSquare, Book, Zap, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { siteConfig } from '@/lib/site-config'

export function HelpPage() {
  const faqs = [
    { q: 'How do I generate ideas?', a: 'Go to your Dashboard and click "Generate Ideas". Free users get 3/day, Pro gets 20/day, and Team gets 50/day.' },
    { q: 'What are Deep Dive Reports?', a: 'One-time purchasable detailed reports for any idea with full competitor analysis, marketing strategy, and SEO plan. Available from the idea detail page.' },
    { q: 'How does the API work?', a: 'Generate an API key from the Developer API page. You get $5 free credit. Each API call costs $0.01-$0.02 depending on the endpoint.' },
    { q: 'How do I invite team members?', a: 'On the Team page, go to the Members tab and enter their email. They\'ll need to sign up and their account will be linked to your team.' },
    { q: 'Can I export ideas?', a: 'Pro and Team users can export any idea as a PDF from the idea detail page.' },
    { q: 'How do I cancel my subscription?', a: 'Go to Settings and click "Manage Subscription". You can cancel anytime and keep access until the end of your billing period.' },
  ]

  return (
    <div className="max-w-3xl space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
            <HelpCircle className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Help Center</h1>
            <p className="text-sm text-text-muted">Find answers to common questions.</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a href={`mailto:support@${siteConfig.domain}?subject=Support Request`}>
          <Card className="hover:border-accent/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 text-center space-y-2">
              <Mail className="h-5 w-5 text-accent mx-auto" />
              <p className="text-[13px] font-semibold">Email Support</p>
              <p className="text-[11px] text-text-muted">support@{siteConfig.domain}</p>
            </CardContent>
          </Card>
        </a>
        <Link to="/developer/api">
          <Card className="hover:border-accent/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 text-center space-y-2">
              <Book className="h-5 w-5 text-accent mx-auto" />
              <p className="text-[13px] font-semibold">API Docs</p>
              <p className="text-[11px] text-text-muted">Developer documentation</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/pricing">
          <Card className="hover:border-accent/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 text-center space-y-2">
              <Zap className="h-5 w-5 text-brand mx-auto" />
              <p className="text-[13px] font-semibold">Plans & Pricing</p>
              <p className="text-[11px] text-text-muted">Compare features</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-[16px] font-bold">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="p-3 bg-surface-2 rounded-lg">
                <p className="text-[13px] font-semibold text-text-primary">{faq.q}</p>
                <p className="text-[12px] text-text-muted mt-1">{faq.a}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
