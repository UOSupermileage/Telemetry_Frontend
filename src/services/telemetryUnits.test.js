import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toDisplayTelemetry, toDisplayValue } from './telemetryUnits.js'

test('converts raw telemetry to display units while retaining boot ticks and metadata', () => {
  const raw = { run_id: 4, tick: 14205, throttle: 423, speed: 9650, current: 116, voltage: 53400 }
  assert.deepEqual(toDisplayTelemetry(raw), {
    run_id: 4, tick: 14205, throttle: 42.3, speed: 9.65, current: 0.116, voltage: 53.4,
  })
  assert.equal(raw.speed, 9650)
})

test('preserves missing readings and converts zeros and throttle endpoints', () => {
  for (const value of [null, undefined, '', NaN, Infinity, 'invalid']) {
    assert.equal(toDisplayValue(value, 'speed'), null)
  }
  assert.equal(toDisplayValue(0, 'throttle'), 0)
  assert.equal(toDisplayValue(1000, 'throttle'), 100)
  assert.equal(toDisplayValue(-1200, 'current'), -1.2)
})

test('uses the same speed scaling for analytics and comparison deltas', () => {
  assert.equal(toDisplayValue(6360.216725559481, 'speed'), 6.360216725559481)
  assert.equal(toDisplayValue(9650 - 8000, 'speed'), 1.65)
})
