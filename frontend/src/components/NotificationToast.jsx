import { useEffect, useState, useCallback } from 'react'
import { useSocket } from '../hooks/useSocket'
import { X, Bell } from 'lucide-react'

let _nextId = 0

function PayloadRows({ payload }) {
  if (!payload || typeof payload !== 'object') return null
  const entries = Object.entries(payload)
  if (entries.length === 0) return null
  return (
    <div className="mt-1 text-xs text-slate-400 space-y-1 font-mono">
      {entries.slice(0, 3).map(([k, v]) => (
        <div key={k} className="flex gap-1.5 min-w-0">
          <span className="font-medium text-slate-300 shrink-0">{k}:</span>
          <span className="truncate">
            {typeof v === 'object' ? JSON.stringify(v) : String(v)}
          </span>
        </div>
      ))}
      {entries.length > 3 && (
        <span className="text-slate-500">+{entries.length - 3} more</span>
      )}
    </div>
  )
}

export default function NotificationToast() {
  const { socket } = useSocket()
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t._key !== id))
  }, [])

  useEffect(() => {
    if (!socket) return
    const handler = (notification) => {
      const key = _nextId++
      setToasts((prev) => [...prev, { ...notification, _key: key }])
      setTimeout(() => dismiss(key), 8000)
    }
    socket.on('notification:new', handler)
    return () => socket.off('notification:new', handler)
  }, [socket, dismiss])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <div
          key={t._key}
          className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-4 pr-12 w-80 relative animate-in slide-in-from-bottom-5 fade-in duration-300"
        >
          <button
            onClick={() => dismiss(t._key)}
            className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Bell className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-slate-200 truncate">
                {t.eventType?.name ?? t.event?.eventType?.name ?? 'New Notification'}
              </h4>
              <PayloadRows payload={t.event?.payload} />
              <p className="mt-2 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Just now
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

