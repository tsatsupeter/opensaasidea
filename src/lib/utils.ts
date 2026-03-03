import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

// Strip HTML tags and script content from user input
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
}

// Sanitize search queries to prevent PostgREST filter injection
// Strips characters that could manipulate filter syntax: , ( ) .eq .neq etc.
export function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/[(),]/g, '')
    .replace(/\.(eq|neq|gt|gte|lt|lte|like|ilike|is|in|cs|cd|sl|sr|nxl|nxr|adj|ov|fts|plfts|phfts|wfts|not|or|and)\./gi, ' ')
    .trim()
    .slice(0, 100)
}

export function timeAgo(date: string): string {
  const now = new Date()
  const past = new Date(date)
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
