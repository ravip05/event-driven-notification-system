import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getSubscriptions } from '../api/subscriptions.api'
import SubscriptionToggle from '../components/SubscriptionToggle'
import Layout from '../components/Layout'
import { Radio } from 'lucide-react'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function SubscriptionsPage() {
  const { data: subscriptions = [], isLoading, isError } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: getSubscriptions,
  })

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-4 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Radio className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">My Subscriptions</h1>
              <p className="text-xs text-slate-500">{subscriptions.length} active</p>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        )}

        {isError && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl p-4 text-sm text-center">
            Failed to load subscriptions. Please try again.
          </div>
        )}

        {!isLoading && !isError && subscriptions.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Radio className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-300">No subscriptions yet</h3>
            <p className="text-slate-500 mt-1 text-sm">
              Visit the{' '}
              <Link to="/dashboard" className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors">
                Dashboard
              </Link>{' '}
              to subscribe to event types.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {subscriptions.map(sub => (
            <div
              key={sub.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-slate-700 transition-colors group"
            >
              <div className="min-w-0 flex-1">
                <Link
                  to={`/event-types/${sub.eventTypeId}`}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline text-sm truncate block transition-colors"
                >
                  {sub.eventType?.name ?? 'Unknown event type'}
                </Link>
                {sub.eventType?.description && (
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {sub.eventType.description}
                  </p>
                )}
                <p className="text-xs text-slate-600 mt-1">
                  Subscribed {formatDate(sub.createdAt)}
                </p>
              </div>
              <SubscriptionToggle eventTypeId={sub.eventTypeId} subscription={sub} />
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

