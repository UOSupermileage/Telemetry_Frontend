# Backend connection

The Locations tab opens location details when its name is clicked. Indianapolis
(including Indy/IMS names) displays the saved Shell 2023 track outline. Other
locations show an empty state. This is a provisional name-based association;
it does not assert that the 2023 course matches later event layouts.

Track coordinates are checked into `src/data/sem_2023_us.csv` and bundled by
Vite with the app. Once deployed, all users receive the same data from the web
host; the app never reads a user's Downloads folder. Updating this built-in
outline requires a new deployment. For user-managed tracks, a future backend
should store uploaded files in shared object storage and link each location ID
to its track file and course year in the database. Browser local storage is not
shared storage.

Resource add/edit dialogs use the backend's Create/Update field contracts in
`src/services/resourceForms.js`. Cars accept `name`, `year_created` (integer,
minimum 1886), and `team_id` selected from all pages of the teams API. Drivers
accept first/last names, locations accept name and nullable address, and teams
accept team name. IDs and joined display labels are not editable payload fields.
Edits PATCH only changed fields to the resource's ID endpoint; creation POSTs
the required fields to its collection endpoint. The car read schema provides
`teamName` instead of `team_id`, so the editor resolves unique team names and
preserves ambiguous assignments unless a team is explicitly selected.
Run resource checks with `node --test src/services/resourceForms.test.js
tests/resources.browser.test.js` (browser coverage uses mocked writes).

Telemetry API responses and CSV files use raw sensor units: tick in milliseconds
since boot, throttle in tenths of a percent (0–1000), speed in meters per hour,
current in milliamps, and voltage in millivolts. Analysis converts values for
display to %, km/h, A, and V respectively, including speed summaries and
comparison differences. Chart ticks remain milliseconds since boot. CSV uploads
and exports retain their original units. Display conversions live in
`src/services/telemetryUnits.js`; run their checks with
`node --test src/services/telemetryUnits.test.js`.

The Runs and Analysis pages load runs with the backend's offset/limit pagination.
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

Charts request `max_points=800` per visible channel and run, with repeated
`fields` parameters and no pagination. Pinch two fingers diagonally on a trace
to zoom all visible channels. Drag with one finger or the mouse to pan. Trackpad
pinch zooms around the pointer; horizontal trackpad scrolling pans. Shift-drag
with a mouse selects a zoom range. Double-tap, double-click, or Reset zoom restores a full-run
overview. Zoom/pan requests debounce for 250 ms and use inclusive `start_tick` /
`end_tick` bounds in boot milliseconds. Existing data stays visible while loading;
superseded requests are aborted and stale responses ignored. A 404 means no
readings in that range. Uniform samples can miss brief spikes; run-wide statistics
come exclusively from analytics. All channels share a viewport and cursor;
compared runs use the same raw boot-tick range. The time-window fields accept
exact start/end boot ticks in milliseconds under the collapsed Exact range control.
Primary runs are solid orange;
references are dashed blue across every channel. uPlot supplies drag selection
and cursor synchronization; custom pointer gestures use two-dimensional finger
distance to zoom the time axis. Vertical page scrolling is available outside the
plot surfaces. Focus a chart and use arrow keys to pan, +/- to zoom, or Home to reset.

Run sampling and unit checks with `node --test src/services/telemetry*.test.js`.
Run gesture math checks with `node --test src/services/chartGestures.test.js`.
Run browser coverage with `node --test tests/telemetryZoom.browser.test.js`
(requires Playwright Chromium; starts an isolated Vite server on port 5184 and
mocks API responses).

For local development, copy `.env.example` to `.env.local` and keep
`VITE_API_BASE_URL=/api`. Vite proxies these requests to `http://127.0.0.1:8000`,
so the backend must be running on port 8000. This avoids cross-origin browser
requests. Restart the Vite dev server after changing the environment file.

For deployment, set `VITE_API_BASE_URL` to the deployed backend API base URL
before building, or configure your web server to proxy `/api` to the backend.
The Vite development proxy is not part of the production build. If the API uses
a different origin, the backend must allow the frontend origin through CORS.
