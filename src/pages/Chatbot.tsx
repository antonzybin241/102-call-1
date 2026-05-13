import { useState, useRef, useEffect } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { api } from '../services/api'

interface Message {
  role: string
  content: string
}

export default function Chatbot() {
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
      setMessages((m) => [...m, { role: 'assistant', content: err instanceof Error ? err.message : 'Something went wrong.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <h1 className="text-xl font-bold text-surface-900 mb-4">AI Financial Coach</h1>

      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {messages.length === 0 && (
            <div className="text-center text-surface-500 py-8">
              <p className="font-medium mb-2">Ask me anything about your finances</p>
              <p className="text-sm">e.g. "How can I save more?" or "Review my spending"</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white rounded-br-md'
                    : 'bg-surface-100 text-surface-900 rounded-bl-md'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-surface-100 rounded-2xl rounded-bl-md px-4 py-2.5">
                <p className="text-sm text-surface-500">Thinking...</p>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="flex gap-2 pt-3 border-t border-surface-100"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your financial coach..."
            className="flex-1 rounded-xl border border-surface-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            Send
          </Button>
        </form>
      </Card>
    </div>
  )
}
