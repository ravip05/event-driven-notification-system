import { useState } from 'react'

function FieldInput({ fieldKey, schemaDef, value, onChange, isRequired }) {
  const { type, enum: enumVals, description } = schemaDef ?? {}

  const label = (
    <label className="block text-sm font-semibold text-slate-300 mb-1.5">
      {fieldKey}
      {isRequired && <span className="text-rose-500 ml-1">*</span>}
      {description && <span className="text-slate-500 font-normal ml-2">— {description}</span>}
    </label>
  )

  const inputClass = "w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"

  if (enumVals && Array.isArray(enumVals)) {
    return (
      <div>
        {label}
        <select
          value={value ?? ''}
          onChange={e => onChange(fieldKey, e.target.value)}
          required={isRequired}
          className={inputClass}
        >
          <option value="">Select…</option>
          {enumVals.map(v => (
            <option key={String(v)} value={String(v)}>{String(v)}</option>
          ))}
        </select>
      </div>
    )
  }

  if (type === 'boolean') {
    return (
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id={`schema-field-${fieldKey}`}
          checked={!!value}
          onChange={e => onChange(fieldKey, e.target.checked)}
          className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500/30 focus:ring-offset-slate-900 transition-all cursor-pointer"
        />
        <label htmlFor={`schema-field-${fieldKey}`} className="text-sm font-semibold text-slate-300 cursor-pointer">
          {fieldKey}
          {isRequired && <span className="text-rose-500 ml-1">*</span>}
        </label>
      </div>
    )
  }

  if (type === 'number' || type === 'integer') {
    return (
      <div>
        {label}
        <input
          type="number"
          value={value ?? ''}
          onChange={e => onChange(fieldKey, e.target.value)}
          required={isRequired}
          step={type === 'integer' ? 1 : 'any'}
          className={inputClass}
        />
      </div>
    )
  }

  if (type === 'string') {
    return (
      <div>
        {label}
        <input
          type="text"
          value={value ?? ''}
          onChange={e => onChange(fieldKey, e.target.value)}
          required={isRequired}
          className={inputClass}
        />
      </div>
    )
  }

  // Nested object, array, or unknown → JSON textarea
  return (
    <div>
      {label}
      <textarea
        rows={3}
        value={value ?? ''}
        onChange={e => onChange(fieldKey, e.target.value)}
        placeholder="JSON value"
        className={`${inputClass} font-mono text-xs resize-y scrollbar-thin scrollbar-thumb-slate-700 text-indigo-300`}
      />
    </div>
  )
}

function coerceField(val, def) {
  const { type } = def ?? {}
  if (val === undefined || val === '') return undefined
  if (type === 'number' || type === 'integer') return Number(val)
  if (type === 'boolean') return Boolean(val)
  if (type === 'object' || type === 'array') {
    try { return JSON.parse(val) } catch { return val }
  }
  return val
}

export default function SchemaForm({ schema, onSubmit, isPending, result }) {
  const isObjectSchema = Boolean(
    schema &&
    typeof schema === 'object' &&
    schema.type === 'object' &&
    schema.properties &&
    Object.keys(schema.properties).length > 0
  )

  const [rawMode, setRawMode] = useState(!isObjectSchema)
  const [rawValue, setRawValue] = useState('')
  const [rawError, setRawError] = useState(null)
  const [fields, setFields] = useState({})

  const required = new Set(isObjectSchema && Array.isArray(schema.required) ? schema.required : [])

  function handleFieldChange(key, value) {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (rawMode || !isObjectSchema) {
      if (!rawValue.trim()) { onSubmit({}); return }
      try {
        setRawError(null)
        onSubmit(JSON.parse(rawValue))
      } catch {
        setRawError('Not valid JSON')
      }
      return
    }
    const payload = {}
    for (const [key, def] of Object.entries(schema.properties)) {
      const coerced = coerceField(fields[key], def)
      if (coerced !== undefined) payload[key] = coerced
    }
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isObjectSchema && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setRawMode(m => !m)}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
          >
            {rawMode ? 'Use form' : 'Raw JSON'}
          </button>
        </div>
      )}

      {(!isObjectSchema || rawMode) ? (
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1.5">
            Payload (JSON — leave empty for <code>{'{}'}</code>)
          </label>
          <textarea
            rows={5}
            value={rawValue}
            onChange={e => { setRawValue(e.target.value); setRawError(null) }}
            placeholder={'{\n  "key": "value"\n}'}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-indigo-300 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-y scrollbar-thin scrollbar-thumb-slate-700"
          />
          {rawError && <p className="text-xs text-rose-500 mt-2 flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-rose-500"></span> {rawError}</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(schema.properties).map(([key, def]) => (
            <FieldInput
              key={key}
              fieldKey={key}
              schemaDef={def}
              value={fields[key]}
              onChange={handleFieldChange}
              isRequired={required.has(key)}
            />
          ))}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-500/20"
      >
        {isPending ? 'Triggering...' : 'Trigger'}
      </button>

      {result && (
        <div className={`mt-3 p-3 rounded-xl border text-sm flex items-center gap-2 ${result.ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
          {result.message}
        </div>
      )}
    </form>
  )
}
