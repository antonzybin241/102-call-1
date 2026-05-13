import { useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import { api } from '../services/api'

type Tab = 'users' | 'loans' | 'risk' | 'fraud' | 'audit'

interface User {
  id: string
  walletAddress?: string | null
  email?: string | null
  firstName: string | null
  lastName: string | null
  role: string
  isActive: boolean
  createdAt: string
}

function userLabel(u: { email?: string | null; walletAddress?: string | null }) {
  return u.email ?? (u.walletAddress ? `${u.walletAddress.slice(0, 8)}…` : '—')
}

interface Loan {
  id: string
  amount: string
  status: string
  termMonths: number
  appliedAt: string
  user: { walletAddress?: string | null; email?: string | null; firstName: string | null; lastName: string | null }
}

interface RiskScore {
  id: string
  userId: string
  riskScore: number
  decision: string
  recommendedLimit: string | null
  createdAt: string
  user?: { walletAddress?: string | null; email?: string | null; firstName: string | null; lastName: string | null }
}

interface FraudAlert {
  id: string
  userId: string
  signalType: string
  severity: string
  description: string | null
  createdAt: string
  user?: { walletAddress?: string | null; email?: string | null }
}

interface AuditLog {
  id: string
  userId: string | null
  action: string
  resourceType: string | null
  resourceId: string | null
  createdAt: string
  userEmail?: string
}

const tabs: { id: Tab; label: string }[] = [
  { id: 'users', label: 'Users' },
  { id: 'loans', label: 'Loan Applications' },
  { id: 'risk', label: 'Risk Scores' },
  { id: 'fraud', label: 'Fraud Alerts' },
  { id: 'audit', label: 'Audit Log' },
]

export default function Admin() {
  const [tab, setTab] = useState<Tab>('users')
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [riskScores, setRiskScores] = useState<RiskScore[]>([])
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])

  useEffect(() => {
    setLoading(true)
    const load = async () => {
      try {
        if (tab === 'users') setUsers(await api.get('/admin/users'))
        else if (tab === 'loans') setLoans(await api.get('/admin/loans'))
        else if (tab === 'risk') setRiskScores(await api.get('/admin/risk-scores'))
        else if (tab === 'fraud') setFraudAlerts(await api.get('/admin/fraud-alerts'))
        else setAuditLogs(await api.get('/admin/audit-logs'))
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tab])

  const formatDate = (d: string) => new Date(d).toLocaleString()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-surface-900">Compliance Dashboard</h1>
        <p className="text-sm text-surface-500 mt-0.5">Admin oversight for fintech compliance</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors
              ${tab === t.id ? 'bg-primary-600 text-white' : 'bg-white text-surface-600 hover:bg-surface-100'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        {loading ? (
          <p className="py-12 text-center text-surface-500">Loading...</p>
        ) : tab === 'users' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Email / Wallet</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-surface-50 last:border-0">
                    <td className="px-4 py-3 text-sm text-surface-900 font-mono text-xs">{userLabel(u)}</td>
                    <td className="px-4 py-3 text-sm text-surface-700">{u.firstName} {u.lastName}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-surface-100 text-surface-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{u.isActive ? 'Active' : 'Inactive'}</td>
                    <td className="px-4 py-3 text-sm text-surface-500">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <p className="py-8 text-center text-surface-500">No users</p>}
          </div>
        ) : tab === 'loans' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Term</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Applied</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((l) => (
                  <tr key={l.id} className="border-b border-surface-50 last:border-0">
                    <td className="px-4 py-3 text-sm text-surface-900 font-mono text-xs">{l.user ? userLabel(l.user) : '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium">${Number(l.amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-surface-700">{l.termMonths} mo</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        l.status === 'approved' ? 'bg-green-100 text-green-700' :
                        l.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-surface-100 text-surface-600'
                      }`}>{l.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-surface-500">{formatDate(l.appliedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loans.length === 0 && <p className="py-8 text-center text-surface-500">No loan applications</p>}
          </div>
        ) : tab === 'risk' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Risk Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Decision</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Limit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {riskScores.map((r) => (
                  <tr key={r.id} className="border-b border-surface-50 last:border-0">
                    <td className="px-4 py-3 text-sm text-surface-900 font-mono text-xs">{r.user ? userLabel(r.user) : r.userId}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${r.riskScore <= 40 ? 'text-green-600' : r.riskScore <= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                        {r.riskScore}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.decision === 'approve' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {r.decision}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{r.recommendedLimit ? `$${Number(r.recommendedLimit).toLocaleString()}` : '—'}</td>
                    <td className="px-4 py-3 text-sm text-surface-500">{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {riskScores.length === 0 && <p className="py-8 text-center text-surface-500">No risk scores</p>}
          </div>
        ) : tab === 'fraud' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Severity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {fraudAlerts.map((f) => (
                  <tr key={f.id} className="border-b border-surface-50 last:border-0">
                    <td className="px-4 py-3 text-sm text-surface-900 font-mono text-xs">{f.user ? userLabel(f.user) : f.userId}</td>
                    <td className="px-4 py-3 text-sm font-medium">{f.signalType}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        f.severity === 'critical' ? 'bg-red-100 text-red-700' :
                        f.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                        f.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-surface-100 text-surface-600'
                      }`}>{f.severity}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-surface-600 max-w-xs truncate">{f.description ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-surface-500">{formatDate(f.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {fraudAlerts.length === 0 && <p className="py-8 text-center text-surface-500">No fraud alerts</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-surface-500">Resource</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((l) => (
                  <tr key={l.id} className="border-b border-surface-50 last:border-0">
                    <td className="px-4 py-3 text-sm text-surface-500">{formatDate(l.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-surface-700">{(l as AuditLog & { userEmail?: string }).userEmail ?? l.userId ?? '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium">{l.action}</td>
                    <td className="px-4 py-3 text-sm text-surface-600">{l.resourceType ?? '—'} {l.resourceId ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {auditLogs.length === 0 && <p className="py-8 text-center text-surface-500">No audit logs</p>}
          </div>
        )}
      </Card>
    </div>
  )
}
