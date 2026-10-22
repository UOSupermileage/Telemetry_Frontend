import { useCallback, useEffect, useState } from 'react'
import {
  CarFront,
  UserRound,
  MapPin,
  UsersRound,
  Plus,
  X,
  LoaderCircle,
  RefreshCw,
  Trash2,
  Pencil,
  Check,
} from 'lucide-react'

import { apiFetch } from '../services/apiClient'
import './ManagementPage.css'

const resourceTabs = [
  {
    id: 'cars',
    label: 'Cars',
    singular: 'car',
    icon: CarFront,
    endpoint: '/cars',
    idField: 'car_id',
    nameField: 'name',
    fields: [{ name: 'name', label: 'Car name', required: true }],
  },
  {
    id: 'drivers',
    label: 'Drivers',
    singular: 'driver',
    icon: UserRound,
    endpoint: '/drivers',
    idField: 'driver_id',
    nameField: 'full_name',
    fields: [
      { name: 'first_name', label: 'First name', required: true },
      { name: 'last_name', label: 'Last name', required: true },
    ],
  },
  {
    id: 'locations',
    label: 'Locations',
    singular: 'location',
    icon: MapPin,
    endpoint: '/locations',
    idField: 'location_id',
    nameField: 'name',
    fields: [
      { name: 'name', label: 'Location name', required: true },
      { name: 'address', label: 'Address', required: false },
    ],
  },
  {
    id: 'teams',
    label: 'Teams',
    singular: 'team',
    icon: UsersRound,
    endpoint: '/teams',
    idField: 'team_id',
    nameField: 'team_name',
    fields: [{ name: 'team_name', label: 'Team name', required: true }],
  },
]

const emptyResources = { cars: [], drivers: [], locations: [], teams: [] }

function normalizeResource(tab, record) {
  const id = record[tab.idField]
  if (tab.id === 'drivers') {
    return {
      ...record,
      id,
      full_name: record.full_name ?? [record.first_name, record.last_name].filter(Boolean).join(' '),
    }
  }
  return { ...record, id }
}

function getDisplayName(tab, resource) {
  return resource[tab.nameField] || resource.name || `#${resource.id}`
}

function getInitialForm(tab, resource = null) {
  return Object.fromEntries(tab.fields.map((field) => [field.name, resource?.[field.name] ?? '']))
}

