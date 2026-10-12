import { apiFetch } from './apiClient'

export async function getRecentRuns() {
  const data = await apiFetch('/runs?limit=6')

  return Array.isArray(data) ? data : data.runs
}
