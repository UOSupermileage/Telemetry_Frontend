import { useId, useMemo } from 'react'
import { domain, pairedRegression, samplePoints, describeCorrelation } from '../services/scatterStatistics'
import { validPairs, spearmanCorrelation, medianTrend, regimeSummary, classifyRegime, REGIMES, residualOutliers } from '../services/scatterInsights'
import './ScatterChart.css'

const WIDTH = 790
const HEIGHT = 400
const MARGIN = { top: 26, right: 32, bottom: 60, left: 78 }
const TICKS = [0, .25, .5, .75, 1]
const regimeColor = Object.fromEntries(REGIMES.map(r => [r.key, r.color]))
const compact = value => Number(value.toPrecision(3)).toLocaleString('en-CA')
const fmtStat = value => value == null ? '—' : Number(value).toFixed(3)

/**
 * General XY scatter; X may repeat or go backwards, unlike time series.
 *
 * @param {object} props
 * @param {Array<{id:string|number,label:string,color?:string,points:object[]}>} props.series
 * @param {string} props.xKey - Numeric key such as speed_kmh (ALREADY normalized).
 * @param {string} props.yKey - Numeric key such as power_w (ALREADY normalized).
 * @param {string} [props.xLabel] - Human-readable axis label INCLUDING unit.
 * @param {string} [props.yLabel] - Human-readable axis label INCLUDING unit.
 * @param {boolean} [props.showTrendline] - Linear least-squares fit (Pearson context).
 * @param {boolean} [props.showMedianTrend] - Binned median curve (can show non-linearity).
 * @param {boolean} [props.showStatistics] - Pearson, Spearman, n and slope per group.
 * @param {boolean} [props.showRegimes] - Median quadrants; descriptive, NOT ML labels.
 * @param {boolean} [props.showOutlierCandidates] - Residual MAD heuristic overlay.
 * @param {'series'|'regime'} [props.colorMode='series'] - Color by run or quadrant.
 * @param {number} [props.maxPointsPerSeries=400] - Display cap only, never stats cap.
 *
 * @example
 * <ScatterChart series={[{ id: 1, label: 'Archive d_73', points: rows }]}
 *   xKey="speed_kmh" yKey="power_w" xLabel="Speed (km/h)" yLabel="Power (W)"
 *   showMedianTrend showStatistics showRegimes colorMode="regime" />
 */
