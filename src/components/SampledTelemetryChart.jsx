import { useEffect, useRef, useState } from 'react'
import TelemetryChart from './TelemetryChart'
import { apiFetch } from '../services/apiClient'
import { createLatestLoader, sampledTelemetryPath } from '../services/telemetrySampling'
import { toDisplayTelemetry } from '../services/telemetryUnits'

export default function SampledTelemetryChart({ chart, visibleRange = null, onRangeChange, onOverview }) {
  const [series, setSeries] = useState(() => chart.series.map((item) => ({ ...item, data: [] })))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const loader = useRef(null)

  useEffect(() => {
    const requests = createLatestLoader(async (range, signal) => ({ range, series: await Promise.all(
      chart.series.map(async (item) => {
        let points
        try {
          points = await apiFetch(sampledTelemetryPath({ runId: item.id, fields: [chart.yKey], range }), { signal })
        } catch (requestError) {
          if (requestError.status !== 404) throw requestError
          points = []
        }
        if (!Array.isArray(points)) throw new Error('The telemetry service response must be an array')
        return { ...item, data: points.map(toDisplayTelemetry) }
      }),
    ) }), {
      onStart: () => { setLoading(true); setError('') },
      onSuccess: ({ series: result, range }) => {
        setSeries(result); setLoading(false)
        if (range == null) {
          const ticks = result.flatMap((item) => item.data.map((point) => point.tick))
          if (ticks.length) onOverview?.({ min: Math.min(...ticks), max: Math.max(...ticks) })
        }
      },
      onError: (loadError) => { setError(loadError.message); setLoading(false) },
    })
    loader.current = requests
    return () => requests.cancel()
  }, [chart, onOverview])

  useEffect(() => {
    loader.current?.request(visibleRange, visibleRange == null)
  }, [chart, onOverview, visibleRange])

  const empty = series.every((item) => item.data.length === 0)
  return <div className="sampled-chart" aria-busy={loading}>
    <div className="sampled-chart-status">
      {loading && <span role="status">Loading samples...</span>}
      {!loading && !error && !empty && <span className="sample-count">{series.map((item, index) => `${index === 0 ? 'A' : 'B'}: ${item.data.length}`).join(' / ')} samples</span>}
    </div>
    {error && <p className="chart-notice is-error" role="alert">Could not load chart samples: {error}</p>}
    {!loading && !error && empty && <p className="chart-notice" role="status">No readings in this range. Reset zoom to view the full run.</p>}
    <TelemetryChart series={series} yKey={chart.yKey} unit={chart.unit}
      color={chart.color} height={170} ariaLabel={chart.title} onRangeChange={onRangeChange}
      visibleRange={visibleRange} sharedControls />
  </div>
}
