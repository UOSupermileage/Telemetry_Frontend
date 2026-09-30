import './TelemetryTabs.css'

const telemetryOptions = [
  { label: 'Speed', color: '#6657a5', icon: '↗' },
  { label: 'Throttle', color: '#f47700', icon: '%' },
  { label: 'Current', color: '#168a78', icon: 'ϟ' },
  { label: 'Voltage', color: '#3275a8', icon: 'V' },
]

function TelemetryTabs({ visibleMetrics = [], onMetricToggle = () => {} }) {
  return (
    <div className="telemetry-tabs">
      {telemetryOptions.map(({ label, color, icon }) => {
        const metric = label.toLowerCase()
        const selected = visibleMetrics.includes(metric)
        return (
        <button
          key={metric}
          type="button"
          className={`telemetry-tab${selected ? ' selected' : ''}`}
          aria-pressed={selected}
          onClick={() => onMetricToggle(metric)}
        >
          <span className="telemetry-tab-icon" style={{ '--metric-color': color }} aria-hidden="true">{icon}</span>
          <span className="telemetry-tab-name">{label}</span>
          <span className="telemetry-tab-state">{selected ? 'Shown' : 'Hidden'}</span>
        </button>
      )})}
    </div>
  )
}

export default TelemetryTabs
