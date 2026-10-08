import { useEffect, useState } from 'react'
import RunsTable from '../components/RunsTable'
import ImportPopup from '../components/ImportPopup'
import { getRecentRuns } from '../services/runs'

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
  const [apiRuns, setApiRuns] = useState(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let cancelled = false

    getRecentRuns()
      .then((result) => {
        if (!cancelled) setApiRuns(result)
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error.message)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Use backend runs when loaded; otherwise use the runs supplied by the parent.
  const displayRuns = apiRuns ?? runs

  const availableRunIds = selectedRunIds.filter((id) =>
    displayRuns.some((run) => String(run.run_id) === String(id))
  )
  const selectedRun = displayRuns.find(
    (run) => String(run.run_id) === String(availableRunIds[0])
  )

  const deleteRun = (run) => {
    if (!run) return
    const runLabel = run.name || run.run_name || `Run #${run.run_id}`
    if (!window.confirm(`Delete ${runLabel}? This action cannot be undone.`)) return
    onRunDelete(run)
    setSelectedRunIds([])
  }

  const deleteSelectedRun = () => deleteRun(selectedRun)

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
      {loadError && <p role="alert">Could not load runs: {loadError}</p>}

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

      <RunsTable
        runs={displayRuns}
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
          onImport={(updatedRun) => {
            onRunUpdate(updatedRun)
            setEditingRun(null)
          }}
        />
      )}

      {isImportOpen && (
        <ImportPopup
          onClose={() => setIsImportOpen(false)}
          onImport={(run) => {
            onRunImport(run)
            setIsImportOpen(false)
          }}
        />
      )}
    </>
  )
}

export default RunsPage