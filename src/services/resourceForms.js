// Field contracts verified against the backend's Create/Update OpenAPI schemas.
export const resourceDefinitions = [
  { id: 'cars', label: 'Cars', singular: 'car', endpoint: '/cars', idField: 'car_id', nameField: 'name', fields: [
    { name: 'name', label: 'Car name', required: true, maxLength: 100 },
    { name: 'year_created', label: 'Year created', type: 'number', required: true, min: 1886 },
    { name: 'team_id', label: 'Team', type: 'select', required: true, source: 'teams', sourceId: 'team_id', sourceLabel: 'team_name', responseLabel: 'teamName' },
  ] },
  { id: 'drivers', label: 'Drivers', singular: 'driver', endpoint: '/drivers', idField: 'driver_id', nameField: 'full_name', fields: [
    { name: 'first_name', label: 'First name', required: true, maxLength: 100 },
    { name: 'last_name', label: 'Last name', required: true, maxLength: 100 },
  ] },
  { id: 'locations', label: 'Locations', singular: 'location', endpoint: '/locations', idField: 'location_id', nameField: 'name', fields: [
    { name: 'name', label: 'Location name', required: true, maxLength: 200 },
    { name: 'address', label: 'Address', type: 'textarea', maxLength: 500 },
  ] },
  { id: 'teams', label: 'Teams', singular: 'team', endpoint: '/teams', idField: 'team_id', nameField: 'team_name', fields: [
    { name: 'team_name', label: 'Team name', required: true, maxLength: 100 },
  ] },
]

export function normalizeResource(tab, record) {
  return { ...record, id: record[tab.idField], ...(tab.id === 'drivers'
    ? { full_name: [record.first_name, record.last_name].filter(Boolean).join(' ') } : {}) }
}

export function resourceFormValues(tab, record, resources) {
  return Object.fromEntries(tab.fields.map((field) => {
    let value = record?.[field.name] ?? ''
    if (field.source && value === '' && record?.[field.responseLabel]) {
      const matches = resources[field.source].filter((item) => item[field.sourceLabel] === record[field.responseLabel])
      // The car read schema omits team_id. Never pick the first of duplicate names.
      if (matches.length === 1) value = matches[0][field.sourceId]
    }
    return [field.name, value === null ? '' : String(value)]
  }))
}

export function resourcePayload(tab, values, resources, initial = null) {
  const payload = {}
  for (const field of tab.fields) {
    const raw = String(values[field.name] ?? '').trim()
    const previous = initial == null ? null : String(initial[field.name] ?? '').trim()
    if (initial && raw === previous) continue
    if (!raw && field.required) throw new Error(`Enter a value for ${field.label.toLowerCase()}.`)
    if (field.maxLength && raw.length > field.maxLength) throw new Error(`${field.label} must be at most ${field.maxLength} characters.`)
    let value = raw || null
    if (field.type === 'number' || field.type === 'select') {
      value = Number(raw)
      if (!raw || !Number.isSafeInteger(value) || (field.min != null && value < field.min)) {
        throw new Error(`${field.label} must be a whole number${field.min != null ? ` of at least ${field.min}` : ''}.`)
      }
      if (field.source && !resources[field.source].some((item) => String(item[field.sourceId]) === raw)) {
        throw new Error(`Choose an existing ${field.label.toLowerCase()}.`)
      }
    }
    payload[field.name] = value
  }
  return payload
}

export function resourceFieldLabel(field, record, resources) {
  if (!field.source) return record[field.name] ?? '\u2014'
  return resources[field.source].find((item) => String(item[field.sourceId]) === String(record[field.name]))?.[field.sourceLabel]
    ?? record[field.responseLabel] ?? '\u2014'
}
