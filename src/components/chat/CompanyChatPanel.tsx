import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { chatApi } from '@/services/api/chat'
import type { ChatCitation } from '@/services/api/chat'
import { getFriendlyApiError } from '@/lib/apiErrors'

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
  citations?: ChatCitation[]
}

const SOURCE_LABELS: Record<string, string> = {
  call_transcript: 'Call',
  decision: 'Analysis',
  memory_entry: 'Memory',
}

interface CompanyChatPanelProps {
  companyId: string
  isDemo?: boolean
}

export default function CompanyChatPanel({ companyId, isDemo }: CompanyChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const question = input.trim()
    if (!question || loading) return

    setMessages((prev) => [...prev, { role: 'user', text: question }])
    setInput('')
    setLoading(true)
    setError(null)

    try {
      if (isDemo) {
        await new Promise((resolve) => setTimeout(resolve, 600))
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: "This is demo mode, so I can't search real call data. Sign in to ask questions grounded in this company's actual calls and analysis.",
          },
        ])
        return
      }

      const result = await chatApi.ask(companyId, question)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: result.answer, citations: result.citations },
      ])
    } catch (err) {
      setError(getFriendlyApiError(err, 'default', "Couldn't get an answer. Please try again."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[560px] rounded-lg border border-border bg-card">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-16 text-sm text-muted-foreground">
            <Sparkles className="h-5 w-5 mx-auto mb-2 text-primary" />
            Ask anything about this company — grounded in its calls, decisions, and memory.
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={
                msg.role === 'user'
                  ? 'max-w-[80%] rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm'
                  : 'max-w-[80%] rounded-lg bg-muted/60 px-3 py-2 text-sm text-foreground'
              }
            >
              <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {msg.citations.map((c, ci) => (
                    <Badge key={ci} variant="secondary" className="text-2xs" title={c.snippet}>
                      {SOURCE_LABELS[c.sourceType] || c.sourceType}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Thinking…
            </div>
          </div>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-border p-3 flex gap-2 items-end">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
          placeholder="Ask a question about this company…"
          className="min-h-[40px] max-h-32"
          rows={1}
        />
        <Button type="submit" size="icon" disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
