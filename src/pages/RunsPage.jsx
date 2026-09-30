import { useState } from 'react'
import RunsTable from '../components/RunsTable'
import ImportPopup from '../components/ImportPopup'

function RunsPage({ runs = [], onRunImport = () => {}, onRunUpdate = () => {}, onRunDelete = () => {}, onRunSelect, onRunCompare = () => {} }) {
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [editingRun, setEditingRun] = useState(null)
  const [selectedRunIds, setSelectedRunIds] = useState([])
  const availableRunIds = selectedRunIds.filter((id) => runs.some((run) => String(run.run_id) === String(id)))
  const selectedRun = runs.find((run) => String(run.run_id) === String(availableRunIds[0]))

  const deleteSelectedRun = () => {
    if (!selectedRun) return
    const runLabel = selectedRun.name || selectedRun.run_name || `Run #${selectedRun.run_id}`
    if (!window.confirm(`Delete ${runLabel}? This action cannot be undone.`)) return
    onRunDelete(selectedRun)
    setSelectedRunIds([])
  }

  const toggleRunSelection = (runId) => {
    setSelectedRunIds((current) => {
      const validCurrent = current.filter((id) => runs.some((run) => String(run.run_id) === String(id)))
      const selected = validCurrent.some((id) => String(id) === String(runId))
      if (selected) return validCurrent.filter((id) => String(id) !== String(runId))
      return validCurrent.length < 2 ? [...validCurrent, runId] : validCurrent
    })
  }

  return (
    <>
      <div className="runs-heading-actions">
        <div className="run-comparison-actions" aria-live="polite">
          <span>{availableRunIds.length} of 2 selected</span>
          <button type="button" className="clear-run-selection" onClick={() => setSelectedRunIds([])} disabled={availableRunIds.length === 0}>Clear</button>
          {availableRunIds.length === 1 && <>
            <button type="button" className="edit-selected-run" onClick={() => setEditingRun(selectedRun)}>Edit run</button>
            <button type="button" className="delete-selected-run" onClick={deleteSelectedRun}>Delete run</button>
          </>}
          <button type="button" className="compare-runs-button" onClick={() => onRunCompare(availableRunIds)} disabled={availableRunIds.length !== 2}>Compare runs</button>
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
        runs={runs}
        onRunSelect={onRunSelect}
        selectedRunIds={availableRunIds}
        onRunSelectionChange={toggleRunSelection}
      />

      {editingRun && <ImportPopup
        mode="edit"
        initialRun={editingRun}
        onClose={() => setEditingRun(null)}
        onImport={(updatedRun) => { onRunUpdate(updatedRun); setEditingRun(null) }}
      />}

      {isImportOpen && <ImportPopup onClose={() => setIsImportOpen(false)} onImport={(run) => {
        onRunImport(run)
        setIsImportOpen(false)
      }} />}
    </>
  )
}

export default RunsPage
