// Talks to the Laravel backend. Same website, so no CORS to worry about.
// Laravel wants a CSRF token on every POST. It hands us a cookie called
// XSRF-TOKEN; we copy it into the X-XSRF-TOKEN header.

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

const readXsrf = () => {
  const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ''
}

export async function api(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  if (method !== 'GET') {
    // no cookie yet? a harmless GET makes Laravel send one
    if (!readXsrf()) {
      await fetch(`${BASE}/api/me`, { credentials: 'same-origin', headers: { Accept: 'application/json' } }).catch(() => {})
    }
    headers['X-XSRF-TOKEN'] = readXsrf()
  }

  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    credentials: 'same-origin',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  let data = null
  try {
    data = await res.json()
  } catch {
    // empty or non-JSON response
  }

  if (!res.ok) {
    const firstError = data?.errors ? Object.values(data.errors)[0]?.[0] : null
    const error = new Error(firstError || data?.message || 'Something went wrong. Please try again.')
    error.status = res.status
    error.errors = data?.errors || {}
    throw error
  }

  return data
}
