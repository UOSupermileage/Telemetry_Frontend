import { useCallback, useEffect, useState } from 'react'
import {
  CarFront,
  UserRound,
  MapPin,
  UsersRound,
  Plus,
  LoaderCircle,
  RefreshCw,
  Trash2,
  Pencil,
} from 'lucide-react'

import { apiFetch } from '../services/apiClient'
import { getResources } from '../services/resources'
import './ManagementPage.css'
import ResourceEditor from '../components/ResourceEditor'
import TrackOutline from '../components/TrackOutline'
import { normalizeResource, resourceDefinitions, resourceFieldLabel } from '../services/resourceForms'

const resourceIcons = { cars: CarFront, drivers: UserRound, locations: MapPin, teams: UsersRound }
const resourceTabs = resourceDefinitions.map((tab) => ({ ...tab, icon: resourceIcons[tab.id] }))

const emptyResources = { cars: [], drivers: [], locations: [], teams: [] }

function getDisplayName(tab, resource) {
  return resource[tab.nameField] || resource.name || `#${resource.id}`
}

function ManagementPage() {
  const [activeTab, setActiveTab] = useState('cars')
  const [resources, setResources] = useState(emptyResources)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingResource, setEditingResource] = useState(null)
  const [selectedLocationId, setSelectedLocationId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const activeResource = resourceTabs.find((tab) => tab.id === activeTab) ?? resourceTabs[0]
  const activeItems = resources[activeTab] ?? []
  const ActiveIcon = activeResource.icon
  const selectedLocation = activeTab === 'locations'
    ? activeItems.find((item) => item.id === selectedLocationId) : null
  const hasIndianapolisTrack = selectedLocation && /indianapolis|\bindy\b|\bims\b/i.test(selectedLocation.name)

  const loadResources = useCallback(async (signal) => {
    setIsLoading(true)
    setError('')
    try {
      const result = await getResources({ signal })
      if (!signal?.aborted) setResources(result)
    } catch (err) {
      if (!signal?.aborted) setError(err.message || 'Could not load resources.')
    } finally {
      if (!signal?.aborted) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    getResources({ signal: controller.signal }).then((result) => {
      if (!controller.signal.aborted) setResources(result)
    }).catch((loadError) => {
      if (!controller.signal.aborted) setError(loadError.message || 'Could not load resources.')
    }).finally(() => {
      if (!controller.signal.aborted) setIsLoading(false)
    })
    return () => controller.abort()
  }, [])

  const resetForm = () => {
    setIsAdding(false)
    setEditingResource(null)
  }

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setSelectedLocationId(null)
    resetForm()
    setError('')
    setSuccessMessage('')
  }

  const startAdding = () => {
    setIsAdding(true)
    setEditingResource(null)
    setError('')
    setSuccessMessage('')
  }

  const startEditing = (resource) => {
    setEditingResource(resource)
    setIsAdding(false)
    setError('')
    setSuccessMessage('')
  }

  const handleSaveResource = async (payload) => {
    setIsSaving(true)
    setError('')
    setSuccessMessage('')
    const isEditing = Boolean(editingResource)
    try {
      const endpoint = isEditing
        ? `${activeResource.endpoint}/${encodeURIComponent(editingResource.id)}`
        : activeResource.endpoint
      const saved = await apiFetch(endpoint, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (saved) setResources((current) => ({ ...current, [activeTab]: isEditing
        ? current[activeTab].map((item) => item.id === editingResource.id ? normalizeResource(activeResource, { ...item, ...saved }) : item)
        : [...current[activeTab], normalizeResource(activeResource, saved)] }))
      resetForm()
      setSuccessMessage(
        `${activeResource.singular[0].toUpperCase()}${activeResource.singular.slice(1)} ${isEditing ? 'updated' : 'added'} successfully.`,
      )
      await loadResources()
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
              disabled={isSaving}
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
            <button type="button" className="management-add-button" onClick={startAdding} disabled={isLoading || isSaving || deletingId !== null}>
              <Plus size={17} aria-hidden="true" />
              <span>Add {activeResource.singular}</span>
            </button>
          )}
        </div>

        {(isAdding || editingResource) && <ResourceEditor
          definition={activeResource} resource={editingResource} resources={resources}
          onSave={handleSaveResource} onClose={resetForm} isSaving={isSaving} />}

        {error && <div className="management-alert management-alert-error" role="alert">{error}</div>}
        {successMessage && <div className="management-alert management-alert-success" role="status">{successMessage}</div>}

        {selectedLocation && <section id="location-details" className="location-details" aria-label={`${selectedLocation.name} details`}>
          <div className="location-details-heading"><div><h3>{selectedLocation.name}</h3>
            <p>{selectedLocation.address || 'No address provided'}</p></div>
            <button type="button" className="management-cancel-button" onClick={() => setSelectedLocationId(null)}>Close details</button>
          </div>
          {hasIndianapolisTrack ? <TrackOutline /> : <p className="location-track-empty">No track outline available for this location.</p>}
        </section>}

        <div className="management-table-card">
          {isLoading ? (
            <div className="management-loading">
              <LoaderCircle size={24} className="management-spinner" aria-hidden="true" />
              <span>Loading resources...</span>
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
                          {activeTab === 'locations' && field.name === 'name'
                            ? <button type="button" className="location-details-link" aria-expanded={selectedLocationId === resource.id}
                              aria-controls="location-details" onClick={() => setSelectedLocationId((current) => current === resource.id ? null : resource.id)}>
                              {resourceFieldLabel(field, resource, resources)}
                            </button> : resourceFieldLabel(field, resource, resources)}
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
                          <span>{deletingId === resource.id ? 'Deleting...' : 'Delete'}</span>
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
