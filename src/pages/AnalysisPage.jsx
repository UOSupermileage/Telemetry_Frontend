import { useState } from 'react'
import TelemetryChartHolder from '../components/TelemetryChartHolder'
import DashboardSidebar from '../components/DashboardSidebar'
import RunSelector from '../components/RunSelector'
import { telemetry } from '../data/mockData'

const charts = [
  { id: 'speed', title: 'Speed', data: telemetry, yKey: 'speed', unit: 'km/h', color: '#6657a5' },
  { id: 'throttle', title: 'Throttle', data: telemetry, yKey: 'throttle', unit: '%', color: '#f47700' },
  { id: 'current', title: 'Current', data: telemetry, yKey: 'current', unit: 'A', color: '#168a78' },
  { id: 'voltage', title: 'Voltage', data: telemetry, yKey: 'voltage', unit: 'V', color: '#3275a8' },
]

function latestRunId(runs) {
  return [...runs]
    .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))[0]?.run_id ?? ''
}

function AnalysisPage({ runs = [] }) {
  const [visibleMetrics, setVisibleMetrics] = useState(charts.map(({ id }) => id))
  const [selectedRunId, setSelectedRunId] = useState(() => latestRunId(runs))
  const effectiveRunId = runs.some((run) => String(run.run_id) === String(selectedRunId))
    ? selectedRunId
    : latestRunId(runs)

  const toggleMetric = (metric) => {
    setVisibleMetrics((current) => current.includes(metric)
      ? current.filter((item) => item !== metric)
      : [...current, metric])
  }

  return (
    <>
    <RunSelector runs={runs} selectedRunId={effectiveRunId} onRunChange={setSelectedRunId} />
    <div className="dashboard-layout">
      <div className="dashboard-sidebar-panel">
        <DashboardSidebar visibleMetrics={visibleMetrics} onMetricToggle={toggleMetric} />
      </div>
      <div className="dashboard-graph-area">
        <TelemetryChartHolder charts={charts.filter((chart) => visibleMetrics.includes(chart.id))} />
      </div>
    </div>
    </>
  )
}

export default AnalysisPage
