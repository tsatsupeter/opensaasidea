import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Share2, Link2, FileText, Eye, ExternalLink, Check,
  MessageSquareText, Wind, MousePointerClick, Heart, Terminal, FileDown, Loader2
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import type { SaasIdea } from '@/types/database'

interface ShareMenuProps {
  idea?: SaasIdea
  className?: string
  onExportPDF?: () => Promise<void>
  exportingPDF?: boolean
  canExportPDF?: boolean
  shareUrl?: string
  shareTitle?: string
  shareMarkdown?: string
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

function openMarkdownTab(title: string, md: string) {
  // Convert basic markdown to HTML
  const html = md
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/gs, (m) => `<ul>${m}</ul>`)
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^---$/gm, '<hr />')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br />')

  const page = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title} — Markdown</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;
    max-width:720px;margin:0 auto;padding:2rem 1.5rem;background:#0e0e10;color:#e0e0e0;line-height:1.7}
  h1{font-size:1.75rem;margin-bottom:.5rem;color:#fff}
  h2{font-size:1.25rem;margin-top:1.75rem;margin-bottom:.5rem;color:#f97316;border-bottom:1px solid #222;padding-bottom:.35rem}
  h3{font-size:1.05rem;margin-top:1.25rem;margin-bottom:.25rem;color:#ddd}
  p{margin:.75rem 0;color:#bbb}
  blockquote{border-left:3px solid #f97316;padding:.5rem 1rem;margin:1rem 0;background:#1a1a1e;border-radius:0 8px 8px 0;color:#ccc;font-style:italic}
  strong{color:#fff}
  ul{margin:.5rem 0 .5rem 1.5rem}
  li{margin:.25rem 0;color:#bbb}
  a{color:#f97316;text-decoration:none}
  a:hover{text-decoration:underline}
  hr{border:none;border-top:1px solid #333;margin:1.5rem 0}
  .actions{display:flex;gap:.5rem;margin-bottom:1.5rem}
  button{background:#f97316;color:#fff;border:none;padding:.45rem 1rem;border-radius:6px;font-size:.8rem;font-weight:600;cursor:pointer}
  button:hover{background:#ea6c08}
  button.secondary{background:#222;color:#ccc}
  button.secondary:hover{background:#333}
  .badge{display:inline-block;font-size:.65rem;background:#f97316;color:#fff;padding:.15rem .5rem;border-radius:4px;margin-bottom:1rem;font-weight:600;letter-spacing:.03em}
</style>
</head>
<body>
<div class="badge">MARKDOWN EXPORT</div>
<div class="actions">
  <button onclick="copyMd()">Copy Markdown</button>
  <button class="secondary" onclick="copyHtml()">Copy HTML</button>
</div>
<article id="content">${html}</article>
<script>
const rawMd = ${JSON.stringify(md)};
function copyMd(){navigator.clipboard.writeText(rawMd);event.target.textContent='Copied!';setTimeout(()=>event.target.textContent='Copy Markdown',1500)}
function copyHtml(){const h=document.getElementById('content').innerHTML;navigator.clipboard.writeText(h);event.target.textContent='Copied!';setTimeout(()=>event.target.textContent='Copy HTML',1500)}
</script>
</body>
</html>`

  const blob = new Blob([page], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  // Clean up the blob URL after a short delay
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

function buildPrompt(idea: SaasIdea): string {
  const d = idea as any
  return `I want to build this SaaS idea. Help me plan and implement it:\n\nTitle: ${idea.title}\nTagline: ${idea.tagline || ''}\nCategory: ${idea.category || ''}\nDescription: ${idea.description || ''}\nProblem: ${d.problem_statement || ''}\nTarget Audience: ${d.target_audience || ''}\nMonetization: ${idea.monetization_model || ''}\nEstimated MRR: ${idea.estimated_mrr_low ? `$${idea.estimated_mrr_low} - $${idea.estimated_mrr_high}` : 'N/A'}\nTech Stack Suggestion: ${d.tech_stack_suggestion || ''}\nMVP Features: ${d.mvp_features?.join(', ') || ''}\n\nPlease help me create a detailed implementation plan with architecture, tech stack choices, and step-by-step build guide.`
}

export function ShareMenu({ idea, className, onExportPDF, exportingPDF, canExportPDF, shareUrl, shareTitle, shareMarkdown }: ShareMenuProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)

  const ideaUrl = shareUrl || (idea ? `${window.location.origin}/idea/${idea.slug || idea.id}` : '')
  const title = shareTitle || idea?.title || 'Untitled'
  const markdown = shareMarkdown || (idea ? ideaToMarkdown(idea, ideaUrl) : '')
  const prompt = idea ? buildPrompt(idea) : markdown
  const encodedPrompt = encodeURIComponent(prompt)

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const menuWidth = 224 // w-56 = 14rem = 224px
    const menuHeight = 380 // approximate max height
    const viewportH = window.innerHeight
    const viewportW = window.innerWidth

    // Prefer opening upward; if not enough space, open downward
    let top = rect.top - menuHeight - 8
    if (top < 8) top = rect.bottom + 8

    // Align right edge to button right; clamp to viewport
    let left = rect.right - menuWidth
    if (left < 8) left = 8
    if (left + menuWidth > viewportW - 8) left = viewportW - menuWidth - 8

    setMenuPos({ top, left })
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    const handleScroll = () => { if (open) setOpen(false) }
    if (open) {
      document.addEventListener('mousedown', handleClick)
      window.addEventListener('scroll', handleScroll, true)
      updatePosition()
    }
    return () => {
      document.removeEventListener('mousedown', handleClick)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [open, updatePosition])

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    toast(`${label} copied to clipboard`)
    setTimeout(() => setCopied(null), 2000)
  }

  const items = [
    { id: 'link', label: 'Copy Link', icon: Link2, action: () => copyText(ideaUrl, 'Link') },
    { id: 'markdown', label: 'Copy Markdown', icon: FileText, action: () => copyText(markdown, 'Markdown') },
    { id: 'view-md', label: 'View in Markdown', icon: Eye, action: () => openMarkdownTab(title, markdown) },
    ...(onExportPDF ? [{ id: 'pdf', label: canExportPDF === false ? 'Export PDF (Pro)' : 'Export PDF', icon: FileDown, action: onExportPDF, disabled: exportingPDF || canExportPDF === false, loading: exportingPDF }] : []),
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
    <div className={cn('relative', className)}>
      <button
        ref={buttonRef}
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-text-muted hover:bg-surface-2 transition-colors cursor-pointer"
      >
        <Share2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Share</span>
      </button>

      {open && menuPos && createPortal(
        <AnimatePresence>
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{ position: 'fixed', top: menuPos.top, left: menuPos.left }}
            className="z-[999] w-56 rounded-xl border border-border bg-surface-1 shadow-xl overflow-hidden"
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

                const isDisabled = 'disabled' in item && item.disabled
                const isLoading = 'loading' in item && item.loading

                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    disabled={!!isDisabled}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors cursor-pointer",
                      isDisabled
                        ? 'text-text-muted/50 cursor-not-allowed'
                        : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                    )}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Icon className="h-4 w-4 shrink-0" />}
                    <span className="flex-1 text-left">{item.label}</span>
                    {isCopied && <Check className="h-3.5 w-3.5 text-emerald" />}
                  </button>
                )
              })}
            </div>

          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
