import { useCallback, useEffect, useState } from 'react'
import RunsTable from '../components/RunsTable'
import ImportPopup from '../components/ImportPopup'
import { 
  getRecentRuns,
  createRun,
  updateRun,
  deleteRun as deleteRunApi,
} from '../services/runs'

function RunsPage({
  runs = [],
  onRunImport = () => {},
  onRunUpdate = () => {},
  onRunDelete = () => {},
  onRunSelect,
  onRunCompare = () => {},
}) {
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [editingRun, setEditingRun] = useState(null)
  const [selectedRunIds, setSelectedRunIds] = useState([])
  const [apiRuns, setApiRuns] = useState([])
  const [loadError, setLoadError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Load runs once when this page mounts. getRecentRuns() makes the HTTP request;
  // this component stores the response so React can render it in the table.
  const loadRuns = useCallback(async () => {
  setIsLoading(true)
  setLoadError('')

  try {
    const result = await getRecentRuns()
    setApiRuns(Array.isArray(result) ? result : [])
  } catch (error) {
    setLoadError(error.message)
  } finally {
    setIsLoading(false)
  }
}, [])

useEffect(() => {
  loadRuns()
}, [loadRuns])

  // This is the array passed to RunsTable below. It contains only API results.
  const displayRuns = apiRuns

  const availableRunIds = selectedRunIds.filter((id) =>
    displayRuns.some((run) => String(run.run_id) === String(id))
  )
  const selectedRun = displayRuns.find(
    (run) => String(run.run_id) === String(availableRunIds[0])
  )

  // Confirm the user's intent, then notify the parent. This callback currently
  // updates frontend state; it does not send a DELETE request to the backend.
  const deleteRun = async (run) => {
  if (!run) return

  const runLabel = run.name || `Run #${run.run_id}`

  if (!window.confirm(`Delete ${runLabel}? This action cannot be undone.`)) {
    return
  }

  try {
    await deleteRunApi(run.run_id)
    setSelectedRunIds([])
    await loadRuns()
  } catch (error) {
    setLoadError(`Could not delete run: ${error.message}`)
  }
}
  const deleteSelectedRun = () => deleteRun(selectedRun)

  // Selection is local UI state and is used for editing, deleting, or comparing.
  const toggleRunSelection = (runId) => {
    setSelectedRunIds((current) => {
      const validCurrent = current.filter((id) =>
        displayRuns.some((run) => String(run.run_id) === String(id))
      )
      const selected = validCurrent.some((id) => String(id) === String(runId))
      if (selected) return validCurrent.filter((id) => String(id) !== String(runId))
      return validCurrent.length < 2 ? [...validCurrent, runId] : validCurrent
    })
  }

  return (
    <>
      {isLoading && <p role="status">Loading runs from the database…</p>}
      {loadError && <p role="alert">Could not connect to the runs service. Check that the backend and database are running. ({loadError})</p>}

      <div className="runs-heading-actions">
        <div className="run-comparison-actions" aria-live="polite">
          <span>{availableRunIds.length} of 2 selected</span>
          <button
            type="button"
            className="clear-run-selection"
            onClick={() => setSelectedRunIds([])}
            disabled={availableRunIds.length === 0}
          >
            Clear
          </button>
          {availableRunIds.length === 1 && (
            <>
              <button
                type="button"
                className="edit-selected-run"
                onClick={() => setEditingRun(selectedRun)}
              >
                Edit run
              </button>
              <button
                type="button"
                className="delete-selected-run"
                onClick={deleteSelectedRun}
              >
                Delete run
              </button>
            </>
          )}
          <button
            type="button"
            className="compare-runs-button"
            onClick={() => onRunCompare(availableRunIds)}
            disabled={availableRunIds.length !== 2}
          >
            Compare runs
          </button>
        </div>

        <button
          type="button"
          className="add-run-button"
          onClick={() => setIsImportOpen(true)}
        >
          <span aria-hidden="true">+</span>
          Add run
        </button>
      </div>

      {/* `runs` hands the backend response to the table, which renders its rows. */}
      <RunsTable
        runs={displayRuns}
        emptyMessage={isLoading ? 'Loading runs…' : loadError ? 'Runs are unavailable because the database could not be reached.' : 'No runs found in the database.'}
        onRunSelect={onRunSelect}
        onRunEdit={setEditingRun}
        onRunDelete={deleteRun}
        selectedRunIds={availableRunIds}
        onRunSelectionChange={toggleRunSelection}
      />

      {editingRun && (
        <ImportPopup
          mode="edit"
          initialRun={editingRun}
          onClose={() => setEditingRun(null)}
          onImport={async (updatedRun) => {
            try {
              await updateRun(updatedRun.run_id, updatedRun)
              setEditingRun(null)
              await loadRuns()
            } catch (error) {
              setLoadError(`Could not update run: ${error.message}`)
            }
          }}
        />
      )}

      {isImportOpen && (
        <ImportPopup
          onClose={() => setIsImportOpen(false)}
          onImport={async (run) => {
            try {
              await createRun(run)
              setIsImportOpen(false)
              await loadRuns()
            } catch (error) {
              setLoadError(`Could not create run: ${error.message}`)
            }
        }}
        />
      )}
    </>
  )
}

export default RunsPage
