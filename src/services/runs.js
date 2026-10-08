const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')

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

/**
 * Fetch recent run records from the backend.
 * The API may return either an array or an object with a `runs` array.
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<Run[]>}
 * @throws {Error} If the API URL is not configured, the request fails, or the
 * response does not match a supported runs response shape.
 */
export async function getRecentRuns({ signal } = {}) {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not configured')
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}/runs?limit=6`, { signal })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('Could not reach the runs service', { cause: error })
  }

  if (!response.ok) {
    throw new Error(`Could not load runs (${response.status})`)
  }

  let data
  try {
    data = await response.json()
  } catch (error) {
    throw new Error('The runs service returned invalid JSON', { cause: error })
  }

  const runs = Array.isArray(data) ? data : data?.runs
  if (!Array.isArray(runs)) {
    throw new Error('The runs service response must be an array or contain a runs array')
  }

  return runs
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
