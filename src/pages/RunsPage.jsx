import { useState } from 'react'
import RunsTable from '../components/RunsTable'
import ImportPopup from '../components/ImportPopup'

function RunsPage({ runs = [], onRunImport = () => {} }) {
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
        runs={runs}
      />

      {isImportOpen && <ImportPopup onClose={() => setIsImportOpen(false)} onImport={(run) => {
        onRunImport(run)
        setIsImportOpen(false)
      }} />}
    </>
  )
}

export default RunsPage
