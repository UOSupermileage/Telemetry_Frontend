import { test } from 'node:test'
import assert from 'node:assert/strict'
import { gestureRange, wheelZoomRange } from './chartGestures.js'

test('diagonal pinch zooms around the two-finger midpoint', () => {
  const result = gestureRange({ min: 10000, max: 110000 },
    [{ x: 400, y: 40 }, { x: 600, y: 60 }],
    [{ x: 250, y: 25 }, { x: 750, y: 75 }], 1000)
  assert.deepEqual(result, { min: 40000, max: 80000 })
})

test('pinch recognizes vertical finger separation and moving midpoints', () => {
  const result = gestureRange({ min: 0, max: 1000 },
    [{ x: 500, y: 25 }, { x: 500, y: 75 }],
    [{ x: 600, y: 0 }, { x: 600, y: 100 }], 1000)
  assert.deepEqual(result, { min: 200, max: 700 })
})

test('one finger pans the time range and clamps boot ticks to zero', () => {
  assert.deepEqual(gestureRange({ min: 200, max: 1200 }, [{ x: 500, y: 20 }], [{ x: 400, y: 20 }], 1000), { min: 300, max: 1300 })
  assert.deepEqual(gestureRange({ min: 200, max: 1200 }, [{ x: 500, y: 20 }], [{ x: 900, y: 20 }], 1000), { min: 0, max: 1000 })
})

test('trackpad pinch keeps the tick under the pointer anchored', () => {
  const result = wheelZoomRange({ min: 10000, max: 110000 }, 0.25, -50)
  const width = result.max - result.min
  assert.ok(width < 100000)
  assert.ok(Math.abs(result.min + width * .25 - 35000) < 1e-8)
})
