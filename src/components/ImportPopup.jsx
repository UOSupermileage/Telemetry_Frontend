import {useCallback, useEffect, useRef, useState} from 'react'
import {mockCars, mockDrivers, mockLocations} from '../data/mockData'
import './ImportPopup.css'

function previewCsv(text) {
    const rows = []
    let row = []
    let cell = ''
    let quoted = false
    let hasContent = false
    let rowCount = 0
    let previewRows = []

    const finishRow = () => {
        row.push(cell)
        if (row.some((value) => value.trim())) {
            if (rows.length === 0) rows.push(row)
            else if (previewRows.length < 5) previewRows.push(row)
            rowCount += 1
        }
        row = []
        cell = ''
        hasContent = false
    }

    for (let i = 0; i < text.length; i += 1) {
        const char = text[i]
        if (quoted) {
            if (char === '"' && text[i + 1] === '"') {
                cell += '"'
                i += 1
            } else if (char === '"') quoted = false
            else cell += char
        } else if (char === '"' && cell.length === 0) quoted = true
        else if (char === ',') {
            row.push(cell)
            cell = ''
            hasContent = true
        } else if (char === '\n' || char === '\r') {
            if (char === '\r' && text[i + 1] === '\n') i += 1
            finishRow()
        } else {
            cell += char
            hasContent = true
        }
    }
    if (quoted) throw new Error('The CSV has an unfinished quoted field.')
    if (hasContent || cell || row.length) finishRow()

    const headers = rows[0] ?? []
    return {headers, rows: previewRows, rowCount: Math.max(0, rowCount - (headers.length ? 1 : 0))}
}

