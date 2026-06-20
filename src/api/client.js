import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 15000,
})

// Injecter le token JWT automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('shoofly_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Gérer les erreurs globalement
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('shoofly_token')
      localStorage.removeItem('shoofly_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
