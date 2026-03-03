import { motion } from 'framer-motion'
import { Newspaper, Calendar, ArrowRight, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'

const posts = [
  {
    title: 'How We Generate 50+ SaaS Ideas Daily with AI',
    excerpt: 'A deep dive into our AI pipeline that analyzes market trends, Reddit discussions, and competitor data to surface validated SaaS opportunities.',
    date: '2025-02-28',
    readTime: '5 min',
    category: 'Engineering',
  },
  {
    title: 'Introducing the Developer API',
    excerpt: 'Programmatic access to our entire SaaS idea database. Build integrations, dashboards, and tools on top of OpenSaaSIdea.',
    date: '2025-02-25',
    readTime: '3 min',
    category: 'Product',
  },
  {
    title: 'Team Workspaces: Collaborate on Your Next Big Idea',
    excerpt: 'Share ideas with your team, vote on the best ones, and assign them to members. Everything you need to go from idea to execution.',
    date: '2025-02-20',
    readTime: '4 min',
    category: 'Product',
  },
  {
    title: 'From Idea to $10K MRR: A Case Study',
    excerpt: 'How one of our users took an AI-generated SaaS idea from concept to $10K monthly recurring revenue in just 4 months.',
    date: '2025-02-15',
    readTime: '7 min',
    category: 'Case Study',
  },
]

export function BlogPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-brand/10 flex items-center justify-center">
            <Newspaper className="h-6 w-6 text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Blog</h1>
            <p className="text-sm text-text-muted">Updates, guides, and stories from the OpenSaaSIdea team.</p>
          </div>
        </div>
      </motion.div>

      <div className="space-y-4">
        {posts.map((post, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="hover:border-accent/30 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-semibold uppercase text-accent bg-accent/10 rounded-full px-2 py-0.5">{post.category}</span>
                  <span className="text-[11px] text-text-muted flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="text-[11px] text-text-muted flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime}</span>
                </div>
                <h2 className="text-[15px] font-bold text-text-primary mb-1">{post.title}</h2>
                <p className="text-[12px] text-text-muted leading-relaxed">{post.excerpt}</p>
                <p className="text-[12px] text-accent font-medium mt-3 flex items-center gap-1 cursor-pointer hover:underline">
                  Read more <ArrowRight className="h-3 w-3" />
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardContent className="p-6 text-center space-y-2">
          <p className="text-[13px] text-text-muted">More posts coming soon. Stay tuned!</p>
          <p className="text-[11px] text-text-muted">Want to contribute? Email blog@opensaasidea.com</p>
        </CardContent>
      </Card>
    </div>
  )
}
