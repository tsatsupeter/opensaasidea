import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, Search, TrendingUp, Check,
  Wand2, CheckCircle2, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { siteConfig } from '@/lib/site-config'
import type { GenerationStep } from '@/lib/ai'

interface StepDisplay {
  icon: typeof Brain
  text: string
  subtext: string
  color: string
}

const STEP_CONFIG: Record<GenerationStep, StepDisplay> = {
  preparing:        { icon: Search,       text: 'Checking existing ideas...',          subtext: 'Making sure your idea will be unique',           color: 'text-accent' },
  researching:      { icon: TrendingUp,   text: 'Researching market trends...',        subtext: 'Analyzing demand, gaps, and opportunities',      color: 'text-emerald' },
  building_context: { icon: Brain,        text: 'Personalizing your brief...',         subtext: 'Matching your skills and interests',              color: 'text-amber' },
  generating:       { icon: Wand2,        text: 'AI is crafting your idea...',         subtext: 'This is the exciting part, almost there!',       color: 'text-brand' },
  finalizing:       { icon: Check,         text: 'Polishing & verifying...',            subtext: 'Ensuring quality and uniqueness',                 color: 'text-accent' },
  done:             { icon: CheckCircle2, text: 'Your idea is ready!',                 subtext: '',                                                color: 'text-emerald' },
}

const STEP_ORDER: GenerationStep[] = [
  'preparing', 'researching', 'building_context', 'generating', 'finalizing', 'done',
]

const VISIBLE_STEPS = STEP_ORDER.filter(s => s !== 'done')

const MIN_STEP_DISPLAY_MS = 1800

interface GenerationAnimationProps {
  isGenerating: boolean
  currentStep?: GenerationStep | null
  onComplete?: () => void
}

export function GenerationAnimation({ isGenerating, currentStep: externalStep }: GenerationAnimationProps) {
  const [displayStep, setDisplayStep] = useState<GenerationStep | null>(null)
  const [completedSteps, setCompletedSteps] = useState<Set<GenerationStep>>(new Set())
  const stepQueueRef = useRef<GenerationStep[]>([])
  const processingRef = useRef(false)
  const lastStepTimeRef = useRef(0)

  const processQueue = useCallback(() => {
    if (processingRef.current || stepQueueRef.current.length === 0) return
    processingRef.current = true

    const now = Date.now()
    const elapsed = now - lastStepTimeRef.current
    const delay = Math.max(0, MIN_STEP_DISPLAY_MS - elapsed)

    setTimeout(() => {
      const nextStep = stepQueueRef.current.shift()
      if (!nextStep) {
        processingRef.current = false
        return
      }

      // Mark previous display step as completed
      setDisplayStep(prev => {
        if (prev && prev !== nextStep) {
          setCompletedSteps(c => new Set(c).add(prev))
        }
        return nextStep
      })

      lastStepTimeRef.current = Date.now()
      processingRef.current = false

      if (nextStep === 'done') {
        setCompletedSteps(new Set(STEP_ORDER))
      } else {
        // Process next in queue after min display time
        setTimeout(() => processQueue(), MIN_STEP_DISPLAY_MS)
      }
    }, delay)
  }, [])

  useEffect(() => {
    if (!isGenerating) {
      setCompletedSteps(new Set())
      setDisplayStep(null)
      stepQueueRef.current = []
      processingRef.current = false
      lastStepTimeRef.current = 0
      return
    }
  }, [isGenerating])

  useEffect(() => {
    if (!externalStep || !isGenerating) return
    // Avoid queueing duplicates
    const q = stepQueueRef.current
    if (q.length === 0 || q[q.length - 1] !== externalStep) {
      q.push(externalStep)
    }
    processQueue()
  }, [externalStep, isGenerating, processQueue])

  if (!isGenerating) return null

  const activeIdx = displayStep ? STEP_ORDER.indexOf(displayStep) : 0
  const progress = Math.min(((activeIdx + 1) / STEP_ORDER.length) * 100, 100)

  const headerLabel = siteConfig.mode === 'full' ? 'Generating your idea' : 'Generating your SaaS idea'

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
              <h3 className="font-semibold text-sm">{headerLabel}</h3>
              <p className="text-xs text-text-muted">
                {displayStep ? STEP_CONFIG[displayStep].text : 'Starting up...'}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 rounded-full bg-surface-4 overflow-hidden">
            <motion.div
              className="h-full rounded-full gradient-brand"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="px-4 py-3">
          <div className="space-y-1">
            {VISIBLE_STEPS.map((stepKey, i) => {
              const step = STEP_CONFIG[stepKey]
              const isActive = stepKey === displayStep
              const isCompleted = completedSteps.has(stepKey)
              const isPending = !isActive && !isCompleted

              return (
                <motion.div
                  key={stepKey}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{
                    opacity: isPending ? 0.3 : 1,
                    x: 0,
                  }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
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

        {/* Footer with friendly description */}
        <div className="px-6 py-3 border-t border-border bg-surface-2">
          <AnimatePresence mode="wait">
            <motion.p
              key={displayStep}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-xs text-text-muted text-center italic"
            >
              {displayStep === 'preparing' && 'Looking at what\'s already been generated so yours is unique...'}
              {displayStep === 'researching' && 'Scanning real-time trends, communities, and market data...'}
              {displayStep === 'building_context' && 'Tailoring the prompt to your skills and preferences...'}
              {displayStep === 'generating' && 'The AI is working hard. This takes 10-30 seconds...'}
              {displayStep === 'finalizing' && 'Validating quality, pricing, and uniqueness...'}
              {displayStep === 'done' && 'All done! Scroll down to see your new idea.'}
              {!displayStep && 'Warming up the idea engine...'}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
