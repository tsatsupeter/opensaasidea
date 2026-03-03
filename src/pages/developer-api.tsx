import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Code2, Key, DollarSign, Zap, Lock, Copy, Check,
  ChevronDown, ChevronRight, ExternalLink, Loader2,
  CreditCard, Plus, ArrowRight, Wallet, Gift,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useSubscription } from '@/hooks/use-subscription'
import { useToast } from '@/components/ui/toast'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'

const API_BASE = 'https://qpfmnheghocfcckferum.supabase.co/functions/v1/public-api'

// ============================================================
// API METHODS DATA
// ============================================================
interface ApiMethod {
  method: 'GET' | 'POST'
  path: string
  title: string
  description: string
  section: string
  scope: string
  costCents: number
  params?: { name: string; type: string; required: boolean; description: string }[]
  responseExample: string
}

const API_METHODS: ApiMethod[] = [
  {
    method: 'GET',
    path: '/ideas',
    title: 'List Ideas',
    description: 'Retrieve a paginated list of public SaaS ideas. Filter by category and sort by newest, popular, or MRR.',
    section: 'Ideas',
    scope: 'ideas:read',
    costCents: 1,
    params: [
      { name: 'limit', type: 'integer', required: false, description: 'Number of results (1-50, default 20)' },
      { name: 'offset', type: 'integer', required: false, description: 'Pagination offset (default 0)' },
      { name: 'category', type: 'string', required: false, description: 'Filter by category slug' },
      { name: 'sort', type: 'string', required: false, description: 'Sort order: newest, popular, or mrr' },
    ],
    responseExample: `{
  "ideas": [
    {
      "id": "uuid",
      "title": "AI Resume Builder",
      "slug": "ai-resume-builder",
      "tagline": "Build resumes with AI",
      "category": "AI/ML",
      "difficulty": "Medium",
      "estimated_mrr_low": 5000,
      "estimated_mrr_high": 25000,
      "upvotes": 42,
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0
}`,
  },
  {
    method: 'GET',
    path: '/ideas/search',
    title: 'Search Ideas',
    description: 'Search public ideas by title, tagline, or category. Returns matching results with pagination.',
    section: 'Ideas',
    scope: 'ideas:read',
    costCents: 2,
    params: [
      { name: 'q', type: 'string', required: true, description: 'Search query' },
      { name: 'limit', type: 'integer', required: false, description: 'Number of results (1-50, default 20)' },
      { name: 'offset', type: 'integer', required: false, description: 'Pagination offset (default 0)' },
    ],
    responseExample: `{
  "ideas": [...],
  "total": 5,
  "limit": 20,
  "offset": 0,
  "query": "ai resume"
}`,
  },
  {
    method: 'GET',
    path: '/ideas/:slug',
    title: 'Get Idea Details',
    description: 'Retrieve full details for a single idea by its slug or ID. Includes tech stack, pricing tiers, and metrics.',
    section: 'Ideas',
    scope: 'ideas:read',
    costCents: 1,
    params: [
      { name: 'slug', type: 'string', required: true, description: 'Idea slug or UUID (path parameter)' },
    ],
    responseExample: `{
  "idea": {
    "id": "uuid",
    "title": "AI Resume Builder",
    "slug": "ai-resume-builder",
    "tagline": "Build resumes with AI",
    "description": "Full description...",
    "category": "AI/ML",
    "difficulty": "Medium",
    "estimated_mrr_low": 5000,
    "estimated_mrr_high": 25000,
    "estimated_users": "10K-50K",
    "time_to_build": "2-3 months",
    "platforms": ["Web", "Mobile"],
    "tech_stack": {...},
    "pricing_tiers": [...],
    "upvotes": 42,
    "downvotes": 3,
    "view_count": 1200,
    "created_at": "2025-01-15T10:30:00Z"
  }
}`,
  },
  {
    method: 'GET',
    path: '/categories',
    title: 'List Categories',
    description: 'Get all available idea categories with their idea counts. Free endpoint — no credits charged.',
    section: 'Categories',
    scope: 'categories:read',
    costCents: 0,
    responseExample: `{
  "categories": [
    { "name": "AI/ML", "count": 45 },
    { "name": "Developer Tools", "count": 32 },
    { "name": "E-Commerce", "count": 28 }
  ],
  "total": 12
}`,
  },
  {
    method: 'GET',
    path: '/account/credits',
    title: 'Get Credit Balance',
    description: 'Check your current API credit balance, lifetime purchased, and lifetime used. Free endpoint.',
    section: 'Account',
    scope: 'account:read',
    costCents: 0,
    responseExample: `{
  "balance": 4.50,
  "balance_cents": 450,
  "lifetime_purchased": 10.00,
  "lifetime_used": 0.50,
  "currency": "USD"
}`,
  },
]

