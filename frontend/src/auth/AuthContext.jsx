import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../lib/api.js'
import { clearAuthToken, getAuthToken, setAuthToken } from '../lib/authToken.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  async function refreshMe() {
    const token = getAuthToken()
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const data = await apiFetch('/api/auth/me', { method: 'GET' })
      setUser(data?.user || null)
    } catch {
      clearAuthToken()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshMe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo(() => {
    return {
      user,
      loading,
      isAuthenticated: Boolean(user),
      async loginWithPassword({ email, password }) {
        const data = await apiFetch('/api/auth/login', {
          method: 'POST',
          auth: false,
          body: { email, password },
        })
        if (data?.token) setAuthToken(data.token)
        setUser(data?.user || null)
        return data
      },
      async registerWithPassword({ name, email, password }) {
        return await apiFetch('/api/auth/register', {
          method: 'POST',
          auth: false,
          body: { name, email, password },
        })
      },
      logout() {
        clearAuthToken()
        setUser(null)
      },
    }
  }, [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