export default function ScatterChart({
  series = [], xKey = 'x', yKey = 'y', xLabel = 'X', yLabel = 'Y',
  title = 'Relationship', pointRadius = 2.7, maxPointsPerSeries = 400,
  showTrendline = false, showMedianTrend = false, showStatistics = false,
  showRegimes = false, showOutlierCandidates = false, colorMode = 'series',
}) {
  const titleId = useId()
  const clipId = useId()
  const pw = WIDTH - MARGIN.left - MARGIN.right
  const ph = HEIGHT - MARGIN.top - MARGIN.bottom
  const radius = Number.isFinite(pointRadius) ? Math.max(1, Math.min(9, pointRadius)) : 2.7

  const cleaned = useMemo(() => series.map((run, index) => {
    // These samples are normalized display objects, not DB raw fields.
    const valid = validPairs(run.points, xKey, yKey)
    const outliers = residualOutliers(valid, 'x', 'y')
    const rendered = samplePoints(valid, maxPointsPerSeries)
    // Restrict each fitted line to that series' observed X range: no extrapolation.
    let xMin = Infinity, xMax = -Infinity
    for (const p of valid) { if (p.x < xMin) xMin = p.x; if (p.x > xMax) xMax = p.x }
    const flagged = new Set(outliers.indices.map(index => valid[index]))
    return {
      id: run.id ?? index,
      label: run.label ?? `Series ${index + 1}`,
      color: run.color ?? '#f47700',
      total: (run.points ?? []).length,
      valid, xMin, xMax,
      points: rendered,
      visibleOutliers: rendered.filter(p => flagged.has(p)),
      stats: pairedRegression(run.points, xKey, yKey),
      spearman: spearmanCorrelation(run.points, xKey, yKey),
      medianBins: medianTrend(valid, 'x', 'y'),
      outliers,
    }
  }), [series, xKey, yKey, maxPointsPerSeries])

  const allPoints = cleaned.flatMap(run => run.valid)
  const total = allPoints.length
  const thresholds = useMemo(() => regimeSummary(allPoints, 'x', 'y'), [cleaned])
  const [rawXmin, xmax] = domain(allPoints.map(p => p.x))
  const [rawYmin, ymax] = domain(allPoints.map(p => p.y))
  // 0 speed/power should not make the chart display impossible negative ticks
  // just because the plotting domain adds a 5% visual margin.
  const xmin = allPoints.length && allPoints.every(p => p.x >= 0) ? Math.max(0, rawXmin) : rawXmin
  const ymin = allPoints.length && allPoints.every(p => p.y >= 0) ? Math.max(0, rawYmin) : rawYmin
  const xx = value => MARGIN.left + (value - xmin) / (xmax - xmin) * pw
  const yy = value => MARGIN.top + ph - (value - ymin) / (ymax - ymin) * ph

  return <section className="plot-card" aria-label={title}>
    <div className="plot-heading"><h3>{title}</h3><span className="plot-subtitle">{total.toLocaleString()} valid pairs · {cleaned.reduce((s, r) => s + r.points.length, 0).toLocaleString()} plotted</span></div>
    {!total ? <p className="plot-empty">No valid numeric observations for this axis pair.</p> : <>
      <svg className="scatter-svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-labelledby={titleId}>
        <title id={titleId}>{title}: {xLabel} versus {yLabel}</title>
        <defs><clipPath id={clipId}><rect x={MARGIN.left} y={MARGIN.top} width={pw} height={ph} /></clipPath></defs>
        {TICKS.map(f => <g key={f} className="plot-grid">
          <line x1={MARGIN.left + f * pw} y1={MARGIN.top} x2={MARGIN.left + f * pw} y2={MARGIN.top + ph} />
          <line x1={MARGIN.left} y1={MARGIN.top + (1-f) * ph} x2={MARGIN.left + pw} y2={MARGIN.top + (1-f) * ph} />
          <text x={MARGIN.left + f * pw} y={MARGIN.top + ph + 22} textAnchor="middle">{compact(xmin+f*(xmax-xmin))}</text>
          <text x={MARGIN.left - 12} y={MARGIN.top + (1-f)*ph+4} textAnchor="end">{compact(ymin+f*(ymax-ymin))}</text>
        </g>)}
        <text className="plot-axis-label" x={MARGIN.left + pw/2} y={HEIGHT - 12} textAnchor="middle">{xLabel}</text>
        <text className="plot-axis-label" transform={`translate(20 ${MARGIN.top+ph/2}) rotate(-90)`} textAnchor="middle">{yLabel}</text>
        <g clipPath={`url(#${clipId})`}>
          {showRegimes && thresholds.available && <>
            <line x1={xx(thresholds.midX)} x2={xx(thresholds.midX)} y1={MARGIN.top} y2={MARGIN.top+ph} className="plot-regime-line" />
            <line x1={MARGIN.left} x2={MARGIN.left+pw} y1={yy(thresholds.midY)} y2={yy(thresholds.midY)} className="plot-regime-line" />
          </>}
          {showTrendline && cleaned.map(run => run.stats.slope == null ? null : <line key={`fit-${run.id}`}
            x1={xx(run.xMin)} y1={yy(run.stats.slope*run.xMin+run.stats.intercept)}
            x2={xx(run.xMax)} y2={yy(run.stats.slope*run.xMax+run.stats.intercept)}
            stroke={run.color} strokeWidth="2" strokeDasharray="7 5" />)}
          {showMedianTrend && cleaned.map(run => run.medianBins.length < 2 ? null : <polyline key={`bins-${run.id}`}
            points={run.medianBins.map(p => `${xx(p.x)},${yy(p.y)}`).join(' ')}
            fill="none" stroke={run.color} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />)}
          {cleaned.map(run => <g key={run.id}>
            {run.points.map((p, i) => {
              const regime = classifyRegime(p, thresholds)
              const dotColor = colorMode === 'regime' && regime ? regimeColor[regime] : run.color
              return <circle key={i} cx={xx(p.x)} cy={yy(p.y)} r={radius} fill={dotColor} fillOpacity="0.65">
                <title>{run.label}: {compact(p.x)} {xLabel}; {compact(p.y)} {yLabel}{regime ? `; ${regime}` : ''}</title>
              </circle>
            })}
          </g>)}
          {showOutlierCandidates && cleaned.map(run => run.visibleOutliers.map((p, index) => {
            return <circle key={`outlier-${run.id}-${index}`} cx={xx(p.x)} cy={yy(p.y)} r={radius+2.8}
              fill="none" stroke="#d62828" strokeWidth="1.7"><title>{run.label} · unusual residual candidate (not a verified fault)</title></circle>
          }))}
        </g>
      </svg>
      <div className="plot-legend" aria-label="Scatter colors">
        {(colorMode === 'regime' && thresholds.available ? REGIMES : cleaned.map(r => ({ key: r.id, title: `${r.label} (${r.points.length} plotted)`, color: r.color }))).map(item =>
          <span className="plot-legend-item" key={item.key}><i style={{ backgroundColor: item.color }} aria-hidden="true" />{item.title}</span>)}
      </div>
      {showStatistics && <div className="scatter-stats" aria-label="Exploratory correlations">
        <div className="scatter-summary">
          {cleaned.map(run => <div className="scatter-summary-row" key={run.id}>
            <span className="scatter-summary-name" title={run.label}><i style={{ backgroundColor: run.color }} aria-hidden="true" />{run.label}</span>
            <span title="Pearson linear correlation">Pearson <strong>{fmtStat(run.stats.r)}</strong></span>
            <span title="Spearman monotonic correlation">Spearman <strong>{fmtStat(run.spearman.rho)}</strong></span>
            <span className="scatter-summary-strength">{describeCorrelation(run.stats.r)}</span>
          </div>)}
        </div>
        <details className="scatter-details">
          <summary>Detailed statistics</summary>
          <div className="scatter-stats-scroll"><table>
            <thead><tr><th>Series</th><th>Valid / total</th><th>Pearson r</th><th>Spearman ρ</th><th>Linear R²</th><th>Slope (Y/X)</th><th>Pattern</th></tr></thead>
            <tbody>{cleaned.map(run => <tr key={run.id}><th scope="row">{run.label}</th><td>{run.stats.n}/{run.total}</td>
              <td>{fmtStat(run.stats.r)}</td><td>{fmtStat(run.spearman.rho)}</td><td>{fmtStat(run.stats.r2)}</td>
              <td>{fmtStat(run.stats.slope)}</td><td>{describeCorrelation(run.stats.r)}</td></tr>)}</tbody>
          </table></div>
          {showOutlierCandidates && <p className="scatter-stats-note">Unusual residual candidates (not verified faults): {cleaned.map(r => `${r.label}: ${r.outliers.count}`).join(' · ')}.</p>}
        </details>
      </div>}
      {showRegimes && <div className="scatter-regimes" aria-label="Relative operating regions">
        <div className="scatter-regimes-heading"><strong>Relative operating regions</strong><span>Based on the current selection's medians — not mechanical labels</span></div>
        {thresholds.available ? <div className="scatter-regime-grid">{REGIMES.map(r => <div key={r.key} className="scatter-regime-card">
          <i style={{backgroundColor:r.color}} aria-hidden="true"/><strong>{r.title}</strong>
          <span>{(100*thresholds.counts[r.key]/thresholds.n).toFixed(1)}%</span>
        </div>)}</div> : <p>At least four varying valid pairs are required.</p>}
      </div>}
    </>}
  </section>
}
