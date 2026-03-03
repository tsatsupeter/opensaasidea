import { motion } from 'framer-motion'
import { Megaphone, Mail, BarChart3, Users, Zap, Globe } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { siteConfig } from '@/lib/site-config'

export function AdvertisePage() {
  return (
    <div className="max-w-3xl space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-brand/10 flex items-center justify-center">
            <Megaphone className="h-6 w-6 text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Advertise on {siteConfig.name}</h1>
            <p className="text-sm text-text-muted">Reach thousands of founders, developers, and entrepreneurs.</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Users, label: 'Active Users', value: '10K+', desc: 'Monthly active developers' },
          { icon: Globe, label: 'Page Views', value: '50K+', desc: 'Monthly page views' },
          { icon: BarChart3, label: 'Engagement', value: '4.2min', desc: 'Avg. session duration' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center space-y-1">
              <stat.icon className="h-5 w-5 text-accent mx-auto" />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-[11px] text-text-muted">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-[16px] font-bold">Advertising Options</h2>
          <div className="space-y-3">
            {[
              { title: 'Sponsored Idea Placement', desc: 'Feature your product as a sponsored idea in the explore feed.', price: 'From $99/week' },
              { title: 'Banner Ads', desc: 'Display banner ads on high-traffic pages like Explore and Trending.', price: 'From $49/week' },
              { title: 'Newsletter Sponsorship', desc: 'Reach our email subscribers with a dedicated sponsor slot.', price: 'From $199/issue' },
              { title: 'Custom Partnership', desc: 'Co-branded content, API integrations, and more.', price: 'Contact us' },
            ].map(opt => (
              <div key={opt.title} className="flex items-start gap-3 p-3 bg-surface-2 rounded-lg">
                <Zap className="h-4 w-4 text-brand mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-[13px] font-semibold">{opt.title}</p>
                  <p className="text-[11px] text-text-muted">{opt.desc}</p>
                </div>
                <span className="text-[12px] font-medium text-brand shrink-0">{opt.price}</span>
              </div>
            ))}
          </div>
          <a href={`mailto:ads@${siteConfig.domain}?subject=Advertising Inquiry`}>
            <Button className="w-full mt-2"><Mail className="h-4 w-4 mr-1.5" /> Contact Us - ads@{siteConfig.domain}</Button>
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
