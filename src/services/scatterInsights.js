import { finiteNumber, pairedRegression } from './scatterStatistics'

/**
 * Input: a list of observations sharing xKey/yKey (e.g. speed_kmh and power_w).
 * Output: valid numeric pairs only. Zero is VALID, null and empty strings are not.
 * The source array is never mutated. No unit conversion happens in this module.
 */
export function validPairs(points, xKey, yKey) {
  return (points ?? []).flatMap((row) => {
    const x = finiteNumber(row?.[xKey])
    const y = finiteNumber(row?.[yKey])
    return x == null || y == null ? [] : [{ x, y }]
  })
}

/** Median is more robust to large spikes than the arithmetic mean. */
export function median(values) {
  if (!values?.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const center = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[center] : (sorted[center - 1] + sorted[center]) / 2
}

/** Average ranks for ties. Example: [10,10,20] -> [1.5,1.5,3]. */
export function averageRanks(values) {
  const order = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value)
  const ranks = Array(values.length)
  for (let i = 0; i < order.length;) {
    let j = i + 1
    while (j < order.length && order[i].value === order[j].value) j++
    const rank = (i + 1 + j) / 2
    for (let k = i; k < j; k++) ranks[order[k].index] = rank
    i = j
  }
  return ranks
}

/**
 * Spearman rho: Pearson r computed on average ranks.
 * Strong Spearman with weak Pearson may indicate a MONOTONIC non-linear pattern.
 * It does not detect every non-linear pattern (for example a symmetric U-shape).
 * A correlation based on nearby time samples can be misleading: samples aren't
 * statistically independent, and a trend can come from time or driving regime.
 */
export function spearmanCorrelation(points, xKey, yKey) {
  const pairs = validPairs(points, xKey, yKey)
  const xRanks = averageRanks(pairs.map((p) => p.x))
  const yRanks = averageRanks(pairs.map((p) => p.y))
  const rankPairs = xRanks.map((x, i) => ({ x, y: yRanks[i] }))
  const fit = pairedRegression(rankPairs, 'x', 'y')
  return { n: pairs.length, rho: fit.r }
}

/**
 * Equal-count X bins, median X / median Y in each bin.
 * The resulting polyline describes local observations WITHOUT pretending they
 * follow a straight line. It is NOT a prediction of unseen conditions.
 * Input points do not need to be ordered in time or X.
 */
export function medianTrend(points, xKey, yKey, bins = 10) {
  const pairs = validPairs(points, xKey, yKey).sort((a, b) => a.x - b.x)
  if (pairs.length < 6) return []
  const count = Math.min(Math.max(2, Math.floor(bins)), Math.floor(pairs.length / 3))
  const output = []
  for (let i = 0; i < count; i++) {
    const start = Math.floor(i * pairs.length / count)
    const end = Math.floor((i + 1) * pairs.length / count)
    const subset = pairs.slice(start, end)
    if (!subset.length) continue
    output.push({ x: median(subset.map(p => p.x)), y: median(subset.map(p => p.y)), n: subset.length })
  }
  // Duplicate X medians occur in plateau signals. Merge adjacent repeated X centers.
  const merged = []
  for (const bin of output) {
    const last = merged.at(-1)
    if (last?.x === bin.x) {
      last.y = (last.y * last.n + bin.y * bin.n) / (last.n + bin.n)
      last.n += bin.n
    } else merged.push({ ...bin })
  }
  return merged
}

export const REGIMES = [
  { key: 'low-low', title: 'Low X / Low Y', color: '#258a76' },
  { key: 'low-high', title: 'Low X / High Y', color: '#e06e30' },
  { key: 'high-low', title: 'High X / Low Y', color: '#5678c4' },
  { key: 'high-high', title: 'High X / High Y', color: '#a35b91' },
]

/**
 * Exploratory four-quadrant grouping relative to the median of the selected
 * points. This is RULE-BASED descriptive grouping, not supervised ML and not
 * a verified label like "efficient", "healthy" or "fault".
 * The thresholds change when selecting different runs or axes.
 */
export function regimeSummary(points, xKey, yKey) {
  const pairs = validPairs(points, xKey, yKey)
  const midX = median(pairs.map(p => p.x))
  const midY = median(pairs.map(p => p.y))
  const output = { n: pairs.length, midX, midY, available: false, counts: Object.fromEntries(REGIMES.map(r => [r.key, 0])) }
  const constantX = pairs.every(p => p.x === pairs[0]?.x)
  const constantY = pairs.every(p => p.y === pairs[0]?.y)
  if (pairs.length < 4 || constantX || constantY) return output
  output.available = true
  for (const p of pairs) output.counts[classifyRegime(p, output)]++
  return output
}

/** Classify ONE paired observation against a shared threshold (typically all runs). */
export function classifyRegime(point, thresholds) {
  if (!thresholds?.available) return null
  return `${point.x < thresholds.midX ? 'low' : 'high'}-${point.y < thresholds.midY ? 'low' : 'high'}`
}

/**
 * Find candidate unusual Y residuals compared with the binned median trend.
 * MAD = median absolute deviation; a conservative 3.5 robust-z cutoff is used.
 * This is a visualization heuristic, NOT a sensor fault diagnosis. For strongly
 * curved or multimodal clouds it can flag legitimate operating conditions.
 */
export function residualOutliers(points, xKey, yKey, bins = 10) {
  const pairs = validPairs(points, xKey, yKey)
  const trend = medianTrend(pairs, 'x', 'y', bins)
  if (trend.length < 3 || pairs.length < 20) return { count: 0, indices: [], threshold: null }
  const predict = (x) => {
    // Extrapolate from the nearest TWO bin centers at the edges; otherwise
    // a perfectly linear trace is falsely flagged as an outlier at its ends.
    if (x <= trend[0].x) {
      const a = trend[0], b = trend[1]
      return a.y + (b.y - a.y) * ((x - a.x) / (b.x - a.x))
    }
    if (x >= trend.at(-1).x) {
      const a = trend.at(-2), b = trend.at(-1)
      return a.y + (b.y - a.y) * ((x - a.x) / (b.x - a.x))
    }
    let i = 0
    while (i + 1 < trend.length && trend[i + 1].x < x) i++
    const a = trend[i], b = trend[i + 1]
    return a.y + (b.y - a.y) * ((x - a.x) / (b.x - a.x))
  }
  const residuals = pairs.map(p => p.y - predict(p.x))
  const center = median(residuals)
  const mad = median(residuals.map(r => Math.abs(r - center)))
  if (mad == null || mad < 1e-12) return { count: 0, indices: [], threshold: null }
  const indices = []
  for (let i = 0; i < residuals.length; i++) {
    if (Math.abs(residuals[i] - center) / (1.4826 * mad) > 3.5) indices.push(i)
  }
  return { count: indices.length, indices, threshold: 3.5 }
}
