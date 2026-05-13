import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ThemeToggle } from './ThemeToggle'
import { ChatPanel } from './ChatPanel'

const navItems = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/transactions', label: 'Transactions', icon: '📋' },
  { to: '/budgets', label: 'Budgets', icon: '📊' },
  { to: '/insights', label: 'Insights', icon: '📈' },
  { to: '/savings', label: 'Savings', icon: '🎯' },
  { to: '/loans', label: 'Loans', icon: '💳' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 transition-colors">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border-b border-surface-100 dark:border-surface-800">
        <div className="mx-auto max-w-lg px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold text-primary-600 dark:text-primary-400">
            FinTrust AI
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user?.role === 'admin' && (
              <Link to="/admin" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                Admin
              </Link>
            )}
            <span className="text-sm text-surface-500 dark:text-surface-400 hidden sm:inline truncate max-w-[120px]">
              {user?.walletAddress ? `${user.walletAddress.slice(0, 6)}…${user.walletAddress.slice(-4)}` : user?.email}
            </span>
            <button
              onClick={() => logout().then(() => navigate('/login'))}
              className="text-sm text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-24 pt-6">
        <Outlet />
      </main>

      {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}

      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-20 right-4 z-10 w-14 h-14 rounded-full bg-primary-600 text-white shadow-lg flex items-center justify-center text-xl hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 sm:bottom-6"
        aria-label="Open AI coach"
      >
        💬
      </button>

      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-surface-900 border-t border-surface-100 dark:border-surface-800 safe-area-pb">
        <div className="mx-auto max-w-lg flex justify-around">
          {navItems.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center py-2.5 px-4 min-w-[64px] transition-colors
                ${location.pathname === to ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400 dark:text-surface-500'}`}
            >
              <span className="text-xl mb-0.5">{icon}</span>
              <span className="text-xs font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
