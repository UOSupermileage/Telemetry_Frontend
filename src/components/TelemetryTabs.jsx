import './TelemetryTabs.css'

const metrics = [
  { id: 'speed', label: 'Speed' },
  { id: 'throttle', label: 'Throttle' },
  { id: 'current', label: 'Current' },
  { id: 'voltage', label: 'Voltage' },
]

function TelemetryTabs({
  activeMetric,
  onMetricChange,
}) {
  return (
    <div className="telemetry-tabs">
      {metrics.map((metric) => (
        <button
          key={metric.id}
          className={
            activeMetric === metric.id
              ? 'telemetry-tab active'
              : 'telemetry-tab'
          }
          onClick={() => onMetricChange(metric.id)}
        >
          {metric.label}
        </button>
      ))}
    </div>
  )
}

export default TelemetryTabs
