import { useEffect, useMemo, useState } from 'react'
import { Lightbulb, SlidersHorizontal } from 'lucide-react'
import ScatterChart from '../components/ScatterChart'
import { getAllRuns } from '../services/runs'
import { getAppRunSamples } from '../services/componentLabApi'
import archived from '../data/componentLabHistorical.json'
import './ComponentLabPage.css'

// The chart is presentation-only. Each data source normalizes its values BEFORE
// passing observations to ScatterChart; axis labels must match those values.
const FIELDS = {
  elapsed_s: { label: 'Elapsed time', unit: 's' },
  speed_kmh: { label: 'Speed', unit: 'km/h' },
  current_a: { label: 'Current', unit: 'A' },
  voltage_v: { label: 'Voltage', unit: 'V' },
  power_w: { label: 'Electrical power', unit: 'W' },
  throttle_pct: { label: 'Throttle', unit: '%' },
}
const axis = (key) => `${FIELDS[key].label} (${FIELDS[key].unit})`
const COLORS = ['#f47700', '#3a8ac4']

// A scenario selects axes and explains a QUESTION; it never assigns a diagnosis.
const QUESTIONS = [
  {
    id: 'speed-power', label: 'Mechanical · Speed vs electrical power', x: 'speed_kmh', y: 'power_w',
    question: 'Does electrical power change with speed, or are several operating regimes visible?',
    caution: 'Electrical power = current × voltage; it is not shaft power. Acceleration, slope and operating conditions matter.',
  },
  {
    id: 'current-voltage', label: 'Electrical · Current vs voltage', x: 'current_a', y: 'voltage_v',
    question: 'Does voltage decrease as current increases?',
    caution: 'A negative association may reflect voltage sag, not necessarily a defective battery. Confirm calibration and conditions.',
  },
  {
    id: 'speed-throttle', label: 'Embedded · Throttle vs speed', x: 'throttle_pct', y: 'speed_kmh',
    question: 'Does the throttle signal help distinguish operating states?',
    caution: 'Some archived recordings have constant or missing throttle. Correlation cannot be calculated for a constant signal.',
  },
  {
    id: 'time-voltage', label: 'Data science · Voltage vs time', x: 'elapsed_s', y: 'voltage_v',
    question: 'Is there a drift in voltage throughout the recording?',
    caution: 'A trend over time does not by itself explain its cause.',
  },
  {
    id: 'current-power', label: 'Sanity check · Current vs calculated power', x: 'current_a', y: 'power_w',
    question: 'Can a correlation appear simply because one variable is computed from the other?',
    caution: 'Power is calculated from current and voltage, so this correlation is partly built into the formula.',
  },
]
const runName = (run) => run?.name || run?.run_name || `Run #${run?.run_id}`

/**
 * Experimental, read-only XY explorer. The historical samples work offline;
 * "App runs" opt-in uses the EXISTING GET /runs and GET /telemetry/data API.
 * Neither path writes to the backend or changes the production Analysis page.
 */
