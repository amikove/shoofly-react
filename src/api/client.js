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

// SC-1 (audit scalabilité 2026-09-26) : sur une panne d'infrastructure pendant l'authentification
// (base/pool indisponible), le backend répond 503 + code AUTH_UNAVAILABLE au lieu de 401 — la
// requête n'a PAS été exécutée (refus avant la route), la rejouer est donc sûr quelle que soit la
// méthode. Rejeu automatique avec backoff exponentiel (+ gigue, pour ne pas resynchroniser tous
// les clients sur le même instant), puis rejet normal : la session n'est JAMAIS effacée sur 503.
// Limité à ce code précis : un autre 503 (proxy, route) ne garantit pas la non-exécution.
export const AUTH_UNAVAILABLE_MAX_RETRIES = 3
export function authUnavailableDelayMs(attempt, retryAfterSeconds, random = Math.random) {
  const base = Math.max(1, Number(retryAfterSeconds) || 2) * 1000
  return base * 2 ** attempt + Math.floor(random() * 1000)
}

// Gérer les erreurs globalement
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const cfg = err.config
    if (err.response?.status === 503 && err.response.data?.code === 'AUTH_UNAVAILABLE' && cfg) {
      const attempt = cfg.__authUnavailableRetries || 0
      if (attempt < AUTH_UNAVAILABLE_MAX_RETRIES) {
        cfg.__authUnavailableRetries = attempt + 1
        await new Promise((r) => setTimeout(r, authUnavailableDelayMs(attempt, err.response.data.retry_after)))
        return api(cfg)
      }
      return Promise.reject(err)
    }
    // Compte bloqué (is_active=false) — chantier L4. Le middleware renvoie 403 + un champ
    // `deactivation_context` sur toute route hors whitelist de recours (jamais 401, sinon le
    // bloc ci-dessous effacerait la session). Ce cas n'arrive que si le compte est bloqué EN
    // COURS de session : on le pose sur l'écran de contestation sans toucher au token (il en a
    // besoin pour y accéder). `deactivation_context` peut valoir null → tester la présence de
    // la clé, pas sa valeur.
    if (err.response?.status === 403
        && err.response.data && 'deactivation_context' in err.response.data
        && !window.location.pathname.startsWith('/compte-bloque')
        && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/compte-bloque'
      return Promise.reject(err)
    }
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
