import { expect, test } from 'vitest'
import { validPairs, median, averageRanks, spearmanCorrelation, medianTrend, regimeSummary, classifyRegime, residualOutliers } from './scatterInsights'

test('missing values are NOT converted to zero, zero is retained', () => {
  expect(validPairs([{ x: 0, y: 1 }, { x: null, y: 2 }, { x: 2, y: '' }, { x: '3', y: '4' }], 'x', 'y'))
    .toEqual([{ x: 0, y: 1 }, { x: 3, y: 4 }])
})
test('median works with odd and even sample counts', () => {
  expect(median([10, 1, 4])).toBe(4)
  expect(median([1, 2, 4, 10])).toBe(3)
  expect(median([])).toBeNull()
})
test('Spearman uses tied ranks and finds perfect monotonic relationships', () => {
  expect(averageRanks([10, 10, 20])).toEqual([1.5, 1.5, 3])
  const pairs = [{x:1,y:9},{x:2,y:5},{x:3,y:1}]
  expect(spearmanCorrelation(pairs, 'x', 'y').rho).toBeCloseTo(-1)
  expect(spearmanCorrelation([{x:1,y:1},{x:2,y:4},{x:3,y:9}], 'x','y').rho).toBeCloseTo(1)
})
test('a U-shaped relationship can evade monotonic rank correlation', () => {
  const points = [-3,-2,-1,0,1,2,3].map(x=>({x,y:x*x}))
  expect(Math.abs(spearmanCorrelation(points,'x','y').rho)).toBeLessThan(.01)
  const trend = medianTrend(points,'x','y',3)
  expect(trend.length).toBeGreaterThanOrEqual(2)
})
test('binned curve is sorted by X and no bins for fewer than six pairs', () => {
  const pts = [7,1,4,3,5,6,2,8,9,10,11,12].map(x => ({x,y:x*x}))
  const curve = medianTrend(pts,'x','y',4)
  expect(curve).toHaveLength(4)
  expect(curve.map(p=>p.x)).toEqual([...curve.map(p=>p.x)].sort((a,b)=>a-b))
  expect(medianTrend(pts.slice(0,4),'x','y')).toEqual([])
})
test('regime summaries classify all points against a shared median', () => {
  const points = [{x:1,y:1},{x:1,y:9},{x:9,y:1},{x:9,y:9}]
  const summary = regimeSummary(points,'x','y')
  expect(summary.available).toBe(true)
  expect(summary.midX).toBe(5)
  expect(Object.values(summary.counts)).toEqual([1,1,1,1])
  expect(classifyRegime({x:8,y:1},summary)).toBe('high-low')
  expect(regimeSummary([{x:1,y:2},{x:1,y:3},{x:1,y:4},{x:1,y:5}],'x','y').available).toBe(false)
})
test('outlier flags are exploratory rather than a physics diagnosis', () => {
  const points = Array.from({length:100},(_,i)=>({x:i,y:i*2 + (i%3 - 1)*.3}))
  points[50].y += 100
  const result = residualOutliers(points,'x','y')
  expect(result.count).toBeGreaterThan(0)
  expect(result.indices).toContain(50)
  expect(result.threshold).toBe(3.5)
})
test('outlier detection cannot invent a result on insufficient data', () => {
  expect(residualOutliers([{x:1,y:2}], 'x','y').count).toBe(0)
})
