import client from './client'

export const getSubscriptions = () => client.get('/subscriptions').then(r => r.data)
export const createSubscription = (eventTypeId) =>
  client.post('/subscriptions', { eventTypeId }).then(r => r.data)
export const deleteSubscription = (id) => client.delete(`/subscriptions/${id}`)
