# Backend connection

The Runs page loads recent records with `GET {VITE_API_BASE_URL}/runs?limit=6`.
The response can be a JSON array of runs or an object shaped like
`{ "runs": [...] }`. See the `Run` JSDoc type in `src/services/runs.js` for
the fields currently consumed by the UI.

Editing a run sends `PATCH {VITE_API_BASE_URL}/runs/{run_id}` with the editable
run fields. The editor loads cars, drivers, and locations from their API list
endpoints because the run list returns related names while updates require IDs.

Adding a run sends its metadata and CSV file as `multipart/form-data` to
`POST {VITE_API_BASE_URL}/telemetry/import`. The browser creates the multipart
boundary; the frontend must not set that request's `Content-Type` header itself.

Copy `.env.example` to `.env.local` and set `VITE_API_BASE_URL` to the backend
API base URL. Restart the Vite dev server after changing the environment file.
The backend must allow browser requests from the frontend origin (CORS).

Deleting runs is not connected to the backend yet.
