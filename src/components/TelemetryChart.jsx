
import { useEffect, useMemo, useRef, useState } from 'react'
import uPlot from 'uplot'
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
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  const containerElement = useRef(null)
  const chartElement = useRef(null)
  const tooltipElement = useRef(null)
  const chart = useRef(null)

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

      return xValues.map((value) => values.get(value) ?? null)
    }),
    [plotSeries, xKey, xValues, yKey],
  )

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
    if (!chartElement.current || !xValues.length) {
      return undefined
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
              maximumFractionDigits: 2,
            })
          : value

      const values = plotSeries
        .map((item, seriesIndex) => {
          const value = plot.data[seriesIndex + 1][index]

          return value == null
            ? null
            : `${item.label}: ${formatValue(value)}${
                unit ? ` ${unit}` : ''
              }`
        })
        .filter(Boolean)

      if (!values.length) {
        tooltip.hidden = true
        return
      }

      tooltip.textContent =
        `${xKey}: ${formatValue(xValue)} | ${values.join(' | ')}`

      tooltip.hidden = false

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

    chart.current = new uPlot(
      {
        width: chartElement.current.clientWidth,
        height: chartHeight,
        padding: [18, 12, 0, 0],
        cursor: {
          drag: { x: false, y: false },
          focus: { prox: 30 },
        },
        legend: { show: false },
        scales: {
          x: { time: false },
          y: { auto: true },
        },
        axes: [
          {
            stroke: '#969496',
            grid: { show: false },
            ticks: { show: false },
            font: '11px system-ui',
            label: xKey,
            labelFont: '11px system-ui',
          },
          {
            stroke: '#969496',
            grid: { stroke: '#eeeae7', width: 1 },
            ticks: { show: false },
            font: '11px system-ui',
            size: 54,
            values: (_plot, ticks) =>
              ticks.map((value) =>
                unit
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
            width: 2.5,
            spanGaps: false,
            points: {
              show: plotSeries.length === 1,
              size: 5,
              fill: '#fff',
              stroke: item.color,
              width: 2,
            },
          })),
        ],
        hooks: {
          setCursor: [updateTooltip],
        },
      },
      [xValues, ...yValues],
      chartElement.current,
    )

    const observer = new ResizeObserver(([entry]) => {
      chart.current?.setSize({
        width: entry.contentRect.width,
        height: chartHeight,
      })
    })

    observer.observe(chartElement.current)

    return () => {
      observer.disconnect()
      chart.current?.destroy()
      chart.current = null
    }
  }, [
    chartHeight,
    plotSeries,
    unit,
    xKey,
    xValues,
    yValues,
  ])

  
  if (!xValues.length) {
    return (
      <div
        className="telemetry-chart-empty"
        style={{ minHeight: height }}
      >
        No chart data available.
      </div>
    )
  }

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
        onClick={!isExpanded ? () => setIsExpanded(true) : undefined}
        role={!isExpanded ? 'button' : undefined}
        tabIndex={!isExpanded ? 0 : undefined}
        aria-label={!isExpanded ? 'Expand chart' : undefined}
        onKeyDown={(event) => {
          if (
            !isExpanded &&
            (event.key === 'Enter' || event.key === ' ')
          ) {
            event.preventDefault()
            setIsExpanded(true)
          }
        }}
      >
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

        <div
          className="telemetry-chart"
          ref={chartElement}
          style={{ height: chartHeight }}
          role="img"
          aria-label={ariaLabel ?? `${yKey} chart`}
        />

        <div
          className="telemetry-chart-tooltip"
          ref={tooltipElement}
          hidden
        />
      </div>
    </>
  )

}

export default TelemetryChart
