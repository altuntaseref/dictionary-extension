import { useState } from 'react'

const SUPABASE_URL = 'https://udykdytmggswelwkrixi.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkeWtkeXRtZ2dzd2Vsd2tyaXhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDMzOTAsImV4cCI6MjA3ODAxOTM5MH0.PGufPyetZGyN2pndysxkCy8rKvDItWfJH_KP2hOxM88'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error_description || data?.error || 'Login failed')
      }

      const token = data.access_token
      if (!token) {
        throw new Error('No access token received')
      }

      onLogin(token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="popup-card">
      <div className="popup-card-title">Sign in</div>
      <form onSubmit={handleSubmit} className="popup-form">
        <label className="popup-label">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="popup-input"
          disabled={loading}
        />
        <label className="popup-label">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          className="popup-input"
          disabled={loading}
        />
        {error && <div className="popup-error">{error}</div>}
        <button type="submit" className="popup-btn-primary" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <div className="popup-hint">You can manage your account on the website.</div>
    </div>
  )
}

