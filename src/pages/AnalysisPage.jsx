import { useEffect, useMemo, useState } from 'react'
import TelemetryChartHolder from '../components/TelemetryChartHolder'
import DashboardSidebar from '../components/DashboardSidebar'
import RunSelector from '../components/RunSelector'
import { exportTelemetry, getAllRuns, getAllTelemetryData, getRun, getRunAnalytics } from '../services/runs'
import './AnalysisPage.css'

const metricDefinitions = [
  { id: 'speed', title: 'Speed', yKey: 'speed', unit: 'km/h', color: '#6657a5' },
  { id: 'throttle', title: 'Throttle', yKey: 'throttle', unit: '%', color: '#f47700' },
  { id: 'current', title: 'Current', yKey: 'current', unit: 'A', color: '#168a78' },
  { id: 'voltage', title: 'Voltage', yKey: 'voltage', unit: 'V', color: '#3275a8' },
]
const comparisonColor = '#d34e63'
const telemetryFields = ['tick', 'throttle', 'speed', 'current', 'voltage']

function latestRunId(runs) {
  return [...runs]
    .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))[0]?.run_id ?? ''
}

function runName(run) {
  return run?.name || run?.run_name || `Run #${run?.run_id}`
}

function metricValue(value, unit = '') {
  if (value == null || !Number.isFinite(Number(value))) return '—'
  return <>{Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}{unit && <small> {unit}</small>}</>
}

function AnalyticsCard({ run, analytics, color, compared = false }) {
  return (
    <article className={`comparison-summary-card${compared ? ' is-compared' : ''}`}>
      <h3><i style={{ backgroundColor: color }} />{runName(run)}</h3>
      <div className="comparison-card-metrics">
        <p><span>Peak speed</span><strong>{metricValue(analytics?.max_speed, 'km/h')}</strong></p>
        <p><span>Average speed</span><strong>{metricValue(analytics?.average_speed, 'km/h')}</strong></p>
        <p><span>Duration</span><strong>{metricValue(analytics?.duration_seconds == null ? null : analytics.duration_seconds / 60, 'min')}</strong></p>
        <p><span>Telemetry points</span><strong>{analytics?.telemetry_points ?? '—'}</strong></p>
      </div>
    </article>
  )
}

