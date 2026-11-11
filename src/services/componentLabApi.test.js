import { describe, expect, it, vi } from 'vitest'
import { getAppRunSamples, normalizeTelemetrySample } from './componentLabApi'

describe('Component Lab API normalization', () => {
  it('normalizes raw backend sensor units exactly once', () => {
    const original = { tick: 1200, speed: 25000, current: 1500, voltage: 48000, throttle: 100 }
    const result = normalizeTelemetrySample(original, 1000)
    expect(result).toEqual({
      elapsed_s: 0.2, speed_kmh: 25, current_a: 1.5, voltage_v: 48, throttle_pct: 10, power_w: 72,
    })
    expect(original.current).toBe(1500) // does not mutate API data
  })

  it('does not replace missing readings with a false zero', () => {
    const result = normalizeTelemetrySample({tick: 1200, speed: 0, current: null, voltage: 50000}, 1200)
    expect(result.speed_kmh).toBe(0)
    expect(result.current_a).toBeNull()
    expect(result.power_w).toBeNull()
    expect(result.throttle_pct).toBeNull()
  })

  it('calls the existing sampled, read-only telemetry endpoint', async () => {
    const fetcher = vi.fn().mockResolvedValue([
      { tick: 20000, speed: 14000, current: 2000, voltage: 46000, throttle: 200 },
      { tick: 21000, speed: 15000, current: 2100, voltage: 45900, throttle: 210 },
    ])
    const signal = new AbortController().signal
    const result = await getAppRunSamples(7, { fetcher, maxPoints: 300, signal })
    expect(fetcher).toHaveBeenCalledTimes(1)
    const [path, options] = fetcher.mock.calls[0]
    expect(path.startsWith('/telemetry/data?')).toBe(true)
    const query = new URLSearchParams(path.split('?')[1])
    expect(query.get('run_id')).toBe('7')
    expect(query.get('max_points')).toBe('300')
    expect(query.getAll('fields')).toEqual(['tick', 'speed', 'current', 'voltage', 'throttle'])
    expect(options.signal).toBe(signal)
    expect(result[0].elapsed_s).toBe(0)
    expect(result[1].elapsed_s).toBe(1)
    expect(result[0].power_w).toBe(92)
  })

  it('rejects malformed API responses', async () => {
    await expect(getAppRunSamples(1, {fetcher: async () => ({points: []})})).rejects.toThrow('array')
  })
})
