import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  Type,
  Upload,
  ArrowRight,
  Building2,
  Sparkles,
  StopCircle,
  Plus,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  FileAudio,
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

type InputMode = 'voice' | 'text' | 'recording'

const MODE_CONFIG: Record<InputMode, { icon: React.ElementType; label: string; description: string }> = {
  text: {
    icon: Type,
    label: 'Brain dump',
    description: 'Type quick notes right after the call.',
  },
  voice: {
    icon: Mic,
    label: 'Voice memo',
    description: 'Record a short post-call recap in your own words.',
  },
  recording: {
    icon: Upload,
    label: 'Meeting recording',
    description: 'Upload the call audio — Zoom, Otter, phone memo, etc.',
  },
}

const ACCEPTED_AUDIO = 'audio/*,.m4a,.mp3,.wav,.webm,.mp4,.ogg,.aac'
const MAX_AUDIO_BYTES = 19 * 1024 * 1024 // Gemini inline limit

function guessAudioMime(file: File): string {
  if (file.type && file.type.startsWith('audio/')) return file.type
  const ext = file.name.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    m4a: 'audio/mp4',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    webm: 'audio/webm',
    mp4: 'audio/mp4',
    ogg: 'audio/ogg',
    aac: 'audio/aac',
  }
  return (ext && map[ext]) || 'audio/webm'
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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

// ─── Meeting Recording Upload ───────────────────────────────────────────────────

interface AudioFileUploaderProps {
  file: File | null
  onFileSelect: (file: File | null) => void
}

function AudioFileUploader({ file, onFileSelect }: AudioFileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function validateAndSet(next: File | null) {
    setError(null)
    if (!next) {
      onFileSelect(null)
      return
    }
    if (next.size > MAX_AUDIO_BYTES) {
      setError('File is too large. Please use a recording under 19 MB.')
      return
    }
    onFileSelect(next)
  }

  function handleFiles(files: FileList | null) {
    const next = files?.[0]
    if (!next) return
    validateAndSet(next)
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_AUDIO}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            handleFiles(e.dataTransfer.files)
          }}
          className={cn(
            'w-full rounded-xl border-2 border-dashed p-10 transition-colors',
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-border bg-card hover:border-muted-foreground hover:bg-surface-1/50'
          )}
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Drop your meeting recording here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                or click to browse — MP3, M4A, WAV, WebM, and more
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Zoom exports · Otter downloads · iPhone voice memos · any call audio
            </p>
          </div>
        </button>
      ) : (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <FileAudio className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatFileSize(file.size)} · ready to process
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                validateAndSet(null)
                if (inputRef.current) inputRef.current.value = ''
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {previewUrl && (
            <audio controls src={previewUrl} className="w-full h-9" preload="metadata" />
          )}

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Choose a different file
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        We listen to the full recording, pull out the investment signals, and turn it into your deal brief.
      </p>
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

const PROCESSING_STEPS_TEXT = [
  { label: 'Reading your notes…', delay: 0 },
  { label: 'Finding the key signals…', delay: 2500 },
  { label: 'Matching against your thesis…', delay: 6000 },
  { label: 'Drafting follow-up actions…', delay: 10000 },
  { label: 'Putting together your deal brief…', delay: 15000 },
]

const PROCESSING_STEPS_VOICE = [
  { label: 'Listening to your recording…', delay: 0 },
  { label: 'Finding the key signals…', delay: 3500 },
  { label: 'Matching against your thesis…', delay: 8000 },
  { label: 'Drafting follow-up actions…', delay: 13000 },
  { label: 'Putting together your deal brief…', delay: 18000 },
]

function ProcessingOverlay({ isVoice }: { isVoice: boolean }) {
  const steps = isVoice ? PROCESSING_STEPS_VOICE : PROCESSING_STEPS_TEXT
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    const timers = steps.slice(1).map((step, i) =>
      setTimeout(() => setStepIndex(i + 1), step.delay)
    )
    return () => timers.forEach(clearTimeout)
  }, [isVoice])

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
              {steps[Math.min(stepIndex, steps.length - 1)].label}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="flex gap-1 justify-center">
          {steps.map((_, i) => (
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

  // Voice recording / file upload
  const audioBlobRef = useRef<{ blob: Blob; mimeType: string } | null>(null)
  const [voiceReady, setVoiceReady] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

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
    const modeLabel =
      mode === 'voice'
        ? 'Voice memo'
        : mode === 'recording'
        ? 'Meeting recording'
        : 'Call notes'
    return `${modeLabel} — ${companyName} · ${date}`
  }

  const submitVoiceAudio = useCallback(
    async (
      blob: Blob,
      mimeType: string,
      mode: 'voice' | 'recording',
      filename?: string
    ) => {
      const fd = new FormData()
      fd.append('company_id', selectedCompanyId)
      fd.append('title', generateTitle(selectedCompany!.name, mode))
      fd.append('input_mode', mode)
      const ext = mimeType.includes('mpeg') ? 'mp3' : mimeType.includes('mp4') ? 'm4a' : 'webm'
      fd.append('audio', blob, filename || `recording.${ext}`)
      return callsApi.processVoice(fd)
    },
    [selectedCompanyId, selectedCompany]
  )

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
        const audio = audioBlobRef.current
        if (!audio) return
        intel = await submitVoiceAudio(audio.blob, audio.mimeType, 'voice')
      } else if (selectedMode === 'recording') {
        if (!uploadedFile) return
        intel = await submitVoiceAudio(
          uploadedFile,
          guessAudioMime(uploadedFile),
          'recording',
          uploadedFile.name
        )
      } else {
        const call = await callsApi.create({
          company_id: selectedCompanyId,
          title: generateTitle(selectedCompany.name, 'text'),
          input_mode: 'text',
          raw_notes: notes,
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

  const canProcess =
    selectedMode === 'voice'
      ? voiceReady
      : selectedMode === 'recording'
      ? !!uploadedFile
      : notes.length > 20
  const canSubmit = canProcess && !!selectedCompanyId && !isProcessing

  return (
    <>
      {isProcessing && (
        <ProcessingOverlay isVoice={selectedMode === 'voice' || selectedMode === 'recording'} />
      )}

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
                          setUploadedFile(null)
                          setNotes('')
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

                {selectedMode === 'recording' && (
                  <div className="space-y-2">
                    <Label>Meeting recording</Label>
                    <AudioFileUploader file={uploadedFile} onFileSelect={setUploadedFile} />
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
