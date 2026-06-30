import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEventTypes, triggerEventType, deleteEventType } from '../api/eventTypes.api'
import { getSubscriptions } from '../api/subscriptions.api'
import SubscriptionToggle from '../components/SubscriptionToggle'
import SchemaForm from '../components/SchemaForm'
import EditEventTypeForm from '../components/EditEventTypeForm'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, Edit3, Trash2, Code2, Zap, PlayCircle, AlertTriangle } from 'lucide-react'

export default function EventTypePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [triggerResult, setTriggerResult] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [simulateFailure, setSimulateFailure] = useState(false)

  const { data: eventTypes = [], isLoading } = useQuery({
    queryKey: ['eventTypes'],
    queryFn: getEventTypes,
  })
  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: getSubscriptions,
  })

  const eventType = eventTypes.find(et => String(et.id) === String(id))
  const subscription = subscriptions.find(s => String(s.eventTypeId) === String(id)) ?? null
  const isOwner = user?.id != null && String(eventType?.createdById) === String(user.id)

  const trigger = useMutation({
    mutationFn: (payload) => triggerEventType(id, payload, simulateFailure),
    onSuccess: (data) => {
      setTriggerResult({ ok: true, message: data?.message ?? 'Event triggered successfully.' })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (err) => {
      setTriggerResult({ ok: false, message: err?.message ?? 'Trigger failed.' })
    },
  })


  const remove = useMutation({
    mutationFn: () => deleteEventType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventTypes'] })
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      navigate('/dashboard')
    },
  })

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      </Layout>
    )
  }

  if (!eventType) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-slate-400 font-medium text-lg">Event type not found.</p>
          <Link to="/dashboard" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6 pb-16 max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-medium">
          <Link to="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-indigo-400 truncate">{eventType.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column: Details & Trigger */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-[0.02] pointer-events-none">
                <Zap className="w-48 h-48" />
              </div>
              
              {editMode ? (
                <EditEventTypeForm eventType={eventType} onCancel={() => setEditMode(false)} />
              ) : (
                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                          <Zap className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-slate-100">{eventType.name}</h2>
                          <p className="text-xs font-mono text-slate-500 mt-0.5">ID: {eventType.id}</p>
                        </div>
                      </div>
                      {eventType.description && (
                        <p className="text-sm text-slate-400 mt-4 leading-relaxed max-w-lg">{eventType.description}</p>
                      )}
                    </div>
                    
                    <div className="shrink-0 bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <SubscriptionToggle eventTypeId={eventType.id} subscription={subscription} />
                    </div>
                  </div>

                  {/* Owner-only actions */}
                  {isOwner && (
                    <div className="mt-8 pt-6 border-t border-slate-800 flex items-center gap-3">
                      <button
                        onClick={() => setEditMode(true)}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 font-medium transition-colors"
                      >
                        <Edit3 className="w-4 h-4" /> Edit Details
                      </button>
                      
                      {confirmDelete ? (
                        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                          <span className="text-sm text-rose-500 font-medium px-2">Delete this event type?</span>
                          <button
                            onClick={() => remove.mutate()}
                            disabled={remove.isPending}
                            className="px-3 py-1.5 text-sm rounded bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 font-medium transition-colors"
                          >
                            {remove.isPending ? 'Deleting...' : 'Yes, Delete'}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(false)}
                            className="px-3 py-1.5 text-sm rounded bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(true)}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-medium transition-colors ml-auto"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Trigger Event Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
                <PlayCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-slate-200">Trigger Event</h3>
              </div>
              
              <div className="mb-6 bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-rose-500 focus:ring-rose-500/30 focus:ring-offset-slate-900 transition-all cursor-pointer"
                      checked={simulateFailure}
                      onChange={(e) => setSimulateFailure(e.target.checked)}
                    />
                    <span className="text-sm font-semibold text-rose-400 group-hover:text-rose-300 transition-colors">Simulate Worker Failure</span>
                  </label>
                  <p className="text-xs text-rose-400/70 mt-1">
                    When checked, the backend worker will artificially throw an error on the first 2 attempts, demonstrating the BullMQ exponential backoff and retry mechanism in the Live Console.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                <SchemaForm
                  schema={eventType.payloadSchema}
                  onSubmit={(payload) => { setTriggerResult(null); trigger.mutate(payload) }}
                  isPending={trigger.isPending}
                  result={triggerResult}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Schema Details */}
          <div className="space-y-6 sticky top-24">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-[500px]">
              <div className="flex items-center gap-2 mb-4">
                <Code2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-slate-200">Payload Schema</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                This schema defines the exact structure of the payload required to trigger this event. Any missing or malformed fields will be rejected by the API.
              </p>
              
              <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-4 overflow-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {eventType.payloadSchema ? (
                  <pre className="text-xs font-mono text-indigo-300">
                    {JSON.stringify(eventType.payloadSchema, null, 2)}
                  </pre>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-600 text-sm italic">
                    No schema defined.
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </Layout>
  )
}
