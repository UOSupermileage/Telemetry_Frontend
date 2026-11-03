import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, RotateCcw } from 'lucide-react'
import TelemetryChartHolder from '../components/TelemetryChartHolder'
import RunSelector from '../components/RunSelector'
import { exportTelemetry, getAllRuns, getRunAnalytics } from '../services/runs'
import { toDisplayValue } from '../services/telemetryUnits'
import './AnalysisPage.css'

const metricDefinitions = [
  { id: 'speed', title: 'Speed', yKey: 'speed', unit: 'km/h', color: '#f47700' },
  { id: 'throttle', title: 'Throttle', yKey: 'throttle', unit: '%', color: '#f47700' },
  { id: 'current', title: 'Current', yKey: 'current', unit: 'A', color: '#f47700' },
  { id: 'voltage', title: 'Voltage', yKey: 'voltage', unit: 'V', color: '#f47700' },
]
const referenceColor = '#368bc1'
const nameOf = (run) => run?.name || run?.run_name || `Run #${run?.run_id}`
const formatNumber = (value, digits = 2) => value == null || !Number.isFinite(Number(value))
  ? '\u2014' : Number(value).toLocaleString(undefined, { maximumFractionDigits: digits })

function SummaryRow({ run, analytics, reference = false }) {
  return <tr>
    <th scope="row"><span className={`trace-key${reference ? ' is-reference' : ''}`}>{reference ? 'B' : 'A'}</span><span>{nameOf(run)}</span></th>
    <td>{formatNumber(toDisplayValue(analytics?.max_speed, 'speed'))} <small>km/h</small></td>
    <td>{formatNumber(toDisplayValue(analytics?.average_speed, 'speed'))} <small>km/h</small></td>
    <td>{formatNumber(analytics?.duration_seconds)} <small>s</small></td>
    <td>{formatNumber(analytics?.telemetry_points, 0)}</td>
  </tr>
}

function TickRangeForm({ bounds, onChange }) {
  const [error, setError] = useState('')
  return <form className="tick-range-form" onSubmit={(event) => {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const min = Number(values.get('start'))
    const max = Number(values.get('end'))
    if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max <= min) {
      setError('End tick must be greater than start tick.'); return
    }
    setError('')
    onChange({ min, max })
  }}>
    <label>From <input aria-label="Start tick" name="start" type="number" min="0" step="1" required defaultValue={Math.floor(bounds?.min ?? 0)} disabled={!bounds} /></label>
    <span className="range-divider" aria-hidden="true">/</span>
    <label>To <input aria-label="End tick" name="end" type="number" min="0" step="1" required defaultValue={Math.ceil(bounds?.max ?? 0)} disabled={!bounds} /></label>
    <span className="range-unit">ms</span>
    <button type="submit" disabled={!bounds}>Apply range</button>
    {error && <span className="range-error" role="alert">{error}</span>}
  </form>
}

