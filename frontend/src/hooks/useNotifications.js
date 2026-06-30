import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../api/notifications.api'
import { useSocket } from './useSocket'

export function useNotifications() {
  const queryClient = useQueryClient()
  const { socket } = useSocket()

  useEffect(() => {
    if (!socket) return
    const handler = () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
    socket.on('notification:new', handler)
    return () => socket.off('notification:new', handler)
  }, [socket, queryClient])

  return useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    refetchInterval: 15000,
  })
}

export function useMarkRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useMarkAllRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })
}
