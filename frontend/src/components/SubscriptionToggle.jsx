import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createSubscription, deleteSubscription } from '../api/subscriptions.api'

export default function SubscriptionToggle({ eventTypeId, subscription }) {
  const queryClient = useQueryClient()

  const subscribe = useMutation({
    mutationFn: () => createSubscription(eventTypeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptions'] }),
  })

  const unsubscribe = useMutation({
    mutationFn: () => deleteSubscription(subscription.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptions'] }),
  })

  if (subscription) {
    return (
      <button
        onClick={() => unsubscribe.mutate()}
        disabled={unsubscribe.isPending}
        className="px-3 py-1.5 text-sm font-medium rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 disabled:opacity-50 transition-colors"
      >
        {unsubscribe.isPending ? 'Unsubscribing…' : 'Unsubscribe'}
      </button>
    )
  }

  return (
    <button
      onClick={() => subscribe.mutate()}
      disabled={subscribe.isPending}
      className="px-3 py-1.5 text-sm font-medium rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
    >
      {subscribe.isPending ? 'Subscribing…' : 'Subscribe'}
    </button>
  )
}

