import { useState } from 'react'
import { mockCars, mockDrivers, mockLocations } from '../data/mockData'
import './RunSelector.css'

function RunSelector({ runs = [], selectedRunId, onRunChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const selectedRun = runs.find((run) => String(run.run_id) === String(selectedRunId))
  const runName = (run) => run.name || run.run_name || `Run #${run.run_id}`
  const query = search.trim().toLowerCase()
  const filteredRuns = runs.filter((run) => {
    if (!query) return true
    const details = [
      runName(run),
      run.run_id,
      mockCars.find(({ id }) => id === Number(run.car_id))?.name,
      mockDrivers.find(({ id }) => id === Number(run.driver_id))?.name,
      mockLocations.find(({ id }) => id === Number(run.location_id))?.name,
      run.notes,
    ].filter(Boolean).join(' ').toLowerCase()
    return details.includes(query)
  })
  const carName = mockCars.find(({ id }) => id === Number(selectedRun?.car_id))?.name
  const driverName = mockDrivers.find(({ id }) => id === Number(selectedRun?.driver_id))?.name
  const locationName = mockLocations.find(({ id }) => id === Number(selectedRun?.location_id))?.name

  return (
    <section className={`run-selector ${isOpen ? 'is-open' : ''}`} aria-label="Selected run">
      <button
        type="button"
        className="selected-run-card"
        aria-expanded={isOpen}
        aria-controls="analysis-run-options"
        onClick={() => setIsOpen((open) => !open)}
        disabled={runs.length === 0}
      >
        <span className="selected-run-heading">
          <span className="selected-run-label">Currently analyzing</span>
          <span className="selected-run-name">{selectedRun ? runName(selectedRun) : 'No run selected'}</span>
        </span>
        <span className="selected-run-controls">
          {selectedRun && <span className="selected-run-details">
            {[carName, driverName, locationName].filter(Boolean).join(' · ')}
          </span>}
          <span className="selected-run-chevron" aria-hidden="true">{isOpen ? '⌃' : '⌄'}</span>
        </span>
      </button>
      {isOpen && <div className="run-options" id="analysis-run-options" aria-label="Choose a run">
        <label className="run-search-label" htmlFor="analysis-run-search">Search runs</label>
        <input
          id="analysis-run-search"
          className="run-search"
          type="search"
          placeholder="Search by name, car, driver, or location"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {filteredRuns.length === 0 ? <p className="run-options-empty">No matching runs.</p> : filteredRuns.map((run) => (
          <button
            key={run.run_id}
            type="button"
            className={`run-option ${String(run.run_id) === String(selectedRunId) ? 'is-selected' : ''}`}
            aria-pressed={String(run.run_id) === String(selectedRunId)}
            onClick={() => {
              onRunChange?.(run.run_id)
              setSearch('')
              setIsOpen(false)
            }}
          >
            <span className="run-option-name">{runName(run)}</span>
            <span className="run-option-details">
              {[mockCars.find(({ id }) => id === Number(run.car_id))?.name,
                mockDrivers.find(({ id }) => id === Number(run.driver_id))?.name,
                mockLocations.find(({ id }) => id === Number(run.location_id))?.name]
                .filter(Boolean).join(' · ')}
            </span>
          </button>
        ))}
      </div>}
    </section>
  )
}

export default RunSelector
