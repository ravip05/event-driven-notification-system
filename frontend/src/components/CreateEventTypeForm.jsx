import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createEventType } from '../api/eventTypes.api'
import { Plus } from 'lucide-react'

const DEFAULT_SCHEMA = `{
  "type": "object",
  "properties": {
    "message": { "type": "string" }
  },
  "required": ["message"]
}`

export default function CreateEventTypeForm() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [schemaRaw, setSchemaRaw] = useState(DEFAULT_SCHEMA)
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

  const create = useMutation({
    mutationFn: () => {
      const payloadSchema = parseSchema()
      if (!payloadSchema) return Promise.reject(new Error('Invalid schema'))
      return createEventType({ name: name.trim(), description: description.trim(), payloadSchema })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventTypes'] })
      setName('')
      setDescription('')
      setSchemaRaw(DEFAULT_SCHEMA)
      setOpen(false)
    },
  })

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-4 border-2 border-dashed border-slate-700 bg-slate-900/50 rounded-2xl text-slate-400 hover:border-indigo-500/50 hover:bg-indigo-500/5 hover:text-indigo-400 font-medium transition-all flex items-center justify-center gap-2 group"
      >
        <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
        New Event Type
      </button>
    )
  }

  return (
    <form
      onSubmit={e => { e.preventDefault(); create.mutate() }}
      className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl p-6 space-y-5 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500"></div>
      
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
          <Plus className="w-4 h-4 text-indigo-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-100">Create Event Type</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1.5">Name <span className="text-rose-500">*</span></label>
          <input
            type="text"
            placeholder="e.g. order.created"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1.5">Description</label>
          <input
            type="text"
            placeholder="What does this event represent?"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
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

      {create.isError && !schemaError && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl p-3 text-sm flex items-center gap-2">
          {create.error?.response?.data?.message ?? 'Failed to create event type'}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={create.isPending || !name.trim()}
          className="flex-1 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-semibold transition-colors shadow-lg shadow-indigo-500/20"
        >
          {create.isPending ? 'Creating...' : 'Create Event'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setSchemaError(null) }}
          className="flex-1 py-2.5 text-sm bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 hover:text-white font-semibold transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
