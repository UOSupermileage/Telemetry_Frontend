function DashboardPage() {
  return (
    <div className="welcome-page">
      <section className="welcome-banner">
        <span className="welcome-mark" aria-hidden="true">◈</span>
        <div>
          <p className="welcome-kicker">Telemetry workspace</p>
          <h2>Welcome to your telemetry hub</h2>
          <p>Explore vehicle runs, then dive into the data to understand every test.</p>
        </div>
      </section>

      <div className="welcome-actions">
        <a className="welcome-card" href="#runs">
          <span className="welcome-card-icon" aria-hidden="true">↻</span>
          <span className="welcome-card-copy">
            <strong>Browse runs</strong>
            <span>Review test sessions and import a new run.</span>
          </span>
          <span className="welcome-arrow" aria-hidden="true">→</span>
        </a>
        <a className="welcome-card" href="#analysis">
          <span className="welcome-card-icon" aria-hidden="true">◎</span>
          <span className="welcome-card-copy">
            <strong>Explore analysis</strong>
            <span>View telemetry graphs and compare key metrics.</span>
          </span>
          <span className="welcome-arrow" aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  )
}

export default DashboardPage
