import { clearAuthToken, getAuthToken } from './authToken.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export class ApiError extends Error {
  constructor(message, { status, details } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export async function apiFetch(path, { method = 'GET', headers, body, auth = true } = {}) {
  if (!API_BASE_URL) {
    throw new ApiError('Missing VITE_API_BASE_URL. Set it in frontend/.env', { status: 0 })
  }

  const finalHeaders = {
    'Content-Type': 'application/json',
    ...(headers || {}),
  }

  if (auth) {
    const token = getAuthToken()
    if (token) finalHeaders.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
  })

  const contentType = res.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null)

  if (!res.ok) {
    let message = (data && data.message) || `Request failed (${res.status})`
    if (res.status === 401 && auth) {
      clearAuthToken()
      message = 'Session expired. Please log in again.'
    } else if (res.status === 0 || (res.status >= 500 && res.status < 600)) {
      if (res.status === 0) message = 'Cannot reach server. Is the backend running?'
      else if (!data?.message) message = 'Something went wrong. Try again later.'
    }
    throw new ApiError(message, { status: res.status, details: data })
  }

  return data
}

