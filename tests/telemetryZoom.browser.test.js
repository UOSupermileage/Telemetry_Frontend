import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import process from 'node:process'
import { setTimeout as pause } from 'node:timers/promises'
import { chromium } from 'playwright'

test('sampled charts preserve zoom, pan, reset, loading data, and handle empty/error ranges', { timeout: 60000 }, async () => {
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5184', '--strictPort'], { stdio: 'ignore', windowsHide: true })
  let browser
  try {
    let ready = false
    for (let attempt = 0; attempt < 80; attempt++) {
      try { ready = (await fetch('http://127.0.0.1:5184')).ok } catch { /* Wait for Vite. */ }
      if (ready) break
      await pause(100)
    }
    assert.equal(ready, true, 'Vite test server starts')
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport: { width: 1400, height: 1100 } })
    const queries = []
    const errors = []
    let analyticsCalls = 0
    let mode = 'normal'
    let release
    page.on('pageerror', (error) => errors.push(error.message))
    await page.route('**/api/**', async (route) => {
      const url = new URL(route.request().url())
      const query = url.searchParams
      if (url.pathname === '/api/runs') {
        return route.fulfill({ json: [
          { run_id: 4, name: 'Run four', started_at: '2026-04-18T10:00:00Z' },
          { run_id: 5, name: 'Run five', started_at: '2026-04-17T10:00:00Z' },
          ...Array.from({ length: 6 }, (_, index) => ({ run_id: index + 10, name: `Archived run ${index}`, started_at: '2026-04-10T10:00:00Z' })),
        ] })
      }
      if (url.pathname.startsWith('/api/analytics/')) {
        analyticsCalls++
        return route.fulfill({ json: { max_speed: 9650, average_speed: 6000, duration_seconds: 120, telemetry_points: 20000 } })
      }
      if (url.pathname !== '/api/telemetry/data') return route.fulfill({ json: [] })
      queries.push(new URLSearchParams(query))
      const responseMode = mode
      mode = 'normal'
      if (responseMode === 'hold') await new Promise((resolve) => { release = resolve })
      if (responseMode === 'empty') return route.fulfill({ status: 404, json: { detail: 'No matching readings' } })
      if (responseMode === 'error') return route.fulfill({ status: 500, json: { detail: 'Database unavailable' } })
      const min = Number(query.get('start_tick') ?? 10000)
      const max = Number(query.get('end_tick') ?? 110000)
      const field = query.get('fields')
      return route.fulfill({ json: Array.from({ length: 80 }, (_, index) => ({
        tick: Math.round(min + (max - min) * index / 79),
        [field]: index === 20 ? null : { speed: 9650, throttle: 423, current: 116, voltage: 53400 }[field],
      })) })
    })
    await page.goto('http://127.0.0.1:5184/#analysis?run=4')
    const card = page.locator('.telemetry-chart-card').first()
    const waitLoaded = async () => {
      await card.locator('.u-over').waitFor()
      await page.waitForFunction(() => !document.querySelector('.telemetry-chart-card [role="status"]'))
      await pause(100)
    }
    await waitLoaded()
    assert.equal(queries.length, 4)
    await page.locator('.selected-run-card').click()
    const menuBox = await page.locator('.run-options').boundingBox()
    const timebarBox = await page.locator('.analysis-timebar').boundingBox()
    const overlap = { x: Math.max(menuBox.x, timebarBox.x) + 12, y: Math.max(menuBox.y, timebarBox.y) + 8 }
    assert.ok(overlap.y < Math.min(menuBox.y + menuBox.height, timebarBox.y + timebarBox.height), 'fixture overlaps dropdown and time banner')
    assert.equal(await page.evaluate(({ x, y }) => Boolean(document.elementFromPoint(x, y)?.closest('.run-options')), overlap), true, 'run dropdown paints above the sticky time banner')
    await page.locator('.selected-run-card').click()
    assert.equal(await page.locator('.trace-toolbar').count(), 0, 'standalone channel section is removed')
    for (const query of queries) {
      assert.equal(query.get('run_id'), '4')
      assert.equal(query.get('max_points'), '800')
      assert.equal(query.has('limit'), false)
      assert.equal(query.has('offset'), false)
    }
    assert.match(await page.locator('.single-run-summary').innerText(), /9.65 km\/h/)
    const zoom = async () => {
      const box = await card.locator('.u-over').boundingBox()
      await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.5)
      await page.keyboard.down('Shift')
      await page.mouse.down()
      await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.5, { steps: 10 })
      await page.mouse.up()
      await page.keyboard.up('Shift')
      await pause(400)
      await waitLoaded()
      return queries.at(-1)
    }
    const panPlot = async () => {
      const box = await card.locator('.u-over').boundingBox()
      await page.mouse.move(box.x + box.width * .7, box.y + box.height * .5)
      await page.mouse.down()
      await page.mouse.move(box.x + box.width * .5, box.y + box.height * .5, { steps: 5 })
      await page.mouse.up()
    }
    const cards = page.locator('.telemetry-chart-card')
    const firstCard = await cards.nth(0).boundingBox()
    const secondCard = await cards.nth(1).boundingBox()
    assert.ok(secondCard.y - firstCard.y - firstCard.height >= 15, 'graphs have visible gaps')
    assert.equal(await page.getByRole('button', { name: 'Pan later' }).count(), 0, 'gestures replace pan buttons')
    const plotBeforeHover = await card.locator('.u-over').boundingBox()
    await page.mouse.move(plotBeforeHover.x + plotBeforeHover.width * 0.4, plotBeforeHover.y + plotBeforeHover.height * 0.4)
    await pause(150)
    assert.equal(await page.locator('.trace-readout:not([hidden])').count(), 4, 'cursor readouts synchronize across channels')
    assert.equal((await card.locator('.u-over').boundingBox()).height, plotBeforeHover.height, 'cursor readouts do not move chart layout')
    assert.equal(queries.length, 4, 'cursor movements never refetch chart data')
    const firstZoom = await zoom()
    const sharedQueries = queries.slice(-4)
    assert.equal(new Set(sharedQueries.map((query) => query.get('start_tick'))).size, 1)
    assert.equal(new Set(sharedQueries.map((query) => query.get('end_tick'))).size, 1)
    assert.deepEqual(sharedQueries.map((query) => query.get('fields')).sort(), ['current', 'speed', 'throttle', 'voltage'])
    const secondZoom = await zoom()
    const width = (query) => Number(query.get('end_tick')) - Number(query.get('start_tick'))
    assert.ok(width(firstZoom) > 49000 && width(firstZoom) < 51000)
    assert.ok(width(secondZoom) > 24000 && width(secondZoom) < 26000, 'replacement samples retain viewport')
    await panPlot()
    await pause(400)
    await waitLoaded()
    const pan = queries.at(-1)
    assert.ok(Number(pan.get('start_tick')) > Number(secondZoom.get('start_tick')))
    assert.ok(Math.abs(width(pan) - width(secondZoom)) <= 2)
    await page.getByRole('button', { name: 'Reset zoom', exact: true }).click()
    await pause(400)
    await waitLoaded()
    assert.equal(queries.at(-1).has('start_tick'), false)
    assert.equal(queries.at(-1).has('end_tick'), false)
    const afterReset = queries.length
    await pause(500)
    assert.equal(queries.length, afterReset, 'programmatic updates do not trigger requests')
    await page.locator('.exact-range summary').click()
    await page.getByLabel('Start tick', { exact: true }).fill('20000')
    await page.getByLabel('End tick', { exact: true }).fill('30000')
    await page.getByRole('button', { name: 'Apply range', exact: true }).click()
    await pause(400)
    await waitLoaded()
    for (const query of queries.slice(-4)) {
      assert.equal(query.get('start_tick'), '20000')
      assert.equal(query.get('end_tick'), '30000')
    }
    await page.getByRole('button', { name: 'Reset zoom', exact: true }).click()
    await pause(400)
    await waitLoaded()
    await page.locator('.exact-range summary').click()
    mode = 'hold' 
    await panPlot()
    await pause(350)
    assert.match(await card.innerText(), /Loading samples/)
    assert.equal(await card.locator('canvas').count(), 1, 'existing plot stays mounted while fetching')
    release()
    await waitLoaded()
    mode = 'error'
    await panPlot()
    await card.getByRole('alert').waitFor()
    assert.match(await card.innerText(), /Database unavailable/)
    assert.equal(await card.locator('canvas').count(), 1)
    mode = 'empty'
    await panPlot()
    await card.getByText(/No readings in this range/).waitFor()
    await page.getByRole('button', { name: 'Reset zoom', exact: true }).click()
    await pause(400)
    await waitLoaded()
    assert.equal(analyticsCalls, 1, 'viewport requests do not replace run-wide analytics')
    const beforeHide = queries.length
    await page.locator('.trace-visibility summary').click()
    await page.getByRole('checkbox', { name: 'Speed', exact: true }).uncheck()
    await pause(300)
    assert.equal(queries.length, beforeHide)
    await page.getByRole('checkbox', { name: 'Speed', exact: true }).check()
    await page.locator('.trace-visibility summary').click()
    await pause(400)
    await waitLoaded()
    assert.equal(queries.at(-1).get('fields'), 'speed')
    assert.equal(queries.at(-1).has('start_tick'), false)
    await page.locator('#compare-run').selectOption('5')
    await pause(500)
    await waitLoaded()
    assert.ok(queries.some((query) => query.get('run_id') === '5'))
    assert.match(await page.locator('.trace-instructions').innerText(), /B \/ Reference/)
    assert.equal(await page.locator('.analysis-statistics tbody tr').count(), 2)
    await page.locator('#compare-run').selectOption('')
    await pause(500)
    await waitLoaded()
    await card.locator('.u-over').scrollIntoViewIfNeeded()
    const touch = await page.context().newCDPSession(page)
    await touch.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 })
    const touchBox = await card.locator('.u-over').boundingBox()
    const touchPoints = (spread) => [
      { id: 1, x: touchBox.x + touchBox.width * (.5 - spread), y: touchBox.y + touchBox.height * (.5 - spread) },
      { id: 2, x: touchBox.x + touchBox.width * (.5 + spread), y: touchBox.y + touchBox.height * (.5 + spread) },
    ]
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: touchPoints(.1) })
    for (const spread of [.13, .16, .19, .22, .25]) {
      await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: touchPoints(spread) })
    }
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await pause(450)
    await waitLoaded()
    assert.ok(width(queries.at(-1)) > 39500 && width(queries.at(-1)) < 40500, 'diagonal two-finger pinch zooms the actual chart')
    const tap = { id: 1, x: touchBox.x + touchBox.width / 2, y: touchBox.y + touchBox.height / 2 }
    for (let index = 0; index < 2; index++) {
      await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [tap] })
      await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      await pause(50)
    }
    await pause(400)
    await waitLoaded()
    assert.equal(queries.at(-1).has('start_tick'), false, 'double tap restores the overview')
    await touch.send('Emulation.setTouchEmulationEnabled', { enabled: false })
    const wheelBox = await card.locator('.u-over').boundingBox()
    await card.locator('.u-over').dispatchEvent('wheel', { clientX: wheelBox.x + wheelBox.width / 2, clientY: wheelBox.y + wheelBox.height / 2, deltaY: -40, ctrlKey: true })
    await pause(400)
    await waitLoaded()
    assert.ok(width(queries.at(-1)) < 100000, 'trackpad pinch zooms the chart')
    const countBeforeExpand = queries.length
    await page.getByRole('button', { name: 'Expand Speed chart', exact: true }).click()
    await page.getByRole('button', { name: 'Close expanded chart' }).click()
    await pause(300)
    assert.equal(queries.length, countBeforeExpand, 'expansion does not refetch samples')
    await page.evaluate(() => { document.documentElement.dataset.theme = 'dark' })
    await pause(100)
    await page.setViewportSize({ width: 390, height: 844 })
    await pause(150)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'mobile layout does not overflow')
    assert.deepEqual(errors, [])
  } finally {
    await browser?.close()
    server.kill()
  }
})
