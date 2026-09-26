import { useState } from 'react'
import RunsTable from '../components/RunsTable'
import ImportPopup from '../components/ImportPopup'

const testRuns = [
  {
    run_id: 1,
    car_id: 2,
    location_id: 1,
    driver_id: 3,
    started_at: '2026-09-20T14:00:00',
    ended_at: '2026-09-20T14:15:00',
    notes: 'First test run',
    date_created: '2026-09-20T15:00:00',
  },
  {
    run_id: 2,
    car_id: 1,
    location_id: 2,
    driver_id: 4,
    started_at: '2026-09-21T10:30:00',
    ended_at: '2026-09-21T10:48:00',
    notes: 'Testing new setup',
    date_created: '2026-09-21T11:00:00',
  },
  {
    run_id: 3,
    car_id: 2,
    location_id: 1,
    driver_id: 3,
    started_at: '2026-09-22T13:00:00',
    ended_at: '2026-09-22T13:22:00',
    notes: '',
    date_created: '2026-09-22T14:00:00',
  },
]

function RunsPage() {
  const [isImportOpen, setIsImportOpen] = useState(false)

  return (
    <>
      <div className="runs-heading-actions">
        <button
          type="button"
          className="add-run-button"
          onClick={() => setIsImportOpen(true)}
        >
          <span aria-hidden="true">+</span>
          Add run
        </button>
      </div>

      <RunsTable
        runs={testRuns}
        onRunClick={(run) => console.log('Selected run:', run)}
      />

      {isImportOpen && <ImportPopup onClose={() => setIsImportOpen(false)} />}
    </>
  )
}

export default RunsPage
