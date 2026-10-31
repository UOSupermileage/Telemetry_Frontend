import TelemetryChart from './TelemetryChart'
import SampledTelemetryChart from './SampledTelemetryChart'
import './TelemetryChartHolder.css'

function TelemetryChartHolder({ charts = [], visibleRange, onRangeChange, onOverview }) {
  return (
    <div className="telemetry-chart-holder">
      {charts.length === 0 && <p className="telemetry-empty">No telemetry metrics are selected. Select a metric to show its chart.</p>}
      {charts.map((chart) => (
        <section className="telemetry-chart-card" key={chart.id}>
          <header className="telemetry-chart-heading">
            <span className="telemetry-chart-indicator" style={{ backgroundColor: chart.color }} aria-hidden="true" />
            <h2>{chart.title}</h2>
            <span className="telemetry-chart-unit">{chart.unit}</span>
          </header>
          {!chart.sampled && chart.series?.length > 1 && <div className="telemetry-chart-legend" aria-label="Compared runs">
            {chart.series.map((series) => <span key={series.id}>
              <i style={{ backgroundColor: series.color }} aria-hidden="true" />{series.label}
            </span>)}
          </div>}
          {chart.sampled ? <SampledTelemetryChart key={chart.series.map((item) => item.id).join(':')} chart={chart} visibleRange={visibleRange} onRangeChange={onRangeChange} onOverview={onOverview} /> : <TelemetryChart
            data={chart.data}
            series={chart.series}
            xKey={chart.xKey}
            yKey={chart.yKey}
            unit={chart.unit}
            color={chart.color}
            height={220}
            ariaLabel={chart.title}
          />}
        </section>
      ))}
    </div>
  )
}

export default TelemetryChartHolder
