'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { StateScore } from '@/lib/types'
import { DIMENSIONS } from '@/lib/constants'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED = [
  "What's the single biggest risk here?",
  "Is this state viable for cold chain expansion?",
  "How does monsoon season affect operations?",
  "Which neighbouring state is safer?",
  "What should an FMCG company prioritise?",
]

interface AnalystChatProps {
  context: StateScore | StateScore[]
  sector?: string
}

export function AnalystChat({ context, sector = 'default' }: AnalystChatProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(question: string) {
    if (!question.trim() || streaming) return
    setMessages(m => [...m, { role: 'user', content: question }])
    setInput('')
    setStreaming(true)
    setMessages(m => [...m, { role: 'assistant', content: '' }])

    try {
      const r = await fetch('/api/analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context, sector }),
      })
      const reader = r.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return

      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        full += chunk
        setMessages(m => {
          const copy = [...m]
          copy[copy.length - 1] = { role: 'assistant', content: full }
          return copy
        })
      }
    } catch (e) {
      setMessages(m => {
        const copy = [...m]
        copy[copy.length - 1] = { role: 'assistant', content: 'Sorry, the analyst is unavailable right now.' }
        return copy
      })
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            className="mb-3 w-80 bg-bg-base border border-border-default rounded-2xl shadow-2xl flex flex-col"
            style={{ height: 420 }}
          >
            <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-text-primary">AI Analyst</div>
                <div className="text-xs text-text-tertiary">Powered by Claude</div>
              </div>
              <button onClick={() => setOpen(false)} className="text-text-tertiary hover:text-text-primary text-lg">×</button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-text-tertiary">Ask me anything about the supply chain data:</p>
                  {SUGGESTED.map(q => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="w-full text-left text-xs px-3 py-2 rounded-lg border border-border-default text-text-secondary hover:text-text-primary hover:border-accent/50 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
                  <div
                    className={`inline-block max-w-[90%] text-xs px-3 py-2 rounded-xl ${
                      m.role === 'user'
                        ? 'bg-accent text-bg-void'
                        : 'bg-bg-elevated text-text-primary'
                    }`}
                  >
                    {m.content || (streaming && i === messages.length - 1 ? '…' : '')}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="p-3 border-t border-border-subtle">
              <form onSubmit={e => { e.preventDefault(); send(input) }} className="flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 bg-bg-elevated border border-border-default rounded-lg px-3 py-1.5 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={streaming || !input.trim()}
                  className="text-xs px-3 py-1.5 bg-accent text-bg-void rounded-lg font-medium disabled:opacity-40"
                >
                  Send
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-accent text-bg-void px-4 py-2.5 rounded-full font-medium text-sm shadow-lg hover:brightness-110 transition-all"
      >
        <span>Ask the Analyst</span>
        <span className="text-base">{open ? '↓' : '↑'}</span>
      </button>
    </div>
  )
}