function AnalysisPage({ selectedRunId: requestedRunId = '', requestedCompareRunId = '' }) {
  const [runs, setRuns] = useState([])
  const [visibleMetrics, setVisibleMetrics] = useState(metricDefinitions.map(({ id }) => id))
  const [selectedRunId, setSelectedRunId] = useState(requestedRunId)
  const [compareRunId, setCompareRunId] = useState(requestedCompareRunId)
  const [analysisByRun, setAnalysisByRun] = useState({})
  const [isLoadingRuns, setIsLoadingRuns] = useState(true)
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setSelectedRunId(requestedRunId)
    setCompareRunId(requestedCompareRunId)
  }, [requestedRunId, requestedCompareRunId])

  useEffect(() => {
    const controller = new AbortController()
    getAllRuns({ signal: controller.signal })
      .then((result) => setRuns(result))
      .catch((loadError) => {
        if (loadError.name !== 'AbortError') setError(loadError.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingRuns(false)
      })
    return () => controller.abort()
  }, [])

  const effectiveRunId = runs.some((run) => String(run.run_id) === String(selectedRunId))
    ? selectedRunId
    : latestRunId(runs)
  const effectiveCompareRunId = runs.some((run) => String(run.run_id) === String(compareRunId)
    && String(run.run_id) !== String(effectiveRunId)) ? compareRunId : ''
  const primaryRun = analysisByRun[String(effectiveRunId)]?.run
    ?? runs.find((run) => String(run.run_id) === String(effectiveRunId))
  const compareRun = analysisByRun[String(effectiveCompareRunId)]?.run
    ?? runs.find((run) => String(run.run_id) === String(effectiveCompareRunId))
  const primaryAnalysis = analysisByRun[String(effectiveRunId)]
  const compareAnalysis = analysisByRun[String(effectiveCompareRunId)]

  useEffect(() => {
    const runIds = [...new Set([effectiveRunId, effectiveCompareRunId].filter(Boolean).map(String))]
    if (runIds.length === 0) {
      setAnalysisByRun({})
      return undefined
    }

    const controller = new AbortController()
    setIsLoadingAnalysis(true)
    setError('')
    Promise.all(runIds.map(async (runId) => {
      const [run, points, analytics] = await Promise.all([
        getRun(runId, { signal: controller.signal }),
        getAllTelemetryData({ runId, fields: telemetryFields, signal: controller.signal }),
        getRunAnalytics(runId, { signal: controller.signal }),
      ])
      return [String(runId), { run, points, analytics }]
    }))
      .then((entries) => setAnalysisByRun(Object.fromEntries(entries)))
      .catch((loadError) => {
        if (loadError.name !== 'AbortError') setError(loadError.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingAnalysis(false)
      })
    return () => controller.abort()
  }, [effectiveRunId, effectiveCompareRunId])

  const runCharts = useMemo(() => metricDefinitions.map((metric) => ({
    ...metric,
    series: [
      { id: String(effectiveRunId), label: runName(primaryRun), color: metric.color,
        data: primaryAnalysis?.points ?? [] },
      ...(compareRun ? [{ id: String(effectiveCompareRunId), label: runName(compareRun), color: comparisonColor,
        data: compareAnalysis?.points ?? [] }] : []),
    ],
  })), [effectiveRunId, effectiveCompareRunId, primaryRun, compareRun, primaryAnalysis, compareAnalysis])

  const updateHash = (runId, compareId) => {
    const params = new URLSearchParams()
    if (runId) params.set('run', runId)
    if (compareId) params.set('compare', compareId)
    window.history.replaceState(null, '', `#analysis?${params}`)
  }

  const handleRunChange = (runId) => {
    const nextCompareId = String(runId) === String(effectiveCompareRunId) ? '' : effectiveCompareRunId
    setSelectedRunId(runId)
    setCompareRunId(nextCompareId)
    updateHash(runId, nextCompareId)
  }

  const handleCompareChange = (runId) => {
    setCompareRunId(runId)
    updateHash(effectiveRunId, runId)
  }

  const toggleMetric = (metric) => {
    setVisibleMetrics((current) => current.includes(metric)
      ? current.filter((item) => item !== metric)
      : [...current, metric])
  }

  const handleExport = async () => {
    if (!effectiveRunId) return
    setIsExporting(true)
    setError('')
    try {
      const blob = await exportTelemetry(effectiveRunId)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `telemetry_run_${effectiveRunId}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (exportError) {
      setError(exportError.message)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      {isLoadingRuns && <p role="status">Loading runs…</p>}
      {error && <p role="alert">{error}</p>}
      <div className="analysis-run-actions">
        <RunSelector runs={runs} selectedRunId={effectiveRunId} onRunChange={handleRunChange} />
        <button type="button" className="export-telemetry-button" onClick={handleExport}
          disabled={!effectiveRunId || isExporting}>
          {isExporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      <section className="run-comparison-panel" aria-label="Compare runs">
        <div className="run-comparison-topline">
          <div>
            <span className="comparison-eyebrow">Analysis tools</span>
            <h2>Compare runs</h2>
            <p>Overlay telemetry and compare session highlights.</p>
          </div>
          <span className="comparison-badge">OPTIONAL</span>
        </div>
        <div className="run-comparison-controls">
          <label htmlFor="compare-run">
            <span className="comparison-select-label">Compare this run with</span>
            <span className="comparison-select-hint">Choose another session to overlay its charts.</span>
          </label>
          <select id="compare-run" value={effectiveCompareRunId} onChange={(event) => handleCompareChange(event.target.value)}
            disabled={runs.length < 2}>
            <option value="">Select a run to compare</option>
            {runs.filter((run) => String(run.run_id) !== String(effectiveRunId)).map((run) => (
              <option key={run.run_id} value={run.run_id}>{runName(run)}</option>
            ))}
          </select>
        </div>

        {compareRun && compareAnalysis ? <div className="comparison-summary" aria-label="Run comparison summary">
          <AnalyticsCard run={primaryRun} analytics={primaryAnalysis?.analytics} color="#6657a5" />
          <AnalyticsCard run={compareRun} analytics={compareAnalysis.analytics} color={comparisonColor} compared />
          {primaryAnalysis?.analytics?.max_speed != null && compareAnalysis.analytics.max_speed != null && (
            <div className="comparison-delta">
              <span>Peak speed difference</span>
              <strong>{compareAnalysis.analytics.max_speed - primaryAnalysis.analytics.max_speed > 0 ? '+' : ''}{(compareAnalysis.analytics.max_speed - primaryAnalysis.analytics.max_speed).toFixed(2)} <small>km/h</small></strong>
            </div>
          )}
        </div> : primaryAnalysis ? <div className="comparison-summary single-run-summary" aria-label="Run analytics">
          <AnalyticsCard run={primaryRun} analytics={primaryAnalysis.analytics} color="#6657a5" />
        </div> : <p className="comparison-empty">{isLoadingAnalysis ? 'Loading telemetry and analytics…' : 'Select a run to load its telemetry and analytics.'}</p>}
      </section>

      <div className="dashboard-layout">
        <div className="dashboard-sidebar-panel">
          <DashboardSidebar visibleMetrics={visibleMetrics} onMetricToggle={toggleMetric} />
        </div>
        <div className="dashboard-graph-area">
          <TelemetryChartHolder charts={runCharts.filter((chart) => visibleMetrics.includes(chart.id))} />
        </div>
      </div>
    </>
  )
}

export default AnalysisPage
