const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')

function requireApiBaseUrl() {
  if (!API_BASE_URL) throw new Error('VITE_API_BASE_URL is not configured')
}

/**
 * A run record returned by the runs API.
 * Keep the optional fields aligned with the backend response contract.
 * @typedef {Object} Run
 * @property {string|number} run_id Stable identifier used by the UI.
 * @property {string} [name] Display name; older records may use `run_name`.
 * @property {string} [run_name] Legacy display name.
 * @property {number|string} [car_id]
 * @property {number|string} [driver_id]
 * @property {number|string} [location_id]
 * @property {string} [carName] Related car label returned by the API.
 * @property {string} [driverName] Related driver label returned by the API.
 * @property {string} [locationName] Related location label returned by the API.
 * @property {string} [started_at] ISO date/time when the run began.
 * @property {string} [ended_at] ISO date/time when the run ended.
 * @property {string} [date_created] ISO date/time when the record was created.
 * @property {string} [notes]
 */

/** Fetch a single run record from the backend. @param {string|number} runId */
export async function getRun(runId, { signal } = {}) {
  requireApiBaseUrl()
  const response = await fetch(`${API_BASE_URL}/runs/${encodeURIComponent(runId)}`, { signal })
  if (!response.ok) throw new Error(`Could not load run (${response.status})`)
  return response.json()
}

/**
 * Fetch a page of runs. The API uses offset/limit pagination.
 * @param {{offset?: number, limit?: number, signal?: AbortSignal}} [options]
 * @returns {Promise<Run[]>}
 */
export async function getRuns({ offset = 0, limit = 100, signal } = {}) {
  requireApiBaseUrl()
  const query = new URLSearchParams({ offset: String(offset), limit: String(limit) })
  const response = await fetch(`${API_BASE_URL}/runs?${query}`, { signal })
  if (!response.ok) throw new Error(`Could not load runs (${response.status})`)
  const runs = await response.json()
  if (!Array.isArray(runs)) throw new Error('The runs service response must be an array')
  return runs
}

/** Fetch every run using the backend's offset/limit pagination. */
export async function getAllRuns({ signal } = {}) {
  const pageSize = 100
  const runs = []
  let offset = 0
  let page
  do {
    page = await getRuns({ offset, limit: pageSize, signal })
    runs.push(...page)
    offset += page.length
  } while (page.length === pageSize)
  return runs
}

