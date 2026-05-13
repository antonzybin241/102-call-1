import { useEffect, useState, useCallback } from 'react'
import { Card } from '../components/ui/Card'
import { api } from '../services/api'
import { DataState } from '../components/ui/DataState'

interface Transaction {
  id: string
  name?: string
  merchantName?: string
  amount: number
  date: string
  category?: string
  subcategory?: string
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    api.get<Transaction[]>(`/transactions?${params}`)
      .then(setTransactions)
      .catch((err) => {
        setTransactions([])
        setError(err instanceof Error ? err.message : "We couldn't load your transactions. Try again in a moment.")
      })
      .finally(() => setLoading(false))
  }, [category, startDate, endDate])

  useEffect(() => { load() }, [load])

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const label = (t: Transaction) => t.merchantName || t.name || 'Other'
  const categories = [...new Set(transactions.map((t) => t.category).filter(Boolean))].sort()

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-surface-900 dark:text-slate-50">Transactions</h1>

      <Card>
        <p className="text-sm font-medium text-surface-500 mb-3">Filters</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-surface-500 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-surface-500 mb-1">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <div>
            <label className="block text-xs text-surface-500 mb-1">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>
      </Card>

      <DataState
        loading={loading}
        error={error}
        empty={!loading && !error && transactions.length === 0}
        emptyMessage="No transactions yet. Link an account to sync transactions."
      >
        <div className="space-y-2">
          {transactions.map((t) => (
            <Card key={t.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center text-lg">
                  {t.category === 'Food' ? '🍔' : t.category === 'Transport' ? '🚗' : t.category === 'Shopping' ? '🛒' : '📦'}
                </div>
                <div>
                  <p className="font-medium text-surface-900 dark:text-slate-50">{label(t)}</p>
                  <p className="text-sm text-surface-500 dark:text-slate-400">
                    {fmtDate(t.date)} {t.category && `• ${t.category}`}
                  </p>
                </div>
              </div>
              <p className={`font-semibold ${Number(t.amount) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {Number(t.amount) < 0 ? '-' : '+'}${Math.abs(Number(t.amount)).toFixed(2)}
              </p>
            </Card>
          ))}
        </div>
      </DataState>
    </div>
  )
}
