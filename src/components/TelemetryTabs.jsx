import './TelemetryTabs.css'

const telemetryOptions = [
  'Speed',
  'Throttle',
  'Current',
  'Voltage',
]

function TelemetryTabs({ hiddenMetrics = [], onMetricToggle = () => {} }) {
  return (
    <div className="telemetry-tabs">
      {telemetryOptions.map((option) => (
        <button
          key={option}
          type="button"
          className={`telemetry-tab ${
            hiddenMetrics.includes(option.toLowerCase()) ? 'selected' : ''
          }`}
          aria-pressed={hiddenMetrics.includes(option.toLowerCase())}
          onClick={() => onMetricToggle(option.toLowerCase())}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

export default TelemetryTabs
