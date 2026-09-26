import DashboardSidebar from '../components/DashboardSidebar'

function DashboardPage() {
  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar-panel">
        <DashboardSidebar />
      </aside>
      <div className="dashboard-graph-area" aria-label="Telemetry dashboard">
        {/* Dashboard charts will be added here. */}
      </div>
    </div>
  )
}

export default DashboardPage
