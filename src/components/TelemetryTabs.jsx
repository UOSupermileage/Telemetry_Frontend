import { useState } from 'react'
import './TelemetryTabs.css'

const telemetryOptions = [
  'Speed',
  'Throttle',
  'Current',
  'Voltage',
]

function TelemetryTabs() {
  const [selectedTelemetry, setSelectedTelemetry] = useState(['Speed'])

  const toggleTelemetry = (option) => {
    setSelectedTelemetry((current) => {
      if (current.includes(option)) {
        return current.filter((item) => item !== option)
      }

      return [...current, option]
    })
  }

  return (
    <div className="telemetry-tabs">
      {telemetryOptions.map((option) => (
        <button
          key={option}
          type="button"
          className={`telemetry-tab ${
            selectedTelemetry.includes(option) ? 'selected' : ''
          }`}
          onClick={() => toggleTelemetry(option)}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

export default TelemetryTabs