import { useState } from 'react'
import { useNotifications, useMarkRead, useMarkAllRead } from '../hooks/useNotifications'
import Layout from '../components/Layout'
import { Bell, Check, CheckCircle2, Clock, XCircle, RefreshCw, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function StatusBadge({ status }) {
  const styles = {
    sent:    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    failed:  'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    pending: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  }
  
  const icons = {
    sent: <CheckCircle2 className="w-3 h-3 mr-1" />,
    failed: <XCircle className="w-3 h-3 mr-1" />,
    pending: <Clock className="w-3 h-3 mr-1" />
  }

  return (
    <span className={`flex items-center text-xs px-2.5 py-1 rounded-full font-medium ${styles[status] ?? 'bg-slate-800 text-slate-400'}`}>
      {icons[status]}
      <span className="capitalize">{status}</span>
    </span>
  )
}

function PayloadDisplay({ payload }) {
  const [expanded, setExpanded] = useState(false)
  if (!payload || typeof payload !== 'object') return null
  const entries = Object.entries(payload)
  if (entries.length === 0) return null
  const visible = expanded ? entries : entries.slice(0, 3)
  const hasMore = entries.length > 3

  return (
    <div className="mt-3 bg-slate-950 rounded-lg p-3 text-xs font-mono border border-slate-800">
      <div className="space-y-1.5">
        {visible.map(([k, v]) => (
          <div key={k} className="flex gap-2 min-w-0">
            <span className="text-indigo-400 shrink-0">{k}:</span>
            <span className="text-slate-300 break-all">
              {typeof v === 'object' ? JSON.stringify(v) : String(v)}
            </span>
          </div>
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors mt-2 pt-2 border-t border-slate-800 w-full"
        >
          {expanded ? <><ChevronUp className="w-3 h-3"/> Show less</> : <><ChevronDown className="w-3 h-3"/> +{entries.length - 3} more fields</>}
        </button>
      )}
    </div>
  )
}

export default function NotificationsPage() {
  const { data: notifications = [], isLoading, isError, refetch } = useNotifications()
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()

  const sorted = [...notifications].sort(
    (a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0)
  )
  const unreadCount = sorted.filter(n => !n.readAt).length

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 pb-16">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              <Bell className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 flex items-center gap-3">
                Notification History
                {unreadCount > 0 && (
                  <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg shadow-rose-500/30">
                    {unreadCount} Unread
                  </span>
                )}
              </h1>
              <p className="text-sm text-slate-400 mt-1">Review alerts from your subscribed events.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-start sm:self-auto">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium disabled:opacity-50 transition-colors shadow-lg shadow-indigo-500/20"
              >
                <Check className="w-4 h-4" />
                {markAllRead.isPending ? 'Marking...' : 'Mark all read'}
              </button>
            )}
            <button 
              onClick={() => refetch()} 
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {isError && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 flex items-center gap-4">
            <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-rose-400">Failed to load history</h3>
              <p className="text-sm text-rose-400/70">Please try refreshing the page.</p>
            </div>
          </div>
        )}

        {!isLoading && !isError && sorted.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 flex flex-col items-center justify-center text-center shadow-xl">
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
              <Bell className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-200 mb-2">No notifications yet</h3>
            <p className="text-slate-400 max-w-sm">
              You haven't received any notifications. Subscribe to event types and trigger them to see history here.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {sorted.map(n => {
            const isUnread = !n.readAt
            return (
              <div
                key={n.id}
                className={`bg-slate-900 border rounded-2xl p-5 transition-all duration-300 shadow-xl ${
                  isUnread ? 'border-indigo-500/50 shadow-indigo-500/5' : 'border-slate-800 opacity-80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <span className="text-base font-bold text-slate-100">
                        {n.event?.eventType?.name ?? 'Unknown Event'}
                      </span>
                      <StatusBadge status={n.status} />
                      {isUnread && (
                        <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                          NEW
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-3">
                      <Clock className="w-3.5 h-3.5" />
                      Received {formatDate(n.createdAt)}
                      {n.readAt && (
                        <span className="text-slate-600 ml-2 border-l border-slate-700 pl-2">
                          Read {formatDate(n.readAt)}
                        </span>
                      )}
                    </p>

                    <PayloadDisplay payload={n.event?.payload} />
                  </div>
                  
                  {isUnread && (
                    <button
                      onClick={() => markRead.mutate(n.id)}
                      disabled={markRead.isPending}
                      className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium disabled:opacity-50 transition-colors border border-slate-700"
                    >
                      <Check className="w-4 h-4" />
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}
