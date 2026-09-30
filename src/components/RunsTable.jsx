import { useMemo, useState } from 'react'
import { mockCars, mockDrivers, mockLocations } from '../data/mockData'
import './RunsTable.css'

function RunsTable({ runs = [], onRunSelect, onRunEdit, onRunDelete }) {
  const [sortConfig, setSortConfig] = useState({
    key: 'started_at',
    direction: 'desc',
  })

  const [search, setSearch] = useState('')
  const [carFilter, setCarFilter] = useState('')
  const [driverFilter, setDriverFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [openMenuId, setOpenMenuId] = useState(null)
  const [runPendingDelete, setRunPendingDelete] = useState(null)

  // Get unique IDs for the filter dropdowns
  const carIds = [...new Set(runs.map((run) => run.car_id).filter((id) => id != null))]
  const driverIds = [...new Set(runs.map((run) => run.driver_id).filter((id) => id != null))]
  const locationIds = [...new Set(runs.map((run) => run.location_id).filter((id) => id != null))]
  const carName = (id) => mockCars.find((item) => item.id === Number(id))?.name ?? `Car ${id}`
  const driverName = (id) => mockDrivers.find((item) => item.id === Number(id))?.name ?? `Driver ${id}`
  const locationName = (id) => mockLocations.find((item) => item.id === Number(id))?.name ?? `Location ${id}`

  // Filter runs
  const filteredRuns = useMemo(() => {
    return runs.filter((run) => {
      const searchText = search.toLowerCase()

      const matchesSearch =
        !search ||
        String(run.name ?? run.run_name ?? '').toLowerCase().includes(searchText) ||
        String(run.run_id ?? '').toLowerCase().includes(searchText) ||
        String(run.car_id ?? '').toLowerCase().includes(searchText) ||
        String(run.driver_id ?? '').toLowerCase().includes(searchText) ||
        String(run.location_id ?? '').toLowerCase().includes(searchText) ||
        [carName(run.car_id), driverName(run.driver_id), locationName(run.location_id)]
          .some((value) => value.toLowerCase().includes(searchText)) ||
        String(run.notes ?? '').toLowerCase().includes(searchText)

      const matchesCar =
        !carFilter || String(run.car_id ?? '') === carFilter

      const matchesDriver =
        !driverFilter || String(run.driver_id ?? '') === driverFilter

      const matchesLocation =
        !locationFilter ||
        String(run.location_id ?? '') === locationFilter

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
    return sortConfig.direction === 'asc' ? ' (ascending)' : ' (descending)'
  }

  const formatDate = (date) => {
    if (!date) return '-'
    const parsed = new Date(date)
    return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleString()
  }

  const renderSortHeader = (label, key) => (
    <th key={key} scope="col" aria-sort={sortConfig.key === key ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => handleSort(key)}>
        {label}{getSortArrow(key)}
      </button>
    </th>
  )

  return (
    <div className="runs-table-container">

      {/* Filters */}
      <div className="runs-filters">

        <label className="visually-hidden" htmlFor="runs-search">Search runs</label>
        <input
          id="runs-search"
          type="text"
          placeholder="Search runs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="runs-search"
        />

        <select
          aria-label="Filter by car"
          value={carFilter}
          onChange={(e) => setCarFilter(e.target.value)}
        >
          <option value="">All Cars</option>

          {carIds.map((id) => (
            <option key={id} value={id}>
              {carName(id)}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by driver"
          value={driverFilter}
          onChange={(e) => setDriverFilter(e.target.value)}
        >
          <option value="">All Drivers</option>

          {driverIds.map((id) => (
            <option key={id} value={id}>
              {driverName(id)}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by location"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
        >
          <option value="">All Locations</option>

          {locationIds.map((id) => (
            <option key={id} value={id}>
              {locationName(id)}
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
              {renderSortHeader('Run name', 'name')}
              {renderSortHeader('Run ID', 'run_id')}
              {renderSortHeader('Started', 'started_at')}
              {renderSortHeader('Ended', 'ended_at')}
              {renderSortHeader('Car', 'car_id')}
              {renderSortHeader('Driver', 'driver_id')}
              {renderSortHeader('Location', 'location_id')}
              <th scope="col">Notes</th>
              {renderSortHeader('Created', 'date_created')}
              <th scope="col"><span className="visually-hidden">Actions</span></th>
            </tr>
          </thead>

          <tbody>
            {sortedRuns.length === 0 ? (
              <tr>
                <td colSpan="10" className="no-runs">
                  No runs found.
                </td>
              </tr>
            ) : (
              sortedRuns.map((run) => (
                <tr
                  key={run.run_id}
                  className="run-row"
                  tabIndex={0}
                  aria-label={`Analyze run ${run.run_id}`}
                  onClick={() => onRunSelect?.(run)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onRunSelect?.(run)
                    }
                  }}
                >
                  <td>{run.name || run.run_name || `Run #${run.run_id}`}</td>
                  <td>{run.run_id ?? '-'}</td>
                  <td>{formatDate(run.started_at)}</td>
                  <td>{formatDate(run.ended_at)}</td>
                  <td>{run.car_id == null ? '-' : carName(run.car_id)}</td>
                  <td>{run.driver_id == null ? '-' : driverName(run.driver_id)}</td>
                  <td>{run.location_id == null ? '-' : locationName(run.location_id)}</td>
                  <td>{run.notes || '-'}</td>
                  <td>{formatDate(run.date_created)}</td>
                  <td className="run-actions-cell">
                    <div className="run-actions-menu-wrap">
                      <button type="button" className="run-edit-button" aria-label={`Actions for run ${run.name || run.run_name || run.run_id}`} title="Run actions" aria-haspopup="menu" aria-expanded={openMenuId === run.run_id} onClick={(event) => { event.stopPropagation(); setOpenMenuId((current) => current === run.run_id ? null : run.run_id) }} onKeyDown={(event) => event.stopPropagation()}>
                        <span aria-hidden="true">••</span>
                      </button>
                      {openMenuId === run.run_id && <div className="run-actions-menu" role="menu" onClick={(event) => event.stopPropagation()}>
                        <button type="button" role="menuitem" onClick={() => { setOpenMenuId(null); onRunEdit?.(run) }}>Edit</button>
                        <button type="button" role="menuitem" className="delete-run-action" onClick={() => { setOpenMenuId(null); setRunPendingDelete(run) }}>Delete</button>
                      </div>}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>
      {runPendingDelete && <div className="delete-confirm-overlay" onClick={() => setRunPendingDelete(null)}>
        <section className="delete-confirm-popup" role="alertdialog" aria-modal="true" aria-labelledby="delete-run-title" aria-describedby="delete-run-description" onClick={(event) => event.stopPropagation()}>
          <h2 id="delete-run-title">Delete run?</h2>
          <p id="delete-run-description">Are you sure you want to delete <strong>{runPendingDelete.name || runPendingDelete.run_name || `Run #${runPendingDelete.run_id}`}</strong>? This action cannot be undone.</p>
          <div className="delete-confirm-actions">
            <button type="button" className="delete-cancel-button" onClick={() => setRunPendingDelete(null)}>Cancel</button>
            <button type="button" className="delete-confirm-button" onClick={() => { onRunDelete?.(runPendingDelete); setRunPendingDelete(null) }}>Delete run</button>
          </div>
        </section>
      </div>}
    </div>
  )
}

export default RunsTable
