import { useState, createContext, useContext, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/use-auth'
import { siteConfig, getBrandParts } from '@/lib/site-config'

type AuthView = 'login' | 'register'

interface AuthModalContextType {
  openAuthModal: (view?: AuthView) => void
  closeAuthModal: () => void
  isOpen: boolean
}

const AuthModalContext = createContext<AuthModalContextType>({
  openAuthModal: () => {},
  closeAuthModal: () => {},
  isOpen: false,
})

export function useAuthModal() {
  return useContext(AuthModalContext)
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [initialView, setInitialView] = useState<AuthView>('login')

  const openAuthModal = useCallback((view: AuthView = 'login') => {
    setInitialView(view)
    setIsOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => setIsOpen(false), [])

  return (
    <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal, isOpen }}>
      {children}
      <AnimatePresence>
        {isOpen && <AuthModal initialView={initialView} onClose={closeAuthModal} />}
      </AnimatePresence>
    </AuthModalContext.Provider>
  )
}

function AuthModal({ initialView, onClose }: { initialView: AuthView; onClose: () => void }) {
  const [view, setView] = useState<AuthView>(initialView)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-md mx-4 bg-surface-0 border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-surface-2 hover:bg-surface-3 text-text-muted hover:text-text-primary transition-colors cursor-pointer z-10"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Logo */}
        <div className="pt-8 pb-2 text-center">
          <div className="inline-flex items-center gap-2">
            <img src="/logo.png" alt={siteConfig.logoAlt} className="h-8 w-8 rounded-lg object-contain" />
            <span className="text-lg font-bold">
              {getBrandParts().prefix}<span className="text-brand">{getBrandParts().brand}</span>{getBrandParts().suffix}
            </span>
          </div>
        </div>

        {view === 'login' ? (
          <LoginForm onClose={onClose} onSwitch={() => setView('register')} />
        ) : (
          <RegisterForm onClose={onClose} onSwitch={() => setView('login')} />
        )}
      </motion.div>
    </motion.div>
  )
}

function LoginForm({ onClose, onSwitch }: { onClose: () => void; onSwitch: () => void }) {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: err } = await signIn(email, password)
    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      onClose()
      navigate('/dashboard')
    }
  }

  return (
    <div className="px-8 pb-8 pt-2">
      <h2 className="text-xl font-bold text-center">Log In</h2>
      <p className="text-[12px] text-text-muted text-center mt-1 mb-6">
        Sign in to access your personalized ideas
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-error/10 border border-error/20 p-3 text-sm text-error">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-text-secondary">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
              autoFocus
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-text-secondary">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Log In
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-[12px] text-text-muted mt-5">
        New here?{' '}
        <button onClick={onSwitch} className="text-brand hover:text-brand-light font-medium transition-colors cursor-pointer">
          Sign up
        </button>
      </p>
    </div>
  )
}

function RegisterForm({ onClose, onSwitch }: { onClose: () => void; onSwitch: () => void }) {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    const { error: err } = await signUp(email, password, fullName)
    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      onClose()
      navigate('/onboarding')
    }
  }

  return (
    <div className="px-8 pb-8 pt-2">
      <h2 className="text-xl font-bold text-center">Sign Up</h2>
      <p className="text-[12px] text-text-muted text-center mt-1 mb-6">
        Create your account to get started
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-error/10 border border-error/20 p-3 text-sm text-error">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-text-secondary">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="pl-10"
              required
              autoFocus
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-text-secondary">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-text-secondary">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Create Account
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-[12px] text-text-muted mt-5">
        Already have an account?{' '}
        <button onClick={onSwitch} className="text-brand hover:text-brand-light font-medium transition-colors cursor-pointer">
          Log in
        </button>
      </p>
    </div>
  )
}
