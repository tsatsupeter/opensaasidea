import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Upload, FileText, Camera, Save, Loader2, X, Check,
  Briefcase, GraduationCap, Code, Trash2, ClipboardPaste, AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { siteConfig } from '@/lib/site-config'
import type { UserSkill } from '@/types/database'

const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'senior', 'expert'] as const

const INTEREST_OPTIONS = [
  'AI & Machine Learning', 'FinTech', 'HealthTech', 'EdTech', 'E-commerce',
  'Developer Tools', 'Marketing', 'Productivity', 'Social Media', 'Gaming',
  'Cybersecurity', 'IoT & Hardware', 'Real Estate', 'Food & Beverage',
  'Sustainability', 'HR & Recruiting', 'Legal Tech', 'Supply Chain',
  'Content Creation', 'Data Analytics', 'Robotics', 'Agriculture',
  'Fashion & Beauty', 'Sports & Fitness', 'Travel & Hospitality',
]

const PLATFORM_OPTIONS = ['web', 'mobile', 'desktop', 'browser_extension', 'api', 'multi_platform']

const SKILL_CATEGORIES = [
  'frontend', 'backend', 'mobile', 'ai_ml', 'devops',
  'design', 'marketing', 'seo', 'business', 'other',
] as const

export function ProfileManager() {
  const { user, profile, refreshProfile } = useAuth()

  // Profile fields
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [experienceLevel, setExperienceLevel] = useState<string>('')
  const [interests, setInterests] = useState<string[]>([])
  const [platforms, setPlatforms] = useState<string[]>([])

  // CV state
  const [cvText, setCvText] = useState('')
  const [cvFileUrl, setCvFileUrl] = useState('')
  const [cvTab, setCvTab] = useState<'upload' | 'paste'>('upload')
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState('')
  const [uploadProgress, setUploadProgress] = useState('')

  // Skills state
  const [skills, setSkills] = useState<UserSkill[]>([])
  const [newSkill, setNewSkill] = useState('')
  const [newSkillCategory, setNewSkillCategory] = useState<string>('other')

  // UI state
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeSection, setActiveSection] = useState<'profile' | 'cv' | 'skills'>('profile')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load data from profile
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setBio(profile.bio || '')
      setExperienceLevel(profile.experience_level || '')
      setInterests(profile.interests || [])
      setPlatforms(profile.preferred_platforms || [])
      setCvText(profile.cv_text || '')
      setCvFileUrl(profile.cv_file_url || '')
    }
  }, [profile])

  // Load skills
  useEffect(() => {
    if (!user) return
    supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setSkills(data as UserSkill[])
      })
  }, [user])

  // === Profile Save ===
  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)
    setSaved(false)

    const { error } = await (supabase
      .from('profiles') as any)
      .update({
        full_name: fullName || null,
        bio: bio || null,
        experience_level: experienceLevel || null,
        interests,
        preferred_platforms: platforms,
        cv_text: cvText || null,
        cv_file_url: cvFileUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (!error) {
      setSaved(true)
      await refreshProfile()
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  // === CV File Upload & Extract ===
  const handleFileSelect = useCallback(async (file: File) => {
    if (!user) return
    setExtractError('')
    setUploadProgress('')

    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setExtractError('Unsupported file type. Use PDF, PNG, JPG, or WebP.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setExtractError('File too large. Maximum 10MB.')
      return
    }

    // Step 1: Upload to Supabase Storage
    setUploadProgress('Uploading file...')
    const ext = file.name.split('.').pop() || 'pdf'
    const filePath = `${user.id}/cv-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('cv-uploads')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      setExtractError(`Upload failed: ${uploadError.message}`)
      setUploadProgress('')
      return
    }

    const { data: urlData } = supabase.storage
      .from('cv-uploads')
      .getPublicUrl(filePath)

    setCvFileUrl(urlData.publicUrl || filePath)

    // Step 2: Extract text via Edge Function
    setUploadProgress('Extracting text from document...')
    setExtracting(true)

    try {
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string
          const base64Data = result.split(',')[1]
          resolve(base64Data)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const res = await fetch(`${supabaseUrl}/functions/v1/extract-cv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: base64, mimeType: file.type }),
      })

      const data = await res.json()

      if (data.success && data.text) {
        setCvText(data.text)
        setUploadProgress(`Extracted ${data.chars.toLocaleString()} characters`)
      } else {
        setExtractError(data.error || 'Failed to extract text')
        setUploadProgress('')
      }
    } catch (err) {
      setExtractError(`Extraction failed: ${String(err)}`)
      setUploadProgress('')
    } finally {
      setExtracting(false)
    }
  }, [user])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  // === Interest toggle ===
  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    )
  }

  const togglePlatform = (platform: string) => {
    setPlatforms(prev =>
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    )
  }

  // === Skills ===
  const addSkill = async () => {
    if (!user || !newSkill.trim()) return
    const { data, error } = await (supabase
      .from('user_skills') as any)
      .insert({
        user_id: user.id,
        skill_name: newSkill.trim(),
        skill_category: newSkillCategory,
        proficiency: 'intermediate',
      })
      .select()
      .single()

    if (!error && data) {
      setSkills(prev => [...prev, data as UserSkill])
      setNewSkill('')
    }
  }

  const removeSkill = async (skillId: string) => {
    await supabase.from('user_skills').delete().eq('id', skillId)
    setSkills(prev => prev.filter(s => s.id !== skillId))
  }

  // === Delete CV ===
  const handleDeleteCv = async () => {
    setCvText('')
    setCvFileUrl('')
    setUploadProgress('')
    setExtractError('')
  }

  if (!user || !profile) return null

  return (
    <div className="space-y-4">
      {/* Section tabs */}
      <div className="flex gap-1 p-1 bg-surface-1 rounded-xl border border-border w-full sm:w-fit overflow-x-auto">
        {[
          { id: 'profile' as const, icon: User, label: 'Profile' },
          { id: 'cv' as const, icon: FileText, label: 'CV / Resume' },
          { id: 'skills' as const, icon: Code, label: 'Skills' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSection === tab.id
                ? 'bg-brand text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* === PROFILE SECTION === */}
        {activeSection === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4 text-brand" />
                  Basic Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-text-secondary mb-1.5 block">Full Name</label>
                    <Input
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-secondary mb-1.5 block">Email</label>
                    <Input value={profile.email || ''} disabled className="opacity-60" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">Bio</label>
                  <Textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Tell us about yourself, your background, what you're building..."
                    className="min-h-[100px]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">Experience Level</label>
                  <div className="flex flex-wrap gap-2">
                    {EXPERIENCE_LEVELS.map(level => (
                      <button
                        key={level}
                        onClick={() => setExperienceLevel(level === experienceLevel ? '' : level)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                          experienceLevel === level
                            ? 'bg-brand text-white border-brand'
                            : 'bg-surface-2 text-text-secondary border-border hover:border-brand/40'
                        }`}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-accent" />
                  Interests & Platforms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-2 block">Interests (pick all that apply)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {INTEREST_OPTIONS.map(interest => (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                          interests.includes(interest)
                            ? 'bg-brand/10 text-brand border-brand/30'
                            : 'bg-surface-2 text-text-muted border-border hover:border-brand/20'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-text-secondary mb-2 block">Preferred Platforms</label>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORM_OPTIONS.map(platform => (
                      <button
                        key={platform}
                        onClick={() => togglePlatform(platform)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          platforms.includes(platform)
                            ? 'bg-accent/10 text-accent border-accent/30'
                            : 'bg-surface-2 text-text-muted border-border hover:border-accent/20'
                        }`}
                      >
                        {platform.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* === CV SECTION === */}
        {activeSection === 'cv' && (
          <motion.div
            key="cv"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-brand" />
                    Upload or Paste Your CV
                  </CardTitle>
                  <div className="flex gap-1 p-0.5 bg-surface-2 rounded-lg">
                    <button
                      onClick={() => setCvTab('upload')}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        cvTab === 'upload' ? 'bg-brand text-white' : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      <Upload className="h-3 w-3 inline mr-1" />
                      Upload
                    </button>
                    <button
                      onClick={() => setCvTab('paste')}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        cvTab === 'paste' ? 'bg-brand text-white' : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      <ClipboardPaste className="h-3 w-3 inline mr-1" />
                      Paste
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {cvTab === 'upload' ? (
                  <div className="space-y-3">
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-brand/40 hover:bg-brand/5 transition-all"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.webp"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) handleFileSelect(file)
                        }}
                      />
                      {extracting ? (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="h-8 w-8 animate-spin text-brand" />
                          <p className="text-sm text-text-secondary">{uploadProgress}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div className="h-12 w-12 rounded-2xl bg-brand/10 flex items-center justify-center">
                            <Camera className="h-6 w-6 text-brand" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Drop your CV here or click to browse</p>
                            <p className="text-xs text-text-muted mt-1">PDF, PNG, JPG, WebP - up to 10MB</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {uploadProgress && !extracting && (
                      <div className="flex items-center gap-2 text-sm text-emerald">
                        <Check className="h-4 w-4" />
                        {uploadProgress}
                      </div>
                    )}

                    {extractError && (
                      <div className="flex items-center gap-2 text-sm text-rose">
                        <AlertCircle className="h-4 w-4" />
                        {extractError}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-text-muted">Paste your CV content directly. We'll use this to personalize your idea generation.</p>
                    <Textarea
                      value={cvText}
                      onChange={e => setCvText(e.target.value)}
                      placeholder="Paste your CV / resume text here...&#10;&#10;Name: John Doe&#10;Experience: 5 years in software development&#10;Skills: React, Node.js, Python..."
                      className="min-h-[250px] font-mono text-xs leading-relaxed"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Extracted CV Preview */}
            {cvText && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-accent" />
                      Extracted CV Content
                      <Badge variant="success" className="ml-2">{cvText.length.toLocaleString()} chars</Badge>
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={handleDeleteCv} className="text-rose hover:text-rose">
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Clear
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-surface-2 rounded-xl p-4 max-h-[300px] overflow-y-auto">
                    <pre className="text-xs text-text-secondary whitespace-pre-wrap font-mono leading-relaxed">
                      {cvText}
                    </pre>
                  </div>
                  <p className="text-xs text-text-muted mt-3">
                    This content is used to personalize your idea generation based on your experience, skills, and background.
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* === SKILLS SECTION === */}
        {activeSection === 'skills' && (
          <motion.div
            key="skills"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Code className="h-4 w-4 text-brand" />
                  Your Skills
                  <Badge variant="secondary" className="ml-2">{skills.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add skill */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={newSkill}
                    onChange={e => setNewSkill(e.target.value)}
                    placeholder="Add a skill (e.g. React, Python, UI Design...)"
                    onKeyDown={e => e.key === 'Enter' && addSkill()}
                    className="flex-1"
                  />
                  <div className="flex gap-2">
                    <select
                      value={newSkillCategory}
                      onChange={e => setNewSkillCategory(e.target.value)}
                      className="h-10 rounded-xl border border-border bg-surface-2 px-2 text-sm text-text-primary flex-1 sm:flex-none"
                    >
                      {SKILL_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                    <Button onClick={addSkill} disabled={!newSkill.trim()} size="sm" className="h-10 px-4 shrink-0">
                      Add
                    </Button>
                  </div>
                </div>

                {/* Skills list */}
                {skills.length > 0 ? (
                  <div className="space-y-2">
                    {SKILL_CATEGORIES.map(cat => {
                      const catSkills = skills.filter(s => s.skill_category === cat)
                      if (!catSkills.length) return null
                      return (
                        <div key={cat}>
                          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                            {cat.replace(/_/g, ' ')}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {catSkills.map(skill => (
                              <div
                                key={skill.id}
                                className="group flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand/10 text-brand border border-brand/20 text-xs font-medium"
                              >
                                {skill.skill_name}
                                <button
                                  onClick={() => removeSkill(skill.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-text-muted">
                    <Code className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No skills added yet</p>
                    <p className="text-xs mt-1">Add your skills so we can generate better ideas for you</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save button — sticky bottom */}
      <div className="sticky bottom-4 z-10">
        <div className="flex items-center justify-end gap-3 p-3 bg-surface-1/80 backdrop-blur-xl rounded-xl border border-border shadow-lg">
          <AnimatePresence>
            {saved && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="text-sm text-emerald flex items-center gap-1"
              >
                <Check className="h-4 w-4" />
                Saved!
              </motion.span>
            )}
          </AnimatePresence>
          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
