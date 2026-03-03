import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Users, Loader2, Check, X } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useTeam } from '@/hooks/use-team'
import { useToast } from '@/components/ui/toast'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function TeamInvitePage() {
  const { token } = useParams<{ token: string }>()
  const { user } = useAuth()
  const { acceptInvite } = useTeam()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [status, setStatus] = useState<'loading' | 'accepting' | 'success' | 'error' | 'login'>('loading')
  const [teamName, setTeamName] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      return
    }
    if (!user) {
      setStatus('login')
      return
    }
    setStatus('accepting')
  }, [token, user])

  const handleAccept = async () => {
    if (!token) return
    setStatus('accepting')
    const result = await acceptInvite(token)
    if (result.success) {
      setTeamName(result.teamName || '')
      setStatus('success')
      toast(`Joined ${result.teamName}!`)
    } else {
      setStatus('error')
    }
  }

  // Auto-accept when user is logged in and ready
  useEffect(() => {
    if (status === 'accepting' && user && token) {
      handleAccept()
    }
  }, [status, user, token])

  return (
    <div className="max-w-md mx-auto py-20 space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
          <Users className="h-8 w-8 text-accent" />
        </div>

        {status === 'loading' || status === 'accepting' ? (
          <>
            <h2 className="text-xl font-bold">Joining team...</h2>
            <Loader2 className="h-6 w-6 animate-spin text-accent mx-auto mt-4" />
          </>
        ) : status === 'login' ? (
          <>
            <h2 className="text-xl font-bold">You've been invited to a team</h2>
            <p className="text-sm text-text-muted">Sign in or create an account to accept the invitation.</p>
            <div className="flex items-center justify-center gap-3 pt-4">
              <Link to={`/login?redirect=/team/invite/${token}`}>
                <Button>Sign In</Button>
              </Link>
              <Link to={`/register?redirect=/team/invite/${token}`}>
                <Button variant="outline">Create Account</Button>
              </Link>
            </div>
          </>
        ) : status === 'success' ? (
          <>
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald/10 flex items-center justify-center">
              <Check className="h-6 w-6 text-emerald" />
            </div>
            <h2 className="text-xl font-bold">Welcome to {teamName}!</h2>
            <p className="text-sm text-text-muted">You're now a member of the team. Head to the workspace to get started.</p>
            <Button onClick={() => navigate('/team')} className="mt-4">
              Open Team Workspace
            </Button>
          </>
        ) : (
          <>
            <div className="mx-auto h-12 w-12 rounded-full bg-rose/10 flex items-center justify-center">
              <X className="h-6 w-6 text-rose" />
            </div>
            <h2 className="text-xl font-bold">Invalid or expired invite</h2>
            <p className="text-sm text-text-muted">This invite link may have already been used or is no longer valid. Ask your team admin for a new one.</p>
            <Button variant="outline" onClick={() => navigate('/')} className="mt-4">
              Go Home
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
