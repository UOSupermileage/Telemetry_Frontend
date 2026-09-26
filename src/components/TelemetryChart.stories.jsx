import TelemetryChart from './TelemetryChart'

const data = [
  { run_id: 3, tick: 0, throttle: 12, speed: 0, current: 4.2, voltage: 48.1 },
  { run_id: 3, tick: 1, throttle: 28, speed: 12, current: 9.8, voltage: 47.8 },
  { run_id: 3, tick: 2, throttle: 42, speed: 24, current: 15.3, voltage: 47.4 },
  { run_id: 3, tick: 3, throttle: 38, speed: 31, current: 13.7, voltage: 47.1 },
]

const meta = {
  component: TelemetryChart,
  tags: ['ai-generated'],
  args: { data, yKey: 'speed', unit: 'km/h' },
}

export default meta

export const Speed = {}

export const Throttle = { args: { yKey: 'throttle', unit: '%' } }

export const NoTelemetry = { args: { data: [] } }
