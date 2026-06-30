import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../hooks/useSocket'
import { useNotifications } from '../hooks/useNotifications'
import { Bell, LayoutDashboard, Radio, LogOut, Activity } from 'lucide-react'

export default function Layout({ children }) {
  const { logout, user } = useAuth()
  const { connected } = useSocket()
  const { data: notifications = [] } = useNotifications()
  const unreadCount = notifications.filter(n => !n.readAt).length
  const { pathname } = useLocation()

  const navLinkClass = (to) =>
    `flex items-center gap-2 text-sm font-medium transition-all px-3 py-2 rounded-lg ${
      pathname.startsWith(to) 
        ? 'bg-indigo-500/10 text-indigo-400' 
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
    }`

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">NotifyHub</span>
            </Link>

            <nav className="flex items-center gap-1 flex-wrap">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 mr-4">
                <span className="relative flex h-2.5 w-2.5">
                  {connected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${connected ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{connected ? 'Connected' : 'Offline'}</span>
              </div>

              <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <Link to="/subscriptions" className={navLinkClass('/subscriptions')}>
                <Radio className="w-4 h-4" />
                <span className="hidden sm:inline">Subscriptions</span>
              </Link>

              <Link
                to="/notifications"
                className={`relative flex items-center gap-2 text-sm font-medium transition-all px-3 py-2 rounded-lg ${
                  pathname.startsWith('/notifications') ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">History</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center shadow-lg shadow-rose-500/30">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
              
              <div className="h-6 w-px bg-slate-800 mx-2 hidden sm:block"></div>

              {user?.name && (
                <div className="hidden sm:flex items-center gap-2 px-2">
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
              <button onClick={logout} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors ml-1" title="Log out">
                <LogOut className="w-4 h-4" />
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
