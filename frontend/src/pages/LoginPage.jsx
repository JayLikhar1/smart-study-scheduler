import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { Button } from '../ui/Button.jsx'
import { TextField } from '../ui/TextField.jsx'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginWithPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await loginWithPassword({ email, password })
      const nextPath = location.state?.from || '/'
      navigate(nextPath, { replace: true })
    } catch (err) {
      setError(err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold">Welcome back</h1>
      <p className="mt-1 text-sm text-slate-400">Login to continue your study plan.</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@college.edu"
          required
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        {error ? (
          <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Logging in…' : 'Login'}
        </Button>
      </form>

      <p className="mt-5 text-sm text-slate-300">
        New here?{' '}
        <Link className="text-indigo-200 hover:text-indigo-100" to="/register">
          Create an account
        </Link>
      </p>
    </div>
  )
}

