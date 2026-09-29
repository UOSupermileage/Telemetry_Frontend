import './TelemetryTabs.css'

const telemetryOptions = ['Speed', 'Throttle', 'Current', 'Voltage']

function TelemetryTabs({ visibleMetrics = [], onMetricToggle = () => {} }) {
  return (
    <div className="telemetry-tabs">
      {telemetryOptions.map((option) => (
        <button
          key={option}
          type="button"
          className={`telemetry-tab ${
            visibleMetrics.includes(option.toLowerCase()) ? 'selected' : ''
          }`}
          aria-pressed={visibleMetrics.includes(option.toLowerCase())}
          onClick={() => onMetricToggle(option.toLowerCase())}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

export default TelemetryTabs
