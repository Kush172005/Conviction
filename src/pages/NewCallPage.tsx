import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  MicOff,
  Type,
  FileText,
  ArrowRight,
  Building2,
  Sparkles,
  StopCircle,
  Clock,
  Plus,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import PageHeader from '@/components/layout/PageHeader'
import FadeIn from '@/components/motion/FadeIn'
import { MOCK_COMPANIES } from '@/mocks/data'
import { useAuthStore } from '@/store'
import { companiesApi } from '@/services/api/companies'
import { callsApi } from '@/services/api/calls'
import { cn } from '@/lib/utils'
import { DemoGateOverlay } from '@/components/demo/DemoGate'
import type { Company, CallIntelligenceData } from '@/types'

type InputMode = 'voice' | 'text' | 'transcript'

const MODE_CONFIG: Record<InputMode, { icon: React.ElementType; label: string; description: string }> = {
  voice: {
    icon: Mic,
    label: 'Voice memo',
    description: 'Record your post-call thoughts in real time.',
  },
  text: {
    icon: Type,
    label: 'Brain dump',
    description: 'Type your raw notes, no structure needed.',
  },
  transcript: {
    icon: FileText,
    label: 'Transcript',
    description: 'Paste or upload a meeting transcript.',
  },
}

// ─── Voice Recorder ────────────────────────────────────────────────────────────

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob, mimeType: string) => void
  onRecordingStart: () => void
}

function VoiceRecorder({ onRecordingComplete, onRecordingStart }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [blob, setBlob] = useState<Blob | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function startRecording() {
    setPermissionError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Pick a supported mime type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const recordedBlob = new Blob(chunksRef.current, { type: mimeType })
        setBlob(recordedBlob)
        onRecordingComplete(recordedBlob, mimeType)
        stream.getTracks().forEach((t) => t.stop())
      }

      recorder.start(250)
      setIsRecording(true)
      setSeconds(0)
      setBlob(null)
      onRecordingStart()

      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1)
      }, 1000)
    } catch (err: unknown) {
      const error = err as Error
      if (error.name === 'NotAllowedError') {
        setPermissionError('Microphone access denied. Please allow microphone access in your browser settings.')
      } else {
        setPermissionError('Could not access microphone. Please check your device settings.')
      }
    }
  }

  function stopRecording() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsRecording(false)
    mediaRecorderRef.current?.stop()
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  return (
    <div className="flex flex-col items-center gap-8 py-10">
      {permissionError && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400 max-w-sm text-center">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {permissionError}
        </div>
      )}

      <div className="relative">
        {isRecording && (
          <>
            <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
            <div className="absolute inset-[-12px] rounded-full bg-red-500/10 animate-pulse" />
          </>
        )}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={isRecording ? stopRecording : startRecording}
          className={cn(
            'relative flex h-24 w-24 items-center justify-center rounded-full border-2 transition-all duration-300',
            isRecording
              ? 'border-red-500 bg-red-500/15'
              : 'border-border bg-card hover:border-muted-foreground'
          )}
        >
          {isRecording ? (
            <StopCircle className="h-10 w-10 text-red-400" />
          ) : (
            <Mic className="h-10 w-10 text-foreground" />
          )}
        </motion.button>
      </div>

      <div className="text-center">
        {isRecording ? (
          <div>
            <div className="font-mono text-3xl font-semibold text-foreground tabular-nums">
              {mm}:{ss}
            </div>
            <p className="text-sm text-red-400 mt-1 font-medium">Recording…</p>
            <p className="text-xs text-muted-foreground mt-1">Tap stop when done.</p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-foreground">
              {blob ? 'Recording ready' : 'Ready to record'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {blob
                ? `${mm}:${ss} captured — we'll turn this into your deal brief.`
                : 'Tap the mic and speak your post-call thoughts freely.'}
            </p>
          </div>
        )}
      </div>

      {!isRecording && blob && (
        <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span className="text-sm text-emerald-400 font-medium">Voice memo ready · {mm}:{ss}</span>
        </div>
      )}
    </div>
  )
}

