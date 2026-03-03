import { motion } from 'framer-motion'
import { Info, Lightbulb, Target, Heart, Code2, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { siteConfig } from '@/lib/site-config'

export function AboutPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
            <Info className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">About {siteConfig.name}</h1>
            <p className="text-sm text-text-muted">{siteConfig.tagline}</p>
          </div>
        </div>
      </motion.div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-[16px] font-bold">Our Mission</h2>
          <p className="text-[13px] text-text-secondary leading-relaxed">
            {siteConfig.name} helps developers, entrepreneurs, and teams discover validated ideas backed by real market data.
            We use AI to analyze trends, competition, and revenue potential — so you can focus on building, not brainstorming.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Lightbulb, title: 'AI-Powered Ideas', desc: 'Fresh ideas generated daily with revenue estimates and execution plans.' },
          { icon: Target, title: 'Market Validated', desc: 'Each idea includes competitor analysis, target audience, and realistic MRR projections.' },
          { icon: Code2, title: 'Developer First', desc: 'Built for developers with full API access, detailed tech stacks, and implementation guides.' },
        ].map(item => (
          <Card key={item.title}>
            <CardContent className="p-4 space-y-2">
              <item.icon className="h-5 w-5 text-accent" />
              <h3 className="text-[13px] font-bold">{item.title}</h3>
              <p className="text-[11px] text-text-muted">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-[16px] font-bold flex items-center gap-2"><Zap className="h-4 w-4 text-brand" /> What We Offer</h2>
          <div className="space-y-3 text-[13px] text-text-secondary">
            <p><strong className="text-text-primary">Free Tier:</strong> 3 ideas per day, explore the public feed, vote and comment on ideas.</p>
            <p><strong className="text-text-primary">Pro ($15/mo):</strong> 20 ideas per day, detailed reports, PDF exports, competitor analysis, and marketing strategies.</p>
            <p><strong className="text-text-primary">Team ($45/mo):</strong> Everything in Pro plus shared workspace, team voting, custom categories, API access, and priority support.</p>
            <p><strong className="text-text-primary">Developer API:</strong> Programmatic access to ideas with pay-per-use credits. $5 free to start.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 text-center space-y-2">
          <Heart className="h-6 w-6 text-rose mx-auto" />
          <p className="text-[13px] text-text-secondary">
            Built with <span className="text-rose">♥</span> using React, Supabase, and AI.
          </p>
          <p className="text-[11px] text-text-muted">Questions? Email us at hello@{siteConfig.domain}</p>
        </CardContent>
      </Card>
    </div>
  )
}
