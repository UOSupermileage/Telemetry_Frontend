
import { useEffect, useMemo, useState } from 'react'
import './RunsTable.css'

/**
 * Table for filtering, sorting, selecting, and opening run records.
 *
 * @param {Object} props
 * @param {import('../services/runs').Run[]} [props.runs]
 * @param {{id: string|number, name: string}[]} [props.cars]
 * @param {{id: string|number, name: string}[]} [props.drivers]
 * @param {{id: string|number, name: string}[]} [props.locations]
 * @param {string} [props.emptyMessage]
 * @param {(run: import('../services/runs').Run) => void} [props.onRunSelect]
 * @param {(run: import('../services/runs').Run) => void} [props.onRunEdit]
 * @param {(run: import('../services/runs').Run) => void} [props.onRunDelete]
 * @param {(string|number)[]} [props.selectedRunIds]
 * @param {(runId: string|number) => void} [props.onRunSelectionChange]
 */
function RunsTable({
  runs = [],
  cars = [],
  drivers = [],
  locations = [],
  emptyMessage = 'No runs found.',
  onRunSelect,
  onRunEdit,
  onRunDelete,
  selectedRunIds = [],
  onRunSelectionChange,
}) {
  const [sortConfig, setSortConfig] = useState({
    key: 'started_at',
    direction: 'desc',
  })

  const [search, setSearch] = useState('')
  const [carFilter, setCarFilter] = useState('')
  const [driverFilter, setDriverFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [openMenu, setOpenMenu] = useState(null)

  useEffect(() => {
    if (!openMenu) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpenMenu(null)
    }

    const handlePointerDown = () => setOpenMenu(null)

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [openMenu])

  // Look up real names from the reference data provided by the API.
  const carName = (id) =>
    cars.find((car) => String(car.id) === String(id))?.name ??
    (id == null ? '-' : `Car ${id}`)

  const driverName = (id) =>
    drivers.find((driver) => String(driver.id) === String(id))?.name ??
    (id == null ? '-' : `Driver ${id}`)

  const locationName = (id) =>
    locations.find((location) => String(location.id) === String(id))?.name ??
    (id == null ? '-' : `Location ${id}`)

  // Filter runs by search text and selected reference IDs.
  const filteredRuns = useMemo(() => {
    return runs.filter((run) => {
      const searchText = search.trim().toLowerCase()

      const matchesSearch =
        !searchText ||
        String(run.name ?? run.run_name ?? '').toLowerCase().includes(searchText) ||
        String(run.run_id ?? '').toLowerCase().includes(searchText) ||
        String(run.car_id ?? '').toLowerCase().includes(searchText) ||
        String(run.driver_id ?? '').toLowerCase().includes(searchText) ||
        String(run.location_id ?? '').toLowerCase().includes(searchText) ||
        carName(run.car_id).toLowerCase().includes(searchText) ||
        driverName(run.driver_id).toLowerCase().includes(searchText) ||
        locationName(run.location_id).toLowerCase().includes(searchText) ||
        String(run.notes ?? '').toLowerCase().includes(searchText)

      const matchesCar =
        !carFilter || String(run.car_id ?? '') === carFilter

      const matchesDriver =
        !driverFilter || String(run.driver_id ?? '') === driverFilter

      const matchesLocation =
        !locationFilter || String(run.location_id ?? '') === locationFilter

      return (
        matchesSearch &&
        matchesCar &&
        matchesDriver &&
        matchesLocation
      )
    })
  }, [
    runs,
    cars,
    drivers,
    locations,
    search,
    carFilter,
    driverFilter,
    locationFilter,
  ])

  // Sort the filtered runs.
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

    return sortConfig.direction === 'asc'
      ? ' (ascending)'
      : ' (descending)'
  }

  const formatDate = (date) => {
    if (!date) return '-'

    const parsed = new Date(date)

    return Number.isNaN(parsed.getTime())
      ? '-'
      : parsed.toLocaleString()
  }

  const renderSortHeader = (label, key) => (
    <th
      key={key}
      scope="col"
      aria-sort={
        sortConfig.key === key
          ? sortConfig.direction === 'asc'
            ? 'ascending'
            : 'descending'
          : 'none'
      }
    >
      <button type="button" onClick={() => handleSort(key)}>
        {label}
        {getSortArrow(key)}
      </button>
    </th>
  )

  return (
    <div className="runs-table-container">
      {/* Filters */}
      <div className="runs-filters">
        <label className="visually-hidden" htmlFor="runs-search">
          Search runs
        </label>

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

          {cars.map((car) => (
            <option key={car.id} value={String(car.id)}>
              {car.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by driver"
          value={driverFilter}
          onChange={(e) => setDriverFilter(e.target.value)}
        >
          <option value="">All Drivers</option>

          {drivers.map((driver) => (
            <option key={driver.id} value={String(driver.id)}>
              {driver.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by location"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
        >
          <option value="">All Locations</option>

          {locations.map((location) => (
            <option key={location.id} value={String(location.id)}>
              {location.name}
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
              <th scope="col">
                <span className="visually-hidden">Select run</span>
              </th>
              {renderSortHeader('Run name', 'name')}
              {renderSortHeader('Run ID', 'run_id')}
              {renderSortHeader('Started', 'started_at')}
              {renderSortHeader('Ended', 'ended_at')}
              {renderSortHeader('Car', 'car_id')}
              {renderSortHeader('Driver', 'driver_id')}
              {renderSortHeader('Location', 'location_id')}
              <th scope="col">Notes</th>
              {renderSortHeader('Created', 'date_created')}
            </tr>
          </thead>

          <tbody>
            {sortedRuns.length === 0 ? (
              <tr>
                <td colSpan={10} className="no-runs">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedRuns.map((run) => {
                const isSelected = selectedRunIds.some(
                  (id) => String(id) === String(run.run_id)
                )

                return (
                  <tr
                    key={run.run_id}
                    className={`run-row${isSelected ? ' is-comparison-selected' : ''}`}
                    tabIndex={0}
                    aria-label={`Analyze run ${run.run_id}`}
                    onClick={() => onRunSelect?.(run)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onRunSelect?.(run)
                      }
                    }}
                    onContextMenu={(event) => {
                      event.preventDefault()
                      event.stopPropagation()

                      setOpenMenu({
                        run,
                        left: Math.min(
                          event.clientX,
                          window.innerWidth - 170
                        ),
                        top: Math.min(
                          event.clientY,
                          window.innerHeight - 100
                        ),
                      })
                    }}
                  >
                    <td className="run-compare-select-cell">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={
                          selectedRunIds.length >= 2 && !isSelected
                        }
                        aria-label={`Select ${run.name || run.run_name || `run ${run.run_id}`} for comparison or actions`}
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                        onChange={() => onRunSelectionChange?.(run.run_id)}
                      />
                    </td>

                    <td>{run.name || run.run_name || `Run #${run.run_id}`}</td>
                    <td>{run.run_id ?? '-'}</td>
                    <td>{formatDate(run.started_at)}</td>
                    <td>{formatDate(run.ended_at)}</td>
                    <td>{run.carName || carName(run.car_id)}</td>
                    <td>{run.driverName || driverName(run.driver_id)}</td>
                    <td>{run.locationName || locationName(run.location_id)}</td>
                    <td>{run.notes || '-'}</td>
                    <td>{formatDate(run.date_created)}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {openMenu && (
        <div
          className="run-row-context-menu"
          role="menu"
          style={{ left: openMenu.left, top: openMenu.top }}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onRunEdit?.(openMenu.run)
              setOpenMenu(null)
            }}
          >
            Edit run
          </button>

          <button
            type="button"
            role="menuitem"
            className="delete-run-action"
            onClick={() => {
              onRunDelete?.(openMenu.run)
              setOpenMenu(null)
            }}
          >
            Delete run
          </button>
        </div>
      )}
    </div>
  )
}

export default RunsTable