// ─── Add Company Modal ──────────────────────────────────────────────────────────

function AddCompanyModal({
  onCreated,
  onClose,
}: {
  onCreated: (company: Company) => void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const company = await companiesApi.create({
        name: name.trim(),
        website: website.trim() || undefined,
      })
      onCreated(company)
    } catch {
      setError('Failed to create company. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="rounded-xl border border-border bg-card p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Add new company</h3>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs">Company name *</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Acme AI"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs">Website (optional)</Label>
          <Input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://acme.ai"
          />
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button
          variant="conviction"
          size="sm"
          onClick={handleCreate}
          disabled={!name.trim() || loading}
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Create company
        </Button>
      </div>
    </motion.div>
  )
}

// ─── Processing Overlay ─────────────────────────────────────────────────────────

const PROCESSING_STEPS = [
  { label: 'Reading your notes…', delay: 0 },
  { label: 'Finding the key signals…', delay: 2500 },
  { label: 'Matching against your thesis…', delay: 6000 },
  { label: 'Drafting follow-up actions…', delay: 10000 },
  { label: 'Putting together your deal brief…', delay: 15000 },
]

function ProcessingOverlay({ isVoice }: { isVoice: boolean }) {
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    const timers = PROCESSING_STEPS.slice(1).map((step, i) =>
      setTimeout(() => setStepIndex(i + 1), step.delay)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <div className="text-center space-y-6 max-w-sm px-6">
        <div className="flex justify-center">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border-2 border-conviction-500/30" />
            <div className="absolute inset-0 rounded-full border-2 border-conviction-500 border-t-transparent animate-spin" />
            <div className="absolute inset-3 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-conviction-400" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-base font-semibold text-foreground">
            {isVoice ? 'Turning your recording into a deal brief…' : 'Building your deal brief…'}
          </h3>
          <AnimatePresence mode="wait">
            <motion.p
              key={stepIndex}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-sm text-muted-foreground"
            >
              {PROCESSING_STEPS[Math.min(stepIndex, PROCESSING_STEPS.length - 1)].label}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="flex gap-1 justify-center">
          {PROCESSING_STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1 rounded-full transition-all duration-500',
                i <= stepIndex ? 'w-6 bg-conviction-500' : 'w-2 bg-border'
              )}
            />
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          {isVoice
            ? 'Your audio is being converted and your brief is being prepared. Usually ready in 30–90 seconds.'
            : 'Preparing your deal brief. Usually ready in 15–45 seconds.'}
        </p>
      </div>
    </motion.div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function NewCallPage() {
  const navigate = useNavigate()
  const { isDemo, logout } = useAuthStore()

  const [selectedMode, setSelectedMode] = useState<InputMode>('text')
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingError, setProcessingError] = useState<string | null>(null)

  // Companies
  const [companies, setCompanies] = useState<Company[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [showAddCompany, setShowAddCompany] = useState(false)

  // Voice recording
  const audioBlobRef = useRef<{ blob: Blob; mimeType: string } | null>(null)
  const [voiceReady, setVoiceReady] = useState(false)

  // Load companies
  useEffect(() => {
    if (isDemo) {
      setCompanies(MOCK_COMPANIES)
      setSelectedCompanyId(MOCK_COMPANIES[0]?.id || '')
      return
    }
    setLoadingCompanies(true)
    companiesApi
      .list()
      .then((list) => {
        setCompanies(list)
        if (list.length > 0) setSelectedCompanyId(list[0].id)
      })
      .catch(() => {
        setCompanies([])
      })
      .finally(() => setLoadingCompanies(false))
  }, [isDemo])

  function handleCompanyCreated(company: Company) {
    setCompanies((prev) => [company, ...prev])
    setSelectedCompanyId(company.id)
    setShowAddCompany(false)
  }

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId)

  function generateTitle(companyName: string, mode: InputMode): string {
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const modeLabel = mode === 'voice' ? 'Voice call' : mode === 'transcript' ? 'Transcript' : 'Call notes'
    return `${modeLabel} — ${companyName} · ${date}`
  }

  async function handleProcess() {
    if (!selectedCompanyId || !selectedCompany) return
    setProcessingError(null)
    setIsProcessing(true)

    // ── Demo mode: show sign-in gate instead ─────────────────────────────
    if (isDemo) {
      logout()
      navigate('/login', { replace: true })
      return
    }

    try {
      let intel: CallIntelligenceData

      if (selectedMode === 'voice') {
        // ── Voice: upload audio, transcribe + process in one round trip ──────
        const audio = audioBlobRef.current
        if (!audio) return

        const fd = new FormData()
        fd.append('company_id', selectedCompanyId)
        fd.append('title', generateTitle(selectedCompany.name, 'voice'))
        fd.append('audio', audio.blob, 'recording.webm')

        intel = await callsApi.processVoice(fd)
      } else {
        // ── Text / Transcript: create call then process ───────────────────────
        const call = await callsApi.create({
          company_id: selectedCompanyId,
          title: generateTitle(selectedCompany.name, selectedMode),
          input_mode: selectedMode,
          raw_notes: selectedMode === 'text' ? notes : undefined,
          transcript_text: selectedMode === 'transcript' ? notes : undefined,
        })
        intel = await callsApi.process(call.id)
      }

      // Navigate to intelligence page, passing data via state to avoid an extra fetch
      navigate(`/calls/${intel.callId}/intelligence`, { state: { intel } })
    } catch (err: unknown) {
      const error = err as Error
      setProcessingError(
        error.message.includes('408')
          ? 'This is taking longer than expected — please try again or shorten your notes.'
          : error.message || 'Something went wrong. Please try again.'
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const canProcess = selectedMode === 'voice' ? voiceReady : notes.length > 20
  const canSubmit = canProcess && !!selectedCompanyId && !isProcessing

  return (
    <>
      {isProcessing && <ProcessingOverlay isVoice={selectedMode === 'voice'} />}

      <div className="p-6 max-w-3xl mx-auto">
        <FadeIn>
          <PageHeader
            title="Log a call"
            description="Capture your post-call thoughts. Conviction turns them into a structured investment brief."
          />
        </FadeIn>

        <div className="relative space-y-6">
          {isDemo && (
            <DemoGateOverlay
              title="Sign in to log your first call"
              description="See how it works below — then sign in to start building your own deal memory from real founder conversations."
            />
          )}
          {/* Company selector */}
          <FadeIn delay={0.05}>
            <div className="space-y-2">
              <Label>Company</Label>

              {loadingCompanies ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading companies…
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {companies.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCompanyId(c.id)}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                        selectedCompanyId === c.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                      )}
                    >
                      <Building2 className="h-3.5 w-3.5" />
                      {c.name}
                    </button>
                  ))}

                  {!isDemo && (
                    <button
                      onClick={() => setShowAddCompany((v) => !v)}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm transition-colors',
                        showAddCompany
                          ? 'border-primary text-primary bg-primary/5'
                          : 'border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                      )}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add company
                    </button>
                  )}
                </div>
              )}

              {/* Inline company creation */}
              <AnimatePresence>
                {showAddCompany && !isDemo && (
                  <AddCompanyModal
                    onCreated={handleCompanyCreated}
                    onClose={() => setShowAddCompany(false)}
                  />
                )}
              </AnimatePresence>

              {companies.length === 0 && !loadingCompanies && !isDemo && (
                <p className="text-xs text-muted-foreground">
                  No companies yet. Create one above before logging a call.
                </p>
              )}
            </div>
          </FadeIn>

          {/* Mode selector */}
          <FadeIn delay={0.1}>
            <div className="space-y-2">
              <Label>Input method</Label>
              <div className="grid grid-cols-3 gap-3">
                {(Object.entries(MODE_CONFIG) as [InputMode, typeof MODE_CONFIG[InputMode]][]).map(
                  ([mode, config]) => {
                    const Icon = config.icon
                    return (
                      <motion.button
                        key={mode}
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedMode(mode)
                          setVoiceReady(false)
                          audioBlobRef.current = null
                        }}
                        className={cn(
                          'flex flex-col items-center gap-2 rounded-lg border p-4 transition-all duration-150',
                          selectedMode === mode
                            ? 'border-primary bg-primary/10 text-primary shadow-glow-sm'
                            : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <div className="text-center">
                          <span className="text-xs font-medium block">{config.label}</span>
                          <span className="text-[10px] text-muted-foreground hidden sm:block mt-0.5">
                            {config.description}
                          </span>
                        </div>
                      </motion.button>
                    )
                  }
                )}
              </div>
            </div>
          </FadeIn>

          {/* Input area */}
          <FadeIn delay={0.15}>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedMode}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {selectedMode === 'voice' && (
                  <div className="rounded-xl border border-border bg-card">
                    <VoiceRecorder
                      onRecordingStart={() => {
                        setVoiceReady(false)
                        audioBlobRef.current = null
                      }}
                      onRecordingComplete={(blob, mimeType) => {
                        audioBlobRef.current = { blob, mimeType }
                        setVoiceReady(true)
                      }}
                    />
                  </div>
                )}

                {selectedMode === 'text' && (
                  <div className="space-y-2">
                    <Label>Your notes</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={`Brain dump your post-call thoughts here. No structure needed — just capture what you observed, felt, and decided.

Examples:
• Strong founder-market fit — Priya has lived this problem for 5 years
• Revenue numbers look real, 3 F500 pilots with real usage
• Main concern: hyperscaler competition in 18-24 months
• Decision: recommend to IC, 75%+ confidence
• Ask about multimodel roadmap and pricing strategy`}
                      className="min-h-[280px] resize-none font-mono text-sm leading-relaxed"
                    />
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">
                        {notes.length > 0
                          ? `${notes.length} characters — ${notes.split(' ').filter(Boolean).length} words`
                          : 'Write freely — Conviction handles the structure.'}
                      </p>
                      {notes.length > 0 && notes.length < 20 && (
                        <p className="text-xs text-amber-400">Write a bit more for better analysis…</p>
                      )}
                    </div>
                  </div>
                )}

                {selectedMode === 'transcript' && (
                  <div className="space-y-2">
                    <Label>Transcript</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Paste your meeting transcript here. Conviction will extract the key investment signals and structure them into a deal profile.

Supports Fireflies, Otter.ai, Zoom, Gong, and any plain text format."
                      className="min-h-[280px] resize-none text-sm font-mono leading-relaxed"
                    />
                    <p className="text-xs text-muted-foreground">
                      Longer transcripts = richer analysis. Paste as much as you have.
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </FadeIn>

          {/* Error message */}
          <AnimatePresence>
            {processingError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3"
              >
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-400 font-medium">Processing failed</p>
                  <p className="text-xs text-red-400/80 mt-0.5">{processingError}</p>
                </div>
                <button
                  onClick={() => setProcessingError(null)}
                  className="ml-auto text-red-400/60 hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Process CTA */}
          <FadeIn delay={0.2}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-conviction-500/15 flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-conviction-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">Generate your deal brief</p>
                  <p className="text-xs text-muted-foreground">
                    Conviction surfaces strengths, concerns, thesis fit, follow-ups, and a draft email in under a minute.
                  </p>
                </div>
              </div>
              <Button
                variant="conviction"
                onClick={handleProcess}
                disabled={!canSubmit}
                className="w-full sm:w-auto sm:min-w-[140px]"
              >
                  {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Working on it…
                  </div>
                ) : (
                  <>
                    Process
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </FadeIn>
        </div>
      </div>
    </>
  )
}
