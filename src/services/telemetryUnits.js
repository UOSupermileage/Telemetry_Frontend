// API/CSV units: tick = ms since boot, throttle = 0.1%, speed = m/h,
// current = mA, voltage = mV. Convert only for display; preserve raw exports.
export function toDisplayValue(value, field) {
  if (value == null || value === '' || !Number.isFinite(Number(value))) return null
  const divisor = { throttle: 10, speed: 1000, current: 1000, voltage: 1000 }[field] ?? 1
  return Number(value) / divisor
}

export function toDisplayTelemetry(point) {
  return {
    ...point,
    throttle: toDisplayValue(point.throttle, 'throttle'),
    speed: toDisplayValue(point.speed, 'speed'),
    current: toDisplayValue(point.current, 'current'),
    voltage: toDisplayValue(point.voltage, 'voltage'),
  }
}
