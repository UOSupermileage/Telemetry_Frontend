
import { useEffect, useState } from 'react'
import RecentRuns from '../components/RecentRuns'
import { getRecentRuns } from '../services/runs'
import { apiFetch } from '../services/apiClient'

function DashboardPage() {
  const [runs, setRuns] = useState([])
  const [driverCount, setDriverCount] = useState(null)
  const [carCount, setCarCount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [driverError, setDriverError] = useState('')
  const [carError, setCarError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function fetchDashboardData() {
      try {
        setLoading(true)
        setError('')

        const data = await getRecentRuns()

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

    fetchDashboardData()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function fetchDriverCount() {
      try {
        const drivers = await apiFetch('/drivers?limit=500')

        if (!cancelled) {
          setDriverCount(Array.isArray(drivers) ? drivers.length : 0)
        }
      } catch (err) {
        if (!cancelled) {
          setDriverError(err.message || 'Failed to load drivers.')
        }
      }
    }

    fetchDriverCount()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function fetchCarCount() {
      try {
        const cars = await apiFetch('/cars?limit=500')

        if (!cancelled) {
          setCarCount(Array.isArray(cars) ? cars.length : 0)
        }
      } catch (err) {
        if (!cancelled) {
          setCarError(err.message || 'Failed to load cars.')
        }
      }
    }

    fetchCarCount()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="dashboard-page">
      <section className="welcome-card dashboard-overview">
        <div className="dashboard-section-heading">
          <div>
            <h2>Overview</h2>
            <p>Your telemetry workspace at a glance</p>
          </div>

          <span className="welcome-card-icon" aria-hidden="true">
            ◈
          </span>
        </div>

        <div className="dashboard-stats">
          <div className="dashboard-stat">
            <span className="dashboard-stat-icon" aria-hidden="true">
              ↻
            </span>
            <div>
              <p>Total runs</p>
              <strong>
                {loading || error ? '—' : runs.length}
              </strong>
            </div>
          </div>

          <div className="dashboard-stat">
            <span className="dashboard-stat-icon" aria-hidden="true">
              ◎
            </span>
            <div>
              <p>Total drivers</p>
              <strong>
                {driverCount === null || driverError ? '—' : driverCount}
              </strong>
              {driverError && (
                <small role="alert">Could not load driver count.</small>
              )}
            </div>
          </div>

          <div className="dashboard-stat">
            <span className="dashboard-stat-icon" aria-hidden="true">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
              <path d="M5 17h14l1-5-2-5H6l-2 5 1 5Z" />
              <path d="M4 12h16" />
              <path d="M7 7l1-3h8l1 3" />
              <circle cx="7.5" cy="17" r="1.5" />
              <circle cx="16.5" cy="17" r="1.5" />
              </svg>
            </span>
            <div>
              <p>Total cars</p>
              <strong>
                {carCount === null || carError ? '—' : carCount}
              </strong>
              {carError && (
                <small role="alert">Could not load car count.</small>
              )}
            </div>
          </div>
        </div>
      </section>

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
    </div>
  )
}

export default DashboardPage