export default function ComponentLabPage() {
  const [sourceMode, setSourceMode] = useState('archive')
  const [scenario, setScenario] = useState('speed-power')
  const [xKey, setXKey] = useState('speed_kmh')
  const [yKey, setYKey] = useState('power_w')
  const [compare, setCompare] = useState(true)
  const [archiveA, setArchiveA] = useState(archived.series[0]?.id ?? '')
  const [archiveB, setArchiveB] = useState(archived.series[1]?.id ?? '')
  const [apiRuns, setApiRuns] = useState([])
  const [apiA, setApiA] = useState('')
  const [apiB, setApiB] = useState('')
  const [apiSeries, setApiSeries] = useState([])
  const [runsLoading, setRunsLoading] = useState(false)
  const [samplesLoading, setSamplesLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [trend, setTrend] = useState(false)
  const [medianCurve, setMedianCurve] = useState(false) // Opt-in: bin curves can mislead for bimodal data.
  const [statistics, setStatistics] = useState(true)
  const [regimes, setRegimes] = useState(false)
  const [outliers, setOutliers] = useState(false)
  const [colorMode, setColorMode] = useState('series')
  const [pointCap, setPointCap] = useState(250)
  const [pointSize, setPointSize] = useState(2.7)

  const question = QUESTIONS.find((item) => item.id === scenario)
  function selectQuestion(id) {
    setScenario(id)
    const next = QUESTIONS.find((item) => item.id === id)
    if (next) { setXKey(next.x); setYKey(next.y) }
  }

  const firstArchive = archived.series.find((s) => s.id === archiveA) ?? archived.series[0]
  const secondArchive = archived.series.find((s) => s.id === archiveB && s.id !== firstArchive?.id)
    ?? archived.series.find((s) => s.id !== firstArchive?.id)
  const archiveSeries = useMemo(() => [firstArchive, ...(compare && secondArchive ? [secondArchive] : [])]
    .filter(Boolean).map((s, index) => ({ ...s, color: COLORS[index] })), [firstArchive, secondArchive, compare])

  // Real run IDs come from FastAPI, never from the historical archive fixture.
  const selectedA = apiRuns.some((r) => String(r.run_id) === apiA) ? apiA : String(apiRuns[0]?.run_id ?? '')
  const selectedB = apiRuns.some((r) => String(r.run_id) === apiB && String(r.run_id) !== selectedA)
    ? apiB : String(apiRuns.find((r) => String(r.run_id) !== selectedA)?.run_id ?? '')

  // Fetch run metadata only if the user explicitly chooses "App runs".
  useEffect(() => {
    if (sourceMode !== 'app') return undefined
    const controller = new AbortController()
    setApiError('')
    setRunsLoading(true)
    getAllRuns({ signal: controller.signal })
      .then((runs) => { if (!controller.signal.aborted) setApiRuns(runs) })
      .catch((error) => { if (!controller.signal.aborted) setApiError(error.message) })
      .finally(() => { if (!controller.signal.aborted) setRunsLoading(false) })
    return () => controller.abort()
  }, [sourceMode])

  useEffect(() => {
    if (sourceMode !== 'app' || !selectedA) return undefined
    const controller = new AbortController()
    const ids = [selectedA, ...(compare && selectedB ? [selectedB] : [])]
    setApiError('')
    setSamplesLoading(true)
    setApiSeries([]) // Don't show stale points while the selection changes.
    Promise.all(ids.map(async (id, index) => ({
      id, label: runName(apiRuns.find((r) => String(r.run_id) === id)), color: COLORS[index],
      points: await getAppRunSamples(id, { signal: controller.signal, maxPoints: 600 }),
    })))
      .then((series) => { if (!controller.signal.aborted) setApiSeries(series) })
      .catch((error) => { if (!controller.signal.aborted) setApiError(error.message) })
      .finally(() => { if (!controller.signal.aborted) setSamplesLoading(false) })
    return () => controller.abort()
  }, [sourceMode, selectedA, selectedB, compare, apiRuns])

  const series = sourceMode === 'archive' ? archiveSeries : apiSeries
  const selectedIds = sourceMode === 'archive'
    ? { first: firstArchive?.id ?? '', second: secondArchive?.id ?? '' }
    : { first: selectedA, second: selectedB }

  return <div className="component-lab-workspace">
    <div className="component-lab-warning">
      <strong>Experimental · V2 proposal</strong>
      <span>Exploratory telemetry — not validated mechanical results. No changes to Analysis.</span>
    </div>

    <section className="component-lab-panel" aria-label="Scatter Explorer">
      <div className="component-lab-heading">
        <div>
          <h2>Scatter Explorer</h2>
          <p>Explore relationships between two telemetry signals.</p>
        </div>
        <details className="component-lab-help">
          <summary title="What does this graph mean?" aria-label="Help: how to interpret the scatter plot">
            <Lightbulb size={19} aria-hidden="true" /><span>Help</span>
          </summary>
          <div className="component-lab-help-content">
            <strong>How to read this graph</strong>
            <p>Each dot is one pair of measured values (X and Y), not a position in time. Dot colors distinguish recordings or relative groups.</p>
            {question && <><p><strong>Question:</strong> {question.question}</p><p><strong>Be careful:</strong> {question.caution}</p></>}
            <p><strong>Pearson r</strong> measures a linear relationship; <strong>Spearman ρ</strong> measures a monotonic relationship; <strong>R²</strong> describes a linear fit. None proves cause and effect.</p>
            <p><strong>Median curve</strong> summarizes Y in groups of X values. It can zigzag when several distinct operating states overlap. <strong>Relative regions</strong> use this selection's medians, not verified ML labels. Red rings are candidate unusual observations, not faults.</p>
            <p>Statistics use all loaded valid pairs, while the chart may display fewer points. Live app runs are sampled by the API, so those statistics are exploratory and not full-run analytics.</p>
          </div>
        </details>
      </div>

      <div className="component-lab-main-controls">
        <label className="component-lab-question">Question
          <select value={scenario} onChange={(event) => selectQuestion(event.target.value)}>
            {QUESTIONS.map((q) => <option key={q.id} value={q.id}>{q.label}</option>)}
            <option value="custom">Custom X / Y</option>
          </select>
        </label>
        <label>Data source
          <select value={sourceMode} onChange={(event) => setSourceMode(event.target.value)}>
            <option value="archive">Historical examples</option>
            <option value="app">App runs (FastAPI)</option>
          </select>
        </label>
        <label>X axis
          <select value={xKey} onChange={(event) => { setXKey(event.target.value); setScenario('custom') }}>
            {Object.keys(FIELDS).map((key) => <option key={key} value={key}>{axis(key)}</option>)}
          </select>
        </label>
        <label>Y axis
          <select value={yKey} onChange={(event) => { setYKey(event.target.value); setScenario('custom') }}>
            {Object.keys(FIELDS).map((key) => <option key={key} value={key}>{axis(key)}</option>)}
          </select>
        </label>
      </div>

      <div className="component-lab-recordings">
        <label>Recording A
          <select value={selectedIds.first} disabled={sourceMode === 'app' && runsLoading}
            onChange={(event) => sourceMode === 'archive' ? setArchiveA(event.target.value) : setApiA(event.target.value)}>
            {sourceMode === 'archive'
              ? archived.series.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)
              : apiRuns.map((r) => <option key={r.run_id} value={r.run_id}>{runName(r)}</option>)}
          </select>
        </label>
        <label className="component-lab-compare">
          <input type="checkbox" checked={compare} onChange={(event) => setCompare(event.target.checked)} />
          Compare two recordings
        </label>
        {compare && <label>Recording B
          <select value={selectedIds.second} disabled={sourceMode === 'app' && runsLoading}
            onChange={(event) => sourceMode === 'archive' ? setArchiveB(event.target.value) : setApiB(event.target.value)}>
            {sourceMode === 'archive'
              ? archived.series.filter((r) => r.id !== firstArchive?.id).map((r) => <option key={r.id} value={r.id}>{r.label}</option>)
              : apiRuns.filter((r) => String(r.run_id) !== selectedA).map((r) => <option key={r.run_id} value={r.run_id}>{runName(r)}</option>)}
          </select>
        </label>}
      </div>

      {(runsLoading || samplesLoading) && <p className="component-lab-message" role="status">Loading app recordings…</p>}
      {apiError && sourceMode === 'app' && <p className="component-lab-error" role="alert">Could not load app data: {apiError}. Check that FastAPI and VITE_API_BASE_URL are configured.</p>}
      {sourceMode === 'app' && !runsLoading && !apiError && !apiRuns.length && <p className="component-lab-message">No runs found in the application's database.</p>}
      {sourceMode === 'app' && !runsLoading && !apiError && apiRuns.length > 0 &&
        <p className="component-lab-data-note">App mode uses the existing read-only API, at most 600 sampled measurements per run. Correlations are not calculated on the full database run.</p>}

      <details className="component-lab-advanced">
        <summary><SlidersHorizontal size={16} aria-hidden="true" /> Chart options</summary>
        <div className="component-lab-options">
          <label><input type="checkbox" checked={statistics} onChange={(e) => setStatistics(e.target.checked)} /> Correlation summary</label>
          <label><input type="checkbox" checked={trend} onChange={(e) => setTrend(e.target.checked)} /> Linear trend</label>
          <label><input type="checkbox" checked={medianCurve} onChange={(e) => setMedianCurve(e.target.checked)} /> Binned median trend</label>
          <label><input type="checkbox" checked={regimes} onChange={(e) => setRegimes(e.target.checked)} /> Relative regions</label>
          <label><input type="checkbox" checked={outliers} onChange={(e) => setOutliers(e.target.checked)} /> Unusual point candidates</label>
          <label>Color by
            <select value={colorMode} onChange={(e) => setColorMode(e.target.value)}>
              <option value="series">Recording</option><option value="regime">Relative regions</option>
            </select>
          </label>
          <label>Points shown per recording
            <input type="number" min="2" max="500" value={pointCap}
              onChange={(e) => setPointCap(Math.max(2, Math.min(500, Number(e.target.value) || 2)))} />
          </label>
          <label>Point radius
            <input type="number" min="1" max="9" step="0.5" value={pointSize}
              onChange={(e) => setPointSize(Math.max(1, Math.min(9, Number(e.target.value) || 1)))} />
          </label>
        </div>
      </details>

      {(sourceMode === 'archive' || (!runsLoading && !samplesLoading && !apiError && series.length > 0)) &&
        <ScatterChart series={series} xKey={xKey} yKey={yKey} xLabel={axis(xKey)} yLabel={axis(yKey)}
          title={`${FIELDS[xKey].label} vs ${FIELDS[yKey].label}`}
          maxPointsPerSeries={pointCap} pointRadius={pointSize}
          showTrendline={trend} showMedianTrend={medianCurve} showStatistics={statistics}
          showRegimes={regimes} showOutlierCandidates={outliers} colorMode={colorMode} />}

      {sourceMode === 'archive' && <footer className="component-lab-sources">
        <strong>Data sources</strong>
        {archiveSeries.map((r) => <a key={r.id} href={r.source_url} target="_blank" rel="noreferrer" title={r.source_path}>
          {r.source_path.split('/').at(-1)} ↗
        </a>)}
        <span>Historical excerpts · recording boundaries unverified</span>
      </footer>}
    </section>
  </div>
}
