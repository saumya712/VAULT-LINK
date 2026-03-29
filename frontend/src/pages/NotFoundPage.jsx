import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="max-w-md mx-auto px-6 py-28 text-center animate-fade-in">
      <div className="font-mono text-7xl font-bold text-vault-muted mb-4">404</div>
      <h1 className="font-mono text-xl font-bold text-white mb-3">Page not found</h1>
      <p className="font-mono text-sm text-gray-500 mb-8">
        This route doesn't exist. Maybe the secret already burned it.
      </p>
      <Link to="/" className="btn-primary">GO HOME</Link>
    </div>
  )
}