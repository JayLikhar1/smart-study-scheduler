import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { Button } from '../ui/Button.jsx'
import { TextField } from '../ui/TextField.jsx'

export function RegisterPage() {
  const navigate = useNavigate()
  const { registerWithPassword } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await registerWithPassword({ name, email, password })
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold">Create your account</h1>
      <p className="mt-1 text-sm text-slate-400">
        Register to get personalized study schedules.
      </p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <TextField
          label="Full name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jay Likhar"
          required
        />
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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          required
        />

        {error ? (
          <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creating…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-5 text-sm text-slate-300">
        Already have an account?{' '}
        <Link className="text-indigo-200 hover:text-indigo-100" to="/login">
          Login
        </Link>
      </p>
    </div>
  )
}

