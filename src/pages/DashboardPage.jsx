import RecentRuns from '../components/RecentRuns'

const testRuns = [
  {
    run_id: 1,
    car_id: 2,
    driver_id: 3,
    location_id: 1,
    started_at: '2026-09-20T14:00:00',
  },
  {
    run_id: 2,
    car_id: 1,
    driver_id: 4,
    location_id: 2,
    started_at: '2026-09-21T10:30:00',
  },
  {
    run_id: 3,
    car_id: 2,
    driver_id: 3,
    location_id: 1,
    started_at: '2026-09-22T13:00:00',
  },
  {
    run_id: 4,
    car_id: 1,
    driver_id: 4,
    location_id: 2,
    started_at: '2026-09-25T09:00:00',
  },
  {
    run_id: 5,
    car_id: 2,
    driver_id: 3,
    location_id: 1,
    started_at: '2026-09-28T15:00:00',
  },
  {
    run_id: 6,
    car_id: 1,
    driver_id: 4,
    location_id: 2,
    started_at: '2026-09-29T11:00:00',
  },
]

function DashboardPage() {
  return (
    <div className="welcome-page">
      <section className="welcome-banner">
        <span className="welcome-mark" aria-hidden="true">◈</span>
        <div>
          <p className="welcome-kicker">Telemetry workspace</p>
          <h2>Welcome to your telemetry hub</h2>
          <p>
            Explore vehicle runs, then dive into the data to understand every test.
          </p>
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

      <RecentRuns runs={testRuns} />
    </div>
  )
}

export default DashboardPage