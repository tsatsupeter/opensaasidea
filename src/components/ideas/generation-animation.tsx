import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, Search, Globe, FlaskConical, ChefHat, DollarSign,
  Wrench, Rocket, CheckCircle2, Loader2, PartyPopper
} from 'lucide-react'
import { cn } from '@/lib/utils'

const THINKING_STEPS = [
  { icon: Brain, text: "Brainstorming wild SaaS ideas...", subtext: "Channeling inner startup guru", color: 'text-brand' },
  { icon: Search, text: "Scanning for gaps in the market...", subtext: "Looking where nobody else is", color: 'text-accent' },
  { icon: Globe, text: "Exploring the web for inspiration...", subtext: "Surfing 10,000 Product Hunt launches", color: 'text-emerald' },
  { icon: FlaskConical, text: "Testing idea viability...", subtext: "Running mental experiments", color: 'text-amber' },
  { icon: ChefHat, text: "Cooking the SaaS idea...", subtext: "Adding secret sauce & spices", color: 'text-brand' },
  { icon: DollarSign, text: "Cooking the MRR projections...", subtext: "Making the numbers look spicy", color: 'text-emerald' },
  { icon: Wrench, text: "Crafting the tech stack...", subtext: "Picking the shiniest tools", color: 'text-accent' },
  { icon: ChefHat, text: "Cooking the full breakdown...", subtext: "Baking pricing tiers & team roles", color: 'text-brand' },
  { icon: Rocket, text: "Polishing the launch strategy...", subtext: "Almost ready for takeoff!", color: 'text-rose' },
  { icon: PartyPopper, text: "Finalizing your SaaS idea...", subtext: "This one's going to be fire", color: 'text-brand' },
]

interface GenerationAnimationProps {
  isGenerating: boolean
  onComplete?: () => void
}

export function GenerationAnimation({ isGenerating }: GenerationAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  useEffect(() => {
    if (!isGenerating) {
      setCurrentStep(0)
      setCompletedSteps([])
      return
    }

    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < THINKING_STEPS.length - 1) {
          setCompletedSteps(completed => [...completed, prev])
          return prev + 1
        }
        return prev
      })
    }, 2200)

    return () => clearInterval(interval)
  }, [isGenerating])

  if (!isGenerating) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-lg mx-auto"
    >
      <div className="rounded-2xl border border-border bg-surface-1 overflow-hidden shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-surface-2">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div className="absolute inset-0 rounded-xl gradient-brand animate-pulse-ring opacity-30" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">AI is cooking something special</h3>
              <p className="text-xs text-text-muted">Step {currentStep + 1} of {THINKING_STEPS.length}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 rounded-full bg-surface-4 overflow-hidden">
            <motion.div
              className="h-full rounded-full gradient-brand"
              initial={{ width: '0%' }}
              animate={{ width: `${((currentStep + 1) / THINKING_STEPS.length) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="px-4 py-3 max-h-[360px] overflow-y-auto sidebar-scroll">
          <div className="space-y-1">
            {THINKING_STEPS.map((step, i) => {
              const isActive = i === currentStep
              const isCompleted = completedSteps.includes(i)
              const isPending = i > currentStep

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{
                    opacity: isPending ? 0.3 : 1,
                    x: 0,
                  }}
                  transition={{ delay: i * 0.08, duration: 0.3 }}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-300',
                    isActive && 'bg-surface-2',
                  )}
                >
                  <div className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300',
                    isCompleted && 'bg-emerald/15',
                    isActive && 'bg-brand/15',
                    isPending && 'bg-surface-3',
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald" />
                    ) : isActive ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      >
                        <Loader2 className={cn('h-4 w-4', step.color)} />
                      </motion.div>
                    ) : (
                      <step.icon className="h-4 w-4 text-text-muted" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      'text-sm font-medium transition-colors',
                      isCompleted && 'text-text-muted line-through',
                      isActive && 'text-text-primary',
                      isPending && 'text-text-muted',
                    )}>
                      {step.text}
                    </p>
                    {isActive && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-xs text-text-muted mt-0.5"
                      >
                        {step.subtext}
                      </motion.p>
                    )}
                  </div>

                  {isActive && (
                    <div className="flex gap-0.5">
                      {[0, 1, 2].map(dot => (
                        <motion.div
                          key={dot}
                          className="h-1 w-1 rounded-full bg-brand"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, delay: dot * 0.2, repeat: Infinity }}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Fun footer */}
        <div className="px-6 py-3 border-t border-border bg-surface-2">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentStep}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-xs text-text-muted text-center italic"
            >
              {currentStep === 0 && "Warming up the creative engines..."}
              {currentStep === 1 && "Every great startup started with a crazy idea..."}
              {currentStep === 2 && "Did you know? 90% of startups fail. Yours won't."}
              {currentStep === 3 && "Testing... testing... is this thing on?"}
              {currentStep === 4 && "Gordon Ramsay would be proud of this recipe"}
              {currentStep === 5 && "Money printer goes brrr..."}
              {currentStep === 6 && "This tech stack is *chef's kiss*"}
              {currentStep === 7 && "The secret ingredient is always more features"}
              {currentStep === 8 && "Houston, we have a SaaS idea!"}
              {currentStep === 9 && "Drumroll please..."}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
