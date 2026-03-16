import { marked } from 'marked'
import DOMPurify from 'dompurify'

// Configure marked for clean output
marked.setOptions({
  gfm: true,
  breaks: true,
})

/**
 * Render markdown to sanitized HTML.
 * Handles tables, code blocks, headings, lists, links, etc.
 */
export function renderMarkdown(md: string): string {
  const raw = marked.parse(md, { async: false }) as string
  return DOMPurify.sanitize(raw, {
    ADD_ATTR: ['target', 'rel'],
  })
}
