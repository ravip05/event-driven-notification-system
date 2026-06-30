import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'

// Module-level singleton so all consumers share one connection.
let _socket = null

export function getSocket() {
  return _socket
}

export function useSocket() {
  const { token } = useAuth()
  const [connected, setConnected] = useState(() => !!(_socket?.connected))

  useEffect(() => {
    if (!token) {
      if (_socket) {
        _socket.disconnect()
        _socket = null
        setConnected(false)
      }
      return
    }

    if (!_socket) {
      _socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
        auth: { token },
        transports: ['websocket'],
      })
    }

    const socket = _socket
    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    if (socket.connected) setConnected(true)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, [token])

  return { connected, socket: _socket }
}
