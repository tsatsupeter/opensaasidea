import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Loader2, Rocket, Code2, Briefcase, Target, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'

const SKILL_OPTIONS = [
  { category: 'frontend', skills: ['React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'TypeScript', 'TailwindCSS', 'HTML/CSS', 'Flutter', 'React Native'] },
  { category: 'backend', skills: ['Node.js', 'Python', 'Go', 'Rust', 'Java', 'PHP', 'Ruby', 'C#', '.NET', 'Express', 'FastAPI', 'Django'] },
  { category: 'ai_ml', skills: ['OpenAI API', 'TensorFlow', 'PyTorch', 'LangChain', 'Computer Vision', 'NLP', 'ML Ops', 'Hugging Face'] },
  { category: 'devops', skills: ['AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Linux'] },
  { category: 'design', skills: ['Figma', 'UI/UX', 'Photoshop', 'Illustrator', 'Motion Design', 'Brand Design'] },
  { category: 'marketing', skills: ['SEO', 'Content Marketing', 'Social Media', 'Email Marketing', 'PPC', 'Analytics', 'Growth Hacking'] },
  { category: 'business', skills: ['Product Management', 'Sales', 'Finance', 'Legal', 'Customer Success', 'Strategy'] },
]

const INTEREST_OPTIONS = [
  'AI/ML', 'FinTech', 'HealthTech', 'EdTech', 'E-commerce', 'SaaS Tools', 'Developer Tools',
  'Social Media', 'Gaming', 'Crypto/Web3', 'Real Estate', 'Travel', 'Food & Beverage',
  'Fitness', 'Adult Content', 'Entertainment', 'HR/Recruiting', 'Legal Tech', 'IoT',
  'Cybersecurity', 'MarTech', 'AgriTech', 'Logistics', 'Sustainability',
]

const PLATFORM_OPTIONS = [
  { value: 'web', label: 'Web App', icon: Code2 },
  { value: 'mobile', label: 'Mobile App', icon: Smartphone },
  { value: 'desktop', label: 'Desktop App', icon: Briefcase },
  { value: 'browser_extension', label: 'Browser Extension', icon: Target },
  { value: 'api', label: 'API Service', icon: Code2 },
]

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner', desc: 'Just starting out, learning the basics' },
  { value: 'intermediate', label: 'Intermediate', desc: '1-3 years experience, can build projects' },
  { value: 'senior', label: 'Senior', desc: '3-7 years, can architect full systems' },
  { value: 'expert', label: 'Expert', desc: '7+ years, deep domain expertise' },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [experienceLevel, setExperienceLevel] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [platforms, setPlatforms] = useState<string[]>([])
  const [bio, setBio] = useState('')
  const [cvText, setCvText] = useState('')

  const toggleItem = (arr: string[], setArr: (v: string[]) => void, item: string) => {
    setArr(arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item])
  }

  const steps = [
    {
      title: 'Your Skills',
      subtitle: 'Select your technical and professional skills',
      icon: Code2,
    },
    {
      title: 'Experience Level',
      subtitle: 'How experienced are you overall?',
      icon: Briefcase,
    },
    {
      title: 'Your Interests',
      subtitle: 'What industries excite you?',
      icon: Target,
    },
    {
      title: 'Preferred Platforms',
      subtitle: 'What would you like to build?',
      icon: Smartphone,
    },
    {
      title: 'About You',
      subtitle: 'Tell us more (optional — helps AI generate better ideas)',
      icon: Rocket,
    },
  ]

  const canProceed = () => {
    if (step === 0) return selectedSkills.length > 0
    if (step === 1) return experienceLevel !== ''
    if (step === 2) return interests.length > 0
    if (step === 3) return platforms.length > 0
    return true
  }

  const handleFinish = async () => {
    if (!user) return
    setLoading(true)

    try {
      await (supabase.from('profiles') as any)
        .update({
          experience_level: experienceLevel,
          interests,
          preferred_platforms: platforms,
          bio: bio || null,
          cv_text: cvText || null,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      const skillCategory = (skill: string): string => {
        for (const cat of SKILL_OPTIONS) {
          if (cat.skills.includes(skill)) return cat.category
        }
        return 'other'
      }

      const skillRows = selectedSkills.map(skill => ({
        user_id: user.id,
        skill_name: skill,
        skill_category: skillCategory(skill),
        proficiency: experienceLevel === 'beginner' ? 'beginner' : experienceLevel === 'intermediate' ? 'intermediate' : 'advanced',
      }))

      if (skillRows.length > 0) {
        await supabase.from('user_skills').insert(skillRows as any)
      }

      await refreshProfile()
      navigate('/dashboard')
    } catch (err) {
      console.error('Onboarding error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          {steps.map((_s, i) => (
            <div key={i} className="flex items-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                i <= step ? 'bg-brand text-white' : 'bg-surface-3 text-text-muted'
              }`}>
                {i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-8 sm:w-16 mx-1 transition-all duration-300 ${
                  i < step ? 'bg-brand' : 'bg-surface-4'
                }`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent className="p-6 sm:p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    {(() => { const Icon = steps[step].icon; return <Icon className="h-5 w-5 text-brand" /> })()}
                    {steps[step].title}
                  </h2>
                  <p className="text-sm text-text-secondary mt-1">{steps[step].subtitle}</p>
                </div>

                {step === 0 && (
                  <div className="space-y-4">
                    {SKILL_OPTIONS.map((cat) => (
                      <div key={cat.category}>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                          {cat.category.replace('_', '/')}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {cat.skills.map((skill) => (
                            <button
                              key={skill}
                              onClick={() => toggleItem(selectedSkills, setSelectedSkills, skill)}
                              className="cursor-pointer"
                            >
                              <Badge variant={selectedSkills.includes(skill) ? 'default' : 'secondary'}>
                                {skill}
                              </Badge>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {step === 1 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {EXPERIENCE_LEVELS.map((level) => (
                      <button
                        key={level.value}
                        onClick={() => setExperienceLevel(level.value)}
                        className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                          experienceLevel === level.value
                            ? 'border-brand bg-brand/10'
                            : 'border-border bg-surface-3 hover:border-border-hover'
                        }`}
                      >
                        <div className="font-semibold text-sm">{level.label}</div>
                        <div className="text-xs text-text-secondary mt-1">{level.desc}</div>
                      </button>
                    ))}
                  </div>
                )}

                {step === 2 && (
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_OPTIONS.map((interest) => (
                      <button
                        key={interest}
                        onClick={() => toggleItem(interests, setInterests, interest)}
                        className="cursor-pointer"
                      >
                        <Badge variant={interests.includes(interest) ? 'default' : 'secondary'}>
                          {interest}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}

                {step === 3 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PLATFORM_OPTIONS.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => toggleItem(platforms, setPlatforms, p.value)}
                        className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                          platforms.includes(p.value)
                            ? 'border-brand bg-brand/10'
                            : 'border-border bg-surface-3 hover:border-border-hover'
                        }`}
                      >
                        <p.icon className="h-5 w-5 text-text-secondary" />
                        <span className="font-medium text-sm">{p.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-text-secondary mb-2 block">Short Bio</label>
                      <Input
                        placeholder="Full-stack developer passionate about AI tools..."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text-secondary mb-2 block">
                        CV / Experience Summary (optional)
                      </label>
                      <Textarea
                        placeholder="Paste your CV text here, or describe your experience, past projects, achievements..."
                        value={cvText}
                        onChange={(e) => setCvText(e.target.value)}
                        className="min-h-[150px]"
                      />
                      <p className="text-xs text-text-muted mt-1">
                        This helps the AI generate ideas tailored to your background. Your data is never shared publicly.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-8">
                  <Button
                    variant="ghost"
                    onClick={() => setStep(step - 1)}
                    disabled={step === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>

                  {step < steps.length - 1 ? (
                    <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button onClick={handleFinish} disabled={loading}>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Rocket className="h-4 w-4" />
                      )}
                      {loading ? 'Setting up...' : 'Launch Dashboard'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
