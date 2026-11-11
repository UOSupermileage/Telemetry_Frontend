/**
 * Compute descriptive statistics for paired observations (X,Y).
 * Pearson r is a linear association, NOT evidence of causality.
 * Assumes paired values are measured in compatible units at the same instant.
 * All values are calculated on the supplied complete series, never on rendered samples.
 */
export function pairedRegression(points, xKey, yKey) {
  const total = Array.isArray(points) ? points.length : 0
  let n = 0
  let meanX = 0
  let meanY = 0
  let xx = 0
  let yy = 0
  let xy = 0
  for (const point of points ?? []) {
    const a = point?.[xKey]
    const b = point?.[yKey]
    // Missing values are not zeros: even '' and null must be excluded.
    if (a == null || a === '' || b == null || b === '') continue
    const x = Number(a), y = Number(b)
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue
    n++
    const dx = x - meanX
    meanX += dx / n
    const dy = y - meanY
    meanY += dy / n
    xx += dx * (x - meanX)
    yy += dy * (y - meanY)
    xy += dx * (y - meanY)
  }
  // Degenerate series (constant X/Y or too few points) have undefined r.
  if (n < 2 || xx <= 0 || yy <= 0) {
    return { n, total, excluded: total - n, r: null, r2: null, slope: null, intercept: null }
  }
  const r = Math.max(-1, Math.min(1, xy / Math.sqrt(xx * yy)))
  const slope = xy / xx
  return { n, total, excluded: total - n, r, r2: r*r, slope, intercept: meanY - slope * meanX }
}

/** Text label is deliberately descriptive; does not imply the relationship is useful or causal. */
export function describeCorrelation(r) {
  if (r == null) return 'Not estimable (constant variable or too few valid pairs)'
  const magnitude = Math.abs(r)
  const strength = magnitude < .2 ? 'very weak' : magnitude < .4 ? 'weak' : magnitude < .7 ? 'moderate' : 'strong'
  const direction = r >= 0 ? 'positive' : 'negative'
  return `${strength} ${direction} linear association`
}

/** Display helpers, deliberately separate from source-data normalization. */
export function finiteNumber(value) {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}
export function domain(values) {
  let min = Infinity, max = -Infinity
  for (const v of values) { if (v < min) min = v; if (v > max) max = v }
  if (!Number.isFinite(min)) return [0, 1]
  const delta = max - min || Math.max(1, Math.abs(min)*.1)
  return [min - delta*.05, max + delta*.05]
}
export function samplePoints(points, maxPoints=400) {
  const cap = Number.isFinite(maxPoints) ? Math.max(2, Math.floor(maxPoints)) : 400
  if (points.length <= cap) return points
  return Array.from({length:cap}, (_,i)=>points[Math.round(i*(points.length-1)/(cap-1))])
}
