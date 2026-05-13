import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  targetDate?: string
}

export default function Savings() {
  const [goals, setGoals] = useState<Goal[]>([
    { id: '1', name: 'Emergency fund', targetAmount: 5000, currentAmount: 2200 },
    { id: '2', name: 'Vacation', targetAmount: 2000, currentAmount: 800 },
  ])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', targetAmount: '', targetDate: '' })

  const addGoal = () => {
    if (!form.name || !form.targetAmount) return
    setGoals((g) => [
      ...g,
      {
        id: String(Date.now()),
        name: form.name,
        targetAmount: parseFloat(form.targetAmount),
        currentAmount: 0,
        targetDate: form.targetDate || undefined,
      },
    ])
    setForm({ name: '', targetAmount: '', targetDate: '' })
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-surface-900">Savings goals</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add goal'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={(e) => { e.preventDefault(); addGoal(); }} className="space-y-4">
            <Input label="Goal name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="e.g. Emergency fund" required />
            <Input label="Target amount ($)" type="number" value={form.targetAmount} onChange={(v) => setForm((f) => ({ ...f, targetAmount: v }))} placeholder="5000" required />
            <Input label="Target date" type="date" value={form.targetDate} onChange={(v) => setForm((f) => ({ ...f, targetDate: v }))} placeholder="Optional" />
            <Button type="submit">Add goal</Button>
          </form>
        </Card>
      )}

      <div className="space-y-4">
        {goals.map((g) => {
          const pct = g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0
          return (
            <Card key={g.id}>
              <div className="flex justify-between items-start mb-2">
                <p className="font-medium text-surface-900">{g.name}</p>
                <p className="text-sm text-surface-500">
                  ${g.currentAmount.toLocaleString()} / ${g.targetAmount.toLocaleString()}
                </p>
              </div>
              <div className="h-2 rounded-full bg-surface-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary-600 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-surface-500 mt-2">{pct.toFixed(0)}% complete</p>
            </Card>
          )
        })}
      </div>

      <p className="text-sm text-surface-500 text-center">
        Connect your accounts to track contributions automatically.
      </p>
    </div>
  )
}
