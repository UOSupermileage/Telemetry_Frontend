import { useEffect, useState } from 'react'
import RecentRuns from '../components/RecentRuns'
import { getRecentRuns } from '../services/runs'

function DashboardPage({ onNavigate }) {
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function fetchRecentRuns() {
      try {
        setLoading(true)
        setError('')

        const data = await getRecentRuns()
        console.log('Fetched recent runs:', data)
        if (!cancelled) {
          setRuns(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load recent runs.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchRecentRuns()

    return () => {
      cancelled = true
    }
  }, [])

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
        <section className="welcome-card welcome-card-recent-runs">
          {loading ? (
          <p>Loading recent runs...</p>
          ) : error ? (
          <p role="alert">Could not load recent runs: {error}</p>
          ) : runs.length === 0 ? (
          <p>No runs found. Import a run to get started.</p>
          ) : (
          <RecentRuns runs={runs} />
          )}
        </section>

        <button
          className="welcome-card"
          type="button"
          onClick={() => onNavigate('analysis')}
        >   
          <span className="welcome-card-icon" aria-hidden="true">◎</span>
          <span className="welcome-card-copy">
            <strong>Explore analysis</strong>
            <span>View telemetry graphs and compare key metrics.</span>
          </span>
          <span className="welcome-arrow" aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  )
}

export default DashboardPage