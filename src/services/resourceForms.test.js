import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeResource, resourceDefinitions, resourceFormValues, resourcePayload, resourceFieldLabel } from './resourceForms.js'

const definition = (id) => resourceDefinitions.find((item) => item.id === id)
const resources = { teams: [{ team_id: 1, team_name: 'UOSM' }, { team_id: 2, team_name: 'Test team' }] }

test('car form resolves API team names and sends typed, changed fields only', () => {
  const car = { car_id: 7, name: 'Sharkira', year_created: 2024, teamName: 'UOSM' }
  const initial = resourceFormValues(definition('cars'), car, resources)
  assert.equal(initial.team_id, '1')
  assert.deepEqual(resourcePayload(definition('cars'), { ...initial, year_created: '2025', team_id: '2', car_id: '999' }, resources, initial), { year_created: 2025, team_id: 2 })
  assert.deepEqual(resourcePayload(definition('cars'), initial, resources, initial), {})
})

test('missing or ambiguous team names are never silently reassigned', () => {
  const duplicateTeams = { teams: [...resources.teams, { team_id: 3, team_name: 'UOSM' }] }
  const initial = resourceFormValues(definition('cars'), { name: 'Car', year_created: 2024, teamName: 'UOSM' }, duplicateTeams)
  assert.equal(initial.team_id, '')
  assert.deepEqual(resourcePayload(definition('cars'), { ...initial, name: 'Renamed' }, duplicateTeams, initial), { name: 'Renamed' })
  const explicit = resourceFormValues(definition('cars'), { team_id: 3, teamName: 'UOSM' }, duplicateTeams)
  assert.equal(explicit.team_id, '3')
})

test('creation enforces required car fields, year bounds, and valid foreign keys', () => {
  const values = { name: ' New car ', year_created: '2026', team_id: '1' }
  assert.deepEqual(resourcePayload(definition('cars'), values, resources), { name: 'New car', year_created: 2026, team_id: 1 })
  assert.throws(() => resourcePayload(definition('cars'), { ...values, year_created: '1885' }, resources), /1886/)
  assert.throws(() => resourcePayload(definition('cars'), { ...values, year_created: '2024.5' }, resources), /whole number/)
  assert.throws(() => resourcePayload(definition('cars'), { ...values, team_id: '999' }, resources), /existing team/)
  assert.throws(() => resourcePayload(definition('cars'), { ...values, team_id: '' }, resources), /team/)
})

test('API-specific string limits and nullable addresses are respected', () => {
  const location = definition('locations')
  const initial = { name: 'Track', address: 'Old address' }
  assert.deepEqual(resourcePayload(location, { ...initial, address: '' }, resources, initial), { address: null })
  assert.deepEqual(resourcePayload(location, { name: 'x'.repeat(200), address: 'a'.repeat(500) }, resources), { name: 'x'.repeat(200), address: 'a'.repeat(500) })
  assert.throws(() => resourcePayload(location, { name: 'x'.repeat(201) }, resources), /200/)
  assert.throws(() => resourcePayload(definition('drivers'), { first_name: 'x'.repeat(101), last_name: 'Driver' }, resources), /100/)
  assert.throws(() => resourcePayload(definition('teams'), { team_name: '  ' }, resources), /team name/)
})

test('resource labels use API names and reflect edited driver names', () => {
  assert.equal(normalizeResource(definition('drivers'), { driver_id: 1, full_name: 'Old name', first_name: 'New', last_name: 'Name' }).full_name, 'New Name')
  assert.equal(resourceFieldLabel(definition('cars').fields[2], { teamName: 'UOSM' }, resources), 'UOSM')
  assert.equal(resourceFieldLabel(definition('cars').fields[2], { team_id: 2 }, resources), 'Test team')
})
