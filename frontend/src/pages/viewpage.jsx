import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { retrieveSecret, NotFoundError, PassphraseError, PassphraseRequiredError } from '../utils/api'
import CopyButton from '../components/copybutton'
import Spinner from '../components/spinner'
import { LockIcon, FireIcon, AlertIcon, KeyIcon, ClockIcon, EyeIcon, EyeOffIcon } from '../components/icons'

export default function ViewPage() {
  const { token }                     = useParams()
  const [state, setState]             = useState('loading')
  const [content, setContent]         = useState('')
  const [passphrase, setPass]         = useState('')
  const [showPass, setShowPass]       = useState(false)
  const [error, setError]             = useState('')
  const [redacted, setRedacted]       = useState(true)
  const [burning, setBurning]         = useState(false)
  const [burnConfirm, setBurnConfirm] = useState(false)
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    doFetch('')
  }, [token])

  // pass is always explicitly provided — no default from state
  const doFetch = async (pass) => {
    setState('loading')
    setError('')
    try {
      const res = await retrieveSecret(token, pass)
      setContent(res.content)
      setState('confirming')
    } catch (err) {
      if (err instanceof NotFoundError)               setState('burned')
      else if (err instanceof PassphraseRequiredError) setState('requires_pass')
      else if (err instanceof PassphraseError) {
        setError(err.message)
        setState('pass_error')
        setPass('')
      } else {
        setError(err.message)
        setState('error')
      }
    }
  }

  // passphrase submit — just call doFetch with current passphrase value
  const handlePassSubmit = (e) => {
    e.preventDefault()
    doFetch(passphrase)
  }

  const handleBurn = () => {
    setBurning(true)
    setTimeout(() => setState('burned'), 700)
  }

  if (state === 'loading') return (
    <div className="max-w-2xl mx-auto px-6 py-28 flex flex-col items-center gap-4">
      <Spinner size={36} />
      <p className="font-mono text-sm text-gray-500 animate-pulse">Retrieving encrypted secret...</p>
    </div>
  )

  if (state === 'burned') return (
    <div className="max-w-md mx-auto px-6 py-16 text-center animate-slide-up">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border border-neon-red/20 bg-neon-red/5 mb-6"
           style={{ boxShadow: '0 0 40px rgba(255,51,102,0.1)' }}>
        <div className="text-neon-red"><FireIcon size={34} /></div>
      </div>
      <h1 className="font-mono text-2xl font-bold text-neon-red mb-3">Secret Destroyed</h1>
      <p className="text-gray-400 text-sm font-mono leading-relaxed mb-8">
        This secret has already been viewed or has expired.
        It was permanently deleted and cannot be recovered.
      </p>
      <div className="bg-vault-card border border-vault-border rounded-xl p-5 mb-8 text-left">
        <p className="font-mono text-xs text-gray-600 uppercase tracking-widest mb-3">Possible reasons</p>
        {['Someone already opened this link', 'The secret auto-expired (TTL exceeded)', 'This link was never valid'].map((t, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <span className="w-1 h-1 rounded-full bg-vault-muted shrink-0" />
            <span className="font-mono text-xs text-gray-500">{t}</span>
          </div>
        ))}
      </div>
      <Link to="/" className="btn-primary"><LockIcon size={14} />CREATE A NEW SECRET</Link>
    </div>
  )

  if (state === 'error') return (
    <div className="max-w-md mx-auto px-6 py-28 text-center animate-fade-in">
      <div className="text-neon-red mb-4"><AlertIcon size={32} /></div>
      <h1 className="font-mono text-xl font-bold text-white mb-3">Something went wrong</h1>
      <p className="font-mono text-sm text-gray-400 mb-8">{error}</p>
      <div className="flex gap-3 justify-center">
        <button onClick={() => doFetch('')} className="btn-secondary">RETRY</button>
        <Link to="/" className="btn-primary">GO HOME</Link>
      </div>
    </div>
  )

  if (state === 'requires_pass' || state === 'pass_error') return (
    <div className="max-w-md mx-auto px-6 py-16 animate-slide-up">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-neon-cyan/30 bg-neon-cyan/5 mb-5">
          <div className="text-neon-cyan"><KeyIcon size={24} /></div>
        </div>
        <h1 className="font-mono text-xl font-bold text-white mb-2">Passphrase Required</h1>
        <p className="text-gray-400 text-sm font-mono">The sender locked this secret. Enter the passphrase to unlock it.</p>
      </div>
      <form onSubmit={handlePassSubmit} className="space-y-4">
        {state === 'pass_error' && (
          <div className="flex gap-3 bg-neon-red/5 border border-neon-red/20 rounded-lg p-3 animate-fade-in">
            <div className="text-neon-red shrink-0"><AlertIcon size={13} /></div>
            <p className="font-mono text-xs text-neon-red/90">{error}</p>
          </div>
        )}
        <div className="relative">
          <input type={showPass ? 'text' : 'password'} className="vault-input pr-10"
            placeholder="Enter passphrase..." value={passphrase}
            onChange={e => setPass(e.target.value)} autoFocus required />
          <button type="button" onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
            {showPass ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
          </button>
        </div>
        <button type="submit" className="btn-primary w-full">
          <KeyIcon size={14} />UNLOCK SECRET
        </button>
      </form>
    </div>
  )

  if (state === 'confirming') return (
    <div className="max-w-md mx-auto px-6 py-16 animate-slide-up">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-neon-amber/30 bg-neon-amber/5 mb-5">
          <div className="text-neon-amber"><AlertIcon size={24} /></div>
        </div>
        <h1 className="font-mono text-xl font-bold text-white mb-2">One-Time Access</h1>
        <p className="text-gray-400 text-sm font-mono leading-relaxed">
          You're about to view a secret that will be{' '}
          <span className="text-neon-red font-bold">permanently destroyed</span>{' '}
          after this viewing. Make sure you're ready to copy it.
        </p>
      </div>
      <div className="bg-vault-card border border-vault-border rounded-xl p-5 mb-6 space-y-3">
        {[
          { icon: <FireIcon size={12} />, text: 'Secret deletes the moment you view it', color: 'text-neon-red' },
          { icon: <ClockIcon size={12} />, text: 'You cannot come back to this page', color: 'text-neon-amber' },
          { icon: <LockIcon size={12} />, text: 'Copy the secret before closing the tab', color: 'text-neon-cyan' },
        ].map(({ icon, text, color }, i) => (
          <div key={i} className={`flex items-center gap-2.5 font-mono text-xs ${color}`}>{icon}{text}</div>
        ))}
      </div>
      <button onClick={() => setState('revealing')} className="btn-primary w-full py-4">
        <KeyIcon size={14} />I UNDERSTAND — SHOW THE SECRET
      </button>
    </div>
  )

  if (state === 'revealing') return (
    <div className="max-w-2xl mx-auto px-6 py-12 animate-slide-up">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="font-mono text-xl font-bold text-white mb-1">Secret Decrypted</h1>
          <p className="font-mono text-xs text-gray-500">Read it carefully. This is your only chance.</p>
        </div>
        <div className="badge-danger">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-red animate-pulse" />LIVE
        </div>
      </div>

      <div className={`relative bg-vault-bg border rounded-xl p-5 mb-4 transition-all duration-500 ${
        burning ? 'border-neon-red/60 opacity-30 scale-95' : 'border-vault-border'
      }`} style={burning ? { boxShadow: '0 0 40px rgba(255,51,102,0.3)' } : {}}>
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-xs text-gray-600 uppercase tracking-widest">Secret Content</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setRedacted(!redacted)}
              className={`font-mono text-xs px-2.5 py-1 rounded border transition-all ${
                redacted
                  ? 'border-neon-cyan/30 text-neon-cyan bg-neon-cyan/5'
                  : 'border-vault-border text-gray-500 hover:border-vault-muted'
              }`}>
              {redacted ? '◉ REVEAL' : '◎ HIDE'}
            </button>
            <CopyButton text={content} />
          </div>
        </div>
        <div
          className={`font-mono text-sm leading-relaxed break-all transition-all duration-300 ${
            redacted ? 'cursor-pointer' : 'text-neon-green select-all'
          }`}
          onClick={redacted ? () => setRedacted(false) : undefined}
          style={redacted ? { WebkitTextSecurity: 'disc', userSelect: 'none', color: '#2a2a40', letterSpacing: '0.15em' } : {}}>
          {redacted ? content.replace(/./g, '●') : content}
        </div>
        {redacted && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl cursor-pointer"
               onClick={() => setRedacted(false)}>
            <div className="flex items-center gap-2 bg-vault-surface/95 border border-vault-border rounded-lg px-3 py-2">
              <div className="text-neon-cyan"><EyeIcon size={12} /></div>
              <span className="font-mono text-xs text-neon-cyan">Click to reveal</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 bg-neon-amber/5 border border-neon-amber/20 rounded-lg px-4 py-3 mb-5">
        <div className="text-neon-amber shrink-0 mt-0.5"><AlertIcon size={12} /></div>
        <p className="font-mono text-xs text-neon-amber/80 leading-relaxed">
          This is your <strong>only chance</strong> to read this. Copy it now.
          Leaving this page makes it gone forever.
        </p>
      </div>

      {!burnConfirm ? (
        <button onClick={() => setBurnConfirm(true)} className="btn-danger w-full">
          <FireIcon size={14} />DESTROY SECRET NOW
        </button>
      ) : (
        <div className="border border-neon-red/30 rounded-xl p-4 bg-neon-red/5 animate-fade-in">
          <p className="font-mono text-sm text-neon-red text-center mb-4">Permanently delete this secret?</p>
          <div className="flex gap-3">
            <button onClick={() => setBurnConfirm(false)} className="btn-secondary flex-1 text-xs">CANCEL</button>
            <button onClick={handleBurn} disabled={burning} className="btn-danger flex-1">
              {burning ? <Spinner size={14} color="#ff3366" /> : <FireIcon size={14} />}
              {burning ? 'BURNING...' : 'YES, DESTROY'}
            </button>
          </div>
        </div>
      )}
    </div>
  )

  return null
}