import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Metric, Title, DonutChart, BarChart, Flex } from '@tremor/react'
import { api } from '../services/api'
import { DataState } from '../components/ui/DataState'

interface Account {
  id: string
  institutionName?: string
  accountName?: string
  currentBalance?: number
  linkedAt?: string
}

interface InsightCategory {
  category: string
  spent: number
  budget: number | null
  overBudget?: boolean
}

interface MonthlyTrend {
  month: string
  spent: number
  credits: number
}

interface InsightsData {
  totalSpent: number
  totalBudgeted: number
  byCategory: InsightCategory[]
  monthlyTrend?: MonthlyTrend[]
}

const valueFormatter = (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`

export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [insights, setInsights] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      api.get<Account[]>('/accounts').then(setAccounts).catch((err) => {
        setAccounts([])
        setError(err instanceof Error ? err.message : "We couldn't load your accounts. Try again in a moment.")
      }),
      api.get<InsightsData>('/insights/monthly').then(setInsights).catch(() => {
        setInsights(null)
      }),
    ]).finally(() => setLoading(false))
  }, [])

  const totalBalance = accounts.reduce((s, a) => s + (Number(a.currentBalance ?? 0)), 0)

  const pie = insights?.byCategory?.filter((c) => c.spent > 0).map((c) => ({ name: c.category || 'Other', value: c.spent })) ?? []
  const trend = insights?.monthlyTrend ?? []

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-surface-500 dark:text-surface-400">Getting your overview…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6">
        <p className="font-medium text-red-700 dark:text-red-300">Oops, something went wrong</p>
        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Title className="text-surface-900 dark:text-slate-50">Overview</Title>

      <Card className="bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-600 dark:to-blue-800 border-0">
        <Flex flexDirection="col" alignItems="start" className="gap-2">
          <Metric className="text-white/90 text-base font-medium">Total balance</Metric>
          <Metric className="text-white text-3xl">${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Metric>
          <Link to="/accounts" className="mt-2 text-sm font-medium text-white/90 hover:text-white">
            See your accounts →
          </Link>
        </Flex>
      </Card>

      <Flex flexDirection="row" justifyContent="start" className="flex-wrap gap-4">
        <Link to="/budgets" className="flex-1 min-w-[140px]">
          <Card>
            <Metric className="text-surface-500 dark:text-slate-400 text-sm font-medium">Spent this month</Metric>
            <Metric className="text-surface-900 dark:text-slate-50">${insights?.totalSpent?.toFixed(2) ?? '0.00'}</Metric>
            <Metric className="text-slate-500 dark:text-slate-400 text-xs mt-1">
              of ${insights?.totalBudgeted?.toFixed(0) ?? '0'} budgeted
            </Metric>
          </Card>
        </Link>
        <Link to="/loans" className="flex-1 min-w-[140px]">
          <Card>
            <Metric className="text-surface-500 dark:text-slate-400 text-sm font-medium">Loan eligibility</Metric>
            <Metric className="text-blue-600 dark:text-blue-400">See your score</Metric>
            <Metric className="text-slate-500 dark:text-slate-400 text-xs mt-1">Apply for a loan</Metric>
          </Card>
        </Link>
      </Flex>

      {pie.length > 0 ? (
        <Card>
          <Title className="mb-4">Spending by category</Title>
          <DonutChart
            data={pie}
            index="name"
            category="value"
            variant="donut"
            valueFormatter={valueFormatter}
            colors={['blue', 'cyan', 'indigo', 'violet', 'fuchsia', 'slate']}
            className="h-48"
          />
          <Link to="/insights" className="mt-4 inline-block text-sm font-medium text-blue-600 dark:text-blue-400">
            View details →
          </Link>
        </Card>
      ) : (
        <Card>
          <Title className="mb-4">Spending by category</Title>
          <DataState
            empty
            emptyMessage="No spending data yet"
            emptyAction={
              <Link to="/accounts" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
                Link an account to get started →
              </Link>
            }
          >
            {null}
          </DataState>
        </Card>
      )}

      <Card>
        <Title className="mb-4">Last 3 months</Title>
        {trend.length > 0 ? (
          <BarChart
            data={trend}
            index="month"
            categories={['spent', 'credits']}
            colors={['blue', 'emerald']}
            valueFormatter={valueFormatter}
            showLegend
            className="h-44"
          />
        ) : (
          <p className="text-surface-500 dark:text-surface-400 py-8 text-center">Connect an account and add transactions to see your trends here.</p>
        )}
      </Card>

      <div>
        <Title className="mb-3">Quick actions</Title>
        <Flex flexDirection="row" className="flex-wrap gap-3 overflow-x-auto pb-2 -mx-1">
          <Link
            to="/transactions"
            className="flex-shrink-0 rounded-2xl bg-white dark:bg-slate-800 px-5 py-4 shadow border border-slate-100 dark:border-slate-700 min-w-[140px] hover:shadow-md dark:hover:border-blue-500/50"
          >
            <span className="text-2xl">📋</span>
            <Metric className="text-surface-900 dark:text-slate-50 mt-2 text-base">Transactions</Metric>
            <Metric className="text-slate-500 dark:text-slate-400 text-xs font-normal">View and filter</Metric>
          </Link>
          <Link
            to="/savings"
            className="flex-shrink-0 rounded-2xl bg-white dark:bg-slate-800 px-5 py-4 shadow border border-slate-100 dark:border-slate-700 min-w-[140px] hover:shadow-md dark:hover:border-blue-500/50"
          >
            <span className="text-2xl">🎯</span>
            <Metric className="text-surface-900 dark:text-slate-50 mt-2 text-base">Savings</Metric>
            <Metric className="text-slate-500 dark:text-slate-400 text-xs font-normal">Track your goals</Metric>
          </Link>
          <Link
            to="/chatbot"
            className="flex-shrink-0 rounded-2xl bg-white dark:bg-slate-800 px-5 py-4 shadow border border-slate-100 dark:border-slate-700 min-w-[140px] hover:shadow-md dark:hover:border-blue-500/50"
          >
            <span className="text-2xl">💬</span>
            <Metric className="text-surface-900 dark:text-slate-50 mt-2 text-base">AI Coach</Metric>
            <Metric className="text-slate-500 dark:text-slate-400 text-xs font-normal">Get personalized advice</Metric>
          </Link>
        </Flex>
      </div>
    </div>
  )
}
