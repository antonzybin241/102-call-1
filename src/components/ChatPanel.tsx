import { useState, useRef, useEffect } from 'react'
import { api } from '../services/api'

interface Message {
  role: string
  content: string
}

export function ChatPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: userMsg }])
    setLoading(true)
    try {
      const history = messages.map(({ role, content }) => ({ role, content }))
      const res = await api.post('/coach/chat', { message: userMsg, history }) as { message: string }
      setMessages((m) => [...m, { role: 'assistant', content: res.message }])
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: err instanceof Error ? err.message : 'Error' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-surface-900 sm:absolute sm:bottom-0 sm:right-0 sm:top-auto sm:left-auto sm:h-[480px] sm:w-[400px] sm:rounded-t-2xl sm:shadow-xl dark:shadow-none dark:ring-1 dark:ring-surface-700">
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100 dark:border-surface-800">
        <h2 className="font-semibold text-surface-900 dark:text-surface-50">AI Coach</h2>
        <button onClick={onClose} className="p-2 -m-2 text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100">
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-surface-500 dark:text-surface-400 text-center py-4">Ask a question...</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && <p className="text-sm text-surface-500 dark:text-surface-400">...</p>}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="p-4 border-t border-surface-100 dark:border-surface-800 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask..."
          className="flex-1 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}
