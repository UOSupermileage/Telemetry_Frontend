import { useMemo } from 'react'
import { mockCars, mockDrivers, mockLocations } from '../data/mockData'
import './RecentRuns.css'

function RecentRuns({ runs = [], onRunClick }) {
  const recentRuns = useMemo(() => {
    return [...runs]
      .sort((a, b) => {
        const aDate = new Date(a.started_at).getTime()
        const bDate = new Date(b.started_at).getTime()

        return bDate - aDate
      })
      .slice(0, 5)
  }, [runs])

  const carName = (id) =>
    mockCars.find((item) => item.id === Number(id))?.name ?? `Car ${id}`

  const driverName = (id) =>
    mockDrivers.find((item) => item.id === Number(id))?.name ?? `Driver ${id}`

  const locationName = (id) =>
    mockLocations.find((item) => item.id === Number(id))?.name ?? `Location ${id}`

  const formatDate = (date) => {
    if (!date) return '-'

    const parsed = new Date(date)

    return Number.isNaN(parsed.getTime())
      ? '-'
      : parsed.toLocaleDateString()
  }

  return (
    <section className="recent-runs">
      <div className="recent-runs-header">
        <div>
          <h2>Recent Runs</h2>
          <p>Latest telemetry runs</p>
        </div>

        <a href="#runs" className="recent-runs-view-all">
          View all →
        </a>
      </div>

      {recentRuns.length === 0 ? (
        <div className="recent-runs-empty">
          No runs available.
        </div>
      ) : (
        <div className="recent-runs-table-wrapper">
          <table className="recent-runs-table">
            <thead>
              <tr>
                <th>Run</th>
                <th>Date</th>
                <th>Car</th>
                <th>Driver</th>
                <th>Location</th>
              </tr>
            </thead>

            <tbody>
              {recentRuns.map((run) => (
                <tr
                  key={run.run_id}
                  onClick={() => onRunClick?.(run)}
                  className={onRunClick ? 'recent-run-clickable' : ''}
                >
                  <td>#{run.run_id}</td>
                  <td>{formatDate(run.started_at)}</td>
                  <td>{carName(run.car_id)}</td>
                  <td>{driverName(run.driver_id)}</td>
                  <td>{locationName(run.location_id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default RecentRuns