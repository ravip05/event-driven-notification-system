import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Unwrap the axios response so callers get res.data (the HTTP body) directly.
// All API files then do .then(r => r.data) to unwrap the { data: ... } envelope.
client.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      // Stale or invalid token — wipe it so the user is redirected to login
      localStorage.removeItem('token')
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login'
      }
    }
    // Re-throw with the server's error message attached for catch blocks
    const serverMessage = err.response?.data?.error?.message ?? err.response?.data?.message
    if (serverMessage) err.message = serverMessage
    return Promise.reject(err)
  }
)

export default client
