import TelemetryChart from './TelemetryChart'
import './TelemetryChartHolder.css'

function TelemetryChartHolder({ charts = [] }) {
  return (
    <div className="telemetry-chart-holder">
      {charts.length === 0 && <p className="telemetry-empty">No telemetry metrics are selected. Select a metric to show its chart.</p>}
      {charts.map((chart) => (
        <section className="telemetry-chart-card" key={chart.id}>
          <h2>{chart.title}</h2>
          <TelemetryChart
            data={chart.data}
            xKey={chart.xKey}
            yKey={chart.yKey}
            unit={chart.unit}
            color={chart.color}
            ariaLabel={chart.title}
          />
        </section>
      ))}
    </div>
  )
}

export default TelemetryChartHolder
