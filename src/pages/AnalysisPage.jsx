import { useState } from 'react'
import TelemetryChartHolder from '../components/TelemetryChartHolder'
import DashboardSidebar from '../components/DashboardSidebar'
import { mockCars, mockDrivers, mockLocations, telemetry } from '../data/mockData'

const charts = [
  { id: 'speed', title: 'Speed', data: telemetry, yKey: 'speed', unit: 'km/h', color: '#6657a5' },
  { id: 'throttle', title: 'Throttle', data: telemetry, yKey: 'throttle', unit: '%', color: '#f47700' },
  { id: 'current', title: 'Current', data: telemetry, yKey: 'current', unit: 'A', color: '#168a78' },
  { id: 'voltage', title: 'Voltage', data: telemetry, yKey: 'voltage', unit: 'V', color: '#3275a8' },
]

function AnalysisPage({ runs = [] }) {
  const [visibleMetrics, setVisibleMetrics] = useState(charts.map(({ id }) => id))
  const selectedRun = [...runs].sort((a, b) => new Date(b.started_at) - new Date(a.started_at))[0]
  const runName = selectedRun?.name || selectedRun?.run_name || (selectedRun ? `Run #${selectedRun.run_id}` : 'No run selected')
  const carName = mockCars.find(({ id }) => id === Number(selectedRun?.car_id))?.name
  const driverName = mockDrivers.find(({ id }) => id === Number(selectedRun?.driver_id))?.name
  const locationName = mockLocations.find(({ id }) => id === Number(selectedRun?.location_id))?.name

  const toggleMetric = (metric) => {
    setVisibleMetrics((current) => current.includes(metric)
      ? current.filter((item) => item !== metric)
      : [...current, metric])
  }

  return (
    <>
    <section className="selected-run-card" aria-label="Selected run">
      <div>
        <p className="selected-run-label">Currently analyzing</p>
        <h2>{runName}</h2>
      </div>
      {selectedRun && <p className="selected-run-details">
        {[carName, driverName, locationName].filter(Boolean).join(' · ')}
      </p>}
    </section>
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
