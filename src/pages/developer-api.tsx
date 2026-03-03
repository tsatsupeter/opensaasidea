import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Code2, Key, Zap, Copy, Check,
  ExternalLink, Loader2,
  CreditCard, Plus, Wallet, Gift, BookOpen, Trash2,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/components/ui/toast'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'

const API_BASE = 'https://opensaasidea.com/v1/api'
const DOCS_URL = 'https://opensaasidea.mintlify.app'

export function DeveloperApiPage() {
  const { user } = useAuth()
  const { toast } = useToast()
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

  // Transaction history
  const [transactions, setTransactions] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      fetchCredits()
      fetchApiKeys()
      fetchTransactions()
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

  const fetchTransactions = async () => {
    if (!user) return
    const { data } = await (supabase.from('api_credit_transactions') as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
    setTransactions(data || [])
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
      setTimeout(fetchCredits, 1000) // trigger picks up $5 free grant
      toast('API key generated! Copy it now.')
    } else {
      toast('Failed to generate key')
    }
    setGeneratingKey(false)
  }

  const revokeKey = async (keyId: string) => {
    await (supabase.from('api_keys') as any).update({ is_active: false }).eq('id', keyId)
    toast('API key revoked')
    fetchApiKeys()
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
    <div className="max-w-4xl space-y-6">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Code2 className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Developer Dashboard</h1>
              <p className="text-sm text-text-muted">Manage your API keys and credits.</p>
            </div>
          </div>
          <a href={DOCS_URL} target="_blank" rel="noopener noreferrer">
            <Button className="gap-1.5">
              <BookOpen className="h-4 w-4" /> API Docs <ExternalLink className="h-3 w-3" />
            </Button>
          </a>
        </div>
      </motion.div>

      {!user ? (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <Key className="h-8 w-8 text-text-muted mx-auto" />
            <p className="text-[14px] font-semibold">Sign in to get started</p>
            <p className="text-[12px] text-text-muted">Create an account to generate API keys and get $5.00 free credit.</p>
            <Link to="/login"><Button>Sign In</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Credits + Quick Start */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Credits Card */}
            <Card className="lg:col-span-1">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-accent" />
                  <h3 className="text-[14px] font-bold">API Credits</h3>
                </div>
                {loadingCredits ? (
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
                  <p className="text-[12px] text-text-secondary"><strong>3.</strong> Read the <a href={DOCS_URL} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">API documentation</a> for endpoints and examples</p>
                </div>
                <div className="bg-surface-2 rounded-lg p-3 font-mono text-[11px] space-y-1 relative">
                  <div className="absolute top-2 right-2">
                    <CopyBtn text={`curl -H "Authorization: Bearer YOUR_API_KEY" \\\n  ${API_BASE}/ideas`} label="quickstart" />
                  </div>
                  <p className="text-text-muted"># Fetch latest public ideas</p>
                  <p>curl -H <span className="text-brand">"Authorization: Bearer YOUR_API_KEY"</span> \</p>
                  <p className="pl-4 text-accent">{API_BASE}/ideas</p>
                </div>

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

          {/* API Keys */}
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
                      {k.last_used_at && <span className="text-[10px] text-text-muted">Used {new Date(k.last_used_at).toLocaleDateString()}</span>}
                      {k.is_active ? (
                        <button onClick={() => revokeKey(k.id)} className="text-[11px] text-rose hover:text-rose/80 flex items-center gap-1 cursor-pointer">
                          <Trash2 className="h-3 w-3" /> Revoke
                        </button>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] text-rose">Revoked</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          {transactions.length > 0 && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="text-[14px] font-bold">Recent Activity</h3>
                <div className="space-y-1">
                  {transactions.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between py-1.5 text-[12px] border-b border-border/30 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${tx.amount_cents > 0 ? 'bg-emerald' : 'bg-text-muted'}`} />
                        <span className="text-text-secondary">{tx.description}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-mono font-medium ${tx.amount_cents > 0 ? 'text-emerald' : 'text-text-muted'}`}>
                          {tx.amount_cents > 0 ? '+' : ''}${(tx.amount_cents / 100).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-text-muted">{new Date(tx.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