function AnalysisPage({ selectedRunId: requestedRunId = '', requestedCompareRunId = '' }) {
  const [runs, setRuns] = useState([])
  const [selection, setSelection] = useState({ sourceRun: requestedRunId, sourceCompare: requestedCompareRunId, run: requestedRunId, compare: requestedCompareRunId })
  const [visibleMetrics, setVisibleMetrics] = useState(metricDefinitions.map(({ id }) => id))
  const [analysis, setAnalysis] = useState({ key: '', data: {}, errors: '' })
  const [isLoadingRuns, setIsLoadingRuns] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState('')
  const [windowState, setWindowState] = useState({ key: '', range: null })
  const [overview, setOverview] = useState({ key: '', min: null, max: null })

  const selectedRunId = selection.sourceRun === requestedRunId ? selection.run : requestedRunId
  const compareRunId = selection.sourceCompare === requestedCompareRunId ? selection.compare : requestedCompareRunId
  const latestRun = useMemo(() => [...runs].sort((a, b) => new Date(b.started_at) - new Date(a.started_at))[0], [runs])
  const primaryRun = runs.find((run) => String(run.run_id) === String(selectedRunId)) ?? latestRun
  const compareRun = runs.find((run) => String(run.run_id) === String(compareRunId) && run !== primaryRun)
  const effectiveRunId = primaryRun?.run_id ?? ''
  const effectiveCompareRunId = compareRun?.run_id ?? ''
  const sessionKey = `${effectiveRunId}:${effectiveCompareRunId}`
  const visibleRange = windowState.key === sessionKey ? windowState.range : null
  const bounds = visibleRange ?? (overview.key === sessionKey ? overview : null)
  const primaryAnalytics = analysis.key === sessionKey ? analysis.data[effectiveRunId] : null
  const referenceAnalytics = analysis.key === sessionKey ? analysis.data[effectiveCompareRunId] : null
  const isLoadingAnalysis = Boolean(effectiveRunId) && analysis.key !== sessionKey

  useEffect(() => {
    const controller = new AbortController()
    getAllRuns({ signal: controller.signal }).then((result) => {
      if (!controller.signal.aborted) setRuns(result)
    }).catch((loadError) => {
      if (!controller.signal.aborted) setError(loadError.message)
    }).finally(() => {
      if (!controller.signal.aborted) setIsLoadingRuns(false)
    })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!effectiveRunId) return undefined
    const controller = new AbortController()
    const ids = [effectiveRunId, effectiveCompareRunId].filter(Boolean)
    Promise.all(ids.map(async (id) => {
      try { return [id, await getRunAnalytics(id, { signal: controller.signal }), ''] }
      catch (loadError) { return [id, null, `Run ${id}: ${loadError.message}`] }
    })).then((entries) => {
      if (controller.signal.aborted) return
      setAnalysis({ key: sessionKey, data: Object.fromEntries(entries.map(([id, data]) => [id, data])), errors: entries.map(([, , message]) => message).filter(Boolean).join('; ') })
    })
    return () => controller.abort()
  }, [effectiveRunId, effectiveCompareRunId, sessionKey])

  const onRangeChange = useCallback((range) => setWindowState((previous) =>
    previous.key === sessionKey && previous.range?.min === range?.min && previous.range?.max === range?.max
      ? previous : { key: sessionKey, range }), [sessionKey])
  const onOverview = useCallback(({ min, max }) => setOverview((previous) => {
    const next = previous.key === sessionKey
      ? { key: sessionKey, min: Math.min(previous.min, min), max: Math.max(previous.max, max) }
      : { key: sessionKey, min, max }
    return previous.key === next.key && previous.min === next.min && previous.max === next.max ? previous : next
  }), [sessionKey])

  const runCharts = useMemo(() => !effectiveRunId ? [] : metricDefinitions.map((metric) => ({
    ...metric, sampled: true,
    series: [
      { id: String(effectiveRunId), label: nameOf(primaryRun), color: metric.color, data: [] },
      ...(compareRun ? [{ id: String(effectiveCompareRunId), label: nameOf(compareRun), color: referenceColor, dash: [6, 3], data: [] }] : []),
    ],
  })), [effectiveRunId, effectiveCompareRunId, primaryRun, compareRun])

  const changeSelection = (run, compare) => {
    setSelection({ sourceRun: requestedRunId, sourceCompare: requestedCompareRunId, run, compare })
    const params = new URLSearchParams()
    if (run) params.set('run', run)
    if (compare) params.set('compare', compare)
    window.history.replaceState(null, '', `#analysis?${params}`)
  }
  const handleExport = async () => {
    if (!effectiveRunId) return
    setIsExporting(true); setError('')
    try {
      const blob = await exportTelemetry(effectiveRunId)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url; link.download = `telemetry_run_${effectiveRunId}.csv`; link.click()
      URL.revokeObjectURL(url)
    } catch (exportError) { setError(exportError.message) }
    finally { setIsExporting(false) }
  }
  const analyticsError = analysis.key === sessionKey ? analysis.errors : ''

  return <div className="analysis-workspace">
    <header className="analysis-heading">
      <div><p className="analysis-kicker">UOSM / VEHICLE DATA</p><h1>Telemetry analysis</h1></div>
      <button className="analysis-export" type="button" onClick={handleExport} disabled={!effectiveRunId || isExporting}>
        <Download size={14} />{isExporting ? 'Exporting...' : 'Export CSV'}
      </button>
    </header>
    {(error || analyticsError) && <p className="analysis-alert" role="alert">{error || analyticsError}</p>}
    {isLoadingRuns && <p className="analysis-message" role="status">Loading sessions...</p>}

    <section className="analysis-session" aria-label="Run selection">
      <div className="analysis-session-selectors">
        <div className="primary-session"><span className="trace-key">A</span>
          <RunSelector runs={runs} selectedRunId={effectiveRunId} onRunChange={(id) => changeSelection(id, String(id) === String(effectiveCompareRunId) ? '' : effectiveCompareRunId)} />
        </div>
        <div className="reference-session"><span className="trace-key is-reference">B</span>
          <label htmlFor="compare-run">Reference run<select id="compare-run" value={effectiveCompareRunId}
            onChange={(event) => changeSelection(effectiveRunId, event.target.value)} disabled={runs.length < 2}>
            <option value="">None / single run</option>
            {runs.filter((run) => run !== primaryRun).map((run) => <option key={run.run_id} value={run.run_id}>{nameOf(run)}</option>)}
          </select></label>
        </div>
      </div>
      <div className="session-context">
        <span><b>CAR</b>{primaryRun?.carName || '\u2014'}</span>
        <span><b>DRIVER</b>{primaryRun?.driverName || '\u2014'}</span>
        <span><b>LOCATION</b>{primaryRun?.locationName || '\u2014'}</span>
        <span><b>RUN ID</b>{effectiveRunId ? `#${effectiveRunId}` : '\u2014'}</span>
      </div>
    </section>

    <section className="analysis-statistics single-run-summary" aria-label="Run statistics">
      <div className="section-caption"><span>SESSION STATISTICS</span><span>{isLoadingAnalysis ? 'Loading statistics...' : 'Full-run analytics'}</span></div>
      <div className="analysis-table-scroll"><table>
        <thead><tr><th scope="col">Run</th><th scope="col">Peak speed</th><th scope="col">Average speed</th><th scope="col">Duration</th><th scope="col">Readings</th></tr></thead>
        <tbody>{primaryRun && <SummaryRow run={primaryRun} analytics={primaryAnalytics} />}
          {compareRun && <SummaryRow run={compareRun} analytics={referenceAnalytics} reference />}</tbody>
      </table></div>
      {compareRun && primaryAnalytics?.max_speed != null && referenceAnalytics?.max_speed != null && <div className="analysis-delta">
        <span>B - A / Peak speed</span><strong>{formatNumber(toDisplayValue(referenceAnalytics.max_speed - primaryAnalytics.max_speed, 'speed'))} km/h</strong>
      </div>}
    </section>

    <section className="analysis-traces" aria-label="Telemetry channels">
      <div className="analysis-timebar" role="group" aria-label="Shared time window">
        <div className="timebase-label"><strong>TIME WINDOW</strong><span>Tick / ms since boot</span></div>
        <span className="time-window-readout">{bounds ? `${formatNumber(bounds.min, 0)} \u2013 ${formatNumber(bounds.max, 0)} ms` : 'Full run'}</span>
        <details className="trace-visibility"><summary>Traces <span>{visibleMetrics.length}/4</span></summary>
          <fieldset className="channel-switches"><legend>Visible traces</legend>
            {metricDefinitions.map((metric) => <label key={metric.id}>
              <input type="checkbox" aria-label={metric.title} checked={visibleMetrics.includes(metric.id)}
                onChange={() => setVisibleMetrics((current) => current.includes(metric.id) ? current.filter((id) => id !== metric.id) : [...current, metric.id])} />
              <span>{metric.title}</span><small>{metric.unit}</small>
            </label>)}
          </fieldset>
        </details>
        <details className="exact-range"><summary>Exact range</summary><div className="exact-range-panel">
          <TickRangeForm key={`${sessionKey}:${bounds?.min}:${bounds?.max}`} bounds={bounds} onChange={onRangeChange} />
        </div></details>
        <button className="view-reset" type="button" onClick={() => onRangeChange(null)} disabled={!effectiveRunId}><RotateCcw size={13} />Reset zoom</button>
      </div>
      <div className="trace-instructions"><span><i className="trace-line" />A / Primary{compareRun && <><i className="trace-line reference" />B / Reference</>}</span>
        <span>Pinch to zoom. Drag to pan. Double-tap to reset.</span></div>
      {effectiveRunId ? <TelemetryChartHolder charts={runCharts.filter((chart) => visibleMetrics.includes(chart.id))}
        visibleRange={visibleRange} onRangeChange={onRangeChange} onOverview={onOverview} />
        : <p className="analysis-message">{isLoadingRuns ? 'Waiting for session data...' : 'Select or import a run to view telemetry.'}</p>}
      <footer className="analysis-footnote"><span>Shared time axis / boot milliseconds</span><span>800 samples per trace. Brief spikes may be omitted. CSV includes all readings.</span></footer>
    </section>
    {!isLoadingRuns && !runs.length && <p className="analysis-message">No runs available. Import a run to begin analysis.</p>}
  </div>
}

export default AnalysisPage