const SCOPES = [
  { name: 'ideas:read', description: 'Read public ideas, search, and get details', methods: ['GET /ideas', 'GET /ideas/search', 'GET /ideas/:slug'] },
  { name: 'categories:read', description: 'List all idea categories', methods: ['GET /categories'] },
  { name: 'account:read', description: 'View your credit balance', methods: ['GET /account/credits'] },
]

const SECTIONS = ['Ideas', 'Categories', 'Account']

export function DeveloperApiPage() {
  const { user } = useAuth()
  const { isTeam } = useSubscription()
  const { toast } = useToast()

  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [expandedMethod, setExpandedMethod] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'section' | 'scope'>('section')
  const [copied, setCopied] = useState<string | null>(null)

  // Credit state
  const [credits, setCredits] = useState<{ balance_cents: number; lifetime_purchased_cents: number; lifetime_used_cents: number } | null>(null)
  const [loadingCredits, setLoadingCredits] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState('')
  const [purchasing, setPurchasing] = useState(false)

  // API Key state
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [generatingKey, setGeneratingKey] = useState(false)
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchCredits()
      fetchApiKeys()
    }
  }, [user])

  const fetchCredits = async () => {
    if (!user) return
    setLoadingCredits(true)
    const { data } = await (supabase.from('api_credits') as any)
      .select('balance_cents, lifetime_purchased_cents, lifetime_used_cents')
      .eq('user_id', user.id)
      .single()
    setCredits(data)
    setLoadingCredits(false)
  }

  const fetchApiKeys = async () => {
    if (!user) return
    const { data } = await (supabase.from('api_keys') as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setApiKeys(data || [])
  }

  const generateApiKey = async () => {
    if (!user || !newKeyName.trim()) return
    setGeneratingKey(true)
    const rawKey = 'osk_' + crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 16)
    const keyPrefix = rawKey.slice(0, 8)
    const encoder = new TextEncoder()
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(rawKey))
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    const { error } = await (supabase.from('api_keys') as any).insert({
      user_id: user.id,
      name: newKeyName.trim(),
      key_hash: keyHash,
      key_prefix: keyPrefix,
      scopes: ['ideas:read', 'categories:read', 'account:read'],
    })

    if (!error) {
      setNewKeyValue(rawKey)
      setNewKeyName('')
      fetchApiKeys()
      fetchCredits() // trigger picks up $5 free grant
      toast('API key generated! Copy it now.')
    } else {
      toast('Failed to generate key')
    }
    setGeneratingKey(false)
  }

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount)
    if (!amount || amount < 5 || amount > 500) {
      toast('Enter an amount between $5 and $500')
      return
    }
    setPurchasing(true)
    try {
      const { data, error } = await supabase.functions.invoke('create-credit-checkout', {
        body: { amount },
      })
      if (error) throw error
      if (data?.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        toast('Failed to create checkout')
      }
    } catch {
      toast('Failed to create checkout')
    }
    setPurchasing(false)
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  const CopyBtn = ({ text, label }: { text: string; label: string }) => (
    <button
      onClick={() => copyToClipboard(text, label)}
      className="p-1 rounded hover:bg-surface-3 transition-colors cursor-pointer"
      title="Copy"
    >
      {copied === label ? <Check className="h-3.5 w-3.5 text-emerald" /> : <Copy className="h-3.5 w-3.5 text-text-muted" />}
    </button>
  )

  return (
    <div className="max-w-5xl space-y-8">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
            <Code2 className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Developer API</h1>
            <p className="text-sm text-text-muted">Programmatic access to SaaS ideas, categories, and more.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[12px]">
          <Badge variant="accent">REST API</Badge>
          <span className="text-text-muted">Base URL:</span>
          <code className="bg-surface-2 rounded px-2 py-0.5 font-mono text-[11px]">{API_BASE}</code>
          <CopyBtn text={API_BASE} label="base-url" />
        </div>
      </motion.div>

      {/* Quick Start + Credits + Keys */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Credits Card */}
        <Card className="lg:col-span-1">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-accent" />
              <h3 className="text-[14px] font-bold">API Credits</h3>
            </div>
            {!user ? (
              <p className="text-[12px] text-text-muted">Sign in to manage credits</p>
            ) : loadingCredits ? (
              <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
            ) : (
              <>
                <div className="text-center py-2">
                  <p className="text-3xl font-bold text-accent">${((credits?.balance_cents || 0) / 100).toFixed(2)}</p>
                  <p className="text-[11px] text-text-muted mt-1">Available balance</p>
                </div>
                {credits && (
                  <div className="flex justify-between text-[11px] text-text-muted">
                    <span>Purchased: ${((credits.lifetime_purchased_cents || 0) / 100).toFixed(2)}</span>
                    <span>Used: ${((credits.lifetime_used_cents || 0) / 100).toFixed(2)}</span>
                  </div>
                )}
                {!credits && (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald bg-emerald/10 rounded-lg p-2">
                    <Gift className="h-3.5 w-3.5" />
                    Generate an API key to get $5.00 free credit!
                  </div>
                )}
                <div className="border-t border-border pt-3 space-y-2">
                  <p className="text-[11px] font-semibold">Top Up Credits</p>
                  <div className="flex gap-1.5">
                    {[10, 25, 50].map(amt => (
                      <button
                        key={amt}
                        onClick={() => setTopUpAmount(String(amt))}
                        className={`flex-1 text-[11px] font-medium py-1.5 rounded-lg border transition-colors cursor-pointer ${
                          topUpAmount === String(amt)
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border bg-surface-2 text-text-secondary hover:border-accent/50'
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Custom $"
                      type="number"
                      min="5"
                      max="500"
                      value={topUpAmount}
                      onChange={e => setTopUpAmount(e.target.value)}
                      className="text-[12px]"
                    />
                    <Button onClick={handleTopUp} disabled={purchasing || !topUpAmount} className="shrink-0">
                      {purchasing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5 mr-1" />}
                      Pay
                    </Button>
                  </div>
                  <p className="text-[10px] text-text-muted">Min $5, max $500. Secure payment via Dodo Payments.</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Start */}
        <Card className="lg:col-span-2">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-[14px] font-bold flex items-center gap-2"><Zap className="h-4 w-4 text-brand" /> Quick Start</h3>
            <div className="space-y-2">
              <p className="text-[12px] text-text-secondary"><strong>1.</strong> Generate an API key below</p>
              <p className="text-[12px] text-text-secondary"><strong>2.</strong> You get <span className="text-emerald font-semibold">$5.00 free credit</span> on your first key</p>
              <p className="text-[12px] text-text-secondary"><strong>3.</strong> Make requests with your key in the Authorization header</p>
            </div>
            <div className="bg-surface-2 rounded-lg p-3 font-mono text-[11px] space-y-1 relative">
              <div className="absolute top-2 right-2">
                <CopyBtn text={`curl -H "Authorization: Bearer YOUR_API_KEY" \\\n  ${API_BASE}/ideas`} label="quickstart" />
              </div>
              <p className="text-text-muted"># Fetch latest public ideas</p>
              <p>curl -H <span className="text-brand">"Authorization: Bearer YOUR_API_KEY"</span> \</p>
              <p className="pl-4 text-accent">{API_BASE}/ideas</p>
            </div>

            {/* Pricing table */}
            <div className="border-t border-border pt-3">
              <p className="text-[12px] font-semibold mb-2">Endpoint Pricing</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                <span className="text-text-muted">GET /ideas</span><span className="text-right font-mono">$0.01</span>
                <span className="text-text-muted">GET /ideas/search</span><span className="text-right font-mono">$0.02</span>
                <span className="text-text-muted">GET /ideas/:slug</span><span className="text-right font-mono">$0.01</span>
                <span className="text-text-muted">GET /categories</span><span className="text-right font-mono text-emerald">FREE</span>
                <span className="text-text-muted">GET /account/credits</span><span className="text-right font-mono text-emerald">FREE</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Keys Section */}
      {user && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="text-[14px] font-bold flex items-center gap-2"><Key className="h-4 w-4 text-accent" /> Your API Keys</h3>

            {newKeyValue && (
              <div className="bg-emerald/5 border border-emerald/30 rounded-lg p-3 space-y-2">
                <p className="text-[12px] font-semibold text-emerald">New API Key — copy it now!</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-[11px] bg-surface-2 rounded px-3 py-2 font-mono break-all">{newKeyValue}</code>
                  <CopyBtn text={newKeyValue} label="new-key" />
                </div>
                <p className="text-[10px] text-text-muted">This key will not be shown again. Store it securely.</p>
              </div>
            )}

            <div className="flex gap-2">
              <Input
                placeholder="Key name (e.g. My App)"
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && generateApiKey()}
              />
              <Button onClick={generateApiKey} disabled={generatingKey || !newKeyName.trim()}>
                {generatingKey ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
                Generate
              </Button>
            </div>

            {apiKeys.length > 0 && (
              <div className="space-y-2">
                {apiKeys.map(k => (
                  <div key={k.id} className="flex items-center gap-3 bg-surface-2 rounded-lg px-3 py-2">
                    <Key className={`h-3.5 w-3.5 ${k.is_active ? 'text-accent' : 'text-text-muted'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium">{k.name}</p>
                      <p className="text-[10px] text-text-muted font-mono">{k.key_prefix}••••••••</p>
                    </div>
                    {!k.is_active && <Badge variant="secondary" className="text-[10px] text-rose">Revoked</Badge>}
                    {k.last_used_at && <span className="text-[10px] text-text-muted">Used {new Date(k.last_used_at).toLocaleDateString()}</span>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Authentication */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="text-[14px] font-bold flex items-center gap-2"><Lock className="h-4 w-4 text-brand" /> Authentication</h3>
          <p className="text-[12px] text-text-secondary">
            All API requests require an API key passed in the <code className="bg-surface-2 rounded px-1 py-0.5 text-[11px]">Authorization</code> header:
          </p>
          <div className="bg-surface-2 rounded-lg p-3 font-mono text-[11px]">
            <span className="text-text-muted">Authorization:</span> <span className="text-brand">Bearer osk_your_api_key_here</span>
          </div>
          <div className="flex items-start gap-2 text-[12px] text-text-secondary bg-surface-2 rounded-lg p-3">
            <Lock className="h-4 w-4 text-amber shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-text-primary">Security</p>
              <p>API keys are hashed with SHA-256 and stored securely. Never expose your key in client-side code. Use server-to-server requests only.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold flex-1">API Reference</h2>
        <div className="flex bg-surface-2 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('section')}
            className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors cursor-pointer ${
              viewMode === 'section' ? 'bg-surface-0 text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            By Section
          </button>
          <button
            onClick={() => setViewMode('scope')}
            className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors cursor-pointer ${
              viewMode === 'scope' ? 'bg-surface-0 text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            By OAuth Scope
          </button>
        </div>
      </div>

      {/* Methods by Section */}
      {viewMode === 'section' && (
        <div className="space-y-6">
          {SECTIONS.map(section => {
            const methods = API_METHODS.filter(m => m.section === section)
            return (
              <div key={section}>
                <h3 className="text-[14px] font-bold text-text-primary mb-3 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {section}
                </h3>
                <div className="space-y-2">
                  {methods.map(m => (
                    <MethodCard key={m.path} method={m} expanded={expandedMethod === m.path} onToggle={() => setExpandedMethod(expandedMethod === m.path ? null : m.path)} copyToClipboard={copyToClipboard} copied={copied} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Methods by OAuth Scope */}
      {viewMode === 'scope' && (
        <div className="space-y-6">
          {SCOPES.map(scope => {
            const methods = API_METHODS.filter(m => m.scope === scope.name)
            return (
              <div key={scope.name}>
                <div className="mb-3">
                  <h3 className="text-[14px] font-bold text-text-primary flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-accent" />
                    <code className="bg-accent/10 text-accent rounded px-2 py-0.5 text-[12px]">{scope.name}</code>
                  </h3>
                  <p className="text-[12px] text-text-muted mt-1">{scope.description}</p>
                </div>
                <div className="space-y-2">
                  {methods.map(m => (
                    <MethodCard key={m.path} method={m} expanded={expandedMethod === m.path} onToggle={() => setExpandedMethod(expandedMethod === m.path ? null : m.path)} copyToClipboard={copyToClipboard} copied={copied} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Rate Limits & Errors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="text-[14px] font-bold">Rate Limits</h3>
            <div className="space-y-2 text-[12px] text-text-secondary">
              <div className="flex justify-between"><span>Per API key</span><span className="font-mono">60 req/min</span></div>
              <div className="flex justify-between"><span>Per IP</span><span className="font-mono">120 req/min</span></div>
              <div className="flex justify-between"><span>Max results per page</span><span className="font-mono">50</span></div>
            </div>
            <p className="text-[11px] text-text-muted">Exceeding limits returns <code className="bg-surface-2 rounded px-1">429 Too Many Requests</code>.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="text-[14px] font-bold">Error Codes</h3>
            <div className="space-y-1.5 text-[12px]">
              <div className="flex justify-between"><code className="text-rose bg-rose/10 rounded px-1.5">401</code><span className="text-text-muted">Invalid or missing API key</span></div>
              <div className="flex justify-between"><code className="text-amber bg-amber/10 rounded px-1.5">402</code><span className="text-text-muted">Insufficient credits</span></div>
              <div className="flex justify-between"><code className="text-rose bg-rose/10 rounded px-1.5">403</code><span className="text-text-muted">Key revoked</span></div>
              <div className="flex justify-between"><code className="text-text-muted bg-surface-2 rounded px-1.5">404</code><span className="text-text-muted">Resource not found</span></div>
              <div className="flex justify-between"><code className="text-amber bg-amber/10 rounded px-1.5">429</code><span className="text-text-muted">Rate limit exceeded</span></div>
              <div className="flex justify-between"><code className="text-rose bg-rose/10 rounded px-1.5">500</code><span className="text-text-muted">Internal server error</span></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============================================================
// METHOD CARD COMPONENT
// ============================================================
function MethodCard({ method, expanded, onToggle, copyToClipboard, copied }: {
  method: ApiMethod; expanded: boolean; onToggle: () => void
  copyToClipboard: (text: string, label: string) => void; copied: string | null
}) {
  const curlExample = `curl -H "Authorization: Bearer YOUR_API_KEY" \\
  ${API_BASE}${method.path.replace(':slug', 'ai-resume-builder')}${method.params?.find(p => p.name === 'q') ? '?q=ai' : ''}`

  return (
    <Card className="overflow-hidden">
      <button onClick={onToggle} className="w-full text-left p-4 flex items-center gap-3 cursor-pointer hover:bg-surface-2/50 transition-colors">
        <span className="text-[11px] font-bold uppercase bg-accent/10 text-accent rounded px-2 py-0.5 shrink-0">
          {method.method}
        </span>
        <code className="text-[12px] font-mono text-text-secondary flex-1 truncate">{method.path}</code>
        <span className="text-[12px] font-medium text-text-primary hidden sm:block">{method.title}</span>
        {method.costCents > 0 ? (
          <Badge variant="secondary" className="text-[10px] shrink-0">${(method.costCents / 100).toFixed(2)}/call</Badge>
        ) : (
          <Badge variant="accent" className="text-[10px] shrink-0">FREE</Badge>
        )}
        <ChevronDown className={`h-4 w-4 text-text-muted transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="border-t border-border">
          <div className="p-4 space-y-4">
            <p className="text-[12px] text-text-secondary">{method.description}</p>

            {/* Scope */}
            <div className="flex items-center gap-2">
              <Lock className="h-3 w-3 text-text-muted" />
              <span className="text-[11px] text-text-muted">Scope:</span>
              <code className="text-[11px] bg-accent/10 text-accent rounded px-1.5 py-0.5">{method.scope}</code>
            </div>

            {/* Parameters */}
            {method.params && method.params.length > 0 && (
              <div>
                <p className="text-[12px] font-semibold mb-2">Parameters</p>
                <div className="bg-surface-2 rounded-lg overflow-hidden">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-3 py-2 text-text-muted font-medium">Name</th>
                        <th className="text-left px-3 py-2 text-text-muted font-medium">Type</th>
                        <th className="text-left px-3 py-2 text-text-muted font-medium">Required</th>
                        <th className="text-left px-3 py-2 text-text-muted font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {method.params.map(p => (
                        <tr key={p.name} className="border-b border-border/50 last:border-0">
                          <td className="px-3 py-2 font-mono text-accent">{p.name}</td>
                          <td className="px-3 py-2 text-text-muted">{p.type}</td>
                          <td className="px-3 py-2">{p.required ? <span className="text-rose">Yes</span> : <span className="text-text-muted">No</span>}</td>
                          <td className="px-3 py-2 text-text-secondary">{p.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* cURL Example */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[12px] font-semibold">Example Request</p>
                <button onClick={() => copyToClipboard(curlExample, 'curl-' + method.path)} className="p-1 rounded hover:bg-surface-3 transition-colors cursor-pointer">
                  {copied === 'curl-' + method.path ? <Check className="h-3.5 w-3.5 text-emerald" /> : <Copy className="h-3.5 w-3.5 text-text-muted" />}
                </button>
              </div>
              <pre className="bg-surface-2 rounded-lg p-3 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap text-text-secondary">{curlExample}</pre>
            </div>

            {/* Response */}
            <div>
              <p className="text-[12px] font-semibold mb-1">Example Response</p>
              <pre className="bg-surface-2 rounded-lg p-3 text-[11px] font-mono overflow-x-auto whitespace-pre text-text-secondary max-h-60 overflow-y-auto">{method.responseExample}</pre>
            </div>
          </div>
        </motion.div>
      )}
    </Card>
  )
}
