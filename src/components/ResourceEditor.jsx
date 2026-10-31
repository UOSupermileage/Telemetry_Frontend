import { useCallback, useEffect, useRef, useState } from 'react'
import { LoaderCircle, X } from 'lucide-react'
import { resourceFormValues, resourcePayload } from '../services/resourceForms'
import './ImportPopup.css'

export default function ResourceEditor({ definition, resource, resources, onSave, onClose, isSaving }) {
  const [initial] = useState(() => resourceFormValues(definition, resource, resources))
  const [values, setValues] = useState(initial)
  const [error, setError] = useState('')
  const dialog = useRef(null)
  const closing = useRef(null)
  const editing = Boolean(resource)
  const dirty = JSON.stringify(values) !== JSON.stringify(initial)
  const close = useCallback(() => {
    if (isSaving) return
    if (dirty && !window.confirm('Discard your unsaved resource changes?')) return
    onClose()
  }, [dirty, isSaving, onClose])
  useEffect(() => { closing.current = close }, [close])
  useEffect(() => {
    const opener = document.activeElement
    dialog.current?.querySelector('input, select, textarea')?.focus()
    const keyboard = (event) => {
      if (event.key === 'Escape') closing.current?.()
      if (event.key !== 'Tab') return
      const controls = [...dialog.current.querySelectorAll('button, input, select, textarea')].filter((item) => !item.disabled)
      const first = controls[0], last = controls.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', keyboard)
    return () => { document.removeEventListener('keydown', keyboard); opener?.focus?.() }
  }, [])

  return <div className="import-overlay" onClick={close}>
    <div ref={dialog} className="import-modal resource-editor" role="dialog" aria-modal="true" aria-labelledby="resource-editor-title" onClick={(event) => event.stopPropagation()}>
      <div className="modal-header"><div>
        <h2 id="resource-editor-title">{editing ? 'Edit' : 'Add'} {definition.singular}</h2>
        <p>{editing ? `Update ${definition.singular} #${resource.id}.` : `Create a ${definition.singular} for your telemetry runs.`}</p>
      </div><button className="close-btn" type="button" onClick={close} disabled={isSaving} aria-label="Close resource editor"><X size={18} /></button></div>
      <form onSubmit={async (event) => {
        event.preventDefault(); setError('')
        try {
          const payload = resourcePayload(definition, values, resources, editing ? initial : null)
          if (editing && Object.keys(payload).length === 0) { onClose(); return }
          await onSave(payload)
        } catch (saveError) { setError(saveError.message || 'Could not save this resource.') }
      }}>
        <div className="form-grid">
          {definition.fields.map((field) => {
            const id = `resource-${definition.id}-${field.name}`
            const change = (event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))
            const unresolved = editing && field.source && initial[field.name] === ''
            const common = { id, name: field.name, value: values[field.name] ?? '', onChange: change,
              disabled: isSaving, required: field.required && !unresolved }
            return <div className={`field${field.type === 'textarea' || field.name === 'name' || definition.fields.length === 1 ? ' full-width' : ''}`} key={field.name}>
              <label htmlFor={id}>{field.label}{field.required && !unresolved ? ' *' : ''}</label>
              {field.type === 'select' ? <select {...common}>
                <option value="">{unresolved ? `Current: ${resource[field.responseLabel] || 'Unknown'} (unchanged)` : `Choose ${field.label.toLowerCase()}`}</option>
                {resources[field.source].map((item) => <option key={item[field.sourceId]} value={item[field.sourceId]}>{item[field.sourceLabel]} (#{item[field.sourceId]})</option>)}
              </select> : field.type === 'textarea' ? <textarea {...common} maxLength={field.maxLength} rows={3} />
                : <input {...common} type={field.type ?? 'text'} min={field.min} step={field.type === 'number' ? 1 : undefined} maxLength={field.maxLength} />}
              {field.source && !resources[field.source].length && <small>Add a {field.label.toLowerCase()} in Resources before assigning one.</small>}
              {unresolved && <small>The API provides only a team name. Choose a team to change it; otherwise the assignment is preserved.</small>}
            </div>
          })}
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="management-form-actions resource-editor-actions">
          <button className="management-cancel-button" type="button" onClick={close} disabled={isSaving}>Cancel</button>
          <button className="management-add-button" type="submit" disabled={isSaving}>
            {isSaving && <LoaderCircle size={15} className="management-spinner" />}{isSaving ? 'Saving...' : editing ? 'Save changes' : `Add ${definition.singular}`}
          </button>
        </div>
      </form>
    </div>
  </div>
}
