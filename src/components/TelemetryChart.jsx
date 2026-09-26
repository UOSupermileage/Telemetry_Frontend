import { useEffect, useMemo, useRef, useState } from 'react'
import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'
import './TelemetryChart.css'

const metrics = {
  throttle: { label: 'Throttle', unit: '%', color: '#f47700' },
  speed: { label: 'Speed', unit: 'km/h', color: '#6657a5' },
  current: { label: 'Current', unit: 'A', color: '#168a78' },
  voltage: { label: 'Voltage', unit: 'V', color: '#3275a8' },
}

const sampleData = [
  { run_id: 3, tick: 0, throttle: 12, speed: 0, current: 4.2, voltage: 48.1 },
  { run_id: 3, tick: 1, throttle: 28, speed: 12, current: 9.8, voltage: 47.8 },
  { run_id: 3, tick: 2, throttle: 42, speed: 24, current: 15.3, voltage: 47.4 },
  { run_id: 3, tick: 3, throttle: 38, speed: 31, current: 13.7, voltage: 47.1 },
  { run_id: 3, tick: 4, throttle: 55, speed: 42, current: 20.2, voltage: 46.8 },
  { run_id: 3, tick: 5, throttle: 68, speed: 53, current: 25.4, voltage: 46.2 },
  { run_id: 3, tick: 6, throttle: 61, speed: 59, current: 22.8, voltage: 46.0 },
  { run_id: 3, tick: 7, throttle: 78, speed: 68, current: 29.5, voltage: 45.6 },
  { run_id: 3, tick: 8, throttle: 72, speed: 74, current: 27.1, voltage: 45.4 },
  { run_id: 3, tick: 9, throttle: 88, speed: 82, current: 33.8, voltage: 45.0 },
  { run_id: 3, tick: 10, throttle: 76, speed: 86, current: 28.7, voltage: 45.2 },
  { run_id: 3, tick: 11, throttle: 64, speed: 84, current: 24.1, voltage: 45.8 },
  { run_id: 3, tick: 12, throttle: 82, speed: 91, current: 30.6, voltage: 45.3 },
  { run_id: 3, tick: 13, throttle: 58, speed: 88, current: 21.9, voltage: 46.1 },
  { run_id: 3, tick: 14, throttle: 35, speed: 79, current: 13.2, voltage: 46.9 },
]

function TelemetryChart({ data = sampleData }) {
  const [metric, setMetric] = useState('speed')
  const chartElement = useRef(null)
  const chart = useRef(null)
  const selectedMetric = metrics[metric]
  const points = data?.length ? data : []
  const xValues = useMemo(() => points.map((point) => point.tick), [points])
  const values = useMemo(() => points.map((point) => point[metric] ?? null), [points, metric])
  const latestValue = values.at(-1)
  const runId = points[0]?.run_id

  useEffect(() => {
    if (!chartElement.current || !points.length) return undefined
    const opts = {
      width: chartElement.current.clientWidth,
      height: 270,
      padding: [18, 12, 0, 0],
      cursor: { drag: { x: false, y: false } },
      legend: { show: false },
      scales: { x: { time: false }, y: { auto: true } },
      axes: [
        { stroke: '#969496', grid: { show: false }, ticks: { show: false }, font: '11px system-ui', label: 'Tick', labelFont: '11px system-ui' },
        { stroke: '#969496', grid: { stroke: '#eeeae7', width: 1 }, ticks: { show: false }, font: '11px system-ui', size: 48, values: (_u, vals) => vals.map((value) => `${Number(value).toFixed(1)} ${selectedMetric.unit}`) },
      ],
      series: [{}, { label: selectedMetric.label, stroke: selectedMetric.color, width: 2.5, points: { show: true, size: 5, fill: '#fff', stroke: selectedMetric.color, width: 2 } }],
    }
    chart.current = new uPlot(opts, [xValues, values], chartElement.current)
    const observer = new ResizeObserver(([entry]) => chart.current?.setSize({ width: entry.contentRect.width, height: 270 }))
    observer.observe(chartElement.current)
    return () => { observer.disconnect(); chart.current?.destroy(); chart.current = null }
  }, [points.length, values, xValues, selectedMetric])

  return (
    <section className="telemetry-view" aria-label="Telemetry analysis">
      <div className="telemetry-toolbar">
        <div><span className="run-status-dot" /> <strong>{runId == null ? 'Telemetry' : `Run #${runId}`}</strong><span className="toolbar-divider">/</span><span>{points.length} telemetry ticks</span></div>
        <span className="telemetry-live-label">TELEMETRY DATA</span>
      </div>
      <div className="metric-cards">
        {Object.entries(metrics).map(([key, item]) => {
          const last = points.map((point) => point[key]).filter((value) => value != null).at(-1)
          return <button type="button" key={key} className={`metric-card ${metric === key ? 'selected' : ''}`} onClick={() => setMetric(key)} style={{ '--metric-color': item.color }}>
            <span className="metric-label">{item.label}</span><span className="metric-reading">{last == null ? '—' : Number(last).toLocaleString(undefined, { maximumFractionDigits: 1 })}<small>{item.unit}</small></span><span className="metric-change">{metric === key ? '● ' : ''}<span>{last == null ? 'No value in this run' : 'Latest reading'}</span></span>
          </button>
        })}
      </div>
      <div className="chart-panel">
        <div className="chart-heading"><div><h2>{selectedMetric.label} by tick</h2><p>Telemetry values recorded for this run</p></div>
          <span className="chart-series-label"><i style={{ background: selectedMetric.color }} />{selectedMetric.label} ({selectedMetric.unit})</span>
        </div>
        {points.length ? <div className="chart-plot" ref={chartElement} /> : <div className="chart-empty">No telemetry points available for this run.</div>}
        <div className="chart-footer"><span>TICK</span><span>{xValues[0]} <i /> {xValues.at(-1)} <span className="chart-footer-unit">tick</span></span><span className="chart-latest">Latest: {latestValue == null ? '—' : `${latestValue} ${selectedMetric.unit}`}</span></div>
      </div>
    </section>
  )
}

export default TelemetryChart