function ManagementPage() {
  const [activeTab, setActiveTab] = useState('cars')
  const [resources, setResources] = useState(emptyResources)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingResource, setEditingResource] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [formValues, setFormValues] = useState({})
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const activeResource = resourceTabs.find((tab) => tab.id === activeTab) ?? resourceTabs[0]
  const activeItems = resources[activeTab] ?? []
  const ActiveIcon = activeResource.icon

  const loadResources = useCallback(async (signal) => {
    setIsLoading(true)
    setError('')
    try {
      const entries = await Promise.all(
        resourceTabs.map(async (tab) => {
          const records = await apiFetch(tab.endpoint, { signal })
          if (!Array.isArray(records)) {
            throw new Error(`The ${tab.label.toLowerCase()} response must be an array.`)
          }
          return [tab.id, records.map((record) => normalizeResource(tab, record))]
        }),
      )
      if (!signal?.aborted) setResources(Object.fromEntries(entries))
    } catch (err) {
      if (!signal?.aborted) setError(err.message || 'Could not load resources.')
    } finally {
      if (!signal?.aborted) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadResources(controller.signal)
    return () => controller.abort()
  }, [loadResources])

  const resetForm = () => {
    setIsAdding(false)
    setEditingResource(null)
    setFormValues({})
  }

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    resetForm()
    setError('')
    setSuccessMessage('')
  }

  const startAdding = () => {
    setFormValues(getInitialForm(activeResource))
    setIsAdding(true)
    setEditingResource(null)
    setError('')
    setSuccessMessage('')
  }

  const startEditing = (resource) => {
    setFormValues(getInitialForm(activeResource, resource))
    setEditingResource(resource)
    setIsAdding(false)
    setError('')
    setSuccessMessage('')
  }

  const handleSaveResource = async (event) => {
    event.preventDefault()
    const payload = Object.fromEntries(
      activeResource.fields.map((field) => [
        field.name,
        typeof formValues[field.name] === 'string' ? formValues[field.name].trim() : formValues[field.name],
      ]),
    )

    const missingField = activeResource.fields.find((field) => field.required && !payload[field.name])
    if (missingField) {
      setError(`Enter a value for ${missingField.label.toLowerCase()}.`)
      return
    }

    setIsSaving(true)
    setError('')
    setSuccessMessage('')
    const isEditing = Boolean(editingResource)
    try {
      const endpoint = isEditing
        ? `${activeResource.endpoint}/${encodeURIComponent(editingResource.id)}`
        : activeResource.endpoint
      await apiFetch(endpoint, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      resetForm()
      setSuccessMessage(
        `${activeResource.singular[0].toUpperCase()}${activeResource.singular.slice(1)} ${isEditing ? 'updated' : 'added'} successfully.`,
      )
      await loadResources()
    } catch (err) {
      setError(err.message || `Could not ${isEditing ? 'update' : 'add'} this ${activeResource.singular}.`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteResource = async (resource) => {
    const displayName = getDisplayName(activeResource, resource)
    if (!window.confirm(`Are you sure you want to delete "${displayName}"? This action cannot be undone.`)) return

    setDeletingId(resource.id)
    setError('')
    setSuccessMessage('')
    try {
      await apiFetch(`${activeResource.endpoint}/${encodeURIComponent(resource.id)}`, { method: 'DELETE' })
      setSuccessMessage(`${activeResource.singular[0].toUpperCase()}${activeResource.singular.slice(1)} deleted successfully.`)
      await loadResources()
    } catch (err) {
      setError(err.message || `Could not delete this ${activeResource.singular}. It may be referenced by existing runs.`)
    } finally {
      setDeletingId(null)
    }
  }

  const handleRefresh = async () => {
    setSuccessMessage('')
    await loadResources()
  }

  return (
    <section className="management-page">
      <div className="management-toolbar">
        <div className="management-toolbar-copy">
          <p className="management-description">
            Add, edit, and manage the cars, drivers, locations, and teams used by your telemetry runs.
          </p>
        </div>
        <button
          type="button"
          className="management-refresh-button"
          onClick={handleRefresh}
          disabled={isLoading || isSaving || deletingId !== null}
        >
          {isLoading ? <LoaderCircle size={16} className="management-spinner" aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}
          <span>Refresh</span>
        </button>
      </div>

      <div className="management-tabs" role="tablist" aria-label="Resources">
        {resourceTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              id={`management-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="management-resource-panel"
              className={`management-tab${isActive ? ' active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{tab.label}</span>
              <span className="management-tab-count">{resources[tab.id].length}</span>
            </button>
          )
        })}
      </div>

      <div
        id="management-resource-panel"
        className="management-resource-panel"
        role="tabpanel"
        aria-labelledby={`management-tab-${activeTab}`}
      >
        <div className="management-panel-header">
          <div className="management-panel-heading">
            <div className="management-resource-icon"><ActiveIcon size={20} aria-hidden="true" /></div>
            <div>
              <h2>{activeResource.label}</h2>
              <p>{activeItems.length} {activeItems.length === 1 ? activeResource.singular : `${activeResource.singular}s`}</p>
            </div>
          </div>
          {!isAdding && !editingResource && (
            <button type="button" className="management-add-button" onClick={startAdding} disabled={isSaving || deletingId !== null}>
              <Plus size={17} aria-hidden="true" />
              <span>Add {activeResource.singular}</span>
            </button>
          )}
        </div>

        {(isAdding || editingResource) && (
          <form className="management-add-form" onSubmit={handleSaveResource}>
            {activeResource.fields.map((field) => (
              <div className="management-input-group" key={field.name}>
                <label htmlFor={`management-${activeTab}-${field.name}`}>{field.label}</label>
                <input
                  id={`management-${activeTab}-${field.name}`}
                  type="text"
                  value={formValues[field.name] ?? ''}
                  onChange={(event) => setFormValues((current) => ({ ...current, [field.name]: event.target.value }))}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  maxLength={120}
                  autoFocus={field === activeResource.fields[0]}
                  required={field.required}
                  disabled={isSaving}
                />
              </div>
            ))}
            <div className="management-form-actions">
              <button type="button" className="management-cancel-button" onClick={resetForm} disabled={isSaving}>
                <X size={16} aria-hidden="true" /> Cancel
              </button>
              <button type="submit" className="management-add-button" disabled={isSaving}>
                {isSaving ? <LoaderCircle size={16} className="management-spinner" aria-hidden="true" /> : editingResource ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
                {isSaving ? 'Saving…' : editingResource ? 'Save changes' : `Add ${activeResource.singular}`}
              </button>
            </div>
          </form>
        )}

        {error && <div className="management-alert management-alert-error" role="alert">{error}</div>}
        {successMessage && <div className="management-alert management-alert-success" role="status">{successMessage}</div>}

        <div className="management-table-card">
          {isLoading ? (
            <div className="management-loading">
              <LoaderCircle size={24} className="management-spinner" aria-hidden="true" />
              <span>Loading resources…</span>
            </div>
          ) : activeItems.length === 0 ? (
            <div className="management-empty-state">
              <div className="management-empty-icon"><ActiveIcon size={25} aria-hidden="true" /></div>
              <h3>No {activeResource.label.toLowerCase()} yet</h3>
              <p>Add your first {activeResource.singular} to make it available when creating or editing runs.</p>
              {!isAdding && !editingResource && (
                <button type="button" className="management-add-button" onClick={startAdding}>
                  <Plus size={17} aria-hidden="true" /> Add {activeResource.singular}
                </button>
              )}
            </div>
          ) : (
            <div className="management-table-wrapper">
              <table className="management-table">
                <thead>
                  <tr>
                    <th scope="col">ID</th>
                    {activeResource.fields.map((field) => <th scope="col" key={field.name}>{field.label}</th>)}
                    <th scope="col" className="management-actions-heading">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeItems.map((resource) => (
                    <tr key={resource.id}>
                      <td className="management-id-cell">{resource.id}</td>
                      {activeResource.fields.map((field) => (
                        <td className="management-name-cell" key={field.name}>
                          {field.name === 'full_name' ? resource.full_name : (resource[field.name] || '—')}
                        </td>
                      ))}
                      <td className="management-actions-cell">
                        <button
                          type="button"
                          className="management-cancel-button"
                          onClick={() => startEditing(resource)}
                          disabled={deletingId !== null || isSaving || isLoading}
                          aria-label={`Edit ${getDisplayName(activeResource, resource)}`}
                          title={`Edit ${getDisplayName(activeResource, resource)}`}
                        >
                          <Pencil size={16} aria-hidden="true" /> <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          className="management-delete-button"
                          onClick={() => handleDeleteResource(resource)}
                          disabled={deletingId !== null || isSaving || isLoading}
                          aria-label={`Delete ${getDisplayName(activeResource, resource)}`}
                          title={`Delete ${getDisplayName(activeResource, resource)}`}
                        >
                          {deletingId === resource.id ? <LoaderCircle size={16} className="management-spinner" aria-hidden="true" /> : <Trash2 size={16} aria-hidden="true" />}
                          <span>{deletingId === resource.id ? 'Deleting…' : 'Delete'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default ManagementPage
