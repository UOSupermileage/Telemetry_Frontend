import { useEffect, useRef, useState } from 'react'
import { mockCars, mockDrivers, mockLocations } from '../data/mockData'
import './ImportPopup.css'

export default function ImportPopup({ onClose, onImport }) {
    const [form, setForm] = useState({
        name: "", car_id: "", driver_id: "", location_id: "", started_at: "", ended_at: "", notes: "",
    });

    const [file, setFile] = useState(null);

    const dialogRef = useRef(null)
    const fileInputRef = useRef(null)
    const openerRef = useRef(document.activeElement)
    const [error, setError] = useState('')

    useEffect(() => {
        const dialog = dialogRef.current
        dialog?.querySelector('select, input, textarea, button')?.focus()
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') onClose()
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
            openerRef.current?.focus?.()
        }
    }, [onClose])

    function handleChange(e) {
        const {name, value} = e.target;

        setForm((prev) => ({
            ...prev, [name]: value,
        }));
    }

    function handleSubmit(e) {
        e.preventDefault();

        if (!form.name.trim()) {
            setError('Enter a name for this run.')
            return
        }

        if (form.ended_at && new Date(form.ended_at) < new Date(form.started_at)) {
            setError('End time must be after the start time.')
            return
        }
        setError('')
        const run = { ...form, name: form.name.trim(), car_id: Number(form.car_id), driver_id: Number(form.driver_id), location_id: Number(form.location_id) }
        if (onImport) onImport(run)
        else onClose()
    }

    return (<div className="import-overlay" onClick={onClose}>
            <div
                ref={dialogRef}
                className="import-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="import-title"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="modal-header">
                    <div>
                        <h2 id="import-title">Import telemetry</h2>
                        <p>
                            Demo mode: this adds a run in memory for this app session. The CSV is not stored or parsed.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="close-btn"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        x
                    </button>
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

                                    {mockCars.map((car) => (<option key={car.id} value={car.id}>
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

                                    {mockDrivers.map((driver) => (<option
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

                                    {mockLocations.map((location) => (<option
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
                    <section className="file-section">
                        <h3>Telemetry CSV</h3>

                        <label
                            className="file-drop"
                            htmlFor="telemetry-file"
                        >
                            <span className="upload-icon">Upload</span>

                            <strong>
                                {file ? file.name : "Choose a CSV file"}
                            </strong>

                            <span>
                {file ? `${(file.size / 1024).toFixed(1)} KB` : "Click to browse your files"}
              </span>

                            <input
                                ref={fileInputRef}
                                id="telemetry-file"
                                type="file"
                                accept=".csv,text/csv"
                                required
                                onChange={(e) => {
                                    setFile(e.target.files?.[0] ?? null);
                                }}
                            />
                        </label>

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

                    {/* Footer */}
                    {error && <p className="form-error" role="alert">{error}</p>}
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={onClose}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="submit-btn"
                        >
                            Import telemetry
                        </button>
                    </div>
                </form>
            </div>
        </div>);
}
