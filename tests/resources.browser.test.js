import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import process from 'node:process'
import { setTimeout as pause } from 'node:timers/promises'
import { chromium } from 'playwright'

test('resource editors persist the API fields and relationships to the right endpoints', { timeout: 60000 }, async () => {
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5185', '--strictPort'], { stdio: 'ignore', windowsHide: true })
  let browser
  try {
    let ready = false
    for (let index = 0; index < 80; index++) {
      try { ready = (await fetch('http://127.0.0.1:5185')).ok } catch { /* Wait for Vite. */ }
      if (ready) break
      await pause(100)
    }
    assert.equal(ready, true)
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    const records = {
      cars: [{ car_id: 7, name: 'Sharkira', year_created: 2024, teamName: 'UOSM' }],
      drivers: [{ driver_id: 12, first_name: 'Simon', last_name: 'Vezina' }],
      locations: [{ location_id: 3, name: 'Speedway', address: 'Old address' }],
      teams: Array.from({ length: 501 }, (_, index) => ({ team_id: index + 1, team_name: index === 0 ? 'UOSM' : `Team ${index + 1}` })),
    }
    const writes = []
    const reads = []
    let failSave = false
    let releaseSave
    let holdSave = false
    await page.route('**/api/**', async (route) => {
      const request = route.request(), url = new URL(request.url())
      const [, , kind, id] = url.pathname.split('/')
      if (!records[kind]) return route.fulfill({ status: 404, json: { detail: 'Not found' } })
      if (request.method() === 'GET') {
        reads.push(url.pathname + url.search)
        const offset = Number(url.searchParams.get('offset') ?? 0)
        const limit = Number(url.searchParams.get('limit') ?? 100)
        return route.fulfill({ json: records[kind].slice(offset, offset + limit) })
      }
      const body = request.postDataJSON()
      writes.push({ path: url.pathname, method: request.method(), body })
      if (holdSave) await new Promise((resolve) => { releaseSave = resolve })
      if (failSave) return route.fulfill({ status: 422, json: { detail: [{ msg: 'Rejected test update' }] } })
      const idField = { cars: 'car_id', drivers: 'driver_id', locations: 'location_id', teams: 'team_id' }[kind]
      const record = request.method() === 'POST' ? { [idField]: 99 } : records[kind].find((item) => String(item[idField]) === id)
      Object.assign(record, body)
      if (kind === 'cars' && body.team_id != null) {
        record.teamName = records.teams.find((team) => team.team_id === body.team_id).team_name
        delete record.team_id // Match the API's response schema, which returns only teamName.
      }
      if (request.method() === 'POST') records[kind].push(record)
      return route.fulfill({ json: record })
    })
    await page.goto('http://127.0.0.1:5185/#management')
    await page.getByRole('button', { name: 'Edit Sharkira', exact: true }).waitFor()
    assert.ok(reads.includes('/api/teams?offset=500&limit=500'), 'all dropdown pages are loaded')
    await page.getByRole('button', { name: 'Edit Sharkira', exact: true }).click()
    let dialog = page.getByRole('dialog')
    assert.equal(await dialog.getByLabel('Year created', { exact: false }).inputValue(), '2024')
    assert.equal(await dialog.getByLabel('Team', { exact: false }).inputValue(), '1')
    assert.equal(await dialog.locator('input[name="car_id"]').count(), 0)
    await dialog.getByLabel('Car name', { exact: false }).fill('Sharkira II')
    await dialog.getByLabel('Year created', { exact: false }).fill('2025')
    await dialog.getByLabel('Team', { exact: false }).selectOption('501')
    await dialog.getByRole('button', { name: 'Save changes' }).click()
    await page.getByRole('button', { name: 'Edit Sharkira II', exact: true }).waitFor()
    assert.deepEqual(writes.at(-1), { path: '/api/cars/7', method: 'PATCH', body: { name: 'Sharkira II', year_created: 2025, team_id: 501 } })
    assert.match(await page.locator('.management-table').innerText(), /Team 501/)
    await page.getByRole('button', { name: 'Edit Sharkira II', exact: true }).click()
    assert.equal(await page.getByLabel('Team', { exact: false }).inputValue(), '501')
    const count = writes.length
    await page.getByRole('button', { name: 'Save changes' }).click()
    assert.equal(writes.length, count, 'unchanged forms do not write')

    await page.getByRole('tab', { name: /Drivers/ }).click()
    await page.getByRole('button', { name: 'Edit Simon Vezina', exact: true }).click()
    await page.getByLabel('First name', { exact: false }).fill('Alex')
    await page.getByRole('button', { name: 'Save changes' }).click()
    await page.getByRole('button', { name: 'Edit Alex Vezina', exact: true }).waitFor()
    assert.deepEqual(writes.at(-1), { path: '/api/drivers/12', method: 'PATCH', body: { first_name: 'Alex' } })

    await page.getByRole('tab', { name: /Locations/ }).click()
    await page.getByRole('button', { name: 'Edit Speedway', exact: true }).click()
    assert.equal(await page.getByLabel('Location name', { exact: false }).getAttribute('maxlength'), '200')
    assert.equal(await page.getByLabel('Address', { exact: true }).getAttribute('maxlength'), '500')
    await page.getByLabel('Address', { exact: true }).fill('')
    await page.getByRole('button', { name: 'Save changes' }).click()
    await page.getByRole('button', { name: 'Edit Speedway', exact: true }).waitFor()
    assert.deepEqual(writes.at(-1), { path: '/api/locations/3', method: 'PATCH', body: { address: null } })

    await page.getByRole('tab', { name: /Teams/ }).click()
    await page.getByRole('button', { name: 'Edit UOSM', exact: true }).click()
    await page.getByLabel('Team name', { exact: false }).fill('UOSM Racing')
    failSave = true
    await page.getByRole('button', { name: 'Save changes' }).click()
    await page.getByRole('dialog').getByRole('alert').waitFor()
    assert.match(await page.getByRole('dialog').innerText(), /Rejected test update/)
    assert.equal(await page.getByLabel('Team name', { exact: false }).inputValue(), 'UOSM Racing')
    failSave = false; holdSave = true
    await page.getByRole('button', { name: 'Save changes' }).click()
    await page.getByRole('button', { name: 'Saving...' }).waitFor()
    assert.equal(await page.getByRole('button', { name: 'Close resource editor' }).isDisabled(), true)
    releaseSave(); holdSave = false
    await page.getByRole('button', { name: 'Edit UOSM Racing', exact: true }).waitFor()
    assert.deepEqual(writes.at(-1), { path: '/api/teams/1', method: 'PATCH', body: { team_name: 'UOSM Racing' } })

    await page.getByRole('tab', { name: /Cars/ }).click()
    await page.getByRole('button', { name: 'Add car', exact: true }).click()
    dialog = page.getByRole('dialog')
    await dialog.getByLabel('Car name', { exact: false }).fill('New car')
    await dialog.getByLabel('Year created', { exact: false }).fill('2026')
    await dialog.getByLabel('Team', { exact: false }).selectOption('1')
    await dialog.getByRole('button', { name: 'Add car', exact: true }).click()
    await page.getByRole('button', { name: 'Edit New car', exact: true }).waitFor()
    assert.deepEqual(writes.at(-1), { path: '/api/cars', method: 'POST', body: { name: 'New car', year_created: 2026, team_id: 1 } })
    await page.getByRole('button', { name: 'Edit New car', exact: true }).click()
    await page.getByLabel('Car name', { exact: false }).fill('Discarded')
    page.once('dialog', (confirmation) => confirmation.accept())
    await page.getByRole('button', { name: 'Cancel', exact: true }).click()
    assert.equal(writes.at(-1).method, 'POST', 'cancel never saves changes')
    assert.deepEqual(errors, [])
  } finally {
    await browser?.close()
    server.kill()
  }
})
