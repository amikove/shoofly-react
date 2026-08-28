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

// Une seule redirection même si plusieurs requêtes 401 arrivent en rafale (un dashboard
// fait un Promise.all de 3-4 appels).
let redirectingOn401 = false

// Gérer les erreurs globalement
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('shoofly_token')
      localStorage.removeItem('shoofly_user')
      // Ne pas recharger si on est déjà sur l'écran de connexion : un 401 de fond ne doit
      // pas effacer une saisie d'identifiants en cours.
      if (!redirectingOn401 && !window.location.pathname.startsWith('/login')) {
        redirectingOn401 = true
        // Drapeau consommé une fois par Login.jsx pour afficher un message « session
        // expirée » distinct d'une erreur d'identifiants (hors URL — tab-scoped).
        try { sessionStorage.setItem('shoofly_session_expired', '1') } catch { /* mode privé */ }
        // Rechargement complet volontaire : remet à zéro proprement une session morte
        // (socket.io, sondages de fond, état React stale).
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
