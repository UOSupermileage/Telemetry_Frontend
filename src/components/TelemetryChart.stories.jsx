import TelemetryChart from './TelemetryChart'
import { toDisplayTelemetry } from '../services/telemetryUnits'

const data = [
  { run_id: 3, tick: 14000, throttle: 120, speed: 0, current: 4200, voltage: 48100 },
  { run_id: 3, tick: 15000, throttle: 280, speed: 12000, current: 9800, voltage: 47800 },
  { run_id: 3, tick: 16000, throttle: 420, speed: 24000, current: 15300, voltage: 47400 },
  { run_id: 3, tick: 17000, throttle: 380, speed: 31000, current: 13700, voltage: 47100 },
].map(toDisplayTelemetry)

const meta = {
  component: TelemetryChart,
  tags: ['ai-generated'],
  args: { data, yKey: 'speed', unit: 'km/h' },
}

export default meta

export const Speed = {}

export const Throttle = { args: { yKey: 'throttle', unit: '%' } }

export const Current = { args: { yKey: 'current', unit: 'A' } }

export const Voltage = { args: { yKey: 'voltage', unit: 'V' } }

export const NoTelemetry = { args: { data: [] } }
