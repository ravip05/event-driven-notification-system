import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateEventType } from '../api/eventTypes.api'
import { Edit3 } from 'lucide-react'

export default function EditEventTypeForm({ eventType, onCancel }) {
  const [name, setName] = useState(eventType.name)
  const [description, setDescription] = useState(eventType.description ?? '')
  const [schemaRaw, setSchemaRaw] = useState(
    JSON.stringify(eventType.payloadSchema ?? {}, null, 2)
  )
  const [schemaError, setSchemaError] = useState(null)
  const queryClient = useQueryClient()

  function parseSchema() {
    try {
      const parsed = JSON.parse(schemaRaw)
      setSchemaError(null)
      return parsed
    } catch {
      setSchemaError('Invalid JSON — fix the schema before saving')
      return null
    }
  }

  const update = useMutation({
    mutationFn: () => {
      const payloadSchema = parseSchema()
      if (!payloadSchema) return Promise.reject(new Error('Invalid schema'))
      return updateEventType(eventType.id, {
        name: name.trim(),
        description: description.trim(),
        payloadSchema,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventTypes'] })
      onCancel()
    },
  })

  return (
    <form
      onSubmit={e => { e.preventDefault(); update.mutate() }}
      className="space-y-5 relative z-10"
    >
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
          <Edit3 className="w-4 h-4 text-indigo-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-100">Edit Event Type</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1.5">
            Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1.5">Description</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1.5 flex items-baseline justify-between">
            <span>Payload Schema <span className="text-rose-500">*</span></span>
            <span className="text-xs text-slate-500 font-normal">JSON Schema</span>
          </label>
          <textarea
            rows={7}
            value={schemaRaw}
            onChange={e => { setSchemaRaw(e.target.value); setSchemaError(null) }}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-indigo-300 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-y scrollbar-thin scrollbar-thumb-slate-700"
          />
          {schemaError && <p className="text-xs text-rose-500 mt-2 flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-rose-500"></span> {schemaError}</p>}
        </div>
      </div>

      {update.isError && !schemaError && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl p-3 text-sm flex items-center gap-2 mt-4">
          {update.error?.message ?? 'Failed to update event type'}
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-slate-800 mt-6">
        <button
          type="submit"
          disabled={update.isPending || !name.trim()}
          className="px-6 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-semibold transition-colors shadow-lg shadow-indigo-500/20"
        >
          {update.isPending ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 text-sm bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 hover:text-white font-semibold transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
