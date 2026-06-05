import { useState, useRef } from 'react'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import PageHeader from '@/components/layout/PageHeader'
import FadeIn from '@/components/motion/FadeIn'
import { MOCK_COMPANIES } from '@/mocks/data'
import { cn } from '@/lib/utils'

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

function VoiceRecorder({ onDone }: { onDone: () => void }) {
  const [isRecording, setIsRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function toggleRecording() {
    if (isRecording) {
      setIsRecording(false)
      if (intervalRef.current) clearInterval(intervalRef.current)
      onDone()
    } else {
      setIsRecording(true)
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1)
      }, 1000)
    }
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  return (
    <div className="flex flex-col items-center gap-8 py-10">
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
          onClick={toggleRecording}
          className={cn(
            'relative flex h-24 w-24 items-center justify-center rounded-full border-2 transition-all duration-300',
            isRecording
              ? 'border-red-500 bg-red-500/15 recording-active'
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
              {seconds > 0 ? 'Recording saved' : 'Ready to record'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {seconds > 0
                ? `${mm}:${ss} captured`
                : 'Tap the mic and speak your post-call thoughts.'}
            </p>
          </div>
        )}
      </div>

      {!isRecording && seconds > 0 && (
        <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-2">
          <Clock className="h-4 w-4 text-emerald-400" />
          <span className="text-sm text-emerald-400 font-medium">Voice memo ready</span>
        </div>
      )}
    </div>
  )
}

export default function NewCallPage() {
  const navigate = useNavigate()
  const [selectedMode, setSelectedMode] = useState<InputMode>('text')
  const [selectedCompany, setSelectedCompany] = useState(MOCK_COMPANIES[0].id)
  const [notes, setNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [voiceDone, setVoiceDone] = useState(false)

  async function handleProcess() {
    setIsProcessing(true)
    await new Promise((r) => setTimeout(r, 1800))
    navigate('/calls/call_04/intelligence')
  }

  const canProcess = selectedMode === 'voice' ? voiceDone : notes.length > 20

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <FadeIn>
        <PageHeader
          title="Log a call"
          description="Capture your post-call reasoning. Conviction will structure it into deal intelligence."
        />
      </FadeIn>

      <div className="space-y-6">
        {/* Company selector */}
        <FadeIn delay={0.05}>
          <div className="space-y-2">
            <Label>Company</Label>
            <div className="flex flex-wrap gap-2">
              {MOCK_COMPANIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCompany(c.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                    selectedCompany === c.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                  )}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  {c.name}
                </button>
              ))}
            </div>
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
                      onClick={() => setSelectedMode(mode)}
                      className={cn(
                        'flex flex-col items-center gap-2 rounded-lg border p-4 transition-all duration-150',
                        selectedMode === mode
                          ? 'border-primary bg-primary/10 text-primary shadow-glow-sm'
                          : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{config.label}</span>
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
                  <VoiceRecorder onDone={() => setVoiceDone(true)} />
                </div>
              )}

              {selectedMode === 'text' && (
                <div className="space-y-2">
                  <Label>Your notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Brain dump your post-call thoughts here. No structure needed — just capture what you observed, felt, and decided.

Examples:
• Strong founder-market fit — Priya has lived this problem
• Revenue numbers look real, 3 F500 pilots with real usage
• Main concern: hyperscaler competition in 18-24 months
• Decision: recommend to IC, 75%+ confidence..."
                    className="min-h-[280px] resize-none font-mono text-sm leading-relaxed"
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      {notes.length > 0 ? `${notes.length} characters` : 'Write freely — Conviction handles the structure.'}
                    </p>
                    {notes.length > 0 && notes.length < 20 && (
                      <p className="text-xs text-amber-400">Write a bit more…</p>
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
                    placeholder="Paste your meeting transcript here. Conviction will extract the key investment signals and structure them into a deal profile..."
                    className="min-h-[280px] resize-none text-sm font-mono leading-relaxed"
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports Fireflies, Otter.ai, Zoom transcripts, and any other format.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </FadeIn>

        {/* Process CTA */}
        <FadeIn delay={0.2}>
          <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-conviction-500/15">
                <Sparkles className="h-4 w-4 text-conviction-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Structure deal intelligence</p>
                <p className="text-xs text-muted-foreground">
                  AI will extract strengths, concerns, thesis fit, and action items.
                </p>
              </div>
            </div>
            <Button
              variant="conviction"
              onClick={handleProcess}
              disabled={!canProcess || isProcessing}
              className="min-w-[140px]"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Analysing…
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
  )
}