/** Create a run record without importing telemetry. */
export async function createRun(run, { signal } = {}) {
  requireApiBaseUrl()
  const response = await fetch(`${API_BASE_URL}/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: run.name,
      car_id: run.car_id,
      driver_id: run.driver_id,
      location_id: run.location_id,
      started_at: run.started_at,
      ended_at: run.ended_at || null,
      notes: run.notes || null,
    }),
    signal,
  })
  if (!response.ok) {
    let detail = ''
    try {
      const errorBody = await response.json()
      const message = Array.isArray(errorBody.detail)
        ? errorBody.detail.map((item) => item.msg).join('; ')
        : errorBody.detail
      detail = typeof message === 'string' ? `: ${message}` : ''
    } catch {
      // Keep the status code if the server did not return a JSON error body.
    }
    throw new Error(`Could not create run (${response.status})${detail}`)
  }
  return response.json()
}

/**
 * Fetch a page of telemetry points. `fields` are encoded as repeated query keys,
 * as expected by FastAPI's list query parameter.
 * @param {{runId: string|number, fields?: string[], startTick?: number, endTick?: number, offset?: number, limit?: number, signal?: AbortSignal}} options
 */
export async function getTelemetryData({ runId, fields = ['tick', 'speed'], startTick, endTick, offset = 0, limit = 1000, signal }) {
  requireApiBaseUrl()
  const query = new URLSearchParams({ run_id: String(runId), offset: String(offset), limit: String(limit) })
  fields.forEach((field) => query.append('fields', field))
  if (startTick != null) query.set('start_tick', String(startTick))
  if (endTick != null) query.set('end_tick', String(endTick))
  const response = await fetch(`${API_BASE_URL}/telemetry/data?${query}`, { signal })
  if (!response.ok) throw new Error(`Could not load telemetry (${response.status})`)
  const data = await response.json()
  if (!Array.isArray(data)) throw new Error('The telemetry service response must be an array')
  return data
}

/** Fetch all requested telemetry fields, following offset pagination. */
export async function getAllTelemetryData({ runId, fields = ['tick', 'throttle', 'speed', 'current', 'voltage'], signal }) {
  const pageSize = 10000
  const points = []
  let offset = 0
  let page
  do {
    page = await getTelemetryData({ runId, fields, offset, limit: pageSize, signal })
    points.push(...page)
    offset += page.length
  } while (page.length === pageSize)
  return points
}

/** Fetch aggregated performance metrics for one run. */
export async function getRunAnalytics(runId, { signal } = {}) {
  requireApiBaseUrl()
  const response = await fetch(`${API_BASE_URL}/analytics/runs/${encodeURIComponent(runId)}`, { signal })
  if (!response.ok) throw new Error(`Could not load run analytics (${response.status})`)
  return response.json()
}

/** Download the backend-generated CSV for a run. */
export async function exportTelemetry(runId, { signal } = {}) {
  requireApiBaseUrl()
  const response = await fetch(`${API_BASE_URL}/telemetry/export?run_id=${encodeURIComponent(runId)}`, { signal })
  if (!response.ok) throw new Error(`Could not export telemetry (${response.status})`)
  return response.blob()
}

/**
 * Load the reference records used by the run editor's dropdowns.
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<{cars: Array<{id: number, name: string}>, drivers: Array<{id: number, name: string}>, locations: Array<{id: number, name: string}>}>}
 */
export async function getRunEditorOptions({ signal } = {}) {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not configured')
  }

  const [cars, drivers, locations] = await Promise.all(
    ['cars', 'drivers', 'locations'].map(async (resource) => {
      const response = await fetch(`${API_BASE_URL}/${resource}`, { signal })
      if (!response.ok) {
        throw new Error(`Could not load ${resource} (${response.status})`)
      }
      const records = await response.json()
      if (!Array.isArray(records)) {
        throw new Error(`The ${resource} service response must be an array`)
      }
      return records
    })
  )

  return {
    cars: cars.map(({ car_id, name }) => ({ id: car_id, name })),
    drivers: drivers.map(({ driver_id, first_name, last_name, name }) => ({
      id: driver_id,
      name: name ?? [first_name, last_name].filter(Boolean).join(' '),
    })),
    locations: locations.map(({ location_id, name }) => ({ id: location_id, name })),
  }
}

/**
 * Update a run using the backend's partial update endpoint.
 * @param {string|number} runId
 * @param {Pick<Run, 'name'|'started_at'|'ended_at'|'notes'> & {car_id: number, driver_id: number, location_id: number}} changes
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<Run>}
 */
export async function updateRun(runId, changes, { signal } = {}) {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not configured')
  }

  const response = await fetch(`${API_BASE_URL}/runs/${encodeURIComponent(runId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: changes.name,
      car_id: changes.car_id,
      driver_id: changes.driver_id,
      location_id: changes.location_id,
      started_at: changes.started_at,
      ended_at: changes.ended_at,
      notes: changes.notes,
    }),
    signal,
  })

  if (!response.ok) {
    let detail = ''
    try {
      const errorBody = await response.json()
      detail = typeof errorBody.detail === 'string' ? `: ${errorBody.detail}` : ''
    } catch {
      // Keep the status code if the server did not return a JSON error body.
    }
    throw new Error(`Could not update run (${response.status})${detail}`)
  }

  return response.json()
}

/**
 * Permanently delete a run through the backend.
 * @param {string|number} runId
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<void>}
 */
export async function deleteRun(runId, { signal } = {}) {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not configured')
  }

  const response = await fetch(`${API_BASE_URL}/runs/${encodeURIComponent(runId)}`, {
    method: 'DELETE',
    signal,
  })

  if (!response.ok) {
    let detail = ''
    try {
      const errorBody = await response.json()
      const message = Array.isArray(errorBody.detail)
        ? errorBody.detail.map((item) => item.msg).join('; ')
        : errorBody.detail
      detail = typeof message === 'string' ? `: ${message}` : ''
    } catch {
      // Keep the status code if the server did not return a JSON error body.
    }
    throw new Error(`Could not delete run (${response.status})${detail}`)
  }
}

/**
 * Upload a run's metadata and telemetry CSV as multipart form data.
 * The browser sets the multipart Content-Type boundary for FormData.
 * @param {{file: File, name: string, car_id: number, driver_id: number, location_id: number, started_at: string, ended_at?: string|null, notes?: string|null}} run
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<void>}
 */
export async function importTelemetry(run, { signal } = {}) {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not configured')
  }

  const formData = new FormData()
  formData.append('file', run.file)
  formData.append('name', run.name)
  formData.append('car_id', String(run.car_id))
  formData.append('driver_id', String(run.driver_id))
  formData.append('location_id', String(run.location_id))
  formData.append('started_at', run.started_at)
  if (run.ended_at) formData.append('ended_at', run.ended_at)
  if (run.notes) formData.append('notes', run.notes)

  const response = await fetch(`${API_BASE_URL}/telemetry/import`, {
    method: 'POST',
    body: formData,
    signal,
  })

  if (!response.ok) {
    let detail = ''
    try {
      const errorBody = await response.json()
      const message = Array.isArray(errorBody.detail)
        ? errorBody.detail.map((item) => item.msg).join('; ')
        : errorBody.detail
      detail = typeof message === 'string' ? `: ${message}` : ''
    } catch {
      // Keep the status code if the server did not return a JSON error body.
    }
    throw new Error(`Could not import telemetry (${response.status})${detail}`)
  }
}
