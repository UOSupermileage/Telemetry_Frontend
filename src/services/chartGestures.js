function validRange(min, span) {
  const width = Math.max(1, Math.min(1e12, span))
  const start = Math.max(0, min)
  return { min: start, max: start + width }
}

// Euclidean distance recognizes diagonal pinches, while only the time axis zooms.
export function gestureRange(range, initial, current, width) {
  const span = range.max - range.min
  const center = (points) => points.reduce((sum, point) => sum + point.x, 0) / points.length
  const distance = (points) => Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y)
  const ratio = initial.length > 1 && current.length > 1
    ? Math.max(1, distance(initial)) / Math.max(1, distance(current)) : 1
  const nextSpan = Math.max(1, Math.min(1e12, span * ratio))
  const min = range.min + center(initial) / width * span - center(current) / width * nextSpan
  return validRange(min, nextSpan)
}

export function wheelZoomRange(range, anchor, delta) {
  const span = range.max - range.min
  const nextSpan = Math.max(1, Math.min(1e12, span * Math.exp(Math.max(-1, Math.min(1, delta * 0.01)))))
  return validRange(range.min + anchor * (span - nextSpan), nextSpan)
}

// Attach to the stable React host, so incoming samples cannot interrupt a pinch.
export function bindChartGestures(element, { getPlot, onRange, onReset }) {
  const pointers = new Map()
  let initial = null
  let lastTap = null
  let moved = false
  const points = () => [...pointers.values()].slice(0, 2)
  const range = () => {
    const scale = getPlot()?.scales.x
    return scale?.min != null && scale.max > scale.min ? { min: scale.min, max: scale.max } : null
  }
  const rebase = () => {
    const plot = getPlot()
    const bounds = plot?.over.getBoundingClientRect()
    const current = range()
    initial = bounds?.width && current ? { range: current, points: points(), bounds } : null
  }
  const down = (event) => {
    if (pointers.size >= 2 || !event.target.closest('.u-over') || event.button > 0 || (event.pointerType === 'mouse' && event.shiftKey)) return
    event.preventDefault()
    event.stopPropagation()
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (pointers.size === 1) moved = false
    else { moved = true; lastTap = null }
    element.setPointerCapture(event.pointerId)
    rebase()
  }
  const move = (event) => {
    if (!pointers.has(event.pointerId) || !initial) return
    event.preventDefault()
    event.stopPropagation()
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const current = points()
    if (current.length !== initial.points.length) return
    if (!moved && Math.hypot(current[0].x - initial.points[0].x, current[0].y - initial.points[0].y) < 4) return
    moved = true
    const relative = (values) => values.map((point) => ({ x: point.x - initial.bounds.left, y: point.y }))
    onRange(gestureRange(initial.range, relative(initial.points), relative(current), initial.bounds.width))
  }
  const up = (event) => {
    if (!pointers.has(event.pointerId)) return
    pointers.delete(event.pointerId)
    if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId)
    if (pointers.size) rebase()
    else {
      if (!moved && event.type === 'pointerup' && event.pointerType !== 'mouse') {
        const now = performance.now()
        if (lastTap && now - lastTap.time < 350 && Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) < 25) {
          onReset(); lastTap = null
        } else lastTap = { time: now, x: event.clientX, y: event.clientY }
      }
      initial = null
    }
  }
  const wheel = (event) => {
    const plot = getPlot()
    const current = range()
    if (!plot || !current) return
    const bounds = plot.over.getBoundingClientRect()
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) return
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault()
      onRange(wheelZoomRange(current, Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)), event.deltaY))
    } else if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey) {
      event.preventDefault()
      const delta = event.deltaX || event.deltaY
      onRange(validRange(current.min + delta / bounds.width * (current.max - current.min), current.max - current.min))
    }
  }
  element.addEventListener('pointerdown', down, true)
  element.addEventListener('pointermove', move, true)
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) element.addEventListener(type, up)
  element.addEventListener('wheel', wheel, { passive: false })
  return () => {
    element.removeEventListener('pointerdown', down, true)
    element.removeEventListener('pointermove', move, true)
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) element.removeEventListener(type, up)
    element.removeEventListener('wheel', wheel)
    for (const id of pointers.keys()) if (element.hasPointerCapture(id)) element.releasePointerCapture(id)
    pointers.clear()
  }
}
