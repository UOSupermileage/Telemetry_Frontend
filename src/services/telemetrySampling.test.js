import { test } from 'node:test'
import assert from 'node:assert/strict'
import { setTimeout as pause } from 'node:timers/promises'
import { createLatestLoader, sampledTelemetryPath, tickBounds } from './telemetrySampling.js'

test('overview repeats fields and uses sampling without pagination or bounds', () => {
  const query = new URL(sampledTelemetryPath({ runId: 4, fields: ['speed', 'current'] }), 'http://test').searchParams
  assert.deepEqual(query.getAll('fields'), ['speed', 'current'])
  assert.equal(query.get('max_points'), '800')
  assert.equal(query.get('run_id'), '4')
  for (const field of ['offset', 'limit', 'start_tick', 'end_tick']) assert.equal(query.has(field), false)
})

test('zoom uses inclusive raw boot milliseconds rounded outwards; reset drops both bounds', () => {
  assert.deepEqual(tickBounds({ min: 20000.7, max: 29999.2 }), { startTick: 20000, endTick: 30000 })
  const query = new URL(sampledTelemetryPath({ runId: 4, fields: ['speed'], range: { min: 20000, max: 30000 } }), 'http://test').searchParams
  assert.equal(query.get('start_tick'), '20000')
  assert.equal(query.get('end_tick'), '30000')
  assert.deepEqual(tickBounds(null), {})
  assert.equal(sampledTelemetryPath({ runId: 4, fields: ['speed'], range: null }).includes('start_tick'), false)
  assert.throws(() => tickBounds({ min: 10, max: 5 }))
  assert.throws(() => sampledTelemetryPath({ runId: 4, fields: ['speed'], maxPoints: 1 }))
})

test('debounces rapid range changes and cancels when a chart is removed', async () => {
  const calls = []
  const loader = createLatestLoader(async (value) => { calls.push(value); return value }, {
    onStart() {}, onSuccess() {}, onError(error) { throw error },
  }, 10)
  loader.request('first')
  loader.request('last')
  await pause(30)
  assert.deepEqual(calls, ['last'])
  loader.request('unmounted')
  loader.cancel()
  await pause(30)
  assert.deepEqual(calls, ['last'])
})

test('ignores stale success and failure even if the transport ignores cancellation', async () => {
  const pending = []
  const successes = []
  const errors = []
  const loader = createLatestLoader((value, signal) => new Promise((resolve, reject) => {
    pending.push({ value, signal, resolve, reject })
  }), { onStart() {}, onSuccess: (value) => successes.push(value), onError: (error) => errors.push(error) }, 0)
  loader.request('old-run', true)
  await pause(10)
  loader.request('new-run', true)
  await pause(10)
  assert.equal(pending[0].signal.aborted, true)
  pending[1].resolve('new data')
  pending[0].resolve('stale data')
  await pause(0)
  assert.deepEqual(successes, ['new data'])
  loader.request('old-channel', true)
  await pause(10)
  loader.request('new-channel', true)
  await pause(10)
  pending[2].reject(new Error('stale error'))
  pending[3].resolve('new channel data')
  await pause(0)
  assert.deepEqual(errors, [])
  assert.deepEqual(successes, ['new data', 'new channel data'])
  loader.cancel()
})
