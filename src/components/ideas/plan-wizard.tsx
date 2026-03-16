import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Loader2, Sparkles, ChevronRight, ChevronLeft,
  Check, Share2, Copy, ExternalLink, BookOpen
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { useAuthModal } from '@/components/ui/auth-modal'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { renderMarkdown } from '@/lib/markdown'
import type { SaasIdea } from '@/types/database'

interface PlanQuestion {
  id: string
  question: string
  type: 'choice' | 'multi' | 'text'
  options?: string[]
  answer?: string | string[]
}

interface PlanData {
  id: string
  idea_id: string
  summary: string
  questions: PlanQuestion[]
  plan_content: string | null
  recommended_affiliates: any[]
  status: string
  share_token: string | null
  is_public: boolean
}

type WizardStep = 'loading' | 'summary' | 'questions' | 'generating' | 'plan' | 'error'

interface PlanWizardProps {
  idea: SaasIdea
  open: boolean
  onClose: () => void
  existingPlanId?: string | null
}

export function PlanWizard({ idea, open, onClose, existingPlanId }: PlanWizardProps) {
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()
  const { toast } = useToast()

  const [step, setStep] = useState<WizardStep>('loading')
  const [plan, setPlan] = useState<PlanData | null>(null)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [currentQ, setCurrentQ] = useState(0)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [otherText, setOtherText] = useState<Record<string, string>>({})

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

  const getHeaders = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    return {
      'Authorization': `Bearer ${data?.session?.access_token || ''}`,
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    }
  }, [])

  // Restore saved answers from questions that already have answers
  const restoreAnswers = useCallback((questions: PlanQuestion[]) => {
    const restored: Record<string, string | string[]> = {}
    for (let i = 0; i < questions.length; i++) {
      if (questions[i].answer !== undefined && questions[i].answer !== null) {
        restored[questions[i].id] = questions[i].answer!
      }
    }
    const idx = questions.findIndex(q => !restored[q.id])
    return { restored, firstUnanswered: idx >= 0 ? idx : questions.length - 1 }
  }, [])

  // Resume an existing plan based on its status
  const resumePlan = useCallback(async (planData: PlanData) => {
    setPlan(planData)
    if (planData.status === 'complete' && planData.plan_content) {
      setStep('plan')
    } else if (planData.status === 'planning') {
      // Plan was in generation phase — resume generating
      setStep('generating')
      // Trigger generation
      setTimeout(async () => {
        try {
          const headers = await getHeaders()
          const resp = await fetch(`${supabaseUrl}/functions/v1/plan-idea`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ action: 'generate', plan_id: planData.id }),
          })
          const data = await resp.json()
          if (data.error) { setError(data.error); setStep('error'); return }
          setPlan(prev => prev ? {
            ...prev,
            plan_content: data.plan_content,
            recommended_affiliates: data.recommended_affiliates || [],
            status: 'complete',
            share_token: data.share_token,
          } : prev)
          setStep('plan')
        } catch (err) {
          setError(String(err))
          setStep('error')
        }
      }, 100)
    } else if (planData.status === 'questioning' && planData.questions?.length > 0) {
      // Resume answering questions
      const { restored, firstUnanswered } = restoreAnswers(planData.questions)
      setAnswers(restored)
      setCurrentQ(firstUnanswered)
      setStep('questions')
    } else {
      // Default: show summary
      setAnswers({})
      setCurrentQ(0)
      setStep('summary')
    }
  }, [getHeaders, supabaseUrl, restoreAnswers])

  // Init: summarize idea + generate questions OR resume existing plan
  const initPlan = useCallback(async () => {
    if (!user) { openAuthModal('login'); onClose(); return }
    setStep('loading')
    setError('')
    setOtherText({})
    try {
      // If resuming an existing plan directly (from My Plans page)
      if (existingPlanId) {
        const headers = await getHeaders()
        const resp = await fetch(`${supabaseUrl}/functions/v1/plan-idea`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ action: 'get', plan_id: existingPlanId }),
        })
        const data = await resp.json()
        if (data.error) { setError(data.error); setStep('error'); return }
        if (data.plan) {
          await resumePlan(data.plan)
          return
        }
      }

      const headers = await getHeaders()
      const resp = await fetch(`${supabaseUrl}/functions/v1/plan-idea`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'init', idea_id: idea.id }),
      })
      const data = await resp.json()
      if (data.error) { setError(data.error); setStep('error'); return }

      if (data.existing_plan) {
        // User has an existing plan — resume from wherever they left off
        await resumePlan(data.existing_plan)
        return
      }

      if (data.plan) {
        setPlan(data.plan)
        setCurrentQ(0)
        setAnswers({})
        setStep('summary')
      }
    } catch (err) {
      setError(String(err))
      setStep('error')
    }
  }, [user, idea.id, supabaseUrl, getHeaders, openAuthModal, onClose, existingPlanId, resumePlan])

  useEffect(() => {
    if (open && user) initPlan()
  }, [open, user, initPlan])

  // Submit answers
  const submitAnswers = async () => {
    if (!plan) return
    setStep('loading')
    try {
      const headers = await getHeaders()
      const resp = await fetch(`${supabaseUrl}/functions/v1/plan-idea`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'answer', plan_id: plan.id, answers }),
      })
      const data = await resp.json()
      if (data.error) { setError(data.error); setStep('error'); return }

      if (data.follow_up && data.new_questions?.length) {
        // AI needs more info — show follow-up questions
        setPlan(prev => prev ? { ...prev, questions: data.all_questions } : prev)
        setCurrentQ((plan.questions || []).length) // Jump to first new question
        setStep('questions')
        return
      }

      if (data.ready_to_plan) {
        // Generate the plan
        await generatePlan()
      }
    } catch (err) {
      setError(String(err))
      setStep('error')
    }
  }

  // Generate full plan
  const generatePlan = async () => {
    if (!plan) return
    setStep('generating')
    try {
      const headers = await getHeaders()
      const resp = await fetch(`${supabaseUrl}/functions/v1/plan-idea`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'generate', plan_id: plan.id }),
      })
      const data = await resp.json()
      if (data.error) { setError(data.error); setStep('error'); return }

      setPlan(prev => prev ? {
        ...prev,
        plan_content: data.plan_content,
        recommended_affiliates: data.recommended_affiliates || [],
        status: 'complete',
        share_token: data.share_token,
      } : prev)
      setStep('plan')
    } catch (err) {
      setError(String(err))
      setStep('error')
    }
  }

  const handleAnswer = (questionId: string, value: string | string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
    // Clear other text if switching away from Other
    if (value !== 'Other') {
      setOtherText(prev => { const n = { ...prev }; delete n[questionId]; return n })
    }
  }

  const handleOtherSelect = (questionId: string) => {
    // When "Other" is selected for a choice, set a placeholder and show input
    setAnswers(prev => ({ ...prev, [questionId]: 'Other' }))
    setOtherText(prev => ({ ...prev, [questionId]: prev[questionId] || '' }))
  }

  const handleOtherTextChange = (questionId: string, text: string) => {
    setOtherText(prev => ({ ...prev, [questionId]: text }))
    // Update the actual answer with the custom text (prefixed so AI knows)
    if (text.trim()) {
      setAnswers(prev => ({ ...prev, [questionId]: `Other: ${text}` }))
    } else {
      setAnswers(prev => ({ ...prev, [questionId]: 'Other' }))
    }
  }

  const toggleMultiAnswer = (questionId: string, option: string) => {
    setAnswers(prev => {
      const current = (prev[questionId] as string[]) || []
      const next = current.includes(option)
        ? current.filter(o => o !== option)
        : [...current, option]
      return { ...prev, [questionId]: next }
    })
  }

  const toggleMultiOther = (questionId: string) => {
    const current = (answers[questionId] as string[]) || []
    const hasOther = current.some(o => o === 'Other' || o.startsWith('Other: '))
    if (hasOther) {
      // Remove "Other" entries
      setAnswers(prev => ({ ...prev, [questionId]: current.filter(o => o !== 'Other' && !o.startsWith('Other: ')) }))
      setOtherText(prev => { const n = { ...prev }; delete n[questionId]; return n })
    } else {
      setAnswers(prev => ({ ...prev, [questionId]: [...current, 'Other'] }))
      setOtherText(prev => ({ ...prev, [questionId]: '' }))
    }
  }

  const handleMultiOtherText = (questionId: string, text: string) => {
    setOtherText(prev => ({ ...prev, [questionId]: text }))
    const current = (answers[questionId] as string[]) || []
    // Replace the Other entry with the custom text
    const filtered = current.filter(o => o !== 'Other' && !o.startsWith('Other: '))
    const val = text.trim() ? `Other: ${text}` : 'Other'
    setAnswers(prev => ({ ...prev, [questionId]: [...filtered, val] }))
  }

  // Check if "Other" is effectively selected
  const isOtherSelected = (questionId: string) => {
    const val = answers[questionId]
    if (typeof val === 'string') return val === 'Other' || val.startsWith('Other: ')
    if (Array.isArray(val)) return val.some(v => v === 'Other' || v.startsWith('Other: '))
    return false
  }

  const unansweredQuestions = plan?.questions?.filter(q => {
    const ans = answers[q.id]
    if (ans === undefined || ans === null) return !q.answer
    // "Other" without custom text is not a complete answer
    if (ans === 'Other') return true
    if (Array.isArray(ans) && ans.length === 0) return true
    if (Array.isArray(ans) && ans.some(v => v === 'Other')) return true
    return false
  }) || []
  const allQuestionsAnswered = unansweredQuestions.length === 0 && (plan?.questions?.length || 0) > 0

  const copyShareLink = () => {
    if (!plan?.share_token) return
    const url = `${window.location.origin}/plan/${plan.share_token}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast('Plan link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const currentQuestion = plan?.questions?.[currentQ]
  const isLastQuestion = currentQ >= (plan?.questions?.length || 0) - 1

  if (!open) return null

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-surface-0 border border-border rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-brand/10 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-brand" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-text-primary">Plan: {idea.title}</h2>
                <p className="text-[11px] text-text-muted">
                  {step === 'loading' ? 'Preparing...' :
                   step === 'summary' ? 'Idea Summary' :
                   step === 'questions' ? `Question ${currentQ + 1} of ${plan?.questions?.length || 0}` :
                   step === 'generating' ? 'Generating your plan...' :
                   step === 'plan' ? 'Your Implementation Plan' :
                   'Error'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors cursor-pointer">
              <X className="h-4 w-4 text-text-muted" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {/* Loading */}
            {step === 'loading' && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-8 w-8 text-brand animate-spin" />
                <p className="text-[13px] text-text-muted">AI is analyzing the idea...</p>
              </div>
            )}

            {/* Error */}
            {step === 'error' && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <p className="text-[13px] text-rose">{error}</p>
                <button onClick={initPlan} className="text-[13px] text-brand hover:underline cursor-pointer">Try again</button>
              </div>
            )}

            {/* Summary */}
            {step === 'summary' && plan && (
              <div className="space-y-4">
                <div className="rounded-xl bg-surface-1 border border-border p-4">
                  <h3 className="text-[13px] font-semibold text-text-primary mb-2">AI Summary</h3>
                  <p className="text-[13px] text-text-secondary leading-relaxed">{plan.summary}</p>
                </div>
                <div className="rounded-xl bg-brand/5 border border-brand/20 p-4">
                  <h3 className="text-[13px] font-semibold text-brand mb-1">Let&apos;s personalize your plan</h3>
                  <p className="text-[12px] text-text-muted">
                    Answer {plan.questions?.length === 1 ? '1 quick question' : `a few quick questions`} so the AI can create a plan tailored to your skills, preferences, and goals.
                  </p>
                </div>
              </div>
            )}

            {/* Questions */}
            {step === 'questions' && plan && currentQuestion && (
              <div className="space-y-4">
                {/* Progress */}
                <div className="flex gap-1">
                  {plan.questions.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-1 flex-1 rounded-full transition-colors',
                        i < currentQ ? 'bg-brand' :
                        i === currentQ ? 'bg-brand/60' : 'bg-surface-3'
                      )}
                    />
                  ))}
                </div>

                <div className="space-y-3">
                  <h3 className="text-[15px] font-semibold text-text-primary">{currentQuestion.question}</h3>

                  {currentQuestion.type === 'choice' && currentQuestion.options && (
                    <div className="space-y-2">
                      {currentQuestion.options.map(opt => (
                        <button
                          key={opt}
                          onClick={() => opt.toLowerCase() === 'other' ? handleOtherSelect(currentQuestion.id) : handleAnswer(currentQuestion.id, opt)}
                          className={cn(
                            'w-full text-left px-4 py-3 rounded-xl border text-[13px] transition-all cursor-pointer',
                            (opt.toLowerCase() === 'other' ? isOtherSelected(currentQuestion.id) : answers[currentQuestion.id] === opt)
                              ? 'border-brand bg-brand/10 text-brand font-medium'
                              : 'border-border bg-surface-1 text-text-secondary hover:border-brand/30 hover:bg-surface-2'
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={cn(
                              'h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0',
                              (opt.toLowerCase() === 'other' ? isOtherSelected(currentQuestion.id) : answers[currentQuestion.id] === opt) ? 'border-brand' : 'border-border'
                            )}>
                              {(opt.toLowerCase() === 'other' ? isOtherSelected(currentQuestion.id) : answers[currentQuestion.id] === opt) && (
                                <div className="h-2 w-2 rounded-full bg-brand" />
                              )}
                            </div>
                            {opt}
                          </div>
                        </button>
                      ))}
                      {/* "Other" option — always show if not already in options */}
                      {!currentQuestion.options.some(o => o.toLowerCase() === 'other') && (
                        <button
                          onClick={() => handleOtherSelect(currentQuestion.id)}
                          className={cn(
                            'w-full text-left px-4 py-3 rounded-xl border text-[13px] transition-all cursor-pointer',
                            isOtherSelected(currentQuestion.id)
                              ? 'border-brand bg-brand/10 text-brand font-medium'
                              : 'border-border bg-surface-1 text-text-secondary hover:border-brand/30 hover:bg-surface-2'
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={cn(
                              'h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0',
                              isOtherSelected(currentQuestion.id) ? 'border-brand' : 'border-border'
                            )}>
                              {isOtherSelected(currentQuestion.id) && (
                                <div className="h-2 w-2 rounded-full bg-brand" />
                              )}
                            </div>
                            Other
                          </div>
                        </button>
                      )}
                      {/* Show text input when Other is selected */}
                      {isOtherSelected(currentQuestion.id) && (
                        <input
                          type="text"
                          value={otherText[currentQuestion.id] || ''}
                          onChange={(e) => handleOtherTextChange(currentQuestion.id, e.target.value)}
                          placeholder="Please specify..."
                          autoFocus
                          className="w-full px-4 py-2.5 rounded-xl border border-brand/30 bg-surface-1 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand/50"
                        />
                      )}
                    </div>
                  )}

                  {currentQuestion.type === 'multi' && currentQuestion.options && (
                    <div className="space-y-2">
                      {currentQuestion.options.map(opt => {
                        const isOtherOpt = opt.toLowerCase() === 'other'
                        const selected = isOtherOpt
                          ? isOtherSelected(currentQuestion.id)
                          : ((answers[currentQuestion.id] as string[]) || []).includes(opt)
                        return (
                          <button
                            key={opt}
                            onClick={() => isOtherOpt ? toggleMultiOther(currentQuestion.id) : toggleMultiAnswer(currentQuestion.id, opt)}
                            className={cn(
                              'w-full text-left px-4 py-3 rounded-xl border text-[13px] transition-all cursor-pointer',
                              selected
                                ? 'border-brand bg-brand/10 text-brand font-medium'
                                : 'border-border bg-surface-1 text-text-secondary hover:border-brand/30 hover:bg-surface-2'
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={cn(
                                'h-4 w-4 rounded border flex items-center justify-center shrink-0',
                                selected ? 'border-brand bg-brand' : 'border-border'
                              )}>
                                {selected && <Check className="h-3 w-3 text-white" />}
                              </div>
                              {opt}
                            </div>
                          </button>
                        )
                      })}
                      {/* "Other" option — always show if not already in options */}
                      {!currentQuestion.options.some(o => o.toLowerCase() === 'other') && (() => {
                        const selected = isOtherSelected(currentQuestion.id)
                        return (
                          <button
                            onClick={() => toggleMultiOther(currentQuestion.id)}
                            className={cn(
                              'w-full text-left px-4 py-3 rounded-xl border text-[13px] transition-all cursor-pointer',
                              selected
                                ? 'border-brand bg-brand/10 text-brand font-medium'
                                : 'border-border bg-surface-1 text-text-secondary hover:border-brand/30 hover:bg-surface-2'
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={cn(
                                'h-4 w-4 rounded border flex items-center justify-center shrink-0',
                                selected ? 'border-brand bg-brand' : 'border-border'
                              )}>
                                {selected && <Check className="h-3 w-3 text-white" />}
                              </div>
                              Other
                            </div>
                          </button>
                        )
                      })()}
                      {/* Show text input when Other is selected */}
                      {isOtherSelected(currentQuestion.id) && (
                        <input
                          type="text"
                          value={otherText[currentQuestion.id] || ''}
                          onChange={(e) => handleMultiOtherText(currentQuestion.id, e.target.value)}
                          placeholder="Please specify..."
                          autoFocus
                          className="w-full px-4 py-2.5 rounded-xl border border-brand/30 bg-surface-1 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand/50"
                        />
                      )}
                      <p className="text-[11px] text-text-muted">Select all that apply</p>
                    </div>
                  )}

                  {currentQuestion.type === 'text' && (
                    <textarea
                      value={(answers[currentQuestion.id] as string) || ''}
                      onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                      placeholder="Type your answer..."
                      className="w-full px-4 py-3 rounded-xl border border-border bg-surface-1 text-[13px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-brand/40 min-h-[80px]"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Generating */}
            {step === 'generating' && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-2xl bg-brand/10 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-brand animate-pulse" />
                  </div>
                  <Loader2 className="absolute -bottom-1 -right-1 h-5 w-5 text-brand animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-semibold text-text-primary">Creating your personalized plan</p>
                  <p className="text-[12px] text-text-muted mt-1">This may take 15-30 seconds...</p>
                </div>
              </div>
            )}

            {/* Plan content */}
            {step === 'plan' && plan?.plan_content && (
              <div className="space-y-4">
                {/* Plan markdown rendered */}
                <div
                  className="plan-markdown"
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(plan.plan_content)
                  }}
                />

                {/* Recommended affiliates */}
                {plan.recommended_affiliates && plan.recommended_affiliates.length > 0 && (
                  <div className="rounded-xl border border-brand/20 bg-brand/5 p-4">
                    <h3 className="text-[13px] font-semibold text-brand mb-3">Recommended Tools</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {plan.recommended_affiliates.map((aff: any, i: number) => (
                        <a
                          key={i}
                          href={aff.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg bg-surface-0 border border-border hover:border-brand/30 transition-colors group"
                        >
                          {aff.logo_url ? (
                            <img src={aff.logo_url} alt={aff.display_name} className="h-8 w-8 rounded object-contain" />
                          ) : (
                            <div className="h-8 w-8 rounded bg-surface-2 flex items-center justify-center">
                              <ExternalLink className="h-3.5 w-3.5 text-text-muted" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold text-text-primary group-hover:text-brand truncate">{aff.display_name}</p>
                            <p className="text-[10px] text-text-muted truncate">{aff.reason || aff.tag}</p>
                          </div>
                          <ExternalLink className="h-3 w-3 text-text-muted shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border flex items-center gap-2">
            {step === 'summary' && (
              <button
                onClick={() => setStep('questions')}
                className="ml-auto flex items-center gap-1.5 bg-brand text-white rounded-lg px-4 py-2 text-[13px] font-semibold hover:bg-brand/90 transition-colors cursor-pointer"
              >
                Start Questions <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}

            {step === 'questions' && (
              <>
                <button
                  onClick={() => {
                    if (currentQ > 0) setCurrentQ(c => c - 1)
                    else setStep('summary')
                  }}
                  className="flex items-center gap-1 text-[13px] text-text-muted hover:text-text-primary cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Back
                </button>
                <div className="flex-1" />
                {!isLastQuestion ? (
                  <button
                    onClick={() => setCurrentQ(c => c + 1)}
                    disabled={(() => {
                      const a = answers[currentQuestion?.id || '']
                      if (!a) return true
                      if (a === 'Other') return true
                      if (Array.isArray(a) && (a.length === 0 || a.some(v => v === 'Other'))) return true
                      return false
                    })()}
                    className="flex items-center gap-1.5 bg-brand text-white rounded-lg px-4 py-2 text-[13px] font-semibold hover:bg-brand/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={submitAnswers}
                    disabled={!allQuestionsAnswered}
                    className="flex items-center gap-1.5 bg-brand text-white rounded-lg px-4 py-2 text-[13px] font-semibold hover:bg-brand/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Generate Plan
                  </button>
                )}
              </>
            )}

            {step === 'plan' && (
              <>
                <button
                  onClick={copyShareLink}
                  className="flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-primary cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald" /> : <Share2 className="h-3.5 w-3.5" />}
                  {copied ? 'Copied!' : 'Share'}
                </button>
                <button
                  onClick={() => {
                    if (plan?.plan_content) {
                      navigator.clipboard.writeText(plan.plan_content)
                      toast('Plan copied as markdown!')
                    }
                  }}
                  className="flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-primary cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy
                </button>
                <div className="flex-1" />
                <button
                  onClick={onClose}
                  className="flex items-center gap-1.5 bg-brand text-white rounded-lg px-4 py-2 text-[13px] font-semibold hover:bg-brand/90 transition-colors cursor-pointer"
                >
                  Done
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}

