export const CHART_POINT_BUDGET = 800

// Round outwards so inclusive integer bounds retain boundary readings.
export function tickBounds(range) {
  if (range == null) return {}
  const { min, max } = range
  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
    throw new Error('Invalid telemetry tick range')
  }
  return { startTick: Math.max(0, Math.floor(min)), endTick: Math.max(0, Math.ceil(max)) }
}

export function sampledTelemetryPath({ runId, fields, range = null, maxPoints = CHART_POINT_BUDGET }) {
  if (!Number.isInteger(maxPoints) || maxPoints < 2 || maxPoints > 10000) {
    throw new Error('max_points must be an integer between 2 and 10000')
  }
  const query = new URLSearchParams({ run_id: String(runId), max_points: String(maxPoints) })
  for (const field of new Set(fields)) query.append('fields', field)
  const { startTick, endTick } = tickBounds(range)
  if (startTick != null) query.set('start_tick', String(startTick))
  if (endTick != null) query.set('end_tick', String(endTick))
  return `/telemetry/data?${query}`
}

// Cancel immediately, including during the debounce window. The identity check
// also protects against transports that finish after being aborted.
export function createLatestLoader(load, { onStart, onSuccess, onError }, delay = 250) {
  let version = 0
  let timer
  let controller
  function cancel() {
    version += 1
    clearTimeout(timer)
    controller?.abort()
  }
  return {
    cancel,
    request(value, immediate = false) {
      cancel()
      const requestVersion = version
      controller = new AbortController()
      const { signal } = controller
      onStart()
      timer = setTimeout(async () => {
        try {
          const result = await load(value, signal)
          if (version === requestVersion && !signal.aborted) onSuccess(result)
        } catch (error) {
          if (version === requestVersion && !signal.aborted) onError(error)
        }
      }, immediate ? 0 : delay)
    },
  }
}
