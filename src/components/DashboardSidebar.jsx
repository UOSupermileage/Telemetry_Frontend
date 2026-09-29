import TelemetryTabs from './TelemetryTabs'
import './DashboardSidebar.css'

function DashboardSidebar({ hiddenMetrics, onMetricToggle }) {
  return (
    <aside className="dashboard-sidebar">

      <section className="filter-section">
        <h2>Filters</h2>

        {/* Your filters go here */}
      </section>

      <section className="telemetry-section">
        <h2>Telemetry</h2>

        <TelemetryTabs hiddenMetrics={hiddenMetrics} onMetricToggle={onMetricToggle} />
      </section>

    </aside>
  )
}

export default DashboardSidebar
