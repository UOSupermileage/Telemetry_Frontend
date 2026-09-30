import TelemetryTabs from './TelemetryTabs'
import './DashboardSidebar.css'

function DashboardSidebar({ visibleMetrics, onMetricToggle }) {
  return (
    <div className="dashboard-sidebar">

      <section className="telemetry-section">
        <div className="telemetry-section-heading">
          <div>
            <h2>Metrics</h2>
            <p>Choose which charts to display.</p>
          </div>
          <span className="telemetry-count">{visibleMetrics.length}/4</span>
        </div>

        <TelemetryTabs visibleMetrics={visibleMetrics} onMetricToggle={onMetricToggle} />
      </section>

    </div>
  )
}

export default DashboardSidebar
