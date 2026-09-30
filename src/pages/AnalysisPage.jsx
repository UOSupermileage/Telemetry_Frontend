import { useMemo, useState } from 'react'
import TelemetryChartHolder from '../components/TelemetryChartHolder'
import DashboardSidebar from '../components/DashboardSidebar'
import RunSelector from '../components/RunSelector'
import { telemetry } from '../data/mockData'
import './AnalysisPage.css'

const metricDefinitions = [
  { id: 'speed', title: 'Speed', yKey: 'speed', unit: 'km/h', color: '#6657a5' },
  { id: 'throttle', title: 'Throttle', yKey: 'throttle', unit: '%', color: '#f47700' },
  { id: 'current', title: 'Current', yKey: 'current', unit: 'A', color: '#168a78' },
  { id: 'voltage', title: 'Voltage', yKey: 'voltage', unit: 'V', color: '#3275a8' },
]
const comparisonColor = '#d34e63'

function latestRunId(runs) {
  return [...runs]
    .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))[0]?.run_id ?? ''
}

function runName(run) {
  return run?.name || run?.run_name || `Run #${run?.run_id}`
}

function peakSpeed(runId) {
  const points = telemetry.filter((point) => String(point.run_id) === String(runId))
  return points.length ? Math.max(...points.map((point) => point.speed)) : null
}

function durationMinutes(run) {
  if (!run?.started_at || !run?.ended_at) return null
  const duration = (new Date(run.ended_at) - new Date(run.started_at)) / 60000
  return Number.isFinite(duration) && duration >= 0 ? duration : null
}

function AnalysisPage({ runs = [], selectedRunId: requestedRunId = '' }) {
  const [visibleMetrics, setVisibleMetrics] = useState(metricDefinitions.map(({ id }) => id))
  const [selectedRunId, setSelectedRunId] = useState(() => requestedRunId || latestRunId(runs))
  const [compareRunId, setCompareRunId] = useState('')
  const effectiveRunId = runs.some((run) => String(run.run_id) === String(selectedRunId))
    ? selectedRunId
    : latestRunId(runs)
  const effectiveCompareRunId = runs.some((run) => String(run.run_id) === String(compareRunId)
    && String(run.run_id) !== String(effectiveRunId)) ? compareRunId : ''
  const primaryRun = runs.find((run) => String(run.run_id) === String(effectiveRunId))
  const compareRun = runs.find((run) => String(run.run_id) === String(effectiveCompareRunId))
  const primaryPeak = peakSpeed(effectiveRunId)
  const comparePeak = compareRun ? peakSpeed(effectiveCompareRunId) : null

  const runCharts = useMemo(() => metricDefinitions.map((metric) => ({
    ...metric,
    series: [
      { id: String(effectiveRunId), label: runName(primaryRun), color: metric.color,
        data: telemetry.filter((point) => String(point.run_id) === String(effectiveRunId)) },
      ...(compareRun ? [{ id: String(effectiveCompareRunId), label: runName(compareRun), color: comparisonColor,
        data: telemetry.filter((point) => String(point.run_id) === String(effectiveCompareRunId)) }] : []),
    ],
  })), [effectiveRunId, effectiveCompareRunId, primaryRun, compareRun])

  const handleRunChange = (runId) => {
    setSelectedRunId(runId)
    if (String(runId) === String(effectiveCompareRunId)) setCompareRunId('')
    window.history.replaceState(null, '', `#analysis?run=${encodeURIComponent(runId)}`)
  }

  const toggleMetric = (metric) => {
    setVisibleMetrics((current) => current.includes(metric)
      ? current.filter((item) => item !== metric)
      : [...current, metric])
  }

  return (
    <>
      <RunSelector runs={runs} selectedRunId={effectiveRunId} onRunChange={handleRunChange} />
      <section className="run-comparison-controls" aria-label="Compare runs">
        <label htmlFor="compare-run">Compare with</label>
        <select
          id="compare-run"
          value={effectiveCompareRunId}
          onChange={(event) => setCompareRunId(event.target.value)}
          disabled={runs.length < 2}
        >
          <option value="">No comparison</option>
          {runs.filter((run) => String(run.run_id) !== String(effectiveRunId)).map((run) => (
            <option key={run.run_id} value={run.run_id}>{runName(run)}</option>
          ))}
        </select>
      </section>

      {compareRun && <section className="comparison-summary" aria-label="Run comparison summary">
        {[primaryRun, compareRun].map((run, index) => {
          const peak = index === 0 ? primaryPeak : comparePeak
          const duration = durationMinutes(run)
          return <article className="comparison-summary-card" key={run.run_id}>
            <h2><i style={{ backgroundColor: index === 0 ? '#6657a5' : comparisonColor }} />{runName(run)}</h2>
            <p><span>Peak speed</span><strong>{peak == null ? 'No telemetry' : `${peak} km/h`}</strong></p>
            <p><span>Duration</span><strong>{duration == null ? '—' : `${duration} min`}</strong></p>
          </article>
        })}
        {primaryPeak != null && comparePeak != null && <p className="comparison-delta">
          Peak speed difference: <strong>{comparePeak - primaryPeak > 0 ? '+' : ''}{comparePeak - primaryPeak} km/h</strong>
        </p>}
      </section>}

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
