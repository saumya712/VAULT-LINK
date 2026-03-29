import { Outlet, Link } from 'react-router-dom'
import { LockIcon, ShieldIcon } from './icons'

export default function Layout() {
  return (
    <div className="scanlines min-h-screen bg-vault-bg bg-grid flex flex-col">
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-neon-green/4 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/3 right-1/4 w-64 h-64 bg-neon-cyan/4 rounded-full blur-3xl pointer-events-none" />

      <header className="relative z-10 border-b border-vault-border/60">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="text-neon-green transition-transform group-hover:scale-110 duration-200">
              <LockIcon size={18} />
            </div>
            <span className="font-mono font-bold text-lg tracking-tight">
              <span className="text-neon-green">VAULT</span>
              <span className="text-gray-300">LINK</span>
            </span>
            <span className="hidden sm:block font-mono text-xs text-gray-600 border border-vault-border rounded px-1.5 py-0.5">
              v1.0
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-gray-500">
              <ShieldIcon size={12} />AES-256-GCM
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse-slow" />
              <span className="font-mono text-xs text-neon-green/70">SECURE</span>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1">
        <Outlet />
      </main>

      <footer className="relative z-10 border-t border-vault-border/30 py-5">
        <div className="max-w-3xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-mono text-xs text-gray-600">
            Server never stores plaintext. Key lives only in your URL.
          </p>
          <div className="flex items-center gap-3 font-mono text-xs text-gray-600">
            <span className="flex items-center gap-1"><ShieldIcon size={10} />Zero-knowledge</span>
            <span>·</span>
            <span>One-read destroy</span>
          </div>
        </div>
      </footer>
    </div>
  )
}