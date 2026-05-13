import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { DataState } from '../components/ui/DataState'

interface Account {
  id: string
  institutionName: string
  accountName?: string
  mask?: string
  currentBalance: number
  linkedAt: string
}

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [linking, setLinking] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    api.get<Account[]>('/accounts')
      .then(setAccounts)
      .catch((err) => {
        setAccounts([])
        setError(err instanceof Error ? err.message : "We couldn't load your accounts. Try again in a moment.")
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleLink = async () => {
    setLinking(true)
    setLinkError(null)
    try {
      await api.post('/accounts/link', {})
      await load()
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : "We couldn't link that account. Please try again.")
    } finally {
      setLinking(false)
    }
  }

  const handleSync = async (id: string) => {
    try {
      await api.post(`/accounts/${id}/sync`, {})
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync didn't complete. Try again in a moment.")
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-slate-50">Bank Accounts</h1>
        <button
          onClick={handleLink}
          disabled={loading || linking}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {linking ? 'Linking…' : 'Link Account (Mock)'}
        </button>
      </div>

      {linkError && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm px-4 py-3">
          {linkError}
        </div>
      )}

      <p className="text-surface-500 dark:text-surface-400">Link your bank safely through our integration. Use the mock link below to add sample data and explore.</p>

      <DataState
        loading={loading}
        error={error}
        empty={!loading && !error && accounts.length === 0}
        emptyMessage="No accounts yet. Link an account to get started."
        emptyAction={
          <button
            onClick={handleLink}
            disabled={linking}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500"
          >
            Link Account (Mock)
          </button>
        }
      >
        <div className="grid gap-4">
          {accounts.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800/50 p-6"
            >
              <div>
                <h3 className="font-medium text-surface-900 dark:text-slate-200">{a.institutionName}</h3>
                <p className="text-sm text-surface-500 dark:text-slate-400">{a.accountName ?? 'Account'} •••• {a.mask ?? '****'}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                  ${Number(a.currentBalance ?? 0).toFixed(2)}
                </span>
                <button
                  onClick={() => handleSync(a.id)}
                  className="rounded bg-surface-100 dark:bg-surface-700 px-3 py-1 text-sm hover:bg-surface-200 dark:hover:bg-surface-600"
                >
                  Sync
                </button>
              </div>
            </div>
          ))}
        </div>
      </DataState>
    </div>
  )
}