export default function ImportPopup({onClose, onImport, initialRun, mode = 'import', page = false, editorOptions}) {
    const asLocalDateTime = (value) => {
        if (!value) return ''
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return value
        const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        return local.toISOString().slice(0, 16)
    }
    const [form, setForm] = useState(() => initialRun ? {
        ...initialRun,
        name: initialRun.name ?? initialRun.run_name ?? '',
        car_id: initialRun.car_id ?? '',
        driver_id: initialRun.driver_id ?? '',
        location_id: initialRun.location_id ?? '',
        started_at: asLocalDateTime(initialRun.started_at),
        ended_at: asLocalDateTime(initialRun.ended_at),
        notes: initialRun.notes ?? '',
    } : {name: "", car_id: "", driver_id: "", location_id: "", started_at: "", ended_at: "", notes: ""});
    const initialFormRef = useRef(JSON.stringify(form))

    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false)
    const [preview, setPreview] = useState(null)

    const dialogRef = useRef(null)
    const fileInputRef = useRef(null)
    const requestCloseRef = useRef(null)
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const requestClose = useCallback(() => {
        const hasUnsavedChanges = JSON.stringify(form) !== initialFormRef.current || Boolean(file)
        if (hasUnsavedChanges && !window.confirm('Discard your unsaved run details and selected CSV?')) return
        onClose()
    }, [form, file, onClose])
    const currentPreview = preview?.file === file ? preview : null
    const blankHeaderColumns = currentPreview?.data?.headers
        .map((header, index) => header.trim() ? null : index + 1)
        .filter((index) => index !== null) ?? []

    useEffect(() => {
        requestCloseRef.current = requestClose
    }, [requestClose])

    useEffect(() => {
        let cancelled = false
        if (!file) return () => {
            cancelled = true
        }
        file.text().then((text) => {
            if (!cancelled) setPreview({file, data: previewCsv(text)})
        }).catch((readError) => {
            if (!cancelled) setPreview({
                file,
                error: readError instanceof Error ? readError.message : 'This file could not be read in your browser.'
            })
        })
        return () => {
            cancelled = true
        }
    }, [file])

    useEffect(() => {
        const dialog = dialogRef.current
        const opener = document.activeElement
        dialog?.querySelector('select, input, textarea, button')?.focus()
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') requestCloseRef.current?.()
            if (event.key !== 'Tab' || !dialog) return
            const controls = [...dialog.querySelectorAll('button, input, select, textarea')]
                .filter((control) => !control.disabled)
            const first = controls[0]
            const last = controls[controls.length - 1]
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault()
                last?.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()
                first?.focus()
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            opener?.focus?.()
        }
    }, [])

    function acceptDroppedFile(event) {
        event.preventDefault()
        setIsDragging(false)
        const droppedFile = event.dataTransfer.files?.[0]
        if (!droppedFile) return
        setFile(droppedFile)
        if (fileInputRef.current) {
            const transfer = new DataTransfer()
            transfer.items.add(droppedFile)
            fileInputRef.current.files = transfer.files
        }
    }

    function handleChange(e) {
        const {name, value} = e.target;

        setForm((prev) => ({
            ...prev, [name]: value,
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!form.name.trim()) {
            setError('Enter a name for this run.')
            return
        }
        if (mode !== 'edit' && !file) {
            setError('Choose a telemetry CSV file to upload.')
            return
        }

        if (form.ended_at && new Date(form.ended_at) < new Date(form.started_at)) {
            setError('End time must be after the start time.')
            return
        }
        setError('')
        const run = {
            ...form,
            name: form.name.trim(),
            car_id: Number(form.car_id),
            driver_id: Number(form.driver_id),
            location_id: Number(form.location_id),
            started_at: new Date(form.started_at).toISOString(),
            ended_at: form.ended_at ? new Date(form.ended_at).toISOString() : null,
        }
        if (mode === 'edit') run.run_name = run.name
        if (!onImport) {
            onClose()
            return
        }

        setIsSubmitting(true)
        try {
            await onImport(run, file)
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Could not save this run.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (<div className={page ? 'edit-run-page' : 'import-overlay'} onClick={page ? undefined : requestClose}>
        <div
            ref={dialogRef}
            className={page ? 'import-modal edit-run-card' : 'import-modal'}
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-title"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="modal-header">
                <div>
                    <h2 id="import-title">{mode === 'edit' ? 'Edit run' : 'Add run'}</h2>
                    <p>
                        {mode === 'edit' ? 'Update the details for this run.' : 'Create a run record, and optionally attach a telemetry CSV.'}
                    </p>
                </div>

                {!page && <button
                    type="button"
                    className="close-btn"
                    onClick={requestClose}
                    aria-label="Close"
                >
                    x
                </button>}
            </div>

            <form onSubmit={handleSubmit}>
                {/* Run details */}
                <section>
                    <h3>Run details</h3>

                    <div className="form-grid">
                        <div className="field full-width">
                            <label htmlFor="run-name">Run name *</label>
                            <input
                                id="run-name"
                                name="name"
                                type="text"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="e.g. Spring setup test"
                                required
                            />
                        </div>

                        {/* Car */}
                        <div className="field">
                            <label htmlFor="car_id">Car *</label>

                            <select
                                id="car_id"
                                name="car_id"
                                value={form.car_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select a car</option>

                                {(editorOptions?.cars ?? mockCars).map((car) => (<option key={car.id} value={car.id}>
                                    {car.name}
                                </option>))}
                            </select>
                        </div>

                        {/* Driver */}
                        <div className="field">
                            <label htmlFor="driver_id">Driver *</label>

                            <select
                                id="driver_id"
                                name="driver_id"
                                value={form.driver_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select a driver</option>

                                {(editorOptions?.drivers ?? mockDrivers).map((driver) => (<option
                                    key={driver.id}
                                    value={driver.id}
                                >
                                    {driver.name}
                                </option>))}
                            </select>
                        </div>

                        {/* Location */}
                        <div className="field full-width">
                            <label htmlFor="location_id">Location *</label>

                            <select
                                id="location_id"
                                name="location_id"
                                value={form.location_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select a location</option>

                                {(editorOptions?.locations ?? mockLocations).map((location) => (<option
                                    key={location.id}
                                    value={location.id}
                                >
                                    {location.name}
                                </option>))}
                            </select>
                        </div>

                        {/* Start */}
                        <div className="field">
                            <label htmlFor="started_at">
                                Started at *
                            </label>

                            <input
                                id="started_at"
                                name="started_at"
                                type="datetime-local"
                                value={form.started_at}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* End */}
                        <div className="field">
                            <label htmlFor="ended_at">
                                Ended at
                            </label>

                            <input
                                id="ended_at"
                                name="ended_at"
                                type="datetime-local"
                                value={form.ended_at}
                                onChange={handleChange}
                            />

                            <span className="field-hint">
                  Optional
                </span>
                        </div>

                        {/* Notes */}
                        <div className="field full-width">
                            <label htmlFor="notes">Notes</label>

                            <textarea
                                id="notes"
                                name="notes"
                                rows="3"
                                value={form.notes}
                                onChange={handleChange}
                                placeholder="Optional notes about this run..."
                            />
                        </div>
                    </div>
                </section>

                {/* File */}
                {mode !== 'edit' && <>
                    <section className="file-section">
                        <h3>Telemetry CSV (optional)</h3>

                        <label
                            className={`file-drop${isDragging ? ' is-dragging' : ''}`}
                            htmlFor="telemetry-file"
                            onDragEnter={(event) => {
                                event.preventDefault();
                                setIsDragging(true)
                            }}
                            onDragOver={(event) => event.preventDefault()}
                            onDragLeave={(event) => {
                                if (!event.currentTarget.contains(event.relatedTarget)) setIsDragging(false)
                            }}
                            onDrop={acceptDroppedFile}
                        >
                            <span className="upload-icon">Upload</span>

                            <strong>
                                {file ? file.name : "Choose a CSV file"}
                            </strong>

                            <span>
                {file ? "Drop another CSV or click to replace" : "Drop a CSV here or click to browse"}
              </span>

                            <input
                                ref={fileInputRef}
                                id="telemetry-file"
                                type="file"
                                accept=".csv,text/csv"
                                onChange={(e) => {
                                    setFile(e.target.files?.[0] ?? null);
                                }}
                            />
                        </label>

                        {file && <div className="csv-preview" aria-live="polite">
                            <div className="csv-preview-heading">
                                <strong>Local preview</strong>
                                <span>{file.name} · {(file.size / 1024).toFixed(1)} KB</span>
                            </div>
                            {file && !currentPreview && <p>Reading CSV…</p>}
                            {currentPreview?.error &&
                                <p className="csv-preview-error" role="alert">{currentPreview.error}</p>}
                            {currentPreview?.data && <>
                                <p className="csv-preview-count">{currentPreview.data.rowCount} data {currentPreview.data.rowCount === 1 ? 'row' : 'rows'} detected
                                    · showing up to 5</p>
                                {currentPreview.data.headers.length > 0 && <p className="csv-preview-columns">
                                    <strong>Columns:</strong> {currentPreview.data.headers.map((header, index) => header || `Column ${index + 1}`).join(', ')}
                                </p>}
                                {blankHeaderColumns.length > 0 &&
                                    <p className="csv-preview-error" role="status">Missing column names
                                        in {blankHeaderColumns.map((index) => `column ${index}`).join(', ')}. The CSV
                                        must have a name for every column.</p>}
                                {currentPreview.data.headers.length > 0 ? <div className="csv-preview-table-wrap">
                                        <table className="csv-preview-table">
                                            <thead>
                                            <tr>{currentPreview.data.headers.map((header, index) => <th
                                                key={index}>{header || `Column ${index + 1}`}</th>)}</tr>
                                            </thead>
                                            <tbody>{currentPreview.data.rows.length ? currentPreview.data.rows.map((row, rowIndex) =>
                                                <tr key={rowIndex}>
                                                    {currentPreview.data.headers.map((_, index) => <td
                                                        key={index}>{row[index] ?? ''}</td>)}
                                                </tr>) : <tr>
                                                <td colSpan={currentPreview.data.headers.length}>No data rows found.</td>
                                            </tr>}</tbody>
                                        </table>
                                    </div> :
                                    <p className="csv-preview-error" role="status">No header row found. The CSV must
                                        start with column names.</p>}
                            </>}
                        </div>}

                        {file && (<button
                            type="button"
                            className="remove-file"
                            onClick={() => {
                                setFile(null)
                                if (fileInputRef.current) fileInputRef.current.value = ''
                            }}
                        >
                            Remove file
                        </button>)}
                    </section>
                </>}

                {/* Footer */}
                {error && <p className="form-error" role="alert">{error}</p>}
                <div className="modal-footer">
                    <button
                        type="button"
                        className="cancel-btn"
                        onClick={requestClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Saving…' : mode === 'edit' ? 'Save changes' : file ? 'Import telemetry' : 'Create run'}
                    </button>
                </div>
            </form>
        </div>
    </div>);
}
