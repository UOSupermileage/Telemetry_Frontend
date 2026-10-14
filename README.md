# Backend connection

The Runs and Analysis pages load runs with the backend's offset/limit pagination.
Analysis requests individual run records with `GET {VITE_API_BASE_URL}/runs/{run_id}`.
See the `Run` JSDoc type in `src/services/runs.js` for fields used by the UI.

Editing a run sends `PATCH {VITE_API_BASE_URL}/runs/{run_id}` with the editable
run fields. The editor loads cars, drivers, and locations from their API list
endpoints because the run list returns related names while updates require IDs.

Adding a run without a CSV sends its metadata as JSON to
`POST {VITE_API_BASE_URL}/runs`. Attaching a CSV sends the metadata and file as
`multipart/form-data` to `POST {VITE_API_BASE_URL}/telemetry/import`. The browser
creates the multipart boundary; the frontend must not set that request's
`Content-Type` header itself.

Deleting a run sends `DELETE {VITE_API_BASE_URL}/runs/{run_id}` after the user
confirms the action.

Analysis loads telemetry from `GET {VITE_API_BASE_URL}/telemetry/data` and
summary metrics from `GET {VITE_API_BASE_URL}/analytics/runs/{run_id}`. Its Export
CSV button downloads the file from `GET {VITE_API_BASE_URL}/telemetry/export`.

Copy `.env.example` to `.env.local` and set `VITE_API_BASE_URL` to the backend
API base URL. Restart the Vite dev server after changing the environment file.
The backend must allow browser requests from the frontend origin (CORS).
