import { useState } from 'react'
import { CopyIcon, CheckIcon } from './icons'

export default function CopyButton({ text, className = '' }) {
  const [copied, setCopied] = useState(false)

  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button onClick={handle}
      className={`flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded border transition-all duration-200 ${
        copied
          ? 'border-neon-green/40 text-neon-green bg-neon-green/10'
          : 'border-vault-border text-gray-400 hover:border-neon-green/30 hover:text-neon-green'
      } ${className}`}>
      {copied ? <><CheckIcon size={12} />COPIED!</> : <><CopyIcon size={12} />COPY</>}
    </button>
  )
}