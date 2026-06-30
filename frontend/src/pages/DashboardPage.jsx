import { useQuery } from '@tanstack/react-query'
import { getEventTypes } from '../api/eventTypes.api'
import { getSubscriptions } from '../api/subscriptions.api'
import { useNotifications } from '../hooks/useNotifications'
import EventCard from '../components/EventCard'
import CreateEventTypeForm from '../components/CreateEventTypeForm'
import Layout from '../components/Layout'
import LiveConsole from '../components/LiveConsole'
import { Zap, Radio, Bell, AlertTriangle } from 'lucide-react'

export default function DashboardPage() {
  const { data: eventTypes = [], isLoading: etLoading, isError: etError } =
    useQuery({ queryKey: ['eventTypes'], queryFn: getEventTypes })

  const { data: subscriptions = [] } =
    useQuery({ queryKey: ['subscriptions'], queryFn: getSubscriptions })

  const { data: notifications = [] } = useNotifications()

  const subByEventTypeId = Object.fromEntries(
    subscriptions.map(s => [s.eventTypeId, s])
  )
  
  const failedCount = notifications.filter(n => n.status === 'failed').length

  const StatCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 hover:border-slate-700 transition-colors">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${colorClass}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <p className="text-2xl font-bold text-slate-100">{value}</p>
      </div>
    </div>
  )

  return (
    <Layout>
      <div className="space-y-8 pb-16">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Event Types" value={eventTypes.length} icon={Zap} colorClass="bg-gradient-to-tr from-indigo-600 to-indigo-400 shadow-indigo-500/20" />
          <StatCard title="Active Subscriptions" value={subscriptions.length} icon={Radio} colorClass="bg-gradient-to-tr from-emerald-600 to-emerald-400 shadow-emerald-500/20" />
          <StatCard title="Notifications Sent" value={notifications.length} icon={Bell} colorClass="bg-gradient-to-tr from-blue-600 to-blue-400 shadow-blue-500/20" />
          <StatCard title="Failed Dispatches" value={failedCount} icon={AlertTriangle} colorClass="bg-gradient-to-tr from-rose-600 to-rose-400 shadow-rose-500/20" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-200">Event Types</h2>
            </div>

            {etLoading && (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              </div>
            )}
            
            {etError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl p-4 text-sm text-center">
                Failed to load event types.
              </div>
            )}

            {!etLoading && !etError && eventTypes.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {eventTypes.map(et => (
                  <EventCard
                    key={et.id}
                    eventType={et}
                    subscription={subByEventTypeId[et.id] ?? null}
                  />
                ))}
              </div>
            )}

            {!etLoading && eventTypes.length === 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-medium text-slate-300">No event types yet</h3>
                <p className="text-slate-500 mt-1">Create one to get started with real-time notifications.</p>
              </div>
            )}

            <div className="pt-6 border-t border-slate-800">
              <CreateEventTypeForm />
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-200">System Activity</h2>
            <LiveConsole />
          </div>

        </div>
      </div>
    </Layout>
  )
}
