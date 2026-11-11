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

## Production Docker deployment

This React/Vite SPA uses npm and `package-lock.json`. The image installs with
`npm ci --include=dev` and builds with `npm run build` on Node 24 LTS, then serves
only `dist/` using Nginx (`nginx -g 'daemon off;'`). There is no Node application
server or production npm start command; `npm run dev` and `npm run preview` are
local tools. Docker build inputs are allowlisted in `.dockerignore`; local env
files, credentials, dependencies and Git history are excluded.

On the Linux VM, install Docker Engine with the Compose plugin, then run from
this repository:

```sh
docker compose config --quiet
docker network create telemetry-shared
# If the network already exists, skip network creation.
# Attach/start the backend on this network as described below first.
docker compose build --pull frontend
docker compose up -d frontend
docker compose ps
docker compose logs --tail=100 -f frontend
# Ctrl-C exits log following without stopping the frontend.
docker compose down
```

The frontend binds **127.0.0.1:8088** on the VM (container port 80). Port 8088
was unused on the development host; check it on the VM before starting. Open
`http://127.0.0.1:8088/` on the VM, or use an SSH tunnel to inspect it remotely.
Nginx forwards `/api/` to `backend:8000` over the external `telemetry-shared`
Docker network, stripping the `/api/` prefix. Its health check checks static
serving only, not backend availability.
Routes currently use hashes: `/#runs`, `/#management`, and `/#analysis?run=1`.
Direct navigation and reload preserve the hash route; Nginx also provides an
index fallback for SPA paths and returns 404 for missing hashed assets.

No secrets or runtime frontend settings are required. Compose sets the existing
**VITE_API_BASE_URL=/api at build time**, covering JSON requests, CSV import and
CSV export. To change it, edit `build.args` and rebuild/recreate the container.
For a standalone image build: `docker build --build-arg VITE_API_BASE_URL=/api -t telemetry-frontend .`.
Container environment variables set at startup cannot change the bundled value.
All `VITE_*` values are public browser code: never put secrets in them.
The backend address is in `docker/nginx.conf`; changing it requires rebuilding.
Nginx uses Docker DNS to refresh the backend address after container recreation.
The Compose host port can change without rebuilding (recreate the container).
No browser API calls use
hard-coded localhost addresses; Vite's development proxy alone targets localhost.
There are currently no WebSocket or Server-Sent Events connections.

### Separate backend Compose project

Create the network once on the Docker host with `docker network create telemetry-shared`.
The backend Compose file currently lives outside this workspace at
`C:\PythonProject\Telemetry_Backend\compose.yaml`. Add the following network
entries to that file, retaining all existing backend settings, including the
loopback port `127.0.0.1:8000:8000`, and leaving the database and `.env` alone:

```yaml
services:
  backend:
    # Keep existing build, environment, ports, etc.
    networks:
      default: {}
      telemetry:
        aliases:
          - backend

networks:
  telemetry:
    external: true
    name: telemetry-shared
```

From the backend project directory, run `docker compose up -d --no-deps backend`.
On Linux, use the actual backend checkout directory. This keeps the backend's
default network and adds the shared network without touching database services.
For the already-running development container, this session attached it with
`docker network connect --alias backend telemetry-shared telemetry_backend-backend-1`.
That attachment works now but must be declared in backend Compose to survive
container recreation. Only one backend should advertise that alias on this network.

### Optional host reverse proxy

The VM host reverse proxy can forward **all** dashboard and API requests to
the frontend Nginx without rewriting `/api`. Inside its HTTPS `server` block:

```nginx
location / {
    proxy_pass http://127.0.0.1:8088;
    proxy_set_header Host $host;
    client_max_body_size 100m;
}
```

Frontend Nginx preserves methods, request bodies and query parameters; its
trailing-slash upstream maps `/api/cars` to `/cars`. Backend paths remain
`/runs`, `/cars`, `/drivers`, `/locations`, `/teams`, `/telemetry/*`, and
`/analytics/*`; do not add `/api` to the backend itself. The Vite development
proxy does not ship in production. Same-origin routing avoids browser CORS;
an explicitly configured external API origin needs backend CORS permission.
Host loopback upstreams assume the reverse proxy runs on the VM host; a proxy
inside a container needs an explicitly configured network/upstream instead.
VM setup still needs the separate backend, host proxy routes and HTTPS configured.

After starting, check the static server and API proxy:

```sh
docker compose exec frontend nginx -t
curl -f http://127.0.0.1:8088/
curl -f http://127.0.0.1:8088/api/cars
docker compose ps
```

Then open the public hostname's dashboard and `/#runs`, reload, and confirm API
responses in browser network tools through the configured VM reverse proxy.

## Experimental Component Lab

Component Lab (`/#componentLab`) is a read-only workspace for investigating XY
relationships in archived samples or existing FastAPI runs. It is separate from
the production Analysis page. See the [Component Lab guide](docs/component-lab.md)
for controls, correlations, data provenance, limitations, and testing.
