
import { useCallback, useEffect, useState } from 'react'
import {
  CarFront,
  UserRound,
  MapPin,
  Plus,
  X,
  LoaderCircle,
  RefreshCw,
  Trash2,
} from 'lucide-react'

import { apiFetch } from '../services/apiClient'
import { getRunEditorOptions } from '../services/runs'
import './ManagementPage.css'

const resourceTabs = [
  {
    id: 'cars',
    label: 'Cars',
    singular: 'car',
    icon: CarFront,
    endpoint: '/cars',
  },
  {
    id: 'drivers',
    label: 'Drivers',
    singular: 'driver',
    icon: UserRound,
    endpoint: '/drivers',
  },
  {
    id: 'locations',
    label: 'Locations',
    singular: 'location',
    icon: MapPin,
    endpoint: '/locations',
  },
]

function getResourceLists(options) {
  return {
    cars: options?.cars ?? [],
    drivers: options?.drivers ?? [],
    locations: options?.locations ?? [],
  }
}

function ManagementPage() {
  const [activeTab, setActiveTab] = useState('cars')
  const [resources, setResources] = useState({
    cars: [],
    drivers: [],
    locations: [],
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [resourceName, setResourceName] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const activeResource =
    resourceTabs.find((tab) => tab.id === activeTab) ?? resourceTabs[0]

  const activeItems = resources[activeTab] ?? []
  const ActiveIcon = activeResource.icon

  const loadResources = useCallback(async (signal) => {
    setIsLoading(true)
    setError('')

    try {
      const options = await getRunEditorOptions({ signal })

      if (signal?.aborted) return

      setResources(getResourceLists(options))
    } catch (err) {
      if (signal?.aborted) return

      setError(err.message || 'Could not load resources.')
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    loadResources(controller.signal)

    return () => controller.abort()
  }, [loadResources])

  const handleAddResource = async (event) => {
    event.preventDefault()

    const trimmedName = resourceName.trim()

    if (!trimmedName) {
      setError(`Enter a name for this ${activeResource.singular}.`)
      return
    }

    setIsSaving(true)
    setError('')
    setSuccessMessage('')

    try {
      await apiFetch(activeResource.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
        }),
      })

      setResourceName('')
      setIsAdding(false)

      setSuccessMessage(
        `${activeResource.singular[0].toUpperCase()}${activeResource.singular.slice(1)} added successfully.`,
      )

      await loadResources()
    } catch (err) {
      setError(
        err.message ||
          `Could not add this ${activeResource.singular}.`,
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteResource = async (resource) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${resource.name}"? This action cannot be undone.`,
    )

    if (!confirmed) return

    setDeletingId(resource.id)
    setError('')
    setSuccessMessage('')

    try {
      await apiFetch(
        `${activeResource.endpoint}/${encodeURIComponent(resource.id)}`,
        {
          method: 'DELETE',
        },
      )

      setSuccessMessage(
        `${activeResource.singular[0].toUpperCase()}${activeResource.singular.slice(1)} deleted successfully.`,
      )

      await loadResources()
    } catch (err) {
      setError(
        err.message ||
          `Could not delete this ${activeResource.singular}. It may be referenced by existing runs.`,
      )
    } finally {
      setDeletingId(null)
    }
  }

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setIsAdding(false)
    setResourceName('')
    setError('')
    setSuccessMessage('')
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
            Add and manage the cars, drivers, and locations used by your
            telemetry runs.
          </p>
        </div>

        <button
          type="button"
          className="management-refresh-button"
          onClick={handleRefresh}
          disabled={isLoading || isSaving || deletingId !== null}
        >
          {isLoading ? (
            <LoaderCircle
              size={16}
              className="management-spinner"
              aria-hidden="true"
            />
          ) : (
            <RefreshCw size={16} aria-hidden="true" />
          )}
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
              <span className="management-tab-count">
                {resources[tab.id].length}
              </span>
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
            <div className="management-resource-icon">
              <ActiveIcon size={20} aria-hidden="true" />
            </div>

            <div>
              <h2>{activeResource.label}</h2>
              <p>
                {activeItems.length}{' '}
                {activeItems.length === 1
                  ? activeResource.singular
                  : `${activeResource.singular}s`}
              </p>
            </div>
          </div>

          {!isAdding && (
            <button
              type="button"
              className="management-add-button"
              onClick={() => {
                setIsAdding(true)
                setError('')
                setSuccessMessage('')
              }}
              disabled={isSaving || deletingId !== null}
            >
              <Plus size={17} aria-hidden="true" />
              <span>Add {activeResource.singular}</span>
            </button>
          )}
        </div>

        {isAdding && (
          <form
            className="management-add-form"
            onSubmit={handleAddResource}
          >
            <div className="management-input-group">
              <label htmlFor="management-resource-name">
                {activeResource.singular[0].toUpperCase()}
                {activeResource.singular.slice(1)} name
              </label>

              <input
                id="management-resource-name"
                type="text"
                value={resourceName}
                onChange={(event) => setResourceName(event.target.value)}
                placeholder={`Enter ${activeResource.singular} name`}
                maxLength={120}
                autoFocus
                required
                disabled={isSaving}
              />
            </div>

            <div className="management-form-actions">
              <button
                type="button"
                className="management-cancel-button"
                onClick={() => {
                  setIsAdding(false)
                  setResourceName('')
                  setError('')
                }}
                disabled={isSaving}
              >
                <X size={16} aria-hidden="true" />
                Cancel
              </button>

              <button
                type="submit"
                className="management-add-button"
                disabled={isSaving || !resourceName.trim()}
              >
                {isSaving ? (
                  <LoaderCircle
                    size={16}
                    className="management-spinner"
                    aria-hidden="true"
                  />
                ) : (
                  <Plus size={16} aria-hidden="true" />
                )}
                {isSaving ? 'Adding…' : 'Add resource'}
              </button>
            </div>
          </form>
        )}

        {error && (
          <div className="management-alert management-alert-error" role="alert">
            {error}
          </div>
        )}

        {successMessage && (
          <div
            className="management-alert management-alert-success"
            role="status"
          >
            {successMessage}
          </div>
        )}

        <div className="management-table-card">
          {isLoading ? (
            <div className="management-loading">
              <LoaderCircle
                size={24}
                className="management-spinner"
                aria-hidden="true"
              />
              <span>Loading resources…</span>
            </div>
          ) : activeItems.length === 0 ? (
            <div className="management-empty-state">
              <div className="management-empty-icon">
                <ActiveIcon size={25} aria-hidden="true" />
              </div>

              <h3>No {activeResource.label.toLowerCase()} yet</h3>

              <p>
                Add your first {activeResource.singular} to make it available
                when creating or editing runs.
              </p>

              {!isAdding && (
                <button
                  type="button"
                  className="management-add-button"
                  onClick={() => setIsAdding(true)}
                >
                  <Plus size={17} aria-hidden="true" />
                  Add {activeResource.singular}
                </button>
              )}
            </div>
          ) : (
            <div className="management-table-wrapper">
              <table className="management-table">
                <thead>
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Name</th>
                    <th
                      scope="col"
                      className="management-actions-heading"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {activeItems.map((resource) => (
                    <tr key={resource.id}>
                      <td className="management-id-cell">{resource.id}</td>
                      <td className="management-name-cell">
                        {resource.name}
                      </td>
                      <td className="management-actions-cell">
                        <button
                          type="button"
                          className="management-delete-button"
                          onClick={() => handleDeleteResource(resource)}
                          disabled={
                            deletingId !== null ||
                            isSaving ||
                            isLoading
                          }
                          aria-label={`Delete ${resource.name}`}
                          title={`Delete ${resource.name}`}
                        >
                          {deletingId === resource.id ? (
                            <LoaderCircle
                              size={16}
                              className="management-spinner"
                              aria-hidden="true"
                            />
                          ) : (
                            <Trash2 size={16} aria-hidden="true" />
                          )}
                          <span>
                            {deletingId === resource.id
                              ? 'Deleting…'
                              : 'Delete'}
                          </span>
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
