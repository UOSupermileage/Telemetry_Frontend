import TelemetryTabs from './TelemetryTabs'
import './DashboardSidebar.css'

function DashboardSidebar() {
  return (
    <aside className="dashboard-sidebar">

      <section className="filter-section">
        <h2>Filters</h2>

        {/* Your filters go here */}
      </section>

      <section className="telemetry-section">
        <h2>Telemetry</h2>

        <TelemetryTabs />
      </section>

    </aside>
  )
}

export default DashboardSidebar