import { useMemo, useState } from 'react'
import './RunsTable.css'

function RunsTable({ runs = [], onRunClick }) {
  const [sortConfig, setSortConfig] = useState({
    key: 'started_at',
    direction: 'desc',
  })

  const [search, setSearch] = useState('')
  const [carFilter, setCarFilter] = useState('')
  const [driverFilter, setDriverFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')

  // Get unique IDs for the filter dropdowns
  const carIds = [...new Set(runs.map((run) => run.car_id))]
  const driverIds = [...new Set(runs.map((run) => run.driver_id))]
  const locationIds = [...new Set(runs.map((run) => run.location_id))]

  // Filter runs
  const filteredRuns = useMemo(() => {
    return runs.filter((run) => {
      const searchText = search.toLowerCase()

      const matchesSearch =
        !search ||
        run.run_id.toString().includes(searchText) ||
        run.car_id.toString().includes(searchText) ||
        run.driver_id.toString().includes(searchText) ||
        run.location_id.toString().includes(searchText) ||
        run.notes?.toLowerCase().includes(searchText)

      const matchesCar =
        !carFilter || run.car_id.toString() === carFilter

      const matchesDriver =
        !driverFilter || run.driver_id.toString() === driverFilter

      const matchesLocation =
        !locationFilter ||
        run.location_id.toString() === locationFilter

      return (
        matchesSearch &&
        matchesCar &&
        matchesDriver &&
        matchesLocation
      )
    })
  }, [runs, search, carFilter, driverFilter, locationFilter])

  // Sort runs
  const sortedRuns = useMemo(() => {
    const sorted = [...filteredRuns]

    sorted.sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (aValue == null) return 1
      if (bValue == null) return -1

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }

      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }

      return 0
    })

    return sorted
  }, [filteredRuns, sortConfig])

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === 'asc'
          ? 'desc'
          : 'asc',
    }))
  }

  const getSortArrow = (key) => {
    if (sortConfig.key !== key) return ''
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓'
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleString()
  }

  return (
    <div className="runs-table-container">

      {/* Filters */}
      <div className="runs-filters">

        <input
          type="text"
          placeholder="Search runs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="runs-search"
        />

        <select
          value={carFilter}
          onChange={(e) => setCarFilter(e.target.value)}
        >
          <option value="">All Cars</option>

          {carIds.map((id) => (
            <option key={id} value={id}>
              Car {id}
            </option>
          ))}
        </select>

        <select
          value={driverFilter}
          onChange={(e) => setDriverFilter(e.target.value)}
        >
          <option value="">All Drivers</option>

          {driverIds.map((id) => (
            <option key={id} value={id}>
              Driver {id}
            </option>
          ))}
        </select>

        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
        >
          <option value="">All Locations</option>

          {locationIds.map((id) => (
            <option key={id} value={id}>
              Location {id}
            </option>
          ))}
        </select>

      </div>

      <div className="runs-count">
        Showing {sortedRuns.length} of {runs.length} runs
      </div>

      {/* Table */}
      <div className="runs-table-wrapper">
        <table className="runs-table">

          <thead>
            <tr>
              <th onClick={() => handleSort('run_id')}>
                Run ID{getSortArrow('run_id')}
              </th>

              <th onClick={() => handleSort('started_at')}>
                Started{getSortArrow('started_at')}
              </th>

              <th onClick={() => handleSort('ended_at')}>
                Ended{getSortArrow('ended_at')}
              </th>

              <th onClick={() => handleSort('car_id')}>
                Car{getSortArrow('car_id')}
              </th>

              <th onClick={() => handleSort('driver_id')}>
                Driver{getSortArrow('driver_id')}
              </th>

              <th onClick={() => handleSort('location_id')}>
                Location{getSortArrow('location_id')}
              </th>

              <th>Notes</th>

              <th onClick={() => handleSort('date_created')}>
                Created{getSortArrow('date_created')}
              </th>
            </tr>
          </thead>

          <tbody>
            {sortedRuns.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-runs">
                  No runs found.
                </td>
              </tr>
            ) : (
              sortedRuns.map((run) => (
                <tr
                  key={run.run_id}
                  onClick={() => onRunClick?.(run)}
                  className="run-row"
                >
                  <td>{run.run_id}</td>
                  <td>{formatDate(run.started_at)}</td>
                  <td>{formatDate(run.ended_at)}</td>
                  <td>Car {run.car_id}</td>
                  <td>Driver {run.driver_id}</td>
                  <td>Location {run.location_id}</td>
                  <td>{run.notes || '-'}</td>
                  <td>{formatDate(run.date_created)}</td>
                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>
    </div>
  )
}

export default RunsTable