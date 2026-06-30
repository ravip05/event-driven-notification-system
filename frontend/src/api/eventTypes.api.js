import client from './client'

export const getEventTypes = () => client.get('/event-types').then(r => r.data)
export const createEventType = (data) => client.post('/event-types', data).then(r => r.data)
export const updateEventType = (id, data) => client.put(`/event-types/${id}`, data).then(r => r.data)
export const deleteEventType = (id) => client.delete(`/event-types/${id}`)
export const triggerEventType = (id, payload, simulateFailure = false) =>
  client.post(`/event-types/${id}/trigger`, { payload, simulateFailure }).then(r => r.data)
