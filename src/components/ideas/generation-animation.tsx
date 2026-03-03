import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, Search, Globe, MessageSquare, BarChart3, TrendingUp,
  Database, Cpu, FileJson, ShieldCheck, CheckCircle2, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GenerationStep } from '@/lib/ai'

const STEP_CONFIG: Record<GenerationStep, {
  icon: typeof Brain; text: string; subtext: string; color: string
}> = {
  fetching_ideas:    { icon: Database,    text: 'Loading existing ideas for dedup...',        subtext: 'Querying Supabase for 200 recent ideas',    color: 'text-accent' },
  market_intel:      { icon: TrendingUp,  text: 'Fetching real-time market intelligence...',  subtext: 'Product Hunt, trending SaaS categories',    color: 'text-emerald' },
  reddit:            { icon: MessageSquare,text: 'Scanning Reddit for pain points...',         subtext: 'r/SaaS, r/startups, r/Entrepreneur',        color: 'text-brand' },
  trustmrr:          { icon: BarChart3,   text: 'Pulling TrustMRR revenue data...',           subtext: 'Verified MRR & growth benchmarks',           color: 'text-emerald' },
  g2:                { icon: Search,      text: 'Analyzing G2 market segments...',            subtext: 'Buyer personas & competitive landscape',     color: 'text-accent' },
  twitter:           { icon: Globe,       text: 'Reading Twitter/X builder pulse...',         subtext: 'What devs are shipping right now',           color: 'text-brand' },
  building_context:  { icon: Brain,       text: 'Building context & blacklist...',            subtext: 'Dedup rules, market gaps, category balance', color: 'text-amber' },
  calling_ai:        { icon: Cpu,         text: 'Generating idea with AI model...',           subtext: 'This is the big one — hang tight',           color: 'text-brand' },
  parsing:           { icon: FileJson,    text: 'Parsing & validating response...',           subtext: 'Extracting structured JSON data',            color: 'text-accent' },
  dedup_check:       { icon: ShieldCheck, text: 'Running duplicate check...',                 subtext: 'Ensuring uniqueness against all ideas',      color: 'text-emerald' },
  done:              { icon: CheckCircle2,text: 'Idea ready!',                                subtext: '',                                           color: 'text-emerald' },
}

const STEP_ORDER: GenerationStep[] = [
  'fetching_ideas', 'market_intel', 'reddit', 'trustmrr', 'g2', 'twitter',
  'building_context', 'calling_ai', 'parsing', 'dedup_check', 'done',
]

interface GenerationAnimationProps {
  isGenerating: boolean
  currentStep?: GenerationStep | null
  onComplete?: () => void
}

export function GenerationAnimation({ isGenerating, currentStep: externalStep }: GenerationAnimationProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<GenerationStep>>(new Set())
  const [activeStep, setActiveStep] = useState<GenerationStep | null>(null)
  const prevStepRef = useRef<GenerationStep | null>(null)

  useEffect(() => {
    if (!isGenerating) {
      setCompletedSteps(new Set())
      setActiveStep(null)
      prevStepRef.current = null
      return
    }
  }, [isGenerating])

  useEffect(() => {
    if (!externalStep || !isGenerating) return
    // Mark previous step as completed
    if (prevStepRef.current && prevStepRef.current !== externalStep) {
      setCompletedSteps(prev => new Set(prev).add(prevStepRef.current!))
    }
    setActiveStep(externalStep)
    prevStepRef.current = externalStep

    if (externalStep === 'done') {
      setCompletedSteps(prev => {
        const next = new Set(prev)
        STEP_ORDER.forEach(s => next.add(s))
        return next
      })
    }
  }, [externalStep, isGenerating])

  if (!isGenerating) return null

  const activeIdx = activeStep ? STEP_ORDER.indexOf(activeStep) : 0
  const progress = Math.min(((activeIdx + 1) / STEP_ORDER.length) * 100, 100)

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
              <h3 className="font-semibold text-sm">Generating your SaaS idea</h3>
              <p className="text-xs text-text-muted">
                {activeStep ? STEP_CONFIG[activeStep].text : 'Initializing...'}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 rounded-full bg-surface-4 overflow-hidden">
            <motion.div
              className="h-full rounded-full gradient-brand"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="px-4 py-3 max-h-[360px] overflow-y-auto sidebar-scroll">
          <div className="space-y-1">
            {STEP_ORDER.filter(s => s !== 'done').map((stepKey, i) => {
              const step = STEP_CONFIG[stepKey]
              const isActive = stepKey === activeStep
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
                  transition={{ delay: i * 0.05, duration: 0.3 }}
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

        {/* Footer with live step info */}
        <div className="px-6 py-3 border-t border-border bg-surface-2">
          <AnimatePresence mode="wait">
            <motion.p
              key={activeStep}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-xs text-text-muted text-center italic"
            >
              {activeStep === 'fetching_ideas' && 'Checking what ideas already exist so yours is unique...'}
              {activeStep === 'market_intel' && 'Gathering trending products & market categories...'}
              {activeStep === 'reddit' && 'Finding real problems people are complaining about...'}
              {activeStep === 'trustmrr' && 'Calibrating revenue estimates with verified startup data...'}
              {activeStep === 'g2' && 'Mapping buyer personas & market demand...'}
              {activeStep === 'twitter' && 'Spotting what builders are shipping in real-time...'}
              {activeStep === 'building_context' && 'Compiling all intelligence into the AI prompt...'}
              {activeStep === 'calling_ai' && 'AI model is thinking — this takes 10-30 seconds...'}
              {activeStep === 'parsing' && 'Extracting pricing, tech stack, team, marketing...'}
              {activeStep === 'dedup_check' && 'Making sure this idea is truly one-of-a-kind...'}
              {activeStep === 'done' && 'Your idea is ready!'}
              {!activeStep && 'Starting up the generation pipeline...'}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
