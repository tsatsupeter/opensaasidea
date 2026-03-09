import { useState, useRef } from 'react'
import { useAuthModal } from '@/components/ui/auth-modal'
import { motion } from 'framer-motion'
import { Settings, Camera, Loader2, Check, Trash2, CreditCard, Crown, AlertTriangle, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { useSubscription } from '@/hooks/use-subscription'
import { supabase } from '@/lib/supabase'
import { ProfileManager } from '@/components/profile/profile-manager'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function SettingsPage() {
  const { openAuthModal } = useAuthModal()
  const { user, profile, loading: authLoading, refreshProfile } = useAuth()
  const { tier, config, billingPeriod, subscriptionStatus, subscriptionExpiresAt, cancelling, cancelSubscription, isFree } = useSubscription()
  const navigate = useNavigate()
  const [uploading, setUploading] = useState(false)
  const [avatarMsg, setAvatarMsg] = useState('')
  const [cancelMsg, setCancelMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleCancelSubscription = async () => {
    setCancelMsg(null)
    const result = await cancelSubscription()
    if (result.success) {
      setCancelMsg({ type: 'success', text: result.message || 'Subscription cancelled' })
      setShowCancelConfirm(false)
    } else {
      setCancelMsg({ type: 'error', text: result.error || 'Failed to cancel' })
    }
  }

  useEffect(() => {
    if (!authLoading && !user) openAuthModal('login')
  }, [user, authLoading, openAuthModal])

  const handleAvatarUpload = async (file: File) => {
    if (!user) return
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setAvatarMsg('Use PNG, JPG, WebP, or GIF.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarMsg('Max 5MB.')
      return
    }

    setUploading(true)
    setAvatarMsg('')

    const ext = file.name.split('.').pop() || 'png'
    const filePath = `${user.id}/avatar-${Date.now()}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('cv-uploads')
      .upload(filePath, file, { upsert: true })

    if (uploadErr) {
      setAvatarMsg(`Upload failed: ${uploadErr.message}`)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('cv-uploads')
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl

    await (supabase.from('profiles') as any)
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    await refreshProfile()
    setAvatarMsg('Avatar updated!')
    setUploading(false)
    setTimeout(() => setAvatarMsg(''), 3000)
  }

  const handleRemoveAvatar = async () => {
    if (!user) return
    await (supabase.from('profiles') as any)
      .update({ avatar_url: null, updated_at: new Date().toISOString() })
      .eq('id', user.id)
    await refreshProfile()
    setAvatarMsg('Avatar removed')
    setTimeout(() => setAvatarMsg(''), 3000)
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Settings className="h-6 w-6 text-brand" />
            Settings
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage your profile, avatar, CV, and skills
          </p>
        </div>

        {/* Avatar section */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Camera className="h-4 w-4 text-brand" />
              Avatar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-5">
              <div
                onClick={() => fileRef.current?.click()}
                className="h-20 w-20 rounded-2xl bg-surface-2 border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-brand/40 transition-colors overflow-hidden group shrink-0"
              >
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-brand" />
                ) : profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover group-hover:opacity-80 transition-opacity" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Camera className="h-5 w-5 text-text-muted group-hover:text-brand transition-colors" />
                    <span className="text-[9px] text-text-muted">Upload</span>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) handleAvatarUpload(f)
                  }}
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Profile Picture</p>
                <p className="text-xs text-text-muted mt-0.5">PNG, JPG, WebP, or GIF. Max 5MB.</p>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    Change
                  </Button>
                  {profile?.avatar_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      className="text-rose hover:text-rose"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Remove
                    </Button>
                  )}
                  {avatarMsg && (
                    <span className={`text-xs flex items-center gap-1 ${avatarMsg.includes('failed') || avatarMsg.includes('Max') || avatarMsg.includes('Use') ? 'text-rose' : 'text-emerald'}`}>
                      <Check className="h-3 w-3" />
                      {avatarMsg}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription & Billing */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-brand" />
              Subscription & Billing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Current Plan */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{config.name} Plan</p>
                    {!isFree && (
                      <Badge variant={subscriptionStatus === 'active' ? 'success' : subscriptionStatus === 'cancelled' ? 'error' : 'secondary'} className="text-[10px]">
                        {subscriptionStatus || 'active'}
                      </Badge>
                    )}
                  </div>
                  {!isFree && billingPeriod && (
                    <p className="text-xs text-text-muted mt-0.5">
                      Billed {billingPeriod}
                      {subscriptionExpiresAt && (
                        <> &middot; {subscriptionStatus === 'cancelled' ? 'Access until' : 'Renews'} {new Date(subscriptionExpiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>
                      )}
                    </p>
                  )}
                  {isFree && (
                    <p className="text-xs text-text-muted mt-0.5">Free forever &middot; Upgrade to unlock unlimited features</p>
                  )}
                </div>
                {isFree ? (
                  <Button size="sm" onClick={() => navigate('/pricing')}>
                    <Crown className="h-3.5 w-3.5 mr-1" />
                    Upgrade
                  </Button>
                ) : subscriptionStatus !== 'cancelled' ? (
                  <Button variant="outline" size="sm" onClick={() => navigate('/pricing')}>
                    Change Plan
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                ) : null}
              </div>

              {/* Cancel Section */}
              {!isFree && subscriptionStatus === 'active' && (
                <div className="border-t border-border pt-3">
                  {!showCancelConfirm ? (
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="text-xs text-text-muted hover:text-rose transition-colors cursor-pointer"
                    >
                      Cancel subscription
                    </button>
                  ) : (
                    <div className="bg-rose/5 border border-rose/20 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-rose shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-rose">Cancel your subscription?</p>
                          <p className="text-xs text-text-secondary mt-1">
                            You'll lose access to {config.name} features at the end of your current billing period.
                            You can always resubscribe later.
                          </p>
                          <div className="flex items-center gap-2 mt-3">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={handleCancelSubscription}
                              disabled={cancelling}
                            >
                              {cancelling ? (
                                <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Cancelling...</>
                              ) : (
                                'Yes, cancel'
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowCancelConfirm(false)}
                              disabled={cancelling}
                            >
                              Keep my plan
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* On Hold / Failed payment message */}
              {(subscriptionStatus === 'on_hold' || subscriptionStatus === 'failed') && (
                <div className="border-t border-border pt-3">
                  <div className="bg-rose/5 border border-rose/20 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-rose shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-rose">
                          {subscriptionStatus === 'on_hold' ? 'Payment failed — subscription on hold' : 'Subscription payment failed'}
                        </p>
                        <p className="text-xs text-text-secondary mt-1">
                          Your last payment didn't go through. Please update your payment method or resubscribe to restore access to your plan features.
                        </p>
                        <Button
                          size="sm"
                          className="mt-2"
                          onClick={() => navigate('/pricing')}
                        >
                          Resubscribe
                          <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Cancelled message */}
              {subscriptionStatus === 'cancelled' && (
                <div className="border-t border-border pt-3">
                  <div className="bg-amber/5 border border-amber/20 rounded-lg p-3">
                    <p className="text-xs text-text-secondary">
                      Your subscription has been cancelled.
                      {subscriptionExpiresAt && (
                        <> You'll have access until <strong>{new Date(subscriptionExpiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>.</>
                      )}
                      {' '}You can resubscribe anytime from the <button onClick={() => navigate('/pricing')} className="text-brand hover:underline cursor-pointer font-medium">pricing page</button>.
                    </p>
                  </div>
                </div>
              )}

              {/* Cancel result message */}
              {cancelMsg && (
                <div className={`text-xs flex items-center gap-1 ${cancelMsg.type === 'success' ? 'text-emerald' : 'text-rose'}`}>
                  {cancelMsg.type === 'success' ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  {cancelMsg.text}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ProfileManager handles profile, CV, skills */}
        <ProfileManager />
      </motion.div>
    </div>
  )
}
