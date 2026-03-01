import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Loader2, Zap, BarChart3, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GenerationAnimation } from '@/components/ideas/generation-animation'
import { Logo } from '@/components/ui/logo'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { generateSaasIdea, saveIdeaToSupabase } from '@/lib/ai'

export function AdminPage() {
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()
  const [generating, setGenerating] = useState(false)
  const [stats, setStats] = useState({ totalPublic: 0, totalPrivate: 0, todayPublic: 0 })
  const [lastGenerated, setLastGenerated] = useState<string | null>(null)

  const isAdmin = (profile as any)?.is_admin === true

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/')
      return
    }
    fetchStats()
  }, [user, profile, authLoading, navigate, isAdmin])

  const fetchStats = async () => {
    const today = new Date().toISOString().split('T')[0]

    const [publicRes, privateRes, todayRes] = await Promise.all([
      supabase.from('saas_ideas').select('*', { count: 'exact', head: true }).eq('is_public', true),
      supabase.from('saas_ideas').select('*', { count: 'exact', head: true }).eq('is_public', false),
      supabase.from('saas_ideas').select('*', { count: 'exact', head: true }).eq('is_public', true).gte('created_at', today),
    ])

    setStats({
      totalPublic: publicRes.count || 0,
      totalPrivate: privateRes.count || 0,
      todayPublic: todayRes.count || 0,
    })
  }

  const handleForceGenerate = async () => {
    if (!user) return
    setGenerating(true)
    setLastGenerated(null)

    try {
      const idea = await generateSaasIdea()
      if (idea) {
        await saveIdeaToSupabase(idea, true, user.id)
        setLastGenerated(idea.title as string)
        await fetchStats()
      }
    } finally {
      setGenerating(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Shield className="h-6 w-6 text-brand" />
            Admin Panel
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Force-generate public ideas and manage the platform.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-5 w-5 text-brand mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.totalPublic}</p>
              <p className="text-xs text-text-muted">Public Ideas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="h-5 w-5 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.totalPrivate}</p>
              <p className="text-xs text-text-muted">Private Ideas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-5 w-5 text-emerald mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.todayPublic}</p>
              <p className="text-xs text-text-muted">Today (Public)</p>
            </CardContent>
          </Card>
        </div>

        {/* Force Generate */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Logo className="h-4 w-4" />
              Force Generate Public Idea
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary mb-4">
              Manually trigger a new public SaaS idea generation. The system also auto-generates daily at 00:00 UTC.
            </p>

            {!generating && (
              <Button onClick={handleForceGenerate} disabled={generating}>
                <Logo className="h-4 w-4" />
                Force Generate Now
              </Button>
            )}

            {generating && (
              <div className="mt-4">
                <GenerationAnimation isGenerating={generating} />
              </div>
            )}

            {lastGenerated && !generating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-xl bg-emerald/10 border border-emerald/20 text-sm"
              >
                <p className="font-medium text-emerald">Successfully generated!</p>
                <p className="text-text-secondary mt-0.5">{lastGenerated}</p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
