import { useState, useEffect, useRef } from 'react'
import { Terminal, Trash2 } from 'lucide-react'
import { useSocket } from '../hooks/useSocket'

export default function LiveConsole() {
  const { socket, connected } = useSocket()
  const [logs, setLogs] = useState([])
  const endRef = useRef(null)

  useEffect(() => {
    if (!socket) return
    const handler = (msg) => {
      setLogs((prev) => [...prev.slice(-99), { id: Date.now() + Math.random(), text: msg }])
    }
    socket.on('system:log', handler)
    return () => socket.off('system:log', handler)
  }, [socket])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <div className="bg-[#0c0f1a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[300px]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-300 tracking-wider uppercase">Live Worker Console</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
            <span className="text-[10px] text-slate-500 font-medium">{connected ? 'STREAMING' : 'DISCONNECTED'}</span>
          </div>
          <button 
            onClick={() => setLogs([])} 
            className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
            title="Clear Console"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs bg-transparent scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 opacity-50">
            <Terminal className="w-8 h-8" />
            <p>Awaiting background jobs...</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {logs.map((log) => (
              <div key={log.id} className="text-slate-300 break-all">
                <span className="text-slate-600 mr-2">[{new Date().toLocaleTimeString([], {hour12: false})}]</span>
                {log.text.includes('❌') || log.text.includes('⚠️') ? (
                  <span className="text-rose-400">{log.text}</span>
                ) : log.text.includes('✅') || log.text.includes('Sent') ? (
                  <span className="text-emerald-400">{log.text}</span>
                ) : (
                  <span>{log.text}</span>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>
        )}
      </div>
    </div>
  )
}
