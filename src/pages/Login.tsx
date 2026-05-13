import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { ThemeToggle } from '../components/ThemeToggle'
import { getAddress } from 'viem'

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

interface SolanaProvider {
  connect: () => Promise<{ publicKey: { toBase58: () => string } }>
  request?: (opts: { method: string; params?: { message: Uint8Array; display?: string } }) => Promise<{ signature: Uint8Array }>
  signMessage?: (message: Uint8Array, display?: 'utf8') => Promise<{ signature: Uint8Array }>
}

declare global {
  interface Window {
    ethereum?: EthereumProvider
    phantom?: { solana?: SolanaProvider }
    solana?: SolanaProvider
  }
}

export default function Login() {
  const [error, setError] = useState('')
  const [connecting, setConnecting] = useState<string | null>(null)
  const [showWalletOptions, setShowWalletOptions] = useState(false)
  const { loginWithWallet } = useAuth()
  const navigate = useNavigate()

  const connectEvm = async () => {
    setError('')
    setConnecting('evm')
    try {
      const provider = window.ethereum
      if (!provider) {
        setError("We didn't find an Ethereum wallet. Try MetaMask, Coinbase Wallet, or Brave.")
        return
      }

      const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[]
      const rawAddress = accounts[0]
      if (!rawAddress) {
        setError("No account was selected. Please pick one in your wallet and try again.")
        return
      }

      const address = getAddress(rawAddress)

      const nonceRes = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })
      if (!nonceRes.ok) throw new Error('Failed to get sign-in request')
      const { nonce } = await nonceRes.json()

      const signature = (await provider.request({
        method: 'personal_sign',
        params: [nonce, address],
      })) as string

      await loginWithWallet(address, nonce, signature)
      navigate('/')
    } catch (err) {
      if (err instanceof Error) {
        if (err.message?.includes('User rejected') || err.message?.includes('rejected')) setError("You cancelled the signature. No worries — try again when you're ready.")
        else setError(err.message || "We couldn't connect to your wallet. Try again.")
      } else setError("We couldn't connect to your wallet. Try again.")
    } finally {
      setConnecting(null)
    }
  }

  const connectSolana = async () => {
    setError('')
    setConnecting('solana')
    try {
      const provider = window.phantom?.solana ?? window.solana
      if (!provider) {
        setError("We didn't find a Solana wallet. Try Phantom or Solflare.")
        return
      }

      const { publicKey } = await provider.connect()
      const address = publicKey.toBase58()

      const nonceRes = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })
      if (!nonceRes.ok) throw new Error('Failed to get sign-in request')
      const { nonce } = await nonceRes.json()

      const msg = new TextEncoder().encode(nonce)
      const res = provider.request
        ? await provider.request({ method: 'signMessage', params: { message: msg, display: 'utf8' } })
        : await (provider.signMessage?.(msg, 'utf8') ?? Promise.reject(new Error('signMessage not supported')))
      const signature = res.signature
      const signatureB64 = btoa(String.fromCharCode(...signature))

      await loginWithWallet(address, nonce, signatureB64)
      navigate('/')
    } catch (err) {
      if (err instanceof Error) {
        if (err.message?.includes('User rejected') || err.message?.includes('rejected')) setError("You cancelled the signature. No worries — try again when you're ready.")
        else setError(err.message || "We couldn't connect to your wallet. Try again.")
      } else setError("We couldn't connect to your wallet. Try again.")
    } finally {
      setConnecting(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col transition-colors relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-surface-50 via-white to-primary-50/30 dark:from-surface-900 dark:via-surface-900 dark:to-surface-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,var(--tw-gradient-stops))] from-primary-200/40 via-transparent to-transparent dark:from-primary-900/20" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(51,65,85,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(51,65,85,0.15)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      <div className="absolute top-5 right-5 z-10">
        <ThemeToggle />
      </div>

      <div className="relative flex-1 flex flex-col justify-center px-5 sm:px-6 py-12">
        <div className="w-full max-w-[400px] mx-auto">
          {/* Card */}
          <div className="rounded-3xl border border-surface-200/80 dark:border-surface-700/80 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.5)_inset,0_2px_4px_rgba(0,0,0,0.04),0_12px_24px_-8px_rgba(0,0,0,0.08)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_12px_24px_-8px_rgba(0,0,0,0.25)] p-8 sm:p-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-500/10 dark:bg-primary-400/10 text-primary-600 dark:text-primary-400 mb-5 ring-4 ring-primary-500/5 dark:ring-primary-400/10">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-surface-900 dark:text-white mb-2">
                Welcome to FinTrust AI
              </h1>
              <p className="text-surface-500 dark:text-surface-400 text-sm sm:text-base">
                Sign in with MetaMask or other wallets — quick and secure.
              </p>
            </div>

            <div className="space-y-4">
              {error && (
                <div className="rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-sm px-4 py-3 border border-red-200/50 dark:border-red-800/30 flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}
              {!showWalletOptions ? (
                <Button
                  type="button"
                  fullWidth
                  size="lg"
                  className="!py-3.5 !text-base font-semibold shadow-lg shadow-primary-500/25 dark:shadow-primary-500/10 hover:shadow-xl hover:shadow-primary-500/30 transition-shadow"
                  onClick={() => {
                    const hasEvm = !!window.ethereum
                    const hasSolana = !!(window.phantom?.solana ?? window.solana)
                    if (hasEvm && !hasSolana) {
                      connectEvm()
                    } else if (hasSolana && !hasEvm) {
                      connectSolana()
                    } else if (hasEvm && hasSolana) {
                      setShowWalletOptions(true)
                    } else {
                      setError("We didn't find a wallet. Try installing MetaMask or other wallets to get started.")
                    }
                  }}
                  disabled={!!connecting}
                >
                  {connecting ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Connecting…
                    </span>
                  ) : (
                    'Connect Wallet'
                  )}
                </Button>
              ) : (
                <div className="space-y-3 rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-50/80 dark:bg-surface-800/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 px-1">
                    Which wallet do you use?
                  </p>
                  <Button
                    type="button"
                    fullWidth
                    size="lg"
                    className="!py-3"
                    onClick={connectEvm}
                    disabled={!!connecting}
                  >
                    {connecting === 'evm' ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Connecting…
                      </span>
                    ) : (
                      'Ethereum (MetaMask, Coinbase, etc.)'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    fullWidth
                    size="lg"
                    className="!py-3 border border-surface-200 dark:border-surface-600"
                    onClick={connectSolana}
                    disabled={!!connecting}
                  >
                    {connecting === 'solana' ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Connecting…
                      </span>
                    ) : (
                      'Solana (Phantom, Solflare)'
                    )}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowWalletOptions(false)}
                    className="w-full text-sm text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 py-2 transition-colors"
                  >
                    ← Back
                  </button>
                </div>
              )}
              <p className="text-xs text-surface-400 dark:text-surface-500 text-center pt-1">
                You'll just sign a one-time message to confirm it's you. No gas fees.
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="relative py-6 text-center">
        <span className="text-sm font-medium text-surface-400 dark:text-surface-500">FinTrust AI</span>
      </footer>
    </div>
  )
}
