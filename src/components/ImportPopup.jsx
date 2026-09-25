import {useState} from "react";
import "./ImportPopup.css";

export default function ImportPopup({onClose}) {
    const [form, setForm] = useState({
        car_id: "", driver_id: "", location_id: "", started_at: "", ended_at: "", notes: "",
    });

    const [file, setFile] = useState(null);

    // Temporary mock data for the dropdowns
    const cars = [{id: 1, name: "Car 1"}, {id: 2, name: "Car 2"}, {id: 3, name: "Car 3"},];

    const drivers = [{id: 1, name: "John Smith"}, {id: 2, name: "Jane Doe"}, {id: 3, name: "Alex Johnson"},];

    const locations = [{id: 1, name: "Test Track"}, {id: 2, name: "Ottawa Circuit"}, {id: 3, name: "Main Campus"},];

    function handleChange(e) {
        const {name, value} = e.target;

        setForm((prev) => ({
            ...prev, [name]: value,
        }));
    }

    function handleSubmit(e) {
        e.preventDefault();

        // Visual-only for now.
        console.log("Form:", form);
        console.log("File:", file);

        onClose();
    }

    return (<div className="import-overlay" onClick={onClose}>
            <div
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
                            Upload a telemetry CSV and provide the run details.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="close-btn"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Run details */}
                    <section>
                        <h3>Run details</h3>

                        <div className="form-grid">
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

                                    {cars.map((car) => (<option key={car.id} value={car.id}>
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

                                    {drivers.map((driver) => (<option
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

                                    {locations.map((location) => (<option
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
                            <span className="upload-icon">↑</span>

                            <strong>
                                {file ? file.name : "Choose a CSV file"}
                            </strong>

                            <span>
                {file ? `${(file.size / 1024).toFixed(1)} KB` : "Click to browse your files"}
              </span>

                            <input
                                id="telemetry-file"
                                type="file"
                                accept=".csv,text/csv"
                                onChange={(e) => {
                                    setFile(e.target.files?.[0] ?? null);
                                }}
                            />
                        </label>

                        {file && (<button
                                type="button"
                                className="remove-file"
                                onClick={() => setFile(null)}
                            >
                                Remove file
                            </button>)}
                    </section>

                    {/* Footer */}
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
