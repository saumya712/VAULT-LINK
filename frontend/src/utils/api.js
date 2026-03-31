const BASE = import.meta.env.VITE_API_URL || ''

export class NotFoundError extends Error {
  constructor(msg) {
    super(msg)
    this.name = 'NotFoundError'
  }
}

export class PassphraseError extends Error {
  constructor(msg) {
    super(msg)
    this.name = 'PassphraseError'
  }
}

export class PassphraseRequiredError extends Error {
  constructor(msg) {
    super(msg)
    this.name = 'PassphraseRequiredError'
  }
}

export async function createSecret({ content, ttlHours, passphrase }) {
  const body = { content, ttl_hours: Number(ttlHours) }

  if (passphrase && passphrase.trim()) {
    body.passphrase = passphrase.trim()
  }

  const res = await fetch(`${BASE}/api/secrets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Error ${res.status}`)
  }

  return res.json()
}

export async function retrieveSecret(token, passphrase = '') {
  const url = passphrase
    ? `${BASE}/api/secrets/${token}?passphrase=${encodeURIComponent(passphrase)}`
    : `${BASE}/api/secrets/${token}`

  const res = await fetch(url)

  if (res.status === 404) {
    throw new NotFoundError('Secret not found or already accessed.')
  }

  if (res.status === 401) {
    throw new PassphraseError('Incorrect passphrase. Try again.')
  }

  if (res.status === 423) {
    throw new PassphraseRequiredError('Passphrase required.')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Error ${res.status}`)
  }

  return res.json()
}
