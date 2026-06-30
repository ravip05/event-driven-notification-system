import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteEventType } from '../api/eventTypes.api'
import { useAuth } from '../context/AuthContext'
import SubscriptionToggle from './SubscriptionToggle'
import { Zap, Trash2, ArrowRight } from 'lucide-react'

export default function EventCard({ eventType, subscription }) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isOwner = user?.id != null && String(eventType.createdById) === String(user.id)

  const remove = useMutation({
    mutationFn: () => deleteEventType(eventType.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventTypes'] })
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
    },
  })

  return (
    <div className="group bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 relative overflow-hidden">
      <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] group-hover:opacity-10 group-hover:scale-110 transition-all duration-500 pointer-events-none">
        <Zap className="w-32 h-32 text-indigo-400" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center shrink-0 shadow-inner">
            <Zap className="w-5 h-5 text-indigo-400" />
          </div>
          {isOwner && (
            confirmDelete ? (
              <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                <span className="text-xs text-rose-500 font-medium px-1">Sure?</span>
                <button
                  onClick={() => remove.mutate()}
                  disabled={remove.isPending}
                  className="px-2 py-1 text-xs rounded bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 font-medium transition-colors"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1 text-xs rounded bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium transition-colors"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Delete Event Type"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )
          )}
        </div>
        
        <Link to={`/event-types/${eventType.id}`} className="block group-hover:text-indigo-400 transition-colors">
          <h3 className="text-lg font-semibold text-slate-200 mb-1">{eventType.name}</h3>
        </Link>
        <p className="text-sm text-slate-400 line-clamp-2 mb-6">
          {eventType.description || 'No description provided.'}
        </p>
      </div>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-800 relative z-10">
        <SubscriptionToggle eventTypeId={eventType.id} subscription={subscription} />
        <Link
          to={`/event-types/${eventType.id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 font-medium transition-colors"
        >
          Open <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}
