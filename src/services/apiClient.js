
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function apiFetch(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not configured')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, options)

  if (!response.ok) {
    let detail = ''

    try {
      const errorBody = await response.json()
      const message = Array.isArray(errorBody.detail)
        ? errorBody.detail.map((item) => item.msg).join('; ')
        : errorBody.detail

      detail = typeof message === 'string' ? `: ${message}` : ''
    } catch {
      // Keep the status code if the server did not return JSON.
    }

    const error = new Error(`API request failed (${response.status})${detail}`)
    error.status = response.status
    throw error
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}
