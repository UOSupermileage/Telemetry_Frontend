const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options)

  if (!response.ok) {
    throw new Error(`API request failed (${response.status})`)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

