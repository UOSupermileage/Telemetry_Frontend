import trackCoordinates from '../data/sem_2023_us.csv?raw'
import { trackGeometry } from '../services/trackGeometry'
import './TrackOutline.css'

const readings = trackCoordinates.trim().split(/\r?\n/).slice(1).map((line) => {
  const [latitude, longitude] = line.split(',')
  return { latitude, longitude }
})
const geometry = trackGeometry(readings)

export default function TrackOutline() {
  return <section className="analysis-track" aria-label="Indianapolis track shape">
    <div className="section-caption"><span>TRACK SHAPE</span><span>Saved circuit / 2023</span></div>
    <div className="track-outline-heading">
      <h2>Indianapolis Motor Speedway</h2>
      <span>Shell Eco-marathon Americas</span>
    </div>
    <div className="track-outline-canvas">
      <svg viewBox="140 60 360 200" role="img" aria-label="Shell Eco-marathon Indianapolis 2023 course outline">
        <path d={geometry.path} transform="rotate(90 320 160)" fill="none" stroke="var(--trace-primary)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
    <div className="track-outline-footer"><span>3.85 km <span aria-hidden="true">/</span> 2,696 recorded track points</span><span>2023 course coordinates</span></div>
  </section>
}
