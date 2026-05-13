import { useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { api } from '../services/api'

export default function Loans() {
  const [eligibility, setEligibility] = useState<{
    riskScore: number
    decision: string
    reasonCodes: { code: string; description: string }[]
    recommendedLimit?: number
  } | null>(null)
  const [applyForm, setApplyForm] = useState({ amount: '', termMonths: '12' })
  const [applied, setApplied] = useState(false)
  const [loading, setLoading] = useState(false)

  const [eligibilityLoading, setEligibilityLoading] = useState(true)
  const [eligibilityError, setEligibilityError] = useState<string | null>(null)

  const loadEligibility = () => {
    setEligibilityLoading(true)
    setEligibilityError(null)
    api.get('/loans/eligibility')
      .then(setEligibility)
      .catch((err) => {
        setEligibility(null)
        setEligibilityError(err instanceof Error ? err.message : "We couldn't load your eligibility. Give it another try.")
      })
      .finally(() => setEligibilityLoading(false))
  }

  useEffect(() => { loadEligibility() }, [])

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/loans/apply', {
        amount: parseFloat(applyForm.amount),
        termMonths: parseInt(applyForm.termMonths, 10),
      })
      setApplied(true)
      setApplyForm({ amount: '', termMonths: '12' })
    } catch (err) {
      alert(err instanceof Error ? err.message : "We couldn't submit your application. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-surface-900">Loans</h1>

      <Card>
        <p className="text-sm font-medium text-surface-500 mb-2">Where you stand</p>
        {eligibilityLoading ? (
          <div className="flex items-center gap-3 py-4">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-surface-500">Checking your eligibility…</span>
          </div>
        ) : eligibilityError ? (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{eligibilityError}</p>
            <button onClick={loadEligibility} className="mt-2 text-sm font-medium text-primary-600 hover:underline">Try again</button>
          </div>
        ) : eligibility ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-surface-900">{eligibility.riskScore}</p>
                <p className="text-sm text-surface-500">Your risk score (lower is better)</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium
                  ${eligibility.decision === 'approve' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
              >
                {eligibility.decision === 'approve' ? "You're eligible" : 'Not quite there yet'}
              </span>
            </div>
            {eligibility.recommendedLimit && (
              <p className="mt-3 text-sm text-surface-600">
                We suggest up to <strong>${eligibility.recommendedLimit.toLocaleString()}</strong>
              </p>
            )}
            <div className="mt-4 pt-4 border-t border-surface-100">
              <p className="text-xs font-medium text-surface-500 mb-2">Why this score?</p>
              <ul className="text-xs text-surface-600 space-y-1">
                {eligibility.reasonCodes?.slice(0, 5).map((r: { code: string; description: string }, i: number) => (
                  <li key={i}>{r.code}: {r.description}</li>
                ))}
              </ul>
            </div>
            <Button variant="secondary" size="sm" className="mt-3" onClick={loadEligibility}>
              Refresh
            </Button>
          </>
        ) : (
          <>
            <p className="text-surface-500 text-sm mb-3">Connect your accounts and add a few transactions so we can see how you're doing.</p>
            <Button size="sm" onClick={loadEligibility}>Check my eligibility</Button>
          </>
        )}
      </Card>

      <Card>
        <p className="text-sm font-medium text-surface-500 mb-4">Apply for a loan</p>
        {applied ? (
          <p className="text-green-600 font-medium">We've received your application. We'll be in touch soon.</p>
        ) : (
          <form onSubmit={handleApply} className="space-y-4">
            <Input
              label="Loan amount ($)"
              type="number"
              value={applyForm.amount}
              onChange={(v) => setApplyForm((f) => ({ ...f, amount: v }))}
              placeholder="e.g. 1000"
              required
            />
            <div>
              <label className="block text-sm font-medium text-surface-500 mb-1.5">Term (months)</label>
              <select
                value={applyForm.termMonths}
                onChange={(e) => setApplyForm((f) => ({ ...f, termMonths: e.target.value }))}
                className="w-full rounded-xl border border-surface-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="6">6 months</option>
                <option value="12">12 months</option>
                <option value="24">24 months</option>
                <option value="36">36 months</option>
              </select>
            </div>
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Submitting…' : 'Submit application'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}
