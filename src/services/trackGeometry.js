// Local equirectangular projection keeps a circuit's proportions without map tiles.
export function trackGeometry(readings) {
  const points = readings.map((reading) => {
    const { latitude, longitude } = reading
    if (latitude == null || longitude == null || latitude === '' || longitude === '') return null
    const lat = Number(latitude), lon = Number(longitude)
    return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180
      && !(lat === 0 && lon === 0) ? [lon, lat] : null
  })
  const valid = points.filter(Boolean)
  if (valid.length < 2) return null
  const [originLon, originLat] = valid[0]
  const longitudeScale = Math.cos(originLat * Math.PI / 180)
  const projected = points.map((point) => point && [
    ((point[0] - originLon + 540) % 360 - 180) * longitudeScale,
    originLat - point[1],
  ])
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const point of projected) {
    if (!point) continue
    minX = Math.min(minX, point[0]); maxX = Math.max(maxX, point[0])
    minY = Math.min(minY, point[1]); maxY = Math.max(maxY, point[1])
  }
  const width = maxX - minX, height = maxY - minY
  if (width === 0 && height === 0) return null
  const scale = Math.min(width > 0 ? 592 / width : Infinity, height > 0 ? 272 / height : Infinity)
  const offsetX = (640 - width * scale) / 2, offsetY = (320 - height * scale) / 2
  let penDown = false, start
  const path = projected.map((point) => {
    if (!point) { penDown = false; return '' }
    const x = offsetX + (point[0] - minX) * scale
    const y = offsetY + (point[1] - minY) * scale
    start ??= [x, y]
    const command = `${penDown ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`
    penDown = true
    return command
  }).join(' ')
  return { path, start }
}
