
import { useEffect, useMemo, useRef, useState } from 'react'
import uPlot from 'uplot'
import { Maximize2 } from 'lucide-react'
import { bindChartGestures, wheelZoomRange } from '../services/chartGestures'
import 'uplot/dist/uPlot.min.css'
import './TelemetryChart.css'

const emptyData = []
const emptySeries = []

function TelemetryChart({
  data = emptyData,
  series = emptySeries,
  xKey = 'tick',
  yKey = 'value',
  unit = '',
  color = '#6657a5',
  height = 270,
  ariaLabel,
  onRangeChange,
  visibleRange = null,
  sharedControls = false,
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme ?? 'light')

  const containerElement = useRef(null)
  const chartElement = useRef(null)
  const tooltipElement = useRef(null)
  const chart = useRef(null)
  const viewport = useRef(visibleRange)
  const overview = useRef(null)

  const changeRange = (range) => {
    viewport.current = range
    const bounds = range ?? overview.current
    if (bounds && chart.current) chart.current.setScale('x', bounds)
    onRangeChange?.(range)
  }

  const pan = (direction) => {
    const scale = chart.current?.scales.x
    if (scale?.min == null || scale?.max == null) return
    const width = scale.max - scale.min
    const min = Math.max(0, scale.min + direction * width * 0.5)
    changeRange({ min, max: min + width })
  }

  const points = data ?? emptyData
  const chartHeight = isExpanded ? Math.max(height, 500) : height

  const plotSeries = useMemo(
    () => series.length
      ? series
      : [{ data: points, label: yKey, color }],
    [color, points, series, yKey],
  )

  const xValues = useMemo(
    () => [
      ...new Set(
        plotSeries.flatMap(({ data: seriesData }) =>
          seriesData.map((point) => point[xKey]),
        ),
      ),
    ].sort((a, b) => a - b),
    [plotSeries, xKey],
  )

  const yValues = useMemo(
    () => plotSeries.map(({ data: seriesData }) => {
      const values = new Map(
        seriesData.map((point) => [
          point[xKey],
          point[yKey] ?? null,
        ]),
      )

      // uPlot skips undefined alignment slots but keeps explicit null sensor gaps.
      return xValues.map((value) => values.get(value))
    }),
    [plotSeries, xKey, xValues, yKey],
  )

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(document.documentElement.dataset.theme ?? 'light'))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  // Close the expanded chart with Escape.
  useEffect(() => {
    if (!isExpanded) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsExpanded(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isExpanded])

  // Create and resize the uPlot chart.
  useEffect(() => {
    if (!chartElement.current) {
      return undefined
    }
    if (tooltipElement.current) tooltipElement.current.hidden = true

    if (!viewport.current && xValues.length) {
      overview.current = { min: xValues[0], max: xValues.at(-1) }
    }
    const updateTooltip = (plot) => {
      const tooltip = tooltipElement.current
      const index = plot.cursor.idx

      if (!tooltip || index == null) {
        if (tooltip) tooltip.hidden = true
        return
      }

      const xValue = plot.data[0][index]

      if (xValue == null) {
        tooltip.hidden = true
        return
      }

      const formatValue = (value) =>
        typeof value === 'number'
          ? value.toLocaleString(undefined, {
              maximumFractionDigits: 3,
            })
          : value

      const values = plotSeries
        .map((item, seriesIndex) => {
          const value = plot.data[seriesIndex + 1][index]

          return value == null
            ? null
            : `${sharedControls ? (seriesIndex === 0 ? 'A' : 'B') : item.label}: ${formatValue(value)}${
                unit ? ` ${unit}` : ''
              }`
        })
        .filter(Boolean)

      if (!values.length) {
        tooltip.hidden = true
        return
      }

      tooltip.textContent =
        `${sharedControls ? `${formatValue(xValue)} ms` : `${xKey === 'tick' ? 'Tick (ms since boot)' : xKey}: ${formatValue(xValue)}`} | ${values.join(' | ')}`

      tooltip.hidden = false

      if (sharedControls && !isExpanded) {
        tooltip.style.left = '120px'
        tooltip.style.top = '-26px'
        return
      }

      const containerRect =
        containerElement.current.getBoundingClientRect()
      const plotRect = plot.over.getBoundingClientRect()

      const left =
        plotRect.left -
        containerRect.left +
        plot.cursor.left +
        12

      const top =
        plotRect.top -
        containerRect.top +
        plot.cursor.top -
        tooltip.offsetHeight -
        10

      tooltip.style.left = `${
        Math.max(
          0,
          Math.min(left, containerRect.width - tooltip.offsetWidth),
        )
      }px`

      tooltip.style.top = `${Math.max(0, top)}px`
    }

    const styles = getComputedStyle(chartElement.current)
    const axisColor = styles.getPropertyValue('--body').trim() || '#666366'
    const gridColor = styles.getPropertyValue('--border').trim() || '#e4e1df'

    chart.current = new uPlot(
      {
        width: chartElement.current.clientWidth,
        height: chartHeight,
        padding: [8, 12, 0, 0],
        cursor: {
          y: !sharedControls,
          drag: { x: Boolean(onRangeChange), y: false, setScale: false, dist: 5 },
          focus: { prox: 30 },
          ...(sharedControls ? { sync: { key: 'uosm-analysis', scales: ['x', null], setSeries: false,
            filters: { pub: (type) => type === 'mousemove' || type === 'mouseleave' } } } : {}),
        },
        legend: { show: false },
        scales: {
          x: { time: false, range: (_plot, min, max) => viewport.current ? [viewport.current.min, viewport.current.max] : [min ?? 0, max == null || max === min ? (min ?? 0) + 1 : max] },
          y: { auto: true },
        },
        axes: [
          {
            stroke: axisColor,
            grid: { show: true, stroke: gridColor, width: 1 },
            ticks: { show: false },
            font: '10px ui-monospace, Consolas, monospace',
            label: sharedControls ? undefined : xKey === 'tick' ? 'Tick (ms since boot)' : xKey,
            size: sharedControls ? 28 : 42,
            space: 85,
            labelFont: '11px system-ui',
          },
          {
            stroke: axisColor,
            grid: { stroke: gridColor, width: 1 },
            ticks: { show: false },
            font: '10px ui-monospace, Consolas, monospace',
            size: 62,
            values: (_plot, ticks) =>
              ticks.map((value) =>
                sharedControls
                  ? Number(value).toLocaleString(undefined, { maximumFractionDigits: 6 })
                  : unit
                  ? `${Number(value).toFixed(1)} ${unit}`
                  : Number(value).toFixed(1),
              ),
          },
        ],
        series: [
          {},
          ...plotSeries.map((item) => ({
            label: item.label,
            stroke: item.color,
            width: 1.5,
            dash: item.dash,
            spanGaps: false,
            points: {
              show: false,
              size: 5,
              fill: '#fff',
              stroke: item.color,
              width: 2,
            },
          })),
        ],
        hooks: {
          setCursor: [updateTooltip],
          setSelect: [(plot) => {
            if (!onRangeChange || plot.select.width < 5) return
            const min = plot.posToVal(plot.select.left, 'x')
            const max = plot.posToVal(plot.select.left + plot.select.width, 'x')
            if (Number.isFinite(min) && Number.isFinite(max) && max > min) {
              viewport.current = { min, max }
              plot.setScale('x', { min, max })
              plot.setSelect({ left: 0, top: 0, width: 0, height: 0 }, false)
              onRangeChange({ min, max })
            }
          }],
        },
      },
      [xValues, ...yValues],
      chartElement.current,
    )

    // Override uPlot's built-in double-click reset so reset also reloads overview.
    const resetZoom = (event) => {
      if (!onRangeChange) return
      event.preventDefault()
      event.stopImmediatePropagation()
      viewport.current = null
      if (overview.current) chart.current.setScale('x', overview.current)
      onRangeChange(null)
    }
    chart.current.over.addEventListener('dblclick', resetZoom, true)

    const observer = new ResizeObserver(([entry]) => {
      chart.current?.setSize({
        width: entry.contentRect.width,
        height: chartHeight,
      })
    })

    observer.observe(chartElement.current)

    return () => {
      observer.disconnect()
      chart.current?.over.removeEventListener('dblclick', resetZoom, true)
      chart.current?.destroy()
      chart.current = null
    }
  }, [
    chartHeight,
    onRangeChange,
    sharedControls,
    isExpanded,
    theme,
    plotSeries,
    unit,
    xKey,
    xValues,
    yValues,
  ])

  useEffect(() => {
    if (!sharedControls) return
    viewport.current = visibleRange
    const next = visibleRange ?? overview.current
    if (next && next.max > next.min) chart.current?.setScale('x', next)
  }, [sharedControls, visibleRange])

  useEffect(() => {
    if (!sharedControls || !onRangeChange || !chartElement.current) return undefined
    return bindChartGestures(chartElement.current, {
      getPlot: () => chart.current,
      onRange: (range) => {
        viewport.current = range
        chart.current?.setScale('x', range)
        onRangeChange(range)
      },
      onReset: () => {
        viewport.current = null
        if (overview.current) chart.current?.setScale('x', overview.current)
        onRangeChange(null)
      },
    })
  }, [sharedControls, onRangeChange])

  return (
    <>
      {isExpanded && (
  <div
    className="telemetry-chart-modal"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        setIsExpanded(false)
      }
    }}
    aria-hidden="true"
  />
)}

      <div
        className={[
          'telemetry-chart-container',
          'telemetry-chart-clickable',
          isExpanded ? 'telemetry-chart-modal-content' : '',
        ].filter(Boolean).join(' ')}
        ref={containerElement}
        onClick={!isExpanded && !onRangeChange ? () => setIsExpanded(true) : undefined}
        role={isExpanded ? 'dialog' : sharedControls ? 'group' : !onRangeChange ? 'button' : undefined}
        aria-modal={isExpanded ? true : undefined}
        tabIndex={!isExpanded ? 0 : undefined}
        aria-label={isExpanded ? `${ariaLabel ?? yKey} chart` : sharedControls ? `${ariaLabel ?? yKey} interactive chart` : !onRangeChange ? 'Expand chart' : undefined}
        onKeyDown={(event) => {
          if (event.target === event.currentTarget && sharedControls) {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
              event.preventDefault(); pan(event.key === 'ArrowLeft' ? -1 : 1); return
            }
            if (event.key === 'Home' || event.key === '0') {
              event.preventDefault(); changeRange(null); return
            }
            if (event.key === '+' || event.key === '=' || event.key === '-') {
              const scale = chart.current?.scales.x
              if (scale?.min != null && scale.max > scale.min) {
                event.preventDefault()
                changeRange(wheelZoomRange(scale, 0.5, event.key === '-' ? 20 : -20))
              }
              return
            }
          }
          if (
            event.target === event.currentTarget && !isExpanded &&
            (event.key === 'Enter' || event.key === ' ')
          ) {
            event.preventDefault()
            setIsExpanded(true)
          }
        }}
      >
        {sharedControls && !isExpanded && <button className="trace-expand" type="button" aria-label={`Expand ${ariaLabel ?? yKey} chart`}
          title="Expand channel" onClick={() => setIsExpanded(true)}><Maximize2 size={13} /></button>}
        {onRangeChange && !sharedControls && <div className="telemetry-chart-controls" onClick={(event) => event.stopPropagation()}>
          <button type="button" onClick={() => pan(-1)} aria-label="Pan earlier">Earlier</button>
          <button type="button" onClick={() => pan(1)} aria-label="Pan later">Later</button>
          <button type="button" onClick={() => changeRange(null)}>Reset zoom</button>
          {!isExpanded && <button type="button" onClick={() => setIsExpanded(true)}>Expand chart</button>}
        </div>}
        {isExpanded && (
          <>
            <div className="telemetry-chart-modal-header">
              <h2>{ariaLabel ?? `${yKey} chart`}</h2>

              <button
                type="button"
                className="telemetry-chart-close"
                aria-label="Close expanded chart"
                onClick={(event) => {
                  event.stopPropagation()
                  setIsExpanded(false)
                }}
              >
                &times;
              </button>
            </div>

            <p className="telemetry-chart-modal-hint">
              Press Escape or click outside the chart to close.
            </p>
          </>
        )}

        {!xValues.length && !onRangeChange && <p className="telemetry-chart-empty">No chart data available.</p>}
        <div
          className="telemetry-chart"
          ref={chartElement}
          style={{ height: chartHeight }}
          role="img"
          aria-label={ariaLabel ?? `${yKey} chart`}
        />

        <div
          className={`telemetry-chart-tooltip${sharedControls && !isExpanded ? ' trace-readout' : ''}`}
          ref={tooltipElement}
          hidden
        />
      </div>
    </>
  )

}

export default TelemetryChart
