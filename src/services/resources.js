import { apiFetch } from './apiClient'
import { normalizeResource, resourceDefinitions } from './resourceForms'

export async function getResources({ signal } = {}) {
  const entries = await Promise.all(resourceDefinitions.map(async (definition) => {
    const records = []
    let offset = 0
    let page
    do {
      page = await apiFetch(`${definition.endpoint}?offset=${offset}&limit=500`, { signal })
      if (!Array.isArray(page)) throw new Error(`The ${definition.label.toLowerCase()} response must be an array.`)
      records.push(...page.map((record) => normalizeResource(definition, record)))
      offset += page.length
    } while (page.length === 500)
    return [definition.id, records]
  }))
  return Object.fromEntries(entries)
}
