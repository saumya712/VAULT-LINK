import { useState } from 'react'
import { createSecret } from '../utils/api'
import CopyButton from '../components/copybutton'
import Spinner from '../components/spinner'
import { LockIcon, KeyIcon, ClockIcon, FireIcon, AlertIcon, ArrowRightIcon, CheckIcon, EyeIcon, EyeOffIcon } from '../components/icons'

const TTL_OPTIONS = [
  { label: '1 hr',   value: 1 },
  { label: '6 hrs',  value: 6 },
  { label: '12 hrs', value: 12 },
  { label: '24 hrs', value: 24 },
  { label: '3 days', value: 72 },
  { label: '7 days', value: 168 },
]

export default function CreatePage() {
  const [content, setContent]       = useState('')
  const [ttl, setTtl]               = useState(24)
  const [usePass, setUsePass]       = useState(false)
  const [passphrase, setPassphrase] = useState('')
  const [showPass, setShowPass]     = useState(false)
  const [state, setState]           = useState('idle')
  const [result, setResult]         = useState(null)
  const [error, setError]           = useState('')
  const MAX = 10000

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setState('loading')
    setError('')
    try {
      const res = await createSecret({
        content: content.trim(),
        ttlHours: ttl,
        passphrase: usePass ? passphrase : '',
      })
      setResult(res)
      setState('success')
    } catch (err) {
      setError(err.message)
      setState('error')
    }
  }

  const reset = () => {
    setContent(''); setPassphrase(''); setUsePass(false)
    setResult(null); setError(''); setState('idle')
  }

  const formatExpiry = (iso) => {
    try { return new Date(iso).toLocaleString() } catch { return iso }
  }

  if (state === 'success') {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 animate-slide-up">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-neon-green/30 bg-neon-green/5 mb-5 animate-glow">
            <div className="text-neon-green"><CheckIcon size={30} /></div>
          </div>
          <h1 className="font-mono text-2xl font-bold text-neon-green mb-2">Secret Sealed</h1>
          <p className="text-gray-400 text-sm font-mono">Encrypted and stored. Self-destructs after one view.</p>
        </div>

        <div className="bg-vault-card border border-neon-green/20 rounded-xl p-6 mb-4"
             style={{ boxShadow: '0 0 30px rgba(0,255,136,0.06)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-xs text-gray-500 uppercase tracking-widest">Shareable Link</span>
            <div className="badge-success">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse-slow" />
              ACTIVE
            </div>
          </div>
          <div className="bg-vault-bg border border-vault-border rounded-lg px-4 py-3 font-mono text-sm text-neon-green break-all select-all mb-4">
            {result.url}
          </div>
          <CopyButton text={result.url} className="w-full justify-center py-2" />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-vault-card border border-vault-border rounded-lg p-4">
            <div className="flex items-center gap-1.5 text-gray-500 text-xs font-mono mb-1.5">
              <ClockIcon size={12} />EXPIRES
            </div>
            <div className="font-mono text-xs text-gray-300">{formatExpiry(result.expires_at)}</div>
          </div>
          <div className="bg-vault-card border border-vault-border rounded-lg p-4">
            <div className="flex items-center gap-1.5 text-gray-500 text-xs font-mono mb-1.5">
              <FireIcon size={12} />READS
            </div>
            <div className="font-mono text-xs text-neon-red">1 — then destroyed</div>
          </div>
        </div>

        <div className="flex gap-3 bg-neon-amber/5 border border-neon-amber/20 rounded-lg p-4 mb-7">
          <div className="text-neon-amber shrink-0 mt-0.5"><AlertIcon size={13} /></div>
          <p className="font-mono text-xs text-neon-amber/80 leading-relaxed">
            This link works <strong>exactly once</strong>. After the recipient views it,
            it's permanently deleted. Do not open it yourself to test.
            {usePass && ' Recipient will need the passphrase you set.'}
          </p>
        </div>

        <button onClick={reset} className="btn-secondary w-full">CREATE ANOTHER SECRET</button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 animate-fade-in">
      <div className="mb-10">
        <div className="flex items-center gap-2 font-mono text-xs text-gray-600 mb-5 uppercase tracking-widest">
          <span className="w-6 h-px bg-vault-border" />
          Secure One-Time Secret
          <span className="flex-1 h-px bg-vault-border" />
        </div>
        <h1 className="font-mono text-3xl sm:text-4xl font-bold leading-tight mb-3">
          <span className="text-white">Share secrets</span><br />
          <span className="text-neon-green">
            that self-destruct.
            <span className="inline-block w-2 h-7 bg-neon-green animate-blink ml-1 align-middle" />
          </span>
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed max-w-lg">
          AES-256 encrypted before storage. The link works once —
          after viewing, it's gone forever. No logs. No traces.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="font-mono text-xs text-gray-400 uppercase tracking-wider">Your Secret</label>
            <span className={`font-mono text-xs ${content.length > MAX * 0.9 ? 'text-neon-red' : 'text-gray-600'}`}>
              {content.length.toLocaleString()} / {MAX.toLocaleString()}
            </span>
          </div>
          <textarea
            className="vault-textarea"
            placeholder="Paste password, API key, private note, or any sensitive text..."
            value={content}
            onChange={e => e.target.value.length <= MAX && setContent(e.target.value)}
            required autoFocus
          />
        </div>

        <div>
          <label className="flex items-center gap-1.5 font-mono text-xs text-gray-400 uppercase tracking-wider mb-2">
            <ClockIcon size={12} />Self-Destruct After
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {TTL_OPTIONS.map(opt => (
              <button key={opt.value} type="button" onClick={() => setTtl(opt.value)}
                className={`font-mono text-xs py-2 px-2 rounded-lg border transition-all duration-150 ${
                  ttl === opt.value
                    ? 'border-neon-green/50 bg-neon-green/10 text-neon-green'
                    : 'border-vault-border bg-vault-bg text-gray-500 hover:border-vault-muted hover:text-gray-300'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-1.5 font-mono text-xs text-gray-400 uppercase tracking-wider mb-2">
            <KeyIcon size={12} />Passphrase Lock (Optional)
          </label>
          <button type="button" onClick={() => setUsePass(!usePass)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border font-mono text-sm transition-all duration-200 mb-2 ${
              usePass
                ? 'border-neon-cyan/30 bg-neon-cyan/5 text-neon-cyan'
                : 'border-vault-border bg-vault-bg text-gray-500 hover:border-vault-muted'
            }`}>
            <span className="text-xs">{usePass ? 'Passphrase enabled' : 'Add a passphrase for extra security'}</span>
            <div className={`w-8 h-4 rounded-full border transition-all duration-300 flex items-center px-0.5 ${
              usePass ? 'bg-neon-cyan/20 border-neon-cyan/40 justify-end' : 'bg-vault-muted border-vault-border justify-start'
            }`}>
              <div className={`w-3 h-3 rounded-full transition-colors ${usePass ? 'bg-neon-cyan' : 'bg-gray-600'}`} />
            </div>
          </button>
          {usePass && (
            <div className="relative animate-fade-in">
              <input
                type={showPass ? 'text' : 'password'}
                className="vault-input pr-10"
                placeholder="Enter passphrase..."
                value={passphrase}
                onChange={e => setPassphrase(e.target.value)}
                autoComplete="off"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                {showPass ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
              </button>
            </div>
          )}
        </div>

        {state === 'error' && (
          <div className="flex gap-3 bg-neon-red/5 border border-neon-red/20 rounded-lg p-4 animate-fade-in">
            <div className="text-neon-red shrink-0 mt-0.5"><AlertIcon size={13} /></div>
            <p className="font-mono text-xs text-neon-red/90">{error}</p>
          </div>
        )}

        <div className="flex items-start gap-2 py-3 border-t border-vault-border/40">
          <div className="text-neon-green/40 shrink-0 mt-0.5"><LockIcon size={11} /></div>
          <p className="font-mono text-xs text-gray-600 leading-relaxed">
            AES-256-GCM encrypted. The decryption key is embedded in your link —
            the server never stores it. Even a full database breach reveals nothing readable.
          </p>
        </div>

        <button type="submit" disabled={state === 'loading' || !content.trim()} className="btn-primary w-full py-4">
          {state === 'loading'
            ? <><Spinner size={15} color="#0a0a0f" />ENCRYPTING...</>
            : <><LockIcon size={15} />ENCRYPT & GENERATE LINK<ArrowRightIcon size={14} /></>
          }
        </button>
      </form>

      <div className="mt-14">
        <div className="flex items-center gap-2 font-mono text-xs text-gray-600 mb-6 uppercase tracking-widest">
          <span className="w-6 h-px bg-vault-border" />How It Works
          <span className="flex-1 h-px bg-vault-border" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { n: '01', title: 'You encrypt', desc: 'AES-256 encrypted. Key lives only in the URL, never on server.', color: 'text-neon-green', border: 'border-neon-green/10' },
            { n: '02', title: 'They view once', desc: 'Recipient opens the link. Secret shown exactly one time.', color: 'text-neon-cyan', border: 'border-neon-cyan/10' },
            { n: '03', title: 'It burns', desc: 'Row permanently deleted from database. Link is now dead.', color: 'text-neon-red', border: 'border-neon-red/10' },
          ].map(({ n, title, desc, color, border }) => (
            <div key={n} className={`bg-vault-card border ${border} rounded-xl p-5 hover:border-opacity-30 transition-all duration-200`}>
              <div className={`font-mono text-xs font-bold mb-3 ${color} opacity-50`}>{n}</div>
              <div className={`font-mono text-sm font-semibold mb-2 ${color}`}>{title}</div>
              <div className="font-mono text-xs text-gray-500 leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}