import { useState } from 'react'
import RunsTable from '../components/RunsTable'
import ImportPopup from '../components/ImportPopup'

function RunsPage({ runs = [], onRunImport = () => {}, onRunUpdate = () => {}, onRunDelete = () => {}, onRunSelect }) {
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [editingRun, setEditingRun] = useState(null)

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
        runs={runs}
        onRunSelect={onRunSelect}
        onRunEdit={setEditingRun}
        onRunDelete={onRunDelete}
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
