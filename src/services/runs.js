const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function getRecentRuns() {
  const response = await fetch(`${API_BASE_URL}/runs?limit=6`)

  if (!response.ok) {
    throw new Error(`Could not load runs (${response.status})`)
  }

  const data = await response.json()
  return Array.isArray(data) ? data : data.runs
}