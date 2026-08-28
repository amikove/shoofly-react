import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null)
  const [loading, setLoading] = useState(true)
  // `true` uniquement pendant qu'une ERREUR RÉSEAU au démarrage empêche de restaurer la
  // session : `loading` reste `true` (écran de chargement de marque) au lieu de rediriger
  // vers /login, et la reprise est automatique dès le retour du réseau. Un vrai 401 ne
  // met jamais ce drapeau — il efface la session comme avant.
  const [netRetrying, setNetRetrying] = useState(false)

  // Restaurer la session au démarrage
  useEffect(() => {
    const token = localStorage.getItem('shoofly_token')
    if (!token) { setLoading(false); return }

    let cancelled = false
    let retryTimer = null

    function teardownRetry() {
      window.removeEventListener('online', attemptRestore)
      if (retryTimer) { clearInterval(retryTimer); retryTimer = null }
    }

    // Réessaie dès que le navigateur repasse `online` (même motif que la réconciliation
    // de src/pages/oeil/Missions.jsx) ET toutes les 5 s — car en zone de couverture
    // faible `navigator.onLine` peut rester `true` sans qu'aucune requête n'aboutisse.
    function armRetry() {
      if (retryTimer) return
      window.addEventListener('online', attemptRestore)
      retryTimer = setInterval(attemptRestore, 5000)
    }

    function attemptRestore() {
      authAPI.me()
        .then(({ data }) => {
          if (cancelled) return
          setUser({ ...data.user, ...data.profile })
          setNetRetrying(false)
          setLoading(false)
          teardownRetry()
        })
        .catch((err) => {
          if (cancelled) return
          if (err.response?.status === 401) {
            // Token vraiment invalide/expiré : on nettoie et on arrête de réessayer.
            localStorage.removeItem('shoofly_token')
            localStorage.removeItem('shoofly_user')
            setNetRetrying(false)
            setLoading(false)
            teardownRetry()
          } else if (!err.response) {
            // Erreur réseau (coupure, DNS, timeout axios) : ne JAMAIS effacer la session.
            // On garde `loading` à true et on arme la reprise automatique.
            setNetRetrying(true)
            armRetry()
          } else {
            // Autre réponse serveur (5xx, 403…) : comportement historique inchangé.
            setLoading(false)
            teardownRetry()
          }
        })
    }

    attemptRestore()

    return () => {
      cancelled = true
      teardownRetry()
    }
  }, [])

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password })
    const mergedUser = { ...data.user, ...data.profile }
    localStorage.setItem('shoofly_token', data.token)
    localStorage.setItem('shoofly_user', JSON.stringify(mergedUser))
    setUser(mergedUser)
    return mergedUser
  }

  const logout = () => {
    localStorage.removeItem('shoofly_token')
    localStorage.removeItem('shoofly_user')
    setUser(null)
  }

const updateUser = (updates) => setUser((u) => ({ ...u, ...updates }))

  const hasPermission = (permission) => {
    if (!user || user.role !== 'admin') return false
    if (user.is_super_admin) return true
    return Array.isArray(user.permissions) && user.permissions.includes(permission)
  }

  const isSuperAdmin = user?.is_super_admin || false

  return (
    <AuthContext.Provider value={{ user, loading, netRetrying, login, logout, updateUser, hasPermission, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
