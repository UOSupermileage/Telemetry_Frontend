import TelemetryTabs from './TelemetryTabs'
import './DashboardSidebar.css'

function DashboardSidebar({ visibleMetrics, onMetricToggle }) {
  return (
    <div className="dashboard-sidebar">

      <section className="telemetry-section">
        <h2>Telemetry</h2>

        <TelemetryTabs visibleMetrics={visibleMetrics} onMetricToggle={onMetricToggle} />
      </section>

    </div>
  )
}

export default DashboardSidebar
