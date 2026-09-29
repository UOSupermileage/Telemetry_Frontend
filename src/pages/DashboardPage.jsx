import TelemetryChartHolder from '../components/TelemetryChartHolder'
import DashboardSidebar from '../components/DashboardSidebar'

const telemetry = [
  { tick: 0, throttle: 12, speed: 0, current: 4.2, voltage: 48.1 },
  { tick: 1, throttle: 28, speed: 12, current: 9.8, voltage: 47.8 },
  { tick: 2, throttle: 42, speed: 24, current: 15.3, voltage: 47.4 },
  { tick: 3, throttle: 38, speed: 31, current: 13.7, voltage: 47.1 },
  { tick: 4, throttle: 55, speed: 42, current: 20.2, voltage: 46.8 },
  { tick: 5, throttle: 68, speed: 53, current: 25.4, voltage: 46.2 },
  { tick: 6, throttle: 61, speed: 59, current: 22.8, voltage: 46.0 },
  { tick: 7, throttle: 78, speed: 68, current: 29.5, voltage: 45.6 },
  { tick: 8, throttle: 72, speed: 74, current: 27.1, voltage: 45.4 },
  { tick: 9, throttle: 88, speed: 82, current: 33.8, voltage: 45.0 },
  { tick: 10, throttle: 76, speed: 86, current: 28.7, voltage: 45.2 },
  { tick: 11, throttle: 64, speed: 84, current: 24.1, voltage: 45.8 },
  { tick: 12, throttle: 82, speed: 91, current: 30.6, voltage: 45.3 },
  { tick: 13, throttle: 58, speed: 88, current: 21.9, voltage: 46.1 },
  { tick: 14, throttle: 35, speed: 79, current: 13.2, voltage: 46.9 },
]

const charts = [
  {
    id: 'speed',
    title: 'Speed',
    data: telemetry,
    yKey: 'speed',
    unit: 'km/h',
    color: '#6657a5',
  },
  {
    id: 'throttle',
    title: 'Throttle',
    data: telemetry,
    yKey: 'throttle',
    unit: '%',
    color: '#f47700',
  },
  {
    id: 'current',
    title: 'Current',
    data: telemetry,
    yKey: 'current',
    unit: 'A',
    color: '#168a78',
  },
  {
    id: 'voltage',
    title: 'Voltage',
    data: telemetry,
    yKey: 'voltage',
    unit: 'V',
    color: '#3275a8',
  },
]

function DashboardPage() {
  return (
    <div className="dashboard-layout">

      <aside className="dashboard-sidebar-panel">
        <DashboardSidebar />
      </aside>

      <div className="dashboard-graph-area">
        <TelemetryChartHolder charts={charts} />
      </div>

    </div>
  )
}

export default DashboardPage