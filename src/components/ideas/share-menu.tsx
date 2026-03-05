import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Share2, Link2, FileText, Eye, ExternalLink, Check,
  MessageSquareText, Wind, MousePointerClick, Heart, Terminal
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import type { SaasIdea } from '@/types/database'

interface ShareMenuProps {
  idea: SaasIdea
  className?: string
}

function ideaToMarkdown(idea: SaasIdea, url: string): string {
  const d = idea as any
  const lines: string[] = []
  lines.push(`# ${idea.title}`)
  if (idea.tagline) lines.push(`\n> ${idea.tagline}`)
  lines.push(`\n**Category:** ${idea.category || 'Other'}`)
  if (idea.monetization_model) lines.push(`**Monetization:** ${idea.monetization_model.replace('_', ' ')}`)
  if (idea.estimated_mrr_low && idea.estimated_mrr_high) {
    lines.push(`**Estimated MRR:** $${idea.estimated_mrr_low.toLocaleString()} - $${idea.estimated_mrr_high.toLocaleString()}`)
  }
  if (idea.description) lines.push(`\n## Description\n\n${idea.description}`)
  if (d.problem_statement) lines.push(`\n## Problem\n\n${d.problem_statement}`)
  if (d.target_audience) lines.push(`\n## Target Audience\n\n${d.target_audience}`)
  if (d.unique_value_proposition) lines.push(`\n## Unique Value Proposition\n\n${d.unique_value_proposition}`)
  if (d.tech_stack_suggestion) lines.push(`\n## Suggested Tech Stack\n\n${d.tech_stack_suggestion}`)
  if (d.mvp_features && d.mvp_features.length > 0) {
    lines.push(`\n## MVP Features\n`)
    d.mvp_features.forEach((f: string) => lines.push(`- ${f}`))
  }
  lines.push(`\n---\n[View full idea](${url})`)
  return lines.join('\n')
}

function buildPrompt(idea: SaasIdea): string {
  const d = idea as any
  return `I want to build this SaaS idea. Help me plan and implement it:\n\nTitle: ${idea.title}\nTagline: ${idea.tagline || ''}\nCategory: ${idea.category || ''}\nDescription: ${idea.description || ''}\nProblem: ${d.problem_statement || ''}\nTarget Audience: ${d.target_audience || ''}\nMonetization: ${idea.monetization_model || ''}\nEstimated MRR: ${idea.estimated_mrr_low ? `$${idea.estimated_mrr_low} - $${idea.estimated_mrr_high}` : 'N/A'}\nTech Stack Suggestion: ${d.tech_stack_suggestion || ''}\nMVP Features: ${d.mvp_features?.join(', ') || ''}\n\nPlease help me create a detailed implementation plan with architecture, tech stack choices, and step-by-step build guide.`
}

export function ShareMenu({ idea, className }: ShareMenuProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [showMarkdown, setShowMarkdown] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const ideaUrl = `${window.location.origin}/idea/${idea.slug || idea.id}`
  const markdown = ideaToMarkdown(idea, ideaUrl)
  const prompt = buildPrompt(idea)
  const encodedPrompt = encodeURIComponent(prompt)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
        setShowMarkdown(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    toast(`${label} copied to clipboard`)
    setTimeout(() => setCopied(null), 2000)
  }

  const items = [
    { id: 'link', label: 'Copy Link', icon: Link2, action: () => copyText(ideaUrl, 'Link') },
    { id: 'markdown', label: 'Copy Markdown', icon: FileText, action: () => copyText(markdown, 'Markdown') },
    { id: 'view-md', label: 'View in Markdown', icon: Eye, action: () => setShowMarkdown(!showMarkdown) },
    { divider: true },
    { id: 'chatgpt', label: 'Open in ChatGPT', icon: MessageSquareText, href: `https://chatgpt.com/?q=${encodedPrompt}` },
    { id: 'claude', label: 'Open in Claude', icon: ExternalLink, href: `https://claude.ai/new?q=${encodedPrompt}` },
    { divider: true },
    { id: 'windsurf', label: 'Open in Windsurf', icon: Wind, action: () => { copyText(prompt, 'Prompt'); toast('Prompt copied! Paste it into Windsurf.') } },
    { id: 'cursor', label: 'Open in Cursor', icon: MousePointerClick, action: () => { copyText(prompt, 'Prompt'); toast('Prompt copied! Paste it into Cursor.') } },
    { id: 'lovable', label: 'Open in Lovable', icon: Heart, href: `https://lovable.dev/projects/create?prompt=${encodedPrompt}` },
    { id: 'replit', label: 'Open in Replit', icon: Terminal, href: `https://replit.com/new?tab=ai&prompt=${encodedPrompt}` },
  ]

  return (
    <div ref={menuRef} className={cn('relative', className)}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); setShowMarkdown(false) }}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-text-muted hover:bg-surface-2 transition-colors cursor-pointer"
      >
        <Share2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Share</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 right-0 z-50 w-56 rounded-xl border border-border bg-surface-1 shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="py-1">
              <div className="px-3 py-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Share & Export</p>
              </div>
              {items.map((item, i) => {
                if ('divider' in item) {
                  return <div key={`d-${i}`} className="mx-2 my-1 h-px bg-border" />
                }
                const Icon = item.icon!
                const isCopied = copied === item.label?.replace('Copy ', '')

                if (item.href) {
                  return (
                    <a
                      key={item.id}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      <ExternalLink className="h-3 w-3 text-text-muted" />
                    </a>
                  )
                }

                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors cursor-pointer"
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isCopied && <Check className="h-3.5 w-3.5 text-emerald" />}
                  </button>
                )
              })}
            </div>

            {/* Markdown preview */}
            <AnimatePresence>
              {showMarkdown && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden border-t border-border"
                >
                  <div className="p-3 max-h-60 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Markdown Preview</p>
                      <button
                        onClick={() => copyText(markdown, 'Markdown')}
                        className="text-[11px] text-accent hover:underline cursor-pointer"
                      >
                        {copied === 'Markdown' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <pre className="text-[11px] text-text-secondary whitespace-pre-wrap break-words font-mono bg-surface-2 rounded-lg p-2.5 leading-relaxed">
                      {markdown}
                    </pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
